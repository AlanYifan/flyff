/**
 * @fileoverview 珠宝大师共享组合式函数
 * @description 提供珠宝大师各功能面板共享的状态、配置和方法
 * @author FLYFF Team
 * @version 1.1.0
 * @created 2026-03-11
 * @updated 2026-03-14 - 修复tooltip状态共享问题，使用全局状态
 */
import { ref, computed } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store/index'
import { storageService } from '@/services/StorageService'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'

// 全局共享的 Tooltip 状态（模块级别变量，确保所有组件共享同一状态）
const globalTooltipVisible = ref(false)
const globalTooltipContent = ref(null)
const globalTooltipStyle = ref({})

/**
 * 珠宝大师共享组合式函数
 * @returns {Object} 共享的状态、配置和方法
 */
export function useJewelryMaster() {
  // Store
  const itemsStore = useItemsStore()
  const gameStore = useGameStore()

  // 骰子ID配置
  const DICE_CONFIG = {
    // 4/6/12点骰子ID
    dice4612Ids: [6844, 1250, 6672],
    // 8/10点骰子ID
    dice810Ids: [7867, 9344],
    // 合成配方：{ dice4612Id: { dice810Id: resultId } }
    recipes: {
      6844: { 7867: 3865 }, // 4点骰子 + 8点骰子 = 闪亮骰子(4/8)
      1250: { 7867: 8292 }, // 6点骰子 + 8点骰子 = 闪亮骰子(6/8)
      6672: { 9344: 4575 } // 12点骰子 + 10点骰子 = 闪亮骰子(12/10)
    },
    // 合成所需数量
    requiredCount: 5
  }

  // 宝石提取配置
  const GEM_CONFIG = {
    // 宝石提取规则：等级范围 -> 宝石ID和概率
    extractRules: [
      { minLevel: 60, maxLevel: 70, gemId: 677, chance: 10, name: '黄宝石' },
      { minLevel: 71, maxLevel: 85, gemId: 7016, chance: 9, name: '红宝石' },
      { minLevel: 86, maxLevel: 100, gemId: 768, chance: 8, name: '蓝宝石' },
      { minLevel: 101, maxLevel: 119, gemId: 9940, chance: 7, name: '绿宝石' },
      { minLevel: 120, maxLevel: 140, gemId: 6934, chance: 6, name: '钻石' },
      { minLevel: 141, maxLevel: 160, gemId: 10597, chance: 5, name: '紫水晶' }
    ],
    // 允许分解的武器品质
    allowedRarities: ['common', 'uncommon'],
    // 允许的武器子类型列表
    weaponTypes: ['sword', 'axe', 'bigsword', 'bigaxe', 'stick', 'staff', 'wand', 'yoyo', 'bow', 'knuckle']
  }

  // 史诗武器合成配置
  const EPIC_WEAPON_CONFIG = {
    // 史诗合成规则：等级范围 -> 宝石ID、概率、史诗武器列表
    craftRules: [
      {
        minLevel: 60,
        maxLevel: 70,
        gemId: 677,
        gemName: '黄宝石',
        chance: 7,
        epicLevel: 60,
        seriesName: '卡第恩',
        epicWeapons: {
          sword: 1800,
          axe: 2996,
          bigsword: 1678,
          bigaxe: 3857,
          stick: 641,
          staff: 9638,
          wand: 8516,
          yoyo: 57,
          bow: 4123,
          knuckle: 7826
        }
      },
      {
        minLevel: 71,
        maxLevel: 85,
        gemId: 7016,
        gemName: '红宝石',
        chance: 6,
        epicLevel: 75,
        seriesName: '悠久',
        epicWeapons: {
          sword: 49,
          axe: 4596,
          bigsword: 7740,
          bigaxe: 3675,
          stick: 2482,
          staff: 8448,
          wand: 2280,
          yoyo: 1960,
          bow: 501,
          knuckle: 3715
        }
      },
      {
        minLevel: 86,
        maxLevel: 100,
        gemId: 768,
        gemName: '蓝宝石',
        chance: 5,
        epicLevel: 90,
        seriesName: '天使',
        epicWeapons: {
          sword: 7277,
          axe: 3135,
          bigsword: 9392,
          bigaxe: 4754,
          stick: 312,
          staff: 6684,
          wand: 8213,
          yoyo: 2818,
          bow: 539,
          knuckle: 111
        }
      },
      {
        minLevel: 101,
        maxLevel: 119,
        gemId: 9940,
        gemName: '绿宝石',
        chance: 4,
        epicLevel: 105,
        seriesName: '传奇',
        epicWeapons: {
          sword: 1387,
          axe: 8767,
          bigsword: 1867,
          bigaxe: 3674,
          stick: 6315,
          staff: 153,
          wand: 5980,
          yoyo: 8901,
          bow: 3824,
          knuckle: 1626
        }
      },
      {
        minLevel: 120,
        maxLevel: 140,
        gemId: 6934,
        gemName: '钻石',
        chance: 3,
        epicLevel: 120,
        seriesName: '血腥',
        epicWeapons: {
          sword: 6466,
          axe: 2738,
          bigsword: 7136,
          bigaxe: 2180,
          stick: 8885,
          staff: 8992,
          wand: 6647,
          yoyo: 5917,
          bow: 2076,
          knuckle: 7522
        }
      },
      {
        minLevel: 141,
        maxLevel: 160,
        gemId: 10597,
        gemName: '紫水晶',
        chance: 1,
        epicLevel: 150,
        seriesName: '潮汐',
        epicWeapons: {
          sword: 10319, // 珊瑚短剑
          axe: 19897, // 螺号战斧
          bigsword: 13811, // 猛兽
          bigaxe: 14402, // 绝渊
          stick: 16918, // 塞壬之歌
          staff: 14000, // 海潮回响
          wand: 13845, // 呼风唤雨
          yoyo: 13024, // 涡旋
          bow: 16014, // 怒涛
          knuckle: 14971 // 潮汐之拳
        }
      },
      {
        minLevel: 141,
        maxLevel: 160,
        gemId: 17588,
        gemName: '璀璨紫水晶',
        chance: 2,
        epicLevel: 150,
        seriesName: '潮汐',
        epicWeapons: {
          sword: 10319, // 珊瑚短剑
          axe: 19897, // 螺号战斧
          bigsword: 13811, // 猛兽
          bigaxe: 14402, // 绝渊
          stick: 16918, // 塞壬之歌
          staff: 14000, // 海潮回响
          wand: 13845, // 呼风唤雨
          yoyo: 13024, // 涡旋
          bow: 16014, // 怒涛
          knuckle: 14971 // 潮汐之拳
        }
      }
    ],
    allowedRarities: ['common', 'uncommon'],
    weaponTypes: ['sword', 'axe', 'bigsword', 'bigaxe', 'stick', 'staff', 'wand', 'yoyo', 'bow', 'knuckle'],
    subcategoryMap: {
      sword: 'sword',
      axe: 'axe',
      bigsword: 'bigsword',
      bigaxe: 'bigaxe',
      stick: 'stick',
      staff: 'staff',
      wand: 'wand',
      yoyo: 'yoyo',
      bow: 'bow',
      knuckle: 'knuckle'
    }
  }

  // 终极武器转换配置
  const ULTIMATE_WEAPON_CONFIG = {
    materialIds: {
      shiningCrystal: 12908,
      ultimateOrb: 15012
    },
    conversionRates: [
      { shiningCount: 3, ultimateOrbCount: 3, rate: 100 },
      { shiningCount: 2, ultimateOrbCount: 2, rate: 70 },
      { shiningCount: 1, ultimateOrbCount: 1, rate: 30 }
    ]
  }

  // 镶嵌宝石配置
  const EMBED_GEM_CONFIG = {
    ultimateJewelBoxId: 17866,
    uniqueGemIds: [16150, 18554, 17409, 17105, 18376],
    pieceKeywords: ['碎片', 'Piece', 'piece']
  }

  // 宝石合成配置
  const GEM_SYNTHESIS_CONFIG = {
    jewelBoxId: 17866,
    // 宝石合成关系配置
    synthesisRules: {
      // 闪耀黄玉系列
      646049: { level: 0, type: 'topaz', nextLevelId: 10726 },
      10726: { level: 1, type: 'topaz', nextLevelId: 488615 },
      488615: { level: 3, type: 'topaz', nextLevelId: 553018 },
      553018: { level: 4, type: 'topaz', nextLevelId: 458423 },
      458423: { level: 6, type: 'topaz', nextLevelId: 538180 },
      538180: { level: 7, type: 'topaz', nextLevelId: 612570 },
      612570: { level: 8, type: 'topaz', nextLevelId: 485954 },
      485954: { level: 10, type: 'topaz', nextLevelId: null },
      // 其他宝石系列...
      489868: { level: 0, type: 'amethyst', nextLevelId: 11570 },
      11570: { level: 1, type: 'amethyst', nextLevelId: null },
      504580: { level: 0, type: 'sapphire', nextLevelId: 12768 },
      12768: { level: 1, type: 'sapphire', nextLevelId: null },
      457769: { level: 0, type: 'ruby', nextLevelId: 449554 },
      449554: { level: 1, type: 'ruby', nextLevelId: null },
      509220: { level: 0, type: 'emerald', nextLevelId: 557847 },
      557847: { level: 1, type: 'emerald', nextLevelId: null },
      451039: { level: 0, type: 'diamond', nextLevelId: 413203 },
      413203: { level: 1, type: 'diamond', nextLevelId: null }
    }
  }

  // 史诗等级选项配置
  const EPIC_LEVEL_OPTIONS = [
    { value: '60', label: '60级 卡第恩系列', stickId: 641, name: '卡第恩魔棒' },
    { value: '75', label: '75级 悠久系列', stickId: 2482, name: '悠久魔棒' },
    { value: '90', label: '90级 天使系列', stickId: 312, name: '天使魔棒' },
    { value: '105', label: '105级 传奇系列', stickId: 6315, name: '传奇魔棒' },
    { value: '120', label: '120级 血腥系列', stickId: 8885, name: '血腥魔棒' },
    { value: '150', label: '150级 潮汐系列', stickId: 16918, name: '塞壬之歌' }
  ]

  // 主面板状态
  const isVisible = ref(true)
  const activeFunction = ref('shinyDice')
  const showRulesPanel = ref(false)
  const modalContainerRef = ref(null)

  // 面板尺寸常量（调整为让内容一屏显示完整）
  const DEFAULT_WIDTH = 450
  const DEFAULT_HEIGHT = 420
  const MIN_WIDTH = 450
  const MIN_HEIGHT = 420

  // 面板尺寸状态
  const panelWidth = ref(DEFAULT_WIDTH)
  const panelHeight = ref(DEFAULT_HEIGHT)

  // 拖拽状态
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const modalStartX = ref(0)
  const modalStartY = ref(0)
  const modalX = ref(0)
  const modalY = ref(0)

  // 拉伸状态
  const isResizing = ref(false)
  const resizeStartX = ref(0)
  const resizeStartY = ref(0)
  const resizeStartWidth = ref(0)
  const resizeStartHeight = ref(0)

  // 功能列表配置
  const functions = [
    { key: 'shinyDice', name: '制作闪亮骰子' },
    { key: 'gem', name: '制作宝石' },
    { key: 'epicWeapon', name: '制作史诗武器' },
    { key: 'ultimateWeapon', name: '制作终极武器' },
    { key: 'embedGem', name: '镶嵌宝石' },
    { key: 'removeGem', name: '拆除宝石' },
    { key: 'gemSynthesis', name: '宝石合成' }
  ]

  // 功能名称映射
  const functionNameMap = {
    shinyDice: '闪亮骰子合成',
    gem: '宝石提取',
    epicWeapon: '史诗武器合成',
    ultimateWeapon: '终极武器转换',
    embedGem: '镶嵌宝石',
    removeGem: '拆除宝石',
    gemSynthesis: '宝石合成'
  }

  // 当前功能名称
  const currentFunctionName = computed(() => functionNameMap[activeFunction.value] || '')

  // 对话文本
  const dialogTexts = {
    shinyDice: '想要制作闪亮精炼骰子吗？只需要4/6/12点骰子和8/10点骰子各5个就能合成！',
    gem: '分解武器可以获得宝石，不同等级的武器能分解出不同的宝石哦！',
    epicWeapon: '史诗武器制作需要武器、宝石和闪亮骰子，成功率会受骰子影响。',
    ultimateWeapon: '终极武器需要史诗武器+10、闪耀晶石和终极宝珠才能转换！',
    embedGem: '只有终极武器才能镶嵌宝石，宝石槽数量取决于强化等级。',
    removeGem: '可以从终极武器上拆除已镶嵌的宝石，100%成功！',
    gemSynthesis: '10个碎片可以合成1个完整宝石，10个完整宝石可以合成1个高级宝石！'
  }

  const currentDialog = computed(() => dialogTexts[activeFunction.value] || '欢迎来到珠宝大师！')

  // 缩放比例（基于默认尺寸）
  const scaleRatio = computed(() => {
    const ratioX = panelWidth.value / DEFAULT_WIDTH
    const ratioY = panelHeight.value / DEFAULT_HEIGHT
    return Math.min(ratioX, ratioY)
  })

  // 内容缩放样式
  const contentStyle = computed(() => ({
    transform: `scale(${scaleRatio.value})`,
    transformOrigin: 'top left',
    width: `${DEFAULT_WIDTH}px`,
    height: `${DEFAULT_HEIGHT}px`
  }))

  // 模态框样式（支持拖拽和尺寸变化）
  const modalStyle = computed(() => ({
    left: `calc(50% - ${panelWidth.value / 2}px + ${modalX.value}px)`,
    top: `calc(50% - ${panelHeight.value / 2}px + ${modalY.value}px)`,
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`
  }))

  // 规则面板样式（使用 fixed 定位，显示在主面板右侧）
  const rulesPanelStyle = computed(() => {
    // 计算主面板的右侧位置
    const modalLeft = window.innerWidth / 2 - panelWidth.value / 2 + modalX.value
    const modalTop = window.innerHeight / 2 - panelHeight.value / 2 + modalY.value
    return {
      position: 'fixed',
      left: `${modalLeft + panelWidth.value + 10}px`,
      top: `${modalTop}px`,
      zIndex: 1001
    }
  })

  /**
   * 选择功能
   * @param {string} funcKey - 功能键名
   */
  const selectFunction = funcKey => {
    activeFunction.value = funcKey
    showRulesPanel.value = false
  }

  /**
   * 切换规则面板
   */
  const toggleRulesPanel = () => {
    showRulesPanel.value = !showRulesPanel.value
  }

  /**
   * 关闭模态框
   */
  const handleClose = () => {
    isVisible.value = false
  }

  /**
   * 开始拖拽
   * @param {PointerEvent} event - 指针事件
   */
  const startDrag = event => {
    if (event.target.closest('.jewelry-master-header-actions')) return
    isDragging.value = true
    dragStartX.value = event.clientX
    dragStartY.value = event.clientY
    modalStartX.value = modalX.value
    modalStartY.value = modalY.value

    document.addEventListener('pointermove', handleDrag)
    document.addEventListener('pointerup', stopDrag)
  }

  /**
   * 处理拖拽移动
   * @param {PointerEvent} event - 指针事件
   */
  const handleDrag = event => {
    if (!isDragging.value) return
    const deltaX = event.clientX - dragStartX.value
    const deltaY = event.clientY - dragStartY.value
    modalX.value = modalStartX.value + deltaX
    modalY.value = modalStartY.value + deltaY
  }

  /**
   * 停止拖拽
   */
  const stopDrag = () => {
    isDragging.value = false
    document.removeEventListener('pointermove', handleDrag)
    document.removeEventListener('pointerup', stopDrag)
  }

  /**
   * 开始拉伸面板
   * @param {PointerEvent} event - 指针事件
   */
  const startResize = event => {
    event.preventDefault()
    event.stopPropagation()

    isResizing.value = true
    resizeStartX.value = event.clientX
    resizeStartY.value = event.clientY
    resizeStartWidth.value = panelWidth.value
    resizeStartHeight.value = panelHeight.value

    document.addEventListener('pointermove', handleResize)
    document.addEventListener('pointerup', stopResize)
  }

  /**
   * 处理拉伸移动
   * @param {PointerEvent} event - 指针事件
   */
  const handleResize = event => {
    if (!isResizing.value) return

    const deltaX = event.clientX - resizeStartX.value
    const deltaY = event.clientY - resizeStartY.value

    // 使用较大的增量来保持等比例
    const deltaAvg = (deltaX + deltaY) / 2

    // 计算宽高比
    const aspectRatio = DEFAULT_WIDTH / DEFAULT_HEIGHT

    let newWidth = resizeStartWidth.value + deltaAvg * 2
    let newHeight = newWidth / aspectRatio

    // 限制最小尺寸
    newWidth = Math.max(MIN_WIDTH, newWidth)
    newHeight = Math.max(MIN_HEIGHT, newHeight)

    // 限制最大尺寸（屏幕的90%）
    const maxWidth = window.innerWidth * 0.9
    const maxHeight = window.innerHeight * 0.9
    newWidth = Math.min(maxWidth, newWidth)
    newHeight = Math.min(maxHeight, newHeight)

    // 等比例缩放
    if (newWidth / newHeight > aspectRatio) {
      newWidth = newHeight * aspectRatio
    } else {
      newHeight = newWidth / aspectRatio
    }

    panelWidth.value = Math.round(newWidth)
    panelHeight.value = Math.round(newHeight)
  }

  /**
   * 停止拉伸
   */
  const stopResize = () => {
    isResizing.value = false
    document.removeEventListener('pointermove', handleResize)
    document.removeEventListener('pointerup', stopResize)
  }

  /**
   * 重置面板尺寸
   */
  const resetPanelSize = () => {
    panelWidth.value = DEFAULT_WIDTH
    panelHeight.value = DEFAULT_HEIGHT
  }

  // Tooltip状态 - 使用全局共享状态（用于 JewelryMasterModal 中的简单tooltip显示）
  const tooltipVisible = globalTooltipVisible
  const tooltipContent = globalTooltipContent
  const tooltipStyle = globalTooltipStyle

  /**
   * 显示物品提示框
   * @param {MouseEvent} event - 鼠标事件
   * @param {Object} item - 物品数据
   */
  const showItemTooltip = (event, item) => {
    if (!item) return
    // 使用 window 事件触发全局 ItemTooltip 组件
    // ItemTooltip 期望的格式是 event.detail.item.id
    window.dispatchEvent(new CustomEvent('show-item-tooltip', {
      detail: {
        item: item,
        position: { x: event.clientX + 15, y: event.clientY + 15 },
        source: 'jewelry-master'
      }
    }))
  }

  /**
   * 通过物品ID显示提示框
   * @param {MouseEvent} event - 鼠标事件
   * @param {number} itemId - 物品ID
   */
  const showItemTooltipById = (event, itemId) => {
    const itemInfo = ITEM_INFO[itemId]
    if (!itemInfo) return
    // 使用 window 事件触发全局 ItemTooltip 组件
    // ItemTooltip 期望的格式是 event.detail.item.id
    window.dispatchEvent(new CustomEvent('show-item-tooltip', {
      detail: {
        item: { id: itemId, ...itemInfo },
        position: { x: event.clientX + 15, y: event.clientY + 15 },
        source: 'jewelry-master'
      }
    }))
  }

  /**
   * 隐藏物品提示框
   */
  const hideItemTooltip = () => {
    window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
  }

  /**
   * 移动物品提示框
   * @param {MouseEvent} event - 鼠标事件
   */
  const moveItemTooltip = event => {
    if (!event) return
    window.dispatchEvent(new CustomEvent('move-item-tooltip', {
      detail: {
        position: { x: event.clientX + 15, y: event.clientY + 15 }
      }
    }))
  }

  /**
   * 处理图标加载错误
   * @param {Event} event - 错误事件
   */
  const handleIconError = event => {
    if (event.target) {
      event.target.src = '/pt/item_icon/unknown.png'
    }
  }

  /**
   * 获取骰子显示名称
   * @param {Object} item - 物品数据
   * @returns {string} 显示名称
   */
  const getDiceDisplayName = item => {
    if (!item) return ''
    if (item.name && typeof item.name === 'object') {
      return item.name.cns || item.name.en || `骰子#${item.id}`
    }
    return item.name || `骰子#${item.id}`
  }

  /**
   * 获取宝石显示名称
   * @param {Object} item - 物品数据
   * @returns {string} 显示名称
   */
  const getGemDisplayName = item => {
    if (!item) return ''
    if (item.name && typeof item.name === 'object') {
      return item.name.cns || item.name.en || `宝石#${item.id}`
    }
    return item.name || `宝石#${item.id}`
  }

  /**
   * 获取武器显示名称
   * @param {Object} item - 物品数据
   * @returns {string} 显示名称
   */
  const getWeaponDisplayName = item => {
    if (!item) return ''
    if (item.name && typeof item.name === 'object') {
      return item.name.cns || item.name.en || `武器#${item.id}`
    }
    return item.name || `武器#${item.id}`
  }

  /**
   * 判断物品是否为宝石碎片
   * @param {Object} item - 物品数据
   * @returns {boolean} 是否为碎片
   */
  const isGemPiece = item => {
    if (!item || !item.name) return false
    const name = typeof item.name === 'object' ? (item.name.cns || item.name.en || '') : item.name
    return EMBED_GEM_CONFIG.pieceKeywords.some(keyword => name.includes(keyword))
  }

  /**
   * 保存玩家数据
   * @param {Object} patch - 要保存的数据片段
   */
  const savePlayerData = patch => {
    gameStore.player.bag = [...itemsStore.playerBag]
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerPatch(patch)
  }

  /**
   * 安全计算弹出面板位置
   * @param {Object} elementRef - Vue ref 对象
   * @param {number} offset - 底部偏移量，默认4px
   * @returns {Object} 样式对象
   */
  const getPanelStyle = (elementRef, offset = 4) => {
    if (!elementRef || !elementRef.value) return {}
    try {
      const rect = elementRef.value.getBoundingClientRect()
      if (!rect || rect.width === 0) return {}
      return {
        position: 'fixed',
        top: `${rect.bottom + offset}px`,
        left: `${rect.left}px`,
        zIndex: 10000
      }
    } catch (e) {
      return {}
    }
  }

  /**
   * 更新弹出面板位置（用于 nextTick 后调用）
   * @param {Object} boxRef - 触发元素的 ref
   * @param {Object} styleRef - 样式对象的 ref
   * @param {number} offset - 底部偏移量，默认4px
   */
  const updatePanelPosition = (boxRef, styleRef, offset = 4) => {
    if (!boxRef || !boxRef.value) return
    try {
      const rect = boxRef.value.getBoundingClientRect()
      if (!rect || rect.width === 0) return
      // getBoundingClientRect 返回的是缩放后的实际视觉位置，直接使用即可
      styleRef.value = {
        position: 'fixed',
        top: `${rect.bottom + offset}px`,
        left: `${rect.left}px`,
        zIndex: 10000
      }
    } catch (e) {
      console.warn('[useJewelryMaster] updatePanelPosition error:', e)
    }
  }

  return {
    // Store
    itemsStore,
    gameStore,

    // 配置
    DICE_CONFIG,
    GEM_CONFIG,
    EPIC_WEAPON_CONFIG,
    ULTIMATE_WEAPON_CONFIG,
    EMBED_GEM_CONFIG,
    GEM_SYNTHESIS_CONFIG,
    EPIC_LEVEL_OPTIONS,

    // 主面板状态
    isVisible,
    activeFunction,
    showRulesPanel,
    modalContainerRef,
    modalStyle,
    rulesPanelStyle,

    // 面板尺寸
    panelWidth,
    panelHeight,
    DEFAULT_WIDTH,
    DEFAULT_HEIGHT,
    MIN_WIDTH,
    MIN_HEIGHT,
    scaleRatio,
    contentStyle,

    // 功能列表
    functions,
    currentFunctionName,
    currentDialog,

    // 主面板方法
    selectFunction,
    toggleRulesPanel,
    handleClose,
    startDrag,
    startResize,
    resetPanelSize,

    // Tooltip
    tooltipVisible,
    tooltipContent,
    tooltipStyle,
    showItemTooltip,
    showItemTooltipById,
    hideItemTooltip,
    moveItemTooltip,

    // 工具方法
    handleIconError,
    getDiceDisplayName,
    getGemDisplayName,
    getWeaponDisplayName,
    isGemPiece,
    savePlayerData,
    getPanelStyle,
    updatePanelPosition
  }
}
