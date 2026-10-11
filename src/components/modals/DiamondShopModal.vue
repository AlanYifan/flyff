<template>
  <div v-if="isVisible" ref="draggablePanel" class="diamond-shop-panel">
    <!-- 关闭按钮 -->
    <button class="close-button" @click="closeModal">×</button>

    <div class="panel-header">
      <img class="panel-logo" src="/pt/fly/Flyff_Universe.png" alt="Flyff Universe" draggable="false" />
      <h2 class="panel-title">💎 钻石商店 - 瑞多斯</h2>
    </div>

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

    <!-- 时装套装轮播提示 -->
    <div v-if="selectedCategory === 'fashionset'" class="rotation-info-bar">
      👗 每日轮播时装套装（0点重置） | 今日展示: {{ fashionSetRotationInfo.dailyCount }}款 | 周期: {{ fashionSetRotationInfo.currentCycleDay + 1 }}/{{ fashionSetRotationInfo.totalDays }}天
    </div>

    <div class="item-list">
      <div
v-for="item in displayedItems" :key="item.id" class="item-element" :data-item-id="item.id"
        @mouseover="hoverItem(item)" @mouseleave="leaveItem">
        <div class="item-icon-outer">
          <div class="item-icon-wrapper">
            <img
              :src="'/pt/item_icon/' + item.id + '.png'"
              :alt="getItemName(item)"
              class="item-icon"
              draggable="false"
              @error="setDefaultIcon"
              @mouseenter="showItemTooltip"
              @mousemove="moveItemTooltip"
              @mouseleave="hideItemTooltip"
            />
          </div>
          <!-- 持续时间角标 -->
          <span v-if="item.duration !== undefined && item.duration !== null" class="duration-badge" :class="{ 'duration-permanent': item.duration < 0 }">
            {{ formatShopDuration(item.duration) }}
          </span>
        </div>

        <!-- 商品信息 -->
        <div class="item-info">
          <h3 class="item-name">{{ getItemName(item) }}</h3>
          <p class="item-id">ID: {{ item.id }}</p>
          <p class="item-price">价格: {{ item.price }} 💎</p>
        </div>

        <!-- 数量输入框 -->
        <input v-model="item.quantities" type="number" min="1" max="99" class="quantity-input" />

        <!-- 购买按钮 -->
        <button class="buy-button" @click="purchaseItem(item)">购买</button>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="bottom-bar">
      <!-- 钻石数量显示 -->
      <div class="diamond-display">💎钻石: {{ playerDiamonds }}</div>

      <!-- 测试按钮 -->
      <!-- <button v-if="isDev" class="test-button" @click="addTestDiamonds">测试+99999💎</button> -->

      <!-- 充值按钮 -->
      <button class="recharge-button" @click="openRechargeModal">充值</button>
    </div>
  </div>

  <!-- 充值面板 -->
  <div v-if="showRechargeModal" ref="rechargePanel" class="recharge-panel">
    <button class="close-button" @click="closeRechargeModal">×</button>
    <h2 class="panel-title">💎 钻石充值</h2>

    <!-- 充值选项 -->
    <div class="recharge-options">
      <button
v-for="option in rechargeOptions" :key="option.amount" class="recharge-option-button"
        @click="rechargeDiamonds(option.amount)">
        {{ option.amount }} 钻石 - {{ option.price }}
      </button>
    </div>

    <!-- 自定义充值 -->
    <div class="custom-recharge">
      <label class="custom-label">自定义充值数量:</label>
      <input v-model="customAmount" type="number" placeholder="输入充值数量" class="custom-input" />
      <button class="custom-button" @click="rechargeCustom">充值</button>
    </div>

    <!-- 兑换比例说明 -->
    <div class="exchange-info">兑换比例: 1000000金币 = 1💎钻石</div>
  </div>

  <!-- 消息提示 -->
  <div v-if="showMessage" class="message-element" :class="messageType">
    {{ messageContent }}
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { makeElementDraggable } from '@/utils/gameTools'
import BagService from '@/services/BagService'
import { storageService } from '@/services/StorageService'
import { usePickuppetRotation } from '@/composables/usePickuppetRotation'
import { useFashionSetRotation } from '@/composables/useFashionSetRotation'
import { isDev } from '@/utils/isDev'
import { isGM } from '@/utils/isGM'

// 定义props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  showAnimationMessage: {
    type: Function,
    default: null
  }
})

// 获取store
const store = useGameStore()
const itemsStore = useItemsStore()
// storageService 已通过 import 导入全局单例

// 定义emits
const emit = defineEmits(['update:isVisible', 'purchase-success', 'diamonds-changed'])

// refs
const draggablePanel = ref(null)
const rechargePanel = ref(null)

// 数据
// 初始化钻石数量，优先从当前存档加载以确保最新值
const playerDiamonds = ref(0)

// 在组件挂载时加载钻石值
onMounted(async () => {
  // 从存档加载钻石值以确保是最新的
  if (store.storageService) {
    try {
      const currentSaveData = store.storageService.getCurrentSaveData()
      if (currentSaveData && currentSaveData.diamonds !== undefined) {
        playerDiamonds.value = Number(currentSaveData.diamonds)
        // 同时更新store.player中的值以确保同步
        if (store.player) {
          store.player.diamonds = Number(currentSaveData.diamonds)
        }
      } else {
        // 如果存档中没有钻石值，则使用store.player中的值
        playerDiamonds.value = Number(store.player?.diamonds) || 0
      }
    } catch (error) {
      console.error('加载钻石数据失败:', error)
      playerDiamonds.value = Number(store.player?.diamonds) || 0
    }
  } else {
    playerDiamonds.value = Number(store.player?.diamonds) || 0
  }
})
const showRechargeModal = ref(false)
const customAmount = ref('')
const showMessage = ref(false)
const messageContent = ref('')
const messageType = ref('info')

// 商品信息
const shopItems = ref([])
const selectedCategory = ref('all')

const categoryOptions = computed(() => {
  const categories = new Set()
  shopItems.value.forEach(item => {
    if (item?.category) {
      categories.add(item.category)
    }
  })
  // 始终包含捡东西宠物分类（轮播展示，不在shopItems中）
  if (dailyPickuppets.value.length > 0) {
    categories.add('pickuppet')
  }
  // 始终包含时装套装分类（轮播展示，不在shopItems中）
  if (dailyFashionSets.value.length > 0) {
    categories.add('fashionset')
  }
  return Array.from(categories).sort()
})

// 捡东西宠物轮播展示
const { dailyPickuppets, rotationInfo } = usePickuppetRotation()

// 时装套装轮播展示
const { dailyFashionSets, fashionSetRotationInfo } = useFashionSetRotation()

const displayedItems = computed(() => {
  if (selectedCategory.value === 'pickuppet') {
    // 捡东西宠物使用轮播展示
    return dailyPickuppets.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantities: 1,
      icon: item.icon,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      rarity: item.rarity,
      duration: item.duration
    }))
  }
  if (selectedCategory.value === 'fashionset') {
    // 时装套装使用轮播展示
    return dailyFashionSets.value.map(item => ({
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
      sex: item.sex
    }))
  }
  if (selectedCategory.value === 'all') {
    // "全部"分类：常规商品 + 今日轮播捡宠 + 今日轮播时装套装
    const rotationPets = dailyPickuppets.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantities: 1,
      icon: item.icon,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      rarity: item.rarity,
      duration: item.duration
    }))
    const rotationSets = dailyFashionSets.value.map(item => ({
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
      sex: item.sex
    }))
    return [...shopItems.value, ...rotationPets, ...rotationSets]
  }
  return shopItems.value.filter(item => item.category === selectedCategory.value)
})

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
    fashionset: '时装套装',
    pickuppet: '捡宠'
  }
  return labels[category] || category
}

// 加载钻石商城商品数据
const loadShopItems = () => {
  try {
    // 从 itemsStore 获取钻石商店数据
    const diamondShopData = itemsStore.diamondShopItems

    // 将数据转换为组件可用的格式（排除捡东西宠物，它们通过轮播展示）
    const items = Object.keys(diamondShopData).map(key => {
      const item = diamondShopData[key]
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantities: 1,
        icon: item.icon,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        duration: item.duration
      }
    }).filter(item => {
      // 排除捡东西宠物，它们通过轮播展示
      if (item.category === 'pickuppet') return false
      // 排除时装套装，它们通过轮播展示
      if (item.category === 'fashionset') return false
// 构建模式下隐藏测试道具（如 6908 测试用-9999倍经验加成卷轴），GM权限可见
if (!isDev && !isGM() && item.id === 6908) return false
      return true
    }).sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))

    shopItems.value = items
    selectedCategory.value = 'all'
  } catch (error) {
    console.error('加载钻石商城商品数据失败:', error)
    // 如果加载失败，使用默认数据
    shopItems.value = [
      { id: 8691, name: '力量之石', price: 50, quantities: 1, category: 'scroll' },
      { id: 7027, name: '物品增爆卷', price: 1000, quantities: 1, category: 'buff' }
    ]
    selectedCategory.value = 'all'
  }
}

// 在组件挂载时加载商品数据
onMounted(() => {
  // 使面板可拖拽 - 使用整个头部作为拖拽区域
  if (draggablePanel.value) {
    const headerElement = draggablePanel.value.querySelector('.panel-header')
    if (headerElement) {
      makeElementDraggable(draggablePanel.value, headerElement)
    }
  }

  if (rechargePanel.value) {
    const headerElement = rechargePanel.value.querySelector('.panel-title')
    if (headerElement) {
      makeElementDraggable(rechargePanel.value, headerElement)
    }
  }

  // 从存档加载钻石值以确保是最新的
  if (store.storageService) {
    try {
      const currentSaveData = store.storageService.getCurrentSaveData()
      if (currentSaveData && currentSaveData.diamonds !== undefined) {
        playerDiamonds.value = Number(currentSaveData.diamonds)
        // 同时更新store.player中的值以确保同步
        if (store.player) {
          store.player.diamonds = Number(currentSaveData.diamonds)
        }
      } else {
        // 如果存档中没有钻石值，则使用store.player中的值
        playerDiamonds.value = Number(store.player?.diamonds) || 0
      }
    } catch (error) {
      console.error('加载钻石数据失败:', error)
      playerDiamonds.value = Number(store.player?.diamonds) || 0
    }
  } else {
    playerDiamonds.value = Number(store.player?.diamonds) || 0
  }

  // 加载钻石商城商品数据
  loadShopItems()
})

// 充值选项
const rechargeOptions = ref([
  { amount: 1000, price: '￥10' },
  { amount: 2000, price: '￥20' },
  { amount: 3000, price: '￥30' }
])

// 方法
const closeModal = () => {
  // 隐藏面板前清理可能存在的tooltip
  hideItemTooltip()
  emit('update:isVisible', false)

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

const closeRechargeModal = () => {
  // 隐藏面板前清理可能存在的tooltip
  hideItemTooltip()
  showRechargeModal.value = false

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

const openRechargeModal = () => {
  showRechargeModal.value = true
}

const getItemName = item => {
  // 直接返回商品数据中的名称
  return item.name || '未知物品'
}

const setDefaultIcon = event => {
  event.target.src = '/pt/item_icon/default.png'
}

const showItemTooltip = event => {
  // 从事件中获取物品信息
  const itemElement = event.target.closest('.item-element')
  if (!itemElement) {
    return
  }

  // 获取物品ID
  const itemId = parseInt(itemElement.dataset.itemId, 10)
  if (!itemId) {
    return
  }

  // 从钻石商城商品数据中查找完整物品信息（常规商品 + 轮播捡宠）
  let shopItemData = shopItems.value.find(i => i.id === itemId)
  // 如果在常规商品中找不到，尝试从轮播捡宠中查找
  if (!shopItemData) {
    const pickuppetItem = dailyPickuppets.value.find(i => i.id === itemId)
    if (pickuppetItem) {
      shopItemData = {
        id: pickuppetItem.id,
        name: pickuppetItem.name,
        price: pickuppetItem.price,
        quantities: 1,
        icon: pickuppetItem.icon,
        description: pickuppetItem.description,
        category: pickuppetItem.category,
        subcategory: pickuppetItem.subcategory,
        rarity: pickuppetItem.rarity,
        duration: pickuppetItem.duration
      }
    }
  }
  // 如果在轮播捡宠中也找不到，尝试从轮播时装套装中查找
  if (!shopItemData) {
    const fashionSetItem = dailyFashionSets.value.find(i => i.id === itemId)
    if (fashionSetItem) {
      shopItemData = {
        id: fashionSetItem.id,
        name: fashionSetItem.name,
        price: fashionSetItem.price,
        quantities: 1,
        icon: fashionSetItem.icon,
        description: fashionSetItem.description,
        category: fashionSetItem.category,
        subcategory: fashionSetItem.subcategory,
        rarity: fashionSetItem.rarity,
        duration: fashionSetItem.duration
      }
    }
  }
  if (!shopItemData) {
    return
  }

  // 创建一个兼容ItemTooltip的物品对象
  const itemForTooltip = {
    ...shopItemData,
    name: { cns: shopItemData.name, en: shopItemData.name },
    icon: shopItemData.icon
  }

  // 发送事件到ItemTooltip组件
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

const moveItemTooltip = event => {
  // 发送事件到ItemTooltip组件
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

const hideItemTooltip = () => {
  // 发送事件到ItemTooltip组件
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

const hoverItem = () => {}

const leaveItem = () => {}

const purchaseItem = item => {
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  // 获取购买数量
  const quantity = parseInt(item.quantities, 10) || 1

  // 计算总价
  const totalPrice = item.price * quantity

  // 从钻石商城商品数据、捡东西宠物轮播数据或时装套装轮播数据中获取物品信息
  const shopItemData = shopItems.value.find(i => i.id === item.id)
    || dailyPickuppets.value.find(i => i.id === item.id)
    || dailyFashionSets.value.find(i => i.id === item.id)
  const itemName = shopItemData?.name || item.name || '未知物品'

  // 检查玩家钻石余额
  if (playerDiamonds.value < totalPrice) {
    showMessageFunc('钻石余额不足！', 'error')
    return
  }

  // 扣除钻石
  playerDiamonds.value -= totalPrice
  store.player.diamonds = Number(playerDiamonds.value) // 确保转换为数字

  // 确保钻石值是数字类型，防止后续处理出现问题
  playerDiamonds.value = Number(playerDiamonds.value)

  // 触发钻石变化事件
  emit('diamonds-changed', Number(playerDiamonds.value))

  // 重要：在添加物品前，先保存当前的钻石状态
  if (storageService) {
    // 执行添加物品操作（跳过BagService的自动保存，由我们统一保存）
    const bagService = new BagService()
    const success = bagService.addItemToBag(item.id, `/pt/item_icon/${item.id}.png`, quantity, true)

    if (!success) {
      // 如果添加失败（比如背包已满），退还钻石
      playerDiamonds.value += totalPrice
      store.player.diamonds = Number(playerDiamonds.value)

      // 保存退还后的钻石数量
      if (storageService) {
        storageService.savePlayerDiamonds(Number(playerDiamonds.value))
      }

      showMessageFunc('背包已满，无法获得物品！', 'error')
      return
    }

    // 更新 store.player 中的钻石值
    if (store.player) {
      store.player.diamonds = Number(playerDiamonds.value)
    }
  } else {
    // 如果没有storageService，仍然尝试添加物品
    const bagService = new BagService()
    const success = bagService.addItemToBag(item.id, `/pt/item_icon/${item.id}.png`, quantity)

    if (!success) {
      // 如果添加失败（比如背包已满），退还钻石
      playerDiamonds.value += totalPrice
      store.player.diamonds = Number(playerDiamonds.value)
      showMessageFunc('背包已满，无法获得物品！', 'error')
      return
    }
  }

  // 播放购买成功音效
  if (store.audioService) {
    store.audioService.playSFX('InfTrade.wav')
  }

  // 确保钻石值是数字类型
  store.player.diamonds = Number(playerDiamonds.value)

  // 同时更新store中的玩家数据引用
  if (store.player) {
    store.player.diamonds = Number(playerDiamonds.value)
  }

  // 显示购买成功消息
  showMessageFunc(
    `购买 ${itemName} x${quantity}`,
    'success'
  )

  // 显示动画消息（为每个购买的物品显示一个动画消息）
  if (props.showAnimationMessage && typeof props.showAnimationMessage === 'function') {
    const iconPath = `/pt/item_icon/${item.id}.png`

    // 根据购买数量显示多个动画消息
    const messageCount = Math.min(quantity, 10) // 最多显示10个动画消息，避免过多
    for (let i = 0; i < messageCount; i++) {
      // 使用setTimeout让动画消息错开显示，避免重叠
      setTimeout(() => {
        props.showAnimationMessage(`购买 ${itemName}`, 'buy', iconPath)
      }, i * 100) // 每个消息间隔100ms
    }
  }

  // 保存玩家钻石和背包数据
  if (storageService) {
    // 确保要保存的钻石数量是正确的数字类型
    const diamondsToSave = Number(playerDiamonds.value)

    // 更新 store.player 中的钻石值和背包数据
    if (store.player) {
      store.player.diamonds = diamondsToSave
      store.player.bag = JSON.parse(JSON.stringify(itemsStore.playerBag))
    }

    // 使用 savePlayerPatch 保存背包和钻石数据，避免覆盖其他字段
    // 从 itemsStore 获取最新的背包数据，并深拷贝确保正确序列化
    const bagData = JSON.parse(JSON.stringify(itemsStore.playerBag))
    storageService.savePlayerPatch({
      bag: bagData,
      diamonds: diamondsToSave
    })
  } else {
    console.error('[DiamondShopModal] 购买物品 - storageService不存在，无法保存钻石')
  }

  // 触发购买成功事件
  emit('purchase-success', { item, quantity, totalPrice })

  // 触发背包UI更新事件（刷新背包显示）
  const updateBagEvent = new CustomEvent('update-bag-ui')
  window.dispatchEvent(updateBagEvent)
}

const rechargeDiamonds = amount => {
  // 计算需要的金币数量（1000000金币 = 1钻石）
  const requiredGold = amount * 1000000

  // 检查玩家金币是否足够
  if (store.player.gold < requiredGold) {
    showMessageFunc(`金币不足！需要 ${requiredGold} 金币才能兑换 ${amount} 钻石`, 'error')
    return
  }

  // 扣除金币
  store.player.gold -= requiredGold
  itemsStore.playerGold = store.player.gold
  const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: store.player.gold } })
  window.dispatchEvent(goldUpdateEvent)

  // 增加玩家钻石数量
  playerDiamonds.value += amount
  store.player.diamonds = Number(playerDiamonds.value) // 确保转换为数字

  // 触发钻石变化事件
  emit('diamonds-changed', Number(playerDiamonds.value))

  // 确保钻石值是数字类型
  store.player.diamonds = Number(playerDiamonds.value)

  // 同时更新store中的玩家数据引用
  if (store.player) {
    store.player.diamonds = Number(playerDiamonds.value)
  }

  // 保存玩家钻石
 
  if (storageService) {
    // 确保要保存的钻石数量是正确的数字类型
    const diamondsToSave = Number(playerDiamonds.value)
    storageService.savePlayerDiamonds(diamondsToSave)

    // 同时保存完整的玩家数据，确保背包数据也被保存
    // 确保store.player中的diamonds是正确的数字类型
    if (store.player) {
      store.player.diamonds = diamondsToSave
    }

    // 再次确保diamonds字段是数字类型以避免字符串拼接问题
    const finalDiamondsValue = Number(playerDiamonds.value)
    if (store.player) {
      store.player.diamonds = finalDiamondsValue
    }

    // 在保存前进行最后一次检查，确保diamonds字段没有被污染
    if (
      store.player &&
      typeof store.player.diamonds === 'string' &&
      store.player.diamonds.includes('[object Object]')
    ) {
      store.player.diamonds = finalDiamondsValue
    }

    // 确保在保存完整玩家数据前，diamonds字段是纯数字
    if (store.player) {
      store.player.diamonds = Number(finalDiamondsValue)
    }

    storageService.savePlayerData(store.player)
  } else {
    console.error('[DiamondShopModal] 充值 - storageService不存在，无法保存钻石')
  }

  // 显示充值成功消息
  showMessageFunc(`充值成功！花费 ${requiredGold} 金币获得 ${amount} 钻石`, 'success')

  // 关闭充值面板
  showRechargeModal.value = false
}

const rechargeCustom = () => {
  const amount = parseInt(customAmount.value, 10)
  if (amount && amount > 0) {
    rechargeDiamonds(amount)
    customAmount.value = ''
  } else {
    showMessageFunc('请输入有效的充值数量', 'error')
  }
}

const addTestDiamonds = () => {
  // 每次点击增加99999钻石
  playerDiamonds.value += 99999
  store.player.diamonds = Number(playerDiamonds.value) // 确保转换为数字

  // 触发钻石变化事件
  emit('diamonds-changed', Number(playerDiamonds.value))

  // 同时更新store中的玩家数据引用
  if (store.player) {
    store.player.diamonds = Number(playerDiamonds.value)
  }

  // 显示成功消息
  showMessageFunc('测试钻石已添加！当前钻石: ' + Number(playerDiamonds.value), 'success')

  // 保存玩家钻石
  console.log(
    '[DiamondShopModal] 准备保存钻石，storageService存在:',
    Boolean(storageService),
    '钻石数量:',
    store.player.diamonds
  )
  if (storageService) {
    // 确保要保存的钻石数量是正确的数字类型
      const diamondsToSave = Number(playerDiamonds.value)
  storageService.savePlayerDiamonds(diamondsToSave)

  // 同时保存完整的玩家数据，确保背包数据也被保存
  // 确保store.player中的diamonds是正确的数字类型
    if (store.player) {
      store.player.diamonds = diamondsToSave
    }

    // 再次确保diamonds字段是数字类型以避免字符串拼接问题
    const finalDiamondsValue = Number(playerDiamonds.value)
    if (store.player) {
      store.player.diamonds = finalDiamondsValue
    }

    // 在保存前进行最后一次检查，确保diamonds字段没有被污染
    if (
      store.player &&
      typeof store.player.diamonds === 'string' &&
      store.player.diamonds.includes('[object Object]')
    ) {
      store.player.diamonds = finalDiamondsValue
    }

    // 确保在保存完整玩家数据前，diamonds字段是纯数字
    if (store.player) {
      store.player.diamonds = Number(finalDiamondsValue)
    }

    storageService.savePlayerData(store.player)
  } else {
    console.error('[DiamondShopModal] storageService不存在，无法保存钻石')
  }
}


/**
 * 格式化持续时间用于商店物品角标显示
 * @param {number} duration - 持续时间（秒），-1表示永久，正数表示具体秒数
 * @returns {string} 格式化后的短文本
 */
const formatShopDuration = duration => {
  const seconds = Number(duration)
  if (!Number.isFinite(seconds)) {
    return ''
  }
  if (seconds < 0) {
    return '永久'
  }
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  const parts = []
  if (days > 0) {
    parts.push(`${days}天`)
  }
  if (hours > 0) {
    parts.push(`${hours}小时`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}分钟`)
  }
  return parts.length > 0 ? parts.join(',') : '0分钟'
}

const showMessageFunc = (message, type = 'info') => {
  messageContent.value = message
  messageType.value = type
  showMessage.value = true

  // 3秒后移除消息
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

  if (rechargePanel.value) {
    const headerElement = rechargePanel.value.querySelector('.panel-title')
    if (headerElement) {
      makeElementDraggable(rechargePanel.value, headerElement)
    }
  }

  // 从存档加载钻石值以确保是最新的
  if (store.storageService) {
    try {
      const currentSaveData = store.storageService.getCurrentSaveData()
      if (currentSaveData && currentSaveData.diamonds !== undefined) {
        playerDiamonds.value = Number(currentSaveData.diamonds)
        // 同时更新store.player中的值以确保同步
        if (store.player) {
          store.player.diamonds = Number(currentSaveData.diamonds)
        }
      } else {
        // 如果存档中没有钻石值，则使用store.player中的值
        playerDiamonds.value = Number(store.player?.diamonds) || 0
      }
    } catch (error) {
      console.error('加载钻石数据失败:', error)
      playerDiamonds.value = Number(store.player?.diamonds) || 0
    }
  } else {
    playerDiamonds.value = Number(store.player?.diamonds) || 0
  }
})

onUnmounted(() => {
  // 清理工作
})
</script>

<style scoped>
.diamond-shop-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 715px;
  height: 550px;
  background: rgba(0, 0, 0, 0.8);
  box-shadow: rgb(0 0 0) 0px 0px 40px;
  z-index: 1000;
  border-radius: 10px;
  padding: 25px;
  color: #fff;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  overflow: hidden;
}

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
  /* 扩大点击区域 */
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

.panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-bottom: 15px;
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
  width: 200px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  border-radius: 50%;
}

.panel-logo {
  width: 130px;
  height: 90px;
  object-fit: contain;
  display: block;
}

.panel-title {
  text-align: center;
  margin: 0;
  color: rgb(255, 255, 255);
  font-size: 28px;
  letter-spacing: 2px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 10px;
  margin-bottom: 10px;
}

.rotation-info-bar {
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.12);
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 8px;
  margin-bottom: 8px;
  color: rgba(255, 215, 0, 0.9);
  font-size: 13px;
  text-align: center;
  font-weight: 600;
}

.filter-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 700;
}

.filter-select {
  flex: 1;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.35);
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  padding: 0 10px;
  outline: none;
}

.item-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap:10px;
  overflow-y: auto;
  max-height: 300px;
  padding: 10px;
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.item-list::-webkit-scrollbar {
  width: 12px;
}

.item-list::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 6px;
}

.item-list::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 6px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.item-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.85);
}

.item-element {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s ease;
}

.item-element:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.item-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  transition: all 0.3s ease;
  cursor: pointer;
  display: block;
}

.item-icon-outer {
  position: relative;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}

.item-icon-wrapper {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
}

.duration-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: rgba(0, 180, 255, 0.9);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.duration-badge.duration-permanent {
  background: rgba(255, 140, 0, 0.92);
}

.item-icon-wrapper::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -120%;
  width: 220%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transform: rotate(35deg);
  will-change: transform, top, left;
  pointer-events: none;
  animation: diamond-icon-shine 3s linear infinite;
}

@keyframes diamond-icon-shine {
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

.item-info {
  flex: 1;
  text-align: center;
}

.item-name {
  margin: 0 0 5px 0;
  color: #fff;
  font-size: 14px;
}

.item-id {
  margin: 0 0 5px 0;
  color: #ccc;
  font-size: 14px;
}

.item-price {
  margin: 0;
  color: #ffd700;
  font-weight: bold;
  font-size: 15px;
}

.quantity-input {
  width: 50px;
  height: 25px;
  padding: 5px;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid #ffd700;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  text-align: center;
}

.buy-button {
  background: linear-gradient(to bottom, #ffd700, #ffa500);
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.buy-button:hover {
  background: linear-gradient(to bottom, #ffdf40, #ffb733);
}

.bottom-bar {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgb(255 255 255 / 30%);
  border-radius: 10px;
}

.diamond-display {
  font-size: 18px;
  font-weight: bold;
  color: rgb(255, 255, 255);
}

.recharge-button {
  background: linear-gradient(to bottom, #ffd700, #ffa500);
  color: #000;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.test-button {
  background: linear-gradient(to bottom, #4caf50, #45a049);
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.test-button:hover {
  background: linear-gradient(to bottom, #5cb860, #449d44);
}

.recharge-button:hover {
  background: linear-gradient(to bottom, #ffdf40, #ffb733);
}

/* 充值面板样式 */
.recharge-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 1px solid rgb(255 222 0);
  border-radius: 20px;
  box-shadow:
    rgb(21 36 68) 0px 0px 40px,
    rgba(255, 215, 0, 0.3) 0px 0px 20px inset;
  z-index: 1001;
  padding: 25px;
  color: #fff;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  overflow: hidden;
}

.recharge-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.recharge-option-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 15px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.recharge-option-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.02);
}

.custom-recharge {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.custom-label {
  font-size: 16px;
}

.custom-input {
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ffd700;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
}

.custom-button {
  background: linear-gradient(to bottom, #ffd700, #ffa500);
  color: #000;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.custom-button:hover {
  background: linear-gradient(to bottom, #ffdf40, #ffb733);
}

.exchange-info {
  text-align: center;
  color: #ffd700;
  font-weight: bold;
  margin-top: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

/* 消息提示样式 */
.message-element {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px 30px;
  border-radius: 10px;
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
}

.message-element.error {
  color: #f44336;
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
