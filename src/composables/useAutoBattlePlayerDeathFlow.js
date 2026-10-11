/**
 * @file useAutoBattlePlayerDeathFlow.js
 * @generated 2026-01-27
 */
import { ref } from 'vue'
import { storageService } from '@/services/StorageService'

/**
 * 自动战斗玩家死亡编排：死亡音效、倒计时与复活后的恢复动作统一收敛
 * @param {Object} options
 * @param {import('vue').Ref<any>} options.player
 * @param {import('vue').Ref<any>} options.currentMap
 * @param {import('vue').Ref<any>} options.autoBattleComponentRef
 * @param {() => any} options.getAudioService
 * @param {() => any} options.getUIService
 * @param {(message: string, type?: string) => void} options.addBattleLog
 * @param {() => void} options.savePlayerData
 * @param {() => boolean} options.getShouldResumeAutoBattle
 * @param {() => Function | null} options.getStopAutoBattle
 * @param {() => Function | null} options.getStartAutoBattle
 * @returns {{
 *  isPlayerDead: import('vue').Ref<boolean>,
 *  playerDeathCountdown: import('vue').Ref<number>,
 *  handlePlayerDeathInAutoBattle: () => void,
 *  onPlayerDeathCountdownFinished: () => void
 * }}
 */
export function useAutoBattlePlayerDeathFlow ({
  player,
  currentMap,
  autoBattleComponentRef,
  getAudioService,
  getUIService,
  addBattleLog,
  savePlayerData,
  getShouldResumeAutoBattle,
  getStopAutoBattle,
  getStartAutoBattle
}) {
  const isPlayerDead = ref(false)
  const playerDeathCountdown = ref(0)
  const playerDeathResurrectHandler = ref(null)

  /**
   * 处理自动战斗期间的玩家死亡事件
   * @returns {void}
   */
  const handlePlayerDeathInAutoBattle = () => {
    if (isPlayerDead.value) {
      return
    }

    isPlayerDead.value = true
    const shouldResumeAutoBattle = Boolean(getShouldResumeAutoBattle?.())

    if (autoBattleComponentRef?.value) {
      try {
        autoBattleComponentRef.value.stopPulseAnimation?.()
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] stopPulseAnimation 执行失败:', error)
      }
    }

    try {
      const audioService = typeof getAudioService === 'function' ? getAudioService() : null
      if (audioService) {
        audioService.stopBGM?.()
        const gender = player?.value?.gender || 'male'
        audioService.playDeathSFX?.(gender)
      }
    } catch (error) {
      console.error('[useAutoBattlePlayerDeathFlow] 处理玩家死亡音效失败:', error)
    }

    if (shouldResumeAutoBattle) {
      try {
        const stopFn = typeof getStopAutoBattle === 'function' ? getStopAutoBattle() : null
        stopFn?.()
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 停止自动战斗失败:', error)
      }
    }

    const playerLevel = Number(player?.value?.level) || 1
    const countdownSeconds = Math.max(5, Math.floor(playerLevel / 10))
    playerDeathCountdown.value = countdownSeconds

    const handlePlayerResurrect = () => {
      try {
        if (player?.value) {
          player.value.currentHealth = player.value.maxHealth
          player.value.currentMana = player.value.maxMana
        }
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 恢复玩家属性失败:', error)
      }

      try {
        const audioService = typeof getAudioService === 'function' ? getAudioService() : null
        audioService?.stopAllAudio?.()
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 停止死亡音效失败:', error)
      }

      try {
        const audioService = typeof getAudioService === 'function' ? getAudioService() : null
        if (audioService && currentMap?.value?.name) {
          if (shouldResumeAutoBattle) {
            audioService.stopBGM?.()
            audioService.playMusic?.('battle', currentMap.value.name)
          } else {
            audioService.stopBGM?.()
            audioService.playMusic?.('map', currentMap.value.name)
          }
        }
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 播放战斗音乐失败:', error)
      }

      if (shouldResumeAutoBattle) {
        try {
          const startFn = typeof getStartAutoBattle === 'function' ? getStartAutoBattle() : null
          startFn?.()
        } catch (error) {
          console.error('[useAutoBattlePlayerDeathFlow] 启动自动战斗失败:', error)
        }
      }

      if (autoBattleComponentRef?.value) {
        try {
          autoBattleComponentRef.value.startPulseAnimation?.()
        } catch (error) {
          console.error('[useAutoBattlePlayerDeathFlow] startPulseAnimation 执行失败:', error)
        }
      }

      try {
        const uiService = typeof getUIService === 'function' ? getUIService() : null
        if (uiService && player?.value) {
          uiService.updateHealthBar?.(
            'playerHealthBar',
            player.value.currentHealth,
            player.value.maxHealth
          )
          uiService.updateManaBar?.('playerManaBar', player.value.currentMana, player.value.maxMana)
        }
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 更新玩家 UI 失败:', error)
      }

      try {
        if (typeof addBattleLog === 'function') {
          addBattleLog('你已复活，HP和MP已完全恢复！')
        }
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 写入复活日志失败:', error)
      }

      try {
        // 使用补丁保存而非完整保存，避免触发后端"存档覆盖保护"误拦截
        // 复活只变更 currentHealth/currentMana，无需发送完整 player 数据
        // storageService 已通过 import 导入全局单例
        storageService.savePlayerPatch({
          currentHealth: player?.value?.currentHealth,
          currentMana: player?.value?.currentMana
        })
      } catch (error) {
        console.error('[useAutoBattlePlayerDeathFlow] 保存复活状态失败:', error)
      }

      isPlayerDead.value = false
      playerDeathCountdown.value = 0
    }

    playerDeathResurrectHandler.value = handlePlayerResurrect
  }

  /**
   * 玩家死亡倒计时结束后的回调入口
   * @returns {void}
   */
  const onPlayerDeathCountdownFinished = () => {
    if (playerDeathResurrectHandler.value) {
      playerDeathResurrectHandler.value()
    }
  }

  return {
    isPlayerDead,
    playerDeathCountdown,
    handlePlayerDeathInAutoBattle,
    onPlayerDeathCountdownFinished
  }
}
