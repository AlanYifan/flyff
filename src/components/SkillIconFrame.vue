<!--
  @file SkillIconFrame.vue
  @description 炫酷技能图标框架组件 - 替代六角棱形，提供多层动画特效
  @generated 2026-07-18
  @description 动画类型：脉动核心光晕 + 旋转光芒射线 + 渐变描边 + 类型专属粒子
  @description 性能策略：仅使用 transform/opacity，will-change 提前创建合成层，contain 隔离渲染
-->

<template>
  <div
    class="icon-frame"
    :class="[frameTypeClass, { 'is-locked': !unlocked, 'is-in-bar': inBar }]"
    :style="{ '--type-color': typeColor }"
  >
    <!-- 1. 底层脉动核心光晕（radial-gradient 从中心呼吸脉动） -->
    <span class="frame-core" aria-hidden="true"></span>

    <!-- 2. 旋转光芒射线层（conic-gradient 放射状射线，持续旋转） -->
    <span class="frame-rays" aria-hidden="true"></span>

    <!-- 3. 渐变描边层（类型色渐变边框 + 流动光效） -->
    <span class="frame-border" aria-hidden="true"></span>

    <!-- 类型专属粒子层 -->
    <span class="frame-particles" aria-hidden="true">
      <span
        v-for="n in particleCount"
        :key="n"
        class="particle"
        :class="'particle-' + n"
      ></span>
    </span>

    <!-- 技能图标 -->
    <img
      :src="icon"
      :alt="alt"
      class="frame-icon"
      draggable="false"
      @error="$emit('icon-error', $event)"
    />

    <!-- 锁定遮罩 -->
    <span v-if="!unlocked" class="frame-lock" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 10V8a5 5 0 0 1 10 0v2M5 10h14v10H5z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <!-- 已在技能栏标记 -->
    <span v-if="inBar" class="frame-badge" aria-hidden="true">✓</span>
  </div>
</template>

<script setup>
/**
 * 炫酷技能图标框架组件
 * 用途/业务意图：替代原有六角棱形，以脉动核心光晕、旋转光芒射线、渐变描边和类型专属粒子
 * 展示技能图标，不同技能类型拥有不同的视觉动画风格
 * 全部动画仅操作 transform/opacity，配合 will-change 与 contain 实现 GPU 加速
 */

// ========== Props ==========
const props = defineProps({
  /** 技能图标路径 */
  icon: {
    type: String,
    required: true
  },
  /** 图标 alt 文本（无障碍） */
  alt: {
    type: String,
    default: ''
  },
  /** 技能类型主题色（CSS 颜色值） */
  typeColor: {
    type: String,
    default: '#90a4ae'
  },
  /** 技能类型 key（用于匹配专属粒子动画，如 single/aoe/buff/heal/summon/utility/passive） */
  typeKey: {
    type: String,
    default: 'utility'
  },
  /** 是否已解锁（未解锁时灰度+动画暂停） */
  unlocked: {
    type: Boolean,
    default: true
  },
  /** 是否已在技能栏中（常亮光晕） */
  inBar: {
    type: Boolean,
    default: false
  }
})

// ========== Emits ==========
defineEmits([
  /** 图标加载失败 */
  'icon-error'
])

// ========== 计算属性 ==========

/**
 * 帧类型样式类名
 * 根据技能类型 key 映射到对应的 CSS 类，驱动不同的粒子动画
 * 被动类型优先于其他类型
 * @returns {string} 类型样式类名
 */
const frameTypeClass = computed(() => {
  return `frame-${props.typeKey}`
})

/**
 * 粒子数量
 * 不同类型使用不同数量的粒子，控制视觉密度与性能开销
 * @returns {number} 粒子数量
 */
const particleCount = computed(() => {
  const countMap = {
    single: 4,
    aoe: 6,
    dot: 4,
    buff: 5,
    debuff: 5,
    heal: 4,
    summon: 6,
    utility: 3,
    passive: 5
  }
  return countMap[props.typeKey] || 4
})

// ========== 依赖导入 ==========
import { computed } from 'vue'
</script>

<style scoped>
/* ==================== 图标框架容器 ==================== */
.icon-frame {
  position: relative;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
  contain: layout style;
}

/* ==================== 1. 底层脉动核心光晕 ==================== */
/* radial-gradient 从中心向外呼吸脉动，模拟能量核心 */
.frame-core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--type-color, #ffd700) 0%,
    color-mix(in srgb, var(--type-color, #ffd700) 40%, transparent) 35%,
    transparent 70%
  );
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0.35;
  z-index: 0;
  animation: core-pulse 2.8s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes core-pulse {
  0%, 100% {
    opacity: 0.25;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

/* ==================== 2. 旋转光芒射线层 ==================== */
/* conic-gradient 形成放射状射线，持续旋转，形成光芒四射的效果 */
/* 用 radial-gradient mask 从中心向外渐隐，避免中心过亮 */
.frame-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  /* 8道射线：透明 → 类型色 → 透明交替 */
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    var(--type-color, #ffd700) 6deg,
    transparent 12deg,
    transparent 36deg,
    var(--type-color, #ffd700) 42deg,
    transparent 48deg,
    transparent 72deg,
    var(--type-color, #ffd700) 78deg,
    transparent 84deg,
    transparent 108deg,
    var(--type-color, #ffd700) 114deg,
    transparent 120deg,
    transparent 144deg,
    var(--type-color, #ffd700) 150deg,
    transparent 156deg,
    transparent 180deg,
    var(--type-color, #ffd700) 186deg,
    transparent 192deg,
    transparent 216deg,
    var(--type-color, #ffd700) 222deg,
    transparent 228deg,
    transparent 252deg,
    var(--type-color, #ffd700) 258deg,
    transparent 264deg,
    transparent 288deg,
    var(--type-color, #ffd700) 294deg,
    transparent 300deg,
    transparent 324deg,
    var(--type-color, #ffd700) 330deg,
    transparent 336deg,
    transparent 360deg
  );
  /* 从中心向外渐隐，只显示外圈射线 */
  -webkit-mask: radial-gradient(circle, transparent 30%, #000 50%, #000 80%, transparent 100%);
  mask: radial-gradient(circle, transparent 30%, #000 50%, #000 80%, transparent 100%);
  opacity: 0.5;
  animation: rays-spin 8s linear infinite;
  will-change: transform;
}

@keyframes rays-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

/* ==================== 3. 渐变描边层 ==================== */
/* 类型色渐变边框，提供清晰的图标边界 */
.frame-border {
  position: absolute;
  inset: -1px;
  border-radius: 12px;
  z-index: 1;
  pointer-events: none;
  /* 渐变边框：通过 padding + mask 实现镂空 */
  background: linear-gradient(
    135deg,
    var(--type-color, #ffd700),
    color-mix(in srgb, var(--type-color, #ffd700) 60%, #ffffff 40%),
    var(--type-color, #ffd700)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 2px;
  box-shadow:
    0 0 6px color-mix(in srgb, var(--type-color, #ffd700) 50%, transparent),
    inset 0 0 4px color-mix(in srgb, var(--type-color, #ffd700) 30%, transparent);
}

/* ==================== 技能图标 ==================== */
.frame-icon {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  position: relative;
  z-index: 2;
  pointer-events: none;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.5);
}

/* ==================== 类型专属粒子层 ==================== */
.frame-particles {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--type-color, #ffd700);
  box-shadow: 0 0 4px var(--type-color, #ffd700);
  will-change: transform, opacity;
}

/* ----- 伤害型粒子：从底部上升并消失（火花效果） ----- */
.frame-single .particle,
.frame-aoe .particle,
.frame-dot .particle {
  bottom: 2px;
  left: 50%;
  opacity: 0;
  animation: particle-rise 1.8s ease-out infinite;
}

.frame-single .particle-1,
.frame-aoe .particle-1,
.frame-dot .particle-1 { animation-delay: 0s; left: 30%; }
.frame-single .particle-2,
.frame-aoe .particle-2,
.frame-dot .particle-2 { animation-delay: 0.3s; left: 50%; }
.frame-single .particle-3,
.frame-aoe .particle-3,
.frame-dot .particle-3 { animation-delay: 0.6s; left: 70%; }
.frame-single .particle-4,
.frame-aoe .particle-4,
.frame-dot .particle-4 { animation-delay: 0.9s; left: 40%; }
.frame-aoe .particle-5 { animation-delay: 1.2s; left: 60%; }
.frame-aoe .particle-6 { animation-delay: 1.5s; left: 45%; }

@keyframes particle-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -10px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -30px) scale(0.3);
  }
}

/* ----- 增益/减益型粒子：螺旋上升（光点效果） ----- */
.frame-buff .particle,
.frame-debuff .particle {
  top: 50%;
  left: 50%;
  opacity: 0;
  animation: particle-spiral 2.5s ease-in-out infinite;
}

.frame-buff .particle-1,
.frame-debuff .particle-1 { animation-delay: 0s; }
.frame-buff .particle-2,
.frame-debuff .particle-2 { animation-delay: 0.5s; }
.frame-buff .particle-3,
.frame-debuff .particle-3 { animation-delay: 1s; }
.frame-buff .particle-4,
.frame-debuff .particle-4 { animation-delay: 1.5s; }
.frame-buff .particle-5,
.frame-debuff .particle-5 { animation-delay: 2s; }

@keyframes particle-spiral {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(0deg) translateX(8px) rotate(0deg) scale(0.5);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(360deg) translateX(8px) rotate(-360deg) scale(1) translateY(-20px);
  }
}

/* ----- 治疗型粒子：十字光芒闪烁 ----- */
.frame-heal .particle {
  top: 50%;
  left: 50%;
  width: 2px;
  height: 12px;
  border-radius: 1px;
  opacity: 0;
  animation: particle-cross 2s ease-in-out infinite;
}

.frame-heal .particle-1 { --rot: 0deg; animation-delay: 0s; }
.frame-heal .particle-2 { --rot: 90deg; animation-delay: 0.5s; }
.frame-heal .particle-3 { --rot: 45deg; animation-delay: 1s; }
.frame-heal .particle-4 { --rot: -45deg; animation-delay: 1.5s; }

@keyframes particle-cross {
  0%, 100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scaleY(0.5);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scaleY(1);
  }
}

/* ----- 召唤型粒子：法阵圆周旋转 ----- */
.frame-summon .particle {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  opacity: 0.7;
  transform-origin: center;
  animation: particle-orbit 3s linear infinite;
}

.frame-summon .particle-1 { animation-delay: 0s; }
.frame-summon .particle-2 { animation-delay: -0.5s; }
.frame-summon .particle-3 { animation-delay: -1s; }
.frame-summon .particle-4 { animation-delay: -1.5s; }
.frame-summon .particle-5 { animation-delay: -2s; }
.frame-summon .particle-6 { animation-delay: -2.5s; }

@keyframes particle-orbit {
  from {
    transform: translate(-50%, -50%) rotate(0deg) translateX(24px) scale(1);
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg) translateX(24px) scale(0.5);
    opacity: 0.8;
  }
}

/* ----- 功能型粒子：缓慢圆周运动 ----- */
.frame-utility .particle {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  opacity: 0.5;
  animation: particle-orbit-slow 4s linear infinite;
}

.frame-utility .particle-1 { animation-delay: 0s; }
.frame-utility .particle-2 { animation-delay: -1.3s; }
.frame-utility .particle-3 { animation-delay: -2.6s; }

@keyframes particle-orbit-slow {
  from {
    transform: translate(-50%, -50%) rotate(0deg) translateX(26px);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg) translateX(26px);
  }
}

/* ----- 被动型粒子：随机闪烁星点 ----- */
.frame-passive .particle {
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  opacity: 0;
  animation: particle-twinkle 2s ease-in-out infinite;
}

.frame-passive .particle-1 { top: 20%; left: 25%; animation-delay: 0s; }
.frame-passive .particle-2 { top: 75%; left: 70%; animation-delay: 0.4s; }
.frame-passive .particle-3 { top: 30%; left: 75%; animation-delay: 0.8s; }
.frame-passive .particle-4 { top: 70%; left: 30%; animation-delay: 1.2s; }
.frame-passive .particle-5 { top: 50%; left: 50%; animation-delay: 1.6s; }

@keyframes particle-twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* ==================== 锁定状态 ==================== */
.icon-frame.is-locked .frame-icon {
  filter: grayscale(1) brightness(0.5);
}

.icon-frame.is-locked {
  opacity: 0.75;
}

/* 锁定时暂停所有动画，节省 GPU 开销 */
.icon-frame.is-locked .frame-core,
.icon-frame.is-locked .frame-rays,
.icon-frame.is-locked .particle {
  animation-play-state: paused;
}

.frame-lock {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  z-index: 4;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

/* ==================== 技能栏标记 ==================== */
.frame-badge {
  position: absolute;
  top: -2px;
  right: 0px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--theme-accent, #ffd700);
  color: #000;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
}

/* ==================== 已在技能栏：增强核心光晕 ==================== */
.icon-frame.is-in-bar .frame-core {
  opacity: 0.5;
  animation-duration: 2s;
}

/* ==================== hover 增强 ==================== */
.icon-frame:hover .frame-core {
  opacity: 0.7;
  animation-duration: 1.8s;
}

.icon-frame:hover .frame-rays {
  animation-duration: 4s;
  opacity: 0.8;
}

.icon-frame:hover .frame-border {
  box-shadow:
    0 0 10px color-mix(in srgb, var(--type-color, #ffd700) 70%, transparent),
    inset 0 0 6px color-mix(in srgb, var(--type-color, #ffd700) 50%, transparent);
}
</style>
