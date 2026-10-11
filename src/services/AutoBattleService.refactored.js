/**
 * 自动战斗服务类（重构版）
 * 使用子服务模块化设计，提高可维护性和性能
 */
import { AutoBattleConfig } from './autoBattle/AutoBattleConfig'
import { AutoBattleTimerManager } from './autoBattle/AutoBattleTimerManager'
import { AutoBattleSkillManager } from './autoBattle/AutoBattleSkillManager'
import { AutoBattleMonsterManager } from './autoBattle/AutoBattleMonsterManager'
import { DamageCalculator } from '@/utils/damageCalculator'
import { calculateAttackInterval, isCasterClass } from '@/utils/autoBattleUtils'
import { SkillEffectService } from '@/services/SkillEffectService'
import autoBattleErrorHandler from '@/errorHandler/autoBattleErrorHandler'
import { dotTickScheduler } from '@/services/autoBattle/DotTickScheduler'
import { battlePerfMonitor } from '@/utils/performanceMonitor'
import { applyLifeSteal } from '@/utils/lifeStealHelper'
import { getSkill, isSkillUnlocked } from '@/data/skills'
import { useSkillsStore } from '@/store/skills'
import { useMonstersStore } from '@/store/monsters'
import { battleMutationBatcher } from './autoBattle/BattleMutationBatcher'
import {
  canTriggerOffhandAttack,
  getOffhandWeapon,
  getOffhandAttackChance,
  getOffhandAttackBonus,
  OFFHAND_ATTRIBUTE_RATIO
} from '@/composables/useDualWield'
import { applyWeaponDamageFormula } from '@/utils/gameTools'
import { rollOffhandMasteryEx3Multiplier } from '@/composables/useWeaponMastery'
import { trackMasteryAttack } from '@/composables/useMasteryProficiency'
import { processDragonForceOnAttack, isDragonForceUnlocked } from '@/composables/useDragonForce'
import { processShadowGrudgeOnAttack, isShadowGrudgeUnlocked } from '@/composables/useShadowGrudge'
import { processHolyAccumulationOnAttack, processHolyAccumulationOnSkillCast, isHolyAccumulationUnlocked } from '@/composables/useHolyAccumulation'
import { processWindAccumulationOnAttack, processWindAccumulationOnSkillCast, isWindAccumulationUnlocked } from '@/composables/useWindAccumulation'
import {
  getArmorBreakEx3DoubleJudgmentMultiplier,
  processJudgmentAccumulationOnAttack,
  processJudgmentAccumulationOnSkillCast,
  isJudgmentAccumulationUnlocked
} from '@/composables/useHolyKnightEx'
import { processArcaneChargeOnAttack, processArcaneChargeOnSkillCast, isArcaneChargeUnlocked } from '@/composables/useArcaneMasterEx'
import { processMindChargeOnAttack, processMindChargeOnSkillCast, isMindChargeUnlocked } from '@/composables/useMindMasterEx'

const isDev = import.meta.env.DEV === true
const debug = () => {}
const warn = () => {}


class AutoBattleService {
  constructor () {
    this.config = new AutoBattleConfig()
    this.timerManager = new AutoBattleTimerManager()
    this.skillManager = new AutoBattleSkillManager()
    this.monsterManager = new AutoBattleMonsterManager()

    this.player = null
    this.gameData = null
    this.skillService = null

    this.lastAttackTime = 0
    this.hasNotifiedAllMonstersDefeated = false

    this.onAttack = null
    this.onSkillUse = null
    this.onLog = null
    this.onPlayerDeath = null
    this.onPlayerDamage = null
    this.onPlayerHeal = null
    this.onMonsterDefeated = null
    this.onAllMonstersDefeated = null
    this.onUseItem = null
    this.onRefreshMonsters = null
    this.onCooldownUpdate = null
    this.onMonsterAttack = null
    this.onPaused = null
    this.onResumed = null
    this.audioService = null
    this.skillEffectService = null
    this.traceContext = null
    this.lastLoopLogAt = 0
    this.audioThrottle = {
      lastAttackSfxTime: 0,
      lastPlayerDamageSfxTime: 0,
      lastMonsterAttackSfxTime: new Map(),
      lastMonsterDamageSfxTime: new Map(),
      lastMonsterDeathSfxTime: new Map()
    }
    // 音效节流时间间隔（单位毫秒）
    this.audioThrottleIntervals = {
      attackSfx: 200,
      playerDamageSfx: 120,
      monsterAttackSfx: 220,
      monsterDamageSfx: 220,
      monsterDeathSfx: 220
    }

    this.cachedAttackInterval = this.config.get('baseAttackInterval')
    this.cachedAttackSpeed = null
    this.cachedBaseAttackInterval = null

    this.pendingMonsterDefeatedEvents = []
    this.monsterDefeatedFlushScheduled = false

    this.setupTimerCallbacks()
  }

  queueMonsterDefeated (targetIndex, monster) {
    const resolvedIndex = typeof targetIndex === 'number' ? targetIndex : Number(targetIndex)
    if (!Number.isInteger(resolvedIndex) || resolvedIndex < 0) {
      return
    }

    this.pendingMonsterDefeatedEvents.push({ targetIndex: resolvedIndex, monster })
    if (this.monsterDefeatedFlushScheduled) {
      return
    }

    this.monsterDefeatedFlushScheduled = true
    const runner = () => this.flushMonsterDefeatedEvents()
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(runner)
      return
    }
    Promise.resolve().then(runner)
  }

  flushMonsterDefeatedEvents () {
    this.monsterDefeatedFlushScheduled = false
    const batch = this.pendingMonsterDefeatedEvents
    this.pendingMonsterDefeatedEvents = []
    if (!Array.isArray(batch) || batch.length === 0) {
      return
    }

    try {
      if (this.onMonsterDefeated) {
        this.onMonsterDefeated({ batch })
      }
    } catch (error) {
      console.error('AutoBattleService', '处理批量怪物死亡事件失败:', error)
    }
  }

  clearMonsterDefeatedEvents () {
    this.monsterDefeatedFlushScheduled = false
    this.pendingMonsterDefeatedEvents = []
  }

  setTraceContext (payload) {
    if (!payload || typeof payload !== 'object') {
      this.traceContext = null
      return
    }
    const traceId = typeof payload.traceId === 'string' && payload.traceId ? payload.traceId : null
    const source = typeof payload.source === 'string' && payload.source ? payload.source : null
    const seq = typeof payload.seq === 'number' ? payload.seq : null
    this.traceContext = { traceId, source, seq }
  }

  ensureSkillEffectService () {
    if (!this.skillEffectService) {
      this.skillEffectService = new SkillEffectService(this.audioService)
      // 同步当前战斗状态
      this.skillEffectService.battleActive = this.timerManager?.isRunning || false
      return this.skillEffectService
    }
    if (this.skillEffectService.audioService !== this.audioService) {
      this.skillEffectService.audioService = this.audioService
    }
    return this.skillEffectService
  }

  async applySkillEffect (skill, context = null) {
    try {
      // 战斗已停止时不应用技能效果，防止 stop() 后异步回调继续触发音效和伤害计算
      if (!this.timerManager?.isRunning) {
        return false
      }
      if (!skill || !this.player) {
        return false
      }

      const monsters = this.monsterManager?.monsters || []
      const activeBuffs = this.player.activeBuffs || []
      this.player.activeBuffs = activeBuffs
      const impactedMonsterIndexSet = new Set()
      const resolvedContext = context && typeof context === 'object' ? context : null
      const contextTargetId = resolvedContext?.targetId ?? null
      const contextTargetIndexRaw = resolvedContext?.targetIndex ?? null
      let preferredTargetIndex = Number.isInteger(contextTargetIndexRaw) ? Number(contextTargetIndexRaw) : null
      if (
        preferredTargetIndex !== null &&
        (preferredTargetIndex < 0 ||
          preferredTargetIndex >= monsters.length ||
          monsters?.[preferredTargetIndex]?.id === undefined)
      ) {
        preferredTargetIndex = null
      }
      if (preferredTargetIndex !== null && contextTargetId !== null && contextTargetId !== undefined) {
        const currentId = monsters?.[preferredTargetIndex]?.id ?? null
        if (currentId !== null && String(currentId) !== String(contextTargetId)) {
          preferredTargetIndex = null
        }
      }
      if (
        preferredTargetIndex === null &&
        contextTargetId !== null &&
        contextTargetId !== undefined &&
        Array.isArray(monsters) &&
        monsters.length > 0
      ) {
        const idx = monsters.findIndex(monster => monster && monster.id !== undefined && String(monster.id) === String(contextTargetId))
        if (idx >= 0) {
          preferredTargetIndex = idx
        }
      }

      const weaponIcon = this.player.equipment?.weapon?.icon || null

      const service = this.ensureSkillEffectService()
      if (!service) {
        return false
      }

      const skillLevel = Number(skill.proficiencyLevel ?? skill.level ?? 1)
      await service.applySkillEffect(
        skill,
        this.player,
        monsters,
        activeBuffs,
        {
          traceId: this.traceContext?.traceId ?? null,
          preferredTargetIndex,
          preferredTargetId: contextTargetId ?? null,
          addBattleLog: message => {
            if (this.onLog) {
              this.onLog(message)
            }
          },
          onMonsterDefeated: (monster) => {
            // 找到 monster 的 index
            const index = monsters.indexOf(monster)
            if (index !== -1) {
              this.monsterManager.handleMonsterDefeated(index, monster)
            } else {
              console.warn('[AutoBattleService] onMonsterDefeated 回调: 未找到怪物索引', monster)
            }
          },
          showDamageNumber: (
            targetIndex,
            amount,
            isCritical,
            isHeal,
            skillPayload = null,
            isMiss = false,
            weaponIconPayload = null,
            monsterIconPayload = null,
            isMpHeal = false,
            text = null,
            elementInfo = null
          ) => {
            if (Number.isInteger(targetIndex) && targetIndex >= 0) {
              impactedMonsterIndexSet.add(targetIndex)
            }
            if (!this.onAttack) {
              return
            }
            const baseEvent = {
              targetIndex,
              damage: amount,
              isCritical: Boolean(isCritical),
              isHeal: Boolean(isHeal),
              skill: skillPayload || skill,
              isMiss: Boolean(isMiss),
              weaponIcon: weaponIconPayload || weaponIcon,
              monsterIcon: monsterIconPayload || null,
              isMpHeal: Boolean(isMpHeal),
              text: typeof text === 'string' ? text : null,
              elementType: elementInfo?.elementType ?? null,
              elementAdvantage: elementInfo?.elementAdvantage ?? null
            }
            if (targetIndex === -1) {
              this.onAttack(baseEvent)
              return
            }

            const monster = monsters[targetIndex]
            const resolvedMonsterIcon = monster?.icon || null
            this.onAttack({
              ...baseEvent,
              monsterIcon: baseEvent.monsterIcon || resolvedMonsterIcon
            })
          },
          // ========== 方案一：批量伤害数字回调 ==========
          showDamageNumberBatch: (damageBatch, skillPayload = null) => {
            if (!Array.isArray(damageBatch) || damageBatch.length === 0) {
              return
            }

            // 收集受影响的怪物索引
            for (const event of damageBatch) {
              const idx = event.targetIndex
              if (Number.isInteger(idx) && idx >= 0) {
                impactedMonsterIndexSet.add(idx)
              }
            }

            if (!this.onAttack) {
              return
            }

            // 批量发送伤害事件
            const batchEvents = damageBatch.map(event => {
              const monster = monsters[event.targetIndex]
              return {
                targetIndex: event.targetIndex,
                damage: event.damage,
                isCritical: Boolean(event.isCritical),
                isHeal: false,
                skill: event.skill || skillPayload || skill,
                isMiss: false,
                weaponIcon,
                monsterIcon: monster?.icon || null,
                isMpHeal: false,
                text: null,
                elementType: event.elementInfo?.elementType ?? null,
                elementAdvantage: event.elementInfo?.elementAdvantage ?? null,
                doubleJudgment: Boolean(event.doubleJudgment)
              }
            })

            // 如果 onAttack 支持批量事件，发送批量；否则逐个发送
            if (typeof this.onAttackBatch === 'function') {
              this.onAttackBatch(batchEvents)
            } else {
              for (const evt of batchEvents) {
                this.onAttack(evt)
              }
            }
          },
          // 获取monstersStore用于DEBUFF应用
          getMonstersStore: () => {
            try {
              return useMonstersStore()
            } catch (e) {
              console.warn('[AutoBattleService] 获取monstersStore失败:', e)
              return null
            }
          },
          // 吸血治疗动画回调
          onPlayerHeal: this.onPlayerHeal
        },
        skillLevel
      )

      const shouldFallbackScanAll =
        impactedMonsterIndexSet.size === 0 && ['single', 'aoe', 'dot'].includes(String(skill?.type || ''))
      const indices = shouldFallbackScanAll ? null : Array.from(impactedMonsterIndexSet)

      if (shouldFallbackScanAll) {
        for (let i = 0; i < monsters.length; i++) {
          const monster = monsters[i]
          if (!monster) {
            continue
          }
          if (monster.currentHealth > 0) {
            continue
          }
          if (!monster.isDefeated) {
            monster.isDefeated = true
          }
          monster.currentHealth = 0
          monster.healthPercentage = 0
          this.monsterManager.handleMonsterDefeated(i, monster)
        }
      } else {
        for (let idx = 0; idx < indices.length; idx += 1) {
          const i = indices[idx]
          if (!Number.isInteger(i) || i < 0 || i >= monsters.length) {
            continue
          }
          const monster = monsters[i]
          if (!monster) {
            continue
          }
          if (monster.currentHealth > 0) {
            continue
          }
          if (!monster.isDefeated) {
            monster.isDefeated = true
          }
          monster.currentHealth = 0
          monster.healthPercentage = 0
          this.monsterManager.handleMonsterDefeated(i, monster)
        }
      }
      return true
    } catch (error) {
      console.error('AutoBattleService', '技能效果应用失败:', error)
      return false
    }
  }

  setupTimerCallbacks () {
    this.timerManager.setCallbacks({
      onMainLoop: () => this.autoBattleLoop(),
      onSkillCheck: () => this.skillManager.checkAndUseSkills(),
      onCooldownUpdate: () => this.skillManager.updateSkillCooldowns(),
      onMonsterAttack: timestamp => this.monsterManager.processMonsterAttacks(timestamp),
      onPause: payload => {
        if (this.onPaused) {
          this.onPaused(payload)
        }
      },
      onResume: payload => {
        if (this.onResumed) {
          this.onResumed(payload)
        }
      }
    })
  }

  initialize (options = {}) {
    debug('AutoBattleService', 'initialize() 开始初始化')

    this.player = options.player || null
    this.gameData = options.gameData || null
    this.skillService = options.skillService || null
    this.audioService = options.audioService || null

    const config = new AutoBattleConfig(options.config || {})
    this.config.update(config.getAll(), { debounce: false, immediate: true })

    this.timerManager.setIntervals({
      skillCheckInterval: this.config.get('skillCheckInterval'),
      cooldownUpdateInterval: 1000
    })

    // ========== 方案二：DOT 调度器初始化 ==========
    // 注意：onDamageApplied 回调由 SkillEffectService 在 applyInlineDotEffect 中设置
    // 这里只初始化调度器的基本配置
    dotTickScheduler.initialize({
      player: this.player,
      onMonsterDefeated: (data) => {
        const monster = data?.monster
        if (monster) {
          const monsters = this.monsterManager?.monsters || []
          const index = monsters.indexOf(monster)
          if (index !== -1) {
            this.monsterManager.handleMonsterDefeated(index, monster)
          }
        }
      },
      onPlayerHeal: this.onPlayerHeal,
      getMonsterById: (monsterId) => {
        const monsters = this.monsterManager?.monsters || []
        return monsters.find(m => m && (m.id === monsterId || String(m.index) === String(monsterId))) || null
      },
      playSFX: (sfxName, volume) => {
        // 战斗已停止时不播放音效，防止 DotTickScheduler 异步残留回调在 stop() 后继续播放
        if (!this.timerManager?.isRunning) {
          return
        }
        if (this.audioService && typeof this.audioService.playSFX === 'function') {
          this.audioService.playSFX(sfxName, volume)
        }
      },
      tickInterval: 100
    })

    // ========== 性能监控启动 ==========
    battlePerfMonitor.start()

    this.skillManager.initialize({
      player: this.player,
      skills: options.skills || [],
      skillService: this.skillService,
      gameData: this.gameData,
      config: this.config,
      requestWorker: SkillEffectService.requestWorker,
      getCurrentTarget: () => {
        const target = this.monsterManager?.selectTarget?.('skillManager') || null
        if (!target) {
          return null
        }
        const idx = this.monsterManager?.currentTargetIndex
        if (Number.isInteger(idx) && idx >= 0) {
          return { ...target, index: idx }
        }
        return target
      },
      getLastAttackTime: () => this.lastAttackTime,
      getAttackInterval: () => this.calculateAttackInterval(),
      getAliveMonsterCount: () => this.monsterManager?.getAliveMonsterCount?.() ?? 0,
      onApplySkillEffect: (skill, skillContext = null) => this.applySkillEffect(skill, skillContext),
      onSkillUse: skill => {
        if (this.onSkillUse) {
          this.onSkillUse(skill)
        }
        this.lastAttackTime = Date.now()

        // 圣光积累被动：炽天使J技能，每次释放技能增加1点圣光值
        try {
          if (isHolyAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const holyResult = processHolyAccumulationOnSkillCast(this.player, baseAttack)

            if (holyResult.triggered && holyResult.healAmount > 0) {
              // 治疗玩家（无论自身还是全队，玩家都会被治疗）
              this.player.currentHealth = Math.min(
                this.player.maxHealth,
                this.player.currentHealth + holyResult.healAmount
              )

              // 更新玩家血量条
              if (this.onPlayerDamage) {
                this.onPlayerDamage({
                  currentHealth: this.player.currentHealth,
                  maxHealth: this.player.maxHealth
                })
              }

              // 显示治疗飘字动画
              if (this.onPlayerHeal) {
                this.onPlayerHeal({ amount: holyResult.healAmount })
              }

              // 添加战斗日志
              if (this.addBattleLog) {
                const logMessage = holyResult.targetType === 'self'
                  ? `圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`
                  : holyResult.multiHealBonus > 0
                    ? `圣光积累触发！全队恢复${holyResult.healPercent + holyResult.multiHealBonus}%攻击力生命值！`
                    : `圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`
                this.addBattleLog({
                  type: 'holy_accumulation',
                  message: logMessage,
                  timestamp: Date.now()
                })
              }
            }
          }
        } catch (holyAccumulationSkillError) {
          console.error('[AutoBattleService] 圣光积累技能释放处理失败:', holyAccumulationSkillError)
        }

        // 风之积累被动：风暴行者J技能，每次释放技能增加1点风之值
        try {
          if (isWindAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const windResult = processWindAccumulationOnSkillCast(this.player, baseAttack)

            if (windResult.triggered && windResult.damageAmount > 0) {
              // 找到当前目标怪物（如果还活着）
              const targetMonster = this.monsterManager?.monsters?.find(m => m && !m.isDying && m.currentHealth > 0)
              if (targetMonster) {
                const nextHealth = Math.max(0, targetMonster.currentHealth - windResult.damageAmount)
                targetMonster.currentHealth = nextHealth
                targetMonster.healthPercentage = targetMonster.maxHealth > 0
                  ? (nextHealth / targetMonster.maxHealth) * 100
                  : 0

                const windTargetIdx = Number.isFinite(Number(targetMonster.index))
                  ? Number(targetMonster.index)
                  : this.monsterManager.monsters.indexOf(targetMonster)
                if (windTargetIdx >= 0) {
                  battleMutationBatcher.queueVitalsUpdate(windTargetIdx, {
                    currentHealth: nextHealth,
                    healthPercentage: targetMonster.healthPercentage
                  })
                }

                const windSkill = getSkill('storm_walker', 'J')
                const windIcon = windSkill?.icon || '/pt/skill_icon/nenstorage.png'

                let windText = null
                if (windResult.multiAttackBonus > 0) {
                  const multiplier = (windResult.multiAttackBonus / 100).toFixed(1)
                  windText = `+${windResult.damageAmount}*${multiplier}倍`
                }

                this.monsterManager.attackTarget(
                  targetMonster,
                  windResult.damageAmount,
                  false,
                  false,
                  windSkill,
                  false,
                  windIcon,
                  null,
                  null,
                  null,
                  false,
                  false,
                  windText
                )

                if (this.addBattleLog) {
                  const totalPercent = windResult.damagePercent + windResult.multiAttackBonus
                  if (windResult.multiAttackBonus > 0) {
                    this.addBattleLog({
                      type: 'wind_accumulation',
                      message: `风之积累触发！附加${totalPercent}%攻击力风属性伤害！`,
                      timestamp: Date.now()
                    })
                  } else {
                    this.addBattleLog({
                      type: 'wind_accumulation',
                      message: `风之积累触发！附加${windResult.damagePercent}%攻击力风属性伤害！`,
                      timestamp: Date.now()
                    })
                  }
                }

                if (targetMonster.currentHealth <= 0 && !targetMonster.isDefeated) {
                  targetMonster.isDefeated = true
                  targetMonster.currentHealth = 0
                  targetMonster.healthPercentage = 0
                  const defIdx = this.monsterManager.monsters.indexOf(targetMonster)
                  this.monsterManager.handleMonsterDefeated(defIdx, targetMonster)
                }
              }
            }
          }
        } catch (windAccumulationSkillError) {
          console.error('[AutoBattleService] 风之积累技能释放处理失败:', windAccumulationSkillError)
        }

        // 裁决积累被动：圣殿骑士J技能，每次释放技能增加1点裁决值
        try {
          if (isJudgmentAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const judgmentResult = processJudgmentAccumulationOnSkillCast(this.player, baseAttack)

            // 触发附加伤害
            if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
              // 找到当前目标怪物（如果还活着）
              const targetMonster = this.monsterManager?.monsters?.find(m => m && !m.isDying && m.currentHealth > 0)
              if (targetMonster) {
                const nextHealth = Math.max(0, targetMonster.currentHealth - judgmentResult.damageAmount)
                targetMonster.currentHealth = nextHealth
                targetMonster.healthPercentage = targetMonster.maxHealth > 0
                  ? (nextHealth / targetMonster.maxHealth) * 100
                  : 0

                const judgmentTargetIdx = Number.isFinite(Number(targetMonster.index))
                  ? Number(targetMonster.index)
                  : this.monsterManager.monsters.indexOf(targetMonster)
                if (judgmentTargetIdx >= 0) {
                  battleMutationBatcher.queueVitalsUpdate(judgmentTargetIdx, {
                    currentHealth: nextHealth,
                    healthPercentage: targetMonster.healthPercentage
                  })
                }

                const judgmentSkill = getSkill('holy_knight', 'J')
                const judgmentIcon = judgmentSkill?.icon || '/pt/skill_icon/shengdiancaijue.png'

                let judgmentText = null
                if (judgmentResult.multiAttackBonus > 0) {
                  const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
                  judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
                }

                this.monsterManager.attackTarget(
                  targetMonster,
                  judgmentResult.damageAmount,
                  false,
                  false,
                  judgmentSkill,
                  false,
                  judgmentIcon,
                  null,
                  null,
                  null,
                  false,
                  false,
                  judgmentText
                )

                if (this.addBattleLog) {
                  const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
                  if (judgmentResult.multiAttackBonus > 0) {
                    this.addBattleLog({
                      type: 'judgment_accumulation',
                      message: `裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`,
                      timestamp: Date.now()
                    })
                  } else {
                    this.addBattleLog({
                      type: 'judgment_accumulation',
                      message: `裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`,
                      timestamp: Date.now()
                    })
                  }
                }

                if (targetMonster.currentHealth <= 0 && !targetMonster.isDefeated) {
                  targetMonster.isDefeated = true
                  targetMonster.currentHealth = 0
                  targetMonster.healthPercentage = 0
                  const targetIndex = this.monsterManager.monsters.indexOf(targetMonster)
                  this.monsterManager.handleMonsterDefeated(targetIndex, targetMonster)
                }
              }
            }
          }
        } catch (judgmentAccumulationSkillError) {
          console.error('[AutoBattleService] 裁决积累技能释放处理失败:', judgmentAccumulationSkillError)
        }

        // 奥术充能被动：奥术师J技能，每次释放技能增加1点充能值
        try {
          if (isArcaneChargeUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const arcaneChargeResult = processArcaneChargeOnSkillCast(this.player, baseAttack)

            // 触发附加伤害
            if (arcaneChargeResult.triggered && arcaneChargeResult.damageAmount > 0) {
              // 找到当前目标怪物（如果还活着）
              const targetMonster = this.monsterManager?.monsters?.find(m => m && !m.isDying && m.currentHealth > 0)
              if (targetMonster) {
                const nextHealth = Math.max(0, targetMonster.currentHealth - arcaneChargeResult.damageAmount)
                targetMonster.currentHealth = nextHealth
                targetMonster.healthPercentage = targetMonster.maxHealth > 0
                  ? (nextHealth / targetMonster.maxHealth) * 100
                  : 0

                const arcaneTargetIdx = Number.isFinite(Number(targetMonster.index))
                  ? Number(targetMonster.index)
                  : this.monsterManager.monsters.indexOf(targetMonster)
                if (arcaneTargetIdx >= 0) {
                  battleMutationBatcher.queueVitalsUpdate(arcaneTargetIdx, {
                    currentHealth: nextHealth,
                    healthPercentage: targetMonster.healthPercentage
                  })
                }

                const arcaneChargeSkill = getSkill('arcane_master', 'J')
                const arcaneIcon = arcaneChargeSkill?.icon || '/pt/skill_icon/aoshuchongneng.png'

                let arcaneText = null
                if (arcaneChargeResult.multiAttackBonus > 0) {
                  const multiplier = (arcaneChargeResult.multiAttackBonus / 100).toFixed(1)
                  arcaneText = `+${arcaneChargeResult.damageAmount}*${multiplier}倍`
                }

                this.monsterManager.attackTarget(
                  targetMonster,
                  arcaneChargeResult.damageAmount,
                  false,
                  false,
                  arcaneChargeSkill,
                  false,
                  arcaneIcon,
                  null,
                  null,
                  null,
                  false,
                  false,
                  arcaneText
                )

                if (this.addBattleLog) {
                  const totalPercent = arcaneChargeResult.damagePercent + arcaneChargeResult.multiAttackBonus
                  if (arcaneChargeResult.multiAttackBonus > 0) {
                    this.addBattleLog({
                      type: 'arcane_charge',
                      message: `奥术充能触发！附加${totalPercent}%攻击力无属性法术伤害！`,
                      timestamp: Date.now()
                    })
                  } else {
                    this.addBattleLog({
                      type: 'arcane_charge',
                      message: `奥术充能触发！附加${arcaneChargeResult.damagePercent}%攻击力无属性法术伤害！`,
                      timestamp: Date.now()
                    })
                  }
                }

                if (targetMonster.currentHealth <= 0 && !targetMonster.isDefeated) {
                  targetMonster.isDefeated = true
                  targetMonster.currentHealth = 0
                  targetMonster.healthPercentage = 0
                  const targetIndex = this.monsterManager.monsters.indexOf(targetMonster)
                  this.monsterManager.handleMonsterDefeated(targetIndex, targetMonster)
                }
              }
            }
          }
        } catch (arcaneChargeSkillError) {
          console.error('[AutoBattleService] 奥术充能技能释放处理失败:', arcaneChargeSkillError)
        }

        // 碎思归墟被动：心灵师J技能，每次释放技能增加1点充能值
        try {
          if (isMindChargeUnlocked(this.player)) {
            const playerMaxMana = Number(this.player.maxMana || 0)
            const mindChargeResult = processMindChargeOnSkillCast(this.player, playerMaxMana)

            // 触发附加伤害
            if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
              const targetMonster = this.monsterManager?.monsters?.find(m => m && !m.isDying && m.currentHealth > 0)
              if (targetMonster) {
                const nextHealth = Math.max(0, targetMonster.currentHealth - mindChargeResult.damageAmount)
                targetMonster.currentHealth = nextHealth
                targetMonster.healthPercentage = targetMonster.maxHealth > 0
                  ? (nextHealth / targetMonster.maxHealth) * 100
                  : 0

                const mindTargetIdx = Number.isFinite(Number(targetMonster.index))
                  ? Number(targetMonster.index)
                  : this.monsterManager.monsters.indexOf(targetMonster)
                if (mindTargetIdx >= 0) {
                  battleMutationBatcher.queueVitalsUpdate(mindTargetIdx, {
                    currentHealth: nextHealth,
                    healthPercentage: targetMonster.healthPercentage
                  })
                }

                const mindChargeSkill = getSkill('mind_master', 'J')
                const mindIcon = mindChargeSkill?.icon || '/pt/skill_icon/suisiguixu.png'

                let mindText = null
                if (mindChargeResult.multiAttackBonus > 0) {
                  const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
                  mindText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
                }

                this.monsterManager.attackTarget(
                  targetMonster,
                  mindChargeResult.damageAmount,
                  false,
                  false,
                  mindChargeSkill,
                  false,
                  mindIcon,
                  null,
                  null,
                  null,
                  false,
                  false,
                  mindText
                )

                if (this.addBattleLog) {
                  const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
                  if (mindChargeResult.multiAttackBonus > 0) {
                    this.addBattleLog({
                      type: 'mind_charge',
                      message: `碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`,
                      timestamp: Date.now()
                    })
                  } else {
                    this.addBattleLog({
                      type: 'mind_charge',
                      message: `碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`,
                      timestamp: Date.now()
                    })
                  }
                }

                if (targetMonster.currentHealth <= 0 && !targetMonster.isDefeated) {
                  targetMonster.isDefeated = true
                  targetMonster.currentHealth = 0
                  targetMonster.healthPercentage = 0
                  const targetIndex = this.monsterManager.monsters.indexOf(targetMonster)
                  this.monsterManager.handleMonsterDefeated(targetIndex, targetMonster)
                }
              }
            }
          }
        } catch (mindChargeSkillError) {
          console.error('[AutoBattleService] 碎思归墟技能释放处理失败:', mindChargeSkillError)
        }
      },
      onCooldownUpdate: updatedSkills => {
        if (this.onCooldownUpdate) {
          this.onCooldownUpdate(updatedSkills)
        }
      }
    })

    this.monsterManager.initialize({
      monsters: options.monsters || [],
      player: this.player,
      config: this.config,
      requestWorker: SkillEffectService.requestWorker,
      onAttack: attackEvent => {
        const targetIndex = attackEvent?.targetIndex
        const damage = attackEvent?.damage
        const isCritical = Boolean(attackEvent?.isCritical)
        const isHeal = Boolean(attackEvent?.isHeal)
        const isMiss = Boolean(attackEvent?.isMiss)
        const weaponIcon = attackEvent?.weaponIcon || null
        const monsterIcon = attackEvent?.monsterIcon || null

        if (!isHeal && this.audioService && typeof this.audioService.playAttackSFX === 'function') {
          // 战斗已停止时不播放攻击音效
          if (this.timerManager?.isRunning) {
            const now = Date.now()
            if (now - this.audioThrottle.lastAttackSfxTime >= this.audioThrottleIntervals.attackSfx) {
              this.audioThrottle.lastAttackSfxTime = now
              const weaponType = this.player?.equipment?.weapon?.subcategory || 'sword'
              this.audioService.playAttackSFX(weaponType, !isMiss && isCritical)
            }
          }
        }
        if (
          !isHeal &&
          !isMiss &&
          damage > 0 &&
          this.audioService &&
          typeof this.audioService.playMonsterDamageSFX === 'function'
        ) {
          // 战斗已停止时不播放怪物受伤音效
          if (this.timerManager?.isRunning) {
            const resolvedMonsterIcon =
              monsterIcon || this.monsterManager?.monsters?.[targetIndex]?.icon || null
            if (resolvedMonsterIcon) {
              const now = Date.now()
              const lastTime =
                this.audioThrottle.lastMonsterDamageSfxTime.get(resolvedMonsterIcon) || 0
              if (
                now - lastTime >= this.audioThrottleIntervals.monsterDamageSfx ||
                lastTime === 0
              ) {
                this.audioThrottle.lastMonsterDamageSfxTime.set(resolvedMonsterIcon, now)
                this.audioService.playMonsterDamageSFX(resolvedMonsterIcon)
              }
            }
          }
        }
        if (this.onAttack) {
          this.onAttack({
            ...attackEvent,
            targetIndex,
            damage,
            isCritical,
            isHeal,
            isMiss,
            weaponIcon,
            monsterIcon
          })
        }

        // ========== 弓箭普通攻击特效：装备弓箭时，射出元素箭矢飞向目标怪物 ==========
        // 自动战斗攻击频率高，使用 200ms 节流避免特效堆积导致卡顿
        // 复用攻击音效节流时间戳 lastAttackSfxTime，与音效同步触发
        if (!isHeal && !isMiss && damage > 0 && this.timerManager?.isRunning) {
          try {
            const weapon = this.player?.equipment?.weapon
            if (weapon?.subcategory === 'bow') {
              const now = Date.now()
              // 弓箭特效节流：与攻击音效共用 200ms 间隔，但不共用时间戳
              // 使用独立节流时间戳，避免与音效互相干扰
              if (!this._lastBowEffectTime || now - this._lastBowEffectTime >= 200) {
                this._lastBowEffectTime = now
                const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
                const bowAttackEvent = new CustomEvent('bow-normal-attack', {
                  detail: {
                    targetIndex,
                    element: elementInfo?.elementKey || 'none'
                  }
                })
                window.dispatchEvent(bowAttackEvent)
              }
            }
          } catch (bowEffectError) {
            console.error('[AutoBattleService] 弓箭攻击特效派发失败:', bowEffectError)
          }
        }
      },
      onMonsterDefeated: (targetIndex, monster) => this.queueMonsterDefeated(targetIndex, monster),
      onAllMonstersDefeated: () => {
        this.notifyAllMonstersDefeatedOnce()
      },
      onMonsterAttackPlayer: data => {
        if (
          data &&
          !data.isMiss &&
          data.damage > 0 &&
          this.audioService &&
          typeof this.audioService.playDamageSFX === 'function'
        ) {
          // 战斗已停止时不播放玩家受伤音效
          if (this.timerManager?.isRunning) {
            const now = Date.now()
            if (now - this.audioThrottle.lastPlayerDamageSfxTime >= this.audioThrottleIntervals.playerDamageSfx) {
              this.audioThrottle.lastPlayerDamageSfxTime = now
              const gender =
                this.player?.gender === 'female' || this.player?.sex === 'female' ? 'female' : 'male'
              this.audioService.playDamageSFX(gender)
            }
          }
        }
        if (this.onPlayerDamage) {
          this.onPlayerDamage(data)
        }
      },
      onMonsterAttack: monsterIndex => {
        if (this.onMonsterAttack) {
          this.onMonsterAttack(monsterIndex)
        }
      },
      onPlayMonsterAttackSFX: monsterIcon => {
        // 战斗已停止时不播放怪物攻击音效
        if (!this.timerManager?.isRunning) {
          return
        }
        if (this.audioService && typeof this.audioService.playMonsterAttackSFX === 'function') {
          const now = Date.now()
          const lastTime = this.audioThrottle.lastMonsterAttackSfxTime.get(monsterIcon) || 0
          if (
            now - lastTime >= this.audioThrottleIntervals.monsterAttackSfx ||
            lastTime === 0
          ) {
            this.audioThrottle.lastMonsterAttackSfxTime.set(monsterIcon, now)
            this.audioService.playMonsterAttackSFX(monsterIcon)
          }
        }
      },
      onPlayMonsterDamageSFX: monsterIcon => {
        // 战斗已停止时不播放怪物受伤音效
        if (!this.timerManager?.isRunning) {
          return
        }
        if (this.audioService && typeof this.audioService.playMonsterDamageSFX === 'function') {
          const now = Date.now()
          const lastTime = this.audioThrottle.lastMonsterDamageSfxTime.get(monsterIcon) || 0
          if (
            now - lastTime >= this.audioThrottleIntervals.monsterDamageSfx ||
            lastTime === 0
          ) {
            this.audioThrottle.lastMonsterDamageSfxTime.set(monsterIcon, now)
            this.audioService.playMonsterDamageSFX(monsterIcon)
          }
        }
      },
      onPlayMonsterDeathSFX: monsterIcon => {
        // 战斗已停止时不播放怪物死亡音效
        if (!this.timerManager?.isRunning) {
          return
        }
        if (this.audioService && typeof this.audioService.playMonsterDeathSFX === 'function') {
          const now = Date.now()
          const lastTime = this.audioThrottle.lastMonsterDeathSfxTime.get(monsterIcon) || 0
          if (
            now - lastTime >= this.audioThrottleIntervals.monsterDeathSfx ||
            lastTime === 0
          ) {
            this.audioThrottle.lastMonsterDeathSfxTime.set(monsterIcon, now)
            this.audioService.playMonsterDeathSFX(monsterIcon)
          }
        }
      }
    })

    this.onAttack = options.onAttack || null
    this.onSkillUse = options.onSkillUse || null
    this.onLog = options.onLog || null
    this.onPlayerDeath = options.onPlayerDeath || null
    this.onPlayerDamage = options.onPlayerDamage || null
    this.onPlayerHeal = options.onPlayerHeal || null
    this.onMonsterDefeated = options.onMonsterDefeated || null
    this.onAllMonstersDefeated = options.onAllMonstersDefeated || null
    this.onUseItem = options.onUseItem || null
    this.onRefreshMonsters = options.onRefreshMonsters || null
    this.onCooldownUpdate = options.onCooldownUpdate || null
    this.onMonsterAttack = options.onMonsterAttack || null
    this.onPaused = options.onPaused || null
    this.onResumed = options.onResumed || null

    this.hasNotifiedAllMonstersDefeated = false
    this.updateCachedAttackInterval()
    debug('AutoBattleService', 'initialize() 初始化完成')
  }

  start () {
    try {
      debug('AutoBattleService', 'start() 被调用')

      if (this.timerManager.isRunning) {
        debug('AutoBattleService', '自动战斗已经在运行中')
        return false
      }

      if (!this.player) {
        const error = new Error('玩家数据不存在')
        console.error('AutoBattleService', '自动战斗启动失败：玩家数据不存在')
        autoBattleErrorHandler.handle(error, 'AutoBattleService', {
          notifyUser: true,
          stopAutoBattle: false
        })
        if (typeof this.onLog === 'function') {
          this.onLog('玩家数据异常，无法启动自动战斗', 'error')
        }
        return false
      }

      if (!this.monsterManager || !this.monsterManager.getValidMonsters) {
        const error = new Error('怪物管理器未初始化')
        console.error('AutoBattleService', '自动战斗启动失败：怪物管理器未初始化')
        autoBattleErrorHandler.handle(error, 'AutoBattleService', {
          notifyUser: true,
          stopAutoBattle: false
        })
        if (typeof this.onLog === 'function') {
          this.onLog('怪物数据未就绪，无法启动自动战斗', 'error')
        }
        return false
      }

      const validMonsters = this.monsterManager.getValidMonsters()
      if (!validMonsters || validMonsters.length === 0) {
        if (typeof this.onLog === 'function') {
          this.onLog('没有有效怪物，请刷新怪物或调整等级范围后重试', 'warning')
        }
        return false
      }

      this.hasNotifiedAllMonstersDefeated = false
      const started = this.timerManager.start()

      if (!started) {
        const error = new Error('定时器启动失败')
        console.error('AutoBattleService', '自动战斗启动失败：定时器启动失败')
        autoBattleErrorHandler.handle(error, 'AutoBattleService', {
          notifyUser: true,
          stopAutoBattle: false
        })
        return false
      }

      if (this.skillManager) {
        this.skillManager.isActive = true
        this.skillManager.decisionVersion = (this.skillManager.decisionVersion + 1) % 1000000
      }

      // 标记 SkillEffectService 战斗活跃，允许播放音效
      if (this.skillEffectService) {
        this.skillEffectService.battleActive = true
      }

      debug('AutoBattleService', `自动战斗已启动，攻击间隔: ${this.config.get('baseAttackInterval')}ms`)
      return true
    } catch (error) {
      console.error('AutoBattleService', '自动战斗启动过程错误:', error)
      autoBattleErrorHandler.handle(error, 'AutoBattleService', {
        notifyUser: true,
        stopAutoBattle: false
      })
      return false
    }
  }

  stop () {
    try {
      debug('AutoBattleService', 'stop() 被调用')

      if (!this.timerManager.isRunning) {
        return false
      }

      this.timerManager.stop()

      this.lastAttackTime = 0
      this.clearMonsterDefeatedEvents()

      // ========== 方案二：停止 DOT 调度器 ==========
      dotTickScheduler.stop()

      // ========== 性能监控停止 ==========
      battlePerfMonitor.stop()

      if (this.skillManager) {
        this.skillManager.isActive = false
        this.skillManager.isDecisionInFlight = false
        this.skillManager.decisionVersion = (this.skillManager.decisionVersion + 1) % 1000000
      }

      // 标记 SkillEffectService 战斗已停止，阻止异步残留块继续播放音效
      if (this.skillEffectService) {
        this.skillEffectService.battleActive = false
      }

      if (this.audioService && typeof this.audioService.stopAllAudio === 'function') {
        this.audioService.stopAllAudio()
      }

      if (this.player) {
        this.player.isAttacking = false
        this.player.lastAttackStartTime = null
      }

      debug('AutoBattleService', '自动战斗已停止')
      return true
    } catch (error) {
      console.error('AutoBattleService', '自动战斗停止过程错误:', error)
      autoBattleErrorHandler.handle(error, 'AutoBattleService', {
        notifyUser: true,
        stopAutoBattle: false
      })
      return false
    }
  }

  pause (options = {}) {
    try {
      const paused = this.timerManager.pause(options)
      if (paused) {
        debug('AutoBattleService', '自动战斗已暂停')
      }
      return paused
    } catch (error) {
      console.error('AutoBattleService', '自动战斗暂停过程错误:', error)
      autoBattleErrorHandler.handle(error, 'AutoBattleService', {
        notifyUser: false,
        stopAutoBattle: false
      })
      return false
    }
  }

  resume (options = {}) {
    try {
      debug('AutoBattleService', 'resume() 被调用', { source: options.source })
      const resumed = this.timerManager.resume(options)
      if (resumed) {
        if (this.skillManager) {
          this.skillManager.isActive = true
          this.skillManager.decisionVersion = (this.skillManager.decisionVersion + 1) % 1000000
        }
        debug('AutoBattleService', '自动战斗已恢复')
        this.monsterManager.startMonsterAttackLoop()
      }
      return resumed
    } catch (error) {
      console.error('AutoBattleService', '自动战斗恢复过程错误:', error)
      autoBattleErrorHandler.handle(error, 'AutoBattleService', {
        notifyUser: false,
        stopAutoBattle: false
      })
      return false
    }
  }

  toggle () {
    if (this.timerManager.isRunning) {
      return this.stop()
    } else {
      return this.start()
    }
  }

  updateCachedAttackInterval () {
    const baseAttackInterval =
      this.config.get('baseAttackInterval') || AutoBattleConfig.DEFAULT.baseAttackInterval
    const minAttackInterval =
      this.config.get('minAttackInterval') || AutoBattleConfig.DEFAULT.minAttackInterval
    const className = String(this.player?.class || '').toLowerCase()
    const useCastSpeed = isCasterClass(className)
    const resolvedBaseInterval = useCastSpeed ? 2000 : baseAttackInterval
    const resolvedMinInterval = Math.max(500, Number(minAttackInterval) || 0)
    if (useCastSpeed) {
      // 法系施法速度线性映射：0% → 2000ms，200% → 500ms
      const rawCastSpeed = Number(this.player?.decreasedCastingTime ?? 0)
      const normalizedCastSpeed = Number.isFinite(rawCastSpeed) ? rawCastSpeed : 0
      const maxCastSpeed = 2.0
      const clampedCastSpeed = Math.min(Math.max(normalizedCastSpeed, 0), maxCastSpeed)
      const safeBaseInterval = Number.isFinite(resolvedBaseInterval)
        ? resolvedBaseInterval
        : AutoBattleConfig.DEFAULT.baseAttackInterval
      const intervalRange = Math.max(0, safeBaseInterval - resolvedMinInterval)
      this.cachedAttackInterval = Math.floor(
        Math.max(
          resolvedMinInterval,
          safeBaseInterval - (clampedCastSpeed / maxCastSpeed) * intervalRange
        )
      )
      this.cachedAttackSpeed = clampedCastSpeed
    } else {
      const attackSpeed = this.player?.attackSpeed || 0
      this.cachedAttackInterval = Math.floor(
        calculateAttackInterval(
          resolvedBaseInterval,
          attackSpeed,
          minAttackInterval,
          100
        )
      )
      this.cachedAttackSpeed = attackSpeed
    }
    this.cachedBaseAttackInterval = resolvedBaseInterval
    this.cachedMinAttackInterval = minAttackInterval
    this.cachedUseCastSpeed = useCastSpeed
  }

  ensureCachedAttackInterval () {
    const baseAttackInterval =
      this.config.get('baseAttackInterval') || AutoBattleConfig.DEFAULT.baseAttackInterval
    const minAttackInterval =
      this.config.get('minAttackInterval') || AutoBattleConfig.DEFAULT.minAttackInterval
    const className = String(this.player?.class || '').toLowerCase()
    const useCastSpeed = isCasterClass(className)
    const resolvedBaseInterval = useCastSpeed ? 2000 : baseAttackInterval
    const attackSpeed = useCastSpeed
      ? Math.min(
        Math.max(Number(this.player?.decreasedCastingTime ?? 0) || 0, 0),
        0.9
      )
      : this.player?.attackSpeed || 1
    if (
      this.cachedBaseAttackInterval !== resolvedBaseInterval ||
      this.cachedAttackSpeed !== attackSpeed ||
      this.cachedMinAttackInterval !== minAttackInterval ||
      this.cachedUseCastSpeed !== useCastSpeed
    ) {
      this.updateCachedAttackInterval()
    }
  }

  notifyAllMonstersDefeatedOnce () {
    if (this.hasNotifiedAllMonstersDefeated) {
      return
    }

    this.hasNotifiedAllMonstersDefeated = true
    try {
      if (this.onAllMonstersDefeated) {
        this.onAllMonstersDefeated()
      }
    } catch (error) {
      console.error('AutoBattleService', '处理清场事件失败:', error)
    }
  }

  async autoBattleLoop () {
    try {
      if (!this.checkPlayerStatus()) {
        return
      }

      const now = Date.now()
      const logLoop = (message, payload = {}) => {
        if (!isDev) {
          return
        }
        const lastLogAt = Number(this.lastLoopLogAt ?? 0) || 0
        if (now - lastLogAt < 250) {
          return
        }
        this.lastLoopLogAt = now
        debug('AutoBattleService', message, payload)
      }
      this.ensureCachedAttackInterval()
      const attackInterval =
        this.cachedAttackInterval ||
        this.config.get('baseAttackInterval') ||
        AutoBattleConfig.DEFAULT.baseAttackInterval

      const elapsedSinceLastAttack = now - this.lastAttackTime
      if (elapsedSinceLastAttack < attackInterval) {
        logLoop('自动战斗间隔未到', {
          now,
          lastAttackTime: this.lastAttackTime,
          attackInterval
        })
        return
      }

      if (this.config.get('autoUseSkills') && this.skillManager) {
        const availableSkills = this.skillManager.getAvailableSkills()
        if (availableSkills.length > 0) {
          const didTriggerSkill = this.skillManager.checkAndUseSkills('mainLoop')
          if (didTriggerSkill) {
            // 技能已释放（同步）或 Worker 决策进行中（异步）
            // 无论哪种情况，都跳过普通攻击，确保一个攻击间隔内只执行一次动作
            if (this.skillManager.isUsingSkill) {
              // 同步技能释放成功，消耗本次攻击间隔
              this.lastAttackTime = now
            }
            // Worker 决策进行中时不设置 lastAttackTime，
            // 让下一帧继续检查：Worker 完成后若释放了技能会通过 onSkillUse 设置 lastAttackTime
            logLoop('自动战斗触发技能或决策中', {
              now,
              attackInterval,
              availableSkills: availableSkills.length,
              isUsingSkill: this.skillManager.isUsingSkill,
              isDecisionInFlight: this.skillManager.isDecisionInFlight
            })
            return
          }
        }
      }

      const target = this.monsterManager.selectTarget('mainLoop-attack')
      if (!target) {
        if (this.monsterManager.getAliveMonsterCount() === 0) {
          this.notifyAllMonstersDefeatedOnce()
        }
        debug('AutoBattleService', '没有找到有效目标')
        return
      }

      // 先设置 lastAttackTime，确保攻击间隔不会被跳过
      this.lastAttackTime = now
      // 异步执行 performAttack，内部有 yield 让出点，不会阻塞主线程
      await this.performAttack(target)
      logLoop('自动战斗触发普通攻击', {
        now,
        attackInterval,
        targetId: target?.id ?? null
      })
    } catch (error) {
      console.error('AutoBattleService', '自动战斗主循环错误:', error)
      autoBattleErrorHandler.handle(error, 'AutoBattleService', {
        notifyUser: false,
        stopAutoBattle: false
      })
    }
  }

  checkPlayerStatus () {
    if (!this.player) {
      return false
    }

    if (this.player.currentHealth <= 0) {
      debug('AutoBattleService', '玩家已死亡')
      if (
        this.audioService &&
        typeof this.audioService.playDeathSFX === 'function' &&
        !this.player.deathMusicPlayed
      ) {
        const gender = this.player?.gender === 'female' || this.player?.sex === 'female' ? 'female' : 'male'
        this.audioService.playDeathSFX(gender)
        this.player.deathMusicPlayed = true
      }
      if (this.onPlayerDeath) {
        this.onPlayerDeath()
      }
      return false
    }

    if (this.player.isAttacking && this.player.lastAttackStartTime) {
      const now = Date.now()
      if (now - this.player.lastAttackStartTime > 5000) {
        warn('AutoBattleService', '检测到攻击状态卡住，强制重置')
        this.player.isAttacking = false
        this.player.lastAttackStartTime = null
      }
    }

    return true
  }

  async performAttack (target) {
    try {
      if (!target || !this.player) {
        throw new Error('目标或玩家数据不存在')
      }

      // 检查是否有BUFF效果需要消耗MP
      const activeBuffs = Array.isArray(this.player.activeBuffs) ? this.player.activeBuffs : []
      let mpCostPerAttack = 0
      
      // 查找所有激活的BUFF中的mpCostPerAttack效果
      for (const buff of activeBuffs) {
        if (buff && buff.effects && typeof buff.effects === 'object') {
          const mpEffect = buff.effects.mpCostPerAttack
          
          // 检查多种格式：
          // 1. 直接数值格式：effects.mpCostPerAttack = 1
          // 2. 对象格式：effects.mpCostPerAttack = { add: 1, rate: true }
          // 3. 新格式：effects.mpCostPerAttack = 1（直接数值）
          
          if (mpEffect !== undefined) {
            let mpValue = 0
            
            if (typeof mpEffect === 'number') {
              // 直接数值格式
              mpValue = mpEffect
            } else if (mpEffect && typeof mpEffect === 'object') {
              // 对象格式
              mpValue = mpEffect.add || mpEffect.value || mpEffect.amount || 0
            }
            
            if (mpValue > 0) {
              mpCostPerAttack = Math.max(mpCostPerAttack, mpValue)
            }
          }
        }
      }

      // 如果有MP消耗效果，消耗MP
      if (mpCostPerAttack > 0 && this.player.maxMana > 0) {
        const mpToConsume = Math.floor(this.player.maxMana * (mpCostPerAttack / 100))
        if (mpToConsume > 0 && this.player.currentMana >= mpToConsume) {
          this.player.currentMana -= mpToConsume
          
          // 添加战斗日志
          if (this.addBattleLog) {
            this.addBattleLog({
              type: 'mp_consumed',
              message: `普通攻击消耗 ${mpToConsume} MP (${mpCostPerAttack}% 最大MP)`,
              timestamp: Date.now()
            })
          }
        }
      }

      // 1. 检查并触发被动技能（双倍惩戒）- 不考虑命中率，只考虑技能触发概率
      // 如果本次判定触发成功，会给所有怪物添加DEBUFF图标
      // 下次普通攻击命中时才会消耗DEBUFF触发双倍伤害
      this.checkAndTriggerPassiveSkills()

      // === YIELD 让出主线程 ===
      // 被动技能检查（含遍历所有怪物）完成后让出，确保该段同步工作不超讨 50ms
      await new Promise(resolve => setTimeout(resolve, 0))

      // yield 恢复后检查战斗是否仍在运行，防止 stop() 后继续执行攻击逻辑和播放音效
      if (!this.timerManager?.isRunning) {
        return
      }

      // 2. 计算基础伤害和命中判定
      const result = DamageCalculator.calculatePlayerDamage(this.player, target)
      let { damage, isCritical, isMiss } = result

      // 3. 检查目标是否有双倍惩戒DEBUFF（上次触发的效果）
      // 只有命中时才会消耗DEBUFF并触发双倍伤害
      let damageMultiplier = 1
      let doubleJudgmentTriggered = false
      if (!isMiss && target) {
        const service = this.ensureSkillEffectService()
        if (service && typeof service.consumeDoubleJudgmentDebuff === 'function') {
          damageMultiplier = service.consumeDoubleJudgmentDebuff(target)
          if (damageMultiplier > 1) {
            doubleJudgmentTriggered = true
            if (this.addBattleLog) {
              this.addBattleLog({
                type: 'double_judgment',
                message: `双倍惩戒触发！伤害翻倍！`,
                timestamp: Date.now()
              })
            }
          }
        }
      }

      // 4. 应用双倍伤害倍率（如果本次命中且触发了双倍惩戒）
      if (!isMiss && doubleJudgmentTriggered && damageMultiplier > 1) {
        damage = Math.floor(damage * damageMultiplier)
      }

      const weapon = this.player.equipment?.weapon || null
      const weaponIcon = weapon?.icon || null
      const monsterIcon = target.icon || null
      const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
      const elementType = elementInfo?.elementKey || null
      const targetElement = target?.elementType ?? target?.element ?? null
      const elementAdvantage = DamageCalculator.getElementAdvantageMultiplier(
        elementType,
        targetElement
      )

      if (!isMiss && Number.isFinite(damage) && damage > 0) {
        const nextHealth = Math.max(0, (target.currentHealth || 0) - damage)
        const maxHealth = target.maxHealth || 0
        const healthPct = maxHealth > 0 ? (nextHealth / maxHealth) * 100 : 0

        // 保留 proxy 写入（后续代码需要读取 target.currentHealth）
        // currentHealth 不在 monstersUiSnapshot 中，不会触发 UI 重渲染
        target.currentHealth = nextHealth
        target.healthPercentage = Math.max(0, Math.min(100, Math.round(healthPct)))

        // 通过批处理器队列化 TypedArray 更新（Canvas 从 TypedArray 读取血量）
        const targetIdx = Number.isFinite(Number(target.index)) ? Number(target.index) : this.monsterManager.monsters.indexOf(target)
        if (targetIdx >= 0) {
          battleMutationBatcher.queueVitalsUpdate(targetIdx, {
            currentHealth: nextHealth,
            healthPercentage: healthPct
          })
        }

        // 吸血效果：根据伤害和吸血比例恢复玩家生命值
        applyLifeSteal(this.player, damage, {
          addBattleLog: this.addBattleLog,
          onPlayerHeal: this.onPlayerHeal
        })

        // 检查并应用"赛乐的祝福"攻击触发DEBUFF
        if (this.skillEffectService && typeof this.skillEffectService.applySyleBlessingAttackDebuff === 'function') {
          this.skillEffectService.applySyleBlessingAttackDebuff(this.player, target, {
            addBattleLog: this.addBattleLog
          })
        }
      }

      this.monsterManager.attackTarget(
        target,
        damage,
        isCritical,
        false,
        null,
        isMiss,
        weaponIcon,
        monsterIcon,
        elementType,
        elementAdvantage,
        doubleJudgmentTriggered
      )

      // 5. 双刀流被动：攻击时概率触发副手普通攻击
      // 每次普通攻击触发时，副手额外攻击一次（独立命中/暴击/伤害计算）
      if (!isMiss && target.currentHealth > 0) {
        // === YIELD 让出主线程 ===
        // 主手攻击完成后让出，副手攻击在下一宏任务执行
        await new Promise(resolve => setTimeout(resolve, 0))
        // yield 恢复后检查战斗是否仍在运行，防止 stop() 后继续执行副手攻击和播放音效
        if (!this.timerManager?.isRunning) {
          return
        }
        this.performOffhandAttack(target)
      }

      // 6. 暴风连矢被动：普通攻击命中后有概率射出双重箭矢（爆裂射手W技能）
      // 触发后额外射出一支箭矢，造成独立伤害，伤害动画显示暴风连矢图标+伤害
      if (!isMiss && target.currentHealth > 0) {
        // 武器精通类技能熟练度计数：普通攻击命中后累计计数
        trackMasteryAttack(this.player)
        this.performStormArrowsAttack(target)
      }

      // ========== 7. 龙之劲被动：格斗宗师J技能，普通攻击累计劲力值，达到阈值触发附加伤害 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isDragonForceUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const dragonForceResult = processDragonForceOnAttack(this.player, baseAttack)

            // 消耗MP
            if (dragonForceResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - dragonForceResult.mpConsumed)
            }

            // 触发附加伤害
            if (dragonForceResult.triggered && dragonForceResult.bonusDamage > 0) {
              // 应用附加伤害到怪物
              const nextHealth = Math.max(0, target.currentHealth - dragonForceResult.bonusDamage)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              // 通过批处理器队列化 TypedArray 更新
              const dragonForceTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (dragonForceTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(dragonForceTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              // 通过 monsterManager.attackTarget 触发伤害数字显示
              const dragonForceSkill = getSkill('combat_master', 'J')
              const dragonForceIcon = dragonForceSkill?.icon || '/pt/skill_icon/longjin.png'

              // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
              let dragonForceText = null
              if (dragonForceResult.multiAttackBonus > 0) {
                const multiplier = (dragonForceResult.multiAttackBonus / 100).toFixed(1)
                dragonForceText = `+${dragonForceResult.bonusDamage}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                dragonForceResult.bonusDamage,
                false,
                false,
                dragonForceSkill,
                false,
                dragonForceIcon,
                null,
                null,
                null,
                false,
                false,
                dragonForceText
              )

              // 添加战斗日志
              if (this.addBattleLog) {
                const totalPercent = dragonForceResult.bonusPercent + dragonForceResult.multiAttackBonus
                if (dragonForceResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'dragon_force',
                    message: `龙之劲触发！附加${totalPercent}%攻击力伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'dragon_force',
                    message: `龙之劲触发！附加${dragonForceResult.bonusPercent}%攻击力伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (dragonForceError) {
          console.error('[AutoBattleService] 龙之劲处理失败:', dragonForceError)
        }
      }

      // ========== 影之怨被动：暗夜主宰J技能，普通攻击累计影怨值，达到阈值触发附加伤害 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isShadowGrudgeUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const shadowGrudgeResult = processShadowGrudgeOnAttack(this.player, baseAttack)

            // 消耗MP
            if (shadowGrudgeResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - shadowGrudgeResult.mpConsumed)
            }

            // 触发附加伤害
            if (shadowGrudgeResult.triggered && shadowGrudgeResult.bonusDamage > 0) {
              // 应用附加伤害到怪物
              const nextHealth = Math.max(0, target.currentHealth - shadowGrudgeResult.bonusDamage)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              // 通过批处理器队列化 TypedArray 更新
              const shadowGrudgeTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (shadowGrudgeTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(shadowGrudgeTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              // 通过 monsterManager.attackTarget 触发伤害数字显示
              const shadowGrudgeSkill = getSkill('joker_emperor', 'J')
              const shadowGrudgeIcon = shadowGrudgeSkill?.icon || '/pt/skill_icon/shadowgrudge.png'

              // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
              let shadowGrudgeText = null
              if (shadowGrudgeResult.multiAttackBonus > 0) {
                const multiplier = (shadowGrudgeResult.multiAttackBonus / 100).toFixed(1)
                shadowGrudgeText = `+${shadowGrudgeResult.bonusDamage}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                shadowGrudgeResult.bonusDamage,
                false,
                false,
                shadowGrudgeSkill,
                false,
                shadowGrudgeIcon,
                null,
                null,
                null,
                false,
                false,
                shadowGrudgeText
              )

              // 添加战斗日志
              if (this.addBattleLog) {
                const totalPercent = shadowGrudgeResult.bonusPercent + shadowGrudgeResult.multiAttackBonus
                if (shadowGrudgeResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'shadow_grudge',
                    message: `影之怨触发！附加${totalPercent}%攻击力伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'shadow_grudge',
                    message: `影之怨触发！附加${shadowGrudgeResult.bonusPercent}%攻击力伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (shadowGrudgeError) {
          console.error('[AutoBattleService] 影之怨处理失败:', shadowGrudgeError)
        }
      }

      // ========== 圣光积累被动：炽天使J技能，普通攻击累计圣光值，达到阈值触发治疗 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isHolyAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const holyResult = processHolyAccumulationOnAttack(this.player, baseAttack)

            // 消耗MP
            if (holyResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - holyResult.mpConsumed)
            }

            // 触发治疗
            if (holyResult.triggered && holyResult.healAmount > 0) {
              // 治疗玩家（无论自身还是全队，玩家都会被治疗）
              this.player.currentHealth = Math.min(
                this.player.maxHealth,
                this.player.currentHealth + holyResult.healAmount
              )

              // 更新玩家血量条
              if (this.onPlayerDamage) {
                this.onPlayerDamage({
                  currentHealth: this.player.currentHealth,
                  maxHealth: this.player.maxHealth
                })
              }

              // 显示治疗飘字动画
              if (this.onPlayerHeal) {
                this.onPlayerHeal({ amount: holyResult.healAmount })
              }

              // 添加战斗日志
              if (this.addBattleLog) {
                const logMessage = holyResult.targetType === 'self'
                  ? `圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`
                  : holyResult.multiHealBonus > 0
                    ? `圣光积累触发！全队恢复${holyResult.healPercent + holyResult.multiHealBonus}%攻击力生命值！`
                    : `圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`
                this.addBattleLog({
                  type: 'holy_accumulation',
                  message: logMessage,
                  timestamp: Date.now()
                })
              }
            }
          }
        } catch (holyAccumulationError) {
          console.error('[AutoBattleService] 圣光积累处理失败:', holyAccumulationError)
        }
      }

      // ========== 风之积累被动：风暴行者J技能，普通攻击累计风之值，达到阈值触发附加伤害 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isWindAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const windResult = processWindAccumulationOnAttack(this.player, baseAttack)

            // 消耗MP
            if (windResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - windResult.mpConsumed)
            }

            // 触发附加伤害
            if (windResult.triggered && windResult.damageAmount > 0) {
              // 应用附加伤害到怪物
              const nextHealth = Math.max(0, target.currentHealth - windResult.damageAmount)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              // 通过批处理器队列化 TypedArray 更新
              const windTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (windTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(windTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              // 通过 monsterManager.attackTarget 触发伤害数字显示
              const windSkill = getSkill('storm_walker', 'J')
              const windIcon = windSkill?.icon || '/pt/skill_icon/nenstorage.png'

              // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
              let windText = null
              if (windResult.multiAttackBonus > 0) {
                const multiplier = (windResult.multiAttackBonus / 100).toFixed(1)
                windText = `+${windResult.damageAmount}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                windResult.damageAmount,
                false,
                false,
                windSkill,
                false,
                windIcon,
                null,
                null,
                null,
                false,
                false,
                windText
              )

              // 添加战斗日志
              if (this.addBattleLog) {
                const totalPercent = windResult.damagePercent + windResult.multiAttackBonus
                if (windResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'wind_accumulation',
                    message: `风之积累触发！附加${totalPercent}%攻击力风属性伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'wind_accumulation',
                    message: `风之积累触发！附加${windResult.damagePercent}%攻击力风属性伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (windAccumulationError) {
          console.error('[AutoBattleService] 风之积累处理失败:', windAccumulationError)
        }
      }

      // ========== 裁决积累被动：圣殿骑士J技能，普通攻击累计裁决值，达到阈值触发附加伤害 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isJudgmentAccumulationUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const judgmentResult = processJudgmentAccumulationOnAttack(this.player, baseAttack)

            // 消耗MP
            if (judgmentResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - judgmentResult.mpConsumed)
            }

            // 触发附加伤害
            if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
              // 应用附加伤害到怪物
              const nextHealth = Math.max(0, target.currentHealth - judgmentResult.damageAmount)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              // 通过批处理器队列化 TypedArray 更新
              const judgmentTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (judgmentTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(judgmentTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              // 通过 monsterManager.attackTarget 触发伤害数字显示
              const judgmentSkill = getSkill('holy_knight', 'J')
              const judgmentIcon = judgmentSkill?.icon || '/pt/skill_icon/shengdiancaijue.png'

              // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
              let judgmentText = null
              if (judgmentResult.multiAttackBonus > 0) {
                const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
                judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                judgmentResult.damageAmount,
                false,
                false,
                judgmentSkill,
                false,
                judgmentIcon,
                null,
                null,
                null,
                false,
                false,
                judgmentText
              )

              // 添加战斗日志
              if (this.addBattleLog) {
                const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
                if (judgmentResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'judgment_accumulation',
                    message: `裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'judgment_accumulation',
                    message: `裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (judgmentAccumulationError) {
          console.error('[AutoBattleService] 裁决积累处理失败:', judgmentAccumulationError)
        }
      }

      // ========== 奥术充能被动：奥术师J技能，普通攻击累计充能值，达到阈值触发附加伤害 ==========
      if (!isMiss && target.currentHealth > 0) {
        try {
          if (isArcaneChargeUnlocked(this.player)) {
            const baseAttack = DamageCalculator.rollAttackDamage(
              Number(this.player.minAttack || 0),
              Number(this.player.maxAttack || 0)
            )
            const arcaneChargeResult = processArcaneChargeOnAttack(this.player, baseAttack)

            // 消耗MP
            if (arcaneChargeResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - arcaneChargeResult.mpConsumed)
            }

            // 触发附加伤害
            if (arcaneChargeResult.triggered && arcaneChargeResult.damageAmount > 0) {
              // 应用附加伤害到怪物
              const nextHealth = Math.max(0, target.currentHealth - arcaneChargeResult.damageAmount)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              // 通过批处理器队列化 TypedArray 更新
              const arcaneTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (arcaneTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(arcaneTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              // 通过 monsterManager.attackTarget 触发伤害数字显示
              const arcaneChargeSkill = getSkill('arcane_master', 'J')
              const arcaneIcon = arcaneChargeSkill?.icon || '/pt/skill_icon/aoshuchongneng.png'

              // 法术连锁触发时使用自定义显示格式：+伤害*倍率倍
              let arcaneText = null
              if (arcaneChargeResult.multiAttackBonus > 0) {
                const multiplier = (arcaneChargeResult.multiAttackBonus / 100).toFixed(1)
                arcaneText = `+${arcaneChargeResult.damageAmount}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                arcaneChargeResult.damageAmount,
                false,
                false,
                arcaneChargeSkill,
                false,
                arcaneIcon,
                null,
                null,
                null,
                false,
                false,
                arcaneText
              )

              // 添加战斗日志
              if (this.addBattleLog) {
                const totalPercent = arcaneChargeResult.damagePercent + arcaneChargeResult.multiAttackBonus
                if (arcaneChargeResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'arcane_charge',
                    message: `奥术充能触发！附加${totalPercent}%攻击力无属性法术伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'arcane_charge',
                    message: `奥术充能触发！附加${arcaneChargeResult.damagePercent}%攻击力无属性法术伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (arcaneChargeError) {
          console.error('[AutoBattleService] 奥术充能处理失败:', arcaneChargeError)
        }

        // ========== 碎思归墟被动：心灵师J技能，普通攻击累计充能值，达到阈值触发附加伤害 ==========
        try {
          if (isMindChargeUnlocked(this.player)) {
            const playerMaxMana = Number(this.player.maxMana || 0)
            const mindChargeResult = processMindChargeOnAttack(this.player, playerMaxMana)

            // 消耗MP
            if (mindChargeResult.mpConsumed > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - mindChargeResult.mpConsumed)
            }

            // 触发附加伤害
            if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
              const nextHealth = Math.max(0, target.currentHealth - mindChargeResult.damageAmount)
              target.currentHealth = nextHealth
              target.healthPercentage = target.maxHealth > 0
                ? (nextHealth / target.maxHealth) * 100
                : 0

              const mindTargetIdx = Number.isFinite(Number(target.index))
                ? Number(target.index)
                : this.monsterManager.monsters.indexOf(target)
              if (mindTargetIdx >= 0) {
                battleMutationBatcher.queueVitalsUpdate(mindTargetIdx, {
                  currentHealth: nextHealth,
                  healthPercentage: target.healthPercentage
                })
              }

              const mindChargeSkill = getSkill('mind_master', 'J')
              const mindIcon = mindChargeSkill?.icon || '/pt/skill_icon/suisiguixu.png'

              let mindText = null
              if (mindChargeResult.multiAttackBonus > 0) {
                const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
                mindText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
              }

              this.monsterManager.attackTarget(
                target,
                mindChargeResult.damageAmount,
                false,
                false,
                mindChargeSkill,
                false,
                mindIcon,
                null,
                null,
                null,
                false,
                false,
                mindText
              )

              if (this.addBattleLog) {
                const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
                if (mindChargeResult.multiAttackBonus > 0) {
                  this.addBattleLog({
                    type: 'mind_charge',
                    message: `碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`,
                    timestamp: Date.now()
                  })
                } else {
                  this.addBattleLog({
                    type: 'mind_charge',
                    message: `碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`,
                    timestamp: Date.now()
                  })
                }
              }
            }
          }
        } catch (mindChargeError) {
          console.error('[AutoBattleService] 碎思归墟处理失败:', mindChargeError)
        }
      }

      if (target.currentHealth <= 0 && !target.isDefeated) {
        target.isDefeated = true
        target.currentHealth = 0
        target.healthPercentage = 0
        const targetIndex = this.monsterManager.monsters.indexOf(target)
        this.monsterManager.handleMonsterDefeated(targetIndex, target)
      }
    } catch (error) {
      console.error('AutoBattleService', '攻击执行失败:', error)
      if (this.onPlayerDamage) {
        this.onPlayerDamage({ error: error.message })
      }
    }
  }

  /**
   * 双刀流被动：执行副手普通攻击
   * 当玩家拥有双刀流能力、已学习P技能、且装备了副手武器时，
   * 每次普通攻击命中后有概率触发副手额外攻击一次。
   * 副手攻击拥有独立的命中、暴击、伤害计算，使用副手武器的属性。
   * @param {Object} target - 被攻击的怪物对象
   */
  performOffhandAttack (target) {
    try {
      if (!target || !this.player) {
        return
      }

      // 检查是否可以触发副手攻击
      if (!canTriggerOffhandAttack(this.player)) {
        return
      }

      // 检查触发概率
      const triggerChance = getOffhandAttackChance(this.player)
      if (triggerChance <= 0 || Math.random() > triggerChance) {
        return
      }

      // 获取副手武器
      const offhandWeapon = getOffhandWeapon(this.player)
      if (!offhandWeapon) {
        return
      }

      // 计算副手武器攻击力范围（应用武器伤害公式 + 50%副手比例）
      const enhancedAttrs = offhandWeapon.StrengthenedAttributes || {}
      const enhanceLevel = Number(
        enhancedAttrs.enhanceLevel ?? offhandWeapon.enhanceLevel ?? 0
      )
      const levelAttrs = enhancedAttrs[String(enhanceLevel)] || {}
      const enhancedMin = Number(enhancedAttrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
      const enhancedMax = Number(enhancedAttrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)

      const processedWeapon =
        Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
          ? applyWeaponDamageFormula({
            ...offhandWeapon,
            minAttack: enhancedMin,
            maxAttack: enhancedMax
          })
          : applyWeaponDamageFormula(offhandWeapon)

      // R技能熟练度：副手武器攻击力额外加成（1级+5%，10级+50%）
      const offhandAtkBonus = getOffhandAttackBonus(this.player)
      const offhandMinAttack = Math.floor((processedWeapon.minAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + offhandAtkBonus))
      const offhandMaxAttack = Math.floor((processedWeapon.maxAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + offhandAtkBonus))

      // 命中判定
      const hitRate = DamageCalculator.calculateHitRate(this.player)
      const isMiss = Math.random() > hitRate

      if (isMiss) {
        // 副手攻击未命中，显示MISS
        const offhandIcon = offhandWeapon?.icon || null
        const monsterIcon = target.icon || null
        this.monsterManager.attackTarget(
          target,
          0,
          false,
          false,
          null,
          true, // isMiss
          offhandIcon,
          monsterIcon,
          null,
          null,
          false,
          true // isOffhand: 副手攻击标记
        )
        return
      }

      // 滚动基础伤害
      let offhandDamage = DamageCalculator.rollAttackDamage(offhandMinAttack, offhandMaxAttack)

      // EX3副手武器倍攻：概率触发倍率乘数（30%概率1.5倍、20%概率2倍、10%概率2.5倍）
      const offhandEx3Multiplier = rollOffhandMasteryEx3Multiplier(this.player)
      if (offhandEx3Multiplier > 1) {
        offhandDamage = Math.floor(offhandDamage * offhandEx3Multiplier)
      }

      // 武器类型加成
      if (offhandWeapon?.subcategory) {
        offhandDamage += DamageCalculator.getWeaponTypeBonus(offhandWeapon.subcategory, this.player)
      }

      // 临时属性加成
      if (this.player.tempStats?.attack) {
        offhandDamage += this.player.tempStats.attack
      }

      // 暴击计算（独立判定）
      const critRate = this.player.criticalRate ?? this.player.critRate
      const isCritical = DamageCalculator.calculateCritical(critRate)
      if (isCritical) {
        const critDamageMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
          this.player.criticalDamage ?? this.player.critDamage
        )
        offhandDamage = (offhandDamage * critDamageMultiplier) >> 0
      }

      // 元素克制计算（使用副手武器的元素属性）
      const offhandElementInfo = DamageCalculator.resolveWeaponElementInfo(offhandWeapon)
      const offhandElementType = offhandElementInfo?.elementKey || null
      const targetElement = target?.elementType ?? target?.element ?? null
      let offhandElementAdvantage = null
      if (offhandElementType && targetElement) {
        const elementMultiplier = DamageCalculator.getElementAdvantageMultiplier(
          offhandElementType,
          targetElement
        )
        offhandElementAdvantage = elementMultiplier
        const playerElementAttack = DamageCalculator.getPlayerElementAttackPercent(
          this.player,
          offhandElementType
        )
        const bonusAttackPercent =
          playerElementAttack > 0 ? playerElementAttack : offhandElementInfo.attackPercent
        if (elementMultiplier > 1 && bonusAttackPercent > 0) {
          const totalMultiplier = elementMultiplier + bonusAttackPercent / 100
          offhandDamage = (offhandDamage * totalMultiplier) >> 0
        } else {
          offhandDamage = (offhandDamage * elementMultiplier) >> 0
        }
      }

      // 等级差修正
      const playerLevel = Number(this.player?.level) || 1
      const monsterLevel = Number(target?.level) || 1
      const levelDiff = monsterLevel - playerLevel
      if (levelDiff > 0) {
        const reduction = Math.min(levelDiff * 0.05, 0.95)
        offhandDamage = Math.max(1, Math.floor(offhandDamage * (1 - reduction)))
      } else if (levelDiff < 0) {
        const increase = Math.min(-levelDiff * 0.05, 1.0)
        offhandDamage = Math.max(1, Math.floor(offhandDamage * (1 + increase)))
      }

      // 减去防御力
      const monsterDefense = target.defense || 0
      offhandDamage = Math.max(1, offhandDamage - monsterDefense)

      // 应用碎甲DEBUFF
      const armorBreakDebuff = target?.armorBreakDebuff
      if (armorBreakDebuff?.active && armorBreakDebuff?.expiresAt > Date.now()) {
        const damageIncrease = Number(armorBreakDebuff.damageIncrease ?? 0)
        if (Number.isFinite(damageIncrease) && damageIncrease > 0) {
          offhandDamage = Math.floor(offhandDamage * (1 + damageIncrease / 100))
        }
      }

      // 应用 PVE 伤害加成
      const pveDamage = Number(this.player?.pveDamage) || 0
      if (pveDamage > 0) {
        offhandDamage = Math.floor(offhandDamage * (1 + pveDamage / 100))
      }

      // 确保伤害有效
      offhandDamage = Math.max(1, offhandDamage)

      // 对目标造成伤害
      if (Number.isFinite(offhandDamage) && offhandDamage > 0) {
        const offhandNextHealth = Math.max(0, (target.currentHealth || 0) - offhandDamage)
        const offhandMaxHealth = target.maxHealth || 0
        const offhandHealthPct = offhandMaxHealth > 0 ? (offhandNextHealth / offhandMaxHealth) * 100 : 0

        target.currentHealth = offhandNextHealth
        target.healthPercentage = Math.max(0, Math.min(100, Math.round(offhandHealthPct)))

        // 通过批处理器队列化 TypedArray 更新
        const offhandTargetIdx = Number.isFinite(Number(target.index)) ? Number(target.index) : -1
        if (offhandTargetIdx >= 0) {
          battleMutationBatcher.queueVitalsUpdate(offhandTargetIdx, {
            currentHealth: offhandNextHealth,
            healthPercentage: offhandHealthPct
          })
        }

        // 副手攻击也触发吸血效果
        applyLifeSteal(this.player, offhandDamage, {
          addBattleLog: this.addBattleLog,
          onPlayerHeal: this.onPlayerHeal
        })
      }

      // 显示副手攻击伤害数字（使用副手武器图标）
      const offhandIcon = offhandWeapon?.icon || null
      const monsterIcon = target.icon || null

      this.monsterManager.attackTarget(
        target,
        offhandDamage,
        isCritical,
        false,
        null,
        false,
        offhandIcon,
        monsterIcon,
        offhandElementType,
        offhandElementAdvantage,
        false,
        true // isOffhand: 副手攻击标记，用于伤害动画左右区分
      )
    } catch (error) {
      console.error('AutoBattleService', '副手攻击执行失败:', error)
    }
  }

  /**
   * 暴风连矢被动：执行双箭额外攻击
   * 爆裂射手W技能 - 被动技能，普通攻击有概率射出双重箭矢
   * 触发概率：1级5%，每级+5%，5级25%
   * 触发后额外射出一支箭矢，造成独立伤害（独立暴击/伤害计算，必定命中）
   * 伤害动画显示格式：暴风连矢图标 + 伤害数值
   * @param {Object} target - 被攻击的怪物对象
   * @returns {void}
   */
  performStormArrowsAttack (target) {
    try {
      if (!target || !this.player) {
        return
      }

      // 仅爆裂射手职业触发
      const playerClass = this.player.class
      if (playerClass !== 'fierce_shooter') {
        return
      }

      // 获取暴风连矢静态技能配置
      const stormArrowsSkill = getSkill('fierce_shooter', 'W')
      if (!stormArrowsSkill || typeof stormArrowsSkill.getTriggerChance !== 'function') {
        console.warn('[StormArrows] 未找到暴风连矢技能配置或 getTriggerChance 方法')
        return
      }

      // 检查玩家是否已学习该技能
      const playerSkill = this.player.skills?.W
      if (!playerSkill) {
        if (isDev) {
          console.log('[StormArrows] 玩家未学习暴风连矢(W技能)，跳过触发')
        }
        return
      }

      // 获取熟练度等级
      const skillLevel = Number(playerSkill.proficiencyLevel || playerSkill.level || 0)
      if (skillLevel < 1) {
        if (isDev) {
          console.log('[StormArrows] 暴风连矢熟练度等级不足:', skillLevel)
        }
        return
      }

      // 检查解锁条件
      const unlockLevel = stormArrowsSkill.unlockLevel || 1
      if (this.player.level < unlockLevel) {
        if (isDev) {
          console.log('[StormArrows] 玩家等级未达标:', this.player.level, '<', unlockLevel)
        }
        return
      }

      // 计算触发概率并判定（叠加暴风连矢EX被动加成）
      let triggerChance = stormArrowsSkill.getTriggerChance(skillLevel)
      // 检查暴风连矢EX被动技能是否已学习，叠加额外触发概率
      const stormExSkill = getSkill('fierce_shooter', 'W_EX')
      const playerStormExSkill = this.player.skills?.W_EX
      if (stormExSkill && typeof stormExSkill.getTriggerChanceBonus === 'function' && playerStormExSkill) {
        const stormExLevel = Number(playerStormExSkill.proficiencyLevel || playerStormExSkill.level || 0)
        if (stormExLevel >= 1) {
          triggerChance += stormExSkill.getTriggerChanceBonus(stormExLevel)
        }
      }
      const triggerPercent = triggerChance / 100
      const randomRoll = Math.random()

      // 概率判定：未触发则返回
      if (randomRoll >= triggerPercent) {
        return
      }

      // === 触发成功，计算额外箭矢伤害（独立暴击/伤害计算，必定命中） ===
      const result = DamageCalculator.calculatePlayerDamage(this.player, target)
      let stormDamage = result.damage
      const isCritical = result.isCritical

      // 额外箭矢必定命中（主手已命中，双重箭矢的第二支箭矢跟随命中）
      if (!Number.isFinite(stormDamage) || stormDamage <= 0) {
        stormDamage = 1
      }

      // 应用伤害到目标
      const nextHealth = Math.max(0, (target.currentHealth || 0) - stormDamage)
      const maxHealth = target.maxHealth || 0
      const healthPct = maxHealth > 0 ? (nextHealth / maxHealth) * 100 : 0

      target.currentHealth = nextHealth
      target.healthPercentage = Math.max(0, Math.min(100, Math.round(healthPct)))

      // 通过批处理器队列化 TypedArray 更新
      const targetIdx = Number.isFinite(Number(target.index)) ? Number(target.index) : -1
      if (targetIdx >= 0) {
        battleMutationBatcher.queueVitalsUpdate(targetIdx, {
          currentHealth: nextHealth,
          healthPercentage: healthPct
        })
      }

      // 吸血效果：额外箭矢也触发吸血
      applyLifeSteal(this.player, stormDamage, {
        addBattleLog: this.addBattleLog,
        onPlayerHeal: this.onPlayerHeal
      })

      // 显示暴风连矢伤害数字（使用暴风连矢技能图标）
      const monsterIcon = target.icon || null
      const weapon = this.player.equipment?.weapon || null
      const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
      const elementType = elementInfo?.elementKey || null
      const targetElement = target?.elementType ?? target?.element ?? null
      const elementAdvantage = DamageCalculator.getElementAdvantageMultiplier(
        elementType,
        targetElement
      )

      // 通过 monsterManager.attackTarget 显示伤害，第5个参数传入暴风连矢 skill 对象
      // DamageNumber.vue 的 iconInfo 函数会优先读取 skill.icon 显示技能图标
      this.monsterManager.attackTarget(
        target,
        stormDamage,
        isCritical,
        false,
        { icon: stormArrowsSkill.icon, name: stormArrowsSkill.name }, // skill 对象，显示暴风连矢图标
        false,          // isMiss
        null,           // weaponIcon（不显示武器图标，优先显示技能图标）
        monsterIcon,
        elementType,
        elementAdvantage,
        false,          // doubleJudgment
        false           // isOffhand
      )

      // 战斗日志
      if (this.addBattleLog) {
        this.addBattleLog({
          type: 'storm_arrows',
          message: `暴风连矢触发！额外箭矢造成 ${stormDamage} 点伤害`,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('AutoBattleService', '暴风连矢触发失败:', error)
    }
  }

  /**
   * 检查并触发被动技能
   * 目前支持：双倍惩戒（骑士R技能）
   */
  checkAndTriggerPassiveSkills () {
    try {
      if (!this.player || !this.player.class) {
        return
      }

      const playerClass = this.player.class
      const monsters = this.monsterManager?.monsters || []

      // 检查骑士/圣殿骑士的双倍惩戒被动技能
      // 圣殿骑士(holy_knight)继承骑士的R被动技能「双倍惩戒」
      if (playerClass === 'knight' || playerClass === 'holy_knight') {
        const passiveSkill = getSkill('knight', 'R')
        if (!passiveSkill) {
          return
        }

        // 检查玩家是否已学习该技能
        // 注意：圣殿骑士的R槽位是「圣盾觉醒」(unlockLevel:170)，不是骑士的「双倍惩戒」(unlockLevel:80)
        // 双倍惩戒是骑士的被动技能，圣殿骑士继承此被动，但player.skills.R指向的是圣盾觉醒
        // 因此对holy_knight不能检查player.skills.R，而应直接检查骑士R技能的解锁等级
        const playerSkill = this.player.skills?.R
        const isDoubleJudgmentLearned = playerClass === 'holy_knight'
          ? isSkillUnlocked(this.player, 'knight', 'R')
          : (playerSkill && Number(playerSkill.proficiencyLevel ?? playerSkill.level ?? 0) >= 1)
        if (!isDoubleJudgmentLearned) {
          return
        }

        // 检查MP是否足够（被动技能manaCost=0时不消耗MP，使用??避免0被||误判为falsy）
        const manaCost = passiveSkill.manaCost ?? 0
        if (manaCost > 0 && this.player.currentMana < manaCost) {
          return
        }

        // 合并静态技能配置和玩家技能等级
        // holy_knight的R槽位是圣盾觉醒，不是双倍惩戒，所以proficiencyLevel默认为1（双倍惩戒maxLevel=1）
        const skillInstance = {
          ...passiveSkill,
          proficiencyLevel: playerClass === 'holy_knight'
            ? 1
            : Number(playerSkill?.proficiencyLevel ?? playerSkill?.level ?? 1)
        }

        // 碎甲圣裁EX3-双倍惩戒强化：当任意目标有碎甲圣裁DEBUFF时，概率*2
        const ex3Multiplier = getArmorBreakEx3DoubleJudgmentMultiplier(this.player)
        if (ex3Multiplier > 0) {
          const hasArmorBreak = monsters.some(m =>
            m && m.currentHealth > 0 && m.armorBreakDebuff &&
            (!m.armorBreakDebuff.expiresAt || m.armorBreakDebuff.expiresAt > Date.now())
          )
          if (hasArmorBreak) {
            const originalCalcChance = skillInstance.calculateDebuffChance
            skillInstance.calculateDebuffChance = function (level) {
              const base = typeof originalCalcChance === 'function' ? originalCalcChance(level) : 25
              return base * ex3Multiplier
            }
          }
        }

        // 调用SkillEffectService应用双倍惩戒DEBUFF
        const service = this.ensureSkillEffectService()
        if (service && typeof service.applyDoubleJudgmentToAllMonsters === 'function') {
          const appliedCount = service.applyDoubleJudgmentToAllMonsters(
            skillInstance,
            monsters,
            this.player,
            {
              addBattleLog: (message, type) => {
                if (this.addBattleLog) {
                  this.addBattleLog({
                    type,
                    message,
                    timestamp: Date.now()
                  })
                }
              }
            }
          )

          // 如果触发了双倍惩戒，消耗MP（被动技能manaCost=0时不消耗）并增加技能熟练度
          if (appliedCount > 0) {
            if (manaCost > 0) {
              this.player.currentMana = Math.max(0, this.player.currentMana - manaCost)
            }

            // 增加技能熟练度
            try {
              const skillsStore = useSkillsStore()
              if (skillsStore && typeof skillsStore.increaseSkillProficiency === 'function') {
                skillsStore.increaseSkillProficiency('R', 1)
              }
            } catch (storeError) {
              console.error('[AutoBattleService] 增加技能熟练度失败:', storeError)
            }
          }
        }
      }
    } catch (error) {
      console.error('AutoBattleService', '检查被动技能失败:', error)
    }
  }

  updateMonsters (newMonsters, preserveDefeatedState = true) {
    this.monsterManager.updateMonsters(newMonsters, preserveDefeatedState)
    this.hasNotifiedAllMonstersDefeated = false

    if (this.timerManager.isRunning && !this.timerManager.isPaused) {
      this.monsterManager.startMonsterAttackLoop()
    }
  }

  updateConfig (newConfig) {
    this.config.update(newConfig, { debounce: false, immediate: true })
    this.timerManager.setIntervals({
      skillCheckInterval: this.config.get('skillCheckInterval'),
      cooldownUpdateInterval: 1000
    })
    this.updateCachedAttackInterval()
  }

  updateSkills (skills) {
    this.skillManager.updateSkills(skills)
  }

  updateSkillService (skillService) {
    this.skillService = skillService || null
    this.skillManager.skillService = this.skillService
    if (this.skillService) {
      this.skillManager.hasWarnedSkillServiceMissing = false
    }
  }

  updateAudioService (audioService) {
    this.audioService = audioService || null
  }

  updatePlayer (player) {
    this.player = player
    this.skillManager.updatePlayer(player)
    this.monsterManager.updatePlayer(player)
    this.updateCachedAttackInterval()
    // 同步更新 DOT 调度器的玩家引用，确保暴击判定使用最新的 criticalRate/criticalDamage
    dotTickScheduler.updatePlayer(player)
  }

  getStatus () {
    return {
      isActive: this.timerManager.isRunning,
      isPaused: this.timerManager.isPaused,
      config: this.config.getAll(),
      timerStats: this.timerManager.getStats(),
      player: this.player
        ? {
          health: `${this.player.currentHealth}/${this.player.maxHealth}`,
          mana: `${this.player.currentMana}/${this.player.maxMana}`,
          attackSpeed: this.player.attackSpeed || 0
        }
        : null,
      attackInterval: this.config.get('baseAttackInterval')
    }
  }

  cleanup () {
    this.stop()
    this.timerManager.stop({ removeVisibilityListener: true })
    this.skillManager.reset()
    this.monsterManager.reset()
    debug('AutoBattleService', '自动战斗服务已清理')
  }

  calculateAttackInterval () {
    return this.calculateBaseAttackInterval()
  }

  /**
   * 计算基础攻击间隔（不考虑性能调整）
   * @returns {number} 基础攻击间隔
   */
  calculateBaseAttackInterval () {
    if (!this.player) {
      return this.config.get('baseAttackInterval')
    }

    const className = String(this.player?.class || '').toLowerCase()
    const useCastSpeed = isCasterClass(className)
    if (useCastSpeed) {
      // 法系施法速度线性映射：0% → 2000ms，200% → 500ms
      const rawCastSpeed = Number(this.player?.decreasedCastingTime ?? 0)
      const normalizedCastSpeed = Number.isFinite(rawCastSpeed) ? rawCastSpeed : 0
      const maxCastSpeed = 2.0
      const clampedCastSpeed = Math.min(Math.max(normalizedCastSpeed, 0), maxCastSpeed)
      const baseInterval = 2000
      const minInterval = Math.max(500, this.config.get('minAttackInterval') || 500)
      const intervalRange = Math.max(0, baseInterval - minInterval)
      return Math.floor(
        Math.max(
          minInterval,
          baseInterval - (clampedCastSpeed / maxCastSpeed) * intervalRange
        )
      )
    }
    const baseInterval = this.config.get('baseAttackInterval')
    const minInterval = this.config.get('minAttackInterval')
    return calculateAttackInterval(
      baseInterval,
      this.player.attackSpeed || 0,
      minInterval,
      100
    )
  }
}

export default AutoBattleService
