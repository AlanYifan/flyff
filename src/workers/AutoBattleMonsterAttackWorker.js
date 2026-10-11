const normalizeRateToRatio = (value, fallback = 0) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return fallback
  }
  if (numeric <= 0) {
    return 0
  }
  const ratio = numeric > 1 ? numeric / 100 : numeric
  return Math.max(0, Math.min(1, ratio))
}

const calculateMonsterAttackIntervalOnce = monster => {
  const cached = Number(monster?._cachedAttackInterval)
  if (Number.isFinite(cached) && cached > 0) {
    return Math.round(cached)
  }

  let interval
  const rank = typeof monster?.rank === 'string' ? monster.rank.toLowerCase() : ''
  if (['captain', 'normal', 'material', 'small'].includes(rank)) {
    interval = 1500 + Math.random() * (3000 - 1500)
  } else if (['giant', 'boss', 'violet', 'super'].includes(rank)) {
    interval = 2000 + Math.random() * (3500 - 2000)
  } else if (monster?.speed !== undefined && monster?.speed !== null) {
    const speed = Math.max(0, Math.min(100, Number(monster.speed) || 0))
    const maxInterval = 3000
    const minInterval = 800
    const speedFactor = speed / 100
    interval = maxInterval - (maxInterval - minInterval) * speedFactor
  } else if (monster?.attackInterval) {
    interval = Math.max(800, Math.min(3000, Number(monster.attackInterval) || 0))
  } else {
    interval = 2000
  }

  const rounded = Math.round(interval)
  return Math.max(1, rounded)
}

const calculateMonsterDamage = monster => {
  const resolvedAttack = Number(monster?.attack ?? monster?.damage)
  const resolvedMinAttack = Number(monster?.minAttack)
  const resolvedMaxAttack = Number(monster?.maxAttack)
  const hasAttackRange = Number.isFinite(resolvedMinAttack) && Number.isFinite(resolvedMaxAttack)
  const baseDamage = Number.isFinite(resolvedAttack)
    ? resolvedAttack
    : hasAttackRange
      ? (resolvedMinAttack + resolvedMaxAttack) / 2
      : 10
  let safeBaseDamage = Math.max(1, baseDamage)
  const variance = safeBaseDamage * 0.2
  let randomDamage = safeBaseDamage + (Math.random() * variance * 2 - variance)

  // 消费攻击力降低DEBUFF（毒箭等技能）
  if (monster?.attackReductionDebuff) {
    const debuff = monster.attackReductionDebuff
    const now = Date.now()
    const expiresAt = Number(debuff.expiresAt) || 0
    // DEBUFF仍在有效期内
    if (expiresAt > now) {
      const reductionPercent = Number(debuff.value) || 0
      if (Number.isFinite(reductionPercent) && reductionPercent > 0) {
        randomDamage = Math.max(1, Math.floor(randomDamage * (1 - reductionPercent / 100)))
      }
    }
  }

  return Math.floor(randomDamage)
}

const calculateMonsterCritical = monster => {
  const critRate = monster?.critRate || 0
  const ratio = normalizeRateToRatio(critRate, 0)
  return Math.random() < ratio
}

const calculateMonsterMiss = monster => {
  // 基础闪避率（怪物自身的闪避属性）
  const missRate = monster?.missRate || 0
  let missRatio = normalizeRateToRatio(missRate, 0)

  // 检查命中率降低DEBUFF（夜幕降临等技能）
  // DEBUFF会降低怪物的命中率，相当于增加玩家的闪避率
  if (monster?.hitRateReductionDebuff) {
    const debuff = monster.hitRateReductionDebuff
    const now = Date.now()
    const expiresAt = Number(debuff.expiresAt) || 0

    // DEBUFF仍在有效期内
    if (expiresAt > now) {
      const debuffValue = Number(debuff.value) || 0
      const reductionRatio = normalizeRateToRatio(debuffValue, 0)
      missRatio = Math.min(1, missRatio + reductionRatio)
      // 返回DEBUFF信息用于日志
      return {
        isMiss: Math.random() < missRatio,
        debuffInfo: {
          monsterName: monster?.name,
          debuffValue,
          baseMissRate: missRate,
          finalMissRate: Math.round(missRatio * 100),
          skillName: debuff.skillName || '未知技能'
        }
      }
    }
  }

  return { isMiss: Math.random() < missRatio, debuffInfo: null }
}

const computeAutoBattleMonsterAttackBatch = payload => {
  const monsters = Array.isArray(payload?.monsters) ? payload.monsters : []
  const timestamp = Number(payload?.timestamp) || 0
  const lastAttackTimes = Array.isArray(payload?.lastAttackTimes) ? payload.lastAttackTimes : []

  const attacks = []
  const nextLastAttackTimes = new Array(monsters.length)
  const cachedAttackIntervals = new Array(monsters.length)

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i]
    const lastAttackTime = Number(lastAttackTimes[i] ?? 0) || 0
    nextLastAttackTimes[i] = lastAttackTime

    if (!monster || monster.isDefeated || Number(monster.currentHealth) <= 0) {
      cachedAttackIntervals[i] = monster?._cachedAttackInterval ?? null
      continue
    }

    // 检查怪物是否被击晕，击晕状态下无法攻击
    if (isMonsterStunnedInWorker(monster)) {
      cachedAttackIntervals[i] = monster?._cachedAttackInterval ?? null
      continue
    }

    const attackInterval = calculateMonsterAttackIntervalOnce(monster)
    cachedAttackIntervals[i] = attackInterval

    if (timestamp - lastAttackTime < attackInterval) {
      continue
    }

    const missResult = calculateMonsterMiss(monster)
    const isMiss = missResult.isMiss
    const debuffInfo = missResult.debuffInfo
    const isCritical = calculateMonsterCritical(monster)
    const baseDamage = isMiss ? 0 : calculateMonsterDamage(monster)

    attacks.push({
      monsterIndex: i,
      baseDamage,
      isCritical,
      isMiss,
      monsterIcon: monster?.icon || monster?.monsterIcon || null,
      debuffInfo // 附加DEBUFF信息用于日志
    })
    nextLastAttackTimes[i] = timestamp
  }

  return { attacks, nextLastAttackTimes, cachedAttackIntervals }
}

/**
 * 检查怪物是否处于击晕状态（Worker版本）
 * @param {Object} monster - 怪物对象
 * @returns {boolean} 是否击晕中
 */
const isMonsterStunnedInWorker = monster => {
  if (!monster || !monster.stunDebuff) {
    return false
  }
  const stunDebuff = monster.stunDebuff
  if (!stunDebuff.active) {
    return false
  }
  const now = Date.now()
  const expiresAt = Number(stunDebuff.expiresAt) || 0
  return expiresAt > now
}

self.onmessage = event => {
  const { type, payload, requestId } = event.data || {}

  try {
    if (type !== 'autoBattleMonsterAttackBatch') {
      self.postMessage({ type, requestId, error: '未知的任务类型' })
      return
    }

    const result = computeAutoBattleMonsterAttackBatch(payload || {})
    self.postMessage({ type, requestId, result })
  } catch (error) {
    self.postMessage({ type, requestId, error: error?.message || 'Worker执行失败' })
  }
}
