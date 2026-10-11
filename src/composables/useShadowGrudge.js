/**
 * @file useShadowGrudge.js
 * @description 影之怨被动技能组合式函数
 * 提供影之怨（J技能）及其EX被动技能的影怨值计数、触发判定、伤害加成计算
 *
 * 业务意图：
 * - 影之怨（J技能）：每次普通攻击增加1点影怨值，最高10点
 *   达到触发阈值（10次）时，本次攻击附加攻击力百分比伤害（1级10%，10级100%），然后重置影怨值
 *   每次普通攻击消耗30点MP
 * - 影之怨EX1-减少触发次数（J_EX1技能）：1级满级，触发阈值从10减少至5
 * - 影之怨EX2-倍攻（J_EX2技能）：1级满级，在EX1触发次数阈值时概率触发倍攻
 *   依赖EX1：需先解锁影之怨EX1，触发次数基于EX1的攻击次数（5次）
 *   50%概率附加100%攻击力，25%概率附加150%攻击力，10%概率附加180%攻击力
 *
 * 影怨值存储方式：
 * - 使用 Vue ref 维护影怨值计数器，支持响应式 UI 更新
 * - 计数器仅在内存中，不持久化（重载后从0开始计数）
 *
 * 创建时间：2026-07-27
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 影之怨基础触发阈值（10次普通攻击触发）
 */
export const SHADOW_GRUDGE_BASE_TRIGGER_COUNT = 10

/**
 * 影之怨最大熟练度等级
 */
export const SHADOW_GRUDGE_MAX_LEVEL = 10

/**
 * 影之怨EX1固定触发次数减少百分比（50%）
 */
export const SHADOW_GRUDGE_EX1_TRIGGER_REDUCTION = 50

/**
 * 影之怨EX2倍攻触发概率配置
 * EX2依赖EX1：需先解锁影之怨EX1，在EX1触发次数阈值（5次）时触发概率倍攻
 * chance1: 30%概率触发1.5倍攻击（附加50%攻击力）
 * chance2: 15%概率触发2倍攻击（附加100%攻击力）
 * chance3: 5%概率触发3倍攻击（附加200%攻击力）
 * 概率为逐级包含关系：30%包含15%和5%
 */
export const SHADOW_GRUDGE_EX2_MULTI_ATTACK = Object.freeze({
  chance1: 30,
  bonus1: 50,
  chance2: 15,
  bonus2: 100,
  chance3: 5,
  bonus3: 200
})

/**
 * 影之怨每次攻击MP消耗（固定30点）
 */
export const SHADOW_GRUDGE_MP_COST_PER_ATTACK = 30

/**
 * 模块级影怨值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const grudgeValue = ref(0)

/**
 * 响应式触发标记，触发附加伤害时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const triggerFlash = ref(false)

/**
 * 获取当前影怨值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 影怨值的响应式引用
 */
export function useGrudgeValue () {
  return grudgeValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useGrudgeTriggerFlash () {
  return triggerFlash
}

/**
 * 获取当前影怨值的非响应式值
 * @returns {number} 当前影怨值（0~触发阈值）
 */
export function getShadowGrudgeValue () {
  return grudgeValue.value
}

/**
 * 检查影之怨（J技能）是否已解锁
 * 仅当玩家为暗夜主宰且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isShadowGrudgeUnlocked (player) {
  if (!player || player.class !== 'joker_emperor') {
    return false
  }
  return isSkillUnlocked(player, 'joker_emperor', 'J')
}

/**
 * 检查影之怨EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isShadowGrudgeEx1Unlocked (player) {
  if (!player || player.class !== 'joker_emperor') {
    return false
  }
  return isSkillUnlocked(player, 'joker_emperor', 'J_EX1')
}

/**
 * 检查影之怨EX2-倍攻（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isShadowGrudgeEx2Unlocked (player) {
  if (!player || player.class !== 'joker_emperor') {
    return false
  }
  return isSkillUnlocked(player, 'joker_emperor', 'J_EX2')
}

/**
 * 获取影之怨的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getShadowGrudgeTriggerCount (player) {
  // 基础阈值
  let triggerCount = SHADOW_GRUDGE_BASE_TRIGGER_COUNT

  // 检查EX1是否已解锁
  if (isShadowGrudgeEx1Unlocked(player)) {
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
        // 使用静态技能对象的 getTriggerReduction 方法获取减少百分比
        const staticSkill = getSkill('joker_emperor', 'J_EX1')
        let reduction = SHADOW_GRUDGE_EX1_TRIGGER_REDUCTION
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
 * 获取影之怨的影怨值上限（用于UI显示圆圈数量）
 * 始终为10个圆圈，无论EX1是否解锁
 * @returns {number} 影怨值上限（固定10）
 */
export function getShadowGrudgeMaxValue () {
  return SHADOW_GRUDGE_BASE_TRIGGER_COUNT
}

/**
 * 获取影之怨技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getShadowGrudgeSkillLevel (player) {
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
 * 获取影之怨附加攻击力百分比
 * 1级10%，每级+10%，10级100%
 * @param {Object} player - 玩家对象
 * @returns {number} 攻击力附加百分比（0~100）
 */
export function getShadowGrudgeDamageBonus (player) {
  if (!isShadowGrudgeUnlocked(player)) {
    return 0
  }
  const skillLevel = getShadowGrudgeSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  // 使用静态技能对象的 getDamageBonusPercent 方法获取加成值
  const staticSkill = getSkill('joker_emperor', 'J')
  if (staticSkill && typeof staticSkill.getDamageBonusPercent === 'function') {
    return staticSkill.getDamageBonusPercent(skillLevel)
  }
  // 回退到线性计算
  const safeLevel = Math.min(skillLevel, SHADOW_GRUDGE_MAX_LEVEL)
  return 10 * safeLevel
}

/**
 * 获取影之怨EX2倍攻触发信息
 * 仅当EX2已解锁且EX1已解锁时返回有效数据
 * EX2依赖EX1的攻击次数阈值，因此EX1必须先解锁
 * 每次调用随机滚动倍攻档位
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻触发信息
 *   - unlocked: EX2是否已解锁（含EX1前置检查）
 *   - bonusPercent: 本次触发的额外攻击力百分比（0表示未触发倍攻）
 *   - chance1/bonus1/chance2/bonus2/chance3/bonus3: 各档概率与加成
 */
export function getShadowGrudgeMultiAttackInfo (player) {
  const defaultConfig = {
    chance1: SHADOW_GRUDGE_EX2_MULTI_ATTACK.chance1,
    bonus1: SHADOW_GRUDGE_EX2_MULTI_ATTACK.bonus1,
    chance2: SHADOW_GRUDGE_EX2_MULTI_ATTACK.chance2,
    bonus2: SHADOW_GRUDGE_EX2_MULTI_ATTACK.bonus2,
    chance3: SHADOW_GRUDGE_EX2_MULTI_ATTACK.chance3,
    bonus3: SHADOW_GRUDGE_EX2_MULTI_ATTACK.bonus3
  }

  const result = {
    unlocked: false,
    bonusPercent: 0,
    ...defaultConfig
  }

  // EX2依赖EX1的攻击次数阈值，必须同时解锁EX1和EX2
  if (!isShadowGrudgeEx2Unlocked(player) || !isShadowGrudgeEx1Unlocked(player)) {
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
  const staticSkill = getSkill('joker_emperor', 'J_EX2')
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
 * 获取影之怨每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getShadowGrudgeMpCost (player) {
  if (!isShadowGrudgeUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('joker_emperor', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return SHADOW_GRUDGE_MP_COST_PER_ATTACK
}

/**
 * 普通攻击命中后处理影之怨影怨值逻辑
 * 1. 消耗MP（30点），若MP不足则不增加影怨值
 * 2. 增加影怨值（+1）
 * 3. 若影怨值达到触发阈值，计算附加伤害并重置影怨值
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @returns {Object} 处理结果
 *   - triggered: 是否触发了附加伤害
 *   - bonusDamage: 附加伤害值（未触发时为0）
 *   - bonusPercent: 附加伤害百分比（未触发时为0）
 *   - multiAttackBonus: EX2倍攻额外伤害百分比（未触发时为0）
 *   - mpConsumed: 本次消耗的MP
 *   - grudgeValue: 处理后的影怨值
 *   - triggeredGrudge: 触发时的影怨值（用于UI闪烁效果）
 */
export function processShadowGrudgeOnAttack (player, playerAttack = 0) {
  const result = {
    triggered: false,
    bonusDamage: 0,
    bonusPercent: 0,
    multiAttackBonus: 0,
    mpConsumed: 0,
    grudgeValue: 0,
    triggeredGrudge: 0
  }

  try {
    if (!isShadowGrudgeUnlocked(player)) {
      return result
    }

    // 1. 消耗MP
    const mpCost = getShadowGrudgeMpCost(player)
    if (mpCost > 0) {
      const currentMana = Number(player.currentMana || 0)
      if (currentMana < mpCost) {
        // MP不足，不增加影怨值
        return result
      }
      // 消耗MP由调用方处理，这里仅返回消耗值
      result.mpConsumed = mpCost
    }

    // 2. 增加影怨值
    const triggerCount = getShadowGrudgeTriggerCount(player)
    grudgeValue.value += 1
    result.grudgeValue = grudgeValue.value

    // 3. 检查是否达到触发阈值
    if (grudgeValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredGrudge = grudgeValue.value

      // 计算基础附加伤害百分比
      const baseBonusPercent = getShadowGrudgeDamageBonus(player)
      result.bonusPercent = baseBonusPercent

      // 计算EX2倍攻额外伤害
      const multiAttackInfo = getShadowGrudgeMultiAttackInfo(player)
      if (multiAttackInfo.unlocked && multiAttackInfo.bonusPercent > 0) {
        result.multiAttackBonus = multiAttackInfo.bonusPercent
      }

      // 计算总附加伤害
      const totalBonusPercent = baseBonusPercent + result.multiAttackBonus
      result.bonusDamage = Math.floor(playerAttack * totalBonusPercent / 100)

      // 重置影怨值
      grudgeValue.value = 0
      result.grudgeValue = 0

      // 触发闪烁效果
      triggerFlash.value = true
      setTimeout(() => {
        triggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[ShadowGrudge] 处理影之怨影怨值失败:', error)
  }

  return result
}

/**
 * 重置影之怨影怨值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetShadowGrudge () {
  grudgeValue.value = 0
  triggerFlash.value = false
}
