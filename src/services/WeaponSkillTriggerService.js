/**
 * 武器技能触发服务
 * 处理终极武器附加技能的触发逻辑
 * 支持普通攻击、单体技能、AOE技能、DOT伤害触发
 *
 * @file WeaponSkillTriggerService.js
 * @generated 2026-02-27
 */

import { COMMON_SKILLS } from '@/data/skills'

/**
 * 武器技能触发服务类
 * 用于处理终极武器附加的被动技能触发（如水弹）
 */
export class WeaponSkillTriggerService {
  constructor (audioService = null) {
    /** @type {Object|null} 音频服务引用 */
    this.audioService = audioService

    /** @type {Map<string, number>} 触发冷却记录，防止同一怪物短时间内多次触发 */
    this.triggerCooldowns = new Map()

    /** @type {number} 触发冷却时间（毫秒） */
    this.triggerCooldownMs = 500

    /** @type {Map<number, Object>} 技能配置缓存 */
    this.skillConfigCache = new Map()

    /** @type {Set<number>} 已警告过的技能ID集合，避免重复输出警告 */
    this.warnedSkillIds = new Set()
  }

  /**
   * 设置音频服务
   * @param {Object} audioService - 音频服务实例
   */
  setAudioService (audioService) {
    this.audioService = audioService
  }

  /**
   * 从武器属性中提取技能触发配置
   * @param {Object} weapon - 武器对象
   * @returns {Array<Object>} 技能触发配置数组
   */
  extractSkillTriggers (weapon) {
    if (!weapon || !weapon.abilities || !Array.isArray(weapon.abilities)) {
      return []
    }

    const triggers = []

    for (const ability of weapon.abilities) {
      if (ability.parameter === 'skillchance' && ability.skill) {
        // 优先使用 currentAdd（洗练后的值），否则使用 add
        const chance = ability.currentAdd !== undefined ? ability.currentAdd : (ability.add || 0)
        triggers.push({
          skillId: ability.skill,
          skillLevel: ability.skillLevel || 1,
          chance: chance,
          chanceMax: ability.addMax || chance,
          pvp: ability.pvp !== false,
          pve: ability.pve !== false
        })
      }
    }

    return triggers
  }

  /**
   * 获取技能配置
   * @param {number} skillId - 技能ID
   * @returns {Object|null} 技能配置
   */
  getSkillConfig (skillId) {
    // 检查缓存
    if (this.skillConfigCache.has(skillId)) {
      return this.skillConfigCache.get(skillId)
    }

    // 从 COMMON_SKILLS 中查找
    for (const key of Object.keys(COMMON_SKILLS)) {
      const skill = COMMON_SKILLS[key]
      if (skill.id === skillId) {
        this.skillConfigCache.set(skillId, skill)
        return skill
      }
    }

    return null
  }

  /**
   * 检查是否应该触发技能
   * @param {number} chance - 触发概率（百分比）
   * @returns {boolean} 是否触发
   */
  shouldTrigger (chance) {
    if (!Number.isFinite(chance) || chance <= 0) {
      return false
    }
    // 将百分比转换为小数概率
    const probability = chance / 100
    return Math.random() < probability
  }

  /**
   * 使用指定的随机值检查是否应该触发技能（用于调试）
   * @param {number} chance - 触发概率（百分比）
   * @param {number} randomValue - 随机值（0-1）
   * @returns {boolean} 是否触发
   */
  shouldTriggerWithRandom (chance, randomValue) {
    if (!Number.isFinite(chance) || chance <= 0) {
      return false
    }
    const probability = chance / 100
    return randomValue < probability
  }

  /**
   * 检查触发冷却（只检查，不设置）
   * @param {string} monsterId - 怪物ID
   * @param {number} skillId - 技能ID
   * @returns {boolean} 是否可以触发（true表示不在冷却中）
   */
  checkTriggerCooldown (monsterId, skillId) {
    const key = `${monsterId}_${skillId}`
    const now = Date.now()
    const lastTrigger = this.triggerCooldowns.get(key) || 0

    return now - lastTrigger >= this.triggerCooldownMs
  }

  /**
   * 设置触发冷却时间
   * @param {string} monsterId - 怪物ID
   * @param {number} skillId - 技能ID
   */
  setTriggerCooldown (monsterId, skillId) {
    const key = `${monsterId}_${skillId}`
    this.triggerCooldowns.set(key, Date.now())
  }

  /**
   * 清理过期的冷却记录
   */
  cleanupCooldowns () {
    const now = Date.now()
    const expireTime = this.triggerCooldownMs * 10 // 保留10倍冷却时间的记录

    for (const [key, timestamp] of this.triggerCooldowns) {
      if (now - timestamp > expireTime) {
        this.triggerCooldowns.delete(key)
      }
    }
  }

  /**
   * 计算技能伤害
   * @param {Object} skillConfig - 技能配置
   * @param {Object} player - 玩家对象
   * @param {Object} monster - 怪物对象
   * @returns {number} 伤害值
   */
  calculateSkillDamage (skillConfig, player, monster) {
    if (!skillConfig || typeof skillConfig.calculateDamage !== 'function') {
      return 0
    }

    try {
      const damage = skillConfig.calculateDamage(player, 1)

      // 应用怪物防御减免
      const monsterDefense = Number(monster?.defense) || 0
      const finalDamage = Math.max(1, damage - monsterDefense)

      return finalDamage
    } catch (error) {
      console.error('[WeaponSkillTrigger] 计算技能伤害失败:', error)
      return 0
    }
  }

  /**
   * 播放技能音效
   * @param {Object} skillConfig - 技能配置
   */
  playSkillAudio (skillConfig) {
    if (!this.audioService || !skillConfig?.audio) {
      return
    }

    try {
      if (typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX(skillConfig.audio)
      }
    } catch (error) {
      console.error('[WeaponSkillTrigger] 播放音效失败:', error)
    }
  }

  /**
   * 触发武器附加技能
   * @param {Object} options - 触发选项
   * @param {Object} options.player - 玩家对象
   * @param {Object} options.monster - 怪物对象
   * @param {number} options.monsterIndex - 怪物索引
   * @param {Object} options.weapon - 武器对象
   * @param {string} options.triggerType - 触发类型（normalAttack/singleSkill/aoeSkill/dot）
   * @param {Function} options.showDamageNumber - 显示伤害数字回调
   * @returns {Object|null} 触发结果 { skillId, damage, skillName } 或 null
   */
  triggerWeaponSkill (options) {
    const {
      player,
      monster,
      monsterIndex,
      weapon,
      triggerType,
      showDamageNumber
    } = options


    // 检查武器是否为终极品质
    if (!weapon || weapon.rarity !== 'ultimate') {
      return null
    }

    // 提取技能触发配置
    const triggers = this.extractSkillTriggers(weapon)
    if (triggers.length === 0) {
      return null
    }

    // 遍历所有技能触发配置
    for (const trigger of triggers) {
      const { skillId, chance, pvp, pve } = trigger

      // 检查PVE/PVP适用性
      const isPVP = monster?.isPlayer || false
      if (isPVP && !pvp) continue
      if (!isPVP && !pve) continue

      // 检查触发冷却（只检查，不设置）
      const monsterId = monster?.uniqueId || monster?.id || monsterIndex
      if (!this.checkTriggerCooldown(monsterId, skillId)) {
        continue
      }

      // 检查是否触发
      const randomValue = Math.random()
      if (!this.shouldTriggerWithRandom(chance, randomValue)) {
        continue
      }

      // 触发成功，设置冷却时间
      this.setTriggerCooldown(monsterId, skillId)

      // 获取技能配置
      const skillConfig = this.getSkillConfig(skillId)
      if (!skillConfig) {
 // 仅对同一技能ID警告一次，避免控制台刷屏
        if (!this.warnedSkillIds.has(skillId)) {
          this.warnedSkillIds.add(skillId)
          console.warn(`[WeaponSkillTrigger] 未找到技能配置: ${skillId}，请检查COMMON_SKILLS中是否有此技能`)
        }
        continue
      }

      // 计算技能伤害
      const damage = this.calculateSkillDamage(skillConfig, player, monster)
      if (damage <= 0) {
        continue
      }

      // 应用伤害到怪物
      monster.currentHealth = Math.max(0, monster.currentHealth - damage)
      monster.healthPercentage = (monster.currentHealth / (monster.maxHealth || 1)) * 100

      // 播放技能音效
      this.playSkillAudio(skillConfig)

      // 显示伤害数字
      // showDamageNumber 参数：targetIndex, damage, isCritical, isHeal, skill, isMiss, weaponIcon, monsterIcon, isMpHeal, text, elementInfo, itemIcon, doubleJudgment
      if (showDamageNumber && typeof showDamageNumber === 'function') {
        showDamageNumber(
          monsterIndex,           // 怪物索引
          damage,                 // 伤害值
          false,                  // 不是暴击
          false,                  // 不是治疗
          {                       // 技能对象（用于显示技能图标）
            id: skillConfig.id,
            name: skillConfig.name,
            icon: skillConfig.icon
          },
          false,                  // 不是MISS
          null,                   // weaponIcon
          null,                   // monsterIcon
          false,                  // 不是MP恢复
          null,                   // text，不使用自定义文本，显示伤害数字
          {                       // 元素信息
            elementType: skillConfig.element,
            elementAdvantage: null
          },
          skillConfig.icon,       // itemIcon，用于显示技能图标
          false                   // 不是双倍惩戒
        )
      }

      // 定期清理冷却记录
      if (this.triggerCooldowns.size > 100) {
        this.cleanupCooldowns()
      }

      return {
        skillId,
        damage,
        skillName: skillConfig.name,
        skillConfig
      }
    }

    return null
  }

  /**
   * 批量触发武器附加技能（用于AOE技能）
   * @param {Object} options - 触发选项
   * @param {Object} options.player - 玩家对象
   * @param {Array} options.monsters - 怪物数组
   * @param {Object} options.weapon - 武器对象
   * @param {string} options.triggerType - 触发类型
   * @param {Function} options.showDamageNumber - 显示伤害数字回调
   * @param {Function} options.addBattleLog - 添加战斗日志回调
   * @returns {Array<Object>} 触发结果数组
   */
  triggerWeaponSkillBatch (options) {
    const { monsters, player, weapon, triggerType, showDamageNumber, addBattleLog } = options

    if (!weapon || weapon.rarity !== 'ultimate') {
      return []
    }

    const triggers = this.extractSkillTriggers(weapon)
    if (triggers.length === 0) {
      return []
    }

    const results = []

    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i]
      if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
        continue
      }

      const result = this.triggerWeaponSkill({
        player,
        monster,
        monsterIndex: i,
        weapon,
        triggerType,
        showDamageNumber,
        addBattleLog
      })

      if (result) {
        results.push({ index: i, ...result })
      }
    }

    return results
  }

  /**
   * 重置服务状态
   */
  reset () {
    this.triggerCooldowns.clear()
    this.skillConfigCache.clear()
    this.lastLogAt = 0
  }
}

// 导出单例实例
export const weaponSkillTriggerService = new WeaponSkillTriggerService()

export default WeaponSkillTriggerService
