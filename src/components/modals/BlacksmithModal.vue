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
    actions-placement="dialog"
    @close="close"
    @purchase="handlePurchase"
    @item-selected="handleItemSelected"
  >
    <template #filters>
      <div class="shop-filters">
        <div class="shop-filter">
          <span class="shop-filter-label">职业</span>
          <select v-model.number="selectedWeaponClassId" class="shop-filter-select">
            <option :value="0">全部职业</option>
            <option
              v-for="option in weaponClassOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="shop-filter">
          <span class="shop-filter-label">稀有度</span>
          <select v-model="selectedWeaponRarity" class="shop-filter-select">
            <option value="all">全部稀有度</option>
            <option v-for="option in rarityFilterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <button class="shop-filter-reset" type="button" @click="resetWeaponFilters">
          重置
        </button>
      </div>
    </template>

    <!-- 扩展功能按钮插槽 -->
    <template #extra-buttons>
      <button class="enhance-button" @click="openEnhancePanel">精炼</button>
      <button class="perforation-button" @click="openPerforationPanel">穿洞</button>
      <button class="card-button" @click="openCardPanel">卡片</button>
    </template>

    <!-- 物品额外信息插槽 -->
    <template #item-extra-info="{ item }">
      <div v-if="item.level" class="shop-item-level">Lv.{{ item.level }}</div>
    </template>
  </BaseNPCShopModal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import BaseNPCShopModal from './BaseNPCShopModal.vue'
import { useItemsStore } from '@/store/items'
import { classMapping, rarityMapping } from '@/utils/itemHelpers'

export default {
  name: 'BlacksmithModal',
  components: {
    BaseNPCShopModal
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    npcType: {
      type: String,
      default: 'blacksmith'
    },
    npcName: {
      type: String,
      default: '铁匠-波波酷'
    },
    npcIcon: {
      type: String,
      default: '/pt/npc_icon/boboku.png'
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
  emits: ['close', 'buy-item', 'open-enhance-panel', 'open-perforation-panel', 'open-card-panel'],
  setup (props, { emit }) {
    const itemsStore = useItemsStore()

    // 使用统一的稀有度颜色和名称映射
    const rarityColors = computed(() => itemsStore.rarityTextColorMap)
    const rarityNames = rarityMapping

    const selectedWeaponClassId = ref(0)
    const selectedWeaponRarity = ref('all')

    const weaponClassOptions = computed(() => {
      const allowed = new Set(['初心者', '战士', '魔导士', '圣职者', '弓箭手'])
      return Object.keys(classMapping)
        .map(id => ({
          value: Number(id),
          label: classMapping[id]
        }))
        .filter(option => allowed.has(option.label))
        .sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN'))
    })
    // 武器稀有度筛选选项
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
    
    const normalizeItemClassIds = item => {
      const raw = item?.class
      if (!raw) {
        return []
      }
      if (Array.isArray(raw)) {
        return raw.map(entry => Number(entry)).filter(Number.isFinite)
      }
      const coerced = Number(raw)
      return Number.isFinite(coerced) ? [coerced] : []
    }

    const resetWeaponFilters = () => {
      selectedWeaponClassId.value = 0
      selectedWeaponRarity.value = 'all'
    }

    const displayShopItems = computed(() => {
      const classId = Number(selectedWeaponClassId.value)
      const rarity = String(selectedWeaponRarity.value || 'all').toLowerCase()

      return (props.shopItems || []).filter(item => {
        if (rarity !== 'all') {
          const itemRarity = String(item?.rarity || 'common').toLowerCase()
          if (itemRarity !== rarity) {
            return false
          }
        }

        if (classId === 0) {
          return true
        }

        const classIds = normalizeItemClassIds(item)
        return classIds.includes(classId)
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

    // 购买物品处理
    const handlePurchase = purchaseData => {
      emit('buy-item', purchaseData.item)
    }

    // 物品选择处理
    const handleItemSelected = () => {
      // 可以在这里添加物品选择后的处理逻辑
    }

    // 监听shopItems变化
    watch(() => props.shopItems, () => {}, { immediate: true })

    // 关闭模态框
    const close = () => {
      emit('close')
    }

    // 打开强化面板
    const openEnhancePanel = () => {
      // 触发打开强化面板的事件
      emit('open-enhance-panel')
    }

    // 打开穿洞面板
    const openPerforationPanel = () => {
      // 触发打开穿洞面板的事件
      emit('open-perforation-panel')
    }

    // 打开卡片镶嵌面板
    const openCardPanel = () => {
      // 触发打开卡片镶嵌面板的事件
      emit('open-card-panel')
    }

    return {
      rarityColors,
      rarityNames,
      selectedWeaponClassId,
      selectedWeaponRarity,
      weaponClassOptions,
      rarityFilterOptions,
      resetWeaponFilters,
      displayShopItems,
      priceCalculator,
      nameFormatter,
      descriptionFormatter,
      handlePurchase,
      handleItemSelected,
      close,
      openEnhancePanel,
      openPerforationPanel,
      openCardPanel
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

  .enhance-button {
    background: linear-gradient(135deg, #ff9900, #ff6600);
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
    margin-right: 10px;
  }

  .perforation-button {
    background: linear-gradient(135deg, #00bfff, #0077cc);
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
    margin-right: 10px;
  }

  .card-button {
    background: linear-gradient(135deg, #9932cc, #8a2be2);
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
  }

  .shop-item-level {
    color: #2196f3;
    font-size: 12px;
    font-weight: bold;
  }

  .enhance-button:hover,
  .perforation-button:hover,
  .card-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
</style>
