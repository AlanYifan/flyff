/**
 * @file useAutoBattleServiceSession.js
 * @generated 2026-01-27
 */

import { ref, watch } from 'vue'
import AutoBattleService from '@/services/AutoBattleService.refactored'

export function useAutoBattleServiceSession (params) {
  const {
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
    handleAllMonstersDefeated,
    handleRefreshMonsters
  } = params

  const autoBattleService = ref(null)
  const statsSyncIntervalMs = 250
  let statsSyncTimerId = null
  let lastSyncedStats = null
  let lastSyncedTimerStats = null
  let pendingPlayerVitalsSnapshot = null
  let playerVitalsRafId = 0
  let pendingMonsterVitalsByIndex = null
  let monsterVitalsRafId = 0
  let lastTraceContext = null

  const setTraceContext = payload => {
    try {
      if (!payload || typeof payload !== 'object') {
        return false
      }
      const traceId = typeof payload.traceId === 'string' && payload.traceId ? payload.traceId : null
      const source = typeof payload.source === 'string' && payload.source ? payload.source : null
      const seq = typeof payload.seq === 'number' ? payload.seq : null
      lastTraceContext = { traceId, source, seq }
      if (autoBattleService.value && typeof autoBattleService.value.setTraceContext === 'function') {
        autoBattleService.value.setTraceContext(lastTraceContext)
      }
      return true
    } catch (error) {
      console.error('[useAutoBattleServiceSession] setTraceContext 失败:', error)
      return false
    }
  }

  const resolvePlayer = () => {
    if (typeof getPlayer === 'function') {
      return getPlayer()
    }
    return gameStore.player || playerStore.player
  }

  const pickNumber = value => {
    try {
      const next = Number(value)
      return Number.isFinite(next) ? next : null
    } catch (error) {
      return null
    }
  }

  const areSameShallow = (a, b, keys) => {
    if (a === b) {
      return true
    }
    if (!a || !b) {
      return false
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (a[key] !== b[key]) {
        return false
      }
    }
    return true
  }

  const normalizeStats = stats => {
    if (!stats || typeof stats !== 'object') {
      return null
    }
    const startTime = pickNumber(stats.startTime)
    const endTime = pickNumber(stats.endTime)
    const lastAttackTime = pickNumber(stats.lastAttackTime)
    return {
      totalAttacks: pickNumber(stats.totalAttacks) ?? 0,
      totalDamage: pickNumber(stats.totalDamage) ?? 0,
      monstersDefeated: pickNumber(stats.monstersDefeated) ?? 0,
      skillsUsed: pickNumber(stats.skillsUsed) ?? 0,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      lastAttackTime: lastAttackTime ?? null
    }
  }

  const normalizeTimerStats = timerStats => {
    if (!timerStats || typeof timerStats !== 'object') {
      return null
    }
    const fps = pickNumber(timerStats.fps)
    const errorCount = pickNumber(timerStats.errorCount)
    const lastSkillCheck = pickNumber(timerStats.lastSkillCheck)
    const lastCooldownUpdate = pickNumber(timerStats.lastCooldownUpdate)
    const lastMonsterAttack = pickNumber(timerStats.lastMonsterAttack)
    return {
      isRunning: Boolean(timerStats.isRunning),
      isPaused: Boolean(timerStats.isPaused),
      schedulerType: typeof timerStats.schedulerType === 'string' ? timerStats.schedulerType : 'unknown',
      fps: fps ?? null,
      errorCount: errorCount ?? 0,
      lastSkillCheck: lastSkillCheck ?? null,
      lastCooldownUpdate: lastCooldownUpdate ?? null,
      lastMonsterAttack: lastMonsterAttack ?? null
    }
  }

  const syncStatsFromServiceOnce = () => {
    try {
      // 不跳过后台同步，后台模式下战斗仍在运行，统计数据需要持续更新
      const status = autoBattleService.value?.getStatus?.()
      if (!status) {
        return
      }

      const nextStats = normalizeStats(status.stats)
      if (nextStats) {
        const keys = [
          'totalAttacks',
          'totalDamage',
          'monstersDefeated',
          'skillsUsed',
          'startTime',
          'endTime',
          'lastAttackTime'
        ]
        if (!areSameShallow(lastSyncedStats, nextStats, keys)) {
          lastSyncedStats = nextStats
          autoBattleStore.scheduleUpdate('stats', nextStats)
        }
      }

      const nextTimerStats = normalizeTimerStats(status.timerStats)
      if (nextTimerStats) {
        const keys = [
          'isRunning',
          'isPaused',
          'schedulerType',
          'fps',
          'errorCount',
          'lastSkillCheck',
          'lastCooldownUpdate',
          'lastMonsterAttack'
        ]
        if (!areSameShallow(lastSyncedTimerStats, nextTimerStats, keys)) {
          lastSyncedTimerStats = nextTimerStats
          autoBattleStore.scheduleUpdate('timerStats', nextTimerStats)
        }
      }
    } catch (error) {
      console.error('[useAutoBattleServiceSession] 同步统计数据失败:', error)
    }
  }

  const startStatsSyncLoop = () => {
    if (statsSyncTimerId) {
      return
    }
    statsSyncTimerId = setInterval(() => {
      syncStatsFromServiceOnce()
    }, statsSyncIntervalMs)
  }

  const stopStatsSyncLoop = () => {
    if (!statsSyncTimerId) {
      return
    }
    clearInterval(statsSyncTimerId)
    statsSyncTimerId = null
  }

  const schedulePlayerVitalsSync = snapshot => {
    try {
      if (!snapshot || typeof snapshot !== 'object') {
        return
      }
      const merged = {
        currentHealth:
          snapshot.currentHealth !== undefined ? snapshot.currentHealth : pendingPlayerVitalsSnapshot?.currentHealth,
        maxHealth:
          snapshot.maxHealth !== undefined ? snapshot.maxHealth : pendingPlayerVitalsSnapshot?.maxHealth,
        currentMana:
          snapshot.currentMana !== undefined ? snapshot.currentMana : pendingPlayerVitalsSnapshot?.currentMana,
        maxMana: snapshot.maxMana !== undefined ? snapshot.maxMana : pendingPlayerVitalsSnapshot?.maxMana
      }
      pendingPlayerVitalsSnapshot = merged

      if (playerVitalsRafId) {
        return
      }
      playerVitalsRafId = requestAnimationFrame(() => {
        playerVitalsRafId = 0
        const payload = pendingPlayerVitalsSnapshot
        pendingPlayerVitalsSnapshot = null
        if (!payload) {
          return
        }
        try {
          if (typeof gameStore?.updatePlayerVitals === 'function') {
            gameStore.updatePlayerVitals(payload)
          } else if (typeof gameStore?.updatePlayer === 'function') {
            gameStore.updatePlayer(payload)
          } else if (gameStore?.player) {
            const nextCurrentHealth = Number(payload?.currentHealth)
            const nextMaxHealth = Number(payload?.maxHealth)
            const nextCurrentMana = Number(payload?.currentMana)
            const nextMaxMana = Number(payload?.maxMana)
            if (Number.isFinite(nextCurrentHealth)) {
              gameStore.player.currentHealth = nextCurrentHealth
            }
            if (Number.isFinite(nextMaxHealth)) {
              gameStore.player.maxHealth = nextMaxHealth
            }
            if (Number.isFinite(nextCurrentMana)) {
              gameStore.player.currentMana = nextCurrentMana
            }
            if (Number.isFinite(nextMaxMana)) {
              gameStore.player.maxMana = nextMaxMana
            }
          }
        } catch (error) {
          console.error('[useAutoBattleServiceSession] 同步玩家 vitals 到 Store 失败:', error)
        }

        try {
          if (autoBattleService.value && gameStore?.player) {
            autoBattleService.value.updatePlayer(gameStore.player)
          }
        } catch (error) {
          console.error('[useAutoBattleServiceSession] 同步 AutoBattleService 玩家引用失败:', error)
        }
      })
    } catch (error) {
      console.error('[useAutoBattleServiceSession] schedulePlayerVitalsSync 失败:', error)
    }
  }

  const scheduleMonsterVitalsSyncByIndex = index => {
    try {
      const targetIndex = Number(index)
      if (!Number.isFinite(targetIndex) || targetIndex < 0) {
        return
      }
      const monster = monstersStore?.currentMonsters?.[targetIndex] || null
      if (!monster) {
        return
      }

      const maxHealth = Math.max(0, Number(monster.maxHealth) || 0)
      const currentHealth = Math.max(0, Number(monster.currentHealth) || 0)
      const healthPercentage = maxHealth > 0 ? Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100)) : 0

      if (!pendingMonsterVitalsByIndex) {
        pendingMonsterVitalsByIndex = new Map()
      }
      pendingMonsterVitalsByIndex.set(targetIndex, {
        index: targetIndex,
        currentHealth,
        healthPercentage,
        isDefeated: Boolean(monster.isDefeated) || currentHealth <= 0
      })

      if (monsterVitalsRafId) {
        return
      }
      monsterVitalsRafId = requestAnimationFrame(() => {
        monsterVitalsRafId = 0
        const map = pendingMonsterVitalsByIndex
        pendingMonsterVitalsByIndex = null
        if (!map || map.size === 0) {
          return
        }
        const updates = Array.from(map.values())
        try {
          if (typeof monstersStore?.applyMonsterVitalsBatchUpdates === 'function') {
            // handleDefeated: false — 死亡处理由 BattleMutationBatcher._flushDefeated 统一负责
            monstersStore.applyMonsterVitalsBatchUpdates(updates, { updateProxies: false, handleDefeated: false })
          }
        } catch (error) {
          console.error('[useAutoBattleServiceSession] 同步怪物 vitals 到 Store 失败:', error)
        }
      })
    } catch (error) {
      console.error('[useAutoBattleServiceSession] scheduleMonsterVitalsSyncByIndex 失败:', error)
    }
  }

  const normalizeAttackEvent = attackEvent => {
    if (!attackEvent || typeof attackEvent !== 'object') {
      return null
    }
    const targetIndex = attackEvent.targetIndex
    if (typeof targetIndex !== 'number') {
      return null
    }
    return {
      targetIndex,
      damage: Number.isFinite(attackEvent.damage) ? attackEvent.damage : 0,
      isCritical: Boolean(attackEvent.isCritical),
      isHeal: Boolean(attackEvent.isHeal),
      skill: attackEvent.skill ?? null,
      isMiss: Boolean(attackEvent.isMiss),
      weaponIcon: attackEvent.weaponIcon ?? null,
      monsterIcon: attackEvent.monsterIcon ?? null,
      elementType: typeof attackEvent.elementType === 'string' ? attackEvent.elementType : null,
      elementAdvantage: attackEvent.elementAdvantage ?? null,
      doubleJudgment: Boolean(attackEvent.doubleJudgment),
      isOffhand: Boolean(attackEvent.isOffhand),
      customText: attackEvent.customText ?? null
    }
  }

  /**
   * 初始化 AutoBattleService，并绑定回调
   * @returns {Promise<boolean>}
   */
  const initAutoBattleService = async () => {
    try {
      if (!autoBattleService.value) {
        autoBattleService.value = new AutoBattleService()
      }

      const initOptions = {
        player: resolvePlayer(),
        gameData: gameStore.gameData,
        skillService: getSkillService(),
        audioService: getAudioService(),
        config: config.value,
        skills: skillsStore.skills,
        monsters: monstersStore.currentMonsters,

        onAttack: attackEvent => {
          try {
            const targetIndex = Number(attackEvent?.targetIndex)
            if (Number.isFinite(targetIndex) && targetIndex >= 0) {
              scheduleMonsterVitalsSyncByIndex(targetIndex)
            }
          } catch (error) {
            console.error('[useAutoBattleServiceSession] onAttack 同步怪物 vitals 失败:', error)
          }

          if (typeof options.onAttack === 'function') {
            const normalized = normalizeAttackEvent(attackEvent)
            if (normalized) {
              options.onAttack(normalized)
            }
          }
        },
        onSkillUse: skill => {
          if (typeof options.onSkillUse === 'function') {
            options.onSkillUse(skill)
          }
        },
        onLog: options.addBattleLog || options.onLog,
        onMonsterDefeated: (targetIndexOrPayload, monster) => {
          if (typeof options.onMonsterDefeated === 'function') {
            const batch = Array.isArray(targetIndexOrPayload?.batch)
              ? targetIndexOrPayload.batch
              : null
            if (batch) {
              options.onMonsterDefeated({ batch })
              return
            }
            options.onMonsterDefeated({ targetIndex: targetIndexOrPayload, monster })
          }
        },
        onAllMonstersDefeated: () => {
          // 先调用用户提供的回调（用于波次结算聚合等）
          if (typeof options.onAllMonstersDefeated === 'function') {
            try {
              options.onAllMonstersDefeated()
            } catch (error) {
              console.error('[useAutoBattleServiceSession] onAllMonstersDefeated 用户回调失败:', error)
            }
          }
          // 再调用控制器处理（倒计时/刷新等）
          handleAllMonstersDefeated()
        },
        onPlayerDeath: options.onPlayerDeath,
        onPlayerDamage: data => {
          try {
            const snapshot = data?.playerSnapshot
            schedulePlayerVitalsSync(snapshot)
          } catch (error) {
            console.error('[useAutoBattleServiceSession] 同步玩家受伤快照失败:', error)
          }

          if (options.onPlayerDamage) {
            options.onPlayerDamage(data)
          }
        },
        onPlayerHeal: data => {
          try {
            // 同步玩家生命值快照
            schedulePlayerVitalsSync({
              currentHealth: data?.newHealth,
              maxHealth: data?.maxHealth
            })
          } catch (error) {
            console.error('[useAutoBattleServiceSession] 同步玩家治疗快照失败:', error)
          }

          if (options.onPlayerHeal) {
            options.onPlayerHeal(data)
          }
        },
        onMonsterAttack: options.onMonsterAttack,
        onPaused: payload => {
          try {
            autoBattleStore.pause()
          } catch (error) {
            console.error('[useAutoBattleServiceSession] onPaused 处理失败:', error)
          }
        },
        onResumed: payload => {
          try {
            autoBattleStore.resume()
          } catch (error) {
            console.error('[useAutoBattleServiceSession] onResumed 处理失败:', error)
          }
        },
        onRefreshMonsters: payload => {
          handleRefreshMonsters(payload)
            .then(handled => {
              if (typeof options.onRefreshMonsters === 'function') {
                options.onRefreshMonsters({ handled })
              }
            })
            .catch(error => {
              console.error('[useAutoBattleServiceSession] onRefreshMonsters 失败:', error)
              if (typeof options.onRefreshMonsters === 'function') {
                options.onRefreshMonsters({ handled: false })
              }
            })
        }
      }

      autoBattleService.value.initialize(initOptions)
      return true
    } catch (error) {
      console.error('[useAutoBattleServiceSession] AutoBattleService 初始化失败:', error)
      return false
    }
  }

  /**
   * 确保 AutoBattleService 已就绪
   * @returns {Promise<boolean>}
   */
  const ensureServiceReady = async () => {
    let result = false
    try {
      if (!autoBattleService.value) {
        result = await initAutoBattleService()
        return result
      }
      result = true
      return result
    } catch (error) {
      console.error('[useAutoBattleServiceSession] ensureServiceReady 失败:', error)
      result = false
      return result
    }
  }

  /**
   * 启动战斗会话并同步 Store 状态
   * @returns {boolean}
   */
  const startServiceSession = payload => {
    if (!autoBattleService.value) {
      return false
    }
    setTraceContext(payload)
    const success = autoBattleService.value.start()
    if (success) {
      autoBattleStore.start()
      startStatsSyncLoop()
      syncStatsFromServiceOnce()
    }
    return success
  }

  /**
   * 停止战斗会话并同步 Store 状态
   * @returns {boolean}
   */
  const stopServiceSession = () => {
    if (autoBattleService.value) {
      autoBattleService.value.stop()
    }
    stopStatsSyncLoop()
    if (playerVitalsRafId) {
      cancelAnimationFrame(playerVitalsRafId)
      clearTimeout(playerVitalsRafId)
      playerVitalsRafId = 0
    }
    pendingPlayerVitalsSnapshot = null
    if (monsterVitalsRafId) {
      cancelAnimationFrame(monsterVitalsRafId)
      clearTimeout(monsterVitalsRafId)
      monsterVitalsRafId = 0
    }
    pendingMonsterVitalsByIndex = null
    autoBattleStore.stop()
    syncStatsFromServiceOnce()
    return true
  }

  /**
   * 暂停战斗会话并同步 Store 状态
   * @returns {boolean}
   */
  const pauseServiceSession = payload => {
    if (autoBattleService.value) {
      setTraceContext(payload)
      autoBattleService.value.pause({ source: 'controller' })
    }
    autoBattleStore.pause()
    return true
  }

  /**
   * 恢复战斗会话并同步 Store 状态
   * @returns {boolean}
   */
  const resumeServiceSession = payload => {
    if (autoBattleService.value) {
      setTraceContext(payload)
      autoBattleService.value.resume({ source: 'controller' })
    }
    autoBattleStore.resume()
    return true
  }

  /**
   * 同步怪物列表到 Service
   * @param {any} newMonsters
   * @param {boolean} [skipUpdate]
   * @returns {void}
   */
  const updateMonsters = (newMonsters, skipUpdate = false) => {
    if (skipUpdate) {return}
    if (autoBattleService.value) {
      autoBattleService.value.updateMonsters(newMonsters || monstersStore.currentMonsters, false)
    }
  }

  /**
   * 更新配置并同步到 Store 与 Service
   * @param {any} newConfig
   * @returns {void}
   */
  const updateConfig = newConfig => {
    autoBattleStore.updateConfig(newConfig)
    if (autoBattleService.value) {
      autoBattleService.value.updateConfig(newConfig)
    }
  }

  /**
   * 获取 Service 状态快照
   * @returns {object}
   */
  const getStatus = () => {
    if (autoBattleService.value) {
      return autoBattleService.value.getStatus()
    }
    return { isActive: false, isPaused: false }
  }

  /**
   * 预留事件订阅入口
   * @returns {void}
   */
  const subscribeToEvents = () => {}

  let lastPlayerRef = null
  let lastSkillServiceRef = null
  let lastAudioServiceRef = null
  let lastSkillsRef = null
  let lastMonstersRef = null
  let lastBossEncounterKey = null

  watch(() => resolvePlayer(), newPlayer => {
    if (!autoBattleService.value) {
      return
    }
    if (!newPlayer) {
      return
    }
    if (newPlayer === lastPlayerRef) {
      return
    }
    lastPlayerRef = newPlayer
    autoBattleService.value.updatePlayer(newPlayer)
  })

  watch(
    () => getSkillService(),
    newSkillService => {
      if (!autoBattleService.value) {
        return
      }
      if (newSkillService === lastSkillServiceRef) {
        return
      }
      lastSkillServiceRef = newSkillService
      autoBattleService.value.updateSkillService(newSkillService)
    }
  )

  watch(
    () => getAudioService(),
    newAudioService => {
      if (!autoBattleService.value) {
        return
      }
      if (newAudioService === lastAudioServiceRef) {
        return
      }
      lastAudioServiceRef = newAudioService
      autoBattleService.value.updateAudioService(newAudioService)
    }
  )

  watch(() => skillsStore.skills, newSkills => {
    if (!autoBattleService.value || !newSkills) {
      return
    }
    // 始终调用 updateSkills，让 AutoBattleSkillManager 内部处理变化检测
    // 这确保技能熟练度等变化能被正确同步
    autoBattleService.value.updateSkills(newSkills)
  }, { deep: true })

  watch(() => monstersStore.currentMonsters, newMonsters => {
    if (!autoBattleService.value) {
      return
    }
    if (newMonsters === lastMonstersRef) {
      return
    }
    lastMonstersRef = newMonsters
    try {
      const audioService = typeof getAudioService === 'function' ? getAudioService() : null
      if (audioService && Array.isArray(newMonsters)) {
        const specialRanks = new Set(['boss', 'giant', 'violet', 'super'])
        const specialMonsters = newMonsters.filter(
          monster => monster && specialRanks.has(String(monster.rank || 'normal').toLowerCase())
        )
        if (specialMonsters.length > 0) {
          const encounterKey = specialMonsters
            .map(monster => `${monster.id || 'unknown'}:${monster.rank || 'normal'}`)
            .join('|')
          if (encounterKey && encounterKey !== lastBossEncounterKey) {
            lastBossEncounterKey = encounterKey
            if (typeof audioService.playMonsterEncounterBGM === 'function') {
              audioService.playMonsterEncounterBGM('BgmInBoss.mp3', false)
            } else if (typeof audioService.playBGM === 'function') {
              audioService.playBGM('BgmInBoss.mp3', false)
            }
          }
        }
      }
    } catch (error) {
      console.error('[useAutoBattleServiceSession] 处理BOSS遭遇音效失败:', error)
    }
    autoBattleService.value.updateMonsters(newMonsters, false)
  })

  return {
    autoBattleService,
    initAutoBattleService,
    ensureServiceReady,
    startServiceSession,
    stopServiceSession,
    pauseServiceSession,
    resumeServiceSession,
    updateMonsters,
    updateConfig,
    getStatus,
    subscribeToEvents,
    setTraceContext
  }
}
