/**
 * @fileoverview 属性攻击魔法石选择面板组件
 * @description 用于从5个元素属性攻击石头中选择一个
 * @author FLYFF Team
 * @created 2026-02-18
 */
<template>
  <transition name="panel-fade">
    <div v-if="visible" class="stone-select-overlay" @click.self="handleCancel">
      <div class="stone-select-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <img src="/pt/item_icon/347.png" alt="属性攻击魔法石箱" class="panel-icon" />
          <span class="panel-title">属性攻击魔法石箱</span>
          <button class="close-btn" @click="handleCancel">×</button>
        </div>

        <!-- 面板内容 -->
        <div class="panel-body">
          <div class="panel-description">
            选择一个元素属性攻击石头，1小时内增加20%属性攻击
          </div>

          <!-- 石头选择区域 -->
          <div class="stone-grid">
            <div
              v-for="stone in stoneOptions"
              :key="stone.id"
              class="stone-item"
              :class="{ selected: selectedStone?.id === stone.id }"
              @click="selectStone(stone)"
              @mouseenter="handleStoneMouseEnter($event, stone)"
              @mousemove="handleStoneMouseMove($event)"
              @mouseleave="handleStoneMouseLeave"
            >
              <img :src="stone.icon" :alt="stone.name" class="stone-icon" />
              <div class="stone-info">
                <span class="stone-name">{{ stone.name }}</span>
                <span class="stone-element">{{ stone.elementName }}属性攻击</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="panel-footer">
          <button class="action-btn cancel-btn" @click="handleCancel">取消</button>
          <button
            class="action-btn confirm-btn"
            :disabled="!selectedStone || hasConfirmed"
            @click="handleConfirm"
          >
            {{ hasConfirmed ? '已领取' : '领取' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useItemsStore } from '@/store/items'
import { getItemName, getItemIcon } from '@/utils/itemUtils'

/**
 * 元素石头配置
 * 物品ID与元素对应关系
 */
const STONE_CONFIG = [
  { id: 8241, elementKey: 'fire', elementName: '火' },      // 蹈火之石 - Fire
  { id: 2541, elementKey: 'water', elementName: '水' },     // 碧波之石 - Water
  { id: 547, elementKey: 'wind', elementName: '风' },       // 风驰之石 - Wind
  { id: 5088, elementKey: 'thunder', elementName: '雷' },   // 电掣之石 - Thunder
  { id: 4053, elementKey: 'earth', elementName: '土' }      // 泥沙之石 - Earth
]

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

const itemsStore = useItemsStore()

// 选中的石头
const selectedStone = ref(null)
// 是否已确认（防止多次点击）
const hasConfirmed = ref(false)

/**
 * 石头选项列表（使用计算属性确保在 itemsStore 加载后动态获取名称）
 */
const stoneOptions = computed(() => {
  return STONE_CONFIG.map(config => {
    // 直接使用 getItemName 函数，它会自动从 itemsStore 获取正确的名称
    const displayName = getItemName(config.id)
    const icon = getItemIcon(config.id)
    
    return {
      id: config.id,
      name: displayName,
      icon: icon,
      elementKey: config.elementKey,
      elementName: config.elementName,
      elementIcon: `/pt/element/${getElementIconName(config.elementName)}.png`
    }
  })
})

/**
 * 根据元素名称获取图标文件名
 * @param {string} elementName - 元素名称
 * @returns {string} 图标文件名
 */
function getElementIconName (elementName) {
  const iconMap = {
    '风': 'wind_风',
    '火': 'fire_火',
    '水': 'water_水',
    '雷': 'electricity_雷',
    '土': 'earth_土'
  }
  return iconMap[elementName] || elementName
}

/**
 * 显示物品详情提示框的自定义事件
 * @param {string} action - 操作类型 ('show' | 'move' | 'hide')
 * @param {Object} item - 物品数据
 * @param {Object} position - 鼠标位置 { x, y }
 */
function dispatchTooltipEvent (action, item, position = { x: 0, y: 0 }) {
  const eventName = action === 'show' ? 'show-item-tooltip' : action === 'move' ? 'move-item-tooltip' : 'hide-item-tooltip'
  window.dispatchEvent(new CustomEvent(eventName, {
    detail: { item, position, source: 'stone-select-panel' }
  }))
}

/**
 * 选择石头
 * @param {Object} stone - 石头数据
 */
function selectStone (stone) {
  selectedStone.value = stone
}

/**
 * 石头鼠标进入事件 - 显示物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} stone - 石头数据
 */
function handleStoneMouseEnter (event, stone) {
  const itemConfig = itemsStore.getItemConfig(stone.id)
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('show', { id: stone.id, ...itemConfig }, position)
}

/**
 * 石头鼠标移动事件 - 移动物品详情面板
 * @param {MouseEvent} event - 鼠标事件
 */
function handleStoneMouseMove (event) {
  const position = { x: event.clientX + 15, y: event.clientY + 15 }
  dispatchTooltipEvent('move', null, position)
}

/**
 * 石头鼠标离开事件 - 隐藏物品详情面板
 */
function handleStoneMouseLeave () {
  dispatchTooltipEvent('hide', null)
}

/**
 * 确认选择
 */
function handleConfirm () {
  if (!selectedStone.value || hasConfirmed.value) return

  hasConfirmed.value = true

  emit('confirm', {
    stoneId: selectedStone.value.id,
    stoneName: selectedStone.value.name,
    elementKey: selectedStone.value.elementKey,
    elementName: selectedStone.value.elementName
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
    selectedStone.value = null
    hasConfirmed.value = false
  }
})
</script>

<style scoped>
.stone-select-overlay {
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

.stone-select-panel {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  min-width: 400px;
  max-width: 480px;
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
}

.panel-description {
  font-size: 13px;
  color: #aaa;
  text-align: center;
  margin-bottom: 16px;
  line-height: 1.5;
}

.stone-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.stone-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.stone-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #5a5a7a;
}

.stone-item.selected {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
}

.stone-icon {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}

.stone-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.stone-name {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.stone-element {
  font-size: 11px;
  color: #64c8ff;
  margin-top: 2px;
}

.stone-item.selected .stone-name {
  color: #ffd700;
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

.panel-fade-enter-active .stone-select-panel,
.panel-fade-leave-active .stone-select-panel {
  transition: transform 0.2s ease;
}

.panel-fade-enter-from .stone-select-panel,
.panel-fade-leave-to .stone-select-panel {
  transform: scale(0.95);
}
</style>
