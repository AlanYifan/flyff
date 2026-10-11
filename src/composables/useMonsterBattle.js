import { ref, computed } from 'vue'
import { usePlayer } from './usePlayer'
import { useGameStore } from '@/store'
import { useExperienceCalculator } from './useExperienceCalculator'
import { DamageCalculator } from '@/utils/damageCalculator'
import { DropService } from '@/services/DropService'
import { useMonstersStore } from '@/store/monsters'
import { applyLifeSteal } from '@/utils/lifeStealHelper'
import { useItemsStore } from '@/store/items'
import { getSkill, isSkillUnlocked } from '@/data/skills'
import { monsterTransitionBatcher } from '@/services/autoBattle/MonsterTransitionBatcher'
import { SkillEffectService } from '@/services/SkillEffectService'
import { weaponSkillTriggerService } from '@/services/WeaponSkillTriggerService'
import { trackMasteryAttack } from '@/composables/useMasteryProficiency'
import { processDragonForceOnAttack, isDragonForceUnlocked } from '@/composables/useDragonForce'
import { getShieldAwakeningAttackDamageReduction, getArmorBreakEx3DoubleJudgmentMultiplier, processJudgmentAccumulationOnAttack, isJudgmentAccumulationUnlocked } from '@/composables/useHolyKnightEx'
import { processShadowGrudgeOnAttack, isShadowGrudgeUnlocked } from '@/composables/useShadowGrudge'
import { processHolyAccumulationOnAttack, isHolyAccumulationUnlocked } from '@/composables/useHolyAccumulation'
import { processArcaneChargeOnAttack, isArcaneChargeUnlocked } from '@/composables/useArcaneMasterEx'
import { processMindChargeOnAttack, isMindChargeUnlocked } from '@/composables/useMindMasterEx'
import { MAX_PLAYER_LEVEL } from '@/utils/gameConstants'

let dropWorker = null
let dropWorkerRequestId = 1
const dropWorkerPending = new Map()

const getDropWorker = () => {
  if (dropWorker) {
    return dropWorker
  }
  if (typeof Worker === 'undefined') {
    return null
  }

  try {
    dropWorker = new Worker(new URL('../workers/DropWorker.js', import.meta.url), {
      type: 'module'
    })
    dropWorker.onmessage = event => {
      const { requestId, result, error } = event.data || {}
      if (!requestId || !dropWorkerPending.has(requestId)) {
        return
      }
      const handler = dropWorkerPending.get(requestId)
      dropWorkerPending.delete(requestId)
      if (error) {
        handler.reject(new Error(error))
        return
      }
      handler.resolve(result)
    }
    dropWorker.onerror = error => {
      console.error('DropWorker 运行失败:', error)
    }
    return dropWorker
  } catch (error) {
    console.error('DropWorker 初始化失败:', error)
    return null
  }
}

const requestDropWorker = payload => {
  const worker = getDropWorker()
  if (!worker) {
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    const requestId = dropWorkerRequestId++
    dropWorkerPending.set(requestId, { resolve, reject })
    worker.postMessage({ type: 'drop', payload, requestId })
  })
}

export function useMonsterBattle (
  gameData,
  showMonsters,
  userSettings = null,
  savePlayerData = null,
  updateAllMonstersUIRef = null,
  showDamageNumber = null,
  activeBuffs = null,
  audioService = null,
  autoBattle = null,
  monstersRef = null
) {
  const { player, addBattleLog, addItemToBag, gainExp } = usePlayer()

  const gameStore = useGameStore()
  const monstersStore = useMonstersStore()
  const itemsStore = useItemsStore()
  // SkillEffectService 实例（用于被动技能）
  let skillEffectServiceInstance = null
  const getSkillEffectService = () => {
    if (!skillEffectServiceInstance) {
      skillEffectServiceInstance = new SkillEffectService(audioService)
    }
    return skillEffectServiceInstance
  }

  // 设置 weaponSkillTriggerService 的音频服务
  if (audioService) {
    weaponSkillTriggerService.setAudioService(audioService)
  }

  // 怪物相关状态 - 使用外部传入的 monstersRef 或创建新的
  const monsters = monstersRef || ref([])
  const currentMonster = ref(null)

  // 计算属性
  const aliveMonsters = computed(() => {
    return monsters.value.filter(monster => monster.currentHealth > 0 && !monster.isDefeated)
  })

  /**
   * 检查并触发被动技能
   * 目前支持：双倍惩戒（骑士R技能）
   * @returns {number} 触发成功的怪物数量
   */
  const checkAndTriggerPassiveSkills = () => {
    try {
      if (!player.value || !player.value.class) {
        return 0
      }

      const playerClass = player.value.class
      const monsterList = monsters.value || []

      // 检查骑士的双倍惩戒被动技能
      if (playerClass === 'knight' || playerClass === 'holy_knight') {
        const passiveSkill = getSkill('knight', 'R')
        if (!passiveSkill) {
          return 0
        }

        // 检查玩家是否已学习该技能
        // 注意：圣殿骑士(holy_knight)的R槽位是「圣盾觉醒」(unlockLevel:170)，不是骑士的「双倍惩戒」(unlockLevel:80)
        // 双倍惩戒是骑士的被动技能，圣殿骑士继承此被动，但player.skills.R指向的是圣盾觉醒
        // 因此对holy_knight不能检查player.skills.R，而应直接检查骑士R技能的解锁等级
        const playerSkill = player.value.skills?.R
        const isDoubleJudgmentLearned = playerClass === 'holy_knight'
          ? isSkillUnlocked(player.value, 'knight', 'R')
          : (playerSkill && Number(playerSkill.proficiencyLevel ?? playerSkill.level ?? 0) >= 1)
        if (!isDoubleJudgmentLearned) {
          return 0
        }

        // 检查MP是否足够（被动技能manaCost=0时不消耗MP，使用??避免0被||误判为falsy）
        const manaCost = passiveSkill.manaCost ?? 0
        if (manaCost > 0 && player.value.currentMana < manaCost) {
          return 0
        }

        // 合并静态技能配置和玩家技能等级
        // holy_knight的R槽位是圣盾觉醒，不是双倍惩戒，所以proficiencyLevel默认为1（双倍惩戒maxLevel=1）
        const skillInstance = {
          ...passiveSkill,
          proficiencyLevel: playerClass === 'holy_knight'
            ? 1
            : Number(playerSkill?.proficiencyLevel ?? playerSkill?.level ?? 1)
        }

        // 碎甲圣裁EX3-双倍惩戒强化：当任意目标有碎甲圣裁DEBUFF时，概率*2
        const ex3Multiplier = getArmorBreakEx3DoubleJudgmentMultiplier(player.value)
        if (ex3Multiplier > 0) {
          const hasArmorBreak = monsterList.some(m =>
            m && m.currentHealth > 0 && m.armorBreakDebuff &&
            (!m.armorBreakDebuff.expiresAt || m.armorBreakDebuff.expiresAt > Date.now())
          )
          if (hasArmorBreak) {
            const originalCalcChance = skillInstance.calculateDebuffChance
            skillInstance.calculateDebuffChance = function (level) {
              const base = typeof originalCalcChance === 'function' ? originalCalcChance(level) : 25
              return base * ex3Multiplier
            }
          }
        }

        // 调用SkillEffectService应用双倍惩戒DEBUFF
        const service = getSkillEffectService()
        if (service && typeof service.applyDoubleJudgmentToAllMonsters === 'function') {
          const appliedCount = service.applyDoubleJudgmentToAllMonsters(
            skillInstance,
            monsterList,
            player.value,
            {
              addBattleLog: (message, type) => {
                addBattleLog(message)
              }
            }
          )

          // 如果触发了双倍惩戒，消耗MP（被动技能manaCost=0时不消耗）
          if (appliedCount > 0 && manaCost > 0) {
            player.value.currentMana = Math.max(0, player.value.currentMana - manaCost)
          }

          return appliedCount
        }
      }

      return 0
    } catch (error) {
      console.error('MonsterBattle', '检查被动技能失败:', error)
      return 0
    }
  }

  // 获取怪物数据
  const getMonstersForMap = () => {
    // 检查 monstersStore 是否已加载怪物数据
    const staticMonsters = monstersStore.staticMonsters
    if (!staticMonsters || Object.keys(staticMonsters).length === 0 || !player.value.level) {
      return []
    }

    // 获取设置面板中的遇怪等级范围
    let monsterMinLevelValue = 1
    let monsterMaxLevelValue = 3
    if (userSettings && typeof userSettings === 'object') {
      if ('value' in userSettings) {
        monsterMinLevelValue = userSettings.value?.monsterMinLevel || 1
        monsterMaxLevelValue = userSettings.value?.monsterMaxLevel || 3
      } else {
        monsterMinLevelValue = userSettings.monsterMinLevel || 1
        monsterMaxLevelValue = userSettings.monsterMaxLevel || 3
      }
    }

    // 设置怪物等级范围：使用设置面板中的遇怪等级范围
    const minLevel = Math.max(1, monsterMinLevelValue)
    const maxLevel = monsterMaxLevelValue

    // 从 monstersStore 获取怪物数据
    const monstersArray = Object.values(staticMonsters)

    const filteredMonsters = monstersArray.filter(monster => {
      // 只根据等级范围筛选怪物
      const monsterLevel = monster.level || 1
      const levelMatch = monsterLevel >= minLevel && monsterLevel <= maxLevel
      const dropsCheck = monster.drops && monster.drops.length !== 0

      // 只要普通区域怪物，不要副本/地下城怪物
      const areaCheck = monster.area === 'normal'

      // 筛选怪物条件
      // 灵兽ID列表
      const spiritBeasts = [84, 627, 4827, 8990]

      // 排除事件(活动)怪物
      const eventCheck = monster.event === false

      // 排除灵兽怪物
      const spiritBeastCheck = !spiritBeasts.includes(monster.id)

      return levelMatch && eventCheck && spiritBeastCheck && dropsCheck && areaCheck
    })

    // 怪物数据
    return filteredMonsters.map(monster => ({
      ...monster,
      // 处理怪物名称（支持多语言结构）
      name: typeof monster.name === 'object' ? monster.name.cns : monster.name,
      currentHealth: monster.hp || monster.health || monster.hp,
      isDefeated: false
    }))
  }

  // 刷新怪物
  const refreshMonsters = mapName => {
    const newMonsters = getMonstersForMap(mapName)
    monsters.value = newMonsters
  }

  // 攻击怪物
  const attackMonster = monsterIndex => {
    if (!monsters.value[monsterIndex]) {
      addBattleLog('该位置没有怪物')
      return
    }

    if (showMonsters) {
      showMonsters.value = true
    }

    const monster = monsters.value[monsterIndex]

    if (monster.currentHealth <= 0 || monster.isDefeated) {
      addBattleLog('该怪物已经死亡')
      return
    }

    // 检查是否有BUFF效果需要消耗MP
    const activeBuffs = Array.isArray(player.value?.activeBuffs) ? player.value.activeBuffs : []
    let mpCostPerAttack = 0
    
    // 查找所有激活的BUFF中的mpCostPerAttack效果
    for (const buff of activeBuffs) {
      if (buff && buff.effects && typeof buff.effects === 'object') {
        const mpEffect = buff.effects.mpCostPerAttack
        
        // 检查多种格式：
        // 1. 直接数值格式：effects.mpCostPerAttack = 1
        // 2. 对象格式：effects.mpCostPerAttack = { add: 1, rate: true }
        // 3. 新格式：effects.mpCostPerAttack = 1（直接数值）
        
        if (mpEffect !== undefined) {
          let mpValue = 0
          
          if (typeof mpEffect === 'number') {
            // 直接数值格式
            mpValue = mpEffect
          } else if (mpEffect && typeof mpEffect === 'object') {
            // 对象格式
            mpValue = mpEffect.add || mpEffect.value || mpEffect.amount || 0
          }
          
          if (mpValue > 0) {
            mpCostPerAttack = Math.max(mpCostPerAttack, mpValue)
          }
        }
      }
    }
    

    // 如果有MP消耗效果，检查是否有足够MP
    if (mpCostPerAttack > 0 && player.value.maxMana > 0) {
      const mpToConsume = Math.floor(player.value.maxMana * (mpCostPerAttack / 100))
      if (mpToConsume > 0 && player.value.currentMana < mpToConsume) {
        addBattleLog(`MP不足，无法攻击 (需要 ${mpToConsume} MP)`)
        return
      }
    }

    // 1. 检查并触发被动技能（双倍惩戒）- 不考虑命中率，只考虑技能触发概率
    // 如果本次判定触发成功，会给所有怪物添加DEBUFF图标
    // 下次普通攻击命中时才会消耗DEBUFF触发双倍伤害
    checkAndTriggerPassiveSkills()

    // 2. 计算命中率
    const hitRate = DamageCalculator.calculateHitRate(player)

    // 未命中时直接返回，不消耗双倍惩戒DEBUFF
    if (Math.random() > hitRate) {
      if (showDamageNumber && typeof showDamageNumber === 'function') {
        showDamageNumber(monsterIndex, 0, false, false, null, true)
      }

      if (audioService && typeof audioService.playAttackSFX === 'function') {
        const weaponType = player.value.equipment?.weapon?.subcategory || 'sword'
        audioService.playAttackSFX(weaponType, false)
      }

      return
    }

    // 3. 命中时才检查目标是否有双倍惩戒DEBUFF，消耗并触发双倍伤害
    let doubleJudgmentMultiplier = 1
    const service = getSkillEffectService()
    if (service && typeof service.consumeDoubleJudgmentDebuff === 'function') {
      doubleJudgmentMultiplier = service.consumeDoubleJudgmentDebuff(monster)
    }

    const baseDamage = DamageCalculator.calculateBaseDamage(player)
    const isCritical = DamageCalculator.checkCritical(player)
    const equipment = player.value.equipment || {}
    const weapon = equipment.weapon
    const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
    const weaponElement = elementInfo?.elementKey || null
    const monsterElement = monster?.elementType ?? monster?.element ?? null

    let damage = DamageCalculator.calculateFinalDamage(
      baseDamage,
      monster,
      weapon,
      player,
      isCritical
    )

    // 4. 应用双倍伤害倍率（如果触发了双倍惩戒）
    if (doubleJudgmentMultiplier > 1) {
      damage = Math.floor(damage * doubleJudgmentMultiplier)
      addBattleLog('双倍惩戒触发！伤害翻倍！')
    }

    // 4.1 圣盾觉醒EX1-攻击力伤害减少（BUFF持续期间自身攻击力伤害降低50%）
    const shieldAwakeningAdr = getShieldAwakeningAttackDamageReduction(player.value)
    if (shieldAwakeningAdr > 0) {
      damage = Math.max(1, Math.floor(damage * (1 - shieldAwakeningAdr / 100)))
    }

    const elementAdvantage = DamageCalculator.getElementAdvantageMultiplier(
      weaponElement,
      monsterElement
    )
    if (import.meta.env.DEV === true) {
      const now = Date.now()
      if (!attackMonster.lastElementLogAt || now - attackMonster.lastElementLogAt > 300) {
        attackMonster.lastElementLogAt = now
        console.log('[MonsterBattle] 普通攻击元素', {
          weaponElement,
          monsterElement,
          elementAdvantage,
          damage,
          isCritical
        })
      }
    }

    monster.currentHealth = Math.max(0, monster.currentHealth - damage)
    monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

    // Canvas-First：同步 vitals TypedArray，让 Canvas renderOverlayFrame 能读取最新血量
    try {
      const store = useMonstersStore()
      if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
        store.applyMonsterVitalsBatchUpdates([{
          index: monsterIndex,
          currentHealth: monster.currentHealth,
          healthPercentage: monster.healthPercentage
        }], { updateProxies: false })
      }
    } catch (vitalsError) {
      console.error('[MonsterBattle] 同步 vitals 失败:', vitalsError)
    }

    // 如果有MP消耗效果，消耗MP
    if (mpCostPerAttack > 0 && player.value.maxMana > 0) {
      const mpToConsume = Math.floor(player.value.maxMana * (mpCostPerAttack / 100))
      if (mpToConsume > 0 && player.value.currentMana >= mpToConsume) {
        player.value.currentMana -= mpToConsume
        
        // 添加战斗日志
        addBattleLog(`普通攻击消耗 ${mpToConsume} MP (${mpCostPerAttack}% 最大MP)`)
      }
    }

    // 吸血效果：根据伤害和吸血比例恢复玩家生命值
    applyLifeSteal(player.value, damage, {
      addBattleLog,
      onPlayerHeal: data => {
        // 显示吸血恢复动画
        if (data && data.amount > 0 && showDamageNumber && typeof showDamageNumber === 'function') {
          showDamageNumber(-1, data.amount, false, true) // -1 表示玩家位置，true 表示治疗动画
        }
      }
    })

    if (showDamageNumber && typeof showDamageNumber === 'function') {
      showDamageNumber(
        monsterIndex,
        damage,
        isCritical,
        false,
        null,
        false,
        weapon?.icon || null,
        null,
        false,
        null,
        {
          elementType: weaponElement,
          elementAdvantage
        }
      )
    }

    if (audioService && typeof audioService.playAttackSFX === 'function') {
      const weaponType = player.value.equipment?.weapon?.subcategory || 'sword'
      audioService.playAttackSFX(weaponType, isCritical)
    }

    if (audioService && typeof audioService.playMonsterDamageSFX === 'function') {
      const monsterIcon = monster.icon || monster.name
      audioService.playMonsterDamageSFX(monsterIcon)
    }

    // ========== 弓箭普通攻击特效：装备弓箭时，射出元素箭矢飞向目标怪物 ==========
    // 根据武器元素属性显示不同颜色的箭矢（木质/火/水/风/雷/土）
    try {
      const weaponSubcategory = weapon?.subcategory
      if (weaponSubcategory === 'bow') {
        const bowAttackEvent = new CustomEvent('bow-normal-attack', {
          detail: {
            targetIndex: monsterIndex,
            element: weaponElement || 'none'
          }
        })
        window.dispatchEvent(bowAttackEvent)
      }
    } catch (bowEffectError) {
      console.error('[MonsterBattle] 弓箭攻击特效派发失败:', bowEffectError)
    }

    // 触发武器附加技能（水弹等）
    try {
      weaponSkillTriggerService.triggerWeaponSkill({
        player: player.value,
        monster,
        monsterIndex,
        weapon,
        triggerType: 'normalAttack',
        showDamageNumber,
        addBattleLog
      })
    } catch (error) {
      console.error('[MonsterBattle] 触发武器技能失败:', error)
    }

    // ========== 暴风连矢被动：爆裂射手W技能，普通攻击有概率射出双重箭矢 ==========
    // 触发后额外射出一支箭矢，造成独立伤害，伤害动画显示暴风连矢图标+伤害
    // 触发概率：1级5%，每级+5%，5级25%
    try {
      // 武器精通类技能熟练度计数：普通攻击命中后累计计数
      trackMasteryAttack(player.value)

      // ========== 龙之劲被动：格斗宗师J技能，普通攻击累计劲力值，达到阈值触发附加伤害 ==========
      if (isDragonForceUnlocked(player.value) && monster.currentHealth > 0) {
        const baseAttack = DamageCalculator.calculateBaseDamage(player)
        const dragonForceResult = processDragonForceOnAttack(player.value, baseAttack)

        // 消耗MP
        if (dragonForceResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - dragonForceResult.mpConsumed)
        }

        // 触发附加伤害
        if (dragonForceResult.triggered && dragonForceResult.bonusDamage > 0) {
          // 应用附加伤害到怪物
          monster.currentHealth = Math.max(0, monster.currentHealth - dragonForceResult.bonusDamage)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          // 同步 vitals TypedArray
          try {
            const store = useMonstersStore()
            if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
              store.applyMonsterVitalsBatchUpdates([{
                index: monsterIndex,
                currentHealth: monster.currentHealth,
                healthPercentage: monster.healthPercentage
              }], { updateProxies: false })
            }
          } catch (vitalsError) {
            console.error('[DragonForce] 同步 vitals 失败:', vitalsError)
          }

          // 显示龙之劲附加伤害数字
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            const dragonForceSkill = getSkill('combat_master', 'J')
            // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
            let dragonForceText = null
            if (dragonForceResult.multiAttackBonus > 0) {
              const multiplier = (dragonForceResult.multiAttackBonus / 100).toFixed(1)
              dragonForceText = `+${dragonForceResult.bonusDamage}*${multiplier}倍`
            }
            showDamageNumber(
              monsterIndex,
              dragonForceResult.bonusDamage,
              false,
              false,
              dragonForceSkill,
              false,
              dragonForceSkill?.icon || null,
              null,
              false,
              dragonForceText
            )
          }

          // 添加战斗日志
          const totalPercent = dragonForceResult.bonusPercent + dragonForceResult.multiAttackBonus
          if (dragonForceResult.multiAttackBonus > 0) {
            addBattleLog(`龙之劲触发！附加${totalPercent}%攻击力伤害！`)
          } else {
            addBattleLog(`龙之劲触发！附加${dragonForceResult.bonusPercent}%攻击力伤害！`)
          }
        }
      }

      // ========== 影之怨被动：暗夜主宰J技能，普通攻击累计影怨值，达到阈值触发附加伤害 ==========
      if (isShadowGrudgeUnlocked(player.value) && monster.currentHealth > 0) {
        const baseAttack = DamageCalculator.calculateBaseDamage(player)
        const shadowGrudgeResult = processShadowGrudgeOnAttack(player.value, baseAttack)

        // 消耗MP
        if (shadowGrudgeResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - shadowGrudgeResult.mpConsumed)
        }

        // 触发附加伤害
        if (shadowGrudgeResult.triggered && shadowGrudgeResult.bonusDamage > 0) {
          // 应用附加伤害到怪物
          monster.currentHealth = Math.max(0, monster.currentHealth - shadowGrudgeResult.bonusDamage)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          // 同步 vitals TypedArray
          try {
            const store = useMonstersStore()
            if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
              store.applyMonsterVitalsBatchUpdates([{
                index: monsterIndex,
                currentHealth: monster.currentHealth,
                healthPercentage: monster.healthPercentage
              }], { updateProxies: false })
            }
          } catch (vitalsError) {
            console.error('[ShadowGrudge] 同步 vitals 失败:', vitalsError)
          }

          // 显示影之怨附加伤害数字
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            const shadowGrudgeSkill = getSkill('joker_emperor', 'J')
            // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
            let shadowGrudgeText = null
            if (shadowGrudgeResult.multiAttackBonus > 0) {
              const multiplier = (shadowGrudgeResult.multiAttackBonus / 100).toFixed(1)
              shadowGrudgeText = `+${shadowGrudgeResult.bonusDamage}*${multiplier}倍`
            }
            showDamageNumber(
              monsterIndex,
              shadowGrudgeResult.bonusDamage,
              false,
              false,
              shadowGrudgeSkill,
              false,
              shadowGrudgeSkill?.icon || null,
              null,
              false,
              shadowGrudgeText
            )
          }

          // 添加战斗日志
          const totalPercent = shadowGrudgeResult.bonusPercent + shadowGrudgeResult.multiAttackBonus
          if (shadowGrudgeResult.multiAttackBonus > 0) {
            addBattleLog(`影之怨触发！附加${totalPercent}%攻击力伤害！`)
          } else {
            addBattleLog(`影之怨触发！附加${shadowGrudgeResult.bonusPercent}%攻击力伤害！`)
          }
        }
      }

      // ========== 圣光积累被动：炽天使J技能，普通攻击累计圣光值，达到阈值触发治疗 ==========
      if (isHolyAccumulationUnlocked(player.value)) {
        const baseAttack = DamageCalculator.calculateBaseDamage(player)
        const holyResult = processHolyAccumulationOnAttack(player.value, baseAttack)

        // 消耗MP
        if (holyResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - holyResult.mpConsumed)
        }

        // 触发治疗
        if (holyResult.triggered && holyResult.healAmount > 0) {
          const beforeHP = player.value.currentHealth
          // 治疗玩家（无论自身还是全队，玩家都会被治疗）
          player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
          console.log('[圣光积累-DEBUG][Main-手动攻击] ★治疗已应用:', {
            治疗目标: holyResult.targetType,
            治疗量: holyResult.healAmount,
            治疗百分比: holyResult.healPercent,
            倍攻加成: holyResult.multiHealBonus,
            治疗前HP: beforeHP,
            治疗后HP: player.value.currentHealth,
            最大HP: player.value.maxHealth
          })

          // 显示治疗飘字动画（-1 表示玩家位置，true 表示治疗动画）
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            console.log('[圣光积累-DEBUG][Main-手动攻击] 调用showDamageNumber显示治疗动画:', { 治疗量: holyResult.healAmount })
            showDamageNumber(-1, holyResult.healAmount, false, true)
          } else {
            console.warn('[圣光积累-DEBUG][Main-手动攻击] showDamageNumber不可用，无法显示治疗动画')
          }

          // 添加战斗日志
          if (holyResult.targetType === 'self') {
            addBattleLog(`圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`)
          } else if (holyResult.multiHealBonus > 0) {
            addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent + holyResult.multiHealBonus}%攻击力生命值！`)
          } else {
            addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`)
          }
        }
      }

      // ========== 裁决积累被动：圣殿骑士J技能，普通攻击累计裁决值，达到阈值触发附加伤害 ==========
      if (isJudgmentAccumulationUnlocked(player.value) && monster.currentHealth > 0) {
        const baseAttack = DamageCalculator.calculateBaseDamage(player)
        const judgmentResult = processJudgmentAccumulationOnAttack(player.value, baseAttack)

        // 消耗MP
        if (judgmentResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - judgmentResult.mpConsumed)
        }

        // 触发附加伤害
        if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
          // 应用附加伤害到怪物
          monster.currentHealth = Math.max(0, monster.currentHealth - judgmentResult.damageAmount)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          // 同步 vitals TypedArray
          try {
            const store = useMonstersStore()
            if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
              store.applyMonsterVitalsBatchUpdates([{
                index: monsterIndex,
                currentHealth: monster.currentHealth,
                healthPercentage: monster.healthPercentage
              }], { updateProxies: false })
            }
          } catch (vitalsError) {
            console.error('[JudgmentAccumulation] 同步 vitals 失败:', vitalsError)
          }

          // 显示裁决积累附加伤害数字
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            const judgmentSkill = getSkill('holy_knight', 'J')
            let judgmentText = null
            if (judgmentResult.multiAttackBonus > 0) {
              const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
              judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
            }
            showDamageNumber(
              monsterIndex,
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
          const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
          if (judgmentResult.multiAttackBonus > 0) {
            addBattleLog(`裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`)
          } else {
            addBattleLog(`裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`)
          }
        }
      }

      // ========== 奥术充能被动：奥术师J技能，普通攻击累计充能值，达到阈值触发附加伤害 ==========
      if (isArcaneChargeUnlocked(player.value) && monster.currentHealth > 0) {
        const baseAttack = DamageCalculator.calculateBaseDamage(player)
        const arcaneChargeResult = processArcaneChargeOnAttack(player.value, baseAttack)

        // 消耗MP
        if (arcaneChargeResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - arcaneChargeResult.mpConsumed)
        }

        // 触发附加伤害
        if (arcaneChargeResult.triggered && arcaneChargeResult.damageAmount > 0) {
          // 应用附加伤害到怪物
          monster.currentHealth = Math.max(0, monster.currentHealth - arcaneChargeResult.damageAmount)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          // 同步 vitals TypedArray
          try {
            const store = useMonstersStore()
            if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
              store.applyMonsterVitalsBatchUpdates([{
                index: monsterIndex,
                currentHealth: monster.currentHealth,
                healthPercentage: monster.healthPercentage
              }], { updateProxies: false })
            }
          } catch (vitalsError) {
            console.error('[ArcaneCharge] 同步 vitals 失败:', vitalsError)
          }

          // 显示奥术充能附加伤害数字
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            const arcaneChargeSkill = getSkill('arcane_master', 'J')
            let arcaneChargeText = null
            if (arcaneChargeResult.multiAttackBonus > 0) {
              const multiplier = (arcaneChargeResult.multiAttackBonus / 100).toFixed(1)
              arcaneChargeText = `+${arcaneChargeResult.damageAmount}*${multiplier}倍`
            }
            showDamageNumber(
              monsterIndex,
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
          const totalPercent = arcaneChargeResult.damagePercent + arcaneChargeResult.multiAttackBonus
          if (arcaneChargeResult.multiAttackBonus > 0) {
            addBattleLog(`奥术充能触发！附加${totalPercent}%攻击力无属性法术伤害！`)
          } else {
            addBattleLog(`奥术充能触发！附加${arcaneChargeResult.damagePercent}%攻击力无属性法术伤害！`)
          }
        }
      }

      // ========== 碎思归墟被动：心灵师J技能，普通攻击累计充能值，达到阈值触发附加伤害 ==========
      if (isMindChargeUnlocked(player.value) && monster.currentHealth > 0) {
        const playerMaxMana = Number(player.value.maxMana || 0)
        const mindChargeResult = processMindChargeOnAttack(player.value, playerMaxMana)

        // 消耗MP
        if (mindChargeResult.mpConsumed > 0) {
          player.value.currentMana = Math.max(0, player.value.currentMana - mindChargeResult.mpConsumed)
        }

        // 触发附加伤害
        if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
          // 应用附加伤害到怪物
          monster.currentHealth = Math.max(0, monster.currentHealth - mindChargeResult.damageAmount)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          // 同步 vitals TypedArray
          try {
            const store = useMonstersStore()
            if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
              store.applyMonsterVitalsBatchUpdates([{
                index: monsterIndex,
                currentHealth: monster.currentHealth,
                healthPercentage: monster.healthPercentage
              }], { updateProxies: false })
            }
          } catch (vitalsError) {
            console.error('[MindCharge] 同步 vitals 失败:', vitalsError)
          }

          // 显示碎思归墟附加伤害数字
          if (showDamageNumber && typeof showDamageNumber === 'function') {
            const mindChargeSkill = getSkill('mind_master', 'J')
            let mindChargeText = null
            if (mindChargeResult.multiAttackBonus > 0) {
              const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
              mindChargeText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
            }
            showDamageNumber(
              monsterIndex,
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
          const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
          if (mindChargeResult.multiAttackBonus > 0) {
            addBattleLog(`碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`)
          } else {
            addBattleLog(`碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`)
          }
        }
      }

      if (player.value.class === 'fierce_shooter' && monster.currentHealth > 0) {
        const stormArrowsSkill = getSkill('fierce_shooter', 'W')
        if (stormArrowsSkill && typeof stormArrowsSkill.getTriggerChance === 'function') {
          const playerStormSkill = player.value.skills?.W
          if (playerStormSkill) {
            const stormSkillLevel = Number(playerStormSkill.proficiencyLevel || playerStormSkill.level || 0)
            const stormUnlockLevel = stormArrowsSkill.unlockLevel || 1

            // 诊断日志：输出暴风连矢触发条件检查信息
            if (import.meta.env.DEV === true) {
              console.log('[StormArrows] useMonsterBattle 触发条件检查:', {
                class: player.value.class,
                skillLevel: stormSkillLevel,
                playerLevel: player.value.level,
                unlockLevel: stormUnlockLevel,
                hasSkill: Boolean(playerStormSkill)
              })
            }

            if (stormSkillLevel >= 1 && player.value.level >= stormUnlockLevel) {
              // 计算触发概率（叠加暴风连矢EX被动加成）
              let triggerChance = stormArrowsSkill.getTriggerChance(stormSkillLevel)
              // 检查暴风连矢EX被动技能是否已学习，叠加额外触发概率
              const stormExSkill = getSkill('fierce_shooter', 'W_EX')
              const playerStormExSkill = player.value.skills?.W_EX
              if (stormExSkill && typeof stormExSkill.getTriggerChanceBonus === 'function' && playerStormExSkill) {
                const stormExLevel = Number(playerStormExSkill.proficiencyLevel || playerStormExSkill.level || 0)
                if (stormExLevel >= 1) {
                  triggerChance += stormExSkill.getTriggerChanceBonus(stormExLevel)
                }
              }
              const randomRoll = Math.random()
              const triggered = randomRoll < triggerChance / 100

              // 诊断日志：输出触发概率判定结果
              if (import.meta.env.DEV === true) {
                console.log('[StormArrows] useMonsterBattle 触发判定:', {
                  triggerChance: `${triggerChance}%`,
                  randomRoll: `${(randomRoll * 100).toFixed(2)}%`,
                  triggered
                })
              }

              if (triggered) {
                // 触发成功，计算额外箭矢伤害（独立暴击计算，必定命中）
                const stormBaseDamage = DamageCalculator.calculateBaseDamage(player)
                const stormIsCritical = DamageCalculator.checkCritical(player)
                let stormDamage = DamageCalculator.calculateFinalDamage(
                  stormBaseDamage,
                  monster,
                  weapon,
                  player,
                  stormIsCritical
                )

                if (!Number.isFinite(stormDamage) || stormDamage <= 0) {
                  stormDamage = 1
                }

                // 应用伤害到怪物
                monster.currentHealth = Math.max(0, monster.currentHealth - stormDamage)
                monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

                // 同步 vitals TypedArray，让 Canvas 能读取最新血量
                try {
                  const store = useMonstersStore()
                  if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
                    store.applyMonsterVitalsBatchUpdates([{
                      index: monsterIndex,
                      currentHealth: monster.currentHealth,
                      healthPercentage: monster.healthPercentage
                    }], { updateProxies: false })
                  }
                } catch (vitalsError) {
                  console.error('[MonsterBattle] 暴风连矢同步 vitals 失败:', vitalsError)
                }

                // 吸血效果：额外箭矢也触发吸血
                applyLifeSteal(player.value, stormDamage, {
                  addBattleLog,
                  onPlayerHeal: data => {
                    if (data && data.amount > 0 && showDamageNumber && typeof showDamageNumber === 'function') {
                      showDamageNumber(-1, data.amount, false, true)
                    }
                  }
                })

                // 显示暴风连矢伤害数字（格式：暴风连矢图标 + 伤害数值）
                // showDamageNumber 第5个参数传入 skill 对象，DamageNumber.vue 的 iconInfo 会读取 skill.icon 显示图标
                if (showDamageNumber && typeof showDamageNumber === 'function') {
                  showDamageNumber(
                    monsterIndex,
                    stormDamage,
                    stormIsCritical,
                    false,
                    { icon: stormArrowsSkill.icon, name: stormArrowsSkill.name }, // skill 对象，显示暴风连矢图标
                    false,
                    null, // weaponIcon 不传，优先显示技能图标
                    null,
                    false,
                    null,
                    {
                      elementType: weaponElement,
                      elementAdvantage
                    }
                  )
                }

                addBattleLog(`暴风连矢触发！额外箭矢造成 ${stormDamage} 点伤害`)
              }
            }
          }
        }
      }
    } catch (stormArrowsError) {
      console.error('[MonsterBattle] 暴风连矢触发失败:', stormArrowsError)
    }

    if (monster.currentHealth <= 0) {
      monsterDefeated(monster, '帕里大陆').catch(error => {
        console.error('MonsterBattle', '怪物死亡处理失败:', error)
      })
    }
  }

  // 怪物死亡
  const monsterDefeated = async (monster, mapName = null) => {
    monster.isDefeated = true
    monster.currentHealth = 0
    monster.healthPercentage = 0
    // Canvas-First：同步 vitals TypedArray（死亡时血量归零）
    try {
      const store = useMonstersStore()
      if (store && typeof store.applyMonsterVitalsBatchUpdates === 'function') {
        store.applyMonsterVitalsBatchUpdates([{
          index: monsters.value.indexOf(monster),
          currentHealth: 0,
          healthPercentage: 0
        }], { updateProxies: false })
      }
    } catch (vitalsError) {
      console.error('[MonsterBattle] 同步死亡 vitals 失败:', vitalsError)
    }
    const defeatedAt = Date.now()
    if (monster.fadeTimer) {
      monsterTransitionBatcher.cancelFade(monster.fadeTimer)
      monster.fadeTimer = null
    }
    if (monster.hideTimer) {
      monsterTransitionBatcher.cancelHide(monster.hideTimer)
      monster.hideTimer = null
    }
    monster.isFading = false
    monster.isHidden = false
    monster.defeatedAt = defeatedAt
    // 批量过渡调度：通过 MonsterTransitionBatcher 按延迟分桶
    monster.fadeTimer = monsterTransitionBatcher.scheduleFade(monster, 1000)
    monster.hideTimer = monsterTransitionBatcher.scheduleHide(monster, 1000)

    if (audioService && typeof audioService.playMonsterDeathSFX === 'function') {
      const monsterIcon = monster.icon || monster.name
      audioService.playMonsterDeathSFX(monsterIcon)
    }

    let monsterIndex = -1

    if (monster && monster.id !== undefined) {
      monsterIndex = monsters.value.findIndex(m => m && m.id === monster.id)
    }

    if (monsterIndex === -1 && monster) {
      monsterIndex = monsters.value.findIndex(
        m => m && m.name === monster.name && m.level === monster.level
      )
    }

    const playerLevel = player.value.level || 1
    let rewards = null
    let usedWorker = false

    try {
      const monsterConfig = monster?.id ? monstersStore.getMonsterConfig(monster.id) : null
      const expTable = Array.isArray(monster?.experienceTable)
        ? monster.experienceTable
        : Array.isArray(monsterConfig?.experienceTable)
          ? monsterConfig.experienceTable
          : null
      const workerPayload = {
        monster: {
          giveGold: monster?.giveGold ?? null,
          gold: monster?.gold ?? null,
          minDropGold: monster?.minDropGold ?? null,
          maxDropGold: monster?.maxDropGold ?? null,
          experienceTable: expTable,
          drops: Array.isArray(monster?.drops)
            ? monster.drops.map(drop => ({
              item: drop?.item ?? null,
              stack: drop?.stack ?? 1,
              prob: drop?.prob ?? null,
              probability: drop?.probability ?? null,
              rate: drop?.rate ?? null
            }))
            : []
        },
        playerLevel,
        playerMaxExp: player.value.maxExp,
        expTable
      }
      const workerResult = await requestDropWorker(workerPayload)
      if (workerResult) {
        const items = Array.isArray(workerResult.items)
          ? workerResult.items
            .map(drop => DropService.createDropItem(drop, gameData))
            .filter(Boolean)
          : []
        rewards = {
          exp: Number(workerResult.exp) || 0,
          gold: Number(workerResult.gold) || 0,
          items
        }
        usedWorker = true
        console.log('[WorkerPerf] 掉落 Worker 命中', {
          monsterId: monster?.id ?? null,
          exp: rewards.exp,
          gold: rewards.gold,
          items: rewards.items?.length || 0
        })
      } else {
        console.log('[WorkerPerf] 掉落 Worker 无结果', {
          monsterId: monster?.id ?? null
        })
      }
    } catch (error) {
      console.error('MonsterBattle', 'Worker掉落计算失败:', error)
    }

    if (!usedWorker) {
      console.log('[WorkerPerf] 掉落使用主线程计算', {
        monsterId: monster?.id ?? null
      })
      rewards = DropService.processMonsterDrop(
        monster,
        playerLevel,
        player.value.maxExp,
        gameData
      )
    }

    const { calculateActualExperience } = useExperienceCalculator(player, activeBuffs)
    const actualExpReward = calculateActualExperience(rewards.exp)

    if (actualExpReward > 0) {
      const oldExp = player.value.exp
      const oldLevel = player.value.level

      gainExp(actualExpReward)
      checkLevelUp(oldExp, oldLevel)
    }

    // 掉落物统一处理：通过事件通知场景创建掉落动画
    // 无论捡宠是否激活，都先掉落到场景，由捡宠自动拾取或玩家手动点击拾取
    if (rewards.gold > 0) {
      // 金币掉落到场景
      try {
        const dropGoldEvent = new CustomEvent('monster-drop-gold', {
          detail: { gold: rewards.gold, monsterId: monster?.id }
        })
        window.dispatchEvent(dropGoldEvent)
      } catch (e) {
        console.error('[MonsterBattle] 派发掉落金币事件失败:', e)
      }
    }

    if (rewards.items && rewards.items.length > 0) {
      // 物品掉落到场景
      try {
        const dropItemsEvent = new CustomEvent('monster-drop-items', {
          detail: { items: rewards.items, monsterId: monster?.id }
        })
        window.dispatchEvent(dropItemsEvent)
      } catch (e) {
        console.error('[MonsterBattle] 派发掉落物品事件失败:', e)
      }
    }

    if (savePlayerData && typeof savePlayerData === 'function') {
      try {
        savePlayerData()
      } catch (error) {
        console.error('MonsterBattle', '保存函数调用失败:', error)
      }
    }

    const allMonstersDefeated = aliveMonsters.value.length === 0

    if (!allMonstersDefeated) {
      const isAutoBattleMode = autoBattle && (autoBattle.value === true || autoBattle === true)

      if (!isAutoBattleMode) {
        setTimeout(() => {
          replaceDefeatedMonster(monsterIndex, mapName)
        }, 2000)
      }
    }
  }

  // 替换被击败的怪物
  const replaceDefeatedMonster = (monsterIndex, mapName) => {
    const mapMonsters = getMonstersForMap(mapName || '新手村')

    if (mapMonsters.length === 0) {
      return
    }

    const randomIndex = Math.floor(Math.random() * mapMonsters.length)
    const newMonster = { ...mapMonsters[randomIndex] }

    newMonster.isDefeated = false
    newMonster.currentHealth = newMonster.hp || newMonster.health || 100

    let targetIndex = monsterIndex

    if (targetIndex === -1 || targetIndex >= monsters.value.length) {
      targetIndex = monsters.value.findIndex(m => !m || m.isDefeated || m.currentHealth <= 0)

      if (targetIndex === -1) {
        targetIndex = Math.floor(Math.random() * monsters.value.length)
      }
    }

    if (targetIndex < 0 || targetIndex >= monsters.value.length) {
      targetIndex = 0
    }

    monsters.value[targetIndex] = newMonster

    if (updateAllMonstersUIRef && typeof updateAllMonstersUIRef.value === 'function') {
      updateAllMonstersUIRef.value()
    }
  }

  // 检查升级
  const checkLevelUp = (oldExp, oldLevel) => {
    // 检查是否达到升级所需经验，且未达到满级
    while (player.value.exp >= player.value.maxExp && player.value.level < MAX_PLAYER_LEVEL) {
      // 先扣除升级所需经验，再升级（避免使用新等级的maxExp）
      player.value.exp -= player.value.maxExp // 扣除升级所需经验
      player.value.levelUp(gameStore.equipmentSets) // 使用Player类的升级方法，该方法会应用完整的属性计算流程

      // 同步更新背包容量
      itemsStore.updateBagCapacity(player.value.level)

      // 添加战斗日志
      addBattleLog(`升级到 ${player.value.level} 级！`)
      addBattleLog('获得4点自由属性点')

      // 满级后清空经验
      if (player.value.level >= MAX_PLAYER_LEVEL) {
        player.value.exp = 0
        addBattleLog(`恭喜达到满级 ${MAX_PLAYER_LEVEL} 级！`)
        break
      }

      // TODO: 播放升级音效
      // playLevelUpSound();
    }

    // 如果等级发生变化
    if (player.value.level > oldLevel) {
      // 升级后通过store更新玩家数据，确保变化被保存
      if (typeof gameStore.updatePlayer === 'function') {
        gameStore.updatePlayer(player.value, gameStore.equipmentSets)
      }
    }
  }

  return {
    // 状态
    monsters,
    currentMonster,
    aliveMonsters,

    // 方法
    getMonstersForMap,
    refreshMonsters,
    attackMonster,
    monsterDefeated,
    replaceDefeatedMonster
  }
}
