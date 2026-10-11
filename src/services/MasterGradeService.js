/**
 * 大师进阶服务
 * 负责大师进阶任务的等级降低/恢复、经验与掉率惩罚、转生阶段记录等核心逻辑
 *
 * @file MasterGradeService.js
 * @generated 2026-07-13
 */

/**
 * 大师进阶任务 ID → 任务阶段映射表
 * 阶段 1-6 分别对应大师进阶(1)到大师进阶(6)
 */
export const MASTER_QUEST_CONFIG = {
  19166: { stage: 1, targetLevel: 70 },   // 大师进阶(1)
  13469: { stage: 2, targetLevel: 80 },   // 大师进阶(2)
  19649: { stage: 3, targetLevel: 90 },   // 大师进阶(3)
  12810: { stage: 4, targetLevel: 100 },  // 大师进阶(4)
  12840: { stage: 5, targetLevel: 110 },  // 大师进阶(5)
  14566: { stage: 6, targetLevel: 120 }   // 大师进阶(6)
}

/**
 * 大师进阶任务 ID → 成就 ID 映射表
 * 任务完成时通过此映射找到对应的成就，调用成就系统更新进度
 * 成就 ID 来源于 ACHIEVEMENT_INFO.js 中拥有 badgeReward 的大师/英雄成就
 * @type {Record<number, number>}
 */
export const MASTER_QUEST_TO_ACHIEVEMENT = {
  19166: 19633,  // 大师进阶(1) → Master 60 - 70 (badge: master1.png)
  13469: 685,    // 大师进阶(2) → Master 70 - 80 (badge: master2.png)
  19649: 10943,  // 大师进阶(3) → Master 80 - 90 (badge: master3.png)
  12810: 14135,  // 大师进阶(4) → Master 90 - 100 (badge: master4.png)
  12840: 12264,  // 大师进阶(5) → Master 100 - 110 (badge: master5.png)
  14566: 19824   // 大师进阶(6) → Master 110 - 120 (badge: master6.png)
}

/**
 * 英雄进阶任务 ID → 任务阶段映射表
 * 阶段 1-4 分别对应英雄进阶(1)到英雄进阶(4)
 * 英雄进阶任务不需要等级降低机制，仅为普通收集类链式任务
 * @type {Record<number, { stage: number, name: string }>}
 */
export const HERO_QUEST_CONFIG = {
  18283: { stage: 1, name: '英雄进阶(1)' },  // New Hero（大师进阶6后续，桥接任务）
  26417: { stage: 2, name: '英雄进阶(2)' },
  24876: { stage: 3, name: '英雄进阶(3)' },
  26442: { stage: 4, name: '英雄进阶(4)' }
}

/**
 * 英雄进阶任务 ID → 成就 ID 映射表
 * 任务完成时通过此映射找到对应的英雄成就，调用成就系统更新进度
 * 成就 ID 来源于 ACHIEVEMENT_INFO.js 中拥有 badgeReward 的英雄成就
 * @type {Record<number, number>}
 */
export const HERO_QUEST_TO_ACHIEVEMENT = {
  18283: 12330,  // 英雄进阶(1) → 完成首次英雄任务 (Hero 120-125, badge: master7.png)
  26417: 20122,  // 英雄进阶(2) → 完成第二个英雄任务 (Hero 125-140, badge: master8.png)
  24876: 19860,  // 英雄进阶(3) → 完成第三个英雄任务 (Hero 140-160, badge: master9.png)
  26442: 56286   // 英雄进阶(4) → 完成第四个英雄任务 (Hero 160-180, badge: master10.png)
}

/**
 * 大师进阶任务 ID 集合
 */
export const MASTER_QUEST_IDS = new Set(Object.keys(MASTER_QUEST_CONFIG).map(Number))

/**
 * 英雄进阶任务 ID 集合
 */
export const HERO_QUEST_IDS = new Set(Object.keys(HERO_QUEST_CONFIG).map(Number))

/**
 * 降级偏移量：接受任务后降至目标等级 - 10
 */
const DELEVEL_OFFSET = 10

/**
 * 经验惩罚倍率：降级后获得经验 -50%
 */
export const MASTER_GRADE_EXP_MULTIPLIER = 0.5

/**
 * 掉率惩罚倍率：降级后物品掉率 -50%
 */
export const MASTER_GRADE_DROP_MULTIPLIER = 0.5

/**
 * 判断任务是否为大师进阶任务
 * @param {number} questId - 任务ID
 * @returns {boolean} 是否为大师进阶任务
 */
export function isMasterGradeQuest (questId) {
  const id = Number(questId)
  return MASTER_QUEST_IDS.has(id)
}

/**
 * 获取大师进阶任务的配置信息
 * @param {number} questId - 任务ID
 * @returns {{ stage: number, targetLevel: number } | null} 任务配置，非大师进阶任务返回 null
 */
export function getMasterQuestConfig (questId) {
  const id = Number(questId)
  return MASTER_QUEST_CONFIG[id] || null
}

/**
 * 根据大师进阶任务 ID 获取对应的成就 ID
 * 用于任务完成时更新成就进度
 * @param {number} questId - 大师进阶任务 ID
 * @returns {number|null} 对应的成就 ID，无映射返回 null
 */
export function getMasterQuestAchievementId (questId) {
  const id = Number(questId)
  return MASTER_QUEST_TO_ACHIEVEMENT[id] || null
}

/**
 * 判断任务是否为英雄进阶任务
 * @param {number} questId - 任务ID
 * @returns {boolean} 是否为英雄进阶任务
 */
export function isHeroGradeQuest (questId) {
  const id = Number(questId)
  return HERO_QUEST_IDS.has(id)
}

/**
 * 获取英雄进阶任务的配置信息
 * @param {number} questId - 任务ID
 * @returns {{ stage: number, name: string } | null} 任务配置，非英雄进阶任务返回 null
 */
export function getHeroQuestConfig (questId) {
  const id = Number(questId)
  return HERO_QUEST_CONFIG[id] || null
}

/**
 * 根据英雄进阶任务 ID 获取对应的成就 ID
 * 用于任务完成时更新英雄成就进度
 * @param {number} questId - 英雄进阶任务 ID
 * @returns {number|null} 对应的成就 ID，无映射返回 null
 */
export function getHeroQuestAchievementId (questId) {
  const id = Number(questId)
  return HERO_QUEST_TO_ACHIEVEMENT[id] || null
}

/**
 * 从任务描述中解析目标等级
 * 兼容 "达到70级" / "Reach level 70" 等格式
 * @param {Object} quest - 任务对象
 * @returns {number|null} 目标等级，解析失败返回 null
 */
export function parseTargetLevelFromQuest (quest) {
  // 优先从配置表获取
  const config = getMasterQuestConfig(quest?.id)
  if (config) {
    return config.targetLevel
  }

  // 从描述中解析
  const desc = quest?.description
  const text = desc?.cns || desc?.en || ''
  if (!text) return null

  // 匹配 "达到70级" 或 "Reach level 70"
  const cnsMatch = text.match(/达到\s*(\d+)\s*级/)
  if (cnsMatch) {
    return parseInt(cnsMatch[1], 10)
  }

  const enMatch = text.match(/Reach\s+level\s+(\d+)/i)
  if (enMatch) {
    return parseInt(enMatch[1], 10)
  }

  return null
}

/**
 * 计算降级后的等级
 * @param {number} targetLevel - 目标等级
 * @returns {number} 降级后的等级（目标等级 - 10）
 */
export function calculateDeLevel (targetLevel) {
  return Math.max(1, targetLevel - DELEVEL_OFFSET)
}

/**
 * 应用大师进阶等级降低
 * 保存玩家原始等级，将等级降至目标等级 - 10
 * @param {Object} player - 玩家对象
 * @param {Object} quest - 大师进阶任务对象
 * @returns {boolean} 是否成功应用降级
 */
export function applyMasterGradeLevelReduction (player, quest) {
  if (!player || !quest) {
    console.error('[MasterGradeService] applyLevelReduction 参数缺失')
    return false
  }

  const questId = Number(quest.id)
  if (!isMasterGradeQuest(questId)) {
    console.warn(`[MasterGradeService] 任务 ${questId} 不是大师进阶任务`)
    return false
  }

  const config = getMasterQuestConfig(questId)
  const targetLevel = config?.targetLevel || parseTargetLevelFromQuest(quest)
  if (!targetLevel) {
    console.error(`[MasterGradeService] 无法解析任务 ${questId} 的目标等级`)
    return false
  }

  const deLevel = calculateDeLevel(targetLevel)

  // 保存原始等级和状态
  player.masterGradeState = {
    isActive: true,
    originalLevel: player.level,
    targetLevel,
    deLevel,
    questId,
    rebirthStage: player.masterGradeState?.rebirthStage || 0
  }

  // 应用降级
  player.level = deLevel
  player.exp = 0
  player.maxExp = player.calculateMaxExp()

  // 重新计算属性
  if (typeof player.applyFinalStats === 'function') {
    player.applyFinalStats()
  }

  // 恢复生命和魔法
  player.currentHealth = player.maxHealth
  player.currentMana = player.maxMana

  console.log(`[MasterGradeService] 大师进阶降级: 原始等级 ${player.masterGradeState.originalLevel} → 降级至 ${deLevel} (目标 ${targetLevel})`)

  return true
}

/**
 * 恢复玩家原始等级
 * 在放弃或完成大师进阶任务时调用
 * @param {Object} player - 玩家对象
 * @param {boolean} isCompletion - 是否为任务完成（true=完成，false=放弃）
 * @returns {boolean} 是否成功恢复等级
 */
export function restoreMasterGradeLevel (player, isCompletion = false) {
  if (!player || !player.masterGradeState?.isActive) {
    return false
  }

  const state = player.masterGradeState
  const originalLevel = state.originalLevel

  // 恢复等级
  player.level = originalLevel
  player.exp = 0
  player.maxExp = player.calculateMaxExp()

  // 重新计算属性
  if (typeof player.applyFinalStats === 'function') {
    player.applyFinalStats()
  }

  // 恢复生命和魔法
  player.currentHealth = player.maxHealth
  player.currentMana = player.maxMana

  // 如果是完成任务，增加转生阶段
  if (isCompletion) {
    const config = getMasterQuestConfig(state.questId)
    if (config) {
      state.rebirthStage = Math.max(state.rebirthStage || 0, config.stage)
    }
  }

  // 清除活跃状态
  state.isActive = false
  state.originalLevel = 0
  state.deLevel = 0

  console.log(`[MasterGradeService] 恢复等级至 ${originalLevel} (${isCompletion ? '任务完成' : '任务放弃'}), 转生阶段: ${state.rebirthStage}`)

  return true
}

/**
 * 检查大师进阶任务是否可完成
 * 玩家当前等级需达到任务的目标等级
 * @param {Object} player - 玩家对象
 * @param {Object} quest - 任务对象
 * @returns {boolean} 是否满足等级完成条件
 */
export function isMasterQuestLevelMet (player, quest) {
  if (!player || !quest) return false

  const questId = Number(quest.id)
  if (!isMasterGradeQuest(questId)) return true

  const config = getMasterQuestConfig(questId)
  const targetLevel = config?.targetLevel || parseTargetLevelFromQuest(quest)
  if (!targetLevel) return true

  return player.level >= targetLevel
}

/**
 * 获取当前有效的装备等级
 * 大师进阶期间使用原始等级（转生前等级），否则使用当前等级
 * @param {Object} player - 玩家对象
 * @returns {number} 有效的装备等级
 */
export function getEffectiveEquipLevel (player) {
  if (!player) return 0
  if (player.masterGradeState?.isActive && player.masterGradeState?.originalLevel) {
    return player.masterGradeState.originalLevel
  }
  return player.level || 0
}

/**
 * 获取经验倍率
 * 大师进阶期间返回 0.5，否则返回 1
 * @param {Object} player - 玩家对象
 * @returns {number} 经验倍率
 */
export function getMasterGradeExpMultiplier (player) {
  if (!player?.masterGradeState?.isActive) return 1
  return MASTER_GRADE_EXP_MULTIPLIER
}

/**
 * 获取掉率倍率
 * 大师进阶期间返回 0.5，否则返回 1
 * @param {Object} player - 玩家对象
 * @returns {number} 掉率倍率
 */
export function getMasterGradeDropMultiplier (player) {
  if (!player?.masterGradeState?.isActive) return 1
  return MASTER_GRADE_DROP_MULTIPLIER
}

export default {
  MASTER_QUEST_CONFIG,
  MASTER_QUEST_IDS,
  MASTER_QUEST_TO_ACHIEVEMENT,
  HERO_QUEST_CONFIG,
  HERO_QUEST_IDS,
  HERO_QUEST_TO_ACHIEVEMENT,
  MASTER_GRADE_EXP_MULTIPLIER,
  MASTER_GRADE_DROP_MULTIPLIER,
  isMasterGradeQuest,
  isHeroGradeQuest,
  getMasterQuestConfig,
  getMasterQuestAchievementId,
  getHeroQuestConfig,
  getHeroQuestAchievementId,
  parseTargetLevelFromQuest,
  calculateDeLevel,
  applyMasterGradeLevelReduction,
  restoreMasterGradeLevel,
  isMasterQuestLevelMet,
  getEffectiveEquipLevel,
  getMasterGradeExpMultiplier,
  getMasterGradeDropMultiplier
}
