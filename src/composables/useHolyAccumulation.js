/**
 * @file useHolyAccumulation.js
 * @description 圣光积累被动技能组合式函数
 * 提供圣光积累（J技能）及其EX被动技能的圣光值计数、触发判定、治疗效果计算
 *
 * 业务意图：
 * - 圣光积累（J技能）：每次普通攻击或释放技能增加1点圣光值，最高10点
 *   达到触发阈值（10次）时，恢复自身基于攻击力百分比的生命值，然后重置圣光值
 *   治疗量百分比随J技能熟练度等级提升（1级10%，每级+10%，10级100%）
 *   每次普通攻击消耗30点MP
 * - 圣光积累EX1-减少触发次数（J_EX1技能）：1级满级，触发阈值从10减少至5
 *   解锁EX1后，触发效果从「自身治疗」变为「全队治疗」，治疗量为施法者5%攻击力
 * - 圣光积累EX2-倍攻治疗（J_EX2技能）：1级满级，在EX1触发次数阈值时概率触发倍攻治疗
 *   依赖EX1：需先解锁圣光积累EX1，触发次数基于EX1的攻击次数（5次）
 *   50%概率按照施法者10%攻击力恢复所有队员最大生命值
 *   25%概率按照施法者20%攻击力恢复所有队员最大生命值
 *   10%概率按照施法者30%攻击力恢复所有队员最大生命值
 *   概率为逐级包含关系：50%包含25%和10%，未触发倍攻时回退至基础5%
 *
 * 圣光值存储方式：
 * - 使用 Vue ref 维护圣光值计数器，支持响应式 UI 更新
 * - 计数器仅在内存中，不持久化（重载后从0开始计数）
 *
 * 创建时间：2026-07-29
 * 修改时间：2026-07-30  重构治疗效果：基础自身治疗→EX全队治疗→EX2概率倍攻治疗
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 圣光积累基础触发阈值（10次普通攻击/技能释放触发）
 */
export const HOLY_ACCUMULATION_BASE_TRIGGER_COUNT = 10

/**
 * 圣光积累最大熟练度等级
 */
export const HOLY_ACCUMULATION_MAX_LEVEL = 10

/**
 * 圣光积累EX1固定触发次数减少百分比（50%）
 */
export const HOLY_ACCUMULATION_EX1_TRIGGER_REDUCTION = 50

/**
 * 圣光积累EX解锁后的基础治疗百分比（施法者攻击力的5%）
 */
export const HOLY_ACCUMULATION_EX_BASE_HEAL_PERCENT = 5

/**
 * 圣光积累EX2倍攻治疗触发概率配置
 * EX2依赖EX1：需先解锁圣光积累EX1，在EX1触发次数阈值（5次）时触发概率倍攻治疗
 * chance1: 50%概率按照施法者10%攻击力恢复所有队员最大生命值
 * chance2: 25%概率按照施法者20%攻击力恢复所有队员最大生命值
 * chance3: 10%概率按照施法者30%攻击力恢复所有队员最大生命值
 * 概率为逐级包含关系：50%包含25%和10%，未触发倍攻时回退至基础5%
 */
export const HOLY_ACCUMULATION_EX2_MULTI_HEAL = Object.freeze({
  chance1: 50,
  bonus1: 10,
  chance2: 25,
  bonus2: 20,
  chance3: 10,
  bonus3: 30
})

/**
 * 圣光积累每次攻击MP消耗（固定30点）
 */
export const HOLY_ACCUMULATION_MP_COST_PER_ATTACK = 30

/**
 * 模块级圣光值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const holyValue = ref(0)

/**
 * 响应式触发标记，触发治疗时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const triggerFlash = ref(false)

/**
 * 获取当前圣光值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 圣光值的响应式引用
 */
export function useHolyValue () {
  return holyValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useHolyTriggerFlash () {
  return triggerFlash
}

/**
 * 获取当前圣光值的非响应式值
 * @returns {number} 当前圣光值（0~触发阈值）
 */
export function getHolyAccumulationValue () {
  return holyValue.value
}

/**
 * 检查圣光积累（J技能）是否已解锁
 * 仅当玩家为炽天使且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isHolyAccumulationUnlocked (player) {
  if (!player || player.class !== 'nature_messenger') {
    return false
  }
  return isSkillUnlocked(player, 'nature_messenger', 'J')
}

/**
 * 检查圣光积累EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isHolyAccumulationEx1Unlocked (player) {
  if (!player || player.class !== 'nature_messenger') {
    return false
  }
  return isSkillUnlocked(player, 'nature_messenger', 'J_EX1')
}

/**
 * 检查圣光积累EX2-倍攻治疗（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isHolyAccumulationEx2Unlocked (player) {
  if (!player || player.class !== 'nature_messenger') {
    return false
  }
  return isSkillUnlocked(player, 'nature_messenger', 'J_EX2')
}

/**
 * 获取圣光积累的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getHolyAccumulationTriggerCount (player) {
  let triggerCount = HOLY_ACCUMULATION_BASE_TRIGGER_COUNT

  if (isHolyAccumulationEx1Unlocked(player)) {
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
        const staticSkill = getSkill('nature_messenger', 'J_EX1')
        let reduction = HOLY_ACCUMULATION_EX1_TRIGGER_REDUCTION
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
 * 获取圣光积累的圣光值上限（用于UI显示圆圈数量）
 * 始终为10个圆圈，无论EX1是否解锁
 * @returns {number} 圣光值上限（固定10）
 */
export function getHolyAccumulationMaxValue () {
  return HOLY_ACCUMULATION_BASE_TRIGGER_COUNT
}

/**
 * 获取圣光积累技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getHolyAccumulationSkillLevel (player) {
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
 * 获取圣光积累基础治疗量百分比（无EX时的自身治疗效果）
 * 1级10%，每级+10%，10级100%
 * @param {Object} player - 玩家对象
 * @returns {number} 治疗量附加百分比（0~100）
 */
export function getHolyAccumulationHealBonus (player) {
  if (!isHolyAccumulationUnlocked(player)) {
    return 0
  }
  const skillLevel = getHolyAccumulationSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('nature_messenger', 'J')
  if (staticSkill && typeof staticSkill.getHealBonusPercent === 'function') {
    return staticSkill.getHealBonusPercent(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, HOLY_ACCUMULATION_MAX_LEVEL)
  return 10 * safeLevel
}

/**
 * 获取圣光积累EX2倍攻治疗触发信息
 * 仅当EX2已解锁且EX1已解锁时返回有效数据
 * EX2依赖EX1的攻击次数阈值，因此EX1必须先解锁
 * 每次调用随机滚动倍攻档位
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻治疗触发信息
 *   - unlocked: EX2是否已解锁（含EX1前置检查）
 *   - bonusPercent: 本次触发的治疗量百分比（0表示未触发倍攻，回退至基础5%）
 *   - chance1/bonus1/chance2/bonus2/chance3/bonus3: 各档概率与加成
 */
export function getHolyAccumulationMultiHealInfo (player) {
  const defaultConfig = {
    chance1: HOLY_ACCUMULATION_EX2_MULTI_HEAL.chance1,
    bonus1: HOLY_ACCUMULATION_EX2_MULTI_HEAL.bonus1,
    chance2: HOLY_ACCUMULATION_EX2_MULTI_HEAL.chance2,
    bonus2: HOLY_ACCUMULATION_EX2_MULTI_HEAL.bonus2,
    chance3: HOLY_ACCUMULATION_EX2_MULTI_HEAL.chance3,
    bonus3: HOLY_ACCUMULATION_EX2_MULTI_HEAL.bonus3
  }

  const result = {
    unlocked: false,
    bonusPercent: 0,
    ...defaultConfig
  }

  // EX2依赖EX1的攻击次数阈值，必须同时解锁EX1和EX2
  if (!isHolyAccumulationEx2Unlocked(player) || !isHolyAccumulationEx1Unlocked(player)) {
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
  const staticSkill = getSkill('nature_messenger', 'J_EX2')
  let chances = defaultConfig
  if (staticSkill && typeof staticSkill.getMultiHealChance === 'function') {
    chances = staticSkill.getMultiHealChance(skillLevel)
  }
  result.chance1 = chances.chance1
  result.bonus1 = chances.bonus1
  result.chance2 = chances.chance2
  result.bonus2 = chances.bonus2
  result.chance3 = chances.chance3
  result.bonus3 = chances.bonus3

  // 随机滚动倍攻治疗档位
  // 概率为逐级包含关系：先滚3档（10%），再滚2档（25%），再滚1档（50%）
  // 未命中任何档位时回退至基础5%
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
 * 获取圣光积累每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getHolyAccumulationMpCost (player) {
  if (!isHolyAccumulationUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('nature_messenger', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return HOLY_ACCUMULATION_MP_COST_PER_ATTACK
}

/**
 * 普通攻击或释放技能后处理圣光积累圣光值逻辑
 * 1. 消耗MP（30点，技能释放可跳过），若MP不足则不增加圣光值
 * 2. 增加圣光值（+1）
 * 3. 若圣光值达到触发阈值，根据EX解锁状态计算治疗量并重置圣光值
 *
 * 治疗效果分层：
 * - 无EX1：恢复自身基于J技能等级攻击力百分比的生命值（10%~100%）
 * - EX1已解锁：恢复所有队员最大生命值，治疗量为施法者5%攻击力
 * - EX1+EX2已解锁：概率倍攻治疗（10%/20%/30%攻击力），未触发倍攻时回退5%
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算治疗量）
 * @param {Object} [options] - 可选参数
 * @param {boolean} [options.skipMpCost=false] - 是否跳过MP消耗（技能释放时为true）
 * @returns {Object} 处理结果
 *   - triggered: 是否触发了治疗
 *   - healAmount: 治疗量（未触发时为0）
 *   - healPercent: 治疗量百分比（未触发时为0）
 *   - multiHealBonus: EX2倍攻治疗百分比（未触发时为0）
 *   - targetType: 治疗目标类型 'self'（自身）或 'all'（全队）
 *   - mpConsumed: 本次消耗的MP
 *   - holyValue: 处理后的圣光值
 *   - triggeredValue: 触发时的圣光值（用于UI闪烁效果）
 */
export function processHolyAccumulationOnAttack (player, playerAttack = 0, options = {}) {
  const { skipMpCost = false } = options
  const result = {
    triggered: false,
    healAmount: 0,
    healPercent: 0,
    multiHealBonus: 0,
    targetType: 'self',
    mpConsumed: 0,
    holyValue: 0,
    triggeredValue: 0
  }

  try {
    if (!isHolyAccumulationUnlocked(player)) {
      return result
    }

    const ex1Unlocked = isHolyAccumulationEx1Unlocked(player)
    const ex2Unlocked = isHolyAccumulationEx2Unlocked(player)
    const triggerCount = getHolyAccumulationTriggerCount(player)

    // 1. 消耗MP（技能释放时可跳过）
    if (!skipMpCost) {
      const mpCost = getHolyAccumulationMpCost(player)
      if (mpCost > 0) {
        const currentMana = Number(player.currentMana || 0)
        if (currentMana < mpCost) {
          return result
        }
        result.mpConsumed = mpCost
      }
    }

    // 2. 增加圣光值
    holyValue.value += 1
    result.holyValue = holyValue.value

    // 3. 检查是否达到触发阈值
    if (holyValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredValue = holyValue.value

      if (!ex1Unlocked) {
        // 基础效果：仅恢复自身，基于J技能等级的治疗加成（10%~100%攻击力）
        result.targetType = 'self'
        const baseHealPercent = getHolyAccumulationHealBonus(player)
        result.healPercent = baseHealPercent
        result.healAmount = Math.floor(playerAttack * baseHealPercent / 100)
      } else {
        // EX效果：恢复所有队员最大生命值
        result.targetType = 'all'

        if (ex2Unlocked) {
          // EX2已解锁：概率倍攻治疗
          const multiHealInfo = getHolyAccumulationMultiHealInfo(player)

          if (multiHealInfo.unlocked && multiHealInfo.bonusPercent > 0) {
            // 触发倍攻治疗：按概率档位恢复
            result.healPercent = multiHealInfo.bonusPercent
            result.multiHealBonus = multiHealInfo.bonusPercent
          } else {
            // 未触发倍攻：回退至基础5%
            result.healPercent = HOLY_ACCUMULATION_EX_BASE_HEAL_PERCENT
          }
        } else {
          // 仅EX1解锁：固定5%攻击力治疗全队
          result.healPercent = HOLY_ACCUMULATION_EX_BASE_HEAL_PERCENT
        }

        result.healAmount = Math.floor(playerAttack * result.healPercent / 100)
      }

      // 重置圣光值
      holyValue.value = 0
      result.holyValue = 0

      // 触发闪烁效果
      triggerFlash.value = true
      setTimeout(() => {
        triggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[HolyAccumulation] 处理圣光积累圣光值失败:', error)
  }

  return result
}

/**
 * 释放技能后处理圣光积累圣光值逻辑
 * 与 processHolyAccumulationOnAttack 逻辑一致，但跳过MP消耗
 * （技能自身已有MP消耗，不再额外扣除圣光积累的MP）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算治疗量）
 * @returns {Object} 处理结果（同 processHolyAccumulationOnAttack）
 */
export function processHolyAccumulationOnSkillCast (player, playerAttack = 0) {
  return processHolyAccumulationOnAttack(player, playerAttack, { skipMpCost: true })
}

/**
 * 重置圣光积累圣光值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetHolyAccumulation () {
  holyValue.value = 0
  triggerFlash.value = false
}
