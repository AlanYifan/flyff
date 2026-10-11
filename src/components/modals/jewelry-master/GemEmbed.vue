<!--
  @fileoverview 镶嵌宝石组件
  @description 珠宝大师-皮奇：镶嵌宝石功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">镶嵌宝石</h3>

    <div class="jewelry-master-epic-content">
      <!-- 1. 终极武器选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">终极武器（强化等级>0）</div>
        <div ref="selectEmbedWeaponBoxRef" class="jewelry-master-select-box"
          :class="{ active: showEmbedWeaponPanel, disabled: embedWeaponItems.length === 0 }"
          @click="toggleEmbedWeaponPanel">
          <template v-if="selectedEmbedWeapon">
            <img :src="selectedEmbedWeapon.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getWeaponDisplayName(selectedEmbedWeapon) }}</span>
              <span class="jewelry-master-select-level">+{{ selectedEmbedWeapon.enhanceLevel || 0 }} · 宝石槽: {{ getEmbedSlotCount(selectedEmbedWeapon) }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ embedWeaponItems.length === 0 ? '背包中没有符合条件的终极武器' : '选择要镶嵌宝石的终极武器' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showEmbedWeaponPanel }">▼</span>
        </div>
      </div>

      <!-- 2. 已镶嵌宝石显示区域 -->
      <div v-if="selectedEmbedWeapon && embeddedGems.length > 0" class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">已镶嵌宝石</div>
        <div class="jewelry-master-embedded-gems">
          <div v-for="(gem, index) in embeddedGems" :key="index" class="jewelry-master-embedded-gem-item">
            <img :src="`/pt/item_icon/${gem.gemId}.png`" class="jewelry-master-embedded-gem-icon" @error="handleIconError"
              @mouseenter="showItemTooltipById($event, gem.gemId)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
            <span class="jewelry-master-embedded-gem-name">{{ gem.gemName }}</span>
          </div>
        </div>
      </div>

      <!-- 3. 终极宝石选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">终极宝石</div>
        <div ref="selectEmbedGemBoxRef" class="jewelry-master-select-box"
          :class="{ active: showEmbedGemPanel, disabled: embedGemItems.length === 0 }"
          @click="toggleEmbedGemPanel">
          <template v-if="selectedEmbedGem">
            <img :src="selectedEmbedGem.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getGemDisplayName(selectedEmbedGem) }}</span>
              <span class="jewelry-master-select-count">×{{ selectedEmbedGem.currentStack || 1 }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ embedGemItems.length === 0 ? '背包中没有终极宝石' : '选择要镶嵌的宝石' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showEmbedGemPanel }">▼</span>
        </div>
      </div>

      <!-- 4. 镶嵌操作区域 -->
      <div class="jewelry-master-epic-actions">
        <button class="jewelry-master-action-btn jewelry-master-embed-btn" :disabled="!canEmbedGem" @click="handleEmbedGem">
          镶嵌宝石
        </button>
        <div v-if="embedError" class="jewelry-master-error-message">{{ embedError }}</div>
        <div v-if="embedSuccess" class="jewelry-master-success-message">{{ embedSuccess }}</div>
      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <transition name="dice-panel-fade">
        <div v-if="showEmbedWeaponPanel && embedWeaponItems.length > 0" ref="panelEmbedWeaponRef"
          class="jewelry-master-dice-popup jewelry-master-weapon-popup" :style="embedWeaponPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择终极武器</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in embedWeaponItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item" :class="{ selected: selectedEmbedWeaponId === item.uniqueId }"
              @click="selectEmbedWeapon(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getWeaponDisplayName(item) }}</div>
                <div class="jewelry-master-popup-level">+{{ item.enhanceLevel || 0 }} · 宝石槽: {{ getEmbedSlotCount(item) }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="dice-panel-fade">
        <div v-if="showEmbedGemPanel && embedGemItems.length > 0" ref="panelEmbedGemRef"
          class="jewelry-master-dice-popup" :style="embedGemPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择宝石</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in embedGemItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item"
              :class="{ selected: isGemSelected(item) }"
              @click="selectEmbedGem(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getGemDisplayName(item) }}</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
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
 * @fileoverview 镶嵌宝石组件
 * @description 珠宝大师-皮奇：镶嵌宝石功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'

// 终极珠宝盒子ID
const JEWEL_BOX_ID = 17866

export default {
  name: 'GemEmbed',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      EMBED_GEM_CONFIG,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      getGemDisplayName,
      isGemPiece,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const selectEmbedWeaponBoxRef = ref(null)
    const selectEmbedGemBoxRef = ref(null)
    const panelEmbedWeaponRef = ref(null)
    const panelEmbedGemRef = ref(null)

    // 状态
    const selectedEmbedWeaponId = ref(null)
    const showEmbedWeaponPanel = ref(false)
    const selectedEmbedGemId = ref(null)
    const showEmbedGemPanel = ref(false)
    const embedSuccess = ref('')
    const embedError = ref('')
    const isEmbedding = ref(false)

    // 面板位置样式（响应式）
    const embedWeaponPanelStyle = ref({})
    const embedGemPanelStyle = ref({})

    /**
     * 获取可镶嵌的终极武器列表
     */
    const embedWeaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        if (item.category !== 'weapon') return false
        if (item.rarity !== 'ultimate') return false
        const enhanceLevel = item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0
        if (enhanceLevel <= 0) return false
        return true
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`,
        enhanceLevel: item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0
      }))
    })

    /**
     * 获取可镶嵌的宝石列表
     * 规则：所有闪耀开头的宝石（排除碎片和非宝石物品）和符文类宝石都可以镶嵌
     * 来源：可以是珠宝盒子开出的，也可以是合成获得的高等级宝石
     */
    const embedGemItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 获取物品信息
        const itemInfo = ITEM_INFO[item.id]
        if (!itemInfo || !itemInfo.name) return false

        const name = itemInfo.name.cns || itemInfo.name.en || ''
        const category = itemInfo.category || ''

        // 排除碎片
        if (name.includes('碎片')) return false

        // 排除装备类物品（手套、靴子、衣服、帽子、武器、盾牌等）
        if (['gloves', 'boots', 'armor', 'helmet', 'weapon', 'shield'].includes(category)) {
          return false
        }

        // 排除药丸类物品
        if (name.includes('药丸') || name.includes('金丸')) return false

        // 闪耀宝石：必须包含"级"字才是真正的宝石
        if (name.startsWith('闪耀')) {
          if (!name.includes('级')) return false
          return true
        }

        // 符文类宝石（名称以"符文"结尾）
        if (name.endsWith('符文')) {
          return true
        }

        return false
      }).map(item => ({
        ...item,
        icon: `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取选中的武器（直接从原始背包获取，确保响应式更新）
     */
    const selectedEmbedWeapon = computed(() => {
      if (!selectedEmbedWeaponId.value) return null
      // 直接从原始背包获取对象引用，而不是从 map 后的副本获取
      // 这样可以确保 embeddedGems 的修改能被响应式系统检测到
      const weapon = itemsStore.playerBag.find(item => item.uniqueId === selectedEmbedWeaponId.value)
      if (!weapon) return null
      return {
        ...weapon,
        icon: weapon.icon || `/pt/item_icon/${weapon.id}.png`,
        enhanceLevel: weapon.StrengthenedAttributes?.enhanceLevel || weapon.enhanceLevel || 0
      }
    })

    /**
     * 获取选中的宝石（直接从原始背包获取，确保能正确扣除）
     */
    const selectedEmbedGem = computed(() => {
      if (selectedEmbedGemId.value === null || selectedEmbedGemId.value === undefined) return null
      // 直接从原始背包获取，而不是从 embedGemItems 获取
      // selectedEmbedGemId 可能是 bagIndex（数字）或 uniqueId（字符串）
      let bagItem = null
      if (typeof selectedEmbedGemId.value === 'number') {
        // 使用索引查找
        bagItem = itemsStore.playerBag[selectedEmbedGemId.value]
      } else {
        // 使用 uniqueId 查找
        bagItem = itemsStore.playerBag.find(item => item.uniqueId === selectedEmbedGemId.value)
      }
      if (bagItem) {
        return {
          ...bagItem,
          icon: `/pt/item_icon/${bagItem.id}.png`
        }
      }
      return null
    })

    /**
     * 获取宝石槽位数量
     */
    const getEmbedSlotCount = weapon => {
      if (!weapon) return 0
      const level = weapon.enhanceLevel || weapon.StrengthenedAttributes?.enhanceLevel || 0
      return Math.min(10, Math.max(0, level))
    }

    /**
     * 判断宝石是否被选中
     * @param {Object} item - 宝石数据
     * @returns {boolean} 是否被选中
     */
    const isGemSelected = item => {
      if (selectedEmbedGemId.value === null || selectedEmbedGemId.value === undefined) return false
      if (typeof selectedEmbedGemId.value === 'number') {
        // 使用索引判断：找到该物品在背包中的索引
        const bagIndex = itemsStore.playerBag.findIndex(bagItem => {
          if (bagItem.uniqueId && item.uniqueId) {
            return bagItem.uniqueId === item.uniqueId
          }
          return bagItem.id === item.id
        })
        return bagIndex === selectedEmbedGemId.value
      }
      // 使用 uniqueId 判断
      return item.uniqueId === selectedEmbedGemId.value
    }

    /**
     * 获取已镶嵌的宝石列表
     * 直接从原始背包对象中读取，确保响应式更新
     */
    const embeddedGems = computed(() => {
      if (!selectedEmbedWeaponId.value) return []
      // 直接从原始背包获取对象，确保能检测到 embeddedGems 的变化
      const weapon = itemsStore.playerBag.find(item => item.uniqueId === selectedEmbedWeaponId.value)
      if (!weapon || !weapon.embeddedGems) return []
      const gems = weapon.embeddedGems
      if (typeof gems === 'object' && !Array.isArray(gems)) {
        return Object.entries(gems).map(([key, gem]) => ({ key, ...gem }))
      }
      return Array.isArray(gems) ? gems : []
    })

    /**
     * 判断宝石是否为四维类宝石（力量、敏捷、体质、智力）
     * 四维类宝石可以重复镶嵌，不受镶嵌次数限制
     * @param {Object} gem - 宝石数据
     * @returns {boolean} 是否为四维类宝石
     */
    const isStatGem = gem => {
      if (!gem || !gem.abilities || !gem.abilities[0]) return false
      const param = gem.abilities[0].parameter
      // str: 力量, dex: 敏捷, sta: 体质, int: 智力
      return ['str', 'dex', 'sta', 'int'].includes(param)
    }

    /**
     * 判断是否可以镶嵌
     * 规则：四维类宝石（力量、敏捷、体质、智力）可以重复镶嵌，其他宝石只能镶嵌一个
     */
    const canEmbedGem = computed(() => {
      if (!selectedEmbedWeapon.value || !selectedEmbedGem.value || isEmbedding.value) return false

      const weapon = selectedEmbedWeapon.value
      const gem = selectedEmbedGem.value

      const slotCount = getEmbedSlotCount(weapon)
      if (embeddedGems.value.length >= slotCount) return false

      // 四维类宝石（力量、敏捷、体质、智力）可以重复镶嵌
      if (isStatGem(gem)) return true

      // 其他宝石只能镶嵌一个，检查是否已经镶嵌过相同ID的宝石
      const alreadyEmbedded = embeddedGems.value.some(g => Number(g.gemId) === Number(gem.id))
      if (alreadyEmbedded) return false

      return true
    })

    /**
     * 获取镶嵌错误信息
     * 规则：四维类宝石可以重复镶嵌，其他宝石只能镶嵌一个
     */
    const getEmbedErrorInfo = computed(() => {
      if (!selectedEmbedWeapon.value || !selectedEmbedGem.value) return ''

      const weapon = selectedEmbedWeapon.value
      const gem = selectedEmbedGem.value

      const slotCount = getEmbedSlotCount(weapon)
      if (embeddedGems.value.length >= slotCount) return '宝石槽已满'

      // 四维类宝石可以重复镶嵌，不检查重复
      if (isStatGem(gem)) return ''

      // 其他宝石检查是否已经镶嵌过相同ID的宝石
      const alreadyEmbedded = embeddedGems.value.some(g => Number(g.gemId) === Number(gem.id))
      if (alreadyEmbedded) return '该宝石已镶嵌，同类型宝石只能镶嵌一个'

      return ''
    })

    /**
     * 切换面板
     */
    const toggleEmbedWeaponPanel = async () => {
      if (embedWeaponItems.value.length === 0) return
      showEmbedWeaponPanel.value = !showEmbedWeaponPanel.value
      if (showEmbedWeaponPanel.value) {
        showEmbedGemPanel.value = false
        await nextTick()
        updatePanelPosition(selectEmbedWeaponBoxRef, embedWeaponPanelStyle)
      }
    }

    const toggleEmbedGemPanel = async () => {
      if (embedGemItems.value.length === 0) return
      showEmbedGemPanel.value = !showEmbedGemPanel.value
      if (showEmbedGemPanel.value) {
        showEmbedWeaponPanel.value = false
        await nextTick()
        updatePanelPosition(selectEmbedGemBoxRef, embedGemPanelStyle)
      }
    }

    /**
     * 选择物品
     */
    const selectEmbedWeapon = item => {
      selectedEmbedWeaponId.value = item.uniqueId
      showEmbedWeaponPanel.value = false
      embedSuccess.value = ''
      embedError.value = ''
      hideItemTooltip()
    }

    const selectEmbedGem = item => {
      // 可堆叠物品使用 bagIndex 标识，不可堆叠物品使用 uniqueId
      // 查找物品在背包中的索引
      const bagIndex = itemsStore.playerBag.findIndex(bagItem => {
        if (bagItem.uniqueId && item.uniqueId) {
          return bagItem.uniqueId === item.uniqueId
        }
        // 对于可堆叠物品，使用 id 匹配
        return bagItem.id === item.id
      })
      selectedEmbedGemId.value = bagIndex !== -1 ? bagIndex : item.uniqueId || item.id
      showEmbedGemPanel.value = false
      embedSuccess.value = ''
      embedError.value = ''
      hideItemTooltip()
    }

    /**
     * 同步数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理镶嵌
     */
    const handleEmbedGem = async () => {
      if (!canEmbedGem.value) return

      isEmbedding.value = true
      embedSuccess.value = ''
      embedError.value = ''

      try {
        const weaponDisplay = selectedEmbedWeapon.value
        const gem = selectedEmbedGem.value
        const gemName = getGemDisplayName(gem)

        const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === weaponDisplay.uniqueId)
        if (weaponIndex === -1) {
          embedError.value = '找不到武器，请重试'
          return
        }

        const weapon = itemsStore.playerBag[weaponIndex]

        if (!weapon.embeddedGems) weapon.embeddedGems = {}

        const embeddedCount = Object.keys(weapon.embeddedGems).length
        const newGemKey = `gem${embeddedCount + 1}`

        weapon.embeddedGems[newGemKey] = {
          gemId: Number(gem.id),
          gemName: gemName,
          abilities: gem.abilities || []
        }

        // 扣除宝石 - 使用保存的索引或 uniqueId 查找
        let gemIndex = -1
        if (typeof selectedEmbedGemId.value === 'number') {
          // 直接使用保存的索引
          gemIndex = selectedEmbedGemId.value
        } else {
          // 使用 uniqueId 查找
          gemIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === selectedEmbedGemId.value)
        }
        
        if (gemIndex !== -1 && gemIndex < itemsStore.playerBag.length) {
          const bagGem = itemsStore.playerBag[gemIndex]
          if (bagGem.currentStack && bagGem.currentStack > 1) {
            bagGem.currentStack--
          } else {
            itemsStore.playerBag.splice(gemIndex, 1)
          }
        } else {
          console.warn('[GemEmbed] 找不到要扣除的宝石:', selectedEmbedGemId.value)
        }

        syncBagData()

        emit('play-sfx', 'InfUpgradeSuccess.wav')
        embedSuccess.value = `成功镶嵌 ${gemName}`
        emit('add-battle-log', `镶嵌成功！${gemName} 已镶嵌到武器`, 'success')
        emit('show-animation-message', `镶嵌成功！`, 'upgrade-success', gem.icon)

        // 重置宝石选择
        selectedEmbedGemId.value = null
      } catch (error) {
        console.error('[GemEmbed] 镶嵌失败:', error)
        embedError.value = '镶嵌失败，请重试'
      } finally {
        isEmbedding.value = false
      }
    }

    /**
     * 点击外部关闭
     */
    const handleClickOutside = e => {
      if (showEmbedWeaponPanel.value) {
        const isClickInsideBox = selectEmbedWeaponBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelEmbedWeaponRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showEmbedWeaponPanel.value = false
          hideItemTooltip()
        }
      }
      if (showEmbedGemPanel.value) {
        const isClickInsideBox = selectEmbedGemBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelEmbedGemRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showEmbedGemPanel.value = false
          hideItemTooltip()
        }
      }
    }

    onMounted(() => document.addEventListener('click', handleClickOutside))
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    return {
      // 引用
      selectEmbedWeaponBoxRef, selectEmbedGemBoxRef, panelEmbedWeaponRef, panelEmbedGemRef,
      // 状态
      showEmbedWeaponPanel, showEmbedGemPanel, embedSuccess, embedError, isEmbedding,
      selectedEmbedWeaponId, selectedEmbedGemId,
      // 计算属性
      embedWeaponItems, embedGemItems, selectedEmbedWeapon, selectedEmbedGem, embeddedGems,
      canEmbedGem, embedWeaponPanelStyle, embedGemPanelStyle,
      // 方法
      getEmbedSlotCount, toggleEmbedWeaponPanel, toggleEmbedGemPanel,
      selectEmbedWeapon, selectEmbedGem, handleEmbedGem, isGemSelected,
      showItemTooltip, showItemTooltipById, hideItemTooltip, moveItemTooltip,
      handleIconError, getWeaponDisplayName, getGemDisplayName
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
.jewelry-master-select-count { color: #00ff88; font-size: 10px; margin-right: 4px; }
.jewelry-master-select-placeholder { flex: 1; color: #666; font-size: 10px; }
.jewelry-master-select-arrow { color: #888; font-size: 8px; transition: transform 0.2s; }
.jewelry-master-select-arrow.rotated { transform: rotate(180deg); }

/* 已镶嵌宝石 */
.jewelry-master-embedded-gems { display: flex; flex-wrap: wrap; gap: 4px; }
.jewelry-master-embedded-gem-item { display: flex; align-items: center; gap: 3px; padding: 2px 4px; background: rgba(0, 0, 0, 0.3); border-radius: 3px; border: 1px solid #3a3a5a; }
.jewelry-master-embedded-gem-icon { width: 16px; height: 16px; object-fit: contain; }
.jewelry-master-embedded-gem-name { color: #ffd700; font-size: 9px; }

/* 操作区域 - 一行显示 */
.jewelry-master-epic-actions { display: flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 4px; border-top: 1px solid #3a3a5a; }

.jewelry-master-action-btn { padding: 4px 8px; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.jewelry-master-embed-btn { background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); color: #fff; }
.jewelry-master-embed-btn:hover:not(:disabled) { background: linear-gradient(135deg, #5a8c69 0%, #7bab8a 100%); box-shadow: 0 0 10px rgba(90, 140, 105, 0.5); }
.jewelry-master-embed-btn:disabled { background: #3a3a4a; color: #666; cursor: not-allowed; }

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
.jewelry-master-popup-level, .jewelry-master-popup-count { color: #888; font-size: 9px; margin-top: 1px; }

.dice-panel-fade-enter-active, .dice-panel-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dice-panel-fade-enter-from, .dice-panel-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
