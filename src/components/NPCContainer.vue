<template>
  <div class="map-display">
    <div v-if="props.showNpc" class="npc-container">
      <!-- 职业转换NPC -->
      <div class="npc-item" :class="{ 'job-change-hint': shouldShowJobChangeHint }" @click="openJobChangeDialogue">
        <div class="npc-icon-wrapper">
          <img src="/pt/npc_icon/lui.png" alt="职业导师" class="npc-icon" title="职业导师" draggable="false" />
          <div v-if="shouldShowJobChangeHint" class="job-hint-indicator">?</div>
        </div>
        <span class="npc-name">职业进阶导师-路易</span>
      </div>
      <div class="npc-item" @click="openPetTrainerDialogue">
        <img
          src="/pt/npc_icon/pettamer.png"
          alt="宠物训练师"
          class="npc-icon"
          title="宠物训练师"
          draggable="false"
        />
        <span class="npc-name">宠物训练师</span>
      </div>
      <div v-for="npc in mapNpcGroups.primary" :key="npc.key" class="npc-item" :class="{ 'quest-hint': npc.key === 'quest' && shouldShowQuestHint }" @click="npc.action">
        <div class="npc-icon-wrapper">
          <img :src="npc.icon" :alt="npc.name" class="npc-icon" :title="npc.name" draggable="false" />
          <div v-if="npc.key === 'quest' && shouldShowQuestHint" class="quest-hint-indicator">?</div>
        </div>
        <span class="npc-name">{{ npc.name }}</span>
      </div>
      <div v-if="currentMap?.name === '帕里大陆'" class="npc-item" @click="openTowerDialogue">
        <img
          src="/pt/npc_icon/knight01.png"
          alt="深渊之塔管理员"
          class="npc-icon"
          title="深渊之塔管理员"
          draggable="false"
        />
        <span class="npc-name">深渊之塔管理员</span>
      </div>
      <!-- 珠宝大师-皮奇NPC -->
      <div v-if="currentMap?.name === '帕里大陆'" class="npc-item" @click="openJewelryMasterDialogue">
        <img
          src="/pt/npc_icon/remine.png"
          alt="珠宝大师-皮奇"
          class="npc-icon"
          title="珠宝大师-皮奇"
          draggable="false"
        />
        <span class="npc-name">💎珠宝大师-皮奇</span>
      </div>
      <!-- 大师进阶-蕾拉NPC（仅达肯3大陆显示） -->
      <div v-if="currentMap?.name === '达肯3大陆'" class="npc-item" @click="openMasterQuestDialogue">
        <img
          src="/pt/npc_icon/hendel.png"
          alt="[大师进阶]蕾拉"
          class="npc-icon"
          title="[大师进阶]蕾拉"
          draggable="false"
        />
        <span class="npc-name">[大师进阶]蕾拉</span>
      </div>
      <!-- 钻石商店-瑞多斯NPC -->
      <div class="npc-item" @click="openDiamondShopDialogue">
        <img
          src="/pt/npc_icon/reodos.png"
          alt="钻石商店-瑞多斯"
          class="npc-icon"
          title="钻石商店-瑞多斯"
          draggable="false"
        />
        <span class="npc-name">💎钻石商店-瑞多斯</span>
      </div>
      <!-- 华弗PK纸片兑换NPC -->
      <div class="npc-item" @click="openHuaFuShopDialogue">
        <img
          src="/pt/npc_icon/waforu.png"
          alt="PK纸片兑换-华弗"
          class="npc-icon"
          title="PK纸片兑换-华弗"
          draggable="false"
        />
        <span class="npc-name">⚔️PK纸片兑换-华弗</span>
      </div>
      <div v-for="npc in mapNpcGroups.shops" :key="npc.key" class="npc-item" @click="npc.action">
        <img :src="npc.icon" :alt="npc.name" class="npc-icon" :title="npc.name" draggable="false" />
        <span class="npc-name">{{ npc.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { StaticDataService } from '@/services/StaticDataService'
import { DialogueService } from '@/services/DialogueService'
import { useMapsStore } from '@/store/maps'

const mapsStore = useMapsStore()

const props = defineProps({
  currentMap: {
    type: Object,
    default: () => ({
      name: '帕里大陆'
    })
  },
  player: {
    type: Object,
    default: () => null
  },
  gameData: {
    type: Object,
    default: () => null
  },
  showNpc: {
    type: Boolean,
    default: true
  }
})

// 使用 ref 存储任务数据
const questsData = ref(null)

// 加载任务数据
const loadQuestsData = async () => {
  // 优先使用 gameData.quests
  if (props.gameData?.quests && Object.keys(props.gameData.quests).length > 0) {
    questsData.value = props.gameData.quests
    return
  }
  
  // 否则从 StaticDataService 加载
  try {
    const staticDataService = new StaticDataService()
    const data = await staticDataService.loadQuestData()
    if (data && Object.keys(data).length > 0) {
      questsData.value = data
    }
  } catch (error) {
    console.error('[NPCContainer] 加载 quests 失败:', error)
  }
}

// 监听 gameData.quests 变化
watch(
  () => props.gameData?.quests,
  (newQuests) => {
    if (newQuests && Object.keys(newQuests).length > 0) {
      questsData.value = newQuests
    }
  },
  { immediate: true, deep: true }
)

// 组件挂载时加载任务数据
onMounted(() => {
  loadQuestsData()
})

// 计算是否应该显示转职提示
// 当玩家等级达到 15、60、166 时显示，转职后不再显示
const shouldShowJobChangeHint = computed(() => {
  if (!props.player) return false
  
  const playerClass = props.player.class || 'beginner'
  const playerLevel = props.player.level || 1
  
  // 判断当前职业阶层（与 jobs.js 中的 JOB_TIER_CONFIG 保持一致）
  // 0转 - 初心者
  const tier0Classes = ['beginner']
  // 1转 - 基础职业
  const tier1Classes = ['warrior', 'priest', 'mage', 'archer']
  // 2转 - 进阶职业
  const tier2Classes = ['knight', 'blade_warrior', 'element_mage', 'spirit_mage', 'ranger', 'assassin', 'guardian', 'technician']
  // 3转 - 高级职业
  const tier3Classes = ['holy_knight', 'storm_walker', 'arcane_master', 'mind_master', 'nature_messenger', 'combat_master', 'fierce_shooter', 'joker_emperor']
  
  let currentTier = 0
  if (tier0Classes.includes(playerClass)) {
    currentTier = 0
  } else if (tier1Classes.includes(playerClass)) {
    currentTier = 1
  } else if (tier2Classes.includes(playerClass)) {
    currentTier = 2
  } else if (tier3Classes.includes(playerClass)) {
    currentTier = 3
  }
  
  // 根据当前阶层判断是否可以转职
  // 0阶 → 1阶: 需要15级
  // 1阶 → 2阶: 需要60级
  // 2阶 → 3阶: 需要166级
  // 如果已经是3阶，则不再提示
  if (currentTier === 3) {
    return false
  }
  
  if (currentTier === 0 && playerLevel >= 15) {
    return true
  } else if (currentTier === 1 && playerLevel >= 60) {
    return true
  } else if (currentTier === 2 && playerLevel >= 166) {
    return true
  }
  
  return false
})

// 计算是否应该显示任务提示
// 当玩家等级达到可接取任务的等级要求，且有未接取的任务时显示
// 任务筛选逻辑与 NPCQuestModal 保持一致：根据当前地图等级范围筛选
const shouldShowQuestHint = computed(() => {
  if (!props.player || !questsData.value) return false
  
  const playerLevel = props.player.level || 1
  const activeQuestIds = new Set(props.player.quest?.activeQuests?.map(q => q.id) || [])
  const completedQuestIds = new Set(props.player.quest?.completedQuests?.map(q => q.id) || [])
  
  // 获取当前地图等级范围
  const mapLevelRange = mapsStore.getMapLevelRange(props.currentMap?.name || '帕里大陆')
  
  // 有效NPC的任务ID（任务委托中心）
  const validNpcIds = [29, 4000, 4677, 9645, 17461]
  
  // 筛选当前地图可接取的任务（与 NPCQuestModal 逻辑保持一致）
  const availableQuests = Object.values(questsData.value)
    .filter(quest => validNpcIds.includes(quest.beginNPC))
    // 等级验证：任务最小等级必须在当前地图等级范围内
    .filter(quest => {
      return quest.minLevel >= mapLevelRange.minLevel && quest.minLevel <= mapLevelRange.maxLevel
    })
    // 排除已接取或已完成的任务
    .filter(quest => !activeQuestIds.has(quest.id) && !completedQuestIds.has(quest.id))
    // 玩家等级必须达到任务最低要求
    .filter(quest => playerLevel >= quest.minLevel)
  
  // 如果有可接取的任务，显示提示
  return availableQuests.length > 0
})

const npcMapConfigs = {
  帕里大陆: {
    storage: { name: '仓库-帕里胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 733 },
    quest: { name: '任务委托中心-米歇尔', icon: '/pt/npc_icon/agent.png', npcId: 29 },
    blacksmith: { name: '武器店-波波库', icon: '/pt/npc_icon/boboku.png', npcId: 4239 },
    armor: { name: '防具店-波波克', icon: '/pt/npc_icon/boboku.png', npcId: 1872 },
    food: { name: '食品店-萝夏', icon: '/pt/npc_icon/losha.png', npcId: 4623 },
    magic: { name: '魔法商店-玛尔琪', icon: '/pt/npc_icon/marche.png', npcId: 2150 }
  },
  晨光大陆: {
    storage: { name: '仓库-晨光胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 7216 },
    quest: { name: '任务委托中心-兰科米', icon: '/pt/npc_icon/agent.png', npcId: 4000 },
    blacksmith: { name: '武器店-布鲁克', icon: '/pt/npc_icon/bulrox.png', npcId: 3199 },
    armor: { name: '防具店-波兹曼', icon: '/pt/npc_icon/boboku.png', npcId: 7940 },
    food: { name: '食品店-卡琳', icon: '/pt/npc_icon/karin.png', npcId: 4104 },
    magic: { name: '魔法商店-马丁', icon: '/pt/npc_icon/martin.png', npcId: 349 }
  },
  莱斯大陆: {
    storage: { name: '仓库-莱斯胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 733 },
    quest: { name: '任务委托中心-米歇尔', icon: '/pt/npc_icon/agent.png', npcId: 29 },
    blacksmith: { name: '武器店-波波库', icon: '/pt/npc_icon/boboku.png', npcId: 4239 },
    armor: { name: '防具店-波波克', icon: '/pt/npc_icon/boboku.png', npcId: 1872 },
    food: { name: '食品店-萝夏', icon: '/pt/npc_icon/losha.png', npcId: 4623 },
    magic: { name: '魔法商店-玛尔琪', icon: '/pt/npc_icon/marche.png', npcId: 2150 }
  },
  '达肯1,2大陆': {
    storage: { name: '仓库-达肯1,2胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 6878 },
    quest: { name: '任务委托中心-皮姬', icon: '/pt/npc_icon/agent.png', npcId: 4677 },
    blacksmith: { name: '武器店-雷蒙', icon: '/pt/npc_icon/remine.png', npcId: 3573 },
    armor: { name: '防具店-鲁奇', icon: '/pt/npc_icon/roocky.png', npcId: 5395 },
    food: { name: '食品店-沃尔波尔', icon: '/pt/npc_icon/bolpor.png', npcId: 1686 },
    magic: { name: '魔法商店-哈本', icon: '/pt/npc_icon/haven.png', npcId: 7086 }
  },
  达肯3大陆: {
    storage: { name: '仓库-达肯3胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 1724 },
    quest: { name: '任务委托中心-皮姬', icon: '/pt/npc_icon/agent.png', npcId: 4677 },
    blacksmith: { name: '武器店-卡布洛', icon: '/pt/npc_icon/phacham.png', npcId: 6262 },
    armor: { name: '防具店-查宾', icon: '/pt/npc_icon/phacham.png', npcId: 9705 },
    food: { name: '食品店-卡布洛', icon: '/pt/npc_icon/phacham.png', npcId: 6262 },
    magic: { name: '魔法商店-丹狄', icon: '/pt/npc_icon/phacham.png', npcId: 771 }
  },
  阿兹利亚: {
    storage: { name: '仓库-雪地胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 3653 },
    quest: { name: '任务委托中心-布尔', icon: '/pt/npc_icon/buur.png', npcId: 9645 },
    blacksmith: { name: '武器店-玫然', icon: '/pt/npc_icon/mawrang.png', npcId: 1215 },
    armor: { name: '防具店-奥格吉里', icon: '/pt/npc_icon/snowgirl.png', npcId: 2085 },
    food: { name: '食品店-季加卡', icon: '/pt/npc_icon/gigaka.png', npcId: 442 },
    magic: { name: '魔法商店-米林', icon: '/pt/npc_icon/miriun.png', npcId: 7379 }
  },
  珊瑚岛: {
    storage: { name: '仓库-阳光胖胖', icon: '/pt/npc_icon/sunnypang.png', npcId: 14568 },
    quest: { name: '任务委托中心-发明家蕾米', icon: '/pt/npc_icon/remi.png', npcId: 17461 },
    blacksmith: { name: '武器店-塔卢斯', icon: '/pt/npc_icon/talus.png', npcId: 16233 },
    armor: { name: '防具店-波布', icon: '/pt/npc_icon/bobu.png', npcId: 19344 },
    food: { name: '食品店-泡泡', icon: '/pt/npc_icon/paupau.png', npcId: 18642 },
    magic: { name: '魔法商店-卡米', icon: '/pt/npc_icon/kammie.png', npcId: 11242 }
  },
  凯伦草原: {
    storage: { name: '仓库-草原胖胖', icon: '/pt/npc_icon/infopeng.png', npcId: 17119 },
    quest: { name: '任务委托中心-米奥朗', icon: '/pt/npc_icon/miorang.png', npcId: 29222 },
    blacksmith: { name: '武器店-多米儿', icon: '/pt/npc_icon/mewrang.png', npcId: 21545 },
    armor: { name: '防具店-哈雷特', icon: '/pt/npc_icon/ralbadan.png', npcId: 24894 },
    food: { name: '食品店-卡伦', icon: '/pt/npc_icon/miorang.png', npcId: 21138 },
    magic: { name: '魔法商店-莉安娜', icon: '/pt/npc_icon/cheirang.png', npcId: 26958 }
  }
}

const emit = defineEmits([
  'open-job-change-modal',
  'open-storage-modal',
  'open-npc-quest-panel',
  'open-dialogue',
  'open-tower-modal',
  'open-shop-modal',
  'open-blacksmith-modal',
  'open-armor-shop-modal',
  'open-food-shop-modal',
  'open-magic-shop-modal',
  'open-pet-trainer-modal',
  'open-jewelry-master-modal',
  'open-huafu-shop-modal'
])

// NPC点击事件处理函数（保留由 MainLayout 转发的 emit 声明）
// 实际功能通过 open-dialogue 事件统一处理

/** 对话服务实例，用于查询NPC ID */
const dialogueService = new DialogueService()

/**
 * 通用NPC对话启动方法
 * @param {string} shopType - NPC类型标识
 * @param {Object} npcConfig - NPC配置 { name, icon, npcId? }
 */
const openNPCDialogue = (shopType, npcConfig) => {
  emit('open-dialogue', {
    npcId: npcConfig.npcId || null,
    npcConfig,
    player: props.player,
    mapLevelRange: null,
    shopType
  })
}

/**
 * 打开任务NPC对话系统
 * 根据当前地图查找对应的任务委托NPC ID，启动原神风格对话
 */
const openNPCQuestPanel = () => {
  const mapName = props.currentMap?.name || '帕里大陆'
  const mapNpcConfig = npcMapConfigs[mapName] || npcMapConfigs['帕里大陆']
  const questNpcConfig = mapNpcConfig.quest
  const npcId = dialogueService.getQuestNpcIdByMap(mapName)
  const mapLevelRange = mapsStore.getMapLevelRange(mapName)

  emit('open-dialogue', {
    npcId,
    npcConfig: questNpcConfig,
    player: props.player,
    mapLevelRange,
    shopType: null
  })
}

/**
 * 打开商店NPC对话系统
 * 商店NPC先进行对话，对话结束后进入商店
 * @param {string} shopType - 商店类型
 * @param {Object} npcConfig - NPC配置 { name, icon }
 */
const openShopDialogue = (shopType, npcConfig) => {
  openNPCDialogue(shopType, npcConfig)
}

/** 职业导师对话 */
const openJobChangeDialogue = () => {
  openNPCDialogue('job-change', { name: '职业进阶导师-路易', icon: '/pt/npc_icon/lui.png', npcId: 850 })
}

/** 宠物训练师对话 */
const openPetTrainerDialogue = () => {
  openNPCDialogue('pet-trainer', { name: '宠物训练师', icon: '/pt/npc_icon/pettamer.png', npcId: 3421 })
}

/** 深渊之塔管理员对话 - 直接在对话系统中展示任务列表，与任务委托中心一致 */
const openTowerDialogue = () => {
  emit('open-dialogue', {
    npcId: 11734,
    npcConfig: { name: '深渊之塔管理员', icon: '/pt/npc_icon/knight01.png' },
    player: props.player,
    mapLevelRange: null,
    shopType: null
  })
}

/** 珠宝大师对话 */
const openJewelryMasterDialogue = () => {
  openNPCDialogue('jewelry-master', { name: '珠宝大师-皮奇', icon: '/pt/npc_icon/remine.png', npcId: 2077 })
}

/** 钻石商店对话 */
const openDiamondShopDialogue = () => {
  openNPCDialogue('diamond-shop', { name: '钻石商店-瑞多斯', icon: '/pt/npc_icon/reodos.png', npcId: 4641 })
}

/** 华弗商店对话 */
const openHuaFuShopDialogue = () => {
  openNPCDialogue('huafu-shop', { name: 'PK纸片兑换-华弗', icon: '/pt/npc_icon/waforu.png', npcId: 9961 })
}

/**
 * 大师进阶-蕾拉对话
 * 直接展示大师进阶任务列表，不进行地图等级范围筛选
 * 任务来源：QUEST_INFO.js 中 beginNPC 为 10696 的所有任务（大师进阶1-6）
 */
const openMasterQuestDialogue = () => {
  emit('open-dialogue', {
    npcId: 10696,
    npcConfig: { name: '[大师进阶]蕾拉', icon: '/pt/npc_icon/hendel.png' },
    player: props.player,
    mapLevelRange: null,
    shopType: null
  })
}

const openJewelryMasterModal = () => {
  emit('open-jewelry-master-modal')
}

const openHuaFuShopModal = () => {
  emit('open-huafu-shop-modal')
}

const mapNpcGroups = computed(() => {
  const mapName = props.currentMap?.name || '帕里大陆'
  const mapNpcConfig = npcMapConfigs[mapName] || npcMapConfigs['帕里大陆']

  return {
    primary: [
      { key: 'storage', ...mapNpcConfig.storage, action: () => openShopDialogue('storage', mapNpcConfig.storage) },
      { key: 'quest', ...mapNpcConfig.quest, action: openNPCQuestPanel }
    ],
    shops: [
      { key: 'blacksmith', ...mapNpcConfig.blacksmith, action: () => openShopDialogue('blacksmith', mapNpcConfig.blacksmith) },
      { key: 'armor', ...mapNpcConfig.armor, action: () => openShopDialogue('armor', mapNpcConfig.armor) },
      { key: 'food', ...mapNpcConfig.food, action: () => openShopDialogue('food', mapNpcConfig.food) },
      { key: 'magic', ...mapNpcConfig.magic, action: () => openShopDialogue('magic', mapNpcConfig.magic) }
    ]
  }
})
</script>

<style scoped>
  /**
   * NPCContainer 样式
   * NPC 卡片网格布局，深色玻璃拟态卡片风格
   */

  /* 定义可动画的角度自定义属性（conic-gradient 旋转驱动） */
  @property --gold-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @property --blue-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  .map-display {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background-size: cover;
    background-position: center;
    border-radius: 10px;
    position: relative;
    overflow-y: auto;
    overflow-x: clip;
    width: 100%;
    padding: 6px;
    box-sizing: border-box;
  }

  /** NPC 网格容器 */
  .npc-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 12px;
    padding: 8px;
    border-radius: 10px;
    width: 100%;
    height: 100%;
    align-content: start;
    box-sizing: border-box;
  }

  /** NPC 卡片 */
  .npc-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.25s ease;
    padding: 12px 8px;
    border-radius: 12px;
    background: var(--theme-npc-bg);
    border: 1px solid var(--theme-border);
    width: 100%;
    min-height: 180px;
    position: relative;
    box-sizing: border-box;
  }

  /** 卡片顶部装饰线（通过 left/right 定位限制宽度，无需 overflow 裁切） */
  .npc-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    border-radius: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .npc-item:hover {
    background: var(--theme-surface-strong);
    border-color: var(--theme-accent);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    transform: translateY(-3px);
  }

  .npc-item:hover::before {
    opacity: 1;
  }

  .npc-icon {
    width: 110px;
    height: 110px;
    border-radius: 14px;
    object-fit: cover;
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: box-shadow 0.25s ease;
  }

  .npc-item:hover .npc-icon {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  .npc-name {
    margin-top: 10px;
    color: var(--theme-text);
    font-size: 13px;
    font-weight: 600;
    text-align: center;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* NPC图标包装器 */
  .npc-icon-wrapper {
    position: relative;
    display: inline-block;
  }

  /* 转职提示 - 炫彩线条沿边框顺时针 360° 流动动画 */
  /* 使用伪元素 + mask 实现环形 conic-gradient，不干扰卡片背景，所有主题可见 */
  .job-change-hint {
    border: 2px solid transparent !important;
    position: relative;
  }

  .job-change-hint::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(
      from var(--gold-angle, 0deg),
      rgba(255, 215, 0, 0.03),
      #ffd700,
      #ff8c00,
      #ffeb3b,
      #ffaa00,
      #ffd700,
      #ff6600,
      #ffeb3b,
      #ffd700,
      rgba(255, 215, 0, 0.03),
      rgba(255, 215, 0, 0.03),
      rgba(255, 215, 0, 0.03),
      rgba(255, 215, 0, 0.03)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: gold-rotate 3s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes gold-rotate {
    to {
      --gold-angle: 360deg;
    }
  }

  /* 转职提示 - 外发光增强 */
  .job-change-hint:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 149, 0, 0.25);
    transform: translateY(-3px);
  }

  /* 问号提示指示器 */
  .job-hint-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 2px 8px rgba(255, 140, 0, 0.6);
    animation: shake 0.8s ease-in-out infinite;
    z-index: 10;
  }

  @keyframes shake {
    0%, 100% {
      transform: rotate(0deg);
    }
    20% {
      transform: rotate(-15deg);
    }
    40% {
      transform: rotate(12deg);
    }
    60% {
      transform: rotate(-10deg);
    }
    80% {
      transform: rotate(8deg);
    }
  }

  /* 任务提示 - 炫彩线条沿边框顺时针 360° 流动动画（蓝色） */
  /* 使用伪元素 + mask 实现环形 conic-gradient，不干扰卡片背景，所有主题可见 */
  .quest-hint {
    border: 2px solid transparent !important;
    position: relative;
  }

  .quest-hint::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: conic-gradient(
      from var(--blue-angle, 0deg),
      rgba(100, 149, 237, 0.03),
      #6495ed,
      #4169e1,
      #00bfff,
      #6495ed,
      #1e90ff,
      #4169e1,
      #87ceeb,
      #6495ed,
      rgba(100, 149, 237, 0.03),
      rgba(100, 149, 237, 0.03),
      rgba(100, 149, 237, 0.03),
      rgba(100, 149, 237, 0.03)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    animation: blue-rotate 3s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes blue-rotate {
    to {
      --blue-angle: 360deg;
    }
  }

  /* 任务提示 - 外发光增强 */
  .quest-hint:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(65, 105, 225, 0.25);
    transform: translateY(-3px);
  }

  /* 问号提示指示器 */
  .quest-hint-indicator {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6495ed 0%, #4169e1 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    box-shadow: 0 2px 8px rgba(65, 105, 225, 0.6);
    animation: shake 0.8s ease-in-out infinite;
    z-index: 10;
  }
</style>
