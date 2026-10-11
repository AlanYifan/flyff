import { ref } from 'vue'
import { NPCItemService } from '@/services/NPCItemService.js'

/**
 * 商店系统组合式API
 * 将商店相关的逻辑从Main.vue中抽离出来
 */
export function useShop (currentMap, player) {
  // 响应式数据
  const npcItemService = ref(null)

  // 商店模态框状态
  const showShopModal = ref(false)
  const showFoodShopModal = ref(false)
  const showMagicShopModal = ref(false)
  const showBlacksmithModal = ref(false)
  const showArmorShopModal = ref(false)

  // 商店数据
  const foodShopModalData = ref({
    npcName: '食品店-萝夏',
    npcAvatar: '/pt/npc_icon/losha.png',
    npcDialog: '',
    shopItems: []
  })

  const magicShopModalData = ref({
    npcName: '魔法商店-玛尔琪',
    npcAvatar: '/pt/npc_icon/marche.png',
    npcDialog: '',
    shopItems: []
  })

  const blacksmithModalData = ref({
    npcName: '武器店-波波库',
    npcAvatar: '/pt/npc_icon/boboku.png',
    npcDialog: '',
    shopItems: []
  })

  const armorShopModalData = ref({
    npcName: '防具店-波波克',
    npcAvatar: '/pt/npc_icon/boboku.png',
    npcDialog: '',
    shopItems: []
  })

  const createBlacksmithDialogs = (npcName, mapName) => [
    `${npcName}：在${mapName}出行，武器趁手才能一路畅快。`,
    `冒险家，${npcName}为${mapName}的战斗准备了更锋利的选择。`,
    `想提升火力？来${mapName}的${npcName}看看新到的利器。`,
    `${npcName}：别让旧武器拖后腿，${mapName}的怪可不温柔。`,
    `在${mapName}闯荡不易，${npcName}给你更可靠的战斗伙伴。`
  ]

  const createArmorDialogs = (npcName, mapName) => [
    `${npcName}：在${mapName}行走，护具合身才最安心。`,
    `冒险路上挨打不可怕，有${npcName}的防具才踏实。`,
    `寒风与利爪都挡得住，${npcName}的装备值得信赖。`,
    `准备下一场冒险？先把防具换新，${npcName}帮你挑。`,
    `${npcName}：在${mapName}多变的战况里，护甲就是底气。`
  ]

  const createFoodDialogs = (npcName, mapName) => [
    `${npcName}：在${mapName}行动前，先补点体力再出发。`,
    `冒险家，${npcName}特调的补给能让你在${mapName}走得更远。`,
    `别硬扛，来${mapName}的${npcName}挑些恢复品更稳妥。`,
    `${npcName}：天气多变的${mapName}，热乎的补给最暖心。`,
    `在${mapName}遇到困难也别怕，${npcName}的补给会撑住你。`
  ]

  const createMagicDialogs = (npcName, mapName) => [
    `${npcName}：在${mapName}施法要稳，先备好充足的魔法补给。`,
    `冒险家，${npcName}为${mapName}准备了更精纯的魔力物资。`,
    `法术需要节奏，来${mapName}的${npcName}补充魔力再出发。`,
    `${npcName}：在${mapName}研究新法术？这些卷轴正合适。`,
    `想让魔法更顺畅？${npcName}在${mapName}等你来挑选。`
  ]

  const shopNpcConfigs = {
    帕里大陆: {
      blacksmith: {
        name: '武器店-波波库',
        icon: '/pt/npc_icon/boboku.png',
        dialogs: createBlacksmithDialogs('武器店-波波库', '帕里大陆')
      },
      armor: {
        name: '防具店-波波克',
        icon: '/pt/npc_icon/boboku.png',
        dialogs: createArmorDialogs('防具店-波波克', '帕里大陆')
      },
      food: {
        name: '食品店-萝夏',
        icon: '/pt/npc_icon/losha.png',
        dialogs: createFoodDialogs('食品店-萝夏', '帕里大陆')
      },
      magic: {
        name: '魔法商店-玛尔琪',
        icon: '/pt/npc_icon/marche.png',
        dialogs: createMagicDialogs('魔法商店-玛尔琪', '帕里大陆')
      }
    },
    晨光大陆: {
      blacksmith: {
        name: '武器店-布鲁克',
        icon: '/pt/npc_icon/bulrox.png',
        dialogs: createBlacksmithDialogs('武器店-布鲁克', '晨光大陆')
      },
      armor: {
        name: '防具店-波兹曼',
        icon: '/pt/npc_icon/boboku.png',
        dialogs: createArmorDialogs('防具店-波兹曼', '晨光大陆')
      },
      food: {
        name: '食品店-卡琳',
        icon: '/pt/npc_icon/karin.png',
        dialogs: createFoodDialogs('食品店-卡琳', '晨光大陆')
      },
      magic: {
        name: '魔法商店-马丁',
        icon: '/pt/npc_icon/martin.png',
        dialogs: createMagicDialogs('魔法商店-马丁', '晨光大陆')
      }
    },
    莱斯大陆: {
      blacksmith: {
        name: '武器店-波波库',
        icon: '/pt/npc_icon/boboku.png',
        dialogs: createBlacksmithDialogs('武器店-波波库', '莱斯大陆')
      },
      armor: {
        name: '防具店-波波克',
        icon: '/pt/npc_icon/boboku.png',
        dialogs: createArmorDialogs('防具店-波波克', '莱斯大陆')
      },
      food: {
        name: '食品店-萝夏',
        icon: '/pt/npc_icon/losha.png',
        dialogs: createFoodDialogs('食品店-萝夏', '莱斯大陆')
      },
      magic: {
        name: '魔法商店-玛尔琪',
        icon: '/pt/npc_icon/marche.png',
        dialogs: createMagicDialogs('魔法商店-玛尔琪', '莱斯大陆')
      }
    },
    '达肯1,2大陆': {
      blacksmith: {
        name: '武器店-雷蒙',
        icon: '/pt/npc_icon/remine.png',
        dialogs: createBlacksmithDialogs('武器店-雷蒙', '达肯1,2大陆')
      },
      armor: {
        name: '防具店-鲁奇',
        icon: '/pt/npc_icon/roocky.png',
        dialogs: createArmorDialogs('防具店-鲁奇', '达肯1,2大陆')
      },
      food: {
        name: '食品店-沃尔波尔',
        icon: '/pt/npc_icon/bolpor.png',
        dialogs: createFoodDialogs('食品店-沃尔波尔', '达肯1,2大陆')
      },
      magic: {
        name: '魔法商店-哈本',
        icon: '/pt/npc_icon/haven.png',
        dialogs: createMagicDialogs('魔法商店-哈本', '达肯1,2大陆')
      }
    },
    达肯3大陆: {
      blacksmith: {
        name: '武器店-卡布洛',
        icon: '/pt/npc_icon/phacham.png',
        dialogs: createBlacksmithDialogs('武器店-卡布洛', '达肯3大陆')
      },
      armor: {
        name: '防具店-查宾',
        icon: '/pt/npc_icon/phacham.png',
        dialogs: createArmorDialogs('防具店-查宾', '达肯3大陆')
      },
      food: {
        name: '食品店-卡布洛',
        icon: '/pt/npc_icon/phacham.png',
        dialogs: createFoodDialogs('食品店-卡布洛', '达肯3大陆')
      },
      magic: {
        name: '魔法商店-丹狄',
        icon: '/pt/npc_icon/phacham.png',
        dialogs: createMagicDialogs('魔法商店-丹狄', '达肯3大陆')
      }
    },
    阿兹利亚: {
      blacksmith: {
        name: '武器店-玫然',
        icon: '/pt/npc_icon/mawrang.png',
        dialogs: createBlacksmithDialogs('武器店-玫然', '阿兹利亚')
      },
      armor: {
        name: '防具店-奥格吉里',
        icon: '/pt/npc_icon/snowgirl.png',
        dialogs: createArmorDialogs('防具店-奥格吉里', '阿兹利亚')
      },
      food: {
        name: '食品店-季加卡',
        icon: '/pt/npc_icon/gigaka.png',
        dialogs: createFoodDialogs('食品店-季加卡', '阿兹利亚')
      },
      magic: {
        name: '魔法商店-米林',
        icon: '/pt/npc_icon/miriun.png',
        dialogs: createMagicDialogs('魔法商店-米林', '阿兹利亚')
      }
    },
    珊瑚岛: {
      blacksmith: {
        name: '武器店-塔卢斯',
        icon: '/pt/npc_icon/talus.png',
        dialogs: createBlacksmithDialogs('武器店-塔卢斯', '珊瑚岛')
      },
      armor: {
        name: '防具店-波布',
        icon: '/pt/npc_icon/bobu.png',
        dialogs: createArmorDialogs('防具店-波布', '珊瑚岛')
      },
      food: {
        name: '食品店-泡泡',
        icon: '/pt/npc_icon/paupau.png',
        dialogs: createFoodDialogs('食品店-泡泡', '珊瑚岛')
      },
      magic: {
        name: '魔法商店-卡米',
        icon: '/pt/npc_icon/kammie.png',
        dialogs: createMagicDialogs('魔法商店-卡米', '珊瑚岛')
      }
    },
    凯伦草原: {
      blacksmith: {
        name: '武器店-多米儿',
        icon: '/pt/npc_icon/mewrang.png',
        dialogs: createBlacksmithDialogs('武器店-多米儿', '凯伦草原')
      },
      armor: {
        name: '防具店-哈雷特',
        icon: '/pt/npc_icon/ralbadan.png',
        dialogs: createArmorDialogs('防具店-哈雷特', '凯伦草原')
      },
      food: {
        name: '食品店-卡伦',
        icon: '/pt/npc_icon/miorang.png',
        dialogs: createFoodDialogs('食品店-卡伦', '凯伦草原')
      },
      magic: {
        name: '魔法商店-莉安娜',
        icon: '/pt/npc_icon/cheirang.png',
        dialogs: createMagicDialogs('魔法商店-莉安娜', '凯伦草原')
      }
    }
  }

  const getShopNpcConfig = mapName => {
    return shopNpcConfigs[mapName] || shopNpcConfigs['帕里大陆']
  }

  // 初始化NPC物品服务
  const initializeNPCItemService = () => {
    // NPCItemService 不再需要 gameData 参数
    if (!npcItemService.value) {
      npcItemService.value = new NPCItemService()
    }
  }

  // 方法
  const openShopModal = () => {
    showShopModal.value = true
  }

  const closeShopModal = () => {
    showShopModal.value = false
  }

  const openFoodShopModal = () => {
    const mapName = currentMap?.value?.name || '帕里大陆'
    const shopNpcConfig = getShopNpcConfig(mapName)
    foodShopModalData.value.npcName = shopNpcConfig.food.name
    foodShopModalData.value.npcAvatar = shopNpcConfig.food.icon

    // 初始化NPC物品服务
    initializeNPCItemService()

    // 获取食品商店物品数据（不再需要 gameData 和 currentMap 参数）
    if (npcItemService.value) {
      const foodItems = npcItemService.value.getFoodItems()

      // 获取随机对话
      const foodDialogs = shopNpcConfig.food.dialogs || createFoodDialogs(
        shopNpcConfig.food.name,
        mapName
      )

      const randomDialog = foodDialogs[Math.floor(Math.random() * foodDialogs.length)]

      // 更新食品商店数据
      foodShopModalData.value.shopItems = foodItems
      foodShopModalData.value.npcDialog = randomDialog
    }

    showFoodShopModal.value = true
  }

  const closeFoodShopModal = () => {
    showFoodShopModal.value = false
  }

  const openMagicShopModal = () => {
    const mapName = currentMap?.value?.name || '帕里大陆'
    const shopNpcConfig = getShopNpcConfig(mapName)
    magicShopModalData.value.npcName = shopNpcConfig.magic.name
    magicShopModalData.value.npcAvatar = shopNpcConfig.magic.icon

    // 初始化NPC物品服务
    initializeNPCItemService()

    // 获取魔法商店物品数据（不再需要 gameData 和 currentMap 参数）
    if (npcItemService.value) {
      const magicItems = npcItemService.value.getMagicItems()

      // 获取随机对话
      const magicDialogs = shopNpcConfig.magic.dialogs || createMagicDialogs(
        shopNpcConfig.magic.name,
        mapName
      )

      const randomDialog = magicDialogs[Math.floor(Math.random() * magicDialogs.length)]

      // 更新魔法商店数据
      magicShopModalData.value.shopItems = magicItems
      magicShopModalData.value.npcDialog = randomDialog
    }

    showMagicShopModal.value = true
  }

  const closeMagicShopModal = () => {
    showMagicShopModal.value = false
  }

  const openBlacksmithModal = () => {
    const mapName = currentMap?.value?.name || '帕里大陆'
    const shopNpcConfig = getShopNpcConfig(mapName)
    blacksmithModalData.value.npcName = shopNpcConfig.blacksmith.name
    blacksmithModalData.value.npcAvatar = shopNpcConfig.blacksmith.icon

    // 初始化NPC物品服务
    initializeNPCItemService()

    // 获取黑铁匠铺物品数据（不再需要 gameData 参数）
    if (npcItemService.value) {
      const weaponItems = npcItemService.value.getWeaponItems(currentMap.value)

      // 获取随机对话
      const blacksmithDialogs = shopNpcConfig.blacksmith.dialogs

      const randomDialog = blacksmithDialogs[Math.floor(Math.random() * blacksmithDialogs.length)]

      // 更新黑铁匠铺数据
      blacksmithModalData.value.shopItems = weaponItems
      blacksmithModalData.value.npcDialog = randomDialog
    }

    showBlacksmithModal.value = true
  }

  const closeBlacksmithModal = () => {
    showBlacksmithModal.value = false
  }

  const openArmorShopModal = () => {
    const mapName = currentMap?.value?.name || '帕里大陆'
    const shopNpcConfig = getShopNpcConfig(mapName)
    armorShopModalData.value.npcName = shopNpcConfig.armor.name
    armorShopModalData.value.npcAvatar = shopNpcConfig.armor.icon

    // 初始化NPC物品服务
    initializeNPCItemService()

    // 获取装备商店物品数据（不再需要 gameData 参数）
    if (npcItemService.value) {
      const armorItems = npcItemService.value.getArmorItems(currentMap.value)

      // 获取随机对话
      const armorDialogs = shopNpcConfig.armor.dialogs

      const randomDialog = armorDialogs[Math.floor(Math.random() * armorDialogs.length)]

      // 更新装备商店数据
      armorShopModalData.value.shopItems = armorItems
      armorShopModalData.value.npcDialog = randomDialog
    }

    showArmorShopModal.value = true
  }

  const closeArmorShopModal = () => {
    showArmorShopModal.value = false
  }

  // 通用购买处理函数
  const handlePurchase = purchaseData => {
    const { totalPrice } = purchaseData

    // 检查玩家是否有足够的金币
    if (player.value.gold < totalPrice) {
      console.log(`金币不足，无法购买! 当前金币: ${player.value.gold}, 需要金币: ${totalPrice}`)
      return false
    }

    // 扣除金币
    player.value.gold -= totalPrice

    // 添加物品到背包的逻辑应该在调用此函数的地方处理

    // 返回购买成功
    return true
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    npcItemService,
    showShopModal,
    showFoodShopModal,
    showMagicShopModal,
    showBlacksmithModal,
    showArmorShopModal,

    // 商店数据
    foodShopModalData,
    magicShopModalData,
    blacksmithModalData,
    armorShopModalData,

    // 方法
    openShopModal,
    closeShopModal,
    openFoodShopModal,
    closeFoodShopModal,
    openMagicShopModal,
    closeMagicShopModal,
    openBlacksmithModal,
    closeBlacksmithModal,
    openArmorShopModal,
    closeArmorShopModal,
    handlePurchase
  }
}
