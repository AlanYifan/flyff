/**
 * @file usePiercingWindEx.js
 * @description 狂风绝刃EX被动技能组合式函数
 * 提供狂风绝刃EX1-CD减少（W_EX技能）、狂风绝刃EX2-伤害增加（W_EX2技能）和狂风绝刃EX3-倍攻（W_EX3技能）的加成计算
 *
 * 业务意图：
 * - 狂风绝刃EX1-CD减少：1级即为最大熟练度，固定减少狂风绝刃技能CD 50%（175级解锁）
 * - 狂风绝刃EX2-伤害增加：1级即为最大熟练度，固定增加狂风绝刃技能伤害 50%（185级解锁）
 * - 狂风绝刃EX3-倍攻：1级即为最大熟练度，概率触发倍攻伤害（190级解锁）
 *   50%概率造成1.5倍伤害、25%概率造成2倍伤害、10%概率造成3倍伤害
 * - 三个被动技能均需玩家达到对应等级并学习后才生效
 *
 * 创建时间：2026-08-01
 * 更新时间：2026-08-02 — 技能从“穿风斩”重命名为“狂风绝刃”（技能名称优化）
 * 历史记录：2026-08-01 — 技能从“穿风箭”重命名为“穿风斩”（刀锋战士进阶职业调整）
 */

import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 狂风绝刃EX1固定CD减少百分比（50%）
 */
export const PIERCING_WIND_EX1_CD_REDUCTION = 50

/**
 * 狂风绝刃EX2固定伤害增加百分比（50%）
 */
export const PIERCING_WIND_EX2_DAMAGE_BONUS = 50

/**
 * 狂风绝刃EX3倍攻触发概率配置
 * chance1_5x: 50%概率造成1.5倍伤害
 * chance2x: 25%概率造成2倍伤害
 * chance3x: 10%概率造成3倍伤害
 */
export const PIERCING_WIND_EX3_CRITICAL_MULTIPLIER = Object.freeze({
  chance1_5x: 50,
  chance2x: 25,
  chance3x: 10
})

/**
 * 获取狂风绝刃EX1-CD减少被动技能的CD减少百分比
 * W_EX 1级即为满级，固定减少狂风绝刃技能CD 50%
 * 仅当技能已解锁（风暴行者175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getPiercingWindCdReduction (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查狂风绝刃EX1-CD减少（W_EX技能）是否已解锁（风暴行者175级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'W_EX')) {
    return 0
  }
  // 狂风绝刃EX1-CD减少 存储在 player.skills.W_EX
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
  const staticSkill = getSkill('storm_walker', 'W_EX')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  // 回退到固定常量
  return PIERCING_WIND_EX1_CD_REDUCTION
}

/**
 * 获取狂风绝刃EX2-伤害增加被动技能的伤害增加百分比
 * W_EX2 1级即为满级，固定增加狂风绝刃技能伤害 50%
 * 仅当技能已解锁（风暴行者185级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getPiercingWindDamageBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查狂风绝刃EX2-伤害增加（W_EX2技能）是否已解锁（风暴行者185级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'W_EX2')) {
    return 0
  }
  // 狂风绝刃EX2-伤害增加 存储在 player.skills.W_EX2
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
  const staticSkill = getSkill('storm_walker', 'W_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  // 回退到固定常量
  return PIERCING_WIND_EX2_DAMAGE_BONUS
}

/**
 * 获取狂风绝刃EX3-倍攻被动技能的倍攻触发信息
 * W_EX3 1级即为满级，固定返回倍攻概率配置
 * 仅当技能已解锁（风暴行者190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {{ unlocked: boolean, multiplier: number }} 倍攻触发信息
 */
export function getPiercingWindCriticalMultiplierInfo (player) {
  if (!player || !player.skills) {
    return { unlocked: false, multiplier: 1 }
  }
  // 检查狂风绝刃EX3-倍攻（W_EX3技能）是否已解锁（风暴行者190级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'W_EX3')) {
    return { unlocked: false, multiplier: 1 }
  }
  // 狂风绝刃EX3-倍攻 存储在 player.skills.W_EX3
  const playerSkill = player.skills.W_EX3
  if (!playerSkill) {
    return { unlocked: false, multiplier: 1 }
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return { unlocked: false, multiplier: 1 }
  }

  // 使用静态技能对象的 getCriticalMultiplier 方法获取概率配置
  const staticSkill = getSkill('storm_walker', 'W_EX3')
  const chances = staticSkill && typeof staticSkill.getCriticalMultiplier === 'function'
    ? staticSkill.getCriticalMultiplier(skillLevel)
    : PIERCING_WIND_EX3_CRITICAL_MULTIPLIER

  // 根据概率决定倍攻倍率
  const roll = Math.random() * 100
  if (roll < chances.chance3x) {
    return { unlocked: true, multiplier: 3 }
  }
  if (roll < chances.chance2x) {
    return { unlocked: true, multiplier: 2 }
  }
  if (roll < chances.chance1_5x) {
    return { unlocked: true, multiplier: 1.5 }
  }
  return { unlocked: true, multiplier: 1 }
}

/**
 * 计算应用狂风绝刃EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getPiercingWindEffectiveCooldown (player, baseCooldownSeconds) {
  const reduction = getPiercingWindCdReduction(player)
  if (reduction <= 0) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
