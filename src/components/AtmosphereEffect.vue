<template>
  <div v-if="showText" :class="themeClass">{{ text }}</div>
  <div v-if="showRainEffect" class="festival-rain" :style="effectContainerStyle">
    <span
      v-for="item in rainItems"
      :key="item.key"
      class="festival-rain__drop"
      :style="item.style"
    />
  </div>
  <div v-if="showSnowEffect" class="festival-snow" :style="effectContainerStyle">
    <span
      v-for="item in snowItems"
      :key="item.key"
      class="festival-snow__flake"
      :style="item.style"
    >
      {{ item.symbol }}
    </span>
  </div>
  <div v-if="showSunnyEffect" class="festival-sunny" :style="effectContainerStyle">
    <div class="festival-sunny__glow" />
    <div class="festival-sunny__sun" />
    <span
      v-for="item in sunnyItems"
      :key="item.key"
      class="festival-sunny__spark"
      :style="item.style"
    />
  </div>
  <div v-if="showDecorations" class="festival-decor" :style="decorContainerStyle">
    <span
      v-for="item in decorationItems"
      :key="item.key"
      class="festival-decor__item"
      :class="item.className"
      :style="item.style"
    >
      <span class="festival-decor__symbol">{{ item.symbol }}</span>
    </span>
  </div>
  <div v-if="showFireworksEffect" class="festival-fireworks" :style="fireworksContainerStyle">
    <span
      v-for="item in fireworksItems"
      :key="item.key"
      class="festival-fireworks__burst"
      :style="item.style"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'auto'
  },
  date: {
    type: [Date, String, Number],
    default: null
  },
  animated: {
    type: Boolean,
    default: false
  },
  effect: {
    type: String,
    default: ''
  },
  showRain: {
    type: Boolean,
    default: false
  },
  showSnow: {
    type: Boolean,
    default: false
  },
  showSunny: {
    type: Boolean,
    default: false
  },
  allowRainInFestival: {
    type: Boolean,
    default: false
  },
  decorDensity: {
    type: Number,
    default: null
  },
  rainDensity: {
    type: Number,
    default: 50
  },
  fullScreen: {
    type: Boolean,
    default: true
  },
  enableDecorations: {
    type: Boolean,
    default: true
  }
})

const normalizeDate = value => {
  if (!value) {
    return new Date()
  }
  const normalized = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(normalized.getTime())) {
    return new Date()
  }
  return normalized
}

const parseChineseMonth = value => {
  if (!value) {
    return null
  }
  const raw = value.replace('闰', '').replace('月', '').trim()
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  const map = {
    正: 1,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
    十一: 11,
    十二: 12
  }
  return map[raw] || null
}

const parseChineseDay = value => {
  if (!value) {
    return null
  }
  const raw = value.replace('日', '').replace('号', '').trim()
  const numeric = Number(raw)
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric
  }
  const map = {
    初一: 1,
    初二: 2,
    初三: 3,
    初四: 4,
    初五: 5,
    初六: 6,
    初七: 7,
    初八: 8,
    初九: 9,
    初十: 10,
    十一: 11,
    十二: 12,
    十三: 13,
    十四: 14,
    十五: 15,
    十六: 16,
    十七: 17,
    十八: 18,
    十九: 19,
    二十: 20,
    廿一: 21,
    廿二: 22,
    廿三: 23,
    廿四: 24,
    廿五: 25,
    廿六: 26,
    廿七: 27,
    廿八: 28,
    廿九: 29,
    三十: 30
  }
  return map[raw] || null
}

const getLunarMonthDay = date => {
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'numeric',
      day: 'numeric'
    })
    const parts = formatter.formatToParts(date)
    const monthPart = parts.find(part => part.type === 'month')?.value
    const dayPart = parts.find(part => part.type === 'day')?.value
    return {
      month: parseChineseMonth(monthPart),
      day: parseChineseDay(dayPart)
    }
  } catch (error) {
    return { month: null, day: null }
  }
}

const getLunarNewYearDate = year => {
  for (let i = 0; i < 60; i += 1) {
    const date = new Date(year, 0, 1 + i)
    const { month, day } = getLunarMonthDay(date)
    if (month === 1 && day === 1) {
      return date
    }
  }
  return null
}

const isWithinSpringFestivalWindow = date => {
  const lunarNewYear = getLunarNewYearDate(date.getFullYear())
  if (!lunarNewYear) {
    return false
  }
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.ceil((lunarNewYear.getTime() - today.getTime()) / 86400000)
  return diffDays >= 0 && diffDays <= 30
}

const resolveTheme = date => {
  if (date.getMonth() === 11) {
    return 'christmas'
  }
  if (isWithinSpringFestivalWindow(date)) {
    return 'spring'
  }
  return 'default'
}

const resolvedTheme = computed(() => {
  if (props.theme && props.theme !== 'auto') {
    return props.theme
  }
  return resolveTheme(normalizeDate(props.date))
})

const showText = computed(() => props.text && props.text.trim().length > 0)

const themeClass = computed(() => ({
  'festival-text': true,
  'festival-text--spring': resolvedTheme.value === 'spring',
  'festival-text--christmas': resolvedTheme.value === 'christmas',
  'festival-text--animated': props.animated
}))

const showRainEffect = computed(() => {
  if (!(props.showRain || props.effect === 'rain')) {
    return false
  }
  if (props.allowRainInFestival) {
    return true
  }
  return resolvedTheme.value === 'default'
})
const showSnowEffect = computed(
  () => props.showSnow || props.effect === 'snow' || (resolvedTheme.value === 'christmas' && !showText.value)
)
const showSunnyEffect = computed(() => props.showSunny || props.effect === 'sunny')

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max)

const normalizeDensity = value => {
  if (!Number.isFinite(value)) {
    return 50
  }
  return clampNumber(value, 0, 100)
}

const effectDensity = computed(() => normalizeDensity(props.rainDensity))
const decorationDensity = computed(() =>
  normalizeDensity(props.decorDensity ?? props.rainDensity)
)
const fallDurationScale = 1
const rotationSpanDegrees = 5000
const rotationHalfSpanDegrees = rotationSpanDegrees / 2

const rainPalette = computed(() => {
  if (resolvedTheme.value === 'spring') {
    return ['#ff5f5f', '#ffb347', '#ffd166', '#ff8fab']
  }
  if (resolvedTheme.value === 'christmas') {
    return ['#7dd3fc', '#a7f3d0', '#f9fafb', '#34d399']
  }
  return ['#f5d48a', '#ffe6a7', '#fef3c7', '#fca5a5']
})

const rainCount = computed(() => {
  const density = effectDensity.value
  return Math.max(5, Math.round((density / 100) * 80))
})

const effectContainerStyle = computed(() => ({
  position: props.fullScreen ? 'fixed' : 'absolute',
  inset: '0',
  pointerEvents: 'none',
  zIndex: 1
}))

const decorContainerStyle = computed(() => ({
  position: props.fullScreen ? 'fixed' : 'absolute',
  inset: '0',
  pointerEvents: 'none',
  zIndex: 2
}))

const fireworksContainerStyle = computed(() => ({
  position: props.fullScreen ? 'fixed' : 'absolute',
  inset: '0',
  pointerEvents: 'none',
  zIndex: 3
}))

const createSeed = (index, themeKey) => {
  let seed = index * 9301 + themeKey.length * 49297
  seed %= 233280
  return seed
}

const seededRandom = seed => {
  const next = (seed * 9301 + 49297) % 233280
  return { value: next / 233280, seed: next }
}

const rainItems = computed(() => {
  const count = rainCount.value
  const colors = rainPalette.value
  const themeKey = resolvedTheme.value
  return Array.from({ length: count }, (_, index) => {
    let seed = createSeed(index, themeKey)
    let next = seededRandom(seed)
    const left = next.value * 100
    seed = next.seed
    next = seededRandom(seed)
    const length = 30 + next.value * 80
    seed = next.seed
    next = seededRandom(seed)
    const thickness = 1 + next.value * 1.6
    seed = next.seed
    next = seededRandom(seed)
    const duration = 1.2 + next.value * 1.6
    const adjustedDuration = duration * fallDurationScale
    seed = next.seed
    next = seededRandom(seed)
    const delay = -next.value * adjustedDuration
    seed = next.seed
    next = seededRandom(seed)
    const opacity = 0.35 + next.value * 0.45
    seed = next.seed
    next = seededRandom(seed)
    const drift = -28 + next.value * 56
    const color = colors[index % colors.length]
    return {
      key: `${themeKey}-${index}`,
      style: {
        left: `${left}%`,
        width: `${thickness}px`,
        height: `${length}px`,
        color,
        opacity,
        '--rain-drift': `${drift}px`,
        animationDuration: `${adjustedDuration}s`,
        animationDelay: `${delay}s`
      }
    }
  })
})

const snowPalette = computed(() => {
  if (resolvedTheme.value === 'christmas') {
    return ['#f8fafc', '#e2e8f0', '#cbd5f5', '#bae6fd']
  }
  if (resolvedTheme.value === 'spring') {
    return ['#fff7ed', '#fef9c3', '#e0f2fe', '#fde68a']
  }
  return ['#ffffff', '#e2e8f0', '#dbeafe', '#bfdbfe']
})

const snowCount = computed(() => {
  const density = effectDensity.value
  return Math.max(8, Math.round((density / 100) * 120))
})

const snowItems = computed(() => {
  const count = snowCount.value
  const colors = snowPalette.value
  const themeKey = `${resolvedTheme.value}-snow`
  const symbols = ['❄', '❅', '✻', '✼', '✶']
  return Array.from({ length: count }, (_, index) => {
    let seed = createSeed(index, themeKey)
    let next = seededRandom(seed)
    const left = next.value * 100
    seed = next.seed
    next = seededRandom(seed)
    const size = 12 + next.value * 18
    seed = next.seed
    next = seededRandom(seed)
    const duration = 18 + next.value * 18
    const adjustedDuration = duration * fallDurationScale
    seed = next.seed
    next = seededRandom(seed)
    const delay = -next.value * adjustedDuration
    seed = next.seed
    next = seededRandom(seed)
    const opacity = 0.3 + next.value * 0.6
    seed = next.seed
    next = seededRandom(seed)
    const drift = Math.round(next.value * 80 - 40)
    seed = next.seed
    next = seededRandom(seed)
    const symbol = symbols[Math.floor(next.value * symbols.length)]
    const color = colors[index % colors.length]
    return {
      key: `${themeKey}-${index}`,
      symbol,
      style: {
        left: `${left}%`,
        fontSize: `${size}px`,
        lineHeight: `${size}px`,
        color,
        opacity,
        '--snow-drift': `${drift}px`,
        animationDuration: `${adjustedDuration}s`,
        animationDelay: `${delay}s`,
        animationTimingFunction: 'ease-in-out'
      }
    }
  })
})

const sunnyCount = computed(() => {
  const density = effectDensity.value
  return Math.max(6, Math.round((density / 100) * 60))
})

const sunnyItems = computed(() => {
  const count = sunnyCount.value
  const themeKey = `${resolvedTheme.value}-sunny`
  return Array.from({ length: count }, (_, index) => {
    let seed = createSeed(index, themeKey)
    let next = seededRandom(seed)
    const left = next.value * 100
    seed = next.seed
    next = seededRandom(seed)
    const top = next.value * 100
    seed = next.seed
    next = seededRandom(seed)
    const size = 6 + next.value * 14
    seed = next.seed
    next = seededRandom(seed)
    const duration = 6 + next.value * 8
    seed = next.seed
    next = seededRandom(seed)
    const delay = -next.value * duration
    seed = next.seed
    next = seededRandom(seed)
    const opacity = 0.2 + next.value * 0.5
    seed = next.seed
    next = seededRandom(seed)
    const rotate = Math.round(next.value * 360)
    return {
      key: `${themeKey}-${index}`,
      style: {
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        opacity,
        '--sunny-rotate': `${rotate}deg`,
        '--sunny-rotate-span': `${rotationSpanDegrees}deg`,
        '--sunny-rotate-half': `${rotationHalfSpanDegrees}deg`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }
    }
  })
})

const showDecorations = computed(() => {
  if (!props.enableDecorations) {
    return false
  }
  if (showText.value) {
    return false
  }
  if (props.effect && props.effect.length > 0) {
    return true
  }
  return props.showRain || props.showSnow || props.showSunny || props.fullScreen
})

const decorationDensityScale = computed(() =>
  clampNumber(decorationDensity.value / 50, 0.6, 1.6)
)

const springDecorConfig = [
  { key: 'firecrackers', symbol: '🧨', count: 6, size: [20, 42] },
  { key: 'lantern', symbol: '🏮', count: 6, size: [22, 44] },
  { key: 'envelope', symbol: '🧧', count: 6, size: [20, 38] },
  { key: 'party', symbol: '🎉', count: 4, size: [22, 55] },
  { key: 'dumpling', symbol: '🥟', count: 6, size: [18, 34] }
]

const christmasDecorConfig = [
  { key: 'sock', symbol: '🧦', count: 6, size: [20, 38] },
  { key: 'tree', symbol: '🎄', count: 5, size: [24, 44] },
  { key: 'hat', symbol: '🎅🏻', count: 5, size: [22, 40] },
  { key: 'flake', symbol: '❄️', count: 7, size: [18, 34] },
  { key: 'santa', symbol: '🎅', count: 4, size: [22, 40] },
  { key: 'party', symbol: '🎉', count: 4, size: [22, 55] }
]

const createDecorations = (configList, themeKey) => {
  const densityScale = decorationDensityScale.value
  let globalIndex = 0
  return configList.flatMap((config, configIndex) => {
    const count = Math.max(1, Math.round(config.count * densityScale))
    return Array.from({ length: count }, (_, index) => {
      let seed = createSeed(globalIndex + configIndex * 17 + index, themeKey)
      let next = seededRandom(seed)
      const left = next.value * 100
      seed = next.seed
      next = seededRandom(seed)
      const top = -20 - next.value * 60
      seed = next.seed
      next = seededRandom(seed)
      const size = config.size[0] + next.value * (config.size[1] - config.size[0])
      seed = next.seed
      next = seededRandom(seed)
      const rotate = Math.round(next.value * 50 - 25)
      seed = next.seed
      next = seededRandom(seed)
      const opacity = 0.65 + next.value * 0.3
      seed = next.seed
      next = seededRandom(seed)
      const drift = 0
      seed = next.seed
      next = seededRandom(seed)
      const duration = 6 + next.value * 6
      const adjustedDuration = duration * fallDurationScale
      seed = next.seed
      next = seededRandom(seed)
      const delay = -next.value * adjustedDuration
      globalIndex += 1
      return {
        key: `${themeKey}-${config.key}-${index}`,
        symbol: config.symbol,
        className: config.className || '',
        style: {
          left: `${left}%`,
          top: `${top}vh`,
          opacity,
          '--decor-size': `${size}px`,
          '--decor-rotate': `${rotate}deg`,
          '--decor-rotate-span': `${rotationSpanDegrees}deg`,
          '--decor-duration': `${adjustedDuration}s`,
          '--decor-delay': `${delay}s`,
          '--decor-drift': `${drift}px`,
          animationDuration: `${adjustedDuration}s`,
          animationDelay: `${delay}s`
        }
      }
    })
  })
}

const decorationItems = computed(() => {
  const themeKey = resolvedTheme.value
  if (!showDecorations.value) {
    return []
  }
  if (themeKey === 'spring') {
    return createDecorations(springDecorConfig, 'spring')
  }
  if (themeKey === 'christmas') {
    return createDecorations(christmasDecorConfig, 'christmas')
  }
  return []
})

const showFireworksEffect = computed(
  () => resolvedTheme.value === 'spring' && showDecorations.value
)

const fireworksPalette = ['#ff3b3b', '#ff9f1c', '#ffe066', '#ff6b6b', '#ffd166']

const fireworksCount = computed(() => {
  const density = decorationDensity.value
  return Math.max(6, Math.round((density / 100) * 14))
})

const fireworksItems = computed(() => {
  const count = fireworksCount.value
  const themeKey = `${resolvedTheme.value}-fireworks`
  return Array.from({ length: count }, (_, index) => {
    let seed = createSeed(index, themeKey)
    let next = seededRandom(seed)
    const left = 10 + next.value * 80
    seed = next.seed
    next = seededRandom(seed)
    const top = 10 + next.value * 60
    seed = next.seed
    next = seededRandom(seed)
    const size = 60 + next.value * 120
    seed = next.seed
    next = seededRandom(seed)
    const duration = 2.8 + next.value * 2.2
    seed = next.seed
    next = seededRandom(seed)
    const delay = -next.value * duration
    seed = next.seed
    next = seededRandom(seed)
    const color = fireworksPalette[index % fireworksPalette.length]
    seed = next.seed
    next = seededRandom(seed)
    const rotate = Math.round(next.value * 360)
    return {
      key: `${themeKey}-${index}`,
      style: {
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle, ${color} 0%, rgba(0, 0, 0, 0) 70%)`,
        '--firework-rotate': `${rotate}deg`,
        '--firework-rotate-span': `${rotationSpanDegrees}deg`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }
    }
  })
})
</script>

<style scoped>
  .festival-text {
    font-size: clamp(48px, 6vw, 96px);
    font-weight: 800;
    color: #f2c38b;
    letter-spacing: 2px;
    text-shadow:
      0 4px 12px rgba(0, 0, 0, 0.55),
      0 0 18px rgba(255, 189, 102, 0.45);
    position: relative;
    padding: 10px 28px;
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(44, 24, 10, 0.75), rgba(22, 12, 6, 0.6));
    border: 1px solid rgba(255, 208, 140, 0.45);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  }

  .festival-text--animated {
    animation: mapNameDropFade 3.6s ease-out forwards;
  }

  .festival-text--spring {
    color: #ffe0a6;
    border-color: rgba(255, 200, 120, 0.7);
    box-shadow:
      0 0 18px rgba(255, 153, 51, 0.6),
      0 12px 30px rgba(0, 0, 0, 0.5);
  }

  .festival-text--spring::before,
  .festival-text--spring::after {
    position: absolute;
    font-size: 28px;
    top: -18px;
  }

  .festival-text--spring::before {
    content: '🧧';
    left: -18px;
  }

  .festival-text--spring::after {
    content: '🎉';
    right: -18px;
  }

  .festival-text--christmas {
    color: #ffe6c8;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow:
      0 0 18px rgba(110, 200, 255, 0.6),
      0 12px 30px rgba(0, 0, 0, 0.5);
  }

  .festival-text--christmas::before,
  .festival-text--christmas::after {
    position: absolute;
    font-size: 28px;
    top: -18px;
  }

  .festival-text--christmas::before {
    content: '🎄';
    left: -18px;
  }

  .festival-text--christmas::after {
    content: '❄️';
    right: -18px;
  }

  @keyframes mapNameDropFade {
    0% {
      transform: translateY(-40vh);
      opacity: 0;
    }
    15% {
      transform: translateY(0);
      opacity: 1;
    }
    80% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(0);
      opacity: 0;
    }
  }

  .festival-rain {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .festival-rain__drop {
    position: absolute;
    top: -10vh;
    transform-origin: center;
    animation-name: festivalRainFall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    will-change: transform;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0), currentColor 85%);
    border-radius: 999px;
    filter: blur(0.2px);
  }

  @keyframes festivalRainFall {
    0% {
      transform: translate3d(0, -10vh, 0);
    }
    100% {
      transform: translate3d(var(--rain-drift), 110vh, 0)
    }
  }

  .festival-snow {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .festival-snow__flake {
    position: absolute;
    top: -10vh;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transform-origin: center;
    animation-name: festivalSnowFall;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform;
    text-shadow:
      0 2px 6px rgba(255, 255, 255, 0.6),
      0 6px 14px rgba(90, 160, 255, 0.35);
  }

  @keyframes festivalSnowFall {
    0% {
      transform: translate3d(var(--snow-drift), -10vh, 0);
    }
    100% {
      transform: translate3d(var(--snow-drift), 110vh, 0);
    }
  }

  .festival-sunny {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    background:
      radial-gradient(circle at 80% 20%, rgba(255, 232, 180, 0.35), rgba(255, 232, 180, 0.05) 35%, transparent 70%),
      linear-gradient(180deg, rgba(255, 244, 214, 0.2), rgba(255, 255, 255, 0));
  }

  .festival-sunny__glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 70% 25%, rgba(255, 255, 255, 0.28), transparent 55%);
    mix-blend-mode: screen;
  }

  .festival-sunny__sun {
    position: absolute;
    right: 8%;
    top: 6%;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 235, 170, 0.9) 35%, rgba(255, 200, 120, 0.4) 70%, transparent 100%);
    box-shadow: 0 0 40px rgba(255, 230, 170, 0.7);
    animation: festivalSunPulse 8s ease-in-out infinite;
  }

  .festival-sunny__spark {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    filter: blur(0.6px);
    transform-origin: center;
    animation-name: festivalSunnyDrift;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform, opacity;
  }

  .festival-decor {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .festival-decor__item {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--decor-size);
    height: var(--decor-size);
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.25));
    transform-origin: center;
    animation-name: festivalDecorFall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    will-change: transform, opacity;
  }

  .festival-decor__symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    height: 1em;
    position: absolute;
    left: 50%;
    top: 50%;
    font-size: var(--decor-size);
    line-height: 1;
    transform-origin: center;
    animation-name: festivalDecorSpin;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-duration: var(--decor-duration);
    animation-delay: var(--decor-delay);
    will-change: transform;
  }

  .festival-decor__couplet {
    writing-mode: vertical-rl;
    text-orientation: upright;
    letter-spacing: 2px;
    font-weight: 700;
    color: #ffebc7;
    background: rgba(155, 25, 25, 0.65);
    padding: 6px 4px;
    border-radius: 8px;
  }

  .festival-decor__greeting {
    font-weight: 700;
    color: #fff5d6;
    background: rgba(32, 84, 64, 0.7);
    padding: 6px 10px;
    border-radius: 10px;
    letter-spacing: 2px;
  }

  @keyframes festivalDecorFall {
    0% {
      transform: translate3d(0, 0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.9;
    }
    100% {
      transform: translate3d(var(--decor-drift), 140vh, 0);
      opacity: 0.9;
    }
  }

  @keyframes festivalDecorSpin {
    0% {
      transform: translate(-50%, -50%) rotate(var(--decor-rotate));
    }
    100% {
      transform: translate(-50%, -50%)
        rotate(calc(var(--decor-rotate) + var(--decor-rotate-span)));
    }
  }

  .festival-fireworks {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .festival-fireworks__burst {
    position: absolute;
    border-radius: 50%;
    opacity: 0;
    mix-blend-mode: screen;
    filter: drop-shadow(0 0 12px rgba(255, 200, 120, 0.6));
    transform-origin: center;
    animation-name: festivalFireworkBurst;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
    will-change: transform, opacity;
  }

  @keyframes festivalFireworkBurst {
    0% {
      transform: scale(0.15) rotate(var(--firework-rotate));
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: scale(1.4) rotate(calc(var(--firework-rotate) + var(--firework-rotate-span)));
      opacity: 0;
    }
  }

  @keyframes festivalSunnyDrift {
    0% {
      transform: translate3d(0, 0, 0) rotate(var(--sunny-rotate));
      opacity: 0.15;
    }
    50% {
      transform: translate3d(0, -12px, 0) rotate(calc(var(--sunny-rotate) + var(--sunny-rotate-half)));
      opacity: 0.6;
    }
    100% {
      transform: translate3d(0, 0, 0) rotate(calc(var(--sunny-rotate) + var(--sunny-rotate-span)));
      opacity: 0.2;
    }
  }

  @keyframes festivalSunPulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
  }
</style>
