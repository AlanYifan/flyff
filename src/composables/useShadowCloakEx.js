/**
 * @file useShadowCloakEx.js
 * @description 暗影斗篷EX被动技能组合式函数
 * 提供暗影斗篷EX1-CD减少（R_EX1技能）、暗影斗篷EX2-增加闪避次数（R_EX2技能）和暗影斗篷EX3-增加爆伤（R_EX3技能）的加成计算
 *
 * 业务意图：
 * - 暗影斗篷EX1-CD减少：1级即为最大熟练度，固定减少暗影斗篷技能CD 50%（175级解锁）
 * - 暗影斗篷EX2-增加闪避次数：1级即为最大熟练度，释放暗影斗篷期间可闪避3次所有伤害（180级解锁）
 * - 暗影斗篷EX3-增加爆伤：1级即为最大熟练度，释放暗影斗篷期间增加15%暴击伤害（190级解锁）
 * - 三个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-28
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 暗影斗篷EX1固定CD减少百分比（50%）
 */
export const SHADOW_CLOAK_EX1_CD_REDUCTION = 50

/**
 * 暗影斗篷EX2固定闪避次数（3次）
 */
export const SHADOW_CLOAK_EX2_EVADE_COUNT = 3

/**
 * 暗影斗篷EX3固定暴击伤害加成百分比（15%）
 */
export const SHADOW_CLOAK_EX3_CRIT_DAMAGE_BONUS = 15

/**
 * 获取暗影斗篷EX1-CD减少被动技能的CD减少百分比
 * R_EX1 1级即为满级，固定减少暗影斗篷技能CD 50%
 * 仅当技能已解锁（暗夜主宰175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getShadowCloakCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'R_EX1')) {
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

  const staticSkill = getSkill('joker_emperor', 'R_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return SHADOW_CLOAK_EX1_CD_REDUCTION
}

/**
 * 计算应用暗影斗篷EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getShadowCloakEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getShadowCloakCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取暗影斗篷EX2-增加闪避次数被动技能的闪避次数
 * R_EX2 1级即为满级，固定3次闪避
 * 仅当技能已解锁（暗夜主宰180级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 闪避次数（0 或 3）
 */
export function getShadowCloakEvadeCount (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'R_EX2')) {
    return 0
  }
  const playerSkill = player.skills.R_EX2
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

  const staticSkill = getSkill('joker_emperor', 'R_EX2')
  if (staticSkill && typeof staticSkill.getEvadeCount === 'function') {
    return staticSkill.getEvadeCount(skillLevel)
  }
  return SHADOW_CLOAK_EX2_EVADE_COUNT
}

/**
 * 获取暗影斗篷EX3-增加爆伤被动技能的暴击伤害加成百分比
 * R_EX3 1级即为满级，固定增加15%暴击伤害
 * 仅当技能已解锁（暗夜主宰190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 暴击伤害加成百分比（0 或 15）
 */
export function getShadowCloakCritDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'joker_emperor', 'R_EX3')) {
    return 0
  }
  const playerSkill = player.skills.R_EX3
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

  const staticSkill = getSkill('joker_emperor', 'R_EX3')
  if (staticSkill && typeof staticSkill.getCriticalDamageBonus === 'function') {
    return staticSkill.getCriticalDamageBonus(skillLevel)
  }
  return SHADOW_CLOAK_EX3_CRIT_DAMAGE_BONUS
}
