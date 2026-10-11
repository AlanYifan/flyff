<!--
  @file BuffTimerPanel.vue
  @description BUFF与副本计时面板 - 按J键打开，仅显示道具BUFF剩余时间和副本冷却倒计时
  @generated 2026-06-20
-->
<template>
  <transition name="buff-timer-panel" appear>
    <div v-if="isVisible" ref="panelRef" class="buff-timer-panel" :style="panelStyle">
      <!-- 头部 -->
      <div class="panel-header" @mousedown="startDrag">
        <h2 class="panel-title">计时面板</h2>
        <button class="close-button" @click="close">&times;</button>
      </div>

      <!-- 中部：滑块切换 -->
      <div class="panel-tabs">
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'buff' }"
          @click="switchTab('buff')"
        >
          道具时间
        </div>
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'skill' }"
          @click="switchTab('skill')"
        >
          技能时间
        </div>
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'dungeon' }"
          @click="switchTab('dungeon')"
        >
          副本时间
        </div>
      </div>

      <!-- 下部：内容区域 -->
      <div class="panel-content">
        <!-- 道具时间：仅显示道具类BUFF（排除技能BUFF） -->
        <div v-if="activeTab === 'buff'" class="buff-list">
          <div
            v-for="buff in displayBuffs"
            :key="buff.id"
            class="buff-item"
            :class="{ 'buff-warning': getBuffRemaining(buff) > 0 && getBuffRemaining(buff) < 30 }"
          >
            <img
              :src="buff.icon || `/pt/item_icon/default_item.png`"
              :alt="getBuffName(buff)"
              class="buff-icon"
              @error="handleImageError"
            />
            <div class="buff-info">
              <div class="buff-header">
                <span class="buff-name">{{ getBuffName(buff) }}</span>
                <span class="buff-time">{{ formatDuration(getBuffRemaining(buff)) }}</span>
              </div>
              <!-- BUFF详情描述 -->
              <div v-if="getBuffDescription(buff)" class="buff-description">
                {{ getBuffDescription(buff) }}
              </div>
              <!-- BUFF效果列表 -->
              <div v-if="getBuffEffectLines(buff).length" class="buff-effects">
                <span
                  v-for="(line, idx) in getBuffEffectLines(buff)"
                  :key="idx"
                  class="buff-effect-line"
                >{{ line }}</span>
              </div>
            </div>
            <!-- 移除按钮：捡宠BUFF不显示移除按钮 -->
            <button
              v-if="!isPickupPetBuff(buff)"
              class="buff-remove-btn"
              title="移除此BUFF"
              @click.stop="handleRemoveBuff(buff)"
            >
              &times;
            </button>
          </div>
          <div v-if="displayBuffs.length === 0" class="empty-hint">
            暂无激活的道具增益效果
          </div>
        </div>

        <!-- 技能时间：显示技能类BUFF剩余时间 -->
        <div v-if="activeTab === 'skill'" class="buff-list">
          <div
            v-for="buff in displaySkillBuffs"
            :key="buff.id || buff.key || buff.name"
            class="buff-item skill-buff-item"
            :class="{ 'buff-warning': getBuffRemaining(buff) > 0 && getBuffRemaining(buff) < 30 }"
          >
            <img
              :src="buff.icon || `/pt/skill_icon/default_skill.png`"
              :alt="getBuffName(buff)"
              class="buff-icon skill-buff-icon"
              @error="handleImageError"
            />
            <div class="buff-info">
              <div class="buff-header">
                <span class="buff-name">{{ getBuffName(buff) }}</span>
                <span class="buff-time">{{ formatDuration(getBuffRemaining(buff)) }}</span>
              </div>
              <!-- 技能来源标签 -->
              <div v-if="getSkillBuffSourceLabel(buff)" class="skill-source-tag">
                {{ getSkillBuffSourceLabel(buff) }}
              </div>
              <!-- BUFF详情描述 -->
              <div v-if="getBuffDescription(buff)" class="buff-description">
                {{ getBuffDescription(buff) }}
              </div>
              <!-- BUFF效果列表 -->
              <div v-if="getBuffEffectLines(buff).length" class="buff-effects">
                <span
                  v-for="(line, idx) in getBuffEffectLines(buff)"
                  :key="idx"
                  class="buff-effect-line"
                >{{ line }}</span>
              </div>
            </div>
            <!-- 移除按钮 -->
            <button
              class="buff-remove-btn"
              title="移除此BUFF"
              @click.stop="handleRemoveBuff(buff)"
            >
              &times;
            </button>
          </div>
          <div v-if="displaySkillBuffs.length === 0" class="empty-hint">
            暂无激活的技能增益效果
          </div>
        </div>

        <!-- 副本时间：仅显示今天进入的副本，活跃期显示倒计时，CD期显示CD剩余 -->
        <div v-if="activeTab === 'dungeon'" class="dungeon-list">
          <div
            v-for="dungeon in todayDungeons"
            :key="dungeon.id"
            class="dungeon-item"
            :class="{ 'dungeon-active': isDungeonActive(dungeon), 'dungeon-cooldown': isDungeonInCooldown(dungeon) }"
          >
            <img
              :src="dungeon.bossIcon || dungeon.image"
              :alt="dungeon.name"
              class="dungeon-image"
              @error="handleDungeonImageError"
            />
            <div class="dungeon-info">
              <span class="dungeon-name">{{ dungeon.name }}</span>
              <span v-if="isDungeonActive(dungeon)" class="dungeon-countdown dungeon-active-text">
                倒计时 {{ formatDuration(getDungeonRemainingTime(dungeon)) }}
              </span>
              <span v-else-if="isDungeonInCooldown(dungeon)" class="dungeon-countdown">
                CD {{ formatDuration(getDungeonRemainingTime(dungeon)) }}
              </span>
            </div>
          </div>
          <div v-if="todayDungeons.length === 0" class="empty-hint">
            今天暂未进入任何副本
          </div>
        </div>
      </div>
      <!-- 移除BUFF二次确认弹窗（面板内覆盖层） -->
      <div v-if="removeConfirmVisible" class="buff-confirm-overlay" @click.self="cancelRemoveBuff">
        <div class="buff-confirm-dialog">
          <div class="buff-confirm-title">确认移除</div>
          <div class="buff-confirm-message">
            确定要移除「<span class="buff-confirm-name">{{ removeConfirmBuffName }}</span>」效果吗？
          </div>
          <div class="buff-confirm-actions">
            <button class="buff-confirm-cancel" @click="cancelRemoveBuff">取消</button>
            <button class="buff-confirm-ok" @click="confirmRemoveBuff">确认移除</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * BUFF与副本计时面板
 * 按J键打开，显示当前BUFF剩余时间和副本冷却倒计时
 *
 * @file BuffTimerPanel.vue
 * @generated 2026-06-20
 */
import { ref, computed, watch, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { dungeonData } from '@/composables/useMap'
import { useDungeonTimer, DUNGEON_STATE } from '@/composables/useDungeonTimer'
import { formatBuffEffects } from '@/utils/effectFormatter'

// Props
const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  },
  /** 玩家数据 */
  player: {
    type: Object,
    default: () => ({})
  },
  /** 当前地图名称 */
  currentMapName: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'remove-buff'])

// 当前激活的标签页
const activeTab = ref('buff')

// 副本倒计时管理
const { getTodayDungeons, getDungeonState } = useDungeonTimer()

// 面板引用
const panelRef = ref(null)

// 拖拽状态
const position = ref({ x: 0, y: 0 })
const positionMode = ref('center')
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const panelSize = ref({ width: 0, height: 0 })
const hasInitializedPosition = ref(false)

// 响应式时间戳，每秒更新一次用于倒计时刷新
const currentTime = ref(Date.now())
let tickTimer = null

/**
 * 启动倒计时更新定时器
 */
const startTickTimer = () => {
  if (tickTimer) return
  tickTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
}

/**
 * 停止倒计时更新定时器
 */
const stopTickTimer = () => {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

/**
 * 计算面板样式（居中或绝对定位）
 * @returns {Record<string, string>}
 */
const panelStyle = computed(() => {
  if (positionMode.value === 'center') {
    return {
      left: '50%',
      top: '50%',
      translate: '-50% -50%'
    }
  }
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    translate: '0 0'
  }
})

/**
 * 判断BUFF是否为捡宠BUFF
 * 捡宠BUFF的 type 为 'pickuppet'，不可移除
 * @param {Object} buff - BUFF对象
 * @returns {boolean} 是否为捡宠BUFF
 */
const isPickupPetBuff = (buff) => {
  if (!buff) return false
  return buff.type === 'pickuppet'
}

// 移除确认弹窗状态
const removeConfirmVisible = ref(false)
const pendingRemoveBuff = ref(null)

/**
 * 移除确认弹窗中显示的BUFF名称
 */
const removeConfirmBuffName = computed(() => {
  return getBuffName(pendingRemoveBuff.value)
})

/**
 * 点击移除按钮，弹出二次确认弹窗
 * @param {Object} buff - 待移除的BUFF对象
 */
const handleRemoveBuff = (buff) => {
  if (!buff) return
  pendingRemoveBuff.value = buff
  removeConfirmVisible.value = true
}

/**
 * 确认移除BUFF，向父组件派发事件并关闭确认弹窗
 */
const confirmRemoveBuff = () => {
  if (pendingRemoveBuff.value) {
    emit('remove-buff', { buff: pendingRemoveBuff.value })
  }
  removeConfirmVisible.value = false
  pendingRemoveBuff.value = null
}

/**
 * 取消移除BUFF，关闭确认弹窗
 */
const cancelRemoveBuff = () => {
  removeConfirmVisible.value = false
  pendingRemoveBuff.value = null
}

/**
 * 判断BUFF是否为道具类BUFF（排除技能BUFF）
 * 道具BUFF特征：source === 'item'、type 为 elementAttack/autoRecovery/autoSell/buff 等道具特有类型
 * 技能BUFF特征：有 sourceMember、skillId、skillKey、isTeamBuff 等字段
 * @param {Object} buff - BUFF对象
 * @returns {boolean} 是否为道具类BUFF
 */
const isItemBuff = (buff) => {
  if (!buff) return false
  // 明确标记为道具来源
  if (buff.source === 'item') return true
  // 属性攻击石头类型（type 为 elementAttack，且ID >= 9000 为石头生成的BUFF ID）
  if (buff.type === 'elementAttack') return true
  // 捡宠BUFF类型
  if (buff.type === 'pickuppet') return true
  // 排除技能BUFF：有 sourceMember、skillId、skillKey、isTeamBuff 等字段
  if (buff.sourceMember || buff.skillId || buff.skillKey || buff.isTeamBuff) return false
  // 排除有 key 字段的技能BUFF（技能BUFF通常使用 key 如 'priest_e'、'knight_t' 等）
  if (buff.key && typeof buff.key === 'string' && buff.key.includes('_')) return false
  // 默认不显示（保守策略，避免误显示技能BUFF）
  return false
}

/**
 * 判断BUFF是否为技能类BUFF
 * 技能BUFF特征：source === 'skill'、有 sourceMember、skillId、skillKey、isTeamBuff 等字段
 * @param {Object} buff - BUFF对象
 * @returns {boolean} 是否为技能类BUFF
 */
const isSkillBuff = (buff) => {
  if (!buff) return false
  // 明确标记为技能来源
  if (buff.source === 'skill') return true
  // 有施法者信息（Dungeon系统中的团队BUFF）
  if (buff.sourceMember) return true
  // 有技能ID或技能键
  if (buff.skillId || buff.skillKey) return true
  // 团队BUFF标记
  if (buff.isTeamBuff) return true
  // 排除道具BUFF
  if (buff.source === 'item') return false
  if (buff.type === 'elementAttack') return false
  if (buff.type === 'pickuppet') return false
  // key 包含下划线的 BUFF（技能键如 'priest_e'、'knight_t'）
  if (buff.key && typeof buff.key === 'string' && buff.key.includes('_')) return true
  return false
}

/**
 * 获取技能BUFF的来源标签文本
 * 显示施法者名称、团队BUFF标记等信息
 * @param {Object} buff - BUFF对象
 * @returns {string} 来源标签文本，无信息时返回空字符串
 */
const getSkillBuffSourceLabel = (buff) => {
  if (!buff) return ''
  const parts = []
  // 施法者信息
  if (buff.sourceMember) {
    parts.push(`施法者: ${buff.sourceMember}`)
  }
  // 团队BUFF标记
  if (buff.isTeamBuff) {
    parts.push('团体BUFF')
  }
  // 技能等级
  if (buff.level || buff.skillLevel) {
    parts.push(`Lv.${buff.level || buff.skillLevel}`)
  }
  return parts.join(' · ')
}

/**
 * 获取玩家已激活的技能类BUFF列表（带倒计时刷新，过滤道具BUFF）
 */
const displaySkillBuffs = computed(() => {
  // 依赖 currentTime 触发响应式更新
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value

  const buffs = props.player?.activeBuffs
  if (!Array.isArray(buffs)) return []
  // 过滤掉已过期的BUFF
  const now = Date.now()
  return buffs.filter(b => {
    if (!b || (!b.id && !b.key && !b.name)) return false
    if (!isSkillBuff(b)) return false
    // 检查 expiresAt 或 endTime 是否已过期
    const endTime = b.endTime || b.expiresAt
    if (endTime && endTime <= now) return false
    return true
  })
})

/**
 * 获取玩家已激活的道具类BUFF列表（带倒计时刷新，过滤技能BUFF）
 */
const displayBuffs = computed(() => {
  // 依赖 currentTime 触发响应式更新
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value

  const buffs = props.player?.activeBuffs
  if (!Array.isArray(buffs)) return []
  // 过滤掉已过期的BUFF（expiresAt 已过当前时间）
  const now = Date.now()
  return buffs.filter(b => {
    if (!b || (!b.id && !b.key)) return false
    if (!isItemBuff(b)) return false
    // 检查 expiresAt 是否已过期
    const expiresAt = Number(b.expiresAt ?? 0)
    if (expiresAt > 0 && expiresAt <= now) return false
    return true
  })
})

/**
 * 获取副本最后一个怪物（BOSS）的图标路径
 * 优先从 difficultyMonsters 的第一个难度取最后一个怪物，回退到 monsters 数组最后一个
 * @param {Object} dungeon - 副本数据对象
 * @returns {string} BOSS图标路径
 */
const getDungeonBossIcon = (dungeon) => {
  let lastMonsterId = null
  // 优先从 difficultyMonsters 取第一个难度的怪物列表
  if (dungeon.difficultyMonsters) {
    const firstDifficulty = Object.values(dungeon.difficultyMonsters)[0]
    if (Array.isArray(firstDifficulty) && firstDifficulty.length > 0) {
      lastMonsterId = firstDifficulty[firstDifficulty.length - 1].id
    }
  }
  // 回退到 monsters 数组
  if (!lastMonsterId && Array.isArray(dungeon.monsters) && dungeon.monsters.length > 0) {
    lastMonsterId = dungeon.monsters[dungeon.monsters.length - 1].id
  }
  if (lastMonsterId) {
    return `/pt/monster_icon/${lastMonsterId}.png`
  }
  // 最终回退到副本图片
  return dungeon.image || '/pt/map/fuben/duoluoshengyu.png'
}

/**
 * 获取今天进入过的副本列表（不限当前地图，覆盖所有地图的副本）
 * 活跃期显示剩余倒计时，CD期显示剩余CD时间
 */
const todayDungeons = computed(() => {
  // 依赖 currentTime 触发响应式更新
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value

  // 收集所有地图的副本列表，不限于当前地图
  const allDungeons = []
  for (const mapName in dungeonData) {
    if (Array.isArray(dungeonData[mapName])) {
      allDungeons.push(...dungeonData[mapName])
    }
  }
  return getTodayDungeons(allDungeons).map(d => ({
    ...d,
    bossIcon: getDungeonBossIcon(d)
  }))
})

/**
 * 切换标签页
 * @param {string} tab - 标签页标识
 */
const switchTab = (tab) => {
  activeTab.value = tab
}

/**
 * 关闭面板
 */
const close = () => {
  emit('close')
}

/**
 * 获取BUFF名称
 * @param {Object} buff - BUFF对象
 * @returns {string} BUFF名称
 */
const getBuffName = (buff) => {
  if (!buff) return '未知效果'
  if (typeof buff.name === 'string') return buff.name
  if (buff.name?.cns) return buff.name.cns
  if (buff.name?.en) return buff.name.en
  return `效果#${buff.id || '?'}`
}

/**
 * 获取BUFF剩余时间（秒）
 * @param {Object} buff - BUFF对象
 * @returns {number} 剩余秒数
 */
const getBuffRemaining = (buff) => {
  if (!buff) return 0
  // 访问 currentTime.value 触发响应式更新
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value

  const endTime = buff.endTime || buff.expiresAt
  if (endTime) {
    const remaining = Math.ceil((endTime - Date.now()) / 1000)
    return Math.max(0, remaining)
  }
  return buff.duration || 0
}

/**
 * 格式化持续时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
const formatDuration = (seconds) => {
  const safe = Number(seconds)
  if (!Number.isFinite(safe) || safe <= 0) return '0:00'

  const total = Math.floor(safe)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 判断副本是否在活跃期（倒计时进行中，可自由出入）
 * 直接调用 getDungeonState 获取实时状态，确保倒计时结束后立即切换
 * @param {Object} dungeon - 副本对象
 * @returns {boolean} 是否在活跃期
 */
const isDungeonActive = (dungeon) => {
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value
  return getDungeonState(dungeon.id).state === DUNGEON_STATE.ACTIVE
}

/**
 * 判断副本是否在冷却中
 * 直接调用 getDungeonState 获取实时状态，确保倒计时结束后立即显示CD
 * @param {Object} dungeon - 副本对象
 * @returns {boolean} 是否在冷却中
 */
const isDungeonInCooldown = (dungeon) => {
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value
  return getDungeonState(dungeon.id).state === DUNGEON_STATE.COOLDOWN
}

/**
 * 获取副本剩余时间（秒）
 * 直接调用 getDungeonState 获取实时剩余时间，活跃期返回倒计时剩余，CD期返回CD剩余
 * @param {Object} dungeon - 副本对象
 * @returns {number} 剩余秒数
 */
const getDungeonRemainingTime = (dungeon) => {
  // eslint-disable-next-line no-unused-vars
  const _ = currentTime.value
  const stateInfo = getDungeonState(dungeon.id)
  return Math.ceil((stateInfo.remainingMs || 0) / 1000)
}

/**
 * 将数值限制在范围内
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

/**
 * 刷新面板尺寸缓存
 */
const updatePanelSize = () => {
  const el = panelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelSize.value = { width: rect.width, height: rect.height }
}

/**
 * 确保面板定位到屏幕中央（首次打开）
 */
const ensureDefaultPosition = async () => {
  if (hasInitializedPosition.value) return
  await nextTick()
  positionMode.value = 'center'
  hasInitializedPosition.value = true
}

/**
 * 拖拽开始
 * @param {MouseEvent} event
 */
const startDrag = (event) => {
  if (!event || event.button !== 0) return
  if (event.target.closest('button, input, select, textarea')) return
  if (event.target.closest('.panel-tab')) return

  if (positionMode.value === 'center' && panelRef.value) {
    const rect = panelRef.value.getBoundingClientRect()
    position.value = { x: rect.left, y: rect.top }
    positionMode.value = 'absolute'
  }

  updatePanelSize()
  isDragging.value = true
  dragOffset.value = {
    x: event.clientX - position.value.x,
    y: event.clientY - position.value.y
  }
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('mouseleave', stopDrag)
}

/**
 * 拖拽移动处理
 * @param {MouseEvent} event
 */
const handleDragMove = (event) => {
  if (!isDragging.value) return

  const width = panelSize.value.width || 420
  const height = panelSize.value.height || 400
  const maxX = Math.max(0, window.innerWidth - width)
  const maxY = Math.max(0, window.innerHeight - height)

  position.value = {
    x: clamp(event.clientX - dragOffset.value.x, 0, maxX),
    y: clamp(event.clientY - dragOffset.value.y, 0, maxY)
  }
}

/**
 * 拖拽结束
 */
const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseleave', stopDrag)
}

/**
 * 获取BUFF详情描述文本
 * 优先使用 buff.description 字段，若为空则返回空字符串
 * @param {Object} buff - BUFF对象
 * @returns {string} 描述文本
 */
const getBuffDescription = (buff) => {
  if (!buff) return ''
  if (typeof buff.description === 'string' && buff.description.trim()) {
    return buff.description.trim()
  }
  // 属性攻击石头类型：生成描述
  if (buff.type === 'elementAttack' && buff.attackPercent) {
    const elementNames = { fire: '火', water: '水', wind: '风', thunder: '雷', electricity: '雷', earth: '土' }
    const elementName = elementNames[buff.element] || ''
    return `武器${elementName}属性攻击提升${buff.attackPercent}%，持续1小时`
  }
  return ''
}

/**
 * 获取BUFF效果列表（格式化后的效果文本数组）
 * 包含护盾状态显示（天使之翼EX3生命护盾等附带护盾的BUFF）
 * @param {Object} buff - BUFF对象
 * @returns {string[]} 效果文本数组
 */
const getBuffEffectLines = (buff) => {
  if (!buff) return []
  const lines = []

  // 检查是否有护盾吸收效果（天使之翼EX3生命护盾等）
  const shieldMax = Number(buff.maxAbsorbDamage) || 0
  const shieldCurrent = Number(buff.currentAbsorbDamage) || 0
  if (shieldMax > 0) {
    const formatNum = (num) => num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
    if (shieldCurrent > 0) {
      lines.push(`生命护盾: ${formatNum(shieldCurrent)} / ${formatNum(shieldMax)}`)
    } else {
      lines.push(`生命护盾: 已耗尽 / ${formatNum(shieldMax)}`)
    }
  }

  // 使用统一的格式化工具处理 effects 对象
  const effectLines = formatBuffEffects(buff)
  if (effectLines.length > 0) {
    lines.push(...effectLines)
  }
  // 属性攻击石头：补充属性攻击效果
  if (buff.type === 'elementAttack' && lines.length === 0) {
    const elementNames = { fire: '火属性攻击', water: '水属性攻击', wind: '风属性攻击', thunder: '雷属性攻击', electricity: '雷属性攻击', earth: '土属性攻击' }
    const label = elementNames[buff.element] || '属性攻击'
    lines.push(`${label}: +${buff.attackPercent || 20}%`)
  }
  return lines
}

/**
 * 处理BUFF图标加载错误
 * @param {Event} e
 */
const handleImageError = (e) => {
  e.target.src = '/pt/item_icon/default_item.png'
}

/**
 * 处理副本图片加载错误
 * @param {Event} e
 */
const handleDungeonImageError = (e) => {
  e.target.src = '/pt/map/fuben/duoluoshengyu.png'
}

// 监听面板可见性
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      hasInitializedPosition.value = false
      ensureDefaultPosition()
      startTickTimer()
    } else {
      stopDrag()
      stopTickTimer()
    }
  }
)

onMounted(() => {
  if (props.isVisible) {
    startTickTimer()
  }
})

onBeforeUnmount(() => {
  stopDrag()
  stopTickTimer()
})
</script>

<style scoped>
/* 面板基础 - 参考任务面板牛皮纸信封风格 */
.buff-timer-panel {
  position: fixed;
  width: 420px;
  max-height: 55vh;
  background: var(--theme-quest-bg);
  border-radius: 15px;
  box-shadow:
    0 0 25px rgba(0, 0, 0, 0.5),
    inset 0 0 50px rgba(139, 90, 43, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  color: var(--theme-text);
  z-index: 1000;
  box-sizing: border-box;
  opacity: 1;
  transform: translateY(0) scale(1);
  will-change: transform, opacity;
}

.buff-timer-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: repeating-linear-gradient(0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px);
  pointer-events: none;
  border-radius: 15px;
}

.buff-timer-panel::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px dashed var(--theme-border);
  border-radius: 10px;
  pointer-events: none;
}

/* 过渡动画 */
.buff-timer-panel-enter-active,
.buff-timer-panel-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.buff-timer-panel-enter-from,
.buff-timer-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.buff-timer-panel-enter-to,
.buff-timer-panel-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 头部 */
.panel-header {
  position: sticky;
  top: 0;
  padding: 15px 20px;
  border-bottom: 2px solid var(--theme-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--theme-quest-bg);
  border-radius: 15px 15px 0 0;
  z-index: 1;
  user-select: none;
  cursor: move;
  width: 100%;
  box-sizing: border-box;
}

.panel-title {
  font-size: 24px;
  color: var(--theme-accent);
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
  margin: 0;
  font-family: 'Georgia', serif;
  font-weight: bold;
}

.close-button {
  background: var(--theme-button-bg);
  border: 2px solid var(--theme-border);
  color: var(--theme-text);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: var(--theme-button-hover);
  border-color: var(--theme-border-strong);
  transform: rotate(90deg);
}

/* 标签页切换 - 牛皮纸风格 */
.panel-tabs {
  display: flex;
  gap: 10px;
  padding: 12px 20px 8px;
  border-bottom: 2px solid var(--theme-border);
  background: var(--theme-quest-bg);
  position: relative;
  z-index: 1;
}

.panel-tab {
  flex: 1;
  padding: 8px 15px;
  background: var(--theme-panel-bg);
  border: 2px solid var(--theme-border);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--theme-text);
  font-weight: bold;
  text-align: center;
  font-family: 'Georgia', serif;
}

.panel-tab:hover {
  background: var(--theme-surface-muted);
  border-color: var(--theme-border-strong);
}

.panel-tab.active {
  background: var(--theme-surface);
  border-color: var(--theme-border-strong);
  color: var(--theme-accent);
}

/* 内容区域 */
.panel-content {
  flex: 1;
  padding: 10px;
  margin: 10px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.panel-content::-webkit-scrollbar {
  width: 12px;
}

.panel-content::-webkit-scrollbar-track {
  background: var(--theme-surface-muted);
  border-radius: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--theme-surface-strong);
  border-radius: 6px;
  border: 2px solid var(--theme-border);
}

/* BUFF列表 */
.buff-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.buff-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--theme-panel-bg);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  transition: all 0.2s;
}

.buff-item:hover {
  background: var(--theme-surface-muted);
  border-color: var(--theme-border-strong);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.buff-item.buff-warning {
  border-color: rgba(231, 76, 60, 0.6);
  animation: buff-warning-pulse 1s ease-in-out infinite;
}

@keyframes buff-warning-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.buff-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(52, 152, 219, 0.15);
  object-fit: contain;
  flex-shrink: 0;
}

.buff-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.buff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.buff-description {
  font-size: 11px;
  color: var(--theme-muted, #999);
  line-height: 1.3;
  word-break: break-all;
}

.buff-effects {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.buff-effect-line {
  font-size: 11px;
  color: var(--theme-text);
  line-height: 1.3;
  opacity: 0.85;
}

.buff-name {
  font-size: 13px;
  font-weight: bold;
  color: var(--theme-accent);
  font-family: 'Georgia', serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.buff-time {
  font-size: 12px;
  color: var(--theme-text);
  font-weight: bold;
}

.buff-item.buff-warning .buff-time {
  color: #e74c3c;
}

/* 技能BUFF样式 */
.skill-buff-item {
  border-color: rgba(52, 152, 219, 0.5);
}

.skill-buff-item:hover {
  border-color: rgba(52, 152, 219, 0.8);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 0 10px rgba(52, 152, 219, 0.2);
}

.skill-buff-icon {
  background: rgba(52, 152, 219, 0.2);
  border-color: rgba(52, 152, 219, 0.4);
}

.skill-source-tag {
  font-size: 11px;
  color: #3498db;
  font-style: italic;
  opacity: 0.8;
}

/* BUFF移除按钮 */
.buff-remove-btn {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: 1px solid var(--theme-border);
  border-radius: 4px;
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  font-size: 16px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.buff-remove-btn:hover {
  background: #e74c3c;
  color: #fff;
  border-color: #c0392b;
  transform: scale(1.1);
}

.buff-remove-btn:active {
  transform: scale(0.95);
}

/* 副本列表 */
.dungeon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dungeon-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--theme-panel-bg);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  transition: all 0.2s;
}

.dungeon-item:hover {
  background: var(--theme-surface-muted);
  border-color: var(--theme-border-strong);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dungeon-item.dungeon-active {
  border-left: 4px solid #4caf50;
}

.dungeon-item.dungeon-cooldown {
  border-left: 4px solid #e74c3c;
  opacity: 0.85;
}

.dungeon-image {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid var(--theme-border);
  object-fit: cover;
  flex-shrink: 0;
  background: #000;
}

.dungeon-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.dungeon-name {
  font-size: 14px;
  font-weight: bold;
  color: #000;
  font-family: 'Georgia', serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dungeon-countdown {
  font-size: 12px;
  color: #000;
  font-weight: bold;
}

.dungeon-active-text {
  color: #4caf50;
}

/* 空状态 */
.empty-hint {
  color: var(--theme-text);
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-family: 'Georgia', serif;
  opacity: 0.6;
}

/* 移除BUFF二次确认弹窗（面板内覆盖层） */
.buff-confirm-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 15px;
}

.buff-confirm-dialog {
  width: 300px;
  background: var(--theme-quest-bg, #4a3728);
  border: 2px solid var(--theme-border-strong, #8b6f47);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.buff-confirm-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--theme-accent, #d4af37);
  font-family: 'Georgia', serif;
  text-align: center;
}

.buff-confirm-message {
  font-size: 14px;
  color: var(--theme-text, #f0e6d3);
  line-height: 1.5;
  text-align: center;
}

.buff-confirm-name {
  font-weight: bold;
  color: var(--theme-accent, #d4af37);
}

.buff-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.buff-confirm-cancel,
.buff-confirm-ok {
  flex: 1;
  padding: 8px 0;
  border: 2px solid var(--theme-border, #6b5234);
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Georgia', serif;
}

.buff-confirm-cancel {
  background: var(--theme-panel-bg, #3a2a1c);
  color: var(--theme-text, #f0e6d3);
}

.buff-confirm-cancel:hover {
  background: var(--theme-surface-muted, #5a4232);
  border-color: var(--theme-border-strong, #8b6f47);
}

.buff-confirm-ok {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.5);
}

.buff-confirm-ok:hover {
  background: #e74c3c;
  color: #fff;
  border-color: #c0392b;
}
</style>
