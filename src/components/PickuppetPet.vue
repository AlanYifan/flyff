/**
 * @file PickuppetPet.vue
 * @description 捡东西宠物动画组件
 * 业务意图：在页面上可视化捡宠的存在和行为
 * - 捡宠激活时，在玩家头像区域下方100px处显示
 * - 当页面有未被拾取的掉落物时，捡宠丝滑移动到该物品上方
 * - 到达物品位置后通过 dropAnimationRefs 直接调用 triggerPetPickup，直接拾取入包，无位移动画
 * - 移动时头像模拟行走动态效果（上下弹跳+左右摇摆）
 * - 无论捡宠是否激活，玩家都可以手动点击掉落物拾取
 * - 点击捡宠图片后显示小面板，提供召回和过滤设置功能
 * @since 2026-06-22
 */
<template>
  <Teleport to="body">
    <!-- 捡宠本体 -->
    <div
      v-if="pickuppetSummonStore.isAutoLootActive"
      class="pickuppet-pet"
      :style="petStyle"
    >
      <img
        :src="pickuppetSummonStore.summonedIcon"
        :alt="pickuppetSummonStore.summonedName"
        class="pet-image"
        :class="{ 'pet-walking': isMoving }"
        draggable="false"
        @click.stop="toggleActionPanel"
      />
      <!-- 捡宠名称提示 -->
      <div class="pet-name-tag">{{ pickuppetSummonStore.summonedName }}</div>

      <!-- 点击后的小面板：紧贴捡宠图片右侧 -->
      <div
        v-if="showActionPanel"
        class="pet-action-panel"
        @click.stop
      >
        <button
          class="action-btn recall-btn"
          @click="onRecall"
        >
          召回
        </button>
        <button
          class="action-btn filter-btn"
          @click="onOpenFilter"
        >
          捡宠过滤
        </button>
      </div>
    </div>

    <!-- 拾取特效 -->
    <PickupEffect
      :x="petX + 24"
      :y="petY + 24"
      :type="pickupEffectType"
      :active="pickupEffectActive"
    />

    <!-- 捡宠过滤筛选面板 -->
    <PickuppetFilterPanel
      :visible="showFilterPanel"
      @close="showFilterPanel = false"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePickuppetSummonStore, useItemsStore } from '@/store'
import PickupEffect from '@/components/PickupEffect.vue'
import PickuppetFilterPanel from '@/components/PickuppetFilterPanel.vue'
import { getCachedPickuppetFilterSettings, shouldPickuppetPickup } from '@/composables/usePickuppetFilter'

const props = defineProps({
  /**
   * 掉落动画组件的 ref Map（key 为 animationId，value 为组件实例）
   * 通过直接调用 triggerPetPickup 避免模拟点击带来的 DOM 操作开销
   */
  dropAnimationRefs: {
    type: Object,
    default: () => ({})
  },
  /**
   * 休息位置模式：
   * - 'default'：头像下方100px（主页面使用）
   * - 'above-left'：头像上方20px左侧（副本页面使用，与培育型宠物左右并列）
   */
  positionMode: {
    type: String,
    default: 'default'
  }
})

const pickuppetSummonStore = usePickuppetSummonStore()
const itemsStore = useItemsStore()

/** 宠物当前位置 */
const petX = ref(0)
const petY = ref(0)

/** 宠物目标位置 */
const targetX = ref(0)
const targetY = ref(0)

/** 宠物是否正在移动 */
const isMoving = ref(false)

/** 动画帧 ID */
let animationFrameId = null

/** 移动速度（像素/帧，60fps 下约 200px/s） */
const MOVE_SPEED = 3.5

/** 休息位置更新定时器 */
let restPositionTimer = null

/** 到达阈值（像素），距离目标小于此值视为到达 */
const ARRIVAL_THRESHOLD = 8

/** 拾取特效激活状态 */
const pickupEffectActive = ref(false)

/** 拾取特效类型（gold=金币, item=物品） */
const pickupEffectType = ref('gold')

/** 拾取特效触发计数器，用于每次拾取递增以触发watch */
let effectTriggerCounter = 0
const effectTrigger = ref(0)

/** 当前目标掉落物的动画ID */
let targetAnimationId = null

/** 是否显示操作小面板 */
const showActionPanel = ref(false)

/** 是否显示捡宠过滤筛选面板 */
const showFilterPanel = ref(false)

/**
 * 切换操作小面板的显示/隐藏
 */
const toggleActionPanel = () => {
  showActionPanel.value = !showActionPanel.value
}

/**
 * 召回捡宠
 */
const onRecall = () => {
  try {
    pickuppetSummonStore.recall()
    showActionPanel.value = false
  } catch (error) {
    console.error('[PickuppetPet] 召回捡宠失败:', error)
  }
}

/**
 * 打开捡宠过滤筛选面板
 */
const onOpenFilter = () => {
  showFilterPanel.value = true
  showActionPanel.value = false
}

/**
 * 点击外部区域关闭操作面板
 */
const onDocumentClick = () => {
  if (showActionPanel.value) {
    showActionPanel.value = false
  }
}

/**
 * 获取捡宠的休息位置
 * - positionMode='default'：头像下方100px居中（主页面）
 * - positionMode='above-left'：头像上方20px左侧（副本页面，不超出头像宽度）
 * @returns {{ x: number, y: number }} 休息位置坐标
 */
const getRestPosition = () => {
  try {
    const avatarEl = document.getElementById('playerAvatar')
    if (avatarEl) {
      const rect = avatarEl.getBoundingClientRect()
      const petWidth = 48

      if (props.positionMode === 'above-left') {
        // 副本模式：头像上方20px，左侧（不超出头像宽度）
        // 宠物右边缘对齐头像中线，左边缘不超出头像左边缘
        const x = rect.left + Math.max(0, rect.width / 2 - petWidth)
        const y = rect.top - 20 - petWidth
        return { x, y }
      }

      // 默认模式：水平居中于头像，垂直方向在头像底部下方100px
      return {
        x: rect.left + rect.width / 2 - petWidth / 2,
        y: rect.bottom + 100
      }
    }
  } catch (error) {
    console.error('[PickuppetPet] 获取休息位置失败:', error)
  }
  // 默认位置
  return { x: 150, y: 200 }
}

/**
 * 寻找最近的一个未被拾取且符合过滤条件的掉落物
 * 优先查找 idle 阶段的掉落物，其次 scatter 阶段
 * 通过 dropAnimationRefs 直接查询组件实例状态，避免 DOM 操作
 * 根据捡宠过滤配置，跳过不符合条件的物品掉落物
 * @returns {{ x: number, y: number, type: string, animationId: string } | null} 掉落物位置、类型和ID，无则返回 null
 */
const findNearestDropTarget = () => {
  try {
    const refs = props.dropAnimationRefs
    if (!refs || typeof refs !== 'object') return null

    // 加载过滤配置（带缓存，避免每500ms都读取并解析localStorage）
    const filter = getCachedPickuppetFilterSettings()

    let nearestDist = Infinity
    let nearestResult = null

    for (const [animationId, comp] of Object.entries(refs)) {
      if (!comp) continue

      // 检查组件是否处于可拾取阶段
      const phase = comp.animationPhase
      if (phase !== 'idle' && phase !== 'scatter') continue

      // 获取掉落物位置
      const pos = comp.getDropPosition
        ? comp.getDropPosition()
        : null
      if (!pos) continue

      // 应用捡宠过滤逻辑：检查掉落物是否符合过滤条件
      const dropItem = comp.$props?.item
      const goldAmount = comp.$props?.goldAmount
      // 金币始终拾取（不过滤）
      if (!goldAmount && dropItem) {
        const itemConfig = dropItem.id
          ? itemsStore.getItemConfig(Number(dropItem.id))
          : null
        if (!shouldPickuppetPickup(dropItem, itemConfig, filter)) {
          // 该物品不在捡宠拾取范围内，跳过
          continue
        }
      }

      const dist = Math.sqrt((pos.x - petX.value) ** 2 + (pos.y - petY.value) ** 2)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestResult = {
          x: pos.x - 20,
          y: pos.y - 20,
          type: goldAmount ? 'gold' : 'item',
          animationId
        }
      }
    }

    return nearestResult
  } catch (error) {
    console.error('[PickuppetPet] 查找掉落物失败:', error)
    return null
  }
}

/**
 * 触发掉落物拾取（捡宠到达目标位置后调用）
 * 通过 dropAnimationRefs 直接调用 triggerPetPickup，避免 DOM 模拟点击
 */
const triggerPickup = () => {
  try {
    if (!targetAnimationId) return

    const comp = props.dropAnimationRefs[targetAnimationId]
    if (!comp) return

    // 判断拾取类型（从DOM简单判断，仅在拾取时执行一次）
    try {
      const container = document.querySelector(`[data-animation-id="${targetAnimationId}"]`)
      if (container) {
        const content = container.querySelector('.drop-content')
        if (content) {
          pickupEffectType.value = content.querySelector('.gold-drop') ? 'gold' : 'item'
        }
      }
    } catch (e) {
      pickupEffectType.value = 'item'
    }

    // 直接调用组件方法触发拾取，无需位移动画
    if (typeof comp.triggerPetPickup === 'function') {
      comp.triggerPetPickup()
    }

    // 触发拾取特效
    firePickupEffect()

    targetAnimationId = null
  } catch (error) {
    console.error('[PickuppetPet] 触发拾取失败:', error)
  }
}

/**
 * 触发拾取特效
 * 通过递增effectTrigger计数器来激活特效
 */
const firePickupEffect = () => {
  effectTriggerCounter++
  effectTrigger.value = effectTriggerCounter
  pickupEffectActive.value = true
  // 短暂延迟后重置，以便下次拾取能再次触发
  setTimeout(() => {
    pickupEffectActive.value = false
  }, 50)
}

/**
 * 移动动画循环
 * 使用 requestAnimationFrame 实现丝滑移动
 */
const moveStep = () => {
  const dx = targetX.value - petX.value
  const dy = targetY.value - petY.value
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < ARRIVAL_THRESHOLD) {
    // 到达目标位置
    petX.value = targetX.value
    petY.value = targetY.value
    isMoving.value = false
    // 必须在到达时立即清除 animationFrameId，否则 startMoving() 会因
    // 旧 RAF ID 仍然存在而提前返回，导致捡宠永久卡在掉落物位置无法移动
    animationFrameId = null

    // 如果目标是掉落物，触发拾取
    const restPos = getRestPosition()
    const isAtRest = Math.abs(targetX.value - restPos.x) < 10 && Math.abs(targetY.value - restPos.y) < 10
    if (!isAtRest) {
      // 捕获当前目标ID，防止 updateTarget（每500ms执行）在 setTimeout 回调前
      // 修改 targetAnimationId 导致拾取错误目标或丢失拾取目标
      const pickupTargetId = targetAnimationId
      // 将拾取操作移到 setTimeout(0)，避免在 RAF 回调中执行 DOM 查询和组件方法调用
      // 导致 RAF handler 耗时超过 50ms 违规
      setTimeout(() => {
        targetAnimationId = pickupTargetId
        triggerPickup()
        // 拾取后回到休息位置
        targetX.value = restPos.x
        targetY.value = restPos.y
        startMoving()
      }, 0)
    }
    return
  }

  // 向目标移动
  const speed = Math.min(MOVE_SPEED, dist)
  const ratio = speed / dist
  petX.value += dx * ratio
  petY.value += dy * ratio

  animationFrameId = requestAnimationFrame(moveStep)
}

/**
 * 启动移动动画
 */
const startMoving = () => {
  if (animationFrameId) return
  isMoving.value = true
  animationFrameId = requestAnimationFrame(moveStep)
}

/**
 * 更新目标位置
 * 有掉落物时移向掉落物，否则回到休息位置
 */
const updateTarget = () => {
  if (!pickuppetSummonStore.isAutoLootActive) return

  const dropTarget = findNearestDropTarget()
  const restPos = getRestPosition()

  if (dropTarget) {
    targetX.value = dropTarget.x
    targetY.value = dropTarget.y
    targetAnimationId = dropTarget.animationId
  } else {
    targetX.value = restPos.x
    targetY.value = restPos.y
    targetAnimationId = null
  }

  startMoving()
}

/** 定期扫描掉落物的定时器 ID */
let scanTimer = null

/**
 * 宠物样式
 */
const petStyle = computed(() => ({
  transform: `translate(${petX.value}px, ${petY.value}px)`,
  transition: isMoving.value ? 'none' : 'transform 0.3s ease-out'
}))

/**
 * 初始化宠物位置到休息位置
 */
const initPosition = () => {
  const restPos = getRestPosition()
  petX.value = restPos.x
  petY.value = restPos.y
  targetX.value = restPos.x
  targetY.value = restPos.y
}

// 监听捡宠激活状态变化
watch(
  () => pickuppetSummonStore.isAutoLootActive,
  (active) => {
    if (active) {
      nextTick(() => {
        initPosition()
        // 开始扫描掉落物
        scanTimer = setInterval(updateTarget, 500)
      })
    } else {
      // 停止扫描
      if (scanTimer) {
        clearInterval(scanTimer)
        scanTimer = null
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
      isMoving.value = false
      // 捡宠不再激活时关闭面板
      showActionPanel.value = false
      showFilterPanel.value = false
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (pickuppetSummonStore.isAutoLootActive) {
    initPosition()
    scanTimer = setInterval(updateTarget, 500)
  }
  // 定期更新休息位置（应对窗口大小变化等）
  restPositionTimer = setInterval(() => {
    if (!isMoving.value && pickuppetSummonStore.isAutoLootActive) {
      const restPos = getRestPosition()
      // 如果当前在休息位置附近，更新到新休息位置
      const dist = Math.sqrt((petX.value - restPos.x) ** 2 + (petY.value - restPos.y) ** 2)
      if (dist < 20) {
        petX.value = restPos.x
        petY.value = restPos.y
        targetX.value = restPos.x
        targetY.value = restPos.y
      }
    }
  }, 2000)
  // 监听全局点击事件，关闭操作面板
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  if (scanTimer) {
    clearInterval(scanTimer)
    scanTimer = null
  }
  if (restPositionTimer) {
    clearInterval(restPositionTimer)
    restPositionTimer = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  document.removeEventListener('click', onDocumentClick)
})
</script>

<style scoped>
.pickuppet-pet {
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
  /* 静止时浮动呼吸动画 */
  animation: petBob 2s ease-in-out infinite;
  cursor: pointer;
  pointer-events: auto;
}

/* 行走状态：模拟行走动态效果（上下弹跳+轻微左右摇摆） */
.pet-image.pet-walking {
  animation: petWalk 0.35s ease-in-out infinite;
}

.pet-name-tag {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #ffd700;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  font-weight: bold;
}

/* 操作小面板：紧贴捡宠图片右侧 */
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

.filter-btn {
  background: rgba(52, 152, 219, 0.12);
  color: var(--theme-accent);
  border: 1px solid var(--theme-border-strong);
}

.filter-btn:hover {
  background: rgba(52, 152, 219, 0.3);
  color: #3498db;
}

/* 静止时浮动呼吸动画 */
@keyframes petBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* 行走动态效果：上下弹跳+轻微左右摇摆，模拟卡通行走 */
@keyframes petWalk {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  15% {
    transform: translateY(-6px) rotate(-5deg);
  }
  30% {
    transform: translateY(0) rotate(0deg);
  }
  45% {
    transform: translateY(-6px) rotate(5deg);
  }
  60% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(-3px) rotate(-3deg);
  }
  90% {
    transform: translateY(0) rotate(0deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pet-image,
  .pet-image.pet-walking {
    animation: none;
  }
}
</style>
