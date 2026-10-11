/**
 * @fileoverview 怪物Debuff显示组件
 * @description 独立管理怪物的DOT效果和Debuff效果显示，避免整体怪物容器刷新
 *   - 通过事件订阅debuff变化，只刷新对应怪物的debuff区域
 *   - 使用本地倒计时，每秒更新显示
 * @author FLYFF Team
 * @version 1.1.0
 * @date 2026-04-02
 */

<template>
  <div
    v-if="hasDebuffs"
    class="monster-debuffs"
  >
    <!-- DOT效果 -->
    <div
      v-for="(dot, dotIndex) in dotEffects"
      :key="`dot-${dotIndex}`"
      class="debuff-icon"
      :title="`${dot.name} (${dot.ticksRemaining}跳)`"
    >
      <img :src="dot.icon" :alt="dot.name" @error="handleIconError" />
      <span v-if="dot.ticksRemaining" class="debuff-countdown">{{ dot.ticksRemaining }}</span>
    </div>
    <!-- Debuff效果（碎甲、眩晕等） -->
    <div
      v-for="(debuff, debuffIndex) in localDebuffs"
      :key="`debuff-${debuff.id || debuffIndex}`"
      class="debuff-icon"
      :class="{ 'armor-break': debuff.type === 'armorBreak', 'stun-effect': debuff.isStun }"
      :title="getDebuffTitle(debuff)"
    >
      <img :src="debuff.icon" :alt="debuff.name" @error="handleIconError" />
      <span class="debuff-countdown">{{ getRemainingTime(debuff) }}s</span>
    </div>
    <!-- 双倍惩戒DEBUFF（特殊显示） -->
    <div
      v-if="doubleJudgmentDebuff && doubleJudgmentDebuff.active"
      :key="`double-judgment-${monsterId}`"
      class="debuff-icon double-judgment"
      :title="getDoubleJudgmentTitle"
    >
      <img :src="doubleJudgmentDebuff.icon" alt="双倍惩戒" @error="handleIconError" />
      <span class="debuff-countdown">{{ getDoubleJudgmentRemainingTime }}s</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 全局debuff更新事件处理器映射
 * 使用WeakMap避免内存泄漏，monsterId -> handler函数
 */
const debuffHandlers = new Map()

/**
 * 触发指定怪物的debuff更新
 * @param {string|number} monsterId - 怪物ID
 * @param {Array} debuffs - 新的debuff列表
 */
export function triggerDebuffUpdate(monsterId, debuffs) {
  const handler = debuffHandlers.get(monsterId)
  if (handler) {
    handler(debuffs)
  }
}

/**
 * 怪物Debuff显示组件
 * @description 独立组件管理debuff显示，通过事件订阅避免父组件刷新
 */
export default {
  name: 'MonsterDebuffs',

  props: {
    /**
     * 怪物ID（用于订阅debuff变化）
     */
    monsterId: {
      type: [String, Number],
      required: true
    },
    /**
     * 怪物的DOT效果列表（直接传入，不通过事件订阅）
     */
    dotEffects: {
      type: Array,
      default: () => []
    },
  /**
   * 初始debuff列表（首次渲染使用）
   */
  initialDebuffs: {
    type: Array,
    default: () => []
  },
  /**
   * 双倍惩戒debuff（单独传递，特殊处理）
   */
  doubleJudgmentDebuff: {
    type: Object,
    default: null
  }
},

  emits: ['icon-error'],

  setup(props, { emit }) {
    // 本地debuff状态，通过事件更新
    const localDebuffs = ref([])
    // 倒计时刷新key，每秒更新一次强制触发模板重新渲染
    const countdownTick = ref(0)
    let countdownTimer = null

    /**
     * 是否有任何debuff效果
     */
    const hasDebuffs = computed(() => {
      // 依赖countdownTick确保响应式更新
      const tick = countdownTick.value // eslint-disable-line no-unused-vars
      const hasDots = props.dotEffects && props.dotEffects.length > 0
      const hasDebuffs = localDebuffs.value && localDebuffs.value.length > 0
      const hasDoubleJudgment = props.doubleJudgmentDebuff && props.doubleJudgmentDebuff.active
      return hasDots || hasDebuffs || hasDoubleJudgment
    })

    /**
     * 获取debuff的提示文本
     * @param {Object} debuff - debuff对象
     * @returns {string} 提示文本
     */
    const getDebuffTitle = (debuff) => {
      if (debuff.isStun) {
        return `${debuff.name} (眩晕)`
      }
      return `${debuff.name} (防御-${debuff.defenseReduction}%, 承伤+${debuff.damageIncrease}%)`
    }

    /**
     * 获取debuff剩余时间（秒）
     * @param {Object} debuff - debuff对象
     * @returns {number} 剩余秒数
     */
    const getRemainingTime = (debuff) => {
      if (!debuff.endTime) return 0
      // 使用countdownTick确保响应式更新
      const tick = countdownTick.value // eslint-disable-line no-unused-vars
      const remaining = Math.max(0, Math.ceil((debuff.endTime - Date.now()) / 1000))
      return remaining
    }

    /**
     * 获取双倍惩戒的提示文本
     */
    const getDoubleJudgmentTitle = computed(() => {
      if (!props.doubleJudgmentDebuff) return ''
      const multiplier = props.doubleJudgmentDebuff.damageMultiplier || 2
      return `双倍惩戒 (下次被击中伤害×${multiplier})`
    })

    /**
     * 获取双倍惩戒剩余时间（秒）
     */
    const getDoubleJudgmentRemainingTime = computed(() => {
      if (!props.doubleJudgmentDebuff || !props.doubleJudgmentDebuff.expiresAt) return 0
      // 使用countdownTick确保响应式更新
      const tick = countdownTick.value // eslint-disable-line no-unused-vars
      const remaining = Math.max(0, Math.ceil((props.doubleJudgmentDebuff.expiresAt - Date.now()) / 1000))
      return remaining
    })

    /**
     * 处理图标加载错误
     * @param {Event} e - 错误事件
     */
    const handleIconError = (e) => {
      emit('icon-error', e)
    }

    /**
     * 更新本地debuff状态（由事件触发）
     * @param {Array} debuffs - 新的debuff列表
     */
    const updateDebuffs = (debuffs) => {
      if (!debuffs || debuffs.length === 0) {
        localDebuffs.value = []
        return
      }
      // 过滤掉已过期的debuff
      const now = Date.now()
      localDebuffs.value = debuffs.filter(debuff => debuff.endTime > now)
    }

    /**
     * 启动倒计时更新定时器
     */
    const startCountdownTimer = () => {
      if (countdownTimer) return
      
      countdownTimer = setInterval(() => {
        // 更新tick key强制触发模板重新渲染
        countdownTick.value++
        // 过滤过期的debuff
        if (localDebuffs.value.length > 0) {
          const now = Date.now()
          const validDebuffs = localDebuffs.value.filter(debuff => debuff.endTime > now)
          if (validDebuffs.length !== localDebuffs.value.length) {
            localDebuffs.value = validDebuffs
          }
        }
      }, 1000) // 每秒更新一次
    }

    /**
     * 停止倒计时更新定时器
     */
    const stopCountdownTimer = () => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }

    // 组件挂载时初始化
    onMounted(() => {
      // 使用初始debuff数据
      updateDebuffs(props.initialDebuffs)
      
      // 注册debuff更新事件处理器
      debuffHandlers.set(props.monsterId, updateDebuffs)
      
      // 启动倒计时定时器
      startCountdownTimer()
    })

    // 组件卸载时清理
    onUnmounted(() => {
      // 移除事件处理器
      debuffHandlers.delete(props.monsterId)
      // 停止定时器
      stopCountdownTimer()
    })

    return {
      hasDebuffs,
      localDebuffs,
      getDebuffTitle,
      getRemainingTime,
      getDoubleJudgmentTitle,
      getDoubleJudgmentRemainingTime,
      handleIconError
    }
  }
}
</script>

<style scoped>
.monster-debuffs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  min-height: 24px;
}

.debuff-icon {
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.debuff-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.debuff-icon.armor-break {
  border-color: #ff9800;
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.5);
}

.debuff-icon.stun-effect {
  border-color: #e040fb;
  box-shadow: 0 0 4px rgba(224, 64, 251, 0.5);
  animation: stun-pulse 1s ease-in-out infinite;
}

.debuff-icon.double-judgment {
  border-color: #9c27b0;
  box-shadow: 0 0 6px rgba(156, 39, 176, 0.7);
  animation: double-judgment-pulse 1.5s ease-in-out infinite;
}

@keyframes stun-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes double-judgment-pulse {
  0%, 100% {
    box-shadow: 0 0 6px rgba(156, 39, 176, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 10px rgba(156, 39, 176, 1);
    transform: scale(1.1);
  }
}

.debuff-countdown {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 10px;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
  min-width: 14px;
  text-align: center;
}
</style>
