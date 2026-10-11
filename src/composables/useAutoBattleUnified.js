/**
 * 统一的自动战斗组合式API
 * 合并了 useAutoBattle 和 useAutoBattleBase 的功能
 * 提供完整的自动战斗控制接口
 */
import { ref, computed, watch, isRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useAutoBattleStore } from '@/store/autoBattle'
import { useMonstersStore } from '@/store/monsters'
import { usePlayerStore } from '@/store/player'
import { useSkillsStore } from '@/store/skills'
import { useGameStore } from '@/store'
import { useAutoBattleMonsters } from '@/composables/useAutoBattleMonsters'
import { useAutoBattleServiceSession } from '@/composables/useAutoBattleServiceSession'
import { useAutoBattleController } from '@/composables/useAutoBattleController'
import { calculateAttackInterval, isCasterClass } from '@/utils/autoBattleUtils'

export function useAutoBattleUnified (options = {}) {
  try {
    const autoBattleStore = useAutoBattleStore()
    const {
      isActive,
      isPaused,
      isRunning,
      isInCountdownPeriod,
      isStarting,
      isRefreshing,
      allMonstersDefeated,
      config,
      stats
    } = storeToRefs(autoBattleStore)

    const monstersStore = useMonstersStore()
    const playerStore = usePlayerStore()
    const skillsStore = useSkillsStore()
    const gameStore = useGameStore()

    const autoBattle = computed(() => isActive.value)

    const resolveOptionValue = value => {
      if (typeof value === 'function') {
        return value()
      }
      if (isRef(value)) {
        return value.value
      }
      return value
    }

    const getPlayer = () =>
      resolveOptionValue(options.player) || gameStore.player || playerStore.player

    const getSkillService = () => {
      if (typeof options.getSkillService === 'function') {
        return options.getSkillService()
      }
      return resolveOptionValue(options.skillService)
    }

    const getAudioService = () => {
      if (typeof options.getAudioService === 'function') {
        return options.getAudioService()
      }
      return resolveOptionValue(options.audioService)
    }

    const getCurrentMap = () => resolveOptionValue(options.currentMap)
    const getUserSettings = () => resolveOptionValue(options.userSettings) || {}

    const attackInterval = computed(() => {
      const baseAttackInterval = config.value?.baseAttackInterval || 2000
      const minAttackInterval = config.value?.minAttackInterval || 500
      const resolvedMinInterval = Math.max(500, Number(minAttackInterval) || 0)
      const className = String(getPlayer()?.class || '').toLowerCase()
      const useCastSpeed = isCasterClass(className)
      if (useCastSpeed) {
        // 法系施法速度线性映射：0% → 2000ms，200% → 500ms
        const rawCastSpeed = Number(getPlayer()?.decreasedCastingTime ?? 0)
        const normalizedCastSpeed = Number.isFinite(rawCastSpeed) ? rawCastSpeed : 0
        const maxCastSpeed = 2.0
        const clampedCastSpeed = Math.min(Math.max(normalizedCastSpeed, 0), maxCastSpeed)
        const intervalRange = Math.max(0, 2000 - resolvedMinInterval)
        return Math.floor(
          Math.max(
            resolvedMinInterval,
            2000 - (clampedCastSpeed / maxCastSpeed) * intervalRange
          )
        )
      }
      return Math.floor(
        calculateAttackInterval(
          baseAttackInterval,
          Number(getPlayer()?.attackSpeed) || 0,
          minAttackInterval,
          100
        )
      )
    })
    const healthThresholdPercent = computed(() =>
      Math.round((config.value?.healthThreshold || 0.3) * 100)
    )
    const manaThresholdPercent = computed(() =>
      Math.round((config.value?.manaThreshold || 0.2) * 100)
    )
    const recoveryThresholdPercent = computed(() =>
      Math.round((config.value?.recoveryThreshold || 0.5) * 100)
    )
    const battleDuration = computed(() => {
      const startTime = stats.value?.startTime
      if (!startTime) {return 0}
      const endTime = stats.value?.endTime || Date.now()
      return Math.max(0, endTime - startTime)
    })
    const averageDamage = computed(() => {
      const totalAttacks = stats.value?.totalAttacks || 0
      const totalDamage = stats.value?.totalDamage || 0
      if (totalAttacks <= 0) {
        return 0
      }
      return Math.floor(totalDamage / totalAttacks)
    })

    let controllerRef = null
    const pauseAutoBattleProxy = () => controllerRef?.pauseAutoBattle?.() ?? true
    const startOrResumeAutoBattleProxy = payload =>
      controllerRef?.startOrResumeAutoBattle
        ? controllerRef.startOrResumeAutoBattle(payload)
        : Promise.resolve(false)
    const refreshMonstersAndMaybeResumeProxy = payload =>
      controllerRef?.refreshMonstersAndMaybeResume
        ? controllerRef.refreshMonstersAndMaybeResume(payload)
        : Promise.resolve(false)
    const handleAllMonstersDefeatedProxy = () => controllerRef?.handleAllMonstersDefeated?.()
    const handleRefreshMonstersProxy = async payload =>
      controllerRef?.handleRefreshMonsters ? await controllerRef.handleRefreshMonsters(payload) : false

    const sessionApi = useAutoBattleServiceSession({
      options,
      autoBattleStore,
      monstersStore,
      playerStore,
      skillsStore,
      gameStore,
      config,
      getPlayer,
      getSkillService,
      getAudioService,
      handleAllMonstersDefeated: handleAllMonstersDefeatedProxy,
      handleRefreshMonsters: handleRefreshMonstersProxy
    })

    const monstersApi = useAutoBattleMonsters({
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
      getOptionMonsters: () => resolveOptionValue(options.monsters),
      pauseAutoBattle: pauseAutoBattleProxy,
      startOrResumeAutoBattle: startOrResumeAutoBattleProxy,
      refreshMonstersAndMaybeResume: refreshMonstersAndMaybeResumeProxy,
      updateMonsters: sessionApi.updateMonsters,
      updateConfig: sessionApi.updateConfig,
      addBattleLog: options.addBattleLog
    })

    const controllerApi = useAutoBattleController({
      autoBattleStore,
      isActive,
      isPaused,
      isStarting,
      isRefreshing,
      isInCountdownPeriod,
      autoBattle,
      config,
      addBattleLog: options.addBattleLog,
      monstersApi,
      sessionApi,
      getAudioService,
      getCurrentMap
    })

    controllerRef = controllerApi

    const resolveRefreshStrategy = () => {
      const strategy = config.value?.monsterRefreshStrategy
      if (['countdown', 'immediate', 'manual'].includes(strategy)) {
        return strategy
      }
      return 'countdown'
    }

    watch(
      () => {
        const settings = getUserSettings()
        return [
          settings?.monsterMinLevel,
          settings?.monsterMaxLevel,
          settings?.monsterDisplayCount,
          settings?.monsterBossProbability
        ]
      },
      () => {
        if (!autoBattle.value) {
          return
        }
        try {
          const settings = getUserSettings() || {}
          const monsterMinLevel = Math.max(1, Number(settings?.monsterMinLevel) || 1)
          const monsterMaxLevel = Math.max(monsterMinLevel, Number(settings?.monsterMaxLevel) || 3)
          const monsterDisplayCount = Math.min(
            10,
            Math.max(1, Number(settings?.monsterDisplayCount) || 2)
          )
          const bossProbabilityCandidate = Number(settings?.monsterBossProbability)
          const monsterBossProbability = Number.isFinite(bossProbabilityCandidate)
            ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
            : 0

          if (typeof sessionApi.updateConfig === 'function') {
            sessionApi.updateConfig({
              monsterMinLevel,
              monsterMaxLevel,
              monsterDisplayCount,
              monsterBossProbability
            })
          }
        } catch (error) {
          console.error('[useAutoBattleUnified] 同步怪物设置到自动战斗配置失败:', error)
        }
        if (resolveRefreshStrategy() === 'manual') {
          return
        }
        if (monstersApi.showCountdown.value || isInCountdownPeriod.value) {
          return
        }
        controllerApi.refreshMonstersAndMaybeResume(true)
      }
    )

    return {
      isActive,
      isPaused,
      isRunning,
      isInCountdownPeriod,
      allMonstersDefeated,
      autoBattle,
      showCountdown: monstersApi.showCountdown,
      autoBattleConfig: config,
      autoBattleService: sessionApi.autoBattleService,
      stats,
      config,
      attackInterval,
      healthThresholdPercent,
      manaThresholdPercent,
      recoveryThresholdPercent,
      battleDuration,
      averageDamage,
      initAutoBattleService: sessionApi.initAutoBattleService,
      startAutoBattle: controllerApi.startAutoBattle,
      stopAutoBattle: controllerApi.stopAutoBattle,
      toggleAutoBattle: controllerApi.toggleAutoBattle,
      pauseAutoBattle: controllerApi.pauseAutoBattle,
      resumeAutoBattle: controllerApi.resumeAutoBattle,
      updateMonsters: sessionApi.updateMonsters,
      refreshMonstersAndMaybeResume: controllerApi.refreshMonstersAndMaybeResume,
      startMonsterFetchCountdown: monstersApi.startMonsterFetchCountdown,
      onCountdownFinished: controllerApi.onCountdownFinished,
      updateConfig: sessionApi.updateConfig,
      getStatus: sessionApi.getStatus,
      cleanupAutoBattle: sessionApi.cleanupAutoBattle,
      subscribeToEvents: sessionApi.subscribeToEvents
    }
  } catch (error) {
    console.error('[useAutoBattleUnified] 初始化失败:', error)
    console.error('AUTO_BATTLE', '自动战斗组合式API初始化失败:', error)

    // 返回默认值以防止应用崩溃
    return {
      isActive: ref(false),
      isPaused: ref(false),
      isRunning: ref(false),
      isInCountdownPeriod: ref(false),
      allMonstersDefeated: ref(false),
      autoBattle: ref(false),
      autoBattleConfig: ref({}),
      autoBattleService: ref(null),
      stats: ref({}),
      config: ref({}),
      attackInterval: ref(1000),
      healthThresholdPercent: ref(30),
      manaThresholdPercent: ref(20),
      recoveryThresholdPercent: ref(50),
      battleDuration: ref(0),
      averageDamage: ref(0),
      initAutoBattleService: () => Promise.resolve(false),
      startAutoBattle: () => Promise.resolve(false),
      stopAutoBattle: () => Promise.resolve(false),
      toggleAutoBattle: () => Promise.resolve(false),
      pauseAutoBattle: () => Promise.resolve(false),
      resumeAutoBattle: () => Promise.resolve(false),
      updateMonsters: () => {},
      updateConfig: () => {},
      getStatus: () => ({ isActive: false, isPaused: false }),
      cleanupAutoBattle: () => {},
      subscribeToEvents: () => {}
    }
  }
}
