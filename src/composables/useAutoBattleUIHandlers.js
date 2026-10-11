/**
 * @file useAutoBattleUIHandlers.js
 * @generated 2026-01-27
 */

import { provide } from 'vue'
import { useAutoBattleStore } from '@/store/autoBattle'
import { AUTO_BATTLE_CONTROLLER_KEY } from '@/utils/injectionKeys'

/**
 * 自动战斗 UI 处理器
 * 将 Main.vue 内的自动战斗 UI 响应逻辑收敛到 composable，降低主入口复杂度。
 */

/**
 * 自动战斗与 UI 的桥接处理器集合。
 * @param {object} params
 * @param {import('vue').Ref<any>} params.mainLayoutRef 
 * @param {import('vue').Ref<any>} params.gameInitializerManager
 * @param {import('vue').Ref<any>} params.player
 * @param {Function} params.showDamageNumber
 * @param {Function} params.addBattleLog
 * @param {Function} params.startAutoBattle
 * @param {Function} params.stopAutoBattle
 * @param {Function} params.toggleAutoBattle
 * @param {Function} params.updateConfig
 */
export function useAutoBattleUIHandlers (params) {
  const {
    mainLayoutRef,
    gameInitializerManager,
    player,
    showDamageNumber,
    addBattleLog
  } = params

  const autoBattleStore = useAutoBattleStore()

  const handleAutoBattleMonsterAttack = monsterIndex => {
    try {
      if (mainLayoutRef?.value && mainLayoutRef.value.triggerMonsterAttackAnimation) {
        mainLayoutRef.value.triggerMonsterAttackAnimation(monsterIndex)
      }
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] handleAutoBattleMonsterAttack 失败:', error)
    }
  }

  let pendingUiFlushHandle = null
  let pendingPlayerBarSnapshot = null
  let pendingTriggerPlayerAttackAnimation = false
  let pendingTriggerPlayerSkillAnimation = false
  let lastSkillSoundTime = 0
  const skillSoundInterval = 120

  const scheduleUiFlush = () => {
    if (pendingUiFlushHandle) {
      return
    }

    if (typeof requestAnimationFrame === 'function') {
      pendingUiFlushHandle = requestAnimationFrame(() => {
        pendingUiFlushHandle = null
        flushPendingUiUpdates()
      })
      return
    }

    pendingUiFlushHandle = setTimeout(() => {
      pendingUiFlushHandle = null
      flushPendingUiUpdates()
    }, 16)
  }

  const flushPendingUiUpdates = () => {
    try {
      const uiService = gameInitializerManager?.value?.services?.ui || null

      if (uiService) {
        if (pendingPlayerBarSnapshot && player?.value) {
          uiService.updateHealthBar(
            'playerHealthBar',
            pendingPlayerBarSnapshot.currentHealth,
            pendingPlayerBarSnapshot.maxHealth
          )
          uiService.updateManaBar(
            'playerManaBar',
            pendingPlayerBarSnapshot.currentMana,
            pendingPlayerBarSnapshot.maxMana
          )
          pendingPlayerBarSnapshot = null
        }
      }

      if (pendingTriggerPlayerAttackAnimation) {
        pendingTriggerPlayerAttackAnimation = false
        if (mainLayoutRef?.value && mainLayoutRef.value.triggerPlayerAttackAnimation) {
          mainLayoutRef.value.triggerPlayerAttackAnimation()
        }
      }

      if (pendingTriggerPlayerSkillAnimation) {
        pendingTriggerPlayerSkillAnimation = false
        if (mainLayoutRef?.value && mainLayoutRef.value.triggerPlayerSkillAnimation) {
          mainLayoutRef.value.triggerPlayerSkillAnimation()
        }
      }
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] handleAutoBattleAttack 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('显示自动战斗伤害失败，请稍后重试', 'error')
      }
    }
  }

  const normalizeAttackEvent = payload => {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const targetIndex = payload.targetIndex
    if (typeof targetIndex !== 'number') {
      return null
    }
    const advantageRaw = payload.elementAdvantage
    const advantageValue =
      advantageRaw === null || advantageRaw === undefined || advantageRaw === ''
        ? null
        : Number(advantageRaw)
    return {
      targetIndex,
      damage: Number.isFinite(payload.damage) ? payload.damage : 0,
      isCritical: Boolean(payload.isCritical),
      isHeal: Boolean(payload.isHeal),
      skill: payload.skill ?? null,
      isMiss: Boolean(payload.isMiss),
      weaponIcon: payload.weaponIcon ?? null,
      monsterIcon: payload.monsterIcon ?? null,
      isMpHeal: Boolean(payload.isMpHeal),
      text: typeof payload.text === 'string' ? payload.text : null,
      customText: payload.customText ?? null,
      elementType: typeof payload.elementType === 'string' ? payload.elementType : null,
      elementAdvantage: Number.isFinite(advantageValue)
        ? advantageValue
        : null,
      doubleJudgment: Boolean(payload.doubleJudgment),
      isOffhand: Boolean(payload.isOffhand)
    }
  }

  const handleAutoBattleAttack = payload => {
    try {
      const event = normalizeAttackEvent(payload)
      if (!event) {
        return
      }

      const targetIndex = event.targetIndex

      if (typeof showDamageNumber === 'function') {
        showDamageNumber(
          targetIndex,
          event.damage,
          event.isCritical,
          event.isHeal,
          event.skill,
          event.isMiss,
          event.weaponIcon,
          event.monsterIcon,
          event.isMpHeal,
          event.text,
          {
            elementType: event.elementType,
            elementAdvantage: event.elementAdvantage
          },
          null, // itemIcon
          event.doubleJudgment,
          event.isOffhand,
          event.customText
        )
      }

      if (targetIndex === -1 && player?.value) {
        pendingPlayerBarSnapshot = {
          currentHealth: player.value.currentHealth,
          maxHealth: player.value.maxHealth,
          currentMana: player.value.currentMana,
          maxMana: player.value.maxMana
        }
      } else if (targetIndex >= 0) {
        pendingTriggerPlayerAttackAnimation = true
      }

      scheduleUiFlush()
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] handleAutoBattleAttack 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('显示自动战斗伤害失败，请稍后重试', 'error')
      }
    }
  }

  // ========== 方案一：批量伤害事件处理 ==========
  /**
   * 处理批量攻击事件（AOE 优化）
   * 将多次独立伤害显示合并为批量处理
   * @param {Array} batchEvents - 批量攻击事件数组
   */
  const handleAutoBattleAttackBatch = batchEvents => {
    try {
      if (!Array.isArray(batchEvents) || batchEvents.length === 0) {
        return
      }

      // 标准化所有事件
      const normalizedEvents = batchEvents
        .map(event => normalizeAttackEvent(event))
        .filter(event => event !== null)

      if (normalizedEvents.length === 0) {
        return
      }

      // 批量显示伤害数字
      if (typeof showDamageNumber === 'function') {
        // 检查 showDamageNumber 是否支持批量模式
        if (typeof showDamageNumber.batch === 'function') {
          showDamageNumber.batch(normalizedEvents)
        } else {
          // 兼容模式：逐个显示，但合并动画调度
          for (const event of normalizedEvents) {
            showDamageNumber(
              event.targetIndex,
              event.damage,
              event.isCritical,
              event.isHeal,
              event.skill,
              event.isMiss,
              event.weaponIcon,
              event.monsterIcon,
              event.isMpHeal,
              event.text,
              {
                elementType: event.elementType,
                elementAdvantage: event.elementAdvantage
              },
              null, // itemIcon
              event.doubleJudgment,
              event.isOffhand,
              event.customText
            )
          }
        }
      }

      // 检查是否有玩家治疗事件
      const playerHealEvent = normalizedEvents.find(e => e.targetIndex === -1)
      if (playerHealEvent && player?.value) {
        pendingPlayerBarSnapshot = {
          currentHealth: player.value.currentHealth,
          maxHealth: player.value.maxHealth,
          currentMana: player.value.currentMana,
          maxMana: player.value.maxMana
        }
      }

      // 检查是否有对怪物的攻击
      const hasMonsterAttack = normalizedEvents.some(e => e.targetIndex >= 0)
      if (hasMonsterAttack) {
        pendingTriggerPlayerAttackAnimation = true
      }

      scheduleUiFlush()
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] handleAutoBattleAttackBatch 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('显示批量伤害失败，请稍后重试', 'error')
      }
    }
  }

  const handleAutoBattleSkillUse = skillData => {
    try {
      if (!skillData) {
        return
      }

      const audioService = gameInitializerManager?.value?.services?.audio
      if (audioService) {
        const now = Date.now()
        if (now - lastSkillSoundTime >= skillSoundInterval) {
          lastSkillSoundTime = now
          if (typeof audioService.playSkillSound === 'function') {
            audioService.playSkillSound(skillData)
          } else if (typeof audioService.playSkillSFX === 'function') {
            audioService.playSkillSFX(skillData)
          }
        }
      }

      pendingTriggerPlayerSkillAnimation = true
      scheduleUiFlush()

      // 派发全局施法特效事件，携带技能元素类型，触发玩家头像区域施法动画
      // 元素类型取值: fire / water / wind / earth / electricity / thunder / none
      try {
        const skillElement = skillData?.elementType ?? skillData?.element ?? 'none'
        window.dispatchEvent(new CustomEvent('skill-cast-effect', {
          detail: { element: skillElement }
        }))
      } catch (e) {
        // 忽略事件派发失败
      }

      // 检测箭雨技能，派发全局事件触发箭雨特效动画
      const skillName = String(skillData?.name || '')
      if (skillName === '箭雨') {
        try {
          window.dispatchEvent(new CustomEvent('skill-arrow-rain'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测冰箭技能，派发全局事件触发冰箭特效动画
      if (skillName === '冰箭') {
        try {
          window.dispatchEvent(new CustomEvent('skill-ice-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测火焰箭矢技能，派发全局事件触发火焰箭矢特效动画
      if (skillName === '火焰箭矢') {
        try {
          window.dispatchEvent(new CustomEvent('skill-fire-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      if (typeof addBattleLog === 'function') {
        // addBattleLog(`使用了技能: ${skillData.name}`)
      }
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] handleAutoBattleSkillUse 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('技能播放失败，请稍后重试', 'error')
      }
    }
  }

  const createStartFromUI = controller => async payload => {
    let result = false
    try {
      if (!controller || typeof controller.start !== 'function') {
        console.error('[useAutoBattleUIHandlers] 未提供 controller.start，无法启动自动战斗')
        if (typeof addBattleLog === 'function') {
          addBattleLog('开启自动战斗失败，请重试', 'error')
        }
        result = false
        return result
      }
      result = Boolean(await controller.start(payload || { forceRefresh: true }))
      return result
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] startAutoBattleFromUI 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('开启自动战斗失败，请重试', 'error')
      }
      result = false
      return result
    }
  }

  const createStopFromUI = controller => () => {
    try {
      if (!controller || typeof controller.stop !== 'function') {
        console.error('[useAutoBattleUIHandlers] 未提供 controller.stop，无法停止自动战斗')
        if (typeof addBattleLog === 'function') {
          addBattleLog('停止自动战斗失败，请重试', 'error')
        }
        return false
      }
      return controller.stop()
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] stopAutoBattleFromUI 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('停止自动战斗失败，请重试', 'error')
      }
      return false
    }
  }

  const createToggleFromUI = controller => async payload => {
    let result = false
    try {
      if (!controller || typeof controller.toggle !== 'function') {
        console.error('[useAutoBattleUIHandlers] 未提供 controller.toggle，无法切换自动战斗')
        if (typeof addBattleLog === 'function') {
          addBattleLog('切换自动战斗失败，请重试', 'error')
        }
        result = false
        return result
      }

      const traceId =
        typeof payload?.traceId === 'string' && payload.traceId
          ? payload.traceId
          : `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
      const resolvedPayload = {
        ...(payload && typeof payload === 'object' ? payload : null),
        forceRefresh: payload?.forceRefresh ?? true,
        traceId
      }

      result = Boolean(await controller.toggle(resolvedPayload))
      return result
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] toggleAutoBattleFromUI 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('切换自动战斗失败，请重试', 'error')
      }
      result = false
      return result
    }
  }

  const createUpdateConfigFromUI = controller => newConfig => {
    try {
      if (!newConfig || typeof newConfig !== 'object') {
        return false
      }
      if (controller && typeof controller.updateConfig === 'function') {
        controller.updateConfig(newConfig)
        return true
      }
      autoBattleStore.updateConfig(newConfig)
      return true
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] updateAutoBattleConfigFromUI 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('更新自动战斗配置失败，请稍后重试', 'error')
      }
      return false
    }
  }

  const createSaveConfigFromUI = controller => newConfig => {
    try {
      if (newConfig && typeof newConfig === 'object') {
        createUpdateConfigFromUI(controller)(newConfig)
      }
      const saved = autoBattleStore.saveConfig()
      if (!saved && typeof addBattleLog === 'function') {
        addBattleLog('保存自动战斗配置失败，请稍后重试', 'error')
      }
      return saved
    } catch (error) {
      console.error('[useAutoBattleUIHandlers] saveAutoBattleConfigFromUI 失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('保存自动战斗配置失败，请稍后重试', 'error')
      }
      return false
    }
  }

  const provideAutoBattleBindings = controller => {
    const startAutoBattleFromUI = createStartFromUI(controller)
    const stopAutoBattleFromUI = createStopFromUI(controller)
    const toggleAutoBattleFromUI = createToggleFromUI(controller)
    const updateAutoBattleConfigFromUI = createUpdateConfigFromUI(controller)
    const saveAutoBattleConfigFromUI = createSaveConfigFromUI(controller)

    provide(AUTO_BATTLE_CONTROLLER_KEY, {
      start: startAutoBattleFromUI,
      stop: stopAutoBattleFromUI,
      toggle: toggleAutoBattleFromUI,
      updateConfig: updateAutoBattleConfigFromUI,
      saveConfig: saveAutoBattleConfigFromUI
    })
  }

  return {
    handleAutoBattleMonsterAttack,
    handleAutoBattleAttack,
    handleAutoBattleAttackBatch,
    handleAutoBattleSkillUse,
    provideAutoBattleBindings
  }
}
