/**
 * @file useModalPanelInitialPosition.js
 * @generated 2026-01-27
 */

import { ref } from 'vue'

/**
 * 管理强化/穿洞/卡片面板的初始定位（优先锚定在 NPC 对话按钮区域附近）。
 * @param {Object} params
 * @param {Function} params.openEnhancePanel - 打开强化面板的方法
 * @param {Function} params.openPerforationPanel - 打开穿洞面板的方法
 * @param {Function} params.openCardPanel - 打开卡片面板的方法
 * @returns {{
 *  enhancePanelInitialPosition: import('vue').Ref<{x:number,y:number}|null>,
 *  perforationPanelInitialPosition: import('vue').Ref<{x:number,y:number}|null>,
 *  cardPanelInitialPosition: import('vue').Ref<{x:number,y:number}|null>,
 *  openEnhancePanel: () => void,
 *  openPerforationPanel: () => void,
 *  openCardPanel: () => void
 * }}
 */
export function useModalPanelInitialPosition (params) {
  const {
    openEnhancePanel: openEnhancePanelImpl,
    openPerforationPanel: openPerforationPanelImpl,
    openCardPanel: openCardPanelImpl
  } = params || {}

  const enhancePanelInitialPosition = ref(null)
  const perforationPanelInitialPosition = ref(null)
  const cardPanelInitialPosition = ref(null)

  /**
   * 查找 NPC 交互区域中可见的对话动作按钮容器。
   * @returns {{left:number,top:number,right:number,bottom:number,width:number,height:number}|null}
   */
  const resolveNPCActionAnchorRect = () => {
    const candidates = Array.from(document.querySelectorAll('.modal-container .dialog-actions'))
      .filter(el => el && el.getBoundingClientRect && el.offsetParent !== null)
    const target = candidates.length ? candidates[candidates.length - 1] : null
    if (!target) {
      return null
    }
    const rect = target.getBoundingClientRect()
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    }
  }

  /**
   * 把数值限制在指定范围内，非有限数值回退到 min。
   * @param {any} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  const clampNumber = (value, min, max) => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) {
      return min
    }
    return Math.min(max, Math.max(min, numeric))
  }

  /**
   * 计算面板初始位置：优先锚定在 NPC 动作区下方，否则居中。
   * @param {number} panelWidth
   * @param {number} panelHeight
   * @returns {{x:number,y:number}}
   */
  const computePanelInitialPosition = (panelWidth, panelHeight) => {
    const padding = 12
    const rect = resolveNPCActionAnchorRect()
    const width = Number(panelWidth)
    const height = Number(panelHeight)

    if (rect) {
      const x = rect.left + rect.width / 2 - width / 2
      const y = rect.bottom + 14
      return {
        x: clampNumber(x, padding, Math.max(padding, window.innerWidth - width - padding)),
        y: clampNumber(y, padding, Math.max(padding, window.innerHeight - height - padding))
      }
    }

    return {
      x: clampNumber(
        (window.innerWidth - width) / 2,
        padding,
        Math.max(padding, window.innerWidth - width - padding)
      ),
      y: clampNumber(
        (window.innerHeight - height) / 2,
        padding,
        Math.max(padding, window.innerHeight - height - padding)
      )
    }
  }

  /**
   * 打开强化面板，并在打开前计算其初始定位。
   * @returns {void}
   */
  const openEnhancePanel = () => {
    enhancePanelInitialPosition.value = computePanelInitialPosition(600, 520)
    if (typeof openEnhancePanelImpl === 'function') {
      openEnhancePanelImpl()
    }
  }

  /**
   * 打开穿洞面板，并在打开前计算其初始定位。
   * @returns {void}
   */
  const openPerforationPanel = () => {
    perforationPanelInitialPosition.value = computePanelInitialPosition(600, 520)
    if (typeof openPerforationPanelImpl === 'function') {
      openPerforationPanelImpl()
    }
  }

  /**
   * 打开卡片面板，并在打开前计算其初始定位。
   * @returns {void}
   */
  const openCardPanel = () => {
    cardPanelInitialPosition.value = computePanelInitialPosition(760, 560)
    if (typeof openCardPanelImpl === 'function') {
      openCardPanelImpl()
    }
  }

  return {
    enhancePanelInitialPosition,
    perforationPanelInitialPosition,
    cardPanelInitialPosition,
    openEnhancePanel,
    openPerforationPanel,
    openCardPanel
  }
}

