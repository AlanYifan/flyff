/**
 * 自动战斗波次结算聚合器
 * 负责在每次清场后聚合统计经验、金币、物品掉落和自动出售
 * 实现战斗日志合并输出，减少UI阻塞
 */
export class WaveSettlementAggregator {
  constructor () {
    this.reset()
  }

  /**
   * 重置聚合数据
   */
  reset () {
    this.totalExp = 0
    this.totalGold = 0
    this.monstersDefeated = 0
    this.items = new Map() // itemId -> { name, icon, quantity, itemData }
    this.autoSoldItems = [] // { name, quantity, gold }
    this.totalAutoSoldGold = 0
    this.startTime = null
    this.endTime = null
    this.isAggregating = false
    this.pendingSettlements = []
    this.flushScheduled = false
    this.callbacks = {
      onFlush: null,
      onExpUpdate: null,
      onGoldUpdate: null,
      onItemUpdate: null,
      onAutoSellUpdate: null,
      onBattleLog: null,
      onShowExpAnimation: null
    }
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks
   */
  setCallbacks (callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * 开始新的波次结算聚合
   */
  startWave () {
    this.reset()
    this.startTime = Date.now()
    this.isAggregating = true
  }

  /**
   * 结束当前波次（触发聚合输出）
   */
  endWave () {
    this.endTime = Date.now()
    this.isAggregating = false
    this.scheduleFlush()
  }

  /**
   * 添加击杀结算数据
   * @param {Object} settlement - { exp, gold, items, monsterId }
   */
  addSettlement (settlement) {
    if (!settlement) {return}

    const { exp = 0, gold = 0, items = [] } = settlement

    this.totalExp += Number(exp) || 0
    this.totalGold += Number(gold) || 0
    this.monstersDefeated++

    // 聚合物品
    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item || !item.id) {continue}
        const itemId = Number(item.id)
        const quantity = Number(item.currentStack ?? item.quantity ?? item.stack ?? 1) || 1
        const existing = this.items.get(itemId)
        if (existing) {
          existing.quantity += quantity
        } else {
          this.items.set(itemId, {
            id: itemId,
            name: item.name || `物品#${itemId}`,
            icon: item.icon || `/pt/item_icon/${itemId}.png`,
            quantity,
            itemData: item
          })
        }
      }
    }
  }

  /**
   * 批量添加击杀结算数据
   * @param {Array} settlements
   */
  addSettlements (settlements) {
    if (!Array.isArray(settlements)) {return}
    for (const settlement of settlements) {
      this.addSettlement(settlement)
    }
  }

  /**
   * 添加自动出售数据
   * @param {string} itemName - 物品名称
   * @param {number} quantity - 出售数量
   * @param {number} gold - 获得金币
   */
  addAutoSell (itemName, quantity, gold) {
    this.autoSoldItems.push({
      name: itemName,
      quantity: Number(quantity) || 1,
      gold: Number(gold) || 0
    })
    this.totalAutoSoldGold += Number(gold) || 0
  }

  /**
   * 获取聚合结果
   * @returns {Object}
   */
  getAggregatedResult () {
    return {
      totalExp: this.totalExp,
      totalGold: this.totalGold,
      monstersDefeated: this.monstersDefeated,
      items: Array.from(this.items.values()),
      autoSoldItems: this.autoSoldItems,
      totalAutoSoldGold: this.totalAutoSoldGold,
      duration: this.endTime && this.startTime ? this.endTime - this.startTime : 0
    }
  }

  /**
   * 生成合并的战斗日志消息
   * @returns {Object} { expLog, goldLog, itemLog, autoSellLog }
   */
  generateMergedLogs () {
    const result = this.getAggregatedResult()
    const logs = {
      expLog: null,
      goldLog: null,
      itemLog: null,
      autoSellLog: null
    }

    // 经验日志（合并）
    if (result.totalExp > 0) {
      logs.expLog = {
        message: `本波击杀 ${result.monstersDefeated} 只怪物，共获得 ${result.totalExp.toFixed(0)} 点经验`,
        type: 'exp',
        value: result.totalExp,
        count: result.monstersDefeated
      }
    }

    // 金币日志（合并）
    const totalGoldWithSold = result.totalGold + result.totalAutoSoldGold
    if (totalGoldWithSold > 0) {
      const parts = []
      if (result.totalGold > 0) {
        parts.push(`掉落 ${result.totalGold} 金币`)
      }
      if (result.totalAutoSoldGold > 0) {
        parts.push(`自动出售获得 ${result.totalAutoSoldGold} 金币`)
      }
      logs.goldLog = {
        message: `本波共获得 ${totalGoldWithSold} 金币（${parts.join('，')}）`,
        type: 'gold',
        value: totalGoldWithSold,
        dropGold: result.totalGold,
        sellGold: result.totalAutoSoldGold
      }
    }

    // 物品日志（合并）
    if (result.items.length > 0) {
      const previewCount = Math.min(3, result.items.length)
      const previewNames = result.items.slice(0, previewCount).map(item => `${item.name}x${item.quantity}`)
      const suffix = result.items.length > previewCount ? '…' : ''
      logs.itemLog = {
        message: `本波共获得 ${result.items.length} 种物品（${previewNames.join('，')}${suffix}）`,
        type: 'drop',
        items: result.items,
        totalCount: result.items.reduce((sum, item) => sum + item.quantity, 0),
        typeCount: result.items.length
      }
    }

    // 自动出售日志（合并）
    if (result.autoSoldItems.length > 0) {
      const totalCount = result.autoSoldItems.reduce((sum, item) => sum + item.quantity, 0)
      logs.autoSellLog = {
        message: `自动出售 ${result.autoSoldItems.length} 种物品共 ${totalCount} 个，获得 ${result.totalAutoSoldGold} 金币`,
        type: 'sell',
        items: result.autoSoldItems,
        totalGold: result.totalAutoSoldGold,
        totalCount
      }
    }

    return logs
  }

  /**
   * 调度刷新聚合结果
   */
  scheduleFlush () {
    if (this.flushScheduled) {return}
    this.flushScheduled = true

    // 使用微任务或 setTimeout 来延迟执行
    const flushTask = () => this.flush()
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(flushTask)
    } else {
      Promise.resolve().then(flushTask)
    }
  }

  /**
   * 刷新输出聚合结果
   */
  flush () {
    this.flushScheduled = false
    if (this.monstersDefeated === 0 && this.items.size === 0 && this.autoSoldItems.length === 0) {
      return
    }

    const result = this.getAggregatedResult()
    const logs = this.generateMergedLogs()

    // 调用回调输出
    if (this.callbacks.onFlush) {
      this.callbacks.onFlush(result, logs)
    }

    // 输出战斗日志
    if (this.callbacks.onBattleLog) {
      if (logs.expLog) {
        this.callbacks.onBattleLog(logs.expLog.message, logs.expLog.type)
      }
      if (logs.goldLog) {
        this.callbacks.onBattleLog(logs.goldLog.message, logs.goldLog.type)
      }
      if (logs.itemLog) {
        this.callbacks.onBattleLog(logs.itemLog.message, logs.itemLog.type)
      }
      if (logs.autoSellLog) {
        this.callbacks.onBattleLog(logs.autoSellLog.message, logs.autoSellLog.type)
      }
    }

    // 触发经验动画（合并显示）
    if (this.callbacks.onShowExpAnimation && result.totalExp > 0) {
      this.callbacks.onShowExpAnimation(result.totalExp, result.monstersDefeated)
    }

    // 触发更新回调
    if (this.callbacks.onExpUpdate && result.totalExp > 0) {
      this.callbacks.onExpUpdate(result.totalExp)
    }
    if (this.callbacks.onGoldUpdate && (result.totalGold > 0 || result.totalAutoSoldGold > 0)) {
      this.callbacks.onGoldUpdate(result.totalGold + result.totalAutoSoldGold)
    }
    if (this.callbacks.onItemUpdate && result.items.length > 0) {
      this.callbacks.onItemUpdate(result.items)
    }
  }

  /**
   * 是否正在聚合中
   * @returns {boolean}
   */
  isActive () {
    return this.isAggregating
  }

  /**
   * 获取当前统计数据（用于实时显示）
   * @returns {Object}
   */
  getStats () {
    return {
      totalExp: this.totalExp,
      totalGold: this.totalGold,
      monstersDefeated: this.monstersDefeated,
      itemCount: this.items.size,
      autoSellCount: this.autoSoldItems.length,
      totalAutoSoldGold: this.totalAutoSoldGold
    }
  }
}

// 创建全局单例实例
export const waveSettlementAggregator = new WaveSettlementAggregator()

export default waveSettlementAggregator
