<template>
  <transition name="job-change-transition" appear>
    <div v-if="isVisible" ref="jobChangePanel" class="job-change-panel" :style="{ ...panelPosition, width: panelWidth + 'px', height: panelHeight + 'px' }">
      <div class="job-change-header" @mousedown="startDrag" @mouseup="stopDrag" @mousemove="onDrag">
        <div class="title-area">
          <img :src="npcAvatar" class="npc-icon" draggable="false" />
          <div class="title-text">
            <h2>职业进阶系统</h2>
            <p class="npc-dialog">勇士，选择你的职业道路吧！</p>
          </div>
        </div>
        <button class="close-button" @click="close">&times;</button>
      </div>

      <div class="job-change-content" :style="contentStyle">
      <div class="current-job-section">
        <h3>当前职业</h3>
        <div class="current-job-info">
          <div class="job-avatar-container">
            <img :src="currentJobAvatar" :alt="currentJobName" @error="handleImageError" />
            <div class="job-level-badge">{{ player.level }}级</div>
          </div>
          <div class="job-details">
            <h4>{{ currentJobName }}</h4>
            <p class="job-description">{{ getJobDescription(currentJobClass) }}</p>
            <div class="job-stats">
              <div class="stat-item">
                <span class="stat-label">转职阶段:</span>
                <span class="stat-value">{{ getJobStage(currentJobClass) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">下一转职:</span>
                <span class="stat-value">{{ getNextJobLevel() }}级</span>
              </div>
            </div>
            <div class="job-status" :class="{ 'can-change': canChangeJob, 'cannot-change': !canChangeJob }">
              {{ canChangeJob ? '可进行转职' : getNextJobRequirement() }}
            </div>
          </div>
        </div>
      </div>

      <div class="job-path-section">
        <h3>职业进阶路线</h3>
        <div class="job-tree-container">
          <svg class="tree-connections" :width="treeWidth" :height="treeHeight">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color: #ffd700; stop-opacity: 0.8" />
                <stop offset="100%" style="stop-color: #ff9500; stop-opacity: 0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              v-for="(line, index) in connectionLines"
              :key="index"
              :d="line.path"
              stroke="url(#lineGradient)"
              stroke-width="3"
              fill="none"
              filter="url(#glow)"
              class="connection-line"
            />
          </svg>

          <div class="tree-levels">
            <div v-for="(level, levelIndex) in jobTreeLevels" :key="levelIndex" class="tree-level">
              <div class="level-label">{{ getLevelLabel(levelIndex) }}</div>
              <div class="level-jobs">
                <div
                  v-for="job in level"
                  :key="job.id"
                  class="tree-job-node"
                  :class="{
                  current: currentJobClass === job.id,
                  available: canChangeToJob(job),
                  locked: !canChangeToJob(job),
                  selected: selectedJob && selectedJob.id === job.id
                  }"
                  :style="{ left: job.x + 'px', top: job.y + 'px' }"
                  @click="selectJob(job)"
                  @mouseenter="handleJobMouseEnter(job, $event)"
                  @mouseleave="handleJobMouseLeave"
                >
                  <div class="job-node-ring"></div>
                  <div class="job-node-inner">
                    <img :src="job.avatar" :alt="job.name" @error="handleImageError" />
                    <div class="job-node-glow"></div>
                  </div>
                  <div class="job-node-info">
                    <h4>{{ job.name }}</h4>
                    <p class="job-level-req">{{ job.maxLevel ? job.minLevel + '-' + job.maxLevel : job.minLevel }}级</p>
                  </div>
                  <div v-if="job.children && job.children.length > 0" class="job-node-connector"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 转职需求面板：点击不可选职业或当前职业时展示 -->
      <Teleport to="body">
        <div
          v-if="clickedLockedJob"
          ref="lockedJobPanelRef"
          class="job-requirement-panel"
        >
          <div class="requirement-panel-header">
            <img :src="clickedLockedJob.avatar" :alt="clickedLockedJob.name" class="requirement-avatar" />
            <div class="requirement-title-area">
              <h4>{{ clickedLockedJob.name }}</h4>
              <p class="requirement-tier">{{ getLevelLabel(getJobStage(clickedLockedJob.id)) }}</p>
            </div>
            <button class="requirement-close-btn" @click="closeLockedJobPanel">&times;</button>
          </div>

          <!-- 原因说明 -->
          <div class="requirement-reason">
            <span class="reason-icon">🔒</span>
            <span class="reason-text">{{ getLockedJobReason(clickedLockedJob) }}</span>
          </div>

          <!-- 职业描述 -->
          <div class="requirement-description">
            <p>{{ getJobFullDescription(clickedLockedJob.id) }}</p>
          </div>

          <!-- 转职需求条件 -->
          <div class="requirement-conditions">
            <h5>转职需求</h5>
            <div class="condition-list">
              <div class="condition-item" :class="{ met: clickedLockedJob.prevJobs && clickedLockedJob.prevJobs.includes(player.class) }">
                <span class="condition-icon">{{ clickedLockedJob.prevJobs && clickedLockedJob.prevJobs.includes(player.class) ? '✅' : '❌' }}</span>
                <span class="condition-text">前置职业: {{ clickedLockedJob.prevJobs ? clickedLockedJob.prevJobs.map(id => getClassName(id)).join('、') : '无' }}</span>
              </div>
              <div class="condition-item" :class="{ met: player.level >= clickedLockedJob.minLevel && player.level <= (clickedLockedJob.maxLevel || 190) }">
                <span class="condition-icon">{{ player.level >= clickedLockedJob.minLevel && player.level <= (clickedLockedJob.maxLevel || 190) ? '✅' : '❌' }}</span>
                <span class="condition-text">等级要求: {{ clickedLockedJob.maxLevel ? clickedLockedJob.minLevel + '-' + clickedLockedJob.maxLevel : clickedLockedJob.minLevel }}级 (当前 {{ player.level }}级)</span>
              </div>
            </div>
          </div>

          <!-- 当前面板的转职信息 -->
          <div v-if="currentJobClass === clickedLockedJob.id && getJobChangeRequirements().nextJobs.length > 0" class="requirement-next-jobs">
            <h5>可转职方向</h5>
            <div class="next-job-list">
              <div v-for="nextJob in getJobChangeRequirements().nextJobs" :key="nextJob.id" class="next-job-item">
                <img :src="nextJob.avatar" :alt="nextJob.name" class="next-job-icon" @error="handleImageError" />
                <span class="next-job-name">{{ nextJob.name }}</span>
              </div>
            </div>
          </div>

          <!-- 职业技能预览 -->
          <div v-if="Object.keys(getJobSkills(clickedLockedJob.id)).length > 0" class="requirement-skills">
            <h5>职业技能预览</h5>
            <div class="skills-grid">
              <div
                v-for="(skill, key) in getJobSkills(clickedLockedJob.id)"
                :key="key"
                class="skill-item"
                @mouseenter="showSkillTooltip($event, skill, clickedLockedJob.id)"
                @mousemove="updateTooltipPosition"
                @mouseleave="hideSkillTooltip"
              >
                <img :src="skill.icon" :alt="skill.name" class="skill-icon" />
                <div class="skill-key">{{ key }}</div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 鼠标悬停时的职业详情面板 -->
      <Teleport to="body">
        <div
          v-if="hoveredJob"
          ref="jobDetailPanelRef"
          class="job-detail-panel"
          :style="{ left: hoveredJobPosition.x + 'px', top: hoveredJobPosition.y + 'px' }"
        >
          <div class="job-detail-header">
            <img :src="hoveredJob.avatar" :alt="hoveredJob.name" class="job-detail-avatar" />
            <div class="job-detail-title">
              <h4>{{ hoveredJob.name }}</h4>
              <p class="job-detail-level">{{ hoveredJob.maxLevel ? hoveredJob.minLevel + '-' + hoveredJob.maxLevel : hoveredJob.minLevel }}级解锁</p>
            </div>
          </div>
          <div class="job-detail-description">
            <p>{{ getJobFullDescription(hoveredJob.id) }}</p>
          </div>
          <div v-if="Object.keys(getDisplayJobSkills(hoveredJob.id)).length > 0" class="job-skills-section">
            <h5>职业技能</h5>
            <div class="skills-grid job-detail-skills-grid">
              <div
                v-for="(skill, key) in getDisplayJobSkills(hoveredJob.id)"
                :key="key"
                class="skill-item"
                @mouseenter="showSkillTooltip($event, skill, hoveredJob.id)"
                @mousemove="updateTooltipPosition"
                @mouseleave="hideSkillTooltip"
              >
                <img :src="skill.icon" :alt="skill.name" class="skill-icon" />
                <div class="skill-name-text">{{ skill.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <div class="job-change-footer">
        <button class="back-btn" @click="close">返回</button>
        <button class="change-btn" :disabled="!selectedJob || !canChangeJob" @click="confirmJobChange">
          确认转职
        </button>
      </div>
      </div>

      <!-- 右下角拉伸指示器 -->
      <div class="job-resize-handle" @pointerdown="startResize">
        <div class="resize-lines">
          <span class="resize-line"></span>
          <span class="resize-line"></span>
          <span class="resize-line"></span>
        </div>
      </div>
    </div>
  </transition>

  <!-- ★ 转职任务面板（Teleport 到 body，定位在职业进阶面板右侧外部） -->
  <Teleport to="body">
    <JobChangeQuestPanel
      :visible="showQuestPanel"
      :target-job-key="questPanelTargetJobKey"
      :player-gender="player.sex"
      :quest-chain-state="getQuestChainState(questPanelTargetJobKey)"
      :already-changed="isAlreadyChanged"
      :anchor-rect="jobChangePanelRect"
      :blocked-by-job="otherAcceptedJobName"
      @close="showQuestPanel = false"
      @accept-quest="onAcceptQuest"
      @complete-quest="onCompleteQuest"
      @abandon-quest="onAbandonQuest"
      @confirm-job-change="onQuestPanelConfirmJobChange"
    />
  </Teleport>

  <!-- ★ 转职二次确认面板（Teleport 到 body，浏览器居中显示） -->
  <Teleport to="body">
    <transition name="confirm-panel-transition" appear>
      <div v-if="showConfirmPanel" class="confirm-overlay" @click.self="cancelConfirm">
        <div class="confirm-panel">
          <div class="confirm-panel-icon">⚠️</div>
          <div class="confirm-panel-title">确认转职</div>
          <div class="confirm-panel-message">
            确定要转职为<span class="confirm-job-name">【{{ confirmJobName }}】</span>吗？<br />
            <span class="confirm-warning">{{ confirmWarningText }}</span>
          </div>
          <div class="confirm-panel-buttons">
            <button class="confirm-cancel-btn" @click="cancelConfirm">取消</button>
            <button class="confirm-ok-btn" @click="acceptConfirm">确认转职</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- 技能详情提示框（使用共享 SkillTooltip 组件，nonInteractive 避免遮挡鼠标） -->
  <SkillTooltip
    :visible="tooltipVisible"
    :skill="tooltipSkill"
    :position="tooltipPosition"
    :player="props.player"
    :player-class="tooltipPlayerClass"
    :non-interactive="true"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getClassName, getClassAvatar } from '@/data/classes'
import { SKILL_CONFIG } from '@/data/skills'
import { useJobsStore, useGameStore } from '@/store'
import JobChangeQuestPanel from '@/components/modals/JobChangeQuestPanel.vue'
import SkillTooltip from '@/components/SkillTooltip.vue'
import { buildJobChangeQuestRewardText } from '@/utils/jobChangeQuestHelper'
import { getJobChangeQuestChain } from '@/data/JobChangeQuestConfig'

const jobsStore = useJobsStore()
const gameStore = useGameStore()

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  player: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'job-changed'])

const jobChangePanel = ref(null)
const selectedJob = ref(null)
const hoveredJob = ref(null)
/** 技能详情提示框状态（使用共享 SkillTooltip 组件） */
const tooltipVisible = ref(false)
const tooltipSkill = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })
/** 当前提示框对应的职业 key（传给 SkillTooltip 的 playerClass） */
const tooltipPlayerClass = ref('')
const jobDetailPanelRef = ref(null)
/** 点击不可选职业时展示的需求面板信息 */
const clickedLockedJob = ref(null)
const lockedJobPanelRef = ref(null)

// ==================== 转职任务面板状态 ====================

/** 转职任务面板是否可见 */
const showQuestPanel = ref(false)
/** 当前打开任务面板的目标职业 job key */
const questPanelTargetJobKey = ref('')
/** 职业进阶面板的矩形位置（传给转职任务面板做锚点定位） */
const jobChangePanelRect = ref(null)

// ==================== 转职二次确认面板状态 ====================

/** 二次确认面板是否可见 */
const showConfirmPanel = ref(false)
/** 确认面板中显示的职业名称 */
const confirmJobName = ref('')
/** 确认面板中显示的警告文本 */
const confirmWarningText = ref('此操作不可逆转！')
/** 确认面板的回调函数（点击确认时执行） */
const confirmCallback = ref(null)

const hoveredJobPosition = ref({ x: 0, y: 0 })

// 面板尺寸常量
const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 600
const MIN_WIDTH = 800
const MIN_HEIGHT = 600

// 面板尺寸状态
const panelWidth = ref(DEFAULT_WIDTH)
const panelHeight = ref(DEFAULT_HEIGHT)
const isResizing = ref(false)
const resizeStartData = ref({ x: 0, y: 0, width: 0, height: 0 })

// 内容缩放比例
const scaleRatio = computed(() => {
  return Math.min(panelWidth.value / DEFAULT_WIDTH, panelHeight.value / DEFAULT_HEIGHT)
})

const contentStyle = computed(() => {
  return {
    transform: `scale(${scaleRatio.value})`,
    transformOrigin: 'top left',
    width: `${DEFAULT_WIDTH}px`,
    height: `${DEFAULT_HEIGHT}px`
  }
})

const npcAvatar = computed(() => '/pt/npc_icon/lui.png')

const currentJobClass = computed(() => props.player.class)

const currentJobName = computed(() => {
  return getClassName(props.player.class)
})

const currentJobAvatar = computed(() => {
  return getClassAvatar(props.player.class, props.player.sex)
})

const canChangeJob = computed(() => {
  const currentTier = jobsStore.getJobTier(props.player.class)
  if (currentTier === 0) {
    return props.player.level >= 15 && props.player.level <= 190
  } else if (currentTier === 1) {
    return props.player.level >= 60 && props.player.level <= 190
  } else if (currentTier === 2) {
    return props.player.level >= 166 && props.player.level <= 190
  }
  return false
})

/** 职业定义数据（不含位置信息，由 jobBranchesWithPositions 计算位置） */
const jobBranches = computed(() => {
  const sex = props.player.sex || 'male'

  return [
    {
      name: '职业进阶',
      icon: '/pt/job_icon/cxz_nan_icon.png',
      jobs: [
        {
          id: 'beginner',
          name: '初心者',
          avatar: getClassAvatar('beginner', sex),
          minLevel: 1,
          maxLevel: 190,
          prevJobs: [],
          children: ['warrior', 'mage', 'archer', 'priest']
        },
        {
          id: 'warrior',
          name: '战士',
          avatar: getClassAvatar('warrior', sex),
          minLevel: 15,
          maxLevel: 190,
          prevJobs: ['beginner'],
          children: ['knight', 'blade_warrior']
        },
        {
          id: 'mage',
          name: '魔导士',
          avatar: getClassAvatar('mage', sex),
          minLevel: 15,
          maxLevel: 190,
          prevJobs: ['beginner'],
          children: ['element_mage', 'spirit_mage']
        },
        {
          id: 'archer',
          name: '弓箭手',
          avatar: getClassAvatar('archer', sex),
          minLevel: 15,
          maxLevel: 190,
          prevJobs: ['beginner'],
          children: ['ranger', 'assassin']
        },
        {
          id: 'priest',
          name: '圣职者',
          avatar: getClassAvatar('priest', sex),
          minLevel: 15,
          maxLevel: 190,
          prevJobs: ['beginner'],
          children: ['guardian', 'technician']
        },
        {
          id: 'knight',
          name: '骑士',
          avatar: getClassAvatar('knight', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['warrior'],
          children: ['holy_knight']
        },
        {
          id: 'blade_warrior',
          name: '刀锋战士',
          avatar: getClassAvatar('blade_warrior', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['warrior'],
          children: ['storm_walker']
        },
        {
          id: 'element_mage',
          name: '元素使者',
          avatar: getClassAvatar('element_mage', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['mage'],
          children: ['arcane_master']
        },
        {
          id: 'spirit_mage',
          name: '精神使者',
          avatar: getClassAvatar('spirit_mage', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['mage'],
          children: ['mind_master']
        },
        {
          id: 'ranger',
          name: '游侠',
          avatar: getClassAvatar('ranger', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['archer'],
          children: ['fierce_shooter']
        },
        {
          id: 'assassin',
          name: '暗杀者',
          avatar: getClassAvatar('assassin', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['archer'],
          children: ['joker_emperor']
        },
        {
          id: 'guardian',
          name: '守护使者',
          avatar: getClassAvatar('guardian', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['priest'],
          children: ['nature_messenger']
        },
        {
          id: 'technician',
          name: '暴力技师',
          avatar: getClassAvatar('technician', sex),
          minLevel: 60,
          maxLevel: 190,
          prevJobs: ['priest'],
          children: ['combat_master']
        },
        {
          id: 'holy_knight',
          name: '圣殿骑士',
          avatar: getClassAvatar('holy_knight', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['knight'],
          children: []
        },
        {
          id: 'storm_walker',
          name: '风暴行者',
          avatar: getClassAvatar('storm_walker', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['blade_warrior'],
          children: []
        },
        {
          id: 'arcane_master',
          name: '奥数师',
          avatar: getClassAvatar('arcane_master', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['element_mage'],
          children: []
        },
        {
          id: 'mind_master',
          name: '心灵师',
          avatar: getClassAvatar('mind_master', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['spirit_mage'],
          children: []
        },
        {
          id: 'fierce_shooter',
          name: '暴烈射手',
          avatar: getClassAvatar('fierce_shooter', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['ranger'],
          children: []
        },
        {
          id: 'joker_emperor',
          name: '暗夜主宰',
          avatar: getClassAvatar('joker_emperor', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['assassin'],
          children: []
        },
        {
          id: 'nature_messenger',
          name: '自然神使',
          avatar: getClassAvatar('nature_messenger', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['guardian'],
          children: []
        },
        {
          id: 'combat_master',
          name: '格斗宗师',
          avatar: getClassAvatar('combat_master', sex),
          minLevel: 166,
          maxLevel: 190,
          prevJobs: ['technician'],
          children: []
        }
      ]
    }
  ]
})

/**
 * 带位置信息的职业分支数据
 * 将 jobBranches 的职业数据与位置计算合并，确保 x/y 始终可用
 * 避免旧的 calculateJobPositions 函数在 computed 重算时产生竞态条件
 */
const jobBranchesWithPositions = computed(() => {
  const branches = jobBranches.value
  const allJobs = branches.flatMap(branch => branch.jobs)
  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    if (!uniqueJobs.has(job.id)) {
      uniqueJobs.set(job.id, job)
    }
  })

  const levels = [[], [], [], []]
  Array.from(uniqueJobs.values()).forEach(job => {
    const stage = getJobStage(job.id)
    if (stage >= 0 && stage < 4) {
      levels[stage].push(job)
    }
  })

  const startY = 80
  const totalHeight = treeHeight.value - 100
  const jobHeight = 100

  /** 记录每个职业的坐标 */
  const positions = new Map()

  levels.forEach(levelJobs => {
    const gap = (totalHeight - levelJobs.length * jobHeight) / (levelJobs.length + 1)
    levelJobs.forEach((job, jobIndex) => {
      positions.set(job.id, {
        x: 0,
        y: startY + jobIndex * (jobHeight + gap)
      })
    })
  })

  /* 为每个 branch 的 jobs 附加 x/y 坐标 */
  return branches.map(branch => ({
    ...branch,
    jobs: branch.jobs.map(job => {
      const pos = positions.get(job.id) || { x: 0, y: 0 }
      return { ...job, x: pos.x, y: pos.y }
    })
  }))
})

/** 职业树分层数据（使用带位置的 jobBranchesWithPositions） */
const jobTreeLevels = computed(() => {
  const allJobs = jobBranchesWithPositions.value.flatMap(branch => branch.jobs)
  const levels = [[], [], [], []]

  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    if (!uniqueJobs.has(job.id)) {
      uniqueJobs.set(job.id, job)
    }
  })

  const jobArray = Array.from(uniqueJobs.values())
  jobArray.forEach(job => {
    const stage = getJobStage(job.id)
    if (stage >= 0 && stage < 4) {
      levels[stage].push(job)
    }
  })

  return levels
})

const treeWidth = computed(() => 900)
const treeHeight = computed(() => 1100)

const connectionLines = computed(() => {
  const lines = []
  /* 使用带位置的 jobBranchesWithPositions，确保 x/y 始终有效 */
  const allJobs = jobBranchesWithPositions.value.flatMap(branch => branch.jobs)
  const uniqueJobs = new Map()
  allJobs.forEach(job => {
    if (!uniqueJobs.has(job.id)) {
      uniqueJobs.set(job.id, job)
    }
  })
  const jobMap = uniqueJobs

  const columnOffsets = [50, 250, 450, 650]

  Array.from(uniqueJobs.values()).forEach(job => {
    if (job.children && job.children.length > 0) {
      job.children.forEach(childId => {
        const childJob = jobMap.get(childId)
        if (childJob) {
          const parentStage = getJobStage(job.id)
          const childStage = getJobStage(childJob.id)

          /* 安全回退：x/y 若意外为 undefined 则使用 0 */
          const jobX = typeof job.x === 'number' ? job.x : 0
          const jobY = typeof job.y === 'number' ? job.y : 0
          const childX = typeof childJob.x === 'number' ? childJob.x : 0
          const childY = typeof childJob.y === 'number' ? childJob.y : 0

          const startX = columnOffsets[parentStage] + jobX + 100
          const startY = jobY + 50
          const endX = columnOffsets[childStage] + childX
          const endY = childY + 50

          /* 跳过包含 NaN 的路径，避免 SVG 渲染错误 */
          if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) return

          lines.push({
            path: `M ${startX} ${startY} L ${endX} ${endY}`
          })
        }
      })
    }
  })

  return lines
})


function getLevelLabel (levelIndex) {
  const labels = ['初心者', '一转 (15-190级)', '二转 (60-190级)', '三转 (166-190级)']
  return labels[levelIndex] || ''
}

const panelPosition = ref({
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
})

const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

function startDrag (event) {
  if (event.target.closest('.close-button') || event.target.closest('.job-resize-handle')) {
    return
  }
  isDragging.value = true
  const rect = jobChangePanel.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

/**
 * 开始拉伸面板
 * @param {PointerEvent} event - 指针事件
 */
function startResize (event) {
  event.preventDefault()
  const rect = jobChangePanel.value.getBoundingClientRect()
  panelPosition.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    transform: 'none'
  }
  isResizing.value = true
  resizeStartData.value = {
    x: event.clientX,
    y: event.clientY,
    width: panelWidth.value,
    height: panelHeight.value
  }
  window.addEventListener('pointermove', handleResize)
  window.addEventListener('pointerup', stopResize)
  window.addEventListener('pointercancel', stopResize)
}

/**
 * 处理拉伸移动
 * @param {PointerEvent} event - 指针事件
 */
function handleResize (event) {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStartData.value.x
  const deltaY = event.clientY - resizeStartData.value.y

  const newWidth = Math.max(MIN_WIDTH, Math.min(window.innerWidth * 0.95, resizeStartData.value.width + deltaX))
  const newHeight = Math.max(MIN_HEIGHT, Math.min(window.innerHeight * 0.95, resizeStartData.value.height + deltaY))

  panelWidth.value = newWidth
  panelHeight.value = newHeight
}

/**
 * 停止拉伸
 */
function stopResize () {
  isResizing.value = false
  window.removeEventListener('pointermove', handleResize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
}

/**
 * 重置面板尺寸
 */
function resetPanelSize () {
  panelWidth.value = DEFAULT_WIDTH
  panelHeight.value = DEFAULT_HEIGHT
}

function stopDrag () {
  isDragging.value = false
}

function onDrag (event) {
  if (!isDragging.value) {
    return
  }
  event.preventDefault()

  const x = event.clientX - dragOffset.value.x
  const y = event.clientY - dragOffset.value.y

  panelPosition.value = {
    top: `${y}px`,
    left: `${x}px`,
    transform: 'none'
  }
  // 拖拽时同步更新锚点位置，让转职任务面板跟随移动
  if (jobChangePanel.value && showQuestPanel.value) {
    jobChangePanelRect.value = jobChangePanel.value.getBoundingClientRect()
  }
}

function handleImageError (event) {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

function clamp (value, min, max) {
  return Math.max(min, Math.min(max, value))
}

async function updateHoveredJobPosition (anchorRect) {
  try {
    const padding = 10
    const offset = 12
    const candidateX = anchorRect.right + offset
    const candidateY = anchorRect.top
    hoveredJobPosition.value = { x: candidateX, y: candidateY }

    await nextTick()
    const panelEl = jobDetailPanelRef.value
    if (!panelEl) {
      return
    }

    const rect = panelEl.getBoundingClientRect()
    const maxX = window.innerWidth - rect.width - padding
    const maxY = window.innerHeight - rect.height - padding
    const nextX = clamp(candidateX, padding, Math.max(padding, maxX))
    const nextY = clamp(candidateY, padding, Math.max(padding, maxY))
    hoveredJobPosition.value = { x: nextX, y: nextY }
  } catch (error) {
    console.error('[JobChangeModal] Failed to update hovered job position:', error)
  }
}

function handleJobMouseEnter (job, event) {
  hoveredJob.value = job
  const anchor = event?.currentTarget
  if (!anchor || typeof anchor.getBoundingClientRect !== 'function') {
    return
  }
  updateHoveredJobPosition(anchor.getBoundingClientRect())
}

function handleJobMouseLeave () {
  hoveredJob.value = null
  hideSkillTooltip()
}

/**
 * 显示技能详情提示框
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} skill - 技能对象
 * @param {string} jobClass - 当前职业 key（传给 SkillTooltip）
 */
function showSkillTooltip (event, skill, jobClass) {
  tooltipSkill.value = skill
  tooltipPlayerClass.value = jobClass
  tooltipVisible.value = true
  updateTooltipPosition(event)
}

/**
 * 隐藏技能详情提示框
 */
function hideSkillTooltip () {
  tooltipVisible.value = false
  tooltipSkill.value = null
}

/**
 * 更新技能提示框位置（跟随鼠标移动）
 * @param {MouseEvent} event - 鼠标事件
 */
function updateTooltipPosition (event) {
  tooltipPosition.value = { x: event.clientX, y: event.clientY }
}

function getJobStage (jobClass) {
  return jobsStore.getJobTier(jobClass)
}

function getNextJobLevel () {
  const stage = getJobStage(props.player.class)
  if (stage === 0) {
    return 15
  }
  if (stage === 1) {
    return 60
  }
  if (stage === 2) {
    return 166
  }
  return '已满级'
}

function getNextJobRequirement () {
  const stage = getJobStage(props.player.class)
  if (stage === 0) {
    return '需要达到15级才能转职'
  }
  if (stage === 1) {
    return '需要达到60级才能转职'
  }
  if (stage === 2) {
    return '需要达到166级才能转职'
  }
  return '已达到最高职业'
}

function getJobDescription (jobClass) {
  const descriptions = {
    beginner: '初入瑞加大陆的冒险者，拥有无限的可能性',
    warrior: '近战物理职业，拥有强大的防御和生存能力',
    mage: '远程魔法职业，拥有强大的魔法攻击和控制能力',
    archer: '远程物理职业，拥有高命中和高暴击率',
    priest: '治疗和辅助职业，能够为队友提供强大的支援',
    blade_warrior: '专注于攻击的战士，拥有极高的物理伤害',
    knight: '防御型战士，拥有坚不可摧的防御力',
    ranger: '敏捷型弓箭手，拥有极高的移动速度',
    assassin: '暗杀型弓箭手，拥有致命的暴击能力',
    guardian: '守护型圣职者，拥有强大的保护能力',
    technician: '攻击型圣职者，拥有强大的物理攻击',
    element_mage: '元素型魔导士，掌控自然元素之力',
    spirit_mage: '精神型魔导士，掌控心灵之力',
    storm_walker: '继承刀锋战士双刀流传统的风暴行者，将风暴之力注入双刀，拥有毁灭性的近战爆发力。',
    holy_knight: '神圣的守护者，拥有无与伦比的防御',
    nature_messenger: '自然的使者，拥有强大的治愈能力',
    combat_master: '格斗的宗师，拥有完美的战斗技巧',
    arcane_master: '奥术的大师，掌控着强大的魔法',
    mind_master: '心灵的大师，掌控着精神力量',
    fierce_shooter: '暴烈的射手，拥有恐怖的远程伤害',
    joker_emperor: '暗夜主宰，拥有神秘而强大的力量'
  }
  return descriptions[jobClass] || '未知的职业'
}

function canChangeToJob (job) {
  if (!job.prevJobs || job.prevJobs.length === 0) {
    return false
  }
  const levelOk = props.player.level >= job.minLevel && props.player.level <= (job.maxLevel || 190)
  return job.prevJobs.includes(props.player.class) && levelOk
}

/**
 * 获取不可转职职业的原因描述
 * @param {Object} job - 职业对象
 * @returns {string} 原因描述
 */
function getLockedJobReason (job) {
  // 当前职业
  if (currentJobClass.value === job.id) {
    return '这是你当前的职业'
  }
  // 前置职业不匹配
  if (job.prevJobs && job.prevJobs.length > 0 && !job.prevJobs.includes(props.player.class)) {
    const prevJobNames = job.prevJobs.map(id => getClassName(id)).join('、')
    return `需要先成为: ${prevJobNames}`
  }
  // 等级不足
  if (props.player.level < job.minLevel) {
    return `需要达到 ${job.minLevel} 级，当前 ${props.player.level} 级`
  }
  // 等级超出上限
  const maxLevel = job.maxLevel || 190
  if (props.player.level > maxLevel) {
    return `转职等级上限为 ${maxLevel} 级，当前 ${props.player.level} 级已超出`
  }
  return '暂不满足转职条件'
}

/**
 * 获取下一转职可用的职业列表
 * @returns {Array} 可转职的职业列表
 */
function getNextAvailableJobs () {
  return jobsStore.getAvailableEvolutions(props.player.class)
}

/**
 * 获取转职任务需求描述
 * @returns {Object} 转职需求信息
 */
function getJobChangeRequirements () {
  const currentTier = jobsStore.getJobTier(props.player.class)
  const nextJobs = getNextAvailableJobs()
  const nextLevelReq = currentTier === 0 ? 15 : currentTier === 1 ? 60 : currentTier === 2 ? 166 : null

  const levelMet = nextLevelReq ? props.player.level >= nextLevelReq : false

  return {
    currentTier,
    nextJobs: nextJobs.map(id => ({
      id,
      name: getClassName(id),
      avatar: getClassAvatar(id, props.player.sex)
    })),
    requiredLevel: nextLevelReq,
    levelMet,
    canChange: canChangeJob.value
  }
}

function selectJob (job) {
  if (canChangeToJob(job)) {
    selectedJob.value = job
    clickedLockedJob.value = null

    // ★ 一转/二转/三转职业：点击后弹出转职任务面板（需完成任务才能转职）
    const jobTier = jobsStore.getJobTier(job.id)
    if ((jobTier === 1 || jobTier === 2 || jobTier === 3) && job.prevJobs && job.prevJobs.includes(props.player.class)) {
      questPanelTargetJobKey.value = job.id
      // 更新锚点位置
      if (jobChangePanel.value) {
        jobChangePanelRect.value = jobChangePanel.value.getBoundingClientRect()
      }
      showQuestPanel.value = true
    }
    return
  }
  // 点击不可选职业时，展示转职需求面板
  selectedJob.value = null
  clickedLockedJob.value = job
}

/**
 * 关闭锁定职业需求面板
 */
function closeLockedJobPanel () {
  clickedLockedJob.value = null
}

function confirmJobChange () {
  if (!selectedJob.value || !canChangeJob.value) {
    return
  }

  // ★ 一转/二转/三转职业需完成所有转职任务才能转职
  const jobTier = jobsStore.getJobTier(selectedJob.value.id)
  if (jobTier === 1 || jobTier === 2 || jobTier === 3) {
    const chainState = getQuestChainState(selectedJob.value.id)
    if (!chainState?.allCompleted) {
      return
    }
  }

  // 弹出自定义二次确认面板
  requestConfirm(selectedJob.value.name, () => {
    emit('job-changed', selectedJob.value)
    if (typeof window !== 'undefined' && typeof window.playQuestCompleteSound === 'function') {
      window.playQuestCompleteSound()
    }
    close({ playClickSound: false })
  })
}

function close (options = {}) {
  emit('close')
  selectedJob.value = null
  showQuestPanel.value = false
  showConfirmPanel.value = false

  const shouldPlayClickSound = options.playClickSound !== false
  if (shouldPlayClickSound && typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

// ==================== 二次确认面板操作 ====================

/**
 * 弹出二次确认面板
 * @param {string} jobName - 要确认的职业名称或操作描述
 * @param {Function} callback - 点击确认后执行的回调
 * @param {Object} [options] - 额外选项
 * @param {string} [options.warningText] - 自定义警告文本
 */
function requestConfirm (jobName, callback, options = {}) {
  confirmJobName.value = jobName
  confirmWarningText.value = options.warningText || '此操作不可逆转！'
  confirmCallback.value = callback
  showConfirmPanel.value = true
}

/** 确认面板：点击确认按钮 */
function acceptConfirm () {
  const cb = confirmCallback.value
  showConfirmPanel.value = false
  confirmCallback.value = null
  if (typeof cb === 'function') {
    cb()
  }
}

/** 确认面板：点击取消按钮 */
function cancelConfirm () {
  showConfirmPanel.value = false
  confirmCallback.value = null
}

// ==================== 转职任务操作 ====================

/** 获取已接受转职任务的其他职业名称（非空表示被阻止） */
const otherAcceptedJobName = computed(() => {
  return gameStore.getOtherAcceptedJobName(questPanelTargetJobKey.value)
})

/**
 * 判断玩家是否已完成目标职业对应阶段的转职
 * 一转目标：玩家已不是初心者（tier >= 1）即已转职
 * 二转目标：玩家已完成二转（tier >= 2）即已转职
 */
const isAlreadyChanged = computed(() => {
  const targetTier = jobsStore.getJobTier(questPanelTargetJobKey.value)
  const currentTier = jobsStore.getJobTier(props.player.class)
  return currentTier >= targetTier
})

/** 获取指定职业的转职任务链状态 */
function getQuestChainState (targetJobKey) {
  return gameStore.getJobChangeQuestChainState(targetJobKey)
}

/** 接受转职任务 */
function onAcceptQuest (questIndex) {
  gameStore.acceptJobChangeQuest(questPanelTargetJobKey.value, questIndex)
  // 播放接受任务音效
  if (typeof window !== 'undefined' && window.playQuestCompleteSound) {
    window.playQuestCompleteSound()
  }
}

/**
 * 完成转职任务
 * 调用 store 完成任务后，在战斗日志文字和动画中显示奖励信息
 * @param {number} questIndex - 任务在任务链中的索引
 */
function onCompleteQuest (questIndex) {
  gameStore.completeJobChangeQuest(questPanelTargetJobKey.value, questIndex)

  // ★ 构建任务名称和奖励文本，在战斗日志文字和动画中同时显示奖励
  const chain = getJobChangeQuestChain(questPanelTargetJobKey.value)
  const questConfig = chain?.quests?.[questIndex]
  const questName = questConfig?.name || `任务${questIndex + 1}`
  const rewardText = buildJobChangeQuestRewardText(questPanelTargetJobKey.value, questIndex)

  // 添加战斗日志文字
  if (typeof window !== 'undefined' && typeof window.addBattleLog === 'function') {
    window.addBattleLog(`[任务完成] ${questName}${rewardText}`, 'quest')
  }

  // 显示战斗日志动画
  if (typeof window !== 'undefined' && typeof window.showAnimationMessage === 'function') {
    window.showAnimationMessage(`任务完成: ${questName}${rewardText}`, 'quest', '', '', '', '', '✅')
  }

  // 播放完成任务音效
  if (typeof window !== 'undefined' && window.playQuestCompleteSound) {
    window.playQuestCompleteSound()
  }
}

/** 放弃转职任务 */
function onAbandonQuest (questIndex) {
  // 弹出自定义二次确认面板
  requestConfirm('放弃当前转职任务', () => {
    gameStore.abandonJobChangeQuest(questPanelTargetJobKey.value, questIndex)
  }, { warningText: '已完成的击杀进度将被重置。' })
}

/** 转职任务面板中的确认转职 */
function onQuestPanelConfirmJobChange () {
  if (!selectedJob.value) return
  const chainState = getQuestChainState(selectedJob.value.id)
  if (!chainState?.allCompleted) return

  showQuestPanel.value = false

  // 弹出自定义二次确认面板
  requestConfirm(selectedJob.value.name, () => {
    emit('job-changed', selectedJob.value)
    if (typeof window !== 'undefined' && window.playQuestCompleteSound) {
      window.playQuestCompleteSound()
    }
    close({ playClickSound: false })
  })
}

/**
 * 获取职业的全部技能配置
 * @param {string} jobClass - 职业 ID
 * @returns {Object} 技能配置对象
 */
function getJobSkills (jobClass) {
  return SKILL_CONFIG[jobClass] || {}
}

/**
 * 判断技能键是否为 EX 技能
 * EX 技能的键包含 '_EX'（如 W_EX、O_EX2、E_EX1 等），
 * 或为被动 EX1 键 'O'（仅三转职业存在）
 * @param {string} key - 技能键名
 * @returns {boolean} 是否为 EX 技能
 */
function isExSkillKey (key) {
  if (!key) return false
  return key.includes('_EX') || key === 'O'
}

/**
 * 获取用于面板展示的职业技能（三转职业过滤掉 EX 技能）
 * @param {string} jobClass - 职业 ID
 * @returns {Object} 过滤后的技能对象
 */
function getDisplayJobSkills (jobClass) {
  const allSkills = SKILL_CONFIG[jobClass] || {}
  const tier = jobsStore.getJobTier(jobClass)
  // 三转职业过滤掉 EX 技能
  if (tier === 3) {
    const filtered = {}
    Object.keys(allSkills).forEach(key => {
      if (!isExSkillKey(key)) {
        filtered[key] = allSkills[key]
      }
    })
    return filtered
  }
  return allSkills
}

function getJobFullDescription (jobClass) {
  const descriptions = {
    beginner:
      '刚刚踏上冒险之路的新手，掌握基础战斗技巧。擅长使用各种武器进行近战攻击，是成长为所有强大职业的起点。',
    warrior:
      '近战物理职业，拥有强大的防御和生存能力。擅长使用盾牌和单手武器，是队伍中的坚实盾牌。',
    mage: '远程魔法职业，拥有强大的魔法攻击和控制能力。掌控元素之力，能够对敌人造成毁灭性的打击。',
    archer:
      '远程物理职业，拥有高命中和高暴击率。擅长使用弓箭和飞轮，能够从远处对敌人进行精准打击。',
    priest:
      '治疗和辅助职业，能够为队友提供强大的支援。掌握神圣之力，能够治疗伤势和提供各种增益效果。',
    knight: '防御型战士，拥有坚不可摧的防御力。专注于保护队友，是队伍中不可或缺的守护者。',
    blade_warrior:
      '专注于攻击的战士，拥有极高的物理伤害。放弃防御追求极致的攻击力，是队伍中的输出核心。',
    ranger: '敏捷型弓箭手，拥有极高的移动速度。擅长快速移动和远程攻击，能够在战场上自由穿梭。',
    assassin: '暗杀型弓箭手，拥有致命的暴击能力。专注于爆发伤害，能够在瞬间对敌人造成巨大伤害。',
    guardian: '守护型圣职者，拥有强大的保护能力。专注于治疗和保护队友，是队伍中的核心辅助。',
    technician:
      '攻击型圣职者，拥有强大的物理攻击。将神圣之力与物理攻击结合，能够对敌人造成持续伤害。',
    element_mage:
      '元素型魔导士，掌控自然元素之力。能够操控火、水、风、土等元素，对敌人造成多样化的伤害。',
    spirit_mage: '精神型魔导士，掌控心灵之力。能够操控敌人的精神，造成精神伤害和控制效果。',
    storm_walker: '风暴行者，由刀锋战士进阶的双刀流风暴战士。将风暴之力注入双刀，以极快攻速与高暴击对敌人造成连续风属性斩击，并拥有极高的闪避和机动性。',
    holy_knight: '神圣骑士，拥有强大的神圣之力。能够使用神圣技能治疗队友并对敌人造成神圣伤害。',
    nature_messenger: '自然使者，掌控自然之力。能够召唤自然生物协助战斗，并对敌人造成自然伤害。',
    combat_master: '战斗大师，精通各种战斗技巧。能够使用各种武器进行战斗，是全能型的战士。',
    arcane_master: '奥术大师，掌控奥术之力。能够使用强大的奥术魔法对敌人造成毁灭性打击。',
    mind_master: '心灵大师，掌控心灵之力。能够操控敌人的心灵，造成精神伤害和控制效果。',
    fierce_shooter: '神射手，拥有极高的命中率和暴击率。能够在极远的距离对敌人进行精准打击。',
    joker_emperor:
      '帝王，拥有强大的领导力和战斗力。能够指挥军队进行战斗，并拥有强大的单体攻击能力。'
  }
  return descriptions[jobClass] || '暂无描述'
}

watch(
  () => props.isVisible,
  newVal => {
    if (newVal) {
      panelPosition.value = {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
      // 重置为默认尺寸
      resetPanelSize()
      /* calculateJobPositions 已废弃，位置由 jobBranchesWithPositions 自动计算 */
    }
  }
)

onMounted(() => {
  /* calculateJobPositions 已废弃，位置由 jobBranchesWithPositions 自动计算 */
})

onUnmounted(() => {
  window.removeEventListener('pointermove', handleResize)
  window.removeEventListener('pointerup', stopResize)
  window.removeEventListener('pointercancel', stopResize)
})
</script>

<style scoped>
.job-change-transition-enter-active,
.job-change-transition-leave-active {
  transition:
    opacity 0.18s ease,
    filter 0.18s ease;
}

.job-change-transition-enter-from,
.job-change-transition-leave-to {
  opacity: 0;
  filter: blur(2px);
}

.job-change-transition-enter-to,
.job-change-transition-leave-from {
  opacity: 1;
  filter: blur(0);
}

.job-change-panel {
  position: fixed;
  background: black;
  border-radius: 20px;
  width: 800px;
  height: 600px;
  min-width: 800px;
  min-height: 600px;
  overflow: hidden;
  z-index: 1001;
  border: 2px solid #8b7355;
  box-shadow: 1px 10px 10px rgb(139 115 85);
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.job-change-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  cursor: move;
  user-select: none;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%);
}

.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.npc-icon {
  width: 50px;
  height: 50px;
  border-radius: 15%;
  object-fit: cover;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.title-text h2 {
  color: #ffd700;
  font-size: 18px;
  margin: 0;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    0 2px 4px rgba(0, 0, 0, 0.8);
  font-weight: bold;
  letter-spacing: 1px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.npc-dialog {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  margin: 2px 0 0 0;
  font-style: italic;
}

.close-button {
  background: linear-gradient(135deg, #ff4444, #cc0000);
  border: 2px solid #ff6666;
  color: white;
  font-size: 22px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-button:hover {
  background: linear-gradient(135deg, #ff6666, #ff0000);
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(255, 0, 0, 0.5);
}

.job-change-content {
  padding: 3px;
  display: flex;
  flex-direction: column;
  height: 530px;
  overflow: hidden;
}

.current-job-section {
  align-self: center;
}

.current-job-section h3 {
  color: #4a9eff;
  font-size: 13px;
  margin-bottom: 5px;
  text-align: center;
  text-shadow: 0 0 8px rgba(74, 158, 255, 0.5);
  font-weight: bold;
  letter-spacing: 1px;
}

.current-job-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.job-avatar-container {
  position: relative;
  flex-shrink: 0;
}

.job-avatar-container img {
  width: 50px;
  height: 50px;
  border-radius: 15%;
  border: 2px solid #4a9eff;
  object-fit: cover;
  box-shadow: 0 0 15px rgba(74, 158, 255, 0.6);
}

.job-level-badge {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ffd700, #ff9500);
  color: #0f0f23;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.5);
  white-space: nowrap;
}

.job-details {
  flex: 1;
}

.job-details h4 {
  color: white;
  font-size: 14px;
  margin-bottom: 3px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.job-description {
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  line-height: 1.3;
  margin-bottom: 5px;
  font-style: italic;
}

.job-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 5px;
}

.stat-item {
  display: flex;
  flex-direction: row;
  gap: 2px;
}

.stat-label {
  color: rgb(0, 0, 0);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: #0095ff;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
}

.job-status {
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 6px;
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.job-status.can-change {
  color: #4a9eff;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.2), rgba(74, 158, 255, 0.1));
  border: 2px solid #4a9eff;
  box-shadow: 0 0 15px rgba(74, 158, 255, 0.4);
  animation: pulse 2s infinite;
}

.job-status.cannot-change {
  color: #ff6b6b;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1));
  border: 2px solid #ff6b6b;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 0 15px rgba(74, 158, 255, 0.4);
  }

  50% {
    box-shadow: 0 0 25px rgba(74, 158, 255, 0.6);
  }
}

.job-path-section {}

.job-path-section h3 {
  color: #ffd700;
  font-size: 14px;
  margin-bottom: 5px;
  margin-top: 5px;
  text-align: center;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.8),
    0 1px 2px rgba(0, 0, 0, 0.8);
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.job-tree-container {
  position: relative;
  overflow: auto;
  height: 420px;
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.job-tree-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.job-tree-container::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 6px;
}

.job-tree-container::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 6px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.job-tree-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.85);
}

.job-detail-panel {
  position: fixed;
  width: 280px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(20, 20, 40, 0.98) 100%);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 10px;
  padding: 12px;
  z-index: 2200;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.8),
    0 0 15px rgba(255, 215, 0, 0.3);
  animation: fadeIn 0.3s ease-out;
}

.tree-connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  animation: lineGlow 2s ease-in-out infinite;
}

@keyframes lineGlow {

  0%,
  100% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }
}

.tree-levels {
  position: relative;
  z-index: 2;
  height: 100%;
}

.tree-level {
  position: absolute;
  top: 0;
  display: flex;
  flex-direction: column;
}

.tree-level:nth-child(1) {
  left: 30px;
}

.tree-level:nth-child(2) {
  left: 200px;
}

.tree-level:nth-child(3) {
  left: 370px;
}

.tree-level:nth-child(4) {
  left: 540px;
}

.level-label {
  color: rgba(255, 215, 0, 0.7);
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  position: absolute;
  white-space: nowrap;
}

.level-jobs {
  position: relative;
}

.tree-job-node {
  position: absolute;
  width: 60px;
  height: 60px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tree-job-node:hover {
  transform: scale(1.15);
  z-index: 10;
}

.tree-job-node.current {
  z-index: 5;
}

.tree-job-node.current:hover {
  transform: scale(1.2);
}

.tree-job-node.available:hover {
  z-index: 10;
}

.job-node-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 15%;
  transition: all 0.3s ease;
}

.tree-job-node.current .job-node-ring {
  border-color: #4a9eff;
  box-shadow:
    0 0 20px rgba(74, 158, 255, 0.6),
    inset 0 0 20px rgba(74, 158, 255, 0.2);
  animation: currentPulse 2s ease-in-out infinite;
}

.tree-job-node.available .job-node-ring {
  border-color: #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

.tree-job-node.available:hover .job-node-ring {
  border-color: #ff9500;
  box-shadow: 0 0 25px rgba(255, 149, 0, 0.6);
}

.tree-job-node.selected .job-node-ring {
  border-color: #00ff88;
  box-shadow:
    0 0 30px rgba(0, 255, 136, 0.8),
    inset 0 0 30px rgba(0, 255, 136, 0.3);
  animation: selectedPulse 1.5s ease-in-out infinite;
}

.tree-job-node.locked .job-node-ring {
  border-color: rgba(255, 255, 255, 0.1);
  opacity: 0.3;
}

@keyframes currentPulse {

  0%,
  100% {
    box-shadow:
      0 0 20px rgba(74, 158, 255, 0.6),
      inset 0 0 20px rgba(74, 158, 255, 0.2);
  }

  50% {
    box-shadow:
      0 0 30px rgba(74, 158, 255, 0.8),
      inset 0 0 30px rgba(74, 158, 255, 0.3);
  }
}

@keyframes selectedPulse {

  0%,
  100% {
    box-shadow:
      0 0 30px rgba(0, 255, 136, 0.8),
      inset 0 0 30px rgba(0, 255, 136, 0.3);
  }

  50% {
    box-shadow:
      0 0 50px rgba(0, 255, 136, 1),
      inset 0 0 50px rgba(0, 255, 136, 0.5);
  }
}

.job-node-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 15%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.tree-job-node.current .job-node-inner {
  border-color: #4a9eff;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.2), rgba(0, 0, 0, 0.4));
}

.tree-job-node.available .job-node-inner {
  border-color: rgba(255, 215, 0, 0.5);
}

.tree-job-node.available:hover .job-node-inner {
  border-color: #ffd700;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(0, 0, 0, 0.4));
}

.tree-job-node.selected .job-node-inner {
  border-color: #00ff88;
  background: linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 0, 0, 0.5));
}

.tree-job-node.locked .job-node-inner {
  filter: grayscale(100%);
  opacity: 0.4;
}

.job-node-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.tree-job-node.available:hover .job-node-inner img {
  transform: scale(1.1);
}

.job-node-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.tree-job-node.available:hover .job-node-glow {
  opacity: 1;
  animation: glowRotate 3s linear infinite;
}

.tree-job-node.selected .job-node-glow {
  opacity: 1;
  animation: glowRotate 2s linear infinite;
}

@keyframes glowRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.job-node-info {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.3s ease;
}

.tree-job-node:hover .job-node-info,
.tree-job-node.current .job-node-info,
.tree-job-node.selected .job-node-info {
  opacity: 1;
  bottom: -28px;
}

.job-node-info h4 {
  color: white;
  font-size: 10px;
  margin: 0 0 1px 0;
  text-shadow:
    0 0 5px rgba(0, 0, 0, 0.8),
    0 1px 2px rgba(0, 0, 0, 0.8);
  font-weight: bold;
}

.job-node-info .job-level-req {
  color: #ffd700;
  font-size: 9px;
  margin: 0;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(255, 215, 0, 0.6);
}

.job-node-connector {
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 3px;
  background: linear-gradient(to right, #ffd700, #ff9500);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
}

.job-change-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  margin-top: 5px;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.05) 0%, transparent 100%);
}

.back-btn,
.change-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.back-btn {
  background: linear-gradient(135deg, #666, #444);
  border: 1px solid #888;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.back-btn:hover {
  background: linear-gradient(135deg, #888, #666);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.change-btn {
  background: linear-gradient(135deg, #ffd700, #ff9500);
  border: 1px solid #ffcc00;
  color: #0f0f23;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.4);
}

.change-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff9500, #ff6600);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 149, 0, 0.6);
}

.change-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(100%);
}

/* 滚动条样式 */
.job-change-panel::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.job-change-panel::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 6px;
}

.job-change-panel::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 6px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.job-change-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.85);
}

/* 拉伸手柄 */
.job-resize-handle {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 20px;
  height: 20px;
  cursor: nwse-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.resize-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.resize-line {
  height: 2px;
  border-radius: 1px;
  background: #ffd700;
  opacity: 1;
  transition: all 0.2s;
}

.resize-line:nth-child(1) {
  width: 14px;
  transform: rotate(-45deg);
  transform-origin: right center;
}

.resize-line:nth-child(2) {
  width: 10px;
  transform: rotate(-45deg);
  transform-origin: right center;
}

.resize-line:nth-child(3) {
  width: 6px;
  transform: rotate(-45deg);
  transform-origin: right center;
}

.job-resize-handle:hover .resize-line {
  background: #ffd700;
  opacity: 1;
}

/* 拉伸动画 - 始终显示 */
.job-resize-handle .resize-line:nth-child(1) {
  animation: resize-bounce-1 0.6s ease-in-out infinite;
}

.job-resize-handle .resize-line:nth-child(2) {
  animation: resize-bounce-2 0.6s ease-in-out infinite 0.1s;
}

.job-resize-handle .resize-line:nth-child(3) {
  animation: resize-bounce-3 0.6s ease-in-out infinite 0.2s;
}

@keyframes resize-bounce-1 {
  0%, 100% { width: 14px; }
  50% { width: 16px; }
}

@keyframes resize-bounce-2 {
  0%, 100% { width: 10px; }
  50% { width: 12px; }
}

@keyframes resize-bounce-3 {
  0%, 100% { width: 6px; }
  50% { width: 8px; }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .tree-job-node {
    width: 90px;
    height: 90px;
  }

  .job-node-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border-radius: 20%;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .job-node-inner {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 768px) {
  .job-change-content {
    padding: 20px;
  }

  .current-job-info {
    flex-direction: column;
    text-align: center;
  }

  .tree-job-node {
    width: 80px;
    height: 80px;
  }

  .job-node-ring {
    width: 70px;
    height: 70px;
  }

  .job-node-inner {
    width: 50px;
    height: 50px;
  }

  .job-node-info {
    bottom: -30px;
  }

  .job-node-info h4 {
    font-size: 12px;
  }

  .job-node-info .job-level-req {
    font-size: 10px;
  }

  .back-btn,
  .change-btn {
    padding: 12px 25px;
    font-size: 16px;
    min-width: 120px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.job-detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.job-detail-avatar {
  width: 60px;
  height: 60px;
  border-radius: 15%;
  object-fit: cover;
}

.job-detail-title h4 {
  color: #ffd700;
  font-size: 14px;
  margin: 0 0 3px 0;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
}

.job-detail-level {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin: 0;
}

.job-detail-description {
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 6px;
  border-left: 2px solid #ffd700;
}

.job-detail-description p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
}

.job-skills-section h5 {
  color: #ffd700;
  font-size: 12px;
  margin: 0 0 8px 0;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
}

.skill-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.skill-item:hover {
  transform: scale(1.1);
}

.skill-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  object-fit: cover;
  transition: all 0.3s ease;
}

.skill-item:hover .skill-icon {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
}

.skill-key {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 9px;
  font-weight: bold;
}

/* 悬停职业详情面板技能名称样式 */
.job-detail-skills-grid {
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
}

.skill-name-text {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 9px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skill-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 20, 40, 0.99) 100%);
  border: 1px solid rgba(255, 215, 0, 0.6);
  border-radius: 8px;
  padding: 10px;
  z-index: 2300;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.9),
    0 0 15px rgba(255, 215, 0, 0.4);
  animation: tooltipFadeIn 0.3s ease-out;
  margin-bottom: 8px;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.skill-tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.skill-tooltip-icon {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  border: 1px solid #ffd700;
  object-fit: cover;
}

.skill-tooltip-title h5 {
  color: #ffd700;
  font-size: 12px;
  margin: 0 0 2px 0;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
}

.skill-tooltip-type {
  color: rgba(255, 255, 255, 0.6);
  font-size: 9px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-tooltip-body {
  margin-bottom: 8px;
}

.skill-tooltip-description {
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.skill-tooltip-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.skill-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 4px;
  border-left: 2px solid #ffd700;
}

.skill-stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-stat-value {
  color: #ffd700;
  font-size: 10px;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
}

/* ========== 转职需求面板样式 ========== */
.job-requirement-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 340px;
  max-height: 80vh;
  overflow-y: auto;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.97) 0%, rgba(20, 20, 40, 0.99) 100%);
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 12px;
  padding: 16px;
  z-index: 2500;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.9),
    0 0 20px rgba(255, 215, 0, 0.4);
  animation: requirementPanelIn 0.3s ease-out;
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.job-requirement-panel::-webkit-scrollbar {
  width: 8px;
}

.job-requirement-panel::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 4px;
}

.job-requirement-panel::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 4px;
}

@keyframes requirementPanelIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.requirement-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
}

.requirement-avatar {
  width: 60px;
  height: 60px;
  border-radius: 15%;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.requirement-title-area {
  flex: 1;
}

.requirement-title-area h4 {
  color: #ffd700;
  font-size: 16px;
  margin: 0 0 3px 0;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  font-weight: bold;
}

.requirement-tier {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin: 0;
}

.requirement-close-btn {
  background: linear-gradient(135deg, #ff4444, #cc0000);
  border: 1px solid #ff6666;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.requirement-close-btn:hover {
  background: linear-gradient(135deg, #ff6666, #ff0000);
  transform: scale(1.1);
}

/* 原因说明 */
.requirement-reason {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.05));
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 8px;
}

.requirement-reason .reason-icon {
  font-size: 16px;
}

.requirement-reason .reason-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
}

/* 职业描述 */
.requirement-description {
  margin-bottom: 12px;
  padding: 8px 10px;
  background: rgba(255, 215, 0, 0.05);
  border-radius: 6px;
  border-left: 2px solid #ffd700;
}

.requirement-description p {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

/* 转职需求条件 */
.requirement-conditions {
  margin-bottom: 12px;
}

.requirement-conditions h5 {
  color: #ffd700;
  font-size: 12px;
  margin: 0 0 8px 0;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  font-weight: bold;
}

.condition-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.condition-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.condition-item.met {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.05);
}

.condition-item .condition-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.condition-item .condition-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
}

.condition-item.met .condition-text {
  color: rgba(0, 255, 136, 0.9);
}

/* 可转职方向 */
.requirement-next-jobs {
  margin-bottom: 12px;
}

.requirement-next-jobs h5 {
  color: #4a9eff;
  font-size: 12px;
  margin: 0 0 8px 0;
  text-shadow: 0 0 8px rgba(74, 158, 255, 0.8);
  font-weight: bold;
}

.next-job-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.next-job-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.1), rgba(74, 158, 255, 0.05));
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.next-job-item:hover {
  border-color: #4a9eff;
  background: linear-gradient(135deg, rgba(74, 158, 255, 0.2), rgba(74, 158, 255, 0.1));
  transform: translateY(-1px);
}

.next-job-icon {
  width: 28px;
  height: 28px;
  border-radius: 15%;
  object-fit: cover;
  border: 1px solid rgba(74, 158, 255, 0.4);
}

.next-job-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 500;
}

/* 技能预览区域 */
.requirement-skills {
  margin-top: 8px;
}

.requirement-skills h5 {
  color: #ffd700;
  font-size: 12px;
  margin: 0 0 8px 0;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  font-weight: bold;
}

/* ========== 转职二次确认面板样式 ========== */

/** 遮罩层：覆盖全屏，点击空白处关闭 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(2px);
}

/** 确认面板容器：浏览器居中 */
.confirm-panel {
  width: 360px;
  background: linear-gradient(160deg, rgba(15, 12, 25, 0.98) 0%, rgba(8, 6, 16, 0.99) 100%);
  border: 2px solid rgba(255, 215, 0, 0.5);
  border-radius: 16px;
  padding: 28px 24px 20px;
  text-align: center;
  box-shadow:
    0 16px 48px rgba(0, 0, 0, 0.8),
    0 0 24px rgba(255, 215, 0, 0.15);
}

/** 警告图标 */
.confirm-panel-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 12px;
  animation: confirmIconBounce 0.5s ease-out;
}

@keyframes confirmIconBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/** 确认标题 */
.confirm-panel-title {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 14px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
  letter-spacing: 1px;
}

/** 确认消息内容 */
.confirm-panel-message {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

/** 职业名称高亮 */
.confirm-job-name {
  color: #ffd700;
  font-weight: bold;
  text-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
}

/** 警告文本 */
.confirm-warning {
  display: inline-block;
  margin-top: 6px;
  color: #ff6b6b;
  font-size: 13px;
  font-weight: 600;
}

/** 按钮容器 */
.confirm-panel-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/** 取消按钮 */
.confirm-cancel-btn {
  padding: 8px 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(80, 80, 80, 0.8), rgba(50, 50, 50, 0.9));
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.confirm-cancel-btn:hover {
  background: linear-gradient(135deg, rgba(100, 100, 100, 0.9), rgba(70, 70, 70, 0.95));
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

/** 确认按钮 */
.confirm-ok-btn {
  padding: 8px 24px;
  border: 1px solid rgba(255, 204, 0, 0.6);
  border-radius: 8px;
  background: linear-gradient(135deg, #ffd700, #ff9500);
  color: #0f0f23;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.confirm-ok-btn:hover {
  background: linear-gradient(135deg, #ff9500, #ff6600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.5);
}

/** 确认面板过渡动画 */
.confirm-panel-transition-enter-active,
.confirm-panel-transition-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-panel-transition-enter-active .confirm-panel,
.confirm-panel-transition-leave-active .confirm-panel {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.confirm-panel-transition-enter-from,
.confirm-panel-transition-leave-to {
  opacity: 0;
}

.confirm-panel-transition-enter-from .confirm-panel,
.confirm-panel-transition-leave-to .confirm-panel {
  transform: scale(0.85);
  opacity: 0;
}
</style>
