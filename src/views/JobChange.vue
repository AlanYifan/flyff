<template>
  <div class="job-change-container">
    <div class="job-change-header">
      <h1>职业转换</h1>
      <p class="subtitle">选择您想要转换的职业</p>
    </div>

    <div class="job-change-content">
      <div class="current-job">
        <h3>当前职业</h3>
        <div class="current-job-info">
          <img :src="currentJobAvatar" :alt="currentJobName" @error="handleImageError" />
          <div class="job-details">
            <h4>{{ currentJobName }}</h4>
            <p>等级: {{ player.level }}</p>
            <p>当前状态: {{ canChangeJob ? '可转换职业' : '需要达到15级才能转换职业' }}</p>
          </div>
        </div>
      </div>

      <div class="available-jobs">
        <h3>可转换的职业</h3>
        <div class="job-list">
          <div
            v-for="job in availableJobs"
            :key="job.id"
            class="job-option"
            :class="{ disabled: !canChangeJob }"
            @click="selectJob(job)"
          >
            <img :src="job.avatar" :alt="job.name" @error="handleImageError" />
            <div class="job-info">
              <h4>{{ job.name }}</h4>
              <p>{{ job.description }}</p>
              <div class="job-requirements">
                <span v-if="job.requirement">要求: {{ job.requirement }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="job-change-footer">
        <button class="back-btn" @click="goBack">返回游戏</button>
        <button
          class="change-btn"
          :disabled="!selectedJob || !canChangeJob"
          @click="confirmJobChange"
        >
          确认转换
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ensureGameStores } from '@/store'
import { storageService } from '@/services/StorageService'
import Player from '@/models/Player'
import { getClassName, getClassAvatar } from '@/data/classes'

const router = useRouter()

// ★ 确保所有重型子 Store 已加载完成（顶层 await 使 setup 变为异步）
// 配合 App.vue 的 <Suspense>，加载期间显示 Loading fallback
// 刷新转职页面时直接进入 JobChange 路由，跳过了 Main.vue 的 ensureGameStores 调用
// 必须在 new Player() 之前调用，因为 Player 构造函数会通过 PlayerStatsService 访问 useItemsStore（懒加载代理）
await ensureGameStores()

// storageService 已通过 import 导入全局单例
const player = ref(new Player())
const selectedJob = ref(null)

// 职业转换映射
const jobChangeMap = {
  beginner: [
    {
      id: 'warrior',
      name: '战士',
      description: '近战物理职业，拥有强大的防御和生存能力',
      requirement: '等级15+'
    },
    {
      id: 'priest',
      name: '圣职者',
      description: '治疗和辅助职业，能够为队友提供强大的支援',
      requirement: '等级15+'
    },
    {
      id: 'mage',
      name: '魔导士',
      description: '远程魔法职业，拥有强大的魔法攻击和控制能力',
      requirement: '等级15+'
    },
    {
      id: 'archer',
      name: '弓箭手',
      description: '远程物理职业，拥有高命中和高暴击率',
      requirement: '等级15+'
    }
  ]
}

// 计算属性
const currentJobName = computed(() => {
  return getClassName(player.value.class)
})

const currentJobAvatar = computed(() => {
  return getClassAvatar(player.value.class, player.value.sex)
})

const canChangeJob = computed(() => {
  return player.value.level >= 15 && player.value.class === 'beginner'
})

const availableJobs = computed(() => {
  const jobs = jobChangeMap[player.value.class] || []
  return jobs.map(job => ({
    ...job,
    avatar: getClassAvatar(job.id, player.value.sex)
  }))
})

// 生命周期钩子
onMounted(() => {
  loadPlayerData()
})

// 方法
function loadPlayerData () {
  const loadedPlayer = storageService.loadPlayerData()
  if (loadedPlayer) {
    player.value = loadedPlayer instanceof Player ? loadedPlayer : new Player(loadedPlayer)
  } else {
    // 如果没有存档，跳转到选择页面
    router.push('/select')
  }
}

function handleImageError (event) {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

function selectJob (job) {
  if (!canChangeJob.value) {
    return
  }
  selectedJob.value = job
}

function confirmJobChange () {
  if (!selectedJob.value || !canChangeJob.value) {
    return
  }

  if (!confirm(`确定要转换为${selectedJob.value.name}吗？此操作不可逆转！`)) {
    return
  }

  // 更新玩家职业
  player.value.class = selectedJob.value.id
  if (typeof player.value.resetStatsForJobChange === 'function') {
    player.value.resetStatsForJobChange()
  }

  try {
    player.value.skills = {}
    storageService.savePlayerSkills({})
  } catch (error) {
    console.error('[JobChange] 重置技能数据失败:', error)
  }

  // 保存玩家数据
  storageService.savePlayerData(player.value)

  alert(`恭喜您成功转换为${selectedJob.value.name}！`)

  // 返回游戏主页面
  router.push('/main')
}

function goBack () {
  router.push('/main')
}
</script>

<style scoped>
  .job-change-container {
    width: 100%;
    height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 40px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .job-change-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .job-change-header h1 {
    font-size: 48px;
    font-weight: bold;
    background: linear-gradient(45deg, #4a9eff, #ff6b6b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
  }

  .job-change-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .current-job,
  .available-jobs {
    background: rgba(26, 26, 46, 0.8);
    border-radius: 16px;
    padding: 25px;
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .current-job h3,
  .available-jobs h3 {
    color: #ffd700;
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }

  .current-job-info {
    display: flex;
    gap: 20px;
    align-items: center;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .current-job-info img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 3px solid #4a9eff;
    object-fit: cover;
  }

  .job-details {
    flex: 1;
  }

  .job-details h4 {
    color: white;
    font-size: 24px;
    margin-bottom: 10px;
  }

  .job-details p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    margin-bottom: 5px;
  }

  .job-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .job-option {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    gap: 15px;
    align-items: center;
  }

  .job-option:hover:not(.disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: #4a9eff;
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }

  .job-option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .job-option img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
    object-fit: cover;
  }

  .job-info {
    flex: 1;
  }

  .job-info h4 {
    color: white;
    font-size: 20px;
    margin-bottom: 8px;
  }

  .job-info p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .job-requirements {
    color: #ffd700;
    font-size: 12px;
    font-weight: bold;
  }

  .job-change-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin-top: 20px;
  }

  .back-btn,
  .change-btn {
    padding: 14px 28px;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 150px;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(255, 255, 255, 0.1);
  }

  .change-btn {
    background: linear-gradient(45deg, #4a9eff, #6b83ff);
    color: white;
  }

  .change-btn:hover:not(:disabled) {
    background: linear-gradient(45deg, #6b83ff, #4a9eff);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(74, 158, 255, 0.3);
  }

  .change-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .job-change-container {
      padding: 20px;
    }

    .job-change-header h1 {
      font-size: 36px;
    }

    .job-list {
      grid-template-columns: 1fr;
    }

    .current-job-info {
      flex-direction: column;
      text-align: center;
    }

    .job-change-footer {
      flex-direction: column;
      gap: 15px;
    }

    .back-btn,
    .change-btn {
      width: 100%;
      max-width: 300px;
    }
  }
</style>
