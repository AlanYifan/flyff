/**
 * 静态数据加载服务
 * 直接从静态JS文件加载数据，不依赖服务端
 * 所有数据统一通过Pinia Stores管理
 *
 * 数据加载策略：
 * - 核心数据（items, monsters, equipmentSets, skills, classConfig, skillConfig, diamondShopItems）：
 *   由 StaticGameInitializer 在初始化时加载
 * - 可选数据（maps, npcs, quests）：按需加载，通过本服务的 loadXxxData() 方法加载
 *
 * 优化策略：
 * - 大文件（items, monsters, skills）优先从 JSON 加载（如果存在），启用 HTTP 压缩
 * - 支持回退到 JS 文件加载
 */

import { largeDataLoader } from './LargeDataLoader'

// 检测 JSON 数据文件是否可用
const JSON_DATA_AVAILABLE = {
  items: false,
  monsters: false,
  skills: false
}

// 异步检测 JSON 文件
async function checkJsonAvailable (key) {
  if (JSON_DATA_AVAILABLE[key] !== false) {
    return JSON_DATA_AVAILABLE[key]
  }

  try {
    const response = await fetch(`/data/${key}.json`, { method: 'HEAD' })
    JSON_DATA_AVAILABLE[key] = response.ok
    return response.ok
  } catch {
    JSON_DATA_AVAILABLE[key] = false
    return false
  }
}

// 按需加载数据的缓存实例（单例模式）
const onDemandCache = new Map()
// 预留：可用于并发加载控制
// const onDemandLoadingLocks = new Map()

export class StaticDataService {
  constructor () {
    this.cache = new Map()
    this.loadingLocks = new Map()
    this.useJsonData = true // 默认尝试使用 JSON 数据
  }

  /**
   * 初始化服务
   */
  async init () {
  }

  /**
   * 加载物品数据
   * 优先从 JSON 加载（支持 HTTP 压缩），回退到 JS 文件
   */
  async loadItemData () {
    if (this.useJsonData && await checkJsonAvailable('items')) {
      return this.loadLargeDataFromJson('items')
    }
    return this.loadStaticData('items', () => import('@/data/ITEM_INFO.js'))
  }

  /**
   * 加载怪物数据
   * 优先从 JSON 加载（支持 HTTP 压缩），回退到 JS 文件
   */
  async loadMonsterData () {
    if (this.useJsonData && await checkJsonAvailable('monsters')) {
      return this.loadLargeDataFromJson('monsters')
    }
    return this.loadStaticData('monsters', () => import('@/data/MONSTER_INFO.js'))
  }

  /**
   * 加载任务数据
   */
  async loadQuestData () {
    return this.loadStaticData('quests', () => import('@/data/QUEST_INFO.js'))
  }

  /**
   * 加载装备套装数据
   */
  async loadEquipmentSetData () {
    return this.loadStaticData('equipmentSets', () => import('@/data/SQ_SET.js'))
  }

  /**
   * 加载职业配置数据
   */
  async loadClassConfig () {
    return this.loadStaticData('classConfig', () => import('@/data/classes.js'))
  }

  /**
   * 加载技能配置数据
   */
  async loadSkillConfig () {
    return this.loadStaticData('skillConfig', () => import('@/data/skills.js'))
  }

  /**
   * 加载技能信息数据
   * 优先从 JSON 加载（支持 HTTP 压缩），回退到 JS 文件
   */
  async loadSkillInfoData () {
    if (this.useJsonData && await checkJsonAvailable('skills')) {
      return this.loadLargeDataFromJson('skills')
    }
    return this.loadStaticData('skills', () => import('@/data/SKILL_INFO.js'))
  }

  /**
   * 加载地图数据
   */
  async loadMapData () {
    return this.loadStaticData('maps', () => import('@/data/MAP_INFO.js'))
  }

  /**
   * 加载 NPC 数据
   */
  async loadNpcData () {
    return this.loadStaticData('npcs', () => import('@/data/NPC_INFO.js'))
  }

  /**
   * 加载钻石商店物品数据
   */
  async loadDiamondShopItems () {
    return this.loadStaticData('diamondShopItems', () => import('@/data/DIAMOND_SHOP_ITEMS.js'))
  }

  /**
   * 从 JSON 文件加载大数据（使用 LargeDataLoader）
   * 支持 HTTP 压缩、IndexedDB 缓存、进度回调
   * @param {string} key - 数据键名
   */
  async loadLargeDataFromJson (key) {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }

    if (this.loadingLocks.has(key)) {
      return await this.loadingLocks.get(key)
    }

    const loadPromise = (async () => {
      try {
        const data = await largeDataLoader.loadData(key)
        this.cache.set(key, data)
        return data
      } catch (error) {
        console.warn(`[StaticDataService] 从 JSON 加载 ${key} 失败，回退到 JS 文件:`, error)
        // 回退到 JS 文件
        const fallbackLoaders = {
          items: () => import('@/data/ITEM_INFO.js'),
          monsters: () => import('@/data/MONSTER_INFO.js'),
          skills: () => import('@/data/SKILL_INFO.js')
        }
        if (fallbackLoaders[key]) {
          return this.loadStaticData(key, fallbackLoaders[key])
        }
        throw error
      } finally {
        this.loadingLocks.delete(key)
      }
    })()

    this.loadingLocks.set(key, loadPromise)
    return await loadPromise
  }

  /**
   * 通用静态数据加载方法
   * @param {string} key - 数据键名
   * @param {Function} importFn - 导入函数
   * @returns {Promise<Object>} - 加载的数据
   */
  async loadStaticData (key, importFn) {
    const startTime = Date.now()

    try {
      if (this.cache.has(key)) {
        return this.cache.get(key)
      }

      if (this.loadingLocks.has(key)) {
        return await this.loadingLocks.get(key)
      }

      const loadPromise = (async () => {
        try {
          const module = await importFn()
          
          let data
          if (module.default) {
            data = module.default
          } else if (module.ITEM_INFO) {
            data = module.ITEM_INFO
          } else if (module.QUEST_INFO) {
            data = module.QUEST_INFO
          } else if (module.MONSTER_INFO) {
            data = module.MONSTER_INFO
          } else if (module.SKILL_INFO) {
            data = module.SKILL_INFO
          } else if (module.MAP_INFO) {
            data = module.MAP_INFO
          } else if (module.NPC_INFO) {
            data = module.NPC_INFO
          } else if (module.SQ_SET) {
            data = module.SQ_SET
          } else if (module.DIAMOND_SHOP_ITEMS) {
            data = module.DIAMOND_SHOP_ITEMS
          } else if (module.CLASS_CONFIG) {
            data = module.CLASS_CONFIG
          } else if (module.SKILL_CONFIG) {
            data = module.SKILL_CONFIG
          } else {
            data = module
          }

          this.cache.set(key, data)
          return data
        } catch (error) {
          console.error(`[StaticDataService] 加载 ${key} 失败:`, {
            message: error?.message,
            name: error?.name,
            stack: error?.stack
          })
          const defaultData = this.getDefaultData(key)
          this.cache.set(key, defaultData)
          return defaultData
        } finally {
          this.loadingLocks.delete(key)
        }
      })()

      this.loadingLocks.set(key, loadPromise)
      return await loadPromise
    } catch (error) {
      console.error(`加载 ${key} 失败:`, error)
      const defaultData = this.getDefaultData(key)
      this.cache.set(key, defaultData)
      return defaultData
    }
  }

  /**
   * 获取默认数据
   */
  getDefaultData (dataType) {
    const defaults = {
      items: {},
      monsters: {},
      quests: {},
      equipmentSets: [],
      skills: {},
      maps: [],
      classConfig: {},
      skillConfig: {},
      npcs: {}
    }
    return defaults[dataType] || {}
  }

  /**
   * 根据ID获取物品信息
   */
  getItemById (itemId) {
    const items = this.cache.get('items') || {}
    return items[itemId] || null
  }

  /**
   * 根据ID获取怪物信息
   */
  getMonsterById (monsterId) {
    const monsters = this.cache.get('monsters') || {}
    return monsters[monsterId] || null
  }

  /**
   * 根据ID获取任务信息
   */
  getQuestById (questId) {
    const quests = this.cache.get('quests') || {}
    return quests[questId] || null
  }

  /**
   * 根据职业获取技能配置
   */
  getSkillsByClass (className) {
    const classConfig = this.cache.get('classConfig') || {}
    return classConfig[className]?.skills || {}
  }

  /**
   * 获取所有职业列表
   */
  getAllClasses () {
    const classConfig = this.cache.get('classConfig') || {}
    return Object.entries(classConfig).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description || ''
    }))
  }

  /**
   * 根据ID获取地图信息（按需加载）
   * @param {string} mapId - 地图ID
   * @returns {Promise<Object|null>} - 地图信息
   */
  async getMapById (mapId) {
    const maps = await this.loadMapData()
    if (Array.isArray(maps)) {
      return maps.find(m => m.id === mapId || m.name === mapId) || null
    }
    return maps[mapId] || null
  }

  /**
   * 根据ID获取NPC信息（按需加载）
   * @param {string} npcId - NPC ID
   * @returns {Promise<Object|null>} - NPC信息
   */
  async getNpcById (npcId) {
    const npcs = await this.loadNpcData()
    return npcs[npcId] || null
  }

  /**
   * 根据ID获取任务信息（按需加载）
   * @param {string} questId - 任务ID
   * @returns {Promise<Object|null>} - 任务信息
   */
  async getQuestByIdAsync (questId) {
    const quests = await this.loadQuestData()
    return quests[questId] || null
  }

  /**
   * 获取所有地图列表（按需加载）
   * @returns {Promise<Array>} - 地图列表
   */
  async getAllMaps () {
    const maps = await this.loadMapData()
    if (Array.isArray(maps)) {
      return maps
    }
    return Object.entries(maps).map(([id, map]) => ({
      id,
      ...map
    }))
  }

  /**
   * 获取所有NPC列表（按需加载）
   * @returns {Promise<Array>} - NPC列表
   */
  async getAllNpcs () {
    const npcs = await this.loadNpcData()
    return Object.entries(npcs).map(([id, npc]) => ({
      id,
      ...npc
    }))
  }

  /**
   * 获取所有任务列表（按需加载）
   * @returns {Promise<Array>} - 任务列表
   */
  async getAllQuests () {
    const quests = await this.loadQuestData()
    return Object.entries(quests).map(([id, quest]) => ({
      id,
      ...quest
    }))
  }

  /**
   * 预加载可选数据（maps, npcs, quests）
   * 在需要这些数据前可以调用此方法进行预加载
   * @returns {Promise<void>}
   */
  async preloadOptionalData () {
    await Promise.all([
      this.loadMapData(),
      this.loadNpcData(),
      this.loadQuestData()
    ])
  }

  /**
   * 获取当前地图信息
   */
  getCurrentMap () {
    return {
      id: 'paris',
      name: '帕里大陆',
      levelRange: '1-20',
      description: '新手冒险者的起点，和平而美丽的大陆'
    }
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear()
    onDemandCache.clear()
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats () {
    return {
      memoryCacheSize: this.cache.size,
      memoryKeys: Array.from(this.cache.keys())
    }
  }

  /**
   * 预加载所有游戏数据（包括可选数据）
   * 注意：此方法会加载所有数据，包括 maps, npcs, quests
   */
  async preloadAllData () {
    try {
      await Promise.all([
        this.loadItemData(),
        this.loadMonsterData(),
        this.loadEquipmentSetData(),
        this.loadSkillInfoData(),
        this.loadClassConfig(),
        this.loadSkillConfig(),
        this.loadDiamondShopItems(),
        // 可选数据
        this.loadMapData(),
        this.loadNpcData(),
        this.loadQuestData()
      ])

      return true
    } catch (error) {
      console.error('[StaticDataService] 预加载游戏数据失败:', error)
      return false
    }
  }
}

export default StaticDataService
