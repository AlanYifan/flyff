<!--
  @fileoverview 终极武器制作组件
  @description 珠宝大师-皮奇：制作终极武器功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">制作终极武器</h3>

    <div class="jewelry-master-epic-content">
      <!-- 1. 武器选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">史诗武器（需强化+10）</div>
        <div ref="selectUltimateWeaponBoxRef" class="jewelry-master-select-box"
          :class="{ active: showUltimateWeaponPanel, disabled: ultimateWeaponItems.length === 0 }"
          @click="toggleUltimateWeaponPanel">
          <template v-if="selectedUltimateWeapon">
            <img :src="selectedUltimateWeapon.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getWeaponDisplayName(selectedUltimateWeapon) }}</span>
              <span class="jewelry-master-select-level">+{{ selectedUltimateWeapon.enhanceLevel || 0 }} · Lv.{{ selectedUltimateWeapon.level || 150 }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ ultimateWeaponItems.length === 0 ? '没有符合条件转换的武器（需150级+10强化）' : '选择要转换的史诗武器' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showUltimateWeaponPanel }">▼</span>
        </div>
      </div>

      <!-- 2. 闪耀晶石选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">闪耀晶石</div>
        <div ref="selectShiningCrystalBoxRef" class="jewelry-master-select-box"
          :class="{ active: showShiningCrystalPanel, disabled: shiningCrystalItems.length === 0 }"
          @click="toggleShiningCrystalPanel">
          <template v-if="selectedShiningCrystal">
            <img :src="selectedShiningCrystal.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <span class="jewelry-master-select-name">闪耀晶石</span>
            <span class="jewelry-master-select-count">×{{ selectedShiningCrystal.currentStack || 1 }}</span>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ shiningCrystalItems.length === 0 ? '背包中没有闪耀晶石' : '选择闪耀晶石' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showShiningCrystalPanel }">▼</span>
        </div>
      </div>

      <!-- 3. 终极宝珠选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">终极宝珠</div>
        <div ref="selectUltimateOrbBoxRef" class="jewelry-master-select-box"
          :class="{ active: showUltimateOrbPanel, disabled: ultimateOrbItems.length === 0 }"
          @click="toggleUltimateOrbPanel">
          <template v-if="selectedUltimateOrb">
            <img :src="selectedUltimateOrb.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <span class="jewelry-master-select-name">终极宝珠</span>
            <span class="jewelry-master-select-count">×{{ selectedUltimateOrb.currentStack || 1 }}</span>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ ultimateOrbItems.length === 0 ? '背包中没有终极宝珠' : '选择终极宝珠' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showUltimateOrbPanel }">▼</span>
        </div>
      </div>

      <!-- 4. 转换结果预览 -->
      <div v-if="ultimateWeaponPreview" class="jewelry-master-epic-result-section">
        <div class="jewelry-master-epic-result-title">转换结果</div>
        <div class="jewelry-master-epic-result-display">
          <div class="jewelry-master-epic-result-frame jewelry-master-ultimate-result-frame has-marquee">
            <img :src="`/pt/item_icon/${ultimateWeaponPreview.id}.png`" class="jewelry-master-epic-result-icon"
              @error="handleIconError" @mouseenter="showItemTooltipById($event, ultimateWeaponPreview.id)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
          </div>
          <div class="jewelry-master-epic-result-info">
            <div class="jewelry-master-epic-result-name ultimate" :style="getRarityStyle('ultimate')">终极 {{ ultimateWeaponPreview.name }}</div>
            <div v-if="canUltimateConvert" class="jewelry-master-epic-result-chance">转换概率: {{ ultimateConversionRate.rate }}%</div>
          </div>
        </div>
      </div>

      <!-- 5. 转换进度条 -->
      <div v-if="showUltimateProgress" class="jewelry-master-epic-progress-section">
        <div class="jewelry-master-epic-progress-bar">
          <div class="jewelry-master-epic-progress-fill" :style="{ width: ultimateProgress + '%' }"></div>
        </div>
        <div class="jewelry-master-epic-progress-text">转换中... {{ Math.floor(ultimateProgress) }}%</div>
      </div>

      <!-- 6. 操作按钮区域 -->
      <div class="jewelry-master-epic-actions">
        <div v-if="canUltimateConvert" class="jewelry-master-epic-materials-info">
          <div class="jewelry-master-epic-material-row total">
            <span class="jewelry-master-epic-material-label">闪耀晶石:</span>
            <span class="jewelry-master-epic-material-value highlight">×{{ ultimateConversionRate.shiningCount }}</span>
            <span class="jewelry-master-epic-material-label">(拥有{{ shiningCrystalCount }})</span>
          </div>
          <div class="jewelry-master-epic-material-row total">
            <span class="jewelry-master-epic-material-label">终极宝珠:</span>
            <span class="jewelry-master-epic-material-value highlight">×{{ ultimateConversionRate.ultimateOrbCount }}</span>
            <span class="jewelry-master-epic-material-label">(拥有{{ ultimateOrbCount }})</span>
          </div>
        </div>
        <button class="jewelry-master-epic-btn craft" :disabled="!canUltimateConvert || isUltimateConverting"
          @click="handleUltimateConvert">
          {{ isUltimateConverting ? '转换中...' : '转换' }}
        </button>
        <button class="jewelry-master-epic-btn reset" @click="resetUltimateConvert">
          重置
        </button>
      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <transition name="dice-panel-fade">
        <div v-if="showUltimateWeaponPanel && ultimateWeaponItems.length > 0" ref="panelUltimateWeaponRef"
          class="jewelry-master-dice-popup jewelry-master-weapon-popup" :style="ultimateWeaponPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择史诗武器（150级）</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in ultimateWeaponItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item" :class="{ selected: selectedUltimateWeaponId === item.uniqueId }"
              @click="selectUltimateWeapon(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getWeaponDisplayName(item) }}</div>
                <div class="jewelry-master-popup-level">+{{ item.enhanceLevel || 0 }} · Lv.{{ item.level || 150 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="dice-panel-fade">
        <div v-if="showShiningCrystalPanel && shiningCrystalItems.length > 0" ref="panelShiningCrystalRef"
          class="jewelry-master-dice-popup" :style="shiningCrystalPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择闪耀晶石</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in shiningCrystalItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item"
              :class="{ selected: selectedShiningCrystalId === item.uniqueId || selectedShiningCrystalId === item.id }"
              @click="selectShiningCrystal(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">闪耀晶石</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="dice-panel-fade">
        <div v-if="showUltimateOrbPanel && ultimateOrbItems.length > 0" ref="panelUltimateOrbRef"
          class="jewelry-master-dice-popup" :style="ultimateOrbPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择终极宝珠</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in ultimateOrbItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item"
              :class="{ selected: selectedUltimateOrbId === item.uniqueId || selectedUltimateOrbId === item.id }"
              @click="selectUltimateOrb(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">终极宝珠</div>
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
 * @fileoverview 终极武器制作组件
 * @description 珠宝大师-皮奇：制作终极武器功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'

// 材料ID
const SHINING_CRYSTAL_ID = 12908
const ULTIMATE_ORB_ID = 15012

export default {
  name: 'UltimateWeaponCraft',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      ULTIMATE_WEAPON_CONFIG,
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
    const selectUltimateWeaponBoxRef = ref(null)
    const selectShiningCrystalBoxRef = ref(null)
    const selectUltimateOrbBoxRef = ref(null)
    const panelUltimateWeaponRef = ref(null)
    const panelShiningCrystalRef = ref(null)
    const panelUltimateOrbRef = ref(null)

    // 状态
    const selectedUltimateWeaponId = ref(null)
    const showUltimateWeaponPanel = ref(false)
    const selectedShiningCrystalId = ref(null)
    const showShiningCrystalPanel = ref(false)
    const selectedUltimateOrbId = ref(null)
    const showUltimateOrbPanel = ref(false)
    const showUltimateProgress = ref(false)
    const ultimateProgress = ref(0)
    const isUltimateConverting = ref(false)
    let ultimateProgressRafId = null

    // 面板位置样式（响应式）
    const ultimateWeaponPanelStyle = ref({})
    const shiningCrystalPanelStyle = ref({})
    const ultimateOrbPanelStyle = ref({})

    /**
     * 获取可转换的史诗武器列表
     * 条件：品质=史诗或独特、等级=150、强化等级>=+10
     */
    const ultimateWeaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 必须是武器
        if (item.category !== 'weapon') return false
        // 品质为史诗或独特（150级潮汐系列为unique品质）
        if (item.rarity !== 'epic' && item.rarity !== 'unique') return false
        // 等级必须=150级
        const itemLevel = item.level || ITEM_INFO[item.id]?.level || 0
        if (itemLevel !== 150) return false
        // 强化等级必须>=+10
        const enhanceLevel = item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0
        if (enhanceLevel < 10) return false
        return true
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`,
        enhanceLevel: item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0,
        level: item.level || ITEM_INFO[item.id]?.level || 150
      }))
    })

    /**
     * 获取闪耀晶石列表
     */
    const shiningCrystalItems = computed(() => {
      return itemsStore.playerBag.filter(item => Number(item.id) === SHINING_CRYSTAL_ID).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取终极宝珠列表
     */
    const ultimateOrbItems = computed(() => {
      return itemsStore.playerBag.filter(item => Number(item.id) === ULTIMATE_ORB_ID).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取选中的武器
     */
    const selectedUltimateWeapon = computed(() => {
      if (!selectedUltimateWeaponId.value) return null
      return ultimateWeaponItems.value.find(item => item.uniqueId === selectedUltimateWeaponId.value)
    })

    /**
     * 获取选中的闪耀晶石
     */
    const selectedShiningCrystal = computed(() => {
      if (!selectedShiningCrystalId.value) return null
      return shiningCrystalItems.value.find(item => item.uniqueId === selectedShiningCrystalId.value || item.id === selectedShiningCrystalId.value)
    })

    /**
     * 获取选中的终极宝珠
     */
    const selectedUltimateOrb = computed(() => {
      if (!selectedUltimateOrbId.value) return null
      return ultimateOrbItems.value.find(item => item.uniqueId === selectedUltimateOrbId.value || item.id === selectedUltimateOrbId.value)
    })

    /**
     * 获取闪耀晶石数量
     */
    const shiningCrystalCount = computed(() => {
      return itemsStore.getItemCount(SHINING_CRYSTAL_ID)
    })

    /**
     * 获取终极宝珠数量
     */
    const ultimateOrbCount = computed(() => {
      return itemsStore.getItemCount(ULTIMATE_ORB_ID)
    })

    /**
     * 查找终极武器
     * 包含特殊映射：部分武器的终极版本名称相同但类型不同
     */
    const findUltimateWeaponByName = (weaponName, subcategory) => {
      if (!weaponName) return null

      // 先尝试精确匹配（名称 + subcategory）
      for (const id in ITEM_INFO) {
        const item = ITEM_INFO[id]
        if (item.category === 'weapon' && item.rarity === 'ultimate' && item.name?.cns === weaponName && item.subcategory === subcategory) {
          return item
        }
      }

      // 如果精确匹配失败，尝试只匹配名称（处理猛兽、绝渊等类型变化的情况）
      for (const id in ITEM_INFO) {
        const item = ITEM_INFO[id]
        if (item.category === 'weapon' && item.rarity === 'ultimate' && item.name?.cns === weaponName) {
          return item
        }
      }

      return null
    }

    /**
     * 获取转换结果预览
     */
    const ultimateWeaponPreview = computed(() => {
      if (!selectedUltimateWeapon.value) return null

      const weaponName = selectedUltimateWeapon.value.name?.cns || selectedUltimateWeapon.value.name
      const subcategory = selectedUltimateWeapon.value.subcategory
      const ultimateWeapon = findUltimateWeaponByName(weaponName, subcategory)

      if (!ultimateWeapon) return null

      return {
        id: ultimateWeapon.id,
        name: ultimateWeapon.name?.cns || ultimateWeapon.name?.en || `武器#${ultimateWeapon.id}`
      }
    })

    /**
     * 获取转换概率
     * 根据背包中拥有的材料数量，取能达到的最高概率
     */
    const ultimateConversionRate = computed(() => {
      if (!selectedShiningCrystal.value || !selectedUltimateOrb.value) return null

      const crystalCount = selectedShiningCrystal.value.currentStack || 1
      const orbCount = selectedUltimateOrb.value.currentStack || 1

      // 根据拥有的材料数量，找到能达到的最高概率档位
      // 优先匹配：3+3(100%) > 2+2(70%) > 1+1(30%)
      const rates = ULTIMATE_WEAPON_CONFIG.conversionRates
      for (const rate of rates) {
        if (crystalCount >= rate.shiningCount && orbCount >= rate.ultimateOrbCount) {
          return rate
        }
      }

      // 如果材料不足，返回null
      return null
    })

    /**
     * 判断是否可以转换
     */
    const canUltimateConvert = computed(() => {
      if (!selectedUltimateWeapon.value) return false
      // 强化等级必须>=+10
      const enhanceLevel = selectedUltimateWeapon.value.enhanceLevel || 0
      if (enhanceLevel < 10) return false
      if (!selectedShiningCrystal.value) return false
      if (!selectedUltimateOrb.value) return false
      if (!ultimateWeaponPreview.value) return false
      if (!ultimateConversionRate.value) return false // 材料不足时无法转换
      if (isUltimateConverting.value) return false
      return true
    })

    /**
     * 获取品质样式和文本
     */
    const getRarityStyle = rarity => {
      const colors = { common: { color: '#fff' }, uncommon: { color: '#1eff00' }, rare: { color: '#0070dd' }, epic: { color: '#a335ee' }, unique: { color: '#ff8000' }, ultimate: { color: '#e6cc80' } }
      return colors[rarity] || { color: '#fff' }
    }

    const getRarityText = rarity => {
      const texts = { common: '普通', uncommon: '罕见', rare: '稀有', epic: '史诗', unique: '独特', ultimate: '终极' }
      return texts[rarity] || rarity
    }

    /**
     * 切换面板
     */
    const toggleUltimateWeaponPanel = async () => {
      if (ultimateWeaponItems.value.length === 0) return
      showUltimateWeaponPanel.value = !showUltimateWeaponPanel.value
      if (showUltimateWeaponPanel.value) {
        closeAllPanels()
        showUltimateWeaponPanel.value = true
        await nextTick()
        updatePanelPosition(selectUltimateWeaponBoxRef, ultimateWeaponPanelStyle)
      }
    }

    const toggleShiningCrystalPanel = async () => {
      if (shiningCrystalItems.value.length === 0) return
      showShiningCrystalPanel.value = !showShiningCrystalPanel.value
      if (showShiningCrystalPanel.value) {
        closeAllPanels()
        showShiningCrystalPanel.value = true
        await nextTick()
        updatePanelPosition(selectShiningCrystalBoxRef, shiningCrystalPanelStyle)
      }
    }

    const toggleUltimateOrbPanel = async () => {
      if (ultimateOrbItems.value.length === 0) return
      showUltimateOrbPanel.value = !showUltimateOrbPanel.value
      if (showUltimateOrbPanel.value) {
        closeAllPanels()
        showUltimateOrbPanel.value = true
        await nextTick()
        updatePanelPosition(selectUltimateOrbBoxRef, ultimateOrbPanelStyle)
      }
    }

    const closeAllPanels = () => {
      showUltimateWeaponPanel.value = false
      showShiningCrystalPanel.value = false
      showUltimateOrbPanel.value = false
    }

    /**
     * 选择物品
     */
    const selectUltimateWeapon = item => {
      selectedUltimateWeaponId.value = item.uniqueId
      showUltimateWeaponPanel.value = false
      hideItemTooltip()
    }

    const selectShiningCrystal = item => {
      selectedShiningCrystalId.value = item.uniqueId || item.id
      showShiningCrystalPanel.value = false
      hideItemTooltip()
    }

    const selectUltimateOrb = item => {
      selectedUltimateOrbId.value = item.uniqueId || item.id
      showUltimateOrbPanel.value = false
      hideItemTooltip()
    }

    /**
     * 进度动画
     */
    const startUltimateProgress = () => {
      return new Promise(resolve => {
        if (ultimateProgressRafId) cancelAnimationFrame(ultimateProgressRafId)
        showUltimateProgress.value = true
        ultimateProgress.value = 0
        const startTime = performance.now()
        const duration = 1000
        const updateProgress = currentTime => {
          const progress = Math.min(((currentTime - startTime) / duration) * 100, 100)
          ultimateProgress.value = progress
          if (progress >= 100) {
            ultimateProgressRafId = null
            resolve()
          } else {
            ultimateProgressRafId = requestAnimationFrame(updateProgress)
          }
        }
        ultimateProgressRafId = requestAnimationFrame(updateProgress)
      })
    }

    const endUltimateProgress = () => {
      if (ultimateProgressRafId) cancelAnimationFrame(ultimateProgressRafId)
      setTimeout(() => { showUltimateProgress.value = false; ultimateProgress.value = 0 }, 200)
    }

    /**
     * 同步数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理转换
     */
    const handleUltimateConvert = async () => {
      if (!canUltimateConvert.value) return

      isUltimateConverting.value = true

      try {
        await startUltimateProgress()

        const preview = ultimateWeaponPreview.value
        const rate = ultimateConversionRate.value
        const success = Math.random() * 100 < rate.rate

        // 移除材料 - 使用配置中指定的数量，而非选中物品的堆叠数量
        const crystalCount = rate.shiningCount
        const orbCount = rate.ultimateOrbCount

        itemsStore.removeItemFromBag(SHINING_CRYSTAL_ID, crystalCount)
        itemsStore.removeItemFromBag(ULTIMATE_ORB_ID, orbCount)

        if (success) {
          // 更新武器为终极品质
          const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === selectedUltimateWeaponId.value)
          if (weaponIndex !== -1) {
            const weapon = itemsStore.playerBag[weaponIndex]
            weapon.rarity = 'ultimate'
            weapon.id = preview.id
            // 移除原武器的强化数据，终极武器从头开始强化
            delete weapon.StrengthenedAttributes
            delete weapon.enhanceLevel
          }
          syncBagData()

          emit('play-sfx', 'InfUpgradeSuccess.wav')
          emit('add-battle-log', `转换成功！获得 终极 ${preview.name}`, 'success')
          emit('show-animation-message', `转换成功！获得 终极 ${preview.name}`, 'upgrade-success', `/pt/item_icon/${preview.id}.png`)
        } else {
          // 失败，武器保留
          syncBagData()
          emit('play-sfx', 'InfUpgradeFail.wav')
          emit('add-battle-log', `转换失败，消耗闪耀晶石×${crystalCount}、终极宝珠×${orbCount}`, 'error')
        }

        endUltimateProgress()
        resetUltimateConvert()
      } catch (error) {
        console.error('[UltimateWeaponCraft] 转换失败:', error)
        emit('add-battle-log', '转换失败：发生错误', 'error')
        endUltimateProgress()
      } finally {
        isUltimateConverting.value = false
      }
    }

    /**
     * 重置
     */
    const resetUltimateConvert = () => {
      selectedUltimateWeaponId.value = null
      selectedShiningCrystalId.value = null
      selectedUltimateOrbId.value = null
      closeAllPanels()
    }

    /**
     * 点击外部关闭
     */
    const handleClickOutside = e => {
      const refs = [
        { show: showUltimateWeaponPanel, box: selectUltimateWeaponBoxRef, panel: panelUltimateWeaponRef },
        { show: showShiningCrystalPanel, box: selectShiningCrystalBoxRef, panel: panelShiningCrystalRef },
        { show: showUltimateOrbPanel, box: selectUltimateOrbBoxRef, panel: panelUltimateOrbRef }
      ]
      refs.forEach(({ show, box, panel }) => {
        if (show.value) {
          const isClickInsideBox = box.value?.contains(e.target)
          const isClickInsidePanel = panel.value?.contains(e.target)
          if (!isClickInsideBox && !isClickInsidePanel) {
            show.value = false
            hideItemTooltip()
          }
        }
      })
    }

    onMounted(() => document.addEventListener('click', handleClickOutside))
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    return {
      // 引用
      selectUltimateWeaponBoxRef, selectShiningCrystalBoxRef, selectUltimateOrbBoxRef,
      panelUltimateWeaponRef, panelShiningCrystalRef, panelUltimateOrbRef,
      // 状态
      showUltimateWeaponPanel, showShiningCrystalPanel, showUltimateOrbPanel,
      showUltimateProgress, ultimateProgress, isUltimateConverting,
      selectedUltimateWeaponId, selectedShiningCrystalId, selectedUltimateOrbId,
      // 计算属性
      ultimateWeaponItems, shiningCrystalItems, ultimateOrbItems,
      selectedUltimateWeapon, selectedShiningCrystal, selectedUltimateOrb,
      shiningCrystalCount, ultimateOrbCount, ultimateWeaponPreview,
      ultimateConversionRate, canUltimateConvert,
      ultimateWeaponPanelStyle, shiningCrystalPanelStyle, ultimateOrbPanelStyle,
      // 方法
      toggleUltimateWeaponPanel, toggleShiningCrystalPanel, toggleUltimateOrbPanel,
      selectUltimateWeapon, selectShiningCrystal, selectUltimateOrb,
      handleUltimateConvert, resetUltimateConvert,
      showItemTooltip, showItemTooltipById, hideItemTooltip, moveItemTooltip,
      handleIconError, getWeaponDisplayName, getRarityStyle, getRarityText
    }
  }
}
</script>

<style scoped>
/* 复用EpicWeaponCraft的样式 */
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

.jewelry-master-epic-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.jewelry-master-epic-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-epic-title {
  font-size: 10px;
  color: #aaa;
}

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

.jewelry-master-epic-result-section { display: flex; flex-direction: column; gap: 2px; }
.jewelry-master-epic-result-title { font-size: 10px; color: #aaa; }
.jewelry-master-epic-result-display { display: flex; align-items: center; gap: 6px; padding: 4px 6px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; border: 1px solid #3a3a5a; }

.jewelry-master-epic-result-frame {
  position: relative;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #e6cc80;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.jewelry-master-epic-result-icon { width: 22px; height: 22px; object-fit: contain; }
.jewelry-master-epic-result-info { display: flex; flex-direction: column; gap: 1px; }
.jewelry-master-epic-result-name { font-size: 11px; font-weight: bold; }
.jewelry-master-epic-result-name.ultimate { color: #e6cc80; }
.jewelry-master-epic-result-chance { color: #00ff88; font-size: 10px; }

/* 操作区域 - 一行显示 */
.jewelry-master-epic-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-top: auto; padding-top: 4px; border-top: 1px solid #3a3a5a; }
.jewelry-master-epic-materials-info { display: flex; align-items: center; gap: 4px; padding: 3px 4px; background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
.jewelry-master-epic-material-row { display: flex; align-items: center; gap: 1px; font-size: 9px; }
.jewelry-master-epic-material-row.total { border-left: 1px solid #3a3a5a; padding-left: 4px; margin-left: 4px; }
.jewelry-master-epic-material-label { color: #888; }
.jewelry-master-epic-material-value { color: #fff; }
.jewelry-master-epic-material-value.highlight { color: #ffd700; font-weight: bold; }

.jewelry-master-epic-progress-section { display: flex; flex-direction: column; gap: 2px; width: 100%; }
.jewelry-master-epic-progress-bar { height: 12px; background: #2a2a4a; border-radius: 6px; overflow: hidden; }
.jewelry-master-epic-progress-fill { height: 100%; background: linear-gradient(90deg, #e6cc80 0%, #ff8000 100%); border-radius: 6px; transition: width 0.1s linear; }
.jewelry-master-epic-progress-text { font-size: 10px; color: #fff; text-align: center; }

.jewelry-master-epic-btn { padding: 4px 8px; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.jewelry-master-epic-btn.craft { background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%); color: #fff; }
.jewelry-master-epic-btn.reset { background: #3a3a4a; color: #fff; }
.jewelry-master-epic-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
