import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { storageService } from '@/services/StorageService'
import { setBuffDuration, clearBuffDuration, getBuffDuration } from '@/composables/useGameLoopManager'

// 动态回调存储（用于特殊物品处理）
const specialCallbacks = {
  openRenamePanel: null,
  openElementChangePanel: null,
  onStatReset: null,
  onStoneSelect: null,
  onGenderSelect: null,
  onResetWeaponAttribute: null,
  onResetUltimateWeaponBonus: null,
  onWeaponAwakening: null,
  onBlessingAwakening: null,
  // 队友BUFF变化后的回调（用于通知Dungeon.vue重新计算属性）
  onTeammateBuffChanged: null,
  // 队友数据保存回调（用于保存队友数据到对应存档槽）
  onTeammateDataSave: null
}

/**
 * 注册特殊物品回调函数
 * @param {Object} callbacks - 回调函数对象
 * @param {Function} [callbacks.openRenamePanel] - 打开改名面板的回调
 * @param {Function} [callbacks.openElementChangePanel] - 打开属性更改面板的回调
 * @param {Function} [callbacks.onStatReset] - 属性点重置的回调
 * @param {Function} [callbacks.onStoneSelect] - 打开石头选择面板的回调
 * @param {Function} [callbacks.onGenderSelect] - 打开性别选择面板的回调（用于selectbox类型套装礼盒）
 * @param {Function} [callbacks.onResetWeaponAttribute] - 打开重置武器属性面板的回调
 * @param {Function} [callbacks.onResetUltimateWeaponBonus] - 打开重置终极武器新增特殊属性面板的回调
 * @param {Function} [callbacks.onWeaponAwakening] - 打开武器唤醒面板的回调
 * @param {Function} [callbacks.onBlessingAwakening] - 打开祝福唤醒面板的回调
 * @param {Function} [callbacks.onTeammateBuffChanged] - 队友BUFF变化后的回调（用于通知重新计算属性和刷新UI）
 * @param {Function} [callbacks.onTeammateDataSave] - 队友数据保存回调（用于保存队友数据到对应存档槽）
 */
export function registerSpecialItemCallbacks (callbacks) {
 
  if (callbacks.openRenamePanel) specialCallbacks.openRenamePanel = callbacks.openRenamePanel
  if (callbacks.openElementChangePanel) specialCallbacks.openElementChangePanel = callbacks.openElementChangePanel
  if (callbacks.onStatReset) specialCallbacks.onStatReset = callbacks.onStatReset
  if (callbacks.onStoneSelect) specialCallbacks.onStoneSelect = callbacks.onStoneSelect
  if (callbacks.onGenderSelect) specialCallbacks.onGenderSelect = callbacks.onGenderSelect
  if (callbacks.onResetWeaponAttribute) specialCallbacks.onResetWeaponAttribute = callbacks.onResetWeaponAttribute
  if (callbacks.onResetUltimateWeaponBonus) specialCallbacks.onResetUltimateWeaponBonus = callbacks.onResetUltimateWeaponBonus
  if (callbacks.onWeaponAwakening) specialCallbacks.onWeaponAwakening = callbacks.onWeaponAwakening
  if (callbacks.onBlessingAwakening) specialCallbacks.onBlessingAwakening = callbacks.onBlessingAwakening
  if (callbacks.onTeammateBuffChanged) specialCallbacks.onTeammateBuffChanged = callbacks.onTeammateBuffChanged
  if (callbacks.onTeammateDataSave) specialCallbacks.onTeammateDataSave = callbacks.onTeammateDataSave
}

/**
 * 物品使用管理组合式API（重构版）
 * 现在通过 itemsStore 统一管理物品使用逻辑
 */
export function useItemManager (
  player,
  gameData,
  gameInitializer,
  removeItemFromBag,
  showDamageNumber,
  addBattleLog,
  showAnimationMessage = null,
  _openRenamePanel = null,
  _openElementChangePanel = null,
  _onStatReset = null
) {
  // 如果传入了回调参数，也注册到全局存储中
  if (_openRenamePanel) specialCallbacks.openRenamePanel = _openRenamePanel
  if (_openElementChangePanel) specialCallbacks.openElementChangePanel = _openElementChangePanel
  if (_onStatReset) specialCallbacks.onStatReset = _onStatReset

  const itemsStore = useItemsStore()

  const getDisplayName = item => {
    if (!item) {
      return '未知物品'
    }

    // 优先从 itemsStore 获取物品配置（优化：避免重复Object.values和线性查找）
    const itemConfig = itemsStore.getItemConfig(item.id)
    if (itemConfig && itemConfig.name) {
      if (typeof itemConfig.name === 'object') {
        return (
          itemConfig.name.cns || itemConfig.name.eng || itemConfig.name.en || `物品ID: ${item.id}`
        )
      }
      return itemConfig.name
    }
 
 

    if (item.name) {
      if (typeof item.name === 'object') {
        return item.name.cns || item.name.eng || item.name.en || `物品ID: ${item.id}`
      }
      return item.name
    }

    return `物品ID: ${item.id}`
  }

  const showMessage = (message, type = 'info') => {
    if (addBattleLog && typeof addBattleLog === 'function') {
      addBattleLog(message, type)
    }
  }

  /**
   * 判断当前操作的目标角色是否为队长（主玩家）
   * 用途/业务意图：在副本中，gameStore.player 通过 setPlayer 创建了新对象，
   * 引用不同于 player.value，且队长有 slotId，导致旧的引用判断和 slotId 判断均失效。
   * 增加 _isPlayer 标记判断，确保队长在副本中也能被正确识别。
   * @param {object} gameStore - 游戏全局 Store
   * @param {object} playerData - 当前操作的玩家数据
   * @returns {boolean} 是否为队长（主玩家）
   */
  const checkIsMainPlayer = (gameStore, playerData) => {
    if (!playerData || !gameStore?.player) return true
    // 引用相同（非副本场景）
    if (gameStore.player === playerData) return true
    // _isPlayer 标记判断（副本场景：player.value._isPlayer = true）
    if (playerData._isPlayer === true) return true
    // slotId 均为 undefined（旧逻辑兼容）
    if (gameStore.player.slotId === undefined && playerData.slotId === undefined) return true
    return false
  }

  const useItem = (item, emit, callbacks = {}, quantity = 1) => {


    if (!item || !item.id) {
      console.error('[useItemManager] 使用物品失败：没有选中的物品')
      return
    }

    const normalizedQuantity = Math.max(1, Number(quantity) || 1)

    let playerData = null
    // 从传入的 player 参数获取目标角色数据（副本中可能是队友，也可能是队长）
    // 业务意图：副本页面中 gameStore.player 始终为队长实例，与传入的 player 参数（可能为队友）不是同一对象，
    // 如果使用 gameStore.player 会导致队员的 BUFF 被错误地添加到队长身上
    const gameStoreForPlayer = useGameStore()
    const propsPlayerData = player
      ? (player.value && typeof player.value === 'object' ? player.value : player)
      : null

    if (propsPlayerData) {
      // 判断传入的 player 是否为主玩家（队长）
      const isMainPlayer = checkIsMainPlayer(gameStoreForPlayer, propsPlayerData)
      if (isMainPlayer && gameStoreForPlayer?.player) {
        // 主玩家：将 gameStore.player 的最新数据同步到 props.player
        // 业务意图：gameStore.player 可能被 updatePlayerAttributes 替换为新对象，
        // 而 props.player 仍指向旧对象，需要同步最新数据避免丢失游戏循环中的更新
        const storePlayer = gameStoreForPlayer.player
        if (Array.isArray(storePlayer.activeBuffs)) {
          propsPlayerData.activeBuffs = storePlayer.activeBuffs
        }
        if (storePlayer.currentHealth !== undefined) {
          propsPlayerData.currentHealth = storePlayer.currentHealth
        }
        if (storePlayer.currentMana !== undefined) {
          propsPlayerData.currentMana = storePlayer.currentMana
        }
        if (storePlayer.maxHealth !== undefined) {
          propsPlayerData.maxHealth = storePlayer.maxHealth
        }
        if (storePlayer.maxMana !== undefined) {
          propsPlayerData.maxMana = storePlayer.maxMana
        }
      }
      // 使用 props.player 作为 playerData（确保 BUFF 添加到正确的目标对象上，UI 能正确响应）
      playerData = propsPlayerData
    } else if (gameStoreForPlayer && gameStoreForPlayer.player) {
      // 没有传入 player 参数，回退到 gameStore.player
      playerData = gameStoreForPlayer.player
    }
    if (!playerData) {
      // storageService 已通过 import 导入全局单例
      playerData = storageService.loadPlayerData()
    }

    if (!playerData) {
      console.error('[useItemManager] 使用物品失败：无法获取玩家数据')
      return
    }

    const itemConfig = itemsStore.getItemConfig(item.id)
 
    
    if (!itemConfig) {
      console.error('[useItemManager] 使用物品失败：无法获取物品信息')
      return
    }

  

    const useCallbacks = {
      maxHealth: playerData.maxHealth,
      maxMana: playerData.maxMana,
      onRestore: (parameter, value, itemId) => {
        // 获取物品图标
        const itemIcon = itemId ? `/pt/item_icon/${itemId}.png` : null
        const gameStore = useGameStore()

        // 判断当前操作的是否为队长（主玩家）
        const isMainPlayer = checkIsMainPlayer(gameStore, playerData)

        if (parameter === 'hp') {
          const oldHealth = playerData.currentHealth
          playerData.currentHealth = Math.min(
            playerData.maxHealth,
            playerData.currentHealth + value
          )
          const actualRecovery = playerData.currentHealth - oldHealth

          // 只有主玩家才更新 gameStore
          if (isMainPlayer) {
            gameStore.updatePlayer({ currentHealth: playerData.currentHealth })
          }

          if (showDamageNumber && typeof showDamageNumber === 'function') {
            showDamageNumber(-1, actualRecovery, false, true, null, false, null, null, false, null, null, itemIcon)
          }
        } else if (parameter === 'mp') {
          const oldMana = playerData.currentMana
          playerData.currentMana = Math.min(playerData.maxMana, playerData.currentMana + value)
          const actualRecovery = playerData.currentMana - oldMana

          // 只有主玩家才更新 gameStore
          if (isMainPlayer) {
            gameStore.updatePlayer({ currentMana: playerData.currentMana })
          }

          if (showDamageNumber && typeof showDamageNumber === 'function') {
            showDamageNumber(-1, actualRecovery, false, true, null, false, null, null, true, null, null, itemIcon)
          }
        }
      },
      onAddBuff: buff => {
        const gameStore = useGameStore()
        if (!playerData.activeBuffs) {
          playerData.activeBuffs = []
        }
        const now = Date.now()
        const existingBuffIndex = playerData.activeBuffs.findIndex(
          activeBuff => activeBuff && Number(activeBuff.id) === Number(buff.id)
        )
        const existingBuff = existingBuffIndex !== -1 ? playerData.activeBuffs[existingBuffIndex] : null

        // 检查已存在的 BUFF 是否已过期（expiresAt 已过期但尚未被 useGameLoopManager 移除）
        const isExistingExpired = existingBuff && Number(existingBuff.expiresAt ?? 0) > 0 && Number(existingBuff.expiresAt) <= now

        if (existingBuff && !isExistingExpired) {
          // BUFF 未过期，累加持续时间并延长 expiresAt
          // 修复：使用剩余时间（从 buffDurations Map 或 expiresAt 计算）而非原始 duration
          // existingBuff.duration 是创建时的原始值，游戏循环不会更新它，只有 buffDurations Map 会递减
          const remainingDuration = getBuffDuration(buff.id) ||
            Math.max(0, Math.ceil((Number(existingBuff.expiresAt ?? 0) - now) / 1000))
          const additionalDuration = buff.duration || 0
          const newDuration = remainingDuration + additionalDuration
          existingBuff.duration = newDuration
          // 同步更新 expiresAt：当前时间 + 新的总持续时间
          existingBuff.expiresAt = now + newDuration * 1000
          // 同步更新 buffDurations Map，确保显示正确的剩余时间
          setBuffDuration(buff.id, newDuration)
        } else {
          // 创建新 BUFF（无已存在的 BUFF，或已存在的 BUFF 已过期需替换）
          if (existingBuff && isExistingExpired) {
            // 移除已过期的旧 BUFF，避免被 useGameLoopManager 重复处理
            playerData.activeBuffs.splice(existingBuffIndex, 1)
            clearBuffDuration(buff.id)
          }
          // 创建新数组引用以确保 Vue 响应式更新
          playerData.activeBuffs = [...playerData.activeBuffs, buff]
          // 同步更新 buffDurations Map，确保显示正确的剩余时间
          setBuffDuration(buff.id, buff.duration)
        }
        // 判断当前操作的是否为队长（主玩家）
        const isMainPlayer = checkIsMainPlayer(gameStore, playerData)
        if (isMainPlayer) {
          // 使用 gameStore.updatePlayer 确保 Vue 响应式系统正确追踪变化
          gameStore.updatePlayer({ activeBuffs: [...playerData.activeBuffs] })
        } else {
          // 队友的BUFF发生变化，调用回调通知Dungeon.vue重新计算属性和刷新UI
          if (specialCallbacks.onTeammateBuffChanged && typeof specialCallbacks.onTeammateBuffChanged === 'function') {
            specialCallbacks.onTeammateBuffChanged(playerData)
          }
        }
      },
      onUpdateBuff: buff => {
        // 更新现有BUFF（用于特殊物品如ES经验卷轴）
        const gameStore = useGameStore()
        if (!playerData.activeBuffs) {
          playerData.activeBuffs = []
        }
        const existingBuffIndex = playerData.activeBuffs.findIndex(
          activeBuff => activeBuff && Number(activeBuff.id) === Number(buff.id)
        )
        if (existingBuffIndex !== -1) {
          // 直接替换整个BUFF对象，不累加持续时间
          playerData.activeBuffs[existingBuffIndex] = buff
          // 同步更新 buffDurations Map
          setBuffDuration(buff.id, buff.duration)
          // 判断当前操作的是否为队长（主玩家）
          const isMainPlayer = checkIsMainPlayer(gameStore, playerData)
          if (isMainPlayer) {
            // 使用 gameStore.updatePlayer 确保 Vue 响应式系统正确追踪变化
            gameStore.updatePlayer({ activeBuffs: [...playerData.activeBuffs] })
          } else {
            // 队友的BUFF发生变化，调用回调通知Dungeon.vue重新计算属性和刷新UI
            if (specialCallbacks.onTeammateBuffChanged && typeof specialCallbacks.onTeammateBuffChanged === 'function') {
              specialCallbacks.onTeammateBuffChanged(playerData)
            }
          }
        }
      },
      onRename: (item, itemConfig) => {
       
        if (specialCallbacks.openRenamePanel && typeof specialCallbacks.openRenamePanel === 'function') {
          specialCallbacks.openRenamePanel(item, itemConfig)
        }
      },
      onElementChange: (item, itemConfig) => {
      
        if (specialCallbacks.openElementChangePanel && typeof specialCallbacks.openElementChangePanel === 'function') {
          
          specialCallbacks.openElementChangePanel(item, itemConfig)
         
        }
      },
      onStatReset: (item, itemConfig) => {
       
        if (specialCallbacks.onStatReset && typeof specialCallbacks.onStatReset === 'function') {
          
          specialCallbacks.onStatReset(item, itemConfig)
           
        }
      },
      onStoneSelect: (item, itemConfig) => {
        
        if (specialCallbacks.onStoneSelect && typeof specialCallbacks.onStoneSelect === 'function') {
          
          specialCallbacks.onStoneSelect(item, itemConfig)
          
        }
      },
      onGenderSelect: (item, itemConfig, contents) => {
        if (specialCallbacks.onGenderSelect && typeof specialCallbacks.onGenderSelect === 'function') {
          specialCallbacks.onGenderSelect(item, itemConfig, contents)
        }
      },
      onResetWeaponAttribute: (item, itemConfig) => {
        if (specialCallbacks.onResetWeaponAttribute && typeof specialCallbacks.onResetWeaponAttribute === 'function') {
          specialCallbacks.onResetWeaponAttribute(item, itemConfig)
        }
      },
      onResetUltimateWeaponBonus: (item, itemConfig) => {
        if (specialCallbacks.onResetUltimateWeaponBonus && typeof specialCallbacks.onResetUltimateWeaponBonus === 'function') {
          specialCallbacks.onResetUltimateWeaponBonus(item, itemConfig)
        }
      },
      onWeaponAwakening: (item, itemConfig) => {
        if (specialCallbacks.onWeaponAwakening && typeof specialCallbacks.onWeaponAwakening === 'function') {
          specialCallbacks.onWeaponAwakening(item, itemConfig)
        }
      },
      onBlessingAwakening: (item, itemConfig) => {
        if (specialCallbacks.onBlessingAwakening && typeof specialCallbacks.onBlessingAwakening === 'function') {
          specialCallbacks.onBlessingAwakening(item, itemConfig)
        }
      },
      /**
       * 获取当前玩家的activeBuffs
       * 用于特殊物品（如ES经验卷轴829）判断BUFF叠加情况
       * @returns {Array} 当前玩家的BUFF列表
       */
      getActiveBuffs: () => {
        return playerData?.activeBuffs || []
      }
    }

    // 使用 itemsStore 的 useItem 方法
     
    const result = itemsStore.useItem(item.id, useCallbacks, normalizedQuantity)
   

    if (result.success) {
      const itemName = getDisplayName(item)
      const effectType = result.effect?.type
      

      // 特殊物品类型（改名、属性更改、属性点重置、重置武器属性、重置终极武器新增属性、武器唤醒）由回调自行处理，不执行通用成功逻辑
      if (effectType === 'rename' || effectType === 'elementChange' || effectType === 'statReset' || effectType === 'resetWeaponAttribute' || effectType === 'resetUltimateWeaponBonus' || effectType === 'weaponAwakening') {
        
        // 这些物品的回调已经处理了面板打开或操作，直接返回
        // 注意：这些物品不应该在这里移除，而是在回调确认后移除
        if (callbacks.closePanel && typeof callbacks.closePanel === 'function') {
          callbacks.closePanel()
        }
        return
      }

      if (result.effect && (result.effect.type === 'hp' || result.effect.type === 'mp')) {
        const actualRecovery = result.effect.value
        if (actualRecovery > 0) {
          showMessage(
            `${itemName} 恢复 ${actualRecovery} ${result.effect.type.toUpperCase()}`,
            'use'
          )
          
          // 显示动画消息
          if (showAnimationMessage && typeof showAnimationMessage === 'function') {
            const iconPath = `/pt/item_icon/${item.id}.png`
            showAnimationMessage(`使用 ${itemName}`, 'use', iconPath)
          }
        } else {
          showMessage(`${itemName} 已使用，但已满，无需恢复`, 'info')
        }
      } else {
        showMessage(result.message, 'use')
        
        // 显示动画消息
        if (showAnimationMessage && typeof showAnimationMessage === 'function') {
          const iconPath = `/pt/item_icon/${item.id}.png`
          showAnimationMessage(`使用 ${itemName}`, 'use', iconPath)
        }
      }

      if (
        gameInitializer &&
        gameInitializer.value &&
        gameInitializer.value.services &&
        gameInitializer.value.services.audio
      ) {
        const audioService = gameInitializer.value.services.audio
        const effectType = result.effect?.type
        const isRaisedPetEnergy =
          effectType === 'raisedpet_energy' || itemConfig.subcategory === 'petfeed'
        let itemType = 'potion'
        if (effectType === 'hp' || effectType === 'mp') {
          itemType = effectType
        } else if (isRaisedPetEnergy) {
          itemType = 'hp'
        } else if (itemConfig.category === 'recovery') {
          itemType = 'potion'
        } else if (
          itemConfig.category === 'buff' ||
          itemConfig.category === 'scroll' ||
          itemConfig.subcategory === 'scroll' ||
          effectType === 'elementAttack'
        ) {
          // BUFF 类物品随机播放三种音效之一
          const buffSounds = [
            'ItemChrCure.wav',
            'ItemChrExchage.wav',
            'ItemChrExpasion.wav'
          ]
          const randomSound = buffSounds[Math.floor(Math.random() * buffSounds.length)]
          if (typeof audioService.playSFX === 'function') {
            audioService.playSFX(randomSound)
          }
          // 跳过后续的 playItemUseSFX 调用
          itemType = null
        } else if (itemConfig.category === 'food' || itemConfig.subcategory === 'food') {
          itemType = 'food'
        }
        if (itemType && typeof audioService.playItemUseSFX === 'function') {
          audioService.playItemUseSFX(itemType)
        } else if (itemType && typeof audioService.playSFX === 'function') {
          audioService.playSFX('ItemGnPotion.wav')
        }
      }

      // 保存玩家数据
      try {
        const gameStore = useGameStore()
        // 判断是否为队友：使用 checkIsMainPlayer 反向判断
        // 注意：副本中队长也有 slotId，不能仅凭 slotId 判断
        const isTeammate = !checkIsMainPlayer(gameStore, playerData)
        
        if (isTeammate) {
          // 队友数据通过回调保存到对应的存档槽
          // 同步 itemsStore.playerBag 到队友数据的 bag 字段
          // 业务意图：道具使用后背包变化在 itemsStore.playerBag 中（prepareMemberDataForModal 已将队员背包加载到 store），
          // 需要同步到队员数据对象以便正确保存
          playerData.bag = [...itemsStore.playerBag]
          if (specialCallbacks.onTeammateDataSave && typeof specialCallbacks.onTeammateDataSave === 'function') {
            specialCallbacks.onTeammateDataSave(playerData)
          }
        } else {
          // 主玩家数据保存：使用补丁保存避免触发后端存档覆盖保护
          // storageService 已通过 import 导入全局单例
          const payload =
            player && player.value && typeof player.value === 'object' ? player.value : playerData
          if (payload && typeof payload === 'object') {
            payload.bag = [...itemsStore.playerBag]
            payload.equipment = itemsStore.equipment ? { ...itemsStore.equipment } : payload.equipment
            // 使用 savePlayerPatch 而非 savePlayerData，只保存变更字段
            // 避免发送完整的 level/gold 等数据触发后端"存档覆盖保护"误拦截
            storageService.savePlayerPatch({
              bag: [...itemsStore.playerBag],
              equipment: itemsStore.equipment ? { ...itemsStore.equipment } : payload.equipment,
              activeBuffs: payload.activeBuffs || [],
              currentHealth: payload.currentHealth,
              currentMana: payload.currentMana
            })
          }
        }
      } catch (error) {
        console.error('[useItemManager] 保存玩家数据失败:', error)
      }

      // 更新 UI
      if (callbacks.loadBagItems && typeof callbacks.loadBagItems === 'function') {
        callbacks.loadBagItems()
      }
      if (callbacks.updatePlayerUI && typeof callbacks.updatePlayerUI === 'function') {
        callbacks.updatePlayerUI()
      }

      if (emit && typeof emit === 'function') {
        // BUFF 类物品需要重新计算属性
        const isBuffItem = itemConfig.category === 'buff'
        emit('player-data-updated', {
          source: 'store',
          skipAttributesUpdate: !isBuffItem,
          skipPlayerReload: true
        })
      }

      if (callbacks.closePanel && typeof callbacks.closePanel === 'function') {
        callbacks.closePanel()
      }
    } else {
      const message = result.message || '无法使用该物品'
      showMessage(message, 'error')

      if (showAnimationMessage && typeof showAnimationMessage === 'function') {
        const iconPath = item?.id ? `/pt/item_icon/${item.id}.png` : ''
        showAnimationMessage(message, 'error', iconPath)
      }
    }
  }

  const useRecoveryItem = item => {
    if (!item || !item.id) {
      return
    }

    if (!player.value) {
      console.error('[useItemManager] 玩家数据不可用')
      return
    }

    const itemConfig = itemsStore.getItemConfig(item.id)
    if (!itemConfig) {
      console.error('[useItemManager] 无法获取物品信息')
      return
    }

    // 获取物品图标路径
    const itemIcon = item?.id ? `/pt/item_icon/${item.id}.png` : null

    const useCallbacks = {
      maxHealth: player.value.maxHealth,
      maxMana: player.value.maxMana,
      onRestore: (parameter, value, itemId) => {
        // 使用传入的 itemId 或当前 item.id
        const iconPath = itemId ? `/pt/item_icon/${itemId}.png` : itemIcon
        const gameStore = useGameStore()

        if (parameter === 'hp') {
          player.value.currentHealth = Math.min(
            player.value.maxHealth,
            player.value.currentHealth + value
          )
          // 强制触发 Vue 响应式更新
          gameStore.updatePlayer({ currentHealth: player.value.currentHealth })
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            showDamageNumber(-1, value, false, true, null, false, null, null, false, null, null, iconPath)
          }
        } else if (parameter === 'mp') {
          player.value.currentMana = Math.min(
            player.value.maxMana,
            player.value.currentMana + value
          )
          // 强制触发 Vue 响应式更新
          gameStore.updatePlayer({ currentMana: player.value.currentMana })
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            showDamageNumber(-1, value, false, true, null, false, null, null, true, null, null, iconPath)
          }
        }
      },
      onAddBuff: buff => {
        const gameStore = useGameStore()
        if (!player.value.activeBuffs) {
          player.value.activeBuffs = []
        }
        const existingBuff = player.value.activeBuffs.find(
          activeBuff => activeBuff && Number(activeBuff.id) === Number(buff.id)
        )
        if (existingBuff) {
          // 修复：使用剩余时间（从 buffDurations Map 或 expiresAt 计算）而非原始 duration
          const now = Date.now()
          const remainingDuration = getBuffDuration(buff.id) ||
            Math.max(0, Math.ceil((Number(existingBuff.expiresAt ?? 0) - now) / 1000))
          const additionalDuration = buff.duration || 0
          const newDuration = remainingDuration + additionalDuration
          existingBuff.duration = newDuration
          existingBuff.expiresAt = now + newDuration * 1000
          // 同步更新 buffDurations Map，确保显示正确的剩余时间
          setBuffDuration(buff.id, newDuration)
        } else {
          // 创建新数组引用以确保 Vue 响应式更新
          player.value.activeBuffs = [...player.value.activeBuffs, buff]
          // 同步更新 buffDurations Map，确保显示正确的剩余时间
          setBuffDuration(buff.id, buff.duration)
        }
        // 使用 gameStore.updatePlayer 确保 Vue 响应式系统正确追踪变化
        gameStore.updatePlayer({ activeBuffs: [...player.value.activeBuffs] })
      },
      onUpdateBuff: buff => {
        // 更新现有BUFF（用于特殊物品如ES经验卷轴）
        const gameStore = useGameStore()
        if (!player.value.activeBuffs) {
          player.value.activeBuffs = []
        }
        const existingBuffIndex = player.value.activeBuffs.findIndex(
          activeBuff => activeBuff && Number(activeBuff.id) === Number(buff.id)
        )
        if (existingBuffIndex !== -1) {
          // 直接替换整个BUFF对象，不累加持续时间
          player.value.activeBuffs[existingBuffIndex] = buff
          // 同步更新 buffDurations Map
          setBuffDuration(buff.id, buff.duration)
          // 使用 gameStore.updatePlayer 确保 Vue 响应式系统正确追踪变化
          gameStore.updatePlayer({ activeBuffs: [...player.value.activeBuffs] })
        }
      }
    }

    const result = itemsStore.useItem(item.id, useCallbacks, 1)

    if (result.success) {
      // const itemName = getDisplayName({ id: item.id, name: itemConfig.name })
      // const message =
      //   result.effect && result.effect.type
      //     ? `自动使用 ${itemName} x1 恢复 ${result.effect.value} ${result.effect.type.toUpperCase()}`
      //     : `自动使用 ${itemName} x1`

      // addBattleLog(message)

      if (gameInitializer.value && gameInitializer.value.services.audio) {
        const itemType = result.effect?.type === 'mp' ? 'mp' : 'hp'
        gameInitializer.value.services.audio.playItemUseSFX(itemType)
      }

      if (player.value && typeof player.value === 'object') {
        player.value.bag = [...itemsStore.playerBag]
      }
    }
  }

  const autoUseRecoveryItems = (hpThreshold = 0.3, mpThreshold = 0.3) => {
    if (!player.value) {
      return false
    }

    let used = false

    // 检查 HP 阈值
    if (player.value.currentHealth / player.value.maxHealth < hpThreshold) {
      const hpItems = player.value.bag.filter(item => {
        const itemConfig = itemsStore.getItemConfig(item.id)
        return (
          itemConfig &&
          itemConfig.category === 'recovery' &&
          itemConfig.abilities?.some(ability => ability.parameter === 'hp')
        )
      })

      if (hpItems.length > 0) {
        useRecoveryItem(hpItems[0])
        used = true
      }
    }

    // 检查 MP 阈值
    if (player.value.currentMana / player.value.maxMana < mpThreshold) {
      const mpItems = player.value.bag.filter(item => {
        const itemConfig = itemsStore.getItemConfig(item.id)
        return (
          itemConfig &&
          itemConfig.category === 'recovery' &&
          itemConfig.abilities?.some(ability => ability.parameter === 'mp')
        )
      })

      if (mpItems.length > 0) {
        useRecoveryItem(mpItems[0])
        used = true
      }
    }

    return used
  }

  const checkAndAutoUseRecoveryItems = () => {
    return autoUseRecoveryItems()
  }

  return {
    useItem,
    useRecoveryItem,
    autoUseRecoveryItems,
    checkAndAutoUseRecoveryItems
  }
}
