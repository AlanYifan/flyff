<!--
  重置史诗＆终极武器特殊属性面板
  使用道具ID 12252（终极之力卷轴）后打开
  功能：重置武器的 abilities 属性值
-->
<template>
  <transition name="reset-weapon-fade">
    <div v-if="isVisible" ref="modalContainerRef" class="reset-weapon-container" :style="modalStyle">
      <!-- 头部（可拖拽） -->
      <div class="reset-weapon-header" @pointerdown="startDrag">
        <div class="reset-weapon-title-wrapper">
          <img src="/pt/item_icon/12252.png" class="reset-weapon-scroll-icon" alt="终极之力卷轴" />
          <h2 class="reset-weapon-title">重置史诗＆终极武器特殊属性</h2>
          <button 
            class="reset-weapon-help-btn" 
            @click.stop="toggleInfoPanel"
            @pointerdown.stop
            :class="{ active: showInfoPanel }"
          >?</button>
        </div>
        <button class="reset-weapon-close-btn" @click="handleClose">×</button>
      </div>

      <!-- 主体内容 -->
      <div class="reset-weapon-body">
        <!-- 1. 终极之力卷轴选择区域 -->
        <div class="reset-weapon-section">
          <div class="reset-weapon-section-title">终极之力卷轴</div>
          <div
            ref="selectScrollBoxRef"
            class="reset-weapon-select-box"
            :class="{ active: showScrollPanel, disabled: scrollItems.length === 0 }"
            @click="toggleScrollPanel"
          >
            <template v-if="selectedScroll">
              <img :src="selectedScroll.icon" class="reset-weapon-select-icon" @error="handleIconError" @mouseenter="showItemTooltip($event, selectedScroll)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
              <div class="reset-weapon-select-info">
                <span class="reset-weapon-select-name">终极之力卷轴</span>
                <span class="reset-weapon-select-count">×{{ selectedScroll.currentStack || 1 }}</span>
              </div>
            </template>
            <span v-else class="reset-weapon-select-placeholder">
              {{ scrollItems.length === 0 ? '未找到终极之力卷轴，请去钻石商店购买' : '选择终极之力卷轴' }}
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
                <span class="reset-weapon-popup-name">终极之力卷轴</span>
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
              <img :src="selectedWeapon.icon" class="reset-weapon-select-icon" @error="handleIconError" />
              <div class="reset-weapon-select-info">
                <span class="reset-weapon-select-name" :style="getRarityStyle(selectedWeapon.rarity)">{{ getWeaponDisplayName(selectedWeapon) }}</span>
                <span class="reset-weapon-select-level">
                  +{{ selectedWeapon.enhanceLevel || 0 }} ·
                  <span :style="getRarityStyle(selectedWeapon.rarity)">{{ getRarityText(selectedWeapon.rarity) }}</span>
                </span>
              </div>
            </template>
            <span v-else class="reset-weapon-select-placeholder">
              {{ weaponItems.length === 0 ? '背包中没有可洗练的武器' : '选择要洗练的武器' }}
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

        <!-- 3. 当前武器属性显示 -->
        <div v-if="selectedWeapon && weaponAbilities.length > 0" class="reset-weapon-section">
          <div class="reset-weapon-section-title">当前属性</div>
          <div class="reset-weapon-abilities">
            <div
              v-for="(ability, index) in weaponAbilities"
              :key="index"
              class="reset-weapon-ability-line"
              :class="{ 'is-max': isMaxValue(ability), 'is-locked': isAbilityLocked(index) }"
            >
              <span class="ability-text">{{ formatAbility(ability) }}</span>
              <span v-if="isMaxValue(ability)" class="max-value-tag">极限</span>
              <!-- 上锁/解锁滑动块 -->
              <div
                class="ability-lock-toggle"
                :class="{ locked: isAbilityLocked(index) }"
                @click="toggleAbilityLock(index)"
                :title="isAbilityLocked(index) ? '点击解锁此属性（洗练时不会被随机）' : '点击锁定此属性（洗练时保持不变）'"
              >
                <div class="lock-slider">
                  <div class="lock-slider-thumb">
                    <span class="lock-icon">{{ isAbilityLocked(index) ? '🔒' : '🔓' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 洗练进度条 -->
        <div v-if="isReforging || isAutoReforging" class="reset-weapon-section">
          <div class="reset-weapon-section-title">洗练进度</div>
          <div class="reset-weapon-progress-bar">
            <div class="reset-weapon-progress-fill" :style="{ width: progressPercent + '%' }"></div>
            <span class="reset-weapon-progress-text">{{ Math.floor(progressPercent) }}%</span>
          </div>
        </div>

        <!-- 5. 操作按钮 -->
        <div class="reset-weapon-actions">
          <button
            class="reset-weapon-btn auto-btn"
            :disabled="!canReforge || isReforging"
            @click="handleAutoReforge"
          >
            {{ isAutoReforging ? '停止自动洗练' : '自动洗练' }}
          </button>
          <button
            class="reset-weapon-btn reforge-btn"
            :disabled="!canReforge || isReforging"
            @click="handleReforge"
          >
            洗练 <span class="scroll-cost-hint">(消耗{{ scrollCost }}个)</span>
          </button>
        </div>
      </div>

      <!-- 极限属性确认对话框 -->
      <transition name="confirm-fade">
        <div v-if="showMaxValueConfirm" class="max-value-confirm-overlay">
          <div class="max-value-confirm-dialog">
            <div class="confirm-title">
              <span class="confirm-icon">🎉</span>
              恭喜！洗出极限属性！
            </div>
            <div class="confirm-content">
              <div class="confirm-ability">{{ maxAbilityName }}</div>
              <div class="confirm-desc">已达到该属性的最大值！</div>
              <div class="confirm-question">是否继续自动洗练？</div>
            </div>
            <div class="confirm-actions">
              <button class="confirm-btn stop-btn" @click="cancelContinueReforge">
                停止洗练
              </button>
              <button class="confirm-btn continue-btn" @click="confirmContinueReforge">
                继续洗练
              </button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 自动洗练开始确认对话框 -->
      <transition name="confirm-fade">
        <div v-if="showAutoReforgeConfirm" class="max-value-confirm-overlay">
          <div class="max-value-confirm-dialog auto-reforge-confirm">
            <div class="confirm-title">
              <span class="confirm-icon">⚙️</span>
              开始自动洗练
            </div>
            <div class="confirm-content">
              <div class="confirm-desc">将自动消耗卷轴进行洗练</div>
              <div class="confirm-info">
                <div class="info-item">每次消耗：<span class="highlight">{{ scrollCost }}个</span> 卷轴</div>
                <div class="info-item">锁定属性：<span class="highlight">{{ lockedAbilities.size }}个</span></div>
              </div>
              <div class="confirm-warning">⚠️ 洗出极限属性时会暂停确认</div>
            </div>
            <div class="confirm-actions">
              <button class="confirm-btn stop-btn" @click="cancelStartAutoReforge">
                取消
              </button>
              <button class="confirm-btn continue-btn" @click="confirmStartAutoReforge">
                开始洗练
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>

<!-- 武器属性范围信息面板（独立于主面板，显示在右侧外部） -->
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
v-for="(ability, index) in selectedWeaponAbilities"
:key="`info-ability-${index}`"
class="info-stat-item"
>
<span class="info-stat-name" style="color: #e3d090">{{ formatAbilityParameter(ability.parameter) }}</span>
<span class="info-stat-range" style="color: #e3d090">
{{ formatAbilityRange(ability) }}
</span>
</div>
<div v-if="!selectedWeaponAbilities.length" class="info-empty">
该武器没有可洗练的属性
</div>
</div>
</div>
</transition>
</template>

<script>
/**
 * 重置史诗＆终极武器特殊属性面板
 * 使用道具ID 12252 后打开
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store/index'
import { storageService } from '@/services/StorageService'
import { formatAbility as formatAbilityUtil } from '@/utils/effectFormatter'

// 终极之力卷轴ID
const SCROLL_ID = 12252

export default {
  name: 'ResetWeaponAttributeModal',

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
    const modalPosition = ref(null)
    const isDragging = ref(false)
    const dragStartPos = ref({ x: 0, y: 0 })
    const dragStartModalPos = ref({ x: 0, y: 0 })

    // 选择状态
    const selectedScrollId = ref(null)
    const selectedWeaponId = ref(null)
    const showScrollPanel = ref(false)
    const showWeaponPanel = ref(false)

    // 洗练状态
    const isReforging = ref(false)
    const isAutoReforging = ref(false)
    const shouldStopAutoReforge = ref(false)
    const progressPercent = ref(0)
    let progressRafId = null

    // 属性锁定状态（存储被锁定的属性索引）
    const lockedAbilities = ref(new Set())

    // 极限属性确认对话框状态
    const showMaxValueConfirm = ref(false)
    const maxAbilityName = ref('')
    let continueAutoReforgeResolve = null

// 自动洗练开始确认对话框状态
const showAutoReforgeConfirm = ref(false)
let startAutoReforgeResolve = null

// 信息面板状态
const showInfoPanel = ref(false)
const infoPanelRef = ref(null)

    // ========== 计算属性 ==========

    /**
     * 模态框样式
     */
    const modalStyle = computed(() => {
      if (!modalPosition.value) {
        return {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }
      }
      return {
        left: `${modalPosition.value.x}px`,
        top: `${modalPosition.value.y}px`,
        transform: 'none'
      }
    })

    /**
     * 获取背包中的终极之力卷轴
     */
    const scrollItems = computed(() => {
      return itemsStore.playerBag.filter(item => Number(item.id) === SCROLL_ID)
    })

    /**
     * 获取背包中可洗练的武器（带有 abilities 属性且有 addMax 值的武器）
     */
    const weaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 检查是否有 abilities 属性且长度大于0
        if (!item.abilities || !Array.isArray(item.abilities) || item.abilities.length === 0) {
          return false
        }
        // 检查 abilities 中是否至少有一个属性有 addMax 值
        const hasAddMax = item.abilities.some(ability => ability.addMax !== undefined && ability.addMax > 0)
        if (!hasAddMax) {
          return false
        }
        // 检查是否为武器类型
        const category = (item.category || '').toLowerCase()
        const subcategory = (item.subcategory || '').toLowerCase()
        const isWeapon = category === 'weapon' ||
          subcategory.includes('sword') ||
          subcategory.includes('axe') ||
          subcategory.includes('staff') ||
          subcategory.includes('wand') ||
          subcategory.includes('bow') ||
          subcategory.includes('knuckle') ||
          subcategory.includes('stick') ||
          subcategory.includes('yoyo')
        return isWeapon
      })
    })

    /**
     * 选中的卷轴
     * 卷轴是可堆叠物品，可能没有 uniqueId，需要同时匹配 uniqueId 和 id
     */
    const selectedScroll = computed(() => {
      if (!selectedScrollId.value) return null
      // 先尝试通过 uniqueId 查找
      let found = itemsStore.playerBag.find(item => item.uniqueId === selectedScrollId.value)
      // 如果没找到，尝试通过 id 查找
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
     * 选中武器的 abilities 属性列表
     */
    const weaponAbilities = computed(() => {
      if (!selectedWeapon.value || !selectedWeapon.value.abilities) {
        return []
      }
      return selectedWeapon.value.abilities
    })

    /**
     * 选中武器的 abilities 属性（用于信息面板显示）
     * 从 ITEM_INFO 获取原始的 add~addMax 范围
     */
    const selectedWeaponAbilities = computed(() => {
      if (!selectedWeapon.value) return []
      // 优先使用武器实例上的 abilities
      if (selectedWeapon.value.abilities && Array.isArray(selectedWeapon.value.abilities)) {
        return selectedWeapon.value.abilities
      }
      return []
    })

    /**
     * 信息面板位置样式（在主面板右侧外部，从上到下贴合）
     * 使用 modalPosition 响应式变量确保拖动时位置同步更新
     */
    const infoPanelStyle = computed(() => {
      // 使用 modalPosition.value 确保拖动时触发更新
      const _ = modalPosition.value
      if (!modalContainerRef.value) return {}
      const containerRect = modalContainerRef.value.getBoundingClientRect()
      return {
        position: 'fixed',
        left: `${containerRect.right + 8}px`,
        top: `${containerRect.top}px`
      }
    })

    /**
     * 检查是否可以洗练
     */
    const canReforge = computed(() => {
      // 必须选中卷轴和武器
      if (!selectedScroll.value || !selectedWeapon.value) return false
      // 计算需要消耗的卷轴数量：基础1个 + 每锁定一个属性额外消耗1个
      const scrollCost = 1 + lockedAbilities.value.size
      // 卷轴数量必须足够
      if ((selectedScroll.value.currentStack || 0) < scrollCost) return false
      return true
    })

    /**
     * 计算洗练需要消耗的卷轴数量
     */
    const scrollCost = computed(() => {
      return 1 + lockedAbilities.value.size
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
const formatAbilityParameter = (parameter) => {
  if (!parameter) return ''
  // 使用 formatAbilityUtil 格式化
  const formatted = formatAbilityUtil({ parameter, add: 0, rate: false })
  if (!formatted) return parameter
  // 提取属性名称部分
  const parts = formatted.split(' ')
  return parts[0] || parameter
}

/**
 * 格式化属性范围显示
 * @param {Object} ability - 属性对象
 * @returns {string} 格式化后的范围字符串
 */
const formatAbilityRange = (ability) => {
  if (!ability) return ''
  const add = ability.add !== undefined ? ability.add : 0
  const addMax = ability.addMax !== undefined ? ability.addMax : add
  const isRate = ability.rate === true

  if (add === addMax) {
    return isRate ? `${add}%` : `${add}`
  }
  return isRate ? `${add}%~${addMax}%` : `${add}~${addMax}`
}

/**
* 关闭面板
*/
const handleClose = () => {
// 停止自动洗练
shouldStopAutoReforge.value = true
isAutoReforging.value = false
emit('close')
}

    /**
     * 开始拖拽
     */
    const startDrag = (event) => {
      if (event.target.closest('.reset-weapon-close-btn')) return
      isDragging.value = true
      dragStartPos.value = { x: event.clientX, y: event.clientY }
      if (!modalPosition.value) {
        const rect = modalContainerRef.value?.getBoundingClientRect()
        if (rect) {
          modalPosition.value = { x: rect.left, y: rect.top }
        }
      }
      dragStartModalPos.value = { ...modalPosition.value }
      document.addEventListener('pointermove', onDrag)
      document.addEventListener('pointerup', endDrag)
    }

    /**
     * 拖拽中
     */
    const onDrag = (event) => {
      if (!isDragging.value) return
      const deltaX = event.clientX - dragStartPos.value.x
      const deltaY = event.clientY - dragStartPos.value.y
      modalPosition.value = {
        x: dragStartModalPos.value.x + deltaX,
        y: dragStartModalPos.value.y + deltaY
      }
    }

    /**
     * 结束拖拽
     */
    const endDrag = () => {
      isDragging.value = false
      document.removeEventListener('pointermove', onDrag)
      document.removeEventListener('pointerup', endDrag)
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
     * 卷轴是可堆叠物品，没有 uniqueId，使用 id 作为标识
     */
    const selectScroll = (item) => {
      // 对于可堆叠物品，使用 id 或 uniqueId
      selectedScrollId.value = item.uniqueId || item.id
      showScrollPanel.value = false
      // 选择后关闭物品详情提示
      hideItemTooltip()
    }

    /**
     * 选择武器
     */
    const selectWeapon = (item) => {
      selectedWeaponId.value = item.uniqueId
      showWeaponPanel.value = false
      // 选择后关闭物品详情提示
      hideItemTooltip()
    }

    /**
     * 获取武器显示名称
     */
    const getWeaponDisplayName = (item) => {
      if (!item) return ''
      const itemConfig = itemsStore.getItemConfig(item.id)
      if (itemConfig) {
        return typeof itemConfig.name === 'string' ? itemConfig.name : itemConfig.name?.cns || `武器#${item.id}`
      }
      return item.name || `武器#${item.id}`
    }

    /**
     * 获取品质显示文本
     */
    const getRarityText = (rarity) => {
      const rarityMap = {
        common: '普通',
        uncommon: '罕见',
        rare: '稀有',
        veryrare: '极稀有',
        unique: '史诗',
        ultimate: '终极',
        mythic: '神话'
      }
      return rarityMap[(rarity || '').toLowerCase()] || '普通'
    }

    /**
     * 获取品质对应的文本样式
     */
    const getRarityStyle = (rarity) => {
      return itemsStore.getRarityTextStyle(rarity)
    }

    /**
     * 格式化属性显示
     */
    const formatAbility = (ability) => {
      if (!ability) return ''
      return formatAbilityUtil(ability)
    }

    /**
     * 判断属性值是否达到最大值
     * @param {Object} ability - 属性对象
     * @returns {boolean} 是否达到最大值
     */
    const isMaxValue = (ability) => {
      if (!ability) return false
      // 需要有 addMax 字段才能判断
      if (ability.addMax === undefined || ability.addMax === null) return false
      // 需要有 currentAdd 字段（洗练后的值）
      if (ability.currentAdd === undefined || ability.currentAdd === null) return false
      // 比较 currentAdd 和 addMax
      return ability.currentAdd >= ability.addMax
    }

    /**
     * 判断属性是否被锁定
     * @param {number} index - 属性索引
     * @returns {boolean} 是否被锁定
     */
    const isAbilityLocked = (index) => {
      return lockedAbilities.value.has(index)
    }

    /**
     * 切换属性锁定状态
     * @param {number} index - 属性索引
     */
    const toggleAbilityLock = (index) => {
      const newSet = new Set(lockedAbilities.value)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      lockedAbilities.value = newSet
    }

    /**
     * 检查属性数组中是否有达到最大值的属性（忽略锁定的属性）
     * @param {Array} abilities - 属性数组
     * @returns {Object|null} 返回第一个达到最大值且未锁定的属性信息，或 null
     */
    const findMaxValueAbility = (abilities) => {
      if (!abilities || abilities.length === 0) return null
      for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i]
        // 跳过锁定的属性
        if (lockedAbilities.value.has(i)) continue
        // 检查是否达到最大值
        if (ability.addMax !== undefined && ability.addMax !== null &&
            ability.currentAdd !== undefined && ability.currentAdd !== null &&
            ability.currentAdd >= ability.addMax) {
          return ability
        }
      }
      return null
    }

    /**
     * 等待用户确认是否继续自动洗练
     * @returns {Promise<boolean>} 用户是否选择继续
     */
    const waitForContinueConfirm = () => {
      return new Promise((resolve) => {
        continueAutoReforgeResolve = resolve
        showMaxValueConfirm.value = true
      })
    }

    /**
     * 用户确认继续自动洗练
     */
    const confirmContinueReforge = () => {
      showMaxValueConfirm.value = false
      if (continueAutoReforgeResolve) {
        continueAutoReforgeResolve(true)
        continueAutoReforgeResolve = null
      }
    }

    /**
     * 用户取消继续自动洗练
     */
    const cancelContinueReforge = () => {
      showMaxValueConfirm.value = false
      if (continueAutoReforgeResolve) {
        continueAutoReforgeResolve(false)
        continueAutoReforgeResolve = null
      }
    }

    /**
     * 等待用户确认是否开始自动洗练
     * @returns {Promise<boolean>} 用户是否选择开始
     */
    const waitForStartConfirm = () => {
      return new Promise((resolve) => {
        startAutoReforgeResolve = resolve
        showAutoReforgeConfirm.value = true
      })
    }

    /**
     * 用户确认开始自动洗练
     */
    const confirmStartAutoReforge = () => {
      showAutoReforgeConfirm.value = false
      if (startAutoReforgeResolve) {
        startAutoReforgeResolve(true)
        startAutoReforgeResolve = null
      }
    }

    /**
     * 用户取消开始自动洗练
     */
    const cancelStartAutoReforge = () => {
      showAutoReforgeConfirm.value = false
      if (startAutoReforgeResolve) {
        startAutoReforgeResolve(false)
        startAutoReforgeResolve = null
      }
    }

    /**
     * 图标加载错误处理
     */
    const handleIconError = (event) => {
      event.target.src = '/pt/Icon_res/default_item.png'
    }

    /**
     * 显示物品提示
     */
    const showItemTooltip = (event, item) => {
      if (typeof window !== 'undefined') {
        const tooltipEvent = new CustomEvent('show-item-tooltip', {
          detail: {
            item: item,
            position: { x: event.clientX + 10, y: event.clientY + 10 }
          }
        })
        window.dispatchEvent(tooltipEvent)
      }
    }

    /**
     * 隐藏物品提示
     */
    const hideItemTooltip = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
      }
    }

    /**
     * 开始洗练进度条动画
     * @param {number} duration - 进度条完成时间（毫秒）
     * @returns {Promise} 进度完成后的 Promise
     */
    const startProgress = (duration = 1000) => {
      return new Promise((resolve) => {
        if (progressRafId) {
          cancelAnimationFrame(progressRafId)
          progressRafId = null
        }

        progressPercent.value = 0
        const startTime = performance.now()

        const updateProgress = (currentTime) => {
          const elapsed = currentTime - startTime
          const progress = Math.min((elapsed / duration) * 100, 100)
          progressPercent.value = progress

          if (progress >= 100) {
            progressRafId = null
            resolve()
          } else {
            progressRafId = requestAnimationFrame(updateProgress)
          }
        }

        progressRafId = requestAnimationFrame(updateProgress)
      })
    }

    /**
     * 执行单次洗练
     * @returns {Object} { success: boolean, newAbilities: Array, lockedCount: number }
     */
    const executeReforge = () => {
      if (!selectedScroll.value || !selectedWeapon.value) {
        return { success: false, newAbilities: [], lockedCount: 0 }
      }

      // 计算需要消耗的卷轴数量：基础1个 + 每锁定一个属性额外消耗1个
      const lockedCount = lockedAbilities.value.size
      const scrollCost = 1 + lockedCount

      // 检查卷轴数量是否足够
      const currentStack = selectedScroll.value.currentStack || 1
      if (currentStack < scrollCost) {
        return { success: false, newAbilities: [], lockedCount: 0, error: '卷轴数量不足' }
      }

      // 移除卷轴（基础1个 + 锁定属性数量）
      const removeSuccess = itemsStore.removeItemFromBag(
        SCROLL_ID,
        scrollCost,
        { uniqueId: selectedScroll.value.uniqueId }
      )

      if (!removeSuccess) {
        return { success: false, newAbilities: [], lockedCount: 0 }
      }

      // 获取武器的 abilities
      const abilities = selectedWeapon.value.abilities
      if (!abilities || abilities.length === 0) {
        return { success: true, newAbilities: [], lockedCount: 0 }
      }

      // 随机洗练每个属性的 currentAdd 值（跳过锁定的属性）
      // add: 最小值（固定），addMax: 最大值（固定），currentAdd: 当前洗练值
      const newAbilities = abilities.map((ability, index) => {
        const newAbility = { ...ability }

        // 如果该属性被锁定，保持原值不变
        if (lockedAbilities.value.has(index)) {
          // 保持原有的 currentAdd 值不变
          return newAbility
        }

        // 获取最小最大值范围
        const addMin = ability.add || 1
        const addMax = ability.addMax || ability.add || 10

        // 随机范围：add - addMax，结果存入 currentAdd
        if (ability.rate) {
          // 百分比属性：保留一位小数
          const randomValue = addMin + Math.random() * (addMax - addMin)
          newAbility.currentAdd = Math.round(randomValue * 10) / 10
        } else {
          // 非百分比属性：取整
          newAbility.currentAdd = Math.floor(addMin + Math.random() * (addMax - addMin + 1))
        }

        return newAbility
      })

      // 更新武器的 abilities
      const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === selectedWeapon.value.uniqueId)
      if (weaponIndex !== -1) {
        itemsStore.playerBag[weaponIndex] = {
          ...itemsStore.playerBag[weaponIndex],
          abilities: newAbilities
        }
      }

      return { success: true, newAbilities, lockedCount }
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
        console.warn('[ResetWeapon] 同步到gameStore失败:', e)
      }

      try {
        // storageService 已通过 import 导入全局单例
        storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
      } catch (e) {
        console.warn('[ResetWeapon] 保存背包数据到 localStorage 失败:', e)
      }
    }

    /**
     * 处理单次洗练
     */
    const handleReforge = async () => {
      if (!canReforge.value || isReforging.value) return

      isReforging.value = true

      try {
        // 等待进度条完成
        await startProgress(1000)

        // 执行洗练
        const result = executeReforge()

        if (result.success) {
          emit('play-sfx', 'InfUpgradeSuccess.wav')

          // 构建新属性描述
          const statNames = result.newAbilities.map(ability => formatAbility(ability))
          emit('add-battle-log', `洗练成功！新属性：${statNames.join('、')}`, 'success')
          emit('show-animation-message', '洗练成功！', 'upgrade-success')

          // 检查是否洗出了极限属性
          const maxAbility = findMaxValueAbility(result.newAbilities)
          if (maxAbility) {
            const maxAbilityNameText = formatAbility(maxAbility)
            emit('add-battle-log', `恭喜！洗出了极限属性：${maxAbilityNameText}`, 'success')
            // 播放极限属性音效
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
        console.error('[ResetWeapon] 洗练失败:', error)
        emit('add-battle-log', '洗练失败：发生错误', 'error')
      } finally {
        isReforging.value = false
        progressPercent.value = 0
      }
    }

    /**
     * 处理自动洗练
     */
    const handleAutoReforge = async () => {
      // 如果正在自动洗练，点击则停止
      if (isAutoReforging.value) {
        shouldStopAutoReforge.value = true
        emit('add-battle-log', '正在停止自动洗练...', 'info')
        return
      }

      if (!canReforge.value) return

      // 弹出确认对话框，等待用户确认是否开始自动洗练
      const shouldStart = await waitForStartConfirm()
      if (!shouldStart) return

      isAutoReforging.value = true
      shouldStopAutoReforge.value = false

      let reforgeCount = 0

      try {
        while (!shouldStopAutoReforge.value && selectedScroll.value && selectedWeapon.value) {
          // 计算当前需要消耗的卷轴数量
          const currentScrollCost = 1 + lockedAbilities.value.size
          // 检查卷轴数量是否足够
          if ((selectedScroll.value.currentStack || 0) < currentScrollCost) {
            emit('add-battle-log', '卷轴已用完，自动洗练停止', 'warning')
            break
          }

          // 等待进度条完成
          await startProgress(1000)

          // 执行洗练
          const result = executeReforge()
          reforgeCount += 1

          if (result.success) {
            emit('play-sfx', 'InfUpgradeSuccess.wav')

            const statNames = result.newAbilities.map(ability => formatAbility(ability))
            emit('add-battle-log', `洗练成功！新属性：${statNames.join('、')}`, 'success')

            syncBagData()

            // 检查是否洗出了极限属性
            const maxAbility = findMaxValueAbility(result.newAbilities)
            if (maxAbility) {
              // 设置极限属性名称用于显示
              maxAbilityName.value = formatAbility(maxAbility)
              emit('add-battle-log', `恭喜！洗出了极限属性：${maxAbilityName.value}`, 'success')

              // 播放极限属性音效
              emit('play-sfx', '/music/曼波.mp3')

              // 等待用户确认是否继续
              const shouldContinue = await waitForContinueConfirm()
              if (!shouldContinue) {
                emit('add-battle-log', `自动洗练已停止，共洗练 ${reforgeCount} 次`, 'warning')
                break
              }
            } else {
              setTimeout(() => {
                emit('play-sfx', 'InfGroundPickup.wav')
              }, 300)
            }
          } else {
            emit('play-sfx', 'InfUpgradeFail.wav')
            if (result.error === '卷轴数量不足') {
              emit('add-battle-log', '卷轴已用完，自动洗练停止', 'warning')
            } else {
              emit('add-battle-log', '洗练失败！材料不足', 'error')
            }
            break
          }

          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        if (shouldStopAutoReforge.value) {
          emit('add-battle-log', `自动洗练已停止，共洗练 ${reforgeCount} 次`, 'warning')
        }
      } catch (error) {
        console.error('[ResetWeapon] 自动洗练失败:', error)
        emit('add-battle-log', '自动洗练失败：发生错误', 'error')
      } finally {
        isAutoReforging.value = false
        shouldStopAutoReforge.value = false
        progressPercent.value = 0
      }
    }

    // ========== 生命周期 ==========
    onMounted(() => {
      // 点击外部关闭下拉面板
      document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
      if (progressRafId) {
        cancelAnimationFrame(progressRafId)
        progressRafId = null
      }
    })

    /**
     * 点击外部关闭下拉面板
     */
    const handleClickOutside = (event) => {
      if (!event.target.closest('.reset-weapon-select-box') && !event.target.closest('.reset-weapon-popup-panel')) {
        showScrollPanel.value = false
        showWeaponPanel.value = false
        hideItemTooltip()
      }
    }

    // 监听 visible 变化，重置状态
    watch(isVisible, (newVal) => {
      if (!newVal) {
        // 面板关闭时重置状态
        selectedScrollId.value = null
        selectedWeaponId.value = null
        showScrollPanel.value = false
        showWeaponPanel.value = false
        isReforging.value = false
        isAutoReforging.value = false
        shouldStopAutoReforge.value = false
        progressPercent.value = 0
        modalPosition.value = null
        // 重置属性锁定状态
        lockedAbilities.value = new Set()
        // 重置信息面板状态
        showInfoPanel.value = false
      }
    })

    return {
      // 状态
      isVisible,
      modalContainerRef,
      selectScrollBoxRef,
      selectWeaponBoxRef,
      scrollPanelRef,
      weaponPanelRef,
      modalStyle,
      scrollItems,
      weaponItems,
      selectedScrollId,
      selectedScroll,
      selectedWeaponId,
      selectedWeapon,
      showScrollPanel,
      showWeaponPanel,
      scrollPanelStyle,
      weaponPanelStyle,
      weaponAbilities,
      isReforging,
      isAutoReforging,
      progressPercent,
      canReforge,
      lockedAbilities,
      scrollCost,
      showMaxValueConfirm,
      maxAbilityName,
      showAutoReforgeConfirm,
      // 信息面板
      showInfoPanel,
      infoPanelRef,
      selectedWeaponAbilities,
      infoPanelStyle,

      // 方法
      handleClose,
      startDrag,
      toggleScrollPanel,
      toggleWeaponPanel,
      selectScroll,
      selectWeapon,
      getWeaponDisplayName,
      getRarityText,
      getRarityStyle,
      formatAbility,
      isMaxValue,
      isAbilityLocked,
      toggleAbilityLock,
      confirmContinueReforge,
      cancelContinueReforge,
      confirmStartAutoReforge,
      cancelStartAutoReforge,
      handleIconError,
      showItemTooltip,
      handleReforge,
      handleAutoReforge,
      // 信息面板方法
      toggleInfoPanel,
      formatAbilityParameter,
      formatAbilityRange
    }
  }
}
</script>

<style scoped>
/* 容器 */
.reset-weapon-container {
  position: fixed;
  width: 400px;
  min-height: 450px;
  background: linear-gradient(180deg, rgba(30, 25, 45, 0.98) 0%, rgba(20, 15, 35, 0.99) 100%);
  border: 3px solid #8b5a2b;
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(139, 90, 43, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow: visible;
}

/* 头部 */
.reset-weapon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(139, 90, 43, 0.4) 0%, rgba(139, 90, 43, 0.1) 100%);
  border-bottom: 2px solid #8b5a2b;
  cursor: move;
  user-select: none;
}

.reset-weapon-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reset-weapon-scroll-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6));
}

.reset-weapon-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
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

/* 主体 */
.reset-weapon-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 区域 */
.reset-weapon-section {
  display: flex;
  flex-direction: column;
}

.reset-weapon-section-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffa500;
  border-bottom: 1px solid rgba(255, 165, 0, 0.3);
}

/* 选择框 */
.reset-weapon-select-box {
  display: flex;
  align-items: center;
  padding: 5px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #4a4a6a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-weapon-select-box:hover:not(.disabled) {
  border-color: #6a8aaa;
  background: rgba(106, 138, 170, 0.2);
}

.reset-weapon-select-box.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.reset-weapon-select-box.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-weapon-select-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: 10px;
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

.reset-weapon-select-level {
  font-size: 12px;
  color: #8a8aaa;
}

.reset-weapon-select-count {
  font-size: 12px;
  color: #ffd700;
}

.reset-weapon-select-placeholder {
  flex: 1;
  font-size: 13px;
  color: #666;
}

.reset-weapon-select-arrow {
  font-size: 10px;
  color: #8a8aaa;
  transition: transform 0.2s;
}

.reset-weapon-select-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉面板 */
.reset-weapon-popup-panel {
  width: 100%;
  max-height: 300px;
  background: rgba(20, 15, 35, 0.99);
  border: 2px solid #4a4a6a;
  border-radius: 8px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
}

.reset-weapon-popup-panel.weapon-panel {
  max-height: 350px;
}

.reset-weapon-popup-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.reset-weapon-popup-item:last-child {
  border-bottom: none;
}

.reset-weapon-popup-item:hover {
  background: rgba(106, 138, 170, 0.2);
}

.reset-weapon-popup-item.selected {
  background: rgba(255, 215, 0, 0.15);
  border-left: 3px solid #ffd700;
}

.reset-weapon-popup-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 4px;
  margin-right: 10px;
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

.reset-weapon-popup-level {
  font-size: 11px;
  color: #8a8aaa;
}

.reset-weapon-popup-count {
  font-size: 11px;
  color: #ffd700;
}

/* 属性显示区域 */
.reset-weapon-abilities {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  padding: 10px;
}

.reset-weapon-ability-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #e3d090;
  padding: 4px 0;
  line-height: 1.6;
}

.reset-weapon-ability-line .ability-text {
  flex: 1;
}

.reset-weapon-ability-line.is-max {
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.reset-weapon-ability-line.is-locked {
  background: rgba(255, 100, 100, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.reset-weapon-ability-line.is-locked .ability-text {
  color: #ff9999;
}

.max-value-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: bold;
  color: #ff4444;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 100, 0, 0.3) 100%);
  border: 1px solid #ffd700;
  border-radius: 4px;
  text-shadow: 0 0 4px rgba(255, 68, 68, 0.8);
  animation: max-value-glow 1.5s ease-in-out infinite alternate;
}

@keyframes max-value-glow {
  0% {
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
  }
  100% {
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
  }
}

/* 属性锁定滑动块样式 */
.ability-lock-toggle {
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.lock-slider {
  width: 40px;
  height: 20px;
  background: rgba(60, 60, 80, 0.8);
  border: 1px solid #4a4a6a;
  border-radius: 10px;
  position: relative;
  transition: all 0.3s ease;
}

.ability-lock-toggle.locked .lock-slider {
  background: rgba(255, 100, 100, 0.3);
  border-color: #ff6666;
}

.lock-slider-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #6a6a8a 0%, #4a4a6a 100%);
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ability-lock-toggle.locked .lock-slider-thumb {
  left: 22px;
  background: linear-gradient(135deg, #ff8888 0%, #ff4444 100%);
}

.lock-icon {
  font-size: 10px;
  line-height: 1;
}

.ability-lock-toggle:hover .lock-slider {
  border-color: #8a8aaa;
}

.ability-lock-toggle.locked:hover .lock-slider {
  border-color: #ff8888;
  box-shadow: 0 0 8px rgba(255, 100, 100, 0.5);
}

/* 卷轴消耗提示 */
.scroll-cost-hint {
  font-size: 11px;
  color: #ffd700;
  margin-left: 4px;
}

/* 进度条 */
.reset-weapon-progress-bar {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  overflow: hidden;
}

.reset-weapon-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 10px;
  transition: width 0.05s linear;
}

.reset-weapon-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

/* 操作按钮 */
.reset-weapon-actions {
  display: flex;
  gap: 5px;
}

.reset-weapon-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #6a8aba;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-weapon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-btn {
  background: linear-gradient(135deg, #4a6a9a 0%, #3a5a8a 100%);
  color: #fff;
}

.auto-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 170, 0.5);
}

.reforge-btn {
  background: linear-gradient(135deg, #8b5a2b 0%, #6a4a1b 100%);
  color: #ffd700;
}

.reforge-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9b6a3b 0%, #7a5a2b 100%);
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

/* 过渡动画 */
.reset-weapon-fade-enter-active {
  animation: reset-weapon-in 0.3s ease-out;
}

.reset-weapon-fade-leave-active {
  animation: reset-weapon-out 0.2s ease-in;
}

@keyframes reset-weapon-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes reset-weapon-out {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
}

/* 极限属性确认对话框 */
.max-value-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 100;
}

.max-value-confirm-dialog {
  background: linear-gradient(180deg, rgba(40, 30, 60, 0.99) 0%, rgba(20, 15, 35, 0.99) 100%);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 20px;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
}

.confirm-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 16px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.confirm-icon {
  margin-right: 8px;
}

.confirm-content {
  margin-bottom: 20px;
}

.confirm-ability {
  font-size: 14px;
  color: #ff4444;
  font-weight: bold;
  background: rgba(255, 215, 0, 0.15);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  border: 1px solid #ffd700;
}

.confirm-desc {
  font-size: 13px;
  color: #e3d090;
  margin-bottom: 8px;
}

.confirm-question {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 10px 20px;
  border: 2px solid;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.stop-btn {
  background: rgba(100, 100, 120, 0.5);
  border-color: #6a6a8a;
  color: #aaa;
}

.stop-btn:hover {
  background: rgba(100, 100, 120, 0.8);
  border-color: #8a8aaa;
  color: #fff;
}

.continue-btn {
  background: linear-gradient(135deg, #8b5a2b 0%, #6a4a1b 100%);
  border-color: #ffd700;
  color: #ffd700;
}

.continue-btn:hover {
  background: linear-gradient(135deg, #9b6a3b 0%, #7a5a2b 100%);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
}

/* 自动洗练确认对话框额外样式 */
.auto-reforge-confirm .confirm-info {
  margin: 12px 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.auto-reforge-confirm .info-item {
  font-size: 13px;
  color: #ccc;
  padding: 4px 0;
}

.auto-reforge-confirm .highlight {
  color: #ffd700;
  font-weight: bold;
}

.auto-reforge-confirm .confirm-warning {
  font-size: 12px;
  color: #ffaa00;
  margin-top: 8px;
}

/* 确认对话框过渡动画 */
.confirm-fade-enter-active {
  animation: confirm-in 0.3s ease-out;
}

.confirm-fade-leave-active {
  animation: confirm-out 0.2s ease-in;
}

@keyframes confirm-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes confirm-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* 帮助按钮样式 */
.reset-weapon-help-btn {
  width: 22px;
  height: 22px;
  background: rgba(100, 100, 140, 0.6);
  border: 2px solid #8b8bff;
  border-radius: 50%;
  color: #ddd;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.reset-weapon-help-btn:hover {
  background: rgba(120, 120, 180, 0.8);
  border-color: #a0a0ff;
  color: #fff;
  transform: scale(1.1);
}

.reset-weapon-help-btn.active {
  background: rgba(139, 90, 43, 0.8);
  border-color: #ffd700;
  color: #ffd700;
}

/* 信息面板样式 */
.reset-weapon-info-panel {
  position: fixed;
  min-width: 180px;
  max-width: 280px;
  background: linear-gradient(180deg, rgba(30, 25, 45, 0.98) 0%, rgba(20, 15, 35, 0.99) 100%);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(139, 90, 43, 0.4);
  z-index: 10001;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow: hidden;
}

.info-panel-header {
  padding: 10px 12px;
  background: linear-gradient(90deg, rgba(139, 90, 43, 0.4) 0%, rgba(139, 90, 43, 0.1) 100%);
  border-bottom: 1px solid #8b5a2b;
}

.info-panel-title {
  font-size: 13px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.info-panel-body {
  padding: 8px 12px;
  max-height: 400px;
  overflow-y: auto;
}

.info-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(139, 90, 43, 0.2);
}

.info-stat-item:last-child {
  border-bottom: none;
}

.info-stat-name {
  font-size: 12px;
  color: #c0c0c0;
}

.info-stat-range {
  font-size: 12px;
  color: #7cfc00;
  font-weight: bold;
}

.info-empty {
  font-size: 12px;
  color: #888;
  text-align: center;
  padding: 20px 0;
}

/* 信息面板过渡动画 */
.info-panel-fade-enter-active {
  animation: info-panel-in 0.2s ease-out;
}

.info-panel-fade-leave-active {
  animation: info-panel-out 0.15s ease-in;
}

@keyframes info-panel-in {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes info-panel-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-10px);
  }
}
</style>
