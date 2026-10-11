<template>
  <BaseNPCShopModal
    v-if="isVisible"
    :npc-name="npcName"
    :npc-avatar="npcIcon"
    :npc-dialog="currentDialog"
    :shop-items="displayShopItems"
    :rarity-colors="rarityColors"
    :rarity-names="rarityNames"
    :price-calculator="priceCalculator"
    :name-formatter="nameFormatter"
    :description-formatter="descriptionFormatter"
    @close="close"
    @purchase="handlePurchase"
    @item-selected="handleItemSelected"
  >
    <!-- 功能区域（在筛选区域上方） -->
    <template #action-bar>
      <button class="exchange-btn" type="button" @click="openExchangeModal">
        兑换
      </button>
      <button class="decompose-btn" type="button" @click="openDecomposeModal">
        分解
      </button>
    </template>

    <template #filters>
      <div class="shop-filters">
        <div class="shop-filter">
          <span class="shop-filter-label">部位</span>
          <select v-model="selectedArmorPart" class="shop-filter-select">
            <option value="all">全部部位</option>
            <option value="helmet">帽子</option>
            <option value="suit">衣服</option>
            <option value="gloves">手套</option>
            <option value="boots">鞋子</option>
            <option value="shield">盾牌</option>
          </select>
        </div>

        <div class="shop-filter">
          <span class="shop-filter-label">稀有度</span>
          <select v-model="selectedArmorRarity" class="shop-filter-select">
            <option value="all">全部稀有度</option>
            <option v-for="option in rarityFilterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <button class="shop-filter-reset" type="button" @click="resetArmorFilters">
          重置
        </button>
      </div>
    </template>

    <!-- 物品额外信息插槽 -->
    <template #item-extra-info="{ item }">
      <div v-if="item.level" class="shop-item-level">Lv.{{ item.level }}</div>
    </template>
  </BaseNPCShopModal>

  <!-- 兑换面板 -->
  <ExchangeModal
    v-if="showExchangeModal"
    :is-visible="showExchangeModal"
    :player="player"
    @close="closeExchangeModal"
    @exchange-success="handleExchangeSuccess"
    @play-sfx="handlePlaySFX"
  />

  <!-- 分解面板 -->
  <DecomposeModal
    v-if="showDecomposeModal"
    :is-visible="showDecomposeModal"
    :player="player"
    @close="closeDecomposeModal"
    @decompose-success="handleDecomposeSuccess"
    @play-sfx="handlePlaySFX"
    @add-battle-log="handleAddBattleLog"
    @show-animation-message="handleShowAnimationMessage"
  />
</template>

<script>
/**
 * 防具商店模态框组件
 * 提供防具购买和饰品兑换功能
 * @file ArmorShopModal.vue
 * @generated 2026-02-23
 */
import { ref, computed } from 'vue'
import BaseNPCShopModal from './BaseNPCShopModal.vue'
import ExchangeModal from './ExchangeModal.vue'
import DecomposeModal from './DecomposeModal.vue'
import { useItemsStore } from '@/store/items'
import { rarityMapping } from '@/utils/itemHelpers'

export default {
  name: 'ArmorShopModal',
  components: {
    BaseNPCShopModal,
    ExchangeModal,
    DecomposeModal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    npcName: {
      type: String,
      default: '装备-波波克'
    },
    npcIcon: {
      type: String,
      default: '/pt/npc_icon/bulrox.png'
    },
    currentDialog: {
      type: String,
      default: ''
    },
    shopItems: {
      type: Array,
      default: () => []
    },
    player: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'buy-item', 'purchase', 'player-data-updated', 'play-sfx', 'add-battle-log', 'show-animation-message'],
  setup (props, { emit }) {
    const itemsStore = useItemsStore()

    // 使用统一的稀有度颜色和名称映射
    const rarityColors = computed(() => itemsStore.rarityTextColorMap)
    const rarityNames = rarityMapping

    const selectedArmorPart = ref('all')
    const selectedArmorRarity = ref('all')

    // 兑换面板状态
    const showExchangeModal = ref(false)
    // 分解面板状态
    const showDecomposeModal = ref(false)

    const rarityFilterOptions = computed(() => {
      const order = ['common', 'uncommon']
      const seen = new Set()
      const resolved = []
      for (const key of order) {
        const label =
          rarityNames[key] || rarityNames[key.toLowerCase()] || rarityNames[key[0].toUpperCase() + key.slice(1)]
        if (!label) {
          continue
        }
        const normalizedKey = key.toLowerCase()
        if (seen.has(normalizedKey)) {
          continue
        }
        seen.add(normalizedKey)
        resolved.push({ value: normalizedKey, label })
      }
      return resolved
    })

    const resetArmorFilters = () => {
      selectedArmorPart.value = 'all'
      selectedArmorRarity.value = 'all'
    }

    const displayShopItems = computed(() => {
      const part = String(selectedArmorPart.value || 'all')
      const rarity = String(selectedArmorRarity.value || 'all').toLowerCase()

      return (props.shopItems || []).filter(item => {
        if (rarity !== 'all') {
          const itemRarity = String(item?.rarity || 'common').toLowerCase()
          if (itemRarity !== rarity) {
            return false
          }
        }

        if (part === 'all') {
          return true
        }

        const subcategory = String(item?.subcategory || '')
        if (part === 'gloves') {
          return subcategory === 'gloves' || subcategory === 'gauntlet'
        }
        return subcategory === part
      })
    })

    // 价格计算函数
    const priceCalculator = item => {
      return item.price || 0
    }

    // 名称格式化函数
    const nameFormatter = item => {
      return item.name
    }

    // 描述格式化函数
    const descriptionFormatter = item => {
      return item.description || ''
    }

    // 获取物品子类别名称
    const getItemSubcategoryName = subcategory => {
      const subcategoryNames = {
        head: '头部',
        body: '身体',
        hands: '手部',
        feet: '足部',
        shield: '盾牌',
        cape: '披风',
        ring: '戒指',
        necklace: '项链',
        belt: '腰带'
      }
      return subcategoryNames[subcategory] || subcategory
    }

    // 显示消息
    const showMessage = (message, type = 'info') => {
      // 发送事件到主组件显示消息
      const messageEvent = new CustomEvent('show-message', {
        detail: {
          message,
          type
        }
      })
      window.dispatchEvent(messageEvent)
    }

    // 购买物品处理
    const handlePurchase = purchaseData => {
      const item = purchaseData.item
      // 添加日志输出，便于调试购买过程
      console.log('尝试购买物品:', item)
      // 检查玩家是否有足够的金币
      if (props.player.gold < purchaseData.totalPrice) {
        console.log('金币不足，无法购买:', item.name)
        showMessage(`金币不足，无法购买: ${item.name}`, 'error')
        return
      }

      // 检查物品数据完整性
      if (!item.id || !item.name || !item.price) {
        console.log('物品数据不完整，无法购买:', item)
        showMessage('物品数据不完整，无法购买', 'error')
        return
      }

      console.log('成功购买物品:', item.name)
      emit('buy-item', item)
      showMessage(`成功购买 ${item.name}`, 'success')
    }

    // 物品选择处理
const handleItemSelected = item => {
// 可以在这里添加物品选择后的处理逻辑
}

    // 关闭模态框
    const close = () => {
      emit('close')
    }

    // 打开兑换面板
    const openExchangeModal = () => {
      showExchangeModal.value = true
    }

    // 关闭兑换面板
    const closeExchangeModal = () => {
      showExchangeModal.value = false
    }

    // 打开分解面板
    const openDecomposeModal = () => {
      showDecomposeModal.value = true
    }

    // 关闭分解面板
    const closeDecomposeModal = () => {
      showDecomposeModal.value = false
    }

    // 分解成功处理
    const handleDecomposeSuccess = (data) => {
      console.log('[ArmorShopModal] 分解成功:', data)
      // 分解操作只修改背包物品，不需要重新加载玩家数据和属性计算
      // 使用 skipPlayerReload 和 skipAttributesUpdate 跳过不必要的更新
      emit('player-data-updated', {
        source: 'decompose',
        data,
        skipPlayerReload: true,
        skipAttributesUpdate: true
      })
    }

    // 兑换成功处理
    const handleExchangeSuccess = (data) => {
      console.log('[ArmorShopModal] 兑换成功:', data)
      // 触发玩家数据更新事件，通知背包刷新
      emit('player-data-updated', { source: 'exchange', data })
    }

    // 转发音效事件
    const handlePlaySFX = (sfxName) => {
      emit('play-sfx', sfxName)
    }

    // 转发战斗日志事件
    const handleAddBattleLog = (text, type) => {
      emit('add-battle-log', text, type)
    }

    // 转发动画消息事件
    const handleShowAnimationMessage = (text, type, icon) => {
      emit('show-animation-message', text, type, icon)
    }

    return {
      rarityColors,
      rarityNames,
      selectedArmorPart,
      selectedArmorRarity,
      rarityFilterOptions,
      resetArmorFilters,
      displayShopItems,
      priceCalculator,
      nameFormatter,
      descriptionFormatter,
      getItemSubcategoryName,
      handlePurchase,
      handleItemSelected,
      close,
      showMessage,
      // 兑换相关
      showExchangeModal,
      openExchangeModal,
      closeExchangeModal,
      handleExchangeSuccess,
      handlePlaySFX,
      // 分解相关
      showDecomposeModal,
      openDecomposeModal,
      closeDecomposeModal,
      handleDecomposeSuccess,
      // 战斗日志和动画消息转发
      handleAddBattleLog,
      handleShowAnimationMessage
    }
  }
}
</script>

<style scoped>
  .shop-filters {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    flex-wrap: wrap;
  }

  .shop-filter {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .shop-filter-label {
    color: #ffd700;
    font-size: 14px;
    white-space: nowrap;
  }

  .shop-filter-select {
    min-width: 140px;
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 215, 0, 0.35);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    outline: none;
  }

  .shop-filter-reset {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255, 215, 0, 0.35);
    background: rgba(255, 215, 0, 0.12);
    color: #fff;
    cursor: pointer;
  }

  .shop-filter-reset:hover {
    background: rgba(255, 215, 0, 0.2);
  }

  .shop-item-level {
    color: #2196f3;
    font-size: 12px;
    font-weight: bold;
  }

  .shop-item-subcategory {
    color: #ff9800;
    font-size: 11px;
    font-style: italic;
  }

  /* 兑换按钮样式 */
  .exchange-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid rgba(76, 175, 80, 0.6);
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(69, 160, 73, 0.3) 100%);
    color: #4caf50;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .exchange-btn:hover {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.5) 0%, rgba(69, 160, 73, 0.5) 100%);
    border-color: #4caf50;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  }

  /* 分解按钮样式 */
  .decompose-btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid rgba(255, 152, 0, 0.6);
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.3) 0%, rgba(230, 126, 34, 0.3) 100%);
    color: #ff9800;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
  }

  .decompose-btn:hover {
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.5) 0%, rgba(230, 126, 34, 0.5) 100%);
    border-color: #ff9800;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  }
</style>
