<template>
  <transition name="dialogue-fade" appear>
    <div v-if="isVisible" class="dialogue-overlay" @click="handleClick">
      <!-- 电影黑边 - 上下 -->
      <div class="cinematic-bar cinematic-bar-top"></div>
      <div class="cinematic-bar cinematic-bar-bottom"></div>

      <!-- 关闭按钮 - 始终可见 -->
      <button class="dialogue-close-btn" @click.stop="handleClose" title="关闭对话 (ESC)">
        <span>&times;</span>
      </button>

      <!-- 自动跳过打字机开关 -->
      <button
        class="dialogue-autoskip-btn"
        :class="{ 'autoskip-active': autoSkipTypewriter }"
        @click.stop="toggleAutoSkip"
        :title="autoSkipTypewriter ? '已开启即时显示，点击恢复打字机效果' : '点击开启即时显示文本'"
      >
        <span>{{ autoSkipTypewriter ? '⚡' : '✎' }}</span>
      </button>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="dialogue-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在准备对话...</div>
      </div>

      <!-- 对话内容 -->
      <template v-else-if="currentNPC">
        <!-- NPC立绘区域 -->
        <div class="npc-portrait-area">
          <transition name="portrait-slide" appear>
            <div class="npc-portrait-wrapper">
              <img
                :src="currentNPC.icon"
                :alt="currentNPC.name"
                class="npc-portrait"
                draggable="false"
                @error="handleImageError"
              />
              <div class="npc-portrait-glow"></div>
            </div>
          </transition>
        </div>

        <!-- 对话框区域 -->
        <transition name="dialogue-box-rise" appear>
          <div v-if="currentPhase" class="dialogue-box">
            <!-- NPC名称 -->
            <div class="dialogue-name-bar">
              <span class="dialogue-name-text">{{ currentNPC.name }}</span>
            </div>

            <!-- 对话文本区域 -->
            <div class="dialogue-text-area">
              <p class="dialogue-text">{{ displayText }}</p>
              <!-- 打字机光标 -->
              <span v-if="isTyping" class="typewriter-cursor">▌</span>
            </div>

            <!-- 任务奖励展示区域 -->
            <div v-if="showQuestRewards" class="dialogue-quest-rewards" @click.stop>
              <div class="quest-rewards-title">🎁 任务奖励</div>
              <div class="quest-rewards-list">
                <div v-if="questExpReward > 0" class="quest-reward-entry">
                  <img src="/pt/UI/exp.png" class="quest-reward-icon" @error="handleRewardImageError" />
                  <span class="quest-reward-name">经验值</span>
                  <span class="quest-reward-count">{{ questExpReward.toLocaleString() }}%</span>
                </div>
                <div v-if="questGoldReward > 0" class="quest-reward-entry">
                  <img src="/pt/UI/gold.png" class="quest-reward-icon" @error="handleRewardImageError" />
                  <span class="quest-reward-name">金币</span>
                  <span class="quest-reward-count">{{ questGoldReward.toLocaleString() }}</span>
                </div>
                <div v-for="itemReward in questItemRewards" :key="itemReward.item" class="quest-reward-entry">
                  <img
                    :src="`/pt/item_icon/${itemReward.item}.png`"
                    class="quest-reward-icon"
                    @error="handleRewardImageError"
                  />
                  <span class="quest-reward-name">{{ getItemName(itemReward.item) }}</span>
                  <span class="quest-reward-count">×{{ itemReward.count || 1 }}</span>
                </div>
              </div>
            </div>

            <!-- 选项区域 -->
            <transition name="options-fade">
              <div
                v-if="showOptions"
                class="dialogue-options"
                :class="{
                  'dialogue-options-quest-list': currentPhase.phase === 'questList' || currentPhase.phase === 'questCompleteList'
                }"
                @click.stop
              >
                <div
                  v-for="(option, index) in currentPhase.options"
                  :key="index"
                  class="dialogue-option"
                  :class="{
                    'option-accept': option.action === 'accept-quest',
                    'option-decline': option.action === 'decline-quest',
                    'option-quest-item': option.action === 'select-quest' || option.action === 'select-complete-quest',
                    'option-skip': option.action === 'skip' || option.action === 'back-to-quest-list' || option.action === 'back-to-complete-list',
                    'option-complete': option.action === 'complete-quest',
                    'option-locked': option.levelLocked
                  }"
                  @click.stop="handleOptionClick(option)"
                >
                  <span v-if="option.action === 'select-quest' || option.action === 'select-complete-quest'" class="option-icon">📋</span>
                  <span v-if="option.action === 'complete-quest'" class="option-icon">🎁</span>
                  <span class="option-key-hint" v-if="index < 9">{{ index + 1 }}</span>
                  <div class="option-content-wrapper">
                    <span class="option-text">{{ option.label }}</span>
                    <span v-if="option.desc" class="option-desc">{{ option.desc }}</span>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 继续提示 -->
            <div v-if="canClickContinue && !showOptions" class="dialogue-continue-hint">
              <span class="continue-key-hint">空格/回车</span>
              <span class="continue-arrow">▼</span>
            </div>
          </div>
        </transition>
      </template>

      <!-- 错误回退 - 当加载失败时显示 -->
      <div v-else class="dialogue-error-fallback" @click.stop="handleClose">
        <div class="error-icon">⚠</div>
        <div class="error-text">对话加载失败，点击任意位置关闭</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * 原神风格对话系统组件
 * 全屏沉浸式对话UI，支持打字机效果、NPC立绘、选项分支
 * 修复：添加关闭按钮、ESC退出、错误回退、emit close通知父组件
 *
 * @file DialogueSystem.vue
 * @generated 2026-06-26
 */
import { watch, onMounted, onUnmounted, computed } from 'vue'
import { useDialogueSystem } from '@/composables/useDialogueSystem'

/**
 * 组件 Props
 */
const props = defineProps({
  /** 对话框是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  },
  /** 对话启动参数 { npcId, npcConfig, player, mapLevelRange, shopType } */
  dialogueParams: {
    type: Object,
    default: () => null
  }
})

/**
 * 组件事件
 */
const emit = defineEmits([
  'close',
  'quest-accepted',
  'quest-completed',
  'open-shop',
  'view-quests'
])

// 使用对话系统组合式函数
const {
  currentNPC,
  currentPhase,
  displayText,
  isTyping,
  isLoading,
  showOptions,
  canClickContinue,
  autoSkipTypewriter,
  itemData,
  playerLevel,
  startDialogue,
  advance,
  selectOption,
  skipTypewriter,
  toggleAutoSkip,
  closeDialogue
} = useDialogueSystem()

/**
 * 当前任務阶段的任务对象
 * 用于在 QUEST_OPTIONS 阶段显示任务奖励道具图片和数量
 */
const phaseQuest = computed(() => currentPhase.value?.quest || null)

/**
 * 任务奖励物品列表
 */
const questItemRewards = computed(() => {
  const quest = phaseQuest.value
  if (!quest) return []
  const items = quest.endReceiveItems
  return Array.isArray(items) ? items : []
})

/**
 * 任务经验奖励
 */
const questExpReward = computed(() => {
  const quest = phaseQuest.value
  if (!quest?.endReceiveExperience) return 0
  const source = quest.endReceiveExperience
  if (Array.isArray(source)) {
    const index = Math.min((playerLevel.value || 1) - 1, source.length - 1)
    const raw = source[Math.max(0, index)] ?? source[0] ?? 0
    const value = Number(raw)
    return Number.isFinite(value) && value > 0 ? value : 0
  }
  const value = Number(source)
  return Number.isFinite(value) && value > 0 ? value : 0
})

/**
 * 任务金币奖励
 */
const questGoldReward = computed(() => {
  const quest = phaseQuest.value
  if (!quest?.endReceiveGold) return 0
  const value = Number(quest.endReceiveGold)
  return Number.isFinite(value) && value > 0 ? value : 0
})

/**
 * 是否显示任务奖励区域
 */
const showQuestRewards = computed(() => {
  if (!phaseQuest.value) return false
  // 仅在任务选项阶段显示
  const phase = currentPhase.value?.phase
  if (phase !== 'questOptions' && phase !== 'questComplete') return false
  return questItemRewards.value.length > 0 || questExpReward.value > 0 || questGoldReward.value > 0
})

/**
 * 获取物品名称
 * @param {number} itemId - 物品ID
 * @returns {string} 物品名称
 */
const getItemName = (itemId) => {
  const item = itemData.value?.[itemId] || itemData.value?.[String(itemId)]
  return item?.name?.cns || item?.name?.en || `物品${itemId}`
}

/**
 * 处理图片加载错误
 * @param {Event} event - 图片错误事件
 */
const handleRewardImageError = (event) => {
  event.target.src = '/pt/item_icon/default_item.png'
}

/**
 * 关闭对话并通知父组件
 * 包装 closeDialogue，确保同时 emit 'close' 让父组件关闭 modalStates
 */
const handleClose = () => {
  closeDialogue()
  emit('close')
}

/**
 * 处理点击事件
 * 点击对话区域：跳过打字机或前进对话
 */
const handleClick = () => {
  if (isLoading.value) return
  if (!currentNPC.value) {
    // 加载失败时点击关闭
    handleClose()
    return
  }
  if (showOptions.value) return // 有选项时不自动前进
  if (isTyping.value) {
    skipTypewriter()
  } else if (canClickContinue.value) {
    advance()
  }
}

/**
 * 处理选项点击
 * @param {Object} option - 选项对象
 */
const handleOptionClick = (option) => {
  selectOption(option, {
    emit,
    openShop: (shopType) => emit('open-shop', shopType),
    openQuestPanel: () => emit('view-quests'),
    close: handleClose
  })
}

/**
 * 处理图片加载错误
 * @param {Event} event - 图片错误事件
 */
const handleImageError = (event) => {
  event.target.src = '/pt/npc_icon/agent.png'
}

/**
 * ESC 键关闭对话，数字键 1-9 快速选择选项
 * @param {KeyboardEvent} event - 键盘事件
 */
const handleKeydown = (event) => {
  if (!props.isVisible) return

  // ESC 键关闭对话
  if (event.key === 'Escape') {
    handleClose()
    return
  }

  // 空格/回车键：跳过打字机或前进对话
  if ((event.key === ' ' || event.key === 'Enter') && !showOptions.value) {
    event.preventDefault()
    if (isTyping.value) {
      skipTypewriter()
    } else if (canClickContinue.value) {
      advance()
    }
    return
  }

  // 数字键 1-9：快速选择选项
  if (showOptions.value && currentPhase.value?.options) {
    const num = parseInt(event.key, 10)
    if (num >= 1 && num <= 9 && num <= currentPhase.value.options.length) {
      event.preventDefault()
      const option = currentPhase.value.options[num - 1]
      handleOptionClick(option)
    }
  }
}

// 监听 isVisible 变化，启动或关闭对话
watch(
  () => props.isVisible,
  async (visible) => {
    if (visible && props.dialogueParams) {
      await startDialogue(props.dialogueParams, () => {
        // 加载失败时通知父组件关闭
        emit('close')
      })
    } else if (!visible) {
      closeDialogue()
    }
  },
  { immediate: true }
)

// 监听 dialogueParams.npcId 变化
// 仅在对话面板已打开且切换到不同NPC时重新启动对话
// 注意：不使用 deep 监听整个 dialogueParams，因为其中 player 是响应式对象，
// 其内部属性（HP/MP/金币/背包等）在游戏中频繁变化，会导致对话反复重启、内容跳动
watch(
  () => props.dialogueParams?.npcId,
  async (npcId) => {
    if (props.isVisible && npcId !== null && npcId !== undefined && props.dialogueParams?.npcConfig && !isLoading.value) {
      await startDialogue(props.dialogueParams, () => {
        emit('close')
      })
    }
  }
)

// ESC 键监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法给父组件
defineExpose({
  closeDialogue: handleClose
})
</script>

<style scoped>
/* ========== 任务奖励展示区域 ========== */
.dialogue-quest-rewards {
  padding: 8px 16px;
  margin: 4px 0;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
}

.quest-rewards-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 6px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.quest-rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quest-reward-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quest-reward-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: contain;
}

.quest-reward-name {
  font-size: 13px;
  color: #e0e0e0;
}

.quest-reward-count {
  font-size: 13px;
  font-weight: bold;
  color: #ffd700;
}

/* ========== 全屏遮罩 ========== */
.dialogue-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2000;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* ========== 关闭按钮 ========== */
.dialogue-close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  width: 44px;
  height: 44px;
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 50%;
  color: #d4af37;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
}

.dialogue-close-btn:hover {
  background: rgba(60, 30, 30, 0.9);
  border-color: rgba(239, 83, 80, 0.6);
  color: #ef5350;
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(239, 83, 80, 0.3);
}

/* ========== 自动跳过开关按钮 ========== */
.dialogue-autoskip-btn {
  position: absolute;
  top: 20px;
  right: 84px;
  width: 44px;
  height: 44px;
  background: rgba(30, 30, 40, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 50%;
  color: #d4af37;
  font-size: 20px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  line-height: 1;
}

.dialogue-autoskip-btn:hover {
  background: rgba(40, 40, 55, 0.9);
  border-color: rgba(212, 175, 55, 0.7);
  transform: scale(1.1);
}

.dialogue-autoskip-btn.autoskip-active {
  background: rgba(50, 50, 20, 0.9);
  border-color: rgba(255, 215, 0, 0.7);
  color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

/* ========== 电影黑边 ========== */
.cinematic-bar {
  position: absolute;
  left: 0;
  width: 100%;
  height: 8vh;
  background: #000;
  z-index: 10;
  pointer-events: none;
}

.cinematic-bar-top {
  top: 0;
}

.cinematic-bar-bottom {
  bottom: 0;
}

/* ========== 加载状态 ========== */
.dialogue-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #d4af37;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(212, 175, 55, 0.2);
  border-top-color: #d4af37;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: #aaa;
  letter-spacing: 2px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 错误回退 ========== */
.dialogue-error-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
}

.error-icon {
  font-size: 48px;
  color: #ef5350;
}

.error-text {
  font-size: 16px;
  color: #aaa;
  letter-spacing: 1px;
}

/* ========== NPC立绘区域 ========== */
.npc-portrait-area {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 45%;
  height: 75%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.npc-portrait-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.npc-portrait {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(0 0 30px rgba(212, 175, 55, 0.3));
}

.npc-portrait-glow {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40%;
  background: radial-gradient(ellipse at bottom, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

/* ========== 对话框 ========== */
.dialogue-box {
  position: relative;
  width: 92%;
  max-width: 900px;
  margin-bottom: 10vh;
  margin-left: auto;
  margin-right: auto;
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 12px;
  box-shadow:
    0 0 40px rgba(0, 0, 0, 0.8),
    0 0 80px rgba(212, 175, 55, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 0;
  z-index: 20;
  overflow: hidden;
}

/* 对话框装饰边线 */
.dialogue-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.6), transparent);
}

.dialogue-box::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}

/* ========== NPC名称栏 ========== */
.dialogue-name-bar {
  display: inline-block;
  padding: 6px 24px;
  margin: -1px 0 0 32px;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 140, 40, 0.15) 100%);
  border: 1px solid rgba(212, 175, 55, 0.5);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  position: relative;
  top: 1px;
}

.dialogue-name-text {
  font-size: 18px;
  font-weight: 600;
  color: #f0e6d3;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
  letter-spacing: 2px;
}

/* ========== 对话文本区域 ========== */
.dialogue-text-area {
  padding: 20px 32px 16px;
  min-height: 80px;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.dialogue-text {
  font-size: 17px;
  line-height: 1.8;
  color: #e8e0d0;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

/* 打字机光标 */
.typewriter-cursor {
  display: inline-block;
  color: #d4af37;
  font-weight: bold;
  animation: cursor-blink 0.8s steps(1) infinite;
  margin-left: 2px;
}

@keyframes cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* ========== 任务列表选项样式 ========== */
.dialogue-options-quest-list {
  max-height: 320px;
  overflow-y: auto;
}

.dialogue-options-quest-list::-webkit-scrollbar {
  width: 6px;
}

.dialogue-options-quest-list::-webkit-scrollbar-track {
  background: rgba(20, 20, 30, 0.5);
  border-radius: 3px;
}

.dialogue-options-quest-list::-webkit-scrollbar-thumb {
  background: rgba(212, 175, 55, 0.3);
  border-radius: 3px;
}

.dialogue-options-quest-list::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.5);
}

/* 等级不足的任务选项 */
.option-locked {
  border-left: 3px solid #ef5350;
  opacity: 0.6;
}

.option-locked .option-text {
  color: rgba(239, 83, 80, 0.8);
}

.option-locked .option-desc {
  color: rgba(239, 83, 80, 0.5);
}

.option-locked:hover {
  opacity: 0.85;
  border-left-color: #e57373;
  background: linear-gradient(135deg, rgba(60, 30, 30, 0.8) 0%, rgba(50, 25, 25, 0.8) 100%);
  box-shadow: 0 0 8px rgba(239, 83, 80, 0.15);
}

.option-quest-item {
  border-left: 3px solid #64b5f6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-quest-item:hover {
  border-left-color: #42a5f5;
  background: linear-gradient(135deg, rgba(33, 66, 90, 0.9) 0%, rgba(25, 55, 75, 0.9) 100%);
  box-shadow: 0 0 12px rgba(100, 181, 246, 0.2);
}

.option-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.option-skip {
  border-left: 3px solid rgba(150, 150, 150, 0.4);
  opacity: 0.8;
}

.option-skip:hover {
  opacity: 1;
  border-left-color: rgba(180, 180, 180, 0.6);
}

.option-complete {
  border-left: 3px solid #ffa726;
}

.option-complete:hover {
  border-left-color: #ffb74d;
  box-shadow: 0 0 12px rgba(255, 167, 38, 0.2);
}

/* 选项内容容器 */
.option-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

/* 任务描述预览 */
.option-desc {
  font-size: 12px;
  color: rgba(180, 170, 150, 0.7);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 数字键提示 */
.option-key-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  min-width: 20px;
  background: rgba(212, 175, 55, 0.2);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(212, 175, 55, 0.8);
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 4px;
}

.dialogue-option:hover .option-key-hint {
  background: rgba(212, 175, 55, 0.35);
  border-color: rgba(212, 175, 55, 0.7);
  color: #d4af37;
}

/* ========== 选项区域 ========== */
.dialogue-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 32px 20px;
}

.dialogue-option {
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(40, 40, 55, 0.8) 0%, rgba(30, 30, 45, 0.8) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dialogue-option:hover {
  background: linear-gradient(135deg, rgba(60, 55, 40, 0.9) 0%, rgba(50, 45, 35, 0.9) 100%);
  border-color: rgba(212, 175, 55, 0.6);
  transform: translateX(4px);
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.15);
}

.option-accept {
  border-left: 3px solid #4caf50;
}

.option-accept:hover {
  border-left-color: #66bb6a;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.2);
}

.option-decline {
  border-left: 3px solid #ef5350;
}

.option-decline:hover {
  border-left-color: #e57373;
  box-shadow: 0 0 12px rgba(239, 83, 80, 0.2);
}

.option-text {
  font-size: 15px;
  color: #d4c8b0;
  letter-spacing: 1px;
}

/* ========== 继续提示 ========== */
.dialogue-continue-hint {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 0 32px 12px;
}

.continue-arrow {
  font-size: 14px;
  color: rgba(212, 175, 55, 0.6);
  animation: bounce-down 1.2s ease-in-out infinite;
}

.continue-key-hint {
  font-size: 11px;
  color: rgba(212, 175, 55, 0.4);
  letter-spacing: 1px;
}

@keyframes bounce-down {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(4px);
    opacity: 1;
  }
}

/* ========== 过渡动画 ========== */

/* 遮罩淡入淡出 */
.dialogue-fade-enter-active,
.dialogue-fade-leave-active {
  transition: opacity 0.4s ease;
}

.dialogue-fade-enter-from,
.dialogue-fade-leave-to {
  opacity: 0;
}

/* 立绘滑入 */
.portrait-slide-enter-active {
  transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease;
}

.portrait-slide-enter-from {
  transform: translateX(-100px);
  opacity: 0;
}

/* 对话框上浮 */
.dialogue-box-rise-enter-active {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s, opacity 0.5s ease 0.1s;
}

.dialogue-box-rise-enter-from {
  transform: translateY(40px);
  opacity: 0;
}

/* 选项淡入 */
.options-fade-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.options-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .npc-portrait-area {
    width: 100%;
    height: 55%;
    opacity: 0.5;
  }

  .dialogue-box {
    width: 96%;
    margin-bottom: 8vh;
  }

  .dialogue-text {
    font-size: 15px;
  }

  .dialogue-name-text {
    font-size: 16px;
  }

  .option-text {
    font-size: 14px;
  }

  .dialogue-close-btn {
    top: 10px;
    right: 15px;
    width: 36px;
    height: 36px;
    font-size: 24px;
  }

  .dialogue-autoskip-btn {
    top: 10px;
    right: 57px;
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .option-key-hint {
    display: none;
  }

  .continue-key-hint {
    display: none;
  }
}
</style>
