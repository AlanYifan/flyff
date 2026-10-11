import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { buildJobChangeQuestRewardText } from '@/utils/jobChangeQuestHelper'

/**
 * 事件处理组合式API
 * 将事件处理相关的逻辑从Main.vue中抽离出来
 */
export function useEventHandler (
  player,
  gameData,
  gameInitializer,
  addBattleLog,
  addItemToBag,
  removeItemFromBag,
  currentMap = null,
  storageService = null,
  gainExp = null,
  showAnimationMessage = null
) {
  // 获取 itemsStore
  const itemsStore = useItemsStore()

  const saveToLocalStorageDirectly = () => {
    try {
      const currentUser = localStorage.getItem('currentUser')
      if (!currentUser) {
        console.error('[useEventHandler] saveToLocalStorageDirectly: currentUser 为空')
        return false
      }

      const rawUserData = localStorage.getItem(currentUser)
      const userData = rawUserData ? JSON.parse(rawUserData) : {}

      const rawSlot = localStorage.getItem('currentSaveSlot')
      const currentSaveSlot = rawSlot ? JSON.parse(rawSlot) : null
      if (currentSaveSlot === null || currentSaveSlot === undefined) {
        console.error('[useEventHandler] saveToLocalStorageDirectly: currentSaveSlot 为空')
        return false
      }

      if (!userData.saveSlots || typeof userData.saveSlots !== 'object') {
        userData.saveSlots = {}
      }

      userData.saveSlots[currentSaveSlot] = JSON.parse(JSON.stringify(player.value))
      localStorage.setItem(currentUser, JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('[useEventHandler] saveToLocalStorageDirectly 失败:', error)
      return false
    }
  }
  // 处理购买物品
  const handleBuyItem = (item, quantity = 1) => {
  
    if (!item || !player.value) {
      console.error('购买物品失败：物品或玩家数据为空')
      return false
    }

    // 确定总价 - 检查是否是 {item: {...}, quantity: 1, ...} 结构
    const actualItem = item.item ? item.item : item
    const actualQuantity = item.quantity !== undefined ? item.quantity : quantity
    const totalPrice =
      item.totalPrice !== undefined ? item.totalPrice : (actualItem.price || 0) * actualQuantity

    // 检查玩家金币是否足够
    if (player.value.gold < totalPrice) {
      addBattleLog(`金币不足，需要 ${totalPrice} 金币，当前只有 ${player.value.gold} 金币`)
      return false
    }

    // 检查背包空间
    if (isBagFull()) {
      addBattleLog('背包已满，无法购买物品')
      return false
    }

    try {
      // 添加物品到背包 - 直接使用传入的quantity，而不是循环添加
      const itemId = typeof actualItem.id !== 'undefined' ? actualItem.id : actualItem.itemId
      if (itemId) {
        // 使用addItemToBag传递正确的数量，而不是循环添加
        addItemToBag(itemId, actualQuantity)
      } else {
        console.error('物品缺少ID，无法添加到背包:', actualItem)
      }

      player.value.bag = [...itemsStore.playerBag]

      // 扣除金币
      player.value.gold -= totalPrice
      itemsStore.playerGold = player.value.gold

      // 保存玩家数据以确保金币变化和物品添加被持久化
      savePlayerData()

      // 添加战斗日志
    
      addBattleLog(
        `购买 ${actualItem.name?.cns || actualItem.name || '物品'} x${actualQuantity}，花费 ${totalPrice} 金币`,
        'buy'
      )

      // 显示动画消息（为每个购买的物品显示一个动画消息）
      if (showAnimationMessage && typeof showAnimationMessage === 'function') {
        const itemName = actualItem.name?.cns || actualItem.name || '物品'
        const iconPath = `/pt/item_icon/${itemId}.png`
        
        // 根据购买数量显示多个动画消息
        const messageCount = Math.min(actualQuantity, 10) // 最多显示10个动画消息，避免过多
        for (let i = 0; i < messageCount; i++) {
          // 使用setTimeout让动画消息错开显示，避免重叠
          setTimeout(() => {
            showAnimationMessage(`购买 ${itemName}`, 'buy', iconPath)
          }, i * 100) // 每个消息间隔100ms
        }
      }

      if (gameInitializer.value && gameInitializer.value.services.audio) {
        const audioService = gameInitializer.value.services.audio
        if (typeof audioService.playTradeSFX === 'function') {
          audioService.playTradeSFX()
        } else {
          audioService.playSFX('InfTrade.wav')
        }
      }

      // 触发金币更新事件
      const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: player.value.gold } })
      window.dispatchEvent(goldUpdateEvent)

      // 触发背包UI更新事件
      const updateBagEvent = new CustomEvent('update-bag-ui')
      window.dispatchEvent(updateBagEvent)

      return true
    } catch (error) {
      console.error('购买物品失败:', error)
      addBattleLog('购买物品失败', 'error')
      return false
    }
  }

  // 处理食品购买
  const handleFoodPurchase = item => {
    return handleBuyItem(item)
  }

  // 处理魔法物品购买
  const handleMagicPurchase = item => {
    return handleBuyItem(item)
  }

  /**
   * 处理钻石购买成功（用金币兑换钻石）
   * @param {number} diamondsPurchased - 购买的钻石数量
   */
  const onPurchaseSuccess = diamondsPurchased => {
    if (player.value) {
      player.value.diamonds += diamondsPurchased
      addBattleLog(`成功购买 ${diamondsPurchased} 钻石`)

      // 保存玩家数据
      savePlayerData()

      if (gameInitializer.value && gameInitializer.value.services.audio) {
        const audioService = gameInitializer.value.services.audio
        if (typeof audioService.playTradeSFX === 'function') {
          audioService.playTradeSFX()
        } else {
          audioService.playSFX('InfTrade.wav')
        }
      }
    }
  }

  /**
   * 处理钻石商店购买物品成功
   * @param {Object} purchaseData - 购买数据 { item, quantity, totalPrice }
   */
  const onDiamondShopPurchase = purchaseData => {
    if (!purchaseData) {
      console.error('[useEventHandler] onDiamondShopPurchase: purchaseData 为空')
      return
    }

    const { item, quantity, totalPrice } = purchaseData
    if (item) {
      const itemName = item.name?.cns || item.name || '物品'
      addBattleLog(`成功购买 ${itemName} x${quantity}，花费 ${totalPrice} 钻石`, 'buy')
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        const audioService = gameInitializer.value.services.audio
        if (typeof audioService.playTradeSFX === 'function') {
          audioService.playTradeSFX()
        } else {
          audioService.playSFX('InfTrade.wav')
        }
      }
    } else {
      console.error('[useEventHandler] onDiamondShopPurchase: item 为空', purchaseData)
    }
  }

  // 处理钻石变化
  const onDiamondsChanged = newDiamonds => {
    if (player.value) {
      player.value.diamonds = newDiamonds
    }
  }

  // 处理显示消息
  const handleShowMessage = message => {
    addBattleLog(message)
  }

  // 处理强化成功
  const handleEnhanceSuccess = enhancedItem => {
    const payload = enhancedItem?.equipment ? enhancedItem : { equipment: enhancedItem }
    const equipment = payload?.equipment
    const playerName = player.value?.nickname || '玩家'
    const itemName = equipment?.name?.cns || equipment?.name || '物品'
    if (payload?.refineMode === 'attribute') {
      const elementKey = payload?.attributeElementKey
      const elementInfo = elementKey
        ? equipment?.elementalEnhancement?.[elementKey] ||
          equipment?.StrengthenedAttributes?.elementalEnhancement?.[elementKey]
        : null
      const elementLabel = elementInfo?.elementAttribute
      const levelRaw = Number(payload?.attributeLevel ?? elementInfo?.enhancementLevel ?? 0)
      const level = Number.isFinite(levelRaw) ? levelRaw : 0
      if (elementLabel && level > 0) {
        addBattleLog(`${playerName} 强化 ${itemName} ${elementLabel}元素+${level} 成功`)
      } else {
        addBattleLog(`${playerName} 强化 ${itemName} 成功`)
      }
    } else {
      const enhanceLevelRaw =
        equipment?.StrengthenedAttributes?.enhanceLevel ?? equipment?.enhanceLevel ?? 0
      const enhanceLevel = Number(enhanceLevelRaw)
      const levelText = Number.isFinite(enhanceLevel) && enhanceLevel > 0 ? `+${enhanceLevel}` : ''
      addBattleLog(`${playerName} ${itemName} ${levelText} 成功!`)
    }

    if (gameInitializer.value && gameInitializer.value.services.audio) {
      if (typeof gameInitializer.value.services.audio.playUpgradeSuccessSFX === 'function') {
        gameInitializer.value.services.audio.playUpgradeSuccessSFX()
      } else {
        gameInitializer.value.services.audio.playSFX('InfUpgradeSuccess.wav')
      }
    }
  }

  // 处理强化失败（不再输出战斗日志，仅播放音效）
  const handleEnhanceFailure = () => {
    if (gameInitializer.value && gameInitializer.value.services.audio) {
      if (typeof gameInitializer.value.services.audio.playUpgradeFailureSFX === 'function') {
        gameInitializer.value.services.audio.playUpgradeFailureSFX()
      } else {
        gameInitializer.value.services.audio.playSFX('InfUpgradeFail.wav')
      }
    }
  }

  // 处理地图变更
  const handleMapChange = newMap => {
    if (!newMap || !(newMap.name || newMap.mapName)) {
      console.error('地图数据无效')
      return
    }

    const mapName = newMap.name || newMap.mapName
    const mapLevelRange = newMap.levelRange || '1-20'
    const mapBackground = newMap.background || '/pt/map/pl.png'

    // 更新当前地图 - 使用 Object.assign 确保触发响应式更新
    if (currentMap && currentMap.value) {
      Object.assign(currentMap.value, {
        name: mapName,
        levelRange: mapLevelRange,
        background: mapBackground
      })
    }

    // 添加战斗日志
    addBattleLog(`切换到地图: ${mapName} (${mapLevelRange})`)

    // 播放地图切换音效
    if (gameInitializer.value && gameInitializer.value.services.audio) {
      gameInitializer.value.services.audio.playSFX('InfOpen.wav')
    }

    // 根据地图名称播放对应的背景音乐（与old版本保持一致）
    if (gameInitializer.value && gameInitializer.value.services.audio) {
      gameInitializer.value.services.audio.playMusic('map', mapName)
    }

    // 返回新的地图数据
    return { name: mapName, levelRange: mapLevelRange, background: mapBackground }
  }

  // 处理任务接受
  const handleQuestAccepted = quest => {
    if (!quest || !player.value) {
      console.error('接受任务失败：任务或玩家数据为空')
      return false
    }

    try {
      // 检查玩家等级是否满足任务要求
      if (player.value.level < quest.minLevel) {
        addBattleLog(`等级不足，需要等级 ${quest.minLevel} 才能接受此任务`)
        return false
      }

      // 检查任务是否已经在活动任务列表中
      const isAlreadyActive = player.value.quest?.activeQuests?.some(q => q.id === quest.id)
      if (isAlreadyActive) {
        addBattleLog(`任务 ${quest.name?.cns || quest.name?.en || quest.id} 已经在进行中`)
        return false
      }

      // 检查任务是否已经完成
      const isAlreadyCompleted = player.value.quest?.completedQuests?.some(q => q.id === quest.id)
      if (isAlreadyCompleted) {
        addBattleLog(`任务 ${quest.name?.cns || quest.name?.en || quest.id} 已经完成`)
        return false
      }

      // 添加任务到活跃任务列表
      if (!player.value.quest) {
        player.value.quest = { activeQuests: [], completedQuests: [] }
      }

      player.value.quest.activeQuests.push({
        ...quest,
        accepted: true,
        acceptedTime: Date.now()
      })

      // 添加战斗日志
      addBattleLog(`接受任务: ${quest.name?.cns || quest.name?.en || quest.id}`)

      // 播放任务接受音乐（深渊之塔管理员）
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        gameInitializer.value.services.audio.playMusicSFX('BgmEvStart.mp3')
      }

      // 保存玩家数据
      savePlayerData()

      return true
    } catch (error) {
      console.error('接受任务失败:', error)
      addBattleLog('接受任务失败')
      return false
    }
  }

  // 处理任务完成
  const handleQuestCompleted = quest => {
    if (!quest || !player.value) {
      console.error('完成任务失败：任务或玩家数据为空')
      return false
    }

    // ★ 转职任务走专用的完成逻辑
    if (quest.isJobChangeQuest && quest.targetJobKey !== undefined && quest.questIndex !== undefined) {
      try {
        const gameStore = useGameStore()
        gameStore.completeJobChangeQuest(quest.targetJobKey, quest.questIndex)

        const questName = quest.name?.cns || quest.name?.en || quest.id
        // ★ 构建转职任务奖励文本，在战斗日志文字和动画中同时显示奖励
        const rewardText = buildJobChangeQuestRewardText(quest.targetJobKey, quest.questIndex)
        addBattleLog(`[任务完成] ${questName}${rewardText}`, 'quest')
        if (typeof showAnimationMessage === 'function') {
          showAnimationMessage(`任务完成: ${questName}${rewardText}`, 'quest', '', '', '', '', '✅')
        }

        // 播放任务完成音效
        if (gameInitializer.value && gameInitializer.value.services.audio) {
          gameInitializer.value.services.audio.playSFX('quest_complete')
        }

        return true
      } catch (error) {
        console.error('完成转职任务失败:', error)
        addBattleLog('完成转职任务失败')
        return false
      }
    }

    try {
      // 检查任务是否在活动任务列表中
      const activeIndex = player.value.quest?.activeQuests?.findIndex(q => q.id === quest.id)
      if (activeIndex === -1) {
        addBattleLog(`任务 ${quest.name?.cns || quest.name?.en || quest.id} 不在进行中列表中`)
        return false
      }

      // 发放任务奖励
      grantQuestRewards(quest)

      // 从活跃任务列表中移除
      player.value.quest.activeQuests.splice(activeIndex, 1)

      // 添加到完成任务列表
      if (!player.value.quest.completedQuests) {
        player.value.quest.completedQuests = []
      }
      player.value.quest.completedQuests.push({
        ...quest,
        completed: true,
        completeTime: Date.now()
      })

      // 添加战斗日志
      addBattleLog(`完成任务: ${quest.name?.cns || quest.name?.en || quest.id}`)

      // 播放任务完成音效
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        gameInitializer.value.services.audio.playSFX('quest_complete')
      }

      // 保存玩家数据
      savePlayerData()

      return true
    } catch (error) {
      console.error('完成任务失败:', error)
      addBattleLog('完成任务失败')
      return false
    }
  }

  // 发放任务奖励
  const grantQuestRewards = quest => {
    if (!quest) {
      return
    }

    // 发放经验奖励
    if (quest.endReceiveExperience) {
      const expReward = Array.isArray(quest.endReceiveExperience)
        ? quest.endReceiveExperience[player.value.level - 1] || quest.endReceiveExperience[0] || 0
        : quest.endReceiveExperience

      // 使用 gainExp 函数，会检查15级转职限制
      if (gainExp && typeof gainExp === 'function') {
        gainExp(expReward, true) // true 表示是任务奖励
      } else {
        player.value.exp += expReward
        addBattleLog(`获得经验: ${expReward}`)
      }
    }

    // 发放金币奖励
    if (quest.endReceiveGold) {
      player.value.gold += quest.endReceiveGold
      addBattleLog(`获得金币: ${quest.endReceiveGold}`)
    }

    // 发放物品奖励
    if (quest.endReceiveItems && Array.isArray(quest.endReceiveItems)) {
      quest.endReceiveItems.forEach(itemReward => {
        if (itemReward.item && itemReward.count) {
          // 从 itemsStore 查找物品详细信息
          const itemInfo = itemsStore.getItemConfig(itemReward.item)
          if (itemInfo) {
            // 添加物品到背包
            for (let i = 0; i < itemReward.count; i++) {
              // 传递物品ID而不是整个物品对象
              // 检查是否是 {item: {...}, quantity: 1, ...} 结构
              const actualItem = itemInfo.item ? itemInfo.item : itemInfo
              const itemId =
                typeof actualItem.id !== 'undefined' ? actualItem.id : actualItem.itemId
              if (itemId) {
                addItemToBag(itemId, null, 1) // 数量为1，循环添加
              } else {
                console.error('任务奖励物品缺少ID，无法添加到背包:', actualItem)
              }
            }
            addBattleLog(`获得物品: ${itemInfo.name?.cns || itemInfo.name} x${itemReward.count}`)
          }
        }
      })
    }
  }

  // 检查背包是否已满
  const isBagFull = () => {
    if (!player.value || !player.value.bag) {
      return false
    }

    // 使用实际的可用背包容量
    const bagCapacity = player.value.availableBagSlots || 20
    return player.value.bag.length >= bagCapacity
  }

  // 保存玩家数据
  const savePlayerData = () => {
    // 优先使用传入的storageService实例，否则使用gameInitializer中的storage服务
    if (storageService) {
      try {
        const result = storageService.savePlayerData(player.value)
        // 如果storage保存失败，不再使用备用方案，因为StorageService内部已有完善的错误处理和保护机制(Save Guard)
        // 强制回退到saveToLocalStorageDirectly可能会绕过保护机制导致数据损坏
        if (result === false) {
          console.warn('[useEventHandler] StorageService 保存失败 (可能是被保护机制拦截)，放弃强制保存')
        }
        return result
      } catch (error) {
        console.error('[useEventHandler] storageService.savePlayerData 调用失败:', error)
        // 发生异常时也不回退，防止数据损坏
        return false
      }
    } else if (gameInitializer.value && gameInitializer.value.services.storage) {
      try {
        const result = gameInitializer.value.services.storage.savePlayerData(player.value)
        if (result === false) {
          console.warn('[useEventHandler] gameInitializer.storage 保存失败，放弃强制保存')
        }
        return result
      } catch (error) {
        console.error('[useEventHandler] gameInitializer.storage.savePlayerData 调用失败:', error)
        return false
      }
    } else {
      console.log('[useEventHandler] storage服务不存在，使用备用方案')
      return saveToLocalStorageDirectly()
    }
  }

  // 暴露给外部使用的属性和方法
  return {
    // 方法
    handleBuyItem,
    handleFoodPurchase,
    handleMagicPurchase,
    onPurchaseSuccess,
    onDiamondShopPurchase,
    onDiamondsChanged,
    handleShowMessage,
    handleEnhanceSuccess,
    handleEnhanceFailure,
    handleMapChange,
    handleQuestAccepted,
    handleQuestCompleted,
    grantQuestRewards,
    isBagFull,
    savePlayerData
  }
}
