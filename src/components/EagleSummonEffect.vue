<!--
  @file EagleSummonEffect.vue
  @generated 2026-07-17
  @description 神鹰降临召唤物组件（图片显示版 + GPU加速特效）
  爆裂射手R技能 - 召唤神鹰真身降临战场

  功能：
  1. 召唤阶段：神鹰伴随金色光柱和能量波纹从天空降临
  2. 盘旋阶段：神鹰图片在默认位置（捡宠右侧）或目标怪物附近盘旋飞行
  3. 移动阶段：GPU加速直接DOM操控，金色拖尾粒子+倾斜飞行+上下颠簸
  4. 攻击阶段：周期性俯冲攻击（图片缩放+旋转动画），冲击波+神鹰图片+伤害
  5. 消散阶段：持续时间结束后，神鹰图片淡出上浮消散

  位置管理（与捡宠 PickuppetPet 一致的定位方式）：
  - 使用 Teleport to="body" + position: fixed，页面级坐标
  - 非自动战斗状态：显示在捡宠位置右侧（基于 playerAvatar 定位）
  - 自动战斗状态：移动到目标怪物图片附近，执行普通攻击

  性能优化（GPU加速，零卡顿）：
  - 位置更新使用直接DOM操控（rootEl.style.transform），绕过Vue响应式开销
  - translate3d 强制GPU合成层，backface-visibility:hidden 消除闪烁
  - 仅使用 transform + opacity 动画属性，零Layout/Paint开销
  - will-change 提示浏览器提前创建合成层
  - 拖尾粒子使用CSS @keyframes 驱动，JS仅负责创建/回收
  - requestAnimationFrame 驱动移动循环，与显示器刷新率同步
  - 速度模型（加速度+阻尼+最大速度），模拟真实飞行动力学
-->

<template>
  <Teleport to="body">
    <!-- ===== 金色拖尾粒子（独立fixed定位，停留于生成位置消散） ===== -->
    <div
      v-for="p in trailParticles"
      :key="p.id"
      class="eagle-trail-particle"
      :style="p.style"
    ></div>

    <!-- ===== 俯冲冲击波（攻击命中时在目标位置扩散） ===== -->
    <div
      v-for="b in impactBursts"
      :key="b.id"
      class="eagle-impact-burst"
      :class="{ critical: b.isCritical }"
      :style="b.style"
    ></div>

    <!-- ===== 神鹰根容器（position:fixed，通过ref直接操控transform） ===== -->
    <div
      v-if="isVisible"
      ref="rootEl"
      :key="animationKey"
      class="eagle-summon-root"
      :class="{ 'is-moving': isMoving }"
      @click.stop="handleEagleClick"
    >
      <!-- ===== 移动光环（移动时显示的脉冲光晕） ===== -->
      <div class="eagle-move-aura"></div>

      <!-- ===== 召唤阶段：金色光柱 ===== -->
      <div class="es-summon-pillar"></div>

      <!-- ===== 召唤阶段：能量波纹 ===== -->
      <div
        v-for="wave in summonWaves"
        :key="wave.id"
        class="es-summon-wave"
        :style="wave.style"
      ></div>

      <!-- ===== 倾斜包裹层（银行式倾斜+颠簸，通过ref直接操控） ===== -->
      <div ref="tiltEl" class="eagle-tilt-wrapper">
        <!-- ===== 神鹰主体（图片显示，CSS驱动浮动/俯冲动画） ===== -->
        <div
          class="eagle-body"
          :class="{ attacking: isAttacking }"
        >
          <img
            src="/pt/skill_icon/shenyingjianglin.png"
            alt="神鹰"
            class="eagle-image"
            :class="{ 'eagle-image-dispersing': isDispersing }"
            draggable="false"
          />
        </div>
      </div>

      <!-- ===== 点击后的小选项面板：紧贴神鹰图片右侧（参考捡宠实现） ===== -->
      <div
        v-if="showContextMenu"
        class="eagle-action-panel"
        @click.stop
      >
        <button
          class="action-btn recall-btn"
          @click="handleRecall"
        >
          召回
        </button>
        <button
          class="action-btn info-btn"
          @click="handleShowInfo"
        >
          信息
        </button>
      </div>
    </div>

    <!-- ===== 神鹰伤害指示器：显示神鹰图片+伤害数字（独立 fixed 定位） ===== -->
    <div
      v-for="dmg in activeDamageIndicators"
      :key="dmg.id"
      class="eagle-damage-indicator"
      :class="{ critical: dmg.isCritical }"
      :style="dmg.style"
    >
      <img
        src="/pt/skill_icon/shenyingjianglin.png"
        alt="神鹰"
        class="damage-eagle-icon"
        draggable="false"
      />
      <span class="damage-text">{{ dmg.damage }}</span>
    </div>

    <!-- ===== 神鹰详情面板（居中浏览器显示，无模态框） ===== -->
    <EagleInfoPanel
      :is-visible="showInfoPanel"
      :summon-stats="props.summonStats"
      :stat-ratio="props.statRatio"
      :skill-level="props.skillLevel"
      :total-duration="infoPanelDuration"
      :start-time="infoPanelStartTime"
      @close="showInfoPanel = false"
    />
  </Teleport>
</template>

<script setup>
/**
 * 神鹰降临召唤物组件（图片显示版 + GPU加速特效）
 * 爆裂射手R技能 - Buff召唤类型
 *
 * 核心特性：
 * 1. 神鹰本体使用技能图标图片显示，与捡宠风格一致
 * 2. 三阶段动画：召唤降临 → 盘旋飞行 → 消散
 * 3. 位置管理：非战斗状态在捡宠右侧，自动战斗状态移动到怪物附近
 * 4. 攻击阶段神鹰向目标俯冲，并显示神鹰图片+伤害动画
 * 5. GPU加速：直接DOM操控位置(transform3d)，绕过Vue响应式逐帧开销
 * 6. 金色拖尾粒子：移动时持续生成，CSS动画驱动消散
 * 7. 俯冲冲击波：攻击命中时在目标位置扩散金色冲击环
 * 8. 真实飞行动力学：加速度+阻尼+倾斜+颠簸，模拟鸟类飞行
 * 9. 使用 Teleport to="body" + position: fixed，与捡宠一致的页面级定位
 */
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import EagleInfoPanel from './EagleInfoPanel.vue'

// 禁用属性自动继承：组件根节点为 Teleport（多根片段），Vue 无法自动继承非 props 属性
defineOptions({
  inheritAttrs: false
})

// ==================== Props ====================

const props = defineProps({
  /** 是否启动动画（外部触发信号） */
  start: {
    type: Boolean,
    default: true
  },
  /** 持续时间（毫秒），默认60000 = 1分钟 */
  duration: {
    type: Number,
    default: 60000
  },
  /** 攻击间隔（毫秒），默认1500ms */
  attackInterval: {
    type: Number,
    default: 1500
  },
  /** 是否处于自动战斗状态 */
  autoBattle: {
    type: Boolean,
    default: false
  },
  /** 神鹰属性数据（来自 calculateSummonStats，供详情面板展示） */
  summonStats: {
    type: Object,
    default: null
  },
  /** 属性继承百分比（供详情面板展示） */
  statRatio: {
    type: Number,
    default: 0
  },
  /** 技能熟练度等级（供详情面板展示） */
  skillLevel: {
    type: Number,
    default: 0
  }
})

// ==================== 响应式状态（仅用于模板渲染） ====================

/** 组件可见性 */
const isVisible = ref(false)

/** 动画key，递增以触发DOM重建 */
const animationKey = ref(0)

/** 是否正在攻击（触发俯冲动画） */
const isAttacking = ref(false)

/** 是否正在消散（触发图片淡出动画） */
const isDispersing = ref(false)

/** 召唤波纹数据 */
const summonWaves = ref([])

/** 神鹰是否正在移动（控制移动光环显示） */
const isMoving = ref(false)

/** 活跃的伤害指示器列表 */
const activeDamageIndicators = ref([])

/** 活跃的拖尾粒子列表 */
const trailParticles = ref([])

/** 活跃的冲击波列表 */
const impactBursts = ref([])

// ==================== 模板引用 ====================

/** 根容器DOM引用（用于直接操控transform，GPU加速） */
const rootEl = ref(null)

/** 倾斜包裹层DOM引用（用于直接操控倾斜+颠簸） */
const tiltEl = ref(null)

// ==================== 非响应式变量（避免Vue逐帧重渲染） ====================

/** 神鹰当前X坐标（视口级坐标） */
let eagleX = 0

/** 神鹰当前Y坐标（视口级坐标） */
let eagleY = 0

/** 神鹰目标X坐标 */
let targetX = 0

/** 神鹰目标Y坐标 */
let targetY = 0

/** 当前水平速度（用于加速度模型） */
let velocityX = 0

/** 当前垂直速度（用于加速度模型） */
let velocityY = 0

/** 当前倾斜角度（平滑插值） */
let currentTilt = 0

/** 上次拖尾粒子生成时间（节流控制） */
let lastTrailTime = 0

// ==================== 常量配置 ====================

/** 召唤阶段持续时间（毫秒） */
const SUMMON_PHASE_MS = 1500

/** 消散阶段持续时间（毫秒） */
const DISPERSE_PHASE_MS = 1500

/** 召唤波纹数量 */
const SUMMON_WAVE_COUNT = 3

/** 神鹰尺寸（像素），增大50%后为96px */
const EAGLE_SIZE = 96

/** 捡宠宽度（像素），用于计算右侧偏移 */
const PET_WIDTH = 48

/** 伤害指示器持续时间（毫秒） */
const DAMAGE_INDICATOR_DURATION = 1200

/** 拖尾粒子持续时间（毫秒） */
const TRAIL_DURATION = 800

/** 拖尾粒子生成间隔（毫秒），控制密度 */
const TRAIL_SPAWN_INTERVAL = 35

/** 冲击波持续时间（毫秒） */
const IMPACT_DURATION = 600

/** 最大拖尾粒子数量（防止内存溢出） */
const MAX_TRAIL_PARTICLES = 30

/** 移动加速度 */
const MOVE_ACCEL = 0.9

/** 移动最大速度 */
const MOVE_MAX_SPEED = 16

/** 移动阻尼系数（空气阻力，0~1） */
const MOVE_DAMPING = 0.86

/** 到达目标的最小距离阈值 */
const ARRIVE_THRESHOLD = 2

/** 速度归零阈值 */
const VELOCITY_ZERO = 0.4

// ==================== 内部变量 ====================

/** 移动动画帧ID */
let moveFrameId = null

/** 攻击定时器 */
let attackTimer = null

/** 消散定时器 */
let disperseTimer = null

/** 清理定时器 */
let cleanupTimer = null

/** 默认位置更新定时器 */
let positionTimer = null

/** 召唤开始时间戳（用于详情面板倒计时） */
let summonStartTime = 0

/** 伤害指示器自增ID */
let damageIndicatorId = 0

/** 拖尾粒子自增ID */
let trailParticleId = 0

/** 冲击波自增ID */
let impactBurstId = 0

// ==================== 小选项面板 & 详情面板状态 ====================

/** 是否显示小选项面板（召回/信息） */
const showContextMenu = ref(false)

/** 是否显示详情面板 */
const showInfoPanel = ref(false)

/** 详情面板的总持续时间（秒） */
const infoPanelDuration = ref(0)

/** 详情面板的召唤开始时间戳 */
const infoPanelStartTime = ref(0)

/**
 * 点击神鹰图片，切换小选项面板显示/隐藏
 * 面板用 position:absolute 定位在神鹰根容器内部右侧（参考捡宠实现）
 */
function handleEagleClick () {
  if (!isVisible.value || isDispersing.value) return
  showContextMenu.value = !showContextMenu.value
}

/**
 * 处理召回神鹰
 * 派发全局事件由 Main.vue 处理：移除 Buff + 清理定时器 + 消散动画
 */
function handleRecall () {
  showContextMenu.value = false
  showInfoPanel.value = false
  // 派发召回事件，Main.vue 监听后执行移除逻辑
  try {
    window.dispatchEvent(new CustomEvent('eagle-recall'))
  } catch (e) {
    // 忽略事件派发失败
  }
}

/**
 * 处理显示详情面板
 */
function handleShowInfo () {
  showContextMenu.value = false
  // 记录持续时间信息供详情面板倒计时使用
  infoPanelDuration.value = Math.floor(props.duration / 1000)
  infoPanelStartTime.value = summonStartTime || Date.now()
  showInfoPanel.value = true
}

/**
 * 点击页面其他区域时关闭小选项面板
 * @param {MouseEvent} event - 鼠标事件
 */
function handleGlobalClick (event) {
  if (!showContextMenu.value) return
  // 如果点击的不是小选项面板内部，则关闭
  const menuEl = document.querySelector('.eagle-action-panel')
  if (menuEl && !menuEl.contains(event.target)) {
    showContextMenu.value = false
  }
}

// ==================== 数据生成函数 ====================

/**
 * 生成召唤波纹数据
 * 从神鹰降临位置向外扩散的金色波纹
 * @returns {Array} 波纹配置数组
 */
function generateSummonWaves () {
  const list = []
  for (let i = 0; i < SUMMON_WAVE_COUNT; i++) {
    list.push({
      id: `wave-${i}`,
      style: {
        animationDelay: `${i * 0.2}s`
      }
    })
  }
  return list
}

// ==================== 位置计算 ====================

/**
 * 获取捡宠右侧的默认位置（视口级坐标）
 * 与捡宠 PickuppetPet.getRestPosition() 使用相同的基准（playerAvatar），
 * 然后在捡宠休息位置右侧偏移 PET_WIDTH + 间距
 * @returns {{ x: number, y: number }} 默认位置坐标（视口级）
 */
function getDefaultPosition () {
  try {
    // 优先使用捡宠元素的实际位置（捡宠已激活时）
    const petEl = document.querySelector('.pickuppet-pet')
    if (petEl) {
      const petRect = petEl.getBoundingClientRect()
      return {
        x: petRect.right + 10,
        y: petRect.top + petRect.height / 2 - EAGLE_SIZE / 2
      }
    }

    // 捡宠未激活时，基于 playerAvatar 计算位置
    const avatarEl = document.getElementById('playerAvatar')
    if (avatarEl) {
      const rect = avatarEl.getBoundingClientRect()
      return {
        x: rect.left + rect.width / 2 + PET_WIDTH / 2 + 10,
        y: rect.bottom + 100 + PET_WIDTH / 2 - EAGLE_SIZE / 2
      }
    }

    return { x: 200, y: 200 }
  } catch (error) {
    console.error('[EagleSummonEffect] 获取默认位置失败:', error)
    return { x: 200, y: 200 }
  }
}

/**
 * 获取目标怪物附近的位置（视口级坐标）
 * @param {number} targetIndex - 目标怪物索引
 * @returns {{ x: number, y: number }} 怪物附近位置坐标（视口级）
 */
function getMonsterPosition (targetIndex) {
  try {
    const monsterEl = document.getElementById(`enemy-container-${targetIndex}`)
    if (monsterEl) {
      const monsterRect = monsterEl.getBoundingClientRect()
      return {
        x: monsterRect.left + monsterRect.width * 0.7,
        y: monsterRect.top + monsterRect.height * 0.2
      }
    }

    return getDefaultPosition()
  } catch (error) {
    console.error('[EagleSummonEffect] 获取怪物位置失败:', error)
    return getDefaultPosition()
  }
}

// ==================== GPU加速DOM操控 ====================

/**
 * 直接更新根容器transform（GPU加速，绕过Vue响应式）
 * 使用 translate3d 强制创建GPU合成层
 * @param {number} x - 视口X坐标
 * @param {number} y - 视口Y坐标
 * @param {boolean} moving - 是否正在移动（控制transition）
 */
function updateRootTransform (x, y, moving) {
  if (!rootEl.value) return
  // translate3d 强制GPU合成层，避免Layout/Paint
  rootEl.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
  // 移动时禁用transition（RAF逐帧控制），静止时启用平滑过渡
  rootEl.value.style.transition = moving ? 'none' : 'transform 0.3s ease-out'
}

/**
 * 直接更新倾斜包裹层transform（GPU加速）
 * 结合飞行颠簸（sin波）和银行式倾斜（基于水平速度）
 * @param {number} tilt - 倾斜角度（度）
 * @param {number} bob - 颠簸偏移量（像素）
 */
function updateTiltTransform (tilt, bob) {
  if (!tiltEl.value) return
  // translateY 用于颠簸，rotate 用于倾斜，translateZ 强制GPU层
  tiltEl.value.style.transform = `translate3d(0, ${bob}px, 0) rotate(${tilt}deg)`
}

// ==================== 拖尾粒子系统 ====================

/**
 * 生成一个金色拖尾粒子
 * 在神鹰当前位置生成，CSS动画驱动消散
 * @param {number} x - 粒子X坐标（视口级）
 * @param {number} y - 粒子Y坐标（视口级）
 */
function spawnTrailParticle (x, y) {
  const now = performance.now()
  if (now - lastTrailTime < TRAIL_SPAWN_INTERVAL) return
  lastTrailTime = now

  // 超过最大数量时移除最早的粒子
  if (trailParticles.value.length >= MAX_TRAIL_PARTICLES) {
    trailParticles.value.shift()
  }

  const id = ++trailParticleId
  // 粒子中心对齐到神鹰中心，添加微小随机偏移使拖尾更自然
  const offsetX = (Math.random() - 0.5) * 16
  const offsetY = (Math.random() - 0.5) * 16
  const size = 14 + Math.random() * 10

  trailParticles.value.push({
    id,
    style: {
      left: `${x + EAGLE_SIZE / 2 + offsetX}px`,
      top: `${y + EAGLE_SIZE / 2 + offsetY}px`,
      width: `${size}px`,
      height: `${size}px`,
      marginLeft: `${-size / 2}px`,
      marginTop: `${-size / 2}px`
    }
  })

  // 动画结束后自动回收
  setTimeout(() => {
    const idx = trailParticles.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      trailParticles.value.splice(idx, 1)
    }
  }, TRAIL_DURATION)
}

/**
 * 生成俯冲冲击波
 * 攻击命中时在目标位置扩散金色冲击环
 * @param {number} x - 冲击波中心X坐标（视口级）
 * @param {number} y - 冲击波中心Y坐标（视口级）
 * @param {boolean} isCritical - 是否暴击（暴击时冲击波更大更亮）
 */
function spawnImpactBurst (x, y, isCritical = false) {
  const id = ++impactBurstId

  impactBursts.value.push({
    id,
    isCritical,
    style: {
      left: `${x}px`,
      top: `${y}px`
    }
  })

  setTimeout(() => {
    const idx = impactBursts.value.findIndex(b => b.id === id)
    if (idx !== -1) {
      impactBursts.value.splice(idx, 1)
    }
  }, IMPACT_DURATION)
}

// ==================== 移动动画（真实飞行动力学） ====================

/**
 * 更新神鹰目标位置
 * 非自动战斗状态：移动到默认位置（捡宠右侧）
 * 自动战斗状态：保持在当前位置（由攻击事件驱动移动到怪物）
 */
function updateTargetPosition () {
  if (!props.autoBattle) {
    const pos = getDefaultPosition()
    targetX = pos.x
    targetY = pos.y
    startMoving()
  }
}

/**
 * 启动移动动画
 * 使用 requestAnimationFrame 实现丝滑移动
 */
function startMoving () {
  if (moveFrameId) return
  isMoving.value = true
  moveStep()
}

/**
 * 移动动画循环（GPU加速 + 真实飞行动力学）
 *
 * 物理模型：
 * - 加速度：朝目标方向施加力，距离越远加速越快
 * - 阻尼：模拟空气阻力，速度逐渐衰减
 * - 最大速度：防止神鹰飞太快
 * - 倾斜：基于水平速度计算银行式倾斜角度
 * - 颠簸：sin波模拟翅膀拍打的上下颠簸
 * - 拖尾：移动时持续生成金色粒子
 */
function moveStep () {
  const dx = targetX - eagleX
  const dy = targetY - eagleY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY)

  // 到达目标且速度足够小时停止
  if (dist < ARRIVE_THRESHOLD && speed < VELOCITY_ZERO) {
    eagleX = targetX
    eagleY = targetY
    velocityX = 0
    velocityY = 0
    isMoving.value = false
    moveFrameId = null
    updateRootTransform(eagleX, eagleY, false)
    return
  }

  // 朝目标方向施加加速度（距离越远力越大，但有上限）
  if (dist > 0) {
    const accel = Math.min(MOVE_ACCEL, dist * 0.08)
    velocityX += (dx / dist) * accel
    velocityY += (dy / dist) * accel
  }

  // 应用空气阻力阻尼
  velocityX *= MOVE_DAMPING
  velocityY *= MOVE_DAMPING

  // 限制最大速度
  const currentSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
  if (currentSpeed > MOVE_MAX_SPEED) {
    const ratio = MOVE_MAX_SPEED / currentSpeed
    velocityX *= ratio
    velocityY *= ratio
  }

  // 更新位置
  eagleX += velocityX
  eagleY += velocityY

  // 计算银行式倾斜角度（水平速度越大倾斜越大，方向跟随移动方向）
  const targetTilt = Math.max(-30, Math.min(30, velocityX * 2.2))
  // 平滑插值倾斜角度，避免突变
  currentTilt += (targetTilt - currentTilt) * 0.15

  // 计算翅膀拍打颠簸（sin波，频率与速度正相关）
  const bobFreq = 0.006 + Math.min(currentSpeed * 0.001, 0.004)
  const bobAmplitude = Math.min(2 + currentSpeed * 0.3, 6)
  const bob = Math.sin(performance.now() * bobFreq) * bobAmplitude

  // GPU加速直接DOM操控（绕过Vue响应式，零逐帧重渲染）
  updateRootTransform(eagleX, eagleY, true)
  updateTiltTransform(currentTilt, bob)

  // 生成拖尾粒子（节流控制密度）
  if (currentSpeed > 1) {
    spawnTrailParticle(eagleX, eagleY)
  }

  moveFrameId = requestAnimationFrame(moveStep)
}

// ==================== 动画控制 ====================

/**
 * 触发一次俯冲攻击动画
 * 神鹰图片缩放放大并轻微旋转，模拟俯冲攻击姿态
 * 同时在当前位置生成冲击波特效
 */
function triggerAttack () {
  if (!isVisible.value) return

  // 设置攻击状态，触发俯冲动画（CSS class 切换）
  isAttacking.value = true

  // 在神鹰当前位置生成冲击波
  spawnImpactBurst(eagleX + EAGLE_SIZE / 2, eagleY + EAGLE_SIZE / 2, false)

  // 300ms后恢复盘旋状态
  setTimeout(() => {
    isAttacking.value = false
  }, 300)
}

/**
 * 显示神鹰伤害指示器
 * 在目标怪物附近显示神鹰图片+伤害数字，同时生成冲击波，短暂显示后消失
 * @param {number} targetIndex - 目标怪物索引
 * @param {number} damage - 伤害数值
 * @param {boolean} isCritical - 是否暴击
 */
function showDamageIndicator (targetIndex, damage, isCritical) {
  const pos = getMonsterPosition(targetIndex)
  const id = ++damageIndicatorId

  // 在目标位置生成冲击波（暴击时冲击波更强烈）
  spawnImpactBurst(pos.x + EAGLE_SIZE / 2, pos.y + EAGLE_SIZE / 2, isCritical)

  // 添加伤害指示器（使用视口级 fixed 坐标）
  activeDamageIndicators.value.push({
    id,
    damage,
    isCritical,
    style: {
      left: `${pos.x}px`,
      top: `${pos.y}px`
    }
  })

  // 短暂显示后移除
  setTimeout(() => {
    activeDamageIndicators.value = activeDamageIndicators.value.filter(
      item => item.id !== id
    )
  }, DAMAGE_INDICATOR_DURATION)
}

/**
 * 处理神鹰攻击伤害事件
 * 监听 eagle-attack-damage 全局事件，移动到目标怪物并显示伤害动画
 * @param {CustomEvent} event - 事件对象，detail 包含 targetIndex、damage、isCritical
 */
function handleAttackDamage (event) {
  if (!isVisible.value) return
  const detail = event?.detail || {}
  const { targetIndex, damage, isCritical } = detail

  // 移动到目标怪物附近
  const pos = getMonsterPosition(targetIndex)
  targetX = pos.x
  targetY = pos.y
  startMoving()

  // 触发俯冲攻击动画
  triggerAttack()

  // 显示神鹰图片+伤害指示器（内含冲击波生成）
  showDamageIndicator(targetIndex, damage, isCritical)
}

/**
 * 播放消散动画
 * 神鹰图片淡出上浮，逐渐消散消失
 */
function playDisperse () {
  // 停止攻击
  if (attackTimer) {
    clearInterval(attackTimer)
    attackTimer = null
  }

  // 停止移动
  if (moveFrameId) {
    cancelAnimationFrame(moveFrameId)
    moveFrameId = null
  }
  isMoving.value = false

  // 清理粒子和冲击波
  trailParticles.value = []
  impactBursts.value = []

  // 触发图片淡出消散动画
  isDispersing.value = true

  // 消散动画结束后隐藏组件
  cleanupTimer = setTimeout(() => {
    isVisible.value = false
    cleanupTimer = null
  }, DISPERSE_PHASE_MS)
}

/**
 * 启动神鹰降临
 * 递增animationKey强制DOM重建，依次启动召唤→盘旋→消散阶段
 */
function playAnimation () {
  // 清理之前的定时器
  if (attackTimer) {
    clearInterval(attackTimer)
    attackTimer = null
  }
  if (disperseTimer) {
    clearTimeout(disperseTimer)
    disperseTimer = null
  }
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
  if (moveFrameId) {
    cancelAnimationFrame(moveFrameId)
    moveFrameId = null
  }

  // 重置状态
  isAttacking.value = false
  isDispersing.value = false
  isMoving.value = false
  activeDamageIndicators.value = []
  trailParticles.value = []
  impactBursts.value = []
  // 重置菜单和详情面板状态
  showContextMenu.value = false
  showInfoPanel.value = false

  // 重置运动学变量
  velocityX = 0
  velocityY = 0
  currentTilt = 0

  // 记录召唤开始时间，供详情面板倒计时使用
  summonStartTime = Date.now()

  // 递增key强制Vue重建DOM
  animationKey.value++
  isVisible.value = true

  // 生成召唤波纹
  summonWaves.value = generateSummonWaves()

  // 召唤阶段结束后，初始化位置并开始周期性攻击
  nextTick(() => {
    // 初始化到默认位置（捡宠右侧）
    const defaultPos = getDefaultPosition()
    eagleX = defaultPos.x
    eagleY = defaultPos.y
    targetX = defaultPos.x
    targetY = defaultPos.y
    // GPU加速直接设置初始位置
    updateRootTransform(eagleX, eagleY, false)

    // 召唤阶段结束后，仅在自动战斗状态下启动周期性攻击动画
    // 非战斗状态下神鹰只播放闲置浮动动画（esEagleFloat），不播放攻击动画
    // 攻击动画由 eagle-attack-damage 全局事件驱动（仅自动战斗时 SkillEffectService 派发）
    setTimeout(() => {
      if (!isVisible.value) return
      if (!props.autoBattle) return
      // 周期性攻击动画（仅自动战斗状态）
      attackTimer = setInterval(() => {
        triggerAttack()
      }, props.attackInterval)
    }, SUMMON_PHASE_MS)
  })

  // 持续时间结束前启动消散
  const disperseDelay = props.duration - DISPERSE_PHASE_MS
  disperseTimer = setTimeout(() => {
    playDisperse()
    disperseTimer = null
  }, disperseDelay)
}

// ==================== 暴露方法 ====================

defineExpose({ playAnimation, triggerAttack, playDisperse })

// ==================== Watch监听 ====================

/**
 * 监听props.start变化，true时启动动画
 */
watch(() => props.start, (newVal) => {
  if (newVal) {
    playAnimation()
  }
})

/**
 * 监听自动战斗状态变化
 * - 切换到非自动战斗时：停止攻击定时器，回到默认位置（捡宠右侧），仅播放闲置动画
 * - 切换到自动战斗时：启动周期性攻击动画定时器
 */
watch(() => props.autoBattle, (newVal) => {
  if (!isVisible.value) return

  if (!newVal) {
    // 切换到非战斗：停止攻击定时器
    if (attackTimer) {
      clearInterval(attackTimer)
      attackTimer = null
    }
    // 回到默认位置
    updateTargetPosition()
  } else {
    // 切换到战斗：启动周期性攻击动画
    if (!attackTimer) {
      attackTimer = setInterval(() => {
        triggerAttack()
      }, props.attackInterval)
    }
  }
})

// ==================== 生命周期 ====================

onMounted(() => {
  // 注册神鹰攻击伤害事件监听
  window.addEventListener('eagle-attack-damage', handleAttackDamage)
  // 注册全局点击监听，用于点击外部关闭小选项面板
  document.addEventListener('click', handleGlobalClick)

  nextTick(() => {
    playAnimation()
  })

  // 定期更新默认位置（应对窗口大小变化等），仅在非战斗状态下更新
  positionTimer = setInterval(() => {
    if (isVisible.value && !props.autoBattle && !isMoving.value) {
      updateTargetPosition()
    }
  }, 1000)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('eagle-attack-damage', handleAttackDamage)
  document.removeEventListener('click', handleGlobalClick)

  if (attackTimer) {
    clearInterval(attackTimer)
    attackTimer = null
  }
  if (disperseTimer) {
    clearTimeout(disperseTimer)
    disperseTimer = null
  }
  if (cleanupTimer) {
    clearTimeout(cleanupTimer)
    cleanupTimer = null
  }
  if (moveFrameId) {
    cancelAnimationFrame(moveFrameId)
    moveFrameId = null
  }
  if (positionTimer) {
    clearInterval(positionTimer)
    positionTimer = null
  }
})
</script>

<style scoped>
/* ========================================
   根容器 - position: fixed 页面级定位
   通过 translate3d 直接DOM操控定位（GPU合成层）
   ======================================== */
.eagle-summon-root {
  position: fixed;
  top: 0;
  left: 0;
  width: 96px;
  height: 96px;
  cursor: pointer;
  /* 显式设置 auto，确保 GPU 合成层下仍可接收点击 */
  pointer-events: auto;
  z-index: 9999;
  /* 提示浏览器提前创建GPU合成层 */
  will-change: transform;
  /* 消除GPU合成层闪烁 */
  backface-visibility: hidden;
}

/* ========================================
   移动光环 - 移动时显示的脉冲光晕
   仅使用 transform + opacity（GPU加速）
   ======================================== */
.eagle-move-aura {
  position: absolute;
  inset: -16px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 220, 100, 0.18) 0%,
    rgba(255, 180, 30, 0.08) 50%,
    transparent 70%
  );
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

.eagle-summon-root.is-moving .eagle-move-aura {
  opacity: 1;
  animation: esAuraPulse 0.5s ease-in-out infinite;
}

@keyframes esAuraPulse {
  0%, 100% {
    transform: scale3d(1, 1, 1);
    opacity: 0.5;
  }
  50% {
    transform: scale3d(1.15, 1.15, 1);
    opacity: 1;
  }
}

/* ========================================
   倾斜包裹层 - 银行式倾斜+翅膀颠簸
   通过 ref 直接操控 transform（GPU加速）
   ======================================== */
.eagle-tilt-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  will-change: transform;
  backface-visibility: hidden;
  z-index: 2;
}

/* ========================================
   召唤阶段 - 金色光柱
   ======================================== */
.es-summon-pillar {
  position: absolute;
  top: -200px;
  left: 50%;
  width: 80px;
  margin-left: -40px;
  height: 300px;
  background: linear-gradient(
    to bottom,
    rgba(255, 230, 100, 0) 0%,
    rgba(255, 215, 0, 0.15) 15%,
    rgba(255, 200, 50, 0.35) 40%,
    rgba(255, 180, 30, 0.5) 70%,
    rgba(255, 160, 0, 0.7) 100%
  );
  transform: scaleY(0);
  transform-origin: bottom center;
  animation: esPillarDescend 1.5s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes esPillarDescend {
  0% {
    transform: scaleY(0);
    opacity: 0;
  }
  20% {
    transform: scaleY(0.3);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
  80% {
    transform: scaleY(1);
    opacity: 0.6;
  }
  100% {
    transform: scaleY(0.5);
    opacity: 0;
  }
}

/* ========================================
   召唤波纹 - 地面金色波纹扩散
   ======================================== */
.es-summon-wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin-top: -10px;
  margin-left: -10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 215, 0, 0.8);
  box-shadow:
    0 0 15px rgba(255, 200, 50, 0.6),
    inset 0 0 10px rgba(255, 180, 30, 0.4);
  transform: translate(-50%, -50%) scale(0);
  animation: esWaveExpand 1s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes esWaveExpand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(15);
    opacity: 0;
  }
}

/* ========================================
   神鹰主体 - 图片容器
   盘旋阶段：浮动呼吸动画
   攻击阶段：俯冲动作
   ======================================== */
.eagle-body {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 盘旋飞行动画：浮动呼吸 */
  animation: esEagleFloat 3s ease-in-out 1.5s infinite;
  will-change: transform, opacity;
}

/* 攻击状态：俯冲动画覆盖盘旋 */
.eagle-body.attacking {
  animation: esEagleDive 0.3s ease-in-out;
}

@keyframes esEagleFloat {
  0%, 100% {
    transform: translateY(0) rotate(-3deg) scale(1);
  }
  50% {
    transform: translateY(-10px) rotate(3deg) scale(1.05);
  }
}

@keyframes esEagleDive {
  0% {
    transform: translateY(0) rotate(0deg) scale(1.1);
  }
  50% {
    transform: translateY(25px) rotate(35deg) scale(1.5);
  }
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
}

/* ========================================
   神鹰图片
   ======================================== */
.eagle-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter:
    drop-shadow(0 0 8px rgba(255, 200, 50, 0.6))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  user-select: none;
  pointer-events: none;
}

/* 移动时增强光效 */
.eagle-summon-root.is-moving .eagle-image {
  filter:
    drop-shadow(0 0 12px rgba(255, 220, 100, 0.9))
    drop-shadow(0 0 20px rgba(255, 180, 30, 0.4))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* ========================================
   消散动画 - 神鹰图片淡出上浮消散
   ======================================== */
.eagle-image.eagle-image-dispersing {
  animation: esImageDisperse 1.5s ease-out forwards;
}

@keyframes esImageDisperse {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter:
      drop-shadow(0 0 8px rgba(255, 200, 50, 0.6))
      drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
  60% {
    opacity: 0.5;
    transform: translateY(-25px) scale(1.2);
    filter: drop-shadow(0 0 12px rgba(255, 200, 50, 0.4));
  }
  100% {
    opacity: 0;
    transform: translateY(-55px) scale(1.5);
    filter: drop-shadow(0 0 16px rgba(255, 200, 50, 0));
  }
}

/* ========================================
   金色拖尾粒子 - 移动时生成，CSS驱动消散
   仅使用 transform + opacity（GPU加速）
   ======================================== */
.eagle-trail-particle {
  position: fixed;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 230, 120, 0.85) 0%,
    rgba(255, 190, 40, 0.45) 40%,
    rgba(255, 160, 0, 0.15) 70%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 9998;
  animation: esTrailFade 0.8s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

@keyframes esTrailFade {
  0% {
    opacity: 0.9;
    transform: scale3d(1, 1, 1);
  }
  50% {
    opacity: 0.5;
    transform: scale3d(0.6, 0.6, 1);
  }
  100% {
    opacity: 0;
    transform: scale3d(0.1, 0.1, 1);
  }
}

/* ========================================
   俯冲冲击波 - 攻击命中时扩散
   仅使用 transform + opacity（GPU加速）
   ======================================== */
.eagle-impact-burst {
  position: fixed;
  width: 80px;
  height: 80px;
  margin-left: -40px;
  margin-top: -40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 215, 0, 0.9);
  box-shadow:
    0 0 25px rgba(255, 200, 50, 0.7),
    inset 0 0 15px rgba(255, 180, 30, 0.4);
  pointer-events: none;
  z-index: 10000;
  animation: esImpactBurst 0.6s ease-out forwards;
  will-change: transform, opacity;
  mix-blend-mode: screen;
}

/* 暴击冲击波更大更亮 */
.eagle-impact-burst.critical {
  border-color: rgba(255, 80, 80, 0.9);
  border-width: 4px;
  box-shadow:
    0 0 35px rgba(255, 50, 50, 0.8),
    inset 0 0 20px rgba(255, 100, 50, 0.5);
}

@keyframes esImpactBurst {
  0% {
    opacity: 1;
    transform: scale3d(0.2, 0.2, 1);
  }
  40% {
    opacity: 0.8;
    transform: scale3d(1.5, 1.5, 1);
  }
  100% {
    opacity: 0;
    transform: scale3d(3, 3, 1);
  }
}

/* ========================================
   神鹰伤害指示器 - 显示神鹰图片+伤害数字
   ======================================== */
.eagle-damage-indicator {
  position: fixed;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10001;
  animation: esDamageFloat 1.2s ease-out forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

.eagle-damage-indicator.critical .damage-text {
  color: #ff4444;
  font-size: 22px;
  font-weight: bold;
  text-shadow:
    0 0 4px rgba(255, 0, 0, 0.8),
    0 0 8px rgba(255, 100, 100, 0.6),
    1px 1px 2px rgba(0, 0, 0, 0.8);
}

.eagle-damage-indicator .damage-text {
  color: #ffdd44;
  font-size: 16px;
  font-weight: bold;
  text-shadow:
    0 0 3px rgba(0, 0, 0, 0.8),
    1px 1px 2px rgba(0, 0, 0, 0.8);
}

.damage-eagle-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  image-rendering: pixelated;
  filter:
    drop-shadow(0 0 4px rgba(255, 200, 50, 0.8))
    drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  animation: esDamageIconSpin 0.6s ease-out;
  user-select: none;
  pointer-events: none;
}

@keyframes esDamageFloat {
  0% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(-10px) scale(1.1);
  }
  60% {
    opacity: 1;
    transform: translateY(-30px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}

@keyframes esDamageIconSpin {
  0% {
    transform: rotate(0deg) scale(0.5);
  }
  50% {
    transform: rotate(180deg) scale(1.3);
  }
  100% {
    transform: rotate(360deg) scale(1);
  }
}

/* 鼠标悬停时增强神鹰光效 */
.eagle-summon-root:hover .eagle-image {
  filter:
    drop-shadow(0 0 14px rgba(255, 220, 100, 0.9))
    drop-shadow(0 0 24px rgba(255, 180, 30, 0.5))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* ========================================
   神鹰小选项面板 - 召回/信息（参考捡宠 .pet-action-panel）
   absolute 定位在神鹰根容器内部右侧
   ======================================== */
.eagle-action-panel {
  position: absolute;
  top: 20px;
  left: 100px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background-color: var(--theme-modal-bg, #1e1610);
  border: 1px solid var(--theme-border-strong, #8b6f47);
  border-radius: 6px;
  box-shadow:
    0 0 15px rgba(255, 200, 50, 0.2),
    0 4px 12px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
  z-index: 10001;
}

.eagle-action-panel .action-btn {
  padding: 5px 12px;
  border: 1px solid var(--theme-border-strong, #8b6f47);
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.eagle-action-panel .recall-btn {
  background: rgba(255, 80, 80, 0.12);
  color: #e74c3c;
}

.eagle-action-panel .recall-btn:hover {
  background: rgba(255, 80, 80, 0.3);
  color: #ff6b6b;
}

.eagle-action-panel .info-btn {
  background: rgba(52, 152, 219, 0.12);
  color: var(--theme-accent, #3498db);
}

.eagle-action-panel .info-btn:hover {
  background: rgba(52, 152, 219, 0.3);
  color: #5dade2;
}

/* ========================================
   减少动画偏好 - 无障碍支持
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  .eagle-summon-root {
    display: none;
  }
}
</style>
