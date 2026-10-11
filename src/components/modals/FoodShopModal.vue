<template>
  <BaseNPCShopModal
    :npc-name="npcName"
    :npc-avatar="npcAvatar"
    :npc-dialog="npcDialog"
    :shop-items="shopItems"
    :rarity-colors="rarityColors"
    :rarity-names="rarityNames"
    :price-calculator="priceCalculator"
    :name-formatter="nameFormatter"
    :description-formatter="descriptionFormatter"
    @close="closeModal"
    @purchase="handlePurchase"
    @item-selected="handleItemSelected"
  />
</template>

<script setup>
import BaseNPCShopModal from './BaseNPCShopModal.vue'
import { RARITY_NAMES } from '@/store/descriptions'

// Props
defineProps({
  npcName: {
    type: String,
    default: '食品店-米里恩'
  },
  npcAvatar: {
    type: String,
    default: '/pt/npc_icon/miriun.png'
  },
  npcDialog: {
    type: String,
    default: ''
  },
  shopItems: {
    type: Array,
    default: () => []
  },
  // 稀有度颜色映射
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
  // 稀有度名称映射
  rarityNames: {
    type: Object,
    default: () => RARITY_NAMES
  },
  // 价格计算函数
  priceCalculator: {
    type: Function,
    default: item => item.price || item.sellPrice || 0
  },
  // 名称显示函数
  nameFormatter: {
    type: Function,
    default: item => item.name?.cns || item.name?.en || item.name || '未知物品'
  },
  // 描述显示函数
  descriptionFormatter: {
    type: Function,
    default: item => item.description || ''
  }
})

// Emits
const emit = defineEmits(['close', 'purchase'])

// Methods
const closeModal = () => {
  emit('close')
}

// 购买物品处理
const handlePurchase = purchaseData => {
  // 发送购买请求到父组件
  emit('purchase', {
    item: purchaseData.item,
    quantity: purchaseData.quantity,
    totalPrice: purchaseData.totalPrice,
    requiredSlots: purchaseData.requiredSlots
  })
}

// 物品选择处理
const handleItemSelected = item => {
// 可以在这里添加物品选择后的处理逻辑
}

</script>
