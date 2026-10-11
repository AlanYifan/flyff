/**
 * @file useWindAccumulation.js
 * @description 风之积累被动技能组合式函数
 * 提供风之积累（J技能）及其EX被动技能的风之值计数、触发判定、附加伤害计算
 *
 * 业务意图：
 * - 风之积累（J技能）：每次普通攻击或释放技能增加1点风之值，最高10点
 *   达到触发阈值（10次）时，附加攻击力百分比的额外风属性伤害，然后重置风之值
 *   附加伤害百分比随J技能熟练度等级提升（1级10%，每级+10%，10级100%）
 *   每次普通攻击消耗30点MP
 * - 风之积累EX1-减少触发次数（J_EX1技能）：1级满级，触发阈值从10减少至5
 * - 风之积累EX2-倍攻（J_EX2技能）：1级满级，在EX1触发次数阈值时概率触发倍攻
 *   依赖EX1：需先解锁风之积累EX1，触发次数基于EX1的攻击次数（5次）
 *   30%概率附加200%攻击力的风属性伤害
 *   20%概率附加300%攻击力的风属性伤害
 *   10%概率附加400%攻击力的风属性伤害
 *   概率为逐级包含关系：30%包含20%和10%，未触发倍攻时回退至基础附加伤害
 *
 * 风之值存储方式：
 * - 使用 Vue ref 维护风之值计数器，支持响应式 UI 更新
 * - 计数器仅在内存中，不持久化（重载后从0开始计数）
 *
 * 创建时间：2026-08-03
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 风之积累基础触发阈值（10次普通攻击/技能释放触发）
 */
export const WIND_ACCUMULATION_BASE_TRIGGER_COUNT = 10

/**
 * 风之积累最大熟练度等级
 */
export const WIND_ACCUMULATION_MAX_LEVEL = 10

/**
 * 风之积累EX1固定触发次数减少百分比（50%）
 */
export const WIND_ACCUMULATION_EX1_TRIGGER_REDUCTION = 50

/**
 * 风之积累EX2倍攻触发概率配置
 * EX2依赖EX1：需先解锁风之积累EX1，在EX1触发次数阈值（5次）时触发概率倍攻
 * chance1: 30%概率附加200%攻击力的风属性伤害
 * chance2: 20%概率附加300%攻击力的风属性伤害
 * chance3: 10%概率附加400%攻击力的风属性伤害
 * 概率为逐级包含关系：30%包含20%和10%，未触发倍攻时回退至基础附加伤害
 */
export const WIND_ACCUMULATION_EX2_MULTI_ATTACK = Object.freeze({
  chance1: 30,
  bonus1: 200,
  chance2: 20,
  bonus2: 300,
  chance3: 10,
  bonus3: 400
})

/**
 * 风之积累每次攻击MP消耗（固定30点）
 */
export const WIND_ACCUMULATION_MP_COST_PER_ATTACK = 30

/**
 * 模块级风之值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const windValue = ref(0)

/**
 * 响应式触发标记，触发附加伤害时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const triggerFlash = ref(false)

/**
 * 获取当前风之值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 风之值的响应式引用
 */
export function useWindValue () {
  return windValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useWindTriggerFlash () {
  return triggerFlash
}

/**
 * 获取当前风之值的非响应式值
 * @returns {number} 当前风之值（0~触发阈值）
 */
export function getWindAccumulationValue () {
  return windValue.value
}

/**
 * 检查风之积累（J技能）是否已解锁
 * 仅当玩家为风暴行者且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isWindAccumulationUnlocked (player) {
  if (!player || player.class !== 'storm_walker') {
    return false
  }
  return isSkillUnlocked(player, 'storm_walker', 'J')
}

/**
 * 检查风之积累EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isWindAccumulationEx1Unlocked (player) {
  if (!player || player.class !== 'storm_walker') {
    return false
  }
  return isSkillUnlocked(player, 'storm_walker', 'J_EX1')
}

/**
 * 检查风之积累EX2-倍攻（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isWindAccumulationEx2Unlocked (player) {
  if (!player || player.class !== 'storm_walker') {
    return false
  }
  return isSkillUnlocked(player, 'storm_walker', 'J_EX2')
}

/**
 * 获取风之积累的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getWindAccumulationTriggerCount (player) {
  let triggerCount = WIND_ACCUMULATION_BASE_TRIGGER_COUNT

  if (isWindAccumulationEx1Unlocked(player)) {
    const playerSkill = player.skills?.J_EX1
    if (playerSkill) {
      const skillLevel = Number(
        playerSkill.proficiencyLevel ??
        (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
          ? playerSkill.proficiency.level
          : undefined) ??
        playerSkill.level ?? 0
      )
      if (skillLevel >= 1) {
        const staticSkill = getSkill('storm_walker', 'J_EX1')
        let reduction = WIND_ACCUMULATION_EX1_TRIGGER_REDUCTION
        if (staticSkill && typeof staticSkill.getTriggerReduction === 'function') {
          reduction = staticSkill.getTriggerReduction(skillLevel)
        }
        triggerCount = Math.max(1, Math.floor(triggerCount * (1 - reduction / 100)))
      }
    }
  }

  return triggerCount
}

/**
 * 获取风之积累技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getWindAccumulationSkillLevel (player) {
  if (!player || !player.skills) {
    return 0
  }
  const playerSkill = player.skills.J
  if (!playerSkill) {
    return 0
  }
  return Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
}

/**
 * 获取风之积累基础附加伤害百分比（无EX2时的基础效果）
 * 1级10%，每级+10%，10级100%
 * @param {Object} player - 玩家对象
 * @returns {number} 附加伤害百分比（0~100）
 */
export function getWindAccumulationDamageBonus (player) {
  if (!isWindAccumulationUnlocked(player)) {
    return 0
  }
  const skillLevel = getWindAccumulationSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('storm_walker', 'J')
  if (staticSkill && typeof staticSkill.getDamageBonusPercent === 'function') {
    return staticSkill.getDamageBonusPercent(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, WIND_ACCUMULATION_MAX_LEVEL)
  return 10 * safeLevel
}

/**
 * 获取风之积累EX2倍攻触发信息
 * 仅当EX2已解锁且EX1已解锁时返回有效数据
 * EX2依赖EX1的攻击次数阈值，因此EX1必须先解锁
 * 每次调用随机滚动倍攻档位
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻触发信息
 *   - unlocked: EX2是否已解锁（含EX1前置检查）
 *   - bonusPercent: 本次触发的附加伤害百分比（0表示未触发倍攻，回退至基础附加伤害）
 *   - chance1/bonus1/chance2/bonus2/chance3/bonus3: 各档概率与加成
 */
export function getWindAccumulationMultiAttackInfo (player) {
  const defaultConfig = {
    chance1: WIND_ACCUMULATION_EX2_MULTI_ATTACK.chance1,
    bonus1: WIND_ACCUMULATION_EX2_MULTI_ATTACK.bonus1,
    chance2: WIND_ACCUMULATION_EX2_MULTI_ATTACK.chance2,
    bonus2: WIND_ACCUMULATION_EX2_MULTI_ATTACK.bonus2,
    chance3: WIND_ACCUMULATION_EX2_MULTI_ATTACK.chance3,
    bonus3: WIND_ACCUMULATION_EX2_MULTI_ATTACK.bonus3
  }

  const result = {
    unlocked: false,
    bonusPercent: 0,
    ...defaultConfig
  }

  // EX2依赖EX1的攻击次数阈值，必须同时解锁EX1和EX2
  if (!isWindAccumulationEx2Unlocked(player) || !isWindAccumulationEx1Unlocked(player)) {
    return result
  }

  const playerSkill = player.skills?.J_EX2
  if (!playerSkill) {
    return result
  }

  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  // 获取静态技能对象的概率配置
  const staticSkill = getSkill('storm_walker', 'J_EX2')
  let chances = defaultConfig
  if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
    chances = staticSkill.getMultiAttackChance(skillLevel)
  }
  result.chance1 = chances.chance1
  result.bonus1 = chances.bonus1
  result.chance2 = chances.chance2
  result.bonus2 = chances.bonus2
  result.chance3 = chances.chance3
  result.bonus3 = chances.bonus3

  // 随机滚动倍攻档位
  // 概率为逐级包含关系：先滚3档（10%），再滚2档（25%），再滚1档（50%）
  // 未命中任何档位时回退至基础附加伤害
  const roll = Math.random() * 100
  if (roll < chances.chance3) {
    result.bonusPercent = chances.bonus3
  } else if (roll < chances.chance2) {
    result.bonusPercent = chances.bonus2
  } else if (roll < chances.chance1) {
    result.bonusPercent = chances.bonus1
  } else {
    result.bonusPercent = 0
  }

  return result
}

/**
 * 获取风之积累每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getWindAccumulationMpCost (player) {
  if (!isWindAccumulationUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('storm_walker', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return WIND_ACCUMULATION_MP_COST_PER_ATTACK
}

/**
 * 普通攻击或释放技能后处理风之积累风之值逻辑
 * 1. 消耗MP（30点，技能释放可跳过），若MP不足则不增加风之值
 * 2. 增加风之值（+1）
 * 3. 若风之值达到触发阈值，根据EX解锁状态计算附加伤害并重置风之值
 *
 * 附加伤害效果分层：
 * - 无EX2：附加自身基于J技能等级攻击力百分比的风属性伤害（10%~100%）
 * - EX2已解锁（需EX1前置）：概率倍攻附加伤害（100%/150%/200%攻击力），未触发倍攻时回退至基础附加伤害
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @param {Object} [options] - 可选参数
 * @param {boolean} [options.skipMpCost=false] - 是否跳过MP消耗（技能释放时为true）
 * @returns {Object} 处理结果
 *   - triggered: 是否触发了附加伤害
 *   - damageAmount: 附加伤害量（未触发时为0）
 *   - damagePercent: 附加伤害百分比（未触发时为0）
 *   - multiAttackBonus: EX2倍攻附加伤害百分比（未触发时为0）
 *   - mpConsumed: 本次消耗的MP
 *   - windValue: 处理后的风之值
 *   - triggeredValue: 触发时的风之值（用于UI闪烁效果）
 */
export function processWindAccumulationOnAttack (player, playerAttack = 0, options = {}) {
  const { skipMpCost = false } = options
  const result = {
    triggered: false,
    damageAmount: 0,
    damagePercent: 0,
    multiAttackBonus: 0,
    mpConsumed: 0,
    windValue: 0,
    triggeredValue: 0
  }

  try {
    if (!isWindAccumulationUnlocked(player)) {
      return result
    }

    const ex2Unlocked = isWindAccumulationEx2Unlocked(player)
    const triggerCount = getWindAccumulationTriggerCount(player)

    // 1. 消耗MP（技能释放时可跳过）
    if (!skipMpCost) {
      const mpCost = getWindAccumulationMpCost(player)
      if (mpCost > 0) {
        const currentMana = Number(player.currentMana || 0)
        if (currentMana < mpCost) {
          return result
        }
        result.mpConsumed = mpCost
      }
    }

    // 2. 增加风之值
    windValue.value += 1
    result.windValue = windValue.value

    // 3. 检查是否达到触发阈值
    if (windValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredValue = windValue.value

      if (ex2Unlocked) {
        // EX2已解锁：概率倍攻附加伤害
        const multiAttackInfo = getWindAccumulationMultiAttackInfo(player)

        if (multiAttackInfo.unlocked && multiAttackInfo.bonusPercent > 0) {
          // 触发倍攻：按概率档位附加伤害
          result.damagePercent = multiAttackInfo.bonusPercent
          result.multiAttackBonus = multiAttackInfo.bonusPercent
        } else {
          // 未触发倍攻：回退至基础附加伤害
          result.damagePercent = getWindAccumulationDamageBonus(player)
        }
      } else {
        // 基础效果：基于J技能等级的附加伤害（10%~100%攻击力）
        result.damagePercent = getWindAccumulationDamageBonus(player)
      }

      result.damageAmount = Math.floor(playerAttack * result.damagePercent / 100)

      // 重置风之值
      windValue.value = 0
      result.windValue = 0

      // 触发闪烁效果
      triggerFlash.value = true
      setTimeout(() => {
        triggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[WindAccumulation] 处理风之积累风之值失败:', error)
  }

  return result
}

/**
 * 释放技能后处理风之积累风之值逻辑
 * 与 processWindAccumulationOnAttack 逻辑一致，但跳过MP消耗
 * （技能自身已有MP消耗，不再额外扣除风之积累的MP）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @returns {Object} 处理结果（同 processWindAccumulationOnAttack）
 */
export function processWindAccumulationOnSkillCast (player, playerAttack = 0) {
  return processWindAccumulationOnAttack(player, playerAttack, { skipMpCost: true })
}

/**
 * 重置风之积累风之值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetWindAccumulation () {
  windValue.value = 0
  triggerFlash.value = false
}
