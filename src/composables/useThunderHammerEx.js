/**
 * @file useThunderHammerEx.js
 * @description 雷神之锤EX被动技能组合式函数
 * 提供雷神之锤EX1-CD减少（O_EX1技能）、雷神之锤EX2-伤害增加（O_EX2技能）和雷神之锤EX3-倍攻（O_EX3技能）的加成计算
 *
 * 业务意图：
 * - 雷神之锤EX1-CD减少：1级即为最大熟练度，固定减少雷神之锤技能CD 50%（175级解锁）
 * - 雷神之锤EX2-伤害增加：1级即为最大熟练度，固定增加雷神之锤技能伤害 50%（185级解锁）
 * - 雷神之锤EX3-倍攻：1级即为最大熟练度，概率触发倍攻伤害（190级解锁）
 *   50%概率造成1.5倍伤害、25%概率造成2倍伤害、10%概率造成3倍伤害
 * - 三个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-29
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 雷神之锤EX1固定CD减少百分比（50%）
 */
export const THUNDER_HAMMER_EX1_CD_REDUCTION = 50

/**
 * 雷神之锤EX2固定伤害增加百分比（50%）
 */
export const THUNDER_HAMMER_EX2_DAMAGE_BONUS = 50

/**
 * 雷神之锤EX3倍攻触发概率配置
 * chance1_5x: 50%概率造成1.5倍伤害
 * chance2x: 25%概率造成2倍伤害
 * chance3x: 10%概率造成3倍伤害
 */
export const THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER = Object.freeze({
  chance1_5x: 50,
  chance2x: 25,
  chance3x: 10
})

/**
 * 获取雷神之锤EX1-CD减少被动技能的CD减少百分比
 * O_EX1 1级即为满级，固定减少雷神之锤技能CD 50%
 * 仅当技能已解锁（炽天使175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getThunderHammerCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'nature_messenger', 'T_EX1')) {
    return 0
  }
  const playerSkill = player.skills.T_EX1
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('nature_messenger', 'T_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return THUNDER_HAMMER_EX1_CD_REDUCTION
}

/**
 * 获取雷神之锤EX2-伤害增加被动技能的伤害增加百分比
 * O_EX2 1级即为满级，固定增加雷神之锤技能伤害 50%
 * 仅当技能已解锁（炽天使185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getThunderHammerDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'nature_messenger', 'T_EX2')) {
    return 0
  }
  const playerSkill = player.skills.T_EX2
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('nature_messenger', 'T_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return THUNDER_HAMMER_EX2_DAMAGE_BONUS
}

/**
 * 计算应用雷神之锤EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getThunderHammerEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getThunderHammerCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取雷神之锤EX3-倍攻被动技能的触发信息
 * O_EX3 1级即为满级，概率触发倍攻伤害
 * 仅当技能已解锁（炽天使190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻触发信息 { unlocked: boolean, multiplier: number, chance1_5x: number, chance2x: number, chance3x: number }
 *   - unlocked: EX3是否已解锁
 *   - multiplier: 本次触发的伤害倍率（1=未触发，1.5/2/3=触发倍攻），每次调用随机滚动
 *   - chance1_5x/chance2x/chance3x: 各倍率触发概率
 */
export function getThunderHammerCriticalMultiplierInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,
    chance1_5x: THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER.chance1_5x,
    chance2x: THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER.chance2x,
    chance3x: THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER.chance3x
  }

  if (!player || !player.skills) {
    return result
  }

  if (!isSkillUnlocked(player, 'nature_messenger', 'T_EX3')) {
    return result
  }

  const playerSkill = player.skills.T_EX3
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
  const staticSkill = getSkill('nature_messenger', 'T_EX3')
  let chances = THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER
  if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
    chances = staticSkill.getCriticalMultiplier(skillLevel)
  }
  result.chance1_5x = chances.chance1_5x
  result.chance2x = chances.chance2x
  result.chance3x = chances.chance3x

  // 随机滚动倍攻概率：10%概率3倍 → 25%概率2倍 → 50%概率1.5倍
  const roll = Math.random() * 100
  if (roll < result.chance3x) {
    result.multiplier = 3
  } else if (roll < result.chance3x + result.chance2x) {
    result.multiplier = 2
  } else if (roll < result.chance3x + result.chance2x + result.chance1_5x) {
    result.multiplier = 1.5
  }

  return result
}
