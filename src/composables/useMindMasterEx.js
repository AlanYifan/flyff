/**
 * @file useMindMasterEx.js
 * @description 心灵师EX被动技能组合式函数
 * 提供心灵师碎思归墟（J技能）充能积累系统：
 * - 每次普通攻击或释放技能增加1点充能值
 * - 达到触发阈值后附加最大MP百分比的额外精神伤害，然后重置充能值
 * - EX1解锁后触发次数减半（10→5）
 * - EX2解锁后概率触发心灵连锁（附加200%/300%/400%最大MP的精神伤害）
 * - 在main页面和副本页面均生效
 *
 * 创建时间：2026-08-12
 */

import { ref } from 'vue'
import { getSkill, isSkillUnlocked } from '@/data/skills'

/**
 * 获取心灵师玩家技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @param {string} skillKey - 技能按键（如 'J', 'J_EX1', 'J_EX2'）
 * @returns {number} 熟练度等级，未学习时返回0
 */
function getMindMasterSkillLevel (player, skillKey) {
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

// ========== 碎思归墟（J技能）充能积累系统 ==========

/**
 * 检查碎思归墟（J技能）是否已解锁
 * 仅当玩家为心灵师且达到166级时生效
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindChargeUnlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'J')
}

/**
 * 检查碎思归墟EX1-减少触发次数（J_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindChargeEx1Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'J_EX1')
}

/**
 * 检查碎思归墟EX2-心灵连锁（J_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindChargeEx2Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'J_EX2')
}

/**
 * 获取碎思归墟的触发阈值
 * 基础为10次，若EX1已解锁则减少50%（变为5次）
 * @param {Object} player - 玩家对象
 * @returns {number} 触发阈值（10 或 5）
 */
export function getMindChargeTriggerCount (player) {
  let triggerCount = 10

  if (isMindChargeEx1Unlocked(player)) {
    const skillLevel = getMindMasterSkillLevel(player, 'J_EX1')
    if (skillLevel >= 1) {
      const staticSkill = getSkill('mind_master', 'J_EX1')
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
 * 获取碎思归墟技能的熟练度等级
 * @param {Object} player - 玩家对象
 * @returns {number} 熟练度等级（1~10），未学习时返回0
 */
export function getMindChargeSkillLevel (player) {
  return getMindMasterSkillLevel(player, 'J')
}

/**
 * 获取碎思归墟基础附加伤害百分比（基于最大MP）
 * @param {Object} player - 玩家对象
 * @returns {number} 附加伤害百分比（0~100）
 */
export function getMindChargeDamageBonus (player) {
  if (!isMindChargeUnlocked(player)) {
    return 0
  }
  const skillLevel = getMindChargeSkillLevel(player)
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'J')
  if (staticSkill && typeof staticSkill.getDamageBonusPercent === 'function') {
    return staticSkill.getDamageBonusPercent(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, 10)
  return 10 * safeLevel
}

/**
 * 获取碎思归墟每次攻击MP消耗
 * @param {Object} player - 玩家对象
 * @returns {number} MP消耗值（固定30），未解锁时返回0
 */
export function getMindChargeMpCost (player) {
  if (!isMindChargeUnlocked(player)) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'J')
  if (staticSkill && typeof staticSkill.getMpCostPerAttack === 'function') {
    return staticSkill.getMpCostPerAttack()
  }
  return 30
}

/**
 * 获取碎思归墟EX2心灵连锁触发信息
 * @param {Object} player - 玩家对象
 * @returns {Object} 心灵连锁触发信息 { unlocked, bonusPercent, chance1, bonus1, chance2, bonus2, chance3, bonus3 }
 */
export function getMindChargeMultiAttackInfo (player) {
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

  if (!isMindChargeEx2Unlocked(player) || !isMindChargeEx1Unlocked(player)) {
    return result
  }

  const skillLevel = getMindMasterSkillLevel(player, 'J_EX2')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  const staticSkill = getSkill('mind_master', 'J_EX2')
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

  // 随机滚动心灵连锁档位
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

// ========== 碎思归墟响应式状态管理 ==========

/**
 * 模块级碎思归墟充能值计数器（响应式）
 * 使用 Vue ref 维护，支持 UI 组件自动响应更新
 * 仅在内存中维护，不持久化
 * @type {import('vue').Ref<number>}
 */
const mindChargeValue = ref(0)

/**
 * 响应式触发标记，触发附加伤害时短暂设置为 true，用于 UI 闪烁效果
 * @type {import('vue').Ref<boolean>}
 */
const mindChargeTriggerFlash = ref(false)

/**
 * 获取当前碎思归墟充能值（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<number>} 碎思归墟充能值的响应式引用
 */
export function useMindChargeValue () {
  return mindChargeValue
}

/**
 * 获取触发闪烁标记（响应式）
 * 返回 Vue ref 对象，可直接在模板中使用
 * @returns {import('vue').Ref<boolean>} 触发闪烁标记的响应式引用
 */
export function useMindChargeTriggerFlash () {
  return mindChargeTriggerFlash
}

/**
 * 获取当前碎思归墟充能值的非响应式值
 * @returns {number} 当前充能值（0~触发阈值）
 */
export function getMindChargeValue () {
  return mindChargeValue.value
}

/**
 * 普通攻击或释放技能后处理碎思归墟充能逻辑
 * 1. 消耗MP（30点，技能释放可跳过），若MP不足则不增加充能值
 * 2. 增加充能值（+1）
 * 3. 若充能值达到触发阈值，计算附加伤害并重置充能值
 *
 * 附加伤害分层：
 * - 基础效果：附加最大MP百分比的额外精神伤害（10%~100%随熟练度等级提升）
 * - EX2已解锁：概率触发心灵连锁附加伤害（200%/300%/400%最大MP）
 *
 * @param {Object} player - 玩家对象（需包含 class、skills、currentMana、maxMana 字段）
 * @param {number} playerMaxMana - 玩家最大MP（用于计算附加伤害）
 * @param {Object} [options] - 可选参数
 * @param {boolean} [options.skipMpCost=false] - 是否跳过MP消耗（技能释放时为true）
 * @returns {Object} 处理结果
 */
export function processMindChargeOnAttack (player, playerMaxMana = 0, options = {}) {
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
    if (!isMindChargeUnlocked(player)) {
      return result
    }

    const ex1Unlocked = isMindChargeEx1Unlocked(player)
    const ex2Unlocked = isMindChargeEx2Unlocked(player)
    const triggerCount = getMindChargeTriggerCount(player)

    // 1. 消耗MP（技能释放时可跳过）
    if (!skipMpCost) {
      const mpCost = getMindChargeMpCost(player)
      if (mpCost > 0) {
        const currentMana = Number(player.currentMana || 0)
        if (currentMana < mpCost) {
          return result
        }
        result.mpConsumed = mpCost
      }
    }

    // 2. 增加充能值
    mindChargeValue.value += 1
    result.chargeValue = mindChargeValue.value

    // 3. 检查是否达到触发阈值
    if (mindChargeValue.value >= triggerCount) {
      result.triggered = true
      result.triggeredValue = mindChargeValue.value

      if (ex2Unlocked && ex1Unlocked) {
        // EX2已解锁：概率触发心灵连锁附加伤害
        const multiAttackInfo = getMindChargeMultiAttackInfo(player)

        if (multiAttackInfo.unlocked && multiAttackInfo.bonusPercent > 0) {
          // 触发心灵连锁附加伤害
          result.damagePercent = multiAttackInfo.bonusPercent
          result.multiAttackBonus = multiAttackInfo.bonusPercent
        } else {
          // 未触发心灵连锁：使用基础附加伤害
          result.damagePercent = getMindChargeDamageBonus(player)
        }
      } else {
        // 基础效果：附加最大MP百分比的额外精神伤害
        result.damagePercent = getMindChargeDamageBonus(player)
      }

      result.damageAmount = Math.floor(playerMaxMana * result.damagePercent / 100)

      // 重置充能值
      mindChargeValue.value = 0
      result.chargeValue = 0

      // 触发闪烁效果
      mindChargeTriggerFlash.value = true
      setTimeout(() => {
        mindChargeTriggerFlash.value = false
      }, 500)
    }
  } catch (error) {
    console.error('[MindCharge] 处理碎思归墟失败:', error)
  }

  return result
}

/**
 * 释放技能后处理碎思归墟充能逻辑
 * 与 processMindChargeOnAttack 逻辑一致，但跳过MP消耗
 * （技能自身已有MP消耗，不再额外扣除碎思归墟的MP）
 *
 * @param {Object} player - 玩家对象
 * @param {number} playerMaxMana - 玩家最大MP
 * @returns {Object} 处理结果（同 processMindChargeOnAttack）
 */
export function processMindChargeOnSkillCast (player, playerMaxMana = 0) {
  return processMindChargeOnAttack(player, playerMaxMana, { skipMpCost: true })
}

/**
 * 重置碎思归墟充能值
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetMindCharge () {
  mindChargeValue.value = 0
  mindChargeTriggerFlash.value = false
}

// ========== 星念凝徽（I技能）被动加成系统 ==========

/**
 * 检查星念凝徽（I技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindMasteryUnlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'I')
}

/**
 * 检查星念凝徽EX1-暴击强化（I_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindMasteryEx1Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'I_EX1')
}

/**
 * 检查星念凝徽EX2-精神壁垒（I_EX2技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindMasteryEx2Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'I_EX2')
}

/**
 * 检查星念凝徽EX3-精神回复（I_EX3技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindMasteryEx3Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'I_EX3')
}

/**
 * 获取星念凝徽（I技能）的技能伤害加成百分比
 * 1级6%，每级+6%，5级30%
 * @param {Object} player - 玩家对象
 * @returns {number} 技能伤害加成百分比（0~30）
 */
export function getMindMasterySkillDamageBonus (player) {
  if (!isMindMasteryUnlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I')
  if (staticSkill && typeof staticSkill.getSkillDamageBonus === 'function') {
    return staticSkill.getSkillDamageBonus(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, 5)
  return 6 * safeLevel
}

/**
 * 获取星念凝徽（I技能）的暴击率加成百分比
 * 1级3%，每级+3%，5级15%
 * @param {Object} player - 玩家对象
 * @returns {number} 暴击率加成百分比（0~15）
 */
export function getMindMasteryCritRateBonus (player) {
  if (!isMindMasteryUnlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I')
  if (staticSkill && typeof staticSkill.getCritRateBonus === 'function') {
    return staticSkill.getCritRateBonus(skillLevel)
  }
  const safeLevel = Math.min(skillLevel, 5)
  return 3 * safeLevel
}

/**
 * 获取星念凝徽EX1-暴击强化（I_EX1技能）的暴击伤害加成百分比
 * 固定+10%
 * @param {Object} player - 玩家对象
 * @returns {number} 暴击伤害加成百分比（0或10）
 */
export function getMindMasteryCritDamageBonus (player) {
  if (!isMindMasteryEx1Unlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I_EX1')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I_EX1')
  if (staticSkill && typeof staticSkill.getCritDamageBonus === 'function') {
    return staticSkill.getCritDamageBonus(skillLevel)
  }
  return 10
}

/**
 * 获取星念凝徽EX2-精神壁垒（I_EX2技能）的魔法防御加成百分比
 * 固定+25%
 * @param {Object} player - 玩家对象
 * @returns {number} 魔法防御加成百分比（0或25）
 */
export function getMindMasteryMagicDefenseBonus (player) {
  if (!isMindMasteryEx2Unlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I_EX2')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I_EX2')
  if (staticSkill && typeof staticSkill.getMagicDefenseBonus === 'function') {
    return staticSkill.getMagicDefenseBonus(skillLevel)
  }
  return 25
}

/**
 * 获取星念凝徽EX3-精神回复（I_EX3技能）的最大MP加成百分比
 * 固定+30%
 * @param {Object} player - 玩家对象
 * @returns {number} 最大MP加成百分比（0或30）
 */
export function getMindMasteryMaxMpBonus (player) {
  if (!isMindMasteryEx3Unlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I_EX3')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I_EX3')
  if (staticSkill && typeof staticSkill.getMaxMpBonus === 'function') {
    return staticSkill.getMaxMpBonus(skillLevel)
  }
  return 30
}

/**
 * 获取星念凝徽EX3-精神回复（I_EX3技能）的精神回复触发信息
 * 受到伤害时概率触发，将伤害转化为MP
 * @param {Object} player - 玩家对象
 * @returns {number} 回复百分比（0表示未触发，10/20/30表示触发对应回复）
 */
export function rollMindMasteryManaRecovery (player) {
  if (!isMindMasteryEx3Unlocked(player)) {
    return 0
  }
  const skillLevel = getMindMasterSkillLevel(player, 'I_EX3')
  if (skillLevel < 1) {
    return 0
  }
  const staticSkill = getSkill('mind_master', 'I_EX3')
  if (staticSkill && typeof staticSkill.rollManaRecovery === 'function') {
    return staticSkill.rollManaRecovery(skillLevel)
  }
  // 默认逻辑
  const roll = Math.random() * 100
  if (roll < 10) return 30
  if (roll < 30) return 20
  if (roll < 60) return 10
  return 0
}

// ========== 星思坠寂（W技能）EX3-精神连击系统 ==========

/**
 * 检查星思坠寂EX3-精神连击（W_EX3技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindTearEx3Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'W_EX3')
}

/**
 * 获取星思坠寂EX3-精神连击被动技能的触发信息
 * 1级即为最大熟练度，固定返回精神连击概率配置
 * 每次调用随机滚动：30%概率2倍、20%概率3倍、10%概率4倍伤害
 * @param {Object} player - 玩家对象
 * @returns {Object} 精神连击触发信息 { unlocked: boolean, multiplier: number, chance2x: number, chance3x: number, chance4x: number }
 */
export function getMindTearMultiCastInfo (player) {
  const result = {
    unlocked: false,
    multiplier: 1,
    chance2x: 30,
    chance3x: 20,
    chance4x: 10
  }

  if (!isMindTearEx3Unlocked(player)) {
    return result
  }

  const skillLevel = getMindMasterSkillLevel(player, 'W_EX3')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  // 获取静态技能配置
  const staticSkill = getSkill('mind_master', 'W_EX3')
  if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
    const chances = staticSkill.getCriticalMultiplier(skillLevel)
    result.chance2x = chances.chance2x ?? 30
    result.chance3x = chances.chance3x ?? 20
    result.chance4x = chances.chance4x ?? 10
  }

  // 随机滚动精神连击倍数
  const rand = Math.random() * 100
  if (rand < result.chance4x) {
    result.multiplier = 4
  } else if (rand < result.chance4x + result.chance3x) {
    result.multiplier = 3
  } else if (rand < result.chance4x + result.chance3x + result.chance2x) {
    result.multiplier = 2
  } else {
    result.multiplier = 1
  }

  return result
}

// ========== 万绪沉宵（U技能）EX3-心灵震荡系统 ==========

/**
 * 检查万绪沉宵EX3-心灵震荡（U_EX3技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindNovaEx3Unlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'U_EX3')
}

/**
 * 获取万绪沉宵EX3-心灵震荡被动技能的触发信息
 * 1级即为最大熟练度，固定返回多段攻击概率配置
 * 每次调用随机滚动：30%概率1段、20%概率2段、10%概率3段额外伤害
 * @param {Object} player - 玩家对象
 * @returns {Object} 多段攻击触发信息 { unlocked: boolean, extraHits: number, chance1: number, chance2: number, chance3: number }
 *   - unlocked: EX3是否已解锁
 *   - extraHits: 本次触发额外伤害次数（0~3），每次调用随机滚动
 *   - chance1/chance2/chance3: 各段触发概率
 */
export function getMindNovaMultiHitInfo (player) {
  const result = {
    unlocked: false,
    extraHits: 0,
    chance1: 30,
    chance2: 20,
    chance3: 10
  }

  if (!isMindNovaEx3Unlocked(player)) {
    return result
  }

  const skillLevel = getMindMasterSkillLevel(player, 'U_EX3')
  if (skillLevel < 1) {
    return result
  }

  result.unlocked = true

  // 获取静态技能对象的概率配置
  const staticSkill = getSkill('mind_master', 'U_EX3')
  let chances = { chance1: 30, chance2: 20, chance3: 10 }
  if (staticSkill && typeof staticSkill.getMultiHitChance === 'function') {
    chances = staticSkill.getMultiHitChance(skillLevel)
  }
  result.chance1 = chances.chance1 ?? 30
  result.chance2 = chances.chance2 ?? 20
  result.chance3 = chances.chance3 ?? 10

  // 随机滚动多段攻击触发次数
  const roll = Math.random() * 100
  if (roll < result.chance3) {
    result.extraHits = 3
  } else if (roll < result.chance3 + result.chance2) {
    result.extraHits = 2
  } else if (roll < result.chance3 + result.chance2 + result.chance1) {
    result.extraHits = 1
  } else {
    result.extraHits = 0
  }

  return result
}

// ========== 心灵师EX1-CD减少被动技能的实际冷却时间计算 ==========

/**
 * 检查星思坠寂EX1-CD减少（W_EX技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindTearCdReductionUnlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'W_EX')
}

/**
 * 计算应用星思坠寂EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getMindTearEffectiveCooldown (player, baseCooldownSeconds) {
  if (!isMindTearCdReductionUnlocked(player)) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const staticSkill = getSkill('mind_master', 'W_EX')
  let reduction = 50
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    reduction = staticSkill.getCdReduction(1)
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 检查意识崩塌EX1-CD减少（E_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isConsciousnessCollapseCdReductionUnlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'E_EX1')
}

/**
 * 计算应用意识崩塌EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getConsciousnessCollapseEffectiveCooldown (player, baseCooldownSeconds) {
  if (!isConsciousnessCollapseCdReductionUnlocked(player)) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const staticSkill = getSkill('mind_master', 'E_EX1')
  let reduction = 50
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    reduction = staticSkill.getCdReduction(1)
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}

/**
 * 检查万绪沉宵EX1-CD减少（U_EX1技能）是否已解锁
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否已解锁
 */
export function isMindNovaCdReductionUnlocked (player) {
  if (!player || player.class !== 'mind_master') {
    return false
  }
  return isSkillUnlocked(player, 'mind_master', 'U_EX1')
}

/**
 * 计算应用万绪沉宵EX1-CD减少后的实际冷却时间
 * @param {Object} player - 玩家对象
 * @param {number} baseCooldownSeconds - 基础冷却时间（秒）
 * @returns {number} 应用CD减少后的实际冷却时间（秒），最小为1秒
 */
export function getMindNovaEffectiveCooldown (player, baseCooldownSeconds) {
  if (!isMindNovaCdReductionUnlocked(player)) {
    return Math.max(0, Math.ceil(Number(baseCooldownSeconds) || 0))
  }
  const staticSkill = getSkill('mind_master', 'U_EX1')
  let reduction = 50
  if (staticSkill && typeof staticSkill.getCdReduction === 'function') {
    reduction = staticSkill.getCdReduction(1)
  }
  const reduced = Number(baseCooldownSeconds || 0) * (1 - reduction / 100)
  return Math.max(1, Math.ceil(reduced))
}
