/**
 * @file useGoldUpdateListener.js
 * @description 监听 gold-update 事件，并把金币变更同步到响应式 player、itemsStore 与 UI。
 * - 兼容历史字段：detail.gold / detail.newGold
 * - 优先使用 UIService 更新 DOM，不可用时回退到直接更新 #goldValue
 * - 同步更新 itemsStore.playerGold，避免背包金币显示跳动
 * @generated 2026-01-27
 */

import { formatGold4, getGoldValueClass } from '@/utils/goldDisplay'
import { useItemsStore } from '@/store/items'

/**
 * 监听 gold-update 事件，并把金币变更同步到响应式 player、itemsStore 与 UI。
 * - 兼容历史字段：detail.gold / detail.newGold
 * - 优先使用 UIService 更新 DOM，不可用时回退到直接更新 #goldValue
 * - 同步更新 itemsStore.playerGold，避免背包金币显示跳动
 * @param {Object} params
 * @param {import('vue').Ref<Object|null>} params.player - 玩家响应式引用
 * @param {import('vue').Ref<Object|null>} params.gameInitializerManager - 游戏初始化器引用
 * @param {Function|undefined|null} params.refreshBagModal - 用于触发背包 UI 刷新的函数
 * @returns {{ handleGoldUpdate: (event: CustomEvent) => void }}
 */
export function useGoldUpdateListener (params) {
  const { player, gameInitializerManager, refreshBagModal } = params || {}

  /**
   * 从 gold-update 事件中解析金币数值。
   * @param {CustomEvent|Event} event
   * @returns {number|null}
   */
  const resolveGoldFromEvent = event => {
    const detail = event && typeof event === 'object' ? event.detail : null
    if (!detail || typeof detail !== 'object') {
      return null
    }

    const rawGold = detail.gold !== undefined ? detail.gold : detail.newGold
    if (rawGold === undefined) {
      return null
    }

    const gold = Number(rawGold)
    if (!Number.isFinite(gold)) {
      return null
    }
    return gold
  }

  /**
   * 获取可用的 UIService（兼容不同挂载位置）。
   * @returns {Object|null}
   */
  const resolveUIService = () => {
    const manager = gameInitializerManager?.value
    if (!manager) {
      return null
    }
    return manager.uiService || manager.services?.ui || null
  }

  /**
   * 尝试把金币写入 DOM（作为 UIService 不可用时的备用方案）。
   * @param {number} gold
   * @returns {void}
   */
  const updateGoldValueElement = gold => {
    const goldValueElement = document.getElementById('goldValue')
    if (!goldValueElement) {
      return
    }
    goldValueElement.className = `gold-value ${getGoldValueClass(gold)}`
    goldValueElement.textContent = formatGold4(gold)
  }

  /**
   * gold-update 事件处理函数。
   * 同步更新 player.gold、itemsStore.playerGold 和 UI 显示，
   * 确保 gameStore.player.gold 与 itemsStore.playerGold 始终一致，
   * 避免背包金币显示跳动（如击杀怪物后 100→122→100 闪烁）。
   * @param {CustomEvent} event
   * @returns {void}
   */
  const handleGoldUpdate = event => {
    try {
      const gold = resolveGoldFromEvent(event)
      if (gold === null) {
        return
      }

      // 同步更新 gameStore.player.gold
      if (player?.value) {
        player.value.gold = gold
      }

      // ★ 同步更新 itemsStore.playerGold
      // 根因：击杀怪物时 player.value.gold += reward 只更新了 gameStore.player.gold，
      // 没有同步 itemsStore.playerGold。BagModal 的 loadBankData() 优先读取
      // itemsStore.playerGold（旧值），导致金币显示跳动（新值→旧值→新值）
      try {
        const itemsStore = useItemsStore()
        if (itemsStore) {
          itemsStore.playerGold = gold
        }
      } catch (storeError) {
        // itemsStore 可能未初始化（如登录页），忽略此错误
      }

      const uiService = resolveUIService()
      if (uiService && typeof uiService.updateGoldDisplay === 'function') {
        uiService.updateGoldDisplay(gold)
      } else {
        updateGoldValueElement(gold)
      }

      if (typeof refreshBagModal === 'function') {
        // 延迟执行 refreshBagModal，避免在 gold-update 事件处理中同步阻塞
        setTimeout(() => {
          try {
            refreshBagModal()
          } catch (e) {
            // 忽略刷新失败
          }
        }, 0)
      }
    } catch (error) {
      console.error('[useGoldUpdateListener] handleGoldUpdate 失败:', error)
    }
  }

  return {
    handleGoldUpdate
  }
}
