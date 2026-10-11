/**
 * 游戏数据访问 Composable
 * 统一封装游戏数据访问，移除对 gameData.value 的直接引用
 * 使用 itemsStore 和 monstersStore 作为唯一数据源
 */
import { computed } from 'vue'
import { useItemsStore } from '@/store/items'
import { useMonstersStore } from '@/store/monsters'

/**
 * 游戏数据访问 Hook
 * @returns {Object} 游戏数据访问方法
 */
export function useGameData () {
  const itemsStore = useItemsStore()
  const monstersStore = useMonstersStore()

  /**
   * 获取所有物品数据
   */
  const items = computed(() => itemsStore.staticItems || [])

  /**
   * 获取所有怪物配置数据
   */
  const monsters = computed(() => monstersStore.staticMonsters || {})

  /**
   * 根据 ID 获取物品配置
   */
  const getItemById = itemId => {
    return itemsStore.getItemConfig(itemId)
  }

  /**
   * 根据 ID 获取怪物配置
   */
  const getMonsterById = monsterId => {
    return monstersStore.getMonsterConfig(monsterId)
  }

  /**
   * 获取当前地图的怪物实例
   */
  const getCurrentMonsters = computed(() => monstersStore.currentMonsters)

  /**
   * 获取存活怪物
   */
  const getAliveMonsters = computed(() => monstersStore.aliveMonsters)

  /**
   * 获取已死亡怪物
   */
  const getDeadMonsters = computed(() => monstersStore.deadMonsters)

  /**
   * 获取背包物品
   */
  const getBagItems = computed(() => itemsStore.playerBag)

  /**
   * 获取装备
   */
  const getEquipment = computed(() => itemsStore.equipment)

  /**
   * 获取背包使用情况
   */
  const getBagUsage = computed(() => ({
    used: itemsStore.usedSlots,
    available: itemsStore.availableSlots,
    total: itemsStore.bagCapacity,
    percentage: itemsStore.bagUsageRate
  }))

  /**
   * 筛选物品
   */
  const filterItems = filterFn => {
    return items.value.filter(filterFn)
  }

  /**
   * 按类别筛选物品
   */
  const getItemsByCategory = category => {
    return itemsStore.getBagItemsByCategory(category)
  }

  /**
   * 按稀有度筛选物品
   */
  const getItemsByRarity = rarity => {
    return itemsStore.getBagItemsByRarity(rarity)
  }

  return {
    // 数据源
    items,
    monsters,
    currentMonsters: getCurrentMonsters,
    bagItems: getBagItems,
    equipment: getEquipment,

    // 方法
    getItemById,
    getMonsterById,
    filterItems,
    getItemsByCategory,
    getItemsByRarity,

    // 计算属性
    aliveMonsters: getAliveMonsters,
    deadMonsters: getDeadMonsters,
    bagUsage: getBagUsage,

    // Store 引用（供需要直接操作 store 的场景使用）
    itemsStore,
    monstersStore
  }
}

export default useGameData
