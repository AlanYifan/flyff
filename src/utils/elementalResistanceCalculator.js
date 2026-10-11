/**
 * @fileoverview 衣服属性精炼元素抗性计算工具
 * @description 根据精炼元素类型和等级计算衣服的元素抗性加成
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-07-07
 */

/**
 * 五大元素类型列表
 * @type {readonly string[]}
 */
export const ELEMENT_KEYS = Object.freeze(['fire', 'water', 'wind', 'earth', 'thunder'])

/**
 * 元素中文名称映射
 * @type {Readonly<Object>}
 */
export const ELEMENT_LABELS = Object.freeze({
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  thunder: '雷'
})

/**
 * 元素克制关系映射（单向克制链：火→风→土→雷→水→火）
 * - 火克制风
 * - 风克制土
 * - 土克制雷
 * - 雷克制水
 * - 水克制火
 * 被克制的元素获得抗性减益（-3%/级）
 * @type {Readonly<Object>}
 */
export const ELEMENT_COUNTER_MAP = Object.freeze({
  fire: 'wind',
  wind: 'earth',
  earth: 'thunder',
  thunder: 'water',
  water: 'fire'
})

/**
 * 元素抗性图标路径映射
 * @type {Readonly<Object>}
 */
export const ELEMENT_ICON_MAP = Object.freeze({
  fire: '/pt/element/fire_火.png',
  water: '/pt/element/water_水.png',
  wind: '/pt/element/wind_风.png',
  earth: '/pt/element/earth_土.png',
  thunder: '/pt/element/electricity_雷.png'
})

/**
 * 属性抗性能力参数到元素键名的映射
 * @type {Readonly<Object>}
 */
export const DEFENSE_PARAM_TO_ELEMENT_KEY = Object.freeze({
  firedefense: 'fire',
  waterdefense: 'water',
  winddefense: 'wind',
  earthdefense: 'earth',
  electricitydefense: 'thunder'
})

/**
 * 每级主元素抗性加成（百分比）
 * @type {number}
 */
const MAIN_ELEMENT_BONUS_PER_LEVEL = 3

/**
 * 每级被克制元素抗性减益（百分比）
 * @type {number}
 */
const COUNTERED_ELEMENT_PENALTY_PER_LEVEL = -3

/**
 * 每级其他元素抗性加成（百分比）
 * @type {number}
 */
const OTHER_ELEMENT_BONUS_PER_LEVEL = 1.5

/**
 * 根据精炼元素类型和等级计算衣服的元素抗性加成
 *
 * 规则（以火属性为例，等级 N）：
 * - 火属性抗性：+3% × N（主元素）
 * - 风属性抗性：-3% × N（火克制风，被克制元素获得减益）
 * - 水/土/雷属性抗性：+1.5% × N（其他元素）
 *
 * 完整克制链：火→风→土→雷→水→火
 *
 * @example
 * // 火属性 +1（火克风）
 * calculateSuitElementalResistances('fire', 1)
 * // => { fire: 3, wind: -3, water: 1.5, earth: 1.5, thunder: 1.5 }
 *
 * // 火属性 +10（火克风）
 * calculateSuitElementalResistances('fire', 10)
 * // => { fire: 30, wind: -30, water: 15, earth: 15, thunder: 15 }
 *
 * // 雷属性 +1（雷克水）
 * calculateSuitElementalResistances('thunder', 1)
 * // => { thunder: 3, water: -3, fire: 1.5, wind: 1.5, earth: 1.5 }
 *
 * @param {string} elementKey - 元素键名：'fire' | 'water' | 'wind' | 'earth' | 'thunder'
 * @param {number} level - 属性精炼等级（1~10）
 * @returns {Object<string, number>} 各元素抗性加成百分比，键为元素键名，值为百分比数值
 */
export function calculateSuitElementalResistances (elementKey, level) {
  const normalizedLevel = Number(level)
  if (!Number.isFinite(normalizedLevel) || normalizedLevel <= 0) {
    return { fire: 0, water: 0, wind: 0, earth: 0, thunder: 0 }
  }

  const counteredKey = ELEMENT_COUNTER_MAP[elementKey]
  const result = {}

  for (const key of ELEMENT_KEYS) {
    if (key === elementKey) {
      result[key] = MAIN_ELEMENT_BONUS_PER_LEVEL * normalizedLevel
    } else if (key === counteredKey) {
      result[key] = COUNTERED_ELEMENT_PENALTY_PER_LEVEL * normalizedLevel
    } else {
      result[key] = OTHER_ELEMENT_BONUS_PER_LEVEL * normalizedLevel
    }
  }

  return result
}

/**
 * 将元素抗性对象格式化为可读字符串数组
 *
 * @example
 * formatElementalResistances({ fire: 3, wind: -3, water: 1.5, earth: 1.5, thunder: 1.5 })
 * // => ['火属性抗性 +3%', '水属性抗性 +1.5%', '风属性抗性 -3%', '土属性抗性 +1.5%', '雷属性抗性 +1.5%']
 *
 * @param {Object<string, number>} resistances - 元素抗性对象
 * @returns {string[]} 格式化后的抗性描述字符串数组
 */
export function formatElementalResistances (resistances) {
  if (!resistances || typeof resistances !== 'object') {
    return []
  }

  return ELEMENT_KEYS
    .map(key => {
      const value = Number(resistances[key] ?? 0)
      if (!Number.isFinite(value) || value === 0) {
        return null
      }
      const label = ELEMENT_LABELS[key] || key
      const sign = value > 0 ? '+' : ''
      return `${label}属性抗性 ${sign}${value}%`
    })
    .filter(Boolean)
}
