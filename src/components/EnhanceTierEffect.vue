<template>
  <div v-if="isVisible" class="enhance-tier-effect" :class="effectClass" :style="effectStyle">
    <svg class="effect-border-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect
        class="border-rect border-rect-main"
        x="2"
        y="2"
        width="96"
        height="96"
        rx="8"
        ry="8"
        pathLength="100"
      />
      <rect
        class="border-rect border-rect-secondary"
        x="2"
        y="2"
        width="96"
        height="96"
        rx="8"
        ry="8"
        pathLength="100"
      />
    </svg>
    <span class="effect-layer"></span>
    <span class="effect-layer layer-2"></span>
    <span class="effect-core"></span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useItemsStore } from '@/store/items'

const props = defineProps({
  enhanceLevel: {
    type: Number,
    default: 0
  },
  rarity: {
    type: String,
    default: 'common'
  }
})

const itemsStore = useItemsStore()

const normalizedLevel = computed(() => {
  const level = Number(props.enhanceLevel)
  return Number.isFinite(level) ? level : 0
})

const tier = computed(() => {
  if (normalizedLevel.value >= 10) {
    return 'tier-10'
  }
  if (normalizedLevel.value >= 7) {
    return 'tier-7'
  }
  if (normalizedLevel.value >= 5) {
    return 'tier-5'
  }
  return ''
})

const isVisible = computed(() => tier.value !== '')

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const parseColor = value => {
  if (!value) {
    return null
  }
  if (value.startsWith('#')) {
    const hex = value.replace('#', '')
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return { r, g, b }
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16)
      const g = parseInt(hex.slice(2, 4), 16)
      const b = parseInt(hex.slice(4, 6), 16)
      return { r, g, b }
    }
  }
  const rgbMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3])
    }
  }
  return null
}

const mixColor = (color, target, ratio) => {
  const r = Math.round(color.r + (target.r - color.r) * ratio)
  const g = Math.round(color.g + (target.g - color.g) * ratio)
  const b = Math.round(color.b + (target.b - color.b) * ratio)
  return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) }
}

const toRgbString = color => `rgb(${color.r}, ${color.g}, ${color.b})`

const rarityColors = computed(() => {
  const base = itemsStore.getRarityTextColor(props.rarity || 'common') || '#C0C0C0'
  const parsed = parseColor(base) || { r: 192, g: 192, b: 192 }
  const light = mixColor(parsed, { r: 255, g: 255, b: 255 }, 0.32)
  const lighter = mixColor(parsed, { r: 255, g: 255, b: 255 }, 0.55)
  return {
    main: toRgbString(parsed),
    light: toRgbString(light),
    lighter: toRgbString(lighter)
  }
})

const effectClass = computed(() => {
  if (tier.value === 'tier-10') {
    return ['effect-combo', 'combo-1', 'tier-10']
  }
  if (tier.value === 'tier-7') {
    return ['effect-combo-basic', 'combo-basic-fire', 'tier-7']
  }
  if (tier.value === 'tier-5') {
    return ['effect-border-flow', 'flow-1', 'tier-5']
  }
  return []
})

const effectStyle = computed(() => {
  if (tier.value === 'tier-10') {
    return {
      '--flow-color': rarityColors.value.main,
      '--flow-color-2': rarityColors.value.light,
      '--ray-color': rarityColors.value.main,
      '--ray-color-2': rarityColors.value.lighter,
      '--flow-speed': '5s',
      '--ray-speed': '10s',
      '--ray-pulse': '3s',
      '--ray-line-size': '1.2deg',
      '--border-width': '2px',
      '--line-width': '5px',
      '--flow-dash': '24 76',
      '--flow-dash-2': '24 76'
    }
  }
  if (tier.value === 'tier-7') {
    return {
      '--flow-color': rarityColors.value.main,
      '--flow-color-2': rarityColors.value.light,
      '--glow-color': rarityColors.value.light,
      '--flow-speed': '5s',
      '--border-width': '1.5px',
      '--line-width': '2.4px',
      '--flow-dash': '24 76',
      '--flow-dash-2': '24 76'
    }
  }
  if (tier.value === 'tier-5') {
    return {
      '--flow-color': rarityColors.value.main,
      '--flow-color-2': rarityColors.value.light,
      '--flow-speed': '5s',
      '--border-width': '1px',
      '--line-width': '2px',
      '--flow-dash': '24 76',
      '--flow-dash-2': '24 76'
    }
  }
  return {}
})
</script>

<style scoped>
.enhance-tier-effect {
  --effect-radius: 8px;
  --border-width: 1px;
  position: absolute;
  inset: -3px;
  border-radius: var(--effect-radius);
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  isolation: isolate;
}

.enhance-tier-effect::before,
.enhance-tier-effect::after {
  content: '';
  position: absolute;
  border-radius: inherit;
  z-index: 0;
}

.enhance-tier-effect .effect-layer,
.enhance-tier-effect .effect-core {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
}

.effect-border-svg {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
}

.effect-border-flow .effect-border-svg,
.effect-combo .effect-border-svg,
.effect-combo-basic .effect-border-svg {
  opacity: 1;
}

.effect-border-svg .border-rect {
  fill: none;
  stroke: var(--flow-color);
  stroke-width: var(--line-width, var(--border-width));
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: var(--flow-dash, 50 50);
  animation: borderDashMain var(--flow-speed, 6s) linear infinite;
  opacity: 0.9;
}

.effect-border-svg .border-rect-secondary {
  stroke: var(--flow-color-2);
  stroke-dasharray: var(--flow-dash-2, 50 50);
  animation: borderDashSecondary var(--flow-speed, 6s) linear infinite;
  opacity: 0.7;
}

.effect-border-flow::before {
  inset: calc(var(--border-width) * -1);
  border-radius: calc(var(--effect-radius) + var(--border-width));
  background: none;
  animation: none;
  opacity: 0;
  filter: none;
}

.effect-border-flow::after {
  inset: var(--border-width);
  border-radius: calc(var(--effect-radius) - var(--border-width));
  background: rgba(15, 17, 30, 0.95);
}

.effect-border-flow .effect-layer {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  animation: borderGlow 4.6s ease-in-out infinite;
}

.effect-combo::before {
  inset: calc(var(--border-width) * -1);
  border-radius: calc(var(--effect-radius) + var(--border-width));
  background: none;
  animation: none;
  opacity: 0;
  filter: none;
}

.tier-10.effect-combo::before {
  background: none;
  animation-direction: normal;
}

.effect-combo::after {
  inset: var(--border-width);
  border-radius: calc(var(--effect-radius) - var(--border-width));
  background: rgba(15, 17, 30, 0.9);
}

.effect-combo .effect-core {
  opacity: 0.9;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 255, 255, 0) 0deg 10deg,
    var(--ray-color) 10deg calc(10deg + var(--ray-line-size, 0.6deg)),
    rgba(255, 255, 255, 0) calc(10deg + var(--ray-line-size, 0.6deg)) 18deg,
    var(--ray-color-2) 18deg calc(18deg + var(--ray-line-size, 0.6deg)),
    rgba(255, 255, 255, 0) calc(18deg + var(--ray-line-size, 0.6deg)) 24deg
  );
  animation: raySpin var(--ray-speed, 4.2s) linear infinite;
  filter: blur(0.6px);
}

.effect-combo .effect-layer {
  background: radial-gradient(circle, var(--ray-color-2) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

.effect-combo .layer-2 {
  background: radial-gradient(circle at 50% 50%, var(--ray-color), transparent 60%);
  animation: rayPulse var(--ray-pulse, 3.2s) ease-in-out infinite;
}

.effect-combo-basic::before {
  inset: calc(var(--border-width) * -1);
  border-radius: calc(var(--effect-radius) + var(--border-width));
  background: none;
  animation: none;
  opacity: 0;
  filter: none;
}

.effect-combo-basic::after {
  inset: var(--border-width);
  border-radius: calc(var(--effect-radius) - var(--border-width));
  background: rgba(15, 17, 30, 0.92);
}

.effect-combo-basic .effect-layer {
  background: radial-gradient(circle, var(--glow-color) 0%, rgba(255, 255, 255, 0.2) 40%, transparent 70%);
  animation: glowPulse 4s ease-in-out infinite;
}

.effect-combo-basic .layer-2 {
  background: radial-gradient(circle at 60% 40%, var(--glow-color), transparent 60%);
  animation: glowPulse 3.6s ease-in-out infinite reverse;
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.9;
  }
}

@keyframes borderSpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes borderDashMain {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -100;
  }
}

@keyframes borderDashSecondary {
  0% {
    stroke-dashoffset: -50;
  }
  100% {
    stroke-dashoffset: -150;
  }
}

@keyframes borderGlow {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.05);
  }
}

@keyframes raySpin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes rayPulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.95);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.08);
  }
}
</style>
