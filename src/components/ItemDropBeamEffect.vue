/**
 * @file ItemDropBeamEffect.vue
 * @description 物品掉落光柱特效组件（暗黑破坏神3风格）
 * 当击杀怪物掉落稀有/传说/史诗品级物品时，在怪物位置显示高耸入云的光柱动画。
 *
 * 暗黑破坏神3光柱核心特征还原：
 * 1. 光柱极高（贯穿屏幕大部分高度），极细收束，中心近白色高亮
 * 2. 地面有小而亮的冲击光池 + 扩散圆环
 * 3. 光柱出现时从地面快速"射出"向上（scaleY 0→1）
 * 4. 能量沿光柱持续向上流动（光带滚动）
 * 5. 少量光点粒子沿柱体上升
 * 6. 光柱顶部逐渐收束消失，不做爆裂
 * 7. 持续微闪烁，能量涌动感
 * 8. 光柱持续显示直到物品被拾取，由父组件调用 destroyBeam() 销毁
 *
 * GPU 加速：translate3d / scale3d / will-change / opacity 动画
 * @since 2026-06-30
 */
<template>
  <div class="beam-root" :style="rootStyle" :data-beam-id="id">
    <!-- 地面冲击波圆环（出现瞬间扩散） -->
    <div class="beam-shockwave" :style="shockwaveStyle"></div>

    <!-- 地面光池（底部小而亮的圆形辉光） -->
    <div class="beam-ground-pool" :style="groundPoolStyle"></div>

    <!-- 光柱外层光晕（宽模糊扩散） -->
    <div class="beam-outer-glow" :style="outerGlowStyle"></div>

    <!-- 光柱主体（品级颜色渐变光束） -->
    <div class="beam-body" :style="bodyStyle"></div>

    <!-- 能量流动光带（沿光柱向上流动） -->
    <div class="beam-energy-flow" :style="energyFlowStyle"></div>

    <!-- 光柱核心（极细近白色高亮中轴线） -->
    <div class="beam-core" :style="coreStyle"></div>

    <!-- 上升粒子（沿光柱飘升的光点） -->
    <span
      v-for="p in particles"
      :key="p.key"
      class="beam-spark"
      :style="sparkStyle(p)"
    ></span>

    <!-- 地面尘雾（底部小范围飘散） -->
    <div class="beam-dust" :style="dustStyle"></div>
  </div>
</template>

<script setup>
/**
 * 物品掉落光柱特效组件
 * 根据物品品级（rank/rarity）显示对应颜色的暗黑破坏神3风格光柱
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 品级配置表：将品级键名映射为光柱颜色与强度配置
 * 颜色与 src/store/items.js 的 ITEM_RARITY_STYLE_FORMULA 保持一致
 * @type {Readonly<Record<string, {rgb: string, coreRgb: string, intensity: number}>>}
 */
const RANK_BEAM_CONFIG = Object.freeze({
  // 稀有（绿色光柱）
  rare: Object.freeze({ rgb: '81, 209, 77', coreRgb: '180, 255, 180', intensity: 1 }),
  // 传说（橙色光柱）
  veryrare: Object.freeze({ rgb: '255, 136, 0', coreRgb: '255, 220, 150', intensity: 1.15 }),
  legendary: Object.freeze({ rgb: '255, 136, 0', coreRgb: '255, 220, 150', intensity: 1.15 }),
  // 史诗（红色光柱）
  unique: Object.freeze({ rgb: '255, 0, 13', coreRgb: '255, 180, 180', intensity: 1.3 }),
  epic: Object.freeze({ rgb: '255, 0, 13', coreRgb: '255, 180, 180', intensity: 1.3 })
})

/**
 * 中文品级标签到品级键名的映射，兼容中文 rank 值
 * @type {Readonly<Record<string, string>>}
 */
const RANK_LABEL_TO_KEY = Object.freeze({
  稀有: 'rare',
  传说: 'veryrare',
  史诗: 'unique'
})

/** 上升粒子数量 */
const SPARK_COUNT = 8

// 组件 props
const props = defineProps({
  /** 光柱唯一标识，用于销毁回调 */
  id: {
    type: [String, Number],
    default: null
  },
  /** 光柱基点屏幕坐标（掉落物品图片顶部居中外侧） */
  position: {
    type: Object,
    required: true,
    validator: val => val && typeof val.x === 'number' && typeof val.y === 'number'
  },
  /** 物品品级键名或中文标签 */
  rank: {
    type: String,
    default: ''
  }
})

// 组件事件
const emit = defineEmits(['beam-complete'])

/** 是否可见（控制淡出） */
const isVisible = ref(true)

/** 销毁流程中的回调定时器 */
let destroyTimerId = null

/** 是否已启动销毁流程，防止重复调用 */
let isDestroying = false

/**
 * 解析品级配置
 * 优先按英文键名匹配，其次按中文标签匹配
 * @returns {Object|null} 品级配置对象，无法识别时返回 null
 */
const beamConfig = computed(() => {
  const raw = typeof props.rank === 'string' ? props.rank.trim() : ''
  if (!raw) {
    return null
  }
  if (RANK_LABEL_TO_KEY[raw]) {
    return RANK_BEAM_CONFIG[RANK_LABEL_TO_KEY[raw]]
  }
  const lower = raw.toLowerCase()
  return RANK_BEAM_CONFIG[lower] || null
})

/** 粒子数据列表（预生成随机参数，避免每帧计算） */
const particles = ref([])

/**
 * 初始化粒子数据
 */
const initParticles = () => {
  const list = []
  for (let i = 0; i < SPARK_COUNT; i += 1) {
    list.push({
      key: `spark-${i}`,
      offsetX: (Math.random() - 0.5) * 16,
      delay: Math.random() * 2,
      duration: 1.8 + Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      riseHeight: 400 + Math.random() * 300
    })
  }
  particles.value = list
}

/**
 * 根容器样式：定位到掉落物品图片顶部居中外侧，GPU 提升合成层
 * position 由父组件计算为物品图片顶部中心点，子元素从该锚点向上延伸发光
 */
const rootStyle = computed(() => ({
  position: 'fixed',
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
  zIndex: 998,
  pointerEvents: 'none',
  opacity: isVisible.value ? 1 : 0,
  transform: 'translate3d(-50%, -50%, 0)',
  willChange: 'opacity',
  transition: 'opacity 0.5s ease-out'
}))

/**
 * 地面冲击波样式：出现瞬间从中心扩散的圆环
 */
const shockwaveStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    boxShadow: `0 0 0 2px rgba(${cfg.rgb}, 0.8), 0 0 20px 4px rgba(${cfg.rgb}, 0.4)`
  }
})

/**
 * 地面光池样式：底部小而亮的圆形辉光
 */
const groundPoolStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(${cfg.rgb}, 0.85) 25%, rgba(${cfg.rgb}, 0.4) 55%, rgba(${cfg.rgb}, 0) 75%)`,
    filter: `brightness(${cfg.intensity})`
  }
})

/**
 * 光柱外层光晕样式：宽模糊扩散光晕
 */
const outerGlowStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `linear-gradient(to top, rgba(${cfg.rgb}, 0.55) 0%, rgba(${cfg.rgb}, 0.3) 40%, rgba(${cfg.rgb}, 0.08) 80%, rgba(${cfg.rgb}, 0) 100%)`,
    filter: `blur(8px) brightness(${cfg.intensity})`
  }
})

/**
 * 光柱主体样式：品级颜色渐变光束
 */
const bodyStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `linear-gradient(to top, rgba(${cfg.rgb}, 0.9) 0%, rgba(${cfg.rgb}, 0.7) 35%, rgba(${cfg.rgb}, 0.3) 75%, rgba(${cfg.rgb}, 0) 100%)`,
    filter: `brightness(${cfg.intensity})`
  }
})

/**
 * 能量流动光带样式：沿光柱向上滚动的亮带
 */
const energyFlowStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `repeating-linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 35%, rgba(${cfg.coreRgb}, 0.6) 42%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)`,
    backgroundSize: '100% 200px'
  }
})

/**
 * 光柱核心样式：极细近白色高亮中轴线
 */
const coreStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(${cfg.coreRgb}, 0.95) 30%, rgba(${cfg.rgb}, 0.5) 80%, rgba(${cfg.rgb}, 0) 100%)`,
    boxShadow: `0 0 6px 1px rgba(${cfg.rgb}, 0.8), 0 0 12px 2px rgba(${cfg.rgb}, 0.4)`
  }
})

/**
 * 地面尘雾样式
 */
const dustStyle = computed(() => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    background: `radial-gradient(ellipse, rgba(${cfg.rgb}, 0.3) 0%, rgba(${cfg.rgb}, 0) 70%)`
  }
})

/**
 * 单个粒子的内联样式
 * @param {Object} p - 粒子数据
 * @returns {Object} 样式对象
 */
const sparkStyle = p => {
  const cfg = beamConfig.value
  if (!cfg) return { display: 'none' }
  return {
    left: `${p.offsetX}px`,
    width: `${p.size}px`,
    height: `${p.size}px`,
    background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(${cfg.coreRgb}, 0.7) 50%, rgba(${cfg.rgb}, 0) 100%)`,
    boxShadow: `0 0 4px rgba(${cfg.rgb}, 0.6)`,
    animationDelay: `${p.delay}s`,
    animationDuration: `${p.duration}s`,
    '--spark-rise': `${p.riseHeight}px`
  }
}

/**
 * 启动销毁流程：先淡出再通知父组件移除
 * 由父组件在物品被拾取时调用，光柱不会自动消失
 */
const destroyBeam = () => {
  // 防止重复调用
  if (isDestroying) {
    return
  }
  isDestroying = true
  isVisible.value = false
  destroyTimerId = setTimeout(() => {
    try {
      emit('beam-complete', props.id)
    } catch (error) {
      console.error('[ItemDropBeamEffect] 销毁回调失败:', error)
    }
  }, 500)
}

/** 暴露给父组件的方法 */
defineExpose({
  /** 销毁光柱（物品被拾取时调用） */
  destroyBeam
})

// 组件挂载：初始化粒子
onMounted(() => {
  initParticles()
})

// 组件卸载：清理定时器
onUnmounted(() => {
  if (destroyTimerId) {
    clearTimeout(destroyTimerId)
    destroyTimerId = null
  }
})
</script>

<style scoped>
  /* 根容器：子元素以容器中心为锚点向上延伸 */
  .beam-root {
    width: 0;
    height: 0;
  }

  /*
   * 地面冲击波：出现瞬间从中心向外扩散的圆环
   * D3 中物品掉落瞬间地面有一圈快速扩散的光环
   */
  .beam-shockwave {
    position: absolute;
    top: 0;
    left: 0;
    width: 100px;
    height: 100px;
    transform: translate3d(-50%, -50%, 0) scale3d(0, 0, 1);
    border-radius: 50%;
    will-change: transform, opacity;
    animation: shockwaveExpand 0.6s ease-out forwards;
  }

  @keyframes shockwaveExpand {
    0% {
      transform: translate3d(-50%, -50%, 0) scale3d(0, 0, 1);
      opacity: 1;
    }
    100% {
      transform: translate3d(-50%, -50%, 0) scale3d(2.5, 2.5, 1);
      opacity: 0;
    }
  }

  /*
   * 地面光池：底部小而亮的圆形辉光
   * D3 中光柱底部有一个明亮的发光圆池
   */
  .beam-ground-pool {
    position: absolute;
    top: 0;
    left: 0;
    width: 90px;
    height: 50px;
    transform: translate3d(-50%, -40%, 0);
    border-radius: 50%;
    will-change: transform, opacity;
    animation: poolPulse 1.4s ease-in-out infinite, poolFadeIn 0.3s ease-out forwards;
  }

  @keyframes poolFadeIn {
    0% {
      opacity: 0;
      transform: translate3d(-50%, -40%, 0) scale3d(0.3, 0.3, 1);
    }
    100% {
      opacity: 1;
      transform: translate3d(-50%, -40%, 0) scale3d(1, 1, 1);
    }
  }

  @keyframes poolPulse {
    0%,
    100% {
      transform: translate3d(-50%, -40%, 0) scale3d(1, 1, 1);
    }
    50% {
      transform: translate3d(-50%, -40%, 0) scale3d(1.15, 1.15, 1);
    }
  }

  /*
   * 光柱外层光晕：宽模糊扩散光晕
   * 包裹在光柱主体外围，营造光柱辐射感
   */
  .beam-outer-glow {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    /* 高度贯穿屏幕大部分，D3 光柱极高 */
    height: 70vh;
    max-height: 600px;
    transform: translate3d(-50%, 0, 0);
    transform-origin: bottom center;
    border-radius: 50% 50% 0 0 / 20% 20% 0 0;
    will-change: transform, opacity;
    /* 出现时从地面快速射出 */
    animation: beamShoot 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards,
      beamGlowFlicker 0.6s ease-in-out 0.35s infinite alternate;
  }

  @keyframes beamShoot {
    0% {
      transform: translate3d(-50%, 0, 0) scale3d(1, 0, 1);
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
    100% {
      transform: translate3d(-50%, 0, 0) scale3d(1, 1, 1);
      opacity: 1;
    }
  }

  @keyframes beamGlowFlicker {
    0% {
      opacity: 0.6;
    }
    100% {
      opacity: 0.9;
    }
  }

  /*
   * 光柱主体：品级颜色渐变光束
   * D3 光柱主体：底部最亮，向上逐渐变淡，顶部收束消失
   */
  .beam-body {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 16px;
    height: 70vh;
    max-height: 600px;
    transform: translate3d(-50%, 0, 0);
    transform-origin: bottom center;
    border-radius: 50% 50% 0 0 / 8% 8% 0 0;
    will-change: transform, opacity;
    animation: beamShoot 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards,
      beamBodyFlicker 0.5s ease-in-out 0.35s infinite alternate;
  }

  @keyframes beamBodyFlicker {
    0% {
      opacity: 0.8;
      filter: brightness(1);
    }
    100% {
      opacity: 1;
      filter: brightness(1.25);
    }
  }

  /*
   * 能量流动光带：沿光柱向上滚动的亮带
   * D3 光柱内有能量持续向上流动的视觉效果
   */
  .beam-energy-flow {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 12px;
    height: 70vh;
    max-height: 600px;
    transform: translate3d(-50%, 0, 0);
    transform-origin: bottom center;
    border-radius: 50% 50% 0 0 / 8% 8% 0 0;
    will-change: background-position;
    animation: beamShoot 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards,
      energyScroll 0.8s linear 0.35s infinite;
    mix-blend-mode: screen;
  }

  /* 能量光带持续向上滚动 */
  @keyframes energyScroll {
    0% {
      background-position: 0 200px;
    }
    100% {
      background-position: 0 0;
    }
  }

  /*
   * 光柱核心：极细近白色高亮中轴线
   * D3 光柱中心是一条极亮的中轴线，近乎白色
   */
  .beam-core {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 4px;
    height: 70vh;
    max-height: 600px;
    transform: translate3d(-50%, 0, 0);
    transform-origin: bottom center;
    border-radius: 50% 50% 0 0;
    will-change: transform, opacity;
    animation: beamShoot 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards,
      coreFlicker 0.3s ease-in-out 0.3s infinite alternate;
  }

  @keyframes coreFlicker {
    0% {
      opacity: 0.85;
      transform: translate3d(-50%, 0, 0) scale3d(1, 1, 1);
    }
    100% {
      opacity: 1;
      transform: translate3d(-50%, 0, 0) scale3d(1.4, 1, 1);
    }
  }

  /*
   * 上升粒子：沿光柱飘升的光点
   * D3 光柱内有少量光点从底部向上飘升
   */
  .beam-spark {
    position: absolute;
    bottom: 0;
    left: 0;
    border-radius: 50%;
    will-change: transform, opacity;
    animation-name: sparkRise;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
  }

  /* 粒子从底部沿光柱上升，逐渐淡出 */
  @keyframes sparkRise {
    0% {
      transform: translate3d(var(--spark-offset, 0), 0, 0) scale3d(0.3, 0.3, 1);
      opacity: 0;
    }
    15% {
      opacity: 1;
      transform: translate3d(var(--spark-offset, 0), calc(var(--spark-rise) * 0.15), 0)
        scale3d(1, 1, 1);
    }
    70% {
      opacity: 0.7;
    }
    100% {
      transform: translate3d(var(--spark-offset, 0), calc(var(--spark-rise) * -1), 0)
        scale3d(0.2, 0.2, 1);
      opacity: 0;
    }
  }

  /*
   * 地面尘雾：底部小范围飘散的尘雾效果
   * D3 物品掉落时地面有轻微的尘土飘散
   */
  .beam-dust {
    position: absolute;
    top: 0;
    left: 0;
    width: 120px;
    height: 30px;
    transform: translate3d(-50%, -10%, 0);
    border-radius: 50%;
    will-change: opacity;
    animation: dustFade 1s ease-out forwards;
  }

  @keyframes dustFade {
    0% {
      opacity: 0.6;
      transform: translate3d(-50%, -10%, 0) scale3d(0.5, 0.5, 1);
    }
    100% {
      opacity: 0;
      transform: translate3d(-50%, -10%, 0) scale3d(1.5, 1.5, 1);
    }
  }

  /* 尊重用户的减少动画偏好 */
  @media (prefers-reduced-motion: reduce) {
    .beam-shockwave,
    .beam-ground-pool,
    .beam-outer-glow,
    .beam-body,
    .beam-energy-flow,
    .beam-core,
    .beam-spark,
    .beam-dust {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
</style>
