/**
 * @file HolyAccumulationDisplay.vue
 * @description 圣光积累圣光值UI显示组件
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：圣字 + 圆圈（数量与触发阈值一致），每次获得一个圣光值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-07-29
 */
<template>
  <div v-if="shouldDisplay" class="holy-accumulation-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="holy-label">圣</span>
    <div class="holy-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="holy-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 圣光积累圣光值UI显示组件
 * 当玩家为炽天使且已解锁圣光积累（J技能）时显示
 * 圣光值通过 useHolyAccumulation 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import { useHolyValue, useHolyTriggerFlash, isHolyAccumulationUnlocked, getHolyAccumulationTriggerCount } from '@/composables/useHolyAccumulation'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式圣光值 */
const holyValue = useHolyValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useHolyTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isHolyAccumulationUnlocked(props.player))

/** 当前圣光值 */
const currentValue = computed(() => holyValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getHolyAccumulationTriggerCount(props.player))

</script>

<style scoped>
.holy-accumulation-display {
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
  border: 1px solid rgba(241, 196, 15, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .holy-accumulation-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .holy-label {
    font-size: 10px;
  }

  .holy-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .holy-accumulation-display {
    width: 36px;
  }

  .holy-label {
    font-size: 9px;
  }

  .holy-circle {
    width: 2px;
    height: 2px;
  }
}

.holy-accumulation-display.trigger-flash {
  animation: holy-accumulation-flash 0.5s ease-in-out;
}

@keyframes holy-accumulation-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(241, 196, 15, 0);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 10px rgba(241, 196, 15, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(241, 196, 15, 0);
  }
}

.holy-label {
  font-size: 16px;
  font-weight: bold;
  color: #f1c40f;
  text-shadow: 0 0 4px rgba(241, 196, 15, 0.6);
  line-height: 1;
  flex-shrink: 0;
}

.holy-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  justify-content: space-between;
}

.holy-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(241, 196, 15, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.holy-circle.filled {
  background: #f1c40f;
  border-color: #f1c40f;
  box-shadow: 0 0 4px rgba(241, 196, 15, 0.8);
}
</style>
