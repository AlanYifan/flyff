/**
 * 技能 BUFF 效果计算器
 * 用于生成技能详情面板中 BUFF 效果的中文描述文本
 * 
 * 设计原则：直接调用 skills.js 中的 calculateBuff 方法获取效果数值，
 * 避免重复定义计算公式导致数据不一致
 */
import { ELEMENT_NAMES, BUFF_EFFECT_NAMES } from '@/store/descriptions'
import { getSkill, isSkillUnlocked } from '@/data/skills'
import { getMasteryProgress } from '@/composables/useMasteryProficiency'

export class SkillBuffCalculator {
  /**
   * 获取 BUFF 效果文本的主入口
   * @param {string} playerClass - 玩家职业 key (如 'warrior', 'guardian')
   * @param {string} skillKey - 技能按键 (如 'Q', 'W', 'E')
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选，用于获取属性如智力）
   * @returns {string} HTML 格式的 BUFF 效果描述
   */
  static getBuffEffectText (playerClass, skillKey, skill, player = null) {
    const effectMap = {
      warrior: this.getWarriorBuffEffect,
      priest: this.getPriestBuffEffect,
      archer: this.getArcherBuffEffect,
      ranger: this.getRangerBuffEffect,
      mage: this.getMageBuffEffect,
      guardian: this.getGuardianBuffEffect,
      technician: this.getTechnicianBuffEffect,
      assassin: this.getAssassinBuffEffect,
      knight: this.getKnightBuffEffect,
      blade_warrior: this.getBladeWarriorBuffEffect,
      element_mage: this.getElementMageBuffEffect,
      spirit_mage: this.getSpiritMageBuffEffect,
      fierce_shooter: this.getFierceShooterBuffEffect,
      combat_master: this.getCombatMasterBuffEffect,
      joker_emperor: this.getJokerEmperorBuffEffect,
      nature_messenger: this.getNatureMessengerBuffEffect,
      storm_walker: this.getStormWalkerBuffEffect,
      holy_knight: this.getHolyKnightBuffEffect,
      arcane_master: this.getArcaneMasterBuffEffect,
      mind_master: this.getMindMasterBuffEffect
    }

    const effectFn = effectMap[playerClass]
    return effectFn ? effectFn.call(this, skillKey, skill, player) : this.getDefaultBuffEffect(skill)
  }

  /**
   * 调用技能的 calculateBuff 方法获取效果数值
   * 这是统一的计算入口，避免重复定义公式
   * @param {string} playerClass - 职业名称
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能对象（包含 level, intelligence 等）
   * @param {Object} player - 玩家对象（可选）
   * @returns {Object|null} BUFF 效果对象
   */
  static getCalculatedBuffValues (playerClass, skillKey, skill, player = null) {
    const staticSkill = getSkill(playerClass, skillKey)
    if (!staticSkill || typeof staticSkill.calculateBuff !== 'function') {
      return null
    }

    const level = Number(skill?.level ?? skill?.proficiency?.level ?? 1) || 1
    // 构造一个包含智力的 player 对象用于计算
    const playerForCalc = player || {
      stats: {
        intelligence: skill?.intelligence || 0
      }
    }

    return staticSkill.calculateBuff(playerForCalc, level)
  }

  // ==================== 战士技能效果 ====================

  /**
   * 获取战士技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getWarriorBuffEffect (skillKey, skill, player = null) {
    const warriorEffects = {
      Q: this.getStoneSkinEffect,
      W: this.getGodOfWarEffect,
      E: this.getAxeLightEffect
    }

    const effectFn = warriorEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"坚硬之石"技能效果描述
   * Q技能 - 提升防御力和格挡率
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStoneSkinEffect (skill) {
    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const defenseBonus = this.calculateBonus(effectSource.defense, skill.level)
    const blockBonus = this.calculateBonus(effectSource.block, skill.level)

    return [
      `<div class="skill-tooltip-buff-effect-item">防御力提升: ${Math.floor(defenseBonus)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">格挡率提升: ${Math.floor(blockBonus)}%</div>`
    ].join('')
  }

  /**
   * 获取"战神附体"技能效果描述
   * W技能 - 提升各元素属性攻击力
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getGodOfWarEffect (skill) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const elements = ['fire', 'wind', 'earth', 'thunder', 'water']

    return elements
      .map(element => {
        const effect = effectSource[`${element}Attack`] ?? effectSource[element]
        const bonus = this.calculateBonus(effect, skill.level)
        const elementName = ELEMENT_NAMES[element] || element
        return `<div class="skill-tooltip-buff-effect-item">${elementName}属性攻击力: +${Math.floor(bonus)}%</div>`
      })
      .join('')
  }

  /**
   * 获取"斧光"技能效果描述
   * E技能 - 提升命中率和攻击力
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getAxeLightEffect (skill) {
    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const hitRateBonus = this.calculateBonus(effectSource.hitRate, skill.level)
    const minAttackBonus = this.calculateBonus(effectSource.attackMin, skill.level)
    const maxAttackBonus = this.calculateBonus(effectSource.attackMax, skill.level)

    return [
      `<div class="skill-tooltip-buff-effect-item">命中率提升: +${Math.floor(hitRateBonus)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">最小攻击力提升: +${Math.floor(minAttackBonus)}</div>`,
      `<div class="skill-tooltip-buff-effect-item">最大攻击力提升: +${Math.floor(maxAttackBonus)}</div>`
    ].join('')
  }

  // ==================== 圣职者技能效果 ====================

  /**
   * 获取圣职者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getPriestBuffEffect (skillKey, skill, player = null) {
    const priestEffects = {
      E: this.getAllBlessingEffect
    }

    const effectFn = priestEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"全体祝福"技能效果描述
   * E技能 - 包含多个子技能的复合 BUFF
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getAllBlessingEffect (skill, _player = null) {
    // 兼容 SKILL_CONFIG 原始格式（subSkills 在 proficiency.effect.subSkills 中）
    // 和 store 归一化格式（subSkills 在顶层）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    const subSkills = skill.subSkills || effectSource?.subSkills
    if (!subSkills) {
      return ''
    }

    // 安全获取技能等级：SKILL_CONFIG 原始技能无顶层 level，使用 proficiency.level 回退
    const skillLevel = Number(skill.level ?? skill.proficiency?.level ?? 1) || 1

    return Object.entries(subSkills)
      .map(([_key, subSkill]) => {
        const { name, description, rate } = subSkill
        if (!name) {
          return ''
        }

        const value = this.getSubSkillValue(subSkill, skillLevel)
        const suffix = rate ? '%' : ''

        return `<div class="skill-tooltip-buff-effect-item">${name} : ${description || name} + ${Number.isInteger(value) ? value : value.toFixed(1)}${suffix}</div>`
      })
      .join('')
  }

  // ==================== 弓箭手技能效果 ====================

  /**
   * 获取弓箭手技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcherBuffEffect (skillKey, skill, _player = null) {
    const archerEffects = {
      Q: () => this.getArcherWeaponMasteryEffect(skill),
      W: () => this.getBlockRateEffect(skill)
    }

    const effectFn = archerEffects[skillKey]
    return effectFn ? effectFn() : ''
  }

  // ==================== 游侠技能效果 ====================

  /**
   * 获取游侠技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getRangerBuffEffect (skillKey, skill, player = null) {
    const rangerEffects = {
      E: this.getCriticalShotEffect,
      R: this.getNatureInsightEffect,
      Y: this.getAyrifBlessingEffect
    }

    const effectFn = rangerEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"致命射击"技能效果描述
   * E技能 - 提升暴击率
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getCriticalShotEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('ranger', 'E', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalCritBonus = buffValues.criticalRate || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">暴击率: +${Math.floor(totalCritBonus)}%</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"自然领悟"技能效果描述
   * R技能 - 提升魔法防御和攻击速度
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getNatureInsightEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('ranger', 'R', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalMagicDefense = buffValues.magicDefensePercentage || 0
    const totalAttackSpeed = buffValues.attackSpeed || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">魔法防御: +${Math.floor(totalMagicDefense)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击速度: +${Math.floor(totalAttackSpeed)}%</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"艾梨芙的祝福"技能效果描述
   * Y技能 - 提升最大生命值百分比和暴击伤害
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getAyrifBlessingEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('ranger', 'Y', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalMaxHpPercent = buffValues.maxHpPercentage || 0
    const totalCritDamage = buffValues.criticalDamage || 0

    // 计算持续时间
    const agility = player?.stats?.agility || 0
    const baseDuration = 180 // 3分钟
    const totalDuration = baseDuration + Math.floor(agility / 10)
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">最大生命值: +${totalMaxHpPercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击伤害: +${totalCritDamage}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  // ==================== 暗杀者技能效果 ====================

  /**
   * 获取暗杀者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getAssassinBuffEffect (skillKey, skill, player = null) {
    const assassinEffects = {
      Q: this.getTripleForceEffect,
      W: this.getSpiritSwingsEffect,
      U: this.getLuolianBlessingEffect
    }

    const effectFn = assassinEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"三相之力"技能效果描述
   * Q技能 - 提升命中率、攻击速度、生命偷取
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getTripleForceEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('assassin', 'Q', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalHitRate = buffValues.hitRate || 0
    const totalAttackSpeed = buffValues.attackSpeed || 0
    const totalLifeSteal = buffValues.lifeSteal || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">命中率: +${Math.floor(totalHitRate)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击速度: +${Math.floor(totalAttackSpeed)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">生命偷取: +${totalLifeSteal}%</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"斗志风轮"技能效果描述
   * W技能 - 提升暴击率和格挡穿透
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getSpiritSwingsEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('assassin', 'W', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalCriticalRate = buffValues.criticalRate || 0
    const totalBlockPenetration = buffValues.blockPenetration || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">暴击率: +${Math.floor(totalCriticalRate)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">格挡穿透: +${Math.floor(totalBlockPenetration)}%</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"萝丽安的祝福"技能效果描述
   * U技能 - 提升敏捷、暴击伤害，大圆满时追加吸血加成
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getLuolianBlessingEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('assassin', 'U', skill, player)

    if (!buffValues) {
      return ''
    }

    const agility = player?.stats?.agility || player?.agility || skill?.agility || 0
    const level = skill?.level || 1

    // 从静态技能配置获取公式参数
    const staticSkill = getSkill('assassin', 'U')
    const effectConfig = staticSkill?.proficiency?.effect || {}

    // 从配置读取参数
    const agiConfig = effectConfig.agility || {}
    const critDmgConfig = effectConfig.criticalDamage || {}

    // 使用配置计算熟练度基础加成
    const baseAgi = this.calculateBonus(agiConfig, level)
    const baseCritDmg = this.calculateBonus(critDmgConfig, level)

    // 最终加成（从 calculateBuff 获取，确保一致性）
    const totalAgility = buffValues.agility || 0
    const totalCritDamage = buffValues.criticalDamage?.add || buffValues.criticalDamage || 0
    const totalLifeSteal = buffValues.lifeSteal?.add || buffValues.lifeSteal || 0

    // 计算持续时间
    const duration = 60 + Math.floor(agility / 10)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">敏捷: +${Math.floor(totalAgility)} (基础${Math.floor(baseAgi)}, 每级+10)</div>`,
      `<div class="skill-tooltip-buff-effect-item">暴击伤害: +${totalCritDamage}% (基础${baseCritDmg}%, 每级+2%)</div>`
    ]

    // 大圆满吸血加成：固定5%，仅10级（大圆满）时生效
    const maxLifeSteal = 5
    if (totalLifeSteal > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">大圆满吸血: +${totalLifeSteal}% (已激活)</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ff4444;">吸血: +${maxLifeSteal}% (大圆满10级解锁, 当前${level}级)</div>`)
    }

    lines.push(`<div class="skill-tooltip-buff-effect-item">持续时间: ${duration}秒 (基础60秒 + 敏捷/10)</div>`)

    return lines.join('')
  }

  /**
   * 获取武器精通效果描述（通用）
   * @param {Object} skill - 技能配置对象
   * @param {string} weaponName - 武器名称
   * @returns {string} HTML 格式的效果描述
   */
  static getWeaponMasteryEffect (skill, weaponName) {
    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const bonus = this.calculateBonus(effectSource, skill.level)
    return `<div class="skill-tooltip-buff-effect-item">${weaponName}: +${Math.floor(bonus)}</div>`
  }

  /**
   * 获取弓箭手武器精通效果描述
   * Q技能 - 提升弓和飞轮攻击力
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcherWeaponMasteryEffect (skill) {
    const bowLine = this.getWeaponMasteryEffect(skill, '弓攻击力')
    const yoyoLine = this.getWeaponMasteryEffect(skill, '飞轮攻击力')
    return [bowLine, yoyoLine].filter(Boolean).join('')
  }

  /**
   * 获取格挡率提升效果描述
   * W技能 - 提升格挡率
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getBlockRateEffect (skill) {
    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const bonus = this.calculateBonus(effectSource, skill.level)
    return `<div class="skill-tooltip-buff-effect-item">格挡率提升: +${Math.floor(bonus)}%</div>`
  }

  // ==================== 魔导士技能效果 ====================

  /**
   * 获取魔导士技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMageBuffEffect (skillKey, skill, _player = null) {
    if (typeof skill.buffCalculation === 'function') {
      return this.getCalculatedBuffEffect(skill)
    }

    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (effectSource) {
      return this.getProficiencyBuffEffect({ ...skill, proficiencyEffect: effectSource })
    }

    return ''
  }

  // ==================== 守护使者技能效果 ====================

  /**
   * 获取守护使者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getGuardianBuffEffect (skillKey, skill, player = null) {
    const guardianEffects = {
      W: this.getProtectionEffect,
      E: this.getAttackEnhanceEffect,
      T: this.getBattleSongEffect,
      U: this.getAilandeBlessingEffect
    }

    const effectFn = guardianEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"守护术"技能效果描述
   * W技能 - 提升防御力和魔法防御力
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getProtectionEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('guardian', 'W', skill, player)
    
    if (!buffValues) {
      return ''
    }

    const intelligence = player?.stats?.intelligence || player?.intelligence || skill?.intelligence || 0
    const level = skill?.level || 1

    // 从静态技能配置获取公式参数
    const staticSkill = getSkill('guardian', 'W')
    const effectConfig = staticSkill?.proficiency?.effect || {}
    
    // 使用配置计算熟练度基础加成（使用新的 key 名称）
    const defConfig = effectConfig.defensePercentage || {}
    const mdefConfig = effectConfig.magicDefensePercentage || {}
    const baseDefensePercent = this.calculateBonus(defConfig, level)
    const baseMagicDefensePercent = this.calculateBonus(mdefConfig, level)

    // 智力加成
    const intBonusPercent = Math.min(Number(Math.floor(intelligence / 25)) * 1, 10)

    // 最终加成（从 calculateBuff 获取）
    const totalDefensePercent = buffValues.defensePercentage || 0
    const totalMagicDefensePercent = buffValues.magicDefensePercentage || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">熟练度: 防御力 +${baseDefensePercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 魔法防御力 +${baseMagicDefensePercent}%</div>`
    ]
    
    if (intBonusPercent > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +${intBonusPercent}% (每25智力+1%, 最高10%)</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +0% (当前智力: ${intelligence}, 每25智力+1%)</div>`)
    }
    
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总防御力: +${totalDefensePercent}%</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总魔法防御: +${totalMagicDefensePercent}%</div>`)

    return lines.join('')
  }

  /**
   * 获取"攻击强化"技能效果描述
   * E技能 - 提升最小和最大攻击力
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getAttackEnhanceEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('guardian', 'E', skill, player)
    
    if (!buffValues) {
      return ''
    }

    const intelligence = player?.stats?.intelligence || player?.intelligence || skill?.intelligence || 0
    const level = skill?.level || 1

    // 从静态技能配置获取公式参数
    const staticSkill = getSkill('guardian', 'E')
    const effectConfig = staticSkill?.proficiency?.effect || {}
    
    // 使用配置计算熟练度基础加成
    const atkMinConfig = effectConfig.attackMin || {}
    const baseAttackBonus = this.calculateBonus(atkMinConfig, level)

    // 智力加成
    const intBonus = Math.min(Math.floor(intelligence / 25) * 25, 250)

    // 最终加成（从 calculateBuff 获取）
    const totalAttackBonus = buffValues.attackMin || buffValues.attackMax || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">熟练度: 最小攻击力 +${Math.floor(baseAttackBonus)}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 最大攻击力 +${Math.floor(baseAttackBonus)}</div>`
    ]
    
    if (intBonus > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +${Math.floor(intBonus)} (每25智力+25, 最高250)</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +0 (当前智力: ${intelligence}, 每25智力+25)</div>`)
    }
    
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总最小攻击力: +${Math.floor(totalAttackBonus)}</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总最大攻击力: +${Math.floor(totalAttackBonus)}</div>`)

    return lines.join('')
  }

  /**
   * 获取"战斗之歌"技能效果描述
   * T技能 - 提升攻击力、攻击速度和施法速度
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getBattleSongEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值，避免重复定义公式
    const buffValues = this.getCalculatedBuffValues('guardian', 'T', skill, player)
    
    if (!buffValues) {
      return ''
    }

    const intelligence = player?.stats?.intelligence || player?.intelligence || skill?.intelligence || 0
    const level = skill?.level || 1

    // 从静态技能配置获取公式参数（而非重复定义）
    const staticSkill = getSkill('guardian', 'T')
    const effectConfig = staticSkill?.proficiency?.effect || {}
    
    // 从配置读取参数
    const attackConfig = effectConfig.attackMin || {}
    const atkSpeedConfig = effectConfig.attackSpeedPercentage || {}
    const castSpeedConfig = effectConfig.castSpeedPercentage || {}
    
    // 使用配置计算熟练度基础加成
    const baseAtk = this.calculateBonus(attackConfig, level)
    const baseAtkSpeed = this.calculateBonus(atkSpeedConfig, level)
    const baseCastSpeed = this.calculateBonus(castSpeedConfig, level)

    // 智力加成（这部分公式简单，可保留）
    const intBonusPercent = Math.min(Math.floor(intelligence / 25) * 0.5, 15)

    // 最终加成（从 calculateBuff 获取，确保一致性）
    const totalAttackPercent = buffValues.attackMin || buffValues.attackMax || 0
    const totalAttackSpeedPercent = buffValues.attackSpeedPercentage || 0
    const totalCastSpeedPercent = buffValues.castSpeedPercentage || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">熟练度: 攻击力 +${baseAtk.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 攻击速度 +${baseAtkSpeed.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 施法速度 +${baseCastSpeed.toFixed(1)}%</div>`
    ]
    
    if (intBonusPercent > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +${intBonusPercent.toFixed(1)}% (每25智力+0.5%, 最高15%)</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item">智力: +0% (当前智力: ${intelligence}, 每25智力+0.5%)</div>`)
    }
    
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总攻击力: +${totalAttackPercent.toFixed(1)}%</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总攻击速度: +${totalAttackSpeedPercent.toFixed(1)}%</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总施法速度: +${totalCastSpeedPercent.toFixed(1)}%</div>`)

    return lines.join('')
  }

  /**
   * 获取"爱岚德的祝福"技能效果描述
   * U技能 - 提升体质、智力、格挡率，大圆满时追加治疗加成
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getAilandeBlessingEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('guardian', 'U', skill, player)

    if (!buffValues) {
      return ''
    }

    const intelligence = player?.stats?.intelligence || player?.intelligence || skill?.intelligence || 0
    const level = skill?.level || 1

    // 从静态技能配置获取公式参数
    const staticSkill = getSkill('guardian', 'U')
    const effectConfig = staticSkill?.proficiency?.effect || {}

    // 从配置读取参数
    const conConfig = effectConfig.constitution || {}
    const intConfig = effectConfig.intelligence || {}
    const blockConfig = effectConfig.blockRate || {}

    // 使用配置计算熟练度基础加成
    const baseCon = this.calculateBonus(conConfig, level)
    const baseInt = this.calculateBonus(intConfig, level)
    const baseBlock = this.calculateBonus(blockConfig, level)

    // 最终加成（从 calculateBuff 获取，确保一致性）
    const totalConstitution = buffValues.constitution || 0
    const totalIntelligence = buffValues.intelligence || 0
    const blockRateRaw = buffValues.blockRate
    const totalBlockRate = blockRateRaw && typeof blockRateRaw === 'object'
      ? Number(blockRateRaw.add || 0)
      : Number(blockRateRaw || 0)
    const healPercentRaw = buffValues.healPercent
    const totalHealPercent = healPercentRaw && typeof healPercentRaw === 'object'
      ? Number(healPercentRaw.add || 0)
      : Number(healPercentRaw || 0)

    // 持续时间：基础60秒 + 每10点智力增加1秒
    const extraDuration = Math.floor(intelligence / 10)
    const totalDuration = 60 + extraDuration

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">体质: +${Math.floor(baseCon)} (每级+10, 最高100)</div>`,
      `<div class="skill-tooltip-buff-effect-item">智力: +${Math.floor(baseInt)} (每级+10, 最高100)</div>`,
      `<div class="skill-tooltip-buff-effect-item">格挡率: +${baseBlock}% (每级+2%, 最高20%)</div>`
    ]

    if (totalHealPercent > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #00CED1;">大圆满治疗加成: +${totalHealPercent}%</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item">治疗加成: 未激活 (需10级大圆满)</div>`)
    }

    lines.push(`<div class="skill-tooltip-buff-effect-item">持续时间: ${totalDuration}秒 (基础60秒 + 每10智力+1秒)</div>`)

    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总体质: +${Math.floor(totalConstitution)}</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总智力: +${Math.floor(totalIntelligence)}</div>`)
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffd700;">总格挡率: +${totalBlockRate}%</div>`)

    return lines.join('')
  }

  // ==================== 技师技能效果 ====================

  /**
   * 获取技师技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getTechnicianBuffEffect (skillKey, skill, player = null) {
    const technicianEffects = {
      Q: this.getTechnicianKnuckleMasteryEffect,
      W: this.getTechnicianStormEffect,
      E: this.getTechnicianLastStandEffect,
      R: this.getTechnicianXuliBlessingEffect
    }

    const effectFn = technicianEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"拳术领悟"技能效果描述
   * Q技能 - 提升命中率、攻击速度、攻击力
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getTechnicianKnuckleMasteryEffect (skill, _player = null) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

const level = Number(skill.level ?? skill.proficiency?.level ?? 1) || 1

// 命中率：1.5% * 等级
    const hitRateBase = effectSource.hitRate?.base || 1.5
    const hitRateIncrement = effectSource.hitRate?.increment || 1.5
    const hitRate = hitRateBase + hitRateIncrement * (level - 1)

    // 攻击速度：1.5% * 等级
    const attackSpeedBase = effectSource.attackSpeed?.base || 1.5
    const attackSpeedIncrement = effectSource.attackSpeed?.increment || 1.5
    const attackSpeed = attackSpeedBase + attackSpeedIncrement * (level - 1)

    // 攻击力：50 * 等级
    const attackBase = effectSource.attackMin?.base || 50
    const attackIncrement = effectSource.attackMin?.increment || 50
    const attack = attackBase + attackIncrement * (level - 1)

    return [
      `<div class="skill-tooltip-buff-effect-item">熟练度: 命中率 +${hitRate.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 攻击速度 +${attackSpeed.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 最小攻击力 +${Math.floor(attack)}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度: 最大攻击力 +${Math.floor(attack)}</div>`
    ].join('')
  }

  /**
   * 获取"叙里的祝福"技能效果描述
   * R技能 - 增加智力、体质、攻击速度、暴击率
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getTechnicianXuliBlessingEffect (skill, player = null) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const level = Number(skill.level ?? skill.proficiencyLevel ?? skill.proficiency?.level ?? 1) || 1

    // 智力/体质：使用查找表（1级5，10级100，线性插值取整）
    const statTable = effectSource.intelligence?.damageTable ||
      [5, 16, 26, 37, 47, 58, 68, 79, 89, 100]
    const statIdx = Math.max(0, Math.min(statTable.length - 1, level - 1))
    const statBonus = statTable[statIdx]

    // 攻击速度：2% * 等级（1级2%，10级20%）
    const attackSpeedBase = effectSource.attackSpeed?.base || 2
    const attackSpeedIncrement = effectSource.attackSpeed?.increment || 2
    const attackSpeed = attackSpeedBase + attackSpeedIncrement * (level - 1)

    // 暴击率：2% * 等级（1级2%，10级20%）
    const critRateBase = effectSource.criticalRate?.base || 2
    const critRateIncrement = effectSource.criticalRate?.increment || 2
    const critRate = critRateBase + critRateIncrement * (level - 1)

    // 持续时间：基础300秒 + 智力×2 + 体质×2
    const intelligence = player?.stats?.intelligence || 0
    const constitution = player?.stats?.constitution || 0
    const totalDuration = 300 + Math.floor(intelligence * 2) + Math.floor(constitution * 2)
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    return [
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">智力: +${statBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">体质: +${statBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">攻击速度: +${attackSpeed}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">暴击率: +${critRate}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度等级: ${level}</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ].join('')
  }

  /**
   * 获取"斗气风暴"技能效果描述
   * W技能 - AOE伤害技能
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getTechnicianStormEffect (skill, player = null) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

const level = Number(skill.level ?? skill.proficiency?.level ?? 1) || 1

// 基础伤害
const baseDamage = 124

    // 熟练度伤害加成：60 * 等级（1级=60，10级=600）
    const proficiencyDamage = 60 * level

    // 智力加成
    const intelligence = player?.stats?.intelligence || 0
    const intDamage = Math.floor(intelligence * 4.18)

    // 攻击力（取平均攻击力）
    const minAttack = player?.minAttack || 0
    const maxAttack = player?.maxAttack || 0
    const attackDamage = Math.floor((minAttack + maxAttack) / 2)

    // 总伤害
    const totalDamage = baseDamage + proficiencyDamage + intDamage + attackDamage

    return [
      `<div class="skill-tooltip-buff-effect-item">基础伤害: ${baseDamage}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度伤害: +${proficiencyDamage} (60×等级)</div>`,
      `<div class="skill-tooltip-buff-effect-item">智力加成: +${intDamage} (智力×4.18)</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击力: +${attackDamage}</div>`,
      `<div class="skill-tooltip-buff-effect-item">预计总伤害: ${totalDamage}</div>`
    ].join('')
  }

  /**
   * 获取"背水一击"技能效果描述
   * E技能 - 消耗全部MP造成致命一击
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getTechnicianLastStandEffect (skill, player = null) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

const level = Number(skill.level ?? skill.proficiency?.level ?? 1) || 1

// 基础伤害
const baseDamage = 100

    // 熟练度伤害加成查找表：1级+100，每级+100，9级+900，10级+1500
    const damageTable = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1500]
    const clampedLevel = Math.max(1, Math.min(10, level))
    const proficiencyDamage = damageTable[clampedLevel - 1]

    // 智力加成
    const intelligence = player?.stats?.intelligence || 0
    const intDamage = Math.floor(intelligence * 5.18)

    // 攻击力（取平均攻击力）
    const minAttack = player?.minAttack || 0
    const maxAttack = player?.maxAttack || 0
    const attackDamage = Math.floor((minAttack + maxAttack) / 2)

    // MP最大值加成
    const mpBonus = player?.maxMana || 0

    // 总伤害
    const totalDamage = baseDamage + proficiencyDamage + intDamage + attackDamage + mpBonus

    return [
      `<div class="skill-tooltip-buff-effect-item">基础伤害: ${baseDamage}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度伤害: +${proficiencyDamage} (等级${level})</div>`,
      `<div class="skill-tooltip-buff-effect-item">智力加成: +${intDamage} (智力×5.18)</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击力: +${attackDamage}</div>`,
      `<div class="skill-tooltip-buff-effect-item">MP加成: +${mpBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item">预计总伤害: ${totalDamage}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #ff6b6b;">消耗: 当前全部MP</div>`
    ].join('')
  }

  // ==================== 骑士技能效果 ====================

  /**
   * 获取骑士技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getKnightBuffEffect (skillKey, skill, player = null) {
    const knightEffects = {
      E: this.getFrenzyHeartEffect,
      T: this.getSacrificeEffect,
      U: this.getKalanduoBlessingEffect
    }

    const effectFn = knightEffects[skillKey]
    // 如果没有特定处理函数，使用默认处理
    return effectFn ? effectFn.call(this, skill, player) : this.getDefaultBuffEffect(skill)
  }

  /**
   * 获取"狂暴之心"技能效果描述
   * E技能 - 提升命中率、攻击速度、暴击率
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getFrenzyHeartEffect (skill, player = null) {
    const level = skill?.level || skill?.proficiencyLevel || 1

    // 命中率：1级1.5%，10级15%
    const hitRateBonus = 1.5 + (level - 1) * 1.5
    // 攻击速度：1级1.5%，10级15%
    const attackSpeedBonus = 1.5 + (level - 1) * 1.5
    // 暴击率：1级1.5%，10级15%
    const critRateBonus = 1.5 + (level - 1) * 1.5

    // 持续时间计算
    const baseDuration = 600 // 10分钟
    const strength = player?.stats?.strength || 0
    const strBonus = Math.floor(strength / 25) * 60 // 每25点力量增加1分钟
    const totalDuration = baseDuration + strBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    return [
      `<div class="skill-tooltip-buff-effect-item">命中率提升: +${hitRateBonus.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击速度提升: +${attackSpeedBonus.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">暴击率提升: +${critRateBonus.toFixed(1)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #ffaa00;">激活时每次普攻消耗1%最大MP</div>`
    ].join('')
  }

  /**
   * 获取"牺牲"技能效果描述
   * T技能 - 提升攻击力、格挡穿透，但增加自身承伤
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getSacrificeEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('knight', 'T', skill, player)

    if (!buffValues) {
      return ''
    }

    const strength = player?.stats?.strength || 0

    // 持续时间：基础5分钟 + 力量 * 2 秒
    const baseDuration = 300 // 5分钟
    const strBonus = Math.floor(strength * 2)
    const totalDuration = baseDuration + strBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    // 效果值（从 calculateBuff 获取）
    const atkBonus = buffValues.attackMin || buffValues.attackMax || 0
    const damageTaken = buffValues.damageTakenIncrease || 0
    const blockPenetration = buffValues.blockPenetration || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">最小攻击力: +${atkBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">最大攻击力: +${atkBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">格挡穿透: +${blockPenetration}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #ff6b6b;">自身承伤: +${damageTaken}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"卡兰铎的祝福"技能效果描述
   * U技能 - 提升体质、防御力、双倍惩戒概率，大圆满时追加最大生命值加成
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getKalanduoBlessingEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('knight', 'U', skill, player)

    if (!buffValues) {
      return ''
    }

    const strength = player?.stats?.strength || 0

    // 持续时间：基础1分钟 + 每10点力量增加1秒
    const baseDuration = 60
    const strBonus = Math.floor(strength / 10)
    const totalDuration = baseDuration + strBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    // 效果值（从 calculateBuff 获取）
    const constitutionBonus = buffValues.constitution || 0
    const defenseMinRaw = buffValues.defenseMin
    const defensePercent = defenseMinRaw && typeof defenseMinRaw === 'object'
      ? Number(defenseMinRaw.add || 0)
      : Number(defenseMinRaw || 0)
    const doubleJudgmentBonus = buffValues.doubleJudgmentChance || 0
    const maxHealthRaw = buffValues.maxHealth
    const maxHealthPercent = maxHealthRaw && typeof maxHealthRaw === 'object'
      ? Number(maxHealthRaw.add || 0)
      : Number(maxHealthRaw || 0)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">体质提升: +${constitutionBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item">最小防御力: +${defensePercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">最大防御力: +${defensePercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">双倍惩戒概率: +${doubleJudgmentBonus}%</div>`
    ]

    // 大圆满效果：最大生命值+15%
    if (maxHealthPercent > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #ffaa00;">大圆满·最大生命值: +${maxHealthPercent}%</div>`)
    } else {
      lines.push(`<div class="skill-tooltip-buff-effect-item">最大生命值加成: 未激活 (需10级大圆满)</div>`)
    }

    lines.push(`<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`)

    return lines.join('')
  }

  // ==================== 刀锋战士技能效果 ====================

  /**
   * 获取刀锋战士技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getBladeWarriorBuffEffect (skillKey, skill, player = null) {
    const bladeWarriorEffects = {
      W: this.getBerserkEffect,
      E: this.getNightfallEffect,
      R: this.getCorelBlessingEffect,
      P: this.getDualWieldEffect
    }

    const effectFn = bladeWarriorEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : this.getDefaultBuffEffect(skill)
  }

  // ==================== 元素使者技能效果 ====================

  /**
   * 获取"双刀流"被动技能效果描述
   * P技能 - 副手武器50%属性加成 + 攻击时概率触发副手普通攻击
   * @param {Object} skill - 技能配置对象
   * @param {Object} _player - 玩家对象（可选，未使用）
   * @returns {string} HTML 格式的效果描述
   */
  static getDualWieldEffect (skill, _player = null) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">⚡ 被动技能</div>',
      '<div class="skill-tooltip-buff-effect-item">解锁双持武器能力，副手可装备武器</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">副手武器属性加成: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #95a5a6; font-size: 12px;">包含攻击力、附加属性、卡片属性、随机属性</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">⚔ 副手攻击: 攻击时100%概率触发副手普通攻击</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #95a5a6; font-size: 12px;">每次普通攻击触发时，副手额外攻击一次</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取元素使者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getElementMageBuffEffect (skillKey, skill, player = null) {
    const elementMageEffects = {
      Q: this.getFiveElementsCultivationEffect
    }

    const effectFn = elementMageEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : this.getDefaultBuffEffect(skill)
  }

  /**
   * 获取"赫雷森.凯列蓝的祝福"技能效果描述
   * Q技能 - 提升暴击率、暴击伤害、五行元素属性攻击力
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getFiveElementsCultivationEffect (skill, player = null) {
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    const elements = ['fire', 'wind', 'earth', 'thunder', 'water']

    // 计算持续时间：基础1分钟 + 每10点智力增加1秒
    const intelligence = player?.stats?.intelligence || skill?.intelligence || 0
    const baseDuration = 60 // 1分钟
    const totalDuration = baseDuration + Math.floor(Math.max(0, intelligence) / 10)
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const effectLines = []

    // 暴击率加成
    const critRateEffect = effectSource.criticalRate
    if (critRateEffect) {
      const critRateBonus = this.calculateBonus(critRateEffect, skill.level)
      effectLines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击率: +${Math.floor(critRateBonus)}%</div>`)
    }

    // 暴击伤害加成
    const critDamageEffect = effectSource.criticalDamage
    if (critDamageEffect) {
      const critDamageBonus = this.calculateBonus(critDamageEffect, skill.level)
      effectLines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">暴击伤害: +${Math.floor(critDamageBonus)}%</div>`)
    }

    // 五行属性攻击力加成
    elements.forEach(element => {
      const effect = effectSource[element]
      const bonus = this.calculateBonus(effect, skill.level)
      const elementName = ELEMENT_NAMES[element] || element
      effectLines.push(`<div class="skill-tooltip-buff-effect-item">${elementName}属性攻击力: +${Math.floor(bonus)}%</div>`)
    })

    effectLines.push(`<div class="skill-tooltip-buff-effect-item">最终持续时间: ${durationText}</div>`)

    return effectLines.join('')
  }

  /**
   * 获取"狂暴"技能效果描述
   * W技能 - 提升命中率、攻击速度、攻击力、格挡穿透，降低防御力
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getBerserkEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('blade_warrior', 'W', skill, player)

    if (!buffValues) {
      return ''
    }

    const strength = player?.stats?.strength || 0

    // 持续时间：基础3分钟 + 每4点力量+1秒
    const baseDuration = 180 // 3分钟
    const strBonus = Math.floor(strength / 4)
    const totalDuration = baseDuration + strBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    // 效果值（从 calculateBuff 获取）
    const hitRateBonus = buffValues.hitRate || 0
    const attackSpeedBonus = buffValues.attackSpeed || 0
    const attackBonus = buffValues.attackMin || buffValues.attackMax || 0
    const blockPenetration = buffValues.blockPenetration || 0
    const defenseReduction = buffValues.defenseMin || buffValues.defenseMax || 0

    const lines = [
      `<div class="skill-tooltip-buff-effect-item">命中率提升: +${hitRateBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击速度提升: +${attackSpeedBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">攻击力: +${attackBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">格挡穿透: +${blockPenetration}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #ff6b6b;">防御力降低: ${defenseReduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"席瑞儿.安得利尔的祝福"技能效果描述
   * R技能 - 提升格挡率和暴击伤害
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getCorelBlessingEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('blade_warrior', 'R', skill, player)

    if (!buffValues) {
      return ''
    }

    const strength = player?.stats?.strength || 0

    // 持续时间：基础3分钟 + 每10点力量+1秒
    const baseDuration = 180 // 3分钟
    const strBonus = Math.floor(strength / 10)
    const totalDuration = baseDuration + strBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    // 效果值（从 calculateBuff 获取）
    const blockRateBonus = buffValues.blockRate || 0
    const critDamageBonus = buffValues.criticalDamage || 0

    // 副手武器攻击力加成（被动效果，基于R技能熟练度等级）
    // 1级+5%，每级+5%，10级+50%
    const proficiencyLevel = skill?.level || skill?.proficiencyLevel || 1
    const offhandAtkBonus = Math.min(proficiencyLevel, 10) * 5

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">格挡率: +${blockRateBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击伤害: +${critDamageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">⚔ 副手武器攻击力: +${offhandAtkBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #95a5a6; font-size: 12px;">仅影响副手武器最小/最大攻击力</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"夜幕降临"技能效果描述
   * E技能 - 降低目标命中率
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getNightfallEffect (skill, _player = null) {
    const level = skill?.level || skill?.proficiencyLevel || 1

    // 命中率减少：1级5%，10级50%
    const hitRateReduction = 5 + (level - 1) * 5

    // 持续时间：固定15秒
    const durationText = '15秒'

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #ff6b6b;">命中率降低: -${hitRateReduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  // ==================== 精神使者技能效果 ====================

  /**
   * 获取精神使者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getSpiritMageBuffEffect (skillKey, skill, player = null) {
    // 支持"能量反弹"等中文技能名
    const spiritMageEffects = {
      Q: null, // 神念攻击是伤害技能
      混沌封印: null, // AOE伤害技能
      能量反弹: this.getEnergyReflectEffect,
      念力护盾: this.getPsychicShieldEffect,
      赛乐的祝福: this.getSyleBlessingEffect
    }

    const effectFn = spiritMageEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"能量反弹"技能效果描述
   * BUFF技能 - 将受到的物理伤害加倍返还回去
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getEnergyReflectEffect (skill, player = null) {
    const level = skill?.level || skill?.proficiencyLevel || 1
    const staBonus = player?.stats?.constitution || player?.stats?.sta || 0

    // 熟练度反弹：1级50%，每级+50%
    const proficiencyReflect = 50 + (level - 1) * 50

    // 总反弹伤害百分比 = 熟练度 + 体质加成
    const totalReflect = proficiencyReflect + staBonus

    // 持续时间：基础5分钟 + 每1点体质+1秒
    const baseDuration = 300 // 5分钟
    const totalDuration = baseDuration + staBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">反弹伤害: ${totalReflect}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度加成: +${proficiencyReflect}% (等级${level})</div>`,
      `<div class="skill-tooltip-buff-effect-item">体质加成: +${staBonus}% (体质${staBonus})</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"念力护盾"技能效果描述
   * BUFF技能 - 吸收部分来自敌人的伤害
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
static getPsychicShieldEffect (skill, player = null) {
const level = skill?.level || skill?.proficiencyLevel || 1
const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
const maxHealth = skill?.maxHealth || player?.maxHealth || 1000

// 熟练度吸收：1级5%，每级+5%，10级50%，上限50%
const proficiencyAbsorb = Math.min(50, 5 + (level - 1) * 5)

// 体质加成：每10点体质增加1%吸收，上限50%
const staAbsorbBonus = Math.min(50, Math.floor(staBonus / 10))

// 总吸收百分比，上限100%
const totalAbsorbPercent = Math.min(100, proficiencyAbsorb + staAbsorbBonus)

// 计算可吸收的最大伤害值
const maxAbsorbDamage = Math.floor(maxHealth * totalAbsorbPercent / 100)

// 持续时间：基础5分钟 + 每1点体质+1秒
const baseDuration = 300 // 5分钟
const totalDuration = baseDuration + staBonus
const durationMinutes = Math.floor(totalDuration / 60)
const durationSeconds = totalDuration % 60
const durationText = durationSeconds > 0
? `${durationMinutes}分${durationSeconds}秒`
: `${durationMinutes}分钟`

// 格式化伤害值显示（每4位加逗号）
const formatNumber = (num) => {
return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">伤害吸收: ${totalAbsorbPercent}%最大生命值</div>`,
      `<div class="skill-tooltip-buff-effect-item">可吸收伤害: ${formatNumber(maxAbsorbDamage)}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度加成: +${proficiencyAbsorb}% (等级${level}, 上限50%)</div>`,
      `<div class="skill-tooltip-buff-effect-item">体质加成: +${staAbsorbBonus}% (体质${staBonus}, 上限50%)</div>`,
      `<div class="skill-tooltip-buff-effect-item">总吸收上限: 100%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  /**
   * 获取"赛乐的祝福"技能效果描述
   * BUFF技能 - 增加智力和体质，攻击触发DEBUFF
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getSyleBlessingEffect (skill, player = null) {
    const level = skill?.level || skill?.proficiencyLevel || 1
    const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
    const intBonus = player?.stats?.intelligence || player?.stats?.int || 0

    // 熟练度加成：1级+5，每级+5，10级+50
    const statBonus = 5 + (level - 1) * 5

    // DEBUFF效果计算
    const stunChance = 3 + (level - 1) * 3
    const attackReductionChance = 3 + (level - 1) * 3
    const attackReduction = 3 + (level - 1) * 3

    // 持续时间：基础3分钟 + 每1点体质+1秒 + 每1点智力+1秒
    const baseDuration = 180 // 3分钟
    const totalDuration = baseDuration + staBonus + intBonus
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">智力: +${statBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">体质: +${statBonus}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">攻击触发效果:</div>`,
      `<div class="skill-tooltip-buff-effect-item">眩晕: ${stunChance}%概率，持续3秒</div>`,
      `<div class="skill-tooltip-buff-effect-item">减少攻击: ${attackReductionChance}%概率，减少${attackReduction}%攻击力</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度等级: ${level}</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`
    ]

    return lines.join('')
  }

  // ==================== 通用工具方法 ====================

  /**
   * 获取计算型 BUFF 效果描述
   * 用于有自定义计算函数的技能
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getCalculatedBuffEffect (skill) {
    try {
      const html = ''
      return html
    } catch (error) {
      console.error(`技能 ${skill.name} BUFF效果计算出错: `, error)
      return ''
    }
  }

  /**
   * 获取熟练度型 BUFF 效果描述
   * 根据 proficiencyEffect 配置自动生成描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getProficiencyBuffEffect (skill) {
    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (!effectSource) {
      return ''
    }

    // 安全获取技能等级：SKILL_CONFIG 原始技能无顶层 level，使用 proficiency.level 回退
    const skillLevel = Number(skill.level ?? skill.proficiency?.level ?? 1) || 1

    let html = ''

    for (const [key, effect] of Object.entries(effectSource)) {
      if (typeof effect === 'object') {
        let currentValue
        if (Array.isArray(effect.damageTable)) {
          // 查找表模式：直接按等级索引取值
          const idx = Math.max(0, Math.min(effect.damageTable.length - 1, skillLevel - 1))
          currentValue = effect.damageTable[idx]
        } else if (effect.base !== undefined) {
          currentValue = effect.base + (effect.increment || 0) * (skillLevel - 1)
        }
        if (currentValue !== undefined) {
          // 使用统一的描述映射获取中文名称
          const displayName = BUFF_EFFECT_NAMES[key] || key
          // 百分比类效果追加%号
          const suffix = effect.rate ? '%' : ''
          html += `<div class="skill-tooltip-buff-effect-item">${displayName}: ${Math.floor(currentValue)}${suffix}</div>`
        }
      }
    }

    return html
  }

  // ==================== 爆裂射手技能效果 ====================

  /**
   * 获取爆裂射手技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getFierceShooterBuffEffect (skillKey, skill, player = null) {
    const fierceShooterEffects = {
      Q: this.getEagleEyeEffect,
      W: this.getStormArrowsEffect,
      W_EX: this.getStormArrowsExEffect,
      R: this.getEagleSummonEffect,
      Y: this.getEagleExEffect,
      O: this.getEagleEyeExEffect,
      I: this.getGaleRapidFireEffect,
      I_EX1: this.getGaleRapidFireEx1Effect,
      I_EX2: this.getGaleRapidFireEx2Effect,
      P: this.getBowMasteryEffect,
      P_EX: this.getBowMasteryExEffect,
      P_EX2: this.getBowMasteryEx2Effect,
      U: this.getStormArrowUEffect,
      U_EX1: this.getStormArrowEx1Effect,
      U_EX2: this.getStormArrowEx2Effect
    }

    const effectFn = fierceShooterEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"鹰眼"技能效果描述
   * Q技能 - 群体BUFF，提升所有队员暴击率
   * 暴击伤害加成由鹰眼EX被动技能（O技能）提供，释放鹰眼时叠加
   * 基础持续时间1分钟，每10点敏捷+1秒
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选，用于获取属性和鹰眼EX等级）
   * @returns {string} HTML 格式的效果描述
   */
  static getEagleEyeEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值
    const buffValues = this.getCalculatedBuffValues('fierce_shooter', 'Q', skill, player)

    if (!buffValues) {
      return ''
    }

    // 最终加成（从 calculateBuff 获取）
    const totalCritRate = buffValues.criticalRate || 0
    // criticalDamage 可能是对象格式 { add, rate: true } 或纯数字，统一提取数值
    const rawCritDamage = buffValues.criticalDamage
    const totalCritDamage = rawCritDamage && typeof rawCritDamage === 'object'
      ? Number(rawCritDamage.add ?? rawCritDamage.value ?? 0)
      : Number(rawCritDamage || 0)

    // 计算持续时间：基础60秒 + 每10点敏捷+1秒
    const agility = player?.stats?.agility || 0
    const baseDuration = 60
    const totalDuration = baseDuration + Math.floor(agility / 10)
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击率: +${Math.floor(totalCritRate)}%</div>`
    ]

    // 若已学会鹰眼EX被动技能，显示暴击伤害加成
    if (totalCritDamage > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">暴击伤害(鹰眼EX): +${Math.floor(totalCritDamage)}%</div>`)
    }

    lines.push(
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">群体BUFF：效果作用于全体队员</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"暴风连矢"技能效果描述
   * W技能 - 被动技能，普通攻击有概率射出双重箭矢
   * 1级5%概率，每级+5%，5级25%
   * 若已学会暴风连矢EX(W_EX)，显示额外双箭触发概率加成
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getTriggerChance 方法）
   * @param {Object} [player=null] - 玩家对象（用于获取暴风连矢EX熟练度）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormArrowsEffect (skill, player = null) {
    // 使用静态技能对象获取 getTriggerChance 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'W')
    if (!staticSkill || typeof staticSkill.getTriggerChance !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const triggerChance = staticSkill.getTriggerChance(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">双箭触发概率: ${triggerChance}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：普通攻击时有概率射出双重箭矢，造成额外伤害</div>'
    ]

    // 若已学会暴风连矢EX被动技能，显示额外双箭触发概率加成
    try {
      const staticStormEx = getSkill('fierce_shooter', 'W_EX')
      const playerStormEx = player?.skills?.W_EX
      if (staticStormEx && typeof staticStormEx.getTriggerChanceBonus === 'function' && playerStormEx) {
        const stormExLevel = Number(playerStormEx.proficiencyLevel || playerStormEx.level || 0)
        if (stormExLevel >= 1) {
          const exBonus = staticStormEx.getTriggerChanceBonus(stormExLevel)
          if (exBonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">暴风连矢EX加成: +${exBonus}% 双箭触发概率</div>`)
          }
        }
      }
    } catch (e) {
      // 暴风连矢EX未加载时不显示加成
    }

    lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>')

    return lines.join('')
  }

  /**
   * 获取"暴风连矢EX"技能效果描述
   * W_EX技能 - 被动技能，增强暴风连矢触发双倍箭矢的概率
   * 1级即为最大熟练度，默认满级效果：双箭触发概率+25%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getTriggerChanceBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormArrowsExEffect (skill) {
    // 使用静态技能对象获取 getTriggerChanceBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'W_EX')
    if (!staticSkill || typeof staticSkill.getTriggerChanceBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const triggerChanceBonus = staticSkill.getTriggerChanceBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">双箭触发概率加成: +${triggerChanceBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暴风连矢，额外增加双倍箭矢触发概率</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暴风连矢效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"神鹰降临"技能效果描述
   * R技能 - 召唤神鹰真身降临，持续时间内无敌，自动攻击存活敌人
   * 神鹰属性按熟练度等级百分比继承玩家属性
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选，用于计算持续时间和神鹰属性）
   * @returns {string} HTML 格式的效果描述
   */
  static getEagleSummonEffect (skill, player = null) {
    // 使用静态技能对象获取计算方法（store 归一化后可能丢失部分方法）
    const staticSkill = getSkill('fierce_shooter', 'R')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)

    // 属性继承百分比：1级5%，每级+5%，5级25%
    // 叠加神鹰EX被动技能的额外属性百分比加成
    let eagleExBonus = 0
    try {
      const staticEagleEx = getSkill('fierce_shooter', 'Y')
      if (staticEagleEx && typeof staticEagleEx.getStatRatioBonus === 'function') {
        // 从 player.skills.Y 获取神鹰EX被动技能的熟练度等级
        const eagleExSkillData = player?.skills?.Y
        const eagleExLevel = Number(eagleExSkillData?.proficiencyLevel || eagleExSkillData?.level || 1)
        eagleExBonus = staticEagleEx.getStatRatioBonus(eagleExLevel)
      }
    } catch (e) {
      // 神鹰EX未加载时加成为0
    }

    const statRatio = typeof staticSkill.calculateStatRatio === 'function'
      ? staticSkill.calculateStatRatio(level, eagleExBonus)
      : 5 * level + eagleExBonus

    // 持续时间：基础60秒 + 智力值（每1点智力+1秒）
    let durationText = '60秒'
    if (typeof staticSkill.calculateDuration === 'function' && player) {
      const durationSeconds = staticSkill.calculateDuration(player, level)
      const minutes = Math.floor(durationSeconds / 60)
      const seconds = durationSeconds % 60
      durationText = seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分钟`
    }

    // 攻击间隔：基础2000ms × (1 - 百分比)，最低500ms
    const ratio = statRatio / 100
    const attackInterval = Math.max(500, Math.floor(2000 * (1 - ratio)))
    const attackIntervalText = `${(attackInterval / 1000).toFixed(1)}秒`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">属性继承: 玩家属性的${statRatio}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">攻击间隔: ${attackIntervalText}</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">神鹰无敌：不会受到任何伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">自动攻击存活敌人</div>'
    ]

    // 如果有玩家数据，计算并显示神鹰的具体属性
    if (player && typeof staticSkill.calculateSummonStats === 'function') {
      try {
        const stats = staticSkill.calculateSummonStats(player, level, eagleExBonus)
        if (stats) {
          lines.push(
            `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">神鹰攻击力: ${stats.minAttack} ~ ${stats.maxAttack}</div>`,
            `<div class="skill-tooltip-buff-effect-item">神鹰生命值: ${stats.maxHealth}</div>`,
            `<div class="skill-tooltip-buff-effect-item">神鹰暴击率: ${(stats.critRate * 100).toFixed(1)}%</div>`
          )
        }
      } catch (e) {
        // 计算失败时忽略，不影响基本效果展示
      }
    }

    // 如果有神鹰EX加成，显示额外信息
    if (eagleExBonus > 0) {
      lines.push(
        `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">神鹰EX加成: +${eagleExBonus}% 属性继承</div>`
      )
    }

    return lines.join('')
  }

  /**
   * 获取"神鹰EX"技能效果描述
   * Y技能 - 被动技能，强化神鹰降临的属性继承百分比
   * 1级即为最大熟练度，固定+25%属性继承加成
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getStatRatioBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getEagleExEffect (skill) {
    // 使用静态技能对象获取 getStatRatioBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'Y')
    if (!staticSkill || typeof staticSkill.getStatRatioBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const statRatioBonus = staticSkill.getStatRatioBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">属性继承加成: +${statRatioBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：强化神鹰降临，增加神鹰继承玩家属性的百分比</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">每次召唤神鹰降临时熟练度+1</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"鹰眼EX"技能效果描述
   * O技能 - 被动技能，强化鹰眼效果，增加暴击伤害增幅
   * 1级即为最大熟练度，固定+5%暴击伤害
   * 每次释放鹰眼（Q技能）时熟练度+1
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCriticalDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getEagleEyeExEffect (skill) {
    // 使用静态技能对象获取 getCriticalDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'O')
    if (!staticSkill || typeof staticSkill.getCriticalDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const critDamageBonus = staticSkill.getCriticalDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">暴击伤害加成: +${critDamageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：强化鹰眼，释放鹰眼时额外增加暴击伤害增幅</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">每次释放鹰眼时熟练度+1</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"武器精通-弓箭"技能效果描述
   * P技能 - 被动技能，装备弓箭时增加武器基础攻击力
   * 1级+10%，每级+10%，5级+50%
   * 若已学会武器精通-弓箭EX(P_EX)，显示额外武器攻击力加成
   * 仅对弓箭类型武器生效，基于武器基础攻击力（非强化攻击力）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @param {Object} [player=null] - 玩家对象（用于获取武器精通-弓箭EX熟练度）
   * @returns {string} HTML 格式的效果描述
   */
  static getBowMasteryEffect (skill, player = null) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'P')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const weaponAttackBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">武器攻击力加成: +${weaponAttackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：装备弓箭时，增加武器基础攻击力（非强化攻击力）</div>'
    ]

    // 若已学会武器精通-弓箭EX被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx = getSkill('fierce_shooter', 'P_EX')
      const playerMasteryEx = player?.skills?.P_EX
      if (staticMasteryEx && typeof staticMasteryEx.getWeaponAttackBonus === 'function' && playerMasteryEx) {
        const masteryExLevel = Number(playerMasteryEx.proficiencyLevel || playerMasteryEx.level || 0)
        if (masteryExLevel >= 1) {
          const exBonus = staticMasteryEx.getWeaponAttackBonus(masteryExLevel)
          if (exBonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器精通-弓箭EX加成: +${exBonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-弓箭EX未加载时不显示加成
    }

    // 若已学会武器精通-弓箭EX2被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx2 = getSkill('fierce_shooter', 'P_EX2')
      const playerMasteryEx2 = player?.skills?.P_EX2
      if (staticMasteryEx2 && typeof staticMasteryEx2.getWeaponAttackBonus === 'function' && playerMasteryEx2) {
        const masteryEx2Level = Number(playerMasteryEx2.proficiencyLevel || playerMasteryEx2.level || 0)
        if (masteryEx2Level >= 1) {
          const ex2Bonus = staticMasteryEx2.getWeaponAttackBonus(masteryEx2Level)
          if (ex2Bonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #8e44ad;">武器精通-弓箭EX2加成: +${ex2Bonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-弓箭EX2未加载时不显示加成
    }

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'P')
      if (progress) {
        if (progress.isMax) {
          lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度已满级</div>')
        } else {
          lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
        }
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对弓箭生效</div>')

    return lines.join('')
  }

  /**
   * 获取"武器精通-弓箭EX"技能效果描述
   * P_EX技能 - 被动技能，增强武器精通-弓箭的武器攻击力加成上限
   * 1级即为最大熟练度，固定+50%额外武器攻击力加成（叠加到武器精通-弓箭的加成比例上）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getBowMasteryExEffect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'P_EX')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const extraBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">额外武器攻击力加成: +${extraBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-弓箭的武器攻击力加成上限</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-弓箭效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对弓箭生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"武器精通-弓箭EX2"技能效果描述
   * P_EX2技能 - 被动技能，增强武器基础伤害，增加武器弓箭的基础攻击力加成
   * 1级即为最大熟练度，固定+100%额外武器攻击力加成（叠加到武器精通-弓箭的加成比例上）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getBowMasteryEx2Effect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'P_EX2')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const extraBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">额外武器攻击力加成: +${extraBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器基础伤害，增加武器弓箭的基础攻击力加成</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-弓箭、武器精通-弓箭EX效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对弓箭生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暴风箭矢"技能效果描述
   * U技能 - AOE风系伤害技能
   * 注意：冷却时间、实际伤害、基础伤害、技能描述等信息由 SkillTooltip 面板主体已展示，
   * 此处仅显示暴风箭矢EX1/EX2被动技能的解锁状态与加成说明，避免重复
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormArrowUEffect (skill, player = null) {
    const lines = []

    // 暴风箭矢EX1-CD减少被动技能的解锁状态与加成说明
    // 面板的冷却时间区域已展示EX1加成后的实际CD，此处仅说明被动技能的解锁状态
    let ex1Unlocked = false
    try {
      ex1Unlocked = isSkillUnlocked(player, 'fierce_shooter', 'U_EX1')
    } catch (e) {
      // player 为空或检查异常时不显示
    }
    const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
    const ex1Status = ex1Unlocked ? '已解锁' : '175级解锁'
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">暴风箭矢EX1（${ex1Status}）：CD减少50%</div>`)

    // 暴风箭矢EX2-伤害增加被动技能的解锁状态与加成说明
    // 面板的实际伤害区域已展示EX2加成后的伤害值，此处仅说明被动技能的解锁状态
    let ex2Unlocked = false
    try {
      ex2Unlocked = isSkillUnlocked(player, 'fierce_shooter', 'U_EX2')
    } catch (e) {
      // player 为空或检查异常时不显示
    }
    const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
    const ex2Status = ex2Unlocked ? '已解锁' : '190级解锁'
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">暴风箭矢EX2（${ex2Status}）：技能伤害+50%</div>`)

    return lines.join('')
  }

  /**
   * 获取"暴风箭矢EX1-CD减少"技能效果描述
   * U_EX1技能 - 被动技能，增强暴风箭矢，减少冷却时间
   * 1级即为最大熟练度，固定减少暴风箭矢技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormArrowEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'U_EX1')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 暴风箭矢基础CD 12秒，应用减少后的实际CD
    const baseCd = 12
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：暴风箭矢冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暴风箭矢效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暴风箭矢EX2-伤害增加"技能效果描述
   * U_EX2技能 - 被动技能，增强暴风箭矢，增加技能伤害
   * 1级即为最大熟练度，固定增加暴风箭矢技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormArrowEx2Effect (skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'U_EX2')
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暴风箭矢，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暴风箭矢效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"狂风连射"技能效果描述
   * I技能 - 单体风系多段连射伤害，风刃撕裂目标躯体造成流血
   * 每个箭矢伤害 = 基础伤害(888) + 熟练度伤害 + 敏捷×6.6
   * 箭矢数量 = 熟练度加成(1级=1,10级=10) + 每100点敏捷+1
   * 流血DOT：持续15秒，每秒造成技能总伤害30%的伤害
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少计算方法）
   * @param {Object} [player=null] - 玩家对象（用于计算敏捷加成）
   * @returns {string} HTML 格式的效果描述
   */
  static getGaleRapidFireEffect (skill, player = null) {
    // 使用静态技能对象获取计算方法（store 归一化后可能丢失 calculateArrowCount）
    const staticSkill = getSkill('fierce_shooter', 'I')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const safeLevel = Number.isFinite(level) && level > 0 ? Math.min(level, 10) : 1

    // 计算单个箭矢伤害
    let arrowDamage = 0
    try {
      const playerForCalc = player || { stats: { agility: 0, dexterity: 0 } }
      arrowDamage = typeof staticSkill.calculateDamage === 'function'
        ? staticSkill.calculateDamage(playerForCalc, safeLevel)
        : 888
    } catch (e) {
      arrowDamage = 888
    }

    // 计算箭矢发射数量
    let arrowCount = 0
    try {
      const playerForCalc = player || { stats: { agility: 0, dexterity: 0 } }
arrowCount = typeof staticSkill.calculateArrowCount === 'function'
? staticSkill.calculateArrowCount(playerForCalc, safeLevel)
: safeLevel
} catch (e) {
arrowCount = safeLevel
    }

    // 熟练度伤害（1级+200，10级+2000）
    const proficiencyDamage = 200 + 200 * (safeLevel - 1)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">单个箭矢伤害: ${arrowDamage.toLocaleString()}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">箭矢发射数量: ${arrowCount}</div>`,
      `<div class="skill-tooltip-buff-effect-item">熟练度伤害加成: +${proficiencyDamage.toLocaleString()}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">总伤害: ${(arrowDamage * arrowCount).toLocaleString()}</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">流血：15秒内每秒造成技能总伤害30%的伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">风系物理伤害：锁定单一目标密集连射</div>'
    ]

    // 狂风连射EX1-CD减少被动技能的解锁状态与加成说明
    // 面板的冷却时间区域已展示EX1加成后的实际CD，此处仅说明被动技能的解锁状态
    let iEx1Unlocked = false
    try {
      iEx1Unlocked = isSkillUnlocked(player, 'fierce_shooter', 'I_EX1')
    } catch (e) {
      // player 为空或检查异常时不显示
    }
    const iEx1Color = iEx1Unlocked ? '#2ecc71' : '#95a5a6'
    const iEx1Status = iEx1Unlocked ? '已解锁' : '175级解锁'
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${iEx1Color};">狂风连射EX1（${iEx1Status}）：CD减少50%</div>`)

    // 狂风连射EX2-伤害增加被动技能的解锁状态与加成说明
    // 面板的实际伤害区域已展示EX2加成后的伤害值，此处仅说明被动技能的解锁状态
    let iEx2Unlocked = false
    try {
      iEx2Unlocked = isSkillUnlocked(player, 'fierce_shooter', 'I_EX2')
    } catch (e) {
      // player 为空或检查异常时不显示
    }
    const iEx2Color = iEx2Unlocked ? '#2ecc71' : '#95a5a6'
    const iEx2Status = iEx2Unlocked ? '已解锁' : '190级解锁'
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${iEx2Color};">狂风连射EX2（${iEx2Status}）：技能伤害+50%</div>`)

    return lines.join('')
  }

  /**
   * 获取"狂风连射EX1-CD减少"技能效果描述
   * I_EX1技能 - 被动技能，增强狂风连射，减少冷却时间
   * 1级即为最大熟练度，固定减少狂风连射技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getGaleRapidFireEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'I_EX1')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 狂风连射基础CD 90秒，应用减少后的实际CD
    const baseCd = 90
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：狂风连射冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与狂风连射效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"狂风连射EX2-伤害增加"技能效果描述
   * I_EX2技能 - 被动技能，增强狂风连射，增加技能伤害
   * 1级即为最大熟练度，固定增加狂风连射技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getGaleRapidFireEx2Effect (skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('fierce_shooter', 'I_EX2')
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强狂风连射，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与狂风连射效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  // ==================== 格斗宗师技能效果 ====================

  /**
   * 获取格斗宗师技能的 BUFF/被动效果描述
   * 覆盖三转主动技能（宗师之威/龟派气功/念气能量弹）与全部EX被动技能及武器精通-拳套被动
   * 注：龙拳-破劲（E技能）为DEBUFF类型，其效果由 SkillTooltip 的减益区块展示，不在此处理
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选）
   * @returns {string} HTML 格式的效果描述
   */
  static getCombatMasterBuffEffect (skillKey, skill, player = null) {
const combatMasterEffects = {
Q: this.getGrandmasterAuthorityEffect,
O: this.getGrandmasterAuthorityEx1Effect,
O_EX2: this.getGrandmasterAuthorityEx2Effect,
W: this.getNensphereEffect,
W_EX: this.getNensphereEx1Effect,
W_EX2: this.getNensphereEx2Effect,
W_EX3: this.getNensphereEx3Effect,
E: this.getDragonFistEffect,
E_EX1: this.getDragonFistEx1Effect,
E_EX2: this.getDragonFistEx2Effect,
U: this.getAuraBombEffect,
U_EX1: this.getAuraBombEx1Effect,
U_EX2: this.getAuraBombEx2Effect,
I: this.getKnuckleMasteryEffect,
I_EX1: this.getKnuckleMasteryEx1Effect,
I_EX2: this.getKnuckleMasteryEx2Effect,
J: this.getDragonForceEffect,
J_EX1: this.getDragonForceEx1Effect,
J_EX2: this.getDragonForceEx2Effect
}

    const effectFn = combatMasterEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 生成格斗宗师"EX1-CD减少"类被动技能的效果描述
   * 龟派气功EX1/念气能量弹EX1共用，1级即为满级固定减少50%CD
   * 注：龙象崩拳已替换为武器精通-拳套，I_EX1改为伤害增加被动，不再使用此共用方法
   * @param {string} exSkillKey - EX被动技能按键（W_EX/U_EX1/I_EX1）
   * @param {string} baseSkillKey - 被增强的主动技能按键（W/U/I），用于读取基础CD
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getCombatMasterCdReductionExEffect (exSkillKey, baseSkillKey, baseSkillName, skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', exSkillKey)
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 基础CD取自静态技能配置，应用减少后的实际CD
    const baseCd = Number(getSkill('combat_master', baseSkillKey)?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    // 仅当CD确实被缩减时展示变化过程（基础CD过小导致无变化时不展示，避免误导）
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 生成格斗宗师"EX2-伤害增加"类被动技能的效果描述
   * 龟派气功EX2/念气能量弹EX2共用，1级即为满级固定增加50%技能伤害
   * 注：龙象崩拳已替换为武器精通-拳套，I_EX2改为武器伤害增加被动，不再使用此共用方法
   * @param {string} exSkillKey - EX被动技能按键（W_EX2/U_EX2/I_EX2）
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getCombatMasterDamageBonusExEffect (exSkillKey, baseSkillName, skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', exSkillKey)
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：增强${baseSkillName}，增加技能伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 生成格斗宗师主动技能的EX1/EX2被动解锁状态说明行
   * 面板的冷却时间与实际伤害区域已展示EX加成后的数值，此处仅说明被动技能的解锁状态
   * @param {string} baseSkillName - 主动技能名称
   * @param {string} ex1Key - EX1被动技能按键
   * @param {string} ex2Key - EX2被动技能按键
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @returns {string} HTML 格式的效果描述
   */
  static getCombatMasterExStatusLines (baseSkillName, ex1Key, ex2Key, player = null, ex3Key = null) {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false
    try {
      ex1Unlocked = isSkillUnlocked(player, 'combat_master', ex1Key)
      ex2Unlocked = isSkillUnlocked(player, 'combat_master', ex2Key)
      if (ex3Key) {
        ex3Unlocked = isSkillUnlocked(player, 'combat_master', ex3Key)
      }
    } catch (e) {
      // player 为空或检查异常时按未解锁显示
    }

    // 解锁等级取自静态技能配置，避免硬编码漂移
    const ex1UnlockLevel = getSkill('combat_master', ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getSkill('combat_master', ex2Key)?.unlockLevel || 185
    const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
    const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
    const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
    const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">${baseSkillName}EX1（${ex1Status}）：CD减少50%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">${baseSkillName}EX2（${ex2Status}）：技能伤害+50%</div>`
    ]

    // EX3状态行（仅龟派气功有EX3）
    if (ex3Key) {
      const ex3UnlockLevel = getSkill('combat_master', ex3Key)?.unlockLevel || 190
      const ex3Color = ex3Unlocked ? '#2ecc71' : '#95a5a6'
      const ex3Status = ex3Unlocked ? '已解锁' : `${ex3UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex3Color};">${baseSkillName}EX3（${ex3Status}）：多段伤害（30%/15%/5%）</div>`)
    }

    return lines.join('')
  }

  /**
   * 获取"宗师之威"技能效果描述
   * Q技能 - 群体BUFF，提升全体队友攻击力百分比
   * 基础持续时间60秒，每1点智力+1秒
   * 防御力加成由宗师之威EX1（O技能）提供；魔力上限加成由宗师之威EX2（O_EX2技能）提供
   * @param {Object} skill - 技能配置对象
   * @param {Object} player - 玩家对象（可选，用于计算持续时间与EX加成）
   * @returns {string} HTML 格式的效果描述
   */
  static getGrandmasterAuthorityEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值（calculateBuff 内已叠加EX1防御力和EX2魔力上限）
    const buffValues = this.getCalculatedBuffValues('combat_master', 'Q', skill, player)
    if (!buffValues) {
      return ''
    }

    const attackPercent = Number(buffValues.attack?.add ?? buffValues.attack ?? 0)

    // 持续时间：基础60秒 + 每1点智力+1秒
    const intelligence = player?.stats?.intelligence || 0
    const totalDuration = 60 + intelligence
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">攻击力: +${Math.floor(attackPercent)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">群体BUFF：效果作用于全体队员</div>'
    ]

    // 若已学会宗师之威EX1被动技能，显示防御力加成
    const rawDefense = buffValues.defensePercentage
    const defense = rawDefense && typeof rawDefense === 'object'
      ? Number(rawDefense.add ?? rawDefense.value ?? 0)
      : Number(rawDefense || 0)
    if (defense > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">防御力(宗师之威EX1): +${Math.floor(defense)}%</div>`)
    }

    // 若已学会宗师之威EX2被动技能，显示魔力上限加成
    const rawMaxMana = buffValues.maxMana
    const maxMana = rawMaxMana && typeof rawMaxMana === 'object'
      ? Number(rawMaxMana.add ?? rawMaxMana.value ?? 0)
      : Number(rawMaxMana || 0)
    if (maxMana > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">魔力上限(宗师之威EX2): +${Math.floor(maxMana)}%</div>`)
    }

    return lines.join('')
  }

  /**
   * 获取"宗师之威EX1-增强防御力"技能效果描述
   * O技能 - 被动技能，释放宗师之威时额外增加全体物理防御力
   * 1级即为最大熟练度，固定+15%防御力
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDefenseBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getGrandmasterAuthorityEx1Effect (skill) {
    // 使用静态技能对象获取 getDefenseBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'O')
    if (!staticSkill || typeof staticSkill.getDefenseBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const defenseBonus = staticSkill.getDefenseBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">防御力加成: +${defenseBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：释放宗师之威时，额外增加全体物理防御力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与宗师之威效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"宗师之威EX2-增强魔力上限"技能效果描述
   * O_EX2技能 - 被动技能，释放宗师之威时额外增加全体魔力上限
   * 1级即为最大熟练度，固定+30%魔法值上限
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getManaMaxBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getGrandmasterAuthorityEx2Effect (skill) {
    // 使用静态技能对象获取 getManaMaxBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'O_EX2')
    if (!staticSkill || typeof staticSkill.getManaMaxBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const manaMaxBonus = staticSkill.getManaMaxBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">魔力上限加成: +${manaMaxBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：释放宗师之威时，额外增加全体魔力上限</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与宗师之威效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

/**
* 获取"龙拳-破劲"技能效果描述
* E技能 - 单体DEBUFF技能，降低目标防御力
* 注意：冷却时间、实际伤害、计算公式等信息由 SkillTooltip 的减益区块展示，
* 此处仅显示龙拳-破劲EX1/EX2被动技能的解锁状态与加成说明
* @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
* @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
* @returns {string} HTML 格式的效果描述
*/
static getDragonFistEffect (skill, player = null) {
return this.getCombatMasterExStatusLines('龙拳-破劲', 'E_EX1', 'E_EX2', player)
}

/**
* 获取"龙拳-破劲EX1-CD减少"技能效果描述
   * E_EX1技能 - 被动技能，增强龙拳-破劲，减少冷却时间
   * 1级即为最大熟练度，固定减少龙拳-破劲技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getDragonFistEx1Effect (skill) {
    return this.getCombatMasterCdReductionExEffect('E_EX1', 'E', '龙拳-破劲', skill)
  }

  /**
   * 获取"龙拳-破劲EX2-伤害增加"技能效果描述
   * E_EX2技能 - 被动技能，增强龙拳-破劲，增加技能伤害
   * 1级即为最大熟练度，固定增加龙拳-破劲技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getDragonFistEx2Effect (skill) {
    return this.getCombatMasterDamageBonusExEffect('E_EX2', '龙拳-破劲', skill)
  }

  /**
   * 获取"龟派气功"技能效果描述
   * W技能 - 单体智力伤害技能
   * 注意：冷却时间、实际伤害、计算公式等信息由 SkillTooltip 面板主体展示，
   * 此处仅显示龟派气功EX1/EX2被动技能的解锁状态与加成说明，避免重复
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @returns {string} HTML 格式的效果描述
   */
  static getNensphereEffect (skill, player = null) {
    return this.getCombatMasterExStatusLines('龟派气功', 'W_EX', 'W_EX2', player, 'W_EX3')
  }

  /**
   * 获取"龟派气功EX1-CD减少"技能效果描述
   * W_EX技能 - 被动技能，增强龟派气功，减少冷却时间
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getNensphereEx1Effect (skill) {
    return this.getCombatMasterCdReductionExEffect('W_EX', 'W', '龟派气功', skill)
  }

  /**
   * 获取"龟派气功EX2-伤害增加"技能效果描述
   * W_EX2技能 - 被动技能，增强龟派气功，增加技能伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getNensphereEx2Effect (skill) {
    return this.getCombatMasterDamageBonusExEffect('W_EX2', '龟派气功', skill)
  }

  /**
   * 获取"龟派气功EX3-多段伤害"技能效果描述
   * W_EX3技能 - 被动技能，增强龟派气功，概率触发多段额外伤害
   * 1级即为最大熟练度，固定概率：30%触发1段、15%触发2段、5%触发3段
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getMultiHitChance 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getNensphereEx3Effect (skill) {
    // 使用静态技能对象获取 getMultiHitChance 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'W_EX3')
    let chances = { chance1: 30, chance2: 15, chance3: 5 }
    if (staticSkill && typeof staticSkill.getMultiHitChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiHitChance(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">多段伤害触发概率:</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率触发1段（多触发一次额外伤害）</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率触发2段（多触发两次额外伤害）</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率触发3段（多触发三次额外伤害）</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与龟派气功效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"念气能量弹"技能效果描述
   * U技能 - AOE智力伤害技能
   * 注意：冷却时间、实际伤害、计算公式等信息由 SkillTooltip 面板主体展示，
   * 此处仅显示念气能量弹EX1/EX2被动技能的解锁状态与加成说明，避免重复
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @returns {string} HTML 格式的效果描述
   */
  static getAuraBombEffect (skill, player = null) {
    return this.getCombatMasterExStatusLines('念气能量弹', 'U_EX1', 'U_EX2', player)
  }

  /**
   * 获取"念气能量弹EX1-CD减少"技能效果描述
   * U_EX1技能 - 被动技能，增强念气能量弹，减少冷却时间
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getAuraBombEx1Effect (skill) {
    return this.getCombatMasterCdReductionExEffect('U_EX1', 'U', '念气能量弹', skill)
  }

  /**
   * 获取"念气能量弹EX2-伤害增加"技能效果描述
   * U_EX2技能 - 被动技能，增强念气能量弹，增加技能伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getAuraBombEx2Effect (skill) {
    return this.getCombatMasterDamageBonusExEffect('U_EX2', '念气能量弹', skill)
  }

  /**
   * 获取"武器精通-拳套"技能效果描述
   * I技能 - 被动技能，装备拳套时增加武器基础攻击力
   * 1级+10%，每级+10%，5级+50%
   * 若已学会武器精通-拳套EX1(I_EX1)，显示额外武器攻击力加成
   * 若已学会武器精通-拳套EX2(I_EX2)，显示额外武器攻击力加成
   * 仅对拳套类型武器生效，基于武器基础攻击力（非强化攻击力）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @param {Object} [player=null] - 玩家对象（用于获取武器精通-拳套EX1/EX2熟练度）
   * @returns {string} HTML 格式的效果描述
   */
  static getKnuckleMasteryEffect (skill, player = null) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'I')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const weaponAttackBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">武器攻击力加成: +${weaponAttackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：装备拳套时，增加武器基础攻击力（非强化攻击力）</div>'
    ]

    // 若已学会武器精通-拳套EX1被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx1 = getSkill('combat_master', 'I_EX1')
      const playerMasteryEx1 = player?.skills?.I_EX1
      if (staticMasteryEx1 && typeof staticMasteryEx1.getWeaponAttackBonus === 'function' && playerMasteryEx1) {
        const masteryEx1Level = Number(playerMasteryEx1.proficiencyLevel || playerMasteryEx1.level || 0)
        if (masteryEx1Level >= 1) {
          const ex1Bonus = staticMasteryEx1.getWeaponAttackBonus(masteryEx1Level)
          if (ex1Bonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器精通-拳套EX1加成: +${ex1Bonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-拳套EX1未加载时不显示加成
    }

    // 若已学会武器精通-拳套EX2被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx2 = getSkill('combat_master', 'I_EX2')
      const playerMasteryEx2 = player?.skills?.I_EX2
      if (staticMasteryEx2 && typeof staticMasteryEx2.getWeaponAttackBonus === 'function' && playerMasteryEx2) {
        const masteryEx2Level = Number(playerMasteryEx2.proficiencyLevel || playerMasteryEx2.level || 0)
        if (masteryEx2Level >= 1) {
          const ex2Bonus = staticMasteryEx2.getWeaponAttackBonus(masteryEx2Level)
          if (ex2Bonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #8e44ad;">武器精通-拳套EX2加成: +${ex2Bonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-拳套EX2未加载时不显示加成
    }

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'I')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">仅对拳套类型武器生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"武器精通-拳套EX1-伤害增加"技能效果描述
   * I_EX1技能 - 被动技能，增强武器精通-拳套，增加武器基础伤害
   * 1级即为最大熟练度，固定+50%额外武器攻击力加成（叠加到武器精通-拳套的加成比例上）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getKnuckleMasteryEx1Effect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'I_EX1')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const extraBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">额外武器攻击力加成: +${extraBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-拳套的武器攻击力加成</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-拳套效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对拳套生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"武器精通-拳套EX2-伤害增加"技能效果描述
   * I_EX2技能 - 被动技能，增强武器基础伤害，增加武器拳套的基础攻击力加成
   * 1级即为最大熟练度，固定+100%额外武器攻击力加成（叠加到武器精通-拳套的加成比例上）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getKnuckleMasteryEx2Effect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('combat_master', 'I_EX2')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const extraBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">额外武器攻击力加成: +${extraBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-拳套的武器攻击力加成</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-拳套效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对拳套生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"龙之劲"技能效果描述
   * J技能 - 被动技能，每次普通攻击累计劲力值，达到阈值触发附加伤害
   * 1级10%，每级+10%，10级100%
   * 每次普通攻击消耗30点MP
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonusPercent 方法）
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态与熟练度进度）
   * @returns {string} HTML 格式的效果描述
   */
  static getDragonForceEffect (skill, player = null) {
    // 使用静态技能对象获取 getDamageBonusPercent 方法
    const staticSkill = getSkill('combat_master', 'J')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonusPercent = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonusPercent = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">附加攻击力: +${damageBonusPercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点劲力值</div>`,
      '<div class="skill-tooltip-buff-effect-item">劲力值达到阈值时，本次攻击附加攻击力百分比伤害并重置</div>'
    ]

    // 检查EX1解锁状态
    try {
      const ex1Unlocked = isSkillUnlocked(player, 'combat_master', 'J_EX1')
      const ex1UnlockLevel = getSkill('combat_master', 'J_EX1')?.unlockLevel || 175
      const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
      const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
      const triggerCount = ex1Unlocked ? 5 : 10
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">龙之劲EX1（${ex1Status}）：触发次数${ex1Unlocked ? `从10减少至${triggerCount}` : '减少50%'}</div>`)
    } catch (e) {
      // EX1检查失败时不显示
    }

    // 检查EX2解锁状态
    try {
      const ex2Unlocked = isSkillUnlocked(player, 'combat_master', 'J_EX2')
      const ex2UnlockLevel = getSkill('combat_master', 'J_EX2')?.unlockLevel || 190
      const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
      const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">龙之劲EX2（${ex2Status}）：倍攻（50%/25%/10%概率附加100%/150%/180%攻击力）</div>`)
    } catch (e) {
      // EX2检查失败时不显示
    }

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'J')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"龙之劲EX1-减少触发次数"技能效果描述
   * J_EX1技能 - 被动技能，增强龙之劲，减少触发次数50%
   * 1级即为最大熟练度，固定触发阈值从10减少至5
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getTriggerReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getDragonForceEx1Effect (skill) {
    // 使用静态技能对象获取 getTriggerReduction 方法
    const staticSkill = getSkill('combat_master', 'J_EX1')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let reduction = 50
    if (typeof staticSkill.getTriggerReduction === 'function') {
      reduction = staticSkill.getTriggerReduction(level)
    }

    const baseCount = 10
    const effectiveCount = Math.max(1, Math.floor(baseCount * (1 - reduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: ${reduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：龙之劲触发次数从 ${baseCount} 次减少至 ${effectiveCount} 次</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与龙之劲效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

/**
* 获取"龙之劲EX2-倍攻"技能效果描述
* J_EX2技能 - 被动技能，增强龙之劲，在EX1触发次数阈值时概率触发倍攻
* 依赖EX1：需先解锁龙之劲EX1，EX2的触发次数基于EX1的攻击次数（5次）
* 1级即为最大熟练度，固定概率：50%附加100%、25%附加150%、10%附加180%攻击力
* @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getMultiAttackChance 方法）
* @returns {string} HTML 格式的效果描述
*/
static getDragonForceEx2Effect (skill) {
// 使用静态技能对象获取 getMultiAttackChance 方法
const staticSkill = getSkill('combat_master', 'J_EX2')
let chances = { chance1: 50, bonus1: 100, chance2: 25, bonus2: 150, chance3: 10, bonus3: 180 }
if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
const level = Number(skill?.level || skill?.proficiencyLevel || 1)
chances = staticSkill.getMultiAttackChance(level)
}

// 获取EX1的触发次数（5次）
const staticEx1 = getSkill('combat_master', 'J_EX1')
let triggerCount = 5
if (staticEx1 && typeof staticEx1.getTriggerReduction === 'function') {
const reduction = staticEx1.getTriggerReduction(1)
triggerCount = Math.max(1, Math.floor(10 * (1 - reduction / 100)))
}

const lines = [
'<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发（需先解锁龙之劲EX1）:</div>',
`<div class="skill-tooltip-buff-effect-item">第${triggerCount}次普通攻击时触发概率倍攻</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率附加${chances.bonus1}%攻击力</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率附加${chances.bonus2}%攻击力</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率附加${chances.bonus3}%攻击力</div>`,
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与龙之劲效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]

return lines.join('')
}

  // ==================== 暗夜主宰技能效果 ====================

  /**
   * 获取暗夜主宰各技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键（Q/W/E/U/I/O/J 等）
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态与熟练度进度）
   * @returns {string} HTML 格式的效果描述
   */
  static getJokerEmperorBuffEffect (skillKey, skill, player = null) {
    const jokerEmperorEffects = {
      Q: this.getShadowEscapeEffect,
      J: this.getShadowGrudgeEffect,
      J_EX1: this.getShadowGrudgeEx1Effect,
      J_EX2: this.getShadowGrudgeEx2Effect,
      W_EX: this.getShadowRazeEx1Effect,
      W_EX2: this.getShadowRazeEx2Effect,
      W_EX3: this.getShadowRazeEx3Effect,
      E_EX1: this.getDeadlyPoisonEx1Effect,
      E_EX2: this.getDeadlyPoisonEx2Effect,
      U_EX1: this.getPhantomDanceEx1Effect,
      U_EX2: this.getPhantomDanceEx2Effect,
      I: this.getYoyoMasteryEffect,
      I_EX1: this.getYoyoMasteryEx1Effect,
      I_EX2: this.getYoyoMasteryEx2Effect,
      O: this.getShadowEscapeEx1Effect,
      O_EX2: this.getShadowEscapeEx2Effect,
      R: this.getShadowCloakEffect,
      R_EX1: this.getShadowCloakEx1Effect,
      R_EX2: this.getShadowCloakEx2Effect,
      R_EX3: this.getShadowCloakEx3Effect
    }

    const effectFn = jokerEmperorEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"影之怨"技能效果描述
   * J技能 - 被动技能，每次普通攻击累计影怨值，达到阈值触发附加伤害
   * 1级10%，每级+10%，10级100%
   * 每次普通攻击消耗30点MP
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonusPercent 方法）
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态与熟练度进度）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowGrudgeEffect (skill, player = null) {
    // 使用静态技能对象获取 getDamageBonusPercent 方法
    const staticSkill = getSkill('joker_emperor', 'J')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonusPercent = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonusPercent = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">附加攻击力: +${damageBonusPercent}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点影怨值</div>`,
      '<div class="skill-tooltip-buff-effect-item">影怨值达到阈值时，本次攻击附加攻击力百分比伤害并重置</div>'
    ]

    // 检查EX1解锁状态
    try {
      const ex1Unlocked = isSkillUnlocked(player, 'joker_emperor', 'J_EX1')
      const ex1UnlockLevel = getSkill('joker_emperor', 'J_EX1')?.unlockLevel || 175
      const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
      const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
      const triggerCount = ex1Unlocked ? 5 : 10
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">影之怨EX1（${ex1Status}）：触发次数${ex1Unlocked ? `从10减少至${triggerCount}` : '减少50%'}</div>`)
    } catch (e) {
      // EX1检查失败时不显示
    }

    // 检查EX2解锁状态
    try {
      const ex2Unlocked = isSkillUnlocked(player, 'joker_emperor', 'J_EX2')
      const ex2UnlockLevel = getSkill('joker_emperor', 'J_EX2')?.unlockLevel || 190
      const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
      const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">影之怨EX2（${ex2Status}）：倍攻（30%/15%/5%概率触发1.5倍/2倍/3倍攻击）</div>`)
    } catch (e) {
      // EX2检查失败时不显示
    }

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'J')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"影之怨EX1-减少触发次数"技能效果描述
   * J_EX1技能 - 被动技能，增强影之怨，减少触发次数50%
   * 1级即为最大熟练度，固定触发阈值从10减少至5
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getTriggerReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowGrudgeEx1Effect (skill) {
    // 使用静态技能对象获取 getTriggerReduction 方法
    const staticSkill = getSkill('joker_emperor', 'J_EX1')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let reduction = 50
    if (typeof staticSkill.getTriggerReduction === 'function') {
      reduction = staticSkill.getTriggerReduction(level)
    }

    const baseCount = 10
    const effectiveCount = Math.max(1, Math.floor(baseCount * (1 - reduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: ${reduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：影之怨触发次数从 ${baseCount} 次减少至 ${effectiveCount} 次</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与影之怨效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"影之怨EX2-倍攻"技能效果描述
   * J_EX2技能 - 被动技能，增强影之怨，在EX1触发次数阈值时概率触发倍攻
   * 依赖EX1：需先解锁影之怨EX1，EX2的触发次数基于EX1的攻击次数（5次）
   * 1级即为最大熟练度，固定概率：50%附加100%、25%附加150%、10%附加180%攻击力
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getMultiAttackChance 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowGrudgeEx2Effect (skill) {
    // 使用静态技能对象获取 getMultiAttackChance 方法
    const staticSkill = getSkill('joker_emperor', 'J_EX2')
    let chances = { chance1: 30, bonus1: 50, chance2: 15, bonus2: 100, chance3: 5, bonus3: 200 }
    if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiAttackChance(level)
    }

    // 获取EX1的触发次数（5次）
    const staticEx1 = getSkill('joker_emperor', 'J_EX1')
    let triggerCount = 5
    if (staticEx1 && typeof staticEx1.getTriggerReduction === 'function') {
      const reduction = staticEx1.getTriggerReduction(1)
      triggerCount = Math.max(1, Math.floor(10 * (1 - reduction / 100)))
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">倍攻触发（需先解锁影之怨EX1）:</div>`,
      `<div class="skill-tooltip-buff-effect-item">第${triggerCount}次普通攻击时触发概率倍攻</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率触发1.5倍攻击（附加${chances.bonus1}%攻击力）</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率触发2倍攻击（附加${chances.bonus2}%攻击力）</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率触发3倍攻击（附加${chances.bonus3}%攻击力）</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与影之怨效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影突袭EX1-CD减少"技能效果描述
   * W_EX技能 - 被动技能，增强暗影突袭，减少冷却时间
   * 1级即为最大熟练度，默认满级效果：减少暗影突袭技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowRazeEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'W_EX')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 基础CD取自静态技能配置，应用减少后的实际CD
    const baseCd = Number(getSkill('joker_emperor', 'W')?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    // 仅当CD确实被缩减时展示变化过程
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：暗影突袭冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影突袭效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"暗影突袭EX2-伤害增加"技能效果描述
   * W_EX2技能 - 被动技能，增强暗影突袭，增加技能伤害
   * 1级即为最大熟练度，默认满级效果：增加暗影突袭技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowRazeEx2Effect (skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'W_EX2')
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暗影突袭，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影突袭效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影突袭EX3-倍攻"技能效果描述
   * W_EX3技能 - 被动技能，增强暗影突袭，概率触发倍攻伤害
   * 1级即为最大熟练度，固定概率：
   *   30%概率造成2倍伤害
   *   20%概率造成3倍伤害
   *   10%概率造成5倍伤害
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCriticalMultiplier 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowRazeEx3Effect (skill) {
    // 使用静态技能对象获取 getCriticalMultiplier 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'W_EX3')
    let chances = { chance2x: 30, chance3x: 20, chance5x: 10 }
    if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getCriticalMultiplier(level)
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发概率:</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率造成2倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率造成3倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance5x}%概率造成5倍伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影突袭效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"致命毒刃EX1-CD减少"技能效果描述
   * E_EX1技能 - 被动技能，增强致命毒刃，减少冷却时间
   * 1级即为最大熟练度，默认满级效果：减少致命毒刃技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getDeadlyPoisonEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'E_EX1')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 基础CD取自静态技能配置，应用减少后的实际CD
    const baseCd = Number(getSkill('joker_emperor', 'E')?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    // 仅当CD确实被缩减时展示变化过程
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：致命毒刃冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与致命毒刃效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"致命毒刃EX2-伤害增加"技能效果描述
   * E_EX2技能 - 被动技能，增强致命毒刃，增加技能伤害
   * 1级即为最大熟练度，默认满级效果：增加致命毒刃技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getDeadlyPoisonEx2Effect (skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'E_EX2')
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强致命毒刃，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与致命毒刃效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影之刃EX1-CD减少"技能效果描述
   * U_EX1技能 - 被动技能，增强暗影之刃，减少冷却时间
   * 1级即为最大熟练度，默认满级效果：减少暗影之刃技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getPhantomDanceEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'U_EX1')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 基础CD取自静态技能配置，应用减少后的实际CD
    const baseCd = Number(getSkill('joker_emperor', 'U')?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    // 仅当CD确实被缩减时展示变化过程
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：暗影之刃冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影之刃效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"暗影之刃EX2-伤害增加"技能效果描述
   * U_EX2技能 - 被动技能，增强暗影之刃，增加技能伤害
   * 1级即为最大熟练度，默认满级效果：增加暗影之刃技能伤害 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getPhantomDanceEx2Effect (skill) {
    // 使用静态技能对象获取 getDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'U_EX2')
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暗影之刃，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影之刃效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"武器精通-飞轮"技能效果描述
   * I技能 - 被动技能，装备飞轮时增加武器基础攻击力
   * 1级+10%，每级+10%，5级+50%
   * 若已学会武器精通-飞轮EX1(I_EX1)，显示额外武器攻击力加成
   * 若已学会武器精通-飞轮EX2(I_EX2)，显示额外武器攻击力加成
   * 仅对飞轮类型武器生效，基于武器基础攻击力（非强化攻击力）
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @param {Object} [player=null] - 玩家对象（用于获取武器精通-飞轮EX1/EX2熟练度）
   * @returns {string} HTML 格式的效果描述
   */
  static getYoyoMasteryEffect (skill, player = null) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'I')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const weaponAttackBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">武器攻击力加成: +${weaponAttackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：装备飞轮时，增加武器基础攻击力（非强化攻击力）</div>'
    ]

    // 若已学会武器精通-飞轮EX1被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx1 = getSkill('joker_emperor', 'I_EX1')
      const playerMasteryEx1 = player?.skills?.I_EX1
      if (staticMasteryEx1 && typeof staticMasteryEx1.getWeaponAttackBonus === 'function' && playerMasteryEx1) {
        const masteryEx1Level = Number(playerMasteryEx1.proficiencyLevel || playerMasteryEx1.level || 0)
        if (masteryEx1Level >= 1) {
          const ex1Bonus = staticMasteryEx1.getWeaponAttackBonus(masteryEx1Level)
          if (ex1Bonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器精通-飞轮EX1加成: +${ex1Bonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-飞轮EX1未加载时不显示加成
    }

    // 若已学会武器精通-飞轮EX2被动技能，显示额外武器攻击力加成
    try {
      const staticMasteryEx2 = getSkill('joker_emperor', 'I_EX2')
      const playerMasteryEx2 = player?.skills?.I_EX2
      if (staticMasteryEx2 && typeof staticMasteryEx2.getWeaponAttackBonus === 'function' && playerMasteryEx2) {
        const masteryEx2Level = Number(playerMasteryEx2.proficiencyLevel || playerMasteryEx2.level || 0)
        if (masteryEx2Level >= 1) {
          const ex2Bonus = staticMasteryEx2.getWeaponAttackBonus(masteryEx2Level)
          if (ex2Bonus > 0) {
            lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #8e44ad;">武器精通-飞轮EX2加成: +${ex2Bonus}% 武器攻击力</div>`)
          }
        }
      }
    } catch (e) {
      // 武器精通-飞轮EX2未加载时不显示加成
    }

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'I')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">仅对飞轮类型武器生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"武器精通-飞轮EX1-伤害增加"技能效果描述
   * I_EX1技能 - 被动技能，增强武器精通-飞轮，增加武器基础攻击力
   * 1级即为最大熟练度，默认满级效果：增加武器基础攻击力50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getYoyoMasteryEx1Effect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'I_EX1')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const weaponAttackBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">武器攻击力加成: +${weaponAttackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-飞轮的武器攻击力加成</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-飞轮效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对飞轮武器生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"武器精通-飞轮EX2-伤害增加"技能效果描述
   * I_EX2技能 - 被动技能，增强武器精通-飞轮，增加武器基础攻击力
   * 1级即为最大熟练度，默认满级效果：增加武器基础攻击力100%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getWeaponAttackBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getYoyoMasteryEx2Effect (skill) {
    // 使用静态技能对象获取 getWeaponAttackBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'I_EX2')
    if (!staticSkill || typeof staticSkill.getWeaponAttackBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const weaponAttackBonus = staticSkill.getWeaponAttackBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">武器攻击力加成: +${weaponAttackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-飞轮的武器攻击力加成</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-飞轮效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放，仅对飞轮武器生效</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影主宰领域"技能效果描述
   * Q技能 - 群体BUFF，提升全队暴击率
   * 暴击率加成：1级+2%，每级+2%，5级+10%
   * 格挡率加成由暗影主宰领域EX1（O技能）被动技能提供（180级解锁）
   * 攻击速度加成由暗影主宰领域EX2（O_EX2技能）被动技能提供（190级解锁）
   * 基础持续时间1分钟，每10点敏捷+1秒
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象（用于计算持续时间与EX加成）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowEscapeEffect (skill, player = null) {
    // 使用统一的计算方法获取效果数值（calculateBuff 内已叠加EX1格挡率和EX2攻击速度）
    const buffValues = this.getCalculatedBuffValues('joker_emperor', 'Q', skill, player)
    if (!buffValues) {
      return ''
    }

    const criticalRate = Number(buffValues.criticalRate?.add ?? buffValues.criticalRate ?? 0)

    // 计算持续时间：基础60秒 + 每10点敏捷+1秒
    const agility = player?.stats?.agility || 0
    const baseDuration = 60
    const totalDuration = baseDuration + Math.floor(agility / 10)
    const durationMinutes = Math.floor(totalDuration / 60)
    const durationSeconds = totalDuration % 60
    const durationText = durationSeconds > 0
      ? `${durationMinutes}分${durationSeconds}秒`
      : `${durationMinutes}分钟`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击率: +${Math.floor(criticalRate)}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">持续时间: ${durationText}</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">群体BUFF：效果作用于全体队员</div>'
    ]

    // 若已学会暗影主宰领域EX1被动技能，显示格挡率加成
    const rawBlockRate = buffValues.blockRate
    const blockRate = rawBlockRate && typeof rawBlockRate === 'object'
      ? Number(rawBlockRate.add ?? rawBlockRate.value ?? 0)
      : Number(rawBlockRate || 0)
    if (blockRate > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">格挡率(暗影主宰领域EX1): +${Math.floor(blockRate)}%</div>`)
    }

    // 若已学会暗影主宰领域EX2被动技能，显示攻击速度加成
    const rawAttackSpeed = buffValues.attackSpeed
    const attackSpeed = rawAttackSpeed && typeof rawAttackSpeed === 'object'
      ? Number(rawAttackSpeed.add ?? rawAttackSpeed.value ?? 0)
      : Number(rawAttackSpeed || 0)
    if (attackSpeed > 0) {
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">攻击速度(暗影主宰领域EX2): +${Math.floor(attackSpeed)}%</div>`)
    }

    return lines.join('')
  }

  /**
   * 获取"暗影主宰领域EX1-增强格挡率"技能效果描述
   * O技能 - 被动技能，增强暗影主宰领域，进一步强化全体格挡率
   * 1级即为最大熟练度，默认满级效果：+10%格挡率
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getBlockRateBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowEscapeEx1Effect (skill) {
    // 使用静态技能对象获取 getBlockRateBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'O')
    if (!staticSkill || typeof staticSkill.getBlockRateBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const blockRateBonus = staticSkill.getBlockRateBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">全体格挡率加成: +${blockRateBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暗影主宰领域，额外增加全体格挡率</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影主宰领域效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影主宰领域EX2-增强攻击速度"技能效果描述
   * O_EX2技能 - 被动技能，增强暗影主宰领域，进一步强化全体攻击速度
   * 1级即为最大熟练度，默认满级效果：+10%攻击速度
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getAttackSpeedBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowEscapeEx2Effect (skill) {
    // 使用静态技能对象获取 getAttackSpeedBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'O_EX2')
    if (!staticSkill || typeof staticSkill.getAttackSpeedBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const attackSpeedBonus = staticSkill.getAttackSpeedBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">全体攻击速度加成: +${attackSpeedBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：增强暗影主宰领域，额外增加全体攻击速度</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影主宰领域效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影斗篷"技能效果描述
   * R技能 - BUFF类单人技能，短时间进入暗影遮蔽状态，大幅提升闪避率
   * 1级5%，5级20%，BUFF持续期间闪避率上限提升至50%
   * 闪避率=百分百闪避伤害
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2/EX3解锁状态）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowCloakEffect (skill, player = null) {
    // 使用静态技能对象获取 calculateBuff 方法
    const staticSkill = getSkill('joker_emperor', 'R')
    if (!staticSkill) {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const safeLevel = Number.isFinite(level) && level > 0 ? Math.min(level, 5) : 1
    const evasionBonus = 5 * safeLevel

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">闪避率加成: +${evasionBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">BUFF期间闪避率上限提升至50%</div>',
      '<div class="skill-tooltip-buff-effect-item">闪避率=百分百闪避伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：固定30秒（CD一半）</div>'
    ]

    // 检查EX1解锁状态
    try {
      const ex1Unlocked = isSkillUnlocked(player, 'joker_emperor', 'R_EX1')
      const ex1UnlockLevel = getSkill('joker_emperor', 'R_EX1')?.unlockLevel || 175
      const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
      const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">暗影斗篷EX1（${ex1Status}）：CD减少50%</div>`)
    } catch (e) {
      // EX1检查失败时不显示
    }

    // 检查EX2解锁状态
    try {
      const ex2Unlocked = isSkillUnlocked(player, 'joker_emperor', 'R_EX2')
      const ex2UnlockLevel = getSkill('joker_emperor', 'R_EX2')?.unlockLevel || 180
      const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
      const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`
      const evadeCount = ex2Unlocked ? 3 : 1
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">暗影斗篷EX2（${ex2Status}）：闪避次数${ex2Unlocked ? `从1增加至${evadeCount}` : '解锁后增加至3次'}</div>`)
    } catch (e) {
      // EX2检查失败时不显示
    }

    // 检查EX3解锁状态
    try {
      const ex3Unlocked = isSkillUnlocked(player, 'joker_emperor', 'R_EX3')
      const ex3UnlockLevel = getSkill('joker_emperor', 'R_EX3')?.unlockLevel || 190
      const ex3Color = ex3Unlocked ? '#2ecc71' : '#95a5a6'
      const ex3Status = ex3Unlocked ? '已解锁' : `${ex3UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex3Color};">暗影斗篷EX3（${ex3Status}）：释放期间暴击伤害+15%</div>`)
    } catch (e) {
      // EX3检查失败时不显示
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">单人BUFF：仅对自身生效</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"暗影斗篷EX1-CD减少"技能效果描述
   * R_EX1技能 - 被动技能，增强暗影斗篷，减少冷却时间
   * 1级即为最大熟练度，默认满级效果：减少暗影斗篷技能CD 50%
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowCloakEx1Effect (skill) {
    // 使用静态技能对象获取 getCdReduction 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'R_EX1')
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    // 基础CD取自静态技能配置，应用减少后的实际CD
    const baseCd = Number(getSkill('joker_emperor', 'R')?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    // 仅当CD确实被缩减时展示变化过程
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：暗影斗篷冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影斗篷效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 获取"暗影斗篷EX2-增加闪避次数"技能效果描述
   * R_EX2技能 - 被动技能，增强暗影斗篷，释放期间可闪避3次所有伤害
   * 1级即为最大熟练度，默认满级效果：闪避次数从1增加至3
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getEvadeCount 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowCloakEx2Effect (skill) {
    // 使用静态技能对象获取 getEvadeCount 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'R_EX2')
    if (!staticSkill || typeof staticSkill.getEvadeCount !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const evadeCount = staticSkill.getEvadeCount(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">闪避次数: ${evadeCount}次</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：释放暗影斗篷期间可闪避3次所有伤害（基础仅1次，解锁EX2后增加至3次）</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影斗篷效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"暗影斗篷EX3-增加爆伤"技能效果描述
   * R_EX3技能 - 被动技能，增强暗影斗篷，释放期间增加暴击伤害
   * 1级即为最大熟练度，默认满级效果：释放暗影斗篷期间增加15%暴击伤害
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCriticalDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getShadowCloakEx3Effect (skill) {
    // 使用静态技能对象获取 getCriticalDamageBonus 方法（store 归一化后可能丢失此方法）
    const staticSkill = getSkill('joker_emperor', 'R_EX3')
    if (!staticSkill || typeof staticSkill.getCriticalDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const criticalDamageBonus = staticSkill.getCriticalDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">暴击伤害加成: +${criticalDamageBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：释放暗影斗篷期间增加暴击伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与暗影斗篷效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 当没有职业特定处理时使用
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getDefaultBuffEffect (skill) {
    if (typeof skill.buffCalculation === 'function') {
      return this.getCalculatedBuffEffect(skill)
    }

    // 兼容 SKILL_CONFIG 原始格式（proficiency.effect）和 store 归一化格式（proficiencyEffect）
    const effectSource = skill.proficiencyEffect || skill.proficiency?.effect
    if (effectSource) {
      return this.getProficiencyBuffEffect({ ...skill, proficiencyEffect: effectSource })
    }

    return ''
  }

  /**
   * 计算熟练度效果加成
   * 根据 effect 配置计算当前等级的加成值
   * @param {Object} effect - 效果配置对象
   * @param {number} level - 技能熟练度等级
   * @returns {number} 计算后的加成值
   */
static calculateBonus (effect, level) {
if (!effect) {
return 0
}

// 安全处理 level：SKILL_CONFIG 原始技能无顶层 level，使用 proficiency.level 回退
const safeLevel = Number(level) > 0 ? Number(level) : 1

// 支持动态计算方法
if (effect.getChance) {
return effect.getChance(safeLevel)
}

// 标准 base + increment 模式
if (effect.base !== undefined) {
const base = effect.base
const increment = effect.increment || 0
return base + increment * (safeLevel - 1)
}

    // 基于概率的模式（如暴击率等）
    if (effect.baseChance !== undefined && effect.maxChance !== undefined) {
      const baseChance = effect.baseChance
      const maxChance = effect.maxChance
      return baseChance + (level - 1) * ((maxChance - baseChance) / 19)
    }

    return 0
  }

  /**
   * 获取子技能数值
   * 用于复合型 BUFF 技能的子效果数值计算
   * @param {Object} subSkill - 子技能配置对象
   * @param {number} level - 技能熟练度等级
   * @returns {number} 子技能数值
   */
static getSubSkillValue (subSkill, level) {
// 安全处理 level：SKILL_CONFIG 原始技能无顶层 level，使用 proficiency.level 回退
const safeLevel = Number(level) > 0 ? Number(level) : 1

// 优先使用直接数值 (适配 BuffTooltip)
if (subSkill.add !== undefined) {
return Number(subSkill.add)
}
if (subSkill.value !== undefined) {
return Number(subSkill.value)
}

// 支持动态计算方法
if (subSkill.effect && subSkill.effect.getValueByLevel) {
return subSkill.effect.getValueByLevel(safeLevel, 0)
}

    // 基于基础值的线性增长
    if (subSkill.effect && subSkill.effect.baseValue !== undefined) {
      return subSkill.effect.baseValue * level
    }

    // 标准 base + increment 模式
    if (subSkill.base !== undefined) {
      const base = Number(subSkill.base)
      const increment = Number(subSkill.increment || 0)
      const val = base + increment * (level - 1)
      return subSkill.max ? Math.min(val, subSkill.max) : val
    }

    return 0
  }

  // ==================== 炽天使技能效果 ====================

  /**
   * 获取炽天使技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getNatureMessengerBuffEffect (skillKey, skill, player = null) {
    const nmEffects = {
      Q: this.getHolySanctuaryEffect,
      O: this.getHolySanctuaryEx1Effect,
      O_EX2: this.getHolySanctuaryEx2Effect,
      E: this.getHolyJudgmentEffect,
      E_EX1: this.getHolyJudgmentEx1Effect,
      E_EX2: this.getHolyJudgmentEx2Effect,
      R: this.getAngelWingsEffect,
      R_EX1: this.getAngelWingsEx1Effect,
      R_EX2: this.getAngelWingsEx2Effect,
      R_EX3: this.getAngelWingsEx3Effect,
      T: this.getThunderHammerEffect,
      T_EX1: this.getThunderHammerEx1Effect,
      T_EX2: this.getThunderHammerEx2Effect,
      T_EX3: this.getThunderHammerEx3Effect,
      U: this.getAngelWrathEffect,
      U_EX1: this.getAngelWrathEx1Effect,
      U_EX2: this.getAngelWrathEx2Effect,
      U_EX3: this.getAngelWrathEx3Effect,
      I: this.getStaffMasteryEffect,
      I_EX1: this.getStaffMasteryEx1Effect,
      I_EX2: this.getStaffMasteryEx2Effect,
      J: this.getHolyAccumulationEffect,
      J_EX1: this.getHolyAccumulationEx1Effect,
      J_EX2: this.getHolyAccumulationEx2Effect
    }

    const effectFn = nmEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"圣光庇护"技能效果描述
   * Q技能 - 群体持续治疗BUFF
   */
  static getHolySanctuaryEffect (skill, player = null) {
    const staticSkill = getSkill('nature_messenger', 'Q')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const safeLevel = Number.isFinite(level) && level > 0 ? Math.min(level, 5) : 1
    const hotPercent = 2 + 2 * (safeLevel - 1)
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">群体持续治疗BUFF</div>',
      '<div class="skill-tooltip-buff-effect-item">展开圣光领域，在CD一半时间内持续恢复全队生命值</div>',
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">每2秒恢复施法者攻击力${hotPercent}%的生命值</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">持续时间：CD / 2 = 30秒</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">群体BUFF：影响全体队友</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光庇护EX1-恢复魔法值"技能效果描述
   */
  static getHolySanctuaryEx1Effect (skill) {
    const staticSkill = getSkill('nature_messenger', 'O')
    if (!staticSkill) return ''
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">魔法值恢复: 施法者攻击力10%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：圣光庇护持续期间，持续恢复范围内队员魔法值</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣光庇护效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光庇护EX2-受伤恢复"技能效果描述
   */
  static getHolySanctuaryEx2Effect (skill) {
    const staticSkill = getSkill('nature_messenger', 'O_EX2')
    if (!staticSkill) return ''
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">受伤恢复: 本次攻击2%最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：圣光庇护持续期间，拥有BUFF的玩家受伤后恢复生命值</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣光庇护效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光审判"技能效果描述
   * E技能 - 单体DEBUFF
   */
  static getHolyJudgmentEffect (skill, player = null) {
    const staticSkill = getSkill('nature_messenger', 'E')
    if (!staticSkill) return ''
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">单体DEBUFF：虚弱印记</div>',
      '<div class="skill-tooltip-buff-effect-item">造成神圣伤害，施加「虚弱」印记</div>',
      '<div class="skill-tooltip-buff-effect-item">印记期间目标承受伤害提升</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"圣光审判EX1-CD减少"技能效果描述
   */
  static getHolyJudgmentEx1Effect (skill) {
    const staticSkill = getSkill('nature_messenger', 'E_EX1')
    if (!staticSkill) return ''
    const baseCd = Number(getSkill('nature_messenger', 'E')?.cd) || 0
    const reduction = 50
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - reduction / 100)))
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${reduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：圣光审判冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣光审判效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )
    return lines.join('')
  }

  /**
   * 获取"圣光审判EX2-伤害增加"技能效果描述
   */
  static getHolyJudgmentEx2Effect (skill) {
    const staticSkill = getSkill('nature_messenger', 'E_EX2')
    if (!staticSkill) return ''
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：增强圣光审判，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣光审判效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之翼"技能效果描述
   * R技能 - 群体防御BUFF
   * 当EX1/EX2/EX3已解锁时，在效果详情中追加对应加成显示
   */
  static getAngelWingsEffect (skill, player = null) {
    const staticSkill = getSkill('nature_messenger', 'R')
    if (!staticSkill) return ''
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">群体防御BUFF</div>',
      '<div class="skill-tooltip-buff-effect-item">展开天使之翼，提升全队物理防御</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">物理防御力: +1000</div>'
    ]

    // EX1已解锁：追加魔法防御加成
    if (player && isSkillUnlocked(player, 'nature_messenger', 'R_EX1')) {
      lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">魔法防御力: +1000（EX1）</div>')
    }

    // EX2已解锁：追加最大生命值加成
    if (player && isSkillUnlocked(player, 'nature_messenger', 'R_EX2')) {
      lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">最大生命值: +1000（EX2）</div>')
    }

    // EX3已解锁：追加生命护盾
    if (player && isSkillUnlocked(player, 'nature_messenger', 'R_EX3')) {
      const ex3Def = getSkill('nature_messenger', 'R_EX3')
      if (ex3Def && typeof ex3Def.getLifeShieldAmount === 'function') {
        const shieldAmount = ex3Def.getLifeShieldAmount(player)
        const formatNumber = (num) => num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">生命护盾: ${formatNumber(shieldAmount)}（施法者最大生命值50%，可抵挡所有伤害）（EX3）</div>`)
      }
    }

    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">持续时间：60秒 + 智力/3秒</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">群体BUFF：影响全体队友</div>'
    )
    return lines.join('')
  }

  /**
   * 获取"天使之翼EX1-魔法防御力加成"技能效果描述
   */
  static getAngelWingsEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">魔法防御: +1000</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：天使之翼持续期间，全队魔法防御+1000</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之翼效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之翼EX2-增加生命值"技能效果描述
   */
  static getAngelWingsEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">最大生命值: +1000</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：天使之翼持续期间，全队最大生命值+1000</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之翼效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之翼EX3-生命护盾"技能效果描述
   * 1级即为最大熟练度，为全队增加施法者最大生命值50%的生命值护盾，可抵挡所有伤害
   */
  static getAngelWingsEx3Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">生命护盾: 施法者最大生命值50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：天使之翼持续期间，为全队增加生命值护盾</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">护盾可抵挡敌人所有伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之翼效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"雷神之锤"技能效果描述
   * T技能 - 单体雷电伤害（伤害型技能，不显示效果详情面板）
   */
  static getThunderHammerEffect (skill, player = null) {
    return ''
  }

  /**
   * 获取"雷神之锤EX1-CD减少"技能效果描述
   */
  static getThunderHammerEx1Effect (skill) {
    const baseCd = Number(getSkill('nature_messenger', 'T')?.cd) || 0
    const reduction = 50
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - reduction / 100)))
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${reduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：雷神之锤冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与雷神之锤效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )
    return lines.join('')
  }

  /**
   * 获取"雷神之锤EX2-伤害增加"技能效果描述
   */
  static getThunderHammerEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：增强雷神之锤，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与雷神之锤效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"雷神之锤EX3-倍攻"技能效果描述
   */
  static getThunderHammerEx3Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发概率:</div>',
      '<div class="skill-tooltip-buff-effect-item">50%概率造成1.5倍伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">25%概率造成2倍伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率造成3倍伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与雷神之锤效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之怒"技能效果描述
   * U技能 - AOE伤害+全队治疗（伤害型技能，不显示效果详情面板）
   */
  static getAngelWrathEffect (skill, player = null) {
    return ''
  }

  /**
   * 获取"天使之怒EX1-CD减少"技能效果描述
   */
  static getAngelWrathEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：天使之怒冷却时间减少50%</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之怒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之怒EX2-伤害增加"技能效果描述
   */
  static getAngelWrathEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：增强天使之怒，增加技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之怒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"天使之怒EX3-多段攻击"技能效果描述
   */
  static getAngelWrathEx3Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">多段攻击触发概率:</div>',
      '<div class="skill-tooltip-buff-effect-item">50%概率触发1段额外攻击</div>',
      '<div class="skill-tooltip-buff-effect-item">25%概率触发2段额外攻击</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率触发3段额外攻击</div>',
      '<div class="skill-tooltip-buff-effect-item">多段攻击为额外触发一次技能攻击伤害效果</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与天使之怒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-魔棒"技能效果描述
   * I技能 - 被动技能，装备魔棒时增加武器基础攻击力
   */
  static getStaffMasteryEffect (skill, player = null) {
    const staticSkill = getSkill('nature_messenger', 'I')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let attackBonus = 10
    if (typeof staticSkill.getWeaponAttackBonus === 'function') {
      attackBonus = staticSkill.getWeaponAttackBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器攻击力加成: +${attackBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">装备魔棒时，按熟练度增加武器基础攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-魔棒EX1-伤害增加"技能效果描述
   */
  static getStaffMasteryEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器攻击力加成: +50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-魔棒，额外增加武器攻击力50%</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-魔棒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-魔棒EX2-伤害增加"技能效果描述
   */
  static getStaffMasteryEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #9b59b6;">武器攻击力加成: +100%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：增强武器精通-魔棒，额外增加武器攻击力100%</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-魔棒、武器精通-魔棒EX1效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光积累"技能效果描述
   * J技能 - 被动技能，每次普通攻击增加圣光值
   */
  static getHolyAccumulationEffect (skill, player = null) {
    const staticSkill = getSkill('nature_messenger', 'J')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let healBonus = 10
    if (typeof staticSkill.getHealBonusPercent === 'function') {
      healBonus = staticSkill.getHealBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">附加治疗量: +${healBonus}%攻击力（自身）</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点圣光值</div>`,
      '<div class="skill-tooltip-buff-effect-item">每次释放技能增加1点圣光值（不消耗额外MP）</div>',
      '<div class="skill-tooltip-buff-effect-item">圣光值达到阈值时，恢复自身基于攻击力的生命值并重置</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">解锁EX1后：触发效果变为恢复所有队员最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光积累EX1-减少触发次数"技能效果描述
   */
  static getHolyAccumulationEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：圣光积累触发次数从 10 次减少至 5 次</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">触发效果变为：按照施法者5%攻击力恢复所有队员最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣光积累效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣光积累EX2-倍攻治疗"技能效果描述
   */
  static getHolyAccumulationEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">倍攻治疗触发（需先解锁圣光积累EX1）:</div>',
      '<div class="skill-tooltip-buff-effect-item">第5次普通攻击/技能释放时触发概率倍攻治疗</div>',
      '<div class="skill-tooltip-buff-effect-item">50%概率按照施法者10%攻击力恢复所有队员最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item">25%概率按照施法者20%攻击力恢复所有队员最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率按照施法者30%攻击力恢复所有队员最大生命值</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">未触发倍攻时回退至基础5%攻击力治疗</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ==================== 风暴行者技能效果 ====================

  /**
   * 获取风暴行者技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWalkerBuffEffect (skillKey, skill, player = null) {
    const swEffects = {
      Q: this.getStormDomainEffect,
      O: this.getStormDomainEx1Effect,
      O_EX2: this.getStormDomainEx2Effect,
      W: this.getPiercingWindMainEffect,
      W_EX: this.getPiercingWindEx1Effect,
      W_EX2: this.getPiercingWindEx2Effect,
      W_EX3: this.getPiercingWindEx3Effect,
      E: this.getFrostMarkMainEffect,
      E_EX1: this.getFrostMarkEx1Effect,
      E_EX2: this.getFrostMarkEx2Effect,
      U: this.getStormRainMainEffect,
      U_EX1: this.getStormRainEx1Effect,
      U_EX2: this.getStormRainEx2Effect,
      I: this.getOffhandMasteryEffect,
      I_EX1: this.getOffhandMasteryEx1Effect,
      I_EX2: this.getOffhandMasteryEx2Effect,
      I_EX3: this.getOffhandMasteryEx3Effect,
      J: this.getWindAccumulationEffect,
      J_EX1: this.getWindAccumulationEx1Effect,
      J_EX2: this.getWindAccumulationEx2Effect,
      R: this.getStormWingsEffect,
      R_EX1: this.getStormWingsEx1Effect,
      R_EX2: this.getStormWingsEx2Effect,
      R_EX3: this.getStormWingsEx3Effect
    }

    const effectFn = swEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 获取"风之积累"技能效果描述
   * J技能 - 被动技能，每次普通攻击增加风之值
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getWindAccumulationEffect (skill, player = null) {
    const staticSkill = getSkill('storm_walker', 'J')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonus = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonus = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const triggerCount = typeof staticSkill.getBaseTriggerCount === 'function'
      ? staticSkill.getBaseTriggerCount()
      : 10

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">附加伤害: +${damageBonus}%攻击力（风属性）</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点风之值</div>`,
      '<div class="skill-tooltip-buff-effect-item">每次释放技能增加1点风之值（不消耗额外MP）</div>',
      `<div class="skill-tooltip-buff-effect-item">风之值达到 ${triggerCount} 点时，附加攻击力百分比的额外风属性伤害并重置</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">解锁EX1后：触发次数从10减少至5</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'J')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    return lines.join('')
  }

  /**
   * 获取"风之积累EX1-减少触发次数"技能效果描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getWindAccumulationEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：风之积累触发次数从 10 次减少至 5 次</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风之积累效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"风之积累EX2-倍攻"技能效果描述
   * 从静态技能对象动态获取倍攻概率与加成，避免硬编码漂移
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getMultiAttackChance 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getWindAccumulationEx2Effect (skill) {
    // 使用静态技能对象获取 getMultiAttackChance 方法
    const staticSkill = getSkill('storm_walker', 'J_EX2')
    let chances = { chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }
    if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiAttackChance(level)
    }

    // 获取EX1的触发次数（5次）
    const staticEx1 = getSkill('storm_walker', 'J_EX1')
    let triggerCount = 5
    if (staticEx1 && typeof staticEx1.getTriggerReduction === 'function') {
      const reduction = staticEx1.getTriggerReduction(1)
      triggerCount = Math.max(1, Math.floor(10 * (1 - reduction / 100)))
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">倍攻触发（需先解锁风之积累EX1）:</div>',
      `<div class="skill-tooltip-buff-effect-item">第${triggerCount}次普通攻击/技能释放时触发概率倍攻</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率附加${chances.bonus1}%攻击力的风属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率附加${chances.bonus2}%攻击力的风属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率附加${chances.bonus3}%攻击力的风属性伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">未触发倍攻时回退至基础附加伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-副手武器"技能效果描述
   * I技能 - 被动技能，副手装备武器时增加副手武器基础攻击力
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getOffhandMasteryEffect (skill, player = null) {
    const staticSkill = getSkill('storm_walker', 'I')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let weaponBonus = 10
    if (typeof staticSkill.getWeaponAttackBonus === 'function') {
      weaponBonus = staticSkill.getWeaponAttackBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">副手武器攻击力加成: +${weaponBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">副手装备武器（非盾牌）时，增加副手武器基础攻击力（非强化攻击力）</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">仅对副手槽位中的武器生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'I')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    return lines.join('')
  }

  /**
   * 获取"武器精通-副手武器EX1-伤害增加"技能效果描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getOffhandMasteryEx1Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外副手武器攻击力加成: +50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：武器精通-副手武器额外增加50%副手武器基础攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-副手武器效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-副手武器EX2-伤害增加2"技能效果描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getOffhandMasteryEx2Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外副手武器攻击力加成: +100%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：武器精通-副手武器额外增加100%副手武器基础攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-副手武器及EX1效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"武器精通-副手武器EX3-副手武器倍攻"技能效果描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getOffhandMasteryEx3Effect (skill) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">副手武器倍攻触发:</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">30%概率触发 1.5倍攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">20%概率触发 2倍攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">10%概率触发 2.5倍攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item">副手武器攻击时随机摇取倍率，未触发时为正常伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与武器精通-副手武器及EX1/EX2效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ==================== 风暴行者EX技能效果详情 ====================

  /**
   * 生成风暴行者主动技能的EX被动解锁状态说明行
   * 面板的冷却时间与实际伤害区域已展示EX加成后的数值，此处仅说明被动技能的解锁状态
   * @param {string} baseSkillName - 主动技能名称
   * @param {string} ex1Key - EX1被动技能按键
   * @param {string} ex2Key - EX2被动技能按键
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @param {string} [ex3Key=null] - EX3被动技能按键（可选）
   * @param {string} [ex3Desc=''] - EX3效果描述文本
   * @param {string} [ex1Desc='CD减少50%'] - EX1效果描述文本（默认为cdDamage类技能的描述）
   * @param {string} [ex2Desc='技能伤害+50%'] - EX2效果描述文本（默认为cdDamage类技能的描述）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWalkerExStatusLines (baseSkillName, ex1Key, ex2Key, player = null, ex3Key = null, ex3Desc = '', ex1Desc = 'CD减少50%', ex2Desc = '技能伤害+50%') {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false
    try {
      ex1Unlocked = isSkillUnlocked(player, 'storm_walker', ex1Key)
      ex2Unlocked = isSkillUnlocked(player, 'storm_walker', ex2Key)
      if (ex3Key) {
        ex3Unlocked = isSkillUnlocked(player, 'storm_walker', ex3Key)
      }
    } catch (e) {
      // player 为空或检查异常时按未解锁显示
    }

    const ex1UnlockLevel = getSkill('storm_walker', ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getSkill('storm_walker', ex2Key)?.unlockLevel || 185
    const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
    const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
    const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
    const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">${baseSkillName}EX1（${ex1Status}）：${ex1Desc}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">${baseSkillName}EX2（${ex2Status}）：${ex2Desc}</div>`
    ]

    if (ex3Key) {
      const ex3UnlockLevel = getSkill('storm_walker', ex3Key)?.unlockLevel || 190
      const ex3Color = ex3Unlocked ? '#2ecc71' : '#95a5a6'
      const ex3Status = ex3Unlocked ? '已解锁' : `${ex3UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex3Color};">${baseSkillName}EX3（${ex3Status}）：${ex3Desc}</div>`)
    }

    return lines.join('')
  }

  /**
   * 生成风暴行者"EX1-CD减少"类被动技能的效果描述
   * 狂风绝刃EX1/风暴印记EX1/狂风绝息斩EX1共用，1级即为满级固定减少50%CD
   * @param {string} exSkillKey - EX被动技能按键（W_EX/E_EX1/U_EX1）
   * @param {string} baseSkillKey - 被增强的主动技能按键（W/E/U），用于读取基础CD
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getCdReduction 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWalkerCdReductionExEffect (exSkillKey, baseSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('storm_walker', exSkillKey)
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    const baseCd = Number(getSkill('storm_walker', baseSkillKey)?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 生成风暴行者"EX2-伤害增加"类被动技能的效果描述
   * 狂风绝刃EX2/风暴印记EX2/狂风绝息斩EX2共用，1级即为满级固定增加50%技能伤害
   * @param {string} exSkillKey - EX被动技能按键（W_EX2/E_EX2/U_EX2）
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象（可能来自 store 归一化，缺少 getDamageBonus 方法）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWalkerDamageBonusExEffect (exSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('storm_walker', exSkillKey)
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：增强${baseSkillName}，增加技能伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"风暴领域"技能效果描述
   * Q技能 - 群体BUFF技能，提升全队命中率
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormDomainEffect (skill, player = null) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">群体BUFF：风暴领域</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间提升全队命中率</div>',
      '<div class="skill-tooltip-buff-effect-item">命中率：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：60秒 + 每10点敏捷+1秒</div>'
    ]

    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复

    return lines.join('')
  }

  /**
   * 获取"风暴领域EX1-增强暴击率"技能效果描述
   * O技能 - 被动技能，增强风暴领域，全队暴击率+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormDomainEx1Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'O')
    let criticalRate = 10
    if (staticSkill && typeof staticSkill.getCriticalRateBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      criticalRate = staticSkill.getCriticalRateBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外暴击率加成: +${criticalRate}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：风暴领域持续期间，全队暴击率额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风暴领域效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"风暴领域EX2-增强攻击速度"技能效果描述
   * O_EX2技能 - 被动技能，增强风暴领域，全队攻击速度+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormDomainEx2Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'O_EX2')
    let attackSpeed = 10
    if (staticSkill && typeof staticSkill.getAttackSpeedBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      attackSpeed = staticSkill.getAttackSpeedBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外攻击速度加成: +${attackSpeed}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：风暴领域持续期间，全队攻击速度额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风暴领域效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"狂风绝刃"技能效果描述
   * W技能 - 单体风属性伤害技能
   * EX加成信息由面板「EX加成」区域统一展示，此处不再重复
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象（未使用，保留以兼容调用签名）
   * @returns {string} HTML 格式的效果描述
   */
  static getPiercingWindMainEffect (skill, player = null) {
    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复
    return ''
  }

  /**
   * 获取"狂风绝刃EX1-CD减少"技能效果描述
   * W_EX技能 - 被动技能，增强狂风绝刃，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getPiercingWindEx1Effect (skill) {
    return this.getStormWalkerCdReductionExEffect('W_EX', 'W', '狂风绝刃', skill)
  }

  /**
   * 获取"狂风绝刃EX2-伤害增加"技能效果描述
   * W_EX2技能 - 被动技能，增强狂风绝刃，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getPiercingWindEx2Effect (skill) {
    return this.getStormWalkerDamageBonusExEffect('W_EX2', '狂风绝刃', skill)
  }

  /**
   * 获取"狂风绝刃EX3-倍攻"技能效果描述
   * W_EX3技能 - 被动技能，增强狂风绝刃，概率触发倍攻伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getPiercingWindEx3Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'W_EX3')
    let chances = { chance1_5x: 50, chance2x: 25, chance3x: 10 }
    if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getCriticalMultiplier(level)
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发概率:</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1_5x}%概率造成1.5倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率造成2倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率造成3倍伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与狂风绝刃效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"风暴印记"技能效果描述
   * E技能 - 单体DEBUFF技能，降低目标所有属性抗性
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getFrostMarkMainEffect (skill, player = null) {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">单体DEBUFF：风暴印记</div>',
      '<div class="skill-tooltip-buff-effect-item">造成风属性伤害，施加「风暴印记」</div>',
      '<div class="skill-tooltip-buff-effect-item">印记期间目标所有属性抗性降低70%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：15秒</div>'
    ]

    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复

    return lines.join('')
  }

  /**
   * 获取"风暴印记EX1-CD减少"技能效果描述
   * E_EX1技能 - 被动技能，增强风暴印记，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getFrostMarkEx1Effect (skill) {
    return this.getStormWalkerCdReductionExEffect('E_EX1', 'E', '风暴印记', skill)
  }

  /**
   * 获取"风暴印记EX2-伤害增加"技能效果描述
   * E_EX2技能 - 被动技能，增强风暴印记，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getFrostMarkEx2Effect (skill) {
    return this.getStormWalkerDamageBonusExEffect('E_EX2', '风暴印记', skill)
  }

  /**
   * 获取"狂风绝息斩"技能效果描述
   * U技能 - AOE风属性伤害技能
   * EX加成信息由面板「EX加成」区域统一展示，此处不再重复
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象（未使用，保留以兼容调用签名）
   * @returns {string} HTML 格式的效果描述
   */
  static getStormRainMainEffect (skill, player = null) {
    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复
    return ''
  }

  /**
   * 获取"狂风绝息斩EX1-CD减少"技能效果描述
   * U_EX1技能 - 被动技能，增强狂风绝息斩，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormRainEx1Effect (skill) {
    return this.getStormWalkerCdReductionExEffect('U_EX1', 'U', '狂风绝息斩', skill)
  }

  /**
   * 获取"狂风绝息斩EX2-伤害增加"技能效果描述
   * U_EX2技能 - 被动技能，增强狂风绝息斩，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormRainEx2Effect (skill) {
    return this.getStormWalkerDamageBonusExEffect('U_EX2', '狂风绝息斩', skill)
  }

  /**
   * 获取"风暴之力"技能效果描述
   * R技能 - 单体自身BUFF技能，提升自身风属性攻击力
   * @param {Object} skill - 技能配置对象（未使用，保留以兼容调用签名）
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
static getStormWingsEffect (skill, player = null) {
const lines = [
'<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">单体BUFF：风暴之力</div>',
'<div class="skill-tooltip-buff-effect-item">持续期间提升自身风属性攻击力</div>',
'<div class="skill-tooltip-buff-effect-item">风属性攻击力：1级+5%，每级+3.75%，5级+20%</div>',
'<div class="skill-tooltip-buff-effect-item">持续时间：30秒</div>'
]

// EX加成信息由面板「EX加成」区域统一展示，此处不再重复

return lines.join('')
}

  /**
   * 获取"风暴之力EX1-暴击率加成"技能效果描述
   * R_EX1技能 - 被动技能，增强风暴之力，自身暴击率+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWingsEx1Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'R_EX1')
    let criticalRate = 10
    if (staticSkill && typeof staticSkill.getCriticalRateBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      criticalRate = staticSkill.getCriticalRateBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外暴击率加成: +${criticalRate}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：风暴之力持续期间，自身暴击率额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风暴之力效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"风暴之力EX2-暴击伤害加成"技能效果描述
   * R_EX2技能 - 被动技能，增强风暴之力，自身暴击伤害+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWingsEx2Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'R_EX2')
    let criticalDamage = 10
    if (staticSkill && typeof staticSkill.getCriticalDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      criticalDamage = staticSkill.getCriticalDamageBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外暴击伤害加成: +${criticalDamage}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：风暴之力持续期间，自身暴击伤害额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风暴之力效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"风暴之力EX3-生命偷取"技能效果描述
   * R_EX3技能 - 被动技能，增强风暴之力，获得生命偷取效果
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStormWingsEx3Effect (skill) {
    const staticSkill = getSkill('storm_walker', 'R_EX3')
    let lifeSteal = 3
    if (staticSkill && typeof staticSkill.getLifeStealBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      lifeSteal = staticSkill.getLifeStealBonus(level)
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">生命偷取效果:</div>',
      `<div class="skill-tooltip-buff-effect-item">风暴之力持续期间，获得${lifeSteal}%生命偷取（造成伤害的${lifeSteal}%转化为生命值）</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与风暴之力效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ==================== 圣殿骑士技能效果 ====================

  /**
   * 获取圣殿骑士技能的 BUFF 效果描述
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightBuffEffect (skillKey, skill, player = null) {
    const hkEffects = {
      Q: this.getHolyBulwarkEffect,
      O: this.getHolyBulwarkEx1Effect,
      O_EX2: this.getHolyBulwarkEx2Effect,
      O_EX3: this.getHolyBulwarkEx3Effect,
      W: this.getShieldBashMainEffect,
      W_EX: this.getShieldBashEx1Effect,
      W_EX2: this.getShieldBashEx2Effect,
      W_EX3: this.getShieldBashEx3Effect,
      E: this.getArmorBreakMainEffect,
      E_EX1: this.getArmorBreakEx1Effect,
      E_EX2: this.getArmorBreakEx2Effect,
      E_EX3: this.getArmorBreakEx3Effect,
      U: this.getHolyKnightJudgmentMainEffect,
      U_EX1: this.getHolyKnightJudgmentEx1Effect,
      U_EX2: this.getHolyKnightJudgmentEx2Effect,
U_EX3: this.getHolyKnightJudgmentEx3Effect,
      I: this.getHeavyArmorMasteryEffect,
      I_EX1: this.getHeavyArmorMasteryEx1Effect,
      I_EX2: this.getHeavyArmorMasteryEx2Effect,
      I_EX3: this.getHeavyArmorMasteryEx3Effect,
      J: this.getHolyKnightAccumulationEffect,
      J_EX1: this.getHolyKnightAccumulationEx1Effect,
      J_EX2: this.getHolyKnightAccumulationEx2Effect,
      R: this.getShieldAwakeningEffect,
      R_EX1: this.getShieldAwakeningEx1Effect,
      R_EX2: this.getShieldAwakeningEx2Effect,
      R_EX3: this.getShieldAwakeningEx3Effect
    }

    const effectFn = hkEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 生成圣殿骑士主动技能的EX被动解锁状态说明行
   * 面板的冷却时间与实际伤害区域已展示EX加成后的数值，此处仅说明被动技能的解锁状态
   * @param {string} baseSkillName - 主动技能名称
   * @param {string} ex1Key - EX1被动技能按键
   * @param {string} ex2Key - EX2被动技能按键
   * @param {Object} [player=null] - 玩家对象（用于检查EX1/EX2解锁状态）
   * @param {string} [ex3Key=null] - EX3被动技能按键（可选）
   * @param {string} [ex3Desc=''] - EX3效果描述文本
   * @param {string} [ex1Desc='CD减少50%'] - EX1效果描述文本
   * @param {string} [ex2Desc='技能伤害+50%'] - EX2效果描述文本
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightExStatusLines (baseSkillName, ex1Key, ex2Key, player = null, ex3Key = null, ex3Desc = '', ex1Desc = 'CD减少50%', ex2Desc = '技能伤害+50%') {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false
    try {
      ex1Unlocked = isSkillUnlocked(player, 'holy_knight', ex1Key)
      ex2Unlocked = isSkillUnlocked(player, 'holy_knight', ex2Key)
      if (ex3Key) {
        ex3Unlocked = isSkillUnlocked(player, 'holy_knight', ex3Key)
      }
    } catch (e) {
      // player 为空或检查异常时按未解锁显示
    }

    const ex1UnlockLevel = getSkill('holy_knight', ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getSkill('holy_knight', ex2Key)?.unlockLevel || 185
    const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
    const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
    const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
    const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">${baseSkillName}EX1（${ex1Status}）：${ex1Desc}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">${baseSkillName}EX2（${ex2Status}）：${ex2Desc}</div>`
    ]

    if (ex3Key) {
      const ex3UnlockLevel = getSkill('holy_knight', ex3Key)?.unlockLevel || 190
      const ex3Color = ex3Unlocked ? '#2ecc71' : '#95a5a6'
      const ex3Status = ex3Unlocked ? '已解锁' : `${ex3UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex3Color};">${baseSkillName}EX3（${ex3Status}）：${ex3Desc}</div>`)
    }

    return lines.join('')
  }

  /**
   * 生成圣殿骑士"EX1-CD减少"类被动技能的效果描述
   * 荣耀之剑EX1/碎甲圣裁EX1/圣殿裁决EX1共用，1级即为满级固定减少50%CD
   * @param {string} exSkillKey - EX被动技能按键（W_EX/E_EX1/U_EX1）
   * @param {string} baseSkillKey - 被增强的主动技能按键（W/E/U），用于读取基础CD
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightCdReductionExEffect (exSkillKey, baseSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('holy_knight', exSkillKey)
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)

    const baseCd = Number(getSkill('holy_knight', baseSkillKey)?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )

    return lines.join('')
  }

  /**
   * 生成圣殿骑士"EX2-伤害增加"类被动技能的效果描述
   * 荣耀之剑EX2/碎甲圣裁EX2/圣殿裁决EX2共用，1级即为满级固定增加50%技能伤害
   * @param {string} exSkillKey - EX被动技能按键（W_EX2/E_EX2/U_EX2）
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightDamageBonusExEffect (exSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('holy_knight', exSkillKey)
    if (!staticSkill || typeof staticSkill.getDamageBonus !== 'function') {
      return ''
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const damageBonus = staticSkill.getDamageBonus(level)

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：增强${baseSkillName}，增加技能伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    return lines.join('')
  }

  /**
   * 获取"神圣壁垒"技能效果描述
   * Q技能 - 群体BUFF技能，提升全队防御力
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyBulwarkEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">群体BUFF：神圣壁垒</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间提升全队防御力</div>',
      '<div class="skill-tooltip-buff-effect-item">防御力：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：50秒（CD的一半）</div>'
    ]

    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复

    return lines.join('')
  }

  /**
   * 获取"神圣壁垒EX1-增强生命值"技能效果描述
   * O技能 - 被动技能，增强神圣壁垒，全队最大生命值+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyBulwarkEx1Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'O')
    let maxHp = 10
    if (staticSkill && typeof staticSkill.getMaxHpBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      maxHp = staticSkill.getMaxHpBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外最大生命值加成: +${maxHp}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：神圣壁垒持续期间，全队最大生命值额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与神圣壁垒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"神圣壁垒EX2-增强伤害减免"技能效果描述
   * O_EX2技能 - 被动技能，增强神圣壁垒，全队伤害减免+10%（185级解锁）
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyBulwarkEx2Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'O_EX2')
    let damageReduction = 10
    if (staticSkill && typeof staticSkill.getDamageReductionBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageReduction = staticSkill.getDamageReductionBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外伤害减免加成: +${damageReduction}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：神圣壁垒持续期间，全队伤害减免额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与神圣壁垒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"神圣壁垒EX3-伤害分担"技能效果描述
   * O_EX3技能 - 被动技能，增强神圣壁垒，持续期间所有队员受到伤害的15%由释放者分担（仅副本生效）
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyBulwarkEx3Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'O_EX3')
    let damageShare = 15
    if (staticSkill && typeof staticSkill.getDamageSharePercent === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageShare = staticSkill.getDamageSharePercent(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">伤害分担: ${damageShare}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：神圣壁垒持续期间，所有队员受到伤害的15%由释放神圣壁垒的角色分担</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">仅副本页面生效（主页面无队友）</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"荣耀之剑"技能效果描述
   * W技能 - 单体大地属性伤害技能
   * EX加成信息由面板「EX加成」区域统一展示，此处不再重复
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldBashMainEffect () {
    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复
    return ''
  }

  /**
   * 获取"荣耀之剑EX1-CD减少"技能效果描述
   * W_EX技能 - 被动技能，增强荣耀之剑，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldBashEx1Effect (skill) {
    return this.getHolyKnightCdReductionExEffect('W_EX', 'W', '荣耀之剑', skill)
  }

  /**
   * 获取"荣耀之剑EX2-伤害增加"技能效果描述
   * W_EX2技能 - 被动技能，增强荣耀之剑，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldBashEx2Effect (skill) {
    return this.getHolyKnightDamageBonusExEffect('W_EX2', '荣耀之剑', skill)
  }

  /**
   * 获取"荣耀之剑EX3-倍攻"技能效果描述
   * W_EX3技能 - 被动技能，增强荣耀之剑，概率触发倍攻伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
static getShieldBashEx3Effect (skill) {
const staticSkill = getSkill('holy_knight', 'W_EX3')
let chances = { chance2x: 30, chance3x: 20, chance4x: 10 }
if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
const level = Number(skill?.level || skill?.proficiencyLevel || 1)
chances = staticSkill.getCriticalMultiplier(level)
}

const lines = [
'<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发概率:</div>',
`<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率造成2倍伤害</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率造成3倍伤害</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance4x}%概率造成4倍伤害</div>`,
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与荣耀之剑效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]
return lines.join('')
}

  /**
   * 获取"碎甲圣裁"技能效果描述
   * E技能 - 单体DEBUFF技能，降低目标防御力并增加承受伤害
   * @returns {string} HTML 格式的效果描述
   */
  static getArmorBreakMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">单体DEBUFF：护甲碎裂</div>',
      '<div class="skill-tooltip-buff-effect-item">造成大地属性伤害，施加「护甲碎裂」</div>',
      '<div class="skill-tooltip-buff-effect-item">印记期间目标防御力降低50%</div>',
      '<div class="skill-tooltip-buff-effect-item">印记期间目标承受伤害增加30%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：60秒（解锁EX1后30秒）</div>'
    ]

    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复

    return lines.join('')
  }

  /**
   * 获取"碎甲圣裁EX1-CD减少"技能效果描述
   * E_EX1技能 - 被动技能，增强碎甲圣裁，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArmorBreakEx1Effect (skill) {
    return this.getHolyKnightCdReductionExEffect('E_EX1', 'E', '碎甲圣裁', skill)
  }

  /**
   * 获取"碎甲圣裁EX2-伤害增加"技能效果描述
   * E_EX2技能 - 被动技能，增强碎甲圣裁，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArmorBreakEx2Effect (skill) {
    return this.getHolyKnightDamageBonusExEffect('E_EX2', '碎甲圣裁', skill)
  }

  /**
   * 获取"碎甲圣裁EX3-双倍惩戒强化"技能效果描述
   * E_EX3技能 - 被动技能，碎甲圣裁DEBUFF期间双倍惩戒概率*2
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArmorBreakEx3Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'E_EX3')
    let multiplier = 2
    if (staticSkill && typeof staticSkill.getDoubleJudgmentMultiplier === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      multiplier = staticSkill.getDoubleJudgmentMultiplier(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">双倍惩戒概率倍率: x${multiplier}</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：碎甲圣裁DEBUFF持续期间，攻击带有该DEBUFF的目标时双倍惩戒触发概率翻倍</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">示例：双倍惩戒25%概率 → 解锁后50%概率</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣殿裁决"技能效果描述
   * U技能 - AOE大地属性伤害技能
   * EX加成信息由面板「EX加成」区域统一展示，此处不再重复
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightJudgmentMainEffect () {
    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复
    return ''
  }

  /**
   * 获取"圣殿裁决EX1-CD减少"技能效果描述
   * U_EX1技能 - 被动技能，增强圣殿裁决，减少冷却时间50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightJudgmentEx1Effect (skill) {
    return this.getHolyKnightCdReductionExEffect('U_EX1', 'U', '圣殿裁决', skill)
  }

  /**
   * 获取"圣殿裁决EX2-伤害增加"技能效果描述
   * U_EX2技能 - 被动技能，增强圣殿裁决，增加技能伤害50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightJudgmentEx2Effect (skill) {
    return this.getHolyKnightDamageBonusExEffect('U_EX2', '圣殿裁决', skill)
  }

/**
* 获取"圣殿裁决EX3-倍攻"技能效果描述
* U_EX3技能 - 被动技能，增强圣殿裁决，概率触发倍攻伤害
* 30%概率造成2倍伤害，20%概率造成2.5倍伤害，10%概率造成3倍伤害
* @param {Object} skill - 技能配置对象
* @returns {string} HTML 格式的效果描述
*/
static getHolyKnightJudgmentEx3Effect (skill) {
const staticSkill = getSkill('holy_knight', 'U_EX3')
let chances = { chance2x: 30, chance2_5x: 20, chance3x: 10 }
if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
const level = Number(skill?.level || skill?.proficiencyLevel || 1)
chances = staticSkill.getCriticalMultiplier(level)
}

const lines = [
'<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">倍攻触发概率:</div>',
`<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率造成2倍伤害</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance2_5x}%概率造成2.5倍伤害</div>`,
`<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率造成3倍伤害</div>`,
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣殿裁决效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]
return lines.join('')
}

/**
* 获取"重甲精通"技能效果描述
* I技能 - 被动技能，增加自身防御力
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHeavyArmorMasteryEffect (skill, player = null) {
    const staticSkill = getSkill('holy_knight', 'I')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let defenseBonus = 10
    if (typeof staticSkill.getDefenseBonus === 'function') {
      defenseBonus = staticSkill.getDefenseBonus(level)
    }

const lines = [
`<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">防御力加成: +${defenseBonus}%</div>`,
'<div class="skill-tooltip-buff-effect-item">增加自身防御力，随熟练度提升</div>',
'<div class="skill-tooltip-buff-effect-item">防御力：1级+5%，每级+5%，5级+25%</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'I')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    return lines.join('')
  }

/**
* 获取"重甲精通EX1-属性抗性增强"技能效果描述
* I_EX1技能 - 被动技能，增加所有属性抗性10%
* @param {Object} skill - 技能配置对象
* @returns {string} HTML 格式的效果描述
*/
static getHeavyArmorMasteryEx1Effect (skill) {
const staticSkill = getSkill('holy_knight', 'I_EX1')
let resistanceBonus = 10
if (staticSkill && typeof staticSkill.getAllResistanceBonus === 'function') {
const level = Number(skill?.level || skill?.proficiencyLevel || 1)
resistanceBonus = staticSkill.getAllResistanceBonus(level)
}

const lines = [
`<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">所有属性抗性加成: +${resistanceBonus}%</div>`,
'<div class="skill-tooltip-buff-effect-item">效果：增加所有属性抗性（雷、水、火、风、土）</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与重甲精通效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]
return lines.join('')
}

/**
* 获取"重甲精通EX2-增强生命值"技能效果描述
* I_EX2技能 - 被动技能，额外增加最大生命值15%
* @param {Object} skill - 技能配置对象
* @returns {string} HTML 格式的效果描述
*/
static getHeavyArmorMasteryEx2Effect (skill) {
const staticSkill = getSkill('holy_knight', 'I_EX2')
let maxHp = 15
if (staticSkill && typeof staticSkill.getMaxHpBonus === 'function') {
const level = Number(skill?.level || skill?.proficiencyLevel || 1)
maxHp = staticSkill.getMaxHpBonus(level)
}

const lines = [
`<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外最大生命值加成: +${maxHp}%</div>`,
'<div class="skill-tooltip-buff-effect-item">效果：重甲精通额外增加最大生命值</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与重甲精通及EX1效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]
return lines.join('')
}

/**
* 获取"重甲精通EX3-概率减伤"技能效果描述
* I_EX3技能 - 被动技能，受到攻击时概率触发减伤
* @returns {string} HTML 格式的效果描述
*/
static getHeavyArmorMasteryEx3Effect () {
const staticSkill = getSkill('holy_knight', 'I_EX3')
let tiers = [
{ chance: 30, reduction: 10 },
{ chance: 20, reduction: 20 },
{ chance: 10, reduction: 30 }
]
if (staticSkill && typeof staticSkill.getDamageReduction === 'function') {
const config = staticSkill.getDamageReduction(1)
if (config && Array.isArray(config.tiers)) {
tiers = config.tiers
}
}

const lines = [
'<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">概率减伤触发:</div>',
`<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">${tiers[0]?.chance || 30}%概率减少所有伤害${tiers[0]?.reduction || 10}%</div>`,
`<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">${tiers[1]?.chance || 20}%概率减少所有伤害${tiers[1]?.reduction || 20}%</div>`,
`<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">${tiers[2]?.chance || 10}%概率减少所有伤害${tiers[2]?.reduction || 30}%</div>`,
'<div class="skill-tooltip-buff-effect-item">受到攻击时随机摇取减伤倍率，未触发时为正常伤害</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与重甲精通及EX1/EX2效果叠加生效</div>',
'<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
]
return lines.join('')
}

  /**
   * 获取"裁决积累"技能效果描述（圣殿骑士专属）
   * J技能 - 被动技能，每次普通攻击增加裁决值
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightAccumulationEffect (skill, player = null) {
    const staticSkill = getSkill('holy_knight', 'J')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonus = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonus = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const triggerCount = typeof staticSkill.getBaseTriggerCount === 'function'
      ? staticSkill.getBaseTriggerCount()
      : 10

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">附加伤害: +${damageBonus}%攻击力（大地属性）</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点裁决值</div>`,
      '<div class="skill-tooltip-buff-effect-item">每次释放技能增加1点裁决值（不消耗额外MP）</div>',
      `<div class="skill-tooltip-buff-effect-item">裁决值达到 ${triggerCount} 点时，附加攻击力百分比的额外大地属性伤害并重置</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">解锁EX1后：触发次数从10减少至5</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'J')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度获取失败时不显示
    }

    return lines.join('')
  }

  /**
   * 获取"裁决积累EX1-减少触发次数"技能效果描述（圣殿骑士专属）
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightAccumulationEx1Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：裁决积累触发次数从 10 次减少至 5 次</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与裁决积累效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"裁决积累EX2-倍攻"技能效果描述（圣殿骑士专属）
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getHolyKnightAccumulationEx2Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'J_EX2')
    let chances = { chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }
    if (staticSkill && typeof staticSkill.getMultiAttackChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiAttackChance(level)
    }

    // 获取EX1的触发次数（5次）
    const staticEx1 = getSkill('holy_knight', 'J_EX1')
    let triggerCount = 5
    if (staticEx1 && typeof staticEx1.getTriggerReduction === 'function') {
      const reduction = staticEx1.getTriggerReduction(1)
      triggerCount = Math.max(1, Math.floor(10 * (1 - reduction / 100)))
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">倍攻触发（需先解锁裁决积累EX1）:</div>',
      `<div class="skill-tooltip-buff-effect-item">第${triggerCount}次普通攻击/技能释放时触发概率倍攻</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率附加${chances.bonus1}%攻击力的大地属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率附加${chances.bonus2}%攻击力的大地属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率附加${chances.bonus3}%攻击力的大地属性伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">未触发倍攻时回退至基础附加伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣盾觉醒"技能效果描述
   * R技能 - 单体自身BUFF技能，提升自身防御力和大地属性攻击力
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldAwakeningEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">单体BUFF：圣盾觉醒</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间提升自身防御力和大地属性攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item">防御力：1级+5%，每级+3.75%，5级+20%</div>',
      '<div class="skill-tooltip-buff-effect-item">大地属性攻击力：1级+5%，每级+3.75%，5级+20%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：30秒</div>'
    ]

    // EX加成信息由面板「EX加成」区域统一展示，此处不再重复

    return lines.join('')
  }

  /**
   * 获取"圣盾觉醒EX1-减伤强化"技能效果描述
   * R_EX1技能 - 被动技能，增强圣盾觉醒，自身伤害减免+25%，自身攻击力伤害减少50%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldAwakeningEx1Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'R_EX1')
    let damageReduction = 25
    let attackDamageReduction = 50
    if (staticSkill && typeof staticSkill.getDamageReductionBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageReduction = staticSkill.getDamageReductionBonus(level)
    }
    if (staticSkill && typeof staticSkill.getAttackDamageReduction === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      attackDamageReduction = staticSkill.getAttackDamageReduction(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外伤害减免加成: +${damageReduction}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">自身攻击力伤害减少: -${attackDamageReduction}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：圣盾觉醒持续期间，自身伤害减免额外提升，但攻击力伤害降低</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣盾觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣盾觉醒EX2-属性强化"技能效果描述
   * R_EX2技能 - 被动技能，增强圣盾觉醒，自身所有属性抗性+15%，最大生命值+15%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldAwakeningEx2Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'R_EX2')
    let allResistance = 15
    let maxHp = 15
    if (staticSkill && typeof staticSkill.getAllResistanceBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      allResistance = staticSkill.getAllResistanceBonus(level)
    }
    if (staticSkill && typeof staticSkill.getMaxHpBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      maxHp = staticSkill.getMaxHpBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">所有属性抗性: +${allResistance}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">最大生命值: +${maxHp}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：圣盾觉醒持续期间，自身所有属性抗性和最大生命值额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣盾觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"圣盾觉醒EX3-受伤反弹"技能效果描述
   * R_EX3技能 - 被动技能，增强圣盾觉醒，受到伤害时反弹50%伤害给攻击者
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getShieldAwakeningEx3Effect (skill) {
    const staticSkill = getSkill('holy_knight', 'R_EX3')
    let damageReflect = 50
    if (staticSkill && typeof staticSkill.getDamageReflectBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageReflect = staticSkill.getDamageReflectBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">受伤反弹伤害: ${damageReflect}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">圣盾觉醒持续期间，受到伤害时反弹${damageReflect}%伤害给攻击者</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与圣盾觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ==================== 奥术师技能效果 ====================

  /**
   * 获取奥术师技能的 BUFF 效果描述
   * 奥术师为元素使者三转进阶职业，以智力为核心、全元素覆盖、法术暴击为特色
   * @param {string} skillKey - 技能按键
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasterBuffEffect (skillKey, skill, player = null) {
    const amEffects = {
      Q: this.getArcaneResonanceEffect,
      O: this.getArcaneResonanceEx1Effect,
      O_EX2: this.getArcaneResonanceEx2Effect,
      O_EX3: this.getArcaneResonanceEx3Effect,
      W: this.getVoidFissionMainEffect,
      W_EX: this.getArcaneMasterCdReductionExEffect.bind(null, 'W_EX', 'W', '虚空寂灭'),
      W_EX2: this.getArcaneMasterDamageBonusExEffect.bind(null, 'W_EX2', '虚空寂灭'),
      W_EX3: this.getVoidFissionEx3Effect,
      E: this.getElementCollapseMainEffect,
      E_EX1: this.getArcaneMasterCdReductionExEffect.bind(null, 'E_EX1', 'E', '元素崩坏'),
      E_EX2: this.getArcaneMasterDamageBonusExEffect.bind(null, 'E_EX2', '元素崩坏'),
      E_EX3: this.getElementCollapseEx3Effect,
      U: this.getArcaneNovaMainEffect,
      U_EX1: this.getArcaneMasterCdReductionExEffect.bind(null, 'U_EX1', 'U', '奥术新星'),
      U_EX2: this.getArcaneMasterDamageBonusExEffect.bind(null, 'U_EX2', '奥术新星'),
      U_EX3: this.getArcaneNovaEx3Effect,
      I: this.getArcaneMasteryEffect,
      I_EX1: this.getArcaneMasteryEx1Effect,
      I_EX2: this.getArcaneMasteryEx2Effect,
      I_EX3: this.getArcaneMasteryEx3Effect,
      J: this.getArcaneChargeEffect,
      J_EX1: this.getArcaneChargeEx1Effect,
      J_EX2: this.getArcaneChargeEx2Effect,
      R: this.getArcaneOverloadEffect,
      R_EX1: this.getArcaneOverloadEx1Effect,
      R_EX2: this.getArcaneOverloadEx2Effect,
      R_EX3: this.getArcaneOverloadEx3Effect
    }

    const effectFn = amEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 生成奥术师主动技能的EX被动解锁状态说明行
   * @param {string} baseSkillName - 主动技能名称
   * @param {string} ex1Key - EX1被动技能按键
   * @param {string} ex2Key - EX2被动技能按键
   * @param {Object} [player=null] - 玩家对象
   * @param {string} [ex3Key=null] - EX3被动技能按键
   * @param {string} [ex3Desc=''] - EX3效果描述
   * @param {string} [ex1Desc='CD减少50%'] - EX1效果描述
   * @param {string} [ex2Desc='技能伤害+50%'] - EX2效果描述
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasterExStatusLines (baseSkillName, ex1Key, ex2Key, player = null, ex3Key = null, ex3Desc = '', ex1Desc = 'CD减少50%', ex2Desc = '技能伤害+50%') {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false
    try {
      ex1Unlocked = isSkillUnlocked(player, 'arcane_master', ex1Key)
      ex2Unlocked = isSkillUnlocked(player, 'arcane_master', ex2Key)
      if (ex3Key) {
        ex3Unlocked = isSkillUnlocked(player, 'arcane_master', ex3Key)
      }
    } catch (e) {
      // player 为空或检查异常时按未解锁显示
    }

    const ex1UnlockLevel = getSkill('arcane_master', ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getSkill('arcane_master', ex2Key)?.unlockLevel || 185
    const ex1Color = ex1Unlocked ? '#2ecc71' : '#95a5a6'
    const ex2Color = ex2Unlocked ? '#2ecc71' : '#95a5a6'
    const ex1Status = ex1Unlocked ? '已解锁' : `${ex1UnlockLevel}级解锁`
    const ex2Status = ex2Unlocked ? '已解锁' : `${ex2UnlockLevel}级解锁`

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex1Color};">${baseSkillName}EX1（${ex1Status}）：${ex1Desc}</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: ${ex2Color};">${baseSkillName}EX2（${ex2Status}）：${ex2Desc}</div>`
    ]

    if (ex3Key) {
      const ex3UnlockLevel = getSkill('arcane_master', ex3Key)?.unlockLevel || 190
      const ex3Color = ex3Unlocked ? '#2ecc71' : '#95a5a6'
      const ex3Status = ex3Unlocked ? '已解锁' : `${ex3UnlockLevel}级解锁`
      lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${ex3Color};">${baseSkillName}EX3（${ex3Status}）：${ex3Desc}</div>`)
    }

    return lines.join('')
  }

  /**
   * 生成奥术师"EX1-CD减少"类被动技能的效果描述
   * 虚空寂灭EX1/元素崩坏EX1/奥术新星EX1共用，固定减少50%CD
   * @param {string} exSkillKey - EX被动技能按键
   * @param {string} baseSkillKey - 被增强的主动技能按键
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasterCdReductionExEffect (exSkillKey, baseSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('arcane_master', exSkillKey)
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      // 回退：使用固定50%减少
      const baseCd = Number(getSkill('arcane_master', baseSkillKey)?.cd) || 0
      const effectiveCd = Math.max(1, Math.ceil(baseCd * 0.5))
      const lines = [
        '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: 50%</div>'
      ]
      if (baseCd > 0 && effectiveCd < baseCd) {
        lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
      }
      lines.push(
        `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
        '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
      )
      return lines.join('')
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)
    const baseCd = Number(getSkill('arcane_master', baseSkillKey)?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )
    return lines.join('')
  }

  /**
   * 生成奥术师"EX2-伤害增加"类被动技能的效果描述
   * 虚空寂灭EX2/元素崩坏EX2/奥术新星EX2共用，固定增加50%技能伤害
   * @param {string} exSkillKey - EX被动技能按键
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasterDamageBonusExEffect (exSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('arcane_master', exSkillKey)
    let damageBonus = 50
    if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageBonus = staticSkill.getDamageBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：增强${baseSkillName}，增加技能伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 奥术共鸣（Q技能）----------

  /**
   * 获取"奥术共鸣"技能效果描述
   * Q技能 - 群体BUFF，提升全队法术攻击力和全元素攻击力
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneResonanceEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">群体BUFF：奥术共鸣</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间提升全队法术攻击力和全元素攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item">法术攻击力：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">全元素攻击力：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：50秒（CD的一半）</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术共鸣EX1-增强法力"技能效果描述
   * O技能 - 被动，全队最大MP+15%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneResonanceEx1Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'O')
    let maxMp = 15
    if (staticSkill && typeof staticSkill.getMaxMpBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      maxMp = staticSkill.getMaxMpBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外最大MP加成: +${maxMp}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：奥术共鸣持续期间，全队最大MP额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术共鸣效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术共鸣EX2-法术穿透"技能效果描述
   * O_EX2技能 - 被动，全队法术穿透+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneResonanceEx2Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'O_EX2')
    let spellPen = 10
    if (staticSkill && typeof staticSkill.getSpellPenetration === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      spellPen = staticSkill.getSpellPenetration(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法术穿透: +${spellPen}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：奥术共鸣持续期间，全队法术穿透额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术共鸣效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术共鸣EX3-法术暴击"技能效果描述
   * O_EX3技能 - 被动，全队法术暴击率+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneResonanceEx3Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'O_EX3')
    let critRate = 10
    if (staticSkill && typeof staticSkill.getCritRateBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      critRate = staticSkill.getCritRateBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法术暴击率: +${critRate}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：奥术共鸣持续期间，全队法术暴击率额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术共鸣效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 虚空寂灭（W技能）----------

  /**
   * 获取"虚空寂灭"技能效果描述
   * W技能 - 单体法术伤害，无属性法术爆发
   * @returns {string} HTML 格式的效果描述
   */
  static getVoidFissionMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">单体法术伤害：虚空寂灭</div>',
      '<div class="skill-tooltip-buff-effect-item">无属性法术单体爆发，以智力为核心计算伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×3.0</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"虚空寂灭EX3-法术连击"技能效果描述
   * W_EX3技能 - 被动，概率触发法术连击
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getVoidFissionEx3Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'W_EX3')
    let chances = { chance2x: 30, chance3x: 20, chance4x: 10 }
    if (staticSkill && typeof staticSkill.getMultiCastChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiCastChance(level)
    }
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">法术连击触发:</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率触发2倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率触发3倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance4x}%概率触发4倍伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与虚空寂灭效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 元素崩坏（E技能）----------

  /**
   * 获取"元素崩坏"技能效果描述
   * E技能 - AOE DEBUFF，降低目标全元素抗性
   * @returns {string} HTML 格式的效果描述
   */
  static getElementCollapseMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">AOE DEBUFF：元素崩坏</div>',
      '<div class="skill-tooltip-buff-effect-item">对范围内目标造成法术伤害并施加元素脆弱</div>',
      '<div class="skill-tooltip-buff-effect-item">元素脆弱：降低目标全元素抗性</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×2.5</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"元素崩坏EX3-元素易伤强化"技能效果描述
   * E_EX3技能 - 被动，元素脆弱效果增强20%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getElementCollapseEx3Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'E_EX3')
    let vulnBoost = 20
    if (staticSkill && typeof staticSkill.getVulnerabilityBoost === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      vulnBoost = staticSkill.getVulnerabilityBoost(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">元素脆弱增强: +${vulnBoost}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：元素崩坏施加的元素脆弱效果额外增强</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与元素崩坏效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 奥术新星（U技能）----------

  /**
   * 获取"奥术新星"技能效果描述
   * U技能 - AOE法术伤害，高频法术输出
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneNovaMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">AOE法术伤害：奥术新星</div>',
      '<div class="skill-tooltip-buff-effect-item">对范围内目标造成无属性法术伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×2.0</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术新星EX3-多段攻击"技能效果描述
   * U_EX3技能 - 被动，概率触发多段攻击
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneNovaEx3Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">多段攻击触发:</div>',
      '<div class="skill-tooltip-buff-effect-item">30%概率触发1段攻击（额外1次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item">20%概率触发2段攻击（额外2次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率触发3段攻击（额外3次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术新星效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 奥术精通（I技能）----------

  /**
   * 获取"奥术精通"技能效果描述
   * I技能 - 被动，提升法术攻击力
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasteryEffect (skill, player = null) {
    const staticSkill = getSkill('arcane_master', 'I')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let magicAtkBonus = 5
    if (typeof staticSkill.getMagicAttackBonus === 'function') {
      magicAtkBonus = staticSkill.getMagicAttackBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">法术攻击力加成: +${magicAtkBonus}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">被动提升自身法术攻击力，以智力为核心</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术精通EX1-法力涌动"技能效果描述
   * I_EX1技能 - 被动，增加最大MP
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasteryEx1Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'I_EX1')
    let maxMp = 15
    if (staticSkill && typeof staticSkill.getMaxMpBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      maxMp = staticSkill.getMaxMpBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">最大MP加成: +${maxMp}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：额外增加自身最大MP</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术精通效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术精通EX2-元素亲和"技能效果描述
   * I_EX2技能 - 被动，增加全元素攻击力
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasteryEx2Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'I_EX2')
    let elementAtk = 15
    if (staticSkill && typeof staticSkill.getAllElementAttackBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      elementAtk = staticSkill.getAllElementAttackBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">全元素攻击力: +${elementAtk}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：额外增加自身全元素攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术精通效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术精通EX3-法术吸收"技能效果描述
   * I_EX3技能 - 被动，法术吸收回复MP
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneMasteryEx3Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">法术吸收:</div>',
      '<div class="skill-tooltip-buff-effect-item">30%概率吸收10%法术伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">20%概率吸收20%法术伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率吸收30%法术伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">受到法术伤害时随机摇取吸收比例</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术精通及EX1/EX2效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 奥术充能（J技能）----------

  /**
   * 获取"奥术充能"技能效果描述
   * J技能 - 被动，充能积累机制
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneChargeEffect (skill, player = null) {
    const staticSkill = getSkill('arcane_master', 'J')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonus = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonus = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerCast === 'function'
      ? staticSkill.getMpCostPerCast()
      : 25

    const triggerCount = typeof staticSkill.getBaseTriggerCount === 'function'
      ? staticSkill.getBaseTriggerCount()
      : 8

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">附加伤害: +${damageBonus}%法术攻击力（无属性）</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次施法消耗 ${mpCost} MP，增加1点奥术充能</div>`,
      '<div class="skill-tooltip-buff-effect-item">每次普通攻击增加1点奥术充能（不消耗额外MP）</div>',
      `<div class="skill-tooltip-buff-effect-item">充能达到 ${triggerCount} 点时，释放法术爆发并重置</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">解锁EX1后：触发次数从8减少至4</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术充能EX1-减少触发次数"技能效果描述
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneChargeEx1Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：奥术充能触发次数从 8 次减少至 4 次</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术充能效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术充能EX2-法术连锁"技能效果描述
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneChargeEx2Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'J_EX2')
    let chances = { chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }
    if (staticSkill && typeof staticSkill.getMultiCastChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiCastChance(level)
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">法术连锁触发（需先解锁奥术充能EX1）:</div>',
      '<div class="skill-tooltip-buff-effect-item">第4次施法/普通攻击时触发概率法术连锁</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率附加${chances.bonus1}%法术攻击力的无属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率附加${chances.bonus2}%法术攻击力的无属性伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率附加${chances.bonus3}%法术攻击力的无属性伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">未触发法术连锁时回退至基础附加伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 奥术超载（R技能）----------

  /**
   * 获取"奥术超载"技能效果描述
   * R技能 - 自身BUFF，大幅提升法术攻击力和全元素攻击力
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneOverloadEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">自身BUFF：奥术超载</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间大幅提升自身法术攻击力和全元素攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item">法术攻击力：1级+10%，每级+7.5%，5级+40%</div>',
      '<div class="skill-tooltip-buff-effect-item">全元素攻击力：1级+10%，每级+7.5%，5级+40%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：30秒</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术超载EX1-法力护盾"技能效果描述
   * R_EX1技能 - 被动，法力护盾吸收伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneOverloadEx1Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'R_EX1')
    let absorbRate = 25
    if (staticSkill && typeof staticSkill.getAbsorbRate === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      absorbRate = staticSkill.getAbsorbRate(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法力护盾: 吸收${absorbRate}%伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：奥术超载持续期间，受到的伤害由MP吸收</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术超载效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术超载EX2-元素共鸣"技能效果描述
   * R_EX2技能 - 被动，法术暴击伤害+25%，全元素攻击力+15%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneOverloadEx2Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'R_EX2')
    let critDmg = 25
    let elementAtk = 15
    if (staticSkill && typeof staticSkill.getCritDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      critDmg = staticSkill.getCritDamageBonus(level)
    }
    if (staticSkill && typeof staticSkill.getAllElementAttackBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      elementAtk = staticSkill.getAllElementAttackBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法术暴击伤害: +${critDmg}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">全元素攻击力: +${elementAtk}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：奥术超载持续期间，法术暴击伤害和全元素攻击力额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术超载效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"奥术超载EX3-法术反弹"技能效果描述
   * R_EX3技能 - 被动，受到法术伤害时反弹20%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getArcaneOverloadEx3Effect (skill) {
    const staticSkill = getSkill('arcane_master', 'R_EX3')
    let reflectRate = 20
    if (staticSkill && typeof staticSkill.getReflectRate === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      reflectRate = staticSkill.getReflectRate(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">法术反弹: ${reflectRate}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">奥术超载持续期间，受到法术伤害时反弹${reflectRate}%伤害给攻击者</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与奥术超载效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ==================== 心灵师技能效果 ====================

  /**
   * 获取心灵师技能的 BUFF 效果描述
   * 根据技能按键分派到对应的效果描述方法
   * @param {string} skillKey - 技能按键（如 'Q', 'W', 'W_EX' 等）
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasterBuffEffect (skillKey, skill, player = null) {
    const mmEffects = {
      Q: this.getMindResonanceEffect,
      O: this.getMindResonanceEx1Effect,
      O_EX2: this.getMindResonanceEx2Effect,
      O_EX3: this.getMindResonanceEx3Effect,
      W: this.getStarThoughtFallMainEffect,
      W_EX: this.getMindMasterCdReductionExEffect.bind(null, 'W_EX', 'W', '星思坠寂'),
      W_EX2: this.getMindMasterDamageBonusExEffect.bind(null, 'W_EX2', '星思坠寂'),
      W_EX3: this.getStarThoughtFallEx3Effect,
      E: this.getConsciousnessCollapseMainEffect,
      E_EX1: this.getMindMasterCdReductionExEffect.bind(null, 'E_EX1', 'E', '意识崩塌'),
      E_EX2: this.getMindMasterDamageBonusExEffect.bind(null, 'E_EX2', '意识崩塌'),
      E_EX3: this.getConsciousnessCollapseEx3Effect,
      U: this.getMindNovaFallMainEffect,
      U_EX1: this.getMindMasterCdReductionExEffect.bind(null, 'U_EX1', 'U', '万绪沉宵'),
      U_EX2: this.getMindMasterDamageBonusExEffect.bind(null, 'U_EX2', '万绪沉宵'),
      U_EX3: this.getMindNovaFallEx3Effect,
      I: this.getMindMasteryEffect,
      I_EX1: this.getMindMasteryEx1Effect,
      I_EX2: this.getMindMasteryEx2Effect,
      I_EX3: this.getMindMasteryEx3Effect,
      J: this.getMindChargeEffect,
      J_EX1: this.getMindChargeEx1Effect,
      J_EX2: this.getMindChargeEx2Effect,
      R: this.getMindAwakeningEffect,
      R_EX1: this.getMindAwakeningEx1Effect,
      R_EX2: this.getMindAwakeningEx2Effect,
      R_EX3: this.getMindAwakeningEx3Effect
    }

    const effectFn = mmEffects[skillKey]
    return effectFn ? effectFn.call(this, skill, player) : ''
  }

  /**
   * 生成心灵师"EX1-CD减少"类被动技能的效果描述
   * 星思坠寂EX1/意识崩塌EX1/万绪沉宵EX1共用，固定减少50%CD
   * @param {string} exSkillKey - EX被动技能按键
   * @param {string} baseSkillKey - 被增强的主动技能按键
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasterCdReductionExEffect (exSkillKey, baseSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('mind_master', exSkillKey)
    if (!staticSkill || typeof staticSkill.getCdReduction !== 'function') {
      const baseCd = Number(getSkill('mind_master', baseSkillKey)?.cd) || 0
      const effectiveCd = Math.max(1, Math.ceil(baseCd * 0.5))
      const lines = [
        '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: 50%</div>'
      ]
      if (baseCd > 0 && effectiveCd < baseCd) {
        lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
      }
      lines.push(
        `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
        '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
      )
      return lines.join('')
    }

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    const cdReduction = staticSkill.getCdReduction(level)
    const baseCd = Number(getSkill('mind_master', baseSkillKey)?.cd) || 0
    const effectiveCd = Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">CD减少: ${cdReduction}%</div>`
    ]
    if (baseCd > 0 && effectiveCd < baseCd) {
      lines.push(`<div class="skill-tooltip-buff-effect-item">效果：${baseSkillName}冷却时间从 ${baseCd}秒 减少至 ${effectiveCd}秒</div>`)
    }
    lines.push(
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    )
    return lines.join('')
  }

  /**
   * 生成心灵师"EX2-伤害增加"类被动技能的效果描述
   * 星思坠寂EX2/意识崩塌EX2/万绪沉宵EX2共用，固定增加50%技能伤害
   * @param {string} exSkillKey - EX被动技能按键
   * @param {string} baseSkillName - 被增强的主动技能名称
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasterDamageBonusExEffect (exSkillKey, baseSkillName, skill) {
    const staticSkill = getSkill('mind_master', exSkillKey)
    let damageBonus = 50
    if (staticSkill && typeof staticSkill.getDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      damageBonus = staticSkill.getDamageBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">技能伤害增加: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">效果：增强${baseSkillName}，增加技能伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与${baseSkillName}效果叠加生效</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 心灵感应（Q技能）----------

  /**
   * 获取"心灵感应"技能效果描述
   * Q技能 - 群体BUFF，提升全队魔法防御和法术闪避率
   * @returns {string} HTML 格式的效果描述
   */
  static getMindResonanceEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">群体BUFF：心灵感应</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间提升全队魔法防御和法术闪避率</div>',
      '<div class="skill-tooltip-buff-effect-item">魔法防御：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">法术闪避率：1级+2%，每级+2%，5级+10%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：50秒（CD的一半）</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵感应EX1-精神屏障"技能效果描述
   * O技能 - 被动，全队物理防御+15%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindResonanceEx1Effect (skill) {
    const staticSkill = getSkill('mind_master', 'O')
    let defense = 15
    if (staticSkill && typeof staticSkill.getDefenseBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      defense = staticSkill.getDefenseBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">额外物理防御加成: +${defense}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：心灵感应持续期间，全队物理防御额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵感应效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵感应EX2-心灵共鸣"技能效果描述
   * O_EX2技能 - 被动，全队法术暴击伤害+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindResonanceEx2Effect (skill) {
    const staticSkill = getSkill('mind_master', 'O_EX2')
    let critDamage = 10
    if (staticSkill && typeof staticSkill.getCriticalDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      critDamage = staticSkill.getCriticalDamageBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法术暴击伤害: +${critDamage}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：心灵感应持续期间，全队法术暴击伤害额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵感应效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵感应EX3-精神统御"技能效果描述
   * O_EX3技能 - 被动，全队攻击力+10%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindResonanceEx3Effect (skill) {
    const staticSkill = getSkill('mind_master', 'O_EX3')
    let attack = 10
    if (staticSkill && typeof staticSkill.getAttackBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      attack = staticSkill.getAttackBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">攻击力: +${attack}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：心灵感应持续期间，全队攻击力额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵感应效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 星思坠寂（W技能）----------

  /**
   * 获取"星思坠寂"技能效果描述
   * W技能 - 单体法术伤害，无属性精神冲击
   * @returns {string} HTML 格式的效果描述
   */
  static getStarThoughtFallMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">单体法术伤害：星思坠寂</div>',
      '<div class="skill-tooltip-buff-effect-item">精神冲击穿透识海，造成高额精神伤害</div>',
      '<div class="skill-tooltip-buff-effect-item">并短暂延迟目标的意识反应</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×9.0</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"星思坠寂EX3-精神连击"技能效果描述
   * W_EX3技能 - 被动，概率触发精神连击
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getStarThoughtFallEx3Effect (skill) {
    const staticSkill = getSkill('mind_master', 'W_EX3')
    let chances = { chance2x: 30, chance3x: 20, chance4x: 10 }
    if (staticSkill && typeof staticSkill.getCriticalMultiplier === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getCriticalMultiplier(level)
    }
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">精神连击触发:</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2x}%概率触发2倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3x}%概率触发3倍伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance4x}%概率触发4倍伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与星思坠寂效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 意识崩塌（E技能）----------

  /**
   * 获取"意识崩塌"技能效果描述
   * E技能 - AOE DEBUFF，降低目标攻击力并增加受到伤害
   * @returns {string} HTML 格式的效果描述
   */
  static getConsciousnessCollapseMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">AOE DEBUFF：意识崩塌</div>',
      '<div class="skill-tooltip-buff-effect-item">对范围内目标造成精神伤害并施加意识混乱</div>',
      '<div class="skill-tooltip-buff-effect-item">意识混乱：目标攻击力降低30%，受到伤害增加20%</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×5.18</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"意识崩塌EX3-精神虚弱强化"技能效果描述
   * E_EX3技能 - 被动，意识混乱效果增强20%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getConsciousnessCollapseEx3Effect (skill) {
    const staticSkill = getSkill('mind_master', 'E_EX3')
    let vulnBoost = 20
    if (staticSkill && typeof staticSkill.getVulnerabilityBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      vulnBoost = staticSkill.getVulnerabilityBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">精神虚弱强化: +${vulnBoost}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：意识崩塌施加的意识混乱效果额外增强</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与意识崩塌效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 万绪沉宵（U技能）----------

  /**
   * 获取"万绪沉宵"技能效果描述
   * U技能 - AOE法术伤害，精神侵蚀范围伤害
   * @returns {string} HTML 格式的效果描述
   */
  static getMindNovaFallMainEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">AOE法术伤害：万绪沉宵</div>',
      '<div class="skill-tooltip-buff-effect-item">引无边幽夜笼罩区域，对多名目标造成精神侵蚀</div>',
      '<div class="skill-tooltip-buff-effect-item">并使其陷入短暂的意志低迷</div>',
      '<div class="skill-tooltip-buff-effect-item">基础伤害 + 智力×7.5</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"万绪沉宵EX3-心灵震荡"技能效果描述
   * U_EX3技能 - 被动，概率触发多段攻击
   * @returns {string} HTML 格式的效果描述
   */
  static getMindNovaFallEx3Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">多段攻击触发:</div>',
      '<div class="skill-tooltip-buff-effect-item">30%概率触发1段攻击（额外1次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item">20%概率触发2段攻击（额外2次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率触发3段攻击（额外3次伤害）</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与万绪沉宵效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 心灵精通（I技能）----------

  /**
   * 获取"星念凝徽"技能效果描述
   * I技能 - 被动，提升心灵技能伤害和暴击率
   * @param {Object} skill - 技能配置对象
   * @param {Object} [player=null] - 玩家对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasteryEffect (skill, player = null) {
    const staticSkill = getSkill('mind_master', 'I')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonus = 6
    let critRate = 3
    if (typeof staticSkill.getSkillDamageBonus === 'function') {
      damageBonus = staticSkill.getSkillDamageBonus(level)
    }
    if (typeof staticSkill.getCritRateBonus === 'function') {
      critRate = staticSkill.getCritRateBonus(level)
    }

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">技能伤害加成: +${damageBonus}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">暴击率加成: +${critRate}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">将散落如星的意念凝为自身徽记，提升所有心灵技能伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'I')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度查询失败时不显示
    }

    return lines.join('')
  }

  /**
   * 获取"星念凝徽EX1-暴击强化"技能效果描述
   * I_EX1技能 - 被动，增加暴击伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasteryEx1Effect (skill) {
    const staticSkill = getSkill('mind_master', 'I_EX1')
    let critDamage = 10
    if (staticSkill && typeof staticSkill.getCritDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      critDamage = staticSkill.getCritDamageBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击伤害加成: +${critDamage}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：额外增加自身暴击伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与星念凝徽效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"星念凝徽EX2-精神壁垒"技能效果描述
   * I_EX2技能 - 被动，增加法术防御
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasteryEx2Effect (skill) {
    const staticSkill = getSkill('mind_master', 'I_EX2')
    let magicDef = 25
    if (staticSkill && typeof staticSkill.getMagicDefenseBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      magicDef = staticSkill.getMagicDefenseBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">法术防御加成: +${magicDef}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：额外增加自身法术防御</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与星念凝徽效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"星念凝徽EX3-精神回复"技能效果描述
   * I_EX3技能 - 被动，增加最大MP并精神回复MP
   * @returns {string} HTML 格式的效果描述
   */
  static getMindMasteryEx3Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">最大MP加成: +30%</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">精神回复:</div>',
      '<div class="skill-tooltip-buff-effect-item">30%概率回复10%伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">20%概率回复20%伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">10%概率回复30%伤害为MP</div>',
      '<div class="skill-tooltip-buff-effect-item">受到伤害时随机摇取回复比例</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与星念凝徽及EX1/EX2效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 碎思归墟（J技能）----------

/**
 * 获取"碎思归墟"技能效果描述
 * J技能 - 被动，充能积累机制
 * @param {Object} skill - 技能配置对象
 * @param {Object} [player=null] - 玩家对象
 * @returns {string} HTML 格式的效果描述
 */
  static getMindChargeEffect (skill, player = null) {
    const staticSkill = getSkill('mind_master', 'J')
    if (!staticSkill) return ''

    const level = Number(skill?.level || skill?.proficiencyLevel || 1)
    let damageBonus = 10
    if (typeof staticSkill.getDamageBonusPercent === 'function') {
      damageBonus = staticSkill.getDamageBonusPercent(level)
    }

    const mpCost = typeof staticSkill.getMpCostPerAttack === 'function'
      ? staticSkill.getMpCostPerAttack()
      : 30

    const triggerCount = typeof staticSkill.getBaseTriggerCount === 'function'
      ? staticSkill.getBaseTriggerCount()
      : 10

    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">附加伤害: +${damageBonus}%最大MP（精神伤害）</div>`,
      `<div class="skill-tooltip-buff-effect-item">每次普通攻击消耗 ${mpCost} MP，增加1点充能</div>`,
      '<div class="skill-tooltip-buff-effect-item">每次释放技能增加1点充能（不消耗额外MP）</div>',
      `<div class="skill-tooltip-buff-effect-item">充能达到 ${triggerCount} 点时，释放精神爆发并重置</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">解锁EX1后：触发次数从10减少至5</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]

    // 显示熟练度增长进度（普通攻击计数）
    try {
      const progress = getMasteryProgress(player, 'J')
      if (progress && !progress.isMax) {
        lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">熟练度进度: ${progress.current}/${progress.threshold} 次普通攻击</div>`)
      } else if (progress && progress.isMax) {
        lines.push('<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">熟练度已满级</div>')
      }
    } catch (e) {
      // 进度查询失败时不显示
    }

    return lines.join('')
  }

/**
 * 获取"碎思归墟EX1-减少触发次数"技能效果描述
 * @returns {string} HTML 格式的效果描述
 */
  static getMindChargeEx1Effect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">触发次数减少: 50%</div>',
      '<div class="skill-tooltip-buff-effect-item">效果：碎思归墟触发次数从 10 次减少至 5 次</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与碎思归墟效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

/**
 * 获取"碎思归墟EX2-心灵连锁"技能效果描述
 * @param {Object} skill - 技能配置对象
 * @returns {string} HTML 格式的效果描述
 */
  static getMindChargeEx2Effect (skill) {
    const staticSkill = getSkill('mind_master', 'J_EX2')
    let chances = { chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }
    if (staticSkill && typeof staticSkill.getMultiCastChance === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      chances = staticSkill.getMultiCastChance(level)
    }

    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">心灵连锁触发（需先解锁碎思归墟EX1）:</div>',
      '<div class="skill-tooltip-buff-effect-item">第5次普通攻击/释放技能时触发概率心灵连锁</div>',
      `<div class="skill-tooltip-buff-effect-item">${chances.chance1}%概率附加${chances.bonus1}%最大MP的精神伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance2}%概率附加${chances.bonus2}%最大MP的精神伤害</div>`,
      `<div class="skill-tooltip-buff-effect-item">${chances.chance3}%概率附加${chances.bonus3}%最大MP的精神伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">未触发心灵连锁时回退至基础附加伤害</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  // ---------- 心灵觉醒（R技能）----------

  /**
   * 获取"心灵觉醒"技能效果描述
   * R技能 - 自身BUFF，大幅提升魔法防御力和攻击力
   * @returns {string} HTML 格式的效果描述
   */
  static getMindAwakeningEffect () {
    const lines = [
      '<div class="skill-tooltip-buff-effect-item" style="color: #f1c40f;">自身BUFF：心灵觉醒</div>',
      '<div class="skill-tooltip-buff-effect-item">持续期间大幅提升自身魔法防御力和攻击力</div>',
      '<div class="skill-tooltip-buff-effect-item">魔法防御力：1级+5%，每级+3.75%，5级+20%</div>',
      '<div class="skill-tooltip-buff-effect-item">攻击力：1级+5%，每级+3.75%，5级+20%</div>',
      '<div class="skill-tooltip-buff-effect-item">持续时间：30秒</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵觉醒EX1-精神护盾"技能效果描述
   * R_EX1技能 - 被动，精神护盾吸收伤害
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindAwakeningEx1Effect (skill) {
    const staticSkill = getSkill('mind_master', 'R_EX1')
    let absorbRate = 25
    if (staticSkill && typeof staticSkill.getMindShieldPercent === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      absorbRate = staticSkill.getMindShieldPercent(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">精神护盾: 吸收${absorbRate}%伤害</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：心灵觉醒持续期间，受到的伤害由MP吸收</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵觉醒EX2-心灵共振"技能效果描述
   * R_EX2技能 - 被动，暴击伤害+25%，全元素抗性+15%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindAwakeningEx2Effect (skill) {
    const staticSkill = getSkill('mind_master', 'R_EX2')
    let critDmg = 25
    let elementRes = 15
    if (staticSkill && typeof staticSkill.getCriticalDamageBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      critDmg = staticSkill.getCriticalDamageBonus(level)
    }
    if (staticSkill && typeof staticSkill.getAllElementResistanceBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      elementRes = staticSkill.getAllElementResistanceBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">暴击伤害: +${critDmg}%</div>`,
      `<div class="skill-tooltip-buff-effect-item" style="color: #f39c12;">全元素抗性: +${elementRes}%</div>`,
      '<div class="skill-tooltip-buff-effect-item">效果：心灵觉醒持续期间，暴击伤害和全元素抗性额外提升</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }

  /**
   * 获取"心灵觉醒EX3-精神反射"技能效果描述
   * R_EX3技能 - 被动，受到法术伤害时反射20%
   * @param {Object} skill - 技能配置对象
   * @returns {string} HTML 格式的效果描述
   */
  static getMindAwakeningEx3Effect (skill) {
    const staticSkill = getSkill('mind_master', 'R_EX3')
    let reflectRate = 20
    if (staticSkill && typeof staticSkill.getSpellReflectBonus === 'function') {
      const level = Number(skill?.level || skill?.proficiencyLevel || 1)
      reflectRate = staticSkill.getSpellReflectBonus(level)
    }
    const lines = [
      `<div class="skill-tooltip-buff-effect-item" style="color: #e74c3c;">法术反射: ${reflectRate}%</div>`,
      `<div class="skill-tooltip-buff-effect-item">心灵觉醒持续期间，受到法术伤害时反射${reflectRate}%伤害给攻击者</div>`,
      '<div class="skill-tooltip-buff-effect-item" style="color: #3498db;">与心灵觉醒效果叠加生效</div>',
      '<div class="skill-tooltip-buff-effect-item" style="color: #9c27b0;">被动技能：无需手动释放</div>'
    ]
    return lines.join('')
  }
}
