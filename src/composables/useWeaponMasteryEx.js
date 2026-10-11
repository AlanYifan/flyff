/**
 * @file useWeaponMasteryEx.js
 * @description 武器精通-飞轮EX被动技能组合式函数
 * 提供武器精通-飞轮EX1-伤害增加（I_EX1技能）和武器精通-飞轮EX2-伤害增加（I_EX2技能）的加成计算
 *
 * 业务意图：
 * - 武器精通-飞轮EX1-伤害增加：1级即为最大熟练度，固定增加武器基础伤害50%（175级解锁）
 * - 武器精通-飞轮EX2-伤害增加：1级即为最大熟练度，固定增加武器基础伤害100%（190级解锁）
 * - 两个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-27
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 武器精通-飞轮EX1固定武器攻击力加成百分比（50%）
 */
export const WEAPON_MASTERY_EX1_ATTACK_BONUS = 50

/**
 * 武器精通-飞轮EX2固定武器攻击力加成百分比（100%）
 */
export const WEAPON_MASTERY_EX2_ATTACK_BONUS = 100

/**
 * 获取武器精通-飞轮EX1-伤害增加被动技能的武器攻击力加成百分比
 * I_EX1 1级即为满级，固定增加武器基础伤害50%
 * 仅当技能已解锁（暗夜主宰175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 武器攻击力加成百分比（0 或 50）
 */
export function getWeaponMasteryEx1AttackBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'I_EX1')) {
    return 0
  }
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
  const staticSkill = getSkill('joker_emperor', 'I_EX1')
  if (staticSkill && typeof staticSkill.getWeaponAttackBonus === 'function') {
    return staticSkill.getWeaponAttackBonus(skillLevel)
  }
  return WEAPON_MASTERY_EX1_ATTACK_BONUS
}

/**
 * 获取武器精通-飞轮EX2-伤害增加被动技能的武器攻击力加成百分比
 * I_EX2 1级即为满级，固定增加武器基础伤害100%
 * 仅当技能已解锁（暗夜主宰190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 武器攻击力加成百分比（0 或 100）
 */
export function getWeaponMasteryEx2AttackBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'I_EX2')) {
    return 0
  }
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
  const staticSkill = getSkill('joker_emperor', 'I_EX2')
  if (staticSkill && typeof staticSkill.getWeaponAttackBonus === 'function') {
    return staticSkill.getWeaponAttackBonus(skillLevel)
  }
  return WEAPON_MASTERY_EX2_ATTACK_BONUS
}
