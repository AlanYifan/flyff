/**
 * @file pickuppetSummon.js
 * @description 捡东西宠物（pickuppet）召唤状态管理：维护召唤中标记、倒计时、自动拾取开关。
 * 核心行为：
 * - summon(item)：召唤捡宠，根据 duration 设置倒计时到期时间，开启自动拾取
 * - recall(item?)：召回捡宠，关闭自动拾取（限时倒计时继续走）
 * - isSummoned(item)：判断是否为当前召唤中的捡宠
 * - isAutoLootActive：是否有捡宠处于激活状态（自动拾取开关）
 * - getTimer(key)：获取指定捡宠的倒计时信息（支持多捡宠独立倒计时）
 * 核心设计：
 * - 使用 timers Map 存储每个捡宠的独立倒计时（key 为 uniqueId 归一化后的字符串）
 * - 同一ID不同uniqueId的限时捡宠各自拥有独立倒计时
 * - 召回只暂停自动拾取，限时倒计时继续走直到到期
 * - 再次召唤同一捡宠时接着上次剩余时间继续倒计时
 * @since 2026-06-22
 */
import { defineStore } from 'pinia'

/** 捡东西宠物BUFF唯一标识 */
export const PICKUPPET_BUFF_ID = 'pickuppet_auto_loot'

/**
 * 归一化捡宠唯一标识
 * @param {object|null} item - 背包中的捡宠物品实例
 * @returns {string|null} 归一化后的 key
 */
const normalizePickuppetKey = item => {
  if (!item) return null
  if (item.uniqueId) return String(item.uniqueId)
  if (item.id) return `id:${String(item.id)}`
  return null
}

/**
 * 获取捡宠的持续时间（秒）
 * @param {object} item - 捡宠物品
 * @returns {number} 持续时间（秒），-1 表示永久
 */
const getPickuppetDuration = item => {
  const d = item?.duration
  if (d === undefined || d === null) return -1
  const n = Number(d)
  return Number.isFinite(n) ? n : -1
}

/**
 * 创建一个捡宠计时器记录
 * @param {string} key - 归一化唯一标识
 * @param {object} item - 物品快照
 * @param {number} expiresAt - 到期时间戳（毫秒）
 * @param {number} summonedAt - 召唤时间戳（毫秒）
 * @param {boolean} isSummoned - 是否处于召唤中（true）或已召回（false）
 * @returns {{ key: string, item: object, expiresAt: number, summonedAt: number, isSummoned: boolean }}
 */
const createTimerEntry = (key, item, expiresAt, summonedAt, isSummoned) => ({
  key,
  item: { ...item },
  expiresAt,
  summonedAt,
  isSummoned
})

/**
 * 捡东西宠物召唤状态 Store（Pinia）
 * 用途/业务意图：独立管理捡宠的召唤状态和倒计时，不与 raisedPetSummon 混用。
 * 捡宠与训养宠物的核心区别：
 * - 捡宠有有限持续时间（duration），召唤后倒计时，到期自动召回
 * - 捡宠的核心功能是自动拾取掉落物品
 * - 捡宠无能量系统，无属性加成
 * 核心设计：
 * - 使用 timers Map 支持多个捡宠独立倒计时（相同ID不同uniqueId各自追踪）
 * - 召回（recall）只暂停自动拾取，限时倒计时继续走直到到期
 * - 再次召唤同一捡宠时接着上次剩余时间继续倒计时
 * - 限时捡宠的倒计时直到到期才结束，召回不影响倒计时
 */
export const usePickuppetSummonStore = defineStore('pickuppetSummon', {
  state: () => ({
    /**
     * 所有捡宠计时器记录（Map 结构，key 为归一化唯一标识）
     * 每条记录：{ key, item, expiresAt, summonedAt, isSummoned }
     * - isSummoned=true：当前召唤中（自动拾取激活）
     * - isSummoned=false：已召回但限时倒计时未到期
     */
    timers: {}
  }),

  getters: {
    /** 是否有捡宠处于召唤状态 */
    hasSummoned: state => {
      return Object.values(state.timers).some(t => t.isSummoned)
    },

    /** 当前召唤中的捡宠（取第一个，用于兼容旧逻辑） */
    summonedKey (state) {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      return entry ? entry.key : null
    },

    /** 召唤中的捡宠物品快照 */
    summonedItem (state) {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      return entry ? entry.item : null
    },

    /** 召唤中的捡宠到期时间 */
    expiresAt (state) {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      return entry ? entry.expiresAt : 0
    },

    /** 召唤中的捡宠召唤时间 */
    summonedAt (state) {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      return entry ? entry.summonedAt : 0
    },

    /** 召回中但倒计时未结束的捡宠（取第一个，兼容旧逻辑） */
    pausedKey (state) {
      const entry = Object.values(state.timers).find(t => !t.isSummoned && t.expiresAt > 0)
      return entry ? entry.key : null
    },

    pausedItem (state) {
      const entry = Object.values(state.timers).find(t => !t.isSummoned && t.expiresAt > 0)
      return entry ? entry.item : null
    },

    pausedExpiresAt (state) {
      const entry = Object.values(state.timers).find(t => !t.isSummoned && t.expiresAt > 0)
      return entry ? entry.expiresAt : 0
    },

    pausedSummonedAt (state) {
      const entry = Object.values(state.timers).find(t => !t.isSummoned && t.expiresAt > 0)
      return entry ? entry.summonedAt : 0
    },

    /** 召唤中的捡宠图标路径 */
    summonedIcon: state => {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      const id = Number(entry?.item?.id)
      if (!Number.isFinite(id) || id <= 0) return '/pt/item_icon/default_item.png'
      return `/pt/item_icon/${id}.png`
    },

    /** 召唤中的捡宠名称 */
    summonedName: state => {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      const name = entry?.item?.name
      if (typeof name === 'string' && name) return name
      if (name && typeof name === 'object') return name.cns || name.eng || name.en || '捡宠'
      const id = Number(entry?.item?.id)
      if (Number.isFinite(id) && id > 0) return `捡宠#${id}`
      return '捡宠'
    },

    /** 剩余时间（秒），取召唤中捡宠的，0 表示已到期或永久 */
    remainingSeconds: state => {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      if (!entry || !entry.expiresAt) return 0
      const now = Date.now()
      if (now >= entry.expiresAt) return 0
      return Math.ceil((entry.expiresAt - now) / 1000)
    },

    /** 是否永久型捡宠（召唤中的） */
    isPermanent: state => {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      if (!entry) return false
      return entry.expiresAt === 0
    },

    /** 是否有捡宠处于激活状态（自动拾取开关） */
    isAutoLootActive: state => {
      const entry = Object.values(state.timers).find(t => t.isSummoned)
      if (!entry) return false
      if (!entry.expiresAt) return true // 永久型
      return Date.now() < entry.expiresAt
    },

    /** 格式化剩余时间（格式：2:23:59 或 23:59） */
    formattedRemaining () {
      const seconds = this.remainingSeconds
      if (seconds <= 0) return this.isPermanent ? '永久' : '0:00'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      }
      return `${m}:${s.toString().padStart(2, '0')}`
    },

    /**
     * 判断是否有任何限时捡宠处于活跃倒计时状态
     * @returns {boolean}
     */
    isTimedPickuppetActive () {
      return Object.values(this.timers).some(t => t.expiresAt > 0 && Date.now() < t.expiresAt)
    },

    /**
     * 获取当前所有活跃的限时捡宠中最晚的到期时间
     * 兼容旧逻辑：用于只有一个捡宠场景
     */
    activeExpiresAt (state) {
      let latest = 0
      for (const t of Object.values(state.timers)) {
        if (t.expiresAt > 0 && t.expiresAt > latest) {
          latest = t.expiresAt
        }
      }
      return latest
    },

    /**
     * 判断给定物品是否为当前活跃的限时捡宠（召唤中或召回中倒计时未结束）
     * @param {object} item - 物品实例
     * @returns {boolean}
     */
    isActiveTimedPickuppet (item) {
      const key = normalizePickuppetKey(item)
      if (!key) return false
      const entry = this.timers[key]
      if (!entry || entry.expiresAt <= 0) return false
      return Date.now() < entry.expiresAt
    },

    /**
     * 获取所有活跃（召唤中或倒计时未到期）的捡宠计时器列表
     * @returns {Array<{ key: string, item: object, expiresAt: number, summonedAt: number, isSummoned: boolean }>}
     */
    activeTimers (state) {
      const now = Date.now()
      return Object.values(state.timers).filter(t => {
        // 召唤中的（无论限时还是永久）
        if (t.isSummoned) return true
        // 已召回但限时倒计时未到期
        if (t.expiresAt > 0 && now < t.expiresAt) return true
        return false
      })
    },

    /**
     * 获取所有已到期的捡宠计时器列表（用于到期清理）
     * @returns {Array<{ key: string, item: object, expiresAt: number, summonedAt: number, isSummoned: boolean }>}
     */
    expiredTimers (state) {
      const now = Date.now()
      return Object.values(state.timers).filter(t => {
        // 限时且已到期
        if (t.expiresAt > 0 && now >= t.expiresAt) return true
        return false
      })
    }
  },

  actions: {
    /**
     * 获取指定捡宠的计时器记录
     * @param {string} key - 归一化唯一标识
     * @returns {{ key: string, item: object, expiresAt: number, summonedAt: number, isSummoned: boolean } | null}
     */
    getTimer (key) {
      return this.timers[key] || null
    },

    /**
     * 获取指定物品的到期时间戳
     * @param {object} item - 物品实例
     * @returns {number} 到期时间戳（毫秒），0 表示无倒计时
     */
    getExpiresAtByItem (item) {
      const key = normalizePickuppetKey(item)
      if (!key) return 0
      const entry = this.timers[key]
      return entry ? entry.expiresAt : 0
    },

    /**
     * 判断给定物品是否为当前召唤中的捡宠
     * @param {object} item - 物品实例
     * @returns {boolean}
     */
    isSummoned (item) {
      const key = normalizePickuppetKey(item)
      if (!key) return false
      const entry = this.timers[key]
      return Boolean(entry && entry.isSummoned)
    },

    /**
     * 召唤捡东西宠物
     * 限时捡宠：如果之前被召回但倒计时未到期，接着上次剩余时间继续倒计时
     * @param {object} item - 背包中的捡宠物品实例
     * @returns {{ success: boolean, message: string }} 召唤结果
     */
    summon (item) {
      const key = normalizePickuppetKey(item)
      if (!key) {
        return { success: false, message: '无法识别该宠物' }
      }

      // 如果已有其他捡宠召唤中，先召回它们（同一时间只能有一个召唤中的捡宠提供自动拾取）
      for (const [timerKey, timer] of Object.entries(this.timers)) {
        if (timer.isSummoned && timerKey !== key) {
          this.recallByKey(timerKey)
        }
      }

      const duration = getPickuppetDuration(item)
      const now = Date.now()

      // 检查是否已有该捡宠的计时记录（召回后重新召唤）
      const existing = this.timers[key]
      let expiresAt = 0

      if (duration > 0) {
        if (existing && existing.expiresAt > 0 && now < existing.expiresAt) {
          // 接着上次剩余时间继续倒计时
          expiresAt = existing.expiresAt
        } else {
          expiresAt = now + duration * 1000
        }
      }
      // else: 永久型，expiresAt 保持 0

      // 创建或更新计时器记录
      this.timers[key] = createTimerEntry(key, item, expiresAt, now, true)

      return { success: true, message: '召唤成功' }
    },

    /**
     * 召回捡东西宠物（按 key）
     * 限时捡宠：召回只暂停自动拾取，倒计时继续走直到到期
     * @param {string} key - 归一化唯一标识
     */
    recallByKey (key) {
      const entry = this.timers[key]
      if (!entry || !entry.isSummoned) return

      // 标记为已召回，但保留倒计时信息
      entry.isSummoned = false
    },

    /**
     * 召回捡东西宠物（按物品实例）
     * 限时捡宠：召回只暂停自动拾取，倒计时继续走直到到期
     * @param {object} [item] - 要召回的物品实例，不传则召回当前召唤中的
     */
    recall (item) {
      if (item) {
        const key = normalizePickuppetKey(item)
        if (key) {
          this.recallByKey(key)
          return
        }
      }
      // 不传 item 时，召回当前召唤中的（兼容旧逻辑）
      for (const [timerKey, timer] of Object.entries(this.timers)) {
        if (timer.isSummoned) {
          this.recallByKey(timerKey)
          return
        }
      }
    },

    /**
     * 限时捡宠到期后清除指定计时器记录
     * @param {string} key - 归一化唯一标识
     */
    expireByKey (key) {
      delete this.timers[key]
    },

    /**
     * 检查并处理到期：清除所有已到期的限时捡宠计时器
     * 应由定时器定期调用
     * @returns {Array<{ key: string, item: object }>} 已到期的捡宠列表（含物品快照，供外部移除背包物品）
     */
    checkExpiry () {
      const now = Date.now()
      const expired = []
      for (const [key, timer] of Object.entries(this.timers)) {
        if (timer.expiresAt > 0 && now >= timer.expiresAt) {
          expired.push({ key, item: timer.item })
          delete this.timers[key]
        }
      }
      return expired
    },

    /**
     * 从 BUFF 数据恢复捡宠召唤状态
     * 用途：页面刷新后从存档恢复
     * @param {object} petBuff - activeBuffs 中的捡宠BUFF对象
     * @param {Array} playerBag - 玩家背包数组
     * @returns {boolean} 是否恢复成功
     */
    restoreFromBuff (petBuff, playerBag = []) {
      if (!petBuff || typeof petBuff !== 'object') return false

      const meta = petBuff.meta || {}
      const petName = meta.petName || '捡宠'
      const isRecalled = Boolean(petBuff.recalled)
      const restoredExpiresAt = Number(meta.expiresAt) || 0
      const restoredSummonedAt = Number(meta.summonedAt) || 0

      /**
       * 从 BUFF ID 中提取捡宠 key（uniqueId）
       * BUFF ID 格式：pickuppet_auto_loot_<uniqueId>
       * 例如：pickuppet_auto_loot_22173vbkew → 22173vbkew
       */
      const buffId = String(petBuff.id ?? '')
      const keyFromBuffId = buffId.startsWith('pickuppet_auto_loot_')
        ? buffId.slice('pickuppet_auto_loot_'.length)
        : null

      let matchedItem = null

      if (Array.isArray(playerBag) && playerBag.length > 0) {
        if (keyFromBuffId) {
          // 精确匹配：通过 uniqueId 找到对应的背包物品
          // 解决多个相同 ID 捡宠（如3个小怪笑箱）的匹配问题
          matchedItem = playerBag.find(item => {
            if (!item || item.category !== 'pickuppet') return false
            return String(item.uniqueId ?? '') === keyFromBuffId
          })
        }

        // fallback：如果通过 uniqueId 没匹配到，尝试 icon + name 匹配
        if (!matchedItem) {
          const iconIdMatch = petBuff.icon?.match(/\/(\d+)\.png$/)
          const iconId = iconIdMatch ? parseInt(iconIdMatch[1], 10) : null

          matchedItem = playerBag.find(item => {
            if (!item || item.category !== 'pickuppet') return false
            if (iconId && item.id === iconId) return true
            const itemName = item.name?.cns || item.name || ''
            if (itemName && itemName.includes(petName)) return true
            return false
          })
        }
      }

      if (matchedItem) {
        const key = normalizePickuppetKey(matchedItem)
        if (key) {
          this.timers[key] = createTimerEntry(
            key,
            matchedItem,
            restoredExpiresAt,
            restoredSummonedAt,
            !isRecalled
          )
          console.log('[pickuppetSummon] 从BUFF恢复召唤状态成功:', petName, isRecalled ? '(已召回)' : '', 'expiresAt=', restoredExpiresAt)
          return true
        }
      }

      // 使用BUFF数据创建最小化召唤状态（背包中找不到对应物品时）
      const fallbackKey = keyFromBuffId || `buff-restored:${Date.now()}`
      this.timers[fallbackKey] = createTimerEntry(
        fallbackKey,
        {
          id: petBuff.icon?.match(/\/(\d+)\.png$/)?.[1] || 0,
          name: petName,
          icon: petBuff.icon,
          category: 'pickuppet',
          duration: -1
        },
        restoredExpiresAt,
        restoredSummonedAt,
        !isRecalled
      )
      console.log('[pickuppetSummon] 从BUFF恢复召唤状态成功（使用BUFF数据）:', petName, 'expiresAt=', restoredExpiresAt)
      return true
    }
  }
})
