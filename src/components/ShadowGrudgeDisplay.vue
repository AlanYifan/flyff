/**
 * @file ShadowGrudgeDisplay.vue
 * @description 影之怨影怨值UI显示组件
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：怨字 + 圆圈（数量与触发阈值一致），每次获得一个影怨值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-07-27
 */
<template>
  <div v-if="shouldDisplay" class="shadow-grudge-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="grudge-label">怨</span>
    <div class="grudge-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="grudge-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 影之怨影怨值UI显示组件
 * 当玩家为暗夜主宰且已解锁影之怨（J技能）时显示
 * 影怨值通过 useShadowGrudge 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import { useGrudgeValue, useGrudgeTriggerFlash, isShadowGrudgeUnlocked, getShadowGrudgeTriggerCount } from '@/composables/useShadowGrudge'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式影怨值 */
const grudgeValue = useGrudgeValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useGrudgeTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isShadowGrudgeUnlocked(props.player))

/** 当前影怨值 */
const currentValue = computed(() => grudgeValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getShadowGrudgeTriggerCount(props.player))
</script>

<style scoped>
.shadow-grudge-display {
  /* 宽度对齐头像容器（avatar-container player）宽度 */
  width: 100px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 3px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(155, 89, 182, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .shadow-grudge-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .grudge-label {
    font-size: 10px;
  }

  .grudge-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .shadow-grudge-display {
    width: 36px;
  }

  .grudge-label {
    font-size: 9px;
  }

  .grudge-circle {
    width: 2px;
    height: 2px;
  }
}

.shadow-grudge-display.trigger-flash {
  animation: shadow-grudge-flash 0.5s ease-in-out;
}

@keyframes shadow-grudge-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(155, 89, 182, 0);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 10px rgba(155, 89, 182, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(155, 89, 182, 0);
  }
}

.grudge-label {
  font-size: 16px;
  font-weight: bold;
  color: #9b59b6;
  text-shadow: 0 0 4px rgba(155, 89, 182, 0.6);
  line-height: 1;
  flex-shrink: 0;
}

.grudge-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  justify-content: space-between;
}

.grudge-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(155, 89, 182, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.grudge-circle.filled {
  background: #9b59b6;
  border-color: #9b59b6;
  box-shadow: 0 0 4px rgba(155, 89, 182, 0.8);
}
</style>
