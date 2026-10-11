<template>
  <div v-if="isHit" class="hit-flash-animation">
    <div class="flash-overlay"></div>
  </div>
</template>

<script>
export default {
  name: 'HitFlashAnimation',
  props: {
    isHit: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
  .hit-flash-animation {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    border-radius: 8px;
    overflow: hidden;
  }

  .flash-overlay {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 70%);
    animation: flash 0.1s ease-out forwards;
  }

  @keyframes flash {
    0% {
      opacity: 1;
      transform: scale(0.8);
    }
    50% {
      opacity: 0.6;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.2);
    }
  }
</style>
