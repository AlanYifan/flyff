/**
 * 统一的技能工具类
 * 提供技能相关的通用功能，消除代码重复
 */

import { ELEMENT_TYPE_MAP, SKILL_TYPE_MAP } from './skillConstants'
import { classAliases } from './itemHelpers'

export class SkillUtils {
  // 使用统一的职业别名映射表（通过 classAliases 访问）
  static getJobAliases (jobKey) {
    return classAliases[jobKey?.toLowerCase()] || [jobKey]
  }

  static SKILL_TYPE_WEIGHTS = {
    damage: 10,
    manaCost: -2,
    cooldown: -1,
    level: 5
  }

  static getSkillPriority (skill) {
    if (!skill) {
      return 0
    }

    let priority = 0

    if (skill.damage) {
      priority += skill.damage * this.SKILL_TYPE_WEIGHTS.damage
    }

    if (skill.manaCost) {
      priority += skill.manaCost * this.SKILL_TYPE_WEIGHTS.manaCost
    }

    if (skill.cooldown) {
      priority += skill.cooldown * this.SKILL_TYPE_WEIGHTS.cooldown
    }

    if (skill.level) {
      priority += skill.level * this.SKILL_TYPE_WEIGHTS.level
    }

    return priority
  }

  static checkJobRequirement (requiredJob, playerJob) {
    if (!requiredJob || !playerJob) {
      return true
    }

    const allowedJobs = this.getJobAliases(requiredJob.toLowerCase())
    return allowedJobs.some(job => playerJob.toLowerCase().includes(job.toLowerCase()))
  }

  static isSkillAvailable (skill, player) {
    if (!skill || !player) {
      return false
    }

    if (skill.isLocked) {
      return false
    }

    if (skill.currentCooldown > 0) {
      return false
    }

    // 检查MP是否足够
    // manaCost = -1 表示消耗全部MP，只需检查是否有MP
    // manaCost = -2 表示消耗生命值而非MP
    if (skill.manaCost === -1) {
      if (player.currentMana <= 0) {
        return false
      }
    } else if (skill.manaCost > 0 && skill.manaCost > player.currentMana) {
      return false
    }

    if (skill.unlockLevel && player.level < skill.unlockLevel) {
      return false
    }

    return true
  }

  static isHealSkill (skill) {
    if (!skill) {
      return false
    }

    return skill.type === 'heal' || skill.category === 'heal'
  }

  static isAttackSkill (skill) {
    if (!skill) {
      return false
    }

    return skill.type === 'attack' || skill.category === 'attack'
  }

  static findBestSkill (skills, player, config) {
    if (!skills || skills.length === 0) {
      return null
    }

    const availableSkills = skills.filter(skill => this.isSkillAvailable(skill, player))

    if (availableSkills.length === 0) {
      return null
    }

    const healthThreshold = config?.healthThreshold || 0.3
    const currentHealthPercent = player.currentHealth / player.maxHealth

    if (currentHealthPercent < healthThreshold) {
      return this.findHealSkill(availableSkills)
    }

    return this.findAttackSkill(availableSkills)
  }

  static findHealSkill (skills) {
    return skills.find(skill => this.isHealSkill(skill)) || null
  }

  static findAttackSkill (skills) {
    const attackSkills = skills.filter(skill => this.isAttackSkill(skill))

    if (attackSkills.length === 0) {
      return null
    }

    return attackSkills.reduce((best, current) => {
      const bestPriority = this.getSkillPriority(best)
      const currentPriority = this.getSkillPriority(current)
      return currentPriority > bestPriority ? current : best
    })
  }

  static sortSkillsByPriority (skills) {
    return [...skills].sort((a, b) => {
      const priorityA = this.getSkillPriority(a)
      const priorityB = this.getSkillPriority(b)
      return priorityB - priorityA
    })
  }

  static getSkillManaCost (skill, player) {
    if (!skill) {
      return 0
    }

    const baseManaCost = skill.manaCost || 0
    const manaReduction = player?.manaReduction || 0

    return Math.max(0, baseManaCost - manaReduction)
  }

  static canAffordSkill (skill, player) {
    if (!skill || !player) {
      return false
    }

    const manaCost = this.getSkillManaCost(skill, player)
    return player.currentMana >= manaCost
  }

  static getSkillCooldownRemaining (skill) {
    if (!skill) {
      return 0
    }

    return skill.currentCooldown || 0
  }

  static isSkillOnCooldown (skill) {
    return this.getSkillCooldownRemaining(skill) > 0
  }

  static getSkillCooldownPercent (skill) {
    if (!skill || !skill.cooldown) {
      return 0
    }

    const remaining = this.getSkillCooldownRemaining(skill)
    return Math.min(100, Math.max(0, (remaining / skill.cooldown) * 100))
  }

  static getJobMapping () {
    return { ...classAliases }
  }

  static getSkillTypeWeights () {
    return { ...this.SKILL_TYPE_WEIGHTS }
  }

  static calculateElementAdvantage (skillElement, targetElement) {
    if (!skillElement || !targetElement || skillElement === 'none' || targetElement === 'none') {
      return 1.0
    }
    const normalizedSkill = String(skillElement).toLowerCase() === 'thunder'
      ? 'electricity'
      : String(skillElement).toLowerCase()
    const normalizedTarget = String(targetElement).toLowerCase() === 'thunder'
      ? 'electricity'
      : String(targetElement).toLowerCase()

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

    return 1.0
  }
}

export function calculateElementAdvantage (skillElement, targetElement) {
  return SkillUtils.calculateElementAdvantage(skillElement, targetElement)
}

export function normalizeIconPath (iconPath) {
  if (!iconPath) {
    return ''
  }

  if (iconPath.startsWith('/pt/') || iconPath.startsWith('/')) {
    return iconPath
  }

  return `/pt/${iconPath}`
}

export function calculateProficiencyBonus (skill) {
  if (!skill) {
    return 0
  }

  const effect = skill.proficiencyEffect || skill.proficiency?.effect
  if (!effect || typeof effect !== 'object') {
    return 0
  }

  const { base, increment } = effect
  const level = skill.level || 1

  const safeBase = Number(base)
  const safeIncrement = Number(increment)
  if (!Number.isFinite(safeBase) || !Number.isFinite(safeIncrement)) {
    return 0
  }

  const safeLevel = Number.isFinite(Number(level)) && Number(level) > 0 ? Number(level) : 1
  const baseDamage = Number(skill.damage ?? NaN)
  if (Number.isFinite(baseDamage) && baseDamage === safeBase) {
    return safeIncrement * Math.max(0, safeLevel - 1)
  }

  return safeBase + safeIncrement * Math.max(0, safeLevel - 1)
}

export function calculateDotProficiencyBonus (skill) {
  if (!skill) {
    return 0
  }

  const effect = skill.proficiencyEffect || skill.proficiency?.effect
  if (!effect || typeof effect !== 'object') {
    return 0
  }

  const { dotBase, dotIncrement } = effect
  const level = skill.level || 1

  const safeBase = Number(dotBase)
  const safeIncrement = Number(dotIncrement)
  if (!Number.isFinite(safeBase) || !Number.isFinite(safeIncrement)) {
    return 0
  }

  const safeLevel = Number.isFinite(Number(level)) && Number(level) > 0 ? Number(level) : 1
  const baseDotDamage = Number(skill.dotDamage ?? NaN)
  if (Number.isFinite(baseDotDamage) && baseDotDamage === safeBase) {
    return safeIncrement * Math.max(0, safeLevel - 1)
  }

  return safeBase + safeIncrement * Math.max(0, safeLevel - 1)
}

export function calculateHealProficiencyBonus (skill) {
  if (!skill) {
    return 0
  }

  const effect = skill.proficiencyEffect || skill.proficiency?.effect
  if (!effect || typeof effect !== 'object') {
    return 0
  }

  const { base, increment } = effect
  const level = skill.level || 1

  const safeBase = Number(base)
  const safeIncrement = Number(increment)
  if (!Number.isFinite(safeBase) || !Number.isFinite(safeIncrement)) {
    return 0
  }

  const safeLevel = Number.isFinite(Number(level)) && Number(level) > 0 ? Number(level) : 1
  const baseHeal = Number(skill.heal ?? skill.damage ?? NaN)
  if (Number.isFinite(baseHeal) && baseHeal === safeBase) {
    return safeIncrement * Math.max(0, safeLevel - 1)
  }

  return safeBase + safeIncrement * Math.max(0, safeLevel - 1)
}

export function getSubSkillText (subKey, subSkill, skillLevel) {
  if (!subSkill) {
    return ''
  }

  const { name, description, type, base, increment, max, rate } = subSkill
  const value = base + increment * (skillLevel - 1)
  const finalValue = max ? Math.min(value, max) : value

  let unit = ''
  if (rate === true) {
    unit = '%'
  } else if (rate === false) {
    unit = ''
  } else if (type && type.includes('Percentage')) {
    unit = '%'
  }

  const desc = description ? `${description} ` : ''
  const displayValue = Number.isInteger(finalValue) ? finalValue : finalValue.toFixed(1)

  return `${name}: ${desc}+${displayValue}${unit}`
}

export function formatBuffDuration (duration) {
  if (!duration || duration <= 0) {
    return '0秒'
  }

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  const parts = []

  if (hours > 0) {
    parts.push(`${hours}小时`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}分`)
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}秒`)
  }

  return parts.join('')
}

export function getElementText (element) {
  return ELEMENT_TYPE_MAP[element] || '无'
}

export function getSkillTypeText (type) {
  return SKILL_TYPE_MAP[type] || '未知'
}

export default SkillUtils
