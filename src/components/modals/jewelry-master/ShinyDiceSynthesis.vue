<!--
  @fileoverview 闪亮骰子合成组件
  @description 珠宝大师-皮奇：闪亮精炼骰子合成功能面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-11
-->
<template>
  <div class="jewelry-master-panel">
    <h3 class="jewelry-master-panel-title">制作闪亮精炼骰子</h3>

    <div class="jewelry-master-shiny-content">
      <!-- 右侧：全部内容区域 -->
      <div class="jewelry-master-shiny-right">
        <!-- 1: 精炼骰子 4/6/12点 选择区域 -->
        <div class="jewelry-master-dice-section">
          <div class="jewelry-master-dice-title">精炼骰子 4/6/12点</div>
          <!-- 选择框 -->
          <div ref="select4612BoxRef" class="jewelry-master-select-box"
            :class="{ active: show4612Panel, disabled: dice4612Items.length === 0 }" @click="toggle4612Panel">
            <template v-if="selected4612Dice">
              <img :src="selected4612Dice.icon" class="jewelry-master-select-icon" @error="handleIconError" />
              <span class="jewelry-master-select-name">{{ getDiceDisplayName(selected4612Dice) }}</span>
              <span class="jewelry-master-select-count">×{{ selected4612Dice.currentStack || 1 }}</span>
            </template>
            <span v-else class="jewelry-master-select-placeholder">
              {{ dice4612Items.length === 0 ? '背包中没有4、6、12点骰子' : '点击选择骰子' }}
            </span>
            <span class="jewelry-master-select-arrow" :class="{ rotated: show4612Panel }">▼</span>
          </div>
        </div>

        <!-- 2: 精炼骰子 8/10点 选择区域 -->
        <div class="jewelry-master-dice-section">
          <div class="jewelry-master-dice-title">精炼骰子 8/10点</div>
          <!-- 选择框 -->
          <div ref="select810BoxRef" class="jewelry-master-select-box"
            :class="{ active: show810Panel, disabled: dice810Items.length === 0 }" @click="toggle810Panel">
            <template v-if="selected810Dice">
              <img :src="selected810Dice.icon" class="jewelry-master-select-icon" @error="handleIconError" />
              <span class="jewelry-master-select-name">{{ getDiceDisplayName(selected810Dice) }}</span>
              <span class="jewelry-master-select-count">×{{ selected810Dice.currentStack || 1 }}</span>
            </template>
            <span v-else class="jewelry-master-select-placeholder">
              {{ dice810Items.length === 0 ? '背包中没有8、10点骰子' : '点击选择骰子' }}
            </span>
            <span class="jewelry-master-select-arrow" :class="{ rotated: show810Panel }">▼</span>
          </div>
        </div>

        <!-- 3: 合成结果展示 -->
        <div v-if="!showCraftProgress" class="jewelry-master-result-section">
          <div class="jewelry-master-result-title">合成结果</div>
          <div class="jewelry-master-result-display">
            <div class="jewelry-master-result-frame" :class="{ 'has-marquee': resultItem }">
              <!-- SVG跑马灯边框 -->
              <svg v-if="resultItem" class="marquee-border" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="marquee-gradient-shiny" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ff4d4f" />
                    <stop offset="25%" stop-color="#ffa940" />
                    <stop offset="50%" stop-color="#fff566" />
                    <stop offset="75%" stop-color="#36cfc9" />
                    <stop offset="100%" stop-color="#4096ff" />
                  </linearGradient>
                </defs>
                <rect class="marquee-rect" x="2" y="2" width="96" height="96" rx="6" ry="6"
                  vector-effect="non-scaling-stroke" />
              </svg>
              <img v-if="resultItem" :src="`/pt/item_icon/${resultItem.id}.png`"
                class="jewelry-master-result-icon" @error="handleIconError"
                @mouseenter="showItemTooltipById($event, resultItem.id)" @mouseleave="hideItemTooltip"
                @mousemove="moveItemTooltip" />
              <div v-else class="jewelry-master-result-placeholder">?</div>
            </div>
            <div v-if="resultItem" class="jewelry-master-result-name">
              {{ resultItem.name }}
            </div>
          </div>
        </div>

        <!-- 合成进度条 -->
        <div v-if="showCraftProgress" class="jewelry-master-progress-wrapper">
          <div class="jewelry-master-progress-section">
            <div class="jewelry-master-progress-bar">
              <div class="jewelry-master-progress-fill" :style="{ width: craftProgress + '%' }"></div>
            </div>
            <div class="jewelry-master-progress-text">合成中... {{ Math.floor(craftProgress) }}%</div>
          </div>
        </div>

        <!-- 4: 合成操作区域 -->
        <div class="jewelry-master-actions">
          <div class="jewelry-master-quantity">
            <label class="jewelry-master-quantity-label">数量:</label>
            <input v-model.number="craftQuantity" type="number" min="1" :max="maxCraftQuantity"
              class="jewelry-master-quantity-input" @input="validateQuantity" />
            <span class="jewelry-master-quantity-max">/ {{ maxCraftQuantity }}</span>
          </div>
          <button class="jewelry-master-craft-btn" :class="{ disabled: !canCraft }"
            :disabled="!canCraft || isCrafting" @click="handleCraft">
            {{ isCrafting ? '合成中...' : '合成' }}
          </button>
        </div>

      </div>
    </div>

    <!-- 弹出选择面板：使用 Teleport 渲染到 body，避免父容器影响 -->
    <Teleport to="body">
      <!-- 4/6/12点骰子选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="show4612Panel && dice4612Items.length > 0" ref="panel4612Ref" class="jewelry-master-dice-popup"
          :style="panel4612Style">
          <div class="jewelry-master-popup-header">
            <span>选择精炼骰子</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in dice4612Items" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selected4612DiceId === item.id }"
              @click="select4612Dice(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getDiceDisplayName(item) }}</div>
                <div class="jewelry-master-popup-count">数量: {{ item.currentStack || 1 }}</div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- 8/10点骰子选择面板 -->
      <transition name="dice-panel-fade">
        <div v-if="show810Panel && dice810Items.length > 0" ref="panel810Ref" class="jewelry-master-dice-popup"
          :style="panel810Style">
          <div class="jewelry-master-popup-header">
            <span>选择精炼骰子</span>
          </div>
          <div class="jewelry-master-popup-items">
            <div v-for="item in dice810Items" :key="item.uniqueId || item.id" class="jewelry-master-popup-item"
              :class="{ selected: selected810DiceId === item.id }"
              @click="select810Dice(item)" @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip" @mousemove="moveItemTooltip">
              <img :src="item.icon" class="jewelry-master-popup-icon" @error="handleIconError" />
              <div class="jewelry-master-popup-info">
                <div class="jewelry-master-popup-name">{{ getDiceDisplayName(item) }}</div>
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
 * @fileoverview 闪亮骰子合成组件
 * @description 珠宝大师-皮奇：闪亮精炼骰子合成功能面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-11
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useJewelryMaster } from '@/composables/useJewelryMaster'

export default {
  name: 'ShinyDiceSynthesis',

  emits: ['play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const {
      itemsStore,
      gameStore,
      DICE_CONFIG,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getDiceDisplayName,
      savePlayerData,
      updatePanelPosition
    } = useJewelryMaster()

    // 引用
    const select4612BoxRef = ref(null)
    const select810BoxRef = ref(null)
    const panel4612Ref = ref(null)
    const panel810Ref = ref(null)

    // 状态
    const selected4612DiceId = ref(null)
    const selected810DiceId = ref(null)
    const show4612Panel = ref(false)
    const show810Panel = ref(false)
    const craftQuantity = ref(1)
    const isCrafting = ref(false)
    const showCraftProgress = ref(false)
    const craftProgress = ref(0)
    let craftProgressRafId = null

    // 面板位置样式（响应式）
    const panel4612Style = ref({})
    const panel810Style = ref({})

    /**
     * 获取背包中的4/6/12点骰子
     */
    const dice4612Items = computed(() => {
      return itemsStore.playerBag.filter(item =>
        DICE_CONFIG.dice4612Ids.includes(Number(item.id))
      )
    })

    /**
     * 获取背包中的8/10点骰子
     */
    const dice810Items = computed(() => {
      return itemsStore.playerBag.filter(item =>
        DICE_CONFIG.dice810Ids.includes(Number(item.id))
      )
    })

    /**
     * 通过ID获取选中的骰子（响应式，会自动更新数量显示）
     */
    const selected4612Dice = computed(() => {
      if (!selected4612DiceId.value) return null
      return itemsStore.playerBag.find(item => Number(item.id) === selected4612DiceId.value) || null
    })

    const selected810Dice = computed(() => {
      if (!selected810DiceId.value) return null
      return itemsStore.playerBag.find(item => Number(item.id) === selected810DiceId.value) || null
    })

    /**
     * 计算合成结果
     */
    const resultItem = computed(() => {
      if (!selected4612Dice.value || !selected810Dice.value) return null

      const dice4612Id = Number(selected4612Dice.value.id)
      const dice810Id = Number(selected810Dice.value.id)

      const recipe = DICE_CONFIG.recipes[dice4612Id]
      if (!recipe) return null

      const resultId = recipe[dice810Id]
      if (!resultId) return null

      // 获取结果物品配置
      const itemConfig = itemsStore.getItemConfig(resultId)
      if (!itemConfig) return null

      return {
        id: resultId,
        name: typeof itemConfig.name === 'string' ? itemConfig.name : itemConfig.name?.cns || `物品#${resultId}`
      }
    })

    /**
     * 检查是否可以合成
     */
    const canCraft = computed(() => {
      if (!resultItem.value) return false
      if (craftQuantity.value < 1) return false

      // 检查4/6/12点骰子数量
      const dice4612Id = Number(selected4612Dice.value.id)
      const dice4612Count = itemsStore.getItemCount(dice4612Id)
      if (dice4612Count < DICE_CONFIG.requiredCount * craftQuantity.value) return false

      // 检查8/10点骰子数量
      const dice810Id = Number(selected810Dice.value.id)
      const dice810Count = itemsStore.getItemCount(dice810Id)
      if (dice810Count < DICE_CONFIG.requiredCount * craftQuantity.value) return false

      return true
    })

    /**
     * 计算最大可合成数量
     */
    const maxCraftQuantity = computed(() => {
      if (!selected4612Dice.value || !selected810Dice.value) return 1

      // 获取两种材料的数量
      const dice4612Id = Number(selected4612Dice.value.id)
      const dice810Id = Number(selected810Dice.value.id)
      const dice4612Count = itemsStore.getItemCount(dice4612Id)
      const dice810Count = itemsStore.getItemCount(dice810Id)

      // 计算每种材料能合成的最大数量
      const maxFrom4612 = Math.floor(dice4612Count / DICE_CONFIG.requiredCount)
      const maxFrom810 = Math.floor(dice810Count / DICE_CONFIG.requiredCount)

      // 返回两者的较小值，至少为1
      return Math.max(1, Math.min(maxFrom4612, maxFrom810))
    })

    /**
     * 切换4/6/12点骰子面板
     */
    const toggle4612Panel = async () => {
      if (dice4612Items.value.length === 0) return
      show4612Panel.value = !show4612Panel.value
      if (show4612Panel.value) {
        show810Panel.value = false
        // 等待 DOM 更新后计算位置
        await nextTick()
        updatePanelPosition(select4612BoxRef, panel4612Style)
      } else {
        hideItemTooltip()
      }
    }

    /**
     * 切换8/10点骰子面板
     */
    const toggle810Panel = async () => {
      if (dice810Items.value.length === 0) return
      show810Panel.value = !show810Panel.value
      if (show810Panel.value) {
        show4612Panel.value = false
        // 等待 DOM 更新后计算位置
        await nextTick()
        updatePanelPosition(select810BoxRef, panel810Style)
      } else {
        hideItemTooltip()
      }
    }

    /**
     * 选择4/6/12点骰子
     */
    const select4612Dice = item => {
      selected4612DiceId.value = Number(item.id)
      show4612Panel.value = false
      hideItemTooltip()
    }

    /**
     * 选择8/10点骰子
     */
    const select810Dice = item => {
      selected810DiceId.value = Number(item.id)
      show810Panel.value = false
      hideItemTooltip()
    }

    /**
     * 开始合成进度动画
     */
    const startCraftProgress = () => {
      return new Promise(resolve => {
        if (craftProgressRafId) cancelAnimationFrame(craftProgressRafId)
        showCraftProgress.value = true
        craftProgress.value = 0
        const startTime = performance.now()
        const duration = 1000
        const updateProgress = currentTime => {
          const progress = Math.min(((currentTime - startTime) / duration) * 100, 100)
          craftProgress.value = progress
          if (progress >= 100) {
            craftProgressRafId = null
            resolve()
          } else {
            craftProgressRafId = requestAnimationFrame(updateProgress)
          }
        }
        craftProgressRafId = requestAnimationFrame(updateProgress)
      })
    }

    const endCraftProgress = () => {
      if (craftProgressRafId) cancelAnimationFrame(craftProgressRafId)
      setTimeout(() => { showCraftProgress.value = false; craftProgress.value = 0 }, 200)
    }

    /**
     * 验证数量输入
     */
    const validateQuantity = () => {
      if (isNaN(craftQuantity.value) || craftQuantity.value < 1) {
        craftQuantity.value = 1
      }
      craftQuantity.value = Math.floor(craftQuantity.value)
      if (craftQuantity.value > maxCraftQuantity.value) {
        craftQuantity.value = maxCraftQuantity.value
      }
    }

    /**
     * 同步背包数据
     */
    const syncBagData = () => {
      gameStore.player.bag = [...itemsStore.playerBag]
      savePlayerData({ bag: [...itemsStore.playerBag] })
    }

    /**
     * 处理合成
     */
    const handleCraft = async () => {
      if (!canCraft.value || isCrafting.value) return

      isCrafting.value = true

      try {
        // 显示进度条
        await startCraftProgress()

        const dice4612Id = Number(selected4612Dice.value.id)
        const dice810Id = Number(selected810Dice.value.id)
        const resultId = resultItem.value.id
        const quantity = craftQuantity.value
        const requiredTotal = DICE_CONFIG.requiredCount * quantity

        // 移除材料
        const remove1 = itemsStore.removeItemFromBag(dice4612Id, requiredTotal)
        if (!remove1) {
          emit('add-battle-log', '合成失败：材料不足', 'error')
          endCraftProgress()
          isCrafting.value = false
          return
        }

        const remove2 = itemsStore.removeItemFromBag(dice810Id, requiredTotal)
        if (!remove2) {
          // 回滚第一个移除
          itemsStore.addItemToBag(dice4612Id, requiredTotal)
          emit('add-battle-log', '合成失败：材料不足', 'error')
          endCraftProgress()
          isCrafting.value = false
          return
        }

        // 添加结果物品
        const add = itemsStore.addItemToBag(resultId, quantity)
        if (!add) {
          // 回滚
          itemsStore.addItemToBag(dice4612Id, requiredTotal)
          itemsStore.addItemToBag(dice810Id, requiredTotal)
          emit('add-battle-log', '合成失败：背包已满', 'error')
          endCraftProgress()
          isCrafting.value = false
          return
        }

        // 同步背包数据
        syncBagData()

        // 结束进度条
        endCraftProgress()

        // 播放强化成功音效
        emit('play-sfx', 'InfUpgradeSuccess.wav')

        // 显示成功消息
        const resultName = resultItem.value.name
        emit('add-battle-log', `合成成功！获得 ${resultName} ×${quantity}`, 'success')
        emit('show-animation-message', `合成成功！获得 ${resultName} ×${quantity}`, 'reward', `/pt/item_icon/${resultId}.png`)

        // 延迟播放获得物品音效
        setTimeout(() => {
          emit('play-sfx', 'InfGroundPickup.wav')
        }, 300)

        // 检查是否还有足够材料继续合成
        const remaining4612 = itemsStore.getItemCount(dice4612Id)
        const remaining810 = itemsStore.getItemCount(dice810Id)
        if (remaining4612 < DICE_CONFIG.requiredCount || remaining810 < DICE_CONFIG.requiredCount) {
          selected4612DiceId.value = null
          selected810DiceId.value = null
          craftQuantity.value = 1
        }
      } catch (error) {
        console.error('[ShinyDiceSynthesis] 合成失败:', error)
        emit('add-battle-log', '合成失败：发生错误', 'error')
        endCraftProgress()
      } finally {
        isCrafting.value = false
      }
    }

    /**
     * 点击外部关闭弹出面板
     */
    const handleClickOutside = e => {
      try {
        if (show4612Panel.value) {
          const isClickInsideBox = select4612BoxRef.value?.contains(e.target)
          const isClickInsidePanel = panel4612Ref.value?.contains(e.target)
          if (!isClickInsideBox && !isClickInsidePanel) {
            show4612Panel.value = false
            hideItemTooltip()
          }
        }
        if (show810Panel.value) {
          const isClickInsideBox = select810BoxRef.value?.contains(e.target)
          const isClickInsidePanel = panel810Ref.value?.contains(e.target)
          if (!isClickInsideBox && !isClickInsidePanel) {
            show810Panel.value = false
            hideItemTooltip()
          }
        }
      } catch (err) {
        console.warn('[ShinyDiceSynthesis] handleClickOutside error:', err)
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
      select4612BoxRef,
      select810BoxRef,
      panel4612Ref,
      panel810Ref,

      // 状态
      show4612Panel,
      show810Panel,
      craftQuantity,
      isCrafting,
      showCraftProgress,
      craftProgress,
      panel4612Style,
      panel810Style,

      // 计算属性
      dice4612Items,
      dice810Items,
      selected4612Dice,
      selected810Dice,
      selected4612DiceId,
      selected810DiceId,
      resultItem,
      canCraft,
      maxCraftQuantity,

      // 方法
      toggle4612Panel,
      toggle810Panel,
      select4612Dice,
      select810Dice,
      validateQuantity,
      handleCraft,
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,
      handleIconError,
      getDiceDisplayName
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

/* 内容区域 */
.jewelry-master-shiny-content {
  flex: 1;
  display: flex;
  gap: 4px;
  overflow: hidden;
}

.jewelry-master-shiny-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 骰子选择区域 */
.jewelry-master-dice-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-dice-title {
  font-size: 10px;
  color: #aaa;
}

/* 选择框 */
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

.jewelry-master-select-name {
  flex: 1;
  color: #fff;
  font-size: 11px;
}

.jewelry-master-select-count {
  color: #00ff88;
  font-size: 10px;
  margin-right: 4px;
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

/* 合成结果展示 */
.jewelry-master-result-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jewelry-master-result-title {
  font-size: 10px;
  color: #aaa;
}

.jewelry-master-result-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.jewelry-master-result-frame {
  position: relative;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.jewelry-master-result-frame.has-marquee {
  border-color: transparent;
}

.marquee-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.marquee-rect {
  fill: none;
  stroke: url(#marquee-gradient-shiny);
  stroke-width: 3;
  stroke-dasharray: 20 10;
  animation: marquee-dash 2s linear infinite;
}

@keyframes marquee-dash {
  to {
    stroke-dashoffset: -30;
  }
}

.jewelry-master-result-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  position: relative;
  z-index: 1;
}

.jewelry-master-result-placeholder {
  font-size: 16px;
  color: #555;
}

.jewelry-master-result-name {
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
}

/* 操作区域 */
.jewelry-master-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
  border-top: 1px solid #3a3a5a;
}

.jewelry-master-quantity {
  display: flex;
  align-items: center;
  gap: 3px;
}

.jewelry-master-quantity-label {
  color: #aaa;
  font-size: 10px;
}

.jewelry-master-quantity-input {
  width: 40px;
  padding: 2px 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 3px;
  color: #fff;
  font-size: 10px;
  text-align: center;
}

.jewelry-master-quantity-input:focus {
  outline: none;
  border-color: #ffd700;
}

.jewelry-master-quantity-max {
  color: #888;
  font-size: 10px;
}

.jewelry-master-craft-btn {
  flex: 1;
  padding: 5px 8px;
  background: linear-gradient(135deg, #4a7c59 0%, #6b9b7a 100%);
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-craft-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a8c69 0%, #7bab8a 100%);
  box-shadow: 0 0 15px rgba(90, 140, 105, 0.5);
}

.jewelry-master-craft-btn:disabled {
  background: #3a3a4a;
  color: #666;
  cursor: not-allowed;
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

.jewelry-master-popup-count {
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
</style>
