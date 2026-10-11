/**
 * @file useAutoBattleController.js
 * @generated 2026-01-27
 */

import { nextTick } from 'vue'
import { SkillEffectService } from '@/services/SkillEffectService'

export function useAutoBattleController (params) {
  const {
    autoBattleStore,
    isActive,
    isPaused,
    isStarting,
    isRefreshing,
    isInCountdownPeriod,
    autoBattle,
    config,
    addBattleLog,
    monstersApi,
    sessionApi,
    getAudioService,
    getCurrentMap
  } = params

  let hasPrewarmedWorkers = false
  Promise.resolve()
    .then(() => {
      if (hasPrewarmedWorkers) {
        return
      }
      hasPrewarmedWorkers = true

      SkillEffectService.requestWorker(
        'autoBattleDecision',
        {
          availableSkills: [],
          player: {
            currentHealth: 1,
            maxHealth: 1,
            currentMana: 1,
            maxMana: 1,
            activeBuffs: []
          },
          config: {
            manaThreshold: 0,
            healthThreshold: 0,
            skillSelectionStrategy: 'default'
          }
        },
        null,
        { urgent: true }
      ).catch(() => {})

      SkillEffectService.requestWorker(
        'autoBattleMonsterAttackBatch',
        { monsters: [], timestamp: 0, lastAttackTimes: [] },
        null,
        { urgent: true }
      ).catch(() => {})

      SkillEffectService.requestWorker(
        'aoe',
        { skill: { damage: 0, level: 1, element: 'none', elementCode: 0 }, player: { attack: 0, stats: {} }, monsters: [] },
        null,
        { urgent: true }
      ).catch(() => {})
    })
    .catch(error => {
      console.error('[useAutoBattleController] Worker 预热失败:', error)
    })

  let actionSequence = 0
  const nextActionSequence = () => {
    actionSequence += 1
    return actionSequence
  }
  const isLatestAction = seq => seq === actionSequence

  const resolveTraceId = payload => {
    if (typeof payload?.traceId === 'string' && payload.traceId) {
      return payload.traceId
    }
    return `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
  }

  const applyTraceToPayload = (payload, seq) => {
    const resolvedPayload = payload && typeof payload === 'object' ? payload : {}
    return {
      ...resolvedPayload,
      traceId: resolveTraceId(resolvedPayload),
      source: typeof resolvedPayload.source === 'string' && resolvedPayload.source ? resolvedPayload.source : null,
      seq: typeof seq === 'number' ? seq : null
    }
  }

  /**
   * 获取怪物刷新策略
   * @returns {'countdown'|'immediate'|'manual'}
   */
  const resolveRefreshStrategy = () => {
    const strategy = config.value?.monsterRefreshStrategy
    if (['countdown', 'immediate', 'manual'].includes(strategy)) {
      return strategy
    }
    return 'countdown'
  }

  /**
   * 同步 starting overlay 状态
   * @param {boolean} value
   * @returns {void}
   */
  const updateStartingState = value => {
    if (isStarting.value !== value) {
      autoBattleStore.setStarting(value)
    }
  }

  const playBattleMusic = () => {
    try {
      const audioService = typeof getAudioService === 'function' ? getAudioService() : null
      if (!audioService) {
        return
      }
      audioService.stopBGM?.()
      audioService.playMusic?.('battle', getCurrentMap?.()?.name)
    } catch (error) {
      console.error('[useAutoBattleController] 切换战斗音乐失败:', error)
    }
  }

  const playMapMusic = () => {
    try {
      const audioService = typeof getAudioService === 'function' ? getAudioService() : null
      const mapName = getCurrentMap?.()?.name
      if (!audioService || !mapName) {
        return
      }
      audioService.stopBGM?.()
      audioService.playMusic?.('map', mapName)
    } catch (error) {
      console.error('[useAutoBattleController] 切换地图音乐失败:', error)
    }
  }

  /**
   * 启动或从暂停恢复战斗
   * @param {any} payload
   * @param {number} seq
   * @returns {Promise<boolean>}
   */
  const startOrResumeAutoBattle = async (payload, seq) => {
    try {
      if (typeof seq !== 'number') {
        seq = nextActionSequence()
      }
      if (!isLatestAction(seq)) {
        return false
      }
      const tracePayload = applyTraceToPayload(payload, seq)
      sessionApi.setTraceContext?.(tracePayload)
      const ready = await sessionApi.ensureServiceReady()
      if (!ready) {
        if (typeof autoBattleStore?.setLastFailure === 'function') {
          autoBattleStore.setLastFailure({
            message: '自动战斗服务未就绪，请稍后重试',
            context: 'ensureServiceReady'
          })
        }
        return false
      }
      if (!isLatestAction(seq)) {
        return false
      }

      monstersApi.ensureMonstersReady({
        force: false,
        sourceMonsters: monstersApi.resolveSourceMonsters(payload)
      })

      if (!isActive.value) {
        if (!isLatestAction(seq)) {
          return false
        }
        const started = sessionApi.startServiceSession(tracePayload)
        if (!started && typeof autoBattleStore?.setLastFailure === 'function') {
          autoBattleStore.setLastFailure({
            message: '自动战斗启动失败，请稍后重试',
            context: 'startServiceSession'
          })
        }
        if (started && typeof autoBattleStore?.clearLastFailure === 'function') {
          autoBattleStore.clearLastFailure()
        }
        return started
      }
      if (isPaused.value) {
        if (!isLatestAction(seq)) {
          return false
        }
        sessionApi.resumeServiceSession(tracePayload)
        if (typeof autoBattleStore?.clearLastFailure === 'function') {
          autoBattleStore.clearLastFailure()
        }
      }
      return true
    } catch (error) {
      console.error('[useAutoBattleController] startOrResumeAutoBattle 失败:', error)
      if (typeof autoBattleStore?.setLastFailure === 'function') {
        autoBattleStore.setLastFailure({
          message: '自动战斗启动失败，请稍后重试',
          context: 'startOrResumeAutoBattle',
          detail: error?.message || null
        })
      }
      if (typeof addBattleLog === 'function') {
        addBattleLog('自动战斗启动失败，请稍后重试')
      }
      return false
    }
  }

  /**
   * 刷新怪物并在需要时启动/恢复战斗
   * @param {any} payload
   * @param {number} seq
   * @returns {Promise<boolean>}
   */
  const refreshMonstersAndMaybeResume = async (payload, seq) => {
    try {
      if (typeof seq !== 'number') {
        seq = nextActionSequence()
      }
      if (!isLatestAction(seq)) {
        return false
      }
      const normalized = monstersApi.normalizeStartPayload(payload)
      const tracePayload = applyTraceToPayload(
        normalized && typeof normalized === 'object' ? { ...normalized, traceId: normalized.traceId || payload?.traceId, source: normalized.source || payload?.source } : payload,
        seq
      )
      sessionApi.setTraceContext?.(tracePayload)
      const refreshed = await monstersApi.refreshMonsters(normalized)
      if (!refreshed) {
        if (typeof autoBattleStore?.setLastFailure === 'function') {
          autoBattleStore.setLastFailure({
            message: '刷新怪物失败，请稍后重试',
            context: 'refreshMonsters'
          })
        }
        return false
      }

      if (!sessionApi.autoBattleService.value || !isActive.value || isPaused.value) {
        return await startOrResumeAutoBattle(tracePayload, seq)
      }
      if (typeof autoBattleStore?.clearLastFailure === 'function') {
        autoBattleStore.clearLastFailure()
      }
      return true
    } catch (error) {
      console.error('[useAutoBattleController] refreshMonstersAndMaybeResume 失败:', error)
      if (typeof autoBattleStore?.setLastFailure === 'function') {
        autoBattleStore.setLastFailure({
          message: '自动战斗启动失败，请稍后重试',
          context: 'refreshMonstersAndMaybeResume',
          detail: error?.message || null
        })
      }
      if (typeof addBattleLog === 'function') {
        addBattleLog('自动战斗启动失败，请稍后重试')
      }
      return false
    }
  }

  /**
   * 启动自动战斗（包含刷新逻辑与用户日志）
   * @param {any} payload
   * @returns {Promise<boolean>}
   */
  const startAutoBattle = async payload => {
    const seq = nextActionSequence()
    try {
      const shouldSwitchMusic = !isActive.value && !isPaused.value
      updateStartingState(true)
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 0))
      if (shouldSwitchMusic) {
        playBattleMusic()
      }
      if (typeof autoBattleStore?.clearLastFailure === 'function') {
        autoBattleStore.clearLastFailure()
      }
      const wasActive = isActive.value
      const wasPaused = isPaused.value
      const started = await refreshMonstersAndMaybeResume(payload || true, seq)
      if (!started) {
        if (shouldSwitchMusic) {
          playMapMusic()
        }
        return false
      }
      if (typeof addBattleLog === 'function') {
        if (!wasActive) {
          addBattleLog('自动战斗已启动', 'success')
        } else if (wasPaused) {
          addBattleLog('自动战斗已恢复', 'info')
        }
      }
      return true
    } catch (error) {
      console.error('[useAutoBattleController] startAutoBattle 失败:', error)
      playMapMusic()
      if (typeof addBattleLog === 'function') {
        addBattleLog('自动战斗启动失败，请稍后重试')
      }
      return false
    } finally {
      if (isLatestAction(seq)) {
        updateStartingState(false)
      }
    }
  }

  /**
   * 停止自动战斗（包含倒计时清理与用户日志）
   * @returns {boolean}
   */
  const stopAutoBattle = () => {
    try {
      nextActionSequence()
      const wasActive = isActive.value || isPaused.value || isStarting.value || isRefreshing.value
      updateStartingState(false)
      autoBattleStore.setRefreshing(false)
      monstersApi.cancelCountdown()
      sessionApi.stopServiceSession()
      playMapMusic()
      if (wasActive && typeof addBattleLog === 'function') {
        addBattleLog('自动战斗已停止', 'info')
      }
      return true
    } catch (error) {
      console.error('[useAutoBattleController] stopAutoBattle 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('停止自动战斗失败，请稍后重试')
      }
      return false
    }
  }

  /**
   * 切换自动战斗状态（支持 payload 透传）
   * @param {any} payload
   * @returns {Promise<boolean>}
   */
  const toggleAutoBattle = async payload => {
    try {
      if (isStarting.value || isRefreshing.value || isInCountdownPeriod.value) {
        stopAutoBattle()
        return autoBattle.value
      }

      if (isPaused.value) {
        nextActionSequence()
        resumeAutoBattle()
        if (typeof addBattleLog === 'function') {
          addBattleLog('自动战斗已恢复', 'info')
        }
        return autoBattle.value
      }

      if (isActive.value) {
        stopAutoBattle()
        return autoBattle.value
      }

      await startAutoBattle(payload)
      return autoBattle.value
    } catch (error) {
      console.error('[useAutoBattleController] toggleAutoBattle 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('切换自动战斗失败，请稍后重试')
      }
      return autoBattle.value
    }
  }

  /**
   * 暂停自动战斗
   * @returns {boolean}
   */
  const pauseAutoBattle = () => {
    return sessionApi.pauseServiceSession()
  }

  /**
   * 恢复自动战斗
   * @returns {boolean}
   */
  const resumeAutoBattle = () => {
    return sessionApi.resumeServiceSession()
  }

  /**
   * 清场后的处理入口（按策略倒计时/立即/手动）
   * @returns {void}
   */
  const handleAllMonstersDefeated = () => {
    const strategy = resolveRefreshStrategy()
    if (strategy === 'immediate') {
      const seq = nextActionSequence()
      refreshMonstersAndMaybeResume(true, seq)
      return
    }
    if (strategy === 'manual') {
      if (isActive.value && !isPaused.value) {
        pauseAutoBattle()
      }
      if (typeof addBattleLog === 'function') {
        addBattleLog('怪物已清空，请手动刷新')
      }
      return
    }
    const started = monstersApi.startMonsterFetchCountdown()
    if (!started) {
      const seq = nextActionSequence()
      refreshMonstersAndMaybeResume(true, seq)
    }
  }

  /**
   * 给 Service 的刷新请求入口
   * @param {any} payload
   * @returns {Promise<boolean>}
   */
  const handleRefreshMonsters = async payload => {
    const seq = nextActionSequence()
    return await refreshMonstersAndMaybeResume(payload, seq)
  }

  /**
   * 给 UI 倒计时组件的完成回调入口
   * @returns {boolean}
   */
  const onCountdownFinished = () => {
    const nextWaveHandled = monstersApi.onCountdownFinished()
    if (!nextWaveHandled) {
      return false
    }
    return true
  }

  return {
    startAutoBattle,
    stopAutoBattle,
    toggleAutoBattle,
    pauseAutoBattle,
    resumeAutoBattle,
    startOrResumeAutoBattle,
    refreshMonstersAndMaybeResume,
    onCountdownFinished,
    handleAllMonstersDefeated,
    handleRefreshMonsters
  }
}
