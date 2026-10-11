/**
 * @file 长按连点组合式函数
 * @description 提供鼠标/触摸长按后自动重复执行回调的能力，适用于属性点+/-按钮等场景
 * @author CatPaw
 * @since 2026-06-25
 */

import { onBeforeUnmount } from 'vue'

/**
 * 长按连点组合式函数
 * 提供鼠标/触摸长按后自动重复执行回调的能力
 *
 * 触摸事件 passive 优化：
 *   createPressHandlers 返回的对象将鼠标事件和触摸处理器分离：
 *   - events 子对象包含鼠标事件，供 v-on="handlers.events" 绑定
 *   - touchstart / touchend 为独立函数，供模板 @touchstart.passive / @touchend 绑定
 *   触摸按钮需添加 CSS touch-action: none 以替代原 preventDefault 的默认行为阻止
 *
 * @param {Object} [options={}] - 配置选项
 * @param {number} [options.initialDelay=400] - 首次执行后到开始重复的延迟（ms）
 * @param {number} [options.repeatInterval=80] - 重复执行间隔（ms）
 * @returns {{ startPress: Function, stopPress: Function, createPressHandlers: Function }} 包含开始/停止/创建处理器的方法
 */
export function usePressAndRepeat(options = {}) {
  const { initialDelay = 400, repeatInterval = 80 } = options

  /** @type {number|null} 延迟定时器 ID */
  let timeoutId = null
  /** @type {number|null} 重复定时器 ID */
  let intervalId = null

  /**
   * 停止长按重复，清除所有定时器和全局监听
   */
  const stopPress = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    document.removeEventListener('mouseup', stopPress)
    document.removeEventListener('touchend', stopPress)
  }

  /**
   * 开始长按重复
   * 立即执行一次回调，延迟后开始按固定间隔重复执行
   * @param {Function} callback - 需要重复执行的回调
   * @param {Function} [shouldRepeat=()=>true] - 是否应该继续重复的判断函数，返回 false 时停止
   */
  const startPress = (callback, shouldRepeat = () => true) => {
    stopPress()
    // 首次执行前检查条件
    if (!shouldRepeat()) return
    callback()

    // 注册全局 mouseup/touchend，确保在按钮外释放时也能停止
    document.addEventListener('mouseup', stopPress, { once: true })
    document.addEventListener('touchend', stopPress, { once: true })

    // 延迟后开始重复执行
    timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (!shouldRepeat()) {
          stopPress()
          return
        }
        callback()
      }, repeatInterval)
    }, initialDelay)
  }

  /**
   * 为指定回调创建可直接绑定到模板的事件处理器对象
   *
   * 返回结构：
   *   - events: 鼠标事件对象，供 v-on="handlers.events" 绑定（含 mousedown/mouseup/mouseleave/contextmenu）
   *   - touchstart: 触摸开始处理函数，供 @touchstart.passive 绑定（不调用 preventDefault，可安全标记为 passive）
   *   - touchend: 触摸结束处理函数，供 @touchend 绑定
   *
   * 模板使用示例：
   *   <button
   *     v-on="handlers.events"
   *     @touchstart.passive="handlers.touchstart"
   *     @touchend="handlers.touchend"
   *   >
   *
   * 注意：触摸按钮需添加 CSS `touch-action: none` 以替代原 preventDefault 的默认行为阻止
   *
   * @param {Function} callback - 需要重复执行的回调
   * @param {Function} [shouldRepeat] - 是否应该继续重复的判断函数
   * @returns {{ events: Object, touchstart: Function, touchend: Function }} 事件处理器对象
   */
  const createPressHandlers = (callback, shouldRepeat) => {
    /** 内部统一的开始按压逻辑 */
    const onStart = () => startPress(callback, shouldRepeat)

    return {
      // 鼠标事件集合，供 v-on="handlers.events" 绑定
      events: {
        mousedown: (e) => {
          e.preventDefault()
          onStart()
        },
        mouseup: stopPress,
        mouseleave: stopPress,
        contextmenu: (e) => e.preventDefault()
      },
      // 触摸处理器，供 @touchstart.passive 和 @touchend 单独绑定
      // 不调用 preventDefault，因此可以安全标记为 passive
      // 默认触摸行为（如滚动、缩放）通过 CSS touch-action: none 阻止
      touchstart: onStart,
      touchend: stopPress
    }
  }

  // 组件卸载时清理所有定时器
  onBeforeUnmount(stopPress)

  return { startPress, stopPress, createPressHandlers }
}

export default usePressAndRepeat
