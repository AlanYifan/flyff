/**
 * @fileoverview 属性更改卷轴面板组件
 * @description 用于选择元素属性并修改武器的元素属性类型
 * @author FLYFF Team
 * @created 2026-02-18
 */
<template>
  <transition name="panel-fade">
    <div v-if="visible" class="element-change-overlay" @click.self="handleCancel">
      <div class="element-change-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <img src="/pt/item_icon/1529.png" alt="属性更改卷轴" class="panel-icon" />
          <span class="panel-title">属性选择面板</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>

        <!-- 面板内容 -->
        <div class="panel-body">
          <!-- 元素选择区域 -->
          <div class="element-section">
            <div class="section-title">选择元素属性</div>
            <div class="element-grid">
              <div
                v-for="element in elements"
                :key="element.key"
                class="element-item"
                :class="{ selected: selectedElement === element.key }"
                @click="selectElement(element.key)"
              >
                <img :src="element.icon" :alt="element.name" class="element-icon" />
                <span class="element-name">{{ element.name }}</span>
              </div>
            </div>
          </div>

          <!-- 武器选择区域 -->
          <div class="weapon-section">
            <div class="section-title">选择武器</div>
            <div v-if="weaponList.length === 0" class="no-weapon-hint">
              背包中没有属性武器
            </div>
            <div v-else class="weapon-list">
              <div
                v-for="weapon in weaponList"
                :key="weapon.uniqueId || weapon.id"
                class="weapon-item"
                :class="{ selected: selectedWeapon?.uniqueId === weapon.uniqueId && selectedWeapon?.id === weapon.id }"
                @click="selectWeapon(weapon)"
                @mouseenter="handleWeaponMouseEnter($event, weapon)"
                @mousemove="handleWeaponMouseMove($event)"
                @mouseleave="handleWeaponMouseLeave"
              >
                <img :src="getWeaponIcon(weapon)" :alt="getWeaponName(weapon)" class="weapon-icon" />
                <div class="weapon-info">
                  <div class="weapon-name">{{ getWeaponName(weapon) }}</div>
                  <div class="weapon-element">
                    {{ getCurrentElementDisplay(weapon) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="panel-footer">
          <button class="action-btn cancel-btn" @click="handleCancel">取消</button>
          <button
            class="action-btn confirm-btn"
            :disabled="!canConfirm || hasConfirmed"
            @click="handleConfirm"
          >
            {{ hasConfirmed ? '已更改' : '更改' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useItemsStore } from '@/store/items'
import { ELEMENT_NAMES } from '@/store/descriptions'
import { getItemName, getItemIcon } from '@/utils/itemUtils'

/**
 * 显示物品详情提示框的自定义事件
 * @param {string} action - 操作类型 ('show' | 'move' | 'hide')
 * @param {Object} item - 物品数据
 * @param {Object} position - 鼠标位置 { x, y }
 */
function dispatchTooltipEvent (action, item, position = { x: 0, y: 0 }) {
  const eventName = action === 'show' ? 'show-item-tooltip' : action === 'move' ? 'move-item-tooltip' : 'hide-item-tooltip'
  window.dispatchEvent(new CustomEvent(eventName, {
    detail: { item, position, source: 'element-change-panel' }
  }))
}

/**
 * 元素配置数据
 * 元素key与ELEMENT_NAMES中的key对应
 */
const ELEMENT_CONFIG = [
  { key: 'wind', name: '风', icon: '/pt/element/wind_风.png' },
  { key: 'fire', name: '火', icon: '/pt/element/fire_火.png' },
  { key: 'water', name: '水', icon: '/pt/element/water_水.png' },
  { key: 'thunder', name: '雷', icon: '/pt/element/electricity_雷.png' },
  { key: 'earth', name: '土', icon: '/pt/element/earth_土.png' }
]

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const itemsStore = useItemsStore()

// 选中的元素
const selectedElement = ref(null)
// 选中的武器
const selectedWeapon = ref(null)
// 是否已确认更改（防止多次点击）
const hasConfirmed = ref(false)

// 元素列表
const elements = ELEMENT_CONFIG

/**
 * 获取有属性强化的武器列表
 * 从背包和装备中筛选有elementalEnhancement数据的武器
 */
const weaponList = computed(() => {
  const weapons = []
  const seenIds = new Set()

  // 从装备中获取
  const equipment = itemsStore.equipment
  if (equipment) {
    Object.values(equipment).forEach(item => {
      if (item && item.category === 'weapon' && hasElementalEnhancement(item)) {
        const uniqueKey = item.uniqueId || `${item.id}-equip`
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey)
          weapons.push({
            ...item,
            uniqueId: item.uniqueId || `${item.id}-equip`,
            source: 'equipment'
          })
        }
      }
    })
  }

  // 从背包中获取
  const bag = itemsStore.playerBag
  if (bag && Array.isArray(bag)) {
    bag.forEach(item => {
      if (item && item.category === 'weapon' && hasElementalEnhancement(item)) {
        const uniqueKey = item.uniqueId || `${item.id}-bag-${item.bagIndex}`
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey)
          weapons.push({
            ...item,
            uniqueId: item.uniqueId || `${item.id}-bag-${item.bagIndex}`,
            source: 'bag'
          })
        }
      }
    })
  }

  return weapons
})

/**
 * 检查物品是否有元素强化数据
 * @param {Object} item - 物品数据
 * @returns {boolean} 是否有元素强化
 */
function hasElementalEnhancement (item) {
  if (!item) return false
  const elemental = item.elementalEnhancement || item.StrengthenedAttributes?.elementalEnhancement
  if (!elemental || typeof elemental !== 'object') return false
  // 检查是否有实际的元素强化数据
  return Object.keys(elemental).some(key =>
    key !== 'attributeEnhanceCount' && elemental[key]?.enhancementLevel > 0
  )
}

/**
 * 是否可以确认更改
 */
const canConfirm = computed(() => {
  return selectedElement.value && selectedWeapon.value
})

/**
 * 选择元素
 * @param {string} elementKey - 元素key
 */
function selectElement (elementKey) {
  selectedElement.value = elementKey
}

/**
 * 选择武器
 * @param {Object} weapon - 武器数据
 */
function selectWeapon (weapon) {
  selectedWeapon.value = weapon
}

/**
 * 武器鼠标进入事件 - 显示物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} weapon - 武器数据
 */
function handleWeaponMouseEnter (event, weapon) {
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('show', weapon, position)
}

/**
 * 武器鼠标移动事件 - 移动物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 */
function handleWeaponMouseMove (event) {
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('move', null, position)
}

/**
 * 武器鼠标离开事件 - 隐藏物品详情面板
 */
function handleWeaponMouseLeave () {
  dispatchTooltipEvent('hide', null)
}

/**
 * 获取武器图标
 * @param {Object} weapon - 武器数据
 * @returns {string} 图标路径
 */
function getWeaponIcon (weapon) {
  return getItemIcon(weapon)
}

/**
 * 获取武器名称
 * @param {Object} weapon - 武器数据
 * @returns {string} 武器名称
 */
function getWeaponName (weapon) {
  const name = getItemName(weapon)
  if (typeof name === 'object') {
    return name.cns || name.en || name.eng || `武器ID: ${weapon.id}`
  }
  return name || `武器ID: ${weapon.id}`
}

/**
 * 获取当前元素显示文本
 * @param {Object} weapon - 武器数据
 * @returns {string} 元素显示文本
 */
function getCurrentElementDisplay (weapon) {
  const elemental = weapon.elementalEnhancement || weapon.StrengthenedAttributes?.elementalEnhancement
  if (!elemental) return '无'

  // 找到当前强化等级最高的元素
  let currentElement = null
  let maxLevel = 0

  Object.keys(elemental).forEach(key => {
    if (key !== 'attributeEnhanceCount') {
      const level = elemental[key]?.enhancementLevel || 0
      if (level > maxLevel) {
        maxLevel = level
        currentElement = key
      }
    }
  })

  if (!currentElement) return '无'

  const elementName = ELEMENT_NAMES[currentElement] || currentElement
  return `${elementName}+${maxLevel}`
}

/**
 * 确认更改
 */
function handleConfirm () {
  if (!canConfirm.value || hasConfirmed.value) return

  hasConfirmed.value = true

  emit('confirm', {
    element: selectedElement.value,
    weapon: selectedWeapon.value
  })
}

/**
 * 取消操作
 */
function handleCancel () {
  emit('close')
}

// 监听显示状态重置数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedElement.value = null
    selectedWeapon.value = null
    hasConfirmed.value = false
  }
})
</script>

<style scoped>
.element-change-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.element-change-panel {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  min-width: 420px;
  max-width: 500px;
  max-height: 80vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #3a3a5a;
  position: relative;
}

.panel-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffd700;
  flex: 1;
}

.close-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.panel-body {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
}

.element-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 12px;
  font-weight: 500;
}

.element-grid {
  display: flex;
  gap: 10px;
  justify-content: center;
 
}

.element-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60px;
}

.element-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.element-item.selected {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

.element-icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}

.element-name {
  font-size: 13px;
  color: #ddd;
  font-weight: 500;
}

.element-item.selected .element-name {
  color: #ffd700;
}

.weapon-section {
  margin-top: 16px;
}

.no-weapon-hint {
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 30px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.weapon-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}

.weapon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 80px;
}

.weapon-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.weapon-item.selected {
  background: rgba(100, 200, 255, 0.15);
  border-color: #64c8ff;
  box-shadow: 0 0 8px rgba(100, 200, 255, 0.2);
}

.weapon-icon {
  width: 42px;
  height: 42px;
  image-rendering: pixelated;
}

.weapon-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.weapon-name {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.weapon-element {
  font-size: 11px;
  color: #64c8ff;
  font-weight: 500;
}

.panel-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #3a3a5a;
}

.action-btn {
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #3a3a5a;
  color: #aaa;
}

.cancel-btn:hover {
  background: #4a4a6a;
  color: #fff;
}

.confirm-btn {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #1a1a2e;
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffea00 0%, #ffbb00 100%);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  background: #4a4a6a;
  color: #666;
  cursor: not-allowed;
  transform: none;
}

/* 过渡动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-active .element-change-panel,
.panel-fade-leave-active .element-change-panel {
  transition: transform 0.2s ease;
}

.panel-fade-enter-from .element-change-panel,
.panel-fade-leave-to .element-change-panel {
  transform: scale(0.95);
}

/* 滚动条样式 */
.weapon-list::-webkit-scrollbar {
  width: 6px;
}

.weapon-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.weapon-list::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.weapon-list::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}
</style>
