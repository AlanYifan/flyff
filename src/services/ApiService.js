/**
 * @file ApiService.js
 * @description 后端API通信服务
 * @description 封装与Go后端的所有HTTP通信，包括认证、玩家数据CRUD等
 * @description 替代原有的localStorage数据存储方式，实现数据持久化到SQLite
 */

import axios from 'axios'

/** API基础地址，开发环境通过Vite代理转发，生产环境直接访问后端 */
const API_BASE = import.meta.env.DEV ? '/api' : '/api'

/** JWT令牌存储键 */
const TOKEN_KEY = 'flyff_jwt_token'

/** 当前用户ID存储键 */
const USER_ID_KEY = 'flyff_user_id'

/** 当前用户名存储键 */
const USERNAME_KEY = 'flyff_username'

/** GM权限标志存储键 */
const IS_GM_KEY = 'flyff_is_gm'

/** 当前存档槽存储键 */
const SAVE_SLOT_KEY = 'flyff_save_slot'

/** 会话级存档槽存储键 */
const SESSION_SAVE_SLOT_KEY = 'sessionSaveSlot'

/**
 * @class ApiService
 * @description 后端API通信服务类
 * @description 提供用户认证、玩家数据CRUD等接口，内部使用axios发送HTTP请求
 */
export class ApiService {
  constructor () {
    /** axios实例，自动携带JWT令牌和设置超时 */
this.http = axios.create({
baseURL: API_BASE,
timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // 请求拦截器：自动携带JWT令牌
    this.http.interceptors.request.use(
      config => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      error => Promise.reject(error)
    )

    // 响应拦截器：处理401未授权错误和网络断开
    this.http.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // 登录/注册接口的401是业务错误（用户名密码错误），不应触发清除认证和跳转
          const url = error.config?.url || ''
          const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
          if (!isAuthEndpoint) {
            // JWT令牌过期或无效，清除本地令牌
            this.clearAuth()
            // 如果不在登录页面，跳转到登录页面
            if (window.location.pathname !== '/') {
              window.location.href = '/'
            }
          }
        }
        // 注意：不再在 ApiService 中派发 server-disconnected 事件
        // 网络错误（请求超时、连接拒绝等）由 HeartbeatService 统一负责检测
        // 避免因单次请求失败（如保存请求排队超时）误判为服务端断开
        // 心跳服务有连续失败阈值机制，能更准确地判断服务端是否真正离线
        return Promise.reject(error)
      }
    )
  }

  // ==================== 认证相关 ====================

  /**
   * 用户注册
   * @param {string} username - 用户名（3-12个字符）
   * @param {string} password - 密码（6-20个字符）
   * @param {string} [email=''] - 邮箱（可选）
   * @returns {Promise<{success: boolean, message: string, data?: object}>} 注册结果
   */
  async register (username, password, email = '') {
    try {
      const response = await this.http.post('/auth/register', {
        username,
        password,
        email
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '注册失败')
    }
  }

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<{success: boolean, message: string, data?: {token: string, username: string, userId: number}}>} 登录结果
   */
  async login (username, password) {
    try {
      const response = await this.http.post('/auth/login', {
        username,
        password
      })

      if (response.data.success) {
        // 保存JWT令牌和用户信息
        this.setToken(response.data.data.token)
        this.setUserId(response.data.data.userId)
        this.setUsername(response.data.data.username)
        this.setIsGM(response.data.data.isGM)
      }

      return response.data
    } catch (error) {
      return this._handleError(error, '无法连接服务器')
    }
  }

  /**
   * 用户登出，清除本地认证信息
   */
  logout () {
    this.clearAuth()
  }

  /**
   * 检查是否已登录（本地有有效JWT令牌）
   * @returns {boolean} 是否已登录
   */
  isAuthenticated () {
    const token = this.getToken()
    if (!token) return false

    // 简单检查JWT是否过期
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  // ==================== 玩家数据 ====================

  /**
   * 获取玩家数据
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, data?: object}>} 玩家数据
   */
  async getPlayerData (slotIndex) {
    try {
      const response = await this.http.get('/player/data', {
        params: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '获取玩家数据失败')
    }
  }

  /**
   * 保存玩家数据（完整保存）
   * @param {number} slotIndex - 存档槽编号
   * @param {object} data - 完整的玩家数据
   * @param {number} [timeout=null] - 自定义请求超时时间（毫秒），null 时使用默认值
   * @returns {Promise<{success: boolean, message: string}>} 保存结果
   */
  async savePlayerData (slotIndex, data, timeout = null) {
    try {
      const plainData = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data
      const config = timeout ? { timeout } : undefined
      const response = await this.http.post('/player/save', {
        slotIndex,
        data: plainData
      }, config)
      return response.data
    } catch (error) {
      return this._handleError(error, '保存玩家数据失败')
    }
  }

  /**
   * 补丁式更新玩家数据
   * @param {number} slotIndex - 存档槽编号
   * @param {object} patch - 需要更新的字段集合
   * @param {number} [timeout=null] - 自定义请求超时时间（毫秒），null 时使用默认值
   * @returns {Promise<{success: boolean, message: string}>} 更新结果
   */
  async savePlayerPatch (slotIndex, patch, timeout = null) {
    try {
      const plainPatch = patch && typeof patch === 'object' ? JSON.parse(JSON.stringify(patch)) : patch
      // 直接发送补丁数据到后端，由后端负责合并（后端 SavePlayerData 已实现深度合并逻辑）
      // 优化：从原来的 GET+POST 双请求改为单次 POST，减少 SQLite 单连接模式下的排队延迟
      return await this.savePlayerData(slotIndex, plainPatch, timeout)
    } catch (error) {
      return this._handleError(error, '补丁更新玩家数据失败')
    }
  }

  // ==================== 存档槽 ====================

  /**
   * 获取所有存档槽摘要信息
   * @returns {Promise<{success: boolean, data?: Array<{slotIndex: number, nickname: string, class: string, level: number}>}>} 存档槽列表
   */
  async getAllSaveSlots () {
    try {
      const response = await this.http.get('/player/slots')
      return response.data
    } catch (error) {
      return this._handleError(error, '获取存档槽失败')
    }
  }

  /**
   * 选择存档槽
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, message: string}>} 选择结果
   */
  async selectSaveSlot (slotIndex) {
    try {
      const response = await this.http.post('/player/slot', { slotIndex })
      if (response.data.success) {
        this.setCurrentSaveSlot(slotIndex)
      }
      return response.data
    } catch (error) {
      return this._handleError(error, '选择存档槽失败')
    }
  }

  // ==================== 角色管理 ====================

  /**
   * 创建新角色
   * @param {number} slotIndex - 存档槽编号
   * @param {string} nickname - 角色昵称
   * @param {string} characterClass - 职业类型
   * @param {string} [sex='male'] - 性别
   * @returns {Promise<{success: boolean, message: string, data?: object}>} 创建结果
   */
  async createCharacter (slotIndex, nickname, characterClass, sex = 'male') {
    try {
      const response = await this.http.post('/player/character', {
        slotIndex,
        nickname,
        class: characterClass,
        sex
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '创建角色失败')
    }
  }

  /**
   * 删除角色
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, message: string}>} 删除结果
   */
  async deleteCharacter (slotIndex) {
    try {
      const response = await this.http.delete('/player/character', {
        data: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '删除角色失败')
    }
  }

  // ==================== 副本进度 ====================

  /**
   * 保存副本进度
   * @param {number} slotIndex - 存档槽编号
   * @param {object} data - 副本进度数据
   * @returns {Promise<{success: boolean, message: string}>} 保存结果
   */
  async saveDungeonProgress (slotIndex, data) {
    try {
      const plainData = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data
      const response = await this.http.post('/player/dungeon', {
        slotIndex,
        data: plainData
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '保存副本进度失败')
    }
  }

  /**
   * 加载副本进度
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, data?: object}>} 副本进度数据
   */
  async loadDungeonProgress (slotIndex) {
    try {
      const response = await this.http.get('/player/dungeon', {
        params: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '加载副本进度失败')
    }
  }

  /**
   * 清除副本进度
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, message: string}>} 清除结果
   */
  async clearDungeonProgress (slotIndex) {
    try {
      const response = await this.http.delete('/player/dungeon', {
        data: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '清除副本进度失败')
    }
  }

  // ==================== 属性强化 ====================

  /**
   * 保存属性强化数据
   * @param {number} slotIndex - 存档槽编号
   * @param {object} data - 属性强化数据
   * @returns {Promise<{success: boolean, message: string}>} 保存结果
   */
  async saveEnhanceAttributes (slotIndex, data) {
    try {
      const plainData = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data
      const response = await this.http.post('/player/enhance', {
        slotIndex,
        data: plainData
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '保存属性强化数据失败')
    }
  }

  /**
   * 获取属性强化数据
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, data?: object}>} 属性强化数据
   */
  async getEnhanceAttributes (slotIndex) {
    try {
      const response = await this.http.get('/player/enhance', {
        params: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '获取属性强化数据失败')
    }
  }

  /**
   * 清除属性强化数据
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, message: string}>} 清除结果
   */
  async clearEnhanceAttributes (slotIndex) {
    try {
      const response = await this.http.delete('/player/enhance', {
        data: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '清除属性强化数据失败')
    }
  }

  // ==================== 用户设置 ====================

  /**
   * 保存用户设置
   * @param {number} slotIndex - 存档槽编号
   * @param {object} data - 用户设置数据
   * @returns {Promise<{success: boolean, message: string}>} 保存结果
   */
  async saveUserSettings (slotIndex, data) {
    try {
      const plainData = data && typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data
      const response = await this.http.post('/player/settings', {
        slotIndex,
        data: plainData
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '保存用户设置失败')
    }
  }

  /**
   * 加载用户设置
   * @param {number} slotIndex - 存档槽编号
   * @returns {Promise<{success: boolean, data?: object}>} 用户设置数据
   */
  async loadUserSettings (slotIndex) {
    try {
      const response = await this.http.get('/player/settings', {
        params: { slotIndex }
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '加载用户设置失败')
    }
  }

  // ==================== 钻石 ====================

  /**
   * 保存玩家钻石数量
   * @param {number} slotIndex - 存档槽编号
   * @param {number} diamonds - 钻石数量
   * @returns {Promise<{success: boolean, message: string}>} 保存结果
   */
  async savePlayerDiamonds (slotIndex, diamonds) {
    try {
      const response = await this.http.post('/player/diamonds', {
        slotIndex,
        diamonds: Number(diamonds)
      })
      return response.data
    } catch (error) {
      return this._handleError(error, '保存钻石数据失败')
    }
  }

  // ==================== 本地存储辅助 ====================

  /**
   * 保存JWT令牌到sessionStorage（关闭标签页后自动清除，需重新登录）
   * @param {string} token - JWT令牌
   */
  setToken (token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('[ApiService] 保存令牌失败:', error)
    }
  }

  /**
   * 获取JWT令牌
   * @returns {string|null} JWT令牌
   */
  getToken () {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  }

  /**
   * 保存用户ID到sessionStorage（关闭标签页后自动清除，需重新登录）
   * @param {number} userId - 用户ID
   */
  setUserId (userId) {
    try {
      sessionStorage.setItem(USER_ID_KEY, String(userId))
    } catch (error) {
      console.error('[ApiService] 保存用户ID失败:', error)
    }
  }

  /**
   * 获取用户ID
   * @returns {number|null} 用户ID
   */
  getUserId () {
    try {
      const id = sessionStorage.getItem(USER_ID_KEY)
      return id ? Number(id) : null
    } catch {
      return null
    }
  }

  /**
   * 保存用户名到sessionStorage（关闭标签页后自动清除，需重新登录）
   * @param {string} username - 用户名
   */
  setUsername (username) {
    try {
      sessionStorage.setItem(USERNAME_KEY, username)
    } catch (error) {
      console.error('[ApiService] 保存用户名失败:', error)
    }
  }

  /**
   * 获取当前用户名
   * @returns {string|null} 用户名
   */
  getUsername () {
    try {
      return sessionStorage.getItem(USERNAME_KEY)
    } catch {
      return null
    }
  }

  /**
   * 保存GM权限标志到sessionStorage
   * @param {boolean} isGM - 是否为GM权限
   */
  setIsGM (isGM) {
    try {
      sessionStorage.setItem(IS_GM_KEY, isGM ? 'true' : 'false')
    } catch (error) {
      console.error('[ApiService] 保存GM标志失败:', error)
    }
  }

  /**
   * 获取当前用户是否拥有GM权限
   * @returns {boolean} 是否为GM权限
   */
  getIsGM () {
    try {
      return sessionStorage.getItem(IS_GM_KEY) === 'true'
    } catch {
      return false
    }
  }

  /**
   * 设置当前存档槽（使用sessionStorage，每个标签页独立）
   * @param {number} slot - 存档槽编号
   */
  setCurrentSaveSlot (slot) {
    try {
      sessionStorage.setItem(SESSION_SAVE_SLOT_KEY, JSON.stringify(slot))
    } catch (error) {
      console.error('[ApiService] 保存存档槽失败:', error)
    }
  }

  /**
   * 获取当前存档槽
   * @returns {number|null} 存档槽编号
   */
  getCurrentSaveSlot () {
    try {
      const sessionSlot = sessionStorage.getItem(SESSION_SAVE_SLOT_KEY)
      if (sessionSlot !== null) {
        return JSON.parse(sessionSlot)
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * 清除所有认证信息
   */
  clearAuth () {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(USER_ID_KEY)
      sessionStorage.removeItem(USERNAME_KEY)
      sessionStorage.removeItem(IS_GM_KEY)
      sessionStorage.removeItem(SESSION_SAVE_SLOT_KEY)
    } catch (error) {
      console.error('[ApiService] 清除认证信息失败:', error)
    }
  }

  // ==================== 内部工具 ====================

  /**
   * 统一错误处理
   * @param {Error} error - 错误对象
   * @param {string} defaultMessage - 默认错误消息
   * @returns {{success: boolean, message: string}} 错误响应
   * @private
   */
  _handleError (error, defaultMessage) {
    console.error(`[ApiService] ${defaultMessage}:`, error)

    if (error.response) {
      // 服务器返回了错误响应
      const status = error.response.status
      const message = error.response.data?.message || defaultMessage

      if (status === 401) {
        return { success: false, message: message || '认证失败' }
      }
      if (status === 403) {
        return { success: false, message: message || '没有操作权限' }
      }
      if (status === 404) {
        return { success: false, message: message || '请求的资源不存在' }
      }
      if (status === 409) {
        return { success: false, message: message || '资源冲突' }
      }

      return { success: false, message }
    }

    if (error.code === 'ECONNABORTED') {
      return { success: false, message: '请求超时，请检查网络连接' }
    }

    if (!error.response && error.request) {
      return { success: false, message: '无法连接到服务器，请确认后端服务已启动' }
    }

    return { success: false, message: defaultMessage }
  }
}

/** 导出单例实例 */
export const apiService = new ApiService()
