/**
 * @file useShadowRazeEx.js
 * @description 暗影突袭EX被动技能组合式函数
 * 提供暗影突袭EX1-CD减少（W_EX技能）、暗影突袭EX2-伤害增加（W_EX2技能）和暗影突袭EX3-倍攻（W_EX3技能）的加成计算
 *
 * 业务意图：
 * - 暗影突袭EX1-CD减少：1级即为最大熟练度，固定减少暗影突袭技能CD 50%（175级解锁）
 * - 暗影突袭EX2-伤害增加：1级即为最大熟练度，固定增加暗影突袭技能伤害 50%（185级解锁）
 * - 暗影突袭EX3-倍攻：1级即为最大熟练度，概率触发倍攻伤害（190级解锁）
 *   30%概率造成2倍伤害、20%概率造成3倍伤害、10%概率造成5倍伤害
 * - 三个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-27
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 暗影突袭EX1固定CD减少百分比（50%）
 */
export const SHADOW_RAZE_EX1_CD_REDUCTION = 50

/**
 * 暗影突袭EX2固定伤害增加百分比（50%）
 */
export const SHADOW_RAZE_EX2_DAMAGE_BONUS = 50

/**
 * 暗影突袭EX3倍攻触发概率配置
 * chance2x: 30%概率造成2倍伤害
 * chance3x: 20%概率造成3倍伤害
 * chance5x: 10%概率造成5倍伤害
 */
export const SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER = Object.freeze({
  chance2x: 30,
  chance3x: 20,
  chance5x: 10
})

/**
 * 获取暗影突袭EX1-CD减少被动技能的CD减少百分比
 * W_EX 1级即为满级，固定减少暗影突袭技能CD 50%
 * 仅当技能已解锁（暗夜主宰175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getShadowRazeCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'W_EX')) {
    return 0
  }
  const playerSkill = player.skills.W_EX
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
  const staticSkill = getSkill('joker_emperor', 'W_EX')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return SHADOW_RAZE_EX1_CD_REDUCTION
}

/**
 * 获取暗影突袭EX2-伤害增加被动技能的伤害增加百分比
 * W_EX2 1级即为满级，固定增加暗影突袭技能伤害 50%
 * 仅当技能已解锁（暗夜主宰185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getShadowRazeDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'W_EX2')) {
    return 0
  }
  const playerSkill = player.skills.W_EX2
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
  const staticSkill = getSkill('joker_emperor', 'W_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return SHADOW_RAZE_EX2_DAMAGE_BONUS
}

/**
 * 计算应用暗影突袭EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getShadowRazeEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getShadowRazeCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取暗影突袭EX3-倍攻被动技能的触发信息
 * W_EX3 1级即为满级，概率触发倍攻伤害
 * 仅当技能已解锁（暗夜主宰190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {Object} 倍攻触发信息 { unlocked: boolean, multiplier: number, chance2x: number, chance3x: number, chance5x: number }
 *   - unlocked: EX3是否已解锁
 *   - multiplier: 本次触发的伤害倍率（1=未触发，2/3/5=触发倍攻），每次调用随机滚动
 *   - chance2x/chance3x/chance5x: 各倍率触发概率
 */
export function getShadowRazeCriticalMultiplierInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,
    chance2x: SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER.chance2x,
    chance3x: SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER.chance3x,
    chance5x: SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER.chance5x
  }

  if (!player || !player.skills) {
    return result
  }

  if (!isSkillUnlocked(player, 'joker_emperor', 'W_EX3')) {
    return result
  }

  const playerSkill = player.skills.W_EX3
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

  // 随机滚动倍攻概率：10%概率5倍 → 20%概率3倍 → 30%概率2倍
  const roll = Math.random() * 100
  if (roll < result.chance5x) {
    result.multiplier = 5
  } else if (roll < result.chance5x + result.chance3x) {
    result.multiplier = 3
  } else if (roll < result.chance5x + result.chance3x + result.chance2x) {
    result.multiplier = 2
  }

  return result
}
