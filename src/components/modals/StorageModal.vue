<template>
  <div v-if="show">
    <div id="pangpangBankPanel" v-drag="{ handle: '.bank-panel-header' }" class="pangpang-bank-panel">
      <!-- 面板头部 -->
      <div class="bank-panel-header">
        <div class="npc-info">
          <img :src="npcAvatar" alt="胖胖头像" class="npc-avatar" draggable="false" />
          <div class="npc-name">胖胖-仓库管理员</div>
        </div>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <!-- 对话区域 -->
      <div class="dialog-area">
        {{ randomDialog }}
      </div>

      <!-- 仓库物品网格 -->
      <div id="gridContainer" class="grid-container">
        <div
          v-for="index in 100"
          :key="index"
          class="item-slot"
          :class="getItemSlotClass(bankItems[index - 1])"
          :style="getItemSlotStyle(bankItems[index - 1])"
          :data-slot-index="index - 1"
          @click="handleItemClick(index - 1)"
          @mouseenter="showItemTooltip($event, index - 1)"
          @mouseleave="hideItemTooltip"
          @mousemove="moveTooltip($event)"
        >
          <template v-if="bankItems[index - 1]">
            <!-- 强化等级特效 -->
            <EnhanceTierEffect
              v-if="shouldShowEnhanceEffect(bankItems[index - 1])"
              :enhance-level="getEnhanceLevel(bankItems[index - 1])"
              :rarity="bankItems[index - 1].rarity"
            />
            <img
              :src="getItemIcon(bankItems[index - 1])"
              :alt="getItemName(bankItems[index - 1])"
              class="item-icon"
              @error="handleImageError"
            />
            <!-- 强化等级徽章（右上角） -->
            <div v-if="shouldShowEnhanceBadge(bankItems[index - 1])" class="enhance-badge">
              +{{ getEnhanceLevel(bankItems[index - 1]) }}
            </div>
            <!-- 堆叠数量（左下角） -->
            <div v-if="(bankItems[index - 1].currentStack || bankItems[index - 1].stack) > 1" class="stack-count">
              {{ bankItems[index - 1].currentStack || bankItems[index - 1].stack }}
            </div>
          </template>
          <div v-else class="empty-slot">空</div>
        </div>
      </div>

      <!-- 金币管理区域 -->
      <div class="gold-manage-area">
        <div class="gold-info">
          <span>仓库金币: <GoldValue :value="bankGold" /></span>
          <span>背包金币: <GoldValue :value="playerGold" /></span>
        </div>
        <div class="gold-input-area">
          <input
            v-model="goldAmount"
            type="number"
            min="1"
            class="gold-input"
            placeholder="输入金币数量"
          />
          <button class="btn-deposit-gold" @click="depositGold">存入金币</button>
          <button class="btn-withdraw-gold" @click="withdrawGold">取出金币</button>
        </div>
      </div>

      <!-- 物品管理区域 -->
      <div class="item-manage-area">
        <button class="btn-deposit-item" @click="openDepositDialog">存入物品</button>
        <button class="btn-withdraw-item" @click="openWithdrawDialog">取出物品</button>
        <button class="btn-sort" @click="sortBankItems">整理仓库</button>
      </div>
    </div>

    <!-- 存入物品模态框 -->
    <DepositItemModal
      :show="showDepositModal"
      @close="showDepositModal = false"
      @deposit-success="handleDepositSuccess"
    />

    <!-- 取出物品模态框 -->
    <WithdrawItemModal
      :show="showWithdrawModal"
      @close="showWithdrawModal = false"
      @withdraw-success="handleWithdrawSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storageService } from '@/services/StorageService'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import DepositItemModal from '@/components/modals/DepositItemModal.vue'
import WithdrawItemModal from '@/components/modals/WithdrawItemModal.vue'
import GoldValue from '@/components/GoldValue.vue'
import EnhanceTierEffect from '@/components/EnhanceTierEffect.vue'

defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// 响应式数据
const itemsStore = useItemsStore()
const gameStore = useGameStore()
const bankItems = ref([])
const playerGold = ref(0)
const bankGold = ref(0)
const goldAmount = ref(1000)
const selectedBankItem = ref(null)
const npcAvatar = ref('/pt/npc_icon/infopeng.png')
const randomDialog = ref('你好,我是胖胖,有什么需要帮助吗?')
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)

// 获取物品的强化等级
function getEnhanceLevel (item) {
  if (!item) return 0
  const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
  return Number.isFinite(level) ? level : 0
}

// 判断是否应该显示强化等级徽章
function shouldShowEnhanceBadge (item) {
  if (!item) return false
  const enhanceLevel = getEnhanceLevel(item)
  // 只有强化等级 > 0 才显示徽章
  return enhanceLevel > 0
}

// 判断是否应该显示强化特效
function shouldShowEnhanceEffect (item) {
  if (!item) return false
  const enhanceLevel = getEnhanceLevel(item)
  // 只有强化等级 >= 5 才显示特效
  return enhanceLevel >= 5
}

// 获取物品槽的样式类
function getItemSlotClass (item) {
  if (!item) return {}
  const borderClass = itemsStore.getRarityBorderClass(item.rarity)
  return {
    'has-item': true,
    'has-enhance-effect': shouldShowEnhanceEffect(item),
    [borderClass]: !!borderClass
  }
}

// 获取物品槽的内联样式（品级边框颜色）
function getItemSlotStyle (item) {
  if (!item) return {}
  const borderClass = itemsStore.getRarityBorderClass(item.rarity)
  // 如果有边框类（如神话级），则不使用内联样式，让CSS类控制边框
  if (borderClass) {
    return {}
  }
  const borderCss = itemsStore.getRarityBorderCss(item.rarity)
  return {
    border: borderCss
  }
}

// 方法
function closeModal () {
  emit('close')

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

function handleImageError (event) {
  event.target.src = '/pt/item_icon/default_item.png'
}

// 显示物品提示
function showItemTooltip (event, index) {
  const item = bankItems.value[index]
  if (!item) return

  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item,
      position: { x: event.clientX, y: event.clientY },
      source: 'storage-modal'
    }
  })
  window.dispatchEvent(tooltipEvent)
}

// 隐藏物品提示
function hideItemTooltip () {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

// 移动提示
function moveTooltip (event) {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

/**
 * 加载仓库数据
 * 优先从 gameStore.player 缓存读取，避免每次打开仓库都调用 API 导致超时
 * gameStore.player 在 initGame 时已从后端加载并缓存
 */
function loadBankData () {
  const player = gameStore.player
  if (player) {
    bankItems.value = [...(player.bankBag || [])]
    bankGold.value = player.bankGold || 0
    // 优先从 itemsStore 获取玩家金币，确保实时性
    playerGold.value = itemsStore.playerGold || player.gold || 0
  }
}

function depositGold () {
  const amount = parseInt(goldAmount.value, 10) || 0
  if (amount <= 0) {
    addBattleLog('请输入有效的金币数量')
    return
  }

  // 从 itemsStore 获取最新的玩家金币
  const currentGold = itemsStore.playerGold || playerGold.value
  if (amount > currentGold) {
    addBattleLog('金币不足，无法存入')
    return
  }

  // 更新玩家金币和仓库金币
  const newPlayerGold = currentGold - amount
  const newBankGold = bankGold.value + amount

  // 同步更新 itemsStore 中的金币
  itemsStore.playerGold = newPlayerGold

  // 同步更新 gameStore.player 中的金币和仓库金币，防止其他保存操作覆盖
  if (gameStore.player) {
    gameStore.player.gold = newPlayerGold
    gameStore.player.bankGold = newBankGold
  }

  // 触发金币更新事件
  const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: newPlayerGold } })
  window.dispatchEvent(goldUpdateEvent)

  // 更新本地显示
  playerGold.value = newPlayerGold
  bankGold.value = newBankGold

  // 保存数据
  // storageService 已通过 import 导入全局单例
  storageService.savePlayerPatch({
    gold: newPlayerGold,
    bankGold: newBankGold
  })

  addBattleLog(`成功存入 ${amount} 金币`)
}

function withdrawGold () {
  const amount = parseInt(goldAmount.value, 10) || 0
  if (amount <= 0) {
    addBattleLog('请输入有效的金币数量')
    return
  }

  if (amount > bankGold.value) {
    addBattleLog('仓库金币不足，无法取出')
    return
  }

  // 从 itemsStore 获取最新的玩家金币
  const currentGold = itemsStore.playerGold || playerGold.value

  // 更新玩家金币和仓库金币
  const newPlayerGold = currentGold + amount
  const newBankGold = bankGold.value - amount

  // 同步更新 itemsStore 中的金币
  itemsStore.playerGold = newPlayerGold

  // 同步更新 gameStore.player 中的金币和仓库金币，防止其他保存操作覆盖
  if (gameStore.player) {
    gameStore.player.gold = newPlayerGold
    gameStore.player.bankGold = newBankGold
  }

  // 触发金币更新事件
  const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: newPlayerGold } })
  window.dispatchEvent(goldUpdateEvent)

  // 更新本地显示
  playerGold.value = newPlayerGold
  bankGold.value = newBankGold

  // 保存数据
  // storageService 已通过 import 导入全局单例
  storageService.savePlayerPatch({
    gold: newPlayerGold,
    bankGold: newBankGold
  })

  addBattleLog(`成功取出 ${amount} 金币`)
}

function openDepositDialog () {
  // 显示存入物品模态框
  showDepositModal.value = true
}

function openWithdrawDialog () {
  // 显示取出物品模态框
  showWithdrawModal.value = true
}

function handleDepositSuccess (depositData) {
  console.log('存入物品成功:', depositData)

  // 同步更新 gameStore.player 中的仓库物品，防止其他保存操作覆盖
  // 直接从 gameStore.player 缓存读取，避免不必要的 API 调用
  if (gameStore.player) {
    gameStore.player.bankBag = gameStore.player.bankBag || []
    gameStore.player.bag = gameStore.player.bag || []
  }

  // 重新加载仓库数据以反映变化
  loadBankData()

  // 提示信息
  addBattleLog(`成功存入 ${depositData.quantity} 个 ${getItemName(depositData.item)}`)
}

/**
 * 处理取出物品成功回调
 * @param {Object} withdrawData - 取出数据
 */
function handleWithdrawSuccess (withdrawData) {
  console.log('取出物品成功:', withdrawData)

  // 同步更新 gameStore.player 中的仓库物品，防止其他保存操作覆盖
  // 直接从 gameStore.player 缓存读取，避免不必要的 API 调用
  if (gameStore.player) {
    gameStore.player.bankBag = gameStore.player.bankBag || []
    gameStore.player.bag = gameStore.player.bag || []
  }

  // 重新加载仓库数据以反映变化
  loadBankData()

  // 提示信息
  if (withdrawData.success) {
    addBattleLog(`成功取出 ${withdrawData.quantity} 个 ${getItemName(withdrawData.item)}`)
  } else {
    addBattleLog(withdrawData.message || '取出物品失败')
  }
}

function addBattleLog (message) {
  // 如果有battleLog组件或全局方法，可以在这里调用
  // 暂时使用console.log作为替代
  console.log('[Battle Log]:', message)

  // 如果有全局事件总线或状态管理，可以在这里触发
  // 例如: $bus.emit('battleLog', message) 或 store.commit('addBattleLog', message)
}

function handleItemClick (index) {
  // 处理物品点击事件
  console.log(`点击了物品槽位 ${index}`)
  if (bankItems.value[index]) {
    // 选中物品逻辑
    selectedBankItem.value = bankItems.value[index]
    // 这里可以添加选中状态的样式变化
  }
}

function sortBankItems () {
  if (!bankItems.value || bankItems.value.length === 0) {
    addBattleLog('仓库是空的，无需整理')
    return
  }

  // 实现仓库整理逻辑
  // 创建一个新数组来存储整理后的物品
  const sortedItems = []
  // 创建一个Map来存储相同ID物品的堆叠信息
  const stackMap = new Map()

  // 第一次遍历：统计可堆叠物品的总数
  bankItems.value.forEach(item => {
    // 获取物品当前实际数量
    const itemCurrentStack = item.currentStack || item.stack || 1
    // 判断物品是否可堆叠：
    // 1. 有 stack 属性（可堆叠）
    // 2. 不是装备类物品
    // 3. 没有唯一ID（有uniqueId的物品不能合并）
    // 4. 没有强化属性（有强化等级的物品不能合并）
    // 5. 没有打孔属性（有打孔的物品不能合并）
    // 6. 没有宠物数据（有宠物的物品不能合并）
    const isStackable =
        item.stack &&
        !['weapon', 'armor', 'accessory', 'fashion'].includes(item.category) &&
        !item.uniqueId &&
        !item.enhanceLevel &&
        !item.StrengthenedAttributes &&
        !item.PerforationAttributes &&
        !item.pet_data

    if (isStackable) {
      const key = item.id
      if (stackMap.has(key)) {
        stackMap.set(key, {
          item,
          totalStack: stackMap.get(key).totalStack + itemCurrentStack
        })
      } else {
        stackMap.set(key, {
          item,
          totalStack: itemCurrentStack
        })
      }
    } else {
      // 不可堆叠的物品直接添加到结果数组
      sortedItems.push({ ...item })
    }
  })

  // 处理可堆叠物品
  for (const [, value] of stackMap) {
    const { item, totalStack } = value
    const maxStack = item.maxStack || 9999

    // 计算需要多少个堆叠位
    const stackCount = Math.ceil(totalStack / maxStack)

    for (let i = 0; i < stackCount; i++) {
      const newItem = { ...item }
      if (i === stackCount - 1) {
        // 最后一个堆叠可能不是满的
        newItem.currentStack = totalStack - maxStack * (stackCount - 1)
      } else {
        // 其他堆叠都是满的
        newItem.currentStack = maxStack
      }
      sortedItems.push(newItem)
    }
  }

  // 按照类型和ID排序
  sortedItems.sort((a, b) => {
    // 首先按物品类型排序
    const categoryOrder = {
      weapon: 1,
      armor: 2,
      accessory: 3,
      fashion: 4,
      consume: 5,
      material: 6,
      other: 7
    }

    const categoryA = categoryOrder[a.category] || 999
    const categoryB = categoryOrder[b.category] || 999

    if (categoryA !== categoryB) {
      return categoryA - categoryB
    }

    // 类型相同时按ID排序
    if (a.id !== b.id) {
      return a.id - b.id
    }

    // ID相同时堆叠数量大的排在前面
    return (b.stack || 1) - (a.stack || 1)
  })

  // 更新仓库内容
  bankItems.value = sortedItems

  // 同步更新 gameStore.player 中的仓库物品
  if (gameStore.player) {
    gameStore.player.bankBag = sortedItems
  }

  // 保存数据：直接使用 gameStore.player 缓存，避免不必要的 API 调用
  const player = gameStore.player
  if (player) {
    player.bankBag = sortedItems
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerData(player)
  }

  addBattleLog('仓库整理完成')
}

// 生命周期钩子
onMounted(() => {
  loadBankData()
})

// 暴露方法供父组件调用
defineExpose({
  refresh: () => {
    loadBankData()
  }
})
</script>

<style scoped>
.pangpang-bank-panel {
  width: 466px;
  height: 740px;
  position: fixed;
  top: 14%;
  left: 40%;
  background-color: rgba(0, 0, 0, 0.85);
  border: 1px solid #ffd700;
  border-radius: 10px;
  padding: 5px;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
}

.bank-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
  border-bottom: 1px solid #ffd700;
  padding-bottom: 10px;
  cursor: move;
}

.npc-info {
  display: flex;
  align-items: center;
}

.npc-avatar {
  width: 100px;
  height: 100px;
  border-radius: 10%;
  margin-right: 15px;
  border: 1px solid #ffd700;
}

.npc-name {
  font-size: 22px;
  font-weight: bold;
  color: #ffd700;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.btn-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dialog-area {
  width: 100%;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  margin-bottom: 15px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.5;
}

.grid-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 2px;
  padding: 2px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  border: 1px solid #ffd700;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: none;
  flex: 1;
  scrollbar-color: #ffd700 #000000;
  scrollbar-width: thin;
}

.grid-container::-webkit-scrollbar {
  width: 8px;
}

.grid-container::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 4px;
}

.grid-container::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 4px;
}

.grid-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.85);
}

.item-slot {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  overflow: hidden;
}

.item-slot:hover {
  filter: brightness(1.2);
}

.item-slot.has-enhance-effect {
  z-index: 1;
}

.item-icon {
  width: 40px;
  height: 40px;
  position: relative;
  z-index: 2;
  pointer-events: none;
}

/* 强化等级徽章 - 右上角 */
.enhance-badge {
  position: absolute;
  top: -4px;
  right: -1px;
  background: #000000;
  color: #f5cf00;
  font-size: 9px;
  font-weight: bold;
  padding: 1px 3px;
  border-radius: 0 4px 0 4px;
  z-index: 10;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 堆叠数量 - 左下角 */
.stack-count {
  position: absolute;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1px 3px;
  border-radius: 0 4px 0 4px;
  font-size: 10px;
  z-index: 10;
  font-weight: bold;
}

.empty-slot {
  color: #666;
  font-size: 12px;
}

.gold-manage-area {
  width: 100%;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  margin-top: 15px;
}

.gold-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.gold-input-area {
  display: flex;
  gap: 10px;
  align-items: center;
}

.gold-input {
  padding: 5px 10px;
  border: 1px solid #444;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 120px;
}

.btn-deposit-gold,
.btn-withdraw-gold {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  margin-right: 5px;
}

.btn-deposit-gold {
  background-color: #006400;
  border-radius: 3px;
}

.btn-withdraw-gold {
  background-color: #8b0000;
  border-radius: 5px;
}

.btn-deposit-gold:hover,
.btn-withdraw-gold:hover {
  /* 与old版本保持一致，不使用opacity变化 */
}

.item-manage-area {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 5px;
  margin-bottom: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  border: 1px solid #ffd700;
}

.btn-deposit-item,
.btn-withdraw-item,
.btn-sort {
  padding: 8px 15px;
  border: none;
  border-radius: 3px;
  color: white;
  cursor: pointer;
}

.btn-deposit-item {
  background-color: #006400;
}

.btn-withdraw-item {
  background-color: #8b0000;
}

.btn-sort {
  background-color: #4169e1;
}

.btn-deposit-item:hover,
.btn-withdraw-item:hover,
.btn-sort:hover {
  /* 与old版本保持一致，不使用opacity变化 */
}
</style>
