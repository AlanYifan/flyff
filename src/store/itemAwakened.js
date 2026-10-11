/**
 * @file itemAwakened.js
 * @generated 2026-02-08
 */
import { defineStore } from 'pinia'
import { ITEM_AWAKENEDS_STATS, ITEM_AWAKENEDS_STATS_LIST } from '@/data/ITEM_AWAKENEDS_STATS.js'

const staticAwakenedMap = Object.freeze(
  ITEM_AWAKENEDS_STATS && typeof ITEM_AWAKENEDS_STATS === 'object' ? ITEM_AWAKENEDS_STATS : {}
)
const staticAwakenedList = Object.freeze(
  Array.isArray(ITEM_AWAKENEDS_STATS_LIST)
    ? ITEM_AWAKENEDS_STATS_LIST
    : Object.values(staticAwakenedMap)
)

/**
 * 物品觉醒词条数据管理（Pinia Store）
 * 用途/业务意图：统一管理只读的“物品觉醒词条”静态数据，避免在组件中进行响应式包装；提供遍历与快速索引能力
 * 关键返回：
 * - awakenedStatsList：冻结数组，用于遍历展示（只读）
 * - awakenedStatsMap：冻结对象，字符串索引 -> 词条（只读）
 * 使用说明：
 * - 数据来源：src/data/ITEM_AWAKENEDS_STATS.js（已冻结，禁止响应式）
 * - 不提供写操作，仅作为只读数据中心
 */
export const useItemAwakenedStore = defineStore('itemAwakened', {
  state: () => ({
    awakenedStatsList: staticAwakenedList,
    awakenedStatsMap: staticAwakenedMap
  }),
  getters: {
    /**
     * 获取觉醒词条数组（只读，避免响应式包装）
     * @returns {ReadonlyArray<Object>}
     */
    awakenedStatsList: state => state.awakenedStatsList,
    /**
     * 获取觉醒词条对象映射（只读，字符串索引 -> 词条）
     * @returns {Readonly<Record<string, Object>>}
     */
    awakenedStatsMap: state => state.awakenedStatsMap
  }
})
