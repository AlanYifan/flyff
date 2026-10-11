/**
 * 对话系统服务
 * 负责从 NPC_INFO 和 QUEST_INFO 中查询NPC信息和匹配任务对话
 * 参考原神对话模式：NPC问候 → 任务介绍 → 玩家选择（接受/拒绝）→ 对应反馈
 *
 * @file DialogueService.js
 * @generated 2026-06-26
 */

import { NPCDialogService } from './NPCDialogService'
import { isMasterGradeQuest, isMasterQuestLevelMet } from './MasterGradeService'

/**
 * 地图名称 → 任务委托NPC ID 映射表
 * 用于在 NPCContainer 点击任务NPC时，查找对应的 NPC_INFO ID
 */
const MAP_QUEST_NPC_ID = {
  帕里大陆: 29,
  晨光大陆: 4000,
  莱斯大陆: 29,
  '达肯1,2大陆': 4677,
  达肯3大陆: 4677,
  阿兹利亚: 9645,
  珊瑚岛: 17461,
  凯伦草原: 29222
}

/**
 * NPC类型 → NPCDialogService 键 映射表
 * 用于商店NPC的闲聊对话
 */
const SHOP_TYPE_DIALOG_KEY = {
  blacksmith: 'weaponShop',
  armor: 'armorShop',
  food: 'foodShop',
  magic: 'magicShop',
  storage: 'warehouse'
}

/**
 * 特殊NPC类型的自定义对话
 * 用于职业导师/宠物训练师/深渊之塔/珠宝大师/钻石商店/华弗商店
 */
const SPECIAL_NPC_DIALOGS = {
  'job-change': [
    ['路易：冒险家，你的实力已经到了可以突破的临界点。', '想要进阶到更高的职业阶层吗？这需要经过严格的考验。'],
    ['路易：瑞加大陆的职业体系博大精深，每一次进阶都是一次蜕变。', '准备好迎接新的挑战了吗？'],
    ['路易：我感应到你体内的力量在涌动，是时候迈出下一步了。', '职业进阶后，你将获得更强大的技能和属性。']
  ],
  'pet-trainer': [
    ['宠物训练师：嘿！你喜欢宠物吗？我可以帮你训练它们！', '一只训练有素的宠物，可是冒险路上最好的伙伴。'],
    ['宠物训练师：宠物也需要成长和锻炼，来找我准没错！', '看看你身边的小伙伴，是不是该让它变得更强了？'],
    ['宠物训练师：每只宠物都有无限的潜力，关键在于如何激发。', '让我来帮你释放它们的力量吧！']
  ],
  'tower': [
    ['深渊之塔管理员：深渊之塔，是检验勇者实力的终极试炼场。', '每一层都充满未知的危险与机遇，你敢来挑战吗？'],
    ['深渊之塔管理员：塔中层出不穷的怪物，是获取稀有装备的绝佳途径。', '但只有真正的强者才能登上塔顶。'],
    ['深渊之塔管理员：冒险家，深渊之塔的层数代表着你的实力。', '越高层的奖励越丰厚，当然危险也越大。']
  ],
  'jewelry-master': [
    ['珠宝大师-皮奇：你好呀！我是珠宝大师皮奇，专门研究宝石的镶嵌与提取。', '想让你的装备更强大吗？宝石镶嵌是不错的选择！'],
    ['珠宝大师-皮奇：每颗宝石都蕴含着独特的力量，关键在于如何运用。', '来吧，让我看看你的装备需要什么宝石！'],
    ['珠宝大师-皮奇：宝石的世界奇妙无穷，镶嵌、提取、替换，样样精通。', '有什么需要尽管说，皮奇包你满意！']
  ],
  'diamond-shop': [
    ['瑞多斯：欢迎光临钻石商店！这里有各种稀有道具和特权。', '使用钻石可以购买到普通商店买不到的好东西哦！'],
    ['瑞多斯：钻石是瑞加大陆最珍贵的货币，一定要花在刀刃上。', '看看今天的推荐商品，说不定有你需要的东西。'],
    ['瑞多斯：冒险家，钻石商店的货品定期更新，记得常来看看。', '有些限量商品可是错过了就没有了！']
  ],
  'huafu-shop': [
    ['华弗：嘿，冒险家！这里是PK纸片兑换中心。', '在竞技场获得的PK纸片，可以在这里兑换各种奖励。'],
    ['华弗：PK纸片是你实力的证明，也是通往更强装备的钥匙。', '怎么样，要不要看看能兑换什么好东西？'],
    ['华弗：竞技场的战斗永不停歇，PK纸片的收集也永无止境。', '来吧，用你的战果换取应得的奖励！']
  ],
  'master-quest': [
    ['蕾拉：你好，冒险家。我是蕾拉，负责大师进阶试炼。', '只有通过层层考验，才能突破极限，达到更高的境界。'],
    ['蕾拉：大师进阶之路充满挑战，但回报也同样丰厚。', '准备好了吗？让我看看你的实力。'],
    ['蕾拉：每一位大师都曾经历过这些试炼。', '现在轮到你了，让我看看你是否有资格成为大师。']
  ]
}

/**
 * 特殊NPC ID → 对话键 映射表
 * 用于没有 shopType 但需要特殊问候语的NPC（如深渊之塔管理员直接展示任务列表）
 */
const NPC_ID_DIALOG_KEY = {
  11734: 'tower',
  10696: 'master-quest'
}

/**
 * 对话阶段枚举
 * @enum {string}
 */
export const DIALOGUE_PHASE = {
  GREETING: 'greeting',
  QUEST_LIST: 'questList',
  QUEST_INTRO: 'questIntro',
  QUEST_OPTIONS: 'questOptions',
  QUEST_ACCEPT: 'questAccept',
  QUEST_DECLINE: 'questDecline',
  QUEST_COMPLETE_LIST: 'questCompleteList',
  QUEST_COMPLETE: 'questComplete',
  QUEST_FAIL: 'questFail',
  FREE_TALK: 'freeTalk',
  FAREWELL: 'farewell'
}

/**
 * 大师进阶任务英文对话文本 → 中文翻译映射表
 * QUEST_INFO.js 中大师进阶(1-6)任务的 cns 字段存放了英文原文，
 * 此映射表将英文翻译为简体中文用于显示
 */
const MASTER_QUEST_TRANSLATIONS = {
  // dialogsBegin
  'We\u2019re almost done, don\u2019t worry. But for now, let\u2019s keep going?': '我们快完成了，别担心。现在，让我们继续吧？',
  'And yes, as usual, same rules!': '没错，和往常一样，规则不变！',
  'This time, it will be from level 90 to 100! So, shall we go?': '这一次，是从90级到100级！那么，我们开始吧？',
  'One more and then it\u2019s the last!': '再来一次，然后就是最后一个了！',
  'This time, it will be from level 100 to 110! So, shall we go?': '这一次，是从100级到110级！那么，我们开始吧？',
  'Here you are again!? The last time was too easy... What if we put it back but a notch up?': '你又来了！？上次太简单了……如果再来一次但难度增加一点怎么样？',
  'Like last time, I take your levels and you go back up! As simple as that!': '和上次一样，我取走你的等级，你再升回来！就这么简单！',
  'And like last time, if you want to resume your previous progression, you can cancel the quest, you will resume the progression of the latter by resuming the quest!': '和上次一样，如果你想恢复之前的进度，可以取消任务，通过重新接取任务来恢复后续的进度！',
  'This time, it will be from level 70 to 80! So, shall we go?': '这一次，是从70级到80级！那么，我们开始吧？',
  'Do you really think you\u2019re the strongest? You\u2019re wrong. You can be stronger! Listen... What if I told you that you could... relive certain moments of your life? It would be crazy, wouldn\u2019t it?': '你真的认为自己是最强的吗？你错了。你可以变得更强！听着……如果我告诉你，你可以……重温生命中的某些时刻呢？这听起来很疯狂，不是吗？',
  'I\u2019m bringing you down to level 60, and when you get to level 70, come back to me! I\u2019ll give you back your previous levels with a little gift.': '我会把你降到60级，当你升到70级时回来找我！我会把之前的等级还给你，还有一份小礼物。',
  'The last time you finished your task in no time. What do you think? Let\u2019s go back?': '上次你很快就完成了任务。你觉得呢？再来一次？',
  'The rules are not changing, so what are we waiting for?': '规则没有改变，那我们还在等什么？',
  'This time, it will be from level 80 to 90! So, shall we go?': '这一次，是从80级到90级！那么，我们开始吧？',
  'Here we are! This is one of the last missions I have for you at the moment. Are you still motivated?': '到了！这是我目前为你准备的最后几个任务之一。你还有动力吗？',
  'This time, it will be from level 110 to 120! So, shall we go?': '这一次，是从110级到120级！那么，我们开始吧？',
  // dialogsAccept
  'Great! Then I\u2019ll wait here!': '太好了！那我就在这里等着！',
  'Perfect! I\u2019ve taken your levels, come back to me when you reach the goal of our arrangement!': '完美！我已经取走了你的等级，当你达到我们约定目标时回来找我！',
  // dialogsDecline
  'No problem, just come back!': '没问题，随时回来！',
  'Oh I see... you\u2019re probably too weak.': '哦，我明白了……你可能还太弱了。',
  // dialogsComplete
  'Great! I expected no less from you. Here\u2019s your reward.': '太棒了！我对你期望很高，这是你的奖励。',
  'Wonderful! So I give you back your levels, and the little gift with it! Thank you for your help and see you soon!': '太精彩了！我把等级还给你，还有一份小礼物！感谢你的帮助，下次再见！',
  // dialogsFail
  'You haven\u2019t been able to complete our arrangement? Too bad, others will!': '你没能完成我们的约定？太遗憾了，其他人会的！'
}

/**
 * 从多语言对象中提取中文文本，回退到英文
 * 如果 cns 字段为英文（大师进阶任务数据中存在此问题），
 * 优先通过翻译映射表转换为中文
 * @param {Object} langObj - 多语言对象 { cns, en, ... }
 * @returns {string} 提取的文本
 */
function extractText (langObj) {
  if (!langObj || typeof langObj !== 'object') {
    return ''
  }
  const text = langObj.cns || langObj.en || ''
  // 如果文本在翻译映射表中，返回翻译后的中文
  if (text && MASTER_QUEST_TRANSLATIONS[text]) {
    return MASTER_QUEST_TRANSLATIONS[text]
  }
  return text
}

/**
 * 从任务描述中替换占位符变量
 * @param {string} text - 原始文本
 * @param {Object} quest - 任务对象
 * @param {Object} itemNames - 物品名称映射
 * @returns {string} 替换后的文本
 */
function replaceQuestPlaceholders (text, quest, itemNames = {}) {
  if (!text) return ''
  let result = text
  // 替换 $QUEST_END_ITEM_NAME$ 为任务需求物品名称
  if (quest?.endNeededItems?.length > 0) {
    const firstItem = quest.endNeededItems[0]
    const itemName = itemNames[firstItem.item] || `物品${firstItem.item}`
    result = result.replace(/\$QUEST_END_ITEM_NAME\$/g, itemName)
  }
  return result
}

/**
 * 将任务对话数组转换为纯文本行数组
 * @param {Array} dialogs - 任务对话数组，每项为多语言对象
 * @param {Object} quest - 任务对象（用于占位符替换）
 * @param {Object} itemNames - 物品名称映射
 * @returns {Array<string>} 文本行数组
 */
function dialogsToLines (dialogs, quest = null, itemNames = {}) {
  if (!Array.isArray(dialogs) || dialogs.length === 0) {
    return []
  }
  return dialogs.map(d => {
    const text = extractText(d)
    return quest ? replaceQuestPlaceholders(text, quest, itemNames) : text
  })
}

export class DialogueService {
  /**
   * 构造函数
   * @param {Object} staticDataService - 静态数据服务实例
   */
  constructor (staticDataService = null) {
    this.staticDataService = staticDataService
    this.npcDialogService = new NPCDialogService()
    this._npcCache = null
    this._questCache = null
    this._itemCache = null
  }

  /**
   * 设置静态数据服务实例
   * @param {Object} service - StaticDataService 实例
   */
  setStaticDataService (service) {
    this.staticDataService = service
  }

  /**
   * 异步加载 NPC_INFO 数据（带缓存）
   * @returns {Promise<Object>} NPC_INFO 对象
   */
  async loadNpcData () {
    if (this._npcCache) return this._npcCache
    try {
      if (this.staticDataService) {
        const data = await this.staticDataService.loadNpcData()
        this._npcCache = data || {}
        return this._npcCache
      }
    } catch (error) {
      console.error('[DialogueService] 加载NPC数据失败:', error)
    }
    return {}
  }

  /**
   * 异步加载 QUEST_INFO 数据（带缓存）
   * @returns {Promise<Object>} QUEST_INFO 对象
   */
  async loadQuestData () {
    if (this._questCache) return this._questCache
    try {
      if (this.staticDataService) {
        const data = await this.staticDataService.loadQuestData()
        this._questCache = data || {}
        return this._questCache
      }
    } catch (error) {
      console.error('[DialogueService] 加载任务数据失败:', error)
    }
    return {}
  }

  /**
   * 异步加载 ITEM_INFO 数据（带缓存）
   * 用于解析任务目标物品和奖励物品的名称
   * @returns {Promise<Object>} ITEM_INFO 对象
   */
  async loadItemData () {
    if (this._itemCache) return this._itemCache
    try {
      if (this.staticDataService) {
        const data = await this.staticDataService.loadItemData()
        this._itemCache = data || {}
        return this._itemCache
      }
    } catch (error) {
      console.error('[DialogueService] 加载物品数据失败:', error)
    }
    return {}
  }

  /**
   * 根据物品ID获取物品名称
   * @param {number} itemId - 物品ID
   * @param {Object} itemData - 物品数据映射
   * @returns {string} 物品名称
   */
  getItemName (itemId, itemData = {}) {
    const item = itemData[itemId] || itemData[String(itemId)]
    if (!item) return `物品${itemId}`
    return extractText(item.name) || `物品${itemId}`
  }

  /**
   * 根据地图名称获取任务委托NPC ID
   * @param {string} mapName - 地图名称
   * @returns {number|null} NPC ID
   */
  getQuestNpcIdByMap (mapName) {
    return MAP_QUEST_NPC_ID[mapName] || null
  }

  /**
   * 根据 NPC ID 获取NPC信息
   * @param {number} npcId - NPC ID
   * @returns {Promise<Object|null>} NPC信息对象
   */
  async getNPCInfo (npcId) {
    const npcData = await this.loadNpcData()
    const npc = npcData[npcId] || npcData[String(npcId)]
    if (!npc) return null
    return {
      id: npc.id,
      name: extractText(npc.name),
      place: npc.place || '',
      menus: npc.menus || [],
      image: npc.image || '',
      shop: npc.shop || []
    }
  }

  /**
   * 获取NPC可接取的任务列表
   * 筛选条件：beginNPC 匹配、等级满足、未接取且未完成
   * 每日任务（type=daily）不检查 completedQuests，而是检查 dailyCompletedQuests 今日是否已完成
   * @param {number} npcId - NPC ID
   * @param {Object} player - 玩家数据
   * @param {Object} [mapLevelRange] - 地图等级范围 { minLevel, maxLevel }
   * @returns {Promise<Array>} 可接取的任务数组
   */
  async getAvailableQuests (npcId, player, mapLevelRange = null) {
    const questData = await this.loadQuestData()
    if (!questData) return []

    // 使用 Number() 统一类型，避免 number/string 类型不匹配导致 Set.has() 失败
    const activeQuestIds = new Set(
      (player?.quest?.activeQuests || []).map(q => Number(q.id))
    )
    const completedQuestIds = new Set(
      (player?.quest?.completedQuests || []).map(q => Number(q.id))
    )
    // 每日任务今日完成记录 { questId: 'YYYY-MM-DD' }
    const dailyCompletedQuests = player?.quest?.dailyCompletedQuests || {}
    const todayStr = this._getTodayDateString()

    return Object.values(questData)
      .filter(quest => Number(quest.beginNPC) === Number(npcId))
      .filter(quest => {
        // 地图等级范围筛选（如果提供了）
        if (mapLevelRange) {
          return (
            quest.minLevel >= mapLevelRange.minLevel &&
            quest.minLevel <= mapLevelRange.maxLevel
          )
        }
        return true
      })
      .filter(quest => {
        // 已在活动任务列表中的不可接取（使用 Number 统一类型）
        if (activeQuestIds.has(Number(quest.id))) return false

        // 每日任务：检查今天是否已完成
        if (quest.type === 'daily') {
          const lastCompleteDate = dailyCompletedQuests[quest.id]
          // 今天已完成则不可接取
          if (lastCompleteDate === todayStr) return false
          // 每日任务可以重复接取（即使之前完成过）
          return true
        }

        // 普通任务：检查是否已完成
        return !completedQuestIds.has(Number(quest.id))
      })
      .filter(quest => {
        // 前置任务检查：beginQuests 中每个前置任务都必须满足 completed 条件
        // completed: true 表示该前置任务必须已完成
        // completed: false 表示该前置任务必须未完成
        if (!Array.isArray(quest.beginQuests) || quest.beginQuests.length === 0) {
          return true
        }
        return quest.beginQuests.every(req => {
          // 使用 Number() 统一类型，确保前置任务ID与已完成任务ID集合类型一致
          const prereqCompleted = completedQuestIds.has(Number(req.quest))
          return req.completed ? prereqCompleted : !prereqCompleted
        })
      })
      .sort((a, b) => a.minLevel - b.minLevel)
  }

  /**
   * 获取今日日期字符串（YYYY-MM-DD格式）
   * @returns {string} 今日日期字符串
   */
  _getTodayDateString () {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  /**
   * 检查任务是否真正可完成（背包物品+击杀进度均达标）
   * 参考 QuestService.isQuestCompletable 的实现逻辑
   * @param {Object} quest - 任务对象（含 endNeededItems / endKillMonsters）
   * @param {Object} player - 玩家数据（含 bag）
   * @returns {boolean} 是否满足完成条件
   */
  checkQuestCompletable (quest, player) {
    if (!quest || !player) return false

    // 检查物品收集是否完成
    if (quest.endNeededItems && Array.isArray(quest.endNeededItems) && quest.endNeededItems.length > 0) {
      const playerBag = Array.isArray(player?.bag) ? player.bag : []

      for (const itemReq of quest.endNeededItems) {
        const rawItemId = itemReq?.item
        const itemIdNumber = Number(rawItemId)
        const itemId = Number.isFinite(itemIdNumber) ? itemIdNumber : rawItemId

        const requiredCountNumber = Number(itemReq?.count)
        const requiredCount = Number.isFinite(requiredCountNumber) ? requiredCountNumber : 0

        // 统计背包中该物品的数量（叠加物品取 currentStack，非叠加取 quantity 或 1）
        const targetKey = String(itemId)
        const playerItemCount = playerBag
          .filter(item => item && String(item.id) === targetKey)
          .reduce((total, item) => {
            const raw = item.currentStack ?? item.quantity ?? 1
            const value = Number(raw)
            return total + (Number.isFinite(value) && value > 0 ? value : 1)
          }, 0)

        if (playerItemCount < requiredCount) {
          return false
        }
      }
    }

    // 检查怪物击杀是否完成
    if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters) && quest.endKillMonsters.length > 0) {
      for (const monsterReq of quest.endKillMonsters) {
        const killedCountNumber = Number(monsterReq?.killedCount ?? monsterReq?.current ?? 0)
        const killedCount = Number.isFinite(killedCountNumber) ? killedCountNumber : 0

        const requiredCountNumber = Number(monsterReq?.count)
        const requiredCount = Number.isFinite(requiredCountNumber) ? requiredCountNumber : 0

        if (killedCount < requiredCount) {
          return false
        }
      }
    }

    // ★ 大师进阶任务：检查玩家等级是否达到目标等级
    if (isMasterGradeQuest(quest.id)) {
      if (!isMasterQuestLevelMet(player, quest)) {
        return false
      }
    }

    return true
  }

  /**
   * 获取NPC可提交的任务列表
   * 筛选条件：endNPC 匹配、已在活动任务中、且玩家满足完成条件（背包物品+击杀进度）
   * @param {number} npcId - NPC ID
   * @param {Object} player - 玩家数据
   * @returns {Promise<Array>} 可提交的任务数组
   */
  async getCompletableQuests (npcId, player) {
    const questData = await this.loadQuestData()
    if (!questData) return []

    const activeQuests = player?.quest?.activeQuests || []
    const questDataMap = questData

    return activeQuests
      .filter(aq => {
        // 使用 Number() 统一类型，避免 questDataMap 键查找失败
        const questInfo = questDataMap[aq.id] || questDataMap[String(aq.id)] || questDataMap[Number(aq.id)]
        if (!questInfo || Number(questInfo.endNPC) !== Number(npcId)) return false

        // 合并静态任务数据和玩家进度，用于检查完成条件
        const mergedQuest = { ...questInfo, ...aq }

        // 检查玩家是否真正满足任务完成条件（背包物品数量、击杀进度）
        return this.checkQuestCompletable(mergedQuest, player)
      })
      .map(aq => {
        const questInfo = questDataMap[aq.id] || questDataMap[String(aq.id)] || questDataMap[Number(aq.id)]
        return { ...questInfo, playerProgress: aq }
      })
  }

  /**
   * 获取任务的对话行数组
   * @param {Object} quest - 任务对象
   * @param {string} phase - 对话阶段（见 DIALOGUE_PHASE）
   * @param {Object} itemNames - 物品名称映射（用于占位符替换）
   * @returns {Array<string>} 对话行数组
   */
  getQuestDialogLines (quest, phase, itemNames = {}) {
    if (!quest) return []

    const phaseFieldMap = {
      [DIALOGUE_PHASE.QUEST_INTRO]: 'dialogsBegin',
      [DIALOGUE_PHASE.QUEST_ACCEPT]: 'dialogsAccept',
      [DIALOGUE_PHASE.QUEST_DECLINE]: 'dialogsDecline',
      [DIALOGUE_PHASE.QUEST_COMPLETE]: 'dialogsComplete',
      [DIALOGUE_PHASE.QUEST_FAIL]: 'dialogsFail'
    }

    const fieldName = phaseFieldMap[phase]
    if (!fieldName) return []

    return dialogsToLines(quest[fieldName], quest, itemNames)
  }

  /**
   * 构建任务详情文本（描述、目标、奖励）
   * 用于在 QUEST_OPTIONS 阶段展示完整任务信息
   * @param {Object} quest - 任务对象
   * @param {Object} itemData - 物品数据映射
   * @param {number} playerLevel - 玩家等级（用于计算经验奖励）
   * @returns {Array<string>} 详情文本行数组
   */
  buildQuestDetails (quest, itemData = {}, playerLevel = 1) {
    if (!quest) return []
    const lines = []
    const questName = extractText(quest.name) || '未知任务'
    const dailyTag = quest.type === 'daily' ? ' [每日任务]' : ''

    // 任务名称与等级要求
    lines.push(`「${questName}」${dailyTag}  Lv.${quest.minLevel} - ${quest.maxLevel}`)

    // 任务描述
    const desc = extractText(quest.description)
    if (desc) {
      const resolvedDesc = replaceQuestPlaceholders(desc, quest, this._buildItemNameMap(quest, itemData))
      lines.push(`\n${resolvedDesc}`)
    }

    // 任务目标
    if (quest.endNeededItems?.length > 0) {
      lines.push('\n【任务目标】')
      quest.endNeededItems.forEach(item => {
        const itemName = this.getItemName(item.item, itemData)
        lines.push(`  • 收集 ${itemName} ×${item.count}`)
      })
    }

    // 任务奖励
    const rewardLines = []
    if (quest.endReceiveGold > 0) {
      rewardLines.push(`  • 金币 ${quest.endReceiveGold.toLocaleString()}`)
    }
    if (quest.endReceiveExperience?.length > 0) {
      const expIndex = Math.min(playerLevel - 1, quest.endReceiveExperience.length - 1)
      const expValue = quest.endReceiveExperience[Math.max(0, expIndex)]
      if (expValue > 0) {
        rewardLines.push(`  • 经验值 ${expValue.toLocaleString()}`)
      }
    }
    if (quest.endReceiveItems?.length > 0) {
      quest.endReceiveItems.forEach(item => {
        const itemName = this.getItemName(item.item, itemData)
        rewardLines.push(`  • ${itemName} ×${item.count}`)
      })
    }
    if (rewardLines.length > 0) {
      lines.push('\n【任务奖励】')
      lines.push(...rewardLines)
    }

    return lines
  }

  /**
   * 构建任务所需物品ID → 名称的映射
   * @param {Object} quest - 任务对象
   * @param {Object} itemData - 物品数据映射
   * @returns {Object} 物品ID → 名称映射
   */
  _buildItemNameMap (quest, itemData = {}) {
    const map = {}
    const allItems = [
      ...(quest?.endNeededItems || []),
      ...(quest?.endReceiveItems || [])
    ]
    allItems.forEach(entry => {
      if (entry?.item !== undefined) {
        map[entry.item] = this.getItemName(entry.item, itemData)
      }
    })
    return map
  }

  /**
   * 获取任务的简短描述（截取前40字符）
   * 用于在任务列表中预览
   * @param {Object} quest - 任务对象
   * @param {Object} itemData - 物品数据映射
   * @returns {string} 简短描述
   */
  getQuestShortDesc (quest, itemData = {}) {
    const desc = extractText(quest.description)
    if (!desc) return ''
    const resolved = replaceQuestPlaceholders(desc, quest, this._buildItemNameMap(quest, itemData))
    // 去除换行，截取前40字符
    const clean = resolved.replace(/\n/g, ' ').trim()
    return clean.length > 40 ? clean.substring(0, 40) + '...' : clean
  }

  /**
   * 获取商店NPC的闲聊对话
   * 支持普通商店类型（blacksmith/armor/food/magic/storage）
   * 和特殊NPC类型（job-change/pet-trainer/tower/jewelry-master/diamond-shop/huafu-shop）
   * @param {string} shopType - 商店类型
   * @returns {Array<string>} 对话行数组
   */
  getShopDialogLines (shopType) {
    // 先检查特殊NPC对话
    const specialDialogs = SPECIAL_NPC_DIALOGS[shopType]
    if (specialDialogs && specialDialogs.length > 0) {
      const randomIndex = Math.floor(Math.random() * specialDialogs.length)
      return specialDialogs[randomIndex]
    }

    // 再检查普通商店对话
    const dialogKey = SHOP_TYPE_DIALOG_KEY[shopType]
    if (!dialogKey) return ['你好，冒险家！有什么可以帮到你的吗？']
    const dialogs = this.npcDialogService.getDialogs(dialogKey)
    if (!dialogs || dialogs.length === 0) {
      return ['你好，冒险家！有什么可以帮到你的吗？']
    }
    // 随机选一组对话
    const randomIndex = Math.floor(Math.random() * dialogs.length)
    return dialogs[randomIndex]
  }

  /**
   * 获取NPC的默认问候语
   * @param {Object} npcInfo - NPC信息
   * @returns {string} 问候语
   */
  getNPCGreeting (npcInfo) {
    if (!npcInfo) return '你好，冒险家！'
    const name = npcInfo.name || 'NPC'
    const greetings = [
      `${name}：欢迎来到瑞加大陆，冒险家。有什么我可以帮助你的吗？`,
      `${name}：哦？是你啊，冒险家。今天有什么打算呢？`,
      `${name}：你好呀！看你精神饱满的样子，一定是准备好新的冒险了吧？`,
      `${name}：冒险家，欢迎！如果你有需要，尽管告诉我。`
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  /**
   * 构建完整的对话序列
   * 根据NPC类型和任务状态，生成一个有序的对话节点列表
   * @param {Object} params - 参数对象
   * @param {number} params.npcId - NPC ID
   * @param {Object} params.npcConfig - NPCContainer 中的NPC配置（name, icon）
   * @param {Object} params.player - 玩家数据
   * @param {Object} [params.mapLevelRange] - 地图等级范围
   * @param {string} [params.shopType] - 商店类型（如果NPC是商店）
   * @returns {Promise<Object>} 对话序列对象 { npc, phases }
   */
  async buildDialogueSequence (params) {
    const { npcId, npcConfig, player, mapLevelRange, shopType } = params

    // 获取NPC信息
    const npcInfo = await this.getNPCInfo(npcId)
    const npcName = npcConfig?.name || npcInfo?.name || 'NPC'
    const npcIcon = npcConfig?.icon || (npcInfo?.image ? `/pt/npc_icon/${npcInfo.image}` : '/pt/npc_icon/agent.png')

    const npc = {
      id: npcId,
      name: npcName,
      icon: npcIcon,
      info: npcInfo
    }

    // 并行加载任务数据和物品数据
    const [availableQuests, completableQuests, itemData] = await Promise.all([
      this.getAvailableQuests(npcId, player, mapLevelRange),
      this.getCompletableQuests(npcId, player),
      this.loadItemData()
    ])
    const playerLevel = player?.level || 1

    // 构建问候阶段
    // 优先使用 shopType 的特殊对话，其次通过 NPC_ID_DIALOG_KEY 查找特殊NPC对话（如深渊之塔管理员），最后用通用问候
    let greetingLines
    if (shopType) {
      greetingLines = this.getShopDialogLines(shopType)
    } else if (NPC_ID_DIALOG_KEY[npcId]) {
      greetingLines = this.getShopDialogLines(NPC_ID_DIALOG_KEY[npcId])
    } else {
      greetingLines = [this.getNPCGreeting(npcInfo)]
    }

    const phases = [
      {
        phase: DIALOGUE_PHASE.GREETING,
        lines: greetingLines,
        options: []
      }
    ]

    // 如果有可提交的任务，优先处理任务完成
    if (completableQuests.length === 1) {
      // 单个可提交任务：直接展示完成对话
      const quest = completableQuests[0]
      const completeLines = this.getQuestDialogLines(quest, DIALOGUE_PHASE.QUEST_COMPLETE, this._buildItemNameMap(quest, itemData))
      phases.push({
        phase: DIALOGUE_PHASE.QUEST_COMPLETE,
        quest,
        lines: completeLines.length > 0 ? completeLines : ['任务完成了！这是给你的奖励。'],
        options: [
          { label: '领取奖励', action: 'complete-quest', questId: quest.id },
          { label: '稍后再来', action: 'skip' }
        ]
      })
    } else if (completableQuests.length > 1) {
      // 多个可提交任务：展示可提交任务列表供玩家选择
      const completeOptions = completableQuests.map(quest => ({
        label: `${extractText(quest.name)}  (Lv.${quest.minLevel}-${quest.maxLevel})`,
        action: 'select-complete-quest',
        questId: quest.id
      }))
      completeOptions.push({ label: '稍后再来', action: 'skip' })

      phases.push({
        phase: DIALOGUE_PHASE.QUEST_COMPLETE_LIST,
        lines: [`${npcName}：看起来你有 ${completableQuests.length} 个任务可以交给我了，先处理哪个？`],
        options: completeOptions,
        quests: completableQuests
      })
    }

    // 如果有可接取的任务，添加任务列表阶段（展示所有可接取任务+简短描述）
    if (availableQuests.length > 0) {
      const questOptions = availableQuests.map(quest => {
        const shortDesc = this.getQuestShortDesc(quest, itemData)
        const dailyTag = quest.type === 'daily' ? ' [每日]' : ''
        const levelLocked = playerLevel < quest.minLevel
        const lockTag = levelLocked ? ' [等级不足]' : ''
        return {
          label: `${extractText(quest.name)}${dailyTag}${lockTag}  (Lv.${quest.minLevel}-${quest.maxLevel})`,
          desc: shortDesc,
          action: 'select-quest',
          questId: quest.id,
          levelLocked
        }
      })

      // 添加跳过选项，让玩家可以不接任务直接继续
      questOptions.push({ label: '暂时不接任务', action: 'skip' })

      phases.push({
        phase: DIALOGUE_PHASE.QUEST_LIST,
        lines: [`${npcName}：我这里有 ${availableQuests.length} 个任务需要帮忙，你想接取哪个？`],
        options: questOptions,
        quests: availableQuests,
        itemData
      })
    }

    // 如果是商店NPC，添加商店选项
    if (shopType) {
      const lastPhase = phases[phases.length - 1]
      lastPhase.options = [
        ...lastPhase.options,
        { label: '进入商店', action: 'open-shop', shopType }
      ]
    }

    // 告别阶段
    phases.push({
      phase: DIALOGUE_PHASE.FAREWELL,
      lines: [`${npcName}：那我们下次再见吧，冒险家！`],
      options: [{ label: '结束对话', action: 'close' }]
    })

    // 将 itemData 和 playerLevel 存储到返回对象中，供 composable 后续使用
    return { npc, phases, availableQuests, completableQuests, itemData, playerLevel }
  }
}
