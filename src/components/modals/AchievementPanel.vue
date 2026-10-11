<!--
  AchievementPanel.vue - 成就面板组件
  提供成就分类浏览（一般/怪物/消耗品/登录/生活技艺/称号），支持拖拽移动和右下角自由拉伸
  按R键打开/关闭面板，面板居中显示
  数据来源：src/data/ACHIEVEMENT_INFO.js（由 API 更新器自动写入）
  成就进度：通过 useAchievementsStore 从 player.achievement 字段读取
  怪物成就：attackPower 为对该怪物的百分比增伤，按怪物等级从低到高排序
  消耗品成就：通过 itemId 字段直接匹配物品图标（AchievementService 预构建名称→ID索引）
  消耗品排序：按物品恢复值（recoveryValue）从低到高排序，恢复值相同则按 ID 升序
  @author FLYFF Team
  @created 2026-07-13
  @updated 2026-07-13 怪物成就增伤改为百分比显示，按怪物等级排序，增大图标
  @updated 2026-07-15 消耗品成就图标改用 itemId 直接匹配，移除 ITEM_INFO 名称遍历
  @updated 2026-07-15 消耗品成就按物品恢复值从低到高排序
-->
<template>
  <transition name="achievement-panel" appear>
    <div
      v-if="isVisible"
      ref="panelRef"
      class="achievement-panel"
      :style="panelStyle"
    >
      <!-- 面板头部（可拖拽） -->
      <div class="achievement-header" @mousedown="startDrag">
        <h2 class="achievement-title">成就</h2>
        <div class="achievement-count-badge">
          {{ completedCount }} / {{ totalCount }}
        </div>
        <button class="achievement-close-btn" @click="close">&times;</button>
      </div>

      <!-- 主体区域：左右布局 -->
      <div class="achievement-body">
        <!-- 左侧：功能分类导航 -->
        <div class="achievement-sidebar">
          <div
            v-for="cat in categories"
            :key="cat.key"
            class="sidebar-item"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >
            <span class="sidebar-icon">{{ cat.icon }}</span>
            <span class="sidebar-label">{{ cat.label }}</span>
            <span class="sidebar-count">{{ getCategoryCount(cat.key) }}</span>
          </div>
        </div>

        <!-- 右侧：分类内容 -->
        <div class="achievement-content">
          <!-- 称号视图：左侧称号列表 + 右侧徽章列表 -->
          <template v-if="activeCategory === 'title'">
            <div class="title-badge-layout">
              <!-- 左侧：称号列表 -->
              <div class="title-badge-column">
                <div class="column-header">称号</div>
                <div v-if="unlockedTitles.length === 0" class="column-empty">
                  <span>暂无已解锁称号</span>
                </div>
                <div v-else class="title-list">
                  <div
                    v-for="t in unlockedTitles"
                    :key="t.achievementId"
                    class="title-card"
                    :class="{ 'title-equipped': t.title === currentTitle }"
                  >
                    <div class="title-card-header">
                      <div class="title-card-name-area">
                        <img
                          v-if="t.badgeReward"
                          :src="`/pt/master_icon/${t.badgeReward}`"
                          :alt="t.achievementName + ' 徽章'"
                          class="title-badge-icon"
                          @error="onBadgeError"
                        >
                        <span class="title-name">{{ t.title }}</span>
                      </div>
                      <button
                        v-if="t.title !== currentTitle"
                        class="title-equip-btn"
                        @click="equipTitle(t.title)"
                      >
                        佩戴
                      </button>
                      <button
                        v-else
                        class="title-unequip-btn"
                        @click="equipTitle(null)"
                      >
                        取消佩戴
                      </button>
                    </div>
                    <p class="title-source">来源: {{ t.achievementName }}</p>
                  </div>
                </div>
              </div>

              <!-- 右侧：徽章列表 -->
              <div class="title-badge-column">
                <div class="column-header">徽章</div>
                <div v-if="unlockedBadges.length === 0" class="column-empty">
                  <span>暂无已解锁徽章</span>
                </div>
                <div v-else class="badge-grid">
                  <div
                    v-for="b in unlockedBadges"
                    :key="b.achievementId"
                    class="badge-card"
                    :class="{ 'badge-equipped': b.badgeReward === currentBadge }"
                  >
                    <img
                      :src="`/pt/master_icon/${b.badgeReward}`"
                      :alt="b.achievementName + ' 徽章'"
                      class="badge-card-icon"
                      @error="onBadgeError"
                    >
                    <span class="badge-card-name">{{ b.achievementName }}</span>
                    <button
                      v-if="b.badgeReward !== currentBadge"
                      class="badge-equip-btn"
                      @click="equipBadge(b.badgeReward)"
                    >
                      佩戴
                    </button>
                    <button
                      v-else
                      class="title-unequip-btn"
                      @click="equipBadge(null)"
                    >
                      取消佩戴
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 成就视图：显示成就列表 -->
          <template v-else>
            <!-- 空数据提示 -->
            <div v-if="currentAchievements.length === 0" class="content-empty">
              <span class="empty-icon">📋</span>
              <p class="empty-text">暂无成就数据</p>
              <p class="empty-hint">成就数据将在后续版本中获取</p>
            </div>

            <!-- 成就列表 -->
            <div v-else class="achievement-list">
              <div
                v-for="ach in currentAchievements"
                :key="ach.id"
                class="achievement-card"
                :class="{
                  'card-done': isAchievementComplete(ach),
                  'card-monster': activeCategory === 'monsters'
                }"
              >
                <!-- 成就图标 + 信息 -->
                <div class="card-main-row">
                  <!-- 图标区域 -->
                  <div class="card-icon-area">
                    <img
                      v-if="getAchievementIcon(ach) && !erroredIcons[ach.id]"
                      :src="getAchievementIcon(ach)"
                      :alt="ach.name"
                      class="card-icon"
                      @error="onIconError($event, ach.id)"
                    >
                    <span v-else class="card-icon-placeholder">{{ getCategoryIcon(ach.category) }}</span>
                  </div>

                  <!-- 文字信息 -->
                  <div class="card-info">
                    <div class="card-header">
                      <div class="card-name-area">
                        <span v-if="ach.accountWide" class="account-wide-tag" title="账号共享">账号</span>
                        <span class="card-name">{{ ach.name }}</span>
                        <span
                          v-if="ach.mainMonster && getMonsterLevel(ach.mainMonster) !== 9999"
                          class="card-monster-level"
                        >Lv.{{ getMonsterLevel(ach.mainMonster) }}</span>
                        <!-- 怪物分类：在名称、等级右侧显示最高等级称号 -->
                        <span
                          v-if="activeCategory === 'monsters' && getMaxLevelTitle(ach)"
                          class="card-monster-title"
                        >称号: {{ getMaxLevelTitle(ach) }}</span>
                      </div>
                      <span class="card-type-badge" :class="'type-' + ach.type">
                        {{ getTypeLabel(ach.type) }}
                      </span>
                    </div>
                    <p v-if="ach.description" class="card-description">{{ ach.description }}</p>
                  </div>
                </div>

                <!-- 当前进度等级 + 进度条 -->
                <div class="card-progress-area">
                  <div class="progress-level-info">
                    <span class="progress-level-label">Lv.{{ getCurrentLevelIndex(ach) + 1 }}</span>
                    <span v-if="getCurrentLevel(ach)?.name" class="progress-level-name">
                      {{ getCurrentLevel(ach).name }}
                    </span>
                    <span v-if="getCurrentLevel(ach)?.title" class="level-reward reward-title">
                      称号: {{ getCurrentLevel(ach).title }}
                    </span>
                    <span v-if="getCurrentLevel(ach)?.attackPower" class="level-reward reward-attack">
                      增伤 +{{ getCurrentLevel(ach).attackPower }}%
                    </span>
                    <!-- 大师进阶任务徽章奖励 -->
                    <span v-if="ach.badgeReward" class="level-reward reward-badge">
                      <img
                        :src="`/pt/master_icon/${ach.badgeReward}`"
                        :alt="ach.name + ' 徽章'"
                        class="badge-icon"
                        @error="onBadgeError"
                      >
                      <span class="badge-label">大师徽章</span>
                    </span>
                  </div>
                  <!-- 进度条 -->
                  <div class="progress-bar-wrapper">
                    <div class="progress-bar-track">
                      <div
                        class="progress-bar-fill"
                        :style="{ width: getProgressPercent(ach) + '%' }"
                      ></div>
                    </div>
                    <span class="progress-bar-text">
                      {{ formatNumber(ach.currentProgress) }} / {{ formatNumber(getCurrentLevel(ach)?.value || 0) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右下角拉伸手柄 -->
      <PanelResizeHandle @pointerdown="startResize" />
    </div>
  </transition>
</template>

<script setup>
/**
 * 成就面板组件
 *
 * 用途/业务意图：展示玩家成就进度，按分类（一般/怪物/消耗品/登录/生活技艺/称号）浏览
 * 成就分类从 useAchievementsStore 获取，进度数据从 gameStore.player.achievement 读取
 * 称号分类显示当前角色已解锁的称号（非所有称号）
 * 支持头部拖拽移动、右下角自由拉伸、主题颜色动态变更
 *
 * @module AchievementPanel
 */

import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import PanelResizeHandle from '@/components/common/PanelResizeHandle.vue'
import { useGameStore, useAchievementsStore } from '@/store'
import { MONSTER_INFO } from '@/data/MONSTER_INFO.js'

/**
 * 组件 Props
 */
const props = defineProps({
  /** 面板是否可见 */
  isVisible: {
    type: Boolean,
    default: false
  }
})

/**
 * 组件 Emits
 */
const emit = defineEmits(['close'])

// ==================== Store 实例 ====================

/** 游戏全局 Store */
const gameStore = useGameStore()
/** 成就 Store */
const achievementsStore = useAchievementsStore()

// ==================== 分类配置 ====================

/**
 * 成就分类列表（从 Store 获取，包含称号虚拟分类）
 */
const categories = achievementsStore.getCategories()

/** 当前选中的分类 */
const activeCategory = ref('general')

// ==================== 计算属性：数据查询 ====================

/**
 * 触发 version 依赖追踪，确保 computed 在成就进度更新后重新计算
 * @returns {number}
 */
const touchVersion = () => achievementsStore.version

/**
 * 各分类的成就数量统计
 * 称号分类显示已解锁数量
 * @returns {Record<string, number>}
 */
const categoryCounts = computed(() => {
  return achievementsStore.getCategoryCounts()
})

/**
 * 称号分类的数量（显示已解锁数量）
 * @returns {number}
 */
const unlockedTitleCount = computed(() => {
  return unlockedTitles.value.length
})

/**
 * 获取指定分类的数量徽标
 * 称号分类显示已解锁数量，其他分类显示总数量
 * @param {string} key - 分类 key
 * @returns {number}
 */
const getCategoryCount = (key) => {
  if (key === 'title') {
    return unlockedTitleCount.value
  }
  return categoryCounts.value[key] || 0
}

/**
 * 总成就数量
 */
const totalCount = computed(() => achievementsStore.getTotalCount())

/**
 * 已完成成就数量
 */
const completedCount = computed(() => {
  touchVersion()
  return achievementsStore.getCompletedCount(gameStore)
})

/**
 * 一般分类成就的关联性分组优先级
 * 大师进阶 → 等级 → 属性 → 在线时长 → 跳跃 → 孵蛋 → 情侣 → FWC → 其他
 * @type {string[]}
 */
const GENERAL_GROUP_ORDER = [
  'master', 'level', 'stat', 'playtime',
  'jump', 'hatchegg', 'couple', 'fwc', 'other'
]

/**
 * 根据成就数据推断关联性分组 key
 * @param {Object} ach - 成就对象
 * @returns {string} 分组 key
 */
const getGeneralGroupKey = (ach) => {
  // 大师进阶任务：拥有 badgeReward 字段（master1.png ~ master10.png）
  if (ach.badgeReward) return 'master'
  // 等级达成
  if (ach.type === 'level') return 'level'
  // 属性达成
  if (ach.type === 'stat') return 'stat'
  // 在线时长
  if (ach.type === 'playtime') return 'playtime'
  // 跳跃
  if (ach.type === 'jump') return 'jump'
  // 孵蛋
  if (ach.type === 'hatchegg') return 'hatchegg'
  // 情侣相关：type 包含 couple 或 name 包含相守/佳偶
  if (
    ach.type?.includes('couple') ||
    ach.name?.includes('相守') ||
    ach.name?.includes('佳偶') ||
    ach.name?.includes('情侣')
  ) return 'couple'
  // FWC 竞技：名称包含 FWC 或以年份开头
  if (
    ach.name?.includes('FWC') ||
    /^(2024|2025|2026)/.test(ach.name)
  ) return 'fwc'
  return 'other'
}

/**
 * 从 badgeReward 中提取序号，用于大师进阶组内排序
 * @param {string} badgeReward - 徽章文件名（如 master3.png）
 * @returns {number} 序号，无法提取返回 99
 */
const getBadgeNumber = (badgeReward) => {
  if (!badgeReward) return 99
  const match = String(badgeReward).match(/master(\d+)/i)
  return match ? parseInt(match[1], 10) : 99
}

/**
 * 当前分类的成就列表（含进度信息）
 * 怪物分类按怪物等级从低到高排序
 * 消耗品分类按物品恢复值从低到高排序
 * 一般分类按关联性分组连在一起显示
 */
const currentAchievements = computed(() => {
  touchVersion()
  const list = achievementsStore.getAchievementsByCategory(gameStore, activeCategory.value)
  // 怪物分类：按怪物等级从低到高排序
  if (activeCategory.value === 'monsters') {
    return [...list].sort((a, b) => {
      const levelA = getMonsterLevel(a.mainMonster)
      const levelB = getMonsterLevel(b.mainMonster)
      return levelA - levelB
    })
  }
  // 消耗品分类：按物品恢复值从低到高排序，恢复值相同则按 ID 升序
  if (activeCategory.value === 'consumables') {
    return [...list].sort((a, b) => {
      const valueA = Number(a.recoveryValue) || 0
      const valueB = Number(b.recoveryValue) || 0
      if (valueA !== valueB) return valueA - valueB
      return a.id - b.id
    })
  }
  // 一般分类：按关联性分组排序，组内按 ID 升序
  if (activeCategory.value === 'general') {
    return [...list].sort((a, b) => {
      const groupA = getGeneralGroupKey(a)
      const groupB = getGeneralGroupKey(b)
      const orderA = GENERAL_GROUP_ORDER.indexOf(groupA)
      const orderB = GENERAL_GROUP_ORDER.indexOf(groupB)
      if (orderA !== orderB) return orderA - orderB
      // 大师进阶组内：按 badge 序号排序
      if (groupA === 'master') {
        return getBadgeNumber(a.badgeReward) - getBadgeNumber(b.badgeReward)
      }
      // 其他组内：按 ID 升序
      return a.id - b.id
    })
  }
  return list
})

/**
 * 根据怪物 ID 获取怪物等级（用于排序）
 * @param {number|string} monsterId - 怪物 ID
 * @returns {number} 怪物等级，未找到返回 9999
 */
const getMonsterLevel = (monsterId) => {
  if (!monsterId) return 9999
  const mon = MONSTER_INFO[String(monsterId)] || MONSTER_INFO[monsterId]
  return Number(mon?.level) || 9999
}

/**
 * 已解锁的称号列表
 */
const unlockedTitles = computed(() => {
  touchVersion()
  return achievementsStore.getUnlockedTitles(gameStore)
})

/**
 * 当前装备的称号
 */
const currentTitle = computed(() => {
  touchVersion()
  return achievementsStore.getCurrentTitle(gameStore)
})

/**
 * 已解锁的徽章列表
 */
const unlockedBadges = computed(() => {
  touchVersion()
  return achievementsStore.getUnlockedBadges(gameStore)
})

/**
 * 当前装备的徽章
 */
const currentBadge = computed(() => {
  touchVersion()
  return achievementsStore.getCurrentBadge(gameStore)
})

// ==================== 工具函数 ====================

/**
 * 获取成就类型的中文标签
 * @param {string} type - 成就类型 key
 * @returns {string}
 */
const getTypeLabel = (type) => {
  return achievementsStore.getTypeLabel(type)
}

/**
 * 格式化数值，每 4 位添加逗号分隔
 * @param {number} value - 输入数值
 * @returns {string}
 */
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-'
  return Number(value).toLocaleString('en-US')
}

/**
 * 检查指定成就的某个等级是否已完成
 * @param {Object} ach - 成就对象（含 completedLevels）
 * @param {number} levelIndex - 等级索引
 * @returns {boolean}
 */
const isLevelCompleted = (ach, levelIndex) => {
  return Array.isArray(ach.completedLevels) && ach.completedLevels.includes(levelIndex)
}

/**
 * 获取成就的当前等级索引（第一个未完成的等级，全部完成则返回最后一个）
 * @param {Object} ach - 成就对象
 * @returns {number} 等级索引
 */
const getCurrentLevelIndex = (ach) => {
  if (!ach.levels || ach.levels.length === 0) return 0
  for (let i = 0; i < ach.levels.length; i++) {
    if (!isLevelCompleted(ach, i)) return i
  }
  return ach.levels.length - 1
}

/**
 * 获取成就的当前等级对象
 * @param {Object} ach - 成就对象
 * @returns {Object|undefined} 当前等级对象
 */
const getCurrentLevel = (ach) => {
  return ach.levels?.[getCurrentLevelIndex(ach)]
}

/**
 * 获取成就最高等级（最大等级）的称号名称
 * 用于在怪物分类中展示该成就最终奖励的称号
 * @param {Object} ach - 成就对象
 * @returns {string} 最高等级称号，无则返回空字符串
 */
const getMaxLevelTitle = (ach) => {
  if (!ach.levels || ach.levels.length === 0) return ''
  const maxLevel = ach.levels[ach.levels.length - 1]
  return maxLevel?.title || ''
}

/**
 * 获取成就进度百分比
 * @param {Object} ach - 成就对象
 * @returns {number} 0-100
 */
const getProgressPercent = (ach) => {
  const level = getCurrentLevel(ach)
  if (!level || !level.value) return 0
  const progress = Number(ach.currentProgress) || 0
  // 如果当前进度已超过该等级目标，说明该等级已完成，显示100%
  if (isLevelCompleted(ach, getCurrentLevelIndex(ach))) return 100
  return Math.min(100, Math.round((progress / level.value) * 100))
}

/**
 * 检查成就是否全部完成
 * @param {Object} ach - 成就对象
 * @returns {boolean}
 */
const isAchievementComplete = (ach) => {
  if (!ach.levels || ach.levels.length === 0) return false
  for (let i = 0; i < ach.levels.length; i++) {
    if (!isLevelCompleted(ach, i)) return false
  }
  return true
}

  /**
   * 获取成就的图标路径
   * 怪物类成就使用怪物图标，大师进阶任务使用徽章图标，消耗品类通过 itemId 匹配物品图标
   * @param {Object} ach - 成就对象
   * @returns {string|null} 图标路径，无图标返回 null
   */
  const getAchievementIcon = (ach) => {
    // 大师进阶任务：使用 badgeReward 徽章图标（master1.png ~ master10.png）
    if (ach.badgeReward) {
      return `/pt/master_icon/${ach.badgeReward}`
    }

    // 怪物类成就：优先使用 monsterIconId（通过英文名称匹配的基础怪物 ID，图标存在），
    // 回退到 mainMonster（可能指向 Small 变体或缺失）
    if (ach.monsterIconId || ach.mainMonster) {
      return `/pt/monster_icon/${ach.monsterIconId || ach.mainMonster}.png`
    }

    // 消耗品类成就：通过 itemId 直接匹配物品图标（itemId 在 AchievementService 中预构建）
    if (ach.category === 'consumables' && ach.itemId) {
      return `/pt/item_icon/${ach.itemId}.png`
    }

    // 生活技艺类：使用对应技能图标（如果有对应物品的话）
    // 其他类型暂无图标
    return null
  }

/**
 * 获取分类的 emoji 图标（用作无图片时的占位）
 * @param {string} category - 分类 key
 * @returns {string}
 */
const getCategoryIcon = (category) => {
  const cat = categories.find((c) => c.key === category)
  return cat?.icon || '📋'
}

/**
 * 图标加载失败的成就 ID 集合（响应式）
 * 当图片 404 或加载失败时记录，使模板切换为占位符显示
 * @type {import('vue').Ref<Record<number, boolean>>}
 */
const erroredIcons = ref({})

/**
 * 图片加载失败时记录成就 ID，触发模板重渲染以显示占位符
 * @param {Event} event - 错误事件
 * @param {number} achId - 成就 ID
 */
const onIconError = (event, achId) => {
  event.target.style.display = 'none'
  erroredIcons.value[achId] = true
}

/**
 * 徽章图片加载失败时隐藏整个徽章奖励标签
 * @param {Event} event - 错误事件
 */
const onBadgeError = (event) => {
  const badge = event.target.closest('.reward-badge')
  if (badge) badge.style.display = 'none'
  else event.target.style.display = 'none'
}

/**
 * 装备称号
 * @param {string} title - 称号名称
 */
const equipTitle = (title) => {
  achievementsStore.equipTitle(gameStore, title)
}

/**
 * 装备/取消徽章
 * @param {string|null} badgeReward - 徽章文件名，null 表示取消
 */
const equipBadge = (badgeReward) => {
  achievementsStore.equipBadge(gameStore, badgeReward)
}

// ==================== 面板拖拽 ====================

/** 面板根元素引用 */
const panelRef = ref(null)

/** 面板位置（绝对定位坐标） */
const position = ref({ x: 0, y: 0 })

/** 是否使用居中模式（首次打开时居中） */
const positionMode = ref('center')

/** 是否正在拖拽 */
const isDragging = ref(false)

/** 拖拽偏移量 */
const dragOffset = ref({ x: 0, y: 0 })

/** 面板尺寸缓存（用于拖拽边界限制） */
const panelSize = ref({ width: 0, height: 0 })

/** 是否已初始化位置 */
const hasInitializedPosition = ref(false)

// ==================== 面板拉伸 ====================

/** 默认宽度 */
const DEFAULT_WIDTH = 700

/** 默认高度 */
const DEFAULT_HEIGHT = 500

/** 最小宽度 */
const MIN_WIDTH = 500

/** 最小高度 */
const MIN_HEIGHT = 350

/** 面板宽度 */
const panelWidth = ref(DEFAULT_WIDTH)

/** 面板高度 */
const panelHeight = ref(DEFAULT_HEIGHT)

/** 是否正在拉伸 */
const isResizing = ref(false)

/** 拉伸起始 X 坐标 */
const resizeStartX = ref(0)

/** 拉伸起始 Y 坐标 */
const resizeStartY = ref(0)

/** 拉伸起始宽度 */
const resizeStartWidth = ref(0)

/** 拉伸起始高度 */
const resizeStartHeight = ref(0)

// ==================== 计算属性：面板样式 ====================

/**
 * 计算面板样式
 * 居中模式使用 transform 居中；绝对定位模式使用 top/left
 * @returns {Record<string, string>}
 */
const panelStyle = computed(() => {
  const style = {
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`
  }

  if (positionMode.value === 'center') {
    style.left = '50%'
    style.top = '50%'
    style.translate = '-50% -50%'
  } else {
    style.left = `${position.value.x}px`
    style.top = `${position.value.y}px`
    style.translate = '0 0'
  }

  return style
})

// ==================== 拖拽逻辑 ====================

/**
 * 刷新面板尺寸缓存
 * @returns {void}
 */
const updatePanelSize = () => {
  const el = panelRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelSize.value = { width: rect.width, height: rect.height }
}

/**
 * 将面板定位到屏幕中央（仅首次打开时执行），并缓存面板尺寸
 * @returns {Promise<void>}
 */
const ensureDefaultPosition = async () => {
  if (hasInitializedPosition.value) return
  await nextTick()
  positionMode.value = 'center'
  hasInitializedPosition.value = true
}

/**
 * 将数值限制在范围内
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value))
}

/**
 * 面板拖拽开始（仅允许从头部拖拽，不影响按钮点击）
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
const startDrag = (event) => {
  if (!event || event.button !== 0) return

  // 排除按钮等交互元素的拖拽
  if (event.target.closest('button, input, select, textarea')) return

  // 从居中模式切换到绝对定位
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
 * 面板拖拽移动处理
 * @param {MouseEvent} event - 鼠标事件
 * @returns {void}
 */
const handleDragMove = (event) => {
  if (!isDragging.value) return

  const width = panelSize.value.width || DEFAULT_WIDTH
  const height = panelSize.value.height || DEFAULT_HEIGHT

  const maxX = Math.max(0, window.innerWidth - width)
  const maxY = Math.max(0, window.innerHeight - height)

  position.value = {
    x: clamp(event.clientX - dragOffset.value.x, 0, maxX),
    y: clamp(event.clientY - dragOffset.value.y, 0, maxY)
  }
}

/**
 * 面板拖拽结束处理
 * @returns {void}
 */
const stopDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mouseleave', stopDrag)
}

// ==================== 拉伸逻辑 ====================

/**
 * 面板拉伸开始
 * @param {PointerEvent} event - 指针事件
 * @returns {void}
 */
const startResize = (event) => {
  event.preventDefault()
  event.stopPropagation()

  // 从居中模式切换到绝对定位
  if (positionMode.value === 'center' && panelRef.value) {
    const rect = panelRef.value.getBoundingClientRect()
    position.value = { x: rect.left, y: rect.top }
    positionMode.value = 'absolute'
  }

  isResizing.value = true
  resizeStartX.value = event.clientX
  resizeStartY.value = event.clientY
  resizeStartWidth.value = panelWidth.value
  resizeStartHeight.value = panelHeight.value

  document.addEventListener('pointermove', handleResize)
  document.addEventListener('pointerup', stopResize)
}

/**
 * 面板拉伸移动处理
 * @param {PointerEvent} event - 指针事件
 * @returns {void}
 */
const handleResize = (event) => {
  if (!isResizing.value) return

  const deltaX = event.clientX - resizeStartX.value
  const deltaY = event.clientY - resizeStartY.value

  let newWidth = resizeStartWidth.value + deltaX
  let newHeight = resizeStartHeight.value + deltaY

  // 限制最小尺寸
  newWidth = Math.max(MIN_WIDTH, newWidth)
  newHeight = Math.max(MIN_HEIGHT, newHeight)

  // 限制最大尺寸不超过视口 90%
  const maxWidth = window.innerWidth * 0.9
  const maxHeight = window.innerHeight * 0.9
  newWidth = Math.min(maxWidth, newWidth)
  newHeight = Math.min(maxHeight, newHeight)

  panelWidth.value = Math.round(newWidth)
  panelHeight.value = Math.round(newHeight)
}

/**
 * 面板拉伸结束处理
 * @returns {void}
 */
const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('pointermove', handleResize)
  document.removeEventListener('pointerup', stopResize)
}

// ==================== 面板关闭 ====================

/**
 * 关闭面板
 * @returns {void}
 */
const close = () => {
  emit('close')
}

// ==================== 生命周期监听 ====================

/**
 * 监听面板可见性变化
 * 打开时重置位置为居中，关闭时清理拖拽状态
 */
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      hasInitializedPosition.value = false
      // 重置尺寸为默认值
      panelWidth.value = DEFAULT_WIDTH
      panelHeight.value = DEFAULT_HEIGHT
      ensureDefaultPosition()
      return
    }
    stopDrag()
    stopResize()
  }
)

/** 组件卸载时清理事件监听 */
onUnmounted(() => {
  stopDrag()
  stopResize()
})
</script>

<style scoped>
/* ==================== 面板容器 ==================== */
.achievement-panel {
  position: fixed;
  background: var(--theme-modal-bg, rgba(0, 0, 0, 0.85));
  border: 2px solid var(--theme-border, #8b7355);
  border-radius: 12px;
  box-shadow:
    0 0 25px rgba(0, 0, 0, 0.5),
    inset 0 0 50px rgba(139, 90, 43, 0.15);
  display: flex;
  flex-direction: column;
  color: var(--theme-text, #ffffff);
  z-index: 1000;
  box-sizing: border-box;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

/* ==================== 进出场动画 ==================== */
.achievement-panel-enter-active,
.achievement-panel-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.achievement-panel-enter-from,
.achievement-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

/* ==================== 面板头部 ==================== */
.achievement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--theme-header-bg, rgba(0, 0, 0, 0.6));
  border-bottom: 2px solid var(--theme-border, #8b7355);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
  gap: 12px;
}

.achievement-title {
  margin: 0;
  font-size: 22px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  font-family: 'Georgia', serif;
  flex-shrink: 0;
}

.achievement-count-badge {
  flex: 1;
  text-align: center;
  font-size: 14px;
  color: var(--theme-muted, #aaaaaa);
  background: var(--theme-surface, rgba(255, 255, 255, 0.05));
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-border, #8b7355);
}

.achievement-close-btn {
  background: var(--theme-button-bg, rgba(0, 0, 0, 0.7));
  border: 2px solid var(--theme-border, #8b7355);
  color: var(--theme-text, #ffffff);
  font-size: 22px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  transition: all 0.3s ease;
  padding: 0;
  flex-shrink: 0;
}

.achievement-close-btn:hover {
  background: var(--theme-button-hover, #3a1a1a);
  border-color: var(--theme-border-strong, #aa8a65);
  transform: rotate(90deg);
}

/* ==================== 主体布局 ==================== */
.achievement-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ==================== 左侧导航栏 ==================== */
.achievement-sidebar {
  flex-shrink: 0;
  width: 160px;
  background: var(--theme-surface-muted, rgba(0, 0, 0, 0.3));
  border-right: 1px solid var(--theme-border, #8b7355);
  padding: 10px 0;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: var(--theme-text, #ffffff);
  border-left: 3px solid transparent;
}

.sidebar-item:hover {
  background: var(--theme-surface, rgba(255, 255, 255, 0.05));
  border-left-color: var(--theme-border-strong, #aa8a65);
}

.sidebar-item.active {
  background: var(--theme-surface, rgba(255, 255, 255, 0.08));
  border-left-color: var(--theme-accent, #ffd700);
}

.sidebar-icon {
  font-size: 18px;
  line-height: 1;
}

.sidebar-label {
  font-size: 14px;
  font-weight: bold;
  font-family: 'Georgia', serif;
  flex: 1;
}

.sidebar-count {
  font-size: 12px;
  color: var(--theme-muted, #aaaaaa);
  background: var(--theme-surface, rgba(255, 255, 255, 0.05));
  padding: 2px 6px;
  border-radius: 6px;
  min-width: 24px;
  text-align: center;
}

/* ==================== 右侧内容区 ==================== */
.achievement-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-width: 0;
}

/* 空数据提示 */
.content-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--theme-muted, #aaaaaa);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.4;
}

.empty-text {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: var(--theme-text, #ffffff);
  opacity: 0.6;
}

.empty-hint {
  font-size: 13px;
  margin: 0;
  color: var(--theme-muted, #aaaaaa);
  opacity: 0.5;
}

/* ==================== 成就卡片 ==================== */
.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-card {
  background: var(--theme-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--theme-border, #8b7355);
  border-radius: 8px;
  padding: 10px 14px;
  transition: border-color 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-card:hover {
  border-color: var(--theme-border-strong, #aa8a65);
}

/* 全部完成的成就高亮 */
.card-done {
  border-color: rgba(102, 204, 68, 0.4);
  background: rgba(102, 204, 68, 0.04);
}

/* 卡片主体行：图标 + 文字信息 */
.card-main-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* 图标区域 */
.card-icon-area {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--theme-border, #8b7355);
  overflow: hidden;
}

.card-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-icon-placeholder {
  font-size: 28px;
  line-height: 1;
}

/* 文字信息区域 */
.card-info {
  flex: 1;
  min-width: 0;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-name-area {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 15px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-wide-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(100, 200, 255, 0.15);
  color: #6cc8ff;
  border: 1px solid rgba(100, 200, 255, 0.3);
  white-space: nowrap;
}

.card-type-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
  background: var(--theme-surface-muted, rgba(0, 0, 0, 0.3));
  color: var(--theme-muted, #aaaaaa);
  border: 1px solid var(--theme-border, #8b7355);
}

/* 怪物等级标签 */
.card-monster-level {
  font-size: 11px;
  font-weight: bold;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(102, 204, 68, 0.15);
  color: #66cc44;
  border: 1px solid rgba(102, 204, 68, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

/* 成就描述 */
.card-description {
  font-size: 12px;
  color: var(--theme-muted, #aaaaaa);
  margin: 4px 0 0 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 进度条区域 ==================== */
.card-progress-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 等级信息行 */
.progress-level-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-level-label {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
}

/* 当前等级名称 */
.progress-level-name {
  font-size: 12px;
  color: var(--theme-text, #ffffff);
  font-weight: bold;
}

/* 进度条容器 */
.progress-bar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 20px;
}

/* 进度条轨道 */
.progress-bar-track {
  flex: 1;
  height: 14px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid rgba(139, 115, 85, 0.4);
}

/* 进度条填充 */
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.6), rgba(255, 215, 0, 0.9));
  border-radius: 7px;
  transition: width 0.4s ease;
}

/* 已完成成就的进度条为绿色 */
.card-done .progress-bar-fill {
  background: linear-gradient(90deg, rgba(102, 204, 68, 0.6), rgba(102, 204, 68, 0.9));
}

/* 怪物分类的进度条为绿色 */
.card-monster .progress-bar-fill {
  background: linear-gradient(90deg, rgba(102, 204, 68, 0.6), rgba(102, 204, 68, 0.9));
}

/* 进度条文字（居中显示在进度条上） */
.progress-bar-text {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  line-height: 20px;
}

/* 奖励标签 */
.level-reward {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  white-space: nowrap;
}

/* 大师徽章奖励 */
.reward-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(100, 150, 255, 0.15);
  border: 1px solid rgba(100, 150, 255, 0.3);
}

.badge-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  vertical-align: middle;
}

.badge-label {
  font-size: 10px;
  color: #6496ff;
  white-space: nowrap;
}

/* 怪物最高等级称号标签（显示在名称、等级右侧） */
.card-monster-title {
  font-size: 11px;
  font-weight: bold;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(102, 204, 68, 0.15);
  color: #66cc44;
  border: 1px solid rgba(102, 204, 68, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

.reward-attack {
  background: rgba(255, 100, 100, 0.15);
  color: #ff6464;
  border: 1px solid rgba(255, 100, 100, 0.3);
}

.reward-title {
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

/* ==================== 称号+徽章双列布局 ==================== */
.title-badge-layout {
  display: flex;
  gap: 12px;
  height: 100%;
}

.title-badge-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.column-header {
  font-size: 15px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  text-align: center;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--theme-border, #8b7355);
  flex-shrink: 0;
}

.column-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--theme-muted, #aaaaaa);
  font-size: 13px;
  opacity: 0.6;
}

.title-badge-column .title-list {
  overflow-y: auto;
}

/* 徽章网格 */
.badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-y: auto;
  align-content: flex-start;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  width: 80px;
  background: var(--theme-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--theme-border, #8b7355);
  border-radius: 8px;
  transition: border-color 0.25s ease;
}

.badge-card:hover {
  border-color: var(--theme-border-strong, #aa8a65);
}

.badge-equipped {
  border-color: var(--theme-accent, #ffd700);
  background: rgba(255, 215, 0, 0.05);
}

.badge-card-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.badge-card-name {
  font-size: 10px;
  color: var(--theme-text, #ffffff);
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}

.badge-equip-btn {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(100, 150, 255, 0.15);
  color: #6496ff;
  border: 1px solid rgba(100, 150, 255, 0.3);
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.badge-equip-btn:hover {
  background: rgba(100, 150, 255, 0.25);
  border-color: rgba(100, 150, 255, 0.5);
}

/* ==================== 称号卡片 ==================== */
.title-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.title-card {
  background: var(--theme-surface, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--theme-border, #8b7355);
  border-radius: 8px;
  padding: 12px 16px;
  transition: border-color 0.25s ease;
}

.title-card:hover {
  border-color: var(--theme-border-strong, #aa8a65);
}

/* 已装备称号高亮 */
.title-equipped {
  border-color: var(--theme-accent, #ffd700);
  background: rgba(255, 215, 0, 0.05);
}

/* 取消佩戴按钮 */
.title-unequip-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  background: rgba(255, 100, 100, 0.15);
  color: #ff6464;
  border: 1px solid rgba(255, 100, 100, 0.3);
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.title-unequip-btn:hover {
  background: rgba(255, 100, 100, 0.25);
  border-color: rgba(255, 100, 100, 0.5);
}

.title-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

/* 称号名称区域：徽章图标 + 称号名 */
.title-card-name-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 称号卡片中的徽章图标 */
.title-badge-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.title-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--theme-accent, #ffd700);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.title-equip-btn {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 4px;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
  cursor: pointer;
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.title-equip-btn:hover {
  background: rgba(255, 215, 0, 0.25);
  border-color: rgba(255, 215, 0, 0.5);
}

.title-equipped-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
  flex-shrink: 0;
}

.title-source {
  font-size: 13px;
  color: var(--theme-muted, #aaaaaa);
  margin: 0;
}

.title-description {
  font-size: 12px;
  color: var(--theme-muted, #aaaaaa);
  margin: 4px 0 0 0;
  opacity: 0.7;
}

/* ==================== 滚动条样式 ==================== */
.achievement-sidebar::-webkit-scrollbar,
.achievement-content::-webkit-scrollbar {
  width: 8px;
}

.achievement-sidebar::-webkit-scrollbar-track,
.achievement-content::-webkit-scrollbar-track {
  background: var(--theme-surface-muted, rgba(0, 0, 0, 0.2));
  border-radius: 4px;
}

.achievement-sidebar::-webkit-scrollbar-thumb,
.achievement-content::-webkit-scrollbar-thumb {
  background: var(--theme-border, #8b7355);
  border-radius: 4px;
}

.achievement-sidebar::-webkit-scrollbar-thumb:hover,
.achievement-content::-webkit-scrollbar-thumb:hover {
  background: var(--theme-border-strong, #aa8a65);
}
</style>
