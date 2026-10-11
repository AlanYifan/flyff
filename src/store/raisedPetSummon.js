/**
 * @file raisedPetSummon.js
 * @generated 2026-02-11
 * @description 训养宠物（raisedpet）召唤状态管理：统一维护“召唤中”标记、面板显示、能量状态与面板几何信息。
 */
import { defineStore } from 'pinia'
import { usePetsStore } from './pets'

/**
 * 归一化训养宠物唯一标识
 * 用途/业务意图：在不依赖背包数组索引的前提下稳定标识“召唤中”的宠物实例。
 * @param {unknown} item - 背包物品实例
 * @returns {string|null} 归一化后的 key
 */
const normalizePetKey = item => {
  if (!item) {
    return null
  }
  if (item.uniqueId) {
    return String(item.uniqueId)
  }
  if (item.id) {
    return `id:${String(item.id)}`
  }
  return null
}

/**
 * 克隆训养宠物快照
 * 用途/业务意图：避免直接引用背包对象，防止 UI/逻辑对背包数据产生非预期修改。
 * @param {unknown} item - 背包物品实例
 * @returns {object|null} 深/浅拷贝后的快照
 */
const clonePetItemSnapshot = item => {
  if (!item || typeof item !== 'object') {
    return null
  }
  const snapshot = { ...item }
  if (item.pet_data && typeof item.pet_data === 'object') {
    try {
      snapshot.pet_data = JSON.parse(JSON.stringify(item.pet_data))
    } catch (error) {
      console.error('[raisedPetSummon] pet_data 克隆失败', error)
      snapshot.pet_data = item.pet_data
    }
  }
  return snapshot
}

/**
 * 从 pet_data 提取成长条目
 * 用途/业务意图：统一兼容数组/对象结构，便于计算等级、能量与属性加成。
 * @param {unknown} petData - 训养宠物的 pet_data 字段
 * @returns {Array<{ petLevel:number, entry:Record<string, any> }>} 条目数组
 */
const extractPetEntries = petData => {
  if (!petData || (typeof petData !== 'object' && !Array.isArray(petData))) {
    return []
  }
  const entries = []
  const pushEntry = (key, value) => {
    const entry = value && typeof value === 'object' ? value : {}
    const petLevel = Number(entry.pet_level ?? key)
    entries.push({
      petLevel: Number.isFinite(petLevel) ? petLevel : 0,
      entry
    })
  }
  if (Array.isArray(petData)) {
    petData.forEach(row => {
      if (!row || typeof row !== 'object') {
        return
      }
      const keys = Object.keys(row)
      if (!keys.length) {
        return
      }
      const looksLikeEntry =
        'pet_level' in row || 'level_type' in row || 'current_energy' in row || 'max_energy' in row
      if (looksLikeEntry) {
        pushEntry(row.pet_level ?? 0, row)
        return
      }
      keys.forEach(key => pushEntry(key, row[key]))
    })
  } else {
    Object.entries(petData).forEach(([key, value]) => pushEntry(key, value))
  }
  return entries
    .filter(item => Number.isFinite(item.petLevel) && item.petLevel > 0)
    .sort((a, b) => a.petLevel - b.petLevel)
}

/**
 * 解析当前最新成长条目
 * 用途/业务意图：以最高 pet_level 作为“当前等级”用于选择 tier 与糖果。
 * @param {Array<{ petLevel:number, entry:Record<string, any> }>} entries - 成长条目数组
 * @returns {{ petLevel:number, entry:Record<string, any> }|null} 最新条目
 */
const resolveLatestPetEntry = entries => {
  if (!Array.isArray(entries) || !entries.length) {
    return null
  }
  return entries[entries.length - 1]
}

/**
 * 解析数值型字段
 * 用途/业务意图：兼容对象/数字两种字段结构，并将其汇总为一个数值。
 * @param {unknown} raw - 原始值
 * @returns {number} 解析后的数值（非 NaN）
 */
const resolveNumericValue = raw => {
  if (raw === null || raw === undefined) {
    return 0
  }
  if (typeof raw === 'object') {
    return Object.values(raw).reduce((total, value) => {
      const numeric = Number(value ?? 0)
      return total + (Number.isFinite(numeric) ? numeric : 0)
    }, 0)
  }
  const numeric = Number(raw ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * 从物品/条目中解析当前能量
 * 用途/业务意图：优先使用运行时字段，其次兼容历史字段命名。
 * @param {unknown} item - 训养宠物快照
 * @param {unknown} petEntry - 最新成长条目
 * @returns {number} 当前能量
 */
const resolveCurrentEnergyInfo = (item, petEntry) => {
  const entry = petEntry && typeof petEntry === 'object' ? petEntry : null
  const hasEntryEnergyField = Boolean(
    entry &&
      (Object.prototype.hasOwnProperty.call(entry, 'current_energy') ||
        Object.prototype.hasOwnProperty.call(entry, 'currentEnergy'))
  )
  const hasItemEnergyField = Boolean(
    item &&
      (Object.prototype.hasOwnProperty.call(item, 'pet_energy') ||
        Object.prototype.hasOwnProperty.call(item, 'energy') ||
        Object.prototype.hasOwnProperty.call(item, 'currentEnergy') ||
        Object.prototype.hasOwnProperty.call(item, 'petEnergy') ||
        Object.prototype.hasOwnProperty.call(item, 'energyValue'))
  )
  const hasField = hasEntryEnergyField || hasItemEnergyField

  const candidate =
    (entry?.current_energy ?? entry?.currentEnergy) ??
    item?.pet_energy ??
    item?.energy ??
    item?.currentEnergy ??
    item?.petEnergy ??
    item?.energyValue ??
    0
  const numeric = Number(candidate)
  const energy = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
  return { energy, hasField }
}

/**
 * 计算训养宠物当前 tier 索引
 * 用途/业务意图：以 pet_level 对齐 PET_TYPE.tiers 的顺序（从 1 开始）。
 * @param {number} petLevel - 当前 pet_level
 * @param {Array<object>} tiers - tier 数组
 * @returns {number} tierIndex（>=0）
 */
const resolveTierIndex = (petLevel, tiers) => {
  const safeLevel = Number.isFinite(petLevel) && petLevel > 0 ? Math.floor(petLevel) : 1
  const rawIndex = Math.max(0, safeLevel - 1)
  const maxIndex = Math.max(0, Array.isArray(tiers) ? tiers.length - 1 : 0)
  return Math.min(rawIndex, maxIndex)
}

/**
 * 解析训养宠物的属性加成 key
 * 用途/业务意图：优先使用条目内除系统字段外的第一个 key，其次回退到 PET_TYPE.parameter。
 * @param {Record<string, any>|null} entry - 当前成长条目
 * @param {string} fallbackKey - PET_TYPE.parameter
 * @returns {string} 属性 key（小写）
 */
const resolveAbilityKey = (entry, fallbackKey) => {
  const safeEntry = entry && typeof entry === 'object' ? entry : null
  const excluded = new Set([
    'pet_level',
    'level_type',
    'level_requirement',
    'current_energy',
    'max_energy',
    'pet_exterior',
    'Pet_Exterior'
  ])
  const resolvedFallback = typeof fallbackKey === 'string' ? fallbackKey : ''
  if (!safeEntry) {
    return resolvedFallback ? String(resolvedFallback).toLowerCase() : ''
  }
  const raw = Object.keys(safeEntry).find(key => !excluded.has(key)) || resolvedFallback
  return raw ? String(raw).toLowerCase() : ''
}

/**
 * raisedpet 召唤状态 Store（Pinia）
 * 用途/业务意图：在不修改背包物品静态数据的前提下，维护“召唤中”的唯一宠物与训养面板状态。
 * 关键行为：
 * - summon(item)：设置召唤宠物并显示面板（不从背包删除）
 * - recall()：取消召唤并隐藏面板
 * - isSummoned(item)：用于背包格子与操作面板判断
 * @returns {import('pinia').StoreDefinition} Store 定义
 */
export const useRaisedPetSummonStore = defineStore('raisedPetSummon', {
  state: () => ({
    summonedPetKey: null,
    summonedPetItem: null,
    summonedPetEnergy: 0,
    summonedPetMaxEnergy: 0,
    summonedPetTierIndex: 0,
    summonedPetCandyItemId: null,
    summonedPetBuffParameter: '',
    summonedPetBuffRate: false,
    summonedPetBuffValue: 0,
    panelVisible: false,
    panelSize: {
      width: 300,
      height: 200
    },
    panelPosition: {
      x: 0,
      y: 0
    }
  }),
  getters: {
    hasSummonedPet: state => Boolean(state.summonedPetKey && state.summonedPetItem),
    summonedPetIcon: state => {
      const itemId = Number(state.summonedPetItem?.id)
      if (!Number.isFinite(itemId) || itemId <= 0) {
        return '/pt/item_icon/default_item.png'
      }
      return `/pt/item_icon/${itemId}.png`
    },
    currentEnergy: state => {
      const numeric = Number(state.summonedPetEnergy)
      return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
    },
    maxEnergy: state => {
      const numeric = Number(state.summonedPetMaxEnergy)
      return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
    },
    isEnergyActive: state => {
      const numeric = Number(state.summonedPetEnergy)
      return Number.isFinite(numeric) && numeric > 0
    },
    currentTierCandyItemId: state => {
      const numeric = Number(state.summonedPetCandyItemId)
      return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : null
    },
    /**
     * 判断给定物品ID是否为“当前召唤宠物的当前等级糖果”
     * @returns {(itemId:number)=>boolean} 判断函数
     */
    isCurrentTierCandy: state => {
      return itemId => {
        const candidate = Number(itemId)
        if (!Number.isFinite(candidate) || candidate <= 0) {
          return false
        }
        const candyId = Number(state.summonedPetCandyItemId)
        return Boolean(state.summonedPetKey && candyId && candyId === candidate)
      }
    }
  },
  actions: {
    /**
     * 重新计算当前召唤宠物的派生数据（tier、最大能量、糖果、属性加成等）
     * 用途/业务意图：用于能量/糖果/属性联动，避免 UI 与逻辑各自重复解析。
     * @returns {boolean} 是否成功解析
     */
    refreshSummonedPetDerived () {
      if (!this.summonedPetItem) {
        this.summonedPetEnergy = 0
        this.summonedPetMaxEnergy = 0
        this.summonedPetTierIndex = 0
        this.summonedPetCandyItemId = null
        this.summonedPetBuffParameter = ''
        this.summonedPetBuffRate = false
        this.summonedPetBuffValue = 0
        return false
      }

      const petsStore = usePetsStore()
      const petId = Number(this.summonedPetItem?.petItemId ?? this.summonedPetItem?.id)
      const config = Number.isFinite(petId) && petId > 0 ? petsStore.petMap?.[String(petId)] : null
      const tiers = Array.isArray(config?.tiers) ? config.tiers : []
      const entries = extractPetEntries(this.summonedPetItem?.pet_data)
      const latest = resolveLatestPetEntry(entries)
      const tierIndex = resolveTierIndex(Number(latest?.petLevel ?? 1), tiers)
      const tier = tiers[tierIndex] || {}
      const latestEntry = latest?.entry && typeof latest.entry === 'object' ? latest.entry : null

      const maxEnergy = Number(tier?.maxEnergy ?? 0)
      const tierMaxEnergy = Number.isFinite(maxEnergy) ? Math.max(0, Math.floor(maxEnergy)) : 0
      const storedMaxEnergy = Number(latestEntry?.max_energy ?? latestEntry?.maxEnergy ?? NaN)
      const resolvedMaxEnergy = Number.isFinite(storedMaxEnergy)
        ? Math.max(0, Math.floor(storedMaxEnergy))
        : tierMaxEnergy

      const candyItemId = Number(tier?.requiredCandyItem ?? 0)
      const resolvedCandyItemId = Number.isFinite(candyItemId) && candyItemId > 0 ? Math.floor(candyItemId) : null

      const parameter = typeof config?.parameter === 'string' ? String(config.parameter).toLowerCase() : ''
      const abilityKey = resolveAbilityKey(latest?.entry ?? null, parameter)
      const totalAbility = abilityKey
        ? entries.reduce((sum, row) => sum + resolveNumericValue(row?.entry?.[abilityKey]), 0)
        : 0

      const storedCurrentEnergy = Number(latestEntry?.current_energy ?? latestEntry?.currentEnergy ?? NaN)
      const { energy: fallbackCurrentEnergy, hasField } = resolveCurrentEnergyInfo(this.summonedPetItem, latestEntry)
      const preferredEnergy = Number.isFinite(storedCurrentEnergy)
        ? Math.max(0, Math.floor(storedCurrentEnergy))
        : hasField
          ? fallbackCurrentEnergy
          : resolvedMaxEnergy
      const resolvedEnergy = Number.isFinite(preferredEnergy) ? preferredEnergy : 0
      const fallbackMaxEnergy =
        resolvedMaxEnergy <= 0 && resolvedEnergy > 0 ? resolvedEnergy : resolvedMaxEnergy

      this.summonedPetTierIndex = tierIndex
      this.summonedPetMaxEnergy = fallbackMaxEnergy
      this.summonedPetCandyItemId = resolvedCandyItemId
      this.summonedPetBuffParameter = abilityKey
      this.summonedPetBuffRate = Boolean(config?.rate)
      this.summonedPetBuffValue = Number.isFinite(totalAbility) ? totalAbility : 0
      this.summonedPetEnergy =
        fallbackMaxEnergy > 0 ? Math.min(preferredEnergy, fallbackMaxEnergy) : 0

      return true
    },

    /**
     * 设置当前召唤宠物的能量
     * 用途/业务意图：集中能量变更入口，统一做边界裁剪。
     * @param {number} energy - 期望设置的能量值
     * @returns {number} 实际写入的能量值
     */
    setSummonedPetEnergy (energy) {
      const maxEnergy = Number(this.summonedPetMaxEnergy)
      const safeMax = Number.isFinite(maxEnergy) ? Math.max(0, Math.floor(maxEnergy)) : 0
      const numeric = Number(energy)
      const safeEnergy = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
      this.summonedPetEnergy = safeMax > 0 ? Math.min(safeEnergy, safeMax) : 0
      return this.summonedPetEnergy
    },

    /**
     * 消耗当前召唤宠物的能量
     * 用途/业务意图：为后续 grace 技能等消耗能量逻辑提供统一入口。
     * @param {number} amount - 消耗量
     * @returns {number} 消耗后的能量
     */
    consumeSummonedPetEnergy (amount) {
      const numeric = Number(amount)
      const safeAmount = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
      return this.setSummonedPetEnergy(this.summonedPetEnergy - safeAmount)
    },

    /**
     * 使用“当前等级糖果”将召唤中的训养宠物能量补满
     * 用途/业务意图：仅当存在召唤宠物且糖果ID匹配当前等级需求时生效。
     * @param {number} candyItemId - 糖果物品ID
     * @returns {{ success:boolean, message:string }} 使用结果
     */
    refillEnergyWithTierCandy (candyItemId) {
      if (!this.hasSummonedPet) {
        return { success: false, message: '当前没有召唤训养宠物' }
      }

      this.refreshSummonedPetDerived()

      const requiredCandy = Number(this.summonedPetCandyItemId)
      const candidate = Number(candyItemId)
      if (!Number.isFinite(candidate) || candidate <= 0) {
        return { success: false, message: '无效的糖果物品' }
      }
      if (!requiredCandy || requiredCandy !== candidate) {
        return { success: false, message: '该糖果不匹配当前训养宠物等级' }
      }
      const maxEnergy = Number(this.summonedPetMaxEnergy)
      if (!Number.isFinite(maxEnergy) || maxEnergy <= 0) {
        return { success: false, message: '当前训养宠物无法补充能量' }
      }

      this.setSummonedPetEnergy(maxEnergy)
      return { success: true, message: '训养宠物能量已补满' }
    },

    isSummoned (item) {
      const key = normalizePetKey(item)
      return Boolean(key && this.summonedPetKey && key === this.summonedPetKey)
    },
    summon (item, playerLevel = null) {
      const key = normalizePetKey(item)
      if (!key) {
        return { success: false, message: '无法识别该宠物' }
      }

      // 检查等级限制
      // 仅当传入 playerLevel 且 pet_data 中包含 level_requirement 时生效
      if (item && (item.pet_data || Array.isArray(item.pet_data))) {
        const entries = extractPetEntries(item.pet_data)
        const latest = resolveLatestPetEntry(entries)
        const latestEntry = latest?.entry && typeof latest.entry === 'object' ? latest.entry : null
        const levelRequirement = Number(latestEntry?.level_requirement ?? 0)
        
        if (Number.isFinite(levelRequirement) && levelRequirement > 0) {
          const safePlayerLevel = Number.isFinite(Number(playerLevel)) && Number(playerLevel) > 0 ? Number(playerLevel) : 1
          if (safePlayerLevel < levelRequirement) {
            return {
              success: false,
              message: `等级不符合禁止召唤 (需求Lv.${levelRequirement})`,
              reason: 'level_requirement',
              requiredLevel: levelRequirement
            }
          }
        }
      }

      this.summonedPetKey = key
      this.summonedPetItem = clonePetItemSnapshot(item)
      this.panelVisible = true
      this.refreshSummonedPetDerived()

      const resolvedMaxEnergy = Number(this.summonedPetMaxEnergy)
      const resolvedEnergy = Number(this.summonedPetEnergy)
      const hasEnergy = Number.isFinite(resolvedEnergy) && resolvedEnergy > 0
      if ((!Number.isFinite(resolvedMaxEnergy) || resolvedMaxEnergy <= 0) && !hasEnergy) {
        this.recall()
        return { success: false, message: '该训养宠物无法召唤（未进化或无能量）' }
      }

      return { success: true, message: '召唤成功' }
    },
    recall () {
      this.summonedPetKey = null
      this.summonedPetItem = null
      this.summonedPetEnergy = 0
      this.summonedPetMaxEnergy = 0
      this.summonedPetTierIndex = 0
      this.summonedPetCandyItemId = null
      this.summonedPetBuffParameter = ''
      this.summonedPetBuffRate = false
      this.summonedPetBuffValue = 0
      this.panelVisible = false
    },
    setPanelVisible (visible) {
      this.panelVisible = Boolean(visible)
    },
    setPanelGeometry ({ position, size } = {}) {
      if (position && typeof position === 'object') {
        const nextX = Number(position.x)
        const nextY = Number(position.y)
        if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
          this.panelPosition = { x: nextX, y: nextY }
        }
      }
      if (size && typeof size === 'object') {
        const nextWidth = Number(size.width)
        const nextHeight = Number(size.height)
        if (Number.isFinite(nextWidth) && Number.isFinite(nextHeight)) {
          this.panelSize = { width: nextWidth, height: nextHeight }
        }
      }
    },
    /**
     * 从 activeBuffs 中的宠物BUFF恢复召唤状态
     * 用途：页面刷新后从存档恢复宠物召唤状态
     * @param {object} petBuff - activeBuffs 中的宠物BUFF对象
     * @param {Array} playerBag - 玩家背包数组，用于匹配宠物物品
     * @returns {boolean} 是否恢复成功
     */
    restoreFromBuff (petBuff, playerBag = []) {
      if (!petBuff || typeof petBuff !== 'object') {
        return false
      }

      const meta = petBuff.meta || {}
      const petName = meta.petName || petBuff.name?.replace('训养宠物：', '') || '训养宠物'
      
      // 尝试从背包中找到对应的宠物物品
      let matchedItem = null
      
      if (Array.isArray(playerBag)) {
        // 优先通过图标路径中的ID匹配
        const iconIdMatch = petBuff.icon?.match(/\/(\d+)\.png$/)
        const iconId = iconIdMatch ? parseInt(iconIdMatch[1], 10) : null
        
        matchedItem = playerBag.find(item => {
          if (!item || item.category !== 'raisedpet') {
            return false
          }
          // 通过图标ID匹配
          if (iconId && item.id === iconId) {
            return true
          }
          // 通过名称匹配
          const itemName = item.name?.cns || item.name || ''
          if (itemName && itemName.includes(petName)) {
            return true
          }
          return false
        })
      }

      // 如果找到了背包中的物品，使用完整数据召唤
      if (matchedItem) {
        const key = normalizePetKey(matchedItem)
        if (key) {
          this.summonedPetKey = key
          this.summonedPetItem = clonePetItemSnapshot(matchedItem)
          this.summonedPetEnergy = Number(meta.energy) || 0
          this.summonedPetMaxEnergy = Number(meta.maxEnergy) || 0
          this.summonedPetBuffParameter = meta.parameter || ''
          this.summonedPetBuffRate = Boolean(meta.rate)
          this.summonedPetBuffValue = Number(meta.abilitySum) || 0
          this.panelVisible = true
          this.refreshSummonedPetDerived()
          console.log('[raisedPetSummon] 从BUFF恢复召唤状态成功（匹配背包物品）:', petName)
          return true
        }
      }

      // 如果没有找到背包物品，使用BUFF数据创建最小化的召唤状态
      // 这样至少可以显示图标和面板
      this.summonedPetKey = `buff-restored:${Date.now()}`
      this.summonedPetItem = {
        id: petBuff.icon?.match(/\/(\d+)\.png$/)?.[1] || 0,
        name: petName,
        icon: petBuff.icon,
        category: 'raisedpet',
        pet_data: {}
      }
      this.summonedPetEnergy = Number(meta.energy) || 0
      this.summonedPetMaxEnergy = Number(meta.maxEnergy) || 0
      this.summonedPetBuffParameter = meta.parameter || ''
      this.summonedPetBuffRate = Boolean(meta.rate)
      this.summonedPetBuffValue = Number(meta.abilitySum) || 0
      this.panelVisible = true
      this.refreshSummonedPetDerived()
      console.log('[raisedPetSummon] 从BUFF恢复召唤状态成功（使用BUFF数据）:', petName)
      return true
    }
  }
})

