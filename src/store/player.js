/**
 * 玩家数据统一管理 Store
 * 统一管理玩家状态、属性和操作
 */
import { defineStore } from 'pinia'
import { Player } from '@/models/Player'
import { classKeyToNameMap, getClassIconPath } from '@/utils/itemHelpers'
import { clearBuffDuration, clearAllBuffDurations } from '@/composables/useGameLoopManager'
import { MAX_PLAYER_LEVEL } from '@/utils/gameConstants'

export const usePlayerStore = defineStore('player', {
  state: () => ({
    // 玩家数据
    player: new Player(),

    // 玩家状态
    isDead: false,
    isOnline: false,

    // 统计数据
    totalPlayTime: 0,
    totalMonstersKilled: 0,
    totalGoldEarned: 0
  }),

  getters: {
    /**
     * 获取玩家职业中文名
     */
    playerClassName: state => {
      return classKeyToNameMap[state.player.class] || state.player.class
    },

    /**
     * 获取玩家头像路径
     */
    playerAvatar: state => {
      const className = state.player.class?.toLowerCase() || 'beginner'
      return getClassIconPath(className, state.player.sex)
    },

    /**
     * 获取生命值百分比
     */
    healthPercentage: state => {
      if (!state.player.maxHealth || state.player.maxHealth === 0) {
        return 0
      }
      return Math.round((state.player.currentHealth / state.player.maxHealth) * 100)
    },

    /**
     * 获取魔法值百分比
     */
    manaPercentage: state => {
      if (!state.player.maxMana || state.player.maxMana === 0) {
        return 0
      }
      return Math.round((state.player.currentMana / state.player.maxMana) * 100)
    },

    /**
     * 获取经验值百分比
     */
    expPercentage: state => {
      if (!state.player.maxExp || state.player.maxExp === 0) {
        return 0
      }
      return Math.round((state.player.exp / state.player.maxExp) * 100)
    },

    /**
     * 获取可用的属性点
     */
    availableStatPoints: state => {
      return state.player.statPoints || 0
    }
  },

  actions: {
    /**
     * 更新玩家数据
     */
    updatePlayer (updates) {
      Object.assign(this.player, updates)
 
    },

    /**
     * 设置玩家
     */
    setPlayer (playerData) {
      this.player = new Player(playerData)
 
    },

    /**
     * 添加经验
     * @param {number} amount - 获取的经验值
     */
    addExp (amount) {
      // ★ 满级检查：达到最大等级后不再获得经验
      if (this.player.level >= MAX_PLAYER_LEVEL) {
        this.player.exp = 0
        return
      }

      // ★ 大师进阶任务期间：等级达到目标等级后不再获得经验
      const ms = this.player?.masterGradeState
      if (ms?.isActive && ms?.targetLevel && this.player.level >= ms.targetLevel) {
        this.player.exp = 0
        return
      }

      this.player.exp += amount

      // 检查是否升级
      if (this.player.exp >= this.player.maxExp) {
        this.levelUp()
      }

    },

    /**
     * 升级
     */
    levelUp () {
      this.player.level++
      this.player.exp = 0
      this.player.maxExp = Math.floor(this.player.maxExp * 1.1) // 每级经验需求增加10%

      // 恢复生命和魔法
      this.player.currentHealth = this.player.maxHealth
      this.player.currentMana = this.player.maxMana

      // 增加属性点（每级加2点）
      this.player.statPoints += 2
 
    },

    /**
     * 受到伤害
     */
    takeDamage (amount) {
      this.player.currentHealth = Math.max(0, this.player.currentHealth - amount)

      if (this.player.currentHealth === 0) {
        this.isDead = true
      }
 
    },

    /**
     * 恢复生命
     */
    heal (amount) {
      this.player.currentHealth = Math.min(
        this.player.maxHealth,
        this.player.currentHealth + amount
      )
      this.isDead = this.player.currentHealth === 0
    },


    /**
     * 消耗魔法
     */
    consumeMana (amount) {
      const actualConsume = Math.min(this.player.currentMana, amount)
      this.player.currentMana -= actualConsume
 
      return actualConsume
    },

    /**
     * 恢复魔法
     */
    restoreMana (amount) {
      this.player.currentMana = Math.min(this.player.maxMana, this.player.currentMana + amount)
 
    },

    /**
     * 更新金币
     */
    updateGold (amount) {
      this.player.gold += amount

      if (amount > 0) {
        this.totalGoldEarned += amount
      }
 
    },

    /**
     * 分配属性点
     */
    allocateStat (attribute, points = 1) {
      if (this.player.statPoints < points) {
        console.warn('[PlayerStore] 属性点不足')
        return false
      }

      if (this.player.stats[attribute] === undefined) {
        console.warn('[PlayerStore] 无效的属性:', attribute)
        return false
      }

      this.player.stats[attribute] += points
      this.player.statPoints -= points

      // 更新战斗属性
      this.player.calculateStats()
 
      return true
    },

    /**
     * 移除属性点
     */
    removeStat (attribute, points = 1) {
      if (this.player.stats[attribute] === undefined) {
        console.warn('[PlayerStore] 无效的属性:', attribute)
        return false
      }

      if (this.player.stats[attribute] - points < 1) {
        console.warn('[PlayerStore] 属性点不能小于1')
        return false
      }

      this.player.stats[attribute] -= points
      this.player.statPoints += points

      // 更新战斗属性
      this.player.calculateStats()
 
      return true
    },

    /**
     * 装备物品
     */
    equipItem () {
   
      // 装备逻辑由 itemsStore 处理
    },

    /**
     * 卸下装备
     */
    unequipItem () {
  
      // 装备逻辑由 itemsStore 处理
    },

    /**
     * 添加 BUFF
     */
    addBuff (buff) {
      this.player.activeBuffs.push(buff)
 
    },

    /**
     * 移除 BUFF
     * @param {string|number} buffId - BUFF ID
     */
    removeBuff (buffId) {
      const index = this.player.activeBuffs.findIndex(buff => buff.id === buffId)
      if (index !== -1) {
        this.player.activeBuffs.splice(index, 1)
        // 同步清除 buffDurations Map 中的缓存
        clearBuffDuration(buffId)
      }
    },

    /**
     * 清除所有 BUFF
     */
    clearAllBuffs () {
      this.player.activeBuffs = []
      // 同步清除 buffDurations Map 中的所有缓存
      clearAllBuffDurations()
    },

    /**
     * 复活
     */
    resurrect () {
      this.player.currentHealth = this.player.maxHealth
      this.player.currentMana = Math.floor(this.player.maxMana * 0.5) // 复活后恢复50%魔法
      this.isDead = false
 
    },

    /**
     * 设置死亡状态
     */
    setDead (isDead) {
      this.isDead = isDead

      if (isDead) {
        this.player.currentHealth = 0
      }
 
    },

    /**
     * 更新统计数据
     */
    incrementKills () {
      this.totalMonstersKilled++
 
    },

    /**
     * 重置玩家
     */
    resetPlayer () {
      this.player = new Player()
      this.isDead = false
      this.isOnline = false
 
    }
  }
})
