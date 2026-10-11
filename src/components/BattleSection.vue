<template>
  <div
    ref="battleSectionRef"
    class="battle-section"
    :style="battleSectionStyle"
    @mousedown="startDrag"
  >
    <div class="battle-info">
      <p>
        <strong>当前地图：</strong>
        <span class="current-map">{{ currentMap.name || '帕里大陆' }}</span>
      </p>
      <p>
        <strong>适合等级：</strong>
        <span class="current-map-level-range">{{ currentMap.levelRange || '1-20' }}</span>
      </p>
      <p>
        <strong>当前状态：</strong>
        <span class="battle-status">{{ statusMessage }}</span>
      </p>
    </div>
    <div class="auto-battle-controls">
      <div class="auto-battle-action-row">
        <AutoBattleControl
          mode="minimal"
          :phase="phase"
          :is-active="isActive"
          @toggle-auto-battle="handleToggleAutoBattle"
        />
      </div>
    </div>
    <div class="game-info">
      <div>当前版本: 1.9.1</div>
      <div>当前EXP倍率: {{ displayExpMultiplier }}%</div>
      <div>当前爆率: {{ displayDropRate }}%</div>
      <div>增益效果:</div>
      <BuffDisplay :active-buffs="displayBuffsForBuffDisplay" :version="gameStore.buffVersion" />
      <div
        v-if="shouldShowRaisedPet"
        class="buff-icon buff-icon-raised-pet"
        :class="{
          'buff-icon-raised-pet-inactive': !isRaisedPetActive,
          'buff-icon-warning': raisedPetBuffDuration > 0 && raisedPetBuffDuration < 30
        }"
        @mouseenter="handleShowRaisedPetTooltip($event)"
        @mouseleave="handleHideRaisedPetTooltip"
        @mousemove="handleMoveRaisedPetTooltip($event)"
      >
        <img :src="summonedRaisedPetIcon || '/pt/item_icon/default_item.png'" :alt="summonedRaisedPetName" />
        <div v-if="raisedPetBuffDuration > 0" class="buff-timer">
          {{ formatBuffDuration(raisedPetBuffDuration) }}
        </div>
      </div>
      <!-- 捡宠BUFF图标 -->
      <div
        v-if="shouldShowPickuppet"
        class="buff-icon buff-icon-pickuppet"
        :class="{
          'buff-icon-pickuppet-inactive': !isPickuppetActive,
          'buff-icon-warning': pickuppetRemainingSeconds > 0 && pickuppetRemainingSeconds < 30
        }"
        @mouseenter="handleShowPickuppetTooltip($event)"
        @mouseleave="handleHidePickuppetTooltip"
        @mousemove="handleMovePickuppetTooltip($event)"
      >
        <img :src="pickuppetSummonStore.summonedIcon" :alt="pickuppetSummonStore.summonedName" />
        <div v-if="!pickuppetSummonStore.isPermanent && pickuppetRemainingSeconds > 0" class="buff-timer">
          {{ formatBuffDuration(pickuppetRemainingSeconds) }}
        </div>
        <div v-if="pickuppetSummonStore.isPermanent" class="buff-timer buff-timer-permanent">
          ∞
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore, useRaisedPetSummonStore, usePickuppetSummonStore } from '@/store'
import { useAutoBattleStore } from '@/store/autoBattle'
import { storageService } from '@/services/StorageService'
import { useItemsStore } from '@/store/items'
import { AUTO_BATTLE_CONTROLLER_KEY } from '@/utils/injectionKeys'
import { getBuffDuration, clearBuffDuration } from '@/composables/useGameLoopManager'
import { PlayerStatsService } from '@/services/PlayerStatsService'
import { getMasterGradeExpMultiplier, getMasterGradeDropMultiplier } from '@/services/MasterGradeService'
import AutoBattleControl from './AutoBattleControl.vue'
import BuffDisplay from './BuffDisplay.vue'

/**
 * 训养宠物能量消耗 Worker 实例
 * 在独立线程中管理能量定时消耗，完全不阻塞主线程
 * @type {Worker|null}
 */
let raisedPetEnergyWorker = null

const props = defineProps({
  currentMap: {
    type: Object,
    required: true
  },
  activeBuffs: {
    type: Array,
    required: true
  },
  expMultiplier: {
    type: Number,
    required: true
  },
  dropRate: {
    type: Number,
    required: true
  }
})

const gameStore = useGameStore()
const autoBattleStore = useAutoBattleStore()
const { phase, isActive } = storeToRefs(autoBattleStore)
const raisedPetSummonStore = useRaisedPetSummonStore()
const pickuppetSummonStore = usePickuppetSummonStore()
const itemsStore = useItemsStore()

const autoBattleController = inject(AUTO_BATTLE_CONTROLLER_KEY, null)

/**
 * 大师进阶期间经验惩罚倍率（0.5 = -50%，正常 = 1）
 * 动态响应 player.masterGradeState.isActive 变化
 */
const masterExpMultiplier = computed(() => {
  return getMasterGradeExpMultiplier(gameStore.player)
})

/**
 * 大师进阶期间掉落惩罚倍率（0.5 = -50%，正常 = 1）
 * 动态响应 player.masterGradeState.isActive 变化
 */
const masterDropMultiplier = computed(() => {
  return getMasterGradeDropMultiplier(gameStore.player)
})

/**
 * 面板显示的经验倍率（原始倍率 × 大师进阶惩罚倍率）
 */
const displayExpMultiplier = computed(() => {
  return Math.floor(props.expMultiplier * masterExpMultiplier.value)
})

/**
 * 面板显示的掉落倍率（原始倍率 × 大师进阶惩罚倍率）
 */
const displayDropRate = computed(() => {
  return Math.floor(props.dropRate * masterDropMultiplier.value)
})

const RAISED_PET_ABILITY_BUFF_ID = 'raisedpet_ability'

const sortedBuffs = computed(() => {
  const buffs = Array.isArray(props.activeBuffs) ? props.activeBuffs : []
  const filtered = buffs.filter(buff => String(buff?.id ?? '') !== RAISED_PET_ABILITY_BUFF_ID)
  const withIndex = filtered.map((buff, index) => ({ buff, index }))
  const getPriority = buff => {
    const id = Number(buff?.id)
    if (id === 1276) {
      return 0
    }
    if (id === 1277) {
      return 1
    }
    return 10
  }
  const getAddedAt = buff => {
    const value = Number(buff?.addedAt ?? buff?.startTime ?? 0)
    return Number.isFinite(value) ? value : 0
  }

  return withIndex
    .sort((a, b) => {
      const priorityDiff = getPriority(a.buff) - getPriority(b.buff)
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      const timeDiff = getAddedAt(a.buff) - getAddedAt(b.buff)
      if (timeDiff !== 0) {
        return timeDiff
      }
      return a.index - b.index
    })
    .map(entry => entry.buff)
})

/**
 * 用于BuffDisplay组件的BUFF列表（过滤掉训养宠物BUFF和捡宠BUFF）
 * 注意：activeBuffs被markRaw包装，Vue无法自动追踪数组内部变化
 * 必须通过gameStore.buffVersion强制刷新（已在模板的:version prop中传递）
 */
const displayBuffsForBuffDisplay = computed(() => {
  // 依赖 gameStore.buffVersion 强制刷新（activeBuffs 被 markRaw 包装）
  // eslint-disable-next-line no-unused-vars
  const _version = gameStore.buffVersion
  const buffs = Array.isArray(props.activeBuffs) ? props.activeBuffs : []
  return buffs.filter(buff => String(buff?.id ?? '') !== RAISED_PET_ABILITY_BUFF_ID && !String(buff?.id ?? '').startsWith('pickuppet_auto_loot'))
})

const summonedRaisedPet = computed(() => raisedPetSummonStore.summonedPetItem)
const summonedRaisedPetIcon = computed(() => {
  // 优先使用 store 中的图标
  if (raisedPetSummonStore.summonedPetIcon) {
    return raisedPetSummonStore.summonedPetIcon
  }
  // 如果 store 中没有，尝试从 activeBuffs 中获取
  const buffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  const petBuff = buffs.find(item => String(item?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID)
  if (petBuff?.icon) {
    return petBuff.icon
  }
  return null
})
const isRaisedPetActive = computed(() => raisedPetSummonStore.isEnergyActive)
const raisedPetBuffDuration = computed(() => {
  // 优先从独立的 duration Map 获取
  const durationFromMap = getBuffDuration(RAISED_PET_ABILITY_BUFF_ID)
  if (durationFromMap > 0) {
    return durationFromMap
  }
  // 回退到原始 duration
  const buffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  const buff = buffs.find(item => String(item?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID) || null
  const duration = Number(buff?.duration ?? 0)
  return Number.isFinite(duration) ? Math.max(0, Math.floor(duration)) : 0
})
const summonedRaisedPetName = computed(() => {
  const name = summonedRaisedPet.value?.name
  if (typeof name === 'string' && name) {
    return name
  }
  if (name && typeof name === 'object') {
    return name.cns || name.eng || '训养宠物'
  }
  // 如果 store 中没有，尝试从 activeBuffs 中获取名称
  const buffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  const petBuff = buffs.find(item => String(item?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID)
  if (petBuff?.name) {
    return petBuff.name
  }
  return '训养宠物'
})

// 判断是否应该显示宠物图标（store中有召唤状态 或 activeBuffs中有宠物BUFF）
const shouldShowRaisedPet = computed(() => {
  if (summonedRaisedPet.value) {
    return true
  }
  const buffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  return buffs.some(item => String(item?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID)
})

// ==================== 捡宠（pickuppet）相关 ====================

/** 是否应该显示捡宠图标 */
const shouldShowPickuppet = computed(() => {
  return pickuppetSummonStore.hasSummoned
})

/** 捡宠是否处于激活状态 */
const isPickuppetActive = computed(() => {
  return pickuppetSummonStore.isAutoLootActive
})

/** 每秒递增的tick计数器，用于强制刷新倒计时显示 */
const pickuppetTick = ref(0)
let pickuppetTickTimer = null

/** 启动捡宠倒计时tick定时器 */
const startPickuppetTick = () => {
  if (pickuppetTickTimer) return
  pickuppetTickTimer = setInterval(() => {
    pickuppetTick.value++
    // 检查是否到期
    if (pickuppetSummonStore.hasSummoned && !pickuppetSummonStore.isPermanent) {
      if (pickuppetSummonStore.remainingSeconds <= 0) {
        // 到期后停止tick
        stopPickuppetTick()
      }
    }
  }, 1000)
}

/** 停止捡宠倒计时tick定时器 */
const stopPickuppetTick = () => {
  if (pickuppetTickTimer) {
    clearInterval(pickuppetTickTimer)
    pickuppetTickTimer = null
  }
}

/** 捡宠剩余时间（秒），依赖tick强制每秒刷新 */
const pickuppetRemainingSeconds = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _tick = pickuppetTick.value
  // 使用 activeExpiresAt 支持召唤中和召回暂停两种状态
  const activeExpireAt = pickuppetSummonStore.activeExpiresAt
  if (!activeExpireAt) return 0
  const now = Date.now()
  if (now >= activeExpireAt) return 0
  return Math.ceil((activeExpireAt - now) / 1000)
})

// 监听捡宠召唤状态，启动/停止倒计时tick
watch(
  () => pickuppetSummonStore.hasSummoned,
  (summoned) => {
    if (summoned && !pickuppetSummonStore.isPermanent) {
      startPickuppetTick()
    } else {
      stopPickuppetTick()
    }
  },
  { immediate: true }
)

/** 显示捡宠tooltip */
const handleShowPickuppetTooltip = event => {
  const tooltipEvent = new CustomEvent('show-buff-tooltip', {
    detail: {
      buff: {
        name: pickuppetSummonStore.summonedName,
        description: '自动拾取击杀怪物掉落的物品和金币',
        icon: pickuppetSummonStore.summonedIcon,
        duration: pickuppetSummonStore.isPermanent ? 0 : pickuppetSummonStore.remainingSeconds,
        type: 'pickuppet'
      },
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

/** 隐藏捡宠tooltip */
const handleHidePickuppetTooltip = () => {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

/** 移动捡宠tooltip */
const handleMovePickuppetTooltip = event => {
  const moveEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(moveEvent)
}

const handleShowRaisedPetTooltip = event => {
  // 优先使用 store 中的宠物数据
  if (summonedRaisedPet.value) {
    const tooltipEvent = new CustomEvent('show-item-tooltip', {
      detail: {
        item: summonedRaisedPet.value,
        position: { x: event.clientX, y: event.clientY },
        source: 'raised-pet'
      }
    })
    window.dispatchEvent(tooltipEvent)
    return
  }
  
  // 如果 store 中没有，从 activeBuffs 中获取宠物信息显示简单的 tooltip
  const buffs = Array.isArray(gameStore.player?.activeBuffs) ? gameStore.player.activeBuffs : []
  const petBuff = buffs.find(item => String(item?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID)
  if (petBuff) {
    const tooltipEvent = new CustomEvent('show-buff-tooltip', {
      detail: {
        buff: {
          name: petBuff.name || '训养宠物',
          description: petBuff.description || '',
          icon: petBuff.icon,
          duration: petBuff.duration,
          type: 'buff',
          value: petBuff.value,
          parameter: petBuff.parameter,
          meta: petBuff.meta
        },
        position: { x: event.clientX, y: event.clientY }
      }
    })
    window.dispatchEvent(tooltipEvent)
  }
}

const handleHideRaisedPetTooltip = () => {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

const handleMoveRaisedPetTooltip = event => {
  const moveEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(moveEvent)
}

/**
 * 初始化训养宠物能量消耗 Worker
 * 创建 Worker 实例并绑定消息处理回调
 * @returns {void}
 */
const initRaisedPetEnergyWorker = () => {
  if (raisedPetEnergyWorker) return

  try {
    raisedPetEnergyWorker = new Worker(
      new URL('../workers/RaisedPetEnergyWorker.js', import.meta.url),
      { type: 'module' }
    )
  } catch (error) {
    console.error('[BattleSection] 创建能量消耗 Worker 失败:', error)
    return
  }

  raisedPetEnergyWorker.onmessage = (event) => {
    const { type } = event.data || {}

    switch (type) {
      case 'energy-drain': {
        // Worker 完成能量消耗，主线程只做轻量 Store 更新
        try {
          const { energy, maxEnergy } = event.data
          // 更新 raisedPetSummonStore 中的能量值（O(1) 赋值）
          raisedPetSummonStore.setSummonedPetEnergy(energy)
          // 定向更新背包中对应物品的能量字段
          if (raisedPetSummonStore.summonedPetKey) {
            itemsStore.updateRaisedPetEnergyByKey(
              raisedPetSummonStore.summonedPetKey,
              energy,
              maxEnergy
            )
          }
          // 同步 BUFF（有签名缓存，实际只在签名变化时执行）
          gameStore.syncRaisedPetAbilityBuff()
        } catch (e) {
          console.error('[BattleSection] Worker 能量消耗回调失败:', e)
        }
        break
      }

      case 'energy-depleted':
        // 能量耗尽，syncRaisedPetAbilityBuff 会自动移除 BUFF
        try {
          gameStore.syncRaisedPetAbilityBuff()
        } catch (e) {
          console.warn('[BattleSection] 能量耗尽同步失败:', e)
        }
        break

      case 'log': {
        const { level, args } = event.data
        const logFn = level === 'warn' ? console.warn
          : level === 'error' ? console.error
            : console.log
        if (Array.isArray(args)) {
          logFn(...args)
        }
        break
      }

      default:
        break
    }
  }

  raisedPetEnergyWorker.onerror = (error) => {
    console.error('[BattleSection] 能量消耗 Worker 错误:', error)
  }
}

/**
 * 启动训养宠物能量消耗（通过 Worker）
 * 向 Worker 发送 start 消息，包含宠物 key 和当前能量值
 * @returns {void}
 */
const startRaisedPetEnergyDrain = () => {
  if (!raisedPetEnergyWorker) {
    initRaisedPetEnergyWorker()
  }
  if (!raisedPetEnergyWorker) return

  raisedPetEnergyWorker.postMessage({
    type: 'start',
    petKey: raisedPetSummonStore.summonedPetKey,
    energy: raisedPetSummonStore.summonedPetEnergy,
    maxEnergy: raisedPetSummonStore.summonedPetMaxEnergy
  })
}

/**
 * 停止训养宠物能量消耗
 * 向 Worker 发送 stop 消息，清理定时器
 * @returns {void}
 */
const stopRaisedPetEnergyDrain = () => {
  if (!raisedPetEnergyWorker) return
  raisedPetEnergyWorker.postMessage({ type: 'stop' })
}

/**
 * 通知 Worker 能量已外部刷新（糖果补满等）
 * @returns {void}
 */
const notifyEnergyRefill = () => {
  if (!raisedPetEnergyWorker) return
  raisedPetEnergyWorker.postMessage({
    type: 'update-energy',
    energy: raisedPetSummonStore.summonedPetEnergy,
    maxEnergy: raisedPetSummonStore.summonedPetMaxEnergy
  })
}

// 监听召唤状态变化，启动/停止 Worker 能量消耗
watch(
  () => raisedPetSummonStore.hasSummonedPet,
  next => {
    if (next) {
      startRaisedPetEnergyDrain()
      return
    }
    stopRaisedPetEnergyDrain()
  },
  { immediate: true }
)

// 监听能量变化，外部刷新（糖果等）时同步到 Worker
watch(
  () => raisedPetSummonStore.summonedPetEnergy,
  (newEnergy, oldEnergy) => {
    // 仅在能量增加（糖果补满等场景）时通知 Worker
    if (newEnergy > oldEnergy && raisedPetSummonStore.hasSummonedPet) {
      notifyEnergyRefill()
    }
  }
)

// 使用 watch 替代 watchEffect，精确指定依赖，避免 activeBuffs 变化引发反馈回路
watch(
  () => [
    raisedPetSummonStore.hasSummonedPet,
    raisedPetSummonStore.isEnergyActive,
    raisedPetSummonStore.summonedPetEnergy
  ],
  () => {
    gameStore.syncRaisedPetAbilityBuff()
  },
  { immediate: true }
)

const statusMessage = computed(() => {
  const currentPhase = phase.value
  if (currentPhase === 'starting') {
    return '启动中...'
  }
  if (currentPhase === 'refreshing') {
    return '刷新怪物中...'
  }
  if (currentPhase === 'countdown') {
    return '获取怪物中...'
  }
  if (currentPhase === 'paused') {
    return '已暂停'
  }
  if (currentPhase === 'running') {
    return '自动战斗中...'
  }
  return '等待战斗...'
})

const buffTooltipVisible = ref(false)
const hoveredBuff = ref(null)
const buffTooltipPosition = ref({ x: 0, y: 0 })

const deleteConfirmVisible = ref(false)
const deleteCandidateBuff = ref(null)
const deleteConfirmPosition = ref({ x: 0, y: 0 })

const deleteConfirmStyle = computed(() => ({
  left: `${deleteConfirmPosition.value.x}px`,
  top: `${deleteConfirmPosition.value.y}px`
}))

const getClientPoint = event => {
  if (event?.touches && event.touches[0]) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
  return {
    x: event?.clientX ?? 0,
    y: event?.clientY ?? 0
  }
}

const getBuffTooltipAnchorPoint = event => {
  const point = getClientPoint(event)
  return {
    x: point.x - 300,
    y: point.y - 100
  }
}

const updateBuffTooltipPosition = event => {
  buffTooltipPosition.value = getBuffTooltipAnchorPoint(event)
}

const handleShowBuffTooltip = (buff, event) => {
  if (deleteConfirmVisible.value) {
    return
  }
  hoveredBuff.value = buff || null
  updateBuffTooltipPosition(event)
  buffTooltipVisible.value = true
}

const handleMoveBuffTooltip = event => {
  if (!buffTooltipVisible.value) {
    return
  }
  updateBuffTooltipPosition(event)
}

const handleHideBuffTooltip = () => {
  buffTooltipVisible.value = false
  hoveredBuff.value = null
}

const computeDeleteConfirmPosition = event => {
  const point = getClientPoint(event)
  const offset = 8
  const padding = 10
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0

  const panelWidth = 210
  const panelHeight = 92

  let x = point.x + offset
  let y = point.y + offset

  if (x + panelWidth + padding > viewportWidth) {
    x = point.x - panelWidth - offset
  }
  if (y + panelHeight + padding > viewportHeight) {
    y = point.y - panelHeight - offset
  }

  x = Math.min(Math.max(padding, x), Math.max(padding, viewportWidth - panelWidth - padding))
  y = Math.min(Math.max(padding, y), Math.max(padding, viewportHeight - panelHeight - padding))

  return { x, y }
}

const closeDeleteConfirm = () => {
  deleteConfirmVisible.value = false
  deleteCandidateBuff.value = null
}

const handleRequestDeleteBuff = (buff, event) => {
  deleteCandidateBuff.value = buff || null
  deleteConfirmPosition.value = computeDeleteConfirmPosition(event)
  deleteConfirmVisible.value = Boolean(buff)
  handleHideBuffTooltip()
}

const handleCancelDelete = () => {
  closeDeleteConfirm()
}

const handleConfirmDelete = () => {
  try {
    const candidate = deleteCandidateBuff.value
    if (!candidate) {
      closeDeleteConfirm()
      return
    }

    const buffId = candidate.id
    const currentBuffs = Array.isArray(gameStore.player?.activeBuffs)
      ? gameStore.player.activeBuffs
      : []
    const nextBuffs = currentBuffs.filter(buffEntry => buffEntry?.id !== buffId)
    gameStore.updatePlayer({ activeBuffs: nextBuffs })

    // 清除 buffDurations Map 中的缓存，避免下次添加相同 BUFF 时显示旧时间
    clearBuffDuration(buffId)

    // 强制清除属性缓存并重新计算属性
    PlayerStatsService.clearAllCache()
    if (gameStore.player && typeof gameStore.player.applyFinalStats === 'function') {
      const equipmentSets = gameStore?.equipmentSets || []
      gameStore.player.applyFinalStats(equipmentSets)
      // 强制触发 Vue 响应式更新
      const updatedPlayer = Object.assign(
        Object.create(Object.getPrototypeOf(gameStore.player)),
        gameStore.player
      )
      gameStore.player = updatedPlayer
    }

    try {
      // storageService 已通过 import 导入全局单例
      storageService.savePlayerData(gameStore.player)
    } catch (persistError) {
      console.error('[BattleSection] 删除BUFF后存档保存失败:', persistError)
    }

    closeDeleteConfirm()
  } catch (error) {
    console.error('[BattleSection] 删除BUFF失败:', error)
    closeDeleteConfirm()
  }
}

const handleToggleAutoBattle = async () => {
  // 性能监控起点（预留）
  // const startedAt = performance.now()
  const traceId = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`
  let result = null
  try {
    if (autoBattleController && typeof autoBattleController.toggle === 'function') {
      result = await autoBattleController.toggle({ forceRefresh: true, traceId, source: 'battleSection' })
      return result
    }
    autoBattleStore.toggle()
  } catch (error) {
    console.error('[BattleSection] 切换自动战斗失败:', error)
  } finally {
    // 可用于性能监控
    // const duration = performance.now() - startedAt
  }
}

const battleSectionRef = ref(null)
const position = ref({ x: 8, y: 8 })
const initialPositionRetries = ref(0)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const battleSectionStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`
}))

const clampPosition = (nextX, nextY) => {
  const sectionEl = battleSectionRef.value
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const width = sectionEl?.offsetWidth || 0
  const height = sectionEl?.offsetHeight || 0
  const maxX = Math.max(0, viewportWidth - width)
  const maxY = Math.max(0, viewportHeight - height)
  return {
    x: Math.min(Math.max(0, nextX), maxX),
    y: Math.min(Math.max(0, nextY), maxY)
  }
}

const setInitialPosition = () => {
  const sectionEl = battleSectionRef.value
  if (!sectionEl) {
    return
  }
  const sectionRect = sectionEl.getBoundingClientRect()
  const battleLogEl = document.querySelector('.battle-log')
  if (battleLogEl) {
    const logRect = battleLogEl.getBoundingClientRect()
    const targetX = logRect.left
    const targetY = Math.max(0, logRect.top - sectionRect.height - 10)
    position.value = clampPosition(targetX, targetY)
    return
  }
  if (initialPositionRetries.value < 5) {
    initialPositionRetries.value += 1
    setTimeout(() => {
      setInitialPosition()
    }, 100)
    return
  }
  position.value = clampPosition(8, 8)
}

const startDrag = event => {
  if (
    event.target.closest('button, input, select, textarea') ||
    event.target.closest('.auto-battle-control') ||
    event.target.closest('.buff-icon') ||
    event.target.closest('.buff-delete-confirm')
  ) {
    return
  }
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
  event.preventDefault()
}

const handleMouseMove = event => {
  if (!isDragging.value) {
    return
  }
  const nextX = event.clientX - dragOffset.value.x
  const nextY = event.clientY - dragOffset.value.y
  position.value = clampPosition(nextX, nextY)
}

const handleMouseUp = () => {
  isDragging.value = false
}

const formatBuffDuration = duration => {
  const safeDuration = Number(duration)
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
    return '0:00'
  }
  const totalSeconds = Math.floor(safeDuration)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  setTimeout(() => {
    setInitialPosition()
  }, 0)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onBeforeUnmount(() => {
  stopRaisedPetEnergyDrain()
  // 终止 Worker 释放资源
  if (raisedPetEnergyWorker) {
    raisedPetEnergyWorker.terminate()
    raisedPetEnergyWorker = null
  }
  stopPickuppetTick()
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.auto-battle-controls {
  flex-direction: row;
  align-items: flex-start;
}

.auto-battle-action-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.buff-icon-raised-pet {
  border: 1px solid rgba(245, 197, 66, 0.75);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.35);
}

.buff-icon-raised-pet-inactive {
border: 1px solid rgba(255, 255, 255, 0.25);
filter: grayscale(1) brightness(0.8);
opacity: 0.75;
}

/* 捡宠BUFF图标 */
.buff-icon-pickuppet {
border: 1px solid rgba(76, 175, 80, 0.75);
box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 6px 14px rgba(0, 0, 0, 0.35);
}

.buff-icon-pickuppet-inactive {
border: 1px solid rgba(255, 255, 255, 0.25);
filter: grayscale(1) brightness(0.8);
opacity: 0.75;
}

/* 捡宠永久标记 */
.buff-timer-permanent {
background: linear-gradient(180deg, #4caf50 0%, #2e7d32 100%);
}

.buff-icon-raised-pet img {
  image-rendering: pixelated;
}


.buff-delete-confirm {
  position: fixed;
  z-index: 1000000;
  min-width: 210px;
  padding: 10px;
  border-radius: 10px;
  background: var(--theme-modal-bg);
  color: var(--theme-text);
  border: 1px solid var(--theme-border-strong);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
}

.buff-delete-confirm-text {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.buff-delete-confirm-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.buff-delete-confirm-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--theme-border-strong);
  background: var(--theme-button-bg, rgba(255, 255, 255, 0.06));
  color: var(--theme-text);
  cursor: pointer;
}

.buff-delete-confirm-btn:hover {
  background: var(--theme-button-hover-bg, rgba(255, 255, 255, 0.12));
}

/* BUFF叠加数量显示 */
.buff-stack-count {
  position: absolute;
  top: -0px;
  right: -0px;
  min-width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: white;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  line-height: 14px;
  border-radius: 7px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

/* 念力护盾百分比显示 */
.buff-shield-percent {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 2px #000, 0 0 4px #3498db, 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 5;
  pointer-events: none;
}

/* 念力护盾进度条 */
.buff-shield-bar {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
  z-index: 6;
}

.buff-shield-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%);
  border-radius: 2px;
  transition: width 0.15s ease-out;
}
</style>
