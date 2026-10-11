// 计算怪物掉落的金币奖励
const calculateGoldReward = monster => {
  if (monster.giveGold) {
    return monster.giveGold
  }
  if (monster.gold) {
    return monster.gold
  }
  if (monster.minDropGold !== undefined && monster.maxDropGold !== undefined) {
    return (
      Math.floor(Math.random() * (monster.maxDropGold - monster.minDropGold + 1)) +
      monster.minDropGold
    )
  }

  return 0
}
// 检查掉落率是否通过
// dropRateMultiplier: 掉落倍率（如 2 表示掉落概率翻倍）
const checkDropRate = (drop, dropRateMultiplier = 1) => {
  let dropRate = 0

  if (drop.prob) {
    const match = drop.prob.match(/\[(\d+(\.\d+)?)%?;([\d.]+)%?\[/)
    if (match) {
      const minProb = parseFloat(match[1])
      const maxProb = parseFloat(match[3])
      dropRate = minProb + Math.random() * (maxProb - minProb)
    } else {
      dropRate = parseFloat(drop.prob) || 0
    }
  } else if (drop.probability) {
    const match = drop.probability.match(/\[(\d+(\.\d+)?)%?;([\d.]+)%?\[/)
    if (match) {
      const minProb = parseFloat(match[1])
      const maxProb = parseFloat(match[3])
      dropRate = minProb + Math.random() * (maxProb - minProb)
    } else {
      dropRate = parseFloat(drop.probability) || 0
    }
  } else if (drop.rate) {
    dropRate = drop.rate
  }

  // 应用掉落倍率
  const adjustedDropRate = dropRate * dropRateMultiplier

  // 掉落概率上限为 100%
  const finalDropRate = Math.min(adjustedDropRate, 100)

  return Math.random() * 100 < finalDropRate
}
// 计算怪物掉落的物品奖励
const calculateItemDrops = (monster, dropRateMultiplier = 1) => {
  if (!monster.drops || !Array.isArray(monster.drops)) {
    return []
  }

  return monster.drops
    .filter(drop => checkDropRate(drop, dropRateMultiplier))
    .map(drop => ({
      item: drop.item,
      stack: drop.stack || 1
    }))
}
// 计算怪物掉落的经验奖励
const calculateExpReward = (expTable, playerLevel, playerMaxExp) => {
  if (!expTable || expTable.length === 0) {
    return 0
  }

  const expIndex = Math.min(playerLevel - 1, expTable.length - 1)
  const expPercentage = expTable[expIndex]

  return (expPercentage / 100) * playerMaxExp
}
// 计算怪物掉落的结果
const computeDropResult = payload => {
  const { monster, playerLevel, playerMaxExp, expTable, dropRateMultiplier = 1 } = payload || {}
  const resolvedMonster = monster || {}
  const resolvedExpTable = Array.isArray(expTable)
    ? expTable
    : Array.isArray(resolvedMonster.experienceTable)
      ? resolvedMonster.experienceTable
      : []
  return {
    exp: calculateExpReward(resolvedExpTable, playerLevel, playerMaxExp),
    gold: calculateGoldReward(resolvedMonster),
    items: calculateItemDrops(resolvedMonster, dropRateMultiplier)
  }
}
// 处理Worker消息
self.onmessage = event => {
  const { type, payload, requestId } = event.data || {}

  try {
    if (type !== 'drop' && type !== 'dropBatch' && type !== 'dropBatchPacked') {
      self.postMessage({ type, requestId, error: '未知的任务类型' })
      return
    }

    if (type === 'dropBatchPacked') {
      const list = Array.isArray(payload) ? payload : []
      const exp = new Float64Array(list.length)
      const gold = new Int32Array(list.length)
      const items = new Array(list.length)
      for (let i = 0; i < list.length; i += 1) {
        const result = computeDropResult(list[i])
        exp[i] = Number(result?.exp) || 0
        gold[i] = Math.floor(Number(result?.gold) || 0)
        items[i] = Array.isArray(result?.items) ? result.items : []
      }
      self.postMessage(
        { type, requestId, result: { exp, gold, items } },
        [exp.buffer, gold.buffer]
      )
      return
    }

    const result = type === 'dropBatch'
      ? Array.isArray(payload)
        ? payload.map(item => computeDropResult(item))
        : []
      : computeDropResult(payload)
    self.postMessage({ type, requestId, result })
  } catch (error) {
    self.postMessage({ type, requestId, error: error?.message || 'Worker执行失败' })
  }
}
