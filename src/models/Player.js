/**
 * 玩家数据模型 - 基于旧项目state.js重构
 * 完整的玩家数据结构和计算方法
 */

import { markRaw } from 'vue'
import { CLASS_GROWTH_FORMULAS, getClassName } from '@/data/classes'
import PlayerStatsService from '@/services/PlayerStatsService'
import { getJobChangeQuestChain } from '@/data/JobChangeQuestConfig'
import { JOB_EVOLUTION_PATHS } from '@/store/jobs'

export class Player {
  constructor (data = {}) {
    // ========== 基础信息 ==========
    this.nickname = data.nickname || ''
    this.class = data.class || 'beginner'
    this.sex = data.sex || 'male'
    this.level = data.level || 1

    // ========== 经验系统 ==========
    this.exp = data.exp || 0

    // ========== 属性点系统 ==========
    // 确保stats对象包含所有必要的属性
    const defaultStats = {
      strength: 1,
      agility: 1,
      intelligence: 1,
      constitution: 1,
      freePoints: 4
    }

    if (data.stats && typeof data.stats === 'object') {
      // 合并传入的stats和默认值
      this.stats = { ...defaultStats, ...data.stats }
    } else {
      this.stats = { ...defaultStats }
    }

    const resolvedLevel = Number(this.level)
    const safeLevel = Number.isFinite(resolvedLevel) && resolvedLevel > 0 ? resolvedLevel : 1
    const resolvedFreePoints = Number(this.stats.freePoints)
    this.stats.freePoints = Number.isFinite(resolvedFreePoints) ? resolvedFreePoints : 0

    if (this.class === 'beginner') {
      const baselineStatValue = Math.min(15, safeLevel)
      const statKeys = ['strength', 'agility', 'intelligence', 'constitution']
      for (const key of statKeys) {
        const rawValue = Number(this.stats[key])
        const value = Number.isFinite(rawValue) ? rawValue : baselineStatValue
        this.stats[key] = value < baselineStatValue ? baselineStatValue : value
      }
      const allocatedPoints = statKeys.reduce((total, key) => {
        const rawValue = Number(this.stats[key])
        const value = Number.isFinite(rawValue) ? rawValue : baselineStatValue
        const delta = Math.max(0, value - baselineStatValue)
        return total + delta
      }, 0)

      const expectedTotalPoints = safeLevel * 4
      const nextFreePoints = expectedTotalPoints - allocatedPoints
      if (Number.isFinite(nextFreePoints)) {
        this.stats.freePoints = Math.max(0, Math.min(expectedTotalPoints, nextFreePoints))
      }
    }

    // 保存原始属性值，用于applyFinalStats重置
    this.originalStats = {
      strength: this.stats.strength,
      agility: this.stats.agility,
      intelligence: this.stats.intelligence,
      constitution: this.stats.constitution
    }

    // 如果传入了maxExp值，使用传入的值；否则根据当前等级计算
    // 但在加载存档时，需要确保maxExp与当前等级匹配
    if (data.maxExp !== undefined && data.maxExp !== null && typeof data.maxExp === 'number') {
      this.maxExp = data.maxExp
      // 检查当前经验值是否超过了当前等级应有的最大经验
      // 如果是，则可能需要重新计算maxExp以匹配当前等级
      const calculatedMaxExp = this.calculateMaxExp()
      if (Math.abs(this.maxExp - calculatedMaxExp) > calculatedMaxExp * 0.1) {
        // 如果差异超过10%，使用计算值
        this.maxExp = calculatedMaxExp
      }
    } else {
      this.maxExp = this.calculateMaxExp()
    }

    // ========== 生命值系统 ==========
    const resolvedMaxHealth = Number(data.maxHealth)
    this.maxHealth = Number.isFinite(resolvedMaxHealth) ? resolvedMaxHealth : this.calculateMaxHealth()
    const resolvedCurrentHealth = Number(data.currentHealth)
    this.currentHealth = Number.isFinite(resolvedCurrentHealth) ? resolvedCurrentHealth : this.maxHealth

    // ========== 魔法值系统 ==========
    const resolvedMaxMana = Number(data.maxMana)
    this.maxMana = Number.isFinite(resolvedMaxMana) ? resolvedMaxMana : this.calculateMaxMana()
    const resolvedCurrentMana = Number(data.currentMana)
    this.currentMana = Number.isFinite(resolvedCurrentMana) ? resolvedCurrentMana : this.maxMana
    this.magicDefense = data.magicDefense || 0

    // ========== 经济系统 ==========
    this.gold = data.gold || 0
    this.diamonds = data.diamonds || 0
    this.bankGold = data.bankGold || 0

    // ========== 战斗属性 ==========
    // 注意：这里不直接使用存档中的attack等战斗属性值，因为它们可能没有包含装备等加成
    // 我们将依赖applyFinalStats方法来重新计算所有战斗属性
    this.criticalRate = this.calculateCriticalRate()
    this.criticalDamage = 1.5
    this.attackSpeed = this.calculateAttackSpeed()
    this.hitRate = this.calculateHitRate()
    this.lifeSteal = 0
    this.blockRate = this.calculateBlockRate()
    this.dodgeRate = this.calculateDodgeRate()
    this.stun = 0
    this.decreasedCastingTime = 0
    this.pveAttackBonus = 0
    this.pveDefenseBonus = 0

    // ========== 装备相关属性 ==========
    this.minAttack = 5 // 默认最小攻击力为5
    this.maxAttack = 10 // 默认最大攻击力为10
    this.minDefense = 1 // 默认最小防御力为1
    this.maxDefense = 10 // 默认最大防御力为10

    // ========== 基础战斗属性 ==========

    // ========== 元素攻击属性 ==========
    this.fireAttack = data.fireAttack || 0
    this.waterAttack = data.waterAttack || 0
    this.thunderAttack = data.thunderAttack || 0
    this.windAttack = data.windAttack || 0
    this.earthAttack = data.earthAttack || 0

    // ========== 背包系统 ==========
    // 初始解锁20个格子，最大400个格子
    this.availableBagSlots = data.availableBagSlots || 20 // 初始解锁格子数
    this.totalBagSlots = data.totalBagSlots || 400
    this.bag = data.bag || [] // 背包物品
    this.equipmentBag = data.equipmentBag || [] // 装备背包
    this.bankBag = data.bankBag || [] // 银行背包

    // ========== 装备系统 ==========
    this.equipment = data.equipment || {
      weapon: null,
      shield: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      earring1: null,
      earring2: null
    }

    // ========== 技能系统 ==========
    this.skills = data.skills || {}

    // ========== 临时属性 ==========
    this.tempStats = data.tempStats || {}
    // 如果传入了originalStats，使用传入的值，否则使用构造函数中设置的值
    if (data.originalStats && Object.keys(data.originalStats).length > 0) {
      this.originalStats = data.originalStats
    }
    // 如果originalStats为空但stats存在，确保originalStats被正确设置
    if (!this.originalStats || Object.keys(this.originalStats).length === 0) {
      this.originalStats = {
        strength: this.stats.strength,
        agility: this.stats.agility,
        intelligence: this.stats.intelligence,
        constitution: this.stats.constitution
      }
    }

    // ========== 战斗状态 ==========
    this.isAttacking = data.isAttacking || false
    this.lastAttackTime = data.lastAttackTime || 0
    this.attackInterval = data.attackInterval || 0
    this.resurrectTimer = data.resurrectTimer || 0
    this.deathMusicPlayed = data.deathMusicPlayed || false

    // ========== 其他属性 ==========
    this.healPercent = data.healPercent || 0
    this.CastSpeed = data.CastSpeed || 0

    // ========== 任务系统 ==========
    this.quest = data.quest || {
      activeQuests: [],
      completedQuests: [],
      // 每日任务完成记录 { questId: lastCompleteDate }
      dailyCompletedQuests: {}
    }

    // ========== 大师进阶（转生）系统 ==========
    // 记录大师进阶任务状态，包括降级前的原始等级、目标等级、转生阶段等
    // rebirthStage 在完成大师进阶任务后递增，用于后续功能扩展
    this.masterGradeState = data.masterGradeState || {
      isActive: false,       // 是否正在执行大师进阶任务（降级中）
      originalLevel: 0,      // 接受任务前的原始等级
      targetLevel: 0,        // 需要练级达到的目标等级
      deLevel: 0,            // 降级后的等级（targetLevel - 10）
      questId: 0,            // 当前进行的大师进阶任务ID
      rebirthStage: 0        // 已完成的最高转生阶段（0-6）
    }

    // ========== 转职任务系统 ==========
    // 转职任务链状态列表，每项结构：
    // { targetJobKey: string, quests: [{ questId, status, killProgress: [{ monsterId, current, target }] }], allCompleted: boolean }
    this.jobChangeQuests = Player.normalizeJobChangeQuests(Array.isArray(data.jobChangeQuests) ? data.jobChangeQuests : [])

    // ========== 职业历史路径 ==========
    // 保存玩家转职历史路径，用于正确反推进阶路径（解决多父职业反推错误问题）
    // 优先从存档读取；不存在时通过转职任务记录推断生成
    if (Array.isArray(data.jobHistory) && data.jobHistory.length > 0) {
      this.jobHistory = data.jobHistory
    } else {
      this.jobHistory = Player.inferJobHistory(this.class, this.jobChangeQuests)
    }

    // ========== 等级奖励领取记录 ==========
    this.claimedLevelRewards = Array.isArray(data.claimedLevelRewards) ? data.claimedLevelRewards : []

    // ========== 每日签到系统 ==========
    // 签到数据（含已签到日期、累计天数、击杀进度等），从存档加载时保留
    this.dailySignIn = (data.dailySignIn && typeof data.dailySignIn === 'object')
      ? data.dailySignIn
      : null

    // ========== 成就系统 ==========
    // 成就进度数据，包含进度值、已完成等级和已解锁称号
    // 结构：{ progress: { [id]: number }, completedLevels: { [id]: number[] }, unlockedTitles: Title[], currentTitle: string|null }
    this.achievement = (data.achievement && typeof data.achievement === 'object')
      ? data.achievement
      : {
          progress: {},
          completedLevels: {},
          unlockedTitles: [],
          currentTitle: null
        }

    // ========== BUFF系统 ==========
    // 使用 markRaw 阻止 Vue 对 activeBuffs 进行深度响应式代理
    // 这样修改 BUFF 数据时不会触发 Vue 组件重渲染，提升性能
    this.activeBuffs = markRaw(data.activeBuffs || [])
    this.buffs = data.buffs || {}

    // 在初始化完成后应用完整的属性计算
    // _skipFinalStats: 登录页初始化 useGameStore 时传 true，跳过属性计算避免加载重型子 Store
    if (!data._skipFinalStats && typeof this.applyFinalStats === 'function') {
      // 使用传入的套装数据，如果没有则使用空数组
      const equipmentSets = data.equipmentSets || []
      this.applyFinalStats(equipmentSets)
    }

    // 更新背包格子数量（根据等级）
    if (typeof this.updateBagSlots === 'function') {
      this.updateBagSlots()
    }
  }

  // ========== 计算方法 ==========

  /**
   * 计算最大经验值
   */
  calculateMaxExp () {
    // 根据玩家等级使用不同的经验公式计算下一级所需经验（与old版本保持一致）
    // 使用下一等级来计算需要多少经验才能升级
    const nextLevel = this.level + 1
    if (nextLevel < 15) {
      return Math.floor(100 * Math.pow(1.5, nextLevel - 1))
    } else if (nextLevel >= 15 && nextLevel < 60) {
      return Math.floor(100 * Math.pow(1.35, nextLevel - 1))
    } else {
      return Math.floor(100 * Math.pow(1.2, nextLevel - 1))
    }
  }

  /**
   * 计算最大生命值
   */
  calculateMaxHealth () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 100
    }
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const constitutionGrowth = pointGrowth?.体质 || {}

    // 基础生命值 + 等级成长 + 体质加成
    const baseHp = levelGrowth.生命值 || 0
    const levelHp = baseHp * this.level
    const constitutionHp = this.stats.constitution * (constitutionGrowth.生命值 || 0)

    return Math.floor(100 + levelHp + constitutionHp)
  }

  /**
   * 计算最大魔法值
   */
  calculateMaxMana () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 50
    }
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const intelligenceGrowth = pointGrowth?.智力 || {}

    // 基础魔法值 + 等级成长 + 智力加成
    const baseMp = levelGrowth.魔法值 || 0
    const levelMp = baseMp * this.level
    const intelligenceMp = this.stats.intelligence * (intelligenceGrowth.魔法值 || 0)

    return Math.floor(100 + levelMp + intelligenceMp)
  }

  /**
   * 计算攻击力
   */
  calculateAttack () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 10
    }
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}
    const intelligenceGrowth = pointGrowth?.智力 || {}
    const strengthGrowth = pointGrowth?.力量 || {}

    // 基础攻击力 + 等级成长 + 主属性加成
    const baseMinAttackPerLevel = levelGrowth.最小攻击力 || 0
    const baseMaxAttackPerLevel = levelGrowth.最大攻击力 || 0
    const levelMinAttack = baseMinAttackPerLevel * this.level
    const levelMaxAttack = baseMaxAttackPerLevel * this.level

    let mainStatMinAttackBonus = 0
    let mainStatMaxAttackBonus = 0
    if (this.class === 'warrior') {
      mainStatMinAttackBonus = this.stats.strength * (strengthGrowth.最小攻击力 || 0)
      mainStatMaxAttackBonus = this.stats.strength * (strengthGrowth.最大攻击力 || 0)
    } else if (this.class === 'mage') {
      mainStatMinAttackBonus =
        this.stats.intelligence * (intelligenceGrowth.最小攻击力 || 0)
      mainStatMaxAttackBonus =
        this.stats.intelligence * (intelligenceGrowth.最大攻击力 || 0)
    } else if (this.class === 'priest') {
      mainStatMinAttackBonus =
        this.stats.intelligence * (intelligenceGrowth.最小攻击力 || 0)
      mainStatMaxAttackBonus =
        this.stats.intelligence * (intelligenceGrowth.最大攻击力 || 0)
    } else if (this.class === 'archer') {
      mainStatMinAttackBonus = this.stats.agility * (agilityGrowth.最小攻击力 || 0)
      mainStatMaxAttackBonus = this.stats.agility * (agilityGrowth.最大攻击力 || 0)
    } else {
      // beginner
      mainStatMinAttackBonus = this.stats.strength * (strengthGrowth.最小攻击力 || 0)
      mainStatMaxAttackBonus = this.stats.strength * (strengthGrowth.最大攻击力 || 0)
    }

    const baseMinAttack = 1
    const baseMaxAttack = 10
    const minAttack = baseMinAttack + levelMinAttack + mainStatMinAttackBonus
    const maxAttack = baseMaxAttack + levelMaxAttack + mainStatMaxAttackBonus
    return Math.floor((minAttack + maxAttack) / 2)
  }

  /**
   * 计算防御力
   */
  calculateDefense () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 5
    }
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const constitutionGrowth = pointGrowth?.体质 || {}

    // 基础防御力 + 等级成长 + 体质加成
    const baseMinDefensePerLevel = levelGrowth.最小防御力 || 0
    const baseMaxDefensePerLevel = levelGrowth.最大防御力 || 0
    const levelMinDefense = baseMinDefensePerLevel * this.level
    const levelMaxDefense = baseMaxDefensePerLevel * this.level
    const constitutionMinDefense = this.stats.constitution * (constitutionGrowth.最小防御力 || 0)
    const constitutionMaxDefense = this.stats.constitution * (constitutionGrowth.最大防御力 || 0)

    const minDefense = levelMinDefense + constitutionMinDefense
    const maxDefense = levelMaxDefense + constitutionMaxDefense
    return Math.floor((minDefense + maxDefense) / 2)
  }

  /**
   * 计算暴击率
   */
  calculateCriticalRate () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 0.05
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}

    // 基础暴击率 + 敏捷加成
    const baseCrit = agilityGrowth.暴击率 || 0
    const agilityCrit = this.stats.agility * baseCrit

    return Math.min(agilityCrit / 100, 0.5) // 最多50%
  }

  /**
   * 计算攻击速度
   */
  calculateAttackSpeed () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 0.3
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}

    // 基础攻击速度 + 敏捷加成
    const baseSpeed = agilityGrowth.攻击速度 || 0
    const agilitySpeed = this.stats.agility * baseSpeed

    return 0.3 + agilitySpeed / 100
  }

  /**
   * 计算命中率
   */
  calculateHitRate () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 0.3
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}

    // 基础命中率 + 敏捷加成（无上限）
    const baseHit = agilityGrowth.命中率 || 0
    const agilityHit = this.stats.agility * baseHit

    return 0.3 + agilityHit / 100
  }

  /**
   * 计算格挡率
   */
  calculateBlockRate () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 0.05
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}

    // 基础格挡率 + 敏捷加成
    const baseBlock = agilityGrowth.格挡率 || 0
    const agilityBlock = this.stats.agility * baseBlock

    return agilityBlock / 100 // 格挡率无上限
  }

  /**
   * 计算闪避率
   */
  calculateDodgeRate () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 0.05
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}

    // 基础闪避率 + 敏捷加成
    const baseDodge = agilityGrowth.闪避率 || 0
    const agilityDodge = this.stats.agility * baseDodge

    return Math.min(agilityDodge / 100, 0.3) // 最多30%
  }

  /**
   * 计算施法速度
   */
  calculateCastSpeed () {
    const className = getClassName(this.class)
    const formula = CLASS_GROWTH_FORMULAS[className]
    if (!formula) {
      return 1.0
    }
    const pointGrowth = formula?.属性点增加的属性 || {}
    const intelligenceGrowth = pointGrowth?.智力 || {}

    // 基础施法速度 + 智力加成
    const baseCastSpeed = intelligenceGrowth.施法速度 || 0
    const intelligenceCastSpeed = this.stats.intelligence * baseCastSpeed

    return 1.0 + intelligenceCastSpeed / 100
  }

  // ========== 状态检查方法 ==========

  /**
   * 检查是否死亡
   */
  isDead () {
    return this.currentHealth <= 0
  }

  /**
   * 检查是否有足够的魔法值
   */
  hasEnoughMana (cost) {
    return this.currentMana >= cost
  }

  /**
   * 检查背包是否已满
   */
  isBagFull () {
    return this.bag.length >= this.availableBagSlots
  }

  /**
   * 检查是否有空闲背包格子
   */
  hasBagSpace () {
    return this.bag.length < this.availableBagSlots
  }

  /**
   * 获取背包使用率
   */
  getBagUsage () {
    if (this.availableBagSlots === 0) {
      return 0
    }
    return Math.round((this.bag.length / this.availableBagSlots) * 100)
  }

  // ========== 状态操作方法 ==========

  /**
   * 恢复生命值
   */
  heal (amount) {
    const healBonus = Number(this.healPercent || 0)
    const ratio = healBonus > 1 ? healBonus / 100 : healBonus
    const healAmount = amount * (1 + ratio)
    this.currentHealth = Math.min(this.currentHealth + healAmount, this.maxHealth)
    return healAmount
  }

  /**
   * 恢复魔法值
   */
  restoreMana (amount) {
    this.currentMana = Math.min(this.currentMana + amount, this.maxMana)
    return amount
  }

  /**
   * 受到伤害
   */
  takeDamage (damage) {
    const resolvedDamage = Number(damage)
    const minDefense = Number(this.minDefense)
    const maxDefense = Number(this.maxDefense)

    const safeDamage = Number.isFinite(resolvedDamage) ? resolvedDamage : 0
    const safeMinDefense = Number.isFinite(minDefense) ? minDefense : 0
    const safeMaxDefense = Number.isFinite(maxDefense) ? maxDefense : 0
    const defenseAverage = Math.floor((safeMinDefense + safeMaxDefense) / 2)

    const maxDefenseReduction = Math.floor(safeDamage * 0.5)
    const effectiveDefenseReduction = Math.min(defenseAverage, maxDefenseReduction)
    const actualDamage = Math.max(1, safeDamage - effectiveDefenseReduction)

    const resolvedCurrentHealth = Number(this.currentHealth)
    const safeCurrentHealth = Number.isFinite(resolvedCurrentHealth)
      ? resolvedCurrentHealth
      : Number.isFinite(Number(this.maxHealth))
        ? Number(this.maxHealth)
        : 0

    const nextHealth = Math.max(0, safeCurrentHealth - actualDamage)
    this.currentHealth = Number.isFinite(nextHealth) ? nextHealth : 0

    const isDev = import.meta.env.DEV === true
    if (isDev) {
      const now = Date.now()
      const key = '__mitigationLogLastAt'
      const lastAt = Number(this[key]) || 0
      if (lastAt === 0 || now - lastAt >= 350) {
        this[key] = now
        console.log('[Mitigation] Player.takeDamage', {
          incomingDamage: safeDamage,
          defenseAverage,
          maxDefenseReduction,
          effectiveDefenseReduction,
          finalDamage: actualDamage
        })
      }
    }

    return actualDamage
  }

  /**
   * 消耗魔法值
   */
  consumeMana (amount) {
    const consumed = Math.min(amount, this.currentMana)
    this.currentMana -= consumed
    return consumed
  }

  /**
   * 增加经验值
   * @param {number} amount - 经验值
   * @param {Object} equipmentSets - 套装数据（可选）
   */
  addExp (amount, equipmentSets = {}) {
    const expBonus = amount * (1 + this.pveAttackBonus / 100)

    // ★ 大师进阶任务期间：等级达到目标等级后不再获得经验
    const masterCap = (this.masterGradeState?.isActive && this.masterGradeState?.targetLevel)
      ? this.masterGradeState.targetLevel
      : null
    if (masterCap && this.level >= masterCap) {
      // 已达到目标等级，不再获得经验
      this.exp = 0
      return { expGained: 0, levelsGained: 0 }
    }

    this.exp += expBonus

    // 检查升级
    let levelsGained = 0
    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp
      this.levelUp(equipmentSets)
      levelsGained++

      // ★ 大师进阶任务期间：升级到目标等级后清空经验，不再继续升级
      if (masterCap && this.level >= masterCap) {
        this.exp = 0
        break
      }
    }

    return { expGained: expBonus, levelsGained }
  }

  /**
   * 升级
   * @param {Object} equipmentSets - 套装数据（可选）
   */
  levelUp (equipmentSets = {}) {
    this.level++

    // 计算下一级所需经验
    this.maxExp = this.calculateMaxExp()

    const statCeiling = 15
    const statKeys = ['strength', 'agility', 'intelligence', 'constitution']
    if (!this.stats || typeof this.stats !== 'object') {
      this.stats = { strength: 1, agility: 1, intelligence: 1, constitution: 1, freePoints: 0 }
    }
    for (const statKey of statKeys) {
      const currentValueRaw = this.stats[statKey]
      const currentValue = Number(currentValueRaw)
      const safeCurrentValue = Number.isFinite(currentValue) ? currentValue : 1
      if (safeCurrentValue < statCeiling) {
        this.stats[statKey] = safeCurrentValue + 1
      }
    }

    // 增加自由属性点（每次升级获得2点）
    this.stats.freePoints += 2

    // 应用完整的属性计算流程，包括职业成长公式、装备加成等
    this.applyFinalStats(equipmentSets)

    // 更新背包格子数量
    this.updateBagSlots()

    // 确保生命值和魔法值恢复到最大值
    this.currentHealth = this.maxHealth
    this.currentMana = this.maxMana
  }

  /**
   * 更新战斗属性
   */
  updateCombatStats () {
    // 注意：在新版本中，我们使用minAttack/maxAttack和minDefense/maxDefense，attack/defense不再更新
    // this.attack = this.calculateAttack();
    // this.defense = this.calculateDefense();
    this.criticalRate = this.calculateCriticalRate()
    this.attackSpeed = this.calculateAttackSpeed()
    this.hitRate = this.calculateHitRate()
    this.blockRate = this.calculateBlockRate()
    this.dodgeRate = this.calculateDodgeRate()
    this.CastSpeed = this.calculateCastSpeed()
  }

  resetStatsForJobChange () {
    const resolvedLevel = Number(this.level)
    const safeLevel = Number.isFinite(resolvedLevel) && resolvedLevel > 0 ? resolvedLevel : 1
    const baseline = Math.min(15, safeLevel)
    const expectedTotalPoints = safeLevel * 2

    if (!this.stats || typeof this.stats !== 'object') {
      this.stats = { strength: 1, agility: 1, intelligence: 1, constitution: 1, freePoints: 0 }
    }

    this.stats.strength = baseline
    this.stats.agility = baseline
    this.stats.intelligence = baseline
    this.stats.constitution = baseline
    this.stats.freePoints = expectedTotalPoints

    this.originalStats = {
      strength: baseline,
      agility: baseline,
      intelligence: baseline,
      constitution: baseline
    }
  }

  /**
   * 分配属性点
   */
  allocateStat (stat, points) {
    if (this.stats.freePoints < points || points <= 0) {
      return false
    }

    if (['strength', 'agility', 'intelligence', 'constitution'].includes(stat)) {
      this.stats[stat] += points
      this.stats.freePoints -= points
      this.updateCombatStats()
      return true
    }

    return false
  }

  /**
   * 减少属性点
   */
  decreaseStat (stat) {
    if (this.stats[stat] <= 1) {
      return false
    }

    if (['strength', 'agility', 'intelligence', 'constitution'].includes(stat)) {
      this.stats[stat] -= 1
      this.stats.freePoints += 1
      this.updateCombatStats()
      return true
    }

    return false
  }

  /**
   * 获取玩家状态快照
   */
  getSnapshot () {
    return {
      // 基础信息
      nickname: this.nickname,
      class: this.class,
      sex: this.sex,
      level: this.level,

      // 经验系统
      exp: this.exp,
      maxExp: this.maxExp,

      // 生命值系统
      maxHealth: this.maxHealth,
      currentHealth: this.currentHealth,

      // 魔法值系统
      maxMana: this.maxMana,
      currentMana: this.currentMana,

      // 经济系统
      gold: this.gold,
      diamonds: this.diamonds,
      bankGold: this.bankGold,

      // 战斗属性
      minAttack: this.minAttack,
      maxAttack: this.maxAttack,
      minDefense: this.minDefense,
      maxDefense: this.maxDefense,
      magicDefense: this.magicDefense,
      criticalRate: this.criticalRate,
      criticalDamage: this.criticalDamage,
      attackSpeed: this.attackSpeed,
      hitRate: this.hitRate,
      lifeSteal: this.lifeSteal,
      blockRate: this.blockRate,
      dodgeRate: this.dodgeRate,
      stun: this.stun,
      decreasedCastingTime: this.decreasedCastingTime,
      pveAttackBonus: this.pveAttackBonus,
      pveDefenseBonus: this.pveDefenseBonus,

      // 元素攻击属性
      fireAttack: this.fireAttack,
      waterAttack: this.waterAttack,
      thunderAttack: this.thunderAttack,
      windAttack: this.windAttack,
      earthAttack: this.earthAttack,

      // 背包系统
      availableBagSlots: this.availableBagSlots,
      totalBagSlots: this.totalBagSlots,
      bag: [...this.bag],
      equipmentBag: [...this.equipmentBag],
      bankBag: [...this.bankBag],

      // 装备系统
      equipment: { ...this.equipment },

      // 技能系统
      skills: { ...this.skills },

      // 属性点系统
      stats: { ...this.stats },

      // 临时属性
      tempStats: { ...this.tempStats },
      originalStats: { ...this.originalStats },

      // 其他属性
      healPercent: this.healPercent,
      CastSpeed: this.CastSpeed,

      // 任务系统
      quest: {
        activeQuests: [...this.quest.activeQuests],
        completedQuests: [...this.quest.completedQuests]
      },

      // 大师进阶（转生）系统
      masterGradeState: {
        isActive: this.masterGradeState?.isActive || false,
        originalLevel: this.masterGradeState?.originalLevel || 0,
        targetLevel: this.masterGradeState?.targetLevel || 0,
        deLevel: this.masterGradeState?.deLevel || 0,
        questId: this.masterGradeState?.questId || 0,
        rebirthStage: this.masterGradeState?.rebirthStage || 0
      },

      // 转职任务系统
      jobChangeQuests: Array.isArray(this.jobChangeQuests) ? this.jobChangeQuests.map(chain => ({
        targetJobKey: chain.targetJobKey,
        allCompleted: chain.allCompleted,
        quests: chain.quests.map(q => ({
          questId: q.questId,
          status: q.status,
          killProgress: Array.isArray(q.killProgress)
            ? q.killProgress.map(kp => ({ monsterId: kp.monsterId, current: kp.current, target: kp.target }))
            : []
        }))
      })) : [],

      // 职业历史路径
      jobHistory: Array.isArray(this.jobHistory) ? [...this.jobHistory] : [],

      // BUFF系统
      activeBuffs: [...this.activeBuffs],
      buffs: { ...this.buffs },

      // 成就系统
      achievement: this.achievement ? {
        progress: { ...this.achievement.progress },
        completedLevels: { ...this.achievement.completedLevels },
        unlockedTitles: [...(this.achievement.unlockedTitles || [])],
        currentTitle: this.achievement.currentTitle || null
      } : null,

      // 创建时间
      createTime: this.createTime || new Date().toISOString(),
      lastLoginTime: new Date().toISOString()
    }
  }

  /**
   * 从快照恢复玩家状态
   */
  static fromSnapshot (snapshot) {
    return new Player(snapshot)
  }

  /**
   * 通过转职任务记录推断职业历史路径
   * 当 jobHistory 不存在时，使用 jobChangeQuests 中已完成的转职任务来推断正确的父职业
   * 解决多父职业反推错误问题（如 combat_master 的父职业可能是 guardian 或 technician）
   * @param {string} currentClass - 当前职业 key
   * @param {Array} jobChangeQuests - 转职任务链状态列表
   * @returns {string[]} 职业历史路径数组（从初心者到当前职业）
   */
  static inferJobHistory (currentClass, jobChangeQuests) {
    const currentLower = currentClass?.toLowerCase() || 'beginner'

    // 构建已完成的转职目标职业集合
    const completedJobs = new Set()
    if (Array.isArray(jobChangeQuests)) {
      for (const chain of jobChangeQuests) {
        if (chain && chain.allCompleted && chain.targetJobKey) {
          completedJobs.add(chain.targetJobKey.toLowerCase())
        }
      }
    }

    // 构建反向进阶映射（一个子职业可能有多个父职业）
    const reverseMap = {}
    for (const [parent, children] of Object.entries(JOB_EVOLUTION_PATHS)) {
      for (const child of children) {
        if (!reverseMap[child]) {
          reverseMap[child] = []
        }
        reverseMap[child].push(parent)
      }
    }

    const path = [currentLower]
    const visited = new Set([currentLower])

    let current = currentLower
    while (current) {
      const parents = reverseMap[current]
      if (!parents || parents.length === 0) break

      let parent = null
      if (parents.length === 1) {
        // 只有一个父职业，直接使用
        parent = parents[0]
      } else {
        // 多个父职业，优先选择在转职任务记录中已完成的职业
        parent = parents.find(p => completedJobs.has(p))
        // 如果无法推断，回退到第一个（与旧逻辑保持一致）
        if (!parent) {
          parent = parents[0]
        }
      }

      if (!parent || visited.has(parent)) break
      visited.add(parent)
      path.unshift(parent)
      current = parent
    }

    return path
  }

  /**
   * 规范化转职任务链数据，确保 killProgress 与当前配置一致
   * 修复旧版存档数据与配置不匹配的问题（如配置更新后新增了击杀目标）
   * @param {Array} jobChangeQuests - 原始转职任务链数据
   * @returns {Array} 规范化后的转职任务链数据
   */
  static normalizeJobChangeQuests (jobChangeQuests) {
    if (!Array.isArray(jobChangeQuests) || jobChangeQuests.length === 0) {
      return jobChangeQuests
    }

    try {
      return jobChangeQuests.map(chain => {
        if (!chain || !Array.isArray(chain.quests)) {
          return chain
        }

        // 获取该职业的配置任务链
        const configChain = getJobChangeQuestChain(chain.targetJobKey)
        if (!configChain || !Array.isArray(configChain.quests)) {
          return chain
        }

        // 逐个任务同步 killProgress
        const syncedQuests = chain.quests.map((quest, idx) => {
          const configQuest = configChain.quests[idx]
          if (!configQuest || !Array.isArray(configQuest.killTargets)) {
            return quest
          }

          // 保留已有的击杀进度，但以配置为基准重建 killProgress
          const existingProgress = quest.killProgress || []
          const syncedKillProgress = configQuest.killTargets.map(t => {
            // ★ 使用 Number() 统一类型比较，避免字符串/数字不匹配导致进度丢失
            const existing = existingProgress.find(ep => Number(ep.monsterId) === Number(t.monsterId))
            return {
              monsterId: t.monsterId,
              current: existing ? existing.current : 0,
              target: t.count
            }
          })

          return { ...quest, killProgress: syncedKillProgress }
        })

        return { ...chain, quests: syncedQuests }
      })
    } catch (e) {
      // 如果配置尚未加载，返回原始数据
      return jobChangeQuests
    }
  }

  /**
   * 应用最终属性计算（基于旧项目的applyFinalStats）
   */
  applyFinalStats (equipmentSets = []) {
    return PlayerStatsService.applyFinalStats(this, equipmentSets)
  }

  /**
   * 更新背包格子数量（每升一级解锁2个格子，初始20个格子，最大400个格子）
   */
  updateBagSlots () {
    const initialSlots = 20 // 初始解锁格子数
    const slotsPerLevel = 2 // 每级解锁格子数
    const maxSlots = 400 // 最大格子数

    // 计算当前等级可解锁的格子数
    const unlockedSlots = Math.min(initialSlots + (this.level - 1) * slotsPerLevel, maxSlots)

    // 更新背包格子数
    this.availableBagSlots = unlockedSlots
    this.totalBagSlots = maxSlots
  }

  /**
   * 计算基础属性（基于旧项目的calculateBaseStats）
   */
  calculateBaseStats () {
    return PlayerStatsService.calculateBaseStats(this)
  }

  /**
   * 计算装备属性加成（基于旧项目的calculateEquipmentBonuses）
   */
  calculateEquipmentBonuses () {
    return PlayerStatsService.calculateEquipmentBonuses(this)
  }

  /**
   * 计算基础攻击力（基于旧项目的calculateBaseAttack）
   */
  calculateBaseAttack (levelAttackBonus) {
    return PlayerStatsService.calculateBaseAttack(this, levelAttackBonus)
  }
}

export default Player
