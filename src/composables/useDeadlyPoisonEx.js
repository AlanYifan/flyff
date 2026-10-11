/**
 * @file useDeadlyPoisonEx.js
 * @description 致命毒刃EX被动技能组合式函数
 * 提供致命毒刃EX1-CD减少（E_EX1技能）和致命毒刃EX2-伤害增加（E_EX2技能）的加成计算
 *
 * 业务意图：
 * - 致命毒刃EX1-CD减少：1级即为最大熟练度，固定减少致命毒刃技能CD 50%（175级解锁）
 * - 致命毒刃EX2-伤害增加：1级即为最大熟练度，固定增加致命毒刃技能伤害 50%（185级解锁）
 * - 两个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-27
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 致命毒刃EX1固定CD减少百分比（50%）
 */
export const DEADLY_POISON_EX1_CD_REDUCTION = 50

/**
 * 致命毒刃EX2固定伤害增加百分比（50%）
 */
export const DEADLY_POISON_EX2_DAMAGE_BONUS = 50

/**
 * 获取致命毒刃EX1-CD减少被动技能的CD减少百分比
 * E_EX1 1级即为满级，固定减少致命毒刃技能CD 50%
 * 仅当技能已解锁（暗夜主宰175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getDeadlyPoisonCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'E_EX1')) {
    return 0
  }
  const playerSkill = player.skills.E_EX1
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
  const staticSkill = getSkill('joker_emperor', 'E_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return DEADLY_POISON_EX1_CD_REDUCTION
}

/**
 * 获取致命毒刃EX2-伤害增加被动技能的伤害增加百分比
 * E_EX2 1级即为满级，固定增加致命毒刃技能伤害 50%
 * 仅当技能已解锁（暗夜主宰185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getDeadlyPoisonDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'E_EX2')) {
    return 0
  }
  const playerSkill = player.skills.E_EX2
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
  const staticSkill = getSkill('joker_emperor', 'E_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return DEADLY_POISON_EX2_DAMAGE_BONUS
}

/**
 * 计算应用致命毒刃EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getDeadlyPoisonEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getDeadlyPoisonCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
