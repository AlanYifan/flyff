let ctx = null
let canvasWidth = 0
let canvasHeight = 0
let dpr = 1
let canvasLeft = 0
let canvasTop = 0
let items = []
let timer = 0

const iconCache = new Map()

const getAnimationState = (isCritical, progress) => {
  const k = isCritical
    ? [
      { p: 0, y: 0, s: 1.2, o: 1 },
      { p: 0.25, y: -92, s: 1.62, o: 1 },
      { p: 0.32, y: -89, s: 1.59, o: 0.9 },
      { p: 0.4, y: -91, s: 1.61, o: 0.75 },
      { p: 1, y: -116, s: 1.18, o: 0 }
    ]
    : [
      { p: 0, y: 0, s: 1, o: 1 },
      { p: 0.25, y: -62, s: 1.15, o: 0.9 },
      { p: 0.32, y: -59, s: 1.13, o: 0.85 },
      { p: 0.4, y: -61, s: 1.14, o: 0.8 },
      { p: 1, y: -82, s: 0.85, o: 0 }
    ]
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i]
    const b = k[i + 1]
    if (progress >= a.p && progress <= b.p) {
      const t = (progress - a.p) / (b.p - a.p || 1)
      return { y: a.y + (b.y - a.y) * t, s: a.s + (b.s - a.s) * t, o: a.o + (b.o - a.o) * t }
    }
  }
  const last = k[k.length - 1]
  return { y: last.y, s: last.s, o: last.o }
}

const getElementIndicator = item => {
  if (!item || item.isMiss || item.isHeal || item.isMpHeal) {
    return ''
  }
  const advantageRaw = item.elementAdvantage
  if (advantageRaw === null || advantageRaw === undefined || advantageRaw === '') {
    return ''
  }
  const advantage = Number(advantageRaw)
  if (!Number.isFinite(advantage) || advantage === 1 || advantage === 0) {
    return ''
  }
  return advantage > 1 ? '↑' : '↓'
}

const getElementColor = item => {
  if (!item || item.isMiss || item.isHeal || item.isMpHeal) {
    return null
  }
  const advantageRaw = item.elementAdvantage
  if (advantageRaw === null || advantageRaw === undefined || advantageRaw === '') {
    return null
  }
  const advantage = Number(advantageRaw)
  if (!Number.isFinite(advantage) || advantage === 1 || advantage === 0) {
    return null
  }
  return advantage > 1 ? '#44ff44' : '#ff4444'
}

const getColor = item => {
  if (item.isMiss) {
    return '#cfcfcf'
  }
  if (item.isMpHeal) {
    return '#4488ff'
  }
  if (item.isHeal) {
    return '#44ff44'
  }
  const elementColor = getElementColor(item)
  if (elementColor) {
    return elementColor
  }
  if (item.targetIndex >= 0) {
    return item.isCritical ? '#c9f1ff' : '#4dc3ff'
  }
  return item.isCritical ? '#ffaa00' : '#ff4444'
}

const getText = item => {
  // 暴击时在文字末尾追加"暴击"标识，便于玩家直观识别暴击
  const critSuffix = item.isCritical ? ' 暴击' : ''
  if (typeof item.text === 'string' && item.text) {
    const indicator = getElementIndicator(item)
    const multiplier = item.doubleJudgment ? ' ×2' : ''
    return indicator
      ? `${indicator}${item.text}${multiplier}${critSuffix}`
      : `${item.text}${multiplier}${critSuffix}`
  }
  if (item.isMiss) {
    return 'MISS'
  }
  if (item.isHeal) {
    return `+${item.damage}${critSuffix}`
  }
  const indicator = getElementIndicator(item)
  const baseText = String(item.damage)
  const multiplier = item.doubleJudgment ? ' ×2' : ''
  return indicator
    ? `${indicator}${baseText}${multiplier}${critSuffix}`
    : `${baseText}${multiplier}${critSuffix}`
}

const normalizeIconSrc = value => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

const ensureIconBitmap = src => {
  const normalized = normalizeIconSrc(src)
  if (!normalized) {
    return null
  }
  if (iconCache.has(normalized)) {
    const entry = iconCache.get(normalized)
    if (entry && entry.bitmap) {
      return entry.bitmap
    }
    return null
  }

  iconCache.set(normalized, { bitmap: null, loading: true })
  fetch(normalized)
    .then(res => (res && res.ok ? res.blob() : null))
    .then(blob => (blob ? createImageBitmap(blob) : null))
    .then(bitmap => {
      if (bitmap) {
        iconCache.set(normalized, { bitmap, loading: false })
        return
      }
      iconCache.set(normalized, { bitmap: null, loading: false })
    })
    .catch(() => {
      iconCache.set(normalized, { bitmap: null, loading: false })
    })
  return null
}

const drawFrame = () => {
  if (!ctx || canvasWidth <= 0 || canvasHeight <= 0) {
    timer = setTimeout(drawFrame, 32)
    return
  }
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  const now = Date.now()
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) {
      continue
    }
    const createdAt = item.createdAt ?? item.timestamp ?? now
    const age = now - createdAt
    const progress = Math.max(0, Math.min(1, age / 2500))
    const anim = getAnimationState(Boolean(item.isCritical), progress)
    const baseOpacity = typeof item.opacity === 'number' ? item.opacity : 1
    const opacity = Math.max(0, Math.min(1, baseOpacity * anim.o))
    if (opacity <= 0) {
      continue
    }
    const rawX = Number.isFinite(item.screenXAbs)
      ? item.screenXAbs
      : Number.isFinite(item.screenX)
        ? item.screenX
        : 0
    const rawY = Number.isFinite(item.screenYAbs)
      ? item.screenYAbs
      : Number.isFinite(item.screenY)
        ? item.screenY
        : 0
    const x = rawX - canvasLeft
    const y = rawY - canvasTop
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.translate(x, y + anim.y)
    ctx.scale(anim.s, anim.s)
    const text = getText(item)
    const color = getColor(item)
    const iconSrc = normalizeIconSrc(item.iconSrc)
    const iconWidth = Math.max(0, Math.floor(Number(item.iconWidth) || 0))
    const iconHeight = Math.max(0, Math.floor(Number(item.iconHeight) || 0))
    const gap = iconSrc && iconWidth > 0 && iconHeight > 0 ? 4 : 0
    
    // 双倍惩戒图标配置
    const doubleJudgmentIconSrc = normalizeIconSrc(item.doubleJudgmentIcon)
    const doubleJudgmentIconSize = 16 // 双倍惩戒图标尺寸
    
    let offsetX = 0
    // 绘制前置图标（技能/武器图标）
    if (iconSrc && iconWidth > 0 && iconHeight > 0) {
      const bitmap = ensureIconBitmap(iconSrc)
      if (bitmap) {
        ctx.drawImage(bitmap, 0, 0, iconWidth, iconHeight)
      }
      offsetX = iconWidth + gap
    }
    
    // 计算文字宽度，用于定位双倍惩戒图标
    ctx.font = `bold ${item.isCritical ? 15 : 13}px sans-serif`
    const textWidth = ctx.measureText(text).width
    
    ctx.textBaseline = 'top'
    ctx.lineJoin = 'round'
    ctx.miterLimit = 2
    ctx.lineWidth = item.isCritical ? 4 : 3
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.strokeText(text, offsetX, 0)
    ctx.fillStyle = color
    ctx.fillText(text, offsetX, 0)
    
    // 绘制双倍惩戒图标（在文字后面）
    if (doubleJudgmentIconSrc) {
      const djIconX = offsetX + textWidth + 2 // 文字后面留2px间距
      const djBitmap = ensureIconBitmap(doubleJudgmentIconSrc)
      if (djBitmap) {
        // 垂直居中对齐文字
        const fontSize = item.isCritical ? 15 : 13
        const djIconY = Math.max(0, (fontSize - doubleJudgmentIconSize) / 2)
        ctx.drawImage(djBitmap, djIconX, djIconY, doubleJudgmentIconSize, doubleJudgmentIconSize)
      }
    }
    
    ctx.restore()
  }
  timer = setTimeout(drawFrame, 16)
}

onmessage = event => {
  const data = event?.data || {}
  const type = data?.type
  if (type === 'init') {
    const offscreen = data.canvas
    dpr = Number(data.dpr) || 1
    ctx = offscreen.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(drawFrame, 0)
    return
  }
  if (type === 'size') {
    const width = Math.max(1, Math.floor(Number(data.width) || 0))
    const height = Math.max(1, Math.floor(Number(data.height) || 0))
    dpr = Number(data.dpr) || dpr || 1
    canvasLeft = Number(data.left) || 0
    canvasTop = Number(data.top) || 0
    if (ctx && ctx.canvas) {
      ctx.canvas.width = Math.max(1, Math.floor(width * dpr))
      ctx.canvas.height = Math.max(1, Math.floor(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    canvasWidth = width
    canvasHeight = height
    return
  }
  if (type === 'update') {
    items = Array.isArray(data.items) ? data.items : []
    return
  }
  if (type === 'dispose') {
    items = []
    iconCache.clear()
    if (timer) {
      clearTimeout(timer)
      timer = 0
    }
    ctx = null
  }
}
