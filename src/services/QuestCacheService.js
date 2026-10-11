/**
 * IndexedDB 缓存服务
 * 用于缓存任务列表等计算结果，提升性能
 */

const DB_NAME = 'FlyffQuestCache'
const DB_VERSION = 1
const STORE_NAME = 'quests'

class QuestCacheService {
  constructor () {
    this.db = null
    this.isInitialized = false
  }

  /**
   * 初始化 IndexedDB
   */
  async init () {
    if (this.isInitialized) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = event => {
        console.error('[QuestCacheService] IndexedDB 打开失败:', event.target.error)
        reject(event.target.error)
      }

      request.onsuccess = event => {
        this.db = event.target.result
        this.isInitialized = true
        console.log('[QuestCacheService] IndexedDB 初始化成功')
        resolve(this.db)
      }

      request.onupgradeneeded = event => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('[QuestCacheService] 创建 objectStore:', STORE_NAME)
        }
      }
    })
  }

  /**
   * 缓存任务列表
   * @param {string} key - 缓存键（格式：mapName_playerLevel）
   * @param {Array} quests - 任务列表
   * @param {number} ttl - 缓存有效期（毫秒），默认 1 小时
   */
  async set (key, quests, ttl = 3600000) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      try {
        // 使用 JSON 序列化确保所有数据都可以被克隆
        const serializedQuests = quests.map(quest => {
          // 创建一个可序列化的副本
          const questCopy = {
            id: quest.id,
            name: quest.name ? { cns: quest.name.cns, en: quest.name.en } : { cns: '', en: '' },
            type: quest.type || '',
            minLevel: quest.minLevel || 0,
            maxLevel: quest.maxLevel || 0,
            beginNPC: quest.beginNPC || 0,
            endNPC: quest.endNPC || 0,
            description: quest.description ? { cns: quest.description.cns, en: quest.description.en } : { cns: '', en: '' }
          }

          // 序列化 requirements（如果存在）
          if (quest.endNeededItems && Array.isArray(quest.endNeededItems)) {
            questCopy.endNeededItems = quest.endNeededItems.map(item => ({
              item: item.item || 0,
              count: item.count || 0
            }))
          }

          // 序列化击杀怪物目标（如果存在）
          if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
            questCopy.endKillMonsters = quest.endKillMonsters.map(monster => ({
              monster: Array.isArray(monster.monster) ? [...monster.monster] : monster.monster,
              count: monster.count || 0
            }))
          }

          // 序列化 rewards（如果存在）
          if (quest.endReceiveExperience) {
            questCopy.endReceiveExperience = Array.isArray(quest.endReceiveExperience)
              ? [...quest.endReceiveExperience]
              : quest.endReceiveExperience
          }

          if (quest.endReceiveItems && Array.isArray(quest.endReceiveItems)) {
            questCopy.endReceiveItems = quest.endReceiveItems.map(item => ({
              item: item.item || 0,
              count: item.count || 0
            }))
          }

          // 金币奖励
          if (quest.endReceiveGold) {
            questCopy.endReceiveGold = quest.endReceiveGold
          }

          if (quest.endReceivePenya) {
            questCopy.endReceivePenya = quest.endReceivePenya
          }

          // 序列化 objectives（如果存在）
          if (quest.objectives && Array.isArray(quest.objectives)) {
            questCopy.objectives = quest.objectives.map(obj => ({
              type: obj.type || '',
              target: obj.target || 0,
              count: obj.count || 0
            }))
          }

          return questCopy
        })

        // 测试序列化是否成功
        JSON.stringify(serializedQuests)

        const data = {
          key,
          quests: serializedQuests,
          timestamp: Date.now(),
          ttl
        }

        const request = store.put(data)

        request.onsuccess = () => {
          console.log(`[QuestCacheService] 缓存任务列表: ${key}, 任务数: ${quests.length}`)
          resolve()
        }

        request.onerror = event => {
          console.error('[QuestCacheService] 缓存失败:', event.target.error)
          reject(event.target.error)
        }
      } catch (error) {
        console.error('[QuestCacheService] 序列化任务失败:', error)
        reject(error)
      }
    })
  }

  /**
   * 获取缓存的任务列表
   * @param {string} key - 缓存键
   * @returns {Array|null} 任务列表或 null（如果缓存不存在或已过期）
   */
  async get (key) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = event => {
        const result = event.target.result

        if (!result) {
          console.log(`[QuestCacheService] 缓存不存在: ${key}`)
          resolve(null)
          return
        }

        const now = Date.now()
        const isExpired = (now - result.timestamp) > result.ttl

        if (isExpired) {
          console.log(`[QuestCacheService] 缓存已过期: ${key}`)
          this.delete(key)
          resolve(null)
          return
        }

        console.log(`[QuestCacheService] 缓存命中: ${key}, 任务数: ${result.quests.length}`)
        resolve(result.quests)
      }

      request.onerror = event => {
        console.error('[QuestCacheService] 获取缓存失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  async delete (key) {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => {
        console.log(`[QuestCacheService] 删除缓存: ${key}`)
        resolve()
      }

      request.onerror = event => {
        console.error('[QuestCacheService] 删除缓存失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  /**
   * 清除所有缓存
   */
  async clear () {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('[QuestCacheService] 清除所有缓存')
        resolve()
      }

      request.onerror = event => {
        console.error('[QuestCacheService] 清除缓存失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  /**
   * 清除过期缓存
   */
  async clearExpired () {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const now = Date.now()

      const request = index.openCursor(null, 'prev')

      request.onsuccess = event => {
        const cursor = event.target.result

        if (!cursor) {
          console.log('[QuestCacheService] 清除过期缓存完成')
          resolve()
          return
        }

        const data = cursor.value
        if ((now - data.timestamp) > data.ttl) {
          cursor.delete()
          console.log(`[QuestCacheService] 删除过期缓存: ${data.key}`)
        }

        cursor.continue()
      }

      request.onerror = event => {
        console.error('[QuestCacheService] 清除过期缓存失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  /**
   * 生成缓存键
   * @param {string} mapName - 地图名称
   * @param {number} playerLevel - 玩家等级
   * @returns {string} 缓存键
   */
  generateCacheKey (mapName, playerLevel) {
    return `${mapName}_${playerLevel}`
  }

  /**
   * 关闭数据库连接
   */
  close () {
    if (this.db) {
      this.db.close()
      this.db = null
      this.isInitialized = false
      console.log('[QuestCacheService] 关闭数据库连接')
    }
  }
}

export default new QuestCacheService()
