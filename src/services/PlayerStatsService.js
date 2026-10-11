/**
 * 玩家属性计算服务 - 基于old项目完整属性计算逻辑
 * 实现applyFinalStats和calculateBaseStats功能
 */

import { toRaw } from 'vue'
import { CLASS_GROWTH_FORMULAS, getClassName, applyWeaponDamageFormula } from '@/data/classes'
import { ENHANCE_SET_BONUS_TABLE } from '@/data/items'
import { useItemsStore } from '@/store'
import { SetBonusService } from '@/services/SetBonusService'
import { OFFHAND_ATTRIBUTE_RATIO, getOffhandAttackBonus } from '@/composables/useDualWield'
import { getWeaponMasteryBonus, isBowWeapon, isKnuckleWeapon, getOffhandWeaponMasteryBonus } from '@/composables/useWeaponMastery'
import { getHeavyArmorAllResistanceBonus, getHeavyArmorMaxHpBonus } from '@/composables/useHolyKnightEx'
import {
  getMindMasterySkillDamageBonus,
  getMindMasteryCritRateBonus,
  getMindMasteryCritDamageBonus,
  getMindMasteryMagicDefenseBonus,
  getMindMasteryMaxMpBonus
} from '@/composables/useMindMasterEx'

/** 装备加成缓存 */
let equipmentBonusesCache = null
let equipmentBonusesCacheKey = null

export class PlayerStatsService {
  /**
   * 应用最终属性计算
  * @param {Object} player - 玩家对象
  * @param {Array} equipmentSets - 套装数据
  */
  static applyFinalStats (player, equipmentSets = []) {
    // 直接执行完整计算，不再使用缓存
    return this._applyFinalStatsInternal(player, equipmentSets)
  }

  /**
   * 清除装备缓存（保留方法兼容性）
   */
  static clearAllCache () {
    equipmentBonusesCache = null
    equipmentBonusesCacheKey = null
  }

  /**
   * 内部实现：应用最终属性计算
   */
  static _applyFinalStatsInternal (player, equipmentSets = []) {
    // 使用 toRaw 获取原始对象，避免触发 Vue 响应式更新
    // 这样在计算过程中修改 player 属性不会触发 watch
    const rawPlayer = toRaw(player)
    
    // 保存自由属性点和基础属性值，以便在计算后恢复
    const freePoints = rawPlayer.stats?.freePoints || 0
    const baseStrength = rawPlayer.stats?.strength || 1
    const baseAgility = rawPlayer.stats?.agility || 1
    const baseIntelligence = rawPlayer.stats?.intelligence || 1
    const baseConstitution = rawPlayer.stats?.constitution || 1

    // 1. 计算装备基础属性+套装属性+卡片属性加成
    const bonuses = this.calculateEquipmentBonuses(player, equipmentSets)
    
    rawPlayer.equipmentBonuses = { ...bonuses }

    const activeBuffs = Array.isArray(rawPlayer.activeBuffs) ? rawPlayer.activeBuffs : (Array.isArray(player.activeBuffs) ? player.activeBuffs : [])

    if (activeBuffs.length) {
      try {
        const fractionalBonusKeys = new Set([
          'hitRate',
          'dodgeRate',
          'blockRate',
          'criticalRate',
          'attackSpeed',
          'decreasedCastingTime',
          'lifeSteal',
          'healPercent',
          'criticalDamage',
          'hpRegeneration',
          'skillChance',
          'criticalResistance'
        ])
        const getNormalizeKey = parameter => {
          const map = {
            str: 'strength',
            strength: 'strength',
            dex: 'agility',
            dexterity: 'agility',
            agi: 'agility',
            agility: 'agility',
            int: 'intelligence',
            intelligence: 'intelligence',
            sta: 'constitution',
            con: 'constitution',
            vit: 'constitution',
            constitution: 'constitution',
            maxhp: 'maxHealth',
            hp: 'maxHealth',
            maxhealth: 'maxHealth',
            maxhppercentage: 'maxHealth',
            maxhp_percent: 'maxHealth',
            maxmp: 'maxMana',
            maxmana: 'maxMana',
            magicdefense: 'magicDefense',
            mp: 'maxMana',
            def: 'defense',
            defense: 'defense',
            attack: 'attack',
            attackmin: 'attackMin',
            attackmax: 'attackMax',
            minattackbonus: 'attackMin',
            maxattackbonus: 'attackMax',
            damage: 'attack',
            speed: 'attackSpeed',
            attackspeed: 'attackSpeed',
            attack_speed: 'attackSpeed',
            attackspeedpercentage: 'attackSpeed',
            attackspeed_percent: 'attackSpeed',
            castspeedpercentage: 'decreasedCastingTime',
            castspeed_percent: 'decreasedCastingTime',
            castspeed: 'decreasedCastingTime',
            critrate: 'criticalRate',
            criticalrate: 'criticalRate',
            criticalchance: 'criticalRate',
            criticaldamage: 'criticalDamage',
            dodgerate: 'dodgeRate',
            evasion: 'dodgeRate',
            evasioncapbonus: 'evasionCapBonus',
            block: 'blockRate',
            blockrate: 'blockRate',
            hitrate: 'hitRate',
            stealhp: 'lifeSteal',
            healing: 'healPercent',
            hprestoration: 'hpRegeneration',
            hpregeneration: 'hpRegeneration',
            hp_regeneration: 'hpRegeneration',
            healpercent: 'healPercent',
            skilldamage: 'skillDamage',
            skillchance: 'skillChance',
            decreasedcastingtime: 'decreasedCastingTime',
            decreasedmpconsumption: 'decreasedMpConsumption',
            decreasedfpconsumption: 'decreasedFpConsumption',
            blockpenetration: 'blockPenetration',
            bowattack: 'bowAttack',
            yoyoattack: 'yoyoAttack',
            axeattack: 'axeAttack',
            swordattack: 'swordAttack',
            firemastery: 'fireAttack',
            watermastery: 'waterAttack',
            windmastery: 'windAttack',
            thundermastery: 'thunderAttack',
            electricitymastery: 'thunderAttack',
            fireattack: 'fireAttack',
            waterattack: 'waterAttack',
            windattack: 'windAttack',
            thunderattack: 'thunderAttack',
            earthattack: 'earthAttack',
            elementattack: 'fireAttack',
            stun: 'stun',
            stunchance: 'stun',
            allelementsmastery: 'allElementsMastery',
            allelementsmastry: 'allElementsMastery',
            // 属性抗性映射
            firedefense: 'fireDefense',
            waterdefense: 'waterDefense',
            winddefense: 'windDefense',
            earthdefense: 'earthDefense',
            electricitydefense: 'thunderDefense',
            thunderdefense: 'thunderDefense',
            fireresist: 'fireDefense',
            waterresist: 'waterDefense',
            windresist: 'windDefense',
            earthresist: 'earthDefense',
            electricityresist: 'thunderDefense',
            thunderresist: 'thunderDefense'
          }
          return map[String(parameter || '').toLowerCase()] || String(parameter || '')
        }
        // 标记是否已处理过攻击力百分比（避免 attackMin 和 attackMax 重复加成）
        let attackPercentApplied = false
        // 标记是否已处理过防御力百分比（避免 defenseMin 和 defenseMax 重复加成）
        let defensePercentApplied = false

        const applyBuffValue = (key, value, rate = false, source = 'skill') => {
          if (!Number.isFinite(value) || value === 0) {
            return
          }
          if (key === 'maxHealth') {
            bonuses[rate ? 'maxHealthPercentage' : 'maxHealth'] += value
            return
          }
          if (key === 'maxMana') {
            bonuses[rate ? 'maxManaPercentage' : 'maxMana'] += value
            return
          }
          if (key === 'attack') {
            // rate=true 时作为百分比加成（乘法叠加）
            if (rate) {
              bonuses.attackPercentageMultipliers.push(value / 100)
            } else {
              // 道具固定值存入 itemAttack，其他存入 attack
              if (source === 'item') {
                bonuses.itemAttack += value
              } else {
                bonuses.attack += value
              }
            }
            return
          }
          if (key === 'attackMin' || key === 'attackMax') {
            // 支持 rate 参数：rate=true 时作为百分比加成（乘法叠加）
            // 注意：attackMin 和 attackMax 通常同时存在且值相同，rate=true 时只加一次百分比
            if (rate) {
              if (!attackPercentApplied) {
                bonuses.attackPercentageMultipliers.push(value / 100)
                attackPercentApplied = true
              }
            } else if (key === 'attackMin') {
              bonuses.attackMin += value
            } else {
              bonuses.attackMax += value
            }
            return
          }
          if (key === 'defense') {
            // rate=true 时作为百分比加成（乘法叠加）
            if (rate) {
              bonuses.defensePercentageMultipliers.push(value / 100)
            } else {
              // 道具固定值存入 itemDefense，其他存入 defense
              if (source === 'item') {
                bonuses.itemDefense += value
              } else {
                bonuses.defense += value
              }
            }
            return
          }
          // 处理 defenseMin 和 defenseMax 的百分比加成（狂暴技能等）
          if (key === 'defenseMin' || key === 'defenseMax') {
            // 支持 rate 参数：rate=true 时作为百分比加成（乘法叠加）
            // 注意：defenseMin 和 defenseMax 通常同时存在且值相同，rate=true 时只加一次百分比
            if (rate) {
              if (!defensePercentApplied) {
                bonuses.defensePercentageMultipliers.push(value / 100)
                defensePercentApplied = true
              }
            } else if (key === 'defenseMin') {
              bonuses.defenseMin += value
            } else {
              bonuses.defenseMax += value
            }
            return
          }
          // 处理防御力百分比（守护术等技能使用此字段名）
          // 注意：getNormalizeKey 会将 key 转换为小写，所以这里要比较小写形式
          if (key === 'defensePercentage' || key === 'defensepercentage') {
            // 防御力百分比使用乘法叠加
            bonuses.defensePercentageMultipliers.push(value / 100)
            return
          }
          // 处理魔法防御力百分比（守护术等技能使用此字段名）
          if (key === 'magicDefensePercentage' || key === 'magicdefensepercentage') {
            bonuses.magicDefensePercentage += value
            return
          }
          // 处理魔法防御力：rate=true 时作为百分比加成（心灵觉醒R技能、心灵感应Q技能等）
          if (key === 'magicDefense') {
            if (rate) {
              bonuses.magicDefensePercentage += value
            } else {
              bonuses.magicDefense += value
            }
            return
          }
          // 处理全元素抗性：将加成分配到五种元素抗性（心灵觉醒EX2-心灵共振等）
          if (key === 'allElementResistance' || key === 'allelementresistance') {
            const amount = rate ? value : value
            bonuses.fireDefense += amount
            bonuses.waterDefense += amount
            bonuses.windDefense += amount
            bonuses.earthDefense += amount
            bonuses.thunderDefense += amount
            return
          }
          // 高效术：同时增加攻击速度和施法速度
          if (key === 'attackCastSpeedPercentage') {
            let amount = value
            if (rate) {
              amount = value / 100
            } else if (value > 1) {
              amount = value / 100
            }
            bonuses.attackSpeed += amount
            bonuses.decreasedCastingTime += amount
            return
          }
          if (fractionalBonusKeys.has(key)) {
            // lifeSteal (吸血) 特殊处理：
            // - possibleRandomStats 中的 stealhp 值已经是百分比形式（1.5 表示 1.5%）
            // - abilities 中的 stealhp 值也是百分比形式（0.8 表示 0.8%）
            // - 统一处理：直接使用值，不需要除以 100
            let amount
            if (key === 'lifeSteal') {
              // 吸血：值本身已经是百分比，直接使用（1.5 表示 1.5%）
              amount = value
            } else {
              if (rate) {
                amount = value / 100
              } else if (value > 1) {
                amount = value / 100
              } else {
                amount = value
              }
            }
            bonuses[key] += amount
            return
          }
          // 处理全元素精通：同时增加五种元素攻击属性
          if (key === 'allElementsMastery') {
            const amount = rate ? value : (value > 1 ? value : value * 100)
            bonuses.fireAttack += amount
            bonuses.waterAttack += amount
            bonuses.windAttack += amount
            bonuses.thunderAttack += amount
            bonuses.earthAttack += amount
            return
          }
          if (Object.prototype.hasOwnProperty.call(bonuses, key)) {
            bonuses[key] += value
          }
        }
        activeBuffs.forEach((buff) => {
          if (!buff || typeof buff !== 'object') {
            return
          }
          // 支持 effect 和 effects 两种字段名
          const effects = buff.effects || buff.effect
          if (effects && typeof effects === 'object') {
            const defaultRate = Boolean(buff.effectsRate)
            Object.entries(effects).forEach(([key, rawValue]) => {
              let numeric = Number(rawValue)
              let currentRate = defaultRate
              let paramKey = key

              // 处理新的对象格式 { add, rate, description, type }
              if (rawValue && typeof rawValue === 'object') {
                if (rawValue.add !== undefined) {
                  numeric = Number(rawValue.add)
                }
                if (rawValue.rate !== undefined) {
                  currentRate = Boolean(rawValue.rate)
                }
                if (rawValue.type) {
                  paramKey = rawValue.type
                }
              }

              if (!Number.isFinite(numeric) || numeric === 0) {
                return
              }
              const normalizedKey = getNormalizeKey(paramKey)
              applyBuffValue(normalizedKey, numeric, currentRate, buff.source)
            })
          }
          // 如果 effects 已处理过，跳过 parameter/value 的处理，避免重复加成
          if (effects && typeof effects === 'object' && Object.keys(effects).length > 0) {
            return
          }
          const rawValue = buff.value ?? buff.add ?? buff.amount
          const numericValue = Number(rawValue)
          if (!Number.isFinite(numericValue) || numericValue === 0) {
            return
          }
          const rawParameter = buff.parameter ?? buff.type ?? ''
          if (!rawParameter) {
            return
          }
          const normalizedKey = getNormalizeKey(rawParameter)
          const rate = Boolean(buff.rate)
          applyBuffValue(normalizedKey, numericValue, rate, buff.source)
        })

      // 处理元素攻击类型BUFF（type: 'elementAttack'）
      activeBuffs.forEach((buff) => {
        if (!buff || typeof buff !== 'object') {
          return
        }
        if (buff.type === 'elementAttack' && buff.element && buff.attackPercent) {
          const elementAttackKeyMap = {
            fire: 'fireAttack',
            water: 'waterAttack',
            wind: 'windAttack',
            thunder: 'thunderAttack',
            earth: 'earthAttack',
            electricity: 'thunderAttack'
          }
          const elementKey = elementAttackKeyMap[buff.element] || `${buff.element}Attack`
          const attackPercent = Number(buff.attackPercent) || 0
          if (Number.isFinite(attackPercent) && attackPercent > 0 && bonuses[elementKey] !== undefined) {
            bonuses[elementKey] += attackPercent
          }
        }
      })
      } catch (error) {
        console.error('[PlayerStatsService] BUFF属性处理失败:', error)
      }
    }

    // 一次性设置 stats 对象，避免多次触发响应式更新
    const enhancedStrength = baseStrength + (bonuses.strength || 0)
    const enhancedAgility = baseAgility + (bonuses.agility || 0)
    const enhancedIntelligence = baseIntelligence + (bonuses.intelligence || 0)
    const enhancedConstitution = baseConstitution + (bonuses.constitution || bonuses.stamina || 0)

    rawPlayer.stats = {
      ...(rawPlayer.stats || {}),
      strength: enhancedStrength,
      agility: enhancedAgility,
      intelligence: enhancedIntelligence,
      constitution: enhancedConstitution
    }

    // 2. 计算基础属性
    const baseStats = this.calculateBaseStats(rawPlayer)
   
    // 3. 计算基础攻击力（包含职业特性加成）
    const levelAttackBonus = baseStats.maxAttack || baseStats.attack
    rawPlayer.baseAttack = this.calculateBaseAttack(rawPlayer, levelAttackBonus)
   
    // 4. 应用所有加成属性
    // 最大生命值
    rawPlayer.maxHealth = baseStats.maxHealth + (bonuses.maxHealth || 0)
    // 应用最大生命值百分比
    if (bonuses.maxHealthPercentage > 0) {
      rawPlayer.maxHealth = Math.floor(rawPlayer.maxHealth * (1 + bonuses.maxHealthPercentage / 100))
    }

    // 重甲精通EX2-增强生命值被动：额外增加最大生命值15%（180级解锁）
    const heavyArmorMaxHpBonus = getHeavyArmorMaxHpBonus(rawPlayer)
    if (heavyArmorMaxHpBonus > 0) {
      rawPlayer.maxHealth = Math.floor(rawPlayer.maxHealth * (1 + heavyArmorMaxHpBonus / 100))
    }

    // 最大魔法值
    rawPlayer.maxMana = baseStats.maxMana + (bonuses.maxMana || 0)
    // 应用最大魔法值百分比
    if (bonuses.maxManaPercentage > 0) {
      rawPlayer.maxMana = Math.floor(rawPlayer.maxMana * (1 + bonuses.maxManaPercentage / 100))
    }
    // 星念凝徽EX3-精神回复被动：额外增加最大MP30%（190级解锁）
    const mindMasteryMaxMpBonus = getMindMasteryMaxMpBonus(rawPlayer)
    if (mindMasteryMaxMpBonus > 0) {
      rawPlayer.maxMana = Math.floor(rawPlayer.maxMana * (1 + mindMasteryMaxMpBonus / 100))
    }

    // 确保当前生命值和魔法值不超过最大值
    rawPlayer.currentHealth = Math.min(rawPlayer.currentHealth, rawPlayer.maxHealth)
    rawPlayer.currentMana = Math.min(rawPlayer.currentMana, rawPlayer.maxMana)

    // 恢复基础属性值（不包含装备加成）
    // 注意：player.stats 应保持为基础值，calculateBaseStats 等函数依赖基础值
    // Buff加成等额外属性通过 equipmentBonuses 和 activeBuffs 单独存储
    if (!rawPlayer.stats) {
      rawPlayer.stats = {}
    }
    rawPlayer.stats.strength = baseStrength
    rawPlayer.stats.agility = baseAgility
    rawPlayer.stats.intelligence = baseIntelligence
    rawPlayer.stats.constitution = baseConstitution

    // 计算装备的最小和最大攻击力
    let totalMinAttack = 0
    let totalMaxAttack = 0
    let totalMinDefense = 0
    let totalMaxDefense = 0

    if (rawPlayer.equipment) {
      Object.entries(rawPlayer.equipment).forEach(([slotKey, item]) => {
        if (!item) {
          return
        }
        const enhanceLevel = Number(
          item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0
        )
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(enhanceLevel)] || {}
        // 双刀流副手检测：shield槽位中的weapon类型物品即为副手武器
        const isOffhandWeapon = item._isOffhandWeapon === true ||
          (slotKey === 'shield' && item.category === 'weapon')
        if (item.category === 'weapon') {
          const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
          const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
          const processedItem =
            Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
              ? applyWeaponDamageFormula({
                ...item,
                minAttack: enhancedMin,
                maxAttack: enhancedMax
              })
              : applyWeaponDamageFormula(item)
          // 双刀流：副手武器仅获得50%攻击力加成
          const offhandRatio = isOffhandWeapon ? OFFHAND_ATTRIBUTE_RATIO : 1
          // R技能熟练度：副手武器攻击力额外加成（1级+5%，10级+50%）
          const offhandAtkBonus = isOffhandWeapon ? getOffhandAttackBonus(player) : 0
          let scaledMinAttack = Math.floor((processedItem.minAttack || 0) * offhandRatio * (1 + offhandAtkBonus))
          let scaledMaxAttack = Math.floor((processedItem.maxAttack || 0) * offhandRatio * (1 + offhandAtkBonus))

          // 武器精通被动技能：装备弓箭或拳套时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
          // 仅对主手武器生效，且仅对弓箭/拳套类型生效
          if (!isOffhandWeapon && (isBowWeapon(item) || isKnuckleWeapon(item))) {
            const masteryBonus = getWeaponMasteryBonus(player)
            if (masteryBonus > 0) {
              // 基于武器基础攻击力（item.minAttack/maxAttack），非强化后攻击力
              const baseMinAttack = Number(item.minAttack) || 0
              const baseMaxAttack = Number(item.maxAttack) || 0
              scaledMinAttack += Math.floor(baseMinAttack * masteryBonus)
              scaledMaxAttack += Math.floor(baseMaxAttack * masteryBonus)
            }
          }

          // 武器精通-副手武器被动技能：副手装备武器时，按熟练度百分比增加副手武器基础攻击力
          // 仅对副手武器生效（I + I_EX1 + I_EX2 的总加成比例）
          if (isOffhandWeapon) {
            const offhandMasteryBonus = getOffhandWeaponMasteryBonus(player)
            if (offhandMasteryBonus > 0) {
              const baseMinAttack = Number(item.minAttack) || 0
              const baseMaxAttack = Number(item.maxAttack) || 0
              scaledMinAttack += Math.floor(baseMinAttack * offhandMasteryBonus)
              scaledMaxAttack += Math.floor(baseMaxAttack * offhandMasteryBonus)
            }
          }

          totalMinAttack += scaledMinAttack
          totalMaxAttack += scaledMaxAttack
        } else {
          totalMinAttack += item.minAttack || 0
          totalMaxAttack += item.maxAttack || 0
        }
        const enhancedMinDefense = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMaxDefense = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        if (Number.isFinite(enhancedMinDefense) && Number.isFinite(enhancedMaxDefense)) {
          totalMinDefense += enhancedMinDefense
          totalMaxDefense += enhancedMaxDefense
        } else {
          totalMinDefense += item.minDefense || 0
          totalMaxDefense += item.maxDefense || 0
        }
      })
    }

    // 应用基础攻击力
    rawPlayer.minAttack = baseStats.minAttack + totalMinAttack
    rawPlayer.maxAttack = baseStats.maxAttack + totalMaxAttack

    // 应用基础防御力
    rawPlayer.minDefense = baseStats.minDefense + totalMinDefense
    rawPlayer.maxDefense = baseStats.maxDefense + totalMaxDefense

    // 应用攻击力固定值加成（先于百分比加成）- 来自技能的 attackMin/Max
    if (bonuses.attackMin || bonuses.attackMax) {
      const minBonus = bonuses.attackMin || 0
      const maxBonus = bonuses.attackMax || 0
      rawPlayer.minAttack += minBonus
      rawPlayer.maxAttack += maxBonus || minBonus
    }

    // 应用攻击力固定值加成（先于百分比加成）- 来自装备的 bonuses.attack
    if (bonuses.attack) {
      rawPlayer.minAttack += bonuses.attack
      rawPlayer.maxAttack += bonuses.attack
    }

    // 应用攻击力固定值加成（先于百分比加成）- 来自道具的 itemAttack
    if (bonuses.itemAttack) {
      rawPlayer.minAttack += bonuses.itemAttack
      rawPlayer.maxAttack += bonuses.itemAttack
    }

    // 应用攻击力百分比（乘法叠加）- 在所有固定值加成之后应用
    // 计算顺序：(基础攻击 + 所有固定值加成) × 百分比加成
    if (bonuses.attackPercentageMultipliers.length > 0) {
      for (const multiplier of bonuses.attackPercentageMultipliers) {
        rawPlayer.minAttack = Math.floor(rawPlayer.minAttack * (1 + multiplier))
        rawPlayer.maxAttack = Math.floor(rawPlayer.maxAttack * (1 + multiplier))
      }
    }

    // 应用防御力固定值加成（先于百分比加成）- 来自技能的 defenseMin/Max
    if (bonuses.defenseMin || bonuses.defenseMax) {
      const minBonus = bonuses.defenseMin || 0
      const maxBonus = bonuses.defenseMax || 0
      rawPlayer.minDefense += minBonus
      rawPlayer.maxDefense += maxBonus || minBonus
    }

    // 应用防御力固定值加成（先于百分比加成）- 来自装备的 bonuses.defense
    if (bonuses.defense) {
      rawPlayer.minDefense += bonuses.defense
      rawPlayer.maxDefense += bonuses.defense
    }

    // 应用防御力固定值加成（先于百分比加成）- 来自道具的 itemDefense
    if (bonuses.itemDefense) {
      rawPlayer.minDefense += bonuses.itemDefense
      rawPlayer.maxDefense += bonuses.itemDefense
    }

    // 应用防御力百分比（乘法叠加）- 在所有固定值加成之后应用
    // 计算顺序：(基础防御 + 固定值加成) × 百分比加成
    // 例如：(530 + 462) × 1.12 = 992 × 1.12 = 1111.04
    if (bonuses.defensePercentageMultipliers.length > 0) {
      for (const multiplier of bonuses.defensePercentageMultipliers) {
        rawPlayer.minDefense = Math.floor(rawPlayer.minDefense * (1 + multiplier))
        rawPlayer.maxDefense = Math.floor(rawPlayer.maxDefense * (1 + multiplier))
      }
    }

    // 应用临时攻击力加成
    if (rawPlayer.tempStats) {
      if (rawPlayer.tempStats.attack) {
        rawPlayer.minAttack += rawPlayer.tempStats.attack
        rawPlayer.maxAttack += rawPlayer.tempStats.attack
      }

      // 应用武器特定攻击力加成
      const mainHandItem = rawPlayer.equipmentBag?.find(item => item.slotId === 'weaponSlot')
      if (mainHandItem) {
        // 对主手武器应用武器伤害计算公式
        const processedMainHandItem = applyWeaponDamageFormula(mainHandItem)

        if (processedMainHandItem.subcategory === 'bow' && rawPlayer.tempStats.bowAttack) {
          rawPlayer.minAttack += rawPlayer.tempStats.bowAttack
          rawPlayer.maxAttack += rawPlayer.tempStats.bowAttack
        } else if (processedMainHandItem.subcategory === 'yoyo' && rawPlayer.tempStats.yoyoAttack) {
          rawPlayer.minAttack += rawPlayer.tempStats.yoyoAttack
          rawPlayer.maxAttack += rawPlayer.tempStats.yoyoAttack
        }
      }
    }

    // 确保攻击力为整数
    rawPlayer.minAttack = Math.floor(rawPlayer.minAttack)
    rawPlayer.maxAttack = Math.floor(rawPlayer.maxAttack)
    rawPlayer.minDefense = Math.floor(rawPlayer.minDefense)
    rawPlayer.maxDefense = Math.floor(rawPlayer.maxDefense)

    // 移除attack和defense兼容性字段，使用minAttack/maxAttack和minDefense/maxDefense
    // player.attack = Math.floor((player.minAttack + player.maxAttack) / 2);
    // player.defense = Math.floor((player.minDefense + player.maxDefense) / 2);

    rawPlayer.magicDefense = (baseStats.magicDefense || 0) + (bonuses.magicDefense || 0)
    // 应用魔法防御百分比加成
    if (bonuses.magicDefensePercentage > 0) {
      rawPlayer.magicDefense = Math.floor(rawPlayer.magicDefense * (1 + bonuses.magicDefensePercentage / 100))
    }
    // 星念凝徽EX2-精神壁垒被动：额外增加魔法防御25%（180级解锁）
    const mindMasteryMagicDefenseBonus = getMindMasteryMagicDefenseBonus(rawPlayer)
    if (mindMasteryMagicDefenseBonus > 0) {
      rawPlayer.magicDefense = Math.floor(rawPlayer.magicDefense * (1 + mindMasteryMagicDefenseBonus / 100))
    }
    // 命中率
    rawPlayer.hitRate = baseStats.hitRate + (bonuses.hitRate || 0)
    // 闪避率（暗影斗篷BUFF期间上限提升至50%，默认上限30%）
    const evasionCap = (bonuses.evasionCapBonus || 0) > 0 ? 0.5 : 0.3
    rawPlayer.dodgeRate = Math.min(baseStats.dodgeRate + (bonuses.dodgeRate || 0), evasionCap)
    // 格挡率
    rawPlayer.blockRate = baseStats.blockRate + (bonuses.blockRate || 0)
    // 暴击率
    rawPlayer.criticalRate = baseStats.criticalRate + (bonuses.criticalRate || 0)
    // 星念凝徽被动：额外增加暴击率（1级3%，每级+3%，5级15%）
    const mindMasteryCritRateBonus = getMindMasteryCritRateBonus(rawPlayer)
    if (mindMasteryCritRateBonus > 0) {
      rawPlayer.criticalRate += mindMasteryCritRateBonus / 100
    }
    // 暴击伤害
    rawPlayer.criticalDamage = 1.5 + (Number(bonuses.criticalDamage) || 0)
    // 星念凝徽EX1-暴击强化被动：额外增加暴击伤害10%（170级解锁）
    const mindMasteryCritDamageBonus = getMindMasteryCritDamageBonus(rawPlayer)
    if (mindMasteryCritDamageBonus > 0) {
      rawPlayer.criticalDamage += mindMasteryCritDamageBonus / 100
    }
    rawPlayer.healPercent = (baseStats.healPercent || 0) + (bonuses.healPercent || 0)
    // 生命偷取
    rawPlayer.lifeSteal = (baseStats.lifeSteal || 0) + (bonuses.lifeSteal || 0)
    // 攻击速度
    rawPlayer.attackSpeed = baseStats.attackSpeed + (bonuses.attackSpeed || 0)
    // 应用技能伤害
    rawPlayer.skillDamage = (baseStats.skillDamage || 0) + (bonuses.skillDamage || 0)
    // 星念凝徽被动：额外增加技能伤害（1级6%，每级+6%，5级30%）
    const mindMasterySkillDamageBonus = getMindMasterySkillDamageBonus(rawPlayer)
    if (mindMasterySkillDamageBonus > 0) {
      rawPlayer.skillDamage += mindMasterySkillDamageBonus
    }
    rawPlayer.skillChance = (baseStats.skillChance || 0) + (bonuses.skillChance || 0)
    rawPlayer.hpRegeneration = (baseStats.hpRegeneration || 0) + (bonuses.hpRegeneration || 0)

    // 应用技能消耗减少
    rawPlayer.decreasedMpConsumption =
      (baseStats.decreasedMpConsumption || 0) + (bonuses.decreasedMpConsumption || 0)
    rawPlayer.decreasedFpConsumption =
      (baseStats.decreasedFpConsumption || 0) + (bonuses.decreasedFpConsumption || 0)
    // 应用击杀MP恢复
    rawPlayer.mpRecoveryAfterKill =
      (baseStats.mpRecoveryAfterKill || 0) + (bonuses.mpRecoveryAfterKill || 0)
    // 应用格挡穿透
    rawPlayer.blockPenetration = (baseStats.blockPenetration || 0) + (bonuses.blockPenetration || 0)

    // 应用施法速度
    rawPlayer.decreasedCastingTime =
      baseStats.decreasedCastingTime + (bonuses.decreasedCastingTime || 0)

    // 应用元素攻击
    rawPlayer.fireAttack = bonuses.fireAttack || 0
    rawPlayer.waterAttack = bonuses.waterAttack || 0
    rawPlayer.thunderAttack = bonuses.thunderAttack || 0
    rawPlayer.windAttack = bonuses.windAttack || 0
    rawPlayer.earthAttack = bonuses.earthAttack || 0

    // 应用武器特定攻击
    rawPlayer.bowAttack = bonuses.bowAttack || 0
    rawPlayer.yoyoAttack = bonuses.yoyoAttack || 0
    rawPlayer.axeAttack = bonuses.axeAttack || 0
    rawPlayer.swordAttack = bonuses.swordAttack || 0

    // 应用眩晕率
    rawPlayer.stun = bonuses.stun || 0

    // 应用PVE属性
    rawPlayer.pveDamage = bonuses.pveDamage || 0
    rawPlayer.pveDamageReduction = bonuses.pveDamageReduction || 0

    // 应用暴击抗性
    rawPlayer.criticalResistance = bonuses.criticalResistance || 0

    // 应用属性抗性（百分比形式）
    rawPlayer.fireDefense = bonuses.fireDefense || 0
    rawPlayer.waterDefense = bonuses.waterDefense || 0
    rawPlayer.windDefense = bonuses.windDefense || 0
    rawPlayer.earthDefense = bonuses.earthDefense || 0
    rawPlayer.thunderDefense = bonuses.thunderDefense || 0

    // 重甲精通EX1-属性抗性增强被动：增加所有属性抗性10%（170级解锁）
    const heavyArmorResistanceBonus = getHeavyArmorAllResistanceBonus(rawPlayer)
    if (heavyArmorResistanceBonus > 0) {
      rawPlayer.fireDefense += heavyArmorResistanceBonus
      rawPlayer.waterDefense += heavyArmorResistanceBonus
      rawPlayer.windDefense += heavyArmorResistanceBonus
      rawPlayer.earthDefense += heavyArmorResistanceBonus
      rawPlayer.thunderDefense += heavyArmorResistanceBonus
    }

    // 应用击杀HP恢复
    rawPlayer.hpRecoveryAfterKill =
      (baseStats.hpRecoveryAfterKill || 0) + (bonuses.hpRecoveryAfterKill || 0)

    // 恢复自由属性点
    if (!rawPlayer.stats) {
      rawPlayer.stats = {}
    }
    rawPlayer.stats.freePoints = freePoints

    return player
  }

  /**
   * 计算基础属性
   * @param {Object} player - 玩家对象
   * @returns {Object} 基础属性对象
   */
  static calculateBaseStats (player) {
    const className = getClassName(player.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}
    const constitutionGrowth = pointGrowth?.体质 || {}
    const intelligenceGrowth = pointGrowth?.智力 || {}
    const strengthGrowth = pointGrowth?.力量 || {}

    // 基础生命值 + 等级成长 + 体质加成
    const baseHp = levelGrowth.生命值 || 0
    const levelHp = baseHp * player.level
    const constitutionHp =
      (player.stats?.constitution || 1) * (constitutionGrowth.生命值 || 0)
    const maxHealth = Math.floor(100 + levelHp + constitutionHp)

    // 基础魔法值 + 等级成长 + 智力加成
    const baseMp = levelGrowth.魔法值 || 0
    const levelMp = baseMp * player.level
    const intelligenceMp =
      (player.stats?.intelligence || 1) * (intelligenceGrowth.魔法值 || 0)
    const maxMana = Math.floor(100 + levelMp + intelligenceMp)

    // 基础魔法防御 + 等级成长 + 智力加成
    const baseMagicDefensePerLevel = levelGrowth.魔法防御 || 0
    const levelMagicDefense = baseMagicDefensePerLevel * player.level
    const intelligenceMagicDefense =
      (player.stats?.intelligence || 1) * (intelligenceGrowth.魔法防御 || 0)
    const magicDefense = Math.floor(levelMagicDefense + intelligenceMagicDefense)

    // 基础攻击力 + 等级成长 + 主属性加成
    const baseMinAttackPerLevel = levelGrowth.最小攻击力 || 0
    const baseMaxAttackPerLevel = levelGrowth.最大攻击力 || 0
    const levelMinAttack = baseMinAttackPerLevel * player.level
    const levelMaxAttack = baseMaxAttackPerLevel * player.level

    let mainStatMinAttackBonus = 0
    let mainStatMaxAttackBonus = 0

    // 主属性攻击力加成判断（包含一转、二转和三转职业）
    // 力量主属性职业：战士、骑士、刀锋战士、暗杀者、暴力技师、圣殿骑士、猎杀者、格斗宗师、暗夜主宰
    // 智力主属性职业：魔导士、元素使者、精神使者、圣职者、守护使者、奥术师、心灵师、炽天使
    // 敏捷主属性职业：弓箭手、游侠、爆裂射手
    const strengthClasses = ['warrior', 'knight', 'blade_warrior', 'assassin', 'technician', 'holy_knight', 'storm_walker', 'combat_master', 'joker_emperor']
    const intelligenceClasses = ['mage', 'element_mage', 'spirit_mage', 'priest', 'guardian', 'arcane_master', 'mind_master', 'nature_messenger']
    const agilityClasses = ['archer', 'ranger', 'fierce_shooter']

    if (strengthClasses.includes(player.class)) {
      const strength = player.stats?.strength || 1
      mainStatMinAttackBonus = strength * (strengthGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = strength * (strengthGrowth?.最大攻击力 || 0)
    } else if (intelligenceClasses.includes(player.class)) {
      const intelligence = player.stats?.intelligence || 1
      mainStatMinAttackBonus = intelligence * (intelligenceGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = intelligence * (intelligenceGrowth?.最大攻击力 || 0)
    } else if (agilityClasses.includes(player.class)) {
      const agility = player.stats?.agility || 1
      mainStatMinAttackBonus = agility * (agilityGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = agility * (agilityGrowth?.最大攻击力 || 0)
    } else {
      // beginner 或其他未识别职业，使用力量作为主属性
      const strength = player.stats?.strength || 1
      mainStatMinAttackBonus = strength * (strengthGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = strength * (strengthGrowth?.最大攻击力 || 0)
    }

    // 基础攻击力 + 等级成长 + 主属性加成
    // 根据项目要求，新创建角色应有基础攻击力（最小攻击力默认1，最大攻击力默认10）
    const baseMinAttack = 1 // 基础最小攻击力
    const baseMaxAttack = 10 // 基础最大攻击力

    const minAttack = Math.floor(baseMinAttack + levelMinAttack + mainStatMinAttackBonus)
    const maxAttack = Math.floor(baseMaxAttack + levelMaxAttack + mainStatMaxAttackBonus)

    // 基础防御力 + 等级成长 + 体质加成
    const baseMinDefensePerLevel = levelGrowth.最小防御力 || 0
    const baseMaxDefensePerLevel = levelGrowth.最大防御力 || 0
    const levelMinDefense = baseMinDefensePerLevel * player.level
    const levelMaxDefense = baseMaxDefensePerLevel * player.level
    const constitutionMinDefense =
      (player.stats?.constitution || 1) * (constitutionGrowth.最小防御力 || 0)
    const constitutionMaxDefense =
      (player.stats?.constitution || 1) * (constitutionGrowth.最大防御力 || 0)
    const minDefense = Math.floor(levelMinDefense + constitutionMinDefense)
    const maxDefense = Math.floor(levelMaxDefense + constitutionMaxDefense)

    // 基础暴击率（无上限）
    const baseCrit = agilityGrowth.暴击率 || 0
    const agilityCrit = (player.stats?.agility || 1) * baseCrit
    const criticalRate = agilityCrit / 100

    // 基础攻击速度（上限100%）
    const baseSpeed = agilityGrowth.攻击速度 || 0
    const agilitySpeed = (player.stats?.agility || 1) * baseSpeed
    const attackSpeed = Math.min(0.3 + agilitySpeed / 100, 1.0)

    // 基础命中率（无上限）
    const baseHit = agilityGrowth.命中率 || 0
    const agilityHit = (player.stats?.agility || 1) * baseHit
    const hitRate = 0.3 + agilityHit / 100

    // 基础格挡率（上限100%）
    const baseBlock = agilityGrowth.格挡率 || 0
    const agilityBlock = (player.stats?.agility || 1) * baseBlock
    const blockRate = Math.min(agilityBlock / 100, 1.0)

    // 基础闪避率（上限30%）
    const baseDodge = agilityGrowth.闪避率 || 0
    const agilityDodge = (player.stats?.agility || 1) * baseDodge
    const dodgeRate = Math.min(agilityDodge / 100, 0.3)

    // 基础施法速度
    const baseCastSpeed = intelligenceGrowth.施法速度 || 0
    const intelligenceCastSpeed = (player.stats?.intelligence || 1) * baseCastSpeed
    const castingTime = 1.0 + intelligenceCastSpeed / 100

    return {
      maxHealth,
      maxMana,
      magicDefense,
      minAttack, // 基础最小攻击力
      maxAttack, // 基础最大攻击力
      minDefense,
      maxDefense,
      criticalRate,
      attackSpeed,
      hitRate,
      blockRate,
      dodgeRate,
      castingTime,
      decreasedCastingTime: 0, // 这个可能需要根据具体需求调整
      lifeSteal: 0,
      healPercent: 0,
      hpRegeneration: 0,
      skillDamage: 0,
      skillChance: 0,
      decreasedMpConsumption: 0,
      decreasedFpConsumption: 0,
      blockPenetration: 0
    }
  }

  /**
   * 计算基础攻击力
   * @param {Object} player - 玩家对象
   * @param {number} levelAttackBonus - 等级攻击力加成
   * @returns {number} 基础攻击力
   */
  static calculateBaseAttack (player) {
    const className = getClassName(player.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const levelGrowth = formula?.升级后增加的属性 || {}
    const pointGrowth = formula?.属性点增加的属性 || {}
    const agilityGrowth = pointGrowth?.敏捷 || {}
    const intelligenceGrowth = pointGrowth?.智力 || {}
    const strengthGrowth = pointGrowth?.力量 || {}

    // 基础攻击力 + 等级成长 + 主属性加成
    const baseMinAttackPerLevel = levelGrowth.最小攻击力 || 0
    const baseMaxAttackPerLevel = levelGrowth.最大攻击力 || 0
    const levelMinAttack = baseMinAttackPerLevel * player.level
    const levelMaxAttack = baseMaxAttackPerLevel * player.level

    let mainStatMinAttackBonus = 0
    let mainStatMaxAttackBonus = 0

    // 主属性攻击力加成判断（包含一转、二转和三转职业）
    // 力量主属性职业：战士、骑士、刀锋战士、暗杀者、暴力技师、圣殿骑士、猎杀者、格斗宗师、暗夜主宰
    // 智力主属性职业：魔导士、元素使者、精神使者、圣职者、守护使者、奥术师、心灵师、炽天使
    // 敏捷主属性职业：弓箭手、游侠、爆裂射手
    const strengthClasses = ['warrior', 'knight', 'blade_warrior', 'assassin', 'technician', 'holy_knight', 'storm_walker', 'combat_master', 'joker_emperor']
    const intelligenceClasses = ['mage', 'element_mage', 'spirit_mage', 'priest', 'guardian', 'arcane_master', 'mind_master', 'nature_messenger']
    const agilityClasses = ['archer', 'ranger', 'fierce_shooter']

    if (strengthClasses.includes(player.class)) {
      const strength = player.stats?.strength || 1
      mainStatMinAttackBonus = strength * (strengthGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = strength * (strengthGrowth?.最大攻击力 || 0)
    } else if (intelligenceClasses.includes(player.class)) {
      const intelligence = player.stats?.intelligence || 1
      mainStatMinAttackBonus = intelligence * (intelligenceGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = intelligence * (intelligenceGrowth?.最大攻击力 || 0)
    } else if (agilityClasses.includes(player.class)) {
      const agility = player.stats?.agility || 1
      mainStatMinAttackBonus = agility * (agilityGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = agility * (agilityGrowth?.最大攻击力 || 0)
    } else {
      // beginner 或其他未识别职业，使用力量作为主属性
      const strength = player.stats?.strength || 1
      mainStatMinAttackBonus = strength * (strengthGrowth?.最小攻击力 || 0)
      mainStatMaxAttackBonus = strength * (strengthGrowth?.最大攻击力 || 0)
    }

    const baseMinAttack = 1
    const baseMaxAttack = 10
    const minAttack = baseMinAttack + levelMinAttack + mainStatMinAttackBonus
    const maxAttack = baseMaxAttack + levelMaxAttack + mainStatMaxAttackBonus
    return Math.floor((minAttack + maxAttack) / 2)
  }

  /**
   * 计算装备属性加成（带缓存优化）
   * @param {Object} player - 玩家对象
   * @param {Object} equipmentSets - 套装数据
   * @param {boolean} useCache - 是否使用缓存（默认 true）
  * @returns {Object} 装备属性加成对象
  */
  static calculateEquipmentBonuses (player, equipmentSets = {}, useCache = true) {
    // 生成缓存键（基于装备状态）
    const cacheKey = this.generateEquipmentCacheKey(player, equipmentSets)

    // 检查缓存是否有效
    if (useCache && equipmentBonusesCache && equipmentBonusesCacheKey === cacheKey) {
      // 返回缓存的深拷贝，避免污染缓存对象
      return this.deepCopyBonuses(equipmentBonusesCache)
    }

    const bonuses = this._calculateEquipmentBonusesInternal(player, equipmentSets)

    // 更新缓存
    equipmentBonusesCache = this.deepCopyBonuses(bonuses)
    equipmentBonusesCacheKey = cacheKey

    return bonuses
  }

  /**
   * 深拷贝 bonuses 对象
   * @param {Object} bonuses - 原始 bonuses 对象
   * @returns {Object} 拷贝后的 bonuses 对象
   */
  static deepCopyBonuses (bonuses) {
    if (!bonuses) return bonuses
    const copy = { ...bonuses }
    // 深拷贝数组类型的属性
    if (Array.isArray(copy.attackPercentageMultipliers)) {
      copy.attackPercentageMultipliers = [...copy.attackPercentageMultipliers]
    }
    if (Array.isArray(copy.defensePercentageMultipliers)) {
      copy.defensePercentageMultipliers = [...copy.defensePercentageMultipliers]
    }
    return copy
  }

  /**
   * 生成装备缓存键
   * @param {Object} player - 玩家对象
   * @param {Object} equipmentSets - 套装数据
   * @returns {string} 缓存键
   */
  static generateEquipmentCacheKey (player, equipmentSets) {
    const equipment = player?.equipment || {}
    const parts = []

    // 收集装备关键信息
    for (const [slot, item] of Object.entries(equipment)) {
      if (!item) continue
      parts.push(`${slot}:${item.id || ''}:${item.enhanceLevel || 0}`)
      // 时装祝福唤醒数据纳入缓存键
      if (item.category === 'fashion' && item.blessedData) {
        const attrs = item.blessedData.attributes || []
        const attrHash = attrs.map(a => `${a.parameter}:${a.value}`).join(',')
        parts.push(`blessed:${attrHash}`)
      }
    }

    // 收集套装信息
    if (equipmentSets && typeof equipmentSets === 'object') {
      parts.push(`sets:${Object.keys(equipmentSets).length}`)
    }

    return parts.join('|')
  }

  /**
   * 清除装备加成缓存
   */
  static clearEquipmentCache () {
    equipmentBonusesCache = null
    equipmentBonusesCacheKey = null
  }

  /**
   * 内部计算装备属性加成方法
   * @param {Object} player - 玩家对象
   * @param {Object} equipmentSets - 套装数据
   * @returns {Object} 装备属性加成对象
   */
  static _calculateEquipmentBonusesInternal (player, equipmentSets = {}) {
    const bonuses = {
      maxHealth: 0,
      maxMana: 0,
      magicDefense: 0,
      magicDefensePercentage: 0,
      maxHealthPercentage: 0,
      maxManaPercentage: 0,
      attack: 0,
      attackMin: 0,
      attackMax: 0,
      // 攻击力百分比改为数组，支持乘法叠加
      attackPercentageMultipliers: [],
      // 道具固定值加成（百分比之后应用）
      itemAttack: 0,
      defense: 0,
      defenseMin: 0,
      defenseMax: 0,
      // 防御力百分比改为数组，支持乘法叠加
      defensePercentageMultipliers: [],
      // 道具固定值加成（百分比之后应用）
      itemDefense: 0,
      strength: 0,
      agility: 0,
      intelligence: 0,
      constitution: 0,
      criticalRate: 0,
      attackSpeed: 0,
      hitRate: 0,
      blockRate: 0,
      dodgeRate: 0,
      evasionCapBonus: 0,
      criticalDamage: 0,
      lifeSteal: 0,
      healPercent: 0,
      hpRegeneration: 0,
      skillDamage: 0,
      skillChance: 0,
      decreasedMpConsumption: 0,
      decreasedFpConsumption: 0,
      mpRecoveryAfterKill: 0,
      hpRecoveryAfterKill: 0,
      blockPenetration: 0,
      fireAttack: 0,
      waterAttack: 0,
      thunderAttack: 0,
      windAttack: 0,
      earthAttack: 0,
      bowAttack: 0,
      yoyoAttack: 0,
      axeAttack: 0,
      swordAttack: 0,
      stun: 0,
      // 旧的属性名兼容
      dexterity: 0, // 敏捷
      stamina: 0, // 体质
      decreasedCastingTime: 0,
      // PVE属性
      pveDamage: 0,
      pveDamageReduction: 0,

      // 暴击抗性
      criticalResistance: 0,

      // 属性抗性
      fireDefense: 0,
      waterDefense: 0,
      windDefense: 0,
      earthDefense: 0,
      thunderDefense: 0
    }

    const itemsStore = useItemsStore()
    const fractionalBonusKeys = new Set([
      'hitRate',
      'dodgeRate',
      'blockRate',
      'criticalRate',
      'attackSpeed',
      'decreasedCastingTime',
      'lifeSteal',
      'healPercent',
      'criticalDamage',
      'hpRegeneration',
      'skillChance',
      'decreasedMpConsumption',
      'criticalResistance'
    ])
    // 标记是否已处理过攻击力百分比（避免 attackMin 和 attackMax 重复加成）
    let attackPercentApplied = false
    // 标记是否已处理过防御力百分比（避免 defenseMin 和 defenseMax 重复加成）
    let defensePercentApplied = false

    const applyBonusValue = (key, value, rate = false) => {
      if (!Number.isFinite(value) || value === 0) {
        return
      }
      if (key === 'maxHealth') {
        bonuses[rate ? 'maxHealthPercentage' : 'maxHealth'] += value
        return
      }
      if (key === 'maxMana') {
        bonuses[rate ? 'maxManaPercentage' : 'maxMana'] += value
        return
      }
      if (key === 'attack') {
        // rate=true 时作为百分比加成（乘法叠加）
        if (rate) {
          bonuses.attackPercentageMultipliers.push(value / 100)
        } else {
          bonuses.attack += value
        }
        return
      }
      if (key === 'attackMin' || key === 'attackMax') {
        // 支持 rate 参数：rate=true 时作为百分比加成（乘法叠加）
        // 注意：attackMin 和 attackMax 通常同时存在且值相同，rate=true 时只加一次百分比
        if (rate) {
          if (!attackPercentApplied) {
            bonuses.attackPercentageMultipliers.push(value / 100)
            attackPercentApplied = true
          }
        } else if (key === 'attackMin') {
          bonuses.attackMin += value
        } else {
          bonuses.attackMax += value
        }
        return
      }
      if (key === 'defense') {
        // rate=true 时作为百分比加成（乘法叠加）
        if (rate) {
          bonuses.defensePercentageMultipliers.push(value / 100)
        } else {
          bonuses.defense += value
        }
        return
      }
      // 处理 defenseMin 和 defenseMax 的百分比加成（狂暴技能等）
      if (key === 'defenseMin' || key === 'defenseMax') {
        // 支持 rate 参数：rate=true 时作为百分比加成（乘法叠加）
        // 注意：defenseMin 和 defenseMax 通常同时存在且值相同，rate=true 时只加一次百分比
        if (rate) {
          if (!defensePercentApplied) {
            bonuses.defensePercentageMultipliers.push(value / 100)
            defensePercentApplied = true
          }
        } else if (key === 'defenseMin') {
          bonuses.defenseMin += value
        } else {
          bonuses.defenseMax += value
        }
        return
      }
      if (fractionalBonusKeys.has(key)) {
        // lifeSteal (吸血) 特殊处理：
        // - possibleRandomStats 中的 stealhp 值已经是百分比形式（1.5 表示 1.5%）
        // - abilities 中的 stealhp 值也是百分比形式（0.8 表示 0.8%）
        // - 统一处理：直接使用值，不需要除以 100
        let amount
        if (key === 'lifeSteal') {
          // 吸血：值本身已经是百分比，直接使用（1.5 表示 1.5%）
          amount = value
        } else {
          // 其他属性：rate=true 时需要除以 100
          amount = rate ? value / 100 : value > 1 ? value / 100 : value
        }
    bonuses[key] += amount
        return
      }
      // 处理全元素精通：同时增加五种元素攻击属性
      if (key === 'allElementsMastery') {
        const amount = rate ? value : (value > 1 ? value : value * 100)
        bonuses.fireAttack += amount
        bonuses.waterAttack += amount
        bonuses.windAttack += amount
        bonuses.thunderAttack += amount
        bonuses.earthAttack += amount
        return
      }
      if (Object.prototype.hasOwnProperty.call(bonuses, key)) {
        bonuses[key] += value
      }
    }
    const getNormalizeKey = parameter => {
      const map = {
        str: 'strength',
        strength: 'strength',
        dex: 'agility',
        dexterity: 'agility',
        agi: 'agility',
        agility: 'agility',
        int: 'intelligence',
        intelligence: 'intelligence',
        sta: 'constitution',
        con: 'constitution',
        vit: 'constitution',
        constitution: 'constitution',
        maxhp: 'maxHealth',
        hp: 'maxHealth',
        maxhealth: 'maxHealth',
        maxhppercentage: 'maxHealth',
        maxhp_percent: 'maxHealth',
        maxmp: 'maxMana',
        maxmana: 'maxMana',
        magicdefense: 'magicDefense',
        mp: 'maxMana',
        def: 'defense',
        defense: 'defense',
        attack: 'attack',
        attackmin: 'attackMin',
        attackmax: 'attackMax',
        damage: 'attack',
        speed: 'attackSpeed',
        attackspeed: 'attackSpeed',
        attack_speed: 'attackSpeed',
        attackspeedpercentage: 'attackSpeed',
        attackspeed_percent: 'attackSpeed',
        castspeedpercentage: 'decreasedCastingTime',
        castspeed_percent: 'decreasedCastingTime',
        castspeed: 'decreasedCastingTime',
        criticalrate: 'criticalRate',
        criticalchance: 'criticalRate',
        criticaldamage: 'criticalDamage',
        dodgerate: 'dodgeRate',
        evasion: 'dodgeRate',
        evasioncapbonus: 'evasionCapBonus',
        block: 'blockRate',
        blockrate: 'blockRate',
        hitrate: 'hitRate',
        stealhp: 'lifeSteal',
        healing: 'healPercent',
        hprestoration: 'hpRegeneration',
        hpregeneration: 'hpRegeneration',
        hp_regeneration: 'hpRegeneration',
        healpercent: 'healPercent',
        skilldamage: 'skillDamage',
        skillchance: 'skillChance',
        decreasedcastingtime: 'decreasedCastingTime',
        decreasedmpconsumption: 'decreasedMpConsumption',
        mprecoveryafterkill: 'mpRecoveryAfterKill',
        decreasedfpconsumption: 'decreasedFpConsumption',
        blockpenetration: 'blockPenetration',
        bowattack: 'bowAttack',
        yoyoattack: 'yoyoAttack',
        axeattack: 'axeAttack',
        swordattack: 'swordAttack',
        firemastery: 'fireAttack',
        watermastery: 'waterAttack',
        windmastery: 'windAttack',
        thunderMastery: 'thunderAttack',
        electricitymastery: 'thunderAttack',
        fireattack: 'fireAttack',
        waterattack: 'waterAttack',
        windattack: 'windAttack',
        thunderattack: 'thunderAttack',
        earthattack: 'earthAttack',
        elementattack: 'fireAttack',
        stun: 'stun',
        pvedamage: 'pveDamage',
        pve_damage: 'pveDamage',
        pvedamagereduction: 'pveDamageReduction',
        pve_damage_reduction: 'pveDamageReduction',
        allelementsmastery: 'allElementsMastery',
        allelementsmastry: 'allElementsMastery',
        criticalresist: 'criticalResistance',
        criticalresistance: 'criticalResistance',
        // 属性抗性映射
        firedefense: 'fireDefense',
        waterdefense: 'waterDefense',
        winddefense: 'windDefense',
        earthdefense: 'earthDefense',
        electricitydefense: 'thunderDefense',
        thunderdefense: 'thunderDefense',
        fireresist: 'fireDefense',
        waterresist: 'waterDefense',
        windresist: 'windDefense',
        earthresist: 'earthDefense',
        electricityresist: 'thunderDefense',
        thunderresist: 'thunderDefense'
      }
      return map[String(parameter || '').toLowerCase()] || String(parameter || '')
    }
    const resolveEnhanceLevel = item => {
      const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
      return Number.isFinite(level) ? level : 0
    }
    const getJewelryEnhanceAbilities = item => {
      if (!item || item.category !== 'jewelry') {
        return []
      }
      const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
      if (upgradeLevels.length === 0) {
        return []
      }
      const enhanceLevel = resolveEnhanceLevel(item)
      // 终极首饰特殊处理：即使 enhanceLevel 为 0，也要返回 upgradeLevels[0] 的属性
      // 这与 ItemTooltip.vue 中的 resolveUltimateJewelryLevel 和 getUltimateJewelryAbilities 逻辑一致
      if (item.rarity === 'ultimate') {
        // 终极首饰：优先使用显式的 enhanceLevel，否则使用 0 级属性
        const targetLevel = Number.isFinite(enhanceLevel) && enhanceLevel >= 0 ? enhanceLevel : 0
        const matched =
          upgradeLevels.find(level => Number(level?.upgradeLevel) === targetLevel) ||
          upgradeLevels[targetLevel]
        return Array.isArray(matched?.abilities) ? matched.abilities : []
      }
      // 普通首饰需要 enhanceLevel > 0 才应用属性
      if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
        return []
      }
      const matched =
        upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
        upgradeLevels[enhanceLevel]
      return Array.isArray(matched?.abilities) ? matched.abilities : []
    }
    const getArmorEnhanceAbilities = item => {
      if (!item || item.category !== 'armor' || item.subcategory === 'shield') {
        return []
      }
      const enhanceLevel = resolveEnhanceLevel(item)
      if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
        return []
      }
      const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
      if (upgradeLevels.length > 0) {
        const matched =
          upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
          upgradeLevels[enhanceLevel]
        const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
        if (abilities.length) {
          return abilities
        }
      }
      const attrs = item.StrengthenedAttributes || {}
      const levelAttrs = attrs[String(enhanceLevel)] || {}
      if (Array.isArray(levelAttrs.abilities)) {
        return levelAttrs.abilities
      }
      if (Array.isArray(attrs.abilities)) {
        return attrs.abilities
      }
      return []
    }
    const resolveWeaponElementEnhancementInfo = item => {
      const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
      
      // 元素键名映射（处理electricity和thunder同为雷属性的情况）
      const normalizeElementKey = (key) => {
        if (key === 'electricity') return 'thunder'
        return key
      }
      
      // 1. 优先检查元素强化数据（elementalEnhancement）
      if (elemental && typeof elemental === 'object') {
        const elementKeys = ['fire', 'water', 'wind', 'thunder', 'earth']
        const entries = elementKeys
          .map(key => {
            const level = Number(elemental?.[key]?.enhancementLevel ?? 0)
            return Number.isFinite(level) && level > 0 ? { key, level } : null
          })
          .filter(Boolean)
        // 只有当存在强化等级>0的元素时，才使用elementalEnhancement数据
        if (entries.length) {
          const resolved = entries.reduce((current, next) => (next.level > current.level ? next : current))
          const attackPercent = Number(elemental?.[resolved.key]?.elementAttackPercent ?? 0)
          return {
            key: resolved.key,
            attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0
          }
        }
      }
      
      // 2. 如果没有有效的elementalEnhancement数据，检查weapon.element属性
      const weaponElement = item?.element
      if (weaponElement && weaponElement !== 'none') {
        const normalizedKey = normalizeElementKey(weaponElement)
        // 武器自带元素属性，但没有强化数据时，默认属性攻击为1%
        return {
          key: normalizedKey,
          attackPercent: 1
        }
      }
      
      // 3. 以上都没有，返回null表示无属性攻击
      return null
    }
    const elementAttackKeyMap = {
      fire: 'fireAttack',
      water: 'waterAttack',
      wind: 'windAttack',
      thunder: 'thunderAttack',
      earth: 'earthAttack',
      electricity: 'thunderAttack'
    }
    const getEmbeddedCardsForDisplay = attrs => {
      if (!attrs || typeof attrs !== 'object') {
        return null
      }
      if (attrs.embeddedCards && typeof attrs.embeddedCards === 'object') {
        return attrs.embeddedCards
      }
      if (!attrs.perforationLevels || typeof attrs.perforationLevels !== 'object') {
        return null
      }
      const result = {}
      Object.entries(attrs.perforationLevels).forEach(([levelKey, level]) => {
        if (!level || level.embeddedCardId === null || level.embeddedCardId === undefined) {
          return
        }
        let id = null
        if (level.embeddedCardId && typeof level.embeddedCardId === 'object') {
          const idCandidate = Number(level.embeddedCardId.cardId)
          id = Number.isFinite(idCandidate) ? idCandidate : null
        } else {
          const idCandidate = Number(level.embeddedCardId)
          id = Number.isFinite(idCandidate) ? idCandidate : null
        }
        if (id === null) {
          return
        }
        const key = String(levelKey)
        result[key] = {
          cardId: id,
          abilities: itemsStore.getItemConfig(id)?.abilities || []
        }
      })
      return Object.keys(result).length > 0 ? result : null
    }
    /**
     * 获取武器镶嵌宝石的属性列表
     * @param {Object} item - 装备物品
     * @returns {Array} 宝石属性数组
     */
    const getEmbeddedGemsAbilities = item => {
      if (!item || !item.embeddedGems) {
        return []
      }
      const gems = item.embeddedGems
      const abilities = []
      // 支持对象格式 { gem1: {...}, gem2: {...} }
      if (typeof gems === 'object' && !Array.isArray(gems)) {
        Object.values(gems).forEach(gem => {
          if (!Array.isArray(gem?.abilities)) {
            return
          }
          abilities.push(...gem.abilities)
        })
      } else if (Array.isArray(gems)) {
        // 支持数组格式
        gems.forEach(gem => {
          if (!Array.isArray(gem?.abilities)) {
            return
          }
          abilities.push(...gem.abilities)
        })
      }
      return abilities
    }
    const applyAbility = ability => {
      if (!ability || ability.parameter === undefined) {
        return
      }
      if (ability.set !== undefined && ability.add === undefined && ability.addMax === undefined) {
        return
      }
      const parameterKey = String(ability.parameter ?? '').toLowerCase()
      // 如果有 currentAdd 值，优先使用 currentAdd 替代 add
      const add = ability.currentAdd !== undefined
        ? Number(ability.currentAdd)
        : (ability.add !== undefined ? Number(ability.add) : undefined)
      const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
      const rate = Boolean(ability.rate)
      const key = getNormalizeKey(parameterKey)

      // 吸血效果
    if (parameterKey === 'stealhp' || key === 'lifeSteal') {
      // 吸血效果处理逻辑
    }

    if (parameterKey === 'allstats') {
        if (!Number.isFinite(add) || add === 0) {
          return
        }
        bonuses.strength += add
        bonuses.agility += add
        bonuses.intelligence += add
        bonuses.constitution += add
        bonuses.dexterity += add
        bonuses.stamina += add
        return
      }
      if (!Number.isFinite(add) && !Number.isFinite(addMax)) {
        return
      }
      if ((key === 'attack' || key === 'defense') && Number.isFinite(addMax) && !rate) {
        if (key === 'attack') {
          bonuses.attackMin += Number.isFinite(add) ? add : 0
          bonuses.attackMax += addMax || 0
        } else {
          bonuses.defenseMin += Number.isFinite(add) ? add : 0
          bonuses.defenseMax += addMax || 0
        }
        return
      }
      if (Number.isFinite(add)) {
        applyBonusValue(key, add, rate)
      }
    }

    const equippedItems = player.equipment
      ? Object.values(player.equipment).filter(item => item)
      : Array.isArray(player.equipmentBag)
        ? player.equipmentBag.filter(item => item)
        : []

    // 计算套装效果（优先使用 equipment，其次兼容 equipmentBag）
    if (equippedItems.length && equipmentSets) {
      const setBonusService = new SetBonusService()
      const setBonuses = setBonusService.calculateSetBonuses(equippedItems, equipmentSets)

      for (const [rawKey, rawValue] of Object.entries(setBonuses || {})) {
        const value = Number(rawValue)
        if (!Number.isFinite(value) || value === 0) {
          continue
        }

        const key = String(rawKey || '')
        if (key === 'dexterity') {
          bonuses.dexterity += value
          bonuses.agility += value
          continue
        }
        if (key === 'stamina') {
          bonuses.stamina += value
          bonuses.constitution += value
          continue
        }
        if (key === 'constitution') {
          bonuses.constitution += value
          bonuses.stamina += value
          continue
        }

        if (Object.prototype.hasOwnProperty.call(bonuses, key)) {
          bonuses[key] += value
          continue
        }

        const normalizedKey = getNormalizeKey(key)
        if (Object.prototype.hasOwnProperty.call(bonuses, normalizedKey)) {
          bonuses[normalizedKey] += value
          continue
        }

        bonuses[key] = (Number(bonuses[key]) || 0) + value
      }
    }

    if (player.equipment) {
      Object.entries(player.equipment).forEach(([slotKey, item]) => {
        if (!item) {
          return
        }
        // 双刀流：副手武器整体贡献仅获得50%加成
        // 检测方式：标记位 或 shield槽位中的weapon类型物品
        const isOffhand = item._isOffhandWeapon === true ||
          (slotKey === 'shield' && item.category === 'weapon')

        // 副手武器：先快照bonuses，走和主手完全一样的计算流程，最后整体增量只取50%
        let offhandSnapshot = null
        let offhandArrayLens = null
        let savedAttackFlag = false
        let savedDefenseFlag = false

        if (isOffhand) {
          // 快照所有数值型bonus和数组长度
          offhandSnapshot = {}
          offhandArrayLens = {}
          for (const [k, v] of Object.entries(bonuses)) {
            if (Array.isArray(v)) {
              offhandArrayLens[k] = v.length
            } else {
              offhandSnapshot[k] = v
            }
          }
          // 重置百分比标记，确保副手武器的百分比属性也能被处理
          savedAttackFlag = attackPercentApplied
          savedDefenseFlag = defensePercentApplied
          attackPercentApplied = false
          defensePercentApplied = false
        }

        // ===== 以下与主手武器完全相同的计算流程，统一使用 applyAbility =====

        // 处理 abilities 属性，优先使用 currentAdd
        const itemAbilities = Array.isArray(item.abilities) ? item.abilities : []
        itemAbilities.forEach(applyAbility)
        // 处理 possibleRandomStats 属性（终极武器的随机属性）
        const possibleRandomStats = Array.isArray(item.possibleRandomStats) ? item.possibleRandomStats : []
        possibleRandomStats.forEach(applyAbility)
        if (item.category === 'armor' && item.subcategory !== 'shield') {
          getArmorEnhanceAbilities(item).forEach(applyAbility)
        }
        // 衣服属性精炼的元素抗性加成
        if (item.category === 'armor' && item.subcategory === 'suit') {
          const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
          if (elemental && typeof elemental === 'object') {
            const elementDefenseKeyMap = {
              fire: 'fireDefense',
              water: 'waterDefense',
              wind: 'windDefense',
              earth: 'earthDefense',
              thunder: 'thunderDefense'
            }
            Object.keys(elementDefenseKeyMap).forEach(elementKey => {
              const resistances = elemental[elementKey]?.elementResistances
              if (!resistances || typeof resistances !== 'object') {
                return
              }
              const level = Number(elemental[elementKey]?.enhancementLevel ?? 0)
              if (!Number.isFinite(level) || level <= 0) {
                return
              }
              // 将各元素抗性加成累加到对应的 bonuses 字段
              Object.keys(elementDefenseKeyMap).forEach(resKey => {
                const value = Number(resistances[resKey] ?? 0)
                if (Number.isFinite(value) && value !== 0) {
                  const bonusKey = elementDefenseKeyMap[resKey]
                  bonuses[bonusKey] += value
                }
              })
            })
          }
        }
        if (item.category === 'jewelry') {
          getJewelryEnhanceAbilities(item).forEach(applyAbility)
        }
        if (item?.PerforationAttributes) {
          const embedded = getEmbeddedCardsForDisplay(item.PerforationAttributes)
          if (embedded) {
            Object.values(embedded).forEach(card => {
              if (!Array.isArray(card?.abilities)) {
                return
              }
              card.abilities.forEach(applyAbility)
            })
          }
        }
        // 处理武器镶嵌宝石属性
        if (item.category === 'weapon') {
          getEmbeddedGemsAbilities(item).forEach(applyAbility)
        }
        if (!item || item.category !== 'weapon') {
          return
        }

        // 武器元素攻击加成（与主手完全一致，全量计算）
        const elementInfo = resolveWeaponElementEnhancementInfo(item)
        if (elementInfo?.key) {
          const elementKey = elementAttackKeyMap[elementInfo.key] || elementInfo.key
          const attackPercent = Number(elementInfo.attackPercent || 0)
          if (Number.isFinite(attackPercent) && attackPercent > 0 && bonuses[elementKey] !== undefined) {
            bonuses[elementKey] += attackPercent
          }
        }

        // 武器攻击速度加成（与主手完全一致，全量计算）
        const speedValue = Number(item.attackSpeedValue)
        if (Number.isFinite(speedValue)) {
          bonuses.attackSpeed += speedValue
        }

        // ===== 副手武器：将整体增量缩放为50% =====
        if (isOffhand && offhandSnapshot) {
          // 小数型属性（百分比类）：不取整，直接乘比例，避免小数被 floor 归零
          const fractionalKeys = new Set([
            'hitRate', 'dodgeRate', 'blockRate', 'criticalRate',
            'attackSpeed', 'decreasedCastingTime', 'lifeSteal',
            'healPercent', 'criticalDamage', 'hpRegeneration',
            'skillChance', 'criticalResistance'
          ])
          for (const k of Object.keys(bonuses)) {
            if (Array.isArray(bonuses[k])) {
              // 数组类型（如 attackPercentageMultipliers）：缩放新增的元素
              const originalLen = offhandArrayLens[k] || 0
              const arr = bonuses[k]
              for (let i = originalLen; i < arr.length; i++) {
                const original = arr[i]
                arr[i] = original * OFFHAND_ATTRIBUTE_RATIO
              }
            } else {
              // 数值类型：缩放增量
              const before = offhandSnapshot[k] || 0
              const after = bonuses[k]
              const delta = after - before
              if (delta !== 0) {
                // 小数型属性直接乘，整数型属性才取整
                const scaled = fractionalKeys.has(k)
                  ? delta * OFFHAND_ATTRIBUTE_RATIO
                  : Math.floor(delta * OFFHAND_ATTRIBUTE_RATIO)
                bonuses[k] = before + scaled
              }
            }
          }
          // 恢复百分比标记（保留主手已设置的标记）
          attackPercentApplied = savedAttackFlag || attackPercentApplied
          defensePercentApplied = savedDefenseFlag || defensePercentApplied
        }
      })
    }

    if (player.equipment) {
      const enhanceSetSlots = ['helmet', 'armor', 'gloves', 'boots']
      const levels = enhanceSetSlots.map(slot => resolveEnhanceLevel(player.equipment?.[slot]))
      const minLevel = Math.min(...levels)
      if (Number.isFinite(minLevel) && minLevel >= 3) {
        const level = Math.min(10, Math.floor(minLevel))
        const table = itemsStore.enhanceSetBonusTable || ENHANCE_SET_BONUS_TABLE || {}
        const abilities = table[level] || table[String(level)] || []
        if (Array.isArray(abilities)) {
          abilities.forEach(applyAbility)
        }
      }
    }

    // 处理时装祝福唤醒属性加成
    if (player.equipment) {
      Object.values(player.equipment).forEach(item => {
        if (!item || item.category !== 'fashion') return
        const blessedData = item.blessedData
        if (!blessedData || !Array.isArray(blessedData.attributes)) return

        blessedData.attributes.forEach(attr => {
          if (!attr || !attr.parameter) return
          const value = Number(attr.value)
          if (!Number.isFinite(value) || value === 0) return
          const key = getNormalizeKey(String(attr.parameter).toLowerCase())
          const rate = Boolean(attr.isRate)
          applyBonusValue(key, value, rate)
        })
      })
    }

    return bonuses
  }

  /**
   * 将装备能力加成添加到总加成中
   * @param {Object} ability - 装备能力对象
   * @param {Object} bonuses - 当前总加成对象
   */
  static addAbilityToBonuses (ability, bonuses) {
    if (!ability) {
      return
    }

    // 遍历能力对象的所有属性
    for (const [param, value] of Object.entries(ability)) {
      if (value && typeof value === 'object' && value.add !== undefined) {
        // 先检查 value.type，用于处理特殊类型
        const effectType = value.type || param
        
        // 处理能力值对象，如 {add: 10}
        switch (effectType) {
        case 'maxHealth':
          bonuses.maxHealth += value.add || 0
          break
        case 'maxMana':
          bonuses.maxMana += value.add || 0
          break
        case 'maxHealthPercentage':
          bonuses.maxHealthPercentage += value.add || 0
          break
        case 'maxManaPercentage':
          bonuses.maxManaPercentage += value.add || 0
          break
        case 'attack':
          bonuses.attack += value.add || 0
          break
        case 'attackPercentage':
          // 乘法叠加
          bonuses.attackPercentageMultipliers.push((value.add || 0) / 100)
          break
        case 'defense':
          bonuses.defense += value.add || 0
          break
        case 'defensePercentage':
          // 乘法叠加
          bonuses.defensePercentageMultipliers.push((value.add || 0) / 100)
          break
        case 'magicDefensePercentage':
          bonuses.magicDefensePercentage += value.add || 0
          break
        case 'strength':
          bonuses.strength += value.add || 0
          break
        case 'dexterity': // 敏捷
          bonuses.dexterity += value.add || 0
          bonuses.agility += value.add || 0 // 同时添加到新属性名
          break
        case 'agility':
          bonuses.agility += value.add || 0
          break
        case 'intelligence':
          bonuses.intelligence += value.add || 0
          break
        case 'stamina': // 体质
          bonuses.stamina += value.add || 0
          bonuses.constitution += value.add || 0 // 同时添加到新属性名
          break
        case 'constitution':
          bonuses.constitution += value.add || 0
          break
        case 'criticalRate':
          // criticalRate 是百分比值，根据 rate 决定是否需要除以 100
          if (value.rate) {
            bonuses.criticalRate += (value.add || 0) / 100
          } else {
            bonuses.criticalRate += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'attackSpeed':
          // attackSpeed 是 fractionalBonusKeys，需要根据 rate 决定是否除以 100
          if (value.rate) {
            bonuses.attackSpeed += (value.add || 0) / 100
          } else {
            bonuses.attackSpeed += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'attackCastSpeedPercentage':
          // 高效术：同时增加攻击速度和施法速度
          // 根据 rate 决定是否除以 100
          if (value.rate) {
            bonuses.attackSpeed += (value.add || 0) / 100
            bonuses.decreasedCastingTime += (value.add || 0) / 100
          } else {
            const val = value.add || 0
            const amount = val > 1 ? val / 100 : val
            bonuses.attackSpeed += amount
            bonuses.decreasedCastingTime += amount
          }
          break
        case 'castingTime':
          if (value.rate) {
            bonuses.castingTime += (value.add || 0) / 100
          } else {
            bonuses.castingTime += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'decreasedCastingTime':
          if (value.rate) {
            bonuses.decreasedCastingTime += (value.add || 0) / 100
          } else {
            bonuses.decreasedCastingTime += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'hitRate':
          // hitRate 是百分比值，根据 rate 决定是否需要除以 100
          if (value.rate) {
            bonuses.hitRate += (value.add || 0) / 100
          } else {
            bonuses.hitRate += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'blockRate':
          // blockRate 是百分比值，根据 rate 决定是否需要除以 100
          if (value.rate) {
            bonuses.blockRate += (value.add || 0) / 100
          } else {
            bonuses.blockRate += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'dodgeRate':
          // dodgeRate 是百分比值，根据 rate 决定是否需要除以 100
          if (value.rate) {
            bonuses.dodgeRate += (value.add || 0) / 100
          } else {
            bonuses.dodgeRate += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'evasionCapBonus':
          // 闪避率上限提升（暗影斗篷BUFF期间将上限从30%提升至50%）
          bonuses.evasionCapBonus = Math.max(bonuses.evasionCapBonus, value.add || 0)
          break
        case 'criticalDamage':
          bonuses.criticalDamage += value.add || 0
          break
        case 'lifeSteal':
          // lifeSteal 是百分比值，根据 rate 决定是否需要除以 100
          if (value.rate) {
            bonuses.lifeSteal += (value.add || 0) / 100
          } else {
            bonuses.lifeSteal += (value.add || 0) > 1 ? (value.add || 0) / 100 : (value.add || 0)
          }
          break
        case 'healing':
        case 'healPercent':
          bonuses.healPercent += value.add || 0
          break
        case 'skillDamage':
          bonuses.skillDamage += value.add || 0
          break
        case 'decreasedMpConsumption':
          bonuses.decreasedMpConsumption += value.add || 0
          break
        case 'decreasedFpConsumption':
          bonuses.decreasedFpConsumption += value.add || 0
          break
        case 'blockPenetration':
          bonuses.blockPenetration += value.add || 0
          break
        case 'fireAttack':
          bonuses.fireAttack += value.add || 0
          break
        case 'waterAttack':
          bonuses.waterAttack += value.add || 0
          break
        case 'thunderAttack':
          bonuses.thunderAttack += value.add || 0
          break
        case 'windAttack':
          bonuses.windAttack += value.add || 0
          break
        case 'earthAttack':
          bonuses.earthAttack += value.add || 0
          break
        case 'bowAttack':
          bonuses.bowAttack += value.add || 0
          break
        case 'yoyoAttack':
          bonuses.yoyoAttack += value.add || 0
          break
        case 'axeAttack':
          bonuses.axeAttack += value.add || 0
          break
        case 'swordAttack':
          bonuses.swordAttack += value.add || 0
          break
        case 'stun':
          bonuses.stun += value.add || 0
          break
        default:
          // 对于未识别的属性，尝试匹配 effectType 或 param
          if (Object.prototype.hasOwnProperty.call(bonuses, effectType)) {
            bonuses[effectType] += value.add || 0
          } else if (Object.prototype.hasOwnProperty.call(bonuses, param)) {
            bonuses[param] += value.add || 0
          }
          break
        }
      } else if (typeof value === 'number') {
        // 处理直接数值，如 {attack: 10}
        switch (param) {
        case 'maxHealth':
          bonuses.maxHealth += value
          break
        case 'maxMana':
          bonuses.maxMana += value
          break
        case 'maxHealthPercentage':
          bonuses.maxHealthPercentage += value
          break
        case 'maxManaPercentage':
          bonuses.maxManaPercentage += value
          break
        case 'attack':
          bonuses.attack += value
          break
        case 'attackPercentage':
          // 乘法叠加
          bonuses.attackPercentageMultipliers.push(value / 100)
          break
        case 'defense':
          bonuses.defense += value
          break
        case 'defensePercentage':
          // 乘法叠加
          bonuses.defensePercentageMultipliers.push(value / 100)
          break
        case 'magicDefensePercentage':
          bonuses.magicDefensePercentage += value
          break
        case 'strength':
          bonuses.strength += value
          break
        case 'dexterity':
          bonuses.dexterity += value
          bonuses.agility += value
          break
        case 'agility':
          bonuses.agility += value
          break
        case 'intelligence':
          bonuses.intelligence += value
          break
        case 'stamina':
          bonuses.stamina += value
          bonuses.constitution += value
          break
        case 'constitution':
          bonuses.constitution += value
          break
        case 'criticalRate':
          // criticalRate 是百分比值，数字值需要判断是否大于1
          bonuses.criticalRate += value > 1 ? value / 100 : value
          break
        case 'attackSpeed':
          // attackSpeed 是 fractionalBonusKeys，数字值需要判断是否大于1
          bonuses.attackSpeed += value > 1 ? value / 100 : value
          break
        case 'attackCastSpeedPercentage':
          // 高效术：同时增加攻击速度和施法速度
          // 数字值需要判断是否大于1
          {
            const amount = value > 1 ? value / 100 : value
            bonuses.attackSpeed += amount
            bonuses.decreasedCastingTime += amount
          }
          break
        case 'castingTime':
          bonuses.castingTime += value > 1 ? value / 100 : value
          break
        case 'decreasedCastingTime':
          bonuses.decreasedCastingTime += value > 1 ? value / 100 : value
          break
        case 'hitRate':
          // hitRate 是百分比值，数字值需要判断是否大于1
          bonuses.hitRate += value > 1 ? value / 100 : value
          break
        case 'blockRate':
          // blockRate 是百分比值，数字值需要判断是否大于1
          bonuses.blockRate += value > 1 ? value / 100 : value
          break
        case 'dodgeRate':
          // dodgeRate 是百分比值，数字值需要判断是否大于1
          bonuses.dodgeRate += value > 1 ? value / 100 : value
          break
        case 'evasionCapBonus':
          // 闪避率上限提升（暗影斗篷BUFF期间将上限从30%提升至50%）
          bonuses.evasionCapBonus = Math.max(bonuses.evasionCapBonus, value)
          break
        case 'criticalDamage':
          bonuses.criticalDamage += value
          break
        case 'lifeSteal':
          bonuses.lifeSteal += value
          break
        case 'healing':
        case 'healPercent':
          bonuses.healPercent += value
          break
        case 'skillDamage':
          bonuses.skillDamage += value
          break
        case 'decreasedMpConsumption':
          bonuses.decreasedMpConsumption += value
          break
        case 'decreasedFpConsumption':
          bonuses.decreasedFpConsumption += value
          break
        case 'blockPenetration':
          bonuses.blockPenetration += value
          break
        case 'fireAttack':
          bonuses.fireAttack += value
          break
        case 'waterAttack':
          bonuses.waterAttack += value
          break
        case 'thunderAttack':
          bonuses.thunderAttack += value
          break
        case 'windAttack':
          bonuses.windAttack += value
          break
        case 'earthAttack':
          bonuses.earthAttack += value
          break
        case 'bowAttack':
          bonuses.bowAttack += value
          break
        case 'yoyoAttack':
          bonuses.yoyoAttack += value
          break
        case 'axeAttack':
          bonuses.axeAttack += value
          break
        case 'swordAttack':
          bonuses.swordAttack += value
          break
        case 'stun':
          bonuses.stun += value
          break
        default:
          if (Object.prototype.hasOwnProperty.call(bonuses, param)) {
            bonuses[param] += value
          }
          break
        }
      }
    }
  }
}

export default PlayerStatsService
