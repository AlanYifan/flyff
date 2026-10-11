/**
 * 吸血效果工具模块
 * 统一处理吸血效果的生命值恢复逻辑
 * 适用于：普通攻击、AOE技能、DOT伤害、单体技能
 * 
 * @file lifeStealHelper.js
 * @generated 2026-02-18
 */

/**
 * 应用吸血效果
 * 根据伤害和吸血比例恢复玩家生命值
 * 
 * @param {Object} player - 玩家对象
 * @param {number} damage - 造成的伤害值
 * @param {Object} callbacks - 回调函数集合（可选）
 * @param {Function} callbacks.addBattleLog - 添加战斗日志的函数
 * @param {Function} callbacks.onPlayerHeal - 玩家治疗回调，用于触发治疗动画
 * @returns {number} 实际恢复的生命值
 */
export function applyLifeSteal(player, damage, callbacks = null) {
  if (!player || damage <= 0) {
    return 0
  }

  const lifeStealRate = player.lifeSteal || 0
  
  if (lifeStealRate <= 0) {
    return 0
  }

  // lifeStealRate 是百分比形式（0.8 表示 0.8%），需要除以 100
  const healAmount = Math.floor(damage * lifeStealRate / 100)
  
  if (healAmount <= 0) {
    return 0
  }

  const oldHealth = player.currentHealth || 0
  const maxHealth = player.maxHealth || 0

  // 恢复生命值，不超过最大值
  player.currentHealth = Math.min(maxHealth, oldHealth + healAmount)
  
  const actualHeal = player.currentHealth - oldHealth

  // 触发回调
  if (actualHeal > 0) {
    // 触发治疗动画回调
    if (callbacks && typeof callbacks.onPlayerHeal === 'function') {
      callbacks.onPlayerHeal({
        amount: actualHeal,
        source: 'lifeSteal',
        oldHealth,
        newHealth: player.currentHealth,
        maxHealth
      })
    }
  }

  return actualHeal
}

/**
 * 批量应用吸血效果（用于AOE技能）
 * 根据总伤害和吸血比例恢复玩家生命值
 * 
 * @param {Object} player - 玩家对象
 * @param {number} totalDamage - 总伤害值
 * @param {Object} callbacks - 回调函数集合（可选）
 * @returns {number} 实际恢复的生命值
 */
export function applyLifeStealBatch(player, totalDamage, callbacks = null) {
  return applyLifeSteal(player, totalDamage, callbacks)
}

export default {
  applyLifeSteal,
  applyLifeStealBatch
}
