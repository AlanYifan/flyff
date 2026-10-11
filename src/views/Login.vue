<template>
  <div class="login-container" @click="initAudio">
    <!-- 背景音乐 -->
    <audio id="bgm" ref="bgmAudio" loop preload="auto">
      <source src="/music/login.mp3" type="audio/mpeg" />
      您的浏览器不支持音频播放。
    </audio>

    <!-- 背景图片容器 -->
    <div class="bg-image-container">
      <img src="/pt/bg/login_bg.jpg" alt="登录背景" class="bg-image" @error="handleBgError" />
    </div>

    <AtmosphereEffect
      v-if="userSettings.showFestivalEffect !== false"
      text=""
      :theme="userSettings.themeColor"
      :decor-density="userSettings.festivalEffectDensity ?? 50"
      :full-screen="true"
    />

    <!-- 旋转logo动画 - 纯装饰性，用户无法交互 -->
    <div class="rotating-logo">
      <img
        src="/pt/fly/logo.png"
        alt="游戏logo（装饰性）"
        class="login-logo"
        @error="handleLogoError"
      />
    </div>

    <div v-if="!showLore" class="login-box">
      <span class="login-festival-emoji">{{ loginEmoji }}</span>
      <div class="login-header">
        <h1>Fly For Fun</h1>
        <p class="subtitle">飞飞</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
            @input="clearError"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            @input="clearError"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
          <button type="button" class="register-btn" @click="goToRegister">注册账号</button>
        </div>

        <!-- 错误消息显示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="login-footer">
          <button type="button" class="lore-button" @click="openLore">背景故事</button>
          <p class="version">当前版本: 1.9.1</p>

          <!-- 音量控制 -->
          <div class="volume-control">
            <label for="volumeSlider">音量:</label>
            <input
              id="volumeSlider"
              type="range"
              min="0"
              max="1"
              step="0.1"
              :value="bgmAudio?.volume || 1"
              @input="e => setVolume(e.target.value)"
            />
            <span class="volume-value">{{ Math.round((bgmAudio?.volume || 1) * 100) }}%</span>
          </div>
        </div>
      </form>
    </div>

    <div class="login-background">
      <div class="bg-animation"></div>
    </div>

    <LoreAnimation v-if="showLore" @close="handleLoreClose" @complete="handleLoreComplete" />

    <!-- 服务器状态通知条 -->
    <ServerStatusBar :enabled="true" />

    <!-- 音乐播放提示 -->
    <div v-if="!audioInitialized" class="music-hint">
      <p>点击页面任意位置开始播放背景音乐</p>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store'
import { apiService } from '@/services/ApiService'
import LoreAnimation from '@/components/LoreAnimation.vue'
import AtmosphereEffect from '@/components/AtmosphereEffect.vue'
import ServerStatusBar from '@/components/common/ServerStatusBar.vue'
import { useSettings } from '@/composables/useSettings'

const router = useRouter()
const gameStore = useGameStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const bgmAudio = ref(null)
const audioInitialized = ref(false)
const showLore = ref(false)
const { userSettings, loadSettings, resolveUiTheme } = useSettings()

const uiThemeKey = computed(() => resolveUiTheme(userSettings.value.themeColor))

const loginEmoji = computed(() => {
  if (uiThemeKey.value === 'christmas') {
    return '🎄'
  }
  if (uiThemeKey.value === 'spring') {
    return '🧧'
  }
  return '✨'
})

const handleLogin = async () => {
  // 清除之前的错误消息
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true

  try {
    // 调用后端API验证用户登录
    const result = await apiService.login(username.value, password.value)

    if (!result.success) {
      errorMessage.value = result.message || '无法连接服务器，请重试'
      return
    }

    // 更新玩家信息
    gameStore.updatePlayer({
      nickname: username.value
    })

    // 直接跳转到角色选择页面
    // 游戏数据（ITEM_INFO/MONSTER_INFO 等）由 Main.vue 初始化时自行加载，无需在登录页预加载
    router.push('/select')
  } catch (error) {
    console.error('登录异常:', error)
    errorMessage.value = '无法连接服务器，请确认后端服务已启动'
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  router.push('/register')
}

const openLore = () => {
  showLore.value = true
}

const handleLoreClose = () => {
  showLore.value = false
}

const handleLoreComplete = () => {
  showLore.value = false
}

// 处理背景图片加载错误
const handleBgError = event => {
  console.error('背景图片加载失败:', event)
  // 可以在这里设置备用背景
  event.target.style.display = 'none'
}

// 处理logo图片加载错误
const handleLogoError = event => {
  console.error('Logo图片加载失败:', event)
  // 可以在这里设置备用logo
  event.target.style.display = 'none'
}

// 清除错误消息
const clearError = () => {
  errorMessage.value = ''
}

// 生命周期钩子
onMounted(() => {
  loadSettings()
  // 设置音频音量
  if (bgmAudio.value) {
    bgmAudio.value.volume = 1.0
  }

  // 从本地存储获取音量设置
  const savedVolume = localStorage.getItem('backgroundMusicVolume')
  if (savedVolume !== null && bgmAudio.value) {
    bgmAudio.value.volume = parseFloat(savedVolume)
  }
})

onUnmounted(() => {
  // 页面卸载时暂停音乐
  if (bgmAudio.value) {
    bgmAudio.value.pause()
  }
})

// 初始化音频播放
const initAudio = () => {
  if (audioInitialized.value || !bgmAudio.value) {
    return
  }

  audioInitialized.value = true

  bgmAudio.value
    .play()
    .then(() => {
      console.log('背景音乐开始播放')
    })
    .catch(error => {
      console.log('音乐播放失败:', error)

      // 如果自动播放失败，等待用户再次点击
      audioInitialized.value = false
    })
}

// 音量控制（如果需要可以添加音量滑块）
const setVolume = volume => {
  if (bgmAudio.value) {
    bgmAudio.value.volume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('backgroundMusicVolume', bgmAudio.value.volume.toString())
  }
}
</script>

<style scoped>
  .login-container {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    background-color: #000; /* 备用背景色 */
  }

  /* 背景图片容器 */
  .bg-image-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 0;
  }

  /* 背景图片 */
  .bg-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    opacity: 0.9;
  }

  /* 旋转logo容器 - 居中上方显示 */
  .rotating-logo {
    position: absolute;
    top: 50px;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 150px;
    z-index: 2; /* 确保在背景之上 */
    display: flex;
    align-items: center;
    justify-content: center;
    /* 禁用用户交互 */
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* 旋转logo图片 */
  .login-logo {
    width: 50%;
    height: 50%;
    transform-origin: center center;
    animation: rotate360 3s linear infinite;
    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7));
    opacity: 1; /* 确保不透明 */
    /* 禁用用户交互 */
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    /* 防止拖拽 */
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
  }

  /* 旋转动画 */
  @keyframes rotate360 {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .login-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    background: rgba(0, 0, 0, 0.3); /* 添加半透明遮罩让文字更清晰 */
  }

  .bg-animation {
    position: absolute;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(circle at 20% 50%, rgba(74, 158, 255, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(107, 255, 193, 0.05) 0%, transparent 50%);
    animation: bgMove 20s infinite alternate ease-in-out;
  }

  @keyframes bgMove {
    0% {
      transform: scale(1) rotate(0deg);
    }
    100% {
      transform: scale(1.2) rotate(10deg);
    }
  }

  .login-box {
    background: rgba(26, 26, 46, 0.85);
    border-radius: 20px;
    padding: 24px 20px 16px;
    width: 320px;
    max-width: 90%;
    max-height: 90vh;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(15px);
    z-index: 1;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .login-festival-emoji {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 28px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
  }

  .login-header {
    text-align: center;
    margin-bottom: 10px;
  }

  .login-header h1 {
    font-size: 24px;
    font-weight: bold;
    background: linear-gradient(45deg, #4a9eff, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .form-group {
    margin-bottom: 8px;
  }

  .form-group label {
    display: block;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
  }

  .form-group input {
    width: 95%;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #4a9eff;
    box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }

  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .login-btn,
  .register-btn {
    flex: 1;
    padding: 8px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .login-btn {
    background: linear-gradient(45deg, #4a9eff, #6b83ff);
    color: white;
  }

  .login-btn:hover:not(:disabled) {
    background: linear-gradient(45deg, #6b83ff, #4a9eff);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(74, 158, 255, 0.3);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .register-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .register-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(255, 255, 255, 0.1);
  }

  /* 错误消息样式 */
  .error-message {
    margin-top: 8px;
    padding: 8px;
    background: rgba(255, 87, 87, 0.1);
    border: 1px solid rgba(255, 87, 87, 0.3);
    border-radius: 8px;
    color: #ff5757;
    font-size: 13px;
    text-align: center;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .login-footer {
    text-align: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .lore-button {
    width: 100%;
    padding: 5px 0;
    margin-bottom: 4px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    color: #ffffff;
    background: linear-gradient(45deg, #9a6a3a, #c58b5a);
    transition: all 0.3s ease;
  }

  .lore-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(197, 139, 90, 0.35);
  }

  .version {
    color: rgba(255, 255, 255, 0.6);
    font-size: 11px;
    margin-bottom: 2px;
  }

  .tip {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-style: italic;
    margin-bottom: 10px;
  }

  /* 音量控制样式 */
  .volume-control {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .volume-control label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    min-width: 36px;
  }

  .volume-control input[type='range'] {
    flex: 1;
    -webkit-appearance: none;
    height: 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    outline: none;
  }

  .volume-control input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    background: #4a9eff;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .volume-control input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
  }

  .volume-value {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    min-width: 36px;
    text-align: right;
  }

  /* 小屏幕适配 */
  @media (max-height: 600px) {
    .login-box {
      padding: 16px 16px 10px;
      max-width: 92%;
    }

    .login-header {
      margin-bottom: 6px;
    }

    .login-header h1 {
      font-size: 20px;
    }

    .form-group {
      margin-bottom: 5px;
    }

    .form-group input {
      padding: 6px 10px;
      font-size: 14px;
    }

    .form-actions {
      margin-top: 6px;
    }

    .login-btn,
    .register-btn {
      padding: 6px;
      font-size: 13px;
    }

    .login-footer {
      margin-top: 5px;
      padding-top: 5px;
    }

    .volume-control {
      margin-top: 2px;
      padding-top: 2px;
    }
  }

  /* 响应式调整背景图片 */
  @media (max-width: 768px) {
    .bg-image {
      object-fit: cover; /* 在小屏幕上使用cover确保完全覆盖 */
      width: 100%;
      height: 100%;
    }
  }

  @media (min-width: 769px) and (max-width: 1200px) {
    .bg-image {
      object-fit: contain;
    }
  }

  @media (min-width: 1201px) {
    .bg-image {
      object-fit: contain;
    }
  }

  /* 确保图片在超宽屏幕上也能居中 */
  @media (min-aspect-ratio: 16/9) {
    .bg-image {
      object-fit: contain;
      width: auto;
      height: 100%;
    }
  }

  @media (max-aspect-ratio: 4/3) {
    .bg-image {
      object-fit: cover;
      width: 100%;
      height: auto;
    }
  }

  /* 响应式调整旋转logo */
  @media (max-width: 768px) {
    .rotating-logo {
      width: 120px;
      height: 120px;
      top: 30px;
    }

    .login-logo {
      filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.7));
    }
  }

  @media (max-width: 480px) {
    .rotating-logo {
      width: 100px;
      height: 100px;
      top: 20px;
    }

    .login-logo {
      filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.7));
    }
  }

  /* 大屏幕优化 */
  @media (min-width: 1440px) {
    .rotating-logo {
      width: 180px;
      height: 180px;
      top: 60px;
    }

    .login-logo {
      filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.7));
    }
  }
</style>
