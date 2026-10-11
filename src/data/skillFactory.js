import { SKILL_TYPES, ELEMENT_TYPES } from './skills'

export function createSkill (config) {
  return {
    id: config.id || `${config.class}_${config.key}`,
    key: config.key,
    name: config.name,
    icon: config.icon,
    audio: config.audio,
    description: config.description || '',
    type: config.type || SKILL_TYPES.SINGLE,
    element: config.element || ELEMENT_TYPES.NONE,

    damage: config.damage || 0,
    cd: config.cd || 0,
    baseCooldown: config.cd || config.baseCooldown || 0,
    manaCost: config.manaCost || 0,

    unlockLevel: config.unlockLevel || 1,
    unlockCondition: config.unlockCondition || null,

    proficiency: createProficiencyConfig(config.proficiency),
    proficiencyEffect: config.proficiencyEffect || {},

    damageCalculation: config.damageCalculation || createDefaultDamageCalculator(config),
    healingCalculation: config.healingCalculation || createDefaultHealingCalculator(config),
    dotDamageCalculation: config.dotDamageCalculation || createDefaultDotDamageCalculator(config),
    buffCalculation: config.buffCalculation || null,

    duration: config.duration || 0,
    tickInterval: config.tickInterval || 0,
    dotDamage: config.dotDamage || 0,

    buffDuration: config.buffDuration || 0,
    subSkills: config.subSkills || {},
    effect: config.effect || '',

    requirements: config.requirements || {},
    class: config.class
  }
}

export function createProficiencyConfig (config) {
  return {
    level: config?.level || 1,
    exp: config?.exp || 0,
    maxLevel: config?.maxLevel || 10,
    effect: config?.effect || {}
  }
}

export function createDefaultDamageCalculator (config) {
  return function (player, skillLevel = 1) {
    const proficiencyDamage =
      (config.damage || 0) + (config.proficiency?.effect?.increment || 0) * (skillLevel - 1)
    const attributeMultiplier = getAttributeMultiplier(config.type)
    const mainAttribute = getMainAttribute(config.type)
    const attributeDamage = player.stats[mainAttribute] * attributeMultiplier

    return Math.floor(proficiencyDamage + (player.attack || 0) + attributeDamage)
  }
}

export function createDefaultHealingCalculator (config) {
  return function (player, skillLevel = 1) {
    const proficiencyHealing =
      (config.damage || 0) + (config.proficiency?.effect?.increment || 0) * (skillLevel - 1)
    const intDamage = player.stats.intelligence * 5.84

    return Math.floor(proficiencyHealing + intDamage)
  }
}

export function createDefaultDotDamageCalculator (config) {
  return function (player, skillLevel = 1) {
    const proficiencyDamage =
      (config.dotDamage || 0) + (config.proficiency?.effect?.dotIncrement || 0) * (skillLevel - 1)
    const intDamage = player.stats.intelligence * 3.88

    return Math.floor(proficiencyDamage + intDamage)
  }
}

export function createDefaultBuffCalculator (config) {
  return function (skillLevel = 1, intelligence = 0) {
    const results = {}

    if (config.proficiencyEffect) {
      for (const [key, effect] of Object.entries(config.proficiencyEffect)) {
        if (typeof effect === 'object') {
          if (Array.isArray(effect.damageTable)) {
            // 查找表模式：直接按等级索引取值
            const idx = Math.max(0, Math.min(effect.damageTable.length - 1, skillLevel - 1))
            results[key] = effect.damageTable[idx]
          } else if (effect.base !== undefined) {
            results[key] = effect.base + (effect.increment || 0) * (skillLevel - 1)
          }
        }
      }
    }

    return results
  }
}

export function createSkillConfig (baseConfig, overrides = {}) {
  return createSkill({
    ...baseConfig,
    ...overrides,
    proficiency: {
      ...baseConfig.proficiency,
      ...overrides.proficiency
    }
  })
}

export function createSkillSet (configs) {
  const skillSet = {}

  for (const config of configs) {
    skillSet[config.key] = createSkill(config)
  }

  return skillSet
}

function getAttributeMultiplier (skillType) {
  const multipliers = {
    [SKILL_TYPES.SINGLE]: 1,
    [SKILL_TYPES.AOE]: 3,
    [SKILL_TYPES.HEAL]: 0,
    [SKILL_TYPES.BUFF]: 0,
    [SKILL_TYPES.DOT]: 3.5
  }

  return multipliers[skillType] || 1
}

function getMainAttribute (skillType) {
  const attributes = {
    [SKILL_TYPES.SINGLE]: 'strength',
    [SKILL_TYPES.AOE]: 'strength',
    [SKILL_TYPES.HEAL]: 'intelligence',
    [SKILL_TYPES.BUFF]: 'intelligence',
    [SKILL_TYPES.DOT]: 'intelligence'
  }

  return attributes[skillType] || 'strength'
}
