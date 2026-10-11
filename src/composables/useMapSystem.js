import { ref, computed } from 'vue'
import { useMap } from './useMap'

/**
 * 地图系统组合式API
 * 将地图相关的逻辑从Main.vue中抽离出来
 */
export function useMapSystem (gameData, currentMap) {
  // 使用现有的useMap组合式函数
  const {
    showMapModal,
    availableMaps,
    openMapModal,
    closeMapModal,
    handleMapChange,
    getMonstersForMapPreview,
    getDungeonsForMap,
    getMonsterRankColor
  } = useMap(
    computed(() => gameData),
    computed(() => currentMap)
  )

  // 响应式数据
  const previewMap = ref({
    name: '',
    levelRange: '',
    background: ''
  })

  const previewMonsters = ref([])
  const previewDungeons = ref([])

  // 计算属性
  const mapConfigs = computed(() => {
    return availableMaps.value || []
  })

  // 方法
  const switchMap = map => {
    // 发送地图变更事件
    handleMapChange({
      mapName: map.name,
      levelRange: map.levelRange,
      background: map.background
    })

    // 关闭地图模态框
    closeMapModal()
  }

  const showMapPreview = map => {
    console.log('显示地图预览:', map)
    // 更新预览地图信息
    previewMap.value = {
      name: map.name,
      levelRange: map.levelRange,
      background: map.background
    }

    // 获取并更新预览怪物
    previewMonsters.value = getMonstersForMapPreview(map.name, map.levelRange)
    console.log('预览怪物:', previewMonsters.value)

    // 获取并更新预览副本
    previewDungeons.value = getDungeonsForMap(map.name)
    console.log('预览副本:', previewDungeons.value)
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    showMapModal,
    previewMap,
    previewMonsters,
    previewDungeons,

    // 计算属性
    mapConfigs,
    availableMaps,

    // 方法
    openMapModal,
    closeMapModal,
    switchMap,
    showMapPreview,
    handleMapChange,
    getMonstersForMapPreview,
    getDungeonsForMap,
    getMonsterRankColor
  }
}
