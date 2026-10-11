/**
 * @file useUI.js
 * @generated 2026-02-03
 * @description UI 状态与交互的组合式函数（composable，组合式函数），包含模态框、提示框、拖拽、战斗数字等。
 */
import { ref, reactive } from 'vue'
import { getRarityName as getRarityNameFromHelpers } from '@/utils/itemHelpers'
import { getItemIcon, getItemName, getItemDescription } from '@/utils/itemUtils'
import { useItemsStore } from '@/store/items'

const isDev = import.meta.env.DEV === true

/**
 * 伤害数字 / 经验数字的唯一 ID 自增计数器（模块级）。
 * 使用单调递增计数器替代 Date.now() + Math.random()，
 * 避免同一毫秒内浮点精度截断导致的 key 重复问题。
 */
let damageNumberIdCounter = 0

/**
 * 生成伤害数字 / 经验数字的唯一 ID。
 * 采用模块级单调递增计数器，保证每次调用返回值全局唯一，杜绝 Vue Duplicate keys 警告。
 * @returns {number} 全局唯一的数字 ID
 */
const generateDamageNumberId = () => {
  damageNumberIdCounter += 1
  return damageNumberIdCounter
}

/**
 * UI 状态与交互的组合式函数（composable，组合式函数）。
 * @returns {object} UI 状态与方法集合
 */
export function useUI () {
  const itemsStore = useItemsStore()

  // 模态框状态
  const modalStates = reactive({
    bagModal: false,
    equipmentModal: false,
    questModal: false,
    playerDetailModal: false,
    mapModal: false,
    shopModal: false,
    blacksmithModal: false,
    armorShopModal: false,
    foodShopModal: false,
    magicShopModal: false,
    storageModal: false,
    towerAdminModal: false,
    settingsModal: false
  })

  // 物品提示框状态
  const itemTooltip = reactive({
    visible: false,
    item: null,
    position: { x: 0, y: 0 }
  })

  // 技能提示框状态
  const skillTooltip = reactive({
    visible: false,
    skill: null,
    position: { x: 0, y: 0 }
  })

  // 拖拽状态
  const dragState = reactive({
    isDragging: false,
    element: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  })

  // 伤害数字效果
  const damageNumbers = ref([])
  const damageEffectEnabled = ref(true)
  // 最大并发玩家伤害数字数量
  const MAX_CONCURRENT_PLAYER_DAMAGE_NUMBERS = 40
  // 最大并发怪物伤害数字数量
  const MAX_CONCURRENT_MONSTER_DAMAGE_NUMBERS = 5
  // 最大并发伤害数字数量（玩家 + 怪物）
  const MAX_CONCURRENT_DAMAGE_NUMBERS_TOTAL =
    MAX_CONCURRENT_PLAYER_DAMAGE_NUMBERS + MAX_CONCURRENT_MONSTER_DAMAGE_NUMBERS
  // 最大并发伤害数字命令数量（每个刷新周期）
  const MAX_DAMAGE_NUMBER_COMMANDS_PER_FLUSH = 16
  // 伤害数字刷新预算时间
  const DAMAGE_NUMBER_FLUSH_BUDGET_MS = 4
  // 伤害数字显示时间
  const DAMAGE_NUMBER_LIFETIME_MS = 2600
  // 伤害数字清理间隔
  const DAMAGE_NUMBER_PRUNE_INTERVAL_MS = 400
  // 最大待处理伤害数字命令队列长度
  const MAX_PENDING_DAMAGE_NUMBER_COMMANDS = 600
  const pendingDamageNumberCommands = []
  let pendingDamageNumberFlushHandle = null
  let lastDamageNumberPruneAt = 0
  let lastMissingDamageTargetWarnAt = 0 // 保留变量以备后续调试使用

  const damageTargetElementCache = new Map()

  /**
   * 伤害数字定期强制清理定时器
   * 防止flush未被调用时残留的过期伤害数字堆积
   * 每10秒强制清理一次超过生命周期的伤害数字
   */
  let damageNumberForcePruneTimer = null
  const startDamageNumberForcePrune = () => {
    if (damageNumberForcePruneTimer) return
    damageNumberForcePruneTimer = setInterval(() => {
      try {
        pruneDamageNumbers()
        // 清理过期的经验数字（超过3秒的）
        const expList = expNumbers.value
        if (Array.isArray(expList) && expList.length > 0) {
          const nowMs = Date.now()
          for (let i = expList.length - 1; i >= 0; i--) {
            const item = expList[i]
            if (!item || typeof item !== 'object') {
              expList.splice(i, 1)
              continue
            }
            const age = nowMs - (item.createdAt ?? 0)
            if (age > 5000) {
              expList.splice(i, 1)
            }
          }
        }
        // 清理元素缓存中已断开连接的条目
        for (const [key, cached] of damageTargetElementCache.entries()) {
          if (cached && cached.targetElement && !cached.targetElement.isConnected) {
            damageTargetElementCache.delete(key)
          }
        }
        // 限制元素缓存大小
        if (damageTargetElementCache.size > 100) {
          damageTargetElementCache.clear()
        }
      } catch (error) {
        console.warn('[useUI] 定期强制清理伤害数字出错:', error)
      }
    }, 10000) // 10秒强制清理一次
  }

  /**
   * 停止伤害数字定期强制清理
   */
  const stopDamageNumberForcePrune = () => {
    if (damageNumberForcePruneTimer) {
      clearInterval(damageNumberForcePruneTimer)
      damageNumberForcePruneTimer = null
    }
  }

  /**
   * 获取伤害数字目标的 DOM 元素信息，并做弱缓存以减少重复查询。
   * @param {number} targetIndex - 目标索引：>=0 为怪物索引；<0 为玩家
   * @returns {{ targetElement: Element|null, container: Element|null }} 目标元素与容器
   */
  const resolveDamageTargetElements = targetIndex => {
    const cacheKey = targetIndex >= 0 ? `m:${targetIndex}` : 'p'
    const cached = damageTargetElementCache.get(cacheKey)
    if (
      cached &&
      cached.targetElement &&
      cached.targetElement.isConnected &&
      (!cached.container || cached.container.isConnected)
    ) {
      return cached
    }

    let targetElement = null
    let container = null

    if (targetIndex >= 0) {
      container = document.getElementById(`enemy-container-${targetIndex}`)
      if (container) {
        targetElement = container.querySelector('.enemy-icon')
      }
    } else {
      targetElement = document.getElementById('playerAvatar')
      if (targetElement) {
        const attackAnimation = targetElement.closest('.attack-animation.player')
        if (attackAnimation) {
          container = attackAnimation
        }
      }
    }

    const result = { targetElement, container }
    if (targetElement) {
      damageTargetElementCache.set(cacheKey, result)
    } else {
      damageTargetElementCache.delete(cacheKey)
    }
    return result
  }


  // 经验数字效果
  const expNumbers = ref([])
  const MAX_CONCURRENT_EXP_NUMBERS = 40 // 最大同时显示的经验数字数量
  const expAnimationEnabled = ref(true)
  const hasWarnedMissingExpBar = ref(false)
  let expBurstCount = 0
  let expBurstLastAt = 0

  // 方法
  /**
   * 打开模态框
   * @param {string} modalName - 模态框名称
   */
  const openModal = modalName => {
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
      modalStates[modalName] = true
    }
  }

  /**
   * 关闭模态框
   * @param {string} modalName - 模态框名称
   */
  const closeModal = modalName => {
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
      modalStates[modalName] = false
    }
  }

  /**
   * 切换模态框状态
   * @param {string} modalName - 模态框名称
   */
  const toggleModal = modalName => {
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
      modalStates[modalName] = !modalStates[modalName]
    }
  }

  /**
   * 显示物品提示框
   * @param {Object} item - 物品对象
   * @param {Object} position - 位置对象 {x, y}
   */
  const showItemTooltip = (item, position) => {
    itemTooltip.visible = true
    itemTooltip.item = item
    itemTooltip.position = position
  }

  /**
   * 隐藏物品提示框
   */
  const hideItemTooltip = () => {
    itemTooltip.visible = false
    itemTooltip.item = null
  }

  /**
   * 移动物品提示框
   * @param {Object} position - 位置对象 {x, y}
   */
  const moveItemTooltip = position => {
    itemTooltip.position = position
  }

  /**
   * 显示技能提示框
   * @param {Object} skill - 技能对象
   * @param {Object} position - 位置对象 {x, y}
   */
  const showSkillTooltip = (skill, position) => {
    skillTooltip.visible = true
    skillTooltip.skill = skill
    skillTooltip.position = position
  }

  /**
   * 隐藏技能提示框
   */
  const hideSkillTooltip = () => {
    skillTooltip.visible = false
    skillTooltip.skill = null
  }

  /**
   * 移动技能提示框
   * @param {Object} position - 位置对象 {x, y}
   */
  const moveSkillTooltip = position => {
    skillTooltip.position = position
  }

  /**
   * 开始拖拽
   * @param {HTMLElement} element - 被拖拽的元素
   * @param {MouseEvent} event - 鼠标事件
   */
  const startDrag = (element, event) => {
    dragState.isDragging = true
    dragState.element = element
    dragState.startX = event.clientX
    dragState.startY = event.clientY

    // 获取元素当前位置
    const rect = element.getBoundingClientRect()
    dragState.offsetX = event.clientX - rect.left
    dragState.offsetY = event.clientY - rect.top
  }

  /**
   * 拖拽过程中
   * @param {MouseEvent} event - 鼠标事件
   */
  const onDrag = event => {
    if (!dragState.isDragging || !dragState.element) {
      return
    }

    // 计算新位置
    let x = event.clientX - dragState.offsetX
    let y = event.clientY - dragState.offsetY

    // 获取窗口尺寸作为边界
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const elementRect = dragState.element.getBoundingClientRect()

    // 边界限制
    x = Math.max(0, Math.min(x, viewportWidth - elementRect.width))
    y = Math.max(0, Math.min(y, viewportHeight - elementRect.height))

    // 设置元素新位置
    dragState.element.style.position = 'fixed'
    dragState.element.style.left = `${x}px`
    dragState.element.style.top = `${y}px`
  }

  /**
   * 结束拖拽
   */
  const endDrag = () => {
    dragState.isDragging = false
    dragState.element = null
  }

  /**
   * 显示伤害数字
   * @param {number} targetIndex - 目标索引（-1表示玩家，>=0表示怪物）
   * @param {number} damage - 伤害值
   * @param {boolean} isCritical - 是否暴击
   * @param {boolean} isHeal - 是否治疗
   * @param {Object} skill - 技能对象（可选）
   * @param {boolean} isMiss - 是否未命中
   * @param {Object} weaponIcon - 玩家武器图标（可选）
   * @param {Object} monsterIcon - 怪物图标（可选）
  * @param {boolean} isMpHeal - 是否MP恢复（可选）
  * @param {string|null} text - 自定义显示文本（可选）
  * @param {Object} elementInfo - 元素信息（可选）
  * @param {string|null} itemIcon - 物品图标路径（可选）
  * @param {boolean} doubleJudgment - 是否触发双倍惩戒（可选）
  */
  const showDamageNumber = (
    targetIndex,
    damage,
    isCritical = false,
    isHeal = false,
    skill = null,
    isMiss = false,
    weaponIcon = null,
    monsterIcon = null,
    isMpHeal = false,
    text = null,
    elementInfo = null,
    itemIcon = null,
    doubleJudgment = false,
    isOffhand = false,
    customText = null
  ) => {
    if (!damageEffectEnabled.value) {
      return
    }
    pendingDamageNumberCommands.push({
      targetIndex,
      damage,
      isCritical,
      isHeal,
      skill,
      isMiss,
      weaponIcon,
      monsterIcon,
      isMpHeal,
      text: customText || text,
      elementType: elementInfo?.elementType ?? null,
      elementAdvantage: elementInfo?.elementAdvantage ?? null,
      itemIcon,
      doubleJudgment,
      isOffhand
    })
    if (pendingDamageNumberCommands.length > MAX_PENDING_DAMAGE_NUMBER_COMMANDS) {
      pendingDamageNumberCommands.splice(
        0,
        pendingDamageNumberCommands.length - MAX_PENDING_DAMAGE_NUMBER_COMMANDS
      )
    }
    scheduleDamageNumberFlush()
  }

  /**
   * 更新伤害数字位置
   */
  const updateDamageNumbers = () => {
    pruneDamageNumbers()
  }

  /**
   * 使用 requestAnimationFrame 安排一次 flush 回调。
   * @param {Function} callback - 需要在下一次帧执行的函数
   */
  const requestDamageNumberFlushFrame = callback => {
    if (typeof requestAnimationFrame === 'function') {
      pendingDamageNumberFlushHandle = requestAnimationFrame(callback)
      return
    }
    pendingDamageNumberFlushHandle = setTimeout(callback, 16)
  }

  /**
   * 安排一次伤害数字命令队列 flush（冲刷），避免在同一帧内重复安排。
   */
  const scheduleDamageNumberFlush = () => {
    if (pendingDamageNumberFlushHandle) {
      return
    }
    requestDamageNumberFlushFrame(() => {
      pendingDamageNumberFlushHandle = null
      flushPendingDamageNumberCommands()
    })
  }

  /**
   * 清理过期伤害数字，避免列表持续增长导致响应式开销上升。
   */
  const pruneDamageNumbers = () => {
    const list = damageNumbers.value
    if (!Array.isArray(list) || list.length === 0) {
      return
    }
    const now = Date.now()
    for (let i = list.length - 1; i >= 0; i--) {
      const item = list[i]
      if (!item || typeof item !== 'object') {
        list.splice(i, 1)
        continue
      }
      const createdAt = item.createdAt ?? item.timestamp ?? 0
      const age = now - createdAt
      if (age > DAMAGE_NUMBER_LIFETIME_MS) {
        list.splice(i, 1)
      }
    }
  }

  /**
   * 约束某类来源（玩家/怪物）的并发伤害数字数量，并控制总数量上限。
   * @param {boolean} isPlayerDamage - true 表示玩家侧，false 表示怪物侧
   * @param {number} maxForSource - 该来源允许的最大并发数量
   */
  const enforceDamageNumberLimits = (isPlayerDamage, maxForSource) => {
    const list = damageNumbers.value
    if (!Array.isArray(list) || list.length === 0) {
      return
    }

    let countForSource = 0
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (!item) {
        continue
      }
      if ((item.targetIndex >= 0) === isPlayerDamage) {
        countForSource += 1
      }
    }

    while (countForSource > maxForSource) {
      const indexToRemove = list.findIndex(item => item && (item.targetIndex >= 0) === isPlayerDamage)
      if (indexToRemove < 0) {
        break
      }
      list.splice(indexToRemove, 1)
      countForSource -= 1
    }

    while (list.length > MAX_CONCURRENT_DAMAGE_NUMBERS_TOTAL) {
      list.shift()
    }
  }

  /**
   * 将队列中的命令转换为 damageNumber 实体，包含 DOM 定位与屏幕坐标计算。
   * @param {object} command - 入队的伤害数字命令
   * @param {Map<string, any>|null} layoutCache - 本次 flush 内的布局缓存（按目标复用）
   * @returns {object|null} 可渲染的伤害数字对象；找不到目标元素时返回 null
   */
  const buildDamageNumberFromCommand = (command, layoutCache = null) => {
    const targetIndex = Number(command?.targetIndex ?? -1)
    const id = generateDamageNumberId()

    const elements = resolveDamageTargetElements(targetIndex)
    const targetElement = elements?.targetElement || null
    const container = elements?.container || null

    if (!targetElement) {
      // 静默处理：怪物可能已被击败，DOM 元素已被移除，这是正常的边界情况
      return null
    }

    const layoutKey = targetIndex >= 0 ? `m:${targetIndex}` : 'p'
    const cachedLayout =
      layoutCache && typeof layoutCache.get === 'function' ? layoutCache.get(layoutKey) : null

    let rect = null
    let containerRect = null
    let boundsRect = null
    let boundsWidth = 0
    let boundsHeight = 0
    let originX = 0
    let originY = 0

    if (cachedLayout) {
      rect = cachedLayout.rect
      containerRect = cachedLayout.containerRect
      boundsRect = cachedLayout.boundsRect
      boundsWidth = cachedLayout.boundsWidth
      boundsHeight = cachedLayout.boundsHeight
      originX = cachedLayout.originX
      originY = cachedLayout.originY
    } else {
      rect = targetElement.getBoundingClientRect()
      containerRect = container
        ? container.getBoundingClientRect()
        : { left: 0, top: 0, width: rect.width ?? 0, height: rect.height ?? 0 }
      boundsRect = container ? containerRect : rect
      boundsWidth = boundsRect.width || (containerRect.width ?? rect.width ?? 0)
      boundsHeight = boundsRect.height || (containerRect.height ?? rect.height ?? 0)
      originX = boundsRect.left - containerRect.left
      originY = boundsRect.top - containerRect.top

      if (layoutCache && typeof layoutCache.set === 'function') {
        layoutCache.set(layoutKey, {
          rect,
          containerRect,
          boundsRect,
          boundsWidth,
          boundsHeight,
          originX,
          originY
        })
      }
    }

    const isCritical = Boolean(command?.isCritical)
    const isHeal = Boolean(command?.isHeal)
    const isMpHeal = Boolean(command?.isMpHeal)
    const isMiss = Boolean(command?.isMiss)
    const isOffhand = Boolean(command?.isOffhand)
    const skill = command?.skill ?? null
    const weaponIcon = command?.weaponIcon ?? null
    const monsterIcon = command?.monsterIcon ?? null
    const damage = Number(command?.damage ?? 0)
    const text = command?.text ?? null
    const elementType = typeof command?.elementType === 'string' ? command.elementType : null
    const rawElementAdvantage = command?.elementAdvantage
    let elementAdvantage = null
    if (rawElementAdvantage !== null && rawElementAdvantage !== undefined && rawElementAdvantage !== '') {
      const parsedElementAdvantage = Number(rawElementAdvantage)
      if (Number.isFinite(parsedElementAdvantage)) {
        elementAdvantage = parsedElementAdvantage
      }
    }

    const rawIcon =
      command?.itemIcon ||
      (skill && typeof skill === 'object' && skill.icon) ||
      weaponIcon ||
      (monsterIcon && targetIndex < 0)
    const hasIcon = Boolean(rawIcon)

    const iconSize = monsterIcon && targetIndex < 0 ? 34 : 25
    const baseTextWidth = isCritical ? 92 : 74
    const baseTextHeight = isCritical ? 34 : 28
    const maxScale = isCritical ? 1.62 : 1.15

    // 估算伤害数字的总尺寸（包括图标）
    const estimatedWidth = Math.ceil((baseTextWidth + (hasIcon ? iconSize + 12 : 0) + 20) * maxScale)
    const estimatedHeight = Math.ceil((baseTextHeight + (hasIcon ? 6 : 0) + 16) * maxScale)

    // 在怪物容器底部显示伤害数字
    // 确保伤害数字不会超出容器边界
    const paddingX = 8
    const paddingY = 4

    // 计算怪物图标中心点（相对于容器）
    const monsterCenterX = rect.left - containerRect.left + rect.width / 2
    const monsterCenterY = rect.top - containerRect.top + rect.height / 2

    // 双刀流：主手伤害偏左，副手伤害偏右
    // 使用基于怪物中心点的固定偏移，确保即使容器很小也能左右区分
    // 主手向左偏移 30px，副手向右偏移 40px，再叠加少量随机抖动
    const OFFHAND_OFFSET = isOffhand ? 40 : 30
    const jitterX = (Math.random() - 0.5) * 20 // ±10px 随机抖动
    const sideOffset = isOffhand ? OFFHAND_OFFSET : -OFFHAND_OFFSET

    // 计算可用的随机范围（用于边界约束）
    const availableWidth = Math.max(0, boundsWidth - estimatedWidth - paddingX * 2)

    // 最终 X 坐标：以怪物中心点为基准，向左或向右偏移
    const randomX = isOffhand
      ? Math.max(0, monsterCenterX + sideOffset + jitterX - paddingX)
      : Math.max(0, Math.min(monsterCenterX + sideOffset + jitterX - paddingX, availableWidth))

    const bottomAreaHeight = Math.max(estimatedHeight + paddingY * 2, boundsHeight * 0.3)
    const startY = boundsHeight - bottomAreaHeight

    // 计算最终屏幕坐标（相对于容器，在底部区域）
    const screenX = Math.round(originX + paddingX + randomX)
    const screenY = Math.round(originY + startY + paddingY + (Math.random() - 0.5) * 10)
    const screenXAbs = Math.round((containerRect?.left || 0) + screenX)
    const screenYAbs = Math.round((containerRect?.top || 0) + screenY)

    // 计算相对于怪物图标中心的偏移量（用于动画）
    const randomOffsetX = screenX - monsterCenterX
    const randomOffsetY = screenY - monsterCenterY

    const now = Date.now()
    return {
      id,
      targetIndex,
      damage,
      isCritical,
      isHeal,
      isMpHeal,
      skill,
      isMiss,
      text,
      elementType,
      elementAdvantage,
      x: randomOffsetX,
      y: randomOffsetY,
      screenX,
      screenY,
      screenXAbs,
      screenYAbs,
      opacity: 1,
      timestamp: now,
      createdAt: now,
      weaponIcon,
      monsterIcon,
      itemIcon: command?.itemIcon ?? null,
      doubleJudgment: Boolean(command?.doubleJudgment),
      isOffhand
    }
  }

  /**
   * 分帧消费伤害数字命令队列：限制每次处理数量与时间预算，降低长任务概率。
   */
  const flushPendingDamageNumberCommands = () => {
    if (!damageEffectEnabled.value) {
      pendingDamageNumberCommands.length = 0
      const list = damageNumbers.value
      if (Array.isArray(list) && list.length > 0) {
        list.splice(0, list.length)
      }
      return
    }
    const startedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()

    let processed = 0
    const layoutCache = new Map()
    try {
      while (pendingDamageNumberCommands.length > 0) {
        if (processed >= MAX_DAMAGE_NUMBER_COMMANDS_PER_FLUSH) {
          break
        }

        const nowPerf =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now()
        if (nowPerf - startedAt >= DAMAGE_NUMBER_FLUSH_BUDGET_MS) {
          break
        }

        const command = pendingDamageNumberCommands.shift()
        const damageNumber = buildDamageNumberFromCommand(command, layoutCache)
        if (!damageNumber) {
          processed += 1
          continue
        }

        damageNumbers.value.push(damageNumber)

        const isPlayerDamage = damageNumber.targetIndex >= 0
        const maxConcurrentForSource = isPlayerDamage
          ? MAX_CONCURRENT_PLAYER_DAMAGE_NUMBERS
          : MAX_CONCURRENT_MONSTER_DAMAGE_NUMBERS
        enforceDamageNumberLimits(isPlayerDamage, maxConcurrentForSource)

        processed += 1
      }
    } catch (error) {
      console.error('[useUI] flushPendingDamageNumberCommands 失败:', error)
    }

    const now = Date.now()
    if (now - lastDamageNumberPruneAt >= DAMAGE_NUMBER_PRUNE_INTERVAL_MS) {
      lastDamageNumberPruneAt = now
      pruneDamageNumbers()
    }

    if (pendingDamageNumberCommands.length > 0) {
      scheduleDamageNumberFlush()
    }
  }

  /**
   * 设置伤害数字效果开关。
   * 用于从设置项同步到 UI 层，关闭时会清空等待队列与现有显示，避免残留。
   * @param {boolean} enabled - true 开启；false 关闭
   */
  const setDamageEffectEnabled = enabled => {
    const nextEnabled = Boolean(enabled)
    if (nextEnabled === damageEffectEnabled.value) {
      return
    }
    damageEffectEnabled.value = nextEnabled
    if (!nextEnabled) {
      pendingDamageNumberCommands.length = 0
      const list = damageNumbers.value
      if (Array.isArray(list) && list.length > 0) {
        list.splice(0, list.length)
      }
    }
  }

  /**
   * 显示经验数字
   * @param {number} percentage - 经验百分比
   */
  const showExpNumber = percentage => {
    if (!expAnimationEnabled.value) {
      return
    }
    const now = Date.now()
    const numericPercentage = Number(percentage)
    if (!Number.isFinite(numericPercentage) || numericPercentage <= 0) {
      return
    }

    const id = generateDamageNumberId()

    // 查找经验进度条元素
    const expBarElement =
      document.querySelector('.player-status-card .bar-track.exp') ||
      document.querySelector('.bar-track.exp') ||
      document.querySelector('.exp-bar')

    if (!expBarElement) {
      if (!hasWarnedMissingExpBar.value) {
        // console.warn('[showExpNumber] 找不到经验进度条元素')
        hasWarnedMissingExpBar.value = true
      }
      return
    }

    // 获取经验进度条的位置
    const rect = expBarElement.getBoundingClientRect()

    // 计算相对于PlayerInfoPanel容器的坐标
    const container = expBarElement.closest('.left-section')
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 }

    // 随机位置偏移
    if (now - expBurstLastAt > 140) {
      expBurstCount = 0
    }
    expBurstLastAt = now

    const index = expBurstCount
    expBurstCount += 1

    const columns = 8
    const columnIndex = index % columns
    const rowIndex = Math.floor(index / columns)

    const gridOffsetX = (columnIndex - (columns - 1) / 2) * 14
    const gridOffsetY = -rowIndex * 14

    const randomOffsetX = (Math.random() - 0.5) * 10
    const randomOffsetY = (Math.random() - 0.5) * 8

    // 计算坐标（在经验进度条中心位置）
    const screenX = rect.left - containerRect.left + rect.width / 2 + gridOffsetX + randomOffsetX
    const screenY = rect.top - containerRect.top + rect.height / 2 + gridOffsetY + randomOffsetY

    const opacity = 1
    const displayPercentage =
      typeof percentage === 'string' ? percentage : numericPercentage.toFixed(4)

    const expNumber = {
      id,
      percentage: displayPercentage,
      screenX,
      screenY,
      opacity,
      createdAt: Date.now()
    }

    // 如果经验数字数量超过限制，移除最旧的
    if (expNumbers.value.length >= MAX_CONCURRENT_EXP_NUMBERS) {
      expNumbers.value.shift()
    }

    expNumbers.value.push(expNumber)


    setTimeout(() => {
      const list = expNumbers.value
      if (!Array.isArray(list) || list.length === 0) {
        return
      }

      const index = list.findIndex(num => num && num.id === id)
      if (index >= 0) {
        list.splice(index, 1)
      }
    }, 3000)
  }

  /**
   * 更新经验数字位置
   */
  const updateExpNumbers = () => {
    if (!expAnimationEnabled.value) {
      const list = expNumbers.value
      if (Array.isArray(list) && list.length > 0) {
        list.splice(0, list.length)
      }
      return
    }
    const list = expNumbers.value
    if (!Array.isArray(list) || list.length === 0) {
      return
    }
    const now = Date.now()
    for (let i = list.length - 1; i >= 0; i--) {
      const num = list[i]
      if (!num || typeof num !== 'object') {
        list.splice(i, 1)
        continue
      }

      const age = now - (num.createdAt ?? 0)
      if (age > 3000) {
        list.splice(i, 1)
        continue
      }

      num.opacity = 1 - age / 3000
    }
  }

  /**
   * 设置经验动画开关。
   * 用于从设置项同步到 UI 层，关闭时会清空现有显示，避免残留。
   * @param {boolean} enabled - true 开启；false 关闭
   */
  const setExpAnimationEnabled = enabled => {
    const nextEnabled = Boolean(enabled)
    if (nextEnabled === expAnimationEnabled.value) {
      return
    }
    expAnimationEnabled.value = nextEnabled
    if (!nextEnabled) {
      const list = expNumbers.value
      if (Array.isArray(list) && list.length > 0) {
        list.splice(0, list.length)
      }
    }
  }

  /**
   * 处理图片加载错误
   * @param {Event} event - 图片加载错误事件
   * @param {string} defaultSrc - 默认图片路径
   */
  const handleImageError = (event, defaultSrc = '/pt/item_icon/default_item.png') => {
    event.target.src = defaultSrc
  }

  /**
   * 获取稀有度颜色
   * @param {string} rarity - 稀有度
   * @returns {string} 颜色值
   */
  const getRarityColor = rarity => {
    return itemsStore.getRarityTextColor(rarity)
  }

  /**
   * 获取稀有度名称
   * @param {string} rarity - 稀有度
   * @returns {string} 稀有度名称
   */
  const getRarityName = rarity => {
    return getRarityNameFromHelpers(rarity)
  }

  // 返回所有需要的属性和方法
  return {
    // 响应式数据
    modalStates,
    itemTooltip,
    skillTooltip,
    dragState,
    damageNumbers,
    damageEffectEnabled,
    expNumbers,
    expAnimationEnabled,

    // 方法
    openModal,
    closeModal,
    toggleModal,
    showItemTooltip,
    hideItemTooltip,
    moveItemTooltip,
    showSkillTooltip,
    hideSkillTooltip,
    moveSkillTooltip,
    startDrag,
    onDrag,
    endDrag,
    showDamageNumber,
    setDamageEffectEnabled,
    updateDamageNumbers,
    showExpNumber,
    updateExpNumbers,
    setExpAnimationEnabled,
    handleImageError,
    getItemIcon,
    getItemName,
    getItemDescription,
    getRarityColor,
    getRarityName,
    startDamageNumberForcePrune,
    stopDamageNumberForcePrune
  }
}
