<!--
  @fileoverview 华弗PK纸片兑换面板组件
  @description 华弗NPC交互面板，玩家可使用PK纸片(ID:814)兑换各种物品
  @author FLYFF Team
  @version 1.0.0
  @created 2026-06-21
-->
<template>
  <div v-if="isVisible" ref="draggablePanel" class="huafu-shop-panel">
    <!-- 关闭按钮 -->
    <button class="close-button" @click="closeModal">×</button>

    <!-- 面板头部（可拖拽） -->
    <div class="panel-header">
      <img class="panel-npc-icon" src="/pt/npc_icon/waforu.png" alt="华弗" draggable="false" />
      <div class="panel-title-area">
        <h2 class="panel-title">⚔️ PK纸片兑换 - 华弗</h2>
        <p class="panel-subtitle">嗨,勇士,如果手里的PK纸片充足,可以找我兑换好东西!</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <span class="filter-label">类型:</span>
      <select v-model="selectedCategory" class="filter-select">
        <option value="all">全部</option>
        <option v-for="category in categoryOptions" :key="category" :value="category">
          {{ getCategoryLabel(category) }}
        </option>
      </select>
    </div>

    <!-- 捡宠轮播提示 -->
    <div v-if="selectedCategory === 'pickuppet'" class="rotation-info-bar">
      🐾 每日轮播捡宠（0点重置） | 今日展示: {{ rotationInfo.dailyCount + 1 }}只 | 周期: {{ rotationInfo.currentCycleDay + 1 }}/{{ rotationInfo.totalDays }}天
    </div>

    <!-- 商品列表 -->
    <div class="item-list">
      <div
        v-for="item in displayedItems"
        :key="item.id"
        class="item-element"
        :data-item-id="item.id"
        @mouseenter="showItemTooltip"
        @mousemove="moveItemTooltip"
        @mouseleave="hideItemTooltip"
      >
        <div class="item-icon-wrapper">
          <img
            :src="item.icon || `/pt/item_icon/${item.id}.png`"
            :alt="getItemName(item)"
            class="item-icon"
            draggable="false"
            @error="setDefaultIcon"
          />
        </div>

        <!-- 商品信息 -->
        <div class="item-info">
          <h3 class="item-name" :class="getRarityClass(item.rarity)">{{ getItemName(item) }}</h3>
          <p class="item-description">{{ getItemDescription(item) }}</p>
        </div>

        <!-- 价格与兑换 -->
        <div class="item-action">
          <div class="item-price">
            <img class="price-icon" src="/pt/item_icon/814.png" alt="PK纸片" draggable="false" @error="setDefaultCurrencyIcon" />
            <span>{{ item.ratio.cost }}:{{ item.ratio.gain }}</span>
          </div>
          <div class="exchange-controls">
            <input
              v-model.number="item.quantities"
              type="number"
              min="1"
              :max="getMaxExchange(item)"
              class="quantity-input"
            />
            <button class="exchange-button" @click="exchangeItem(item)">兑换</button>
          </div>
        </div>
      </div>

      <!-- 空列表提示 -->
      <div v-if="displayedItems.length === 0" class="empty-hint">
        暂无可兑换的物品
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-bar">
      <div class="bottom-info">
        <img class="bottom-currency-icon" src="/pt/item_icon/814.png" alt="PK纸片" draggable="false" @error="setDefaultCurrencyIcon" />
        <span>PK纸片: {{ pkChipCount.toLocaleString() }}</span>
      </div>
      <div class="bottom-hint">PK纸片通过击杀怪物概率获得</div>
    </div>
  </div>

  <!-- 消息提示 -->
  <div v-if="showMessage" class="message-element" :class="messageType">
    {{ messageContent }}
  </div>
</template>

<script setup>
/**
 * 华弗PK纸片兑换面板组件
 * 使用PK纸片(ID:814)兑换各种物品
 * 物品数据引用自 DIAMOND_SHOP_ITEMS，兑换比例由 HUAFU_EXCHANGE_RATIOS 控制
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { makeElementDraggable } from '@/utils/gameTools'
import { HUAFU_EXCHANGE_RATIOS, HUAFU_EXCLUSIVE_ITEMS, getDefaultRatio } from '@/data/HUAFU_SHOPING'
import { DIAMOND_SHOP_ITEMS } from '@/data/DIAMOND_SHOP_ITEMS'
import BagService from '@/services/BagService'
import { storageService } from '@/services/StorageService'
import { usePickuppetRotation } from '@/composables/usePickuppetRotation'

/** PK纸片的物品ID */
const PK_CHIP_ITEM_ID = 814

// Props定义
const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  },
  /** 显示动画消息的回调函数 */
  showAnimationMessage: {
    type: Function,
    default: null
  }
})

// 事件定义
const emit = defineEmits(['update:isVisible', 'add-battle-log'])

// Store
const itemsStore = useItemsStore()
const gameStore = useGameStore()

// 模板引用
const draggablePanel = ref(null)

// 消息提示状态
const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')

/**
 * 计算PK纸片的当前持有数量
 * @returns {number} PK纸片数量
 */
const pkChipCount = computed(() => {
  return itemsStore.getItemCount(PK_CHIP_ITEM_ID)
})

/**
 * 商店物品列表（从DIAMOND_SHOP_ITEMS引用物品数据，叠加HUAFU_EXCHANGE_RATIOS兑换比例）
 * @returns {Array} 可兑换物品数组，每项附带 ratio 兑换比例
 */
/** 筛选栏选中的分类 */
const selectedCategory = ref('all')

/**
 * 所有可用的分类选项
 * @returns {string[]} 分类列表
 */
const categoryOptions = computed(() => {
  const categories = new Set()
  shopItems.value.forEach(item => {
    if (item?.category) {
      categories.add(item.category)
    }
  })
  // 始终包含捡宠分类（轮播展示，与钻石商店一致）
  if (dailyPickuppets.value.length > 0) {
    categories.add('pickuppet')
  }
  return Array.from(categories).sort()
})

/**
 * 分类标签映射
 * @param {string} category - 分类键名
 * @returns {string} 中文标签
 */
const getCategoryLabel = category => {
  const labels = {
    buff: '增益',
    scroll: '卷轴/石',
    material: '材料',
    pack: '礼包/盒子',
    recovery: '恢复/药剂',
    weapon: '武器',
    armor: '防具',
    fashion: '时装',
    pickuppet: '捡宠'
  }
  return labels[category] || category
}

/**
 * 商店全部物品列表（从DIAMOND_SHOP_ITEMS + HUAFU_EXCLUSIVE_ITEMS引用，叠加兑换比例）
 * @returns {Array} 可兑换物品数组，每项附带 ratio 兑换比例
 */
/** 捡东西宠物轮播展示（与钻石商店一致） */
const { dailyPickuppets, rotationInfo } = usePickuppetRotation()

const shopItems = computed(() => {
  try {
    const items = []
    // 从钻石商店数据源读取所有物品（排除捡宠类，捡宠使用轮播展示）
    for (const key of Object.keys(DIAMOND_SHOP_ITEMS)) {
      const item = DIAMOND_SHOP_ITEMS[key]
      if (!item || typeof item !== 'object' || !item.id) continue
      // 捡宠类跳过，使用轮播展示
      if (item.category === 'pickuppet') continue

      // 查找该物品的兑换比例覆盖，未配置则使用默认比例（钻石价格×15）
      const ratio = HUAFU_EXCHANGE_RATIOS[String(item.id)] || getDefaultRatio(item.price)

      items.push({
        ...item,
        quantities: 1,
        ratio
      })
    }

    // 追加华弗专属物品
    for (const key of Object.keys(HUAFU_EXCLUSIVE_ITEMS)) {
      const item = HUAFU_EXCLUSIVE_ITEMS[key]
      if (!item || typeof item !== 'object' || !item.id) continue

      // 专属物品自带 ratio，直接使用
      const ratio = item.ratio || getDefaultRatio(item.price)
      items.push({
        ...item,
        quantities: 1,
        ratio
      })
    }

    // 按消耗PK纸片数量升序排列
    return items.sort((a, b) => (a.ratio.cost || 1) - (b.ratio.cost || 1))
  } catch (error) {
    console.error('[HuaFuShopModal] 加载华弗商店商品数据失败:', error)
    return []
  }
})

/**
 * 筛选后的展示物品列表
 * @returns {Array} 筛选后的物品数组
 */
const displayedItems = computed(() => {
  if (selectedCategory.value === 'pickuppet') {
    // 捡宠使用轮播展示（与钻石商店一致的每日捡宠）
    return dailyPickuppets.value.map(item => {
      const ratio = HUAFU_EXCHANGE_RATIOS[String(item.id)] || getDefaultRatio(item.price)
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantities: 1,
        icon: item.icon,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        rarity: item.rarity,
        duration: item.duration,
        ratio
      }
    })
  }
  if (selectedCategory.value === 'all') {
    // "全部"分类：常规商品 + 今日轮播捡宠（与钻石商店逻辑一致）
    const rotationPets = dailyPickuppets.value.map(item => {
      const ratio = HUAFU_EXCHANGE_RATIOS[String(item.id)] || getDefaultRatio(item.price)
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantities: 1,
        icon: item.icon,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        rarity: item.rarity,
        duration: item.duration,
        ratio
      }
    })
    return [...shopItems.value, ...rotationPets]
  }
  return shopItems.value.filter(item => item.category === selectedCategory.value)
})

/**
 * 获取物品名称
 * @param {Object} item - 商品数据
 * @returns {string} 物品名称
 */
const getItemName = item => {
  if (typeof item.name === 'object') {
    return item.name.cns || item.name.en || `物品ID: ${item.id}`
  }
  return item.name || `物品ID: ${item.id}`
}

/**
 * 获取礼包内物品的名称
 * 优先从钻石商店和华弗专属物品中查找，找不到则返回ID
 * @param {number} itemId - 礼包内物品ID
 * @returns {string} 物品名称
 */
const getContentItemName = itemId => {
  // 从钻石商店查找
  const diamondItem = DIAMOND_SHOP_ITEMS[String(itemId)]
  if (diamondItem) {
    if (typeof diamondItem.name === 'object') {
      return diamondItem.name.cns || diamondItem.name.en || `物品ID: ${itemId}`
    }
    return diamondItem.name || `物品ID: ${itemId}`
  }
  // 从华弗专属物品查找
  const exclusiveItem = HUAFU_EXCLUSIVE_ITEMS[String(itemId)]
  if (exclusiveItem) {
    if (typeof exclusiveItem.name === 'object') {
      return exclusiveItem.name.cns || exclusiveItem.name.en || `物品ID: ${itemId}`
    }
    return exclusiveItem.name || `物品ID: ${itemId}`
  }
  // 从itemsStore静态数据查找
  try {
    const staticItem = itemsStore.getItemConfig(itemId)
    if (staticItem?.name) {
      if (typeof staticItem.name === 'object') {
        return staticItem.name.cns || staticItem.name.en || `物品ID: ${itemId}`
      }
      return staticItem.name || `物品ID: ${itemId}`
    }
  } catch {
    // 查找失败，使用默认名称
  }
  return `物品ID: ${itemId}`
}

/**
 * 获取物品描述
 * @param {Object} item - 商品数据
 * @returns {string} 物品描述
 */
const getItemDescription = item => {
  if (typeof item.description === 'object') {
    return item.description.cns || item.description.en || ''
  }
  return item.description || ''
}

/**
 * 根据稀有度获取CSS类名
 * @param {string} rarity - 稀有度
 * @returns {string} CSS类名
 */
/**
 * 根据稀有度获取CSS类名
 * @param {string} rarity - 稀有度
 * @returns {string} CSS类名
 */
const getRarityClass = rarity => {
  const classMap = {
    common: 'rarity-common',
    uncommon: 'rarity-uncommon',
    rare: 'rarity-rare',
    unique: 'rarity-unique',
    legendary: 'rarity-legendary',
    ultimate: 'rarity-ultimate'
  }
  return classMap[rarity] || 'rarity-common'
}

/**
 * 获取单次最大可兑换次数
 * @param {Object} item - 商品数据
 * @returns {number} 最大可兑换次数
 */
const getMaxExchange = item => {
  const cost = Number(item.ratio?.cost) || 1
  return Math.floor(pkChipCount.value / cost)
}

/**
 * 设置默认物品图标
 * @param {Event} event - 错误事件
 */
const setDefaultIcon = event => {
  event.target.src = '/pt/item_icon/default.png'
}

/**
 * 设置默认货币图标
 * @param {Event} event - 错误事件
 */
const setDefaultCurrencyIcon = event => {
  event.target.src = '/pt/item_icon/default.png'
}

/**
 * 关闭面板
 */
const closeModal = () => {
  hideItemTooltip()
  emit('update:isVisible', false)

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

/**
 * 兑换物品
 * @param {Object} item - 要兑换的商品数据
 */
const exchangeItem = item => {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  // 获取兑换次数
  const exchangeTimes = Math.max(1, Math.floor(Number(item.quantities) || 1))

  // 从兑换比例中读取每次消耗和获得
  const costPerTime = Number(item.ratio?.cost) || 1
  const gainPerTime = Number(item.ratio?.gain) || 1

  // 计算实际获得的物品总数
  const totalItemQuantity = gainPerTime * exchangeTimes

  // 计算所需PK纸片总数
  const totalPrice = costPerTime * exchangeTimes

  // 检查PK纸片余额
  if (pkChipCount.value < totalPrice) {
    showMessageFunc(`PK纸片不足！需要 ${totalPrice.toLocaleString()}，当前 ${pkChipCount.value.toLocaleString()}`, 'error')
    return
  }

  // 移除PK纸片
  const removeSuccess = itemsStore.removeItemFromBag(PK_CHIP_ITEM_ID, totalPrice)
  if (!removeSuccess) {
    showMessageFunc('扣除PK纸片失败，请稍后重试', 'error')
    return
  }

  // 添加兑换物品到背包
  const bagService = new BagService()
  const addSuccess = bagService.addItemToBag(item.id, `/pt/item_icon/${item.id}.png`, totalItemQuantity, true)

  if (!addSuccess) {
    // 添加失败，退还PK纸片
    itemsStore.addItemToBag(PK_CHIP_ITEM_ID, totalPrice)
    showMessageFunc('背包已满，无法获得物品！', 'error')
    return
  }

  // 保存玩家数据
  try {
    if (gameStore.player) {
      gameStore.player.bag = JSON.parse(JSON.stringify(itemsStore.playerBag))
    }
    storageService.savePlayerPatch({
      bag: JSON.parse(JSON.stringify(itemsStore.playerBag))
    })
  } catch (error) {
    console.error('[HuaFuShopModal] 保存玩家数据失败:', error)
  }

  // 播放购买成功音效
  if (gameStore.audioService) {
    gameStore.audioService.playSFX('InfTrade.wav')
  }

  const itemName = getItemName(item)
  showMessageFunc(`兑换 ${itemName} ×${totalItemQuantity}，消耗PK纸片 ${totalPrice.toLocaleString()}`, 'success')

  // 显示动画消息
  if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
    const iconPath = `/pt/item_icon/${item.id}.png`
    props.showAnimationMessage(`兑换 ${itemName} ×${totalItemQuantity}`, 'buy', iconPath)
  }

  // 添加战斗日志
  emit('add-battle-log', `使用 ${totalPrice.toLocaleString()} PK纸片兑换了 ${itemName} ×${totalItemQuantity}`)

  // 触发背包UI更新
  const updateBagEvent = new CustomEvent('update-bag-ui')
  window.dispatchEvent(updateBagEvent)
}

/**
 * 显示物品Tooltip
 * @param {Event} event - 鼠标进入事件
 */
const showItemTooltip = event => {
  const itemElement = event.target.closest('.item-element')
  if (!itemElement) return

  const itemId = parseInt(itemElement.dataset.itemId, 10)
  if (!itemId) return

  const shopItemData = displayedItems.value.find(i => i.id === itemId)
  if (!shopItemData) return

  // 创建兼容ItemTooltip的物品对象
  const itemForTooltip = {
    ...shopItemData,
    name: { cns: getItemName(shopItemData), en: getItemName(shopItemData) },
    icon: shopItemData.icon
  }

  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item: itemForTooltip,
      position: {
        x: event.clientX + 15,
        y: event.clientY + 15
      }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

/**
 * 移动物品Tooltip
 * @param {Event} event - 鼠标移动事件
 */
const moveItemTooltip = event => {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: {
        x: event.clientX + 15,
        y: event.clientY + 15
      }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

/**
 * 隐藏物品Tooltip
 */
const hideItemTooltip = () => {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 'info' | 'success' | 'error'
 */
const showMessageFunc = (message, type = 'info') => {
  messageContent.value = message
  messageType.value = type
  showMessage.value = true

  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

// 生命周期钩子
onMounted(() => {
  // 使面板可拖拽 - 使用整个头部作为拖拽区域
  if (draggablePanel.value) {
    const headerElement = draggablePanel.value.querySelector('.panel-header')
    if (headerElement) {
      makeElementDraggable(draggablePanel.value, headerElement)
    }
  }
})

onUnmounted(() => {
  hideItemTooltip()
})
</script>

<style scoped>
/* 主面板 */
.huafu-shop-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 580px;
  background: linear-gradient(135deg, rgba(20, 10, 30, 0.95) 0%, rgba(10, 5, 20, 0.95) 100%);
  box-shadow:
    rgba(0, 0, 0) 0px 0px 40px,
    rgba(180, 100, 255, 0.2) 0px 0px 30px inset;
  z-index: 1000;
  border-radius: 12px;
  border: 1px solid rgba(180, 100, 255, 0.3);
  padding: 20px;
  color: #fff;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  overflow: hidden;
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 5px;
  right: 10px;
  background: transparent;
  color: rgb(255, 255, 255);
  border: none;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  background: rgba(255, 80, 80, 0.6);
  transform: scale(1.1);
  color: #fff;
}

.close-button:active {
  transform: scale(0.95);
  background: rgba(255, 80, 80, 0.8);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 15px;
  position: relative;
  padding-bottom: 12px;
  cursor: move;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.panel-header:hover {
  cursor: grab;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 250px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #b464ff, transparent);
  border-radius: 50%;
}

.panel-npc-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid rgba(180, 100, 255, 0.5);
  box-shadow: 0 0 12px rgba(180, 100, 255, 0.4);
}

.panel-title-area {
  flex: 1;
}

.panel-title {
  margin: 0;
  color: #e0c0ff;
  font-size: 22px;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(180, 100, 255, 0.5);
}

.panel-subtitle {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-style: italic;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(180, 100, 255, 0.25);
  border-radius: 10px;
  margin-bottom: 10px;
}

/* 捡宠轮播提示栏 */
.rotation-info-bar {
  padding: 6px 12px;
  background: rgba(180, 100, 255, 0.1);
  border: 1px solid rgba(180, 100, 255, 0.35);
  border-radius: 8px;
  margin-bottom: 8px;
  color: rgba(224, 192, 255, 0.9);
  font-size: 13px;
  text-align: center;
  font-weight: 600;
}

.filter-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
  font-size: 14px;
}

.filter-select {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(180, 100, 255, 0.35);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  padding: 0 10px;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: rgba(180, 100, 255, 0.6);
  box-shadow: 0 0 6px rgba(180, 100, 255, 0.3);
}

/* 商品列表 */
.item-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  overflow-y: auto;
  max-height: 360px;
  padding: 8px;
  scrollbar-color: #b464ff #000000;
  scrollbar-width: thin;
}

.item-list::-webkit-scrollbar {
  width: 10px;
}

.item-list::-webkit-scrollbar-track {
  background: #0a0514;
  border-radius: 6px;
}

.item-list::-webkit-scrollbar-thumb {
  background: #b464ff;
  border-radius: 6px;
  border: 2px solid rgba(180, 100, 255, 0.3);
}

.item-list::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 100, 255, 0.85);
}

/* 商品项 */
.item-element {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(180, 100, 255, 0.15);
  border-radius: 10px;
  padding: 10px 8px;
  transition: all 0.3s ease;
  gap: 6px;
}

.item-element:hover {
  background: rgba(180, 100, 255, 0.12);
  border-color: rgba(180, 100, 255, 0.35);
  transform: scale(1.02);
}

/* 物品图标 */
.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  transition: all 0.3s ease;
  cursor: pointer;
  display: block;
}

.item-icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
  flex-shrink: 0;
}

.item-icon-wrapper::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -120%;
  width: 220%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(180, 100, 255, 0.4), transparent);
  transform: rotate(35deg);
  will-change: transform, top, left;
  pointer-events: none;
  animation: huafu-icon-shine 3s linear infinite;
}

@keyframes huafu-icon-shine {
  0% {
    top: -120%;
    left: -120%;
  }

  30% {
    top: 120%;
    left: 120%;
  }

  100% {
    top: 120%;
    left: 120%;
  }
}

/* 物品信息 */
.item-info {
  width: 100%;
  text-align: center;
  min-width: 0;
}

.item-name {
  margin: 0 0 2px 0;
  font-size: 13px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 稀有度颜色 */
.rarity-common { color: #cccccc; }
.rarity-uncommon { color: #4caf50; }
.rarity-rare { color: #5c9dff; }
.rarity-unique { color: #ff9800; }
.rarity-legendary { color: #e040fb; }
.rarity-ultimate { color: #ffd700; }

/* 兑换操作区域 */
.item-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  flex-shrink: 0;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e0c0ff;
  font-weight: bold;
  font-size: 14px;
}

.price-icon {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  object-fit: cover;
}

.exchange-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.quantity-input {
  width: 48px;
  height: 26px;
  padding: 2px 4px;
  border-radius: 5px;
  border: 1px solid #b464ff;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: center;
  font-size: 13px;
  outline: none;
}

.quantity-input:focus {
  border-color: #e0c0ff;
  box-shadow: 0 0 6px rgba(180, 100, 255, 0.4);
}

.exchange-button {
  background: linear-gradient(to bottom, #b464ff, #8030cc);
  color: #fff;
  border: none;
  padding: 5px 14px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  font-size: 13px;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.exchange-button:hover {
  background: linear-gradient(to bottom, #c480ff, #9a40e0);
  transform: scale(1.05);
}

.exchange-button:active {
  transform: scale(0.95);
}

/* 空列表提示 */
.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 40px;
  font-size: 16px;
}

/* 底部栏 */
.bottom-bar {
  position: absolute;
  bottom: 15px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(180, 100, 255, 0.1);
  border: 1px solid rgba(180, 100, 255, 0.2);
  border-radius: 8px;
}

.bottom-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: bold;
  color: #e0c0ff;
}

.bottom-currency-icon {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  object-fit: cover;
}

.bottom-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* 消息提示样式 */
.message-element {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 20px 30px;
  border-radius: 10px;
  border: 1px solid rgba(180, 100, 255, 0.3);
  font-size: 16px;
  font-weight: bold;
  z-index: 10000;
  opacity: 0;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: showMessageAnimation 3s ease-in-out forwards;
}

.message-element.success {
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.3);
}

.message-element.error {
  color: #f44336;
  border-color: rgba(244, 67, 54, 0.3);
}

@keyframes showMessageAnimation {
  0% {
    opacity: 0;
    transform: translate(-50%, 60%);
  }

  20% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }

  80% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
}
</style>
