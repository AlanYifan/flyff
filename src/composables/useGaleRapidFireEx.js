/**
 * @file useGaleRapidFireEx.js
 * @description 狂风连射EX被动技能组合式函数
 * 提供狂风连射EX1-CD减少（I_EX1技能）和狂风连射EX2-伤害增加（I_EX2技能）的加成计算
 *
 * 业务意图：
 * - 狂风连射EX1-CD减少：1级即为最大熟练度，固定减少狂风连射技能CD 50%
 * - 狂风连射EX2-伤害增加：1级即为最大熟练度，固定增加狂风连射技能伤害 50%
 * - 两个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-19
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 狂风连射EX1固定CD减少百分比（50%）
 */
export const GALE_RAPID_FIRE_EX1_CD_REDUCTION = 50

/**
 * 狂风连射EX2固定伤害增加百分比（50%）
 */
export const GALE_RAPID_FIRE_EX2_DAMAGE_BONUS = 50

/**
 * 获取狂风连射EX1-CD减少被动技能的CD减少百分比
 * I_EX1 已改为1级满级，固定减少狂风连射技能CD 50%
 * 仅当技能已解锁（爆裂射手175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getGaleRapidFireCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查狂风连射EX1-CD减少（I_EX1技能）是否已解锁（爆裂射手175级解锁）
  if (!isSkillUnlocked(player, 'fierce_shooter', 'I_EX1')) {
    return 0
  }
  // 狂风连射EX1-CD减少 存储在 player.skills.I_EX1
  const playerSkill = player.skills.I_EX1
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
  // 使用静态技能对象的 getCdReduction 方法获取加成值
  const staticSkill = getSkill('fierce_shooter', 'I_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  // 回退到固定常量
  return GALE_RAPID_FIRE_EX1_CD_REDUCTION
}

/**
 * 获取狂风连射EX2-伤害增加被动技能的伤害增加百分比
 * I_EX2 已改为1级满级，固定增加狂风连射技能伤害 50%
 * 仅当技能已解锁（爆裂射手190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getGaleRapidFireDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查狂风连射EX2-伤害增加（I_EX2技能）是否已解锁（爆裂射手190级解锁）
  if (!isSkillUnlocked(player, 'fierce_shooter', 'I_EX2')) {
    return 0
  }
  // 狂风连射EX2-伤害增加 存储在 player.skills.I_EX2
  const playerSkill = player.skills.I_EX2
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
  // 使用静态技能对象的 getDamageBonus 方法获取加成值
  const staticSkill = getSkill('fierce_shooter', 'I_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  // 回退到固定常量
  return GALE_RAPID_FIRE_EX2_DAMAGE_BONUS
}

/**
 * 计算应用狂风连射EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getGaleRapidFireEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getGaleRapidFireCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
