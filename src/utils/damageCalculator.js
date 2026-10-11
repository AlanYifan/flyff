/**
 * 统一的伤害计算器
 * 提供玩家和怪物的伤害计算、暴击、命中等核心计算逻辑
 */

export class DamageCalculator {
  static normalizeElementKey (value) {
    if (!value) {
      return ''
    }
    const normalized = String(value).trim().toLowerCase()
    return normalized === 'thunder' ? 'electricity' : normalized
  }

  static resolveWeaponElementInfo (weapon) {
    const elemental = weapon?.elementalEnhancement || weapon?.StrengthenedAttributes?.elementalEnhancement
    const elementKeys = ['fire', 'water', 'wind', 'thunder', 'earth']
    const enhancedEntries = elementKeys
      .map(key => {
        const level = Number(elemental?.[key]?.enhancementLevel ?? 0)
        return Number.isFinite(level) && level > 0 ? { key, level } : null
      })
      .filter(Boolean)
    const resolvedEnhancement = enhancedEntries.length
      ? enhancedEntries.reduce((current, next) => (next.level > current.level ? next : current))
      : null
    const attackPercent = Number(
      resolvedEnhancement ? elemental?.[resolvedEnhancement.key]?.elementAttackPercent ?? 0 : 0
    )
    const fallbackElement = weapon?.elementType ?? weapon?.element ?? null
    const elementKey = this.normalizeElementKey(resolvedEnhancement?.key || fallbackElement)
    return {
      elementKey,
      attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0
    }
  }

  static getPlayerElementAttackPercent (player, elementKey) {
    if (!player || !elementKey) {
      return 0
    }
    const keyMap = {
      fire: 'fireAttack',
      water: 'waterAttack',
      wind: 'windAttack',
      earth: 'earthAttack',
      electricity: 'thunderAttack',
      thunder: 'thunderAttack'
    }
    const statKey = keyMap[String(elementKey || '').toLowerCase()]
    if (!statKey) {
      return 0
    }
    const raw = Number(player?.[statKey])
    return Number.isFinite(raw) ? raw : 0
  }

  static normalizeRateToRatio (value, fallback = 0) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      return fallback
    }
    if (numeric <= 0) {
      return 0
    }
    // 如果值大于1，认为是百分比形式（如 156.8 表示 156.8%）
    // 除以100转换为小数比例（如 1.568 表示 156.8%）
    // 不再限制最大值为1，允许超过100%的概率
    const ratio = numeric > 1 ? numeric / 100 : numeric
    return Math.max(0, ratio)
  }

  static normalizeCriticalDamageMultiplier (value, baseMultiplier = 1.5) {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return baseMultiplier
    }
    if (numeric > 10) {
      const ratio = numeric / 100
      if (ratio < 1) {
        return baseMultiplier + ratio
      }
      return ratio
    }
    if (numeric < 1) {
      return baseMultiplier + numeric
    }
    return numeric
  }

  static ELEMENT_ADVANTAGE_TABLE = {
    water: 'fire',
    fire: 'wind',
    wind: 'earth',
    earth: 'electricity',
    electricity: 'water'
  }

  static ELEMENT_MULTIPLIERS = {
    advantage: 1.3,
    disadvantage: 0.7,
    neutral: 1.0
  }

  static calculatePlayerDamage (player, target) {
    try {
      if (!player || !target) {
        return {
          damage: 0,
          isCritical: false,
          isMiss: true,
          elementMultiplier: 1.0
        }
      }

      // 预先计算命中判断
      const hitRate = this.calculateHitRate(player)
      const isMiss = Math.random() > hitRate

      if (isMiss) {
        return {
          damage: 0,
          isCritical: false,
          isMiss: true,
          elementMultiplier: 1.0
        }
      }

      // 快速计算基础伤害
      let damage = this.rollAttackDamage(player.minAttack, player.maxAttack)

      // 简化装备检查
      const weapon = player.equipment?.weapon
      if (weapon?.subcategory) {
        damage += this.getWeaponTypeBonus(weapon.subcategory, player)
      }

      // 简化临时属性加成
      if (player.tempStats?.attack) {
        damage += player.tempStats.attack
      }

      // 计算暴击
      const critRate = player.criticalRate ?? player.critRate
      const isCritical = this.calculateCritical(critRate)
      if (isCritical) {
        const critDamageMultiplier = this.normalizeCriticalDamageMultiplier(
          player.criticalDamage ?? player.critDamage
        )
        damage = (damage * critDamageMultiplier) >> 0 // 使用位移操作替代Math.floor
      }

      // 元素克制计算
      let elementMultiplier = 1.0
      const elementInfo = this.resolveWeaponElementInfo(weapon)
      const weaponElement = elementInfo.elementKey || null
      const targetElement = target?.elementType ?? target?.element ?? null
      if (weaponElement && targetElement) {
        elementMultiplier = this.getElementAdvantageMultiplier(weaponElement, targetElement)
        const playerElementAttack = this.getPlayerElementAttackPercent(player, weaponElement)
        const bonusAttackPercent =
          playerElementAttack > 0 ? playerElementAttack : elementInfo.attackPercent
        if (elementMultiplier > 1 && bonusAttackPercent > 0) {
          elementMultiplier += bonusAttackPercent / 100
        }
        damage = (damage * elementMultiplier) >> 0 // 使用位移操作替代Math.floor
      }

      const playerLevel = Number(player?.level) || 1
      const monsterLevel = Number(target?.level) || 1
      const levelDiff = monsterLevel - playerLevel
      if (levelDiff > 0) {
        const reduction = Math.min(levelDiff * 0.05, 0.95)
        damage = Math.max(1, Math.floor(damage * (1 - reduction)))
      } else if (levelDiff < 0) {
        const increase = Math.min(-levelDiff * 0.05, 1.0)
        damage = Math.max(1, Math.floor(damage * (1 + increase)))
      }

      // 减去防御力
      const monsterDefense = target.defense || 0
      damage = Math.max(1, damage - monsterDefense)

      // 应用碎甲DEBUFF效果（承受伤害增加）
      const armorBreakDebuff = target?.armorBreakDebuff
      if (armorBreakDebuff?.active && armorBreakDebuff?.expiresAt > Date.now()) {
        const damageIncrease = Number(armorBreakDebuff.damageIncrease ?? 0)
        if (Number.isFinite(damageIncrease) && damageIncrease > 0) {
          damage = Math.floor(damage * (1 + damageIncrease / 100))
        }
      }

      // 应用 PVE 伤害加成（增加对怪物的最终伤害）
      const pveDamage = Number(player?.pveDamage) || 0
      if (pveDamage > 0) {
        damage = Math.floor(damage * (1 + pveDamage / 100))
      }

      const finalDamage = damage

      return {
        damage: finalDamage,
        isCritical,
        isMiss: false,
        elementMultiplier
      }
    } catch (error) {
      console.error('DAMAGE_CALCULATOR', '计算玩家伤害失败:', error)
      return {
        damage: 0,
        isCritical: false,
        isMiss: true,
        elementMultiplier: 1.0
      }
    }
  }

  static calculateBaseDamage (player) {
    let damage = this.rollAttackDamage(player.value.minAttack, player.value.maxAttack)

    const equipment = player.value.equipment || {}
    const weapon = equipment.weapon

    if (weapon && weapon.subcategory) {
      damage += this.getWeaponTypeBonus(weapon.subcategory, player.value)
    }

    if (player.value.tempStats && player.value.tempStats.attack) {
      damage += player.value.tempStats.attack
    }

    return damage
  }

  static rollAttackDamage (minAttack, maxAttack) {
    const resolvedMin = Number(minAttack)
    const resolvedMax = Number(maxAttack)
    const safeMin = Number.isFinite(resolvedMin) ? resolvedMin : 0
    const safeMax = Number.isFinite(resolvedMax) ? resolvedMax : 0
    const lower = Math.min(safeMin, safeMax)
    const upper = Math.max(safeMin, safeMax)
    if (upper <= 0) {
      return 0
    }
    if (upper === lower) {
      return Math.floor(upper)
    }
    return Math.floor(lower + Math.random() * (upper - lower + 1))
  }

  static getWeaponTypeBonus (subcategory, player) {
    let bonus = 0

    switch (subcategory) {
    case 'yoyo': {
      const yoyoAttack = player.yoyoAttack || 0
      const tempYoyoAttack =
          player.tempStats && player.tempStats.yoyoAttack ? player.tempStats.yoyoAttack : 0
      bonus = yoyoAttack + tempYoyoAttack
      break
    }
    case 'bow': {
      const bowAttack = player.bowAttack || 0
      const tempBowAttack =
          player.tempStats && player.tempStats.bowAttack ? player.tempStats.bowAttack : 0
      bonus = bowAttack + tempBowAttack
      break
    }
    default:
      break
    }

    return bonus
  }

  static calculateFinalDamage (baseDamage, monster, weapon, player, isCritical) {
    let damage = baseDamage

    if (isCritical) {
      const critDamageMultiplier = this.normalizeCriticalDamageMultiplier(
        player.value.criticalDamage ?? player.value.critDamage
      )
      damage = Math.floor(damage * critDamageMultiplier)
    }

    if (weapon && monster.weakness) {
      const elementInfo = this.resolveWeaponElementInfo(weapon)
      const elementType = elementInfo.elementKey
      const weakness = Array.isArray(monster.weakness) ? monster.weakness : [monster.weakness]
      const normalizedWeakness = weakness.map(entry => this.normalizeElementKey(entry)).filter(Boolean)

      if (elementType && normalizedWeakness.includes(elementType)) {
        const playerElementAttack = this.getPlayerElementAttackPercent(player?.value, elementType)
        const bonusAttackPercent =
          playerElementAttack > 0 ? playerElementAttack : elementInfo.attackPercent
        const extraMultiplier = bonusAttackPercent > 0 ? bonusAttackPercent / 100 : 0
        damage = Math.floor(damage * (1.2 + extraMultiplier))
      }
    }

    const playerLevel = Number(player?.value?.level) || 1
    const monsterLevel = Number(monster?.level) || 1
    const levelDiff = monsterLevel - playerLevel
    if (levelDiff > 0) {
      const reduction = Math.min(levelDiff * 0.05, 0.95)
      damage = Math.max(1, Math.floor(damage * (1 - reduction)))
    } else if (levelDiff < 0) {
      const increase = Math.min(-levelDiff * 0.05, 1.0)
      damage = Math.max(1, Math.floor(damage * (1 + increase)))
    }

    const monsterDefense = monster.defense || 0
    return Math.max(1, damage - monsterDefense)
  }

  static calculateCritical (critRate = 0) {
    // criticalRate 始终以小数比例存储（如 0.5 表示 50%，1.845 表示 184.5%）
    // 不能使用 normalizeRateToRatio 转换，否则 >1.0 的值会被错误地除以100
    // 导致暴击率 184.5% 被转换为 1.85%，几乎永远不暴击
    const numeric = Number(critRate)
    const ratio = Number.isFinite(numeric) && numeric > 0 ? numeric : 0
    return Math.random() < ratio
  }

  static calculateHitRate (playerOrHitRate = 0.3) {
    // Player.hitRate 始终以小数比例存储（如 0.3 表示 30%，1.16 表示 116%）
    // 不能使用 normalizeRateToRatio 转换，否则 >1.0 的值会被错误地除以100
    // 导致命中率 116% 被转换为 1.16%，几乎每次攻击都 MISS
    if (typeof playerOrHitRate === 'object' && playerOrHitRate) {
      const resolved = 'value' in playerOrHitRate ? playerOrHitRate.value : playerOrHitRate
      const hitRate = Number(resolved?.hitRate)
      return Number.isFinite(hitRate) && hitRate > 0 ? hitRate : 0.3
    }
    const numeric = Number(playerOrHitRate)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0.3
  }

  static checkCritical (player) {
    // criticalRate 始终以小数比例存储，不能使用 normalizeRateToRatio 转换
    const critRate = player?.value?.criticalRate ?? player?.value?.critRate ?? 0
    const numeric = Number(critRate)
    const ratio = Number.isFinite(numeric) && numeric > 0 ? numeric : 0
    return Math.random() < ratio
  }

  static getElementAdvantageMultiplier (skillElement, enemyElement) {
    const normalizedSkill =
      typeof skillElement === 'string'
        ? skillElement.trim().toLowerCase() === 'thunder'
          ? 'electricity'
          : skillElement.trim().toLowerCase()
        : ''
    const normalizedEnemy =
      typeof enemyElement === 'string'
        ? enemyElement.trim().toLowerCase() === 'thunder'
          ? 'electricity'
          : enemyElement.trim().toLowerCase()
        : ''
    if (!normalizedSkill || normalizedSkill === 'none' || !normalizedEnemy || normalizedEnemy === 'none') {
      return this.ELEMENT_MULTIPLIERS.neutral
    }

    if (this.ELEMENT_ADVANTAGE_TABLE[normalizedSkill] === normalizedEnemy) {
      return this.ELEMENT_MULTIPLIERS.advantage
    }

    if (this.ELEMENT_ADVANTAGE_TABLE[normalizedEnemy] === normalizedSkill) {
      return this.ELEMENT_MULTIPLIERS.disadvantage
    }

    return this.ELEMENT_MULTIPLIERS.neutral
  }

  static calculateMonsterDamage (monster) {
    const resolvedAttack = Number(monster?.attack ?? monster?.damage)
    const resolvedMinAttack = Number(monster?.minAttack)
    const resolvedMaxAttack = Number(monster?.maxAttack)
    const hasAttackRange =
      Number.isFinite(resolvedMinAttack) && Number.isFinite(resolvedMaxAttack)
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

  static calculateMonsterCritical (monster) {
    const critRate = monster.critRate || 0
    const ratio = this.normalizeRateToRatio(critRate, 0)
    return Math.random() < ratio
  }

  static calculateMonsterMiss (monster) {
    const missRate = monster.missRate || 0
    const ratio = this.normalizeRateToRatio(missRate, 0)
    return Math.random() < ratio
  }

  static calculateMonsterAttackInterval (monster) {
    // 基础攻击间隔（不考虑缓存，因为可能有DEBUFF影响）
    let interval
    const rank = typeof monster?.rank === 'string' ? monster.rank.toLowerCase() : ''
    if (['captain', 'normal', 'material', 'small'].includes(rank)) {
      interval = 1500 + Math.random() * (3000 - 1500)
    } else if (['giant', 'boss', 'violet', 'super'].includes(rank)) {
      interval = 2000 + Math.random() * (3500 - 2000)
    } else if (monster.speed !== undefined && monster.speed !== null) {
      const speed = Math.max(0, Math.min(100, monster.speed))

      const maxInterval = 3000
      const minInterval = 800
      const speedRange = 100

      const speedFactor = speed / speedRange
      interval = maxInterval - (maxInterval - minInterval) * speedFactor
    } else if (monster.attackInterval) {
      interval = Math.max(800, Math.min(3000, monster.attackInterval))
    } else {
      interval = 2000
    }

    // 应用攻击速度减少DEBUFF
    const attackSpeedDebuff = monster?.attackSpeedDebuff
    if (attackSpeedDebuff && typeof attackSpeedDebuff === 'object') {
      const now = Date.now()
      if (attackSpeedDebuff.expiresAt > now) {
        // 攻击速度减少意味着攻击间隔增加
        // 例如：减少30%攻击速度 = 攻击间隔增加30%
        const reductionPercent = Number(attackSpeedDebuff.value) || 0
        if (reductionPercent > 0) {
          interval = interval * (1 + reductionPercent / 100)
        }
      }
    }

    return Math.round(interval)
  }

  static clearMonsterCache (monster) {
    if (monster && monster._cachedAttackInterval !== undefined) {
      delete monster._cachedAttackInterval
    }
  }
}
