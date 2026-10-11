/**
 * @file pets.js
 * @generated 2026-02-08
 */
import { defineStore } from 'pinia'
import { PET_TYPE } from '@/data/PET_TYPE.js'

/**
 * 宠物成长配置对象（只读，避免响应式包装）
 * 用途/业务意图：提供以 petItemId 为 key 的静态配置映射
 * @type {Readonly<Record<string, Object>>}
 */
const staticPetMap = Object.freeze(
  PET_TYPE && typeof PET_TYPE === 'object' ? PET_TYPE : {}
)
/**
 * 宠物成长配置数组（只读，便于遍历）
 * 用途/业务意图：提供用于展示与列表遍历的配置集合
 * @type {ReadonlyArray<Object>}
 */
const staticPetTypes = Object.freeze(Object.values(staticPetMap))

/**
 * 宠物成长配置数据管理（Pinia Store）
 * 用途/业务意图：统一管理只读的宠物成长配置数据，提供对象映射与数组遍历能力
 * 关键返回：
 * - petTypes：冻结数组，用于遍历展示
 * - petMap：冻结对象，以 petItemId 为 key 快速访问
 */
export const usePetsStore = defineStore('pets', {
  state: () => ({
    staticPetTypes,
    staticPetMap
  }),
  getters: {
    /**
     * 获取宠物成长配置数组（只读）
     * @returns {ReadonlyArray<Object>}
     */
    petTypes: state => state.staticPetTypes,
    /**
     * 获取宠物成长配置对象映射（只读）
     * @returns {Readonly<Record<string, Object>>}
     */
    petMap: state => state.staticPetMap
  }
})
