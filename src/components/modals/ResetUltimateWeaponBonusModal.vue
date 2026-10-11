<!--
  重置 转化终极武器新增特殊属性面板
  使用道具ID 12944（终极加成卷轴）后打开
  功能：重置终极武器的 possibleRandomStats 属性值
-->
<template>
  <transition name="reset-weapon-fade">
    <div v-if="isVisible" ref="modalContainerRef" class="reset-weapon-container" :style="modalStyle">
      <!-- 头部（可拖拽） -->
      <div class="reset-weapon-header" @pointerdown="startDrag">
        <div class="reset-weapon-title-wrapper">
          <img src="/pt/item_icon/12944.png" class="reset-weapon-scroll-icon" alt="终极加成卷轴" />
          <h2 class="reset-weapon-title">重置 转化终极武器新增特殊属性</h2>
        </div>
        <div class="reset-weapon-header-actions">
          <button 
            class="reset-weapon-help-btn" 
            :class="{ active: showInfoPanel }"
            title="显示/隐藏属性范围"
            @click.stop="toggleInfoPanel"
            @pointerdown.stop
          >?</button>
          <button class="reset-weapon-close-btn" @click="handleClose">×</button>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="reset-weapon-body">
        <!-- 1. 终极加成卷轴选择区域 -->
        <div class="reset-weapon-section">
          <div class="reset-weapon-section-title">终极加成卷轴</div>
          <div
            ref="selectScrollBoxRef"
            class="reset-weapon-select-box"
            :class="{ active: showScrollPanel, disabled: scrollItems.length === 0 }"
            @click="toggleScrollPanel"
          >
            <template v-if="selectedScroll">
              <img :src="selectedScroll.icon" class="reset-weapon-select-icon" @error="handleIconError" @mouseenter="showItemTooltip($event, selectedScroll)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
              <div class="reset-weapon-select-info">
                <span class="reset-weapon-select-name">终极加成卷轴</span>
                <span class="reset-weapon-select-count">×{{ selectedScroll.currentStack || 1 }}</span>
              </div>
            </template>
            <span v-else class="reset-weapon-select-placeholder">
              {{ scrollItems.length === 0 ? '未找到终极加成卷轴，请去钻石商店购买' : '选择终极加成卷轴' }}
            </span>
            <span class="reset-weapon-select-arrow" :class="{ rotated: showScrollPanel }">▼</span>
          </div>

          <!-- 卷轴选择下拉面板 -->
          <div
            v-if="showScrollPanel && scrollItems.length > 0"
            ref="scrollPanelRef"
            class="reset-weapon-popup-panel"
            :style="scrollPanelStyle"
          >
            <div
              v-for="item in scrollItems"
              :key="item.uniqueId || item.id"
              class="reset-weapon-popup-item"
              :class="{ selected: selectedScrollId === (item.uniqueId || item.id) }"
              @click="selectScroll(item)"
              @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip"
              @mousemove="moveItemTooltip"
            >
              <img :src="item.icon" class="reset-weapon-popup-icon" @error="handleIconError" />
              <div class="reset-weapon-popup-info">
                <span class="reset-weapon-popup-name">终极加成卷轴</span>
                <span class="reset-weapon-popup-count">×{{ item.currentStack || 1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 洗练武器选择区域 -->
        <div class="reset-weapon-section">
          <div class="reset-weapon-section-title">洗练武器</div>
          <div
            ref="selectWeaponBoxRef"
            class="reset-weapon-select-box"
            :class="{ active: showWeaponPanel, disabled: weaponItems.length === 0 }"
            @click="toggleWeaponPanel"
          >
            <template v-if="selectedWeapon">
              <img :src="selectedWeapon.icon" class="reset-weapon-select-icon" @error="handleIconError" @mouseenter="showItemTooltip($event, selectedWeapon)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
              <div class="reset-weapon-select-info">
                <span class="reset-weapon-select-name" :style="getRarityStyle(selectedWeapon.rarity)">{{ getWeaponDisplayName(selectedWeapon) }}</span>
                <span class="reset-weapon-select-level">
                  +{{ selectedWeapon.enhanceLevel || 0 }} ·
                  <span :style="getRarityStyle(selectedWeapon.rarity)">{{ getRarityText(selectedWeapon.rarity) }}</span>
                </span>
              </div>
            </template>
            <span v-else class="reset-weapon-select-placeholder">
              {{ weaponItems.length === 0 ? '背包中没有可洗练的终极武器' : '选择要洗练的终极武器' }}
            </span>
            <span class="reset-weapon-select-arrow" :class="{ rotated: showWeaponPanel }">▼</span>
          </div>

          <!-- 武器选择下拉面板 -->
          <div
            v-if="showWeaponPanel && weaponItems.length > 0"
            ref="weaponPanelRef"
            class="reset-weapon-popup-panel weapon-panel"
            :style="weaponPanelStyle"
          >
            <div
              v-for="item in weaponItems"
              :key="item.uniqueId"
              class="reset-weapon-popup-item"
              :class="{ selected: selectedWeaponId === item.uniqueId }"
              @click="selectWeapon(item)"
              @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip"
              @mousemove="moveItemTooltip"
            >
              <img :src="item.icon" class="reset-weapon-popup-icon" @error="handleIconError" />
              <div class="reset-weapon-popup-info">
                <span class="reset-weapon-popup-name" :style="getRarityStyle(item.rarity)">{{ getWeaponDisplayName(item) }}</span>
                <span class="reset-weapon-popup-level">
                  +{{ item.enhanceLevel || 0 }} ·
                  <span :style="getRarityStyle(item.rarity)">{{ getRarityText(item.rarity) }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 当前武器属性显示 (possibleRandomStats) -->
        <div v-if="selectedWeapon && weaponPossibleRandomStats.length > 0" class="reset-weapon-section">
          <div class="reset-weapon-section-title">当前属性</div>
          <div class="reset-weapon-abilities">
            <div
              v-for="(stat, index) in weaponPossibleRandomStats"
              :key="index"
              class="reset-weapon-ability-line"
              :class="{ 'is-max': isMaxValue(stat), 'is-locked': isStatLocked(index) }"
            >
              <span class="ability-text">{{ formatRandomStat(stat) }}</span>
              <span v-if="isMaxValue(stat)" class="max-value-tag">极限</span>
              <!-- 上锁/解锁滑动块 -->
              <div
                class="ability-lock-toggle"
                :class="{ locked: isStatLocked(index) }"
                @click="toggleStatLock(index)"
                :title="isStatLocked(index) ? '点击解锁此属性（洗练时不会被随机）' : '点击锁定此属性（洗练时保持不变）'"
              >
                <div class="lock-slider">
                  <div class="lock-slider-thumb">
                    <span class="lock-icon">{{ isStatLocked(index) ? '🔒' : '🔓' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 洗练进度条 -->
        <div v-if="isReforging || isAutoReforging" class="reset-weapon-section">
          <div class="reset-weapon-section-title">洗练进度</div>
          <div class="reforge-progress-container">
            <div class="reforge-progress-bar" :style="{ width: `${reforgeProgress}%` }"></div>
            <span class="reforge-progress-text">{{ reforgeProgress.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- 5. 消耗提示 -->
        <div v-if="selectedScroll && selectedWeapon" class="reset-weapon-section consume-info">
          <div class="consume-text">
            <span>消耗：</span>
            <span class="consume-highlight">终极加成卷轴 ×{{ scrollCost }}</span>
            <span v-if="lockedStats.size > 0" class="locked-info">
              （锁定 {{ lockedStats.size }} 个属性）
            </span>
          </div>
        </div>

        <!-- 6. 操作按钮 -->
        <div class="reset-weapon-actions">
          <button
            class="reforge-btn auto-reforge"
            :class="{ active: isAutoReforging }"
            :disabled="!canReforge || isReforging"
            @click="handleAutoReforge"
          >
            {{ isAutoReforging ? '停止洗练' : '自动洗练' }}
          </button>
          <button
            class="reforge-btn single-reforge"
            :disabled="!canReforge || isReforging || isAutoReforging"
            @click="handleReforge"
          >
            {{ isReforging ? '洗练中...' : '洗练' }}
          </button>
        </div>
      </div>

      <!-- 二次确认弹窗：属性达到最大值 -->
      <div v-if="showMaxValueConfirm" class="confirm-overlay">
        <div class="confirm-dialog">
          <div class="confirm-title">⚠️ 发现极限属性</div>
          <div class="confirm-content">
            <p>洗练出了极限属性：<span class="max-stat-name">{{ formatRandomStat(maxValueStatInfo) }}</span></p>
            <p>是否继续自动洗练？</p>
            <p class="confirm-warning">继续洗练可能会替换掉此极限属性！</p>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancelAutoReforge">停止洗练</button>
            <button class="confirm-btn continue" @click="confirmContinueAutoReforge">继续洗练</button>
          </div>
        </div>
      </div>
    </div>
  </transition>

<!-- 武器转化终极特殊属性信息面板（独立于主面板，显示在右侧外部） -->
<transition name="info-panel-fade">
<div
v-if="isVisible && showInfoPanel && selectedWeapon"
ref="infoPanelRef"
class="reset-weapon-info-panel"
:style="infoPanelStyle"
>
<div class="info-panel-header">
<span class="info-panel-title" :style="getRarityStyle(selectedWeapon.rarity)">{{ getWeaponDisplayName(selectedWeapon) }} 属性范围</span>
</div>
<div class="info-panel-body">
<div
v-for="(stat, index) in selectedWeaponPossibleRandomStats"
:key="`info-stat-${index}`"
class="info-stat-item"
>
<span class="info-stat-name" style="color: #e3e102">{{ formatStatParameter(stat.parameter) }}</span>
<span class="info-stat-range" style="color: #e3e102">
{{ formatStatRange(stat) }}
</span>
</div>
<div v-if="!selectedWeaponPossibleRandomStats.length" class="info-empty">
该武器没有可洗练的属性
</div>
</div>
</div>
</transition>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { formatAbility as formatAbilityUtil, PERCENT_PARAMETERS } from '@/utils/effectFormatter'
import { getParameterName } from '@/store/descriptions'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'

// 终极加成卷轴ID
const SCROLL_ID = 12944

export default {
  name: 'ResetUltimateWeaponBonusModal',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'add-battle-log', 'play-sfx', 'show-animation-message'],

  setup (props, { emit }) {
    const itemsStore = useItemsStore()
    const gameStore = useGameStore()

    // ========== 状态 ==========
    const isVisible = computed(() => props.visible)
    const modalContainerRef = ref(null)
    const selectScrollBoxRef = ref(null)
    const selectWeaponBoxRef = ref(null)
    const scrollPanelRef = ref(null)
    const weaponPanelRef = ref(null)

    // 拖拽状态
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const position = ref({ x: 0, y: 0 })

    // 选择状态
    const selectedScrollId = ref(null)
    const selectedWeaponId = ref(null)
    const showScrollPanel = ref(false)
    const showWeaponPanel = ref(false)

    // 信息面板状态
    const showInfoPanel = ref(false)
    const infoPanelRef = ref(null)

    // 洗练状态
    const isReforging = ref(false)
    const isAutoReforging = ref(false)
    const shouldStopAutoReforge = ref(false)
    const reforgeProgress = ref(0)

    // 二次确认弹窗状态
    const showMaxValueConfirm = ref(false)
    const maxValueStatInfo = ref(null) // 存储达到最大值的属性信息

    // 锁定状态
    const lockedStats = ref(new Set())

    // ========== 计算属性 ==========

    /**
     * 模态框样式（支持拖拽）
     */
    const modalStyle = computed(() => ({
      transform: `translate(${position.value.x}px, ${position.value.y}px)`
    }))

    /**
     * 背包中的终极加成卷轴列表
     */
    const scrollItems = computed(() => {
      return itemsStore.playerBag.filter(item => Number(item.id) === SCROLL_ID)
    })

    /**
     * 背包中可洗练的终极武器列表
     * 筛选条件：
     * 1. 物品在玩家背包中
     * 2. 武器品质为终极（rarity === 'ultimate'）
     * 3. 有 possibleRandomStats 属性，或在 ITEM_INFO 中查找后有 possibleRandomStats
     */
    const weaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 必须是武器类型
        const category = item.category?.toLowerCase() || ''
        if (category !== 'weapon') return false

        // 必须是终极品质
        if (item.rarity !== 'ultimate') return false

        // 检查 possibleRandomStats 属性
        // 优先检查物品实例上的属性
        if (item.possibleRandomStats && Array.isArray(item.possibleRandomStats) && item.possibleRandomStats.length > 0) {
          return true
        }

        // 如果物品实例上没有，从 ITEM_INFO 中查找
        const itemConfig = ITEM_INFO[String(item.id)]
        if (itemConfig?.possibleRandomStats && Array.isArray(itemConfig.possibleRandomStats) && itemConfig.possibleRandomStats.length > 0) {
          return true
        }

        return false
      })
    })

    /**
     * 选中的卷轴
     */
    const selectedScroll = computed(() => {
      if (!selectedScrollId.value) return null
      let found = itemsStore.playerBag.find(item => item.uniqueId === selectedScrollId.value)
      if (!found) {
        found = itemsStore.playerBag.find(item => Number(item.id) === Number(selectedScrollId.value) && Number(item.id) === SCROLL_ID)
      }
      return found || null
    })

    /**
     * 选中的武器
     */
    const selectedWeapon = computed(() => {
      if (!selectedWeaponId.value) return null
      return itemsStore.playerBag.find(item => item.uniqueId === selectedWeaponId.value) || null
    })

    /**
     * 从 ITEM_INFO 获取选中武器的 possibleRandomStats 属性范围
     * 这是要在信息面板中显示的属性范围值
     */
    const selectedWeaponPossibleRandomStats = computed(() => {
      if (!selectedWeapon.value) return []
      // 从 ITEM_INFO 中获取原始的 possibleRandomStats
      const weaponId = selectedWeapon.value.id
      const itemInfo = ITEM_INFO[weaponId]
      if (!itemInfo || !itemInfo.possibleRandomStats) return []
      return itemInfo.possibleRandomStats
    })

    /**
     * 信息面板位置样式（在主面板右侧外部，从上到下贴合）
     * 使用 position 响应式变量确保拖动时位置同步更新
     */
    const infoPanelStyle = computed(() => {
      // 使用 position.value 确保拖动时触发更新
      const _ = position.value
      if (!modalContainerRef.value) return {}
      const containerRect = modalContainerRef.value.getBoundingClientRect()
      return {
        position: 'fixed',
        left: `${containerRect.right + 8}px`,
        top: `${containerRect.top}px`
      }
    })

    /**
     * 选中武器的 possibleRandomStats 属性列表
     */
    const weaponPossibleRandomStats = computed(() => {
      if (!selectedWeapon.value || !selectedWeapon.value.possibleRandomStats) {
        return []
      }
      return selectedWeapon.value.possibleRandomStats
    })

    /**
     * 检查是否可以洗练
     */
    const canReforge = computed(() => {
      if (!selectedScroll.value || !selectedWeapon.value) return false
      const scrollCostValue = 1 + lockedStats.value.size
      if ((selectedScroll.value.currentStack || 0) < scrollCostValue) return false
      return true
    })

    /**
     * 计算洗练需要消耗的卷轴数量
     */
    const scrollCost = computed(() => {
      return 1 + lockedStats.value.size
    })

    // 下拉面板位置样式
    const scrollPanelStyle = computed(() => {
      if (!selectScrollBoxRef.value || !modalContainerRef.value) return {}
      const rect = selectScrollBoxRef.value.getBoundingClientRect()
      const containerRect = modalContainerRef.value.getBoundingClientRect()
      return {
        position: 'absolute',
        left: `${rect.left - containerRect.left}px`,
        top: `${rect.bottom - containerRect.top + 4}px`,
        zIndex: 100
      }
    })

    const weaponPanelStyle = computed(() => {
      if (!selectWeaponBoxRef.value || !modalContainerRef.value) return {}
      const rect = selectWeaponBoxRef.value.getBoundingClientRect()
      const containerRect = modalContainerRef.value.getBoundingClientRect()
      return {
        position: 'absolute',
        left: `${rect.left - containerRect.left}px`,
        top: `${rect.bottom - containerRect.top + 4}px`,
        zIndex: 100
      }
    })

// ========== 方法 ==========

/**
 * 切换信息面板显示
 */
const toggleInfoPanel = () => {
  showInfoPanel.value = !showInfoPanel.value
}

/**
 * 格式化属性参数名称
 * @param {string} parameter - 属性参数
 * @returns {string} 格式化后的名称
 */
const formatStatParameter = (parameter) => {
  if (!parameter) return ''
  const key = String(parameter).toLowerCase()
  return getParameterName(key) || parameter
}

/**
 * 格式化属性范围显示
 * @param {Object} stat - 属性对象
 * @returns {string} 格式化后的范围字符串
 */
const formatStatRange = (stat) => {
  if (!stat) return ''
  const add = stat.add !== undefined ? stat.add : 0
  const addMax = stat.addMax !== undefined ? stat.addMax : add
  const isRate = stat.rate === true

  if (add === addMax) {
    return isRate ? `${add}%` : `${add}`
  }
  return isRate ? `${add}%~${addMax}%` : `${add}~${addMax}`
}

/**
* 关闭面板
*/
const handleClose = () => {
shouldStopAutoReforge.value = true
isAutoReforging.value = false
emit('close')
}

    /**
     * 开始拖拽
     */
    const startDrag = (e) => {
      if (e.target.closest('.reset-weapon-close-btn')) return
      isDragging.value = true
      const startX = e.clientX - position.value.x
      const startY = e.clientY - position.value.y

      const handleMove = (moveEvent) => {
        position.value = {
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        }
      }

      const handleUp = () => {
        isDragging.value = false
        document.removeEventListener('pointermove', handleMove)
        document.removeEventListener('pointerup', handleUp)
      }

      document.addEventListener('pointermove', handleMove)
      document.addEventListener('pointerup', handleUp)
    }

    /**
     * 切换卷轴选择面板
     */
    const toggleScrollPanel = () => {
      if (scrollItems.value.length === 0) return
      showScrollPanel.value = !showScrollPanel.value
      if (showScrollPanel.value) {
        showWeaponPanel.value = false
      }
    }

    /**
     * 切换武器选择面板
     */
    const toggleWeaponPanel = () => {
      if (weaponItems.value.length === 0) return
      showWeaponPanel.value = !showWeaponPanel.value
      if (showWeaponPanel.value) {
        showScrollPanel.value = false
      }
    }

    /**
     * 选择卷轴
     */
    const selectScroll = (item) => {
      selectedScrollId.value = item.uniqueId || item.id
      showScrollPanel.value = false
      hideItemTooltip()
    }

    /**
     * 选择武器
     */
    const selectWeapon = (item) => {
      selectedWeaponId.value = item.uniqueId
      showWeaponPanel.value = false
      // 重置锁定状态
      lockedStats.value = new Set()
      hideItemTooltip()
    }

    /**
     * 格式化属性显示
     */
    const formatAbility = (ability) => {
      if (!ability) return ''
      return formatAbilityUtil(ability)
    }

    /**
     * 格式化 possibleRandomStats 属性显示
     */
    const formatRandomStat = (stat) => {
      if (!stat || !stat.parameter) {
        return ''
      }

      const label = getParameterName(stat.parameter)
      const add = stat.add || 0
      const addMax = stat.addMax
      const currentAdd = stat.currentAdd
      const isRate = Boolean(stat.rate)

      const displayValue = currentAdd !== undefined ? currentAdd : add
      const shouldShowPercent = isRate || PERCENT_PARAMETERS.has(stat.parameter.toLowerCase())

      let result = label
      const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
      result += signedValue

      if (shouldShowPercent) {
        result += '%'
      }

      if (addMax !== undefined) {
        result += ` (${add}~${addMax})`
        if (shouldShowPercent) {
          result += '%'
        }
      }

      return result
    }

    /**
     * 检查是否为最大值
     */
    const isMaxValue = (stat) => {
      if (!stat || stat.addMax === undefined) return false
      const currentValue = stat.currentAdd !== undefined ? stat.currentAdd : stat.add
      return currentValue >= stat.addMax
    }

    /**
     * 检查属性是否被锁定
     */
    const isStatLocked = (index) => {
      return lockedStats.value.has(index)
    }

    /**
     * 切换属性锁定状态
     */
    const toggleStatLock = (index) => {
      const newLocked = new Set(lockedStats.value)
      if (newLocked.has(index)) {
        newLocked.delete(index)
      } else {
        newLocked.add(index)
      }
      lockedStats.value = newLocked
    }

    /**
     * 获取武器显示名称
     */
    const getWeaponDisplayName = (item) => {
      if (!item) return ''
      if (typeof item.name === 'string') return item.name
      if (item.name && item.name.cns) return item.name.cns
      return `物品ID: ${item.id}`
    }

    /**
     * 获取稀有度样式（使用 itemsStore 中的品质颜色规则）
     */
    const getRarityStyle = (rarity) => {
      const colorMap = itemsStore.rarityTextColorMap
      const key = rarity?.toLowerCase() || 'common'
      return { color: colorMap[key] || '#C0C0C0' }
    }

    /**
     * 获取稀有度文本
     */
    const getRarityText = (rarity) => {
      const texts = {
        common: '普通',
        uncommon: '优秀',
        rare: '稀有',
        veryrare: '精良',
        unique: '史诗',
        ultimate: '终极',
        mythic: '神话'
      }
      return texts[rarity?.toLowerCase()] || '普通'
    }

    /**
     * 处理图标加载错误
     */
    const handleIconError = (e) => {
      e.target.src = '/pt/item_icon/unknown.png'
    }

    /**
     * 显示物品提示框（使用全局ItemTooltip组件）
     */
    const showItemTooltip = (e, item) => {
      if (!item) return

      // 发送事件到全局物品详情信息面板
      const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
          item,
          position: {
            x: e.clientX + 15,
            y: e.clientY + 15
          },
          source: 'reset-weapon-bonus'
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    /**
     * 隐藏物品提示框
     */
    const hideItemTooltip = () => {
      const tooltipEvent = new CustomEvent('hide-item-tooltip')
      window.dispatchEvent(tooltipEvent)
    }

    /**
     * 移动物品提示框
     */
    const moveItemTooltip = (e) => {
      const tooltipEvent = new CustomEvent('move-item-tooltip', {
        detail: {
          position: {
            x: e.clientX + 15,
            y: e.clientY + 15
          }
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    /**
     * 执行洗练逻辑
     * 每次洗练从 ITEM_INFO 静态数据库中查找该武器ID的 possibleRandomStats 属性
     * 随机选择1-3个属性（1个=50%，2个=25%，3个=10%）
     * 每个选中的属性随机生成 currentAdd 值
     * 武器最多只能拥有3个属性，每次洗练都是完全重新随机
     */
    const executeReforge = () => {
      if (!selectedScroll.value || !selectedWeapon.value) {
        return { success: false, newStats: [], lockedCount: 0 }
      }

      const lockedCount = lockedStats.value.size
      const scrollCostValue = 1 + lockedCount

      // 检查卷轴数量是否足够
      const currentStack = selectedScroll.value.currentStack || 1
      if (currentStack < scrollCostValue) {
        return { success: false, newStats: [], lockedCount: 0, error: '卷轴数量不足' }
      }

      // 移除卷轴
      const removeSuccess = itemsStore.removeItemFromBag(
        SCROLL_ID,
        scrollCostValue,
        { uniqueId: selectedScroll.value.uniqueId }
      )

      if (!removeSuccess) {
        return { success: false, newStats: [], lockedCount: 0 }
      }

      // 从 ITEM_INFO 静态数据库中获取该武器ID的 possibleRandomStats 属性模板
      const weaponId = String(selectedWeapon.value.id)
      const itemConfig = ITEM_INFO[weaponId]
      const templateStats = itemConfig?.possibleRandomStats || []

      if (templateStats.length === 0) {
        return { success: true, newStats: [], lockedCount: 0 }
      }

      // 获取当前武器已有的属性
      const currentStats = selectedWeapon.value.possibleRandomStats || []

      // 获取锁定的属性（这些属性不会被替换）
      const lockedStatsList = []
      for (let i = 0; i < currentStats.length; i++) {
        if (lockedStats.value.has(i)) {
          lockedStatsList.push(currentStats[i])
        }
      }

      // 随机决定本次洗练获得的属性数量
      // 1个属性=100%（保底），2个属性=50%，3个属性=10%
      const rollRandomStatCount = () => {
        let count = 1  // 保底1个属性
        // 50%概率额外获得1个属性（变成2个）
        if (Math.random() < 0.5) {
          count = 2
          // 10%概率再额外获得1个属性（变成3个）
          if (Math.random() < 0.1) {
            count = 3
          }
        }
        return count
      }

      // 计算本次可以随机的新属性数量（最多3个属性，减去已锁定的属性数量）
      const maxNewStats = 3 - lockedStatsList.length
      let statCount = rollRandomStatCount()
      // 确保不超过最大限制
      statCount = Math.min(statCount, maxNewStats)

      // 过滤掉已锁定的属性类型，从剩余模板中随机选择
      const lockedParameters = new Set(lockedStatsList.map(s => s.parameter))
      const availableTemplates = templateStats.filter(t => !lockedParameters.has(t.parameter))

      // 从可用模板中随机选择指定数量的属性
      const selectRandomStats = (templates, count) => {
        if (count === 0 || templates.length === 0) return []
        const shuffled = [...templates].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, Math.min(count, templates.length))
      }

      const selectedTemplates = selectRandomStats(availableTemplates, statCount)

      // 为选中的属性随机生成 currentAdd 值
      const generateRandomAdd = (stat) => {
        const addMin = stat.add || 1
        const addMax = stat.addMax || stat.add || 10

        if (stat.rate) {
          // 百分比属性：保留一位小数
          const randomValue = addMin + Math.random() * (addMax - addMin)
          return Math.round(randomValue * 10) / 10
        } else {
          // 非百分比属性：取整
          return Math.floor(addMin + Math.random() * (addMax - addMin + 1))
        }
      }

      // 构建新的属性列表：锁定的属性 + 新随机的属性
      const newStats = [...lockedStatsList]

      for (const template of selectedTemplates) {
        const currentAdd = generateRandomAdd(template)
        newStats.push({
          parameter: template.parameter,
          add: template.add,
          addMax: template.addMax,
          rate: template.rate,
          currentAdd
        })
      }

      // 更新武器的 possibleRandomStats
      const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === selectedWeapon.value.uniqueId)
      if (weaponIndex !== -1) {
        itemsStore.playerBag[weaponIndex] = {
          ...itemsStore.playerBag[weaponIndex],
          possibleRandomStats: newStats
        }
      }

      // 重置锁定状态（因为属性索引可能变了）
      lockedStats.value = new Set()
      for (let i = 0; i < lockedStatsList.length; i++) {
        lockedStats.value.add(i)
      }

      return { success: true, newStats, lockedCount, statCount: selectedTemplates.length }
    }

    /**
     * 同步背包数据
     */
    const syncBagData = () => {
      try {
        if (gameStore?.player) {
          gameStore.player.bag = [...itemsStore.playerBag]
        }
      } catch (e) {
        console.warn('[ResetUltimateWeaponBonus] 同步背包数据失败:', e)
      }
    }

    /**
     * 执行单次洗练
     */
    const handleReforge = async () => {
      if (!canReforge.value || isReforging.value) return

      isReforging.value = true

      try {
        // 模拟洗练动画
        reforgeProgress.value = 0
        const duration = 500
        const startTime = Date.now()

        await new Promise(resolve => {
          const updateProgress = () => {
            const elapsed = Date.now() - startTime
            reforgeProgress.value = Math.min((elapsed / duration) * 100, 100)
            if (elapsed < duration) {
              requestAnimationFrame(updateProgress)
            } else {
              resolve()
            }
          }
          requestAnimationFrame(updateProgress)
        })

        // 执行洗练
        const result = executeReforge()

        if (result.success) {
          emit('play-sfx', 'InfUpgradeSuccess.wav')

          // 构建新属性描述
          const statCount = result.statCount ?? 0
          if (statCount === 0) {
            emit('add-battle-log', '洗练完成，本次未获得新属性', 'warning')
            emit('show-animation-message', '未获得属性', 'upgrade-fail')
          } else {
            const statNames = result.newStats.map(stat => formatRandomStat(stat))
            emit('add-battle-log', `洗练成功！获得 ${statCount} 个属性：${statNames.join('、')}`, 'success')
            emit('show-animation-message', `获得 ${statCount} 个属性！`, 'upgrade-success')
          }

          // 检查是否洗出了极限属性
          const maxStat = findMaxValueStat(result.newStats)
          if (maxStat) {
            const maxStatNameText = formatRandomStat(maxStat)
            emit('add-battle-log', `恭喜！洗出了极限属性：${maxStatNameText}`, 'success')
            emit('play-sfx', '/music/曼波.mp3')
          } else {
            setTimeout(() => {
              emit('play-sfx', 'InfGroundPickup.wav')
            }, 300)
          }

          syncBagData()
        } else {
          emit('play-sfx', 'InfUpgradeFail.wav')
          emit('add-battle-log', '洗练失败！材料不足', 'error')
        }
      } catch (error) {
        console.error('[ResetUltimateWeaponBonusModal] 洗练失败:', error)
        emit('add-battle-log', '洗练失败：发生错误', 'error')
      } finally {
        isReforging.value = false
        reforgeProgress.value = 0
      }
    }

    /**
     * 查找极限值属性
     */
    const findMaxValueStat = (stats) => {
      if (!stats || stats.length === 0) return null
      for (let i = 0; i < stats.length; i++) {
        // 跳过锁定的属性
        if (lockedStats.value.has(i)) continue
        const stat = stats[i]
        if (isMaxValue(stat)) {
          return stat
        }
      }
      return null
    }

    /**
     * 执行自动洗练
     */
    const handleAutoReforge = async () => {
      if (isAutoReforging.value) {
        shouldStopAutoReforge.value = true
        return
      }

      if (!canReforge.value) return

      shouldStopAutoReforge.value = false
      isAutoReforging.value = true

      try {
        while (!shouldStopAutoReforge.value && canReforge.value) {
          await handleReforge()

          // 检查是否有属性达到最大值
          const maxStat = findMaxValueStat(weaponPossibleRandomStats.value)
          if (maxStat) {
            // 发现达到最大值的属性，弹出二次确认
            maxValueStatInfo.value = maxStat
            showMaxValueConfirm.value = true

            // 等待用户确认或取消
            await new Promise(resolve => {
              const unwatch = watch(showMaxValueConfirm, (newVal) => {
                if (!newVal) {
                  unwatch()
                  resolve()
                }
              })
            })

            // 如果用户取消了，停止自动洗练
            if (shouldStopAutoReforge.value) {
              break
            }
          }

          // 检查是否所有未锁定的属性都达到最大值
          const allUnlockedMax = weaponPossibleRandomStats.value.every((stat, index) => 
            lockedStats.value.has(index) || isMaxValue(stat)
          )

          if (allUnlockedMax) {
            emit('add-battle-log', '所有未锁定属性已达到极限值！', 'success')
            break
          }

          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } finally {
        isAutoReforging.value = false
      }
    }

    /**
     * 确认继续自动洗练
     */
    const confirmContinueAutoReforge = () => {
      showMaxValueConfirm.value = false
      maxValueStatInfo.value = null
    }

    /**
     * 取消自动洗练
     */
    const cancelAutoReforge = () => {
      showMaxValueConfirm.value = false
      maxValueStatInfo.value = null
      shouldStopAutoReforge.value = true
    }

    // ========== 生命周期 ==========
    onMounted(() => {
      // 自动选择第一个卷轴
      if (scrollItems.value.length > 0) {
        selectedScrollId.value = scrollItems.value[0].uniqueId || scrollItems.value[0].id
      }
    })

    // 监听点击外部关闭下拉面板
    const handleClickOutside = (e) => {
      if (showScrollPanel.value && scrollPanelRef.value && !scrollPanelRef.value.contains(e.target) && !selectScrollBoxRef.value.contains(e.target)) {
        showScrollPanel.value = false
      }
      if (showWeaponPanel.value && weaponPanelRef.value && !weaponPanelRef.value.contains(e.target) && !selectWeaponBoxRef.value.contains(e.target)) {
        showWeaponPanel.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      shouldStopAutoReforge.value = true
    })

    return {
      // 常量
      SCROLL_ID,

      // 状态
      isVisible,
      modalContainerRef,
      selectScrollBoxRef,
      selectWeaponBoxRef,
      scrollPanelRef,
      weaponPanelRef,
      selectedScrollId,
      selectedWeaponId,
      showScrollPanel,
      showWeaponPanel,
      isReforging,
      isAutoReforging,
      reforgeProgress,
      lockedStats,
      showMaxValueConfirm,
      maxValueStatInfo,
      showInfoPanel,
      infoPanelRef,

      // 计算属性
      modalStyle,
      scrollItems,
      weaponItems,
      selectedScroll,
      selectedWeapon,
      weaponPossibleRandomStats,
      selectedWeaponPossibleRandomStats,
      infoPanelStyle,
      canReforge,
      scrollCost,
      scrollPanelStyle,
      weaponPanelStyle,

      // 方法
      handleClose,
      startDrag,
      toggleScrollPanel,
      toggleWeaponPanel,
      selectScroll,
      selectWeapon,
      formatAbility,
      formatRandomStat,
      formatStatParameter,
      formatStatRange,
      toggleInfoPanel,
      isMaxValue,
      isStatLocked,
      toggleStatLock,
      getWeaponDisplayName,
      getRarityStyle,
      getRarityText,
      handleIconError,
      showItemTooltip,
      hideItemTooltip,
      moveItemTooltip,
      handleReforge,
      handleAutoReforge,
      findMaxValueStat,
      confirmContinueAutoReforge,
      cancelAutoReforge
    }
  }
}
</script>

<style scoped>
/* 容器样式 - 参考珠宝大师面板 */
.reset-weapon-container {
  position: fixed;
  width: 420px;
  max-width: 90vw;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 10000;
  user-select: none;
}

/* 头部样式 - 参考珠宝大师面板 */
.reset-weapon-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
}

.reset-weapon-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-weapon-scroll-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #6a6a8a;
  object-fit: contain;
}

.reset-weapon-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.reset-weapon-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-weapon-close-btn {
  width: 32px;
  height: 32px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-weapon-close-btn:hover {
  background: #ff4444;
}

/* 帮助按钮样式 - 参考珠宝大师面板 */
.reset-weapon-help-btn {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #4a6a9a 0%, #3a5a8a 100%);
  border: 2px solid #6a8aba;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-weapon-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.reset-weapon-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

/* 信息面板样式 - 参考珠宝大师规则面板 */
.reset-weapon-info-panel {
  position: fixed;
  min-width: 200px;
  max-width: 280px;
  background: linear-gradient(180deg, rgba(30, 25, 45, 0.98) 0%, rgba(20, 15, 35, 0.99) 100%);
  border: 2px solid #8b5a2b;
  border-radius: 10px;
  box-shadow: 5px 0 20px rgba(0, 0, 0, 0.5);
  z-index: 10001;
  overflow: visible;
}

.info-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(139, 90, 43, 0.3) 0%, rgba(139, 90, 43, 0.1) 100%);
  border-bottom: 1px solid rgba(139, 90, 43, 0.5);
}

.info-panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.info-panel-body {
  padding: 12px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.info-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 6px;
  border-left: 2px solid #8b5a2b;
}

.info-stat-item:last-child {
  margin-bottom: 0;
}

.info-stat-name {
  font-size: 12px;
  color: #e3e102;
}

.info-stat-range {
  font-size: 12px;
  color: #7cfc00;
  font-weight: bold;
}

.info-empty {
  text-align: center;
  color: #888;
  font-size: 12px;
  padding: 20px;
}

/* 信息面板过渡动画 */
.info-panel-fade-enter-active,
.info-panel-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.info-panel-fade-enter-from,
.info-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 主体样式 */
.reset-weapon-body {
  padding: 16px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

/* 区域样式 */
.reset-weapon-section {
  margin-bottom: 16px;
}

.reset-weapon-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #aaa;
  margin-bottom: 8px;
  padding-left: 4px;
}

/* 选择框样式 */
.reset-weapon-select-box {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-weapon-select-box:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #6a6a8a;
}

.reset-weapon-select-box.active {
  border-color: #8b5a2b;
  box-shadow: 0 0 10px rgba(139, 90, 43, 0.3);
}

.reset-weapon-select-box.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-weapon-select-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-right: 12px;
  border-radius: 6px;
}

.reset-weapon-select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reset-weapon-select-name {
  font-size: 14px;
  color: #fff;
}

.reset-weapon-select-count,
.reset-weapon-select-level {
  font-size: 12px;
  color: #888;
}

.reset-weapon-select-placeholder {
  flex: 1;
  font-size: 14px;
  color: #666;
}

.reset-weapon-select-arrow {
  font-size: 12px;
  color: #6a6a8a;
  transition: transform 0.2s;
}

.reset-weapon-select-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉面板样式 */
.reset-weapon-popup-panel {
  position: absolute;
  width: calc(100% - 32px);
  max-height: 300px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  overflow-y: auto;
  z-index: 10001;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
}

.reset-weapon-popup-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
}

.reset-weapon-popup-item:hover {
  background: rgba(139, 90, 43, 0.2);
}

.reset-weapon-popup-item.selected {
  background: rgba(139, 90, 43, 0.3);
}

.reset-weapon-popup-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-right: 10px;
  border-radius: 4px;
}

.reset-weapon-popup-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reset-weapon-popup-name {
  font-size: 13px;
  color: #fff;
}

.reset-weapon-popup-count {
  font-size: 11px;
  color: #888;
}

.weapon-panel {
  max-height: 280px;
}

/* 属性列表样式 */
.reset-weapon-abilities {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid rgba(139, 90, 43, 0.3);
}

.reset-weapon-ability-line {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}

.reset-weapon-ability-line:last-child {
  margin-bottom: 0;
}

.reset-weapon-ability-line.is-max {
  border-left-color: #ff9900;
  background: rgba(255, 153, 0, 0.1);
}

.reset-weapon-ability-line.is-locked {
  opacity: 0.7;
}

.ability-text {
  flex: 1;
  font-size: 13px;
  color: #e3e102;
}

.max-value-tag {
  font-size: 11px;
  color: #ff9900;
  background: rgba(255, 153, 0, 0.2);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

/* 锁定开关样式 */
.ability-lock-toggle {
  width: 40px;
  height: 20px;
  background: #333;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  margin-left: 8px;
  transition: all 0.2s;
}

.ability-lock-toggle.locked {
  background: #8b5a2b;
}

.lock-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.2s;
}

.ability-lock-toggle.locked .lock-slider {
  left: 22px;
}

.lock-slider-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.lock-icon {
  font-size: 10px;
}

/* 进度条样式 */
.reforge-progress-container {
  position: relative;
  height: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.reforge-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5a2b 0%, #d4a54a 100%);
  transition: width 0.1s;
}

.reforge-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #fff;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

/* 消耗信息样式 */
.consume-info {
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(139, 90, 43, 0.2);
}

.consume-text {
  font-size: 13px;
  color: #aaa;
}

.consume-highlight {
  color: #ff9900;
  font-weight: bold;
}

.locked-info {
  color: #d4a54a;
  margin-left: 4px;
}

/* 操作按钮样式 */
.reset-weapon-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.reforge-btn {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reforge-btn.single-reforge {
  background: linear-gradient(180deg, #6a5a3a 0%, #4a3a2a 100%);
  color: #ffd700;
  border: 1px solid #8b5a2b;
}

.reforge-btn.single-reforge:hover:not(:disabled) {
  background: linear-gradient(180deg, #8b7a5a 0%, #6a5a3a 100%);
  border-color: #d4a54a;
}

.reforge-btn.auto-reforge {
  background: linear-gradient(180deg, #ff9900 0%, #cc7700 100%);
  color: #fff;
}

.reforge-btn.auto-reforge:hover:not(:disabled) {
  background: linear-gradient(180deg, #ffaa33 0%, #ff9900 100%);
}

.reforge-btn.auto-reforge.active {
  background: linear-gradient(180deg, #ff4444 0%, #cc2222 100%);
  animation: pulse 1s infinite;
}

.reforge-btn.auto-reforge.active:hover {
  background: linear-gradient(180deg, #ff6666 0%, #ff4444 100%);
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 68, 68, 0);
  }
}

.reforge-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 自动洗练按钮在激活状态时不显示禁用样式 */
.reforge-btn.auto-reforge.active {
  opacity: 1;
  cursor: pointer;
}

/* 过渡动画 */
.reset-weapon-fade-enter-active,
.reset-weapon-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.reset-weapon-fade-enter-from,
.reset-weapon-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

/* 二次确认弹窗样式 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
}

.confirm-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #8b5a2b;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.confirm-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-align: center;
  margin-bottom: 16px;
}

.confirm-content {
  font-size: 14px;
  color: #ccc;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.6;
}

.confirm-content p {
  margin: 8px 0;
}

.max-stat-name {
  color: #ff9900;
  font-weight: bold;
}

.confirm-warning {
  color: #ff6666;
  font-size: 12px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn.cancel {
  background: linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%);
  color: #fff;
}

.confirm-btn.cancel:hover {
  background: linear-gradient(180deg, #5a5a7a 0%, #4a4a6a 100%);
}

.confirm-btn.continue {
  background: linear-gradient(180deg, #8b5a2b 0%, #6a4a1b 100%);
  color: #ffd700;
  border: 1px solid #d4a54a;
}

.confirm-btn.continue:hover {
  background: linear-gradient(180deg, #a06a3b 0%, #8b5a2b 100%);
}
</style>
