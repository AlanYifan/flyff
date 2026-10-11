/**
 * @file PET_PEAK_CONFIG.js
 * @description 宠物巅峰属性配置
 * 当宠物进阶属性达到 1、2、3、4、5、7、9 阶满值时，获得额外巅峰加成
 */

/**
 * 进阶等级对应的属性值配置
 * key: 进阶等级 (1-9)
 * value: 各宠物在该等级的属性值
 */
export const PET_LEVEL_VALUES = {
  // 独角兽 - 生命值
  148: {
    1: 96,
    2: 191,
    3: 383,
    4: 670,
    5: 1053,
    6: 1356,
    7: 1628,
    8: 2539,
    9: 3161
  },
  // 飞龙 - 攻击力
  885: {
    1: 7,
    2: 13,
    3: 27,
    4: 47,
    5: 73,
    6: 90,
    7: 113,
    8: 180,
    9: 220
  },
  // 天使 - 暴击率
  1644: {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 9,
    9: 9
  },
  // 狮鸠 - 防御力
  2563: {
    1: 6,
    2: 12,
    3: 24,
    4: 42,
    5: 66,
    6: 82,
    7: 102,
    8: 160,
    9: 198
  },
  // 狐狸 - 智力
  4817: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 11,
    6: 14,
    7: 17,
    8: 27,
    9: 33
  },
  // 兔子 - 敏捷
  5471: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 11,
    6: 14,
    7: 17,
    8: 27,
    9: 33
  },
  // 老虎 - 力量
  5851: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 11,
    6: 14,
    7: 17,
    8: 27,
    9: 33
  },
  // 狮子 - 体质
  9941: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 11,
    6: 14,
    7: 17,
    8: 27,
    9: 33
  },
  // 帝王蟹 - 暴击伤害
  6296: {
    1: 2,
    2: 3,
    3: 4,
    4: 5,
    5: 6,
    6: 7,
    7: 9,
    8: 12,
    9: 16
  }
}

/**
 * 巅峰属性加成配置
 * key: 宠物ID
 * baseValue: 原始累加值 (1+2+3+4+5+7+9 阶)
 * peakValue: 巅峰加成后的值
 * parameter: 属性类型
 * isRate: 是否为百分比属性
 */
export const PET_PEAK_CONFIG = {
  // 独角兽 - 生命值
  148: {
    name: '独角兽',
    parameter: 'maxhp',
    label: '最大生命值',
    isRate: false,
    baseValue: 7182,    // 96 + 191 + 383 + 670 + 1053 + 1628 + 3161
    peakValue: 15000,   // 巅峰加成后
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]  // 需要达到的进阶等级
  },
  // 飞龙 - 攻击力
  885: {
    name: '飞龙',
    parameter: 'attack',
    label: '攻击力',
    isRate: false,
    baseValue: 500,     // 7 + 13 + 27 + 47 + 73 + 113 + 220
    peakValue: 1500,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 天使 - 暴击率
  1644: {
    name: '天使',
    parameter: 'criticalchance',
    label: '暴击率',
    isRate: true,
    baseValue: 31,      // 1 + 2 + 3 + 4 + 5 + 7 + 9
    peakValue: 46.5,    // 31% -> 46.5%
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 狮鸠 - 防御力
  2563: {
    name: '狮鸠',
    parameter: 'def',
    label: '防御力',
    isRate: false,
    baseValue: 450,     // 6 + 12 + 24 + 42 + 66 + 102 + 198
    peakValue: 1500,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 狐狸 - 智力
  4817: {
    name: '狐狸',
    parameter: 'int',
    label: '智力',
    isRate: false,
    baseValue: 75,      // 1 + 2 + 4 + 7 + 11 + 17 + 33
    peakValue: 100,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 兔子 - 敏捷
  5471: {
    name: '兔子',
    parameter: 'dex',
    label: '敏捷',
    isRate: false,
    baseValue: 75,      // 1 + 2 + 4 + 7 + 11 + 17 + 33
    peakValue: 100,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 老虎 - 力量
  5851: {
    name: '老虎',
    parameter: 'str',
    label: '力量',
    isRate: false,
    baseValue: 75,      // 1 + 2 + 4 + 7 + 11 + 17 + 33
    peakValue: 100,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 狮子 - 体力
  9941: {
    name: '狮子',
    parameter: 'sta',
    label: '体质',
    isRate: false,
    baseValue: 75,      // 1 + 2 + 4 + 7 + 11 + 17 + 33
    peakValue: 100,
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  },
  // 帝王蟹 - 暴击伤害
  6296: {
    name: '帝王蟹',
    parameter: 'criticaldamage',
    label: '暴击伤害',
    isRate: true,
    baseValue: 45,      // 2 + 3 + 4 + 5 + 6 + 9 + 16
    peakValue: 67.5,    // 45% -> 67.5%
    requiredLevels: [1, 2, 3, 4, 5, 7, 9]
  }
}

/**
 * 检查宠物是否达到巅峰状态
 * @param {number} petId - 宠物ID
 * @param {Array} petLevels - 宠物已有的进阶等级数组
 * @returns {boolean} 是否达到巅峰
 */
export function isPetAtPeak (petId, petLevels = []) {
  const config = PET_PEAK_CONFIG[petId]
  if (!config) {
    return false
  }
  const required = config.requiredLevels || []
  if (!required.length) {
    return false
  }
  return required.every(level => petLevels.includes(level))
}

/**
 * 获取宠物巅峰属性值
 * @param {number} petId - 宠物ID
 * @param {number} currentValue - 当前累加属性值
 * @returns {{ isPeak: boolean, baseValue: number, peakValue: number, label: string, isRate: boolean }}
 */
export function getPetPeakStatus (petId, currentValue = 0) {
  const config = PET_PEAK_CONFIG[petId]
  if (!config) {
    return { isPeak: false, baseValue: currentValue, peakValue: currentValue, label: '', isRate: false }
  }

  // 检查当前值是否等于或超过基础值（达到巅峰）
  const isPeak = currentValue >= config.baseValue

  return {
    isPeak,
    baseValue: config.baseValue,
    peakValue: config.peakValue,
    label: config.label,
    isRate: config.isRate
  }
}

/**
 * 获取宠物显示属性值（巅峰时显示增强值）
 * @param {number} petId - 宠物ID
 * @param {number} currentValue - 当前累加属性值
 * @returns {{ displayValue: number, isPeak: boolean, baseValue: number, peakValue: number }}
 */
export function getPetDisplayValue (petId, currentValue = 0) {
  const status = getPetPeakStatus(petId, currentValue)

  if (status.isPeak) {
    return {
      displayValue: status.peakValue,
      isPeak: true,
      baseValue: status.baseValue,
      peakValue: status.peakValue
    }
  }

  return {
    displayValue: currentValue,
    isPeak: false,
    baseValue: currentValue,
    peakValue: currentValue
  }
}
