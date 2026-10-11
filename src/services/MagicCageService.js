/**
 * @file MagicCageService.js
 * @description 魔法牢笼开启服务
 *              业务意图：玩家使用魔法牢笼（ID:1000000）时，消耗宠物笼钥匙，
 *              根据品级概率随机获得 F-S 级宠物。
 *              品级定义参照宠物训练师的 petLevelTypeMap：等级1-7 对应 F、E、D、C、B、A、S
 *              宠物属性生成逻辑与宠物训练师进化完全一致：
 *              - 使用 petAttributeGradeMaxByLevel + petAttributeGradeWeightMap 加权随机抽取属性档位
 *              - 使用 values[gradeKey-1] 获取属性值
 *              - pet_data 结构与进化产出完全相同
 *              出售价格参照宠物训练师进化 sellPrice 逻辑：
 *              - sellPrice = floor(candyUnitGoldCost * candyCount / 2)
 *              - candyUnitGoldCost 为该品级对应糖果的品级累计金币成本
 * @generated 2026-07-12
 */

import { PET_TYPE } from '@/data/PET_TYPE'

/**
 * 魔法牢笼道具 ID
 * @constant {number}
 */
export const MAGIC_CAGE_ITEM_ID = 1000000

/**
 * 宠物笼钥匙配置
 * key: 钥匙道具 ID
 * boost: 钥匙等级排序值（仅用于 findBestKeyInBag 选择最高级钥匙，不影响概率计算）
 * petRate: 开出宠物的总概率（0~1），决定是否开出宠物
 * gradeWeights: 各品级权重（S~F 顺序），用于加权随机抽取品级，不同钥匙权重不同
 * label: 钥匙名称（用于日志）
 *
 * 品级权重对应条件概率（开出宠物后各品级占比）：
 * - 低级钥匙：S=1.5% A=2% B=3% C=8% D=15% E=30% F=40.5%
 * - 中级钥匙：S=3%   A=4% B=6% C=12% D=20% E=25% F=30%
 * - 高级钥匙：S=6%   A=8% B=12% C=18% D=20% E=18% F=18%
 *
 * @constant {Array<{id:number,boost:number,petRate:number,gradeWeights:number[],label:string}>}
 */
export const CAGE_KEYS = Object.freeze([
  {
    id: 4183, boost: 0.25, petRate: 0.25, label: '宠物笼钥匙(低级)',
    gradeWeights: [3, 4, 6, 16, 30, 60, 81]
  },
  {
    id: 7111, boost: 0.50, petRate: 0.45, label: '宠物笼钥匙(中级)',
    gradeWeights: [3, 4, 6, 12, 20, 25, 30]
  },
  {
    id: 2347, boost: 1.00, petRate: 0.70, label: '宠物笼钥匙(高级)',
    gradeWeights: [6, 8, 12, 18, 20, 18, 18]
  }
])

/**
 * 可随机获得的宠物 ID 池
 * @constant {number[]}
 */
export const PET_POOL = Object.freeze([148, 885, 1644, 2563, 4817, 5471, 5851, 6296, 9941])

/**
 * 品级等级到字母的映射（与 PetTrainerModal.petLevelTypeMap 一致）
 * @constant {Object.<number,string>}
 */
export const PET_LEVEL_TYPE_MAP = Object.freeze({
  1: 'F',
  2: 'E',
  3: 'D',
  4: 'C',
  5: 'B',
  6: 'A',
  7: 'S'
})

/**
 * 品级等级到稀有度的映射（与 PetTrainerModal.petRarityByLevel 一致）
 * @constant {Object.<number,string>}
 */
export const PET_RARITY_BY_LEVEL = Object.freeze({
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'veryrare',
  5: 'unique',
  6: 'ultimate',
  7: 'mythic'
})

/**
 * 品级等级对应的能量值映射（与 PetTrainerModal.petEnergyByLevel 一致）
 * @constant {Object.<number,number>}
 */
export const PET_ENERGY_BY_LEVEL = Object.freeze({
  1: 180,
  2: 210,
  3: 240,
  4: 270,
  5: 300,
  6: 330,
  7: 360
})

/**
 * 品级等级需求映射（与 PetTrainerModal.petLevelRequirementMap 一致）
 * @constant {Object.<string,number>}
 */
export const PET_LEVEL_REQUIREMENT_MAP = Object.freeze({
  C: 15,
  B: 30,
  A: 45,
  S: 60
})

/**
 * 进化糖果的基础金币成本（与 PetTrainerModal.evolveCandyBaseGoldCostMap 一致）
 * 用途/业务意图：用于计算魔法牢笼开出宠物的 sellPrice（售卖单价）
 * key: 糖果物品ID，value: 该糖果的单级基础金币成本
 * @constant {Readonly<Record<number, number>>}
 */
export const EVOLVE_CANDY_BASE_GOLD_COST_MAP = Object.freeze({
  2313: 200000,
  5906: 500000,
  3380: 800000,
  8748: 1000000,
  4371: 1500000,
  6663: 2500000
})

/**
 * 进化糖果的品级顺序（从低到高，与 PetTrainerModal.evolveCandyTierOrder 一致）
 * @constant {number[]}
 */
export const EVOLVE_CANDY_TIER_ORDER = Object.freeze([2313, 5906, 3380, 8748, 4371, 6663])

/**
 * 进化糖果的品级累计金币成本（与 PetTrainerModal.evolveCandyTierTotalGoldCostMap 一致）
 * 规则：A级糖果总成本 = A + B + C + D + E + F 的基础成本累加
 * @constant {Readonly<Record<number, number>>}
 */
export const EVOLVE_CANDY_TIER_TOTAL_GOLD_COST_MAP = (() => {
  const totals = {}
  let cumulative = 0
  EVOLVE_CANDY_TIER_ORDER.forEach(id => {
    const base = Number(EVOLVE_CANDY_BASE_GOLD_COST_MAP[id] ?? 0)
    const safeBase = Number.isFinite(base) ? Math.max(0, Math.floor(base)) : 0
    cumulative += safeBase
    totals[id] = cumulative
  })
  return Object.freeze(totals)
})()

/**
 * 品级对应的进化糖果需求（与 PetTrainerModal.evolveCandyRequirementByNextLevel 一致）
 * key: 目标品级等级(1-7)，value: { candyId, count, levelType }
 * @constant {Readonly<Record<number, {candyId:number, count:number, levelType:string}>>}
 */
export const EVOLVE_CANDY_REQUIREMENT_BY_LEVEL = Object.freeze({
  1: { candyId: 2313, count: 20, levelType: 'F' },
  2: { candyId: 5906, count: 20, levelType: 'E' },
  3: { candyId: 3380, count: 25, levelType: 'D' },
  4: { candyId: 8748, count: 25, levelType: 'C' },
  5: { candyId: 4371, count: 25, levelType: 'B' },
  6: { candyId: 6663, count: 50, levelType: 'A' },
  7: { candyId: 6663, count: 50, levelType: 'S' }
})

/**
 * 品级等级对应的出售价格映射
 * 用途/业务意图：魔法牢笼开出的宠物按品级写入对应出售价格，
 * 计算公式与宠物训练师进化 sellPrice 完全一致：
 * sellPrice = floor(candyUnitGoldCost * candyCount / 2)
 * 其中 candyUnitGoldCost 为该品级对应糖果的品级累计金币成本
 * @constant {Readonly<Record<number, number>>}
 */
export const PET_SELL_PRICE_BY_LEVEL = (() => {
  const prices = {}
  for (let level = 1; level <= 7; level += 1) {
    const requirement = EVOLVE_CANDY_REQUIREMENT_BY_LEVEL[level]
    if (!requirement) {
      prices[level] = 0
      continue
    }
    const candyUnitGoldCost = Number(EVOLVE_CANDY_TIER_TOTAL_GOLD_COST_MAP[requirement.candyId] ?? 0)
    const sellPrice = Math.max(0, Math.floor((candyUnitGoldCost * requirement.count) / 2))
    prices[level] = sellPrice
  }
  return Object.freeze(prices)
})()

/**
 * 根据宠物品级等级计算出售价格
 * 用途/业务意图：魔法牢笼开出的宠物按品级写入对应出售价格，
 * 参照宠物训练师进化逻辑：sellPrice = floor(candyUnitGoldCost * candyCount / 2)
 * @param {number} petLevel - 宠物品级等级（1-7）
 * @returns {number} 出售价格（>=0）
 */
export function resolvePetSellPrice (petLevel) {
  const level = Math.max(1, Math.min(7, Math.floor(Number(petLevel) || 1)))
  return Number(PET_SELL_PRICE_BY_LEVEL[level] ?? 0)
}

/**
 * 属性档位权重映射（与 PetTrainerModal.petAttributeGradeWeightMap 一致）
 * @constant {Object.<number,number>}
 */
export const PET_ATTRIBUTE_GRADE_WEIGHT_MAP = Object.freeze({
  1: 80,
  2: 50,
  3: 30,
  4: 25,
  5: 12,
  6: 9,
  7: 7,
  8: 6,
  9: 5
})

/**
 * 属性档位最大等级映射（与 PetTrainerModal.petAttributeGradeMaxByLevel 一致）
 * @constant {Object.<number,number>}
 */
export const PET_ATTRIBUTE_GRADE_MAX_BY_LEVEL = Object.freeze({
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 7,
  7: 9
})

/**
 * 品级等级信息表（从高到低排列）
 * level: pet_level（1-7），type: 品级字母（F-S）
 * 用于将 gradeWeights 数组索引映射到品级信息
 * @constant {Array<{level:number,type:string}>}
 */
export const GRADE_TABLE = Object.freeze([
  { level: 7, type: 'S' },
  { level: 6, type: 'A' },
  { level: 5, type: 'B' },
  { level: 4, type: 'C' },
  { level: 3, type: 'D' },
  { level: 2, type: 'E' },
  { level: 1, type: 'F' }
])

/**
 * 从背包中查找最高等级的宠物笼钥匙
 * @param {Array<{id:number}>} playerBag - 玩家背包
 * @returns {{keyId:number,boost:number,label:string,index:number}|null} 钥匙信息，无钥匙返回 null
 */
export function findBestKeyInBag (playerBag) {
  if (!Array.isArray(playerBag) || playerBag.length === 0) {
    return null
  }

  let best = null

  for (let i = 0; i < playerBag.length; i += 1) {
    const bagItem = playerBag[i]
    if (!bagItem) {
      continue
    }
    const itemId = Number(bagItem.id)
    const stack = Number(bagItem.currentStack ?? bagItem.quantity ?? 1)
    if (!Number.isFinite(stack) || stack <= 0) {
      continue
    }

    const keyConfig = CAGE_KEYS.find(k => k.id === itemId)
    if (!keyConfig) {
      continue
    }

    if (!best || keyConfig.boost > best.boost) {
      best = {
        keyId: itemId,
        boost: keyConfig.boost,
        petRate: keyConfig.petRate,
        gradeWeights: keyConfig.gradeWeights,
        label: keyConfig.label,
        index: i
      }
    }
  }

  return best
}

/**
 * 根据钥匙品级权重表构建加权抽取条目
 * 业务意图：不同钥匙拥有独立的品级权重表，不再使用 boost 等比例放大
 * @param {number[]} gradeWeights - 品级权重数组（S~F 顺序，7 个元素）
 * @returns {Array<{level:number,type:string,weight:number}>} 品级权重条目列表
 */
export function calculateBoostedProbabilities (gradeWeights) {
  const weights = Array.isArray(gradeWeights) && gradeWeights.length === 7
    ? gradeWeights
    : [3, 4, 6, 12, 20, 25, 30]

  return GRADE_TABLE.map((entry, index) => ({
    level: entry.level,
    type: entry.type,
    weight: Math.max(0, Number(weights[index]) || 0)
  }))
}

/**
 * 执行品级抽取（两步抽取模型）
 * 业务意图：将"是否开出宠物"与"开出什么品级"分离，
 * 各钥匙拥有独立的品级权重表，使高级钥匙更容易开出高品级宠物。
 *
 * 算法说明（两步抽取）：
 * - 第一步：以 petRate 概率判定是否开出宠物，失败则返回 null
 * - 第二步：若开出宠物，使用钥匙专属 gradeWeights 做加权随机抽取
 *
 * 各钥匙条件概率（开出宠物后各品级占比）：
 * - 低级钥匙：S=1.5% A=2% B=3% C=8% D=15% E=30% F=40.5%
 * - 中级钥匙：S=3%   A=4% B=6% C=12% D=20% E=25% F=30%
 * - 高级钥匙：S=6%   A=8% B=12% C=18% D=20% E=18% F=18%
 *
 * @param {number[]} gradeWeights - 钥匙专属品级权重数组（S~F 顺序）
 * @param {number} petRate - 开出宠物的总概率（0~1），决定是否开出宠物
 * @returns {{level:number,type:string}|null} 抽取结果，null 表示未开出宠物
 */
export function rollPetGrade (gradeWeights, petRate) {
  const safePetRate = Number.isFinite(petRate) && petRate > 0 ? Math.min(1, petRate) : 0

  // 第一步：判定是否开出宠物
  if (Math.random() >= safePetRate) {
    return null
  }

  // 第二步：使用钥匙专属权重在品级间加权随机抽取
  const weightedEntries = calculateBoostedProbabilities(gradeWeights)
  const totalWeight = weightedEntries.reduce((sum, e) => sum + e.weight, 0)

  if (totalWeight <= 0) {
    return { level: 1, type: 'F' }
  }

  const roll = Math.random() * totalWeight
  let cursor = 0
  for (const entry of weightedEntries) {
    cursor += entry.weight
    if (roll <= cursor) {
      return { level: entry.level, type: entry.type }
    }
  }

  return weightedEntries[weightedEntries.length - 1]
}

/**
 * 从宠物池中随机选择一只宠物
 * @returns {number} 宠物道具 ID
 */
export function pickRandomPet () {
  const index = Math.floor(Math.random() * PET_POOL.length)
  return PET_POOL[index]
}

/**
 * 加权随机抽取属性档位（与 PetTrainerModal.resolveGradeKey 逻辑完全一致）
 * @param {number} petLevel - 宠物品级等级（1-7）
 * @returns {number} 属性档位 gradeKey（1-9）
 */
export function rollGradeKey (petLevel) {
  const maxGrade = Math.max(1, Math.floor(Number(PET_ATTRIBUTE_GRADE_MAX_BY_LEVEL?.[petLevel] ?? 1)))
  const candidates = []
  let totalWeight = 0

  for (let grade = 1; grade <= maxGrade; grade += 1) {
    const weight = Number(PET_ATTRIBUTE_GRADE_WEIGHT_MAP?.[grade] ?? 0)
    if (!Number.isFinite(weight) || weight <= 0) {
      continue
    }
    totalWeight += weight
    candidates.push({ grade, weight })
  }

  if (!candidates.length || totalWeight <= 0) {
    return 1
  }

  const roll = Math.random() * totalWeight
  let cursor = 0
  for (const candidate of candidates) {
    cursor += candidate.weight
    if (roll <= cursor) {
      return candidate.grade
    }
  }

  return candidates[candidates.length - 1].grade
}

/**
 * 根据属性档位从 values 数组中解析属性值（与 PetTrainerModal.resolveAttributeValue 逻辑一致）
 * @param {number[]} values - 宠物属性值数组
 * @param {number} gradeKey - 属性档位
 * @returns {number} 属性值
 */
export function resolveAttributeValue (values, gradeKey) {
  if (!Array.isArray(values) || !values.length) {
    return 0
  }
  const numericKey = Math.max(1, Math.floor(Number(gradeKey ?? 1)))
  const zeroBasedIndex = numericKey - 1
  const preferred = Number(values[zeroBasedIndex])
  if (Number.isFinite(preferred)) {
    return preferred
  }
  const legacy = Number(values[numericKey])
  if (Number.isFinite(legacy)) {
    return legacy
  }
  const fallback = Number(values[0])
  return Number.isFinite(fallback) ? fallback : 0
}

/**
 * 从宠物成长配置中解析指定阶段的最大能量（与 PetTrainerModal.resolveTierMaxEnergy 逻辑一致）
 * @param {Object} config - 宠物成长配置（PET_TYPE 中的条目）
 * @param {number} index - 阶段索引（petLevel - 1）
 * @returns {number} 最大能量
 */
export function resolveTierMaxEnergy (config, index) {
  const raw = config?.tiers?.[index]?.maxEnergy ?? config?.tiers?.[index]?.max_energy ?? 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

/**
 * 根据宠物 ID 和品级等级创建完整的 pet_data 结构
 * 与宠物训练师进化逻辑完全一致，但一次性生成从 F 到目标品级的所有进化阶段数据：
 * 1. 遍历 level 1 ~ petLevel，为每个阶段独立抽取属性档位 gradeKey
 * 2. 使用 values[gradeKey-1] 获取属性值
 * 3. 构建 pet_data entry，结构为 { pet_level, level_type, [parameter]: { [gradeKey]: value }, current_energy, max_energy }
 * 4. C/B/A/S 阶段额外写入 level_requirement
 * 示例：开出 S 级宠物时，pet_data 包含 F(1)、E(2)、D(3)、C(4)、B(5)、A(6)、S(7) 全部进化数据
 * @param {number} petId - 宠物道具 ID
 * @param {number} petLevel - 宠物品级等级（1-7），即开出的最高品级
 * @param {string} levelType - 品级字母（F-S），对应 petLevel
 * @returns {{pet_data:Object, parameter:string, gradeKey:number, attributeValue:number, rarity:string, maxEnergy:number}}
 *          pet_data 包含从 level 1 到 petLevel 的所有进化条目；
 *          gradeKey/attributeValue/rarity/maxEnergy 为最高品级（petLevel）对应的值，供调用方展示使用
 */
export function createPetData (petId, petLevel, levelType) {
  const config = PET_TYPE[String(petId)]
  if (!config) {
    return { pet_data: {}, parameter: '', gradeKey: 1, attributeValue: 0, rarity: 'common', maxEnergy: 0 }
  }

  const parameter = typeof config.parameter === 'string' ? config.parameter : ''
  const values = Array.isArray(config.values) ? config.values : []
  const safePetLevel = Math.max(1, Math.min(7, Math.floor(Number(petLevel) || 1)))

  // 为 level 1 ~ safePetLevel 逐级生成进化数据（与进化产出结构完全一致）
  const pet_data = {}

  for (let level = 1; level <= safePetLevel; level += 1) {
    const currentLevelType = PET_LEVEL_TYPE_MAP[level] || ''

    // 加权随机抽取属性档位（与进化逻辑一致）
    const levelGradeKey = rollGradeKey(level)

    // 根据档位获取属性值（与进化逻辑一致）
    const levelAttributeValue = resolveAttributeValue(values, levelGradeKey)

    // 获取最大能量（与进化逻辑一致）
    const tierIndex = Math.max(level - 1, 0)
    const maxEnergyFromTier = resolveTierMaxEnergy(config, tierIndex)
    const fallbackMaxEnergy = Number(PET_ENERGY_BY_LEVEL?.[level] ?? 0)
    const levelMaxEnergy = maxEnergyFromTier || (petId === 8600 ? 0 : fallbackMaxEnergy)

    // 构建 pet_data entry（与进化逻辑完全一致）
    const petDataEntry = parameter
      ? {
        pet_level: level,
        level_type: currentLevelType,
        [parameter]: { [String(levelGradeKey)]: levelAttributeValue },
        current_energy: 0,
        max_energy: Number.isFinite(levelMaxEnergy) ? levelMaxEnergy : 0
      }
      : {
        pet_level: level,
        level_type: currentLevelType,
        current_energy: 0,
        max_energy: Number.isFinite(levelMaxEnergy) ? levelMaxEnergy : 0
      }

    // 添加等级需求（C/B/A/S 才有，与进化逻辑一致）
    const levelRequirement = PET_LEVEL_REQUIREMENT_MAP[currentLevelType]
    if (levelRequirement) {
      petDataEntry.level_requirement = levelRequirement
    }

    pet_data[String(level)] = petDataEntry
  }

  // 取最高品级（petLevel）对应的值，供调用方展示使用
  const gradeKey = pet_data[String(safePetLevel)]?.[parameter]
    ? Number(Object.keys(pet_data[String(safePetLevel)][parameter])[0]) || 1
    : 1
  const attributeValue = parameter
    ? Number(pet_data[String(safePetLevel)]?.[parameter]?.[String(gradeKey)] ?? 0)
    : 0
  const maxEnergy = Number(pet_data[String(safePetLevel)]?.max_energy ?? 0)
  const rarity = PET_RARITY_BY_LEVEL[safePetLevel] || 'common'

  return {
    pet_data,
    parameter,
    gradeKey,
    attributeValue,
    rarity,
    maxEnergy
  }
}

/**
 * 执行魔法牢笼开启
 * 业务流程：
 * 1. 检查背包中是否有宠物笼钥匙
 * 2. 使用最高等级钥匙的 boost
 * 3. 从 S 到 F 依次抽取品级
 * 4. 若成功，随机选择宠物并构建完整物品对象（与进化产出一致）
 * 5. 若失败，返回空结果
 *
 * @param {Array<{id:number}>} playerBag - 玩家背包
 * @returns {{
 *   success: boolean,
 *   petItem: Object|null,
 *   grade: {level:number,type:string}|null,
 *   keyUsed: {keyId:number,label:string}|null,
 *   message: string
 * }} 开启结果
 */
export function openMagicCage (playerBag) {
  // 查找钥匙
  const keyInfo = findBestKeyInBag(playerBag)

  if (!keyInfo) {
    return {
      success: false,
      petItem: null,
      grade: null,
      keyUsed: null,
      message: '需要宠物笼钥匙才能开启魔法牢笼！'
    }
  }

  // 抽取品级（两步模型：先判是否开出宠物，再用钥匙专属权重判品级）
  const gradeResult = rollPetGrade(keyInfo.gradeWeights, keyInfo.petRate)

  if (!gradeResult) {
    return {
      success: true,
      petItem: null,
      grade: null,
      keyUsed: { keyId: keyInfo.keyId, label: keyInfo.label },
      message: `使用了${keyInfo.label}，但魔法牢笼是空的…什么也没开出来。`
    }
  }

  // 随机选择宠物
  const petId = pickRandomPet()

  // 构建 pet_data（与进化逻辑完全一致）
  const { pet_data, gradeKey, rarity } = createPetData(petId, gradeResult.level, gradeResult.type)

  // 按品级计算出售价格（与宠物训练师进化 sellPrice 逻辑一致）
  const sellPrice = resolvePetSellPrice(gradeResult.level)

  const petName = getPetName(petId)

  // 构建宠物数据载体（不直接添加到背包，由 itemsStore.useMagicCageItem 走 addItemToBag 流程）
  // 与进化逻辑一致：addItemToBag 生成 uniqueId 和基础字段，再合并 pet_data
  // sellPrice 按品级写入，与宠物训练师进化产出一致
  const petConfig = PET_TYPE[String(petId)]
  const petItem = {
    id: petId,
    name: petName,
    rarity,
    pet_level: gradeResult.level,
    pet_data,
    sellPrice,
    petConfig: petConfig || {}
  }

  return {
    success: true,
    petItem,
    grade: gradeResult,
    keyUsed: { keyId: keyInfo.keyId, label: keyInfo.label },
    message: `使用了${keyInfo.label}，从魔法牢笼中开出了 ${gradeResult.type} 级 ${petName}！（属性档位: ${gradeKey}）`
  }
}

/**
 * 获取宠物中文名称
 * @param {number} petId - 宠物道具 ID
 * @returns {string} 宠物名称
 */
function getPetName (petId) {
  const names = {
    148: '独角兽',
    885: '飞龙',
    1644: '天使',
    2563: '狮鸠',
    4817: '狐狸',
    5471: '兔子',
    5851: '老虎',
    6296: '帝王蟹',
    9941: '狮子'
  }
  return names[petId] || `宠物#${petId}`
}
