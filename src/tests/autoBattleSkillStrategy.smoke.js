import { validateConfig } from '../utils/autoBattleUtils.js'
import { AutoBattleSkillManager } from '../services/autoBattle/AutoBattleSkillManager.js'
import { AutoBattleTimerManager } from '../services/autoBattle/AutoBattleTimerManager.js'

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const defaultConfig = {
  skillSelectionStrategy: 'priority'
}

const clampDefaultConfig = {
  baseAttackInterval: 2000,
  minAttackInterval: 500,
  maxAttackInterval: 5000,
  healthThreshold: 0.3,
  manaThreshold: 0.2,
  recoveryThreshold: 0.3,
  monsterMinLevel: 1,
  monsterMaxLevel: 200,
  monsterDisplayCount: 5,
  monsterRefreshStrategy: 'countdown',
  skillCheckInterval: 1000,
  skillSelectionStrategy: 'priority'
}

const basePlayer = {
  level: 1,
  currentHealth: 100,
  maxHealth: 100,
  currentMana: 100,
  maxMana: 100,
  job: 'Novice',
  className: 'Novice'
}

const skills = [
  {
    id: 'A',
    key: 'A',
    name: 'Skill A',
    type: 'attack',
    damage: 50,
    manaCost: 10,
    cooldown: 0,
    currentCooldown: 0,
    isLocked: false
  },
  {
    id: 'B',
    key: 'B',
    name: 'Skill B',
    type: 'attack',
    damage: 80,
    manaCost: 40,
    cooldown: 0,
    currentCooldown: 0,
    isLocked: false
  },
  {
    id: 'C',
    key: 'C',
    name: 'Skill C',
    type: 'attack',
    damage: 30,
    manaCost: 2,
    cooldown: 0,
    currentCooldown: 0,
    isLocked: false
  }
]

const selectAttackSkillId = strategy => {
  const validated = validateConfig({ skillSelectionStrategy: strategy }, defaultConfig)
  const config = {
    get: key => validated[key]
  }

  const manager = new AutoBattleSkillManager()
  manager.initialize({
    player: { ...basePlayer },
    skills,
    skillService: {
      skills,
      useSkill: () => true
    },
    config,
    gameData: null,
    onSkillUse: null,
    onCooldownUpdate: null
  })

  const availableSkills = manager.getAvailableSkills()
  const selected = manager.findAttackSkill(availableSkills)
  return selected?.id ?? null
}

assert(
  validateConfig({ skillSelectionStrategy: 'not-exists' }, defaultConfig).skillSelectionStrategy ===
    'priority',
  'validateConfig 应将非法 skillSelectionStrategy 回退到 priority'
)

assert(
  validateConfig({ baseAttackInterval: 1 }, clampDefaultConfig).baseAttackInterval === 500,
  'validateConfig 应将过低 baseAttackInterval clamp 到 minAttackInterval'
)
assert(
  validateConfig({ baseAttackInterval: 999999 }, clampDefaultConfig).baseAttackInterval === 5000,
  'validateConfig 应将过高 baseAttackInterval clamp 到 maxAttackInterval'
)

const originalRaf = globalThis.requestAnimationFrame
const originalCancelRaf = globalThis.cancelAnimationFrame
try {
  globalThis.requestAnimationFrame = undefined
  globalThis.cancelAnimationFrame = undefined
  const timerManager = new AutoBattleTimerManager()
  assert(timerManager.frameScheduler?.type === 'timeout', '无 RAF 环境应使用 setTimeout 降级调度')
} finally {
  globalThis.requestAnimationFrame = originalRaf
  globalThis.cancelAnimationFrame = originalCancelRaf
}

assert(selectAttackSkillId('priority') === 'B', 'priority 策略应选择 B')
assert(selectAttackSkillId('highestDamage') === 'B', 'highestDamage 策略应选择 B')
assert(selectAttackSkillId('lowestMana') === 'C', 'lowestMana 策略应选择 C')
assert(selectAttackSkillId('efficiency') === 'C', 'efficiency 策略应选择 C')
