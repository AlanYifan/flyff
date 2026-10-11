// 物品相关的辅助函数
import { ELEMENT_NAMES, ITEM_QUALITY_NAMES } from '@/store/descriptions'
import { JOB_TIER_CONFIG } from '@/store/jobs'

// 职业映射表（数字ID -> 中文名称）
export const classMapping = {
  9686: '初心者', //初始职业
  764: '战士',
  8962: '圣职者',
  9098: '弓箭手',
  9581: '魔导士',
  5330: '骑士', //↑1转 ↓2转
  9150: '元素使者',
  3545: '暗杀者',
  9295: '游侠',
  9389: '守护使者',
  7424: '暴力技师',
  5709: '精神使者',
  2246: '刀锋战士',
  // 3转高级装备职业映射
  20311: '暗夜主宰',
  21680: '炽天使',
  22213: '心灵师',
  23509: '猎杀者',
  23623: '控能师',
  25863: '奥术师',
  28125: '圣殿骑士',
  28695: '爆裂射手'
}

// 中文职业名称到英文 Key 的映射表
export const classNameToKeyMap = {
  初心者: 'beginner',
  战士: 'warrior',
  圣职者: 'priest',
  弓箭手: 'archer',
  魔导士: 'mage',
  骑士: 'knight',
  刀锋战士: 'blade_warrior',
  元素使者: 'element_mage',
  精神使者: 'spirit_mage',
  游侠: 'ranger',
  暗杀者: 'assassin',
  守护使者: 'guardian',
  暴力技师: 'technician',
  圣殿骑士: 'holy_knight',
  猎杀者: 'storm_walker',
  奥术师: 'arcane_master',
  心灵师: 'mind_master',
  炽天使: 'nature_messenger',
  控能师: 'combat_master',
  爆裂射手: 'fierce_shooter',
  暗夜主宰: 'joker_emperor'
}

// 英文 Key 到中文职业名称的映射表
export const classKeyToNameMap = {
  beginner: '初心者',
  warrior: '战士',
  priest: '圣职者',
  archer: '弓箭手',
  mage: '魔导士',
  knight: '骑士',
  blade_warrior: '刀锋战士',
  element_mage: '元素使者',
  spirit_mage: '精神使者',
  ranger: '游侠',
  assassin: '暗杀者',
  guardian: '守护使者',
  technician: '暴力技师',
  holy_knight: '圣殿骑士',
  storm_walker: '猎杀者',
  arcane_master: '奥术师',
  mind_master: '心灵师',
  nature_messenger: '炽天使',
  combat_master: '控能师',
  fierce_shooter: '爆裂射手',
  joker_emperor: '暗夜主宰'
}

/**
 * 职业图标前缀映射表
 * 从 JOB_TIER_CONFIG 中动态提取，避免重复维护
 * @type {Record<string, string>}
 */
export const classIconMap = (() => {
  const map = {}
  // 从 JOB_TIER_CONFIG 提取图标前缀
  for (const [key, config] of Object.entries(JOB_TIER_CONFIG)) {
    if (config && config.iconPrefix) {
      map[key] = config.iconPrefix
    }
  }
  // 添加兼容旧版命名
  map.assistant = 'cxz'
  map.jester = 'ayzz'
  return Object.freeze(map)
})()

/**
 * 根据职业和性别获取头像路径
 * 三转职业图片命名格式为 {prefix}_{gender}.png（无_icon后缀）
 * 其他职业图片命名格式为 {prefix}_{gender}_icon.png
 * @param {string} classKey - 职业英文标识
 * @param {string} gender - 性别 ('male' | 'female')
 * @returns {string} 头像路径
 */
export function getClassIconPath (classKey, gender = 'male') {
  const key = classKey?.toLowerCase()
  const config = JOB_TIER_CONFIG[key]
  const iconPrefix = config?.iconPrefix || classIconMap[key] || 'cxz'
  const genderSuffix = gender === 'female' ? 'nv' : 'nan'
  // 三转职业图片命名无_icon后缀
  const iconSuffix = config?.tier === 3 ? '' : '_icon'
  return `/pt/job_icon/${iconPrefix}_${genderSuffix}${iconSuffix}.png`
}

// 职业父类映射表（用于装备职业限制检查）
export const classParents = {
  knight: 'warrior',
  blade_warrior: 'warrior',
  holy_knight: 'knight',
  storm_walker: 'blade_warrior',
  element_mage: 'mage',
  spirit_mage: 'mage',
  arcane_master: 'element_mage',
  mind_master: 'spirit_mage',
  ranger: 'archer',
  assassin: 'archer',
  fierce_shooter: 'ranger',
  joker_emperor: 'assassin',
  guardian: 'priest',
  technician: 'priest',
  nature_messenger: 'guardian',
  combat_master: 'technician'
}

// 职业别名映射表（用于技能职业匹配）
// key 是英文标识，value 是该职业可能的其他名称（包括中文和英文名）
export const classAliases = {
  beginner: ['beginner', 'novice', '初心者', '新手'],
  novice: ['novice', 'beginner', '初心者', '新手'],
  warrior: ['warrior', 'mercenary', '战士', 'Mercenary'],
  mercenary: ['mercenary', '战士', 'Mercenary'],
  priest: ['priest', 'acolyte', '圣职者', '牧师', 'Acolyte'],
  acolyte: ['acolyte', '牧师', 'Acolyte'],
  mage: ['mage', 'magician', '魔导士', '法师', 'Magician'],
  magician: ['magician', '法师', 'Magician'],
  archer: ['archer', '弓箭手'],
  assist: ['assist', '辅助', 'Assist'],
  knight: ['knight', '骑士', 'Knight'],
  blade_warrior: ['blade_warrior', 'blade', '刀锋战士', '刀锋', 'Blade'],
  blade: ['blade', '刀锋', 'Blade'],
  guardian: ['guardian', '守护使者', 'ringmaster', '守护贤者', 'Ringmaster'],
  ringmaster: ['ringmaster', '守护贤者', 'Ringmaster'],
  technician: ['technician', '暴力技师', 'billposter', '战斗贤者', 'Billposter'],
  billposter: ['billposter', '战斗贤者', 'Billposter'],
  element_mage: ['element_mage', 'elementor', '元素使者', '元素师', 'Elementor'],
  elementor: ['elementor', '元素师', 'Elementor'],
  spirit_mage: ['spirit_mage', 'psykeeper', '精神使者', '精神术士', 'Psykeeper'],
  psykeeper: ['psykeeper', '精神术士', 'Psykeeper'],
  ranger: ['ranger', '游侠', 'Ranger'],
  assassin: ['assassin', '暗杀者'],
  joker_emperor: ['joker_emperor', 'jester', '暗夜主宰', 'Jester'],
  jester: ['jester', '暗夜主宰', 'Jester']
}

// 检查玩家职业是否匹配要求的职业（支持父类匹配）
export function isPlayerClassAllowed (playerJob, requiredJob) {
  if (!requiredJob || requiredJob === 'all' || requiredJob === 'beginner') {
    return true
  }

  const normalizedPlayerJob = String(playerJob || '').toLowerCase().trim()
  const normalizedRequiredJob = String(requiredJob || '').toLowerCase().trim()

  if (normalizedPlayerJob === normalizedRequiredJob) {
    return true
  }

  // 检查父类链
  let current = normalizedPlayerJob
  while (current) {
    if (current === normalizedRequiredJob) {
      return true
    }
    current = classParents[current]
  }

  return false
}

// 检查职业名称是否匹配（支持别名匹配）
export function isClassNameMatched (requiredClass, playerClass) {
  if (!requiredClass || !playerClass) {
    return true
  }

  const normalizedRequired = String(requiredClass).toLowerCase().trim()
  const normalizedPlayer = String(playerClass).toLowerCase().trim()

  if (normalizedRequired === normalizedPlayer) {
    return true
  }

  const requiredAliases = classAliases[normalizedRequired] || [normalizedRequired]
  const playerAliases = classAliases[normalizedPlayer] || [normalizedPlayer]

  return requiredAliases.some(alias => playerAliases.includes(alias))
}

// 根据英文 Key 获取中文职业名称
export function getClassNameByKey (key) {
  return classKeyToNameMap[key] || key
}

// 根据中文职业名称获取英文 Key
export function getClassKeyByName (name) {
  return classNameToKeyMap[name] || name
}

// 获取职业限制名称
export function getClassRestrictionName (classId) {
  return classMapping[classId] || classId
}

// 性别映射表
export const genderMapping = {
  male: '男性',
  female: '女性',
  all: '所有'
}

// 获取性别名称
export function getGenderName (gender) {
  return genderMapping[gender] || gender
}

// 元素映射表（使用统一描述）
export const elementMapping = ELEMENT_NAMES

// 获取元素名称
export function getElementName (element) {
  return ELEMENT_NAMES[element] || element
}

// 品质映射表
export const rarityMapping = {
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
  veryrare: '传说',
  unique: '史诗',
  ultimate: '终极',
  Mythic: '神话',
  mythic: '神话'
}

// 获取品质名称
export function getRarityName (rarity) {
  return rarityMapping[rarity] || ITEM_QUALITY_NAMES[rarity] || rarity
}

// 品质颜色映射表
export const rarityColorMapping = {
  common: '#C0C0C0', // 白灰色
  uncommon: '#0070DD', // 蓝色
  rare: '#FFD700', // 金色
  veryrare: 'rgb(255, 0, 13)', // 红色
  unique: 'rgb(255, 0, 13)', // 红色
  ultimate: '#A335EE', // 紫色
  Mythic: '#FF4500', // 橙红色
  mythic: '#FF4500' // 橙红色
}

// 获取品质颜色
export function getRarityColor (rarity) {
  return rarityColorMapping[rarity] || '#000'
}

export default {
  classMapping,
  getClassRestrictionName,
  classNameToKeyMap,
  classKeyToNameMap,
  classIconMap,
  getClassIconPath,
  classParents,
  classAliases,
  isPlayerClassAllowed,
  isClassNameMatched,
  getClassNameByKey,
  getClassKeyByName,
  genderMapping,
  getGenderName,
  elementMapping,
  getElementName,
  rarityMapping,
  getRarityName,
  rarityColorMapping,
  getRarityColor
}
