/**
 * @file useMasteryProficiency.js
 * @description 武器精通类技能熟练度计数组合式函数
 *
 * 业务意图：
 * - 武器精通类被动技能（如武器精通-弓箭 P技能、武器精通-拳套 I技能、龙之劲 J技能、武器精通-飞轮 I技能、影之怨 J技能、武器精通-魔棒 I技能、圣光积累 J技能、武器精通-副手武器 I技能、风之积累 J技能、重甲精通 I技能、裁决积累 J技能、奥术精通 I技能、奥术充能 J技能）的熟练度通过普通攻击命中累计增长
 * - 每次普通攻击命中后累计计数，达到配置的阈值（如10次）后增加1点熟练度
 * - 达到最大熟练度等级后停止计数，不再增加
 * - 支持后续扩展其他类似的"普通攻击增长熟练度"技能
 *
 * 计数器存储方式：
 * - 使用模块级 Map 按 skillKey 维护攻击计数器，避免响应式开销
 * - 计数器仅在内存中，不持久化（重载后从0开始计数，不影响已保存的熟练度等级）
 *
 * 创建时间：2026-07-19
 */

import { getSkill } from '@/data/skills'
import { useSkillsStore } from '@/store/skills'
import { isBowWeapon, isKnuckleWeapon, isYoYoWeapon, isStaffWeapon, getMainHandWeapon } from '@/composables/useWeaponMastery'
import { getOffhandWeapon } from '@/composables/useDualWield'
import { toRaw } from 'vue'
import { storageService } from '@/services/StorageService'
import { debounce } from '@/utils/debounce'

/**
 * 模块级攻击计数器 Map
 * key: skillKey (如 'P'), value: 当前累计普通攻击命中次数
 * @type {Map<string, number>}
 */
const attackCounters = new Map()

/**
 * 防抖持久化 player.skills 到存储
 * 避免频繁攻击时每次都写 localStorage
 */
const persistPlayerSkillsDebounced = debounce(skills => {
  try {
    storageService.savePlayerSkills(skills)
  } catch (error) {
    console.error('[MasteryProficiency] 防抖保存玩家技能失败:', error)
  }
}, 1000)

/**
 * 获取指定技能的当前攻击计数
 * @param {string} skillKey - 技能键（如 'P'）
 * @returns {number} 当前累计攻击次数
 */
export function getMasteryAttackCount (skillKey) {
  return attackCounters.get(skillKey) || 0
}

/**
 * 获取指定技能的攻击计数阈值（达到多少次攻击增加1点熟练度）
 * @param {string} className - 职业名称
 * @param {string} skillKey - 技能键
 * @returns {number} 攻击次数阈值，未配置时返回 0
 */
export function getMasteryAttacksPerGain (className, skillKey) {
  const staticSkill = getSkill(className, skillKey)
  if (!staticSkill) return 0
  const config = staticSkill.proficiencyGainOnAttack
  if (!config || !config.enabled) return 0
  const threshold = Number(config.attacksPerGain)
  return Number.isFinite(threshold) && threshold > 0 ? threshold : 0
}

/**
 * 检查技能是否已达到最大熟练度等级
 * @param {Object} playerSkill - 玩家技能数据对象
 * @param {Object} staticSkill - 静态技能配置对象
 * @returns {boolean} 是否已达最大熟练度
 */
function isMaxProficiency (playerSkill, staticSkill) {
  if (!playerSkill || !staticSkill) return true
  const currentLevel = Number(
    playerSkill.proficiencyLevel ??
    playerSkill.level ?? 1
  )
  const maxLevel = Number(
    staticSkill.proficiency?.maxLevel ??
    playerSkill.proficiencyMaxLevel ?? 10
  )
  return currentLevel >= maxLevel
}

/**
 * 收集所有配置了 proficiencyGainOnAttack 的技能
 * 目前支持爆裂射手(fierce_shooter)的武器精通-弓箭(P)和格斗宗师(combat_master)的武器精通-拳套(I)及龙之劲(J)，以及暗夜主宰(joker_emperor)的武器精通-飞轮(I)及影之怨(J)，以及炽天使(nature_messenger)的武器精通-魔棒(I)及圣光积累(J)，以及风暴行者(storm_walker)的武器精通-副手武器(I)及风之积累(J)，以及圣殿骑士(holy_knight)的重甲精通(I)及裁决积累(J)，以及奥术师(arcane_master)的奥术精通(I)及奥术充能(J)，以及心灵师(mind_master)的星念凝徽(I)及碎思归墟(J)
 * 后续可通过遍历 SKILL_CONFIG 扩展
 * @param {Object} player - 玩家对象
 * @returns {Array<{skillKey: string, className: string, staticSkill: Object}>} 需要计数的技能列表
 */
function collectMasterySkills (player) {
  const result = []
  if (!player || !player.class) return result

  // 爆裂射手：武器精通-弓箭(P)
  if (player.class === 'fierce_shooter') {
    const staticSkill = getSkill('fierce_shooter', 'P')
    if (staticSkill?.proficiencyGainOnAttack?.enabled) {
      // 武器精通-弓箭仅对弓箭生效，检查装备
      const weapon = getMainHandWeapon(player)
      if (isBowWeapon(weapon)) {
        result.push({ skillKey: 'P', className: 'fierce_shooter', staticSkill })
      }
    }
  }

  // 格斗宗师：武器精通-拳套(I)
  if (player.class === 'combat_master') {
    const knuckleSkill = getSkill('combat_master', 'I')
    if (knuckleSkill?.proficiencyGainOnAttack?.enabled) {
      // 武器精通-拳套仅对拳套生效，检查装备
      const weapon = getMainHandWeapon(player)
      if (isKnuckleWeapon(weapon)) {
        result.push({ skillKey: 'I', className: 'combat_master', staticSkill: knuckleSkill })
      }
    }

    // 格斗宗师：龙之劲(J) - 无武器类型限制，只要技能已配置即可
    const dragonForceSkill = getSkill('combat_master', 'J')
    if (dragonForceSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'combat_master', staticSkill: dragonForceSkill })
    }
  }

  // 暗夜主宰：武器精通-飞轮(I)和影之怨(J)
  if (player.class === 'joker_emperor') {
    // 武器精通-飞轮(I) - 仅对飞轮武器生效
    const yoyoSkill = getSkill('joker_emperor', 'I')
    if (yoyoSkill?.proficiencyGainOnAttack?.enabled) {
      const weapon = getMainHandWeapon(player)
      if (isYoYoWeapon(weapon)) {
        result.push({ skillKey: 'I', className: 'joker_emperor', staticSkill: yoyoSkill })
      }
    }

    // 影之怨(J) - 无武器类型限制，只要技能已配置即可
    const shadowGrudgeSkill = getSkill('joker_emperor', 'J')
    if (shadowGrudgeSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'joker_emperor', staticSkill: shadowGrudgeSkill })
    }
  }

  // 炽天使：武器精通-魔棒(I)和圣光积累(J)
  if (player.class === 'nature_messenger') {
    // 武器精通-魔棒(I) - 仅对魔棒类武器生效
    const staffSkill = getSkill('nature_messenger', 'I')
    if (staffSkill?.proficiencyGainOnAttack?.enabled) {
      const weapon = getMainHandWeapon(player)
      if (isStaffWeapon(weapon)) {
        result.push({ skillKey: 'I', className: 'nature_messenger', staticSkill: staffSkill })
      }
    }

    // 圣光积累(J) - 无武器类型限制，只要技能已配置即可
    const holyAccumulationSkill = getSkill('nature_messenger', 'J')
    if (holyAccumulationSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'nature_messenger', staticSkill: holyAccumulationSkill })
    }
  }

  // 风暴行者：武器精通-副手武器(I)和风之积累(J)
  if (player.class === 'storm_walker') {
    // 武器精通-副手武器(I) - 仅当副手装备的是武器而非盾牌时生效
    const offhandSkill = getSkill('storm_walker', 'I')
    if (offhandSkill?.proficiencyGainOnAttack?.enabled) {
      const offhandWeapon = getOffhandWeapon(player)
      if (offhandWeapon) {
        result.push({ skillKey: 'I', className: 'storm_walker', staticSkill: offhandSkill })
      }
    }

    // 风之积累(J) - 无武器类型限制，只要技能已配置即可
    const windAccumulationSkill = getSkill('storm_walker', 'J')
    if (windAccumulationSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'storm_walker', staticSkill: windAccumulationSkill })
    }
  }

  // 圣殿骑士：重甲精通(I)和裁决积累(J)
  if (player.class === 'holy_knight') {
    // 重甲精通(I) - 无武器类型限制，只要技能已配置即可
    const heavyArmorSkill = getSkill('holy_knight', 'I')
    if (heavyArmorSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'I', className: 'holy_knight', staticSkill: heavyArmorSkill })
    }

    // 裁决积累(J) - 无武器类型限制，只要技能已配置即可
    const judgmentAccumulationSkill = getSkill('holy_knight', 'J')
    if (judgmentAccumulationSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'holy_knight', staticSkill: judgmentAccumulationSkill })
    }
  }

  // 奥术师：奥术精通(I)和奥术充能(J)
  if (player.class === 'arcane_master') {
    // 奥术精通(I) - 无武器类型限制，只要技能已配置即可
    const arcaneMasterySkill = getSkill('arcane_master', 'I')
    if (arcaneMasterySkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'I', className: 'arcane_master', staticSkill: arcaneMasterySkill })
    }

    // 奥术充能(J) - 无武器类型限制，只要技能已配置即可
    const arcaneChargeSkill = getSkill('arcane_master', 'J')
    if (arcaneChargeSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'arcane_master', staticSkill: arcaneChargeSkill })
    }
  }

  // 心灵师：星念凝徽(I)和碎思归墟(J)
  if (player.class === 'mind_master') {
    // 星念凝徽(I) - 无武器类型限制，只要技能已配置即可
    const mindMasterySkill = getSkill('mind_master', 'I')
    if (mindMasterySkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'I', className: 'mind_master', staticSkill: mindMasterySkill })
    }

    // 碎思归墟(J) - 无武器类型限制，只要技能已配置即可
    const mindChargeSkill = getSkill('mind_master', 'J')
    if (mindChargeSkill?.proficiencyGainOnAttack?.enabled) {
      result.push({ skillKey: 'J', className: 'mind_master', staticSkill: mindChargeSkill })
    }
  }

  return result
}

/**
 * 普通攻击命中后跟踪武器精通类技能的熟练度计数
 * 每次普通攻击命中后调用，累计计数达到阈值后增加1点熟练度
 * 达到最大熟练度后停止计数
 *
 * @param {Object} player - 玩家对象（需包含 class、skills 字段）
 * @returns {void}
 */
export function trackMasteryAttack (player) {
  try {
    if (!player || !player.class || !player.skills) return

    const masterySkills = collectMasterySkills(player)
    if (masterySkills.length === 0) return

    const skillsStore = useSkillsStore()

    for (const { skillKey, className, staticSkill } of masterySkills) {
      // 检查玩家是否已学习该技能
      const playerSkill = player.skills[skillKey]
      if (!playerSkill) continue

      // 检查是否已达最大熟练度
      if (isMaxProficiency(playerSkill, staticSkill)) {
        // 达到最大熟练度，清除计数器并跳过
        attackCounters.delete(skillKey)
        continue
      }

      // 获取攻击次数阈值
      const threshold = getMasteryAttacksPerGain(className, skillKey)
      if (threshold <= 0) continue

      // 累计计数
      const currentCount = attackCounters.get(skillKey) || 0
      const nextCount = currentCount + 1

      if (nextCount >= threshold) {
        // 达到阈值，增加1点熟练度并重置计数器
        attackCounters.set(skillKey, 0)

        // 通过 skillsStore 增加熟练度（更新 currentSkills）
        if (skillsStore && typeof skillsStore.increaseSkillProficiency === 'function') {
          skillsStore.increaseSkillProficiency(skillKey, 1)

          // 同步更新 player.skills 中的熟练度数据
          // skillsStore.increaseSkillProficiency 只更新 currentSkills 数组，
          // 不会同步 player.skills，需手动同步以确保技能详情面板显示正确
          try {
            const updatedSkill = skillsStore.currentSkills?.find(s => s && s.key === skillKey)
            if (updatedSkill) {
              const rawPlayerSkill = toRaw(playerSkill)
              rawPlayerSkill.proficiencyLevel = updatedSkill.proficiencyLevel
              rawPlayerSkill.level = updatedSkill.level
              rawPlayerSkill.proficiency = updatedSkill.proficiency
              rawPlayerSkill.proficiencyExp = updatedSkill.proficiencyExp

              // 防抖持久化 player.skills 到 localStorage
              persistPlayerSkillsDebounced(player.skills)
            }
          } catch (syncError) {
            console.error('[MasteryProficiency] 同步 player.skills 失败:', syncError)
          }
        }
      } else {
        // 未达阈值，更新计数器
        attackCounters.set(skillKey, nextCount)
      }
    }
  } catch (error) {
    console.error('[MasteryProficiency] 跟踪武器精通熟练度失败:', error)
  }
}

/**
 * 重置所有武器精通攻击计数器
 * 在战斗停止或切换场景时调用，避免残留计数
 */
export function resetMasteryAttackCounters () {
  attackCounters.clear()
}

/**
 * 获取指定技能的攻击计数进度信息（用于UI显示）
 * @param {Object} player - 玩家对象
 * @param {string} skillKey - 技能键
 * @returns {{current: number, threshold: number, isMax: boolean} | null} 计数进度，无配置时返回 null
 */
export function getMasteryProgress (player, skillKey) {
  if (!player || !player.class) return null

  const staticSkill = getSkill(player.class, skillKey)
  if (!staticSkill?.proficiencyGainOnAttack?.enabled) return null

  const threshold = getMasteryAttacksPerGain(player.class, skillKey)
  if (threshold <= 0) return null

  const playerSkill = player.skills?.[skillKey]
  const isMax = isMaxProficiency(playerSkill, staticSkill)

  if (isMax) {
    return { current: threshold, threshold, isMax: true }
  }

  return {
    current: getMasteryAttackCount(skillKey),
    threshold,
    isMax: false
  }
}
