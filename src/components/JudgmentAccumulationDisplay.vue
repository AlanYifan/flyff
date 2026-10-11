/**
 * @file JudgmentAccumulationDisplay.vue
 * @description 裁决积累裁决值UI显示组件（圣殿骑士专属）
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：裁字 + 圆圈（数量与触发阈值一致），每次获得一个裁决值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-08-11
 */
<template>
  <div v-if="shouldDisplay" class="judgment-accumulation-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="judgment-label">裁</span>
    <div class="judgment-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="judgment-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 裁决积累裁决值UI显示组件
 * 当玩家为圣殿骑士且已解锁裁决积累（J技能）时显示
 * 裁决值通过 useHolyKnightEx 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import {
  useJudgmentValue,
  useJudgmentTriggerFlash,
  isJudgmentAccumulationUnlocked,
  getJudgmentAccumulationTriggerCount
} from '@/composables/useHolyKnightEx'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式裁决值 */
const judgmentValue = useJudgmentValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useJudgmentTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isJudgmentAccumulationUnlocked(props.player))

/** 当前裁决值 */
const currentValue = computed(() => judgmentValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getJudgmentAccumulationTriggerCount(props.player))

</script>

<style scoped>
.judgment-accumulation-display {
  /* 宽度对齐头像容器（avatar-container player）宽度 */
  width: 100px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 2px 4px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(231, 76, 60, 0.3);
  transition: all 0.3s ease;
  overflow: visible;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .judgment-accumulation-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .judgment-label {
    font-size: 10px;
  }

  .judgment-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .judgment-accumulation-display {
    width: 36px;
  }

  .judgment-label {
    font-size: 9px;
  }

  .judgment-circle {
    width: 2px;
    height: 2px;
  }
}

.judgment-accumulation-display.trigger-flash {
  animation: judgment-accumulation-flash 0.5s ease-in-out;
}

@keyframes judgment-accumulation-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(231, 76, 60, 0);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 10px rgba(231, 76, 60, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(231, 76, 60, 0);
  }
}

.judgment-label {
  font-size: 14px;
  font-weight: bold;
  color: #e74c3c;
  text-shadow: 0 0 4px rgba(231, 76, 60, 0.6);
  line-height: 1;
  flex-shrink: 0;
  margin-right: 2px;
}

.judgment-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 2px;
  justify-content: center;
}

.judgment-circle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid rgba(231, 76, 60, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.judgment-circle.filled {
  background: #e74c3c;
  border-color: #e74c3c;
  box-shadow: 0 0 4px rgba(231, 76, 60, 0.8);
}
</style>
