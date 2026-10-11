<!--
 @file MagicCagePanel.vue
 @description 魔法牢笼抽奖面板
              业务意图：玩家使用魔法牢笼时弹出炫酷的抽奖面板，
              支持单次开启和一键批量开启，每次开启播放 GPU 加速动画。
              动画使用 CSS transform/opacity 实现 GPU 加速，避免卡顿。
              面板无背景遮罩，头部可拖拽，四边四角可自由拉伸。
 @generated 2026-07-12
-->
<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="mc-panel"
      :style="panelStyle"
      @click.stop
    >
      <!-- 头部（可拖拽） -->
      <div class="mc-header" @mousedown.prevent="startDrag">
        <div class="mc-header-bg"></div>
        <div class="mc-title">⚡ 魔法牢笼</div>
        <button class="mc-help-btn" @click.stop="toggleHelpPanel" aria-label="概率说明">?</button>
        <button class="mc-close-btn" @click="handleClose" aria-label="关闭">×</button>
      </div>

      <!-- 信息栏：显示牢笼与钥匙数量 -->
      <div class="mc-info-bar">
        <div class="mc-info-item mc-info-cage">
          <img
            src="/pt/item_icon/1000000.png"
            class="mc-info-icon"
            alt="魔法牢笼"
            @mouseenter="showItemTooltip(getItemConfigById(MAGIC_CAGE_ID), $event)"
            @mousemove="moveItemTooltip"
            @mouseleave="hideItemTooltip"
          />
          <span class="mc-info-label">魔法牢笼</span>
          <span class="mc-info-count" :class="{ 'mc-info-count--low': cageCount === 0 }">×{{ cageCount }}</span>
        </div>
        <div
          v-for="keyInfo in keyInfos"
          :key="keyInfo.id"
          class="mc-info-item"
          :class="{ 'mc-info-item--active': keyInfo.count > 0 }"
        >
          <img
            :src="`/pt/item_icon/${keyInfo.id}.png`"
            class="mc-info-icon"
            alt=""
            @mouseenter="showItemTooltip(getItemConfigById(keyInfo.id), $event)"
            @mousemove="moveItemTooltip"
            @mouseleave="hideItemTooltip"
          />
          <span class="mc-info-label">{{ keyInfo.shortLabel }}</span>
          <span class="mc-info-count" :class="{ 'mc-info-count--low': keyInfo.count === 0 }">×{{ keyInfo.count }}</span>
        </div>
      </div>

      <!-- 开奖舞台 -->
      <div class="mc-stage">
        <!-- 背景光圈 -->
        <div class="mc-stage-glow" :class="stageGlowClass" :style="stageGlowStyle"></div>

        <!-- 牢笼 -->
        <div
          class="mc-cage"
          :class="cageClass"
          v-show="!currentReveal"
        >
          <img
            src="/pt/item_icon/1000000.png"
            class="mc-cage-icon"
            alt="魔法牢笼"
            draggable="false"
            @mouseenter="showItemTooltip(getItemConfigById(MAGIC_CAGE_ID), $event)"
            @mousemove="moveItemTooltip"
            @mouseleave="hideItemTooltip"
          />
          <div class="mc-cage-shine"></div>
        </div>

        <!-- 揭示卡片 -->
        <Transition name="mc-reveal">
          <div
            v-if="currentReveal"
            class="mc-reveal"
            :style="getGradeStyle(currentReveal.gradeType)"
          >
            <div class="mc-reveal-rays"></div>
            <div class="mc-reveal-card">
              <div class="mc-reveal-card-border"></div>
              <img
                :src="`/pt/item_icon/${currentReveal.petId}.png`"
                class="mc-reveal-icon"
                alt=""
                draggable="false"
                @mouseenter="showItemTooltip(buildPetTooltipItem(currentReveal), $event)"
                @mousemove="moveItemTooltip"
                @mouseleave="hideItemTooltip"
              />
              <div class="mc-reveal-name">{{ currentReveal.petName }}</div>
              <div class="mc-reveal-grade-badge">{{ currentReveal.gradeType }}级</div>
              <div class="mc-reveal-price">💰 {{ formatPrice(currentReveal.sellPrice) }}</div>
            </div>
          </div>
        </Transition>

        <!-- 空结果提示 -->
        <Transition name="mc-fade">
          <div v-if="currentReveal === null && showedEmpty" class="mc-empty-result">
            <div class="mc-empty-text">魔法牢笼是空的…</div>
          </div>
        </Transition>

        <!-- 粒子效果 -->
        <div class="mc-particles" v-if="isBursting">
          <div
            v-for="i in particleCount"
            :key="i"
            class="mc-particle"
            :style="getParticleStyle(i)"
          ></div>
        </div>

        <!-- 进度条（批量开启时） -->
        <Transition name="mc-fade">
          <div v-if="isBatchOpening" class="mc-progress">
            <div class="mc-progress-bar">
              <div class="mc-progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <div class="mc-progress-text">{{ batchProgress.current }} / {{ batchProgress.total }}</div>
          </div>
        </Transition>
      </div>

      <!-- 结果列表 -->
      <div class="mc-results" v-if="results.length > 0">
        <div class="mc-results-header">
          <span class="mc-results-title">📋 开启结果 ({{ results.length }})</span>
          <div class="mc-results-summary">
            <span class="mc-summary-item">总计价值: 💰 {{ formatPrice(totalValue) }}</span>
            <button class="mc-clear-btn" @click="clearResults">清空</button>
          </div>
        </div>
        <div class="mc-results-grid">
          <div
            v-for="(result, index) in results"
            :key="result.uid"
            class="mc-result-item"
            :style="[getGradeStyle(result.gradeType), { animationDelay: `${Math.min(index * 30, 600)}ms` }]"
          >
            <img
              :src="`/pt/item_icon/${result.petId}.png`"
              class="mc-result-icon"
              alt=""
              draggable="false"
              @mouseenter="showItemTooltip(buildPetTooltipItem(result), $event)"
              @mousemove="moveItemTooltip"
              @mouseleave="hideItemTooltip"
            />
            <div class="mc-result-info">
              <div class="mc-result-name">{{ result.petName }}</div>
              <div class="mc-result-grade">{{ result.gradeType }}级</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mc-actions">
        <button
          class="mc-btn mc-btn-open"
          :disabled="isOpening || cageCount === 0 || keyCount === 0"
          @click="openOne"
        >
          <span class="mc-btn-icon">🔓</span>
          <span>开启一次</span>
        </button>
        <button
          class="mc-btn mc-btn-all"
          :class="{ 'mc-btn-stop': isBatchOpening }"
          :disabled="(!isBatchOpening && (isOpening || cageCount === 0 || keyCount === 0))"
          @click="toggleAutoOpen"
        >
          <span class="mc-btn-icon">{{ isBatchOpening ? '⏹' : '✨' }}</span>
          <span>{{ isBatchOpening ? '停止自动开启' : `一键开启 (${maxBatchCount})` }}</span>
        </button>
      </div>

      <!-- 无钥匙提示 -->
      <Transition name="mc-fade">
        <div v-if="keyCount === 0 && cageCount > 0" class="mc-warning">
          ⚠️ 需要宠物笼钥匙才能开启魔法牢笼！
        </div>
      </Transition>

      <!-- 当前钥匙开出概率 -->
      <Transition name="mc-fade">
        <div v-if="activeKeyInfo" class="mc-prob-info">
          <img :src="`/pt/item_icon/${activeKeyInfo.id}.png`" class="mc-prob-icon" alt="" />
          <span class="mc-prob-label">当前钥匙：</span>
          <span class="mc-prob-key-name">{{ activeKeyInfo.label }}</span>
          <span class="mc-prob-divider">|</span>
          <span class="mc-prob-rate mc-prob-rate--success">开出宠物 {{ Math.round(activeKeyInfo.petRate * 100) }}%</span>
          <span class="mc-prob-rate mc-prob-rate--fail">未开出 {{ Math.round((1 - activeKeyInfo.petRate) * 100) }}%</span>
        </div>
      </Transition>

      <!-- 拉伸手柄 -->
      <div class="mc-resize mc-resize-n" @mousedown.prevent="startResize('n', $event)"></div>
      <div class="mc-resize mc-resize-s" @mousedown.prevent="startResize('s', $event)"></div>
      <div class="mc-resize mc-resize-e" @mousedown.prevent="startResize('e', $event)"></div>
      <div class="mc-resize mc-resize-w" @mousedown.prevent="startResize('w', $event)"></div>
      <div class="mc-resize mc-resize-ne" @mousedown.prevent="startResize('ne', $event)"></div>
      <div class="mc-resize mc-resize-nw" @mousedown.prevent="startResize('nw', $event)"></div>
      <div class="mc-resize mc-resize-se" @mousedown.prevent="startResize('se', $event)">
        <div class="mc-resize-lines">
          <span class="mc-resize-line"></span>
          <span class="mc-resize-line"></span>
          <span class="mc-resize-line"></span>
        </div>
      </div>
      <div class="mc-resize mc-resize-sw" @mousedown.prevent="startResize('sw', $event)"></div>
    </div>

    <!-- 概率说明面板（贴合主面板右侧外部） -->
    <Transition name="mc-help-slide">
      <div
        v-if="isVisible && showHelpPanel"
        class="mc-help-panel"
        :style="helpPanelStyle"
        @click.stop
      >
        <div class="mc-help-title">概率说明</div>
        <div class="mc-help-body">
          <!-- 表头 -->
          <div class="mc-help-legend">
            <span class="mc-help-legend-grade">品级</span>
            <span class="mc-help-legend-cond">条件概率</span>
            <span class="mc-help-legend-abs">绝对概率</span>
          </div>
          <!-- 每个钥匙一张卡片 -->
          <div
            v-for="key in helpProbTable"
            :key="key.id"
            class="mc-help-card"
            :class="{ 'mc-help-card--active': activeKeyInfo && activeKeyInfo.id === key.id }"
          >
            <div class="mc-help-card-header">
              <img :src="`/pt/item_icon/${key.id}.png`" class="mc-help-icon" alt="" />
              <span class="mc-help-card-name">{{ key.shortLabel }}</span>
              <span class="mc-help-card-rate">开出{{ key.petRatePercent }}%</span>
            </div>
            <div class="mc-help-grade-list">
              <div v-for="g in key.grades" :key="g.type" class="mc-help-grade-row">
                <span class="mc-help-grade-letter" :class="`grade-${g.type.toLowerCase()}`">{{ g.type }}</span>
                <span class="mc-help-grade-cond">{{ g.condText }}%</span>
                <span class="mc-help-grade-abs">{{ g.absText }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mc-help-note">
          条件概率 = 开出宠物后各品级占比<br>
          绝对概率 = 单次开启直接获得概率<br>
          系统自动使用最高等级钥匙
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * MagicCagePanel 组件
 * 业务意图：魔法牢笼抽奖面板，支持单次/批量开启，GPU加速动画
 * 面板无背景遮罩，头部可拖拽移动，四边四角可自由拉伸
 */
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { storageService } from '@/services/StorageService'
import { formatGold4 } from '@/utils/goldDisplay'
import { CAGE_KEYS, GRADE_TABLE, PET_RARITY_BY_LEVEL, PET_LEVEL_TYPE_MAP } from '@/services/MagicCageService'

const MAGIC_CAGE_ID = 1000000

const props = defineProps({
  /** 是否显示面板 */
  visible: {
    type: Boolean,
    default: false
  },
  /** 游戏初始化器（用于访问 AudioService） */
  gameInitializer: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'data-updated'])

const itemsStore = useItemsStore()
const gameStore = useGameStore()

/** 面板是否可见 */
const isVisible = ref(props.visible)

/** 是否正在开启中（单次动画播放中） */
const isOpening = ref(false)
/** 是否正在批量开启中 */
const isBatchOpening = ref(false)
/** 是否正在播放爆裂动画 */
const isBursting = ref(false)
/** 当前揭示的结果（null表示空结果，undefined表示未开始） */
const currentReveal = ref(undefined)
/** 是否显示了空结果提示 */
const showedEmpty = ref(false)
/** 是否显示概率说明面板 */
const showHelpPanel = ref(false)
/** 舞台光圈样式类 */
const stageGlowClass = ref('')
/** 品级光圈内联样式（background + transform），与 stageGlowClass 配合使用 */
const stageGlowStyle = ref({})
/** 牢笼动画样式类 */
const cageClass = ref('')
/** 粒子数量 */
const particleCount = 20
/** 唯一ID计数器 */
let uidCounter = 0

/** 所有开启结果 */
const results = ref([])

/** 批量开启进度 */
const batchProgress = ref({ current: 0, total: 0 })

/** 批量开启取消标志 */
let batchCancelled = false

/* ========== 面板位置与尺寸（拖拽 + 拉伸） ========== */

/** 面板最小宽高 */
const MIN_W = 520
const MIN_H = 400

/** 面板位置 */
const panelX = ref(0)
const panelY = ref(0)
/** 面板尺寸 */
const panelW = ref(720)
const panelH = ref(620)

/** 面板内联样式 */
const panelStyle = computed(() => ({
  left: `${panelX.value}px`,
  top: `${panelY.value}px`,
  width: `${panelW.value}px`,
  height: `${panelH.value}px`
}))

/** 初始化面板位置（居中） */
function initPanelPosition () {
  const vw = window.innerWidth
  const vh = window.innerHeight
  panelW.value = Math.min(720, vw - 40)
  panelH.value = Math.min(620, vh - 40)
  panelX.value = Math.max(0, (vw - panelW.value) / 2)
  panelY.value = Math.max(0, (vh - panelH.value) / 2)
}

/**
 * 概率说明面板内联样式
 * 用途/业务意图：贴合主面板右侧外部，从上到下对齐，
 * 随主面板位置和尺寸变化自动更新
 * @returns {Object} CSS样式对象
 */
const helpPanelStyle = computed(() => ({
  left: `${panelX.value + panelW.value + 4}px`,
  top: `${panelY.value}px`
}))

/**
 * 切换概率说明面板显示/隐藏
 */
function toggleHelpPanel () {
  showHelpPanel.value = !showHelpPanel.value
}

/* ========== 拖拽逻辑 ========== */

/** 拖拽状态 */
let dragState = null

/**
 * 开始拖拽面板
 * @param {MouseEvent} e - 鼠标按下事件
 */
function startDrag (e) {
  dragState = {
    startX: e.clientX,
    startY: e.clientY,
    origX: panelX.value,
    origY: panelY.value
  }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
}

/**
 * 拖拽移动
 * @param {MouseEvent} e - 鼠标移动事件
 */
function onDragMove (e) {
  if (!dragState) return
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  panelX.value = Math.max(0, Math.min(window.innerWidth - 60, dragState.origX + dx))
  panelY.value = Math.max(0, Math.min(window.innerHeight - 40, dragState.origY + dy))
}

/** 停止拖拽 */
function stopDrag () {
  dragState = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

/* ========== 拉伸逻辑 ========== */

/** 拉伸状态 */
let resizeState = null

/**
 * 开始拉伸面板
 * @param {string} dir - 拉伸方向（n/s/e/w/ne/nw/se/sw）
 * @param {MouseEvent} e - 鼠标按下事件
 */
function startResize (dir, e) {
  resizeState = {
    dir,
    startX: e.clientX,
    startY: e.clientY,
    origX: panelX.value,
    origY: panelY.value,
    origW: panelW.value,
    origH: panelH.value
  }
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', stopResize)
}

/**
 * 拉伸移动
 * @param {MouseEvent} e - 鼠标移动事件
 */
function onResizeMove (e) {
  if (!resizeState) return
  const { dir, startX, startY, origX, origY, origW, origH } = resizeState
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  let newX = origX
  let newY = origY
  let newW = origW
  let newH = origH

  if (dir.includes('e')) {
    newW = Math.max(MIN_W, origW + dx)
  }
  if (dir.includes('s')) {
    newH = Math.max(MIN_H, origH + dy)
  }
  if (dir.includes('w')) {
    newW = Math.max(MIN_W, origW - dx)
    newX = origX + (origW - newW)
  }
  if (dir.includes('n')) {
    newH = Math.max(MIN_H, origH - dy)
    newY = origY + (origH - newH)
  }

  panelX.value = Math.max(0, newX)
  panelY.value = Math.max(0, newY)
  panelW.value = newW
  panelH.value = newH
}

/** 停止拉伸 */
function stopResize () {
  resizeState = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', stopResize)
}

/** 魔法牢笼数量 */
const cageCount = computed(() => {
  return itemsStore.playerBag.reduce((sum, item) => {
    if (item && Number(item.id) === MAGIC_CAGE_ID) {
      return sum + (Number(item.currentStack ?? item.quantity ?? 1) || 0)
    }
    return sum
  }, 0)
})

/** 钥匙信息列表 */
const keyInfos = computed(() => {
  return CAGE_KEYS.map(keyConfig => {
    const count = itemsStore.playerBag.reduce((sum, item) => {
      if (item && Number(item.id) === keyConfig.id) {
        return sum + (Number(item.currentStack ?? item.quantity ?? 1) || 0)
      }
      return sum
    }, 0)
    return {
      id: keyConfig.id,
      label: keyConfig.label,
      shortLabel: keyConfig.label.replace('宠物笼钥匙', ''),
      boost: keyConfig.boost,
      petRate: keyConfig.petRate,
      gradeWeights: keyConfig.gradeWeights,
      count
    }
  })
})

/**
 * 当前消耗的钥匙信息（背包中 boost 最高的钥匙）
 * 用途/业务意图：系统自动使用最高等级钥匙，展示该钥匙对应的开出宠物概率
 * @returns {Object|null} 当前钥匙信息，无钥匙返回 null
 */
const activeKeyInfo = computed(() => {
  const available = keyInfos.value.filter(k => k.count > 0)
  if (!available.length) return null
  return available.reduce((best, cur) => (cur.boost > best.boost ? cur : best), available[0])
})

/**
 * 格式化百分比显示
 * @param {number} v - 0~1 的概率值
 * @returns {string} 格式化后的百分比字符串
 */
function fmtPercent (v) {
  const pct = v * 100
  if (pct >= 10) return String(Math.round(pct))
  if (pct >= 1) return pct.toFixed(1).replace(/\.0$/, '')
  return pct.toFixed(2).replace(/0$/, '').replace(/\.$/, '')
}

/**
 * 概率说明表数据
 * 用途/业务意图：为 ? 号面板构建完整的品级概率表，
 * 包含每个钥匙的条件概率（开出宠物后各品级占比）和绝对概率（单次开启直接获得概率）
 * @returns {Array<Object>} 概率表数据
 */
const helpProbTable = computed(() => {
  return CAGE_KEYS.map(keyConfig => {
    const weights = keyConfig.gradeWeights
    const total = weights.reduce((s, w) => s + w, 0)
    const grades = GRADE_TABLE.map((g, i) => {
      const condProb = total > 0 ? weights[i] / total : 0
      return {
        type: g.type,
        level: g.level,
        condProb,
        absProb: condProb * keyConfig.petRate,
        condText: fmtPercent(condProb),
        absText: fmtPercent(condProb * keyConfig.petRate)
      }
    })
    return {
      id: keyConfig.id,
      label: keyConfig.label,
      shortLabel: keyConfig.label.replace('宠物笼钥匙', ''),
      petRate: keyConfig.petRate,
      petRatePercent: Math.round(keyConfig.petRate * 100),
      grades
    }
  })
})

/**
 * 将任意颜色格式（hex / rgb / rgba）转换为 rgba 字符串
 * @param {string} color - 颜色值，如 '#C0C0C0'、'rgb(81, 209, 77)'
 * @param {number} alpha - 透明度 0~1
 * @returns {string} rgba 格式字符串
 */
function colorToRgba (color, alpha) {
  if (!color || typeof color !== 'string') {
    return `rgba(192, 192, 192, ${alpha})`
  }

  const trimmed = color.trim()

  // hex 格式 #RGB / #RRGGBB
  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
    }
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // rgb / rgba 格式
  const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`
  }

  return `rgba(192, 192, 192, ${alpha})`
}

/**
 * 品级光圈配置（每个品级的透明度和缩放比例）
 * 颜色从 itemsStore.rarityStyleFormula 动态获取，此处仅保留非颜色参数
 * @constant {Object.<string, {alpha:number, scale:number}>}
 */
const GRADE_GLOW_CONFIG = Object.freeze({
  S: { alpha: 0.25, scale: 1.8 },
  A: { alpha: 0.25, scale: 1.6 },
  B: { alpha: 0.2, scale: 1.5 },
  C: { alpha: 0.2, scale: 1.4 },
  D: { alpha: 0.2, scale: 1.3 },
  E: { alpha: 0.15, scale: 1.2 },
  F: { alpha: 0.12, scale: 1.1 }
})

/**
 * 品级颜色映射表
 * 用途/业务意图：从 itemsStore.rarityStyleFormula 获取各品级对应的 rarity 颜色，
 * 确保魔法牢笼面板的品级颜色与物品详情面板（ItemTooltip）保持一致
 * @returns {Object.<string, {color:string, glow:string}>} 品级字母到颜色信息的映射
 */
const gradeColorMap = computed(() => {
  const formula = itemsStore.rarityStyleFormula
  const result = {}
  for (const [levelStr, gradeType] of Object.entries(PET_LEVEL_TYPE_MAP)) {
    const level = Number(levelStr)
    const rarity = PET_RARITY_BY_LEVEL[level] || 'common'
    const entry = formula[rarity] || formula.common
    const color = entry?.textColor || '#C0C0C0'
    result[gradeType] = {
      color,
      glow: colorToRgba(color, 0.4)
    }
  }
  return result
})

/**
 * 获取品级内联样式（CSS 变量）
 * @param {string} gradeType - 品级字母（F-S）
 * @returns {Object} 包含 --grade-color 和 --grade-glow 的样式对象
 */
function getGradeStyle (gradeType) {
  const info = gradeColorMap.value[gradeType]
  if (!info) return {}
  return {
    '--grade-color': info.color,
    '--grade-glow': info.glow
  }
}

/**
 * 获取品级光圈内联样式
 * @param {string} gradeType - 品级字母（F-S）
 * @returns {Object} 包含 background 和 transform 的样式对象
 */
function getStageGlowGradeStyle (gradeType) {
  const info = gradeColorMap.value[gradeType]
  const config = GRADE_GLOW_CONFIG[gradeType] || GRADE_GLOW_CONFIG.F
  if (!info) return {}
  return {
    background: `radial-gradient(circle, ${colorToRgba(info.color, config.alpha)} 0%, transparent 70%)`,
    transform: `scale(${config.scale})`
  }
}

/** 钥匙总数 */
const keyCount = computed(() => {
  return keyInfos.value.reduce((sum, info) => sum + info.count, 0)
})

/** 最大可批量开启数量 */
const maxBatchCount = computed(() => Math.min(cageCount.value, keyCount.value))

/** 结果总价值 */
const totalValue = computed(() => {
  return results.value.reduce((sum, r) => sum + (r.sellPrice || 0), 0)
})

/** 进度百分比 */
const progressPercent = computed(() => {
  const { current, total } = batchProgress.value
  if (!total || total <= 0) return 0
  return Math.min(100, Math.floor((current / total) * 100))
})

/**
 * 格式化价格（每4位加逗号）
 * @param {number} value - 价格值
 * @returns {string} 格式化后的价格
 */
function formatPrice (value) {
  return formatGold4(value || 0)
}

/**
 * 生成粒子样式
 * @param {number} index - 粒子索引
 * @returns {Object} CSS样式对象
 */
function getParticleStyle (index) {
  const angle = (index / particleCount) * Math.PI * 2
  const distance = 120 + Math.random() * 80
  const tx = Math.cos(angle) * distance
  const ty = Math.sin(angle) * distance
  const scale = 0.6 + Math.random() * 0.8
  const delay = Math.random() * 100
  return {
    '--tx': `${tx}px`,
    '--ty': `${ty}px`,
    '--scale': scale,
    animationDelay: `${delay}ms`
  }
}

/**
 * 播放开启音效
 * 业务意图：每次开启魔法牢笼时播放 InfOpen.wav 音效
 */
function playOpenSFX () {
  try {
    const gi = props.gameInitializer
    const audioService = gi?.value?.services?.audio || gi?.services?.audio
    if (audioService && typeof audioService.playSFX === 'function') {
      audioService.playSFX('InfOpen.wav')
    }
  } catch (error) {
    console.error('[MagicCagePanel] 播放开启音效失败:', error)
  }
}

/**
 * 播放结果音效
 * 业务意图：开出宠物时播放 ColosseoumTakePresent.wav，空结果时播放 Chaos.wav
 * @param {boolean} gotPet - 是否开出了宠物
 */
function playResultSFX (gotPet) {
  try {
    const gi = props.gameInitializer
    const audioService = gi?.value?.services?.audio || gi?.services?.audio
    if (!audioService || typeof audioService.playSFX !== 'function') return
    audioService.playSFX(gotPet ? 'ColosseoumTakePresent.wav' : 'Chaos.wav')
  } catch (error) {
    console.error('[MagicCagePanel] 播放结果音效失败:', error)
  }
}

/* ========== 物品详情面板（ItemTooltip 事件集成） ========== */

/**
 * 根据物品 ID 获取物品静态配置
 * 用途/业务意图：鼠标悬停时从 itemsStore 获取物品配置，传给 ItemTooltip 展示
 * @param {number} itemId - 物品 ID
 * @returns {Object|null} 物品配置对象
 */
function getItemConfigById (itemId) {
  try {
    return itemsStore.getItemConfig(Number(itemId)) || null
  } catch (error) {
    console.error('[MagicCagePanel] 获取物品配置失败:', error)
    return null
  }
}

/**
 * 根据开启结果构建宠物 tooltip 物品对象
 * 用途/业务意图：将 MagicCagePanel 的开启结果转换为 ItemTooltip 能识别的宠物物品结构
 * @param {Object} result - 开启结果（currentReveal 或 results 列表项）
 * @returns {Object|null} 宠物物品对象，包含 id、name、rarity、pet_level、pet_data、sellPrice
 */
function buildPetTooltipItem (result) {
  if (!result) return null
  try {
    // 优先从 executeOpen 缓存的原始 petItem 中获取完整数据
    if (result.petItem) {
      return result.petItem
    }
    // 回退：从 result 字段构建最小可用对象
    return {
      id: result.petId,
      name: result.petName,
      rarity: result.rarity || 'common',
      pet_level: result.gradeLevel,
      pet_data: result.petData || {},
      sellPrice: result.sellPrice || 0
    }
  } catch (error) {
    console.error('[MagicCagePanel] 构建宠物 tooltip 物品失败:', error)
    return null
  }
}

/**
 * 显示物品详情面板
 * 业务意图：通过全局自定义事件触发 ItemTooltip 组件显示
 * @param {Object|null} item - 物品数据
 * @param {MouseEvent} event - 鼠标事件
 */
function showItemTooltip (item, event) {
  if (!item) return
  window.dispatchEvent(
    new CustomEvent('show-item-tooltip', {
      detail: {
        item,
        position: {
          x: event.clientX + 10,
          y: event.clientY + 10
        },
        source: 'magic-cage-panel'
      }
    })
  )
}

/**
 * 移动物品详情面板
 * @param {MouseEvent} event - 鼠标移动事件
 */
function moveItemTooltip (event) {
  window.dispatchEvent(
    new CustomEvent('move-item-tooltip', {
      detail: {
        position: {
          x: event.clientX + 10,
          y: event.clientY + 10
        }
      }
    })
  )
}

/**
 * 隐藏物品详情面板
 */
function hideItemTooltip () {
  window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
}

/**
 * 执行单次开启
 * 业务意图：调用 itemsStore 消耗道具并获取结果
 * 注意：useMagicCageItem 返回的数据在 result.effect 中，不能直接读 result.petItem
 * 前置检查：无钥匙或无牢笼时直接返回，不播放音效、不调用 store
 * @returns {Object|null} 开启结果，null表示无法开启
 */
function executeOpen () {
  // 前置检查：必须同时拥有魔法牢笼和宠物笼钥匙才能开启
  if (cageCount.value === 0 || keyCount.value === 0) {
    return null
  }

  playOpenSFX()
  const result = itemsStore.useMagicCageItem({ id: MAGIC_CAGE_ID }, {}, {}, 1)
  if (!result || !result.success) {
    return null
  }

  // 从 effect 中读取宠物和品级信息（useMagicCageItem 将数据包装在 effect 字段中）
  const effect = result.effect || {}
  const grade = effect.grade
  const petItem = effect.petItem

  // 未开出宠物（grade 为 null 或 petItem 为 null），返回空结果
  if (!petItem || !grade) {
    return { empty: true, keyUsed: effect.keyUsed }
  }

  return {
    uid: `mc_${Date.now()}_${uidCounter++}`,
    petId: Number(petItem.id),
    petName: petItem.name || `宠物#${petItem.id}`,
    gradeType: grade.type,
    gradeLevel: grade.level,
    sellPrice: petItem.sellPrice || 0,
    keyUsed: effect.keyUsed,
    // 保留原始 petItem 供物品详情面板使用（包含 pet_data、rarity 等完整数据）
    petItem
  }
}

/**
 * 播放开启动画序列
 * @param {Object|null} openResult - 开启结果
 * @returns {Promise<void>} 动画完成Promise
 */
function playOpenAnimation (openResult) {
  return new Promise(resolve => {
    // 重置状态
    currentReveal.value = undefined
    showedEmpty.value = false
    isBursting.value = false
    cageClass.value = ''
    stageGlowClass.value = ''
    stageGlowStyle.value = {}

    // Phase 1: 牢笼震动 (400ms)
    cageClass.value = 'mc-cage--shaking'
    stageGlowClass.value = 'mc-stage-glow--charging'

    setTimeout(() => {
      // Phase 2: 爆裂 (300ms)
      cageClass.value = 'mc-cage--burst'
      isBursting.value = true
      stageGlowClass.value = 'mc-stage-glow--burst'
      stageGlowStyle.value = {}

      setTimeout(() => {
        // Phase 3: 揭示结果 (500ms)
        isBursting.value = false
        cageClass.value = ''

        if (openResult && openResult.empty) {
          currentReveal.value = null
          showedEmpty.value = true
          stageGlowClass.value = ''
          stageGlowStyle.value = {}
          playResultSFX(false)
        } else if (openResult) {
          currentReveal.value = openResult
          stageGlowClass.value = ''
          stageGlowStyle.value = getStageGlowGradeStyle(openResult.gradeType)
          // 将结果添加到列表
          results.value.unshift(openResult)
          playResultSFX(true)
        } else {
          stageGlowClass.value = ''
          stageGlowStyle.value = {}
        }

        // Phase 4: 等待展示完成后resolve
        setTimeout(() => {
          resolve()
        }, 600)
      }, 300)
    }, 400)
  })
}

/**
 * 开启一次
 */
async function openOne () {
  if (isOpening.value || cageCount.value === 0 || keyCount.value === 0) {
    return
  }

  isOpening.value = true
  currentReveal.value = undefined
  showedEmpty.value = false

  const openResult = executeOpen()
  await playOpenAnimation(openResult)

  // 保存数据
  saveData()

  isOpening.value = false
}

/**
 * 切换自动开启状态
 * 业务意图：点击按钮开始批量开启，再次点击停止
 */
function toggleAutoOpen () {
  if (isBatchOpening.value) {
    // 停止自动开启
    batchCancelled = true
    return
  }
  openAll()
}

/**
 * 一键开启（批量）
 */
async function openAll () {
  if (isOpening.value || cageCount.value === 0 || keyCount.value === 0) {
    return
  }

  isBatchOpening.value = true
  isOpening.value = true
  batchCancelled = false

  const total = maxBatchCount.value
  batchProgress.value = { current: 0, total }

  for (let i = 0; i < total; i++) {
    if (batchCancelled) break
    if (cageCount.value === 0 || keyCount.value === 0) break

    batchProgress.value = { current: i + 1, total }

    currentReveal.value = undefined
    showedEmpty.value = false

    const openResult = executeOpen()
    await playOpenAnimation(openResult)

    // 批量模式下缩短间隔
    if (i < total - 1 && !batchCancelled) {
      await nextTick()
      await new Promise(r => requestAnimationFrame(() => r()))
    }
  }

  // 保存数据
  saveData()

  isBatchOpening.value = false
  isOpening.value = false
  batchProgress.value = { current: 0, total: 0 }
  currentReveal.value = undefined
  showedEmpty.value = false
  stageGlowClass.value = ''
  stageGlowStyle.value = {}
}

/**
 * 保存玩家数据到 localStorage 并同步 gameStore
 */
function saveData () {
  try {
    const bag = [...itemsStore.playerBag]
    gameStore.player.bag = bag
    storageService.savePlayerPatch({ bag })
    emit('data-updated', { source: 'magicCage' })
  } catch (error) {
    console.error('[MagicCagePanel] 保存数据失败:', error)
  }
}

/**
 * 清空结果列表
 */
function clearResults () {
  results.value = []
}

/**
 * 关闭面板
 */
function handleClose () {
  if (isOpening.value) {
    batchCancelled = true
    return
  }
  hideItemTooltip()
  isVisible.value = false
  emit('close')
}

/** 监听 visible prop 变化 */
watch(() => props.visible, (val) => {
isVisible.value = val
if (val) {
results.value = []
currentReveal.value = undefined
showedEmpty.value = false
showHelpPanel.value = false
  stageGlowClass.value = ''
  stageGlowStyle.value = {}
  cageClass.value = ''
initPanelPosition()
  }
})

/** 组件卸载前取消批量操作并移除事件监听 */
onBeforeUnmount(() => {
  batchCancelled = true
  stopDrag()
  stopResize()
  hideItemTooltip()
})
</script>

<style scoped>
/* ========== 主面板 ========== */
.mc-panel {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: linear-gradient(165deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 100%);
  border: 1px solid rgba(100, 120, 255, 0.2);
  border-radius: 16px;
  box-shadow:
    0 0 60px rgba(60, 80, 200, 0.15),
    0 20px 60px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

/* ========== 头部 ========== */
.mc-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(100, 120, 255, 0.1);
  overflow: hidden;
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.mc-header:active {
  cursor: grabbing;
}

.mc-header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(100, 120, 255, 0.08) 30%,
    rgba(160, 100, 255, 0.12) 50%,
    rgba(100, 120, 255, 0.08) 70%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: mc-header-shimmer 4s linear infinite;
  will-change: background-position;
  pointer-events: none;
}

@keyframes mc-header-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.mc-title {
  position: relative;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #6c8cff 0%, #a06cff 50%, #ff6cc4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(120, 100, 255, 0.3);
  pointer-events: none;
}

.mc-close-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, transform 0.2s;
  will-change: transform;
  z-index: 1;
}

.mc-close-btn:hover {
  background: rgba(255, 80, 80, 0.2);
  color: #ff6b6b;
  transform: translateY(-50%) scale(1.1);
}

/* ========== ? 概率说明按钮 ========== */
.mc-help-btn {
  position: absolute;
  right: 56px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(108, 140, 255, 0.15);
  color: #6c8cff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s, transform 0.2s;
  will-change: transform;
  z-index: 1;
}

.mc-help-btn:hover {
  background: rgba(108, 140, 255, 0.3);
  color: #fff;
  transform: translateY(-50%) scale(1.1);
}

/* ========== 概率说明面板 ========== */
.mc-help-panel {
  position: fixed;
  z-index: 9998;
  width: 250px;
  background: linear-gradient(165deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 100%);
  border: 1px solid rgba(100, 120, 255, 0.2);
  border-radius: 12px;
  box-shadow:
    0 0 40px rgba(60, 80, 200, 0.12),
    0 12px 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mc-help-title {
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 700;
  color: #6c8cff;
  border-bottom: 1px solid rgba(100, 120, 255, 0.1);
  text-align: center;
}

.mc-help-body {
  padding: 8px 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 表头 */
.mc-help-legend {
  display: grid;
  grid-template-columns: 28px 1fr 1fr;
  gap: 4px;
  padding: 0 10px 4px;
  font-size: 10px;
  color: #678;
  text-align: center;
}

.mc-help-legend-grade {
  text-align: center;
}

/* 钥匙卡片 */
.mc-help-card {
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.mc-help-card--active {
  border-color: rgba(100, 200, 100, 0.25);
  box-shadow: 0 0 10px rgba(100, 200, 100, 0.08);
}

.mc-help-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mc-help-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}

.mc-help-card-name {
  font-size: 12px;
  font-weight: 600;
  color: #ccd;
  white-space: nowrap;
}

.mc-help-card-rate {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #4ade80;
}

/* 品级行 */
.mc-help-grade-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mc-help-grade-row {
  display: grid;
  grid-template-columns: 28px 1fr 1fr;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  font-size: 11px;
  text-align: center;
}

.mc-help-grade-letter {
  font-weight: 700;
  font-size: 12px;
  text-align: center;
}

.grade-s { color: #ff6b6b; }
.grade-a { color: #ffa940; }
.grade-b { color: #ffd93d; }
.grade-c { color: #6bcf7f; }
.grade-d { color: #4dabf7; }
.grade-e { color: #b197fc; }
.grade-f { color: #868e96; }

.mc-help-grade-cond {
  color: #aab;
}

.mc-help-grade-abs {
  color: #8c9eff;
}

.mc-help-note {
  padding: 8px 12px 12px;
  font-size: 10px;
  color: #667;
  text-align: center;
  line-height: 1.6;
}

/* 概率面板滑入动画 */
.mc-help-slide-enter-active {
  transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease;
  will-change: transform, opacity;
}

.mc-help-slide-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
  will-change: transform, opacity;
}

.mc-help-slide-enter-from {
  transform: translateX(-12px);
  opacity: 0;
}

.mc-help-slide-leave-to {
  transform: translateX(-12px);
  opacity: 0;
}

/* ========== 信息栏 ========== */
.mc-info-bar {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(100, 120, 255, 0.08);
  flex-wrap: wrap;
  flex-shrink: 0;
}

.mc-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.mc-info-item--active {
  border-color: rgba(100, 200, 100, 0.25);
  box-shadow: 0 0 12px rgba(100, 200, 100, 0.08);
}

.mc-info-cage {
  border-color: rgba(160, 100, 255, 0.2);
  box-shadow: 0 0 12px rgba(160, 100, 255, 0.1);
}

.mc-info-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.mc-info-label {
  font-size: 12px;
  color: #aab;
}

.mc-info-count {
  font-size: 14px;
  font-weight: 700;
  color: #6c8cff;
}

.mc-info-count--low {
  color: #ff6b6b;
}

/* ========== 舞台 ========== */
.mc-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 背景光圈 */
.mc-stage-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(100, 120, 255, 0.06) 0%, transparent 70%);
  transform: scale(0.8);
  transition: background 0.3s, transform 0.4s;
  will-change: transform, background;
  pointer-events: none;
}

.mc-stage-glow--charging {
  background: radial-gradient(circle, rgba(255, 200, 80, 0.15) 0%, transparent 70%);
  transform: scale(1.2);
  animation: mc-pulse 0.4s ease-in-out infinite alternate;
}

.mc-stage-glow--burst {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transform: scale(2.5);
  transition: transform 0.2s ease-out, background 0.2s;
}

@keyframes mc-pulse {
  0% { transform: scale(1.1); opacity: 0.6; }
  100% { transform: scale(1.3); opacity: 1; }
}

/* ========== 牢笼 ========== */
.mc-cage {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}

.mc-cage-icon {
  width: 200px;
  height: 166px;
  object-fit: contain;
  filter: drop-shadow(0 0 15px rgba(160, 100, 255, 0.4));
  user-select: none;
  -webkit-user-drag: none;
}

.mc-cage-shine {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 5%,
    transparent 10%,
    transparent 50%,
    rgba(255, 255, 255, 0.1) 55%,
    transparent 60%
  );
  animation: mc-cage-rotate 6s linear infinite;
  will-change: transform;
  pointer-events: none;
}

@keyframes mc-cage-rotate {
  to { transform: rotate(360deg); }
}

/* 震动动画 */
.mc-cage--shaking {
  animation: mc-shake 0.1s ease-in-out infinite;
}

@keyframes mc-shake {
  0%, 100% { transform: translate3d(-3px, 0, 0) rotate(-2deg); }
  25% { transform: translate3d(3px, -2px, 0) rotate(2deg); }
  50% { transform: translate3d(-2px, 2px, 0) rotate(-1deg); }
  75% { transform: translate3d(2px, 1px, 0) rotate(1deg); }
}

/* 爆裂动画 */
.mc-cage--burst {
  animation: mc-burst 0.3s ease-out forwards;
}

@keyframes mc-burst {
  0% { transform: scale3d(1, 1, 1); opacity: 1; }
  40% { transform: scale3d(1.3, 1.3, 1); opacity: 0.8; }
  100% { transform: scale3d(0.1, 0.1, 1); opacity: 0; }
}

/* ========== 揭示卡片 ========== */
.mc-reveal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform, opacity;
}

/* 光线发散 */
.mc-reveal-rays {
  position: absolute;
  width: 400px;
  height: 400px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(255, 255, 255, 0.08) 5deg,
    transparent 10deg,
    transparent 30deg,
    rgba(255, 255, 255, 0.08) 35deg,
    transparent 40deg,
    transparent 60deg,
    rgba(255, 255, 255, 0.08) 65deg,
    transparent 70deg,
    transparent 90deg,
    rgba(255, 255, 255, 0.08) 95deg,
    transparent 100deg,
    transparent 120deg,
    rgba(255, 255, 255, 0.08) 125deg,
    transparent 130deg,
    transparent 150deg,
    rgba(255, 255, 255, 0.08) 155deg,
    transparent 160deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.08) 185deg,
    transparent 190deg,
    transparent 210deg,
    rgba(255, 255, 255, 0.08) 215deg,
    transparent 220deg,
    transparent 240deg,
    rgba(255, 255, 255, 0.08) 245deg,
    transparent 250deg,
    transparent 270deg,
    rgba(255, 255, 255, 0.08) 275deg,
    transparent 280deg,
    transparent 300deg,
    rgba(255, 255, 255, 0.08) 305deg,
    transparent 310deg,
    transparent 330deg,
    rgba(255, 255, 255, 0.08) 335deg,
    transparent 340deg
  );
  border-radius: 50%;
  animation: mc-rays-rotate 8s linear infinite;
  pointer-events: none;
  will-change: transform;
}

@keyframes mc-rays-rotate {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.mc-reveal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(20, 20, 35, 0.95) 0%, rgba(30, 30, 50, 0.95) 100%);
  z-index: 1;
}

.mc-reveal-card-border {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(135deg, var(--grade-color, #6c8cff), transparent 50%, var(--grade-color, #6c8cff));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.mc-reveal-icon {
  width: 200px;
  height: 166px;
  object-fit: contain;
  filter: drop-shadow(0 0 12px var(--grade-glow, rgba(108, 140, 255, 0.4)));
  user-select: none;
  -webkit-user-drag: none;
}

.mc-reveal-name {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8f0;
  text-shadow: 0 0 8px var(--grade-glow, rgba(108, 140, 255, 0.3));
}

.mc-reveal-grade-badge {
  margin-top: 4px;
  padding: 2px 12px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 4px;
  color: #fff;
  background: var(--grade-color, #6c8cff);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.mc-reveal-price {
  margin-top: 6px;
  font-size: 14px;
  color: #ffd700;
}

/* 揭示动画 */
.mc-reveal-enter-active {
  animation: mc-reveal-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mc-reveal-leave-active {
  animation: mc-reveal-out 0.2s ease-in forwards;
}

@keyframes mc-reveal-in {
  0% {
    transform: scale3d(0, 0, 1) rotateY(180deg);
    opacity: 0;
  }
  50% {
    transform: scale3d(1.15, 1.15, 1) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: scale3d(1, 1, 1) rotateY(0deg);
    opacity: 1;
  }
}

@keyframes mc-reveal-out {
  to {
    transform: scale3d(0.8, 0.8, 1);
    opacity: 0;
  }
}

/* ========== 空结果 ========== */
.mc-empty-result {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-empty-text {
  font-size: 18px;
  color: #888;
  font-style: italic;
}

/* ========== 粒子 ========== */
.mc-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
}

.mc-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0%, rgba(160, 100, 255, 0.8) 50%, transparent 100%);
  transform: translate3d(0, 0, 0) scale3d(var(--scale), var(--scale), 1);
  animation: mc-particle-fly 0.6s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes mc-particle-fly {
  0% {
    transform: translate3d(0, 0, 0) scale3d(var(--scale), var(--scale), 1);
    opacity: 1;
  }
  100% {
    transform: translate3d(var(--tx), var(--ty), 0) scale3d(0, 0, 1);
    opacity: 0;
  }
}

/* ========== 进度条 ========== */
.mc-progress {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  will-change: opacity;
}

.mc-progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.mc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6c8cff, #a06cff);
  border-radius: 3px;
  transition: width 0.3s ease;
  will-change: width;
}

.mc-progress-text {
  font-size: 12px;
  color: #aab;
  white-space: nowrap;
}

/* ========== 结果列表 ========== */
.mc-results {
  flex: 0 0 auto;
  max-height: 160px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 20px 12px;
  overflow: hidden;
}

.mc-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.mc-results-title {
  font-size: 13px;
  color: #889;
}

.mc-results-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mc-summary-item {
  font-size: 12px;
  color: #ffd700;
}

.mc-clear-btn {
  padding: 2px 10px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  color: #aab;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.mc-clear-btn:hover {
  background: rgba(255, 80, 80, 0.15);
  color: #ff6b6b;
}

.mc-results-grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-y: auto;
  padding: 4px 0;
}

.mc-results-grid::-webkit-scrollbar {
  width: 4px;
}

.mc-results-grid::-webkit-scrollbar-track {
  background: transparent;
}

.mc-results-grid::-webkit-scrollbar-thumb {
  background: rgba(100, 120, 255, 0.2);
  border-radius: 2px;
}

.mc-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--grade-color, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  box-shadow: 0 0 8px var(--grade-glow, transparent);
  animation: mc-result-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards;
  will-change: transform, opacity;
}

@keyframes mc-result-pop {
  0% {
    transform: scale3d(0.5, 0.5, 1) translateY(10px);
    opacity: 0;
  }
  100% {
    transform: scale3d(1, 1, 1) translateY(0);
    opacity: 1;
  }
}

.mc-result-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

.mc-result-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mc-result-name {
  font-size: 12px;
  color: #ccd;
  white-space: nowrap;
}

.mc-result-grade {
  font-size: 11px;
  font-weight: 700;
  color: var(--grade-color, #889);
}

/* ========== 操作按钮 ========== */
.mc-actions {
  display: flex;
  gap: 12px;
  padding: 14px 20px 18px;
  border-top: 1px solid rgba(100, 120, 255, 0.08);
  flex-shrink: 0;
}

.mc-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  will-change: transform;
  user-select: none;
}

.mc-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mc-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.mc-btn:not(:disabled):active {
  transform: translateY(0);
}

.mc-btn-icon {
  font-size: 18px;
}

.mc-btn-open {
  background: linear-gradient(135deg, #4a6cf7 0%, #6c8cff 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(76, 108, 247, 0.3);
}

.mc-btn-open:not(:disabled):hover {
  box-shadow: 0 6px 24px rgba(76, 108, 247, 0.45);
}

.mc-btn-all {
  background: linear-gradient(135deg, #8b5cf6 0%, #a06cff 50%, #ff6cc4 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.mc-btn-all:not(:disabled):hover {
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.45);
}

/* 停止按钮样式 */
.mc-btn-stop {
  background: linear-gradient(135deg, #e74c3c 0%, #ff6b6b 100%) !important;
  box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4) !important;
  animation: mc-btn-stop-pulse 1.2s ease-in-out infinite;
}

.mc-btn-stop:not(:disabled):hover {
  box-shadow: 0 6px 24px rgba(231, 76, 60, 0.55) !important;
}

@keyframes mc-btn-stop-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(231, 76, 60, 0.4); }
  50% { box-shadow: 0 4px 28px rgba(231, 76, 60, 0.65); }
}

/* ========== 警告提示 ========== */
.mc-warning {
  padding: 8px 20px 14px;
  text-align: center;
  font-size: 13px;
  color: #ffa940;
  flex-shrink: 0;
}

/* ========== 当前钥匙概率信息 ========== */
.mc-prob-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 20px 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.mc-prob-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.mc-prob-label {
  font-size: 12px;
  color: #889;
}

.mc-prob-key-name {
  font-size: 12px;
  font-weight: 700;
  color: #aab;
}

.mc-prob-divider {
  color: rgba(255, 255, 255, 0.15);
  font-size: 12px;
}

.mc-prob-rate {
  font-size: 12px;
  font-weight: 700;
}

.mc-prob-rate--success {
  color: #4ade80;
}

.mc-prob-rate--fail {
  color: #ff6b6b;
}

/* ========== 过渡动画 ========== */
.mc-fade-enter-active,
.mc-fade-leave-active {
  transition: opacity 0.3s ease;
  will-change: opacity;
}

.mc-fade-enter-from,
.mc-fade-leave-to {
  opacity: 0;
}

/* ========== 拉伸手柄 ========== */
.mc-resize {
  position: absolute;
  z-index: 10;
}

/* 上边 */
.mc-resize-n {
  top: -3px;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: n-resize;
}

/* 下边 */
.mc-resize-s {
  bottom: -3px;
  left: 12px;
  right: 12px;
  height: 6px;
  cursor: s-resize;
}

/* 右边 */
.mc-resize-e {
  right: -3px;
  top: 12px;
  bottom: 12px;
  width: 6px;
  cursor: e-resize;
}

/* 左边 */
.mc-resize-w {
  left: -3px;
  top: 12px;
  bottom: 12px;
  width: 6px;
  cursor: w-resize;
}

/* 四角 */
.mc-resize-ne {
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: ne-resize;
  z-index: 11;
}

.mc-resize-nw {
  top: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
  z-index: 11;
}

.mc-resize-se {
  bottom: 0px;
  right: 0px;
  width: 28px;
  height: 28px;
  cursor: se-resize;
  z-index: 11;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 右下角拉伸动画指示器（三条斜线呼吸效果） */
.mc-resize-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.mc-resize-line {
  height: 2px;
  border-radius: 1px;
  background: #ffd700;
  transform: rotate(-45deg);
  transform-origin: right center;
}

.mc-resize-line:nth-child(1) {
  width: 20px;
  animation: mc-resize-bounce-1 0.6s ease-in-out infinite;
}

.mc-resize-line:nth-child(2) {
  width: 14px;
  animation: mc-resize-bounce-2 0.6s ease-in-out infinite 0.1s;
}

.mc-resize-line:nth-child(3) {
  width: 8px;
  animation: mc-resize-bounce-3 0.6s ease-in-out infinite 0.2s;
}

@keyframes mc-resize-bounce-1 {
  0%, 100% { width: 20px; }
  50% { width: 24px; }
}

@keyframes mc-resize-bounce-2 {
  0%, 100% { width: 14px; }
  50% { width: 18px; }
}

@keyframes mc-resize-bounce-3 {
  0%, 100% { width: 8px; }
  50% { width: 12px; }
}

.mc-resize-sw {
  bottom: -4px;
  left: -4px;
  width: 12px;
  height: 12px;
  cursor: sw-resize;
  z-index: 11;
}
</style>
