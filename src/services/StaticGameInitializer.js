/**
 * 游戏初始化服务（静态数据版本）
 * 使用静态文件加载数据，不依赖服务端
 */
import { Player } from '@/models/Player'
import { storageService as storageServiceSingleton } from './StorageService'
import { UIService } from './UIService'
import { AudioService } from './AudioService'
import { StaticDataService } from './StaticDataService'
import { SettingsService } from './SettingsService'
import { useGameStore, useItemsStore, useMonstersStore, usePickuppetSummonStore } from '@/store'
import { useMapsStore } from '@/store/maps'
import { usePlayerStore } from '@/store/player'
import { useRaisedPetSummonStore } from '@/store'

/**
 * 额外钻石商店物品（通过服务层适配，不修改已冻结的 DIAMOND_SHOP_ITEMS.js 静态文件）
 * 当需要新增钻石商店物品时，在此处添加配置
 */
const ADDITIONAL_DIAMOND_SHOP_ITEMS = {
  '7064': {
    id: 7064,
    name: '女神的祝福',
    price: 100,
    icon: '/pt/item_icon/7064.png',
    description: '为高级商店的时装和披风添加额外的增益效果。除非该效果被帕里的珠宝大师皮奇移除，否则目标物品将被禁止交易。',
    category: 'material',
    subcategory: 'awakescroll',
    rarity: 'common',
    stack: 999,
    sellPrice: 50000000
  }
}

export class StaticGameInitializer {
  constructor () {
    const storageService = storageServiceSingleton
    const uiService = new UIService()
    const audioService = new AudioService()
    const staticDataService = new StaticDataService()

    this.services = {
      storage: storageService,
      ui: uiService,
      audio: audioService,
      data: staticDataService,
      settings: new SettingsService(audioService, storageService, uiService)
    }

    this.state = {
      player: null,
      gameData: {
        items: [],
        monsters: {},
        equipmentSets: [],
        classConfig: {},
        skillConfig: {},
        skills: {},
        diamondShopItems: {}
        // 注意: maps, npcs, quests 已改为按需加载，不在此处初始化
      },
      isInitialized: false,
      isLoading: false,
      error: null
    }

    this.timers = new Map()
    this.animationFrames = new Map()
    this.listeners = new Map()
  }

  on (event, handler) {
    if (!event || typeof handler !== 'function') {
      return () => {}
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(handler)
    return () => this.off(event, handler)
  }

  off (event, handler) {
    const handlers = this.listeners.get(event)
    if (!handlers) {
      return
    }
    handlers.delete(handler)
    if (handlers.size === 0) {
      this.listeners.delete(event)
    }
  }

  emit (event, payload) {
    const handlers = this.listeners.get(event)
    if (!handlers) {
      return
    }
    handlers.forEach(handler => {
      try {
        handler(payload)
      } catch (error) {
        console.error(`[StaticGameInitializer] 事件处理失败: ${event}`, error)
      }
    })
  }

  /**
   * 初始化游戏核心功能
   */
  async initGame () {
    try {
      this.state.isLoading = true
      this.state.error = null

      await this.services.data.init()

      if (!this.validateUserData()) {
        return false
      }

      await this.loadGameData()

      await this.initPlayerData()

      this.initGameSystems()

      this.startGameLoop()

      this.state.isInitialized = true

      return true
    } catch (error) {
      console.error('游戏初始化失败:', error)
      this.state.error = error
      return false
    } finally {
      this.state.isLoading = false
    }
  }

  /**
   * 验证用户数据
   * 存档数据已迁移到后端，不再检查本地 saveSlots，
   * 改为检查 sessionStorage 缓存（由 _preloadPlayerData 写入）或确认有存档槽即可
   */
  validateUserData () {
    const userData = this.services.storage.getUserData()
    if (!userData) {
      console.error('未找到用户数据')
      this.redirectToLogin()
      return false
    }

    const currentSaveSlot = this.services.storage.getCurrentSaveSlot()
    if (currentSaveSlot === null) {
      console.error('未找到当前存档槽')
      this.redirectToSelect()
      return false
    }

    // 检查 sessionStorage 缓存中是否有该存档槽的数据（由 _preloadPlayerData 写入）
    const cacheKey = `flyff_player_cache_${currentSaveSlot}`
    const cachedData = sessionStorage.getItem(cacheKey)
    if (!cachedData) {
      // 缓存中没有数据，可能是首次进入，尝试从后端获取
      console.warn(`[StaticGameInitializer] 存档槽 ${currentSaveSlot} 缓存为空，将在 initPlayerData 中从后端加载`)
    }

    return true
  }

  /**
   * 加载游戏数据
   */
  async loadGameData () {
    try {
      // 核心数据：必须在初始化时加载（被其他模块依赖）
      const coreDataLoaders = [
        { key: 'items', loader: () => this.services.data.loadItemData() },
        { key: 'monsters', loader: () => this.services.data.loadMonsterData() },
        { key: 'equipmentSets', loader: () => this.services.data.loadEquipmentSetData() },
        { key: 'skills', loader: () => this.services.data.loadSkillInfoData() },
        { key: 'classConfig', loader: () => this.services.data.loadClassConfig() },
        { key: 'skillConfig', loader: () => this.services.data.loadSkillConfig() },
        { key: 'diamondShopItems', loader: () => this.services.data.loadDiamondShopItems() }
      ]

      // 可选数据：按需加载（maps, npcs, quests 不再在初始化时加载）
      // 这些数据可通过 StaticDataService 的 loadMapData/loadNpcData/loadQuestData 按需加载

      const total = coreDataLoaders.length
      let completed = 0

      await Promise.all(
        coreDataLoaders.map(async ({ key, loader }) => {
          this.emit('load-item', { key, total })
          let success = false
          let error = null
          try {
            const data = await loader()
            this.state.gameData[key] = data
            success = true
            return { key, success: true }
          } catch (err) {
            error = err
            console.error(`[StaticGameInitializer] 加载${key}失败:`, err)
            this.state.gameData[key] = this.getDefaultData(key)
            return { key, success: false, error: err }
          } finally {
            completed += 1
            const progress = Math.round((completed / total) * 100)
            this.emit('load-progress', { key, progress, completed, total, success, error })
          }
        })
      )

      const itemsStore = useItemsStore()
      const monstersStore = useMonstersStore()

      // 优化：冻结静态数据，避免 Vue 追踪其变化，提高性能
      itemsStore.staticItems = Object.freeze(this.state.gameData.items)
      // 合并额外钻石商店物品（通过服务层适配，不修改静态文件）
      this.state.gameData.diamondShopItems = {
        ...this.state.gameData.diamondShopItems,
        ...ADDITIONAL_DIAMOND_SHOP_ITEMS
      }
      itemsStore.diamondShopItems = Object.freeze(this.state.gameData.diamondShopItems)
      itemsStore.loadEquipmentSets(this.state.gameData.equipmentSets)
      monstersStore.staticMonsters = Object.freeze(this.state.gameData.monsters)

      const gameStore = useGameStore()
      gameStore.updateEquipmentSets(itemsStore.equipmentSets)
    } catch (error) {
      console.error('加载游戏数据失败:', error)
      throw error
    }
  }

  /**
   * 获取默认数据
   */
  getDefaultData (dataType) {
    const defaults = {
      items: [],
      monsters: {},
      equipmentSets: [],
      skills: {},
      classConfig: this.getDefaultClassConfig(),
      skillConfig: this.getDefaultSkillConfig(),
      diamondShopItems: {}
      // maps, npcs, quests 已改为按需加载，不需要默认值
    }
    return defaults[dataType] || {}
  }

  /**
   * 初始化玩家数据
   */
  async initPlayerData () {
    try {
      const saveData = await this.services.storage.loadPlayerData()

      if (!saveData) {
        console.error('[StaticGameInitializer] 无法加载玩家数据')
        throw new Error('无法加载玩家数据')
      }

      this.state.player = new Player(this.preparePlayerData(saveData))

      this.state.player.applyFinalStats(this.state.gameData.equipmentSets)

      // ★ 重要：所有初始化方法必须在 setPlayer 之前完成
      // setPlayer 内部会 new Player() 创建新实例，如果在 setPlayer 之后
      // 调用 initPlayerSkills/fixPlayerItems/initPlayerBuffs，这些方法
      // 修改的是 this.state.player 而非 playerStore.player，导致
      // playerStore.player（即 gameStore.player）中的 skills/bag/buffs 为空
      this.fixPlayerItems()
      this.initPlayerSkills()
      this.initPlayerBuffs()
      this.setCurrentMap()

      // 所有初始化完成后再设置到 Pinia Store
      const playerStore = usePlayerStore()
      playerStore.setPlayer(this.state.player)

      // ★ 同步设置 gameStore.player：自动战斗（AutoBattleSkillManager）使用 gameStore.player
      // 如果不同步，gameStore.player.skills 为空对象，increaseSkillProficiency 找不到技能
      const gameStore = useGameStore()
      gameStore.setPlayer(this.state.player, this.state.gameData.equipmentSets)
    } catch (error) {
      console.error('初始化玩家数据失败:', error)
      throw error
    }
  }

  /**
   * 设置当前地图
   */
  setCurrentMap () {
    const mapsStore = useMapsStore()

    const defaultMap = {
      name: '帕里大陆',
      levelRange: '1-20',
      background: '/pt/map/pl.png',
      description: '新手区域，适合1-20级玩家'
    }

  mapsStore.setCurrentMap(defaultMap)
  }

  /**
   * 准备玩家数据
   */
  preparePlayerData (saveData) {
    const defaultData = {
      nickname: '未知玩家',
      class: 'beginner',
      sex: 'male',
      level: 1,
      exp: 0,
      maxExp: 100,
      gold: 0,
      diamonds: 0,
      bankGold: 0,
      maxHealth: 100,
      currentHealth: 100,
      maxMana: 100,
      currentMana: 100,
      magicDefense: 0,
      minAttack: 5,
      maxAttack: 10,
      minDefense: 1,
      maxDefense: 5,
      criticalRate: 0,
      criticalDamage: 1.5,
      attackSpeed: 0,
      hitRate: 0,
      lifeSteal: 0,
      blockRate: 0,
      dodgeRate: 0,
      stun: 0,
      decreasedCastingTime: 0,
      pveAttackBonus: 0,
      pveDefenseBonus: 0,
      fireAttack: 0,
      waterAttack: 0,
      thunderAttack: 0,
      windAttack: 0,
      earthAttack: 0,
      availableBagSlots: 165,
      totalBagSlots: 165,
      bag: [],
      equipmentBag: [],
      bankBag: [],
      skills: {},
      stats: {
        strength: 1,
        agility: 1,
        intelligence: 1,
        constitution: 1,
        freePoints: 4
      },
      tempStats: {},
      originalStats: {},
      activeBuffs: [],
      quest: {
        activeQuests: [],
        completedQuests: []
      }
    }

    const rawSaveData = saveData && typeof saveData === 'object' ? saveData : {}
    const normalizedSaveData = { ...rawSaveData }

    if (!normalizedSaveData.stats || typeof normalizedSaveData.stats !== 'object') {
      const legacyStatKeys = ['strength', 'agility', 'intelligence', 'constitution']
      const hasLegacyStats = legacyStatKeys.some(key => rawSaveData[key] !== undefined)
      const hasLegacyPoints = rawSaveData.statPoints !== undefined
      if (hasLegacyStats || hasLegacyPoints) {
        normalizedSaveData.stats = {
          ...defaultData.stats,
          strength:
            rawSaveData.strength !== undefined ? Number(rawSaveData.strength) : defaultData.stats.strength,
          agility:
            rawSaveData.agility !== undefined ? Number(rawSaveData.agility) : defaultData.stats.agility,
          intelligence:
            rawSaveData.intelligence !== undefined
              ? Number(rawSaveData.intelligence)
              : defaultData.stats.intelligence,
          constitution:
            rawSaveData.constitution !== undefined
              ? Number(rawSaveData.constitution)
              : defaultData.stats.constitution,
          freePoints:
            rawSaveData.statPoints !== undefined
              ? Number(rawSaveData.statPoints)
              : defaultData.stats.freePoints
        }
      }
    }

    if (
      rawSaveData.attack !== undefined &&
      normalizedSaveData.minAttack === undefined &&
      normalizedSaveData.maxAttack === undefined
    ) {
      const resolvedAttack = Number(rawSaveData.attack)
      if (Number.isFinite(resolvedAttack)) {
        normalizedSaveData.minAttack = resolvedAttack
        normalizedSaveData.maxAttack = resolvedAttack
      }
    }

    if (
      rawSaveData.defense !== undefined &&
      normalizedSaveData.minDefense === undefined &&
      normalizedSaveData.maxDefense === undefined
    ) {
      const resolvedDefense = Number(rawSaveData.defense)
      if (Number.isFinite(resolvedDefense)) {
        normalizedSaveData.minDefense = resolvedDefense
        normalizedSaveData.maxDefense = resolvedDefense
      }
    }

    if (!Array.isArray(normalizedSaveData.bag)) {
      normalizedSaveData.bag = Array.isArray(rawSaveData.bag) ? rawSaveData.bag : []
    }
    if (!Array.isArray(normalizedSaveData.equipmentBag)) {
      normalizedSaveData.equipmentBag = Array.isArray(rawSaveData.equipmentBag)
        ? rawSaveData.equipmentBag
        : []
    }
    if (!Array.isArray(normalizedSaveData.bankBag)) {
      normalizedSaveData.bankBag = Array.isArray(rawSaveData.bankBag) ? rawSaveData.bankBag : []
    }

    return { ...defaultData, ...normalizedSaveData }
  }

  /**
   * 修复玩家物品数据
   */
  fixPlayerItems () {
    const { player, gameData } = this.state

    if (player.bag && player.bag.length > 0) {
      player.bag = this.fixItems(player.bag, gameData.items)
    }

    if (player.equipmentBag && player.equipmentBag.length > 0) {
      player.equipmentBag = this.fixItems(player.equipmentBag, gameData.items)
    }

    if (player.bag && player.bag.length > 0 && player.equipment) {
      const equippedItems = Object.values(player.equipment).filter(item => item && item.id)
      if (equippedItems.length > 0) {
        const cleanedBag = [...player.bag]
        equippedItems.forEach(equipped => {
          let index = -1
          if (equipped.uniqueId) {
            index = cleanedBag.findIndex(item => item && item.uniqueId === equipped.uniqueId)
          } else {
            index = cleanedBag.findIndex(
              item => item && item.id === equipped.id && !item.uniqueId
            )
          }
          if (index !== -1) {
            cleanedBag.splice(index, 1)
          }
        })
        player.bag = cleanedBag
      }
    }

    const itemsStore = useItemsStore()

    if (player.bag) {
      itemsStore.playerBag = player.bag
    }

    if (player.gold !== undefined) {
      itemsStore.playerGold = player.gold
    }

    if (player.equipment) {
      const equipmentMap = {
        weapon: player.equipment.weapon || null,
        shield: player.equipment.shield || null,
        mask: player.equipment.mask || null,
        cloak: player.equipment.cloak || null,
        helmet: player.equipment.helmet || null,
        armor: player.equipment.armor || null,
        gloves: player.equipment.gloves || null,
        boots: player.equipment.boots || null,
        necklace: player.equipment.necklace || null,
        ring1: player.equipment.ring1 || null,
        ring2: player.equipment.ring2 || null,
        earring1: player.equipment.earring1 || null,
        earring2: player.equipment.earring2 || null,
        fashionHat: player.equipment.fashionHat || null,
        fashionSuit: player.equipment.fashionSuit || null,
        fashionGloves: player.equipment.fashionGloves || null,
        fashionBoots: player.equipment.fashionBoots || null
      }
      itemsStore.equipment = equipmentMap
    }
  }

  /**
   * 修复物品数据
   */
  fixItems (items, itemData) {
    const { gameData } = this.state
    const diamondShopItems = gameData?.diamondShopItems

    return items.map(item => {
      let itemToProcess = item
      if (typeof item === 'number') {
        itemToProcess = {
          id: item,
          name: `物品ID: ${item}`,
          icon: `/pt/item_icon/${item}.png`
        }
      }

      const itemId = itemToProcess.id

      let itemInfo = null
      //
      if (diamondShopItems) {
        if (Array.isArray(diamondShopItems)) {
          itemInfo = diamondShopItems.find(i => i.id === itemId)
        } else if (typeof diamondShopItems === 'object' && diamondShopItems !== null) {
          itemInfo = diamondShopItems[String(itemId)] || diamondShopItems[itemId]
        }
      }
      
      if (!itemInfo && itemData) {
        if (Array.isArray(itemData)) {
          itemInfo = itemData.find(i => i.id === itemId)
        } else if (typeof itemData === 'object' && itemData !== null) {
          itemInfo = itemData[itemId]
        }
      }

      if (!itemInfo) {
        console.warn(
          `[StaticGameInitializer] 未找到物品ID ${itemToProcess.id} 的完整信息，物品:`,
          itemToProcess
        )
        return itemToProcess
      }

      let icon = itemToProcess.icon
      if (
        !icon ||
        (typeof icon === 'string' && icon.includes('undefined')) ||
        (typeof icon === 'string' &&
          icon.includes('/pt/item_icon/') &&
          !icon.includes(itemToProcess.id.toString())) ||
        (typeof icon === 'string' && icon.includes('../public/pt/item_icon/'))
      ) {
        if (
          itemInfo.icon &&
          typeof itemInfo.icon === 'string' &&
          !itemInfo.icon.includes('undefined')
        ) {
          icon = `/pt/item_icon/${itemInfo.icon}`
        } else if (itemInfo.icon && typeof itemInfo.icon === 'number') {
          icon = `/pt/item_icon/${itemInfo.icon}.png`
        } else {
          icon = `/pt/item_icon/${itemToProcess.id}.png`
        }
      }

      if (typeof icon === 'string' && icon.includes('../public/pt/item_icon/')) {
        icon = `/pt/item_icon/${itemToProcess.id}.png`
      }

      let name = itemToProcess.name
      if (!name || (typeof name === 'object' && !name.cns)) {
        name = itemInfo.name || `物品ID: ${itemToProcess.id}`
      }

      return {
        ...itemInfo,
        ...itemToProcess,
        id: itemToProcess.id,
        icon,
        name
      }
    })
  }

  /**
   * 初始化玩家技能
   */
  initPlayerSkills () {
    const { player, gameData } = this.state
    const skillConfig = gameData.skillConfig?.SKILL_CONFIG || gameData.skillConfig
    const classSkills = skillConfig[player.class]

    if (!classSkills) {
      console.warn(`职业 ${player.class} 没有技能配置`)
      player.skills = {}
      return
    }

    player.skills = {}

    Object.entries(classSkills).forEach(([key, baseSkill]) => {
      player.skills[key] = this.createSkillObject(baseSkill)
    })

    this.applySavedSkills(player.skills)

    // 初始化阶段跳过保存到后端：角色数据刚从后端加载/缓存恢复，
    // 技能数据已经在后端存在，立即回写会导致大量并发保存请求，
    // 在 SQLite 单连接模式下容易造成超时阻塞游戏初始化
    // 后续正常操作（技能升级等）会触发保存
  }

  /**
   * 创建技能对象
   */
  createSkillObject (baseSkill) {
    const proficiency = baseSkill?.proficiency && typeof baseSkill.proficiency === 'object'
      ? baseSkill.proficiency
      : null
    const normalizedProficiencyLevel = Number(proficiency?.level ?? baseSkill?.proficiencyLevel ?? 1)
    const safeProficiencyLevel =
      Number.isFinite(normalizedProficiencyLevel) && normalizedProficiencyLevel > 0
        ? normalizedProficiencyLevel
        : 1
    const normalizedProficiencyExp = Number(
      proficiency?.exp ??
        baseSkill?.proficiency ??
        baseSkill?.proficiencyExp ??
        0
    )
    const safeProficiencyExp = Number.isFinite(normalizedProficiencyExp) && normalizedProficiencyExp >= 0
      ? normalizedProficiencyExp
      : 0
    // 新公式：升级所需经验 = 当前等级 × 10
    const safeNextExpRequired = safeProficiencyLevel * 10
    const normalizedMaxLevel = Number(proficiency?.maxLevel ?? baseSkill?.proficiencyMaxLevel ?? 10)
    const safeMaxLevel = Number.isFinite(normalizedMaxLevel) && normalizedMaxLevel > 0 ? normalizedMaxLevel : 10

    const skillData = {
      id: baseSkill.id,
      key: baseSkill.key,
      name: baseSkill.name || '未知技能',
      audio: baseSkill.audio || null,
      damage: baseSkill.damage || 0,
      cd: baseSkill.cd || 10,
      unlockLevel: baseSkill.unlockLevel,
      type: baseSkill.type || 'physical',
      element: baseSkill.element || 'none',
      manaCost: baseSkill.manaCost || 0,
      description: baseSkill.description || '',
      proficiencyLevel: safeProficiencyLevel,
      proficiency: safeProficiencyExp,
      proficiencyExp: safeNextExpRequired,
      proficiencyMaxLevel: safeMaxLevel,
      proficiencyEffect: baseSkill.proficiencyEffect || {},
      damageCalculation: baseSkill.damageCalculation || 'base',
      effect: baseSkill.effect || {},
      buffCalculation: baseSkill.buffCalculation || {},
      applyAllEffects: baseSkill.applyAllEffects || {},
      healingCalculation: baseSkill.healingCalculation || {},
      getBuffDuration: baseSkill.getBuffDuration || {},
      subSkills: baseSkill.subSkills || {},
      removeAllEffects: baseSkill.removeAllEffects || {},
      icon: baseSkill.icon || '/pt/skill_icon/default_skill.png',
      unlockCondition: baseSkill.unlockCondition,
      // DEBUFF配置
      debuff: baseSkill.debuff || null,
      // BUFF配置
      buff: baseSkill.buff || null,
      // 技能计算方法
      calculateDamage: baseSkill.calculateDamage || null,
      calculateDebuffChance: baseSkill.calculateDebuffChance || null,
      calculateDebuffEffect: baseSkill.calculateDebuffEffect || null,
      calculateBuff: baseSkill.calculateBuff || null
    }

    return skillData
  }

  /**
   * 应用保存的技能数据
   *
   * 支持两种键格式：
   * - slot key（Q/W/E/R/T/Y/U）：当前职业技能，直接覆盖 proficiency 字段
   * - skillId（如 archer_w）：跨职业技能，以 skillId 为键存入 skills 对象
   *
   * 判断依据：slot key 仅为单字母大写，skillId 包含下划线或小写字母
   *
   * @param {Object} skills - player.skills 对象，以 slot key 为属性名
   */
  applySavedSkills (skills) {
    const saveData = this.services.storage.getCurrentSaveData()
    if (!saveData?.skills) {
      return
    }

    // slot key 集合：Q/W/E/R/T/Y 等，用于区分当前职业技能与跨职业技能
    const slotKeySet = new Set(['Q', 'W', 'E', 'R', 'T', 'Y', 'U'])

    Object.entries(saveData.skills).forEach(([skillKey, savedSkill]) => {
      if (skills[skillKey]) {
        // 当前职业技能：直接覆盖 proficiency 字段
        skills[skillKey].proficiency = savedSkill.proficiency || 0
        skills[skillKey].proficiencyExp = savedSkill.proficiencyExp || 0
        skills[skillKey].proficiencyLevel = savedSkill.proficiencyLevel || 1
      } else if (!slotKeySet.has(skillKey)) {
        // 跨职业技能：以 skillId 为键创建/恢复熟练度条目
        skills[skillKey] = {
          id: savedSkill.id || skillKey,
          key: savedSkill.key || null,
          name: savedSkill.name || skillKey,
          proficiencyLevel: savedSkill.proficiencyLevel || 1,
          proficiency: savedSkill.proficiency || 0,
          proficiencyExp: savedSkill.proficiencyExp || 10,
          proficiencyMaxLevel: savedSkill.proficiencyMaxLevel || 10
        }
      }
    })
  }

  /**
   * 初始化玩家BUFF
   */
  initPlayerBuffs () {
    const { player } = this.state

    if (!player.activeBuffs) {
      player.activeBuffs = []
      return
    }

    player.activeBuffs = player.activeBuffs.map(buff => {
      const safeBuff = buff && typeof buff === 'object' ? buff : {}
      const addedAt = safeBuff.addedAt || safeBuff.startTime || Date.now()

      // 规范化 expiresAt：优先使用已有值，其次回退到 endTime，最后根据 addedAt + duration 计算
      const rawDuration = Number(safeBuff.duration || 0)
      const expiresAt = Number(safeBuff.expiresAt ?? 0) ||
        Number(safeBuff.endTime ?? 0) ||
        (rawDuration > 0 ? addedAt + rawDuration * 1000 : 0)

      return {
        ...safeBuff,
        id: safeBuff.id || Date.now() + Math.random(),
        name: safeBuff.name || '未知BUFF',
        description: safeBuff.description || '',
        icon: safeBuff.icon || '/pt/buff_icon/default_buff.png',
        duration: rawDuration,
        type: safeBuff.type || 'buff',
        value: safeBuff.value || 0,
        expRate: safeBuff.expRate || 0,
        parameter: safeBuff.parameter || '',
        addedAt,
        expiresAt
      }
    })

    const deduped = []
    const seen = new Map()

    player.activeBuffs.forEach(buff => {
      const name = typeof buff?.name === 'string' ? buff.name : ''
      const icon = typeof buff?.icon === 'string' ? buff.icon : ''
      const isSkillBuff = icon.includes('/pt/skill_icon/')
      const signature = isSkillBuff ? `skill|${name}|${icon}` : null

      if (!signature) {
        deduped.push(buff)
        return
      }

      const existingIndex = seen.get(signature)
      if (existingIndex === undefined) {
        seen.set(signature, deduped.length)
        deduped.push(buff)
        return
      }

      const existing = deduped[existingIndex]
      const existingTime = Number(existing?.addedAt ?? existing?.startTime ?? 0)
      const currentTime = Number(buff?.addedAt ?? buff?.startTime ?? 0)
      if (currentTime >= existingTime) {
        deduped[existingIndex] = buff
      }
    })

    // 清理已过期的 BUFF，并更新存活 BUFF 的剩余时长
    const now = Date.now()
    const validBuffs = []
    for (let i = 0; i < deduped.length; i++) {
      const buff = deduped[i]
      if (!buff || typeof buff !== 'object') {
        continue
      }

      // expiresAt 已在 map 阶段规范化（含 endTime / addedAt+duration 回退）
      const expiresAt = Number(buff.expiresAt ?? 0)

      if (expiresAt > 0 && expiresAt <= now) {
        // 已过期的 BUFF，跳过不加入 validBuffs
        continue
      }

      // 未过期的 BUFF，更新剩余时长
      if (expiresAt > now) {
        const remainingSeconds = Math.ceil((expiresAt - now) / 1000)
        buff.duration = remainingSeconds
      }

      validBuffs.push(buff)
    }

    player.activeBuffs = validBuffs

    // 恢复宠物召唤状态
    this.restoreRaisedPetSummon()
    // 恢复捡宠召唤状态
    this.restorePickuppetSummon()
  }

  /**
   * 从 activeBuffs 恢复宠物召唤状态
   */
  restoreRaisedPetSummon () {
    const { player } = this.state
    if (!player?.activeBuffs || !Array.isArray(player.activeBuffs)) {
      return
    }

    const RAISED_PET_ABILITY_BUFF_ID = 'raisedpet_ability'
    const petBuff = player.activeBuffs.find(buff => buff?.id === RAISED_PET_ABILITY_BUFF_ID)
    
    if (!petBuff) {
      return
    }

    try {
      const raisedPetSummonStore = useRaisedPetSummonStore()
      const itemsStore = useItemsStore()
      const playerBag = itemsStore?.playerBag || []
      
      raisedPetSummonStore.restoreFromBuff(petBuff, playerBag)
    } catch (error) {
      console.error('[StaticGameInitializer] 恢复宠物召唤状态失败:', error)
    }
  }

  /**
   * 从 activeBuffs 恢复捡宠召唤状态
   * 用途：页面刷新后从存档恢复捡宠的召唤状态和倒计时
   */
  restorePickuppetSummon () {
    const { player } = this.state
    if (!player?.activeBuffs || !Array.isArray(player.activeBuffs)) {
      return
    }

    const PICKUPPET_BUFF_PREFIX = 'pickuppet_auto_loot'
    const pickuppetBuffs = player.activeBuffs.filter(buff => String(buff?.id ?? '').startsWith(PICKUPPET_BUFF_PREFIX))

    if (!pickuppetBuffs.length) {
      return
    }

    try {
      const pickuppetSummonStore = usePickuppetSummonStore()
      const itemsStore = useItemsStore()
      const playerBag = itemsStore?.playerBag || []

      for (const buff of pickuppetBuffs) {
        pickuppetSummonStore.restoreFromBuff(buff, playerBag)
      }
      console.log('[StaticGameInitializer] 捡宠召唤状态恢复成功，共', pickuppetBuffs.length, '个')
    } catch (error) {
      console.error('[StaticGameInitializer] 恢复捡宠召唤状态失败:', error)
    }
  }

  /**
   * 初始化游戏系统
   */
  initGameSystems () {
    try {
      if (this.services.audio && typeof this.services.audio.initializeVolumeControl === 'function') {
        this.services.audio.initializeVolumeControl()
      }

      if (this.services.settings && typeof this.services.settings.loadUserSettings === 'function') {
        const loadedSettings = this.services.settings.loadUserSettings()
        if (loadedSettings && typeof this.services.settings.applyUserSettings === 'function') {
          this.services.settings.applyUserSettings(loadedSettings)
        }
      }
    } catch (error) {
      console.error('[StaticGameInitializer] 初始化用户设置失败:', error)
    }
  }

  /**
   * 启动游戏循环
   */
  startGameLoop () {
  }

  /**
   * 获取默认职业配置
   */
  getDefaultClassConfig () {
    const { CLASS_CONFIG } = require('@/data/classes')
    return CLASS_CONFIG
  }

  /**
   * 获取默认技能配置
   */
  getDefaultSkillConfig () {
    const { SKILL_CONFIG } = require('@/data/skills')
    return SKILL_CONFIG
  }

  /**
   * 重定向到登录页面
   */
  redirectToLogin () {
  }

  /**
   * 重定向到选择页面
   */
  redirectToSelect () {
  }

  /**
   * 重定向到创建页面
   */
  redirectToCreate () {
  }

  /**
   * 销毁游戏初始化器
   */
  destroy () {
    this.timers.forEach(timer => {
      clearTimeout(timer)
    })
    this.timers.clear()

    this.animationFrames.forEach(frame => {
      cancelAnimationFrame(frame)
    })
    this.animationFrames.clear()

    if (this.services.audio) {
      this.services.audio.stopAllAudio()
    }
    this.listeners.clear()
  }
}

export default StaticGameInitializer
