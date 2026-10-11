<template>
  <div class="exp-numbers-container">
    <div
      v-for="expNumber in localExpNumbers"
      :key="expNumber.id"
      class="exp-number"
      :style="expStyle(expNumber)"
    >
      <span class="exp-icon">✨</span>
      <span class="exp-text">EXP {{ expNumber.percentage }}%</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExpNumber',
  props: {
    globalExpNumbers: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  data () {
    return {
      localExpNumbers: []
    }
  },
  watch: {
    globalExpNumbers: {
      handler (newVal) {
        this.updateLocalExpNumbers(newVal)
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    updateLocalExpNumbers (newVal) {
      if (!newVal) {
        this.localExpNumbers = []
        return
      }

      const previousIds = new Set(this.localExpNumbers.map(e => e.id))
      const newExpNumbers = []

      newVal.forEach(expNumber => {
        newExpNumbers.push(expNumber)
        previousIds.delete(expNumber.id)
      })

      this.localExpNumbers = newExpNumbers
    },
    expStyle (expNumber) {
      const style = {
        left: `${expNumber.screenX}px`,
        top: `${expNumber.screenY}px`,
        opacity: expNumber.opacity
      }
      return style
    }
  }
}
</script>

<style scoped>
  .exp-numbers-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
  }

  .exp-number {
    position: absolute;
    color: #44ff44;
    font-weight: bold;
    font-size: 18px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    white-space: nowrap;
    animation: expFloat 2s ease-out forwards;
    will-change: transform, opacity;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .exp-icon {
    font-size: 20px;
  }

  .exp-text {
    display: inline-block;
  }

  @keyframes expFloat {
    0% {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateY(-25px) scale(1.1);
      opacity: 0.9;
    }
    100% {
      transform: translateY(-50px) scale(0.9);
      opacity: 0;
    }
  }
</style>
