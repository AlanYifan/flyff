<!--
  @fileoverview 宝石提取组件
  @description 珠宝大师-皮奇：分解武器提取宝石功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">分解武器提取宝石</h3>

    <div class="jewelry-master-gem-content">
      <!-- 武器选择区域 -->
      <div class="jewelry-master-weapon-section">
        <div class="jewelry-master-weapon-title">选择要分解的武器</div>
        <!-- 选择框 -->
        <div ref="selectWeaponBoxRef" class="jewelry-master-select-box"
          :class="{ active: showWeaponPanel, disabled: weaponItems.length === 0 }" @click="toggleWeaponPanel">
          <template v-if="selectedWeapon">
            <img :src="selectedWeapon.icon" class="jewelry-master-select-icon" @error="handleIconError" />
            <div class="jewelry-master-select-info">
              <span class="jewelry-master-select-name">{{ getWeaponDisplayName(selectedWeapon) }}</span>
              <span class="jewelry-master-select-level">Lv.{{ selectedWeapon.level || 1 }}</span>
            </div>
          </template>
          <span v-else class="jewelry-master-select-placeholder">
            {{ weaponItems.length === 0 ? '背包中没有符合条件的武器' : '点击选择武器' }}
          </span>
          <span class="jewelry-master-select-arrow" :class="{ rotated: showWeaponPanel }">▼</span>
        </div>
      </div>

      <!-- 提取结果显示区域 -->
      <div class="jewelry-master-extract-section">
        <div class="jewelry-master-extract-title">可能获得的宝石</div>
        <div class="jewelry-master-extract-display">
          <div v-if="extractGemInfo" class="jewelry-master-extract-result has-marquee">
            <img :src="`/pt/item_icon/${extractGemInfo.gemId}.png`" class="jewelry-master-extract-icon"
              @error="handleIconError" @mouseenter="showItemTooltipById($event, extractGemInfo.gemId)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip" />
            <div class="jewelry-master-extract-info">
              <div class="jewelry-master-extract-name">{{ extractGemInfo.name }}</div>
              <div class="jewelry-master-extract-chance">成功率: {{ extractGemInfo.chance }}%</div>
            </div>
          </div>
          <div v-else class="jewelry-master-extract-placeholder">
            选择武器后显示可提取的宝石
          </div>
        </div>
      </div>

      <!-- 提取进度条 -->
      <div v-if="showExtractProgress" class="jewelry-master-progress-wrapper">
        <div class="jewelry-master-progress-section">
          <div class="jewelry-master-progress-bar">
            <div class="jewelry-master-progress-fill" :style="{ width: extractProgress + '%' }"></div>
          </div>
          <div class="jewelry-master-progress-text">提取中... {{ Math.floor(extractProgress) }}%</div>
        </div>
      </div>

      <!-- 自动提取选项 -->
      <div class="jewelry-master-auto-extract-section">
        <div class="jewelry-master-auto-extract-row">
          <select v-model="selectedGemType" class="jewelry-master-gem-select">
            <option value="">选择宝石类型</option>
            <option v-for="gem in gemTypeOptions" :key="gem.gemId" :value="gem.gemId">
              {{ gem.name }} ({{ gem.minLevel }}-{{ gem.maxLevel }}级武器)
            </option>
          </select>
          <button class="jewelry-master-auto-extract-btn" :class="{ active: isAutoExtracting }"
            :disabled="!isAutoExtracting && !canAutoExtract" @click="handleAutoExtract">
            {{ isAutoExtracting ? '停止提取' : '自动提取' }}
          </button>
          <button class="jewelry-master-extract-btn" :class="{ disabled: !selectedWeapon }"
            :disabled="!selectedWeapon || isExtracting" @click="handleExtract">
            {{ isExtracting ? '提取中...' : '提取宝石' }}
          </button>
        </div>
        <div v-if="selectedGemType && autoExtractWeaponCount > 0" class="jewelry-master-auto-extract-info">
          可提取武器数量: {{ autoExtractWeaponCount }} 把
        </div>
      </div>

      <!-- 自动提取确认对话框 -->
      <transition name="confirm-fade">
        <div v-if="showAutoExtractConfirm" class="jewelry-master-confirm-overlay">
          <div class="jewelry-master-confirm-dialog">
            <div class="jewelry-master-confirm-title">确认自动提取</div>
            <div class="jewelry-master-confirm-content">
              <p>即将自动分解所有可提取 <strong>{{ selectedGemTypeName }}</strong> 的武器</p>
              <p>共 <strong>{{ autoExtractWeaponCount }}</strong> 把武器将被分解</p>
              <p class="jewelry-master-confirm-warning">此操作不可撤销，是否继续？</p>
            </div>
            <div class="jewelry-master-confirm-actions">
              <button class="jewelry-master-confirm-btn cancel" @click="cancelAutoExtract">取消</button>
              <button class="jewelry-master-confirm-btn confirm" @click="confirmAutoExtract">确认提取</button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <transition name="dice-panel-fade">
        <div v-if="showWeaponPanel && weaponItems.length > 0" ref="panelWeaponRef"
          class="jewelry-master-dice-popup jewelry-master-weapon-popup" :style="weaponPanelStyle">
          <div class="jewelry-master-popup-header">
            <span>选择武器 (60-160级 普通/罕见)</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in weaponItems" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selectedWeapon?.uniqueId === item.uniqueId }" @click="selectWeapon(item)"
              @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getWeaponDisplayName(item) }}</div>
                <div class="jewelry-master-popup-level">Lv.{{ item.level || 1 }} · <span
                    :style="getRarityStyle(item.rarity)">{{ getRarityText(item.rarity) }}</span></div>
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
 * @fileoverview 宝石提取组件
 * @description 珠宝大师-皮奇：分解武器提取宝石功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'

export default {
  name: 'GemExtraction',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      GEM_CONFIG,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const selectWeaponBoxRef = ref(null)
    const panelWeaponRef = ref(null)

    // 状态
    const selectedWeaponId = ref(null)
    const showWeaponPanel = ref(false)
    const isExtracting = ref(false)
    const selectedGemType = ref('')
    const isAutoExtracting = ref(false)
    const showAutoExtractConfirm = ref(false)
    const shouldStopAutoExtract = ref(false)
    const showExtractProgress = ref(false)
    const extractProgress = ref(0)
    let progressRafId = null

    // 面板位置样式（响应式）
    const weaponPanelStyle = ref({})

    /**
     * 获取可分解的武器列表
     */
    const weaponItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        if (item.category !== 'weapon') return false
        if (!GEM_CONFIG.allowedRarities.includes(item.rarity)) return false
        if (!GEM_CONFIG.weaponTypes.includes(item.subcategory)) return false
        const level = item.level || 1
        if (level < 60 || level > 160) return false
        return true
      }).map(item => ({
        ...item,
        icon: item.icon || `/pt/item_icon/${item.id}.png`
      }))
    })

    /**
     * 获取选中的武器
     */
    const selectedWeapon = computed(() => {
      if (!selectedWeaponId.value) return null
      return weaponItems.value.find(item => item.uniqueId === selectedWeaponId.value)
    })

    /**
     * 获取提取宝石信息
     */
    const extractGemInfo = computed(() => {
      if (!selectedWeapon.value) return null
      const level = selectedWeapon.value.level || 1
      return GEM_CONFIG.extractRules.find(rule =>
        level >= rule.minLevel && level <= rule.maxLevel
      )
    })

    /**
     * 宝石类型选项
     */
    const gemTypeOptions = computed(() => GEM_CONFIG.extractRules)

    /**
     * 获取选中宝石类型名称
     */
    const selectedGemTypeName = computed(() => {
      if (!selectedGemType.value) return ''
      const gem = gemTypeOptions.value.find(g => g.gemId === selectedGemType.value)
      return gem ? gem.name : ''
    })

    /**
     * 获取可自动提取的武器数量
     */
    const autoExtractWeaponCount = computed(() => {
      if (!selectedGemType.value) return 0
      const rule = GEM_CONFIG.extractRules.find(r => r.gemId === selectedGemType.value)
      if (!rule) return 0
      return weaponItems.value.filter(item => {
        const level = item.level || 1
        return level >= rule.minLevel && level <= rule.maxLevel
      }).length
    })

    /**
     * 判断是否可以自动提取
     */
    const canAutoExtract = computed(() => {
      return selectedGemType.value && autoExtractWeaponCount.value > 0 && !isAutoExtracting.value
    })

    /**
     * 获取品质样式
     */
    const getRarityStyle = rarity => {
      const colors = {
        common: { color: '#fff' },
        uncommon: { color: '#1eff00' },
        rare: { color: '#0070dd' },
        epic: { color: '#a335ee' },
        unique: { color: '#ff8000' },
        ultimate: { color: '#e6cc80' }
      }
      return colors[rarity] || { color: '#fff' }
    }

    /**
     * 获取品质文本
     */
    const getRarityText = rarity => {
      const texts = {
        common: '普通',
        uncommon: '罕见',
        rare: '稀有',
        epic: '史诗',
        unique: '独特',
        ultimate: '终极'
      }
      return texts[rarity] || rarity
    }

    /**
     * 切换武器选择面板
     */
    const toggleWeaponPanel = async () => {
      if (weaponItems.value.length === 0) return
      showWeaponPanel.value = !showWeaponPanel.value
      if (showWeaponPanel.value) {
        // 等待 DOM 更新后计算位置
        await nextTick()
        updatePanelPosition(selectWeaponBoxRef, weaponPanelStyle)
      } else {
        hideItemTooltip()
      }
    }

    /**
     * 选择武器
     */
    const selectWeapon = weapon => {
      selectedWeaponId.value = weapon.uniqueId
      showWeaponPanel.value = false
      hideItemTooltip()
    }

    /**
     * 开始提取进度动画
     * @param {boolean} isAutoMode - 是否为自动提取模式（自动模式下不重复设置显示状态）
     */
    const startExtractProgress = (isAutoMode = false) => {
      return new Promise(resolve => {
        if (progressRafId) {
          cancelAnimationFrame(progressRafId)
          progressRafId = null
        }
        // 非自动模式下才设置显示状态
        if (!isAutoMode) {
          showExtractProgress.value = true
        }
        extractProgress.value = 0

        const startTime = performance.now()
        const duration = 1000

        const updateProgress = currentTime => {
          const elapsed = currentTime - startTime
          const progress = Math.min((elapsed / duration) * 100, 100)
          extractProgress.value = progress

          if (progress >= 100) {
            progressRafId = null
            resolve()
          } else {
            progressRafId = requestAnimationFrame(updateProgress)
          }
        }

        progressRafId = requestAnimationFrame(updateProgress)
      })
    }

    /**
     * 结束提取进度
     * @param {boolean} hideProgress - 是否隐藏进度条，自动提取过程中不隐藏
     */
    const endExtractProgress = (hideProgress = true) => {
      if (progressRafId) {
        cancelAnimationFrame(progressRafId)
        progressRafId = null
      }
      if (hideProgress) {
        setTimeout(() => {
          showExtractProgress.value = false
          extractProgress.value = 0
        }, 200)
      }
      // 自动提取模式：不重置进度值，由下一次 startExtractProgress 处理
    }

    /**
     * 同步背包数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理提取
     */
    const handleExtract = async () => {
      if (!selectedWeapon.value || isExtracting.value) return

      isExtracting.value = true

      try {
        await startExtractProgress()

        const weapon = selectedWeapon.value
        const rule = extractGemInfo.value

        // 移除武器
        const weaponIndex = itemsStore.playerBag.findIndex(item => item.uniqueId === weapon.uniqueId)
        if (weaponIndex === -1) {
          emit('add-battle-log', '找不到武器，请重试', 'error')
          endExtractProgress()
          isExtracting.value = false
          return
        }
        itemsStore.playerBag.splice(weaponIndex, 1)

        // 计算是否成功
        const success = Math.random() * 100 < rule.chance

        if (success) {
          // 添加宝石
          itemsStore.addItemToBag(rule.gemId, 1)
          syncBagData()

          emit('play-sfx', 'InfUpgradeSuccess.wav')
          emit('add-battle-log', `提取成功！获得 ${rule.name}`, 'success')
          emit('show-animation-message', `提取成功！获得 ${rule.name}`, 'reward', `/pt/item_icon/${rule.gemId}.png`)
        } else {
          syncBagData()
          emit('play-sfx', 'InfUpgradeFail.wav')
          emit('add-battle-log', `提取失败，武器已销毁`, 'error')
        }

        endExtractProgress()

        // 重置选择
        selectedWeaponId.value = null
      } catch (error) {
        console.error('[GemExtraction] 提取失败:', error)
        emit('add-battle-log', '提取失败：发生错误', 'error')
        endExtractProgress()
      } finally {
        isExtracting.value = false
      }
    }

    /**
     * 处理自动提取
     */
    const handleAutoExtract = () => {
      if (isAutoExtracting.value) {
        shouldStopAutoExtract.value = true
        return
      }
      showAutoExtractConfirm.value = true
    }

    /**
     * 取消自动提取
     */
    const cancelAutoExtract = () => {
      showAutoExtractConfirm.value = false
    }

    /**
     * 确认自动提取
     */
    const confirmAutoExtract = async () => {
      showAutoExtractConfirm.value = false
      isAutoExtracting.value = true
      shouldStopAutoExtract.value = false

      const rule = GEM_CONFIG.extractRules.find(r => r.gemId === selectedGemType.value)
      if (!rule) {
        isAutoExtracting.value = false
        return
      }

      let successCount = 0
      let failCount = 0

      try {
        // 显示进度条并保持显示
        showExtractProgress.value = true
        extractProgress.value = 0

        while (!shouldStopAutoExtract.value) {
          // 找一把符合条件的武器
          const weaponIndex = itemsStore.playerBag.findIndex(item => {
            if (item.category !== 'weapon') return false
            if (!GEM_CONFIG.allowedRarities.includes(item.rarity)) return false
            const level = item.level || 1
            return level >= rule.minLevel && level <= rule.maxLevel
          })

          if (weaponIndex === -1) break

          await startExtractProgress(true) // 自动模式，不重复设置显示状态

          // 移除武器
          itemsStore.playerBag.splice(weaponIndex, 1)

          // 计算是否成功
          const success = Math.random() * 100 < rule.chance

          if (success) {
            itemsStore.addItemToBag(rule.gemId, 1)
            successCount++
            // 每次成功都显示战斗日志和动画
            emit('play-sfx', 'InfUpgradeSuccess.wav')
            emit('add-battle-log', `提取成功！获得 ${rule.name}`, 'success')
            emit('show-animation-message', `获得 ${rule.name}`, 'reward', `/pt/item_icon/${rule.gemId}.png`)
          } else {
            failCount++
            // 每次失败都显示战斗日志
            emit('play-sfx', 'InfUpgradeFail.wav')
            emit('add-battle-log', `提取失败，武器已销毁`, 'error')
            emit('show-animation-message', `提取失败`, 'drop', '')
          }

          // 自动提取模式：不隐藏进度条
          endExtractProgress(false)

          // 添加短暂延迟，让用户能看到每次结果
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        // 自动提取结束后隐藏进度条
        showExtractProgress.value = false
        extractProgress.value = 0

        syncBagData()

        // 最终汇总
        if (successCount > 0 || failCount > 0) {
          emit('add-battle-log', `自动提取完成！成功${successCount}次，失败${failCount}次`, 'success')
        }
      } catch (error) {
        console.error('[GemExtraction] 自动提取失败:', error)
        emit('add-battle-log', '自动提取失败', 'error')
        showExtractProgress.value = false
      } finally {
        isAutoExtracting.value = false
        shouldStopAutoExtract.value = false
      }
    }

    /**
     * 点击外部关闭弹出面板
     */
    const handleClickOutside = e => {
      if (showWeaponPanel.value) {
        const isClickInsideBox = selectWeaponBoxRef.value?.contains(e.target)
        const isClickInsidePanel = panelWeaponRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showWeaponPanel.value = false
          hideItemTooltip()
        }
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      // 引用
      selectWeaponBoxRef,
      panelWeaponRef,

      // 状态
      showWeaponPanel,
      selectedWeaponId,
      isExtracting,
      selectedGemType,
      isAutoExtracting,
      showAutoExtractConfirm,
      showExtractProgress,
      extractProgress,

      // 计算属性
      weaponItems,
      selectedWeapon,
      extractGemInfo,
      gemTypeOptions,
      selectedGemTypeName,
      autoExtractWeaponCount,
      canAutoExtract,
      weaponPanelStyle,

      // 方法
      toggleWeaponPanel,
      selectWeapon,
      handleExtract,
      handleAutoExtract,
      cancelAutoExtract,
      confirmAutoExtract,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getWeaponDisplayName,
      getRarityStyle,
      getRarityText
    }
  }
}
</script>

<style scoped>
/* 面板基础样式 */
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

.jewelry-master-gem-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.jewelry-master-weapon-section,
.jewelry-master-extract-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-weapon-title,
.jewelry-master-extract-title {
  font-size: 10px;
  color: #aaa;
}

/* 选择框容器 - 用于定位弹出面板 */
.jewelry-master-select-wrapper {
  position: relative;
}

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

.jewelry-master-select-box:hover:not(.disabled) {
  border-color: #5a5a8a;
  background: rgba(0, 0, 0, 0.4);
}

.jewelry-master-select-box.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.jewelry-master-select-box.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jewelry-master-select-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  margin-right: 4px;
}

.jewelry-master-select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.jewelry-master-select-name {
  color: #fff;
  font-size: 11px;
}

.jewelry-master-select-level {
  color: #888;
  font-size: 9px;
}

.jewelry-master-select-placeholder {
  flex: 1;
  color: #666;
  font-size: 10px;
}

.jewelry-master-select-arrow {
  color: #888;
  font-size: 8px;
  transition: transform 0.2s;
}

.jewelry-master-select-arrow.rotated {
  transform: rotate(180deg);
}

.jewelry-master-extract-display {
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  border: 1px solid #3a3a5a;
}

.jewelry-master-extract-result {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jewelry-master-extract-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.jewelry-master-extract-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.jewelry-master-extract-name {
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
}

.jewelry-master-extract-chance {
  color: #00ff88;
  font-size: 10px;
}

.jewelry-master-extract-placeholder {
  color: #666;
  font-size: 10px;
  text-align: center;
  padding: 8px;
}

/* 进度条容器 - 带发光效果 */
.jewelry-master-progress-wrapper {
  padding: 6px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid #4a90d9;
  box-shadow: 0 0 15px rgba(74, 144, 217, 0.3);
}

.jewelry-master-progress-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-progress-bar {
  height: 14px;
  background: #2a2a4a;
  border-radius: 7px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

.jewelry-master-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a90d9 0%, #67b26f 50%, #ffd700 100%);
  border-radius: 9px;
  transition: width 0.05s linear;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.jewelry-master-progress-text {
  font-size: 10px;
  color: #ffd700;
  text-align: center;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.jewelry-master-auto-extract-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid #3a3a5a;
}

.jewelry-master-auto-extract-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.jewelry-master-gem-select {
  flex: 1;
  padding: 3px;
  width: 80px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
  cursor: pointer;
}

.jewelry-master-gem-select:focus {
  outline: none;
  border-color: #ffd700;
}

.jewelry-master-auto-extract-btn {
  padding: 4px 6px;
  background: linear-gradient(135deg, #4a6a9a 0%, #5a8aba 100%);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-auto-extract-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a8aba 0%, #6a9aca 100%);
}

.jewelry-master-auto-extract-btn.active {
  background: linear-gradient(135deg, #aa5a5a 0%, #ca7a7a 100%);
}

.jewelry-master-auto-extract-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jewelry-master-extract-btn {
  padding: 4px 8px;
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-extract-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a8c69 0%, #7bab8a 100%);
}

.jewelry-master-extract-btn:disabled {
  background: #3a3a4a;
  color: #666;
  cursor: not-allowed;
}

.jewelry-master-auto-extract-info {
  font-size: 10px;
  color: #00ff88;
}

/* 确认对话框 */
.jewelry-master-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.jewelry-master-confirm-dialog {
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  padding: 12px;
  max-width: 260px;
}

.jewelry-master-confirm-title {
  font-size: 14px;
  color: #ffd700;
  margin-bottom: 8px;
  text-align: center;
}

.jewelry-master-confirm-content {
  font-size: 12px;
  color: #ccc;
  line-height: 1.5;
  margin-bottom: 12px;
}

.jewelry-master-confirm-warning {
  color: #ff6666 !important;
  font-size: 11px !important;
}

.jewelry-master-confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.jewelry-master-confirm-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-confirm-btn.cancel {
  background: #3a3a4a;
  color: #fff;
}

.jewelry-master-confirm-btn.confirm {
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  color: #fff;
}

/* 弹出选择面板 - 使用 fixed 定位浮在上层 */
.jewelry-master-dice-popup {
  position: fixed;
  width: 260px;
  max-height: 280px;
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 9999;
}

.jewelry-master-popup-header {
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #3a3a5a;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
}

.jewelry-master-popup-items {
  max-height: 230px;
  overflow-y: auto;
}

.jewelry-master-popup-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(60, 60, 90, 0.3);
}

.jewelry-master-popup-item:hover {
  background: rgba(255, 215, 0, 0.1);
}

.jewelry-master-popup-item.selected {
  background: rgba(255, 215, 0, 0.2);
  border-left: 3px solid #ffd700;
}

.jewelry-master-popup-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  margin-right: 6px;
}

.jewelry-master-popup-info {
  flex: 1;
}

.jewelry-master-popup-name {
  color: #fff;
  font-size: 12px;
}

.jewelry-master-popup-level {
  color: #888;
  font-size: 10px;
  margin-top: 1px;
}

/* 过渡动画 */
.dice-panel-fade-enter-active,
.dice-panel-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dice-panel-fade-enter-from,
.dice-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
