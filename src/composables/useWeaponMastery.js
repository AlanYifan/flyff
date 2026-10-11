/**
 * @file useWeaponMastery.js
 * @description 武器精通被动技能组合式函数
 * 提供武器精通-弓箭（P技能）和武器精通-弓箭EX（P_EX技能）的加成比例计算
 *
 * 业务意图：
 * - 武器精通-弓箭：装备弓箭时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
 *   1级+10%，每级+10%，5级+50%
 * - 武器精通-弓箭EX：增强武器精通-弓箭的加成上限
 *   1级即为最大熟练度，固定+50%额外武器攻击力加成
 *   叠加到武器精通-弓箭的加成比例上
 *
 * 创建时间：2026-07-19
 * 修改时间：2026-07-19：修复 P_EX 加成计算与技能定义不一致，添加解锁等级检查
 * 修改时间：2026-07-19：武器精通-弓箭最大加成从25%提升至50%，EX从25%提升至50%
 */

import { isSkillUnlocked } from '@/data/skills'
import { getOffhandWeapon } from '@/composables/useDualWield'

/**
 * 武器精通-弓箭每级加成比例（10%）
 * 5级满级时总加成为50%
 */
export const BOW_MASTERY_BONUS_PER_LEVEL = 0.10

/**
 * 武器精通-弓箭最大熟练度等级
 */
export const BOW_MASTERY_MAX_LEVEL = 5

/**
 * 武器精通-弓箭EX固定额外加成比例（50%）
 * P_EX 已改为1级满级，固定+50%额外武器攻击力加成
 */
export const BOW_MASTERY_EX_FIXED_BONUS = 0.50

/**
 * 武器精通-弓箭EX2固定额外加成比例（100%）
 * P_EX2 为1级满级，固定+100%额外武器攻击力加成
 */
export const BOW_MASTERY_EX2_FIXED_BONUS = 1.00

/**
 * 武器精通-拳套每级加成比例（10%）
 * 5级满级时总加成为50%
 */
export const KNUCKLE_MASTERY_BONUS_PER_LEVEL = 0.10

/**
 * 武器精通-拳套最大熟练度等级
 */
export const KNUCKLE_MASTERY_MAX_LEVEL = 5

/**
 * 武器精通-拳套EX1固定额外加成比例（50%）
 * I_EX1 为1级满级，固定+50%额外武器攻击力加成
 */
export const KNUCKLE_MASTERY_EX1_FIXED_BONUS = 0.50

/**
 * 武器精通-拳套EX2固定额外加成比例（100%）
 * I_EX2 为1级满级，固定+100%额外武器攻击力加成
 */
export const KNUCKLE_MASTERY_EX2_FIXED_BONUS = 1.00

/**
 * 武器精通-副手武器每级加成比例（10%）
 * 5级满级时总加成为50%
 */
export const OFFHAND_MASTERY_BONUS_PER_LEVEL = 0.10

/**
 * 武器精通-副手武器最大熟练度等级
 */
export const OFFHAND_MASTERY_MAX_LEVEL = 5

/**
 * 武器精通-副手武器EX1固定额外加成比例（50%）
 * I_EX1 为1级满级，固定+50%额外副手武器攻击力加成
 */
export const OFFHAND_MASTERY_EX1_FIXED_BONUS = 0.50

/**
 * 武器精通-副手武器EX2固定额外加成比例（100%）
 * I_EX2 为1级满级，固定+100%额外副手武器攻击力加成
 */
export const OFFHAND_MASTERY_EX2_FIXED_BONUS = 1.00

/**
 * 武器精通-副手武器EX3倍攻配置
 * I_EX3 为1级满级，副手武器攻击时概率触发倍攻
 * 30%概率1.5倍、20%概率2倍、10%概率2.5倍
 */
export const OFFHAND_MASTERY_EX3_TIERS = Object.freeze([
  { chance: 30, multiplier: 1.5 },
  { chance: 20, multiplier: 2.0 },
  { chance: 10, multiplier: 2.5 }
])

/**
 * 获取玩家装备的主手武器
 * @param {Object} player - 玩家对象
 * @returns {Object|null} 主手武器对象，不存在时返回 null
 */
export function getMainHandWeapon (player) {
  if (!player || !player.equipment) {
    return null
  }
  // 主手武器存储在 equipment.weapon 槽位
  // 兼容 equipmentBag 中 slotId === 'weaponSlot' 的查找方式
  const weapon = player.equipment.weapon
  if (!weapon) {
    // 尝试从 equipmentBag 查找
    const bagWeapon = player.equipmentBag?.find(item => item && item.slotId === 'weaponSlot')
    return bagWeapon || null
  }
  return weapon
}

/**
 * 判断装备的武器是否为弓箭
 * 通过武器的 subcategory 字段判断
 * @param {Object} weapon - 武器装备对象
 * @returns {boolean} 是否为弓箭
 */
export function isBowWeapon (weapon) {
  if (!weapon) {
    return false
  }
  return weapon.subcategory === 'bow'
}

/**
 * 判断装备的武器是否为拳套
 * 通过武器的 subcategory 字段判断
 * @param {Object} weapon - 武器装备对象
 * @returns {boolean} 是否为拳套
 */
export function isKnuckleWeapon (weapon) {
  if (!weapon) {
    return false
  }
  return weapon.subcategory === 'knuckle'
}

/**
 * 判断装备的武器是否为飞轮
 * 通过武器的 subcategory 字段判断
 * @param {Object} weapon - 武器装备对象
 * @returns {boolean} 是否为飞轮
 */
export function isYoYoWeapon (weapon) {
  if (!weapon) {
    return false
  }
  return weapon.subcategory === 'yoyo'
}

/**
 * 判断装备的武器是否为魔棒（含 staff/wand/stick 三种子类型）
 * 炽天使职业的武器精通-魔棒技能需要此判断
 * @param {Object} weapon - 武器装备对象
 * @returns {boolean} 是否为魔棒类武器
 */
export function isStaffWeapon (weapon) {
  if (!weapon) {
    return false
  }
  const sub = weapon.subcategory
  return sub === 'staff' || sub === 'wand' || sub === 'stick'
}

/**
 * 判断装备的武器是否为双刀（剑类）
 * 风暴行者职业的武器精通-双刀技能需要此判断
 * @param {Object} weapon - 武器装备对象
 * @returns {boolean} 是否为双刀类武器
 */
export function isSwordWeapon (weapon) {
  if (!weapon) {
    return false
  }
  return weapon.subcategory === 'sword'
}

/**
 * 获取武器精通-弓箭的加成比例
 * 1级+10%，每级+10%，5级+50%
 * 仅当玩家装备弓箭且技能已解锁时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 武器攻击力加成比例（0~0.50）
 */
export function getBowMasteryBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-弓箭（P技能）是否已解锁（爆裂射手166级解锁）
  if (!isSkillUnlocked(player, 'fierce_shooter', 'P')) {
    return 0
  }
  const playerSkill = player.skills.P
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  const effectiveLevel = Math.min(skillLevel, BOW_MASTERY_MAX_LEVEL)
  return effectiveLevel * BOW_MASTERY_BONUS_PER_LEVEL
}

/**
 * 获取武器精通-弓箭EX的额外加成比例
 * P_EX 已改为1级满级，固定+50%额外武器攻击力加成
 * 叠加到武器精通-弓箭的加成比例上
 * 仅当技能已解锁（爆裂射手175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外武器攻击力加成比例（0 或 0.50）
 */
export function getBowMasteryExBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-弓箭EX（P_EX技能）是否已解锁（爆裂射手175级解锁）
  // createSkillObject 会为所有技能创建条目（含未解锁的），必须检查解锁条件
  if (!isSkillUnlocked(player, 'fierce_shooter', 'P_EX')) {
    return 0
  }
  // 武器精通-弓箭EX 存储在 player.skills.P_EX
  const playerSkill = player.skills.P_EX
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // P_EX 为1级满级，固定返回50%额外武器攻击力加成
  return BOW_MASTERY_EX_FIXED_BONUS
}

/**
 * 获取武器精通-弓箭EX2的额外加成比例
 * P_EX2 为1级满级，固定+100%额外武器攻击力加成
 * 叠加到武器精通-弓箭的加成比例上
 * 仅当技能已解锁（爆裂射手190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外武器攻击力加成比例（0 或 1.00）
 */
export function getBowMasteryEx2Bonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-弓箭EX2（P_EX2技能）是否已解锁（爆裂射手190级解锁）
  // createSkillObject 会为所有技能创建条目（含未解锁的），必须检查解锁条件
  if (!isSkillUnlocked(player, 'fierce_shooter', 'P_EX2')) {
    return 0
  }
  // 武器精通-弓箭EX2 存储在 player.skills.P_EX2
  const playerSkill = player.skills.P_EX2
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // P_EX2 为1级满级，固定返回100%额外武器攻击力加成
  return BOW_MASTERY_EX2_FIXED_BONUS
}

/**
 * 获取武器精通-拳套的加成比例
 * 1级+10%，每级+10%，5级+50%
 * 仅当玩家装备拳套且技能已解锁时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 武器攻击力加成比例（0~0.50）
 */
export function getKnuckleMasteryBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-拳套（I技能）是否已解锁（格斗宗师166级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'I')) {
    return 0
  }
  const playerSkill = player.skills.I
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  const effectiveLevel = Math.min(skillLevel, KNUCKLE_MASTERY_MAX_LEVEL)
  return effectiveLevel * KNUCKLE_MASTERY_BONUS_PER_LEVEL
}

/**
 * 获取武器精通-拳套EX1的额外加成比例
 * I_EX1 为1级满级，固定+50%额外武器攻击力加成
 * 叠加到武器精通-拳套的加成比例上
 * 仅当技能已解锁（格斗宗师175级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外武器攻击力加成比例（0 或 0.50）
 */
export function getKnuckleMasteryEx1Bonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-拳套EX1（I_EX1技能）是否已解锁（格斗宗师175级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'I_EX1')) {
    return 0
  }
  // 武器精通-拳套EX1 存储在 player.skills.I_EX1
  const playerSkill = player.skills.I_EX1
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // I_EX1 为1级满级，固定返回50%额外武器攻击力加成
  return KNUCKLE_MASTERY_EX1_FIXED_BONUS
}

/**
 * 获取武器精通-拳套EX2的额外加成比例
 * I_EX2 为1级满级，固定+100%额外武器攻击力加成
 * 叠加到武器精通-拳套的加成比例上
 * 仅当技能已解锁（格斗宗师190级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外武器攻击力加成比例（0 或 1.00）
 */
export function getKnuckleMasteryEx2Bonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-拳套EX2（I_EX2技能）是否已解锁（格斗宗师190级解锁）
  if (!isSkillUnlocked(player, 'combat_master', 'I_EX2')) {
    return 0
  }
  // 武器精通-拳套EX2 存储在 player.skills.I_EX2
  const playerSkill = player.skills.I_EX2
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // I_EX2 为1级满级，固定返回100%额外武器攻击力加成
  return KNUCKLE_MASTERY_EX2_FIXED_BONUS
}

/**
 * 获取武器精通的总加成比例（弓箭精通或拳套精通）
 * 根据玩家装备的武器类型返回对应的武器精通加成
 * 弓箭：弓箭精通 + 弓箭精通EX + 弓箭精通EX2
 * 拳套：拳套精通 + 拳套精通EX1 + 拳套精通EX2
 * 未装备对应武器时返回 0
 * @param {Object} player - 玩家对象
 * @returns {number} 总武器攻击力加成比例（0~2.0）
 */
export function getWeaponMasteryBonus (player) {
  if (!player) {
    return 0
  }
  const weapon = getMainHandWeapon(player)
  // 弓箭精通
  if (isBowWeapon(weapon)) {
    return getBowMasteryBonus(player) + getBowMasteryExBonus(player) + getBowMasteryEx2Bonus(player)
  }
  // 拳套精通
  if (isKnuckleWeapon(weapon)) {
    return getKnuckleMasteryBonus(player) + getKnuckleMasteryEx1Bonus(player) + getKnuckleMasteryEx2Bonus(player)
  }
  return 0
}

/**
 * 获取武器精通-副手武器的加成比例
 * 1级+10%，每级+10%，5级+50%
 * 仅当玩家副手装备的是武器（非盾牌）且技能已解锁时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 副手武器攻击力加成比例（0~0.50）
 */
export function getOffhandMasteryBonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-副手武器（I技能）是否已解锁（风暴行者166级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'I')) {
    return 0
  }
  // 检查副手是否装备了武器（非盾牌）
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return 0
  }
  const playerSkill = player.skills.I
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  const effectiveLevel = Math.min(skillLevel, OFFHAND_MASTERY_MAX_LEVEL)
  return effectiveLevel * OFFHAND_MASTERY_BONUS_PER_LEVEL
}

/**
 * 获取武器精通-副手武器EX1的额外加成比例
 * I_EX1 为1级满级，固定+50%额外副手武器攻击力加成
 * 叠加到武器精通-副手武器的加成比例上
 * 仅当技能已解锁（风暴行者170级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外副手武器攻击力加成比例（0 或 0.50）
 */
export function getOffhandMasteryEx1Bonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-副手武器EX1（I_EX1技能）是否已解锁（风暴行者170级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'I_EX1')) {
    return 0
  }
  // 检查副手是否装备了武器（非盾牌）
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return 0
  }
  const playerSkill = player.skills.I_EX1
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // I_EX1 为1级满级，固定返回50%额外副手武器攻击力加成
  return OFFHAND_MASTERY_EX1_FIXED_BONUS
}

/**
 * 获取武器精通-副手武器EX2的额外加成比例
 * I_EX2 为1级满级，固定+100%额外副手武器攻击力加成
 * 叠加到武器精通-副手武器的加成比例上
 * 仅当技能已解锁（风暴行者180级）且熟练度等级>=1时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 额外副手武器攻击力加成比例（0 或 1.00）
 */
export function getOffhandMasteryEx2Bonus (player) {
  if (!player || !player.skills) {
    return 0
  }
  // 检查武器精通-副手武器EX2（I_EX2技能）是否已解锁（风暴行者180级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'I_EX2')) {
    return 0
  }
  // 检查副手是否装备了武器（非盾牌）
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return 0
  }
  const playerSkill = player.skills.I_EX2
  if (!playerSkill) {
    return 0
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 0
  }
  // I_EX2 为1级满级，固定返回100%额外副手武器攻击力加成
  return OFFHAND_MASTERY_EX2_FIXED_BONUS
}

/**
 * 获取武器精通-副手武器的总加成比例（I + I_EX1 + I_EX2）
 * 仅当玩家副手装备的是武器（非盾牌）时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 总副手武器攻击力加成比例（0~2.0）
 */
export function getOffhandWeaponMasteryBonus (player) {
  if (!player) {
    return 0
  }
  // 检查副手是否装备了武器（非盾牌）
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return 0
  }
  const baseBonus = getOffhandMasteryBonus(player)
  const ex1Bonus = getOffhandMasteryEx1Bonus(player)
  const ex2Bonus = getOffhandMasteryEx2Bonus(player)

  return baseBonus + ex1Bonus + ex2Bonus
}

/**
 * 随机摇取副手武器倍攻倍率（EX3技能效果）
 * 按概率从低到高依次判定：先摇30%概率1.5倍，未中再摇20%概率2倍，最后摇10%概率2.5倍
 * 仅当I_EX3技能已解锁（风暴行者190级）且熟练度等级>=1、副手装备了武器时生效
 * @param {Object} player - 玩家对象
 * @returns {number} 倍攻倍率（1表示未触发或技能未解锁，1.5/2.0/2.5表示触发对应倍率）
 */
export function rollOffhandMasteryEx3Multiplier (player) {
  if (!player || !player.skills) {
    return 1
  }
  // 检查武器精通-副手武器EX3（I_EX3技能）是否已解锁（风暴行者190级解锁）
  if (!isSkillUnlocked(player, 'storm_walker', 'I_EX3')) {
    return 1
  }
  // 检查副手是否装备了武器（非盾牌）
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return 1
  }
  const playerSkill = player.skills.I_EX3
  if (!playerSkill) {
    return 1
  }
  const skillLevel = Number(
    playerSkill.proficiencyLevel ??
    (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.level
      : undefined) ??
    playerSkill.level ?? 0
  )
  if (skillLevel < 1) {
    return 1
  }
  // 按概率从低到高依次判定
  for (const tier of OFFHAND_MASTERY_EX3_TIERS) {
    if (Math.random() * 100 < tier.chance) {
      return tier.multiplier
    }
  }
  return 1
}
