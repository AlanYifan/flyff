/**
 * @file DragonForceDisplay.vue
 * @description 龙之劲劲力值UI显示组件
 * 显示在玩家头像下方，从左往右贴合排列
 * 显示格式：劲字 + 圆圈（数量与触发阈值一致），每次获得一个劲力值就将空圆圈填满颜色
 * 宽度对齐 avatar-container player 的宽度，随响应式断点同步缩放
 *
 * 创建时间：2026-07-22
 * 修改时间：2026-07-27：圆圈数量改为与实际触发阈值一致（EX1解锁后显示5个）
 */
<template>
  <div v-if="shouldDisplay" class="dragon-force-display" :class="{ 'trigger-flash': triggerFlash }">
    <span class="force-label">劲</span>
    <div class="force-circles">
      <span
        v-for="i in maxCircles"
        :key="i"
        class="force-circle"
        :class="{ filled: i <= currentValue }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 龙之劲劲力值UI显示组件
 * 当玩家为格斗宗师且已解锁龙之劲（J技能）时显示
 * 劲力值通过 useDragonForce 组合式函数的响应式 ref 自动更新
 */
import { computed } from 'vue'
import { useForceValue, useTriggerFlash, isDragonForceUnlocked, getDragonForceTriggerCount } from '@/composables/useDragonForce'

const props = defineProps({
  /**
   * 玩家对象
   */
  player: {
    type: Object,
    default: null
  }
})

/** 响应式劲力值 */
const forceValue = useForceValue()

/** 响应式触发闪烁标记 */
const triggerFlash = useTriggerFlash()

/** 是否应该显示组件 */
const shouldDisplay = computed(() => isDragonForceUnlocked(props.player))

/** 当前劲力值 */
const currentValue = computed(() => forceValue.value)

/** 圆圈数量（与实际触发阈值一致，EX1解锁后为5，否则为10） */
const maxCircles = computed(() => getDragonForceTriggerCount(props.player))
</script>

<style scoped>
.dragon-force-display {
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
  border: 1px solid rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 响应式：与 member-avatar 宽度同步 */
@media (max-width: 900px) {
  .dragon-force-display {
    width: 40px;
    padding: 1px 2px;
    border-radius: 4px;
  }

  .force-label {
    font-size: 10px;
  }

  .force-circle {
    width: 2px;
    height: 2px;
    border-width: 1px;
  }
}

@media (max-width: 600px) {
  .dragon-force-display {
    width: 36px;
  }

  .force-label {
    font-size: 9px;
  }

  .force-circle {
    width: 2px;
    height: 2px;
  }
}

.dragon-force-display.trigger-flash {
  animation: dragon-force-flash 0.5s ease-in-out;
}

@keyframes dragon-force-flash {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 215, 0, 0);
  }
}

.force-label {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
  line-height: 1;
  flex-shrink: 0;
}

.force-circles {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  justify-content: space-between;
}

.force-circle {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 215, 0, 0.4);
  background: transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.force-circle.filled {
  background: #ffd700;
  border-color: #ffd700;
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
}
</style>
