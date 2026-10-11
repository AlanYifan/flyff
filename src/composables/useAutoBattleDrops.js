import { DropService } from '@/services/DropService'
import { useMonstersStore } from '@/store/monsters'
import { getMasterGradeExpMultiplier, getMasterGradeDropMultiplier } from '@/services/MasterGradeService'

const debugLog = () => {}

let dropWorker = null
let dropWorkerRequestId = 1
const dropWorkerPending = new Map()

const getDropWorker = () => {
  if (dropWorker) {
    return dropWorker
  }
  if (typeof Worker === 'undefined') {
    debugLog('[WorkerPerf] 掉落Worker不可用: Worker未定义')
    return null
  }

  try {
    dropWorker = new Worker(new URL('../workers/DropWorker.js', import.meta.url), {
      type: 'module'
    })
    debugLog('[WorkerPerf] 掉落Worker初始化成功')
    dropWorker.onmessage = event => {
      const { requestId, result, error } = event.data || {}
      if (!requestId || !dropWorkerPending.has(requestId)) {
        debugLog('[WorkerPerf] 掉落Worker返回异常请求', {
          requestId,
          hasPending: dropWorkerPending.has(requestId)
        })
        return
      }
      const handler = dropWorkerPending.get(requestId)
      dropWorkerPending.delete(requestId)
      if (error) {
        handler.reject(new Error(error))
        return
      }
      handler.resolve(result)
    }
    dropWorker.onerror = error => {
      console.error('DropWorker 运行失败:', error)
    }
    return dropWorker
  } catch (error) {
    console.error('DropWorker 初始化失败:', error)
    return null
  }
}

const requestDropWorker = payload => {
  const worker = getDropWorker()
  if (!worker) {
    debugLog('[WorkerPerf] 掉落Worker不可用: 初始化失败或未创建')
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const requestId = dropWorkerRequestId++
    dropWorkerPending.set(requestId, { resolve, reject })
    debugLog('[WorkerPerf] 掉落Worker发送请求', {
      requestId,
      monsterId: payload?.monster?.id ?? payload?.monster?.itemId ?? null
    })
    worker.postMessage({ type: 'drop', payload, requestId })
  })
}

const requestDropWorkerBatch = payloadList => {
  const worker = getDropWorker()
  if (!worker) {
    debugLog('[WorkerPerf] 掉落Worker不可用: 初始化失败或未创建')
    return Promise.resolve(null)
  }

  const resolvedList = Array.isArray(payloadList) ? payloadList : []
  if (resolvedList.length === 0) {
    return Promise.resolve([])
  }

  return new Promise((resolve, reject) => {
    const requestId = dropWorkerRequestId++
    dropWorkerPending.set(requestId, { resolve, reject })
    debugLog('[WorkerPerf] 掉落Worker发送批量请求', {
      requestId,
      count: resolvedList.length
    })
    worker.postMessage({ type: 'dropBatchPacked', payload: resolvedList, requestId })
  })
}

/**
 * 掉落计算组合式API
 * @param {Object} player - 玩家对象
 * @param {Function} getDungeonMultiplier - 获取副本倍率的函数，可选
 */
export function useAutoBattleDrops (player, getDungeonMultiplier = null) {
  const monstersStore = useMonstersStore()

  /**
   * 获取掉落倍率（从玩家 activeBuffs 中计算，并叠加副本倍率）
   * @returns {number} 最终掉落倍率
   */
  const getDropRateMultiplier = () => {
    const activeBuffs = player?.value?.activeBuffs || []
    let multiplier = 1
    
    // 0. 大师进阶期间掉率 -50%
    const masterDropMultiplier = getMasterGradeDropMultiplier(player?.value)
    multiplier *= masterDropMultiplier
    
    // 1. 先应用副本难度倍率
    if (typeof getDungeonMultiplier === 'function') {
      const dungeonMultiplier = getDungeonMultiplier()
      if (typeof dungeonMultiplier === 'number' && dungeonMultiplier > 0) {
        multiplier *= dungeonMultiplier
      }
    }
    
    // 2. 再应用玩家掉落率Buff
    activeBuffs.forEach(buff => {
      // 检查 effects.dropRate 格式（新格式）
      if (buff.effects?.dropRate) {
        const effect = buff.effects.dropRate
        const add = typeof effect === 'object' ? (effect.add || 0) : effect
        const isRate = typeof effect === 'object' ? effect.rate : buff.effectsRate
        if (isRate) {
          multiplier *= (1 + add / 100)
        } else {
          multiplier *= add
        }
      }
      // 兼容旧格式
      if (buff.type === 'dropRate') {
        multiplier *= (1 + (buff.rate || 0))
      }
    })
    return typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : 1
  }

  const buildWorkerPayload = monster => {
    const dropRateMultiplier = getDropRateMultiplier()
    const monsterConfig = monster?.id ? monstersStore.getMonsterConfig(monster.id) : null

    // 获取经验表并确保可序列化（转换为纯数字数组）
    let expTable = null
    if (Array.isArray(monster?.experienceTable)) {
      expTable = monster.experienceTable.map(v => (typeof v === 'number' ? v : 0))
    } else if (Array.isArray(monsterConfig?.experienceTable)) {
      expTable = monsterConfig.experienceTable.map(v => (typeof v === 'number' ? v : 0))
    }

    return {
      monster: {
        giveGold: typeof monster?.giveGold === 'number' ? monster.giveGold : null,
        gold: typeof monster?.gold === 'number' ? monster.gold : null,
        minDropGold: typeof monster?.minDropGold === 'number' ? monster.minDropGold : null,
        maxDropGold: typeof monster?.maxDropGold === 'number' ? monster.maxDropGold : null,
        experienceTable: expTable,
        drops: Array.isArray(monster?.drops)
          ? monster.drops.map(drop => ({
            item: drop?.item ?? null,
            stack: typeof drop?.stack === 'number' ? drop.stack : 1,
            // prob 和 probability 可能是字符串格式（如 '[10%;20%['）或数字
            prob: drop?.prob ?? null,
            probability: drop?.probability ?? null,
            rate: typeof drop?.rate === 'number' ? drop.rate : null
          }))
          : []
      },
      playerLevel: player?.value?.level || 1,
      playerMaxExp: player?.value?.maxExp ?? 0,
      expTable,
      dropRateMultiplier: typeof dropRateMultiplier === 'number' ? dropRateMultiplier : 1
    }
  }

  const resolveRewardsFromWorkerResult = workerResult => {
    if (!workerResult || typeof workerResult !== 'object') {
      return null
    }
    const items = Array.isArray(workerResult.items)
      ? workerResult.items.map(drop => DropService.createDropItem(drop)).filter(Boolean)
      : []
    return {
      exp: Number(workerResult.exp) || 0,
      gold: Number(workerResult.gold) || 0,
      items
    }
  }

  const calculateAutoBattleRewards = async monster => {
    const playerLevel = player?.value?.level || 1
    let rewards = null
    let usedWorker = false

    try {
      const workerPayload = buildWorkerPayload(monster)
      const workerResult = await requestDropWorker(workerPayload)
      if (workerResult) {
        rewards = resolveRewardsFromWorkerResult(workerResult)
        if (rewards) {
          usedWorker = true
          debugLog('[WorkerPerf] 掉落 Worker 命中', {
            monsterId: monster?.id ?? null,
            exp: rewards.exp,
            gold: rewards.gold,
            items: rewards.items?.length || 0
          })
        }
      }
    } catch (error) {
      console.error('AutoBattleDrops', 'Worker掉落计算失败:', error)
    }

    if (!usedWorker) {
      debugLog('[WorkerPerf] 掉落使用主线程计算', {
        monsterId: monster?.id ?? null
      })
      rewards = DropService.processMonsterDrop(
        monster,
        playerLevel,
        player?.value?.maxExp ?? 0,
        null,
        getDropRateMultiplier()
      )
    }

    // ★ 大师进阶期间经验 -50%
    if (rewards) {
      const masterExpMultiplier = getMasterGradeExpMultiplier(player?.value)
      if (masterExpMultiplier !== 1) {
        rewards.exp = Math.floor(rewards.exp * masterExpMultiplier)
      }
    }

    return { rewards, usedWorker }
  }

  const calculateAutoBattleRewardsBatch = async monsters => {
    const list = Array.isArray(monsters) ? monsters : []
    if (list.length === 0) {
      return []
    }

    const playerLevel = player?.value?.level || 1
    let usedWorker = false
    let workerResults = null

    try {
      const payloadList = list.map(monster => buildWorkerPayload(monster))
      workerResults = await requestDropWorkerBatch(payloadList)
      const packedOk =
        workerResults &&
        typeof workerResults === 'object' &&
        workerResults.exp &&
        workerResults.gold &&
        Array.isArray(workerResults.items) &&
        workerResults.items.length === payloadList.length
      usedWorker =
        (Array.isArray(workerResults) && workerResults.length === payloadList.length) || packedOk
      if (usedWorker) {
        debugLog('[WorkerPerf] 掉落 Worker 批量命中', { count: payloadList.length })
      } else {
        workerResults = null
      }
    } catch (error) {
      console.error('AutoBattleDrops', 'Worker批量掉落计算失败:', error)
      workerResults = null
    }

    /** ★ 大师进阶期间经验 -50%，对批量结果统一应用 */
    const applyMasterExpPenalty = (result) => {
      if (result?.rewards) {
        const masterExpMultiplier = getMasterGradeExpMultiplier(player?.value)
        if (masterExpMultiplier !== 1) {
          result.rewards.exp = Math.floor(result.rewards.exp * masterExpMultiplier)
        }
      }
      return result
    }

    if (usedWorker && workerResults) {
      if (
        workerResults &&
        typeof workerResults === 'object' &&
        workerResults.exp &&
        workerResults.gold &&
        Array.isArray(workerResults.items)
      ) {
        const exp = workerResults.exp
        const gold = workerResults.gold
        const items = workerResults.items
        const total = Math.min(list.length, items.length, exp.length || 0, gold.length || 0)
        const mapped = new Array(list.length)
        for (let i = 0; i < list.length; i += 1) {
          if (i < total) {
            const rewards = resolveRewardsFromWorkerResult({
              exp: exp[i],
              gold: gold[i],
              items: items[i]
            })
            mapped[i] = rewards ? { rewards, usedWorker: true } : null
          } else {
            mapped[i] = null
          }
        }
        return mapped.map((entry, index) => {
          if (entry) {
            return applyMasterExpPenalty(entry)
          }
          return applyMasterExpPenalty({
            rewards: DropService.processMonsterDrop(
              list[index],
              playerLevel,
              player?.value?.maxExp ?? 0,
              null,
              getDropRateMultiplier()
            ),
            usedWorker: false
          })
        })
      }
      return workerResults.map((result, index) => {
        const rewards = resolveRewardsFromWorkerResult(result)
        const entry = rewards
          ? { rewards, usedWorker: true }
          : {
            rewards: DropService.processMonsterDrop(
              list[index],
              playerLevel,
              player?.value?.maxExp ?? 0,
              null,
              getDropRateMultiplier()
            ),
            usedWorker: false
          }
        return applyMasterExpPenalty(entry)
      })
    }

    return list.map(monster => applyMasterExpPenalty({
      rewards: DropService.processMonsterDrop(monster, playerLevel, player?.value?.maxExp ?? 0, null, getDropRateMultiplier()),
      usedWorker: false
    }))
  }

  return {
    calculateAutoBattleRewards,
    calculateAutoBattleRewardsBatch
  }
}
