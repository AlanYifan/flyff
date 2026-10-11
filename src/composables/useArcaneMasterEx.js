/**
 * @file useArcaneMasterEx.js
 * @description 奥术师EX被动技能组合式函数
 * 提供奥术师各技能EX被动的效果计算：
 * - 虚空寂灭EX1-CD减少 / EX2-伤害增加 / EX3-法术连击
 * - 元素崩坏EX1-CD减少 / EX2-伤害增加 / EX3-元素易伤强化
 * - 奥术新星EX1-CD减少 / EX2-伤害增加 / EX3-多段攻击
 * - 奥术精通EX1-法力涌动 / EX2-元素亲和 / EX3-法术吸收
 * - 奥术充能EX1-减少触发次数 / EX2-法术连锁
 * - 奥术共鸣EX1-增强法力 / EX2-法术穿透 / EX3-法术暴击
 * - 奥术超载EX1-法力护盾 / EX2-元素共鸣 / EX3-法术反弹
 *
 * 重点：奥术充能（J技能）充能积累系统，每次普通攻击/施法增加充能值，
 * 达到触发阈值后释放法术爆发并重置。在main页面和副本页面均生效。
 *
 * 创建时间：2026-08-12
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 获取奥术师玩家技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @param {string} skillKey - 技能按键（如 'W_EX', 'W_EX2', 'W_EX3'）
 * @returns {number} 熟练度等级，未学习时返回0
 */
function getArcaneMasterSkillLevel (player, skillKey) {
  if (!player || !player.skills) {
    return 0
  }
  const playerSkill = player.skills[skillKey]
  if (!playerSkill) {
    return 0
  }
  return Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
}

// ========== 奥术充能（J技能）充能积累系统 ==========

/**
 * 检查奥术充能（J技能）是否已解锁
 * 仅当玩家为奥术师且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isArcaneChargeUnlocked (player) {
  if (!player || player.class !== 'arcane_master') {
    return false
  }
  return isSkillUnlocked(player, 'arcane_master', 'J')
}

/**
 * 检查奥术充能EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isArcaneChargeEx1Unlocked (player) {
  if (!player || player.class !== 'arcane_master') {
    return false
  }
  return isSkillUnlocked(player, 'arcane_master', 'J_EX1')
}

/**
 * 检查奥术充能EX2-法术连锁（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isArcaneChargeEx2Unlocked (player) {
  if (!player || player.class !== 'arcane_master') {
    return false
  }
  return isSkillUnlocked(player, 'arcane_master', 'J_EX2')
}

/**
 * 获取奥术充能的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getArcaneChargeTriggerCount (player) {
  let triggerCount = 10

  if (isArcaneChargeEx1Unlocked(player)) {
    const skillLevel = getArcaneMasterSkillLevel(player, 'J_EX1')
    if (skillLevel >= 1) {
      const staticSkill = getSkill('arcane_master', 'J_EX1')
      let reduction = 50
      if (staticSkill && typeof staticSkill.getTriggerReduction === 'function') {
        reduction = staticSkill.getTriggerReduction(skillLevel)
      }
      triggerCount = Math.max(1, Math.floor(triggerCount * (1 - reduction / 100)))
    }
  }

  return triggerCount
}

/**
 * 获取奥术充能技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getArcaneChargeSkillLevel (player) {
  return getArcaneMasterSkillLevel(player, 'J')
}

/**
 * 获取奥术充能基础附加伤害百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 附加伤害百分比（0~100）
 */
export function getArcaneChargeDamageBonus (player) {
  if (!isArcaneChargeUnlocked(player)) {
    return 0
  }
  const skillLevel = getArcaneChargeSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('arcane_master', 'J')
  if (staticSkill && typeof staticSkill.getDamageBonusPercent === 'function') {
    return staticSkill.getDamageBonusPercent(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, 10)
  return 10 * safeLevel
}

/**
 * 获取奥术充能每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getArcaneChargeMpCost (player) {
  if (!isArcaneChargeUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('arcane_master', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return 30
}

/**
 * 获取奥术充能EX2法术连锁触发信息
 * @param {Object} player - 玩家对象
 * @returns {Object} 法术连锁触发信息
 */
export function getArcaneChargeMultiAttackInfo (player) {
  const defaultConfig = {
    chance1: 30,
    bonus1: 200,
    chance2: 20,
    bonus2: 300,
    chance3: 10,
    bonus3: 400
  }

  const result = {
    unlocked: false,
    bonusPercent: 0,
    ...defaultConfig
  }

  if (!isArcaneChargeEx2Unlocked(player) || !isArcaneChargeEx1Unlocked(player)) {
    return result
  }

  const skillLevel = getArcaneMasterSkillLevel(player, 'J_EX2')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('arcane_master', 'J_EX2')
  let chances = defaultConfig
  if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
    chances = staticSkill.getMultiAttackChance(skillLevel)
  }
  result.chance1 = chances.chance1
  result.bonus1 = chances.bonus1
  result.chance2 = chances.chance2
  result.bonus2 = chances.bonus2
  result.chance3 = chances.chance3
  result.bonus3 = chances.bonus3

  // 随机滚动法术连锁档位
  const roll = Math.random() * 100
  if (roll < chances.chance3) {
    result.bonusPercent = chances.bonus3
  } else if (roll < chances.chance2) {
    result.bonusPercent = chances.bonus2
  } else if (roll < chances.chance1) {
    result.bonusPercent = chances.bonus1
  } else {
    result.bonusPercent = 0
  }

  return result
}

// ========== 奥术充能响应式状态管理 ==========

/**
 * 模块级奥术充能值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const arcaneChargeValue = ref(0)

/**
 * 响应式触发标记，触发附加伤害时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const arcaneChargeTriggerFlash = ref(false)

/**
 * 获取当前奥术充能值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 奥术充能值的响应式引用
 */
export function useArcaneChargeValue () {
  return arcaneChargeValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useArcaneChargeTriggerFlash () {
  return arcaneChargeTriggerFlash
}

/**
 * 获取当前奥术充能值的非响应式值
 * @returns {number} 当前奥术充能值（0~触发阈值）
 */
export function getArcaneChargeValue () {
  return arcaneChargeValue.value
}

/**
 * 普通攻击或释放技能后处理奥术充能逻辑
 * 1. 消耗MP（30点，技能释放可跳过），若MP不足则不增加充能值
 * 2. 增加充能值（+1）
 * 3. 若充能值达到触发阈值，计算附加伤害并重置充能值
 *
 * 附加伤害分层：
 * - 基础效果：附加法术攻击力百分比的额外无属性法术伤害（10%~100%随熟练度等级提升）
 * - EX2已解锁：概率触发法术连锁附加伤害（200%/300%/400%攻击力）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana 字段）
 * @param {number} playerAttack - 玩家基础攻击力（用于计算附加伤害）
 * @param {Object} [options] - 可选参数
 * @param {boolean} [options.skipMpCost=false] - 是否跳过MP消耗（技能释放时为true）
 * @returns {Object} 处理结果
 */
export function processArcaneChargeOnAttack (player, playerAttack = 0, options = {}) {
  const { skipMpCost = false } = options
  const result = {
    triggered: false,
    damageAmount: 0,
    damagePercent: 0,
    multiAttackBonus: 0,
    mpConsumed: 0,
    chargeValue: 0,
    triggeredValue: 0
  }

  try {
    if (!isArcaneChargeUnlocked(player)) {
      return result
    }

    const ex1Unlocked = isArcaneChargeEx1Unlocked(player)
    const ex2Unlocked = isArcaneChargeEx2Unlocked(player)
    const triggerCount = getArcaneChargeTriggerCount(player)

    // 1. 消耗MP（技能释放时可跳过）
    if (!skipMpCost) {
      const mpCost = getArcaneChargeMpCost(player)
      if (mpCost > 0) {
        const currentMana = Number(player.currentMana || 0)
        if (currentMana < mpCost) {
          return result
        }
        result.mpConsumed = mpCost
      }
    }

    // 2. 增加充能值
    arcaneChargeValue.value += 1
    result.chargeValue = arcaneChargeValue.value

    // 3. 检查是否达到触发阈值
    if (arcaneChargeValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredValue = arcaneChargeValue.value

      if (ex2Unlocked && ex1Unlocked) {
        // EX2已解锁：概率触发法术连锁附加伤害
        const multiAttackInfo = getArcaneChargeMultiAttackInfo(player)

        if (multiAttackInfo.unlocked && multiAttackInfo.bonusPercent > 0) {
          // 触发法术连锁附加伤害
          result.damagePercent = multiAttackInfo.bonusPercent
          result.multiAttackBonus = multiAttackInfo.bonusPercent
        } else {
          // 未触发法术连锁：使用基础附加伤害
          result.damagePercent = getArcaneChargeDamageBonus(player)
        }
      } else {
        // 基础效果：附加法术攻击力百分比的额外无属性法术伤害
        result.damagePercent = getArcaneChargeDamageBonus(player)
      }

      result.damageAmount = Math.floor(playerAttack * result.damagePercent / 100)

      // 重置充能值
      arcaneChargeValue.value = 0
      result.chargeValue = 0

      // 触发闪烁效果
      arcaneChargeTriggerFlash.value = true
      setTimeout(() => {
        arcaneChargeTriggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[ArcaneCharge] 处理奥术充能失败:', error)
  }

  return result
}

/**
 * 释放技能后处理奥术充能逻辑
 * 与 processArcaneChargeOnAttack 逻辑一致，但跳过MP消耗
 * （技能自身已有MP消耗，不再额外扣除奥术充能的MP）
 *
 * @param {Object} player - 玩家对象
 * @param {number} playerAttack - 玩家基础攻击力
 * @returns {Object} 处理结果（同 processArcaneChargeOnAttack）
 */
export function processArcaneChargeOnSkillCast (player, playerAttack = 0) {
  return processArcaneChargeOnAttack(player, playerAttack, { skipMpCost: true })
}

/**
 * 重置奥术充能值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetArcaneCharge () {
  arcaneChargeValue.value = 0
  arcaneChargeTriggerFlash.value = false
}

// ========== 虚空寂灭 EX 技能 ==========

/**
 * 获取虚空寂灭EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getVoidFissionCdReduction (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'W_EX')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'W_EX')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'W_EX')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 获取虚空寂灭EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getVoidFissionDamageBonus (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'W_EX2')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'W_EX2')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'W_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

// ========== 元素崩坏 EX 技能 ==========

/**
 * 获取元素崩坏EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getElementCollapseCdReduction (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'E_EX1')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'E_EX1')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'E_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 获取元素崩坏EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getElementCollapseDamageBonus (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'E_EX2')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'E_EX2')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'E_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

// ========== 奥术新星 EX 技能 ==========

/**
 * 获取奥术新星EX1-CD减少被动技能的CD减少百分比
 * @param {Object} player - 玩家对象
 * @returns {number} CD减少百分比（0 或 50）
 */
export function getArcaneNovaCdReduction (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'U_EX1')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'U_EX1')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'U_EX1')
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    return staticSkill.getCdReduction(skillLevel)
  }
  return 50
}

/**
 * 获取奥术新星EX2-伤害增加被动技能的伤害增加百分比
 * @param {Object} player - 玩家对象
 * @returns {number} 伤害增加百分比（0 或 50）
 */
export function getArcaneNovaDamageBonus (player) {
  if (!player || !player.skills) return 0
  if (!isSkillUnlocked(player, 'arcane_master', 'U_EX2')) return 0
  const skillLevel = getArcaneMasterSkillLevel(player, 'U_EX2')
  if (skillLevel < 1) return 0
  const staticSkill = getSkill('arcane_master', 'U_EX2')
  if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
    return staticSkill.getDamageBonus(skillLevel)
  }
  return 50
}

/**
 * 获取奥术新星EX3-多段攻击被动技能的触发信息
 * 1级即为最大熟练度，固定返回多段攻击概率配置
 * @param {Object} player - 玩家对象
 * @returns {Object} 多段攻击触发信息 { unlocked: boolean, extraHits: number, chance1: number, chance2: number, chance3: number }
 */
export function getArcaneNovaMultiHitInfo (player) {
  const result = {
    unlocked: false,
    extraHits: 0,
    chance1: 30,  // 1段概率
    chance2: 20,  // 2段概率
    chance3: 10   // 3段概率
  }

  // 检查奥术新星EX3-多段攻击（U_EX3技能）是否已解锁（奥术师190级解锁）
  if (!player || !player.skills) return result
  if (!isSkillUnlocked(player, 'arcane_master', 'U_EX3')) return result

  // 奥术新星EX3-多段攻击 存储在 player.skills.U_EX3
  const playerSkill = player.skills.U_EX3
  if (!playerSkill) return result

  // 获取技能等级（支持 level 或 proficiency.level 格式）
  const skillLevel = Number(
    playerSkill.level ?? playerSkill.proficiency?.level ?? playerSkill.proficiencyLevel ?? 1
  )
  if (skillLevel < 1) return result

  result.unlocked = true

  // 获取静态技能配置
  const staticSkill = getSkill('arcane_master', 'U_EX3')
  if (staticSkill && typeof staticSkill.getMultiStrikeChance === 'function') {
    const chances = staticSkill.getMultiStrikeChance(skillLevel)
    result.chance1 = chances.chance1 ?? 30
    result.chance2 = chances.chance2 ?? 20
    result.chance3 = chances.chance3 ?? 10
  }

  // 随机滚动多段攻击触发次数
  const rand = Math.random() * 100
  if (rand < result.chance1) {
    result.extraHits = 1
  } else if (rand < result.chance1 + result.chance2) {
    result.extraHits = 2
  } else if (rand < result.chance1 + result.chance2 + result.chance3) {
    result.extraHits = 3
  } else {
    result.extraHits = 0
  }

  return result
}

/**
 * 获取虚空寂灭EX3-法术连击被动技能的触发信息
 * 1级即为最大熟练度，固定返回法术连击概率配置
 * @param {Object} player - 玩家对象
 * @returns {Object} 法术连击触发信息 { unlocked: boolean, multiplier: number, chance2x: number, chance3x: number, chance4x: number }
 */
export function getVoidFissionMultiCastInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,  // 倍数
    chance2x: 30,   // 2倍概率
    chance3x: 20,   // 3倍概率
    chance4x: 10    // 4倍概率
  }

  // 检查虚空寂灭EX3-法术连击（W_EX3技能）是否已解锁（奥术师190级解锁）
  if (!player || !player.skills) return result
  if (!isSkillUnlocked(player, 'arcane_master', 'W_EX3')) return result

  // 虚空寂灭EX3-法术连击 存储在 player.skills.W_EX3
  const playerSkill = player.skills.W_EX3
  if (!playerSkill) return result

  // 获取技能等级（支持 level 或 proficiency.level 格式）
  const skillLevel = Number(
    playerSkill.level ?? playerSkill.proficiency?.level ?? playerSkill.proficiencyLevel ?? 1
  )
  if (skillLevel < 1) return result

  result.unlocked = true

  // 获取静态技能配置
  const staticSkill = getSkill('arcane_master', 'W_EX3')
  if (staticSkill && typeof staticSkill.getMultiCastChance === 'function') {
    const chances = staticSkill.getMultiCastChance(skillLevel)
    result.chance2x = chances.chance2x ?? 30
    result.chance3x = chances.chance3x ?? 20
    result.chance4x = chances.chance4x ?? 10
  }

  // 随机滚动法术连击倍数
  const rand = Math.random() * 100
  if (rand < result.chance2x) {
    result.multiplier = 2
  } else if (rand < result.chance2x + result.chance3x) {
    result.multiplier = 3
  } else if (rand < result.chance2x + result.chance3x + result.chance4x) {
    result.multiplier = 4
  } else {
    result.multiplier = 1
  }

  return result
}
