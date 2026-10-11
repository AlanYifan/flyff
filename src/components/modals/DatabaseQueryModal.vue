<template>
  <div v-if="show" class="db-query-modal-overlay">
    <div
      ref="modalRef"
      v-drag="{ handle: '.db-query-header' }"
      v-resize="resizeConfig"
      class="db-query-panel"
      :style="panelStyle"
    >
      <!-- 标题区域 -->
      <div class="db-query-header">
        <div class="header-title">
          <img src="/pt/skill_icon/farsight.png" alt="查询" class="header-icon" @error="handleIconError" />
          <span class="title-text">数据库查询</span>
        </div>
        <button class="btn-close" title="关闭" @click="closeModal">×</button>
      </div>

      <!-- 搜索区域 -->
      <div class="db-query-search">
        <div class="search-input-wrapper">
          <select v-model="searchType" class="search-type-select">
            <option value="item">物品</option>
            <option value="monster">怪物</option>
          </select>
          <!-- 等级范围输入框 -->
          <div class="level-range-wrapper">
            <span class="level-range-label">等级</span>
            <input
              v-model.number="levelMin"
              type="number"
              class="level-range-input"
              placeholder="最小"
              min="0"
              max="200"
              @keyup.enter="handleSearch"
            />
            <span class="level-range-separator">-</span>
            <input
              v-model.number="levelMax"
              type="number"
              class="level-range-input"
              placeholder="最大"
              min="0"
              max="200"
              @keyup.enter="handleSearch"
            />
          </div>
          <!-- 品级下拉选择（仅物品搜索时显示） -->
          <select v-show="searchType === 'item'" v-model="selectedRarity" class="filter-select" @change="handleSearch">
            <option value="">全部品级</option>
            <option value="common">普通</option>
            <option value="uncommon">罕见</option>
            <option value="rare">稀有</option>
            <option value="veryrare">传说</option>
            <option value="unique">史诗</option>
            <option value="ultimate">终极</option>
            <option value="mythic">神话</option>
          </select>
          <!-- 部位下拉选择（仅物品搜索时显示） -->
          <select v-show="searchType === 'item'" v-model="selectedSubcategory" class="filter-select" @change="handleSearch">
            <option value="">全部部位</option>
            <option value="sword">剑</option>
            <option value="axe">斧</option>
            <option value="staff">法杖</option>
            <option value="stick">魔棒</option>
            <option value="wand">魔杖</option>
            <option value="knuckle">拳套</option>
            <option value="bow">弓</option>
            <option value="yoyo">飞轮</option>
            <option value="shield">盾牌</option>
            <option value="helmet">帽子</option>
            <option value="suit">衣服</option>
            <option value="gauntlet">手套</option>
            <option value="boots">鞋子</option>
          </select>
          <!-- 职业筛选下拉选择（仅物品搜索时显示） -->
          <select v-show="searchType === 'item'" v-model="selectedClass" class="filter-select" @change="handleSearch">
            <option value="">全部职业</option>
            <option value="warrior">战士</option>
            <option value="archer">弓箭手</option>
            <option value="priest">圣职者</option>
            <option value="mage">魔导士</option>
            <option value="knight">骑士</option>
            <option value="blade_warrior">刀锋战士</option>
            <option value="ranger">游侠</option>
            <option value="assassin">暗杀者</option>
            <option value="guardian">守护使者</option>
            <option value="technician">暴力技师</option>
            <option value="element_mage">元素使者</option>
            <option value="spirit_mage">精神使者</option>
          </select>
          <!-- 怪物rank段位下拉选择（仅怪物搜索时显示） -->
          <select v-show="searchType === 'monster'" v-model="selectedRank" class="filter-select" @change="handleSearch">
            <option value="">全部段位</option>
            <option value="default">普通</option>
            <option value="captain">队长</option>
            <option value="giant">巨型</option>
            <option value="violet">堕落</option>
            <option value="boss">BOSS</option>
            <option value="super">超级</option>
            <option value="worldboss">世界BOSS</option>
            <option value="material">材料</option>
          </select>
          <!-- 副本怪物下拉选择（仅怪物搜索时显示） -->
          <select v-show="searchType === 'monster'" v-model="selectedDungeon" class="filter-select" @change="handleSearch">
            <option value="">全部副本</option>
            <option v-for="dungeon in dungeonOptions" :key="dungeon.id" :value="dungeon.id">
              {{ dungeon.name }}
            </option>
          </select>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            :placeholder="searchType === 'item' ? '输入物品ID、名称或关键词...' : '输入怪物ID、名称或关键词...'"
            @keyup.enter="handleSearch"
          />
          <button class="btn-search" :disabled="isSearching" @click="handleSearch">
            <span v-if="isSearching">搜索中...</span>
            <span v-else>查询</span>
          </button>
        </div>
        <div class="search-hint">
          提示：支持ID精确匹配或名称模糊搜索，可使用等级范围筛选
        </div>
      </div>

      <!-- 结果区域 -->
      <div class="db-query-results">
        <div v-if="searchResults.length === 0 && !isSearching && hasSearched" class="no-results">
          <img src="/pt/skill_icon/default_skill.png" alt="无结果" class="no-result-icon" @error="handleIconError" />
          <p>未找到匹配的物品</p>
        </div>
        <div v-else-if="searchResults.length === 0 && !hasSearched" class="search-placeholder">
          <img src="/pt/skill_icon/concentration.png" alt="搜索" class="placeholder-icon" @error="handleIconError" />
          <p>输入关键词开始搜索</p>
        </div>
        <div v-else class="results-container">
          <div class="results-header">
            <span class="result-count">找到 {{ searchResults.length }} 个结果</span>
            <span class="result-info">显示前 {{ displayedResults.length }} 个</span>
          </div>
          <div class="results-list" ref="resultsListRef" @scroll="handleScroll">
            <div
              v-for="item in displayedResults"
              :key="`${item._dataType}-${item.id}`"
              class="result-item"
              :class="`type-${item._dataType}`"
              :style="getResultItemStyle(item)"
              @click="showItemDetail(item)"
              @mouseenter="showItemTooltip($event, item)"
              @mouseleave="hideItemTooltip($event, item)"
            >
              <div class="item-icon-wrapper" :class="{ 'monster-icon-wrapper': item._dataType === 'monster' }">
                <img
                    :src="getResultIcon(item)"
                    :alt="getResultName(item)"
                    class="item-icon"
                    :class="{ 'monster-icon': item._dataType === 'monster' }"
                    @error="handleImageError($event, item)"
                />
              </div>
              <div class="item-info">
                <div class="item-name" :style="getResultNameStyle(item)">{{ getResultName(item) }}</div>
                <div class="item-meta">
                  <span class="item-id">ID: {{ item.id }}</span>
                  <span class="item-type" :class="`type-${item._dataType}`">{{ item._dataType === 'monster' ? '怪物' : getCategoryText(item.category) }}</span>
                  <span v-if="item.level" class="item-level">Lv.{{ item.level }}</span>
                  <span v-if="item._dataType === 'monster' && item.rank" class="monster-rank">{{ getRankText(item.rank) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="searchResults.length > displayedResults.length" class="load-more">
            <button class="btn-load-more" @click="loadMore">加载更多</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file DatabaseQueryModal.vue
 * @description 数据库查询功能面板组件，支持物品ID和名称搜索，RPG风格可拉伸设计
 * @author FLYFF Team
 * @created 2026-02-24
 */
import { ref, computed, watch } from 'vue'
import { ITEM_INFO } from '@/data/ITEM_INFO'
import { MONSTER_INFO } from '@/data/MONSTER_INFO'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { useItemsStore } from '@/store/items'
import { useMonstersStore } from '@/store/monsters'
import { dungeonData } from '@/composables/useMap'
import { classMapping, classKeyToNameMap } from '@/utils/itemHelpers'
import { showItemDropMonsters, showMonsterDropItems } from '@/composables/useDropQuery'

// Props 定义
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

// Emits 定义
const emit = defineEmits(['close'])

// Store
const itemsStore = useItemsStore()
const monstersStore = useMonstersStore()

// 响应式数据
const searchKeyword = ref('')
const searchType = ref('item') // 默认搜索物品
  const levelMin = ref(null) // 等级范围最小值
  const levelMax = ref(null) // 等级范围最大值
const selectedRarity = ref('') // 选中的品级
const selectedSubcategory = ref('') // 选中的部位
const selectedClass = ref('') // 选中的职业
const selectedRank = ref('') // 选中的怪物rank
const selectedDungeon = ref('') // 选中的副本
const searchResults = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)
const modalRef = ref(null)
const displayLimit = ref(10)
const resultsListRef = ref(null)

// 品质排序顺序（从普通到终极）
const RARITY_ORDER = {
  common: 1,
  uncommon: 2,
  rare: 3,
  veryrare: 4,
  unique: 5,
  ultimate: 6,
  mythic: 7
}

// 怪物等级排序顺序
const RANK_ORDER = {
  default: 1,
  captain: 2,
  giant: 3,
  violet: 4,
  boss: 5,
  super: 6,
  worldboss: 7,
  material: 8
}

// 副本选项列表（从dungeonData中提取）
const dungeonOptions = computed(() => {
  const options = []
  // 遍历所有大陆的副本
  for (const continent in dungeonData) {
    const dungeons = dungeonData[continent]
    if (Array.isArray(dungeons)) {
      dungeons.forEach(dungeon => {
        options.push({
          // 使用“大陆名称_副本id”作为唯一标识
          id: `${continent}_${dungeon.id}`,
          name: dungeon.name,
          continent,
          dungeonId: dungeon.id
        })
      })
    }
  }
  return options
})

// 职业名称到class数字ID的反向映射
const classNameToClassIds = computed(() => {
  const map = {}
  for (const [classId, className] of Object.entries(classMapping)) {
    if (!map[className]) {
      map[className] = []
    }
    map[className].push(Number(classId))
  }
  return map
})

// 面板尺寸相关
const panelWidth = ref(600)
const panelHeight = ref(500)
const minPanelWidth = 400
const minPanelHeight = 350

// 计算面板样式
const panelStyle = computed(() => ({
  width: `${panelWidth.value}px`,
  height: `${panelHeight.value}px`
}))

// 拉伸配置
const resizeConfig = {
  minWidth: minPanelWidth,
  minHeight: minPanelHeight,
  maxWidth: 1200,
  maxHeight: 800,
  onResize: (width, height) => {
    panelWidth.value = width
    panelHeight.value = height
  }
}

// 显示的结果列表（分页）
const displayedResults = computed(() => {
  return searchResults.value.slice(0, displayLimit.value)
})

// 是否还有更多数据
const hasMore = computed(() => {
  return displayLimit.value < searchResults.value.length
})

/**
 * 获取指定副本的怪物ID列表
 * @param {string} uniqueId - 副本唯一标识（格式：大陆_副本id）
 * @returns {Set<number>} 怪物ID集合
 */
function getDungeonMonsterIds (uniqueId) {
  const monsterIds = new Set()
  // 解析唯一标识
  const [continent, dungeonIdStr] = uniqueId.split('_')
  const dungeonId = Number(dungeonIdStr)
  
  // 获取指定大陆的副本列表
  const dungeons = dungeonData[continent]
  if (Array.isArray(dungeons)) {
    const dungeon = dungeons.find(d => d.id === dungeonId)
    if (dungeon) {
      // 收集所有难度下的怪物ID
      if (dungeon.difficultyMonsters) {
        for (const difficulty in dungeon.difficultyMonsters) {
          dungeon.difficultyMonsters[difficulty].forEach(m => {
            monsterIds.add(m.id)
          })
        }
      }
      // 也收集默认monsters
      if (dungeon.monsters) {
        dungeon.monsters.forEach(m => {
          monsterIds.add(m.id)
        })
      }
    }
  }
  return monsterIds
}

/**
 * 执行搜索
 */
async function handleSearch () {
  const keyword = searchKeyword.value.trim()
  // 检查是否有任何筛选条件
  const hasFilters = keyword || levelMin.value !== null || levelMax.value !== null ||
    selectedRarity.value || selectedSubcategory.value || selectedClass.value || selectedRank.value || selectedDungeon.value
  if (!hasFilters) {
    searchResults.value = []
    hasSearched.value = false
    return
  }

  isSearching.value = true
  hasSearched.value = true

  // 如果选择了副本，预先获取该副本的怪物ID列表
  let dungeonMonsterIds = null
  if (selectedDungeon.value) {
    dungeonMonsterIds = getDungeonMonsterIds(selectedDungeon.value)
  }

  // 如果选择了职业，预先获取该职业对应的class数字ID列表
  let classIds = null
  if (selectedClass.value) {
    const className = classKeyToNameMap[selectedClass.value]
    classIds = classNameToClassIds.value[className] || []
  }

  // 使用 setTimeout 模拟异步搜索，避免阻塞UI
  setTimeout(() => {
    const results = []
    const keywordLower = keyword.toLowerCase()
    const currentType = searchType.value

    // 根据选择的类型搜索
    if (currentType === 'item') {
      // 只搜索物品
      try {
        const itemKeys = Object.keys(ITEM_INFO)
        for (let i = 0; i < itemKeys.length; i++) {
          const key = itemKeys[i]
          const item = ITEM_INFO[key]
          if (!item || !item.id) continue

          // 等级范围过滤
          const itemLevel = item.level || 0
          if (levelMin.value !== null && itemLevel < levelMin.value) continue
          if (levelMax.value !== null && itemLevel > levelMax.value) continue

          // 品级过滤
          if (selectedRarity.value) {
            const itemRarity = (item.rarity || '').toLowerCase()
            if (itemRarity !== selectedRarity.value) continue
          }

          // 部位过滤
          if (selectedSubcategory.value) {
            const itemSubcategory = (item.subcategory || '').toLowerCase()
            if (itemSubcategory !== selectedSubcategory.value) continue
          }

          // 职业过滤
          if (classIds && classIds.length > 0) {
            const itemClass = item.class
            if (!classIds.includes(itemClass)) continue
          }

          // 标记数据类型
          const itemWithType = { ...item, _dataType: 'item' }

          // 如果没有关键词，只要满足筛选条件就添加结果
          if (!keyword) {
            results.push(itemWithType)
            continue
          }

          // ID精确匹配
          if (String(item.id) === keyword) {
            results.unshift(itemWithType) // 精确匹配放最前面
            continue
          }

          // 名称模糊匹配
          const itemName = getItemName(item)
          if (itemName && itemName.toLowerCase().includes(keywordLower)) {
            results.push(itemWithType)
          }
        }
      } catch (e) {
        console.error('搜索物品时出错:', e)
      }
    } else {
      // 只搜索怪物
      try {
        const monsterKeys = Object.keys(MONSTER_INFO)
        for (let i = 0; i < monsterKeys.length; i++) {
          const key = monsterKeys[i]
          const monster = MONSTER_INFO[key]
          if (!monster || !monster.id) continue

          // 等级范围过滤
          const monsterLevel = monster.level || 0
          if (levelMin.value !== null && monsterLevel < levelMin.value) continue
          if (levelMax.value !== null && monsterLevel > levelMax.value) continue

          // rank段位过滤
          if (selectedRank.value) {
            const monsterRank = (monster.rank || 'default').toLowerCase()
            if (monsterRank !== selectedRank.value) continue
          }

          // 副本过滤
          if (dungeonMonsterIds && !dungeonMonsterIds.has(monster.id)) continue

          // 标记数据类型
          const monsterWithType = { ...monster, _dataType: 'monster' }

          // 如果没有关键词，只要满足筛选条件就添加结果
          if (!keyword) {
            results.push(monsterWithType)
            continue
          }

          // ID精确匹配
          if (String(monster.id) === keyword) {
            results.unshift(monsterWithType) // 精确匹配放最前面
            continue
          }

          // 名称模糊匹配
          const monsterName = getMonsterName(monster)
          if (monsterName && monsterName.toLowerCase().includes(keywordLower)) {
            results.push(monsterWithType)
          }
        }
      } catch (e) {
        console.error('搜索怪物时出错:', e)
      }
    }

    // 对结果进行排序：先按等级升序，再按品质升序（普通到终极）
    results.sort((a, b) => {
      // 物品排序：先按等级，再按品质
      if (currentType === 'item') {
        // 先按等级排序（升序）
        const levelA = a.level || 0
        const levelB = b.level || 0
        if (levelA !== levelB) {
          return levelA - levelB
        }
        // 等级相同时按品质排序（普通到终极）
        const rarityA = RARITY_ORDER[a.rarity] || RARITY_ORDER.common
        const rarityB = RARITY_ORDER[b.rarity] || RARITY_ORDER.common
        return rarityA - rarityB
      } else {
        // 怪物排序：先按等级，再按rank
        const levelA = a.level || 0
        const levelB = b.level || 0
        if (levelA !== levelB) {
          return levelA - levelB
        }
        // 等级相同时按rank排序
        const rankA = RANK_ORDER[a.rank] || RANK_ORDER.default
        const rankB = RANK_ORDER[b.rank] || RANK_ORDER.default
        return rankA - rankB
      }
    })

    searchResults.value = results
    displayLimit.value = 10 // 重置显示数量为10
    isSearching.value = false
  }, 100)
}

/**
 * 获取怪物名称
 * @param {Object} monster - 怪物数据
 * @returns {string} 怪物名称
 */
function getMonsterName (monster) {
  if (!monster || !monster.name) return ''
  // 优先使用中文名称
  if (monster.name.cns) return monster.name.cns
  if (monster.name.tw) return monster.name.tw
  if (monster.name.en) return monster.name.en
  return ''
}

/**
 * 获取怪物图标
 * @param {Object} monster - 怪物数据
 * @returns {string} 图标URL
 */
function getMonsterIcon (monster) {
  if (!monster) return '/pt/monster_icon/2087.png'
  // 怪物图标路径: /pt/monster_icon/怪物id.png
  return `/pt/monster_icon/${monster.id}.png`
}

/**
 * 获取结果名称（物品或怪物）
 * @param {Object} item - 结果项
 * @returns {string} 名称
 */
function getResultName (item) {
  if (!item) return ''
  if (item._dataType === 'monster') {
    return getMonsterName(item)
  }
  return getItemName(item)
}

/**
 * 获取结果图标（物品或怪物）
 * @param {Object} item - 结果项
 * @returns {string} 图标URL
 */
function getResultIcon (item) {
  if (!item) return '/pt/item_icon/default_item.png'
  if (item._dataType === 'monster') {
    return getMonsterIcon(item)
  }
  return getItemIcon(item)
}

/**
 * 获取结果项的边框样式（使用Pinia品质颜色）
 * @param {Object} item - 结果项
 * @returns {Object} 样式对象
 */
function getResultItemStyle (item) {
  if (!item) return {}
  // 怪物使用 rank 颜色
  if (item._dataType === 'monster') {
    const borderColor = monstersStore.getMonsterRankColor(item.rank)
    return { border: `1px solid ${borderColor}` }
  }
  // 物品使用 rarity 颜色
  const borderCss = itemsStore.getRarityBorderCss(item.rarity || 'common')
  return { border: borderCss }
}

/**
 * 获取结果名称的样式（使用Pinia品质颜色）
 * @param {Object} item - 结果项
 * @returns {Object} 样式对象
 */
function getResultNameStyle (item) {
  if (!item) return {}
  // 怪物使用 rank 颜色
  if (item._dataType === 'monster') {
    const textColor = monstersStore.getMonsterRankColor(item.rank)
    return { color: textColor }
  }
  // 物品使用 rarity 颜色
  const textColor = itemsStore.getRarityTextColor(item.rarity || 'common')
  return { color: textColor }
}

/**
 * 获取怪物等级文本
 * @param {string} rank - 怪物等级
 * @returns {string} 等级文本
 */
function getRankText (rank) {
  const rankMap = {
    captain: '队长',
    giant: '巨型',
    boss: 'BOSS',
    super: '超级',
    worldboss: '世界BOSS',
    violet: '堕落',
    material: '材料',
    default: '普通'
  }
  return rankMap[rank] || rank || ''
}

/**
 * 加载更多结果
 */
function loadMore () {
  if (displayLimit.value < searchResults.value.length) {
    displayLimit.value += 10
  }
}

/**
 * 处理滚动事件，滚动到底部时自动加载更多
 */
function handleScroll (event) {
  const target = event.target
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  // 距离底部50px时触发加载更多
  if (scrollBottom < 50 && hasMore.value) {
    loadMore()
  }
}

/**
 * 显示物品详情
 * @param {Object} item - 物品数据
 */
function showItemDetail (item) {
  // 如果是物品,查找掉落该物品的怪物
  if (item._dataType === 'item') {
    showItemDropMonsters(item)
  } else if (item._dataType === 'monster') {
    // 如果是怪物,显示掉落物品列表
    showMonsterDropItems(item)
  }
}

/**
 * 显示物品提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} item - 物品数据
 */
function showItemTooltip (event, item) {
  // 根据数据类型显示不同的tooltip
  if (item._dataType === 'monster') {
    // 显示怪物tooltip
    const tooltipEvent = new CustomEvent('show-monster-tooltip', {
      detail: {
        monsterId: item.id,
        position: { x: event.clientX, y: event.clientY },
        source: 'database-query-modal'
      }
    })
    window.dispatchEvent(tooltipEvent)
  } else {
    // 显示物品tooltip
    const tooltipEvent = new CustomEvent('show-item-tooltip', {
      detail: {
        item,
        position: { x: event.clientX, y: event.clientY },
        source: 'database-query-modal'
      }
    })
    window.dispatchEvent(tooltipEvent)
  }
}

/**
 * 隐藏物品提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} item - 数据项（物品或怪物）
 */
function hideItemTooltip (event, item) {
  // 检查 relatedTarget 是否应该阻止隐藏
  if (event && event.relatedTarget) {
    const resultItem = event.target.closest('.result-item')
    const relatedItem = event.relatedTarget.closest('.result-item')

    // 如果鼠标移动到了另一个 result-item，不隐藏（让新的 mouseenter 处理）
    if (relatedItem && relatedItem !== resultItem) {
      return
    }

    // 如果鼠标移动到了当前 result-item 的子元素内部，不隐藏
    if (resultItem && resultItem.contains(event.relatedTarget)) {
      return
    }
  }

  // 其他情况：隐藏 tooltip
  if (item && item._dataType === 'monster') {
    window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
  } else {
    window.dispatchEvent(new CustomEvent('hide-item-tooltip'))
  }
}

/**
 * 移动提示
 * @param {MouseEvent} event - 鼠标事件
 */
function moveTooltip (event, item) {
    // 根据当前悬停对象的数据类型，只发送对应类型的移动事件
    // 避免同时发送两种事件导致的竞态条件
    if (item._dataType === 'monster') {
      // 只移动怪物tooltip
      const monsterTooltipEvent = new CustomEvent('move-monster-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(monsterTooltipEvent)
    } else {
      // 只移动物品tooltip
      const itemTooltipEvent = new CustomEvent('move-item-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(itemTooltipEvent)
    }
  }

/**
 * 关闭模态框
 */
function closeModal () {
  emit('close')
  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件
 * @param {Object} item - 数据项
 */
function handleImageError (event, item) {
  // 根据数据类型使用不同的默认图片
  if (item && item._dataType === 'monster') {
    event.target.src = '/pt/monster_icon/2087.png'
  } else {
    event.target.src = '/pt/item_icon/default_item.png'
  }
}

/**
 * 处理图标加载错误
 * @param {Event} event - 错误事件
 */
function handleIconError (event) {
  event.target.style.display = 'none'
}

/**
 * 获取类别文本
 * @param {string} category - 类别代码
 * @returns {string} 类别文本
 */
function getCategoryText (category) {
  const categoryMap = {
    weapon: '武器',
    armor: '防具',
    accessory: '饰品',
    consume: '消耗品',
    material: '材料',
    quest: '任务物品',
    fashion: '时装',
    other: '其他'
  }
  return categoryMap[category] || category || '未知'
}

/**
 * 获取子类别文本
 * @param {string} subcategory - 子类别代码
 * @returns {string} 子类别文本
 */
function getSubcategoryText (subcategory) {
  const subcategoryMap = {
    sword: '剑',
    axe: '斧',
    staff: '法杖',
    stick: '棍',
    knuckle: '拳套',
    bow: '弓',
    yoyo: '溜溜球',
    helmet: '头盔',
    suit: '衣服',
    gauntlet: '护手',
    boots: '鞋子',
    necklace: '项链',
    ring: '戒指',
    earring: '耳环',
    food: '食物',
    potion: '药水',
    scroll: '卷轴'
  }
  return subcategoryMap[subcategory] || subcategory || ''
}

/**
 * 获取稀有度文本
 * @param {string} rarity - 稀有度代码
 * @returns {string} 稀有度文本
 */
function getRarityText (rarity) {
  const rarityMap = {
    common: '普通',
    uncommon: '优秀',
    rare: '稀有',
    unique: '独特',
    legendary: '传说',
    ultimate: '终极'
  }
  return rarityMap[rarity] || rarity || '普通'
}

/**
 * 获取属性文本
 * @param {string} element - 属性代码
 * @returns {string} 属性文本
 */
function getElementText (element) {
  const elementMap = {
    fire: '火',
    water: '水',
    wind: '风',
    earth: '地',
    electricity: '电',
    none: '无'
  }
  return elementMap[element] || element || '无'
}

/**
 * 格式化金币显示
 * @param {number} value - 金币数值
 * @returns {string} 格式化后的金币字符串
 */
function formatGold (value) {
  if (!value) return '0'
  return value.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

// 监听show属性，重置状态
watch(() => props.show, (newVal) => {
if (newVal) {
// 打开时重置状态
searchKeyword.value = ''
searchResults.value = []
hasSearched.value = false
displayLimit.value = 10
selectedClass.value = ''
selectedRank.value = ''
selectedDungeon.value = ''
}
})

// 监听搜索类型变化，重置对应的筛选条件
watch(searchType, (newVal) => {
  if (newVal === 'item') {
    // 切换到物品搜索时，重置怪物筛选条件
    selectedRank.value = ''
    selectedDungeon.value = ''
  } else if (newVal === 'monster') {
    // 切换到怪物搜索时，重置物品筛选条件
    selectedRarity.value = ''
    selectedSubcategory.value = ''
    selectedClass.value = ''
  }
  // 清空搜索结果
  searchResults.value = []
  hasSearched.value = false
})

// 暴露方法
defineExpose({
  refresh: () => {
    handleSearch()
  }
})
</script>

<style scoped>
.db-query-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}

.db-query-panel {
  position: fixed;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(20, 15, 30, 0.95) 0%, rgba(10, 8, 20, 0.98) 100%);
  border: 2px solid #8b5a2b;
  border-radius: 12px;
  box-shadow:
    0 0 30px rgba(139, 90, 43, 0.4),
    0 0 60px rgba(0, 0, 0, 0.6),
    inset 0 0 30px rgba(139, 90, 43, 0.1);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  min-width: 400px;
  min-height: 350px;
}

/* 标题区域 */
.db-query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(139, 90, 43, 0.3) 0%, rgba(139, 90, 43, 0.1) 100%);
  border-bottom: 2px solid #8b5a2b;
  cursor: move;
  user-select: none;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
}

.title-text {
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
  text-shadow:
    0 0 10px rgba(255, 215, 0, 0.5),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: 2px;
}

.btn-close {
  background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
  border: 2px solid #ff4444;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  text-shadow: 0 0 5px rgba(255, 0, 0, 0.8);
}

.btn-close:hover {
  background: linear-gradient(180deg, #aa0000 0%, #660000 100%);
  box-shadow: 0 0 15px rgba(255, 68, 68, 0.6);
  transform: scale(1.1);
}

/* 搜索区域 */
.db-query-search {
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(139, 90, 43, 0.5);
}

.search-input-wrapper {
  display: flex;
  gap: 10px;
}

  /* 等级范围输入框样式 */
  .level-range-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid #5a4a3a;
    border-radius: 8px;
    padding: 4px 8px;
  }

  .level-range-label {
    color: #ffd700;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
  }

  .level-range-input {
    width: 50px;
    padding: 6px 4px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid #4a3a2a;
    border-radius: 4px;
    color: #fff;
    font-size: 14px;
    text-align: center;
    outline: none;
  }

  .level-range-input::placeholder {
    color: #666;
    font-size: 11px;
  }

  .level-range-input:focus {
    border-color: #ffd700;
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
  }

  /* 隐藏数字输入框的上下箭头 */
  .level-range-input::-webkit-outer-spin-button,
  .level-range-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .level-range-input[type=number] {
    -moz-appearance: textfield;
  }

  .level-range-separator {
    color: #888;
    font-size: 14px;
    font-weight: bold;
  }

.search-type-select {
  padding: 5px;
  background: #302122;
  border: 2px solid #5a4a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.search-type-select:hover {
  border-color: #7a9aca;
  box-shadow: 0 0 10px rgba(74, 106, 154, 0.4);
}

.search-type-select option {
  background: #1a2a4a;
  color: #fff;
  padding: 8px;
}

.filter-select {
  padding: 5px;
  background: #2c1f22;
  border: 2px solid #5a4a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.filter-select:hover {
  border-color: #7a9aca;
  box-shadow: 0 0 10px rgba(74, 106, 154, 0.4);
}

.filter-select option {
  background: #1a2a4a;
  color: #fff;
  padding: 8px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #5a4a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: #888;
}

.search-input:focus {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.btn-search {
  padding: 12px 24px;
  background: linear-gradient(180deg, #2a5a2a 0%, #1a3a1a 100%);
  border: 2px solid #4a8a4a;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-search:hover:not(:disabled) {
  background: linear-gradient(180deg, #3a7a3a 0%, #2a5a2a 100%);
  box-shadow: 0 0 15px rgba(74, 138, 74, 0.5);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  text-align: center;
}

/* 结果区域 */
.db-query-results {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.no-results,
.search-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #888;
  gap: 16px;
}

.no-result-icon,
.placeholder-icon {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.results-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.results-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(139, 90, 43, 0.2);
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}

.result-count {
  color: #ffd700;
  font-weight: bold;
}

.result-info {
  color: #888;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px;
  padding: 4px;
}

/* 自定义滚动条 */
.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.results-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5a2b 0%, #5a3a1b 100%);
  border-radius: 4px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #a86a3b 0%, #7a4a2b 100%);
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(30, 25, 40, 0.8);
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-item:hover {
  background: rgba(50, 45, 60, 0.9);
  border-color: #ffd700;
  /* transform: translateY(-2px); */ /* 注释掉，避免鼠标悬停时元素位移导致 mouseleave 事件误触发 */
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
}

.item-icon-wrapper {
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.monster-icon-wrapper {
  width: 150px;
  height: 150px;
}

.item-icon {
  max-width: 100%;
  max-height: 100%;
}

.monster-icon {
  width: 150px;
  height: 150px;
  object-fit: contain;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #888;
}

.item-id {
  color: #aaa;
}

.item-category {
  color: #8b5a2b;
}

.item-level {
  color: #4a9a4a;
}

.load-more {
  padding: 12px;
  text-align: center;
}

.btn-load-more {
  padding: 10px 30px;
  background: linear-gradient(180deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #5a5a7a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-load-more:hover {
  background: linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%);
  box-shadow: 0 0 10px rgba(90, 90, 122, 0.5);
}
</style>
