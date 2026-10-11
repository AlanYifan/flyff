/**
 * 开发环境检测工具
 * 用于统一判断是否为开发环境
 *
 * @file isDev.js
 * @generated 2026-02-17
 */

/**
 * 判断是否为开发环境
 * 仅依赖 Vite 构建变量，不受访问域名影响
 * 构建后 import.meta.env.DEV 恒为 false，确保测试功能在生产环境不可见
 * 注意：不能使用可选链（import.meta?.env?.DEV），
 *   因为 Vite 通过字符串匹配替换 import.meta.env.DEV，
 *   可选链会导致替换不生效，使 isDev 在开发模式下也为 false
 * @returns {boolean}
 */
export const isDev = import.meta.env.DEV === true ||
                     import.meta.env.MODE === 'development'

export default isDev
