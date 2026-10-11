/**
 * @file useAngelWingsEx.js
 * @description 天使之翼EX被动技能组合式函数
 * 提供天使之翼EX1-魔法防御力加成（R_EX1技能）的加成计算
 *
 * 业务意图：
 * - 天使之翼EX1-魔法防御力加成：1级即为最大熟练度，固定提供全队魔法防御+1000（175级解锁）
 * - 被动技能需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-29
 * 修改时间：2026-07-29 - EX1从CD减少更改为魔法防御力加成
 * 修改时间：2026-07-29 - EX1从魔法防御20%更改为魔法防御固定值1000
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 天使之翼EX1固定魔法防御加成（1000）
 */
export const ANGEL_WINGS_EX1_MAGIC_DEFENSE = 1000

/**
 * 获取天使之翼EX1-魔法防御力加成被动技能的魔法防御固定值
 * R_EX1 1级即为满级，固定提供全队魔法防御+1000
 * 仅当技能已解锁（炽天使175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 魔法防御固定值加成（0 或 1000）
 */
export function getAngelWingsMagicDefense (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'nature_messenger', 'R_EX1')) {
    return 0
  }
  const playerSkill = player.skills.R_EX1
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
  const staticSkill = getSkill('nature_messenger', 'R_EX1')
  if (staticSkill && typeof staticSkill.getMagicDefenseBonus === 'function') {
    return staticSkill.getMagicDefenseBonus(skillLevel)
  }
  return ANGEL_WINGS_EX1_MAGIC_DEFENSE
}
