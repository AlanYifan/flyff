/**
 * 套装属性服务
 * 负责计算和管理装备套装属性加成
 */
import { useItemsStore } from '@/store/items'
import { getParameterName } from '@/store/descriptions'

export class SetBonusService {
  constructor () {
    // 套装属性计算结果缓存
    this.bonusCache = new Map()
  }

  /**
   * 计算套装属性加成
   * @param {Array} equippedItems - 装备的物品数组
   * @param {Object} equipmentSets - 套装数据对象
   * @returns {Object} 套装属性加成对象
   */
  calculateSetBonuses (equippedItems, equipmentSets) {
    // 创建缓存键
    const cacheKey = this.createCacheKey(equippedItems, equipmentSets)

    // 检查缓存
    if (this.bonusCache.has(cacheKey)) {
      return this.bonusCache.get(cacheKey)
    }

    const bonuses = {
      // 基础属性
      strength: 0,
      dexterity: 0,
      intelligence: 0,
      constitution: 0,
      agility: 0,

      // 战斗属性
      attack: 0,
      defense: 0,
      attackPercentage: 0,
      defensePercentage: 0,
      maxHealth: 0,
      maxMana: 0,
      maxHealthPercentage: 0,
      maxManaPercentage: 0,
      criticalRate: 0,
      criticalDamage: 0,
      hitRate: 0,
      dodgeRate: 0,
      blockRate: 0,
      lifeSteal: 0,
      skillDamage: 0,
      decreasedCastingTime: 0,
      decreasedMpConsumption: 0,
      decreasedFpConsumption: 0,
      blockPenetration: 0,
      bowAttack: 0,
      yoyoAttack: 0,
      axeAttack: 0,
      swordAttack: 0,
      stun: 0,

      // 特殊效果
      attackSpeed: 0,
      moveSpeed: 0,
      hpRegeneration: 0,
      mpRegeneration: 0,
      healPercent: 0,

      // 元素属性
      fireResistance: 0,
      waterResistance: 0,
      windResistance: 0,
      earthResistance: 0,
      thunderResistance: 0,

      // 其他属性
      damageBonus: 0,
      damageReduction: 0,

      // PVE属性
      pveDamage: 0,
      pveDamageReduction: 0,

      // 暴击抗性
      criticalResistance: 0,

      // 击杀回血
      hpRecoveryAfterKill: 0
    }

    // 获取装备的物品ID数组
    const equippedIds = equippedItems.map(item => Number(item.id))

    // 遍历所有套装数据（支持对象和数组格式）
    const sets =
      equipmentSets && typeof equipmentSets === 'object' && !Array.isArray(equipmentSets)
        ? Object.values(equipmentSets)
        : Array.isArray(equipmentSets)
          ? equipmentSets
          : []

    sets.forEach(set => {
      // 确保set.parts存在且是数组
      const parts = Array.isArray(set?.parts) ? set.parts.map(partId => Number(partId)) : []

      // 计算当前套装已装备的部件数量
      const equippedCount = parts.filter(partId =>
        equippedIds.some(equippedId => Number(equippedId) === Number(partId))
      ).length

      // 如果没有装备任何部件，跳过该套装
      if (equippedCount === 0) {
        return
      }

      // 确保bonus存在且是数组
      const bonusesToProcess = Array.isArray(set?.bonus) ? set.bonus : []

      // 处理每个套装效果
      bonusesToProcess.forEach(bonus => {
        // 检查是否满足装备数量要求
        if (equippedCount >= (bonus.equipped || 0)) {
          // 应用套装属性加成
          this.applyBonus(bonuses, bonus.ability)
        }
      })
    })

    // 缓存结果
    this.bonusCache.set(cacheKey, bonuses)

    return bonuses
  }

  /**
   * 应用单个套装属性加成
   * @param {Object} bonuses - 属性加成对象
   * @param {Object} ability - 套装能力对象
   */
  applyBonus (bonuses, ability) {
    if (!ability || !ability.parameter) {
      return
    }

    const parameterKey = String(ability.parameter || '').toLowerCase()
    const rawValue =
      ability.value !== undefined
        ? ability.value
        : ability.add !== undefined
          ? ability.add
          : 0
    const value = parseFloat(rawValue)
    if (!Number.isFinite(value) || value === 0) {
      return
    }
    const isPercent = ability.type === 'percent' || ability.rate === true
    const parameterMap = {
      str: 'strength',
      strength: 'strength',
      dex: 'agility',
      dexterity: 'agility',
      agi: 'agility',
      agility: 'agility',
      int: 'intelligence',
      intelligence: 'intelligence',
      sta: 'constitution',
      con: 'constitution',
      vit: 'constitution',
      constitution: 'constitution',
      maxhp: 'maxHealth',
      hp: 'maxHealth',
      maxmp: 'maxMana',
      mp: 'maxMana',
      def: 'defense',
      defense: 'defense',
      attack: 'attack',
      damage: 'attack',
      magicattack: 'attack',
      magicattackpercent: 'attack',
      speed: 'attackSpeed',
      attackspeed: 'attackSpeed',
      attack_speed: 'attackSpeed',
      critical: 'criticalRate',
      criticalrate: 'criticalRate',
      criticalchance: 'criticalRate',
      critical_damage: 'criticalDamage',
      criticaldamage: 'criticalDamage',
      dodgerate: 'dodgeRate',
      blockrate: 'blockRate',
      block: 'blockRate',
      hitrate: 'hitRate',
      stealhp: 'lifeSteal',
      lifesteal: 'lifeSteal',
      healing: 'healPercent',
      healpercent: 'healPercent',
      skilldamage: 'skillDamage',
      decreasedcastingtime: 'decreasedCastingTime',
      decreasedmpconsumption: 'decreasedMpConsumption',
      decreasedfpconsumption: 'decreasedFpConsumption',
      blockpenetration: 'blockPenetration',
      bowattack: 'bowAttack',
      yoyoattack: 'yoyoAttack',
      axeattack: 'axeAttack',
      swordattack: 'swordAttack',
      firemastery: 'fireAttack',
      watermastery: 'waterAttack',
      thundermastery: 'thunderAttack',
      thunder_mastery: 'thunderAttack',
      windmastery: 'windAttack',
      earthmastery: 'earthAttack',
      fire_resistance: 'fireResistance',
      water_resistance: 'waterResistance',
      wind_resistance: 'windResistance',
      earth_resistance: 'earthResistance',
      thunder_resistance: 'thunderResistance',
      stun: 'stun',
      move_speed: 'moveSpeed',
      movespeed: 'moveSpeed',
      hp_regeneration: 'hpRegeneration',
      mp_regeneration: 'mpRegeneration',
      damage_bonus: 'damageBonus',
      damage_reduction: 'damageReduction',
      pvedamage: 'pveDamage',
      pve_damage: 'pveDamage',
      pvedamagereduction: 'pveDamageReduction',
      pve_damage_reduction: 'pveDamageReduction',
      allelementsmastery: 'allElementsMastery',
      allelementsmastry: 'allElementsMastery',
      criticalresist: 'criticalResistance',
      criticalresistance: 'criticalResistance',
      hprecoveryafterkill: 'hpRecoveryAfterKill',
      hp_recovery_after_kill: 'hpRecoveryAfterKill'
    }
    const parameter = parameterMap[parameterKey] || parameterKey
    const fractionalKeys = new Set([
      'hitRate',
      'dodgeRate',
      'blockRate',
      'criticalRate',
      'criticalDamage',
      'attackSpeed',
      'decreasedCastingTime',
      'lifeSteal',
      'healPercent',
      // skillDamage 不需要除以100，因为存储值本身表示百分比（10 = 10%）
      // 在 SkillEffectService 中使用: baseDamage *= 1 + skillDamageBonus / 100
      'blockPenetration',
      'moveSpeed',
      'criticalResistance'
    ])

    // 根据参数类型应用加成
    switch (parameter) {
    case 'strength':
      bonuses.strength += isPercent ? 0 : value
      break
    case 'agility':
      bonuses.agility += isPercent ? 0 : value
      break
    case 'intelligence':
      bonuses.intelligence += isPercent ? 0 : value
      break
    case 'constitution':
      bonuses.constitution += isPercent ? 0 : value
      break
    case 'attack':
      bonuses[isPercent ? 'attackPercentage' : 'attack'] += value
      break
    case 'defense':
      bonuses[isPercent ? 'defensePercentage' : 'defense'] += value
      break
    case 'maxHealth':
      bonuses[isPercent ? 'maxHealthPercentage' : 'maxHealth'] += value
      break
    case 'maxMana':
      bonuses[isPercent ? 'maxManaPercentage' : 'maxMana'] += value
      break
    case 'fireResistance':
      bonuses.fireResistance += isPercent ? 0 : value
      break
    case 'waterResistance':
      bonuses.waterResistance += isPercent ? 0 : value
      break
    case 'windResistance':
      bonuses.windResistance += isPercent ? 0 : value
      break
    case 'earthResistance':
      bonuses.earthResistance += isPercent ? 0 : value
      break
    case 'thunderResistance':
      bonuses.thunderResistance += isPercent ? 0 : value
      break
    case 'damageBonus':
      bonuses.damageBonus += isPercent ? 0 : value
      break
    case 'damageReduction':
      bonuses.damageReduction += isPercent ? 0 : value
      break
    case 'allElementsMastery':
      // 全元素精通：同时增加五种元素攻击属性
      bonuses.fireAttack += value
      bonuses.waterAttack += value
      bonuses.windAttack += value
      bonuses.thunderAttack += value
      bonuses.earthAttack += value
      break
    default: {
      if (Object.prototype.hasOwnProperty.call(bonuses, parameter)) {
        const amount = fractionalKeys.has(parameter) && isPercent ? value / 100 : value
        bonuses[parameter] += amount
      }
      break
    }
    }
  }

  /**
   * 创建缓存键
   * @param {Array} equippedItems - 装备的物品数组
   * @param {Object} equipmentSets - 套装数据对象
   * @returns {string} 缓存键
   */
  createCacheKey (equippedItems, equipmentSets) {
    const itemIds = equippedItems
      .map(item => item.id)
      .sort()
      .join(',')
    const setIds =
      equipmentSets && typeof equipmentSets === 'object' && !Array.isArray(equipmentSets)
        ? Object.keys(equipmentSets).sort().join(',')
        : Array.isArray(equipmentSets)
          ? equipmentSets
            .map(set => set.id)
            .sort()
            .join(',')
          : ''
    return `${itemIds}|${setIds}`
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.bonusCache.clear()
  }

  /**
   * 获取套装信息（用于UI显示）
   * @param {number} itemId - 物品ID
   * @param {Object} equipmentSets - 套装数据对象
   * @param {Array} equippedItems - 装备的物品数组
   * @returns {Object|null} 套装信息对象
   */
  getSetInfo (itemId, equipmentSets, equippedItems) {
    console.log(`[DEBUG] SetBonusService.getSetInfo 被调用 - itemId: ${itemId}`)

    // 将 equipmentSets 转换为数组格式（支持对象和数组格式）
    const sets =
      equipmentSets && typeof equipmentSets === 'object' && !Array.isArray(equipmentSets)
        ? Object.values(equipmentSets)
        : Array.isArray(equipmentSets)
          ? equipmentSets
          : []

    // 查找包含当前物品的套装
    const targetSet = sets.find(
      set => Array.isArray(set.parts) && set.parts.includes(Number(itemId))
    )

    console.log(
      `[DEBUG] SetBonusService 查找套装结果 - itemId: ${itemId}, 找到套装: ${Boolean(targetSet)}`
    )
    if (targetSet) {
      console.log(
        `[DEBUG] SetBonusService 套装信息 - ID: ${targetSet.id}, 名称:`,
        targetSet.name,
        ', 部件:',
        targetSet.parts
      )
    }

    if (!targetSet) {
      return null
    }

    // 获取装备的物品ID数组
    const equippedIds = equippedItems.map(item => item.id)

    // 计算已装备的部件数量
    const equippedCount = targetSet.parts.filter(id => equippedIds.includes(id)).length

    // 构建套装信息对象
    return {
      name: targetSet.name?.cns || '未知套装',
      requiredCount: targetSet.parts?.length || 0,
      equippedCount,
      partNames: targetSet.parts.map(partId => {
        // 查找对应的物品信息，按优先级顺序查找
        let item = null

        // 1. 首先从 itemsStore 中查找
        const itemsStore = useItemsStore()
        if (itemsStore.staticItems) {
          if (Array.isArray(itemsStore.staticItems)) {
            item = itemsStore.staticItems.find(item => Number(item.id) === Number(partId))
          } else if (typeof itemsStore.staticItems === 'object' && !Array.isArray(itemsStore.staticItems)) {
            item = itemsStore.staticItems[partId] || itemsStore.staticItems[String(partId)]
          }
        }

        // 2. 如果没找到，从equippedItems中查找
        if (!item && equippedItems && Array.isArray(equippedItems)) {
          item = equippedItems.find(item => Number(item.id) === Number(partId))
        }

        // 处理物品名称
        let itemName = `#${partId}`

        if (item) {
          // 注意：经过静态数据加载处理后，item.name已经是字符串（通常是中文）
          if (typeof item.name === 'string') {
            itemName = item.name || `#${partId}`
          } else if (typeof item.name === 'object') {
            // 兼容未处理的原始数据结构
            itemName = item.name.cns || item.name.en || `#${partId}`
          }
        }

        return {
          name: itemName,
          activated: equippedIds.some(equippedId => Number(equippedId) === Number(partId))
        }
      }),
      bonuses: (targetSet.bonus || []).map(bonus => ({
        equipped: bonus.equipped,
        description: this.formatBonusText(bonus.ability),
        activated: equippedCount >= bonus.equipped
      }))
    }
  }

  /**
   * 格式化套装效果文本
   * @param {Object} ability - 套装能力对象
   * @returns {string} 格式化后的文本
   */
  formatBonusText (ability) {
    if (!ability) {
      return '未知加成'
    }

    // 统一使用小写参数名确保匹配
    const paramKey = (ability.parameter || 'unknown').toLowerCase()

    // 使用统一描述获取参数名称
    const paramName = getParameterName(paramKey)

    // 处理全属性特殊参数
    if (paramKey === 'allstats') {
      return `全属性 +${ability.add}%`
    }

    // 百分比加成处理
    if (ability.rate) {
      return `${paramName} +${ability.add}%`
    }

    // 固定值加成处理
    if (ability.add !== undefined) {
      return `${paramName} +${ability.add}`
    }

    // 默认返回参数名称
    return paramName
  }
}
