<!--
  SettingsPortalPanel.vue - 设置功能入口面板
  点击设置按钮后先显示此面板，提供"游戏设置"和"更新数据"两个功能入口
  带过渡动画，主题颜色动态变更
  @author FLYFF Team
  @created 2026-07-13
-->
<template>
  <transition name="portal-overlay" appear>
    <div v-if="isVisible" class="portal-overlay" @click.self="close">
      <transition name="portal-panel" appear>
        <div v-if="isVisible" ref="panelRef" class="portal-panel">
          <!-- 面板头部 -->
          <div class="portal-header">
            <h2 class="portal-title">功能菜单</h2>
            <button class="portal-close-btn" @click="close">&times;</button>
          </div>

          <!-- 功能入口列表 -->
          <div class="portal-body">
            <div
              v-for="item in portalItems"
              :key="item.key"
              class="portal-item"
              @click="handleSelect(item.key)"
            >
              <span class="portal-item-icon">{{ item.icon }}</span>
              <span class="portal-item-label">{{ item.label }}</span>
              <span class="portal-item-arrow">›</span>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup>
/**
 * 设置功能入口面板
 *
 * 用途/业务意图：点击设置按钮后先显示此面板，提供功能选择入口
 * 用户选择"游戏设置"后打开设置面板，选择"更新数据"后打开数据更新页面
 *
 * @module SettingsPortalPanel
 */

import { ref } from 'vue'

/**
 * 组件 Props
 */
const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  }
})

/**
 * 组件 Emits
 */
const emit = defineEmits(['close', 'open-settings', 'open-data-update'])

/** 面板根元素引用 */
const panelRef = ref(null)

/**
 * 功能入口列表
 * @type {{ key: string, label: string, icon: string }[]}
 */
const portalItems = [
  { key: 'settings', label: '游戏设置', icon: '⚙️' },
  { key: 'dataUpdate', label: '更新数据', icon: '🔄' }
]

/**
 * 处理功能入口点击
 * @param {string} key - 功能键
 * @returns {void}
 */
const handleSelect = (key) => {
  if (key === 'settings') {
    emit('open-settings')
  } else if (key === 'dataUpdate') {
    emit('open-data-update')
  }
  close()
}

/**
 * 关闭面板
 * @returns {void}
 */
const close = () => {
  emit('close')
}
</script>

<style scoped>
/* ==================== 遮罩层 ==================== */
.portal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1090;
  backdrop-filter: blur(2px);
}

/* ==================== 面板容器 ==================== */
.portal-panel {
  width: 340px;
  background: var(--theme-modal-bg, rgba(0, 0, 0, 0.9));
  border: 2px solid var(--theme-border, #8b7355);
  border-radius: 12px;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(139, 90, 43, 0.1);
  overflow: hidden;
  color: var(--theme-text, #ffffff);
}

/* ==================== 面板头部 ==================== */
.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: var(--theme-header-bg, rgba(0, 0, 0, 0.5));
  border-bottom: 2px solid var(--theme-border, #8b7355);
  cursor: move;
  user-select: none;
}

.portal-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Georgia', serif;
}

.portal-close-btn {
  background: var(--theme-button-bg, rgba(0, 0, 0, 0.7));
  border: 2px solid var(--theme-border, #8b7355);
  color: var(--theme-text, #ffffff);
  font-size: 22px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.3s ease;
  padding: 0;
}

.portal-close-btn:hover {
  background: var(--theme-button-hover, #3a1a1a);
  border-color: var(--theme-border-strong, #aa8a65);
  transform: rotate(90deg);
}

/* ==================== 面板内容 ==================== */
.portal-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.portal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: var(--theme-surface-muted, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--theme-border, #8b7355);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: var(--theme-text, #ffffff);
}

.portal-item:hover {
  background: var(--theme-surface, rgba(255, 255, 255, 0.08));
  border-color: var(--theme-accent, #ffd700);
  transform: translateX(4px);
  box-shadow: 0 2px 12px rgba(255, 215, 0, 0.15);
}

.portal-item-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
}

.portal-item-label {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
  font-family: 'Georgia', serif;
}

.portal-item-arrow {
  font-size: 22px;
  color: var(--theme-muted, #888888);
  transition: all 0.25s ease;
}

.portal-item:hover .portal-item-arrow {
  color: var(--theme-accent, #ffd700);
  transform: translateX(4px);
}

/* ==================== 过渡动画 ==================== */

/* 遮罩层过渡 */
.portal-overlay-enter-active,
.portal-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.portal-overlay-enter-from,
.portal-overlay-leave-to {
  opacity: 0;
}

/* 面板过渡 */
.portal-panel-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.portal-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.portal-panel-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(-20px);
}

.portal-panel-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
</style>
