import { ref, computed } from 'vue'
import { useItemsStore } from '@/store/items'
import BagService from '@/services/BagService'

/**
 * 背包组合式API（重构版）
 * 现在通过 itemsStore 统一管理背包数据
 */
export function useBag (storageService = null) {
  const itemsStore = useItemsStore()
  const bagService = new BagService(storageService)

  // 响应式数据
  const bagItems = computed(() => itemsStore.playerBag)
  const showBagModal = ref(false)
  const bagModalRef = ref(null)

  // 计算属性
  const bagUsage = computed(() => {
    return {
      used: itemsStore.usedSlots,
      available: itemsStore.availableSlots,
      total: itemsStore.bagCapacity,
      percentage: itemsStore.bagUsageRate
    }
  })

  // 方法
  /**
   * 打开背包模态框
   */
  const openBagModal = () => {
    showBagModal.value = true
  }

  /**
   * 关闭背包模态框
   */
  const closeBagModal = () => {
    showBagModal.value = false
    // 刷新背包数据
    if (bagModalRef.value && typeof bagModalRef.value.refresh === 'function') {
      bagModalRef.value.refresh()
    }
  }

  /**
   * 添加物品到背包
   * @param {number} itemId - 物品ID
   * @param {number} quantity - 数量
   * @returns {boolean} 是否添加成功
   */
  const addItemToBag = (itemId, quantity = 1) => {
    const success = bagService.addItemToBag(itemId, null, quantity)
 
    return success
  }

  const addItemQueue = []
  let isFlushingAddItemQueue = false
  let addItemQueueScheduleId = null
  let lastBagUiEventAt = 0
  let pendingBagUiEventTimer = null

  const BAG_UI_EVENT_INTERVAL_MS = 120
  const ADD_ITEM_QUEUE_FLUSH_DELAY_MS = 80

  const dispatchUpdateBagUiEvent = () => {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
      return
    }

    try {
      const now = Date.now()
      const elapsed = now - lastBagUiEventAt

      if (elapsed >= BAG_UI_EVENT_INTERVAL_MS) {
        lastBagUiEventAt = now
        window.dispatchEvent(new CustomEvent('update-bag-ui'))
        return
      }

      if (pendingBagUiEventTimer) {
        return
      }

      pendingBagUiEventTimer = setTimeout(() => {
        pendingBagUiEventTimer = null
        lastBagUiEventAt = Date.now()
        try {
          window.dispatchEvent(new CustomEvent('update-bag-ui'))
        } catch (error) {
          console.error('[useBag] 派发 update-bag-ui 事件失败:', error)
        }
      }, Math.max(0, BAG_UI_EVENT_INTERVAL_MS - elapsed))
    } catch (error) {
      console.error('[useBag] 派发 update-bag-ui 事件失败:', error)
    }
  }

  const scheduleFlushAddItemQueue = () => {
    if (addItemQueueScheduleId !== null) {
      return
    }

    // 使用 setTimeout 替代 requestIdleCallback，避免后台切换恢复时 Violation 阻塞主线程
    addItemQueueScheduleId = setTimeout(() => {
      addItemQueueScheduleId = null
      flushAddItemQueue()
    }, ADD_ITEM_QUEUE_FLUSH_DELAY_MS)
  }

  const flushAddItemQueue = () => {
    if (isFlushingAddItemQueue) {
      scheduleFlushAddItemQueue()
      return
    }
    if (addItemQueue.length === 0) {
      return
    }

    isFlushingAddItemQueue = true

    // 减少每次处理的任务数量，避免阻塞
    const MAX_TASKS_PER_FLUSH = 20
    const tasks = addItemQueue.splice(0, MAX_TASKS_PER_FLUSH)
    const grouped = new Map()

    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i]
      const itemId = task?.itemId
      if (!Number.isFinite(itemId) || itemId <= 0) {
        if (typeof task?.resolve === 'function') {
          task.resolve(false)
        }
        continue
      }

      const entry = grouped.get(itemId) || { itemId, quantity: 0, tasks: [] }
      entry.quantity += task.quantity
      entry.tasks.push(task)
      grouped.set(itemId, entry)
    }

    const items = []
    grouped.forEach(entry => {
      items.push({ itemId: entry.itemId, quantity: entry.quantity })
    })

    let anyAdded = false
    try {
      const addedByItemId = Object.create(null)
      itemsStore.addItemsToBag(items, { addedByItemId })
      grouped.forEach(entry => {
        const added = Math.max(0, Number(addedByItemId[String(entry.itemId)] ?? 0) || 0)
        if (added > 0) {
          anyAdded = true
        }

        let remainingAdded = added
        for (let i = 0; i < entry.tasks.length; i += 1) {
          const task = entry.tasks[i]
          const need = task.quantity
          const ok = remainingAdded >= need
          if (ok) {
            remainingAdded -= need
          }
          if (typeof task?.resolve === 'function') {
            task.resolve(ok)
          }
        }
      })
    } catch (error) {
      console.error('[useBag] 队列化入包失败:', error)
      grouped.forEach(entry => {
        for (let i = 0; i < entry.tasks.length; i += 1) {
          const task = entry.tasks[i]
          if (typeof task?.resolve === 'function') {
            task.resolve(false)
          }
        }
      })
      isFlushingAddItemQueue = false
      if (addItemQueue.length > 0) {
        scheduleFlushAddItemQueue()
      }
      return
    }

    if (anyAdded) {
      try {
        if (typeof bagService.debouncedSavePlayerData === 'function') {
          bagService.debouncedSavePlayerData()
        }
      } catch (error) {
        console.error('[useBag] 防抖保存玩家数据失败:', error)
      }

      dispatchUpdateBagUiEvent()
    }

    isFlushingAddItemQueue = false
    if (addItemQueue.length > 0) {
      scheduleFlushAddItemQueue()
    }
  }

  const addItemToBagQueued = (itemId, quantity = 1) => {
    const itemIdNumber = Number(itemId)
    const quantityNumber = Number(quantity)
    const normalizedItemId =
      Number.isFinite(itemIdNumber) && itemIdNumber > 0 ? itemIdNumber : null
    const normalizedQuantity =
      Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : 1

    if (!normalizedItemId) {
      return Promise.resolve(false)
    }

    return new Promise(resolve => {
      addItemQueue.push({
        itemId: normalizedItemId,
        quantity: normalizedQuantity,
        resolve
      })
      scheduleFlushAddItemQueue()
    })
  }

  /**
   * 从背包中移除物品
   * @param {number} itemId - 物品ID
   * @param {number} quantity - 数量
   */
  const removeItemFromBag = (itemId, quantity = 1) => {
    return BagService.removeItemFromBag(itemId, quantity)
  }

  /**
   * 整理背包
   */
  const sortBag = () => {
  
    // 按物品名称排序
    itemsStore.playerBag.sort((a, b) => {
      const nameA = a.name || ''
      const nameB = b.name || ''
      return nameA.localeCompare(nameB)
    })
    // 保存玩家数据
    if (storageService) {
      storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
    }
  }

  /**
   * 出售所有垃圾物品
   */
  const sellAllJunk = () => {
   
    // 这里可以实现出售垃圾物品逻辑
    // 暂时只显示消息
    console.log('垃圾物品出售功能开发中...')
  }

  /**
   * 装备物品
   * @param {string} slotType - 装备槽类型
   */
  const equipItem = slotType => {
    console.log(`[useBag] 点击装备槽: ${slotType}`)
    // 这里可以实现装备物品的逻辑
    // 例如：打开背包选择物品装备
  }

  /**
   * 卸下所有装备
   */
  const unequipAll = () => {
    if (confirm('确定要卸下所有装备吗？')) {
    
      // 卸下所有装备槽
      const slots = [
        'weapon',
        'shield',
        'helmet',
        'armor',
        'gloves',
        'boots',
        'necklace',
        'ring1',
        'ring2',
        'earring1',
        'earring2'
      ]
      slots.forEach(slot => {
        itemsStore.unequipItem(slot)
      })
      // 保存玩家数据
      if (storageService) {
        storageService.savePlayerPatch({ equipment: { ...itemsStore.equipment } })
      }
    }
  }

  /**
   * 计算装备提供的攻击力加成
   * @returns {number} 装备攻击力加成
   */
  const calculateEquipmentAttack = () => {
    let totalAttack = 0
    const equipment = itemsStore.equipment

    Object.values(equipment).forEach(item => {
      if (item && item.attack) {
        totalAttack += item.attack
      }
    })

    return totalAttack
  }

  /**
   * 计算装备提供的防御力加成
   * @returns {number} 装备防御力加成
   */
  const calculateEquipmentDefense = () => {
    let totalDefense = 0
    const equipment = itemsStore.equipment

    Object.values(equipment).forEach(item => {
      if (item) {
        // 累加所有防御力相关字段
        totalDefense += item.defense || 0
        totalDefense += item.minDefense || 0
        totalDefense += item.maxDefense || 0
      }
    })

    return totalDefense
  }

  /**
   * 计算装备提供的生命值加成
   * @returns {number} 装备生命值加成
   */
  const calculateEquipmentHealth = () => {
    let totalHealth = 0
    const equipment = itemsStore.equipment

    Object.values(equipment).forEach(item => {
      if (item && item.health) {
        totalHealth += item.health
      }
    })

    return totalHealth
  }

  /**
   * 计算装备提供的魔法值加成
   * @returns {number} 装备魔法值加成
   */
  const calculateEquipmentMana = () => {
    let totalMana = 0
    const equipment = itemsStore.equipment

    Object.values(equipment).forEach(item => {
      if (item && item.mana) {
        totalMana += item.mana
      }
    })

    return totalMana
  }

  /**
   * 暴露给外部使用的属性和方法
   */
  return {
    // 响应式数据
    bagItems,
    showBagModal,
    bagModalRef,

    // 计算属性
    bagUsage,

    // 方法
    openBagModal,
    closeBagModal,
    refreshBagModal: () => {
      if (bagModalRef.value && typeof bagModalRef.value.refresh === 'function') {
        bagModalRef.value.refresh()
      }
      dispatchUpdateBagUiEvent()
    },
    toggleBagModal: () => {
      showBagModal.value = !showBagModal.value
    },
    addItemToBag,
    addItemToBagQueued,
    removeItemFromBag,
    sortBag,
    sellAllJunk,
    equipItem,
    unequipAll,
    calculateEquipmentAttack,
    calculateEquipmentDefense,
    calculateEquipmentHealth,
    calculateEquipmentMana
  }
}
