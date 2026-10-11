<!--
  @file SkillPanel.vue
  @description 技能面板组件 - 按K键打开，展示职业进阶时间轴与技能树走向
  @generated 2026-07-11
  @updated 2026-07-19 三转职业技能面板 branch-header 简化：仅显示技能进阶系列名称与解锁等级范围，移除图标和描述
  @updated 2026-07-18 新增八方向拉伸功能，面板尺寸可自由调整，内容自适应
  @updated 2026-07-17 重构为 RPG 技能树风格，六边形技能框 + 能量光束 + GPU 加速动画
-->

<template>
  <transition name="skill-panel-fade" appear>
    <div
      v-if="isVisible"
      ref="panelRef"
      v-drag="{ handle: '.skill-panel-header' }"
      class="skill-panel"
      :style="panelStyle"
    >
      <!-- 面板边缘流光（GPU 合成层，仅动画 opacity） -->
      <div class="panel-edge-glow" aria-hidden="true"></div>

      <!-- 八方向拉伸手柄 -->
      <div
        v-for="handle in resizeHandles"
        :key="handle.dir"
        class="resize-handle"
        :class="'resize-' + handle.dir"
        :style="{ cursor: handle.cursor }"
        @mousedown="onResizeStart($event, handle.dir)"
      ></div>

      <!-- 面板头部（可拖拽） -->
      <div class="skill-panel-header">
        <div class="header-title-group">
          <span class="header-icon">⚔</span>
          <h2 class="panel-title">技能殿堂</h2>
          <span class="header-subtitle">{{ selectedJobName }}</span>
        </div>
        <div class="header-info">
          <span class="header-level">Lv.{{ playerLevel }}</span>
          <button class="close-button" @click="handleClose">×</button>
        </div>
      </div>

      <!-- 上部：职业进阶时间轴 -->
      <div class="job-timeline-section">
        <div class="job-timeline-track">
          <template v-for="(job, index) in jobHistory" :key="job.key">
            <!-- 进阶能量光束（节点之间） -->
            <div
              v-if="index > 0"
              class="evolution-beam"
              :class="{ 'beam-active': selectedJobKey === job.key || isJobReached(job) }"
              aria-hidden="true"
            >
              <span class="beam-line"></span>
              <span class="beam-flow"></span>
            </div>

            <!-- 职业节点 -->
            <div
              class="job-node"
              :class="{
                'job-active': selectedJobKey === job.key,
                'job-current': job.isCurrent,
                'job-reached': isJobReached(job)
              }"
              @click="selectJob(job.key)"
            >
              <div class="job-node-ring" aria-hidden="true"></div>
              <img
                :src="job.avatar"
                :alt="job.name"
                class="job-node-avatar"
                draggable="false"
                @error="handleImageError"
              />
              <span class="job-node-tier">{{ job.tierName }}</span>
              <span class="job-node-name">{{ job.name }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 分隔线 -->
      <div class="section-divider" aria-hidden="true"></div>

      <!-- 下部：技能展示区域 -->
      <div class="skills-section">
        <!-- 无成长线路配置的职业教育：技能流向网格 -->
        <template v-if="!hasGrowthLines">
          <div v-if="sortedSkills.length === 0" class="no-skills-tip">
            该职业暂无技能数据
          </div>
          <div v-else class="skill-stream">
            <div
              v-for="(skill, idx) in sortedSkills"
              :key="skill.id"
              class="skill-stream-cell"
            >
              <!-- 技能之间的流向连接器 -->
              <span
                v-if="idx > 0"
                class="stream-connector"
                aria-hidden="true"
              ></span>
              <SkillNode
                :skill="skill"
                :unlocked="isSkillUnlocked(skill)"
                :proficiency="getSkillProficiency(skill)"
                :in-bar="skillBarSlotsStore.hasSkill(skill.id)"
                :draggable="isSkillDraggable(skill)"
                :type-color="getSkillTypeMeta(skill).color"
                :type-label="getSkillTypeMeta(skill).label"
                @mouseenter="showSkillTooltip($event, skill)"
                @mouseleave="hideSkillTooltip"
                @mousemove="updateTooltipPosition"
                @dragstart="handleDragStart($event, skill)"
                @dragend="onDragEnd"
                @icon-error="handleSkillIconError"
              />
            </div>
          </div>
        </template>

        <!-- 有成长线路配置的职业教育（三转）：按线路分组展示技能树 -->
        <template v-else>
          <div class="growth-tree">
            <div
              v-for="line in growthLineGroups"
              :key="line.key"
              class="growth-branch"
            >
              <!-- 线路标题：左侧显示技能进阶系列名称与解锁等级 -->
              <div class="branch-header">
                <span class="branch-header-name">{{ line.name }}系列</span>
                <span v-if="line.levelRange" class="branch-header-level">{{ line.levelRange }}</span>
              </div>

              <!-- 该线路的技能列表：右侧显示技能进阶图标，用箭头连接表示进阶方向 -->
              <div v-if="line.skills.length === 0" class="growth-line-empty">
                该线路暂无技能
              </div>
              <div v-else class="branch-trunk">
                <div
                  v-for="(skill, idx) in line.skills"
                  :key="skill.id"
                  class="branch-skill"
                >
                  <!-- 节点之间的进阶箭头 -->
                  <span
                    v-if="idx > 0"
                    class="trunk-segment"
                    :class="{ 'segment-active': isSkillUnlocked(skill) }"
                    aria-hidden="true"
                  ></span>
                  <SkillNode
                    :skill="skill"
                    :unlocked="isSkillUnlocked(skill)"
                    :proficiency="getSkillProficiency(skill)"
                    :in-bar="skillBarSlotsStore.hasSkill(skill.id)"
                    :draggable="isSkillDraggable(skill)"
                    :type-color="getSkillTypeMeta(skill).color"
                    :type-label="getSkillTypeMeta(skill).label"
                    @mouseenter="showSkillTooltip($event, skill)"
                    @mouseleave="hideSkillTooltip"
                    @mousemove="updateTooltipPosition"
                    @dragstart="handleDragStart($event, skill)"
                    @dragend="onDragEnd"
                    @icon-error="handleSkillIconError"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>
  </transition>

  <!-- 技能详情提示框（使用共享 SkillTooltip 组件，nonInteractive 避免遮挡鼠标） -->
  <SkillTooltip
    :visible="tooltipVisible"
    :skill="tooltipSkill"
    :position="tooltipPosition"
    :player="props.player"
    :player-class="selectedJobKey"
    :active-buffs="props.activeBuffs"
    :non-interactive="true"
  />
</template>

<script setup>
/**
 * 技能面板组件
 * 用途/业务意图：展示角色职业进阶时间轴与各职业对应的技能树走向
 * 按K键打开/关闭，支持拖拽、主题色适配、点击音效
 */

import { ref, computed, watch } from 'vue'
import { getClassSkills, getGrowthLines } from '@/data/skills'
import {
  JOB_TIER_CONFIG,
  JOB_TIER_NAMES,
  JOB_EVOLUTION_PATHS
} from '@/store/jobs'
import { getClassIconPath } from '@/utils/itemHelpers'
import { CLASS_NAME_MAP } from '@/data/classes'
import SkillTooltip from '@/components/SkillTooltip.vue'
import SkillNode from '@/components/SkillNode.vue'
import { useSkillBarDrag } from '@/composables/useSkillBarDrag'
import { useSkillBarSlotsStore } from '@/store/skillBarSlots'
import { usePanelResize, RESIZE_DIRECTIONS } from '@/composables/usePanelResize'

/**
 * 反向进阶映射表
 * 用于从当前职业反推进阶路径，key 为子职业，value 为父职业
 * @type {Record<string, string>}
 */
const REVERSE_EVOLUTION_MAP = (() => {
  const map = {}
  Object.entries(JOB_EVOLUTION_PATHS).forEach(([parent, children]) => {
    children.forEach(child => {
      // 多个父职业可能指向同一子职业，取第一个匹配
      if (!map[child]) {
        map[child] = parent
      }
    })
  })
  return Object.freeze(map)
})()

/**
* 技能类型元数据映射表
* key 为技能 type 值，value 为 { label: 中文名, color: 主题色 }
* 伤害型（single/aoe/dot）统一红色，buff类（buff/debuff）绿色，治疗蓝色，功能灰色，召唤青色
* @type {Record<string, {label: string, color: string}>}
*/
const SKILL_TYPE_META = Object.freeze({
  single: { label: '单体', color: '#ff5252' },
  aoe: { label: '范围', color: '#ff5252' },
  buff: { label: '增益', color: '#4caf50' },
  debuff: { label: '减益', color: '#4caf50' },
  heal: { label: '治疗', color: '#42a5f5' },
  dot: { label: '持续', color: '#ff5252' },
  utility: { label: '功能', color: '#90a4ae' },
  summon: { label: '召唤', color: '#26c6da' }
})

/**
* 构建职业进阶历史路径
* 优先使用玩家保存的 jobHistory（解决多父职业反推错误问题），
* 回退到 REVERSE_EVOLUTION_MAP 反推
* @param {string} currentClass - 当前职业 key
* @param {string} gender - 玩家性别
* @param {string[]|null} playerJobHistory - 玩家保存的职业历史路径数组
* @returns {Array<{key: string, name: string, avatar: string, tier: number, tierName: string, isCurrent: boolean}>}
*/
function buildJobHistory (currentClass, gender = 'male', playerJobHistory = null) {
const currentLower = currentClass?.toLowerCase() || 'beginner'

// 优先使用玩家保存的职业历史路径（解决多父职业反推错误）
if (Array.isArray(playerJobHistory) && playerJobHistory.length > 0) {
const hasCurrent = playerJobHistory.some(j => j?.toLowerCase() === currentLower)
if (hasCurrent) {
const path = []
const seen = new Set()
for (const jobKey of playerJobHistory) {
const key = jobKey?.toLowerCase()
if (!key || seen.has(key)) continue
seen.add(key)
const config = JOB_TIER_CONFIG[key]
if (!config) continue
path.push({
key,
name: config.name || CLASS_NAME_MAP[key] || key,
avatar: getJobAvatarPath(key, gender),
tier: config.tier ?? 0,
tierName: JOB_TIER_NAMES[config.tier ?? 0] || '未知',
isCurrent: key === currentLower
})
}
if (path.length > 0) {
return Object.freeze(path)
}
}
}

// 回退：从当前职业反推到初心者
const path = []
let current = currentLower
const visited = new Set()

while (current && !visited.has(current)) {
visited.add(current)
const config = JOB_TIER_CONFIG[current]
if (!config) break

path.unshift({
key: current,
name: config.name || CLASS_NAME_MAP[current] || current,
avatar: getJobAvatarPath(current, gender),
tier: config.tier ?? 0,
tierName: JOB_TIER_NAMES[config.tier ?? 0] || '未知',
isCurrent: current === currentLower
})

// 反向查找父职业
const parent = REVERSE_EVOLUTION_MAP[current]
if (!parent) break
current = parent
}

return Object.freeze(path)
}

/**
 * 获取职业头像路径
 * @param {string} classKey - 职业 key
 * @param {string} gender - 性别
 * @returns {string} 头像图片路径
 */
function getJobAvatarPath (classKey, gender = 'male') {
  // 使用统一的 getClassIconPath 函数，正确处理三转职业图标命名（无_icon后缀）
  return getClassIconPath(classKey, gender)
}

// ========== Props ==========
const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  },
  /** 玩家数据 */
  player: {
    type: Object,
    default: () => ({})
  },
  /** 当前激活的BUFF列表（用于技能伤害计算） */
  activeBuffs: {
    type: Array,
    default: () => []
  }
})

// ========== Emits ==========
const emit = defineEmits(['close', 'play-sfx'])

// ========== 响应式状态 ==========
const panelRef = ref(null)

/** 当前选中的职业 key */
const selectedJobKey = ref('')

/** 技能悬浮提示状态（传给 SkillTooltip 组件） */
const tooltipVisible = ref(false)
const tooltipSkill = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

/** 技能栏槽位 Store - 用于检查技能是否已在技能栏中 */
const skillBarSlotsStore = useSkillBarSlotsStore()

/** 拖拽组合式函数 */
const { onPanelDragStart, onDragEnd } = useSkillBarDrag()

/**
 * 八方向拉伸组合式函数
 * 支持上下左右+斜角拉伸，尺寸持久化到 localStorage
 */
const {
  panelWidth,
  panelHeight,
  startResize,
  restoreSize
} = usePanelResize({
  storageKey: 'skillPanelSize',
  defaultWidth: 760,
  defaultHeight: 600,
  minWidth: 480,
  minHeight: 360
})

/** 八方向拉伸手柄配置 */
const resizeHandles = RESIZE_DIRECTIONS

/** 面板内联样式（宽高由响应式变量驱动，与拉伸/DOM 操作同步） */
const panelStyle = computed(() => ({
  width: `${panelWidth.value}px`,
  height: `${panelHeight.value}px`
}))

/**
 * 拉伸手柄 mousedown 事件处理
 * 委托给 usePanelResize 的 startResize 方法，传入面板根元素
 * @param {MouseEvent} event - 鼠标按下事件
 * @param {string} direction - 拉伸方向
 */
const onResizeStart = (event, direction) => {
  startResize(event, direction, panelRef.value)
}

// ========== 计算属性 ==========

/**
 * 玩家性别
 */
const playerGender = computed(() => {
  return props.player?.sex || 'male'
})

/**
 * 玩家等级
 */
const playerLevel = computed(() => Number(props.player?.level ?? 1))

/**
 * 职业进阶历史路径
 */
const jobHistory = computed(() => {
const currentClass = props.player?.class || 'beginner'
return buildJobHistory(currentClass, playerGender.value, props.player?.jobHistory)
})

/**
 * 当前选中职业的中文名称
 */
const selectedJobName = computed(() => {
  const job = jobHistory.value.find(j => j.key === selectedJobKey.value)
  return job?.name || ''
})

/**
 * 当前职业是否拥有成长线路配置（三转职业教育）
 */
const growthLineConfigs = computed(() => getGrowthLines(selectedJobKey.value))

/**
 * 当前职业是否拥有成长线路配置（需要按线路分组展示）
 */
const hasGrowthLines = computed(() => growthLineConfigs.value.length > 0)

/**
 * 按成长线路分组的技能列表（仅三转职业教育使用）
 * 每条线路包含其配置信息和该线路下的技能数组（按解锁等级排序）
 * @returns {Array<{key: string, name: string, icon: string, description: string, skills: Array, levelRange: string}>}
 *   levelRange: 该线路的解锁等级范围字符串（如 "166级" 或 "180-190级"），用于 branch-header 简洁展示
 */
const growthLineGroups = computed(() => {
  if (!selectedJobKey.value) return []

  const classSkills = getClassSkills(selectedJobKey.value)
  if (!classSkills || typeof classSkills !== 'object') return []

  // 所有有效技能
  const allSkills = Object.values(classSkills).filter(skill => skill && skill.id)

  // 按成长线路分组，并按线路最低解锁等级从低到高排序
  return growthLineConfigs.value
    .map(lineConfig => {
      const lineSkills = allSkills
        .filter(skill => skill.growthLine === lineConfig.key)
        .sort((a, b) => {
          const levelA = a.unlockLevel || 0
          const levelB = b.unlockLevel || 0
          return levelA - levelB
        })

      // 计算该线路的解锁等级范围，用于 branch-header 简洁展示
      // 单技能显示 "166级"，多技能显示 "180-190级"
      const levels = lineSkills
        .map(s => Number(s.unlockLevel) || 0)
        .filter(l => l > 0)
      let levelRange = ''
      if (levels.length === 1) {
        levelRange = `${levels[0]}级`
      } else if (levels.length > 1) {
        const min = Math.min(...levels)
        const max = Math.max(...levels)
        levelRange = min === max ? `${min}级` : `${min}-${max}级`
      }

      // 线路最低解锁等级，用于线路间排序（无技能的线路排到最后）
      const minLevel = levels.length > 0 ? Math.min(...levels) : Infinity

      return { ...lineConfig, skills: lineSkills, levelRange, minLevel }
    })
    .sort((a, b) => a.minLevel - b.minLevel)
})

/**
 * 当前选中职业的技能列表（按解锁等级从低到高排序）
 * 仅用于无成长线路配置的职业教育（平铺展示）
 */
const sortedSkills = computed(() => {
  if (!selectedJobKey.value) return []

  const classSkills = getClassSkills(selectedJobKey.value)
  if (!classSkills || typeof classSkills !== 'object') return []

  return Object.values(classSkills)
    .filter(skill => skill && skill.id)
    .sort((a, b) => {
      const levelA = a.unlockLevel || 0
      const levelB = b.unlockLevel || 0
      if (levelA !== levelB) return levelA - levelB
      return 0
    })
})

// ========== 监听器 ==========

/**
 * 面板打开时默认选中当前职业
 */
watch(
  () => props.isVisible,
  visible => {
    if (visible) {
      const currentClass = props.player?.class || 'beginner'
      selectedJobKey.value = currentClass.toLowerCase()
      // 恢复保存的面板尺寸
      restoreSize()
    }
  },
  { immediate: true }
)

/**
 * 玩家职业变化时更新选中职业
 */
watch(
  () => props.player?.class,
  newClass => {
    if (props.isVisible && newClass) {
      selectedJobKey.value = newClass.toLowerCase()
    }
  }
)

// ========== 方法 ==========

/**
 * 选择职业，展示该职业技能
 * @param {string} jobKey - 职业 key
 */
const selectJob = jobKey => {
  selectedJobKey.value = jobKey
}

/**
 * 判断某职业节点是否已被玩家达到（当前职业或其前置职业）
 * 用于时间轴光束激活态判断
 * @param {{key: string, tier: number}} job - 职业节点
 * @returns {boolean} 是否已达到
 */
const isJobReached = job => {
  if (!job) return false
  const currentTier = JOB_TIER_CONFIG[props.player?.class?.toLowerCase()]?.tier ?? 0
  return (job.tier ?? 0) <= currentTier
}

/**
 * 关闭面板，播放点击音效
 */
const handleClose = () => {
  playClickSound()
  emit('close')
}

/**
 * 播放点击音效
 * 优先通过 emit 通知父组件播放，回退到 window.playClickSound
 */
const playClickSound = () => {
  try {
    emit('play-sfx', 'InfClick.wav')
    if (typeof window !== 'undefined' && typeof window.playClickSound === 'function') {
      window.playClickSound()
    }
  } catch (error) {
    console.error('[SkillPanel] 播放点击音效失败:', error)
  }
}

/**
 * 合并玩家熟练度数据到静态技能配置
 * 确保 SkillTooltip 显示的熟练度信息与底部技能栏一致
 * 静态技能配置（getClassSkills 返回值）不含 level/proficiencyLevel/proficiency 等扁平字段，
 * 需从 player.skills[skill.key] 中提取并合并，与 store/skills.js 的 finishSkillInitialization 归一化逻辑保持一致
 * @param {Object} skill - 静态技能配置对象
 * @returns {Object} 合并玩家熟练度数据后的技能对象
 */
const mergePlayerProficiency = (skill) => {
  if (!skill || !skill.key) return skill
  const playerSkill = props.player?.skills?.[skill.key]
  if (!playerSkill) return skill

  // 提取熟练度等级（与 finishSkillInitialization 保持一致）
  const rawLevel = Number(
    playerSkill.proficiencyLevel ??
      (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
        ? playerSkill.proficiency.level
        : undefined) ??
      playerSkill.level ?? 1
  )
  const safeLevel = Number.isFinite(rawLevel) && rawLevel > 0 ? rawLevel : 1

  // 提取当前熟练度经验
  const rawProficiency = Number(
    playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
      ? playerSkill.proficiency.exp
      : playerSkill.proficiency ?? 0
  )
  const safeProficiency = Number.isFinite(rawProficiency) && rawProficiency >= 0 ? rawProficiency : 0

  // 提取升级所需经验
  const rawExpRequired = Number(
    playerSkill.proficiencyExp ??
      (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
        ? playerSkill.proficiency.expRequired
        : undefined) ??
      safeLevel * 10
  )
  const safeExpRequired = Number.isFinite(rawExpRequired) && rawExpRequired > 0 ? rawExpRequired : safeLevel * 10

  // 提取最大熟练度等级
  const rawMaxLevel = Number(
    skill.proficiency?.maxLevel ??
      playerSkill.proficiencyMaxLevel ??
      (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
        ? playerSkill.proficiency.maxLevel
        : undefined) ??
      10
  )
  const safeMaxLevel = Number.isFinite(rawMaxLevel) && rawMaxLevel > 0 ? rawMaxLevel : 10

  return {
    ...skill,
    level: safeLevel,
    proficiencyLevel: safeLevel,
    proficiency: safeProficiency,
    proficiencyExp: safeExpRequired,
    proficiencyMaxLevel: safeMaxLevel
  }
}

/**
 * 显示技能悬浮提示
 * 合并玩家熟练度数据后传递给 SkillTooltip，确保与底部技能栏显示一致
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} skill - 技能对象
 */
const showSkillTooltip = (event, skill) => {
  tooltipSkill.value = mergePlayerProficiency(skill)
  tooltipVisible.value = true
  updateTooltipPosition(event)
}

/**
 * 隐藏技能悬浮提示
 */
const hideSkillTooltip = () => {
  tooltipVisible.value = false
  tooltipSkill.value = null
}

/**
 * 拖拽开始时处理：先隐藏技能详情面板（避免遮挡鼠标），再执行原有拖拽逻辑
 * 拖拽技能图标时 tooltip 会遮挡鼠标，影响拖向底部技能栏的体验
 * @param {DragEvent} event - 拖拽事件
 * @param {Object} skill - 技能对象
 */
const handleDragStart = (event, skill) => {
  hideSkillTooltip()
  onPanelDragStart(event, skill)
}

/**
 * 更新悬浮提示位置
 * 仅更新鼠标坐标，实际定位由 SkillTooltip 组件内部 syncTooltipPosition 处理
 * @param {MouseEvent} event - 鼠标事件
 */
const updateTooltipPosition = event => {
  tooltipPosition.value = { x: event.clientX, y: event.clientY }
}

/**
 * 处理职业图片加载失败
 * @param {Event} event - 错误事件
 */
const handleImageError = event => {
  if (event?.target) {
    event.target.src = '/pt/job_icon/cxz_nan_icon.png'
  }
}

/**
 * 处理技能图标加载失败
 * @param {Event} event - 错误事件
 */
const handleSkillIconError = event => {
  if (event?.target) {
    event.target.src = '/pt/skill_icon/default_skill.png'
  }
}

/**
 * 检查技能是否可拖拽到技能栏
 * 仅主动技能（非被动）可拖拽，不限制解锁状态
 * 未解锁的技能拖入后由 SkillButton 显示锁定状态，自动战斗也会过滤未解锁技能
 * @param {Object} skill - 技能对象
 * @returns {boolean} 是否可拖拽
 */
const isSkillDraggable = skill => {
  if (!skill) {
    return false
  }
  // 被动技能不可拖拽
  if (skill.isPassive === true) {
    return false
  }
  return true
}

/**
 * 获取技能的熟练度等级信息
 * 优先读取玩家已学技能的熟练度，回退到技能基础配置
 * @param {Object} skill - 技能对象
 * @returns {{level: number, maxLevel: number}} 熟练度等级与上限
 */
const getSkillProficiency = skill => {
  if (!skill) return { level: 1, maxLevel: 10 }
  const playerSkill = props.player?.skills?.[skill.key]
  let level = 1
  if (playerSkill) {
    // 兼容 proficiency 为数字（等级）或对象 { level, exp } 两种存储形式
    const raw = playerSkill.proficiencyLevel ??
      (playerSkill.proficiency && typeof playerSkill.proficiency === 'object'
        ? playerSkill.proficiency.level
        : playerSkill.proficiency) ??
      playerSkill.level ?? 1
    level = Number(raw)
    if (!Number.isFinite(level) || level < 1) level = 1
  }
  const rawMax = Number(skill.proficiency?.maxLevel ?? 10)
  const maxLevel = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 10
  return { level, maxLevel }
}

/**
 * 判断技能是否已解锁
 * 优先使用技能自带的 unlockCondition 函数，回退到等级比较
 * @param {Object} skill - 技能对象
 * @returns {boolean} 是否已解锁
 */
const isSkillUnlocked = skill => {
  if (!skill) return false
  try {
    if (typeof skill.unlockCondition === 'function') {
      return Boolean(skill.unlockCondition(props.player))
    }
  } catch (error) {
    console.error('[SkillPanel] 技能解锁条件判断失败:', error)
  }
  const unlockLevel = Number(skill.unlockLevel ?? 1)
  return playerLevel.value >= unlockLevel
}

/**
* 获取技能类型元数据（中文名 + 主题色）
* 被动技能优先显示紫色，其余按 type 映射
* @param {Object} skill - 技能对象
* @returns {{label: string, color: string}} 类型元数据
*/
const getSkillTypeMeta = skill => {
// 被动技能优先显示紫色
if (skill?.isPassive === true) {
return { label: '被动', color: '#9c27b0' }
}
const meta = skill?.type ? SKILL_TYPE_META[skill.type] : null
return meta || { label: '技能', color: '#90a4ae' }
}
</script>

<style scoped>
/* ==================== 面板容器 ==================== */
.skill-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* width 和 height 由内联 style（panelStyle）驱动，支持拉伸 */
  background-color: var(--theme-modal-bg, rgba(0, 0, 0, 0.88));
  border: 1px solid var(--theme-border-strong, #8b7355);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 1px var(--theme-accent, #ffd700);
  display: flex;
  flex-direction: column;
  z-index: 3000;
  overflow: hidden;
  color: var(--theme-text, #ffffff);
  font-family: 'Georgia', 'Microsoft YaHei', serif;
  /* 提升为合成层，子元素动画走 GPU */
  contain: layout paint;
}

/* 拉伸过程中禁用过渡动画和文本选择 */
body.panel-resizing .skill-panel,
body.panel-resizing .skill-panel * {
  transition: none !important;
  user-select: none !important;
}

/* ==================== 八方向拉伸手柄 ==================== */
.resize-handle {
  position: absolute;
  z-index: 20;
  pointer-events: auto;
}

/* 边手柄 */
.resize-n {
  top: -2px;
  left: 12px;
  right: 12px;
  height: 8px;
}

.resize-s {
  bottom: -2px;
  left: 12px;
  right: 12px;
  height: 8px;
}

.resize-e {
  right: -2px;
  top: 12px;
  bottom: 12px;
  width: 8px;
}

.resize-w {
  left: -2px;
  top: 12px;
  bottom: 12px;
  width: 8px;
}

/* 角手柄 */
.resize-nw {
  top: -3px;
  left: -3px;
  width: 14px;
  height: 14px;
  border-radius: 4px 0 0 0;
}

.resize-ne {
  top: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  border-radius: 0 4px 0 0;
}

.resize-sw {
  bottom: -3px;
  left: -3px;
  width: 14px;
  height: 14px;
  border-radius: 0 0 0 4px;
}

.resize-se {
  bottom: -3px;
  right: -3px;
  width: 14px;
  height: 14px;
  border-radius: 0 0 4px 0;
}

/* 角手柄可见纹理 */
.resize-nw::after,
.resize-ne::after,
.resize-sw::after,
.resize-se::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  background: linear-gradient(135deg, transparent 40%, rgba(255, 215, 0, 0.15) 100%);
  opacity: 0.6;
  transition: opacity 0.2s ease, background 0.2s ease;
}

.resize-nw:hover::after,
.resize-ne:hover::after,
.resize-sw:hover::after,
.resize-se:hover::after {
  opacity: 1;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 215, 0, 0.4) 100%);
}

/* 边手柄悬停高亮 */
.resize-n:hover,
.resize-s:hover,
.resize-e:hover,
.resize-w:hover {
  background: rgba(255, 215, 0, 0.15);
}

/* 面板边缘流光：固定大小的渐变环，仅动画 opacity，GPU 友好 */
.panel-edge-glow {
  position: absolute;
  inset: -1px;
  border-radius: 14px;
  pointer-events: none;
  background: linear-gradient(125deg, transparent 30%, var(--theme-accent, #ffd700) 50%, transparent 70%);
  opacity: 0;
  filter: blur(2px);
  -webkit-mask: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
  animation: edge-pulse 3.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes edge-pulse {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.45; }
}

/* ==================== 头部 ==================== */
.skill-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: linear-gradient(180deg, rgba(255, 215, 0, 0.08), var(--theme-header-bg, #000000));
  border-bottom: 1px solid var(--theme-border-strong, #8b7355);
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.skill-panel-header:active {
  cursor: grabbing;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
  color: var(--theme-accent, #ffd700);
  line-height: 1;
}

.panel-title {
  margin: 0;
  font-size: 19px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  letter-spacing: 3px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.header-subtitle {
  font-size: 13px;
  color: var(--theme-muted, #aaa);
  padding-left: 10px;
  border-left: 1px solid var(--theme-border, #8b7355);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-level {
  font-size: 14px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
}

.close-button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--theme-border-strong, #8b7355);
  border-radius: 6px;
  background-color: var(--theme-button-bg, rgba(0, 0, 0, 0.7));
  color: var(--theme-button-text, #ffffff);
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  line-height: 1;
  padding: 0;
}

.close-button:hover {
  background-color: var(--theme-accent, #ffd700);
  color: #000000;
  border-color: var(--theme-accent, #ffd700);
  transform: rotate(90deg);
}

/* ==================== 职业进阶时间轴 ==================== */
.job-timeline-section {
  padding: 18px 16px 14px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.job-timeline-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}

/* 进阶能量光束 */
.evolution-beam {
  position: relative;
  width: 44px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.beam-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, var(--theme-border-strong, #8b7355), var(--theme-border-strong, #8b7355));
  border-radius: 1px;
}

.beam-flow {
  position: absolute;
  left: 0;
  top: 50%;
  width: 40%;
  height: 2px;
  transform: translateY(-50%) translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--theme-accent, #ffd700), transparent);
  border-radius: 1px;
  opacity: 0;
}

/* 已达到的职业间光束激活：流动光效（translateX 动画，GPU 合成） */
.evolution-beam.beam-active .beam-line {
  background: linear-gradient(90deg, var(--theme-accent, #ffd700), var(--theme-border, #8b7355));
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
}

.evolution-beam.beam-active .beam-flow {
  opacity: 1;
  animation: beam-flow 1.8s linear infinite;
  will-change: transform;
}

@keyframes beam-flow {
  0% { transform: translateY(-50%) translateX(-100%); }
  100% { transform: translateY(-50%) translateX(250%); }
}

/* 职业节点 */
.job-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.25s ease, border-color 0.25s ease, background-color 0.25s ease;
  min-width: 92px;
}

/* 节点脉冲光环（仅 opacity 动画） */
.job-node-ring {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: 2px solid var(--theme-accent, #ffd700);
  opacity: 0;
  pointer-events: none;
}

.job-node:hover {
  transform: translateY(-3px);
  border-color: var(--theme-border, #8b7355);
  background-color: rgba(139, 115, 85, 0.12);
}

.job-node.job-active {
  border-color: var(--theme-accent, #ffd700);
  background-color: rgba(255, 215, 0, 0.1);
}

/* 当前职业：脉冲光环 */
.job-node.job-current .job-node-ring {
  opacity: 1;
  animation: ring-pulse 2s ease-in-out infinite;
  will-change: opacity, transform;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 0; transform: translateX(-50%) scale(1.25); }
}

.job-node-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--theme-border, #8b7355);
  pointer-events: none;
  transition: border-color 0.25s ease;
}

.job-node.job-active .job-node-avatar,
.job-node.job-current .job-node-avatar {
  border-color: var(--theme-accent, #ffd700);
}

.job-node-tier {
  font-size: 10px;
  color: var(--theme-muted, #aaa);
  margin-top: 2px;
}

.job-node-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-text, #ffffff);
  text-align: center;
  white-space: nowrap;
}

.job-node.job-current .job-node-name {
  color: var(--theme-accent, #ffd700);
}

/* ==================== 分隔线 ==================== */
.section-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-border-strong, #8b7355) 20%,
    var(--theme-border-strong, #8b7355) 80%,
    transparent
  );
  margin: 0 18px;
  flex-shrink: 0;
}

/* ==================== 成长线路技能树 ==================== */
.growth-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.growth-branch {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.branch-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  margin-bottom: 0;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(139, 115, 85, 0.08));
  border-left: 3px solid var(--theme-accent, #ffd700);
  border-radius: 6px;
  flex-shrink: 0;
  width: 140px;
  min-width: 140px;
  max-width: 160px;
}

.branch-header-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  white-space: nowrap;
}

/* 解锁等级徽章：紧凑展示该线路的等级或等级范围 */
.branch-header-level {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.35);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.4;
}

.growth-line-empty {
  text-align: center;
  padding: 16px 0;
  color: var(--theme-muted, #aaa);
  font-size: 12px;
}

/* 树干容器：水平排列技能节点（从左往右进阶），用箭头连接表示进阶方向 */
.branch-trunk {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 6px 6px;
  flex-wrap: wrap;
  flex: 1;
}

.branch-skill {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
}

/* 节点之间的进阶箭头连接器（横向，带箭头头部） */
.trunk-segment {
  display: block;
  position: relative;
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, var(--theme-border-strong, #8b7355), var(--theme-border, #8b7355));
  border-radius: 1px;
  margin-right: 4px;
  flex-shrink: 0;
}

/* 箭头头部 */
.trunk-segment::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 50%;
  width: 0;
  height: 0;
  border-left: 6px solid var(--theme-border, #8b7355);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transform: translateY(-50%);
}

.trunk-segment.segment-active {
  background: linear-gradient(90deg, var(--theme-accent, #ffd700), var(--theme-accent, #ffd700));
  box-shadow: 0 0 5px rgba(255, 215, 0, 0.4);
}

.trunk-segment.segment-active::after {
  border-left-color: var(--theme-accent, #ffd700);
}

/* ==================== 技能展示区域 ==================== */
.skills-section {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  min-height: 80px;
}

.skills-section::-webkit-scrollbar {
  width: 6px;
}

.skills-section::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.skills-section::-webkit-scrollbar-thumb {
  background: var(--theme-border-strong, #8b7355);
  border-radius: 3px;
}

.no-skills-tip {
  text-align: center;
  padding: 40px 0;
  color: var(--theme-muted, #aaa);
  font-size: 14px;
}

/* ==================== 技能流向网格（无成长线路） ==================== */
.skill-stream {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px 0;
  justify-content: center;
}

.skill-stream-cell {
  display: flex;
  align-items: center;
}

/* 技能之间的流向连接器：小箭头光束 */
.stream-connector {
  display: block;
  width: 18px;
  height: 2px;
  background: linear-gradient(90deg, var(--theme-border-strong, #8b7355), var(--theme-accent, #ffd700));
  border-radius: 1px;
  flex-shrink: 0;
  position: relative;
  margin: 0 2px;
}

.stream-connector::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  width: 0;
  height: 0;
  border-left: 5px solid var(--theme-accent, #ffd700);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transform: translateY(-50%);
}

/* 面板过渡动画 */
.skill-panel-fade-enter-active,
.skill-panel-fade-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.skill-panel-fade-enter-from,
.skill-panel-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.92);
}
</style>
