import { ref } from 'vue'
import { SettingsService } from '@/services/SettingsService'

export function useSettings (gameInitializerOrServices = null) {
  let settingsService
  let gameInitializer = null

  // 判断传入参数类型：gameInitializer对象还是各个服务
  if (gameInitializerOrServices && gameInitializerOrServices.settingsService) {
    // 传入的是gameInitializer对象
    gameInitializer = gameInitializerOrServices
    settingsService = gameInitializerOrServices.settingsService
  } else if (gameInitializerOrServices && typeof gameInitializerOrServices === 'object') {
    // 传入的是服务对象
    const {
      audioService = null,
      storageService = null,
      uiService = null
    } = gameInitializerOrServices
    settingsService = new SettingsService(audioService, storageService, uiService)
  } else {
    // 没有传入参数，创建新的SettingsService实例
    settingsService = new SettingsService()
  }

  // 响应式数据
  // 初始化为默认值，但loadSettings会用实际保存的值覆盖
  const userSettings = ref({ ...settingsService.getDefaultSettings() })

  const normalizeDate = value => {
    if (!value) {
      return new Date()
    }
    const normalized = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(normalized.getTime())) {
      return new Date()
    }
    return normalized
  }

  const parseChineseMonth = value => {
    if (!value) {
      return null
    }
    const raw = value.replace('闰', '').replace('月', '').trim()
    const numeric = Number(raw)
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric
    }
    const map = {
      正: 1,
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
      十一: 11,
      十二: 12
    }
    return map[raw] || null
  }

  const parseChineseDay = value => {
    if (!value) {
      return null
    }
    const raw = value.replace('日', '').replace('号', '').trim()
    const numeric = Number(raw)
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric
    }
    const map = {
      初一: 1,
      初二: 2,
      初三: 3,
      初四: 4,
      初五: 5,
      初六: 6,
      初七: 7,
      初八: 8,
      初九: 9,
      初十: 10,
      十一: 11,
      十二: 12,
      十三: 13,
      十四: 14,
      十五: 15,
      十六: 16,
      十七: 17,
      十八: 18,
      十九: 19,
      二十: 20,
      廿一: 21,
      廿二: 22,
      廿三: 23,
      廿四: 24,
      廿五: 25,
      廿六: 26,
      廿七: 27,
      廿八: 28,
      廿九: 29,
      三十: 30
    }
    return map[raw] || null
  }

  const getLunarMonthDay = date => {
    try {
      const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
        month: 'numeric',
        day: 'numeric'
      })
      const parts = formatter.formatToParts(date)
      const monthPart = parts.find(part => part.type === 'month')?.value
      const dayPart = parts.find(part => part.type === 'day')?.value
      return {
        month: parseChineseMonth(monthPart),
        day: parseChineseDay(dayPart)
      }
    } catch (error) {
      return { month: null, day: null }
    }
  }

  const getLunarNewYearDate = year => {
    for (let i = 0; i < 60; i += 1) {
      const date = new Date(year, 0, 1 + i)
      const { month, day } = getLunarMonthDay(date)
      if (month === 1 && day === 1) {
        return date
      }
    }
    return null
  }

  const isWithinSpringFestivalWindow = date => {
    const lunarNewYear = getLunarNewYearDate(date.getFullYear())
    if (!lunarNewYear) {
      return false
    }
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffDays = Math.ceil((lunarNewYear.getTime() - today.getTime()) / 86400000)
    return diffDays >= 0 && diffDays <= 30
  }

  const resolveTheme = date => {
    if (date.getMonth() === 11) {
      return 'christmas'
    }
    if (isWithinSpringFestivalWindow(date)) {
      return 'spring'
    }
    return 'classicBlack'
  }

  const resolveUiTheme = (themeColor, date = new Date()) => {
    if (themeColor && themeColor !== 'auto') {
      return themeColor
    }
    return resolveTheme(normalizeDate(date))
  }

  const showSettingsModal = ref(false)

  // 方法
  /**
   * 打开设置模态框
   */
  const openSettingsModal = () => {
    showSettingsModal.value = true
  }

  /**
   * 关闭设置模态框
   */
  const closeSettingsModal = () => {
    showSettingsModal.value = false
  }

  /**
   * 加载设置
   */
  const loadSettings = () => {
 

    try {
      // 使用SettingsService加载用户设置
      const loadedSettings = settingsService.loadUserSettings()
 
      // 保留原有的userSettings值，只更新用户实际设置的值
      // 避免默认值覆盖已保存的用户设置
      // 音量设置已经包含在loadedSettings中（bgm, sfx, monster） 
      for (const [key, value] of Object.entries(loadedSettings)) {
        if (value !== undefined && value !== null) {
          userSettings.value[key] = value
        }
      }
     
      // 更新音量
      updateVolume()
 
    } catch (error) {
      console.error('useSettings - 加载设置失败:', error)
    }
  }

  /**
   * 保存设置
   */
  const saveSettings = () => {
 
    try {
      // 检查关键设置值
    
      // 音量设置已经包含在userSettings中（bgm, sfx, monster）
      // 直接使用userSettings.value保存所有设置
      const unifiedSettings = {
        ...userSettings.value
      }

      
      // 使用SettingsService保存用户设置
      settingsService.saveUserSettings(unifiedSettings)
 
      // 更新音量
      updateVolume()

 
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  // 带有额外参数的高级保存方法
  const saveSettingsWithServices = (gameInitializer = null, autoBattleService = null) => {
   
    try {
      // 检查关键设置值
 
      // 音量设置已经包含在userSettings中（bgm, sfx, monster）
      // 直接使用userSettings.value保存所有设置
      const unifiedSettings = {
        ...userSettings.value
      }

  
      // 使用SettingsService保存用户设置
      settingsService.saveUserSettings(unifiedSettings)
 
      // 更新音量
      updateVolume()

      // 更新自动保存间隔
      if (gameInitializer) {
        if (gameInitializer.clearTimer) {
          gameInitializer.clearTimer('autoSave')
        }
        /*
        if (gameInitializer.addTimer) {
          gameInitializer.addTimer('autoSave', () => {
            if (gameInitializer.storageService && gameInitializer.getPlayer) {
              gameInitializer.storageService.autoSave(gameInitializer.getPlayer())
            }
          }, (userSettings.value.autoSaveInterval || 60) * 1000);
        }
        */
      }

      // 如果有自动战斗服务，更新配置
      if (autoBattleService && autoBattleService.updateConfig) {
        autoBattleService.updateConfig(userSettings.value)
      }

      // 检查是否需要刷新怪物列表（当怪物设置发生变化时）
      if (gameInitializer && typeof gameInitializer.refreshMonsters === 'function') {
        // 尝试刷新当前地图的怪物
        try {
          gameInitializer.refreshMonsters()
      
        } catch (refreshError) {
          console.warn('刷新怪物列表失败:', refreshError)
        }
      }

   
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  /**
   * 更新音量
   */
  const updateVolume = () => {
    if (gameInitializer && gameInitializer.services && gameInitializer.services.audio) {
      gameInitializer.services.audio.setAllVolumes({
        bgm: userSettings.value.bgm,
        sfx: userSettings.value.sfx,
        monster: userSettings.value.monster,
        skill: userSettings.value.skill,
        item: userSettings.value.item
      })
    } else if (settingsService && settingsService.audioService) {
      settingsService.audioService.setAllVolumes({
        bgm: userSettings.value.bgm,
        sfx: userSettings.value.sfx,
        monster: userSettings.value.monster,
        skill: userSettings.value.skill,
        item: userSettings.value.item
      })
    }
  }

  /**
   * 应用用户设置
   */
  const applyUserSettings = settings => {
    settingsService.applyUserSettings(settings)
  }

  /**
   * 保存用户设置
   */
  const saveUserSettings = settings => {
    return settingsService.saveUserSettings(settings)
  }

  /**
   * 获取当前设置
   */
  const getCurrentSettings = () => {
    return settingsService.getCurrentSettings()
  }

  /**
   * 获取默认设置
   */
  const getDefaultSettings = () => {
    return settingsService.getDefaultSettings()
  }

  /**
   * 重置为默认设置
   */
  const resetToDefault = () => {
    settingsService.resetToDefault()
  }

  /**
   * 设置自动保存间隔
   */
  // const setAutoSaveInterval = (interval) => {
  //   settingsService.setAutoSaveInterval(interval)
  // }

  /**
   * 设置自动恢复百分比
   */
  const setAutoRecoveryPercent = (type, percent) => {
    settingsService.setAutoRecoveryPercent(type, percent)
  }

  // 返回所有需要的属性和方法
  return {
    // 响应式数据
    userSettings,
    showSettingsModal,

    // 方法
    openSettingsModal,
    closeSettingsModal,
    loadSettings,
    saveSettings,
    saveSettingsWithServices,
    updateVolume,
    applyUserSettings,
    saveUserSettings,
    getCurrentSettings,
    getDefaultSettings,
    resetToDefault,
    setAutoRecoveryPercent,
    resolveUiTheme
  }
}
