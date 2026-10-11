<!--
  @component JobChangeQuestPanel
  @description 转职任务面板组件 - 显示转职任务链，支持接受、完成、确认转职操作
  点击职业进阶面板中可转职头像后弹出，逻辑与 FlyfTurnBasedEdition 项目一致
  @author CatPaw
  @since 2026-06-13
-->
<template>
  <transition name="quest-panel-fade" appear>
    <div
      v-if="visible"
      ref="panelRef"
      class="quest-panel"
      :style="panelStyle"
    >
      <!-- 头部（可拖拽） -->
      <div class="quest-panel-header" @mousedown="startDrag">
        <div class="quest-header-left">
          <img :src="targetJobIcon" class="quest-job-icon" :draggable="false" @error="handleImageError" />
          <div class="quest-header-title">
            <h3>{{ chain?.targetJobName ?? '转职' }}转职任务</h3>
            <p class="quest-subtitle">{{ tierLabel }} · {{ completedCount }}/{{ chain?.quests.length ?? 0 }} 已完成</p>
          </div>
        </div>
        <button class="quest-close-btn" @click="close">&times;</button>
      </div>

      <!-- 互斥提示：已有其他职业转职任务 -->
      <div v-if="blockedByJob" class="quest-blocked-tip">
        <span class="blocked-icon">⚠️</span>
        <span>已有 <strong>{{ blockedByJob }}</strong> 的转职任务进行中，无法同时接受其他职业的转职任务。请先在玩家任务面板中放弃当前转职任务。</span>
      </div>

      <!-- 任务列表 -->
      <div class="quest-panel-body">
        <div
          v-for="(quest, idx) in chain?.quests ?? []"
          :key="quest.id"
          class="quest-item"
          :class="{
            'quest-available': isQuestAvailable(idx),
            'quest-accepted': isQuestAccepted(idx),
            'quest-completed': isQuestCompleted(idx),
            'quest-locked': !isQuestAvailable(idx) && !isQuestAccepted(idx) && !isQuestCompleted(idx),
          }"
        >
          <!-- 任务序号 + 状态图标 -->
          <div class="quest-status-icon">
            <span v-if="isQuestCompleted(idx)" class="status-check done">✔</span>
            <span v-else-if="isQuestAccepted(idx)" class="status-check active">▶</span>
            <span v-else-if="isQuestAvailable(idx)" class="status-check pending">●</span>
            <span v-else class="status-check locked">🔒</span>
          </div>

          <!-- 任务内容 -->
          <div class="quest-content">
            <div class="quest-name-row">
              <span class="quest-index">#{{ idx + 1 }}</span>
              <span class="quest-name">{{ quest.name }}</span>
            </div>
            <p class="quest-desc">{{ quest.description }}</p>

            <!-- 击杀进度（已接受/已完成状态） -->
            <div v-if="(isQuestAccepted(idx) || isQuestCompleted(idx)) && getKillProgress(idx).length > 0" class="kill-progress-list">
              <div
                v-for="target in getKillProgress(idx)"
                :key="target.monsterId"
                class="kill-progress-item"
              >
                <img
                  :src="getMonsterIcon(target.monsterId)"
                  class="monster-avatar"
                  :draggable="false"
                  @error="handleMonsterIconError"
                />
                <span class="monster-name">{{ target.monsterName }}</span>
                <span class="kill-count" :class="{ 'count-done': target.current >= target.target }">
                  {{ target.current }}/{{ target.target }}
                </span>
                <span v-if="target.current >= target.target" class="kill-check done">✔</span>
                <span v-else class="kill-check fail">✖</span>
              </div>
            </div>

            <!-- 无击杀目标时的提示（已接受/已完成状态） -->
            <div v-if="(isQuestAccepted(idx) || isQuestCompleted(idx)) && getKillProgress(idx).length === 0" class="no-kill-hint">
              <span class="no-kill-icon">📋</span>
              <span class="no-kill-text">对话/收集类任务，接受后可直接完成</span>
            </div>

            <!-- 未接受任务时的击杀预览 -->
            <div v-if="isQuestAvailable(idx) && !isQuestAccepted(idx) && quest.killTargets.length > 0" class="kill-preview-list">
              <div
                v-for="target in quest.killTargets"
                :key="target.monsterId"
                class="kill-preview-item"
              >
                <img
                  :src="getMonsterIcon(target.monsterId)"
                  class="monster-avatar"
                  :draggable="false"
                  @error="handleMonsterIconError"
                />
                <span class="monster-name">{{ target.monsterName }}</span>
                <span class="kill-count">×{{ target.count }}</span>
              </div>
            </div>

            <!-- 未接受任务且无击杀目标时的提示 -->
            <div v-if="isQuestAvailable(idx) && !isQuestAccepted(idx) && quest.killTargets.length === 0" class="no-kill-hint">
              <span class="no-kill-icon">📋</span>
              <span class="no-kill-text">对话/收集类任务，接受后可直接完成</span>
            </div>

            <!-- 任务奖励预览（始终显示，只要有奖励配置） -->
            <div v-if="quest.rewards && (quest.rewards.gold > 0 || (quest.rewards.items && quest.rewards.items.length > 0))" class="quest-rewards">
              <span class="rewards-label">奖励</span>
              <div class="rewards-list">
                <span v-if="quest.rewards.gold > 0" class="reward-gold">💰 {{ formatGold(quest.rewards.gold) }}</span>
                <span
                  v-for="item in quest.rewards.items"
                  :key="item.itemId"
                  class="reward-item"
                >
                  🎁 {{ item.itemName }} ×{{ item.count }}
                </span>
              </div>
            </div>
          </div>

          <!-- 接受按钮 -->
          <button
            v-if="isQuestAvailable(idx) && !isQuestAccepted(idx) && !isQuestCompleted(idx)"
            class="accept-btn"
            :class="{ 'btn-disabled': !!blockedByJob }"
            :disabled="!!blockedByJob"
            :title="blockedByJob ? `已有${blockedByJob}转职任务进行中` : ''"
            @click="!blockedByJob && acceptQuest(idx)"
          >
            {{ blockedByJob ? '已锁定' : '接受' }}
          </button>

          <!-- 完成按钮：击杀目标全部达标时显示，需手动点击完成 -->
          <button
            v-if="isQuestAccepted(idx) && isQuestKillTargetDone(idx)"
            class="complete-btn"
            @click="completeQuest(idx)"
          >
            ✨ 完成
          </button>

          <!-- 放弃按钮：已接受但未完成时可放弃 -->
          <button
            v-if="isQuestAccepted(idx)"
            class="abandon-btn"
            @click="abandonQuest(idx)"
          >
            ✕ 放弃
          </button>
        </div>
      </div>

      <!-- 底部转职按钮 -->
      <div class="quest-panel-footer">
        <button
          class="change-job-btn"
          :class="{ 'btn-ready': allQuestsCompleted }"
          :disabled="!allQuestsCompleted || alreadyChanged"
          @click="confirmJobChange"
        >
          <template v-if="alreadyChanged">已转职</template>
          <template v-else-if="allQuestsCompleted">✨ 确认转职 ✨</template>
          <template v-else>完成所有任务后可转职</template>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * JobChangeQuestPanel - 转职任务面板
 * 接收目标职业信息和任务链状态，展示任务进度
 * 通过事件将用户操作（接受任务、完成任务、确认转职）通知父组件
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getJobChangeQuestChain } from '@/data/JobChangeQuestConfig'
import { getClassAvatar } from '@/data/classes'

// ==================== Props & Emits ====================

const props = defineProps({
  /** 面板是否可见 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 目标职业 key（如 'warrior'） */
  targetJobKey: {
    type: String,
    default: ''
  },
  /** 玩家性别 */
  playerGender: {
    type: String,
    default: 'male'
  },
  /** 转职任务链状态（从 gameStore 获取） */
  questChainState: {
    type: Object,
    default: null
  },
  /** 是否已转职（已不是初心者） */
  alreadyChanged: {
    type: Boolean,
    default: false
  },
  /** 锚点矩形：职业进阶面板的位置，用于定位任务面板 */
  anchorRect: {
    type: Object,
    default: null
  },
  /** 被其他职业的已接受转职任务阻止：值为阻止的职业名称，null 表示未被阻止 */
  blockedByJob: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'accept-quest', 'complete-quest', 'abandon-quest', 'confirm-job-change'])

// ==================== 面板定位 & 拖拽 ====================

const panelRef = ref(null)
const panelX = ref(0)
const panelY = ref(0)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const panelStyle = computed(() => ({
  left: `${panelX.value}px`,
  top: `${panelY.value}px`
}))

/**
 * 根据锚点计算面板初始位置：紧贴职业进阶面板右侧，顶部对齐
 * @returns {{ x: number, y: number }} 面板定位坐标
 */
function calcAnchorPosition() {
  const gap = 12
  if (props.anchorRect) {
    const x = props.anchorRect.right + gap
    const y = props.anchorRect.top
    return {
      x: Math.min(x, window.innerWidth - 380),
      y: Math.max(20, Math.min(y, window.innerHeight - 200))
    }
  }
  // 无锚点时回退到屏幕右侧偏上
  return {
    x: Math.min(window.innerWidth - 400, window.innerWidth * 0.6),
    y: Math.max(20, window.innerHeight * 0.15)
  }
}

/**
 * 开始拖拽面板
 * @param {MouseEvent} event - 鼠标事件
 */
function startDrag(event) {
  if (
    event.target.closest('.quest-close-btn') ||
    event.target.closest('.accept-btn') ||
    event.target.closest('.change-job-btn')
  ) {
    return
  }
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - panelX.value,
    y: event.clientY - panelY.value
  }
  event.preventDefault()
}

/**
 * 拖拽中移动面板
 * @param {MouseEvent} event - 鼠标事件
 */
function onDrag(event) {
  if (!isDragging.value) return
  panelX.value = Math.max(0, Math.min(window.innerWidth - 380, event.clientX - dragOffset.value.x))
  panelY.value = Math.max(0, Math.min(window.innerHeight - 200, event.clientY - dragOffset.value.y))
}

/** 停止拖拽 */
function stopDrag() {
  isDragging.value = false
}

onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
})

// 面板显示时定位到锚点右侧
watch(
  () => props.visible,
  (v) => {
    if (v) {
      const pos = calcAnchorPosition()
      panelX.value = pos.x
      panelY.value = pos.y
    }
  }
)

// 拖拽职业进阶面板时，任务面板跟随移动（仅在非手动拖拽任务面板时跟随）
watch(
  () => props.anchorRect,
  (newRect) => {
    if (props.visible && !isDragging.value && newRect) {
      const gap = 12
      panelX.value = Math.min(newRect.right + gap, window.innerWidth - 380)
      panelY.value = Math.max(20, Math.min(newRect.top, window.innerHeight - 200))
    }
  }
)

// ==================== 怪物头像 ====================

/**
 * 格式化金币显示（每4位添加逗号）
 * @param {number} gold - 金币数量
 * @returns {string} 格式化后的金币字符串
 */
function formatGold(gold) {
  return gold.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

/**
 * 根据 monsterId 生成怪物图标路径
 * @param {number} monsterId - 怪物 ID
 * @returns {string} 图标路径
 */
function getMonsterIcon(monsterId) {
  return `/pt/monster_icon/${monsterId}.png`
}

/**
 * 怪物图标加载失败时隐藏
 * @param {Event} event - 错误事件
 */
function handleMonsterIconError(event) {
  event.target.style.display = 'none'
}

// ==================== 数据计算 ====================

/** 获取任务链配置 */
const chain = computed(() => {
  return getJobChangeQuestChain(props.targetJobKey)
})

/** 目标职业图标 */
const targetJobIcon = computed(() => {
  const gender = props.playerGender || 'male'
  return getClassAvatar(props.targetJobKey, gender)
})

/** 转职阶段标签（一转/二转/三转） */
const tierLabel = computed(() => {
  const tier = chain.value?.tier
  if (tier === 3) return '三转'
  if (tier === 2) return '二转'
  return '一转'
})

/** 已完成的任务数 */
const completedCount = computed(() => {
  if (!props.questChainState) return 0
  return props.questChainState.quests.filter((q) => q.status === 'completed').length
})

/** 是否所有任务都已完成 */
const allQuestsCompleted = computed(() => {
  if (!props.questChainState) return false
  return props.questChainState.allCompleted
})

// ==================== 任务状态判断 ====================

/**
 * 判断指定索引的任务是否可接受
 * @param {number} idx - 任务索引
 * @returns {boolean} 是否可接受
 */
function isQuestAvailable(idx) {
  if (!props.questChainState) return idx === 0
  const questState = props.questChainState.quests[idx]
  if (!questState) return false
  return questState.status === 'available'
}

/**
 * 判断指定索引的任务是否已接受
 * @param {number} idx - 任务索引
 * @returns {boolean} 是否已接受
 */
function isQuestAccepted(idx) {
  if (!props.questChainState) return false
  const questState = props.questChainState.quests[idx]
  if (!questState) return false
  return questState.status === 'accepted'
}

/**
 * 判断指定索引的任务是否已完成
 * @param {number} idx - 任务索引
 * @returns {boolean} 是否已完成
 */
function isQuestCompleted(idx) {
  if (!props.questChainState) return false
  const questState = props.questChainState.quests[idx]
  if (!questState) return false
  return questState.status === 'completed'
}

/**
 * 获取击杀进度（从任务链状态中读取）
 * @param {number} idx - 任务索引
 * @returns {Array} 击杀进度列表
 */
function getKillProgress(idx) {
  if (!props.questChainState) return []
  const questState = props.questChainState.quests[idx]
  if (!questState) return []
  return questState.killProgress
}

/**
 * 判断已接受的任务是否击杀目标全部达标（可手动完成）
 * @param {number} idx - 任务索引
 * @returns {boolean} 是否全部达标
 */
function isQuestKillTargetDone(idx) {
  if (!props.questChainState) return false
  const questState = props.questChainState.quests[idx]
  if (!questState || questState.status !== 'accepted') return false
  return questState.killProgress.every((kp) => kp.current >= kp.target)
}

// ==================== 操作 ====================

/**
 * 接受任务
 * @param {number} idx - 任务索引
 */
function acceptQuest(idx) {
  emit('accept-quest', idx)
}

/**
 * 完成任务
 * @param {number} idx - 任务索引
 */
function completeQuest(idx) {
  emit('complete-quest', idx)
}

/** 确认转职 */
function confirmJobChange() {
  if (!allQuestsCompleted.value || props.alreadyChanged) return
  emit('confirm-job-change')
}

/**
 * 放弃转职任务
 * @param {number} idx - 任务索引
 */
function abandonQuest(idx) {
  emit('abandon-quest', idx)
}

/** 关闭面板 */
function close() {
  emit('close')
}

/**
 * 职业图标加载失败时使用默认图标
 * @param {Event} e - 错误事件
 */
function handleImageError(e) {
  e.target.src = '/pt/job_icon/cxz_nan_icon.png'
}
</script>

<style scoped>
.quest-panel {
  position: fixed;
  width: 360px;
  max-height: 80vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 2px solid #8b7355;
  border-radius: 12px;
  z-index: 1200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 115, 85, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* ===== 头部 ===== */
.quest-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(139, 115, 85, 0.3), rgba(139, 115, 85, 0.1));
  border-bottom: 1px solid rgba(139, 115, 85, 0.4);
  cursor: move;
}

.quest-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quest-job-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.quest-header-title h3 {
  margin: 0;
  font-size: 15px;
  color: #fbbf24;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.quest-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.quest-close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.quest-close-btn:hover {
  background: rgba(239, 68, 68, 0.4);
  color: #fff;
}

/* ===== 任务列表 ===== */
.quest-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quest-panel-body::-webkit-scrollbar {
  width: 6px;
}

.quest-panel-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.quest-panel-body::-webkit-scrollbar-thumb {
  background: rgba(139, 115, 85, 0.4);
  border-radius: 3px;
}

.quest-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.quest-item.quest-available {
  background: rgba(251, 191, 36, 0.08);
  border-color: rgba(251, 191, 36, 0.3);
}

.quest-item.quest-accepted {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.3);
}

.quest-item.quest-completed {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  opacity: 0.8;
}

.quest-item.quest-locked {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
  opacity: 0.5;
}

/* 状态图标 */
.quest-status-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.status-check.done {
  color: #10b981;
  font-size: 16px;
}

.status-check.active {
  color: #3b82f6;
  font-size: 12px;
}

.status-check.pending {
  color: #fbbf24;
  font-size: 10px;
}

.status-check.locked {
  font-size: 12px;
}

/* 任务内容 */
.quest-content {
  flex: 1;
  min-width: 0;
}

.quest-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.quest-index {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}

.quest-name {
  font-size: 13px;
  color: #e2e8f0;
  font-weight: bold;
}

.quest-desc {
  margin: 0 0 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

/* 击杀进度 */
.kill-progress-list,
.kill-preview-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.kill-progress-item,
.kill-preview-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* 怪物头像 */
.monster-avatar {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(139, 115, 85, 0.4);
}

.monster-name {
  color: #fbbf24;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kill-count {
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
  font-size: 12px;
  white-space: nowrap;
}

.kill-count.count-done {
  color: #10b981;
}

.kill-check {
  font-size: 12px;
  font-weight: bold;
}

.kill-check.done {
  color: #10b981;
}

.kill-check.fail {
  color: #ef4444;
}

.kill-preview-item .kill-count {
  color: rgba(255, 255, 255, 0.5);
}

/* 互斥提示 */
.quest-blocked-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  margin: 0 14px 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  font-size: 11px;
  color: rgba(255, 200, 200, 0.9);
  line-height: 1.4;
}

/* 无击杀目标提示 */
.no-kill-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin-top: 4px;
  background: rgba(139, 115, 85, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.no-kill-hint .no-kill-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.no-kill-hint .no-kill-text {
  line-height: 1.4;
}

/* 任务奖励 */
.quest-rewards {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 8px;
  margin-top: 6px;
  background: rgba(251, 191, 36, 0.08);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 4px;
}

.quest-rewards .rewards-label {
  font-size: 10px;
  color: rgba(251, 191, 36, 0.8);
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1.6;
}

.quest-rewards .rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.quest-rewards .reward-gold {
  font-size: 11px;
  color: #fbbf24;
  font-weight: bold;
}

.quest-rewards .reward-item {
  font-size: 11px;
  color: rgba(52, 211, 153, 0.9);
}

.quest-blocked-tip .blocked-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.quest-blocked-tip strong {
  color: #fbbf24;
}

/* 接受按钮 */
.accept-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: bold;
  color: #1a1a2e;
  background: linear-gradient(180deg, #fbbf24, #d97706);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.accept-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
}

.accept-btn:active {
  transform: scale(0.98);
}

.accept-btn.btn-disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.accept-btn.btn-disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 完成按钮 */
.complete-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: bold;
  color: #1a1a2e;
  background: linear-gradient(180deg, #34d399, #059669);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  animation: complete-pulse 2s ease-in-out infinite;
}

.complete-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 14px rgba(52, 211, 153, 0.6);
}

.complete-btn:active {
  transform: scale(0.98);
}

@keyframes complete-pulse {
  0%, 100% { box-shadow: 0 0 6px rgba(52, 211, 153, 0.3); }
  50% { box-shadow: 0 0 16px rgba(52, 211, 153, 0.6); }
}

/* 放弃按钮 */
.abandon-btn {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.abandon-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.7);
  color: #ff6b6b;
  transform: scale(1.05);
}

.abandon-btn:active {
  transform: scale(0.98);
}

/* ===== 底部 ===== */
.quest-panel-footer {
  padding: 10px 14px;
  border-top: 1px solid rgba(139, 115, 85, 0.3);
  background: rgba(0, 0, 0, 0.2);
}

.change-job-btn {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: not-allowed;
  transition: all 0.3s;
}

.change-job-btn.btn-ready {
  color: #1a1a2e;
  background: linear-gradient(180deg, #fbbf24, #d97706);
  border-color: #fbbf24;
  cursor: pointer;
  animation: btnPulse 2s ease-in-out infinite;
}

.change-job-btn.btn-ready:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.change-job-btn:disabled:not(.btn-ready) {
  cursor: not-allowed;
}

@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(251, 191, 36, 0.3); }
  50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
}

/* ===== 过渡动画 ===== */
.quest-panel-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.quest-panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.quest-panel-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.quest-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
