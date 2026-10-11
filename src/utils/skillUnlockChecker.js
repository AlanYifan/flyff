/**
 * 技能解锁检查器
 */
import { classAliases } from './itemHelpers'

export class SkillUnlockChecker {
  static normalizeClassName (value) {
    if (value === null || value === undefined) {
      return ''
    }
    return String(value).trim().toLowerCase()
  }
  /**
   * 检查玩家类是否匹配要求的类
   * @param {string|string[]} requiredClass - 要求的类名或类名数组
   * @param {string} playerClass - 玩家当前类名
   * @returns {boolean} 是否匹配
   */
  static isClassMatched (requiredClass, playerClass) {
    const normalizedPlayerClass = this.normalizeClassName(playerClass)
    if (!normalizedPlayerClass) {
      return true
    }

    if (!requiredClass) {
      return true
    }

    if (Array.isArray(requiredClass)) {
      return requiredClass.some(entry => this.isClassMatched(entry, normalizedPlayerClass))
    }

    const normalizedRequiredClass = this.normalizeClassName(requiredClass)
    if (!normalizedRequiredClass) {
      return true
    }

    // 使用统一的职业别名映射表
    const requiredAliases = classAliases[normalizedRequiredClass] || [normalizedRequiredClass]
    const playerAliases = classAliases[normalizedPlayerClass] || [normalizedPlayerClass]
    if (requiredAliases.some(alias => playerAliases.includes(alias))) {
      return true
    }

    if (normalizedRequiredClass === normalizedPlayerClass) {
      return true
    }

    if (
      normalizedRequiredClass.includes(normalizedPlayerClass) ||
      normalizedPlayerClass.includes(normalizedRequiredClass)
    ) {
      return true
    }

    return false
  }
  /**
   * 检查技能是否解锁
   * @param {Skill} skill - 要检查的技能
   * @param {Player} player - 玩家对象
   * @param {GameData} [gameData=null] - 游戏数据对象（可选）
   * @returns {boolean} 是否解锁
   */
  static checkSkillUnlockStatus (skill, player, gameData = null) {
    if (!player || !player.class || !player.level) {
      return true
    }

    const checks = [
      () => this.checkLevelRequirement(skill, player),
      () => this.checkUnlockCondition(skill, player),
      () => this.checkGameDataUnlock(skill, player, gameData)
    ]

    return checks.every(check => check())
  }
  /**
   * 检查技能等级要求
   * @param {Skill} skill - 要检查的技能
   * @param {Player} player - 玩家对象
   * @returns {boolean} 是否符合等级要求
   */
  static checkLevelRequirement (skill, player) {
    if (skill.unlockLevel && player.level < skill.unlockLevel) {
      return false
    }

    return true
  }
  static checkUnlockCondition (skill, player) {
    if (!skill.unlockCondition || typeof skill.unlockCondition !== 'function') {
      return true
    }

    try {
      return skill.unlockCondition(player)
    } catch (error) {
      console.error(`检查技能 ${skill.name} 解锁条件时出错:`, error)
      return false
    }
  }

  static checkGameDataUnlock (skill, player, gameData) {
    if (!gameData || !gameData.classConfig || !player.class) {
      return true
    }

    const classConfig = gameData.classConfig?.CLASS_CONFIG || gameData.classConfig
    const classSkill = classConfig?.[player.class]?.skills?.[skill.key]
    if (!classSkill) {
      return true
    }

    const isLevelUnlocked = player.level >= (classSkill.unlockLevel || 1)
    let conditionMet = true
    if (classSkill.unlockCondition) {
      try {
        conditionMet = classSkill.unlockCondition(player)
      } catch (error) {
        console.error(`检查技能 ${skill?.name || skill?.key || ''} 解锁条件时出错:`, error)
        conditionMet = true
      }
    }

    return isLevelUnlocked && conditionMet
  }

  static getUnlockReason (skill, player, gameData = null) {
    if (!player || !player.class || !player.level) {
      return ''
    }

    if (skill.unlockLevel && player.level < skill.unlockLevel) {
      return `需要等级 ${skill.unlockLevel}`
    }

    if (skill.unlockCondition && typeof skill.unlockCondition === 'function') {
      try {
        if (!skill.unlockCondition(player)) {
          return '需要满足特定条件'
        }
      } catch (error) {
        console.error(`检查技能 ${skill.name} 解锁条件时出错:`, error)
      }
    }

    if (gameData && gameData.classConfig && player.class) {
      const classConfig = gameData.classConfig?.CLASS_CONFIG || gameData.classConfig
      const classSkill = classConfig?.[player.class]?.skills?.[skill.key]
      if (classSkill) {
        if (player.level < (classSkill.unlockLevel || 1)) {
          return `需要等级 ${classSkill.unlockLevel || 1}`
        }

        if (classSkill.unlockCondition) {
          try {
            if (!classSkill.unlockCondition(player)) {
              return '需要满足特定条件'
            }
          } catch (error) {
            console.error(`检查技能 ${skill?.name || skill?.key || ''} 解锁条件时出错:`, error)
            return ''
          }
        }
      }
    }

    return ''
  }

  static canLearnSkill (skill, player, gameData = null) {
    if (!this.checkSkillUnlockStatus(skill, player, gameData)) {
      return { canLearn: false, reason: this.getUnlockReason(skill, player, gameData) }
    }

    const alreadyLearned = player.skills?.[skill.key]
    if (alreadyLearned && (alreadyLearned.proficiencyLevel || alreadyLearned.level) > 0) {
      return { canLearn: false, reason: '已学习该技能' }
    }

    return { canLearn: true, reason: '' }
  }

  static getSkillProgress (skill, player) {
    if (!skill.unlockLevel) {
      return { progress: 100, remaining: 0 }
    }

    const currentLevel = player.level || 0
    const requiredLevel = skill.unlockLevel

    if (currentLevel >= requiredLevel) {
      return { progress: 100, remaining: 0 }
    }

    const remaining = requiredLevel - currentLevel
    const progress = (currentLevel / requiredLevel) * 100

    return { progress: Math.floor(progress), remaining }
  }
}
