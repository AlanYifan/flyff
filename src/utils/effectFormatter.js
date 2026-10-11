/**
 * 效果格式化工具
 * 统一处理物品效果、BUFF 效果的显示格式化
 * 供 ItemTooltip、BuffTooltip 等组件使用
 */

import { ATTRIBUTE_NAMES, ELEMENT_MASTERY_NAMES, ELEMENT_RESISTANCE_NAMES, ELEMENT_NAMES } from '@/store/descriptions'
import { SKILL_INFO } from '@/data/SKILL_INFO'

/**
 * 获取技能名称
 * 用途/业务意图：根据技能ID从静态数据中查找技能名称
 * @param {number|string} skillId - 技能ID
 * @returns {string} 技能名称，如果未找到则返回 '未知技能'
 */
export function getSkillName (skillId) {
  if (!skillId) {
    return '未知技能'
  }
  const skillInfo = SKILL_INFO[String(skillId)]
  if (!skillInfo) {
    return '未知技能'
  }
  // 处理多语言名称对象
  if (typeof skillInfo.name === 'object' && skillInfo.name !== null) {
    return skillInfo.name.cns || skillInfo.name.en || '未知技能'
  }
  return skillInfo.name || '未知技能'
}

/**
 * 百分比效果参数集合
 * 这些参数默认显示为百分比形式
 */
export const PERCENT_PARAMETERS = new Set([
  'criticalRate',
  'critRate',
  'criticalchance',
  'criticalDamage',
  'criticaldamage',
  'hitRate',
  'hitrate',
  'maxHpPercentage',
  'maxhppercentage',
  'dodgeRate',
  'blockRate',
  'block',
  'attackSpeed',
  'attackspeed',
  'speed',
  'attack_speed',
  'decreasedCastingTime',
  'decreasedcastingtime',
  'lifeSteal',
  'stealhp',
  'healPercent',
  'healing',
  'skillChance',
  'skillchance',
  'fireAttack',
  'waterAttack',
  'windAttack',
  'earthAttack',
  'thunderAttack',
  'fireMastery',
  'waterMastery',
  'windMastery',
  'earthMastery',
  'thunderMastery',
  'electricitymastery',
  'allelementsmastery',
  'mpCostPerAttack',
  'mpcostperattack',
  'blockpenetration',
  'damagetakenincrease'
])

/**
 * 倍率效果参数集合
 * 这些参数显示为倍率形式（如 ×100）
 */
const MULTIPLIER_PARAMETERS = new Set([
  'exprate',
  'goldrate'
])

/**
 * 获取参数的中文名称
 * @param {string} parameter - 参数类型
 * @returns {string} 中文名称
 */
export function getParameterName (parameter) {
  if (!parameter) {
    return ''
  }
  const key = String(parameter).toLowerCase()
  // 按优先级依次查找：属性 -> 元素精通 -> 元素抗性 -> 元素
  return ATTRIBUTE_NAMES[key] ||
    ATTRIBUTE_NAMES[parameter] ||
    ELEMENT_MASTERY_NAMES[key] ||
    ELEMENT_MASTERY_NAMES[parameter] ||
    ELEMENT_RESISTANCE_NAMES[key] ||
    ELEMENT_RESISTANCE_NAMES[parameter] ||
    ELEMENT_NAMES[key] ||
    ELEMENT_NAMES[parameter] ||
    parameter
}

/**
 * 判断参数是否为百分比类型
 * @param {string} parameter - 参数类型
 * @param {boolean} explicitRate - 显式指定的 rate 标志
 * @returns {boolean}
 */
export function isPercentParameter (parameter, explicitRate = null) {
  // 如果显式指定了 rate，以显式值为准
  if (explicitRate !== null && explicitRate !== undefined) {
    return Boolean(explicitRate)
  }
  // 否则根据参数类型判断
  const key = String(parameter || '').toLowerCase()
  return PERCENT_PARAMETERS.has(key)
}

/**
 * 判断参数是否为倍率类型
 * @param {string} parameter - 参数类型
 * @returns {boolean}
 */
export function isMultiplierParameter (parameter) {
  const key = String(parameter || '').toLowerCase()
  return MULTIPLIER_PARAMETERS.has(key)
}

/**
 * 格式化效果值显示
 * @param {string} parameter - 参数类型 (def, attack, hp, mp 等)
 * @param {number|object} value - 数值或对象 { add, rate, type }
 * @param {object} options - 可选配置
 * @param {boolean} options.rate - 是否为百分比（覆盖 value 中的 rate）
 * @param {boolean} options.showSign - 是否显示正负号（默认 true）
 * @returns {string} 格式化后的显示文本
 */
export function formatEffectValue (parameter, value, options = {}) {
  if (!parameter) {
    return ''
  }

  // 解析数值和 rate
  let numericValue = 0
  let isRate = false
  let displayValue = null // 用于倍率显示的特殊字段

  if (typeof value === 'object' && value !== null) {
    numericValue = Number(value.add ?? value.value ?? 0)
    isRate = Boolean(value.rate)
    displayValue = value.display !== undefined ? Number(value.display) : null
  } else {
    numericValue = Number(value)
  }

  // 如果 options 中显式指定了 rate，使用 options 的值
  if (options.rate !== undefined && options.rate !== null) {
    isRate = options.rate
  }

  // 检查数值是否有效
  if (!Number.isFinite(numericValue) || numericValue === 0) {
    return ''
  }

  const key = String(parameter).toLowerCase()

  // 处理倍率类型（经验、掉落、金币倍率）
  // 如果设置了 rate: true，则显示百分比形式（如 +100%）
  // 否则显示倍率形式（如 ×2）
  if (isMultiplierParameter(key)) {
    const label = getParameterName(key)
    
    // 如果是百分比形式，显示 +100%、+200%、+300%
    if (isRate) {
      const signedValue = numericValue > 0 ? `+${numericValue}` : `${numericValue}`
      return `${label}: ${signedValue}%`
    }
    
    // 否则显示倍率形式（如 ×2）
    // 优先使用 display 字段（如经验倍率的完整百分比值 200、300、400）
    // display 字段存储的是总倍率百分比（如 200 表示 200%），需要转换为倍数（如 2）
    const multiplier = displayValue !== null ? Math.round(displayValue / 100) : Math.round(numericValue / 100)
    // 如果 multiplier 为 0 且 numericValue 有效，则使用 numericValue 作为倍数
    const finalMultiplier = multiplier > 0 ? multiplier : (numericValue > 0 ? numericValue : 0)
    return `${label}: ×${finalMultiplier}`
  }

  // 获取参数名称
  const label = getParameterName(parameter)

  // 判断是否为百分比
  const shouldShowPercent = isRate || PERCENT_PARAMETERS.has(key)

  // 格式化数值显示
  const showSign = options.showSign !== false
  const signedValue = numericValue > 0 && showSign ? `+${numericValue}` : `${numericValue}`
  const suffix = shouldShowPercent ? '%' : ''

  return `${label}: ${signedValue}${suffix}`
}

/**
 * 格式化能力值显示（用于物品 abilities 数组）
 * @param {object} ability - 能力值对象 { parameter, add, rate, addMax, currentAdd, skill }
 *   - add: 最小值（固定）
 *   - addMax: 最大值（固定）
 *   - currentAdd: 当前洗练值（可选，洗练后的物品才有）
 * @returns {string} 格式化后的显示文本
 */
export function formatAbility (ability) {
  if (!ability || !ability.parameter) {
    return ''
  }

  const parameter = ability.parameter
  const addMin = ability.add
  const addMax = ability.addMax
  const currentAdd = ability.currentAdd
  const isRate = Boolean(ability.rate)

  // 处理 set 类型（例如无敌魔力多持续回满）
  if (ability.set !== undefined && ability.add === undefined) {
    const label = getParameterName(parameter)
    if (parameter === 'mp' && ability.set === -1) {
      return `${label} 持续回满`
    }
    return `${label} 设为 ${ability.set}`
  }

  // 如果没有数值，直接返回参数名称
  if (addMin === undefined) {
    return getParameterName(parameter)
  }

  const key = String(parameter).toLowerCase()

  // 确定显示值：优先使用 currentAdd（洗练后的值），否则使用 add
  const displayValue = currentAdd !== undefined ? currentAdd : addMin

  // 处理技能几率（skillchance）：使用技能名称替换通用标签
  if (key === 'skillchance' && ability.skill) {
    const skillName = getSkillName(ability.skill)
    const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
    const suffix = isRate ? '%' : ''
    // 如果有 addMax，显示固定范围
    if (addMax !== undefined) {
      return `${skillName}${signedValue}(${addMin}~${addMax})${suffix}`
    }
    return `${skillName}${signedValue}${suffix}`
  }

  const label = getParameterName(parameter)

  // 处理全元素精通：显示为单独一行
  if (key === 'allelementsmastery' || key === 'allelementsmastry') {
    const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
    // 如果有 addMax，显示固定范围
    if (addMax !== undefined) {
      return `${label} ${signedValue}(${addMin}~${addMax})%`
    }
    return `${label} ${signedValue}%`
  }

  // 处理倍率类型（经验、掉落、金币倍率）
  if (isMultiplierParameter(key)) {
    if (isRate) {
      const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
      // 如果有 addMax，显示固定范围
      if (addMax !== undefined) {
        return `${label}: ${signedValue}(${addMin}~${addMax})%`
      }
      return `${label}: ${signedValue}%`
    }
    const multiplier = Math.round(displayValue / 100)
    // 如果有 addMax，显示固定范围
    if (addMax !== undefined) {
      const multiplierMin = Math.round(addMin / 100)
      const multiplierMax = Math.round(addMax / 100)
      return `${label}: ×${multiplier}(${multiplierMin}~${multiplierMax})`
    }
    return `${label}: ×${multiplier}`
  }

  // 判断是否为百分比
  const shouldShowPercent = isRate || PERCENT_PARAMETERS.has(key)

  // 如果有 addMax，显示固定范围（add~addMax）
  if (addMax !== undefined) {
    const ratePrefix = shouldShowPercent ? '+' : ''
    const rateSuffix = shouldShowPercent ? '%' : ''
    return `${label} ${ratePrefix}${displayValue}(${addMin}~${addMax})${rateSuffix}`
  }

  // 普通显示
  const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
  const suffix = shouldShowPercent ? '%' : ''

  return `${label} ${signedValue}${suffix}`
}

/**
 * 格式化 BUFF 效果显示（用于 activeBuffs 数组）
 * @param {object} buff - BUFF 对象
 * @returns {string[]} 格式化后的效果文本数组
 */
export function formatBuffEffects (buff) {
  if (!buff || typeof buff !== 'object') {
    return []
  }

  const lines = []

  // 1. 处理 effects 对象格式
  if (buff.effects && typeof buff.effects === 'object') {
    const effects = buff.effects
    // 跳过复杂结构（如全能祝福的 subSkills）
    const hasComplexSubSkills = Object.values(effects).some(
      v => v && typeof v === 'object' && v.subSkills
    )
    if (!hasComplexSubSkills) {
      Object.entries(effects).forEach(([key, value]) => {
        const line = formatEffectValue(key, value)
        if (line) {
          lines.push(line)
        }
      })
    }
  }

  // 2. 如果没有 effects，尝试处理 parameter/value 格式
  if (lines.length === 0 && buff.parameter && buff.value !== undefined) {
    const line = formatEffectValue(buff.parameter, buff.value, { rate: buff.rate })
    if (line) {
      lines.push(line)
    }
  }

  return lines
}

export default {
  getSkillName,
  getParameterName,
  isPercentParameter,
  isMultiplierParameter,
  formatEffectValue,
  formatAbility,
  formatBuffEffects
}
