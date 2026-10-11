<template>
  <div class="lore-overlay">
    <div class="lore-panel">
      <div
        ref="contentRef"
        class="lore-content"
        @wheel.passive="handleUserScroll"
        @touchstart.passive="handleUserScroll"
      >
        <div v-for="(item, index) in loreItems" :key="`${item.type}-${index}`" class="lore-item">
          <p v-if="item.type === 'text'" class="lore-text">{{ item.content }}</p>
          <img v-else class="lore-image" :src="item.src" alt="背景故事图片" />
        </div>
      </div>
      <button class="lore-back" @click="handleClose">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const emit = defineEmits(['close', 'complete'])

const loreItems = ref([])
const contentRef = ref(null)
const storyUrl = '/pt/animation/LoreAnimation/游戏《飞飞》（Flyff）：瑞加大陆的史诗.md'
const imageUrls = Array.from({ length: 17 }, (_, index) => {
  const suffix = String(index).padStart(2, '0')
  return `/pt/animation/LoreAnimation/shotCredit${suffix}.png`
})
const scrollSpeed = 1.2

let rafId = 0
let resumeTimeout = 0
let autoScrolling = false

const normalizeParagraph = text => {
  return text.replace(/^>+\s*/g, '').replace(/^#+\s*/g, '').trim()
}

const buildItems = (texts, images) => {
  const items = []
  const maxLength = Math.max(texts.length, images.length)
  for (let i = 0; i < maxLength; i += 1) {
    if (texts[i]) {
      items.push({ type: 'text', content: texts[i] })
    }
    if (images[i]) {
      items.push({ type: 'image', src: images[i] })
    }
  }
  return items
}

const loadStory = async () => {
  try {
    const response = await fetch(encodeURI(storyUrl))
    const rawText = await response.text()
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map(normalizeParagraph)
      .filter(Boolean)
    loreItems.value = buildItems(paragraphs, imageUrls)
  } catch (error) {
    loreItems.value = buildItems(['背景故事加载失败，请稍后重试。'], imageUrls)
  }
}

const isAtEnd = () => {
  const container = contentRef.value
  if (!container) {
    return false
  }
  return container.scrollTop + container.clientHeight >= container.scrollHeight - 2
}

const scrollStep = () => {
  if (!autoScrolling || !contentRef.value) {
    return
  }
  const container = contentRef.value
  container.scrollTop += scrollSpeed
  if (isAtEnd()) {
    autoScrolling = false
    emit('complete')
    return
  }
  rafId = requestAnimationFrame(scrollStep)
}

const startAutoScroll = () => {
  if (!contentRef.value) {
    return
  }
  stopAutoScroll()
  autoScrolling = true
  rafId = requestAnimationFrame(scrollStep)
}

const stopAutoScroll = () => {
  autoScrolling = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

const handleUserScroll = () => {
  stopAutoScroll()
  if (resumeTimeout) {
    clearTimeout(resumeTimeout)
  }
  resumeTimeout = window.setTimeout(() => {
    if (!isAtEnd()) {
      startAutoScroll()
    }
  }, 1500)
}

const handleClose = () => {
  stopAutoScroll()
  emit('close')
}

const preloadImages = async () => {
  const loaders = imageUrls.map(
    src =>
      new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = src
      })
  )
  await Promise.allSettled(loaders)
}

onMounted(async () => {
  await loadStory()
  await preloadImages()
  await nextTick()
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
  setTimeout(() => {
    startAutoScroll()
  }, 300)
})

onUnmounted(() => {
  stopAutoScroll()
  if (resumeTimeout) {
    clearTimeout(resumeTimeout)
  }
})
</script>

<style scoped>
  .lore-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    z-index: 6;
  }

  .lore-panel {
    width: 72%;
    max-width: 920px;
    height: 75%;
    background: rgba(15, 15, 25, 0.92);
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
  }

  .lore-content {
    flex: 1;
    overflow-y: auto;
    padding: 30px 40px;
    color: #f5e6c8;
    font-size: 16px;
    line-height: 1.8;
    scrollbar-width: thin;
    scrollbar-color: rgba(197, 139, 90, 0.6) transparent;
    text-align: center;
  }

  .lore-content::-webkit-scrollbar {
    width: 8px;
  }

  .lore-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .lore-content::-webkit-scrollbar-thumb {
    background: rgba(197, 139, 90, 0.6);
    border-radius: 999px;
  }

  .lore-content::-webkit-scrollbar-thumb:hover {
    background: rgba(197, 139, 90, 0.8);
  }

  .lore-item {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lore-text {
    margin: 0;
    white-space: pre-wrap;
    max-width: 680px;
  }

  .lore-image {
    width: 100%;
    max-height: 380px;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
  }

  .lore-back {
    align-self: center;
    margin: 0 0 24px;
    padding: 10px 30px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
    background: linear-gradient(45deg, #9a6a3a, #c58b5a);
    transition: all 0.3s ease;
  }

  .lore-back:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(197, 139, 90, 0.35);
  }

  @media (max-width: 960px) {
    .lore-panel {
      width: 88%;
      height: 78%;
    }

    .lore-content {
      padding: 24px;
      font-size: 15px;
    }
  }

  @media (max-width: 600px) {
    .lore-panel {
      width: 92%;
      height: 80%;
    }

    .lore-content {
      padding: 20px;
      font-size: 14px;
    }
  }
</style>
