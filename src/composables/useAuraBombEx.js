/**
 * @file useAuraBombEx.js
 * @description 念气能量弹EX被动技能组合式函数
 * 提供念气能量弹EX1-CD减少（U_EX1技能）和念气能量弹EX2-伤害增加（U_EX2技能）的加成计算
 *
 * 业务意图：
 * - 念气能量弹EX1-CD减少：1级即为最大熟练度，固定减少念气能量弹技能CD 50%
 * - 念气能量弹EX2-伤害增加：1级即为最大熟练度，固定增加念气能量弹技能伤害 50%（185级解锁）
 * - 两个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-21
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 念气能量弹EX1固定CD减少百分比（50%）
 */
export const AURA_BOMB_EX1_CD_REDUCTION = 50

/**
 * 念气能量弹EX2固定伤害增加百分比（50%）
 */
export const AURA_BOMB_EX2_DAMAGE_BONUS = 50

/**
 * 获取念气能量弹EX1-CD减少被动技能的CD减少百分比
 * U_EX1 已改为1级满级，固定减少念气能量弹技能CD 50%
 * 仅当技能已解锁（格斗宗师175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getAuraBombCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查念气能量弹EX1-CD减少（U_EX1技能）是否已解锁（格斗宗师175级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'U_EX1')) {
    return 0
  }
  // 念气能量弹EX1-CD减少 存储在 player.skills.U_EX1
  const playerSkill = player.skills.U_EX1
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
  const staticSkill = getSkill('combat_master', 'U_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  // 回退到固定常量
  return AURA_BOMB_EX1_CD_REDUCTION
}

/**
 * 获取念气能量弹EX2-伤害增加被动技能的伤害增加百分比
 * U_EX2 已改为1级满级，固定增加念气能量弹技能伤害 50%
 * 仅当技能已解锁（格斗宗师185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getAuraBombDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查念气能量弹EX2-伤害增加（U_EX2技能）是否已解锁（格斗宗师185级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'U_EX2')) {
    return 0
  }
  // 念气能量弹EX2-伤害增加 存储在 player.skills.U_EX2
  const playerSkill = player.skills.U_EX2
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
  const staticSkill = getSkill('combat_master', 'U_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  // 回退到固定常量
  return AURA_BOMB_EX2_DAMAGE_BONUS
}

/**
 * 计算应用念气能量弹EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getAuraBombEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getAuraBombCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
