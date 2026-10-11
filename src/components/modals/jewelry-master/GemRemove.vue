<!--
  @fileoverview 拆除宝石组件
  @description 珠宝大师-皮奇：拆除宝石功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">拆除宝石</h3>

    <div class="jewelry-master-epic-content">
      <!-- 1. 终极武器选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">终极武器</div>
        <div ref="selectRemoveWeaponBoxRef" class="jewelry-master-select-box"
          :class="{ active: showRemoveWeaponPanel, disabled: removeWeaponItems.length === 0 }"
          @click="toggleRemoveWeaponPanel">
          <template v-if="selectedRemoveWeapon">
            <img :src="selectedRemoveWeapon.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getWeaponDisplayName(selectedRemoveWeapon) }}</span>
              <span class="jewelry-master-select-level">+{{ selectedRemoveWeapon.enhanceLevel || 0 }} · 宝石: {{ embeddedGems.length }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ removeWeaponItems.length === 0 ? '背包中没有镶嵌宝石的终极武器' : '选择要拆除宝石的武器' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showRemoveWeaponPanel }">▼</span>
        </div>
      </div>

      <!-- 2. 已镶嵌宝石列表 -->
      <div v-if="selectedRemoveWeapon && embeddedGems.length > 0" class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">选择要拆除的宝石</div>
        <div class="jewelry-master-embedded-gems-selectable">
          <div v-for="(gem, index) in embeddedGems" :key="index"
            class="jewelry-master-gem-select-item"
            :class="{ selected: selectedRemoveGemKey === gem.key }"
            @click="selectRemoveGem(gem)">
            <img :src="`/pt/item_icon/${gem.gemId}.png`" class="jewelry-master-gem-icon" @error="handleIconError"
              @mouseenter="showItemTooltipById($event, gem.gemId)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
            <span class="jewelry-master-gem-name">{{ gem.gemName }}</span>
          </div>
        </div>
      </div>

      <!-- 3. 操作区域 -->
      <div class="jewelry-master-epic-actions">
        <button class="jewelry-master-action-btn jewelry-master-remove-btn"
          :disabled="!selectedRemoveGemKey || isRemoving"
          @click="handleRemoveGem">
          {{ isRemoving ? '拆除中...' : '拆除宝石' }}
        </button>
        <div v-if="removeError" class="jewelry-master-error-message">{{ removeError }}</div>
        <div v-if="removeSuccess" class="jewelry-master-success-message">{{ removeSuccess }}</div>
      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <transition name="dice-panel-fade">
        <div v-if="showRemoveWeaponPanel && removeWeaponItems.length > 0" ref="panelRemoveWeaponRef"
          class="jewelry-master-dice-popup jewelry-master-weapon-popup" :style="removeWeaponPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择终极武器</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in removeWeaponItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item" :class="{ selected: selectedRemoveWeaponId === item.uniqueId }"
              @click="selectRemoveWeapon(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getWeaponDisplayName(item) }}</div>
                <div class="jewelry-master-popup-level">+{{ item.enhanceLevel || 0 }} · 宝石: {{ getEmbeddedGemsCount(item) }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
/**
 * @fileoverview 拆除宝石组件
 * @description 珠宝大师-皮奇：拆除宝石功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'

export default {
  name: 'GemRemove',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const selectRemoveWeaponBoxRef = ref(null)
    const panelRemoveWeaponRef = ref(null)

    // 状态
    const selectedRemoveWeaponId = ref(null)
    const showRemoveWeaponPanel = ref(false)
    const selectedRemoveGemKey = ref(null)
    const isRemoving = ref(false)
    const removeError = ref('')
    const removeSuccess = ref('')

    // 面板位置样式（响应式）
    const removeWeaponPanelStyle = ref({})

    /**
     * 获取可拆除宝石的武器列表
     */
    const removeWeaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        if (item.category !== 'weapon') return false
        if (item.rarity !== 'ultimate') return false
        if (!item.embeddedGems || Object.keys(item.embeddedGems).length === 0) return false
        return true
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`,
        enhanceLevel: item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0
      }))
    })

    /**
     * 获取选中的武器
     */
    const selectedRemoveWeapon = computed(() => {
      if (!selectedRemoveWeaponId.value) return null
      return removeWeaponItems.value.find(item => item.uniqueId === selectedRemoveWeaponId.value)
    })

    /**
     * 获取已镶嵌的宝石列表
     */
    const embeddedGems = computed(() => {
      if (!selectedRemoveWeapon.value || !selectedRemoveWeapon.value.embeddedGems) return []
      const gems = selectedRemoveWeapon.value.embeddedGems
      if (typeof gems === 'object' && !Array.isArray(gems)) {
        return Object.entries(gems).map(([key, gem]) => ({ key, ...gem }))
      }
      return Array.isArray(gems) ? gems : []
    })

    /**
     * 获取已镶嵌宝石数量
     */
    const getEmbeddedGemsCount = item => {
      if (!item || !item.embeddedGems) return 0
      return Object.keys(item.embeddedGems).length
    }

    /**
     * 切换面板
     */
    const toggleRemoveWeaponPanel = async () => {
      if (removeWeaponItems.value.length === 0) return
      showRemoveWeaponPanel.value = !showRemoveWeaponPanel.value
      if (showRemoveWeaponPanel.value) {
        await nextTick()
        updatePanelPosition(selectRemoveWeaponBoxRef, removeWeaponPanelStyle)
      }
    }

    /**
     * 选择武器
     */
    const selectRemoveWeapon = item => {
      selectedRemoveWeaponId.value = item.uniqueId
      selectedRemoveGemKey.value = null
      removeError.value = ''
      removeSuccess.value = ''
      showRemoveWeaponPanel.value = false
      hideItemTooltip()
    }

    /**
     * 选择要拆除的宝石
     */
    const selectRemoveGem = gem => {
      selectedRemoveGemKey.value = gem.key
      removeError.value = ''
      removeSuccess.value = ''
    }

    /**
     * 同步数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理拆除
     */
    const handleRemoveGem = async () => {
      if (!selectedRemoveWeapon.value || !selectedRemoveGemKey.value || isRemoving.value) return

      isRemoving.value = true
      removeError.value = ''
      removeSuccess.value = ''

      try {
        const weaponDisplay = selectedRemoveWeapon.value
        const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === weaponDisplay.uniqueId)
        if (weaponIndex === -1) {
          removeError.value = '找不到武器，请重试'
          return
        }

        const weapon = itemsStore.playerBag[weaponIndex]
        const gem = weapon.embeddedGems[selectedRemoveGemKey.value]

        if (!gem) {
          removeError.value = '找不到宝石，请重试'
          return
        }

        // 从武器中移除宝石
        delete weapon.embeddedGems[selectedRemoveGemKey.value]

        // 将宝石添加回背包
        const newItem = {
          id: gem.gemId,
          uniqueId: Date.now() + Math.random().toString(36).substr(2, 9),
          currentStack: 1,
          stack: 999,
          icon: `/pt/item_icon/${gem.gemId}.png`,
          category: 'material',
          subcategory: 'ultimatejewel',
          name: gem.gemName
        }
        itemsStore.playerBag.push(newItem)

        syncBagData()

        const weaponName = getWeaponDisplayName(weaponDisplay)
        const gemName = gem.gemName

        emit('play-sfx', 'InfUpgradeSuccess.wav')
        removeSuccess.value = `成功拆除 ${gemName}`

        emit('add-battle-log', `拆除成功！从【${weaponName}】拆除 ${gemName}`, 'success')
        emit('show-animation-message', `拆除成功！获得 ${gemName}`, 'upgrade-success', `/pt/item_icon/${gem.gemId}.png`)

        // 重置选择
        selectedRemoveGemKey.value = null

        // 如果武器没有宝石了，重置武器选择
        if (Object.keys(weapon.embeddedGems).length === 0) {
          selectedRemoveWeaponId.value = null
        }
      } catch (error) {
        console.error('[GemRemove] 拆除失败:', error)
        removeError.value = '拆除失败，请重试'
      } finally {
        isRemoving.value = false
      }
    }

    /**
     * 点击外部关闭
     */
    const handleClickOutside = e => {
      if (showRemoveWeaponPanel.value) {
        const isClickInsideBox = selectRemoveWeaponBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelRemoveWeaponRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showRemoveWeaponPanel.value = false
          hideItemTooltip()
        }
      }
    }

    onMounted(() => document.addEventListener('click', handleClickOutside))
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    return {
      // 引用
      selectRemoveWeaponBoxRef, panelRemoveWeaponRef,
      // 状态
      selectedRemoveWeaponId, showRemoveWeaponPanel, selectedRemoveGemKey, isRemoving, removeError, removeSuccess,
      // 计算属性
      removeWeaponItems, selectedRemoveWeapon, embeddedGems, removeWeaponPanelStyle,
      // 方法
      getEmbeddedGemsCount, toggleRemoveWeaponPanel, selectRemoveWeapon, selectRemoveGem, handleRemoveGem,
      showItemTooltip, showItemTooltipById, hideItemTooltip, moveItemTooltip, handleIconError, getWeaponDisplayName
    }
  }
}
</script>

<style scoped>
.jewelry-master-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 35, 0.95);
  border-radius: 6px;
  padding: 4px;
  overflow: hidden;
}

.jewelry-master-panel-title {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 3px;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.jewelry-master-epic-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.jewelry-master-epic-section { display: flex; flex-direction: column; gap: 2px; }
.jewelry-master-epic-title { font-size: 10px; color: #aaa; }

.jewelry-master-select-box {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 28px;
}

.jewelry-master-select-box:hover:not(.disabled) { border-color: #5a5a8a; }
.jewelry-master-select-box.active { border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
.jewelry-master-select-box.disabled { opacity: 0.5; cursor: not-allowed; }

.jewelry-master-select-icon { width: 22px; height: 22px; object-fit: contain; margin-right: 4px; }
.jewelry-master-select-info { flex: 1; display: flex; flex-direction: column; }
.jewelry-master-select-name { color: #fff; font-size: 11px; }
.jewelry-master-select-level { color: #888; font-size: 9px; }
.jewelry-master-select-placeholder { flex: 1; color: #666; font-size: 10px; }
.jewelry-master-select-arrow { color: #888; font-size: 8px; transition: transform 0.2s; }
.jewelry-master-select-arrow.rotated { transform: rotate(180deg); }

/* 宝石选择 */
.jewelry-master-embedded-gems-selectable { display: flex; flex-wrap: wrap; gap: 4px; }
.jewelry-master-gem-select-item { display: flex; align-items: center; gap: 3px; padding: 3px 6px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; border: 1px solid #3a3a5a; cursor: pointer; transition: all 0.2s; }
.jewelry-master-gem-select-item:hover { border-color: #5a5a8a; }
.jewelry-master-gem-select-item.selected { border-color: #ffd700; background: rgba(255, 215, 0, 0.1); }
.jewelry-master-gem-icon { width: 18px; height: 18px; object-fit: contain; }
.jewelry-master-gem-name { color: #ffd700; font-size: 10px; }

/* 操作区域 - 一行显示 */
.jewelry-master-epic-actions { display: flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 4px; border-top: 1px solid #3a3a5a; }

.jewelry-master-action-btn { padding: 4px 8px; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.jewelry-master-remove-btn { background: linear-gradient(135deg, #aa5a5a 0%, #ca7a7a 100%); color: #fff; }
.jewelry-master-remove-btn:hover:not(:disabled) { background: linear-gradient(135deg, #ba6a6a 0%, #da8a8a 100%); box-shadow: 0 0 10px rgba(170, 90, 90, 0.5); }
.jewelry-master-remove-btn:disabled { background: #3a3a4a; color: #666; cursor: not-allowed; }

.jewelry-master-error-message { color: #ff6666; font-size: 10px; text-align: center; }
.jewelry-master-success-message { color: #00ff88; font-size: 10px; text-align: center; }

/* 弹出面板 - 使用 fixed 定位浮在上层 */
.jewelry-master-dice-popup { position: fixed; width: 240px; max-height: 260px; background: rgba(30, 30, 50, 0.98); border: 1px solid #4a4a6a; border-radius: 6px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); overflow: hidden; z-index: 9999; }
.jewelry-master-popup-header { padding: 4px 8px; background: rgba(0, 0, 0, 0.3); border-bottom: 1px solid #3a3a5a; color: #ffd700; font-size: 11px; font-weight: bold; }
.jewelry-master-popup-items { max-height: 220px; overflow-y: auto; }
.jewelry-master-popup-item { display: flex; align-items: center; padding: 4px 8px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid rgba(60, 60, 90, 0.3); }
.jewelry-master-popup-item:hover { background: rgba(255, 215, 0, 0.1); }
.jewelry-master-popup-item.selected { background: rgba(255, 215, 0, 0.2); border-left: 3px solid #ffd700; }
.jewelry-master-popup-icon { width: 22px; height: 22px; object-fit: contain; margin-right: 4px; }
.jewelry-master-popup-info { flex: 1; }
.jewelry-master-popup-name { color: #fff; font-size: 11px; }
.jewelry-master-popup-level { color: #888; font-size: 9px; margin-top: 1px; }

.dice-panel-fade-enter-active, .dice-panel-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dice-panel-fade-enter-from, .dice-panel-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
