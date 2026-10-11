/**
 * 自动战斗技能管理类（优化版）
 * 负责技能的选择、使用和冷却管理
 * 包含增强的LRU缓存机制和细粒度缓存失效
 */
import { OptimizedLRUCache } from '@/utils/cache/OptimizedLRUCache'
import { handleAutoBattleError } from '@/errorHandler/autoBattleErrorHandler'
import { SkillUnlockChecker } from '@/utils/skillUnlockChecker'
import { SkillUtils } from '@/utils/skillUtils'
import { classAliases } from '@/utils/itemHelpers'
import { getClassCategory, getSkillActionPriority, SKILL_ACTION_TYPE } from '@/utils/autoBattleUtils'
import { useSkillBarSlotsStore } from '@/store/skillBarSlots'
import { SKILL_CONFIG } from '@/data/skills'
import { getStormArrowEffectiveCooldown } from '@/composables/useStormArrowEx'
import { getGaleRapidFireEffectiveCooldown } from '@/composables/useGaleRapidFireEx'
import { getAuraBombEffectiveCooldown } from '@/composables/useAuraBombEx'
import { getNensphereEffectiveCooldown } from '@/composables/useNensphereEx'
import { getDragonFistEffectiveCooldown } from '@/composables/useDragonFistEx'
import { getShadowRazeEffectiveCooldown } from '@/composables/useShadowRazeEx'
import { getShadowBladeEffectiveCooldown } from '@/composables/useShadowBladeEx'
import { getDeadlyPoisonEffectiveCooldown } from '@/composables/useDeadlyPoisonEx'
import { getThunderHammerEffectiveCooldown } from '@/composables/useThunderHammerEx'
import { getHolyJudgmentEffectiveCooldown } from '@/composables/useHolyJudgmentEx'
import { getAngelWrathEffectiveCooldown } from '@/composables/useAngelWrathEx'
import { getMindTearEffectiveCooldown, getConsciousnessCollapseEffectiveCooldown, getMindNovaEffectiveCooldown } from '@/composables/useMindMasterEx'
import { JOB_EVOLUTION_PATHS, JOB_TIER_CONFIG } from '@/store/jobs'

/**
 * 反向进阶映射表
 * 用于从当前职业反推进阶路径，key 为子职业，value 为父职业
 * @type {Record<string, string>}
 */
const REVERSE_EVOLUTION_MAP = (() => {
  const map = {}
  Object.entries(JOB_EVOLUTION_PATHS).forEach(([parent, children]) => {
    children.forEach(child => {
      if (!map[child]) {
        map[child] = parent
      }
    })
  })
  return map
})()

/**
 * 获取玩家职业进阶历史中的所有职业 key
 * 优先使用玩家保存的 jobHistory（解决多父职业反推错误），
 * 回退到从当前职业反推到初心者，返回有序数组
 * @param {string} currentClass - 当前职业 key
 * @param {string[]|null} playerJobHistory - 玩家保存的职业历史路径数组
 * @returns {string[]} 职业进阶路径数组（从初心者到当前职业）
 */
function getJobHistoryClassKeys (currentClass, playerJobHistory = null) {
  const currentLower = currentClass?.toLowerCase() || 'beginner'

  // 优先使用玩家保存的职业历史路径
  if (Array.isArray(playerJobHistory) && playerJobHistory.length > 0) {
    const hasCurrent = playerJobHistory.some(j => j?.toLowerCase() === currentLower)
    if (hasCurrent) {
      const path = []
      const seen = new Set()
      for (const jobKey of playerJobHistory) {
        const key = jobKey?.toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        if (JOB_TIER_CONFIG[key]) {
          path.push(key)
        }
      }
      if (path.length > 0) {
        return path
      }
    }
  }

  // 回退：从当前职业反推到初心者
  const path = []
  let current = currentLower
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    path.unshift(current)
    current = REVERSE_EVOLUTION_MAP[current]
  }
  return path
}

/**
 * 构建玩家所有进阶历史职业的技能 ID → 技能对象 映射表
 * 包含初心者到当前职业路径上的所有职业技能
 * @param {string} playerClass - 玩家当前职业 key
 * @param {string[]|null} playerJobHistory - 玩家保存的职业历史路径数组
 * @returns {Map<string, Object>} 技能 ID → 技能对象映射
 */
function buildJobHistorySkillMap (playerClass, playerJobHistory = null) {
  const map = new Map()
  const classKeys = getJobHistoryClassKeys(playerClass, playerJobHistory)
  classKeys.forEach(classKey => {
    const classSkills = SKILL_CONFIG[classKey]
    if (classSkills) {
      Object.values(classSkills).forEach(skill => {
        if (skill && skill.id) {
          map.set(skill.id, skill)
        }
      })
    }
  })
  return map
}

const isDev = import.meta.env.DEV === true
const debug = () => {}
const warn = (...args) => console.warn('[AutoBattleSkill]', ...args)

export class AutoBattleSkillManager {
  constructor () {
    this.player = null
    this.skills = []
    this.skillService = null
    this.gameData = null
    this.config = null
    this.requestWorker = null
    this.onSkillUse = null
    this.onApplySkillEffect = null
    this.onCooldownUpdate = null
    this.getCurrentTarget = null
    this.getLastAttackTime = null
    this.getAttackInterval = null
    this.getAliveMonsterCount = null
    this.isActive = false
    this.hasWarnedSkillServiceMissing = false
    this.cooldownVersion = 0
    this.isDecisionInFlight = false
    this.decisionVersion = 0
    this.lastSkillAttemptAt = 0
    this.isUsingSkill = false
    this.lastDecisionLogAt = 0
    this.workerDecisionMetrics = {
      sent: 0,
      hit: 0,
      fail: 0,
      lastLogAt: 0
    }

    const cacheSize = this.skills.length > 50 ? 200 : 100

    this.skillCache = new OptimizedLRUCache({
      maxSize: cacheSize,
      ttl: 10000,
      enableStats: true
    })

    this.lastSkillsUpdate = 0
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0
    }

    this.decisionContextByTraceId = new Map()
  }

  bumpCooldownVersion () {
    this.cooldownVersion = (this.cooldownVersion + 1) % 1000000
  }

  resolveSkillKey (skill) {
    if (!skill) {
      return null
    }
    if (skill?.key) {
      return skill.key
    }
    const incomingId = skill?.id
    if (incomingId === null || incomingId === undefined) {
      return null
    }
    const serviceSkills = Array.isArray(this.skillService?.skills) ? this.skillService.skills : []
    const incomingIdStr = String(incomingId)
    const matched = serviceSkills.find(entry => {
      const entryId = entry?.id
      if (entryId === null || entryId === undefined) {
        return false
      }
      return String(entryId) === incomingIdStr
    })
    return matched?.key || incomingId
  }

  /**
   * 解析冷却 key（全局唯一标识）
   * 优先使用 skill.id 避免不同职业间 key 冲突（如 beginner_q 和 warrior_q 都有 key='Q'）
   * @param {Object} skill - 技能对象
   * @returns {string|null} 冷却 key
   */
  resolveCooldownKey (skill) {
    if (!skill) {
      return null
    }
    return skill.id || skill.key || null
  }

  initialize (options) {
    this.player = options.player
    this.skills = options.skills || []
    this.skillService = options.skillService
    this.gameData = options.gameData
    this.config = options.config
    this.requestWorker = typeof options.requestWorker === 'function' ? options.requestWorker : null
    this.onSkillUse = options.onSkillUse
    this.onApplySkillEffect = options.onApplySkillEffect || null
    this.onCooldownUpdate = options.onCooldownUpdate
    this.getCurrentTarget =
      typeof options.getCurrentTarget === 'function' ? options.getCurrentTarget : null
    this.getLastAttackTime =
      typeof options.getLastAttackTime === 'function' ? options.getLastAttackTime : null
    this.getAttackInterval =
      typeof options.getAttackInterval === 'function' ? options.getAttackInterval : null
    this.getAliveMonsterCount =
      typeof options.getAliveMonsterCount === 'function' ? options.getAliveMonsterCount : null
    this.isActive = true
    this.hasWarnedSkillServiceMissing = false
    this.cooldownVersion = 0
    this.isDecisionInFlight = false
    this.decisionVersion = 0
    this.lastSkillAttemptAt = 0
    this.isUsingSkill = false
    this.lastDecisionLogAt = 0
    this.lastDecisionInFlightLogAt = 0
    this.lastDecisionTraceId = null
    this.decisionContextByTraceId = new Map()
    this.lastDecisionDiscardLogAt = 0
    this.lastCheckId = 0
    this.lastCheckTraceLogAt = 0
    this.incrementCacheVersion()
  }

  updateSkills (skills) {
    const oldSkills = this.skills
    this.skills = skills || []
    this.lastSkillsUpdate = Date.now()

    const changedSkills = this.findChangedSkills(oldSkills, this.skills)

    if (changedSkills.length > 0) {
      this.invalidateSkillCache(changedSkills)
      this.cacheStats.invalidations += changedSkills.length
    } else {
      this.skillCache.clear()
    }
  }

  findChangedSkills (oldSkills, newSkills) {
    if (!oldSkills || !newSkills) {
      return []
    }

    const changed = []
    const oldSkillMap = new Map()

    oldSkills.forEach(skill => {
      if (skill && skill.id) {
        oldSkillMap.set(skill.id, skill)
      }
    })

    newSkills.forEach(skill => {
      if (!skill || !skill.id) {
        return
      }

      const oldSkill = oldSkillMap.get(skill.id)
      if (!oldSkill) {
        changed.push(skill)
        return
      }

      if (this.hasSkillChanged(oldSkill, skill)) {
        changed.push(skill)
      }
    })

    return changed
  }

  hasSkillChanged (oldSkill, newSkill) {
    // 包含 proficiencyLevel 以检测熟练度等级变化
    const fields = ['level', 'proficiencyLevel', 'damage', 'manaCost', 'cooldown', 'isLocked', 'currentCooldown']
    return fields.some(field => oldSkill[field] !== newSkill[field])
  }

  invalidateSkillCache (changedSkills) {
    changedSkills.forEach(skill => {
      if (!skill || !skill.id) {
        return
      }

      const keysToDelete = [`priority_${skill.id}`, `available_${skill.id}`]

      keysToDelete.forEach(key => {
        this.skillCache.delete(key)
      })
    })
  }

  updatePlayer (player) {
    this.player = player
  }

  updateConfig (config) {
    this.config = config
  }

  incrementCacheVersion () {
    this.lastSkillsUpdate = Date.now()
  }

  checkAndUseSkills (source = 'unknown') {
    const now = Date.now()
    const autoUseSkills = this.config?.get ? this.config.get('autoUseSkills') : false
    if (!this.isActive || !this.player || !this.config || !autoUseSkills) {
      return false
    }
    if (this.player?.isAttacking) {
      return false
    }
    if (this.isUsingSkill) {
      return false
    }
    const lastAttackTime =
      typeof this.getLastAttackTime === 'function' ? Number(this.getLastAttackTime()) : 0
    const attackInterval =
      typeof this.getAttackInterval === 'function' ? Number(this.getAttackInterval()) : 0
    const lastSkillAttemptAt = Number(this.lastSkillAttemptAt ?? 0)

    if (
      Number.isFinite(attackInterval) &&
      attackInterval > 0 &&
      Number.isFinite(lastAttackTime) &&
      lastAttackTime > 0 &&
      now - lastAttackTime < attackInterval
    ) {
      return false
    }
    if (
      Number.isFinite(attackInterval) &&
      attackInterval > 0 &&
      Number.isFinite(lastSkillAttemptAt) &&
      lastSkillAttemptAt > 0 &&
      now - lastSkillAttemptAt < attackInterval
    ) {
      return false
    }

    if (!this.skillService) {
      return false
    }

    const availableSkills = this.getAvailableSkills()
    if (availableSkills.length === 0) {
      return false
    }
    this.lastSkillAttemptAt = now

    if (typeof this.requestWorker === 'function') {
      if (this.isDecisionInFlight) {
        return true
      }
      let bypassWorker = false
      const decisionTarget = typeof this.getCurrentTarget === 'function' ? this.getCurrentTarget() : null
      const decisionTargetId = decisionTarget?.id ?? null
      const decisionTargetIndex =
        Number.isInteger(decisionTarget?.index) && decisionTarget.index >= 0 ? decisionTarget.index : null
      const rawTargetElement =
        decisionTarget?.elementType ?? decisionTarget?.element ?? decisionTarget?.monster?.element ?? null
      const decisionTargetElement = this.normalizeElementType(rawTargetElement)

      const decisionContext = {
        targetId: decisionTargetId,
        targetIndex: decisionTargetIndex,
        rawTargetElement,
        targetElement: decisionTargetElement
      }
      if (decisionTarget) {
        const debuffs = decisionTarget?.resistanceDebuffs
        if (debuffs && typeof debuffs === 'object') {
          const entries = Object.entries(debuffs)
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i][1]
            const expiresAt = Number(entry?.expiresAt ?? 0) || 0
            const value = Number(entry?.value ?? 0) || 0
            if (expiresAt > now && value > 0) {
              bypassWorker = true
              break
            }
          }
        }
      }
      if (bypassWorker) {
        return this.fallbackSelectAndUseSkill(availableSkills, decisionContext)
      }
      const decisionVersion = (this.decisionVersion + 1) % 1000000
      const decisionTraceId = `${decisionVersion}_${now}`
      this.decisionVersion = decisionVersion
      this.isDecisionInFlight = true
      this.lastDecisionTraceId = decisionTraceId
      if (this.decisionContextByTraceId) {
        if (this.decisionContextByTraceId.size > 80) {
          this.decisionContextByTraceId.clear()
        }
        this.decisionContextByTraceId.set(decisionTraceId, decisionContext)
      }
      Promise.resolve()
        .then(() =>
          this.decideAndUseSkillWithWorker(availableSkills, decisionVersion, decisionTraceId, decisionContext)
        )
        .catch(error => {
          console.error('AutoBattleSkill', 'Worker技能决策失败:', error)
          this.fallbackSelectAndUseSkill(availableSkills, decisionContext)
        })
        .finally(() => {
          if (this.decisionVersion === decisionVersion) {
            this.isDecisionInFlight = false
          }
          if (this.decisionContextByTraceId) {
            this.decisionContextByTraceId.delete(decisionTraceId)
          }
        })
      return true
    }

    return this.fallbackSelectAndUseSkill(availableSkills, null)
  }

  /**
   * 获取玩家职业大类
   * @returns {string} 职业大类（CLASS_CATEGORY.MAGIC_DPS / MAGIC_SUPPORT / PHYSICAL_DPS）
   */
  getPlayerClassCategory () {
    return getClassCategory(this.player?.class)
  }

  /**
   * 安全获取存活怪物数量
   * @returns {number} 存活怪物数量，无法获取时返回 1（保守策略，按单体处理）
   */
  getAliveMonsterCountSafe () {
    if (typeof this.getAliveMonsterCount === 'function') {
      try {
        const count = Number(this.getAliveMonsterCount())
        return Number.isFinite(count) && count >= 0 ? count : 1
      } catch (error) {
        console.error('AutoBattleSkill', '获取存活怪物数量失败:', error)
      }
    }
    return 1
  }

  /**
   * 从可用技能中筛选 AOE 攻击技能
   * @param {Array} availableSkills - 可用技能列表
   * @returns {Array} AOE 攻击技能列表
   */
  filterAoeAttackSkills (availableSkills) {
    return availableSkills.filter(
      skill => this.isAttackSkill(skill) && String(skill.type || '').toLowerCase() === 'aoe'
    )
  }

  /**
   * 从可用技能中筛选单体攻击技能
   * @param {Array} availableSkills - 可用技能列表
   * @returns {Array} 单体攻击技能列表
   */
  filterSingleAttackSkills (availableSkills) {
    return availableSkills.filter(skill => {
      if (!this.isAttackSkill(skill)) {
        return false
      }
      return String(skill.type || '').toLowerCase() !== 'aoe'
    })
  }

  /**
   * 尝试释放技能，成功返回 true
   * @param {Object|null} skill - 待释放技能
   * @param {Object} decisionContext - 决策上下文
   * @returns {boolean} 是否成功释放
   */
  tryUseSkill (skill, decisionContext) {
    if (skill) {
      // 延迟到新宏任务执行，防止 useSkill 同步部分阻塞定时器回调
      // useSkill 是 async 函数，但其第一个 await 之前的同步段
      // 会执行 applySkillEffect → applyAoeEffect → runOnMainThread 的初始工作
      // 如果不延迟，这段同步工作会阻塞 drainPendingTasks 的 setTimeout 回调
      const skillRef = skill
      const ctxRef = decisionContext
      setTimeout(() => {
        this.useSkill(skillRef, ctxRef).catch(err => {
          console.error('AutoBattleSkill', '延迟技能释放失败:', err)
        })
      }, 0)
      return true
    }
    return false
  }

  /**
   * 回退技能选择与释放逻辑（基于职业大类 + 怪物数量）
   *
   * 法系输出：BUFF → 单体(1怪) / AOE(多怪)
   * 法系辅助：治疗(低血量) → BUFF → 单体(1怪) / AOE(多怪)
   * 物理输出：BUFF → DEBUFF → 单体→AOE(1怪) / AOE(多怪)
   * 没蓝时：availableSkills 为空，自动回退普通攻击
   *
   * @param {Array} availableSkills - 可用技能列表（已过滤冷却和蓝量）
   * @param {Object} decisionContext - 决策上下文
   * @returns {boolean} 是否成功释放技能
   */
  fallbackSelectAndUseSkill (availableSkills, decisionContext = null) {
    // 使用共享的职业化技能优先级决策函数，确保主页面与副本页面策略一致
    const recoveryThreshold = this.config.get('recoveryThreshold')
    const currentHealthPercent = this.player.currentHealth / this.player.maxHealth
    const classCategory = this.getPlayerClassCategory()
    const monsterCount = this.getAliveMonsterCountSafe()

    const priority = getSkillActionPriority(
      classCategory,
      monsterCount,
      currentHealthPercent,
      recoveryThreshold
      )

    // 按优先级依次尝试释放对应类型的技能
    for (const actionType of priority) {
      let selectedSkill = null

      switch (actionType) {
        case SKILL_ACTION_TYPE.HEAL:
          selectedSkill = this.findHealSkill(availableSkills)
          break
        case SKILL_ACTION_TYPE.BUFF:
          selectedSkill = this.findBuffSkill(availableSkills)
          break
        case SKILL_ACTION_TYPE.DEBUFF:
          selectedSkill = this.findDebuffSkill(availableSkills)
          break
        case SKILL_ACTION_TYPE.AOE: {
          const aoeSkills = this.filterAoeAttackSkills(availableSkills)
          selectedSkill = this.findAttackSkill(aoeSkills)
          break
        }
        case SKILL_ACTION_TYPE.SINGLE: {
          const singleSkills = this.filterSingleAttackSkills(availableSkills)
          selectedSkill = this.findAttackSkill(singleSkills)
          break
        }
        case SKILL_ACTION_TYPE.SUMMON:
          selectedSkill = this.findSummonSkill(availableSkills)
          break
        default:
          break
      }

      if (this.tryUseSkill(selectedSkill, decisionContext)) {
        return true
      }
    }

    return false
  }

  getAttackActionPriorities () {
    const raw = this.config?.get?.('attackActionPriorities')
    const allowed = ['normal', 'aoe', 'single', 'buff', 'debuff', 'summon']
    const fallback = ['buff', 'debuff', 'summon', 'aoe', 'single', 'normal']
    const input = Array.isArray(raw) ? raw.map(value => String(value)) : []
    const picked = input.filter(value => allowed.includes(value))
    const result = []

    for (const value of picked) {
      if (!result.includes(value)) {
        result.push(value)
      }
    }

    // 确保 debuff 在优先级列表中
    if (!result.includes('debuff')) {
      // 在 buff 之后插入 debuff
      const buffIndex = result.indexOf('buff')
      if (buffIndex !== -1) {
        result.splice(buffIndex + 1, 0, 'debuff')
      } else {
        // 如果没有 buff，在开头添加 debuff
        result.unshift('debuff')
      }
    }

    // 用 fallback 填充剩余项
    for (const value of fallback) {
      if (!result.includes(value)) {
        result.push(value)
      }
      if (result.length >= 5) {
        break
      }
    }

    return result.slice(0, 5)
  }
  // 构建Worker决策有效载荷
  normalizeElementType (value) {
    if (typeof value !== 'string') {
      return null
    }
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === 'none') {
      return null
    }
    return normalized === 'thunder' ? 'electricity' : normalized
  }

  resolveTargetElement () {
    if (typeof this.getCurrentTarget !== 'function') {
      return null
    }
    const target = this.getCurrentTarget()
    const raw = target?.elementType ?? target?.element ?? target?.monster?.element ?? null
    return this.normalizeElementType(raw)
  }

  /**
   * 查找克制目标的技能（包括冷却中的技能）
   * @param {string} targetElement - 目标元素类型
   * @returns {Object|null} 返回 { skill, isOnCooldown, cooldown } 或 null
   */
  findElementAdvantageSkill (targetElement) {
    if (!targetElement) {
      return null
    }

    const sourceSkills =
      Array.isArray(this.skillService?.skills) && this.skillService.skills.length > 0
        ? this.skillService.skills
        : Array.isArray(this.skills)
          ? this.skills
          : []

    if (!sourceSkills.length) {
      return null
    }

    // 找出所有克制目标的技能
    const advantageSkills = sourceSkills.filter(skill => {
      if (!skill || skill.isPassive === true) {
        return false
      }
      const skillElement = this.normalizeElementType(skill?.elementType ?? skill?.element)
      if (!skillElement) {
        return false
      }
      const advantage = this.resolveElementAdvantage(skillElement, targetElement)
      return advantage > 1
    })

    if (!advantageSkills.length) {
      return null
    }

    // 检查克制技能的冷却状态
    for (const skill of advantageSkills) {
      const cooldownKey = this.resolveCooldownKey(skill)
      const serviceCooldown =
        typeof this.skillService?.getSkillCooldown === 'function'
          ? Number(this.skillService.getSkillCooldown(cooldownKey))
          : null
      const resolvedCooldown = Number.isFinite(serviceCooldown)
        ? serviceCooldown
        : Number(skill.currentCooldown ?? 0)

      // 检查MP是否足够
      const manaCost = Number(skill.manaCost ?? 0)
      const currentMana = Number(this.player?.currentMana ?? 0)

      // 如果技能可用（不在冷却且MP足够）
      if (resolvedCooldown <= 0 && manaCost <= currentMana) {
        return { skill, isOnCooldown: false, cooldown: 0 }
      }

      // 如果技能在冷却中或MP不足，返回第一个克制技能的状态
      return {
        skill,
        isOnCooldown: resolvedCooldown > 0,
        cooldown: resolvedCooldown,
        manaInsufficient: manaCost > currentMana
      }
    }

    return null
  }

  resolveElementAdvantage (skillElement, targetElement) {
    const normalizedSkill = this.normalizeElementType(skillElement)
    const normalizedTarget = this.normalizeElementType(targetElement)
    if (!normalizedSkill || !normalizedTarget) {
      return 1
    }
    return SkillUtils.calculateElementAdvantage(normalizedSkill, normalizedTarget)
  }

  buildWorkerDecisionPayload (availableSkills, decisionTraceId = null, decisionContext = null) {
    const safeSkills = Array.isArray(availableSkills) ? availableSkills : []
    const config = this.config
    const player = this.player
    const activeBuffs = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
    const context = decisionContext && typeof decisionContext === 'object' ? decisionContext : null
    const resolvedTargetElement = context?.targetElement ?? this.resolveTargetElement()

    return {
      traceId: decisionTraceId,
      availableSkills: safeSkills.map(skill => ({
        id: skill?.id ?? null,
        key: skill?.key ?? null,
        name: skill?.name ?? null,
        icon: skill?.icon ?? null,
        type: skill?.type ?? null,
        category: skill?.category ?? null,
        level: skill?.level ?? null,
        proficiencyLevel: skill?.proficiencyLevel ?? null,
        manaCost: skill?.manaCost ?? null,
        cooldown: skill?.cooldown ?? null,
        damage: skill?.damage ?? null,
        dotDamage: skill?.dotDamage ?? null,
        healAmount: skill?.healAmount ?? null,
        power: skill?.power ?? null,
        element: skill?.elementType ?? skill?.element ?? null,
        priority: this.getSkillPriority(skill),
        // 传递 summon 子配置，Worker 据此识别召唤型技能（如神鹰降临 type='buff' 但有 summon 配置）
        summon: skill?.summon ? true : null
      })),
      player: {
        currentHealth: player?.currentHealth ?? null,
        maxHealth: player?.maxHealth ?? null,
        currentMana: player?.currentMana ?? null,
        maxMana: player?.maxMana ?? null,
        activeBuffs: activeBuffs.map(buff => ({
          duration: buff?.duration ?? null,
          source: buff?.source ?? null,
          skillId: buff?.skillId ?? null,
          skillKey: buff?.skillKey ?? null,
          icon: buff?.icon ?? null,
          type: buff?.type ?? null,
          name: buff?.name ?? null
        }))
      },
      config: {
        manaThreshold: 0,
        healthThreshold: config?.get?.('healthThreshold'),
        skillSelectionStrategy: config?.get?.('skillSelectionStrategy'),
        attackActionPriorities: this.getAttackActionPriorities()
      },
      playerClass: player?.class ?? null,
      classCategory: this.getPlayerClassCategory(),
      monsterCount: this.getAliveMonsterCountSafe(),
      targetElement: resolvedTargetElement
    }
  }

  resolveSelectedSkillFromWorkerResult (result, availableSkills) {
    if (!result || typeof result !== 'object') {
      return null
    }
    const selectedSkillId = result.selectedSkillId ?? null
    const selectedSkillKey = result.selectedSkillKey ?? null
    const skills = Array.isArray(availableSkills) ? availableSkills : []
    if (selectedSkillId !== null && selectedSkillId !== undefined) {
      const idStr = String(selectedSkillId)
      const matchedById = skills.find(skill => skill?.id !== null && skill?.id !== undefined && String(skill.id) === idStr)
      if (matchedById) {
        return matchedById
      }
    }
    if (selectedSkillKey) {
      const matchedByKey = skills.find(skill => skill?.key === selectedSkillKey)
      if (matchedByKey) {
        return matchedByKey
      }
    }
    return null
  }

  isSkillUsableNow (skill) {
    if (!skill || !this.player) {
      return false
    }
    const cooldownKey = this.resolveCooldownKey(skill)
    const serviceCooldown =
      typeof this.skillService?.getSkillCooldown === 'function'
        ? Number(this.skillService.getSkillCooldown(cooldownKey))
        : null
    const resolvedCooldown = Number.isFinite(serviceCooldown)
      ? serviceCooldown
      : Number(skill.currentCooldown ?? 0)
    if (Number.isFinite(resolvedCooldown) && resolvedCooldown > 0) {
      return false
    }
    if (Number(skill.manaCost ?? 0) > Number(this.player.currentMana ?? 0)) {
      return false
    }
    return true
  }

  async decideAndUseSkillWithWorker (
    availableSkills,
    decisionVersion,
    decisionTraceId = null,
    decisionContext = null
  ) {
    if (!this.isActive || typeof this.requestWorker !== 'function') {
      return
    }
    const metrics = this.workerDecisionMetrics || null

    try {
      if (metrics) {
        metrics.sent = (Number(metrics.sent) || 0) + 1
      }
      const context =
        decisionContext && typeof decisionContext === 'object'
          ? decisionContext
          : this.decisionContextByTraceId?.get?.(decisionTraceId) ?? null
      const payload = this.buildWorkerDecisionPayload(availableSkills, decisionTraceId, context)
      const result = await this.requestWorker('autoBattleDecision', payload, null, { urgent: true })

      if (!this.isActive || this.decisionVersion !== decisionVersion) {
        return
      }

      if (result) {
        if (metrics) {
          metrics.hit = (Number(metrics.hit) || 0) + 1
        }
      }

      const selectedSkill = this.resolveSelectedSkillFromWorkerResult(result, availableSkills)
      if (!selectedSkill) {
        return
      }
      if (!this.isActive || !this.isSkillUsableNow(selectedSkill)) {
        return
      }
      // 延迟到新宏任务执行，防止 useSkill 同步部分阻塞 Worker 消息处理
      const skillRef = selectedSkill
      const ctxRef = context
      setTimeout(() => {
        this.useSkill(skillRef, ctxRef).catch(err => {
          console.error('AutoBattleSkill', 'Worker决策后技能释放失败:', err)
        })
      }, 0)
    } catch (error) {
      if (metrics) {
        metrics.fail = (Number(metrics.fail) || 0) + 1
      }
      console.error('AutoBattleSkill', '自动战斗技能决策 Worker 失败:', error)
    }
  }

  /**
   * 获取技能栏槽位中已放置的技能 ID 集合
   * 自动战斗仅使用玩家手动拖入底部技能栏的技能
   * 使用 id 作为唯一标识（key 在不同职业间不唯一）
   * @returns {Set<string>|null} 技能 ID 集合，null 表示 Store 未初始化
   */
  getSkillBarSlotIds () {
    try {
      const slotsStore = useSkillBarSlotsStore()
      return slotsStore.activeSlotKeys
    } catch (error) {
      // Pinia 未初始化时回退为 null（不进行槽位过滤）
      return null
    }
  }

  getAvailableSkills () {
    const playerLevel = Number(this.player?.level ?? 0)
    const playerMana = Number(this.player?.currentMana ?? 0)

    // 获取技能栏槽位 ID 集合，用于过滤自动战斗可用技能
    const slotIds = this.getSkillBarSlotIds()
    const slotIdsHash = slotIds ? Array.from(slotIds).join(',') : 'null'

    const cacheKey = `availableSkills_${this.lastSkillsUpdate}_${this.cooldownVersion}_${playerLevel}_${Math.floor(playerMana)}_${slotIdsHash}`
    const cached = this.skillCache.get(cacheKey)

    if (cached !== undefined) {
      this.cacheStats.hits++
      return cached
    }

    this.cacheStats.misses++

    if (!this.skillService) {
      const empty = []
      this.skillCache.set(cacheKey, empty)
      return empty
    }

    const sourceSkills =
      Array.isArray(this.skillService?.skills) && this.skillService.skills.length > 0
        ? this.skillService.skills
        : Array.isArray(this.skills)
          ? this.skills
          : []

    if (!Array.isArray(sourceSkills) || sourceSkills.length === 0) {
      const empty = []
      this.skillCache.set(cacheKey, empty)
      return empty
    }

    // 如果技能栏槽位为空（未拖入任何技能），自动战斗不使用技能
    if (slotIds && slotIds.size === 0) {
      const empty = []
      this.skillCache.set(cacheKey, empty)
      return empty
    }

    // 补充进阶前职业的技能：sourceSkills 仅包含当前职业技能，
    // 需要从 SKILL_CONFIG 中补充技能栏中已放置但不在 sourceSkills 中的进阶前职业技能
    const enhancedSourceSkills = (() => {
      if (!slotIds || slotIds.size === 0) {
        return sourceSkills
      }
      // 已有技能的 ID 集合
      const existingIds = new Set(sourceSkills.map(s => s?.id).filter(Boolean))
      // 需要补充的技能 ID（在槽位中但不在 sourceSkills 中）
      const missingIds = Array.from(slotIds).filter(id => id && !existingIds.has(id))
      if (missingIds.length === 0) {
        return sourceSkills
      }
      // 从进阶历史职业的 SKILL_CONFIG 中查找缺失的技能
      const jobHistoryMap = buildJobHistorySkillMap(this.player?.class, this.player?.jobHistory)
      const supplemented = []
      missingIds.forEach(id => {
        const skill = jobHistoryMap.get(id)
        if (skill) {
          // 合并玩家的熟练度数据：优先从 player.skills[skillId] 查找跨职业技能条目
          // 跨职业技能以 skillId 为键存储（如 player.skills['archer_w']）
          // 回退到 player.skills[skill.key] 查找同槽位技能
          const playerSkillData = this.player?.skills?.[id] ?? this.player?.skills?.[skill.key]
          if (playerSkillData) {
            supplemented.push({
              ...skill,
              proficiencyLevel: playerSkillData.proficiencyLevel ?? playerSkillData.level ?? 1,
              level: playerSkillData.proficiencyLevel ?? playerSkillData.level ?? 1
            })
          } else {
            supplemented.push({ ...skill })
          }
        }
      })
      return supplemented.length > 0 ? [...sourceSkills, ...supplemented] : sourceSkills
    })()

    const availableSkills = enhancedSourceSkills.filter(skill => {
      if (!skill) {
        return false
      }

      // 过滤被动技能，被动技能不可主动使用
      if (skill.isPassive === true) {
        return false
      }

      // 仅使用技能栏槽位中的技能（通过 id 匹配）
      if (slotIds) {
        const skillId = skill.id
        if (!skillId || !slotIds.has(skillId)) {
          return false
        }
      }

      const isUnlocked = SkillUnlockChecker.checkSkillUnlockStatus(skill, this.player, this.gameData)
      if (!isUnlocked) {
        return false
      }

      const cooldownKey = this.resolveCooldownKey(skill)
      const serviceCooldown =
        typeof this.skillService?.getSkillCooldown === 'function'
          ? Number(this.skillService.getSkillCooldown(cooldownKey))
          : null

      const resolvedCooldown = Number.isFinite(serviceCooldown)
        ? serviceCooldown
        : Number(skill.currentCooldown ?? 0)

      if (Number.isFinite(resolvedCooldown) && resolvedCooldown > 0) {
        return false
      }

      if (skill.manaCost > this.player.currentMana) {
        return false
      }

      if (skill.unlockLevel && this.player.level < skill.unlockLevel) {
        return false
      }

      if (this.gameData && skill.requiredJob) {
        const playerJob = this.player.job || this.player.className
        if (!this.checkJobRequirement(skill.requiredJob, playerJob)) {
          return false
        }
      }

      return true
    })

    this.skillCache.set(cacheKey, availableSkills)
    return availableSkills
  }

  findHealSkill (availableSkills) {
    const healSkills = availableSkills.filter(skill => this.isHealSkill(skill))
    if (!healSkills.length) {
      return null
    }
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

  findAttackSkill (availableSkills) {
    const attackSkills = availableSkills.filter(skill => this.isAttackSkill(skill))

    if (attackSkills.length === 0) {
      return null
    }

    const targetElement = this.resolveTargetElement()
    let resolvedSkills = attackSkills

    // 优先检查元素克制，克制技能优先级最高
    if (targetElement) {
      const preferredSkills = attackSkills.filter(
        skill => this.resolveElementAdvantage(skill?.elementType ?? skill?.element, targetElement) > 1
      )
      if (preferredSkills.length) {
        resolvedSkills = preferredSkills
      }
    }

    // 如果没有克制技能，再检查抗性减益
    if (resolvedSkills === attackSkills && typeof this.getCurrentTarget === 'function') {
      const target = this.getCurrentTarget()
      const debuffs = target?.resistanceDebuffs
      if (debuffs && typeof debuffs === 'object') {
        const now = Date.now()
        let strongestDebuff = null
        let strongestValue = 0
        const entries = Object.entries(debuffs)
        for (let i = 0; i < entries.length; i++) {
          const [key, entry] = entries[i]
          const expiresAt = Number(entry?.expiresAt ?? 0) || 0
          const value = Number(entry?.value ?? 0) || 0
          if (expiresAt > now && value > strongestValue) {
            strongestValue = value
            strongestDebuff = key
          }
        }
        if (strongestDebuff) {
          const debuffSkills = attackSkills.filter(skill => {
            const elementKey = this.normalizeElementType(skill?.elementType ?? skill?.element)
            return elementKey && elementKey === strongestDebuff
          })
          if (debuffSkills.length > 0) {
            resolvedSkills = debuffSkills
          }
        }
      }
    }
    const strategy = this.config?.get?.('skillSelectionStrategy') || 'priority'
    const resolvePriority = skill => this.getSkillPriority(skill)
    const resolveDamage = skill => Number(skill.damage ?? 0)
    const resolveMana = skill => Number(skill.manaCost ?? 0)

    if (strategy === 'highestDamage') {
      resolvedSkills.sort((a, b) => {
        const damageDiff = resolveDamage(b) - resolveDamage(a)
        if (damageDiff !== 0) {
          return damageDiff
        }
        return resolvePriority(b) - resolvePriority(a)
      })
      return resolvedSkills[0]
    }

    if (strategy === 'lowestMana') {
      resolvedSkills.sort((a, b) => {
        const manaDiff = resolveMana(a) - resolveMana(b)
        if (manaDiff !== 0) {
          return manaDiff
        }
        return resolvePriority(b) - resolvePriority(a)
      })
      return resolvedSkills[0]
    }

    if (strategy === 'efficiency') {
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

  isHealSkill (skill) {
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

  isAttackSkill (skill) {
    if (!skill) {
      return false
    }

    const category = String(skill.category || '').toLowerCase()
    const type = String(skill.type || '').toLowerCase()

    if (category === 'attack' || type === 'attack') {
      return true
    }

    if (['single', 'aoe', 'dot', 'summon'].includes(type)) {
      return true
    }

    if (['buff', 'debuff', 'heal'].includes(type) || ['buff', 'debuff', 'heal'].includes(category)) {
      return false
    }

    const damage = Number(skill.damage ?? skill.dotDamage ?? 0)
    return Number.isFinite(damage) && damage > 0
  }

  isBuffSkill (skill) {
    if (!skill) {
      return false
    }

    const category = String(skill.category || '').toLowerCase()
    const type = String(skill.type || '').toLowerCase()
    // 排除召唤型技能（如神鹰降临 type='buff' 但有 summon 子配置）
    // 召唤型技能由 SUMMON 阶段处理，不应被 BUFF 阶段拦截
    if (skill.summon && typeof skill.summon === 'object') {
      return false
    }
    return category === 'buff' || type === 'buff'
  }

  /**
   * 检查技能是否为DEBUFF技能
   * @param {Object} skill - 技能对象
   * @returns {boolean} 是否为DEBUFF技能
   */
  isDebuffSkill (skill) {
    if (!skill) {
      return false
    }

    const category = String(skill.category || '').toLowerCase()
    const type = String(skill.type || '').toLowerCase()
    return category === 'debuff' || type === 'debuff'
  }

  /**
   * 从可用技能中查找召唤类型技能
   * 召唤技能优先级最高（冷却时间长、持续时间长），找到即返回
   *
   * 识别规则：
   * 1. type === 'summon'（标准召唤技能）
   * 2. skill.summon 子配置存在（如神鹰降临 type='buff' 但有 summon 配置的混合型技能）
   *
   * 额外检查：如果召唤技能的 Buff 已激活（如神鹰已在场），跳过避免重复召唤
   * @param {Array} availableSkills - 可用技能列表
   * @returns {Object|null} 选中的召唤技能，无则返回 null
   */
  findSummonSkill (availableSkills) {
    if (!Array.isArray(availableSkills) || availableSkills.length === 0) {
      return null
    }
    const summonSkills = availableSkills.filter(skill => {
      if (!skill) return false
      const type = String(skill.type || '').toLowerCase()
      // 标准 summon 类型，或有 summon 子配置的混合型技能
      const isSummonType = type === 'summon'
      const hasSummonConfig = Boolean(skill.summon && typeof skill.summon === 'object')
      if (!isSummonType && !hasSummonConfig) return false
      // 如果该技能的 Buff 已激活（如神鹰已在场），跳过避免重复召唤
      if (this.isSkillBuffActive(skill)) return false
      return true
    })
    return summonSkills.length > 0 ? summonSkills[0] : null
  }

  /**
   * 检查目标是否已经有该技能的DEBUFF效果
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标对象
   * @returns {boolean} 是否已有DEBUFF效果
   */
  isDebuffActiveOnTarget (skill, target) {
    if (!skill || !target) {
      return false
    }

    // 检查目标上的命中率降低DEBUFF（夜幕降临等）
    // 注意：存储字段名是 hitRateReductionDebuff
    const hitRateDebuff = target?.hitRateReductionDebuff
    if (hitRateDebuff && typeof hitRateDebuff === 'object') {
      const now = Date.now()
      const expiresAt = Number(hitRateDebuff.expiresAt ?? 0) || 0
      if (expiresAt > now) {
        // 检查是否是同一个技能施加的DEBUFF
        const debuffSkillId = hitRateDebuff.skillId ?? hitRateDebuff.sourceSkillId
        if (debuffSkillId && (debuffSkillId === skill.id || debuffSkillId === skill.key)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 查找可用的DEBUFF技能
   * @param {Array} availableSkills - 可用技能列表
   * @returns {Object|null} 选择的DEBUFF技能
   */
  findDebuffSkill (availableSkills) {
    const debuffSkills = availableSkills.filter(skill => this.isDebuffSkill(skill))
    if (!debuffSkills.length) {
      return null
    }

    // 获取当前目标
    const target = typeof this.getCurrentTarget === 'function' ? this.getCurrentTarget() : null

    // 过滤掉目标身上已经生效的DEBUFF技能
    const applicableDebuffSkills = debuffSkills.filter(skill => !this.isDebuffActiveOnTarget(skill, target))
    if (!applicableDebuffSkills.length) {
      return null
    }

    // 按优先级排序：技能等级高、消耗低的优先
    applicableDebuffSkills.sort((a, b) => {
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

      return this.getSkillPriority(b) - this.getSkillPriority(a)
    })

    return applicableDebuffSkills[0]
  }

  isSkillBuffActive (skill) {
    const buffs = Array.isArray(this.player?.activeBuffs) ? this.player.activeBuffs : []
    if (!buffs.length || !skill) {
      return false
    }

    const resolvedSkillKey = this.resolveSkillKey(skill)
    const resolvedSkillId = skill?.id ?? null

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

        if (entry.type === 'buff' && entry.name === skill.name && entry.icon === skill.icon) {
          return true
        }
      }

      return false
    })
  }

  findBuffSkill (availableSkills) {
    const buffSkills = availableSkills.filter(skill => this.isBuffSkill(skill))
    if (!buffSkills.length) {
      return null
    }

    const missingBuffSkills = buffSkills.filter(skill => !this.isSkillBuffActive(skill))
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

      return this.getSkillPriority(b) - this.getSkillPriority(a)
    })

    return missingBuffSkills[0]
  }

  getSkillPriority (skill) {
    const skillId = skill.id || skill.key
    const cacheKey = `priority_${skillId}`

    if (this.skillCache.has(cacheKey)) {
      return this.skillCache.get(cacheKey)
    }

    let priority = 0

    if (skill.damage) {
      priority += skill.damage * 10
    }

    if (skill.manaCost) {
      priority -= skill.manaCost * 2
    }

    if (skill.cooldown) {
      priority -= skill.cooldown
    }

    if (skill.level) {
      priority += skill.level * 5
    }

    this.skillCache.set(cacheKey, priority)
    return priority
  }

  checkJobRequirement (requiredJob, playerJob) {
    if (!requiredJob || !playerJob) {
      return true
    }

    // 使用统一的职业别名映射表
    const allowedJobs = classAliases[requiredJob.toLowerCase()] || []
    return allowedJobs.some(job => playerJob.toLowerCase().includes(job.toLowerCase()))
  }
 
  async useSkill (skill, context = null) {
    // 战斗已停止时不执行技能释放，防止 stop() 后待执行的 setTimeout 回调继续触发技能效果和音效
    if (!this.isActive) {
      return false
    }
    const startedAtMs = Date.now()
    if (!skill) {
      warn('AutoBattleSkill', '技能为空')
      return false
    }
    debug('[AutoBattleSkill]', '技能释放开始', {
      at: startedAtMs,
      skillKey: skill?.key ?? skill?.id ?? null,
      name: skill?.name ?? null,
      lastSkillAttemptAt: this.lastSkillAttemptAt ?? 0,
      isUsingSkill: this.isUsingSkill
    })
    if (isDev) {
      debug('AutoBattleSkill', '尝试释放技能', {
        skillKey: skill?.key ?? skill?.id ?? null,
        name: skill?.name ?? null,
        lastSkillAttemptAt: this.lastSkillAttemptAt ?? 0,
        isUsingSkill: this.isUsingSkill
      })
    }
    if (this.isUsingSkill) {
      debug('AutoBattleSkill', '技能释放锁定中，忽略重复调用', {
        skillKey: skill?.key ?? skill?.id ?? null,
        name: skill?.name ?? null
      })
      return false
    }

    if (!this.skillService) {
      const error = new Error('skillService未初始化')
      console.error('AutoBattleSkill', error.message)
      handleAutoBattleError(error, 'AutoBattleSkill', {
        notifyUser: true,
        stopAutoBattle: false
      })
      return false
    }

    this.isUsingSkill = true
    try {
      this.lastSkillAttemptAt = Date.now()
      const rawCooldown = Number(skill.baseCooldown ?? skill.cd ?? skill.cooldown ?? 0)
      let cooldownSeconds = rawCooldown > 1000 ? Math.ceil(rawCooldown / 1000) : rawCooldown
// 暴风箭矢EX1-CD减少被动：减少暴风箭矢技能CD 50%
if (skill.id === 'fierce_shooter_u') {
cooldownSeconds = getStormArrowEffectiveCooldown(this.player, cooldownSeconds)
}
// 狂风连射EX1-CD减少被动：减少狂风连射技能CD 50%
if (skill.id === 'fierce_shooter_i') {
cooldownSeconds = getGaleRapidFireEffectiveCooldown(this.player, cooldownSeconds)
}
// 念气能量弹EX1-CD减少被动：减少念气能量弹技能CD 50%
if (skill.id === 'combat_master_u') {
cooldownSeconds = getAuraBombEffectiveCooldown(this.player, cooldownSeconds)
}
// 龟派气功EX1-CD减少被动：减少龟派气功技能CD 50%
if (skill.id === 'combat_master_w') {
cooldownSeconds = getNensphereEffectiveCooldown(this.player, cooldownSeconds)
}

// 龙拳-破劲EX1-CD减少被动：减少龙拳-破劲技能CD 50%
if (skill.id === 'combat_master_e') {
cooldownSeconds = getDragonFistEffectiveCooldown(this.player, cooldownSeconds)
}
// 暗影突袭EX1-CD减少被动：减少暗影突袭技能CD 50%
if (skill.id === 'joker_emperor_w') {
cooldownSeconds = getShadowRazeEffectiveCooldown(this.player, cooldownSeconds)
}
// 暗影之刃EX1-CD减少被动：减少暗影之刃技能CD 50%
if (skill.id === 'joker_emperor_u') {
cooldownSeconds = getShadowBladeEffectiveCooldown(this.player, cooldownSeconds)
}
// 致命毒刃EX1-CD减少被动：减少致命毒刃技能CD 50%
if (skill.id === 'joker_emperor_e') {
cooldownSeconds = getDeadlyPoisonEffectiveCooldown(this.player, cooldownSeconds)
}
// 雷神之锤EX1-CD减少被动：减少雷神之锤技能CD 50%
if (skill.id === 'nature_messenger_t') {
cooldownSeconds = getThunderHammerEffectiveCooldown(this.player, cooldownSeconds)
}
// 圣光审判EX1-CD减少被动：减少圣光审判技能CD 50%
if (skill.id === 'nature_messenger_e') {
cooldownSeconds = getHolyJudgmentEffectiveCooldown(this.player, cooldownSeconds)
}
// 天使之怒EX1-CD减少被动：减少天使之怒技能CD 50%
if (skill.id === 'nature_messenger_u') {
cooldownSeconds = getAngelWrathEffectiveCooldown(this.player, cooldownSeconds)
}
// 星思坠寂EX1-CD减少被动：减少星思坠寂技能CD 50%
if (skill.id === 'mind_master_w') {
cooldownSeconds = getMindTearEffectiveCooldown(this.player, cooldownSeconds)
}
// 意识崩塌EX1-CD减少被动：减少意识崩塌技能CD 50%
if (skill.id === 'mind_master_e') {
cooldownSeconds = getConsciousnessCollapseEffectiveCooldown(this.player, cooldownSeconds)
}
// 万绪沉宵EX1-CD减少被动：减少万绪沉宵技能CD 50%
if (skill.id === 'mind_master_u') {
cooldownSeconds = getMindNovaEffectiveCooldown(this.player, cooldownSeconds)
}
      const skillPayload = { ...skill, cooldown: cooldownSeconds, player: this.player }
      // 使用 skill.id 做冷却 key（全局唯一），用 skill.key 做熟练度查找 key
      const cooldownKey = this.resolveCooldownKey(skill)
      const proficiencyKey = this.resolveSkillKey(skill)
      const proficiencySnapshot = isDev
        ? {
          proficiency: proficiencyKey ? this.player?.skills?.[proficiencyKey]?.proficiency ?? null : null,
          proficiencyLevel: proficiencyKey ? this.player?.skills?.[proficiencyKey]?.proficiencyLevel ?? null : null
        }
        : null
      if (!cooldownKey) {
        warn('AutoBattleSkill', '技能 key 解析失败')
        return false
      }
      const success = this.skillService.useSkill(cooldownKey, skillPayload)

      if (success) {
        this.bumpCooldownVersion()
        if (isDev) {
          try {
            debug('AutoBattleSkill', '技能释放成功(自动战斗):', {
              skillKey: cooldownKey,
              name: skill?.name ?? null,
              proficiencyBefore: proficiencySnapshot?.proficiency ?? null,
              proficiencyLevelBefore: proficiencySnapshot?.proficiencyLevel ?? null,
              proficiencyAfter: proficiencyKey ? this.player?.skills?.[proficiencyKey]?.proficiency ?? null : null,
              proficiencyLevelAfter: proficiencyKey ? this.player?.skills?.[proficiencyKey]?.proficiencyLevel ?? null : null
            })
          } catch (error) {
            console.error('AutoBattleSkill', '记录技能释放日志失败:', error)
          }
        }
        const manaCost = Number(skill.manaCost || 0)
        if (this.player) {
          // manaCost = -1 表示消耗全部MP（如背水一击）
          // manaCost = -2 表示消耗生命值而非MP（如血祭）
          if (manaCost === -1) {
            // 消耗全部MP
            this.player.currentMana = 0
          } else if (manaCost > 0) {
            // 应用MP消耗减少效果
            const mpReduction = Number(this.player.decreasedMpConsumption || 0)
            const actualManaCost = Math.max(0, Math.floor(manaCost * (1 - mpReduction)))
            this.player.currentMana = Math.max(0, (this.player.currentMana || 0) - actualManaCost)
          }

          // 检查mp_maintain BUFF：若玩家拥有「无敌魔力多」(ID:5883) 的维持MP满值BUFF，
          // 技能消耗MP后立即恢复满值，确保BUFF持续期间MP始终维持满值
          const activeBuffs = this.player.activeBuffs
          if (Array.isArray(activeBuffs) && activeBuffs.length > 0) {
            const now = Date.now()
            const hasMpMaintain = activeBuffs.some(buff => {
              if (!buff || buff.type !== 'mp_maintain') return false
              const expiresAt = Number(buff.expiresAt ?? 0)
              return expiresAt <= 0 || expiresAt > now
            })
            if (hasMpMaintain) {
              const maxMana = Number(this.player.maxMana ?? 0)
              if (maxMana > 0) {
                this.player.currentMana = maxMana
              }
            }
          }
        }

        if (this.onApplySkillEffect) {
          try {
            // 让出主线程至微任务队列，使 setSkillCooldown 触发的 Vue 响应式更新先完成渲染
            // 避免技能效果应用（applySingleEffect → calculateDamage → showDamageNumber 等）
            // 与技能冷却 UI 渲染在同一次 setTimeout 回调中堆积，导致 handler 耗时过长
            await Promise.resolve()
            // 战斗可能在让出期间停止，需重新检查
            if (!this.isActive) {
              return false
            }
            const applyResult = this.onApplySkillEffect(skill, context)
            if (applyResult && typeof applyResult.then === 'function') {
              await applyResult
            }
          } catch (error) {
            console.error('AutoBattleSkill', '应用技能效果失败:', error)
          }
        }
        if (this.onSkillUse) {
          this.onSkillUse(skill)
        }
        debug('[AutoBattleSkill]', '技能释放完成', {
          at: Date.now(),
          skillKey: cooldownKey,
          name: skill?.name ?? null,
          lastSkillAttemptAt: this.lastSkillAttemptAt ?? 0
        })
        return true
      } else {
        warn('AutoBattleSkill', `技能使用失败: ${skill.name}`)
        return false
      }
    } catch (error) {
      console.error('AutoBattleSkill', `使用技能时出错: ${skill.name}`, error)
      handleAutoBattleError(error, 'AutoBattleSkill', {
        notifyUser: true,
        stopAutoBattle: false
      })
      return false
    } finally {
      this.isUsingSkill = false
    }
  }

  updateSkillCooldowns () {
    if (!this.skillService || !this.skillService.skills) {
      return
    }

    try {
      if (typeof this.skillService.syncSkillCooldownsToUI === 'function') {
        this.skillService.syncSkillCooldownsToUI(this.skillService.skills)
      }

      if (this.onCooldownUpdate) {
        this.onCooldownUpdate(this.skillService.skills)
      }
      this.bumpCooldownVersion()
    } catch (error) {
      handleAutoBattleError(error, 'AutoBattleSkill', { notifyUser: false })
    }
  }

  getSkillCooldowns () {
    if (!this.skillService || !this.skillService.skills) {
      return []
    }

    return this.skillService.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      currentCooldown: skill.currentCooldown || 0,
      maxCooldown: skill.cooldown || 0
    }))
  }

  reset () {
    this.player = null
    this.skills = []
    this.skillService = null
    this.gameData = null
    this.isActive = false
    this.skillCache.clear()
    this.cacheStats = {
      hits: 0,
      misses: 0
    }
    this.hasWarnedSkillServiceMissing = false
    this.lastSkillAttemptAt = 0
    this.isUsingSkill = false
    this.lastDecisionLogAt = 0
    debug('AutoBattleSkill', '技能管理器已重置')
  }

  getCacheStats () {
    const cacheStats = this.skillCache.getStats()
    const total = this.cacheStats.hits + this.cacheStats.misses
    const hitRate = total > 0 ? ((this.cacheStats.hits / total) * 100).toFixed(2) : 0

    return {
      ...this.cacheStats,
      ...cacheStats,
      hitRate,
      lastSkillsUpdate: this.lastSkillsUpdate
    }
  }

  clearCache () {
    this.skillCache.clear()
    debug('AutoBattleSkill', '技能缓存已清除')
  }
}
