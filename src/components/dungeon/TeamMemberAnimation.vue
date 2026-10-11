/**
 * @fileoverview 队伍成员动画组件
 * @description 处理玩家角色的技能释放、普通攻击和受伤动画
 * @author FLYFF Team
 * @version 1.0.2
 * @date 2026-04-03
 */

<template>
  <div
    class="team-member-animation"
    :class="animationClass"
    @animationend="onAnimationEnd"
  >
    <slot></slot>
  </div>
</template>

<script setup>
/**
 * 队伍成员动画组件
 * @description 提供技能释放、普通攻击、受伤和被怪物攻击动画效果
 */
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  /**
   * 是否正在释放技能
   */
  isCastingSkill: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在普通攻击
   */
  isNormalAttack: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在受伤
   */
  isHurt: {
    type: Boolean,
    default: false
  },
  /**
   * 是否被怪物攻击（头像向左移动后复原）
   */
  isMonsterAttacked: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['animation-end'])

// 当前动画类型
const currentAnimation = ref('')

// 动画版本号，用于强制触发动画重新播放
const animationVersion = ref(0)

// 计算动画class
const animationClass = computed(() => {
  if (currentAnimation.value) {
    // 添加版本号确保每次都是新的class触发动画
    return `animation-${currentAnimation.value} v-${animationVersion.value}`
  }
  return ''
})

// 监听技能释放状态
watch(
  () => props.isCastingSkill,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // 先重置动画
      currentAnimation.value = ''
      await nextTick()
      // 然后触发新动画
      currentAnimation.value = 'skill'
      animationVersion.value++
    }
  }
)

// 监听普通攻击状态
watch(
  () => props.isNormalAttack,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      currentAnimation.value = ''
      await nextTick()
      currentAnimation.value = 'attack'
      animationVersion.value++
    }
  }
)

// 监听受伤状态
watch(
  () => props.isHurt,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      currentAnimation.value = ''
      await nextTick()
      currentAnimation.value = 'hurt'
      animationVersion.value++
    }
  }
)

// 监听被怪物攻击状态
watch(
  () => props.isMonsterAttacked,
  async (newVal, oldVal) => {
    if (newVal && !oldVal) {
      currentAnimation.value = ''
      await nextTick()
      currentAnimation.value = 'monster-attack'
      animationVersion.value++
    }
  }
)

/**
 * 动画结束处理
 * @param {AnimationEvent} event - 动画事件
 */
const onAnimationEnd = (event) => {
  currentAnimation.value = ''
  emit('animation-end', event.animationName)
}
</script>

<style scoped>
.team-member-animation {
  will-change: transform;
}

/* 技能释放动画 - 头像向上移动后回原位 */
.team-member-animation.animation-skill {
  animation: skillCast 0.4s ease-out forwards;
}

@keyframes skillCast {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-15px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

/* 普通攻击动画 - 头像向右移动后回原位 */
.team-member-animation.animation-attack {
  animation: normalAttack 0.35s ease-out forwards;
}

@keyframes normalAttack {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(20px);
  }
  50% {
    transform: translateX(10px);
  }
  100% {
    transform: translateX(0);
  }
}

/* 受伤动画 - 头像向下移动后回原位 */
.team-member-animation.animation-hurt {
  animation: hurt 0.3s ease-out forwards;
}

@keyframes hurt {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(10px);
  }
  60% {
    transform: translateY(5px);
  }
  100% {
    transform: translateY(0);
  }
}

/* 被怪物攻击动画 - 头像向左移动后回原位 */
.team-member-animation.animation-monster-attack {
  animation: monsterAttack 0.35s ease-out forwards;
}

@keyframes monsterAttack {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-20px);
  }
  50% {
    transform: translateX(-10px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
