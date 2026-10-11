<template>
  <span class="gold-value" :class="goldValueClass">{{ formatted }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { formatGold4, getGoldValueClass } from '@/utils/goldDisplay'

const props = defineProps({
  value: {
    type: [Number, String],
    default: 0
  }
})

const formatted = computed(() => formatGold4(props.value))
const goldValueClass = computed(() => getGoldValueClass(props.value))
</script>

<style scoped>
  .gold-value {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .gold-value-1 {
    color: #000000;
  }

  .gold-value-2 {
    color: #25a825;
  }

  .gold-value-3 {
    color: #6666ff;
  }

  .gold-value-4 {
    color: #d22222;
  }

  .gold-value-5 {
    color: #d52c2c;
  }

  .gold-value-6 {
    color: #a319a3;
  }

  .gold-value-7 {
    color: #1f9999;
  }
</style>
