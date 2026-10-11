/**
 * 技能数据统一管理 Store
 * 统一管理技能配置、玩家技能和技能冷却
 * 增强版：支持 useUnifiedSkills.js 所需的所有功能
 */
import { defineStore } from 'pinia'
import { storageService } from '@/services/StorageService'

let cooldownTickerId = null

export const useSkillsStore = defineStore('skills', {
  state: () => ({
    // 技能冷却时间（技能ID -> 冷却结束时间戳）
    skillCooldowns: {},

    // 冷却倒计时 tick 计数器：每秒 +1，作为响应式触发器
    // SkillBar 通过依赖此计数器实时计算所有槽位技能（含进阶前职业技能）的冷却秒数
    cooldownTick: 0,

    // 冷却版本号：每次 setSkillCooldown 调用时 +1
    // 作为显式响应式触发器，确保技能栏在任何技能进入冷却时立即重新计算
    cooldownVersion: 0,

    // === 新增：支持 useUnifiedSkills.js 的功能 ===
    // 当前玩家的技能数组（用于技能栏显示）
    currentSkills: [],

    // 技能工具提示状态
    skillTooltip: {
      visible: false,
      skill: null,
      position: { x: 0, y: 0 }
    },

    // 玩家职业
    playerClass: ''
  }),

  getters: {
    // === 新增：支持 useUnifiedSkills.js 的 getters ===
    /**
     * 获取当前技能数组（用于技能栏）
     */
    skills: state => {
      return state.currentSkills
    },

    /**
     * 获取技能工具提示状态
     */
    tooltip: state => {
      return state.skillTooltip
    },

    /**
     * 获取玩家职业
     */
    class: state => {
      return state.playerClass
    },

    /**
     * 检查技能是否可用（不在冷却中）
     * 兼容 useUnifiedSkills.js 的接口
     */
    isSkillAvailable: state => {
      return skillKey => {
        const cooldownEnd = state.skillCooldowns[skillKey]
        if (!cooldownEnd) {
          return true
        }
        return Date.now() >= cooldownEnd
      }
    },

    /**
     * 获取技能冷却剩余时间（毫秒）
     */
    getSkillCooldownRemaining: state => {
      return skillKey => {
        const cooldownEnd = state.skillCooldowns[skillKey]
        if (!cooldownEnd) {
          return 0
        }
        const remaining = cooldownEnd - Date.now()
        return Math.max(0, remaining)
      }
    }
  },

  actions: {
    startCooldownTicker () {
      if (cooldownTickerId) {
        return
      }

      cooldownTickerId = setInterval(() => {
        try {
          // cooldownTick 递增触发所有依赖它的 computed 重新计算
          // 确保 SkillBar 中所有槽位技能（含进阶前职业技能）的冷却倒计时实时更新
          this.cooldownTick++
          if (!this.currentSkills || this.currentSkills.length === 0) {
            return
          }
          this.syncCooldownsToSkills()
        } catch (error) {
          console.error('[SkillsStore] 冷却倒计时更新失败:', error)
        }
      }, 1000)
    },

    stopCooldownTicker () {
      if (!cooldownTickerId) {
        return
      }
      clearInterval(cooldownTickerId)
      cooldownTickerId = null
    },

    /**
     * 从本地存储恢复技能冷却
     */
    hydrateCooldownsFromStorage () {
      try {
        // storageService 已通过 import 导入全局单例
        const savedCooldowns = storageService.getSkillCooldowns()
        if (!savedCooldowns || typeof savedCooldowns !== 'object') {
          return
        }

        const now = Date.now()
        const nowSeconds = Math.floor(now / 1000)
        const nextCooldowns = { ...this.skillCooldowns }
        const validSkillKeys = new Set()
        ;(this.currentSkills || []).forEach(skill => {
          if (skill?.key) validSkillKeys.add(skill.key)
          if (skill?.id) validSkillKeys.add(skill.id)
        })

        Object.entries(savedCooldowns).forEach(([skillKey, rawValue]) => {
          if (validSkillKeys.size > 0 && !validSkillKeys.has(skillKey)) {
            return
          }

          const value = Number(rawValue ?? 0)
          if (!Number.isFinite(value) || value <= 0) {
            return
          }

          let normalizedEnd = 0
          if (value > now - 1000) {
            normalizedEnd = value
          } else if (value > nowSeconds - 1) {
            normalizedEnd = value * 1000
          } else if (value > 1000) {
            normalizedEnd = now + value
          } else {
            normalizedEnd = now + Math.max(0, Math.ceil(value)) * 1000
          }

          if (!Number.isFinite(normalizedEnd) || normalizedEnd <= now) {
            return
          }

          const remainingMs = normalizedEnd - now
          const matchedSkill = (this.currentSkills || []).find(skill => skill?.key === skillKey || skill?.id === skillKey) || null
          const baseCooldownSeconds = Number(matchedSkill?.baseCooldown ?? 0)
          const maxRemainingMs = Number.isFinite(baseCooldownSeconds) && baseCooldownSeconds > 0
            ? Math.max(5000, Math.ceil(baseCooldownSeconds) * 1000 * 10)
            : 6 * 60 * 60 * 1000

          if (remainingMs > maxRemainingMs) {
            return
          }

          nextCooldowns[skillKey] = normalizedEnd
        })

        this.skillCooldowns = nextCooldowns
        this.syncCooldownsToSkills()
        this.persistCooldownsToStorage()
        this.startCooldownTicker()
      } catch (error) {
        console.error('[SkillsStore] 冷却恢复失败:', error)
      }
    },

    persistCooldownsToStorage () {
      try {
        // storageService 已通过 import 导入全局单例
        storageService.saveSkillCooldowns(this.skillCooldowns)
      } catch (error) {
        console.error('[SkillsStore] 冷却保存失败:', error)
      }
    },

    // === 新增：支持 useUnifiedSkills.js 的 actions ===
    /**
     * 初始化技能（从 gameData 加载）
     * 兼容 useUnifiedSkills.js 的 initSkills 方法
     */
    initSkills (player, gameData) {
      if (!player || !player.class) {
        console.warn('[SkillsStore] 玩家或玩家职业为空，清空技能')
        this.currentSkills = []
        return
      }

      if (!gameData || Object.keys(gameData).length === 0) {
        console.warn('[SkillsStore] gameData为空，清空技能')
        this.currentSkills = []
        return
      }

      this.playerClass = player.class

      // 从 skillConfig 获取职业技能配置
      const skillConfig = gameData.skillConfig?.SKILL_CONFIG || gameData.skillConfig
      if (!skillConfig || typeof skillConfig !== 'object') {
        console.warn('[SkillsStore] skillConfig 无效，清空技能')
        this.currentSkills = []
        return
      }

      const classSkills = skillConfig[player.class] || {}
      const classSkillIds = Object.keys(classSkills)
      const skillDetails = gameData.skills || gameData.skillInfo || gameData.skillConfig || {}

      this.finishSkillInitialization(classSkills, classSkillIds, skillDetails, player)
      this.hydrateCooldownsFromStorage()
      this.startCooldownTicker()
    },

    /**
     * 完成技能初始化
     */
    finishSkillInitialization (classSkills, classSkillIds, skillDetails, player) {
      this.currentSkills = classSkillIds.map(skillId => {
        const baseSkill = classSkills[skillId] || skillDetails[skillId] || {}
        const key = skillId
        const playerSkill = player.skills?.[key] || {}
        const baseProficiency =
          baseSkill?.proficiency && typeof baseSkill.proficiency === 'object' ? baseSkill.proficiency : null
        const playerProficiency =
          playerSkill?.proficiency && typeof playerSkill.proficiency === 'object' ? playerSkill.proficiency : null
        const normalizedPlayerProficiencyLevel = Number(
          playerSkill.proficiencyLevel ??
            (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
              ? playerSkill.proficiency.level
              : undefined) ??
            playerSkill.level ??
            1
        )
        const safePlayerProficiencyLevel =
          Number.isFinite(normalizedPlayerProficiencyLevel) && normalizedPlayerProficiencyLevel > 0
            ? normalizedPlayerProficiencyLevel
            : 1
        const normalizedPlayerProficiency = Number(
          playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
            ? playerSkill.proficiency.exp
            : playerSkill.proficiency ?? 0
        )
        const safePlayerProficiency =
          Number.isFinite(normalizedPlayerProficiency) && normalizedPlayerProficiency >= 0
            ? normalizedPlayerProficiency
            : 0
        const normalizedPlayerProficiencyExp = Number(
          playerSkill.proficiencyExp ??
            (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
              ? playerSkill.proficiency.expRequired
              : undefined) ??
            safePlayerProficiencyLevel * 10
        )
        const safePlayerProficiencyExp =
          Number.isFinite(normalizedPlayerProficiencyExp) && normalizedPlayerProficiencyExp > 0
            ? normalizedPlayerProficiencyExp
            : safePlayerProficiencyLevel * 10
        const rawBaseCooldown = Number(baseSkill.cd ?? baseSkill.baseCooldown ?? 0)
        const baseCooldown = rawBaseCooldown > 1000 ? Math.ceil(rawBaseCooldown / 1000) : rawBaseCooldown
        const normalizedProficiencyMaxLevel = Number(
          baseSkill.proficiencyMaxLevel ??
            baseProficiency?.maxLevel ??
            playerSkill.proficiencyMaxLevel ??
            playerProficiency?.maxLevel ??
            10
        )
        const safeProficiencyMaxLevel =
          Number.isFinite(normalizedProficiencyMaxLevel) && normalizedProficiencyMaxLevel > 0
            ? normalizedProficiencyMaxLevel
            : 10
        const resolvedProficiencyEffect =
          baseSkill.proficiencyEffect ||
          baseProficiency?.effect ||
          playerSkill.proficiencyEffect ||
          playerProficiency?.effect ||
          {}
        const resolvedDamageCalculation =
          baseSkill.damageCalculation ||
          baseSkill.calculateDamage ||
          playerSkill.damageCalculation ||
          playerSkill.calculateDamage ||
          null
        const resolvedDotDamageCalculation =
          baseSkill.dotDamageCalculation || baseSkill.calculateDotDamage || playerSkill.dotDamageCalculation || null
        const resolvedHealingCalculation =
          baseSkill.healingCalculation || baseSkill.calculateHealing || baseSkill.calculateHeal || playerSkill.healingCalculation || null

        const baseManaCost = Number(baseSkill.manaCost ?? playerSkill.manaCost ?? 0) || 0
        const manaCostPerLevel = Number(baseSkill.manaCostPerLevel ?? playerSkill.manaCostPerLevel ?? 0) || 0
        const resolvedManaCost =
          baseManaCost + Math.max(0, safePlayerProficiencyLevel - 1) * Math.max(0, manaCostPerLevel)
        
        return {
          id: baseSkill.id || playerSkill.id || null,
          key,
          name: baseSkill.name || playerSkill.name || '未知技能',
          icon: baseSkill.icon || playerSkill.icon || '',
          audio: baseSkill.audio || playerSkill.audio || null,
          cooldown: 0,
          baseCooldown,
          level: safePlayerProficiencyLevel,
          proficiency: safePlayerProficiency,
          description: baseSkill.description || playerSkill.description || '',
          manaCost: resolvedManaCost,
          damage: baseSkill.damage || playerSkill.damage || 0,
          heal: baseSkill.heal || playerSkill.heal || 0,
          type: baseSkill.type || playerSkill.type || 'physical',
          element: baseSkill.element || playerSkill.element || 'none',
          buffDuration: baseSkill.buffDuration || playerSkill.buffDuration || 0,
          duration: baseSkill.duration || playerSkill.duration || 0,
          tickInterval: baseSkill.tickInterval || playerSkill.tickInterval || 0,
          dotDamage: baseSkill.dotDamage || playerSkill.dotDamage || 0,
          dotEffect: baseSkill.dotEffect || playerSkill.dotEffect || null,
          subSkills: baseSkill.subSkills || resolvedProficiencyEffect.subSkills || playerSkill.subSkills || {},
          effect: baseSkill.effect || playerSkill.effect || '',
          proficiencyEffect: resolvedProficiencyEffect,
          proficiencyMaxLevel: safeProficiencyMaxLevel,
          damageCalculation: resolvedDamageCalculation,
          dotDamageCalculation: resolvedDotDamageCalculation,
          healingCalculation: resolvedHealingCalculation,
          unlockLevel: baseSkill.unlockLevel || playerSkill.unlockLevel || 1,
          class: baseSkill.class || playerSkill.class || player.class,
          requirements: baseSkill.requirements || playerSkill.requirements || {},
          unlockCondition: baseSkill.unlockCondition || playerSkill.unlockCondition || null,
          proficiencyLevel: safePlayerProficiencyLevel,
          proficiencyExp: safePlayerProficiencyExp,
          // DEBUFF配置
          debuff: baseSkill.debuff || playerSkill.debuff || null,
          // BUFF配置
          buff: baseSkill.buff || playerSkill.buff || null,
          // 多段连射配置（狂风连射等多箭矢技能使用）
          multiHit: baseSkill.multiHit || playerSkill.multiHit || null,
          // 特殊效果配置（用于技能详情面板显示）
          specialEffect: baseSkill.specialEffect || playerSkill.specialEffect || null,
          // 技能计算方法
          calculateDamage: baseSkill.calculateDamage || playerSkill.calculateDamage || null,
          calculateDebuffChance: baseSkill.calculateDebuffChance || playerSkill.calculateDebuffChance || null,
          calculateDebuffEffect: baseSkill.calculateDebuffEffect || playerSkill.calculateDebuffEffect || null,
          // 多段连射箭矢数量计算方法（狂风连射使用）
          calculateArrowCount: baseSkill.calculateArrowCount || playerSkill.calculateArrowCount || null,
          calculateBuff: baseSkill.calculateBuff || playerSkill.calculateBuff || null,
          calculateBuffDuration: baseSkill.calculateBuffDuration || playerSkill.calculateBuffDuration || null,
          calculateManaCost: baseSkill.calculateManaCost || playerSkill.calculateManaCost || null,
          // 伤害倍率相关方法（如暗杀技能的倍率表）
          getDamageMultiplier: baseSkill.getDamageMultiplier || playerSkill.getDamageMultiplier || null,
          getCriticalTable: baseSkill.getCriticalTable || playerSkill.getCriticalTable || null,
          getCriticalChance: baseSkill.getCriticalChance || playerSkill.getCriticalChance || null,
          // 成长线路（三转技能分组用）
          growthLine: baseSkill.growthLine || playerSkill.growthLine || null,
          // 召唤技能配置（type === 'summon' 时使用）
          summon: baseSkill.summon || playerSkill.summon || null,
          // 召唤技能计算方法
          calculateStatRatio: baseSkill.calculateStatRatio || playerSkill.calculateStatRatio || null,
          calculateDuration: baseSkill.calculateDuration || playerSkill.calculateDuration || null,
          calculateSummonStats: baseSkill.calculateSummonStats || playerSkill.calculateSummonStats || null,
          // 被动技能标记
          isPassive: baseSkill.isPassive === true || playerSkill.isPassive === true
        }
      }) // 不再过滤被动技能，让被动技能显示在技能栏中
    },

    /**
     * 设置技能冷却
     * 兼容 useUnifiedSkills.js 的接口
     * 支持以 skill.id 或 skill.key 作为冷却标识（skill.id 全局唯一，避免跨职业 key 冲突）
     */
    setSkillCooldown (skillKey, cooldownSeconds) {
      const rawCooldownSeconds = Number(cooldownSeconds || 0)
      const normalizedCooldownSeconds =
        rawCooldownSeconds > 1000 ? Math.ceil(rawCooldownSeconds / 1000) : rawCooldownSeconds
      const safeCooldownSeconds = Math.max(0, normalizedCooldownSeconds)
      const cooldownEnd = Date.now() + safeCooldownSeconds * 1000
      this.skillCooldowns[skillKey] = cooldownEnd

      // 递增冷却版本号，触发所有依赖它的 computed 立即重新计算
      // 这确保技能栏（含进阶前职业技能）能立即反映冷却状态变化
      this.cooldownVersion++
      
      // 同时更新 currentSkills 中的冷却显示（按 key 或 id 匹配）
      const skillIndex = this.currentSkills.findIndex(s => s.key === skillKey || s.id === skillKey)
      if (skillIndex !== -1) {
        this.currentSkills[skillIndex].cooldown = safeCooldownSeconds
      }

      this.persistCooldownsToStorage()
      this.startCooldownTicker()
    },

    /**
     * 增加技能熟练度
     */
    increaseSkillProficiency (skillKey, amount = 1) {
      const skill = this.currentSkills.find(s => s.key === skillKey)
      if (skill) {
        const safeAmount = Number(amount || 0)
        if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
          return
        }

        const currentProficiency = Number(skill.proficiency || 0)
        let nextProficiency = Number.isFinite(currentProficiency) ? currentProficiency + safeAmount : safeAmount

        const currentLevel = Number(skill.proficiencyLevel || skill.level || 1)
        let nextLevel = Number.isFinite(currentLevel) && currentLevel > 0 ? currentLevel : 1

        const currentExpRequired = Number(skill.proficiencyExp || nextLevel * 10)
        let nextExpRequired =
          Number.isFinite(currentExpRequired) && currentExpRequired > 0 ? currentExpRequired : nextLevel * 10

        const maxLevel = Number(skill.proficiencyMaxLevel || 10)
        const safeMaxLevel = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 10

        while (nextProficiency >= nextExpRequired && nextLevel < safeMaxLevel) {
          nextProficiency -= nextExpRequired
          nextLevel += 1
          // 新公式：升级所需经验 = 目标等级 × 10
          // 1→2=10, 2→3=20, 3→4=30, 以此类推
          nextExpRequired = nextLevel * 10
        }

        const skillIndex = this.currentSkills.findIndex(s => s.key === skillKey)
        if (skillIndex === -1) {
          return
        }

        // 创建更新后的技能对象
        const updatedSkill = {
          ...this.currentSkills[skillIndex],
          proficiency: nextProficiency,
          proficiencyLevel: nextLevel,
          level: nextLevel,
          proficiencyExp: nextExpRequired
        }
        
        // 使用 splice 触发响应式更新
        this.currentSkills.splice(skillIndex, 1, updatedSkill)
        
        // 同时更新 skillTooltip 中的技能引用（如果正在显示该技能）
        if (this.skillTooltip.skill?.key === skillKey) {
          this.skillTooltip.skill = updatedSkill
        }

        // 持久化技能熟练度到存储
        // 注意：SkillService.increaseSkillProficiency 中已通过 persistPlayerSkillsDebounced
        // 对 player.skills 进行防抖持久化，此处不再重复调用以避免双重 JSON 深拷贝开销
        // this.persistProficiencyToStorage()
      }
    },

    /**
     * 将技能熟练度持久化到存储
     */
    persistProficiencyToStorage () {
      try {
        // storageService 已通过 import 导入全局单例
        const skillsToSave = {}
        this.currentSkills.forEach(skill => {
          if (skill && skill.key) {
            skillsToSave[skill.key] = {
              proficiency: skill.proficiency || 0,
              proficiencyExp: skill.proficiencyExp || 0,
              proficiencyLevel: skill.proficiencyLevel || 1
            }
          }
        })
        storageService.savePlayerSkills(skillsToSave)
      } catch (error) {
        console.error('[SkillsStore] 持久化技能熟练度失败:', error)
      }
    },

    /**
     * 显示技能工具提示
     * 缓存优化：使用 skill.id（全局唯一）而非 skill.key（仅职业内唯一）比对，
     * 避免跨职业技能切换时缓存命中导致 tooltip 显示错误技能数据
     */
    showSkillTooltip (event, skill) {
      if (this.skillTooltip.skill && this.skillTooltip.skill.id === skill.id) {
        this.moveSkillTooltip(event)
        return
      }

      this.skillTooltip.visible = true
      this.skillTooltip.skill = skill
      this.adjustTooltipPosition(event)
    },

    /**
     * 移动技能工具提示
     */
    moveSkillTooltip (event) {
      if (!this.skillTooltip.visible) {
        return
      }
      this.adjustTooltipPosition(event)
    },

    /**
     * 调整工具提示位置
     */
    adjustTooltipPosition (event) {
      let x = event.clientX + 10
      let y = event.clientY + 10

      const tooltipWidth = 300
      const tooltipHeight = 400
      const padding = 10

      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight

      if (x + tooltipWidth > screenWidth) {
        x = event.clientX - tooltipWidth - padding
      }

      if (y + tooltipHeight > screenHeight) {
        y = event.clientY - tooltipHeight - padding
      }

      if (x < 0) {
        x = padding
      }

      if (y < 0) {
        y = padding
      }

      this.skillTooltip.position = { x, y }
    },

    /**
     * 隐藏技能工具提示
     */
    hideSkillTooltip () {
      this.skillTooltip.visible = false
      this.skillTooltip.skill = null
    },

    /**
     * 清空当前技能
     */
    clearCurrentSkills () {
      this.currentSkills = []
      this.stopCooldownTicker()
    },

    /**
     * 同步冷却时间到技能数组
     */
    syncCooldownsToSkills () {
      const now = Date.now()
      this.currentSkills.forEach(skill => {
        // 兼容以 skill.id 或 skill.key 存储的冷却记录
        const cooldownEnd = this.skillCooldowns[skill.key] ?? this.skillCooldowns[skill.id]
        if (!cooldownEnd) {
          skill.cooldown = 0
          return
        }
        const remainingMs = cooldownEnd - now
        skill.cooldown = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
      })
    }
  }
})
