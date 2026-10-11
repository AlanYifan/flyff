/**
 * GM权限检测工具
 * 用于在组件中统一判断当前登录用户是否拥有GM权限
 * GM权限来源：服务端登录接口返回的 isGM 字段，由 ApiService 存储到 sessionStorage
 *
 * @file isGM.js
 * @generated 2026-08-13
 */

import { apiService } from '@/services/ApiService'

/**
 * 判断当前用户是否拥有GM权限
 * 与 isDev 不同，isGM 在生产环境也可生效（由服务端账号决定）
 * @returns {boolean}
 */
export function isGM () {
  return apiService.getIsGM()
}

export default isGM
