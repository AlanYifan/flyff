<template>
  <transition name="status-bar-slide">
    <div v-if="visible" :class="['server-status-bar', statusClass]">
      <!-- 断开连接：红色主题 + 转圈动画 -->
      <template v-if="status === 'disconnected'">
        <div class="status-spinner"></div>
        <span class="status-text">服务器未启动</span>
      </template>

      <!-- 连接成功：绿色主题 + 对勾 -->
      <template v-else-if="status === 'connected'">
        <div class="status-check">&#10003;</div>
        <span class="status-text">服务启动成功</span>
      </template>

      <!-- 正在检测：蓝色主题 + 转圈 -->
      <template v-else>
        <div class="status-spinner status-spinner--checking"></div>
        <span class="status-text">正在检测服务器...</span>
      </template>
    </div>
  </transition>
</template>

<script setup>
/**
 * @fileoverview 服务器状态通知条组件
 * @description 在登录/注册页面显示服务器连接状态：
 *   - disconnected：红色 + 转圈动画，表示服务器未启动或已断开
 *   - connected：绿色 + 对勾，表示服务器连接成功，2秒后自动移除
 *   - checking：蓝色 + 转圈，表示正在检测服务器状态
 * @author FLYFF Team
 * @version 1.1.0
 * @created 2026-06-20
 * @updated 2026-06-20 修复服务器恢复后红色状态不消失的问题，增加启动延迟
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import axios from 'axios'

/** 检测间隔（毫秒） */
const CHECK_INTERVAL_MS = 5000

/** 请求超时时间（毫秒） */
const CHECK_TIMEOUT_MS = 8000

/** 连接成功后自动隐藏延迟（毫秒） */
const CONNECTED_HIDE_DELAY_MS = 2000

/** 连续失败阈值（需连续失败此次数才显示断开状态） */
const FAILURE_THRESHOLD = 3

/**
 * 启动延迟时间（毫秒）
 * Vite 启动比 Go 后端快，延迟后再开始检测，避免启动期间误报断开
 */
const STARTUP_DELAY_MS = 10000

const props = defineProps({
  /**
   * 是否启用心跳检测
   * 登录/注册页面启用，游戏主页面由 HeartbeatService 管理
   */
  enabled: {
    type: Boolean,
    default: true
  }
})

/** 当前状态：'checking' | 'connected' | 'disconnected' */
const status = ref('checking')

/** 是否可见 */
const visible = ref(false)

/** 连续失败计数 */
let failureCount = 0

/** 检测定时器 */
let checkTimer = null

/** 连接成功后自动隐藏定时器 */
let hideTimer = null

/** 启动延迟定时器 */
let startupDelayTimer = null

/** 状态对应的 CSS 类名 */
const statusClass = computed(() => `server-status-bar--${status.value}`)

/**
 * 检测服务器是否在线
 * 成功则从断开状态恢复为绿色"服务启动成功"并在2秒后隐藏
 * 连续失败达阈值则显示红色"服务器未启动"
 * @returns {void}
 */
async function checkServerHealth () {
  try {
    await axios.get('/api/health', { timeout: CHECK_TIMEOUT_MS })

    // 连接成功，重置失败计数
    failureCount = 0

    // 从断开/检测中状态恢复：显示绿色成功提示
    if (status.value !== 'connected') {
      status.value = 'connected'
      visible.value = true

      // 2秒后自动隐藏
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
      hideTimer = setTimeout(() => {
        visible.value = false
        hideTimer = null
      }, CONNECTED_HIDE_DELAY_MS)
    }
  } catch (error) {
    // 请求失败，清除自动隐藏定时器
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    failureCount += 1

    // 连续失败达阈值才显示断开状态
    if (failureCount >= FAILURE_THRESHOLD) {
      status.value = 'disconnected'
      visible.value = true
    }
  }
}

/**
 * 启动检测
 * 等待启动延迟后再开始定期检测，避免 Vite 先于 Go 后端启动时误报
 * @returns {void}
 */
function startChecking () {
  if (!props.enabled) {
    return
  }

  stopChecking()

  // 启动延迟：等待 Go 后端就绪后再开始检测
  startupDelayTimer = setTimeout(() => {
    startupDelayTimer = null

    // 延迟后执行第一次检测
    checkServerHealth()

    // 定期检测
    checkTimer = setInterval(checkServerHealth, CHECK_INTERVAL_MS)
  }, STARTUP_DELAY_MS)
}

/**
 * 停止检测并清理定时器
 * @returns {void}
 */
function stopChecking () {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (startupDelayTimer) {
    clearTimeout(startupDelayTimer)
    startupDelayTimer = null
  }
}

/** 监听 enabled 属性变化 */
watch(
  () => props.enabled,
  (newVal) => {
    if (newVal) {
      startChecking()
    } else {
      stopChecking()
      visible.value = false
      status.value = 'checking'
      failureCount = 0
    }
  }
)

onMounted(() => {
  if (props.enabled) {
    startChecking()
  }
})

onUnmounted(() => {
  stopChecking()
})
</script>

<style scoped>
  /* 通知条基础样式 */
  .server-status-bar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 1px;
    backdrop-filter: blur(12px);
    z-index: 100;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  /* 断开连接：红色主题 */
  .server-status-bar--disconnected {
    background: rgba(255, 87, 87, 0.2);
    border: 1px solid rgba(255, 87, 87, 0.5);
    color: #ff6b6b;
  }

  /* 连接成功：绿色主题 */
  .server-status-bar--connected {
    background: rgba(87, 255, 140, 0.15);
    border: 1px solid rgba(87, 255, 140, 0.5);
    color: #57ff8c;
  }

  /* 正在检测：蓝色主题 */
  .server-status-bar--checking {
    background: rgba(74, 158, 255, 0.15);
    border: 1px solid rgba(74, 158, 255, 0.4);
    color: #6cb8ff;
  }

  /* 转圈动画（断开/检测中） */
  .status-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 107, 107, 0.3);
    border-top-color: #ff6b6b;
    border-radius: 50%;
    animation: status-spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .status-spinner--checking {
    border-color: rgba(74, 158, 255, 0.3);
    border-top-color: #6cb8ff;
  }

  /* 对勾图标（连接成功） */
  .status-check {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: #57ff8c;
    flex-shrink: 0;
  }

  /* 状态文字 */
  .status-text {
    line-height: 1;
  }

  /* 转圈动画 */
  @keyframes status-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* 进出动画 */
  .status-bar-slide-enter-active {
    transition: all 0.3s ease-out;
  }

  .status-bar-slide-leave-active {
    transition: all 0.4s ease-in;
  }

  .status-bar-slide-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
  }

  .status-bar-slide-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-12px);
  }
</style>
