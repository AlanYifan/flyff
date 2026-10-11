<!--
  PanelResizeHandle.vue - 面板拉伸手柄组件
  提供带有动画效果的拉伸指示器
  @author CatPaw
  @version 1.3.0
  @created 2026-04-04
-->
<template>
  <div class="panel-resize-handle">
    <div class="resize-lines">
      <span class="resize-line"></span>
      <span class="resize-line"></span>
      <span class="resize-line"></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 面板拉伸手柄组件
 * 显示在面板右下角，提供视觉上的拉伸提示
 * 使用三条斜线动画，直观表示可拉伸
 */
</script>

<style scoped>
.panel-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  cursor: se-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 10px 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 50%,
    rgba(255, 215, 0, 0.12) 50%,
    rgba(255, 215, 0, 0.2) 100%
  );
  transition: background 0.3s ease;
}

.panel-resize-handle:hover {
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 215, 0, 0.25) 40%,
    rgba(255, 215, 0, 0.4) 100%
  );
}

.resize-lines {
  position: relative;
  width: 14px;
  height: 14px;
  transform: rotate(-45deg);
}

.resize-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(255, 215, 0, 0.8);
  border-radius: 1px;
  animation: line-pulse 1.8s ease-in-out infinite;
}

.resize-line:nth-child(1) {
  top: 0;
  animation-delay: 0s;
}

.resize-line:nth-child(2) {
  top: 5px;
  animation-delay: 0.2s;
}

.resize-line:nth-child(3) {
  top: 10px;
  animation-delay: 0.4s;
}

/* Hover 效果增强 */
.panel-resize-handle:hover .resize-line {
  background: rgba(255, 215, 0, 1);
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.6);
}

@keyframes line-pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scaleX(0.7);
  }
  50% {
    opacity: 1;
    transform: scaleX(1);
  }
}
</style>
