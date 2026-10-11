/**
 * @file skillBarSlots.js
 * @description 技能栏槽位管理 Store - 管理底部技能栏的技能槽位配置
 * 支持拖拽放入/移除/交换技能，数据持久化到 localStorage
 * 按存档槽位独立存储，每个角色拥有各自的技能栏配置
 * @generated 2026-07-11
 */

import { defineStore } from 'pinia'

/** 技能栏槽位数量 */
export const SKILL_BAR_SLOT_COUNT = 10

/** 旧版全局存储键（用于向后兼容迁移） */
const STORAGE_KEY_LEGACY = 'skillBarSlots'

/** 会话级存档槽存储键（与 StorageService.SESSION_SAVE_SLOT_KEY 一致） */
const SESSION_SAVE_SLOT_KEY = 'sessionSaveSlot'

/** 旧版本地存档槽存储键（与 StorageService.CURRENT_SAVE_SLOT_KEY 一致） */
const CURRENT_SAVE_SLOT_KEY = 'currentSaveSlot'

/**
 * 获取当前存档槽 ID
 * 优先从 sessionStorage 读取，回退到 localStorage
 * @returns {string|null} 存档槽 ID 字符串，或 null
 */
function getCurrentSlotId () {
  try {
    const sessionSlot = sessionStorage.getItem(SESSION_SAVE_SLOT_KEY)
    if (sessionSlot !== null && sessionSlot !== '') {
      return sessionSlot
    }
    const localSlot = localStorage.getItem(CURRENT_SAVE_SLOT_KEY)
    if (localSlot !== null && localSlot !== '') {
      return localSlot
    }
  } catch (error) {
    console.error('[SkillBarSlotsStore] 获取当前存档槽失败:', error)
  }
  return null
}

/**
 * 获取指定存档槽的 localStorage 存储键
 * @param {string|number|null|undefined} slotId - 存档槽 ID
 * @returns {string} 存储键
 */
function getStorageKeyForSlot (slotId) {
  if (slotId === null || slotId === undefined || slotId === '') {
    return STORAGE_KEY_LEGACY
  }
  return `${STORAGE_KEY_LEGACY}_${slotId}`
}

/**
 * 解析槽位数组数据，确保长度和类型合法
 * @param {Array} parsed - 解析后的数组
 * @returns {Array<string|null>} 规范化后的槽位数组
 */
function normalizeSlots (parsed) {
  if (!Array.isArray(parsed)) {
    return new Array(SKILL_BAR_SLOT_COUNT).fill(null)
  }
  const slots = new Array(SKILL_BAR_SLOT_COUNT).fill(null)
  for (let i = 0; i < Math.min(parsed.length, SKILL_BAR_SLOT_COUNT); i++) {
    slots[i] = typeof parsed[i] === 'string' ? parsed[i] : null
  }
  return slots
}

/**
 * 从 localStorage 加载指定存档槽的技能栏数据
 * 支持从旧版全局键向后兼容迁移
 * @param {string|number|null|undefined} slotId - 存档槽 ID
 * @returns {Array<string|null>} 槽位数组，每个元素为技能 ID 或 null
 */
function loadSlotsFromStorageForSlot (slotId) {
  const key = getStorageKeyForSlot(slotId)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return normalizeSlots(JSON.parse(raw))
    }
    // 向后兼容：按槽位存储未找到时，尝试从旧版全局键迁移
    if (key !== STORAGE_KEY_LEGACY) {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY)
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw)
          if (Array.isArray(legacyParsed)) {
            const slots = normalizeSlots(legacyParsed)
            // 迁移数据到新键并删除旧键（仅首次迁移）
            localStorage.setItem(key, JSON.stringify(slots))
            localStorage.removeItem(STORAGE_KEY_LEGACY)
            return slots
          }
        } catch (migrationError) {
          console.error('[SkillBarSlotsStore] 旧版数据迁移失败:', migrationError)
        }
      }
    }
    return new Array(SKILL_BAR_SLOT_COUNT).fill(null)
  } catch (error) {
    console.error('[SkillBarSlotsStore] 加载技能栏槽位数据失败:', error)
    return new Array(SKILL_BAR_SLOT_COUNT).fill(null)
  }
}

/**
 * 从 localStorage 加载已保存的槽位数据（使用当前存档槽）
 * @returns {Array<string|null>} 槽位数组，每个元素为技能 ID 或 null
 */
function loadSlotsFromStorage () {
  return loadSlotsFromStorageForSlot(getCurrentSlotId())
}

/**
 * 将槽位数据保存到 localStorage（使用当前存档槽）
 * @param {Array<string|null>} slots - 槽位数组
 */
function saveSlotsToStorage (slots) {
  try {
    const key = getStorageKeyForSlot(getCurrentSlotId())
    localStorage.setItem(key, JSON.stringify(slots))
  } catch (error) {
    console.error('[SkillBarSlotsStore] 保存技能栏槽位数据失败:', error)
  }
}

/**
 * 从 localStorage 加载指定存档槽的技能栏 ID 集合
 * 供副本页面读取队友技能栏配置使用，不影响当前 Store 状态
 * @param {string|number} slotId - 存档槽 ID
 * @returns {Set<string>} 技能 ID 集合
 */
export function getSkillBarSlotIdsForSlot (slotId) {
  const slots = loadSlotsFromStorageForSlot(slotId)
  const ids = new Set()
  for (let i = 0; i < slots.length; i++) {
    if (slots[i]) {
      ids.add(slots[i])
    }
  }
  return ids
}

/**
 * 从 localStorage 加载指定存档槽的技能栏槽位数组
 * 供副本页面读取队友技能栏配置使用，不影响当前 Store 状态
 * @param {string|number} slotId - 存档槽 ID
 * @returns {Array<string|null>} 槽位数组
 */
export function getSkillBarSlotsForSlot (slotId) {
  return loadSlotsFromStorageForSlot(slotId)
}

export const useSkillBarSlotsStore = defineStore('skillBarSlots', {
  state: () => ({
    /** 技能栏槽位数组，每个元素为技能 ID 或 null（空槽位） */
    slots: loadSlotsFromStorage()
  }),

  getters: {
    /**
     * 获取所有非空槽位的技能 ID 集合
     * @returns {Set<string>} 技能 ID 集合
     */
    activeSlotKeys (state) {
      const ids = new Set()
      for (let i = 0; i < state.slots.length; i++) {
        if (state.slots[i]) {
          ids.add(state.slots[i])
        }
      }
      return ids
    },

    /**
     * 获取所有非空槽位的技能 ID 数组
     * @returns {Array<string>} 技能 ID 数组
     */
    activeSlotKeyList (state) {
      return state.slots.filter(id => id !== null)
    },

    /**
     * 检查指定技能 ID 是否已在技能栏中
     * @returns {function(string): boolean}
     */
    hasSkill (state) {
      return skillId => state.slots.includes(skillId)
    }
  },

  actions: {
    /**
     * 将技能放入指定槽位
     * 如果该技能已在其他槽位中，则从原槽位移除（不允许重复放置）
     * @param {number} index - 槽位索引
     * @param {string} skillId - 技能 ID（全局唯一）
     */
    setSlot (index, skillId) {
      if (index < 0 || index >= SKILL_BAR_SLOT_COUNT) {
        console.warn('[SkillBarSlotsStore] 无效的槽位索引:', index)
        return
      }
      if (!skillId || typeof skillId !== 'string') {
        console.warn('[SkillBarSlotsStore] 无效的技能 ID:', skillId)
        return
      }

      // 如果技能已在其他槽位中，先从原槽位移除
      const existingIndex = this.slots.indexOf(skillId)
      if (existingIndex !== -1 && existingIndex !== index) {
        this.slots[existingIndex] = null
      }

      this.slots[index] = skillId
      this.persist()
    },

    /**
     * 从指定槽位移除技能
     * @param {number} index - 槽位索引
     */
    removeFromSlot (index) {
      if (index < 0 || index >= SKILL_BAR_SLOT_COUNT) {
        return
      }
      this.slots[index] = null
      this.persist()
    },

    /**
     * 交换两个槽位的技能
     * @param {number} fromIndex - 源槽位索引
     * @param {number} toIndex - 目标槽位索引
     */
    swapSlots (fromIndex, toIndex) {
      if (
        fromIndex < 0 || fromIndex >= SKILL_BAR_SLOT_COUNT ||
        toIndex < 0 || toIndex >= SKILL_BAR_SLOT_COUNT ||
        fromIndex === toIndex
      ) {
        return
      }
      const temp = this.slots[fromIndex]
      this.slots[fromIndex] = this.slots[toIndex]
      this.slots[toIndex] = temp
      this.persist()
    },

    /**
     * 清空所有槽位
     */
    clearAll () {
      this.slots = new Array(SKILL_BAR_SLOT_COUNT).fill(null)
      this.persist()
    },

    /**
     * 清除已不存在的技能 ID（职业变更后清理无效槽位）
     * @param {Array<string>} validSkillIds - 当前有效的技能 ID 列表
     */
    purgeInvalidSlots (validSkillIds) {
      if (!Array.isArray(validSkillIds)) {
        return
      }
      const validSet = new Set(validSkillIds)
      let changed = false
      for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i] && !validSet.has(this.slots[i])) {
          this.slots[i] = null
          changed = true
        }
      }
      if (changed) {
        this.persist()
      }
    },

    /**
     * 重新从 localStorage 加载当前存档槽的技能栏数据
     * 在切换角色/存档槽后调用，确保技能栏与当前角色一致
     */
    reloadFromStorage () {
      this.slots = loadSlotsFromStorage()
    },

    /**
     * 持久化到 localStorage
     */
    persist () {
      saveSlotsToStorage(this.slots)
    }
  }
})
