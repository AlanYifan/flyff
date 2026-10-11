<!--
  @fileoverview Blessing Awakening 祝福唤醒面板组件
  @description 使用女神的祝福(ID:7064)/恶魔祝福(ID:27754)唤醒时装物品的面板
               最多 3 条属性，每条属性支持锁定/解锁，锁定后唤醒不会修改该条属性
  @author FLYFF Team
  @version 3.0.0
  @created 2026-07-16
  @updated 2026-07-16 自动唤醒改为槽位匹配模式(达标后自动锁定);新增二次确认面板;修复女神祝福目标值匹配问题
-->
<template>
  <transition name="panel-fade">
    <div
      v-if="visible"
      ref="modalRef"
      class="blessing-awakening-modal"
      :class="blessingThemeClass"
      :style="modalStyle"
    >
      <!-- 粒子背景层 -->
      <div class="particle-bg" aria-hidden="true">
        <span
          v-for="i in 20"
          :key="i"
          class="particle"
          :style="getParticleStyle()"
        ></span>
      </div>

      <!-- 面板头部（可拖拽区域） -->
      <div class="modal-header" @mousedown="startDrag">
        <h3 class="modal-title">
          <span class="title-icon">✨</span>
          <span class="title-en">Blessing Awakening</span>
          <span class="title-cn">祝福唤醒</span>
        </h3>
        <div class="header-buttons" @mousedown.stop>
          <button class="info-button" :class="{ active: showInfoPanel }" @click="toggleInfoPanel">?</button>
          <button class="close-button" @click="handleClose">×</button>
        </div>
      </div>

      <!-- 面板内容 -->
      <div class="modal-content">
        <!-- 1. 祝福区域展示（女神/恶魔） -->
        <div class="blessing-zones">
          <div
            class="blessing-zone"
            :class="{
              goddess: true,
              active: selectedBlessingType === 'goddess'
            }"
            @click="selectBlessingZone(7064)"
          >
            <div class="zone-icon goddess-icon">
              <img src="/pt/item_icon/7064.png" @error="handleIconError" />
            </div>
            <div class="zone-info">
              <span class="zone-name goddess-text">女神的祝福</span>
              <span class="zone-desc">Goddess's Blessing</span>
              <span class="zone-bonus goddess-bonus">属性效果 +20%</span>
            </div>
            <div v-if="goddessScrollCount > 0" class="zone-count">{{ goddessScrollCount }}</div>
          </div>

          <div class="zone-divider">
            <span class="divider-text">VS</span>
          </div>

          <div
            class="blessing-zone"
            :class="{
              demon: true,
              active: selectedBlessingType === 'demon'
            }"
            @click="selectBlessingZone(27754)"
          >
            <div class="zone-icon demon-icon">
              <img src="/pt/item_icon/27754.png" @error="handleIconError" />
            </div>
            <div class="zone-info">
              <span class="zone-name demon-text">恶魔的祝福</span>
              <span class="zone-desc">Demon's Blessing</span>
            </div>
            <div v-if="demonScrollCount > 0" class="zone-count">{{ demonScrollCount }}</div>
          </div>
        </div>

        <!-- 2. 时装选择区域 -->
        <div class="awakening-section">
          <div class="section-title">
            <span class="title-marker"></span>
            选择时装物品
          </div>
          <div
            ref="selectFashionBoxRef"
            class="select-box"
            :class="{ active: showFashionPanel, disabled: fashionItems.length === 0 }"
            @click="toggleFashionPanel"
          >
            <template v-if="selectedFashion">
              <img class="select-icon" :src="selectedFashion.icon" @error="handleIconError" />
              <div class="select-info">
                <span class="select-name">{{ getFashionDisplayName(selectedFashion) }}</span>
                <span class="select-level">{{ getFashionSubcategoryLabel(selectedFashion.subcategory) }}</span>
              </div>
            </template>
            <span v-else class="select-placeholder">
              {{ fashionItems.length === 0 ? '背包中没有时装物品' : '选择要唤醒的时装物品' }}
            </span>
            <span class="select-arrow" :class="{ rotated: showFashionPanel }">▼</span>
          </div>
        </div>

        <!-- 3. 唤醒属性槽位（最多3条） -->
        <div v-if="selectedFashion" class="awakening-section result-section">
          <div class="section-title">
            <span class="title-marker"></span>
            唤醒属性
            <span v-if="isGoddessBlessing" class="goddess-bonus-tag">女神加成 {{ GODDESS_BONUS_TEXT }}</span>
            <span v-if="currentAwakenCount > 0" class="awaken-count-tag">唤醒次数: {{ currentAwakenCount }}</span>
            <span class="slot-count">{{ displayAttributes.length }}/{{ MAX_ATTRS }}</span>
          </div>
          <div class="attr-slots">
            <div
              v-for="(attr, idx) in displayAttributes"
              :key="idx"
              class="attr-slot"
              :class="{
                locked: attr?.locked,
                changed: changedSlotIndices.includes(idx) && showChangeFlash,
                empty: !attr
              }"
            >
              <!-- 属性内容 -->
              <div class="attr-content">
                <template v-if="attr">
                  <span class="attr-name">{{ attr.parameterName }}</span>
                  <span class="attr-value" :class="{ 'rate-value': attr.isRate }">
                    +{{ attr.value }}{{ attr.isRate ? '%' : '' }}
                  </span>
                  <span v-if="isMaxValue(attr)" class="max-badge">极限</span>
                </template>
                <span v-else class="attr-empty-text">— 空槽位 —</span>
              </div>
              <!-- 锁定/解锁滑动块 -->
              <div
                v-if="attr"
                class="lock-toggle"
                :class="{ locked: attr.locked }"
                @click="toggleLock(idx)"
              >
                <div class="lock-slider">
                  <div class="lock-knob"></div>
                </div>
                <span class="lock-label">{{ attr.locked ? '🔒' : '🔓' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 唤醒进度条 -->
        <div v-if="isAwakening || isAutoAwakening" class="awakening-section">
          <div class="section-title">
            <span class="title-marker"></span>
            唤醒进度
          </div>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-glow" :style="{ left: progressPercent + '%' }"></div>
            </div>
            <span class="progress-text">{{ progressPercent }}%</span>
          </div>
        </div>

        <!-- 唤醒光效层 -->
        <transition name="flash-fade">
          <div v-if="showAwakeningFlash" class="awakening-flash" aria-hidden="true">
            <div class="flash-ring flash-ring-1"></div>
            <div class="flash-ring flash-ring-2"></div>
            <div class="flash-ring flash-ring-3"></div>
          </div>
        </transition>

        <!-- 错误/成功消息 -->
        <div v-if="errorMessage" class="message error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="message success-message">{{ successMessage }}</div>

        <!-- 5. 自动唤醒目标设置 -->
        <div v-if="selectedFashion" class="awakening-section target-section">
          <div class="section-title">
            <span class="title-marker"></span>
            自动唤醒目标
            <span class="target-hint">达标后自动锁定该槽位</span>
            <button class="target-reset-btn" @click="resetAutoAwakenTargets">重置</button>
          </div>
          <div class="target-rows">
            <div
              v-for="(target, idx) in autoAwakenTargets"
              :key="idx"
              class="target-row"
              :class="{ 'target-met': isAutoAwakening && autoAwakenSlotMet[idx] }"
            >
              <span class="target-label">唤醒{{ idx + 1 }}</span>
              <select
                v-model="target.parameter"
                class="target-select param-select"
                :class="blessingThemeClass"
                :disabled="isAutoAwakening"
                @change="onTargetParamChange(idx)"
              >
                <option value="">选择属性</option>
                <option
                  v-for="param in allParamOptions"
                  :key="param.id"
                  :value="param.id"
                >
                  {{ param.name }} ({{ param.min }}~{{ param.max }}{{ param.isRate ? '%' : '' }})
                </option>
              </select>
              <select
                v-model="target.value"
                class="target-select value-select"
                :class="blessingThemeClass"
                :disabled="!target.parameter || isAutoAwakening"
              >
                <option value="">选择值</option>
                <option
                  v-for="v in getTargetValueOptions(idx)"
                  :key="v"
                  :value="v"
                >
                  {{ v }}{{ getParamIsRate(target.parameter) ? '%' : '' }}
                </option>
              </select>
              <!-- 女神祝福期望值提示 -->
              <span
                v-if="isGoddessBlessing && target.value"
                class="expected-value-tag"
              >
                →{{ getExpectedAwakenedValue(Number(target.value)) }}{{ getParamIsRate(target.parameter) ? '%' : '' }}
              </span>
              <!-- 达标徽章 -->
              <span
                v-if="isAutoAwakening && autoAwakenSlotMet[idx]"
                class="target-met-badge"
              >✓</span>
            </div>
          </div>
        </div>

        <!-- 6. 操作按钮区域 -->
        <div class="awakening-actions">
          <button
            class="action-btn auto-btn"
            :class="{ 'stop-btn': isAutoAwakening }"
            :disabled="!canAutoAwaken || (isAwakening && !isAutoAwakening)"
            @click="handleAutoAwaken"
          >
            {{ isAutoAwakening ? '⏹ 停止' : '🔄 自动唤醒' }}
          </button>
          <button
            class="action-btn awaken-btn"
            :disabled="!canAwaken || isAwakening"
            @click="handleAwaken"
          >
            {{ isAwakening ? '✦ 唤醒中...' : '✦ 唤醒' }}
          </button>
        </div>

        <!-- 自动唤醒二次确认面板 -->
        <transition name="confirm-fade">
          <div v-if="showAutoAwakenConfirm" class="confirm-overlay">
            <div class="confirm-panel" :class="blessingThemeClass">
              <div class="confirm-header">
                <span class="confirm-icon">⚠</span>
                <span class="confirm-title-text">确认自动唤醒</span>
              </div>
              <div class="confirm-body">
                <div class="confirm-info-row">
                  <span class="confirm-info-label">祝福类型:</span>
                  <span class="confirm-info-value">{{ selectedBlessingType === 'goddess' ? '女神的祝福 (+20%)' : '恶魔的祝福' }}</span>
                </div>
                <div class="confirm-info-row">
                  <span class="confirm-info-label">可用卷轴:</span>
                  <span class="confirm-info-value">{{ itemsStore.getItemCount(selectedScrollId) }} 张</span>
                </div>
                <div class="confirm-targets">
                  <div
                    v-for="(target, idx) in autoAwakenTargets"
                    :key="`confirm-${idx}`"
                    class="confirm-target-row"
                  >
                    <span class="confirm-target-label">唤醒{{ idx + 1 }}:</span>
                    <span class="confirm-target-name">{{ getTargetParamName(target.parameter) }}</span>
                    <span class="confirm-target-value">
                      {{ target.value }}{{ getParamIsRate(target.parameter) ? '%' : '' }}
                    </span>
                    <span v-if="isGoddessBlessing" class="confirm-target-expected">
                      → {{ getExpectedAwakenedValue(Number(target.value)) }}{{ getParamIsRate(target.parameter) ? '%' : '' }}
                    </span>
                  </div>
                </div>
                <div class="confirm-warning">
                  达标的槽位将自动锁定，未达标的继续唤醒<br>
                  所有目标达成后自动停止
                </div>
              </div>
              <div class="confirm-actions">
                <button class="confirm-btn cancel-btn" @click="showAutoAwakenConfirm = false">取消</button>
                <button class="confirm-btn ok-btn" :class="blessingThemeClass" @click="confirmAutoAwaken">确认唤醒</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>

  <!-- 唤醒数据与概率面板 -->
  <Teleport to="body">
    <transition name="panel-slide">
      <div
        v-if="visible && showInfoPanel"
        class="info-panel"
        :class="blessingThemeClass"
        :style="infoPanelStyle"
      >
        <div class="info-header">
          <span class="info-title-icon">📖</span>
          <span class="info-title-text">唤醒数据与概率</span>
        </div>
        <div class="info-content">
          <!-- 属性组列表 -->
          <div
            v-for="(group, gIdx) in awakeningParamGroups"
            :key="gIdx"
            class="info-group"
          >
            <div class="info-group-title">
              <span class="info-group-marker"></span>
              {{ infoGroupLabels[gIdx] }}
              <span class="info-group-range">
                ({{ group[0].min }}~{{ group[0].max }}{{ group[0].isRate ? '%' : '' }})
              </span>
            </div>
            <div class="info-params">
              <div
                v-for="param in group"
                :key="param.id"
                class="info-param"
              >
                <div class="info-param-header">
                  <span class="info-param-name">{{ param.name }}</span>
                  <span class="info-param-range">
                    {{ param.min }} ~ {{ param.max }}{{ param.isRate ? '%' : '' }}
                  </span>
                </div>
                <!-- 概率列表 -->
                <div class="info-param-probs">
                  <div
                    v-for="prob in param.probabilities"
                    :key="prob.value"
                    class="prob-bar-item"
                  >
                    <div class="prob-bar-track">
                      <div
                        class="prob-bar-fill"
                        :style="{ width: Math.max(3, prob.percent) + '%' }"
                      ></div>
                    </div>
                    <span class="prob-bar-value">{{ prob.value }}{{ param.isRate ? '%' : '' }}</span>
                    <span class="prob-bar-percent">{{ prob.percent }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 规则说明 -->
          <div class="info-rules">
            <div class="info-rule">⚠ 值越大，出现概率越低</div>
            <div class="info-rule">🔒 锁定后唤醒不会修改该属性</div>
            <div class="info-rule">★ 达到最大值显示「极限」</div>
            <div v-if="isGoddessBlessing" class="info-rule goddess-rule">✨ 女神的祝福：属性效果整体 +{{ GODDESS_BONUS_TEXT.replace('+', '') }}</div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- 时装选择弹出面板 -->
  <Teleport to="body">
    <transition name="panel-fade">
      <div
        v-if="showFashionPanel && fashionItems.length > 0"
        ref="fashionPanelRef"
        class="popup-panel"
        :style="fashionPanelStyle"
      >
        <div class="popup-header">
          <span>选择时装物品</span>
        </div>
        <div class="popup-items">
          <div
            v-for="item in fashionItems"
            :key="item.uniqueId || item.id"
            class="popup-item"
            :class="{ selected: selectedFashionId === (item.uniqueId || item.id) }"
            @click="selectFashion(item)"
            @mouseenter="showItemTooltip(item, $event)"
            @mouseleave="hideItemTooltip"
            @mousemove="moveItemTooltip($event)"
          >
            <img class="popup-icon" :src="item.icon" @error="handleIconError" />
            <div class="popup-info">
              <div class="popup-name">{{ getFashionDisplayName(item) }}</div>
              <div class="popup-level">{{ getFashionSubcategoryLabel(item.subcategory) }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- 神圣之光/邪恶之光动画（面板上部外侧） -->
  <Teleport to="body">
    <transition name="light-fade">
      <div
        v-if="lightEffect"
        class="light-effect-overlay"
        :class="`light-${lightEffect}`"
        :style="lightEffectStyle"
      >
        <!-- 光柱主体 -->
        <div class="light-pillar"></div>
        <!-- 光环扩散 -->
        <div class="light-ring r1"></div>
        <div class="light-ring r2"></div>
        <!-- 放射光线 -->
        <div class="light-rays">
          <span
            v-for="i in 12"
            :key="`ray-${i}`"
            class="light-ray"
            :style="{ '--ray-angle': `${30 * i}deg` }"
          ></span>
        </div>
        <!-- 飘升粒子 -->
        <div class="light-particles">
          <span
            v-for="i in 16"
            :key="`lp-${i}`"
            class="light-particle"
            :style="getLightParticleStyle(i)"
          ></span>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
/**
 * @fileoverview Blessing Awakening 祝福唤醒面板组件
 * @description 使用女神的祝福(ID:7064)/恶魔祝福(ID:27754)唤醒时装物品的面板
 *               最多 3 条属性，每条属性支持锁定/解锁，锁定后唤醒不会修改该条属性
 * @author FLYFF Team
 * @version 2.1.0
 * @created 2026-07-16
 * @updated 2026-07-16 修复女神祝福增幅四舍五入问题;新增唤醒次数显示;写入英文名称和唤醒次数到时装道具数据;新增时装选择区域鼠标悬停显示物品详情面板
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { storageService } from '@/services/StorageService'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'
import {
  useBlessingAwakening,
  MAX_BLESSING_ATTRIBUTES,
  getBlessingTypeName,
  getBlessingTypeNameEn,
  GODDESS_BONUS_MULTIPLIER
} from '@/composables/useBlessingAwakening'

/**
 * 时装子分类中文映射
 */
const FASHION_SUBCATEGORY_LABELS = {
  hat: '时装帽子',
  cloth: '时装衣服',
  shoes: '时装鞋子',
  glove: '时装手套',
  mask: '面具',
  cloak: '披风',
  visualcloak: '披风'
}

/**
 * 唤醒属性组标签（对应 useBlessingAwakening 中的三组属性池）
 */
const infoGroupLabels = ['基础属性', '战斗属性', '百分比属性']

/** 最大属性条数（与 composable 保持一致） */
const MAX_ATTRS = MAX_BLESSING_ATTRIBUTES

// Props 定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits 定义
const emit = defineEmits(['close', 'play-sfx', 'add-battle-log', 'show-animation-message'])

// Store
const itemsStore = useItemsStore()
const gameStore = useGameStore()

// 祝福唤醒组合式函数
const {
  performBlessingAwakening,
  getFashionBlessingData,
  getAvailableAwakeningParams: getAwakeningParams
} = useBlessingAwakening()

// DOM 引用
const modalRef = ref(null)
const selectFashionBoxRef = ref(null)
const fashionPanelRef = ref(null)

// 选择状态
const selectedScrollId = ref(null)
const selectedFashionId = ref(null)
const showFashionPanel = ref(false)
const fashionPanelStyle = ref({})

// 操作状态
const isAwakening = ref(false)
const isAutoAwakening = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 进度条状态
const progressPercent = ref(0)
let progressTimer = null

// 停止自动唤醒标志
const shouldStopAutoAwaken = ref(false)

// 自动唤醒二次确认面板
const showAutoAwakenConfirm = ref(false)

// 自动唤醒各槽位达标状态（运行时跟踪）
const autoAwakenSlotMet = reactive([false, false, false])

// 拖拽状态
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const modalPosition = ref({ x: 0, y: 0 })

// 唤醒光效/变化闪烁状态
const showAwakeningFlash = ref(false)
const showChangeFlash = ref(false)
const changedSlotIndices = ref([])

// 锁定状态（独立管理，避免直接修改 store 数据）
const lockStates = reactive([false, false, false])

// 自动唤醒目标设置（3条目标属性：类型 + 值）
const autoAwakenTargets = reactive([
  { parameter: '', value: '' },
  { parameter: '', value: '' },
  { parameter: '', value: '' }
])

// 概率信息面板显示状态
const showInfoPanel = ref(false)

// 光效动画状态 ('goddess' | 'demon' | null)
const lightEffect = ref(null)
let lightEffectTimer = null

/** 女神的祝福加成倍率显示文本 */
const GODDESS_BONUS_TEXT = `+${Math.round((GODDESS_BONUS_MULTIPLIER - 1) * 100)}%`

// ========== 计算属性 ==========

/**
 * 当前选中的祝福类型
 */
const selectedBlessingType = computed(() => {
  if (!selectedScrollId.value) return null
  return selectedScrollId.value === 7064 ? 'goddess' : 'demon'
})

/**
 * 面板主题样式类
 */
const blessingThemeClass = computed(() => {
  if (selectedBlessingType.value === 'goddess') return 'theme-goddess'
  if (selectedBlessingType.value === 'demon') return 'theme-demon'
  return ''
})

/**
 * 女神祝福卷轴数量
 */
const goddessScrollCount = computed(() => {
  return itemsStore.getItemCount(7064)
})

/**
 * 恶魔祝福卷轴数量
 */
const demonScrollCount = computed(() => {
  return itemsStore.getItemCount(27754)
})

/**
 * 背包中的时装物品列表
 */
const fashionItems = computed(() => {
  return itemsStore.playerBag.filter(item => {
    const config = itemsStore.getItemConfig(item.id)
    if (!config) return false
    return config.category === 'fashion'
  }).map(item => ({
    ...item,
    icon: item.icon || `/pt/item_icon/${item.id}.png`
  }))
})

/**
 * 选中的时装物品
 */
const selectedFashion = computed(() => {
  if (!selectedFashionId.value) return null
  return itemsStore.playerBag.find(item => {
    const uid = item.uniqueId || item.id
    return uid === selectedFashionId.value
  }) || null
})

/**
 * 当前时装的祝福唤醒数据
 */
const currentBlessingData = computed(() => {
  if (!selectedFashion.value) return null
  return getFashionBlessingData(selectedFashion.value)
})

/**
 * 当前时装的累计唤醒次数
 */
const currentAwakenCount = computed(() => {
  return currentBlessingData.value?.awakenCount || 0
})

/**
 * 展示用的属性数组（固定 3 个槽位，不足的显示空槽）
 */
const displayAttributes = computed(() => {
  const attrs = currentBlessingData.value?.attributes || []
  const result = []
  for (let i = 0; i < MAX_ATTRS; i++) {
    if (i < attrs.length) {
      // 合并 lockStates 中的锁定状态
      result.push({ ...attrs[i], locked: lockStates[i] ?? attrs[i].locked ?? false })
    } else {
      result.push(null)
    }
  }
  return result
})

/**
 * 判断当前是否为女神的祝福
 */
const isGoddessBlessing = computed(() => selectedBlessingType.value === 'goddess')

/**
 * 判断是否可以唤醒
 */
const canAwaken = computed(() => {
  if (!selectedScrollId.value) return false
  if (!selectedFashion.value) return false
  if (isAwakening.value) return false
  const count = itemsStore.getItemCount(selectedScrollId.value)
  return count > 0
})

/**
 * 判断是否可以自动唤醒
 * 需满足：已选卷轴、已选时装、不在手动唤醒中、目标已完整设置
 * 自动唤醒进行中时允许点击（用于停止）
 */
const canAutoAwaken = computed(() => {
  if (!selectedScrollId.value) return false
  if (!selectedFashion.value) return false
  if (isAutoAwakening.value) return true
  if (isAwakening.value) return false
  if (!isAutoAwakenTargetComplete.value) return false
  return itemsStore.getItemCount(selectedScrollId.value) > 0
})

/**
 * 计算面板样式（基于拖拽位置）
 */
const modalStyle = computed(() => ({
  left: `${modalPosition.value.x}px`,
  top: `${modalPosition.value.y}px`
}))

/**
 * 概率信息面板定位样式（紧贴祝福面板右侧外部，随拖拽移动）
 * 如果右侧空间不足则自动切换到左侧
 */
const infoPanelStyle = computed(() => {
  const modalWidth = 420
  const gap = 8
  const infoPanelWidth = 280
  const rightEdge = modalPosition.value.x + modalWidth + gap + infoPanelWidth

  if (rightEdge > window.innerWidth) {
    // 右侧空间不足，切换到左侧
    return {
      position: 'fixed',
      left: `${Math.max(0, modalPosition.value.x - infoPanelWidth - gap)}px`,
      top: `${modalPosition.value.y}px`,
      zIndex: 9998
    }
  }

  return {
    position: 'fixed',
    left: `${modalPosition.value.x + modalWidth + gap}px`,
    top: `${modalPosition.value.y}px`,
    zIndex: 9998
  }
})

/**
 * 唤醒属性分组数据（用于概率面板展示）
 */
const awakeningParamGroups = computed(() => {
  return getAwakeningParams()
})

/**
 * 属性参数到最大值的映射表
 */
const paramMaxLookup = computed(() => {
  const lookup = {}
  for (const group of awakeningParamGroups.value) {
    for (const param of group) {
      lookup[param.id] = param.max
    }
  }
  return lookup
})

/**
 * 所有可唤醒属性的扁平列表（用于下拉选项）
 * 包含 id, name, min, max, isRate 字段
 */
const allParamOptions = computed(() => {
  return awakeningParamGroups.value.flat()
})

/**
 * 判断自动唤醒目标是否已完整设置（3条均选择了属性类型和值）
 * @returns {boolean} 是否完整
 */
const isAutoAwakenTargetComplete = computed(() => {
  return autoAwakenTargets.every(t => t.parameter && t.value !== '' && t.value !== null)
})

/**
 * 获取指定目标槽位的可选值列表（原始值，不含女神加成）
 * @param {number} idx - 目标槽位索引 (0-2)
 * @returns {number[]} 可选值数组
 */
const getTargetValueOptions = (idx) => {
  const target = autoAwakenTargets[idx]
  if (!target.parameter) return []
  const param = allParamOptions.value.find(p => p.id === target.parameter)
  if (!param) return []
  const options = []
  for (let v = param.min; v <= param.max; v++) {
    options.push(v)
  }
  return options
}

/**
 * 计算目标值在当前祝福类型下的实际唤醒期望值
 * 女神的祝福时，目标值经过 1.2 倍加成（保留一位小数）
 * @param {number} targetValue - 用户选择的目标原始值
 * @returns {number} 实际唤醒后的期望值
 */
const getExpectedAwakenedValue = (targetValue) => {
  if (isGoddessBlessing.value) {
    return Math.round(targetValue * GODDESS_BONUS_MULTIPLIER * 10) / 10
  }
  return targetValue
}

/**
 * 获取目标参数的中文显示名称
 * @param {string} paramId - 参数英文 key
 * @returns {string} 中文名称
 */
const getTargetParamName = (paramId) => {
  if (!paramId) return '未选择'
  const param = allParamOptions.value.find(p => p.id === paramId)
  return param?.name || paramId
}

/**
 * 检查指定槽位是否满足对应的自动唤醒目标
 * 匹配规则：槽位 i 对应目标 i，比较参数类型和实际唤醒值（含女神加成）
 * @param {number} slotIndex - 槽位索引 (0-2)
 * @param {Array<Object>} attributes - 唤醒后的属性数组
 * @returns {boolean} 是否满足目标
 */
const checkSlotTargetMet = (slotIndex, attributes) => {
  const target = autoAwakenTargets[slotIndex]
  if (!target.parameter || target.value === '') return false
  const attr = attributes[slotIndex]
  if (!attr) return false
  if (attr.parameter !== target.parameter) return false
  const targetValue = Number(target.value)
  const expectedValue = getExpectedAwakenedValue(targetValue)
  return attr.value === expectedValue
}

/**
 * 获取参数是否为百分比类型
 * @param {string} paramId - 参数英文 key
 * @returns {boolean} 是否为百分比属性
 */
const getParamIsRate = (paramId) => {
  if (!paramId) return false
  const param = allParamOptions.value.find(p => p.id === paramId)
  return param?.isRate || false
}

/**
 * 当目标属性类型改变时，重置该槽位的值
 * @param {number} idx - 目标槽位索引 (0-2)
 */
const onTargetParamChange = (idx) => {
  autoAwakenTargets[idx].value = ''
}

/**
 * 重置所有自动唤醒目标
 */
const resetAutoAwakenTargets = () => {
  for (let i = 0; i < autoAwakenTargets.length; i++) {
    autoAwakenTargets[i].parameter = ''
    autoAwakenTargets[i].value = ''
  }
}


/**
 * 判断属性值是否已达到该参数的最大值
 * 女神祝福属性的有效上限提升20%（与加成倍率一致）
 * @param {Object} attr - 属性对象 { parameter, value, isGoddessBonus, ... }
 * @returns {boolean} 是否为极限值
 */
const isMaxValue = (attr) => {
  if (!attr) return false
  const maxVal = paramMaxLookup.value[attr.parameter]
  if (maxVal === undefined) return false
  // 女神祝福的属性上限同步提升20%（保留一位小数，不四舍五入到整数）
  const effectiveMax = attr.isGoddessBonus
    ? Math.round(maxVal * GODDESS_BONUS_MULTIPLIER * 10) / 10
    : maxVal
  return attr.value >= effectiveMax
}

/**
 * 切换概率信息面板的显示/隐藏
 */
const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value
}

// ========== 初始化与拖拽 ==========

/**
 * 初始化面板位置（居中显示）
 */
const initPosition = () => {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const modalWidth = 420
  const modalHeight = 560
  modalPosition.value = {
    x: Math.max(0, (windowWidth - modalWidth) / 2),
    y: Math.max(0, (windowHeight - modalHeight) / 2)
  }
}

/**
 * 开始拖拽
 */
const startDrag = e => {
  if (e.button !== 0) return
  isDragging.value = true
  const rect = modalRef.value.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  e.preventDefault()
}

/**
 * 拖拽移动
 */
const onDrag = e => {
  if (!isDragging.value) return
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const modalWidth = 420
  const modalHeight = 560

  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y

  newX = Math.max(0, Math.min(newX, windowWidth - modalWidth))
  newY = Math.max(0, Math.min(newY, windowHeight - modalHeight))

  modalPosition.value = { x: newX, y: newY }
}

/**
 * 结束拖拽
 */
const endDrag = () => {
  isDragging.value = false
}

// ========== 辅助函数 ==========

/**
 * 显示物品详情提示框（与 Bag.vue 使用相同的全局事件机制）
 * @param {Object} item - 物品对象
 * @param {MouseEvent} event - 鼠标事件
 */
const showItemTooltip = (item, event) => {
  if (!item) return
  window.dispatchEvent(new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: { x: event.clientX, y: event.clientY }
    }
  }))
}

/**
 * 隐藏物品详情提示框
 */
const hideItemTooltip = () => {
  window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
}

/**
 * 移动物品详情提示框位置
 * @param {MouseEvent} event - 鼠标事件
 */
const moveItemTooltip = (event) => {
  window.dispatchEvent(new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  }))
}

/**
 * 获取时装显示名称
 */
const getFashionDisplayName = item => {
  if (!item) return '未知物品'
  const itemConfig = ITEM_INFO[item.id]
  if (itemConfig && itemConfig.name) {
    return itemConfig.name.cns || itemConfig.name.en || `物品ID: ${item.id}`
  }
  return item.name || `物品ID: ${item.id}`
}

/**
 * 获取时装子分类中文标签
 */
const getFashionSubcategoryLabel = subcategory => {
  return FASHION_SUBCATEGORY_LABELS[subcategory] || subcategory || '时装'
}

/**
 * 获取祝福类型中文标签
 */
const getBlessingTypeLabel = type => {
  return getBlessingTypeName(type)
}

/**
 * 处理图片加载错误
 */
const handleIconError = event => {
  const img = event.target
  if (img) {
    img.src = '/pt/item_icon/1.png'
  }
}

/**
 * 生成粒子样式
 */
const getParticleStyle = () => {
  const size = 2 + Math.random() * 4
  const left = Math.random() * 100
  const duration = 3 + Math.random() * 4
  const delay = Math.random() * 5
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

// ========== 选择操作 ==========

/**
 * 光效动画定位样式（面板上部外侧）
 */
const lightEffectStyle = computed(() => ({
  position: 'fixed',
  left: `${modalPosition.value.x}px`,
  top: `${modalPosition.value.y - 180}px`,
  width: '420px',
  height: '180px',
  zIndex: 9997,
  pointerEvents: 'none'
}))

/**
 * 触发光效动画
 * @param {string} type - 祝福类型 ('goddess' | 'demon')
 */
const triggerLightEffect = (type) => {
  // 清除上一次的定时器
  if (lightEffectTimer) {
    clearTimeout(lightEffectTimer)
  }
  lightEffect.value = type
  // 动画持续 2s 后自动关闭
  lightEffectTimer = setTimeout(() => {
    lightEffect.value = null
    lightEffectTimer = null
  }, 2000)
}

/**
 * 光效飘升粒子样式计算
 * @param {number} index - 粒子索引
 * @returns {Object} CSS样式对象
 */
const getLightParticleStyle = (index) => {
  const left = 10 + Math.random() * 80
  const size = 3 + Math.random() * 5
  const duration = 1.2 + Math.random() * 0.8
  const delay = Math.random() * 0.4
  const drift = -20 + Math.random() * 40
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    '--drift': `${drift}px`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

/**
 * 选择祝福区域（点击女神/恶魔区域自动选中对应卷轴）
 */
const selectBlessingZone = (scrollId) => {
  const count = itemsStore.getItemCount(scrollId)
  if (count === 0) {
    errorMessage.value = `背包中没有${getBlessingTypeLabel(scrollId === 7064 ? 'goddess' : 'demon')}`
    setTimeout(() => { if (errorMessage.value.includes('背包中没有')) errorMessage.value = '' }, 2000)
    return
  }
const newType = scrollId === 7064 ? 'goddess' : 'demon'
// 仅在切换祝福类型时触发光效动画
if (selectedBlessingType.value !== newType) {
  triggerLightEffect(newType)
}
  selectedScrollId.value = scrollId
  awakeningResult.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

/**
 * 切换时装选择面板
 */
const toggleFashionPanel = async () => {
if (fashionItems.value.length === 0) return
showFashionPanel.value = !showFashionPanel.value
if (showFashionPanel.value) {
await nextTick()
updateFashionPanelPosition()
} else {
// 关闭时装选择面板时隐藏物品详情提示
hideItemTooltip()
}
}

/**
 * 更新时装面板位置
 */
const updateFashionPanelPosition = () => {
  if (!selectFashionBoxRef.value) return
  const rect = selectFashionBoxRef.value.getBoundingClientRect()
  fashionPanelStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 5}px`,
    left: `${rect.left}px`,
    zIndex: 10000
  }
}

/**
 * 选择时装
 */
const selectFashion = item => {
selectedFashionId.value = item.uniqueId || item.id
showFashionPanel.value = false
// 选择时装后关闭物品详情提示
hideItemTooltip()
errorMessage.value = ''
  successMessage.value = ''
  // 重置锁定状态，从已有数据中读取
  const blessed = getFashionBlessingData(item)
  if (blessed?.attributes) {
    for (let i = 0; i < MAX_ATTRS; i++) {
      lockStates[i] = blessed.attributes[i]?.locked ?? false
    }
  } else {
    lockStates[0] = false
    lockStates[1] = false
    lockStates[2] = false
  }
}

/**
 * 切换指定槽位的锁定状态
 */
const toggleLock = (idx) => {
  lockStates[idx] = !lockStates[idx]
  // 同步到时装数据
  if (selectedFashion.value?.blessedData?.attributes?.[idx]) {
    selectedFashion.value.blessedData.attributes[idx].locked = lockStates[idx]
  }
}

// ========== 唤醒逻辑 ==========

/**
 * 唤醒结果（最新一次）
 */
const awakeningResult = ref(null)

/**
 * 等待进度条完成（1秒）
 * @returns {Promise<void>}
 */
const waitForProgress = () => {
  return new Promise(resolve => {
    progressPercent.value = 0
    const duration = 1000
    let startTime = null

    const animate = timestamp => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(100, (elapsed / duration) * 100)
      progressPercent.value = Math.round(progress)

      if (progress < 100) {
        progressTimer = requestAnimationFrame(animate)
      } else {
        progressTimer = null
        resolve()
      }
    }

    progressTimer = requestAnimationFrame(animate)
  })
}

/**
 * 更新背包数据并持久化
 */
const saveBagData = () => {
  gameStore.player.bag = [...itemsStore.playerBag]
  storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
}

/**
 * 触发唤醒光效动画
 */
const triggerFlashAnimation = () => {
  showAwakeningFlash.value = true
  showChangeFlash.value = true
  setTimeout(() => {
    showAwakeningFlash.value = false
  }, 1200)
  setTimeout(() => {
    showChangeFlash.value = false
  }, 800)
}

/**
 * 执行单次唤醒操作
 * @returns {Object} 唤醒结果
 */
const executeAwakening = () => {
  // 收集当前锁定状态
  const currentLockStates = displayAttributes.value.map(attr => attr?.locked ?? false)

  const result = performBlessingAwakening(
    selectedFashion.value,
    selectedScrollId.value,
    currentLockStates
  )

  if (result.success) {
    // 移除一张祝福卷轴
    itemsStore.removeItemFromBag(selectedScrollId.value, 1)

    // 更新时装物品的祝福数据
    const fashionIndex = itemsStore.playerBag.findIndex(item => {
      const uid = item.uniqueId || item.id
      return uid === selectedFashionId.value
    })

    if (fashionIndex !== -1) {
      itemsStore.playerBag[fashionIndex].blessedData = {
        blessingType: result.blessingType,
        blessingTypeNameEn: result.blessingTypeNameEn,
        attributes: result.attributes,
        awakenCount: result.awakenCount
      }
    }

    // 记录变化的槽位索引
    changedSlotIndices.value = result.changedIndices || []
    awakeningResult.value = result

    // 触发光效
    triggerFlashAnimation()

    const fashionName = getFashionDisplayName(selectedFashion.value)
    const blessingName = getBlessingTypeLabel(result.blessingType)

    // 构建属性变化日志
    const changedAttrs = result.attributes
      .filter((_, i) => result.changedIndices.includes(i))
      .map(a => `${a.parameterName} +${a.value}${a.isRate ? '%' : ''}`)
      .join(', ')

    if (changedAttrs) {
      emit('play-sfx', 'InfUpgradeSuccess.wav')
      emit('add-battle-log', `${fashionName} ${blessingName} 唤醒: ${changedAttrs}`, 'success')
      emit('show-animation-message', changedAttrs, 'upgrade-success', selectedFashion.value.icon)
    } else {
      emit('add-battle-log', `${fashionName} ${blessingName} 唤醒: 属性未发生变化`, 'info')
    }
  }

  return result
}

/**
 * 执行唤醒操作
 */
const handleAwaken = async () => {
  if (!canAwaken.value || isAwakening.value) return

  isAwakening.value = true
  errorMessage.value = ''
  successMessage.value = ''
  awakeningResult.value = null
  changedSlotIndices.value = []

  try {
    await waitForProgress()

    const result = executeAwakening()

    if (!result.success) {
      errorMessage.value = result.message || '唤醒失败'
    } else {
      successMessage.value = '唤醒成功！'
    }

    saveBagData()
  } catch (error) {
    console.error('[BlessingAwakening] 唤醒失败:', error)
    errorMessage.value = '唤醒失败，请重试'
  } finally {
    isAwakening.value = false
    progressPercent.value = 0
  }
}

/**
 * 点击自动唤醒按钮 —— 显示二次确认面板
 * 如果自动唤醒进行中，则停止
 */
const handleAutoAwaken = () => {
  if (isAutoAwakening.value) {
    shouldStopAutoAwaken.value = true
    return
  }
  if (!canAutoAwaken.value || isAwakening.value) return
  // 显示二次确认面板
  showAutoAwakenConfirm.value = true
}

/**
 * 确认自动唤醒 —— 开始执行槽位匹配模式自动唤醒
 * 规则：
 * - 唤醒1/2/3 分别对应槽位 0/1/2
 * - 某槽位达标后自动锁定，不再重新随机
 * - 所有槽位达标后停止；卷轴用完或手动停止也会终止
 */
const confirmAutoAwaken = async () => {
  showAutoAwakenConfirm.value = false

  isAutoAwakening.value = true
  isAwakening.value = true
  shouldStopAutoAwaken.value = false
  errorMessage.value = ''
  successMessage.value = ''

  // 重置槽位达标状态
  autoAwakenSlotMet[0] = false
  autoAwakenSlotMet[1] = false
  autoAwakenSlotMet[2] = false

  // 解锁所有槽位，自动唤醒接管锁定控制
  for (let i = 0; i < MAX_ATTRS; i++) {
    lockStates[i] = false
  }

  let targetMetCount = 0

  // 先检查当前已有属性是否已满足目标（无需消耗卷轴）
  const existingAttrs = currentBlessingData.value?.attributes || []
  for (let i = 0; i < MAX_ATTRS && i < existingAttrs.length; i++) {
    if (checkSlotTargetMet(i, existingAttrs)) {
      autoAwakenSlotMet[i] = true
      targetMetCount++
      lockStates[i] = true
    }
  }

  // 如果当前属性已全部满足目标，直接结束
  if (targetMetCount === MAX_ATTRS) {
    successMessage.value = '当前属性已满足所有目标！'
    saveBagData()
    isAwakening.value = false
    isAutoAwakening.value = false
    return
  }

  try {
    let currentScrollCount = itemsStore.getItemCount(selectedScrollId.value)
    let attempts = 0
    const maxAttempts = currentScrollCount

    while (attempts < maxAttempts && currentScrollCount > 0 && !shouldStopAutoAwaken.value) {
      // 全部达标则停止
      if (targetMetCount === MAX_ATTRS) break

      await waitForProgress()

      if (shouldStopAutoAwaken.value) break

      const result = executeAwakening()

      if (result.success) {
        currentScrollCount--
        attempts++
        saveBagData()

        // 逐槽位检查是否达标
        for (let i = 0; i < MAX_ATTRS; i++) {
          if (!autoAwakenSlotMet[i] && checkSlotTargetMet(i, result.attributes)) {
            autoAwakenSlotMet[i] = true
            targetMetCount++
            // 锁定该槽位，后续唤醒不再重新随机
            lockStates[i] = true
          }
        }

        // 全部达标则停止
        if (targetMetCount === MAX_ATTRS) {
          successMessage.value = '已达到所有目标属性！自动唤醒停止'
          saveBagData()
          break
        }

        // 短暂延迟后继续
        await new Promise(r => setTimeout(r, 300))
      } else {
        errorMessage.value = result.message || '唤醒失败'
        break
      }
    }

    saveBagData()

    if (targetMetCount === MAX_ATTRS) {
      emit('play-sfx', 'InfUpgradeSuccess.wav')
      emit('add-battle-log', `自动唤醒达到所有目标！使用 ${attempts} 张卷轴`, 'success')
    } else if (shouldStopAutoAwaken.value) {
      emit('add-battle-log', `自动唤醒已停止，使用 ${attempts} 张卷轴，达成 ${targetMetCount}/${MAX_ATTRS} 目标`, 'info')
    } else {
      emit('play-sfx', 'InfUpgradeSuccess.wav')
      emit('add-battle-log', `自动唤醒完成，使用 ${attempts} 张卷轴，达成 ${targetMetCount}/${MAX_ATTRS} 目标`, 'info')
      errorMessage.value = `卷轴已用完，达成 ${targetMetCount}/${MAX_ATTRS} 目标`
    }
  } catch (error) {
    console.error('[BlessingAwakening] 自动唤醒失败:', error)
    errorMessage.value = '自动唤醒失败，请重试'
  } finally {
    isAwakening.value = false
    isAutoAwakening.value = false
    shouldStopAutoAwaken.value = false
    progressPercent.value = 0
  }
}

/**
 * 关闭面板
 */
const handleClose = () => {
// 关闭面板前隐藏物品详情提示
hideItemTooltip()
emit('close')
}

/**
 * 点击外部关闭弹出面板
 */
const handleClickOutside = e => {
  if (showFashionPanel.value) {
    const isClickInsideBox = selectFashionBoxRef.value?.contains(e.target)
    const isClickInsidePanel = fashionPanelRef.value?.contains(e.target)
    if (!isClickInsideBox && !isClickInsidePanel) {
      showFashionPanel.value = false
      hideItemTooltip()
    }
  }
}

// ========== 生命周期 ==========

// 监听 visible 变化，初始化位置
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initPosition()
    // 自动选中第一个有库存的卷轴
    if (!selectedScrollId.value) {
      if (goddessScrollCount.value > 0) {
        selectedScrollId.value = 7064
      } else if (demonScrollCount.value > 0) {
        selectedScrollId.value = 27754
      }
    }
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  if (props.visible) {
    initPosition()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  if (progressTimer) {
    cancelAnimationFrame(progressTimer)
    progressTimer = null
  }
if (lightEffectTimer) {
clearTimeout(lightEffectTimer)
lightEffectTimer = null
}
// 组件卸载时关闭可能残留的物品详情提示
hideItemTooltip()
})
</script>

<style scoped>
/* ==================== 面板主体 ==================== */
.blessing-awakening-modal {
  position: fixed;
  width: 420px;
  max-height: 560px;
  background: rgba(15, 15, 30, 0.97);
  border: 1px solid #3a3a5a;
  border-radius: 10px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  transition: border-color 0.4s, box-shadow 0.4s;
}

/* 女神主题 */
.theme-goddess {
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 4px 30px rgba(255, 200, 50, 0.15), 0 0 20px rgba(255, 215, 0, 0.1);
}

/* 恶魔主题 */
.theme-demon {
  border-color: rgba(180, 50, 220, 0.4);
  box-shadow: 0 4px 30px rgba(160, 40, 200, 0.15), 0 0 20px rgba(180, 50, 220, 0.1);
}

/* ==================== 粒子背景 ==================== */
.particle-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  bottom: -10px;
  border-radius: 50%;
  background: rgba(255, 215, 0, 0.6);
  animation: particle-rise linear infinite;
}

.theme-demon .particle {
  background: rgba(180, 80, 220, 0.6);
}

@keyframes particle-rise {
  0% {
    bottom: -10px;
    opacity: 0;
    transform: translateX(0) scale(1);
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    bottom: 100%;
    opacity: 0;
    transform: translateX(20px) scale(0.5);
  }
}

/* ==================== 头部 ==================== */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid #2a2a4a;
  cursor: move;
  user-select: none;
  position: relative;
  z-index: 1;
}

.modal-title {
  font-size: 14px;
  margin: 0;
  flex: 1;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.title-icon {
  font-size: 16px;
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.title-en {
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.theme-goddess .title-en {
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
}

.theme-demon .title-en {
  color: #cc66ff;
  text-shadow: 0 0 12px rgba(180, 80, 220, 0.6);
}

.title-cn {
  font-size: 12px;
  color: #888;
}

/* ==================== 头部按钮组 ==================== */
.header-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-button {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #4a4a6a;
  background: rgba(40, 40, 60, 0.8);
  color: #aaa;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.info-button:hover {
  border-color: #ffd700;
  color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.info-button.active {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.15);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
}

.theme-demon .info-button:hover,
.theme-demon .info-button.active {
  border-color: #cc66ff;
  color: #cc66ff;
  box-shadow: 0 0 8px rgba(180, 50, 220, 0.3);
}

.theme-demon .info-button.active {
  background: rgba(180, 50, 220, 0.15);
  box-shadow: 0 0 10px rgba(180, 50, 220, 0.4);
}

.close-button {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #fff;
}

/* ==================== 内容区域 ==================== */
.modal-content {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* ==================== 祝福区域 ==================== */
.blessing-zones {
  display: flex;
  align-items: stretch;
  gap: 6px;
}

.blessing-zone {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.blessing-zone.goddess {
  background: linear-gradient(135deg, rgba(255, 200, 50, 0.08), rgba(255, 180, 30, 0.03));
  border-color: rgba(255, 200, 50, 0.15);
}

.blessing-zone.goddess:hover {
  background: linear-gradient(135deg, rgba(255, 200, 50, 0.15), rgba(255, 180, 30, 0.08));
  border-color: rgba(255, 200, 50, 0.35);
}

.blessing-zone.goddess.active {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 180, 30, 0.1));
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.2), inset 0 0 10px rgba(255, 215, 0, 0.05);
}

.blessing-zone.demon {
  background: linear-gradient(135deg, rgba(160, 40, 200, 0.08), rgba(120, 30, 160, 0.03));
  border-color: rgba(160, 40, 200, 0.15);
}

.blessing-zone.demon:hover {
  background: linear-gradient(135deg, rgba(160, 40, 200, 0.15), rgba(120, 30, 160, 0.08));
  border-color: rgba(160, 40, 200, 0.35);
}

.blessing-zone.demon.active {
  background: linear-gradient(135deg, rgba(180, 50, 220, 0.2), rgba(140, 30, 180, 0.1));
  border-color: rgba(180, 50, 220, 0.6);
  box-shadow: 0 0 15px rgba(180, 50, 220, 0.2), inset 0 0 10px rgba(180, 50, 220, 0.05);
}

.zone-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.goddess-icon {
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.demon-icon {
  box-shadow: 0 0 10px rgba(180, 50, 220, 0.3);
}

.zone-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.zone-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.zone-name {
  font-size: 12px;
  font-weight: bold;
}

.goddess-text {
  color: #ffd700;
}

.demon-text {
  color: #cc66ff;
}

.zone-desc {
  font-size: 9px;
  color: #666;
}

.zone-bonus {
  font-size: 9px;
  font-weight: bold;
  margin-top: 1px;
}

.goddess-bonus {
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.3);
}

.goddess-bonus-tag {
  font-size: 9px;
  font-weight: bold;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 4px;
}

.awaken-count-tag {
  font-size: 9px;
  font-weight: bold;
  color: #88ccff;
  background: rgba(80, 150, 255, 0.12);
  border: 1px solid rgba(80, 150, 255, 0.3);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 4px;
}

.goddess-rule {
  color: #ffd700 !important;
  font-weight: bold;
}

.zone-count {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 1px 6px;
  border-radius: 8px;
  min-width: 20px;
  text-align: center;
}

.zone-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  flex-shrink: 0;
}

.divider-text {
  font-size: 10px;
  font-weight: bold;
  color: #555;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.1);
}

/* ==================== 通用区域 ==================== */
.awakening-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 11px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-marker {
  display: inline-block;
  width: 3px;
  height: 11px;
  border-radius: 2px;
  background: linear-gradient(180deg, #ffd700, #cc66ff);
}

.slot-count {
  margin-left: auto;
  font-size: 10px;
  color: #666;
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 6px;
  border-radius: 8px;
}

/* ==================== 选择框 ==================== */
.select-box {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #2a2a4a;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 34px;
}

.select-box:hover:not(.disabled) {
  border-color: #4a4a6a;
}

.select-box.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.select-box.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  margin-right: 8px;
}

.select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.select-name {
  color: #fff;
  font-size: 12px;
}

.select-level {
  color: #888;
  font-size: 10px;
}

.select-placeholder {
  flex: 1;
  color: #555;
  font-size: 12px;
}

.select-arrow {
  color: #888;
  font-size: 10px;
  transition: transform 0.2s;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

/* ==================== 属性槽位 ==================== */
.result-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 6px;
}

.attr-slots {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attr-slot {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  background: rgba(20, 20, 40, 0.6);
  border: 1px solid #2a2a4a;
  border-radius: 6px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

/* 变化闪烁效果 */
.attr-slot.changed {
  animation: slot-flash 0.8s ease;
}

@keyframes slot-flash {
  0% {
    background: rgba(255, 215, 0, 0.3);
    border-color: #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }
  50% {
    background: rgba(255, 215, 0, 0.15);
    border-color: rgba(255, 215, 0, 0.5);
  }
  100% {
    background: rgba(20, 20, 40, 0.6);
    border-color: #2a2a4a;
  }
}

.theme-demon .attr-slot.changed {
  animation: slot-flash-demon 0.8s ease;
}

@keyframes slot-flash-demon {
  0% {
    background: rgba(180, 50, 220, 0.3);
    border-color: #cc66ff;
    box-shadow: 0 0 15px rgba(180, 50, 220, 0.4);
  }
  50% {
    background: rgba(180, 50, 220, 0.15);
    border-color: rgba(180, 50, 220, 0.5);
  }
  100% {
    background: rgba(20, 20, 40, 0.6);
    border-color: #2a2a4a;
  }
}

/* 锁定状态 */
.attr-slot.locked {
  background: rgba(40, 35, 20, 0.6);
  border-color: rgba(255, 180, 50, 0.3);
}

.attr-slot.locked .attr-name {
  color: #ffcc66;
}

.attr-slot.locked .attr-value {
  color: #ffaa33;
}

/* 空槽位 */
.attr-slot.empty {
  background: rgba(15, 15, 25, 0.4);
  border-style: dashed;
  border-color: #1a1a2a;
}

.attr-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.attr-name {
  color: #ccc;
  font-size: 12px;
  min-width: 60px;
}

.attr-value {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.theme-goddess .attr-value {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.theme-demon .attr-value {
  color: #cc66ff;
  text-shadow: 0 0 8px rgba(180, 50, 220, 0.3);
}

/* 百分比属性样式（%符号由模板逻辑处理，不再用CSS伪元素避免重复） */

/* 极限值徽章 */
.max-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #ff4444, #ff6644);
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 4px;
  text-shadow: 0 0 4px rgba(255, 80, 80, 0.6);
  box-shadow: 0 0 6px rgba(255, 60, 60, 0.4);
  animation: max-pulse 2s ease-in-out infinite;
}

@keyframes max-pulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(255, 60, 60, 0.3);
  }
  50% {
    box-shadow: 0 0 10px rgba(255, 80, 80, 0.6);
  }
}

.attr-empty-text {
  color: #444;
  font-size: 11px;
  font-style: italic;
}

/* ==================== 锁定/解锁滑动块 ==================== */
.lock-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: background 0.2s;
  flex-shrink: 0;
}

.lock-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
}

.lock-slider {
  width: 32px;
  height: 16px;
  background: rgba(60, 60, 80, 0.8);
  border-radius: 8px;
  position: relative;
  transition: background 0.3s;
  border: 1px solid rgba(100, 100, 120, 0.4);
}

.lock-knob {
  position: absolute;
  top: 1px;
  left: 1px;
  width: 12px;
  height: 12px;
  background: #888;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.lock-toggle.locked .lock-slider {
  background: rgba(255, 180, 50, 0.4);
  border-color: rgba(255, 200, 80, 0.6);
}

.lock-toggle.locked .lock-knob {
  left: 17px;
  background: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.theme-demon .lock-toggle.locked .lock-slider {
  background: rgba(180, 50, 220, 0.4);
  border-color: rgba(200, 80, 240, 0.6);
}

.theme-demon .lock-toggle.locked .lock-knob {
  background: #cc66ff;
  box-shadow: 0 0 8px rgba(180, 50, 220, 0.5);
}

.lock-label {
  font-size: 11px;
  transition: transform 0.2s;
}

.lock-toggle:hover .lock-label {
  transform: scale(1.2);
}

/* ==================== 进度条 ==================== */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 14px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid #2a2a4a;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.05s linear;
  position: relative;
}

.theme-goddess .progress-fill {
  background: linear-gradient(90deg, #ffd700, #ffaa00, #ffd700);
  background-size: 200% 100%;
  animation: gradient-flow 1.5s linear infinite;
}

.theme-demon .progress-fill {
  background: linear-gradient(90deg, #cc66ff, #9933ff, #cc66ff);
  background-size: 200% 100%;
  animation: gradient-flow 1.5s linear infinite;
}

@keyframes gradient-flow {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.progress-glow {
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  border-radius: 50%;
  filter: blur(3px);
  transition: left 0.05s linear;
}

.theme-goddess .progress-glow {
  background: rgba(255, 255, 200, 0.8);
}

.theme-demon .progress-glow {
  background: rgba(220, 180, 255, 0.8);
}

.progress-text {
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
}

.theme-demon .progress-text {
  color: #cc66ff;
}

/* ==================== 唤醒光效 ==================== */
.awakening-flash {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.flash-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2px solid;
  transform: translate(-50%, -50%);
  animation: ring-expand 1.2s ease-out;
}

.theme-goddess .flash-ring {
  border-color: #ffd700;
}

.theme-demon .flash-ring {
  border-color: #cc66ff;
}

.flash-ring-1 {
  animation-delay: 0s;
}

.flash-ring-2 {
  animation-delay: 0.15s;
}

.flash-ring-3 {
  animation-delay: 0.3s;
}

@keyframes ring-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
    border-width: 3px;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
    border-width: 1px;
  }
}

.flash-fade-enter-active,
.flash-fade-leave-active {
  transition: opacity 0.3s;
}

.flash-fade-enter-from,
.flash-fade-leave-to {
  opacity: 0;
}

/* ==================== 自动唤醒目标设置 ==================== */
.target-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 6px;
}

.target-hint {
  margin-left: 6px;
  font-size: 9px;
  color: #666;
  font-weight: normal;
}

.target-reset-btn {
  margin-left: auto;
  font-size: 10px;
  color: #aaa;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  padding: 1px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.target-reset-btn:hover {
  color: #fff;
  border-color: #5a5a7a;
}

.target-rows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.target-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-label {
  font-size: 11px;
  font-weight: bold;
  color: #aaa;
  min-width: 38px;
  flex-shrink: 0;
}

.target-select {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  background: rgba(20, 20, 40, 0.8);
  border: 1px solid #2a2a4a;
  border-radius: 5px;
  color: #ccc;
  font-size: 11px;
  cursor: pointer;
  transition: border-color 0.2s;
  outline: none;
}

.target-select:hover:not(:disabled) {
  border-color: #4a4a6a;
}

.target-select:focus {
  border-color: #6a6a8a;
}

.target-select:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 女神主题下拉框 */
.theme-goddess .target-select {
  background: rgba(30, 27, 12, 0.8);
  border-color: rgba(255, 215, 0, 0.15);
}

.theme-goddess .target-select:hover:not(:disabled) {
  border-color: rgba(255, 215, 0, 0.35);
}

.theme-goddess .target-select:focus {
  border-color: rgba(255, 215, 0, 0.5);
}

/* 恶魔主题下拉框 */
.theme-demon .target-select {
  background: rgba(28, 14, 35, 0.8);
  border-color: rgba(180, 50, 220, 0.15);
}

.theme-demon .target-select:hover:not(:disabled) {
  border-color: rgba(180, 50, 220, 0.35);
}

.theme-demon .target-select:focus {
  border-color: rgba(180, 50, 220, 0.5);
}

/* 值选择框稍窄 */
.value-select {
  flex: 0 0 70px;
}

/* 下拉选项暗色主题（部分浏览器支持） */
.target-select option {
  background: rgba(20, 20, 40, 0.95);
  color: #ccc;
}

.theme-goddess .target-select option {
  background: rgba(30, 27, 12, 0.95);
}

.theme-demon .target-select option {
  background: rgba(28, 14, 35, 0.95);
}

/* ==================== 期望值提示 & 达标徽章 ==================== */
.expected-value-tag {
  font-size: 9px;
  color: #ffd700;
  font-weight: bold;
  flex-shrink: 0;
  white-space: nowrap;
}

.theme-demon .expected-value-tag {
  color: #cc66ff;
}

.target-met-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #00aa44;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(0, 200, 80, 0.5);
}

.target-row.target-met {
  opacity: 0.6;
}

.target-row.target-met .target-select {
  pointer-events: none;
}

/* ==================== 自动唤醒确认面板 ==================== */
.confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(2px);
}

.confirm-panel {
  width: 90%;
  max-width: 380px;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid #3a3a5a;
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.theme-goddess .confirm-panel {
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 8px 30px rgba(255, 200, 50, 0.15);
}

.theme-demon .confirm-panel {
  border-color: rgba(180, 50, 220, 0.4);
  box-shadow: 0 8px 30px rgba(160, 40, 200, 0.15);
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid #2a2a4a;
}

.confirm-icon {
  font-size: 16px;
  color: #ffaa00;
}

.confirm-title-text {
  font-size: 13px;
  font-weight: bold;
  color: #ddd;
}

.confirm-body {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.confirm-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.confirm-info-label {
  color: #888;
  min-width: 60px;
}

.confirm-info-value {
  color: #ccc;
  font-weight: bold;
}

.confirm-targets {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(50, 50, 70, 0.4);
}

.confirm-target-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #bbb;
}

.confirm-target-label {
  color: #888;
  min-width: 42px;
  flex-shrink: 0;
}

.confirm-target-name {
  color: #ccc;
  font-weight: bold;
}

.confirm-target-value {
  color: #fff;
  font-weight: bold;
}

.confirm-target-expected {
  color: #ffd700;
  font-size: 10px;
  font-weight: bold;
}

.theme-demon .confirm-target-expected {
  color: #cc66ff;
}

.confirm-warning {
  font-size: 10px;
  color: #888;
  text-align: center;
  margin-top: 4px;
  padding: 6px;
  background: rgba(255, 170, 0, 0.08);
  border-radius: 5px;
  border: 1px solid rgba(255, 170, 0, 0.15);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid #2a2a4a;
}

.confirm-btn {
  flex: 1;
  padding: 7px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(60, 60, 80, 0.8);
  color: #aaa;
  border: 1px solid #3a3a5a;
}

.cancel-btn:hover {
  background: rgba(80, 80, 100, 0.8);
  color: #fff;
}

.ok-btn {
  background: linear-gradient(135deg, #6c5a3a 0%, #8c7a5a 100%);
  color: #fff;
}

.theme-goddess .ok-btn {
  background: linear-gradient(135deg, #8c6a1a 0%, #ac8a3a 100%);
}

.theme-goddess .ok-btn:hover {
  background: linear-gradient(135deg, #9c7a2a 0%, #bc9a4a 100%);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.4);
}

.theme-demon .ok-btn {
  background: linear-gradient(135deg, #5a2a6c 0%, #7a4a8c 100%);
}

.theme-demon .ok-btn:hover {
  background: linear-gradient(135deg, #6a3a7c 0%, #8a5a9c 100%);
  box-shadow: 0 0 12px rgba(180, 50, 220, 0.4);
}

/* 确认面板过渡动画 */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.25s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

/* ==================== 操作按钮 ==================== */
.awakening-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid #2a2a4a;
}

.action-btn {
  flex: 1;
  padding: 7px 12px;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
}

.auto-btn {
  background: linear-gradient(135deg, #3a4a6c 0%, #5a6a8c 100%);
  color: #fff;
}

.auto-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4a5a7c 0%, #6a7a9c 100%);
  box-shadow: 0 0 12px rgba(90, 106, 140, 0.4);
}

.auto-btn.stop-btn {
  background: linear-gradient(135deg, #8c3a3a 0%, #ac5a5a 100%);
  animation: pulse-stop 1s infinite;
}

.auto-btn.stop-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9c4a4a 0%, #bc6a6a 100%);
  box-shadow: 0 0 15px rgba(172, 90, 90, 0.5);
}

@keyframes pulse-stop {
  0%, 100% { box-shadow: 0 0 5px rgba(172, 90, 90, 0.3); }
  50% { box-shadow: 0 0 15px rgba(172, 90, 90, 0.6); }
}

.awaken-btn {
  background: linear-gradient(135deg, #6c5a3a 0%, #8c7a5a 100%);
  color: #fff;
}

.theme-goddess .awaken-btn {
  background: linear-gradient(135deg, #8c6a1a 0%, #ac8a3a 100%);
}

.theme-goddess .awaken-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9c7a2a 0%, #bc9a4a 100%);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

.theme-demon .awaken-btn {
  background: linear-gradient(135deg, #5a2a6c 0%, #7a4a8c 100%);
}

.theme-demon .awaken-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6a3a7c 0%, #8a5a9c 100%);
  box-shadow: 0 0 15px rgba(180, 50, 220, 0.4);
}

.action-btn:disabled {
  background: #2a2a3a;
  color: #555;
  cursor: not-allowed;
}

/* ==================== 消息 ==================== */
.message {
  text-align: center;
  font-size: 11px;
  padding: 3px 4px;
  border-radius: 4px;
}

.error-message {
  color: #ff6666;
  background: rgba(255, 0, 0, 0.1);
}

.success-message {
  color: #00ff88;
  background: rgba(0, 255, 0, 0.1);
}

/* ==================== 弹出选择面板 ==================== */
.popup-panel {
  width: 260px;
  max-height: 200px;
  background: rgba(25, 25, 45, 0.98);
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 10000;
}

.popup-header {
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #2a2a4a;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
}

.popup-items {
  max-height: 160px;
  overflow-y: auto;
}

.popup-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(50, 50, 70, 0.3);
}

.popup-item:hover {
  background: rgba(255, 215, 0, 0.08);
}

.popup-item.selected {
  background: rgba(255, 215, 0, 0.15);
  border-left: 3px solid #ffd700;
}

.popup-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  margin-right: 8px;
}

.popup-info {
  flex: 1;
}

.popup-name {
  color: #fff;
  font-size: 12px;
}

.popup-level {
  color: #888;
  font-size: 10px;
  margin-top: 1px;
}

/* ==================== 面板过渡动画 ==================== */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ==================== 概率信息面板 ==================== */
.info-panel {
  position: fixed;
  width: 280px;
  max-height: 560px;
  background: rgba(12, 12, 25, 0.98);
  border: 1px solid #2a2a4a;
  border-radius: 10px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.theme-goddess.info-panel {
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 30px rgba(255, 200, 50, 0.1);
}

.theme-demon.info-panel {
  border-color: rgba(180, 50, 220, 0.3);
  box-shadow: 0 4px 30px rgba(160, 40, 200, 0.1);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid #2a2a4a;
}

.info-title-icon {
  font-size: 14px;
}

.info-title-text {
  font-size: 12px;
  font-weight: bold;
  color: #ccc;
}

.info-content {
  flex: 1;
  padding: 8px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-group-title {
  font-size: 11px;
  font-weight: bold;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(50, 50, 70, 0.4);
}

.info-group-marker {
  display: inline-block;
  width: 3px;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(180deg, #ffd700, #cc66ff);
}

.info-group-range {
  font-size: 9px;
  color: #666;
  margin-left: 2px;
}

.info-params {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-param {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
}

.info-param:hover {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.info-param-name {
  color: #bbb;
}

.info-param-range {
color: #777;
font-size: 10px;
}

/* 概率列表 */
.info-param-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 2px 6px;
}

.info-param-probs {
display: flex;
flex-direction: column;
gap: 1px;
padding: 2px 6px 4px;
}

.prob-bar-item {
display: flex;
align-items: center;
gap: 4px;
font-size: 9px;
}

.prob-bar-track {
flex: 1;
height: 6px;
background: rgba(40, 40, 60, 0.6);
border-radius: 3px;
overflow: hidden;
}

.prob-bar-fill {
height: 100%;
border-radius: 3px;
transition: width 0.3s ease;
}

.theme-goddess .prob-bar-fill {
background: linear-gradient(90deg, #ffd700, #ffaa00);
}

.theme-demon .prob-bar-fill {
background: linear-gradient(90deg, #cc66ff, #9933ff);
}

.prob-bar-value {
min-width: 24px;
text-align: right;
color: #999;
}

.prob-bar-percent {
min-width: 36px;
text-align: right;
color: #aaa;
font-weight: bold;
}

.info-rules {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(50, 50, 70, 0.4);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-rule {
  font-size: 10px;
  color: #888;
  padding: 2px 4px;
}

/* 信息面板滑入动画 */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ==================== 滚动条主题色 ==================== */

/* 主面板内容区滚动条 */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(20, 20, 35, 0.6);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  border-radius: 3px;
}

.theme-goddess .modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.4);
}

.theme-goddess .modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.6);
}

.theme-demon .modal-content::-webkit-scrollbar-thumb {
  background: rgba(180, 50, 220, 0.4);
}

.theme-demon .modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 50, 220, 0.6);
}

/* 概率面板内容区滚动条 */
.info-content::-webkit-scrollbar {
  width: 6px;
}

.info-content::-webkit-scrollbar-track {
  background: rgba(20, 20, 35, 0.6);
  border-radius: 3px;
}

.theme-goddess .info-content::-webkit-scrollbar-thumb,
.theme-goddess.info-panel .info-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.4);
}

.theme-goddess .info-content::-webkit-scrollbar-thumb:hover,
.theme-goddess.info-panel .info-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.6);
}

.theme-demon .info-content::-webkit-scrollbar-thumb,
.theme-demon.info-panel .info-content::-webkit-scrollbar-thumb {
  background: rgba(180, 50, 220, 0.4);
}

.theme-demon .info-content::-webkit-scrollbar-thumb:hover,
.theme-demon.info-panel .info-content::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 50, 220, 0.6);
}

/* ==================== 面板背景动态主题色 ==================== */

/* 女神主题面板背景 */
.theme-goddess {
  background: rgba(25, 22, 10, 0.97) !important;
  border-color: rgba(255, 215, 0, 0.4) !important;
}

.theme-goddess .modal-header {
  background: rgba(40, 35, 10, 0.6);
  border-bottom-color: rgba(255, 215, 0, 0.15);
}

.theme-goddess .modal-content {
  background: transparent;
}

.theme-goddess .result-section {
  background: rgba(35, 30, 10, 0.4);
  border-color: rgba(255, 215, 0, 0.12);
}

.theme-goddess .attr-slot {
  background: rgba(30, 27, 12, 0.6);
  border-color: rgba(255, 215, 0, 0.1);
}

.theme-goddess .attr-slot.empty {
  background: rgba(20, 18, 8, 0.4);
  border-color: rgba(255, 215, 0, 0.06);
}

.theme-goddess .section-title {
  color: #d4a830;
}

.theme-goddess .select-box {
  background: rgba(30, 27, 12, 0.5);
  border-color: rgba(255, 215, 0, 0.15);
}

.theme-goddess .select-box:hover:not(.disabled) {
  border-color: rgba(255, 215, 0, 0.3);
}

.theme-goddess .info-title-text {
  color: #ffd700;
}

.theme-goddess .info-group-title {
  color: #d4a830;
}

/* 恶魔主题面板背景 */
.theme-demon {
  background: rgba(20, 12, 28, 0.97) !important;
  border-color: rgba(180, 50, 220, 0.4) !important;
}

.theme-demon .modal-header {
  background: rgba(35, 15, 45, 0.6);
  border-bottom-color: rgba(180, 50, 220, 0.15);
}

.theme-demon .modal-content {
  background: transparent;
}

.theme-demon .result-section {
  background: rgba(30, 15, 38, 0.4);
  border-color: rgba(180, 50, 220, 0.12);
}

.theme-demon .attr-slot {
  background: rgba(28, 14, 35, 0.6);
  border-color: rgba(180, 50, 220, 0.1);
}

.theme-demon .attr-slot.empty {
  background: rgba(18, 10, 22, 0.4);
  border-color: rgba(180, 50, 220, 0.06);
}

.theme-demon .section-title {
  color: #b366cc;
}

.theme-demon .select-box {
  background: rgba(28, 14, 35, 0.5);
  border-color: rgba(180, 50, 220, 0.15);
}

.theme-demon .select-box:hover:not(.disabled) {
  border-color: rgba(180, 50, 220, 0.3);
}

.theme-demon .info-title-text {
  color: #cc66ff;
}

.theme-demon .info-group-title {
  color: #b366cc;
}

/* 概率面板背景动态主题 */
.theme-goddess.info-panel {
  background: rgba(22, 19, 8, 0.98) !important;
}

.theme-demon.info-panel {
  background: rgba(18, 10, 25, 0.98) !important;
}

.theme-goddess .info-header,
.theme-goddess.info-panel .info-header {
  background: rgba(40, 35, 10, 0.5);
  border-bottom-color: rgba(255, 215, 0, 0.15);
}

.theme-demon .info-header,
.theme-demon.info-panel .info-header {
  background: rgba(35, 15, 45, 0.5);
  border-bottom-color: rgba(180, 50, 220, 0.15);
}

/* ==================== 神圣之光/邪恶之光动画 ==================== */

/* ---- 过渡 ---- */
.light-fade-enter-active,
.light-fade-leave-active {
  transition: opacity 0.3s ease;
}

.light-fade-enter-from,
.light-fade-leave-to {
  opacity: 0;
}

/* ---- 光效覆盖层（面板上部外侧） ---- */
.light-effect-overlay {
  position: fixed;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
}

/* ---- 光柱主体 ---- */
.light-pillar {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 80px;
  height: 100%;
  transform: translateX(-50%);
  opacity: 0;
  filter: blur(4px);
  animation: pillar-rise 2s ease-out forwards;
}

/* 神圣之光：金色暖光柱 */
.light-goddess .light-pillar {
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(255, 220, 100, 0.1) 20%,
    rgba(255, 215, 0, 0.3) 50%,
    rgba(255, 240, 180, 0.55) 85%,
    rgba(255, 250, 220, 0.7) 100%);
}

/* 邪恶之光：紫红色暗光柱 */
.light-demon .light-pillar {
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(160, 30, 200, 0.1) 20%,
    rgba(140, 20, 180, 0.3) 50%,
    rgba(200, 60, 240, 0.5) 85%,
    rgba(220, 100, 255, 0.65) 100%);
}

@keyframes pillar-rise {
  0% { opacity: 0; transform: translateX(-50%) scaleY(0); }
  20% { opacity: 1; transform: translateX(-50%) scaleY(1); }
  70% { opacity: 0.85; transform: translateX(-50%) scaleY(1); }
  100% { opacity: 0; transform: translateX(-50%) scaleY(1.1); }
}

/* ---- 光环扩散 ---- */
.light-ring {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  transform: translateX(-50%);
  opacity: 0;
  animation: ring-spread 2s ease-out forwards;
}

.light-ring.r1 { animation-delay: 0s; }
.light-ring.r2 { animation-delay: 0.3s; }

.light-goddess .light-ring {
  border-color: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.light-demon .light-ring {
  border-color: rgba(180, 50, 220, 0.6);
  box-shadow: 0 0 15px rgba(180, 50, 220, 0.3);
}

@keyframes ring-spread {
  0% { opacity: 0; width: 20px; height: 20px; }
  20% { opacity: 0.8; }
  100% { opacity: 0; width: 200px; height: 200px; }
}

/* ---- 放射光线 ---- */
.light-rays {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1px;
  height: 1px;
}

.light-ray {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 3px;
  height: 60px;
  transform-origin: center bottom;
  transform: rotate(var(--ray-angle)) translateY(-100%);
  opacity: 0;
  animation: ray-shoot 1.5s ease-out forwards;
  border-radius: 2px;
}

.light-goddess .light-ray {
  background: linear-gradient(180deg,
    rgba(255, 240, 180, 0.8) 0%,
    rgba(255, 215, 0, 0.4) 60%,
    transparent 100%);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.light-demon .light-ray {
  background: linear-gradient(180deg,
    rgba(220, 120, 255, 0.8) 0%,
    rgba(160, 40, 220, 0.4) 60%,
    transparent 100%);
  box-shadow: 0 0 8px rgba(180, 50, 220, 0.4);
}

@keyframes ray-shoot {
  0% { opacity: 0; transform: rotate(var(--ray-angle)) translateY(-100%) scaleY(0); }
  30% { opacity: 1; transform: rotate(var(--ray-angle)) translateY(-100%) scaleY(1); }
  100% { opacity: 0; transform: rotate(var(--ray-angle)) translateY(-120%) scaleY(1.3); }
}

/* ---- 飘升粒子 ---- */
.light-particles {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.light-particle {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  opacity: 0;
  animation: light-particle-rise 2s ease-out forwards;
}

.light-goddess .light-particle {
  background: radial-gradient(circle, #fff8dc 0%, #ffd700 50%, transparent 100%);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
}

.light-demon .light-particle {
  background: radial-gradient(circle, #f0c0ff 0%, #b432dc 50%, transparent 100%);
  box-shadow: 0 0 6px rgba(180, 50, 220, 0.5);
}

@keyframes light-particle-rise {
  0% {
    opacity: 0;
    transform: translateY(0) translateX(0) scale(0.3);
  }
  20% {
    opacity: 1;
    transform: translateY(-30px) translateX(calc(var(--drift) * 0.3)) scale(1);
  }
  80% {
    opacity: 0.7;
    transform: translateY(-120px) translateX(var(--drift)) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-160px) translateX(calc(var(--drift) * 1.3)) scale(0.2);
  }
}
</style>
