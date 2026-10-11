<template>
  <div v-if="isVisible" class="boost-animation">
    +{{ formattedValue }}%
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0
  },
  triggerKey: {
    type: Number,
    default: 0
  }
})

const isVisible = ref(false)
let hideTimer = null

const formattedValue = computed(() => {
  const numericValue = Number(props.value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return ''
  }
  return numericValue.toFixed(6).replace(/\.?0+$/, '')
})

watch(
  () => props.triggerKey,
  async () => {
    if (!formattedValue.value) {
      return
    }
    isVisible.value = false
    await nextTick()
    isVisible.value = true
    if (hideTimer) {
      clearTimeout(hideTimer)
    }
    hideTimer = setTimeout(() => {
      isVisible.value = false
    }, 900)
  }
)

onUnmounted(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>

<style scoped>
  .boost-animation {
    color: #b9ffb9;
    font-weight: bold;
    font-size: 14px;
    min-width: 80px;
    text-align: left;
    animation: boostPulse 0.9s ease-out forwards;
  }

  @keyframes boostPulse {
    0% {
      opacity: 0;
      transform: translateY(6px) scale(0.95);
    }

    30% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    100% {
      opacity: 0;
      transform: translateY(-10px) scale(1.05);
    }
  }
</style>
