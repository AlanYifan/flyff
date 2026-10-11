/**
 * @file useNensphereEx.js
 * @description 龟派气功EX被动技能组合式函数
 * 提供龟派气功EX1-CD减少（W_EX技能）、龟派气功EX2-伤害增加（W_EX2技能）和龟派气功EX3-多段伤害（W_EX3技能）的加成计算
 *
 * 业务意图：
 * - 龟派气功EX1-CD减少：1级即为最大熟练度，固定减少龟派气功技能CD 50%（175级解锁）
 * - 龟派气功EX2-伤害增加：1级即为最大熟练度，固定增加龟派气功技能伤害 50%（185级解锁）
 * - 龟派气功EX3-多段伤害：1级即为最大熟练度，概率触发多段额外伤害（190级解锁）
 *   30%概率触发1段（多触发一次）、15%概率触发2段（多触发两次）、5%概率触发3段（多触发三次）
 * - 三个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-07-21
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 龟派气功EX1固定CD减少百分比（50%）
 */
export const NENSPHERE_EX1_CD_REDUCTION = 50

/**
 * 龟派气功EX2固定伤害增加百分比（50%）
 */
export const NENSPHERE_EX2_DAMAGE_BONUS = 50

/**
 * 龟派气功EX3多段伤害触发概率配置
 * chance1: 30%概率触发1段伤害（多触发一次额外伤害）
 * chance2: 15%概率触发2段伤害（多触发两次额外伤害）
 * chance3: 5%概率触发3段伤害（多触发三次额外伤害）
 * 概率为逐级包含关系：30%包含15%和5%
 */
export const NENSPHERE_EX3_MULTI_HIT = Object.freeze({
  chance1: 30,
  chance2: 15,
  chance3: 5
})

/**
 * 获取龟派气功EX1-CD减少被动技能的CD减少百分比
 * W_EX 已改为1级满级，固定减少龟派气功技能CD 50%
 * 仅当技能已解锁（格斗宗师175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getNensphereCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查龟派气功EX1-CD减少（W_EX技能）是否已解锁（格斗宗师175级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'W_EX')) {
    return 0
  }
  // 龟派气功EX1-CD减少 存储在 player.skills.W_EX
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
  // 使用静态技能对象的 getCdReduction 方法获取加成值
  const staticSkill = getSkill('combat_master', 'W_EX')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  // 回退到固定常量
  return NENSPHERE_EX1_CD_REDUCTION
}

/**
 * 获取龟派气功EX2-伤害增加被动技能的伤害增加百分比
 * W_EX2 已改为1级满级，固定增加龟派气功技能伤害 50%
 * 仅当技能已解锁（格斗宗师185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getNensphereDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查龟派气功EX2-伤害增加（W_EX2技能）是否已解锁（格斗宗师185级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'W_EX2')) {
    return 0
  }
  // 龟派气功EX2-伤害增加 存储在 player.skills.W_EX2
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
  // 使用静态技能对象的 getDamageBonus 方法获取加成值
  const staticSkill = getSkill('combat_master', 'W_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  // 回退到固定常量
  return NENSPHERE_EX2_DAMAGE_BONUS
}

/**
 * 计算应用龟派气功EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getNensphereEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getNensphereCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 获取龟派气功EX3-多段伤害被动技能的触发信息
 * W_EX3 1级即为满级，概率触发多段额外伤害
 * 仅当技能已解锁（格斗宗师190级）且熟练度等级>=1时生效
 * 概率为逐级包含关系：30%包含15%和5%
 * @param {Object} player - 玩家对象
 * @returns {Object} 多段伤害触发信息 { unlocked: boolean, extraHits: number, chance1: number, chance2: number, chance3: number }
 *   - unlocked: EX3是否已解锁
 *   - extraHits: 本次触发额外伤害次数（0~3），每次调用随机滚动
 *   - chance1/chance2/chance3: 各段触发概率
 */
export function getNensphereMultiHitInfo (player) {
  const result = {
    unlocked: false,
    extraHits: 0,
    chance1: NENSPHERE_EX3_MULTI_HIT.chance1,
    chance2: NENSPHERE_EX3_MULTI_HIT.chance2,
    chance3: NENSPHERE_EX3_MULTI_HIT.chance3
  }

  if (!player || !player.skills) {
    return result
  }

  // 检查龟派气功EX3-多段伤害（W_EX3技能）是否已解锁（格斗宗师190级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'W_EX3')) {
    return result
  }

  // 龟派气功EX3-多段伤害 存储在 player.skills.W_EX3
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

  // 获取静态技能对象的概率配置
  const staticSkill = getSkill('combat_master', 'W_EX3')
  let chances = NENSPHERE_EX3_MULTI_HIT
  if (staticSkill && typeof staticSkill.getMultiHitChance === 'function') {
    chances = staticSkill.getMultiHitChance(skillLevel)
  }
  result.chance1 = chances.chance1
  result.chance2 = chances.chance2
  result.chance3 = chances.chance3

  // 随机滚动多段伤害触发次数
  // 概率为逐级包含关系：先滚3段（5%），再滚2段（15%），再滚1段（30%）
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
