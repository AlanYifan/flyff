/**
 * @file DropAnimation.vue
 * @description 掉落物动画组件：展示金币/物品从怪物位置弹起、散开的动画效果。
 * 动画阶段：rise（向上弹出）→ scatter（散开降落）→ idle（停留等待拾取）。
 * 拾取方式：玩家手动点击或捡宠自动拾取，拾取后直接入包，无位移动画，避免阻塞主线程。
 * 超时销毁：根据物品稀有度分级设定超时时间——普通/罕见3分钟，稀有5分钟，传说10分钟，史诗30分钟。
 * @since 2026-06-22
 */
<template>
  <div class="drop-animation-container" :style="containerStyle" :data-animation-id="id">
    <!-- 实际的金币或物品显示 -->
    <div
      class="drop-content"
      :class="{
        'rise-phase': animationPhase === 'rise',
        'scatter-phase': animationPhase === 'scatter',
        'idle-phase': animationPhase === 'idle',
        'no-pulse': isLowRarity
      }"
      :style="animationStyle"
      @click="handleClickPickup"
    >
      <!-- 金币掉落 -->
      <div v-if="goldAmount > 0" class="gold-drop">
        <img :src="goldImageUrl" alt="金币" class="gold-image" />
        <div class="gold-text">+{{ goldAmount }}</div>
      </div>

      <!-- 物品掉落 -->
      <div v-else-if="item" class="item-drop">
        <img v-if="showItemImage" :src="itemImageUrl" :alt="itemName" class="item-image" />
        <div class="item-text">
          {{ itemName }}<span v-if="itemQuantity > 1"> x{{ itemQuantity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import imagePreloader from '@/utils/ImagePreloader'

/** 默认超时销毁时间（毫秒），3分钟，用于金币/普通/罕见品级物品 */
const DEFAULT_EXPIRE_TIMEOUT_MS = 3 * 60 * 1000

/**
 * 按稀有度分级的掉落物超时销毁时间映射表（毫秒）
 * 普通(common)/罕见(uncommon) → 3分钟
 * 稀有(rare) → 5分钟
 * 传说(veryrare/legendary) → 10分钟
 * 史诗(unique/epic)/终极(ultimate)/神话(mythic) → 30分钟
 * @type {Readonly<Record<string, number>>}
 */
const RARITY_EXPIRE_TIMEOUT_MS = Object.freeze({
  common: 3 * 60 * 1000,
  uncommon: 3 * 60 * 1000,
  rare: 5 * 60 * 1000,
  veryrare: 10 * 60 * 1000,
  legendary: 10 * 60 * 1000,
  unique: 30 * 60 * 1000,
  epic: 30 * 60 * 1000,
  ultimate: 30 * 60 * 1000,
  mythic: 30 * 60 * 1000
})

/**
 * 中文稀有度标签到英文键名的映射，兼容中文 rarity 值
 * @type {Readonly<Record<string, string>>}
 */
const RARITY_LABEL_TO_KEY = Object.freeze({
  普通: 'common',
  罕见: 'uncommon',
  非常稀有: 'uncommon',
  稀有: 'rare',
  传说: 'veryrare',
  史诗: 'unique',
  终极: 'ultimate',
  神话: 'mythic'
})

// 定义组件的 props
const props = defineProps({
  id: {
    type: [String, Number],
    default: null
  },
  monster: {
    type: Object,
    required: false,
    default: () => ({})
  },
  item: {
    type: Object,
    default: null
  },
  goldAmount: {
    type: Number,
    default: 0
  },
  fastMode: {
    type: Boolean,
    default: false
  },
  /** 是否自动拾取（捡宠激活时为true，否则为false） */
  autoLoot: {
    type: Boolean,
    default: true
  }
})

// 定义组件的事件
const emit = defineEmits(['animation-complete', 'manual-pickup', 'pet-pickup'])

// 动画状态
const isVisible = ref(true)
const animationPhase = ref('rise') // 三个阶段：rise（向上）、scatter（散开降落）、idle（停留等待拾取）
const animationTimeoutIds = []

/** 超时销毁定时器ID */
let expireTimerId = null

// 预计算的动画参数（避免每帧重复计算）
const animationParams = ref({
  horizontalOffset: 0,
  verticalOffset: 0,
  riseDurationMs: 300,
  scatterDurationMs: 1000
})

/**
 * 根据物品稀有度计算超时销毁时间
 * 金币掉落或无法识别稀有度的物品使用默认3分钟超时
 * @returns {number} 超时时间（毫秒）
 */
const expireTimeoutMs = computed(() => {
  // 金币掉落使用默认超时
  if (props.goldAmount > 0) {
    return DEFAULT_EXPIRE_TIMEOUT_MS
  }
  if (!props.item) {
    return DEFAULT_EXPIRE_TIMEOUT_MS
  }

  // 兼容多种稀有度字段名
  const rawRarity =
    props.item?.rarity ??
    props.item?.rarityName ??
    props.item?.quality ??
    props.item?.grade ??
    props.item?.rank ??
    props.item?.levelName ??
    ''

  if (typeof rawRarity !== 'string') {
    return DEFAULT_EXPIRE_TIMEOUT_MS
  }

  const trimmed = rawRarity.trim()
  if (!trimmed) {
    return DEFAULT_EXPIRE_TIMEOUT_MS
  }

  // 优先匹配中文标签
  if (RARITY_LABEL_TO_KEY[trimmed]) {
    const key = RARITY_LABEL_TO_KEY[trimmed]
    return RARITY_EXPIRE_TIMEOUT_MS[key] ?? DEFAULT_EXPIRE_TIMEOUT_MS
  }

  // 匹配英文键名（忽略大小写）
  const lower = trimmed.toLowerCase()
  return RARITY_EXPIRE_TIMEOUT_MS[lower] ?? DEFAULT_EXPIRE_TIMEOUT_MS
})

/**
 * 判断物品是否为低品级（普通/罕见），低品级物品不显示 idle 脉冲闪烁动画
 * 金币掉落也视为低品级
 * @returns {boolean} true 表示为普通/罕见品级
 */
const isLowRarity = computed(() => {
  // 金币掉落视为低品级
  if (props.goldAmount > 0) {
    return true
  }
  if (!props.item) {
    return true
  }

  const rawRarity =
    props.item?.rarity ??
    props.item?.rarityName ??
    props.item?.quality ??
    props.item?.grade ??
    props.item?.rank ??
    props.item?.levelName ??
    ''

  if (typeof rawRarity !== 'string') {
    return true
  }

  const trimmed = rawRarity.trim()
  if (!trimmed) {
    return true
  }

  // 匹配中文标签
  if (RARITY_LABEL_TO_KEY[trimmed]) {
    const key = RARITY_LABEL_TO_KEY[trimmed]
    return key === 'common' || key === 'uncommon'
  }

  // 匹配英文键名
  const lower = trimmed.toLowerCase()
  return lower === 'common' || lower === 'uncommon'
})

// 图片URL（使用预加载器）
const goldImageUrl = '/pt/UI/gold.png'
const itemImageRarityKeys = new Set(['rare', 'veryrare', 'legendary', 'unique', 'epic', 'ultimate'])
const itemImageRarityLabels = new Set(['稀有', '非常稀有', '传说', '史诗', '终极'])
const showItemImage = computed(() => {
  const item = props.item
  if (!item || !item.id) {
    return false
  }

  const rawRarity =
    item?.rarity ?? item?.rarityName ?? item?.quality ?? item?.grade ?? item?.rank ?? item?.levelName ?? ''

  if (typeof rawRarity !== 'string') {
    return false
  }

  const trimmed = rawRarity.trim()
  if (!trimmed) {
    return false
  }

  if (itemImageRarityLabels.has(trimmed)) {
    return true
  }

  return itemImageRarityKeys.has(trimmed.toLowerCase())
})

const itemImageUrl = computed(() => {
  if (props.item && props.item.id) {
    return `/pt/item_icon/${props.item.id}.png`
  }
  return ''
})

const itemName = computed(() => {
  if (props.item) {
    if (props.item.name) {
      if (typeof props.item.name === 'object' && props.item.name.cns) {
        return props.item.name.cns
      } else if (typeof props.item.name === 'string') {
        return props.item.name
      }
    }
    if (props.item.id) {
      return `物品#${props.item.id}`
    }
  }
  return '物品'
})

const itemQuantity = computed(() => {
  const raw =
    props.item?.currentStack ??
    props.item?.quantity ??
    props.item?.stack ??
    props.item?.count ??
    props.item?.amount ??
    1
  const resolved = Number(raw)
  if (!Number.isFinite(resolved) || resolved <= 0) {
    return 1
  }
  return Math.floor(resolved)
})

// 坐标计算属性
const monsterX = computed(() => {
  return props.monster?.monsterX ?? props.monster?.x
})

const monsterY = computed(() => {
  return props.monster?.monsterY ?? props.monster?.y
})

// 容器样式
const containerStyle = computed(() => {
  const x = monsterX.value
  const y = monsterY.value

  if (!props.monster || x === undefined || y === undefined) {
    return {
      position: 'fixed',
      left: '100px',
      top: '100px',
      zIndex: 999,
      pointerEvents: 'none'
    }
  }

  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 999,
    pointerEvents: 'none'
  }
})

// 动画样式（使用CSS变量传递参数，减少JavaScript计算）
const animationStyle = computed(() => {
  const params = animationParams.value

  return {
    '--horizontal-offset': `${params.horizontalOffset}px`,
    '--vertical-offset': `${params.verticalOffset}px`,
    '--monster-x': `${monsterX.value}px`,
    '--monster-y': `${monsterY.value}px`,
    '--rise-duration': `${params.riseDurationMs}ms`,
    '--scatter-duration': `${params.scatterDurationMs}ms`,
    opacity: isVisible.value ? 1 : 0
  }
})

/**
 * 计算并设置动画参数（散开方向、距离、时长）
 * @param {number} seed - 随机种子，用于确定散开方向
 */
const computeAnimationParams = (seed) => {
  const isGold = props.goldAmount > 0
  const isFastMode = props.fastMode === true

  // 获取怪物边框大小
  const monsterWidth = props.monster?.width || 80
  const monsterHeight = props.monster?.height || 80

  // 计算散开距离（限制在怪物边框内）
  const maxDistance = Math.min(monsterWidth, monsterHeight) / 2 - 10
  const distance = Math.min(isGold ? 100 : 80, maxDistance)

  // 计算散开方向（8个方向）
  const directionIndex = seed % 8

  // 八个方向的角度（弧度）
  const directions = [
    { x: 0, y: -1 }, // 上
    { x: 0, y: 1 }, // 下
    { x: -1, y: 0 }, // 左
    { x: 1, y: 0 }, // 右
    { x: -0.707, y: -0.707 }, // 左上
    { x: 0.707, y: -0.707 }, // 右上
    { x: -0.707, y: 0.707 }, // 左下
    { x: 0.707, y: 0.707 } // 右下
  ]

  const direction = directions[directionIndex]
  animationParams.value.horizontalOffset = direction.x * distance
  animationParams.value.verticalOffset = direction.y * distance

  if (isFastMode) {
    animationParams.value.riseDurationMs = 200
    animationParams.value.scatterDurationMs = 600
  } else {
    animationParams.value.riseDurationMs = 300
    animationParams.value.scatterDurationMs = 1000
  }
}

// 开始动画（rise → scatter → idle）
const startAnimation = () => {
  // 预加载图片
  const preloadPromises = []

  if (props.goldAmount > 0) {
    preloadPromises.push(imagePreloader.preloadImage(goldImageUrl))
  } else if (showItemImage.value && props.item && props.item.id) {
    preloadPromises.push(imagePreloader.preloadImage(itemImageUrl.value))
  }

  // 计算种子
  const seed = props.id
    .toString()
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  // 等待图片预加载完成后再开始动画
  Promise.all(preloadPromises)
    .then(() => {
      computeAnimationParams(seed)
      schedulePhaseTransitions()
    })
    .catch(err => {
      console.error('图片预加载失败，但继续播放动画:', err)
      // 即使预加载失败，也继续播放动画
      computeAnimationParams(seed)
      schedulePhaseTransitions()
    })
}

/**
 * 安排动画阶段切换的定时器（rise → scatter → idle）
 */
const schedulePhaseTransitions = () => {
  const riseDuration = animationParams.value.riseDurationMs
  const scatterDuration = animationParams.value.scatterDurationMs

  animationPhase.value = 'rise'
  animationTimeoutIds.push(
    setTimeout(() => {
      try {
        if (animationPhase.value !== 'scatter') {
          animationPhase.value = 'scatter'
        }
      } catch (error) {
        console.error('[DropAnimation] scatter 阶段切换失败:', error)
      }
    }, riseDuration)
  )
  // scatter 结束后进入 idle 阶段，等待捡宠自动拾取或玩家手动点击拾取
  animationTimeoutIds.push(
    setTimeout(() => {
      try {
        animationPhase.value = 'idle'
      } catch (error) {
        console.error('[DropAnimation] idle 阶段切换失败:', error)
      }
    }, riseDuration + scatterDuration)
  )
}

/**
 * 启动超时销毁定时器
 * 根据物品稀有度使用不同的超时时间：普通/罕见3分钟，稀有5分钟，传说10分钟，史诗30分钟
 */
const startExpireTimer = () => {
  expireTimerId = setTimeout(() => {
    try {
      // 仅在未被拾取的状态下才触发超时销毁
      if (animationPhase.value !== 'picked') {
        animationPhase.value = 'expired'
        isVisible.value = false
        emit('animation-complete', props.id)
      }
    } catch (error) {
      console.error('[DropAnimation] 超时销毁失败:', error)
    }
  }, expireTimeoutMs.value)
}

/**
 * 手动点击拾取掉落物
 * 无论捡宠是否激活，玩家都可以手动点击掉落物拾取
 * 拾取后直接完成，无位移动画
 */
const handleClickPickup = () => {
  // idle 或 scatter 阶段可点击拾取
  if (animationPhase.value !== 'idle' && animationPhase.value !== 'scatter') {
    return
  }

  // 标记已拾取，直接触发完成
  animationPhase.value = 'picked'
  isVisible.value = false
  emit('manual-pickup', props.id)
  emit('animation-complete', props.id)
}

/**
 * 获取掉落物在页面上的绝对位置（供捡宠移动目标使用）
 * @returns {{ x: number, y: number }} 掉落物中心位置
 */
const getDropPosition = () => {
  const x = (monsterX.value || 0) + animationParams.value.horizontalOffset
  const y = (monsterY.value || 0) + animationParams.value.verticalOffset
  return { x, y }
}

/**
 * 捡宠自动拾取：由捡宠组件调用，拾取后直接完成，无位移动画
 */
const triggerPetPickup = () => {
  // idle 或 scatter 阶段才可被捡宠拾取
  if (animationPhase.value !== 'idle' && animationPhase.value !== 'scatter') {
    return
  }

  // 标记已拾取，直接触发完成
  animationPhase.value = 'picked'
  isVisible.value = false
  emit('pet-pickup', props.id)
  emit('animation-complete', props.id)
}

/** 暴露给父组件调用的方法 */
defineExpose({
  /** 获取掉落物位置 */
  getDropPosition,
  /** 捡宠自动拾取 */
  triggerPetPickup,
  /** 当前动画阶段 */
  animationPhase
})

// 组件挂载时开始动画
onMounted(() => {
  setTimeout(() => {
    startAnimation()
  }, 50)
  // 启动超时销毁定时器
  startExpireTimer()
})

// 组件卸载时清理
onUnmounted(() => {
  if (animationTimeoutIds.length > 0) {
    for (let i = 0; i < animationTimeoutIds.length; i++) {
      clearTimeout(animationTimeoutIds[i])
    }
    animationTimeoutIds.length = 0
  }
  // 清理超时销毁定时器
  if (expireTimerId) {
    clearTimeout(expireTimerId)
    expireTimerId = null
  }
})
</script>

<style scoped>
  /* idle 阶段：停留在场景中等待手动点击拾取 */
  .drop-content.idle-phase {
    transform: translate(var(--horizontal-offset), var(--vertical-offset)) scale(1);
    cursor: pointer;
    pointer-events: auto;
    animation: idlePulse 1.5s ease-in-out infinite;
  }

  /* 普通/罕见品级物品移除描边闪烁动画，仅保持静态显示 */
  .drop-content.idle-phase.no-pulse {
    animation: none;
  }

  /* scatter 阶段也支持手动点击拾取 */
  .drop-content.scatter-phase {
    cursor: pointer;
    pointer-events: auto;
  }

  @keyframes idlePulse {
    0%, 100% {
      filter: brightness(1) drop-shadow(0 0 4px rgba(255, 215, 0, 0.4));
    }
    50% {
      filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 215, 0, 0.8));
    }
  }

  .drop-animation-container {
    position: fixed;
    z-index: 999;
    pointer-events: none;
    will-change: transform;
  }

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0;
    padding: 0;
    will-change: transform;
  }

  /* 第一阶段：向上移动 */
  .drop-content.rise-phase {
    animation: riseAnimation var(--rise-duration, 0.3s) ease-out forwards;
  }

  @keyframes riseAnimation {
    0% {
      transform: translate(0, 0);
    }

    100% {
      transform: translate(0, -80px);
    }
  }

  /* 第二阶段：向四周平行移动缓慢降落 */
  .drop-content.scatter-phase {
    animation: scatterAnimation var(--scatter-duration, 1s) cubic-bezier(0.25, 0.46, 0.45, 0.94)
      forwards;
  }

  @keyframes scatterAnimation {
    0% {
      transform: translate(0, -80px) scale(1.1);
    }

    100% {
      transform: translate(var(--horizontal-offset), var(--vertical-offset)) scale(1);
    }
  }

  .gold-drop,
  .item-drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .gold-image {
    width: 20px;
    height: 20px;
    object-fit: contain;
    filter: drop-shadow(0 0 5px gold);
    margin-bottom: 8px;
    flex-shrink: 0;
    will-change: transform;
  }

  .item-image {
    width: 20px;
    height: 20px;
    object-fit: contain;
    filter: drop-shadow(0 0 5px #00ff00);
    margin-bottom: 8px;
    flex-shrink: 0;
    will-change: transform;
  }

  .gold-text {
    color: #ffd700;
    font-weight: bold;
    font-size: 10px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.5);
    padding: 4px;
    border-radius: 6px;
    min-width: 20px;
    text-align: center;
    box-sizing: border-box;
  }

  .item-text {
    color: #ffffff;
    font-weight: bold;
    font-size: 10px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.5);
    padding: 4px;
    border-radius: 6px;
    max-width: 120px;
    min-width: 20px;
    text-align: center;
    word-break: break-word;
    box-sizing: border-box;
  }
</style>
