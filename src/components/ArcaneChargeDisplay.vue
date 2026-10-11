/**
 * @file ArcaneChargeDisplay.vue
 * @description 奥术充能值UI显示组件（奥术师专属）
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：充字 + 圆圈（数量与触发阈值一致），每次获得一个充能值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-08-12
 */
<template>
  <div v-if="shouldDisplay" class="arcane-charge-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="arcane-charge-label">充</span>
    <div class="arcane-charge-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="arcane-charge-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 奥术充能值UI显示组件
 * 当玩家为奥术师且已解锁奥术充能（J技能）时显示
 * 充能值通过 useArcaneMasterEx 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import {
  useArcaneChargeValue,
  useArcaneChargeTriggerFlash,
  isArcaneChargeUnlocked,
  getArcaneChargeTriggerCount
} from '@/composables/useArcaneMasterEx'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式充能值 */
const chargeValue = useArcaneChargeValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useArcaneChargeTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isArcaneChargeUnlocked(props.player))

/** 当前充能值 */
const currentValue = computed(() => chargeValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getArcaneChargeTriggerCount(props.player))

</script>

<style scoped>
.arcane-charge-display {
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
  border: 1px solid rgba(155, 89, 182, 0.3);
  transition: all 0.3s ease;
  overflow: visible;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .arcane-charge-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .arcane-charge-label {
    font-size: 10px;
  }

  .arcane-charge-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .arcane-charge-display {
    width: 36px;
  }

  .arcane-charge-label {
    font-size: 9px;
  }

  .arcane-charge-circle {
    width: 2px;
    height: 2px;
  }
}

.arcane-charge-display.trigger-flash {
  animation: arcane-charge-flash 0.5s ease-in-out;
}

@keyframes arcane-charge-flash {
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

.arcane-charge-label {
  font-size: 14px;
  font-weight: bold;
  color: #9b59b6;
  text-shadow: 0 0 4px rgba(155, 89, 182, 0.6);
  line-height: 1;
  flex-shrink: 0;
  margin-right: 2px;
}

.arcane-charge-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 2px;
  justify-content: center;
}

.arcane-charge-circle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1px solid rgba(155, 89, 182, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.arcane-charge-circle.filled {
  background: #9b59b6;
  border-color: #9b59b6;
  box-shadow: 0 0 4px rgba(155, 89, 182, 0.8);
}
</style>
