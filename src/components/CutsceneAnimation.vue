<template>
  <div v-if="isVisible" class="cutscene-overlay">
    <img
      v-if="backgroundUrl"
      class="cutscene-background"
      :src="backgroundUrl"
      alt="cutscene"
    />
    <div class="cutscene-progress">
      <div class="cutscene-progress-bar">
        <div class="cutscene-progress-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="cutscene-progress-text">加载中 {{ Math.floor(progress) }}%</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  triggerKey: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['animation-complete'])

const cutsceneUrls = [
  'MapLoading_Arena.png',
  'MapLoading_Azria.png',
  'MapLoading_Bahara.png',
  'MapLoading_Behemoth.png',
  'MapLoading_BehemothBoss.png',
  'MapLoading_Cisland.png',
  'MapLoading_Colosseum.png',
  'MapLoading_DreadfulCave.png',
  'MapLoading_Guildhouse.png',
  'MapLoading_GuildWar.png',
  'MapLoading_Heaven.png',
  'MapLoading_kalgas.png',
  'MapLoading_KalgasBoss.png',
  'MapLoading_Ominous.png',
  'MapLoading_Ominous_1.png',
  'MapLoading_Rartesia.png',
  'MapLoading_Rustia.png'
].map(filename => `/pt/animation/Cutscene/${filename}`)

const progress = ref(0)
const backgroundUrl = ref('')

let progressTimer = null

const stopAnimation = () => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const startAnimation = () => {
  stopAnimation()
  progress.value = 0
  if (cutsceneUrls.length > 0) {
    const index = Math.floor(Math.random() * cutsceneUrls.length)
    backgroundUrl.value = cutsceneUrls[index]
  } else {
    backgroundUrl.value = ''
  }
  const startTime = Date.now()
  progressTimer = setInterval(() => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min(100, (elapsed / 3000) * 100)
    if (progress.value >= 100) {
      stopAnimation()
      progress.value = 100
      emit('animation-complete')
    }
  }, 100)
}

watch(
  () => [props.isVisible, props.triggerKey],
  ([visible]) => {
    if (visible) {
      startAnimation()
      return
    }
    stopAnimation()
    progress.value = 0
  }
)

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
  .cutscene-overlay {
    position: fixed;
    inset: 0;
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    pointer-events: all;
  }

  .cutscene-background {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    filter: none;
  }

  .cutscene-progress {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 40%;
    min-width: 280px;
    max-width: 600px;
  }

  .cutscene-progress-bar {
    width: 100%;
    height: 16px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  }

  .cutscene-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a9eff, #ffd700);
    transition: width 0.1s linear;
  }

  .cutscene-progress-text {
    color: #fff;
    font-weight: bold;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.7);
  }
</style>
