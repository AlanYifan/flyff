<template>
  <div v-if="isVisible">
    <div
      class="purchase-panel"
      :style="{ top: anchor.y + 'px', left: anchor.x + 'px' }"
    >
      <div class="panel-header">
        <h3>购买物品</h3>
        <button class="close-button" @click="close">×</button>
      </div>
      <div class="panel-content">
        <div class="item-info">
          <img :src="getItemIcon(selectedItem)" :alt="selectedItem.name" class="item-icon" />
          <div class="item-details">
            <div class="item-name" :style="{ color: getRarityColor(selectedItem.rarity) }">
              {{ selectedItem.name }}
            </div>
            <div class="item-price">单价: {{ getItemPrice(selectedItem) }} Penya</div>
          </div>
        </div>
        <div class="quantity-control">
          <label>数量:</label>
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            :max="maxStack"
            @input="validateQuantity"
          />
          <button @click="increaseQuantity">+</button>
          <button @click="decreaseQuantity">-</button>
        </div>
        <div class="total-price">总价: {{ totalPrice }} Penya</div>
        <div class="action-buttons">
          <button class="buy-button" @click="confirmPurchase">购买</button>
          <button class="cancel-button" @click="close">取消</button>
        </div>
      </div>
    </div>

    <div
      v-if="showConfirmDialog"
      class="confirm-dialog"
      :style="{ top: anchor.y + 'px', left: anchor.x + 'px' }"
    >
      <div class="confirm-content">
        <p>确定要购买 {{ quantity }} 个 {{ selectedItem.name }} 吗？</p>
        <p>总价: {{ totalPrice }} Penya</p>
        <div class="confirm-buttons">
          <button @click="performPurchase">确认</button>
          <button @click="cancelPurchase">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useItemsStore } from '@/store/items'

export default {
  name: 'PurchasePanel',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    selectedItem: {
      type: Object,
      default: null
    },
    anchor: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    rarityColors: {
      type: Object,
      default: () => ({
        common: '#C0C0C0',
        uncommon: '#0070DD',
        rare: '#FFD700',
        veryrare: 'rgb(255, 0, 13)',
        unique: 'rgb(255, 0, 13)',
        ultimate: '#A335EE'
      })
    },
    priceCalculator: {
      type: Function,
      default: item => item.price || (item.sellPrice ? item.sellPrice : 0) || 0
    }
  },
  emits: ['close', 'purchase'],
  setup (props, { emit }) {
    const itemsStore = useItemsStore()
    const quantity = ref(1)
    const showConfirmDialog = ref(false)

    // Computed
    const maxStack = computed(() => {
      return props.selectedItem ? props.selectedItem.stack || 1 : 1
    })

    const totalPrice = computed(() => {
      if (!props.selectedItem) {
        return 0
      }
      const basePrice = props.priceCalculator(props.selectedItem)
      return Math.round(basePrice * quantity.value)
    })

    // Methods
    const close = () => {
      emit('close')

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    // 获取物品图标
    const getItemIcon = item => {
      // 物品图片使用物品 ID: /pt/item_icon/物品ID.png
      return `/pt/item_icon/${item.id}.png`
    }

    // 获取物品价格
    const getItemPrice = item => {
      return props.priceCalculator(item)
    }

    // 获取稀有度颜色
    const getRarityColor = rarity => {
      return itemsStore.getRarityTextColor(rarity)
    }

    const increaseQuantity = () => {
      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }

      if (quantity.value < maxStack.value) {
        quantity.value++
      }
    }

    const decreaseQuantity = () => {
      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }

      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const validateQuantity = () => {
      if (quantity.value < 1) {
        quantity.value = 1
      } else if (quantity.value > maxStack.value) {
        quantity.value = maxStack.value
      }
    }

    const confirmPurchase = () => {
      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }

      showConfirmDialog.value = true
    }

    const cancelPurchase = () => {
      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }

      showConfirmDialog.value = false
    }

    const performPurchase = () => {
      // 检查背包空间是否足够
const item = props.selectedItem
const quantityToBuy = quantity.value

// 计算需要的背包格子数
const maxStack = item.stack || 1
const requiredSlots = Math.ceil(quantityToBuy / maxStack)

      // 发送购买请求到父组件
      emit('purchase', {
        item: props.selectedItem,
        quantity: quantity.value,
        totalPrice: totalPrice.value,
        requiredSlots
      })

      // 重置状态
      showConfirmDialog.value = false
      quantity.value = 1
      close()
    }

    return {
      quantity,
      showConfirmDialog,
      maxStack,
      totalPrice,
      close,
      getItemIcon,
      getItemPrice,
      getRarityColor,
      increaseQuantity,
      decreaseQuantity,
      validateQuantity,
      confirmPurchase,
      cancelPurchase,
      performPurchase
    }
  }
}
</script>

<style scoped>
  .purchase-panel {
    position: fixed;
    background-color: var(--theme-modal-bg);
    border: 2px solid var(--theme-border-strong);
    border-radius: 10px;
    padding: 15px;
    width: 300px;
    z-index: 1001;
    color: var(--theme-text);
    transform: translate(-50%, -100%);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--theme-border);
  }

  .close-button {
    background: none;
    border: none;
    color: var(--theme-text);
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background-color: var(--theme-surface-muted);
    border-radius: 50%;
  }

  .item-info {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: var(--theme-surface-muted);
    border: 1px solid var(--theme-border);
    border-radius: 5px;
  }

  .item-icon {
    width: 60px;
    height: 60px;
    object-fit: contain;
  }

  .item-details {
    flex: 1;
  }

  .item-name {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .item-price {
    color: var(--theme-accent);
    font-size: 16px;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
  }

  .quantity-control label {
    font-weight: bold;
  }

  .quantity-control input {
    width: 60px;
    padding: 5px;
    background-color: var(--theme-content-bg);
    border: 1px solid var(--theme-border);
    color: var(--theme-text);
    text-align: center;
  }

  .quantity-control button {
    background-color: var(--theme-button-bg);
    color: var(--theme-button-text);
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 3px;
  }

  .quantity-control button:hover {
    background-color: var(--theme-button-hover);
  }

  .total-price {
    font-size: 18px;
    font-weight: bold;
    color: var(--theme-accent);
    margin-bottom: 15px;
    text-align: center;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }

  .buy-button,
  .cancel-button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
  }

  .buy-button {
    background-color: #006400;
    color: white;
  }

  .cancel-button {
    background-color: #8b0000;
    color: white;
  }

  .confirm-dialog {
    position: fixed;
    z-index: 1002;
    transform: translate(-50%, -100%);
  }

  .confirm-content {
    background-color: var(--theme-modal-bg);
    border: 2px solid var(--theme-border-strong);
    border-radius: 10px;
    padding: 30px;
    text-align: center;
    max-width: 400px;
    width: 90%;
    color: var(--theme-text);
  }

  .confirm-content p {
    margin-bottom: 20px;
    font-size: 18px;
  }

  .confirm-buttons {
    display: flex;
    gap: 20px;
    justify-content: center;
  }

  .confirm-buttons button {
    padding: 10px 25px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
  }

  .confirm-buttons button:first-child {
    background-color: #006400;
    color: white;
  }

  .confirm-buttons button:last-child {
    background-color: #8b0000;
    color: white;
  }
</style>
