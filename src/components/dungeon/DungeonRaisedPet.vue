/**
 * @file DungeonRaisedPet.vue
 * @description 副本页面培育型宠物浮动显示组件
 * 业务意图：在副本页面中，将召唤的培育型宠物以浮动图标形式显示在召唤者（队长）角色图片上方20px右侧
 * 与捡宠（PickuppetPet）左右并列，两者显示边缘均不超出召唤者图片宽度
 * @generated 2026-07-11
 */

<template>
  <Teleport to="body">
    <div
      v-if="raisedPetSummonStore.hasSummonedPet"
      class="dungeon-raised-pet"
      :style="petStyle"
    >
      <img
        :src="raisedPetSummonStore.summonedPetIcon"
        :alt="petName"
        class="pet-image"
        draggable="false"
        @click.stop="toggleActionPanel"
      />
      <!-- 宠物名称提示 -->
      <div class="pet-name-tag">{{ petName }}</div>

      <!-- 点击后的小面板：紧贴宠物图片右侧 -->
      <div
        v-if="showActionPanel"
        class="pet-action-panel"
        @click.stop
      >
        <div class="pet-info">
          <span class="info-label">能量</span>
          <span class="info-value">{{ raisedPetSummonStore.currentEnergy }} / {{ raisedPetSummonStore.maxEnergy }}</span>
        </div>
        <button
          class="action-btn recall-btn"
          @click="onRecall"
        >
          召回
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRaisedPetSummonStore } from '@/store'

/** 培育型宠物 Store */
const raisedPetSummonStore = useRaisedPetSummonStore()

/** 宠物浮动位置 X 坐标 */
const petX = ref(0)
/** 宠物浮动位置 Y 坐标 */
const petY = ref(0)

/** 是否显示操作小面板 */
const showActionPanel = ref(false)

/** 宠物图标尺寸（px） */
const PET_SIZE = 48

/** 位置更新定时器 ID */
let positionTimer = null

/**
 * 宠物名称
 */
const petName = computed(() => {
  const item = raisedPetSummonStore.summonedPetItem
  const inline = item?.name
  if (typeof inline === 'string' && inline) {
    return inline
  }
  return '培育宠物'
})

/**
 * 宠物浮动样式
 */
const petStyle = computed(() => ({
  transform: `translate(${petX.value}px, ${petY.value}px)`,
  transition: 'transform 0.3s ease-out'
}))

/**
 * 计算召唤者（队长）头像上方的右侧位置
 * 宠物左边缘对齐头像中线，右边缘不超出头像右边缘
 * @returns {{ x: number, y: number }} 屏幕坐标
 */
const getPetPosition = () => {
  try {
    const avatarEl = document.getElementById('playerAvatar')
    if (avatarEl) {
      const rect = avatarEl.getBoundingClientRect()
      // 右侧：宠物左边缘对齐头像中线，右边缘不超出头像右边缘
      const x = rect.left + Math.min(rect.width / 2, rect.width - PET_SIZE)
      // 上方20px
      const y = rect.top - 20 - PET_SIZE
      return { x, y }
    }
  } catch (error) {
    console.error('[DungeonRaisedPet] 获取宠物位置失败:', error)
  }
  return { x: 200, y: 150 }
}

/**
 * 更新宠物位置（应对窗口大小变化、滚动等）
 */
const updatePosition = () => {
  if (!raisedPetSummonStore.hasSummonedPet) return
  const pos = getPetPosition()
  petX.value = pos.x
  petY.value = pos.y
}

/**
 * 切换操作小面板的显示/隐藏
 */
const toggleActionPanel = () => {
  showActionPanel.value = !showActionPanel.value
}

/**
 * 召回培育型宠物
 */
const onRecall = () => {
  try {
    raisedPetSummonStore.recall()
    showActionPanel.value = false
  } catch (error) {
    console.error('[DungeonRaisedPet] 召回培育型宠物失败:', error)
  }
}

/**
 * 点击外部区域关闭操作面板
 */
const onDocumentClick = () => {
  if (showActionPanel.value) {
    showActionPanel.value = false
  }
}

onMounted(() => {
  if (raisedPetSummonStore.hasSummonedPet) {
    updatePosition()
  }
  // 定期更新位置（应对窗口大小变化等）
  positionTimer = setInterval(updatePosition, 2000)
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
.dungeon-raised-pet {
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
  color: #7fffd4;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  font-weight: bold;
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

.pet-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 8px;
  font-size: 11px;
}

.info-label {
  color: var(--theme-text-secondary);
  font-size: 10px;
}

.info-value {
  color: #7fffd4;
  font-weight: bold;
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
