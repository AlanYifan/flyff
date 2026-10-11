/**
 * @file DungeonMemberPet.vue
 * @description 副本页面队员召唤宠物浮动显示组件
 * 业务意图：在副本页面中，将队员召唤的捡宠和培育型宠物以浮动图标形式显示在队员头像上方
 * - 捡宠显示在头像上方左侧（与队长 PickuppetPet 左右一致）
 * - 培育型宠物显示在头像上方右侧（与队长 DungeonRaisedPet 左右一致）
 * - 视觉风格与队长的宠物组件完全一致（浮动动画、名称标签、点击操作面板）
 * - 队长点击队员宠物图标后可执行召回操作（队员自身无法操作）
 * - 队长和队员的宠物系统互不干扰
 * @generated 2026-07-11
 */

<template>
  <Teleport to="body">
    <!-- 捡宠（左侧） -->
    <div
      v-if="pickuppet"
      class="member-pet-floating"
      :style="pickuppetStyle"
    >
      <img
        :src="pickuppet.icon"
        :alt="pickuppet.name"
        class="pet-image"
        draggable="false"
        @click.stop="togglePickuppetPanel"
      />
      <div class="pet-name-tag pet-name-pickuppet">{{ pickuppet.name }}</div>

      <!-- 点击后的操作面板 -->
      <div
        v-if="showPickuppetPanel"
        class="pet-action-panel"
        @click.stop
      >
        <button
          class="action-btn recall-btn"
          @click="onRecallPickuppet"
        >
          召回
        </button>
      </div>
    </div>

    <!-- 培育型宠物（右侧） -->
    <div
      v-if="raisedPet"
      class="member-pet-floating"
      :style="raisedPetStyle"
    >
      <img
        :src="raisedPet.icon"
        :alt="raisedPet.name"
        class="pet-image"
        draggable="false"
        @click.stop="toggleRaisedPetPanel"
      />
      <div class="pet-name-tag pet-name-raised">{{ raisedPet.name }}</div>

      <!-- 点击后的操作面板 -->
      <div
        v-if="showRaisedPetPanel"
        class="pet-action-panel"
        @click.stop
      >
        <button
          class="action-btn recall-btn"
          @click="onRecallRaisedPet"
        >
          召回
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

/**
 * 组件 Props
 * @property {string|number} slotId - 队员的 slotId，用于定位队员头像 DOM 元素
 * @property {{ icon: string, name: string }|null} pickuppet - 捡宠显示数据（null 表示未召唤）
 * @property {{ icon: string, name: string }|null} raisedPet - 培育型宠物显示数据（null 表示未召唤）
 */
const props = defineProps({
  slotId: {
    type: [String, Number],
    required: true
  },
  pickuppet: {
    type: Object,
    default: null
  },
  raisedPet: {
    type: Object,
    default: null
  }
})

/**
 * 组件事件
 * @event recall-pickuppet - 队长点击召回队员捡宠时触发，参数为 slotId
 * @event recall-raised-pet - 队长点击召回队员培育型宠物时触发，参数为 slotId
 */
const emit = defineEmits(['recall-pickuppet', 'recall-raised-pet'])

/** 捡宠浮动位置 X 坐标 */
const pickuppetX = ref(0)
/** 捡宠浮动位置 Y 坐标 */
const pickuppetY = ref(0)

/** 培育型宠物浮动位置 X 坐标 */
const raisedPetX = ref(0)
/** 培育型宠物浮动位置 Y 坐标 */
const raisedPetY = ref(0)

/** 是否显示捡宠操作面板 */
const showPickuppetPanel = ref(false)
/** 是否显示培育型宠物操作面板 */
const showRaisedPetPanel = ref(false)

/** 宠物图标尺寸（px） */
const PET_SIZE = 48

/** 位置更新定时器 ID */
let positionTimer = null

/**
 * 捡宠浮动样式
 */
const pickuppetStyle = computed(() => ({
  transform: `translate(${pickuppetX.value}px, ${pickuppetY.value}px)`,
  transition: 'transform 0.3s ease-out'
}))

/**
 * 培育型宠物浮动样式
 */
const raisedPetStyle = computed(() => ({
  transform: `translate(${raisedPetX.value}px, ${raisedPetY.value}px)`,
  transition: 'transform 0.3s ease-out'
}))

/**
 * 获取队员头像 DOM 元素
 * 通过 slotId 在队员卡片上定位头像元素
 * @returns {HTMLElement|null} 队员头像元素
 */
const getAvatarElement = () => {
  try {
    const selector = `.team-member-card.is-teammember[data-slot-id="${props.slotId}"] .member-avatar`
    return document.querySelector(selector)
  } catch (error) {
    console.error('[DungeonMemberPet] 获取队员头像元素失败:', error)
    return null
  }
}

/**
 * 计算宠物浮动位置
 * - 捡宠（左侧）：宠物右边缘对齐头像中线，左边缘不超出头像左边缘
 * - 培育型宠物（右侧）：宠物左边缘对齐头像中线，右边缘不超出头像右边缘
 * - 垂直方向：头像上方 20px
 * @returns {{ pickuppet: { x: number, y: number }, raisedPet: { x: number, y: number } }} 宠物位置坐标
 */
const getPetPositions = () => {
  const avatarEl = getAvatarElement()
  if (!avatarEl) {
    return {
      pickuppet: { x: 200, y: 150 },
      raisedPet: { x: 250, y: 150 }
    }
  }

  const rect = avatarEl.getBoundingClientRect()

  // 捡宠（左侧）：右边缘对齐头像中线
  const pickuppetX = rect.left + Math.max(0, rect.width / 2 - PET_SIZE)
  // 培育型宠物（右侧）：左边缘对齐头像中线
  const raisedPetX = rect.left + Math.min(rect.width / 2, rect.width - PET_SIZE)
  // 垂直方向：头像上方 20px
  const y = rect.top - 20 - PET_SIZE

  return {
    pickuppet: { x: pickuppetX, y },
    raisedPet: { x: raisedPetX, y }
  }
}

/**
 * 更新宠物位置（应对窗口大小变化、滚动等）
 */
const updatePosition = () => {
  const hasPet = props.pickuppet || props.raisedPet
  if (!hasPet) return

  const positions = getPetPositions()

  if (props.pickuppet) {
    pickuppetX.value = positions.pickuppet.x
    pickuppetY.value = positions.pickuppet.y
  }
  if (props.raisedPet) {
    raisedPetX.value = positions.raisedPet.x
    raisedPetY.value = positions.raisedPet.y
  }
}

/**
 * 切换捡宠操作面板的显示/隐藏
 */
const togglePickuppetPanel = () => {
  showPickuppetPanel.value = !showPickuppetPanel.value
  // 关闭另一个面板
  if (showPickuppetPanel.value) {
    showRaisedPetPanel.value = false
  }
}

/**
 * 切换培育型宠物操作面板的显示/隐藏
 */
const toggleRaisedPetPanel = () => {
  showRaisedPetPanel.value = !showRaisedPetPanel.value
  // 关闭另一个面板
  if (showRaisedPetPanel.value) {
    showPickuppetPanel.value = false
  }
}

/**
 * 召回捡宠（由队长操作）
 */
const onRecallPickuppet = () => {
  emit('recall-pickuppet', props.slotId)
  showPickuppetPanel.value = false
}

/**
 * 召回培育型宠物（由队长操作）
 */
const onRecallRaisedPet = () => {
  emit('recall-raised-pet', props.slotId)
  showRaisedPetPanel.value = false
}

/**
 * 点击外部区域关闭操作面板
 */
const onDocumentClick = () => {
  if (showPickuppetPanel.value) {
    showPickuppetPanel.value = false
  }
  if (showRaisedPetPanel.value) {
    showRaisedPetPanel.value = false
  }
}

// 监听宠物数据变化，更新位置（不使用 immediate，初始位置由 onMounted 处理）
watch(
  () => [props.pickuppet, props.raisedPet],
  () => {
    if (props.pickuppet || props.raisedPet) {
      // 使用 nextTick 确保 DOM 已更新后再计算位置
      nextTick(() => {
        requestAnimationFrame(updatePosition)
      })
    }
  }
)

onMounted(() => {
  // 使用 nextTick 确保队员卡片 DOM 已完全渲染后再计算位置
  // 避免因 DOM 未就绪导致 getBoundingClientRect 返回错误坐标
  nextTick(() => {
    if (props.pickuppet || props.raisedPet) {
      updatePosition()
    }
  })
  // 延迟二次校正：确保在所有布局完成后位置准确
  setTimeout(() => {
    if (props.pickuppet || props.raisedPet) {
      updatePosition()
    }
  }, 300)
  // 定期更新位置（应对窗口大小变化等）
  positionTimer = setInterval(updatePosition, 1000)
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  if (positionTimer) {
    clearInterval(positionTimer)
    positionTimer = null
  }
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped>
.member-pet-floating {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  will-change: transform;
}

.pet-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
  animation: petBob 2s ease-in-out infinite;
  cursor: pointer;
  pointer-events: auto;
}

.pet-name-tag {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  font-weight: bold;
}

/* 捡宠名称：金色 */
.pet-name-pickuppet {
  color: #ffd700;
}

/* 培育宠物名称：青色 */
.pet-name-raised {
  color: #7fffd4;
}

.pet-action-panel {
  position: absolute;
  top: 0;
  left: 52px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background-color: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  z-index: 10001;
}

.action-btn {
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.recall-btn {
  background: rgba(255, 80, 80, 0.12);
  color: #e74c3c;
  border: 1px solid var(--theme-border-strong);
}

.recall-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  color: #ff6b6b;
}

@keyframes petBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pet-image {
    animation: none;
  }
}
</style>
