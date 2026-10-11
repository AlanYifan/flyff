/**
 * 自动战斗怪物管理类
 * 负责怪物目标选择、攻击和怪物数据管理
 */
import { DamageCalculator } from '@/utils/damageCalculator'
import { AutoBattleConfig } from './AutoBattleConfig'
import {
  selectTargetByStrategy,
  calculateMonsterAttackInterval,
  clearMonsterCache
} from '@/utils/autoBattleUtils'
import { battleMutationBatcher } from './BattleMutationBatcher'

export class AutoBattleMonsterManager {
  constructor () {
    this.monsters = []
    this.player = null
    this.config = null
    this.requestWorker = null
    this.onAttack = null
    this.onMonsterDefeated = null
    this.onAllMonstersDefeated = null
    this.onMonsterAttackPlayer = null
    this.onMonsterAttack = null
    this.onPlayMonsterAttackSFX = null
    this.onPlayMonsterDamageSFX = null
    this.onPlayMonsterDeathSFX = null
    this.currentTargetIndex = null
    this.validMonstersCache = null
    this.validMonstersCacheTime = 0
    this.allMonstersDefeatedNotified = false // 防止重复触发 onAllMonstersDefeated
    this.cacheValidityDuration = 1000
    this.monsterLastAttackTimes = []
    this.monsterAttackScanIndex = 0
    this.isAttackBatchInFlight = false
    this.attackBatchVersion = 0
    this.workerAttackBatchMetrics = {
      sent: 0,
      hit: 0,
      fail: 0,
      lastLogAt: 0
    }
    this.lastTargetLogAt = 0
    this.lastTargetLogKey = null
  }

  initialize (options) {
    this.monsters = options.monsters || []
    this.player = options.player
    this.config = options.config
    this.requestWorker = typeof options.requestWorker === 'function' ? options.requestWorker : null
    this.onAttack = options.onAttack
    this.onMonsterDefeated = options.onMonsterDefeated
    this.onAllMonstersDefeated = options.onAllMonstersDefeated
    this.onMonsterAttackPlayer = options.onMonsterAttackPlayer
    this.onMonsterAttack = options.onMonsterAttack
    this.onPlayMonsterAttackSFX = options.onPlayMonsterAttackSFX
    this.onPlayMonsterDamageSFX = options.onPlayMonsterDamageSFX
    this.onPlayMonsterDeathSFX = options.onPlayMonsterDeathSFX
    this.onMonsterBerserk = options.onMonsterBerserk
    this.monsterLastAttackTimes = new Array(this.monsters.length).fill(0)
    this.isAttackBatchInFlight = false
    this.attackBatchVersion = 0
  }

  updateMonsters (newMonsters, preserveDefeatedState = true) {
    if (preserveDefeatedState && this.monsters.length > 0 && newMonsters) {
      for (let i = 0; i < Math.min(this.monsters.length, newMonsters.length); i += 1) {
        const oldMonster = this.monsters[i]
        const newMonster = newMonsters[i]

        if (oldMonster?.isDefeated && newMonster) {
          newMonster.isDefeated = true
          newMonster.currentHealth = 0
        }
      }
    }

    this.monsters.forEach(monster => {
      clearMonsterCache(monster)
    })

    this.monsters = newMonsters || []
    this.currentTargetIndex = null
    this.validMonstersCache = null
    this.validMonstersCacheTime = 0
    this.monsterLastAttackTimes = new Array(this.monsters.length).fill(0)
    this.monsterAttackScanIndex = 0
    this.isAttackBatchInFlight = false
    this.attackBatchVersion = (this.attackBatchVersion + 1) % 1000000
    // 重置标志，允许下一波触发 onAllMonstersDefeated
    this.allMonstersDefeatedNotified = false
  }

  updateConfig (config) {
    this.config = config
    this.validMonstersCache = null
    this.validMonstersCacheTime = 0
  }

  updatePlayer (player) {
    this.player = player
  }

  getValidMonsters () {
    const now = Date.now()

    if (this.validMonstersCache && now - this.validMonstersCacheTime < this.cacheValidityDuration) {
      return this.validMonstersCache
    }

    if (!this.monsters || !Array.isArray(this.monsters)) {
      this.validMonstersCache = []
      this.validMonstersCacheTime = now
      return []
    }

    const validMonsters = this.monsters.filter(monster => {
      if (!monster || !monster.id) {
        return false
      }

      if (monster.isDefeated || monster.currentHealth <= 0) {
        return false
      }

      const monsterLevel = monster.level || monster.monsterLevel || 1
      const maxLevel = this.config?.get?.('monsterMaxLevel')

      if (maxLevel !== undefined && maxLevel !== null && monsterLevel > maxLevel) {
        return false
      }

      return true
    })

    this.validMonstersCache = validMonsters
    this.validMonstersCacheTime = now

    return validMonsters
  }

  selectTarget () {
    const validMonsters = this.getValidMonsters()

    if (validMonsters.length === 0) {
      return null
    }

    const targetSelection =
      this.config?.get('targetSelection') || AutoBattleConfig.DEFAULT.targetSelection
    const target = selectTargetByStrategy(validMonsters, targetSelection)

    if (target) {
      this.currentTargetIndex = this.monsters.indexOf(target)
    }

    return target
  }

  attackTarget (
    target,
    damage,
    isCritical = false,
    isHeal = false,
    skill = null,
    isMiss = false,
    weaponIcon = null,
    monsterIcon = null,
    elementType = null,
    elementAdvantage = null,
    doubleJudgment = false,
    isOffhand = false,
    customText = null
  ) {
    if (!target) {
      return false
    }

    let targetIndex = this.monsters.indexOf(target)
    if (targetIndex === -1 && target) {
      if (Number.isInteger(target.index) && this.monsters[target.index]?.id === target.id) {
        targetIndex = target.index
      } else if (target.id) {
        targetIndex = this.monsters.findIndex(monster => monster && monster.id === target.id)
      }
    }
    if (
      targetIndex === -1 &&
      this.currentTargetIndex !== null &&
      this.monsters[this.currentTargetIndex]
    ) {
      targetIndex = this.currentTargetIndex
    }
    if (targetIndex === -1) {
      return false
    }
    if (this.onAttack) {
      this.onAttack({
        targetIndex,
        damage,
        isCritical,
        isHeal,
        skill,
        isMiss,
        weaponIcon,
        monsterIcon,
        elementType,
        elementAdvantage,
        doubleJudgment,
        isOffhand,
        customText
      })
    }

    return true
  }

  /**
   * 处理怪物被击败
   *
   * 重构要点：
   * - 不再直接写入 Vue 代理（isDefeated/isFading/isHidden 等）
   * - 通过 battleMutationBatcher 队列化死亡处理和 vitals 更新
   * - 死亡动画定时器（fadeTimer/hideTimer）由 batcher 在 flush 时统一设置
   *
   * @param {number} targetIndex - 怪物索引
   * @param {Object} monster - 怪物对象
   */
  handleMonsterDefeated (targetIndex, monster) {
    const monsterIcon = monster?.icon || monster?.monsterIcon || monster?.name
    if (this.onPlayMonsterDeathSFX) {
      this.onPlayMonsterDeathSFX(monsterIcon)
    }
    if (monster) {
      // 通过批处理器队列化死亡处理（不写 Vue 代理）
      battleMutationBatcher.queueDefeated(targetIndex, monster)
    }

    if (this.onMonsterDefeated) {
      // 通过 setTimeout(0) 调度，避免 onMonsterDefeated 触发的微任务（结算队列）在当前 RAF 帧内执行
      battleMutationBatcher.queueDeferredCallback(() => {
        if (this.onMonsterDefeated) {
          this.onMonsterDefeated(targetIndex, monster)
        }
      }, 'monsterDefeated')
    }

    this.validMonstersCache = null
    this.validMonstersCacheTime = 0

    // 使用微任务延迟检查，确保所有 onMonsterDefeated 回调都完成后再检查
    // 这样可以处理批量击败怪物的情况
    Promise.resolve().then(() => {
      // 如果已经通知过，跳过
      if (this.allMonstersDefeatedNotified) {
        return
      }
      const validMonsters = this.getValidMonsters()
      if (validMonsters.length === 0) {
        this.allMonstersDefeatedNotified = true
        if (this.onAllMonstersDefeated) {
          this.onAllMonstersDefeated()
        }
      }
    })
  }

  startMonsterAttackLoop () {
    this.monsterLastAttackTimes = new Array(this.monsters.length).fill(0)
    this.monsterAttackScanIndex = 0
    this.isAttackBatchInFlight = false
    this.attackBatchVersion = (this.attackBatchVersion + 1) % 1000000
  }

  processMonsterAttacks (timestamp) {
    if (!this.monsters || !Array.isArray(this.monsters)) {
      return
    }

    if (typeof this.requestWorker === 'function') {
      if (this.isAttackBatchInFlight) {
        return
      }
      const version = this.attackBatchVersion
      this.isAttackBatchInFlight = true
      Promise.resolve()
        .then(() => this.processMonsterAttacksWithWorker(timestamp, version))
        .catch(error => {
          console.error('AutoBattleMonster', 'Worker怪物攻击批处理失败:', error)
        })
        .finally(() => {
          if (this.attackBatchVersion === version) {
            this.isAttackBatchInFlight = false
          }
        })
      return
    }

    try {
      const hasPerf = typeof performance !== 'undefined' && typeof performance.now === 'function'
      const now = hasPerf ? () => performance.now() : () => Date.now()
      const frameBudgetMs = 4
      const deadline = now() + frameBudgetMs

      const total = this.monsters.length
      if (total <= 0) {
        return
      }
      let index = Number.isInteger(this.monsterAttackScanIndex) ? this.monsterAttackScanIndex : 0
      if (index < 0 || index >= total) {
        index = 0
      }

      let scanned = 0
      while (scanned < total && now() < deadline) {
        const monster = this.monsters[index]

        if (!monster || monster.isDefeated || monster.currentHealth <= 0) {
          index = (index + 1) % total
          scanned++
          continue
        }

        // 检查怪物是否被击晕，击晕状态下无法攻击
        if (this.isMonsterStunned(monster)) {
          index = (index + 1) % total
          scanned++
          continue
        }

        const attackInterval = this.calculateAttackInterval(monster)
        const lastAttackTime = Number(this.monsterLastAttackTimes[index] ?? 0) || 0

        if (timestamp - lastAttackTime >= attackInterval) {
          this.monsterAttackPlayer(index, monster)
          this.monsterLastAttackTimes[index] = timestamp
        }

        index = (index + 1) % total
        scanned++
      }

      this.monsterAttackScanIndex = index
    } catch (error) {
      console.error('AutoBattleMonster', '怪物攻击处理错误:', error)
      if (this.onMonsterAttackPlayer) {
        this.onMonsterAttackPlayer({ error: error.message })
      }
    }
  }

  calculateAttackInterval (monster) {
    return calculateMonsterAttackInterval(monster)
  }

  /**
   * 检查怪物是否处于击晕状态
   * @param {Object} monster - 怪物对象
   * @returns {boolean} 是否击晕中
   */
  isMonsterStunned (monster) {
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

  /**
   * 检查并触发怪物狂暴状态
   * 当怪物血量百分比低于 berserkThresholdHP 时触发狂暴
   * 狂暴后攻击力增加 berserkAttackPower 百分比
   * @param {Object} monster - 怪物对象
   * @returns {boolean} 是否触发了新的狂暴状态
   */
  checkAndTriggerBerserk (monster) {
    if (!monster) {
      return false
    }

    // 如果已经狂暴或者没有狂暴配置，跳过
    if (monster.isBerserk) {
      return false
    }

    const threshold = Number(monster.berserkThresholdHP) || 0
    if (threshold <= 0) {
      return false
    }

    const maxHealth = Number(monster.maxHealth) || 1
    const currentHealth = Number(monster.currentHealth) || 0
    const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0

    // 当血量百分比低于阈值时触发狂暴
    if (healthPercent < threshold) {
      monster.isBerserk = true
      monster.berserkActivatedAt = Date.now()

      // Vue 细粒度响应式：isBerserk 在 proxy 上设置，Vue 自动检测变化

      // 尝试触发狂暴事件回调
      if (this.onMonsterBerserk) {
        this.onMonsterBerserk(monster.index, monster)
      }

      return true
    }

    return false
  }

  /**
   * 计算怪物狂暴后的攻击力加成
   * @param {Object} monster - 怪物对象
   * @param {number} baseDamage - 基础伤害
   * @returns {number} 狂暴后的伤害
   */
  applyBerserkDamageBonus (monster, baseDamage) {
    if (!monster || !monster.isBerserk) {
      return baseDamage
    }

    const berserkPower = Number(monster.berserkAttackPower) || 0
    if (berserkPower <= 0) {
      return baseDamage
    }

    // 狂暴增伤百分比
    return Math.floor(baseDamage * (1 + berserkPower / 100))
  }

  buildMonsterAttackBatchWorkerPayload (timestamp) {
    const monsters = Array.isArray(this.monsters) ? this.monsters : []
    const lastAttackTimes = Array.isArray(this.monsterLastAttackTimes) ? this.monsterLastAttackTimes : []
    const payloadMonsters = new Array(monsters.length)
    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i]
      if (!monster || typeof monster !== 'object') {
        payloadMonsters[i] = null
        continue
      }
      payloadMonsters[i] = {
        isDefeated: Boolean(monster.isDefeated),
        currentHealth: monster.currentHealth,
        rank: monster.rank,
        speed: monster.speed,
        attackInterval: monster.attackInterval,
        attack: monster.attack,
        damage: monster.damage,
        minAttack: monster.minAttack,
        maxAttack: monster.maxAttack,
        critRate: monster.critRate,
        missRate: monster.missRate,
        icon: monster.icon,
        monsterIcon: monster.monsterIcon,
        _cachedAttackInterval: monster._cachedAttackInterval,
        stunDebuff: monster.stunDebuff || null,
        hitRateReductionDebuff: monster.hitRateReductionDebuff || null
      }
    }
    return {
      monsters: payloadMonsters,
      timestamp,
      lastAttackTimes
    }
  }

  async processMonsterAttacksWithWorker (timestamp, version) {
    if (typeof this.requestWorker !== 'function') {
      return
    }
    const metrics = this.workerAttackBatchMetrics || null
    const now = Date.now()
    const shouldLog =
      metrics && Number.isFinite(metrics.lastLogAt) && (metrics.lastLogAt === 0 || now - metrics.lastLogAt >= 2000)

    try {
      if (metrics) {
        metrics.sent = (Number(metrics.sent) || 0) + 1
      }
      if (shouldLog && metrics) {
        metrics.lastLogAt = now
      }

      const payload = this.buildMonsterAttackBatchWorkerPayload(timestamp)
      const result = await this.requestWorker('autoBattleMonsterAttackBatch', payload, null, { urgent: true })

      if (this.attackBatchVersion !== version) {
        return
      }

      const attacks = Array.isArray(result?.attacks) ? result.attacks : []
      const nextLastAttackTimes = Array.isArray(result?.nextLastAttackTimes)
        ? result.nextLastAttackTimes
        : null
      const cachedAttackIntervals = Array.isArray(result?.cachedAttackIntervals)
        ? result.cachedAttackIntervals
        : null

      if (result) {
        if (metrics) {
          metrics.hit = (Number(metrics.hit) || 0) + 1
        }
      }

      if (nextLastAttackTimes) {
        this.monsterLastAttackTimes = nextLastAttackTimes
      }
      if (cachedAttackIntervals) {
        for (let i = 0; i < Math.min(cachedAttackIntervals.length, this.monsters.length); i++) {
          const interval = Number(cachedAttackIntervals[i])
          if (!Number.isFinite(interval) || interval <= 0) {
            continue
          }
          const monster = this.monsters[i]
          if (monster && typeof monster === 'object') {
            monster._cachedAttackInterval = Math.round(interval)
          }
        }
      }

      for (let i = 0; i < attacks.length; i++) {
        const attack = attacks[i]
        const monsterIndex = Number(attack?.monsterIndex)
        if (
          !Number.isInteger(monsterIndex) ||
          monsterIndex < 0 ||
          monsterIndex >= this.monsters.length
        ) {
          continue
        }
        const monster = this.monsters[monsterIndex]

        this.monsterAttackPlayer(monsterIndex, monster, attack)
      }
    } catch (error) {
      if (metrics) {
        metrics.fail = (Number(metrics.fail) || 0) + 1
      }
      console.error('AutoBattleMonster', '自动战斗怪物攻击批处理 Worker 失败:', error)
    }
  }

  monsterAttackPlayer (monsterIndex, monster, attackData = null) {
    if (!monster || monster.isDefeated || monster.currentHealth <= 0) {
      return
    }

    // 检查并触发狂暴状态
    this.checkAndTriggerBerserk(monster)

    let damage =
      attackData && attackData.baseDamage !== undefined && attackData.baseDamage !== null
        ? Number(attackData.baseDamage)
        : DamageCalculator.calculateMonsterDamage(monster)

    // 应用狂暴增伤
    damage = this.applyBerserkDamageBonus(monster, damage)

    const isCritical =
      attackData && attackData.isCritical !== undefined && attackData.isCritical !== null
        ? Boolean(attackData.isCritical)
        : DamageCalculator.calculateMonsterCritical(monster)
    const isMiss =
      attackData && attackData.isMiss !== undefined && attackData.isMiss !== null
        ? Boolean(attackData.isMiss)
        : DamageCalculator.calculateMonsterMiss(monster)

    if (!this.player || this.player.currentHealth <= 0) {
      return
    }

    const monsterIcon = attackData?.monsterIcon || monster.icon || monster.monsterIcon
    const elementInfo = DamageCalculator.resolveWeaponElementInfo(this.player?.equipment?.weapon || null)
    const playerElement = elementInfo?.elementKey || null
    const monsterElement = monster?.elementType ?? monster?.element ?? null
    const elementAdvantage =
      playerElement && monsterElement
        ? DamageCalculator.getElementAdvantageMultiplier(playerElement, monsterElement)
        : null

    if (this.onPlayMonsterAttackSFX) {
      this.onPlayMonsterAttackSFX(monsterIcon)
    }

    if (this.onMonsterAttack) {
      this.onMonsterAttack(monsterIndex)
    }

    if (isMiss) {
      if (this.onMonsterAttackPlayer) {
        this.onMonsterAttackPlayer({
          monsterIndex,
          monster,
          damage: 0,
          isCritical: false,
          isMiss: true,
          monsterIcon,
          elementType: playerElement,
          elementAdvantage
        })
      }
      return
    }

    const resolvePlayerRate = (key, fallback = 0) => {
      const player = this.player
      if (!player || typeof player !== 'object') {
        return fallback
      }

      const directValue = player[key]
      if (directValue !== undefined && directValue !== null) {
        // blockRate 和 dodgeRate 已经是小数形式（如 1.35 表示 135%），不需要再转换
        if (key === 'blockRate' || key === 'dodgeRate') {
          return Number(directValue) || fallback
        }
        return DamageCalculator.normalizeRateToRatio(directValue, fallback)
      }

      const methodName =
        key === 'dodgeRate' ? 'calculateDodgeRate' : key === 'blockRate' ? 'calculateBlockRate' : null
      const method = methodName && typeof player[methodName] === 'function' ? player[methodName] : null
      if (method) {
        try {
          const calculatedValue = method.call(player)
          // blockRate 和 dodgeRate 已经是小数形式，不需要再转换
          if (key === 'blockRate' || key === 'dodgeRate') {
            return Number(calculatedValue) || fallback
          }
          return DamageCalculator.normalizeRateToRatio(calculatedValue, fallback)
        } catch (error) {
          console.error('AutoBattleMonster', `计算玩家${key}失败:`, error)
        }
      }

      return fallback
    }

    const applyDamageToPlayer = (incomingDamage, multiplier = 1) => {
      const resolvedIncoming = Number(incomingDamage)
      const safeIncoming = Number.isFinite(resolvedIncoming) ? resolvedIncoming : 0

      const resolvedMinDefense = Number(this.player?.minDefense)
      const resolvedMaxDefense = Number(this.player?.maxDefense)
      const safeMinDefense = Number.isFinite(resolvedMinDefense) ? resolvedMinDefense : 0
      const safeMaxDefense = Number.isFinite(resolvedMaxDefense) ? resolvedMaxDefense : 0
      const defenseAverage = Math.floor((safeMinDefense + safeMaxDefense) / 2)

      const getDefenseCapRatio = (playerLevel, monsterLevel) => {
        const p = Number(playerLevel) || 1
        const m = Number(monsterLevel) || 1
        const diff = p - m
        const base = 0.5
        if (diff <= 0) {
          return base
        }
        const bonus = Math.min(diff, 20) * 0.025
        return Math.min(0.9, base + bonus)
      }

      const defenseCapRatio = getDefenseCapRatio(this.player?.level, monster?.level)
      const maxDefenseReduction = Math.floor(safeIncoming * defenseCapRatio)
      const effectiveDefenseReduction = Math.min(defenseAverage, maxDefenseReduction)
      const rawActualDamage = Math.max(1, safeIncoming - effectiveDefenseReduction)
      let scaledDamage =
        multiplier === 1 ? rawActualDamage : Math.max(1, Math.floor(rawActualDamage * multiplier))

      // 应用 PVE 伤害减免（减少玩家受到怪物的最终伤害）
      const pveDamageReduction = Number(this.player?.pveDamageReduction) || 0
      if (pveDamageReduction > 0) {
        scaledDamage = Math.max(1, Math.floor(scaledDamage * (1 - pveDamageReduction / 100)))
      }

      // === 应用属性抗性减伤（根据怪物元素属性）===
      const monsterElement = monster?.elementType ?? monster?.element ?? null
      if (monsterElement) {
        const elementDefenseMap = {
          fire: 'fireDefense',
          water: 'waterDefense',
          wind: 'windDefense',
          earth: 'earthDefense',
          electricity: 'thunderDefense',
          thunder: 'thunderDefense'
        }
        const defenseKey = elementDefenseMap[String(monsterElement).toLowerCase()]
        if (defenseKey) {
          const elementDefensePercent = Number(this.player?.[defenseKey]) || 0
          if (elementDefensePercent > 0) {
            scaledDamage = Math.max(1, Math.floor(scaledDamage * (1 - elementDefensePercent / 100)))
          }
        }
      }

      // === 护盾吸收伤害逻辑 ===
      // 支持所有拥有 currentAbsorbDamage 的护盾BUFF（念力护盾、天使之翼EX3生命护盾等）
      if (this.player?.activeBuffs && Array.isArray(this.player.activeBuffs)) {
        for (let i = this.player.activeBuffs.length - 1; i >= 0; i--) {
          const buff = this.player.activeBuffs[i]
          // 检查是否有可用的护盾吸收量
          if (buff && buff.currentAbsorbDamage > 0) {
            // 护盾吸收伤害（可抵挡所有伤害类型）
            const absorbedDamage = Math.min(buff.currentAbsorbDamage, scaledDamage)
            buff.currentAbsorbDamage = Math.max(0, buff.currentAbsorbDamage - absorbedDamage)
            scaledDamage = Math.max(0, scaledDamage - absorbedDamage)

            // 如果护盾耗尽
            if (buff.currentAbsorbDamage <= 0) {
              // 判断是否为纯护盾BUFF（如念力护盾），纯护盾耗尽时移除整个BUFF
              const isPureShield =
                buff.skillId === 'spirit_mage_psychic_shield' ||
                buff.skillKey === '念力护盾' ||
                buff.name === '念力护盾'
              if (isPureShield) {
                this.player.activeBuffs.splice(i, 1)

                // 触发BUFF移除事件
                if (this.onBuffRemoved) {
                  this.onBuffRemoved({
                    buffId: buff.id,
                    buffName: buff.name,
                    reason: 'shield_depleted'
                  })
                }
              }
              // 非纯护盾BUFF（如天使之翼EX3生命护盾）护盾耗尽时保留BUFF其他效果，
              // 仅 currentAbsorbDamage 归零，不再吸收伤害
            }
            // 只处理第一个护盾BUFF
            break
          }
        }
      }

      // === 心灵觉醒EX1-精神护盾伤害转MP逻辑 ===
      // 心灵觉醒BUFF持续期间，受到伤害的25%优先扣除MP
      if (this.player?.activeBuffs && Array.isArray(this.player.activeBuffs) && scaledDamage > 0) {
        for (let i = 0; i < this.player.activeBuffs.length; i++) {
          const buff = this.player.activeBuffs[i]
          if (!buff || typeof buff !== 'object') {
            continue
          }
          // 检查是否是心灵觉醒BUFF且包含精神护盾效果
          const effects = buff.effects || buff.effect
          if (effects && typeof effects === 'object') {
            const mindShieldEffect = effects.mindShield
            if (mindShieldEffect !== undefined) {
              const shieldPercent = Number(
                mindShieldEffect && typeof mindShieldEffect === 'object'
                  ? mindShieldEffect.add
                  : mindShieldEffect
              ) || 0
              if (shieldPercent > 0) {
                // 计算转MP的伤害部分
                const mpDamage = Math.floor(scaledDamage * shieldPercent / 100)
                if (mpDamage > 0) {
                  const currentMana = Number(this.player.currentMana) || 0
                  const actualMpDamage = Math.min(mpDamage, currentMana)
                  // 扣除MP
                  this.player.currentMana = Math.max(0, currentMana - actualMpDamage)
                  // 剩余伤害（MP无法吸收的部分仍然扣除HP）
                  scaledDamage = Math.max(0, scaledDamage - actualMpDamage)
                }
                // 只处理第一个找到的精神护盾BUFF
                break
              }
            }
          }
        }
      }

      // === 心灵觉醒EX3-精神反射法术反弹逻辑 ===
      // 心灵觉醒BUFF持续期间，反射20%法术伤害给攻击者
      if (this.player?.activeBuffs && Array.isArray(this.player.activeBuffs) && scaledDamage > 0) {
        for (let i = 0; i < this.player.activeBuffs.length; i++) {
          const buff = this.player.activeBuffs[i]
          if (!buff || typeof buff !== 'object') {
            continue
          }
          // 检查是否是心灵觉醒BUFF且包含法术反射效果
          const effects = buff.effects || buff.effect
          if (effects && typeof effects === 'object') {
            const spellReflectEffect = effects.spellReflect
            if (spellReflectEffect !== undefined) {
              const reflectPercent = Number(
                spellReflectEffect && typeof spellReflectEffect === 'object'
                  ? spellReflectEffect.add
                  : spellReflectEffect
              ) || 0
              if (reflectPercent > 0) {
                const reflectDamage = Math.floor(scaledDamage * reflectPercent / 100)
                // 对怪物造成反射伤害
                if (reflectDamage > 0 && monster) {
                  const reflectNextHealth = Math.max(0, (monster.currentHealth || 0) - reflectDamage)
                  const reflectMaxHealth = Number(monster.maxHealth) || 0
                  const reflectHealthPct = reflectMaxHealth > 0
                    ? (reflectNextHealth / reflectMaxHealth) * 100
                    : 0

                  battleMutationBatcher.queueVitalsUpdate(monsterIndex, {
                    currentHealth: reflectNextHealth,
                    healthPercentage: reflectHealthPct
                  })

                  // 通过批处理器延迟执行反弹伤害回调
                  battleMutationBatcher.queueCallback(() => {
                    if (this.onAttack && monsterIndex !== undefined) {
                      this.onAttack({
                        targetIndex: monsterIndex,
                        damage: reflectDamage,
                        isCritical: false,
                        isHeal: false,
                        skill: { name: '精神反射', icon: '/pt/skill_icon/xinlingjuexing.png' },
                        isMiss: false,
                        weaponIcon: null,
                        monsterIcon: monster.icon,
                        elementType: null,
                        elementAdvantage: null,
                        doubleJudgment: false,
                        isReflect: true
                      })
                    }
                  }, 'spellReflect')
                }
                // 只处理第一个找到的法术反射BUFF
                break
              }
            }
          }
        }
      }

      // === 能量反弹伤害逻辑 ===
      if (this.player?.activeBuffs && Array.isArray(this.player.activeBuffs) && scaledDamage > 0) {
        for (let i = 0; i < this.player.activeBuffs.length; i++) {
          const buff = this.player.activeBuffs[i]
          // 检查是否是能量反弹BUFF
          if (
            buff &&
            (buff.skillId === 'spirit_mage_energy_reflect' ||
              buff.skillKey === '能量反弹' ||
              buff.name === '能量反弹')
          ) {
            // 计算反弹伤害
            // 从buff.effects.reflectDamage.add获取反弹比例，如果没有则从buff.value获取，最后默认50%
            let reflectPercent = 50
            if (buff.effects?.reflectDamage?.add !== undefined) {
              reflectPercent = buff.effects.reflectDamage.add
            } else if (buff.value !== undefined) {
              reflectPercent = buff.value
            } else if (buff.absorbPercent !== undefined) {
              reflectPercent = buff.absorbPercent
            }
            const reflectDamage = Math.floor(scaledDamage * reflectPercent / 100)


            // 对怪物造成反弹伤害 — 通过批处理器队列化（不写 Vue 代理）
            if (reflectDamage > 0 && monster) {
              const reflectNextHealth = Math.max(0, (monster.currentHealth || 0) - reflectDamage)
              const reflectMaxHealth = Number(monster.maxHealth) || 0
              const reflectHealthPct = reflectMaxHealth > 0
                ? (reflectNextHealth / reflectMaxHealth) * 100
                : 0

              battleMutationBatcher.queueVitalsUpdate(monsterIndex, {
                currentHealth: reflectNextHealth,
                healthPercentage: reflectHealthPct
              })

              // 通过批处理器延迟执行反弹伤害回调
              battleMutationBatcher.queueCallback(() => {
                if (this.onAttack && monsterIndex !== undefined) {
                  this.onAttack({
                    targetIndex: monsterIndex,
                    damage: reflectDamage,
                    isCritical: false,
                    isHeal: false,
                    skill: { name: '能量反弹', icon: '/pt/skill_icon/psymindblow.png' },
                    isMiss: false,
                    weaponIcon: null,
                    monsterIcon: monster.icon,
                    elementType: null,
                    elementAdvantage: null,
                    doubleJudgment: false,
                    isReflect: true
                  })
                }
              }, 'reflectDamage')
            }
            break
          }
        }
      }

      const resolvedCurrentHealth = Number(this.player?.currentHealth)
      const safeCurrentHealth = Number.isFinite(resolvedCurrentHealth) ? resolvedCurrentHealth : 0
      this.player.currentHealth = Math.max(0, safeCurrentHealth - scaledDamage)

      return scaledDamage
    }

    const dodgeRate = resolvePlayerRate('dodgeRate', 0)
    if (dodgeRate > 0 && Math.random() < dodgeRate) {
      if (this.onMonsterAttackPlayer) {
        this.onMonsterAttackPlayer({
          monsterIndex,
          monster,
          damage: 0,
          isCritical: false,
          isMiss: false,
          isDodge: true,
          isBlock: false,
          text: '闪避',
          monsterIcon,
          elementType: playerElement,
          elementAdvantage
        })
      }
      return
    }

    const blockRate = resolvePlayerRate('blockRate', 0)
    const isBlock = blockRate > 0 && Math.random() < blockRate

    let actualDamage = 0
    let resolvedIsCritical = Boolean(isCritical)
    if (isBlock) {
      resolvedIsCritical = false
      const getBlockReductionRatio = (playerLevel, monsterLevel) => {
        const p = Number(playerLevel) || 1
        const m = Number(monsterLevel) || 1
        const diff = m - p
        const base = 0.7
        if (diff > 0) {
          return Math.min(0.9, base + Math.min(diff, 20) * 0.01)
        }
        if (diff < 0) {
          return Math.max(0.5, base + diff * 0.01)
        }
        return base
      }
      const blockReduction = getBlockReductionRatio(this.player?.level, monster?.level)
      const blockMultiplier = Math.max(0.1, 1 - blockReduction)
      actualDamage = applyDamageToPlayer(damage, blockMultiplier)
    } else if (this.player && typeof this.player.takeDamage === 'function') {
      actualDamage = applyDamageToPlayer(damage, 1)
    } else if (this.player) {
      actualDamage = applyDamageToPlayer(damage, 1)
    }

    if (this.onPlayMonsterDamageSFX) {
      this.onPlayMonsterDamageSFX(monsterIcon)
    }

    if (this.onMonsterAttackPlayer) {
      const snapshotCurrentHealth = Number(this.player?.currentHealth)
      const snapshotMaxHealth = Number(this.player?.maxHealth)
      const snapshotCurrentMana = Number(this.player?.currentMana)
      const snapshotMaxMana = Number(this.player?.maxMana)

      this.onMonsterAttackPlayer({
        monsterIndex,
        monster,
        damage: actualDamage,
        isCritical: resolvedIsCritical,
        isMiss: false,
        isDodge: false,
        isBlock,
        text: isBlock ? `${actualDamage}伤害(格挡)` : null,
        monsterIcon,
        elementType: playerElement,
        elementAdvantage,
        playerSnapshot: this.player
          ? {
            currentHealth: Number.isFinite(snapshotCurrentHealth) ? snapshotCurrentHealth : undefined,
            maxHealth: Number.isFinite(snapshotMaxHealth) ? snapshotMaxHealth : undefined,
            currentMana: Number.isFinite(snapshotCurrentMana) ? snapshotCurrentMana : undefined,
            maxMana: Number.isFinite(snapshotMaxMana) ? snapshotMaxMana : undefined
          }
          : null
      })
    }

  }

  clearMonsterAttackIntervals () {
    if (Array.isArray(this.monsterLastAttackTimes)) {
      this.monsterLastAttackTimes.fill(0)
      return
    }
    this.monsterLastAttackTimes = []
  }

  getMonsterByIndex (index) {
    if (index >= 0 && index < this.monsters.length) {
      return this.monsters[index]
    }
    return null
  }

  getAliveMonsterCount () {
    return this.getValidMonsters().length
  }

  getTotalMonsterCount () {
    return this.monsters?.length || 0
  }

  reset () {
    this.clearMonsterAttackIntervals()
    this.monsters = []
    this.currentTargetIndex = null
  }
}
