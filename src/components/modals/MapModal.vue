<template>
  <div v-if="isVisible" id="mapModal" class="map-modal">
    <div class="mp-penel-top">
      <div class="map-penel-name">地图</div>
      <div class="map-buttons">
        <button 
          v-for="(map, index) in mapConfigs" 
          :key="map.name" 
          class="map-button" 
          :class="'map-button-' + index"
          @click="switchMap(map)"
          @mouseover="showMapPreview(map)"
          :style="getMapButtonStyle(map, index)">
          {{ map.name }}
        </button>
      </div>
      <button class="mapCloseButton" @click="close">
        <img src="/pt/Default_res/ButtWndExit.png" alt="关闭" class="close-button-img" draggable="false" />
      </button>
    </div>
    <div class="map-penel-down">
      <div class="map-penel-down-left">
        <img :src="previewMap.background" :alt="previewMap.name" class="map-image" draggable="false" />
      </div>
      <div class="map-penel-down-right">
        <div v-if="previewMap.name" class="current-map-header">
          <span>{{ previewMap.name }} ({{ previewMap.levelRange }})</span>
        </div>
        <div class="current-map-monsters">
          <div v-if="previewMonsters.length > 0" class="monsters-grid">
            <div v-for="monster in previewMonsters" :key="monster.id" class="monster-preview-item"
              @click="showMonsterDrops(monster.id)"
              @mouseenter="event => showMonsterDetails(monster, event)"
              @mouseleave="hideMonsterDetails">
              <img :src="`/pt/monster_icon/${monster.id}.png`" :alt="monster.name" class="monster-icon"
                draggable="false" @error="handleImageError" />
              <div class="monster-info">
                <div class="monster-name" :style="{ color: getMonsterRankColor(monster.rank) }">
                  {{ monster.name }}
                </div>
                <div class="monster-level">Lv.{{ monster.level }}</div>
              </div>
            </div>
          </div>
          <div v-else class="no-monsters">该地图没有怪物信息</div>
        </div>

        <!-- 副本区域 -->
        <div v-if="previewDungeons.length > 0" class="current-map-dungeons">
          <h3>当前区域:副本 地牢</h3>
          <div class="dungeons-grid">
            <div v-for="dungeon in previewDungeons" :key="dungeon.id" class="dungeon-item"
              @click="enterDungeon(dungeon)">
              <img :src="dungeon.image" :alt="dungeon.name" draggable="false" />
              <span>{{ dungeon.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, computed, watch } from 'vue'
import { useMap } from '../../composables/useMap'
import { imageService } from '@/services/ImageService'
import { useItemsStore } from '../../store/items'

export default {
  name: 'MapModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    gameData: {
      type: Object,
      default: () => ({})
    },
    currentMap: {
      type: Object,
      default: () => ({})
    },
    player: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'map-change', 'enter-dungeon'],
  setup(props, { emit }) {
    const itemsStore = useItemsStore()

    // 使用useMap组合式函数
    const { availableMaps, getMonstersForMapPreview, getDungeonsForMap, getMonsterRankColor } =
      useMap(
        computed(() => props.gameData),
        computed(() => props.currentMap)
      )

    // 预览地图数据
    const previewMap = ref({
      name: '',
      levelRange: '',
      background: ''
    })

    // 预览怪物数据
    const previewMonsters = ref([])

    // 预览副本数据
    const previewDungeons = ref([])

    // 地图配置数据
    const mapConfigs = computed(() => {
      return availableMaps.value || []
    })

    const close = () => {
      emit('close')

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    // 处理图片加载错误
    const handleImageError = event => {
      event.target.src = '/pt/monster_icon/2087.png'
    }

    // 切换地图
    const switchMap = map => {
      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }

      // 发送地图变更事件
      emit('map-change', {
        mapName: map.name,
        levelRange: map.levelRange,
        background: map.background
      })

      // 切换地图后立即关闭模态框
      close()
    }

    // 显示地图预览
    const showMapPreview = map => {

      // 更新预览地图信息
      previewMap.value = {
        name: map.name,
        levelRange: map.levelRange,
        background: map.background
      }

      // 获取并更新预览怪物
      previewMonsters.value = getMonstersForMapPreview(map.name, map.levelRange)

      // 获取并更新预览副本
      previewDungeons.value = getDungeonsForMap(map.name)

    }

    // 当前悬停的怪物元素引用
    let currentHoveredMonsterEl = null
    // 隐藏延迟定时器
    let hideTimeoutId = null

    // 显示怪物详情（使用 MonsterTooltip 组件）
    const showMonsterDetails = (monster, event) => {
      // 取消任何待执行的隐藏操作
      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId)
        hideTimeoutId = null
      }
      currentHoveredMonsterEl = event.currentTarget
      window.dispatchEvent(
        new CustomEvent('show-monster-tooltip', {
          detail: {
            monsterId: monster.id,
            position: { x: event.clientX, y: event.clientY }
          }
        })
      )
    }

    // 隐藏怪物详情
    const hideMonsterDetails = (event) => {
      // 检查 relatedTarget 是否应该阻止隐藏
      if (event.relatedTarget) {
        // 如果鼠标移动到了另一个怪物卡片，不隐藏（由新卡片的 mouseenter 处理更新）
        if (event.relatedTarget.classList?.contains('monster-preview-item')) {
          return
        }

        // 如果鼠标移动到了当前怪物卡片的子元素内部，不隐藏
        if (currentHoveredMonsterEl && currentHoveredMonsterEl.contains(event.relatedTarget)) {
          return
        }
      }

      // 其他情况：隐藏 tooltip
      window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
      currentHoveredMonsterEl = null
    }

    // 移动怪物详情提示框
    const moveMonsterDetails = (monster, event) => {
      // 取消任何待执行的隐藏操作
      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId)
        hideTimeoutId = null
      }
      window.dispatchEvent(
        new CustomEvent('move-monster-tooltip', {
          detail: {
            monsterId: monster.id,
            position: { x: event.clientX, y: event.clientY }
          }
        })
      )
    }

    // 显示怪物掉落面板（通过自定义事件触发 MonsterDropsPanel 组件）
    const showMonsterDrops = monsterId => {
      window.dispatchEvent(new CustomEvent('show-monster-drops-panel', {
        detail: {
          monsterId: String(monsterId),
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }
      }))
    }

    // 进入副本
    const enterDungeon = dungeon => {
      console.log('进入副本:', dungeon)
      // 发送进入副本事件
      emit('enter-dungeon', dungeon)
    }

    /**
     * 获取地图按钮的样式（悬停背景图片）
     * 规则：第1个地图用第1个怪物，第2个地图用第5个怪物，第3个地图用第10个怪物...
     * 索引序列：0, 4, 9, 14, 19... (第1个差4，之后差5)
     * 如果未找到怪物，往前找5个位置直到找到为止
     * @param {Object} map - 地图配置
     * @param {number} index - 地图按钮索引
     * @returns {Object} CSS样式对象
     */
    const getMapButtonStyle = (map, index) => {
      // 获取该地图的怪物列表
      const monsters = getMonstersForMapPreview(map.name, map.levelRange)
      
      // 计算怪物索引：第1个用第1个(索引0)，第2个用第5个(索引4)，第3个用第10个(索引9)...
      // 公式：index === 0 ? 0 : (index * 5 - 1)
      // 序列：0, 4, 9, 14, 19...
      let monsterIndex = index === 0 ? 0 : (index * 5 - 1)
      
      // 如果未找到怪物，往前找5个位置直到找到为止
      let monster = monsters[monsterIndex]
      while (!monster && monsterIndex >= 5) {
        monsterIndex -= 5
        monster = monsters[monsterIndex]
      }
      
      // 如果还是没找到，尝试从最后往前找
      if (!monster && monsters.length > 0) {
        monster = monsters[monsters.length - 1]
      }
      
      const monsterId = monster ? monster.id : '2087'
      
      // 返回CSS变量，用于:hover伪类
      return {
        '--hover-bg-image': `url('/pt/monster_icon/${monsterId}.png')`
      }
    }

    // 监听模态框可见性变化
    watch(
      () => props.isVisible,
      newVal => {
        if (newVal && mapConfigs.value.length > 0) {
          nextTick(() => {
            // 确保gameData已加载后再显示默认地图
            const checkAndShowDefaultMap = () => {
              if (props.gameData && props.gameData.monsters) {
                // 默认显示帕里大陆的预览
                const defaultMap =
                  mapConfigs.value.find(map => map.name === '帕里大陆') || mapConfigs.value[0]

                showMapPreview(defaultMap)
              } else {
                // 如果gameData还未加载，稍后再检查
                setTimeout(checkAndShowDefaultMap, 100)
              }
            }

            checkAndShowDefaultMap()
          })
        }
      },
      { immediate: true }
    )

    return {
      // 数据
      mapConfigs,
      previewMap,
      previewMonsters,
      previewDungeons,

      // 方法
      close,
      handleImageError,
      switchMap,
      showMapPreview,
      showMonsterDetails,
      moveMonsterDetails,
      hideMonsterDetails,
      showMonsterDrops,
      enterDungeon,
      getMonsterRankColor,
      watch,
      // 新增方法
      getMapButtonStyle
    }
  }
}
</script>

<style scoped>
/* 怪物详情提示框样式 - 已移至 MonsterTooltip.vue 组件 */
/* 保留以下样式用于其他地方的 tooltip */

/* 怪物详情提示框子元素样式 - 已移至 MonsterTooltip.vue 组件 */
/* :global(.monster-tooltip .monster-header) {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

:global(.monster-tooltip .monster-avatar img) {
  max-width: 150px;
  max-height: 150px;
  width: auto;
  height: auto;
  border-radius: 5px;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
}

:global(.monster-tooltip .monster-title h3) {
  margin: 0 0 5px 0;
  font-size: 16px;
}

:global(.monster-tooltip .monster-stats p) {
  margin: 2px 0;
  font-size: 14px;
} */

/* 怪物掉落物品面板样式 - 全局样式 */
:global(.monster-drops-panel) {
  position: fixed;
  background-color: var(--theme-modal-bg);
  color: var(--theme-text);
  padding: 0;
  border-radius: 8px;
  text-align: center;
  border: 2px solid var(--theme-border-strong);
  z-index: 99999 !important;
  min-width: 200px;
  max-width: 620px;
  max-height: 40vh;
  overflow-y: auto;
  box-shadow: 0 0 20px var(--theme-border);
}

:global(.monster-drops-panel .panel-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  border-bottom: 1px solid var(--theme-border);
  padding: 5px;
  position: sticky;
  top: 0;
  background-color: var(--theme-surface-muted);
  z-index: 10;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

:global(.monster-drops-panel .monster-avatar img) {
  max-width: 64px;
  max-height: 64px;
  width: auto;
  height: auto;
  border-radius: 5px;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
}

:global(.monster-drops-panel h3) {
  margin: 0;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

:global(.monster-drops-panel .close-btn) {
  background: none;
  border: none;
  color: var(--theme-text);
  font-size: 24px;
  cursor: pointer;
  padding: 0 5px;
}

:global(.monster-drops-panel .close-btn:hover) {
  color: var(--theme-accent-strong);
}

/* MonsterDropsPanel 样式由组件自行定义 */

.map-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1888px;
  height: 900px;
  border-radius: 10px;
  z-index: 1100;
  overflow: hidden;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  color: var(--theme-text);
  background: var(--theme-map-bg);
}

.mp-penel-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  color: white;
  border-bottom: 2px solid #2c3e50;
}

.map-penel-name {
  font-size: 24px;
  font-weight: bold;
  color: var(--theme-accent);
}

.map-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: auto;
  /* max-width: 800px; */
}

.map-buttons::-webkit-scrollbar {
  height: 4px;
}

.map-buttons::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.map-buttons::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 150, 0.5);
  border-radius: 2px;
}

.map-button {
  color: var(--theme-text);
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  --hover-bg-image: url('/pt/monster_icon/2087.png');
  height: 60px;
}

.map-button:hover {
  background-image: var(--hover-bg-image);
  background-size: cover;
  background-position: center;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.mapCloseButton {
  background: #9bb5ad;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.map-penel-down {
  display: flex;
  height: 84%;
  width: 100%;
}

.map-penel-down-left {
  display: flex;
  flex: 0.7;
  justify-content: center;
  align-items: center;
  height: 756px;
}

/* 右侧地图面板布局：副本固定，怪物列表独立滚动 */
.map-penel-down-right {
  display: flex;
  flex-direction: column;
  max-height: 756px;
  overflow: hidden;
  flex: 0.3;
  /* 为 sticky 顶部预留高度变量（可根据需要调整） */
  --map-header-height: 36px;
  margin-right: 10px;
}

.map-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.current-map-header {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
  margin-bottom: 10px;
  color: #f2e0b3;
  border-bottom: 1px solid #b1b1b1;
  padding-bottom: 5px;
  position: sticky;
  top: 0;
  z-index: 6;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
}

.current-map-monsters {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 10px;
}

.no-monsters {
  text-align: center;
  color: #ccc;
  font-style: italic;
  padding: 20px;
}

.monsters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.monster-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgb(255 255 255 / 30%);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.monster-preview-item:hover {
  background: rgba(74, 144, 226, 0.3);
  /* transform: translateY(-2px); */
  /* 注释掉，避免鼠标悬停时元素位移导致 mouseleave 事件误触发 */
}

.monster-preview-item .monster-icon {
  max-width: 48px;
  max-height: 48px;
  width: auto;
  height: auto;
  border-radius: 4px;
  margin-bottom: 5px;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
}

.monster-preview-item .monster-name {
  font-size: 12px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  font-weight: bold;
  color: white;
}

.monster-preview-item .monster-level {
  font-size: 10px;
  color: #aaa;
  text-align: center;
}

.monster-preview-item .monster-info {
  text-align: center;
  margin-top: 5px;
}

.monster-preview-item .monster-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  font-weight: bold;
  color: white;
}

.monster-preview-item .monster-level {
  font-size: 10px;
  color: #aaa;
}

/* 副本区域样式 */
.current-map-dungeons {
    padding: 10px;
    background: rgb(70 82 78);
    border-radius: 6px;
    max-height: 200px;
    overflow-y: scroll;
}

.current-map-dungeons h3 {
  margin-top: 0;
  color: #f2e0b3;
  border-bottom: 1px solid #b1b1b1;
  padding-bottom: 5px;
  margin-bottom: 10px;
}

.dungeons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 6px;
}

.dungeon-item {
  padding: 8px 12px;
  border-radius: 6px;
  background: linear-gradient(135deg, #4a4a4a, #2a2a2a);
  color: #fff;
  border: 1px solid #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dungeon-item:hover {
  background: linear-gradient(135deg, #5a5a5a, #3a3a3a);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.dungeon-item img {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 5px;
  margin-bottom: 5px;
}

.dungeon-item span {
  display: block;
  font-size: 11px;
  font-weight: bold;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-button-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
