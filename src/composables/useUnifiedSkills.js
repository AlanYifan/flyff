import { onUnmounted, computed } from 'vue'
import { storageService } from '@/services/StorageService'
import { SkillService } from '@/services/SkillService'
import { SkillEffectService } from '@/services/SkillEffectService'
import { useSkillsStore } from '@/store/skills'
import { getSkill } from '@/data/skills'
import { processHolyAccumulationOnSkillCast, isHolyAccumulationUnlocked } from '@/composables/useHolyAccumulation'
import { getStormArrowEffectiveCooldown } from '@/composables/useStormArrowEx'
import { getGaleRapidFireEffectiveCooldown } from '@/composables/useGaleRapidFireEx'
import { getAuraBombEffectiveCooldown } from '@/composables/useAuraBombEx'
import { getNensphereEffectiveCooldown } from '@/composables/useNensphereEx'
import { getDragonFistEffectiveCooldown } from '@/composables/useDragonFistEx'
import { getShadowRazeEffectiveCooldown } from '@/composables/useShadowRazeEx'
import { getShadowBladeEffectiveCooldown } from '@/composables/useShadowBladeEx'
import { getDeadlyPoisonEffectiveCooldown } from '@/composables/useDeadlyPoisonEx'
import { getShadowCloakEffectiveCooldown } from '@/composables/useShadowCloakEx'
import { getThunderHammerEffectiveCooldown } from '@/composables/useThunderHammerEx'
import { getHolyJudgmentEffectiveCooldown } from '@/composables/useHolyJudgmentEx'
import { getAngelWrathEffectiveCooldown } from '@/composables/useAngelWrathEx'
import {
  getShieldBashEffectiveCooldown,
  getHolyKnightJudgmentEffectiveCooldown,
  getArmorBreakEffectiveCooldown,
  processJudgmentAccumulationOnSkillCast,
  isJudgmentAccumulationUnlocked
} from '@/composables/useHolyKnightEx'
import { processArcaneChargeOnSkillCast, isArcaneChargeUnlocked } from '@/composables/useArcaneMasterEx'
import { processMindChargeOnSkillCast, isMindChargeUnlocked, getMindTearEffectiveCooldown, getConsciousnessCollapseEffectiveCooldown, getMindNovaEffectiveCooldown } from '@/composables/useMindMasterEx'

// 使用 Pinia store 管理技能状态
// 不再需要单例模式，因为状态现在由 Pinia 统一管理

export function useUnifiedSkills () {
  // 使用 Pinia store
  const skillsStore = useSkillsStore()
  
  // 从 store 获取响应式数据
  const skills = computed(() => skillsStore.skills)
  const skillTooltip = computed(() => skillsStore.tooltip)
  const playerClass = computed(() => skillsStore.class)
  
  // 创建 SkillService 实例（本地服务，不存储在 store 中）
  const skillService = new SkillService()
  let skillEffectService = null


  const initSkills = (player, gameData) => {
    // 调用 Pinia store 的 initSkills 方法
    skillsStore.initSkills(player, gameData)
    
    // 初始化 SkillService
    skillService.initialize(skills.value)
  }

  // finishSkillInitialization 方法已移动到 Pinia store 中


  const useSkill = async (
    skillOrKey,
    player,
    gameInitializer,
    monsters,
    activeBuffs,
    addBattleLog,
    showDamageNumber,
    triggerSkillAnimation = null,
    onPlayerHeal = null
  ) => {
    try {
      if (!skillOrKey || !player) {
        console.error('useSkill: 缺少必要参数', { skillOrKey, player })
        return
      }

      if (player.currentHealth <= 0) {
        return
    }

// 解析技能对象：支持直接传入技能对象（如 SkillBar 传入）或 key/id 字符串（如键盘快捷键）
// 使用 skill.id 作为冷却 key（全局唯一），避免不同职业间 key 冲突
let skill
if (typeof skillOrKey === 'object' && skillOrKey !== null) {
  skill = skillOrKey
} else {
  skill = skills.value.find(s => s.key === skillOrKey || s.id === skillOrKey)
}
if (!skill) {
        console.error(`useSkill: 找不到技能 ${skillOrKey}`)
        return
      }

      // 使用 skill.id 作为冷却 key（全局唯一），回退到 skill.key（兼容旧数据）
      const cooldownKey = skill.id || skill.key

      // 检查是否为被动技能，被动技能不可主动使用
      if (skill.isPassive === true) {
        if (addBattleLog) {
          addBattleLog(`${skill.name} 是被动技能，无法主动使用`)
        }
        return
      }

      // 使用 Pinia store 检查技能是否可用（用 skill.id 做冷却 key）
      if (!skillsStore.isSkillAvailable(cooldownKey)) {
        if (addBattleLog) {
          addBattleLog(`${skill.name} 冷却中`)
        }
    return
}

const baseManaCost = skill.manaCost || 0

      // manaCost = -1 表示消耗全部MP（如背水一击）
      // manaCost = -2 表示消耗生命值而非MP（如血祭）
      if (baseManaCost === -1) {
        // 消耗全部MP，需要检查是否有MP
        if (player.currentMana <= 0) {
          if (addBattleLog) {
            addBattleLog('魔法值不足')
          }
          return
        }
      } else if (baseManaCost > 0) {
        // 应用MP消耗减少效果
        const mpReduction = Number(player.decreasedMpConsumption || 0)
        const actualManaCost = Math.max(0, Math.floor(baseManaCost * (1 - mpReduction)))

        if (player.currentMana < actualManaCost) {
          if (addBattleLog) {
            addBattleLog('魔法值不足')
          }
          return
        }
      }

      // 执行MP消耗
      if (baseManaCost === -1) {
        // 消耗全部MP
        player.currentMana = 0
      } else if (baseManaCost > 0) {
        const mpReduction = Number(player.decreasedMpConsumption || 0)
        const actualManaCost = Math.max(0, Math.floor(baseManaCost * (1 - mpReduction)))
    player.currentMana = Math.max(0, player.currentMana - actualManaCost)
}

// 检查mp_maintain BUFF：若玩家拥有「无敌魔力多」(ID:5883) 的维持MP满值BUFF，
// 技能消耗MP后立即恢复满值，确保BUFF持续期间MP始终维持满值
const activeBuffs = player.activeBuffs
if (Array.isArray(activeBuffs) && activeBuffs.length > 0) {
  const now = Date.now()
  const hasMpMaintain = activeBuffs.some(buff => {
    if (!buff || buff.type !== 'mp_maintain') return false
    const expiresAt = Number(buff.expiresAt ?? 0)
    return expiresAt <= 0 || expiresAt > now
  })
  if (hasMpMaintain) {
    const maxMana = Number(player.maxMana ?? 0)
    if (maxMana > 0) {
      player.currentMana = maxMana
    }
  }
}

// 保存玩家数据：延迟到下一个事件循环，避免 JSON 深拷贝 + sessionStorage 写入阻塞主线程
      if (baseManaCost !== 0) {
        try {
          // storageService 已通过 import 导入全局单例
          // 延迟到 setTimeout(0) 执行，MP 值已在上方同步修改完成，保存只需捕获最终状态
          setTimeout(() => {
            try {
              storageService.savePlayerData(player)
            } catch (error) {
              console.error('保存玩家数据失败:', error)
            }
          }, 0)
        } catch (error) {
          console.error('保存玩家数据失败:', error)
    }
}

// 计算技能冷却时间
// 优先级：skill.baseCooldown（currentSkills 已归一化） → skill.cd（SKILL_CONFIG 原始字段）
// 注意：不再从 player.classConfig?.skills?.[skill.key] 查找，因为跨职业技能的 key
//（如 'W'）会匹配到当前职业同槽位技能，导致取到错误的冷却时间
let rawCooldown = 0
if (skill.baseCooldown !== undefined) {
        rawCooldown = skill.baseCooldown
      } else if (skill.cd !== undefined) {
        rawCooldown = skill.cd
      }
      const numericCooldown = Number(rawCooldown || 0)
      let cooldownSeconds = numericCooldown > 1000 ? Math.ceil(numericCooldown / 1000) : numericCooldown

// 暴风箭矢EX1-CD减少被动：减少暴风箭矢技能CD 50%
if (skill.id === 'fierce_shooter_u') {
cooldownSeconds = getStormArrowEffectiveCooldown(player, cooldownSeconds)
}

// 狂风连射EX1-CD减少被动：减少狂风连射技能CD 50%
if (skill.id === 'fierce_shooter_i') {
cooldownSeconds = getGaleRapidFireEffectiveCooldown(player, cooldownSeconds)
}

// 念气能量弹EX1-CD减少被动：减少念气能量弹技能CD 50%
if (skill.id === 'combat_master_u') {
cooldownSeconds = getAuraBombEffectiveCooldown(player, cooldownSeconds)
}

// 龟派气功EX1-CD减少被动：减少龟派气功技能CD 50%
if (skill.id === 'combat_master_w') {
cooldownSeconds = getNensphereEffectiveCooldown(player, cooldownSeconds)
}

// 龙拳-破劲EX1-CD减少被动：减少龙拳-破劲技能CD 50%
if (skill.id === 'combat_master_e') {
cooldownSeconds = getDragonFistEffectiveCooldown(player, cooldownSeconds)
}

// 暗影突袭EX1-CD减少被动：减少暗影突袭技能CD 50%
if (skill.id === 'joker_emperor_w') {
cooldownSeconds = getShadowRazeEffectiveCooldown(player, cooldownSeconds)
}

// 暗影之刃EX1-CD减少被动：减少暗影之刃技能CD 50%
if (skill.id === 'joker_emperor_u') {
cooldownSeconds = getShadowBladeEffectiveCooldown(player, cooldownSeconds)
}

// 致命毒刃EX1-CD减少被动：减少致命毒刃技能CD 50%
if (skill.id === 'joker_emperor_e') {
cooldownSeconds = getDeadlyPoisonEffectiveCooldown(player, cooldownSeconds)
}

// 暗影斗篷EX1-CD减少被动：减少暗影斗篷技能CD 50%
if (skill.id === 'joker_emperor_r') {
cooldownSeconds = getShadowCloakEffectiveCooldown(player, cooldownSeconds)
}

// 雷神之锤EX1-CD减少被动：减少雷神之锤技能CD 50%
if (skill.id === 'nature_messenger_t') {
cooldownSeconds = getThunderHammerEffectiveCooldown(player, cooldownSeconds)
}

// 圣光审判EX1-CD减少被动：减少圣光审判技能CD 50%
if (skill.id === 'nature_messenger_e') {
cooldownSeconds = getHolyJudgmentEffectiveCooldown(player, cooldownSeconds)
}

// 天使之怒EX1-CD减少被动：减少天使之怒技能CD 50%
if (skill.id === 'nature_messenger_u') {
cooldownSeconds = getAngelWrathEffectiveCooldown(player, cooldownSeconds)
}

// 荣耀之剑EX1-CD减少被动：减少荣耀之剑技能CD 50%
if (skill.id === 'holy_knight_w') {
cooldownSeconds = getShieldBashEffectiveCooldown(player, cooldownSeconds)
}

// 圣殿裁决EX1-CD减少被动：减少圣殿裁决技能CD 50%
if (skill.id === 'holy_knight_u') {
cooldownSeconds = getHolyKnightJudgmentEffectiveCooldown(player, cooldownSeconds)
}

// 碎甲圣裁EX1-CD减少被动：减少碎甲圣裁技能CD 50%
if (skill.id === 'holy_knight_e') {
cooldownSeconds = getArmorBreakEffectiveCooldown(player, cooldownSeconds)
}

// 星思坠寂EX1-CD减少被动：减少星思坠寂技能CD 50%
if (skill.id === 'mind_master_w') {
cooldownSeconds = getMindTearEffectiveCooldown(player, cooldownSeconds)
}

// 意识崩塌EX1-CD减少被动：减少意识崩塌技能CD 50%
if (skill.id === 'mind_master_e') {
cooldownSeconds = getConsciousnessCollapseEffectiveCooldown(player, cooldownSeconds)
}

// 万绪沉宵EX1-CD减少被动：减少万绪沉宵技能CD 50%
if (skill.id === 'mind_master_u') {
cooldownSeconds = getMindNovaEffectiveCooldown(player, cooldownSeconds)
}

      const payload = {
        ...skill,
        cooldown: cooldownSeconds,
        proficiencyGain: 1,
        player
      }

      const used = skillService.useSkill(cooldownKey, payload)
      if (!used) {
        if (addBattleLog) {
          addBattleLog(`${skill.name} 冷却中`)
        }
    return
}

if (!skillEffectService && gameInitializer?.services?.audio) {
        skillEffectService = new SkillEffectService(gameInitializer.services.audio)
      }

      if (skillEffectService) {
        try {
          skillEffectService.playSkillSound(skill)
        } catch (error) {
          console.error('播放技能音效失败:', error)
    }
}

// 检测箭雨技能，播放音效后立即派发全局事件触发箭雨特效动画
      if (String(skill?.name || '') === '箭雨') {
        try {
          window.dispatchEvent(new CustomEvent('skill-arrow-rain'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测怒焰回旋技能，播放音效后立即派发全局事件触发怒焰回旋特效动画
      if (String(skill?.name || '') === '怒焰回旋') {
        try {
          window.dispatchEvent(new CustomEvent('skill-fury-spin'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测刀剑乱舞技能，播放音效后立即派发全局事件触发刀剑乱舞特效动画
      if (String(skill?.name || '') === '刀剑乱舞') {
        try {
          window.dispatchEvent(new CustomEvent('skill-blade-dance'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测冰箭技能，播放音效后立即派发全局事件触发冰箭特效动画
      if (String(skill?.name || '') === '冰箭') {
        try {
          window.dispatchEvent(new CustomEvent('skill-ice-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测火焰箭矢技能，播放音效后立即派发全局事件触发火焰箭矢特效动画
      if (String(skill?.name || '') === '火焰箭矢') {
        try {
          window.dispatchEvent(new CustomEvent('skill-fire-arrow'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 检测神鹰降临技能，播放音效后立即派发全局事件触发神鹰降临特效动画
      // 神鹰降临是buff类型技能，事件由 applySummonEffect 内部派发 eagle-summon-activate
      // 此处额外派发 skill-eagle-summon 事件用于触发额外UI反馈
      if (String(skill?.name || '') === '神鹰降临') {
        try {
          window.dispatchEvent(new CustomEvent('skill-eagle-summon'))
        } catch (e) {
          // 忽略事件派发失败
        }
      }

      // 派发全局施法特效事件，携带技能元素类型，触发玩家头像区域施法动画
      try {
        const skillElement = skill?.elementType ?? skill?.element ?? 'none'
        window.dispatchEvent(new CustomEvent('skill-cast-effect', {
          detail: { element: skillElement }
        }))
      } catch (e) {
    // 忽略事件派发失败
}

player.isAttacking = true
      player.lastAttackStartTime = Date.now()

      if (triggerSkillAnimation && typeof triggerSkillAnimation === 'function') {
        triggerSkillAnimation()
      }

      try {
        const skillLevel = Number(skill.proficiencyLevel ?? skill.level ?? 1)
        if (skillEffectService && addBattleLog && showDamageNumber) {
          await skillEffectService.applySkillEffect(
            skill,
            player,
            monsters,
            activeBuffs,
            {
              addBattleLog,
              showDamageNumber,
              onPlayerHeal
            },
            skillLevel
          )
        } else {
          if (addBattleLog) {
            addBattleLog(`${skill.name} 使用失败`)
          }
        }
      } catch (error) {
        console.error('技能执行出错:', error)
        if (addBattleLog) {
          addBattleLog(`${skill.name} 使用失败`)
        }
      } finally {
        setTimeout(() => {
          if (player) {
            player.isAttacking = false
          }
        }, 500)
      }

      // 圣光积累被动：炽天使J技能，每次释放技能增加1点圣光值
      // 主页面无队友，全队治疗等同于仅治疗玩家
      try {
        if (isHolyAccumulationUnlocked(player)) {
          console.log('[圣光积累-DEBUG][Main-手动技能] 进入处理:', { 技能名称: skill?.name, 技能key: skill?.key })
          const skillAttack = Number(player.attack || 0)
          const holyResult = processHolyAccumulationOnSkillCast(player, skillAttack)

          if (holyResult.triggered && holyResult.healAmount > 0) {
            const beforeHP = player.currentHealth
            player.currentHealth = Math.min(
              player.maxHealth,
              player.currentHealth + holyResult.healAmount
            )
            console.log('[圣光积累-DEBUG][Main-手动技能] ★治疗已应用:', {
              治疗目标: holyResult.targetType,
              治疗量: holyResult.healAmount,
              治疗百分比: holyResult.healPercent,
              倍攻加成: holyResult.multiHealBonus,
              治疗前HP: beforeHP,
              治疗后HP: player.currentHealth,
              最大HP: player.maxHealth
            })

            // 显示治疗飘字动画（-1 表示玩家位置，true 表示治疗动画）
            if (showDamageNumber && typeof showDamageNumber === 'function') {
              console.log('[圣光积累-DEBUG][Main-手动技能] 调用showDamageNumber显示治疗动画:', { 治疗量: holyResult.healAmount })
              showDamageNumber(-1, holyResult.healAmount, false, true)
            } else {
              console.warn('[圣光积累-DEBUG][Main-手动技能] showDamageNumber不可用，无法显示治疗动画')
            }

            if (addBattleLog) {
              if (holyResult.targetType === 'self') {
                addBattleLog(`圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`)
              } else if (holyResult.multiHealBonus > 0) {
                addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent + holyResult.multiHealBonus}%攻击力生命值！`)
              } else {
                addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`)
              }
            }
          }
        }
      } catch (holyAccumulationError) {
        console.error('[useUnifiedSkills] 圣光积累技能释放处理失败:', holyAccumulationError)
      }

      // 裁决积累被动：圣殿骑士J技能，每次释放技能增加1点裁决值
      try {
        if (isJudgmentAccumulationUnlocked(player)) {
          const skillAttack = Number(player.attack || 0)
          const judgmentResult = processJudgmentAccumulationOnSkillCast(player, skillAttack)

          // 触发附加伤害
          if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
            // 找到当前目标怪物（如果还活着）
            const targetMonster = monsters && monsters.value
              ? monsters.value.find(m => m && !m.isDying && m.currentHealth > 0)
              : (Array.isArray(monsters) ? monsters.find(m => m && !m.isDying && m.currentHealth > 0) : null)

            if (targetMonster) {
              targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - judgmentResult.damageAmount)
              targetMonster.healthPercentage = targetMonster.maxHealth > 0
                ? (targetMonster.currentHealth / targetMonster.maxHealth) * 100
                : 0

              // 显示裁决积累附加伤害数字
              if (showDamageNumber && typeof showDamageNumber === 'function') {
                const judgmentSkill = getSkill('holy_knight', 'J')
                let judgmentText = null
                if (judgmentResult.multiAttackBonus > 0) {
                  const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
                  judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
                }
                showDamageNumber(
                  monsters && monsters.value ? monsters.value.indexOf(targetMonster) : 0,
                  judgmentResult.damageAmount,
                  false,
                  false,
                  judgmentSkill,
                  false,
                  judgmentSkill?.icon || null,
                  null,
                  false,
                  judgmentText
                )
              }

              // 添加战斗日志
              if (addBattleLog) {
                const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
                if (judgmentResult.multiAttackBonus > 0) {
                  addBattleLog(`裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`)
                } else {
                  addBattleLog(`裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`)
                }
              }
            }
          }
        }
      } catch (judgmentAccumulationError) {
        console.error('[useUnifiedSkills] 裁决积累技能释放处理失败:', judgmentAccumulationError)
      }

      // 奥术充能被动：奥术师J技能，每次释放技能增加1点充能值
      try {
        if (isArcaneChargeUnlocked(player)) {
          const skillAttack = Number(player.attack || 0)
          const arcaneChargeResult = processArcaneChargeOnSkillCast(player, skillAttack)

          // 触发附加伤害
          if (arcaneChargeResult.triggered && arcaneChargeResult.damageAmount > 0) {
            // 找到当前目标怪物（如果还活着）
            const targetMonster = monsters && monsters.value
              ? monsters.value.find(m => m && !m.isDying && m.currentHealth > 0)
              : (Array.isArray(monsters) ? monsters.find(m => m && !m.isDying && m.currentHealth > 0) : null)

            if (targetMonster) {
              targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - arcaneChargeResult.damageAmount)
              targetMonster.healthPercentage = targetMonster.maxHealth > 0
                ? (targetMonster.currentHealth / targetMonster.maxHealth) * 100
                : 0

              // 显示奥术充能附加伤害数字
              if (showDamageNumber && typeof showDamageNumber === 'function') {
                const arcaneChargeSkill = getSkill('arcane_master', 'J')
                let arcaneChargeText = null
                if (arcaneChargeResult.multiAttackBonus > 0) {
                  const multiplier = (arcaneChargeResult.multiAttackBonus / 100).toFixed(1)
                  arcaneChargeText = `+${arcaneChargeResult.damageAmount}*${multiplier}倍`
                }
                showDamageNumber(
                  monsters && monsters.value ? monsters.value.indexOf(targetMonster) : 0,
                  arcaneChargeResult.damageAmount,
                  false,
                  false,
                  arcaneChargeSkill,
                  false,
                  arcaneChargeSkill?.icon || null,
                  null,
                  false,
                  arcaneChargeText
                )
              }

              // 添加战斗日志
              if (addBattleLog) {
                const totalPercent = arcaneChargeResult.damagePercent + arcaneChargeResult.multiAttackBonus
                if (arcaneChargeResult.multiAttackBonus > 0) {
                  addBattleLog(`奥术充能触发！附加${totalPercent}%攻击力无属性法术伤害！`)
                } else {
                  addBattleLog(`奥术充能触发！附加${arcaneChargeResult.damagePercent}%攻击力无属性法术伤害！`)
                }
              }
            }
          }
        }
      } catch (arcaneChargeError) {
        console.error('[useUnifiedSkills] 奥术充能技能释放处理失败:', arcaneChargeError)
      }

      // 碎思归墟被动：心灵师J技能，每次释放技能增加1点充能值
      try {
        if (isMindChargeUnlocked(player)) {
          const playerMaxMana = Number(player.maxMana || 0)
          const mindChargeResult = processMindChargeOnSkillCast(player, playerMaxMana)

          // 触发附加伤害
          if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
            // 找到当前目标怪物（如果还活着）
            const targetMonster = monsters && monsters.value
              ? monsters.value.find(m => m && !m.isDying && m.currentHealth > 0)
              : (Array.isArray(monsters) ? monsters.find(m => m && !m.isDying && m.currentHealth > 0) : null)

            if (targetMonster) {
              targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - mindChargeResult.damageAmount)
              targetMonster.healthPercentage = targetMonster.maxHealth > 0
                ? (targetMonster.currentHealth / targetMonster.maxHealth) * 100
                : 0

              // 显示碎思归墟附加伤害数字
              if (showDamageNumber && typeof showDamageNumber === 'function') {
                const mindChargeSkill = getSkill('mind_master', 'J')
                let mindChargeText = null
                if (mindChargeResult.multiAttackBonus > 0) {
                  const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
                  mindChargeText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
                }
                showDamageNumber(
                  monsters && monsters.value ? monsters.value.indexOf(targetMonster) : 0,
                  mindChargeResult.damageAmount,
                  false,
                  false,
                  mindChargeSkill,
                  false,
                  mindChargeSkill?.icon || null,
                  null,
                  false,
                  mindChargeText
                )
              }

              // 添加战斗日志
              if (addBattleLog) {
                const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
                if (mindChargeResult.multiAttackBonus > 0) {
                  addBattleLog(`碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`)
                } else {
                  addBattleLog(`碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`)
                }
              }
            }
          }
        }
      } catch (mindChargeError) {
        console.error('[useUnifiedSkills] 碎思归墟技能释放处理失败:', mindChargeError)
      }
    } catch (error) {
      console.error('useSkill 执行出错:', error)
      if (addBattleLog) {
        addBattleLog('技能使用失败')
      }
    }
  }

  const showSkillTooltip = (event, skill) => {
    // 调用 Pinia store 的方法
    skillsStore.showSkillTooltip(event, skill)
  }

  const moveSkillTooltip = event => {
    // 调用 Pinia store 的方法
    skillsStore.moveSkillTooltip(event)
  }

  // adjustTooltipPosition 方法已移动到 Pinia store 中

  const hideSkillTooltip = () => {
    // 调用 Pinia store 的方法
    skillsStore.hideSkillTooltip()
  }

  const cleanup = () => {
    skillService.cleanup()
    // 清空 Pinia store 中的当前技能（可选）
    // skillsStore.clearCurrentSkills()
  }

  onUnmounted(cleanup)

  return {
    // 返回 computed 属性
    skills,
    skillTooltip,
    playerClass,
    // 方法
    initSkills,
    useSkill,
    showSkillTooltip,
    moveSkillTooltip,
    hideSkillTooltip,
    // 技能冷却相关方法
    isSkillAvailable: skillKey => skillsStore.isSkillAvailable(skillKey),
    getSkillCooldown: skillKey => skillService.getSkillCooldown(skillKey),
    setSkillCooldown: (skillKey, cooldown) => skillService.setSkillCooldown(skillKey, cooldown),
    updateSkillCooldowns: () => skillService.syncSkillCooldownsToUI(skills.value),
    // 服务
    skillService,
    // 清理
    cleanup,
    // 暴露 store 以便需要时直接访问
    skillsStore
  }
}
