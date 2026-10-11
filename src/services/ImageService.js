/**
 * 统一的图片加载和缓存服务
 * 合并了原 ImageService 和 ImagePreloader 的功能
 * 使用 OptimizedLRUCache 实现高效的缓存管理
 */
import { OptimizedLRUCache } from '@/utils/cache/OptimizedLRUCache'

export class ImageService {
  constructor () {
    // 使用优化的 LRU 缓存
    // 最大缓存 10000 张图片，TTL 60 分钟
    this.imageCache = new OptimizedLRUCache({
      maxSize: 10000,
      ttl: 60 * 60 * 1000, // 60 分钟
      enableStats: true
    })

    // 正在加载的图片 Promise，避免重复加载
    this.loadingPromises = new Map()

    // 已加载的图片 URL 集合（用于去重）
    this.loadedUrls = new Set()

    // 默认图标配置
    this.defaultIcons = {
      monster: '/pt/monster_icon/2087.png',
      item: '/pt/item_icon/1.png',
      ui: '/pt/UI/default.png',
      bg: '/pt/bg/default.png'
    }

    // 预加载优先级配置
    this.priorityConfig = {
      critical: 1, // 关键图片：当前战斗怪物、装备图标
      high: 2, // 高优先级：背包物品、商店物品
      medium: 3, // 中优先级：地图背景、UI
      low: 4 // 低优先级：其他资源
    }

    // 优先级队列
    this.preloadQueue = []
    this.isPreloading = false
    this.maxConcurrentPreloads = 3 // 同时预加载数量

    // 缺失的图标文件（用于避免重复记录错误）
    this.missingImages = new Set()
    // 最大记录的缺失图片数量
    this.maxMissingImagesLogged = 50
    // 已记录的缺失图片数量
    this.missingImagesLoggedCount = 0
  }

  /**
   * 加载单张图片，支持缓存
   * @param {string} src - 图片路径
   * @returns {Promise<HTMLImageElement>} 图片加载完成的 Promise
   */
  loadImage (src) {
    // 检查是否已在缓存中
    if (this.imageCache.has(src)) {
      const cachedImage = this.imageCache.get(src)
      return Promise.resolve(cachedImage)
    }

    // 检查是否正在加载中
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)
    }

    // 创建新的加载 Promise
    const loadPromise = new Promise((resolve, reject) => {
      // 检查是否在浏览器环境中
      if (typeof Image === 'undefined') {
        console.warn('[ImageService] Image API not available, returning mock image for:', src)
        const mockImg = { src, onload: null, onerror: null, width: 0, height: 0 }
        this.addToCache(src, mockImg)
        this.loadingPromises.delete(src)
        resolve(mockImg)
        return
      }

      const img = new Image()

      img.onload = () => {
        // 添加到缓存
        this.addToCache(src, img)
        this.loadedUrls.add(src)
        // 清除加载 Promise
        this.loadingPromises.delete(src)
        resolve(img)
      }

      img.onerror = () => {
        // 只在首次遇到缺失图片时记录错误
        if (
          !this.missingImages.has(src) &&
          this.missingImagesLoggedCount < this.maxMissingImagesLogged
        ) {
          console.warn(`[ImageService] Image not found: ${src}`)
          this.missingImages.add(src)
          this.missingImagesLoggedCount++

          // 当达到最大记录数量时，显示汇总信息
          if (this.missingImagesLoggedCount === this.maxMissingImagesLogged) {
            console.warn(
              `[ImageService] 已记录 ${this.maxMissingImagesLogged} 个缺失的图片，后续缺失图片将不再显示错误日志`
            )
          }
        }
        // 清除加载 Promise
        this.loadingPromises.delete(src)
        // 尝试加载默认图片
        this.loadDefaultImage(src, resolve, reject)
      }

      img.src = src
    })

    // 存储加载 Promise 以避免重复请求
    this.loadingPromises.set(src, loadPromise)

    return loadPromise
  }

  /**
   * 加载默认图片
   * @param {string} originalSrc - 原始图片路径
   * @param {Function} resolve - Promise resolve 函数
   * @param {Function} reject - Promise reject 函数
   */
  loadDefaultImage (originalSrc, resolve, reject) {
    // 根据原始图片路径判断类型，加载相应默认图片
    let defaultSrc = this.defaultIcons.monster

    if (originalSrc.includes('/item_icon/')) {
      defaultSrc = this.defaultIcons.item
    } else if (originalSrc.includes('/UI/')) {
      defaultSrc = this.defaultIcons.ui
    } else if (originalSrc.includes('/bg/')) {
      defaultSrc = this.defaultIcons.bg
    }

    // 如果默认图片也加载失败，则返回错误
    const defaultImg = new Image()
    defaultImg.onload = () => {
      this.addToCache(originalSrc, defaultImg)
      resolve(defaultImg)
    }
    defaultImg.onerror = () => {
      console.error(`[ImageService] Failed to load default image: ${defaultSrc}`)
      reject(new Error(`Could not load image: ${originalSrc} and default replacement`))
    }
    defaultImg.src = defaultSrc
  }

  /**
   * 批量加载图片
   * @param {string[]} srcArray - 图片路径数组
   * @returns {Promise<HTMLImageElement[]>} 所有图片加载完成的 Promise
   */
  loadImages (srcArray) {
    const promises = srcArray.map(src => this.loadImage(src))
    return Promise.all(promises)
  }

  /**
   * 预加载图片（后台加载，不阻塞）- 优化版，支持优先级
   * @param {string[]} srcArray - 图片路径数组
   * @param {string} priority - 优先级 ('critical', 'high', 'medium', 'low')
   * @returns {number} 开始预加载的图片数量
   */
  preloadImages (srcArray, priority = 'medium') {
    if (!Array.isArray(srcArray) || srcArray.length === 0) {
      return 0
    }

    // 过滤已加载的图片
    const toLoad = srcArray.filter(src => !this.isLoaded(src))
    if (toLoad.length === 0) {
      return 0
    }

    // 根据优先级添加到队列
    const priorityLevel = this.priorityConfig[priority] || this.priorityConfig.medium
    toLoad.forEach(src => {
      this.preloadQueue.push({ src, priority: priorityLevel, timestamp: Date.now() })
    })

    // 按优先级排序
    this.preloadQueue.sort((a, b) => a.priority - b.priority)

    // 开始处理预加载队列
    this.processPreloadQueue()

    console.log(`[ImageService] 添加 ${toLoad.length} 张图片到预加载队列 (优先级: ${priority})`)
    return toLoad.length
  }

  /**
   * 处理预加载队列
   */
  async processPreloadQueue () {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true
    let loadedCount = 0
    const maxConcurrent = this.maxConcurrentPreloads

    // 创建并发加载任务
    const loadTasks = []
    while (this.preloadQueue.length > 0 && loadedCount < maxConcurrent) {
      const { src } = this.preloadQueue.shift()
      const task = this.loadImage(src).catch(error => {
        console.warn(`[ImageService] 预加载失败: ${src}`, error)
      })
      loadTasks.push(task)
      loadedCount++
    }

    // 等待当前批次完成
    await Promise.all(loadTasks)

    this.isPreloading = false

    // 如果还有待加载的图片，继续处理
    if (this.preloadQueue.length > 0) {
      // 延迟 50ms 继续处理，避免阻塞主线程
      setTimeout(() => this.processPreloadQueue(), 50)
    }
  }

  /**
   * 按需预加载（懒加载）
   * @param {string} src - 图片路径
   * @returns {Promise<HTMLImageElement>} 图片加载完成
   */
  preloadOnDemand (src) {
    if (this.isLoaded(src)) {
      return Promise.resolve(this.getCachedImage(src))
    }

    // 使用高优先级按需加载
    this.preloadImages([src], 'critical')
    return this.loadImage(src)
  }

  /**
   * 将图片添加到缓存
   * @param {string} src - 图片路径
   * @param {HTMLImageElement} img - 图片元素
   */
  addToCache (src, img) {
    this.imageCache.set(src, img)
  }

  /**
   * 从缓存中获取图片
   * @param {string} src - 图片路径
   * @returns {HTMLImageElement|undefined} 缓存的图片或 undefined
   */
  getCachedImage (src) {
    const cached = this.imageCache.get(src)
    return cached || undefined
  }

  /**
   * 检查图片是否已缓存
   * @param {string} src - 图片路径
   * @returns {boolean} 是否已缓存
   */
  isCached (src) {
    return this.imageCache.has(src)
  }

  /**
   * 检查图片是否已加载（包括加载中）
   * @param {string} src - 图片路径
   * @returns {boolean} 是否已加载
   */
  isLoaded (src) {
    return this.loadedUrls.has(src) || this.loadingPromises.has(src)
  }

  /**
   * 清除指定图片的缓存
   * @param {string} src - 图片路径
   */
  clearCache (src) {
    if (src) {
      this.imageCache.delete(src)
      this.loadingPromises.delete(src)
      this.loadedUrls.delete(src)
    } else {
      // 清除所有缓存
      this.clearAllCache()
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache () {
    this.imageCache.clear()
    this.loadingPromises.clear()
    this.loadedUrls.clear()
    this.missingImages.clear()
    this.missingImagesLoggedCount = 0
    console.log('[ImageService] 所有图片缓存已清除')
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计信息
   */
  getCacheStats () {
    const stats = this.imageCache.getStats()
    return {
      ...stats,
      loadingCount: this.loadingPromises.size,
      loadedCount: this.loadedUrls.size,
      missingCount: this.missingImages.size,
      missingImagesLoggedCount: this.missingImagesLoggedCount
    }
  }

  /**
   * 打印缓存统计信息（用于调试）
   */
  printCacheStats () {
    const stats = this.getCacheStats()
    console.log('[ImageService] 缓存统计:', {
      缓存大小: stats.size,
      最大缓存: stats.maxSize,
      命中次数: stats.hits,
      未命中次数: stats.misses,
      命中率: stats.hitRate,
      淘汰次数: stats.evictions,
      过期次数: stats.expirations,
      正在加载: stats.loadingCount,
      已加载: stats.loadedCount,
      缺失图片: stats.missingCount,
      已记录缺失: stats.missingImagesLoggedCount,
      TTL: `${stats.ttl / 1000}秒`
    })
  }

  /**
   * 打印缺失的图片列表（用于调试）
   */
  printMissingImages () {
    if (this.missingImages.size === 0) {
      console.log('[ImageService] 没有缺失的图片')
      return
    }
    console.log(`[ImageService] 缺失的图片 (${this.missingImages.size}个):`)
    const missingArray = Array.from(this.missingImages).sort()
    missingArray.forEach((img, index) => {
      console.log(`  ${index + 1}. ${img}`)
    })
  }

  /**
   * 导出缺失的图片列表（用于生成资源清单）
   * @returns {Array} 缺失的图片路径数组
   */
  exportMissingImages () {
    return Array.from(this.missingImages).sort()
  }

  /**
   * 生成图片 URL
   * @param {string} type - 图片类型 ('monster', 'item', 'UI', 'bg')
   * @param {string|number} id - 图片 ID
   * @returns {string} 图片 URL
   */
  getImageUrl (type, id) {
    let url
    switch (type) {
    case 'monster':
      url = `/pt/monster_icon/${id}.png`
      break
    case 'item':
      url = `/pt/item_icon/${id}.png`
      break
    case 'UI':
      url = `/pt/UI/${id}`
      break
    case 'bg':
      url = `/pt/bg/${id}`
      break
    default:
      console.warn(`[ImageService] Unknown image type: ${type}`)
      url = `/pt/monster_icon/${id}.png`
    }
    // 检查并修复重复的 .png 后缀
    return url.replace(/\.png\.png$/, '.png')
  }

  // ========== 预加载游戏相关图片 ==========

  /**
   * 预加载游戏数据相关的图片资源 - 优化版，分优先级加载
   * @param {Object} gameData - 游戏数据对象
   * @param {string} loadPhase - 加载阶段 ('initial', 'combat', 'shop')
   * @returns {number} 预加载的图片数量
   */
  preloadGameImages (gameData, loadPhase = 'initial') {
    const criticalUrls = []
    const highUrls = []
    const mediumUrls = []

    // 根据加载阶段决定预加载策略
    switch (loadPhase) {
    case 'initial':
      // 初始阶段：只预加载常用资源
      if (gameData && gameData.monsters) {
        // 只预加载低等级怪物（前 20 个）
        const monsterIds = Object.keys(gameData.monsters).slice(0, 20)
        monsterIds.forEach(id => {
          const monster = gameData.monsters[id]
          const icon = monster.icon || id
          const url = icon.includes('/pt/monster_icon/') ? icon : `/pt/monster_icon/${icon}.png`
          mediumUrls.push(url)
        })
      }
      if (gameData && gameData.items) {
        // 只预加载常用物品（前 30 个）
        // 支持数组和对象两种格式
        const items = Array.isArray(gameData.items)
          ? gameData.items
          : Object.keys(gameData.items).map(key => gameData.items[key])
        items.slice(0, 30).forEach(item => {
          // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
          const url = `/pt/item_icon/${item.id}.png`
          highUrls.push(url)
        })
      }
      break

    case 'combat':
      // 战斗阶段：预加载当前地图的怪物图片
      if (gameData && gameData.monsters) {
        Object.keys(gameData.monsters).forEach(id => {
          const monster = gameData.monsters[id]
          const icon = monster.icon || id
          const url = icon.includes('/pt/monster_icon/') ? icon : `/pt/monster_icon/${icon}.png`
          // 检查并修复重复的 .png 后缀
          const fixedUrl = url.replace(/\.png\.png$/, '.png')
          criticalUrls.push(fixedUrl)
        })
      }
      break

    case 'shop':
      // 商店阶段：预加载商品图片
      if (gameData && gameData.items) {
        // 支持数组和对象两种格式
        const items = Array.isArray(gameData.items)
          ? gameData.items
          : Object.keys(gameData.items).map(key => gameData.items[key])
        items.forEach(item => {
          // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
          const url = `/pt/item_icon/${item.id}.png`
          highUrls.push(url)
        })
      }
      break

    default:
      // 完整加载（保持原有逻辑）
      if (gameData && gameData.monsters) {
        Object.keys(gameData.monsters).forEach(id => {
          const monster = gameData.monsters[id]
          const icon = monster.icon || id
          const url = icon.includes('/pt/monster_icon/') ? icon : `/pt/monster_icon/${icon}.png`
          // 检查并修复重复的 .png 后缀
          const fixedUrl = url.replace(/\.png\.png$/, '.png')
          mediumUrls.push(fixedUrl)
        })
      }
      if (gameData && gameData.items) {
        // 支持数组和对象两种格式
        const items = Array.isArray(gameData.items)
          ? gameData.items
          : Object.keys(gameData.items).map(key => gameData.items[key])
        items.forEach(item => {
          // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
          const url = `/pt/item_icon/${item.id}.png`
          mediumUrls.push(url)
        })
      }
    }

    // 按优先级分批预加载
    let totalLoaded = 0

    // 关键优先级
    if (criticalUrls.length > 0) {
      const batches = this.splitIntoBatches(criticalUrls, 10)
      for (const batch of batches) {
        this.preloadImages(batch, 'critical')
        totalLoaded += batch.length
      }
    }

    // 高优先级
    if (highUrls.length > 0) {
      const batches = this.splitIntoBatches(highUrls, 30)
      for (const batch of batches) {
        this.preloadImages(batch, 'high')
        totalLoaded += batch.length
      }
    }

    // 中优先级（初始阶段才加载）
    if (loadPhase === 'initial' && mediumUrls.length > 0) {
      const batches = this.splitIntoBatches(mediumUrls, 50)
      for (const batch of batches) {
        this.preloadImages(batch, 'medium')
        totalLoaded += batch.length
      }
    }

    console.log(`[ImageService] 分阶段预加载完成，阶段: ${loadPhase}, 数量: ${totalLoaded}`)
    return totalLoaded
  }

  /**
   * 将数组分割为批次
   * @param {Array} array - 数组
   * @param {number} batchSize - 批次大小
   * @returns {Array[]} 批次数组
   */
  splitIntoBatches (array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 预加载背包中的物品图标 - 优化版
   * @param {Array} bagItems - 背包物品数组
   * @returns {number} 预加载的图片数量
   */
  preloadBagItemImages (bagItems) {
    if (!Array.isArray(bagItems)) {
      console.warn('[ImageService] bagItems must be an array')
      return 0
    }

    const imageUrls = bagItems
      .filter(item => item && item.id)
      .map(item => `/pt/item_icon/${item.id}.png`)
      .filter(url => !this.isLoaded(url)) // 过滤已加载的

    if (imageUrls.length === 0) {
      return 0
    }

    // 使用高优先级预加载
    const batches = this.splitIntoBatches(imageUrls, 20)
    let totalLoaded = 0

    batches.forEach((batch, index) => {
      if (index === 0) {
        // 第一批使用高优先级（可见部分）
        this.preloadImages(batch, 'high')
      } else {
        // 后续批次使用中等优先级
        this.preloadImages(batch, 'medium')
      }
      totalLoaded += batch.length
    })

    console.log(`[ImageService] 预加载背包物品图片 ${totalLoaded} 张`)
    return totalLoaded
  }

  /**
   * 预加载装备中的物品图标 - 优化版
   * @param {Object} equipment - 装备对象
   * @returns {number} 预加载的图片数量
   */
  preloadEquipmentImages (equipment) {
    if (!equipment || typeof equipment !== 'object') {
      return 0
    }

    // 修复：使用Object.keys()而不是Object.values()
    // 避免出现"Too many properties to enumerate"错误
    const imageUrls = Object.keys(equipment)
      .map(key => equipment[key])
      .filter(item => item && item.id)
      .map(item => `/pt/item_icon/${item.id}.png`)
      .filter(url => !this.isLoaded(url))

    if (imageUrls.length === 0) {
      return 0
    }

    // 装备使用关键优先级
    this.preloadImages(imageUrls, 'critical')

    console.log(`[ImageService] 预加载装备物品图片 ${imageUrls.length} 张`)
    return imageUrls.length
  }

  /**
   * 预加载特定类型的图片
   * @param {string} type - 图片类型 ('monster', 'item', 'UI')
   * @param {Array} ids - 图片 ID 数组
   * @returns {number} 预加载的图片数量
   */
  preloadSpecificImages (type, ids) {
    if (!Array.isArray(ids)) {
      console.warn('[ImageService] IDs must be an array')
      return 0
    }

    const imageUrls = ids.map(id => this.getImageUrl(type, id))
    this.preloadImages(imageUrls)

    console.log(`[ImageService] 开始预加载 ${type} 类型的 ${ids.length} 张图片`)

    return ids.length
  }

  /**
   * 预加载常用物品图片（保留原 ImagePreloader 的功能）
   */
  preloadCommonItemImages () {
    const commonItemIds = [
      // 武器
      'weapon_sword_1',
      'weapon_sword_2',
      'weapon_sword_3',
      'weapon_axe_1',
      'weapon_axe_2',
      'weapon_axe_3',
      'weapon_bow_1',
      'weapon_bow_2',
      'weapon_bow_3',
      'weapon_staff_1',
      'weapon_staff_2',
      'weapon_staff_3',
      'weapon_yoyo_1',
      'weapon_yoyo_2',
      'weapon_yoyo_3',
      // 防具
      'armor_1',
      'armor_2',
      'armor_3',
      'helmet_1',
      'helmet_2',
      'helmet_3',
      'boots_1',
      'boots_2',
      'boots_3',
      'gloves_1',
      'gloves_2',
      'gloves_3',
      // 饰品
      'ring_1',
      'ring_2',
      'ring_3',
      'necklace_1',
      'necklace_2',
      'necklace_3',
      'earring_1',
      'earring_2',
      'earring_3',
      // 消耗品
      'potion_hp',
      'potion_mp',
      'food_1',
      'food_2'
    ]

    const itemUrls = commonItemIds.map(id => `/pt/item_icon/${id}.png`)
    this.preloadImages(itemUrls)

    console.log(`[ImageService] 开始预加载 ${itemUrls.length} 张常用物品图片`)

    return itemUrls.length
  }

  /**
   * 预加载金币图片
   */
  preloadGoldImages () {
    const goldUrls = ['/pt/UI/gold.png']
    this.preloadImages(goldUrls)
    return goldUrls.length
  }
}

// 创建全局单例
export const imageService = new ImageService()

// 导出便捷函数
export const loadImage = src => imageService.loadImage(src)
export const loadImages = srcArray => imageService.loadImages(srcArray)
export const preloadImages = srcArray => imageService.preloadImages(srcArray)
export const getCachedImage = src => imageService.getCachedImage(src)
export const clearImageCache = src => imageService.clearCache(src)
export const getImageUrl = (type, id) => imageService.getImageUrl(type, id)

// 导出预加载函数（保留原 ImagePreloader 的导出）
export const preloadGameImages = (gameData, loadPhase) =>
  imageService.preloadGameImages(gameData, loadPhase)
export const preloadBagItemImages = bagItems => imageService.preloadBagItemImages(bagItems)
export const preloadEquipmentImages = equipment => imageService.preloadEquipmentImages(equipment)
export const preloadOnDemand = src => imageService.preloadOnDemand(src)
export const preloadSpecificImages = (type, ids) => imageService.preloadSpecificImages(type, ids)
export const preloadCommonItemImages = () => imageService.preloadCommonItemImages()
export const preloadGoldImages = () => imageService.preloadGoldImages()

export default ImageService
