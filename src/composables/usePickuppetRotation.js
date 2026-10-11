/**
 * @file 捡东西宠物轮播展示组合式函数
 * @description 实现钻石商店中捡东西宠物的每日轮播展示逻辑
 * 每天展示4个宠物（按列表顺序轮播），0点重置
 * ID7613（小怪笑箱）始终展示，不占用4个名额
 * @since 2026-06-22
 */

import { computed } from 'vue'
import { DIAMOND_SHOP_ITEMS } from '@/data/DIAMOND_SHOP_ITEMS'

/** 每天展示的捡东西宠物数量（不含固定展示的7613） */
const DAILY_DISPLAY_COUNT = 4

/** 固定展示的捡东西宠物ID（不占用轮播名额） */
const FIXED_PICKUPPET_ID = 7613

/** 捡东西宠物类别标识 */
const PICKUPPET_CATEGORY = 'pickuppet'

/**
 * 从钻石商店数据中提取所有捡东西宠物，按ID升序排列
 * @returns {Array<object>} 捡东西宠物列表
 */
function getAllPickuppets () {
  const result = []
  const data = DIAMOND_SHOP_ITEMS
  if (!data || typeof data !== 'object') {
    return result
  }
  Object.keys(data).forEach(key => {
    const item = data[key]
    if (item && item.category === PICKUPPET_CATEGORY) {
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
 * 根据天数索引计算当天应展示的捡东西宠物列表
 * @param {Array<object>} allPickuppets - 所有捡东西宠物列表
 * @param {number} dayIndex - 天数索引（从0开始）
 * @returns {Array<object>} 当天应展示的宠物列表（不含固定展示的7613）
 */
function getDailyRotationPickuppets (allPickuppets, dayIndex) {
  // 过滤掉固定展示的宠物，这些宠物不参与轮播
  const rotationList = allPickuppets.filter(p => Number(p.id) !== FIXED_PICKUPPET_ID)
  const totalItems = rotationList.length

  if (totalItems === 0) {
    return []
  }

  // 计算起始位置，循环轮播
  const startIndex = (dayIndex * DAILY_DISPLAY_COUNT) % totalItems
  const result = []

  for (let i = 0; i < DAILY_DISPLAY_COUNT; i++) {
    const index = (startIndex + i) % totalItems
    result.push(rotationList[index])
  }

  return result
}

/**
 * 捡东西宠物轮播展示组合式函数
 * @returns {{ dailyPickuppets: import('vue').ComputedRef<Array<object>>, rotationInfo: import('vue').ComputedRef<object> }}
 * dailyPickuppets - 当天展示的宠物列表（包含固定展示的7613）
 * rotationInfo - 轮播信息（总数、当天索引、重置时间等）
 */
export function usePickuppetRotation () {
  // 获取所有捡东西宠物（已排序）
  const allPickuppets = getAllPickuppets()

  // 当天展示的捡东西宠物列表
  const dailyPickuppets = computed(() => {
    // 计算天数索引：使用当天0点时间戳除以一天的毫秒数
    const midnight = getTodayMidnightTimestamp()
    const dayIndex = Math.floor(midnight / (24 * 60 * 60 * 1000))

    // 获取轮播宠物（不含7613）
    const rotationPets = getDailyRotationPickuppets(allPickuppets, dayIndex)

    // 获取固定展示的宠物（ID7613）
    const fixedPet = allPickuppets.find(p => Number(p.id) === FIXED_PICKUPPET_ID)

    // 固定展示的宠物放在最前面，不占用轮播名额
    const result = []
    if (fixedPet) {
      result.push(fixedPet)
    }
    result.push(...rotationPets)

    return result
  })

  // 轮播信息（用于UI展示）
  const rotationInfo = computed(() => {
    const rotationList = allPickuppets.filter(p => Number(p.id) !== FIXED_PICKUPPET_ID)
    const totalDays = Math.ceil(rotationList.length / DAILY_DISPLAY_COUNT)
    const midnight = getTodayMidnightTimestamp()
    const dayIndex = Math.floor(midnight / (24 * 60 * 60 * 1000))
    const currentCycleDay = dayIndex % totalDays

    return {
      /** 捡东西宠物总数 */
      totalPickuppets: allPickuppets.length,
      /** 参与轮播的宠物数（不含7613） */
      rotationCount: rotationList.length,
      /** 每天展示数量 */
      dailyCount: DAILY_DISPLAY_COUNT,
      /** 完整轮播周期天数 */
      totalDays,
      /** 当前周期中的第几天（0-based） */
      currentCycleDay,
      /** 固定展示的宠物ID */
      fixedPetId: FIXED_PICKUPPET_ID,
      /** 明天0点时间戳 */
      nextResetTime: midnight + 24 * 60 * 60 * 1000
    }
  })

  return {
    dailyPickuppets,
    rotationInfo
  }
}
