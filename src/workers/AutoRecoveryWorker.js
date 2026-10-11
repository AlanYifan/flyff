/**
 * @fileoverview 自动恢复 Web Worker
 * @description 在独立线程中计算 HP/MP 恢复物品的使用，完全不阻塞主线程。
 *
 * 核心设计：
 * 1. Worker 接收玩家状态、背包恢复物品数据和设置
 * 2. 计算需要使用的恢复物品及数量（合并 HP/MP 一次遍历）
 * 3. 返回新的 HP/MP 值和物品 stack 变更列表
 * 4. 主线程只做轻量赋值和定向 $patch
 *
 * 通信协议：
 * 主线程 → Worker:
 *   { type: 'recover', member, recoveryItems, settings }
 *     member: { currentHealth, maxHealth, currentMana, maxMana }
 *     recoveryItems: [{ bagIndex, id, currentStack, stack, subcategory, hpAbility, mpAbility }]
 *     settings: { autoHpRecoveryPercent, autoMpRecoveryPercent }
 *
 * Worker → 主线程:
 *   { type: 'recovery-result', newHp, newMp, hpRecovered, mpRecovered, itemsUsed }
 *   { type: 'log', level, args }
 *
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-07-12
 */

/**
 * 执行恢复计算
 * 合并 HP/MP 物品查找为一次遍历，计算最优使用数量
 * @param {Object} data - 恢复请求数据
 * @returns {Object} 恢复结果
 */
function performRecovery (data) {
  const { member, recoveryItems, settings } = data
  const result = {
    newHp: member.currentHealth,
    newMp: member.currentMana,
    hpRecovered: 0,
    mpRecovered: 0,
    itemsUsed: []
  }

  if (!member || !Array.isArray(recoveryItems) || recoveryItems.length === 0) {
    return result
  }

  const maxHealth = Number(member.maxHealth) || 100
  const maxMana = Number(member.maxMana) || 100
  const currentHealth = Number(member.currentHealth) || 0
  const currentMana = Number(member.currentMana) || 0

  if (currentHealth <= 0) {
    return result
  }

  const hpRecoveryPercent = Number(settings.autoHpRecoveryPercent) || 50
  const mpRecoveryPercent = Number(settings.autoMpRecoveryPercent) || 50

  const hpThreshold = maxHealth * (hpRecoveryPercent / 100)
  const mpThreshold = maxMana * (mpRecoveryPercent / 100)

  const shouldRecoverHp = currentHealth < hpThreshold && currentHealth < maxHealth
  const shouldRecoverMp = currentMana < mpThreshold && currentMana < maxMana

  if (!shouldRecoverHp && !shouldRecoverMp) {
    return result
  }

  const hpNeeded = maxHealth - currentHealth
  const mpNeeded = maxMana - currentMana

  let newHp = currentHealth
  let newMp = currentMana

  // 一次遍历，同时收集 HP 和 MP 恢复物品
  for (const itemData of recoveryItems) {
    if (!itemData || typeof itemData !== 'object') continue

    const actualStack = itemData.currentStack !== undefined
      ? Number(itemData.currentStack)
      : Number(itemData.stack)
    if (!Number.isFinite(actualStack) || actualStack <= 0) continue

    // 处理 HP 恢复
    if (shouldRecoverHp && hpNeeded > 0 && newHp < maxHealth &&
        itemData.subcategory === 'food' && itemData.hpAbility) {
      const ability = itemData.hpAbility
      const add = Number(ability.add) || 0
      if (add <= 0) continue

      const recoveryPerUnit = ability.rate
        ? Math.floor((maxHealth * add) / 100)
        : add

      if (recoveryPerUnit <= 0) continue

      const remainingNeeded = maxHealth - newHp
      const useCount = Math.min(actualStack, Math.ceil(remainingNeeded / recoveryPerUnit))
      const totalRecovery = useCount * recoveryPerUnit

      newHp = Math.min(maxHealth, newHp + totalRecovery)
      result.hpRecovered += totalRecovery

      const newStack = actualStack - useCount
      result.itemsUsed.push({
        bagIndex: itemData.bagIndex,
        newStack,
        type: 'hp',
        count: useCount,
        value: totalRecovery
      })

      continue // 同一物品不会同时是 HP 和 MP 恢复
    }

    // 处理 MP 恢复
    if (shouldRecoverMp && mpNeeded > 0 && newMp < maxMana &&
        itemData.subcategory === 'refresher' && itemData.mpAbility) {
      const ability = itemData.mpAbility
      const add = Number(ability.add) || 0
      if (add <= 0) continue

      const recoveryPerUnit = ability.rate
        ? Math.floor((maxMana * add) / 100)
        : add

      if (recoveryPerUnit <= 0) continue

      const remainingNeeded = maxMana - newMp
      const useCount = Math.min(actualStack, Math.ceil(remainingNeeded / recoveryPerUnit))
      const totalRecovery = useCount * recoveryPerUnit

      newMp = Math.min(maxMana, newMp + totalRecovery)
      result.mpRecovered += totalRecovery

      const newStack = actualStack - useCount
      result.itemsUsed.push({
        bagIndex: itemData.bagIndex,
        newStack,
        type: 'mp',
        count: useCount,
        value: totalRecovery
      })
    }
  }

  result.newHp = newHp
  result.newMp = newMp

  return result
}

/**
 * 监听主线程消息
 */
self.onmessage = function (event) {
  const { type } = event.data || {}

  switch (type) {
    case 'recover': {
      try {
        const result = performRecovery(event.data)
        self.postMessage({ type: 'recovery-result', ...result })
      } catch (error) {
        self.postMessage({
          type: 'log',
          level: 'error',
          args: ['[AutoRecoveryWorker] 恢复计算失败:', error.message]
        })
        // 返回空结果，避免主线程无限等待
        self.postMessage({
          type: 'recovery-result',
          newHp: event.data.member?.currentHealth || 0,
          newMp: event.data.member?.currentMana || 0,
          hpRecovered: 0,
          mpRecovered: 0,
          itemsUsed: []
        })
      }
      break
    }

    default:
      break
  }
}
