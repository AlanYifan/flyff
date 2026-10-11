import { storageService as storageServiceSingleton } from '@/services/StorageService'
import { useSkillsStore } from '@/store/skills'
import { useGameStore } from '@/store'
import { debounce } from '@/utils/debounce'
import { toRaw } from 'vue'

const isDev = import.meta.env.DEV === true

export class SkillService {
  constructor (storageService = null) {
    this.storageService = storageService || storageServiceSingleton
    this.skills = []
this.persistPlayerSkillsDebounced = debounce(skills => {
try {
this.storageService.savePlayerSkills(skills)
} catch (error) {
console.error('[SkillService] debounced 保存玩家技能失败:', error)
}
}, 5000)
    this.lastProficiencyLogAt = 0
  }

  initialize (skills = []) {
    this.skills = skills
    const skillsStore = useSkillsStore()
    skillsStore.hydrateCooldownsFromStorage()
    skillsStore.startCooldownTicker()
  }

  setSkillCooldown (skillKey, cooldown) {
    const normalized = Math.max(0, Number(cooldown || 0))
    const skillsStore = useSkillsStore()
    skillsStore.setSkillCooldown(skillKey, normalized)
  }

  getSkillCooldown (skillKey) {
    const skillsStore = useSkillsStore()
    const remainingMs = Number(skillsStore.getSkillCooldownRemaining(skillKey) || 0)
    return Math.max(0, Math.ceil(remainingMs / 1000))
  }

  isSkillAvailable (skillKey) {
    const skillsStore = useSkillsStore()
    return Boolean(skillsStore.isSkillAvailable(skillKey))
  }

  useSkill (skillKey, skillData) {
    if (!this.isSkillAvailable(skillKey)) {
      return false
    }

    const cooldown = skillData.cooldown || 0
    this.setSkillCooldown(skillKey, cooldown)

    this.increaseSkillProficiency(skillKey, skillData)

    return true
  }

  /**
   * 增加技能熟练度
   * 业务意图：玩家使用技能后，增加该技能的熟练度经验，达到阈值时自动升级
   *
   * 键名映射说明：
   * - skillKey 参数通常是 skill.id（如 'ranger_w'、'archer_w'），用作冷却标识
   * - player.skills 以 slot key（Q/W/E/R/T/Y）为属性名存储技能数据
   * - skillData.key 是 slot key，skillData.id 是技能全局唯一 ID
   *
   * 跨职业技能处理：
   * 当玩家进阶后（如 archer → ranger），player.skills 被重新初始化为新职业技能数据。
   * 旧职业技能（如 archer_w）仍可从技能栏使用，但其熟练度数据已不存在于 player.skills 中。
   * 此时以 skillId 为键在 player.skills 中创建跨职业技能条目，正常更新并持久化熟练度数据。
   *
   * @param {string} skillKey - 技能标识（通常是 skill.id）
   * @param {Object|null} skillData - 技能数据对象，包含 key/id/player 等字段
   * @returns {void}
   */
  increaseSkillProficiency (skillKey, skillData = null) {
    try {
      const player = skillData?.player
      const gameStore = useGameStore()
      const skillsStore = useSkillsStore()

      // skillKey 通常是 skill.id（如 'ranger_w'），用作冷却和全局标识
      // skillData.key 是 slot key（如 'W'），用于 player.skills 的属性名查找
      // skillData.id 是技能全局唯一 ID
      const skillSlotKey = skillData?.key || null
      const skillId = skillKey

      // --- 1. 解析 storeKey：在 currentSkills 中查找技能（仅当前职业） ---
      const storeList = Array.isArray(skillsStore?.skills) ? skillsStore.skills : []
      const storeSkillEntry = storeList.find(entry => {
        if (!entry) return false
        // 优先通过 id 匹配（全局唯一），回退到 key 匹配
        if (entry.id !== undefined && entry.id !== null) {
          return String(entry.id) === String(skillId)
        }
        return entry.key === skillSlotKey
      })
      const resolvedStoreKey = storeSkillEntry?.key || null

      // --- 2. 解析 playerKey：在 player.skills 中查找技能 ---
      // player.skills 以 slot key（Q/W/E/R/T/Y）为属性名，每个条目含 id 字段
      const playerSkillsMap = player?.skills
      const fallbackSkillsMap = gameStore?.player?.skills

      let resolvedPlayerKey = null
      let resolvedPlayerRef = null

      // 优先使用 skillSlotKey 查找，并验证 id 匹配（避免误更新同槽位的不同职业技能）
      if (skillSlotKey) {
        if (playerSkillsMap && typeof playerSkillsMap === 'object') {
          const entry = playerSkillsMap[skillSlotKey]
          if (entry && typeof entry === 'object' && String(entry.id) === String(skillId)) {
            resolvedPlayerKey = skillSlotKey
            resolvedPlayerRef = player
          }
        }
        if (!resolvedPlayerKey && fallbackSkillsMap && typeof fallbackSkillsMap === 'object') {
          const entry = fallbackSkillsMap[skillSlotKey]
          if (entry && typeof entry === 'object' && String(entry.id) === String(skillId)) {
            resolvedPlayerKey = skillSlotKey
            resolvedPlayerRef = gameStore.player
          }
        }
      }

      // 回退：遍历 player.skills 条目，通过 id 匹配查找
      if (!resolvedPlayerKey) {
        const searchMap = playerSkillsMap || fallbackSkillsMap
        if (searchMap && typeof searchMap === 'object') {
          const match = Object.entries(searchMap).find(([, entry]) => {
            if (!entry || typeof entry !== 'object') return false
            return entry.id !== undefined && String(entry.id) === String(skillId)
          })
          if (match) {
            resolvedPlayerKey = match[0]
            resolvedPlayerRef = (playerSkillsMap === searchMap) ? player : gameStore.player
          }
        }
      }

      // 跨职业技能处理：进阶后旧职业技能数据不在 player.skills 的 slot key 中
      // 以 skillId 为键创建/更新跨职业技能熟练度条目，确保数据正确持久化
      if (!resolvedPlayerKey || !resolvedPlayerRef) {
        const crossClassTarget = player || gameStore?.player
        if (!crossClassTarget || !crossClassTarget.skills || typeof crossClassTarget.skills !== 'object') {
          return
        }

        // 以 skillId 为键查找或创建跨职业技能条目
        const crossClassEntry = crossClassTarget.skills[skillId]
        if (crossClassEntry && typeof crossClassEntry === 'object') {
          // 已有跨职业技能条目，直接使用
          resolvedPlayerKey = skillId
          resolvedPlayerRef = crossClassTarget
        } else {
          // 首次使用跨职业技能，从 skillData 创建条目
          const crossClassMaxLevel = Number(skillData?.proficiencyMaxLevel ?? 10)
          const safeCrossMaxLevel = Number.isFinite(crossClassMaxLevel) && crossClassMaxLevel > 0
            ? crossClassMaxLevel
            : 10
          crossClassTarget.skills[skillId] = {
            id: skillId,
            key: skillSlotKey,
            name: skillData?.name || skillId,
            proficiencyLevel: 1,
            proficiency: 0,
            proficiencyExp: 10,
            proficiencyMaxLevel: safeCrossMaxLevel
          }
          resolvedPlayerKey = skillId
          resolvedPlayerRef = crossClassTarget

          if (isDev) {
            console.debug('[SkillService] increaseSkillProficiency: 创建跨职业技能熟练度条目', {
              skillId,
              skillSlotKey,
              playerClass: crossClassTarget.class ?? null
            })
          }
        }
      }

      const amount = Number(skillData?.proficiencyGain ?? 1)
      if (!Number.isFinite(amount) || amount <= 0) {
        return
      }

      // --- 3. 更新 skillsStore.currentSkills（仅当技能在当前职业列表中时） ---
      if (resolvedStoreKey && typeof skillsStore?.increaseSkillProficiency === 'function') {
        skillsStore.increaseSkillProficiency(resolvedStoreKey, amount)
      }

      // --- 4. 更新 player.skills 中的熟练度数据 ---
      const playerSkill = resolvedPlayerRef.skills?.[resolvedPlayerKey]
      if (!playerSkill) {
        return
      }

      const normalizedPlayerSkillLevel = Number(
        playerSkill.proficiencyLevel ??
          (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
            ? playerSkill.proficiency.level
            : undefined) ??
          playerSkill.level ??
          1
      )
      const safeCurrentLevel =
        Number.isFinite(normalizedPlayerSkillLevel) && normalizedPlayerSkillLevel > 0
          ? normalizedPlayerSkillLevel
          : 1

      const maxLevel = Number(
        playerSkill.proficiencyMaxLevel ?? skillData?.proficiencyMaxLevel ?? 10
      )
      const safeMaxLevel = Number.isFinite(maxLevel) && maxLevel > 0 ? maxLevel : 10

      const currentProficiency = Number(
        playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
          ? playerSkill.proficiency.exp
          : playerSkill.proficiency ?? 0
      )
      const safeCurrentProficiency = Number.isFinite(currentProficiency) ? currentProficiency : 0

      const currentExpRequired = Number(
        playerSkill.proficiencyExp ??
          (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
            ? playerSkill.proficiency.expRequired
            : undefined) ??
          1000
      )
      const safeExpRequired = Number.isFinite(currentExpRequired) && currentExpRequired > 0
        ? currentExpRequired
        : 1000

      let nextLevel = safeCurrentLevel
      let nextProficiency = safeCurrentProficiency + amount
      let nextExpRequired = safeExpRequired

      while (nextProficiency >= nextExpRequired && nextLevel < safeMaxLevel) {
        nextProficiency -= nextExpRequired
        nextLevel += 1
        // 新公式：升级所需经验 = 目标等级 × 10
        // 1→2=10, 2→3=20, 3→4=30, 以此类推
        nextExpRequired = nextLevel * 10
      }

      // 使用 toRaw 获取原始对象，直接修改以绕过 Vue 响应式 Proxy 的 set 拦截器开销
      // UI 已通过 skillsStore.increaseSkillProficiency 更新 currentSkills 数组，此处仅同步 player.skills 数据
      const rawPlayerSkill = toRaw(playerSkill)
      rawPlayerSkill.proficiencyLevel = nextLevel
      rawPlayerSkill.level = nextLevel
      rawPlayerSkill.proficiency = nextProficiency
      rawPlayerSkill.proficiencyExp = nextExpRequired

      // 跨职业技能（resolvedStoreKey 为 null 时）不会通过 skillsStore.increaseSkillProficiency 更新 UI
      // toRaw 修改绕过了 Vue 响应式，SkillBar 的 skillMap computed 无法感知变化
      // 因此对跨职业技能需要通过 proxy 赋值触发响应式更新
      if (!resolvedStoreKey) {
        playerSkill.proficiencyLevel = nextLevel
        playerSkill.level = nextLevel
        playerSkill.proficiency = nextProficiency
        playerSkill.proficiencyExp = nextExpRequired
      }

      // 持久化 player.skills 到存储
      this.persistPlayerSkillsDebounced(resolvedPlayerRef.skills)

      if (isDev) {
        const now = Date.now()
        if (this.lastProficiencyLogAt === 0 || now - this.lastProficiencyLogAt >= 2000) {
          this.lastProficiencyLogAt = now
        }
      }
    } catch (error) {
      console.error('[SkillService] increaseSkillProficiency 失败:', error)
    }
  }

  getAllSkillCooldowns () {
    const skillsStore = useSkillsStore()
    return { ...(skillsStore.skillCooldowns || {}) }
  }

  cleanup () {
    this.skills = []
    try {
      this.persistPlayerSkillsDebounced?.flush?.()
      this.persistPlayerSkillsDebounced?.cancel?.()
    } catch (error) {
      console.error('[SkillService] cleanup flush 失败:', error)
    }
  }

  getSkillData (skillKey) {
    return this.skills.find(skill => skill.key === skillKey) || null
  }

  updateSkills (skills) {
    this.skills = skills
  }

  syncSkillCooldownsToUI (skills) {
    if (!Array.isArray(skills) || skills.length === 0) {
      return
    }
    const skillsStore = useSkillsStore()
    skillsStore.syncCooldownsToSkills()
  }
}
