<template>
  <div class="register-container">
    <!-- 背景图片容器 -->
    <div class="bg-image-container">
      <img src="/pt/bg/zhuce_bg2.png" alt="注册背景" class="bg-image" @error="handleBgError" />
    </div>

    <AtmosphereEffect
      v-if="userSettings.showFestivalEffect !== false"
      text=""
      :theme="userSettings.themeColor"
      :decor-density="userSettings.festivalEffectDensity ?? 50"
      :full-screen="true"
    />

    <div class="register-box">
      <span class="register-festival-emoji">{{ registerEmoji }}</span>
      <div class="register-header">
        <h1>注册账号</h1>
        <p class="subtitle">创建您的飞飞账号</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名（3-12个字符）"
            maxlength="12"
            autocomplete="username"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码（6-20个字符）"
            maxlength="20"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            maxlength="20"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="email">邮箱（可选）</label>
          <input id="email" v-model="email" type="email" placeholder="请输入邮箱地址" />
        </div>

        <div class="form-actions">
          <button type="submit" class="register-btn" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <button type="button" class="back-btn" @click="goBack">返回登录</button>
        </div>

        <!-- 错误消息显示 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- 成功消息显示 -->
        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <div class="register-footer">
          <p class="tip">注册后请妥善保管您的账号信息</p>
        </div>
      </form>
    </div>

    <!-- 服务器状态通知条 -->
    <ServerStatusBar :enabled="true" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '@/services/ApiService'
import AtmosphereEffect from '@/components/AtmosphereEffect.vue'
import ServerStatusBar from '@/components/common/ServerStatusBar.vue'
import { useSettings } from '@/composables/useSettings'

const router = useRouter()
const { userSettings, loadSettings, resolveUiTheme } = useSettings()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const uiThemeKey = computed(() => resolveUiTheme(userSettings.value.themeColor))

const registerEmoji = computed(() => {
  if (uiThemeKey.value === 'christmas') {
    return '🎄'
  }
  if (uiThemeKey.value === 'spring') {
    return '🧧'
  }
  return '✨'
})

/** 清除消息提示 */
const clearMessage = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const handleRegister = async () => {
  // 清除之前的消息
  clearMessage()

  // 验证输入
  if (!username.value || !password.value || !confirmPassword.value) {
    errorMessage.value = '请填写所有必填字段'
    return
  }

  if (username.value.length < 3 || username.value.length > 12) {
    errorMessage.value = '用户名长度应为3-12个字符'
    return
  }

  if (password.value.length < 6 || password.value.length > 20) {
    errorMessage.value = '密码长度应为6-20个字符'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  if (email.value && !isValidEmail(email.value)) {
    errorMessage.value = '请输入有效的邮箱地址'
    return
  }

  loading.value = true

  try {
    // 调用后端API注册用户
    const result = await apiService.register(username.value, password.value, email.value)

    if (!result.success) {
      errorMessage.value = result.message || '注册失败，请重试'
      return
    }

    successMessage.value = '注册成功！正在跳转登录页面...'

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (error) {
    console.error('注册失败:', error)
    errorMessage.value = '无法连接服务器，请确认后端服务已启动'
  } finally {
    loading.value = false
  }
}

const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  loadSettings()
})

// 处理背景图片加载错误
const handleBgError = event => {
  console.error('背景图片加载失败:', event)
  // 可以在这里设置备用背景
  event.target.style.display = 'none'
}
</script>

<style scoped>
  .register-container {
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

  .register-box {
    background: rgba(26, 26, 46, 0.85);
    border-radius: 20px;
    padding: 0px 15px 15px;
    width: 333px;
    height: 450px;
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

  .register-festival-emoji {
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

  .register-header {
    text-align: center;
    margin-bottom: 14px;
  }

  .register-header h1 {
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

  .register-form {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .form-group {
    margin-bottom: 10px;
  }

  .form-group label {
    display: block;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    font-size: 13px;
  }

  .form-group input {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    transition: all 0.3s ease;
    box-sizing: border-box;
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
    margin-top: 12px;
  }

  .register-btn,
  .back-btn {
    flex: 1;
    padding: 8px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .register-btn {
    background: linear-gradient(45deg, #4a9eff, #6b83ff);
    color: white;
  }

  .register-btn:hover:not(:disabled) {
    background: linear-gradient(45deg, #6b83ff, #4a9eff);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(74, 158, 255, 0.3);
  }

  .register-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(255, 255, 255, 0.1);
  }

  .register-footer {
    text-align: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .tip {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-style: italic;
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

  /* 成功消息样式 */
  .success-message {
    margin-top: 8px;
    padding: 8px;
    background: rgba(87, 255, 87, 0.1);
    border: 1px solid rgba(87, 255, 87, 0.3);
    border-radius: 8px;
    color: #57ff57;
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

  /* 小屏幕适配 */
  @media (max-height: 550px) {
    .register-box {
      padding: 16px 16px 10px;
      max-width: 92%;
    }

    .register-header {
      margin-bottom: 8px;
    }

    .register-header h1 {
      font-size: 20px;
    }

    .form-group {
      margin-bottom: 6px;
    }

    .form-group input {
      padding: 6px 10px;
      font-size: 13px;
    }

    .form-actions {
      margin-top: 8px;
    }

    .register-btn,
    .back-btn {
      padding: 6px;
      font-size: 13px;
    }

    .register-footer {
      margin-top: 5px;
      padding-top: 5px;
    }
  }

  /* 响应式设计 */
  @media (max-width: 480px) {
    .register-box {
      padding: 20px 16px 12px;
    }

    .register-header h1 {
      font-size: 20px;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
