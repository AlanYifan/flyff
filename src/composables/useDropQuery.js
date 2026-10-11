/**
 * @file useDropQuery.js
 * @description 掉落查询组合式函数,用于查询物品掉落怪物和怪物掉落物品
 * @author FLYFF Team
 * @created 2026-02-26
 */

import { ITEM_INFO } from '@/data/ITEM_INFO'
import { MONSTER_INFO } from '@/data/MONSTER_INFO'
import { getItemName, getItemIcon } from '@/utils/itemUtils'
import { useItemsStore } from '@/store/items'
import { MONSTER_RANK_COLORS } from '@/store/monsters'

/**
 * 品质排序顺序（从普通到终极）
 */
const RARITY_ORDER = {
  common: 1,
  uncommon: 2,
  rare: 3,
  veryrare: 4,
  unique: 5,
  ultimate: 6,
  mythic: 7
}

/**
 * 怪物 rank 排序顺序（从普通到史诗/BOSS）
 */
const MONSTER_RANK_ORDER = {
  normal: 1,
  small: 2,
  material: 3,
  captain: 4,
  giant: 5,
  boss: 6,
  super: 7,
  violet: 8
}

/**
 * 元素属性映射
 */
const ELEMENT_MAP = {
  fire: { name: '火', icon: '/pt/element/fire_火.png' },
  water: { name: '水', icon: '/pt/element/water_水.png' },
  wind: { name: '风', icon: '/pt/element/wind_风.png' },
  earth: { name: '土', icon: '/pt/element/earth_土.png' },
  electricity: { name: '雷', icon: '/pt/element/electricity_雷.png' },
  thunder: { name: '雷', icon: '/pt/element/electricity_雷.png' },
  none: { name: '无', icon: '' }
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
violet: '堕落',
material: '材料',
small: '小型',
normal: '普通',
default: '普通'
}
return rankMap[rank] || rank || ''
}

/**
 * 显示掉落该物品的怪物列表
 * @param {Object} item - 物品数据
 */
export function showItemDropMonsters (item) {
  const monsters = []
  const itemId = item.id

  // 遍历所有怪物,查找掉落该物品的怪物
  try {
    const monsterKeys = Object.keys(MONSTER_INFO)
    for (let i = 0; i < monsterKeys.length; i++) {
      const key = monsterKeys[i]
      const monster = MONSTER_INFO[key]
      if (!monster || !monster.id || !monster.drops) continue

      // 检查是否掉落该物品
      const hasDrop = monster.drops.some(drop => drop.item === itemId)
      if (hasDrop) {
        monsters.push({ ...monster, _dataType: 'monster' })
      }
    }
  } catch (e) {
    console.error('查找掉落怪物时出错:', e)
  }

  // 显示掉落怪物列表面板
  showDropMonstersPanel(item, monsters)
}

/**
 * 显示怪物掉落的物品列表
 * @param {Object} monster - 怪物数据
 */
export function showMonsterDropItems (monster) {
  if (!monster.drops || monster.drops.length === 0) {
    // 没有掉落物品
    showNoDropItemsPanel(monster)
    return
  }

  // 获取掉落物品详情
  const dropItems = []
  try {
    monster.drops.forEach(drop => {
      const itemInfo = ITEM_INFO[drop.item]
      if (itemInfo) {
        dropItems.push({
          ...itemInfo,
          _dataType: 'item',
          dropProbability: drop.probabilityRange || drop.prob || '',
          dropCommon: drop.common
        })
      }
    })
  } catch (e) {
    console.error('获取掉落物品时出错:', e)
  }

  // 显示掉落物品列表面板
  showDropItemsPanel(monster, dropItems)
}

/**
 * 显示掉落怪物的面板
 * @param {Object} item - 物品数据
 * @param {Array} monsters - 掉落该物品的怪物列表
 */
function showDropMonstersPanel (item, monsters) {
  // 移除已存在的面板
  const existingPanel = document.getElementById('drop-monsters-panel')
  if (existingPanel) {
    existingPanel.remove()
  }

  // 创建面板
  const panel = document.createElement('div')
  panel.id = 'drop-monsters-panel'
  panel.className = 'drop-monsters-panel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
    border: 2px solid #8b5a2b;
    border-radius: 12px;
    padding: 16px;
    min-width: 400px;
    max-width: 600px;
    max-height: 500px;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
    z-index: 1200;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `

  // 创建标题（固定，可拖拽）
  const header = document.createElement('div')
  // 获取物品品质颜色
  const itemsStore = useItemsStore()
  const itemRarityColor = itemsStore.getRarityTextColor(item.rarity || 'common')
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 2px solid #8b5a2b;
    flex-shrink: 0;
    cursor: move;
    user-select: none;
  `
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px; font-weight: bold; color: #ffd700;">掉落怪物列表</span>
      <span style="font-size: 14px; color: ${itemRarityColor};">${getItemName(item)}</span>
    </div>
    <button class="close-btn" style="
      background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
      border: 2px solid #ff4444;
      border-radius: 50%;
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      width: 28px;
      height: 28px;
      cursor: pointer;
    ">×</button>
  `

  // 关闭按钮事件
  header.querySelector('.close-btn').onclick = () => panel.remove()

  panel.appendChild(header)

  // 显示怪物数量（固定）
  const countDiv = document.createElement('div')
  countDiv.style.cssText = `
    padding: 8px 12px;
    background: rgba(139, 90, 43, 0.2);
    border-radius: 6px;
    margin-top: 12px;
    margin-bottom: 12px;
    color: #ffd700;
    font-size: 14px;
    flex-shrink: 0;
  `
  countDiv.textContent = `找到 ${monsters.length} 个掉落该物品的怪物`
  panel.appendChild(countDiv)

  // 怪物列表容器（可滚动）
  const listWrapper = document.createElement('div')
  listWrapper.id = 'drop-monsters-list-wrapper'
  listWrapper.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  `

  const listContainer = document.createElement('div')
  listContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 10px;
  `

  if (monsters.length === 0) {
    const noData = document.createElement('div')
    noData.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: #888;
    `
    noData.textContent = '没有怪物掉落该物品'
    listContainer.appendChild(noData)
  } else {
    // 按等级从低到高，同等级按 rank 从普通到史诗排序
    const sortedMonsters = [...monsters].sort((a, b) => {
      const levelA = a.level || 0
      const levelB = b.level || 0
      if (levelA !== levelB) {
        return levelA - levelB
      }
      // 同等级按 rank 排序
      const rankA = MONSTER_RANK_ORDER[a.rank?.toLowerCase()] || 0
      const rankB = MONSTER_RANK_ORDER[b.rank?.toLowerCase()] || 0
      return rankA - rankB
    })
    sortedMonsters.forEach(monster => {
      const monsterDiv = document.createElement('div')
      // 使用 rank 颜色规则
      const rankColor = MONSTER_RANK_COLORS[monster.rank?.toLowerCase()] || MONSTER_RANK_COLORS.default
      monsterDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: rgba(30, 25, 40, 0.8);
        border: 1px solid ${rankColor};
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      `

      const iconImg = document.createElement('img')
      iconImg.src = getMonsterIcon(monster)
      iconImg.style.cssText = 'width: 48px; height: 48px; border-radius: 6px; cursor: pointer;'
      iconImg.onerror = () => { iconImg.src = '/pt/monster_icon/2087.png' }

      // 鼠标悬停显示怪物详情面板
      iconImg.addEventListener('mouseenter', (e) => {
        const tooltipEvent = new CustomEvent('show-monster-tooltip', {
          detail: {
            monsterId: monster.id,
            position: { x: e.clientX, y: e.clientY }
          }
        })
        window.dispatchEvent(tooltipEvent)
      })

      iconImg.addEventListener('mousemove', (e) => {
        const tooltipEvent = new CustomEvent('move-monster-tooltip', {
          detail: {
            position: { x: e.clientX, y: e.clientY }
          }
        })
        window.dispatchEvent(tooltipEvent)
      })

      iconImg.addEventListener('mouseleave', () => {
        const tooltipEvent = new CustomEvent('hide-monster-tooltip')
        window.dispatchEvent(tooltipEvent)
      })

      const infoDiv = document.createElement('div')
      infoDiv.style.cssText = 'flex: 1; min-width: 0;'
      infoDiv.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; color: ${rankColor}; margin-bottom: 4px;">${getMonsterName(monster)}</div>
        <div style="font-size: 11px; color: #888;">
          <span>ID: ${monster.id}</span>
          <span style="margin-left: 8px; color: #4aff4a;">Lv.${monster.level || 0}</span>
          ${monster.rank ? `<span style="margin-left: 8px;">${getRankText(monster.rank)}</span>` : ''}
        </div>
      `

      monsterDiv.appendChild(iconImg)
      monsterDiv.appendChild(infoDiv)

      // 点击怪物显示其掉落物品
      monsterDiv.onclick = () => {
        showMonsterDropItems(monster)
      }

      listContainer.appendChild(monsterDiv)
    })
  }

  listWrapper.appendChild(listContainer)
  panel.appendChild(listWrapper)
  document.body.appendChild(panel)

  // 添加拖拽功能
  makePanelDraggable(panel, header)
}

/**
 * 计算怪物经验值显示
 * @param {Object} monster - 怪物数据
 * @returns {Object} 经验值信息 { baseExp, expPercent }
 */
function calculateMonsterExp (monster) {
  if (!monster) return { baseExp: '未知', expPercent: '未知' }
  const level = monster.level || 1
  const expTable = monster.experienceTable
  if (!expTable || !Array.isArray(expTable) || expTable.length === 0) {
    return { baseExp: '未知', expPercent: '未知' }
  }
  // 基础经验值（第一项）
  const baseExp = expTable[0]
  // 当前怪物等级对应的经验数组索引为 level - 1
  const expIndex = Math.max(0, Math.min(level - 1, expTable.length - 1))
  const currentExp = expTable[expIndex]
  // 计算百分比：experienceTable[level - 1] / experienceTable[0] * 100
  let expPercent = '未知'
  if (typeof currentExp === 'number' && typeof baseExp === 'number' &&
      Number.isFinite(currentExp) && Number.isFinite(baseExp) && baseExp !== 0) {
    const percent = (currentExp / baseExp) * 100
    expPercent = `${percent.toFixed(2)}%`
  }
  return { baseExp: formatNumber(baseExp), expPercent }
}

/**
 * 获取元素属性信息
 * @param {string} element - 元素类型
 * @returns {Object} 元素信息 {name, icon}
 */
function getElementInfo (element) {
  const normalizedElement = (element || 'none').toLowerCase()
  return ELEMENT_MAP[normalizedElement] || ELEMENT_MAP.none
}

/**
 * 显示掉落物品的面板
 * @param {Object} monster - 怪物数据
 * @param {Array} items - 掉落物品列表
 */
function showDropItemsPanel (monster, items) {
  const itemsStore = useItemsStore()

  // 移除已存在的面板
  const existingContainer = document.getElementById('drop-items-container')
  if (existingContainer) {
    existingContainer.remove()
  }
  const existingMonsterPanel = document.getElementById('monster-detail-panel')
  if (existingMonsterPanel) {
    existingMonsterPanel.remove()
  }
  const existingDropPanel = document.getElementById('drop-items-panel')
  if (existingDropPanel) {
    existingDropPanel.remove()
  }

  // 计算面板位置（屏幕中央偏右）
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const panelWidth = 520
  const panelHeight = 550
  const monsterPanelWidth = 220
  const panelLeft = (viewportWidth - panelWidth) / 2 + 50
  const panelTop = (viewportHeight - panelHeight) / 2

  // 创建怪物详情面板（独立定位，左侧外部）
  const monsterPanel = document.createElement('div')
  monsterPanel.id = 'monster-detail-panel'
  monsterPanel.className = 'monster-detail-panel'
  monsterPanel.style.cssText = `
    position: fixed;
    top: ${panelTop}px;
    left: ${panelLeft - monsterPanelWidth - 4}px;
    width: ${monsterPanelWidth}px;
    height: ${panelHeight}px;
    background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
    border: 2px solid #8b5a2b;
    border-radius: 12px 0 0 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1200;
    overflow-y: auto;
  `

  // 怪物图标
  const monsterIcon = document.createElement('img')
  monsterIcon.src = getMonsterIcon(monster)
  monsterIcon.style.cssText = `
    width: 120px;
    height: 120px;
    margin-bottom: 12px;
  `
  monsterIcon.onerror = () => { monsterIcon.src = '/pt/monster_icon/2087.png' }
  monsterPanel.appendChild(monsterIcon)

  // 怪物名称（使用 rank 颜色）
  const monsterNameDiv = document.createElement('div')
  const rankColor = MONSTER_RANK_COLORS[monster.rank?.toLowerCase()] || MONSTER_RANK_COLORS.default
  monsterNameDiv.style.cssText = `
    font-size: 16px;
    font-weight: bold;
    color: ${rankColor};
    text-align: center;
    margin-bottom: 8px;
  `
  monsterNameDiv.textContent = getMonsterName(monster)
  monsterPanel.appendChild(monsterNameDiv)

  // 匂怪物信息容器
  const infoContainer = document.createElement('div')
  infoContainer.style.cssText = `
    font-size: 12px;
    color: #aaa;
    text-align: center;
    line-height: 1.8;
    width: 100%;
  `

  // 基础信息
  const basicInfo = document.createElement('div')
  
  // 计算经验值百分比显示
  let expDisplayText = '未知'
  const level = monster.level || 1
  const expTable = monster.experienceTable
  if (expTable && Array.isArray(expTable) && expTable.length > 0) {
    const expIndex = Math.max(0, Math.min(level - 1, expTable.length - 1))
    const currentExp = expTable[expIndex]
    if (typeof currentExp === 'number' && Number.isFinite(currentExp)) {
      expDisplayText = `${level}级击杀可获得${currentExp}%`
    }
  }
  
  basicInfo.innerHTML = `
    <div style="margin-bottom: 4px;">ID: ${monster.id}</div>
    <div style="margin-bottom: 4px;">等级: ${monster.level || 0}</div>
    ${monster.rank ? `<div style="margin-bottom: 4px;">类型: ${getRankText(monster.rank)}</div>` : ''}
    <div style="margin-bottom: 4px;">HP: ${formatNumber(monster.hp || monster.maxHealth || 0)}</div>
    <div style="margin-bottom: 4px;">攻击: ${monster.minAttack || 0} - ${monster.maxAttack || 0}</div>
    <div style="margin-bottom: 4px;">防御: ${monster.defense || 0}</div>
    <div style="margin-bottom: 4px;">命中: ${monster.hitRate || 0}%</div>
    <div style="margin-bottom: 4px;">回避: ${monster.parry || 0}%</div>
    <div style="margin-bottom: 4px;">飞行: ${monster.flying ? '是' : '否'}</div>
    <div style="margin-bottom: 4px; color: #4a9aff;">经验值: ${expDisplayText}</div>
  `
  infoContainer.appendChild(basicInfo)

  // 属性信息（带图标）
  const elementInfo = getElementInfo(monster.element)
  if (elementInfo.icon) {
    const elementDiv = document.createElement('div')
    elementDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 8px;
      margin-bottom: 4px;
    `
    const elementIcon = document.createElement('img')
    elementIcon.src = elementInfo.icon
    elementIcon.style.cssText = 'width: 20px; height: 20px;'
    elementIcon.onerror = () => { elementIcon.style.display = 'none' }
    elementDiv.appendChild(elementIcon)
    const elementText = document.createElement('span')
    elementText.textContent = `属性: ${elementInfo.name}`
    elementDiv.appendChild(elementText)
    infoContainer.appendChild(elementDiv)
  } else {
    const elementDiv = document.createElement('div')
    elementDiv.style.cssText = 'margin-top: 8px; margin-bottom: 4px;'
    elementDiv.textContent = '属性: 无'
    infoContainer.appendChild(elementDiv)
  }

  // 狂暴信息
  if (monster.berserkThresholdHP && monster.berserkThresholdHP > 0) {
    const berserkDiv = document.createElement('div')
    berserkDiv.style.cssText = `
      margin-top: 12px;
      padding: 8px;
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      border-radius: 6px;
    `
    berserkDiv.innerHTML = `
      <div style="color: #ff4444; font-weight: bold; margin-bottom: 4px;">⚠ 狂暴机制</div>
      <div style="color: #ff6600;">狂暴阈值: ${monster.berserkThresholdHP}% HP</div>
      <div style="color: #ff6600;">增伤: +${monster.berserkAttackPower || 0}%</div>
    `
    infoContainer.appendChild(berserkDiv)
  }

  // 将信息容器添加到怪物面板
  monsterPanel.appendChild(infoContainer)

  // 将怪物面板添加到页面
  document.body.appendChild(monsterPanel)

  // 创建掉落物品面板（独立定位）
  const panel = document.createElement('div')
  panel.id = 'drop-items-panel'
  panel.className = 'drop-items-panel'
  panel.style.cssText = `
    position: fixed;
    top: ${panelTop}px;
    left: ${panelLeft}px;
    width: ${panelWidth}px;
    height: ${panelHeight}px;
    background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
    border: 2px solid #8b5a2b;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
    z-index: 1200;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `

  // 创建标题（固定，不滚动）
  const header = document.createElement('div')
  header.className = 'drop-items-header'
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 2px solid #8b5a2b;
    cursor: move;
    user-select: none;
    flex-shrink: 0;
  `
  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px; font-weight: bold; color: #ffd700;">掉落物品列表</span>
      <span id="drop-items-count" style="font-size: 14px; color: #888;">共 ${items.length} 种</span>
    </div>
    <button class="close-btn" style="
      background: linear-gradient(180deg, #8b0000 0%, #4a0000 100%);
      border: 2px solid #ff4444;
      border-radius: 50%;
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      width: 28px;
      height: 28px;
      cursor: pointer;
    ">×</button>
  `

  // 关闭按钮事件
  header.querySelector('.close-btn').onclick = () => {
    panel.remove()
    monsterPanel.remove()
  }

  panel.appendChild(header)

  // 创建筛选区域（固定，不滚动）
  const filterContainer = document.createElement('div')
  filterContainer.id = 'drop-filter-container'
  filterContainer.style.cssText = `
    display: flex;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(139, 90, 43, 0.5);
    flex-shrink: 0;
    flex-wrap: wrap;
  `

  // 品级筛选下拉
  const raritySelect = document.createElement('select')
  raritySelect.id = 'filter-rarity'
  raritySelect.style.cssText = `
    padding: 6px 10px;
    background: #2c1f22;
    border: 2px solid #5a4a3a;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    outline: none;
    min-width: 100px;
  `
  const rarityOptions = [
    { value: '', text: '全部品级' },
    { value: 'common', text: '普通' },
    { value: 'uncommon', text: '罕见' },
    { value: 'rare', text: '稀有' },
    { value: 'veryrare', text: '传说' },
    { value: 'unique', text: '史诗' },
    { value: 'ultimate', text: '终极' },
    { value: 'mythic', text: '神话' }
  ]
  rarityOptions.forEach(opt => {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.text
    raritySelect.appendChild(option)
  })
  filterContainer.appendChild(raritySelect)

  // 类型筛选下拉
  const typeSelect = document.createElement('select')
  typeSelect.id = 'filter-type'
  typeSelect.style.cssText = `
    padding: 6px 10px;
    background: #2c1f22;
    border: 2px solid #5a4a3a;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    outline: none;
    min-width: 100px;
  `
  const typeOptions = [
    { value: '', text: '全部类型' },
    { value: 'sword', text: '剑' },
    { value: 'axe', text: '斧' },
    { value: 'staff', text: '法杖' },
    { value: 'stick', text: '魔棒' },
    { value: 'wand', text: '魔杖' },
    { value: 'knuckle', text: '拳套' },
    { value: 'bow', text: '弓' },
    { value: 'yoyo', text: '飞轮' },
    { value: 'shield', text: '盾牌' },
    { value: 'helmet', text: '帽子' },
    { value: 'suit', text: '衣服' },
    { value: 'gauntlet', text: '手套' },
    { value: 'boots', text: '鞋子' },
    { value: 'necklace', text: '项链' },
    { value: 'earring', text: '耳环' },
    { value: 'ring', text: '戒指' }
  ]
  typeOptions.forEach(opt => {
    const option = document.createElement('option')
    option.value = opt.value
    option.textContent = opt.text
    typeSelect.appendChild(option)
  })
  filterContainer.appendChild(typeSelect)

  panel.appendChild(filterContainer)

  // 创建物品列表容器（可滚动）
  const listWrapper = document.createElement('div')
  listWrapper.id = 'drop-items-list-wrapper'
  listWrapper.style.cssText = `
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-top: 8px;
  `

  const listContainer = document.createElement('div')
  listContainer.id = 'drop-items-list'
  listContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin: 10px;
  `

  listWrapper.appendChild(listContainer)
  panel.appendChild(listWrapper)
  document.body.appendChild(panel)

  // 对物品进行排序：先按等级升序，再按品质升序（普通到终极）
  const sortedItems = [...items].sort((a, b) => {
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
  })

  /**
   * 渲染物品列表
   * @param {Array} itemsToRender - 要渲染的物品列表
   */
  function renderItems (itemsToRender) {
    listContainer.innerHTML = ''
    const countSpan = document.getElementById('drop-items-count')
    if (countSpan) {
      countSpan.textContent = `共 ${itemsToRender.length} 种`
    }

    itemsToRender.forEach(item => {
      const itemDiv = document.createElement('div')
      const borderColor = itemsStore.getRarityTextColor(item.rarity || 'common')
      itemDiv.className = 'drop-item-card'
      itemDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        background: rgba(30, 25, 40, 0.8);
        border: 1px solid ${borderColor};
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
      `

      const iconImg = document.createElement('img')
      iconImg.src = getItemIcon(item)
      iconImg.className = 'drop-item-icon'
      iconImg.style.cssText = 'width: 40px; height: 40px; border-radius: 4px;'
      iconImg.onerror = () => { iconImg.src = '/pt/item_icon/default_item.png' }

      const infoDiv = document.createElement('div')
      infoDiv.style.cssText = 'flex: 1; min-width: 0;'
      const textColor = itemsStore.getRarityTextColor(item.rarity || 'common')
      infoDiv.innerHTML = `
        <div style="font-size: 12px; font-weight: bold; color: ${textColor}; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${getItemName(item)}</div>
        <div style="font-size: 10px; color: #888;">
          <span>ID: ${item.id}</span>
          ${item.level ? `<span style="margin-left: 6px;">Lv.${item.level}</span>` : ''}
          ${item.dropProbability ? `<span style="margin-left: 6px; color: #4a9a4a;">${item.dropProbability}</span>` : ''}
        </div>
      `

      itemDiv.appendChild(iconImg)
      itemDiv.appendChild(infoDiv)

      // 鼠标悬停显示物品tooltip
      itemDiv.addEventListener('mouseenter', (e) => {
        const tooltipEvent = new CustomEvent('show-item-tooltip', {
          detail: {
            item,
            position: { x: e.clientX, y: e.clientY },
            source: 'drop-items-panel'
          }
        })
        window.dispatchEvent(tooltipEvent)
      })

      itemDiv.addEventListener('mousemove', (e) => {
        const tooltipEvent = new CustomEvent('move-item-tooltip', {
          detail: {
            position: { x: e.clientX, y: e.clientY }
          }
        })
        window.dispatchEvent(tooltipEvent)
      })

      itemDiv.addEventListener('mouseleave', () => {
        const tooltipEvent = new CustomEvent('hide-item-tooltip')
        window.dispatchEvent(tooltipEvent)
      })

      // 点击物品显示掉落该物品的怪物
      itemDiv.onclick = () => {
        showItemDropMonsters(item)
      }

      listContainer.appendChild(itemDiv)
    })
  }

  // 初始渲染
  renderItems(sortedItems)

  // 筛选功能
  function filterItems () {
    const rarityValue = raritySelect.value
    const typeValue = typeSelect.value

    let filtered = sortedItems

    // 按品级筛选
    if (rarityValue) {
      filtered = filtered.filter(item => {
        const itemRarity = (item.rarity || '').toLowerCase()
        return itemRarity === rarityValue
      })
    }

    // 按类型筛选
    if (typeValue) {
      filtered = filtered.filter(item => {
        const itemSubcategory = (item.subcategory || '').toLowerCase()
        return itemSubcategory === typeValue
      })
    }

    renderItems(filtered)
  }

  // 绑定筛选事件
  raritySelect.addEventListener('change', filterItems)
  typeSelect.addEventListener('change', filterItems)

  // 添加拖拽功能（两个面板一起移动）
  makeDropItemsDraggable(panel, monsterPanel, header)
}

/**
 * 格式化数字显示（每4位添加逗号）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
function formatNumber (num) {
  if (!num || !Number.isFinite(num)) return '0'
  return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

/**
 * 为单个面板添加拖拽功能
 * @param {HTMLElement} panel - 面板元素
 * @param {HTMLElement} header - 拖拽手柄元素
 */
function makePanelDraggable (panel, header) {
  let isDragging = false
  let startX, startY, initialLeft, initialTop

  const onMouseDown = e => {
    // 如果点击的是关闭按钮，不触发拖拽
    if (e.target.classList.contains('close-btn')) {
      return
    }

    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const rect = panel.getBoundingClientRect()
    initialLeft = rect.left
    initialTop = rect.top

    // 移除 transform，使用 left/top 定位
    panel.style.transform = 'none'
    panel.style.left = `${initialLeft}px`
    panel.style.top = `${initialTop}px`

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  const onMouseMove = e => {
    if (!isDragging) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    panel.style.left = `${initialLeft + deltaX}px`
    panel.style.top = `${initialTop + deltaY}px`
  }

  const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  header.addEventListener('mousedown', onMouseDown)
}

/**
 * 为掉落物品面板添加拖拽功能（两个面板一起移动）
 * @param {HTMLElement} dropPanel - 掉落面板元素
 * @param {HTMLElement} monsterPanel - 怪物详情面板元素
 * @param {HTMLElement} header - 拖拽手柄元素
 */
function makeDropItemsDraggable (dropPanel, monsterPanel, header) {
  let isDragging = false
  let startX, startY, initialLeft, initialTop

  const onMouseDown = e => {
    // 只允许通过拖拽头部移动面板
    if (e.target !== header && !header.contains(e.target)) {
      return
    }
    // 如果点击的是关闭按钮，不触发拖拽
    if (e.target.classList.contains('close-btn')) {
      return
    }

    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const dropRect = dropPanel.getBoundingClientRect()
    initialLeft = dropRect.left
    initialTop = dropRect.top

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    e.preventDefault()
  }

  const onMouseMove = e => {
    if (!isDragging) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    // 同时移动两个面板
    dropPanel.style.left = `${initialLeft + deltaX}px`
    dropPanel.style.top = `${initialTop + deltaY}px`
    monsterPanel.style.left = `${initialLeft + deltaX - 224}px`
    monsterPanel.style.top = `${initialTop + deltaY}px`
  }

  const onMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  header.addEventListener('mousedown', onMouseDown)
}

/**
 * 添加掉落面板滚动条样式（黑色背景）
 */
function addDropPanelScrollbarStyles () {
  // 检查是否已添加样式
  if (document.getElementById('drop-panel-scrollbar-styles')) return

  const style = document.createElement('style')
  style.id = 'drop-panel-scrollbar-styles'
  style.textContent = `
    /* 掉落怪物面板滚动条样式 - 黑色背景，灰色滚动条 */
    #drop-monsters-list-wrapper::-webkit-scrollbar {
      width: 8px;
    }
    #drop-monsters-list-wrapper::-webkit-scrollbar-track {
      background: #000;
      border-radius: 4px;
    }
    #drop-monsters-list-wrapper::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    #drop-monsters-list-wrapper::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
    /* 掉落物品面板滚动条样式 - 黑色背景，灰色滚动条 */
    #drop-items-list-wrapper::-webkit-scrollbar {
      width: 8px;
    }
    #drop-items-list-wrapper::-webkit-scrollbar-track {
      background: #000;
      border-radius: 4px;
    }
    #drop-items-list-wrapper::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    #drop-items-list-wrapper::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
    /* 兼容旧版 */
    #drop-items-panel::-webkit-scrollbar {
      width: 8px;
    }
    #drop-items-panel::-webkit-scrollbar-track {
      background: #000;
      border-radius: 4px;
    }
    #drop-items-panel::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    #drop-items-panel::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
    /* 怪物详情面板滚动条样式 - 黑色背景，灰色滚动条 */
    #monster-detail-panel::-webkit-scrollbar {
      width: 8px;
    }
    #monster-detail-panel::-webkit-scrollbar-track {
      background: #000;
      border-radius: 4px;
    }
    #monster-detail-panel::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    #monster-detail-panel::-webkit-scrollbar-thumb:hover {
      background: #aaa;
    }
  `
  document.head.appendChild(style)
}

// 初始化时添加滚动条样式
addDropPanelScrollbarStyles()

/**
 * 显示无掉落物品提示面板
 * @param {Object} monster - 怪物数据
 */
function showNoDropItemsPanel (monster) {
  // 移除已存在的面板
  const existingPanel = document.getElementById('no-drop-items-panel')
  if (existingPanel) {
    existingPanel.remove()
  }

  // 创建提示面板
  const panel = document.createElement('div')
  panel.id = 'no-drop-items-panel'
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(180deg, rgba(20, 15, 30, 0.98) 0%, rgba(10, 8, 20, 0.99) 100%);
    border: 2px solid #8b5a2b;
    border-radius: 12px;
    padding: 24px;
    min-width: 300px;
    box-shadow: 0 5px 30px rgba(0, 0, 0, 0.8);
    z-index: 1200;
    text-align: center;
  `

  panel.innerHTML = `
    <div style="font-size: 16px; color: #ffd700; margin-bottom: 12px;">${getMonsterName(monster)}</div>
    <div style="font-size: 14px; color: #888;">该怪物没有掉落物品</div>
    <button class="close-btn" style="
      margin-top: 16px;
      padding: 8px 24px;
      background: linear-gradient(180deg, #8b5a2b 0%, #5a3a1b 100%);
      border: 2px solid #8b5a2b;
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    ">关闭</button>
  `

  // 关闭按钮事件
  panel.querySelector('.close-btn').onclick = () => panel.remove()

  document.body.appendChild(panel)

  // 3秒后自动关闭
  setTimeout(() => {
    if (panel.parentNode) {
      panel.remove()
    }
  }, 3000)
}
