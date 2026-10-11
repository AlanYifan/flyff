/**
 * @file 时装套装轮播展示组合式函数
 * @description 实现钻石商店中时装套装的每日轮播展示逻辑
 * 每天展示4款套装（按列表顺序轮播），0点重置
 * @since 2026-07-16
 */

import { computed } from 'vue'
import { FASHION_SET_SHOP_ITEMS } from '@/data/FASHION_SET_SHOP_ITEMS'

/** 每天展示的时装套装数量 */
const DAILY_DISPLAY_COUNT = 4

/** 时装套装类别标识 */
const FASHION_SET_CATEGORY = 'fashionset'

/**
 * 从时装套装商店数据中提取所有套装，按ID升序排列
 * @returns {Array<object>} 时装套装列表
 */
function getAllFashionSets () {
  const result = []
  const data = FASHION_SET_SHOP_ITEMS
  if (!data || typeof data !== 'object') {
    return result
  }
  Object.keys(data).forEach(key => {
    const item = data[key]
    if (item && item.category === FASHION_SET_CATEGORY) {
      result.push({ ...item })
    }
  })
  // 按ID升序排序，确保列表顺序一致
  result.sort((a, b) => Number(a.id) - Number(b.id))
  return result
}

/**
 * 获取当天0点的时间戳（毫秒）
 * @returns {number} 当天0点的Unix时间戳（毫秒）
 */
function getTodayMidnightTimestamp () {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

/**
 * 根据天数索引计算当天应展示的时装套装列表
 * @param {Array<object>} allSets - 所有时装套装列表
 * @param {number} dayIndex - 天数索引（从0开始）
 * @returns {Array<object>} 当天应展示的套装列表
 */
function getDailyRotationFashionSets (allSets, dayIndex) {
  const totalItems = allSets.length

  if (totalItems === 0) {
    return []
  }

  // 计算起始位置，循环轮播
  const startIndex = (dayIndex * DAILY_DISPLAY_COUNT) % totalItems
  const result = []

  for (let i = 0; i < DAILY_DISPLAY_COUNT; i++) {
    const index = (startIndex + i) % totalItems
    result.push(allSets[index])
  }

  return result
}

/**
 * 时装套装轮播展示组合式函数
 * @returns {{ dailyFashionSets: import('vue').ComputedRef<Array<object>>, fashionSetRotationInfo: import('vue').ComputedRef<object> }}
 * dailyFashionSets - 当天展示的套装列表
 * fashionSetRotationInfo - 轮播信息（总数、当天索引、重置时间等）
 */
export function useFashionSetRotation () {
  // 获取所有时装套装（已排序）
  const allFashionSets = getAllFashionSets()

  // 当天展示的时装套装列表
  const dailyFashionSets = computed(() => {
    // 计算天数索引：使用当天0点时间戳除以一天的毫秒数
    const midnight = getTodayMidnightTimestamp()
    const dayIndex = Math.floor(midnight / (24 * 60 * 60 * 1000))

    // 获取轮播套装
    return getDailyRotationFashionSets(allFashionSets, dayIndex)
  })

  // 轮播信息（用于UI展示）
  const fashionSetRotationInfo = computed(() => {
    const totalDays = Math.ceil(allFashionSets.length / DAILY_DISPLAY_COUNT)
    const midnight = getTodayMidnightTimestamp()
    const dayIndex = Math.floor(midnight / (24 * 60 * 60 * 1000))
    const currentCycleDay = dayIndex % totalDays

    return {
      /** 时装套装总数 */
      totalFashionSets: allFashionSets.length,
      /** 每天展示数量 */
      dailyCount: DAILY_DISPLAY_COUNT,
      /** 完整轮播周期天数 */
      totalDays,
      /** 当前周期中的第几天（0-based） */
      currentCycleDay,
      /** 明天0点时间戳 */
      nextResetTime: midnight + 24 * 60 * 60 * 1000
    }
  })

  return {
    dailyFashionSets,
    fashionSetRotationInfo
  }
}
