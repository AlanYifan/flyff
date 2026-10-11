/**
 * @fileoverview 怪物动画组件
 * @description 处理怪物的攻击、受伤和死亡动画
 * @author FLYFF Team
 * @version 1.1.0
 * @date 2026-03-25
 */

<template>
  <div
    class="monster-animation"
    :class="containerClass"
    @animationend="onAnimationEnd"
  >
    <!-- 怪物图标区域 - 受伤抖动只应用到这里 -->
    <div
      v-if="$slots.icon"
      class="monster-icon-area"
      :class="iconAnimationClass"
      @animationend="onIconAnimationEnd"
    >
      <slot name="icon"></slot>
    </div>
    
    <!-- 怪物信息区域 -->
    <div v-if="$slots.default" class="monster-info-area">
      <slot></slot>
    </div>
    
    <!-- 兼容旧用法：如果没有使用具名插槽，则整体应用动画 -->
    <template v-if="!$slots.icon && !$slots.default">
      <slot></slot>
    </template>
  </div>
</template>

<script setup>
/**
 * 怪物动画组件
 * @description 提供攻击、受伤和死亡动画效果
 * - 使用具名插槽时，受伤动画只应用到图标区域
 * - 使用默认插槽时，动画应用到整体（兼容旧用法）
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  /**
   * 是否正在攻击
   */
  isAttacking: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在受伤
   */
  isHit: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在死亡
   */
  isDying: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['animation-end'])

// 当前容器动画类型（攻击、死亡）
const currentContainerAnimation = ref('')
// 当前图标动画类型（受伤）
const currentIconAnimation = ref('')

// 容器动画class（攻击、死亡应用到整个容器）
const containerClass = computed(() => {
  // 死亡动画优先级最高，应用到整个容器
  if (props.isDying) {
    return 'animation-dying'
  }
  if (currentContainerAnimation.value) {
    return `animation-${currentContainerAnimation.value}`
  }
  return ''
})

// 图标动画class（受伤只应用到图标区域）
const iconAnimationClass = computed(() => {
  if (currentIconAnimation.value) {
    return `icon-animation-${currentIconAnimation.value}`
  }
  return ''
})

// 监听攻击状态
watch(
  () => props.isAttacking,
  (newVal) => {
    if (newVal && !props.isDying) {
      currentContainerAnimation.value = 'attacking'
    }
  }
)

// 监听受伤状态
watch(
  () => props.isHit,
  (newVal) => {
    if (newVal && !props.isDying) {
      currentIconAnimation.value = 'hit'
    }
  }
)

/**
 * 容器动画结束处理
 * @param {AnimationEvent} event - 动画事件
 */
const onAnimationEnd = (event) => {
  // 死亡动画不重置，保持最终状态
  if (event.animationName !== 'monsterDying') {
    currentContainerAnimation.value = ''
  }
  emit('animation-end', event.animationName)
}

/**
 * 图标动画结束处理
 * @param {AnimationEvent} event - 动画事件
 */
const onIconAnimationEnd = (event) => {
  currentIconAnimation.value = ''
  event.stopPropagation() // 阻止冒泡到容器
}
</script>

<style scoped>
.monster-animation {
  transition: transform 0.1s ease-out;
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.monster-icon-area {
  position: relative;
  will-change: transform, filter;
}

.monster-info-area {
  width: 100%;
}

/* 攻击动画 - 怪物向左冲刺后回原位（向玩家方向） */
.monster-animation.animation-attacking {
  animation: monsterAttack 0.4s ease-out;
}

@keyframes monsterAttack {
  0% {
    transform: translateX(0) scale(1);
  }
  25% {
    transform: translateX(-25px) scale(1.05);
  }
  50% {
    transform: translateX(-15px) scale(1.02);
  }
  100% {
    transform: translateX(0) scale(1);
  }
}

/* 受伤动画 - 只应用到图标区域 */
.monster-icon-area.icon-animation-hit {
  animation: iconHit 0.25s ease-out;
}

@keyframes iconHit {
  0% {
    transform: translateX(0);
    filter: brightness(1);
  }
  15% {
    transform: translateX(-8px);
    filter: brightness(1.5) saturate(1.5);
  }
  30% {
    transform: translateX(6px);
    filter: brightness(1.3);
  }
  45% {
    transform: translateX(-4px);
    filter: brightness(1.2);
  }
  60% {
    transform: translateX(2px);
    filter: brightness(1.1);
  }
  100% {
    transform: translateX(0);
    filter: brightness(1);
  }
}

/* 死亡动画 - 缩小淡出并下沉 */
.monster-animation.animation-dying {
  animation: monsterDying 0.6s ease-out forwards;
}

@keyframes monsterDying {
  0% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  30% {
    transform: scale(1.1) translateY(0);
    opacity: 0.9;
  }
  60% {
    transform: scale(0.7) translateY(15px);
    opacity: 0.5;
  }
  100% {
    transform: scale(0.3) translateY(30px);
    opacity: 0;
  }
}
</style>
