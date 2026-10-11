/**
 * @file achievements.js
 * @description 成就系统 Pinia Store
 * @description 管理成就进度状态、已解锁称号，提供分类查询和进度更新接口
 * @description 数据来源为 src/data/ACHIEVEMENT_INFO.js（静态只读）+ 玩家存档中的 achievement 字段
 * @author FLYFF Team
 * @created 2026-07-13
 */

import { defineStore } from 'pinia'
import { achievementService } from '@/services/AchievementService.js'

/**
 * 成就分类列表（与 ACHIEVEMENT_INFO.js 中 category 字段对应 + 称号虚拟分类）
 * @type {{ key: string, label: string, icon: string }[]}
 */
export const ACHIEVEMENT_CATEGORIES = [
  { key: 'general', label: '一般', icon: '⭐' },
  { key: 'monsters', label: '怪物', icon: '👹' },
  { key: 'consumables', label: '消耗品', icon: '🧪' },
  { key: 'attendance', label: '登录', icon: '📅' },
  { key: 'lifestyle', label: '生活技艺', icon: '🎣' },
  { key: 'title', label: '称号＆徽章', icon: '🎖️' }
]

/**
 * 成就 type 到中文标签的映射表
 * @type {Record<string, string>}
 */
export const ACHIEVEMENT_TYPE_LABELS = {
  killmonster: '击杀怪物',
  useitem: '使用物品',
  playtime: '游戏时间',
  coupleduration: '情侣时长',
  stat: '属性达成',
  level: '等级达成',
  useskill: '技能使用',
  connection: '登录天数',
  jump: '跳跃次数',
  hatchegg: '孵蛋',
  lifestylepoints: '生活积分',
  coupleskill: '情侣技能',
  levelcouple: '情侣等级',
  fishingpoints: '钓鱼',
  alchemypoints: '炼金',
  cookingpoints: '烹饪',
  smithingpoints: '锻造',
  woodcuttingpoints: '伐木',
  couplemotion: '情侣动作',
  formcouple: '结成情侣',
  herbgatheringpoints: '采药',
  greatsuccess: '大成功',
  carpentrypoints: '木工',
  miningpoints: '挖矿',
  winrainbowrace: '彩虹赛'
}

export const useAchievementsStore = defineStore('achievements', {
  state: () => ({
    /**
     * 事件通知版本号，用于触发 UI 刷新
     * 每次 recordEvent / setProgress / addProgress 后递增
     */
    version: 0
  }),

  getters: {
    /**
     * 获取玩家成就数据对象（从 gameStore.player.achievement 读取）
     * 注意：此 getter 需要在组件中传入 gameStore 使用，
     * 此处仅作为占位，实际使用 achievementsStore.getAchievementData(gameStore)
     */
  },

  actions: {
    /**
     * 从 gameStore 获取玩家成就数据对象
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {Object} 成就数据 { progress, completedLevels, unlockedTitles, currentTitle }
     */
    getAchievementData (gameStore) {
      const data = gameStore?.player?.achievement
      if (!data || typeof data !== 'object') {
        return { progress: {}, completedLevels: {}, unlockedTitles: [], currentTitle: null }
      }
      // 确保结构完整
      return {
        progress: data.progress || {},
        completedLevels: data.completedLevels || {},
        unlockedTitles: Array.isArray(data.unlockedTitles) ? data.unlockedTitles : [],
        currentTitle: data.currentTitle || null,
        unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : [],
        currentBadge: data.currentBadge || null
      }
    },

    /**
     * 获取成就分类列表
     * @returns {Array} 分类配置数组
     */
    getCategories () {
      return ACHIEVEMENT_CATEGORIES
    },

    /**
     * 获取各分类的成就数量
     * @returns {Record<string, number>}
     */
    getCategoryCounts () {
      return achievementService.getCategoryCounts()
    },

    /**
     * 获取称号分类的总数量
     * @returns {number}
     */
    getTitleCount () {
      return achievementService.getTotalTitleCount()
    },

    /**
     * 获取总成就数量
     * @returns {number}
     */
    getTotalCount () {
      return achievementService.getTotalCount()
    },

    /**
     * 获取已完成成就数量
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {number}
     */
    getCompletedCount (gameStore) {
      const data = this.getAchievementData(gameStore)
      return Object.values(data.completedLevels || {}).reduce(
        (sum, levels) => sum + (Array.isArray(levels) ? levels.length : 0),
        0
      )
    },

    /**
     * 获取当前分类的成就列表（含进度信息）
     * 进度值封顶到最高等级目标值，避免满级后显示超过最大值的数字
     * @param {Object} gameStore - useGameStore() 实例
     * @param {string} category - 分类 key
     * @returns {Array} 成就列表，每项包含静态数据 + 进度信息
     */
    getAchievementsByCategory (gameStore, category) {
      const list = achievementService.getByCategory(category)
      const data = this.getAchievementData(gameStore)

      return list.map((ach) => {
        const rawProgress = achievementService.getProgress(data, ach.id)
        // 封顶显示进度：不超过最高等级的目标值（处理历史溢出数据）
        const maxLevelValue = ach.levels.length > 0
          ? ach.levels[ach.levels.length - 1].value
          : 0
        const cappedProgress = (maxLevelValue > 0 && rawProgress > maxLevelValue)
          ? maxLevelValue
          : rawProgress

        return {
          ...ach,
          currentProgress: cappedProgress,
          completedLevels: achievementService.getCompletedLevels(data, ach.id)
        }
      })
    },

    /**
     * 获取玩家已解锁的称号列表
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {Object[]} 已解锁称号数组
     */
    getUnlockedTitles (gameStore) {
      const data = this.getAchievementData(gameStore)
      return achievementService.getUnlockedTitles(data)
    },

    /**
     * 获取当前装备的称号
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {string|null}
     */
    getCurrentTitle (gameStore) {
      const data = this.getAchievementData(gameStore)
      return data.currentTitle
    },

    getDefaultAchievementData () {
      return { progress: {}, completedLevels: {}, unlockedTitles: [], currentTitle: null, unlockedBadges: [], currentBadge: null }
    },

    /**
     * 获取玩家已解锁的徽章列表
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {Object[]} 已解锁徽章数组
     */
    getUnlockedBadges (gameStore) {
      const data = this.getAchievementData(gameStore)
      return achievementService.getUnlockedBadges(data)
    },

    /**
     * 获取当前装备的徽章
     * @param {Object} gameStore - useGameStore() 实例
     * @returns {string|null} 当前徽章的 badgeReward 文件名
     */
    getCurrentBadge (gameStore) {
      const data = this.getAchievementData(gameStore)
      return achievementService.getCurrentBadge(data)
    },

    /**
     * 装备徽章（设置当前显示的徽章）
     * @param {Object} gameStore - useGameStore() 实例
     * @param {string|null} badgeReward - 徽章文件名，null 表示取消
     * @returns {void}
     */
    equipBadge (gameStore, badgeReward) {
      const player = gameStore?.player
      if (!player?.achievement) return

      player.achievement.currentBadge = badgeReward || null
      this.version++

      // 持久化
      achievementService.persistAchievement(gameStore)
    },

    /**
     * 获取成就类型的中文标签
     * @param {string} type - 成就类型 key
     * @returns {string}
     */
    getTypeLabel (type) {
      return ACHIEVEMENT_TYPE_LABELS[type] || type
    },

    // ==================== 进度更新 Actions ====================

    /**
     * 记录游戏事件，自动匹配相关成就并更新进度
     *
     * 用途/业务意图：战斗系统击杀怪物时调用 recordEvent('killmonster', { monsterId, count })
     * 背包系统使用物品时调用 recordEvent('useitem', { itemId, count })
     * Service 自动找到匹配的成就，更新进度并检查等级完成、解锁称号
     *
     * @param {Object} gameStore - useGameStore() 实例
     * @param {string} eventType - 事件类型（如 'killmonster'）
     * @param {Object} payload - 事件载荷（如 { monsterId: 6413, amount: 1 }）
     * @returns {Object} 更新结果 { updated, newlyUnlockedTitles }
     */
    recordEvent (gameStore, eventType, payload = {}) {
      const result = achievementService.recordEvent(gameStore, eventType, payload)
      if (result.updated) {
        this.version++
      }
      return result
    },

    /**
     * 直接设置某成就的进度值（用于绝对值类型成就，如等级、属性值）
     * @param {Object} gameStore - useGameStore() 实例
     * @param {number} achievementId - 成就 ID
     * @param {number} value - 当前进度值
     * @returns {Object} 更新结果
     */
    setProgress (gameStore, achievementId, value) {
      const result = achievementService.setProgress(gameStore, achievementId, value)
      if (result.updated) {
        this.version++
      }
      return result
    },

    /**
     * 累加某成就的进度值
     * @param {Object} gameStore - useGameStore() 实例
     * @param {number} achievementId - 成就 ID
     * @param {number} amount - 增加量
     * @returns {Object} 更新结果
     */
    addProgress (gameStore, achievementId, amount = 1) {
      const result = achievementService.addProgress(gameStore, achievementId, amount)
      if (result.updated) {
        this.version++
      }
      return result
    },

    /**
     * 装备称号（设置当前显示的称号）
     * @param {Object} gameStore - useGameStore() 实例
     * @param {string|null} title - 称号名称，null 表示取消称号
     * @returns {void}
     */
    equipTitle (gameStore, title) {
      const player = gameStore?.player
      if (!player?.achievement) return

      player.achievement.currentTitle = title || null
      this.version++

      // 持久化
      achievementService.persistAchievement(gameStore)
    }
  }
})
