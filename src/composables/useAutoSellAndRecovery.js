/**
 * @fileoverview 自动出售和恢复组合式API
 * 基于AutoRecoveryService实现，提供Vue组件使用的响应式接口
 * @author CatPaw
 * @version 2.0.0
 */

import { ref, watch, onUnmounted, toRaw } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import {
  AutoRecoveryService,
  getAutoRecoveryService,
  AUTO_RECOVERY_BUFF_ID,
  AUTO_SELL_BUFF_ID
} from '@/services/AutoRecoveryService'
import { getEnhanceSellPriceBonus } from '@/utils/dropEnhanceGenerator'

/**
 * 自动恢复 Worker 实例
 * 在独立线程中计算 HP/MP 恢复物品使用，完全不阻塞主线程
 * @type {Worker|null}
 */
let autoRecoveryWorker = null

/** 是否正在恢复中（防止并发） */
let isRecovering = false

/**
 * 使用自动出售和恢复功能（组合式API）
 * 
 * @param {Ref<Object>} player - 玩家响应式引用
 * @param {Ref<Object>} userSettings - 用户设置响应式引用
 * @param {Ref<Object>} gameInitializer - 游戏初始化器响应式引用
 * @param {Function} addBattleLog - 添加战斗日志的函数
 * @param {Function} updatePlayerAttributes - 更新玩家属性的函数
 * @param {Function} useRecoveryItem - 使用恢复物品的函数
 * @param {Function} [onAutoSellItem] - 自动出售物品回调（用于聚合日志）
 * @returns {Object} 自动出售和恢复控制方法
 */
export function useAutoSellAndRecovery (
  player,
  userSettings,
  gameInitializer,
  addBattleLog,
  updatePlayerAttributes,
  useRecoveryItem,
  onAutoSellItem = null
) {
  // 使用 Pinia Store
  const itemsStore = useItemsStore()
  const gameStore = useGameStore()

  // 使用统一服务
  const autoRecoveryService = getAutoRecoveryService()

  // 定时器引用
  const autoSellTimer = ref(null)
  const autoRecoveryTimer = ref(null)
  const serviceReady = ref(false)
  const serviceWarningShown = ref(false)
  const lastDebugLogAt = ref(0)
  const bagChangeAutoSellTimer = ref(null)
  const isAutoSelling = ref(false)
  const stopBagWatch = ref(null)

  // 状态标记
  let pendingAutoSellRescan = false
  let autoSellEnabled = false
  let autoRecoveryEnabled = false

  // 常量配置
  const AUTO_SELL_CHECK_DEBOUNCE_MS = 800
  const AUTO_SELL_SCAN_BUDGET_MS = 8
  const AUTO_SELL_SCAN_MAX_ITEMS_PER_CHUNK = 20

  /**
   * 获取静态物品数量
   * @returns {number} 静态物品数量
   */
  const getStaticItemsCount = () => {
    const items = itemsStore.staticItems
    if (Array.isArray(items)) {
      return items.length
    }
    if (items && typeof items === 'object') {
      return Object.keys(items).length
    }
    return 0
  }

  /**
   * 调试日志（带节流）
   * @param {string} message - 日志消息
   * @param {*} [payload] - 日志负载
   */
  const debugLog = (message, payload = null) => {
    const now = Date.now()
    if (now - lastDebugLogAt.value < 1500) {
      return
    }
    lastDebugLogAt.value = now
    if (payload) {
      console.debug(`[自动出售] ${message}`, payload)
      return
    }
    console.debug(`[自动出售] ${message}`)
  }

  /**
   * 调度自动出售检查（防抖）
   */
  const scheduleAutoSellCheck = () => {
    if (!serviceReady.value) {
      return
    }

    if (bagChangeAutoSellTimer.value) {
      clearTimeout(bagChangeAutoSellTimer.value)
      bagChangeAutoSellTimer.value = null
    }

    bagChangeAutoSellTimer.value = setTimeout(() => {
      try {
        checkAndSellItems()
      } catch (error) {
        console.error('[自动出售] 背包变更触发自动出售失败:', error)
        if (typeof addBattleLog === 'function') {
          addBattleLog('自动出售执行失败，请稍后重试', 'error')
        }
      }
    }, AUTO_SELL_CHECK_DEBOUNCE_MS)
  }

  /**
   * 初始化自动恢复 Worker
   * 创建 Worker 实例并绑定消息处理回调
   * @returns {void}
   */
  const initAutoRecoveryWorker = () => {
    if (autoRecoveryWorker) return

    try {
      autoRecoveryWorker = new Worker(
        new URL('../workers/AutoRecoveryWorker.js', import.meta.url),
        { type: 'module' }
      )
    } catch (error) {
      console.error('[自动恢复] 创建 Worker 失败，回退到主线程模式:', error)
      return
    }

    autoRecoveryWorker.onmessage = (event) => {
      const { type } = event.data || {}

      switch (type) {
        case 'recovery-result': {
          isRecovering = false
          try {
            const { newHp, newMp, hpRecovered, mpRecovered, itemsUsed } = event.data

            if (itemsUsed.length === 0) {
              return
            }

            const playerVal = player.value
            if (!playerVal) return

            // 直接赋值 HP/MP，触发 Vue 响应式更新（无需 updatePlayer 的 Object.assign）
            if (hpRecovered > 0) {
              playerVal.currentHealth = newHp
              gameStore.player.currentHealth = newHp
            }
            if (mpRecovered > 0) {
              playerVal.currentMana = newMp
              gameStore.player.currentMana = newMp
            }

            // 定向更新背包物品 stack，避免全量数组拷贝
            itemsStore.$patch((state) => {
              for (const used of itemsUsed) {
                const item = state.playerBag[used.bagIndex]
                if (!item) continue
                if (item.currentStack !== undefined) {
                  item.currentStack = used.newStack
                } else {
                  item.stack = used.newStack
                }
              }
            })

            // 同步 player.bag 中对应物品的 stack（player.bag 与 itemsStore.playerBag 可能是不同引用）
            const playerBag = playerVal.bag
            if (Array.isArray(playerBag)) {
              for (const used of itemsUsed) {
                const item = playerBag[used.bagIndex]
                if (!item) continue
                if (item.currentStack !== undefined) {
                  item.currentStack = used.newStack
                } else {
                  item.stack = used.newStack
                }
              }
            }
          } catch (e) {
            console.error('[自动恢复] Worker 结果应用失败:', e)
          }
          break
        }

        case 'log': {
          const { level, args } = event.data
          const logFn = level === 'warn' ? console.warn
            : level === 'error' ? console.error
              : console.log
          if (Array.isArray(args)) {
            logFn(...args)
          }
          break
        }

        default:
          break
      }
    }

    autoRecoveryWorker.onerror = (error) => {
      isRecovering = false
      console.error('[自动恢复] Worker 错误:', error)
    }
  }

  /**
   * 收集背包中的恢复物品数据（使用 toRaw 剥离代理，零代理开销）
   * @returns {Array} 恢复物品数据数组
   */
  const collectRecoveryItems = () => {
    const rawBag = toRaw(itemsStore.playerBag)
    if (!Array.isArray(rawBag)) return []

    const recoveryItems = []

    for (let i = 0; i < rawBag.length; i++) {
      const item = toRaw(rawBag[i])
      if (!item || item.category !== 'recovery') continue

      const config = itemsStore.getItemConfig(item.id)
      if (!config || !config.abilities) continue

      const hpAbility = config.abilities.find(a => a.parameter === 'hp') || null
      const mpAbility = config.abilities.find(a => a.parameter === 'mp') || null

      if (!hpAbility && !mpAbility) continue

      recoveryItems.push({
        bagIndex: i,
        id: item.id,
        currentStack: item.currentStack,
        stack: item.stack,
        subcategory: item.subcategory,
        hpAbility: hpAbility ? { add: hpAbility.add, rate: Boolean(hpAbility.rate) } : null,
        mpAbility: mpAbility ? { add: mpAbility.add, rate: Boolean(mpAbility.rate) } : null
      })
    }

    return recoveryItems
  }

  /**
   * 自动恢复HP和MP
   * 将恢复计算迁移到 Worker 线程，主线程只做轻量赋值
   */
  const autoRecoverHealthAndMana = () => {
    if (!player.value) {
      return
    }

    // 检查是否有自动恢复BUFF
    if (!autoRecoveryService.hasAutoRecoveryBuff(player.value)) {
      return
    }

    if (player.value.currentHealth <= 0 || player.value.isDead?.()) {
      return
    }

    // 防止并发恢复
    if (isRecovering) {
      return
    }

    // 确保 Worker 已初始化
    if (!autoRecoveryWorker) {
      initAutoRecoveryWorker()
    }

    // Worker 创建失败时回退到主线程模式
    if (!autoRecoveryWorker) {
      try {
        const settings = userSettings.value || {}
        const result = autoRecoveryService.batchRecoverForMember(
          player.value,
          itemsStore.playerBag,
          settings
        )
        if (result.itemsUsed.length > 0) {
          player.value.bag = [...itemsStore.playerBag]
        }
      } catch (error) {
        console.error('[自动恢复] 主线程回退执行失败:', error)
      }
      return
    }

    isRecovering = true

    try {
      // 使用 toRaw 剥离代理，收集恢复物品数据
      const recoveryItems = collectRecoveryItems()

      // 剥离 Vue 响应式代理，仅传递原始数值给 Worker
      // postMessage 使用 structured clone，无法克隆 Proxy 对象
      const rawPlayer = toRaw(player.value)
      const rawSettings = toRaw(userSettings.value || {})

      autoRecoveryWorker.postMessage({
        type: 'recover',
        member: {
          currentHealth: Number(rawPlayer.currentHealth) || 0,
          maxHealth: Number(rawPlayer.maxHealth) || 0,
          currentMana: Number(rawPlayer.currentMana) || 0,
          maxMana: Number(rawPlayer.maxMana) || 0
        },
        recoveryItems,
        settings: {
          autoHpRecoveryPercent: Number(rawSettings.autoHpRecoveryPercent) || 50,
          autoMpRecoveryPercent: Number(rawSettings.autoMpRecoveryPercent) || 50
        }
      })
    } catch (error) {
      isRecovering = false
      console.error('[自动恢复] 发送 Worker 消息失败:', error)
    }
  }

  /**
   * 检查并出售物品
   * 使用AutoRecoveryService实现出售逻辑判断
   */
  const checkAndSellItems = () => {
    if (isAutoSelling.value) {
      pendingAutoSellRescan = true
      return
    }

    isAutoSelling.value = true

    const finalize = () => {
      isAutoSelling.value = false
      if (pendingAutoSellRescan) {
        pendingAutoSellRescan = false
        scheduleAutoSellCheck()
      }
    }

    try {
      if (!gameInitializer.value) {
        finalize()
        return
      }

      if (!player.value) {
        finalize()
        return
      }

      // 检查是否有自动出售BUFF
      if (!autoRecoveryService.hasAutoSellBuff(player.value)) {
        finalize()
        return
      }

      const playerData = player.value
      const settings = userSettings.value || {}

      const staticItemsCount = getStaticItemsCount()
      if (staticItemsCount === 0) {
        finalize()
        return
      }

      if (!Array.isArray(itemsStore.playerBag)) {
        itemsStore.playerBag = Array.isArray(playerData.bag) ? [...playerData.bag] : []
      }

      const bag = itemsStore.playerBag
      const bagSnapshot = Array.isArray(bag) ? bag.slice() : []
      const itemsToRemove = []
      let scanIndex = bagSnapshot.length - 1

      const getNow = () => {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
          return performance.now()
        }
        return Date.now()
      }

      /**
       * 扫描步骤（时间分片）
       */
      const scanStep = () => {
        try {
          if (!Array.isArray(itemsStore.playerBag)) {
            finalize()
            return
          }

          const startedAt = getNow()
          let processedThisChunk = 0

          while (scanIndex >= 0) {
            const item = bagSnapshot[scanIndex]
            scanIndex -= 1
            processedThisChunk += 1

            if (!item || !item.id) {
              if (processedThisChunk >= AUTO_SELL_SCAN_MAX_ITEMS_PER_CHUNK) break
              if (getNow() - startedAt >= AUTO_SELL_SCAN_BUDGET_MS) break
              continue
            }

            const itemInfo = itemsStore.getItemConfig(item.id)
            if (!itemInfo) {
              if (processedThisChunk >= AUTO_SELL_SCAN_MAX_ITEMS_PER_CHUNK) break
              if (getNow() - startedAt >= AUTO_SELL_SCAN_BUDGET_MS) break
              continue
            }

            // 使用统一服务判断是否应该出售
            if (autoRecoveryService.shouldAutoSellItem(item, itemInfo, settings)) {
              itemsToRemove.push({ item, itemInfo })
            }

            if (processedThisChunk >= AUTO_SELL_SCAN_MAX_ITEMS_PER_CHUNK) break
            if (getNow() - startedAt >= AUTO_SELL_SCAN_BUDGET_MS) break
          }

          // 如果还有物品需要扫描，继续下一批
          if (scanIndex >= 0) {
            setTimeout(scanStep, 0)
            return
          }

          // 执行出售
          if (!Array.isArray(itemsStore.playerBag)) {
            finalize()
            return
          }

          const liveBag = itemsStore.playerBag
          let anyRemoved = false
          const removeSet = new Set(itemsToRemove.map(i => i.item))

          if (removeSet.size > 0) {
            const nextBag = []

            for (let i = 0; i < liveBag.length; i += 1) {
              const item = liveBag[i]

              if (!removeSet.has(item)) {
                nextBag.push(item)
                continue
              }

              const { itemInfo } = itemsToRemove.find(i => i.item === item) || {}

              if (!itemInfo) {
                anyRemoved = true
                continue
              }

              const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
              const enhanceLevel = Number(item?.enhanceLevel ?? item?.StrengthenedAttributes?.enhanceLevel ?? 0)
              const enhanceBonus = getEnhanceSellPriceBonus(enhanceLevel)
              const currentStack = item.currentStack !== undefined ? item.currentStack : item.stack
              const totalSellAmount = (sellPrice + enhanceBonus) * currentStack

              playerData.gold += totalSellAmount

              const itemName = itemInfo.name?.cns || itemInfo.name || `物品ID: ${item.id}`

              // 如果物品有强化等级，在名称后追加+强化等级
              const displayName = enhanceLevel > 0 ? `${itemName}+${enhanceLevel}` : itemName

              // 使用回调或直接输出日志
              if (typeof onAutoSellItem === 'function') {
                onAutoSellItem(displayName, currentStack, totalSellAmount)
              } else if (typeof addBattleLog === 'function') {
                addBattleLog(`自动出售 ${displayName} x${currentStack}，获得金币 ${totalSellAmount}`, 'sell')
              }

              anyRemoved = true
            }

            itemsStore.playerBag = nextBag
          }

          // 更新状态
          if (anyRemoved) {
            playerData.bag = Array.isArray(itemsStore.playerBag) ? [...itemsStore.playerBag] : []
            itemsStore.playerGold = playerData.gold

            try {
              const goldUpdateEvent = new CustomEvent('gold-update', {
                detail: { gold: playerData.gold }
              })
              window.dispatchEvent(goldUpdateEvent)

              const updateBagEvent = new CustomEvent('update-bag-ui')
              window.dispatchEvent(updateBagEvent)
            } catch (error) {
              console.error('[自动出售] 刷新背包UI失败:', error)
            }

            updatePlayerAttributes()

            if (
              gameInitializer.value &&
              gameInitializer.value.services &&
              gameInitializer.value.services.storage
            ) {
              gameInitializer.value.services.storage.savePlayerData(playerData)
            }
          }

          finalize()
        } catch (error) {
          console.error('[自动出售] 执行失败:', error)
          if (typeof addBattleLog === 'function') {
            addBattleLog('自动出售执行失败，请稍后重试', 'error')
          }
          finalize()
        }
      }

      setTimeout(scanStep, 0)
    } catch (error) {
      console.error('[自动出售] 执行失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('自动出售执行失败，请稍后重试', 'error')
      }
      finalize()
    }
  }

  /**
   * 启动自动出售和恢复定时器
   */
  const startAutoSellAndRecovery = () => {
    if (autoSellTimer.value) {
      clearTimeout(autoSellTimer.value)
    }
    if (autoRecoveryTimer.value) {
      clearTimeout(autoRecoveryTimer.value)
    }

    const settings = userSettings.value || {}
    const autoSellInterval = settings.autoSellInterval || 5
    const autoRecoveryInterval = settings.autoRecoveryInterval || 5

    const autoSellIntervalMs = autoSellInterval * 1000
    const autoRecoveryIntervalMs = autoRecoveryInterval * 1000

    autoSellEnabled = true
    autoRecoveryEnabled = true

    const scheduleAutoSell = () => {
      if (!autoSellEnabled) return

      autoSellTimer.value = setTimeout(() => {
        if (!autoSellEnabled) return
        if (serviceReady.value) {
          checkAndSellItems()
        }
        scheduleAutoSell()
      }, autoSellIntervalMs)
    }

    const scheduleAutoRecovery = () => {
      if (!autoRecoveryEnabled) return

      autoRecoveryTimer.value = setTimeout(() => {
        if (!autoRecoveryEnabled) return
        if (serviceReady.value) {
          autoRecoverHealthAndMana()
        }
        scheduleAutoRecovery()
      }, autoRecoveryIntervalMs)
    }

    scheduleAutoSell()
    scheduleAutoRecovery()
  }

  /**
   * 启动自动出售和恢复（带服务就绪检查）
   */
  const startAutoSellAndRecoveryWithCheck = () => {
    const checkServiceReady = () => {
      const staticItemsCount = getStaticItemsCount()
      if (staticItemsCount > 0) {
        serviceReady.value = true
        serviceWarningShown.value = false
        startAutoSellAndRecovery()

        if (!stopBagWatch.value) {
          stopBagWatch.value = watch(
            () => itemsStore.playerBag,
            () => {
              scheduleAutoSellCheck()
            },
            { deep: false }
          )
        }
        return true
      }

      if (!serviceWarningShown.value) {
        serviceWarningShown.value = true
        debugLog('等待服务就绪：物品数据尚未加载', {
          staticItemsType: typeof itemsStore.staticItems,
          staticItemsCount
        })
      }
      return false
    }

    if (!checkServiceReady()) {
      setTimeout(() => {
        startAutoSellAndRecoveryWithCheck()
      }, 1000)
    }
  }

  /**
   * 停止自动出售和恢复
   */
  const stopAutoSellAndRecovery = () => {
    autoSellEnabled = false
    autoRecoveryEnabled = false

    if (autoSellTimer.value) {
      clearTimeout(autoSellTimer.value)
      autoSellTimer.value = null
          }

    if (autoRecoveryTimer.value) {
      clearTimeout(autoRecoveryTimer.value)
      autoRecoveryTimer.value = null
          }

    if (bagChangeAutoSellTimer.value) {
      clearTimeout(bagChangeAutoSellTimer.value)
      bagChangeAutoSellTimer.value = null
    }

    if (stopBagWatch.value) {
      stopBagWatch.value()
      stopBagWatch.value = null
    }
  }

  /**
   * 重启自动出售和恢复
   */
  const restartAutoSellAndRecovery = () => {
    stopAutoSellAndRecovery()
    startAutoSellAndRecoveryWithCheck()
  }

  // 组件卸载时清理
  onUnmounted(() => {
    stopAutoSellAndRecovery()
    // 终止恢复 Worker 释放资源
    if (autoRecoveryWorker) {
      autoRecoveryWorker.terminate()
      autoRecoveryWorker = null
    }
    isRecovering = false
  })

  return {
    startAutoSellAndRecovery,
    startAutoSellAndRecoveryWithCheck,
    stopAutoSellAndRecovery,
    restartAutoSellAndRecovery,
    autoRecoverHealthAndMana,
    checkAndSellItems
  }
}

// 导出服务类和常量，供其他模块使用
export { AutoRecoveryService, getAutoRecoveryService, AUTO_RECOVERY_BUFF_ID, AUTO_SELL_BUFF_ID }
