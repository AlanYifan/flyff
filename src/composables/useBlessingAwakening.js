/**
 * @fileoverview 祝福唤醒组合式函数 (Blessing Awakening)
 * @description 处理时装物品祝福唤醒逻辑（女神祝福/恶魔祝福），最多 3 条属性，支持锁定/解锁
 * @author FLYFF Team
 * @version 2.1.0
 * @created 2026-07-16
 * @updated 2026-07-16 修复女神祝福20%增幅四舍五入问题(保留一位小数);新增唤醒次数(awakenCount)和英文名称(blessingTypeNameEn)写入时装道具数据;调整百分比属性概率权重(1%→75%, 2%→20%, 3%→5%, 剩余25%归入最小值)
 */

import { getParameterName } from '@/store/descriptions.js'

/**
 * 祝福唤醒卷轴 ID
 * - 7064: 女神的祝福 (Goddess's Blessing)
 * - 27754: 恶魔祝福 (Demon's Blessing)
 */
export const BLESSING_SCROLL_IDS = [7064, 27754]

/**
 * 卷轴 ID 到祝福类型的映射
 */
const SCROLL_TO_BLESSING_TYPE = {
  7064: 'goddess',
  27754: 'demon'
}

/**
 * 祝福类型到中文名称的映射
 */
const BLESSING_TYPE_NAMES = {
  goddess: '女神的祝福',
  demon: '恶魔的祝福'
}

/**
 * 祝福类型到英文名称的映射（写入时装道具数据中）
 */
const BLESSING_TYPE_NAMES_EN = {
  goddess: "Goddess's Blessing",
  demon: "Demon's Blessing"
}

/**
 * 女神的祝福属性值加成倍率（整体高20%）
 */
export const GODDESS_BONUS_MULTIPLIER = 1.2

/**
 * 最大唤醒属性条数
 */
export const MAX_BLESSING_ATTRIBUTES = 3

/**
 * 百分比属性的自定义概率权重表（权重之和为 100）
 * 用户需求: 1% → 50%概率, 2% → 20%概率, 3% → 5%概率
 * 剩余 25% 概率归入最小值(1%), 即 1% 实际概率为 75%
 * @type {Object<number, number>}
 */
export const RATE_VALUE_WEIGHTS = {
  1: 75,
  2: 20,
  3: 5
}

/**
 * 可唤醒属性池 —— 按用户需求分三组
 * 每组: parameter(参数key), min(最小值), max(最大值), isRate(是否百分比)
 * 规则: 值越大，出现概率越低
 */
const AWAKENING_POOL_GROUPS = [
  // 第一组：基础属性 min 1, max 10, rate: false
  [
    { parameter: 'strength', min: 1, max: 10, isRate: false },
    { parameter: 'agility', min: 1, max: 10, isRate: false },
    { parameter: 'intelligence', min: 1, max: 10, isRate: false },
    { parameter: 'constitution', min: 1, max: 10, isRate: false }
  ],
  // 第二组：战斗属性 min 1, max 100, rate: false
  [
    { parameter: 'attack', min: 1, max: 100, isRate: false },
    { parameter: 'defense', min: 1, max: 100, isRate: false },
    { parameter: 'maxhp', min: 1, max: 100, isRate: false },
    { parameter: 'magicdefense', min: 1, max: 100, isRate: false },
    { parameter: 'maxmp', min: 1, max: 100, isRate: false }
  ],
  // 第三组：百分比属性 min 1%, max 3%, rate: true
  [
    { parameter: 'decreasedcastingtime', min: 1, max: 3, isRate: true },
    { parameter: 'attackspeed', min: 1, max: 3, isRate: true },
    { parameter: 'hitrate', min: 1, max: 3, isRate: true },
    { parameter: 'criticalrate', min: 1, max: 3, isRate: true },
    { parameter: 'criticaldamage', min: 1, max: 3, isRate: true },
    { parameter: 'blockrate', min: 1, max: 3, isRate: true },
    { parameter: 'dodgerate', min: 1, max: 3, isRate: true }
  ]
]

/** 扁平化后的完整属性池 */
const FASHION_AWAKENING_POOL = AWAKENING_POOL_GROUPS.flat()

/**
 * 获取卷轴的祝福类型
 * @param {number} scrollId - 卷轴物品 ID
 * @returns {string|null} 祝福类型 ('goddess' | 'demon') 或 null
 */
export function getBlessingTypeByScrollId (scrollId) {
  return SCROLL_TO_BLESSING_TYPE[Number(scrollId)] || null
}

/**
 * 获取祝福类型的中文名称
 * @param {string} type - 祝福类型 ('goddess' | 'demon')
 * @returns {string} 中文名称
 */
export function getBlessingTypeName (type) {
  return BLESSING_TYPE_NAMES[type] || '未知祝福'
}

/**
 * 获取祝福类型的英文名称
 * @param {string} type - 祝福类型 ('goddess' | 'demon')
 * @returns {string} 英文名称
 */
export function getBlessingTypeNameEn (type) {
  return BLESSING_TYPE_NAMES_EN[type] || 'Blessing Awakening'
}

/**
 * 获取参数的中文显示名称
 * @param {string} param - 参数英文 key
 * @returns {string} 中文显示名称
 */
function getParamDisplayName (param) {
  return getParameterName(param) || param
}

/**
 * 从属性池中随机选择一个属性配置
 * @returns {Object} 属性配置对象 { parameter, min, max, isRate }
 */
function pickRandomParam () {
  const idx = Math.floor(Math.random() * FASHION_AWAKENING_POOL.length)
  return FASHION_AWAKENING_POOL[idx]
}

/**
 * 根据权重随机选择一个唤醒值
 * - 默认权重公式: weight = (max - value + 1)，最小值权重最大，最大值权重为 1
 * - 百分比属性(isRate)使用自定义权重表 RATE_VALUE_WEIGHTS
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {Object<number, number>|null} customWeights - 自定义权重表 { value: weight }，为 null 时使用默认公式
 * @returns {number} 随机值
 */
function rollValue (min, max, customWeights = null) {
  const candidates = []
  let totalWeight = 0

  for (let v = min; v <= max; v++) {
    const weight = customWeights ? (customWeights[v] || 0) : (max - v + 1)
    candidates.push({ value: v, weight })
    totalWeight += weight
  }

  let random = Math.random() * totalWeight
  for (const c of candidates) {
    random -= c.weight
    if (random <= 0) {
      return c.value
    }
  }
  return min
}

/**
 * 创建一条随机唤醒属性
 * @param {boolean} locked - 是否锁定
 * @param {boolean} isGoddess - 是否为女神的祝福（效果+20%）
 * @returns {Object} 属性对象 { parameter, parameterName, value, isRate, locked }
 */
function createRandomAttribute (locked = false, isGoddess = false) {
  const paramConfig = pickRandomParam()
  // 百分比属性使用自定义概率权重表
  const customWeights = paramConfig.isRate ? RATE_VALUE_WEIGHTS : null
  const baseValue = rollValue(paramConfig.min, paramConfig.max, customWeights)
  // 女神的祝福：属性值整体高20%（保留一位小数，不四舍五入到整数，至少为1，可超过原始最大值）
  const finalValue = isGoddess
    ? Math.max(1, Math.round(baseValue * GODDESS_BONUS_MULTIPLIER * 10) / 10)
    : baseValue
  return {
    parameter: paramConfig.parameter,
    parameterName: getParamDisplayName(paramConfig.parameter),
    value: finalValue,
    isRate: paramConfig.isRate,
    locked,
    isGoddessBonus: isGoddess
  }
}

/**
 * 使用祝福唤醒组合式函数 (Blessing Awakening)
 * @returns {Object} 祝福唤醒相关的方法
 */
export function useBlessingAwakening () {
  /**
   * 获取所有可用的唤醒属性列表（分组）
   * @returns {Array<Array<Object>>} 分组后的属性信息数组
   */
  const getAvailableAwakeningParams = () => {
    return AWAKENING_POOL_GROUPS.map(group =>
      group.map(item => {
        // 百分比属性使用自定义权重表
        const customWeights = item.isRate ? RATE_VALUE_WEIGHTS : null
        const range = item.max - item.min + 1
        // 计算总权重: 百分比属性用自定义权重求和，其他用 n*(n+1)/2
        let totalWeight
        if (customWeights) {
          totalWeight = 0
          for (let v = item.min; v <= item.max; v++) {
            totalWeight += customWeights[v] || 0
          }
        } else {
          totalWeight = range * (range + 1) / 2
        }
        // 构建概率列表
        let probabilities = []
        if (range <= 10) {
          // 小范围：展示所有值的概率
          for (let v = item.min; v <= item.max; v++) {
            const weight = customWeights ? (customWeights[v] || 0) : (item.max - v + 1)
            probabilities.push({
              value: v,
              percent: Math.round((weight / totalWeight) * 10000) / 100
            })
          }
        } else {
          // 大范围(如1-100)：采样展示关键值
          const samples = [item.min, Math.round(range * 0.25), Math.round(range * 0.5), Math.round(range * 0.75), item.max]
          const uniqueSamples = [...new Set(samples)].sort((a, b) => a - b)
          probabilities = uniqueSamples.map(v => {
            const weight = customWeights ? (customWeights[v] || 0) : (item.max - v + 1)
            return {
              value: v,
              percent: Math.round((weight / totalWeight) * 10000) / 100
            }
          })
        }
        return {
          id: item.parameter,
          name: getParamDisplayName(item.parameter),
          min: item.min,
          max: item.max,
          isRate: item.isRate,
          probabilities
        }
      })
    )
  }

  /**
   * 执行时装祝福唤醒（Blessing Awakening）
   * - 每次唤醒会重新随机所有未锁定的属性
   * - 如果已有属性不足 3 条，会补充新属性到 3 条
   * - 锁定的属性保持不变
   * @param {Object} fashionItem - 时装物品对象
   * @param {number} scrollId - 使用的卷轴 ID (7064 或 27754)
   * @param {Array<boolean>} lockStates - 各属性槽位的锁定状态数组，如 [true, false, true]
   * @returns {Object} 唤醒结果 { success, blessingType, attributes, changedIndices }
   */
  const performBlessingAwakening = (fashionItem, scrollId, lockStates = []) => {
    try {
      const blessingType = getBlessingTypeByScrollId(scrollId)
      if (!blessingType) {
        return { success: false, message: '无效的祝福卷轴' }
      }

      // 获取当前已有的祝福属性
      const existingData = fashionItem?.blessedData
      const existingAttributes = (existingData?.attributes && Array.isArray(existingData.attributes))
        ? existingData.attributes
        : []

      // 获取已有唤醒次数（首次唤醒为0）
      const existingAwakenCount = existingData?.awakenCount || 0

      // 判断是否为女神的祝福（效果+20%）
      const isGoddess = blessingType === 'goddess'

      const newAttributes = []
      const changedIndices = []

      // 处理已有属性槽位
      for (let i = 0; i < existingAttributes.length; i++) {
        const isLocked = lockStates[i] === true
        if (isLocked) {
          // 锁定的属性保持不变
          newAttributes.push({ ...existingAttributes[i], locked: true })
        } else {
          // 未锁定的属性重新随机
          newAttributes.push(createRandomAttribute(false, isGoddess))
          changedIndices.push(i)
        }
      }

      // 补充新属性到最大数量
      while (newAttributes.length < MAX_BLESSING_ATTRIBUTES) {
        newAttributes.push(createRandomAttribute(false, isGoddess))
        changedIndices.push(newAttributes.length - 1)
      }

      return {
        success: true,
        blessingType,
        blessingTypeNameEn: getBlessingTypeNameEn(blessingType),
        attributes: newAttributes,
        changedIndices,
        awakenCount: existingAwakenCount + 1
      }
    } catch (error) {
      console.error('[useBlessingAwakening] 唤醒失败:', error)
      return { success: false, message: '唤醒过程出错' }
    }
  }

  /**
   * 检查时装物品是否已被祝福唤醒
   * @param {Object} fashionItem - 时装物品对象
   * @returns {boolean} 是否已被唤醒
   */
  const isFashionBlessed = fashionItem => {
    if (!fashionItem) return false
    return Boolean(fashionItem.blessedData)
  }

  /**
   * 获取时装物品的祝福唤醒数据
   * @param {Object} fashionItem - 时装物品对象
   * @returns {Object|null} 祝福数据 { blessingType, attributes[] }
   */
  const getFashionBlessingData = fashionItem => {
    if (!fashionItem) return null
    return fashionItem.blessedData || null
  }

  /**
   * 切换指定槽位的锁定状态
   * @param {Object} fashionItem - 时装物品对象
   * @param {number} slotIndex - 槽位索引 (0-2)
   * @returns {Object|null} 更新后的祝福数据，null 表示失败
   */
  const toggleAttributeLock = (fashionItem, slotIndex) => {
    if (!fashionItem?.blessedData?.attributes) return null
    const attrs = fashionItem.blessedData.attributes
    if (slotIndex < 0 || slotIndex >= attrs.length) return null
    attrs[slotIndex] = { ...attrs[slotIndex], locked: !attrs[slotIndex].locked }
    return fashionItem.blessedData
  }

  return {
    getAvailableAwakeningParams,
    performBlessingAwakening,
    isFashionBlessed,
    getFashionBlessingData,
    toggleAttributeLock
  }
}
