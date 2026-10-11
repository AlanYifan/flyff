<template>
  <div class="enhance-result-container">
    <div
      v-for="(entry, index) in activeAnimations"
      :key="entry.id"
      class="enhance-result-animation"
      :style="props.centerX != null && props.centerY != null ? { left: props.centerX + 'px', top: props.centerY + index * 30 + 'px' } : { top: `calc(50% + ${index * 30}px)` }"
    >
      <img :src="getResultImage(entry.result)" alt="强化结果" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  result: {
    type: String,
    default: 'success'
  },
  triggerKey: {
    type: Number,
    default: 0
  },
  centerX: {
    type: Number,
    default: null
  },
  centerY: {
    type: Number,
    default: null
  }
})

const activeAnimations = ref([])
const removeTimers = new Map()
let nextId = 0

const successSrc = ref('/pt/UI/SafetySuccess.png')
const failureSrc = ref('/pt/UI/SafetyFailure.png')

const processImage = (url, targetRef) => {
  if (typeof window === 'undefined') {
    return
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }
    context.drawImage(img, 0, 0)
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (r > 200 && g < 80 && b > 200) {
        data[i + 3] = 0
      }
    }
    context.putImageData(imageData, 0, 0)
    targetRef.value = canvas.toDataURL('image/png')
  }
  img.src = url
}

const getResultImage = result => {
  return result === 'failure' ? failureSrc.value : successSrc.value
}

const scheduleRemoval = id => {
  const timer = setTimeout(() => {
    activeAnimations.value = activeAnimations.value.filter(entry => entry.id !== id)
    removeTimers.delete(id)
  }, 4000)
  removeTimers.set(id, timer)
}

watch(
  () => props.triggerKey,
  () => {
    const entry = { id: nextId, result: props.result }
    nextId += 1
    let nextAnimations = [...activeAnimations.value, entry]
    if (nextAnimations.length > 4) {
      const overflow = nextAnimations.slice(0, nextAnimations.length - 4)
      overflow.forEach(overflowEntry => {
        const timer = removeTimers.get(overflowEntry.id)
        if (timer) {
          clearTimeout(timer)
        }
        removeTimers.delete(overflowEntry.id)
      })
      nextAnimations = nextAnimations.slice(-4)
    }
    activeAnimations.value = nextAnimations
    scheduleRemoval(entry.id)
  }
)

onMounted(() => {
  processImage('/pt/UI/SafetySuccess.png', successSrc)
  processImage('/pt/UI/SafetyFailure.png', failureSrc)
})

onUnmounted(() => {
  removeTimers.forEach(timer => clearTimeout(timer))
  removeTimers.clear()
})
</script>

<style scoped>
  .enhance-result-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2000;
  }

  .enhance-result-animation {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate3d(-50%, -50%, 0);
    will-change: transform, opacity;
    animation: enhanceResultRise 4s cubic-bezier(0.33, 1, 0.68, 1) forwards;
  }

  .enhance-result-animation img {
    width: 160px;
    height: auto;
    object-fit: contain;
    background-color: transparent;
    mix-blend-mode: screen;
  }

  @keyframes enhanceResultRise {
    0% {
      opacity: 0;
      transform: translate3d(-50%, -50%, 0);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate3d(-50%, -180%, 0);
    }
  }
</style>
