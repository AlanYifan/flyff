/**
 * @file 游戏核心 Store（game）
 * @description 顶层游戏状态管理，子 Store 使用懒加载代理导出：
 *   - 登录页只需 useGameStore，不需要 items/monsters 等子 Store
 *   - 子 Store 首次调用时动态 import 并缓存，避免登录页加载 ITEM_INFO 等大文件
 *   - 对外 API 完全不变：useItemsStore() / useMonstersStore() 等调用方式一致
 */
import { defineStore } from 'pinia'
import { SetBonusService } from '@/services/SetBonusService'
import { Player } from '@/models/Player'
import { storageService } from '@/services/StorageService'
import { isDungeonOnlyMonster, getActiveFallenBossTarget } from '@/utils/jobChangeQuestHelper'

// ==================== 子 Store 懒加载代理 ====================
// 使用工厂函数创建懒加载代理：首次调用时动态 import，后续调用复用缓存。
// 这样登录页导入 @/store 时，不会触发子 Store 模块加载（Vite 会将它们分到独立 chunk）

/**
 * 创建子 Store 懒加载代理函数
 * @param {() => Promise<any>} importFn - 动态 import 工厂，如 () => import('./items')
 * @param {string} exportName - 模块导出的 Store 函数名，如 'useItemsStore'
 * @param {string} storeName - Store 名称（用于日志）
 * @returns {Function} 代理函数，调用方式与原 Store 函数完全一致
 */
function createLazyStoreProxy (importFn, exportName, storeName) {
  /** @type {Function|null} 缓存已加载的 Store 工厂函数 */
  let cachedStoreFn = null
  /** @type {Promise<void>|null} 正在进行的加载 Promise */
  let loadingPromise = null

  const proxy = function () {
    if (cachedStoreFn) {
      return cachedStoreFn()
    }

    // 如果正在加载中，抛出 loadingPromise
    // Vue 的 <Suspense> 或 async setup 会自动等待这个 Promise
    // 在非 Suspense 环境下，ensureGameStores 应已提前触发加载并等待完成
    if (loadingPromise) {
      throw loadingPromise
    }

    // 未触发过加载：自动触发（防御性编程）
    // 正常场景下 ensureGameStores() 应在 Main.vue 的顶层 await 中提前调用
    console.warn(`[Store] ${storeName} 未预加载，自动触发加载...`)
    proxy._load()
    throw loadingPromise
  }

  /**
   * 异步加载并缓存子 Store（由 ensureGameStores 统一调用）
   * @returns {Promise<void>}
   */
  proxy._load = async () => {
    if (cachedStoreFn) return
    try {
      loadingPromise = importFn().then(mod => {
        cachedStoreFn = mod[exportName]
        loadingPromise = null
      })
      await loadingPromise
    } catch (error) {
      loadingPromise = null
      console.error(`[Store] 加载 ${storeName} 失败:`, error)
      throw error
    }
  }

  return proxy
}

// ==================== 隐藏式动态 import ====================
// Vite 的静态分析会追踪所有 import() 调用，将目标模块列入依赖 chunk，
// 导致在 Select 页面加载 Main.vue 时预加载 ITEM_INFO/MONSTER_INFO 等重型 chunk。
//
// 解决方案：使用 /* @vite-ignore */ 注释让 Vite 跳过 import() 的预加载分析，
// 但仍使用字面量路径（而非变量），这样 Vite 能正确解析模块路径生成 chunk 文件名，
// 同时不会将目标模块列入 __vite__mapDeps 预加载列表。
// 只在 ensureGameStores() 实际执行时才加载这些模块。
// 参见：https://vitejs.dev/guide/features#dynamic-import

// 创建所有子 Store 的懒加载代理
// 注意：必须使用字面量路径 + @vite-ignore，不能用变量包装函数
// 否则 Vite 无法解析路径，构建产物中保留原始路径（无扩展名无hash），浏览器加载失败
const lazyItemsStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './items'), 'useItemsStore', 'useItemsStore')
const lazyMonstersStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './monsters'), 'useMonstersStore', 'useMonstersStore')
const lazyAutoBattleStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './autoBattle'), 'useAutoBattleStore', 'useAutoBattleStore')
const lazyPetsStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './pets'), 'usePetsStore', 'usePetsStore')
const lazyItemAwakenedStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './itemAwakened'), 'useItemAwakenedStore', 'useItemAwakenedStore')
const lazyRaisedPetSummonStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './raisedPetSummon'), 'useRaisedPetSummonStore', 'useRaisedPetSummonStore')
const lazyPickuppetSummonStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './pickuppetSummon'), 'usePickuppetSummonStore', 'usePickuppetSummonStore')
const lazyJobsStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './jobs'), 'useJobsStore', 'useJobsStore')
const lazyDescriptionsStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './descriptions'), 'useDescriptionsStore', 'useDescriptionsStore')
const lazyAchievementsStore = createLazyStoreProxy(() => import(/* @vite-ignore */ './achievements'), 'useAchievementsStore', 'useAchievementsStore')

// 对外导出：调用方式不变，但内部是懒加载代理
export const useItemsStore = lazyItemsStore
export const useMonstersStore = lazyMonstersStore
export const useAutoBattleStore = lazyAutoBattleStore
export const usePetsStore = lazyPetsStore
export const useItemAwakenedStore = lazyItemAwakenedStore
export const useRaisedPetSummonStore = lazyRaisedPetSummonStore
export const usePickuppetSummonStore = lazyPickuppetSummonStore
export const useJobsStore = lazyJobsStore
export const useDescriptionsStore = lazyDescriptionsStore
export const useAchievementsStore = lazyAchievementsStore

// ==================== 重型数据懒加载 ====================
/** @type {Function|null} 缓存 getPetDisplayValue */
let _getPetDisplayValue = null
/** @type {Function|null} 缓存 getJobChangeQuestChain */
let _getJobChangeQuestChain = null

/** @type {boolean} 重型数据是否已加载（ITEM_INFO/MONSTER_INFO/SKILL_INFO） */
let _heavyDataLoaded = false

/** @type {Promise<void>|null} 正在进行的加载 Promise，防止并发调用重复加载 */
let _ensurePromise = null

/**
* 确保所有游戏子 Store 和重型数据已加载
* 用途/业务意图：在进入游戏主页面时调用，触发所有重型模块的动态导入。
* 登录页不调用此方法，因此不会加载 ITEM_INFO/MONSTER_INFO 等大文件。
* 仅需调用一次，后续调用会立即返回（模块已缓存）。
* 支持并发调用：如果正在加载中，后续调用会等待同一个 Promise。
* @returns {Promise<void>}
*/
export async function ensureGameStores () {
  // 如果已加载过（包括重型数据），直接返回
  if (_getPetDisplayValue && _getJobChangeQuestChain && _heavyDataLoaded) {
    console.log('[Store] ensureGameStores: 已加载过，跳过')
    return
  }

  // 如果正在加载中，复用同一个 Promise，避免重复触发
  if (_ensurePromise) {
    console.log('[Store] ensureGameStores: 正在加载中，等待现有 Promise')
    return _ensurePromise
  }

  console.log('[Store] ensureGameStores: 开始加载所有子 Store...')
  const loadStart = performance.now()

  // 隐藏式动态 import：使用 /* @vite-ignore */ 绕过 Vite 静态分析
  // 防止 Vite 将这些模块列入 Main.vue 的依赖 chunk 预加载列表
  const importPetPeakConfig = () => import(/* @vite-ignore */ '@/data/PET_PEAK_CONFIG')
  const importJobChangeQuestConfig = () => import(/* @vite-ignore */ '@/data/JobChangeQuestConfig')

  // ★ 主动加载重型数据文件：ITEM_INFO/MONSTER_INFO/SKILL_INFO
  // 这些文件在构建时被 deferHeavyChunkPlugin 从 Main.vue chunk 的静态 import 中移除，
  // 改为延迟动态 import。此处确保它们在 ensureGameStores() 完成时已加载到内存，
  // 这样 Main.vue chunk 中的异步加载函数 __load_item_info() 等也会同时完成赋值
  const importItemInfo = () => import(/* @vite-ignore */ '@/data/ITEM_INFO.js')
  const importMonsterInfo = () => import(/* @vite-ignore */ '@/data/MONSTER_INFO.js')
  const importSkillInfo = () => import(/* @vite-ignore */ '@/data/SKILL_INFO.js')

  _ensurePromise = Promise.all([
    lazyItemsStore._load(),
    lazyMonstersStore._load(),
    lazyAutoBattleStore._load(),
    lazyPetsStore._load(),
    lazyItemAwakenedStore._load(),
    lazyRaisedPetSummonStore._load(),
    lazyPickuppetSummonStore._load(),
    lazyJobsStore._load(),
    lazyDescriptionsStore._load(),
    lazyAchievementsStore._load(),
    // 加载重型数据配置文件（使用变量间接引用，绕过 Vite 静态分析）
    importPetPeakConfig().then(mod => { _getPetDisplayValue = mod.getPetDisplayValue }),
    importJobChangeQuestConfig().then(mod => { _getJobChangeQuestChain = mod.getJobChangeQuestChain }),
    // ★ 主动加载重型数据，确保 Main.vue chunk 中的异步加载函数赋值完成
    importItemInfo(),
    importMonsterInfo(),
    importSkillInfo()
  ])

  try {
    await _ensurePromise
    _heavyDataLoaded = true
    console.log(`[Store] ensureGameStores: 所有子 Store 加载完成，耗时: ${(performance.now() - loadStart).toFixed(1)}ms`)
  } finally {
    _ensurePromise = null
  }
}

/**
 * 获取延迟加载的 getPetDisplayValue
 * @param {number} petId - 宠物 ID
 * @param {number} value - 属性值
 * @returns {{ isPeak: boolean, peakValue: number|null }} 巅峰状态信息
 */
function getPetDisplayValue (petId, value) {
  if (!_getPetDisplayValue) {
    throw new Error('[Store] getPetDisplayValue 尚未加载，请先调用 ensureGameStores()')
  }
  return _getPetDisplayValue(petId, value)
}

/**
 * 获取延迟加载的 getJobChangeQuestChain
 * @param {string} targetJobKey - 目标职业 key
 * @returns {Object|null} 任务链配置
 */
function getJobChangeQuestChain (targetJobKey) {
  if (!_getJobChangeQuestChain) {
    throw new Error('[Store] getJobChangeQuestChain 尚未加载，请先调用 ensureGameStores()')
  }
  return _getJobChangeQuestChain(targetJobKey)
}

const RAISED_PET_ABILITY_BUFF_ID = 'raisedpet_ability'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 玩家信息（_skipFinalStats 跳过初始属性计算，避免登录页加载 useItemsStore 等重型子 Store）
    player: new Player({ _skipFinalStats: true }),

    // Main 页面是否已就绪（用于全局 loading overlay 控制）
    // 路由切换到 /main 时设为 false，Main 组件 onMounted 后设为 true
    mainReady: false,

    // BUFF 版本号，用于触发 UI 更新（因为 activeBuffs 使用 markRaw 包装）
    buffVersion: 0,

    // 游戏数据
    gameData: {},

    // 战斗信息
    battle: {
      currentMap: '帕里大陆',
      mapLevelRange: '1-20',
      status: '等待战斗...',
      isAutoBattle: false,
      expMultiplier: 1.0,
      dropRate: 1.0
    },

    // 技能信息
    skills: {
      Q: { cd: 0, proficiency: 1, progress: 0 },
      W: { cd: 0, proficiency: 1, progress: 0 },
      E: { cd: 0, proficiency: 1, progress: 0 },
      R: { cd: 0, proficiency: 1, progress: 0 },
      T: { cd: 0, proficiency: 1, progress: 0 },
      Y: { cd: 0, proficiency: 1, progress: 0 },
      U: { cd: 0, proficiency: 1, progress: 0 },
      I: { cd: 0, proficiency: 1, progress: 0 },
      O: { cd: 0, proficiency: 1, progress: 0 },
      P: { cd: 0, proficiency: 1, progress: 0 }
    },

    // 背包信息
    inventory: {
      items: [],
      capacity: 165,
      used: 0
    },

    // 装备信息
    equipment: {
      weapon: null,
      shield: null,
      mask: null,
      cloak: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      earring1: null,
      earring2: null,
      fashionHat: null,
      fashionSuit: null,
      fashionGloves: null,
      fashionBoots: null
    },

    // 任务信息
    quests: {
      active: [],
      completed: []
    },

    // 设置
    settings: {
      volume: 1.0,
      sfxVolume: 1.0,
      monsterSfxVolume: 1.0,
      monsterMaxLevel: 3,
      monsterDisplayCount: 2,
      showDamageEffect: true,
      autoSaveInterval: 30,
      autoSellInterval: 5,
      autoHpRecoveryPercent: 50,
      autoMpRecoveryPercent: 50
    },

    // 套装数据
    equipmentSets: [],

    raisedPetAbilitySyncSignature: ''
  }),

  actions: {
    /**
     * 设置 Main 页面就绪状态
     * @param {boolean} ready - 是否就绪
     */
    setMainReady (ready) {
      this.mainReady = ready
    },

    updatePlayerVitals (snapshot) {
      const updates = {}
      const nextCurrentHealth = Number(snapshot?.currentHealth)
      const nextMaxHealth = Number(snapshot?.maxHealth)
      const nextCurrentMana = Number(snapshot?.currentMana)
      const nextMaxMana = Number(snapshot?.maxMana)

      if (Number.isFinite(nextCurrentHealth)) {
        updates.currentHealth = nextCurrentHealth
      }
      if (Number.isFinite(nextMaxHealth)) {
        updates.maxHealth = nextMaxHealth
      }
      if (Number.isFinite(nextCurrentMana)) {
        updates.currentMana = nextCurrentMana
      }
      if (Number.isFinite(nextMaxMana)) {
        updates.maxMana = nextMaxMana
      }

      if (!Object.keys(updates).length) {
        return
      }

      for (const [key, value] of Object.entries(updates)) {
        this.player[key] = value
      }

      this.player = Object.assign(Object.create(Object.getPrototypeOf(this.player)), this.player)
    },

    // 更新玩家信息
    updatePlayer (data, equipmentSets = null) {
      // 检查是否传入了完整的Player实例
      if (data instanceof Player) {
        // 如果是Player实例，创建新引用以确保响应式更新
        // 使用 Object.assign 创建新对象，保持 Player 原型链
        this.player = Object.assign(Object.create(Object.getPrototypeOf(data)), data)
      } else {
        // 否则使用原来的方法更新属性
        let equipmentChanged = false
        const updateKeys = data && typeof data === 'object' ? Object.keys(data) : []
        const shouldForceReplace =
          updateKeys.includes('currentHealth') ||
          updateKeys.includes('maxHealth') ||
          updateKeys.includes('currentMana') ||
          updateKeys.includes('maxMana') ||
          updateKeys.includes('exp') ||
          updateKeys.includes('maxExp') ||
          updateKeys.includes('level')

        // 判断是否需要重新计算最终属性（仅属性/装备/等级变化时才需要）
        const needsFinalStatsRecalc =
          equipmentChanged ||
          shouldForceReplace ||
          updateKeys.includes('stats') ||
          updateKeys.includes('equipment') ||
          updateKeys.includes('equipmentSets')

        for (const [key, value] of Object.entries(data)) {
          if (key === 'stats') {
            // 处理stats对象的更新
            this.player.stats = { ...this.player.stats, ...value }
          } else if (key === 'equipment') {
            // 特别处理equipment对象的更新，确保响应式更新
            // 创建全新的equipment对象以确保Vue能检测到变化
            this.player.equipment = { ...value }
            equipmentChanged = true
          } else {
            this.player[key] = value
          }
        }

        // 如果equipment发生了变化，创建一个新的Player实例来确保响应式更新
        if (equipmentChanged) {
          this.player = Object.assign(Object.create(Object.getPrototypeOf(this.player)), this.player)

          // 重新应用最终属性
          if (typeof this.player.applyFinalStats === 'function') {
            const sets = equipmentSets !== null ? equipmentSets : this.equipmentSets
            this.player.applyFinalStats(sets)
          }
        }

        if (shouldForceReplace && !equipmentChanged) {
          this.player = Object.assign(Object.create(Object.getPrototypeOf(this.player)), this.player)
        }

        // 仅在有属性变化时才重新计算最终属性（避免登录页设置 nickname 等不相关字段时触发重型计算）
        if (needsFinalStatsRecalc && typeof this.player.applyFinalStats === 'function') {
          // 使用传入的套装数据或store中的套装数据
          const sets = equipmentSets !== null ? equipmentSets : this.equipmentSets
          this.player.applyFinalStats(sets)
        }
      }
    },

    /**
     * 同步训养宠物（raisedpet）属性加成到玩家 activeBuffs
     * 用途/业务意图：保证玩家最终属性计算与详情面板展示都包含"召唤宠物"加成。
     * 说明：仅当存在召唤宠物且能量 > 0 时生效，能量不足则自动移除该 BUFF。
     * @returns {void}
     */
    syncRaisedPetAbilityBuff () {
      try {
        const raisedPetSummonStore = useRaisedPetSummonStore()
        const player = this.player
        const currentBuffs = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
        const hasSummonedPet = raisedPetSummonStore.hasSummonedPet
        const isActive = raisedPetSummonStore.isEnergyActive
        const currentEnergy = Number(raisedPetSummonStore.currentEnergy ?? 0)
        const maxEnergy = Number(raisedPetSummonStore.maxEnergy ?? 0)
        const parameter = String(raisedPetSummonStore.summonedPetBuffParameter || '').trim()
        const value = Number(raisedPetSummonStore.summonedPetBuffValue ?? 0)
        const rate = Boolean(raisedPetSummonStore.summonedPetBuffRate)
        const icon = raisedPetSummonStore.summonedPetIcon
        const petItem = raisedPetSummonStore.summonedPetItem
        const petName = (() => {
          const inline = petItem?.name
          if (typeof inline === 'string' && inline) {
            return inline
          }
          if (inline && typeof inline === 'object') {
            return inline.cns || inline.eng || inline.en || '训养宠物'
          }
          const id = Number(petItem?.id)
          if (Number.isFinite(id) && id > 0) {
            return `宠物#${id}`
          }
          return '训养宠物'
        })()

        // 先计算巅峰状态，用于 signature 比对
        const petId = Number(petItem?.petItemId ?? petItem?.id)
        const peakInfo = getPetDisplayValue(petId, value)
        const appliedValue = peakInfo.isPeak ? peakInfo.peakValue : value

        const signature = [
          hasSummonedPet ? '1' : '0',
          isActive ? '1' : '0',
          petName,
          Number.isFinite(currentEnergy) ? Math.max(0, Math.floor(currentEnergy)) : 'NaN',
          Number.isFinite(maxEnergy) ? Math.max(0, Math.floor(maxEnergy)) : 'NaN',
          parameter,
          Number.isFinite(value) ? value : 'NaN',
          rate ? '1' : '0',
          icon,
          peakInfo.isPeak ? 'peak' : 'normal'  // 加入巅峰状态
        ].join('|')

        if (signature === this.raisedPetAbilitySyncSignature) {
          return
        }

        const preserved =
          currentBuffs.find(buff => String(buff?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID) || null
        const nextBuffs = currentBuffs.filter(buff => String(buff?.id ?? '') !== RAISED_PET_ABILITY_BUFF_ID)

        const shouldApply =
          Boolean(hasSummonedPet && isActive && parameter) && Number.isFinite(value)

        if (shouldApply) {
          const safeCurrentEnergy = Number.isFinite(currentEnergy) ? Math.max(0, Math.floor(currentEnergy)) : 0
          const safeMaxEnergy = Number.isFinite(maxEnergy) ? Math.max(0, Math.floor(maxEnergy)) : 0
          const durationByEnergy = safeCurrentEnergy > 0 ? safeCurrentEnergy * 60 : 0
          const preservedEnergy = Number(preserved?.meta?.energy ?? NaN)
          const hasPreservedEnergy = Number.isFinite(preservedEnergy)
          const isEnergyIncreased = hasPreservedEnergy && safeCurrentEnergy > preservedEnergy
          const preservedDuration = Number(preserved?.duration ?? NaN)
          const baseDuration = Number.isFinite(preservedDuration) ? preservedDuration : durationByEnergy
          const resolvedDuration = isEnergyIncreased ? durationByEnergy : Math.min(baseDuration, durationByEnergy)

          nextBuffs.push({
            id: RAISED_PET_ABILITY_BUFF_ID,
            name: `训养宠物：${petName}`,
            description: safeMaxEnergy > 0 ? `能量 ${safeCurrentEnergy}/${safeMaxEnergy}` : '',
            icon: typeof icon === 'string' && icon ? icon : '/pt/item_icon/default_item.png',
            duration: resolvedDuration,
            type: 'buff',
            value: appliedValue,
            parameter,
            rate,
            addedAt: preserved?.addedAt ?? Date.now(),
            source: 'raisedpet',
            meta: {
              petName,
              energy: safeCurrentEnergy,
              maxEnergy: safeMaxEnergy,
              abilitySum: Number.isFinite(value) ? value : 0,
              parameter,
              rate: Boolean(rate),
              isPeak: peakInfo.isPeak,
              peakValue: peakInfo.isPeak ? peakInfo.peakValue : null
            }
          })
        }

        this.raisedPetAbilitySyncSignature = signature
        this.updatePlayer({ activeBuffs: nextBuffs })

        // 递增 buffVersion，通知 PlayerDetailModal 等监听组件刷新属性显示
        // 因为 applyFinalStats 使用 toRaw 修改原始对象，Vue 响应式无法自动检测变化
        // 必须通过 buffVersion 手动触发 watch -> statsVersion++ -> playerStats computed 重算
        this.buffVersion++

        // 注意：移除了同步保存操作，避免在 requestAnimationFrame 回调中执行耗时 I/O
        // 玩家数据保存由 useEventHandler 中的 savePlayerData 统一处理（带防抖）
      } catch (error) {
        console.error('[GameStore] 同步训养宠物属性失败:', error)
      }
    },

    // 完整替换玩家数据
    setPlayer (playerData, equipmentSets = {}) {
      // 确保playerData包含套装数据
      const playerDataWithSets = { ...playerData, equipmentSets }
      this.player = new Player(playerDataWithSets)
    },

    // 更新战斗状态
    updateBattle (data) {
      this.battle = { ...this.battle, ...data }
    },

    // 更新技能信息
    updateSkill (skillKey, data) {
      if (this.skills[skillKey]) {
        this.skills[skillKey] = { ...this.skills[skillKey], ...data }
      }
    },

    // 添加物品到背包
    addItem (item) {
      if (this.inventory.used < this.inventory.capacity) {
        this.inventory.items.push(item)
        this.inventory.used++
      }
    },

    // 移除背包物品
    removeItem (itemId) {
      const index = this.inventory.items.findIndex(item => item.id === itemId)
      if (index !== -1) {
        this.inventory.items.splice(index, 1)
        this.inventory.used--
      }
    },

    // 装备物品
    equipItem (slot, item) {
      this.equipment[slot] = item
    },

    // 卸下装备
    unequipItem (slot) {
      this.equipment[slot] = null
    },

    // 更新设置
    updateSettings (data) {
      this.settings = { ...this.settings, ...data }
    },

    // 更新套装数据
    updateEquipmentSets (data) {
      this.equipmentSets = data
    },

    // 设置游戏数据
    setGameData (data) {
      this.gameData = data
    },

    // ==================== 转职任务操作 ====================

    /**
     * 接受转职任务：初始化或更新任务链状态
     * @param {string} targetJobKey - 目标职业 key（如 'warrior'）
     * @param {number} questIndex - 任务索引
     */
    acceptJobChangeQuest (targetJobKey, questIndex) {
      const questChain = getJobChangeQuestChain(targetJobKey)
      if (!questChain) return

      const player = this.player
      if (!player) return

      // 互斥检查：如果已有其他职业的已接受转职任务，不允许接受新任务
      const states = [...(player.jobChangeQuests || [])]
      const hasOtherAccepted = states.some(chain =>
        chain.targetJobKey !== targetJobKey &&
        chain.quests.some(q => q.status === 'accepted')
      )
      if (hasOtherAccepted) return

      // 初始化或获取已有状态
      let chainState = states.find(s => s.targetJobKey === targetJobKey)

      if (!chainState) {
        // 首次创建该职业的任务链状态
        chainState = {
          targetJobKey,
          quests: questChain.quests.map((q, idx) => ({
            questId: q.id,
            status: idx === 0 ? 'available' : 'locked',
            killProgress: q.killTargets.map(t => ({
              monsterId: t.monsterId,
              current: 0,
              target: t.count
            }))
          })),
          allCompleted: false
        }
        states.push(chainState)
      }

      // 将指定索引的任务状态设为 accepted
      chainState.quests[questIndex].status = 'accepted'

      // ★ 始终从配置同步 killProgress，修复旧数据与配置不匹配的问题
      //    （如配置更新后新增了击杀目标，但已保存的玩家数据仍是旧版）
      const questConfigForSync = questChain.quests[questIndex]
      if (questConfigForSync && Array.isArray(questConfigForSync.killTargets)) {
        const existingProgress = chainState.quests[questIndex].killProgress || []
        chainState.quests[questIndex].killProgress = questConfigForSync.killTargets.map(t => {
          // 保留已有的击杀进度（如果目标 monsterId 相同）
          // ★ 使用 Number() 统一类型比较，避免字符串/数字不匹配
          const existing = existingProgress.find(ep => Number(ep.monsterId) === Number(t.monsterId))
          return {
            monsterId: t.monsterId,
            current: existing ? existing.current : 0,
            target: t.count
          }
        })
      }

      // 更新 allCompleted
      chainState.allCompleted = chainState.quests.every(q => q.status === 'completed')

      // 写回状态
      const existingIdx = states.findIndex(s => s.targetJobKey === targetJobKey)
      if (existingIdx >= 0) {
        states[existingIdx] = chainState
      }

      player.jobChangeQuests = states

      // ★ 同步写入 player.quest.activeQuests，让玩家任务面板也能看到转职任务
      const questConfig = questChain.quests[questIndex]
      if (questConfig && player.quest) {
        const activeQuestId = `job_change_${questConfig.id}`
        const alreadyInActive = (player.quest.activeQuests || []).some(q => q.id === activeQuestId)
        if (!alreadyInActive) {
          if (!Array.isArray(player.quest.activeQuests)) {
            player.quest.activeQuests = []
          }
          // 根据转职阶段动态获取最低等级（一转=15, 二转=60, 三转=166）
          const chainTier = questChain.tier || 1
          const questMinLevel = chainTier === 3 ? 166 : chainTier === 2 ? 60 : 15
          player.quest.activeQuests.push({
            id: activeQuestId,
            name: { cns: questConfig.name, en: questConfig.name },
            description: { cns: questConfig.description, en: questConfig.description },
            minLevel: questMinLevel,
            maxLevel: 190,
            endKillMonsters: questConfig.killTargets.map(t => ({
              monster: [t.monsterId],
              count: t.count,
              current: 0
            })),
            // 奖励字段：让玩家任务面板（QuestModal）能显示转职任务奖励
            endReceiveGold: questConfig.rewards?.gold || 0,
            endReceiveItems: (questConfig.rewards?.items || []).map(item => ({
              item: item.itemId,
              count: item.count
            })),
            /** 标记为转职任务，用于区分普通任务 */
            isJobChangeQuest: true,
            targetJobKey,
            questIndex,
            accepted: true
          })
        }
      }

      // 强制响应式更新
      this.player = Object.assign(Object.create(Object.getPrototypeOf(player)), player)

      // ★ 持久化到后端，防止刷新后丢失
      // savePlayerPatch 有10秒防抖，立即调用 flushPendingPatches 取消防抖强制发送
      storageService.savePlayerPatch({
        jobChangeQuests: player.jobChangeQuests,
        quest: player.quest
      })
      storageService.flushPendingPatches()
    },

    /**
     * 手动完成转职任务：将任务状态改为 completed，并解锁下一阶段为 available
     * 同时从 player.quest.activeQuests 移除并加入 completedQuests
     * @param {string} targetJobKey - 目标职业 key
     * @param {number} questIndex - 任务索引
     */
    completeJobChangeQuest (targetJobKey, questIndex) {
      const player = this.player
      if (!player) return

      const questChain = getJobChangeQuestChain(targetJobKey)
      if (!questChain || !questChain.quests[questIndex]) return

      const states = [...(player.jobChangeQuests || [])]
      const chainState = states.find(s => s.targetJobKey === targetJobKey)
      const questState = chainState?.quests?.[questIndex]

      // ★ 情况A：jobChangeQuests 中状态为 accepted → 正常完成流程
      // ★ 情况B：jobChangeQuests 中状态已为 completed → 仅清理 activeQuests
      const alreadyCompletedInChain = questState?.status === 'completed'

      if (questState && !alreadyCompletedInChain && questState.status !== 'accepted') {
        return
      }

      let shouldUpdateChain = false

      if (questState && !alreadyCompletedInChain) {
        // 确认击杀目标全部达标（检查 jobChangeQuests 中的 killProgress）
        let killCheck = questState.killProgress?.every(kp => kp.current >= kp.target) ?? false

        // 如果 jobChangeQuests 的进度检查不通过，再检查 player.quest.activeQuests 中的进度
        if (!killCheck && player.quest && Array.isArray(player.quest.activeQuests)) {
          const activeQuestId = `job_change_${questChain.quests[questIndex].id}`
          const activeQuest = player.quest.activeQuests.find(q => q.id === activeQuestId)
          if (activeQuest && Array.isArray(activeQuest.endKillMonsters)) {
            killCheck = activeQuest.endKillMonsters.every(m => (m.current || 0) >= (m.count || 0))
          }
        }

        if (!killCheck) return

        // ★ 发放任务奖励（金币 + 物品）
        const questConfig = questChain.quests[questIndex]
        if (questConfig?.rewards) {
          try {
            const { gold = 0, items = [] } = questConfig.rewards
            if (gold > 0 && player) {
              player.gold = (player.gold || 0) + gold
            }
            if (items.length > 0) {
              const itemsStore = useItemsStore()
              items.forEach(item => {
                itemsStore.addItemToBag(item.itemId, item.count)
              })
              // ★ 同步 player.bag 与 itemsStore.playerBag
              // 确保后续 savePlayerPatch 持久化时背包数据包含新增物品
              player.bag = [...itemsStore.playerBag]
            }
          } catch (rewardError) {
            console.error('[gameStore] 转职任务奖励发放失败:', rewardError)
          }
        }

        // 将当前任务标记为 completed
        chainState.quests[questIndex] = { ...questState, status: 'completed' }

        // 解锁下一阶段任务为 available
        if (questIndex + 1 < chainState.quests.length) {
          const nextQuest = chainState.quests[questIndex + 1]
          if (nextQuest.status === 'locked') {
            chainState.quests[questIndex + 1] = { ...nextQuest, status: 'available' }
          }
        }

        // 更新 allCompleted
        chainState.allCompleted = chainState.quests.every(q => q.status === 'completed')

        // 写回状态
        const existingIdx = states.findIndex(s => s.targetJobKey === targetJobKey)
        if (existingIdx >= 0) {
          states[existingIdx] = chainState
        }
        player.jobChangeQuests = states
        shouldUpdateChain = true
      }

      // ★ 从 player.quest.activeQuests 移除，加入 completedQuests
      // 无论 jobChangeQuests 中状态是否已更新，都尝试清理 activeQuests
      if (player.quest) {
        const activeQuestId = `job_change_${questChain.quests[questIndex].id}`
        const activeIdx = (player.quest.activeQuests || []).findIndex(q => q.id === activeQuestId)
        if (activeIdx >= 0) {
          const [completed] = player.quest.activeQuests.splice(activeIdx, 1)
          completed.completed = true
          completed.completeTime = Date.now()
          if (!Array.isArray(player.quest.completedQuests)) {
            player.quest.completedQuests = []
          }
          player.quest.completedQuests.push(completed)
        }
      }

      // 触发响应式更新
      this.player = Object.assign(Object.create(Object.getPrototypeOf(player)), player)

      // ★ 同步金币到 itemsStore 并派发 gold-update 事件，确保 UI 即时更新
      // 根因：completeJobChangeQuest 只更新了 player.gold，未同步 itemsStore.playerGold，
      // 导致 BagModal 等组件读取旧金币值（itemsStore.playerGold 优先于 player.gold）
      if (shouldUpdateChain) {
        try {
          const itemsStore = useItemsStore()
          itemsStore.playerGold = player.gold
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: player.gold } }))
          }
        } catch (syncError) {
          console.error('[gameStore] 转职任务金币同步失败:', syncError)
        }
      }

      // ★ 持久化到后端，防止刷新后丢失
      // savePlayerPatch 有10秒防抖，立即调用 flushPendingPatches 取消防抖强制发送
      storageService.savePlayerPatch({
        jobChangeQuests: player.jobChangeQuests,
        quest: player.quest,
        gold: player.gold,
        bag: player.bag
      })
      storageService.flushPendingPatches()
    },

    /**
     * 获取指定职业的转职任务链状态
     * @param {string} targetJobKey - 目标职业 key
     * @returns {Object|null} 任务链状态
     */
    getJobChangeQuestChainState (targetJobKey) {
      const player = this.player
      if (!player || !player.jobChangeQuests) return null
      return player.jobChangeQuests.find(s => s.targetJobKey === targetJobKey) ?? null
    },

    /**
     * 获取已接受转职任务的其他职业名称（非空表示被阻止）
     * @param {string} currentTarget - 当前目标职业 key
     * @returns {string|null} 阻止的职业名称，null 表示未被阻止
     */
    getOtherAcceptedJobName (currentTarget) {
      const player = this.player
      if (!player || !player.jobChangeQuests) return null
      for (const chain of player.jobChangeQuests) {
        if (chain.targetJobKey !== currentTarget && chain.quests.some(q => q.status === 'accepted')) {
          const questChain = getJobChangeQuestChain(chain.targetJobKey)
          return questChain?.targetJobName ?? chain.targetJobKey
        }
      }
      return null
    },

    /**
     * 更新转职任务击杀进度（由战斗系统调用）
     * @param {number} monsterId - 被击杀的怪物 ID
     */
    /**
     * 放弃转职任务：将已接受的任务回退为 available，并从 player.quest.activeQuests 中移除
     * @param {string} targetJobKey - 目标职业 key
     * @param {number} questIndex - 任务索引
     */
    abandonJobChangeQuest (targetJobKey, questIndex) {
      const player = this.player
      if (!player) return

      const states = [...(player.jobChangeQuests || [])]
      const chainState = states.find(s => s.targetJobKey === targetJobKey)
      if (!chainState) return

      const questState = chainState.quests[questIndex]
      if (!questState || questState.status !== 'accepted') return

      // 将任务状态回退为 available
      chainState.quests[questIndex] = { ...questState, status: 'available' }

      // 重置击杀进度
      chainState.quests[questIndex].killProgress = questState.killProgress.map(kp => ({
        ...kp,
        current: 0
      }))

      // 更新 allCompleted
      chainState.allCompleted = chainState.quests.every(q => q.status === 'completed')

      // 写回状态
      const existingIdx = states.findIndex(s => s.targetJobKey === targetJobKey)
      if (existingIdx >= 0) {
        states[existingIdx] = chainState
      }

      player.jobChangeQuests = states

      // ★ 从 player.quest.activeQuests 中移除
      const questChain = getJobChangeQuestChain(targetJobKey)
      if (questChain && questChain.quests[questIndex] && player.quest) {
        const questConfig = questChain.quests[questIndex]
        const activeQuestId = `job_change_${questConfig.id}`
        if (Array.isArray(player.quest.activeQuests)) {
          const activeIdx = player.quest.activeQuests.findIndex(q => q.id === activeQuestId)
          if (activeIdx >= 0) {
            player.quest.activeQuests.splice(activeIdx, 1)
          }
        }
      }

      this.player = Object.assign(Object.create(Object.getPrototypeOf(player)), player)

      // ★ 持久化到后端，防止刷新后丢失
      // savePlayerPatch 有10秒防抖，立即调用 flushPendingPatches 取消防抖强制发送
      storageService.savePlayerPatch({
        jobChangeQuests: player.jobChangeQuests,
        quest: player.quest
      })
      storageService.flushPendingPatches()
    },

    /**
     * 更新转职任务击杀进度（由战斗系统调用）
     * 同步更新 player.quest.activeQuests 中对应任务的击杀计数
     * ★ 副本专属怪物（如[暗影中尉]克里顿）只能在副本中击杀，
     *   main 页面自动战斗的击杀不计入进度
     * @param {number} monsterId - 被击杀的怪物 ID
     * @param {boolean} [isFromDungeon=false] - 是否来自副本系统击杀
     */
    updateJobChangeQuestKillProgress (monsterId, isFromDungeon = false) {
      const player = this.player
      if (!player || !player.jobChangeQuests) return

      // ★ 统一转换为数字类型，避免字符串/数字类型不匹配导致进度不更新
      const numericMonsterId = Number(monsterId)
      if (!Number.isFinite(numericMonsterId)) return

      // ★ 副本专属怪物在非副本场景下不计入转职任务击杀进度
      if (!isFromDungeon && isDungeonOnlyMonster(numericMonsterId)) return

      let updated = false
      const states = player.jobChangeQuests.map(chain => {
        const newQuests = chain.quests.map(q => {
          if (q.status !== 'accepted') return q
          const newKillProgress = q.killProgress.map(kp => {
            // ★ 使用 Number() 统一类型比较，避免字符串/数字不匹配
            if (Number(kp.monsterId) === numericMonsterId && kp.current < kp.target) {
              updated = true
              return { ...kp, current: kp.current + 1 }
            }
            return kp
          })
          return { ...q, killProgress: newKillProgress }
        })
        return { ...chain, quests: newQuests }
      })

      if (updated) {
        player.jobChangeQuests = states

        // ★ 同步更新 player.quest.activeQuests 中转职任务的击杀计数
        if (player.quest && Array.isArray(player.quest.activeQuests)) {
          for (const activeQuest of player.quest.activeQuests) {
            if (!activeQuest.isJobChangeQuest || !Array.isArray(activeQuest.endKillMonsters)) continue
            for (const monsterReq of activeQuest.endKillMonsters) {
              // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
              if (Array.isArray(monsterReq.monster) &&
                monsterReq.monster.some(m => Number(m) === numericMonsterId)) {
                if ((monsterReq.current || 0) < monsterReq.count) {
                  monsterReq.current = (monsterReq.current || 0) + 1
                }
              }
            }
          }
        }

        this.player = Object.assign(Object.create(Object.getPrototypeOf(player)), player)

        // ★ 持久化到后端，防止刷新后丢失
        // savePlayerPatch 有10秒防抖，立即调用 flushPendingPatches 取消防抖强制发送
        storageService.savePlayerPatch({
          jobChangeQuests: player.jobChangeQuests,
          quest: player.quest
        })
        storageService.flushPendingPatches()
      }
    }
  },

  getters: {
    // 计算玩家属性
    playerStats: state => {
      return {
        healthPercentage: (state.player.currentHealth / state.player.maxHealth) * 100,
        manaPercentage: (state.player.currentMana / state.player.maxMana) * 100,
        expPercentage: (state.player.currentExp / state.player.maxExp) * 100
      }
    },

    // 获取背包使用率
    inventoryUsage: state => {
      return Math.round((state.inventory.used / state.inventory.capacity) * 100)
    },

    /**
     * 获取当前进行中转职任务要求击杀的怪物 ID 列表
     * 用于自动战斗刷新怪物时优先显示任务目标怪物
     * @returns {number[]} 需要优先击杀的怪物 ID 数组（去重）
     */
    jobChangeQuestMonsterIds: state => {
      const quests = state.player?.jobChangeQuests
      if (!Array.isArray(quests)) return []
      const ids = new Set()
      for (const chain of quests) {
        if (!Array.isArray(chain.quests)) continue
        for (const q of chain.quests) {
          if (q.status !== 'accepted') continue
          if (!Array.isArray(q.killProgress)) continue
          for (const kp of q.killProgress) {
            // 只添加尚未完成的击杀目标
            // ★ 使用 Number() 统一类型，确保下游比较一致
            const numericId = Number(kp.monsterId)
            if (Number.isFinite(numericId) && numericId > 0 && (kp.current || 0) < (kp.target || 0)) {
              // ★ 副本专属怪物不加入优先刷新列表，避免在 main 页面自动战斗中出现
              if (isDungeonOnlyMonster(numericId)) continue
              ids.add(numericId)
            }
          }
        }
      }
      return [...ids]
    },

    /**
     * 获取当前需要强制刷新的堕落BOSS怪物 ID
     * 当三转任务「实力证明2 堕落BOSS」处于已接受状态时，
     * 返回按任务顺序第一个未完成的堕落BOSS怪物 ID，用于自动战斗中必定刷新该BOSS。
     * 任务完成或不存在时返回 null，自动战斗恢复正常的BOSS概率设置。
     * @returns {number|null} 下一个需要击杀的堕落BOSS怪物 ID，无则返回 null
     */
    activeFallenBossTarget: state => {
      const jobChangeQuests = state.player?.jobChangeQuests
      if (!Array.isArray(jobChangeQuests)) {
        return null
      }
      return getActiveFallenBossTarget(jobChangeQuests)
    },

    // 计算套装属性加成
    setBonuses: state => {
      // 获取装备的物品
      const equippedItems = Object.values(state.equipment).filter(item => item !== null)

      // 如果没有装备或没有套装数据，返回空属性
      if (
        equippedItems.length === 0 ||
        !state.equipmentSets ||
        (typeof state.equipmentSets !== 'object' && !Array.isArray(state.equipmentSets))
      ) {
        return {
          strength: 0,
          dexterity: 0,
          intelligence: 0,
          constitution: 0,
          agility: 0,
          attack: 0,
          defense: 0,
          maxHealth: 0,
          maxMana: 0,
          criticalRate: 0,
          criticalDamage: 0,
          attackSpeed: 0,
          moveSpeed: 0
        }
      }

      // 计算套装属性
      try {
        const setBonusService = new SetBonusService()
        return setBonusService.calculateSetBonuses(equippedItems, state.equipmentSets)
      } catch (error) {
        console.error('计算套装属性失败:', error)
        // 返回默认属性
        return {
          strength: 0,
          dexterity: 0,
          intelligence: 0,
          constitution: 0,
          agility: 0,
          attack: 0,
          defense: 0,
          maxHealth: 0,
          maxMana: 0,
          criticalRate: 0,
          criticalDamage: 0,
          attackSpeed: 0,
          moveSpeed: 0
        }
      }
    }
  }
})
