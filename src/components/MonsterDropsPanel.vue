<!--
  @file MonsterDropsPanel.vue
  @description 怪物掉落物品面板组件：点击怪物头像显示掉落物品列表，支持拖拽和拉伸
-->
<template>
  <Teleport to="body">
    <Transition name="drops-panel-fade" appear>
      <div
        v-if="internalShow && internalMonster"
        id="monster-drops-panel"
        class="monster-drops-panel"
        :style="panelStyle"
      >
        <!-- 头部（可拖拽） -->
        <div class="panel-header" @mousedown="startDrag">
          <div class="header-left">
            <!-- 怪物头像 -->
            <div class="monster-avatar">
              <img
                :src="monsterIconPath"
                :alt="monsterName"
                @error="handleMonsterIconError"
                draggable="false"
              />
            </div>
            <h3 :style="{ color: monsterRankColor }">
              {{ monsterName }} 掉落物品
            </h3>
          </div>
          <button class="close-btn" @click="close">×</button>
        </div>

        <!-- 掉落物品总览 -->
        <div v-if="hasDrops" class="drops-summary">
          <p>总掉落 {{ filteredDropItems.length }} / {{ internalMonster.drops.length }} 种物品</p>
        </div>

        <!-- 无掉落提示 -->
        <div v-else class="no-drops">
          <p>该怪物没有掉落物品</p>
        </div>

        <!-- 筛选栏 -->
        <div v-if="hasDrops" class="filter-bar">
          <!-- 物品类型筛选 -->
          <div class="filter-item">
            <label>类型:</label>
            <select v-model="selectedType" class="filter-select">
              <option value="all">全部类型</option>
              <option value="weapon">武器</option>
              <option value="shield">盾牌</option>
              <option value="armor">防具</option>
              <option value="jewelry">首饰</option>
              <option value="other">其他</option>
            </select>
          </div>
          <!-- 物品品质筛选 -->
          <div class="filter-item">
            <label>品质:</label>
            <select v-model="selectedRarity" class="filter-select">
              <option value="all">全部品质</option>
              <option
                v-for="rarity in rarityOptions"
                :key="rarity.value"
                :value="rarity.value"
              >
                {{ rarity.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- 掉落物品列表 -->
        <div v-if="hasDrops" class="drops-container" @scroll.passive="handleScroll">
          <div v-if="filteredDropItems.length === 0" class="no-filter-result">
            <p>没有符合条件的物品</p>
          </div>
          <div v-else class="drops-grid">
            <div
              v-for="drop in visibleDropItems"
              :key="drop.itemId"
              class="drop-item"
              @mouseenter="showItemTooltip($event, drop.item)"
              @mousemove="moveItemTooltip"
              @mouseleave="hideItemTooltip"
            >
              <img
                :src="drop.iconPath"
                :alt="drop.itemName"
                class="drop-icon"
                loading="lazy"
                @error="handleImageError($event, drop.itemId)"
                draggable="false"
              />
              <div class="drop-info">
                <span class="drop-name" :style="{ color: drop.itemColor }">
                  {{ drop.itemName }}
                </span>
                <span class="drop-chance">掉率: {{ drop.probability }}</span>
              </div>
            </div>
          </div>
          <!-- 加载更多提示 -->
          <div v-if="hasMoreItems" class="load-more-hint">
            <span>滚动加载更多... ({{ visibleDropItems.length }} / {{ filteredDropItems.length }})</span>
          </div>
        </div>

        <!-- 拉伸手柄 -->
        <div
          class="resize-handle resize-handle-right"
          @mousedown.stop="startResize($event, 'right')"
        ></div>
        <div
          class="resize-handle resize-handle-bottom"
          @mousedown.stop="startResize($event, 'bottom')"
        ></div>
        <div
          class="resize-handle resize-handle-corner"
          @mousedown.stop="startResize($event, 'corner')"
        ></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useMonstersStore } from '@/store/monsters'
import { useItemsStore } from '@/store/items'

// 使用 Pinia Store
const monstersStore = useMonstersStore()
const itemsStore = useItemsStore()

// 内部状态
const internalShow = ref(false)
const internalMonster = ref(null)
const panelPosition = ref({ x: 0, y: 0 })
const panelSize = ref({ width: 400, height: 400 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const panelStart = ref({ x: 0, y: 0 })

// 拉伸状态
const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// 最小/最大尺寸
const MIN_WIDTH = 320
const MAX_WIDTH = 800
const MIN_HEIGHT = 200

// 筛选状态
const selectedType = ref('all')
const selectedRarity = ref('all')

/** 每批渲染的物品数量，避免一次性渲染大量DOM节点阻塞主线程 */
const BATCH_SIZE = 20
/** 当前已渲染的物品数量（分批递增） */
const renderCount = ref(BATCH_SIZE)

// 物品品质选项（从 itemsStore 获取）
const rarityOptions = computed(() => {
  const formula = itemsStore.rarityStyleFormula
  return [
    { value: 'common', label: '普通' },
    { value: 'uncommon', label: '罕见' },
    { value: 'rare', label: '稀有' },
    { value: 'veryrare', label: '传说' },
    { value: 'unique', label: '史诗' },
    { value: 'ultimate', label: '终极' }
  ]
})

// 怪物头像路径
const monsterIconPath = computed(() => {
  if (!internalMonster.value) return '/pt/monster_icon/default_monster.png'
  const monsterId = internalMonster.value.id
  return `/pt/monster_icon/${monsterId}.png`
})

// 怪物名称
const monsterName = computed(() => {
  if (!internalMonster.value) return '未知怪物'
  const monster = internalMonster.value
  if (monster.name?.cns) return monster.name.cns
  if (typeof monster.name === 'string') return monster.name
  return `怪物${monster.id}`
})

// 怪物等级颜色
const monsterRankColor = computed(() => {
  if (!internalMonster.value) return 'rgba(252, 252, 252, 0.6)'
  return monstersStore.getMonsterRankColor(internalMonster.value.rank)
})

// 是否有掉落
const hasDrops = computed(() => {
  if (!internalMonster.value) return false
  const drops = internalMonster.value.drops
  return drops && drops.length > 0
})

// 解析掉落概率
const parseProbability = probabilityRange => {
  if (!probabilityRange) return '未知'

  const rangeStr = probabilityRange
  const matches = rangeStr.match(/\[(\d+(?:\.\d+)?)%\s*;\s*(\d+(?:\.\d+)?)%\[/)

  if (matches && matches.length >= 3) {
    const minProb = parseFloat(matches[1])
    const maxProb = parseFloat(matches[2])

    if (!isNaN(minProb) && !isNaN(maxProb)) {
      return `${minProb}% - ${maxProb}%`
    }
  }

  const simpleMatch = rangeStr.match(/(\d+(?:\.\d+)?)%/)
  if (simpleMatch) {
    return simpleMatch[1] + '%'
  }

  return '未知'
}

// 掉落物品列表
const dropItems = computed(() => {
  if (!internalMonster.value || !hasDrops.value) return []

  return internalMonster.value.drops.map(drop => {
    const itemId = drop.item
    // staticItems 是对象，使用属性访问
    const item = itemsStore.staticItems?.[itemId]

    // 获取物品名称
    let itemName = '未知物品'
    if (item && item.name) {
      itemName =
        typeof item.name === 'string'
          ? item.name
          : item.name && item.name.cns
            ? item.name.cns
            : `物品ID: ${itemId}`
    } else {
      itemName = `物品ID: ${itemId}`
    }

    // 获取物品稀有度颜色
    const itemRarity = item ? item.rarity || 'common' : 'common'
    const itemColor = itemsStore.getRarityTextColor(itemRarity) || '#C0C0C0'

    // 解析掉落概率
    const probability = parseProbability(drop.probabilityRange)

    return {
      itemId,
      item,
      itemName,
      itemColor,
      probability,
      iconPath: `/pt/item_icon/${itemId}.png`,
      category: item?.category || 'other',
      subcategory: item?.subcategory || '',
      rarity: item?.rarity || 'common'
    }
  })
})

/**
 * 判断物品是否属于武器类型
 * @param {string} category - 物品主类别
 * @param {string} subcategory - 物品子类别
 * @returns {boolean} 是否为武器
 */
const isWeaponType = (category, subcategory) => {
  if (category === 'weapon') return true
  // 武器子类型：剑、斧、魔棒、法杖、魔杖、弓、溜溜球、拳套等
  const weaponSubtypes = ['sword', 'axe', 'staff', 'wand', 'stick', 'bow', 'yoyo', 'knuckle']
  return weaponSubtypes.includes(subcategory)
}

/**
 * 判断物品是否属于盾牌类型
 * @param {string} category - 物品主类别
 * @param {string} subcategory - 物品子类别
 * @returns {boolean} 是否为盾牌
 */
const isShieldType = (category, subcategory) => {
  return subcategory === 'shield'
}

/**
 * 判断物品是否属于防具类型
 * @param {string} category - 物品主类别
 * @param {string} subcategory - 物品子类别
 * @returns {boolean} 是否为防具
 */
const isArmorType = (category, subcategory) => {
  if (category !== 'armor') return false
  // 防具子类型：帽子、衣服、手套、鞋子
  const armorSubtypes = ['helmet', 'suit', 'gauntlet', 'boots']
  return armorSubtypes.includes(subcategory)
}

/**
 * 判断物品是否属于首饰类型
 * @param {string} category - 物品主类别
 * @param {string} subcategory - 物品子类别
 * @returns {boolean} 是否为首饰
 */
const isJewelryType = (category, subcategory) => {
  if (category === 'jewelry') return true
  const jewelrySubtypes = ['necklace', 'earring', 'ring']
  return jewelrySubtypes.includes(subcategory)
}

// 根据筛选条件过滤后的掉落物品列表
const filteredDropItems = computed(() => {
  if (!dropItems.value.length) return []

  return dropItems.value.filter(drop => {
    // 类型筛选
    if (selectedType.value !== 'all') {
      const { category, subcategory } = drop
      switch (selectedType.value) {
        case 'weapon':
          if (!isWeaponType(category, subcategory)) return false
          break
        case 'shield':
          if (!isShieldType(category, subcategory)) return false
          break
        case 'armor':
          if (!isArmorType(category, subcategory)) return false
          break
        case 'jewelry':
          if (!isJewelryType(category, subcategory)) return false
          break
        case 'other':
          // 其他类型：排除武器、盾牌、防具、首饰
          if (
            isWeaponType(category, subcategory) ||
            isShieldType(category, subcategory) ||
            isArmorType(category, subcategory) ||
            isJewelryType(category, subcategory)
          ) {
            return false
          }
          break
      }
    }

    // 品质筛选
    if (selectedRarity.value !== 'all') {
      const itemRarity = (drop.rarity || 'common').toLowerCase()
      if (itemRarity !== selectedRarity.value) return false
    }

    return true
  })
})

/**
 * 当前可见的掉落物品列表（分批渲染）
 * 只取前 renderCount 个，避免一次性创建大量DOM节点和图片请求阻塞主线程
 */
const visibleDropItems = computed(() => {
  return filteredDropItems.value.slice(0, renderCount.value)
})

/** 是否还有更多未渲染的物品 */
const hasMoreItems = computed(() => {
  return renderCount.value < filteredDropItems.value.length
})

// 筛选条件或面板可见性变化时重置渲染数量
watch([selectedType, selectedRarity, internalShow], () => {
  renderCount.value = BATCH_SIZE
})

/**
 * 滚动加载更多物品
 * 当滚动接近底部时增加渲染数量，分批加载避免主线程长时间阻塞
 * @param {Event} event - 滚动事件
 */
const handleScroll = event => {
  const container = event.target
  const { scrollTop, scrollHeight, clientHeight } = container
  // 距离底部100px时加载下一批
  if (scrollHeight - scrollTop - clientHeight < 100 && hasMoreItems.value) {
    renderCount.value = Math.min(
      renderCount.value + BATCH_SIZE,
      filteredDropItems.value.length
    )
  }
}

// 面板样式 - 使用绝对定位，不使用 transform
const panelStyle = computed(() => ({
  position: 'fixed',
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${panelSize.value.width}px`,
  height: `${panelSize.value.height}px`,
  minHeight: `${MIN_HEIGHT}px`,
  maxHeight: '80vh',
  zIndex: 10001
}))

// 显示物品详情
const showItemTooltip = (event, item) => {
  if (!item) return
  window.dispatchEvent(
    new CustomEvent('show-item-tooltip', {
      detail: {
        item,
        position: { x: event.clientX, y: event.clientY }
      }
    })
  )
}

// 移动物品详情
const moveItemTooltip = event => {
  window.dispatchEvent(
    new CustomEvent('move-item-tooltip', {
      detail: {
        position: { x: event.clientX, y: event.clientY }
      }
    })
  )
}

// 隐藏物品详情
const hideItemTooltip = () => {
  window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
}

// 图片加载错误处理
const handleImageError = (event, itemId) => {
  event.target.src = `/pt/item_icon/default_item.png`
}

// 怪物头像加载错误处理
const handleMonsterIconError = event => {
  event.target.src = `/pt/monster_icon/default_monster.png`
}

// 关闭面板时重置筛选
const close = () => {
  internalShow.value = false
  internalMonster.value = null
  // 重置筛选条件
  selectedType.value = 'all'
  selectedRarity.value = 'all'
  // 重置分批渲染计数
  renderCount.value = BATCH_SIZE
}

// 拖拽功能
const startDrag = event => {
  if (event.target.classList.contains('close-btn')) return
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }

  // 获取面板当前实际位置（考虑 transform）
  const panelEl = document.getElementById('monster-drops-panel')
  if (panelEl) {
    const rect = panelEl.getBoundingClientRect()
    panelStart.value = { x: rect.left, y: rect.top }
    // 立即应用实际位置，移除 transform
    panelPosition.value = { x: rect.left, y: rect.top }
  } else {
    panelStart.value = { ...panelPosition.value }
  }

  event.preventDefault()
}

// 限制面板位置在浏览器边界内
const clampToViewport = (x, y, panelWidth, panelHeight) => {
  const padding = 10 // 边距
  const maxX = window.innerWidth - panelWidth - padding
  const maxY = window.innerHeight - panelHeight - padding

  return {
    x: Math.max(padding, Math.min(x, maxX)),
    y: Math.max(padding, Math.min(y, maxY))
  }
}

const handleMouseMove = event => {
  if (isDragging.value) {
    const dx = event.clientX - dragStart.value.x
    const dy = event.clientY - dragStart.value.y

    // 获取面板尺寸
    const panelEl = document.getElementById('monster-drops-panel')
    const panelWidth = panelEl ? panelEl.offsetWidth : 300
    const panelHeight = panelEl ? panelEl.offsetHeight : 400

    // 计算新位置并限制在边界内
    const newX = panelStart.value.x + dx
    const newY = panelStart.value.y + dy
    const clamped = clampToViewport(newX, newY, panelWidth, panelHeight)

    panelPosition.value = clamped
  } else if (isResizing.value) {
    handleResize(event)
  }
}

const handleMouseUp = () => {
  // 拖拽结束时，确保面板位置在边界内
  if (isDragging.value) {
    const panelEl = document.getElementById('monster-drops-panel')
    if (panelEl) {
      const panelWidth = panelEl.offsetWidth
      const panelHeight = panelEl.offsetHeight
      const padding = 10
      
      // 确保面板不超出边界（使用左上角坐标）
      const maxX = window.innerWidth - panelWidth - padding
      const maxY = window.innerHeight - panelHeight - padding
      
      const finalX = Math.max(padding, Math.min(panelPosition.value.x, maxX))
      const finalY = Math.max(padding, Math.min(panelPosition.value.y, maxY))
      
      panelPosition.value = { x: finalX, y: finalY }
    }
  }
  
  isDragging.value = false
  isResizing.value = false
  resizeDirection.value = ''
}

// 开始拉伸
const startResize = (event, direction) => {
  isResizing.value = true
  resizeDirection.value = direction

  // 获取面板当前实际位置
  const panelEl = document.getElementById('monster-drops-panel')
  if (panelEl) {
    const rect = panelEl.getBoundingClientRect()
    resizeStart.value = {
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height
    }
    panelStart.value = { x: rect.left, y: rect.top }
    panelPosition.value = { x: rect.left, y: rect.top }
  }

  event.preventDefault()
}

// 处理拉伸
const handleResize = event => {
  if (!isResizing.value) return

  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y

  let newWidth = resizeStart.value.width
  let newHeight = resizeStart.value.height

  // 根据拉伸方向计算新尺寸
  if (resizeDirection.value === 'right' || resizeDirection.value === 'corner') {
    newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.value.width + dx))
  }

  // 拉伸底部或角落时，调整高度
  if (resizeDirection.value === 'bottom' || resizeDirection.value === 'corner') {
    const maxVisibleHeight = window.innerHeight * 0.8
    newHeight = Math.max(MIN_HEIGHT, Math.min(maxVisibleHeight, resizeStart.value.height + dy))
  }

  // 应用新尺寸
  panelSize.value = { width: newWidth, height: newHeight }

  // 确保面板不超出右边界
  const maxX = window.innerWidth - 10
  if (panelPosition.value.x + newWidth > maxX) {
    panelSize.value.width = maxX - panelPosition.value.x - 10
  }

  // 确保面板不超出底部边界
  const maxY = window.innerHeight - 10
  if (panelPosition.value.y + newHeight > maxY) {
    panelSize.value.height = maxY - panelPosition.value.y - 10
  }
}

// 显示掉落面板事件处理
const handleShowDropsPanel = event => {
  const { monsterId, position } = event.detail

  console.log('MonsterDropsPanel 收到事件:', { monsterId, position })

  // 从 store 中查找怪物数据（staticMonsters 的 key 是字符串类型）
  const monster = monstersStore.staticMonsters[monsterId] || monstersStore.staticMonsters[String(monsterId)]
  if (!monster) {
    console.error(`未找到ID为 ${monsterId} 的怪物数据, staticMonsters keys:`, Object.keys(monstersStore.staticMonsters).slice(0, 5))
    return
  }

  console.log('找到怪物数据:', monster)

  internalMonster.value = monster

  // 重置分批渲染计数，避免上一次面板的渲染状态残留
  renderCount.value = BATCH_SIZE

  // 计算面板初始位置（居中显示，使用左上角坐标）
  const panelWidth = panelSize.value.width
  const panelHeight = 300 // 默认高度
  if (position) {
    // 如果有指定位置，使用该位置，但确保面板完整显示在视口内
    const padding = 10
    const x = Math.max(padding, Math.min(position.x, window.innerWidth - panelWidth - padding))
    const y = Math.max(padding, Math.min(position.y, window.innerHeight - panelHeight - padding))
    panelPosition.value = { x, y }
  } else {
    // 默认居中显示
    panelPosition.value = {
      x: Math.round((window.innerWidth - panelWidth) / 2),
      y: Math.round((window.innerHeight - panelHeight) / 2)
    }
  }
  
  internalShow.value = true
}

// 监听自定义事件
onMounted(() => {
  window.addEventListener('show-monster-drops-panel', handleShowDropsPanel)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('show-monster-drops-panel', handleShowDropsPanel)
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.monster-drops-panel {
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(100, 100, 150, 0.5);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  user-select: none;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 100, 150, 0.3);
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.monster-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid rgba(100, 100, 150, 0.5);
  flex-shrink: 0;
}

.monster-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.5);
}

.drops-summary {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.drops-summary p {
  margin: 0;
  color: #aaa;
  font-size: 14px;
}

.no-drops {
  text-align: center;
  padding: 20px;
  color: #888;
}

.no-drops p {
  margin: 0;
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  color: #aaa;
  white-space: nowrap;
}

.filter-select {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid rgba(100, 100, 150, 0.5);
  background: rgba(30, 30, 40, 0.9);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  min-width: 90px;
}

.filter-select:hover {
  border-color: rgba(100, 150, 255, 0.5);
}

.filter-select:focus {
  border-color: rgba(100, 150, 255, 0.8);
}

.no-filter-result {
  text-align: center;
  padding: 20px;
  color: #888;
}

.no-filter-result p {
  margin: 0;
}

.drops-container {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 自定义滚动条样式 */
.drops-container::-webkit-scrollbar {
  width: 8px;
}

.drops-container::-webkit-scrollbar-track {
  background: #000;
  border-radius: 4px;
}

.drops-container::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 150, 0.5);
  border-radius: 4px;
}

.drops-container::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 150, 255, 0.6);
}

.drops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 4px;
}

.drop-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  cursor: pointer;
  /* 跳过不可见内容的渲染，减少主线程阻塞 */
  content-visibility: auto;
  contain-intrinsic-size: 80px;
}

.drop-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.drop-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: contain;
}

.drop-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.drop-name {
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drop-chance {
  font-size: 9px;
  color: #888;
}

/* 拉伸手柄 */
.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-handle-right {
  right: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
}

.resize-handle-bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: ns-resize;
}

.resize-handle-corner {
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  border-bottom-right-radius: 12px;
}

.resize-handle:hover {
  background: rgba(100, 150, 255, 0.3);
}

.resize-handle-corner:hover {
  background: linear-gradient(135deg, transparent 50%, rgba(100, 150, 255, 0.5) 50%);
}

/* 加载更多提示 */
.load-more-hint {
  text-align: center;
  padding: 8px;
  color: #888;
  font-size: 12px;
}

/* 过渡动画 */
.drops-panel-fade-enter-active,
.drops-panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drops-panel-fade-enter-from,
.drops-panel-fade-leave-to {
  opacity: 0;
}
</style>
