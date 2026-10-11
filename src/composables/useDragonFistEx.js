/**
 * @file useDragonFistEx.js
 * @description 龙拳-破劲EX被动技能组合式函数
 * 提供龙拳-破劲EX1-CD减少（E_EX1技能）和龙拳-破劲EX2-伤害增加（E_EX2技能）的加成计算
 *
 * 业务意图：
 * - 龙拳-破劲EX1-CD减少：1级即为最大熟练度，固定减少龙拳-破劲技能CD 50%（175级解锁）
 * - 龙拳-破劲EX2-伤害增加：1级即为最大熟练度，固定增加龙拳-破劲技能伤害 50%（185级解锁）
 * - 两个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-22
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 龙拳-破劲EX1固定CD减少百分比（50%）
 */
export const DRAGON_FIST_EX1_CD_REDUCTION = 50

/**
 * 龙拳-破劲EX2固定伤害增加百分比（50%）
 */
export const DRAGON_FIST_EX2_DAMAGE_BONUS = 50

/**
 * 获取龙拳-破劲EX1-CD减少被动技能的CD减少百分比
 * E_EX1 已改为1级满级，固定减少龙拳-破劲技能CD 50%
 * 仅当技能已解锁（格斗宗师175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getDragonFistCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查龙拳-破劲EX1-CD减少（E_EX1技能）是否已解锁（格斗宗师175级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'E_EX1')) {
    return 0
  }
  // 龙拳-破劲EX1-CD减少 存储在 player.skills.E_EX1
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
  // 使用静态技能对象的 getCdReduction 方法获取加成值
  const staticSkill = getSkill('combat_master', 'E_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  // 回退到固定常量
  return DRAGON_FIST_EX1_CD_REDUCTION
}

/**
 * 获取龙拳-破劲EX2-伤害增加被动技能的伤害增加百分比
 * E_EX2 已改为1级满级，固定增加龙拳-破劲技能伤害 50%
 * 仅当技能已解锁（格斗宗师185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getDragonFistDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查龙拳-破劲EX2-伤害增加（E_EX2技能）是否已解锁（格斗宗师185级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'E_EX2')) {
    return 0
  }
  // 龙拳-破劲EX2-伤害增加 存储在 player.skills.E_EX2
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
  // 使用静态技能对象的 getDamageBonus 方法获取加成值
  const staticSkill = getSkill('combat_master', 'E_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  // 回退到固定常量
  return DRAGON_FIST_EX2_DAMAGE_BONUS
}

/**
 * 计算应用龙拳-破劲EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getDragonFistEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getDragonFistCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
