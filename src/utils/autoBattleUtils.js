/**
 * 自动战斗工具函数集合
 *
 * @file autoBattleUtils.js
 * @generated 2026-01-28
 */
import { DamageCalculator } from './damageCalculator'
import { SkillUtils } from './skillUtils'
import { formatDuration } from './timeUtils'

/**
 * 法系职业 class key 列表（智力为主属性的职业）
 * 这些职业的攻击间隔使用 decreasedCastingTime（施法速度）进行计算
 * - 1转：mage（魔导士）、priest（圣职者）
 * - 2转：element_mage（元素使者）、spirit_mage（精神使者）、guardian（守护使者）
 * - 3转：arcane_master（奥术师）、mind_master（心灵师）、nature_messenger（炽天使）
 */
export const CASTER_CLASSES = [
  'mage',
  'priest',
  'element_mage',
  'spirit_mage',
  'guardian',
  'arcane_master',
  'mind_master',
  'nature_messenger'
]

/**
 * 判断给定职业是否为法系职业（使用施法速度计算攻击间隔）
 * @param {string} className - 职业标识（class key）
 * @returns {boolean} 是否为法系职业
 */
export function isCasterClass (className) {
  const normalized = String(className || '').toLowerCase().trim()
  return CASTER_CLASSES.includes(normalized)
}

/**
 * 法系输出职业 class key 列表
 * 以智力为主属性的输出型职业，自动战斗优先 BUFF → 单体/AOE
 * - 1转：mage（魔导士）
 * - 2转：element_mage（元素使者）、spirit_mage（精神使者）
 * - 3转：arcane_master（奥术师）、mind_master（心灵师）
 */
export const MAGIC_DPS_CLASSES = [
  'mage',
  'element_mage',
  'spirit_mage',
  'arcane_master',
  'mind_master'
]

/**
 * 法系辅助职业 class key 列表
 * 以智力为主属性的辅助型职业，自动战斗优先 治疗 → BUFF → 单体/AOE
 * - 1转：priest（圣职者）
 * - 2转：guardian（守护使者）
 * - 3转：nature_messenger（炽天使）、combat_master（格斗宗师）
 */
export const MAGIC_SUPPORT_CLASSES = [
  'priest',
  'guardian',
  'nature_messenger',
  'combat_master'
]

/**
 * 职业大类枚举
 * @readonly
 * @enum {string}
 */
export const CLASS_CATEGORY = Object.freeze({
  /** 法系输出 */
  MAGIC_DPS: 'magic_dps',
  /** 法系辅助 */
  MAGIC_SUPPORT: 'magic_support',
  /** 物理输出（力量/敏捷型） */
  PHYSICAL_DPS: 'physical_dps'
})

/**
 * 根据职业 key 获取职业大类
 * @param {string} classKey - 职业 key（如 'mage'、'priest'、'warrior'）
 * @returns {string} 职业大类（CLASS_CATEGORY.MAGIC_DPS / MAGIC_SUPPORT / PHYSICAL_DPS）
 */
export function getClassCategory (classKey) {
  const normalized = String(classKey || '').toLowerCase().trim()
  if (MAGIC_DPS_CLASSES.includes(normalized)) {
    return CLASS_CATEGORY.MAGIC_DPS
  }
  if (MAGIC_SUPPORT_CLASSES.includes(normalized)) {
    return CLASS_CATEGORY.MAGIC_SUPPORT
  }
  return CLASS_CATEGORY.PHYSICAL_DPS
}

/**
 * 技能行动类型枚举
 * @readonly
 * @enum {string}
 */
export const SKILL_ACTION_TYPE = Object.freeze({
  /** 治疗技能 */
  HEAL: 'heal',
  /** BUFF 增益技能 */
  BUFF: 'buff',
  /** DEBUFF 减益技能 */
  DEBUFF: 'debuff',
  /** AOE 范围攻击技能 */
  AOE: 'aoe',
  /** 单体攻击技能 */
  SINGLE: 'single',
  /** 召唤技能（召唤物自动攻击） */
  SUMMON: 'summon'
})

/**
 * 根据职业大类和怪物数量获取技能行动优先级
 *
 * 该函数是主页面与副本页面共享的核心决策逻辑，确保两个战斗场景使用
 * 一致的职业化技能释放策略。调用方根据返回的优先级数组依次尝试
 * 释放对应类型的技能，若全部失败则执行普通攻击。
 *
 * 法系输出职业单怪时：BUFF → 单体 → AOE回退 → 普攻
 * 法系输出职业多怪时：BUFF → AOE → 单体回退 → 普攻
 * 法系辅助职业单怪时：治疗 → BUFF → 单体 → AOE回退 → 普攻
 * 法系辅助职业多怪时：治疗 → BUFF → AOE → 单体回退 → 普攻
 * 物理职业单怪时：BUFF → DEBUFF → 单体 → AOE回退 → 普攻
 * 物理职业多怪时：BUFF → DEBUFF → AOE → 普攻
 *
 * @param {string} classCategory - 职业大类（CLASS_CATEGORY.MAGIC_DPS / MAGIC_SUPPORT / PHYSICAL_DPS）
 * @param {number} monsterCount - 存活怪物数量
 * @param {number} healthPercent - 当前血量百分比（0~1）
 * @param {number} recoveryThreshold - 恢复阈值（0~1），低于此值优先治疗
 * @param {boolean} teamNeedsHeal - 队友是否需要治疗（副本场景，默认 false）
 * @returns {string[]} 行动类型优先级数组，如 ['heal', 'buff', 'single', 'aoe']；空数组表示直接普攻
 */
export function getSkillActionPriority (classCategory, monsterCount, healthPercent, recoveryThreshold, teamNeedsHeal = false) {
  const isSingleMonster = (Number(monsterCount) || 0) <= 1
  const priority = []

  // 1. 血量低于恢复阈值时优先治疗（全职业通用），或队友需要治疗时也优先治疗
  if (
    Number.isFinite(recoveryThreshold) &&
    Number.isFinite(healthPercent) &&
    (healthPercent < recoveryThreshold || teamNeedsHeal === true)
  ) {
    priority.push(SKILL_ACTION_TYPE.HEAL)
  }

  if (classCategory === CLASS_CATEGORY.MAGIC_DPS) {
    // 法系输出：BUFF优先 → 召唤 → 单体 → AOE回退（单怪）/ AOE → 单体回退（多怪）
    // 召唤技能优先释放以最大化持续时间，单怪时优先单体技能，多怪时优先AOE
    priority.push(SKILL_ACTION_TYPE.BUFF)
    priority.push(SKILL_ACTION_TYPE.SUMMON)
    if (isSingleMonster) {
      priority.push(SKILL_ACTION_TYPE.SINGLE)
      // 没有单体技能或单体技能在冷却时，回退使用AOE技能
      priority.push(SKILL_ACTION_TYPE.AOE)
    } else {
      priority.push(SKILL_ACTION_TYPE.AOE)
      // AOE 技能冷却中时回退使用单体技能
      priority.push(SKILL_ACTION_TYPE.SINGLE)
    }
  } else if (classCategory === CLASS_CATEGORY.MAGIC_SUPPORT) {
    // 法系辅助：治疗（已在上方检查）→ BUFF → 召唤 → 单体 → AOE回退（1怪）/ AOE → 单体回退（多怪）
    // 召唤技能优先释放以最大化持续时间
    priority.push(SKILL_ACTION_TYPE.BUFF)
    priority.push(SKILL_ACTION_TYPE.SUMMON)
    if (isSingleMonster) {
      priority.push(SKILL_ACTION_TYPE.SINGLE)
      // 没有单体技能或单体技能在冷却时，回退使用AOE技能
      priority.push(SKILL_ACTION_TYPE.AOE)
    } else {
      priority.push(SKILL_ACTION_TYPE.AOE)
      // AOE 技能冷却中时回退使用单体技能
      priority.push(SKILL_ACTION_TYPE.SINGLE)
    }
  } else {
    // 物理输出：BUFF优先 → DEBUFF → 召唤 → 单怪释放单体→AOE / 多怪释放AOE
    // 召唤技能在增益和减益后释放，以最大化召唤物输出
    priority.push(SKILL_ACTION_TYPE.BUFF)
    priority.push(SKILL_ACTION_TYPE.DEBUFF)
    priority.push(SKILL_ACTION_TYPE.SUMMON)
    if (isSingleMonster) {
      // 单怪时优先单体技能，没有单体技能或冷却中则回退AOE，最终回退普攻
      priority.push(SKILL_ACTION_TYPE.SINGLE)
      priority.push(SKILL_ACTION_TYPE.AOE)
    } else {
      priority.push(SKILL_ACTION_TYPE.AOE)
    }
  }

  return priority
}

/**
 * 校验并规范化自动战斗配置，避免不合法值导致定时器/逻辑失效。
 * @param {Record<string, any>} config - 待校验配置（通常来自 UI / localStorage）。
 * @param {Record<string, any>} defaultConfig - 默认配置（用于兜底与边界限制）。
 * @returns {Record<string, any>} 校验后的配置对象（为新对象引用）。
 */
export function validateConfig (config, defaultConfig) {
  const validated = { ...defaultConfig, ...config }

  if (validated.targetSelection !== undefined) {
    const rawSelection = validated.targetSelection
    const normalizedSelection =
      typeof rawSelection === 'string' ? rawSelection.trim() : String(rawSelection ?? '').trim()
    const allowedTargetSelections = [
      'nearest',
      'weakest',
      'strongest',
      'highestExp',
      'lowestDefense'
    ]
    if (!normalizedSelection) {
      validated.targetSelection = defaultConfig.targetSelection || 'nearest'
    } else if (normalizedSelection === 'random') {
      validated.targetSelection = 'nearest'
    } else if (!allowedTargetSelections.includes(normalizedSelection)) {
      validated.targetSelection = defaultConfig.targetSelection || 'nearest'
    } else {
      validated.targetSelection = normalizedSelection
    }
  }

  if (validated.baseAttackInterval !== undefined) {
    const nextBaseAttackInterval = Number(validated.baseAttackInterval)
    if (!Number.isFinite(nextBaseAttackInterval)) {
      validated.baseAttackInterval = defaultConfig.baseAttackInterval
    } else {
      validated.baseAttackInterval = Math.max(
        defaultConfig.minAttackInterval || 100,
        Math.min(defaultConfig.maxAttackInterval || 10000, nextBaseAttackInterval)
      )
    }
  }

  if (validated.healthThreshold !== undefined) {
    validated.healthThreshold = Math.max(0.1, Math.min(0.9, validated.healthThreshold))
  }

  if (validated.manaThreshold !== undefined) {
    validated.manaThreshold = Math.max(0.1, Math.min(0.9, validated.manaThreshold))
  }

  if (validated.recoveryThreshold !== undefined) {
    validated.recoveryThreshold = Math.max(0.1, Math.min(0.9, validated.recoveryThreshold))
  }

  if (validated.monsterMinLevel !== undefined) {
    validated.monsterMinLevel = Math.max(1, validated.monsterMinLevel)
  }

  if (validated.monsterMaxLevel !== undefined) {
    validated.monsterMaxLevel = Math.max(
      validated.monsterMinLevel || 1,
      Math.min(200, validated.monsterMaxLevel)
    )
  }

  if (validated.monsterDisplayCount !== undefined) {
    validated.monsterDisplayCount = Math.max(1, Math.min(10, validated.monsterDisplayCount))
  }

  if (validated.monsterRefreshStrategy !== undefined) {
    const allowedStrategies = ['countdown', 'immediate', 'manual']
    if (!allowedStrategies.includes(validated.monsterRefreshStrategy)) {
      validated.monsterRefreshStrategy = defaultConfig.monsterRefreshStrategy || 'countdown'
    }
  }

  if (validated.skillCheckInterval !== undefined) {
    const nextSkillCheckInterval = Number(validated.skillCheckInterval)
    if (!Number.isFinite(nextSkillCheckInterval)) {
      validated.skillCheckInterval = defaultConfig.skillCheckInterval
    } else {
      validated.skillCheckInterval = Math.max(100, Math.min(5000, nextSkillCheckInterval))
    }
  }

  if (validated.skillSelectionStrategy !== undefined) {
    const allowedStrategies = ['priority', 'highestDamage', 'lowestMana', 'efficiency']
    if (!allowedStrategies.includes(validated.skillSelectionStrategy)) {
      validated.skillSelectionStrategy = defaultConfig.skillSelectionStrategy || 'priority'
    }
  }

  return validated
}

export function debounce (func, wait) {
  let timeout
  return function executedFunction (...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle (func, limit) {
  let inThrottle
  return function executedFunction (...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function logBattleEvent () {
}

export function logDebugEvent () {
}

export function logErrorEvent (module, message, error = null) {
  if (error) {
    console.error(module, message, error)
  } else {
    console.error(module, message)
  }
}

export function logWarnEvent () {
}

export function calculateAttackInterval (
  baseInterval,
  attackSpeed = 0,
  minInterval = 500,
  maxSpeed = 100
) {
  const resolvedBaseInterval = Number(baseInterval)
  const resolvedMinInterval = Number(minInterval)
  const resolvedMaxSpeed = Number(maxSpeed)
  const safeBaseInterval = Number.isFinite(resolvedBaseInterval) ? resolvedBaseInterval : 1500
  const safeMinInterval = Number.isFinite(resolvedMinInterval) ? resolvedMinInterval : 500
  const safeMaxSpeed = Number.isFinite(resolvedMaxSpeed) ? resolvedMaxSpeed : 100
  const rawSpeed = Number(attackSpeed)
  const normalizedSpeed = Number.isFinite(rawSpeed)
    ? rawSpeed <= 3
      ? rawSpeed * 100
      : rawSpeed
    : 0
  const clampedSpeed = Math.max(0, Math.min(safeMaxSpeed, normalizedSpeed))
  const intervalRange = Math.max(0, safeBaseInterval - safeMinInterval)
  const calculatedInterval = safeBaseInterval - (clampedSpeed / safeMaxSpeed) * intervalRange
  return Math.max(safeMinInterval, calculatedInterval)
}

export function calculateDamage (baseDamage, modifiers = {}) {
  let damage = baseDamage

  if (modifiers.attackBonus) {
    damage += modifiers.attackBonus
  }

  if (modifiers.criticalMultiplier && modifiers.isCritical) {
    damage = Math.floor(damage * modifiers.criticalMultiplier)
  }

  if (modifiers.elementMultiplier) {
    damage = Math.floor(damage * modifiers.elementMultiplier)
  }

  if (modifiers.defense) {
    damage = Math.max(1, damage - modifiers.defense)
  }

  return damage
}

export function calculateCritical (critRate = 0) {
  return DamageCalculator.calculateCritical(critRate)
}

export function calculateHitRate (hitRate = 0.3) {
  return DamageCalculator.calculateHitRate(hitRate)
}

export function getSkillPriority (skill) {
  return SkillUtils.getSkillPriority(skill)
}

export function checkJobRequirement (requiredJob, playerJob) {
  return SkillUtils.checkJobRequirement(requiredJob, playerJob)
}

export function formatStats (stats) {
  return {
    总攻击次数: stats.totalAttacks,
    总伤害: stats.totalDamage,
    击败怪物: stats.monstersDefeated,
    使用技能: stats.skillsUsed,
    平均伤害: stats.averageDamage,
    攻击频率: `${stats.attacksPerSecond} 次/秒`,
    伤害输出: `${stats.damagePerSecond} 伤害/秒`,
    战斗时长: formatDuration(stats.duration)
  }
}

export function isValidMonster (monster, config = {}) {
  if (!monster || !monster.id) {
    return false
  }

  if (monster.isDefeated || monster.currentHealth <= 0) {
    return false
  }

  const monsterLevel = monster.level || monster.monsterLevel || 1
  const maxLevel = config?.monsterMaxLevel

  if (maxLevel !== undefined && maxLevel !== null && monsterLevel > maxLevel) {
    return false
  }

  return true
}

export function selectTargetByStrategy (monsters, strategy) {
  switch (strategy) {
  case 'weakest':
    return monsters.reduce((weakest, current) => {
      if (!weakest || current.currentHealth < weakest.currentHealth) {
        return current
      }
      return weakest
    }, null)

  case 'strongest':
    return monsters.reduce((strongest, current) => {
      if (!strongest || current.maxHealth > strongest.maxHealth) {
        return current
      }
      return strongest
    }, null)

  case 'highestExp':
    return monsters.reduce((highest, current) => {
      const currentExp = current.exp || current.experience || 0
      const highestExp = highest ? highest.exp || highest.experience || 0 : 0
      if (!highest || currentExp > highestExp) {
        return current
      }
      return highest
    }, null)

  case 'lowestDefense':
    return monsters.reduce((lowest, current) => {
      const currentDef = current.defense || 0
      const lowestDef = lowest ? lowest.defense || 0 : Infinity
      if (!lowest || currentDef < lowestDef) {
        return current
      }
      return lowest
    }, null)

  case 'nearest':
    return monsters[0]

  case 'random':
  default: {
    const randomIndex = Math.floor(Math.random() * monsters.length)
    return monsters[randomIndex]
  }
  }
}

export function calculateMonsterAttackInterval (monster) {
  return DamageCalculator.calculateMonsterAttackInterval(monster)
}

export function clearMonsterCache (monster) {
  return DamageCalculator.clearMonsterCache(monster)
}

export function getElementAdvantageMultiplier (skillElement, enemyElement) {
  return DamageCalculator.getElementAdvantageMultiplier(skillElement, enemyElement)
}

export function clamp (value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function lerp (start, end, t) {
  return start + (end - start) * t
}

export function randomRange (min, max) {
  return Math.random() * (max - min) + min
}

export function randomInt (min, max) {
  return Math.floor(randomRange(min, max + 1))
}
