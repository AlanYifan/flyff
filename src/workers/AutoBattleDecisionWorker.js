const isHealSkill = skill => {
  if (!skill) {
    return false
  }
  const category = String(skill.category || '').toLowerCase()
  const type = String(skill.type || '').toLowerCase()
  if (category === 'heal' || type === 'heal') {
    return true
  }
  const healPower = Number(skill.healAmount ?? skill.power ?? 0)
  return Number.isFinite(healPower) && healPower > 0
}

const isAttackSkill = skill => {
  if (!skill) {
    return false
  }
  const category = String(skill.category || '').toLowerCase()
  const type = String(skill.type || '').toLowerCase()
  if (category === 'attack' || type === 'attack') {
    return true
  }
  if (['single', 'aoe', 'dot'].includes(type)) {
    return true
  }
  if (['buff', 'debuff', 'heal'].includes(type) || ['buff', 'debuff', 'heal'].includes(category)) {
    return false
  }
  const damage = Number(skill.damage ?? skill.dotDamage ?? 0)
  return Number.isFinite(damage) && damage > 0
}

const isBuffSkill = skill => {
  if (!skill) {
    return false
  }
  const category = String(skill.category || '').toLowerCase()
  const type = String(skill.type || '').toLowerCase()
  // 排除召唤型技能（如神鹰降临 type='buff' 但有 summon 子配置）
  // 召唤型技能由 SUMMON 阶段处理，不应被 BUFF 阶段拦截
  if (skill?.summon) {
    return false
  }
  return category === 'buff' || type === 'buff'
}

/**
 * 检查技能是否为DEBUFF技能
 * @param {Object} skill - 技能对象
 * @returns {boolean} 是否为DEBUFF技能
 */
const isDebuffSkill = skill => {
  if (!skill) {
    return false
  }
  const category = String(skill.category || '').toLowerCase()
  const type = String(skill.type || '').toLowerCase()
  return category === 'debuff' || type === 'debuff'
}

const isSkillBuffActive = (skill, activeBuffs) => {
  const buffs = Array.isArray(activeBuffs) ? activeBuffs : []
  if (!buffs.length || !skill) {
    return false
  }
  const resolvedSkillId = skill?.id ?? null
  const resolvedSkillKey = skill?.key ?? null
  return buffs.some(entry => {
    if (!entry || typeof entry !== 'object') {
      return false
    }
    const remaining = Number(entry.duration ?? 0)
    if (Number.isFinite(remaining) && remaining > 2) {
      if (entry.source === 'skill') {
        // 优先用 skillId 匹配（全局唯一），仅当 skillId 不可用时才回退到 skillKey
        // 避免 ranger_r（自然领悟 key='R'）和 fierce_shooter_r（神鹰降临 key='R'）
        // 等跨职业同 key 技能的 buff 误判
        if (resolvedSkillId) {
          return entry.skillId === resolvedSkillId
        }
        if (resolvedSkillKey && entry.skillKey === resolvedSkillKey) {
          return true
        }
      }
      const hasSkillIcon = typeof entry.icon === 'string' && entry.icon.includes('/pt/skill_icon/')
      if (!hasSkillIcon) {
        return false
      }
      return entry.type === 'buff' && entry.name === skill.name && entry.icon === skill.icon
    }
    return false
  })
}

const normalizeElementType = value => {
  if (typeof value !== 'string') {
    return null
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'none') {
    return null
  }
  return normalized === 'thunder' ? 'electricity' : normalized
}

const resolveElementAdvantage = (skillElement, targetElement) => {
  const normalizedSkill = normalizeElementType(skillElement)
  const normalizedTarget = normalizeElementType(targetElement)
  if (!normalizedSkill || !normalizedTarget) {
    return 1
  }
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

const pickAttackSkill = (attackSkills, selectionStrategy, targetElement) => {
  const skills = Array.isArray(attackSkills) ? attackSkills : []
  if (!skills.length) {
    return null
  }

  const preferredSkills = targetElement
    ? skills.filter(skill => resolveElementAdvantage(skill?.element, targetElement) > 1)
    : []

  const resolvedSkills = preferredSkills.length ? preferredSkills : skills

  const resolveDamage = skill => Number(skill?.damage ?? 0)
  const resolveMana = skill => Number(skill?.manaCost ?? 0)
  const resolvePriority = skill =>
    Number(skill?.priority ?? 0) || Number(skill?.level ?? skill?.proficiencyLevel ?? 0)

  if (selectionStrategy === 'highestDamage') {
    resolvedSkills.sort((a, b) => {
      const damageDiff = resolveDamage(b) - resolveDamage(a)
      if (damageDiff !== 0) {
        return damageDiff
      }
      return resolvePriority(b) - resolvePriority(a)
    })
    return resolvedSkills[0]
  }

  if (selectionStrategy === 'lowestMana') {
    resolvedSkills.sort((a, b) => {
      const manaDiff = resolveMana(a) - resolveMana(b)
      if (manaDiff !== 0) {
        return manaDiff
      }
      return resolvePriority(b) - resolvePriority(a)
    })
    return resolvedSkills[0]
  }

  if (selectionStrategy === 'efficiency') {
    resolvedSkills.sort((a, b) => {
      const effA = resolveDamage(a) / (resolveMana(a) + 1)
      const effB = resolveDamage(b) / (resolveMana(b) + 1)
      const effDiff = effB - effA
      if (effDiff !== 0) {
        return effDiff
      }
      return resolvePriority(b) - resolvePriority(a)
    })
    return resolvedSkills[0]
  }

  resolvedSkills.sort((a, b) => resolvePriority(b) - resolvePriority(a))
  return resolvedSkills[0]
}

/**
 * 法系输出职业 class key 列表
 * - mage（魔导士）、element_mage（元素使者）、spirit_mage（精神使者）
 * - arcane_master（奥术师）、mind_master（心灵师）
 */
const MAGIC_DPS_CLASSES = [
  'mage', 'element_mage', 'spirit_mage', 'arcane_master', 'mind_master'
]

/**
 * 法系辅助职业 class key 列表
 * - priest（圣职者）、guardian（守护使者）
 * - nature_messenger（炽天使）、combat_master（格斗宗师）
 */
const MAGIC_SUPPORT_CLASSES = [
  'priest', 'guardian', 'nature_messenger', 'combat_master'
]

/** 职业大类常量 */
const CLASS_CATEGORY_MAGIC_DPS = 'magic_dps'
const CLASS_CATEGORY_MAGIC_SUPPORT = 'magic_support'
const CLASS_CATEGORY_PHYSICAL_DPS = 'physical_dps'

/**
 * 根据职业 key 获取职业大类
 * @param {string} classKey - 职业 key
 * @returns {string} 职业大类
 */
const getClassCategory = classKey => {
  const normalized = String(classKey || '').toLowerCase().trim()
  if (MAGIC_DPS_CLASSES.includes(normalized)) {
    return CLASS_CATEGORY_MAGIC_DPS
  }
  if (MAGIC_SUPPORT_CLASSES.includes(normalized)) {
    return CLASS_CATEGORY_MAGIC_SUPPORT
  }
  return CLASS_CATEGORY_PHYSICAL_DPS
}

/**
 * 从可用技能中查找缺失的 BUFF 技能
 * @param {Array} availableSkills - 可用技能列表
 * @param {Array} activeBuffs - 当前生效的 BUFF 列表
 * @returns {Object|null} 选择的 BUFF 技能
 */
const findMissingBuffSkill = (availableSkills, activeBuffs) => {
  const buffSkills = availableSkills.filter(isBuffSkill)
  if (!buffSkills.length) {
    return null
  }
  const missingBuffSkills = buffSkills.filter(skill => !isSkillBuffActive(skill, activeBuffs))
  if (!missingBuffSkills.length) {
    return null
  }
  missingBuffSkills.sort((a, b) => {
    const levelA = Number(a.level ?? a.proficiencyLevel ?? 0)
    const levelB = Number(b.level ?? b.proficiencyLevel ?? 0)
    if (levelB !== levelA) {
      return levelB - levelA
    }
    const costA = Number(a.manaCost ?? 0)
    const costB = Number(b.manaCost ?? 0)
    if (costA !== costB) {
      return costA - costB
    }
    const damageA = Number(a.damage ?? 0)
    const damageB = Number(b.damage ?? 0)
    return damageB - damageA
  })
  return missingBuffSkills[0]
}

/**
 * 从可用技能中查找召唤类型技能
 *
 * 识别规则：
 * 1. type === 'summon'（标准召唤技能）
 * 2. skill.summon 子配置存在（如神鹰降临 type='buff' 但有 summon 配置的混合型技能）
 *
 * 额外检查：如果召唤技能的 Buff 已激活（如神鹰已在场），跳过避免重复召唤
 * @param {Array} availableSkills - 可用技能列表
 * @param {Array} activeBuffs - 当前生效的 BUFF 列表
 * @returns {Object|null} 选中的召唤技能
 */
const findSummonSkillForWorker = (availableSkills, activeBuffs) => {
  if (!Array.isArray(availableSkills) || availableSkills.length === 0) {
    return null
  }
  const summonSkills = availableSkills.filter(skill => {
    if (!skill) return false
    const type = String(skill.type || '').toLowerCase()
    // 标准 summon 类型，或有 summon 子配置的混合型技能
    const isSummonType = type === 'summon'
    const hasSummonConfig = Boolean(skill?.summon)
    if (!isSummonType && !hasSummonConfig) return false
    // 如果该技能的 Buff 已激活（如神鹰已在场），跳过避免重复召唤
    if (isSkillBuffActive(skill, activeBuffs)) return false
    return true
  })
  return summonSkills.length > 0 ? summonSkills[0] : null
}

/**
 * 从可用技能中查找 DEBUFF 技能
 * @param {Array} availableSkills - 可用技能列表
 * @returns {Object|null} 选择的 DEBUFF 技能
 */
const findDebuffSkillForWorker = availableSkills => {
  const debuffSkills = availableSkills.filter(isDebuffSkill)
  if (!debuffSkills.length) {
    return null
  }
  debuffSkills.sort((a, b) => {
    const levelA = Number(a.level ?? a.proficiencyLevel ?? 0)
    const levelB = Number(b.level ?? b.proficiencyLevel ?? 0)
    if (levelB !== levelA) {
      return levelB - levelA
    }
    const costA = Number(a.manaCost ?? 0)
    const costB = Number(b.manaCost ?? 0)
    if (costA !== costB) {
      return costA - costB
    }
    const priorityA = Number(a.priority ?? 0)
    const priorityB = Number(b.priority ?? 0)
    return priorityB - priorityA
  })
  return debuffSkills[0]
}

/**
 * 筛选 AOE 攻击技能
 * @param {Array} availableSkills - 可用技能列表
 * @returns {Array} AOE 攻击技能列表
 */
const filterAoeSkills = availableSkills => {
  return availableSkills.filter(skill =>
    isAttackSkill(skill) && String(skill.type || '').toLowerCase() === 'aoe'
  )
}

/**
 * 筛选单体攻击技能
 * @param {Array} availableSkills - 可用技能列表
 * @returns {Array} 单体攻击技能列表
 */
const filterSingleSkills = availableSkills => {
  return availableSkills.filter(skill => {
    if (!isAttackSkill(skill)) {
      return false
    }
    return String(skill.type || '').toLowerCase() !== 'aoe'
  })
}

const logDecision = () => {}

/**
 * 自动战斗技能选择核心逻辑（基于职业大类 + 怪物数量）
 *
 * 法系输出：BUFF → 单体(1怪) / AOE(多怪)
 * 法系辅助：治疗(低血量) → BUFF → 单体(1怪) / AOE(多怪)
 * 物理输出：BUFF → DEBUFF → 单体→AOE(1怪) / AOE(多怪)
 * 没蓝时：availableSkills 为空，返回 null 触发普通攻击
 *
 * @param {Object} payload - Worker 决策载荷
 * @returns {Object|null} 选择的技能对象，null 表示使用普通攻击
 */
const selectAutoBattleSkill = payload => {
  const availableSkills = Array.isArray(payload?.availableSkills) ? payload.availableSkills : []
  if (!availableSkills.length) {
    logDecision('技能列表为空', { totalSkills: availableSkills.length })
    return null
  }

  const player = payload?.player && typeof payload.player === 'object' ? payload.player : {}
  const config = payload?.config && typeof payload.config === 'object' ? payload.config : {}
  const currentHealth = Number(player.currentHealth ?? 0)
  const maxHealth = Math.max(1, Number(player.maxHealth ?? 0))

  const healthThreshold = Number(config.healthThreshold ?? 0)
  const selectionStrategy = String(config.skillSelectionStrategy || 'priority')
  const targetElement = normalizeElementType(payload?.targetElement)

  // 从 payload 中获取职业大类和怪物数量
  // 优先使用已计算的 classCategory，回退到根据 playerClass 计算
  const rawClassCategory = String(payload?.classCategory || '').toLowerCase()
  const classCategory = rawClassCategory || getClassCategory(payload?.playerClass)
  const monsterCountRaw = Number(payload?.monsterCount)
  const monsterCount = Number.isFinite(monsterCountRaw) && monsterCountRaw >= 0 ? monsterCountRaw : 1
  const isSingleMonster = monsterCount <= 1

  const activeBuffs = Array.isArray(player.activeBuffs) ? player.activeBuffs : []

  // 1. 血量低于阈值时优先治疗（全职业通用）
  const currentHealthPercent = currentHealth / maxHealth
  if (Number.isFinite(healthThreshold) && currentHealthPercent < healthThreshold) {
    const healSkills = availableSkills.filter(isHealSkill)
    if (healSkills.length) {
      healSkills.sort((a, b) => {
        const healA = Number(a.healAmount ?? a.power ?? a.damage ?? 0)
        const healB = Number(b.healAmount ?? b.power ?? b.damage ?? 0)
        if (healB !== healA) {
          return healB - healA
        }
        const costA = Number(a.manaCost ?? 0)
        const costB = Number(b.manaCost ?? 0)
        return costA - costB
      })
      return healSkills[0]
    }
  }

  // 2. 根据职业大类和怪物数量选择技能
  if (classCategory === CLASS_CATEGORY_MAGIC_DPS) {
    // 法系输出：BUFF优先 → 召唤 → 单体/AOE
    const buffSkill = findMissingBuffSkill(availableSkills, activeBuffs)
    if (buffSkill) {
      return buffSkill
    }

    // 召唤技能优先释放以最大化持续时间（如神鹰降临）
    const summonSkill = findSummonSkillForWorker(availableSkills, activeBuffs)
    if (summonSkill) {
      return summonSkill
    }

    if (isSingleMonster) {
      const singleSkills = filterSingleSkills(availableSkills)
      const selected = pickAttackSkill(singleSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
    } else {
      const aoeSkills = filterAoeSkills(availableSkills)
      const selected = pickAttackSkill(aoeSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
      // AOE 冷却中时回退单体
      const singleSkills = filterSingleSkills(availableSkills)
      const fallback = pickAttackSkill(singleSkills, selectionStrategy, targetElement)
      if (fallback) {
        return fallback
      }
    }
  } else if (classCategory === CLASS_CATEGORY_MAGIC_SUPPORT) {
    // 法系辅助：治疗（已在上方检查）→ BUFF → 召唤 → 单体/AOE
    const buffSkill = findMissingBuffSkill(availableSkills, activeBuffs)
    if (buffSkill) {
      return buffSkill
    }

    // 召唤技能优先释放以最大化持续时间
    const summonSkill = findSummonSkillForWorker(availableSkills, activeBuffs)
    if (summonSkill) {
      return summonSkill
    }

    if (isSingleMonster) {
      const singleSkills = filterSingleSkills(availableSkills)
      const selected = pickAttackSkill(singleSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
    } else {
      const aoeSkills = filterAoeSkills(availableSkills)
      const selected = pickAttackSkill(aoeSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
      // AOE 冷却中时回退单体
      const singleSkills = filterSingleSkills(availableSkills)
      const fallback = pickAttackSkill(singleSkills, selectionStrategy, targetElement)
      if (fallback) {
        return fallback
      }
    }
  } else {
    // 物理输出：BUFF优先 → DEBUFF → 召唤 → 单怪释放单体→AOE / 多怪释放AOE
    const buffSkill = findMissingBuffSkill(availableSkills, activeBuffs)
    if (buffSkill) {
      return buffSkill
    }

    const debuffSkill = findDebuffSkillForWorker(availableSkills)
    if (debuffSkill) {
      return debuffSkill
    }

    // 召唤技能在增益和减益后释放，以最大化召唤物输出（如神鹰降临）
    const summonSkill = findSummonSkillForWorker(availableSkills, activeBuffs)
    if (summonSkill) {
      return summonSkill
    }

    if (isSingleMonster) {
      // 怪物数量=1时，优先单体技能，没有单体或冷却中则回退AOE，最终回退普攻
      const singleSkills = filterSingleSkills(availableSkills)
      const selected = pickAttackSkill(singleSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
      // 没有单体技能或单体技能在冷却时，回退使用AOE技能
      const aoeSkills = filterAoeSkills(availableSkills)
      const aoeFallback = pickAttackSkill(aoeSkills, selectionStrategy, targetElement)
      if (aoeFallback) {
        return aoeFallback
      }
    } else {
      // 怪物数量>1时，释放AOE技能
      const aoeSkills = filterAoeSkills(availableSkills)
      const selected = pickAttackSkill(aoeSkills, selectionStrategy, targetElement)
      if (selected) {
        return selected
      }
    }
  }

  return null
}

self.onmessage = event => {
  const { type, payload, requestId } = event.data || {}

  try {
    if (type !== 'autoBattleDecision') {
      self.postMessage({ type, requestId, error: '未知的任务类型' })
      return
    }

    const selected = selectAutoBattleSkill(payload || {})
    const result = selected
      ? {
        selectedSkillId: selected?.id ?? null,
        selectedSkillKey: selected?.key ?? null
      }
      : null
    self.postMessage({ type, requestId, result })
  } catch (error) {
    console.error('[AutoBattleDecisionWorker]', '决策执行失败:', error)
    self.postMessage({ type, requestId, error: error?.message || 'Worker执行失败' })
  }
}
