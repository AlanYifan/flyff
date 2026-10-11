/**
 * 转职任务配置数据
 * 定义一转、二转、三转职业的转职任务链（击杀指定怪物）
 * 一转数据来源：public/data/quests.json 中 15 级转职任务
 * 二转数据来源：QUEST_INFO.js 中 60 级转职任务链（parent=8537）
 *   - 祭坛步骤：各职业专属怪物击杀
 *   - 守护者步骤：击杀守护兽贝纳卡度温/贝纳卡蒂诺
 *   - 继承者/大师步骤：祭坛无可击杀目标时作为替代
 * 三转为手动配置（4阶段任务链）：
 *   - 阶段1：对话任务（觉醒引导）
 *   - 阶段2：击杀珊瑚岛大型rank怪物各100个，奖励金币+物品
 *   - 阶段3：击杀珊瑚岛8个堕落级BOSS各1个，奖励金币+物品
 *   - 阶段4：对话任务（觉醒赐予），奖励物品
 * @file 转职任务配置 - 只读静态数据
 * @author CatPaw
 * @since 2026-06-25
 */

/**
 * 单个击杀目标
 * @typedef {Object} KillTarget
 * @property {number} monsterId - 怪物 ID（对应 MONSTER_INFO 中的 key）
 * @property {string} monsterName - 怪物中文名称
 * @property {number} count - 需要击杀的数量
 */

/**
 * 单个转职任务
 * @typedef {Object} JobChangeQuest
 * @property {string} id - 任务唯一标识（如 'warrior_1'）
 * @property {string} name - 任务名称
 * @property {string} type - 任务类型（'dialogue'=对话, 'kill'=击杀）
 * @property {string} description - 任务描述
 * @property {KillTarget[]} killTargets - 击杀目标列表（对话类任务为空数组）
 * @property {QuestReward|null} [rewards] - 任务奖励（可选）
 */

/**
 * 任务奖励
 * @typedef {Object} QuestReward
 * @property {number} gold - 金币奖励
 * @property {RewardItem[]} items - 物品奖励列表
 */

/**
 * 奖励物品
 * @typedef {Object} RewardItem
 * @property {number} itemId - 物品 ID
 * @property {string} itemName - 物品中文名
 * @property {number} count - 数量
 */

/**
 * 某职业的转职任务链
 * @typedef {Object} JobChangeQuestChain
 * @property {string} targetJobKey - 目标职业 key（如 'warrior'）
 * @property {string} targetJobName - 目标职业中文名
 * @property {number} tier - 转职阶段（1=一转, 2=二转, 3=三转）
 * @property {JobChangeQuest[]} quests - 任务列表（按顺序执行）
 */

/**
 * 一转职业转职任务配置
 * 每个职业 2 个任务，需按顺序完成
 * 怪物等级范围：15 级左右
 */
export const JOB_CHANGE_QUESTS = Object.freeze({
  warrior: {
    targetJobKey: 'warrior',
    targetJobName: '战士',
    tier: 1,
    quests: [
      {
        id: 'warrior_1',
        name: '初心者大师(战士)',
        description: '击败指定数量的怪物，证明你的战斗实力！',
        killTargets: [
          { monsterId: 5745, monsterName: '小独眼蝠', count: 20 },
          { monsterId: 2169, monsterName: '小嘭嘭菇', count: 20 }
        ]
      },
      {
        id: 'warrior_2',
        name: '战士的任务',
        description: '击败强力怪物，获得战士的认可！',
        killTargets: [
          { monsterId: 9718, monsterName: '巨眼小怪', count: 1 }
        ]
      }
    ]
  },
  priest: {
    targetJobKey: 'priest',
    targetJobName: '圣职者',
    tier: 1,
    quests: [
      {
        id: 'priest_1',
        name: '初心者转职(圣职者)',
        description: '击败指定数量的怪物，证明你的虔诚之心！',
        killTargets: [
          { monsterId: 2169, monsterName: '小嘭嘭菇', count: 10 },
          { monsterId: 6688, monsterName: '小象牙甲虫', count: 10 }
        ]
      },
      {
        id: 'priest_2',
        name: '圣职者的任务',
        description: '击败强力怪物，获得圣职者的认可！',
        killTargets: [
          { monsterId: 2685, monsterName: '毒蝎子', count: 1 }
        ]
      }
    ]
  },
  mage: {
    targetJobKey: 'mage',
    targetJobName: '魔导士',
    tier: 1,
    quests: [
      {
        id: 'mage_1',
        name: '初心者转职(魔导士)',
        description: '击败指定数量的怪物，证明你的魔法天赋！',
        killTargets: [
          { monsterId: 2087, monsterName: '大独眼蝠', count: 15 },
          { monsterId: 6688, monsterName: '小象牙甲虫', count: 10 }
        ]
      },
      {
        id: 'mage_2',
        name: '魔导士的任务',
        description: '击败强力怪物，获得魔导士的认可！',
        killTargets: [
          { monsterId: 5145, monsterName: '小依蛾', count: 1 }
        ]
      }
    ]
  },
  archer: {
    targetJobKey: 'archer',
    targetJobName: '弓箭手',
    tier: 1,
    quests: [
      {
        id: 'archer_1',
        name: '初心者大师(弓箭手)',
        description: '击败指定数量的怪物，证明你的敏捷身手！',
        killTargets: [
          { monsterId: 5745, monsterName: '小独眼蝠', count: 30 }
        ]
      },
      {
        id: 'archer_2',
        name: '弓箭手的任务',
        description: '击败强力怪物，获得弓箭手的认可！',
        killTargets: [
          { monsterId: 6472, monsterName: '休赖扎', count: 1 }
        ]
      }
    ]
  }
})

/**
 * 二转职业转职任务配置
 * 每个职业 2 个任务，需按顺序完成
 * 数据来源：QUEST_INFO.js 中 parent=8537 的 60 级任务链
 * 任务结构：祭坛步骤（各职业专属怪物）→ 守护者步骤（守护兽贝纳卡度温/贝纳卡蒂诺）
 * 二转职业进阶路线：
 *   warrior  → knight, blade_warrior
 *   mage     → element_mage, spirit_mage
 *   archer   → ranger, assassin
 *   priest   → guardian, technician
 */
export const SECOND_JOB_CHANGE_QUESTS = Object.freeze({
  knight: {
    targetJobKey: 'knight',
    targetJobName: '骑士',
    tier: 2,
    quests: [
      {
        id: 'knight_1',
        name: '英雄的足迹 -祭坛-',
        description: '打中型独轮蒸汽机取得8个灵魂之石，拿给达肯第3地区的骑士祭坛祭司！',
        killTargets: [
          { monsterId: 8789, monsterName: '中型独轮蒸汽机', count: 8 }
        ]
      },
      {
        id: 'knight_2',
        name: '英雄的足迹 -守护者-',
        description: '去圣堂的守护之室打守护兽贝纳卡度温获得他的心脏，再去找[骑士守护使者]波内佩拉！',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  blade_warrior: {
    targetJobKey: 'blade_warrior',
    targetJobName: '刀锋战士',
    tier: 2,
    quests: [
      {
        id: 'blade_warrior_1',
        name: '英雄的足迹 -祭坛-',
        description: '到晨光的沉默高原，打倒蓝岩毒蝎取得暗黑泪珠，再交给[刀锋战士祭司]杰普迪！',
        killTargets: [
          { monsterId: 5469, monsterName: '蓝岩毒蝎', count: 1 }
        ]
      },
      {
        id: 'blade_warrior_2',
        name: '英雄的足迹 -守护者-',
        description: '去打倒守护兽贝纳卡度温，取得它的心脏，再去找刀锋战士守护使者桑希里特。',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  element_mage: {
    targetJobKey: 'element_mage',
    targetJobName: '元素使者',
    tier: 2,
    quests: [
      {
        id: 'element_mage_1',
        name: '英雄的足迹 -大师-',
        description: '打倒20个中型自动钻孔机，证明你的实力，取得英雄的认可！',
        killTargets: [
          { monsterId: 9320, monsterName: '中型自动钻孔机', count: 20 }
        ]
      },
      {
        id: 'element_mage_2',
        name: '英雄的足迹 -守护者-',
        description: '去圣堂的守护之室打倒守护兽贝纳卡度温，取得他的心脏，再去找元素使者守护使者文嫡凌！',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  spirit_mage: {
    targetJobKey: 'spirit_mage',
    targetJobName: '精神使者',
    tier: 2,
    quests: [
      {
        id: 'spirit_mage_1',
        name: '英雄的继承者-魔法衬衣-',
        description: '打倒米娅取得魔法衬衣，连同推荐信一起交给亡者之潭的精神使者贤者可林！',
        killTargets: [
          { monsterId: 9663, monsterName: '米娅', count: 1 }
        ]
      },
      {
        id: 'spirit_mage_2',
        name: '英雄的足迹 -守护者-',
        description: '打倒守护兽贝纳卡度温并取得他的心脏后，再去找精神使者守护使者夏尼普！',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  ranger: {
    targetJobKey: 'ranger',
    targetJobName: '游侠',
    tier: 2,
    quests: [
      {
        id: 'ranger_1',
        name: '英雄的足迹 - 祭坛',
        description: '打倒进阶小丑术士取得8本遗失的英雄之书，去达肯3的魔夜之森找[游侠祭司]芦苹吧。',
        killTargets: [
          { monsterId: 4862, monsterName: '进阶小丑术士', count: 8 }
        ]
      },
      {
        id: 'ranger_2',
        name: '英雄的足迹 - 守护者',
        description: '请你去圣堂找卡伊雷雅德，找到他之前你要先去守护之室与贝纳卡度温对战才行。',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  assassin: {
    targetJobKey: 'assassin',
    targetJobName: '暗杀者',
    tier: 2,
    quests: [
      {
        id: 'assassin_1',
        name: '英雄的足迹 - 祭坛',
        description: '去猎杀西西普得到英雄的宝石，然后拿着卷轴去找达肯3的暗杀大师胡梅。',
        killTargets: [
          { monsterId: 159, monsterName: '西西普', count: 1 }
        ]
      },
      {
        id: 'assassin_2',
        name: '英雄的足迹 - 守护者',
        description: '请你去圣堂找海音卡萝德，找到他之前你得先去守护之室杀死贝纳卡度温。',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  },
  guardian: {
    targetJobKey: 'guardian',
    targetJobName: '守护使者',
    tier: 2,
    quests: [
      {
        id: 'guardian_1',
        name: '英雄的足迹 -祭坛-',
        description: '淘金者就在达肯1区，找回物品之后，再拿给达肯3的守护使者祭司海登！',
        killTargets: [
          { monsterId: 377, monsterName: '淘金者', count: 1 }
        ]
      },
      {
        id: 'guardian_2',
        name: '英雄的足迹 -守护者-',
        description: '去打倒守护兽贝纳卡蒂诺，并取得他的心脏，再去找守护使者隆波艾达！',
        killTargets: [
          { monsterId: 8306, monsterName: '贝纳卡蒂诺', count: 1 }
        ]
      }
    ]
  },
  technician: {
    targetJobKey: 'technician',
    targetJobName: '暴力技师',
    tier: 2,
    quests: [
      {
        id: 'technician_1',
        name: '英雄的足迹 -祭坛-',
        description: '从中型蒸汽机甲处取回技能海报，再交给达肯3暴力技师祭坛的祭司菲拉！',
        killTargets: [
          { monsterId: 5224, monsterName: '中型蒸汽机甲', count: 1 }
        ]
      },
      {
        id: 'technician_2',
        name: '英雄的足迹 -守护者-',
        description: '去打倒守护兽贝纳卡度温，并取得他的心脏，再去找暴力技师守护使者卡班沛！',
        killTargets: [
          { monsterId: 2776, monsterName: '贝纳卡度温', count: 1 }
        ]
      }
    ]
  }
})

/**
 * 三转职业转职任务链定义（5阶段，手动配置）
 * 任务流程：
 *   1. 觉醒引导（对话）- 祝贺玩家达到166级，引导完成后续任务
 *   2. 实力证明1 击杀小怪（击杀）- 击杀珊瑚岛大型rank怪物各100个，奖励金币1000万+终极防护卷轴×10
 *   3. 实力证明2 堕落BOSS（击杀）- 击杀珊瑚岛8个堕落级BOSS各1个，奖励金币1000万+晶石×10
 *   4. 实力证明3 副本试炼（击杀）- 击杀[暗影中尉]克里顿副本BOSS，奖励金币1亿+宠物笼钥匙(高级)×20+魔法牢笼×20
 *   5. 觉醒赐予（对话）- 赐予玩家觉醒三转职业能力，奖励属性点重置卷×1+终极之力卷轴×10+终极加成卷轴×10
 * 珊瑚岛怪物数据：
 *   - 大型rank: 大型热带虎(ID:15439), 大型巨钳蟹(ID:10050), 大型变异枪鱼(ID:10748), 大型皇冠海妖(ID:15246), 大型北海巨妖(ID:14281)
 *   - 堕落级BOSS: 堕落的猛犸象(ID:2550), 堕落的巨齿蛉(ID:15441), 堕落的热带虎(ID:14207), 堕落的强袭海盗(ID:11324),
 *                堕落的巨钳蟹(ID:10071), 堕落的霸王虾(ID:11954), 堕落的皇冠海妖(ID:17273), 堕落的北海巨妖(ID:13941)
 * 副本BOSS数据：
 *   - [暗影中尉]克里顿(ID:28482), 克里顿副本任意难度
 * 三转职业进阶路线（与 JobChangeModal.vue 中 jobBranches 一致）：
 *   knight        -> holy_knight
 *   blade_warrior -> storm_walker
 *   element_mage  -> arcane_master
 *   spirit_mage   -> mind_master
 *   ranger        -> fierce_shooter
 *   assassin      -> joker_emperor
 *   guardian      -> nature_messenger
 *   technician    -> combat_master
 */

/**
 * 生成三转职业的5阶段转职任务链
 * @param {string} jobKey - 职业标识（如 'holy_knight'）
 * @param {string} jobName - 职业中文名（如 '圣殿骑士'）
 * @returns {Object} 转职任务链配置对象
 */
function createThirdJobQuestChain(jobKey, jobName) {
  return {
    targetJobKey: jobKey,
    targetJobName: jobName,
    tier: 3,
    quests: [
      {
        id: `${jobKey}_1`,
        name: '觉醒引导',
        type: 'dialogue',
        description: `尊敬的冒险家，你好！恭喜你终于达到了三转等级166级，可以觉醒新的职业「${jobName}」。现在去完成后续任务吧，我在这里等你归来！`,
        killTargets: []
      },
      {
        id: `${jobKey}_2`,
        name: '实力证明1 击杀小怪',
        type: 'kill',
        description: '前往珊瑚岛，击杀大型级怪物大型热带虎、大型巨钳蟹、大型变异枪鱼、大型皇冠海妖、大型北海巨妖各100只，证明你的实力！',
        killTargets: [
          { monsterId: 15439, monsterName: '大型热带虎', count: 100 },
          { monsterId: 10050, monsterName: '大型巨钳蟹', count: 100 },
          { monsterId: 10748, monsterName: '大型变异枪鱼', count: 100 },
          { monsterId: 15246, monsterName: '大型皇冠海妖', count: 100 },
          { monsterId: 14281, monsterName: '大型北海巨妖', count: 100 }
        ],
        rewards: {
          gold: 10000000,
          items: [
            { itemId: 14737, itemName: '终极防护卷轴', count: 10 }
          ]
        }
      },
      {
        id: `${jobKey}_3`,
        name: '实力证明2 堕落BOSS',
        type: 'kill',
        description: '前往珊瑚岛，击杀堕落级BOSS：堕落的猛犸象、堕落的巨齿蛉、堕落的热带虎、堕落的强袭海盗、堕落的巨钳蟹、堕落的霸王虾、堕落的皇冠海妖、堕落的北海巨妖，各1只！',
        killTargets: [
          { monsterId: 2550, monsterName: '堕落的猛犸象', count: 1 },
          { monsterId: 15441, monsterName: '堕落的巨齿蛉', count: 1 },
          { monsterId: 14207, monsterName: '堕落的热带虎', count: 1 },
          { monsterId: 11324, monsterName: '堕落的强袭海盗', count: 1 },
          { monsterId: 10071, monsterName: '堕落的巨钳蟹', count: 1 },
          { monsterId: 11954, monsterName: '堕落的霸王虾', count: 1 },
          { monsterId: 17273, monsterName: '堕落的皇冠海妖', count: 1 },
          { monsterId: 13941, monsterName: '堕落的北海巨妖', count: 1 }
        ],
        rewards: {
          gold: 10000000,
          items: [
            { itemId: 15403, itemName: '晶石', count: 10 }
          ]
        }
      },
      {
        id: `${jobKey}_4`,
        name: '实力证明3 副本试炼',
        type: 'kill',
        description: '挑战[暗影中尉]克里顿副本（任意难度），击杀副本BOSS[暗影中尉]克里顿！',
        killTargets: [
          { monsterId: 28482, monsterName: '[暗影中尉]克里顿', count: 1 }
        ],
        rewards: {
          gold: 100000000,
          items: [
            { itemId: 2347, itemName: '宠物笼钥匙(高级)', count: 20 },
            { itemId: 1000000, itemName: '魔法牢笼', count: 20 }
          ]
        }
      },
      {
        id: `${jobKey}_5`,
        name: '觉醒赐予',
        type: 'dialogue',
        description: `恭喜你用实力证明了，拥有觉醒三转职业的能力。那么现在，我将以瑞加大祭司的名义，赐予你觉醒「${jobName}」的能力！`,
        killTargets: [],
        rewards: {
          gold: 0,
          items: [
            { itemId: 1099, itemName: '属性点重置卷', count: 1 },
            { itemId: 12252, itemName: '终极之力卷轴', count: 10 },
            { itemId: 12944, itemName: '终极加成卷轴', count: 10 }
          ]
        }
      }
    ]
  }
}

export const THIRD_JOB_CHANGE_QUESTS = Object.freeze({
  holy_knight: createThirdJobQuestChain('holy_knight', '圣殿骑士'),
  storm_walker: createThirdJobQuestChain('storm_walker', '猎杀者'),
  arcane_master: createThirdJobQuestChain('arcane_master', '奥术师'),
  mind_master: createThirdJobQuestChain('mind_master', '心灵师'),
  nature_messenger: createThirdJobQuestChain('nature_messenger', '炽天使'),
  combat_master: createThirdJobQuestChain('combat_master', '格斗宗师'),
  fierce_shooter: createThirdJobQuestChain('fierce_shooter', '爆裂射手'),
  joker_emperor: createThirdJobQuestChain('joker_emperor', '暗夜主宰')
})

/**
 * 获取指定职业的一转转职任务链
 * @param {string} targetJobKey - 目标职业 key（如 'warrior'）
 * @returns {JobChangeQuestChain|null} 转职任务链，如果不存在则返回 null
 */
export function getFirstJobChangeQuestChain(targetJobKey) {
  return JOB_CHANGE_QUESTS[targetJobKey] ?? null
}

/**
 * 获取指定职业的二转转职任务链
 * @param {string} targetJobKey - 目标职业 key（如 'knight'）
 * @returns {JobChangeQuestChain|null} 转职任务链，如果不存在则返回 null
 */
export function getSecondJobChangeQuestChain(targetJobKey) {
  return SECOND_JOB_CHANGE_QUESTS[targetJobKey] ?? null
}

/**
 * 获取指定职业的三转转职任务链
 * @param {string} targetJobKey - 目标职业 key（如 'holy_knight'）
 * @returns {JobChangeQuestChain|null} 转职任务链，如果不存在则返回 null
 */
export function getThirdJobChangeQuestChain(targetJobKey) {
  return THIRD_JOB_CHANGE_QUESTS[targetJobKey] ?? null
}

/**
 * 获取指定职业的转职任务链（通用入口）
 * 自动根据职业 key 从一转、二转、三转配置中查找
 * @param {string} targetJobKey - 目标职业 key（如 'warrior'、'knight'、'holy_knight'）
 * @returns {JobChangeQuestChain|null} 转职任务链，如果不存在则返回 null
 */
export function getJobChangeQuestChain(targetJobKey) {
  return JOB_CHANGE_QUESTS[targetJobKey] ?? SECOND_JOB_CHANGE_QUESTS[targetJobKey] ?? THIRD_JOB_CHANGE_QUESTS[targetJobKey] ?? null
}

export default {
  JOB_CHANGE_QUESTS,
  SECOND_JOB_CHANGE_QUESTS,
  THIRD_JOB_CHANGE_QUESTS,
  getFirstJobChangeQuestChain,
  getSecondJobChangeQuestChain,
  getThirdJobChangeQuestChain,
  getJobChangeQuestChain
}
