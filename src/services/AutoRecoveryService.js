/**
 * @fileoverview 自动恢复/出售服务
 * 统一处理主页面和副本页面的自动恢复、自动出售功能
 * 支持单人模式和多人队伍模式
 * @author CatPaw
 * @version 1.0.0
 */

import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'

/**
 * 自动恢复BUFF的物品ID
 * @constant {number}
 */
export const AUTO_RECOVERY_BUFF_ID = 1276

/**
 * 自动出售BUFF的物品ID
 * @constant {number}
 */
export const AUTO_SELL_BUFF_ID = 1277

/**
 * 禁止自动出售的物品ID列表
 * @constant {Set<number>}
 */
export const AUTO_SELL_BLACKLIST = new Set([
  6049, // 禁止出售的物品
  5883  // 禁止出售的物品
])

/**
 * 自动恢复/出售服务类
 * 统一处理自动恢复HP/MP和自动出售物品的逻辑
 * 
 * @example
 * // Main.vue 中使用（单人模式）
 * const service = new AutoRecoveryService()
 * service.checkAndRecoverForMember(player.value, player.value.bag, settings)
 * 
 * @example
 * // Dungeon.vue 中使用（多人模式）
 * const service = new AutoRecoveryService()
 * const allMembers = [player.value, ...teamMembers.value]
 * service.checkAndRecoverForMembers(allMembers, settings)
 */
export class AutoRecoveryService {
  /**
   * 创建自动恢复服务实例
   */
  constructor () {
    this.itemsStore = useItemsStore()
    this.gameStore = useGameStore()
  }

  /**
   * 检查角色是否有自动恢复BUFF
   * @param {Object} member - 角色数据
   * @returns {boolean} 是否有自动恢复BUFF
   */
  hasAutoRecoveryBuff (member) {
    if (!member || !member.activeBuffs || !Array.isArray(member.activeBuffs)) {
      return false
    }
    return member.activeBuffs.some(buff => Number(buff?.id) === AUTO_RECOVERY_BUFF_ID)
  }

  /**
   * 检查角色是否有自动出售BUFF
   * @param {Object} member - 角色数据
   * @returns {boolean} 是否有自动出售BUFF
   */
  hasAutoSellBuff (member) {
    if (!member || !member.activeBuffs || !Array.isArray(member.activeBuffs)) {
      return false
    }
    return member.activeBuffs.some(buff => Number(buff?.id) === AUTO_SELL_BUFF_ID)
  }

  /**
   * 为单个角色执行自动恢复（使用角色自己的背包）
   * @param {Object} member - 角色数据
   * @param {Object} settings - 设置对象
   * @param {number} settings.autoHpRecoveryPercent - HP恢复阈值百分比
   * @param {number} settings.autoMpRecoveryPercent - MP恢复阈值百分比
   * @returns {{hpRecovered: number, mpRecovered: number, itemsUsed: Array}} 恢复结果
   */
  checkAndRecoverForMember (member, settings = {}) {
    const result = { hpRecovered: 0, mpRecovered: 0, itemsUsed: [] }

    if (!member || member.currentHealth <= 0) {
      return result
    }

    // 检查是否有自动恢复BUFF
    if (!this.hasAutoRecoveryBuff(member)) {
      return result
    }

    // 使用角色自己的背包
    const bag = member.bag
    if (!bag || !Array.isArray(bag)) {
      return result
    }

    return this.recoverForMember(member, bag, settings)
  }

  /**
   * 为单个角色使用指定背包执行恢复
   * @param {Object} member - 角色数据
   * @param {Array} bag - 背包数据
   * @param {Object} settings - 设置对象
   * @returns {{hpRecovered: number, mpRecovered: number, itemsUsed: Array}} 恢复结果
   */
  recoverForMember (member, bag, settings = {}) {
    const result = { hpRecovered: 0, mpRecovered: 0, itemsUsed: [] }

    if (!member || !bag || !Array.isArray(bag)) {
      return result
    }

    if (member.currentHealth <= 0) {
      return result
    }

    // 获取恢复阈值
    const hpRecoveryPercent = Number(settings.autoHpRecoveryPercent) || 50
    const mpRecoveryPercent = Number(settings.autoMpRecoveryPercent) || 50

    const hpThreshold = (member.maxHealth || 100) * (hpRecoveryPercent / 100)
    const mpThreshold = (member.maxMana || 100) * (mpRecoveryPercent / 100)

    const shouldRecoverHp = member.currentHealth < hpThreshold && member.currentHealth < member.maxHealth
    const shouldRecoverMp = member.currentMana < mpThreshold && member.currentMana < member.maxMana

    if (!shouldRecoverHp && !shouldRecoverMp) {
      return result
    }

    // 查找恢复物品
    for (const item of bag) {
      if (!item || item.category !== 'recovery') continue

      const itemConfig = this.itemsStore.getItemConfig(item.id)
      if (!itemConfig || !itemConfig.abilities) continue

      const actualStack = item.currentStack !== undefined ? item.currentStack : item.stack
      if (actualStack <= 0) continue

      // 处理HP恢复物品
      if (shouldRecoverHp && item.subcategory === 'food') {
        const hpAbility = itemConfig.abilities.find(a => a.parameter === 'hp')
        if (hpAbility && hpAbility.add) {
          const recoveryValue = hpAbility.rate
            ? Math.floor((member.maxHealth * hpAbility.add) / 100)
            : hpAbility.add

          if (recoveryValue > 0) {
            member.currentHealth = Math.min(
              member.maxHealth,
              member.currentHealth + recoveryValue
            )

            // 减少物品数量，并在数量为0时从背包移除
            if (item.currentStack !== undefined) {
              item.currentStack -= 1
              if (item.currentStack <= 0) {
                const idx = bag.indexOf(item)
                if (idx !== -1) bag.splice(idx, 1)
              }
            } else {
              item.stack -= 1
              if (item.stack <= 0) {
                const idx = bag.indexOf(item)
                if (idx !== -1) bag.splice(idx, 1)
              }
            }

            result.hpRecovered += recoveryValue
            result.itemsUsed.push({ itemId: item.id, type: 'hp', value: recoveryValue })

            // 同步到itemsStore（如果是主玩家）
            this.syncMemberToStore(member)
            return result
          }
        }
      }

      // 处理MP恢复物品
      if (shouldRecoverMp && item.subcategory === 'refresher') {
        const mpAbility = itemConfig.abilities.find(a => a.parameter === 'mp')
        if (mpAbility && mpAbility.add) {
          const recoveryValue = mpAbility.rate
            ? Math.floor((member.maxMana * mpAbility.add) / 100)
            : mpAbility.add

          if (recoveryValue > 0) {
            member.currentMana = Math.min(
              member.maxMana,
              member.currentMana + recoveryValue
            )

            // 减少物品数量，并在数量为0时从背包移除
            if (item.currentStack !== undefined) {
              item.currentStack -= 1
              if (item.currentStack <= 0) {
                const idx = bag.indexOf(item)
                if (idx !== -1) bag.splice(idx, 1)
              }
            } else {
              item.stack -= 1
              if (item.stack <= 0) {
                const idx = bag.indexOf(item)
                if (idx !== -1) bag.splice(idx, 1)
              }
            }

            result.mpRecovered += recoveryValue
            result.itemsUsed.push({ itemId: item.id, type: 'mp', value: recoveryValue })

            // 同步到itemsStore（如果是主玩家）
            this.syncMemberToStore(member)
            return result
          }
        }
      }
    }

    return result
  }

  /**
   * 为多个角色执行自动恢复
   * @param {Array} members - 角色数组
   * @param {Object} settings - 设置对象
   * @returns {Array} 每个角色的恢复结果数组
   */
  checkAndRecoverForMembers (members, settings = {}) {
    if (!members || !Array.isArray(members)) {
      return []
    }

    const results = []
    for (const member of members) {
      if (!member || member.currentHealth <= 0) continue

      const result = this.checkAndRecoverForMember(member, settings)
      results.push({ member, ...result })
    }

    return results
  }

  /**
   * 同步角色数据到Store（仅主玩家需要）
   * @param {Object} member - 角色数据
   */
  syncMemberToStore (member) {
    // 检查是否是主玩家（主玩家没有slotId）
    const isMainPlayer = !member.slotId && member === this.gameStore.player
    if (isMainPlayer) {
      this.gameStore.updatePlayer({
        currentHealth: member.currentHealth,
        currentMana: member.currentMana
      })
    }
  }

  /**
   * 批量使用恢复物品（优化版本，一次性恢复足够量）
   * @param {Object} member - 角色数据
   * @param {Array} bag - 背包数据
   * @param {Object} settings - 设置对象
   * @returns {{hpRecovered: number, mpRecovered: number, itemsUsed: Array}} 恢复结果
   */
  batchRecoverForMember (member, bag, settings = {}) {
    const result = { hpRecovered: 0, mpRecovered: 0, itemsUsed: [] }

    if (!member || !bag || !Array.isArray(bag) || member.currentHealth <= 0) {
      return result
    }

    if (!this.hasAutoRecoveryBuff(member)) {
      return result
    }

    const hpRecoveryPercent = Number(settings.autoHpRecoveryPercent) || 50
    const mpRecoveryPercent = Number(settings.autoMpRecoveryPercent) || 50

    const hpThreshold = (member.maxHealth || 100) * (hpRecoveryPercent / 100)
    const mpThreshold = (member.maxMana || 100) * (mpRecoveryPercent / 100)

    const shouldRecoverHp = member.currentHealth < hpThreshold && member.currentHealth < member.maxHealth
    const shouldRecoverMp = member.currentMana < mpThreshold && member.currentMana < member.maxMana

    if (!shouldRecoverHp && !shouldRecoverMp) {
      return result
    }

    const hpNeeded = member.maxHealth - member.currentHealth
    const mpNeeded = member.maxMana - member.currentMana

    // 收集HP恢复物品
    if (shouldRecoverHp && hpNeeded > 0) {
      const hpItems = this.findRecoveryItems(bag, 'hp')
      const hpResult = this.useRecoveryItemsOptimized(member, hpItems, hpNeeded, 'hp')
      result.hpRecovered += hpResult.recovered
      result.itemsUsed.push(...hpResult.itemsUsed)
    }

    // 收集MP恢复物品
    if (shouldRecoverMp && mpNeeded > 0) {
      const mpItems = this.findRecoveryItems(bag, 'mp')
      const mpResult = this.useRecoveryItemsOptimized(member, mpItems, mpNeeded, 'mp')
      result.mpRecovered += mpResult.recovered
      result.itemsUsed.push(...mpResult.itemsUsed)
    }

    // 同步到Store
    if (result.hpRecovered > 0 || result.mpRecovered > 0) {
      this.syncMemberToStore(member)
    }

    return result
  }

  /**
   * 查找指定类型的恢复物品
   * @param {Array} bag - 背包数据
   * @param {string} type - 类型 'hp' 或 'mp'
   * @returns {Array} 恢复物品数组
   */
  findRecoveryItems (bag, type) {
    if (!bag || !Array.isArray(bag)) return []

    const subcategory = type === 'hp' ? 'food' : 'refresher'
    const items = []

    for (const item of bag) {
      if (!item || item.category !== 'recovery') continue
      if (item.subcategory !== subcategory) continue

      const itemConfig = this.itemsStore.getItemConfig(item.id)
      if (!itemConfig || !itemConfig.abilities) continue

      const ability = itemConfig.abilities.find(a => a.parameter === type)
      if (!ability || !ability.add) continue

      const actualStack = item.currentStack !== undefined ? item.currentStack : item.stack
      if (actualStack <= 0) continue

      const recoveryValue = ability.rate
        ? Math.floor((100 * ability.add) / 100) // 这里需要maxValue，后续计算时会调整
        : ability.add

      items.push({
        item,
        recoveryPerUnit: recoveryValue,
        totalCount: actualStack,
        isRate: ability.rate
      })
    }

    return items
  }

  /**
   * 优化的恢复物品使用（计算需要的数量并一次性使用）
   * @param {Object} member - 角色数据
   * @param {Array} items - 恢复物品数组
   * @param {number} needed - 需要恢复的量
   * @param {string} type - 类型 'hp' 或 'mp'
   * @returns {{recovered: number, itemsUsed: Array}} 恢复结果
   */
  useRecoveryItemsOptimized (member, items, needed, type) {
    const result = { recovered: 0, itemsUsed: [] }

    if (!items || items.length === 0 || needed <= 0) {
      return result
    }

    const maxValue = type === 'hp' ? member.maxHealth : member.maxMana
    let remainingNeeded = needed

    for (const itemData of items) {
      if (remainingNeeded <= 0) break

      // 如果是百分比恢复，重新计算实际恢复值
      let recoveryPerUnit = itemData.recoveryPerUnit
      if (itemData.isRate) {
        const itemConfig = this.itemsStore.getItemConfig(itemData.item.id)
        const ability = itemConfig.abilities.find(a => a.parameter === type)
        recoveryPerUnit = Math.floor((maxValue * ability.add) / 100)
      }

      const useCount = Math.min(
        itemData.totalCount,
        Math.ceil(remainingNeeded / recoveryPerUnit)
      )

      const totalRecovery = useCount * recoveryPerUnit

      // 应用恢复
      if (type === 'hp') {
        member.currentHealth = Math.min(member.maxHealth, member.currentHealth + totalRecovery)
      } else {
        member.currentMana = Math.min(member.maxMana, member.currentMana + totalRecovery)
      }

      // 减少物品数量
      const item = itemData.item
      if (item.currentStack !== undefined) {
        item.currentStack -= useCount
      } else {
        item.stack -= useCount
      }

      result.recovered += totalRecovery
      result.itemsUsed.push({
        itemId: item.id,
        type,
        count: useCount,
        value: totalRecovery
      })

      remainingNeeded -= totalRecovery
    }

    return result
  }

  /**
   * 检查物品是否应该被自动出售
   * @param {Object} item - 物品数据
   * @param {Object} itemInfo - 物品配置信息
   * @param {Object} settings - 设置对象
   * @returns {boolean} 是否应该出售
   */
  shouldAutoSellItem (item, itemInfo, settings) {
    if (!item || !itemInfo) return false

    // 检查是否在禁止出售列表中
    if (AUTO_SELL_BLACKLIST.has(itemInfo.id)) return false

    // 检查是否有强化或穿孔
    const enhanceLevel = Number(
      item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0
    )
    const perforationHoleCount = (() => {
      const attrs = item?.PerforationAttributes || {}
      if (typeof attrs.holeCount === 'number') return attrs.holeCount
      if (typeof item?.holeCount === 'number') return item.holeCount
      return 0
    })()
    const hasEnhanceOrPerforation =
      (Number.isFinite(enhanceLevel) && enhanceLevel > 0) ||
      (Number.isFinite(perforationHoleCount) && perforationHoleCount > 0)

    let shouldSell = false

    // 武器
    if (itemInfo.category === 'weapon') {
      shouldSell =
        (itemInfo.rarity === 'common' && settings.autoSellCommonWeapon) ||
        (itemInfo.rarity === 'uncommon' && settings.autoSellUncommonWeapon) ||
        (itemInfo.rarity === 'rare' && settings.autoSellRareWeapon)

      if (shouldSell) {
        // 检查强化等级范围过滤
        const enhanceMin = settings.autoSellWeaponEnhanceMin
        const enhanceMax = settings.autoSellWeaponEnhanceMax
        const hasMinSet = typeof enhanceMin === 'number' && Number.isFinite(enhanceMin)
        const hasMaxSet = typeof enhanceMax === 'number' && Number.isFinite(enhanceMax)

        if (hasMinSet || hasMaxSet) {
          // 用户设置了强化等级范围，检查武器的强化等级是否在范围内
          const minLevel = hasMinSet ? Math.max(0, Math.min(10, enhanceMin)) : 0
          const maxLevel = hasMaxSet ? Math.max(0, Math.min(10, enhanceMax)) : 10

          if (enhanceLevel >= minLevel && enhanceLevel <= maxLevel) {
            // 强化等级在范围内，允许出售（忽略穿孔检查）
            shouldSell = true
          } else {
            // 强化等级不在范围内，不出售
            shouldSell = false
          }
        } else {
          // 未设置强化等级范围，保持原有逻辑：有强化或穿孔则不出售
          if (hasEnhanceOrPerforation) shouldSell = false
        }
      }
    }
    // 防具
    else if (itemInfo.category === 'armor') {
      shouldSell =
        (itemInfo.rarity === 'common' && settings.autoSellCommonEquip) ||
        (itemInfo.rarity === 'uncommon' && settings.autoSellUncommonEquip) ||
        (itemInfo.rarity === 'rare' && settings.autoSellRareEquip)

      if (shouldSell) {
        // 检查强化等级范围过滤
        const enhanceMin = settings.autoSellEquipEnhanceMin
        const enhanceMax = settings.autoSellEquipEnhanceMax
        const hasMinSet = typeof enhanceMin === 'number' && Number.isFinite(enhanceMin)
        const hasMaxSet = typeof enhanceMax === 'number' && Number.isFinite(enhanceMax)

        if (hasMinSet || hasMaxSet) {
          // 用户设置了强化等级范围，检查防具的强化等级是否在范围内
          const minLevel = hasMinSet ? Math.max(0, Math.min(10, enhanceMin)) : 0
          const maxLevel = hasMaxSet ? Math.max(0, Math.min(10, enhanceMax)) : 10

          if (enhanceLevel >= minLevel && enhanceLevel <= maxLevel) {
            // 强化等级在范围内，允许出售（忽略穿孔检查）
            shouldSell = true
          } else {
            // 强化等级不在范围内，不出售
            shouldSell = false
          }
        } else {
          // 未设置强化等级范围，保持原有逻辑：有强化或穿孔则不出售
          if (hasEnhanceOrPerforation) shouldSell = false
        }
      }
    }
    // 首饰
    else if (itemInfo.category === 'jewelry' || itemInfo.category === 'accessory') {
      shouldSell =
        (itemInfo.rarity === 'common' && settings.autoSellCommonJewelry) ||
        (itemInfo.rarity === 'uncommon' && settings.autoSellUncommonJewelry) ||
        (itemInfo.rarity === 'rare' && settings.autoSellRareJewelry)

      if (shouldSell) {
        // 检查强化等级范围过滤
        const enhanceMin = settings.autoSellJewelryEnhanceMin
        const enhanceMax = settings.autoSellJewelryEnhanceMax
        const hasMinSet = typeof enhanceMin === 'number' && Number.isFinite(enhanceMin)
        const hasMaxSet = typeof enhanceMax === 'number' && Number.isFinite(enhanceMax)

        if (hasMinSet || hasMaxSet) {
          // 用户设置了强化等级范围，检查首饰的强化等级是否在范围内
          const minLevel = hasMinSet ? Math.max(0, Math.min(10, enhanceMin)) : 0
          const maxLevel = hasMaxSet ? Math.max(0, Math.min(10, enhanceMax)) : 10

          if (enhanceLevel >= minLevel && enhanceLevel <= maxLevel) {
            // 强化等级在范围内，允许出售（忽略穿孔检查）
            shouldSell = true
          } else {
            // 强化等级不在范围内，不出售
            shouldSell = false
          }
        } else {
          // 未设置强化等级范围，保持原有逻辑：有强化或穿孔则不出售
          if (hasEnhanceOrPerforation) shouldSell = false
        }
      }
    }
    // 卡片类（排除传说级和非常稀有级卡片）
    else if (itemInfo.subcategory === 'piercingcard' && itemInfo.abilities?.[0]) {
      // 传说级和非常稀有级卡片不自动出售
      const rarity = itemInfo.rarity?.toLowerCase()
      if (rarity === 'legendary' || rarity === 'veryrare') {
        shouldSell = false
      } else {
        const addValue = itemInfo.abilities[0].add || 0
        if (addValue === 2 && settings.autoSell2PercentCard) shouldSell = true
        else if (addValue === 3 && settings.autoSell3PercentCard) shouldSell = true
        else if (addValue === 4 && settings.autoSell4PercentCard) shouldSell = true
      }
    }
    // 元素卡片
    else if (itemInfo.subcategory === 'elementcard') {
      const level1to5 = [7207, 7659, 9399, 1371, 2781]
      const level6to10 = [3687, 3830, 5049, 5455, 6385]
      if (level1to5.includes(itemInfo.id) && settings.autoSellElementCard1to5) shouldSell = true
      else if (level6to10.includes(itemInfo.id) && settings.autoSellElementCard6to10) shouldSell = true
    }
    // 战利品
    else if (itemInfo.category === 'booty' && settings.autoSellAllShiver) {
      shouldSell = true
    }
    // HP恢复道具（食品）- 按物品ID匹配设置
    else if (itemInfo.category === 'recovery' && itemInfo.subcategory === 'food') {
      const settingKey = `autoSellHp${itemInfo.id}`
      if (settings[settingKey] === true) {
        shouldSell = true
      }
    }
    // MP恢复道具（魔法饮料）- 按物品ID匹配设置
    else if (itemInfo.category === 'recovery' && itemInfo.subcategory === 'refresher') {
      const settingKey = `autoSellMp${itemInfo.id}`
      if (settings[settingKey] === true) {
        shouldSell = true
      }
    }
    // FP恢复道具（活力饮料） - 按物品ID映射到设置键名，实际subcategory为drink
    else if (itemInfo.category === 'recovery' && itemInfo.subcategory === 'drink') {
      const fpSettingsMap = {
        2476: 'autoSellFp100',
        6443: 'autoSellFp200',
        8367: 'autoSellFp300',
        7153: 'autoSellFp400',
        942: 'autoSellFp500',
        4069: 'autoSellFp600',
        4370: 'autoSellFp700',
        4923: 'autoSellFp800',
        3880: 'autoSellFp900'
      }
      const settingKey = fpSettingsMap[itemInfo.id]
      if (settingKey && settings[settingKey] === true) {
        shouldSell = true
      }
    }
    // 宠物蛋
    else if (itemInfo.id === 8600 && settings.autoSellPetEgg) {
      shouldSell = true
    }

    return shouldSell
  }

  /**
   * 为单个角色执行自动出售
   * @param {Object} member - 角色数据
   * @param {Array} bag - 背包数据
   * @param {Object} settings - 设置对象
   * @param {Function} onSell - 出售回调 (itemName, quantity, gold) => void
   * @returns {{totalGold: number, itemsSold: Array}} 出售结果
   */
  checkAndSellForMember (member, bag, settings = {}, onSell = null) {
    const result = { totalGold: 0, itemsSold: [] }

    if (!member || !bag || !Array.isArray(bag)) {
      return result
    }

    // 检查是否有自动出售BUFF
    if (!this.hasAutoSellBuff(member)) {
      return result
    }

    const itemsToRemove = []
    const remainingItems = []

    for (const item of bag) {
      if (!item || !item.id) {
        remainingItems.push(item)
        continue
      }

      const itemInfo = this.itemsStore.getItemConfig(item.id)
      if (!itemInfo) {
        remainingItems.push(item)
        continue
      }

      if (this.shouldAutoSellItem(item, itemInfo, settings)) {
        itemsToRemove.push({ item, itemInfo })
      } else {
        remainingItems.push(item)
      }
    }

    // 执行出售
    for (const { item, itemInfo } of itemsToRemove) {
      const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
      const currentStack = item.currentStack !== undefined ? item.currentStack : item.stack
      const totalSellAmount = sellPrice * currentStack

      // 如果物品有强化等级，在名称后追加+强化等级
      const enhanceLevel = Number(item?.enhanceLevel ?? item?.StrengthenedAttributes?.enhanceLevel ?? 0)
      const itemName = itemInfo.name?.cns || itemInfo.name || `物品ID: ${item.id}`
      const displayName = enhanceLevel > 0 ? `${itemName}+${enhanceLevel}` : itemName

      member.gold = (member.gold || 0) + totalSellAmount
      result.totalGold += totalSellAmount
      result.itemsSold.push({
        itemId: item.id,
        itemName: displayName,
        quantity: currentStack,
        gold: totalSellAmount
      })

      if (typeof onSell === 'function') {
        onSell(
          displayName,
          currentStack,
          totalSellAmount
        )
      }
    }

    // 更新背包
    if (itemsToRemove.length > 0) {
      member.bag = remainingItems.filter(i => {
        if (!i) return false
        const stack = i.currentStack !== undefined ? i.currentStack : i.stack
        return stack > 0
      })

      // 同步金币到Store（如果是主玩家）
      const isMainPlayer = !member.slotId && member === this.gameStore.player
      if (isMainPlayer) {
        this.gameStore.updatePlayer({ gold: member.gold })
        this.itemsStore.playerGold = member.gold
      }
    }

    return result
  }
}

// 创建单例实例
let serviceInstance = null

/**
 * 获取AutoRecoveryService单例
 * @returns {AutoRecoveryService} 服务实例
 */
export function getAutoRecoveryService () {
  if (!serviceInstance) {
    serviceInstance = new AutoRecoveryService()
  }
  return serviceInstance
}

export default AutoRecoveryService
