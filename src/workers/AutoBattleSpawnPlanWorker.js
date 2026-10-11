/**
 * @file AutoBattleSpawnPlanWorker.js
 * @generated 2026-06-13
 * 自动战斗怪物生成计划 Worker
 * 支持转职任务优先怪物 ID（priorityMonsterIds）
 * 支持堕落BOSS强制刷新（forcedBossMonsterId）：三转任务「实力证明2 堕落BOSS」激活时，
 *   每波必定包含一个按任务顺序的堕落BOSS，覆盖正常的BOSS概率设置
 */

const planAutoBattleWave = payload => {
  const monsterArraySize = Math.min(Math.max(1, Number(payload?.monsterArraySize) || 30), 200)
  const spawnCount = Math.min(Math.max(1, Number(payload?.spawnCount) || 5), monsterArraySize)
  const regularIds = Array.isArray(payload?.regularIds) ? payload.regularIds : []
  const specialIds = Array.isArray(payload?.specialIds) ? payload.specialIds : []
  const priorityIds = Array.isArray(payload?.priorityMonsterIds) ? payload.priorityMonsterIds : []
  const bossProbabilityCandidate = Number(payload?.bossProbability)
  const bossProbability = Number.isFinite(bossProbabilityCandidate)
    ? Math.min(0.1, Math.max(0, bossProbabilityCandidate))
    : 0
  // ★ 堕落BOSS强制刷新目标
  const forcedBossId = Number(payload?.forcedBossMonsterId) || null

  if (!regularIds.length && !specialIds.length && !forcedBossId) {
    return null
  }

  // ★ 如果有强制堕落BOSS，跳过正常的BOSS概率逻辑，必定在随机位置生成该BOSS
  let specialId = null
  let specialIndex = -1

  if (forcedBossId) {
    // 强制生成指定堕落BOSS，覆盖正常BOSS概率
    specialId = forcedBossId
    specialIndex = Math.floor(Math.random() * spawnCount)
  } else {
    const specialRanksPlanned =
      specialIds.length > 0 && bossProbability > 0 && Math.random() < bossProbability

    if (specialRanksPlanned) {
      specialId = specialIds[Math.floor(Math.random() * specialIds.length)]
      specialIndex = Math.floor(Math.random() * spawnCount)
    }

    if (!regularIds.length && !specialId && specialIds.length > 0) {
      specialId = specialIds[Math.floor(Math.random() * specialIds.length)]
      specialIndex = 0
    }
  }

  // 转职任务优先怪物：直接使用 priorityIds（不需要在 regularIds 中）
  // 因为2阶段BOSS怪物可能没有 drops 数据，被 regularIds 过滤掉了
  // ★ 如果当前是强制堕落BOSS波次，从优先列表中移除该BOSS避免重复出现
  const priorityAvailable = priorityIds.length > 0
    ? (forcedBossId
        ? priorityIds.filter(id => Number(id) !== forcedBossId)
        : [...priorityIds])
    : []

  const spawn = []
  for (let i = 0; i < spawnCount; i++) {
    if (i === specialIndex && specialId !== null && specialId !== undefined) {
      spawn.push({ index: i, id: specialId })
      continue
    }
    // 优先使用转职任务目标怪物（已排除强制BOSS避免重复）
    if (priorityAvailable.length > 0 && Math.random() < 0.6) {
      const priorityId = priorityAvailable[Math.floor(Math.random() * priorityAvailable.length)]
      spawn.push({ index: i, id: priorityId })
      continue
    }
    if (!regularIds.length) {
      continue
    }
    const id = regularIds[Math.floor(Math.random() * regularIds.length)]
    spawn.push({ index: i, id })
  }

  return { monsterArraySize, spawnCount, spawn }
}

self.onmessage = event => {
  const { type, payload, requestId } = event.data || {}

  try {
    if (type !== 'autoBattleSpawnPlan') {
      self.postMessage({ type, requestId, error: '未知的任务类型' })
      return
    }

    const result = planAutoBattleWave(payload || {})
    self.postMessage({ type, requestId, result })
  } catch (error) {
    self.postMessage({ type, requestId, error: error?.message || 'Worker执行失败' })
  }
}
