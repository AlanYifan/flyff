/**
 * 游戏工具函数 - Vue3版本
 */
// 定时器管理
class TimerManager {
  constructor () {
    this.timers = new Map()
  }

  setInterval (callback, interval, identifier) {
    if (identifier && this.timers.has(identifier)) {
      this.clearInterval(identifier)
    }

    const timerId = setInterval(callback, interval)

    if (identifier) {
      this.timers.set(identifier, { id: timerId, type: 'interval' })
    }

    return timerId
  }

  setTimeout (callback, delay, identifier) {
    if (identifier && this.timers.has(identifier)) {
      this.clearTimeout(identifier)
    }

    const timerId = setTimeout(callback, delay)

    if (identifier) {
      this.timers.set(identifier, { id: timerId, type: 'timeout' })
    }

    return timerId
  }

  clearInterval (identifier) {
    if (identifier && this.timers.has(identifier)) {
      const timer = this.timers.get(identifier)
      if (timer.type === 'interval') {
        clearInterval(timer.id)
        this.timers.delete(identifier)
      }
    }
  }

  clearTimeout (identifier) {
    if (identifier && this.timers.has(identifier)) {
      const timer = this.timers.get(identifier)
      if (timer.type === 'timeout') {
        clearTimeout(timer.id)
        this.timers.delete(identifier)
      }
    }
  }

  clearAll () {
    this.timers.forEach(timer => {
      if (timer.type === 'interval') {
        clearInterval(timer.id)
      } else {
        clearTimeout(timer.id)
      }
    })
    this.timers.clear()
  }
}

// 伤害计算
export function calculateDamage (attacker, defender, skillMultiplier = 1) {
  const baseDamage = Math.floor((attacker.minAttack + attacker.maxAttack) / 2) * skillMultiplier
  const defenseReduction = Math.floor((defender.minDefense + defender.maxDefense) / 2) * 0.5
  let damage = Math.max(1, baseDamage - defenseReduction)

  // 暴击计算
  const critChance = attacker.criticalRate || 0.05
  const critMultiplier = attacker.criticalDamage || 1.5

  if (Math.random() < critChance) {
    damage *= critMultiplier
    return { damage: Math.round(damage), isCritical: true }
  }

  return { damage: Math.round(damage), isCritical: false }
}

// 等级经验需求
export function getExpForLevel (level) {
  // 基础经验公式：100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5))
}

// 属性点加成计算
export function calculateAttributeBonus (attributes) {
  return {
    hp: attributes.constitution * 10,
    mp: attributes.intelligence * 15,
    attack: attributes.strength * 2,
    defense: Number(attributes.constitution),
    hitRate: attributes.agility * 0.5,
    dodgeRate: attributes.agility * 0.3
  }
}

// 物品品质颜色
export function getItemQualityColor (quality) {
  const colors = {
    common: '#ffffff', // 白色
    uncommon: '#1eff00', // 绿色
    rare: '#0070dd', // 蓝色
    epic: '#a335ee', // 紫色
    legendary: '#ff8000' // 橙色
  }
  return colors[quality] || colors.common
}

// 格式化数字
export function formatNumber (num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// 生成随机ID
export function generateId () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 防抖函数
export function debounce (func, wait) {
  let timeout
  return function executedFunction (...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle (func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 使元素可拖拽
export function makeElementDraggable (element, handle) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0
  handle.onmousedown = dragMouseDown

  function dragMouseDown (e) {
    e = e || window.event
    e.preventDefault()
    // 获取鼠标位置
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    document.onmousemove = elementDrag
  }

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    // 计算新位置
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // 设置元素的新位置
    element.style.top = element.offsetTop - pos2 + 'px'
    element.style.left = element.offsetLeft - pos1 + 'px'
  }

  function closeDragElement () {
    // 停止移动
    document.onmouseup = null
    document.onmousemove = null
  }
}

// 创建定时器管理器实例
export const timerManager = new TimerManager()

// 根据武器等级获取攻击力倍数
export function getWeaponDamageMultiplier (weaponLevel) {
  if (weaponLevel >= 1 && weaponLevel <= 59) {
    return { minMultiplier: 10, maxMultiplier: 10 }
  } else if (weaponLevel >= 60 && weaponLevel <= 89) {
    return { minMultiplier: 9, maxMultiplier: 9 }
  } else if (weaponLevel >= 90 && weaponLevel <= 104) {
    return { minMultiplier: 8, maxMultiplier: 8 }
  } else if (weaponLevel >= 105 && weaponLevel <= 119) {
    return { minMultiplier: 7, maxMultiplier: 7 }
  } else if (weaponLevel >= 120 && weaponLevel <= 149) {
    return { minMultiplier: 6.5, maxMultiplier: 6.5 }
  } else if (weaponLevel >= 150 && weaponLevel <= 174) {
    return { minMultiplier: 5.5, maxMultiplier: 5.5 }
  } else if (weaponLevel >= 175 && weaponLevel <= 180) {
    return { minMultiplier: 5, maxMultiplier: 5 }
  } else {
    // 默认返回1-59级的倍数
    return { minMultiplier: 10, maxMultiplier: 10 }
  }
}

// 应用武器伤害计算公式到武器
export function applyWeaponDamageFormula (weapon) {
  if (!weapon || typeof weapon.level !== 'number') {
    return weapon
  }

  const multiplier = getWeaponDamageMultiplier(weapon.level)

  // 创建武器副本以避免修改原始对象
  const weaponCopy = { ...weapon }

  // 应用倍数计算最终攻击力
  if (typeof weapon.minAttack === 'number') {
    weaponCopy.minAttack = Math.floor(weapon.minAttack * multiplier.minMultiplier)
  }

  if (typeof weapon.maxAttack === 'number') {
    weaponCopy.maxAttack = Math.floor(weapon.maxAttack * multiplier.maxMultiplier)
  }

  return weaponCopy
}

// 导出所有工具函数
export default {
  timerManager,
  calculateDamage,
  getExpForLevel,
  calculateAttributeBonus,
  getItemQualityColor,
  formatNumber,
  generateId,
  debounce,
  throttle,
  makeElementDraggable,
  getWeaponDamageMultiplier,
  applyWeaponDamageFormula
}
