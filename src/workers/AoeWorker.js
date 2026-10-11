const calculateElementAdvantage = (skillElement, targetElement) => {
  if (!skillElement || !targetElement || skillElement === 'none' || targetElement === 'none') {
    return 1
  }
  const normalizedSkill = String(skillElement).toLowerCase() === 'thunder'
    ? 'electricity'
    : String(skillElement).toLowerCase()
  const normalizedTarget = String(targetElement).toLowerCase() === 'thunder'
    ? 'electricity'
    : String(targetElement).toLowerCase()

  const advantageMap = {
    fire: { wind: 1.3 },
    water: { fire: 1.3 },
    wind: { earth: 1.3 },
    earth: { electricity: 1.3 },
    electricity: { water: 1.3 }
  }

  const disadvantageMap = {
    fire: { water: 0.7 },
    water: { electricity: 0.7 },
    wind: { fire: 0.7 },
    earth: { wind: 0.7 },
    electricity: { earth: 0.7 }
  }

  if (advantageMap[normalizedSkill]?.[normalizedTarget]) {
    return advantageMap[normalizedSkill][normalizedTarget]
  }

  if (disadvantageMap[normalizedSkill]?.[normalizedTarget]) {
    return disadvantageMap[normalizedSkill][normalizedTarget]
  }

  return 1
}

const ELEMENT_CODE_BY_NAME = Object.freeze({
  none: 0,
  fire: 1,
  water: 2,
  wind: 3,
  earth: 4,
  electricity: 5
})

const toElementCode = value => {
  if (typeof value !== 'string') {
    return 0
  }
  const normalized = value.toLowerCase() === 'thunder' ? 'electricity' : value.toLowerCase()
  return Number(ELEMENT_CODE_BY_NAME[normalized] ?? 0) || 0
}

const calculateElementAdvantageByCode = (skillElementCode, targetElementCode) => {
  const safeSkill = Number(skillElementCode) || 0
  const safeTarget = Number(targetElementCode) || 0
  if (safeSkill === 0 || safeTarget === 0) {
    return 1
  }

  if (safeSkill === 1 && safeTarget === 3) {
    return 1.3
  }
  if (safeSkill === 2 && safeTarget === 1) {
    return 1.3
  }
  if (safeSkill === 3 && safeTarget === 4) {
    return 1.3
  }
  if (safeSkill === 4 && safeTarget === 5) {
    return 1.3
  }
  if (safeSkill === 5 && safeTarget === 2) {
    return 1.3
  }

  if (safeSkill === 1 && safeTarget === 2) {
    return 0.7
  }
  if (safeSkill === 2 && safeTarget === 5) {
    return 0.7
  }
  if (safeSkill === 3 && safeTarget === 1) {
    return 0.7
  }
  if (safeSkill === 4 && safeTarget === 3) {
    return 0.7
  }
  if (safeSkill === 5 && safeTarget === 4) {
    return 0.7
  }

  return 1
}

const calculateProficiencyBonus = skill => {
  if (!skill) {
    return 0
  }

  const effect = skill.proficiencyEffect || skill.proficiency?.effect
  if (!effect || typeof effect !== 'object') {
    return 0
  }

  const { base, increment } = effect
  const level = skill.level || 1

  const safeBase = Number(base)
  const safeIncrement = Number(increment)
  if (!Number.isFinite(safeBase) || !Number.isFinite(safeIncrement)) {
    return 0
  }

  const safeLevel = Number.isFinite(Number(level)) && Number(level) > 0 ? Number(level) : 1
  const baseDamage = Number(skill.damage ?? NaN)
  if (Number.isFinite(baseDamage) && baseDamage === safeBase) {
    return safeIncrement * Math.max(0, safeLevel - 1)
  }

  return safeBase + safeIncrement * Math.max(0, safeLevel - 1)
}

const buildSkillCalcPlayer = rawPlayer => {
  if (!rawPlayer || typeof rawPlayer !== 'object') {
    return null
  }

  const resolvedAttack = Number(rawPlayer.attack)
  const minAttack = Number(rawPlayer.minAttack)
  const maxAttack = Number(rawPlayer.maxAttack)
  const attack =
    Number.isFinite(resolvedAttack) && resolvedAttack > 0
      ? resolvedAttack
      : Number.isFinite(minAttack) && Number.isFinite(maxAttack)
        ? Math.floor((minAttack + maxAttack) / 2)
        : 0

  const rawStats = rawPlayer.stats && typeof rawPlayer.stats === 'object' ? rawPlayer.stats : {}
  const stats = { ...rawStats }
  const bonuses =
    rawPlayer.equipmentBonuses && typeof rawPlayer.equipmentBonuses === 'object'
      ? rawPlayer.equipmentBonuses
      : {}
  const baseStrength = Number(stats.strength ?? 0) || 0
  const baseAgility = Number(stats.agility ?? stats.dexterity ?? stats.dex ?? 0) || 0
  const baseIntelligence = Number(stats.intelligence ?? 0) || 0
  const baseConstitution = Number(stats.constitution ?? stats.stamina ?? stats.sta ?? 0) || 0

  stats.strength = baseStrength + (Number(bonuses.strength) || 0)
  stats.agility =
    baseAgility + (Number(bonuses.agility) || 0) + (Number(bonuses.dexterity) || 0)
  stats.intelligence = baseIntelligence + (Number(bonuses.intelligence) || 0)
  stats.constitution =
    baseConstitution + (Number(bonuses.constitution) || 0) + (Number(bonuses.stamina) || 0)

  if (stats.dexterity === undefined || stats.dexterity === null) {
    stats.dexterity = stats.agility
  } else {
    stats.dexterity = Number(stats.dexterity) || stats.agility
  }
  if (stats.dex === undefined || stats.dex === null) {
    stats.dex = stats.agility
  } else {
    stats.dex = Number(stats.dex) || stats.agility
  }

  return { ...rawPlayer, attack, stats }
}

const resolveTypedMonsterData = monsters => {
  if (!monsters || typeof monsters !== 'object' || Array.isArray(monsters)) {
    return null
  }
  const currentHealths = monsters.currentHealths
  const maxHealths = monsters.maxHealths
  const elementCodes = monsters.elementCodes
  const defeatedFlags = monsters.defeatedFlags
  const hasViews =
    currentHealths &&
    maxHealths &&
    elementCodes &&
    defeatedFlags &&
    typeof currentHealths.length === 'number' &&
    typeof maxHealths.length === 'number' &&
    typeof elementCodes.length === 'number' &&
    typeof defeatedFlags.length === 'number'
  if (!hasViews) {
    return null
  }
  const length = Number(currentHealths.length) || 0
  if (length <= 0) {
    return null
  }
  return {
    length,
    currentHealths,
    maxHealths,
    elementCodes,
    defeatedFlags
  }
}

const calculateAoeResult = (skill, player, monsters) => {
  const calcPlayer = buildSkillCalcPlayer(player)
  let affectedCount = 0
  const resolvedLevel = Number(skill?.level ?? 1)
  const safeLevel = Number.isFinite(resolvedLevel) && resolvedLevel > 0 ? resolvedLevel : 1
  const proficiencyBase = Number(skill?.damage ?? 0)
  const proficiencyIncrement = Number(skill?.proficiency?.effect?.increment ?? proficiencyBase ?? 0)
  const proficiencyDamage =
    proficiencyBase + proficiencyIncrement * Math.max(0, safeLevel - 1)
  const attackValue = Number(calcPlayer?.attack ?? 0) || 0
  const stats = calcPlayer?.stats && typeof calcPlayer.stats === 'object' ? calcPlayer.stats : {}
  const strength = Number(stats.strength ?? 0) || 0
  const intelligence = Number(stats.intelligence ?? 0) || 0
  const agility = Number(stats.agility ?? stats.dexterity ?? stats.dex ?? 0) || 0
  const dexterity = Number(stats.dexterity ?? stats.agility ?? 0) || 0
  const formulaId = skill?.formulaId ?? null

  // 暴击率与暴击伤害倍率：从玩家属性获取，回退至默认值
  const rawCritRate = Number(player?.criticalRate) || 0
  const critRate = rawCritRate > 0 ? rawCritRate : 0.1
  const critMultiplier = Number(player?.criticalDamage) || 1.5

  const typedMonsterData = resolveTypedMonsterData(monsters)
  const hasTypedMonsterData = Boolean(typedMonsterData)
  const skillElementCode = Number(skill?.elementCode) || toElementCode(skill?.element)

  const monsterLength = hasTypedMonsterData
    ? typedMonsterData.length
    : Array.isArray(monsters)
      ? monsters.length
      : 0

  const indices = new Int32Array(monsterLength)
  const nextHealths = new Int32Array(monsterLength)
  const damages = new Int32Array(monsterLength)
  const critFlags = new Uint8Array(monsterLength)
  for (let index = 0; index < monsterLength; index++) {
    if (hasTypedMonsterData) {
      const currentHealth = Number(typedMonsterData.currentHealths[index]) || 0
      const isDefeated = Number(typedMonsterData.defeatedFlags[index]) === 1
      if (currentHealth <= 0 || isDefeated) {
        continue
      }

      let baseDamage = Number(skill?.damage ?? 50)
      if (!Number.isFinite(baseDamage)) {
        baseDamage = 0
      }

      let usedCustomFormula = false
      if (formulaId) {
        switch (formulaId) {
        case 'warrior_r':
          baseDamage = proficiencyDamage + attackValue + strength * 3
          usedCustomFormula = true
          break
        case 'priest_r':
          baseDamage = proficiencyDamage + attackValue + strength * 3 + intelligence * 3
          usedCustomFormula = true
          break
        case 'archer_e':
          baseDamage = proficiencyDamage + attackValue + agility * 1.28
          usedCustomFormula = true
          break
        case 'blade_warrior_w':
          baseDamage = proficiencyDamage + attackValue + strength * 2
          usedCustomFormula = true
          break
        case 'element_mage_w':
          baseDamage = proficiencyDamage + attackValue + intelligence * 3
          usedCustomFormula = true
          break
        case 'storm_walker_u':
          baseDamage = proficiencyDamage + attackValue + strength * 3.18 + agility * 4.98
          usedCustomFormula = true
          break
        case 'arcane_master_w':
          baseDamage = proficiencyDamage + attackValue + intelligence * 5
          usedCustomFormula = true
          break
        case 'mind_master_q':
          baseDamage = proficiencyDamage + attackValue + intelligence * 4.5
          usedCustomFormula = true
          break
        case 'fierce_shooter_w':
          baseDamage = proficiencyDamage + attackValue + dexterity * 2
          usedCustomFormula = true
          break
        default:
          break
        }
      }

      if (!usedCustomFormula) {
        const proficiencyBonus = calculateProficiencyBonus(skill)
        const safeBonus = Number.isFinite(proficiencyBonus) ? proficiencyBonus : 0
        baseDamage += safeBonus
        if (calcPlayer?.attack) {
          baseDamage += Number(calcPlayer.attack) || 0
        }
      }

      const skillDamageBonus = Number(calcPlayer?.skillDamage ?? 0)
      if (Number.isFinite(skillDamageBonus) && skillDamageBonus !== 0) {
        baseDamage *= 1 + skillDamageBonus / 100
      }

      const monsterElementCode = Number(typedMonsterData.elementCodes[index]) || 0
      const advantageMultiplier = calculateElementAdvantageByCode(skillElementCode, monsterElementCode)
      baseDamage = Math.floor(baseDamage * advantageMultiplier)

      // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率，截断为100%
      const isCritical = Math.random() < Math.min(1, critRate)
      if (isCritical) {
        baseDamage *= critMultiplier
      }

      const finalDamage = Math.max(1, Math.floor(baseDamage))
      const nextHealth = Math.max(0, currentHealth - finalDamage)

      indices[affectedCount] = index
      nextHealths[affectedCount] = nextHealth
      damages[affectedCount] = finalDamage
      critFlags[affectedCount] = isCritical ? 1 : 0
      affectedCount++
      continue
    }

    const monster = monsters[index]
    if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
      continue
    }

    let baseDamage = Number(skill?.damage ?? 50)
    if (!Number.isFinite(baseDamage)) {
      baseDamage = 0
    }

    let usedCustomFormula = false
    if (formulaId) {
      switch (formulaId) {
      case 'warrior_r':
        baseDamage = proficiencyDamage + attackValue + strength * 3
        usedCustomFormula = true
        break
      case 'priest_r':
        baseDamage = proficiencyDamage + attackValue + strength * 3 + intelligence * 3
        usedCustomFormula = true
        break
      case 'archer_e':
        baseDamage = proficiencyDamage + attackValue + agility * 1.28
        usedCustomFormula = true
        break
      case 'blade_warrior_w':
        baseDamage = proficiencyDamage + attackValue + strength * 2
        usedCustomFormula = true
        break
      case 'element_mage_w':
        baseDamage = proficiencyDamage + attackValue + intelligence * 3
        usedCustomFormula = true
        break
      case 'storm_walker_u':
        baseDamage = proficiencyDamage + attackValue + strength * 4.5 + agility * 6
        usedCustomFormula = true
        break
      case 'arcane_master_w':
        baseDamage = proficiencyDamage + attackValue + intelligence * 5
        usedCustomFormula = true
        break
      case 'mind_master_q':
        baseDamage = proficiencyDamage + attackValue + intelligence * 4.5
        usedCustomFormula = true
        break
      case 'fierce_shooter_w':
        baseDamage = proficiencyDamage + attackValue + dexterity * 2
        usedCustomFormula = true
        break
      default:
        break
      }
    }

    if (!usedCustomFormula) {
      const proficiencyBonus = calculateProficiencyBonus(skill)
      const safeBonus = Number.isFinite(proficiencyBonus) ? proficiencyBonus : 0
      baseDamage += safeBonus
      if (calcPlayer?.attack) {
        baseDamage += Number(calcPlayer.attack) || 0
      }
    }

    const skillDamageBonus = Number(calcPlayer?.skillDamage ?? 0)
    if (Number.isFinite(skillDamageBonus) && skillDamageBonus !== 0) {
      baseDamage *= 1 + skillDamageBonus / 100
    }

    const advantageMultiplier = calculateElementAdvantage(skill.element, monster.element)
    baseDamage = Math.floor(baseDamage * advantageMultiplier)

    // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率，截断为100%
    const isCritical = Math.random() < Math.min(1, critRate)
    if (isCritical) {
      baseDamage *= critMultiplier
    }

    const finalDamage = Math.max(1, Math.floor(baseDamage))
    const nextHealth = Math.max(0, monster.currentHealth - finalDamage)

    indices[affectedCount] = index
    nextHealths[affectedCount] = nextHealth
    damages[affectedCount] = finalDamage
    critFlags[affectedCount] = isCritical ? 1 : 0
    affectedCount++
  }

  return { affectedCount, indices, nextHealths, damages, critFlags }
}

self.onmessage = event => {
  const { type, payload, requestId } = event.data || {}

  try {
    if (type !== 'aoe') {
      self.postMessage({ type, requestId, error: '未知的任务类型' })
      return
    }

    const { skill, player, monsters } = payload || {}
    const result = calculateAoeResult(skill || {}, player || {}, monsters || [])
    const transferables = []
    if (result?.indices?.buffer) {
      transferables.push(result.indices.buffer)
    }
    if (result?.nextHealths?.buffer) {
      transferables.push(result.nextHealths.buffer)
    }
    if (result?.damages?.buffer) {
      transferables.push(result.damages.buffer)
    }
    if (result?.critFlags?.buffer) {
      transferables.push(result.critFlags.buffer)
    }
    self.postMessage({ type, requestId, result }, transferables)
  } catch (error) {
    self.postMessage({ type, requestId, error: error?.message || 'Worker执行失败' })
  }
}
