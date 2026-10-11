/**
 * @file useAutoBattleMonsters.js
 * @generated 2026-01-27
 */

import { nextTick, ref } from 'vue'
import { getActiveFallenBossTarget } from '@/utils/jobChangeQuestHelper'

let spawnPlanWorker = null
let spawnPlanWorkerRequestId = 1
const spawnPlanWorkerPending = new Map()
let spawnPlanWorkerPrewarmed = false

const getSpawnPlanWorker = () => {
  if (spawnPlanWorker) {
    return spawnPlanWorker
  }
  if (typeof Worker === 'undefined') {
    return null
  }

  try {
    spawnPlanWorker = new Worker(new URL('../workers/AutoBattleSpawnPlanWorker.js', import.meta.url), {
      type: 'module'
    })

    spawnPlanWorker.onmessage = event => {
      const { requestId, result, error, type } = event.data || {}
      if (!requestId || !spawnPlanWorkerPending.has(requestId)) {
        return
      }
      const handler = spawnPlanWorkerPending.get(requestId)
      spawnPlanWorkerPending.delete(requestId)
      if (error) {
        handler.reject(new Error(error))
        return
      }
      if (type !== 'autoBattleSpawnPlan') {
        handler.reject(new Error('未知的任务类型'))
        return
      }
      handler.resolve(result)
    }
    spawnPlanWorker.onerror = error => {
      console.error('AutoBattleSpawnPlanWorker 运行失败:', error)
    }

    return spawnPlanWorker
  } catch (error) {
    console.error('AutoBattleSpawnPlanWorker 初始化失败:', error)
    spawnPlanWorker = null
    return null
  }
}

const requestSpawnPlanWorker = payload => {
  const worker = getSpawnPlanWorker()
  if (!worker) {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const requestId = spawnPlanWorkerRequestId++
    spawnPlanWorkerPending.set(requestId, { resolve, reject })
    worker.postMessage({ type: 'autoBattleSpawnPlan', payload: payload || {}, requestId })
  })
}

export function useAutoBattleMonsters (params) {
  const {
    autoBattleStore,
    monstersStore,
    gameStore,
    isActive,
    isPaused,
    isInCountdownPeriod,
    isRefreshing,
    autoBattle,
    getCurrentMap,
    getUserSettings,
    getOptionMonsters,
    pauseAutoBattle,
    startOrResumeAutoBattle,
    refreshMonstersAndMaybeResume,
    updateMonsters,
    updateConfig,
    addBattleLog
  } = params

  const showCountdown = ref(false)
  const prefetchedMonstersForCountdown = ref(null)
  let prefetchedWaveToken = 0
  const SPAWN_PLAN_WORKER_MAX_IDS = 1000

  Promise.resolve()
    .then(() => {
      if (spawnPlanWorkerPrewarmed) {
        return
      }
      spawnPlanWorkerPrewarmed = true
      requestSpawnPlanWorker({
        monsterArraySize: 1,
        spawnCount: 1,
        regularIds: [1],
        specialIds: [],
        bossProbability: 0
      }).catch(() => {})
    })
    .catch(error => {
      console.error('[useAutoBattleMonsters] 预热怪物生成计划 Worker 失败:', error)
    })
  const spiritBeastIds = new Set([84, 627, 4827, 8990])
  const specialRanks = new Set(['boss', 'giant', 'violet', 'super'])
  const spawnCandidatesCache = new Map()
  const spawnCandidatesCacheMaxSize = 10

  const buildSpawnCandidatesCacheKey = (currentMap, minLevel, maxLevel) => {
    const mapName = currentMap?.name ?? ''
    const levelRange = currentMap?.levelRange ?? ''
    return `${mapName}__${levelRange}__${minLevel}__${maxLevel}`
  }

  const rememberSpawnCandidates = (cacheKey, value) => {
    if (!cacheKey) {
      return
    }
    spawnCandidatesCache.set(cacheKey, value)
    while (spawnCandidatesCache.size > spawnCandidatesCacheMaxSize) {
      const oldestKey = spawnCandidatesCache.keys().next().value
      if (!oldestKey) {
        break
      }
      spawnCandidatesCache.delete(oldestKey)
    }
  }

  const getSpawnCandidates = (settings, currentMap) => {
    const resolvedMinLevel = Math.max(1, Number(settings?.monsterMinLevel) || 1)
    const resolvedMaxLevel = Math.max(resolvedMinLevel, Number(settings?.monsterMaxLevel) || 3)
    const cacheKey = buildSpawnCandidatesCacheKey(currentMap, resolvedMinLevel, resolvedMaxLevel)
    const cached = spawnCandidatesCache.get(cacheKey)
    if (cached) {
      return cached
    }

    let available = []
    if (
      currentMap?.name &&
      currentMap?.levelRange &&
      monstersStore &&
      typeof monstersStore.getAvailableMonsters === 'function'
    ) {
      available = monstersStore.getAvailableMonsters(currentMap.name, currentMap.levelRange)
    } else if (monstersStore && typeof monstersStore.getAvailableMonstersForAutoBattle === 'function') {
      available = monstersStore.getAvailableMonstersForAutoBattle(resolvedMinLevel, resolvedMaxLevel)
    }

    if (!Array.isArray(available) || available.length === 0) {
      return null
    }

    const regularIds = []
    const specialIds = []
    for (let i = 0; i < available.length; i++) {
      const monster = available[i]
      if (!monster) {
        continue
      }
      const rawId = monster?.id
      if (rawId === null || rawId === undefined) {
        continue
      }
      const id = typeof rawId === 'number' ? rawId : Number(rawId)
      if (!Number.isFinite(id)) {
        continue
      }

      const monsterLevel = Number(monster?.level) || 1
      const levelMatch = monsterLevel >= resolvedMinLevel && monsterLevel <= resolvedMaxLevel
      if (!levelMatch) {
        continue
      }

      const dropsCheck = Array.isArray(monster?.drops) && monster.drops.length > 0
      if (!dropsCheck) {
        continue
      }

      const area = monster?.area
      const areaCheck = !area || area === 'normal'
      if (!areaCheck) {
        continue
      }

      const eventValue = monster?.event
      const eventCheck = eventValue === false
      if (!eventCheck) {
        continue
      }

      if (spiritBeastIds.has(id)) {
        continue
      }

      const rank = String(monster?.rank || 'normal').toLowerCase()
      if (specialRanks.has(rank)) {
        specialIds.push(id)
      } else {
        regularIds.push(id)
      }
    }

    if (regularIds.length === 0 && specialIds.length === 0) {
      return null
    }

    const result = Object.freeze({
      regularIds: Object.freeze(regularIds),
      specialIds: Object.freeze(specialIds)
    })
    rememberSpawnCandidates(cacheKey, result)
    return result
  }

  const consumeAutoBattleNotice = () => {
    try {
      const notice = monstersStore?.lastAutoBattleNotice
      if (!notice || typeof notice !== 'object') {
        return
      }
      if (typeof notice.message === 'string' && notice.message && typeof addBattleLog === 'function') {
        addBattleLog(notice.message, notice.type || 'warning')
      }
      monstersStore.lastAutoBattleNotice = null
    } catch (error) {
      console.error('[useAutoBattleMonsters] 处理自动战斗提示失败:', error)
    }
  }

  /**
   * 从用户设置解析怪物筛选参数
   * @returns {{monsterMinLevel:number, monsterMaxLevel:number, monsterDisplayCount:number}}
   */
  const resolveMonsterFilterSettings = () => {
    const userSettings = getUserSettings?.() || {}
    const monsterMinLevel = Math.max(1, Number(userSettings?.monsterMinLevel) || 1)
    const monsterMaxLevel = Math.max(monsterMinLevel, Number(userSettings?.monsterMaxLevel) || 3)
    const maxDisplayCount = Math.max(1, Number(monstersStore?.monsterArraySize ?? 30) || 30)
    const monsterDisplayCount = Math.min(
      maxDisplayCount,
      Math.max(1, Number(userSettings?.monsterDisplayCount) || 2)
    )
    const bossProbabilityCandidate = Number(userSettings?.monsterBossProbability)
    const monsterBossProbability = Number.isFinite(bossProbabilityCandidate)
      ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
      : 0
    return { monsterMinLevel, monsterMaxLevel, monsterDisplayCount, monsterBossProbability }
  }

  /**
   * 将用户怪物设置同步到自动战斗配置，避免 Service 过滤条件与生成条件不一致
   * @param {{monsterMinLevel:number, monsterMaxLevel:number, monsterDisplayCount:number, monsterBossProbability:number}} settings
   * @returns {void}
   */
  const syncMonsterFilterConfig = settings => {
    if (!settings || typeof settings !== 'object') {
      return
    }

    try {
      const currentConfig = autoBattleStore?.config
      const currentMin = Number(currentConfig?.monsterMinLevel)
      const currentMax = Number(currentConfig?.monsterMaxLevel)
      const currentCount = Number(currentConfig?.monsterDisplayCount)
      const currentBossProbability = Number(currentConfig?.monsterBossProbability)

      const shouldUpdate =
        !Number.isFinite(currentMin) ||
        !Number.isFinite(currentMax) ||
        !Number.isFinite(currentCount) ||
        currentMin !== settings.monsterMinLevel ||
        currentMax !== settings.monsterMaxLevel ||
        currentCount !== settings.monsterDisplayCount ||
        (!Number.isFinite(currentBossProbability) && settings.monsterBossProbability !== 0) ||
        (Number.isFinite(currentBossProbability) &&
          currentBossProbability !== settings.monsterBossProbability)

      if (!shouldUpdate) {
        return
      }

      if (typeof updateConfig === 'function') {
        updateConfig({
          monsterMinLevel: settings.monsterMinLevel,
          monsterMaxLevel: settings.monsterMaxLevel,
          monsterDisplayCount: settings.monsterDisplayCount,
          monsterBossProbability: settings.monsterBossProbability
        })
        return
      }

      if (typeof autoBattleStore?.updateConfig === 'function') {
        autoBattleStore.updateConfig({
          monsterMinLevel: settings.monsterMinLevel,
          monsterMaxLevel: settings.monsterMaxLevel,
          monsterDisplayCount: settings.monsterDisplayCount,
          monsterBossProbability: settings.monsterBossProbability
        })
      }
    } catch (error) {
      console.error('[useAutoBattleMonsters] 同步怪物筛选配置失败:', error)
    }
  }

  /**
   * 判断怪物数组是否包含有效怪物
   * @param {any} monsters
   * @returns {boolean}
   */
  const hasValidMonsters = monsters =>
    Array.isArray(monsters) && monsters.some(monster => monster && monster.id)

  const hasValidMonstersForDisplayCount = (monsters, displayCount) => {
    if (!Array.isArray(monsters)) {
      return false
    }
    const resolvedCount = Math.max(1, Number(displayCount) || 1)
    if (monsters.length < resolvedCount) {
      return false
    }
    for (let i = 0; i < resolvedCount; i++) {
      const monster = monsters[i]
      if (!monster || !monster.id) {
        return false
      }
    }
    return true
  }

  const buildSpawnPlanInput = (settings, currentMap) => {
    const monsterArraySize = Number(monstersStore?.monsterArraySize ?? 30) || 30
    const spawnCount = Math.min(
      Math.max(1, Number(settings?.monsterDisplayCount) || 2),
      monsterArraySize
    )

    const resolvedMinLevel = Math.max(1, Number(settings?.monsterMinLevel) || 1)
    const resolvedMaxLevel = Math.max(resolvedMinLevel, Number(settings?.monsterMaxLevel) || 3)
    const bossProbabilityCandidate = Number(settings?.monsterBossProbability)
    const bossProbability = Number.isFinite(bossProbabilityCandidate)
      ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
      : 0

    // ★ 堕落BOSS强制刷新：三转任务「实力证明2 堕落BOSS」处于已接受状态时，
    //    每波必定包含一个按任务顺序的指定堕落BOSS，覆盖正常的BOSS概率设置
    //    直接从 player.jobChangeQuests 计算，绕过 Pinia getter 缓存问题
    const jobChangeQuests = gameStore?.player?.jobChangeQuests
    const forcedBossMonsterId = Array.isArray(jobChangeQuests)
      ? (getActiveFallenBossTarget(jobChangeQuests) || null)
      : null

    const candidates = getSpawnCandidates(
      { monsterMinLevel: resolvedMinLevel, monsterMaxLevel: resolvedMaxLevel },
      currentMap
    )
    // ★ 如果没有候选怪物且没有强制堕落BOSS，才返回 null
    //    有强制堕落BOSS时，即使没有其他候选怪物也要生成 payload
    if (!candidates && !forcedBossMonsterId) {
      return null
    }

    return {
      monsterArraySize,
      spawnCount,
      count: spawnCount,
      minLevel: resolvedMinLevel,
      maxLevel: resolvedMaxLevel,
      regularIds: candidates?.regularIds || [],
      specialIds: candidates?.specialIds || [],
      bossProbability,
      priorityMonsterIds: Array.isArray(gameStore?.jobChangeQuestMonsterIds)
        ? gameStore.jobChangeQuestMonsterIds
        : [],
      forcedBossMonsterId
    }
  }

  const planAutoBattleWaveLocal = payload => {
    const monsterArraySize = Math.min(Math.max(1, Number(payload?.monsterArraySize) || 30), 200)
    const spawnCount = Math.min(Math.max(1, Number(payload?.spawnCount) || 5), monsterArraySize)
    const regularIds = Array.isArray(payload?.regularIds) ? payload.regularIds : []
    const specialIds = Array.isArray(payload?.specialIds) ? payload.specialIds : []
    const priorityIds = Array.isArray(payload?.priorityMonsterIds) ? payload.priorityMonsterIds : []
    const bossProbabilityCandidate = Number(payload?.bossProbability)
    const bossProbability = Number.isFinite(bossProbabilityCandidate)
      ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
      : 0
    // ★ 挕落BOSS强制刷新目标
    const forcedBossId = Number(payload?.forcedBossMonsterId) || null

    if (!regularIds.length && !specialIds.length && !forcedBossId) {
      return null
    }

    // ★ 如果有强制挕落BOSS，跳过正常的BOSS概率逻辑，必定在随机位置生成该BOSS
    let specialId = null
    let specialIndex = -1

    if (forcedBossId) {
      // 强制生成指定挕落BOSS，覆盖正常BOSS概率
      specialId = forcedBossId
      specialIndex = Math.floor(Math.random() * spawnCount)
    } else {
      const specialRanksPlanned =
        specialIds.length > 0 && bossProbability > 0 && Math.random() < bossProbability

      if (specialRanksPlanned) {
        specialId = specialIds[Math.floor(Math.random() * specialIds.length)]
        specialIndex = Math.floor(Math.random() * spawnCount)
      }

      if (!regularIds.length && !specialId && specialIds.length > 0) {
        specialId = specialIds[Math.floor(Math.random() * specialIds.length)]
        specialIndex = 0
      }
    }

    // ★ 转职任务优先怪物：直接使用 priorityIds（不需要在 regularIds 中）
    // 因为2阶段BOSS怪物可能没有 drops 数据，被 regularIds 过滤掉了
    // ★ 如果当前是强制挕落BOSS波次，从优先列表中移除该BOSS避免重复出现
    const priorityAvailable = priorityIds.length > 0
      ? (forcedBossId
          ? priorityIds.filter(id => Number(id) !== forcedBossId)
          : [...priorityIds])
      : []

    const spawn = []
    for (let i = 0; i < spawnCount; i++) {
      if (i === specialIndex && specialId !== null && specialId !== undefined) {
        spawn.push({ index: i, id: specialId })
        continue
      }
      // ★ 优先使用转职任务目标怪物（已排除强制BOSS避免重复）
      if (priorityAvailable.length > 0 && Math.random() < 0.6) {
        const priorityId = priorityAvailable[Math.floor(Math.random() * priorityAvailable.length)]
        spawn.push({ index: i, id: priorityId })
        continue
      }
      if (!regularIds.length) {
        continue
      }
      const id = regularIds[Math.floor(Math.random() * regularIds.length)]
      spawn.push({ index: i, id })
    }

    return { monsterArraySize, spawnCount, spawn }
  }

  const createWaveFromSpawnPlanAsync = async plan => {
    if (!plan || typeof plan !== 'object') {
      return null
    }
    const monsterArraySize = Math.min(Math.max(1, Number(plan.monsterArraySize) || 30), 200)
    const wave = Array(monsterArraySize).fill(null)
    const spawn = Array.isArray(plan.spawn) ? plan.spawn : []
    if (!monstersStore || typeof monstersStore.createMonsterInstance !== 'function') {
      return null
    }
    const configCache = new Map()
    const budgetMs = 6
    const chunkSize = 8
    // 使用 setTimeout 替代 requestIdleCallback，避免后台切换恢复时 Violation 阻塞主线程
    const yieldToIdle = () =>
      new Promise(resolve => {
        setTimeout(resolve, 0)
      })
    let i = 0
    while (i < spawn.length) {
      const startedAt = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
      const end = Math.min(spawn.length, i + chunkSize)
      for (; i < end; i++) {
        const entry = spawn[i]
        const index = Number(entry?.index)
        const monsterId = entry?.id
        if (!Number.isInteger(index) || index < 0 || index >= monsterArraySize) {
          continue
        }
        if (monsterId === null || monsterId === undefined) {
          continue
        }
        let config = configCache.get(monsterId)
        if (!config) {
          config =
            typeof monstersStore.getMonsterConfig === 'function'
              ? monstersStore.getMonsterConfig(monsterId)
              : monstersStore?.staticMonsters?.[monsterId] || null
          if (config) {
            configCache.set(monsterId, config)
          }
        }
        if (!config) {
          continue
        }
        wave[index] = monstersStore.createMonsterInstance(index, config)
      }
      const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
      if (now - startedAt >= budgetMs) {
        await yieldToIdle()
      }
    }
    return wave
  }

  const prefetchWaveWithWorker = settings => {
    const currentMap = typeof getCurrentMap === 'function' ? getCurrentMap() : null
    const planInput = buildSpawnPlanInput(settings, currentMap)
    if (!planInput) {
      prefetchedMonstersForCountdown.value = null
      return
    }

    const token = (prefetchedWaveToken + 1) % 1000000
    prefetchedWaveToken = token
    prefetchedMonstersForCountdown.value = null

    Promise.resolve()
      .then(async () => {
        try {
          let result = null
          try {
            const totalCandidateIds =
              (planInput?.regularIds?.length || 0) + (planInput?.specialIds?.length || 0)
            if (totalCandidateIds > 0 && totalCandidateIds <= SPAWN_PLAN_WORKER_MAX_IDS) {
              result = await requestSpawnPlanWorker(planInput)
            }
          } catch (error) {
            result = null
          }
          if (!result) {
            result = planAutoBattleWaveLocal(planInput)
          }
          if (token !== prefetchedWaveToken) {
            return
          }
          const wave = await createWaveFromSpawnPlanAsync(result)
          prefetchedMonstersForCountdown.value = wave
        } catch (error) {
          console.error('[useAutoBattleMonsters] Worker预生成怪物失败:', error)
        }
      })
      .catch(() => {})
  }

  const refreshMonstersWithWorker = async (settings, sourceMonsters) => {
    const currentMap = typeof getCurrentMap === 'function' ? getCurrentMap() : null
    if (hasValidMonsters(sourceMonsters)) {
      applyMonstersWave(sourceMonsters)
      updateMonsters(monstersStore.currentMonsters, false)
      return true
    }

    const planInput = buildSpawnPlanInput(settings, currentMap)
    if (!planInput) {
      return false
    }

    try {
      let result = null
      try {
        const totalCandidateIds =
          (planInput?.regularIds?.length || 0) + (planInput?.specialIds?.length || 0)
        if (totalCandidateIds > 0 && totalCandidateIds <= SPAWN_PLAN_WORKER_MAX_IDS) {
          result = await requestSpawnPlanWorker(planInput)
        }
      } catch (error) {
        result = null
      }
      if (!result) {
        result = planAutoBattleWaveLocal(planInput)
      }
      const wave = await createWaveFromSpawnPlanAsync(result)
      if (!hasValidMonsters(wave)) {
        return false
      }
      applyMonstersWave(wave)
      updateMonsters(monstersStore.currentMonsters, false)
      return true
    } catch (error) {
      console.error('[useAutoBattleMonsters] Worker刷新怪物失败:', error)
      return false
    }
  }

  /**
   * 归一化启动/刷新 payload
   * @param {any} payload
   * @returns {{forceRefresh:boolean, sourceMonsters:any, traceId:string|null, source:string|null}}
   */
  const normalizeStartPayload = payload => {
    if (payload === true) {
      return { forceRefresh: true, sourceMonsters: null, traceId: null, source: null }
    }
    if (payload && typeof payload === 'object') {
      const traceId = typeof payload.traceId === 'string' && payload.traceId ? payload.traceId : null
      const source = typeof payload.source === 'string' && payload.source ? payload.source : null
      return {
        forceRefresh: payload.forceRefresh === true,
        sourceMonsters: payload.sourceMonsters || null,
        traceId,
        source
      }
    }
    return { forceRefresh: false, sourceMonsters: null, traceId: null, source: null }
  }

  /**
   * 解析本次启动/刷新要使用的怪物源
   * @param {any} payload
   * @returns {any}
   */
  const resolveSourceMonsters = payload => {
    const normalized = normalizeStartPayload(payload)
    if (hasValidMonsters(normalized.sourceMonsters)) {
      return normalized.sourceMonsters
    }
    const optionMonsters = typeof getOptionMonsters === 'function' ? getOptionMonsters() : null
    if (hasValidMonsters(optionMonsters)) {
      return optionMonsters
    }
    return null
  }

  /**
   * 取消倒计时与预生成波次缓存
   * @returns {void}
   */
  const cancelCountdown = () => {
    showCountdown.value = false
    autoBattleStore.setCountdownPeriod(false)
    prefetchedMonstersForCountdown.value = null
  }

  /**
   * 应用预生成波次到 monstersStore
   * @param {any} wave
   * @returns {boolean}
   */
  const applyMonstersWave = wave => {
    if (!Array.isArray(wave)) {
      return false
    }
    if (monstersStore && typeof monstersStore.applyMonstersWave === 'function') {
      return monstersStore.applyMonstersWave(wave, { updateRefreshTime: true })
    }
    monstersStore.currentMonsters = wave
    return true
  }

  /**
   * 确保 monstersStore 存在可用于战斗的怪物
   * @param {{force?:boolean, sourceMonsters?:any}} [params]
   * @returns {boolean}
   */
  const ensureMonstersReady = ({ force = false, sourceMonsters = null } = {}) => {
    try {
      const monsterSettings = resolveMonsterFilterSettings()
      syncMonsterFilterConfig(monsterSettings)
      const { monsterMinLevel, monsterMaxLevel, monsterDisplayCount, monsterBossProbability } =
        monsterSettings

      if (!force && hasValidMonstersForDisplayCount(monstersStore.currentMonsters, monsterDisplayCount)) {
        updateMonsters(monstersStore.currentMonsters, false)
        return true
      }

      const resolvedSourceMonsters = hasValidMonsters(sourceMonsters)
        ? sourceMonsters
        : force
          ? null
          : resolveSourceMonsters()
      if (hasValidMonsters(resolvedSourceMonsters)) {
        applyMonstersWave(resolvedSourceMonsters)
        updateMonsters(monstersStore.currentMonsters, false)
        return true
      }

      const currentMap = typeof getCurrentMap === 'function' ? getCurrentMap() : null
      const spawned =
        currentMap?.name &&
        currentMap?.levelRange &&
        typeof monstersStore.spawnMonstersBySettings === 'function'
          ? monstersStore.spawnMonstersBySettings(
            currentMap.name,
            currentMap.levelRange,
            monsterDisplayCount,
            monsterMinLevel,
            monsterMaxLevel,
            monsterBossProbability
          )
          : monstersStore.spawnMonstersForAutoBattle(
            monsterDisplayCount,
            monsterMinLevel,
            monsterMaxLevel,
            monsterBossProbability
          )
      if (spawned) {
        updateMonsters(monstersStore.currentMonsters, false)
        return true
      }
      consumeAutoBattleNotice()
      return false
    } catch (error) {
      console.error('[useAutoBattleMonsters] ensureMonstersReady 失败:', error)
      return false
    }
  }

  /**
   * 强制刷新怪物列表（并处理倒计时冲突）
   * @param {any} payload
   * @returns {Promise<boolean>}
   */
  const refreshMonsters = async payload => {
    let result = false
    try {
      if (isRefreshing.value !== true) {
        autoBattleStore.setRefreshing(true)
      }
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
      const { forceRefresh, sourceMonsters } = normalizeStartPayload(payload)

      if (showCountdown.value || isInCountdownPeriod.value) {
        if (!forceRefresh) {
          result = false
          return result
        }
        cancelCountdown()
      }

      const monsterSettings = resolveMonsterFilterSettings()
      syncMonsterFilterConfig(monsterSettings)

      const workerRefreshed = await refreshMonstersWithWorker(monsterSettings, sourceMonsters)
      if (workerRefreshed) {
        result = true
        return result
      }

      const refreshed = ensureMonstersReady({ force: true, sourceMonsters })
      if (!refreshed) {
        consumeAutoBattleNotice()
        result = false
        return result
      }

      updateMonsters(monstersStore.currentMonsters, false)
      result = true
      return result
    } catch (error) {
      console.error('[useAutoBattleMonsters] refreshMonsters 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('刷新怪物失败，请稍后重试')
      }
      result = false
      return result
    } finally {
      if (isRefreshing.value !== false) {
        autoBattleStore.setRefreshing(false)
      }
    }
  }

  /**
   * 开始获取新怪物倒计时，并预生成下一波怪物
   * @returns {boolean}
   */
  const startMonsterFetchCountdown = () => {
    if (!autoBattle.value) {
      return false
    }

    if (showCountdown.value || isInCountdownPeriod.value) {
      return false
    }

    if (isActive.value && !isPaused.value) {
      pauseAutoBattle()
    }

    showCountdown.value = true
    autoBattleStore.setCountdownPeriod(true)

    const settings = resolveMonsterFilterSettings()
    syncMonsterFilterConfig(settings)
    prefetchWaveWithWorker(settings)

    return true
  }

  /**
   * 倒计时结束后应用预生成波次，并在需要时恢复战斗
   * @returns {boolean}
   */
  const onCountdownFinished = () => {
    showCountdown.value = false
    autoBattleStore.setCountdownPeriod(false)

    const nextWave = prefetchedMonstersForCountdown.value
    prefetchedMonstersForCountdown.value = null

    if (hasValidMonsters(nextWave)) {
      applyMonstersWave(nextWave)
      updateMonsters(monstersStore.currentMonsters, false)
    } else {
      refreshMonstersAndMaybeResume(true)
      return true
    }

    if (!isActive.value || isPaused.value) {
      startOrResumeAutoBattle()
    }

    return true
  }

  return {
    showCountdown,
    cancelCountdown,
    hasValidMonsters,
    normalizeStartPayload,
    resolveSourceMonsters,
    ensureMonstersReady,
    refreshMonsters,
    startMonsterFetchCountdown,
    onCountdownFinished
  }
}
