<template>
  <div class="miss-animation" :style="positionStyle">
    <span class="miss-text">Miss</span>
  </div>
</template>

<script>
export default {
  name: 'MissAnimation',
  props: {
    x: {
      type: Number,
      default: 50
    },
    y: {
      type: Number,
      default: 30
    },
    opacity: {
      type: Number,
      default: 1
    }
  },
  computed: {
    positionStyle () {
      return {
        left: this.x + 'px',
        top: this.y + 'px',
        opacity: this.opacity
      }
    }
  }
}
</script>

<style scoped>
  .miss-animation {
    position: absolute;
    pointer-events: none;
    animation: missFloat 1.5s ease-out forwards;
    z-index: 1000;
  }

  .miss-text {
    font-size: 24px;
    font-weight: bold;
    color: #ff6b6b;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    letter-spacing: 2px;
  }

  @keyframes missFloat {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 1;
    }
    50% {
      transform: translateY(-20px) scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-40px) scale(1);
      opacity: 0;
    }
  }
</style>
