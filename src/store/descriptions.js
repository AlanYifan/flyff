/**
 * 描述文本管理 Store
 * 统一管理所有中英文描述映射，包括属性名称、元素类型、技能类型、BUFF效果等
 */
import { defineStore } from 'pinia'

/**
 * 属性名称映射（英文 key -> 中文）
 */
export const ATTRIBUTE_NAMES = {
  // 基础属性
  strength: '力量',
  str: '力量',
  dexterity: '敏捷',
  dex: '敏捷',
  agility: '敏捷',
  agi: '幸运',
  intelligence: '智力',
  int: '智力',
  constitution: '体质',
  sta: '体质',
  con: '体力',
  vit: '体力',

  // 生命/魔法相关
  maxHp: '最大生命',
  maxhp: '最大生命',
  maxHpPercentage: '最大生命值',
  maxhppercentage: '最大生命值',
  maxHealth: '最大生命值',
  hp: '生命值',
  maxMp: '最大魔法值',
  maxmp: '最大魔法值',
  maxMana: '最大魔法值',
  mp: '魔法值',
  mana: '魔法值',
  maxFp: '最大FP',
  maxfp: '最大FP',
  fp: 'FP',

  // 攻击/防御相关
  attack: '攻击力',
  attackrate: '攻击力',
  damage: '攻击力',
  minAttack: '最小攻击力',
  minattack: '最小攻击力',
  attackMin: '最小攻击力',
  attackmin: '最小攻击力',
  maxAttack: '最大攻击力',
  maxattack: '最大攻击力',
  attackMax: '最大攻击力',
  attackmax: '最大攻击力',
  defense: '防御力',
  def: '防御力',
  minDefense: '最小防御力',
  maxDefense: '最大防御力',
  defenseMin: '最小防御力',
  defenseMax: '最大防御力',
  magicDefense: '魔法防御力',
  magicdefense: '魔法防御',
  magicdefensepercent: '魔法防御',
  magicdefensepercentage: '魔法防御',
  magicAttack: '魔法攻击力',
  magicattack: '魔法攻击力',

  // 战斗属性
  criticalRate: '暴击率',
  critRate: '暴击率',
  criticalrate: '暴击率',
  criticalchance: '暴击率',
  criticalDamage: '暴击伤害',
  criticaldamage: '暴击伤害',
  criticalresist: '暴击抗性',
  hitRate: '命中率',
  hitrate: '命中率',
  dodgeRate: '闪避率',
  dodgerate: '闪避率',
  blockRate: '格挡率',
  blockrate: '格挡率',
  block: '格挡率',
  parry: '闪避',

  // 速度相关
  attackSpeed: '攻击速度',
  attackspeed: '攻击速度',
  speed: '攻击速度',
  attack_speed: '攻击速度',
  moveSpeed: '移动速度',
  movespeed: '移动速度',
  move_speed: '移动速度',
  decreasedCastingTime: '施法速度',
  decreasedcastingtime: '施法速度',

  // 特殊消耗
  mpCostPerAttack: '每次攻击MP消耗',
  mpcostperattack: '每次攻击MP消耗',

  // 恢复相关
  hpRegeneration: '生命回复',
  hpregeneration: '生命回复',
  hp_regeneration: '生命回复',
  hpRestoration: '生命恢复',
  hprecoveryafterkill: '击杀HP恢复',
  hp_recovery_after_kill: '击杀HP恢复',
  hprestoration: '生命恢复',
  mpRegeneration: '魔法回复',
  mpregeneration: '魔法回复',
  mp_regeneration: '魔法回复',
  healing: '治疗',
  hotAttackPercent: '持续治疗(攻击力百分比)',
  hotattackpercent: '持续治疗(攻击力百分比)',
  mpRecoveryPercent: '魔法值恢复(攻击力百分比)',
  mprecoverypercent: '魔法值恢复(攻击力百分比)',
  damageRecoveryPercent: '受伤恢复(最大生命值百分比)',
  damagerecoverypercent: '受伤恢复(最大生命值百分比)',

  // 消耗相关
  decreasedMpConsumption: 'MP消耗减少',
  decreasedmpconsumption: 'MP消耗减少',
  decreasedFpConsumption: 'FP消耗减少',
  decreasedfpconsumption: 'FP消耗减少',

  // 其他属性
  lifeSteal: '生命偷取',
  lifesteal: '生命偷取',
  stealhp: '生命偷取',
  skillDamage: '技能伤害',
  skilldamage: '技能伤害',
  skillChance: '技能几率',
  skillchance: '技能几率',
  blockPenetration: '格挡穿透',
  blockpenetration: '格挡穿透',
  damageTakenIncrease: '自身承伤',
  damagetakenincrease: '自身承伤',
  reflectDamage: '反弹伤害',
  reflectdamage: '反弹伤害',
  incomingDamage: '伤害减免',
  incomingdamage: '伤害减免',
  damageBonus: '伤害加成',
  damagebonus: '伤害加成',
  damageReduction: '伤害减免',
  damagereduction: '伤害减免',
  damage_reduction: '伤害减免',
  expRate: '经验倍率',
  exprate: '经验倍率',
  dropRate: '爆率',
  droprate: '爆率',
  allStats: '全属性',
  allstats: '全属性',

  // 武器特定属性
  bowAttack: '弓箭攻击',
  bowattack: '弓箭攻击',
  yoyoAttack: '飞轮攻击',
  yoyoattack: '飞轮攻击',
  axeAttack: '斧攻击',
  swordAttack: '剑攻击',

  // PVE 相关
  pveDamage: 'PVE伤害',
  pvedamage: 'PVE伤害',
  pveDamageReduction: 'PVE伤害减免',
  pvedamagereduction: 'PVE伤害减免',

  // PVP 相关
  pvpDamage: 'PVP伤害',
  pvpdamage: 'PVP伤害',
  pvpDamageReduction: 'PVP伤害减免',
  pvpdamagereduction: 'PVP伤害减免',

  // 其他
  none: '无',
  fpRecoveryAutoAttack: '攻击FP恢复',
  fprecoveryautoattack: '攻击FP恢复',
  mpRecoveryAfterKill: '击杀MP恢复',
  mprecoveryafterkill: '击杀MP恢复',
  elementAttack: '属性攻击',
  elementattack: '属性攻击',
  mpConsumption: 'MP消耗减少',
  mpconsumption: 'MP消耗减少',
  attackRange: '攻击距离',
  attackrange: '攻击距离',

  // 元素攻击力
  fireAttack: '火属性攻击力',
  fireattack: '火属性攻击力',
  waterAttack: '水属性攻击力',
  waterattack: '水属性攻击力',
  windAttack: '风属性攻击力',
  windattack: '风属性攻击力',
  earthAttack: '土属性攻击力',
  earthattack: '土属性攻击力',
  thunderAttack: '雷属性攻击力',
  thunderattack: '雷属性攻击力'
}

/**
 * 元素类型映射
 */
export const ELEMENT_NAMES = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  thunder: '雷',
  electricity: '雷',
  none: '无'
}

/**
 * 元素精通映射
 */
export const ELEMENT_MASTERY_NAMES = {
  fireMastery: '火元素',
  firemastery: '火元素',
  waterMastery: '水元素',
  watermastery: '水元素',
  windMastery: '风元素',
  windmastery: '风元素',
  earthMastery: '土元素',
  earthmastery: '土元素',
  thunderMastery: '雷元素',
  electricitymastery: '雷元素',
  allElementsMastery: '全元素精通',
  allelementsmastery: '全元素精通'
}

/**
 * 元素抗性映射
 */
export const ELEMENT_RESISTANCE_NAMES = {
  fireResistance: '火属性抗性',
  fire_resistance: '火属性抗性',
  fireResist: '火属性抗性',
  fireresist: '火属性抗性',
  firedefense: '火属性抗性',
  waterResistance: '水属性抗性',
  water_resistance: '水属性抗性',
  waterResist: '水属性抗性',
  waterresist: '水属性抗性',
  waterdefense: '水属性抗性',
  windResistance: '风属性抗性',
  wind_resistance: '风属性抗性',
  windResist: '风属性抗性',
  windresist: '风属性抗性',
  winddefense: '风属性抗性',
  earthResistance: '土属性抗性',
  earth_resistance: '土属性抗性',
  earthResist: '土属性抗性',
  earthresist: '土属性抗性',
  earthdefense: '土属性抗性',
  thunderResistance: '雷属性抗性',
  thunder_resistance: '雷属性抗性',
  thunderResist: '雷属性抗性',
  thunderresist: '雷属性抗性',
  electricitydefense: '雷属性抗性',
  electricityResistance: '雷属性抗性'
}

/**
 * 技能类型映射
 */
export const SKILL_TYPE_NAMES = {
  single: '单体攻击',
  aoe: '范围攻击',
  buff: '增益效果',
  debuff: '减益效果',
  heal: '治疗',
  dot: '持续伤害',
  utility: '功能技能',
  special: '特殊'
}

/**
 * BUFF 效果名称映射
 */
export const BUFF_EFFECT_NAMES = {
  defensePercent: '防御力',
  defensePercentage: '防御力',
  magicDefensePercent: '魔法防御力',
  magicDefensePercentage: '魔法防御力',
  attackPercent: '攻击力',
  attackPercentage: '攻击力',
  criticalRate: '暴击率',
  critRate: '暴击率',
  criticalDamage: '暴击伤害',
  critDamage: '暴击伤害',
  hitRate: '命中率',
  blockRate: '格挡率',
  dodgeRate: '闪避率',
  attackSpeed: '攻击速度',
  moveSpeed: '移动速度',
  maxHealth: '生命值',
  maxHpPercentage: '最大生命值',
  maxMana: '魔法值',
  hotAttackPercent: '持续治疗(攻击力百分比)',
  mpRecoveryPercent: '魔法值恢复(攻击力百分比)',
  damageRecoveryPercent: '受伤恢复(最大生命值百分比)',
  strength: '力量',
  agility: '敏捷',
  intelligence: '智力',
  constitution: '体质',
  mpCostPerAttack: '每次攻击MP消耗',
  duration: '持续时间'
}

/**
 * 装备槽位名称映射
 */
export const EQUIPMENT_SLOT_NAMES = {
  weapon: '武器',
  weaponSlot: '武器',
  shield: '盾牌',
  shieldSlot: '盾牌',
  helmet: '头盔',
  helmetSlot: '头盔',
  armor: '盔甲',
  armorSlot: '盔甲',
  gloves: '手套',
  glovesSlot: '手套',
  boots: '鞋子',
  bootsSlot: '鞋子',
  necklace: '项链',
  necklaceSlot: '项链',
  ring1: '戒指1',
  ring1Slot: '戒指1',
  ring2: '戒指2',
  ring2Slot: '戒指2',
  earring1: '耳环1',
  earring1Slot: '耳环1',
  earring2: '耳环2',
  earring2Slot: '耳环2'
}

/**
 * 物品品质名称映射
 */
export const ITEM_QUALITY_NAMES = {
  common: '普通',
  normal: '普通',
  uncommon: '优秀',
  rare: '稀有',
  veryrare: '传说',
  epic: '史诗',
  legendary: '传说',
  unique: '独特',
  mythic: '神话',
  ultimate: '终极'
}

/**
 * 物品稀有度名称映射（与商店组件兼容）
 */
export const RARITY_NAMES = {
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
  veryrare: '传说',
  unique: '史诗',
  ultimate: '终极'
}

/**
 * 怪物等级映射
 */
export const MONSTER_RANK_NAMES = {
  normal: '普通',
  giant: '巨型',
  violet: '堕落',
  boss: '首领',
  elite: '精英',
  rare: '稀有'
}

/**
 * 物品类别映射
 */
export const ITEM_CATEGORY_NAMES = {
  weapon: '武器',
  armor: '防具',
  accessory: '饰品',
  consumable: '消耗品',
  material: '材料',
  quest: '任务物品',
  other: '其他',
  card: '卡片',
  jewelry: '首饰'
}

/**
 * 武器子类别映射
 */
export const WEAPON_SUBCATEGORY_NAMES = {
  sword: '剑',
  axe: '斧',
  bow: '弓',
  staff: '法杖',
  wand: '魔杖',
  yoyo: '溜溜球',
  other: '其他武器'
}

/**
 * 防具子类别映射
 */
export const ARMOR_SUBCATEGORY_NAMES = {
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  shield: '盾牌',
  suit: '套装'
}

/**
 * 难度等级映射
 */
export const DIFFICULTY_NAMES = {
  normal: '普通',
  hard: '困难',
  hell: '地狱',
  extreme: '极难'
}

export const useDescriptionsStore = defineStore('descriptions', {
  state: () => ({
    attributeNames: ATTRIBUTE_NAMES,
    elementNames: ELEMENT_NAMES,
    elementMasteryNames: ELEMENT_MASTERY_NAMES,
    elementResistanceNames: ELEMENT_RESISTANCE_NAMES,
    skillTypeNames: SKILL_TYPE_NAMES,
    buffEffectNames: BUFF_EFFECT_NAMES,
    equipmentSlotNames: EQUIPMENT_SLOT_NAMES,
    itemQualityNames: ITEM_QUALITY_NAMES,
    rarityNames: RARITY_NAMES,
    monsterRankNames: MONSTER_RANK_NAMES,
    itemCategoryNames: ITEM_CATEGORY_NAMES,
    weaponSubcategoryNames: WEAPON_SUBCATEGORY_NAMES,
    armorSubcategoryNames: ARMOR_SUBCATEGORY_NAMES,
    difficultyNames: DIFFICULTY_NAMES
  }),

  getters: {
    /**
     * 获取属性中文名称
     * @param {string} key - 属性英文 key
     * @returns {string} 中文名称，未找到时返回原 key
     */
    getAttributeName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.attributeNames[normalizedKey] || state.attributeNames[key] || key
    },

    /**
     * 获取元素中文名称
     * @param {string} key - 元素英文 key
     * @returns {string} 中文名称
     */
    getElementName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.elementNames[normalizedKey] || state.elementNames[key] || key
    },

    /**
     * 获取元素精通中文名称
     * @param {string} key - 元素精通英文 key
     * @returns {string} 中文名称
     */
    getElementMasteryName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.elementMasteryNames[normalizedKey] || state.elementMasteryNames[key] || key
    },

    /**
     * 获取元素抗性中文名称
     * @param {string} key - 元素抗性英文 key
     * @returns {string} 中文名称
     */
    getElementResistanceName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.elementResistanceNames[normalizedKey] || state.elementResistanceNames[key] || key
    },

    /**
     * 获取技能类型中文名称
     * @param {string} key - 技能类型英文 key
     * @returns {string} 中文名称
     */
    getSkillTypeName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.skillTypeNames[normalizedKey] || state.skillTypeNames[key] || key
    },

    /**
     * 获取 BUFF 效果中文名称
     * @param {string} key - BUFF 效果英文 key
     * @returns {string} 中文名称
     */
    getBuffEffectName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.buffEffectNames[normalizedKey] || state.buffEffectNames[key] || key
    },

    /**
     * 获取装备槽位中文名称
     * @param {string} key - 装备槽位英文 key
     * @returns {string} 中文名称
     */
    getEquipmentSlotName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.equipmentSlotNames[normalizedKey] || state.equipmentSlotNames[key] || key
    },

    /**
     * 获取物品品质中文名称
     * @param {string} key - 品质英文 key
     * @returns {string} 中文名称
     */
    getItemQualityName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.itemQualityNames[normalizedKey] || state.itemQualityNames[key] || key
    },

    /**
     * 获取稀有度中文名称
     * @param {string} key - 稀有度英文 key
     * @returns {string} 中文名称
     */
    getRarityName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.rarityNames[normalizedKey] || state.rarityNames[key] || key
    },

    /**
     * 获取怪物等级中文名称
     * @param {string} key - 等级英文 key
     * @returns {string} 中文名称
     */
    getMonsterRankName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.monsterRankNames[normalizedKey] || state.monsterRankNames[key] || key
    },

    /**
     * 获取物品类别中文名称
     * @param {string} key - 类别英文 key
     * @returns {string} 中文名称
     */
    getItemCategoryName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.itemCategoryNames[normalizedKey] || state.itemCategoryNames[key] || key
    },

    /**
     * 获取武器子类别中文名称
     * @param {string} key - 子类别英文 key
     * @returns {string} 中文名称
     */
    getWeaponSubcategoryName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.weaponSubcategoryNames[normalizedKey] || state.weaponSubcategoryNames[key] || key
    },

    /**
     * 获取防具子类别中文名称
     * @param {string} key - 子类别英文 key
     * @returns {string} 中文名称
     */
    getArmorSubcategoryName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.armorSubcategoryNames[normalizedKey] || state.armorSubcategoryNames[key] || key
    },

    /**
     * 获取难度中文名称
     * @param {string} key - 难度英文 key
     * @returns {string} 中文名称
     */
    getDifficultyName: state => key => {
      const normalizedKey = String(key || '').toLowerCase()
      return state.difficultyNames[normalizedKey] || state.difficultyNames[key] || key
    },

    /**
     * 获取任意参数的中文名称（综合查询）
     * 依次在属性、元素、元素精通、元素抗性、技能类型中查找
     * @param {string} key - 参数英文 key
     * @returns {string} 中文名称
     */
    getParameterName (state) {
      return key => {
        const normalizedKey = String(key || '').toLowerCase()

        // 按优先级依次查找
        return state.attributeNames[normalizedKey] ||
          state.attributeNames[key] ||
          state.elementMasteryNames[normalizedKey] ||
          state.elementMasteryNames[key] ||
          state.elementResistanceNames[normalizedKey] ||
          state.elementResistanceNames[key] ||
          state.elementNames[normalizedKey] ||
          state.elementNames[key] ||
          key
      }
    }
  },

  actions: {
    /**
     * 批量添加属性名称映射
     * @param {Object} mappings - 属性映射对象
     */
    addAttributeNames (mappings) {
      Object.assign(this.attributeNames, mappings)
    },

    /**
     * 批量添加元素名称映射
     * @param {Object} mappings - 元素映射对象
     */
    addElementNames (mappings) {
      Object.assign(this.elementNames, mappings)
    }
  }
})

/**
 * 完整的能力参数映射表（用于物品详情面板等场景）
 * 合并了属性、元素精通、元素抗性等所有参数
 */
export const ABILITY_PARAMETER_MAP = {
  ...ATTRIBUTE_NAMES,
  ...ELEMENT_MASTERY_NAMES,
  ...ELEMENT_RESISTANCE_NAMES
}

// 导出便捷函数（可在非组件中使用）
export function getAttributeName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return ATTRIBUTE_NAMES[normalizedKey] || ATTRIBUTE_NAMES[key] || key
}

export function getElementName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return ELEMENT_NAMES[normalizedKey] || ELEMENT_NAMES[key] || key
}

export function getSkillTypeName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return SKILL_TYPE_NAMES[normalizedKey] || SKILL_TYPE_NAMES[key] || key
}

export function getMonsterRankName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return MONSTER_RANK_NAMES[normalizedKey] || MONSTER_RANK_NAMES[key] || key
}

export function getRarityName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return RARITY_NAMES[normalizedKey] || RARITY_NAMES[key] || ITEM_QUALITY_NAMES[normalizedKey] || ITEM_QUALITY_NAMES[key] || key
}

export function getItemCategoryName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return ITEM_CATEGORY_NAMES[normalizedKey] || ITEM_CATEGORY_NAMES[key] || key
}

export function getParameterName (key) {
  const normalizedKey = String(key || '').toLowerCase()
  return ATTRIBUTE_NAMES[normalizedKey] ||
    ATTRIBUTE_NAMES[key] ||
    ELEMENT_MASTERY_NAMES[normalizedKey] ||
    ELEMENT_MASTERY_NAMES[key] ||
    ELEMENT_RESISTANCE_NAMES[normalizedKey] ||
    ELEMENT_RESISTANCE_NAMES[key] ||
    ELEMENT_NAMES[normalizedKey] ||
    ELEMENT_NAMES[key] ||
    key
}
