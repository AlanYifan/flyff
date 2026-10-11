<!--
  @fileoverview 宝石合成组件
  @description 珠宝大师-皮奇：宝石合成功能面板
  @author FLYFF Team
  @version 1.1.0
  @created 2026-03-11
  @updated 2026-03-12 - 重构合成规则：碎片→1级，x级→x+1级，动态查找
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">宝石合成</h3>

    <div class="jewelry-master-epic-content">
      <!-- 1. 宝石选择区域 -->
      <div class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">选择宝石（碎片或完整宝石）</div>
        <div ref="selectSynthesisGemBoxRef" class="jewelry-master-select-box"
          :class="{ active: showSynthesisGemPanel, disabled: synthesisGemItems.length === 0 }"
          @click="toggleSynthesisGemPanel">
          <template v-if="selectedSynthesisGem">
            <img :src="selectedSynthesisGem.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getGemDisplayName(selectedSynthesisGem) }}</span>
              <span class="jewelry-master-select-count">×{{ selectedSynthesisGem.currentStack || 1 }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ synthesisGemItems.length === 0 ? '背包中没有可合成的宝石' : '选择要合成的宝石' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showSynthesisGemPanel }">▼</span>
        </div>
      </div>

      <!-- 2. 自动合成进度条（自动合成中显示在按钮上方） -->
      <div v-if="isAutoSynthesising && showSynthesisProgress" class="jewelry-master-synthesis-progress-wrapper">
        <div class="jewelry-master-synthesis-progress">
          <div class="jewelry-master-progress-bar">
            <div class="jewelry-master-progress-fill" :style="{ width: synthesisProgress + '%' }"></div>
          </div>
          <span class="jewelry-master-progress-text">合成中... {{ Math.floor(synthesisProgress) }}%</span>
        </div>
      </div>

      <!-- 3. 单次合成进度条 -->
      <div v-if="!isAutoSynthesising && showSynthesisProgress" class="jewelry-master-synthesis-progress-wrapper">
        <div class="jewelry-master-synthesis-progress">
          <div class="jewelry-master-progress-bar">
            <div class="jewelry-master-progress-fill" :style="{ width: synthesisProgress + '%' }"></div>
          </div>
          <span class="jewelry-master-progress-text">合成中... {{ Math.floor(synthesisProgress) }}%</span>
        </div>
      </div>

      <!-- 4. 合成结果展示（非合成中显示） -->
      <div v-if="!showSynthesisProgress && synthesisResultGem" class="jewelry-master-epic-section">
        <div class="jewelry-master-epic-title">合成结果</div>
        <div class="jewelry-master-synthesis-result">
          <img :src="synthesisResultGem.icon" class="jewelry-master-synthesis-result-icon"
            @error="handleIconError" @mouseenter="showItemTooltipById($event, synthesisResultGem.id)"
            @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
          <div class="jewelry-master-synthesis-result-info">
            <span class="jewelry-master-synthesis-result-name">{{ getGemDisplayName(synthesisResultGem) }}</span>
            <span class="jewelry-master-synthesis-result-count">×{{ synthesisResultCount }}</span>
          </div>
        </div>
      </div>

      <!-- 4. 操作按钮区域 -->
      <div class="jewelry-master-epic-actions">
        <button class="jewelry-master-action-btn jewelry-master-auto-btn"
          :class="{ 'jewelry-master-stop-btn': isAutoSynthesising }"
          :disabled="!canAutoSynthesis && !isAutoSynthesising" @click="toggleAutoSynthesis">
          {{ isAutoSynthesising ? '停止合成' : '自动合成' }}
        </button>
        <button class="jewelry-master-action-btn jewelry-master-synthesis-btn"
          :disabled="!canSynthesis" @click="handleSynthesis">
          合成
        </button>
        <button class="jewelry-master-action-btn jewelry-master-reset-btn" @click="resetSynthesis">
          重置
        </button>
        <div v-if="synthesisMessage" class="jewelry-master-message" :class="{ success: synthesisSuccess, error: !synthesisSuccess }">
          {{ synthesisMessage }}
        </div>
      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <transition name="dice-panel-fade">
        <div v-if="showSynthesisGemPanel && synthesisGemItems.length > 0" ref="panelSynthesisGemRef"
          class="jewelry-master-dice-popup" :style="synthesisGemPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择宝石</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in synthesisGemItems" :key="item.uniqueId || item.id"
              class="jewelry-master-popup-item"
              :class="{ selected: selectedSynthesisGemId === item.uniqueId || selectedSynthesisGemId === item.id }"
              @click="selectSynthesisGem(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getGemDisplayName(item) }}</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
/**
 * @fileoverview 宝石合成组件
 * @description 珠宝大师-皮奇：宝石合成功能面板
 * @author FLYFF Team
 * @version 1.1.0
 * @created 2026-03-11
 * @updated 2026-03-12 - 重构合成规则：碎片→1级，x级→x+1级，动态查找
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'

// 宝石名称正则匹配模式
const GEM_PATTERNS = {
  // 碎片模式：如 "闪耀黄玉碎片"
  shard: /^闪耀(.+)碎片$/,
  // 带级宝石模式：如 "闪耀黄玉（1级）"
  levelGem: /^闪耀(.+)（(\d+)级）$/
}

/**
 * 从宝石名称中提取宝石类型和等级
 * @param {string} gemName - 宝石名称
 * @returns {Object|null} { type: 'shard' | 'levelGem', gemType: string, level: number | null }
 */
const parseGemName = gemName => {
  if (!gemName) return null

  // 检查是否是碎片
  const shardMatch = gemName.match(GEM_PATTERNS.shard)
  if (shardMatch) {
    return { type: 'shard', gemType: shardMatch[1], level: null }
  }

  // 检查是否是带级宝石
  const levelMatch = gemName.match(GEM_PATTERNS.levelGem)
  if (levelMatch) {
    return { type: 'levelGem', gemType: levelMatch[1], level: parseInt(levelMatch[2], 10) }
  }

  return null
}

/**
 * 动态查找合成结果宝石ID
 * 用途/业务意图：根据源宝石ID查找合成后的目标宝石ID
 * - 碎片 → 1级宝石
 * - x级 → 下一个存在的更高级宝石（可能跳级）
 * @param {number} sourceGemId - 源宝石ID
 * @returns {number|null} 合成结果宝石ID，如果无法合成则返回null
 */
const findSynthesisResultId = sourceGemId => {
  const sourceGemInfo = ITEM_INFO[sourceGemId]
  if (!sourceGemInfo || !sourceGemInfo.name) return null

  const gemName = sourceGemInfo.name.cns || sourceGemInfo.name.en
  if (!gemName) return null

  const parsed = parseGemName(gemName)
  if (!parsed) return null

  const { type, gemType, level } = parsed

  if (type === 'shard') {
    // 碎片 → 1级宝石
    const targetGemName = `闪耀${gemType}（1级）`
    for (const [id, item] of Object.entries(ITEM_INFO)) {
      if (item && item.name) {
        const name = item.name.cns || item.name.en
        if (name === targetGemName) {
          return parseInt(id, 10)
        }
      }
    }
    return null
  }

  if (type === 'levelGem' && level !== null) {
    // x级 → 下一个存在的更高级宝石（可能跳级）
    // 收集该类型所有宝石的等级
    const allLevels = []
    const levelToIdMap = new Map()

    for (const [id, item] of Object.entries(ITEM_INFO)) {
      if (item && item.name) {
        const name = item.name.cns || item.name.en
        const match = name.match(/^闪耀(.+)（(\d+)级）$/)
        if (match && match[1] === gemType) {
          const itemLevel = parseInt(match[2], 10)
          allLevels.push(itemLevel)
          levelToIdMap.set(itemLevel, parseInt(id, 10))
        }
      }
    }

    // 排序等级
    allLevels.sort((a, b) => a - b)

    // 找到当前等级的索引，然后找下一个更高级
    const currentIndex = allLevels.indexOf(level)
    if (currentIndex === -1 || currentIndex === allLevels.length - 1) {
      // 当前等级不存在或已经是最高级
      return null
    }

    const nextLevel = allLevels[currentIndex + 1]
    return levelToIdMap.get(nextLevel) || null
  }

  return null
}

/**
 * 检查宝石是否可合成
 * 用途/业务意图：判断宝石是否满足合成条件
 * @param {Object} item - 物品对象
 * @returns {boolean} 是否可合成
 */
const isGemSynthesizable = item => {
  if (!item || !item.id) return false

  const gemInfo = ITEM_INFO[item.id]
  if (!gemInfo || !gemInfo.name) return false

  const gemName = gemInfo.name.cns || gemInfo.name.en
  if (!gemName) return false

  // 必须以"闪耀"开头
  if (!gemName.startsWith('闪耀')) return false

  // 检查是否是碎片或带级宝石
  const parsed = parseGemName(gemName)
  if (!parsed) return false

  // 检查是否能找到合成结果（会自动判断是否为最高级）
  const resultId = findSynthesisResultId(item.id)
  return resultId !== null
}

export default {
  name: 'GemSynthesis',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getGemDisplayName,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const selectSynthesisGemBoxRef = ref(null)
    const panelSynthesisGemRef = ref(null)

    // 状态
    const selectedSynthesisGemId = ref(null)
    const showSynthesisGemPanel = ref(false)
    const showSynthesisProgress = ref(false)
    const synthesisProgress = ref(0)
    const synthesisMessage = ref('')
    const synthesisSuccess = ref(false)
    const isSynthesising = ref(false)
    const isAutoSynthesising = ref(false)
    const shouldStopAutoSynthesis = ref(false)
    let synthesisProgressRafId = null

    // 面板位置样式（响应式）
    const synthesisGemPanelStyle = ref({})

    /**
     * 获取可合成的宝石列表
     * 规则：从玩家背包中筛选所有闪耀开头的宝石（碎片或带级宝石）
     */
    const synthesisGemItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 检查是否可合成（碎片或带级宝石，且能找到下一级）
        return isGemSynthesizable(item)
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取选中的宝石
     * 注意：可堆叠物品通过 ID 匹配，不可堆叠物品通过 uniqueId 或 ID 匹配
     */
    const selectedSynthesisGem = computed(() => {
      if (!selectedSynthesisGemId.value) return null
      return synthesisGemItems.value.find(item => {
        const gemInfo = ITEM_INFO[item.id]
        const stack = gemInfo?.stack || 1
        if (stack > 1) {
          // 可堆叠物品，使用 ID 匹配
          return item.id === selectedSynthesisGemId.value
        }
        // 不可堆叠物品，使用 uniqueId 或 ID 匹配
        return item.uniqueId === selectedSynthesisGemId.value || item.id === selectedSynthesisGemId.value
      })
    })

    /**
     * 获取合成结果宝石
     */
    const synthesisResultGem = computed(() => {
      if (!selectedSynthesisGem.value) return null

      const resultGemId = findSynthesisResultId(selectedSynthesisGem.value.id)
      if (!resultGemId) return null

      const resultGemInfo = ITEM_INFO[resultGemId]
      if (!resultGemInfo) return null

      return {
        ...resultGemInfo,
        id: resultGemId,
        name: resultGemInfo.name?.cns || resultGemInfo.name?.en || `宝石#${resultGemId}`,
        icon: `/pt/item_icon/${resultGemId}.png`
      }
    })

    /**
     * 获取合成结果数量
     */
    const synthesisResultCount = computed(() => {
      if (!selectedSynthesisGem.value) return 0
      const stack = selectedSynthesisGem.value.currentStack || 1
      return Math.floor(stack / 10)
    })

    /**
     * 判断是否可以合成
     */
    const canSynthesis = computed(() => {
      if (!selectedSynthesisGem.value || isSynthesising.value) return false
      const stack = selectedSynthesisGem.value.currentStack || 1
      return stack >= 10
    })

    /**
     * 判断是否可以自动合成
     */
    const canAutoSynthesis = computed(() => {
      if (!selectedSynthesisGem.value || isAutoSynthesising.value) return false
      const stack = selectedSynthesisGem.value.currentStack || 1
      return stack >= 10
    })

    /**
     * 切换面板
     */
    const toggleSynthesisGemPanel = async () => {
      if (synthesisGemItems.value.length === 0) return
      showSynthesisGemPanel.value = !showSynthesisGemPanel.value
      if (showSynthesisGemPanel.value) {
        await nextTick()
        updatePanelPosition(selectSynthesisGemBoxRef, synthesisGemPanelStyle)
      }
    }

    /**
     * 选择宝石
     * 注意：闪耀宝石 stack=999 > 1，可堆叠，使用 ID 进行标识
     */
    const selectSynthesisGem = gem => {
      // 可堆叠物品（stack>1）使用 ID，不可堆叠物品使用 uniqueId
      const gemInfo = ITEM_INFO[gem.id]
      const stack = gemInfo?.stack || 1
      selectedSynthesisGemId.value = stack > 1 ? gem.id : (gem.uniqueId || gem.id)
      showSynthesisGemPanel.value = false
      synthesisMessage.value = ''
    }

    /**
     * 进度动画
     */
    const startSynthesisProgress = () => {
      return new Promise(resolve => {
        if (synthesisProgressRafId) cancelAnimationFrame(synthesisProgressRafId)
        showSynthesisProgress.value = true
        synthesisProgress.value = 0
        const startTime = performance.now()
        const duration = 1000
        const updateProgress = currentTime => {
          const progress = Math.min(((currentTime - startTime) / duration) * 100, 100)
          synthesisProgress.value = progress
          if (progress >= 100) {
            synthesisProgressRafId = null
            resolve()
          } else {
            synthesisProgressRafId = requestAnimationFrame(updateProgress)
          }
        }
        synthesisProgressRafId = requestAnimationFrame(updateProgress)
      })
    }

    const endSynthesisProgress = () => {
      if (synthesisProgressRafId) cancelAnimationFrame(synthesisProgressRafId)
      showSynthesisProgress.value = false
      synthesisProgress.value = 0
    }

    /**
     * 根据宝石ID在背包中查找物品
     * @param {number} gemId - 宝石ID
     * @returns {Object|null} 背包中的物品对象或null
     */
    const findGemInBag = gemId => {
      return itemsStore.playerBag.find(item => Number(item.id) === Number(gemId)) || null
    }

    /**
     * 执行合成操作
     * @param {number} sourceGemId - 源宝石ID
     * @returns {Object|null} 合成结果信息 { success: boolean, resultGemId: number } 或 null
     */
    const doSynthesis = sourceGemId => {
      if (!sourceGemId) return null

      const resultGemId = findSynthesisResultId(sourceGemId)
      if (!resultGemId) return null

      // 在背包中查找源宝石（使用ID匹配，因为currentStack会变化）
      const bagGem = findGemInBag(sourceGemId)
      if (!bagGem) return null

      const currentStack = bagGem.currentStack || 1
      if (currentStack < 10) return null

      // 扣除10个源宝石
      bagGem.currentStack = currentStack - 10
      // 如果扣除后数量为0，从背包中移除
      if (bagGem.currentStack <= 0) {
        const index = itemsStore.playerBag.indexOf(bagGem)
        if (index !== -1) itemsStore.playerBag.splice(index, 1)
      }

      // 添加合成结果（检查背包中是否已有同类宝石，有则堆叠）
      const existingResult = findGemInBag(resultGemId)
      if (existingResult && (existingResult.currentStack || 0) < (existingResult.stack || 999)) {
        // 已有同类宝石且未达到堆叠上限，直接堆叠
        existingResult.currentStack = (existingResult.currentStack || 1) + 1
      } else {
        // 没有同类宝石或已达到堆叠上限，创建新物品
        // 注意：宝石是可堆叠物品（stack>1），不需要 uniqueId
        const resultGemInfo = ITEM_INFO[resultGemId]
        const newItem = {
          id: resultGemId,
          currentStack: 1,
          stack: resultGemInfo?.stack || 999,
          icon: `/pt/item_icon/${resultGemId}.png`,
          category: resultGemInfo?.category || 'material',
          subcategory: resultGemInfo?.subcategory || 'ultimatejewel',
          name: resultGemInfo?.name?.cns || `宝石#${resultGemId}`,
          rarity: resultGemInfo?.rarity || 'uncommon',
          // 关键：必须包含 abilities 属性，否则镶嵌后不会有属性加成
          abilities: resultGemInfo?.abilities || []
        }
        itemsStore.playerBag.push(newItem)
      }

      return { success: true, resultGemId }
    }

    /**
     * 处理合成
     */
    const handleSynthesis = async () => {
      if (!canSynthesis.value) return

      isSynthesising.value = true
      synthesisMessage.value = ''

      // 记录源宝石ID（合成过程中不会变化）
      const sourceGemId = selectedSynthesisGem.value.id
      const gemName = getGemDisplayName(selectedSynthesisGem.value)
      const resultName = synthesisResultGem.value ? getGemDisplayName(synthesisResultGem.value) : ''

      try {
        await startSynthesisProgress()
        const result = doSynthesis(sourceGemId)
        endSynthesisProgress()

        if (result && result.success) {
          synthesisSuccess.value = true
          synthesisMessage.value = `合成成功！消耗10个${gemName}，获得1个${resultName}`

          emit('play-sfx', 'InfUpgradeSuccess.wav')
          emit('add-battle-log', `合成成功！消耗10个${gemName}，获得${resultName}`, 'success')
          emit('show-animation-message', `合成成功！获得 ${resultName}`, 'upgrade-success', synthesisResultGem.value?.icon)

          gameStore.player.bag = [...itemsStore.playerBag]
          savePlayerData({ bag: [...itemsStore.playerBag] })
        } else {
          synthesisSuccess.value = false
          synthesisMessage.value = '合成失败，请重试'
        }
      } catch (error) {
        console.error('[GemSynthesis] 合成失败:', error)
        synthesisSuccess.value = false
        synthesisMessage.value = '合成失败，请重试'
        endSynthesisProgress()
      } finally {
        isSynthesising.value = false
        // 延迟清空选择，让用户看到结果
        setTimeout(() => {
          selectedSynthesisGemId.value = null
        }, 1500)
      }
    }

    /**
     * 自动合成
     * 每次合成都显示进度条、输出战斗日志和动画、播放音效
     */
    const startAutoSynthesis = async () => {
      if (!canAutoSynthesis.value) return

      isAutoSynthesising.value = true
      shouldStopAutoSynthesis.value = false
      synthesisMessage.value = '自动合成中...'
      let totalSynthesisCount = 0
      let totalConsumed = 0

      // 记录源宝石ID（合成过程中不会变化）
      const sourceGemId = selectedSynthesisGem.value.id
      const sourceGemInfo = ITEM_INFO[sourceGemId]
      const sourceGemName = sourceGemInfo ? (sourceGemInfo.name?.cns || sourceGemInfo.name?.en || `宝石#${sourceGemId}`) : ''
      const resultGemId = findSynthesisResultId(sourceGemId)
      const resultGemInfo = resultGemId ? ITEM_INFO[resultGemId] : null
      const resultGemName = resultGemInfo ? (resultGemInfo.name?.cns || resultGemInfo.name?.en || `宝石#${resultGemId}`) : ''
      const resultGemIcon = resultGemId ? `/pt/item_icon/${resultGemId}.png` : ''

      try {
        while (!shouldStopAutoSynthesis.value) {
          // 直接在背包中查找当前宝石数量
          const bagGem = findGemInBag(sourceGemId)
          if (!bagGem) break
          const stack = bagGem.currentStack || 1
          if (stack < 10) break

          // 显示进度条，等待1秒
          await startSynthesisProgress()

          // 检查是否被停止
          if (shouldStopAutoSynthesis.value) {
            endSynthesisProgress()
            break
          }

          // 执行合成
          const result = doSynthesis(sourceGemId)

          // 隐藏进度条
          endSynthesisProgress()

          if (result && result.success) {
            totalSynthesisCount++
            totalConsumed += 10
            synthesisMessage.value = `自动合成中... 已合成${totalSynthesisCount}次`

            // 每次合成都输出战斗日志、动画、播放音效
            emit('play-sfx', 'InfUpgradeSuccess.wav')
            emit('add-battle-log', `合成成功！消耗10个${sourceGemName}，获得${resultGemName}`, 'success')
            emit('show-animation-message', `合成成功！获得 ${resultGemName}`, 'upgrade-success', resultGemIcon)
          } else break

          // 短暂延迟后继续下一次合成
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        if (totalSynthesisCount > 0) {
          synthesisSuccess.value = true
          if (shouldStopAutoSynthesis.value) {
            synthesisMessage.value = `已停止合成！共合成${totalSynthesisCount}次，消耗${totalConsumed}个宝石，获得${totalSynthesisCount}个${resultGemName}`
          } else {
            synthesisMessage.value = `自动合成完成！共合成${totalSynthesisCount}次，消耗${totalConsumed}个宝石，获得${totalSynthesisCount}个${resultGemName}`
          }

          gameStore.player.bag = [...itemsStore.playerBag]
          savePlayerData({ bag: [...itemsStore.playerBag] })
        } else {
          synthesisSuccess.value = false
          synthesisMessage.value = '没有足够的宝石进行合成'
        }
      } catch (error) {
        console.error('[GemSynthesis] 自动合成失败:', error)
        synthesisSuccess.value = false
        synthesisMessage.value = '自动合成失败'
      } finally {
        isAutoSynthesising.value = false
        shouldStopAutoSynthesis.value = false
        selectedSynthesisGemId.value = null
      }
    }

    /**
     * 停止自动合成
     */
    const stopAutoSynthesis = () => {
      shouldStopAutoSynthesis.value = true
    }

    /**
     * 切换自动合成状态
     */
    const toggleAutoSynthesis = () => {
      if (isAutoSynthesising.value) {
        stopAutoSynthesis()
      } else {
        startAutoSynthesis()
      }
    }

    /**
     * 重置
     */
    const resetSynthesis = () => {
      selectedSynthesisGemId.value = null
      showSynthesisGemPanel.value = false
      showSynthesisProgress.value = false
      synthesisProgress.value = 0
      synthesisMessage.value = ''
      synthesisSuccess.value = false
    }

    /**
     * 点击外部关闭
     */
    const handleClickOutside = e => {
      if (showSynthesisGemPanel.value) {
        const isClickInsideBox = selectSynthesisGemBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelSynthesisGemRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showSynthesisGemPanel.value = false
          hideItemTooltip()
        }
      }
    }

    onMounted(() => document.addEventListener('click', handleClickOutside))
    onUnmounted(() => document.removeEventListener('click', handleClickOutside))

    return {
      // 引用
      selectSynthesisGemBoxRef, panelSynthesisGemRef,
      // 状态
      selectedSynthesisGemId, showSynthesisGemPanel, showSynthesisProgress, synthesisProgress, synthesisMessage, synthesisSuccess,
      isAutoSynthesising,
      // 计算属性
      synthesisGemItems, selectedSynthesisGem, synthesisResultGem, synthesisResultCount,
      canSynthesis, canAutoSynthesis, synthesisGemPanelStyle,
      // 方法
      toggleSynthesisGemPanel, selectSynthesisGem, handleSynthesis, startAutoSynthesis, stopAutoSynthesis, toggleAutoSynthesis, resetSynthesis,
      showItemTooltip, showItemTooltipById, hideItemTooltip, moveItemTooltip, handleIconError, getGemDisplayName
    }
  }
}
</script>

<style scoped>
.jewelry-master-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 35, 0.95);
  border-radius: 6px;
  padding: 4px;
  overflow: hidden;
}

.jewelry-master-panel-title {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 3px;
  text-align: center;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.jewelry-master-epic-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.jewelry-master-epic-section { display: flex; flex-direction: column; gap: 2px; }
.jewelry-master-epic-title { font-size: 10px; color: #aaa; }

.jewelry-master-select-box {
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 28px;
}

.jewelry-master-select-box:hover:not(.disabled) { border-color: #5a5a8a; }
.jewelry-master-select-box.active { border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
.jewelry-master-select-box.disabled { opacity: 0.5; cursor: not-allowed; }

.jewelry-master-select-icon { width: 22px; height: 22px; object-fit: contain; margin-right: 4px; }
.jewelry-master-select-info { flex: 1; display: flex; flex-direction: column; }
.jewelry-master-select-name { color: #fff; font-size: 11px; }
.jewelry-master-select-count { color: #00ff88; font-size: 10px; margin-right: 4px; }
.jewelry-master-select-placeholder { flex: 1; color: #666; font-size: 10px; }
.jewelry-master-select-arrow { color: #888; font-size: 8px; transition: transform 0.2s; }
.jewelry-master-select-arrow.rotated { transform: rotate(180deg); }

/* 合成结果 */
.jewelry-master-synthesis-result { display: flex; align-items: center; gap: 6px; padding: 6px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; border: 1px solid #3a3a5a; }
.jewelry-master-synthesis-result-icon { width: 28px; height: 28px; object-fit: contain; border-radius: 3px; }
.jewelry-master-synthesis-result-info { display: flex; flex-direction: column; gap: 1px; }
.jewelry-master-synthesis-result-name { font-size: 11px; color: #ffd700; font-weight: bold; }
.jewelry-master-synthesis-result-count { font-size: 10px; color: #00ff88; }

/* 进度条 */
/* 进度条容器 */
.jewelry-master-synthesis-progress-wrapper {
  padding: 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid #4a90d9;
  box-shadow: 0 0 15px rgba(74, 144, 217, 0.3);
}

.jewelry-master-synthesis-progress { display: flex; align-items: center; gap: 6px; }
.jewelry-master-progress-bar { flex: 1; height: 14px; background: #2a2a4a; border-radius: 7px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3); }
.jewelry-master-progress-fill { height: 100%; background: linear-gradient(90deg, #4a90d9 0%, #67b26f 50%, #ffd700 100%); border-radius: 7px; transition: width 0.05s linear; box-shadow: 0 0 8px rgba(255, 215, 0, 0.5); }
.jewelry-master-progress-text { font-size: 10px; color: #ffd700; min-width: 70px; text-align: right; font-weight: bold; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }

/* 操作按钮 - 一行显示 */
.jewelry-master-epic-actions { display: flex; align-items: center; gap: 4px; margin-top: auto; padding-top: 4px; border-top: 1px solid #3a3a5a; }

.jewelry-master-action-btn { padding: 4px 8px; border: none; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.jewelry-master-auto-btn { background: linear-gradient(135deg, #2a6a4a 0%, #3a8a5a 100%); color: #fff; }
.jewelry-master-auto-btn:hover:not(:disabled) { background: linear-gradient(135deg, #3a8a5a 0%, #4aaa6a 100%); box-shadow: 0 0 10px rgba(58, 138, 90, 0.5); }
.jewelry-master-auto-btn:disabled { background: #3a3a4a; color: #6a6a6a; cursor: not-allowed; }

/* 停止合成按钮样式 */
.jewelry-master-stop-btn { background: linear-gradient(135deg, #8a3a3a 0%, #aa4a4a 100%) !important; }
.jewelry-master-stop-btn:hover { background: linear-gradient(135deg, #aa4a4a 0%, #ca5a5a 100%) !important; box-shadow: 0 0 10px rgba(170, 74, 74, 0.5) !important; }

.jewelry-master-synthesis-btn { background: linear-gradient(135deg, #4a6a9a 0%, #5a8aba 100%); color: #fff; }
.jewelry-master-synthesis-btn:hover:not(:disabled) { background: linear-gradient(135deg, #5a8aba 0%, #6a9aca 100%); box-shadow: 0 0 10px rgba(90, 138, 186, 0.5); }
.jewelry-master-synthesis-btn:disabled { background: #3a3a4a; color: #6a6a6a; cursor: not-allowed; }

.jewelry-master-reset-btn { background: linear-gradient(135deg, #6a6a6a 0%, #8a8a8a 100%); color: #fff; }
.jewelry-master-reset-btn:hover { background: linear-gradient(135deg, #8a8a8a 0%, #aaa 100%); box-shadow: 0 0 8px rgba(138, 138, 138, 0.5); }

.jewelry-master-message { width: 100%; margin-top: 4px; padding: 4px 8px; border-radius: 4px; font-size: 10px; text-align: center; }
.jewelry-master-message.success { background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; color: #00ff88; }
.jewelry-master-message.error { background: rgba(255, 68, 68, 0.2); border: 1px solid #ff4444; color: #ff6666; }

/* 弹出面板 - 使用 fixed 定位浮在上层 */
.jewelry-master-dice-popup { position: fixed; width: 240px; max-height: 260px; background: rgba(30, 30, 50, 0.98); border: 1px solid #4a4a6a; border-radius: 6px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); overflow: hidden; z-index: 9999; }
.jewelry-master-popup-header { padding: 4px 8px; background: rgba(0, 0, 0, 0.3); border-bottom: 1px solid #3a3a5a; color: #ffd700; font-size: 11px; font-weight: bold; }
.jewelry-master-popup-items { max-height: 220px; overflow-y: auto; }
.jewelry-master-popup-item { display: flex; align-items: center; padding: 4px 8px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid rgba(60, 60, 90, 0.3); }
.jewelry-master-popup-item:hover { background: rgba(255, 215, 0, 0.1); }
.jewelry-master-popup-item.selected { background: rgba(255, 215, 0, 0.2); border-left: 3px solid #ffd700; }
.jewelry-master-popup-icon { width: 22px; height: 22px; object-fit: contain; margin-right: 4px; }
.jewelry-master-popup-info { flex: 1; }
.jewelry-master-popup-name { color: #fff; font-size: 11px; }
.jewelry-master-popup-count { color: #888; font-size: 9px; margin-top: 1px; }

.dice-panel-fade-enter-active, .dice-panel-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.dice-panel-fade-enter-from, .dice-panel-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
