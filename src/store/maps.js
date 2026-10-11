/**
 * 地图数据统一管理 Store
 * 统一管理地图配置和当前地图状态
 */
import { defineStore } from 'pinia'

export const useMapsStore = defineStore('maps', {
  state: () => ({
    // 静态地图数据（由 StaticGameInitializer 加载）
    staticMaps: [],

    // 统一的地图配置
    mapConfigs: [
      { name: '帕里大陆', levelRange: '1-20', background: '/pt/map/pl.png' },
      { name: '晨光大陆', levelRange: '20-42', background: '/pt/map/cg.png' },
      { name: '莱斯大陆', levelRange: '42-52', background: '/pt/map/ls.png' },
      { name: '达肯1,2大陆', levelRange: '52-74', background: '/pt/map/dk12.png' },
      { name: '达肯3大陆', levelRange: '74-116', background: '/pt/map/dk3.png' },
      { name: '阿兹利亚', levelRange: '117-140', background: '/pt/map/aziliya.png' },
      { name: '珊瑚岛', levelRange: '140-165', background: '/pt/map/shanhudao.png' },
      { name: '凯伦草原', levelRange: '166-200', background: '/pt/map/kailuncaoyuan.png' }
    ],

    // 当前地图
    currentMap: {
      name: '帕里大陆',
      levelRange: '1-20',
      background: '/pt/map/pl.png',
      description: '新手区域，适合1-20级玩家',
      monsters: []
    },

    // 可用地图列表
    availableMaps: [
      {
        id: 'flaris',
        name: '帕里大陆',
        levelRange: '1-20',
        background: '/pt/map/pl.png',
        description: '新手区域，适合1-20级玩家',
        monsters: [1, 2, 3, 4, 5] // 怪物ID
      },
      {
        id: 'saintmorning',
        name: '圣黎明村',
        levelRange: '15-30',
        background: '/pt/map/sm.png',
        description: '进阶区域，适合15-30级玩家',
        monsters: [6, 7, 8, 9, 10]
      },
      {
        id: 'darkon',
        name: '达肯村',
        levelRange: '30-60',
        background: '/pt/map/darkon.png',
        description: '中级区域，适合30-60级玩家',
        monsters: [11, 12, 13, 14, 15]
      }
    ],

    // 地图切换历史（用于导航）
    mapHistory: []
  }),

  getters: {
    /**
     * 获取当前地图信息
     */
    getCurrentMapInfo: state => {
      return state.currentMap
    },

    /**
     * 获取地图等级范围（用于任务筛选）
     */
    getMapLevelRange: state => mapName => {
      const map = state.mapConfigs.find(m => m.name === mapName)
      if (!map) {return { minLevel: 1, maxLevel: 20 }}

      const [minLevel, maxLevel] = map.levelRange.split('-').map(Number)
      return { minLevel, maxLevel }
    },

    /**
     * 根据等级获取推荐地图
     */
    getRecommendedMaps: state => {
      return playerLevel => {
        return state.mapConfigs.filter(map => {
          const [minLevel, maxLevel] = map.levelRange.split('-').map(Number)
          return playerLevel >= minLevel && playerLevel <= maxLevel
        })
      }
    },

    /**
     * 检查地图是否解锁
     */
    isMapUnlocked: state => {
      return (mapId, playerLevel) => {
        const map = state.availableMaps.find(m => m.id === mapId)
        if (!map) {
          return false
        }

        const [minLevel] = map.levelRange.split('-').map(Number)
        return playerLevel >= minLevel
      }
    }
  },

  actions: {
    /**
     * 设置当前地图
     */
    setCurrentMap (mapData) {
      // 添加到历史记录
      if (this.currentMap.id !== mapData.id) {
        this.mapHistory.push({ ...this.currentMap })
        // 只保留最近10条记录
        if (this.mapHistory.length > 10) {
          this.mapHistory.shift()
        }
      }

      // 设置新地图
      this.currentMap = mapData

      // console.log('[MapsStore] 切换地图:', mapData.name)
    },

    /**
     * 切换到指定地图
     */
    changeMap (mapId) {
      const map = this.availableMaps.find(m => m.id === mapId)
      if (map) {
        this.setCurrentMap(map)
        return { success: true, map }
      }
      return { success: false, message: '地图不存在' }
    },

    /**
     * 返回上一个地图
     */
    goToPreviousMap () {
      if (this.mapHistory.length > 0) {
        const previousMap = this.mapHistory.pop()
        this.currentMap = previousMap
        // console.log('[MapsStore] 返回上一个地图:', previousMap.name)
        return previousMap
      }
      return null
    },

    /**
     * 加载地图列表
     */
    loadMaps (mapsData) {
      if (mapsData && Array.isArray(mapsData)) {
        this.availableMaps = mapsData
        // console.log('[MapsStore] 加载地图列表，数量:', mapsData.length)
      }
    },

    /**
     * 添加自定义地图
     */
    addCustomMap (mapData) {
      this.availableMaps.push({
        id: `custom_${Date.now()}`,
        ...mapData
      })
      // console.log('[MapsStore] 添加自定义地图:', mapData.name)
    },

    /**
     * 重置到默认地图
     */
    resetToDefaultMap () {
      this.currentMap = this.availableMaps[0]
      this.mapHistory = []
      // console.log('[MapsStore] 重置到默认地图')
    }
  }
})
