/**
 * @file useHolyKnightEx.js
 * @description 圣殿骑士EX被动技能组合式函数
 * 提供圣殿骑士各技能EX被动的效果计算：
 * - 荣耀之剑EX1-CD减少 / EX2-伤害增加 / EX3-倍攻
 * - 圣殿裁决EX1-CD减少 / EX2-伤害增加 / EX3-倍攻
 * - 碎甲圣裁EX1-CD减少 / EX2-伤害增加
 * - 重甲精通EX1-属性抗性增强 / EX2-增强生命值 / EX3-概率减伤
 * - 裁决积累EX1-减少触发次数 / EX2-倍攻
 * - 神圣壁垒EX1-增强生命值 / EX2-增强伤害减免 / EX3-伤害分担
 *
 * 创建时间：2026-08-11
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 获取圣殿骑士玩家技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @param {string} skillKey - 技能按键（如 'W_EX', 'W_EX2', 'W_EX3'）
 * @returns {number} 熟练度等级，未学习时返回0
 */
function getHolyKnightSkillLevel (player, skillKey) {
  if (!player || !player.skills) {
    return 0
  }
  const playerSkill = player.skills[skillKey]
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

// ========== 荣耀之剑 EX 技能 ==========

/**
 * 获取荣耀之剑EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getShieldBashCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'W_EX')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'W_EX')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'W_EX')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 计算应用荣耀之剑EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getShieldBashEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getShieldBashCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取荣耀之剑EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getShieldBashDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'W_EX2')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'W_EX2')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'W_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

/**
 * 获取荣耀之剑EX3-倍攻被动技能的触发信息
 * 30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成4倍伤害
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻信息 { unlocked, multiplier, chance2x, chance3x, chance4x }
 */
export function getShieldBashCriticalMultiplierInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,
    chance2x: 30,
    chance3x: 20,
    chance4x: 10
  }

  if (!player || !player.skills) {
    return result
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'W_EX3')) {
    return result
  }

  const skillLevel = getHolyKnightSkillLevel(player, 'W_EX3')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('holy_knight', 'W_EX3')
  let chances = { chance2x: 30, chance3x: 20, chance4x: 10 }
  if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
    chances = staticSkill.getCriticalMultiplier(skillLevel)
  }
  result.chance2x = chances.chance2x
  result.chance3x = chances.chance3x
  result.chance4x = chances.chance4x

  // 随机滚动倍攻档位：10%概率4倍 → 20%概率3倍 → 30%概率2倍
  const roll = Math.random() * 100
  if (roll < chances.chance4x) {
    result.multiplier = 4
  } else if (roll < chances.chance3x) {
    result.multiplier = 3
  } else if (roll < chances.chance2x) {
    result.multiplier = 2
  }

  return result
}

// ========== 圣殿裁决 EX 技能 ==========

/**
 * 获取圣殿裁决EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getHolyKnightJudgmentCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'U_EX1')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'U_EX1')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'U_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 计算应用圣殿裁决EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getHolyKnightJudgmentEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getHolyKnightJudgmentCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取圣殿裁决EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getHolyKnightJudgmentDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'U_EX2')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'U_EX2')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'U_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

/**
 * 获取圣殿裁决EX3-倍攻被动技能的触发信息
 * 30%概率造成2倍伤害，20%概率造成2.5倍伤害，10%概率造成3倍伤害
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻信息 { unlocked, multiplier, chance2x, chance2_5x, chance3x }
 */
export function getHolyKnightJudgmentCriticalMultiplierInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,
    chance2x: 30,
    chance2_5x: 20,
    chance3x: 10
  }

  if (!player || !player.skills) {
    return result
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'U_EX3')) {
    return result
  }

  const skillLevel = getHolyKnightSkillLevel(player, 'U_EX3')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('holy_knight', 'U_EX3')
  let chances = { chance2x: 30, chance2_5x: 20, chance3x: 10 }
  if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
    chances = staticSkill.getCriticalMultiplier(skillLevel)
  }
  result.chance2x = chances.chance2x
  result.chance2_5x = chances.chance2_5x
  result.chance3x = chances.chance3x

  // 随机滚动倍攻档位：10%概率3倍 → 20%概率2.5倍 → 30%概率2倍
  const roll = Math.random() * 100
  if (roll < chances.chance3x) {
    result.multiplier = 3
  } else if (roll < chances.chance2_5x) {
    result.multiplier = 2.5
  } else if (roll < chances.chance2x) {
    result.multiplier = 2
  }

  return result
}

// ========== 碎甲圣裁 EX 技能 ==========

/**
 * 获取碎甲圣裁EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getArmorBreakCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'E_EX1')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'E_EX1')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'E_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 计算应用碎甲圣裁EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getArmorBreakEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getArmorBreakCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取碎甲圣裁EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getArmorBreakDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'E_EX2')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'E_EX2')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'E_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

// ========== 重甲精通 EX 技能 ==========

/**
 * 获取重甲精通EX1-属性抗性增强被动技能的抗性加成百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 所有属性抗性加成百分比（0 或 10）
 */
export function getHeavyArmorAllResistanceBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'I_EX1')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'I_EX1')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'I_EX1')
  if (staticSkill && typeof staticSkill.getAllResistanceBonus === 'function') {
    return staticSkill.getAllResistanceBonus(skillLevel)
  }
  return 10
}

/**
 * 获取重甲精通EX2-增强生命值被动技能的最大生命值加成百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 最大生命值加成百分比（0 或 15）
 */
export function getHeavyArmorMaxHpBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'I_EX2')) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'I_EX2')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'I_EX2')
  if (staticSkill && typeof staticSkill.getMaxHpBonus === 'function') {
    return staticSkill.getMaxHpBonus(skillLevel)
  }
  return 15
}

/**
 * 获取重甲精通EX3-概率减伤被动技能的触发信息
 * 30%概率减少所有伤害10%，20%概率减少所有伤害20%，10%概率减少所有伤害30%
 * @param {Object} player - 玩家对象
 * @returns {Object} 减伤信息 { unlocked, reductionPercent, tiers }
 */
export function getHeavyArmorDamageReductionInfo (player) {
  const result = {
    unlocked: false,
    reductionPercent: 0,
    tiers: [
      { chance: 30, reduction: 10 },
      { chance: 20, reduction: 20 },
      { chance: 10, reduction: 30 }
    ]
  }

  if (!player || !player.skills) {
    return result
  }
  if (!isSkillUnlocked(player, 'holy_knight', 'I_EX3')) {
    return result
  }

  const skillLevel = getHolyKnightSkillLevel(player, 'I_EX3')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('holy_knight', 'I_EX3')
  if (staticSkill && typeof staticSkill.getDamageReduction === 'function') {
    const config = staticSkill.getDamageReduction(skillLevel)
    if (config && Array.isArray(config.tiers)) {
      result.tiers = config.tiers
    }
  }

  // 随机滚动减伤档位：10%概率减30% → 20%概率减20% → 30%概率减10%
  const roll = Math.random() * 100
  if (roll < result.tiers[2].chance) {
    result.reductionPercent = result.tiers[2].reduction
  } else if (roll < result.tiers[1].chance) {
    result.reductionPercent = result.tiers[1].reduction
  } else if (roll < result.tiers[0].chance) {
    result.reductionPercent = result.tiers[0].reduction
  }

  return result
}

// ========== 裁决积累 EX 技能 ==========

/**
 * 检查裁决积累（J技能）是否已解锁
 * 仅当玩家为圣殿骑士且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isJudgmentAccumulationUnlocked (player) {
  if (!player || player.class !== 'holy_knight') {
    return false
  }
  return isSkillUnlocked(player, 'holy_knight', 'J')
}

/**
 * 检查裁决积累EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isJudgmentAccumulationEx1Unlocked (player) {
  if (!player || player.class !== 'holy_knight') {
    return false
  }
  return isSkillUnlocked(player, 'holy_knight', 'J_EX1')
}

/**
 * 检查裁决积累EX2-倍攻（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isJudgmentAccumulationEx2Unlocked (player) {
  if (!player || player.class !== 'holy_knight') {
    return false
  }
  return isSkillUnlocked(player, 'holy_knight', 'J_EX2')
}

/**
 * 获取裁决积累的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getJudgmentAccumulationTriggerCount (player) {
  let triggerCount = 10

  if (isJudgmentAccumulationEx1Unlocked(player)) {
    const skillLevel = getHolyKnightSkillLevel(player, 'J_EX1')
    if (skillLevel >= 1) {
      const staticSkill = getSkill('holy_knight', 'J_EX1')
      let reduction = 50
      if (staticSkill && typeof staticSkill.getTriggerReduction === 'function') {
        reduction = staticSkill.getTriggerReduction(skillLevel)
      }
      triggerCount = Math.max(1, Math.floor(triggerCount * (1 - reduction / 100)))
    }
  }

  return triggerCount
}

/**
 * 获取裁决积累技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getJudgmentAccumulationSkillLevel (player) {
  return getHolyKnightSkillLevel(player, 'J')
}

/**
 * 获取裁决积累基础附加伤害百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 附加伤害百分比（0~100）
 */
export function getJudgmentAccumulationDamageBonus (player) {
  if (!isJudgmentAccumulationUnlocked(player)) {
    return 0
  }
  const skillLevel = getJudgmentAccumulationSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'J')
  if (staticSkill && typeof staticSkill.getDamageBonusPercent === 'function') {
    return staticSkill.getDamageBonusPercent(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, 10)
  return 10 * safeLevel
}

/**
 * 获取裁决积累每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getJudgmentAccumulationMpCost (player) {
  if (!isJudgmentAccumulationUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return 30
}

/**
 * 获取裁决积累EX2倍攻触发信息
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻触发信息
 */
export function getJudgmentAccumulationMultiAttackInfo (player) {
  const defaultConfig = {
    chance1: 30,
    bonus1: 200,
    chance2: 20,
    bonus2: 300,
    chance3: 10,
    bonus3: 400
  }

  const result = {
    unlocked: false,
    bonusPercent: 0,
    ...defaultConfig
  }

  if (!isJudgmentAccumulationEx2Unlocked(player) || !isJudgmentAccumulationEx1Unlocked(player)) {
    return result
  }

  const skillLevel = getHolyKnightSkillLevel(player, 'J_EX2')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('holy_knight', 'J_EX2')
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

// ========== 裁决积累响应式状态管理 ==========

/**
 * 模块级裁决值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const judgmentValue = ref(0)

/**
 * 响应式触发标记，触发附加伤害时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const judgmentTriggerFlash = ref(false)

/**
 * 获取当前裁决值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 裁决值的响应式引用
 */
export function useJudgmentValue () {
  return judgmentValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useJudgmentTriggerFlash () {
  return judgmentTriggerFlash
}

/**
 * 获取当前裁决值的非响应式值
 * @returns {number} 当前裁决值（0~触发阈值）
 */
export function getJudgmentAccumulationValue () {
  return judgmentValue.value
}

/**
 * 普通攻击或释放技能后处理裁决积累裁决值逻辑
 * 1. 消耗MP（30点，技能释放可跳过），若MP不足则不增加裁决值
 * 2. 增加裁决值（+1）
 * 3. 若裁决值达到触发阈值，计算附加伤害并重置裁决值
 *
 * 附加伤害分层：
 * - 基础效果：附加攻击力百分比的额外大地属性伤害（10%~100%随熟练度等级提升）
 * - EX2已解锁：概率触发倍攻附加伤害（200%/300%/400%攻击力）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @param {Object} [options] - 可选参数
 * @param {boolean} [options.skipMpCost=false] - 是否跳过MP消耗（技能释放时为true）
 * @returns {Object} 处理结果
 *   - triggered: 是否触发了附加伤害
 *   - damageAmount: 附加伤害量（未触发时为0）
 *   - damagePercent: 附加伤害百分比（未触发时为0）
 *   - multiAttackBonus: EX2倍攻附加百分比（未触发时为0）
 *   - mpConsumed: 本次消耗的MP
 *   - judgmentValue: 处理后的裁决值
 *   - triggeredValue: 触发时的裁决值（用于UI闪烁效果）
 */
export function processJudgmentAccumulationOnAttack (player, playerAttack = 0, options = {}) {
  const { skipMpCost = false } = options
  const result = {
    triggered: false,
    damageAmount: 0,
    damagePercent: 0,
    multiAttackBonus: 0,
    mpConsumed: 0,
    judgmentValue: 0,
    triggeredValue: 0
  }

  try {
    if (!isJudgmentAccumulationUnlocked(player)) {
      return result
    }

    const ex1Unlocked = isJudgmentAccumulationEx1Unlocked(player)
    const ex2Unlocked = isJudgmentAccumulationEx2Unlocked(player)
    const triggerCount = getJudgmentAccumulationTriggerCount(player)

    // 1. 消耗MP（技能释放时可跳过）
    if (!skipMpCost) {
      const mpCost = getJudgmentAccumulationMpCost(player)
      if (mpCost > 0) {
        const currentMana = Number(player.currentMana || 0)
        if (currentMana < mpCost) {
          return result
        }
        result.mpConsumed = mpCost
      }
    }

    // 2. 增加裁决值
    judgmentValue.value += 1
    result.judgmentValue = judgmentValue.value

    // 3. 检查是否达到触发阈值
    if (judgmentValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredValue = judgmentValue.value

      if (ex2Unlocked && ex1Unlocked) {
        // EX2已解锁：概率触发倍攻附加伤害
        const multiAttackInfo = getJudgmentAccumulationMultiAttackInfo(player)

        if (multiAttackInfo.unlocked && multiAttackInfo.bonusPercent > 0) {
          // 触发倍攻附加伤害
          result.damagePercent = multiAttackInfo.bonusPercent
          result.multiAttackBonus = multiAttackInfo.bonusPercent
        } else {
          // 未触发倍攻：使用基础附加伤害
          result.damagePercent = getJudgmentAccumulationDamageBonus(player)
        }
      } else {
        // 基础效果：附加攻击力百分比的额外大地属性伤害
        result.damagePercent = getJudgmentAccumulationDamageBonus(player)
      }

      result.damageAmount = Math.floor(playerAttack * result.damagePercent / 100)

      // 重置裁决值
      judgmentValue.value = 0
      result.judgmentValue = 0

      // 触发闪烁效果
      judgmentTriggerFlash.value = true
      setTimeout(() => {
        judgmentTriggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[JudgmentAccumulation] 处理裁决积累裁决值失败:', error)
  }

  return result
}

/**
 * 释放技能后处理裁决积累裁决值逻辑
 * 与 processJudgmentAccumulationOnAttack 逻辑一致，但跳过MP消耗
 * （技能自身已有MP消耗，不再额外扣除裁决积累的MP）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @returns {Object} 处理结果（同 processJudgmentAccumulationOnAttack）
 */
export function processJudgmentAccumulationOnSkillCast (player, playerAttack = 0) {
  return processJudgmentAccumulationOnAttack(player, playerAttack, { skipMpCost: true })
}

/**
 * 重置裁决积累裁决值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetJudgmentAccumulation () {
  judgmentValue.value = 0
  judgmentTriggerFlash.value = false
}

// ========== 圣盾觉醒 EX 技能 ==========

/**
 * 检查玩家/队友是否拥有激活的圣盾觉醒BUFF
 * 圣盾觉醒BUFF的key为'R'，skillId为'holy_knight_r'
 * @param {Object} memberData - 玩家/队友数据对象
 * @returns {Object|null} 激活的圣盾觉醒BUFF对象，未找到时返回null
 */
function findActiveShieldAwakeningBuff (memberData) {
  if (!memberData || !Array.isArray(memberData.activeBuffs)) {
    return null
  }
  const now = Date.now()
  for (const buff of memberData.activeBuffs) {
    if (!buff || typeof buff !== 'object') continue
    // 匹配圣盾觉醒BUFF（通过key或skillId）
    if (buff.key === 'R' || buff.skillId === 'holy_knight_r' || buff.name === '圣盾觉醒') {
      // 检查BUFF是否仍在持续时间内
      const endTime = buff.endTime || buff.expiresAt
      if (!endTime || endTime > now) {
        return buff
      }
    }
  }
  return null
}

/**
 * 获取圣盾觉醒EX1的攻击力伤害减少百分比
 * 当圣盾觉醒BUFF激活且EX1已解锁时，返回50（表示攻击力伤害减少50%）
 * @param {Object} memberData - 玩家/队友数据对象
 * @returns {number} 攻击力伤害减少百分比（0表示未激活或未解锁）
 */
export function getShieldAwakeningAttackDamageReduction (memberData) {
  try {
    const buff = findActiveShieldAwakeningBuff(memberData)
    if (!buff) return 0

    // 从BUFF效果中读取attackDamageReduction
    const effects = buff.effects || buff.effect
    if (!effects || typeof effects !== 'object') return 0

    const adrConfig = effects.attackDamageReduction
    if (!adrConfig) return 0

    const value = typeof adrConfig === 'object' ? Number(adrConfig.add) : Number(adrConfig)
    return Number.isFinite(value) ? value : 0
  } catch (e) {
    console.error('[ShieldAwakening] 获取攻击力伤害减少失败:', e)
    return 0
  }
}

/**
 * 获取圣盾觉醒EX3的受伤反弹百分比
 * 当圣盾觉醒BUFF激活且EX3已解锁时，返回50（表示反弹50%伤害）
 * @param {Object} memberData - 玩家/队友数据对象
 * @returns {number} 受伤反弹百分比（0表示未激活或未解锁）
 */
export function getShieldAwakeningDamageReflect (memberData) {
  try {
    const buff = findActiveShieldAwakeningBuff(memberData)
    if (!buff) return 0

    // 从BUFF效果中读取damageReflect
    const effects = buff.effects || buff.effect
    if (!effects || typeof effects !== 'object') return 0

    const reflectConfig = effects.damageReflect
    if (!reflectConfig) return 0

    const value = typeof reflectConfig === 'object' ? Number(reflectConfig.add) : Number(reflectConfig)
    return Number.isFinite(value) ? value : 0
  } catch (e) {
    console.error('[ShieldAwakening] 获取受伤反弹失败:', e)
    return 0
  }
}

// ========== 碎甲圣裁 EX3-双倍惩戒强化 ==========

/**
 * 检查碎甲圣裁EX3-双倍惩戒强化（E_EX3技能）是否已解锁
 * 解锁后，当目标有碎甲圣裁DEBUFF时，双倍惩戒触发概率*2
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isArmorBreakEx3Unlocked (player) {
  if (!player || player.class !== 'holy_knight') {
    return false
  }
  return isSkillUnlocked(player, 'holy_knight', 'E_EX3')
}

/**
 * 获取碎甲圣裁EX3提供的双倍惩戒概率倍率
 * 解锁后固定返回2（概率*2）
 * @param {Object} player - 玩家对象
 * @returns {number} 双倍惩戒概率倍率（0表示未解锁，2表示已解锁）
 */
export function getArmorBreakEx3DoubleJudgmentMultiplier (player) {
  if (!isArmorBreakEx3Unlocked(player)) {
    return 0
  }
  const skillLevel = getHolyKnightSkillLevel(player, 'E_EX3')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('holy_knight', 'E_EX3')
  if (staticSkill && typeof staticSkill.getDoubleJudgmentMultiplier === 'function') {
    return staticSkill.getDoubleJudgmentMultiplier(skillLevel)
  }
  return 2
}

// ========== 神圣壁垒 EX3-伤害分担 ==========

/**
 * 检查成员是否拥有激活的神圣壁垒BUFF
 * 神圣壁垒BUFF的key为'Q'，skillId为'holy_knight_q'
 * @param {Object} memberData - 玩家/队友数据对象
 * @returns {Object|null} 激活的神圣壁垒BUFF对象，未找到时返回null
 */
function findActiveHolyBulwarkBuff (memberData) {
  if (!memberData || !Array.isArray(memberData.activeBuffs)) {
    return null
  }
  const now = Date.now()
  for (const buff of memberData.activeBuffs) {
    if (!buff || typeof buff !== 'object') continue
    // 匹配神圣壁垒BUFF（通过key或skillId或名称）
    if (buff.key === 'Q' || buff.skillId === 'holy_knight_q' || buff.name === '神圣壁垒') {
      // 检查BUFF是否仍在持续时间内
      const endTime = buff.endTime || buff.expiresAt
      if (!endTime || endTime > now) {
        return buff
      }
    }
  }
  return null
}

/**
 * 检查成员是否已学习神圣壁垒EX3-伤害分担被动技能
 * 需同时满足：技能已解锁（等级>=190）且已学习（skills中存在O_EX3且等级>=1）
 * @param {Object} memberData - 玩家/队友数据对象
 * @returns {boolean} 是否已学习神圣壁垒EX3
 */
function isHolyBulwarkEx3Learned (memberData) {
  if (!memberData || !memberData.skills) return false
  if (!isSkillUnlocked(memberData, 'holy_knight', 'O_EX3')) return false
  const skillLevel = getHolyKnightSkillLevel(memberData, 'O_EX3')
  return skillLevel >= 1
}

/**
 * 查找神圣壁垒EX3-伤害分担的施法者
 * 当队伍中某成员拥有激活的神圣壁垒BUFF且已学习EX3被动技能时，该成员为伤害分担施法者
 * 仅在副本页面调用（主页面无队友，不会触发此函数）
 * @param {Array<Object>} allAliveMembers - 所有存活队伍成员（含队长和队友）
 * @param {Object} targetData - 当前受到伤害的目标数据对象
 * @returns {Object|null} 伤害分担施法者数据对象，未找到时返回null
 */
export function findHolyBulwarkDamageShareCaster (allAliveMembers, targetData) {
  if (!Array.isArray(allAliveMembers) || allAliveMembers.length <= 1) return null

  try {
    for (const member of allAliveMembers) {
      if (!member || member === targetData || member.currentHealth <= 0) continue

      // 检查该成员是否有激活的神圣壁垒BUFF
      const bulwarkBuff = findActiveHolyBulwarkBuff(member)
      if (!bulwarkBuff) continue

      // 检查该成员是否已学习神圣壁垒EX3
      if (!isHolyBulwarkEx3Learned(member)) continue

      // 该成员为伤害分担施法者
      return member
    }
  } catch (e) {
    console.error('[HolyBulwarkEX3] 查找伤害分担施法者失败:', e)
  }

  return null
}

/**
 * 获取神圣壁垒EX3-伤害分担百分比
 * 当施法者拥有激活的神圣壁垒BUFF且已学习EX3时，返回15（表示15%伤害由施法者分担）
 * @param {Object} casterData - 施法者数据对象
 * @returns {number} 伤害分担百分比（0表示未激活或未学习）
 */
export function getHolyBulwarkDamageSharePercent (casterData) {
  try {
    if (!casterData) return 0
    const buff = findActiveHolyBulwarkBuff(casterData)
    if (!buff) return 0
    if (!isHolyBulwarkEx3Learned(casterData)) return 0

    // 优先从BUFF效果中读取damageShare
    const effects = buff.effects || buff.effect
    if (effects && typeof effects === 'object') {
      const shareConfig = effects.damageShare
      if (shareConfig) {
        const value = typeof shareConfig === 'object' ? Number(shareConfig.add) : Number(shareConfig)
        if (Number.isFinite(value) && value > 0) return value
      }
    }

    // 回退到静态技能配置
    const staticSkill = getSkill('holy_knight', 'O_EX3')
    if (staticSkill && typeof staticSkill.getDamageSharePercent === 'function') {
      return staticSkill.getDamageSharePercent(1)
    }
    return 15
  } catch (e) {
    console.error('[HolyBulwarkEX3] 获取伤害分担百分比失败:', e)
    return 0
  }
}
