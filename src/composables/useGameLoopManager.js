import { ref, shallowReactive, triggerRef } from 'vue'
import { storageService } from '@/services/StorageService'
import { debounce } from '@/utils/debounce'
import { useGameStore } from '@/store'
import { useRaisedPetSummonStore } from '@/store/raisedPetSummon'
import { PlayerStatsService } from '@/services/PlayerStatsService'
import { processHotBuffs } from '@/composables/useHotProcessor'

const RAISED_PET_ABILITY_BUFF_ID = 'raisedpet_ability'

// BUFF duration 独立存储，避免修改原始对象触发响应式
// key = buff.id, value = 剩余秒数
const buffDurations = shallowReactive(new Map())

// 获取 BUFF duration 的辅助函数（供组件使用）
export const getBuffDuration = (buffId) => {
  return buffDurations.get(String(buffId)) ?? 0
}

// 设置 BUFF duration（供外部调用，添加/刷新 BUFF 时使用）
export const setBuffDuration = (buffId, duration) => {
  buffDurations.set(String(buffId), duration)
}

// 清除 BUFF duration（供外部调用，移除 BUFF 时使用）
export const clearBuffDuration = (buffId) => {
  buffDurations.delete(String(buffId))
}

// 清除所有 BUFF duration（供重置时使用）
export const clearAllBuffDurations = () => {
  buffDurations.clear()
}

// 性能优化：将繁重操作延迟到 RAF 中执行
const scheduleHeavyWork = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      // 使用 setTimeout(0) 确保 RAF 之后执行，避免阻塞渲染
      setTimeout(callback, 0)
    })
  } else {
    setTimeout(callback, 0)
  }
}

// 防抖标志，避免连续触发属性重算
let statsRecalcScheduled = false
const scheduleStatsRecalc = (player, gameStore, scheduleSave, forceClearCache = false) => {
  if (statsRecalcScheduled) {return}
  statsRecalcScheduled = true

  scheduleHeavyWork(() => {
    statsRecalcScheduled = false
    try {
      // 如果强制清除缓存（如 BUFF 过期），先清除
      if (forceClearCache) {
        PlayerStatsService.clearAllCache()
      }
      const equipmentSets = gameStore?.equipmentSets || []
      if (player.value && typeof player.value.applyFinalStats === 'function') {
        player.value.applyFinalStats(equipmentSets)
      }
      // 强制触发 Vue 响应式更新：使用 triggerRef 原地触发，避免创建新对象增加 GC 压力
      // applyFinalStats 已就地修改 player 对象属性，triggerRef 通知依赖重新计算
      if (gameStore && typeof gameStore.updatePlayer === 'function') {
        triggerRef(player)
      }
      scheduleSave(player.value)
    } catch (error) {
      console.warn('[useGameLoopManager] 属性重算失败:', error)
    }
  })
}

/**
 * 检查玩家是否拥有 mp_maintain 类型BUFF，若有则将MP维持满值
 * 用途/业务意图：钻石商店物品「无敌魔力多」(ID:5883) 使用后创建 mp_maintain BUFF，
 * BUFF持续期间每秒将 currentMana 设置为 maxMana，确保MP始终维持满值
 * @param {Object} playerVal - 当前玩家对象
 * @param {Object} gameStore - Pinia gameStore 实例
 * @returns {void}
 */
const maintainMpIfNeeded = (playerVal, gameStore) => {
  if (!playerVal || !gameStore) return
  const buffs = playerVal.activeBuffs
  if (!Array.isArray(buffs) || buffs.length === 0) return

  // 检查是否存在 mp_maintain 类型且未过期的BUFF
  const now = Date.now()
  const hasMpMaintain = buffs.some(buff => {
    if (!buff || buff.type !== 'mp_maintain') return false
    const expiresAt = Number(buff.expiresAt ?? 0)
    // 未设置过期时间或尚未过期
    return expiresAt <= 0 || expiresAt > now
  })

  if (hasMpMaintain) {
    const maxMana = Number(playerVal.maxMana ?? 0)
    if (maxMana > 0 && Number(playerVal.currentMana ?? 0) < maxMana) {
      playerVal.currentMana = maxMana
      // 同步更新 gameStore 确保响应式更新
      gameStore.updatePlayer({ currentMana: maxMana })
    }
  }
}

/**
 * 游戏循环管理组合式API
 * 将游戏循环和定时器相关的逻辑从Main.vue中抽离出来
 */
export function useGameLoopManager (
  player,
  activeBuffs,
  skills,
  monsters,
  gameSettings,
  updateDamageNumbers = null,
  updateExpNumbers = null
) {
  const buffTimer = ref(null)
  const monsterRefreshTimer = ref(null)
  const skillCooldownTimer = ref(null)
  const gameLoopTimer = ref(null)

  const timeoutIds = ref([])
  const isUnmounted = ref(false)
  let lastExpUpdateAt = 0

  // buffDurations 定期清理：每5分钟清理一次剩余时间为0或已过期的条目
  // 防止长时间运行后Map中堆积大量过期条目
  let buffDurationCleanupTimer = null
  const startBuffDurationCleanup = () => {
    if (buffDurationCleanupTimer) return
    buffDurationCleanupTimer = setInterval(() => {
      if (isUnmounted.value) return
      try {
        const nowMs = Date.now()
        let cleanedCount = 0
        for (const [buffId, duration] of buffDurations.entries()) {
          // 清理剩余时间<=0的条目
          if (typeof duration === 'number' && duration <= 0) {
            buffDurations.delete(buffId)
            cleanedCount++
          }
        }
        if (cleanedCount > 0) {
          // 有条目被清理
        }
      } catch (error) {
        console.warn('[useGameLoopManager] buffDurations清理出错:', error)
      }
    }, 300000) // 5分钟清理一次
  }

  // storageService 已通过 import 导入全局单例
  const scheduleSave = debounce((playerData) => {
    try {
      storageService.savePlayerData(playerData)
    } catch (error) {
      console.error('[useGameLoopManager] BUFF过期存档保存失败:', error)
    }
  }, 1000)

  const startGameLoop = () => {
    isUnmounted.value = false
    lastExpUpdateAt = 0
    startBuffTimer()
    startSkillCooldownTimer()
    startMonsterRefreshTimer()
    startBuffDurationCleanup()

    if (updateDamageNumbers && typeof updateDamageNumbers === 'function') {
      gameLoopTimer.value = setInterval(() => {
        if (isUnmounted.value) {
          return
        }
        try {
          updateDamageNumbers()
          if (updateExpNumbers && typeof updateExpNumbers === 'function') {
            const now = Date.now()
            if (lastExpUpdateAt === 0 || now - lastExpUpdateAt >= 200) {
              lastExpUpdateAt = now
              updateExpNumbers()
            }
          }
        } catch (error) {
          console.warn('[useGameLoopManager] 游戏循环更新出错:', error)
          // 如果出错，停止定时器
          clearGameLoopTimer()
        }
      }, 100)
    }
  }

  // 启动BUFF计时器
  const startBuffTimer = () => {
    // 使用 setTimeout 替代 RAF
    let lastTickTime = Date.now()
    const TICK_INTERVAL = 1000

    const tick = () => {
      const tickStart = performance.now()
      
      if (isUnmounted.value) {
        return
      }

      const now = Date.now()
      const elapsed = now - lastTickTime
      if (elapsed < TICK_INTERVAL) {
        buffTimer.value = setTimeout(tick, TICK_INTERVAL - elapsed)
        return
      }

      lastTickTime = now

      try {
        const t1 = performance.now()
        const playerVal = player.value
        const t2 = performance.now()
        
        if (!playerVal) {
          buffTimer.value = setTimeout(tick, TICK_INTERVAL)
          return
        }
        
        const t3 = performance.now()
        let buffs = playerVal.activeBuffs
        const t4 = performance.now()
        
        if (!buffs) {
          playerVal.activeBuffs = []
          buffTimer.value = setTimeout(tick, TICK_INTERVAL)
          return
        }

        const buffsLen = buffs.length
        if (buffsLen === 0) {
          buffTimer.value = setTimeout(tick, TICK_INTERVAL)
          return
        }

        const t5 = performance.now()
        const nowMs = Date.now()
        // 检查是否有任何过期（优先检查 expiresAt 时间戳，其次检查 buffDurations Map，最后检查原始 duration）
        let hasExpired = false
        for (let i = 0; i < buffsLen; i++) {
          const buff = buffs[i]
          const buffId = String(buff.id)

          // 优先检查 expiresAt 时间戳（物品BUFF 使用此字段）
          const expiresAt = Number(buff.expiresAt ?? 0)
          if (expiresAt > 0 && expiresAt <= nowMs) {
            hasExpired = true
            break
          }

          const currentDuration = buffDurations.get(buffId) ?? buff.duration
          // 如果当前剩余时间 <= 1，则本次tick后会过期
          // 但有 expiresAt 绝对时间戳的BUFF（如捡宠）不通过 duration 判断过期
          if (expiresAt <= 0 && currentDuration <= 1) {
            hasExpired = true
            break
          }
        }
        const t6 = performance.now()

        // 如果没有过期的 buff，只减少 duration
        if (!hasExpired) {
          // 更新独立的 duration Map，而不是修改 BUFF 对象
          // shallowReactive Map 的更新是 O(1) 且不会触发整个列表重渲染
          for (let i = 0; i < buffsLen; i++) {
            const buffId = String(buffs[i].id)
            // 同步 expiresAt 到 buffDurations，确保时间戳不一致时以 expiresAt 为准
            const expiresAt = Number(buffs[i].expiresAt ?? 0)
            if (expiresAt > 0) {
              const remainingFromExpiry = Math.ceil((expiresAt - nowMs) / 1000)
              if (remainingFromExpiry <= 0) {
                // 已通过 expiresAt 过期但之前漏检，强制标记过期
                buffDurations.set(buffId, 0)
                hasExpired = true
                continue
              }
              const currentDuration = buffDurations.get(buffId) ?? buffs[i].duration
              // 如果 buffDurations 与 expiresAt 计算的剩余时间差异过大，以 expiresAt 为准
              if (Math.abs(currentDuration - remainingFromExpiry) > 2) {
                buffDurations.set(buffId, remainingFromExpiry)
              } else {
                buffDurations.set(buffId, currentDuration - 1)
              }
            } else {
              const currentDuration = buffDurations.get(buffId) ?? buffs[i].duration
              buffDurations.set(buffId, currentDuration - 1)
            }
          }

          // 如果在同步过程中发现过期buff，走过期处理逻辑
          if (hasExpired) {
            // 继续到下面的过期处理逻辑
          } else {
            // 无过期BUFF：检查mp_maintain BUFF，维持MP满值
            const gameStore = useGameStore()
            maintainMpIfNeeded(playerVal, gameStore)
            // 处理HOT（持续治疗）和MP恢复效果
            processHotBuffs(playerVal, gameStore)
            buffTimer.value = setTimeout(tick, TICK_INTERVAL)
            return
          }
        }

        // 有过期 buff - 使用 setTimeout(0) 延迟处理，避免阻塞当前帧
        setTimeout(() => {
          if (isUnmounted.value || !playerVal) {return}

          // 获取 gameStore 以便直接修改 store 中的数据
          const gameStore = useGameStore()
          if (!gameStore || !gameStore.player) {return}

          // 直接从 store 获取 activeBuffs，确保修改能被响应式系统追踪
          const storeBuffs = gameStore.player.activeBuffs
          if (!storeBuffs || storeBuffs.length === 0) {return}

          const currentLen = storeBuffs.length
          // 收集需要保留的 BUFF 和需要移除的 BUFF ID
          const survivingBuffs = []
          const expiredBuffIds = []
          let raisedPetBuffExpired = false

          const nowMsInner = Date.now()
          for (let i = 0; i < currentLen; i++) {
            const buff = storeBuffs[i]
            const buffId = String(buff.id)

            // 优先检查 expiresAt 时间戳判断是否过期，回退到 endTime
            const expiresAt = Number(buff.expiresAt ?? buff.endTime ?? 0)
            const isExpiredByTimestamp = expiresAt > 0 && expiresAt <= nowMsInner

            const currentDuration = buffDurations.get(buffId) ?? buff.duration
            // 对于有 expiresAt/endTime 绝对时间戳的BUFF（如捡宠），只有时间戳到期才算过期，
            // 不因 duration 计数器减到1而误判过期（duration可能与expiresAt不同步）
            const isExpiredByDuration = expiresAt <= 0 && currentDuration <= 1

            if (isExpiredByTimestamp || isExpiredByDuration) {
              // BUFF过期：清除 buffDurations Map 中的缓存
              buffDurations.delete(buffId)
              expiredBuffIds.push(buffId)
              if (buffId === RAISED_PET_ABILITY_BUFF_ID || buff?.source === 'raisedpet') {
                raisedPetBuffExpired = true
              }
            } else {
              // BUFF未过期，更新 duration 并保留
              buff.duration = currentDuration - 1
              buffDurations.set(buffId, currentDuration - 1)
              survivingBuffs.push(buff)
            }
          }

          // 直接更新 store 中的 activeBuffs，确保响应式更新和存档同步
          if (expiredBuffIds.length > 0) {
            // 使用 store 的 updatePlayer 方法更新，触发响应式更新
            gameStore.updatePlayer({ activeBuffs: survivingBuffs })
            // 递增 buffVersion，通知所有依赖 buffVersion 的组件刷新
            // 因为 activeBuffs 使用 markRaw 包装，仅替换引用可能被后续
            // scheduleStatsRecalc 中的 gameStore.player = updatedPlayer 操作抵消
            // 必须通过 buffVersion 强制刷新 PlayerInfoPanel 等组件的 BUFF 检测 computed
            gameStore.buffVersion++
          }

          if (raisedPetBuffExpired) {
            scheduleHeavyWork(() => {
              try {
                const raisedPetSummonStore = useRaisedPetSummonStore()
                if (raisedPetSummonStore && typeof raisedPetSummonStore.setSummonedPetEnergy === 'function') {
                  raisedPetSummonStore.setSummonedPetEnergy(0)
                }
              } catch (e) {
                console.warn('[useGameLoopManager] 清空宠物能量失败:', e)
              }
            })
          }

          // 过期BUFF处理完毕后：检查mp_maintain BUFF，维持MP满值
          maintainMpIfNeeded(playerVal, gameStore)
          // 处理HOT（持续治疗）和MP恢复效果
          processHotBuffs(playerVal, gameStore)

          // BUFF 过期后强制清除缓存并重新计算属性
          scheduleStatsRecalc(player, gameStore, scheduleSave, true)
        }, 0)
      } catch (error) {
        console.warn('[useGameLoopManager] BUFF计时器更新出错:', error)
      }

      buffTimer.value = setTimeout(tick, TICK_INTERVAL)
    }

    buffTimer.value = setTimeout(tick, TICK_INTERVAL)
  }

  // 启动技能冷却计时器
  const startSkillCooldownTimer = () => {
  }

  // 启动怪物刷新计时器
  const startMonsterRefreshTimer = () => {
    let lastTickAt = Date.now()
    const intervalMs = 10000
    const tick = () => {
      if (isUnmounted.value) {
        monsterRefreshTimer.value = null
        return
      }
      try {
        const now = Date.now()
        const elapsed = now - lastTickAt
        if (elapsed >= intervalMs) {
          lastTickAt += Math.floor(elapsed / intervalMs) * intervalMs
          // 防止 lastTickAt 严重落后当前时间
          if (now - lastTickAt > intervalMs) {
            lastTickAt = now
          }
          if (gameSettings.value?.autoBattle) {
            const allDefeated = monsters.value.every(
              monster => monster && (monster.currentHealth <= 0 || monster.isDefeated)
            )
            if (allDefeated) {
              // 这里应该调用刷新怪物的函数，但当前为空
            }
          }
        }
        // 使用 setTimeout 替代 RAF
        monsterRefreshTimer.value = setTimeout(tick, 1000)
      } catch (error) {
        console.warn('[useGameLoopManager] 怪物刷新计时器更新出错:', error)
        clearMonsterRefreshTimer()
      }
    }
    monsterRefreshTimer.value = setTimeout(tick, 1000)
  }

  // 清除BUFF计时器
  const clearBuffTimer = () => {
    if (buffTimer.value) {
      clearTimeout(buffTimer.value)
      buffTimer.value = null
    }
  }

  // 清除怪物刷新计时器
  const clearMonsterRefreshTimer = () => {
    if (monsterRefreshTimer.value) {
      clearTimeout(monsterRefreshTimer.value)
      monsterRefreshTimer.value = null
    }
  }

  // 清除技能冷却计时器
  const clearSkillCooldownTimer = () => {
    if (skillCooldownTimer.value) {
      clearInterval(skillCooldownTimer.value)
      skillCooldownTimer.value = null
    }
  }

  // 清除游戏循环计时器
  const clearGameLoopTimer = () => {
    if (gameLoopTimer.value) {
      clearInterval(gameLoopTimer.value)
      gameLoopTimer.value = null
    }
  }

  // 添加setTimeout ID到跟踪列表
  const addTimeoutId = timeoutId => {
    timeoutIds.value.push(timeoutId)
  }

  // 清除所有setTimeout
  const clearAllTimeouts = () => {
    timeoutIds.value.forEach(id => {
      clearTimeout(id)
    })
    timeoutIds.value = []
  }

  const cleanupAllTimers = () => {
    isUnmounted.value = true
    clearBuffTimer()
    clearMonsterRefreshTimer()
    clearSkillCooldownTimer()
    clearGameLoopTimer()
    clearAllTimeouts()
    if (buffDurationCleanupTimer) {
      clearInterval(buffDurationCleanupTimer)
      buffDurationCleanupTimer = null
    }
  }

  // 暴露给外部使用的属性和方法
  return {
    // 方法
    startGameLoop,
    startBuffTimer,
    startSkillCooldownTimer,
    startMonsterRefreshTimer,
    clearBuffTimer,
    clearMonsterRefreshTimer,
    clearSkillCooldownTimer,
    clearGameLoopTimer,
    clearAllTimeouts,
    cleanupAllTimers,
    addTimeoutId
  }
}
