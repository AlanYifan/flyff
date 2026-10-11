<template>
  <transition name="panel-fade">
    <div v-if="visible" class="rename-panel-overlay">
      <div class="rename-panel">
        <div class="rename-panel-header">
          <img src="/pt/item_icon/4656.png" alt="改名卷轴" class="rename-panel-icon" />
          <span class="rename-panel-title">改名卷轴</span>
        </div>
        
        <div class="rename-panel-body">
          <label class="rename-label">请输入新名称：</label>
          <input
            ref="inputRef"
            v-model="newName"
            type="text"
            class="rename-input"
            placeholder="输入新角色名称"
            maxlength="16"
            @keyup.enter="handleConfirm"
            @keyup.esc="handleCancel"
          />
          <div class="rename-hint">名称长度 1-16 个字符</div>
        </div>
        
        <div class="rename-panel-footer">
          <button class="rename-btn rename-btn-cancel" @click="handleCancel">取消</button>
          <button 
            class="rename-btn rename-btn-confirm" 
            :disabled="!isValidName"
            @click="handleConfirm"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'confirm'])

const inputRef = ref(null)
const newName = ref('')

// 验证名称是否有效
const isValidName = computed(() => {
  const trimmed = newName.value.trim()
  return trimmed.length >= 1 && trimmed.length <= 16
})

// 监听显示状态，自动聚焦输入框
watch(() => props.visible, (newVal) => {
  if (newVal) {
    newName.value = props.currentName || ''
    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select()
    })
  }
})

const handleConfirm = () => {
  if (!isValidName.value) {
    return
  }
  
  const trimmedName = newName.value.trim()
  if (trimmedName === props.currentName) {
    emit('close')
    return
  }
  
  emit('confirm', trimmedName)
}

const handleCancel = () => {
  emit('close')
}
</script>

<style scoped>
.rename-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.rename-panel {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.rename-panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3a3a5a;
}

.rename-panel-icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.rename-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #ffd700;
}

.rename-panel-body {
  margin-bottom: 16px;
}

.rename-label {
  display: block;
  font-size: 13px;
  color: #aaa;
  margin-bottom: 8px;
}

.rename-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #fff;
  background: #1a1a2e;
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.rename-input:focus {
  border-color: #ffd700;
}

.rename-input::placeholder {
  color: #666;
}

.rename-hint {
  font-size: 11px;
  color: #666;
  margin-top: 6px;
}

.rename-panel-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.rename-btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.rename-btn-cancel {
  background: #3a3a5a;
  color: #aaa;
}

.rename-btn-cancel:hover {
  background: #4a4a6a;
  color: #fff;
}

.rename-btn-confirm {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  color: #1a1a2e;
}

.rename-btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffea00 0%, #ffbb00 100%);
  transform: translateY(-1px);
}

.rename-btn-confirm:disabled {
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

.panel-fade-enter-active .rename-panel,
.panel-fade-leave-active .rename-panel {
  transition: transform 0.2s ease;
}

.panel-fade-enter-from .rename-panel,
.panel-fade-leave-to .rename-panel {
  transform: scale(0.95);
}
</style>
