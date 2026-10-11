/**
 * @file 转职任务工具函数
 * @description 提供转职任务奖励文本构建、副本专属怪物判断、堕落BOSS强制刷新等共享逻辑，
 *              避免在 composable / 组件中重复定义
 * @author CatPaw
 * @since 2026-07-16
 */

import { getJobChangeQuestChain } from '@/data/JobChangeQuestConfig'
import { formatGold4 } from '@/utils/goldDisplay'

/**
 * 副本专属怪物 ID 集合（冻结）
 * 这些怪物只能在副本中击杀，禁止在 main 页面自动战斗中出现或计数
 * - 28482: [暗影中尉]克里顿（三转任务「实力证明3 副本试炼」目标）
 */
export const DUNGEON_ONLY_MONSTER_IDS = Object.freeze(new Set([28482]))

/**
 * 三转任务「实力证明2 堕落BOSS」在任务链中的索引（第3个任务，从0开始）
 * 该任务要求击杀8个堕落级BOSS各1只
 */
export const FALLEN_BOSS_QUEST_INDEX = 2

/**
 * 堕落级BOSS怪物 ID 集合（冻结）
 * 三转任务「实力证明2 堕落BOSS」的击杀目标，共8个
 * - 2550: 堕落的猛犸象
 * - 15441: 堕落的巨齿蛉
 * - 14207: 堕落的热带虎
 * - 11324: 堕落的强袭海盗
 * - 10071: 堕落的巨钳蟹
 * - 11954: 堕落的霸王虾
 * - 17273: 堕落的皇冠海妖
 * - 13941: 堕落的北海巨妖
 */
export const FALLEN_BOSS_MONSTER_IDS = Object.freeze(
  new Set([2550, 15441, 14207, 11324, 10071, 11954, 17273, 13941])
)

/**
 * 判断指定怪物 ID 是否为副本专属怪物
 * 副本专属怪物只能在副本中击杀，不应出现在 main 页面自动战斗中
 * @param {number} monsterId - 怪物 ID
 * @returns {boolean} 是否为副本专属怪物
 */
export function isDungeonOnlyMonster (monsterId) {
  return DUNGEON_ONLY_MONSTER_IDS.has(Number(monsterId))
}

/**
 * 根据职业 key 和任务索引，构建转职任务奖励文本
 * 奖励文本格式示例：" 获得: 金币 1,000,0000, 终极防护卷轴 ×10"
 * 无奖励时返回空字符串
 * @param {string} targetJobKey - 目标职业 key（如 'holy_knight'）
 * @param {number} questIndex - 任务在任务链中的索引（从 0 开始）
 * @returns {string} 奖励文本（含前导空格），无奖励时返回 ''
 */
export function buildJobChangeQuestRewardText (targetJobKey, questIndex) {
  const chain = getJobChangeQuestChain(targetJobKey)
  if (!chain || !chain.quests || !chain.quests[questIndex]) {
    return ''
  }

  const rewards = chain.quests[questIndex].rewards
  if (!rewards) {
    return ''
  }

  const parts = []

  // 金币奖励
  const gold = Number(rewards.gold || 0)
  if (gold > 0) {
    parts.push(`金币 ${formatGold4(gold)}`)
  }

  // 物品奖励
  const items = Array.isArray(rewards.items) ? rewards.items : []
  items.forEach(item => {
    const name = item.itemName || `物品${item.itemId}`
    const count = item.count || 1
    parts.push(`${name} ×${count}`)
  })

  if (parts.length === 0) {
    return ''
  }

  return ` 获得: ${parts.join(', ')}`
}

/**
 * 判断指定怪物 ID 是否为堕落级BOSS
 * 堕落级BOSS是三转任务「实力证明2 堕落BOSS」的击杀目标
 * @param {number} monsterId - 怪物 ID
 * @returns {boolean} 是否为堕落级BOSS
 */
export function isFallenBossMonster (monsterId) {
  return FALLEN_BOSS_MONSTER_IDS.has(Number(monsterId))
}

/**
 * 从玩家转职任务状态中获取当前需要强制刷新的堕落BOSS怪物 ID
 *
 * 业务逻辑：
 * - 遍历玩家所有已接受的转职任务链
 * - 搜索每个已接受（status === 'accepted'）任务的 killProgress
 * - 找到第一个未完成（current < target）且属于堕落级BOSS的目标
 * - 返回该目标的 monsterId，用于在自动战斗中强制刷新该BOSS
 * - 如果任务不存在、未接受、或所有目标已完成，返回 null
 *
 * 注意：不依赖硬编码的任务索引，而是搜索所有已接受任务中的堕落BOSS目标，
 *      以避免任务链结构变更或旧数据不匹配导致的问题
 *
 * @param {Array<Object>} jobChangeQuests - 玩家的转职任务状态数组（player.jobChangeQuests）
 * @returns {number|null} 下一个需要击杀的堕落BOSS怪物 ID，无则返回 null
 */
export function getActiveFallenBossTarget (jobChangeQuests) {
  if (!Array.isArray(jobChangeQuests)) {
    return null
  }

  for (const chain of jobChangeQuests) {
    if (!chain || !Array.isArray(chain.quests)) {
      continue
    }

    // 搜索该任务链中所有已接受的任务，不依赖硬编码索引
    for (const quest of chain.quests) {
      if (!quest || quest.status !== 'accepted') {
        continue
      }

      const killProgress = quest.killProgress
      if (!Array.isArray(killProgress)) {
        continue
      }

      // 按顺序找到第一个未完成的堕落BOSS目标
      for (const kp of killProgress) {
        if (!kp || !kp.monsterId) {
          continue
        }
        // 只处理堕落级BOSS目标
        if (!isFallenBossMonster(kp.monsterId)) {
          continue
        }
        const current = Number(kp.current) || 0
        const target = Number(kp.target) || 0
        if (current < target) {
          // ★ 始终返回数字类型，避免下游比较时字符串/数字不匹配
          return Number(kp.monsterId)
        }
      }
    }
  }

  return null
}

export default {
  buildJobChangeQuestRewardText,
  isDungeonOnlyMonster,
  isFallenBossMonster,
  getActiveFallenBossTarget,
  DUNGEON_ONLY_MONSTER_IDS,
  FALLEN_BOSS_MONSTER_IDS,
  FALLEN_BOSS_QUEST_INDEX
}
