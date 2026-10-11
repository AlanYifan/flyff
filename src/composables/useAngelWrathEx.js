/**
 * @file useAngelWrathEx.js
 * @description 天使之怒EX被动技能组合式函数
 * 提供天使之怒EX1-CD减少（U_EX1技能）和天使之怒EX3-多段攻击（U_EX3技能）的加成计算
 *
 * 业务意图：
 * - 天使之怒EX1-CD减少：1级即为最大熟练度，固定减少天使之怒技能CD 50%（175级解锁）
 * - 天使之怒EX3-多段攻击：1级即为最大熟练度，概率触发多段额外伤害（190级解锁）
 * - 被动技能需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-29
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 天使之怒EX1固定CD减少百分比（50%）
 */
export const ANGEL_WRATH_EX1_CD_REDUCTION = 50

/**
 * 获取天使之怒EX1-CD减少被动技能的CD减少百分比
 * U_EX1 1级即为满级，固定减少天使之怒技能CD 50%
 * 仅当技能已解锁（炽天使175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getAngelWrathCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  if (!isSkillUnlocked(player, 'nature_messenger', 'U_EX1')) {
    return 0
  }
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
  const staticSkill = getSkill('nature_messenger', 'U_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return ANGEL_WRATH_EX1_CD_REDUCTION
}

/**
 * 计算应用天使之怒EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getAngelWrathEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getAngelWrathCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 天使之怒EX3多段攻击触发概率配置
 * 50%概率触发1段，25%概率触发2段，10%概率触发3段
 * 概率为逐级包含关系：50%包含25%和10%
 */
export const ANGEL_WRATH_EX3_MULTI_HIT = {
  chance1: 50,
  chance2: 25,
  chance3: 10
}

/**
 * 获取天使之怒EX3-多段攻击被动技能的触发信息
 * U_EX3 1级即为满级，概率触发多段额外伤害
 * 仅当技能已解锁（炽天使190级）且熟练度等级>=1时生效
 * 概率为逐级包含关系：50%包含25%和10%
 * @param {Object} player - 玩家对象
 * @returns {Object} 多段攻击触发信息 { unlocked: boolean, extraHits: number, chance1: number, chance2: number, chance3: number }
 *   - unlocked: EX3是否已解锁
 *   - extraHits: 本次触发额外伤害次数（0~3），每次调用随机滚动
 *   - chance1/chance2/chance3: 各段触发概率
 */
export function getAngelWrathMultiHitInfo (player) {
  const result = {
    unlocked: false,
    extraHits: 0,
    chance1: ANGEL_WRATH_EX3_MULTI_HIT.chance1,
    chance2: ANGEL_WRATH_EX3_MULTI_HIT.chance2,
    chance3: ANGEL_WRATH_EX3_MULTI_HIT.chance3
  }

  if (!player || !player.skills) {
    return result
  }

  // 检查天使之怒EX3-多段攻击（U_EX3技能）是否已解锁（炽天使190级解锁）
  if (!isSkillUnlocked(player, 'nature_messenger', 'U_EX3')) {
    return result
  }

  // 天使之怒EX3-多段攻击 存储在 player.skills.U_EX3
  const playerSkill = player.skills.U_EX3
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
  const staticSkill = getSkill('nature_messenger', 'U_EX3')
  let chances = ANGEL_WRATH_EX3_MULTI_HIT
  if (staticSkill && typeof staticSkill.getMultiHitChance === 'function') {
    chances = staticSkill.getMultiHitChance(skillLevel)
  }
  result.chance1 = chances.chance1
  result.chance2 = chances.chance2
  result.chance3 = chances.chance3

  // 随机滚动多段攻击触发次数
  // 概率为逐级包含关系：先滚3段（10%），再滚2段（25%），再滚1段（50%）
  const roll = Math.random() * 100
  if (roll < chances.chance3) {
    result.extraHits = 3
  } else if (roll < chances.chance2) {
    result.extraHits = 2
  } else if (roll < chances.chance1) {
    result.extraHits = 1
  } else {
    result.extraHits = 0
  }

  return result
}
