<!--
  @file ApiUpdater.vue
  @description FlyFF API 数据更新器页面 — RPG游戏风格单屏布局
  @description 融合原 get_Flyff_API.html 全部功能，提供可视化操作界面
  @description 支持：怪物/物品/地图/NPC/技能/任务/装备套装的数据拉取与图标下载
  @design 暗色RPG毛玻璃主题，居中面板布局，所有内容一屏展示
  @feature 主题切换：黑色/白色/经典 + RGB自由调色面板
-->
<template>
  <div
    class="au"
    :style="{ ...getThemeVars() }"
  >
    <!-- 背景装饰 -->
    <div class="au__bg" />

    <!-- 主面板 -->
    <div
      class="au__shell"
    >
      <!-- ═══ 顶部标题栏 ═══ -->
      <div class="au__head">
        <span class="au__head-icon">⚔</span>
        <span class="au__head-title">DATA UPDATER</span>
        <div class="au__head-badges">
          <span class="au__badge" :class="{ 'au__badge--on': apiServerOnline === true, 'au__badge--off': apiServerOnline === false, 'au__badge--wait': apiServerOnline === null }">
            <i class="au__badge-dot" />SVR
          </span>
          <span class="au__badge" :class="{ 'au__badge--on': isNetworkOnline === true, 'au__badge--off': isNetworkOnline === false, 'au__badge--wait': isNetworkOnline === null }">
            <i class="au__badge-dot" />NET
          </span>
          <!-- 主题切换 -->
          <span class="au__theme">
            <button
              v-for="t in themePresets"
              :key="t.id"
              class="au__theme-dot"
              :class="{ 'au__theme-dot--active': themeId === t.id }"
              :title="t.label"
              :style="{ background: t.dotColor }"
              @click="applyTheme(t.id)"
            />
            <button
              class="au__theme-pick"
              :class="{ 'au__theme-pick--active': showColorPanel }"
              title="自定义调色"
              @click="toggleColorPanel"
            >🎨</button>
          </span>
        </div>
      </div>

      <!-- ═══ 颜色调节面板（浮动） ═══ -->
      <div v-if="showColorPanel" class="au__cp">
        <div class="au__cp-head">
          <span>🎨 自定义调色</span>
          <button class="au__cp-close" @click="showColorPanel = false">✕</button>
        </div>
        <!-- 色相环 -->
        <div class="au__cp-ring">
          <canvas
            ref="hueCanvas"
            class="au__cp-ring-c"
            width="180"
            height="180"
            @mousedown="onHueDown"
          />
          <div class="au__cp-ring-center" :style="{ background: `rgb(${customColor.r}, ${customColor.g}, ${customColor.b})` }" />
        </div>
        <!-- RGB 输入 -->
        <div class="au__cp-rgb">
          <label class="au__cp-ch">
            <span class="au__cp-ch-l" style="color:#e55">R</span>
            <input type="number" min="0" max="255" :value="customColor.r" @input="onRgbInput('r', $event)" />
          </label>
          <label class="au__cp-ch">
            <span class="au__cp-ch-l" style="color:#5b5">G</span>
            <input type="number" min="0" max="255" :value="customColor.g" @input="onRgbInput('g', $event)" />
          </label>
          <label class="au__cp-ch">
            <span class="au__cp-ch-l" style="color:#58f">B</span>
            <input type="number" min="0" max="255" :value="customColor.b" @input="onRgbInput('b', $event)" />
          </label>
          <label class="au__cp-ch au__cp-ch--a">
            <span class="au__cp-ch-l" style="color:#aaa">A</span>
            <input type="number" min="0" max="100" :value="customColor.a" @input="onAlphaInput($event)" />
          </label>
        </div>
        <!-- 透明度滑块 -->
        <div class="au__cp-alpha">
          <div class="au__cp-alpha-bar" :style="{ background: alphaBarBg }" @click="onAlphaBarClick" @mousedown="onAlphaBarDown">
            <div class="au__cp-alpha-thumb" :style="{ left: `${customColor.a}%` }" />
          </div>
        </div>
        <!-- 预览 + 操作 -->
        <div class="au__cp-foot">
          <div class="au__cp-preview" :style="{ background: previewColor }" />
          <span class="au__cp-hex">{{ hexDisplay }}</span>
          <button class="au__cp-reset" @click="resetCustomColor">重置</button>
        </div>
      </div>

      <!-- ═══ 内容区：左右分栏 ═══ -->
      <div class="au__body">
        <!-- ─── 左列 ─── -->
        <div class="au__col au__col--left">
          <!-- 版本信息 -->
          <div class="au__ver">
            <div class="au__ver-cell">
              <span class="au__ver-label">LOCAL</span>
              <span class="au__ver-val">{{ localVersion || '—' }}</span>
            </div>
            <div class="au__ver-sep" />
            <div class="au__ver-cell">
              <span class="au__ver-label">REMOTE</span>
              <span class="au__ver-val">{{ remoteVersion || '—' }}</span>
            </div>
            <div class="au__ver-sep" />
            <div class="au__ver-cell">
              <span class="au__ver-label">STATUS</span>
              <span class="au__ver-tag" :class="{ 'au__ver-tag--old': needsUpdate, 'au__ver-tag--ok': !needsUpdate && remoteVersion }">
                {{ !remoteVersion ? '—' : needsUpdate ? 'NEED UPDATE' : 'LATEST' }}
              </span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="au__btns">
            <button
              class="au__btn au__btn--hero"
              :disabled="isRunning || isChecking || isServerOffline || batchUpdateLocked"
              @click="handleBatchUpdate"
            >
              <span class="au__btn-glow" />
              <span class="au__btn-text">{{ canResume && !isRunning ? '▶ 继续更新' : isRunning ? '⏳ 更新中...' : '⚔ 一键更新全部数据' }}</span>
            </button>
            <button
              v-if="isRunning"
              class="au__btn au__btn--abort"
              @click="stopCurrentTask"
            >
              ⏹ 中止
            </button>
          </div>

          <!-- 全局进度 -->
          <div v-if="isRunning || globalProgress > 0" class="au__bar au__bar--global">
            <div class="au__bar-top">
              <span>总进度</span>
              <span class="au__bar-step">{{ currentStepIndex > 0 ? `${currentStepIndex}/${backendTotalSteps || 11} ${currentStepName}` : '' }}</span>
              <span class="au__bar-pct">{{ globalProgress }}%</span>
            </div>
            <div class="au__bar-track"><div class="au__bar-fill au__bar-fill--g" :style="{ width: `${globalProgress}%` }" /></div>
          </div>

          <!-- 当前步骤进度 -->
          <div v-if="isRunning || progress > 0" class="au__bar">
            <div class="au__bar-top">
              <span>{{ currentTask }}</span>
              <span class="au__bar-pct">{{ progress }}%<template v-if="estimatedTime"> ⏱ {{ estimatedTime }}</template></span>
            </div>
            <div class="au__bar-track"><div class="au__bar-fill" :style="{ width: `${progress}%` }" /></div>
          </div>

          <!-- 日志 -->
          <div
            class="au__log"
            :class="{ 'au__log--ok': outputType === 'success', 'au__log--err': outputType === 'error', 'au__log--warn': outputType === 'warning' }"
          >
            <pre class="au__log-pre">{{ outputText }}</pre>
          </div>
        </div>

        <!-- ─── 右列 ─── -->
        <div class="au__col au__col--right">
          <!-- 更新统计 -->
          <div class="au__card">
            <div class="au__card-head">📊 UPDATE STATS</div>
            <div class="au__card-body">
              <template v-if="updateStats">
                <div v-for="r in updateStats.results" :key="r.category" class="au__row">
                  <span class="au__row-cat" :class="`au__row-cat--${r.category}`">{{ { item: '物品', monster: '怪物', skill: '技能', equipset: '套装', achievement: '成就' }[r.category] || r.category }}</span>
                  <span class="au__row-val">
                    <template v-if="r.totalRemote > 0">远{{ r.totalRemote }} 本{{ r.totalLocal }} +{{ r.newCount }}</template>
                    <template v-else>+{{ r.newCount }}</template>
                    <template v-if="r.failedCount > 0"> <em class="au__fail">✗{{ r.failedCount }}</em></template>
                  </span>
                </div>
                <template v-if="updateStats.imageResults && updateStats.imageResults.length">
                  <div class="au__divider">🖼 ICONS</div>
                  <div v-for="ir in updateStats.imageResults" :key="'i-' + ir.category" class="au__row">
                    <span class="au__row-cat">{{ { item: '物品', monster: '怪物', skill: '技能', achievement: '成就' }[ir.category] || ir.category }}</span>
                    <span class="au__row-val">{{ ir.downloaded }}↓ {{ ir.skipped }}✓<template v-if="ir.failed > 0"> <em class="au__fail">✗{{ ir.failed }}</em></template></span>
                  </div>
                </template>
                <template v-if="updateStats.fieldResults && updateStats.fieldResults.length">
                  <div class="au__divider">📝 CNS</div>
                  <div v-for="fr in updateStats.fieldResults" :key="'c-' + fr.category" class="au__row">
                    <span class="au__row-cat">{{ { item: '物品', monster: '怪物', skill: '技能', equipset: '套装', achievement: '成就' }[fr.category] || fr.category }}</span>
                    <span class="au__row-val">N+{{ fr.nameCnsUpdated }} D+{{ fr.descCnsUpdated }}<template v-if="fr.failed > 0"> <em class="au__fail">✗{{ fr.failed }}</em></template></span>
                  </div>
                </template>
              </template>
              <div v-else class="au__empty">等待更新...</div>
            </div>
          </div>

          <!-- 失败ID -->
          <div v-if="hasAnyFailedIds" class="au__card au__card--err">
            <div class="au__card-head">
              ❌ FAILED ({{ totalFailedCount }})
              <button class="au__card-act" @click="clearFailedIdsMap">清除</button>
            </div>
            <div class="au__card-body">
              <template v-if="failedIdsMap.items?.length"><div class="au__frow"><b>物品</b> {{ failedIdsMap.items.slice(0, 8).join(', ') }}{{ failedIdsMap.items.length > 8 ? '...' : '' }}</div></template>
              <template v-if="failedIdsMap.monster?.length"><div class="au__frow"><b>怪物</b> {{ failedIdsMap.monster.slice(0, 8).join(', ') }}{{ failedIdsMap.monster.length > 8 ? '...' : '' }}</div></template>
              <template v-if="failedIdsMap.skill?.length"><div class="au__frow"><b>技能</b> {{ failedIdsMap.skill.slice(0, 8).join(', ') }}{{ failedIdsMap.skill.length > 8 ? '...' : '' }}</div></template>
              <template v-if="failedIdsMap.image?.length"><div class="au__frow"><b>图标</b> {{ failedIdsMap.image.slice(0, 8).join(', ') }}{{ failedIdsMap.image.length > 8 ? '...' : '' }}</div></template>
              <template v-if="failedIdsMap.achievement?.length"><div class="au__frow"><b>成就</b> {{ failedIdsMap.achievement.slice(0, 8).join(', ') }}{{ failedIdsMap.achievement.length > 8 ? '...' : '' }}</div></template>
              <button v-if="retryableFailedCount > 0" class="au__btn au__btn--sm" :disabled="isRunning" @click="retryFailedIds">🔄 重试 ({{ retryableFailedCount }})</button>
            </div>
          </div>

          <!-- 更新记录 -->
          <div class="au__card au__card--flex">
            <div class="au__card-head">
              📜 LOG
              <button class="au__card-act" :disabled="updateLogsLoading" @click="toggleUpdateLogs">
                {{ showUpdateLogs ? '收起' : '查看' }}<template v-if="updateLogsTotal > 0"> ({{ updateLogsTotal }})</template>
              </button>
            </div>
            <div v-if="showUpdateLogs" class="au__card-body au__card-body--scroll">
              <div v-if="apiServerOnline === false" class="au__empty au__empty--err">❌ 后端未启动</div>
              <div v-else-if="updateLogsLoading" class="au__empty">加载中...</div>
              <div v-else-if="updateLogs.length === 0" class="au__empty">暂无记录</div>
              <template v-else>
                <div v-for="log in updateLogs" :key="log.id" class="au__lentry">
                  <div class="au__lentry-h">
                    <span class="au__lentry-v">{{ log.localVersion || '—' }} → {{ log.remoteVersion }}</span>
                    <span class="au__lentry-t">{{ formatLogTime(log.createdAt) }}</span>
                  </div>
                  <div class="au__lentry-tags">
                    <span v-if="log.itemNew > 0" class="au__tag au__tag--item">物+{{ log.itemNew }}</span>
                    <span v-if="log.monsterNew > 0" class="au__tag au__tag--monster">怪+{{ log.monsterNew }}</span>
                    <span v-if="log.skillNew > 0" class="au__tag au__tag--skill">技+{{ log.skillNew }}</span>
                    <span v-if="log.equipsetNew > 0" class="au__tag au__tag--equipset">套+{{ log.equipsetNew }}</span>
                    <span v-if="log.achievementNew > 0" class="au__tag au__tag--achievement">就+{{ log.achievementNew }}</span>
                    <span v-if="log.imageDownloaded > 0" class="au__tag au__tag--image">图+{{ log.imageDownloaded }}</span>
                    <span v-if="log.nameCnsUpdated > 0" class="au__tag au__tag--cns">N+{{ log.nameCnsUpdated }}</span>
                    <span v-if="log.descCnsUpdated > 0" class="au__tag au__tag--cns">D+{{ log.descCnsUpdated }}</span>
                    <span v-if="log.totalFailed > 0" class="au__tag au__tag--fail">✗{{ log.totalFailed }}</span>
                  </div>
                </div>
                <div v-if="updateLogsTotal > 5" class="au__pages">
                  <button class="au__pages-btn" :disabled="updateLogsOffset <= 0 || updateLogsLoading" @click="loadUpdateLogsPrev">◀</button>
                  <span class="au__pages-info">{{ Math.floor(updateLogsOffset / 5) + 1 }}/{{ Math.ceil(updateLogsTotal / 5) }}</span>
                  <button class="au__pages-btn" :disabled="updateLogsOffset + 5 >= updateLogsTotal || updateLogsLoading" @click="loadUpdateLogsNext">▶</button>
                </div>
              </template>
            </div>
          </div>

          <!-- 旧版 -->
          <details class="au__legacy">
            <summary class="au__legacy-sum">📦 旧版全量更新</summary>
            <div class="au__legacy-body">
              <button class="au__btn au__btn--ghost" :disabled="isRunning || isChecking || isServerOffline" @click="handleOneClick">
                {{ isChecking ? '检测中...' : isRunning && oneClickStep >= 0 ? `步骤 ${oneClickStep + 1}/${oneClickTasks.length}` : '旧版一键更新' }}
              </button>
              <div v-if="oneClickStep >= 0" class="au__legacy-steps">
                <span v-for="(task, idx) in oneClickTasks" :key="idx" class="au__legacy-step" :class="{ 'au__legacy-step--on': idx === oneClickStep, 'au__legacy-step--done': idx < oneClickStep }">
                  {{ idx < oneClickStep ? '✓' : idx === oneClickStep ? '▸' : '·' }} {{ task.name }}
                </span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * FlyFF API 数据更新器页面 — RPG游戏风格
 * 使用 useFlyffApiUpdater 组合式函数提供所有业务逻辑
 */
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useFlyffApiUpdater } from '@/composables/useFlyffApiUpdater'

// ==================== 主题系统 ====================

/** localStorage 持久化键名 */
const THEME_STORAGE_KEY = 'flyff_api_updater_theme'

/**
 * 主题预设定义
 * @type {Array<{id: string, label: string, dotColor: string, vars: Record<string,string>}>}
 */
const themePresets = [
  {
    id: 'dark',
    label: '暗黑主题',
    dotColor: '#1a1a2e',
    vars: {
      '--au-bg-deep': '#0d1117',
      '--au-bg-mid': '#161b22',
      '--au-bg-card': 'rgba(22, 27, 34, 0.9)',
      '--au-bg-glow1': 'rgba(74, 158, 255, 0.07)',
      '--au-bg-glow2': 'rgba(124, 106, 239, 0.06)',
      '--au-bg-glow3': 'rgba(240, 192, 64, 0.04)',
      '--au-text': '#e0e6f0',
      '--au-text-dim': '#7d8590',
      '--au-border': 'rgba(255, 255, 255, 0.1)',
      '--au-border-bright': 'rgba(74, 158, 255, 0.35)',
      '--au-head-bg': 'linear-gradient(90deg, rgba(74, 158, 255, 0.12) 0%, rgba(124, 106, 239, 0.1) 100%)',
      '--au-panel-bg': 'rgba(255, 255, 255, 0.03)',
      '--au-log-bg': 'rgba(0, 0, 0, 0.25)',
      '--au-bar-track': 'rgba(0, 0, 0, 0.3)',
      '--au-card-head-bg': 'rgba(0, 0, 0, 0.2)',
      '--au-sec-border': 'rgba(255, 255, 255, 0.04)'
    }
  },
  {
    id: 'light',
    label: '白色主题',
    dotColor: '#f0f2f5',
    vars: {
      '--au-bg-deep': '#e8ecf1',
      '--au-bg-mid': '#f0f2f5',
      '--au-bg-card': 'rgba(255, 255, 255, 0.92)',
      '--au-bg-glow1': 'rgba(74, 158, 255, 0.05)',
      '--au-bg-glow2': 'rgba(124, 106, 239, 0.04)',
      '--au-bg-glow3': 'rgba(240, 192, 64, 0.03)',
      '--au-text': '#1f2328',
      '--au-text-dim': '#656d76',
      '--au-border': 'rgba(0, 0, 0, 0.1)',
      '--au-border-bright': 'rgba(74, 158, 255, 0.4)',
      '--au-head-bg': 'linear-gradient(90deg, rgba(74, 158, 255, 0.1) 0%, rgba(124, 106, 239, 0.08) 100%)',
      '--au-panel-bg': 'rgba(0, 0, 0, 0.03)',
      '--au-log-bg': 'rgba(0, 0, 0, 0.04)',
      '--au-bar-track': 'rgba(0, 0, 0, 0.08)',
      '--au-card-head-bg': 'rgba(0, 0, 0, 0.04)',
      '--au-sec-border': 'rgba(0, 0, 0, 0.06)'
    }
  },
  {
    id: 'classic',
    label: '经典主题',
    dotColor: '#2c1654',
    vars: {
      '--au-bg-deep': '#1a1a2e',
      '--au-bg-mid': '#16213e',
      '--au-bg-card': 'rgba(26, 26, 46, 0.88)',
      '--au-bg-glow1': 'rgba(74, 158, 255, 0.08)',
      '--au-bg-glow2': 'rgba(124, 106, 239, 0.07)',
      '--au-bg-glow3': 'rgba(240, 192, 64, 0.05)',
      '--au-text': '#e0e6f0',
      '--au-text-dim': '#7d8590',
      '--au-border': 'rgba(255, 255, 255, 0.12)',
      '--au-border-bright': 'rgba(74, 158, 255, 0.4)',
      '--au-head-bg': 'linear-gradient(90deg, rgba(74, 158, 255, 0.15) 0%, rgba(124, 106, 239, 0.12) 100%)',
      '--au-panel-bg': 'rgba(255, 255, 255, 0.04)',
      '--au-log-bg': 'rgba(0, 0, 0, 0.3)',
      '--au-bar-track': 'rgba(0, 0, 0, 0.35)',
      '--au-card-head-bg': 'rgba(0, 0, 0, 0.25)',
      '--au-sec-border': 'rgba(255, 255, 255, 0.05)'
    }
  }
]

/** 当前主题ID */
const themeId = ref('dark')

/** 是否显示颜色调节面板 */
const showColorPanel = ref(false)

/** 自定义颜色（RGB + 透明度） */
const customColor = reactive({ r: 74, g: 158, b: 255, a: 100 })

/** 色相环 canvas 引用 */
const hueCanvas = ref(null)

/** 色相环拖拽状态 */
let hueDragging = false

/** 透明度条拖拽状态 */
let alphaDragging = false

/**
 * RGB 转 HSL
 * @param {number} r - 红色 (0-255)
 * @param {number} g - 绿色 (0-255)
 * @param {number} b - 蓝色 (0-255)
 * @returns {{h: number, s: number, l: number}} HSL 值
 */
function rgbToHsl (r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return { h: h * 360, s: s * 100, l: l * 100 }
  }
  return { h: 0, s: 0, l: l * 100 }
}

/**
 * HSL 转 RGB
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {{r: number, g: number, b: number}} RGB 值
 */
function hslToRgb (h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

/**
 * RGB 转 HEX
 * @param {number} r - 红色 (0-255)
 * @param {number} g - 绿色 (0-255)
 * @param {number} b - 蓝色 (0-255)
 * @returns {string} HEX 颜色字符串
 */
function rgbToHex (r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

/**
 * 绘制色相环
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 */
function drawHueRing (canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  const outerR = Math.min(cx, cy) - 2
  const innerR = outerR - 18

  ctx.clearRect(0, 0, w, h)

  /* 逐角度绘制色相环 */
  for (let angle = 0; angle < 360; angle += 0.5) {
    const rad = (angle - 90) * Math.PI / 180
    const radNext = (angle + 0.5 - 90) * Math.PI / 180
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, rad, radNext)
    ctx.arc(cx, cy, innerR, radNext, rad, true)
    ctx.closePath()
    ctx.fillStyle = `hsl(${angle}, 100%, 50%)`
    ctx.fill()
  }

  /* 绘制选中色相的指示器 */
  const hsl = rgbToHsl(customColor.r, customColor.g, customColor.b)
  const selRad = (hsl.h - 90) * Math.PI / 180
  const midR = (outerR + innerR) / 2
  const sx = cx + Math.cos(selRad) * midR
  const sy = cy + Math.sin(selRad) * midR
  ctx.beginPath()
  ctx.arc(sx, sy, 7, 0, Math.PI * 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(sx, sy, 5, 0, Math.PI * 2)
  ctx.fillStyle = `hsl(${hsl.h}, 100%, 50%)`
  ctx.fill()
}

/**
 * 从 canvas 点击位置提取色相并更新 customColor
 * @param {MouseEvent} e - 鼠标事件
 */
function pickHueFromCanvas (e) {
  const canvas = hueCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const outerR = Math.min(cx, cy) - 2
  const innerR = outerR - 18

  /* 仅在色相环范围内响应 */
  if (dist < innerR || dist > outerR) return

  let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
  if (angle < 0) angle += 360

  const hsl = rgbToHsl(customColor.r, customColor.g, customColor.b)
  const rgb = hslToRgb(angle, Math.max(hsl.s, 60), hsl.l > 20 && hsl.l < 80 ? hsl.l : 50)
  customColor.r = rgb.r
  customColor.g = rgb.g
  customColor.b = rgb.b
  drawHueRing(canvas)
}

/**
 * 色相环鼠标按下事件
 * @param {MouseEvent} e - 鼠标事件
 */
function onHueDown (e) {
  pickHueFromCanvas(e)
  hueDragging = true

  const onMove = (ev) => {
    if (!hueDragging) return
    pickHueFromCanvas(ev)
  }
  const onUp = () => {
    hueDragging = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

/**
 * RGB 输入事件处理
 * @param {string} ch - 通道标识 ('r'|'g'|'b')
 * @param {Event} e - input 事件对象
 */
function onRgbInput (ch, e) {
  let v = parseInt(e.target.value, 10)
  if (isNaN(v)) v = 0
  customColor[ch] = Math.max(0, Math.min(255, v))
  nextTick(() => drawHueRing(hueCanvas.value))
}

/**
 * 透明度数值输入事件处理
 * @param {Event} e - input 事件对象
 */
function onAlphaInput (e) {
  let v = parseInt(e.target.value, 10)
  if (isNaN(v)) v = 100
  customColor.a = Math.max(0, Math.min(100, v))
}

/**
 * 透明度条点击事件处理
 * @param {MouseEvent} e - 鼠标事件
 */
function onAlphaBarClick (e) {
  const bar = e.currentTarget
  const rect = bar.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  customColor.a = Math.round(ratio * 100)
}

/**
 * 透明度条鼠标按下拖拽
 * @param {MouseEvent} e - 鼠标事件
 */
function onAlphaBarDown (e) {
  onAlphaBarClick(e)
  alphaDragging = true
  const bar = e.currentTarget

  const onMove = (ev) => {
    if (!alphaDragging) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
    customColor.a = Math.round(ratio * 100)
  }
  const onUp = () => {
    alphaDragging = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

/** 预览颜色（带透明度） */
const previewColor = computed(() =>
  `rgba(${customColor.r}, ${customColor.g}, ${customColor.b}, ${customColor.a / 100})`
)

/** HEX 显示 */
const hexDisplay = computed(() =>
  rgbToHex(customColor.r, customColor.g, customColor.b) + (customColor.a < 100 ? ` ${(customColor.a / 100).toFixed(2)}` : '')
)

/** 透明度条背景渐变 */
const alphaBarBg = computed(() =>
  `linear-gradient(90deg, rgba(${customColor.r},${customColor.g},${customColor.b},0), rgb(${customColor.r},${customColor.g},${customColor.b}))`
)

/**
 * 计算颜色的相对亮度（0-1）
 * @param {number} r - 红色 (0-255)
 * @param {number} g - 绿色 (0-255)
 * @param {number} b - 蓝色 (0-255)
 * @returns {number} 相对亮度值
 */
function relativeLuminance (r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * 基于自定义颜色动态计算所有 CSS 变量
 * 根据所选颜色亮度自动选择亮色/暗色文字方案，确保可读性
 * @returns {Record<string,string>} CSS 变量键值对
 */
const customThemeVars = computed(() => {
  const { r, g, b, a } = customColor
  const hsl = rgbToHsl(r, g, b)
  const lum = relativeLuminance(r, g, b)
  const isLight = lum > 0.35

  /* 基于 HSL 生成色阶 */
  const bgDeepH = hsl.h
  const bgDeepS = Math.min(hsl.s, 40)
  const bgDeepL = isLight ? 92 : 8
  const bgMidL = isLight ? 95 : 12

  /* 文字色：与背景相反 */
  const textL = isLight ? 12 : 92
  const textS = isLight ? 15 : 10
  const textDimL = isLight ? 40 : 48

  /* 边框色：与背景对比但柔和 */
  const borderAlpha = isLight ? '0.12' : '0.1'
  const borderBrightAlpha = isLight ? '0.35' : '0.35'
  const borderColor = isLight ? '0, 0, 0' : '255, 255, 255'

  /* 面板背景：略深/浅于主背景 */
  const panelAlpha = isLight ? '0.6' : '0.9'
  const panelFill = isLight ? 255 : 15

  /* 标题栏渐变：使用自定义颜色但降低不透明度 */
  const headAlpha1 = isLight ? '0.08' : '0.12'
  const headAlpha2 = isLight ? '0.06' : '0.10'

  /* 背景光效 */
  const glowAlpha1 = isLight ? '0.04' : '0.07'
  const glowAlpha2 = isLight ? '0.03' : '0.06'
  const glowAlpha3 = isLight ? '0.02' : '0.04'

  /* 日志、进度条、卡片头等背景 */
  const logAlpha = isLight ? '0.5' : '0.25'
  const logFill = isLight ? 240 : 0
  const barTrackAlpha = isLight ? '0.08' : '0.3'
  const cardHeadAlpha = isLight ? '0.5' : '0.2'
  const secBorderAlpha = isLight ? '0.06' : '0.04'

  /* 全局不透明度 */
  const opacity = a < 100 ? (a / 100) : 1

  const bgDeepRgb = hslToRgb(bgDeepH, bgDeepS, bgDeepL)
  const bgMidRgb = hslToRgb(bgDeepH, Math.min(bgDeepS, 30), bgMidL)
  const textRgb = hslToRgb(bgDeepH, textS, textL)
  const textDimRgb = hslToRgb(bgDeepH, textS, textDimL)

  return {
    '--au-bg-deep': `rgb(${bgDeepRgb.r}, ${bgDeepRgb.g}, ${bgDeepRgb.b})`,
    '--au-bg-mid': `rgb(${bgMidRgb.r}, ${bgMidRgb.g}, ${bgMidRgb.b})`,
    '--au-bg-card': `rgba(${panelFill}, ${panelFill}, ${panelFill}, ${panelAlpha})`,
    '--au-bg-glow1': `rgba(${r}, ${g}, ${b}, ${glowAlpha1})`,
    '--au-bg-glow2': `rgba(${r}, ${g}, ${b}, ${glowAlpha2})`,
    '--au-bg-glow3': `rgba(${r}, ${g}, ${b}, ${glowAlpha3})`,
    '--au-text': opacity < 1 ? `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, ${opacity})` : `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})`,
    '--au-text-dim': opacity < 1 ? `rgba(${textDimRgb.r}, ${textDimRgb.g}, ${textDimRgb.b}, ${opacity})` : `rgb(${textDimRgb.r}, ${textDimRgb.g}, ${textDimRgb.b})`,
    '--au-border': `rgba(${borderColor}, ${borderAlpha})`,
    '--au-border-bright': `rgba(${r}, ${g}, ${b}, ${borderBrightAlpha})`,
    '--au-head-bg': `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, ${headAlpha1}) 0%, rgba(${r}, ${g}, ${b}, ${headAlpha2}) 100%)`,
    '--au-panel-bg': `rgba(${borderColor}, ${isLight ? '0.04' : '0.03'})`,
    '--au-log-bg': `rgba(${logFill}, ${logFill}, ${logFill}, ${logAlpha})`,
    '--au-bar-track': `rgba(${logFill}, ${logFill}, ${logFill}, ${barTrackAlpha})`,
    '--au-card-head-bg': `rgba(${logFill}, ${logFill}, ${logFill}, ${cardHeadAlpha})`,
    '--au-sec-border': `rgba(${borderColor}, ${secBorderAlpha})`
  }
})

/**
 * 获取当前主题的 CSS 变量集合（供 :style 绑定到 .au 根元素）
 * 如果自定义颜色非默认值，使用动态计算的变量（含对比文字色）
 * @returns {Record<string,string>} CSS 变量键值对
 */
function getThemeVars () {
  /* 自定义颜色非默认蓝色 → 使用动态计算的主题变量 */
  const isDefault = customColor.r === 74 && customColor.g === 158 && customColor.b === 255 && customColor.a === 100
  if (!isDefault) return customThemeVars.value

  const preset = themePresets.find(t => t.id === themeId.value)
  return preset ? preset.vars : themePresets[0].vars
}

/**
 * 切换颜色调节面板
 */
function toggleColorPanel () {
  showColorPanel.value = !showColorPanel.value
  if (showColorPanel.value) {
    nextTick(() => drawHueRing(hueCanvas.value))
  }
}

/**
 * 应用指定主题预设，更新 CSS 变量并持久化偏好
 * @param {string} id - 主题预设ID（dark/light/classic）
 */
function applyTheme (id) {
  themeId.value = id
  showColorPanel.value = false
  /* 切换预设时重置自定义颜色 */
  customColor.r = 74
  customColor.g = 158
  customColor.b = 255
  customColor.a = 100
  saveThemePreference()
}

/**
 * 重置自定义颜色为默认
 */
function resetCustomColor () {
  customColor.r = 74
  customColor.g = 158
  customColor.b = 255
  customColor.a = 100
  nextTick(() => drawHueRing(hueCanvas.value))
}

/**
 * 从 localStorage 加载主题偏好
 */
function loadThemePreference () {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed.themeId && themePresets.some(t => t.id === parsed.themeId)) {
      themeId.value = parsed.themeId
    }
    if (parsed.customColor) {
      const c = parsed.customColor
      if (typeof c.r === 'number') customColor.r = c.r
      if (typeof c.g === 'number') customColor.g = c.g
      if (typeof c.b === 'number') customColor.b = c.b
      if (typeof c.a === 'number') customColor.a = c.a
    }
  } catch {
    /* 静默忽略解析失败 */
  }
}

/**
 * 保存主题偏好到 localStorage
 */
function saveThemePreference () {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
      themeId: themeId.value,
      customColor: { r: customColor.r, g: customColor.g, b: customColor.b, a: customColor.a }
    }))
  } catch {
    /* 静默忽略写入失败 */
  }
}

/** 监听主题和自定义颜色变化，自动保存 */
watch([themeId, () => customColor.r, () => customColor.g, () => customColor.b, () => customColor.a], () => {
  saveThemePreference()
})

/* 页面挂载时加载主题偏好 */
onMounted(() => {
  loadThemePreference()
})

/** 可重试的失败ID数量（仅 items/monster/skill/achievement，不含 image） */
const retryableFailedCount = computed(() => {
  const map = failedIdsMap.value
  return (map.items?.length || 0) + (map.monster?.length || 0) + (map.skill?.length || 0) + (map.achievement?.length || 0)
})

/** 是否有任意分类存在失败ID */
const hasAnyFailedIds = computed(() => {
  const map = failedIdsMap.value
  return (map.items?.length || 0) + (map.monster?.length || 0) + (map.skill?.length || 0) + (map.achievement?.length || 0) + (map.image?.length || 0) > 0
})

/** 失败ID总数量 */
const totalFailedCount = computed(() => {
  const map = failedIdsMap.value
  return (map.items?.length || 0) + (map.monster?.length || 0) + (map.skill?.length || 0) + (map.achievement?.length || 0) + (map.image?.length || 0)
})

const {
  // 响应式状态
  outputText,
  outputType,
  progress,
  globalProgress,
  currentStepIndex,
  currentStepName,
  backendTotalSteps,
  isRunning,
  currentTask,
  oneClickStep,
  estimatedTime,
  canResume,

  // 版本与增量更新状态
  localVersion,
  remoteVersion,
  needsUpdate,
  versionCompareResult,
  updateStats,
  failedIdsMap,
  clearFailedIdsMap,
  retryFailedIds,

  // 一键增量更新
  runBatchUpdate,
  runResumeUpdate,

  // 一键更新（旧版）
  runOneClickUpdate,
  oneClickTasks,

  // 控制
  stopCurrentTask,

  // API更新记录
  updateLogs,
  updateLogsTotal,
  updateLogsLoading,
  fetchUpdateLogs,

  // 网络状态检测
  isNetworkOnline,
  checkNetworkStatus
} = useFlyffApiUpdater()

/** Go 后端服务在线状态: null=未检测, true=在线, false=离线 */
const apiServerOnline = ref(null)

/** 服务端是否离线（用于禁用请求按钮） */
const isServerOffline = computed(() => apiServerOnline.value === false)

/** 是否正在检测服务端状态 */
const isChecking = ref(false)

/** 一键更新按钮防重复点击锁（点击后3秒内不可再次点击） */
const batchUpdateLocked = ref(false)

/** 防重复点击锁定时长（毫秒） */
const BATCH_UPDATE_LOCK_MS = 3000

/**
 * 检测 Go 后端服务是否在线
 * 使用 GET 请求 /api/health 端点（Go 后端专用健康检查端点）
 * - Go 后端在线 → 返回 200 + {"status":"ok"}
 * - Go 后端离线 → Vite 代理返回 500/502/504，或 fetch 抛出网络错误
 * - 判定规则：只有返回 200 且 body 包含 "ok" 才算在线，其余一律视为离线
 */
async function checkApiServer () {
  isChecking.value = true
  apiServerOnline.value = null
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const resp = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (resp.ok) {
      /* 200 响应：尝试解析 JSON 确认服务正常 */
      try {
        const data = await resp.json()
        apiServerOnline.value = data.status === 'ok'
      } catch {
        /* JSON 解析失败也算离线 */
        apiServerOnline.value = false
      }
    } else {
      /* 非200状态码（500/502/504/404等）一律视为后端不可用 */
      apiServerOnline.value = false
    }
  } catch {
    /* 网络错误（abort、连接拒绝等）视为离线 */
    apiServerOnline.value = false
  } finally {
    isChecking.value = false
  }
}

/**
 * 确保服务端在线后执行回调
 * @param {Function} callback - 服务端在线后执行的回调
 * @returns {Promise<void>}
 */
async function ensureServerOnline (callback) {
  if (apiServerOnline.value === true) {
    await callback()
    return
  }
  await checkApiServer()
  if (apiServerOnline.value === true) {
    await callback()
  }
}

/**
 * 并行检测服务端+网络状态（一键增量更新的前置检测）
 * @returns {Promise<{serverOk: boolean, networkOk: boolean}>} 两个条件是否满足
 */
async function checkBatchUpdatePrerequisites () {
  const [serverOk, networkOk] = await Promise.all([
    apiServerOnline.value === true ? true : checkApiServer().then(() => apiServerOnline.value === true),
    isNetworkOnline.value === true ? true : checkNetworkStatus().then(() => isNetworkOnline.value === true)
  ])
  return { serverOk, networkOk }
}

/**
 * 处理一键增量更新按钮点击
 * 支持断点续传：如果上次中止，再次点击直接继续
 * 点击时先检测服务端+网络状态，再执行更新
 * @returns {Promise<void>}
 */
async function handleBatchUpdate () {
  /* 防重复点击：已在运行或锁定期内直接返回 */
  if (isRunning.value || batchUpdateLocked.value) return

  /* 立即置运行态 + 加锁，覆盖前置检测窗口（版本比对最长8s + 网络检测最长8s），
     否则3秒锁过期后按钮重新可点 → 重复启动任务 */
  isRunning.value = true
  batchUpdateLocked.value = true

  try {
    /* 并行检测服务端和网络状态 */
    const { serverOk, networkOk } = await checkBatchUpdatePrerequisites()

    if (!serverOk) {
      setOutput('❌ Go 后端服务未启动，无法执行更新', 'error')
      return
    }
    if (!networkOk) {
      setOutput('❌ 无法连接远程API（flyff.com），请检查网络', 'error')
      return
    }

    // 断点续传：直接启动续传，跳过版本比对和已完成类别
    if (canResume.value) {
      await runResumeUpdate()
      return
    }
    // 首次更新：直接启动一键更新（后端内置版本比对步骤）
    // 数据需要更新时：版本比对 → 增量拉取数据 → 下载缺失图片
    // 数据已是最新时：版本比对 → 跳过数据拉取 → 仅补全缺失图片
    await runBatchUpdate()
  } finally {
    isRunning.value = false
    /* 释放锁并保留短暂冷却，吸收快速重复点击 */
    setTimeout(() => {
      batchUpdateLocked.value = false
    }, BATCH_UPDATE_LOCK_MS)
  }
}

/**
 * 更新输出信息（从composable代理，供本组件使用）
 * @param {string} text - 输出文本
 * @param {string} [type=''] - 状态类型
 */
function setOutput (text, type = '') {
  outputText.value = text
  outputType.value = type
}

/**
 * 处理一键更新按钮点击（旧版保留）
 * @returns {Promise<void>}
 */
async function handleOneClick () {
  await ensureServerOnline(runOneClickUpdate)
}

// ==================== API更新记录 ====================

/** 是否显示更新记录面板 */
const showUpdateLogs = ref(false)

/** 更新记录分页偏移量 */
const updateLogsOffset = ref(0)

/**
 * 格式化更新记录时间（只保留月-日 时:分）
 * @param {string} t - ISO时间字符串
 * @returns {string} 格式化后的简短时间
 */
function formatLogTime (t) {
  if (!t) return ''
  try {
    const d = new Date(t)
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return t
  }
}

/**
 * 切换更新记录面板的显示/隐藏
 * 打开时先检测服务端状态，服务端离线时提示错误，在线时再加载第一页数据
 */
async function toggleUpdateLogs () {
  showUpdateLogs.value = !showUpdateLogs.value
  if (showUpdateLogs.value) {
    /* 检测服务端状态 */
    if (apiServerOnline.value !== true) {
      await checkApiServer()
    }
    if (apiServerOnline.value === true) {
      updateLogsOffset.value = 0
      await fetchUpdateLogs(5, 0)
    } else {
      setOutput('❌ Go 后端服务未启动，无法加载更新记录', 'error')
    }
  }
}

/**
 * 加载上一页更新记录
 */
async function loadUpdateLogsPrev () {
  updateLogsOffset.value = Math.max(0, updateLogsOffset.value - 5)
  await fetchUpdateLogs(5, updateLogsOffset.value)
}

/**
 * 加载下一页更新记录
 */
async function loadUpdateLogsNext () {
  updateLogsOffset.value += 5
  await fetchUpdateLogs(5, updateLogsOffset.value)
}
</script>

<style lang="scss" scoped>
/* 变量由 @/styles/variables.scss 通过 Vite additionalData 自动注入 */

/* ==================== RPG 调色板（SCSS 变量 — 作为 CSS 变量的回退值） ==================== */
$bg-deep: #0d1117;
$bg-mid: #161b22;
$bg-card: rgba(22, 27, 34, 0.9);
$glow-blue: #4a9eff;
$glow-purple: #7c6aef;
$glow-gold: #f0c040;
$glow-green: #4ecf73;
$glow-red: #e25555;
$glow-orange: #e6a23c;
$text: #e0e6f0;
$text-dim: #7d8590;
$border: rgba(255, 255, 255, 0.1);
$border-bright: rgba(74, 158, 255, 0.35);

/* ==================== 全屏容器（居中） ==================== */
.au {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--au-bg-deep, $bg-deep);
  color: var(--au-text, $text);
  font-family: 'Consolas', 'Microsoft YaHei', monospace;
  font-size: 14px;
  overflow: hidden;
  position: relative;
  transition: background 0.4s, color 0.4s;
}

/* 背景装饰光效 */
.au__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 40%, var(--au-bg-glow1, rgba(74, 158, 255, 0.07)) 0%, transparent 70%),
    radial-gradient(ellipse 50% 60% at 80% 60%, var(--au-bg-glow2, rgba(124, 106, 239, 0.06)) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 50% 90%, var(--au-bg-glow3, rgba(240, 192, 64, 0.04)) 0%, transparent 70%);
  pointer-events: none;
}

/* ==================== 主面板（居中毛玻璃） ==================== */
.au__shell {
  position: relative;
  z-index: 1;
  width: 92%;
  max-width: 1100px;
  height: 92vh;
  max-height: 780px;
  display: flex;
  flex-direction: column;
  background: var(--au-bg-card, $bg-card);
  border: 1px solid var(--au-border, $border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 0 60px rgba(74, 158, 255, 0.08),
    0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: background 0.4s, border-color 0.4s, filter 0.4s;
}

/* ==================== 顶部标题栏 ==================== */
.au__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--au-head-bg, linear-gradient(90deg, rgba(74, 158, 255, 0.12) 0%, rgba(124, 106, 239, 0.1) 100%));
  border-bottom: 1px solid var(--au-border, $border);
  flex-shrink: 0;
}

.au__head-icon {
  color: $glow-gold;
  font-size: 22px;
  filter: drop-shadow(0 0 4px rgba(240, 192, 64, 0.5));
}

.au__head-title {
  flex: 1;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 3px;
  background: linear-gradient(90deg, $glow-blue, $glow-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.au__head-badges {
  display: flex;
  gap: 6px;
}

.au__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  border: 1px solid var(--au-border, $border);
  color: var(--au-text-dim, $text-dim);
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.03));

  &--on {
    border-color: rgba($glow-green, 0.4);
    color: $glow-green;
    background: rgba($glow-green, 0.08);
  }

  &--off {
    border-color: rgba($glow-red, 0.4);
    color: $glow-red;
    background: rgba($glow-red, 0.08);
  }

  &--wait {
    border-color: var(--au-border, $border);
    color: var(--au-text-dim, $text-dim);
  }
}

.au__badge-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: $text-dim;

  .au__badge--on & {
    background: $glow-green;
    box-shadow: 0 0 6px rgba($glow-green, 0.6);
  }

  .au__badge--off & {
    background: $glow-red;
    box-shadow: 0 0 4px rgba($glow-red, 0.4);
  }
}

/* ==================== 内容主体（左右分栏） ==================== */
.au__body {
  flex: 1;
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  min-height: 0;
}

.au__col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;

  &--left {
    flex: 3;
  }

  &--right {
    flex: 2;
  }
}

/* ==================== 版本信息 ==================== */
.au__ver {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--au-border, $border);
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  flex-shrink: 0;
}

.au__ver-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
}

.au__ver-sep {
  width: 1px;
  align-self: stretch;
  background: var(--au-border, $border);
  flex-shrink: 0;
}

.au__ver-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--au-text-dim, $text-dim);
}

.au__ver-val {
  font-size: 14px;
  font-weight: bold;
  color: $glow-gold;
}

.au__ver-tag {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 10px;
  border-radius: 4px;
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.05));
  color: var(--au-text-dim, $text-dim);

  &--old {
    background: rgba($glow-orange, 0.15);
    color: $glow-orange;
    border: 1px solid rgba($glow-orange, 0.3);
  }

  &--ok {
    background: rgba($glow-green, 0.12);
    color: $glow-green;
    border: 1px solid rgba($glow-green, 0.25);
  }
}

/* ==================== 按钮 ==================== */
.au__btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.au__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: bold;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--au-border, $border);
  border-radius: 8px;
  transition: all 0.25s;
  color: var(--au-text, $text);
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.05));
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* 主按钮 —— 蓝紫渐变 + 发光 */
  &--hero {
    flex: 1;
    padding: 12px 24px;
    font-size: 16px;
    letter-spacing: 1px;
    background: linear-gradient(135deg, rgba($glow-blue, 0.25) 0%, rgba($glow-purple, 0.2) 100%);
    border-color: var(--au-border-bright, $border-bright);
    color: #fff;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, rgba($glow-blue, 0.35) 0%, rgba($glow-purple, 0.3) 100%);
      box-shadow: 0 0 20px rgba($glow-blue, 0.25), 0 0 40px rgba($glow-purple, 0.1);
    }
  }

  /* 发光层 */
  &-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
    transform: translateX(-100%);
    animation: btnGlow 3s ease-in-out infinite;
    pointer-events: none;
  }

  &-text {
    position: relative;
    z-index: 1;
  }

  /* 中止按钮 */
  &--abort {
    background: rgba($glow-red, 0.12);
    border-color: rgba($glow-red, 0.35);
    color: $glow-red;
    min-width: 80px;
    padding: 10px 18px;

    &:hover:not(:disabled) {
      background: rgba($glow-red, 0.2);
    }
  }

  /* 小按钮 */
  &--sm {
    width: 100%;
    margin-top: 4px;
    padding: 5px 14px;
    font-size: 13px;
    background: rgba($glow-orange, 0.1);
    border-color: rgba($glow-orange, 0.3);
    color: $glow-orange;
  }

  /* 幽灵按钮 */
  &--ghost {
    width: 100%;
    padding: 8px 16px;
    font-size: 14px;
    color: $text-dim;
  }
}

@keyframes btnGlow {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* ==================== 进度条 ==================== */
.au__bar {
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--au-border, $border);
  border-radius: 6px;
  padding: 6px 12px;
  flex-shrink: 0;

  &--global {
    border-color: var(--au-border-bright, $border-bright);
    background: rgba($glow-blue, 0.04);
  }
}

.au__bar-top {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--au-text-dim, $text-dim);
  margin-bottom: 3px;
}

.au__bar-step {
  flex: 1;
  text-align: center;
  color: $glow-blue;
  font-size: 12px;
}

.au__bar-pct {
  color: $glow-gold;
  font-weight: bold;
  white-space: nowrap;
  font-size: 13px;
}

.au__bar-track {
  height: 6px;
  background: var(--au-bar-track, rgba(0, 0, 0, 0.3));
  border-radius: 3px;
  overflow: hidden;
}

.au__bar-fill {
  height: 100%;
  background: linear-gradient(90deg, $glow-blue, $glow-purple);
  border-radius: 3px;
  transition: width 0.3s;
  box-shadow: 0 0 8px rgba($glow-blue, 0.3);

  &--g {
    background: linear-gradient(90deg, $glow-gold, $glow-orange);
    box-shadow: 0 0 8px rgba($glow-gold, 0.3);
  }
}

/* ==================== 日志输出 ==================== */
.au__log {
  flex: 1;
  min-height: 0;
  background: var(--au-log-bg, rgba(0, 0, 0, 0.25));
  border: 1px solid var(--au-border, $border);
  border-radius: 8px;
  padding: 8px 12px;
  overflow: auto;
  transition: border-color 0.3s;

  &--ok { border-color: rgba($glow-green, 0.4); }
  &--err { border-color: rgba($glow-red, 0.4); }
  &--warn { border-color: rgba($glow-orange, 0.4); }
}

.au__log-pre {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--au-text-dim, $text-dim);
}

/* ==================== 右侧卡片 ==================== */
.au__card {
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--au-border, $border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-shrink: 0;

  &--err { border-color: rgba($glow-red, 0.35); }
  &--flex { flex: 1; min-height: 0; }
}

.au__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--au-card-head-bg, rgba(0, 0, 0, 0.2));
  border-bottom: 1px solid var(--au-border, $border);
  font-size: 13px;
  font-weight: bold;
  color: $glow-blue;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.au__card-act {
  font-size: 12px;
  padding: 2px 10px;
  background: rgba($glow-blue, 0.08);
  border: 1px solid rgba($glow-blue, 0.25);
  border-radius: 4px;
  color: $glow-blue;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba($glow-blue, 0.15);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.au__card-body {
  padding: 8px 12px;
  overflow: hidden;
  flex-shrink: 0;

  &--scroll {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
}

/* ==================== 统计行 ==================== */
.au__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
}

.au__row-cat {
  font-weight: bold;
  color: var(--au-text, $text);
  min-width: 30px;

  &--item { color: $glow-blue; }
  &--monster { color: $glow-red; }
  &--skill { color: $glow-green; }
  &--equipset { color: $glow-orange; }
  &--achievement { color: #e6c200; }
}

.au__row-val {
  color: var(--au-text-dim, $text-dim);
}

.au__fail {
  color: $glow-red;
  font-style: normal;
  font-weight: bold;
}

.au__divider {
  font-size: 12px;
  color: var(--au-text-dim, $text-dim);
  letter-spacing: 1px;
  padding: 3px 0 1px;
  border-top: 1px solid var(--au-border, $border);
  margin-top: 2px;
}

.au__empty {
  text-align: center;
  padding: 8px;
  color: var(--au-text-dim, $text-dim);
  font-size: 13px;

  &--err { color: $glow-red; }
}

/* ==================== 失败ID ==================== */
.au__frow {
  padding: 2px 0;
  font-size: 13px;
  color: var(--au-text-dim, $text-dim);
  word-break: break-all;

  b {
    color: $glow-red;
    margin-right: 4px;
  }
}

/* ==================== 更新记录条目 ==================== */
.au__lentry {
  padding: 4px 0;
  border-bottom: 1px solid var(--au-sec-border, rgba(255, 255, 255, 0.04));

  &:last-child { border-bottom: none; }
}

.au__lentry-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.au__lentry-v {
  font-weight: bold;
  font-size: 13px;
  color: $glow-gold;
}

.au__lentry-t {
  font-size: 12px;
  color: var(--au-text-dim, $text-dim);
}

.au__lentry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.au__tag {
  display: inline-block;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;

  &--item { background: rgba($glow-blue, 0.12); color: $glow-blue; }
  &--monster { background: rgba($glow-red, 0.12); color: $glow-red; }
  &--skill { background: rgba($glow-green, 0.12); color: $glow-green; }
  &--equipset { background: rgba($glow-orange, 0.12); color: $glow-orange; }
  &--achievement { background: rgba(#e6c200, 0.12); color: #e6c200; }
  &--image { background: rgba($glow-purple, 0.12); color: $glow-purple; }
  &--cns { background: rgba($glow-gold, 0.12); color: $glow-gold; }
  &--fail { background: rgba($glow-red, 0.1); color: $glow-red; }
}

/* ==================== 记录分页 ==================== */
.au__pages {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid var(--au-border, $border);
}

.au__pages-btn {
  padding: 1px 8px;
  font-size: 12px;
  background: var(--au-panel-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--au-border, $border);
  border-radius: 4px;
  color: var(--au-text-dim, $text-dim);
  cursor: pointer;
  font-family: inherit;

  &:hover:not(:disabled) {
    color: var(--au-text, $text);
    border-color: var(--au-border-bright, $border-bright);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.au__pages-info {
  font-size: 12px;
  color: var(--au-text-dim, $text-dim);
}

/* ==================== 旧版折叠 ==================== */
.au__legacy {
  flex-shrink: 0;
}

.au__legacy-sum {
  cursor: pointer;
  font-size: 13px;
  color: var(--au-text-dim, $text-dim);
  padding: 4px 0;
  user-select: none;
  list-style: none;

  &:hover { color: var(--au-text, $text); }
}

.au__legacy-body {
  padding: 4px 0;
}

.au__legacy-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.au__legacy-step {
  font-size: 12px;
  color: var(--au-text-dim, $text-dim);
  padding: 1px 4px;

  &--on {
    background: rgba($glow-blue, 0.12);
    color: $glow-blue;
    font-weight: bold;
    border-radius: 3px;
  }

  &--done { color: $glow-green; }
}

/* ==================== 滚动条 ==================== */
.au__log::-webkit-scrollbar,
.au__card-body--scroll::-webkit-scrollbar {
  width: 4px;
}

.au__log::-webkit-scrollbar-track,
.au__card-body--scroll::-webkit-scrollbar-track {
  background: transparent;
}

.au__log::-webkit-scrollbar-thumb,
.au__card-body--scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* ==================== 主题切换控件 ==================== */
.au__theme {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  padding-left: 6px;
  border-left: 1px solid var(--au-border, $border);
}

.au__theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  outline: none;

  &:hover {
    transform: scale(1.2);
  }

  &--active {
    border-color: $glow-gold;
    box-shadow: 0 0 6px rgba($glow-gold, 0.5);
  }
}

/* 调色板按钮 */
.au__theme-pick {
  font-size: 12px;
  padding: 0 4px;
  cursor: pointer;
  background: none;
  border: none;
  outline: none;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.2);
  }

  &--active {
    filter: drop-shadow(0 0 4px rgba($glow-gold, 0.6));
  }
}

/* ==================== 颜色调节面板 ==================== */
.au__cp {
  position: absolute;
  top: 42px;
  right: 10px;
  z-index: 100;
  width: 210px;
  background: var(--au-bg-card, $bg-card);
  border: 1px solid var(--au-border, $border);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: cpFadeIn 0.2s ease-out;
}

@keyframes cpFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.au__cp-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: bold;
  color: var(--au-text, $text);
}

.au__cp-close {
  background: none;
  border: none;
  color: var(--au-text-dim, $text-dim);
  cursor: pointer;
  font-size: 13px;
  padding: 0 2px;

  &:hover { color: var(--au-text, $text); }
}

/* 色相环区域 */
.au__cp-ring {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.au__cp-ring-c {
  cursor: crosshair;
  border-radius: 50%;
}

.au__cp-ring-center {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--au-border, $border);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
}

/* RGB 输入行 */
.au__cp-rgb {
  display: flex;
  gap: 4px;
}

.au__cp-ch {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;

  &--a {
    flex: 0.8;
  }
}

.au__cp-ch-l {
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.au__cp-ch input[type="number"] {
  width: 100%;
  text-align: center;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--au-border, $border);
  border-radius: 4px;
  color: var(--au-text, $text);
  font-size: 13px;
  font-family: inherit;
  padding: 2px 0;
  outline: none;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    border-color: var(--au-border-bright, $border-bright);
  }
}

/* 透明度条 */
.au__cp-alpha {
  padding: 0 2px;
}

.au__cp-alpha-bar {
  position: relative;
  height: 10px;
  border-radius: 5px;
  cursor: pointer;
  border: 1px solid var(--au-border, $border);
}

.au__cp-alpha-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 14px;
  border-radius: 3px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 底部预览 */
.au__cp-foot {
  display: flex;
  align-items: center;
  gap: 6px;
}

.au__cp-preview {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--au-border, $border);
  flex-shrink: 0;
}

.au__cp-hex {
  flex: 1;
  font-size: 12px;
  color: var(--au-text-dim, $text-dim);
  font-family: 'Consolas', monospace;
}

.au__cp-reset {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba($glow-red, 0.1);
  border: 1px solid rgba($glow-red, 0.3);
  border-radius: 4px;
  color: $glow-red;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background: rgba($glow-red, 0.18);
  }
}

/* ==================== 响应式 ==================== */
@media (max-width: 900px) {
  .au__shell {
    width: 96%;
    height: 96vh;
  }

  .au__body {
    flex-direction: column;
    overflow-y: auto;
  }

  .au__col--left,
  .au__col--right {
    flex: none;
  }

  .au__log {
    min-height: 120px;
  }
}
</style>
