import { ref, computed } from 'vue'
import { useGameStore, useJobsStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { getItemName } from '@/utils/itemUtils'
import { storageService } from '@/services/StorageService'
import { getClassNameByKey } from '@/utils/itemHelpers'
import { debounce } from '@/utils/debounce'
import { MAX_PLAYER_LEVEL } from '@/utils/gameConstants'

// 战斗日志
const battleLogs = ref([])
let battleLogId = 0

/**
 * 防抖保存玩家数据，避免升级循环中频繁同步 localStorage 序列化阻塞主线程
 * 在连续多次升级时只保存一次（延迟 500ms），
 * 确保 RAF 回调不被 localStorage I/O 阻塞
 * @param {Object} playerData - 玩家数据
 */
const debouncedSavePlayerData = debounce((playerData) => {
  try {
    storageService.savePlayerData(playerData)
  } catch (error) {
    console.error('[usePlayer] 防抖保存玩家数据失败:', error)
  }
}, 500)

export function usePlayer () {
  const gameStore = useGameStore()
  const itemsStore = useItemsStore()
  const jobsStore = useJobsStore()
  // storageService 已通过 import 导入全局单例

  // 使用store中的玩家数据，而不是创建独立的引用
  const player = computed(() => gameStore.player)
  // ========== 计算属性 ==========

  /**
   * 生命值百分比
   * 依赖 buffVersion 确保 applyFinalStats 通过 toRaw 修改 maxHealth 后能触发重新计算
   */
  const healthPercentage = computed(() => {
    // 追踪 buffVersion 变化，确保 toRaw 修改 maxHealth 后能触发重新计算
    const buffVersion = gameStore.buffVersion
    const maxHealth = gameStore.player.maxHealth
    if (!maxHealth || maxHealth === 0) {
      return 0
    }
    return (gameStore.player.currentHealth / maxHealth) * 100 + buffVersion * 0
  })

  /**
   * 魔法值百分比
   * 依赖 buffVersion 确保 applyFinalStats 通过 toRaw 修改 maxMana 后能触发重新计算
   */
  const manaPercentage = computed(() => {
    // 追踪 buffVersion 变化，确保 toRaw 修改 maxMana 后能触发重新计算
    const buffVersion = gameStore.buffVersion
    const maxMana = gameStore.player.maxMana
    if (!maxMana || maxMana === 0) {
      return 0
    }
    return (gameStore.player.currentMana / maxMana) * 100 + buffVersion * 0
  })

  /**
   * 经验值百分比
   */
  const expPercentage = computed(() => {
    if (!gameStore.player.maxExp || gameStore.player.maxExp === 0) {
      return 0
    }
    return (gameStore.player.exp / gameStore.player.maxExp) * 100
  })

  /**
   * 玩家职业名称
   */
  const playerClassName = computed(() => {
    return getClassNameByKey(gameStore.player.class)
  })

  // ========== 方法 ==========

  /**
   * 更新玩家属性
   */
  const updatePlayerAttributes = () => {
    // 使用Player类的applyFinalStats方法重新计算所有属性
    if (typeof gameStore.player.applyFinalStats === 'function') {
      gameStore.player.applyFinalStats(gameStore.equipmentSets)
    }
    
    // 强制触发响应式更新：创建新的stats对象引用
    if (gameStore.player.stats) {
      gameStore.player.stats = { ...gameStore.player.stats }
    }

    // 通过store更新玩家数据，确保变化被响应
    if (typeof gameStore.updatePlayer === 'function') {
      gameStore.updatePlayer(gameStore.player, gameStore.equipmentSets)
    }
  }

  /**
   * 获得经验
   * @param {number} exp - 获取的经验值（任务奖励时为百分比）
   * @param {boolean} isQuestReward - 是否为任务奖励经验（按百分比计算）
   */
  const gainExp = (exp, isQuestReward = false) => {
    // ★ 满级检查：达到最大等级后不再获得经验
    if (gameStore.player.level >= MAX_PLAYER_LEVEL) {
      gameStore.player.exp = 0
      return
    }

    // 使用统一的职业配置检查是否需要转职
    const jobCheck = jobsStore.checkJobChangeRequired(gameStore.player)

    if (jobCheck.needsJobChange) {
      addBattleLog(jobCheck.message, 'warning')
      return // 直接返回，不增加经验
    }

    // ★ 大师进阶任务期间：等级达到目标等级后不再获得经验
    const masterState = gameStore.player?.masterGradeState
    if (masterState?.isActive && masterState?.targetLevel) {
      const cap = masterState.targetLevel
      if (gameStore.player.level >= cap) {
        // 已达到目标等级，不再获得经验
        gameStore.player.exp = 0
        return
      }
    }

    let finalExp = exp

    // 任务奖励经验特殊处理
    if (isQuestReward) {
      // 计算当前经验值占升级所需经验值的百分比
      const currentExpPercentage = (gameStore.player.exp / gameStore.player.maxExp) * 100
      // 任务奖励值作为百分比增加
      const rewardPercentage = exp
      // 将任务经验值与当前经验值相加
      const newExpPercentage = currentExpPercentage + rewardPercentage
      // 将百分比转换为实际经验值
      const baseExp =
        Math.floor((newExpPercentage / 100) * gameStore.player.maxExp) - gameStore.player.exp
      // 任务奖励经验不受ES加成影响
      finalExp = baseExp

      // 显示任务奖励经验
      addBattleLog(`获得任务奖励经验 ${rewardPercentage}%`, 'quest')
    }

    // 添加经验值
    gameStore.player.exp += finalExp

    // 触发响应式更新 - 使用 updatePlayer 确保经验变化被检测到
    if (typeof gameStore.updatePlayer === 'function') {
      gameStore.updatePlayer({ exp: gameStore.player.exp })
    }

    // 检查升级
    checkLevelUp()
  }

  /**
   * 检查升级
   * 在满足经验条件时循环升级，处理转职等级限制、大师进阶等级上限和满级上限
   */
  const checkLevelUp = () => {
    let leveledUp = false

    // ★ 满级保护：达到最大等级后不再升级
    while (gameStore.player.exp >= gameStore.player.maxExp && gameStore.player.level < MAX_PLAYER_LEVEL) {
      // 检查是否达到转职等级限制
      const currentTier = jobsStore.getJobTier(gameStore.player.class)
      const level = gameStore.player.level

      // 60级需要二转才能继续升级
      if (level >= 60 && currentTier === 1) {
        addBattleLog('你已达到60级，请找到转职NPC进行二转，否则无法继续升级！', 'warning')
        break
      }

      // 166级需要三转才能继续升级
      if (level >= 166 && currentTier === 2) {
        addBattleLog('你已达到166级，请找到转职NPC进行三转，否则无法继续升级！', 'warning')
        break
      }

      // 先扣除升级所需经验，再升级（避免使用新等级的maxExp）
      gameStore.player.exp = gameStore.player.exp - gameStore.player.maxExp // 扣除升级所需经验
      gameStore.player.levelUp(gameStore.equipmentSets) // 使用Player类的升级方法，该方法会应用完整的属性计算流程

      // 同步更新背包容量
      itemsStore.updateBagCapacity(gameStore.player.level)

      leveledUp = true

      // 满级后清空经验
      if (gameStore.player.level >= MAX_PLAYER_LEVEL) {
        gameStore.player.exp = 0
        addBattleLog(`恭喜达到满级 ${MAX_PLAYER_LEVEL} 级！`)
        break
      }

      addBattleLog(`恭喜升级到${gameStore.player.level}级！获得4点属性点`)

      // ★ 大师进阶任务期间：升级到目标等级后清空经验，不再继续升级
      const ms = gameStore.player?.masterGradeState
      if (ms?.isActive && ms?.targetLevel && gameStore.player.level >= ms.targetLevel) {
        gameStore.player.exp = 0
        break
      }
    }

    if (leveledUp) {
      // 播放升级音效的逻辑应该在组件中处理
  
      // 升级后通过store更新玩家数据，确保变化被保存
      if (typeof gameStore.updatePlayer === 'function') {
        gameStore.updatePlayer(gameStore.player, gameStore.equipmentSets)
      }

      // 防抖保存：避免在 while 循环连续升级时频繁同步写 localStorage 阻塞主线程
      // 实际保存由 debounce 延迟 500ms 后执行，确保 RAF 回调不被阻塞
      debouncedSavePlayerData(gameStore.player)
    }

    // 检查是否需要转职提示
    const jobCheck = jobsStore.checkJobChangeRequired(gameStore.player)
    if (jobCheck.needsJobChange) {
      addBattleLog(jobCheck.message, 'warning')
    }
  }

  /**
   * 添加战斗日志
   */
  const addBattleLog = (text, type = 'normal') => {
    try {
      const rawSettings = localStorage.getItem('userSettings')
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings)
        if (parsed && parsed.showBattleLogText === false) {
          return
        }
      }
    } catch (e) {
      console.warn(e)
    }

    let color = '#ffffff'
    switch (type) {
    case 'success':
      color = '#4CAF50'
      break
    case 'warning':
      color = '#FF9800'
      break
    case 'error':
      color = '#ff0019ff'
      break
    case 'quest':
      color = 'rgb(104, 174, 255)'
      break
    case 'info':
      color = '#9E9E9E'
      break
    case 'drop':
      color = '#8B0000'
      break
    case 'buy':
      color = '#4CAF50'
      break
    case 'sell':
      color = 'rgb(222, 255, 4)'
      break
    case 'use':
    case 'equip':
      color = '#008000'
      break
    default:
      break
    }

    battleLogs.value.push({
      id: (battleLogId = (battleLogId + 1) % 1000000000),
      text,
      color,
      timestamp: Date.now()
    })

    // 限制日志数量，最多保留100条
    // 批量清理：一次移除超出上限的所有旧条目，避免逐条shift导致频繁触发响应式
    if (battleLogs.value.length > 100) {
      const excess = battleLogs.value.length - 100
      battleLogs.value.splice(0, excess)
    }
  }

  /**
   * 添加物品到背包
   */
  const addItemToBag = itemOrId => {
    const isNumberId = typeof itemOrId === 'number'
    const rawId = isNumberId
      ? itemOrId
      : itemOrId?.id ?? itemOrId?.itemId ?? itemOrId?.item_id ?? itemOrId?.item ?? null

    const itemIdNumber = Number(rawId)
    const itemId = Number.isFinite(itemIdNumber) && itemIdNumber > 0 ? itemIdNumber : null
    if (!itemId) {
      console.error('[usePlayer] 添加物品失败：itemId 无效', { itemOrId })
      return false
    }

    const rawQuantity = isNumberId ? 1 : itemOrId?.currentStack ?? itemOrId?.quantity ?? 1
    const quantityNumber = Number(rawQuantity)
    const quantity = Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : 1

    const added = itemsStore.addItemToBag(itemId, quantity)
    if (!added) {
      console.error('[usePlayer] 添加物品失败：itemsStore.addItemToBag 返回 false', { itemId, quantity })
      return false
    }

    gameStore.player.bag = [...itemsStore.playerBag]

    const itemConfig = itemsStore.getItemConfig(itemId)
    const itemName = itemConfig ? getItemName({ ...itemConfig, id: itemId }) : `物品ID: ${itemId}`
    addBattleLog(`获得物品: ${itemName} x${quantity}`, 'drop')

    try {
      const updateBagEvent = new CustomEvent('update-bag-ui')
      window.dispatchEvent(updateBagEvent)
    } catch (error) {
      console.error('[usePlayer] 派发 update-bag-ui 事件失败:', error)
    }

    storageService.savePlayerData(gameStore.player)
    return true
  }

  /**
   * 更新玩家魔法值
   */
  const updatePlayerMana = newMana => {
    gameStore.player.currentMana = Math.max(0, Math.min(gameStore.player.maxMana, newMana))
  }

  /**
   * 分配属性点
   */
  const allocateStat = (stat, points) => {
    if (gameStore.player.stats.freePoints < points || points <= 0) {
      addBattleLog('属性点不足或分配点数无效', 'warning')
      return false
    }

    if (['strength', 'agility', 'intelligence', 'constitution'].includes(stat)) {
      gameStore.player.stats[stat] += points
      gameStore.player.stats.freePoints -= points

      updatePlayerAttributes()
      addBattleLog(`成功分配${points}点${stat}属性`)

      // 保存玩家数据以确保属性点分配被持久化
      storageService.savePlayerData(gameStore.player)

      return true
    }

    addBattleLog('无效的属性类型', 'error')
    return false
  }

  // 返回所有需要的属性和方法
  return {
    // 响应式数据
    player,
    battleLogs,

    // 计算属性
    healthPercentage,
    manaPercentage,
    expPercentage,
    playerClassName,

    // 方法
    updatePlayerAttributes,
    gainExp,
    checkLevelUp,
    addBattleLog,
    addItemToBag,
    updatePlayerMana,
    allocateStat,

    // BUFF系统
    // 依赖 buffVersion 强制刷新：activeBuffs 被 markRaw 包装，Vue 无法自动追踪
    // 数组内容变化（push/splice/filter），必须通过 buffVersion 触发 computed 重新计算
    // 确保 PlayerInfoPanel 等组件的 BUFF 检测 computed（如 hasEliffBlessingBuff）正确响应
    activeBuffs: computed(() => {
      // eslint-disable-next-line no-unused-vars
      const _version = gameStore.buffVersion
      return gameStore.player.activeBuffs || []
    })
  }
}
