<!--
 * @component MonsterCountdown
 * @description 怪物获取倒计时动画组件 - 浏览器居中显示，黑色主题风格，精美转圈动画
 * @version 2.520
 * @date 2026-06-21
 -->
<template>
  <Teleport to="body">
    <transition name="countdown-fade" appear>
      <div v-if="showCountdown" class="countdown-overlay">
        <div class="countdown-panel">
          <!-- 转圈动画环 -->
          <div class="spinner-ring">
            <svg class="spinner-svg" viewBox="0 0 64 64">
              <!-- 底层轨道 -->
              <circle
                class="spinner-track"
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke-width="3"
              />
              <!-- 旋转弧线 -->
              <circle
                class="spinner-arc"
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            <!-- 中间秒数 -->
            <span class="spinner-seconds">{{ countdown }}</span>
          </div>
          <!-- 提示文字 -->
          <div class="countdown-label">正在获取怪物中</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue'

export default {
  name: 'MonsterCountdown',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    countdownSeconds: {
      type: Number,
      default: 3
    }
  },
  emits: ['countdown-finished'],
  setup (props, { emit }) {
    const showCountdown = ref(false)
    const countdown = ref(3)
    let rafId = 0
    let startAt = 0
    let lastSecond = 0

    /**
     * 启动倒计时动画，使用 requestAnimationFrame 精确追踪时间
     */
    const startCountdown = () => {
      if (!props.isActive) {
        return
      }
      const rawSeconds = Number(props.countdownSeconds)
      const totalSeconds = Number.isFinite(rawSeconds) && rawSeconds > 0 ? rawSeconds : 3
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
      showCountdown.value = true
      countdown.value = totalSeconds
      startAt = performance.now()
      lastSecond = totalSeconds

      /** 动画帧回调，精确计算剩余秒数 */
      const step = now => {
        const elapsed = Math.max(0, now - startAt)
        const remaining = Math.max(0, totalSeconds - Math.floor(elapsed / 1000))
        if (remaining !== lastSecond) {
          lastSecond = remaining
          countdown.value = remaining
        }
        if (remaining <= 0) {
          rafId = 0
          // 先隐藏倒计时 UI，让 Vue 通过微任务立即更新 DOM
          showCountdown.value = false
          // 再通过 setTimeout(0) 延迟 emit，创建独立宏任务边界
          // 父组件的事件处理（启动战斗、加载怪物等）可能很重（356ms+），
          // 如果和 UI 隐藏放在一起，会阻塞 showCountdown 的响应式更新，
          // 导致用户看到倒计时卡在 0 不消失
          setTimeout(() => {
            emit('countdown-finished')
          }, 0)
          return
        }
        rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
    }

    // 监听 isActive 变化，开始倒计时
    const unwatch = watch(
      () => props.isActive,
      newVal => {
        if (newVal) {
          startCountdown()
          return
        }

        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = 0
        }
        showCountdown.value = false
      },
      { immediate: true }
    )

    // 组件卸载时清理定时器
    onUnmounted(() => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
      if (unwatch) {
        unwatch()
      }
    })

    return {
      showCountdown,
      countdown
    }
  }
}
</script>

<style scoped>
  /* 淡入淡出过渡 */
  .countdown-fade-enter-active,
  .countdown-fade-leave-active {
    transition:
      opacity 200ms ease,
      transform 200ms ease;
    will-change: opacity, transform;
  }

  .countdown-fade-enter-from,
  .countdown-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .countdown-fade-enter-to,
  .countdown-fade-leave-from {
    opacity: 1;
    transform: scale(1);
  }

  /* 全屏遮罩 - 浏览器居中 */
  .countdown-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99999;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.35);
  }

  /* 面板主体 - 参考技能详情面板黑色主题 */
  .countdown-panel {
    background: var(--theme-modal-bg);
    border: 1px solid var(--theme-border-strong);
    border-radius: 12px;
    padding: 32px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  }

  /* 转圈动画环容器 */
  .spinner-ring {
    position: relative;
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    will-change: transform;
    transform: translateZ(0);
  }

  .spinner-svg {
    width: 72px;
    height: 72px;
    animation: spin 2.4s linear infinite;
    will-change: transform;
    transform: translateZ(0);
  }

  /* 底层轨道圆 */
  .spinner-track {
    stroke: var(--theme-border);
    opacity: 0.4;
  }

  /* 旋转弧线 */
  .spinner-arc {
    stroke: var(--theme-accent);
    stroke-dasharray: 60 176;
    animation: arc-rotate 2.4s linear infinite;
    will-change: stroke-dasharray, stroke-dashoffset;
    transform: translateZ(0);
  }

  /* 中间秒数显示 */
  .spinner-seconds {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateZ(0);
    will-change: transform;
    font-size: 20px;
    font-weight: bold;
    color: var(--theme-accent);
    line-height: 1;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* 提示文字 */
  .countdown-label {
    font-size: 14px;
    color: var(--theme-text);
    letter-spacing: 0.5px;
    font-weight: bold;
    opacity: 0.85;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    white-space: nowrap;
  }

  /* 旋转动画 */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* 弧线伸缩动画 */
  @keyframes arc-rotate {
    0% {
      stroke-dasharray: 1 176;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 80 176;
      stroke-dashoffset: -30;
    }
    100% {
      stroke-dasharray: 1 176;
      stroke-dashoffset: -176;
    }
  }
</style>
