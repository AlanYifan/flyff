/**
 * 任务数据同步工具函数
 * 确保 questService 数据与 player.quest 同步时，不会丢失转职任务
 *
 * @file questSync.js
 * @generated 2026-06-13
 */

/**
 * 将 questService 的任务数据同步到 player.quest
 * 保留 player.quest 中的转职任务（isJobChangeQuest），因为 questService 不管理转职任务
 * 同时过滤 questService 返回数据中可能意外包含的转职任务，避免重复
 *
 * @param {Object} player - 玩家对象（响应式）
 * @param {Object} questService - 任务服务实例
 */
export function syncQuestDataToPlayerQuest (player, questService) {
  if (!player || !questService) return

  // 确保玩家任务数据结构存在
  if (!player.quest) {
    player.quest = { activeQuests: [], completedQuests: [] }
  }

  // ★ 保存当前玩家对象中的转职任务（questService 不管理转职任务）
  const existingJobChangeActive = (player.quest.activeQuests || [])
    .filter(q => q.isJobChangeQuest)
  const existingJobChangeCompleted = (player.quest.completedQuests || [])
    .filter(q => q.isJobChangeQuest)

  // ★ 从任务服务获取最新数据，并过滤掉可能意外包含的转职任务（双保险）
  const questData = questService.getPlayerQuests()
  const serviceActiveQuests = (questData.activeQuests || [])
    .filter(q => !q.isJobChangeQuest)
  const serviceCompletedQuests = (questData.completedQuests || [])
    .filter(q => !q.isJobChangeQuest)

  // 合并：questService 的普通任务 + 保留的转职任务
  player.quest.activeQuests = [
    ...serviceActiveQuests,
    ...existingJobChangeActive
  ]
  player.quest.completedQuests = [
    ...serviceCompletedQuests,
    ...existingJobChangeCompleted
  ]
}
