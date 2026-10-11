<template>
  <div class="enhancement-animation">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const frameIndex = ref(0)
const frames = Array.from({ length: 11 }, (_, index) => {
  const frameNumber = String(index).padStart(2, '0')
  return `/pt/animation/EnhancementAnimation/Icon_ImgIncAni_${frameNumber}.tga`
})

let animationTimer = null
let animationFrameId = null
let lastFrameAt = 0
let decodedFrames = []

const decodeTga = buffer => {
  const view = new DataView(buffer)
  const idLength = view.getUint8(0)
  const colorMapType = view.getUint8(1)
  const imageType = view.getUint8(2)
  if (colorMapType !== 0) {
    return null
  }

  const width = view.getUint16(12, true)
  const height = view.getUint16(14, true)
  const pixelDepth = view.getUint8(16)
  const imageDescriptor = view.getUint8(17)
  const originTop = (imageDescriptor & 0x20) !== 0

  if (![2, 10].includes(imageType)) {
    return null
  }

  const bytesPerPixel = pixelDepth / 8
  if (![3, 4].includes(bytesPerPixel)) {
    return null
  }

  let offset = 18 + idLength
  const totalPixels = width * height
  const output = new Uint8ClampedArray(totalPixels * 4)

  const writePixelAt = (pixelNumber, r, g, b, a) => {
    const x = pixelNumber % width
    const y = Math.floor(pixelNumber / width)
    const row = originTop ? y : height - 1 - y
    const destIndex = (row * width + x) * 4
    output[destIndex] = r
    output[destIndex + 1] = g
    output[destIndex + 2] = b
    output[destIndex + 3] = a
  }

  const readPixel = () => {
    const b = view.getUint8(offset)
    const g = view.getUint8(offset + 1)
    const r = view.getUint8(offset + 2)
    let a = bytesPerPixel === 4 ? view.getUint8(offset + 3) : 255
    offset += bytesPerPixel
    if (r >= 250 && g >= 250 && b >= 250) {
      a = 0
    }
    return [r, g, b, a]
  }

  if (imageType === 2) {
    for (let pixelNumber = 0; pixelNumber < totalPixels; pixelNumber += 1) {
      const [r, g, b, a] = readPixel()
      writePixelAt(pixelNumber, r, g, b, a)
    }
  } else {
    let pixelNumber = 0
    while (pixelNumber < totalPixels) {
      const packetHeader = view.getUint8(offset)
      offset += 1
      const packetSize = (packetHeader & 0x7f) + 1
      if (packetHeader & 0x80) {
        const [r, g, b, a] = readPixel()
        for (let i = 0; i < packetSize && pixelNumber < totalPixels; i += 1) {
          writePixelAt(pixelNumber, r, g, b, a)
          pixelNumber += 1
        }
      } else {
        for (let i = 0; i < packetSize && pixelNumber < totalPixels; i += 1) {
          const [r, g, b, a] = readPixel()
          writePixelAt(pixelNumber, r, g, b, a)
          pixelNumber += 1
        }
      }
    }
  }

  return { width, height, data: output }
}

const renderFrame = () => {
  const canvas = canvasRef.value
  const frame = decodedFrames[frameIndex.value]
  if (!canvas || !frame) {
    return
  }
  const context = canvas.getContext('2d')
  if (!context) {
    return
  }
  const imageData = new ImageData(frame.data, frame.width, frame.height)
  context.putImageData(imageData, 0, 0)
}

const stopAnimation = () => {
  if (animationTimer) {
    clearInterval(animationTimer)
    animationTimer = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  lastFrameAt = 0
}

const startAnimation = () => {
  stopAnimation()
  const intervalMs = 90
  if (typeof requestAnimationFrame !== 'function') {
    animationTimer = setInterval(() => {
      frameIndex.value = (frameIndex.value + 1) % decodedFrames.length
      renderFrame()
    }, intervalMs)
    return
  }

  const step = now => {
    if (decodedFrames.length <= 0) {
      animationFrameId = null
      return
    }

    if (!lastFrameAt) {
      lastFrameAt = now
    }

    const elapsed = now - lastFrameAt
    if (elapsed >= intervalMs) {
      const tickCount = Math.floor(elapsed / intervalMs)
      lastFrameAt += tickCount * intervalMs
      frameIndex.value = (frameIndex.value + tickCount) % decodedFrames.length
      renderFrame()
    }

    animationFrameId = requestAnimationFrame(step)
  }

  animationFrameId = requestAnimationFrame(step)
}

const loadFrames = async () => {
  try {
    const results = await Promise.all(
      frames.map(async path => {
        const response = await fetch(path)
        if (!response.ok) {
          return null
        }
        const buffer = await response.arrayBuffer()
        return decodeTga(buffer)
      })
    )
    decodedFrames = results.filter(Boolean)
    if (decodedFrames.length === 0) {
      return
    }
    const canvas = canvasRef.value
    if (!canvas) {
      return
    }
    canvas.width = decodedFrames[0].width
    canvas.height = decodedFrames[0].height
    renderFrame()
    startAnimation()
  } catch (error) {
    console.error('[EnhancementAnimation] 加载动画帧失败:', error)
  }
}

onMounted(() => {
  loadFrames()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style scoped>
  .enhancement-animation {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
  }

  .enhancement-animation canvas {
    width: 46px;
    height: 46px;
    image-rendering: crisp-edges;
  }
</style>
