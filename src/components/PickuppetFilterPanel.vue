/**
 * @file PickuppetFilterPanel.vue
 * @description 捡宠过滤筛选面板组件
 * 业务意图：配置捡宠自动拾取的道具类别筛选规则
 * - 面板头部可拖拽移动
 * - 上部分显示筛选区域（多选勾选项）
 * - 下部分显示保存按钮
 * - 保存后配置持久化到 SettingsService
 * @since 2026-06-23
 */
<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pickuppet-filter-overlay"
      @click.self="onClose"
    >
      <div
        class="pickuppet-filter-panel"
        :style="panelStyle"
      >
        <!-- 头部（可拖拽区域） -->
        <div
          class="panel-header"
          @mousedown="startDrag"
        >
          <span class="panel-title">捡宠过滤设置</span>
          <button
            class="close-btn"
            @click="onClose"
          >
            ✕
          </button>
        </div>

        <!-- 筛选区域 -->
        <div class="filter-body">
          <!-- 武器 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterWeapon"
                type="checkbox"
              />
              武器
            </label>
          </div>

          <!-- 防具 -->
          <div class="filter-group">
            <div class="filter-group-title">防具</div>
            <div class="filter-row">
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterHelmet"
                  type="checkbox"
                />
                帽子
              </label>
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterSuit"
                  type="checkbox"
                />
                衣服
              </label>
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterGloves"
                  type="checkbox"
                />
                手套
              </label>
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterBoots"
                  type="checkbox"
                />
                鞋子
              </label>
            </div>
          </div>

          <!-- 盾牌 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterShield"
                type="checkbox"
              />
              盾牌
            </label>
          </div>

          <!-- 首饰 -->
          <div class="filter-group">
            <div class="filter-group-title">首饰</div>
            <div class="filter-row">
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterNecklace"
                  type="checkbox"
                />
                项链
              </label>
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterRing"
                  type="checkbox"
                />
                戒指
              </label>
              <label class="filter-label">
                <input
                  v-model="localFilter.pickuppetFilterEarring"
                  type="checkbox"
                />
                耳环
              </label>
            </div>
          </div>

          <!-- 战利品 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterBooty"
                type="checkbox"
              />
              战利品
            </label>
          </div>

          <!-- HP / MP / FP -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterHp"
                type="checkbox"
              />
              HP
            </label>
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterMp"
                type="checkbox"
              />
              MP
            </label>
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterFp"
                type="checkbox"
              />
              FP
            </label>
          </div>

          <!-- 宠物蛋 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterPetEgg"
                type="checkbox"
              />
              宠物蛋
            </label>
          </div>

          <!-- PK纸片 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterPkPaper"
                type="checkbox"
              />
              PK纸片
            </label>
          </div>

          <!-- 卡片 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterElementCard"
                type="checkbox"
              />
              元素卡片
            </label>
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterPiercingCard"
                type="checkbox"
              />
              穿洞卡片
            </label>
          </div>

          <!-- 其他材料 -->
          <div class="filter-row">
            <label class="filter-label">
              <input
                v-model="localFilter.pickuppetFilterOtherMaterial"
                type="checkbox"
              />
              其他材料
            </label>
            <span class="filter-hint">不符合以上类别的物品</span>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="filter-footer">
          <button
            class="save-btn"
            @click="onSave"
          >
            保存
          </button>
          <button
            class="cancel-btn"
            @click="onClose"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { loadPickuppetFilterSettings, invalidatePickuppetFilterCache } from '@/composables/usePickuppetFilter'

/**
 * @event close - 关闭面板事件
 */
const emit = defineEmits(['close'])

/** 面板是否可见 */
const props = defineProps({
  /** 面板是否可见 */
  visible: {
    type: Boolean,
    default: false
  }
})

/** 设置组合式函数，用于保存设置 */
const { saveUserSettings } = useSettings()

/** 本地筛选配置（编辑中的副本） */
const localFilter = reactive({
  pickuppetFilterWeapon: true,
  pickuppetFilterHelmet: true,
  pickuppetFilterSuit: true,
  pickuppetFilterGloves: true,
  pickuppetFilterBoots: true,
  pickuppetFilterShield: true,
  pickuppetFilterNecklace: true,
  pickuppetFilterRing: true,
  pickuppetFilterEarring: true,
  pickuppetFilterBooty: true,
  pickuppetFilterHp: true,
  pickuppetFilterMp: true,
  pickuppetFilterFp: true,
  pickuppetFilterPetEgg: true,
  pickuppetFilterPkPaper: true,
  pickuppetFilterElementCard: true,
  pickuppetFilterPiercingCard: true,
  pickuppetFilterOtherMaterial: false
})

/** 面板位置 */
const panelPosition = ref({ x: 0, y: 0 })

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 拖拽起始信息 */
const dragStart = ref({ x: 0, y: 0, left: 0, top: 0 })

/** 面板样式 */
const panelStyle = ref({
  left: '0px',
  top: '0px'
})

/**
 * 从 localStorage 中加载捡宠过滤配置到本地副本
 * 直接读取已持久化的过滤配置，避免依赖未初始化的 SettingsService 实例
 */
const loadSettings = () => {
  try {
    const filter = loadPickuppetFilterSettings()
    const keys = Object.keys(localFilter)
    for (const key of keys) {
      if (filter[key] !== undefined) {
        localFilter[key] = Boolean(filter[key])
      }
    }
  } catch (error) {
    console.error('[PickuppetFilterPanel] 加载设置失败:', error)
  }
}

/**
 * 居中显示面板
 */
const centerPanel = () => {
  const panelWidth = 320
  const panelHeight = 480
  const x = Math.max(10, (window.innerWidth - panelWidth) / 2)
  const y = Math.max(10, (window.innerHeight - panelHeight) / 2)
  panelPosition.value = { x: Math.round(x), y: Math.round(y) }
  panelStyle.value = {
    left: `${panelPosition.value.x}px`,
    top: `${panelPosition.value.y}px`
  }
}

/**
 * 将面板位置限制在视口内
 */
const clampToViewport = () => {
  const padding = 10
  const panelWidth = 320
  const panelHeight = 480
  const maxX = Math.max(padding, window.innerWidth - panelWidth - padding)
  const maxY = Math.max(padding, window.innerHeight - panelHeight - padding)
  const x = Math.min(maxX, Math.max(padding, panelPosition.value.x))
  const y = Math.min(maxY, Math.max(padding, panelPosition.value.y))
  panelPosition.value = { x: Math.round(x), y: Math.round(y) }
  panelStyle.value = {
    left: `${panelPosition.value.x}px`,
    top: `${panelPosition.value.y}px`
  }
}

/**
 * 开始拖拽
 * @param {MouseEvent} event - 鼠标按下事件
 */
const startDrag = (event) => {
  if (event.button !== 0) return
  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: panelPosition.value.x,
    top: panelPosition.value.y
  }
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', stopDrag)
  event.preventDefault()
}

/**
 * 拖拽移动
 * @param {MouseEvent} event - 鼠标移动事件
 */
const handleDragMove = (event) => {
  if (!isDragging.value) return
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  panelPosition.value = {
    x: Math.round(dragStart.value.left + dx),
    y: Math.round(dragStart.value.top + dy)
  }
  panelStyle.value = {
    left: `${panelPosition.value.x}px`,
    top: `${panelPosition.value.y}px`
  }
}

/**
 * 停止拖拽
 */
const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  clampToViewport()
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

/**
 * 保存设置到 SettingsService 实现持久化
 * 从 localStorage 读取已保存的完整设置作为基础，合并本地编辑的过滤配置
 * 避免使用未初始化的 SettingsService 实例的默认值覆盖已保存的其他设置
 */
const onSave = () => {
  try {
    // 从 localStorage 读取已保存的完整设置作为合并基础
    const rawSaved = localStorage.getItem('userSettings')
    const savedSettings = rawSaved ? JSON.parse(rawSaved) : {}
    // 构建本地编辑的过滤配置补丁
    const keys = Object.keys(localFilter)
    const patch = {}
    for (const key of keys) {
      patch[key] = localFilter[key]
    }
    // 以 localStorage 中已保存的设置为基础，合并本地编辑的过滤配置
    const mergedSettings = { ...savedSettings, ...patch }
    saveUserSettings(mergedSettings)
    // 使过滤配置缓存失效，确保捡宠下次扫描使用最新配置
    invalidatePickuppetFilterCache()
  } catch (error) {
    console.error('[PickuppetFilterPanel] 保存设置失败:', error)
  }
  emit('close')
}

/**
 * 关闭面板
 */
const onClose = () => {
  emit('close')
}

/** 监听面板可见性，显示时加载设置并居中 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadSettings()
      centerPanel()
    }
  }
)

onMounted(() => {
  if (props.visible) {
    loadSettings()
    centerPanel()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.pickuppet-filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pickuppet-filter-panel {
  position: absolute;
  width: 320px;
  max-height: 80vh;
  background-color: var(--theme-modal-bg);
  border: 1px solid var(--theme-border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  color: var(--theme-text);
  font-size: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--theme-border-strong);
  cursor: move;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: bold;
  color: var(--theme-accent);
  letter-spacing: 1px;
}

.close-btn {
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--theme-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
}

.close-btn:hover {
  color: var(--theme-text);
  background: rgba(255, 255, 255, 0.08);
}

.filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  margin-bottom: 8px;
}

.filter-group {
  margin-bottom: 8px;
}

.filter-group-title {
  font-size: 12px;
  color: var(--theme-accent);
  font-weight: bold;
  margin-bottom: 4px;
  padding-left: 2px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--theme-text);
  cursor: pointer;
  transition: color 0.2s;
}

.filter-label:hover {
  color: var(--theme-accent);
}

.filter-hint {
  font-size: 11px;
  color: var(--theme-muted);
  opacity: 0.7;
}

.filter-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--theme-accent);
  cursor: pointer;
}

.filter-footer {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid var(--theme-border-strong);
  flex-shrink: 0;
}

.save-btn,
.cancel-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.save-btn {
  background-color: var(--theme-accent);
  color: var(--theme-modal-bg);
}

.save-btn:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.06);
  color: var(--theme-muted);
  border: 1px solid var(--theme-border-strong);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--theme-text);
}
</style>
