/**
 * 计算1级初心者初始属性验证
 */

// 引入统一的职业名称映射
import { classKeyToNameMap } from './src/utils/itemHelpers.js'

// 模拟CLASS_GROWTH_FORMULAS数据（来自data/classes.js）
const CLASS_GROWTH_FORMULAS = {
  初心者: {
    生命值: 25, // 升级后增加的气血
    魔法值: 15, // 升级后增加的魔法值
    最小攻击力: 2, // 升级后增加的最小攻击力
    最大攻击力: 5, // 升级后增加的最大攻击力
    防御力: 2, // 升级后增加的防御力
    格挡率: 0.15, // 1敏捷=0.15格挡%
    闪避率: 0.05, // 1敏捷=0.05闪避%
    暴击率: 0.1, // 1敏捷=0.1暴击%
    攻击速度: 0.2, // 1敏捷=0.2攻击速度%
    施法速度: 0.2,
    命中率: 0.15, // 1敏捷=0.15命中率%
    体质: 10, // 体质对生命的加成
    体质对生命值成长系数: 5, // 1体质=5生命值
    体质对防御力成长系数: 1, // 1体质=1防御力
    智力: 12, // 对魔法值的加成
    智力对魔法值成长系数: 4, // 1智力=12魔法值
    力量: {
      // 主属性力量对最小最大攻击力的加成
      最小攻击力: 1,
      最大攻击力: 3
    }
  }
}

// 使用统一的职业名称映射
function getClassName(className) {
  return classKeyToNameMap[className] || '未知职业'
}

// 模拟计算基础属性的方法
function calculateBaseStats(player) {
  const className = getClassName(player.class)
  const formula = CLASS_GROWTH_FORMULAS[className]

  // 基础生命值 + 等级成长 + 体质加成
  const baseHp = formula.生命值 || 25
  const levelHp = baseHp * player.level
  const constitutionHp = (player.stats?.constitution || 1) * (formula.体质对生命值成长系数 || 5)
  const maxHealth = Math.floor(100 + levelHp + constitutionHp)

  // 基础魔法值 + 等级成长 + 智力加成
  const baseMp = formula.魔法值 || 15
  const levelMp = baseMp * player.level
  const intelligenceMp = (player.stats?.intelligence || 1) * (formula.智力对魔法值成长系数 || 4)
  const maxMana = Math.floor(100 + levelMp + intelligenceMp)

  // 基础攻击力 + 等级成长 + 主属性加成
  const baseMinAttackPerLevel = formula.最小攻击力 || 2
  const baseMaxAttackPerLevel = formula.最大攻击力 || 5
  const levelMinAttack = baseMinAttackPerLevel * player.level
  const levelMaxAttack = baseMaxAttackPerLevel * player.level

  let mainStatMinAttackBonus = 0
  let mainStatMaxAttackBonus = 0

  if (player.class === 'warrior') {
    const strength = player.stats?.strength || 1
    const strengthFormula = formula.力量
    mainStatMinAttackBonus = strength * (strengthFormula?.最小攻击力 || 0)
    mainStatMaxAttackBonus = strength * (strengthFormula?.最大攻击力 || 0)
  } else if (player.class === 'mage') {
    const intelligence = player.stats?.intelligence || 1
    const intelligenceFormula = formula.智力
    mainStatMinAttackBonus = intelligence * (intelligenceFormula?.最小攻击力 || 0)
    mainStatMaxAttackBonus = intelligence * (intelligenceFormula?.最大攻击力 || 0)
  } else if (player.class === 'priest') {
    const intelligence = player.stats?.intelligence || 1
    const intelligenceFormula = formula.智力
    mainStatMinAttackBonus = intelligence * (intelligenceFormula?.最小攻击力 || 0)
    mainStatMaxAttackBonus = intelligence * (intelligenceFormula?.最大攻击力 || 0)
  } else if (player.class === 'archer') {
    const agility = player.stats?.agility || 1
    const agilityFormula = formula.敏捷
    mainStatMinAttackBonus = agility * (agilityFormula?.最小攻击力 || 0)
    mainStatMaxAttackBonus = agility * (agilityFormula?.最大攻击力 || 0)
  } else {
    // beginner
    const strength = player.stats?.strength || 1
    const strengthFormula = formula.力量
    mainStatMinAttackBonus = strength * (strengthFormula?.最小攻击力 || 0)
    mainStatMaxAttackBonus = strength * (strengthFormula?.最大攻击力 || 0)
  }

  // 基础攻击力 + 等级成长 + 主属性加成
  // 根据项目要求，新创建角色应有基础攻击力（最小攻击力默认1，最大攻击力默认10）
  const baseMinAttack = 1 // 基础最小攻击力
  const baseMaxAttack = 10 // 基础最大攻击力

  const minAttack = Math.floor(baseMinAttack + levelMinAttack + mainStatMinAttackBonus)
  const maxAttack = Math.floor(baseMaxAttack + levelMaxAttack + mainStatMaxAttackBonus)

  // 基础防御力 + 等级成长 + 体质加成
  const baseDefense = formula.防御力 || 4
  const levelDefense = baseDefense * player.level
  const constitutionDefense =
    (player.stats?.constitution || 1) * (formula.体质对防御力成长系数 || 1)
  const defense = Math.floor(30 + levelDefense + constitutionDefense)

  // 基础暴击率
  const baseCrit = formula.暴击率 || 0.1
  const agilityCrit = (player.stats?.agility || 1) * baseCrit
  const criticalRate = Math.min(agilityCrit / 100, 0.5) // 最多50%

  // 基础攻击速度
  const baseSpeed = formula.攻击速度 || 0.2
  const agilitySpeed = (player.stats?.agility || 1) * baseSpeed
  const attackSpeed = 1.0 + agilitySpeed / 100

  // 基础命中率
  const baseHit = formula.命中率 || 0.15
  const agilityHit = (player.stats?.agility || 1) * baseHit
  const hitRate = Math.min(0.8 + agilityHit / 100, 0.95) // 最多95%

  // 基础格挡率
  const baseBlock = formula.格挡率 || 0.15
  const agilityBlock = (player.stats?.agility || 1) * baseBlock
  const blockRate = Math.min(agilityBlock / 100, 0.3) // 最多30%

  // 基础闪避率
  const baseDodge = formula.闪避率 || 0.05
  const agilityDodge = (player.stats?.agility || 1) * baseDodge
  const dodgeRate = Math.min(agilityDodge / 100, 0.2) // 最多20%

  // 基础施法速度
  const baseCastSpeed = formula.施法速度 || 0.2
  const intelligenceCastSpeed = (player.stats?.intelligence || 1) * baseCastSpeed
  const castingTime = 1.0 + intelligenceCastSpeed / 100

  return {
    maxHealth,
    maxMana,
    minAttack, // 基础最小攻击力
    maxAttack, // 基础最大攻击力
    minDefense: Math.floor(defense * 0.2), // 基础最小防御力为防御力的20%
    maxDefense: defense, // 基础最大防御力
    criticalRate,
    attackSpeed,
    hitRate,
    blockRate,
    dodgeRate,
    castingTime,
    decreasedCastingTime: 0, // 这个可能需要根据具体需求调整
    lifeSteal: 0,
    skillDamage: 0,
    decreasedMpConsumption: 0,
    decreasedFpConsumption: 0,
    blockPenetration: 0
  }
}

// 模拟1级初心者玩家数据
const player = {
  class: 'beginner',
  level: 1,
  stats: {
    strength: 1,
    agility: 1,
    intelligence: 1,
    constitution: 1,
    freePoints: 5
  }
}

console.log('1级初心者初始属性计算:')
console.log('========================')

const baseStats = calculateBaseStats(player)

console.log('等级:', player.level)
console.log('最大生命值:', baseStats.maxHealth)
console.log('最大魔法值:', baseStats.maxMana)
console.log('攻击力:', baseStats.minAttack + '~' + baseStats.maxAttack)
console.log('防御力:', baseStats.minDefense + '~' + baseStats.maxDefense)

console.log('\n详细计算过程:')
console.log('- 体质:', player.stats.constitution)
console.log('- 智力:', player.stats.intelligence)
console.log('- 力量:', player.stats.strength)
console.log('- 敏捷:', player.stats.agility)

console.log('\n生命值计算: 100 + (25 * 1) + (1 * 5) =', 100 + 25 * 1 + 1 * 5)
console.log('魔法值计算: 100 + (15 * 1) + (1 * 4) =', 100 + 15 * 1 + 1 * 4)
console.log('最小攻击力计算: 1 + (2 * 1) + (1 * 1) =', 1 + 2 * 1 + 1 * 1)
console.log('最大攻击力计算: 10 + (5 * 1) + (1 * 3) =', 10 + 5 * 1 + 1 * 3)
console.log('防御力计算: 30 + (2 * 1) + (1 * 1) =', 30 + 2 * 1 + 1 * 1)
console.log(
  '最小防御力: ' + Math.floor((30 + 2 * 1 + 1 * 1) * 0.2) + ', 最大防御力: ' + (30 + 2 * 1 + 1 * 1)
)

console.log('\n用户提供的属性值: 最大生命值130, 最大魔法值119, 攻击力4~18, 防御力1~10')
console.log('与计算结果对比:')
console.log('- 最大生命值: 计算值' + baseStats.maxHealth + ', 提供值130')
console.log('- 最大魔法值: 计算值' + baseStats.maxMana + ', 提供值119')
console.log('- 攻击力: 计算值' + baseStats.minAttack + '~' + baseStats.maxAttack + ', 提供值4~18')
console.log('- 防御力: 计算值' + baseStats.minDefense + '~' + baseStats.maxDefense + ', 提供值1~10')

// 验证是否与用户提供的属性一致
const isMatch =
  baseStats.maxHealth === 130 &&
  baseStats.maxMana === 119 &&
  baseStats.minAttack === 4 &&
  baseStats.maxAttack === 18 &&
  baseStats.minDefense === 1 &&
  baseStats.maxDefense === 10

console.log('\n属性是否匹配: ' + (isMatch ? '是' : '否'))
