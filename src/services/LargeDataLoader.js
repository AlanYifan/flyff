/**
 * 大数据文件加载服务
 * 用于加载和缓存大型 JSON 数据文件
 * 
 * 优势：
 * 1. JSON 文件可以启用 HTTP 压缩（gzip/brotli），减少 70-80% 传输大小
 * 2. 支持并行加载
 * 3. 支持进度回调
 * 4. 支持 IndexedDB 持久化缓存
 */

// 数据文件配置
const DATA_FILES = {
  items: {
    url: '/data/items.json',
    version: '1.0.1', // 数据版本，用于缓存失效
    size: 37 * 1024 * 1024 // 预估大小（字节）
  },
  monsters: {
    url: '/data/monsters.json',
    version: '1.0.0',
    size: 35 * 1024 * 1024
  },
  skills: {
    url: '/data/skills.json',
    version: '1.0.0',
    size: 5 * 1024 * 1024
  }
}

// IndexedDB 配置
const DB_NAME = 'GameDataCache'
const DB_VERSION = 1
const STORE_NAME = 'data'

class LargeDataLoader {
  constructor () {
    this.cache = new Map()
    this.loadingPromises = new Map()
    this.db = null
    this.dbInitPromise = null
  }

  /**
   * 初始化 IndexedDB
   */
  async initDB () {
    if (this.db) {
      return this.db
    }
    if (this.dbInitPromise) {
      return this.dbInitPromise
    }

    this.dbInitPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.warn('[LargeDataLoader] IndexedDB 初始化失败，将使用内存缓存')
        resolve(null)
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }
    })

    return this.dbInitPromise
  }

  /**
   * 从 IndexedDB 获取缓存数据
   */
  async getFromDB (key) {
    try {
      const db = await this.initDB()
      if (!db) {
        return null
      }

      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(key)

        request.onsuccess = () => {
          const result = request.result
          if (result && result.version === DATA_FILES[key]?.version) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  }

  /**
   * 保存数据到 IndexedDB
   */
  async saveToDB (key, data) {
    try {
      const db = await this.initDB()
      if (!db) {
        return
      }

      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        store.put({
          key,
          data,
          version: DATA_FILES[key]?.version,
          timestamp: Date.now()
        })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      })
    } catch {
      // 忽略错误
    }
  }

  /**
   * 加载单个数据文件
   * @param {string} key - 数据键名
   * @param {Function} onProgress - 进度回调
   */
  async loadData (key, onProgress) {
    // 内存缓存检查
    if (this.cache.has(key)) {
      onProgress?.({ key, status: 'cached', progress: 100 })
      return this.cache.get(key)
    }

    // 正在加载中，返回已有的 Promise
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)
    }

    const loadPromise = this._loadDataInternal(key, onProgress)
    this.loadingPromises.set(key, loadPromise)

    try {
      const data = await loadPromise
      return data
    } finally {
      this.loadingPromises.delete(key)
    }
  }

  /**
   * 内部加载逻辑
   */
  async _loadDataInternal (key, onProgress) {
    const config = DATA_FILES[key]
    if (!config) {
      throw new Error(`Unknown data key: ${key}`)
    }

    // 1. 尝试从 IndexedDB 获取
    onProgress?.({ key, status: 'checking-cache', progress: 0 })
    const cachedData = await this.getFromDB(key)
    if (cachedData) {
      console.log(`[LargeDataLoader] ${key} 从 IndexedDB 缓存加载`)
      this.cache.set(key, cachedData)
      onProgress?.({ key, status: 'cache-hit', progress: 100 })
      return cachedData
    }

    // 2. 从网络加载
    console.log(`[LargeDataLoader] 开始从网络加载 ${key}...`)
    onProgress?.({ key, status: 'downloading', progress: 0 })

    const startTime = performance.now()

    try {
      const response = await fetch(config.url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 获取文件大小用于进度计算
      const contentLength = response.headers.get('content-length')
      const totalSize = contentLength ? parseInt(contentLength, 10) : config.size

      // 流式读取以支持进度回调
      const reader = response.body.getReader()
      const chunks = []
      let loadedSize = 0

      // 使用标志变量避免 while (true)
      let reading = true
      while (reading) {
        const { done, value } = await reader.read()
        if (done) {
          reading = false
          break
        }

        chunks.push(value)
        loadedSize += value.length

        const progress = totalSize > 0 ? Math.round((loadedSize / totalSize) * 100) : 50
        onProgress?.({ key, status: 'downloading', progress, loaded: loadedSize, total: totalSize })
      }

      onProgress?.({ key, status: 'parsing', progress: 90 })

      // 合并 chunks 并解析 JSON
      const blob = new Blob(chunks)
      const text = await blob.text()
      const data = JSON.parse(text)

      const loadTime = performance.now() - startTime
      console.log(`[LargeDataLoader] ${key} 加载完成，耗时 ${(loadTime / 1000).toFixed(2)}s`)

      // 3. 缓存到内存和 IndexedDB
      this.cache.set(key, data)
      this.saveToDB(key, data).catch(() => {})

      onProgress?.({ key, status: 'complete', progress: 100, loadTime })

      return data
    } catch (error) {
      console.error(`[LargeDataLoader] 加载 ${key} 失败:`, error)
      throw error
    }
  }

  /**
   * 并行加载多个数据文件
   * @param {string[]} keys - 数据键名数组
   * @param {Function} onProgress - 总体进度回调
   */
  async loadMultiple (keys, onProgress) {
    const results = {}
    const total = keys.length
    let completed = 0
    const progressMap = new Map()

    const updateProgress = () => {
      const avgProgress = Array.from(progressMap.values()).reduce((sum, p) => sum + p, 0) / total
      onProgress?.({
        total,
        completed,
        progress: Math.round(avgProgress),
        details: Object.fromEntries(progressMap)
      })
    }

    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.loadData(key, (info) => {
          progressMap.set(key, info.progress)
          updateProgress()
        })
        completed++
        updateProgress()
      })
    )

    return results
  }

  /**
   * 清除所有缓存
   */
  async clearCache () {
    this.cache.clear()

    try {
      const db = await this.initDB()
      if (db) {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        store.clear()
      }
    } catch {
      // 忽略错误
    }

    console.log('[LargeDataLoader] 缓存已清除')
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus () {
    return {
      memoryCache: Array.from(this.cache.keys()),
      isLoading: Array.from(this.loadingPromises.keys())
    }
  }
}

// 导出单例
export const largeDataLoader = new LargeDataLoader()

// 导出类供需要时使用
export default LargeDataLoader
