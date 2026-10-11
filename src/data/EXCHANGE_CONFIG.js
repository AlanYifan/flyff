/**
 * 兑换系统配置数据
 * 定义物品兑换规则和需求
 * @file EXCHANGE_CONFIG.js
 * @generated 2026-02-23
 */

/**
 * 兑换类型枚举
 */
export const EXCHANGE_TYPES = Object.freeze({
  NECKLACE: 'necklace',
  RING: 'ring',
  EARRING: 'earring'
})

/**
 * 兑换类型名称映射
 */
export const EXCHANGE_TYPE_NAMES = Object.freeze({
  [EXCHANGE_TYPES.NECKLACE]: '兑换项链',
  [EXCHANGE_TYPES.RING]: '兑换戒指',
  [EXCHANGE_TYPES.EARRING]: '兑换耳环'
})

/**
 * 项链兑换配置
 * 兑换需求材料ID: 19291, 12055
 */
export const NECKLACE_EXCHANGE_LIST = Object.freeze([
  {
    id: 'necklace_1',
    name: '天侍神的生命之源',
    targetItemId: 14476,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_2',
    name: '天侍神的魔力之源',
    targetItemId: 17544,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_3',
    name: '嗜血者的活力之源',
    targetItemId: 12489,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_4',
    name: '嗜血者的生命之源',
    targetItemId: 14792,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_5',
    name: '嗜血者的魔力之源',
    targetItemId: 15057,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_6',
    name: '圣骑士的活力之源',
    targetItemId: 16529,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_7',
    name: '圣骑士的生命之源',
    targetItemId: 12164,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_8',
    name: '圣骑士的魔力之源',
    targetItemId: 13450,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_9',
    name: '神射手的魔力之源',
    targetItemId: 16454,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  },
  {
    id: 'necklace_10',
    name: '神射手的生命之源',
    targetItemId: 10321,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 540 }
    ]
  }
])

/**
 * 戒指兑换配置
 * 兑换需求材料ID: 19291, 12055
 */
export const RING_EXCHANGE_LIST = Object.freeze([
  {
    id: 'ring_1',
    name: '圣骑士之戒',
    targetItemId: 10557,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 480 }
    ]
  },
  {
    id: 'ring_2',
    name: '嗜血者之戒',
    targetItemId: 10617,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 480 }
    ]
  },
  {
    id: 'ring_3',
    name: '神射手之戒',
    targetItemId: 15918,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 480 }
    ]
  },
  {
    id: 'ring_4',
    name: '天侍神之戒',
    targetItemId: 17780,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 480 }
    ]
  }
])

/**
 * 耳环兑换配置
 * 兑换需求材料ID: 19291, 12055
 */
export const EARRING_EXCHANGE_LIST = Object.freeze([
  {
    id: 'earring_1',
    name: '神射手之护',
    targetItemId: 14266,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_2',
    name: '天侍神之护',
    targetItemId: 14901,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_3',
    name: '圣骑士之护',
    targetItemId: 15192,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_4',
    name: '嗜血者之护',
    targetItemId: 19382,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_5',
    name: '神射手之怒',
    targetItemId: 13637,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_6',
    name: '天侍神之怒',
    targetItemId: 16090,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_7',
    name: '嗜血者之怒',
    targetItemId: 17305,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  },
  {
    id: 'earring_8',
    name: '圣骑士之怒',
    targetItemId: 19889,
    requirements: [
      { itemId: 12055, count: 88 },
      { itemId: 19291, count: 360 }
    ]
  }
])

/**
 * 根据兑换类型获取兑换列表
 * @param {string} exchangeType - 兑换类型
 * @returns {Array} 兑换列表
 */
export const getExchangeListByType = (exchangeType) => {
  switch (exchangeType) {
    case EXCHANGE_TYPES.NECKLACE:
      return NECKLACE_EXCHANGE_LIST
    case EXCHANGE_TYPES.RING:
      return RING_EXCHANGE_LIST
    case EXCHANGE_TYPES.EARRING:
      return EARRING_EXCHANGE_LIST
    default:
      return []
  }
}

/**
 * 获取兑换类型的下拉选项列表
 * @param {string} exchangeType - 兑换类型
 * @returns {Array} 下拉选项列表 [{ value, label }]
 */
export const getExchangeOptionsByType = (exchangeType) => {
  const list = getExchangeListByType(exchangeType)
  return list.map(item => ({
    value: item.id,
    label: item.name
  }))
}

/**
 * 根据ID获取兑换配置详情
 * @param {string} exchangeId - 兑换配置ID
 * @returns {Object|null} 兑换配置详情
 */
export const getExchangeConfigById = (exchangeId) => {
  const allLists = [
    ...NECKLACE_EXCHANGE_LIST,
    ...RING_EXCHANGE_LIST,
    ...EARRING_EXCHANGE_LIST
  ]
  return allLists.find(item => item.id === exchangeId) || null
}
