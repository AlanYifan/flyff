/**
 * @file StorageService.js
 * @description 存储服务 - 数据持久化层
 * @description 将玩家数据存储从浏览器localStorage迁移到后端SQLite数据库
 * @description 保持原有方法签名以确保兼容性，内部委托ApiService进行HTTP通信
 * @updated 2026-07-15 emergencySavePendingPatches 新增 _syncWriteSessionCache，页面卸载时同步写入 sessionStorage 作为后端保存失败的备份
 */

import { apiService } from '@/services/ApiService'
import { toRaw } from 'vue'

/** 开发环境标识 */
const isDev = import.meta.env.DEV === true

/**
 * @class StorageService
 * @description 存储服务类，负责玩家数据的持久化管理
 * @description 所有数据操作通过ApiService与Go后端通信，数据存储在SQLite数据库中
 */
export class StorageService {
  constructor () {
    /** 用户设置存储键（仅用于本地非关键数据） */
    this.USER_SETTINGS_KEY = 'userSettings'
    /** 存档槽存储键（兼容旧版本） */
    this.CURRENT_SAVE_SLOT_KEY = 'currentSaveSlot'
    /** 选定职业存储键 */
    this.SELECTED_CLASS_KEY = 'selectedClass'
    /** 技能冷却时间存储键（仅本地使用） */
    this.SKILL_COOLDOWNS_KEY = 'skillCooldowns'
    /** 属性强化数据存储键 */
    this.ENHANCE_ATTRIBUTES_KEY = 'enhanceAttributes'
    /** 会话级存档槽存储键 */
    this.SESSION_SAVE_SLOT_KEY = 'sessionSaveSlot'
  }

  // ==================== 用户数据管理 ====================

  /**
   * 获取用户数据（已迁移到后端，此方法仅做兼容保留）
   * @deprecated 用户数据现在由后端管理，此方法返回基本用户信息
   * @returns {object|null} 用户基本信息
   */
  getUserData () {
    try {
      const username = apiService.getUsername()
      const userId = apiService.getUserId()
      if (!username) {
        console.error('没有登录的用户')
        return null
      }

      return {
        username,
        userId,
        saveSlots: {} // 存档数据现在由后端API独立管理
      }
    } catch (error) {
      console.error('获取用户数据失败:', error)
      return null
    }
  }

  /**
   * 保存用户数据（已迁移到后端，此方法仅做兼容保留）
   * @deprecated 用户数据现在由后端API管理
   * @returns {boolean} 始终返回true
   */
  saveUserData () {
    return true
  }

  /**
   * 获取用户字段（仅用于本地非关键数据，如sessionStorage）
   * @param {string} fieldName 字段名
   * @param {boolean} useSession 是否使用 sessionStorage（默认 false）
   * @returns {any} 字段值
   */
  getUserField (fieldName, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage
      const value = storage.getItem(fieldName)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error(`获取字段 ${fieldName} 失败:`, error)
      return null
    }
  }

  /**
   * 保存用户字段（仅用于本地非关键数据）
   * @param {string} fieldName 字段名
   * @param {any} value 字段值
   * @param {boolean} useSession 是否使用 sessionStorage（默认 false）
   * @returns {boolean} 是否保存成功
   */
  saveUserField (fieldName, value, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage
      storage.setItem(fieldName, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`保存字段 ${fieldName} 失败:`, error)
      return false
    }
  }

  /**
   * 更新用户数据中的特定字段
   * @param {string} field 字段名
   * @param {any} value 字段值
   * @returns {boolean} 是否更新成功
   */
  updateUserField (field, value) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      // 构造补丁对象
      const plainValue = value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value

      if (field.includes('.')) {
        // 嵌套字段路径（如 "stats.strength"）
        const fieldParts = field.split('.')
        const patch = {}
        let current = patch
        for (let i = 0; i < fieldParts.length - 1; i++) {
          current[fieldParts[i]] = {}
          current = current[fieldParts[i]]
        }
        current[fieldParts[fieldParts.length - 1]] = plainValue

        // 同步保存到后端
        this._asyncSavePlayerPatch(currentSaveSlot, patch)
      } else {
        // 顶级字段
        const patch = { [field]: plainValue }
        this._asyncSavePlayerPatch(currentSaveSlot, patch)
      }

      return true
    } catch (error) {
      console.error('更新用户字段失败:', error)
      return false
    }
  }

  // ==================== 存档数据管理 ====================

  /**
   * 获取当前存档数据（同步方法，从本地缓存读取）
   * @returns {object|null} 存档数据
   */
  getCurrentSaveData () {
    try {
      const cachedData = this._getCachedPlayerData()
      if (cachedData) {
        return cachedData
      }
      return null
    } catch (error) {
      console.error('获取当前存档数据失败:', error)
      return null
    }
  }

  /**
   * 从当前存档加载用户设置
   * @returns {object|null} 用户设置
   */
  loadUserSettingsFromCurrentSave () {
    try {
      const saveData = this.getCurrentSaveData()
      if (!saveData || !saveData.userSettings) {
        return null
      }
      return saveData.userSettings
    } catch (error) {
      console.error('从存档加载用户设置失败:', error)
      return null
    }
  }

  /**
   * 保存用户设置到当前存档
   * @param {object} settings 用户设置
   * @returns {boolean} 是否保存成功
   */
  saveUserSettingsToCurrentSave (settings) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        return false
      }

      const plainSettings = settings && typeof settings === 'object'
        ? JSON.parse(JSON.stringify(settings))
        : settings

      // 异步保存到后端
      this._asyncSaveUserSettings(currentSaveSlot, plainSettings || {})
      return true
    } catch (error) {
      console.error('保存用户设置到存档失败:', error)
      return false
    }
  }

  /**
   * 保存当前存档数据
   * @param {object} saveData 存档数据
   * @returns {boolean} 是否保存成功
   */
  saveCurrentSaveData (saveData) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('无法保存存档数据：存档槽不存在')
        return false
      }

      const plainSaveData = JSON.parse(JSON.stringify(saveData))

      // 更新本地缓存
      this._setCachedPlayerData(plainSaveData)

      // 异步保存到后端
      this._asyncSavePlayerData(currentSaveSlot, plainSaveData)
      return true
    } catch (error) {
      console.error('保存当前存档数据失败:', error)
      return false
    }
  }

  /**
   * 保存玩家技能数据
   * @param {object} skills 技能数据
   * @returns {boolean} 是否保存成功
   */
  savePlayerSkills (skills) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('无法保存技能数据：当前存档槽不存在')
        return false
      }

      // 使用 toRaw 剥离响应式代理后再序列化
      const rawSkills = toRaw(skills)
      const plainSkills = rawSkills && typeof rawSkills === 'object'
        ? JSON.parse(JSON.stringify(rawSkills))
        : skills

      // 异步保存技能补丁
      this._asyncSavePlayerPatch(currentSaveSlot, { skills: plainSkills })
      return true
    } catch (error) {
      console.error('保存玩家技能数据失败:', error)
      return false
    }
  }

  // ==================== 技能冷却时间（仅本地） ====================

  /**
   * 保存技能冷却时间（仅本地存储，无需持久化到后端）
   * @param {object} cooldowns 技能冷却时间对象
   * @returns {boolean} 是否保存成功
   */
  saveSkillCooldowns (cooldowns) {
    try {
      // 延迟 localStorage 写入到 idle 回调，避免阻塞主线程
      const jsonStr = JSON.stringify(cooldowns)
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => {
          try { localStorage.setItem(this.SKILL_COOLDOWNS_KEY, jsonStr) } catch (e) { /* ignore */ }
        }, { timeout: 200 })
      } else {
        setTimeout(() => {
          try { localStorage.setItem(this.SKILL_COOLDOWNS_KEY, jsonStr) } catch (e) { /* ignore */ }
        }, 0)
      }
      return true
    } catch (error) {
      console.error('保存技能冷却时间失败:', error)
      return false
    }
  }

  /**
   * 获取技能冷却时间
   * @returns {object|null} 技能冷却时间对象
   */
  getSkillCooldowns () {
    try {
      const data = localStorage.getItem(this.SKILL_COOLDOWNS_KEY)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('获取技能冷却时间失败:', error)
      return null
    }
  }

  // ==================== 属性强化数据 ====================

  /**
   * 保存属性强化数据
   * @param {object} enhanceAttributes 属性强化数据
   * @returns {boolean} 是否保存成功
   */
  saveEnhanceAttributes (enhanceAttributes) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      const plainData = JSON.parse(JSON.stringify(enhanceAttributes))

      // 异步保存到后端
      this._asyncSaveEnhanceAttributes(currentSaveSlot, plainData)
      return true
    } catch (error) {
      console.error('保存属性强化数据失败:', error)
      return false
    }
  }

  /**
   * 获取属性强化数据
   * @returns {object|null} 属性强化数据
   */
  getEnhanceAttributes () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        return null
      }

      // 尝试从本地缓存获取
      const cachedData = this._getCachedEnhanceAttributes()
      return cachedData
    } catch (error) {
      console.error('获取属性强化数据失败:', error)
      return null
    }
  }

  /**
   * 清除属性强化数据
   * @returns {boolean} 是否清除成功
   */
  clearEnhanceAttributes () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        return false
      }

      // 清除本地缓存
      this._setCachedEnhanceAttributes(null)

      // 异步清除后端数据
      this._asyncClearEnhanceAttributes(currentSaveSlot)
      return true
    } catch (error) {
      console.error('清除属性强化数据失败:', error)
      return false
    }
  }

  // ==================== 用户认证 ====================

  /**
   * 创建新用户（已迁移到后端，通过ApiService.register实现）
   * @deprecated 请使用 apiService.register()
   * @returns {boolean} 始终返回false，提示使用API
   */
  createNewUser () {
    console.warn('[StorageService] createNewUser 已弃用，请使用 apiService.register()')
    return false
  }

  /**
   * 验证用户登录（已迁移到后端，通过ApiService.login实现）
   * @deprecated 请使用 apiService.login()
   * @returns {boolean} 始终返回false，提示使用API
   */
  validateUser () {
    console.warn('[StorageService] validateUser 已弃用，请使用 apiService.login()')
    return false
  }

  // ==================== 角色管理 ====================

  /**
   * 创建新角色存档
   * 优化：移除多余的 _preloadPlayerData 网络请求（initGame 的 loadPlayerData 会自行从后端加载）
   * @param {object} characterData 角色数据
   * @returns {Promise<boolean>} 是否创建成功
   */
  async createNewCharacter (characterData) {
    try {
      // 查找可用存档槽（1次网络请求，比逐个尝试 409 更快）
      const slotsResult = await apiService.getAllSaveSlots()
      if (!slotsResult.success) {
        console.error('无法创建角色：获取存档槽失败')
        return false
      }

      const occupiedSlots = new Set((slotsResult.data || []).map(s => s.slotIndex))
      let saveSlot = null
      for (let i = 0; i < 8; i++) {
        if (!occupiedSlots.has(i)) {
          saveSlot = i
          break
        }
      }

      if (saveSlot === null) {
        console.error('无法创建角色：存档槽已满')
        return false
      }

      const nicknameRaw = typeof characterData?.nickname === 'string' ? characterData.nickname : ''
      const normalizedNickname = nicknameRaw.trim()

      const result = await apiService.createCharacter(
        saveSlot,
        normalizedNickname || `新角色${saveSlot + 1}`,
        characterData.class,
        characterData.sex || 'male'
      )

      if (result.success) {
        // 设置当前存档槽
        this.setCurrentSaveSlot(saveSlot)
        // 不再 _preloadPlayerData：initGame 的 loadPlayerData 会自行从后端加载
        return true
      }

      console.error('创建角色失败:', result.message)
      return false
    } catch (error) {
      console.error('创建新角色存档失败:', error)
      return false
    }
  }

  /**
   * 获取所有存档槽信息
   * @returns {Promise<Array>} 存档槽列表
   */
  async getAllSaveSlots () {
    try {
      const result = await apiService.getAllSaveSlots()
      if (!result.success) {
        return []
      }

      return (result.data || []).map(slot => ({
        slot: slot.slotIndex,
        nickname: slot.nickname,
        class: slot.class,
        level: slot.level,
        sex: slot.sex || 'male',
        createdAt: slot.createdAt
      }))
    } catch (error) {
      console.error('获取所有存档槽信息失败:', error)
      return []
    }
  }

  /**
   * 选择存档槽
   * @param {number} slot 存档槽编号
   * @returns {Promise<boolean>} 是否选择成功
   */
  async selectSaveSlot (slot) {
    const startTime = performance.now()
    try {
      console.log(`[StorageService] selectSaveSlot 开始，存档槽: ${slot}`)
      const result = await apiService.selectSaveSlot(slot)
      console.log(`[StorageService] selectSaveSlot API 响应耗时: ${(performance.now() - startTime).toFixed(1)}ms`)

      if (result.success) {
        this.setCurrentSaveSlot(slot)
        // 不预加载玩家数据：Main.vue 的 initGame → loadPlayerData 会自行从后端加载
        // 避免在 Select 页面等待重型数据加载，导致跳转延迟
        console.log(`[StorageService] selectSaveSlot 成功，跳过预加载，由 Main.vue initGame 自行加载`)
        return true
      }
      console.error(`存档槽 ${slot} 不存在`)
      return false
    } catch (error) {
      console.error('[StorageService] selectSaveSlot 失败:', error)
      return false
    }
  }

  /**
   * 删除存档
   * @param {number} slot 存档槽编号
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteSaveSlot (slot) {
    try {
      const result = await apiService.deleteCharacter(slot)
      if (result.success) {
        // 如果删除的是当前存档槽，清空当前存档槽设置
        const currentSaveSlot = this.getCurrentSaveSlot()
        if (currentSaveSlot === slot) {
          sessionStorage.removeItem(this.SESSION_SAVE_SLOT_KEY)
          localStorage.removeItem(this.CURRENT_SAVE_SLOT_KEY)
        }
        // 清除本地缓存
        this._clearCache(slot)
        return true
      }
      console.error(`删除存档槽 ${slot} 失败:`, result.message)
      return false
    } catch (error) {
      console.error('删除存档失败:', error)
      return false
    }
  }

  /**
   * 清除所有数据
   * @returns {boolean} 是否清除成功
   */
  clearAllData () {
    try {
      apiService.clearAuth()
      localStorage.clear()
      sessionStorage.clear()
      this._playerDataCacheMap = {}
      console.log('所有数据已清除')
      return true
    } catch (error) {
      console.error('清除所有数据失败:', error)
      return false
    }
  }

  // ==================== 用户信息 ====================

  /**
   * 设置当前用户（已由ApiService管理）
   * @param {string} username 用户名
   * @returns {boolean} 是否设置成功
   */
  setCurrentUser (username) {
    try {
      apiService.setUsername(username)
      return true
    } catch (error) {
      console.error('设置当前用户失败:', error)
      return false
    }
  }

  /**
   * 获取当前用户
   * @returns {string|null} 当前用户名
   */
  getCurrentUser () {
    return apiService.getUsername()
  }

  /**
   * 获取指定用户的用户数据（已迁移到后端）
   * @deprecated 用户数据现在由后端管理
   * @returns {object|null} null
   */
  getUserDataByUsername () {
    return null
  }

  /**
   * 保存指定用户的用户数据（已迁移到后端）
   * @deprecated 用户数据现在由后端管理
   * @returns {boolean} 始终返回true
   */
  saveUserDataForUsername () {
    return true
  }

  // ==================== 玩家数据读写 ====================

  /**
   * 加载玩家数据（从后端API加载）
   * @returns {Promise<object|null>} 玩家数据
   */
  async loadPlayerData () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return null
      }

      const result = await apiService.getPlayerData(currentSaveSlot)
      if (!result.success) {
        console.error('加载玩家数据失败:', result.message)
        return null
      }

      const playerData = result.data?.data || null

      if (playerData) {
        const nicknameRaw = typeof playerData?.nickname === 'string' ? playerData.nickname.trim() : ''
        if (!nicknameRaw) {
          playerData.nickname = `新角色${Number(currentSaveSlot) + 1}`
        }

        // 更新本地缓存
        this._setCachedPlayerData(playerData)
      }

      return playerData
    } catch (error) {
      console.error('加载玩家数据失败:', error)
      return null
    }
  }

  /**
   * 加载指定存档槽的玩家数据（用于副本组队等跨槽位场景）
   * @param {number} slotIndex 存档槽编号
   * @returns {Promise<object|null>} 玩家数据
   */
  async loadPlayerDataBySlot (slotIndex) {
    try {
      if (slotIndex === null || slotIndex === undefined) return null

      const result = await apiService.getPlayerData(slotIndex)
      if (!result.success) {
        console.error(`[StorageService] 加载存档槽 ${slotIndex} 数据失败:`, result.message)
        return null
      }

      return result.data?.data || null
    } catch (error) {
      console.error(`[StorageService] 加载存档槽 ${slotIndex} 数据失败:`, error)
      return null
    }
  }

  /**
   * 保存数据补丁到指定存档槽（用于副本中保存队友数据）
   * @param {number} slotIndex 存档槽编号
   * @param {object} patch 需要更新的字段集合
   * @param {number} [timeout=null] 自定义请求超时时间（毫秒），null 时使用默认值
   * @returns {Promise<boolean>} 是否保存成功
   */
  async savePlayerPatchBySlot (slotIndex, patch, timeout = null) {
    try {
      if (slotIndex === null || slotIndex === undefined) return false

      const result = await apiService.savePlayerPatch(slotIndex, patch, timeout)
      return result.success
    } catch (error) {
      console.error(`[StorageService] 保存存档槽 ${slotIndex} 数据失败:`, error)
      return false
    }
  }

  /**
   * 保存玩家数据
   * @param {object} playerData 玩家数据
   * @returns {boolean} 是否保存成功
   */
  savePlayerData (playerData) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      // 使用 toRaw 剥离 Vue 响应式代理，然后浅拷贝以避免修改原始对象
      // 不再使用 JSON.parse(JSON.stringify()) 深拷贝——嵌套对象仍为原始引用，
      // 序列化交给 _setCachedPlayerData (requestIdleCallback) 和 _asyncSavePlayerPatch (10s防抖)
      const rawPlayerData = toRaw(playerData)
      const plainPlayerData = { ...rawPlayerData }

      // 清理临时计算属性（浅拷贝上删除，不影响原始对象）
      const computedPropertiesToExclude = [
        'fireAttack', 'waterAttack', 'windAttack', 'thunderAttack', 'earthAttack',
        'fireDefense', 'waterDefense', 'windDefense', 'earthDefense', 'thunderDefense',
        'bowAttack', 'yoyoAttack', 'axeAttack', 'swordAttack',
        'stun', 'pveDamage', 'pveDamageReduction', 'criticalResistance',
        'blockPenetration', 'mpRecoveryAfterKill', 'hpRecoveryAfterKill',
        'equipmentBonuses', 'tempStats', 'decreasedCastingTime',
        // _isPlayer 是运行时标记，不应保存到存档
        // 否则角色作为队员加载时会继承此标记，导致 recalculateMemberStats 误判
        '_isPlayer'
      ]

      for (const prop of computedPropertiesToExclude) {
        if (Object.prototype.hasOwnProperty.call(plainPlayerData, prop)) {
          delete plainPlayerData[prop]
        }
      }

      // 更新本地缓存（sessionStorage 写入已延迟到 requestIdleCallback）
      this._setCachedPlayerData(plainPlayerData)

      // 异步保存到后端（10s 防抖，无需同步序列化）
      this._asyncSavePlayerPatch(currentSaveSlot, plainPlayerData)

      return true
    } catch (error) {
      console.error('保存玩家数据失败:', error)
      return false
    }
  }

  /**
   * 保存玩家数据补丁（Patch，补丁式更新）
   * @param {object} patch 需要写入的字段集合
   * @returns {boolean} 是否保存成功
   */
  savePlayerPatch (patch) {
    try {
      if (!patch || typeof patch !== 'object') {
        console.error('[StorageService] 保存补丁失败：patch 无效')
        return false
      }

      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      // 更新本地缓存
      const cachedData = this._getCachedPlayerData() || {}
      const mergedData = { ...cachedData, ...patch }

      if (cachedData.equipment && patch.equipment) {
        mergedData.equipment = { ...cachedData.equipment, ...patch.equipment }
      }
      if (cachedData.stats && patch.stats) {
        mergedData.stats = { ...cachedData.stats, ...patch.stats }
      }

      this._setCachedPlayerData(mergedData)

      // 异步保存补丁到后端
      this._asyncSavePlayerPatch(currentSaveSlot, patch)
      return true
    } catch (error) {
      console.error('[StorageService] 保存玩家补丁数据失败:', error)
      return false
    }
  }

  // ==================== 钻石 ====================

  /**
   * 保存玩家钻石到当前存档
   * @param {number} diamonds 钻石数量
   * @returns {boolean} 是否保存成功
   */
  savePlayerDiamonds (diamonds) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      // 更新本地缓存中的钻石数量
      const cachedData = this._getCachedPlayerData()
      if (cachedData) {
        cachedData.diamonds = Number(diamonds)
        this._setCachedPlayerData(cachedData)
      }

      // 异步保存到后端
      this._asyncSavePlayerDiamonds(currentSaveSlot, diamonds)
      return true
    } catch (error) {
      console.error('保存玩家钻石失败:', error)
      return false
    }
  }

  // ==================== 属性点 ====================

  /**
   * 保存玩家属性点到当前存档的stats字段
   * @param {object} stats 属性点对象
   * @returns {boolean} 是否保存成功
   */
  savePlayerStats (stats) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('当前存档槽不存在')
        return false
      }

      // 更新本地缓存
      const cachedData = this._getCachedPlayerData()
      if (cachedData) {
        cachedData.stats = { ...stats }
        this._setCachedPlayerData(cachedData)
      }

      // 异步保存到后端
      this._asyncSavePlayerPatch(currentSaveSlot, { stats: { ...stats } })
      return true
    } catch (error) {
      console.error('保存玩家属性点失败:', error)
      return false
    }
  }

  // ==================== 副本进度 ====================

  /**
   * 副本进度在 localStorage 中的 key 前缀
   */
  static DUNGEON_PROGRESS_LS_PREFIX = 'flyff_dungeon_progress_';

  /**
   * 保存副本进度数据
   * @param {object} dungeonData 副本数据
   * @returns {boolean} 是否保存成功
   */
  saveDungeonProgress (dungeonData) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('[StorageService] 当前存档槽不存在')
        return false
      }

      // 精简保存的数据
      const simplifiedData = {
        dungeonId: dungeonData.dungeonId,
        difficulty: dungeonData.difficulty,
        currentStageIndex: dungeonData.currentStageIndex,
        currentStageKills: dungeonData.currentStageKills,
        totalKills: dungeonData.totalKills,
        remainingSeconds: dungeonData.remainingSeconds,
        savedAt: Date.now(),
        monsters: dungeonData.monsters ? dungeonData.monsters.map(m => ({
          uid: m.uid, id: m.id, monsterId: m.monsterId, name: m.name,
          icon: m.icon, currentHealth: m.currentHealth, maxHealth: m.maxHealth,
          rank: m.rank, level: m.level, element: m.element
        })) : [],
        teamMembers: dungeonData.teamMembers ? dungeonData.teamMembers.map(m => ({
          slotId: m.slotId, nickname: m.nickname, level: m.level,
          currentHealth: m.currentHealth, maxHealth: m.maxHealth,
          currentMana: m.currentMana, maxMana: m.maxMana,
          activeBuffs: m.activeBuffs || [], exp: m.exp, gold: m.gold
        })) : [],
        player: dungeonData.player ? {
          currentHealth: dungeonData.player.currentHealth,
          maxHealth: dungeonData.player.maxHealth,
          currentMana: dungeonData.player.currentMana,
          maxMana: dungeonData.player.maxMana,
          activeBuffs: dungeonData.player.activeBuffs || [],
          exp: dungeonData.player.exp, gold: dungeonData.player.gold
        } : null,
        pendingLootItems: dungeonData.pendingLootItems || [],
        currentLootItem: dungeonData.currentLootItem || null,
        showLootPanel: dungeonData.showLootPanel || false,
        dungeonCompleted: dungeonData.dungeonCompleted || false
      }

      // 同步保存到 localStorage（作为备份，确保 beforeunload 时数据不丢失）
      try {
        const lsKey = `${StorageService.DUNGEON_PROGRESS_LS_PREFIX}${currentSaveSlot}`
        localStorage.setItem(lsKey, JSON.stringify(simplifiedData))
      } catch (lsError) {
        console.error('[StorageService] localStorage 保存副本进度失败:', lsError)
      }

      // 异步保存到后端
      this._asyncSaveDungeonProgress(currentSaveSlot, simplifiedData)
      return true
    } catch (error) {
      console.error('[StorageService] 保存副本进度失败:', error)
      return false
    }
  }

  /**
   * 加载副本进度数据
   * 优先从后端加载，如果后端失败则从 localStorage 备份加载
   * @returns {Promise<object|null>} 副本数据
   */
  async loadDungeonProgress () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('[StorageService] 当前存档槽不存在')
        return null
      }

      // 1. 优先从后端加载
      const result = await apiService.loadDungeonProgress(currentSaveSlot)
      if (result.success && result.data) {
        // 同步更新 localStorage 备份
        try {
          const lsKey = `${StorageService.DUNGEON_PROGRESS_LS_PREFIX}${currentSaveSlot}`
          localStorage.setItem(lsKey, JSON.stringify(result.data))
        } catch (lsError) {
          // 忽略 localStorage 写入错误
        }
        return result.data
      }

      // 2. 后端无数据，尝试从 localStorage 备份加载
      try {
        const lsKey = `${StorageService.DUNGEON_PROGRESS_LS_PREFIX}${currentSaveSlot}`
        const lsData = localStorage.getItem(lsKey)
        if (lsData) {
          const parsed = JSON.parse(lsData)
          if (parsed && parsed.dungeonId) {
            return parsed
          }
        }
      } catch (lsError) {
        console.error('[StorageService] localStorage 加载副本进度失败:', lsError)
      }

      return null
    } catch (error) {
      console.error('[StorageService] 加载副本进度失败:', error)
      // 异常时尝试从 localStorage 加载
      try {
        const currentSaveSlot = this.getCurrentSaveSlot()
        if (currentSaveSlot !== null) {
          const lsKey = `${StorageService.DUNGEON_PROGRESS_LS_PREFIX}${currentSaveSlot}`
          const lsData = localStorage.getItem(lsKey)
          if (lsData) {
            const parsed = JSON.parse(lsData)
            if (parsed && parsed.dungeonId) {
              return parsed
            }
          }
        }
      } catch (lsError) {
        // 忽略
      }
      return null
    }
  }

  /**
   * 清除副本进度数据
   * 同时清除 localStorage 备份和后端数据
   * @returns {boolean} 是否清除成功
   */
  clearDungeonProgress () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) {
        console.error('[StorageService] 当前存档槽不存在')
        return false
      }

      // 同步清除 localStorage 备份
      try {
        const lsKey = `${StorageService.DUNGEON_PROGRESS_LS_PREFIX}${currentSaveSlot}`
        localStorage.removeItem(lsKey)
      } catch (lsError) {
        // 忽略 localStorage 错误
      }

      // 异步清除后端数据
      this._asyncClearDungeonProgress(currentSaveSlot)
      return true
    } catch (error) {
      console.error('[StorageService] 清除副本进度失败:', error)
      return false
    }
  }

  // ==================== 存档槽管理 ====================

  /**
   * 设置当前存档槽（使用sessionStorage，每个标签页独立）
   * @param {number} slot 存档槽编号
   * @returns {boolean} 是否设置成功
   */
  setCurrentSaveSlot (slot) {
    return this.saveUserField(this.SESSION_SAVE_SLOT_KEY, slot, true)
  }

  /**
   * 获取当前存档槽（优先从sessionStorage获取）
   * @returns {number|null} 存档槽编号
   */
  getCurrentSaveSlot () {
    const sessionSlot = this.getUserField(this.SESSION_SAVE_SLOT_KEY, true)
    if (sessionSlot !== null) {
      return sessionSlot
    }
    return this.getUserField(this.CURRENT_SAVE_SLOT_KEY, false)
  }

  // ==================== 工具方法 ====================

  /**
   * 将对象转换为普通对象，处理响应式对象和循环引用
   * @param {any} obj 要转换的对象
   * @returns {any} 普通对象
   */
  _convertToPlainObject (obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return obj
    }

    if (obj instanceof Array) {
      return obj.map(item => this._convertToPlainObject(item))
    }

    const result = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          result[key] = this._convertToPlainObject(obj[key])
        } catch (e) {
          console.warn(`跳过无法序列化的属性: ${key}`, e)
          result[key] = '[UNSERIALIZABLE]'
        }
      }
    }

    return result
  }

  // ==================== 本地缓存管理 ====================

  /**
   * 获取本地缓存的玩家数据
   * @returns {object|null} 缓存的玩家数据
   * @private
   */
  _getCachedPlayerData () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) return null

      // 优先从内存缓存读取（同步可用，不受 requestIdleCallback 延迟影响）
      const memCached = this._playerDataCacheMap[currentSaveSlot]
      if (memCached !== undefined) {
        return memCached
      }

      // 内存缓存未命中，回退到 sessionStorage
      const cacheKey = `flyff_player_cache_${currentSaveSlot}`
      const data = sessionStorage.getItem(cacheKey)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * 设置本地缓存的玩家数据（延迟序列化和写入 sessionStorage，避免阻塞主线程）
   * @param {object} data 玩家数据
   * @private
   */
  _setCachedPlayerData (data) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) return

      // 同步写入内存缓存，确保 _getCachedPlayerData 可立即读取
      // 解决 requestIdleCallback 延迟写入 sessionStorage 期间的竞态条件
      this._playerDataCacheMap[currentSaveSlot] = data ?? null

      const cacheKey = `flyff_player_cache_${currentSaveSlot}`
      // 将 JSON.stringify + sessionStorage.setItem 全部延迟到 requestIdleCallback
      // 避免同步序列化和磁盘 IO 阻塞当前帧
      const writeSession = () => {
        try {
          const jsonStr = JSON.stringify(data)
          sessionStorage.setItem(cacheKey, jsonStr)
        } catch (error) {
          console.error('[StorageService] sessionStorage.setItem 失败:', error)
        }
      }
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(writeSession, { timeout: 200 })
      } else {
        setTimeout(writeSession, 0)
      }
    } catch (error) {
      console.error('[StorageService] 更新本地缓存失败:', error)
    }
  }

  /**
   * 获取本地缓存的属性强化数据
   * @returns {object|null} 缓存的属性强化数据
   * @private
   */
  _getCachedEnhanceAttributes () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) return null

      const cacheKey = `flyff_enhance_cache_${currentSaveSlot}`
      const data = sessionStorage.getItem(cacheKey)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * 设置本地缓存的属性强化数据
   * @param {object|null} data 属性强化数据
   * @private
   */
  _setCachedEnhanceAttributes (data) {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) return

      const cacheKey = `flyff_enhance_cache_${currentSaveSlot}`
      if (data === null) {
        sessionStorage.removeItem(cacheKey)
      } else {
        sessionStorage.setItem(cacheKey, JSON.stringify(data))
      }
    } catch (error) {
      console.error('[StorageService] 更新属性强化缓存失败:', error)
    }
  }

  /**
   * 清除指定存档槽的缓存
   * @param {number} slotIndex 存档槽编号
   * @private
   */
  _clearCache (slotIndex) {
    try {
      // 清除内存缓存
      delete this._playerDataCacheMap[slotIndex]
      sessionStorage.removeItem(`flyff_player_cache_${slotIndex}`)
      sessionStorage.removeItem(`flyff_enhance_cache_${slotIndex}`)
    } catch {
      // 忽略清除缓存错误
    }
  }

  /**
   * 预加载存档数据到本地缓存
   * @param {number} slotIndex 存档槽编号
   * @private
   */
  async _preloadPlayerData (slotIndex) {
    try {
      const result = await apiService.getPlayerData(slotIndex)
      if (result.success && result.data?.data) {
        const cacheKey = `flyff_player_cache_${slotIndex}`
        sessionStorage.setItem(cacheKey, JSON.stringify(result.data.data))
      }
    } catch (error) {
      console.error('[StorageService] 预加载存档数据失败:', error)
    }
  }

  // ==================== 异步保存方法（带防抖） ====================

  /** 保存防抖定时器 */
  _saveDebounceTimers = {}

  /**
   * 内存级玩家数据缓存（按存档槽索引键控）
   * 用途：弥补 _setCachedPlayerData 延迟写入 sessionStorage 期间的同步读取空窗
   * @type {Record<number, object|null>}
   * @private
   */
  _playerDataCacheMap = {}

  /**
   * 异步保存玩家完整数据（带防抖，避免频繁请求）
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 玩家数据（已经是浅拷贝+清理后的普通对象）
   * @private
   */
  _asyncSavePlayerData (slotIndex, data) {
    // ★ 统一使用 patch 队列：全量保存转为 patch 保存，避免同一存档槽并发两个保存请求
    // data 已在 savePlayerData 中完成清理，直接传给 _asyncSavePlayerPatch
    this._asyncSavePlayerPatch(slotIndex, data)
  }

  /**
   * 异步保存玩家补丁数据（带防抖）
   * @param {number} slotIndex 存档槽编号
   * @param {object} patch 补丁数据
   * @private
   */
  _asyncSavePlayerPatch (slotIndex, patch) {
    const timerKey = `patch_${slotIndex}`

    // 合并待保存的补丁数据，避免短时间内多次请求
    if (!this._pendingPatches) {
      this._pendingPatches = {}
    }
    if (!this._pendingPatches[timerKey]) {
      this._pendingPatches[timerKey] = {}
    }
    // 浅合并补丁字段（嵌套对象如 equipment/stats 需要深度合并）
    const pending = this._pendingPatches[timerKey]
    for (const key of Object.keys(patch)) {
      if (
        (key === 'equipment' || key === 'stats' || key === 'quest' || key === 'skills') &&
        pending[key] && typeof pending[key] === 'object' && typeof patch[key] === 'object'
      ) {
        pending[key] = { ...pending[key], ...patch[key] }
      } else {
        pending[key] = patch[key]
      }
    }

    if (this._saveDebounceTimers[timerKey]) {
      clearTimeout(this._saveDebounceTimers[timerKey])
    }

    this._saveDebounceTimers[timerKey] = setTimeout(async () => {
      const mergedPatch = this._pendingPatches[timerKey]
      this._pendingPatches[timerKey] = {}

      // 防抖保存带递增超时重试机制，应对自动战斗期间服务端排队导致的超时
      // 第一次 60s、第二次 120s、第三次 180s，三次都失败才报错
      const retryTimeouts = [60000, 120000, 180000]
      for (let attempt = 0; attempt < retryTimeouts.length; attempt++) {
        try {
          const result = await apiService.savePlayerPatch(slotIndex, mergedPatch, retryTimeouts[attempt])
          if (result.success) {
            break
          }
          if (attempt < retryTimeouts.length - 1) {
            console.warn(`[StorageService] 防抖保存第${attempt + 1}次失败（超时${retryTimeouts[attempt] / 1000}s），重试中...`)
          } else {
            console.error('[StorageService] 防抖保存失败（已重试3次）:', result.message)
            // 重试全部失败，将补丁放回待保存队列，由后续防抖或 beforeunload 兜底
            this._pendingPatches[timerKey] = { ...this._pendingPatches[timerKey], ...mergedPatch }
          }
        } catch (error) {
          console.error(`[StorageService] 防抖保存异常（第${attempt + 1}次）:`, error)
          if (attempt < retryTimeouts.length - 1) {
            // 超时后直接重试，不再额外等待
          } else {
            // 重试全部失败，将补丁放回待保存队列
            this._pendingPatches[timerKey] = { ...this._pendingPatches[timerKey], ...mergedPatch }
          }
        }
      }
    }, 10000) // 10000ms防抖：合并短时间内的多次保存请求，降低服务端压力
  }

  /**
   * 立即发送所有待保存的防抖补丁到后端（异步，带重试）
   * 用于签到等关键操作后立即持久化，避免防抖延迟期间刷新页面导致数据丢失
   * 内置网络错误重试机制（最多3次），应对 Vite 代理连接复用导致的 ECONNRESET 瞬断
   * @returns {Promise<boolean>} 是否全部发送成功
   */
  async flushPendingPatches () {
    try {
      const currentSaveSlot = this.getCurrentSaveSlot()
      if (currentSaveSlot === null) return false

      const timerKey = `patch_${currentSaveSlot}`
      const pendingPatch = this._pendingPatches?.[timerKey]
      if (!pendingPatch || Object.keys(pendingPatch).length === 0) {
        return true
      }

      // 取消防抖定时器，清空待保存队列
      if (this._saveDebounceTimers?.[timerKey]) {
        clearTimeout(this._saveDebounceTimers[timerKey])
        delete this._saveDebounceTimers[timerKey]
      }
      this._pendingPatches[timerKey] = {}

      // 立即异步发送补丁到后端，带递增超时重试机制
      // 自动战斗期间服务端可能因排队导致超时，递增超时给服务端更多处理时间
      // 第一次 60s、第二次 120s、第三次 180s，三次都失败才报错
      const retryTimeouts = [60000, 120000, 180000]
      for (let attempt = 0; attempt < retryTimeouts.length; attempt++) {
        const result = await apiService.savePlayerPatch(currentSaveSlot, pendingPatch, retryTimeouts[attempt])
        if (result.success) {
          return true
        }
        // 非最后一次重试时，直接重试（超时已消耗足够时间）
        if (attempt < retryTimeouts.length - 1) {
          console.warn(`[StorageService] flushPendingPatches 第${attempt + 1}次保存失败（超时${retryTimeouts[attempt] / 1000}s），重试中...`)
        } else {
          console.error('[StorageService] flushPendingPatches 保存失败（已重试3次）:', result.message)
          // 重试全部失败，将补丁放回待保存队列，由后续防抖或 beforeunload 兜底
          this._pendingPatches[timerKey] = { ...this._pendingPatches[timerKey], ...pendingPatch }
          return false
        }
      }
      return false
    } catch (error) {
      console.error('[StorageService] flushPendingPatches 异常:', error)
      return false
    }
  }

  /**
   * 紧急同步保存所有待保存的补丁数据
   * 页面关闭（beforeunload/pagehide）时调用，绕过防抖直接发送
   * 使用同步 XMLHttpRequest 确保请求在页面卸载前完成
   * @param {object} [currentPlayerData] - 当前玩家数据（可选，优先于缓存）
   * @returns {boolean} 是否成功提交
   */
  emergencySavePendingPatches (currentPlayerData) {
    const currentSaveSlot = this.getCurrentSaveSlot()
    if (currentSaveSlot === null) {
      console.warn('[StorageService] 紧急保存跳过：无有效存档槽')
      return false
    }

    console.log('[StorageService] beforeunload 触发，开始紧急保存...')

    const timerKey = `patch_${currentSaveSlot}`

    // 优先使用传入的当前玩家数据（内存中最新的）
    if (currentPlayerData) {
      const plainData = JSON.parse(JSON.stringify(currentPlayerData))
      // 清理临时计算属性
      const computedPropertiesToExclude = [
        'fireAttack', 'waterAttack', 'windAttack', 'thunderAttack', 'earthAttack',
        'fireDefense', 'waterDefense', 'windDefense', 'earthDefense', 'thunderDefense',
        'bowAttack', 'yoyoAttack', 'axeAttack', 'swordAttack',
        'stun', 'pveDamage', 'pveDamageReduction', 'criticalResistance',
        'blockPenetration', 'mpRecoveryAfterKill', 'hpRecoveryAfterKill',
        'equipmentBonuses', 'tempStats'
      ]
      for (const prop of computedPropertiesToExclude) {
        if (Object.prototype.hasOwnProperty.call(plainData, prop)) {
          delete plainData[prop]
        }
      }

      // 合并待保存的补丁数据（防抖中还没发出的）
      const pendingPatch = this._pendingPatches?.[timerKey]
      if (pendingPatch && Object.keys(pendingPatch).length > 0) {
        for (const key of Object.keys(pendingPatch)) {
          plainData[key] = pendingPatch[key]
        }
        // 清除防抖定时器和待保存队列
        if (this._saveDebounceTimers?.[timerKey]) {
          clearTimeout(this._saveDebounceTimers[timerKey])
          delete this._saveDebounceTimers[timerKey]
        }
        this._pendingPatches[timerKey] = {}
      }

      // 同步写入 sessionStorage 作为后端保存失败时的备份
      // 正常情况下 _setCachedPlayerData 通过 requestIdleCallback 延迟写入，
      // 但 beforeunload 时 requestIdleCallback 可能无法执行，因此在此同步写入确保数据不丢失
      this._syncWriteSessionCache(currentSaveSlot, plainData)

      return this._sendBeaconSave(currentSaveSlot, plainData)
    }

    // 没有传入玩家数据，使用待保存的补丁数据
    const pendingPatch = this._pendingPatches?.[timerKey]
    if (!pendingPatch || Object.keys(pendingPatch).length === 0) {
      // 也没有待保存的补丁，尝试从缓存读取完整数据
      const cachedData = this._getCachedPlayerData()
      if (!cachedData) return false

      // 清理临时计算属性
      const computedPropertiesToExclude = [
        'fireAttack', 'waterAttack', 'windAttack', 'thunderAttack', 'earthAttack',
        'fireDefense', 'waterDefense', 'windDefense', 'earthDefense', 'thunderDefense',
        'bowAttack', 'yoyoAttack', 'axeAttack', 'swordAttack',
        'stun', 'pveDamage', 'pveDamageReduction', 'criticalResistance',
        'blockPenetration', 'mpRecoveryAfterKill', 'hpRecoveryAfterKill',
        'equipmentBonuses', 'tempStats'
      ]
      for (const prop of computedPropertiesToExclude) {
        if (Object.prototype.hasOwnProperty.call(cachedData, prop)) {
          delete cachedData[prop]
        }
      }

      // 同步写入 sessionStorage 作为后端保存失败时的备份
      this._syncWriteSessionCache(currentSaveSlot, cachedData)

      return this._sendBeaconSave(currentSaveSlot, cachedData)
    }

    // 有待保存的补丁数据，清除防抖定时器并直接发送
    if (this._saveDebounceTimers?.[timerKey]) {
      clearTimeout(this._saveDebounceTimers[timerKey])
      delete this._saveDebounceTimers[timerKey]
    }

    // 清空待保存队列
    this._pendingPatches[timerKey] = {}

    // 同步写入 sessionStorage 作为后端保存失败时的备份
    this._syncWriteSessionCache(currentSaveSlot, pendingPatch)

    return this._sendBeaconSave(currentSaveSlot, pendingPatch)
  }

  /**
   * 同步写入 sessionStorage 缓存（绕过 requestIdleCallback 延迟）
   * 用途/业务意图：在 beforeunload/pagehide 紧急保存时，requestIdleCallback 可能无法执行，
   * 因此需要同步写入 sessionStorage 确保数据不丢失（作为后端保存失败时的备份）
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 待写入的玩家数据
   * @private
   */
  _syncWriteSessionCache (slotIndex, data) {
    try {
      const cacheKey = `flyff_player_cache_${slotIndex}`
      const jsonStr = JSON.stringify(data)
      sessionStorage.setItem(cacheKey, jsonStr)
      // 同步更新内存缓存
      this._playerDataCacheMap[slotIndex] = data
    } catch (error) {
      console.error('[StorageService] 同步写入 sessionStorage 失败:', error)
    }
  }

  /**
   * 使用同步方式发送紧急保存请求
   * 页面关闭时的保存策略（按优先级）：
   *   1. 同步 XMLHttpRequest（在beforeunload中可靠阻塞，确保请求完成后再关闭页面）
   *   2. navigator.sendBeacon（不支持自定义Header，降级方案）
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 待保存数据
   * @returns {boolean} 是否成功提交到浏览器发送队列
   * @private
   */
  _sendBeaconSave (slotIndex, data) {
    const token = apiService.getToken()
    const payload = JSON.stringify({ slotIndex, data })

    // 构造绝对URL，直连Go后端，绕过Vite代理
    // beforeunload期间Vite代理可能不可靠（代理延迟、连接中断）
    // 开发环境：Vite在3000端口，Go后端在8080端口，直接请求8080
    // 生产环境：前后端同源，使用当前origin
    const baseUrl = isDev ? 'http://localhost:8080' : window.location.origin
    const apiUrl = `${baseUrl}/api/player/save`

    // 方案1：同步 XMLHttpRequest（阻塞，确保请求在页面关闭前到达服务端）
    // 在 beforeunload 中同步 XHR 仍然被主流浏览器支持，会阻塞页面卸载直到请求完成
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', apiUrl, false) // false = 同步，阻塞直到响应返回
      xhr.setRequestHeader('Content-Type', 'application/json')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      xhr.send(payload)

      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[StorageService] 紧急保存成功（同步XHR）')
        return true
      }
      console.warn('[StorageService] 紧急保存响应异常:', xhr.status)
    } catch (xhrError) {
      console.warn('[StorageService] 同步XHR失败，尝试sendBeacon:', xhrError)
    }

    // 方案2：navigator.sendBeacon（不支持自定义Header，最后降级）
    try {
      const blob = new Blob([payload], { type: 'application/json' })
      const queued = navigator.sendBeacon?.(apiUrl, blob)
      if (queued) {
        console.log('[StorageService] 紧急保存已提交（sendBeacon 降级，可能因缺少JWT被服务端拒绝）')
        return true
      }
    } catch (beaconError) {
      console.error('[StorageService] sendBeacon 也失败:', beaconError)
    }

    console.error('[StorageService] 所有紧急保存方案均失败')
    return false
  }

  /**
   * 异步保存属性强化数据
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 属性强化数据
   * @private
   */
  async _asyncSaveEnhanceAttributes (slotIndex, data) {
    try {
      await apiService.saveEnhanceAttributes(slotIndex, data)
    } catch (error) {
      console.error('[StorageService] 异步保存属性强化数据失败:', error)
    }
  }

  /**
   * 异步清除属性强化数据
   * @param {number} slotIndex 存档槽编号
   * @private
   */
  async _asyncClearEnhanceAttributes (slotIndex) {
    try {
      await apiService.clearEnhanceAttributes(slotIndex)
    } catch (error) {
      console.error('[StorageService] 异步清除属性强化数据失败:', error)
    }
  }

  /**
   * 异步保存用户设置
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 用户设置数据
   * @private
   */
  async _asyncSaveUserSettings (slotIndex, data) {
    try {
      await apiService.saveUserSettings(slotIndex, data)
    } catch (error) {
      console.error('[StorageService] 异步保存用户设置失败:', error)
    }
  }

  /**
   * 异步保存钻石数量
   * @param {number} slotIndex 存档槽编号
   * @param {number} diamonds 钻石数量
   * @private
   */
  async _asyncSavePlayerDiamonds (slotIndex, diamonds) {
    try {
      await apiService.savePlayerDiamonds(slotIndex, diamonds)
    } catch (error) {
      console.error('[StorageService] 异步保存钻石数量失败:', error)
    }
  }

  /**
   * 异步保存副本进度
   * @param {number} slotIndex 存档槽编号
   * @param {object} data 副本进度数据
   * @private
   */
  async _asyncSaveDungeonProgress (slotIndex, data) {
    try {
      await apiService.saveDungeonProgress(slotIndex, data)
    } catch (error) {
      console.error('[StorageService] 异步保存副本进度失败:', error)
    }
  }

  /**
   * 异步清除副本进度
   * @param {number} slotIndex 存档槽编号
   * @private
   */
  async _asyncClearDungeonProgress (slotIndex) {
    try {
      await apiService.clearDungeonProgress(slotIndex)
    } catch (error) {
      console.error('[StorageService] 异步清除副本进度失败:', error)
    }
  }
}

// ==================== 全局单例 ====================

/**
 * StorageService 全局单例实例
 * @description 所有模块必须使用此单例，禁止 new StorageService() 创建新实例
 * 防抖定时器和待保存补丁队列存储在实例属性上，多实例会导致防抖失效
 * （每个实例有独立的 _saveDebounceTimers 和 _pendingPatches）
 * @type {StorageService}
 */
export const storageService = new StorageService()
