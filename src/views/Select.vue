<template>
  <div class="character-select">
    <!-- 背景图片容器 -->
    <div class="bg-image-container">
      <img src="/pt/bg/select.png" alt="选择角色背景" class="bg-image" @error="handleBgError" />
    </div>

    <AtmosphereEffect
      v-if="userSettings.showFestivalEffect !== false"
      text=""
      :theme="userSettings.themeColor"
      :decor-density="userSettings.festivalEffectDensity ?? 50"
      :full-screen="true"
    />
    <!-- 顶部控制栏 - 居中上方显示 -->
    <div class="top-control-bar">
      <div class="center-container">
        <div class="logo-container">
          <img src="/pt/fly/logo.png" alt="飞飞游戏" class="game-logo" />
        </div>
        <div class="volume-control">
          <label for="volumeControl">音量:</label>
          <input
            id="volumeControl"
            v-model="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            @input="updateVolume"
          />
          <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
        </div>
      </div>
    </div>

    <!-- 角色选择区域 -->
    <div id="characterSlots" class="character-slots">
      <span class="character-slots-emoji character-slots-emoji--top-left">
        {{ characterSlotEmojis[0] }}
      </span>
      <span class="character-slots-emoji character-slots-emoji--top-right">
        {{ characterSlotEmojis[1] }}
      </span>
      <span class="character-slots-emoji character-slots-emoji--bottom-left">
        {{ characterSlotEmojis[2] }}
      </span>
      <span class="character-slots-emoji character-slots-emoji--bottom-right">
        {{ characterSlotEmojis[3] }}
      </span>
      <!-- 现有角色槽位 -->
      <div
        v-for="(character, slotId) in characterSlots"
        :key="slotId"
        class="character-slot"
        @mouseenter="playCharacterVoice(character)"
      >
        <img
          :src="getCharacterAvatar(character)"
          :alt="character.nickname"
          class="character-avatar"
          @error="handleImageError"
        />
        <div class="character-info">
          <div class="character-name">{{ character.nickname }}</div>
          <div class="character-level">等级 {{ character.level || 1 }}</div>
          <div class="character-class">{{ getClassName(character.class) }}</div>
          <div class="character-time-info">
            <div class="create-time">创建时间: {{ formatTime(character.createTime) }}</div>
            <div class="last-login">最后登录: {{ formatTime(character.lastLoginTime) }}</div>
          </div>
          <div class="buttons">
            <button class="select-btn" :class="{ loading: isEnteringGame }" :disabled="isEnteringGame" @click="selectCharacter(slotId)">
              <span v-if="isEnteringGame" class="btn-loading-spinner"></span>
              <span v-else>进入游戏</span>
            </button>
            <button class="delete-btn" @click="deleteCharacter(slotId)">删除角色</button>
          </div>
        </div>
      </div>

      <!-- 空槽位 -->
      <div
        v-for="index in emptySlots"
        :key="'empty-' + index"
        class="character-slot empty"
        @click="createNewCharacter"
      >
        <a href="#" class="create-new" @click.prevent="createNewCharacter">+ 创建新角色</a>
      </div>
    </div>

    <!-- 背景音乐 -->
    <audio id="bgm" ref="bgmAudio" loop preload="auto">
      <source src="/music/BgmTh2Lachrymose.mp3" type="audio/mpeg" />
    </audio>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storageService } from '@/services/StorageService'
import AtmosphereEffect from '@/components/AtmosphereEffect.vue'
import { useSettings } from '@/composables/useSettings'
import { getClassAvatar, getClassName } from '@/data/classes'

const router = useRouter()
// storageService 已通过 import 导入全局单例
const { userSettings, loadSettings, resolveUiTheme } = useSettings()

// 响应式数据
const volume = ref(1.0)
const characterSlots = ref({})
const bgmAudio = ref(null)
const isEnteringGame = ref(false)

// 计算属性
const emptySlots = computed(() => {
  const usedSlots = Object.keys(characterSlots.value).length
  const maxSlots = 8
  return Math.max(0, maxSlots - usedSlots)
})

const uiThemeKey = computed(() => resolveUiTheme(userSettings.value.themeColor))

const characterSlotEmojis = computed(() => {
  if (uiThemeKey.value === 'christmas') {
    return ['🎄', '❄️', '🧦', '🎅']
  }
  if (uiThemeKey.value === 'spring') {
    return ['🧧', '🏮', '🎇', '🥟']
  }
  return ['✨', '✨', '✨', '✨']
})

// 职业语音配置（基于旧项目）
const jobVoiceMap = {
  beginner: {
    male: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav'],
    female: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav']
  },
  warrior: {
    male: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav'],
    female: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav']
  },
  priest: {
    male: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav'],
    female: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav']
  },
  mage: {
    male: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav'],
    female: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav']
  },
  archer: {
    male: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav'],
    female: ['/sound/default_atk1.wav', '/sound/default_dmg1.wav', '/sound/default_die1.wav']
  }
}

// 当前播放的音频对象
let currentVoice = null

// 生命周期钩子
onMounted(async () => {
  checkLogin()
  await loadCharacterSlots()
  initVolumeControl()
  playBackgroundMusic()
  loadSettings()
})

onUnmounted(() => {
  // 清理音频对象
  if (currentVoice) {
    currentVoice.pause()
    currentVoice = null
  }

  if (bgmAudio.value) {
    bgmAudio.value.pause()
  }
})

// 方法
function checkLogin () {
  const currentUser = storageService.getCurrentUser()
  if (!currentUser) {
    alert('请先登录！')
    router.push('/login')
    return false
  }
  return true
}

/**
 * 从后端 API 加载角色列表
 * 数据已迁移到后端，不再使用本地 userData.saveSlots（始终为空对象）
 */
async function loadCharacterSlots () {
  if (!checkLogin()) {
    return
  }

  try {
    const slots = await storageService.getAllSaveSlots()
    if (!slots || slots.length === 0) {
      // 没有角色，显示空槽位让用户创建
      characterSlots.value = {}
      return
    }

    // 将后端返回的数组转换为以 slotIndex 为 key 的对象
    const slotMap = {}
    for (const slot of slots) {
      slotMap[slot.slot] = {
        nickname: slot.nickname,
        class: slot.class,
        level: slot.level,
        sex: slot.sex || 'male',
        createTime: slot.createdAt,
        lastLoginTime: slot.createdAt
      }
    }
    characterSlots.value = slotMap
  } catch (error) {
    console.error('加载角色列表失败:', error)
    characterSlots.value = {}
  }
}

function getCharacterAvatar (character) {
  if (!character) {
    return '/pt/job_icon/cxz_nan_icon.png'
  }
  return getClassAvatar(character.class, character.sex)
}

function handleImageError (event) {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

function formatTime (timestamp) {
  if (!timestamp) {
    return '未知'
  }
  try {
    return new Date(timestamp).toLocaleString('zh-CN')
  } catch (error) {
    return '未知'
  }
}

// 随机获取数组中的一个元素
function getRandomVoice (voiceArray) {
  if (!voiceArray || !voiceArray.length) {
    return null
  }
  return voiceArray[Math.floor(Math.random() * voiceArray.length)]
}

// 播放职业语音
function playCharacterVoice (character) {
  if (!character) {
    return
  }

  // 如果有正在播放的语音，先停止
  if (currentVoice) {
    currentVoice.pause()
    currentVoice.currentTime = 0
  }

  const jobClass = character.class || 'beginner'
  const gender = character.sex || 'male'

  // 获取对应职业性别的语音数组
  const voiceArray = jobVoiceMap[jobClass]?.[gender]
  if (!voiceArray || !voiceArray.length) {
    return
  }

  // 随机选择一个语音文件
  const voicePath = getRandomVoice(voiceArray)
  if (!voicePath) {
    return
  }

  // 创建新的音频对象并播放
  currentVoice = new Audio(voicePath)
  currentVoice.volume = volume.value
  currentVoice.play().catch(error => {
    console.error('语音播放失败:', error)
  })
}

/**
 * 选择角色并进入游戏
 * 仅通知后端当前选中的存档槽，不预加载游戏数据
 * 游戏数据（ITEM_INFO、MONSTER_INFO 等重型文件）由 Main.vue 的 initGame() 自行加载
 * @param {number} slotId - 存档槽编号
 */
async function selectCharacter (slotId) {
  if (!checkLogin()) {
    return
  }

  // 防止重复点击
  if (isEnteringGame.value) {
    return
  }
  isEnteringGame.value = true

  const selectStartTime = performance.now()
  console.log(`[Select] 点击"进入游戏"，存档槽: ${slotId}`)

  try {
    // 通知后端选中的存档槽（仅此一个 API 调用，不预加载游戏数据）
    const apiStartTime = performance.now()
    const success = await storageService.selectSaveSlot(Number(slotId))
    console.log(`[Select] selectSaveSlot API 耗时: ${(performance.now() - apiStartTime).toFixed(1)}ms`)

    if (!success) {
      console.error('[Select] selectSaveSlot 返回失败，取消跳转')
      alert('选择角色失败，请重试！')
      isEnteringGame.value = false
      return
    }

    // 立即跳转到游戏主页面，不在此处预加载任何游戏数据
    // Main.vue 的 <script setup> 顶层 await ensureGameStores() + onMounted initGame() 负责加载游戏数据
    console.log(`[Select] 选择存档成功，立即跳转 /main，总耗时: ${(performance.now() - selectStartTime).toFixed(1)}ms`)
    router.push('/main')
  } catch (error) {
    console.error('[Select] 选择角色异常:', error)
    alert('选择角色失败，请重试！')
    isEnteringGame.value = false
  }
}

/**
 * 删除角色
 * 通过后端 API 删除角色并刷新列表
 * @param {number} slotId - 存档槽编号
 */
async function deleteCharacter (slotId) {
  if (!checkLogin()) {
    return
  }

  if (!confirm('确定要删除该角色吗？此操作不可恢复！')) {
    return
  }

  try {
    // 通过后端 API 删除角色
    const success = await storageService.deleteSaveSlot(Number(slotId))
    if (success) {
      // 重新加载角色槽位
      await loadCharacterSlots()
      alert('角色删除成功！')
    } else {
      alert('角色删除失败！')
    }
  } catch (error) {
    console.error('删除角色失败:', error)
    alert('角色删除失败！')
  }
}

function createNewCharacter () {
  if (!checkLogin()) {
    return
  }

  // 检查存档数量限制
  const usedSlots = Object.keys(characterSlots.value).length
  if (usedSlots >= 8) {
    alert('已达到最大存档数量（8个）！')
    return
  }

  // 跳转到创建页面
  router.push('/create')
}

function initVolumeControl () {
  // 从本地存储获取保存的音量设置
  const savedVolume = localStorage.getItem('backgroundMusicVolume')
  if (savedVolume !== null) {
    volume.value = parseFloat(savedVolume)
  }
}

function updateVolume () {
  // 更新背景音乐音量
  if (bgmAudio.value) {
    bgmAudio.value.volume = volume.value
  }

  // 保存音量设置
  localStorage.setItem('backgroundMusicVolume', volume.value.toString())
}

function playBackgroundMusic () {
  if (!bgmAudio.value) {
    return
  }

  // 设置音量
  bgmAudio.value.volume = volume.value

  // 尝试播放背景音乐
  bgmAudio.value.play().catch(error => {
    console.log('背景音乐播放失败:', error)

    // 添加点击事件监听器以解决自动播放限制问题
    const initAudio = () => {
      if (bgmAudio.value) {
        bgmAudio.value.play().catch(e => {
          console.log('播放失败:', e)
        })
      }
      document.removeEventListener('click', initAudio)
    }

    document.addEventListener('click', initAudio)
  })
}

// 处理背景图片加载错误
const handleBgError = event => {
  console.error('背景图片加载失败:', event)
  // 可以在这里设置备用背景
  event.target.style.display = 'none'
}
</script>

<style scoped>
  /* 基于旧项目的CSS样式 */
  .character-select {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #000; /* 备用背景色 */
  }

  /* 背景图片容器 */
  .bg-image-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 0;
    pointer-events: none;
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

  .character-slots {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 10px;
    max-width: 1038px;
    width: calc(100% - 40px);
    margin: 125px auto 20px;
    z-index: 1; /* 确保在背景之上 */
    position: relative;
    box-sizing: border-box;
  }

  .character-slots-emoji {
    position: absolute;
    font-size: 24px;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
  }

  .character-slots-emoji--top-left {
    top: -10px;
    left: -10px;
  }

  .character-slots-emoji--top-right {
    top: -10px;
    right: -10px;
  }

  .character-slots-emoji--bottom-left {
    bottom: -10px;
    left: -10px;
  }

  .character-slots-emoji--bottom-right {
    bottom: -10px;
    right: -10px;
  }

  .character-slot {
    position: relative;
    padding: 15px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 200px;
    box-sizing: border-box;
  }

  .character-slot:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
  }

  .character-slot.empty {
    border: 2px dashed rgba(255, 255, 255, 0.3);
    justify-content: center;
    min-height: 200px;
  }

  .character-avatar {
    width: 75%;
    height: 75%;
    border-radius: 10%;
    margin-bottom: 10px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .character-avatar:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.685);
    border: 1px solid #76faff;
  }

  .character-info {
    color: white;
    text-align: center;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .character-name {
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .character-level {
    font-size: 13px;
    color: #4caf50;
    margin-bottom: 2px;
  }

  .character-class {
    font-size: 12px;
    color: #87ceeb;
    margin-bottom: 8px;
  }

  .character-time-info {
    font-size: 10px;
    color: #aaa;
    margin: 4px 0;
    padding: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  .create-time,
  .last-login {
    margin: 1px 0;
    font-size: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
  }

  .select-btn,
  .delete-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    min-width: 70px;
  }

  .select-btn {
    background: #4caf50;
    color: white;
  }

  .select-btn:hover {
    background: #45a049;
  }

  .select-btn.loading {
    background: #7a7a7a;
    cursor: wait;
    opacity: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .btn-loading-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .delete-btn {
    background: #ff4444;
    color: white;
  }

  .delete-btn:hover {
    background: #cc0000;
  }

  .create-new {
    color: #ffd700;
    font-size: 18px;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
  }

  .create-new:hover {
    color: #fff;
  }

  /* 顶部控制栏样式 - 居中上方显示 */
  .top-control-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px 20px;
    background: rgba(0, 0, 0, 0.8);
    z-index: 2;
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
    animation: fadeInDown 0.5s ease-out;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 居中容器 */
  .center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    max-width: 800px;
    width: 100%;
  }

  .logo-container {
    display: flex;
    justify-content: center;
  }

  .game-logo {
    height: 50px;
    width: auto;
    filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.7));
    animation: rotateLogo 5s linear infinite;
    transition: transform 0.3s ease;
  }

  .game-logo:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 12px rgba(255, 215, 0, 0.9));
  }

  @keyframes rotateLogo {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .volume-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 15px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    width: 100%;
    max-width: 350px;
    box-sizing: border-box;
  }

  .volume-control label {
    color: #ffd700;
    font-size: 14px;
    text-shadow: 0 0 3px rgba(255, 215, 0, 0.5);
    white-space: nowrap;
  }

  .volume-control input[type='range'] {
    -webkit-appearance: none;
    width: 150px;
    height: 5px;
    background: linear-gradient(to right, #ffd700, #ff6b6b);
    border-radius: 5px;
    outline: none;
    flex: 1;
    max-width: 180px;
  }

  .volume-control input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    background: #ffd700;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .volume-control input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }

  .volume-value {
    color: #ffd700;
    font-size: 12px;
    min-width: 40px;
    text-align: center;
    font-weight: bold;
    text-shadow: 0 0 3px rgba(255, 215, 0, 0.5);
  }

  /* 响应式调整背景图片 */
  @media (max-width: 768px) {
    .bg-image {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
  }

  /* 响应式设计 */
  @media (max-width: 1200px) {
    .character-slots {
      grid-template-columns: repeat(3, 1fr);
      max-width: 900px;
    }
  }

  @media (max-width: 900px) {
    .character-slots {
      grid-template-columns: repeat(2, 1fr);
      max-width: 600px;
    }

    .game-logo {
      height: 45px;
    }

    .volume-control {
      max-width: 300px;
    }

    .volume-control input[type='range'] {
      max-width: 150px;
    }
  }

  @media (max-width: 600px) {
    .character-slots {
      grid-template-columns: repeat(2, 1fr);
      max-width: 100%;
      gap: 10px;
      padding: 10px;
      margin: 90px 10px 10px;
    }

    .character-slot {
      padding: 10px;
      min-height: 180px;
    }

    .character-avatar {
      height: 80px;
    }

    .character-name {
      font-size: 14px;
    }

    .character-level {
      font-size: 12px;
    }

    .character-class {
      font-size: 11px;
    }

    .character-time-info {
      display: none;
    }

    .buttons {
      flex-direction: column;
      gap: 4px;
    }

    .select-btn,
    .delete-btn {
      padding: 5px 10px;
      font-size: 11px;
      min-width: 60px;
    }

    .top-control-bar {
      padding: 6px 10px;
    }

    .center-container {
      gap: 6px;
    }

    .game-logo {
      height: 40px;
    }

    .volume-control {
      padding: 6px 12px;
      max-width: 280px;
    }

    .volume-control input[type='range'] {
      max-width: 120px;
    }

    .volume-control label {
      font-size: 12px;
    }

    .volume-value {
      font-size: 11px;
      min-width: 35px;
    }
  }

  /* 超小屏幕（如手机竖屏） */
  @media (max-width: 400px) {
    .character-slots {
      grid-template-columns: 1fr;
    }

    .character-slot {
      min-height: 150px;
    }

    .character-avatar {
      height: 70px;
    }

    .create-new {
      font-size: 16px;
    }
  }
</style>
