<!--
  @file MonsterTooltip.vue
  @description 怪物详情提示框组件：鼠标悬停时显示怪物详细信息
-->
<template>
  <Teleport to="body">
    <Transition name="monster-tooltip-fade" appear>
      <div
        v-if="internalShow && internalMonster"
        id="monster-tooltip"
        class="monster-tooltip"
        :style="{
          left: internalPosition.x + 'px',
          top: internalPosition.y + 'px',
          zIndex: 999999,
          opacity: 1,
          visibility: 'visible'
        }"
      >
        <div class="monster-content">
          <div class="monster-header">
            <img
              :src="monsterIconPath"
              :alt="monsterName"
              class="monster-icon"
              @error="handleMonsterImageError"
            />
            <div class="monster-title">
              <h3 :style="{ color: monsterRankColor }">
                {{ monsterName }} [{{ monsterRankText }}]
              </h3>
              <p>等级: {{ internalMonster.level }}</p>
            </div>
          </div>
          <div class="monster-info-container">
            <div class="monster-stats">
              <p>生命值: {{ internalMonster.hp || internalMonster.maxHealth || '未知' }}</p>
              <p>攻击力: {{ internalMonster.minAttack }} - {{ internalMonster.maxAttack }}</p>
              <p>防御力: {{ monsterDefenseText }}</p>
              <p>魔法防御: {{ internalMonster.magicDefense || '未知' }}</p>
              <p>金币掉落: {{ internalMonster.minDropGold || 0 }} - {{ internalMonster.maxDropGold || 0 }}</p>
              <p v-if="monsterAreaText" class="monster-area">刷新区域: {{ monsterAreaText }}</p>
            </div>
          </div>
          <div v-if="hasDrops" class="monster-drops-hint">
            <p>点击头像,查看掉落</p>
          </div>
          <div v-else class="monster-drops">
            <p>无掉落</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useMonstersStore } from '@/store/monsters'
import { imageService } from '@/services/ImageService'

// 使用 Pinia Store
const monstersStore = useMonstersStore()

// 内部状态
const internalShow = ref(false)
const internalMonster = ref(null)
const internalPosition = ref({ x: 0, y: 0 })
const monsterIconPath = ref('/pt/monster_icon/2087.png')

// 怪物等级翻译映射
const rankTranslations = {
  giant: 'BOSS',
  violet: '堕落BOSS',
  boss: 'BOSS',
  super: '超级BOSS',
  captain: '头目',
  material: '材料',
  small: '小怪',
  normal: '普通'
}

// 区域类型映射
const areaForMap = {
  normal: '普通地图',
  instance: '副本',
  dungeon: '地牢'
}

// 计算属性
const monsterName = computed(() => {
  if (!internalMonster.value) return '未知怪物'
  const monster = internalMonster.value
  if (monster.name?.cns) return monster.name.cns
  if (typeof monster.name === 'string') return monster.name
  return `怪物${monster.id}`
})

const monsterRankText = computed(() => {
  if (!internalMonster.value) return '普通'
  const rank = internalMonster.value.rank?.toLowerCase()
  return rankTranslations[rank] || '普通'
})

const monsterRankColor = computed(() => {
  if (!internalMonster.value) return 'rgba(252, 252, 252, 0.6)'
  return monstersStore.getMonsterRankColor(internalMonster.value.rank)
})

const monsterDefenseText = computed(() => {
  if (!internalMonster.value) return '未知'
  const monster = internalMonster.value
  const defenseValue = Number(monster.defense)
  const minDefenseValue = Number(monster.minDefense)
  const maxDefenseValue = Number(monster.maxDefense)

  if (Number.isFinite(defenseValue)) {
    return String(defenseValue)
  } else if (Number.isFinite(minDefenseValue) && Number.isFinite(maxDefenseValue)) {
    return `${minDefenseValue}~${maxDefenseValue}`
  } else if (Number.isFinite(minDefenseValue)) {
    return String(minDefenseValue)
  }
  return '未知'
})

const monsterAreaText = computed(() => {
  if (!internalMonster.value) return ''
  const areaType = internalMonster.value.area || 'normal'
  return areaForMap[areaType] || ''
})

const hasDrops = computed(() => {
  if (!internalMonster.value) return false
  const drops = internalMonster.value.drops
  return drops && drops.length > 0
})

// 调整提示框位置，确保不会被遮挡
const adjustTooltipPosition = position => {
  setTimeout(() => {
    const tooltip = document.getElementById('monster-tooltip')
    if (!tooltip) return

    const padding = 10
    const mouseOffset = 30
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const tooltipRect = tooltip.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width || 300
    const tooltipHeight = tooltipRect.height || 250

    let x = position.x + mouseOffset
    let y = position.y + mouseOffset

    // 防止右侧溢出
    if (x + tooltipWidth > viewportWidth) {
      x = position.x - tooltipWidth - mouseOffset
    }

    // 防止底部溢出
    if (y + tooltipHeight > viewportHeight) {
      y = position.y - tooltipHeight - mouseOffset
    }

    // 确保不会超出左边界
    if (x < padding) {
      x = padding
    }

    // 确保不会超出上边界
    if (y < padding) {
      y = padding
    }

    // 将位置值取整，避免亚像素渲染导致的模糊
    x = Math.round(x)
    y = Math.round(y)

    internalPosition.value = { x, y }
  }, 0)
}

// 显示怪物详情提示框
const handleShowMonsterTooltip = async event => {
  const monsterId = event.detail.monsterId

  // 从 store 中查找怪物数据（staticMonsters 是对象，使用属性访问）
  const monster = monstersStore.staticMonsters[monsterId] || monstersStore.getMonsterConfig(monsterId)
  if (!monster) {
    console.error(`未找到ID为 ${monsterId} 的怪物数据`)
    return
  }

  internalMonster.value = monster
  internalPosition.value = event.detail.position
  internalShow.value = true

  // 异步加载怪物图标
  const iconPath = `/pt/monster_icon/${monsterId}.png`
  try {
    await imageService.loadImage(iconPath)
    if (internalShow.value) {
      monsterIconPath.value = iconPath
    }
  } catch (error) {
    // 使用默认图标
    if (internalShow.value) {
      monsterIconPath.value = '/pt/monster_icon/2087.png'
    }
  }

  nextTick(() => {
    adjustTooltipPosition(event.detail.position)
  })
}

// 移动怪物详情提示框
const handleMoveMonsterTooltip = event => {
  internalPosition.value = event.detail.position
  adjustTooltipPosition(event.detail.position)
}

// 隐藏怪物详情提示框
const handleHideMonsterTooltip = () => {
  internalShow.value = false
  internalMonster.value = null
}

// 处理怪物图片加载错误
const handleMonsterImageError = () => {
  monsterIconPath.value = '/pt/monster_icon/2087.png'
}

// 监听自定义事件
onMounted(() => {
  window.addEventListener('show-monster-tooltip', handleShowMonsterTooltip)
  window.addEventListener('move-monster-tooltip', handleMoveMonsterTooltip)
  window.addEventListener('hide-monster-tooltip', handleHideMonsterTooltip)
})

// 移除事件监听器
onUnmounted(() => {
  window.removeEventListener('show-monster-tooltip', handleShowMonsterTooltip)
  window.removeEventListener('move-monster-tooltip', handleMoveMonsterTooltip)
  window.removeEventListener('hide-monster-tooltip', handleHideMonsterTooltip)
})
</script>

<style scoped>
.monster-tooltip {
  position: fixed;
  background-color: rgba(20, 20, 30, 0.95);
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  max-width: 320px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 确保清晰渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  /* 使用 will-change 替代 transform，避免模糊 */
  will-change: left, top;
}

.monster-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.monster-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monster-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  image-rendering: -webkit-optimize-contrast;
}

.monster-title h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: bold;
}

.monster-title p {
  margin: 0;
  font-size: 14px;
  color: #ccc;
}

.monster-info-container {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 10px;
}

.monster-stats p {
  margin: 4px 0;
  font-size: 13px;
  color: #ddd;
}

.monster-area {
  color: #aaa !important;
  font-style: italic;
}

.monster-drops-hint p,
.monster-drops p {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #aaa;
  text-align: center;
}

/* 过渡动画 - 只使用 opacity 淡入，避免 transform 导致的抖动 */
.monster-tooltip-fade-enter-active,
.monster-tooltip-fade-leave-active {
  transition: opacity 0.1s ease;
}

.monster-tooltip-fade-enter-from,
.monster-tooltip-fade-leave-to {
  opacity: 0;
}

.monster-tooltip-fade-enter-to,
.monster-tooltip-fade-leave-from {
  opacity: 1;
}
</style>
