/**
 * @fileoverview 华弗商店兑换配置
 * @description 华弗NPC PK纸片(ID:814)兑换配置
 * 物品数据直接引用 DIAMOND_SHOP_ITEMS + HUAFU_EXCLUSIVE_ITEMS，此处维护兑换比例覆盖及华弗专属物品
 *
 * exchangeRatio 格式: { cost: number, gain: number }
 *   cost = 消耗的PK纸片数量
 *   gain = 获得的物品数量
 *   例如 { cost: 20, gain: 1 } 表示 20个PK纸片换1个物品
 *        { cost: 1, gain: 10 } 表示 1个PK纸片换10个物品
 *
 * 默认兑换比例：cost = 钻石商店该物品的 price × 15，gain = 1
 * 即兑换1个物品所需的PK纸片数量 = 该物品在钻石商店的价格 × 15
 *
 * 在 HUAFU_EXCHANGE_RATIOS 中配置的物品将覆盖默认比例
 *
 * @author FLYFF Team
 * @version 1.4.0
 * @created 2026-06-21
 * @updated 2026-06-21 - 补全黑曜石血腥套装：守护(女/男)、刀锋(女/男)、游侠(女/男)、元素(女/男)、精神(男/女)、暗杀(女/男)、暴力(女/男)共14个套装
 */

/**
 * 根据钻石商店物品价格计算默认兑换比例
 * 默认 cost = price × 15，gain = 1
 * @param {number} diamondPrice - 物品在钻石商店的价格
 * @returns {{ cost: number, gain: number }} 默认兑换比例
 */
import { DIAMOND_SHOP_ITEMS } from './DIAMOND_SHOP_ITEMS'

export const getDefaultRatio = diamondPrice => {
    const cost = Math.max(1, Math.floor((Number(diamondPrice) || 1) * 15))
    return { cost, gain: 1 }
}

/**
 * 华弗商店专属物品（不在钻石商店中的物品）
 * 键为物品ID字符串，值为物品详情（必须包含 ratio 兑换比例）
 * 新增华弗专属物品只需在此添加
 */
export const HUAFU_EXCLUSIVE_ITEMS = {
    '11682': {
        'id': 11682,
        'name': '风味咖喱',
        'price': 1,
        'icon': '/pt/item_icon/11682.png',
        'description': '珊瑚岛咖喱,恢复气血2000',
        'abilities': [
            {
                'parameter': 'hp',
                'add': 2000,
                'rate': false
            }
        ],
        'category': 'recovery',
        'subcategory': 'food',
        'rarity': 'common',
        'stack': 9999,
        'sellPrice': 2000,
        'ratio': { cost: 1, gain: 10 }
    },
    '486': {
        'id': 486,
        'name': '黑曜石血腥骑士套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/486.png',
        'description': '包含120级帽子,衣服,手套,鞋子,四件套',
        'contents': [
            {
                'item': 5514,
                'count': 1
            },
            {
                'item': 7808,
                'count': 1
            },
            {
                'item': 638,
                'count': 1
            },
            {
                'item': 864,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '8354': {
        'id': 8354,
        'name': '黑曜石血腥骑士套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/8354.png',
        'description': '120级骑士PvP套装',
        'contents': [
            {
                'item': 7548,
                'count': 1
            },
            {
                'item': 2471,
                'count': 1
            },
            {
                'item': 2101,
                'count': 1
            },
            {
                'item': 6997,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥守护套装系列 ====================
    '35': {
        'id': 35,
        'name': '黑曜石血腥守护套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/35.png',
        'description': '120级守护使者PvP套装',
        'contents': [
            {
                'item': 687,
                'count': 1
            },
            {
                'item': 2901,
                'count': 1
            },
            {
                'item': 5570,
                'count': 1
            },
            {
                'item': 7238,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '5073': {
        'id': 5073,
        'name': '黑曜石血腥守护套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/5073.png',
        'description': '120级守护使者PvP套装',
        'contents': [
            {
                'item': 3788,
                'count': 1
            },
            {
                'item': 2717,
                'count': 1
            },
            {
                'item': 1767,
                'count': 1
            },
            {
                'item': 8281,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥刀锋套装系列 ====================
    '2110': {
        'id': 2110,
        'name': '黑曜石血腥刀锋套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/2110.png',
        'description': '120级刀锋战士PvP套装',
        'contents': [
            {
                'item': 4235,
                'count': 1
            },
            {
                'item': 5214,
                'count': 1
            },
            {
                'item': 8259,
                'count': 1
            },
            {
                'item': 1971,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '2824': {
        'id': 2824,
        'name': '黑曜石血腥刀锋套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/2824.png',
        'description': '120级刀锋战士PvP套装',
        'contents': [
            {
                'item': 4566,
                'count': 1
            },
            {
                'item': 7413,
                'count': 1
            },
            {
                'item': 9729,
                'count': 1
            },
            {
                'item': 4576,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥游侠套装系列 ====================
    '3918': {
        'id': 3918,
        'name': '黑曜石血腥游侠套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/3918.png',
        'description': '120级游侠PvP套装',
        'contents': [
            {
                'item': 4692,
                'count': 1
            },
            {
                'item': 7960,
                'count': 1
            },
            {
                'item': 2977,
                'count': 1
            },
            {
                'item': 7693,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '7141': {
        'id': 7141,
        'name': '黑曜石血腥游侠套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/7141.png',
        'description': '120级游侠PvP套装',
        'contents': [
            {
                'item': 9251,
                'count': 1
            },
            {
                'item': 1039,
                'count': 1
            },
            {
                'item': 2520,
                'count': 1
            },
            {
                'item': 7927,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥元素套装系列 ====================
    '4569': {
        'id': 4569,
        'name': '黑曜石血腥元素套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/4569.png',
        'description': '120级元素使者PvP套装',
        'contents': [
            {
                'item': 883,
                'count': 1
            },
            {
                'item': 4540,
                'count': 1
            },
            {
                'item': 2061,
                'count': 1
            },
            {
                'item': 7973,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '5309': {
        'id': 5309,
        'name': '黑曜石血腥元素套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/5309.png',
        'description': '120级元素使者PvP套装',
        'contents': [
            {
                'item': 8529,
                'count': 1
            },
            {
                'item': 4346,
                'count': 1
            },
            {
                'item': 4957,
                'count': 1
            },
            {
                'item': 2593,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥精神套装系列 ====================
    '5806': {
        'id': 5806,
        'name': '黑曜石血腥精神套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/5806.png',
        'description': '120级精神使者PvP套装',
        'contents': [
            {
                'item': 5004,
                'count': 1
            },
            {
                'item': 8031,
                'count': 1
            },
            {
                'item': 1679,
                'count': 1
            },
            {
                'item': 4438,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '7957': {
        'id': 7957,
        'name': '黑曜石血腥精神套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/7957.png',
        'description': '120级精神使者PvP套装',
        'contents': [
            {
                'item': 9180,
                'count': 1
            },
            {
                'item': 3335,
                'count': 1
            },
            {
                'item': 1811,
                'count': 1
            },
            {
                'item': 3808,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥暗杀套装系列 ====================
    '5116': {
        'id': 5116,
        'name': '黑曜石血腥暗杀套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/5116.png',
        'description': '120级暗杀PvP套装',
        'contents': [
            {
                'item': 2495,
                'count': 1
            },
            {
                'item': 8286,
                'count': 1
            },
            {
                'item': 9874,
                'count': 1
            },
            {
                'item': 7144,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '6792': {
        'id': 6792,
        'name': '黑曜石血腥暗杀套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/6792.png',
        'description': '120级暗杀PvP套装',
        'contents': [
            {
                'item': 6865,
                'count': 1
            },
            {
                'item': 9151,
                'count': 1
            },
            {
                'item': 1989,
                'count': 1
            },
            {
                'item': 8478,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥暴力套装系列 ====================
    '8985': {
        'id': 8985,
        'name': '黑曜石血腥暴力套装 (女)',
        'price': 10000,
        'icon': '/pt/item_icon/8985.png',
        'description': '120级暴力技师PvP套装',
        'contents': [
            {
                'item': 7054,
                'count': 1
            },
            {
                'item': 7821,
                'count': 1
            },
            {
                'item': 4208,
                'count': 1
            },
            {
                'item': 4835,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    '9044': {
        'id': 9044,
        'name': '黑曜石血腥暴力套装 (男)',
        'price': 10000,
        'icon': '/pt/item_icon/9044.png',
        'description': '120级暴力技师PvP套装',
        'contents': [
            {
                'item': 7816,
                'count': 1
            },
            {
                'item': 7262,
                'count': 1
            },
            {
                'item': 9776,
                'count': 1
            },
            {
                'item': 9232,
                'count': 1
            }
        ],
        'category': 'pack',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 400000000,
        'ratio': { cost: 20000, gain: 1 }
    },
    // ==================== 黑曜石血腥武器系列 ====================
    '385': {
        'id': 385,
        'name': '黑曜石血腥双手剑',
        'price': 5000,
        'icon': '/pt/item_icon/385.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'sword',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '799': {
        'id': 799,
        'name': '黑曜石血腥单手斧',
        'price': 5000,
        'icon': '/pt/item_icon/799.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'axe',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '2434': {
        'id': 2434,
        'name': '黑曜石血腥单手剑',
        'price': 5000,
        'icon': '/pt/item_icon/2434.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'sword',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '2952': {
        'id': 2952,
        'name': '黑曜石血腥之弓',
        'price': 5000,
        'icon': '/pt/item_icon/2952.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'bow',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '3172': {
        'id': 3172,
        'name': '黑曜石血腥魔棒',
        'price': 5000,
        'icon': '/pt/item_icon/3172.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'stick',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '3763': {
        'id': 3763,
        'name': '黑曜石血腥拳套',
        'price': 5000,
        'icon': '/pt/item_icon/3763.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'knuckle',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '5503': {
        'id': 5503,
        'name': '黑曜石血腥飞轮',
        'price': 5000,
        'icon': '/pt/item_icon/5503.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'yoyo',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '9321': {
        'id': 9321,
        'name': '黑曜石血腥魔杖',
        'price': 5000,
        'icon': '/pt/item_icon/9321.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'wand',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '9627': {
        'id': 9627,
        'name': '黑曜石血腥法杖',
        'price': 5000,
        'icon': '/pt/item_icon/9627.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'staff',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
    '9855': {
        'id': 9855,
        'name': '黑曜石血腥双手斧',
        'price': 5000,
        'icon': '/pt/item_icon/9855.png',
        'description': '黑曜石血腥系列武器,肉的一批,PK神器,你值得拥有~',
        'category': 'weapon',
        'subcategory': 'axe',
        'rarity': 'unique',
        'stack': 1,
        'sellPrice': 200000000,
        'ratio': { cost: 10000, gain: 1 }
    },
}

/**
 * 物品兑换比例覆盖配置（仅对钻石商店物品生效）
 * 键为物品ID字符串，值为兑换比例
 * 新增或修改物品兑换比例只需编辑此对象
 * 未配置的钻石商店物品使用 getDefaultRatio(item.price) 计算
 */
export const HUAFU_EXCHANGE_RATIOS = {
    // 示例覆盖：
    // '829': { cost: 40, gain: 1 }   // 瑞加祝福的ES经验卷轴：40PK纸片→1个（覆盖默认的40:1）
}

/**
 * 华弗商店物品出售价格映射
 * 用于出售时优先查找华弗商店配置的出售价格
 *
 * 优先级：HUAFU_EXCLUSIVE_ITEMS.sellPrice > DIAMOND_SHOP_ITEMS.sellPrice > ITEM_INFO.sellPrice
 *
 * 数据来源：
 * 1. HUAFU_EXCLUSIVE_ITEMS 中有 sellPrice 的物品
 * 2. DIAMOND_SHOP_ITEMS 中有 sellPrice 的物品
 *
 * 键为物品ID字符串，值为出售价格（金币）
 * @type {Record<string, number>}
 */
export const HUAFU_SELL_PRICES = (() => {
    const prices = {}

    // 1. 从华弗专属物品中提取出售价格（最高优先级）
    for (const [id, item] of Object.entries(HUAFU_EXCLUSIVE_ITEMS)) {
        if (item.sellPrice !== null && item.sellPrice !== undefined && Number(item.sellPrice) > 0) {
            prices[id] = Number(item.sellPrice)
        }
    }

    // 2. 从钻石商店物品中提取出售价格（次优先级，仅补充华弗专属中没有的）
    for (const [id, item] of Object.entries(DIAMOND_SHOP_ITEMS)) {
        if (!(id in prices) && item.sellPrice !== null && item.sellPrice !== undefined && Number(item.sellPrice) > 0) {
            prices[id] = Number(item.sellPrice)
        }
    }

    return Object.freeze(prices)
})()
