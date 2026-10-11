import { toRaw } from 'vue'
import { calculateSkillBuff, getSkill, SKILL_CONFIG, isSkillUnlocked } from '@/data/skills'
import { useGameStore, useAutoBattleStore } from '@/store'
import { useMonstersStore } from '@/store/monsters'
import { useSkillsStore } from '@/store/skills'
import { useItemsStore } from '@/store/items'
import { calculateElementAdvantage, calculateDotProficiencyBonus, calculateProficiencyBonus, calculateHealProficiencyBonus } from '@/utils/skillUtils'
import { DamageCalculator } from '@/utils/damageCalculator'
import { ELEMENT_TYPE_MAP } from '@/utils/skillConstants'
import { storageService as storageServiceSingleton } from '@/services/StorageService'
import { monsterTransitionBatcher } from '@/services/autoBattle/MonsterTransitionBatcher'
import { debounce } from '@/utils/debounce'
import { dotTickScheduler } from '@/services/autoBattle/DotTickScheduler'
import { applyLifeSteal } from '@/utils/lifeStealHelper'
import { battlePerfMonitor } from '@/utils/performanceMonitor'
import { setBuffDuration } from '@/composables/useGameLoopManager'
import { weaponSkillTriggerService } from '@/services/WeaponSkillTriggerService'
import { SKILL_INFO } from '@/data/SKILL_INFO.js'
import { getStormArrowDamageBonus } from '@/composables/useStormArrowEx'
import { getGaleRapidFireDamageBonus } from '@/composables/useGaleRapidFireEx'
import { getAuraBombDamageBonus } from '@/composables/useAuraBombEx'
import { getNensphereDamageBonus, getNensphereMultiHitInfo } from '@/composables/useNensphereEx'
import { getDragonFistDamageBonus } from '@/composables/useDragonFistEx'
import { getShadowRazeDamageBonus, getShadowRazeCriticalMultiplierInfo } from '@/composables/useShadowRazeEx'
import { getShadowBladeDamageBonus } from '@/composables/useShadowBladeEx'
import { getDeadlyPoisonDamageBonus } from '@/composables/useDeadlyPoisonEx'
import { getThunderHammerDamageBonus, getThunderHammerCriticalMultiplierInfo } from '@/composables/useThunderHammerEx'
import { getAngelWrathMultiHitInfo } from '@/composables/useAngelWrathEx'
import {
  getShieldBashDamageBonus,
  getShieldBashCriticalMultiplierInfo,
  getHolyKnightJudgmentDamageBonus,
  getHolyKnightJudgmentCriticalMultiplierInfo,
  getArmorBreakDamageBonus
} from '@/composables/useHolyKnightEx'
import {
  getArcaneNovaMultiHitInfo,
  getVoidFissionMultiCastInfo
} from '@/composables/useArcaneMasterEx'
import {
  getMindTearMultiCastInfo,
  getMindNovaMultiHitInfo
} from '@/composables/useMindMasterEx'

// storageServiceSingleton 已通过 import 导入
const schedulePersistPlayerData = debounce(playerData => {
  try {
    storageServiceSingleton.savePlayerData(playerData)
  } catch (error) {
    console.error('[SkillEffectService] debounced 持久化玩家数据失败:', error)
  }
}, 300)

/**
 * 神鹰召唤物活跃定时器追踪表
 * 记录当前活跃的神鹰攻击定时器和到期定时器ID，供手动消散时清理
 * @type {{ attackTimer: number|null, expireTimer: number|null }}
 */
const activeEagleTimers = {
  attackTimer: null,
  expireTimer: null
}

const toFiniteNumberOrNull = value => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const pickFiniteNumberMap = (source, keys) => {
  if (!source || typeof source !== 'object') {
    return null
  }
  const output = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const numeric = Number(source[key])
    if (Number.isFinite(numeric)) {
      output[key] = numeric
    }
  }
  return Object.keys(output).length > 0 ? output : null
}

const normalizeElementKey = value => {
  if (typeof value !== 'string') {
    return null
  }
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'none') {
    return null
  }
  if (normalized === 'thunder') {
    return 'electricity'
  }
  return normalized
}

const extractResistanceElementFromDebuffEffect = effect => {
  if (!effect || typeof effect !== 'object') {
    return null
  }

  const direct = normalizeElementKey(effect.element)
  if (direct) {
    return direct
  }

  const type = typeof effect.type === 'string' ? effect.type.trim() : ''
  if (!type) {
    return null
  }
  const match = /^([a-zA-Z]+)ResistanceReduce$/.exec(type)
  if (!match) {
    return null
  }
  return normalizeElementKey(match[1])
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
  return Number(ELEMENT_CODE_BY_NAME[value] ?? 0) || 0
}

/**
 * 技能ID到特效类型映射表
 * key: 技能ID, value: 元素类型（用于 MageSkillEffect 组件渲染）
 * 涵盖魔导士全职业树（1转~3转）、守护使者、骑士、刺客及风暴行者所有攻击技能
 */
const MAGE_SKILL_EFFECT_MAP = Object.freeze({
  // 1转 - 魔导士（单体技能）
  mage_w: 'phantom_fire',   // 灼烈幻火 - 火焰从地面升腾螺旋包裹
  mage_e: 'wind',         // 风之利刃
  mage_r: 'torrent_impact', // 激流冲击 - 猛烈水流横向冲击
  mage_t: 'thunder_storm', // 电闪雷鸣 - 多重闪电+雷鸣冲击波
  mage_y: 'boulder_throw', // 移山之术 - 山峰沿抛物线抛掷飞来
  // 2转 - 元素使者（AOE技能）
  element_mage_w: 'howl_gale',  // 狂风怒吼 - 区域笼罩狂风+风压减速
  element_mage_e: 'meteor_fall', // 陨石坠落 - 天降陨石群+毁灭撞击
  element_mage_r: 'sandstorm_devour', // 风沙吞噬 - 风与土形成的沙暴吞噬漩涡
  element_mage_t: 'electricity', // 风雷狂袭
  element_mage_y: 'water',      // 雪山崩塌
  // 2转 - 精神使者（单体技能）
  spirit_mage_q: 'spirit_mind', // 神念攻击 - 神念凝聚·精神穿刺·精神崩溃
  // 2转 - 精神使者（AOE技能）
  spirit_mage_chaos_seal: 'chaos_seal', // 混沌封印 - 混沌降临·精神牵引·封印爆发·混沌余韵
  // 3转 - 奥术师
  arcane_master_w: 'void_fission',      // 虚空寂灭 - 虚空凝聚·能量压缩·寂灭爆发·虚空消散
  arcane_master_e: 'element_collapse',  // 元素崩坏 - 元素紊乱·元素碰撞·崩坏爆发·元素消散
  arcane_master_u: 'arcane_nova',       // 奥术新星 - 虚空裂隙·能量压缩·新星爆发·余波消散
  // 3转 - 心灵师
  mind_master_w: 'mind_tear',             // 星思坠寂 - 精神凝聚·意识压缩·撕裂释放·精神消散
  mind_master_e: 'consciousness_collapse', // 意识崩塌 - 意识紊乱·精神冲击·崩塌爆发·意识消散
  mind_master_u: 'mind_nova',             // 万绪沉宵 - 心灵凝聚·新星升腾·心爆扩散·余韵消散
  // 守护使者（AOE技能）
  guardian_q: 'divine_domain',    // 神圣领域 - 圣光降临+神圣法阵+梅尔卡巴六芒星
  // 骑士（AOE技能）
  knight_q: 'earth_resonance',     // 大地共鸣 - 地裂共鸣+冲击波环+岩石尖刺+共振能量
  // 刺客（AOE技能）
  assassin_e: 'mockery_blast',     // 戏谑爆破 - 戏谑蓄能·嘲弄印记·核心爆破·能量碎片飞散·戏谑余韵
  assassin_r: 'assassination',     // 暗杀 - 暗影潜行·幻影突袭·致命一击·多倍连斩·暗影消散
  // 圣职者（单体DOT技能）
  priest_q: 'moonlight_punishment',  // 月光惩戒 - 月华凝聚·月光降下·惩戒冲击·月华消散
  // 圣职者（AOE技能）
  priest_r: 'holy_light_earth',       // 圣光大地 - 圣光蓄能·武器坠击·大地碎裂·圣光冲击波·余韵消散
  // 技师（AOE技能）
  technician_w: 'fighting_spirit_storm', // 斗气风暴 - 斗气凝聚·风暴成形·风暴爆发·斗气消散
  // 技师（单体技能）
  technician_e: 'backwater_strike', // 背水一击 - 蓝能枯竭·斗气汇聚·能量凝缩·致命贯穿·余波消散
  // 游侠（AOE技能）
  ranger_t: 'poison_arrow', // 毒箭 - 毒箭坠击·剧毒迸裂·毒雾蔓延·毒素侵蚀·余毒消散
  // 格斗宗师（单体技能）
  combat_master_w: 'kamehameha', // 龟派气功 - 聚气凝神·气功弹成形·能量波发射·命中爆发·余韵消散
  // 格斗宗师（AOE技能）
  combat_master_u: 'nen_energy_bomb', // 念气能量弹 - 念气引导·能量凝聚·投掷飞行·落地爆发·余波消散
  // 暗夜主宰（单体技能）
  joker_emperor_w: 'assassination', // 暗影突袭 - 暗影潜行·幻影突袭·致命一击·暗影消散
  // 暗夜主宰（AOE技能）
  joker_emperor_u: 'mockery_blast', // 暗影之刃 - 暗影凝聚·分身成形·连环斩击·能量碎片飞散·暗影消散
  // 暗夜主宰（DEBUFF技能）
  joker_emperor_e: 'poison_arrow', // 致命毒刃 - 毒刃掷出·剧毒迸裂·毒雾蔓延·毒素侵蚀·余毒消散
  // 炽天使（群体治疗BUFF）
  nature_messenger_q: 'holy_sanctuary',   // 圣光庇护 - 圣光降临·领域展开·治愈涌泉·圣辉消散
  // 炽天使（单体DEBUFF）
  nature_messenger_e: 'holy_judgment',    // 圣光审判 - 天降审判·圣印封刻·虚弱锁链·审判消散
  // 炽天使（群体AOE）
  nature_messenger_u: 'angel_wrath',      // 天使之怒 - 天使降临·神圣光柱·光翼展开·圣光爆发
  // 炽天使（群体防御BUFF）
  nature_messenger_r: 'angel_wings',      // 天使之翼 - 翼展庇护·圣盾凝结·羽毛飞散·圣辉消散
  // 炽天使（单体攻击）
  nature_messenger_t: 'thunder_hammer',    // 雷神之锤 - 雷霆凝聚·天锤降临·雷爆冲击·麻痹余韵
  // 风暴行者（单体技能）
  storm_walker_w: 'storm_blade',           // 狂风绝刃 - 风暴凝聚·双刀成形·贯穿斩击·毁灭爆发·风暴消散
  // 风暴行者（AOE技能）
  storm_walker_u: 'storm_breath_slash',    // 狂风绝息斩 - 风暴领域·连续风刃·绝息斩击·范围爆发·风暴消散
  // 风暴行者（单体DEBUFF技能）
  storm_walker_e: 'storm_mark',             // 风暴印记 - 风暴凝聚·印记铭刻·属性破碎·印记侵蚀·风暴消散
  // 圣殿骑士（单体技能）
  holy_knight_w: 'holy_shield_bash',        // 荣耀之剑 - 圣光凝聚·圣剑成形·荣耀斩击·圣光爆发·余韵消散
  // 圣殿骑士（AOE技能）
  holy_knight_u: 'holy_light_judgment',     // 圣殿裁决 - 圣光降临·裁决法阵·光柱天降·范围爆发·余韵消散
  // 圣殿骑士（单体DEBUFF技能）
  holy_knight_e: 'armor_break_strike'      // 碎甲圣裁 - 圣光凝聚·重武斩击·护甲碎裂·圣裁侵蚀·余韵消散
})

const buildAoeWorkerPayload = (skill, player, monsters, formulaId, skillLevel) => {
  const resolvedSkillId = skill?.id
  const safeSkillId =
    typeof resolvedSkillId === 'string' || typeof resolvedSkillId === 'number'
      ? resolvedSkillId
      : null
  const resolvedSkillKey = skill?.key
  const safeSkillKey =
    typeof resolvedSkillKey === 'string' || typeof resolvedSkillKey === 'number'
      ? resolvedSkillKey
      : null
  const resolvedElement = skill?.element
  const safeElement = typeof resolvedElement === 'string' ? resolvedElement : null
  const resolvedLevel = Number.isFinite(Number(skillLevel)) && Number(skillLevel) > 0 ? Number(skillLevel) : 1

  const proficiencyEffectCandidate =
    skill?.proficiencyEffect && typeof skill.proficiencyEffect === 'object'
      ? skill.proficiencyEffect
      : skill?.proficiency?.effect && typeof skill.proficiency.effect === 'object'
        ? skill.proficiency.effect
        : null
  const proficiencyBase =
    proficiencyEffectCandidate && Number.isFinite(Number(proficiencyEffectCandidate.base))
      ? Number(proficiencyEffectCandidate.base)
      : Number(skill?.damage ?? 0) || 0
  const proficiencyIncrement =
    proficiencyEffectCandidate && Number.isFinite(Number(proficiencyEffectCandidate.increment))
      ? Number(proficiencyEffectCandidate.increment)
      : null
  const proficiency = {
    effect: {
      base: proficiencyBase,
      increment: proficiencyIncrement ?? 0
    }
  }

  const stats = pickFiniteNumberMap(player?.stats, [
    'strength',
    'agility',
    'dexterity',
    'dex',
    'intelligence',
    'constitution',
    'stamina',
    'sta'
  ])
  const equipmentBonuses = pickFiniteNumberMap(player?.equipmentBonuses, [
    'strength',
    'agility',
    'dexterity',
    'intelligence',
    'constitution',
    'stamina'
  ])

  const monstersLength = Array.isArray(monsters) ? monsters.length : 0
  const currentHealths = new Int32Array(monstersLength)
  const maxHealths = new Int32Array(monstersLength)
  const elementCodes = new Uint8Array(monstersLength)
  const defeatedFlags = new Uint8Array(monstersLength)

  for (let index = 0; index < monstersLength; index++) {
    const monster = monsters[index]
    if (!monster) {
      continue
    }
    currentHealths[index] = Number(monster.currentHealth) || 0
    maxHealths[index] = Number(monster.maxHealth) || 0
    elementCodes[index] = toElementCode(monster.element)
    defeatedFlags[index] = monster.isDefeated ? 1 : 0
  }

  const payload = {
    skill: {
      id: safeSkillId,
      key: safeSkillKey,
      formulaId: typeof formulaId === 'string' ? formulaId : null,
      damage: Number(skill?.damage) || 0,
      element: safeElement,
      elementCode: toElementCode(safeElement),
      level: resolvedLevel,
      proficiency
    },
    player: {
      attack: toFiniteNumberOrNull(player?.attack),
      minAttack: toFiniteNumberOrNull(player?.minAttack),
      maxAttack: toFiniteNumberOrNull(player?.maxAttack),
      skillDamage: toFiniteNumberOrNull(player?.skillDamage),
      criticalRate: toFiniteNumberOrNull(player?.criticalRate),
      criticalDamage: toFiniteNumberOrNull(player?.criticalDamage),
      stats,
      equipmentBonuses
    },
    monsters: {
      currentHealths,
      maxHealths,
      elementCodes,
      defeatedFlags
    }
  }

  const transferables = [
    currentHealths.buffer,
    maxHealths.buffer,
    elementCodes.buffer,
    defeatedFlags.buffer
  ]

  return { payload, transferables }
}
// 构建技能计算玩家对象
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
  const baseConstitution =
    Number(stats.constitution ?? stats.stamina ?? stats.sta ?? 0) || 0

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

  // 计算BUFF属性加成（如智力狐狸宠物等）
  const activeBuffs = Array.isArray(rawPlayer.activeBuffs) ? rawPlayer.activeBuffs : []
  const buffStatBonus = calculateBuffStatBonuses(activeBuffs)

  // 应用BUFF属性加成
  stats.strength = (stats.strength || 0) + buffStatBonus.strength
  stats.agility = (stats.agility || 0) + buffStatBonus.agility
  stats.dexterity = (stats.dexterity || 0) + buffStatBonus.dexterity
  stats.intelligence = (stats.intelligence || 0) + buffStatBonus.intelligence
  stats.constitution = (stats.constitution || 0) + buffStatBonus.constitution

  return { ...rawPlayer, attack, stats }
}

/**
 * 获取武器唤醒技能伤害加成
 * 只对一转（unlockLevel 15-59）和二转（unlockLevel >= 60）技能生效
 * @param {Object} skill - 技能对象
 * @param {Object} player - 玩家对象
 * @returns {number} 技能伤害加成百分比
 */
const getWeaponAwakeningDamageBonus = (skill, player) => {
  if (!skill || !player) return 0

  // 检查技能是否是一转或二转技能（unlockLevel >= 15）
  const unlockLevel = skill.unlockLevel || 0
  if (unlockLevel < 15) return 0 // 初心者技能不享受加成

  // 获取装备栏中的武器
  try {
    const itemsStore = useItemsStore()
    if (!itemsStore) return 0

    const equipment = itemsStore.equipment || {}
    const weapon = equipment.weapon

    if (!weapon || !weapon.awakenedSkillData) return 0

    // 获取唤醒技能ID
    const awakenedSkillId = weapon.awakenedSkillData.skillId
    const awakenedValue = weapon.awakenedSkillData.skillValue || 0

    if (!awakenedSkillId || awakenedValue <= 0) return 0

    // 检查唤醒的技能ID是否与当前施放的技能匹配
    // 通过SKILL_INFO查找技能的class属性来确定关联
    const skillInfo = SKILL_INFO[String(awakenedSkillId)]
    if (!skillInfo) return 0

    // 获取当前技能在SKILL_INFO中的信息
    // 需要遍历SKILL_INFO找到匹配的技能名称
    const currentSkillName = skill.name
    const awakenedSkillName = skillInfo.name?.cns || skillInfo.name?.en

    // 如果技能名称匹配，返回伤害加成
    if (currentSkillName && awakenedSkillName && currentSkillName === awakenedSkillName) {
      return awakenedValue
    }

    return 0
  } catch (error) {
    console.error('[SkillEffectService] 获取武器唤醒伤害加成失败:', error)
    return 0
  }
}

/**
 * 从BUFF列表中计算属性加成
 * @param {Array} buffs - BUFF列表
 * @returns {Object} 属性加成对象
 */
const calculateBuffStatBonuses = buffs => {
  const result = {
    strength: 0,
    agility: 0,
    dexterity: 0,
    intelligence: 0,
    constitution: 0
  }

  if (!Array.isArray(buffs) || buffs.length === 0) {
    return result
  }

  // 属性名别名映射
  const paramAliases = {
    intelligence: ['intelligence', 'int'],
    strength: ['strength', 'str'],
    agility: ['agility', 'agi', 'dexterity', 'dex'],
    dexterity: ['dexterity', 'dex', 'agility', 'agi'],
    constitution: ['constitution', 'con', 'sta', 'stamina', 'vit']
  }

  buffs.forEach(buff => {
    if (!buff || typeof buff !== 'object') {
      return
    }

    // 处理 parameter/value 格式的buff（如宠物加成、驯养宠物）
    const param = String(buff.parameter || '').toLowerCase()
    const value = Number(buff.value || buff.add || buff.amount || 0)

    if (param && value > 0) {
      // 遍历属性映射找到匹配
      for (const [attrName, aliases] of Object.entries(paramAliases)) {
        if (aliases.includes(param)) {
          result[attrName] += value
          break
        }
      }
    }

    // 处理 effects 对象格式
    const effects = buff.effects
    if (effects && typeof effects === 'object') {
      Object.entries(effects).forEach(([key, rawValue]) => {
        const keyLower = String(key).toLowerCase()
        const numeric = rawValue && typeof rawValue === 'object'
          ? Number(rawValue.add || 0)
          : Number(rawValue || 0)

        if (numeric > 0) {
          // 遍历属性映射找到匹配
          for (const [attrName, aliases] of Object.entries(paramAliases)) {
            if (aliases.includes(keyLower)) {
              result[attrName] += numeric
              break
            }
          }
        }
      })
    }
  })

  return result
}

const sanitizeForWorker = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) {
    return value
  }

  const valueType = typeof value
  if (valueType === 'function' || valueType === 'symbol') {
    return undefined
  }
  if (valueType === 'bigint') {
    const numeric = Number(value)
    return Number.isFinite(numeric) ? numeric : String(value)
  }
  if (valueType !== 'object') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (value instanceof ArrayBuffer) {
    return value
  }

  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
    return value
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).map(([key, entryValue]) => [
      sanitizeForWorker(key, seen),
      sanitizeForWorker(entryValue, seen)
    ])
  }

  if (value instanceof Set) {
    return Array.from(value.values()).map(entryValue => sanitizeForWorker(entryValue, seen))
  }

  if (Array.isArray(value)) {
    return value.map(entryValue => {
      const sanitized = sanitizeForWorker(entryValue, seen)
      return sanitized === undefined ? null : sanitized
    })
  }

  if (seen.has(value)) {
    return undefined
  }
  seen.add(value)

  const output = {}
  for (const key of Object.keys(value)) {
    const sanitized = sanitizeForWorker(value[key], seen)
    if (sanitized !== undefined) {
      output[key] = sanitized
    }
  }
  return output
}

const AOE_WORKER_FORMULA_IDS = new Set([
  'warrior_r',
  'priest_r',
  'archer_e',
  'blade_warrior_w',
  'element_mage_w',
  'storm_walker_u',
  'arcane_master_w',
  'mind_master_q',
  'fierce_shooter_w',
  'holy_knight_u'
])

/**
 * Worker 模块 URL 映射表
 * 使用 new URL(..., import.meta.url) 静态形式，确保 Vite 能正确识别和打包 Worker
 */
const WORKER_URL_BY_TYPE = Object.freeze({
  aoe: new URL('../workers/AoeWorker.js', import.meta.url).href,
  drop: new URL('../workers/DropWorker.js', import.meta.url).href,
  autoBattleDecision: new URL('../workers/AutoBattleDecisionWorker.js', import.meta.url).href,
  autoBattleMonsterAttackBatch: new URL('../workers/AutoBattleMonsterAttackWorker.js', import.meta.url).href,
  autoBattleSpawnPlan: new URL('../workers/AutoBattleSpawnPlanWorker.js', import.meta.url).href,
  battleEffect: new URL('../workers/BattleEffectWorker.js', import.meta.url).href
})

const workerClients = new Map()

const WORKER_RESULT_FLUSH_BUDGET_MS = 6
const WORKER_RESULT_FLUSH_MAX_PER_TICK = 8
const workerResultQueue = []
let workerResultFlushScheduled = false

const nowMs = () => {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

const scheduleWorkerResultFlush = () => {
  if (workerResultFlushScheduled) {
    return
  }
  workerResultFlushScheduled = true
  const runner = () => flushWorkerResultQueue()
  // 使用 setTimeout(0) 替代 requestAnimationFrame，避免 RAF 违规警告
  setTimeout(runner, 0)
}

const flushWorkerResultQueue = () => {
  workerResultFlushScheduled = false
  const startedAt = nowMs()
  let processed = 0

  while (
    workerResultQueue.length > 0 &&
    processed < WORKER_RESULT_FLUSH_MAX_PER_TICK &&
    nowMs() - startedAt <= WORKER_RESULT_FLUSH_BUDGET_MS
  ) {
    const entry = workerResultQueue.shift()
    if (!entry) {
      processed += 1
      continue
    }

    const { client, requestId, result, error } = entry
    if (!client || !requestId || !client.pending || !client.pending.has(requestId)) {
      processed += 1
      continue
    }

    const handler = client.pending.get(requestId)
    client.pending.delete(requestId)

    if (!handler) {
      processed += 1
      continue
    }

    if (error) {
      handler.reject(new Error(error))
      processed += 1
      continue
    }

    handler.resolve(result)
    processed += 1
  }

  if (workerResultQueue.length > 0) {
    scheduleWorkerResultFlush()
  }
}

const getWorkerClient = type => {
  const workerUrl = WORKER_URL_BY_TYPE[type]
  if (!workerUrl || typeof workerUrl !== 'string') {
    return null
  }
  const cached = workerClients.get(type)
  if (cached) {
    return cached
  }
  if (typeof Worker === 'undefined') {
    return null
  }

  try {
    const worker = new Worker(workerUrl, { type: 'module' })
    const client = {
      type,
      worker,
      requestId: 1,
      pending: new Map()
    }
    worker.onmessage = event => {
      const { requestId, result, error } = event.data || {}
      if (!requestId || !client.pending.has(requestId)) {
        return
      }
      const handler = client.pending.get(requestId)
      if (handler && handler.urgent === true) {
        client.pending.delete(requestId)
        if (error) {
          handler.reject(new Error(error))
          return
        }
        handler.resolve(result)
        return
      }
      workerResultQueue.push({ client, requestId, result, error })
      scheduleWorkerResultFlush()
    }
    worker.onerror = error => {
      console.error(`Worker(${type}) 运行失败:`, error)
    }
    workerClients.set(type, client)
    return client
  } catch (error) {
    console.error(`Worker(${type}) 初始化失败:`, error)
    return null
  }
}

const requestWorker = (type, payload, transferables = null, options = {}) => {
  const client = getWorkerClient(type)
  if (!client) {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const requestId = client.requestId++
    const isUrgent = options?.urgent === true
    client.pending.set(requestId, { resolve, reject, urgent: isUrgent })

    // 超时清理：防止 Worker 无响应时 pending 条目永久残留导致内存泄漏
    const timeoutMs = isUrgent ? 5000 : 10000
    const timeoutHandle = setTimeout(() => {
      if (client.pending.has(requestId)) {
        client.pending.delete(requestId)
        console.warn(`SkillEffectService Worker(${type}) 请求超时(requestId=${requestId})，已自动清理`)
        resolve(null)
      }
    }, timeoutMs)

    // 包装 resolve/reject 以清除超时定时器
    const wrappedResolve = (result) => {
      clearTimeout(timeoutHandle)
      resolve(result)
    }
    const wrappedReject = (error) => {
      clearTimeout(timeoutHandle)
      reject(error)
    }
    client.pending.set(requestId, { resolve: wrappedResolve, reject: wrappedReject, urgent: isUrgent })

    const shouldSanitize = options?.sanitize !== false
    const resolvedPayload = shouldSanitize ? sanitizeForWorker(payload) : payload
    const message = { type, payload: resolvedPayload, requestId }
    if (Array.isArray(transferables) && transferables.length > 0) {
      client.worker.postMessage(message, transferables)
      return
    }
    client.worker.postMessage(message)
  })
}
// 技能效果服务类
export class SkillEffectService {
  static async requestWorker (type, payload, transferables = null, options = {}) {
    try {
      return await requestWorker(type, payload, transferables, options)
    } catch (error) {
      console.error('SkillEffectService', 'Worker请求失败:', error)
      return null
    }
  }

  constructor (audioService) {
    this.audioService = audioService
    /** 是否处于战斗活跃状态，stop 后置 false 阻止异步残留块继续播放音效 */
    this.battleActive = false
  }

  /**
   * 手动消散神鹰召唤物
   * 清理活跃的神鹰攻击定时器和到期定时器，并派发 eagle-summon-disperse 事件
   * 用于 J 面板手动移除神鹰降临 Buff 时同步清理视觉和攻击逻辑
   * @static
   */
  static disperseActiveEagle () {
    if (activeEagleTimers.attackTimer) {
      clearTimeout(activeEagleTimers.attackTimer)
      activeEagleTimers.attackTimer = null
    }
    if (activeEagleTimers.expireTimer) {
      clearTimeout(activeEagleTimers.expireTimer)
      activeEagleTimers.expireTimer = null
    }
    try {
      window.dispatchEvent(new CustomEvent('eagle-summon-disperse'))
    } catch (e) {
      // 忽略事件派发失败
    }
  }
  // 应用技能效果
  async applySkillEffect (skill, player, monsters, activeBuffs, callbacks, skillLevel = null) {
    try {
      if (!skill || !player || !monsters || !callbacks) {
        console.error('applySkillEffect: 缺少必要参数', { skill, player, monsters, callbacks })
        return
      }
      const effectMap = {
        single: () => this.applySingleEffect(skill, player, monsters, callbacks),
        aoe: () => this.applyAoeEffect(skill, player, monsters, callbacks),
        heal: () => this.applyHealEffect(skill, player, callbacks),
        // 神鹰降临虽为buff类型，但使用召唤效果逻辑（显示神鹰组件+攻击敌人）
        buff: () => {
          if (skill?.id === 'fierce_shooter_r' || skill?.name === '神鹰降临') {
            return this.applySummonEffect(skill, player, monsters, callbacks, skillLevel)
          }
          return this.applyBuffEffect(skill, player, activeBuffs, callbacks, skillLevel)
        },
        dot: () => this.applyDotEffect(skill, player, monsters, callbacks),
        debuff: () => this.applyDebuffEffect(skill, player, monsters, callbacks, skillLevel),
        summon: () => this.applySummonEffect(skill, player, monsters, callbacks, skillLevel)
      }
      const effectFn = effectMap[skill.type]
      if (!effectFn) {
        console.warn(`技能 ${skill.name} 类型 ${skill.type} 未实现`)
        callbacks.addBattleLog(`${skill.name} 类型未实现`)
        return
      }
      const effectResult = effectFn()
      if (effectResult && typeof effectResult.then === 'function') {
        await effectResult
      }

      // 技能特效动画事件派发：检测特定技能名称，派发全局事件触发特效动画
      // 怒焰回旋（战士R技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '怒焰回旋') {
        try {
          window.dispatchEvent(new CustomEvent('skill-fury-spin'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 刀剑乱舞（刀锋战士Q技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '刀剑乱舞') {
        try {
          window.dispatchEvent(new CustomEvent('skill-blade-dance'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 冰箭（游侠Q技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '冰箭') {
        try {
          window.dispatchEvent(new CustomEvent('skill-ice-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 火焰箭矢（游侠W技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '火焰箭矢') {
        try {
          window.dispatchEvent(new CustomEvent('skill-fire-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 神鹰-寂灭龙卷风（爆裂射手T技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '神鹰-寂灭龙卷风') {
        try {
          window.dispatchEvent(new CustomEvent('skill-eagle-tornado'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 暴风箭矢（爆裂射手U技能AOE）- 播放音效后立即派发事件触发特效动画
      if (String(skill?.name || '') === '暴风箭矢') {
        try {
          window.dispatchEvent(new CustomEvent('skill-storm-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }
    } catch (error) {
      console.error(`应用技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 使用失败`)
      }
    }
  }

  /**
   * 应用召唤技能效果
   * 召唤神鹰降临，持续时间内神鹰在战场盘旋飞行
   * 攻击行为：仅在自动战斗状态下攻击，每次只攻击1个敌人；非自动战斗状态下仅显示不造成伤害
   * 神鹰属性（攻击间隔、攻击力、暴击率、暴击伤害、生命、魔法值）均按照熟练度等级百分比计算
   * @param {Object} skill - 技能对象
   * @param {Object} player - 玩家对象
   * @param {Array} monsters - 怪物数组
   * @param {Object} callbacks - 回调函数集合
   * @param {number} skillLevel - 技能熟练度等级
   */
  applySummonEffect (skill, player, monsters, callbacks, skillLevel = null) {
    try {
      const resolvedSkillLevel = Number(skillLevel ?? skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel =
        Number.isFinite(resolvedSkillLevel) && resolvedSkillLevel > 0
          ? Math.min(resolvedSkillLevel, 5)
          : 1

      // 计算持续时间
      let duration = skill.buffDuration || 60
      if (typeof skill.calculateDuration === 'function') {
        try {
          duration = skill.calculateDuration(player, safeSkillLevel)
        } catch (e) {
          console.error('[SkillEffectService] 计算召唤持续时间失败:', e)
        }
      }

      // 获取神鹰EX被动技能的熟练度等级，计算额外属性百分比加成
      // 神鹰EX被动技能：1级+5%，每级+5%，10级+50%，叠加到神鹰降临的属性继承百分比上
      let eagleExBonus = 0
      try {
        const skillsStore = useSkillsStore()
        const eagleExSkill = skillsStore?.currentSkills?.find(s => s && s.id === 'fierce_shooter_y')
        if (eagleExSkill) {
          const eagleExLevel = Number(eagleExSkill.proficiencyLevel || eagleExSkill.level || 1)
          const staticEagleEx = getSkill('fierce_shooter', 'Y')
          if (staticEagleEx && typeof staticEagleEx.getStatRatioBonus === 'function') {
            eagleExBonus = staticEagleEx.getStatRatioBonus(eagleExLevel)
          }
        }
      } catch (e) {
        // 神鹰EX技能未加载或未解锁时，加成为0
      }

      // 计算神鹰属性（叠加神鹰EX被动加成）
      let summonStats = null
      if (typeof skill.calculateSummonStats === 'function') {
        try {
          summonStats = skill.calculateSummonStats(player, safeSkillLevel, eagleExBonus)
        } catch (e) {
          console.error('[SkillEffectService] 计算召唤物属性失败:', e)
        }
      }

      const statRatio = typeof skill.calculateStatRatio === 'function'
        ? skill.calculateStatRatio(safeSkillLevel, eagleExBonus)
        : 5 * safeSkillLevel + eagleExBonus

      // 输出战斗日志
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill.name}！神鹰真身降临战场！`)
        callbacks.addBattleLog(`神鹰获得玩家${statRatio}%属性，持续${duration}秒`)
      }

      // 攻击间隔优先使用 summonStats 中按熟练度计算的值
      const attackInterval = summonStats?.attackInterval || skill.summon?.attackInterval || 1500

      // 派发神鹰降临全局事件，携带召唤配置信息
      // MonsterInfoPanel 监听此事件，显示神鹰VUE组件
      try {
        window.dispatchEvent(new CustomEvent('eagle-summon-activate', {
          detail: {
            skillName: skill.name,
            duration: duration * 1000,
            attackInterval,
            summonStats,
            statRatio,
            skillLevel: safeSkillLevel
          }
        }))
      } catch (e) {
        console.error('[SkillEffectService] 派发神鹰降临事件失败:', e)
      }

      // 注册召唤Buff到 player.activeBuffs
      // 让自动战斗系统的 isSkillBuffActive 能正确追踪神鹰活跃状态
      // 神鹰持续期间标记为活跃，避免重复召唤；持续时间结束后自动移除
      try {
        const now = Date.now()
        const summonBuff = {
          id: now,
          name: skill.name,
          description: skill.description || '召唤神鹰真身降临',
          icon: skill.icon || '/pt/skill_icon/shenyingjianglin.png',
          level: safeSkillLevel,
          duration: duration,
          type: 'buff',
          startTime: now,
          addedAt: now,
          expiresAt: now + duration * 1000,
          source: 'skill',
          skillId: skill.id || 'fierce_shooter_r',
          skillKey: skill.key || 'R'
        }
        if (player && Array.isArray(player.activeBuffs)) {
          // 移除同技能的旧Buff（避免重复）
          player.activeBuffs = player.activeBuffs.filter(
            b => !(b && b.skillId === skill.id && b.source === 'skill')
          )
          player.activeBuffs.push(summonBuff)
        } else if (player) {
          player.activeBuffs = [summonBuff]
        }
      } catch (e) {
        console.error('[SkillEffectService] 注册召唤Buff失败:', e)
      }

      // 神鹰攻击逻辑：仅在自动战斗状态下攻击，每次只攻击1个敌人
      // 非自动战斗状态下神鹰仅显示（盘旋飞行），不造成伤害
      // 神鹰攻击力（minAttack~maxAttack随机）、暴击率、暴击伤害均按照熟练度等级百分比计算（来自 summonStats）
      const eagleMinAttack = Number(summonStats?.minAttack)
      const eagleMaxAttack = Number(summonStats?.maxAttack)
      const hasEagleAttackRange = Number.isFinite(eagleMinAttack) && Number.isFinite(eagleMaxAttack)
      const eagleCritRate = summonStats?.critRate || 0.05
      const eagleCritDamage = summonStats?.critDamage || 1.5

      // 启动神鹰攻击定时器
      // 记录到模块级追踪表，供手动消散时清理
      if (activeEagleTimers.attackTimer) {
        clearTimeout(activeEagleTimers.attackTimer)
      }

      // 在闭包外缓存 Store 引用，避免每次回调都调用 useXxxStore() 触发响应式依赖追踪开销
      // 这是 setInterval handler 耗时 280ms+ 的主要原因
      let cachedAutoBattleStore = null
      let cachedMonstersStore = null
      try {
        cachedAutoBattleStore = useAutoBattleStore()
      } catch (e) {
        // autoBattle Store 未加载
      }
      try {
        cachedMonstersStore = useMonstersStore()
      } catch (e) {
        // monsters Store 未加载
      }

      /**
       * 神鹰攻击递归调度函数
       * 使用 setTimeout 递归替代 setInterval，确保上一次攻击完成后才调度下一次
       * 避免回调堆积导致 Chrome Violation 警告（setInterval 不等待回调完成）
       */
      const scheduleEagleAttack = () => {
        activeEagleTimers.attackTimer = setTimeout(() => {
          try {
            // 非自动战斗状态下神鹰不允许攻击敌人（仅显示盘旋，不造成伤害）
            // 直接使用缓存的 store 引用，避免每次回调都调用 useAutoBattleStore()
            const isAutoBattle = cachedAutoBattleStore ? cachedAutoBattleStore.isActive : false
            if (!isAutoBattle) {
              scheduleEagleAttack()
              return
            }

            // 优先从 monstersStore 获取最新怪物列表，避免闭包中 monsters 引用过期
            // 直接使用缓存的 store 引用
            const currentMonsters = cachedMonstersStore ? cachedMonstersStore.currentMonsters : null
            const monsterList = Array.isArray(currentMonsters) && currentMonsters.length > 0
              ? currentMonsters
              : monsters

            if (!monsterList || !Array.isArray(monsterList)) {
              scheduleEagleAttack()
              return
            }

            // 获取所有存活敌人
            const aliveMonsters = monsterList.filter(
              m => m && m.currentHealth > 0 && !m.isDefeated
            )

            if (aliveMonsters.length === 0) {
              scheduleEagleAttack()
              return
            }

            // 神鹰每次只攻击1个敌人（随机选择一个存活敌人）
            const target = aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)]

            // 暴击判定使用神鹰自身的暴击率（按熟练度等级百分比计算）
            const isCritical = Math.random() < eagleCritRate
            // 攻击力在 minAttack~maxAttack 之间随机取值
            let damage
            if (hasEagleAttackRange) {
              damage = Math.floor(eagleMinAttack + Math.random() * (eagleMaxAttack - eagleMinAttack + 1))
            } else {
              // 回退：使用玩家平均攻击力按比例计算
              const fallbackAvg = ((Number(player?.minAttack) || 0) + (Number(player?.maxAttack) || 100)) / 2
              damage = Math.floor(fallbackAvg * statRatio / 100)
            }
            if (isCritical) {
              // 暴击伤害使用神鹰自身的暴击伤害倍率（按熟练度等级百分比计算）
              damage = Math.floor(damage * eagleCritDamage)
            }
            damage = Math.max(1, damage)

            target.currentHealth = Math.max(0, target.currentHealth - damage)
            target.healthPercentage = (target.currentHealth / target.maxHealth) * 100

            const monsterIndex = monsterList.indexOf(target)

            // 同步怪物血量到 monsterVitals TypedArray，确保 Canvas 血条 UI 更新
            // 直接使用缓存的 monstersStore 引用，避免重复调用 useMonstersStore()
            try {
              if (cachedMonstersStore && typeof cachedMonstersStore.applyMonsterVitalsBatchUpdates === 'function') {
                const isDefeated = target.currentHealth <= 0
                cachedMonstersStore.applyMonsterVitalsBatchUpdates([{
                  index: monsterIndex,
                  currentHealth: target.currentHealth,
                  healthPercentage: target.healthPercentage,
                  isDefeated
                }], { updateProxies: false, handleDefeated: true })
              }
            } catch (e) {
              console.error('[SkillEffectService] 同步神鹰攻击血量到 TypedArray 失败:', e)
            }

            // 派发神鹰攻击伤害动画事件，携带目标索引和伤害信息
            // EagleSummonEffect 组件监听此事件，在目标怪物附近显示神鹰图片+伤害动画
            try {
              window.dispatchEvent(new CustomEvent('eagle-attack-damage', {
                detail: {
                  targetIndex: monsterIndex,
                  damage,
                  isCritical
                }
              }))
            } catch (e) {
              // 忽略事件派发失败
            }

            // 检查怪物是否被击败，触发战利品和经验奖励
            if (target.currentHealth <= 0 && !target.isDefeated) {
              target.isDefeated = true
              // 派发怪物击败事件，让 AutoBattleService 处理战利品掉落和经验奖励
              try {
                window.dispatchEvent(new CustomEvent('eagle-monster-defeated', {
                  detail: {
                    targetIndex: monsterIndex,
                    monster: target
                  }
                }))
              } catch (e) {
                // 忽略事件派发失败
              }
            }
          } catch (error) {
            console.error('[SkillEffectService] 神鹰攻击出错:', error)
          }

          // 递归调度下一次攻击（确保上一次完成后才调度，避免回调堆积）
          scheduleEagleAttack()
        }, attackInterval)
      }

      // 启动首次攻击调度
      scheduleEagleAttack()

      // 持续时间结束后清除定时器
      // 记录到期定时器到模块级追踪表，供手动消散时清理
      if (activeEagleTimers.expireTimer) {
        clearTimeout(activeEagleTimers.expireTimer)
      }
      activeEagleTimers.expireTimer = setTimeout(() => {
        // 清理攻击定时器
        if (activeEagleTimers.attackTimer) {
          clearTimeout(activeEagleTimers.attackTimer)
          activeEagleTimers.attackTimer = null
        }
        activeEagleTimers.expireTimer = null
        // 派发神鹰消散事件
        try {
          window.dispatchEvent(new CustomEvent('eagle-summon-disperse'))
        } catch (e) {
          // 忽略事件派发失败
        }
        if (callbacks?.addBattleLog) {
          callbacks.addBattleLog(`${skill.name} 效果消失，神鹰回归天际`)
        }
      }, duration * 1000)

      // 神鹰召唤成功后，增加神鹰EX被动技能的熟练度
      // 神鹰EX被动技能：每次召唤神鹰降临时熟练度+1
      try {
        const skillsStore = useSkillsStore()
        if (skillsStore && typeof skillsStore.increaseSkillProficiency === 'function') {
          // 检查神鹰EX技能是否已解锁（玩家等级 >= 174）
          const eagleExSkill = skillsStore?.currentSkills?.find(s => s && s.id === 'fierce_shooter_y')
          if (eagleExSkill) {
            skillsStore.increaseSkillProficiency('Y', 1)
          }
        }
      } catch (e) {
        console.error('[SkillEffectService] 增加神鹰EX熟练度失败:', e)
      }
    } catch (error) {
      console.error(`应用召唤技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 使用失败`)
      }
    }
  }

  // 应用单体技能效果
  applySingleEffect (skill, player, monsters, callbacks) {
    try {
      // 多段连射技能特殊处理（狂风连射等多箭矢技能）
      if (skill?.multiHit?.enabled) {
        return this.applyMultiHitSingleEffect(skill, player, monsters, callbacks)
      }

      const target = this.findFirstAliveTarget(monsters, {
        preferredTargetIndex: callbacks?.preferredTargetIndex ?? null,
        preferredTargetId: callbacks?.preferredTargetId ?? null
      })

      if (!target) {
        callbacks.addBattleLog(`${skill.name} 没有可攻击的目标`)
        return
      }

      // 派发魔导士技能特效事件（单体技能：在目标容器范围内显示）
      this.dispatchMageSkillEffect(skill, target.index, false)

const damage = this.calculateDamage(skill, player, target.monster)
const isCritical = this.checkCritical(player)

// 神念攻击特殊效果检测
if (skill?.id === 'spirit_mage_q' || skill?.name === '神念攻击') {
const monster = target.monster
const currentHp = monster?.currentHealth ?? 0
const maxHp = monster?.maxHealth ?? 1
// 计算缺失血量百分比用于额外伤害计算
const _missingHpPercent = ((1 - currentHp / maxHp) * 100).toFixed(1)
// 额外伤害基于缺失血量，可用于调试
// const damageBonus = Math.min(parseFloat(_missingHpPercent), 100).toFixed(1)
}

if (isCritical) {
damage.value *= this.getCriticalDamageMultiplier(player, target.monster)
this.playCriticalSFX(player)
}

      let finalDamage = Math.max(1, Math.floor(damage.value))

      // 检查目标是否有双倍惩戒DEBUFF，如果有则伤害翻倍并消耗DEBUFF
      const doubleJudgmentMultiplier = this.consumeDoubleJudgmentDebuff(target.monster)
      const doubleJudgmentTriggered = doubleJudgmentMultiplier > 1
      if (doubleJudgmentTriggered) {
        finalDamage = Math.floor(finalDamage * doubleJudgmentMultiplier)
        if (callbacks?.addBattleLog) {
          callbacks.addBattleLog('双倍惩戒触发！伤害翻倍！', 'debuff')
        }
      }

      // 虚空寂灭EX3-法术连击被动：概率触发倍数伤害（190级解锁）
      // 每次释放虚空寂灭时随机滚动，30%概率2倍、20%概率3倍、10%概率4倍
      let multiCastMultiplier = 1
      if (skill?.id === 'arcane_master_w') {
        try {
          const multiCastInfo = getVoidFissionMultiCastInfo(player)
          if (multiCastInfo.unlocked && multiCastInfo.multiplier > 1) {
            multiCastMultiplier = multiCastInfo.multiplier
            finalDamage = Math.floor(finalDamage * multiCastMultiplier)
          }
        } catch (error) {
          console.error('[SkillEffectService] 虚空寂灭EX3-法术连击触发失败:', error)
        }
      }

      // 星思坠寂EX3-精神连击被动：概率触发倍数伤害（190级解锁）
      // 每次释放星思坠寂时随机滚动，30%概率2倍、20%概率3倍、10%概率4倍
      if (skill?.id === 'mind_master_w') {
        try {
          const mindTearMultiCastInfo = getMindTearMultiCastInfo(player)
          if (mindTearMultiCastInfo.unlocked && mindTearMultiCastInfo.multiplier > 1) {
            multiCastMultiplier = mindTearMultiCastInfo.multiplier
            finalDamage = Math.floor(finalDamage * multiCastMultiplier)
          }
        } catch (error) {
          console.error('[SkillEffectService] 星思坠寂EX3-精神连击触发失败:', error)
        }
      }

      const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
      const targetElement = target?.monster?.elementType ?? target?.monster?.element
      const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)

      target.monster.currentHealth = Math.max(0, target.monster.currentHealth - finalDamage)
      target.monster.healthPercentage =
        (target.monster.currentHealth / target.monster.maxHealth) * 100

      // 吸血效果：单体技能根据伤害和吸血比例恢复玩家生命值
      if (finalDamage > 0) {
        applyLifeSteal(player, finalDamage, {
          addBattleLog: callbacks?.addBattleLog,
          onPlayerHeal: callbacks?.onPlayerHeal
        })
      }

      if (target.monster.currentHealth <= 0) {
        const monster = target.monster
        if (!monster.isDefeated) {
          monster.isDefeated = true
        }
        monster.currentHealth = 0
        monster.healthPercentage = 0
        const hasDefeatedAt = Number.isFinite(Number(monster.defeatedAt))
        if (!monster.fadeTimer && !monster.hideTimer && !hasDefeatedAt && !monster.isHidden) {
          const now = Date.now()
          monster.isFading = false
          monster.isHidden = false
          monster.defeatedAt = now
          // 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
          monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000)
          monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000)
          // Canvas-First：单体击杀不再需要显式 bumpMonstersUiVersion
          // isFading/isHidden 的响应式突变会自动触发 Vue 重渲染
          // Canvas 每帧从 vitals TypedArray 读取最新血量
        }
      }

      callbacks.showDamageNumber(
        target.index,
        finalDamage,
        isCritical,
        false,
        skill,
        false,
        null,
        null,
        false,
        null,
        {
          elementType: resolvedSkillElement,
          elementAdvantage
        },
        null,
        doubleJudgmentTriggered
      )

      if (skill.dotEffect && target.monster.currentHealth > 0) {
        try {
          // [DOT双重暴击修复] DOT基础伤害使用暴击前的基础伤害，避免暴击倍率被重复应用
          // DOT tick 时由 DotTickScheduler 独立判定暴击
          const dotBaseDamage = isCritical
            ? Math.max(1, Math.floor(finalDamage / this.getCriticalDamageMultiplier(player)))
            : finalDamage
          this.applyInlineDotEffect(skill, dotBaseDamage, target.monster, callbacks)
        } catch (error) {
          console.error('[SkillEffectService] 单体技能附加DOT失败:', error)
        }
      }

      this.applyResistanceDebuffToTarget(skill, target.monster, callbacks)

      // 应用碎甲DEBUFF
      if (skill?.debuff?.type === 'armorBreak') {
        this.applyArmorBreakDebuffToTarget(skill, target.monster, player, callbacks)
      }

      // 应用攻击力降低DEBUFF（毒箭等技能）
      if (skill?.debuff?.type === 'attackReduction') {
        this.applyAttackReductionDebuffToTarget(skill, target.monster, callbacks)
      }

      // 应用击晕DEBUFF（星思坠寂等技能）
      if (skill?.debuff?.type === 'stun') {
        this.applyStunDebuffToTarget(skill, target.monster, callbacks)
      }

      // 检查并应用"赛乐的祝福"攻击触发DEBUFF
      this.applySyleBlessingAttackDebuff(player, target.monster, callbacks)

      // 触发武器附加技能（水弹等）
      try {
        const weapon = player?.equipment?.weapon
        if (weapon) {
          weaponSkillTriggerService.triggerWeaponSkill({
            player,
            monster: target.monster,
            monsterIndex: target.index,
            weapon,
            triggerType: 'singleSkill',
            showDamageNumber: callbacks?.showDamageNumber,
            addBattleLog: callbacks?.addBattleLog
          })
        }
      } catch (error) {
        console.error('[SkillEffectService] 单体技能触发武器技能失败:', error)
      }

      // 龟派气功EX3-多段伤害被动：概率触发额外多段伤害（190级解锁）
      // 每次释放龟派气功时随机滚动，30%概率1段、15%概率2段、5%概率3段
      // 1段=多触发一次额外伤害，2段=多触发两次，3段=多触发三次
      //
      // 性能优化：采用与 applyMultiHitSingleEffect 相同的批处理模式
      // - 预计算 calculateDamage 一次（同一技能/玩家/目标结果不变）
      // - 用临时变量跟踪剩余血量，循环结束后一次性更新响应式对象
      // - 批量收集伤害事件，循环结束后统一提交
      // - 吸血和击杀判定在循环结束后统一处理一次
      if (skill?.id === 'combat_master_w' && target.monster.currentHealth > 0) {
        try {
          const multiHitInfo = getNensphereMultiHitInfo(player)
          if (multiHitInfo.unlocked && multiHitInfo.extraHits > 0) {
            const critDamageMultiplier = this.getCriticalDamageMultiplier(player, target.monster)

            // 预计算循环不变量：基础伤害（同一技能/玩家/目标，calculateDamage 结果在循环中不变）
            const baseDamageResult = this.calculateDamage(skill, player, target.monster)
            const baseExtraDamage = baseDamageResult.value

            // 元素克制（与主击共用同一目标，克制关系一致）
            const extraElementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)

            // 用临时变量跟踪目标剩余血量，避免循环内每次修改响应式对象触发多次响应式通知
            const maxHealth = target.monster.maxHealth
            let remainingHealth = target.monster.currentHealth
            let totalExtraDamage = 0
            const damageBatch = []

            // 逐段结算伤害（纯计算，不触发 UI 更新和音效）
            for (let hit = 0; hit < multiHitInfo.extraHits; hit++) {
              // 目标已死亡则停止多段伤害
              if (remainingHealth <= 0) {
                break
              }

              // 每段额外伤害独立判定暴击（基础伤害已预计算，无需重复调用 calculateDamage）
              const extraIsCritical = this.checkCritical(player)
              let extraDamage = baseExtraDamage
              if (extraIsCritical) {
                extraDamage *= critDamageMultiplier
              }
              extraDamage = Math.max(1, Math.floor(extraDamage))

              // 扣减临时血量变量（不直接修改响应式对象）
              remainingHealth = Math.max(0, remainingHealth - extraDamage)
              totalExtraDamage += extraDamage

              // 收集伤害事件到批量数组（不立即触发 UI 更新）
              damageBatch.push({
                targetIndex: target.index,
                damage: extraDamage,
                isCritical: extraIsCritical,
                skill,
                elementInfo: {
                  elementType: resolvedSkillElement,
                  elementAdvantage: extraElementAdvantage
                }
              })
            }

            // 循环结束后一次性更新响应式对象，将 N 次响应式触发降为 1 次
            if (damageBatch.length > 0) {
              target.monster.currentHealth = remainingHealth
              target.monster.healthPercentage =
                maxHealth > 0 ? (remainingHealth / maxHealth) * 100 : 0
            }

            // 吸血效果：基于全部额外伤害统一结算
            if (totalExtraDamage > 0) {
              applyLifeSteal(player, totalExtraDamage, {
                addBattleLog: callbacks?.addBattleLog,
                onPlayerHeal: callbacks?.onPlayerHeal
              })
            }

            // 击杀判定（循环结束后统一处理一次，避免循环内多次调度 fade/hide 定时器）
            if (target.monster.currentHealth <= 0) {
              const monster = target.monster
              if (!monster.isDefeated) {
                monster.isDefeated = true
              }
              monster.currentHealth = 0
              monster.healthPercentage = 0
              const hasDefeatedAt = Number.isFinite(Number(monster.defeatedAt))
              if (!monster.fadeTimer && !monster.hideTimer && !hasDefeatedAt && !monster.isHidden) {
                const now = Date.now()
                monster.isFading = false
                monster.isHidden = false
                monster.defeatedAt = now
                monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000)
                monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000)
              }
            }

            // 批量提交伤害数字（优先使用批量接口减少 UI 更新次数，回退到逐条发送）
            if (damageBatch.length > 0) {
              if (typeof callbacks.showDamageNumberBatch === 'function') {
                callbacks.showDamageNumberBatch(damageBatch, skill)
              } else if (typeof callbacks.showDamageNumber === 'function') {
                for (const evt of damageBatch) {
                  callbacks.showDamageNumber(
                    evt.targetIndex,
                    evt.damage,
                    evt.isCritical,
                    false,
                    evt.skill,
                    false,
                    null,
                    null,
                    false,
                    null,
                    evt.elementInfo,
                    null,
                    false
                  )
                }
              }
            }
          }
        } catch (error) {
          console.error('[SkillEffectService] 龟派气功EX3多段伤害触发失败:', error)
        }
      }
    } catch (error) {
      console.error(`应用单体技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 攻击失败`)
      }
    }
  }

  /**
   * 应用多段连射单体技能效果（狂风连射）
   * 锁定单一目标后发射多支箭矢，每支箭矢独立计算伤害与暴击
   * 全部箭矢发射完毕后统一结算吸血、击杀判定与DEBUFF应用
   * @param {Object} skill - 技能对象（需含 multiHit 配置与 calculateArrowCount 方法）
   * @param {Object} player - 玩家对象
   * @param {Array} monsters - 怪物数组
   * @param {Object} callbacks - 回调函数集合
   */
  applyMultiHitSingleEffect (skill, player, monsters, callbacks) {
    try {
      const target = this.findFirstAliveTarget(monsters, {
        preferredTargetIndex: callbacks?.preferredTargetIndex ?? null,
        preferredTargetId: callbacks?.preferredTargetId ?? null
      })

      if (!target) {
        callbacks.addBattleLog(`${skill.name} 没有可攻击的目标`)
        return
      }

      // 派发技能特效事件（单体技能：在目标容器范围内显示）
      this.dispatchMageSkillEffect(skill, target.index, false)

      // 计算多段连击发射数量（箭矢/拳影等）
      const skillLevel = Number(skill?.level ?? skill?.proficiencyLevel ?? 1)
      let arrowCount = 1
      // 构建包含装备加成和BUFF加成的玩家对象，确保连击数量与技能详情面板计算一致
      const calcPlayerForArrows = buildSkillCalcPlayer(player) || player
      // 优先使用技能对象上的计算方法（支持 calculateArrowCount 和 calculateHitCount 两种命名）
      const countMethod = skill.calculateArrowCount || skill.calculateHitCount
      if (typeof countMethod === 'function') {
        arrowCount = countMethod.call(skill, calcPlayerForArrows, skillLevel)
      } else {
        // 兜底：通过静态技能对象获取计算方法（store 归一化后可能丢失）
        // 根据技能 id 前缀推断职业，避免硬编码 fierce_shooter
        const skillId = String(skill?.id || '')
        const staticClassName = skillId.startsWith('combat_master_') ? 'combat_master' : 'fierce_shooter'
        const staticSkillKey = skill?.key || 'I'
        const staticSkill = getSkill(staticClassName, staticSkillKey)
        const staticCountMethod = staticSkill?.calculateArrowCount || staticSkill?.calculateHitCount
        if (staticSkill && typeof staticCountMethod === 'function') {
          arrowCount = staticCountMethod.call(staticSkill, calcPlayerForArrows, skillLevel)
        }
      }
      // 限制最大箭矢数，防止极端数值导致卡顿
      const maxCount = Number(skill?.multiHit?.maxCount) || 30
      arrowCount = Math.max(1, Math.min(Math.floor(arrowCount), maxCount))

      // 派发狂风连射特效事件（携带目标索引和箭矢数量）
      // MonsterInfoPanel 监听该事件并播放从玩家头像方向聚集连射飞向目标的动画
      try {
        window.dispatchEvent(new CustomEvent('skill-gale-rapid-fire', {
          detail: { targetIndex: target.index, arrowCount }
        }))
      } catch (e) {
        // 忽略事件派发失败
      }

      // 元素加成（所有箭矢共用同一目标，元素克制一致）
      const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
      const targetElement = target?.monster?.elementType ?? target?.monster?.element
      const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)

      // 双倍惩戒：只消耗一次，由第一支箭矢触发伤害翻倍
      const doubleJudgmentMultiplier = this.consumeDoubleJudgmentDebuff(target.monster)
      const doubleJudgmentTriggered = doubleJudgmentMultiplier > 1

      let totalDamage = 0
      let hitCount = 0
      // 批量收集伤害事件，循环结束后统一提交，避免逐支箭矢同步触发 UI 更新阻塞主线程
      const damageBatch = []
      let hasCritical = false

      // 预计算循环不变量：基础伤害、暴击伤害倍率
      // 同一技能、同一玩家、同一目标，calculateDamage 结果在循环中不变，只需计算一次
      const baseDamageResult = this.calculateDamage(skill, player, target.monster)
      const baseArrowDamage = baseDamageResult.value
      const critDamageMultiplier = this.getCriticalDamageMultiplier(player)

      // 用临时变量跟踪目标剩余血量，避免循环内每次修改响应式对象触发多次响应式通知
      const maxHealth = target.monster.maxHealth
      let remainingHealth = target.monster.currentHealth

      // 逐支箭矢结算伤害（纯计算，不触发 UI 更新和音效）
      for (let i = 0; i < arrowCount; i++) {
        // 目标已死亡则停止连射
        if (remainingHealth <= 0) {
          break
        }

        // 每支箭矢独立判定暴击（基础伤害已预计算，无需重复调用 calculateDamage）
        const isCritical = this.checkCritical(player)

        let arrowDamage = baseArrowDamage
        if (isCritical) {
          arrowDamage = arrowDamage * critDamageMultiplier
        }
        arrowDamage = Math.max(1, Math.floor(arrowDamage))

        // 第一支箭矢应用双倍惩戒伤害翻倍
        let doubleJudgmentApplied = false
        if (i === 0 && doubleJudgmentTriggered) {
          arrowDamage = Math.floor(arrowDamage * doubleJudgmentMultiplier)
          doubleJudgmentApplied = true
        }

        // 扣减临时血量变量（不直接修改响应式对象）
        remainingHealth = Math.max(0, remainingHealth - arrowDamage)

        totalDamage += arrowDamage
        hitCount++

        if (isCritical) {
          hasCritical = true
        }

        // 收集伤害事件到批量数组（不立即触发 UI 更新）
        damageBatch.push({
          targetIndex: target.index,
          damage: arrowDamage,
          isCritical,
          skill,
          elementInfo: {
            elementType: resolvedSkillElement,
            elementAdvantage
          },
          doubleJudgment: doubleJudgmentApplied
        })

      }

      // 循环结束后一次性更新响应式对象，将 N 次响应式触发降为 1 次
      if (hitCount > 0) {
        target.monster.currentHealth = remainingHealth
        target.monster.healthPercentage = maxHealth > 0 ? (remainingHealth / maxHealth) * 100 : 0
      }

      if (hitCount === 0) {
        return
      }

      // 循环结束后统一提交：暴击音效只播放一次，伤害数字批量发送
      if (hasCritical) {
        this.playCriticalSFX(player)
      }

      // 优先使用批量回调（减少 UI 更新次数），回退到逐条发送
      if (typeof callbacks.showDamageNumberBatch === 'function') {
        callbacks.showDamageNumberBatch(damageBatch, skill)
      } else if (typeof callbacks.showDamageNumber === 'function') {
        for (const evt of damageBatch) {
          callbacks.showDamageNumber(
            evt.targetIndex,
            evt.damage,
            evt.isCritical,
            false,
            evt.skill,
            false,
            null,
            null,
            false,
            null,
            evt.elementInfo,
            null,
            evt.doubleJudgment
          )
        }
      }

      // 吸血效果：基于全部箭矢总伤害统一结算
      if (totalDamage > 0) {
        applyLifeSteal(player, totalDamage, {
          addBattleLog: callbacks?.addBattleLog,
          onPlayerHeal: callbacks?.onPlayerHeal
        })
      }

      // 击杀判定
      if (target.monster.currentHealth <= 0) {
        const monster = target.monster
        if (!monster.isDefeated) {
          monster.isDefeated = true
        }
        monster.currentHealth = 0
        monster.healthPercentage = 0
        const hasDefeatedAt = Number.isFinite(Number(monster.defeatedAt))
        if (!monster.fadeTimer && !monster.hideTimer && !hasDefeatedAt && !monster.isHidden) {
          const now = Date.now()
          monster.isFading = false
          monster.isHidden = false
          monster.defeatedAt = now
          monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000)
          monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000)
        }
      }

      // 双倍惩戒日志
      if (doubleJudgmentTriggered && callbacks?.addBattleLog) {
        callbacks.addBattleLog('双倍惩戒触发！伤害翻倍！', 'debuff')
      }

      // 连射结算日志
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${skill.name} 连射 ${hitCount} 支箭矢，造成 ${totalDamage.toLocaleString()} 点风系伤害`,
          'skill'
        )
      }

      // 仅在目标存活时应用DOT/DEBUFF与后续触发效果
      if (target.monster.currentHealth > 0) {
        // 应用流血DOT效果（狂风连射等技能）
        // 使用非暴击的总基础伤害（baseArrowDamage × hitCount）作为DOT基础伤害
        // 避免暴击倍率被重复应用（DOT tick 时由 DotTickScheduler 独立判定暴击）
        if (skill.dotEffect) {
          try {
            const dotBaseDamage = Math.max(1, Math.floor(baseArrowDamage * hitCount))
            this.applyInlineDotEffect(skill, dotBaseDamage, target.monster, callbacks)
          } catch (error) {
            console.error('[SkillEffectService] 多段连射附加DOT失败:', error)
          }
        }

        // 应用抗性DEBUFF
        this.applyResistanceDebuffToTarget(skill, target.monster, callbacks)

        // 应用碎甲DEBUFF（复用 armorBreak 机制）
        if (skill?.debuff?.type === 'armorBreak') {
          this.applyArmorBreakDebuffToTarget(skill, target.monster, player, callbacks)
        }

        // 应用攻击力降低DEBUFF
        if (skill?.debuff?.type === 'attackReduction') {
          this.applyAttackReductionDebuffToTarget(skill, target.monster, callbacks)
        }

        // 检查并应用"赛乐的祝福"攻击触发DEBUFF
        this.applySyleBlessingAttackDebuff(player, target.monster, callbacks)
      }

      // 触发武器附加技能（水弹等）
      try {
        const weapon = player?.equipment?.weapon
        if (weapon) {
          weaponSkillTriggerService.triggerWeaponSkill({
            player,
            monster: target.monster,
            monsterIndex: target.index,
            weapon,
            triggerType: 'singleSkill',
            showDamageNumber: callbacks?.showDamageNumber,
            addBattleLog: callbacks?.addBattleLog
          })
        }
      } catch (error) {
        console.error('[SkillEffectService] 多段连射触发武器技能失败:', error)
      }
    } catch (error) {
      console.error(`应用多段连射技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 攻击失败`)
      }
    }
  }
  // 应用区域技能效果
  async applyAoeEffect (skill, player, monsters, callbacks) {
    try {
      // 派发魔导士技能特效事件（AOE技能：在怪物整体容器范围显示）
      this.dispatchMageSkillEffect(skill, 0, true)

      let affectedCount = 0
      let debuffAppliedCount = 0
      const breakdown = {
        payloadBuild: 0,
        workerRoundTrip: 0,
        mainCalcWall: 0,
        mainCalcYield: 0,
        updateWall: 0,
        updateYield: 0,
        updateMutate: 0,
        showWall: 0,
        showYield: 0
      }
      const totalMonsters = monsters.length
      const minFrameBudgetMs = 4
      const maxFrameBudgetMs = 10
      const normalizedLoad = Math.min(1, Math.max(0, totalMonsters / 80))
      const frameBudgetMs =
        maxFrameBudgetMs - (maxFrameBudgetMs - minFrameBudgetMs) * normalizedLoad
      // 使用 setTimeout(0) 替代 requestAnimationFrame 进行让出
      // RAF 回调会被 Chrome 标记为 'requestAnimationFrame' handler 违规
      // setTimeout(0) 的最小延迟约 4ms，天然为渲染帧留出呼吸空间
      const requestFrame = callback => setTimeout(() => callback(performance.now()), 0)

      const pendingUpdates = []
      const pendingDamageEvents = []
      let workerTypedResult = null
      const shouldApplyDebuff = Boolean(skill?.debuff && skill.debuff.effect)

      const hasAnyActiveResistanceDebuff = () => {
        const elementKey = normalizeElementKey(skill?.element)
        if (!elementKey) {
          return false
        }
        const now = Date.now()
        for (let i = 0; i < totalMonsters; i++) {
          const monster = monsters[i]
          const debuffs = monster?.resistanceDebuffs
          if (!debuffs || typeof debuffs !== 'object') {
            continue
          }
          const entry = debuffs[elementKey]
          const expiresAt = Number(entry?.expiresAt ?? 0) || 0
          if (expiresAt > now) {
            return true
          }
        }
        return false
      }

      const runOnMainThread = async () => {
        // 初始让出：确保调用方的同步部分快速返回，不阻塞事件循环
        // 没有这个让出，runOnMainThread 第一批怪物处理会同步执行在调用方的调用栈中
        await new Promise(resolve => requestFrame(resolve))

        const mainCalcStartedAt = performance.now()
        pendingUpdates.length = 0
        pendingDamageEvents.length = 0
        affectedCount = 0
        debuffAppliedCount = 0
        let index = 0
        while (index < totalMonsters) {
          const frameStartedAt = performance.now()
          for (; index < totalMonsters; index++) {
            const monster = monsters[index]
            if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
const damage = this.calculateDamage(skill, player, monster)
const isCritical = this.checkCritical(player)

if (isCritical) {
damage.value *= this.getCriticalDamageMultiplier(player, monster)
this.playCriticalSFX(player)
}

              let finalDamage = Math.max(1, Math.floor(damage.value))

              // 检查目标是否有双倍惩戒DEBUFF，如果有则伤害翻倍并消耗DEBUFF
              const doubleJudgmentMultiplier = this.consumeDoubleJudgmentDebuff(monster)
              const doubleJudgmentTriggered = doubleJudgmentMultiplier > 1
              if (doubleJudgmentTriggered) {
                finalDamage = Math.floor(finalDamage * doubleJudgmentMultiplier)
              }

              const nextHealth = Math.max(0, monster.currentHealth - finalDamage)

              pendingUpdates.push({
                index,
                currentHealth: nextHealth,
                healthPercentage: (nextHealth / monster.maxHealth) * 100
              })
              pendingDamageEvents.push({ index, damage: finalDamage, isCritical, doubleJudgment: doubleJudgmentTriggered })
              affectedCount++

              if (shouldApplyDebuff && this.applyResistanceDebuffToTarget(skill, monster, null)) {
                debuffAppliedCount++
              }

              // 应用攻击速度减少DEBUFF
              if (skill?.debuff?.type === 'attackSpeedReduction') {
                // 将玩家数据附加到skill对象上供计算使用
                const skillWithPlayer = { ...skill, player }
                if (this.applyAttackSpeedDebuffToTarget(skillWithPlayer, monster, null)) {
                  debuffAppliedCount++
                }
              }

              // 应用命中率降低DEBUFF
              if (skill?.debuff?.type === 'hitRateReduction') {
                if (this.applyHitRateReductionDebuffToTarget(skill, monster, null)) {
                  debuffAppliedCount++
                }
              }

              // 应用暴击伤害降低DEBUFF
              if (skill?.debuff?.type === 'critDamageReduction') {
                if (this.applyCritDamageReductionDebuffToTarget(skill, monster, null)) {
                  debuffAppliedCount++
                }
              }

              // 应用击晕DEBUFF
              if (skill?.debuff?.type === 'stun') {
                if (this.applyStunDebuffToTarget(skill, monster, null)) {
                  debuffAppliedCount++
                }
              }

              // 应用攻击力降低DEBUFF（毒箭等技能）
              if (skill?.debuff?.type === 'attackReduction') {
                if (this.applyAttackReductionDebuffToTarget(skill, monster, null)) {
                  debuffAppliedCount++
                }
              }

              // 检查并应用"赛乐的祝福"攻击触发DEBUFF
              this.applySyleBlessingAttackDebuff(player, monster, null)

              // 触发武器附加技能（水弹等）
              try {
                const weapon = player?.equipment?.weapon
                if (weapon && monster.currentHealth > 0) {
                  weaponSkillTriggerService.triggerWeaponSkill({
                    player,
                    monster,
                    monsterIndex: index,
                    weapon,
                    triggerType: 'aoeSkill',
                    showDamageNumber: callbacks?.showDamageNumber,
                    addBattleLog: callbacks?.addBattleLog
                  })
                }
              } catch (error) {
                console.error('[SkillEffectService] AOE技能触发武器技能失败:', error)
              }
            }

            if (performance.now() - frameStartedAt >= frameBudgetMs) {
              index++
              break
            }
          }

          if (index < totalMonsters) {
            const yieldStartedAt = performance.now()
            await new Promise(resolve => {
              requestFrame(resolve)
            })
            breakdown.mainCalcYield += performance.now() - yieldStartedAt
          }
        }
        breakdown.mainCalcWall = performance.now() - mainCalcStartedAt
      }

      let usedWorker = false
      const hasCustomCalc =
        typeof skill?.damageCalculation === 'function' ||
        typeof skill?.calculateDamage === 'function'
      const formulaId = AOE_WORKER_FORMULA_IDS.has(skill?.id) ? skill.id : null
      // 有击晕DEBUFF时也禁用worker，因为需要在主线程处理DEBUFF
      const hasStunDebuff = skill?.debuff?.type === 'stun'
      // 有DOT效果时也禁用worker，因为需要在主线程处理DOT
      const hasDotEffect = Boolean(skill?.dotEffect)
      const canUseWorker = (!hasCustomCalc || Boolean(formulaId)) && !shouldApplyDebuff && !hasAnyActiveResistanceDebuff() && !hasStunDebuff && !hasDotEffect
      if (canUseWorker) {
        try {
          const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
          const payloadStartedAt = performance.now()
          const { payload: workerPayload, transferables } = buildAoeWorkerPayload(
            skill,
            player,
            monsters,
            formulaId,
            skillLevel
          )
          breakdown.payloadBuild = performance.now() - payloadStartedAt
          const workerStartedAt = performance.now()
          const workerResult = await requestWorker('aoe', workerPayload, transferables, {
            sanitize: false
          })
          breakdown.workerRoundTrip = performance.now() - workerStartedAt
          const resolvedAffectedCount = Number(workerResult?.affectedCount ?? 0) || 0
          const hasTypedArrays =
            workerResult &&
            typeof resolvedAffectedCount === 'number' &&
            resolvedAffectedCount >= 0 &&
            workerResult.indices &&
            workerResult.nextHealths &&
            workerResult.damages &&
            workerResult.critFlags &&
            typeof workerResult.indices.length === 'number'

          if (hasTypedArrays) {
            workerTypedResult = workerResult
            affectedCount = resolvedAffectedCount
            usedWorker = true
          } else if (workerResult && Array.isArray(workerResult.pendingUpdates)) {
            pendingUpdates.length = 0
            pendingDamageEvents.length = 0
            pendingUpdates.push(...workerResult.pendingUpdates)
            if (Array.isArray(workerResult.pendingDamageEvents)) {
              pendingDamageEvents.push(...workerResult.pendingDamageEvents)
            }
            affectedCount = Number(workerResult.affectedCount || 0)
            usedWorker = true
          }
        } catch (error) {
          console.error('SkillEffectService', 'AOE Worker 计算失败:', error)
        }
      }

      if (!usedWorker) {
        await runOnMainThread()
      }

      const updateWallStartedAt = performance.now()
      const mutateStartedAt = performance.now()
      const updateTotal = workerTypedResult ? affectedCount : pendingUpdates.length
      const storeBatchThreshold = 80
      let appliedWithStore = false
      let monstersStore = null
      try {
        monstersStore = useMonstersStore()
        if (
          updateTotal > 0 &&
          updateTotal <= storeBatchThreshold &&
          monstersStore &&
          typeof monstersStore.applyMonsterVitalsBatchUpdates === 'function'
        ) {
          const updatesForStore = workerTypedResult
            ? Array.from({ length: updateTotal }, (_, idx) => {
              const targetIndex = Number(workerTypedResult.indices[idx])
              const nextCurrentHealth = Math.max(0, Number(workerTypedResult.nextHealths[idx]) || 0)
              const maxHealth = Number(monsters?.[targetIndex]?.maxHealth ?? 0) || 0
              const nextHealthPercentage =
                maxHealth > 0 ? Math.max(0, Math.min(100, (nextCurrentHealth / maxHealth) * 100)) : 0
              return {
                index: targetIndex,
                currentHealth: nextCurrentHealth,
                healthPercentage: nextHealthPercentage,
                isDefeated: nextCurrentHealth <= 0
              }
            })
            : pendingUpdates

          // 时间切片：将大量怪物更新分摊到多帧，避免单帧阻塞主线程
          // 每块只更新部分怪物的 vitals + 立即触发版本 bump
          // 快照缓存 + v-memo 确保只有当前块的怪物被 patch，其余跳过
          const AOE_CHUNK_SIZE = 10
          if (updatesForStore.length > AOE_CHUNK_SIZE) {
            for (let ci = 0; ci < updatesForStore.length; ci += AOE_CHUNK_SIZE) {
              const chunk = updatesForStore.slice(ci, ci + AOE_CHUNK_SIZE)
              monstersStore.applyMonsterVitalsBatchUpdates(chunk, {
                bumpUiVersion: true,
                updateProxies: true,
                immediate: true
              })
              // 让出主线程：Vue flush + 浏览器 paint + 输入处理
              if (ci + AOE_CHUNK_SIZE < updatesForStore.length) {
                await new Promise(resolve => requestFrame(resolve))
              }
            }
          } else {
            monstersStore.applyMonsterVitalsBatchUpdates(updatesForStore, {
              bumpUiVersion: true,
              updateProxies: true,
              immediate: true
            })
          }
          appliedWithStore = true
        }
      } catch (error) {
        console.error('[SkillEffectService] AOE 批量写回怪物生命值失败:', error)
      }
      breakdown.updateMutate += performance.now() - mutateStartedAt

      if (!appliedWithStore && updateTotal > 0) {
        const updatesForStore = workerTypedResult
          ? Array.from({ length: updateTotal }, (_, idx) => {
            const targetIndex = Number(workerTypedResult.indices[idx])
            const nextCurrentHealth = Math.max(0, Number(workerTypedResult.nextHealths[idx]) || 0)
            const maxHealth = Number(monsters?.[targetIndex]?.maxHealth ?? 0) || 0
            const nextHealthPercentage =
              maxHealth > 0 ? Math.max(0, Math.min(100, (nextCurrentHealth / maxHealth) * 100)) : 0
            return {
              index: targetIndex,
              currentHealth: nextCurrentHealth,
              healthPercentage: nextHealthPercentage,
              isDefeated: nextCurrentHealth <= 0
            }
          })
          : pendingUpdates
        const storeCandidate = monstersStore || useMonstersStore()
        if (storeCandidate && typeof storeCandidate.applyMonsterVitalsBatchUpdates === 'function') {
          storeCandidate.applyMonsterVitalsBatchUpdates(updatesForStore, {
            bumpUiVersion: true,
            updateProxies: true,
            immediate: true
          })
          appliedWithStore = true
        }
      }

      // Canvas-First：AOE 血量更新不再需要 fallback bumpMonstersUiVersion
      // Canvas renderOverlayFrame 每帧直接从 monsterVitals TypedArray 读取最新血量
      breakdown.updateWall = performance.now() - updateWallStartedAt

      const showWallStartedAt = performance.now()
      const showTotal = workerTypedResult ? affectedCount : pendingDamageEvents.length

      // ========== 方案一：批量伤害数字显示优化 ==========
      // 收集所有伤害事件，使用批量回调
      const damageBatch = []
      const dotTargets = []

      // 分块处理伤害数字显示，避免大量怪物时同步循环阻塞主线程
      const SHOW_CHUNK_SIZE = 15
      for (let showChunkStart = 0; showChunkStart < showTotal; showChunkStart += SHOW_CHUNK_SIZE) {
        const showChunkEnd = Math.min(showChunkStart + SHOW_CHUNK_SIZE, showTotal)
        for (let showIndex = showChunkStart; showIndex < showChunkEnd; showIndex++) {
        const damageEvent = workerTypedResult
          ? {
            index: Number(workerTypedResult.indices[showIndex]),
            damage: Number(workerTypedResult.damages[showIndex]),
            isCritical: Boolean(workerTypedResult.critFlags[showIndex])
          }
          : pendingDamageEvents[showIndex]

        const targetMonster = monsters?.[damageEvent.index]
        const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
        const targetElement = targetMonster?.elementType ?? targetMonster?.element
        const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)

        damageBatch.push({
          targetIndex: damageEvent.index,
          damage: damageEvent.damage,
          isCritical: damageEvent.isCritical,
          skill,
          elementInfo: {
            elementType: resolvedSkillElement,
            elementAdvantage
          },
          doubleJudgment: Boolean(damageEvent.doubleJudgment)
        })

        // 吸血效果：AOE技能对每个敌人单独计算吸血
        if (damageEvent.damage > 0) {
          applyLifeSteal(player, damageEvent.damage, {
            addBattleLog: callbacks?.addBattleLog,
            onPlayerHeal: callbacks?.onPlayerHeal
          })
        }

        // 收集需要应用 DOT 的目标
        // [DOT双重暴击修复] DOT基础伤害使用暴击前的基础伤害，避免暴击倍率被重复应用
        if (skill && skill.dotEffect && targetMonster && targetMonster.currentHealth > 0) {
          const critMultiplier = this.getCriticalDamageMultiplier(player, targetMonster)
          const dotBaseDamage = damageEvent.isCritical
            ? Math.max(1, Math.floor(damageEvent.damage / critMultiplier))
            : damageEvent.damage
          dotTargets.push({ monster: targetMonster, damage: dotBaseDamage })
        }
        } // end inner show for-loop
        if (showChunkEnd < showTotal) {
          await new Promise(resolve => requestFrame(resolve))
        }
      } // end show chunk while-loop

      // 批量显示伤害数字 - 优先使用批量接口
      if (damageBatch.length > 0 && typeof callbacks.showDamageNumberBatch === 'function') {
        callbacks.showDamageNumberBatch(damageBatch, skill)
      } else if (damageBatch.length > 0 && typeof callbacks.showDamageNumber === 'function') {
        // 兼容：逐个显示（已优化为单次批量收集后一次性调用）
        for (const evt of damageBatch) {
          callbacks.showDamageNumber(
            evt.targetIndex,
            evt.damage,
            evt.isCritical,
            false,
            evt.skill,
            false,
            null,
            null,
            false,
            null,
            evt.elementInfo,
            null,
            evt.doubleJudgment
          )
        }
      }

      // 分块应用 DOT 效果，避免大量目标时同步循环阻塞主线程
      const DOT_CHUNK_SIZE = 15
      for (let dotChunkStart = 0; dotChunkStart < dotTargets.length; dotChunkStart += DOT_CHUNK_SIZE) {
        const dotChunkEnd = Math.min(dotChunkStart + DOT_CHUNK_SIZE, dotTargets.length)
        for (let dotIdx = dotChunkStart; dotIdx < dotChunkEnd; dotIdx++) {
          const { monster, damage } = dotTargets[dotIdx]
          try {
            // 第一个 DOT 设置回调，后续跳过回调设置
            this.applyInlineDotEffect(skill, damage, monster, callbacks, dotIdx > 0)
          } catch (error) {
            console.error('[SkillEffectService] AOE 附加DOT失败:', error)
            if (callbacks?.addBattleLog) {
              callbacks.addBattleLog(`${skill?.name || '技能'} 的附加持续伤害应用失败`)
            }
          }
        }
        if (dotChunkEnd < dotTargets.length) {
          await new Promise(resolve => requestFrame(resolve))
        }
      }

      breakdown.showWall = performance.now() - showWallStartedAt

      // ========== 性能监控记录 ==========
      battlePerfMonitor.recordAoeEvent({
        monsterCount: affectedCount,
        damageEventCount: damageBatch.length,
        processTime: breakdown.showWall + breakdown.updateWall,
        usedBatch: typeof callbacks.showDamageNumberBatch === 'function'
      })

      if (debuffAppliedCount > 0 && callbacks?.addBattleLog) {
        // 根据DEBUFF类型输出不同的日志
        const debuffType = skill?.debuff?.type
        if (debuffType === 'stun') {
          // 击晕DEBUFF的日志已在 applyStunDebuffToTarget 中输出，这里不重复
        } else if (debuffType === 'armorBreak') {
          // 碎甲DEBUFF的日志已在 applyArmorBreakDebuffToTarget 中输出，这里不重复
        } else if (debuffType === 'attackSpeedReduction') {
          // 攻击速度降低DEBUFF的日志已在 applyAttackSpeedDebuffToTarget 中输出，这里不重复
        } else if (debuffType === 'hitRateReduction') {
          // 命中率降低DEBUFF的日志已在 applyHitRateReductionDebuffToTarget 中输出，这里不重复
        } else if (debuffType === 'critDamageReduction') {
          // 暴击伤害降低DEBUFF的日志已在 applyCritDamageReductionDebuffToTarget 中输出，这里不重复
        } else if (debuffType === 'attackReduction') {
          // 攻击力降低DEBUFF的日志已在 applyAttackReductionDebuffToTarget 中输出，这里不重复
        } else {
          // 其他DEBUFF（如属性抵抗力降低）
          const elementKey = extractResistanceElementFromDebuffEffect(skill?.debuff?.effect)
          const label = elementKey ? (ELEMENT_TYPE_MAP[elementKey] || elementKey) : '未知'
          callbacks.addBattleLog(`${skill?.name || '技能'} 使目标${label}属性抵抗力降低`)
        }
      }

      if (affectedCount === 0) {
        callbacks.addBattleLog(`${skill.name} 没有可攻击的目标`)
      }

      // 天使之怒EX3-多段攻击被动：概率触发多段额外AOE伤害（190级解锁）
      // 每次释放天使之怒时随机滚动，50%概率1段、25%概率2段、10%概率3段
      // 1段=对所有存活敌人多造成一次技能总伤害并显示一次伤害动画，2段=多造成两次，3段=多造成三次
      if (skill?.id === 'nature_messenger_u' && affectedCount > 0) {
        try {
          const multiHitInfo = getAngelWrathMultiHitInfo(player)

          if (multiHitInfo.unlocked && multiHitInfo.extraHits > 0) {
            // 逐段结算额外AOE伤害
            for (let hit = 0; hit < multiHitInfo.extraHits; hit++) {
              const extraDamageBatch = []

              // 遍历所有存活敌人，施加一次完整AOE伤害
              for (let i = 0; i < totalMonsters; i++) {
                const monster = monsters[i]
                if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
                  continue
                }

                // 计算技能总伤害（与主击使用相同的calculateDamage）
                const damageResult = this.calculateDamage(skill, player, monster)
                const extraIsCritical = this.checkCritical(player)
                let extraDamage = damageResult.value
                if (extraIsCritical) {
                  const critMult = this.getCriticalDamageMultiplier(player, monster)
                  extraDamage *= critMult
                }
                extraDamage = Math.max(1, Math.floor(extraDamage))

                // 扣减怪物血量
                monster.currentHealth = Math.max(0, monster.currentHealth - extraDamage)
                monster.healthPercentage = monster.maxHealth > 0
                  ? (monster.currentHealth / monster.maxHealth) * 100
                  : 0

                // 吸血效果
                applyLifeSteal(player, extraDamage, {
                  addBattleLog: callbacks?.addBattleLog,
                  onPlayerHeal: callbacks?.onPlayerHeal
                })

                // 收集伤害事件
                const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
                const targetElement = monster?.elementType ?? monster?.element
                const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)
                extraDamageBatch.push({
                  targetIndex: i,
                  damage: extraDamage,
                  isCritical: extraIsCritical,
                  skill,
                  elementInfo: {
                    elementType: resolvedSkillElement,
                    elementAdvantage
                  }
                })

                // 击杀判定
                if (monster.currentHealth <= 0 && !monster.isDefeated) {
                  monster.isDefeated = true
                  monster.currentHealth = 0
                  monster.healthPercentage = 0
                  const hasDefeatedAt = Number.isFinite(Number(monster.defeatedAt))
                  if (!monster.fadeTimer && !monster.hideTimer && !hasDefeatedAt && !monster.isHidden) {
                    const now = Date.now()
                    monster.isFading = false
                    monster.isHidden = false
                    monster.defeatedAt = now
                    monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000)
                    monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 2000)
                  }
                }
              }

              // 批量显示伤害数字
              if (extraDamageBatch.length > 0 && typeof callbacks.showDamageNumberBatch === 'function') {
                callbacks.showDamageNumberBatch(extraDamageBatch, skill)
              } else if (extraDamageBatch.length > 0 && typeof callbacks.showDamageNumber === 'function') {
                for (const evt of extraDamageBatch) {
                  callbacks.showDamageNumber(
                    evt.targetIndex,
                    evt.damage,
                    evt.isCritical,
                    false,
                    evt.skill,
                    false,
                    null,
                    null,
                    false,
                    null,
                    evt.elementInfo,
                    null,
                    false
                  )
                }
              }

            }
          }
        } catch (error) {
          console.error('[SkillEffectService] 天使之怒EX3多段攻击触发失败:', error)
        }
      }

      // 奥术新星EX3-多段攻击被动：概率触发多段额外AOE伤害（190级解锁）
      // 每次释放奥术新星时随机滚动，30%概率1段、20%概率2段、10%概率3段
      // 1段=对所有存活敌人多造成一次技能总伤害并显示一次伤害动画，2段=多造成两次，3段=多造成三次
      //
      // 性能优化：异步时间切片 + 批处理模式
      // - 预计算每个怪物的基础伤害和元素克制（循环不变量）
      // - 用临时数组跟踪每个怪物的剩余血量，循环结束后一次性更新响应式对象
      // - 批量收集所有段所有怪物的伤害事件，循环结束后统一提交
      // - 吸血和击杀判定在循环结束后统一处理一次
      // - 每段额外攻击之间通过 requestFrame 让出主线程，避免连续同步执行阻塞 UI
      if (skill?.id === 'arcane_master_u' && affectedCount > 0) {
        try {
          const multiHitInfo = getArcaneNovaMultiHitInfo(player)

          if (multiHitInfo.unlocked && multiHitInfo.extraHits > 0) {
            // 预计算循环不变量：技能元素（同一技能下值不变）
            const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null

            // 预计算每个存活怪物的基础伤害和元素克制，避免循环内重复调用 calculateDamage
            const monsterData = []
            for (let i = 0; i < totalMonsters; i++) {
              const monster = monsters[i]
              if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
                continue
              }
              const baseDamageResult = this.calculateDamage(skill, player, monster)
              const targetElement = monster?.elementType ?? monster?.element
              monsterData.push({
                index: i,
                monster,
                baseDamage: baseDamageResult.value,
                critDamageMultiplier: this.getCriticalDamageMultiplier(player, monster),
                elementAdvantage: calculateElementAdvantage(resolvedSkillElement, targetElement),
                maxHealth: monster.maxHealth,
                remainingHealth: monster.currentHealth
              })
            }

            // 让出主线程：预计算阶段完成后 yields，避免与主 AOE 处理累积阻塞
            await new Promise(resolve => requestFrame(resolve))

            // 用临时变量跟踪所有怪物的剩余血量和总额外伤害，避免循环内修改响应式对象
            let totalExtraDamage = 0
            const damageBatch = []

            // 逐段结算额外AOE伤害（纯计算，不触发 UI 更新）
            for (let hit = 0; hit < multiHitInfo.extraHits; hit++) {
              for (const md of monsterData) {
                // 目标已死亡则跳过
                if (md.remainingHealth <= 0) {
                  continue
                }

                // 每段额外伤害独立判定暴击（基础伤害已预计算，无需重复调用 calculateDamage）
                const extraIsCritical = this.checkCritical(player)
                let extraDamage = md.baseDamage
                if (extraIsCritical) {
                  extraDamage *= md.critDamageMultiplier
                }
                extraDamage = Math.max(1, Math.floor(extraDamage))

                // 扣减临时血量变量（不直接修改响应式对象）
                md.remainingHealth = Math.max(0, md.remainingHealth - extraDamage)
                totalExtraDamage += extraDamage

                // 收集伤害事件到批量数组（不立即触发 UI 更新）
                damageBatch.push({
                  targetIndex: md.index,
                  damage: extraDamage,
                  isCritical: extraIsCritical,
                  skill,
                  elementInfo: {
                    elementType: resolvedSkillElement,
                    elementAdvantage: md.elementAdvantage
                  }
                })
              }

              // 每段攻击之间让出主线程，避免多段连击同步执行阻塞 UI 渲染
              if (hit < multiHitInfo.extraHits - 1) {
                await new Promise(resolve => requestFrame(resolve))
              }
            }

            // 循环结束后一次性更新所有怪物的响应式对象，将 N×M 次响应式触发降为 N 次
            // 使用 Store 批量更新接口（与主 AOE 流程一致），利用 Canvas-First 直接从 TypedArray 读取
            const extraUpdates = monsterData
              .filter(md => md.remainingHealth !== md.monster.currentHealth)
              .map(md => ({
                index: md.index,
                currentHealth: md.remainingHealth,
                healthPercentage: md.maxHealth > 0
                  ? (md.remainingHealth / md.maxHealth) * 100
                  : 0,
                isDefeated: md.remainingHealth <= 0
              }))

            if (extraUpdates.length > 0) {
              try {
                const store = useMonstersStore()
                if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
                  const EX3_CHUNK_SIZE = 10
                  if (extraUpdates.length > EX3_CHUNK_SIZE) {
                    for (let ci = 0; ci < extraUpdates.length; ci += EX3_CHUNK_SIZE) {
                      const chunk = extraUpdates.slice(ci, ci + EX3_CHUNK_SIZE)
                      store.applyMonsterVitalsBatchUpdates(chunk, {
                        bumpUiVersion: true,
                        updateProxies: true,
                        immediate: true
                      })
                      if (ci + EX3_CHUNK_SIZE < extraUpdates.length) {
                        await new Promise(resolve => requestFrame(resolve))
                      }
                    }
                  } else {
                    store.applyMonsterVitalsBatchUpdates(extraUpdates, {
                      bumpUiVersion: true,
                      updateProxies: true,
                      immediate: true
                    })
                  }
                } else {
                  // 回退：直接修改响应式对象
                  for (const md of monsterData) {
                    md.monster.currentHealth = md.remainingHealth
                    md.monster.healthPercentage = md.maxHealth > 0
                      ? (md.remainingHealth / md.maxHealth) * 100
                      : 0
                  }
                }
              } catch (_updateError) {
                // 回退：直接修改响应式对象
                for (const md of monsterData) {
                  md.monster.currentHealth = md.remainingHealth
                  md.monster.healthPercentage = md.maxHealth > 0
                    ? (md.remainingHealth / md.maxHealth) * 100
                    : 0
                }
              }
            }

            // 击杀判定（循环结束后统一处理，避免循环内多次调度 fade/hide 定时器）
            for (const md of monsterData) {
              if (md.monster.currentHealth <= 0 && !md.monster.isDefeated) {
                md.monster.isDefeated = true
                md.monster.currentHealth = 0
                md.monster.healthPercentage = 0
                const hasDefeatedAt = Number.isFinite(Number(md.monster.defeatedAt))
                if (!md.monster.fadeTimer && !md.monster.hideTimer && !hasDefeatedAt && !md.monster.isHidden) {
                  const now = Date.now()
                  md.monster.isFading = false
                  md.monster.isHidden = false
                  md.monster.defeatedAt = now
                  md.monster.fadeTimer = monsterTransitionBatcher.scheduleFade(md.monster, 1000)
                  md.monster.hideTimer = monsterTransitionBatcher.scheduleHide(md.monster, 2000)
                }
              }
            }

            // 吸血效果：基于全部额外伤害统一结算
            if (totalExtraDamage > 0) {
              applyLifeSteal(player, totalExtraDamage, {
                addBattleLog: callbacks?.addBattleLog,
                onPlayerHeal: callbacks?.onPlayerHeal
              })
            }

            // 批量提交伤害数字（优先使用批量接口减少 UI 更新次数，回退到逐条发送）
            if (damageBatch.length > 0) {
              if (typeof callbacks.showDamageNumberBatch === 'function') {
                callbacks.showDamageNumberBatch(damageBatch, skill)
              } else if (typeof callbacks.showDamageNumber === 'function') {
                for (const evt of damageBatch) {
                  callbacks.showDamageNumber(
                    evt.targetIndex,
                    evt.damage,
                    evt.isCritical,
                    false,
                    evt.skill,
                    false,
                    null,
                    null,
                    false,
                    null,
                    evt.elementInfo,
                    null,
                    false
                  )
                }
              }
            }
          }
        } catch (error) {
          console.error('[SkillEffectService] 奥术新星EX3多段攻击触发失败:', error)
        }
      }

      // 万绪沉宵EX3-心灵震荡被动：概率触发多段额外AOE伤害（190级解锁）
      // 每次释放万绪沉宵时随机滚动，30%概率1段、20%概率2段、10%概率3段
      // 1段=对所有存活敌人多造成一次技能总伤害并显示一次伤害动画，2段=多造成两次，3段=多造成三次
      //
      // 性能优化：异步时间切片 + 批处理模式（与奥术新星EX3一致）
      // - 预计算每个怪物的基础伤害和元素克制（循环不变量）
      // - 用临时数组跟踪每个怪物的剩余血量，循环结束后一次性更新响应式对象
      // - 批量收集所有段所有怪物的伤害事件，循环结束后统一提交
      // - 吸血和击杀判定在循环结束后统一处理一次
      // - 每段额外攻击之间通过 requestFrame 让出主线程，避免连续同步执行阻塞 UI
      if (skill?.id === 'mind_master_u' && affectedCount > 0) {
        try {
          const mindNovaMultiHitInfo = getMindNovaMultiHitInfo(player)

          if (mindNovaMultiHitInfo.unlocked && mindNovaMultiHitInfo.extraHits > 0) {
            // 预计算循环不变量：技能元素（同一技能下值不变）
            const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null

            // 预计算每个存活怪物的基础伤害和元素克制，避免循环内重复调用 calculateDamage
            const monsterData = []
            for (let i = 0; i < totalMonsters; i++) {
              const monster = monsters[i]
              if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
                continue
              }
              const baseDamageResult = this.calculateDamage(skill, player, monster)
              const targetElement = monster?.elementType ?? monster?.element
              monsterData.push({
                index: i,
                monster,
                baseDamage: baseDamageResult.value,
                critDamageMultiplier: this.getCriticalDamageMultiplier(player, monster),
                elementAdvantage: calculateElementAdvantage(resolvedSkillElement, targetElement),
                maxHealth: monster.maxHealth,
                remainingHealth: monster.currentHealth
              })
            }

            // 让出主线程：预计算阶段完成后 yields，避免与主 AOE 处理累积阻塞
            await new Promise(resolve => requestFrame(resolve))

            // 用临时变量跟踪所有怪物的剩余血量和总额外伤害，避免循环内修改响应式对象
            let totalExtraDamage = 0
            const damageBatch = []

            // 逐段结算额外AOE伤害（纯计算，不触发 UI 更新）
            for (let hit = 0; hit < mindNovaMultiHitInfo.extraHits; hit++) {
              for (const md of monsterData) {
                // 目标已死亡则跳过
                if (md.remainingHealth <= 0) {
                  continue
                }

                // 每段额外伤害独立判定暴击（基础伤害已预计算，无需重复调用 calculateDamage）
                const extraIsCritical = this.checkCritical(player)
                let extraDamage = md.baseDamage
                if (extraIsCritical) {
                  extraDamage *= md.critDamageMultiplier
                }
                extraDamage = Math.max(1, Math.floor(extraDamage))

                // 扣减临时血量变量（不直接修改响应式对象）
                md.remainingHealth = Math.max(0, md.remainingHealth - extraDamage)
                totalExtraDamage += extraDamage

                // 收集伤害事件到批量数组（不立即触发 UI 更新）
                damageBatch.push({
                  targetIndex: md.index,
                  damage: extraDamage,
                  isCritical: extraIsCritical,
                  skill,
                  elementInfo: {
                    elementType: resolvedSkillElement,
                    elementAdvantage: md.elementAdvantage
                  }
                })
              }

              // 每段攻击之间让出主线程，避免多段连击同步执行阻塞 UI 渲染
              if (hit < mindNovaMultiHitInfo.extraHits - 1) {
                await new Promise(resolve => requestFrame(resolve))
              }
            }

            // 循环结束后一次性更新所有怪物的响应式对象，将 N×M 次响应式触发降为 N 次
            const extraUpdates = monsterData
              .filter(md => md.remainingHealth !== md.monster.currentHealth)
              .map(md => ({
                index: md.index,
                currentHealth: md.remainingHealth,
                healthPercentage: md.maxHealth > 0
                  ? (md.remainingHealth / md.maxHealth) * 100
                  : 0,
                isDefeated: md.remainingHealth <= 0
              }))

            if (extraUpdates.length > 0) {
              try {
                const store = useMonstersStore()
                if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
                  const MIND_NOVA_CHUNK_SIZE = 10
                  if (extraUpdates.length > MIND_NOVA_CHUNK_SIZE) {
                    for (let ci = 0; ci < extraUpdates.length; ci += MIND_NOVA_CHUNK_SIZE) {
                      const chunk = extraUpdates.slice(ci, ci + MIND_NOVA_CHUNK_SIZE)
                      // handleDefeated: false —— 不在 EX3 内同步调度 fade/hide 定时器
                      // 死亡过渡（fadeTimer/hideTimer）由下游 markDefeatedBatch 统一处理
                      // 避免重复调度 + 减少当前宏任务的同步工作量
                      store.applyMonsterVitalsBatchUpdates(chunk, {
                        bumpUiVersion: true,
                        updateProxies: true,
                        immediate: true,
                        handleDefeated: false
                      })
                      if (ci + MIND_NOVA_CHUNK_SIZE < extraUpdates.length) {
                        await new Promise(resolve => requestFrame(resolve))
                      }
                    }
                  } else {
                    store.applyMonsterVitalsBatchUpdates(extraUpdates, {
                      bumpUiVersion: true,
                      updateProxies: true,
                      immediate: true,
                      handleDefeated: false
                    })
                  }
                } else {
                  // 回退：直接修改响应式对象
                  for (const md of monsterData) {
                    md.monster.currentHealth = md.remainingHealth
                    md.monster.healthPercentage = md.maxHealth > 0
                      ? (md.remainingHealth / md.maxHealth) * 100
                      : 0
                  }
                }
              } catch (_updateError) {
                // 回退：直接修改响应式对象
                for (const md of monsterData) {
                  md.monster.currentHealth = md.remainingHealth
                  md.monster.healthPercentage = md.maxHealth > 0
                    ? (md.remainingHealth / md.maxHealth) * 100
                    : 0
                }
              }
            }

            // 让出主线程后再提交 UI 更新，避免伤害数字 + 吸血结算阻塞当前宏任务
            await new Promise(resolve => requestFrame(resolve))

            // 吸血效果：基于全部额外伤害统一结算
            if (totalExtraDamage > 0) {
              applyLifeSteal(player, totalExtraDamage, {
                addBattleLog: callbacks?.addBattleLog,
                onPlayerHeal: callbacks?.onPlayerHeal
              })
            }

            // 批量提交伤害数字（优先使用批量接口减少 UI 更新次数，回退到逐条发送）
            if (damageBatch.length > 0) {
              if (typeof callbacks.showDamageNumberBatch === 'function') {
                callbacks.showDamageNumberBatch(damageBatch, skill)
              } else if (typeof callbacks.showDamageNumber === 'function') {
                for (const evt of damageBatch) {
                  callbacks.showDamageNumber(
                    evt.targetIndex,
                    evt.damage,
                    evt.isCritical,
                    false,
                    evt.skill,
                    false,
                    null,
                    null,
                    false,
                    null,
                    evt.elementInfo,
                    null,
                    false
                  )
                }
              }
            }
          }
        } catch (error) {
          console.error('[SkillEffectService] 万绪沉宵EX3心灵震荡触发失败:', error)
        }
      }
    } catch (error) {
      console.error(`应用AOE技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 攻击失败`)
      }
    }
  }
  // 应用治疗技能效果
  applyHealEffect (skill, player, callbacks) {
    try {
      const healAmount = this.calculateHeal(skill, player)
      const isCritical = this.checkCritical(player)

      let finalHealAmount = healAmount
      if (isCritical) {
        finalHealAmount = Math.floor(healAmount * this.getCriticalDamageMultiplier(player))
        this.playCriticalSFX(player)
      }

      player.currentHealth = Math.min(player.maxHealth, player.currentHealth + finalHealAmount)

      // callbacks.addBattleLog(`使用 ${skill.name} 回复了 ${finalHealAmount} 点生命值`)
      callbacks.showDamageNumber(-1, finalHealAmount, isCritical, true, skill)

      // 治疗术特效动画事件派发：圣职者W技能治疗时触发圣光治愈特效
      if (skill?.id === 'priest_w' || skill?.type === 'heal') {
        try {
          window.dispatchEvent(new CustomEvent('skill-heal'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }
    } catch (error) {
      console.error(`应用治疗技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 治疗失败`)
      }
    }
  }
  // 应用增益技能效果
  applyBuffEffect (skill, player, activeBuffs, callbacks, skillLevel = null) {
    try {
      // 快速提取关键参数，立即返回避免阻塞
      const resolvedSkillLevel = Number(skillLevel ?? skill?.proficiencyLevel ?? skill?.level ?? 1)
      const className = skill?.class || player?.class
      const skillName = skill?.name || '未知技能'
      const skillIcon = skill?.icon || ''
      const skillId = skill?.id || null
      const skillKey = skill?.key || null

      // 立即输出战斗日志，让用户感知响应
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skillName} 激活！`)
      }

      // 派发魔导士技能特效事件（BUFF技能：在怪物整体容器范围显示）
      this.dispatchMageSkillEffect(skill, 0, true)

      // 将所有繁重计算延迟到 setTimeout(0)，避免阻塞 UI
      // 原先使用 requestAnimationFrame，但 Chrome 会将 RAF 回调中的长任务标记为违规
      setTimeout(() => {
        try {
          const safeSkillLevel =
            Number.isFinite(resolvedSkillLevel) && resolvedSkillLevel > 0
              ? Math.min(resolvedSkillLevel, 20)
              : 1

          const normalizedSkillId = String(skillId || '')
          const normalizedSkillKey = String(skillKey || '')
          const normalizedSkillName = String(skillName || '')
          const isAbsoluteDodge =
            normalizedSkillId === 'archer_w' || (normalizedSkillKey === 'W' && normalizedSkillName === '绝对闪避')
          const isArcherWeaponMastery =
            normalizedSkillId === 'archer_q' || (normalizedSkillKey === 'Q' && className === 'archer')
          const buffOverride = isArcherWeaponMastery
            ? {
              attackMin: 5 * safeSkillLevel,
              attackMax: 10 * safeSkillLevel
            }
            : isAbsoluteDodge
              ? {
                  blockRate: {
                    add: safeSkillLevel, // 每级增加1%格挡率
                    rate: true // 表示这是百分比值
                  }
                }
              : null

          // 计算 BUFF 效果
          const calculatedBuff =
            buffOverride || calculateSkillBuff(className, skillKey, resolvedSkillLevel, player)
          const resolvedEffects = {}

          // 处理全能祝福等多重增益技能
          if (skillName === '全能祝福' || skill?.proficiency?.effect?.type === 'multi_buff') {
            const staticSkill = getSkill(className, skillKey) || skill
            const subSkills = staticSkill.proficiency?.effect?.subSkills

            if (subSkills) {
              Object.entries(subSkills).forEach(([key, subSkill]) => {
                let value = 0
                if (subSkill.base !== undefined) {
                  const base = Number(subSkill.base)
                  const increment = Number(subSkill.increment || 0)
                  const val = base + increment * (resolvedSkillLevel - 1)
                  value = subSkill.max ? Math.min(val, subSkill.max) : val
                }

                if (value > 0) {
                  resolvedEffects[key] = {
                    add: value,
                    rate: subSkill.rate,
                    description: subSkill.description,
                    type: subSkill.type
                  }
                }
              })
            }
          }

          if (calculatedBuff && typeof calculatedBuff === 'object' && !Array.isArray(calculatedBuff)) {
            const staticSkillDef = getSkill(className, skillKey)
            const skillEffectConfig = staticSkillDef?.proficiency?.effect || skill?.proficiency?.effect || skill?.effect || {}

            // 需要从 calculatedBuff 中排除的非效果字段
            // maxAbsorbDamage/currentAbsorbDamage/absorbPercent 为护盾机制字段，不作为效果显示
            const nonEffectKeys = new Set(['duration', 'expiresAt', 'startTime', 'addedAt', 'maxAbsorbDamage', 'currentAbsorbDamage', 'absorbPercent'])

            Object.entries(calculatedBuff).forEach(([key, rawValue]) => {
              // 跳过非效果字段
              if (nonEffectKeys.has(key)) {
                return
              }

              // 检查 rawValue 是否是包含 rate 的对象
              if (rawValue && typeof rawValue === 'object' && 'rate' in rawValue) {
                // 直接使用对象格式，保留 add 和 rate
                resolvedEffects[key] = {
                  add: Number(rawValue.add ?? rawValue.value ?? rawValue.amount ?? rawValue.bonus ?? 0),
                  rate: Boolean(rawValue.rate)
                }
                return
              }

              const raw =
                rawValue && typeof rawValue === 'object'
                  ? rawValue.value ?? rawValue.amount ?? rawValue.add ?? rawValue.bonus ?? rawValue
                  : rawValue
              const numeric = Number(raw)
              if (Number.isFinite(numeric)) {
                if (resolvedEffects[key] && typeof resolvedEffects[key] === 'object' && resolvedEffects[key].add !== undefined) {
                  return
                }

                const effectConfig = skillEffectConfig[key]
                let rateValue = undefined
                if (effectConfig && typeof effectConfig === 'object' && 'rate' in effectConfig) {
                  rateValue = Boolean(effectConfig.rate)
                } else if ('rate' in skillEffectConfig && typeof skillEffectConfig.rate === 'boolean') {
                  rateValue = Boolean(skillEffectConfig.rate)
                }

                if (rateValue !== undefined) {
                  resolvedEffects[key] = {
                    add: numeric,
                    rate: rateValue
                  }
                } else {
                  resolvedEffects[key] = numeric
                }
              }
            })
          }

          const resolvedNumericBuff = Number(calculatedBuff)
          const resolvedParameter =
            skill?.proficiencyEffect?.type || skill?.effectType || skill?.buffType || ''

          const now = Date.now()
          const resolvedDescription =
            typeof skill?.description === 'string'
              ? skill.description
              : typeof skill?.effect === 'string'
                ? skill.effect
                : ''
          const hasResolvedEffects = Object.keys(resolvedEffects).length > 0

          const allEffectsHaveRate = hasResolvedEffects && Object.values(resolvedEffects).every(
            v => typeof v === 'object' && v !== null && 'rate' in v
          )
          const resolvedEffectsRate = hasResolvedEffects && !allEffectsHaveRate && skill?.buffRate === true ? true : undefined

          // 计算完整智力值（包含装备加成和Buff加成）
          const baseIntelligence = Number(player?.stats?.intelligence) || 0
          const equipmentIntBonus = Number(player?.equipmentBonuses?.intelligence) || 0
          let buffIntBonus = 0
          const activeBuffsForInt = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
          for (let i = 0; i < activeBuffsForInt.length; i++) {
            const buff = activeBuffsForInt[i]
            if (!buff || typeof buff !== 'object') { continue }
            const param = String(buff.parameter || '').toLowerCase()
            if (param === 'int' || param === 'intelligence') {
              buffIntBonus += Number(buff.value || buff.add || buff.amount || 0)
            }
            const effects = buff.effects
            if (effects && typeof effects === 'object') {
              const keys = Object.keys(effects)
              for (let j = 0; j < keys.length; j++) {
                const key = keys[j]
                const keyLower = String(key).toLowerCase()
                if (keyLower === 'intelligence' || keyLower === 'int') {
                  const rawValue = effects[key]
                  const numeric = rawValue && typeof rawValue === 'object'
                    ? Number(rawValue.add || 0)
                    : Number(rawValue || 0)
                  if (Number.isFinite(numeric)) {
                    buffIntBonus += numeric
                  }
                }
              }
            }
          }
          const totalIntelligence = baseIntelligence + equipmentIntBonus + buffIntBonus

          // 计算完整体质值（包含装备加成和Buff加成）- 用于精神使者能量反弹等技能
          const baseConstitution = Number(player?.stats?.constitution || player?.stats?.sta) || 0
          const equipmentStaBonus = Number(player?.equipmentBonuses?.constitution || player?.equipmentBonuses?.sta) || 0
          let buffStaBonus = 0
          const activeBuffsForSta = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
          for (let i = 0; i < activeBuffsForSta.length; i++) {
            const buff = activeBuffsForSta[i]
            if (!buff || typeof buff !== 'object') { continue }
            const param = String(buff.parameter || '').toLowerCase()
            if (param === 'sta' || param === 'constitution') {
              buffStaBonus += Number(buff.value || buff.add || buff.amount || 0)
            }
            const effects = buff.effects
            if (effects && typeof effects === 'object') {
              const keys = Object.keys(effects)
              for (let j = 0; j < keys.length; j++) {
                const key = keys[j]
                const keyLower = String(key).toLowerCase()
                if (keyLower === 'constitution' || keyLower === 'sta') {
                  const rawValue = effects[key]
                  const numeric = rawValue && typeof rawValue === 'object'
                    ? Number(rawValue.add || 0)
                    : Number(rawValue || 0)
                  if (Number.isFinite(numeric)) {
                    buffStaBonus += numeric
                  }
                }
              }
            }
          }
          const totalConstitution = baseConstitution + equipmentStaBonus + buffStaBonus

          // 计算完整敏捷值（包含装备加成和Buff加成）- 用于暗杀者萝丽安的祝福等技能
          const baseAgility = Number(player?.stats?.agility || player?.stats?.dex) || 0
          const equipmentAgiBonus = Number(player?.equipmentBonuses?.agility || player?.equipmentBonuses?.dex) || 0
          let buffAgiBonus = 0
          const activeBuffsForAgi = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
          for (let i = 0; i < activeBuffsForAgi.length; i++) {
            const buff = activeBuffsForAgi[i]
            if (!buff || typeof buff !== 'object') { continue }
            const param = String(buff.parameter || '').toLowerCase()
            if (param === 'agi' || param === 'agility' || param === 'dex') {
              buffAgiBonus += Number(buff.value || buff.add || buff.amount || 0)
            }
            const effects = buff.effects
            if (effects && typeof effects === 'object') {
              const keys = Object.keys(effects)
              for (let j = 0; j < keys.length; j++) {
                const key = keys[j]
                const keyLower = String(key).toLowerCase()
                if (keyLower === 'agility' || keyLower === 'agi' || keyLower === 'dex') {
                  const rawValue = effects[key]
                  const numeric = rawValue && typeof rawValue === 'object'
                    ? Number(rawValue.add || 0)
                    : Number(rawValue || 0)
                  if (Number.isFinite(numeric)) {
                    buffAgiBonus += numeric
                  }
                }
              }
            }
          }
          const totalAgility = baseAgility + equipmentAgiBonus + buffAgiBonus

          // 获取静态技能定义（包含 calculateBuffDuration 方法）
          const staticSkillDef = getSkill(className, skillKey) || skill

          // 计算 BUFF 持续时间
          let buffDuration = skill.buffDuration || 30
          // 优先使用 calculateBuffDuration（新方法名），兼容 calculateDuration（旧方法名）
          const durationCalcMethod = staticSkillDef.calculateBuffDuration || staticSkillDef.calculateDuration
          if (typeof durationCalcMethod === 'function') {
            // 构建包含完整属性的玩家对象
            const playerForDuration = {
              ...player,
              stats: {
                ...player?.stats,
                intelligence: totalIntelligence,
                constitution: totalConstitution,
                sta: totalConstitution,
                agility: totalAgility,
                dex: totalAgility
              }
            }
            buffDuration = durationCalcMethod.call(staticSkillDef, playerForDuration, safeSkillLevel)
          }

          const buff = {
            id: now,
            name: skillName,
            description: resolvedDescription,
            icon: skillIcon,
            level: safeSkillLevel,
            duration: buffDuration,
            type: 'buff',
            startTime: now,
            addedAt: now,
            expiresAt: now + buffDuration * 1000,
            source: 'skill',
            skillId: skillId,
            skillKey: skillKey,
            effects: hasResolvedEffects ? resolvedEffects : undefined,
            effectsRate: resolvedEffectsRate,
            parameter: Number.isFinite(resolvedNumericBuff) ? resolvedParameter : undefined,
            value: Number.isFinite(resolvedNumericBuff) ? resolvedNumericBuff : undefined,
            intelligence: totalIntelligence,
            constitution: totalConstitution,
            // 保存施法者攻击力，用于HOT等基于攻击力百分比的效果计算
            // 优先使用 attack 字段，回退到 stats.attack，最后从 minAttack/maxAttack 取平均值
            casterAttack: (() => {
              const directAttack = Number(player?.attack)
              if (directAttack > 0) return directAttack
              const statsAttack = Number(player?.stats?.attack)
              if (statsAttack > 0) return statsAttack
              const minAtk = Number(player?.minAttack) || 0
              const maxAtk = Number(player?.maxAttack) || 0
              if (minAtk > 0 || maxAtk > 0) {
                return Math.floor((minAtk + maxAtk) / 2)
              }
              return 0
            })(),
            hotTickInterval: skill?.hotTickInterval || 0,
            // 念力护盾相关字段
            maxHealth: player?.maxHealth || player?.stats?.maxHealth || 1000,
            maxAbsorbDamage: calculatedBuff?.maxAbsorbDamage || 0,
            currentAbsorbDamage: calculatedBuff?.currentAbsorbDamage || calculatedBuff?.maxAbsorbDamage || 0,
            absorbPercent: calculatedBuff?.absorbPercent || calculatedBuff?.reflectDamage?.add || 0
          }

          // 调试日志：确认BUFF创建时casterAttack是否正确赋值
          if (buff.casterAttack === 0 && buff.hotTickInterval > 0) {
            console.warn(
              `[SkillEffectService] BUFF创建警告 | ${skillName} | casterAttack=0 | ` +
              `player.attack=${player?.attack} | player.stats?.attack=${player?.stats?.attack} | ` +
              `player.minAttack=${player?.minAttack} | player.maxAttack=${player?.maxAttack} | ` +
              `HOT效果将无法生效`
            )
          }

          const resolvedActiveBuffs = Array.isArray(activeBuffs) ? activeBuffs : null
          const resolvedPlayerBuffs = player && Array.isArray(player.activeBuffs) ? player.activeBuffs : null
          const unifiedBuffs = resolvedActiveBuffs || resolvedPlayerBuffs || []

          if (player) {
            if (!Array.isArray(player.activeBuffs)) {
              player.activeBuffs = unifiedBuffs
            } else if (player.activeBuffs !== unifiedBuffs) {
              const existingKeys = new Set(
                unifiedBuffs.map(entry => `${String(entry?.id)}|${String(entry?.addedAt ?? entry?.startTime ?? entry?.name ?? '')}`)
              )
              const playerBuffs = player.activeBuffs
              for (let i = 0; i < playerBuffs.length; i++) {
                const entry = playerBuffs[i]
                const key = `${String(entry?.id)}|${String(entry?.addedAt ?? entry?.startTime ?? entry?.name ?? '')}`
                if (!existingKeys.has(key)) {
                  existingKeys.add(key)
                  unifiedBuffs.push(entry)
                }
              }
              player.activeBuffs = unifiedBuffs
            }
          }

          // 查找是否已存在相同 BUFF
          let matchIndex = -1
          for (let i = 0; i < unifiedBuffs.length; i++) {
            const entry = unifiedBuffs[i]
            if (!entry || typeof entry !== 'object') {
              continue
            }

            if (entry.source === 'skill') {
              if (buff.skillId && entry.skillId === buff.skillId) {
                matchIndex = i
                break
              }
              if (buff.skillKey && entry.skillKey === buff.skillKey) {
                matchIndex = i
                break
              }
            }

            const hasSkillIcon =
              typeof entry.icon === 'string' && entry.icon.includes('/pt/skill_icon/')
            if (!hasSkillIcon) {
              continue
            }

            if (entry.type === 'buff' && entry.name === buff.name && entry.icon === buff.icon) {
              matchIndex = i
              break
            }
          }

          if (matchIndex >= 0) {
            const existing = unifiedBuffs[matchIndex]
            unifiedBuffs[matchIndex] = {
              ...existing,
              ...buff,
              id: existing?.id ?? buff.id
            }
            setBuffDuration(existing?.id ?? buff.id, buffDuration)
            if (callbacks?.addBattleLog) {
              callbacks.addBattleLog(`刷新了 ${skillName} 效果，持续 ${buffDuration} 秒`)
            }
          } else {
            unifiedBuffs.push(buff)
            setBuffDuration(buff.id, buffDuration)
            if (callbacks?.addBattleLog) {
              callbacks.addBattleLog(`获得了 ${skillName} 效果，持续 ${buffDuration} 秒`)
            }
          }

          // 创建新数组引用以触发响应式更新
          // activeBuffs 被 markRaw 包装，直接修改数组内部（push/替换元素）不会触发 Vue 响应式更新
          // 必须替换整个数组引用，使 gameStore.player.activeBuffs 的引用发生变化
          // 否则 usePlayer 的 activeBuffs computed 返回同一个引用，Vue 3 的 Object.is 判定为相同，不触发下游更新
          if (player) {
            player.activeBuffs = [...unifiedBuffs]
          }

          // 全能祝福特效动画事件派发：圣职者E技能施放时触发十位一体祝福特效
          if (skillName === '全能祝福' || skillId === 'priest_e') {
            try {
              window.dispatchEvent(new CustomEvent('skill-omni-blessing'))
            } catch (e) {
              // 忽略事件派发失败
            }
          }

          // 鹰眼BUFF释放成功后，增加鹰眼EX被动技能的熟练度
          // 鹰眼EX被动技能（O技能）：每次释放鹰眼时熟练度+1
          if (skillId === 'fierce_shooter_q') {
            try {
              const skillsStore = useSkillsStore()
              if (skillsStore && typeof skillsStore.increaseSkillProficiency === 'function') {
                // 检查鹰眼EX技能是否已解锁（玩家等级 >= 180）
                const eagleEyeExSkill = skillsStore?.currentSkills?.find(s => s && s.id === 'fierce_shooter_o')
                if (eagleEyeExSkill) {
                  skillsStore.increaseSkillProficiency('O', 1)
                }
              }
            } catch (e) {
              console.error('[SkillEffectService] 增加鹰眼EX熟练度失败:', e)
            }
          }

          // 将属性重算和持久化延迟到下一个事件循环
          // 使用 setTimeout 分帧执行，避免 requestIdleCallback 超时警告
          const performRecalc = () => {
            if (player && typeof player.applyFinalStats === 'function') {
              const gameStore = useGameStore()
              const equipmentSets = gameStore?.equipmentSets || []

              // 将重算和更新分开执行
              player.applyFinalStats(equipmentSets)

              // 延迟更新到下一宏任务，避免阻塞
              setTimeout(() => {
                Object.assign(gameStore.player, player)

                // 由于 activeBuffs 使用 markRaw 包装，修改数组不会触发响应式更新
                // 通过增加 buffVersion 强制刷新 PlayerDetailModal 等监听组件
                gameStore.buffVersion++

                // 持久化使用防抖
                try {
                  schedulePersistPlayerData(gameStore?.player || player)
                } catch (persistError) {
                  console.error('[SkillEffectService] BUFF持久化失败:', persistError)
                }
              })
            }
          }

          // 使用 setTimeout 替代 requestIdleCallback，避免超时警告
          setTimeout(performRecalc, 50)
        } catch (innerError) {
          console.error(`[SkillEffectService] BUFF计算延迟执行出错: ${skillName}`, innerError)
          if (callbacks?.addBattleLog) {
            callbacks.addBattleLog(`${skillName} 增益计算失败`)
          }
        }
      })
    } catch (error) {
      console.error(`应用BUFF技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 增益失败`)
      }
    }
  }
  // 应用持续性伤害技能效果
  applyDotEffect (skill, player, monsters, callbacks) {
    try {
      const target = this.findFirstAliveTarget(monsters, {
        preferredTargetIndex: callbacks?.preferredTargetIndex ?? null,
        preferredTargetId: callbacks?.preferredTargetId ?? null
      })

      if (!target) {
        callbacks.addBattleLog(`${skill.name} 没有可攻击的目标`)
        return
      }

const damage = this.calculateDotDamage(skill, player, target.monster)
const isCritical = this.checkCritical(player)

let finalDamage = Math.max(1, Math.floor(damage.value))
if (isCritical) {
finalDamage = Math.floor(finalDamage * this.getCriticalDamageMultiplier(player, target.monster))
this.playCriticalSFX(player)
}

target.monster.currentHealth = Math.max(0, target.monster.currentHealth - finalDamage)
target.monster.healthPercentage =
(target.monster.currentHealth / target.monster.maxHealth) * 100

// 检查并应用"赛乐的祝福"攻击触发DEBUFF
this.applySyleBlessingAttackDebuff(player, target.monster, callbacks)

const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
const targetElement = target?.monster?.elementType ?? target?.monster?.element
const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)
callbacks.showDamageNumber(
target.index,
finalDamage,
isCritical,
false,
skill,
false,
null,
null,
false,
null,
{
elementType: resolvedSkillElement,
elementAdvantage
}
)

      // 构造 DOT 配置并应用
      // 如果技能没有显式的 dotEffect 对象，但有 duration 和 tickInterval，则构造一个
      let effectSkill = skill
      if (!skill.dotEffect && (skill.duration || skill.tickInterval)) {
        effectSkill = {
          ...skill,
          dotEffect: {
            name: skill.name,
            duration: Number(skill.duration || 0),
            tickInterval: Number(skill.tickInterval || 1),
            damageRate: 0.3 // 默认 DOT 类型技能每跳造成 30% 基础伤害
          }
        }
      }

      if (effectSkill.dotEffect && target.monster.currentHealth > 0) {
        try {
          // [DOT双重暴击修复] DOT基础伤害使用暴击前的基础伤害，避免暴击倍率被重复应用
          const dotBaseDamage = isCritical
            ? Math.max(1, Math.floor(finalDamage / this.getCriticalDamageMultiplier(player, target.monster)))
            : finalDamage
          this.applyInlineDotEffect(effectSkill, dotBaseDamage, target.monster, callbacks)
        } catch (error) {
          console.error('[SkillEffectService] DOT技能附加持续效果失败:', error)
        }
      }

      this.applyResistanceDebuffToTarget(skill, target.monster, callbacks)
    } catch (error) {
      console.error(`应用DOT技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 持续伤害失败`)
      }
    }
  }

  /**
   * 应用DEBUFF技能效果（如夜幕降临）
   * 对目标造成伤害并附加DEBUFF效果
   * @param {Object} skill - 技能对象
   * @param {Object} player - 玩家对象
   * @param {Array} monsters - 怪物数组
   * @param {Object} callbacks - 回调函数对象
   * @param {number} skillLevel - 技能等级
   */
  applyDebuffEffect (skill, player, monsters, callbacks, skillLevel = 1) {
    try {
      const target = this.findFirstAliveTarget(monsters, {
        preferredTargetIndex: callbacks?.preferredTargetIndex ?? null,
        preferredTargetId: callbacks?.preferredTargetId ?? null
      })

      if (!target) {
        callbacks.addBattleLog(`${skill.name} 没有可攻击的目标`)
        return
      }

      // 派发魔导士技能特效事件（DEBUFF技能：在目标容器范围内显示）
      this.dispatchMageSkillEffect(skill, target.index, false)

      // 计算伤害（DEBUFF技能不触发暴击）
      const damage = this.calculateDamage(skill, player, target.monster)
      let finalDamage = Math.max(1, Math.floor(damage.value))

      // 检查双倍惩戒DEBUFF
      const doubleJudgmentMultiplier = this.consumeDoubleJudgmentDebuff(target.monster)
      const doubleJudgmentTriggered = doubleJudgmentMultiplier > 1
      if (doubleJudgmentTriggered) {
        finalDamage = Math.floor(finalDamage * doubleJudgmentMultiplier)
        if (callbacks?.addBattleLog) {
          callbacks.addBattleLog('双倍惩戒触发！伤害翻倍！', 'debuff')
        }
      }

      // 应用伤害
      target.monster.currentHealth = Math.max(0, target.monster.currentHealth - finalDamage)
      target.monster.healthPercentage =
        (target.monster.currentHealth / target.monster.maxHealth) * 100

      // 处理怪物死亡
      if (target.monster.currentHealth <= 0) {
        const monster = target.monster
        if (!monster.isDefeated) {
          monster.isDefeated = true
        }
        monster.currentHealth = 0
        monster.healthPercentage = 0
        const hasDefeatedAt = Number.isFinite(Number(monster.defeatedAt))
        if (!monster.fadeTimer && !monster.hideTimer && !hasDefeatedAt && !monster.isHidden) {
          const now = Date.now()
          monster.isFading = false
          monster.isHidden = false
          monster.defeatedAt = now
        }
      }

      // 显示伤害数字
      const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
      const targetElement = target?.monster?.elementType ?? target?.monster?.element
      const elementAdvantage = calculateElementAdvantage(resolvedSkillElement, targetElement)
      callbacks.showDamageNumber(
        target.index,
        finalDamage,
        false,
        false,
        skill,
        doubleJudgmentTriggered,
        null,
        null,
        false,
        null,
        {
          elementType: resolvedSkillElement,
          elementAdvantage
        }
      )

      // 应用DEBUFF效果
      if (skill.debuff && target.monster.currentHealth > 0) {
        // 脆弱烙印：复用 armorBreakDebuff 的 damageIncrease 机制
        if (skill.debuff.type === 'damageVulnerability') {
          this.applyDamageVulnerabilityToTarget(skill, target.monster, player, callbacks)
        }
        // 元素崩坏：复用 armorBreakDebuff 的 damageIncrease 机制实现增伤
        if (skill.debuff.type === 'elementVulnerability') {
          this.applyElementVulnerabilityToTarget(skill, target.monster, player, callbacks)
        }
        this.applyDebuffToMonster(skill, target.monster, target.index, callbacks, skillLevel, player)
      }

      // 播放音效和特效
      if (skill.audio) {
        callbacks.playSound?.(skill.audio)
      }
      if (skill.effect) {
        callbacks.showSkillEffect?.(target.index, skill.effect)
      }
    } catch (error) {
      console.error(`应用DEBUFF技能效果时出错: ${skill?.name}`, error)
      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(`${skill?.name || '未知技能'} 使用失败`)
      }
    }
  }

  /**
   * 对怪物应用DEBUFF效果
   * @param {Object} skill - 技能对象
   * @param {Object} monster - 怪物对象
   * @param {number} monsterIndex - 怪物索引
   * @param {Object} callbacks - 回调函数对象
   * @param {number} skillLevel - 技能等级
   */
  applyDebuffToMonster (skill, monster, monsterIndex, callbacks, skillLevel = 1, player = null) {
    const debuffType = skill.debuff?.type
    if (!debuffType) {
      return
    }

    // 计算DEBUFF效果值和动态持续时间
    let debuffValue = 0
    let duration = skill.duration || skill.debuff?.effect?.duration || 15

    if (typeof skill.calculateDebuffEffect === 'function') {
      const debuffEffect = skill.calculateDebuffEffect(skillLevel, player)
      debuffValue = debuffEffect
      // 如果calculateDebuffEffect返回了动态持续时间，优先使用
      if (debuffEffect && typeof debuffEffect.duration === 'number' && debuffEffect.duration > 0) {
        duration = debuffEffect.duration
      }
    } else if (typeof skill.debuff?.effect?.getValue === 'function') {
      debuffValue = skill.debuff.effect.getValue(skillLevel)
    } else {
      debuffValue = skill.debuff?.effect?.value || 0
    }

    const debuffData = {
      type: debuffType,
      value: debuffValue,
      duration,
      startTime: Date.now(),
      expiresAt: Date.now() + duration * 1000,
      skillId: skill.id,
      skillName: skill.name,
      icon: skill.icon
    }

    // 通过monstersStore应用DEBUFF
    const monstersStore = callbacks?.getMonstersStore?.()
    if (monstersStore && typeof monstersStore.applyDebuffBatchUpdates === 'function') {
      monstersStore.applyDebuffBatchUpdates([{
        index: monsterIndex,
        debuffType,
        debuffData
      }])

      if (callbacks?.addBattleLog) {
        const effectText = this.getDebuffEffectText(debuffType, debuffValue)
        callbacks.addBattleLog(`${skill.name} 命中！${effectText}`, 'debuff')
      }
    }
  }

  /**
   * 获取DEBUFF效果描述文本
   * @param {string} debuffType - DEBUFF类型
   * @param {number} value - DEBUFF值
   * @returns {string} 效果描述
   */
  getDebuffEffectText (debuffType, value) {
    const effectMap = {
      hitRateReduction: `目标命中率降低${value}%`,
      attackSpeedReduction: `目标攻击速度降低${value}%`,
      armorBreak: `目标防御力降低${value}%`,
      attackReduction: `目标攻击力降低${value}%`,
      stun: `目标被眩晕`,
      doubleJudgment: `目标被标记双倍惩戒`,
      damageVulnerability: `目标被施加脆弱烙印，承受伤害增加${value}%`,
      elementVulnerability: `目标被施加元素脆弱，承受伤害增加${value}%`
    }
    return effectMap[debuffType] || `目标受到${debuffType}效果`
  }

  //计算伤害
  calculateDamage (skill, player, target) {
    const calcPlayer = buildSkillCalcPlayer(player)
    const calculator =
      typeof skill?.damageCalculation === 'function'
        ? skill.damageCalculation
        : typeof skill?.calculateDamage === 'function'
          ? skill.calculateDamage
          : null

    let baseDamage = Number(skill?.damage ?? 50)
    if (!Number.isFinite(baseDamage)) {
      baseDamage = 0
    }

    if (calculator && calcPlayer) {
      try {
        // 构造敌人对象用于特殊效果计算（如神念攻击的气血加成）
        const enemyForCalc = target ? {
          currentHp: target.currentHealth,
          maxHp: target.maxHealth,
          element: target.elementType ?? target.element
        } : null

        const attempts = [
          // 优先传入完整参数：玩家、技能等级、敌人元素、敌人对象
          [calcPlayer, skill?.level || 1, target?.element ?? null, enemyForCalc],
          // 兼容旧版：玩家、技能等级、敌人元素
          [calcPlayer, skill?.level || 1, target?.element ?? null],
          // 最简参数：玩家、技能等级
          [calcPlayer, skill?.level || 1],
          [calcPlayer, skill]
        ]
        for (const args of attempts) {
          const result = calculator.call(skill, ...args)
          const numeric = Number(result)
          if (Number.isFinite(numeric)) {
            baseDamage = numeric
            break
          }
        }
      } catch (error) {
        console.error('技能伤害计算出错:', error)
      }
    } else {
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

    // 应用武器唤醒技能伤害加成（只对一转、二转技能生效）
    const awakeningDamageBonus = getWeaponAwakeningDamageBonus(skill, player)
    if (awakeningDamageBonus > 0) {
      baseDamage *= 1 + awakeningDamageBonus / 100
    }

    // 暴风箭矢EX2-伤害增加被动：增加暴风箭矢技能伤害 50%
    if (skill?.id === 'fierce_shooter_u') {
      const stormArrowDamageBonus = getStormArrowDamageBonus(player)
      if (stormArrowDamageBonus > 0) {
        baseDamage *= 1 + stormArrowDamageBonus / 100
      }
    }

    // 狂风连射EX2-伤害增加被动：增加狂风连射技能伤害 50%
    if (skill?.id === 'fierce_shooter_i') {
      const galeRapidFireDamageBonus = getGaleRapidFireDamageBonus(player)
      if (galeRapidFireDamageBonus > 0) {
        baseDamage *= 1 + galeRapidFireDamageBonus / 100
      }
    }

// 念气能量弹EX2-伤害增加被动：增加念气能量弹技能伤害 50%
if (skill?.id === 'combat_master_u') {
const auraBombDamageBonus = getAuraBombDamageBonus(player)
if (auraBombDamageBonus > 0) {
baseDamage *= 1 + auraBombDamageBonus / 100
}
}

// 龟派气功EX2-伤害增加被动：增加龟派气功技能伤害 50%（185级解锁）
if (skill?.id === 'combat_master_w') {
const nensphereDamageBonus = getNensphereDamageBonus(player)
if (nensphereDamageBonus > 0) {
baseDamage *= 1 + nensphereDamageBonus / 100
}
}

// 龙拳-破劲EX2-伤害增加被动：增加龙拳-破劲技能伤害 50%（185级解锁）
if (skill?.id === 'combat_master_e') {
const dragonFistDamageBonus = getDragonFistDamageBonus(player)
if (dragonFistDamageBonus > 0) {
baseDamage *= 1 + dragonFistDamageBonus / 100
}
}

// 暗影突袭EX2-伤害增加被动：增加暗影突袭技能伤害 50%（185级解锁）
if (skill?.id === 'joker_emperor_w') {
const shadowRazeDamageBonus = getShadowRazeDamageBonus(player)
if (shadowRazeDamageBonus > 0) {
baseDamage *= 1 + shadowRazeDamageBonus / 100
}
}

// 暗影之刃EX2-伤害增加被动：增加暗影之刃技能伤害 50%（185级解锁）
if (skill?.id === 'joker_emperor_u') {
const shadowBladeDamageBonus = getShadowBladeDamageBonus(player)
if (shadowBladeDamageBonus > 0) {
baseDamage *= 1 + shadowBladeDamageBonus / 100
}
}

// 致命毒刃EX2-伤害增加被动：增加致命毒刃技能伤害 50%（185级解锁）
if (skill?.id === 'joker_emperor_e') {
const deadlyPoisonDamageBonus = getDeadlyPoisonDamageBonus(player)
if (deadlyPoisonDamageBonus > 0) {
baseDamage *= 1 + deadlyPoisonDamageBonus / 100
}
}

// 暗影突袭EX3-倍攻被动：概率触发倍攻伤害（190级解锁）
// 30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成5倍伤害
if (skill?.id === 'joker_emperor_w') {
const criticalMultiplierInfo = getShadowRazeCriticalMultiplierInfo(player)
if (criticalMultiplierInfo.unlocked && criticalMultiplierInfo.multiplier > 1) {
baseDamage *= criticalMultiplierInfo.multiplier
}
}

// 雷神之锤EX2-伤害增加被动：增加雷神之锤技能伤害 50%（185级解锁）
if (skill?.id === 'nature_messenger_t') {
const thunderHammerDamageBonus = getThunderHammerDamageBonus(player)
if (thunderHammerDamageBonus > 0) {
baseDamage *= 1 + thunderHammerDamageBonus / 100
}
}

// 雷神之锤EX3-倍攻被动：概率触发倍攻伤害（190级解锁）
// 50%概率造成1.5倍伤害，25%概率造成2倍伤害，10%概率造成3倍伤害
if (skill?.id === 'nature_messenger_t') {
const thunderHammerMultiplierInfo = getThunderHammerCriticalMultiplierInfo(player)
if (thunderHammerMultiplierInfo.unlocked && thunderHammerMultiplierInfo.multiplier > 1) {
baseDamage *= thunderHammerMultiplierInfo.multiplier
}
}

// 天使之怒EX2-伤害增加被动：增加天使之怒技能伤害 50%（185级解锁）
if (skill?.id === 'nature_messenger_u') {
  const angelWrathEx2Level = Number(
    player?.skills?.U_EX2?.proficiencyLevel ??
    (player?.skills?.U_EX2?.proficiency && typeof player.skills.U_EX2.proficiency === 'object'
      ? player.skills.U_EX2.proficiency.level
      : undefined) ??
    player?.skills?.U_EX2?.level ?? 0
  )
  if (angelWrathEx2Level >= 1) {
    baseDamage *= 1 + 50 / 100
  }
}

// 圣光审判EX2-伤害增加被动：增加圣光审判技能伤害 50%（185级解锁）
if (skill?.id === 'nature_messenger_e') {
  const holyJudgmentEx2Level = Number(
    player?.skills?.E_EX2?.proficiencyLevel ??
    (player?.skills?.E_EX2?.proficiency && typeof player.skills.E_EX2.proficiency === 'object'
      ? player.skills.E_EX2.proficiency.level
      : undefined) ??
    player?.skills?.E_EX2?.level ?? 0
  )
  if (holyJudgmentEx2Level >= 1) {
    baseDamage *= 1 + 50 / 100
  }
}

// 荣耀之剑EX2-伤害增加被动：增加荣耀之剑技能伤害 50%（185级解锁）
if (skill?.id === 'holy_knight_w') {
  const shieldBashDamageBonus = getShieldBashDamageBonus(player)
  if (shieldBashDamageBonus > 0) {
    baseDamage *= 1 + shieldBashDamageBonus / 100
  }
}

// 荣耀之剑EX3-倍攻被动：概率触发倍攻伤害（190级解锁）
// 30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成4倍伤害
if (skill?.id === 'holy_knight_w') {
  const shieldBashMultiplierInfo = getShieldBashCriticalMultiplierInfo(player)
  if (shieldBashMultiplierInfo.unlocked && shieldBashMultiplierInfo.multiplier > 1) {
    baseDamage *= shieldBashMultiplierInfo.multiplier
  }
}

// 圣殿裁决EX2-伤害增加被动：增加圣殿裁决技能伤害 50%（185级解锁）
if (skill?.id === 'holy_knight_u') {
  const judgmentDamageBonus = getHolyKnightJudgmentDamageBonus(player)
  if (judgmentDamageBonus > 0) {
    baseDamage *= 1 + judgmentDamageBonus / 100
  }
}

// 圣殿裁决EX3-倍攻被动：概率触发倍攻伤害（190级解锁）
// 30%概率造成2倍伤害，20%概率造成2.5倍伤害，10%概率造成3倍伤害
if (skill?.id === 'holy_knight_u') {
  const judgmentMultiplierInfo = getHolyKnightJudgmentCriticalMultiplierInfo(player)
  if (judgmentMultiplierInfo.unlocked && judgmentMultiplierInfo.multiplier > 1) {
    baseDamage *= judgmentMultiplierInfo.multiplier
  }
}

// 碎甲圣裁EX2-伤害增加被动：增加碎甲圣裁技能伤害 50%（185级解锁）
if (skill?.id === 'holy_knight_e') {
  const armorBreakDamageBonus = getArmorBreakDamageBonus(player)
  if (armorBreakDamageBonus > 0) {
    baseDamage *= 1 + armorBreakDamageBonus / 100
  }
}

    const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
    const targetElement = target?.elementType ?? target?.element
    const advantageMultiplier = calculateElementAdvantage(resolvedSkillElement, targetElement)

    // 应用元素攻击力加成（如赫雷森.凯列蓝的祝福BUFF提供的元素攻击力）
    let elementAttackBonus = 0
    if (resolvedSkillElement && advantageMultiplier > 1) {
      // 获取玩家对应元素的攻击力加成
      elementAttackBonus = DamageCalculator.getPlayerElementAttackPercent(player, resolvedSkillElement)
      if (elementAttackBonus > 0) {
        // 元素攻击力加成：在克制时额外增加伤害
        const elementAttackMultiplier = elementAttackBonus / 100
        baseDamage = Math.floor(baseDamage * (advantageMultiplier + elementAttackMultiplier))
      } else {
        baseDamage = Math.floor(baseDamage * advantageMultiplier)
      }
    } else {
      baseDamage = Math.floor(baseDamage * advantageMultiplier)
    }

    const resistanceMultiplier = this.getResistanceMultiplier(resolvedSkillElement, target)
    baseDamage = Math.floor(baseDamage * resistanceMultiplier)
    const magicDefense = Number(target?.magicDefense ?? target?.magicDef ?? 0)
    if (Number.isFinite(magicDefense) && magicDefense > 0) {
      baseDamage = Math.max(1, Math.floor(baseDamage - magicDefense))
    }
    const playerLevel = Number(player?.level ?? player?.value?.level) || 1
    const monsterLevel = Number(target?.level) || 1
    const levelDiff = monsterLevel - playerLevel
    if (levelDiff > 0) {
      const reduction = Math.min(levelDiff * 0.05, 0.95)
      baseDamage = Math.max(1, Math.floor(baseDamage * (1 - reduction)))
    } else if (levelDiff < 0) {
      const increase = Math.min(-levelDiff * 0.05, 1.0)
      baseDamage = Math.max(1, Math.floor(baseDamage * (1 + increase)))
    }

    // 应用碎甲DEBUFF效果（承受伤害增加）
    const armorBreakDebuff = target?.armorBreakDebuff
    if (armorBreakDebuff?.active && armorBreakDebuff?.expiresAt > Date.now()) {
      const damageIncrease = Number(armorBreakDebuff.damageIncrease ?? 0)
      if (Number.isFinite(damageIncrease) && damageIncrease > 0) {
        baseDamage = Math.floor(baseDamage * (1 + damageIncrease / 100))
      }
    }

    // 应用 PVE 伤害加成（增加对怪物的最终伤害）
    const pveDamage = Number(player?.pveDamage) || 0
    if (pveDamage > 0) {
      baseDamage = Math.floor(baseDamage * (1 + pveDamage / 100))
    }

    const finalDamage = baseDamage

    return {
      value: finalDamage,
      multiplier: advantageMultiplier * resistanceMultiplier
    }
  }
  // 计算治疗量
  calculateHeal (skill, player) {
    let healAmount = skill.heal ?? skill.damage ?? 50

    const calculator =
      typeof skill.healingCalculation === 'function'
        ? skill.healingCalculation
        : typeof skill.calculateHealing === 'function'
          ? skill.calculateHealing
          : null

    if (calculator) {
      try {
        // 尝试构建用于计算的玩家对象
        const calcPlayer = buildSkillCalcPlayer(player) || player
        // 传入技能等级而不是技能对象
        const skillLevel = Number(skill.level ?? skill.proficiencyLevel ?? 1)
        
        // 尝试多种调用方式以兼容不同的定义
        const attempts = [
          [calcPlayer, skillLevel],
          [calcPlayer, skill]
        ]

        let calculated = false
        for (const args of attempts) {
          const result = calculator.call(skill, ...args)
          const numeric = Number(result)
          if (Number.isFinite(numeric)) {
            healAmount = numeric
            calculated = true
            break
          }
        }

        if (!calculated) {
          // 如果计算返回无效值，尝试使用基础计算逻辑（熟练度加成）
          const proficiencyBonus = calculateHealProficiencyBonus(skill)
          if (Number.isFinite(proficiencyBonus)) {
            healAmount += proficiencyBonus
          }
        }
      } catch (error) {
        console.error('治疗计算出错:', error)
      }
    } else {
      // 如果没有自定义计算函数，使用基础值 + 熟练度加成
      const proficiencyBonus = calculateHealProficiencyBonus(skill)
      if (Number.isFinite(proficiencyBonus)) {
        // 如果技能本身有基础治疗量，并且与熟练度基础值匹配，calculateHealProficiencyBonus 只返回增量
        // 如果技能没有基础治疗量，或者不匹配，calculateHealProficiencyBonus 返回总值
        // 这里需要判断是否应该覆盖 healAmount 还是累加
        const baseHeal = Number(skill.heal ?? skill.damage ?? NaN)
        const effect = skill.proficiencyEffect || skill.proficiency?.effect
        const safeBase = Number(effect?.base)

        if (Number.isFinite(baseHeal) && baseHeal === safeBase) {
          healAmount += proficiencyBonus
        } else {
          healAmount = proficiencyBonus
        }
      }
    }

    const healBonus = Number(player?.healPercent || 0)
    if (Number.isFinite(healBonus) && healBonus !== 0) {
      const ratio = healBonus > 1 ? healBonus / 100 : healBonus
      healAmount *= 1 + ratio
    }

    return Math.floor(healAmount)
  }
  // 计算持续性伤害
  calculateDotDamage (skill, player, target) {
    let dotDamage = skill.dotDamage || 0

    if (skill.dotDamageCalculation && typeof skill.dotDamageCalculation === 'function') {
      try {
        const calcPlayer = buildSkillCalcPlayer(player)
        const attempts = [
          [calcPlayer, skill?.level || 1, target?.element ?? null],
          [calcPlayer, skill?.level || 1],
          [calcPlayer, skill]
        ]
        for (const args of attempts) {
          const result = skill.dotDamageCalculation(...args)
          const numeric = Number(result)
          if (Number.isFinite(numeric)) {
            dotDamage = numeric
            break
          }
        }
      } catch (error) {
        console.error('DOT伤害计算出错:', error)
      }
    } else {
      const bonus = calculateDotProficiencyBonus(skill)
      const safeBonus = Number.isFinite(bonus) ? bonus : 0
      dotDamage = Number(dotDamage) + safeBonus
    }

    const resolvedSkillElement = skill?.elementType ?? skill?.element ?? null
    const targetElement = target?.elementType ?? target?.element
    const advantageMultiplier = calculateElementAdvantage(resolvedSkillElement, targetElement)
    dotDamage = Math.floor(dotDamage * advantageMultiplier)

    const resistanceMultiplier = this.getResistanceMultiplier(resolvedSkillElement, target)
    dotDamage = Math.floor(dotDamage * resistanceMultiplier)
    const magicDefense = Number(target?.magicDefense ?? target?.magicDef ?? 0)
    if (Number.isFinite(magicDefense) && magicDefense > 0) {
      dotDamage = Math.max(1, Math.floor(dotDamage - magicDefense))
    }
    const playerLevel = Number(player?.level ?? player?.value?.level) || 1
    const monsterLevel = Number(target?.level) || 1
    const levelDiff = monsterLevel - playerLevel
    if (levelDiff > 0) {
      const reduction = Math.min(levelDiff * 0.05, 0.95)
      dotDamage = Math.max(1, Math.floor(dotDamage * (1 - reduction)))
    } else if (levelDiff < 0) {
      const increase = Math.min(-levelDiff * 0.05, 1.0)
      dotDamage = Math.max(1, Math.floor(dotDamage * (1 + increase)))
    }
    const finalDamage = dotDamage

    return {
      value: finalDamage,
      multiplier: advantageMultiplier * resistanceMultiplier
    }
  }

  /**
   * 应用 DOT (持续伤害) 效果 - 优化版
   * 使用统一的 DOT 调度器替代独立的 setTimeout
   * @param {Object} skill - 技能对象
   * @param {number} baseDamage - 基础伤害
   * @param {Object} monster - 目标怪物
   * @param {Object} callbacks - 回调函数集合
   */
  applyInlineDotEffect (skill, baseDamage, monster, callbacks, skipCallbackSetup = false) {
    const config = skill?.dotEffect
    if (!config || !monster || monster.currentHealth <= 0) {
      return
    }

    const duration = Number(config.duration ?? 0)
    const tickInterval = Number(config.tickInterval ?? 0)
    const damageRate = Number(config.damageRate ?? 0)
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
    const safeTick = Number.isFinite(tickInterval) && tickInterval > 0 ? tickInterval : 0
    const safeRate = Number.isFinite(damageRate) && damageRate > 0 ? damageRate : 0
    const canCrit = true // 所有非BUFF技能均可触发暴击

    if (safeDuration <= 0 || safeTick <= 0 || safeRate <= 0) {
      return
    }

    const ticks = Math.floor(safeDuration / safeTick)
    if (ticks <= 0) {
      return
    }

    const perTick = Math.max(1, Math.floor(baseDamage * safeRate))

    // 仅在第一次调用时设置 DOT 调度器回调
    // AOE 批量应用时 skipCallbackSetup=true，避免重复设置
    if (!skipCallbackSetup && !dotTickScheduler.onDamageApplied) {
      dotTickScheduler.onDamageApplied = (data) => {
        // 只显示伤害数字，不做任何 UI 更新操作
        if (typeof callbacks?.showDamageNumber === 'function' && data.dots && data.dots.length > 0) {
          const dot = data.dots[0] // 取第一个 DOT 的技能信息
          // 支持DOT暴击：如果DOT有isCrit标记则显示为暴击
          const isDotCrit = dot.canCrit && dot.isCrit
          callbacks.showDamageNumber(
            data.monster.index ?? 0,
            data.totalDamage,
            isDotCrit,
            false,
            dot.skill,
            false,
            null,
            null,
            false,
            null,
            {
              elementType: dot.skill?.elementType ?? dot.skill?.element ?? null,
              elementAdvantage: calculateElementAdvantage(
                dot.skill?.elementType ?? dot.skill?.element ?? null,
                data.monster?.elementType ?? data.monster?.element ?? null
              )
            }
          )
        }
      }
    }

    // 使用统一调度器注册 DOT
    // 使用 index 作为唯一标识，因为 monster.id 可能重复（同类型怪物）
    const monsterId = monster.index
    if (monsterId !== null && monsterId !== undefined) {
      dotTickScheduler.register(monsterId, {
        name: config.name || `${skill.name}·DOT`,
        damage: perTick,
        tickInterval: safeTick,
        ticksRemaining: ticks,
        skill,
        icon: skill.icon || '',
        monster, // 直接传递怪物引用
        canCrit // 是否可以暴击
      })
    }

    // 保持兼容性：也更新 monster.dotEffects 数组
    // 使用 toRaw 绕过 Vue 响应式，避免 dotEffects 突变触发额外的第一次渲染
    const rawMonster = toRaw(monster)
    if (!Array.isArray(rawMonster.dotEffects)) {
      rawMonster.dotEffects = []
    }
    rawMonster.dotEffects.push({
      name: config.name || `${skill.name}·DOT`,
      damage: perTick,
      duration: safeDuration,
      tickInterval: safeTick,
      startTime: Date.now(),
      nextTickTime: Date.now() + safeTick * 1000,
      ticksRemaining: ticks,
      icon: skill.icon || '',
      skill,
      timerId: null // 不再使用独立 timer
    })
  }

  getResistanceMultiplier (attackElement, target) {
    try {
      const elementKey = normalizeElementKey(attackElement)
      if (!elementKey || !target || typeof target !== 'object') {
        return 1
      }

      const debuffs = target.resistanceDebuffs
      if (!debuffs || typeof debuffs !== 'object') {
        return 1
      }

      const now = Date.now()
      const keys = Object.keys(debuffs)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const entry = debuffs[key]
        const expiresAt = Number(entry?.expiresAt ?? 0) || 0
        if (expiresAt <= now) {
          delete debuffs[key]
        }
      }

      const entry = debuffs[elementKey]
      const value = Number(entry?.value ?? 0) || 0
      if (!Number.isFinite(value) || value <= 0) {
        return 1
      }

      return 1 + value / 100
    } catch (error) {
      console.error('[SkillEffectService] 解析抗性降低倍率失败:', error)
      return 1
    }
  }

  applyResistanceDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      const elementKey = extractResistanceElementFromDebuffEffect(effect)
      if (!elementKey) {
        return false
      }

      const chance = Number(debuff?.chance ?? 0)
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      let value = 0
      try {
        if (typeof effect.getValue === 'function') {
          value = Number(effect.getValue(safeSkillLevel)) || 0
        } else {
          value = Number(effect.value ?? 0) || 0
        }
      } catch (error) {
        value = 0
      }

      const durationSeconds = Number(effect.duration ?? 0)
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0
      if (value <= 0 || safeDurationSeconds <= 0) {
        return false
      }

      if (!target.resistanceDebuffs || typeof target.resistanceDebuffs !== 'object') {
        target.resistanceDebuffs = {}
      }

      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.resistanceDebuffs[elementKey]
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingValue = Number(existing?.value ?? 0) || 0

      target.resistanceDebuffs[elementKey] = {
        value: Math.max(existingValue, value),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt)
      }

      if (callbacks?.addBattleLog) {
        const label = ELEMENT_TYPE_MAP[elementKey] || elementKey
        callbacks.addBattleLog(
          `${target?.name || '目标'} 的${label}属性抵抗力降低 ${Math.floor(value)}%（持续 ${Math.floor(
            safeDurationSeconds
          )} 秒）`
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用抗性降低失败:', error)
      return false
    }
  }

  /**
   * 检查并应用"赛乐的祝福"攻击触发DEBUFF效果
   * 当玩家拥有"赛乐的祝福"BUFF时，攻击有概率触发眩晕和减少攻击力效果
   * @param {Object} player - 玩家对象
   * @param {Object} target - 目标怪物
   * @param {Object} _callbacks - 回调函数（预留）
   * @returns {Object} 触发效果的结果 { stunned: boolean, attackReduced: boolean }
   */
  applySyleBlessingAttackDebuff (player, target, _callbacks) {
    const result = { stunned: false, attackReduced: false }

    try {
      if (!player || !target || typeof target !== 'object') {
        return result
      }

      // 检查玩家是否有"赛乐的祝福"BUFF
      const activeBuffs = player?.activeBuffs
      if (!Array.isArray(activeBuffs) || activeBuffs.length === 0) {
        return result
      }

      // 查找"赛乐的祝福"BUFF
      let syleBlessingBuff = null
      for (let i = 0; i < activeBuffs.length; i++) {
        const buff = activeBuffs[i]
        if (
          buff &&
          (buff.skillId === 'spirit_mage_syle_blessing' ||
            buff.skillKey === '赛乐的祝福' ||
            buff.name === '赛乐的祝福')
        ) {
          syleBlessingBuff = buff
          break
        }
      }

      if (!syleBlessingBuff) {
        return result
      }

      // 获取技能等级
      const level = Number(syleBlessingBuff.level || syleBlessingBuff.proficiencyLevel || 1)
      const safeLevel = Number.isFinite(level) && level > 0 ? Math.min(level, 10) : 1


      // 计算DEBUFF概率和效果
      // 眩晕概率：1级30%，每级+3%，10级57%
      const stunChance = 30 + (safeLevel - 1) * 3
      // 攻击减少概率：1级30%，每级+3%，10级57%
      const attackReductionChance = 30 + (safeLevel - 1) * 3
      // 攻击减少量：1级3%，每级+3%，10级30%
      const attackReduction = 3 + (safeLevel - 1) * 3


      // 尝试触发眩晕效果
      const stunRoll = Math.random() * 100
      if (stunRoll < stunChance) {
        // 应用眩晕 - 使用统一的stunDebuff格式
        const stunDuration = 3 // 固定3秒
        // 创建新对象以触发响应式更新
        target.stunDebuff = {
          active: true,
          duration: stunDuration,
          expiresAt: Date.now() + stunDuration * 1000,
          source: '赛乐的祝福'
        }
        result.stunned = true
      }

      // 尝试触发攻击减少效果
      const attackReductionRoll = Math.random() * 100
      if (attackReductionRoll < attackReductionChance) {
        // 应用攻击减少DEBUFF - 使用统一格式
        const debuffDuration = 5 // 固定5秒
        // Canvas-First：使用 toRaw 绕过 Vue 响应式，Canvas 直接从 proxy 读取
        toRaw(target).attackReductionDebuff = {
          active: true,
          value: attackReduction,
          expiresAt: Date.now() + debuffDuration * 1000,
          source: '赛乐的祝福',
          skillName: '赛乐的祝福',
          icon: '/pt/skill_icon/psygravitywell.png'
        }
        result.attackReduced = true
      }

      return result
    } catch (error) {
      console.error('[SkillEffectService] 应用赛乐的祝福DEBUFF失败:', error)
      return result
    }
  }

  /**
   * 应用攻击力降低DEBUFF到目标（毒箭等技能）
   * 概率触发，降低怪物攻击力百分比，持续一定时间
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyAttackReductionDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理攻击力降低类型的DEBUFF
      if (debuff.type !== 'attackReduction' && effect.type !== 'attackReduction') {
        return false
      }

      // 计算触发概率
      let chance = Number(debuff?.chance ?? 0)
      if (typeof skill.calculateDebuffChance === 'function') {
        const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
        chance = skill.calculateDebuffChance(skillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      // 获取技能等级
      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算攻击力降低百分比
      let value = 0
      try {
        if (typeof effect.getValue === 'function') {
          value = Number(effect.getValue(safeSkillLevel)) || 0
        } else {
          value = Number(effect.value ?? 0) || 0
        }
      } catch (error) {
        console.error('[SkillEffectService] 攻击力降低DEBUFF效果值计算错误:', error)
        value = 0
      }

      // 计算持续时间
      const durationSeconds = Number(effect.baseDuration ?? effect.duration ?? 0)
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0

      if (value <= 0 || safeDurationSeconds <= 0) {
        return false
      }

      // 应用攻击力降低DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.attackReductionDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingValue = Number(existing?.value ?? 0) || 0

      // 使用 toRaw 绕过 Vue 响应式，Canvas 每帧直接从 proxy 读取 debuff 状态
      toRaw(target).attackReductionDebuff = {
        active: true,
        value: Math.max(existingValue, value),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        source: skill?.name || '未知技能',
        skillName: skill?.name || '未知技能',
        icon: effect.icon || skill?.icon || '/pt/skill_icon/ragbowpoison.png'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 中毒！攻击力降低 ${Math.floor(value)}%（持续 ${Math.floor(safeDurationSeconds)} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用攻击力降低DEBUFF失败:', error)
      return false
    }
  }

  /**
   * 应用攻击速度减少DEBUFF到目标
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyAttackSpeedDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理攻击速度减少类型的DEBUFF
      if (debuff.type !== 'attackSpeedReduction' && effect.type !== 'attackSpeedReduction') {
        return false
      }

      // 使用技能配置中的计算方法或默认方法计算概率
      let chance = Number(debuff?.chance ?? 0)
      if (typeof skill.calculateDebuffChance === 'function') {
        const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
        chance = skill.calculateDebuffChance(skillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算效果值
      let value = 0
      try {
        if (typeof effect.getValue === 'function') {
          value = Number(effect.getValue(safeSkillLevel)) || 0
        } else {
          value = Number(effect.value ?? 0) || 0
        }
      } catch (error) {
        console.error('[SkillEffectService] 攻击速度降低DEBUFF效果值计算错误:', error)
        value = 0
      }

      // 计算持续时间 - 支持动态计算
      let durationSeconds = 0
      if (typeof skill.calculateDebuffDuration === 'function') {
        // 使用技能配置的计算方法
        try {
          durationSeconds = Number(skill.calculateDebuffDuration(skill.player || skill)) || 0
        } catch (calcError) {
          console.error('[SkillEffectService] 计算DEBUFF持续时间失败:', calcError)
          // 回退到effect中的基础配置
          const baseDuration = Number(effect.baseDuration ?? effect.duration ?? 0)
          const ratio = Number(effect.intToDurationRatio ?? 10)
          const playerInt = Number(skill?.player?.stats?.intelligence ?? skill?.player?.intelligence ?? 0)
          durationSeconds = baseDuration + Math.floor(playerInt / ratio)
        }
      } else {
        // 没有自定义计算函数，使用effect中的配置
        const baseDuration = Number(effect.baseDuration ?? effect.duration ?? 0)
        const ratio = Number(effect.intToDurationRatio ?? 10)
        // 如果有intToDurationRatio，说明需要根据智力计算
        if (effect.intToDurationRatio) {
          const playerInt = Number(skill?.player?.stats?.intelligence ?? skill?.player?.intelligence ?? 0)
          durationSeconds = baseDuration + Math.floor(playerInt / ratio)
        } else {
          durationSeconds = baseDuration
        }
      }
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0

      if (value <= 0 || safeDurationSeconds <= 0) {
        return false
      }

      // 应用攻击速度减少DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.attackSpeedDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingValue = Number(existing?.value ?? 0) || 0

// 使用 toRaw 绕过 Vue 响应式，避免 debuff 突变触发额外的渲染
// Canvas-First：Canvas 每帧直接从 proxy 读取 debuff 状态
      toRaw(target).attackSpeedDebuff = {
        value: Math.max(existingValue, value),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        source: skill?.name || '未知技能',
        icon: skill?.icon || '',
        skillName: skill?.name || '未知技能'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 的攻击速度降低 ${Math.floor(value)}%（持续 ${Math.floor(
            safeDurationSeconds
          )} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用攻击速度减少失败:', error)
      return false
    }
  }

  /**
   * 应用命中率降低DEBUFF到目标
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyHitRateReductionDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理命中率降低类型的DEBUFF
      if (debuff.type !== 'hitRateReduction' && effect.type !== 'hitRateReduction') {
        return false
      }

      // 使用技能配置中的计算方法或默认方法计算概率
      let chance = Number(debuff?.chance ?? 0)
      if (typeof skill.calculateDebuffChance === 'function') {
        const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
        chance = skill.calculateDebuffChance(skillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算效果值
      let value = 0
      try {
        if (typeof effect.getValue === 'function') {
          value = Number(effect.getValue(safeSkillLevel)) || 0
        } else {
          value = Number(effect.value ?? 0) || 0
        }
      } catch (error) {
        value = 0
      }

      const durationSeconds = Number(effect.duration ?? skill?.duration ?? 0)
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0
      if (value <= 0 || safeDurationSeconds <= 0) {
        return false
      }

      // 应用命中率降低DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.hitRateReductionDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingValue = Number(existing?.value ?? 0) || 0

      // 使用 toRaw 绕过 Vue 响应式，避免 debuff 突变触发额外的第一次渲染
      toRaw(target).hitRateReductionDebuff = {
        value: Math.max(existingValue, value),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        source: skill?.name || '未知技能',
        icon: skill?.icon || '',
        skillName: skill?.name || '未知技能'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 的命中率降低 ${Math.floor(value)}%（持续 ${Math.floor(
            safeDurationSeconds
          )} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用命中率降低失败:', error)
      return false
    }
  }

  /**
   * 应用暴击伤害降低DEBUFF到目标
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyCritDamageReductionDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理暴击伤害降低类型的DEBUFF
      if (debuff.type !== 'critDamageReduction' && effect.type !== 'critDamageReduction') {
        return false
      }

      // 使用技能配置中的计算方法或默认方法计算概率
      let chance = Number(debuff?.chance ?? 0)
      if (typeof skill.calculateDebuffChance === 'function') {
        const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
        chance = skill.calculateDebuffChance(skillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算效果值
      let value = 0
      try {
        if (typeof effect.getValue === 'function') {
          value = Number(effect.getValue(safeSkillLevel)) || 0
        } else {
          value = Number(effect.value ?? 0) || 0
        }
      } catch (error) {
        value = 0
      }

      const durationSeconds = Number(effect.duration ?? skill?.duration ?? 0)
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0
      if (value <= 0 || safeDurationSeconds <= 0) {
        return false
      }

      // 应用暴击伤害降低DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.critDamageReductionDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingValue = Number(existing?.value ?? 0) || 0

      // 使用 toRaw 绕过 Vue 响应式，避免 debuff 突变触发额外的第一次渲染
      toRaw(target).critDamageReductionDebuff = {
        value: Math.max(existingValue, value),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        source: skill?.name || '未知技能',
        icon: skill?.icon || '',
        skillName: skill?.name || '未知技能'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 的暴击伤害降低 ${Math.floor(value)}%（持续 ${Math.floor(
            safeDurationSeconds
          )} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用暴击伤害降低失败:', error)
      return false
    }
  }

  /**
   * 应用击晕DEBUFF到目标
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyStunDebuffToTarget (skill, target, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理击晕类型的DEBUFF
      if (debuff.type !== 'stun' && effect.type !== 'stun') {
        return false
      }

      // 使用技能配置中的计算方法或默认方法计算概率
      let chance = Number(debuff?.chance ?? 0)
      if (typeof skill.calculateDebuffChance === 'function') {
        const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
        chance = skill.calculateDebuffChance(skillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 0
      if (safeChance > 0 && safeChance < 100 && Math.random() * 100 >= safeChance) {
        return false
      }

      const durationSeconds = Number(effect.duration ?? 0)
      const safeDurationSeconds = Number.isFinite(durationSeconds) ? Math.max(0, durationSeconds) : 0
      if (safeDurationSeconds <= 0) {
        return false
      }

      // 应用击晕DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDurationSeconds * 1000
      const existing = target.stunDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0

      // 使用 toRaw 绕过 Vue 响应式，避免 debuff 突变触发额外的第一次渲染
      toRaw(target).stunDebuff = {
        active: true,
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        duration: safeDurationSeconds,
        source: skill?.name || '未知技能',
        icon: effect.icon || '/pt/UI/stun_stars.svg'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 被击晕了！（持续 ${safeDurationSeconds} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用击晕失败:', error)
      return false
    }
  }

  /**
   * 应用碎甲DEBUFF到目标
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} player - 玩家对象
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyArmorBreakDebuffToTarget (skill, target, player, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理碎甲类型的DEBUFF
      if (debuff.type !== 'armorBreak' && effect.type !== 'armorBreak') {
        return false
      }

      // 获取技能等级
      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算DEBUFF效果
      let defenseReduction = 0
      let damageIncrease = 0
      let duration = 0

      // 使用技能配置中的计算方法
      if (typeof skill.calculateDebuffEffect === 'function') {
        const debuffEffect = skill.calculateDebuffEffect(safeSkillLevel, player)
        defenseReduction = Number(debuffEffect?.defenseReduction ?? 0)
        damageIncrease = Number(debuffEffect?.damageIncrease ?? 0)
        duration = Number(debuffEffect?.duration ?? 0)
      } else {
        // 使用默认计算
        defenseReduction = 2 + (safeSkillLevel - 1) * 2 // 1级2%，10级20%
        damageIncrease = 1 + (safeSkillLevel - 1) * 1 // 1级1%，10级10%
        duration = 20 // 基础20秒
      }

      // 验证数值
      const safeDefenseReduction = Number.isFinite(defenseReduction)
        ? Math.max(0, Math.min(100, defenseReduction))
        : 0
      const safeDamageIncrease = Number.isFinite(damageIncrease)
        ? Math.max(0, Math.min(100, damageIncrease))
        : 0
      const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0

      if (safeDefenseReduction <= 0 && safeDamageIncrease <= 0) {
        return false
      }

      // 应用碎甲DEBUFF
      const now = Date.now()
      const nextExpiresAt = now + safeDuration * 1000
      const existing = target.armorBreakDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingDefense = Number(existing?.defenseReduction ?? 0) || 0
      const existingDamage = Number(existing?.damageIncrease ?? 0) || 0

      // 使用 toRaw 绕过 Vue 响应式，避免 debuff 突变触发额外的第一次渲染
      toRaw(target).armorBreakDebuff = {
        active: true,
        defenseReduction: Math.max(existingDefense, safeDefenseReduction),
        damageIncrease: Math.max(existingDamage, safeDamageIncrease),
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        duration: safeDuration,
        source: skill?.name || '碎甲',
        icon: effect.icon || '/pt/UI/armor_break.svg'
      }

      if (callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `${target?.name || '目标'} 被施加碎甲效果！防御力-${safeDefenseReduction}%，承受伤害+${safeDamageIncrease}%（持续 ${safeDuration} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用碎甲失败:', error)
      return false
    }
  }

  /**
   * 应用脆弱烙印DEBUFF到目标（弱点射击）
   * 烙印期间目标受到所有来源伤害提升
   * 重复命中仅刷新持续时间，不叠加增伤
   * 复用 armorBreakDebuff 的 damageIncrease 机制，使所有伤害来源都能享受到增伤效果
   * @param {Object} skill - 技能对象
   * @param {Object} target - 目标怪物
   * @param {Object} player - 玩家对象
   * @param {Object} callbacks - 回调函数
   * @returns {boolean} 是否成功应用
   */
  applyDamageVulnerabilityToTarget (skill, target, player, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理脆弱烙印类型的DEBUFF
      if (debuff.type !== 'damageVulnerability' && effect.type !== 'damageVulnerability') {
        return false
      }

      // 获取技能等级
      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算DEBUFF效果
      let damageIncrease = 0
      let duration = 0

      if (typeof skill.calculateDebuffEffect === 'function') {
        const debuffEffect = skill.calculateDebuffEffect(safeSkillLevel, player)
        damageIncrease = Number(debuffEffect?.damageIncrease ?? 0)
        duration = Number(debuffEffect?.duration ?? 0)
      } else if (typeof effect.getValue === 'function') {
        damageIncrease = Number(effect.getValue(safeSkillLevel))
        duration = Number(effect.baseDuration ?? 15)
      } else {
        damageIncrease = 5
        duration = 15
      }

      // 验证数值
      const safeDamageIncrease = Number.isFinite(damageIncrease)
        ? Math.max(0, Math.min(100, damageIncrease))
        : 0
      const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0

      if (safeDamageIncrease <= 0) {
        return false
      }

      // 获取暴击伤害加成（龙拳-破劲专属）
      let critDamageBonus = 0
      if (typeof skill.calculateDebuffEffect === 'function') {
        const debuffEffect = skill.calculateDebuffEffect(safeSkillLevel, player)
        critDamageBonus = Number(debuffEffect?.critDamageBonus ?? 0)
      } else if (typeof effect.getCritDamageBonus === 'function') {
        critDamageBonus = Number(effect.getCritDamageBonus(safeSkillLevel))
      }
      const safeCritDamageBonus = Number.isFinite(critDamageBonus)
        ? Math.max(0, Math.min(100, critDamageBonus))
        : 0

      // 应用脆弱烙印DEBUFF（复用 armorBreakDebuff 的 damageIncrease 字段）
      const now = Date.now()
      const nextExpiresAt = now + safeDuration * 1000
      const existing = target.armorBreakDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingDamage = Number(existing?.damageIncrease ?? 0) || 0
      const existingDefense = Number(existing?.defenseReduction ?? 0) || 0
      const existingCritBonus = Number(existing?.critDamageBonus ?? 0) || 0

      // 重复命中仅刷新持续时间，不叠加增伤（取最大值，不累加）
      toRaw(target).armorBreakDebuff = {
        active: true,
        // 保留已有的防御降低效果（如碎甲），取最大值
        defenseReduction: existingDefense,
        // 增伤取最大值，不叠加
        damageIncrease: Math.max(existingDamage, safeDamageIncrease),
        // 暴击伤害加成取最大值，不叠加
        critDamageBonus: Math.max(existingCritBonus, safeCritDamageBonus),
        // 刷新持续时间
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        duration: safeDuration,
        source: skill?.name || '脆弱烙印',
        icon: effect.icon || skill?.icon || '/pt/skill_icon/headshot.png'
      }

      if (callbacks?.addBattleLog) {
        const critText = safeCritDamageBonus > 0 ? `，暴击伤害+${safeCritDamageBonus}%` : ''
        callbacks.addBattleLog(
          `${target?.name || '目标'} 被施加破劲印记！承受伤害+${safeDamageIncrease}%${critText}（持续 ${safeDuration} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用脆弱烙印失败:', error)
      return false
    }
  }

  /**
   * 应用元素脆弱DEBUFF到目标（元素崩坏技能专用）
   * 复用 armorBreakDebuff 的 damageIncrease 机制，使所有伤害来源都能享受到增伤效果
   *
   * 效果来源：
   * - 基础：承受元素伤害增加20%（elementDamageIncrease）
   * - E_EX3解锁后：额外增加20%（getVulnerabilityBonus）
   * - 持续时间：基础60秒，解锁E_EX1后减半为30秒
   *
   * @param {Object} skill - 技能对象（元素崩坏 E技能）
   * @param {Object} target - 怪物目标对象
   * @param {Object} player - 玩家对象
   * @param {Object} callbacks - 回调函数对象
   * @returns {boolean} 是否成功应用
   */
  applyElementVulnerabilityToTarget (skill, target, player, callbacks) {
    try {
      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || !target || typeof target !== 'object') {
        return false
      }

      // 只处理元素脆弱类型的DEBUFF
      if (debuff.type !== 'elementVulnerability' && effect.type !== 'elementVulnerability') {
        return false
      }

      // 获取技能等级
      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算DEBUFF效果（传入player以正确判断EX1解锁状态）
      let elementDamageIncrease = 0
      let duration = 0

      if (typeof skill.calculateDebuffEffect === 'function') {
        const debuffEffect = skill.calculateDebuffEffect(safeSkillLevel, player)
        elementDamageIncrease = Number(debuffEffect?.elementDamageIncrease ?? 0)
        duration = Number(debuffEffect?.duration ?? 0)
      } else if (typeof effect.getValue === 'function') {
        elementDamageIncrease = Number(effect.getValue(safeSkillLevel))
        duration = Number(effect.baseDuration ?? 60)
      } else {
        elementDamageIncrease = 20
        duration = 60
      }

      // E_EX3-元素易伤强化被动：额外增加元素伤害（固定+20%）
      let ex3Bonus = 0
      if (player && isSkillUnlocked(player, 'arcane_master', 'E_EX3')) {
        const ex3StaticSkill = getSkill('arcane_master', 'E_EX3')
        if (ex3StaticSkill && typeof ex3StaticSkill.getVulnerabilityBonus === 'function') {
          ex3Bonus = Number(ex3StaticSkill.getVulnerabilityBonus(1)) || 0
        } else {
          ex3Bonus = 20
        }
      }

      // 总增伤 = 基础元素伤害增加 + EX3额外增加
      const totalDamageIncrease = elementDamageIncrease + ex3Bonus

      // 验证数值
      const safeDamageIncrease = Number.isFinite(totalDamageIncrease)
        ? Math.max(0, Math.min(100, totalDamageIncrease))
        : 0
      const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0

      if (safeDamageIncrease <= 0) {
        return false
      }

      // 应用元素脆弱DEBUFF（复用 armorBreakDebuff 的 damageIncrease 字段）
      // 与脆弱烙印/碎甲共用同一字段，取最大值不叠加
      const now = Date.now()
      const nextExpiresAt = now + safeDuration * 1000
      const existing = target.armorBreakDebuff
      const existingExpiresAt = Number(existing?.expiresAt ?? 0) || 0
      const existingDamage = Number(existing?.damageIncrease ?? 0) || 0
      const existingDefense = Number(existing?.defenseReduction ?? 0) || 0
      const existingCritBonus = Number(existing?.critDamageBonus ?? 0) || 0

      toRaw(target).armorBreakDebuff = {
        active: true,
        // 保留已有的防御降低效果（如碎甲），取最大值
        defenseReduction: existingDefense,
        // 增伤取最大值，不叠加
        damageIncrease: Math.max(existingDamage, safeDamageIncrease),
        // 暴击伤害加成保留
        critDamageBonus: existingCritBonus,
        // 刷新持续时间
        expiresAt: Math.max(existingExpiresAt, nextExpiresAt),
        duration: safeDuration,
        source: skill?.name || '元素崩坏',
        icon: effect.icon || skill?.icon || '/pt/skill_icon/yuansubenghuai.png'
      }

      if (callbacks?.addBattleLog) {
        const ex3Text = ex3Bonus > 0 ? `（EX3强化+${ex3Bonus}%）` : ''
        callbacks.addBattleLog(
          `${target?.name || '目标'} 被施加元素脆弱！承受伤害+${safeDamageIncrease}%${ex3Text}（持续 ${safeDuration} 秒）`,
          'debuff'
        )
      }

      return true
    } catch (error) {
      console.error('[SkillEffectService] 应用元素脆弱失败:', error)
      return false
    }
  }

  /**
   * 应用双倍惩戒DEBUFF到所有敌人
   * 被动技能：攻击时概率为所有敌人添加双倍惩戒效果
   * @param {Object} skill - 技能对象
   * @param {Array} monsters - 怪物数组
   * @param {Object} player - 玩家对象
   * @param {Object} callbacks - 回调函数
   * @returns {number} 成功应用DEBUFF的怪物数量
   */
  applyDoubleJudgmentToAllMonsters (skill, monsters, player, callbacks) {
    try {
      if (!skill || !Array.isArray(monsters) || monsters.length === 0) {
        return 0
      }

      const debuff = skill?.debuff
      const effect = debuff?.effect
      if (!debuff || !effect || debuff.type !== 'doubleJudgment') {
        return 0
      }

      // 获取技能等级
      const skillLevel = Number(skill?.proficiencyLevel ?? skill?.level ?? 1)
      const safeSkillLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? skillLevel : 1

      // 计算触发概率
      let chance = Number(debuff?.chance ?? 30)
      if (typeof skill.calculateDebuffChance === 'function') {
        chance = skill.calculateDebuffChance(safeSkillLevel)
      }
      const safeChance = Number.isFinite(chance) ? Math.max(0, Math.min(100, chance)) : 30

      // 概率判断
      if (Math.random() * 100 >= safeChance) {
        return 0
      }

      // 获取伤害倍率
      const damageMultiplier = typeof skill.getDamageMultiplier === 'function'
        ? skill.getDamageMultiplier(safeSkillLevel)
        : 2

      // 获取持续时间（技能定义为5秒）
      const duration = Number(effect.duration ?? 5)
      const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 5

      const now = Date.now()
      const expiresAt = now + safeDuration * 1000

      // 收集需要更新的DEBUFF数据
      const debuffUpdates = []

      // 为所有存活的怪物准备DEBUFF数据
      for (let i = 0; i < monsters.length; i += 1) {
        const monster = monsters[i]
        if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
          continue
        }

        // Canvas-First：使用 toRaw 绕过 Vue 响应式，Canvas 直接从 proxy 读取
        toRaw(monster).doubleJudgmentDebuff = {
          active: true,
          damageMultiplier,
          expiresAt,
          duration: safeDuration,
          source: skill?.name || '双倍惩戒',
          icon: effect.icon || '/pt/skill_icon/rinsupcross.png',
          appliedAt: now
        }

        // 同时收集更新数据用于同步到store
        debuffUpdates.push({
          index: i,
          debuffType: 'doubleJudgment',
          debuffData: {
            active: true,
            damageMultiplier,
            expiresAt,
            duration: safeDuration,
            source: skill?.name || '双倍惩戒',
            icon: effect.icon || '/pt/skill_icon/rinsupcross.png',
            appliedAt: now
          }
        })
      }

      // Canvas-First：批量更新store中的DEBUFF状态（内部使用 toRaw，不触发 Vue 响应式）
      if (debuffUpdates.length > 0) {
        try {
          const monstersStore = useMonstersStore()
          if (monstersStore && typeof monstersStore.applyDebuffBatchUpdates === 'function') {
            monstersStore.applyDebuffBatchUpdates(debuffUpdates)
          }
        } catch (storeError) {
          console.error('[SkillEffectService] 更新怪物DEBUFF状态失败:', storeError)
        }
      }

      if (debuffUpdates.length > 0 && callbacks?.addBattleLog) {
        callbacks.addBattleLog(
          `双倍惩戒触发！${debuffUpdates.length} 个敌人被施加伤害翻倍效果！`,
          'debuff'
        )
      }

      return debuffUpdates.length
    } catch (error) {
      console.error('[SkillEffectService] 应用双倍惩戒失败:', error)
      return 0
    }
  }

  /**
   * 检查并消耗双倍惩戒DEBUFF，返回伤害倍率
   * @param {Object} target - 目标怪物
   * @returns {number} 伤害倍率（1表示无效果，2表示双倍）
   */
  consumeDoubleJudgmentDebuff (target) {
    try {
      if (!target || !target.doubleJudgmentDebuff || !target.doubleJudgmentDebuff.active) {
        return 1
      }

      // 检查是否过期
      const now = Date.now()
      if (target.doubleJudgmentDebuff.expiresAt && now > target.doubleJudgmentDebuff.expiresAt) {
        target.doubleJudgmentDebuff.active = false
        return 1
      }

      // 获取伤害倍率
      const damageMultiplier = Number(target.doubleJudgmentDebuff.damageMultiplier) || 2

      // 消耗DEBUFF（击中后消失）- 使用 toRaw 绕过 Vue 响应式
      const rawTargetForConsume = toRaw(target)
      rawTargetForConsume.doubleJudgmentDebuff = {
        ...rawTargetForConsume.doubleJudgmentDebuff,
        active: false
      }

      // 查找怪物索引并同步更新到store
      try {
        const monstersStore = useMonstersStore()
        if (monstersStore && typeof monstersStore.applyDebuffBatchUpdates === 'function') {
          // 查找怪物索引
          const targetIndex = monstersStore.currentMonsters.findIndex(
            m => m && (m.id === target.id || m === target)
          )
          if (targetIndex >= 0) {
            monstersStore.applyDebuffBatchUpdates([{
              index: targetIndex,
              debuffType: 'doubleJudgment',
              debuffData: {
                ...target.doubleJudgmentDebuff,
                active: false
              }
            }])
          }
        }
      } catch (storeError) {
        console.error('[SkillEffectService] 更新怪物DEBUFF状态失败:', storeError)
      }

      return damageMultiplier
    } catch (error) {
      console.error('[SkillEffectService] 消耗双倍惩戒失败:', error)
      return 1
    }
  }

  /**
   * 暴击判定
   * 使用玩家暴击率属性（criticalRate）进行判定，若无玩家对象则回退至默认10%
   * @param {Object|null} player - 玩家对象，包含 criticalRate 属性
   * @returns {boolean} 是否触发暴击
   */
  checkCritical (player = null) {
    const critRate = Number(player?.criticalRate) || 0
    // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率，截断为100%
    const critChance = Math.min(1, critRate)
    return Math.random() < critChance
  }

  /**
   * 获取暴击伤害倍率
   * 使用玩家暴击伤害属性（criticalDamage），默认1.5倍
   * @param {Object|null} player - 玩家对象，包含 criticalDamage 属性
   * @returns {number} 暴击伤害倍率（如 1.5 表示暴击时伤害×1.5）
   */
  /**
   * 获取玩家暴击伤害倍率
   * 使用玩家暴击伤害属性（criticalDamage），默认1.5倍
   * 龙拳-破劲印记：格斗宗师攻击印记目标时，额外提升暴击伤害
   * @param {Object|null} player - 玩家对象，包含 criticalDamage 属性
   * @param {Object|null} [target=null] - 目标怪物对象，用于检查破劲印记
   * @returns {number} 暴击伤害倍率（如 1.5 表示暴击时伤害×1.5）
   */
  getCriticalDamageMultiplier (player = null, target = null) {
    const critDamage = Number(player?.criticalDamage) || 0
    let multiplier = critDamage > 0 ? critDamage : 1.5

    // 龙拳-破劲印记：格斗宗师攻击印记目标时，额外提升暴击伤害
    if (target) {
      const debuff = target.armorBreakDebuff
      if (debuff?.active && debuff?.expiresAt > Date.now() && Number(debuff?.critDamageBonus) > 0) {
        multiplier += Number(debuff.critDamageBonus) / 100
      }
    }

    return multiplier
  }

  findFirstAliveTarget (monsters, options = {}) {
    const list = Array.isArray(monsters) ? monsters : []
    const preferredIndexRaw = options?.preferredTargetIndex ?? null
    const preferredIdRaw = options?.preferredTargetId ?? null
    const preferredIndex = Number.isInteger(preferredIndexRaw) ? Number(preferredIndexRaw) : null
    const preferredId =
      preferredIdRaw === null || preferredIdRaw === undefined ? null : String(preferredIdRaw)
    if (preferredIndex !== null && preferredIndex >= 0 && preferredIndex < list.length) {
      const monster = list[preferredIndex]
      if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
        return { index: preferredIndex, monster }
      }
    }
    if (preferredId) {
      const idx = list.findIndex(monster => monster && monster.id !== undefined && String(monster.id) === preferredId)
      if (idx >= 0) {
        const monster = list[idx]
        if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
          return { index: idx, monster }
        }
      }
    }
    for (let i = 0; i < list.length; i++) {
      const monster = list[i]
      if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
        return { index: i, monster }
      }
    }
    return null
  }

  /**
   * 派发魔导士技能特效事件
   * 检测技能ID是否属于魔导士技能树，若是则派发全局事件触发特效动画
   * 单体技能事件携带 targetIndex，AOE技能事件携带 isAOE=true
   * @param {Object} skill - 技能对象
   * @param {number} targetIndex - 目标怪物索引（AOE时忽略）
   * @param {boolean} isAOE - 是否为AOE技能
   * @returns {void}
   */
  dispatchMageSkillEffect (skill, targetIndex, isAOE) {
    try {
      const skillId = String(skill?.id || '')
      const effectType = MAGE_SKILL_EFFECT_MAP[skillId]
      if (!effectType) {
        return
      }
      window.dispatchEvent(new CustomEvent('mage-skill-effect', {
        detail: { effectType, targetIndex, isAOE }
      }))
    } catch (e) {
      // 忽略事件派发失败
    }
  }

  playSkillSound (skillType) {
    if (!this.audioService || typeof this.audioService.playSkillSFX !== 'function') {
      return
    }

    let resolvedSkill = skillType
    try {
      const skillsStore = useSkillsStore()
      const skillList = Array.isArray(skillsStore?.skills) ? skillsStore.skills : []
      const normalizedKey = skillType === undefined || skillType === null ? '' : String(skillType)

      if (skillType && typeof skillType === 'object') {
        const needsResolve = !skillType.audio
        if (needsResolve) {
          const found = skillList.find(skill => {
            if (!skill) {
              return false
            }
            const keyMatch = skill.key !== undefined && String(skill.key) === String(skillType?.key ?? '')
            const idMatch = skill.id !== undefined && String(skill.id) === String(skillType?.id ?? '')
            return keyMatch || idMatch
          })
          if (found) {
            resolvedSkill = { ...found, ...skillType }
          }
        }
      } else if (normalizedKey) {
        const found = skillList.find(skill => {
          if (!skill) {
            return false
          }
          const keyMatch = skill.key !== undefined && String(skill.key) === normalizedKey
          const idMatch = skill.id !== undefined && String(skill.id) === normalizedKey
          const nameMatch = skill.name !== undefined && String(skill.name) === normalizedKey
          return keyMatch || idMatch || nameMatch
        })
        if (found) {
          resolvedSkill = found
        }
      }
    } catch (error) {
      console.error('[SkillEffectService] 解析技能音效失败:', error)
    }

    this.audioService.playSkillSFX(resolvedSkill)
  }

  /**
   * 播放技能暴击音效（所有攻击性技能暴击统一播放 PcDmgSwdC.wav）
   * @param {Object} _player - 玩家对象（保留参数兼容性，当前未使用）
   */
  playCriticalSFX (_player) {
    // 战斗已停止时不播放暴击音效，防止 AOE 异步分块处理在 stop() 后继续播放
    if (!this.battleActive) {
      return
    }
    if (!this.audioService || typeof this.audioService.playSFX !== 'function') {
      return
    }
    this.audioService.playSFX('PcDmgSwdC.wav')
  }
}
