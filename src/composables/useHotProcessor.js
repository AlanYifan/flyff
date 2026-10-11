/**
 * @file useHotProcessor.js
 * @description HOT（Heal Over Time）持续治疗效果处理器
 * 处理圣光庇护等BUFF的持续治疗和魔法值恢复效果
 *
 * 业务意图：
 * - 圣光庇护（Q技能）：CD一半时间内每2秒恢复施法者攻击力百分比的生命值
 * - 圣光庇护EX1：持续恢复范围内队员魔法值（施法者攻击力百分比）
 * - 圣光庇护EX2：受伤后恢复本次攻击百分比最大生命值（需在伤害处理时调用）
 *
 * 创建时间：2026-07-29
 * 修改时间：2026-07-29 - 添加圣光庇护HOT/EX2恢复动画事件派发
 */


/**
 * 处理玩家身上的HOT（持续治疗）和MP恢复BUFF效果
 * 每秒由游戏循环调用，内部根据hotTickInterval控制实际触发频率
 * @param {Object} playerVal - 玩家对象（响应式引用的值）
 * @param {Object} gameStore - Pinia gameStore 实例
 * @returns {void}
 */
export function processHotBuffs (playerVal, gameStore) {
  if (!playerVal || !gameStore) return

  const buffs = playerVal.activeBuffs
  if (!Array.isArray(buffs) || buffs.length === 0) return

  const now = Date.now()
  let healthChanged = false
  let manaChanged = false
  let totalHealAmount = 0
  let totalMpAmount = 0
  /** 实际恢复的HP量（考虑满血限制） */
  let actualHealAmount = 0
  /** 实际恢复的MP量（考虑满MP限制） */
  let actualMpAmount = 0

  for (let i = 0; i < buffs.length; i++) {
    const buff = buffs[i]
    if (!buff || typeof buff !== 'object') continue

    // 检查BUFF是否已过期
    const expiresAt = Number(buff.expiresAt ?? buff.endTime ?? 0)
    if (expiresAt > 0 && expiresAt <= now) continue

    // 获取BUFF效果
    const effects = buff.effects || buff.effect
    if (!effects || typeof effects !== 'object') continue

    // 获取HOT触发间隔（秒），默认2秒
    const tickInterval = Number(buff.hotTickInterval || 2)
    const tickIntervalMs = tickInterval * 1000

    // 检查是否到达HOT触发时间
    const lastHotTick = Number(buff._lastHotTick || 0)
    if (lastHotTick > 0 && (now - lastHotTick) < tickIntervalMs) continue

    // 获取施法者攻击力
    const casterAttack = Number(buff.casterAttack || 0)

    // 处理HOT生命值恢复
    const hotEffect = effects.hotAttackPercent
    if (hotEffect) {
      const hotPercent = hotEffect && typeof hotEffect === 'object'
        ? Number(hotEffect.add || 0)
        : Number(hotEffect || 0)
      if (hotPercent > 0 && casterAttack > 0) {
        const healAmount = Math.floor(casterAttack * hotPercent / 100)
        if (healAmount > 0) {
          totalHealAmount += healAmount
          healthChanged = true
        }
      }
    }

    // 处理MP恢复
    const mpEffect = effects.mpRecoveryPercent
    if (mpEffect) {
      const mpPercent = mpEffect && typeof mpEffect === 'object'
        ? Number(mpEffect.add || 0)
        : Number(mpEffect || 0)
      if (mpPercent > 0 && casterAttack > 0) {
        const mpAmount = Math.floor(casterAttack * mpPercent / 100)
        if (mpAmount > 0) {
          totalMpAmount += mpAmount
          manaChanged = true
        }
      }
    }

    // 更新HOT触发时间戳
    buff._lastHotTick = now
  }

  // 应用生命值恢复
  if (healthChanged && totalHealAmount > 0) {
    const maxHealth = Number(playerVal.maxHealth || 0)
    const currentHealth = Number(playerVal.currentHealth || 0)
    const newHealth = Math.min(maxHealth, currentHealth + totalHealAmount)
    if (newHealth > currentHealth) {
      actualHealAmount = newHealth - currentHealth
      playerVal.currentHealth = newHealth
      gameStore.updatePlayer({ currentHealth: newHealth })
    }
  }

  // 应用魔法值恢复
  if (manaChanged && totalMpAmount > 0) {
    const maxMana = Number(playerVal.maxMana || 0)
    const currentMana = Number(playerVal.currentMana || 0)
    const newMana = Math.min(maxMana, currentMana + totalMpAmount)
    if (newMana > currentMana) {
      actualMpAmount = newMana - currentMana
      playerVal.currentMana = newMana
      gameStore.updatePlayer({ currentMana: newMana })
    }
  }

  // 派发HOT恢复动画事件，通知PlayerInfoPanel显示恢复特效
  // 仅当实际有恢复量时才派发，避免满血/满MP时触发无意义的动画
  if (actualHealAmount > 0 || actualMpAmount > 0) {
    window.dispatchEvent(new CustomEvent('hot-recovery', {
      detail: {
        healAmount: actualHealAmount,
        mpAmount: actualMpAmount
      }
    }))
  }
}

/**
 * 处理受伤恢复效果
 * 当玩家拥有圣光庇护EX2的BUFF时，受伤后恢复本次攻击百分比的最大生命值
 * @param {Object} playerVal - 玩家对象
 * @param {number} damageAmount - 本次受到的伤害值
 * @param {Object} gameStore - Pinia gameStore 实例
 * @returns {number} 实际恢复的生命值
 */
export function processDamageRecovery (playerVal, damageAmount, gameStore) {
  if (!playerVal || !gameStore || damageAmount <= 0) return 0

  const buffs = playerVal.activeBuffs
  if (!Array.isArray(buffs) || buffs.length === 0) return 0

  const now = Date.now()
  let totalRecovery = 0

  for (let i = 0; i < buffs.length; i++) {
    const buff = buffs[i]
    if (!buff || typeof buff !== 'object') continue

    // 检查BUFF是否已过期
    const expiresAt = Number(buff.expiresAt ?? buff.endTime ?? 0)
    if (expiresAt > 0 && expiresAt <= now) continue

    const effects = buff.effects || buff.effect
    if (!effects || typeof effects !== 'object') continue

    const recoveryEffect = effects.damageRecoveryPercent
    if (recoveryEffect) {
      const recoveryPercent = recoveryEffect && typeof recoveryEffect === 'object'
        ? Number(recoveryEffect.add || 0)
        : Number(recoveryEffect || 0)
      if (recoveryPercent > 0) {
        const maxHealth = Number(playerVal.maxHealth || 0)
        const recoveryAmount = Math.floor(maxHealth * recoveryPercent / 100)
        totalRecovery += recoveryAmount
      }
    }
  }

  if (totalRecovery > 0) {
    const maxHealth = Number(playerVal.maxHealth || 0)
    const currentHealth = Number(playerVal.currentHealth || 0)
    const newHealth = Math.min(maxHealth, currentHealth + totalRecovery)
    if (newHealth > currentHealth) {
      const actualRecovery = newHealth - currentHealth
      playerVal.currentHealth = newHealth
      gameStore.updatePlayer({ currentHealth: newHealth })
      // 派发HOT恢复动画事件（EX2受伤恢复），通知PlayerInfoPanel显示恢复特效
      window.dispatchEvent(new CustomEvent('hot-recovery', {
        detail: {
          healAmount: actualRecovery,
          mpAmount: 0
        }
      }))
      return actualRecovery
    }
  }

  return 0
}
