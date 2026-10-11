# Pinia 使用说明

**更新时间**: 2026-01-17

---

## 一、Pinia Store 架构

### 1. Store 列表

| Store | 文件路径 | 用途 |
|-------|---------|------|
| `useItemsStore` | `src/store/items.js` | 物品、背包、装备管理 |
| `useMonstersStore` | `src/store/monsters.js` | 怪物配置、当前怪物管理 |
| `useSkillsStore` | `src/store/skills.js` | 技能配置、玩家技能、冷却管理 |
| `useMapsStore` | `src/store/maps.js` | 地图配置、当前地图管理 |
| `usePlayerStore` | `src/store/player.js` | 玩家状态、属性管理 |
| `useGameStore` | `src/store/index.js` | 游戏全局、装备套装管理 |
| `useAutoBattleStore` | `src/store/autoBattle.js` | 自动战斗配置、状态管理 |

### 2. 数据流架构

```
静态文件 (src/data/)
    ↓
StaticDataService.load*Data()
    ↓
StaticGameInitializer.loadGameData()
    ↓
Object.freeze() 冻结静态数据
    ↓
同步到 Pinia Stores
    ↓
组件/Composables/Services
```

---

## 二、数据初始化完整流程

### 1. 游戏初始化入口

**文件**: `src/services/StaticGameInitializer.js`

**初始化方法**: `initGame()`

```javascript
async initGame() {
  try {
    this.state.isLoading = true
    this.state.error = null

    await this.services.data.init()

    if (!this.validateUserData()) {
      return false
    }

    await this.loadGameData()

    await this.initPlayerData()

    this.initGameSystems()

    this.startGameLoop()

    this.state.isInitialized = true

    return true
  } catch (error) {
    console.error('游戏初始化失败:', error)
    this.state.error = error
    return false
  } finally {
    this.state.isLoading = false
  }
}
```

### 2. 静态数据加载流程

**方法**: `loadGameData()`

**步骤 1**: 并行加载所有静态数据

```javascript
const dataLoaders = [
  { key: 'items', loader: () => this.services.data.loadItemData() },
  { key: 'monsters', loader: () => this.services.data.loadMonsterData() },
  { key: 'equipmentSets', loader: () => this.services.data.loadEquipmentSetData() },
  { key: 'skills', loader: () => this.services.data.loadSkillInfoData() },
  { key: 'quests', loader: () => this.services.data.loadQuestData() },
  { key: 'classConfig', loader: () => this.services.data.loadClassConfig() },
  { key: 'skillConfig', loader: () => this.services.data.loadSkillConfig() },
  { key: 'maps', loader: () => this.services.data.loadMapData() },
  { key: 'npcs', loader: () => this.services.data.loadNpcData() },
  { key: 'diamondShopItems', loader: () => this.services.data.loadDiamondShopItems() }
]

const allResults = await Promise.all(
  dataLoaders.map(async ({ key, loader }) => {
    try {
      const data = await loader()
      this.state.gameData[key] = data
      console.log(`[StaticGameInitializer] ${key} 加载完成`)
      return { key, success: true }
    } catch (error) {
      console.error(`[StaticGameInitializer] 加载${key}失败:`, error)
      this.state.gameData[key] = this.getDefaultData(key)
      return { key, success: false, error }
    }
  })
)
```

**步骤 2**: 同步数据到 Pinia Stores（关键步骤）

```javascript
console.log('[StaticGameInitializer] 开始同步数据到Pinia Stores...')
const itemsStore = useItemsStore()
const monstersStore = useMonstersStore()
const skillsStore = useSkillsStore()

// 优化：冻结静态数据，避免 Vue 追踪其变化，提高性能
itemsStore.staticItems = Object.freeze(this.state.gameData.items)
itemsStore.diamondShopItems = Object.freeze(this.state.gameData.diamondShopItems)
monstersStore.staticMonsters = Object.freeze(this.state.gameData.monsters)
skillsStore.staticSkills = Object.freeze(this.state.gameData.skills)
console.log('[StaticGameInitializer] 所有数据同步完成')

const gameStore = useGameStore()
gameStore.updateEquipmentSets(this.state.gameData.equipmentSets)
```

### 3. 玩家数据初始化流程

**方法**: `initPlayerData()`

**步骤 1**: 加载玩家存档数据

```javascript
const saveData = this.services.storage.loadPlayerData()

if (!saveData) {
  console.error('[StaticGameInitializer] 无法加载玩家数据')
  throw new Error('无法加载玩家数据')
}

this.state.player = new Player(this.preparePlayerData(saveData))
this.state.player.applyFinalStats(this.state.gameData.equipmentSets)
```

**步骤 2**: 同步玩家数据到 playerStore

```javascript
const playerStore = usePlayerStore()
playerStore.setPlayer(this.state.player)
console.log('[StaticGameInitializer] 已同步玩家数据到 playerStore')
```

**步骤 3**: 修复并同步背包和装备数据到 itemsStore

```javascript
this.fixPlayerItems()

// fixPlayerItems() 内部实现
fixPlayerItems() {
  const { player, gameData } = this.state

  if (player.bag && player.bag.length > 0) {
    player.bag = this.fixItems(player.bag, gameData.items)
  }

  const itemsStore = useItemsStore()

  if (player.bag) {
    itemsStore.playerBag = player.bag
    console.log('[StaticGameInitializer] 已同步背包数据到 itemsStore，数量:', player.bag.length)
  }

  if (player.equipment) {
    const equipmentMap = {
      weapon: player.equipment.weapon || null,
      shield: player.equipment.shield || null,
      helmet: player.equipment.helmet || null,
      armor: player.equipment.armor || null,
      gloves: player.equipment.gloves || null,
      boots: player.equipment.boots || null,
      necklace: player.equipment.necklace || null,
      ring1: player.equipment.ring1 || null,
      ring2: player.equipment.ring2 || null,
      earring1: player.equipment.earring1 || null,
      earring2: player.equipment.earring2 || null
    }
    itemsStore.equipment = equipmentMap
    console.log('[StaticGameInitializer] 已同步装备数据到 itemsStore')
  }
}
```

**步骤 4**: 初始化并同步玩家技能到 skillsStore

```javascript
this.initPlayerSkills()

// initPlayerSkills() 内部实现
initPlayerSkills() {
  const { player, gameData } = this.state
  const skillConfig = gameData.skillConfig?.SKILL_CONFIG || gameData.skillConfig
  const classSkills = skillConfig[player.class]

  if (!classSkills) {
    console.warn(`职业 ${player.class} 没有技能配置`)
    player.skills = {}
    return
  }

  player.skills = {}

  Object.entries(classSkills).forEach(([key, baseSkill]) => {
    player.skills[key] = this.createSkillObject(baseSkill)
  })

  this.applySavedSkills(player.skills)
  this.services.storage.savePlayerSkills(player.skills)

  const skillsStore = useSkillsStore()
  const skillsArray = Object.keys(player.skills).map(key => {
    const skill = player.skills[key]
    return {
      id: skill.id || skill.key || key,
      key,
      name: skill.name,
      icon: skill.icon,
      type: skill.type,
      damage: skill.damage,
      mpCost: skill.manaCost,
      cooldown: skill.cd,
      castTime: 0,
      range: 0,
      description: skill.description
    }
  })
  skillsStore.playerSkills = skillsArray
  console.log('[StaticGameInitializer] 已同步玩家技能到 skillsStore，数量:', skillsArray.length)
}
```

**步骤 5**: 设置当前地图到 mapsStore

```javascript
this.setCurrentMap()

// setCurrentMap() 内部实现
setCurrentMap() {
  const mapsStore = useMapsStore()
  const { player } = this.state

  const defaultMap = {
    name: '帕里大陆',
    levelRange: '1-20',
    background: '/pt/map/pl.png',
    description: '新手区域，适合1-20级玩家'
  }

  mapsStore.setCurrentMap(defaultMap)
  console.log('[StaticGameInitializer] 已设置当前地图:', defaultMap.name)
}
```

### 4. 数据初始化流程图

```
StaticGameInitializer.initGame()
    ↓
    ├─ validateUserData() - 验证用户数据
    ↓
    ├─ loadGameData() - 加载静态数据
    │   ├─ StaticDataService.loadItemData()
    │   ├─ StaticDataService.loadMonsterData()
    │   ├─ StaticDataService.loadSkillInfoData()
    │   ├─ StaticDataService.loadMapData()
    │   └─ ... 其他数据加载
    ↓
    ├─ Object.freeze() - 冻结静态数据
    ↓
    ├─ 同步到 Pinia Stores
    │   ├─ itemsStore.staticItems = Object.freeze(items)
    │   ├─ itemsStore.diamondShopItems = Object.freeze(diamondShopItems)
    │   ├─ monstersStore.staticMonsters = Object.freeze(monsters)
    │   ├─ skillsStore.staticSkills = Object.freeze(skills)
    │   └─ gameStore.updateEquipmentSets(equipmentSets)
    ↓
    ├─ initPlayerData() - 初始化玩家数据
    │   ├─ playerStore.setPlayer(player)
    │   ├─ itemsStore.playerBag = player.bag
    │   ├─ itemsStore.equipment = player.equipment
    │   ├─ skillsStore.playerSkills = skills
    │   └─ mapsStore.setCurrentMap(map)
    ↓
    ├─ initGameSystems() - 初始化游戏系统
    ↓
    └─ startGameLoop() - 启动游戏循环
```

---

## 三、Store 详细说明

### 1. useItemsStore - 物品管理

**文件**: `src/store/items.js`

**State**:
```javascript
state: () => ({
  // 静态数据（已冻结）
  staticItems: [],           // 静态物品数据
  diamondShopItems: [],      // 钻石商店数据

  // 运行时数据
  playerBag: [],             // 玩家背包
  equipment: {               // 装备栏
    weapon: null,
    shield: null,
    helmet: null,
    armor: null,
    gloves: null,
    boots: null,
    necklace: null,
    ring1: null,
    ring2: null,
    earring1: null,
    earring2: null
  },
  bagCapacity: 165,         // 背包容量
  equipmentSets: [],        // 装备套装数据
  isBagFull: false          // 背包是否已满
})
```

**Getters**:
```javascript
getters: {
  bagUsageRate: state => Math.round((state.playerBag.length / state.bagCapacity) * 100),
  availableSlots: state => Math.max(0, state.bagCapacity - state.playerBag.length),
  usedSlots: state => state.playerBag.length,
  getItemConfig: state => itemId => { /* 根据ID获取物品配置 */ },
  getBagItemsByCategory: state => category => { /* 根据类型筛选背包物品 */ },
  getBagItemsByRarity: state => rarity => { /* 根据稀有度筛选背包物品 */ },
  hasEquipment: state => slotId => { /* 检查装备栏是否有装备 */ },
  equippedCount: state => Object.values(state.equipment).filter(item => item !== null).length
}
```

**Actions**:
```javascript
actions: {
  // 静态数据管理
  loadStaticData(itemsData) { /* 加载静态物品数据 */ },
  loadEquipmentSets(setsData) { /* 加载装备套装数据 */ },

  // 背包管理
  addItemToBag(itemId, quantity) { /* 添加物品到背包 */ },
  removeItemFromBag(itemId, quantity) { /* 从背包移除物品 */ },
  clearBag() { /* 清空背包 */ },

  // 装备管理
  equipItem(itemId, slotId) { /* 装备物品 */ },
  unequipItem(slotId) { /* 卸下装备 */ },

  // 物品操作
  useItem(itemId) { /* 使用物品 */ },
  sellItem(itemId, quantity) { /* 出售物品 */ },

  // 批量更新（性能优化）
  updatePlayerBag(newBag) { /* 更新背包数据 */ },
  updateEquipment(newEquipment) { /* 更新装备数据 */ }
}
```

**使用示例**:
```javascript
import { useItemsStore } from '@/store/items'

const itemsStore = useItemsStore()

// 获取物品配置
const itemConfig = itemsStore.getItemConfig(itemId)

// 添加物品到背包
itemsStore.addItemToBag(itemId, 1)

// 装备物品
itemsStore.equipItem(itemId, 'weapon')

// 卸下装备
itemsStore.unequipItem('weapon')

// 获取背包使用率
const usageRate = itemsStore.bagUsageRate

// 获取剩余格子数
const availableSlots = itemsStore.availableSlots
```

### 2. useMonstersStore - 怪物管理

**文件**: `src/store/monsters.js`

**State**:
```javascript
state: () => ({
  staticMonsters: {},      // 静态怪物数据（已冻结）
  currentMonsters: [],     // 当前怪物列表
  selectedMonster: null    // 选中的怪物
})
```

**Getters**:
```javascript
getters: {
  getMonsterConfig: state => monsterId => { /* 根据ID获取怪物配置 */ },
  getMonstersByMap: state => mapName => { /* 根据地图筛选怪物 */ },
  getMonstersByLevel: state => level => { /* 根据等级筛选怪物 */ }
}
```

**Actions**:
```javascript
actions: {
  loadStaticData(monstersData) { /* 加载静态怪物数据 */ },
  setCurrentMonsters(monsters) { /* 设置当前怪物 */ },
  clearCurrentMonsters() { /* 清空当前怪物 */ },
  updateMonster(monsterId, updates) { /* 更新怪物数据 */ }
}
```

**使用示例**:
```javascript
import { useMonstersStore } from '@/store/monsters'

const monstersStore = useMonstersStore()

// 获取怪物配置
const monsterConfig = monstersStore.getMonsterConfig(monsterId)

// 设置当前怪物
monstersStore.setCurrentMonsters(monsters)

// 清空当前怪物
monstersStore.clearCurrentMonsters()
```

### 3. useSkillsStore - 技能管理

**文件**: `src/store/skills.js`

**State**:
```javascript
state: () => ({
  staticSkills: [],           // 静态技能配置数据（已冻结）
  playerSkills: [],          // 玩家已学习的技能
  skillCooldowns: {},         // 技能冷却时间
  skillProficiency: {},      // 技能熟练度
  activeSkillEffects: []     // 当前激活的技能效果
})
```

**Getters**:
```javascript
getters: {
  getSkillConfig: state => skillId => { /* 根据ID获取技能配置 */ },
  getLearnedSkill: state => skillId => { /* 获取玩家已学习的技能 */ },
  isSkillLearned: state => skillId => { /* 检查技能是否已学习 */ },
  isSkillAvailable: state => skillId => { /* 检查技能是否可用 */ },
  getSkillCooldownRemaining: state => skillId => { /* 获取技能冷却剩余时间 */ },
  getSkillProficiency: state => skillId => { /* 获取技能熟练度 */ },
  getSkillsByClass: state => className => { /* 根据职业筛选技能 */ }
}
```

**Actions**:
```javascript
actions: {
  loadStaticData(skillsData) { /* 加载静态技能数据 */ },
  learnSkill(skillId) { /* 学习技能 */ },
  useSkill(skillId) { /* 使用技能 */ },
  setCooldown(skillId, duration) { /* 设置技能冷却 */ },
  clearCooldown(skillId) { /* 清除技能冷却 */ },
  clearAllCooldowns() { /* 清除所有技能冷却 */ },
  increaseProficiency(skillId, amount) { /* 增加技能熟练度 */ },
  setProficiency(skillId, level) { /* 设置技能熟练度 */ },
  forgetSkill(skillId) { /* 忘记技能 */ },
  addSkillEffect(effect) { /* 添加技能效果 */ },
  removeSkillEffect(effectId) { /* 移除技能效果 */ },
  updateSkillConfig(skillId, updates) { /* 更新技能配置 */ }
}
```

**使用示例**:
```javascript
import { useSkillsStore } from '@/store/skills'

const skillsStore = useSkillsStore()

// 获取技能配置
const skillConfig = skillsStore.getSkillConfig(skillId)

// 学习技能
skillsStore.learnSkill(skillId)

// 使用技能
skillsStore.useSkill(skillId)

// 检查技能是否可用
const isAvailable = skillsStore.isSkillAvailable(skillId)

// 获取技能冷却剩余时间
const remainingTime = skillsStore.getSkillCooldownRemaining(skillId)
```

### 4. useMapsStore - 地图管理

**文件**: `src/store/maps.js`

**State**:
```javascript
state: () => ({
  currentMap: null,        // 当前地图
  availableMaps: [],        // 可用地图列表
  mapHistory: []           // 地图切换历史
})
```

**Getters**:
```javascript
getters: {
  getCurrentMapInfo: state => state.currentMap,
  getRecommendedMaps: state => playerLevel => { /* 根据等级获取推荐地图 */ },
  isMapUnlocked: state => mapName => { /* 检查地图是否解锁 */ },
  getMapLevelRange: state => mapName => { /* 获取地图等级范围 */ }
}
```

**Actions**:
```javascript
actions: {
  setCurrentMap(map) { /* 设置当前地图 */ },
  changeMap(mapName) { /* 切换到指定地图 */ },
  goToPreviousMap() { /* 返回上一个地图 */ },
  loadMaps(mapsData) { /* 加载地图列表 */ },
  addCustomMap(map) { /* 添加自定义地图 */ },
  resetToDefaultMap() { /* 重置到默认地图 */ }
}
```

**使用示例**:
```javascript
import { useMapsStore } from '@/store/maps'

const mapsStore = useMapsStore()

// 获取当前地图信息
const currentMap = mapsStore.getCurrentMapInfo

// 切换地图
mapsStore.changeMap('晨光大陆')

// 获取推荐地图
const recommendedMaps = mapsStore.getRecommendedMaps(playerLevel)

// 获取地图等级范围
const levelRange = mapsStore.getMapLevelRange('帕里大陆')
```

### 5. usePlayerStore - 玩家管理

**文件**: `src/store/player.js`

**State**:
```javascript
state: () => ({
  player: new Player(),     // 玩家数据
  isDead: false,            // 玩家死亡状态
  isOnline: false,          // 玩家在线状态
  totalPlayTime: 0,         // 总游戏时间
  totalMonstersKilled: 0,   // 总击杀怪物数
  totalGoldEarned: 0        // 总获得金币数
})
```

**Getters**:
```javascript
getters: {
  playerClassName: state => { /* 获取玩家职业中文名 */ },
  playerAvatar: state => { /* 获取玩家头像路径 */ },
  healthPercentage: state => { /* 获取生命值百分比 */ },
  manaPercentage: state => { /* 获取魔法值百分比 */ },
  expPercentage: state => { /* 获取经验值百分比 */ },
  availableStatPoints: state => { /* 获取可用属性点 */ }
}
```

**Actions**:
```javascript
actions: {
  updatePlayer(updates) { /* 更新玩家数据 */ },
  setPlayer(player) { /* 设置玩家数据 */ },
  addExp(amount) { /* 添加经验 */ },
  levelUp() { /* 升级 */ },
  takeDamage(amount) { /* 受到伤害 */ },
  heal(amount) { /* 恢复生命 */ },
  consumeMana(amount) { /* 消耗魔法 */ },
  restoreMana(amount) { /* 恢复魔法 */ },
  updateGold(amount) { /* 更新金币 */ },
  allocateStat(stat, amount) { /* 分配属性点 */ },
  removeStat(stat, amount) { /* 移除属性点 */ },
  equipItem(item) { /* 装备物品 */ },
  unequipItem(slot) { /* 卸下装备 */ },
  addBuff(buff) { /* 添加 BUFF */ },
  removeBuff(buffId) { /* 移除 BUFF */ },
  clearAllBuffs() { /* 清除所有 BUFF */ },
  resurrect() { /* 复活 */ },
  setDead(isDead) { /* 设置死亡状态 */ },
  incrementKills() { /* 更新统计数据 */ },
  resetPlayer() { /* 重置玩家 */ }
}
```

**使用示例**:
```javascript
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()

// 添加经验
playerStore.addExp(100)

// 受到伤害
playerStore.takeDamage(50)

// 恢复生命
playerStore.heal(100)

// 分配属性点
playerStore.allocateStat('strength', 5)

// 获取生命值百分比
const healthPercent = playerStore.healthPercentage

// 获取玩家职业中文名
const className = playerStore.playerClassName
```

### 6. useGameStore - 游戏全局管理

**文件**: `src/store/index.js`

**State**:
```javascript
state: () => ({
  player: new Player(),
  battle: {
    currentMap: '帕里大陆',
    mapLevelRange: '1-20',
    status: '等待战斗...',
    isAutoBattle: false,
    expMultiplier: 1.0,
    dropRate: 1.0
  },
  skills: {
    Q: { cd: 0, proficiency: 1, progress: 0 },
    W: { cd: 0, proficiency: 1, progress: 0 },
    E: { cd: 0, proficiency: 1, progress: 0 },
    R: { cd: 0, proficiency: 1, progress: 0 },
    T: { cd: 0, proficiency: 1, progress: 0 },
    Y: { cd: 0, proficiency: 1, progress: 0 },
    U: { cd: 0, proficiency: 1, progress: 0 },
    I: { cd: 0, proficiency: 1, progress: 0 },
    O: { cd: 0, proficiency: 1, progress: 0 },
    P: { cd: 0, proficiency: 1, progress: 0 }
  },
  inventory: {
    items: [],
    capacity: 165,
    used: 0
  },
  equipment: {
    weapon: null,
    shield: null,
    helmet: null,
    armor: null,
    gloves: null,
    boots: null,
    necklace: null,
    ring1: null,
    ring2: null,
    earring1: null,
    earring2: null
  },
  quests: {
    active: [],
    completed: []
  },
  settings: {
    volume: 1.0,
    sfxVolume: 1.0,
    monsterSfxVolume: 1.0,
    monsterMaxLevel: 14,
    monsterDisplayCount: 5,
    showDamageEffect: true,
    autoSaveInterval: 30,
    autoSellInterval: 5,
    autoHpRecoveryPercent: 50,
    autoMpRecoveryPercent: 50
  },
  equipmentSets: []
})
```

**Getters**:
```javascript
getters: {
  playerStats: state => { /* 计算玩家属性 */ },
  inventoryUsage: state => { /* 获取背包使用率 */ },
  setBonuses: state => { /* 计算套装属性加成 */ }
}
```

**Actions**:
```javascript
actions: {
  updatePlayer(data, equipmentSets) { /* 更新玩家信息 */ },
  setPlayer(playerData, equipmentSets) { /* 完整替换玩家数据 */ },
  updateBattle(data) { /* 更新战斗状态 */ },
  updateSkill(skillKey, data) { /* 更新技能信息 */ },
  addItem(item) { /* 添加物品到背包 */ },
  removeItem(itemId) { /* 移除背包物品 */ },
  equipItem(slot, item) { /* 装备物品 */ },
  unequipItem(slot) { /* 卸下装备 */ },
  updateSettings(data) { /* 更新设置 */ },
  updateEquipmentSets(data) { /* 更新套装数据 */ }
}
```

**使用示例**:
```javascript
import { useGameStore } from '@/store'

const gameStore = useGameStore()

// 更新战斗状态
gameStore.updateBattle({ status: '战斗中', isAutoBattle: true })

// 更新技能信息
gameStore.updateSkill('Q', { cd: 5, proficiency: 2 })

// 更新设置
gameStore.updateSettings({ volume: 0.8, autoSaveInterval: 60 })

// 更新套装数据
gameStore.updateEquipmentSets(equipmentSets)
```

---

## 四、组件中使用 Pinia Store

### 1. 基本使用方式

```vue
<script setup>
import { useItemsStore } from '@/store/items'
import { usePlayerStore } from '@/store/player'
import { computed } from 'vue'

// 获取 Store 实例
const itemsStore = useItemsStore()
const playerStore = usePlayerStore()

// 使用 State
const playerBag = computed(() => itemsStore.playerBag)

// 使用 Getters
const bagUsageRate = computed(() => itemsStore.bagUsageRate)
const healthPercentage = computed(() => playerStore.healthPercentage)

// 使用 Actions
const addItemToBag = (itemId) => {
  itemsStore.addItemToBag(itemId, 1)
}

const equipItem = (itemId, slotId) => {
  itemsStore.equipItem(itemId, slotId)
}
</script>

<template>
  <div>
    <p>背包使用率: {{ bagUsageRate }}%</p>
    <p>生命值: {{ healthPercentage }}%</p>
    <button @click="addItemToBag(1001)">添加物品</button>
  </div>
</template>
```

### 2. 组合式函数中使用

```javascript
// src/composables/useUnifiedSkills.js
import { useSkillsStore } from '@/store/skills'
import { computed } from 'vue'

export function useUnifiedSkills() {
  const skillsStore = useSkillsStore()

  const skills = computed(() => skillsStore.playerSkills)
  const skillTooltip = computed(() => skillsStore.skillTooltip)
  const playerClass = computed(() => skillsStore.playerClass)

  const initSkills = (player, gameData) => {
    // 初始化技能逻辑
  }

  const useSkill = (skillKey, player, gameInitializer, monsters, activeBuffs, addBattleLog, showDamageNumber) => {
    // 使用技能逻辑
  }

  const showSkillTooltip = (event, skill) => {
    // 显示技能工具提示
  }

  const hideSkillTooltip = () => {
    // 隐藏技能工具提示
  }

  return {
    skills,
    skillTooltip,
    playerClass,
    initSkills,
    useSkill,
    showSkillTooltip,
    hideSkillTooltip
  }
}
```

### 3. Service 中使用

```javascript
// src/services/BagService.js
import { useItemsStore } from '@/store/items'

export class BagService {
  constructor() {
    this.itemsStore = useItemsStore()
  }

  saveBag() {
    const bagData = this.itemsStore.playerBag
    // 保存逻辑
  }

  loadBag(bagData) {
    this.itemsStore.playerBag = bagData
    // 加载逻辑
  }

  addItem(itemId, quantity) {
    return this.itemsStore.addItemToBag(itemId, quantity)
  }

  removeItem(itemId, quantity) {
    return this.itemsStore.removeItemFromBag(itemId, quantity)
  }
}
```

---

## 五、性能优化最佳实践

### 1. 静态数据冻结

**规则**: 使用 `Object.freeze()` 冻结所有静态数据，Vue 不会追踪变化，减少深度比较开销

**实现**:
```javascript
// 在 StaticGameInitializer.loadGameData() 中
itemsStore.staticItems = Object.freeze(this.state.gameData.items)
itemsStore.diamondShopItems = Object.freeze(this.state.gameData.diamondShopItems)
monstersStore.staticMonsters = Object.freeze(this.state.gameData.monsters)
skillsStore.staticSkills = Object.freeze(this.state.gameData.skills)
```

**性能提升**:
- 背包点击物品操作响应速度：4s → 600ms（提升约 6.7 倍）
- 深度比较开销：显著减少
- Vue 响应式追踪：仅追踪运行时数据，不追踪静态数据

### 2. 批量更新 State

**规则**: 使用 `$patch()` 方法批量更新 state，只触发一次响应式更新

**实现**:
```javascript
// ❌ 错误：多次更新，触发多次响应式更新
this.playerBag.push(item1)
this.playerBag.push(item2)
this.equipment.weapon = weapon

// ✅ 正确：批量更新，只触发一次响应式更新
this.$patch((state) => {
  state.playerBag.push(item1)
  state.playerBag.push(item2)
  state.equipment.weapon = weapon
})
```

### 3. 使用 Computed 计算属性

**规则**: 使用 computed 计算属性处理静态数据，避免重复计算

**实现**:
```javascript
// ❌ 错误：每次访问都重新计算
const getBagItemsByCategory = (category) => {
  return itemsStore.playerBag.filter(item => item.category === category)
}

// ✅ 正确：使用 computed，自动缓存
const bagItemsByCategory = computed(() => {
  return itemsStore.playerBag.filter(item => item.category === category)
})
```

### 4. 避免深度监听

**规则**: 只监听需要的属性，避免深度监听大型对象

**实现**:
```javascript
// ❌ 错误：深度监听大型对象
watch(
  () => props.player?.quest,
  () => { /* ... */ },
  { deep: true }
)

// ✅ 正确：只监听需要的属性
watch(
  [() => props.player?.quest?.activeQuests, () => props.player?.quest?.completedQuests],
  () => { /* ... */ },
  { deep: false }
)
```

---

## 六、常见使用场景

### 场景 1：获取玩家信息

```javascript
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()

// 获取玩家职业中文名
const className = playerStore.playerClassName

// 获取玩家头像路径
const avatar = playerStore.playerAvatar

// 获取生命值百分比
const healthPercent = playerStore.healthPercentage

// 获取魔法值百分比
const manaPercent = playerStore.manaPercentage

// 获取经验值百分比
const expPercent = playerStore.expPercentage

// 获取可用属性点
const statPoints = playerStore.availableStatPoints
```

### 场景 2：玩家操作

```javascript
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()

// 添加经验
playerStore.addExp(100)

// 升级
playerStore.levelUp()

// 受到伤害
playerStore.takeDamage(50)

// 恢复生命
playerStore.heal(100)

// 消耗魔法
playerStore.consumeMana(20)

// 恢复魔法
playerStore.restoreMana(30)

// 更新金币
playerStore.updateGold(1000)

// 分配属性点
playerStore.allocateStat('strength', 5)

// 移除属性点
playerStore.removeStat('strength', 5)

// 添加 BUFF
playerStore.addBuff({ id: 'buff1', name: '攻击力提升', duration: 60000 })

// 移除 BUFF
playerStore.removeBuff('buff1')

// 清除所有 BUFF
playerStore.clearAllBuffs()

// 复活
playerStore.resurrect()

// 设置死亡状态
playerStore.setDead(true)

// 更新统计数据
playerStore.incrementKills()
```

### 场景 3：技能操作

```javascript
import { useSkillsStore } from '@/store/skills'

const skillsStore = useSkillsStore()

// 获取技能配置
const skillConfig = skillsStore.getSkillConfig(skillId)

// 检查技能是否已学习
const isLearned = skillsStore.isSkillLearned(skillId)

// 学习技能
skillsStore.learnSkill(skillId)

// 使用技能
skillsStore.useSkill(skillId)

// 检查技能是否可用
const isAvailable = skillsStore.isSkillAvailable(skillId)

// 获取技能冷却剩余时间
const remainingTime = skillsStore.getSkillCooldownRemaining(skillId)

// 获取技能熟练度
const proficiency = skillsStore.getSkillProficiency(skillId)

// 增加技能熟练度
skillsStore.increaseProficiency(skillId, 10)

// 设置技能熟练度
skillsStore.setProficiency(skillId, 5)

// 忘记技能
skillsStore.forgetSkill(skillId)

// 清除技能冷却
skillsStore.clearCooldown(skillId)

// 清除所有技能冷却
skillsStore.clearAllCooldowns()
```

### 场景 4：地图操作

```javascript
import { useMapsStore } from '@/store/maps'

const mapsStore = useMapsStore()

// 获取当前地图信息
const currentMap = mapsStore.getCurrentMapInfo

// 切换地图
mapsStore.changeMap('晨光大陆')

// 返回上一个地图
mapsStore.goToPreviousMap()

// 获取推荐地图
const recommendedMaps = mapsStore.getRecommendedMaps(playerLevel)

// 检查地图是否解锁
const isUnlocked = mapsStore.isMapUnlocked('晨光大陆')

// 获取地图等级范围
const levelRange = mapsStore.getMapLevelRange('帕里大陆')

// 添加自定义地图
mapsStore.addCustomMap({
  name: '自定义地图',
  levelRange: '1-10',
  background: '/pt/map/custom.png'
})

// 重置到默认地图
mapsStore.resetToDefaultMap()
```

### 场景 5：物品操作

```javascript
import { useItemsStore } from '@/store/items'

const itemsStore = useItemsStore()

// 获取物品配置
const itemConfig = itemsStore.getItemConfig(itemId)

// 添加物品到背包
itemsStore.addItemToBag(itemId, 1)

// 从背包移除物品
itemsStore.removeItemFromBag(itemId, 1)

// 装备物品
itemsStore.equipItem(itemId, 'weapon')

// 卸下装备
itemsStore.unequipItem('weapon')

// 使用物品
itemsStore.useItem(itemId)

// 出售物品
itemsStore.sellItem(itemId, 1)

// 清空背包
itemsStore.clearBag()

// 获取背包使用率
const usageRate = itemsStore.bagUsageRate

// 获取剩余格子数
const availableSlots = itemsStore.availableSlots

// 获取已使用格子数
const usedSlots = itemsStore.usedSlots

// 根据类型筛选背包物品
const weapons = itemsStore.getBagItemsByCategory('weapon')

// 根据稀有度筛选背包物品
const legendaryItems = itemsStore.getBagItemsByRarity('legendary')

// 检查装备栏是否有装备
const hasWeapon = itemsStore.hasEquipment('weapon')

// 获取装备的物品数量
const equippedCount = itemsStore.equippedCount
```

---

## 七、禁止的旧代码模式

### ❌ 禁止：直接使用 gameData.value

```javascript
// ❌ 禁止
const item = gameData.value.items?.find(i => i.id === itemId)
const player = gameData.value.player
const monsters = gameData.value.monsters
const skills = gameData.value.skills
const map = gameData.value.map
```

### ❌ 禁止：使用 window 全局变量

```javascript
// ❌ 禁止
const item = window.gameInitializer?.state?.items?.[itemId]
const item = window.itemData?.[itemId]
window.playClickSound()
```

### ❌ 禁止：解冻静态数据进行比对

```javascript
// ❌ 禁止
const unfrozenItems = JSON.parse(JSON.stringify(itemsStore.staticItems))
const result = unfrozenItems.find(item => item.id === itemId)
```

### ❌ 禁止：修改已冻结的静态数据

```javascript
// ❌ 禁止
itemsStore.staticItems.push(newItem)
itemsStore.staticItems[0].name = '新名称'
```

### ❌ 禁止：对静态数据使用深度监听

```javascript
// ❌ 禁止
watch(
  () => itemsStore.staticItems,
  () => { /* ... */ },
  { deep: true }
)
```

### ❌ 禁止：在组件中对静态数据进行响应式包装

```javascript
// ❌ 禁止
const reactiveItems = reactive(itemsStore.staticItems)
const refItems = ref(itemsStore.staticItems)
```

---

## 八、正确的代码模式

### ✅ 正确：使用 Pinia Store

```javascript
// ✅ 正确
import { useItemsStore } from '@/store/items'
import { usePlayerStore } from '@/store/player'

const itemsStore = useItemsStore()
const playerStore = usePlayerStore()

const itemConfig = itemsStore.getItemConfig(itemId)
const player = playerStore.player
const monsters = monstersStore.staticMonsters
const skills = skillsStore.playerSkills
const map = mapsStore.currentMap
```

### ✅ 正确：使用 Object.freeze() 冻结静态数据

```javascript
// ✅ 正确
itemsStore.staticItems = Object.freeze(itemsData)
monstersStore.staticMonsters = Object.freeze(monstersData)
skillsStore.staticSkills = Object.freeze(skillsData)
```

### ✅ 正确：直接读取静态数据

```javascript
// ✅ 正确
const itemConfig = itemsStore.getItemConfig(itemId)
const monsterConfig = monstersStore.getMonsterConfig(monsterId)
const skillConfig = skillsStore.getSkillConfig(skillId)
```

### ✅ 正确：使用 computed 计算属性

```javascript
// ✅ 正确
const bagItemsByCategory = computed(() => {
  return itemsStore.playerBag.filter(item => item.category === category)
})
```

### ✅ 正确：使用 $patch() 批量更新

```javascript
// ✅ 正确
this.$patch((state) => {
  state.playerBag.push(item1)
  state.playerBag.push(item2)
  state.equipment.weapon = weapon
})
```

---

## 九、总结

### Pinia Store 核心优势

1. **统一数据源**: 所有数据通过 Pinia Stores 管理，确保数据一致性
2. **性能优化**: 使用 `Object.freeze()` 冻结静态数据，减少深度比较开销
3. **类型安全**: Pinia Store 有类型定义，避免 `window` 对象的类型安全问题
4. **可维护性**: 不再依赖多个全局对象，统一使用 Pinia Store
5. **响应式**: 自动响应式更新，无需手动触发

### 数据访问优先级

| 优先级 | 访问方式 | 说明 |
|-------|---------|------|
| 1 | Pinia Store | 推荐使用，统一数据源 |
| 2 | Computed | 用于计算属性，自动缓存 |
| 3 | Props | 组件间传递数据 |
| X | window.* | 禁止使用 |
| X | gameData.value | 禁止使用 |

### 性能优化要点

1. **静态数据冻结**: 使用 `Object.freeze()` 冻结所有静态数据
2. **批量更新**: 使用 `$patch()` 方法批量更新 state
3. **计算属性**: 使用 computed 计算属性处理静态数据
4. **避免深度监听**: 只监听需要的属性，避免深度监听大型对象

### 禁止操作清单

- ❌ 解冻静态数据进行比对
- ❌ 修改已冻结的静态数据
- ❌ 对静态数据使用深度监听（deep watch）
- ❌ 在组件中对静态数据进行响应式包装
- ❌ 使用 `window.*` 全局变量
- ❌ 使用 `gameData.value` 直接访问数据

### 正确操作清单

- ✅ 使用 `Object.freeze()` 冻结所有静态数据
- ✅ 直接读取静态数据，不进行响应式包装
- ✅ 使用 computed 计算属性处理静态数据
- ✅ 在 Pinia Store 中冻结静态数据后加载到 state
- ✅ 使用 Pinia Store 访问所有数据
- ✅ 使用 `$patch()` 批量更新 state

**Pinia 数据源统一管理的架构已基本完成**，所有数据现在都通过 Pinia Stores 进行管理，确保了数据一致性和可维护性。
