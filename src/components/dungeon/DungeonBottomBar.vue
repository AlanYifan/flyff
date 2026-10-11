<!--
  @file DungeonBottomBar.vue
  @description 副本页面底部操作栏 - 自动战斗面板+功能区域
  @features
    - 上层：自动战斗开关 + 倍速按钮
    - 下层：六边形功能按钮网格
    - 科技感仪表盘设计
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-bottom-bar">
    <!-- 上层：自动战斗面板 -->
    <div class="auto-battle-panel">
      <!-- 自动战斗开关 -->
      <div class="auto-battle-switch">
        <button 
          class="switch-btn"
          :class="{ active: autoBattle }"
          @click="$emit('toggle-auto-battle')"
          :disabled="isStarting"
        >
          <span class="switch-icon">
            <svg viewBox="0 0 24 24" class="gear-icon" :class="{ rotating: autoBattle }">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
            </svg>
          </span>
          <span class="switch-text">{{ isStarting ? '启动中...' : (autoBattle ? 'ON' : 'OFF') }}</span>
        </button>
      </div>
      
      <!-- 倍速按钮 -->
      <div class="speed-buttons">
        <button 
          v-for="speed in [1, 2, 3]"
          :key="`speed-${speed}`"
          class="speed-btn"
          :class="{ active: currentSpeed === speed }"
          @click="$emit('set-speed', speed)"
        >
          x{{ speed }}
        </button>
      </div>
    </div>

    <!-- 下层：功能区域 -->
    <div class="action-panel">
      <!-- 背包按钮 -->
      <button class="hex-btn" @click="$emit('open-bag')">
        <div class="hex-content">
          <span class="hex-icon">🎒</span>
          <span class="hex-text">背包</span>
        </div>
        <div class="hex-glow"></div>
      </button>

      <!-- 任务按钮 -->
      <button class="hex-btn" @click="$emit('open-quest')">
        <div class="hex-content">
          <span class="hex-icon">📜</span>
          <span class="hex-text">任务</span>
        </div>
        <div class="hex-glow"></div>
      </button>

      <!-- 设置按钮 -->
      <button class="hex-btn" @click="$emit('open-settings')">
        <div class="hex-content">
          <span class="hex-icon">⚙️</span>
          <span class="hex-text">设置</span>
        </div>
        <div class="hex-glow"></div>
      </button>

      <!-- 退出按钮 -->
      <button class="hex-btn exit-btn" @click="$emit('exit-dungeon')">
        <div class="hex-content">
          <span class="hex-icon">🚪</span>
          <span class="hex-text">退出</span>
        </div>
        <div class="hex-glow"></div>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * 副本页面底部操作栏
 * 深渊禁忌风格 - 科技感仪表盘设计
 */

defineProps({
  /**
   * 是否自动战斗中
   */
  autoBattle: {
    type: Boolean,
    default: false
  },
  /**
   * 是否正在启动自动战斗
   */
  isStarting: {
    type: Boolean,
    default: false
  },
  /**
   * 当前战斗速度
   */
  currentSpeed: {
    type: Number,
    default: 1
  }
})

defineEmits([
  'toggle-auto-battle',
  'set-speed',
  'open-bag',
  'open-quest',
  'open-settings',
  'exit-dungeon'
])
</script>

<style scoped>
/* ============ CSS变量 ============ */
.dungeon-bottom-bar {
  --bg-deep: #080B10;
  --material-dark: #1C2028;
  --border-iron: #2A3040;
  --glow-curse-green: #00F5D4;
  --glow-blood-red: #D90429;
  --text-light: #E0E1DD;
  --speed-amber: #FFD166;
  --hp-mint: #06D6A0;
  
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ============ 上层：自动战斗面板 ============ */
.auto-battle-panel {
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  padding: 8px 20px;
  
  /* 科技感网格背景 */
  background-image: 
    linear-gradient(rgba(0, 245, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 245, 212, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  border-bottom: 1px solid var(--border-iron);
}

/* 自动战斗开关 */
.auto-battle-switch {
  display: flex;
  align-items: center;
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  background: var(--material-dark);
  border: 2px solid var(--border-iron);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.switch-btn:hover {
  border-color: var(--glow-curse-green);
}

.switch-btn.active {
  background: rgba(0, 245, 212, 0.15);
  border-color: var(--glow-curse-green);
  box-shadow: 0 0 20px rgba(0, 245, 212, 0.3);
}

.switch-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gear-icon {
  width: 20px;
  height: 20px;
  fill: var(--text-light);
  transition: fill 0.3s;
}

.switch-btn.active .gear-icon {
  fill: var(--glow-curse-green);
}

.gear-icon.rotating {
  animation: gearRotate 2s linear infinite;
}

@keyframes gearRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.switch-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  letter-spacing: 1px;
  transition: color 0.3s;
}

.switch-btn.active .switch-text {
  color: var(--glow-curse-green);
}

/* 倍速按钮 */
.speed-buttons {
  display: flex;
  gap: 8px;
}

.speed-btn {
  padding: 8px 16px;
  background: var(--material-dark);
  border: 1px solid var(--border-iron);
  border-radius: 20px;
  color: var(--text-light);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 45px;
}

.speed-btn:hover {
  border-color: var(--text-light);
}

.speed-btn.active {
  background: var(--speed-amber);
  border-color: var(--speed-amber);
  color: #000;
  box-shadow: 0 0 10px rgba(255, 209, 102, 0.5);
}

/* ============ 下层：功能区域 ============ */
.action-panel {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px 20px;
  background: rgba(28, 32, 40, 0.5);
}

/* 六边形按钮（切角矩形） */
.hex-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: var(--material-dark);
  border: 1px solid var(--border-iron);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  
  /* 切角效果 */
  clip-path: polygon(
    10% 0%, 90% 0%,
    100% 10%, 100% 90%,
    90% 100%, 10% 100%,
    0% 90%, 0% 10%
  );
}

.hex-btn:hover {
  border-color: var(--glow-curse-green);
  transform: translateY(-2px);
}

.hex-btn:active {
  transform: translateY(0);
}

.hex-btn:active .hex-glow {
  opacity: 1;
  animation: ripple 0.4s ease-out;
}

.hex-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 2;
}

.hex-icon {
  font-size: 20px;
}

.hex-text {
  font-size: 11px;
  color: var(--text-light);
  font-weight: 500;
}

.hex-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, var(--glow-curse-green) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 1;
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 退出按钮特殊样式 */
.exit-btn:hover {
  border-color: var(--glow-blood-red);
}

.exit-btn:active .hex-glow {
  background: radial-gradient(circle at center, var(--glow-blood-red) 0%, transparent 70%);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .auto-battle-panel {
    gap: 20px;
    padding: 6px 15px;
  }
  
  .switch-btn {
    padding: 8px 16px;
  }
  
  .speed-btn {
    padding: 6px 12px;
    min-width: 40px;
    font-size: 11px;
  }
  
  .action-panel {
    gap: 8px;
    padding: 10px 15px;
  }
  
  .hex-btn {
    padding: 10px;
  }
  
  .hex-icon {
    font-size: 18px;
  }
  
  .hex-text {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .auto-battle-panel {
    gap: 12px;
  }
  
  .switch-text {
    font-size: 12px;
  }
  
  .action-panel {
    gap: 6px;
    padding: 8px 10px;
  }
  
  .hex-text {
    display: none;
  }
}
</style>
