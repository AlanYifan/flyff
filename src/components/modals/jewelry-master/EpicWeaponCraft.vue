<!--
  @fileoverview 史诗武器制作组件
  @description 珠宝大师-皮奇：制作史诗武器功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">制作史诗武器</h3>

    <div class="jewelry-master-epic-content">
      <!-- 1. 武器选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">武器</div>
        <div ref="selectEpicWeaponBoxRef" class="jewelry-master-select-box"
          :class="{ active: showEpicWeaponPanel, disabled: epicWeaponItems.length === 0 }"
          @click="toggleEpicWeaponPanel">
          <template v-if="selectedEpicWeapon">
            <img :src="selectedEpicWeapon.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getWeaponDisplayName(selectedEpicWeapon) }}</span>
              <span class="jewelry-master-select-level">Lv.{{ selectedEpicWeapon.level || 1 }} · <span :style="getRarityStyle(selectedEpicWeapon.rarity)">{{ getRarityText(selectedEpicWeapon.rarity) }}</span></span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ epicWeaponItems.length === 0 ? '背包中没有符合条件的武器' : '选择合成史诗的材料武器' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showEpicWeaponPanel }">▼</span>
        </div>
      </div>

      <!-- 2. 闪亮精炼骰子选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">闪亮精炼骰子</div>
        <div ref="selectShinyDiceBoxRef" class="jewelry-master-select-box"
          :class="{ active: showShinyDicePanel, disabled: shinyDiceItems.length === 0 }"
          @click="toggleShinyDicePanel">
          <template v-if="selectedShinyDice">
            <img :src="selectedShinyDice.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <span class="jewelry-master-select-name">{{ getDiceDisplayName(selectedShinyDice) }}</span>
            <span class="jewelry-master-select-count">×{{ selectedShinyDice.currentStack || 1 }}</span>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ shinyDiceItems.length === 0 ? '背包中没有闪亮精炼骰子' : '选择闪亮精炼骰子' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showShinyDicePanel }">▼</span>
        </div>
      </div>

      <!-- 3. 宝石选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">宝石</div>
        <div ref="selectEpicGemBoxRef" class="jewelry-master-select-box"
          :class="{ active: showEpicGemPanel, disabled: epicGemItems.length === 0 }"
          @click="toggleEpicGemPanel">
          <template v-if="selectedEpicGem">
            <img :src="selectedEpicGem.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <span class="jewelry-master-select-name">{{ getGemDisplayName(selectedEpicGem) }}</span>
            <span class="jewelry-master-select-count">×{{ selectedEpicGem.currentStack || 1 }}</span>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ epicGemItems.length === 0 ? '背包中没有宝石' : '选择宝石' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showEpicGemPanel }">▼</span>
        </div>
      </div>

      <!-- 4. 合成结果预览 -->
      <div v-if="epicResultPreview" class="jewelry-master-epic-result-section">
        <div class="jewelry-master-epic-result-title">合成结果预览</div>
        <div class="jewelry-master-epic-result-display">
          <div class="jewelry-master-epic-result-frame" :class="{ 'has-marquee': epicResultPreview }">
            <img :src="`/pt/item_icon/${epicResultPreview.id}.png`" class="jewelry-master-epic-result-icon"
              @error="handleIconError" @mouseenter="showItemTooltipById($event, epicResultPreview.id)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
          </div>
          <div class="jewelry-master-epic-result-info">
            <div class="jewelry-master-epic-result-name" :style="getRarityStyle('unique')">{{ epicResultPreview.name }}</div>
            <div class="jewelry-master-epic-result-chance">成功率: {{ epicResultPreview.chance }}%</div>
          </div>
        </div>
      </div>

      <!-- 6. 史诗类型选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">史诗类型</div>
        <div v-if="selectedEpicLevelOption" ref="selectEpicLevelBoxRef"
          class="jewelry-master-select-box"
          :class="{ active: showEpicLevelPanel, disabled: isAutoEpicCrafting }"
          @click="toggleEpicLevelPanel">
          <img :src="`/pt/item_icon/${selectedEpicLevelOption.stickId}.png`"
            class="jewelry-master-select-icon" @error="handleIconError" />
          <span class="jewelry-master-select-name">{{ selectedEpicLevelOption.label }}</span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showEpicLevelPanel }">▼</span>
        </div>
      </div>

      <!-- 7. 材料数量统计 -->
      <div v-if="selectedEpicLevelRule" class="jewelry-master-epic-materials-info">
        <div class="jewelry-master-epic-material-row">
          <span class="jewelry-master-epic-material-label">武器({{ selectedEpicLevelRule.minLevel }}-{{ selectedEpicLevelRule.maxLevel }}):</span>
          <span class="jewelry-master-epic-material-value">{{ autoEpicWeaponCount }}</span>
        </div>
        <div class="jewelry-master-epic-material-row">
          <span class="jewelry-master-epic-material-label">{{ selectedEpicLevelRule.gemName }}:</span>
          <span class="jewelry-master-epic-material-value">{{ autoEpicGemCount }}</span>
        </div>
        <div class="jewelry-master-epic-material-row">
          <span class="jewelry-master-epic-material-label">骰子:</span>
          <span class="jewelry-master-epic-material-value">{{ autoEpicDiceCount }}</span>
        </div>
        <div class="jewelry-master-epic-material-row total">
          <span class="jewelry-master-epic-material-label">可合成:</span>
          <span class="jewelry-master-epic-material-value highlight">{{ maxAutoEpicCraftCount }}</span>
        </div>
      </div>

      <!-- 8. 进度条（单独一行） -->
      <div v-if="showEpicProgress" class="jewelry-master-epic-progress-section">
        <div class="jewelry-master-epic-progress-bar">
          <div class="jewelry-master-epic-progress-fill" :style="{ width: epicProgress + '%' }"></div>
        </div>
        <div class="jewelry-master-epic-progress-text">合成中... {{ Math.floor(epicProgress) }}%</div>
      </div>

      <!-- 9. 操作按钮区域（一行显示） -->
      <div class="jewelry-master-epic-actions">
        <button class="jewelry-master-epic-btn auto" :class="{ active: isAutoEpicCrafting }"
          :disabled="!isAutoEpicCrafting && !canAutoEpicCraft" @click="handleAutoEpicCraft">
          {{ isAutoEpicCrafting ? '停止' : '自动合成' }}
        </button>
        <button class="jewelry-master-epic-btn craft"
          :disabled="!canEpicCraft || isEpicCrafting || isAutoEpicCrafting" @click="handleEpicCraft">
          {{ isEpicCrafting ? '合成中...' : '合成' }}
        </button>
        <button class="jewelry-master-epic-btn reset" @click="resetEpicCraft" :disabled="isAutoEpicCrafting">
          重置
        </button>
      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <!-- 材料武器选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="showEpicWeaponPanel && epicWeaponItems.length > 0" ref="panelEpicWeaponRef"
          class="jewelry-master-dice-popup jewelry-master-weapon-popup" :style="epicWeaponPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择武器 (60-160级 普通/罕见)</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in epicWeaponItems" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selectedEpicWeaponId === item.uniqueId }" @click.stop="selectEpicWeapon(item)"
              @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip"
              @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getWeaponDisplayName(item) }}</div>
                <div class="jewelry-master-popup-level">Lv.{{ item.level || 1 }} · <span :style="getRarityStyle(item.rarity)">{{ getRarityText(item.rarity) }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 闪亮精炼骰子选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="showShinyDicePanel && shinyDiceItems.length > 0" ref="panelShinyDiceRef"
          class="jewelry-master-dice-popup" :style="shinyDicePanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择闪亮精炼骰子</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in shinyDiceItems" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selectedShinyDiceId === item.id }" @click.stop="selectShinyDice(item)"
              @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip"
              @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getDiceDisplayName(item) }}</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 宝石选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="showEpicGemPanel && epicGemItems.length > 0" ref="panelEpicGemRef"
          class="jewelry-master-dice-popup" :style="epicGemPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择宝石</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in epicGemItems" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selectedEpicGemId === item.id }" @click.stop="selectEpicGem(item)"
              @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip"
              @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getGemDisplayName(item) }}</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 史诗类型选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="showEpicLevelPanel" class="jewelry-master-dice-popup epic-level-popup"
          :style="epicLevelPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择史诗类型</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="option in EPIC_LEVEL_OPTIONS" :key="option.value"
              class="jewelry-master-popup-item epic-level-item"
              :class="{ selected: selectedEpicLevel === option.value }"
              @click="selectedEpicLevel = option.value; showEpicLevelPanel = false">
              <img :src="`/pt/item_icon/${option.stickId}.png`" class="jewelry-master-popup-icon"
                @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ option.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 自动合成确认对话框 -->
    <transition name="confirm-fade">
      <div v-if="showAutoEpicCraftConfirm" class="jewelry-master-confirm-overlay">
        <div class="jewelry-master-confirm-dialog">
          <div class="jewelry-master-confirm-title">确认自动合成</div>
          <div class="jewelry-master-confirm-content">
            <p>即将自动合成 <strong>{{ selectedEpicLevelRule?.seriesName }}系列</strong> 史诗武器</p>
            <p>共 <strong>{{ maxAutoEpicCraftCount }}</strong> 次合成机会</p>
            <p class="jewelry-master-confirm-warning">此操作不可撤销，是否继续？</p>
          </div>
          <div class="jewelry-master-confirm-actions">
            <button class="jewelry-master-confirm-btn cancel" @click="cancelAutoEpicCraft">取消</button>
            <button class="jewelry-master-confirm-btn confirm" @click="confirmAutoEpicCraft">确认合成</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
/**
 * @fileoverview 史诗武器制作组件
 * @description 珠宝大师-皮奇：制作史诗武器功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'

// 闪亮骰子ID列表
const SHINY_DICE_IDS = [3865, 8292, 4575]

// 宝石ID列表
const GEM_IDS = [677, 7016, 768, 9940, 6934, 10597, 17588]

export default {
  name: 'EpicWeaponCraft',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      EPIC_WEAPON_CONFIG,
      EPIC_LEVEL_OPTIONS,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      getDiceDisplayName,
      getGemDisplayName,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const selectEpicWeaponBoxRef = ref(null)
    const selectShinyDiceBoxRef = ref(null)
    const selectEpicGemBoxRef = ref(null)
    const selectEpicLevelBoxRef = ref(null)
    const panelEpicWeaponRef = ref(null)
    const panelShinyDiceRef = ref(null)
    const panelEpicGemRef = ref(null)

    // 状态
    const selectedEpicWeaponId = ref(null)
    const showEpicWeaponPanel = ref(false)
    const selectedShinyDiceId = ref(null)
    const showShinyDicePanel = ref(false)
    const selectedEpicGemId = ref(null)
    const showEpicGemPanel = ref(false)
    const selectedEpicLevel = ref('60')
    const showEpicLevelPanel = ref(false)
    const showEpicProgress = ref(false)
    const epicProgress = ref(0)
    const isEpicCrafting = ref(false)
    const isAutoEpicCrafting = ref(false)
    const showAutoEpicCraftConfirm = ref(false)
    const shouldStopAutoEpicCraft = ref(false)
    let epicProgressRafId = null

    // 面板位置样式（响应式）- 设置默认值以防位置计算失败
    const epicWeaponPanelStyle = ref({ position: 'fixed', top: '100px', left: '100px', zIndex: 9999 })
    const shinyDicePanelStyle = ref({ position: 'fixed', top: '100px', left: '100px', zIndex: 9999 })
    const epicGemPanelStyle = ref({ position: 'fixed', top: '100px', left: '100px', zIndex: 9999 })
    const epicLevelPanelStyle = ref({ position: 'fixed', top: '100px', left: '100px', zIndex: 9999 })

    /**
     * 获取可合成史诗的武器列表
     */
    const epicWeaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        if (item.category !== 'weapon') return false
        if (!EPIC_WEAPON_CONFIG.allowedRarities.includes(item.rarity)) return false
        if (!EPIC_WEAPON_CONFIG.weaponTypes.includes(item.subcategory)) return false
        const level = item.level || 1
        if (level < 60 || level > 160) return false
        return true
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取闪亮骰子列表
     */
    const shinyDiceItems = computed(() => {
      return itemsStore.playerBag.filter(item =>
        SHINY_DICE_IDS.includes(Number(item.id))
      ).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取宝石列表
     */
    const epicGemItems = computed(() => {
      return itemsStore.playerBag.filter(item =>
        GEM_IDS.includes(Number(item.id))
      ).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取选中的武器
     */
    const selectedEpicWeapon = computed(() => {
      if (!selectedEpicWeaponId.value) return null
      return epicWeaponItems.value.find(item => item.uniqueId === selectedEpicWeaponId.value)
    })

    /**
     * 获取选中的闪亮骰子
     */
    const selectedShinyDice = computed(() => {
      if (!selectedShinyDiceId.value) return null
      // 闪亮骰子是可叠加物品(stack>1)，使用ID查找
      return shinyDiceItems.value.find(item => item.id === selectedShinyDiceId.value)
    })

    /**
     * 获取选中的宝石
     */
    const selectedEpicGem = computed(() => {
      if (!selectedEpicGemId.value) return null
      // 宝石是可叠加物品(stack>1)，使用ID查找
      return epicGemItems.value.find(item => item.id === selectedEpicGemId.value)
    })

    /**
     * 获取当前选中的史诗等级选项
     */
    const selectedEpicLevelOption = computed(() => {
      return EPIC_LEVEL_OPTIONS.find(opt => opt.value === selectedEpicLevel.value) || EPIC_LEVEL_OPTIONS[0]
    })

    /**
     * 获取当前选中的史诗等级规则
     */
    const selectedEpicLevelRule = computed(() => {
      return EPIC_WEAPON_CONFIG.craftRules.find(rule => String(rule.epicLevel) === selectedEpicLevel.value)
    })

    /**
     * 获取合成结果预览
     */
    const epicResultPreview = computed(() => {
      if (!selectedEpicWeapon.value || !selectedEpicGem.value || !selectedShinyDice.value) return null
      const rule = selectedEpicLevelRule.value
      if (!rule) return null

      const weaponType = resolveEpicWeaponTypeKey(selectedEpicWeapon.value)
      const epicWeaponId = rule.epicWeapons[weaponType]
      if (!epicWeaponId) return null

      // 计算成功率加成
      let baseChance = rule.chance
      const diceId = Number(selectedShinyDice.value.id)
      if (diceId === 3865) baseChance += baseChance * 0.1 // 4点骰子 +10%
      else if (diceId === 8292) baseChance += baseChance * 0.2 // 6点骰子 +20%
      else if (diceId === 4575) baseChance += baseChance * 0.3 // 12点骰子 +30%

      return {
        id: epicWeaponId,
        name: `${rule.seriesName}${getWeaponTypeText(weaponType)}`,
        chance: baseChance.toFixed(1)
      }
    })

    /**
     * 解析武器在 epicWeapons 映射中对应的 key
     * 用途/业务意图：ITEM_INFO 中双手斧/双手剑的 subcategory 与单手版本相同（均为 'axe'/'sword'），
     * 仅通过 twoHanded: true 区分。此函数将 twoHanded 的 axe/sword 映射为 'bigaxe'/'bigsword'，
     * 确保合成结果匹配正确的史诗武器 ID。
     * @param {Object} item - 背包武器物品
     * @returns {string} epicWeapons 映射的 key
     */
    const resolveEpicWeaponTypeKey = item => {
      const subcategory = item?.subcategory || ''
      // 优先使用物品自身的 twoHanded 字段；若不存在（旧存档物品），回退到静态配置查找
      const isTwoHanded = item?.twoHanded === true ||
        itemsStore.getItemConfig(Number(item?.id))?.twoHanded === true
      if (isTwoHanded) {
        if (subcategory === 'axe') return 'bigaxe'
        if (subcategory === 'sword') return 'bigsword'
      }
      return subcategory
    }

    /**
     * 获取武器类型文本
     */
    const getWeaponTypeText = type => {
      const texts = {
        sword: '单手剑',
        axe: '单手斧',
        bigsword: '双手剑',
        bigaxe: '双手斧',
        stick: '魔棒',
        staff: '法杖',
        wand: '魔杖',
        yoyo: '飞轮',
        bow: '弓',
        knuckle: '拳套'
      }
      return texts[type] || type
    }

    /**
     * 获取自动合成的武器数量
     */
    const autoEpicWeaponCount = computed(() => {
      const rule = selectedEpicLevelRule.value
      if (!rule) return 0
      return epicWeaponItems.value.filter(item => {
        const level = item.level || 1
        return level >= rule.minLevel && level <= rule.maxLevel
      }).length
    })

    /**
     * 获取自动合成的宝石数量
     */
    const autoEpicGemCount = computed(() => {
      const rule = selectedEpicLevelRule.value
      if (!rule) return 0
      const gem = epicGemItems.value.find(item => Number(item.id) === rule.gemId)
      return gem ? (gem.currentStack || 1) : 0
    })

    /**
     * 获取自动合成的骰子数量
     */
    const autoEpicDiceCount = computed(() => {
      return shinyDiceItems.value.reduce((sum, item) => sum + (item.currentStack || 1), 0)
    })

    /**
     * 获取最大自动合成次数
     */
    const maxAutoEpicCraftCount = computed(() => {
      return Math.min(autoEpicWeaponCount.value, autoEpicGemCount.value, autoEpicDiceCount.value)
    })

    /**
     * 判断是否可以合成
     * 验证规则：
     * 1. 必须选择武器、骰子、宝石
     * 2. 武器等级必须在规则的等级范围内
     * 3. 宝石ID必须与规则的gemId匹配
     */
    const canEpicCraft = computed(() => {
      if (!selectedEpicWeapon.value || !selectedShinyDice.value || !selectedEpicGem.value) return false
      if (isEpicCrafting.value) return false

      const rule = selectedEpicLevelRule.value
      if (!rule) return false

      // 验证武器等级是否在规则范围内
      const weaponLevel = selectedEpicWeapon.value.level || 1
      if (weaponLevel < rule.minLevel || weaponLevel > rule.maxLevel) return false

      // 验证宝石ID是否匹配规则
      if (Number(selectedEpicGem.value.id) !== rule.gemId) return false

      return true
    })

    /**
     * 判断是否可以自动合成
     */
    const canAutoEpicCraft = computed(() => {
      return maxAutoEpicCraftCount.value > 0 && !isAutoEpicCrafting.value
    })

    /**
     * 获取品质样式
     */
    const getRarityStyle = rarity => {
      const colors = {
        common: { color: '#fff' },
        uncommon: { color: '#1eff00' },
        rare: { color: '#0070dd' },
        epic: { color: '#a335ee' },
        unique: { color: '#ff8000' },
        ultimate: { color: '#e6cc80' }
      }
      return colors[rarity] || { color: '#fff' }
    }

    /**
     * 获取品质文本
     */
    const getRarityText = rarity => {
      const texts = {
        common: '普通',
        uncommon: '罕见',
        rare: '稀有',
        epic: '史诗',
        unique: '独特',
        ultimate: '终极'
      }
      return texts[rarity] || rarity
    }

    /**
     * 切换面板
     */
    const toggleEpicWeaponPanel = async () => {
      if (epicWeaponItems.value.length === 0) return
      if (showEpicWeaponPanel.value) {
        showEpicWeaponPanel.value = false
        hideItemTooltip()
      } else {
        showEpicWeaponPanel.value = true
        showShinyDicePanel.value = false
        showEpicGemPanel.value = false
        showEpicLevelPanel.value = false
        await nextTick()
        updatePanelPosition(selectEpicWeaponBoxRef, epicWeaponPanelStyle)
      }
    }

    const toggleShinyDicePanel = async () => {
      if (shinyDiceItems.value.length === 0) return
      if (showShinyDicePanel.value) {
        showShinyDicePanel.value = false
        hideItemTooltip()
      } else {
        showEpicWeaponPanel.value = false
        showShinyDicePanel.value = true
        showEpicGemPanel.value = false
        showEpicLevelPanel.value = false
        await nextTick()
        updatePanelPosition(selectShinyDiceBoxRef, shinyDicePanelStyle)
      }
    }

    const toggleEpicGemPanel = async () => {
      if (epicGemItems.value.length === 0) return
      if (showEpicGemPanel.value) {
        showEpicGemPanel.value = false
        hideItemTooltip()
      } else {
        showEpicWeaponPanel.value = false
        showShinyDicePanel.value = false
        showEpicGemPanel.value = true
        showEpicLevelPanel.value = false
        await nextTick()
        updatePanelPosition(selectEpicGemBoxRef, epicGemPanelStyle)
      }
    }

    const closeAllPanels = () => {
      showEpicWeaponPanel.value = false
      showShinyDicePanel.value = false
      showEpicGemPanel.value = false
      showEpicLevelPanel.value = false
    }

    /**
     * 切换史诗类型选择面板
     */
    const toggleEpicLevelPanel = async () => {
      if (isAutoEpicCrafting.value) return
      if (showEpicLevelPanel.value) {
        showEpicLevelPanel.value = false
      } else {
        showEpicWeaponPanel.value = false
        showShinyDicePanel.value = false
        showEpicGemPanel.value = false
        showEpicLevelPanel.value = true
        await nextTick()
        updatePanelPosition(selectEpicLevelBoxRef, epicLevelPanelStyle)
      }
    }

    /**
     * 选择物品
     */
    const selectEpicWeapon = item => {
      selectedEpicWeaponId.value = item.uniqueId
      showEpicWeaponPanel.value = false
      hideItemTooltip()
    }

    const selectShinyDice = item => {
      // 闪亮骰子是可叠加物品(stack>1)，使用ID作为标识
      selectedShinyDiceId.value = item.id
      showShinyDicePanel.value = false
      hideItemTooltip()
    }

    const selectEpicGem = item => {
      // 宝石是可叠加物品(stack>1)，使用ID作为标识
      selectedEpicGemId.value = item.id
      showEpicGemPanel.value = false
      hideItemTooltip()
    }

    /**
     * 开始进度动画
     */
    const startEpicProgress = () => {
      return new Promise(resolve => {
        if (epicProgressRafId) {
          cancelAnimationFrame(epicProgressRafId)
          epicProgressRafId = null
        }
        showEpicProgress.value = true
        epicProgress.value = 0

        const startTime = performance.now()
        const duration = 1000

        const updateProgress = currentTime => {
          const elapsed = currentTime - startTime
          const progress = Math.min((elapsed / duration) * 100, 100)
          epicProgress.value = progress

          if (progress >= 100) {
            epicProgressRafId = null
            resolve()
          } else {
            epicProgressRafId = requestAnimationFrame(updateProgress)
          }
        }

        epicProgressRafId = requestAnimationFrame(updateProgress)
      })
    }

    /**
     * 结束进度
     */
    const endEpicProgress = () => {
      if (epicProgressRafId) {
        cancelAnimationFrame(epicProgressRafId)
        epicProgressRafId = null
      }
      setTimeout(() => {
        showEpicProgress.value = false
        epicProgress.value = 0
      }, 200)
    }

    /**
     * 同步背包数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理合成
     */
    const handleEpicCraft = async () => {
      if (!canEpicCraft.value) return

      isEpicCrafting.value = true

      try {
        await startEpicProgress()

        const preview = epicResultPreview.value
        const chance = parseFloat(preview.chance)
        const success = Math.random() * 100 < chance

        // 移除材料
        const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === selectedEpicWeaponId.value)
        if (weaponIndex !== -1) itemsStore.playerBag.splice(weaponIndex, 1)

        // 骰子是可叠加物品(stack>1)，使用ID查找
        const diceIndex = itemsStore.playerBag.findIndex(item => item.id === selectedShinyDiceId.value)
        if (diceIndex !== -1) {
          const dice = itemsStore.playerBag[diceIndex]
          if (dice.currentStack > 1) dice.currentStack--
          else itemsStore.playerBag.splice(diceIndex, 1)
        }

        // 宝石是可叠加物品(stack>1)，使用ID查找
        const gemIndex = itemsStore.playerBag.findIndex(item => item.id === selectedEpicGemId.value)
        if (gemIndex !== -1) {
          const gem = itemsStore.playerBag[gemIndex]
          if (gem.currentStack > 1) gem.currentStack--
          else itemsStore.playerBag.splice(gemIndex, 1)
        }

        if (success) {
          // 添加史诗武器
          itemsStore.addItemToBag(preview.id, 1)
          syncBagData()

          emit('play-sfx', 'InfUpgradeSuccess.wav')
          emit('add-battle-log', `合成成功！获得 ${preview.name}`, 'success')
          emit('show-animation-message', `合成成功！获得 ${preview.name}`, 'upgrade-success', `/pt/item_icon/${preview.id}.png`)
        } else {
          syncBagData()
          emit('play-sfx', 'InfUpgradeFail.wav')
          emit('add-battle-log', '合成失败，材料已消耗', 'error')
        }

        endEpicProgress()
        resetEpicCraft()
      } catch (error) {
        console.error('[EpicWeaponCraft] 合成失败:', error)
        emit('add-battle-log', '合成失败：发生错误', 'error')
        endEpicProgress()
      } finally {
        isEpicCrafting.value = false
      }
    }

    /**
     * 处理自动合成
     */
    const handleAutoEpicCraft = () => {
      if (isAutoEpicCrafting.value) {
        shouldStopAutoEpicCraft.value = true
        return
      }
      showAutoEpicCraftConfirm.value = true
    }

    const cancelAutoEpicCraft = () => {
      showAutoEpicCraftConfirm.value = false
    }

    const confirmAutoEpicCraft = async () => {
      showAutoEpicCraftConfirm.value = false
      isAutoEpicCrafting.value = true
      shouldStopAutoEpicCraft.value = false

      const rule = selectedEpicLevelRule.value
      if (!rule) {
        isAutoEpicCrafting.value = false
        return
      }

      let successCount = 0
      let failCount = 0

      try {
        while (!shouldStopAutoEpicCraft.value && maxAutoEpicCraftCount.value > 0) {
          await startEpicProgress()

          // 查找符合条件的武器
          const weaponIndex = itemsStore.playerBag.findIndex(item => {
            if (item.category !== 'weapon') return false
            if (!EPIC_WEAPON_CONFIG.allowedRarities.includes(item.rarity)) return false
            const level = item.level || 1
            return level >= rule.minLevel && level <= rule.maxLevel
          })

          if (weaponIndex === -1) break

          const weapon = itemsStore.playerBag[weaponIndex]
          const weaponType = resolveEpicWeaponTypeKey(weapon)
          const epicWeaponId = rule.epicWeapons[weaponType]
          if (!epicWeaponId) {
            itemsStore.playerBag.splice(weaponIndex, 1)
            continue
          }

          // 计算成功率
          let baseChance = rule.chance
          // 查找骰子并计算加成
          const diceIndex = itemsStore.playerBag.findIndex(item => SHINY_DICE_IDS.includes(Number(item.id)))
          if (diceIndex !== -1) {
            const diceId = Number(itemsStore.playerBag[diceIndex].id)
            if (diceId === 3865) baseChance += baseChance * 0.1
            else if (diceId === 8292) baseChance += baseChance * 0.2
            else if (diceId === 4575) baseChance += baseChance * 0.3
          }

          const chance = baseChance
          const success = Math.random() * 100 < chance

          // 移除武器
          itemsStore.playerBag.splice(weaponIndex, 1)

          // 移除宝石
          const gemIndex = itemsStore.playerBag.findIndex(item => Number(item.id) === rule.gemId)
          if (gemIndex !== -1) {
            const gem = itemsStore.playerBag[gemIndex]
            if (gem.currentStack > 1) gem.currentStack--
            else itemsStore.playerBag.splice(gemIndex, 1)
          }

          // 移除骰子
          const diceIdx = itemsStore.playerBag.findIndex(item => SHINY_DICE_IDS.includes(Number(item.id)))
          if (diceIdx !== -1) {
            const dice = itemsStore.playerBag[diceIdx]
            if (dice.currentStack > 1) dice.currentStack--
            else itemsStore.playerBag.splice(diceIdx, 1)
          }

          if (success) {
            itemsStore.addItemToBag(epicWeaponId, 1)
            successCount++
            const epicName = `${rule.seriesName}${getWeaponTypeText(weaponType)}`
            emit('play-sfx', 'InfUpgradeSuccess.wav')
            emit('add-battle-log', `合成成功！获得 ${epicName}`, 'success')
            emit('show-animation-message', `获得 ${epicName}`, 'upgrade-success', `/pt/item_icon/${epicWeaponId}.png`)
          } else {
            failCount++
            emit('play-sfx', 'InfUpgradeFail.wav')
            emit('add-battle-log', '合成失败，材料已消耗', 'error')
            emit('show-animation-message', '合成失败', 'drop', '')
          }

          endEpicProgress()

          // 添加短暂延迟
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        syncBagData()
        if (successCount > 0 || failCount > 0) {
          emit('add-battle-log', `自动合成完成！成功${successCount}次，失败${failCount}次`, 'success')
        }
      } catch (error) {
        console.error('[EpicWeaponCraft] 自动合成失败:', error)
        emit('add-battle-log', '自动合成失败', 'error')
      } finally {
        isAutoEpicCrafting.value = false
        shouldStopAutoEpicCraft.value = false
      }
    }

    /**
     * 重置
     */
    const resetEpicCraft = () => {
      selectedEpicWeaponId.value = null
      selectedShinyDiceId.value = null
      selectedEpicGemId.value = null
      closeAllPanels()
    }

    /**
     * 点击外部关闭
     */
    const handleClickOutside = e => {
      // 武器面板
      if (showEpicWeaponPanel.value) {
        const isClickInsideBox = selectEpicWeaponBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelEpicWeaponRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showEpicWeaponPanel.value = false
          hideItemTooltip()
        }
      }
      // 骰子面板
      if (showShinyDicePanel.value) {
        const isClickInsideBox = selectShinyDiceBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelShinyDiceRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showShinyDicePanel.value = false
          hideItemTooltip()
        }
      }
      // 宝石面板
      if (showEpicGemPanel.value) {
        const isClickInsideBox = selectEpicGemBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelEpicGemRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showEpicGemPanel.value = false
          hideItemTooltip()
        }
      }
      // 史诗类型面板
      if (showEpicLevelPanel.value) {
        const isClickInsideBox = selectEpicLevelBoxRef.value?.contains(e.target)
        const panelEpicLevelRef = document.querySelector('.epic-level-popup')
        const isClickInsidePanel = panelEpicLevelRef?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showEpicLevelPanel.value = false
        }
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      // 引用
      selectEpicWeaponBoxRef,
      selectShinyDiceBoxRef,
      selectEpicGemBoxRef,
      selectEpicLevelBoxRef,
      panelEpicWeaponRef,
      panelShinyDiceRef,
      panelEpicGemRef,

      // 状态
      showEpicWeaponPanel,
      showShinyDicePanel,
      showEpicGemPanel,
      showEpicLevelPanel,
      selectedEpicWeaponId,
      selectedShinyDiceId,
      selectedEpicGemId,
      selectedEpicLevel,
      showEpicProgress,
      epicProgress,
      isEpicCrafting,
      isAutoEpicCrafting,
      showAutoEpicCraftConfirm,

      // 计算属性
      epicWeaponItems,
      shinyDiceItems,
      epicGemItems,
      selectedEpicWeapon,
      selectedShinyDice,
      selectedEpicGem,
      selectedEpicLevelOption,
      selectedEpicLevelRule,
      epicResultPreview,
      autoEpicWeaponCount,
      autoEpicGemCount,
      autoEpicDiceCount,
      maxAutoEpicCraftCount,
      canEpicCraft,
      canAutoEpicCraft,
      epicWeaponPanelStyle,
      shinyDicePanelStyle,
      epicGemPanelStyle,
      epicLevelPanelStyle,
      EPIC_LEVEL_OPTIONS,

      // 方法
      toggleEpicWeaponPanel,
      toggleShinyDicePanel,
      toggleEpicGemPanel,
      toggleEpicLevelPanel,
      selectEpicWeapon,
      selectShinyDice,
      selectEpicGem,
      handleEpicCraft,
      handleAutoEpicCraft,
      cancelAutoEpicCraft,
      confirmAutoEpicCraft,
      resetEpicCraft,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      getDiceDisplayName,
      getGemDisplayName,
      getRarityStyle,
      getRarityText
    }
  }
}
</script>

<style scoped>
/* 基础面板样式 */
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
}

.jewelry-master-epic-title {
  font-size: 10px;
  color: #aaa;
}

/* 选择框 */
.jewelry-master-select-box {
  display: flex;
  align-items: center;
  padding: 2px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 22px;
}

.jewelry-master-select-box:hover:not(.disabled) {
  border-color: #5a5a8a;
}

.jewelry-master-select-box.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.jewelry-master-select-box.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jewelry-master-select-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  margin-right: 4px;
}

.jewelry-master-select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.jewelry-master-select-name {
  color: #fff;
  font-size: 11px;
}

.jewelry-master-select-level {
  color: #888;
  font-size: 9px;
}

.jewelry-master-select-count {
  color: #00ff88;
  font-size: 10px;
  margin-right: 4px;
}

.jewelry-master-select-placeholder {
  flex: 1;
  color: #666;
  font-size: 10px;
}

.jewelry-master-select-arrow {
  color: #888;
  font-size: 8px;
  transition: transform 0.2s;
}

.jewelry-master-select-arrow.rotated {
  transform: rotate(180deg);
}

/* 结果预览 */
.jewelry-master-epic-result-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-epic-result-title {
  font-size: 10px;
  color: #aaa;
}

.jewelry-master-epic-result-display {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid #3a3a5a;
}

.jewelry-master-epic-result-frame {
  position: relative;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #a335ee;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.jewelry-master-epic-result-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.jewelry-master-epic-result-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.jewelry-master-epic-result-name {
  font-size: 11px;
  font-weight: bold;
}

.jewelry-master-epic-result-chance {
  color: #00ff88;
  font-size: 10px;
}

/* 操作区域 - 一行显示 */
.jewelry-master-epic-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid #3a3a5a;
}

/* 材料统计 - 一行显示 */
.jewelry-master-epic-materials-info {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.jewelry-master-epic-material-row {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 9px;
}

.jewelry-master-epic-material-row.total {
  border-left: 1px solid #3a3a5a;
  padding-left: 4px;
  margin-left: 4px;
}

.jewelry-master-epic-material-label {
  color: #888;
}

.jewelry-master-epic-material-value {
  color: #fff;
}

.jewelry-master-epic-material-value.highlight {
  color: #ffd700;
  font-weight: bold;
}

/* 进度条 */
.jewelry-master-epic-progress-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-epic-progress-bar {
  height: 12px;
  background: #2a2a4a;
  border-radius: 6px;
  overflow: hidden;
}

.jewelry-master-epic-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a335ee 0%, #ff8000 100%);
  border-radius: 6px;
  transition: width 0.1s linear;
}

.jewelry-master-epic-progress-text {
  font-size: 10px;
  color: #fff;
  text-align: center;
}

/* 按钮 */
.jewelry-master-epic-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.jewelry-master-epic-btn.auto {
  background: linear-gradient(135deg, #4a6a9a 0%, #5a8aba 100%);
  color: #fff;
}

.jewelry-master-epic-btn.auto.active {
  background: linear-gradient(135deg, #aa5a5a 0%, #ca7a7a 100%);
}

.jewelry-master-epic-btn.craft {
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
}

.jewelry-master-epic-btn.reset {
  background: #3a3a4a;
  color: #fff;
}

.jewelry-master-epic-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 弹出面板 - 使用 fixed 定位浮在上层 */
.jewelry-master-dice-popup {
  position: fixed;
  width: 240px;
  max-height: 260px;
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 9999;
}

.jewelry-master-popup-header {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #3a3a5a;
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
}

.jewelry-master-popup-items {
  max-height: 220px;
  overflow-y: auto;
}

.jewelry-master-popup-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(60, 60, 90, 0.3);
}

.jewelry-master-popup-item:hover {
  background: rgba(255, 215, 0, 0.1);
}

.jewelry-master-popup-item.selected {
  background: rgba(255, 215, 0, 0.2);
  border-left: 3px solid #ffd700;
}

.jewelry-master-popup-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  margin-right: 4px;
}

.jewelry-master-popup-info {
  flex: 1;
}

.jewelry-master-popup-name {
  color: #fff;
  font-size: 11px;
}

.jewelry-master-popup-level,
.jewelry-master-popup-count {
  color: #888;
  font-size: 9px;
  margin-top: 1px;
}

/* 确认对话框 */
.jewelry-master-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.jewelry-master-confirm-dialog {
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  padding: 8px;
  max-width: 240px;
}

.jewelry-master-confirm-title {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 6px;
  text-align: center;
}

.jewelry-master-confirm-content {
  font-size: 10px;
  color: #ccc;
  line-height: 1.4;
  margin-bottom: 8px;
}

.jewelry-master-confirm-warning {
  color: #ff6666 !important;
  font-size: 10px !important;
}

.jewelry-master-confirm-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.jewelry-master-confirm-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
}

.jewelry-master-confirm-btn.cancel {
  background: #3a3a4a;
  color: #fff;
}

.jewelry-master-confirm-btn.confirm {
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
}

/* 过渡动画 */
.dice-panel-fade-enter-active,
.dice-panel-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dice-panel-fade-enter-from,
.dice-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
