/**
 * 设置服务 - 基于old/init.js的applyUserSettings重构
 * 负责用户设置的应用和管理
 */
export class SettingsService {
  constructor(audioService, storageService, uiService) {
    this.audioService = audioService
    this.storageService = storageService
    this.uiService = uiService

    // 默认设置
    this.defaultSettings = {
      // 音频设置
      bgm: 1,
      sfx: 1,
      monster: 1,
      skill: 1,
      item: 1,
      volume: 1,
      sfxVolume: 1,
      monsterSfxVolume: 1,

      // 怪物设置
      monsterMinLevel: 1,
      monsterMaxLevel: 3,
      monsterDisplayCount: 2,
      monsterBossProbability: 0,

      // 自动出售设置
      autoSellInterval: 5,
      autoSellCommonWeapon: false,
      autoSellUncommonWeapon: false,
      autoSellRareWeapon: false,
      autoSellCommonEquip: false,
      autoSellUncommonEquip: false,
      autoSellRareEquip: false,
      autoSellEquipEnhanceMin: null, // 防具强化等级最小值（null表示不限，0~10）
      autoSellEquipEnhanceMax: null, // 防具强化等级最大值（null表示不限，0~10）

      // HP恢复道具自动出售设置（按物品ID，与食品店显示一致）
      autoSellHp6401: false, // 橙汁 (HP恢复60)
      autoSellHp5325: false, // 棒棒糖 (HP恢复70)
      autoSellHp7494: false, // 草莓圣代 (HP恢复110)
      autoSellHp7883: false, // 肉串 (HP恢复120)
      autoSellHp9449: false, // 饼干 (HP恢复140)
      autoSellHp3735: false, // 凤梨冰 (HP恢复160)
      autoSellHp6176: false, // 烤肉 (HP恢复160)
      autoSellHp2940: false, // 巧克力棒 (HP恢复200)
      autoSellHp1423: false, // 香蕉棒棒冰 (HP恢复210)
      autoSellHp8470: false, // 海鲜煎饼 (HP恢复230)
      autoSellHp209: false,  // 果汁 (HP恢复260)
      autoSellHp5085: false, // 牛奶 (HP恢复260)
      autoSellHp4502: false, // 海鲜汤 (HP恢复300)
      autoSellHp5443: false, // 面包 (HP恢复330)
      autoSellHp1671: false, // 水果冰 (HP恢复334)
      autoSellHp1566: false, // 火锅 (HP恢复370)
      autoSellHp542: false,  // 热狗 (HP恢复429)
      autoSellHp6972: false, // 水果冰淇淋 (HP恢复452)
      autoSellHp5772: false, // 海鲜炖汤 (HP恢复514)
      autoSellHp4388: false, // 馅饼 (HP恢复584)
      autoSellHp8536: false, // 水果布丁 (HP恢复584)
      autoSellHp7536: false, // 海鲜 (HP恢复670)
      autoSellHp1124: false, // 寿司卷 (HP恢复724)
      autoSellHp4493: false, // 鸡腿 (HP恢复970)
      autoSellHp257: false,  // 冰淇淋蛋糕 (HP恢复1170)
      autoSellHp4683: false, // 星星糖 (HP恢复1200)
      autoSellHp9890: false, // 肉沙拉 (HP恢复1300)
      autoSellHp4503: false, // 海鲜披萨 (HP恢复1450)
      autoSellHp4160: false, // 混合果汁 (HP恢复1500)
      autoSellHp1391: false, // 浓汤 (HP恢复1750)
      autoSellHp11682: false, // 风味咖喱 (HP恢复2000)
      autoSellHp15113: false, // 金枪鱼寿司 (HP恢复3100)

      // MP恢复道具自动出售设置（按物品ID，与魔法商店显示一致）
      autoSellMp7809: false, // 魔力多(小) (MP恢复65)
      autoSellMp8840: false, // 魔力多(中) (MP恢复125)
      autoSellMp3868: false, // 魔力多(大) (MP恢复185)
      autoSellMp5933: false, // 强化魔力多(小) (MP恢复245)
      autoSellMp4758: false, // 强化魔力多(中) (MP恢复315)
      autoSellMp4700: false, // 强化魔力多(大) (MP恢复375)
      autoSellMp3872: false, // 特调魔力多(小) (MP恢复450)
      autoSellMp8161: false, // 特调魔力多(中) (MP恢复525)
      autoSellMp2834: false, // 特调魔力多(大) (MP恢复600)
      autoSellMp6234: false, // 终极魔力多 (MP恢复675)

      // FP恢复道具自动出售设置
      autoSellFp100: false,
      autoSellFp200: false,
      autoSellFp300: false,
      autoSellFp400: false,
      autoSellFp500: false,
      autoSellFp600: false,
      autoSellFp700: false,
      autoSellFp800: false,
      autoSellFp900: false,

      // 宠物蛋自动出售设置
      autoSellPetEgg: false,

      // 首饰自动出售设置
      autoSellCommonJewelry: false,
      autoSellUncommonJewelry: false,
      autoSellRareJewelry: false,
      autoSellJewelryEnhanceMin: null, // 首饰强化等级最小值（null表示不限，0~10）
      autoSellJewelryEnhanceMax: null, // 首饰强化等级最大值（null表示不限，0~10）

      // 卡片自动出售设置
      autoSell2PercentCard: false,
      autoSell3PercentCard: false,
      autoSell4PercentCard: false,
      autoSellElementCard1to5: false,
      autoSellElementCard6to10: false,

      // 战栗品自动出售设置
      autoSellAllShiver: false,

      // 自动保存设置
      autoSaveInterval: 60,

      // 自动恢复设置
      autoRecoveryInterval: 5,
      autoHpRecoveryPercent: 50,
      autoMpRecoveryPercent: 50,

      // 显示效果设置
      showDamageEffect: true,
      showExpAnimation: true,
      showBagEquipmentEffect: true,
      showFestivalEffect: true,
      showWeatherEffect: true,
      festivalEffectDensity: 50,
      weatherEffectDensity: 50,
      themeColor: 'classicBlack',

      // 日志设置
      showBattleLogText: true,
      showBattleLogAnimation: true,

      // NPC显示设置
      showNpc: true,

      // 战斗日志显示设置
      showBattleLog: true,

      // 技能栏显示设置
      showSkillBar: true,

      // 捡宠过滤设置（控制捡宠自动拾取哪些类别的道具）
      pickuppetFilterWeapon: true,
      pickuppetFilterArmor: true,
      pickuppetFilterHelmet: true,
      pickuppetFilterSuit: true,
      pickuppetFilterGloves: true,
      pickuppetFilterBoots: true,
      pickuppetFilterShield: true,
      pickuppetFilterNecklace: true,
      pickuppetFilterRing: true,
      pickuppetFilterEarring: true,
      pickuppetFilterBooty: true,
      pickuppetFilterHp: true,
      pickuppetFilterMp: true,
      pickuppetFilterFp: true,
      pickuppetFilterPetEgg: true,
      pickuppetFilterPkPaper: true,
      pickuppetFilterElementCard: true,
      pickuppetFilterPiercingCard: true
    }

    // 当前设置
    this.currentSettings = { ...this.defaultSettings }
  }

  /**
   * 加载用户设置
   * @returns {Object} 用户设置
   */
  loadUserSettings() {
    try {
      // 初始化settings对象
      let settings = {}

      // 首先尝试从 'volumeSettings' 加载音量设置（旧设置系统）
      const volumeSettingsData = localStorage.getItem('volumeSettings')

      if (volumeSettingsData) {
        const volumeSettings = JSON.parse(volumeSettingsData)
        const masterVolume = volumeSettings?.master

        settings = {
          ...settings,
          volume: masterVolume,
          bgm: volumeSettings?.bgm ?? masterVolume,
          sfx: volumeSettings?.sfx ?? masterVolume,
          monster: volumeSettings?.monster ?? masterVolume
        }
      }

      // 从 'userSettings' 加载（统一使用localStorage存储）
      const userSettingsData = localStorage.getItem('userSettings')

      if (userSettingsData) {
        const userSettings = JSON.parse(userSettingsData)

        // localStorage的userSettings具有最高优先级，覆盖所有之前的设置
        settings = { ...settings, ...userSettings }
      }

      if (settings.volume === undefined && settings.master !== undefined) {
        settings.volume = settings.master
      }
      if (settings.sfx === undefined && settings.sfxVolume !== undefined) {
        settings.sfx = settings.sfxVolume
      }
      if (settings.monster === undefined && settings.monsterSfxVolume !== undefined) {
        settings.monster = settings.monsterSfxVolume
      }

      // 检查并清理旧的gameSettings键，避免冲突
      if (localStorage.getItem('gameSettings')) {
        localStorage.removeItem('gameSettings')
      }

      // 检查关键设置是否存在

      // 每次loadUserSettings都从localStorage重新加载，确保获取最新设置

      // 使用从localStorage加载的设置作为基础，然后用默认设置填充缺失的值
      // 这样确保用户设置优先于默认设置
      const updatedSettings = { ...settings }

      // 用默认设置填充缺失的值
      for (const [key, value] of Object.entries(this.defaultSettings)) {
        if (updatedSettings[key] === undefined || updatedSettings[key] === null) {
          updatedSettings[key] = value
        }
      }

      // 确保关键设置有有效值，防止无效值覆盖
      // 只有当值为undefined或null时才使用默认值，避免已保存的有效值被覆盖
      if (
        updatedSettings.monsterMinLevel === undefined ||
        updatedSettings.monsterMinLevel === null
      ) {
        updatedSettings.monsterMinLevel = this.defaultSettings.monsterMinLevel
      } else if (
        typeof updatedSettings.monsterMinLevel === 'number' &&
        (updatedSettings.monsterMinLevel < 1 || updatedSettings.monsterMinLevel > 200)
      ) {
        // 如果值在范围内但无效，则使用默认值并记录警告
        console.warn(
          '5: SettingsService - monsterMinLevel超出有效范围(1-200):',
          updatedSettings.monsterMinLevel,
          '，使用默认值:',
          this.defaultSettings.monsterMinLevel
        )
        updatedSettings.monsterMinLevel = this.defaultSettings.monsterMinLevel
      }

      if (
        updatedSettings.monsterMaxLevel === undefined ||
        updatedSettings.monsterMaxLevel === null
      ) {
        updatedSettings.monsterMaxLevel = this.defaultSettings.monsterMaxLevel
      } else if (
        typeof updatedSettings.monsterMaxLevel === 'number' &&
        (updatedSettings.monsterMaxLevel <= 0 || updatedSettings.monsterMaxLevel > 200)
      ) {
        // 如果值在范围内但无效，则使用默认值并记录警告
        console.warn(
          '5: SettingsService - monsterMaxLevel超出有效范围(1-200):',
          updatedSettings.monsterMaxLevel,
          '，使用默认值:',
          this.defaultSettings.monsterMaxLevel
        )
        updatedSettings.monsterMaxLevel = this.defaultSettings.monsterMaxLevel
      }

      if (
        updatedSettings.monsterDisplayCount === undefined ||
        updatedSettings.monsterDisplayCount === null
      ) {
        updatedSettings.monsterDisplayCount = this.defaultSettings.monsterDisplayCount
      } else if (
        typeof updatedSettings.monsterDisplayCount === 'number' &&
        (updatedSettings.monsterDisplayCount <= 0 || updatedSettings.monsterDisplayCount > 30)
      ) {
        // 如果值在范围内但无效，则使用默认值并记录警告
        console.warn(
          '6: SettingsService - monsterDisplayCount超出有效范围(1-30):',
          updatedSettings.monsterDisplayCount,
          '，使用默认值:',
          this.defaultSettings.monsterDisplayCount
        )
        updatedSettings.monsterDisplayCount = this.defaultSettings.monsterDisplayCount
      }

      if (
        updatedSettings.monsterBossProbability === undefined ||
        updatedSettings.monsterBossProbability === null
      ) {
        updatedSettings.monsterBossProbability = this.defaultSettings.monsterBossProbability
      } else {
        const bossProbabilityCandidate = Number(updatedSettings.monsterBossProbability)
        if (!Number.isFinite(bossProbabilityCandidate) || bossProbabilityCandidate < 0 || bossProbabilityCandidate > 0.1) {
          console.warn(
            '6: SettingsService - monsterBossProbability超出有效范围(0-0.1):',
            updatedSettings.monsterBossProbability,
            '，使用默认值:',
            this.defaultSettings.monsterBossProbability
          )
          updatedSettings.monsterBossProbability = this.defaultSettings.monsterBossProbability
        } else {
          updatedSettings.monsterBossProbability = bossProbabilityCandidate
        }
      }

      this.currentSettings = updatedSettings

      // 同步音量设置到AudioService
      if (this.audioService) {
        const audioSettings = {
          master:
            typeof updatedSettings.volume === 'string'
              ? parseFloat(updatedSettings.volume)
              : updatedSettings.volume !== undefined
                ? updatedSettings.volume
                : this.audioService.volumeSettings.master,
          bgm:
            typeof updatedSettings.bgm === 'string'
              ? parseFloat(updatedSettings.bgm)
              : updatedSettings.bgm !== undefined
                ? updatedSettings.bgm
                : this.audioService.volumeSettings.bgm,
          sfx:
            typeof updatedSettings.sfx === 'string'
              ? parseFloat(updatedSettings.sfx)
              : updatedSettings.sfx !== undefined
                ? updatedSettings.sfx
                : this.audioService.volumeSettings.sfx,
          monster:
            typeof updatedSettings.monster === 'string'
              ? parseFloat(updatedSettings.monster)
              : updatedSettings.monster !== undefined
                ? updatedSettings.monster
                : this.audioService.volumeSettings.monster,
          skill:
            typeof updatedSettings.skill === 'string'
              ? parseFloat(updatedSettings.skill)
              : updatedSettings.skill !== undefined
                ? updatedSettings.skill
                : this.audioService.volumeSettings.skill,
          item:
            typeof updatedSettings.item === 'string'
              ? parseFloat(updatedSettings.item)
              : updatedSettings.item !== undefined
                ? updatedSettings.item
                : this.audioService.volumeSettings.item
        }
        this.audioService.volumeSettings = audioSettings
        this.audioService.saveVolumeSettings()
      }

      // 确保必要设置有默认值（仅在未设置时）
      if (
        this.currentSettings.autoSaveInterval === undefined ||
        this.currentSettings.autoSaveInterval === null
      ) {
        this.currentSettings.autoSaveInterval = 60
      }

      return this.currentSettings
    } catch (error) {
      console.error('加载用户设置失败:', error)
      if (!this.currentSettings) {
        this.currentSettings = { ...this.defaultSettings }
      }
      return this.currentSettings
    }
  }

  /**
   * 应用用户设置
   * @param {Object} settings - 用户设置
   */
  applyUserSettings(settings) {
    if (!settings) {
      console.warn('没有提供设置数据')
      return
    }

    // 更新当前设置
    this.currentSettings = { ...this.currentSettings, ...settings }

    // 应用音频设置
    this.applyAudioSettings(settings)

    // 应用游戏设置
    this.applyGameSettings(settings)

    // 应用UI设置
    this.applyUISettings(settings)
  }

  /**
   * 应用音频设置
   * @param {Object} settings - 音频设置
   */
  applyAudioSettings(settings) {
    if (!this.audioService) {
      console.warn('音频服务未初始化')
      return
    }

    if (settings.volume !== undefined || settings.master !== undefined) {
      const masterRaw = settings.volume !== undefined ? settings.volume : settings.master
      const masterVolume = typeof masterRaw === 'string' ? parseFloat(masterRaw) : masterRaw
      this.audioService.setMasterVolume(masterVolume)
    }

    // 应用背景音乐音量
    if (settings.bgm !== undefined) {
      const bgmVolume = typeof settings.bgm === 'string' ? parseFloat(settings.bgm) : settings.bgm
      this.audioService.setBGMVolume(bgmVolume)
    }

    // 应用音效音量
    if (settings.sfx !== undefined || settings.sfxVolume !== undefined) {
      const sfxRaw = settings.sfx !== undefined ? settings.sfx : settings.sfxVolume
      const sfxVolume = typeof sfxRaw === 'string' ? parseFloat(sfxRaw) : sfxRaw
      this.audioService.setSFXVolume(sfxVolume)
    }

    // 应用怪物音效音量
    if (settings.monster !== undefined || settings.monsterSfxVolume !== undefined) {
      const monsterRaw = settings.monster !== undefined ? settings.monster : settings.monsterSfxVolume
      const monsterVolume = typeof monsterRaw === 'string' ? parseFloat(monsterRaw) : monsterRaw
      this.audioService.setMonsterVolume(monsterVolume)
    }

    if (settings.skill !== undefined) {
      const skillVolume = typeof settings.skill === 'string' ? parseFloat(settings.skill) : settings.skill
      this.audioService.setSkillVolume(skillVolume)
    }

    if (settings.item !== undefined) {
      const itemVolume = typeof settings.item === 'string' ? parseFloat(settings.item) : settings.item
      this.audioService.setItemVolume(itemVolume)
    }
  }

  /**
   * 应用游戏设置
   * @param {Object} settings - 游戏设置
   */
  applyGameSettings(settings) {
    // 应用怪物设置
    if (settings.monsterMaxLevel !== undefined) {
      this.currentSettings.monsterMaxLevel = settings.monsterMaxLevel
    }

    if (settings.monsterDisplayCount !== undefined) {
      this.currentSettings.monsterDisplayCount = settings.monsterDisplayCount
    }

    if (settings.monsterBossProbability !== undefined) {
      this.currentSettings.monsterBossProbability = settings.monsterBossProbability
    }

    // 应用自动保存间隔
    if (settings.autoSaveInterval !== undefined) {
      // 这里应该更新自动保存定时器
    }

    // 应用自动恢复设置
    if (settings.autoHpRecoveryPercent !== undefined) {
      this.currentSettings.autoHpRecoveryPercent = settings.autoHpRecoveryPercent
    }

    if (settings.autoMpRecoveryPercent !== undefined) {
      this.currentSettings.autoMpRecoveryPercent = settings.autoMpRecoveryPercent
    }

    // 应用自动出售设置
    const autoSellSettings = [
      'autoSellInterval',
      'autoRecoveryInterval',
      'autoSellCommonWeapon',
      'autoSellUncommonWeapon',
      'autoSellRareWeapon',
      'autoSellCommonEquip',
      'autoSellUncommonEquip',
      'autoSellRareEquip',
      // HP道具自动出售设置（按物品ID）
      'autoSellHp6401',
      'autoSellHp5325',
      'autoSellHp7494',
      'autoSellHp7883',
      'autoSellHp9449',
      'autoSellHp3735',
      'autoSellHp6176',
      'autoSellHp2940',
      'autoSellHp1423',
      'autoSellHp8470',
      'autoSellHp209',
      'autoSellHp5085',
      'autoSellHp4502',
      'autoSellHp5443',
      'autoSellHp1671',
      'autoSellHp1566',
      'autoSellHp542',
      'autoSellHp6972',
      'autoSellHp5772',
      'autoSellHp4388',
      'autoSellHp8536',
      'autoSellHp7536',
      'autoSellHp1124',
      'autoSellHp4493',
      'autoSellHp257',
      'autoSellHp4683',
      'autoSellHp9890',
      'autoSellHp4503',
      'autoSellHp4160',
      'autoSellHp1391',
      'autoSellHp11682',
      'autoSellHp15113',
      // MP道具自动出售设置（按物品ID）
      'autoSellMp7809',
      'autoSellMp8840',
      'autoSellMp3868',
      'autoSellMp5933',
      'autoSellMp4758',
      'autoSellMp4700',
      'autoSellMp3872',
      'autoSellMp8161',
      'autoSellMp2834',
      'autoSellMp6234',
      // FP道具自动出售设置
      'autoSellFp100',
      'autoSellFp200',
      'autoSellFp300',
      'autoSellFp400',
      'autoSellFp500',
      'autoSellFp600',
      'autoSellFp700',
      'autoSellFp800',
      'autoSellFp900',
      'autoSellPetEgg',
      'autoSellCommonJewelry',
      'autoSellUncommonJewelry',
      'autoSellRareJewelry',
      'autoSell2PercentCard',
      'autoSell3PercentCard',
      'autoSell4PercentCard',
      'autoSellElementCard1to5',
      'autoSellElementCard6to10',
      'autoSellAllShiver',
      // 捡宠过滤设置
      'pickuppetFilterWeapon',
      'pickuppetFilterArmor',
      'pickuppetFilterHelmet',
      'pickuppetFilterSuit',
      'pickuppetFilterGloves',
      'pickuppetFilterBoots',
      'pickuppetFilterShield',
      'pickuppetFilterNecklace',
      'pickuppetFilterRing',
      'pickuppetFilterEarring',
      'pickuppetFilterBooty',
      'pickuppetFilterHp',
      'pickuppetFilterMp',
      'pickuppetFilterFp',
      'pickuppetFilterPetEgg',
      'pickuppetFilterPkPaper',
      'pickuppetFilterElementCard',
      'pickuppetFilterPiercingCard'
    ]

    for (const setting of autoSellSettings) {
      if (settings[setting] !== undefined) {
        this.currentSettings[setting] = settings[setting]
      }
    }
  }

  /**
   * 应用UI设置
   * @param {Object} settings - UI设置
   */
  applyUISettings(settings) {
    if (settings.themeColor !== undefined) {
      this.applyThemeColor(settings.themeColor)
    }

    if (!this.uiService) {
      console.warn('UI服务未初始化')
      return
    }

    // 应用显示效果设置
    if (settings.showDamageEffect !== undefined) {
      // 这里应该调用UI服务更新伤害效果显示
    }
  }

  applyThemeColor(themeColor) {
    if (typeof document === 'undefined') {
      return
    }

    const rawThemeKey = themeColor || 'classicBlack'
    const themeKey = rawThemeKey === 'default' ? 'classicBlack' : rawThemeKey || 'classicBlack'
    const themes = {
      classicBlack: {
        '--theme-section-bg': '#000000',
        '--theme-panel-bg': '#000000',
        '--theme-modal-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-header-bg': '#000000',
        '--theme-content-bg': '#000000',
        '--theme-item-bg': '#000000',
        '--theme-text': '#ffffff',
        '--theme-muted': '#ffffff',
        '--theme-text-inverse': '#ffffff',
        '--theme-surface': '#000000',
        '--theme-surface-strong': '#000000',
        '--theme-surface-muted': '#000000',
        '--theme-border': '#8b7355',
        '--theme-border-strong': '#8b7355',
        '--theme-button-bg': '#000000',
        '--theme-button-hover': '#000000',
        '--theme-button-text': '#ffffff',
        '--theme-accent': '#ffd700',
        '--theme-accent-strong': '#ffd700',
        '--theme-bag-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-player-detail-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-map-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-npc-bg': 'rgba(0, 0, 0, 0.8)',
        '--theme-battle-log-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-battle-section-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-settings-bg': 'rgba(0, 0, 0, 0.9)',
        '--theme-quest-bg': 'rgba(0, 0, 0, 0.9)'
      },
      classicWhite: {
        '--theme-section-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-panel-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-modal-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-header-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-content-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-item-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-text': '#000000',
        '--theme-muted': '#000000',
        '--theme-text-inverse': '#000000',
        '--theme-surface': 'rgba(255, 255, 255, 0.9)',
        '--theme-surface-strong': 'rgba(255, 255, 255, 0.9)',
        '--theme-surface-muted': 'rgba(255, 255, 255, 0.9)',
        '--theme-border': '#8b7355',
        '--theme-border-strong': '#8b7355',
        '--theme-button-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-button-hover': 'rgba(255, 255, 255, 0.9)',
        '--theme-button-text': '#000000',
        '--theme-accent': '#ffd700',
        '--theme-accent-strong': '#ffd700',
        '--theme-bag-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-player-detail-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-map-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-npc-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-battle-log-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-battle-section-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-settings-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-quest-bg': 'rgba(255, 255, 255, 0.9)'
      },
      christmas: {
        '--theme-main-bg': 'rgba(240, 250, 245, 0.92)',
        '--theme-section-bg': 'rgba(255, 255, 255, 0.96)',
        '--theme-panel-bg': '#e5f3e8',
        '--theme-modal-bg': '#f7fff9',
        '--theme-header-bg': '#2f7d4d',
        '--theme-content-bg': '#f1faf3',
        '--theme-item-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-text': '#1f2a1f',
        '--theme-muted': '#4b5a4b',
        '--theme-text-inverse': '#ffffff',
        '--theme-surface': 'rgba(240, 250, 245, 0.92)',
        '--theme-surface-strong': '#ffffff',
        '--theme-surface-muted': 'rgba(47, 125, 77, 0.08)',
        '--theme-border': 'rgba(47, 125, 77, 0.35)',
        '--theme-border-strong': '#2f7d4d',
        '--theme-button-bg': 'rgba(34, 102, 63, 0.9)',
        '--theme-button-hover': 'rgba(198, 40, 40, 0.9)',
        '--theme-button-text': '#ffffff',
        '--theme-accent': '#2e7d32',
        '--theme-accent-strong': '#c62828'
      },
      spring: {
        '--theme-main-bg': 'rgba(255, 245, 238, 0.92)',
        '--theme-section-bg': 'rgba(255, 250, 245, 0.96)',
        '--theme-panel-bg': '#ffe9dc',
        '--theme-modal-bg': '#fff4ec',
        '--theme-header-bg': '#b91c1c',
        '--theme-content-bg': '#fff1e6',
        '--theme-item-bg': 'rgba(255, 255, 255, 0.9)',
        '--theme-text': '#3b1d1d',
        '--theme-muted': '#7a4b4b',
        '--theme-text-inverse': '#ffffff',
        '--theme-surface': 'rgba(255, 245, 238, 0.92)',
        '--theme-surface-strong': '#ffffff',
        '--theme-surface-muted': 'rgba(185, 28, 28, 0.08)',
        '--theme-border': 'rgba(185, 28, 28, 0.35)',
        '--theme-border-strong': '#b91c1c',
        '--theme-button-bg': 'rgba(185, 28, 28, 0.9)',
        '--theme-button-hover': 'rgba(234, 179, 8, 0.9)',
        '--theme-button-text': '#ffffff',
        '--theme-accent': '#d97706',
        '--theme-accent-strong': '#b91c1c'
      }
    }

    const selectedTheme = themes[themeKey] || themes.classicBlack
    const root = document.documentElement

    root.setAttribute('data-theme', themeKey)

    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  /**
   * 保存用户设置
   * @param {Object} settings - 要保存的设置
   * @returns {boolean} 是否保存成功
   */
  saveUserSettings(settings) {
    try {

      // 合并当前设置和新设置
      const newSettings = { ...this.currentSettings, ...settings }

      // 验证并修正关键设置值，确保它们在有效范围内
      // 只有当值确实无效时才修正，允许用户设置有效范围内的任何值
      if (
        newSettings.monsterMinLevel !== undefined &&
        newSettings.monsterMinLevel !== null &&
        (typeof newSettings.monsterMinLevel !== 'number' ||
          newSettings.monsterMinLevel < 1 ||
          newSettings.monsterMinLevel > 200)
      ) {
        console.warn(
          '10: SettingsService - 无效的monsterMinLevel值:',
          newSettings.monsterMinLevel,
          '，使用默认值:',
          this.defaultSettings.monsterMinLevel
        )
        newSettings.monsterMinLevel = this.defaultSettings.monsterMinLevel
      }

      if (
        newSettings.monsterMaxLevel !== undefined &&
        newSettings.monsterMaxLevel !== null &&
        (typeof newSettings.monsterMaxLevel !== 'number' ||
          newSettings.monsterMaxLevel <= 0 ||
          newSettings.monsterMaxLevel > 200)
      ) {
        console.warn(
          '10: SettingsService - 无效的monsterMaxLevel值:',
          newSettings.monsterMaxLevel,
          '，使用默认值:',
          this.defaultSettings.monsterMaxLevel
        )
        newSettings.monsterMaxLevel = this.defaultSettings.monsterMaxLevel
      }

      if (
        newSettings.monsterDisplayCount !== undefined &&
        newSettings.monsterDisplayCount !== null &&
        (typeof newSettings.monsterDisplayCount !== 'number' ||
          newSettings.monsterDisplayCount <= 0 ||
          newSettings.monsterDisplayCount > 30)
      ) {
        console.warn(
          '11: SettingsService - 无效的monsterDisplayCount值:',
          newSettings.monsterDisplayCount,
          '，使用默认值:',
          this.defaultSettings.monsterDisplayCount
        )
        newSettings.monsterDisplayCount = this.defaultSettings.monsterDisplayCount
      }

      if (
        newSettings.monsterBossProbability !== undefined &&
        newSettings.monsterBossProbability !== null
      ) {
        const bossProbabilityCandidate = Number(newSettings.monsterBossProbability)
        if (!Number.isFinite(bossProbabilityCandidate) || bossProbabilityCandidate < 0 || bossProbabilityCandidate > 0.1) {
          console.warn(
            '11: SettingsService - 无效的monsterBossProbability值:',
            newSettings.monsterBossProbability,
            '，使用默认值:',
            this.defaultSettings.monsterBossProbability
          )
          newSettings.monsterBossProbability = this.defaultSettings.monsterBossProbability
        } else {
          newSettings.monsterBossProbability = bossProbabilityCandidate
        }
      }

      // 保存到localStorage
      const settingsString = JSON.stringify(newSettings)

      localStorage.setItem('userSettings', settingsString)

      // 清理旧的gameSettings存储键，避免冲突
      if (localStorage.getItem('gameSettings')) {

        localStorage.removeItem('gameSettings')
      }

      // 验证是否保存成功
      // const savedData = localStorage.getItem('userSettings')

      // 更新当前设置
      this.currentSettings = newSettings

      // 应用新设置
      this.applyUserSettings(newSettings)

      // 同步音量设置到AudioService的audioSettings存储
      if (this.audioService) {
        const audioSettings = {
          master:
            typeof newSettings.volume === 'string'
              ? parseFloat(newSettings.volume)
              : newSettings.volume !== undefined
                ? newSettings.volume
                : this.audioService.volumeSettings.master,
          bgm:
            typeof newSettings.bgm === 'string'
              ? parseFloat(newSettings.bgm)
              : newSettings.bgm !== undefined
                ? newSettings.bgm
                : this.audioService.volumeSettings.bgm,
          sfx:
            typeof newSettings.sfx === 'string'
              ? parseFloat(newSettings.sfx)
              : newSettings.sfx !== undefined
                ? newSettings.sfx
                : this.audioService.volumeSettings.sfx,
          monster:
            typeof newSettings.monster === 'string'
              ? parseFloat(newSettings.monster)
              : newSettings.monster !== undefined
                ? newSettings.monster
                : this.audioService.volumeSettings.monster,
          skill:
            typeof newSettings.skill === 'string'
              ? parseFloat(newSettings.skill)
              : newSettings.skill !== undefined
                ? newSettings.skill
                : this.audioService.volumeSettings.skill,
          item:
            typeof newSettings.item === 'string'
              ? parseFloat(newSettings.item)
              : newSettings.item !== undefined
                ? newSettings.item
                : this.audioService.volumeSettings.item
        }
        this.audioService.volumeSettings = audioSettings
        this.audioService.saveVolumeSettings()

      }


      return true
    } catch (error) {
      console.error('保存用户设置失败:', error)
      return false
    }
  }

  /**
   * 获取当前设置
   * @returns {Object} 当前设置
   */
  getCurrentSettings() {
    return { ...this.currentSettings }
  }

  /**
   * 获取默认设置
   * @returns {Object} 默认设置
   */
  getDefaultSettings() {
    return { ...this.defaultSettings }
  }

  /**
   * 重置为默认设置
   */
  resetToDefault() {
    this.currentSettings = { ...this.defaultSettings }
    this.saveUserSettings(this.currentSettings)
  }

  /**
   * 设置自动保存间隔
   * @param {number} interval - 自动保存间隔（秒）
   */
  setAutoSaveInterval(interval) {
    if (interval < 5) {
      interval = 5
    }
    if (interval > 3600) {
      interval = 3600
    }

    this.currentSettings.autoSaveInterval = interval
    this.saveUserSettings({ autoSaveInterval: interval })
  }

  /**
   * 设置自动恢复百分比
   * @param {string} type - 类型：'hp' 或 'mp'
   * @param {number} percent - 百分比（1-100）
   */
  setAutoRecoveryPercent(type, percent) {
    if (percent < 1) {
      percent = 1
    }
    if (percent > 100) {
      percent = 100
    }

    if (type === 'hp') {
      this.currentSettings.autoHpRecoveryPercent = percent
      this.saveUserSettings({ autoHpRecoveryPercent: percent })
    } else if (type === 'mp') {
      this.currentSettings.autoMpRecoveryPercent = percent
      this.saveUserSettings({ autoMpRecoveryPercent: percent })
    }
  }

  /**
   * 清理设置服务
   */
  cleanup() {
    this.currentSettings = { ...this.defaultSettings }
  }
}
