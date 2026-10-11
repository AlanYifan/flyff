/**
 * @file useDualWield.js
 * @description 双刀流能力检测组合式函数
 * 提供判断玩家是否拥有双持武器能力（刀锋战士60级被动）的工具方法
 * 同时提供双刀流副手攻击被动的触发检测
 * 创建时间：2026-07-08
 * 更新时间：2026-07-09 — getOffhandAttackBonus 增加 R技能BUFF激活状态检测，仅在BUFF激活期间生效
 */

/**
 * 双刀流技能解锁等级
 */
const DUAL_WIELD_UNLOCK_LEVEL = 60

/**
 * 可使用双刀流的职业列表
 * 仅限刀锋战士（2转）和猎杀者（3转）
 */
const DUAL_WIELD_CLASSES = [
  'blade_warrior', // 刀锋战士（2转）
  'storm_walker' // 猎杀者（3转）
]

/**
 * 副手武器属性加成比例（50%）
 */
export const OFFHAND_ATTRIBUTE_RATIO = 0.50

/**
 * 副手攻击触发概率（1级熟练度：100%）
 */
export const OFFHAND_ATTACK_CHANCE = 1.0

/**
 * 副手武器攻击力熟练度加成配置
 * R技能（席瑞儿.安得利尔的祝福）熟练度效果
 * 1级：+5%，每级+5%，10级：+50%
 */
export const OFFHAND_ATTACK_BONUS_PER_LEVEL = 0.05
export const OFFHAND_ATTACK_BONUS_MAX_LEVEL = 10

/**
 * 判断玩家是否拥有双刀流（双持武器）能力
 * 条件：职业为刀锋战士或猎杀者，且等级 >= 60
 * @param {Object} player - 玩家对象，需包含 class 和 level 字段
 * @returns {boolean} 是否拥有双持武器能力
 */
export function canDualWield (player) {
  if (!player) {
    return false
  }
  const playerClass = String(player.class ?? '').toLowerCase()
  const playerLevel = Number(player.level ?? 0)
  return DUAL_WIELD_CLASSES.includes(playerClass) && playerLevel >= DUAL_WIELD_UNLOCK_LEVEL
}

/**
 * 判断装备槽位中的物品是否为副手武器（双刀流场景下 shield 槽位中的武器）
 * @param {Object} item - 装备对象
 * @returns {boolean} 是否为副手武器
 */
export function isOffhandWeapon (item) {
  if (!item) {
    return false
  }
  return item.category === 'weapon'
}

/**
 * 判断指定物品是否可装备到副手槽位（需玩家拥有双刀流能力）
 * 仅允许符合刀锋战士职业的武器装备到副手
 * @param {Object} item - 物品配置
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否可装备到副手
 */
export function canEquipToOffhand (item, player) {
  if (!canDualWield(player) || !item) {
    return false
  }
  // 仅武器类型可装备到副手
  if (item.category !== 'weapon') {
    return false
  }
  return true
}

/**
 * 获取玩家装备的副手武器（shield槽位中的weapon类型物品）
 * @param {Object} player - 玩家对象
 * @returns {Object|null} 副手武器对象，不存在时返回 null
 */
export function getOffhandWeapon (player) {
  if (!player || !player.equipment) {
    return null
  }
  const offhandItem = player.equipment.shield
  if (!offhandItem || offhandItem.category !== 'weapon') {
    return null
  }
  return offhandItem
}

/**
 * 判断玩家是否可以触发双刀流副手攻击被动
 * 需同时满足以下条件：
 * 1. 玩家拥有双刀流能力（canDualWield）
 * 2. 玩家已学习双刀流技能（player.skills.P 存在且熟练度 >= 1）
 * 3. 玩家装备了副手武器
 * @param {Object} player - 玩家对象
 * @returns {boolean} 是否可以触发副手攻击被动
 */
export function canTriggerOffhandAttack (player) {
  if (!canDualWield(player)) {
    return false
  }
  // 检查是否已学习双刀流技能
  const playerSkill = player?.skills?.P
  if (!playerSkill) {
    return false
  }
  const skillLevel = playerSkill.proficiencyLevel || playerSkill.level || 0
  if (skillLevel < 1) {
    return false
  }
  // 检查是否装备了副手武器
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return false
  }
  return true
}

/**
 * 获取副手攻击触发概率
 * 1级熟练度：100% 概率触发
 * @param {Object} player - 玩家对象
 * @returns {number} 触发概率（0~1）
 */
export function getOffhandAttackChance (player) {
  const playerSkill = player?.skills?.P
  if (!playerSkill) {
    return 0
  }
  const skillLevel = playerSkill.proficiencyLevel || playerSkill.level || 0
  if (skillLevel < 1) {
    return 0
  }
  // 1级熟练度：100% 概率
  return OFFHAND_ATTACK_CHANCE
}

/**
 * 检测R技能（席瑞儿.安得利尔的祝福）BUFF 是否处于激活状态
 * 通过遍历 player.activeBuffs 查找匹配的 BUFF 条目，
 * 并校验 expiresAt 时间戳确认未过期
 * @param {Object} player - 玩家对象
 * @returns {boolean} R技能BUFF是否激活中
 */
function isRBuffActive (player) {
  if (!player || !Array.isArray(player.activeBuffs) || player.activeBuffs.length === 0) {
    return false
  }
  const now = Date.now()
  return player.activeBuffs.some(buff => {
    if (!buff || typeof buff !== 'object') {
      return false
    }
    // 匹配 BUFF 来源：skillKey='R' 或 skillId='blade_warrior_r' 或 name='席瑞儿.安得利尔的祝福'
    const isRBuff = buff.skillKey === 'R' ||
      buff.skillId === 'blade_warrior_r' ||
      buff.name === '席瑞儿.安得利尔的祝福'
    if (!isRBuff) {
      return false
    }
    // expiresAt <= 0 表示无限期BUFF；否则需未过期
    const expiresAt = Number(buff.expiresAt ?? 0)
    return expiresAt <= 0 || expiresAt > now
  })
}

/**
 * 获取副手武器攻击力熟练度加成比例
 * 来源：R技能（席瑞儿.安得利尔的祝福）熟练度等级
 * 1级：+5%，每级+5%，10级：+50%
 * 仅影响副手武器的最小/最大攻击力，不影响其他附加属性
 * 注意：此加成仅在R技能BUFF激活期间生效，BUFF消失后加成归零
 * @param {Object} player - 玩家对象
 * @returns {number} 副手攻击力加成比例（0~0.5）
 */
export function getOffhandAttackBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  const playerSkill = player.skills.R
  if (!playerSkill) {
    return 0
  }
  const skillLevel = playerSkill.proficiencyLevel || playerSkill.level || 0
  if (skillLevel < 1) {
    return 0
  }
  // 副手攻击力加成仅在R技能BUFF激活期间生效
  if (!isRBuffActive(player)) {
    return 0
  }
  const effectiveLevel = Math.min(skillLevel, OFFHAND_ATTACK_BONUS_MAX_LEVEL)
  return effectiveLevel * OFFHAND_ATTACK_BONUS_PER_LEVEL
}

/**
 * useDualWield 组合式函数
 * 提供双刀流能力检测的响应式方法集合
 * @param {Object} playerRef - 玩家响应式引用（可选）
 * @returns {Object} 双刀流能力检测方法集合
 */
export function useDualWield (playerRef = null) {
  /**
   * 检查当前玩家是否拥有双持能力
   * @returns {boolean} 是否拥有双持武器能力
   */
  const checkDualWield = () => {
    const player = playerRef?.value ?? playerRef
    return canDualWield(player)
  }

  return {
    canDualWield,
    canEquipToOffhand,
    isOffhandWeapon,
    checkDualWield,
    getOffhandWeapon,
    canTriggerOffhandAttack,
    getOffhandAttackChance,
    getOffhandAttackBonus,
    OFFHAND_ATTRIBUTE_RATIO,
    OFFHAND_ATTACK_CHANCE
  }
}
