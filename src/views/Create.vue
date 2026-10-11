<template>
  <div class="create-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-particle particle-1"></div>
      <div class="bg-particle particle-2"></div>
      <div class="bg-particle particle-3"></div>
    </div>

    <!-- 页面顶部标题 -->
    <div class="header-section">
      <img
        class="game-logo"
        src="/pt/fly/Flyff.png"
        alt="Flyff Logo"
        @click="toggleMusic"
      />
      <h1 class="page-title">创建角色</h1>
      <p class="page-subtitle">选择你的命运，开启冒险之旅</p>
    </div>

    <div class="create-character-container">
      <!-- 左侧职业选择区 -->
      <div class="class-selection-panel">
        <div class="panel-header">
          <span class="panel-icon">⚔</span>
          <span class="panel-title">选择职业</span>
        </div>
        <div class="class-list">
          <button
            class="class-button"
            :class="{ selected: selectedClass === 'beginner' }"
            @click="selectClass('beginner')"
          >
            <div class="class-icon-wrapper">
              <img src="/pt/job_icon/cxz_nan_icon.png" alt="初心者" />
            </div>
            <div class="class-info">
              <span class="class-name">初心者</span>
              <span class="class-tag">新手推荐</span>
            </div>
            <div class="selection-indicator"></div>
          </button>
        </div>
      </div>

      <!-- 中间角色预览区 -->
      <div class="character-preview-panel">
        <!-- 角色展示区 -->
        <div class="preview-display">
          <div class="preview-frame">
            <img
              :src="characterPreviewImage"
              alt="角色预览"
              @error="handleImageError"
            />
            <div class="frame-corner top-left"></div>
            <div class="frame-corner top-right"></div>
            <div class="frame-corner bottom-left"></div>
            <div class="frame-corner bottom-right"></div>
          </div>
        </div>

        <!-- 职业信息 -->
        <div class="class-details">
          <h2 class="class-title">{{ selectedClassName }}</h2>
          <p class="class-description">{{ selectedClassDescription }}</p>
        </div>

        <!-- 性别选择 -->
        <div class="gender-section">
          <div class="section-header">
            <span class="section-icon">⚥</span>
            <span class="section-title">选择性别</span>
          </div>
          <div class="gender-options">
            <button
              class="gender-button"
              :class="{ selected: selectedGender === 'male' }"
              :disabled="!selectedClass"
              @click="selectGender('male')"
            >
              <span class="gender-icon">♂</span>
              <span class="gender-text">{{ maleGenderName }}</span>
            </button>
            <button
              class="gender-button"
              :class="{ selected: selectedGender === 'female' }"
              :disabled="!selectedClass"
              @click="selectGender('female')"
            >
              <span class="gender-icon">♀</span>
              <span class="gender-text">{{ femaleGenderName }}</span>
            </button>
          </div>
        </div>

        <!-- 名称输入 -->
        <div class="nickname-section">
          <div class="section-header">
            <span class="section-icon">✒</span>
            <span class="section-title">角色名称</span>
          </div>
          <div class="nickname-input-wrapper">
            <input
              id="nickname"
              v-model="characterName"
              type="text"
              placeholder="请输入2-5个字符"
              maxlength="5"
              class="nickname-input"
            />
            <button class="random-name-btn" @click="generateRandomName">
              <span class="btn-icon">🎲</span>
              随机
            </button>
          </div>
          <div class="nickname-hint">
            <span :class="{ valid: characterName.length >= 2 && characterName.length <= 5 }">
              {{ characterName.length }}/5 字符
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧确认按钮区 -->
      <div class="confirmation-panel">
        <div class="panel-header">
          <span class="panel-icon">📜</span>
          <span class="panel-title">确认创建</span>
        </div>
        <div class="confirmation-content">
          <div class="summary-item">
            <span class="summary-label">职业</span>
            <span class="summary-value">{{ selectedClassName }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">性别</span>
            <span class="summary-value">{{ selectedGender === 'male' ? '男' : '女' }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">名称</span>
            <span class="summary-value">{{ characterName || '未设置' }}</span>
          </div>
          <button
            class="confirm-button"
            :class="{ enabled: canCreate, loading: isCreating }"
            :disabled="!canCreate || isCreating"
            @click="confirmCharacter"
          >
            <span v-if="isCreating" class="loading-spinner"></span>
            <span v-else class="btn-text">{{ canCreate ? '确认创建' : '请完善信息' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部装饰 -->
    <div class="footer-decoration">
      <div class="footer-line"></div>
      <span class="footer-text">点击顶部图标可切换背景音乐</span>
    </div>

    <!-- 背景音乐 -->
    <audio id="bgm" ref="bgmAudio" loop preload="auto">
      <source src="/music/create.mp3" type="audio/mpeg" />
      您的浏览器不支持音频播放。
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storageService } from '@/services/StorageService'
import { CLASS_CONFIG } from '@/data/classes'
import { generateRPGName } from '@/utils/randomNameGenerator'

const router = useRouter()
// storageService 通过 import 导入全局单例

// 响应式数据
const selectedClass = ref('beginner')
const selectedGender = ref('male')
const characterName = ref('')
const bgmAudio = ref(null)
const isMusicPlaying = ref(true)
const isCreating = ref(false)

// 计算属性
const selectedClassData = computed(() => {
  return CLASS_CONFIG[selectedClass.value] || CLASS_CONFIG.beginner
})

const selectedClassName = computed(() => {
  return selectedClassData.value.name
})

const selectedClassDescription = computed(() => {
  return selectedClassData.value.description
})

const characterPreviewImage = computed(() => {
  if (
    selectedClassData.value.jobInfoImage &&
    selectedClassData.value.jobInfoImage[selectedGender.value]
  ) {
    return selectedClassData.value.jobInfoImage[selectedGender.value]
  } else if (
    selectedClassData.value.genderAvatars &&
    selectedClassData.value.genderAvatars[selectedGender.value]
  ) {
    return selectedClassData.value.genderAvatars[selectedGender.value]
  }
  return '/pt/job_icon/cxz_nan_icon.png'
})

const maleGenderName = computed(() => {
  return selectedClassData.value.genderNames?.male || `男${selectedClassName.value}`
})

const femaleGenderName = computed(() => {
  return selectedClassData.value.genderNames?.female || `女${selectedClassName.value}`
})

const canCreate = computed(() => {
  const nameLen = characterName.value.trim().length
  return (
    nameLen >= 2 &&
    nameLen <= 5 &&
    selectedGender.value !== null &&
    selectedClass.value !== null
  )
})

// 生命周期钩子
onMounted(() => {
  checkLogin()
  loadSavedClass()
  playBackgroundMusic()
})

onUnmounted(() => {
  if (bgmAudio.value) {
    bgmAudio.value.pause()
  }
})

/**
 * 检查用户登录状态
 * @returns {boolean} 是否已登录
 */
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
 * 加载保存的职业选择
 */
function loadSavedClass () {
  if (!checkLogin()) {
    return
  }

  const savedClass = storageService.getUserField('selectedClass')
  if (savedClass && CLASS_CONFIG[savedClass]) {
    selectClass(savedClass)
  } else {
    selectClass('beginner')
  }
}

/**
 * 选择职业
 * @param {string} className - 职业名称
 */
function selectClass (className) {
  selectedClass.value = className
  // 使用 saveUserField 保存到本地（不依赖存档槽，创建角色时尚未选择存档）
  storageService.saveUserField('selectedClass', className)
}

/**
 * 选择性别
 * @param {string} gender - 性别
 */
function selectGender (gender) {
  selectedGender.value = gender
}

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 */
function handleImageError (event) {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

/**
 * 生成随机名称
 * 根据当前选择的性别，使用RPG风格的中文随机名称生成器生成2-5字的角色名
 */
function generateRandomName () {
  characterName.value = generateRPGName(selectedGender.value)
}

/**
 * 确认创建角色
 */
async function confirmCharacter () {
  // 防止重复点击
  if (isCreating.value) {
    return
  }

  if (!checkLogin()) {
    return
  }

  if (!canCreate.value) {
    alert('请填写完整的角色信息！')
    return
  }

  if (!selectedGender.value) {
    alert('请选择角色性别！')
    return
  }

  // 设置创建中状态
  isCreating.value = true

  // 创建角色数据
  const characterData = {
    nickname: characterName.value.trim(),
    class: selectedClass.value,
    sex: selectedGender.value,
    level: 1,
    exp: 0,
    maxExp: 100,
    gold: 1000,
    bankGold: 0,
    maxHealth: selectedClassData.value.baseStats.hp,
    currentHealth: selectedClassData.value.baseStats.hp,
    maxMana: selectedClassData.value.baseStats.mp,
    currentMana: selectedClassData.value.baseStats.mp,
    minAttack: 5,
    maxAttack: 10,
    minDefense: 1,
    maxDefense: 10,
    criticalRate: 0.05,
    criticalDamage: 0,
    attackSpeed: 0.3,
    hitRate: 0,
    lifeSteal: 0,
    blockRate: 0,
    dodgeRate: 0,
    stun: 0,
    decreasedCastingTime: 0,
    pveAttackBonus: 0,
    pveDefenseBonus: 0,
    availableBagSlots: 35,
    fireAttack: 0,
    waterAttack: 0,
    thunderAttack: 0,
    windAttack: 0,
    earthAttack: 0,
    stats: {
      strength: selectedClassData.value.baseStats.strength,
      agility: selectedClassData.value.baseStats.agility,
      intelligence: selectedClassData.value.baseStats.intelligence,
      constitution: selectedClassData.value.baseStats.constitution,
      freePoints: selectedClassData.value.baseStats.freePoints
    },

    quest: {
      activeQuests: [],
      completedQuests: []
    },
    bag: [],
    equipmentBag: [],
    bankBag: [],
    skills: {},
    equipment: {
      weapon: null,
      shield: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      earring1: null,
      earring2: null
    },
    createTime: new Date().toISOString(),
    lastLoginTime: new Date().toISOString()
  }

  try {
    // 创建新角色
    const success = await storageService.createNewCharacter(characterData)

    if (success) {
      // 清理临时保存的职业选择
      storageService.saveUserField('selectedClass', null)

      // 直接跳转到游戏主页面
      // 游戏数据由 Main.vue 的 initGame() 自行加载，不需要在此等待
      router.push('/main')
    } else {
      alert('角色创建失败！请检查存档数量是否已满。')
      isCreating.value = false
    }
  } catch (error) {
    console.error('角色创建失败:', error)
    alert('角色创建失败！请稍后重试。')
    isCreating.value = false
  }
}

/**
 * 切换背景音乐
 */
function toggleMusic () {
  if (!bgmAudio.value) {
    return
  }

  if (isMusicPlaying.value) {
    bgmAudio.value.pause()
  } else {
    bgmAudio.value.play().catch(error => {
      console.log('播放失败:', error)
    })
  }

  isMusicPlaying.value = !isMusicPlaying.value
}

/**
 * 播放背景音乐
 */
function playBackgroundMusic () {
  if (!bgmAudio.value) {
    return
  }

  bgmAudio.value.play().catch(error => {
    console.log('背景音乐播放失败:', error)

    const initAudio = () => {
      bgmAudio.value.play().catch(e => {
        console.log('播放失败:', e)
      })
      document.removeEventListener('click', initAudio)
    }

    document.addEventListener('click', initAudio)
  })
}
</script>

<style scoped>
/* ========== 全局变量 ========== */
:root {
  --rpg-gold: #d4af37;
  --rpg-gold-light: #f4d03f;
  --rpg-gold-dark: #b8960c;
  --rpg-brown: #8b4513;
  --rpg-brown-light: #a0522d;
  --rpg-cream: #f5f5dc;
  --rpg-parchment: #fcf5e5;
  --rpg-border: #8b7355;
  --rpg-shadow: rgba(0, 0, 0, 0.3);
  --rpg-glow: rgba(212, 175, 55, 0.5);
}

/* ========== 主容器 ========== */
.create-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #3d2b1f 0%, #5a4030 50%, #3d2b1f 100%);
  background-image:
    linear-gradient(180deg, rgba(61, 43, 31, 0.85) 0%, rgba(90, 64, 48, 0.75) 50%, rgba(61, 43, 31, 0.85) 100%),
    url('/pt/bg/select_bg.png');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}

/* ========== 背景装饰 ========== */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--rpg-gold);
  border-radius: 50%;
  opacity: 0.3;
  animation: float 8s infinite ease-in-out;
}

.particle-1 {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.particle-2 {
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.particle-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.5);
    opacity: 0.6;
  }
}

/* ========== 顶部标题区 ========== */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px 20px;
  position: relative;
  z-index: 10;
}

.game-logo {
  width: 100px;
  height: 80px;
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
}

.game-logo:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.8));
}

.page-title {
  font-size: 32px;
  font-weight: bold;
  color: var(--rpg-gold);
  text-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 20px rgba(212, 175, 55, 0.3);
  margin: 10px 0 5px;
  letter-spacing: 4px;
  font-family: 'Georgia', serif;
}

.page-subtitle {
  font-size: 14px;
  color: var(--rpg-cream);
  opacity: 0.7;
  letter-spacing: 2px;
}

/* ========== 主内容区 ========== */
.create-character-container {
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 20px;
  flex: 1;
  align-items: start;
}

/* ========== 面板通用样式 ========== */
.class-selection-panel,
.confirmation-panel {
  background: linear-gradient(180deg, rgba(252, 245, 229, 0.95) 0%, rgba(245, 235, 220, 0.92) 100%);
  border: 2px solid var(--rpg-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 15px;
  background: linear-gradient(180deg, rgba(139, 115, 85, 0.9) 0%, rgba(110, 90, 65, 0.9) 100%);
  border-bottom: 1px solid var(--rpg-border);
}

.panel-icon {
  font-size: 16px;
}

.panel-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--rpg-gold);
  letter-spacing: 1px;
}

/* ========== 职业选择 ========== */
.class-list {
  padding: 10px;
}

.class-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 240, 230, 0.9) 100%);
  border: 1px solid rgba(139, 115, 85, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.class-button:hover {
  background: linear-gradient(180deg, rgba(255, 250, 240, 1) 0%, rgba(250, 245, 235, 1) 100%);
  border-color: var(--rpg-gold-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.class-button.selected {
  background: linear-gradient(180deg, rgba(255, 245, 200, 0.95) 0%, rgba(255, 240, 180, 0.9) 100%);
  border-color: var(--rpg-gold);
  box-shadow:
    0 0 15px rgba(212, 175, 55, 0.25),
    inset 0 0 20px rgba(212, 175, 55, 0.1);
}

.class-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 115, 85, 0.3) 0%, rgba(180, 150, 100, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(212, 175, 55, 0.5);
  flex-shrink: 0;
}

.class-icon-wrapper img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.class-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.class-name {
  font-size: 14px;
  font-weight: bold;
  color: #4a3c2a;
}

.class-tag {
  font-size: 10px;
  color: var(--rpg-gold);
  opacity: 0.8;
}

.selection-indicator {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rpg-gold);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.class-button.selected .selection-indicator {
  opacity: 1;
  box-shadow: 0 0 10px var(--rpg-gold);
}

/* ========== 角色预览区 ========== */
.character-preview-panel {
  height: 600px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(252, 245, 229, 0.95) 0%, rgba(245, 235, 220, 0.92) 100%);
  border: 2px solid var(--rpg-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.preview-display {
  flex: 1;
  padding: 20px;
  min-height: 0;
  background: linear-gradient(180deg, rgba(255, 250, 240, 0.8) 0%, rgba(250, 245, 235, 0.6) 100%);
}

.preview-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid var(--rpg-border);
  border-radius: 4px;
  overflow: hidden;
  background: radial-gradient(ellipse at center, rgba(255, 250, 240, 0.8) 0%, rgba(240, 230, 210, 0.9) 100%);
}

.preview-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.preview-frame:hover img {
  transform: scale(1.05);
}

.frame-corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--rpg-gold);
}

.frame-corner.top-left {
  top: 5px;
  left: 5px;
  border-right: none;
  border-bottom: none;
}

.frame-corner.top-right {
  top: 5px;
  right: 5px;
  border-left: none;
  border-bottom: none;
}

.frame-corner.bottom-left {
  bottom: 5px;
  left: 5px;
  border-right: none;
  border-top: none;
}

.frame-corner.bottom-right {
  bottom: 5px;
  right: 5px;
  border-left: none;
  border-top: none;
}

/* ========== 职业详情 ========== */
.class-details {
  padding: 15px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(139, 115, 85, 0.3);
}

.class-title {
  font-size: 22px;
  font-weight: bold;
  color: var(--rpg-gold-dark);
  margin: 0 0 8px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

.class-description {
  font-size: 13px;
  color: #5a4a3a;
  line-height: 1.6;
  margin: 0;
}

/* ========== 性别选择 ========== */
.gender-section {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(139, 115, 85, 0.3);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: var(--rpg-gold);
}

.gender-options {
  display: flex;
  gap: 10px;
}

.gender-button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(245, 240, 230, 0.85) 100%);
  border: 1px solid rgba(139, 115, 85, 0.5);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gender-button:hover:not(:disabled) {
  background: linear-gradient(180deg, rgba(255, 250, 240, 1) 0%, rgba(250, 245, 235, 1) 100%);
  border-color: var(--rpg-gold-dark);
}

.gender-button.selected {
  background: linear-gradient(180deg, rgba(255, 245, 200, 0.95) 0%, rgba(255, 240, 180, 0.9) 100%);
  border-color: var(--rpg-gold);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
}

.gender-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gender-icon {
  font-size: 24px;
}

.gender-text {
  font-size: 12px;
  color: #5a4a3a;
}

.gender-button.selected .gender-text {
  color: var(--rpg-gold-dark);
}

/* ========== 名称输入 ========== */
.nickname-section {
  padding: 15px 20px;
}

.nickname-input-wrapper {
  display: flex;
  gap: 10px;
}

.nickname-input {
  flex: 1;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(139, 115, 85, 0.5);
  border-radius: 4px;
  color: #4a3c2a;
  font-size: 14px;
  transition: all 0.3s ease;
}

.nickname-input::placeholder {
  color: rgba(90, 74, 58, 0.5);
}

.nickname-input:focus {
  outline: none;
  border-color: var(--rpg-gold);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);
}

.random-name-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(139, 115, 85, 0.9) 0%, rgba(110, 90, 65, 0.9) 100%);
  border: 1px solid var(--rpg-border);
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.random-name-btn:hover {
  background: linear-gradient(180deg, rgba(160, 130, 95, 1) 0%, rgba(130, 105, 75, 1) 100%);
  border-color: var(--rpg-gold-dark);
}

.btn-icon {
  font-size: 14px;
}

.nickname-hint {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(90, 74, 58, 0.6);
  text-align: right;
}

.nickname-hint .valid {
  color: var(--rpg-gold-dark);
}

/* ========== 确认面板 ========== */
.confirmation-content {
  padding: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(139, 115, 85, 0.2);
}

.summary-label {
  font-size: 12px;
  color: rgba(90, 74, 58, 0.7);
}

.summary-value {
  font-size: 12px;
  color: #4a3c2a;
  font-weight: bold;
}

.confirm-button {
  width: 100%;
  margin-top: 15px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(180, 180, 180, 0.9) 0%, rgba(150, 150, 150, 0.9) 100%);
  border: 2px solid rgba(139, 115, 85, 0.5);
  border-radius: 6px;
  color: rgba(74, 60, 42, 0.5);
  font-size: 14px;
  font-weight: bold;
  cursor: not-allowed;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.confirm-button.enabled {
  background: linear-gradient(180deg, var(--rpg-gold) 0%, var(--rpg-gold-dark) 100%);
  border-color: var(--rpg-gold-light);
  color: #3d2b1f;
  cursor: pointer;
}

.confirm-button.enabled:hover {
  background: linear-gradient(180deg, var(--rpg-gold-light) 0%, var(--rpg-gold) 100%);
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.confirm-button.loading {
  cursor: wait;
  opacity: 0.8;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(61, 43, 31, 0.3);
  border-top-color: #3d2b1f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========== 底部装饰 ========== */
.footer-decoration {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  gap: 8px;
}

.footer-line {
  width: 200px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--rpg-gold) 50%, transparent 100%);
}

.footer-text {
  font-size: 11px;
  color: rgba(252, 245, 229, 0.6);
}

/* ========== 响应式设计 ========== */
@media (max-width: 992px) {
  .create-character-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .class-selection-panel {
    order: 1;
  }

  .character-preview-panel {
    order: 2;
  }

  .confirmation-panel {
    order: 3;
  }

  .class-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .class-button {
    flex: 1 1 calc(50% - 5px);
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .header-section {
    padding: 20px 15px 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .game-logo {
    width: 80px;
    height: 64px;
  }

  .character-preview-panel {
    height: auto;
    min-height: 500px;
  }

  .class-title {
    font-size: 18px;
  }

  .gender-options {
    flex-direction: column;
  }

  .nickname-input-wrapper {
    flex-direction: column;
  }

  .random-name-btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .create-character-container {
    padding: 0 10px 15px;
  }

  .class-button {
    flex: 1 1 100%;
  }

  .preview-display {
    padding: 10px;
  }

  .character-preview-panel {
    height: auto;
    min-height: 400px;
  }

  .gender-button {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
