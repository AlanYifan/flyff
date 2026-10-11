/**
 * 任务服务 - 负责任务系统的管理和交互
 */
import { useItemsStore } from '@/store/items'
import {
  isMasterGradeQuest,
  isHeroGradeQuest,
  applyMasterGradeLevelReduction,
  restoreMasterGradeLevel,
  isMasterQuestLevelMet,
  getMasterQuestConfig,
  getMasterQuestAchievementId,
  getHeroQuestAchievementId
} from '@/services/MasterGradeService'

/**
 * 深渊之塔任务NPC ID（这些任务为每日任务）
 */
const DAILY_QUEST_NPC_IDS = [11734]

/**
 * 判断任务是否为每日任务
 * @param {Object} quest - 任务对象
 * @returns {boolean} 是否为每日任务
 */
function isDailyQuest (quest) {
  return quest && DAILY_QUEST_NPC_IDS.includes(quest.beginNPC)
}

/**
 * 获取今日日期字符串（YYYY-MM-DD格式）
 * @returns {string} 今日日期字符串
 */
function getTodayDateString () {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export class QuestService {
  constructor (gameDataService, uiService, audioService) {
    this.gameDataService = gameDataService
    this.uiService = uiService
    this.audioService = audioService
    this.playerQuests = {
      activeQuests: [],
      completedQuests: [],
      dailyCompletedQuests: {}
    }
  }

  /**
   * 初始化任务系统
   */
  initialize () {
    console.log('初始化任务系统...')
    // 初始化任务数据
    this.loadPlayerQuests()
    console.log('任务系统初始化完成')
  }

  /**
   * 加载玩家任务数据
   */
  loadPlayerQuests () {
    // 从缓存加载玩家任务数据
    if (this.cachedPlayerQuests) {
      this.playerQuests = { ...this.cachedPlayerQuests }
    }
    console.log('加载玩家任务数据:', this.playerQuests)
  }

  /**
   * 保存玩家任务数据
   * 注意：此方法现在仅用于内部缓存，实际保存由外部存储服务处理
   */
  savePlayerQuests () {
    // 保存到内部缓存
    this.cachedPlayerQuests = { ...this.playerQuests }
    // console.log('保存玩家任务数据到缓存:', this.playerQuests)
  }

  /**
   * 获取可接取任务列表
   * @param {number} playerLevel - 玩家等级
   * @returns {Array} 可接取任务列表
   */
  getAvailableQuests (playerLevel) {
    try {
      // 从游戏数据服务获取所有任务数据
      const allQuests = this.gameDataService.cache.get('quests') || {}
      console.log('所有任务数据:', allQuests)

      // 筛选符合条件的任务
      const availableQuests = Object.values(allQuests).filter(quest => {
        // 等级检查
        if (playerLevel < quest.minLevel || playerLevel > quest.maxLevel) {
          return false
        }

        // 检查是否已经接受
        const isAccepted = this.playerQuests.activeQuests.some(q => q.id === quest.id)
        if (isAccepted) {
          return false
        }

        // 每日任务：检查今天是否已完成
        if (isDailyQuest(quest)) {
          const todayStr = getTodayDateString()
          const lastCompleteDate = this.playerQuests.dailyCompletedQuests?.[quest.id]
          // 如果今天已完成，则不可接取
          if (lastCompleteDate === todayStr) {
            return false
          }
          // 每日任务可以重复接取（即使之前完成过）
          return true
        }

        // 普通任务：检查是否已经完成
        const isCompleted = this.playerQuests.completedQuests.some(q => q.id === quest.id)
        return !isCompleted
      })

      console.log('可接取任务:', availableQuests)
      return availableQuests
    } catch (error) {
      console.error('获取可接取任务失败:', error)
      return []
    }
  }

  /**
   * 获取进行中任务列表
   * @returns {Array} 进行中任务列表
   */
  getActiveQuests () {
    return this.playerQuests.activeQuests
  }

  /**
   * 获取已完成任务列表
   * @returns {Array} 已完成任务列表
   */
  getCompletedQuests () {
    return this.playerQuests.completedQuests
  }

  /**
   * 接受任务
   * @param {Object} quest - 任务对象
   * @param {Object|number} playerLevel - 玩家对象（大师进阶任务需传入对象以执行降级）或玩家等级数字
   * @returns {boolean} 是否接受成功
   */
  acceptQuest (quest, playerLevel) {
    // 兼容传入玩家对象或等级数字
    // 大师进阶任务需要传入玩家对象以执行降级
    const actualLevel = typeof playerLevel === 'object' ? (playerLevel?.level || 1) : playerLevel

    // 检查任务是否存在
    if (!quest) {
      console.error('任务不存在')
      // 播放错误音效
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    // 检查玩家等级是否满足任务要求
    if (actualLevel < quest.minLevel) {
      console.error(`需要等级 ${quest.minLevel} 才能接受此任务`)
      // 播放错误音效
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    // 检查任务是否已经在活动任务列表中
    const isAlreadyActive = this.playerQuests.activeQuests.some(q => q.id === quest.id)
    if (isAlreadyActive) {
      console.log(`任务 ${quest.name?.cns || quest.name?.en || quest.id} 已经在进行中`)
      // 播放错误音效
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    // 每日任务：检查今天是否已完成
    if (isDailyQuest(quest)) {
      const todayStr = getTodayDateString()
      const lastCompleteDate = this.playerQuests.dailyCompletedQuests?.[quest.id]
      if (lastCompleteDate === todayStr) {
        console.log(`每日任务 ${quest.name?.cns || quest.name?.en || quest.id} 今天已完成`)
        // 播放错误音效
        if (this.audioService && typeof this.audioService.playSFX === 'function') {
          this.audioService.playSFX('error.mp3')
        }
        return false
      }
      // 每日任务可以重复接取，不需要检查 completedQuests
    } else {
      // 普通任务：检查任务是否已经完成
      const isAlreadyCompleted = this.playerQuests.completedQuests.some(q => q.id === quest.id)
      if (isAlreadyCompleted) {
        console.log(`任务 ${quest.name?.cns || quest.name?.en || quest.id} 已经完成`)
        // 播放错误音效
        if (this.audioService && typeof this.audioService.playSFX === 'function') {
          this.audioService.playSFX('error.mp3')
        }
        return false
      }
    }

    // 添加任务到活跃任务列表
    this.playerQuests.activeQuests.push({ ...quest, accepted: true })

    // ★ 大师进阶任务：接受后降级
    // acceptQuest 的第二参数在 useQuestManager 中被改为传入玩家对象
    if (isMasterGradeQuest(quest.id) && playerLevel && typeof playerLevel === 'object') {
      applyMasterGradeLevelReduction(playerLevel, quest)
    } else if (isMasterGradeQuest(quest.id)) {
      console.warn('[QuestService] 大师进阶任务需要传入玩家对象以执行降级')
    }

    // 保存任务数据
    this.savePlayerQuests()

    console.log(`接受任务: ${quest.name?.cns || quest.name?.en || quest.id}`)

    // 播放任务接受音效
    if (this.audioService && typeof this.audioService.playMusicSFX === 'function') {
      this.audioService.playMusicSFX('BgmEvStart.mp3')
    }

    return true
  }

  /**
   * 完成任务
   * @param {Object} quest - 任务对象
   * @param {Object} player - 玩家对象
   * @param {Object} bagService - 背包服务
   * @param {Object} equipmentSets - 套装数据
   * @returns {boolean} 是否完成成功
   */
  completeQuest (quest, player, bagService, equipmentSets = {}) {
    // 检查任务是否存在
    if (!quest) {
      console.error('任务不存在')
      // 播放错误音效
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    if (!player) {
      console.error('玩家数据不存在')
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    // 从活跃任务列表中移除
    const activeIndex = this.playerQuests.activeQuests.findIndex(q => q.id === quest.id)
    if (activeIndex === -1) {
      console.error('任务不在进行中列表中')
      // 播放错误音效
      if (this.audioService && typeof this.audioService.playSFX === 'function') {
        this.audioService.playSFX('error.mp3')
      }
      return false
    }

    // 移除任务需求物品（如果有 endRemoveItems 或 endNeededItems）
    this.removeQuestRequiredItems(quest, player, bagService)

    // 发放任务奖励
    this.grantQuestRewards(quest, player, bagService, equipmentSets)

    // ★ 大师进阶任务：完成后恢复原始等级并记录转生阶段
    if (isMasterGradeQuest(quest.id)) {
      restoreMasterGradeLevel(player, true)

      // ★ 大师进阶任务完成时同步更新成就进度
      // 大师进阶成就在 ACHIEVEMENT_INFO 中 type=killmonster 但无 mainMonster，
      // 无法通过击杀事件触发，需要在任务完成时直接设置进度
      try {
        const achievementId = getMasterQuestAchievementId(quest.id)
        if (achievementId !== null) {
          // 动态导入避免循环依赖
          import('@/store').then(({ useGameStore, useAchievementsStore }) => {
            const gameStore = useGameStore()
            const achievementsStore = useAchievementsStore()
            achievementsStore.setProgress(gameStore, achievementId, 1)
            console.log(`[QuestService] 大师进阶任务完成，成就 ${achievementId} 进度已更新`)
          })
        }
      } catch (error) {
        console.error('[QuestService] 更新大师进阶成就进度失败:', error)
      }
    }

    // ★ 英雄进阶任务完成时同步更新英雄成就进度
    // 英雄进阶成就在 ACHIEVEMENT_INFO 中 type=killmonster 但无 mainMonster，
    // 无法通过击杀事件触发，需要在任务完成时直接设置进度
    if (isHeroGradeQuest(quest.id)) {
      try {
        const heroAchievementId = getHeroQuestAchievementId(quest.id)
        if (heroAchievementId !== null) {
          // 动态导入避免循环依赖
          import('@/store').then(({ useGameStore, useAchievementsStore }) => {
            const gameStore = useGameStore()
            const achievementsStore = useAchievementsStore()
            achievementsStore.setProgress(gameStore, heroAchievementId, 1)
            console.log(`[QuestService] 英雄进阶任务完成，成就 ${heroAchievementId} 进度已更新`)
          })
        }
      } catch (error) {
        console.error('[QuestService] 更新英雄进阶成就进度失败:', error)
      }
    }

    // 移除任务
    const completedQuest = this.playerQuests.activeQuests.splice(activeIndex, 1)[0]
    completedQuest.completed = true
    completedQuest.completeTime = Date.now()

    // 每日任务：记录到每日完成记录，第二天可以再次接取
    if (isDailyQuest(quest)) {
      if (!this.playerQuests.dailyCompletedQuests) {
        this.playerQuests.dailyCompletedQuests = {}
      }
      this.playerQuests.dailyCompletedQuests[quest.id] = getTodayDateString()
      console.log(`每日任务完成: ${quest.name?.cns || quest.name?.en || quest.id}，今日不可再次接取`)
    } else {
      // 普通任务：添加到完成列表
      this.playerQuests.completedQuests.push(completedQuest)
    }

    // 保存任务数据
    this.savePlayerQuests()

    console.log(`完成任务: ${quest.name?.cns || quest.name?.en || quest.id}`)

    // 播放任务完成音效
    if (this.audioService && typeof this.audioService.playQuestCompleteSFX === 'function') {
      this.audioService.playQuestCompleteSFX()
    } else if (this.audioService && typeof this.audioService.playMusicSFX === 'function') {
      this.audioService.playMusicSFX('BgmEvEnd.mp3')
    } else if (this.audioService && typeof this.audioService.playSFX === 'function') {
      this.audioService.playSFX('quest_complete.mp3')
    }

    return true
  }

  /**
   * 发放任务奖励
   * @param {Object} quest - 任务对象
   * @param {Object} player - 玩家对象
   * @param {Object} bagService - 背包服务
   * @param {Object} equipmentSets - 套装数据
   */
  grantQuestRewards (quest, player, bagService, equipmentSets = {}) {
    if (!quest || !player) {
      console.error('发放任务奖励参数错误')
      return
    }

    const questId = quest?.id
    let questForRewards = quest
    try {
      const quests = this.gameDataService?.cache?.get('quests') || {}
      const questFromData =
        (questId !== undefined && questId !== null && quests[questId]) ||
        (questId !== undefined && questId !== null && quests[String(questId)]) ||
        null
      if (questFromData) {
        questForRewards = { ...questFromData, ...quest }
      }
    } catch (error) {
      console.error('[QuestService] 解析任务奖励源失败:', error)
    }

    // 发放经验奖励
    if (questForRewards.endReceiveExperience) {
      // 如果是数组，根据玩家等级获取对应经验值
      const expRewardSource = Array.isArray(questForRewards.endReceiveExperience)
        ? questForRewards.endReceiveExperience[player.level - 1] || questForRewards.endReceiveExperience[0]
        : questForRewards.endReceiveExperience
      const expReward = Number(expRewardSource)

      if (Number.isFinite(expReward) && expReward > 0) {
        const maxExp = Number(player.maxExp)
        const currentExp = Number(player.exp)
        const safeMaxExp = Number.isFinite(maxExp) && maxExp > 0 ? maxExp : 0
        const safeCurrentExp = Number.isFinite(currentExp) && currentExp >= 0 ? currentExp : 0

        if (safeMaxExp > 0) {
          const targetExp = Math.floor(
            ((safeCurrentExp / safeMaxExp) * 100 + expReward) / 100 * safeMaxExp
          )
          const actualExp = Number.isFinite(targetExp)
            ? Math.max(0, targetExp - safeCurrentExp)
            : 0

          if (actualExp > 0 && typeof player.addExp === 'function') {
            player.addExp(actualExp, equipmentSets)
          }

          console.log(`获得经验: ${expReward}%`)
        } else {
          if (typeof player.addExp === 'function') {
            player.addExp(expReward, equipmentSets)
          }
          console.log(`获得经验: ${expReward}`)
        }
      }
    }

    // 发放金币奖励
    if (questForRewards.endReceiveGold) {
      const goldReward = Number(questForRewards.endReceiveGold)
      if (Number.isFinite(goldReward) && goldReward > 0) {
        const nextGold = (Number(player.gold) || 0) + goldReward
        player.gold = nextGold

        try {
          const itemsStore = useItemsStore()
          itemsStore.playerGold = nextGold
        } catch (error) {
          console.error('[QuestService] 同步金币到 itemsStore 失败:', error)
        }

        try {
          const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: nextGold } })
          window.dispatchEvent(goldUpdateEvent)
        } catch (error) {
          console.error('[QuestService] 派发 gold-update 事件失败:', error)
        }

        console.log(`获得金币: ${goldReward}`)
      }
    }

    // 发放物品奖励
    if (questForRewards.endReceiveItems && Array.isArray(questForRewards.endReceiveItems)) {
      questForRewards.endReceiveItems.forEach(rewardItem => {
        const itemIdNumber = Number(rewardItem?.item)
        const itemId = Number.isFinite(itemIdNumber) ? itemIdNumber : rewardItem?.item

        const countNumber = Number(rewardItem?.count ?? 1)
        const count = Number.isFinite(countNumber) && countNumber > 0 ? countNumber : 1

        if (itemId === undefined || itemId === null) {
          console.error('[QuestService] 发放物品奖励失败：itemId 无效', { rewardItem })
          return
        }

        const canUseLegacyBagService =
          bagService && typeof bagService.addItem === 'function' && typeof bagService.getItemData === 'function'

        if (canUseLegacyBagService) {
          const itemData = bagService.getItemData(itemId)
          if (itemData) {
            bagService.addItem(itemId, count)
            console.log(
              `获得物品: ${itemData.name?.cns || itemData.name?.en || itemData.id} x${count}`
            )
            return
          }
        }

        try {
          const itemsStore = useItemsStore()
          const itemConfig = itemsStore.getItemConfig(itemId)
          const added = itemsStore.addItemToBag(itemId, count)
          if (!added) {
            console.error('[QuestService] 发放物品奖励失败：添加到背包失败', { itemId, count })
            return
          }

          if (player && Array.isArray(itemsStore.playerBag)) {
            player.bag = [...itemsStore.playerBag]
          }

          try {
            const updateBagEvent = new CustomEvent('update-bag-ui')
            window.dispatchEvent(updateBagEvent)
          } catch (error) {
            console.error('[QuestService] 派发 update-bag-ui 事件失败:', error)
          }

          console.log(
            `获得物品: ${itemConfig?.name?.cns || itemConfig?.name?.en || itemId} x${count}`
          )
        } catch (error) {
          console.error('[QuestService] 发放物品奖励失败：itemsStore 异常', error)
        }
      })
    }
  }

  /**
   * 移除任务需求物品
   * @param {Object} quest - 任务对象
   * @param {Object} player - 玩家对象
   */
  removeQuestRequiredItems (quest, player) {
    if (!quest || !player) {
      return
    }

    // 获取需要移除的物品列表
    // 优先使用 endRemoveItems，如果没有则使用 endNeededItems
    let itemsToRemove = quest.endRemoveItems
    if (!itemsToRemove || !Array.isArray(itemsToRemove) || itemsToRemove.length === 0) {
      itemsToRemove = quest.endNeededItems
    }

    if (!itemsToRemove || !Array.isArray(itemsToRemove) || itemsToRemove.length === 0) {
      return
    }

    // 遍历需要移除的物品
    itemsToRemove.forEach(itemReq => {
      const itemId = Number(itemReq?.item)
      const count = Number(itemReq?.count ?? 1)

      if (!Number.isFinite(itemId) || itemId <= 0) {
        return
      }

      if (!Number.isFinite(count) || count <= 0) {
        return
      }

      // 尝试使用 itemsStore 移除物品
      try {
        const itemsStore = useItemsStore()
        const removed = itemsStore.removeItemFromBag(itemId, count)
        if (removed) {
          // 同步玩家背包数据
          if (player && Array.isArray(itemsStore.playerBag)) {
            player.bag = [...itemsStore.playerBag]
          }

          // 触发背包更新事件
          try {
            const updateBagEvent = new CustomEvent('update-bag-ui')
            window.dispatchEvent(updateBagEvent)
          } catch (error) {
            console.error('[QuestService] 派发 update-bag-ui 事件失败:', error)
          }

          // 获取物品名称用于日志
          const itemConfig = itemsStore.getItemConfig(itemId)
          const itemName = itemConfig?.name?.cns || itemConfig?.name?.en || `物品#${itemId}`
          console.log(`[QuestService] 移除任务物品: ${itemName} x${count}`)
        } else {
          console.warn(`[QuestService] 移除任务物品失败: itemId=${itemId}, count=${count}`)
        }
      } catch (error) {
        console.error('[QuestService] 移除任务物品异常:', error)
      }
    })
  }

  /**
   * 更新任务进度
   * @param {string} questId - 任务ID
   * @param {string} objectiveType - 目标类型 ('kill' 或 'collect')
   * @param {string} targetId - 目标ID
   * @param {number} count - 数量
   */
  updateQuestProgress (questId, objectiveType, targetId, count = 1) {
    const quest = this.playerQuests.activeQuests.find(q => q.id === questId)
    if (!quest) {
      console.log('任务未找到或不在进行中')
      return
    }

    // 更新任务进度
    if (objectiveType === 'kill' && quest.endKillMonsters) {
      // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
      const numericTargetId = Number(targetId)
      const monsterObjective = quest.endKillMonsters.find(obj =>
        obj.monster && obj.monster.some(m => Number(m) === numericTargetId)
      )
      if (monsterObjective) {
        monsterObjective.current = (monsterObjective.current || 0) + count
        // 确保不超过要求的数量
        if (monsterObjective.current > monsterObjective.count) {
          monsterObjective.current = monsterObjective.count
        }
      }
    } else if (objectiveType === 'collect' && quest.endNeededItems) {
      const itemObjective = quest.endNeededItems.find(obj => obj.item === parseInt(targetId, 10))
      if (itemObjective) {
        itemObjective.current = (itemObjective.current || 0) + count
        // 确保不超过要求的数量
        if (itemObjective.current > itemObjective.count) {
          itemObjective.current = itemObjective.count
        }
      }
    }

    // 检查任务是否可以完成
    this.checkQuestCompletion(quest)

    // 保存任务数据
    this.savePlayerQuests()
  }

  /**
   * 更新击杀怪物进度
   * @param {number} monsterId - 怪物ID
   * @param {number} count - 击杀数量
   */
  updateKillProgress (monsterId, count = 1) {
    // ★ 统一转换为数字类型，避免字符串/数字类型不匹配导致进度不更新
    const numericMonsterId = Number(monsterId)
    if (!Number.isFinite(numericMonsterId)) return

    // 遍历所有进行中的任务
    this.playerQuests.activeQuests.forEach(quest => {
      // 检查任务是否有击杀目标
      if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
        // 查找匹配的击杀目标
        // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
        const monsterObjective = quest.endKillMonsters.find(
          obj => obj.monster && obj.monster.some(m => Number(m) === numericMonsterId)
        )

        if (monsterObjective) {
          // 更新击杀进度
          monsterObjective.current = (monsterObjective.current || 0) + count

          // 确保不超过要求的数量
          if (monsterObjective.current > monsterObjective.count) {
            monsterObjective.current = monsterObjective.count
          }

          console.log(
            `任务 ${quest.name?.cns || quest.name?.en || quest.id} 击杀进度更新: ${monsterId} x${count}`
          )

          // 检查任务是否可以完成
          this.checkQuestCompletion(quest)
        }
      }
    })

    // 保存任务数据
    this.savePlayerQuests()
  }

  /**
   * 更新收集物品进度
   * @param {number} itemId - 物品ID
   * @param {number} count - 物品数量
   */
  updateCollectProgress (itemId, count = 1) {
    // 遍历所有进行中的任务
    this.playerQuests.activeQuests.forEach(quest => {
      // 检查任务是否有收集目标
      if (quest.endNeededItems && Array.isArray(quest.endNeededItems)) {
        // 查找匹配的收集目标
        const itemObjective = quest.endNeededItems.find(obj => obj.item === itemId)

        if (itemObjective) {
          // 更新收集进度
          itemObjective.current = (itemObjective.current || 0) + count

          // 确保不超过要求的数量
          if (itemObjective.current > itemObjective.count) {
            itemObjective.current = itemObjective.count
          }

          console.log(
            `任务 ${quest.name?.cns || quest.name?.en || quest.id} 收集进度更新: ${itemId} x${count}`
          )

          // 检查任务是否可以完成
          this.checkQuestCompletion(quest)
        }
      }
    })

    // 保存任务数据
    this.savePlayerQuests()
  }

  /**
   * 检查任务是否可以完成
   * @param {Object} quest - 任务对象
   */
  checkQuestCompletion (quest) {
    // 检查击杀目标是否完成
    let killCompleted = true
    if (quest.endKillMonsters && quest.endKillMonsters.length > 0) {
      killCompleted = quest.endKillMonsters.every(obj => (obj.current || 0) >= obj.count)
    }

    // 检查收集目标是否完成
    let collectCompleted = true
    if (quest.endNeededItems && quest.endNeededItems.length > 0) {
      collectCompleted = quest.endNeededItems.every(obj => (obj.current || 0) >= obj.count)
    }

    // 如果所有目标都完成，标记任务为可完成
    quest.canComplete = killCompleted && collectCompleted
  }

  /**
   * 判断任务是否可完成（静态检查，不修改任务状态）
   * @param {Object} quest - 任务对象
   * @param {Object} player - 玩家对象
   * @param {Object} bagService - 背包服务
   * @returns {boolean} 是否可完成
   */
  isQuestCompletable (quest, player, bagService) {
    if (!quest || !player) {
      console.log('[QuestService] isQuestCompletable 参数缺失:', {
        hasQuest: Boolean(quest),
        hasPlayer: Boolean(player),
        hasBagService: Boolean(bagService)
      })
      return false
    }

    const questId = quest?.id
    const questName = quest?.name?.cns || quest?.name?.en || questId

    // 检查物品收集是否完成
    if (quest.endNeededItems && Array.isArray(quest.endNeededItems)) {
      const itemsStore = useItemsStore()
      const playerBag = Array.isArray(itemsStore.playerBag) ? itemsStore.playerBag : []
      const legacyBag = Array.isArray(player?.bag) ? player.bag : []

      for (const itemReq of quest.endNeededItems) {
        const rawItemId = itemReq?.item
        const itemIdNumber = Number(rawItemId)
        const itemId = Number.isFinite(itemIdNumber) ? itemIdNumber : rawItemId

        const requiredCountNumber = Number(itemReq?.count)
        const requiredCount = Number.isFinite(requiredCountNumber) ? requiredCountNumber : 0

        const targetKey = String(itemId)
        const playerItemCount = playerBag
          .filter(item => item && String(item.id) === targetKey)
          .reduce((total, item) => {
            const raw = item.currentStack ?? item.quantity ?? 1
            const value = Number(raw)
            return total + (Number.isFinite(value) && value > 0 ? value : 1)
          }, 0)

        const legacyItemCount = legacyBag
          .filter(item => item && String(item.id) === targetKey)
          .reduce((total, item) => {
            const raw = item.currentStack ?? item.quantity ?? 1
            const value = Number(raw)
            return total + (Number.isFinite(value) && value > 0 ? value : 1)
          }, 0)

        if (playerItemCount < requiredCount) {
          console.log('[QuestService] 任务完成条件未达成（收集物品）:', {
            questId,
            questName,
            itemId,
            requiredCount,
            countFromItemsStoreBag: playerItemCount,
            countFromPlayerBag: legacyItemCount,
            itemsStoreBagCount: playerBag.length,
            playerBagCount: legacyBag.length,
            sampleItemsStoreBag: playerBag
              .slice(0, 20)
              .map(item => ({ id: item?.id, currentStack: item?.currentStack, quantity: item?.quantity })),
            samplePlayerBag: legacyBag
              .slice(0, 20)
              .map(item => ({ id: item?.id, currentStack: item?.currentStack, quantity: item?.quantity }))
          })
          return false
        }
      }
    }

    // 检查怪物击杀是否完成
    if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
      for (const monsterReq of quest.endKillMonsters) {
        const killedCountNumber = Number(monsterReq?.killedCount ?? monsterReq?.current ?? 0)
        const killedCount = Number.isFinite(killedCountNumber) ? killedCountNumber : 0

        const requiredCountNumber = Number(monsterReq?.count)
        const requiredCount = Number.isFinite(requiredCountNumber) ? requiredCountNumber : 0

        if (killedCount < requiredCount) {
          console.log('[QuestService] 任务完成条件未达成（击杀怪物）:', {
            questId,
            questName,
            monster: monsterReq?.monster,
            requiredCount,
            killedCount,
            killedCountField: monsterReq?.killedCount,
            currentField: monsterReq?.current
          })
          return false
        }
      }
    }

    // ★ 大师进阶任务：检查玩家等级是否达到目标等级
    if (isMasterGradeQuest(quest.id)) {
      if (!isMasterQuestLevelMet(player, quest)) {
        const config = getMasterQuestConfig(quest.id)
        const targetLevel = config?.targetLevel
        console.log('[QuestService] 大师进阶任务等级未达标:', {
          questId,
          questName,
          playerLevel: player?.level,
          targetLevel
        })
        return false
      }
    }

    return true
  }

  /**
   * 移除（放弃）进行中的任务
   * 不发放任何奖励，不记录到已完成列表，仅从活跃任务中删除
   * @param {Object} quest - 要移除的任务对象
   * @param {Object} [player] - 玩家对象（大师进阶任务放弃时恢复等级）
   * @returns {boolean} 是否移除成功
   */
  removeQuest (quest, player) {
    if (!quest) {
      console.error('[QuestService] 移除任务失败：任务对象为空')
      return false
    }

    const activeIndex = this.playerQuests.activeQuests.findIndex(q => q.id === quest.id)
    if (activeIndex === -1) {
      console.warn(`[QuestService] 移除任务失败：任务 ${quest.name?.cns || quest.name?.en || quest.id} 不在进行中列表`)
      return false
    }

    // 从活跃任务列表中移除，不记录到已完成列表
    this.playerQuests.activeQuests.splice(activeIndex, 1)

    // ★ 大师进阶任务：放弃后恢复原始等级
    if (isMasterGradeQuest(quest.id) && player) {
      restoreMasterGradeLevel(player, false)
    }

    // 保存任务数据
    this.savePlayerQuests()

    console.log(`[QuestService] 移除任务: ${quest.name?.cns || quest.name?.en || quest.id}`)

    return true
  }

  /**
   * 获取任务奖励
   * @param {Object} quest - 任务对象
   * @returns {Object} 奖励信息
   */
  getQuestRewards (quest) {
    if (!quest) {
      return {}
    }

    return {
      exp: quest.endReceiveExperience || 0,
      gold: quest.endReceiveGold || 0,
      items: quest.endReceiveItems || []
    }
  }

  /**
   * 设置玩家任务数据
   * @param {Object} questData - 玩家任务数据
   */
  setPlayerQuests (questData) {
    if (
      questData &&
      Array.isArray(questData.activeQuests) &&
      Array.isArray(questData.completedQuests)
    ) {
      this.playerQuests = {
        activeQuests: [...questData.activeQuests],
        completedQuests: [...questData.completedQuests],
        dailyCompletedQuests: questData.dailyCompletedQuests || {}
      }
  // 同时更新缓存
  this.cachedPlayerQuests = { ...this.playerQuests }
    } else {
      console.warn('无效的任务数据格式，使用默认值')
      this.playerQuests = {
        activeQuests: [],
        completedQuests: [],
        dailyCompletedQuests: {}
      }
      this.cachedPlayerQuests = { ...this.playerQuests }
    }
  }

  /**
   * 获取玩家任务数据
   * @returns {Object} 玩家任务数据
   */
  getPlayerQuests () {
    return {
      activeQuests: [...this.playerQuests.activeQuests],
      completedQuests: [...this.playerQuests.completedQuests],
      dailyCompletedQuests: { ...this.playerQuests.dailyCompletedQuests }
    }
  }

  /**
   * 清理任务系统
   */
  cleanup () {
    this.playerQuests = {
      activeQuests: [],
      completedQuests: [],
      dailyCompletedQuests: {}
    }
    this.cachedPlayerQuests = {
      activeQuests: [],
      completedQuests: [],
      dailyCompletedQuests: {}
    }
    console.log('任务系统已清理')
  }
}
