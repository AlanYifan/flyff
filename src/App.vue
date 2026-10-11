<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <Suspense>
        <template #default>
          <div class="suspense-wrapper">
            <component :is="Component" />
          </div>
        </template>
        <template #fallback>
          <div class="app-loading">
            <div class="app-loading-spinner"></div>
            <div class="app-loading-text">正在加载游戏资源...</div>
          </div>
        </template>
      </Suspense>
    </router-view>

    <!-- 全局路由加载遮罩：在 Main 页面初始化期间显示，替代白屏 -->
    <LoadingOverlay :visible="showRouteLoading" />

    <!-- 服务器断开连接遮罩 -->
    <transition name="loading-overlay-fade">
      <div v-if="showDisconnectOverlay" class="disconnect-overlay">
        <div class="disconnect-overlay-content">
          <div class="disconnect-overlay-spinner"></div>
          <div class="disconnect-overlay-title">服务器已断开</div>
          <div class="disconnect-overlay-subtitle">正在返回登录页面...</div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script setup>
/**
 * @file 应用根组件
 * @description 管理全局路由 loading overlay，在 Main 页面初始化期间显示转圈动画替代白屏
 * @description 监听服务端断开事件，显示断开连接遮罩并延迟3秒跳转登录页
 */
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { apiService } from '@/services/ApiService'
import { startHeartbeat, stopHeartbeat, resetHeartbeat } from '@/services/HeartbeatService'

const gameStore = useGameStore()
const route = useRoute()
const router = useRouter()

/** 是否显示路由加载遮罩：仅在 Main 路由且 mainReady 为 false 时显示 */
const showRouteLoading = computed(() => {
  return route.path === '/main' && !gameStore.mainReady
})

/** 是否显示服务器断开连接遮罩 */
const showDisconnectOverlay = ref(false)

/** 断开连接跳转定时器 */
let disconnectTimer = null

/**
 * 处理服务端断开连接事件
 * 显示遮罩动画，3秒后清除认证并跳转登录页
 */
const handleServerDisconnected = () => {
  // 避免重复触发
  if (showDisconnectOverlay.value) return
  // 登录/注册页面有自己的 ServerStatusBar 组件，不需要全屏遮罩
  if (route.path === '/' || route.path === '/register') return

  showDisconnectOverlay.value = true

  // 3秒后清除认证并跳转登录页
  disconnectTimer = setTimeout(() => {
    // 清除认证信息（sessionStorage中的token等），避免路由守卫重定向到/select
    apiService.clearAuth()
    resetHeartbeat()
    router.push('/')
    showDisconnectOverlay.value = false
    disconnectTimer = null
  }, 3000)
}

/**
 * 路由变化时启停心跳检测
 * 进入游戏页面（非登录页）时启动，回到登录页时停止并重置
 */
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      stopHeartbeat()
    } else {
      startHeartbeat()
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('FlyFF Vue3 应用已启动')

  // 监听服务端断开连接事件
  window.addEventListener('server-disconnected', handleServerDisconnected)

})

onUnmounted(() => {
  window.removeEventListener('server-disconnected', handleServerDisconnected)
  stopHeartbeat()
  if (disconnectTimer) {
    clearTimeout(disconnectTimer)
    disconnectTimer = null
  }
})
</script>

<style>
  #app {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    overflow-x: hidden;
    overflow-y: hidden;
    user-select: none;
  }

  /* Suspense wrapper 确保单根节点且撑满容器 */
  .suspense-wrapper {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  /* Suspense fallback 加载动画样式 */
  .app-loading {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%);
    color: #fff;
  }

  .app-loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #6c9fff;
    border-radius: 50%;
    animation: app-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  .app-loading-text {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 2px;
  }

  @keyframes app-spin {
    to { transform: rotate(360deg); }
  }

  /* 服务器断开连接遮罩 */
  .disconnect-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    pointer-events: all;
  }

  .disconnect-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .disconnect-overlay-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #ff6b6b;
    border-right-color: #ff6b6b;
    border-radius: 50%;
    animation: app-spin 1s linear infinite;
    margin-bottom: 8px;
  }

  .disconnect-overlay-title {
    font-size: 20px;
    font-weight: 600;
    color: #ff6b6b;
    letter-spacing: 2px;
  }

  .disconnect-overlay-subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 1px;
  }

  .loading-overlay-fade-enter-active {
    transition: opacity 0.3s ease;
  }

  .loading-overlay-fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .loading-overlay-fade-enter-from,
  .loading-overlay-fade-leave-to {
    opacity: 0;
  }
</style>
