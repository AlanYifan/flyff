/**
 * 物品数据配置
 * 物品相关的常量和配置
 * 
 * 注意：物品数据现在统一从 itemsStore 获取
 * 物品工具函数已移至 src/utils/itemUtils.js
 */

import { classKeyToNameMap } from '@/utils/itemHelpers'
import {
  ITEM_QUALITY_NAMES,
  ITEM_CATEGORY_NAMES,
  WEAPON_SUBCATEGORY_NAMES,
  ARMOR_SUBCATEGORY_NAMES,
  ELEMENT_NAMES
} from '@/store/descriptions'

// 职业限制（使用统一的映射表）
export const CLASS_RESTRICTION = {
  ...classKeyToNameMap,
  all: '全职业'
}

// 物品稀有度配置（颜色保留在此，名称使用统一描述管理）
export const ITEM_RARITY = {
  common: { name: ITEM_QUALITY_NAMES.common, color: '#C0C0C0' },
  uncommon: { name: ITEM_QUALITY_NAMES.uncommon, color: '#00FF00' },
  rare: { name: ITEM_QUALITY_NAMES.rare, color: '#0070FF' },
  epic: { name: ITEM_QUALITY_NAMES.epic, color: '#A335EE' },
  legendary: { name: ITEM_QUALITY_NAMES.legendary, color: '#FF8000' },
  mythic: { name: ITEM_QUALITY_NAMES.mythic, color: '#E6CC80' }
}

// 物品类别配置（使用统一描述管理）
export const ITEM_CATEGORY = ITEM_CATEGORY_NAMES

// 武器子类别（使用统一描述管理）
export const WEAPON_SUBCATEGORY = WEAPON_SUBCATEGORY_NAMES

// 防具子类别（使用统一描述管理）
export const ARMOR_SUBCATEGORY = ARMOR_SUBCATEGORY_NAMES

// 饰品子类别
export const ACCESSORY_SUBCATEGORY = {
  necklace: '项链',
  ring: '戒指',
  earring: '耳环'
}

// 元素类型（使用统一描述管理）
export const ELEMENT_TYPE = ELEMENT_NAMES

// 强化等级奖励属性表
export const ENHANCE_SET_BONUS_TABLE = {
  3: [
    { parameter: 'hitrate', add: 5, rate: true },
    { parameter: 'blockrate', add: 3, rate: true },
    { parameter: 'allstats', add: 1, rate: false }
  ],
  4: [
    { parameter: 'hitrate', add: 10, rate: true },
    { parameter: 'blockrate', add: 3, rate: true },
    { parameter: 'allstats', add: 2, rate: false }
  ],
  5: [
    { parameter: 'hitrate', add: 15, rate: true },
    { parameter: 'blockrate', add: 3, rate: true },
    { parameter: 'maxhp', add: 5, rate: true },
    { parameter: 'allstats', add: 3, rate: false }
  ],
  6: [
    { parameter: 'hitrate', add: 20, rate: true },
    { parameter: 'blockrate', add: 6, rate: true },
    { parameter: 'maxhp', add: 5, rate: true },
    { parameter: 'allstats', add: 4, rate: false },
    { parameter: 'attack', add: 1, rate: true }
  ],
  7: [
    { parameter: 'hitrate', add: 25, rate: true },
    { parameter: 'blockrate', add: 6, rate: true },
    { parameter: 'maxhp', add: 5, rate: true },
    { parameter: 'allstats', add: 5, rate: false },
    { parameter: 'attack', add: 2, rate: true }
  ],
  8: [
    { parameter: 'hitrate', add: 30, rate: true },
    { parameter: 'blockrate', add: 10, rate: true },
    { parameter: 'maxhp', add: 10, rate: true },
    { parameter: 'allstats', add: 6, rate: false },
    { parameter: 'attack', add: 3, rate: true }
  ],
  9: [
    { parameter: 'hitrate', add: 35, rate: true },
    { parameter: 'blockrate', add: 10, rate: true },
    { parameter: 'maxhp', add: 15, rate: true },
    { parameter: 'allstats', add: 7, rate: false },
    { parameter: 'attack', add: 4, rate: true }
  ],
  10: [
    { parameter: 'hitrate', add: 45, rate: true },
    { parameter: 'blockrate', add: 15, rate: true },
    { parameter: 'maxhp', add: 20, rate: true },
    { parameter: 'allstats', add: 8, rate: false },
    { parameter: 'attack', add: 5, rate: true }
  ]
}

// 性别限制
export const GENDER_RESTRICTION = {
  male: '男性',
  female: '女性',
  all: '全性别'
}

/**
 * 获取物品稀有度颜色
 * @param {string} rarity - 稀有度
 * @returns {string} 颜色值
 */
export function getRarityColor (rarity) {
  return ITEM_RARITY[rarity]?.color || '#C0C0C0'
}

/**
 * 获取物品稀有度名称
 * @param {string} rarity - 稀有度
 * @returns {string} 稀有度名称
 */
export function getRarityName (rarity) {
  return ITEM_RARITY[rarity]?.name || '普通'
}

/**
 * 获取物品类别名称
 * @param {string} category - 类别
 * @returns {string} 类别名称
 */
export function getCategoryName (category) {
  return ITEM_CATEGORY[category] || '其他'
}

/**
 * 获取物品子类别名称
 * @param {string} category - 类别
 * @param {string} subcategory - 子类别
 * @returns {string} 子类别名称
 */
export function getSubcategoryName (category, subcategory) {
  if (category === 'weapon') {
    return WEAPON_SUBCATEGORY[subcategory] || '武器'
  } else if (category === 'armor') {
    return ARMOR_SUBCATEGORY[subcategory] || '防具'
  } else if (category === 'accessory') {
    return ACCESSORY_SUBCATEGORY[subcategory] || '饰品'
  }
  return subcategory || ''
}

/**
 * 获取元素名称
 * @param {string} element - 元素类型
 * @returns {string} 元素名称
 */
export function getElementName (element) {
  return ELEMENT_TYPE[element] || '无'
}
