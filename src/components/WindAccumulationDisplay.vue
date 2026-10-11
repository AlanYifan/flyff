/**
 * @file WindAccumulationDisplay.vue
 * @description 风之积累风之值UI显示组件
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：风字 + 圆圈（数量与触发阈值一致），每次获得一个风之值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-08-03
 */
<template>
  <div v-if="shouldDisplay" class="wind-accumulation-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="wind-label">风</span>
    <div class="wind-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="wind-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 风之积累风之值UI显示组件
 * 当玩家为风暴行者且已解锁风之积累（J技能）时显示
 * 风之值通过 useWindAccumulation 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import { useWindValue, useWindTriggerFlash, isWindAccumulationUnlocked, getWindAccumulationTriggerCount } from '@/composables/useWindAccumulation'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式风之值 */
const windValue = useWindValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useWindTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isWindAccumulationUnlocked(props.player))

/** 当前风之值 */
const currentValue = computed(() => windValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getWindAccumulationTriggerCount(props.player))

</script>

<style scoped>
.wind-accumulation-display {
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
  border: 1px solid rgba(46, 204, 113, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .wind-accumulation-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .wind-label {
    font-size: 10px;
  }

  .wind-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .wind-accumulation-display {
    width: 36px;
  }

  .wind-label {
    font-size: 9px;
  }

  .wind-circle {
    width: 2px;
    height: 2px;
  }
}

.wind-accumulation-display.trigger-flash {
  animation: wind-accumulation-flash 0.5s ease-in-out;
}

@keyframes wind-accumulation-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(46, 204, 113, 0);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 10px rgba(46, 204, 113, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(46, 204, 113, 0);
  }
}

.wind-label {
  font-size: 16px;
  font-weight: bold;
  color: #2ecc71;
  text-shadow: 0 0 4px rgba(46, 204, 113, 0.6);
  line-height: 1;
  flex-shrink: 0;
}

.wind-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  justify-content: space-between;
}

.wind-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(46, 204, 113, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.wind-circle.filled {
  background: #2ecc71;
  border-color: #2ecc71;
  box-shadow: 0 0 4px rgba(46, 204, 113, 0.8);
}
</style>
