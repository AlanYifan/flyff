/**
 * 怪物管理组合式函数（Composables，组合式函数）
 * 统一通过 monsters Store 读取/刷新怪物，避免组件内重复逻辑与状态分散。
 *
 * @file useMonsterManager.js
 * @generated 2026-01-31
 */
import { computed } from 'vue'
import { useMonstersStore } from '@/store/monsters'
import { usePlayer } from './usePlayer'

/**
 * 提供怪物列表、刷新能力与基础工具方法（供自动战斗/地图战斗复用）。
 * @param {any} _gameData - 预留参数（旧接口兼容），当前不使用。
 * @param {import('vue').Ref<any>} currentMap - 当前地图信息引用。
 * @param {import('vue').Ref<any>} userSettings - 用户设置引用（用于怪物显示数量等）。
 * @param {import('vue').Ref<boolean>} autoBattle - 自动战斗开关引用。
 * @returns {{
 *  currentMonsters: import('vue').ComputedRef<any[]>,
 *  aliveMonsters: import('vue').ComputedRef<any[]>,
 *  allDefeated: import('vue').ComputedRef<boolean>,
 *  aliveCount: import('vue').ComputedRef<number>,
 *  getMonsterDisplayName: (monster: any) => string,
 *  getMonsterIcon: (monsterId: any) => string,
 *  clearMonsterDotEffects: (monster: any) => void,
 *  refreshMonsters: (onRefreshComplete?: Function | null) => void,
 *  checkAndRefreshMonsters: (onRefreshComplete?: Function | null) => void,
 *  autoRefreshMonsters: () => void,
 *  createMonsterWithFullData: (index: number, monsterData: any) => void,
 *  initMonsters: () => void,
 *  loadMonsterData: () => void,
 *  monstersStore: any
 * }}
 */
export function useMonsterManager (
  _gameData,
  currentMap,
  userSettings,
  autoBattle
) {
  const { addBattleLog } = usePlayer()

  // 获取统一的 monsters Store
  const monstersStore = useMonstersStore()

  // ========== 计算属性 ==========

  /**
   * 获取当前怪物数组（响应式）
   */
  const currentMonsters = computed(() => monstersStore.currentMonsters)

  /**
   * 获取存活的怪物
   */
  const aliveMonsters = computed(() => monstersStore.aliveMonsters)

  /**
   * 检查是否所有怪物都被击败
   */
  const allDefeated = computed(() => monstersStore.allDefeated)

  /**
   * 获取存活怪物数量
   */
  const aliveCount = computed(() => monstersStore.aliveCount)

  // ========== 工具方法 ==========

  /**
   * 获取怪物显示名称（包含 rank 信息）
   */
  const getMonsterDisplayName = monster => {
    return monstersStore.getMonsterDisplayName(monster)
  }

  /**
   * 获取怪物图标路径
   */
  const getMonsterIcon = monsterId => {
    return monstersStore.getMonsterIcon(monsterId)
  }

  /**
   * 清除怪物的DOT效果
   */
  const clearMonsterDotEffects = monster => {
    if (!monster) {
      return
    }

    const index = monster.index
    if (index !== undefined) {
      monstersStore.clearMonsterDotEffects(index)
    } else {
      // 如果没有索引，直接清除
      if (monster.dotEffects) {
        monster.dotEffects.forEach(dotEffect => {
          if (dotEffect.timerId) {
            clearInterval(dotEffect.timerId)
          }
        })
        monster.dotEffects = []
      }
    }
  }

  // ========== 怪物刷新方法 ==========

  /**
   * 刷新怪物（基于当前地图和设置）
   * @param {Function} onRefreshComplete - 刷新完成回调
   */
  const refreshMonsters = (onRefreshComplete = null) => {
    // 检查是否正在刷新
    if (monstersStore.isRefreshing) {
      return
    }

    // 检查是否开启了自动战斗
    if (!autoBattle.value) {
      return
    }

    // 获取当前地图信息
    const map = currentMap.value
    if (!map) {
      console.error('[useMonsterManager] 无法获取当前地图信息')
      if (typeof addBattleLog === 'function') {
        addBattleLog('无法获取当前地图信息，刷新怪物失败', 'error')
      }
      return
    }

    // 获取显示数量
    const displayCount = userSettings.value?.monsterDisplayCount || 5

    // 调用 Store 的刷新方法
    monstersStore.refreshMonsters(displayCount, null)

    // 延迟调用回调（等待刷新完成）
    if (onRefreshComplete && typeof onRefreshComplete === 'function') {
      setTimeout(() => {
        onRefreshComplete()
      }, monstersStore.refreshInterval + 100)
    }
  }

  /**
   * 检查并刷新怪物（参考old版实现）
   * @param {Function} onRefreshComplete - 刷新完成回调
   */
  const checkAndRefreshMonsters = (onRefreshComplete = null) => {
    // 检查是否开启了自动战斗
    if (!autoBattle.value) {
      return
    }

    // 检查是否所有怪物都已被击败
    if (!monstersStore.allDefeated) {
      return
    }

    // 获取当前地图信息
    const map = currentMap.value
    if (!map) {
      console.error('[useMonsterManager] 无法获取当前地图信息')
      if (typeof addBattleLog === 'function') {
        addBattleLog('无法获取当前地图信息，刷新怪物失败', 'error')
      }
      return
    }

    // 从存储中获取等级限制设置和怪物显示数量
    const displayCount = userSettings.value?.monsterDisplayCount || 5

    // 调用 Store 的刷新方法
    monstersStore.refreshMonsters(displayCount, 1500)

    // 调用刷新完成的回调函数（用于重新启动自动战斗）
    if (onRefreshComplete && typeof onRefreshComplete === 'function') {
      setTimeout(() => {
        onRefreshComplete()
      }, 1500 + 100)
    }
  }

  /**
   * 自动刷新怪物（参考old版实现）
   */
  const autoRefreshMonsters = () => {
    // 检查是否开启了自动战斗
    if (!autoBattle.value) {
      return
    }

    // 检查是否所有怪物都已被击败
    if (!monstersStore.allDefeated) {
      return
    }

    // 清除当前所有怪物的DOT效果
    monstersStore.currentMonsters.forEach((monster, index) => {
      if (monster) {
        monstersStore.clearMonsterDotEffects(index)
      }
    })

    // 获取新一批怪物
    refreshMonsters()
  }

  /**
   * 创建带有完整数据的怪物（保留旧接口兼容性）
   * @param {number} index - 怪物索引
   * @param {Object} monsterData - 怪物数据
   */
  const createMonsterWithFullData = (index, monsterData) => {
    // 使用 Store 的方法创建怪物实例
    const monsterInstance = monstersStore.createMonsterInstance(index, monsterData)

    // 直接设置到 Store 中
    monstersStore.currentMonsters[index] = monsterInstance
  }

  // ========== 初始化方法 ==========

  /**
   * 初始化怪物（加载静态数据并生成初始怪物）
   * 基于当前地图与用户设置生成初始怪物
   */
  const initMonsters = () => {
    try {
      const map = currentMap.value
      if (!map?.name || !map?.levelRange) {
        console.error('[useMonsterManager] 无法获取当前地图信息，初始化怪物失败')
        if (typeof addBattleLog === 'function') {
          addBattleLog('无法获取当前地图信息，初始化怪物失败', 'error')
        }
        return
      }

      const displayCount = userSettings.value?.monsterDisplayCount || 5
      monstersStore.spawnMonsters(map.name, map.levelRange, displayCount)
    } catch (error) {
      console.error('[useMonsterManager] 初始化怪物失败:', error)
      if (typeof addBattleLog === 'function') {
        addBattleLog('初始化怪物失败，请稍后重试', 'error')
      }
    }
  }

  /**
   * 初始化怪物数据（在游戏初始化时调用）
   */
  const loadMonsterData = () => {
  }

  // ========== 暴露给外部使用的属性和方法 ==========

  return {
    // 响应式数据
    currentMonsters,
    aliveMonsters,
    allDefeated,
    aliveCount,

    // 工具方法
    getMonsterDisplayName,
    getMonsterIcon,
    clearMonsterDotEffects,

    // 刷新方法
    refreshMonsters,
    checkAndRefreshMonsters,
    autoRefreshMonsters,

    // 兼容旧接口
    createMonsterWithFullData,

    // 初始化方法
    initMonsters,
    loadMonsterData,

    // Store 实例（供直接访问）
    monstersStore
  }
}
