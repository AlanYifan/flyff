/**
 * 怪物数据统一管理 Store
 * 统一管理怪物静态数据和运行时数据
 */
import { defineStore } from 'pinia'
import { markRaw, toRaw } from 'vue'
import { MONSTER_RANK_NAMES } from '@/store/descriptions'
import { useGameStore } from '@/store'
import { monsterTransitionBatcher } from '@/services/autoBattle/MonsterTransitionBatcher'
import { getActiveFallenBossTarget } from '@/utils/jobChangeQuestHelper'

const availableMonstersCache = new Map()
const availableMonstersForAutoBattleCache = new Map()
const SHOULD_LOG_MONSTER_POOL = false
const isDev = import.meta.env.DEV === true
const debug = () => {}

/**
 * monstersUiSnapshot 缓存 — 避免单个怪物属性变更时创建全部新对象
 * Vue 细粒度响应式会在单个怪物属性变化时触发 getter 重算，
 * 通过浅比较复用未变化的对象引用，让 Vue v-for 跳过未变化 item 的 patch
 */
let _snapshotCache = null

/**
 * 浅比较两个怪物快照对象是否等价
 * 用于判断属性变更后数据是否实际变化，避免不必要的 Vue 重渲染
 * @param {object|null} a - 快照对象 A
 * @param {object|null} b - 快照对象 B
 * @returns {boolean} 是否等价
 */
function _monsterSnapshotEqual (a, b) {
  if (a === b) return true
  if (!a || !b) return false

  // 低频动态字段比较（死亡/狂暴相关，非战斗高频）
  if (a.isDefeated !== b.isDefeated) return false
  if (a.isHidden !== b.isHidden) return false
  if (a.isFading !== b.isFading) return false
  if (a.defeatedAt !== b.defeatedAt) return false
  if (a.isBerserk !== b.isBerserk) return false
  if (a.berserkThresholdHP !== b.berserkThresholdHP) return false
  if (a.berserkAttackPower !== b.berserkAttackPower) return false
  if (a.berserkActivatedAt !== b.berserkActivatedAt) return false

  // 静态字段比较（通常不变，但需覆盖 monster 换批的场景）
  if (a.index !== b.index) return false
  if (a.id !== b.id) return false
  if (a.name !== b.name) return false
  if (a.level !== b.level) return false
  if (a.icon !== b.icon) return false
  if (a.rank !== b.rank) return false
  if (a.element !== b.element) return false

  // 注意：health 字段（currentHealth/maxHealth/healthPercentage）已从快照中移除
  // Canvas 直接从 monsterVitals TypedArray 读取，不经过 Vue 响应式系统
  // 注意：debuff 字段已从快照中移除
  // Canvas 直接从 currentMonsters proxy 读取，debuff 写入使用 toRaw 绕过响应式

  return true
}

/**
 * 怪物 rank 颜色映射常量
 * 用于根据怪物等级类型显示不同颜色的名称
 */
export const MONSTER_RANK_COLORS = {
  giant: 'rgb(251, 32, 3)',
  violet: 'rgb(172, 3, 251)',
  boss: 'rgb(251, 3, 3)',
  super: 'rgba(3, 251, 20, 0.7)',
  captain: 'rgb(255, 165, 0)',
  material: 'rgba(136, 136, 136, 0.76)',
  small: 'rgb(200, 200, 200)',
  normal: 'rgb(255, 255, 255)',
  default: 'rgb(255, 255, 255)'
}

export const useMonstersStore = defineStore('monsters', {
  state: () => ({
    // ========== 静态数据 ==========
    // 静态怪物配置数据（由 StaticGameInitializer 加载）
    staticMonsters: {},

    // ========== 运行时数据 ==========
    // 当前地图的怪物实例
    currentMonsters: [],

    // 怪物数组固定长度（用于UI布局）
    monsterArraySize: 30,

    // ========== 对象池 ==========
    // 怪物对象池，用于复用怪物实例
    monsterPool: [],
    poolMaxSize: 50, // 对象池最大容量

    // ========== 地图相关 ==========
    currentMapName: '',
    currentMapLevelRange: '',

    // ========== 统计数据 ==========
    defeatedCount: 0,
    totalKilled: 0,

    // ========== 刷新相关 ==========
    isRefreshing: false,
    lastRefreshTime: null,
    refreshInterval: 1500, // ms

    // ========== 自动战斗提示 ==========
    lastAutoBattleNotice: null,

    // ========== UI 快照（高频血量专用）==========
    /**
     * 怪物生命值/血量百分比等高频字段的 TypedArray 容器（避免频繁触发 Vue 响应式）。
     * @type {null|{size:number,currentHealth:Int32Array,maxHealth:Int32Array,healthPercentage:Uint8Array,isDefeated:Uint8Array}}
     */
    monsterVitals: null
  }),

  getters: {
    // ========== 获取器 ==========

    /**
     * 获取所有存活的怪物
     * Vue 细粒度响应式：仅追踪 monster.isDefeated 属性
     * currentHealth 变化不触发重算（由 Canvas 从 TypedArray 读取）
     */
    aliveMonsters: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      const output = []
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) continue
        if (!monster.isDefeated) {
          output.push(monster)
        }
      }
      return output
    },

    /**
     * 获取所有已死亡的怪物
     * Vue 细粒度响应式：仅追踪 monster.isDefeated 属性
     */
    deadMonsters: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      const output = []
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) continue
        if (monster.isDefeated) {
          output.push(monster)
        }
      }
      return output
    },

    /**
     * 检查是否所有怪物都被击败
     * Vue 细粒度响应式：仅追踪 monster.isDefeated 属性
     */
    allDefeated: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      if (list.length === 0) return false
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) continue
        if (!monster.isDefeated) {
          return false
        }
      }
      return true
    },

    /**
     * 获取存活怪物的数量
     * Vue 细粒度响应式：仅追踪 monster.isDefeated 属性
     */
    aliveCount: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      let count = 0
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) continue
        if (!monster.isDefeated) {
          count += 1
        }
      }
      return count
    },

    /**
     * 获取已击败怪物的数量
     * Vue 细粒度响应式：仅追踪 monster.isDefeated 属性
     */
    defeatedCountGetter: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      let count = 0
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) continue
        if (monster.isDefeated) {
          count += 1
        }
      }
      return count
    },

    /**
     * 获取可用于 UI 的怪物快照（仅静态 + 低频字段，高频血量/debuff 由 Canvas 直接读取）
     *
     * 快照仅包含：id, name, icon, level, rank, element（静态）
     *           + isHidden, isFading, isDefeated, defeatedAt, isBerserk 等（低频动态）
     *
     * Vue 细粒度响应式：当单个怪物的 isDefeated/isFading/isHidden/isBerserk 变化时，
     * 仅触发本 getter 重算，通过快照缓存复用未变化对象，实现 v-for 定向 patch。
     *
     * 高频字段（currentHealth, maxHealth, healthPercentage, 所有 debuff）已从此快照移除：
     * - 血量数据由 Canvas renderOverlayFrame 直接从 monsterVitals TypedArray 读取
     * - Debuff 数据由 Canvas 直接从 currentMonsters proxy 读取（写入使用 toRaw）
     *
     * @returns {Array<null|{index:number,id:any,name:string,level:number,icon:string,rank:any,element:any,isDefeated:boolean,isHidden:boolean,isFading:boolean,defeatedAt:number|null,isBerserk:boolean}>}
     */
    monstersUiSnapshot: state => {
      const list = Array.isArray(state.currentMonsters) ? state.currentMonsters : []
      const prevSnapshot = _snapshotCache
      const output = new Array(list.length)
      let hasChanged = false

      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) {
          output[i] = null
          if (prevSnapshot?.[i] !== null) hasChanged = true
          continue
        }

        // 仅包含静态 + 低频字段（不包含 health / debuff）
        const newObj = {
          index: Number.isFinite(Number(monster.index)) ? Number(monster.index) : i,
          id: monster.id,
          name: monster.name || '未知怪物',
          level: Number(monster.level) || 1,
          icon: monster.icon,
          rank: monster.rank,
          element: monster.element,
          isHidden: monster.isHidden === true,
          isFading: monster.isFading === true,
          isDefeated: monster.isDefeated === true,
          defeatedAt: Number.isFinite(Number(monster.defeatedAt)) ? Number(monster.defeatedAt) : null,
          isBerserk: monster.isBerserk === true,
          berserkThresholdHP: Number(monster.berserkThresholdHP) || 0,
          berserkAttackPower: Number(monster.berserkAttackPower) || 0,
          berserkActivatedAt: Number.isFinite(Number(monster.berserkActivatedAt)) ? Number(monster.berserkActivatedAt) : null
        }

        // 与上一帧快照比较：未变化则复用旧引用，Vue v-for 可跳过该 item 的 patch
        const prevObj = prevSnapshot?.[i]
        if (prevObj && _monsterSnapshotEqual(prevObj, newObj)) {
          output[i] = prevObj
        } else {
          output[i] = newObj
          hasChanged = true
        }
      }

      // 所有怪物数据均未变化时，返回缓存的数组引用
      // Vue computed 检测到返回值未变（同一引用），不会触发下游组件重渲染
      if (!hasChanged && prevSnapshot && output.length === prevSnapshot.length) {
        return prevSnapshot
      }

      _snapshotCache = output
      return output
    },

    /**
     * 根据怪物 rank 获取名称显示颜色
     * @param {string} rank - 怪物等级类型
     * @returns {string} CSS 颜色值
     */
    getMonsterRankColor: () => rank => {
      return MONSTER_RANK_COLORS[rank?.toLowerCase()] || MONSTER_RANK_COLORS.default
    }
  },

  actions: {
    /**
     * 确保怪物 vitals TypedArray 容量满足 monsterArraySize，并可选进行重置。
     * @param {{ reset?: boolean }} [options]
     * @returns {void}
     */
    ensureMonsterVitals (options = {}) {
      const { reset = false } = options || {}
      const size = Math.max(0, Number(this.monsterArraySize) || 0)
      const current = this.monsterVitals
      const shouldAllocate = !current || !Number.isInteger(current.size) || current.size !== size

      if (!shouldAllocate && !reset) {
        return
      }

      if (shouldAllocate) {
        const vitals = {
          size,
          currentHealth: new Int32Array(size),
          maxHealth: new Int32Array(size),
          healthPercentage: new Uint8Array(size),
          isDefeated: new Uint8Array(size)
        }
        this.monsterVitals = markRaw(vitals)
      }

      if (reset && this.monsterVitals) {
        this.monsterVitals.currentHealth.fill(0)
        this.monsterVitals.maxHealth.fill(0)
        this.monsterVitals.healthPercentage.fill(0)
        this.monsterVitals.isDefeated.fill(0)
      }
    },

    /**
     * 将 currentMonsters 的当前生命值等字段同步到 TypedArray（供 UI 快照使用）。
     * @returns {void}
     */
    syncMonsterVitalsFromMonsters () {
      this.ensureMonsterVitals()
      const vitals = this.monsterVitals
      if (!vitals) {
        return
      }

      const list = Array.isArray(this.currentMonsters) ? this.currentMonsters : []
      const len = Math.min(list.length, vitals.size)
      for (let i = 0; i < len; i++) {
        const monster = list[i]
        if (!monster) {
          vitals.currentHealth[i] = 0
          vitals.maxHealth[i] = 0
          vitals.healthPercentage[i] = 0
          vitals.isDefeated[i] = 0
          continue
        }
        const maxHealth = Math.max(0, Number(monster.maxHealth) || 0)
        const currentHealth = Math.max(0, Number(monster.currentHealth) || 0)
        const healthPercentage = Math.max(
          0,
          Math.min(100, Math.round(maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0))
        )
        vitals.maxHealth[i] = maxHealth
        vitals.currentHealth[i] = currentHealth
        vitals.healthPercentage[i] = healthPercentage
        vitals.isDefeated[i] = monster.isDefeated === true || currentHealth <= 0 ? 1 : 0
      }

      for (let i = len; i < vitals.size; i++) {
        vitals.currentHealth[i] = 0
        vitals.maxHealth[i] = 0
        vitals.healthPercentage[i] = 0
        vitals.isDefeated[i] = 0
      }
    },

    // ========== 对象池管理 ==========

    /**
     * 从对象池获取怪物实例
     * @returns {Object|null} 怪物实例或null
     */
    getMonsterFromPool () {
      if (this.monsterPool.length > 0) {
        const monster = this.monsterPool.pop()
        if (SHOULD_LOG_MONSTER_POOL) {
          debug('[MonstersStore] 从对象池获取怪物实例:', monster.id)
        }
        return monster
      }
      return null
    },

    /**
     * 将怪物实例放回对象池
     * @param {Object} monster - 怪物实例
     */
    returnMonsterToPool (monster) {
      if (!monster) {
        return
      }

      // 清除 DOT 效果
      if (Array.isArray(monster.dotEffects) && monster.dotEffects.length > 0) {
        for (let i = 0; i < monster.dotEffects.length; i++) {
          const timerId = monster.dotEffects[i]?.timerId
          if (timerId !== null && timerId !== undefined) {
            clearTimeout(timerId)
          }
        }
        monster.dotEffects.length = 0
      } else if (!Array.isArray(monster.dotEffects)) {
        monster.dotEffects = []
      }

      // 如果对象池未满，则放回池中
      if (this.monsterPool.length < this.poolMaxSize) {
        // 重置怪物状态
        monster.currentHealth = monster.maxHealth
        monster.healthPercentage = 100
        monster.isDefeated = false
        monster.defeatCounted = false

        this.monsterPool.push(monster)
        if (SHOULD_LOG_MONSTER_POOL) {
          debug('[MonstersStore] 怪物实例放回对象池:', monster.id)
        }
      }
    },

    /**
     * 清空对象池
     */
    clearMonsterPool () {
      this.monsterPool = []
      debug('[MonstersStore] 对象池已清空')
    },

    // ========== 静态数据管理 ==========

    /**
     * 加载静态怪物数据（从静态文件）
     * @param {Object} monstersData - 怪物配置数据对象
     */
    loadStaticData (monstersData) {
      debug('[MonstersStore] 加载静态怪物数据，数量:', Object.keys(monstersData || {}).length)
      this.staticMonsters = Object.freeze(monstersData || {})
      availableMonstersCache.clear()
      availableMonstersForAutoBattleCache.clear()
    },

    /**
     * 获取怪物配置
     * @param {string} monsterId - 怪物ID
     * @returns {Object|null} 怪物配置数据
     */
    getMonsterConfig (monsterId) {
      return this.staticMonsters[monsterId] || null
    },

    // ========== 运行时数据管理 ==========

    /**
     * 生成怪物（根据地图）- 使用对象池优化
     * @param {string} mapName - 地图名称
     * @param {string} levelRange - 等级范围（例如 "1-20"）
     * @param {number} count - 要生成的怪物数量
     */
    spawnMonsters (mapName, levelRange, count) {
      debug('[MonstersStore] 开始生成怪物:', { mapName, levelRange, count })

      // 将被击败的怪物放回对象池
      this.currentMonsters.forEach(monster => {
        if (monster && (monster.isDefeated || monster.currentHealth <= 0)) {
          this.returnMonsterToPool(monster)
        }
      })

      // 清除现有怪物
      this.clearMonsters()

      // 设置地图信息
      this.currentMapName = mapName
      this.currentMapLevelRange = levelRange

      // 筛选符合地图和等级的怪物
      const availableMonsters = this.getAvailableMonsters(mapName, levelRange)

      // ★ 提前获取强制堕落BOSS目标，用于判断是否可以跳过 availableMonsters 空检查
let forcedBossMonsterId = null
try {
const gameStore = useGameStore()
// 直接从 player.jobChangeQuests 计算，绕过 Pinia getter 缓存问题
const jobChangeQuests = gameStore?.player?.jobChangeQuests
forcedBossMonsterId = Array.isArray(jobChangeQuests)
  ? (getActiveFallenBossTarget(jobChangeQuests) || null)
  : null
} catch (e) {
// store 尚未初始化时忽略
}

      // ★ 如果没有候选怪物且没有强制堕落BOSS，才返回
      if (availableMonsters.length === 0 && !forcedBossMonsterId) {
        debug('[MonstersStore] 没有找到符合条件的怪物')
        return
      }

      debug('[MonstersStore] 可用怪物数量:', availableMonsters.length)
      debug('[MonstersStore] 对象池当前大小:', this.monsterPool.length)

      // 生成指定数量的怪物
      const spawnCount = Math.min(count, this.monsterArraySize)

      // ★ 获取转职任务优先击杀的怪物 ID 列表（forcedBossMonsterId 已提前获取）
      let priorityMonsterIds = []
      try {
        const gameStore = useGameStore()
        priorityMonsterIds = Array.isArray(gameStore.jobChangeQuestMonsterIds)
          ? gameStore.jobChangeQuestMonsterIds
          : []
      } catch (e) {
        // store 尚未初始化时忽略
      }
      // ★ 从 staticMonsters 中获取优先怪物（排除强制BOSS避免重复）
      const priorityAvailable = priorityMonsterIds.length > 0
        ? (forcedBossMonsterId
            ? priorityMonsterIds.filter(id => Number(id) !== forcedBossMonsterId)
            : priorityMonsterIds)
            .map(id => this.staticMonsters[id])
            .filter(m => m !== null && m !== undefined)
        : []

      // ★ 获取强制堕落BOSS配置
      const forcedBossConfig = forcedBossMonsterId
        ? this.staticMonsters[forcedBossMonsterId]
        : null
      // ★ 如果有强制堕落BOSS，随机选择一个位置放置
      const forcedBossIndex = forcedBossConfig
        ? Math.floor(Math.random() * spawnCount)
        : -1

      this.ensureMonsterVitals({ reset: true })
      for (let i = 0; i < spawnCount; i++) {
        let selectedMonster

        // ★ 强制堕落BOSS优先放置在随机位置
        if (i === forcedBossIndex && forcedBossConfig) {
          selectedMonster = forcedBossConfig
        } else if (priorityAvailable.length > 0 && Math.random() < 0.6) {
          // ★ 优先使用转职任务目标怪物（已排除强制BOSS避免重复）
          selectedMonster = priorityAvailable[Math.floor(Math.random() * priorityAvailable.length)]
        } else {
          selectedMonster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
        }

        // 尝试从对象池获取
        let monsterInstance = this.getMonsterFromPool()

        if (monsterInstance) {
          // 复用实例，重新初始化
          this.reinitializeMonsterInstance(monsterInstance, i, selectedMonster)
        } else {
          // 创建新实例
          monsterInstance = this.createMonsterInstance(i, selectedMonster)
        }

        this.currentMonsters[i] = monsterInstance
        const vitals = this.monsterVitals
        if (vitals && i < vitals.size) {
          const maxHealth = Math.max(0, Number(monsterInstance.maxHealth) || 0)
          const currentHealth = Math.max(0, Number(monsterInstance.currentHealth) || 0)
          vitals.maxHealth[i] = maxHealth
          vitals.currentHealth[i] = currentHealth
          vitals.healthPercentage[i] = Math.max(
            0,
            Math.min(100, Math.round(maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0))
          )
          vitals.isDefeated[i] = monsterInstance.isDefeated === true || currentHealth <= 0 ? 1 : 0
        }
      }

      this.lastRefreshTime = Date.now()
      // 触发数组引用变更，让 watch(currentMonsters) 重建索引缓存
      this.currentMonsters = [...this.currentMonsters]
      debug('[MonstersStore] 生成怪物完成，实际生成数量:', spawnCount)
    },

    /**
     * 创建怪物实例
     * @param {number} index - 怪物索引
     * @param {Object} monsterData - 怪物配置数据
     * @returns {Object} 怪物实例
     */
  createMonsterInstance (index, monsterData) {
    const rawElement = monsterData.element || 'none'
    const normalizedElement =
      typeof rawElement === 'string' ? rawElement.toLowerCase() : 'none'
    const elementType = normalizedElement === 'thunder' ? 'electricity' : normalizedElement

    // 狂暴相关属性：从静态数据读取阈值和增伤比例
    const berserkThresholdHP = Number(monsterData.berserkThresholdHP) || 0
    const berserkAttackPower = Number(monsterData.berserkAttackPower) || 0

    return {
      id: monsterData.id,
      index,
      name:
        typeof monsterData.name === 'object'
          ? monsterData.name.cns || monsterData.name.en || '未知怪物'
          : monsterData.name || '未知怪物',
      level: monsterData.level || 1,
      maxHealth: monsterData.hp || 100,
      currentHealth: monsterData.hp || 100,
      healthPercentage: 100,
      icon: `/pt/monster_icon/${monsterData.id}.png`,
      minAttack: monsterData.minAttack || 10,
      maxAttack: monsterData.maxAttack || 20,
      defense: monsterData.defense || 5,
      magicDefense: monsterData.magicDefense || 5,
      speed: monsterData.speed || 100,
      giveExp: monsterData.exp || monsterData.level * 50,
      minDropGold: monsterData.minDropGold || 0,
      maxDropGold: monsterData.maxDropGold || 0,
      drops: monsterData.drops || [],
      rank: monsterData.rank || 'normal',
      element: normalizedElement,
      elementType,
      isDefeated: false,
      defeatCounted: false,
      isHidden: false,
      isFading: false,
      defeatedAt: null,
      fadeTimer: null,
      hideTimer: null,
      dotEffects: [],
      // 狂暴系统属性
      berserkThresholdHP,
      berserkAttackPower,
      isBerserk: false,
      berserkActivatedAt: null
    }
  },

    /**
     * 重新初始化怪物实例（用于对象池复用）
     * @param {Object} monster - 怪物实例
     * @param {number} index - 新的索引
     * @param {Object} monsterData - 怪物配置数据
     */
    reinitializeMonsterInstance (monster, index, monsterData) {
      // 更新索引和位置
      monster.index = index

      // 更新属性（如果怪物类型不同）
      if (monster.id !== monsterData.id) {
        monster.id = monsterData.id
        monster.name =
          typeof monsterData.name === 'object'
            ? monsterData.name.cns || monsterData.name.en || '未知怪物'
            : monsterData.name || '未知怪物'
        monster.level = monsterData.level || 1
        monster.maxHealth = monsterData.hp || 100
        monster.icon = `/pt/monster_icon/${monsterData.id}.png`
        monster.minAttack = monsterData.minAttack || 10
        monster.maxAttack = monsterData.maxAttack || 20
        monster.defense = monsterData.defense || 5
        monster.magicDefense = monsterData.magicDefense || 5
        monster.speed = monsterData.speed || 100
        monster.giveExp = monsterData.exp || monsterData.level * 50
        monster.minDropGold = monsterData.minDropGold || 0
        monster.maxDropGold = monsterData.maxDropGold || 0
        monster.drops = monsterData.drops || []
        monster.rank = monsterData.rank || 'normal'
        const rawElement = monsterData.element || 'none'
        const normalizedElement =
          typeof rawElement === 'string' ? rawElement.toLowerCase() : 'none'
        monster.element = normalizedElement
        monster.elementType = normalizedElement === 'thunder' ? 'electricity' : normalizedElement
        // 更新狂暴配置
        monster.berserkThresholdHP = Number(monsterData.berserkThresholdHP) || 0
        monster.berserkAttackPower = Number(monsterData.berserkAttackPower) || 0
      }

      // 重置状态
      monster.currentHealth = monster.maxHealth
      monster.healthPercentage = 100
      monster.isDefeated = false
      monster.defeatCounted = false
      monster.isHidden = false
      monster.isFading = false
      monster.defeatedAt = null
      // 重置狂暴状态
      monster.isBerserk = false
      monster.berserkActivatedAt = null
      if (monster.fadeTimer) {
        monsterTransitionBatcher.cancelFade(monster.fadeTimer)
        monster.fadeTimer = null
      }
      if (monster.hideTimer) {
        monsterTransitionBatcher.cancelHide(monster.hideTimer)
        monster.hideTimer = null
      }
      if (Array.isArray(monster.dotEffects)) {
        // 先清除所有 DOT 的 setTimeout 定时器，防止闭包引用残留导致内存泄漏
        for (let i = 0; i < monster.dotEffects.length; i++) {
          const timerId = monster.dotEffects[i]?.timerId
          if (timerId !== null && timerId !== undefined) {
            clearTimeout(timerId)
          }
        }
        monster.dotEffects.length = 0
      } else {
        monster.dotEffects = []
      }

      if (SHOULD_LOG_MONSTER_POOL) {
        debug('[MonstersStore] 重新初始化怪物实例:', monster.id)
      }
    },

    /**
     * 获取符合条件的怪物
     * @param {string} mapName - 地图名称
     * @param {string} levelRange - 等级范围
     * @returns {Array} 符合条件的怪物列表
     */
    getAvailableMonsters (mapName, levelRange) {
      const cacheKey = `${mapName || ''}__${levelRange || ''}`
      const cached = availableMonstersCache.get(cacheKey)
      if (cached) {
        return cached
      }
      // 解析等级范围
      let minLevel = 1
      let maxLevel = 999

      if (levelRange && typeof levelRange === 'string') {
        const rangeParts = levelRange.split('-')
        if (rangeParts.length === 2) {
          minLevel = parseInt(rangeParts[0], 10) || 1
          maxLevel = parseInt(rangeParts[1], 10) || 999
        }
      }

      // 筛选怪物
      const available = Object.values(this.staticMonsters).filter(monster => {
        if (!monster) {
          return false
        }

        // 检查地点
        const locationMatch =
          !monster.location ||
          monster.location === mapName ||
          monster.area === 'normal' ||
          monster.area === 'instance'

        // 检查等级
        const levelMatch = monster.level >= minLevel && monster.level <= maxLevel

        return locationMatch && levelMatch
      })
      availableMonstersCache.set(cacheKey, available)
      return available
    },
    /**
     * 获取自动战斗可用的怪物
     * @param {number} minLevel - 最小等级
     * @param {number} maxLevel - 最大等级
     * @returns {Array} 符合条件的怪物列表
     */
    getAvailableMonstersForAutoBattle (minLevel = 1, maxLevel = 200) {
      const resolvedMinLevel = Math.max(1, Number(minLevel) || 1)
      const resolvedMaxLevel = Math.max(resolvedMinLevel, Number(maxLevel) || 200)
      const cacheKey = `${resolvedMinLevel}__${resolvedMaxLevel}`
      const cached = availableMonstersForAutoBattleCache.get(cacheKey)
      if (cached) {
        return cached
      }
      const spiritBeasts = new Set([84, 627, 4827, 8990])

      const available = Object.values(this.staticMonsters).filter(monster => {
        if (!monster) {
          return false
        }

        const monsterLevel = Number(monster.level) || 1
        const levelMatch = monsterLevel >= resolvedMinLevel && monsterLevel <= resolvedMaxLevel
        const dropsCheck = Array.isArray(monster.drops) && monster.drops.length > 0
        const areaCheck = monster.area === 'normal'
        const eventCheck = monster.event === false
        const spiritBeastCheck = !spiritBeasts.has(monster.id)

        return levelMatch && dropsCheck && areaCheck && eventCheck && spiritBeastCheck
      })
      availableMonstersForAutoBattleCache.set(cacheKey, available)
      return available
    },

    createWaveForAutoBattle (count = 5, minLevel = 1, maxLevel = 200, bossProbability = 0) {
      const spawnCount = Math.min(Math.max(1, Number(count) || 5), this.monsterArraySize)
      const availableMonsters = this.getAvailableMonstersForAutoBattle(minLevel, maxLevel)

      // ★ 提前获取强制堕落BOSS目标，用于判断是否可以跳过 availableMonsters 空检查
let forcedBossMonsterId = null
try {
const gameStore = useGameStore()
// 直接从 player.jobChangeQuests 计算，绕过 Pinia getter 缓存问题
const jobChangeQuests = gameStore?.player?.jobChangeQuests
forcedBossMonsterId = Array.isArray(jobChangeQuests)
  ? (getActiveFallenBossTarget(jobChangeQuests) || null)
  : null
} catch (e) {
// store 尚未初始化时忽略
}

      // ★ 如果没有候选怪物且没有强制堕落BOSS，才返回 null
      if (!availableMonsters.length && !forcedBossMonsterId) {
        return null
      }

      const wave = Array(this.monsterArraySize).fill(null)
      const specialRanks = new Set(['boss', 'giant', 'violet', 'super'])
      const specialCandidates = availableMonsters.filter(monster =>
        specialRanks.has(String(monster?.rank || 'normal').toLowerCase())
      )
      const regularCandidates = availableMonsters.filter(
        monster => !specialRanks.has(String(monster?.rank || 'normal').toLowerCase())
      )
      const bossProbabilityCandidate = Number(bossProbability)
      const resolvedBossProbability = Number.isFinite(bossProbabilityCandidate)
        ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
        : 0

      // ★ 获取转职任务优先击杀的怪物 ID 列表（forcedBossMonsterId 已提前获取）
      let priorityMonsterIds = []
      try {
        const gameStore = useGameStore()
        priorityMonsterIds = Array.isArray(gameStore.jobChangeQuestMonsterIds)
          ? gameStore.jobChangeQuestMonsterIds
          : []
      } catch (e) {
        // store 尚未初始化时忽略
      }

      let specialMonster = null
      let specialIndex = -1

      // ★ 如果有强制堕落BOSS，跳过正常BOSS概率逻辑，必定生成该BOSS
      if (forcedBossMonsterId) {
        const forcedBossConfig = this.staticMonsters[forcedBossMonsterId]
        if (forcedBossConfig) {
          specialMonster = forcedBossConfig
          specialIndex = Math.floor(Math.random() * spawnCount)
        }
      } else if (specialCandidates.length > 0 && resolvedBossProbability > 0) {
        if (Math.random() < resolvedBossProbability) {
          specialMonster =
            specialCandidates[Math.floor(Math.random() * specialCandidates.length)]
          specialIndex = Math.floor(Math.random() * spawnCount)
        }
      }

      if (!regularCandidates.length && !specialMonster && specialCandidates.length > 0) {
        specialMonster = specialCandidates[Math.floor(Math.random() * specialCandidates.length)]
        specialIndex = 0
      }

      // ★ 从 staticMonsters 中直接获取转职任务优先怪物（不依赖 regularCandidates 过滤）
      // 因为2阶段BOSS怪物可能没有 drops 数据，被 regularCandidates 过滤掉了
      // ★ 如果当前是强制堕落BOSS波次，从优先列表中移除该BOSS避免重复出现
      const priorityCandidates = priorityMonsterIds.length > 0
        ? (forcedBossMonsterId
            ? priorityMonsterIds.filter(id => Number(id) !== forcedBossMonsterId)
            : priorityMonsterIds)
            .map(id => this.staticMonsters[id])
            .filter(m => m !== null && m !== undefined)
        : []

      for (let i = 0; i < spawnCount; i++) {
        if (i === specialIndex && specialMonster) {
          wave[i] = this.createMonsterInstance(i, specialMonster)
          continue
        }
        // ★ 优先使用转职任务目标怪物（已排除强制BOSS避免重复）
        if (priorityCandidates.length > 0 && Math.random() < 0.6) {
          const priorityMonster =
            priorityCandidates[Math.floor(Math.random() * priorityCandidates.length)]
          wave[i] = this.createMonsterInstance(i, priorityMonster)
          continue
        }
        if (!regularCandidates.length) {
          continue
        }
        const randomMonster =
          regularCandidates[Math.floor(Math.random() * regularCandidates.length)]
        wave[i] = this.createMonsterInstance(i, randomMonster)
      }

      return wave
    },
    /**
     * 根据设置创建怪物波
     * @param {string} mapName - 地图名称
     * @param {string} levelRange - 等级范围
     * @param {number} count - 怪物数量
     * @param {number} minLevel - 最小等级
     * @param {number} maxLevel - 最大等级
     * @returns {Array} 符合条件的怪物列表
     */
    createWaveBySettings (
      mapName,
      levelRange,
      count = 2,
      minLevel = 1,
      maxLevel = 3,
      bossProbability = 0
    ) {
      const resolvedMapName = mapName || this.currentMapName
      const resolvedLevelRange = levelRange || this.currentMapLevelRange
      const spawnCount = Math.min(Math.max(1, Number(count) || 2), this.monsterArraySize)

      const resolvedMinLevel = Math.max(1, Number(minLevel) || 1)
      const resolvedMaxLevel = Math.max(resolvedMinLevel, Number(maxLevel) || 3)
      const spiritBeasts = new Set([84, 627, 4827, 8990])

      let availableMonsters = this.getAvailableMonsters(resolvedMapName, resolvedLevelRange)
      availableMonsters = availableMonsters.filter(monster => {
        const monsterLevel = Number(monster?.level) || 1
        const levelMatch = monsterLevel >= resolvedMinLevel && monsterLevel <= resolvedMaxLevel
        const dropsCheck = Array.isArray(monster?.drops) && monster.drops.length > 0
        const area = monster?.area
        const areaCheck = !area || area === 'normal'
        const eventValue = monster?.event
        const eventCheck = eventValue === false
        const spiritBeastCheck = !spiritBeasts.has(monster?.id)

        return levelMatch && dropsCheck && areaCheck && eventCheck && spiritBeastCheck
      })

      // ★ 提前获取强制堕落BOSS目标，用于判断是否可以跳过 availableMonsters 空检查
let forcedBossMonsterId = null
try {
const gameStore = useGameStore()
// 直接从 player.jobChangeQuests 计算，绕过 Pinia getter 缓存问题
const jobChangeQuests = gameStore?.player?.jobChangeQuests
forcedBossMonsterId = Array.isArray(jobChangeQuests)
  ? (getActiveFallenBossTarget(jobChangeQuests) || null)
  : null
} catch (e) {
// store 尚未初始化时忽略
}

      // ★ 如果没有候选怪物且没有强制堕落BOSS，才返回 null
      if (!availableMonsters.length && !forcedBossMonsterId) {
        return null
      }

      const wave = Array(this.monsterArraySize).fill(null)
      const specialRanks = new Set(['boss', 'giant', 'violet', 'super'])
      const specialCandidates = availableMonsters.filter(monster =>
        specialRanks.has(String(monster?.rank || 'normal').toLowerCase())
      )
      const regularCandidates = availableMonsters.filter(
        monster => !specialRanks.has(String(monster?.rank || 'normal').toLowerCase())
      )
      const bossProbabilityCandidate = Number(bossProbability)
      const resolvedBossProbability = Number.isFinite(bossProbabilityCandidate)
        ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
        : 0

      // ★ 获取转职任务优先击杀的怪物 ID 列表（forcedBossMonsterId 已提前获取）
      let priorityMonsterIds = []
      try {
        const gameStore = useGameStore()
        priorityMonsterIds = Array.isArray(gameStore.jobChangeQuestMonsterIds)
          ? gameStore.jobChangeQuestMonsterIds
          : []
      } catch (e) {
        // store 尚未初始化时忽略
      }

      let specialMonster = null
      let specialIndex = -1

      // ★ 如果有强制堕落BOSS，跳过正常BOSS概率逻辑，必定生成该BOSS
      if (forcedBossMonsterId) {
        const forcedBossConfig = this.staticMonsters[forcedBossMonsterId]
        if (forcedBossConfig) {
          specialMonster = forcedBossConfig
          specialIndex = Math.floor(Math.random() * spawnCount)
        }
      } else if (specialCandidates.length > 0 && resolvedBossProbability > 0) {
        if (Math.random() < resolvedBossProbability) {
          specialMonster =
            specialCandidates[Math.floor(Math.random() * specialCandidates.length)]
          specialIndex = Math.floor(Math.random() * spawnCount)
        }
      }

      if (!regularCandidates.length && !specialMonster && specialCandidates.length > 0) {
        specialMonster = specialCandidates[Math.floor(Math.random() * specialCandidates.length)]
        specialIndex = 0
      }

      // ★ 从 staticMonsters 中直接获取转职任务优先怪物（不依赖 regularCandidates 过滤）
      // 因为2阶段BOSS怪物可能没有 drops 数据，被 regularCandidates 过滤掉了
      // ★ 如果当前是强制堕落BOSS波次，从优先列表中移除该BOSS避免重复出现
      const priorityCandidates = priorityMonsterIds.length > 0
        ? (forcedBossMonsterId
            ? priorityMonsterIds.filter(id => Number(id) !== forcedBossMonsterId)
            : priorityMonsterIds)
            .map(id => this.staticMonsters[id])
            .filter(m => m !== null && m !== undefined)
        : []

      for (let i = 0; i < spawnCount; i++) {
        if (i === specialIndex && specialMonster) {
          wave[i] = this.createMonsterInstance(i, specialMonster)
          continue
        }
        // ★ 优先使用转职任务目标怪物（已排除强制BOSS避免重复）
        if (priorityCandidates.length > 0 && Math.random() < 0.6) {
          const priorityMonster =
            priorityCandidates[Math.floor(Math.random() * priorityCandidates.length)]
          wave[i] = this.createMonsterInstance(i, priorityMonster)
          continue
        }
        if (!regularCandidates.length) {
          continue
        }
        const randomMonster =
          regularCandidates[Math.floor(Math.random() * regularCandidates.length)]
        wave[i] = this.createMonsterInstance(i, randomMonster)
      }

      return wave
    },

    spawnMonstersForAutoBattle (count = 5, minLevel = 1, maxLevel = 200, bossProbability = 0) {
      this.clearMonsters({ asyncRecycle: true, recycleToPool: false, chunkSize: 3 })
      const wave = this.createWaveForAutoBattle(count, minLevel, maxLevel, bossProbability)
      if (!wave) {
        this.lastAutoBattleNotice = {
          type: 'warning',
          message: '未找到符合条件的怪物，请调整等级范围或切换地图后重试',
          context: 'spawnMonstersForAutoBattle',
          timestamp: Date.now()
        }
        return false
      }

      this.currentMonsters = wave.map(monster => (monster || null))
      this.syncMonsterVitalsFromMonsters()
      this.lastRefreshTime = Date.now()
      this.lastAutoBattleNotice = null
      return true
    },

    spawnMonstersBySettings (
      mapName,
      levelRange,
      count = 2,
      minLevel = 1,
      maxLevel = 3,
      bossProbability = 0
    ) {
      this.clearMonsters({ asyncRecycle: true, recycleToPool: false, chunkSize: 3 })

      this.currentMapName = mapName || ''
      this.currentMapLevelRange = levelRange || ''

      const wave = this.createWaveBySettings(
        mapName,
        levelRange,
        count,
        minLevel,
        maxLevel,
        bossProbability
      )
      if (!wave) {
        this.lastAutoBattleNotice = {
          type: 'warning',
          message: '未找到符合条件的怪物，请调整等级范围或切换地图后重试',
          context: 'spawnMonstersBySettings',
          timestamp: Date.now()
        }
        return false
      }

      this.currentMonsters = wave.map(monster => (monster || null))
      this.syncMonsterVitalsFromMonsters()
      this.lastRefreshTime = Date.now()
      this.lastAutoBattleNotice = null
      return true
    },

    applyMonstersWave (wave, options = {}) {
      const { updateRefreshTime = false, resetDefeatedCount = true } = options || {}
      if (!Array.isArray(wave)) {
        return false
      }
      this.currentMonsters = wave.map(monster => (monster || null))
      this.syncMonsterVitalsFromMonsters()
      if (resetDefeatedCount) {
        this.defeatedCount = 0
      }
      if (updateRefreshTime) {
        this.lastRefreshTime = Date.now()
      }
      return true
    },

    // ========== 怪物状态管理 ==========

    /**
     * 更新怪物状态
     * @param {number} index - 怪物索引
     * @param {Object} updates - 更新的数据
     */
    updateMonster (index, updates) {
      if (this.currentMonsters[index]) {
        Object.assign(this.currentMonsters[index], updates)

        // 更新生命值百分比
        if (updates.currentHealth !== undefined) {
          const maxHealth = this.currentMonsters[index].maxHealth
          this.currentMonsters[index].healthPercentage = Math.round(
            (updates.currentHealth / maxHealth) * 100
          )
        }

        const vitals = this.monsterVitals
        if (vitals && Number.isInteger(index) && index >= 0 && index < vitals.size) {
          const monster = this.currentMonsters[index]
          const maxHealth = Math.max(0, Number(monster?.maxHealth) || 0)
          const currentHealth = Math.max(0, Number(monster?.currentHealth) || 0)
          vitals.maxHealth[index] = maxHealth
          vitals.currentHealth[index] = currentHealth
          vitals.healthPercentage[index] = Math.max(
            0,
            Math.min(100, Math.round(maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0))
          )
          vitals.isDefeated[index] = monster?.isDefeated === true || currentHealth <= 0 ? 1 : 0
        }
      }
    },

    /**
     * 批量更新怪物的DEBUFF状态
     * 用于双倍惩戒等DEBUFF的响应式更新
     * @param {Array} debuffUpdates - DEBUFF更新数组，格式: [{ index, debuffType, debuffData }]
     * @returns {number} 成功更新的怪物数量
     */
    applyDebuffBatchUpdates (debuffUpdates) {
      if (!Array.isArray(debuffUpdates) || debuffUpdates.length === 0) {
        return 0
      }

      let updatedCount = 0
      for (const update of debuffUpdates) {
        const { index, debuffType, debuffData } = update
        const targetIndex = Number(index)

        if (
          !Number.isFinite(targetIndex) ||
          targetIndex < 0 ||
          targetIndex >= this.currentMonsters.length
        ) {
          continue
        }

        const monster = this.currentMonsters[targetIndex]
        if (!monster) {
          continue
        }

        // Canvas-First 架构：使用 toRaw 绕过 Vue 响应式
        // Debuff 数据由 Canvas renderOverlayFrame 直接从 proxy 读取
        // 不再触发 bumpMonstersUiVersion，消除 AOE debuff 导致的 Vue patch 阻塞
        const rawMonster = toRaw(monster)
        const debuffValue = debuffData === null ? null : { ...debuffData }

        if (debuffType === 'doubleJudgment') {
          rawMonster.doubleJudgmentDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'armorBreak') {
          rawMonster.armorBreakDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'stun') {
          rawMonster.stunDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'hitRateReduction') {
          rawMonster.hitRateReductionDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'attackSpeedReduction') {
          rawMonster.attackSpeedDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'critDamageReduction') {
          rawMonster.critDamageReductionDebuff = debuffValue
          updatedCount += 1
        } else if (debuffType === 'attackReduction') {
          rawMonster.attackReductionDebuff = debuffValue
          updatedCount += 1
        }
      }

      // Canvas-First：debuff 变化不再触发 Vue 版本号更新
      // Canvas 每帧直接从 currentMonsters proxy 读取 debuff 状态
      return updatedCount
    },

    /**
     * 批量写回怪物生命值，并只触发一次列表级更新
     * @param {Array<{index:number,currentHealth:number,healthPercentage?:number}>} pendingUpdates - 待写回的生命值更新
     * @param {{ updateProxies?: boolean, handleDefeated?: boolean }} [options] - 行为选项
     *   - updateProxies: 是否同时更新 Vue proxy 对象（默认 false）
     *   - handleDefeated: 是否在此处处理死亡逻辑（proxy 写入 + 定时器创建，默认 true）
     *     当由 BattleMutationBatcher._flushDefeated 统一处理死亡时，应传 false 避免重复写入
     * @returns {boolean} 是否成功应用
     */
    applyMonsterVitalsBatchUpdates (pendingUpdates, options = {}) {
      if (!Array.isArray(pendingUpdates) || pendingUpdates.length === 0) {
        return false
      }

      this.ensureMonsterVitals()
      const vitals = this.monsterVitals
      const updateProxies = options?.updateProxies === true
      // handleDefeated 默认为 true（兼容不传 options 的调用方）
      // BattleMutationBatcher._flushVitals 传 false 以跳过死亡处理（由 _flushDefeated 负责）
      const handleDefeated = options?.handleDefeated !== false

      for (let i = 0; i < pendingUpdates.length; i++) {
        const update = pendingUpdates[i]
        const targetIndex = Number(update?.index)
        if (
          !Number.isFinite(targetIndex) ||
          targetIndex < 0 ||
          targetIndex >= this.currentMonsters.length
        ) {
          continue
        }

        const baseTarget = this.currentMonsters[targetIndex] || null
        const targetProxy = updateProxies ? baseTarget : null
        const target = targetProxy || null

        const maxHealthFromProxy = Number(baseTarget?.maxHealth) || 0
        const maxHealthFromVitals =
          vitals && targetIndex < vitals.size ? Number(vitals.maxHealth[targetIndex]) || 0 : 0
        const maxHealth = maxHealthFromProxy > 0 ? maxHealthFromProxy : maxHealthFromVitals
        const nextCurrentHealth = Math.max(0, Number(update?.currentHealth) || 0)
        const nextHealthPercentageRaw =
          update?.healthPercentage !== undefined && update?.healthPercentage !== null
            ? Number(update.healthPercentage)
            : maxHealth > 0
              ? (nextCurrentHealth / maxHealth) * 100
              : 0
        const nextHealthPercentage = Math.max(
          0,
          Math.min(100, Number.isFinite(nextHealthPercentageRaw) ? nextHealthPercentageRaw : 0)
        )

        const nextIsDefeated =
          Boolean(baseTarget?.isDefeated) || nextCurrentHealth <= 0 ? true : false

        if (updateProxies && target) {
          // 使用 toRaw 绕过 Vue 响应式，避免 proxy 突变触发额外的渲染
          // getter 从 vitals (TypedArray) 读取 health 数据，不依赖 proxy 属性
          const rawTarget = toRaw(target)
          rawTarget.currentHealth = nextCurrentHealth
          rawTarget.healthPercentage = nextHealthPercentage
          rawTarget.isDefeated = nextIsDefeated
        }

        if (vitals && targetIndex < vitals.size) {
          vitals.maxHealth[targetIndex] = Math.max(0, Math.trunc(maxHealth))
          vitals.currentHealth[targetIndex] = Math.max(0, Math.trunc(nextCurrentHealth))
          vitals.healthPercentage[targetIndex] = Math.max(
            0,
            Math.min(100, Math.trunc(nextHealthPercentage))
          )
          vitals.isDefeated[targetIndex] = nextIsDefeated ? 1 : 0
        }
        // 死亡处理：仅当 handleDefeated 为 true 时执行写入 + 定时器创建
        // 当 BattleMutationBatcher 已通过 _flushDefeated 处理死亡时，此处跳过避免重复
        if (
          handleDefeated &&
          nextIsDefeated &&
          baseTarget &&
          !baseTarget.isHidden &&
          !baseTarget.fadeTimer &&
          !baseTarget.hideTimer
        ) {
          const now = Date.now()
          // ★ 使用 toRaw 绕过 Vue proxy，避免 effect 队列阻塞
          const rawTarget = toRaw(baseTarget)
          if (!rawTarget.isDefeated) {
            rawTarget.isDefeated = true
          }
          if (rawTarget.currentHealth !== 0) {
            rawTarget.currentHealth = 0
          }
          rawTarget.isFading = false
          rawTarget.isHidden = false
          if (!rawTarget.defeatedAt) {
            rawTarget.defeatedAt = now
          }
          // ★ 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
          const staggerMs = Math.min(targetIndex * 20, 400)
          rawTarget.fadeTimer = monsterTransitionBatcher.scheduleFade(baseTarget, 1000 + staggerMs)
          rawTarget.hideTimer = monsterTransitionBatcher.scheduleHide(baseTarget, 2000 + staggerMs)
        }
      }

      // Canvas-First 架构：血量变化不再触发 Vue 版本号更新
      // Canvas renderOverlayFrame 每帧直接从 monsterVitals TypedArray 读取最新血量
      // 仅当怪物死亡时，isFading/isHidden 的响应式突变会自动触发 Vue 重渲染
      return true
    },

    /**
     * 更新怪物生命值
     * @param {number} index - 怪物索引
     * @param {number} damage - 伤害值
     * @returns {number} 实际造成的伤害
     */
    damageMonster (index, damage) {
      if (!this.currentMonsters[index]) {
        return 0
      }

      const monster = this.currentMonsters[index]
      const defense = (monster.minDefense + monster.maxDefense) / 2
      const actualDamage = Math.max(1, Math.floor(damage - defense))

      monster.currentHealth = Math.max(0, monster.currentHealth - actualDamage)
      monster.healthPercentage = Math.round((monster.currentHealth / monster.maxHealth) * 100)
      this.updateMonster(index, { currentHealth: monster.currentHealth })

      // 检查是否死亡
      if (monster.currentHealth <= 0) {
        this.markDefeated(index)
      }

      return actualDamage
    },

    /**
     * 标记怪物为已击败
     * @param {number} index - 怪物索引
     */
    markDefeated (index) {
      const monster = this.currentMonsters[index]
      if (!monster) {
        return
      }

      // ★ 使用 toRaw 绕过 Vue proxy
      const raw = toRaw(monster)

      if (raw.isDefeated !== true) {
        raw.isDefeated = true
      }
      if (raw.currentHealth !== 0) {
        raw.currentHealth = 0
      }
      if (raw.healthPercentage !== 0) {
        raw.healthPercentage = 0
      }
      const vitals = this.monsterVitals
      if (vitals && Number.isInteger(index) && index >= 0 && index < vitals.size) {
        vitals.currentHealth[index] = 0
        vitals.healthPercentage[index] = 0
        vitals.isDefeated[index] = 1
      }
      if (!raw.isHidden && !raw.fadeTimer && !raw.hideTimer) {
        const now = Date.now()
        raw.isFading = false
        raw.isHidden = false
        if (!raw.defeatedAt) {
          raw.defeatedAt = now
        }
        // ★ 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
        const staggerMs = Math.min(index * 20, 400)
        raw.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000 + staggerMs)
        raw.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000 + staggerMs)
      }

      if (!raw.defeatCounted) {
        monster.defeatCounted = true
        this.defeatedCount++
        this.totalKilled++
      }
    },

    markDefeatedBatch (indices) {
      if (!Array.isArray(indices) || indices.length === 0) {
        return 0
      }
      let applied = 0
      let newlyCounted = 0
      const vitals = this.monsterVitals
      const maxIndex = Array.isArray(this.currentMonsters) ? this.currentMonsters.length : 0

      for (let i = 0; i < indices.length; i++) {
        const index = Number(indices[i])
        if (!Number.isInteger(index) || index < 0 || index >= maxIndex) {
          continue
        }
        const monster = this.currentMonsters[index]
        if (!monster) {
          continue
        }

        // ★ 使用 toRaw 绕过 Vue proxy，避免每次属性写入触发 effect 队列
        // 这是 markDefeatedBatch 阻塞 384-764ms 的根因
        const raw = toRaw(monster)

        if (raw.isDefeated !== true) {
          raw.isDefeated = true
        }
        if (raw.currentHealth !== 0) {
          raw.currentHealth = 0
        }
        if (raw.healthPercentage !== 0) {
          raw.healthPercentage = 0
        }

        if (vitals && index < vitals.size) {
          vitals.currentHealth[index] = 0
          vitals.healthPercentage[index] = 0
          vitals.isDefeated[index] = 1
        }
        if (!raw.isHidden && !raw.fadeTimer && !raw.hideTimer) {
          const now = Date.now()
          raw.isFading = false
          raw.isHidden = false
          if (!raw.defeatedAt) {
            raw.defeatedAt = now
          }
          // ★ 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
          const staggerMs = Math.min(index * 20, 400)
          raw.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000 + staggerMs)
          raw.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000 + staggerMs)
        }

        if (!raw.defeatCounted) {
          raw.defeatCounted = true
          newlyCounted += 1
        }

        applied += 1
      }

      if (newlyCounted > 0) {
        this.$patch(state => {
          state.defeatedCount += newlyCounted
          state.totalKilled += newlyCounted
        })
      }

      // 不再调用 bumpMonstersUiVersion，Vue 响应式会自动处理
      // 怪物的 isDefeated/isFading/isHidden 变化会被自动检测

      return applied
    },

    /**
     * 清除所有怪物的 DOT 效果
     * @param {number} index - 怪物索引
     */
    clearMonsterDotEffects (index) {
      const monster = this.currentMonsters[index]
      if (!monster) {
        return
      }
      const effects = monster.dotEffects
      if (!Array.isArray(effects) || effects.length === 0) {
        if (!Array.isArray(effects)) {
          monster.dotEffects = []
        }
        return
      }
      for (let i = 0; i < effects.length; i++) {
        const timerId = effects[i]?.timerId
        if (timerId !== null && timerId !== undefined) {
          clearTimeout(timerId)
        }
      }
      effects.length = 0
    },

    /**
     * 清除所有怪物
     * @param {{asyncRecycle?: boolean, recycleToPool?: boolean, chunkSize?: number}} [options]
     */
    clearMonsters (options = {}) {
      const { asyncRecycle = false, recycleToPool = true, chunkSize = 5 } = options || {}
      const oldMonsters = Array.isArray(this.currentMonsters) ? this.currentMonsters : []

      // 清空数组
      const nextMonsters = Array(this.monsterArraySize).fill(null)
      this.$patch(state => {
        state.currentMonsters = nextMonsters
        state.defeatedCount = 0
      })
      this.ensureMonsterVitals({ reset: true })

      const cleanupDotEffectsOnly = monster => {
        if (!monster) {
          return
        }
        const effects = monster.dotEffects
        if (Array.isArray(effects) && effects.length > 0) {
          for (let i = 0; i < effects.length; i++) {
            const timerId = effects[i]?.timerId
            if (timerId !== null && timerId !== undefined) {
              clearTimeout(timerId)
            }
          }
          effects.length = 0
        } else if (!Array.isArray(effects)) {
          monster.dotEffects = []
        }
      }

      const recycleOne = monster => {
        if (!monster) {
          return
        }
        if (recycleToPool) {
          this.returnMonsterToPool(monster)
          return
        }
        cleanupDotEffectsOnly(monster)
      }

      if (asyncRecycle) {
        const resolvedChunkSize = Math.min(20, Math.max(1, Number(chunkSize) || 5))
        let cursor = 0
        const processChunk = () => {
          try {
            const end = Math.min(oldMonsters.length, cursor + resolvedChunkSize)
            for (; cursor < end; cursor++) {
              recycleOne(oldMonsters[cursor])
            }
            if (cursor < oldMonsters.length) {
              setTimeout(processChunk, 0)
            }
          } catch (error) {
            console.error('[MonstersStore] 异步清场回收失败:', error)
          }
        }
        setTimeout(processChunk, 0)
      } else {
        for (let i = 0; i < oldMonsters.length; i++) {
          recycleOne(oldMonsters[i])
        }
      }
    },

    // ========== 刷新控制 ==========

    /**
     * 刷新怪物（延迟执行）
     * @param {number} count - 刷新的怪物数量
     * @param {number} delay - 延迟时间（毫秒）
     */
    refreshMonsters (count = null, delay = null) {
      if (this.isRefreshing) {
        debug('[MonstersStore] 正在刷新中，跳过本次刷新')
        return
      }

      this.isRefreshing = true

      const refreshDelay = delay !== null ? delay : this.refreshInterval
      const spawnCount = count !== null ? count : Math.ceil(this.monsterArraySize / 2)

      debug('[MonstersStore] 计划刷新怪物，延迟:', refreshDelay, 'ms')

      setTimeout(() => {
        this.spawnMonsters(this.currentMapName, this.currentMapLevelRange, spawnCount)
        this.isRefreshing = false
        debug('[MonstersStore] 刷新怪物完成')
      }, refreshDelay)
    },

    /**
     * 检查并刷新怪物
     * @param {boolean} shouldRefresh - 是否应该刷新
     * @param {number} count - 刷新的怪物数量
     */
    checkAndRefreshMonsters (shouldRefresh, count = null) {
      if (!shouldRefresh) {
        return
      }

      if (this.allDefeated) {
        debug('[MonstersStore] 所有怪物已击败，准备刷新')
        this.refreshMonsters(count)
      }
    },

    // ========== 统计 ==========

    /**
     * 获取击杀统计
     * @returns {Object} 统计数据
     */
    getStats () {
      return {
        defeatedCount: this.defeatedCount,
        totalKilled: this.totalKilled,
        aliveCount: this.aliveCount,
        allDefeated: this.allDefeated
      }
    },

    /**
     * 重置统计数据
     */
    resetStats () {
      this.defeatedCount = 0
      this.totalKilled = 0
      debug('[MonstersStore] 统计数据已重置')
    },

    // ========== 工具方法 ==========

    /**
     * 获取怪物显示名称（包含 rank 信息）
     * @param {Object} monster - 怪物对象
     * @returns {string} 显示名称
     */
    getMonsterDisplayName (monster) {
      if (!monster) {
        return ''
      }

      const name = monster.name || '未知怪物'
      const rank = monster.rank?.toLowerCase() || 'normal'
      // 使用统一描述管理获取怪物等级名称
      const chineseRank = MONSTER_RANK_NAMES[rank] || '普通'

      return `${name} [${chineseRank}]`
    },

    /**
     * 获取怪物图标路径
     * @param {string} monsterId - 怪物ID
     * @returns {string} 图标路径
     */
    getMonsterIcon (monsterId) {
      const iconPath = `/pt/monster_icon/${monsterId}.png`

      // 对于测试怪物，返回存在的图标
      if (monsterId.startsWith('test_monster_')) {
        return '/pt/monster_icon/2.png'
      }

      return iconPath
    }
  }
})
