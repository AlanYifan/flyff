<!--
  @fileoverview 武器唤醒面板组件
  @description 使用武器唤醒卷轴(ID:5189)唤醒武器/盾牌的面板
  @author FLYFF Team
  @version 1.0.0
  @created 2026-03-13
-->
<template>
  <transition name="panel-fade">
    <div
      v-if="visible"
      ref="modalRef"
      class="weapon-awakening-modal"
      :style="modalStyle"
    >
      <!-- 面板头部（可拖拽区域） -->
      <div class="modal-header" @mousedown="startDrag">
        <h3 class="modal-title">武器＆盾牌唤醒</h3>
        <button class="help-button" @click.stop="toggleHelpPanel" title="查看可唤醒技能">?</button>
        <button class="close-button" @click="handleClose">×</button>
      </div>

      <!-- 面板内容 -->
      <div class="modal-content">
        <!-- 1. 武器/盾牌选择区域 -->
        <div class="awakening-section">
          <div class="section-title">选择武器/盾牌</div>
          <div
            ref="selectWeaponBoxRef"
            class="select-box"
            :class="{ active: showWeaponPanel, disabled: awakeningItems.length === 0 }"
            @click="toggleWeaponPanel"
          >
            <template v-if="selectedWeapon">
              <img :src="selectedWeapon.icon" class="select-icon" @error="handleIconError" />
              <div class="select-info">
                <span class="select-name">{{ getWeaponDisplayName(selectedWeapon) }}</span>
                <span class="select-level">+{{ selectedWeapon.enhanceLevel || 0 }}</span>
              </div>
            </template>
            <span v-else class="select-placeholder">
              {{ awakeningItems.length === 0 ? '背包中没有可唤醒的武器/盾牌' : '选择要唤醒的武器或盾牌' }}
            </span>
            <span class="select-arrow" :class="{ rotated: showWeaponPanel }">▼</span>
          </div>
        </div>

        <!-- 2. 唤醒结果显示区域 -->
        <div v-if="awakeningResult" class="awakening-section result-section">
          <div class="section-title">唤醒结果</div>
          <div class="result-content">
            <div v-if="awakeningResult.unchanged" class="result-item">
              <span class="result-value unchanged">属性未发生变化</span>
            </div>
            <template v-else>
              <div v-if="awakeningResult.type === 'skill'" class="result-item">
                <span class="result-label">唤醒技能:</span>
                <span class="result-value skill-name">{{ awakeningResult.skillName }}</span>
              </div>
              <div v-if="awakeningResult.type === 'parameter'" class="result-item">
                <span class="result-label">唤醒属性:</span>
                <span class="result-value">{{ awakeningResult.parameterName }}</span>
              </div>
              <div class="result-item">
                <span class="result-label">唤醒效果值:</span>
                <span class="result-value highlight">+{{ awakeningResult.value }}%</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 3. 自动唤醒配置区域 -->
        <div v-if="selectedWeapon" class="awakening-section auto-section">
          <div class="section-title">自动唤醒设置</div>
          <div class="auto-config">
            <!-- 唤醒属性下拉 -->
            <div class="config-row">
              <label class="config-label">唤醒属性:</label>
              <select v-model="selectedAwakeningType" class="config-select" @change="onAwakeningTypeChange">
                <option value="">随机唤醒</option>
                <option v-for="type in availableAwakeningTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            <!-- 目标唤醒值下拉 -->
            <div v-if="selectedAwakeningType" class="config-row">
              <label class="config-label">目标值:</label>
              <select v-model="targetAwakeningValue" class="config-select">
                <option :value="null">自动选择最高</option>
                <option v-for="value in availableTargetValues" :key="value" :value="value">
                  +{{ value }}
                </option>
              </select>
            </div>
            <!-- 进度条 -->
            <div v-if="isAutoAwakening" class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              </div>
              <span class="progress-text">{{ progressPercent }}%</span>
            </div>
          </div>
        </div>

        <!-- 4. 操作按钮区域 -->
        <div class="awakening-actions">
          <button
            class="action-btn auto-btn"
            :class="{ 'stop-btn': isAutoAwakening }"
            :disabled="!canAutoAwaken || (isAwakening && !isAutoAwakening)"
            @click="handleAutoAwaken"
          >
            {{ isAutoAwakening ? '停止唤醒' : '自动唤醒' }}
          </button>
          <button
            class="action-btn awaken-btn"
            :disabled="!canAwaken || isAwakening"
            @click="handleAwaken"
          >
            {{ isAwakening ? '唤醒中...' : '唤醒' }}
          </button>
        </div>

        <!-- 错误/成功消息 -->
        <div v-if="errorMessage" class="message error-message">{{ errorMessage }}</div>
        <div v-if="successMessage" class="message success-message">{{ successMessage }}</div>
      </div>
    </div>
  </transition>

  <!-- 帮助面板（显示可唤醒技能列表） -->
  <Teleport to="body">
    <transition name="panel-fade">
      <div
        v-if="showHelpPanel && selectedWeapon"
        class="help-panel"
        :style="helpPanelStyle"
      >
        <div class="help-panel-header">
          <span>可唤醒{{ selectedWeapon.category === 'shield' ? '属性' : '技能' }}</span>
        </div>
        <div class="help-panel-content">
          <div class="skill-list">
            <div
              v-for="type in availableAwakeningTypes"
              :key="type.id"
              class="skill-item"
            >
              <span class="skill-name">{{ type.name }}</span>
              <span class="skill-probability" :style="{ color: getProbabilityColor(type.maxProbability) }">
                {{ type.maxProbability }}%~{{ type.minProbability }}%
              </span>
            </div>
            <div v-if="availableAwakeningTypes.length === 0" class="empty-tip">
              {{ selectedWeapon.category === 'shield' ? '请先选择盾牌' : '请先选择武器' }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>

  <!-- 武器选择弹出面板 -->
  <Teleport to="body">
    <transition name="panel-fade">
      <div
        v-if="showWeaponPanel && awakeningItems.length > 0"
        ref="weaponPanelRef"
        class="weapon-popup"
        :style="weaponPanelStyle"
      >
        <div class="popup-header">
          <span>选择武器/盾牌</span>
        </div>
        <div class="popup-items">
          <div
            v-for="item in awakeningItems"
            :key="item.uniqueId"
            class="popup-item"
            :class="{ selected: selectedWeaponId === item.uniqueId }"
            @click="selectWeapon(item)"
            @mouseenter="showItemTooltip($event, item)"
            @mouseleave="hideItemTooltip"
            @mousemove="moveItemTooltip"
          >
            <img :src="item.icon" class="popup-icon" @error="handleIconError" />
            <div class="popup-info">
              <div class="popup-name">{{ getWeaponDisplayName(item) }}</div>
              <div class="popup-level">+{{ item.enhanceLevel || 0 }} · {{ item.category === 'shield' ? '盾牌' : '武器' }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
/**
 * @fileoverview 武器唤醒面板组件
 * @description 使用武器唤醒卷轴(ID:5189)唤醒武器/盾牌的面板
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-13
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useItemsStore } from '@/store/items'
import { useGameStore } from '@/store'
import { useDescriptionsStore } from '@/store/descriptions'
import { storageService } from '@/services/StorageService'
import { ITEM_INFO } from '@/data/ITEM_INFO.js'
import { SKILL_INFO } from '@/data/SKILL_INFO.js'
import { useWeaponAwakening } from '@/composables/useWeaponAwakening'

// 武器唤醒卷轴ID
const AWAKENING_SCROLL_ID = 5189

export default {
  name: 'WeaponAwakeningModal',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    const itemsStore = useItemsStore()
    const gameStore = useGameStore()
    const descriptionsStore = useDescriptionsStore()

    // 使用武器唤醒组合式函数
    const {
      getWeaponTypeKey,
      getAvailableAwakeningSkills,
      getAvailableAwakeningParameters,
      performAwakening,
      getSkillNameById
    } = useWeaponAwakening()

    // 引用
    const modalRef = ref(null)
    const selectWeaponBoxRef = ref(null)
    const weaponPanelRef = ref(null)

    // 状态
    const selectedWeaponId = ref(null)
    const showWeaponPanel = ref(false)
    const weaponPanelStyle = ref({})
    const isAwakening = ref(false)
    const isAutoAwakening = ref(false)
    const awakeningResult = ref(null)
    const errorMessage = ref('')
    const successMessage = ref('')

    // 进度条状态
    const progressPercent = ref(0)
    let progressTimer = null

    // 停止自动唤醒标志
    const shouldStopAutoAwaken = ref(false)

    // 帮助面板状态
    const showHelpPanel = ref(false)

    // 自动唤醒配置
    const selectedAwakeningType = ref('')
    const targetAwakeningValue = ref(null)

    // 拖拽状态
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })
    const modalPosition = ref({ x: 0, y: 0 })

    // 唤醒卷轴物品引用
    let awakeningScrollItem = null

    // 异步加载的唤醒类型数据
    const loadedAwakeningTypes = ref([])

    /**
     * 计算面板样式
     */
    const modalStyle = computed(() => ({
      left: `${modalPosition.value.x}px`,
      top: `${modalPosition.value.y}px`
    }))

    /**
     * 计算帮助面板样式（显示在主面板右侧）
     */
    const helpPanelStyle = computed(() => ({
      position: 'fixed',
      left: `${modalPosition.value.x + 410}px`, // 主面板宽度400 + 间距10
      top: `${modalPosition.value.y}px`,
      zIndex: 9998
    }))

    /**
     * 切换帮助面板显示
     */
    const toggleHelpPanel = async () => {
      showHelpPanel.value = !showHelpPanel.value
      // 如果打开帮助面板，重新加载当前选中物品的唤醒数据
      if (showHelpPanel.value && selectedWeapon.value) {
        await loadAwakeningTypes()
      }
    }

    /**
     * 设置唤醒卷轴物品
     * @param {Object} item - 唤醒卷轴物品
     */
    const setAwakeningScrollItem = item => {
      awakeningScrollItem = item
    }

    /**
     * 初始化面板位置（居中显示）
     */
    const initPosition = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = 400
      const modalHeight = 300
      modalPosition.value = {
        x: Math.max(0, (windowWidth - modalWidth) / 2),
        y: Math.max(0, (windowHeight - modalHeight) / 2)
      }
    }

    /**
     * 开始拖拽
     */
    const startDrag = e => {
      // 只响应鼠标左键
      if (e.button !== 0) return
      isDragging.value = true
      const rect = modalRef.value.getBoundingClientRect()
      dragOffset.value = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      // 防止选中文字
      e.preventDefault()
    }

    /**
     * 拖拽移动
     */
    const onDrag = e => {
      if (!isDragging.value) return
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      const modalWidth = 400
      const modalHeight = 300

      let newX = e.clientX - dragOffset.value.x
      let newY = e.clientY - dragOffset.value.y

      // 限制在窗口范围内
      newX = Math.max(0, Math.min(newX, windowWidth - modalWidth))
      newY = Math.max(0, Math.min(newY, windowHeight - modalHeight))

      modalPosition.value = { x: newX, y: newY }
    }

    /**
     * 结束拖拽
     */
    const endDrag = () => {
      isDragging.value = false
    }

    /**
     * 获取可唤醒的武器/盾牌列表
     */
    const awakeningItems = computed(() => {
      return itemsStore.playerBag.filter(item => {
        // 只能唤醒武器或盾牌
        // 盾牌是 armor 类型，subcategory 是 shield
        const isWeapon = item.category === 'weapon'
        const isShield = item.subcategory === 'shield' || item.category === 'shield'
        return isWeapon || isShield
      }).map(item => {
        const isShield = item.subcategory === 'shield' || item.category === 'shield'
        return {
          ...item,
          icon: item.icon || `/pt/item_icon/${item.id}.png`,
          enhanceLevel: item.StrengthenedAttributes?.enhanceLevel || item.enhanceLevel || 0,
          category: isShield ? 'shield' : item.category
        }
      })
    })

    /**
     * 获取选中的武器
     */
    const selectedWeapon = computed(() => {
      if (!selectedWeaponId.value) return null
      const weapon = itemsStore.playerBag.find(item => item.uniqueId === selectedWeaponId.value)
      if (!weapon) return null
      
      // 盾牌特殊处理：修正 category
      const isShield = weapon.subcategory === 'shield' || weapon.category === 'shield'
      return {
        ...weapon,
        icon: weapon.icon || `/pt/item_icon/${weapon.id}.png`,
        enhanceLevel: weapon.StrengthenedAttributes?.enhanceLevel || weapon.enhanceLevel || 0,
        category: isShield ? 'shield' : weapon.category
      }
    })

    /**
     * 获取武器类型键名
     */
    const weaponTypeKey = computed(() => {
      if (!selectedWeapon.value) return null
      return getWeaponTypeKey(selectedWeapon.value)
    })

    /**
     * 获取可用的唤醒类型列表（使用异步加载的数据）
     */
    const availableAwakeningTypes = computed(() => {
      return loadedAwakeningTypes.value
    })

    /**
     * 异步加载唤醒类型数据
     */
    const loadAwakeningTypes = async () => {
      if (!selectedWeapon.value || !weaponTypeKey.value) {
        loadedAwakeningTypes.value = []
        return
      }

      const types = []
      const rarity = selectedWeapon.value.rarity || 'uncommon'

      try {
        // 武器类型：显示技能列表
        if (selectedWeapon.value.category === 'weapon') {
          const skills = await getAvailableAwakeningSkills(weaponTypeKey.value, rarity)
          if (Array.isArray(skills)) {
            skills.forEach(skill => {
              const skillName = getSkillNameById(skill.id)
              types.push({
                id: `skill_${skill.id}`,
                name: skillName,
                skillId: skill.id,
                type: 'skill',
                values: skill.values,
                maxProbability: skill.maxProbability,
                minProbability: skill.minProbability
              })
            })
          }
        }

        // 盾牌类型：显示参数列表
        if (selectedWeapon.value.category === 'shield') {
          const parameters = await getAvailableAwakeningParameters(weaponTypeKey.value, rarity)
          if (Array.isArray(parameters)) {
            parameters.forEach(param => {
              types.push({
                id: `param_${param.id}`,
                name: getParameterDisplayName(param.id),
                parameter: param.id,
                type: 'parameter',
                values: param.values,
                maxProbability: param.maxProbability,
                minProbability: param.minProbability
              })
            })
          }
        }

        loadedAwakeningTypes.value = types
      } catch (error) {
        console.error('[WeaponAwakening] 加载唤醒类型失败:', error)
        loadedAwakeningTypes.value = []
      }
    }

    /**
     * 根据概率获取颜色
     * @param {number} probability - 概率值
     * @returns {string} 颜色值
     */
    const getProbabilityColor = probability => {
      // 概率越高颜色越绿，概率越低颜色越红
      if (probability >= 40) return '#00ff88'
      if (probability >= 30) return '#88ff00'
      if (probability >= 20) return '#ffdd00'
      if (probability >= 10) return '#ff8800'
      return '#ff4444'
    }

    /**
     * 获取可用的目标值列表
     */
    const availableTargetValues = computed(() => {
      if (!selectedWeapon.value || !selectedAwakeningType.value) return []
      
      // 从已加载的唤醒类型数据中获取可用值
      const typeData = loadedAwakeningTypes.value.find(t => t.id === selectedAwakeningType.value)
      if (typeData && typeData.values && typeData.values.length > 0) {
        return [...typeData.values].sort((a, b) => a - b)
      }
      
      return []
    })

    /**
     * 获取武器显示名称
     */
    const getWeaponDisplayName = item => {
      if (!item) return '未知物品'
      const itemConfig = ITEM_INFO[item.id]
      if (itemConfig && itemConfig.name) {
        return itemConfig.name.cns || itemConfig.name.en || `物品ID: ${item.id}`
      }
      return item.name || `物品ID: ${item.id}`
    }

    /**
     * 获取参数显示名称（使用 Pinia 统一映射）
     */
    const getParameterDisplayName = param => {
      return descriptionsStore.getParameterName(param)
    }

    /**
     * 判断是否可以唤醒
     */
    const canAwaken = computed(() => {
      if (!selectedWeapon.value) return false
      if (isAwakening.value) return false
      // 检查是否有唤醒卷轴
      const scrollCount = itemsStore.getItemCount(AWAKENING_SCROLL_ID)
      return scrollCount > 0
    })

    /**
     * 判断是否可以自动唤醒
     */
    const canAutoAwaken = computed(() => {
      if (!selectedWeapon.value) return false
      // 自动唤醒过程中允许点击停止
      if (isAutoAwakening.value) return true
      // 非自动唤醒过程中，正在唤醒时禁止
      if (isAwakening.value) return false
      // 必须选择了唤醒类型
      if (!selectedAwakeningType.value) return false
      // 检查是否有唤醒卷轴
      const scrollCount = itemsStore.getItemCount(AWAKENING_SCROLL_ID)
      return scrollCount > 0
    })

    /**
     * 切换武器选择面板
     */
    const toggleWeaponPanel = async () => {
      if (awakeningItems.value.length === 0) return
      showWeaponPanel.value = !showWeaponPanel.value
      if (showWeaponPanel.value) {
        await nextTick()
        updatePanelPosition()
      }
    }

    /**
     * 更新面板位置
     */
    const updatePanelPosition = () => {
      if (!selectWeaponBoxRef.value) return
      const rect = selectWeaponBoxRef.value.getBoundingClientRect()
      weaponPanelStyle.value = {
        position: 'fixed',
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`,
        zIndex: 10000
      }
    }

    /**
     * 选择武器
     */
    const selectWeapon = async item => {
      selectedWeaponId.value = item.uniqueId
      showWeaponPanel.value = false
      awakeningResult.value = null
      errorMessage.value = ''
      successMessage.value = ''
      selectedAwakeningType.value = ''
      targetAwakeningValue.value = null
      hideItemTooltip()

      // 异步加载唤醒类型
      await loadAwakeningTypes()
    }

    /**
     * 唤醒类型变更处理
     */
    const onAwakeningTypeChange = () => {
      targetAwakeningValue.value = null
    }

    /**
     * 执行唤醒操作
     */
    const handleAwaken = async () => {
      if (!canAwaken.value || isAwakening.value) return

      isAwakening.value = true
      errorMessage.value = ''
      successMessage.value = ''
      awakeningResult.value = null

      try {
        const result = await performAwakening(
          selectedWeapon.value,
          weaponTypeKey.value,
          selectedAwakeningType.value || null
        )

        if (result.success) {
          // 移除唤醒卷轴
          itemsStore.removeItemFromBag(AWAKENING_SCROLL_ID, 1)

          // 只有当唤醒结果发生变化时才更新武器数据
          if (!result.unchanged) {
            // 更新武器数据
            const weaponIndex = itemsStore.playerBag.findIndex(
              item => item.uniqueId === selectedWeaponId.value
            )
            if (weaponIndex !== -1) {
              if (result.type === 'skill') {
                itemsStore.playerBag[weaponIndex].awakenedSkillData = {
                  skillId: result.skillId,
                  skillValue: result.value
                }
              } else {
                itemsStore.playerBag[weaponIndex].awakenedParameterData = {
                  parameter: result.parameter,
                  value: result.value
                }
              }
            }

            // 保存数据
            gameStore.player.bag = [...itemsStore.playerBag]
            // storageService 已通过 import 导入全局单例
            storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })
          }

          // 设置结果
          awakeningResult.value = result

          // 输出战斗日志和动画
          const weaponName = getWeaponDisplayName(selectedWeapon.value)
          const typeName = result.type === 'skill' ? result.skillName : result.parameterName
          
          if (result.unchanged) {
            emit('add-battle-log', `${weaponName} 唤醒 属性未发生变化`, 'info')
          } else {
            emit('play-sfx', 'InfUpgradeSuccess.wav')
            emit('add-battle-log', `${weaponName} 唤醒 ${typeName} +${result.value}%`, 'success')
            emit('show-animation-message', `${typeName} +${result.value}%`, 'upgrade-success', selectedWeapon.value.icon)
          }
          successMessage.value = result.unchanged ? '属性未发生变化' : '唤醒成功！'
        } else {
          errorMessage.value = result.message || '唤醒失败'
        }
      } catch (error) {
        console.error('[WeaponAwakening] 唤醒失败:', error)
        errorMessage.value = '唤醒失败，请重试'
      } finally {
        isAwakening.value = false
      }
    }

    /**
     * 等待进度条完成（1秒）
     * @returns {Promise<void>}
     */
    const waitForProgress = () => {
      return new Promise(resolve => {
        progressPercent.value = 0
        const duration = 1000 // 1秒
        let startTime = null

        const animate = (timestamp) => {
          if (!startTime) startTime = timestamp
          const elapsed = timestamp - startTime
          const progress = Math.min(100, (elapsed / duration) * 100)
          progressPercent.value = Math.round(progress)

          if (progress < 100) {
            progressTimer = requestAnimationFrame(animate)
          } else {
            progressTimer = null
            resolve()
          }
        }

        progressTimer = requestAnimationFrame(animate)
      })
    }

    /**
     * 执行自动唤醒操作
     */
    const handleAutoAwaken = async () => {
      // 如果正在自动唤醒，则停止
      if (isAutoAwakening.value) {
        shouldStopAutoAwaken.value = true
        return
      }

      if (!canAutoAwaken.value || isAwakening.value) return

      isAutoAwakening.value = true
      isAwakening.value = true
      shouldStopAutoAwaken.value = false
      errorMessage.value = ''
      successMessage.value = ''

      try {
        let currentScrollCount = itemsStore.getItemCount(AWAKENING_SCROLL_ID)
        let attempts = 0
        const maxAttempts = currentScrollCount

        while (attempts < maxAttempts && currentScrollCount > 0 && !shouldStopAutoAwaken.value) {
          // 等待进度条完成
          await waitForProgress()

          // 检查是否被停止
          if (shouldStopAutoAwaken.value) {
            break
          }

          const result = await performAwakening(
            selectedWeapon.value,
            weaponTypeKey.value,
            selectedAwakeningType.value
          )

          if (result.success) {
            // 移除唤醒卷轴
            itemsStore.removeItemFromBag(AWAKENING_SCROLL_ID, 1)
            currentScrollCount--
            attempts++

            // 输出每次唤醒的战斗日志和动画
            const weaponName = getWeaponDisplayName(selectedWeapon.value)
            const typeName = result.type === 'skill' ? result.skillName : result.parameterName

            if (result.unchanged) {
              emit('add-battle-log', `${weaponName} 唤醒 属性未发生变化`, 'info')
            } else {
              emit('play-sfx', 'InfUpgradeSuccess.wav')
              emit('add-battle-log', `${weaponName} 唤醒 ${typeName} +${result.value}%`, 'success')
              emit('show-animation-message', `${typeName} +${result.value}%`, 'upgrade-success', selectedWeapon.value.icon)
            }

            // 只有获得值时才更新武器数据
            if (!result.unchanged && result.value !== null) {
              const weaponIndex = itemsStore.playerBag.findIndex(
                item => item.uniqueId === selectedWeaponId.value
              )
              if (weaponIndex !== -1) {
                if (result.type === 'skill') {
                  itemsStore.playerBag[weaponIndex].awakenedSkillData = {
                    skillId: result.skillId,
                    skillValue: result.value
                  }
                } else {
                  itemsStore.playerBag[weaponIndex].awakenedParameterData = {
                    parameter: result.parameter,
                    value: result.value
                  }
                }
              }

              awakeningResult.value = result

              // 检查是否达到目标值
              if (targetAwakeningValue.value && result.value === targetAwakeningValue.value) {
                successMessage.value = `自动唤醒成功！达到目标值 ${result.value}%`
                break
              }
            }
          } else {
            // 唤醒失败，跳出循环
            errorMessage.value = result.message || '唤醒失败'
            break
          }
        }

        // 保存数据
        gameStore.player.bag = [...itemsStore.playerBag]
        // storageService 已通过 import 导入全局单例
        storageService.savePlayerPatch({ bag: [...itemsStore.playerBag] })

        if (shouldStopAutoAwaken.value) {
          emit('add-battle-log', `自动唤醒已停止，使用 ${attempts} 张卷轴`, 'info')
        } else if (!successMessage.value) {
          emit('add-battle-log', `自动唤醒完成！使用 ${attempts} 张卷轴，未达到目标值`, 'warning')
        } else {
          emit('play-sfx', 'InfUpgradeSuccess.wav')
          emit('add-battle-log', successMessage.value, 'success')
        }
      } catch (error) {
        console.error('[WeaponAwakening] 自动唤醒失败:', error)
        errorMessage.value = '自动唤醒失败，请重试'
      } finally {
        isAwakening.value = false
        isAutoAwakening.value = false
        shouldStopAutoAwaken.value = false
        progressPercent.value = 0
      }
    }

    /**
     * 处理图片错误
     */
    const handleIconError = event => {
      const img = event.target
      if (img) {
        img.src = '/pt/item_icon/1.png'
      }
    }

    /**
     * 显示物品工具提示
     */
    const showItemTooltip = (event, item) => {
      // TODO: 实现物品工具提示
    }

    /**
     * 隐藏物品工具提示
     */
    const hideItemTooltip = () => {
      // TODO: 实现物品工具提示
    }

    /**
     * 移动物品工具提示
     */
    const moveItemTooltip = () => {
      // TODO: 实现物品工具提示
    }

    /**
     * 关闭面板
     */
    const handleClose = () => {
      emit('close')
    }

    /**
     * 点击外部关闭面板
     */
    const handleClickOutside = e => {
      if (showWeaponPanel.value) {
        const isClickInsideBox = selectWeaponBoxRef.value?.contains(e.target)
        const isClickInsidePanel = weaponPanelRef.value?.contains(e.target)
        if (!isClickInsideBox && !isClickInsidePanel) {
          showWeaponPanel.value = false
          hideItemTooltip()
        }
      }
    }

    // 监听visible变化，初始化位置
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        initPosition()
      }
    })

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('mousemove', onDrag)
      document.addEventListener('mouseup', endDrag)
      if (props.visible) {
        initPosition()
      }
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', endDrag)
      // 清除进度条动画
      if (progressTimer) {
        cancelAnimationFrame(progressTimer)
        progressTimer = null
      }
    })

    return {
      // 引用
      modalRef,
      selectWeaponBoxRef,
      weaponPanelRef,
      // 状态
      selectedWeaponId,
      showWeaponPanel,
      weaponPanelStyle,
      isAwakening,
      isAutoAwakening,
      awakeningResult,
      errorMessage,
      successMessage,
      selectedAwakeningType,
      targetAwakeningValue,
      modalStyle,
      showHelpPanel,
      helpPanelStyle,
      progressPercent,
      // 计算属性
      awakeningItems,
      selectedWeapon,
      availableAwakeningTypes,
      availableTargetValues,
      canAwaken,
      canAutoAwaken,
      // 方法
      getWeaponDisplayName,
      toggleWeaponPanel,
      selectWeapon,
      onAwakeningTypeChange,
      handleAwaken,
      handleAutoAwaken,
      handleIconError,
      showItemTooltip,
      hideItemTooltip,
      moveItemTooltip,
      handleClose,
      setAwakeningScrollItem,
      startDrag,
      toggleHelpPanel,
      getProbabilityColor
    }
  }
}
</script>

<style scoped>
.weapon-awakening-modal {
  position: fixed;
  width: 400px;
  height: 400px;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #3a3a5a;
  cursor: move;
  user-select: none;
}

.modal-title {
  font-size: 14px;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  flex: 1;
  text-align: center;
}

.help-button {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
  line-height: 1;
  margin-right: 8px;
}

.help-button:hover {
  background: rgba(255, 215, 0, 0.4);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.close-button {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: #fff;
}

.modal-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.awakening-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 11px;
  color: #aaa;
}

.select-box {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 36px;
}

.select-box:hover:not(.disabled) {
  border-color: #5a5a8a;
}

.select-box.active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.select-box.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  margin-right: 6px;
}

.select-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.select-name {
  color: #fff;
  font-size: 12px;
}

.select-level {
  color: #888;
  font-size: 10px;
}

.select-placeholder {
  flex: 1;
  color: #666;
  font-size: 12px;
}

.select-arrow {
  color: #888;
  font-size: 10px;
  transition: transform 0.2s;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

/* 唤醒结果区域 */
.result-section {
  background: rgba(0, 100, 0, 0.2);
  border: 1px solid #2a5a2a;
  border-radius: 6px;
  padding: 6px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-label {
  color: #888;
  font-size: 11px;
}

.result-value {
  color: #fff;
  font-size: 12px;
}

.result-value.highlight {
  color: #ffd700;
  font-weight: bold;
}

.result-value.skill-name {
  color: #00ff88;
}

.result-value.unchanged {
  color: #888;
  font-style: italic;
}

/* 自动唤醒配置区域 */
.auto-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid #3a3a5a;
  border-radius: 6px;
  padding: 6px;
}

.auto-config {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-label {
  color: #888;
  font-size: 11px;
  min-width: 70px;
}

.config-select {
  flex: 1;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #3a3a5a;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  cursor: pointer;
}

.config-select:focus {
  outline: none;
  border-color: #ffd700;
}

/* 操作按钮区域 */
.awakening-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid #3a3a5a;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.auto-btn {
  background: linear-gradient(135deg, #4a5a7c 0%, #6a7a9c 100%);
  color: #fff;
}

.auto-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6a8c 0%, #7a8aac 100%);
  box-shadow: 0 0 15px rgba(90, 106, 140, 0.5);
}

.auto-btn.stop-btn {
  background: linear-gradient(135deg, #8c3a3a 0%, #ac5a5a 100%);
  animation: pulse-stop 1s infinite;
}

.auto-btn.stop-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #9c4a4a 0%, #bc6a6a 100%);
  box-shadow: 0 0 15px rgba(172, 90, 90, 0.5);
}

@keyframes pulse-stop {
  0%, 100% { box-shadow: 0 0 5px rgba(172, 90, 90, 0.3); }
  50% { box-shadow: 0 0 15px rgba(172, 90, 90, 0.6); }
}

.awaken-btn {
  background: linear-gradient(135deg, #7c5a4a 0%, #9c7a6a 100%);
  color: #fff;
}

.awaken-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #8c6a5a 0%, #ac8a7a 100%);
  box-shadow: 0 0 15px rgba(140, 106, 90, 0.5);
}

.action-btn:disabled {
  background: #3a3a4a;
  color: #666;
  cursor: not-allowed;
}

/* 消息区域 */
.message {
  text-align: center;
  font-size: 11px;
  padding: 4px;
  border-radius: 4px;
}

.error-message {
  color: #ff6666;
  background: rgba(255, 0, 0, 0.1);
}

.success-message {
  color: #00ff88;
  background: rgba(0, 255, 0, 0.1);
}

/* 武器选择弹出面板 */
.weapon-popup {
  width: 260px;
  max-height: 200px;
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 10000;
}

.popup-header {
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #3a3a5a;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
}

.popup-items {
  max-height: 160px;
  overflow-y: auto;
}

.popup-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(60, 60, 90, 0.3);
}

.popup-item:hover {
  background: rgba(255, 215, 0, 0.1);
}

.popup-item.selected {
  background: rgba(255, 215, 0, 0.2);
  border-left: 3px solid #ffd700;
}

.popup-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  margin-right: 6px;
}

.popup-info {
  flex: 1;
}

.popup-name {
  color: #fff;
  font-size: 12px;
}

.popup-level {
  color: #888;
  font-size: 10px;
  margin-top: 1px;
}

/* 帮助面板样式 */
.help-panel {
  width: 180px;
  max-height: 300px;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.help-panel-header {
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid #3a3a5a;
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}

.help-panel-content {
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-item {
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  border: 1px solid #3a3a5a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  color: #00ff88;
  font-size: 11px;
}

.skill-probability {
  font-size: 10px;
  font-weight: bold;
}

.empty-tip {
  color: #666;
  font-size: 11px;
  text-align: center;
  padding: 10px;
}

/* 进度条样式 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.progress-bar {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #3a3a5a;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ddff);
  border-radius: 6px;
}

.progress-text {
  color: #00ff88;
  font-size: 12px;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
}

/* 动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: opacity 0.3s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}
</style>
