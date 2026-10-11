/**
 * 图片预加载工具
 * 用于预加载游戏中的图片资源，避免动画时出现卡顿
 */

class ImagePreloader {
  constructor () {
    this.cache = new Map()
    this.loadingPromises = new Map()
  }

  /**
   * 预加载单个图片
   * @param {string} url - 图片URL
   * @returns {Promise<HTMLImageElement>}
   */
  preloadImage (url) {
    // 如果已经缓存，直接返回
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url))
    }

    // 如果正在加载，返回加载中的Promise
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)
    }

    // 创建新的加载Promise
    const promise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.cache.set(url, img)
        this.loadingPromises.delete(url)
        resolve(img)
      }
      img.onerror = () => {
        this.loadingPromises.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }
      img.src = url
    })

    this.loadingPromises.set(url, promise)
    return promise
  }

  /**
   * 批量预加载图片
   * @param {string[]} urls - 图片URL数组
   * @returns {Promise<HTMLImageElement[]>}
   */
  preloadImages (urls) {
    const promises = urls.map(url => this.preloadImage(url))
    return Promise.all(promises)
  }

  /**
   * 预加载金币图片
   */
  preloadGoldImages () {
    const goldUrls = ['/pt/UI/gold.png']
    return this.preloadImages(goldUrls)
  }

  /**
   * 预加载物品图片
   * @param {Array} items - 物品数组
   */
  preloadItemImages (items) {
    const itemUrls = items
      .filter(item => item && item.id)
      .map(item => `/pt/item_icon/${item.id}.png`)

    return this.preloadImages(itemUrls)
  }

  /**
   * 预加载常用物品图片
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
    return this.preloadImages(itemUrls)
  }

  /**
   * 检查图片是否已缓存
   * @param {string} url - 图片URL
   * @returns {boolean}
   */
  isCached (url) {
    return this.cache.has(url)
  }

  /**
   * 获取缓存的图片
   * @param {string} url - 图片URL
   * @returns {HTMLImageElement|null}
   */
  getCachedImage (url) {
    return this.cache.get(url) || null
  }

  /**
   * 清空缓存
   */
  clearCache () {
    this.cache.clear()
    this.loadingPromises.clear()
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  getCacheSize () {
    return this.cache.size
  }
}

// 创建单例实例
const imagePreloader = new ImagePreloader()

export default imagePreloader
