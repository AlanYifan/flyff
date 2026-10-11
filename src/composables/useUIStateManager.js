import { reactive } from 'vue'

// 单例实例
let instance = null

/**
 * UI状态管理组合式API
 * 将UI状态相关的逻辑从Main.vue中抽离出来
 * 使用单例模式确保状态一致性
 */
export function useUIStateManager () {
  // 如果实例已存在，直接返回
  if (instance) {
    return instance
  }

  // 模态框状态
  const modalStates = reactive({
    bagModal: false,
    equipmentModal: false,
    questModal: false,
    npcQuestModal: false,
    petTrainerModal: false,
    playerDetailModal: false,
    mapModal: false,
    shopModal: false,
    blacksmithModal: false,
    armorShopModal: false,
    foodShopModal: false,
    magicShopModal: false,
    storageModal: false,
    towerAdminModal: false,
    settingsModal: false,
    enhancePanel: false,
    perforationPanel: false,
    cardPanel: false,
    jobChangeModal: false,
    renamePanel: false,
    elementChangePanel: false,
    stoneSelectPanel: false,
    genderSelectPanel: false,
    functionPanel: false,
    jewelryMasterModal: false,
    databaseQueryModal: false,
    resetWeaponAttributeModal: false,
    resetUltimateWeaponBonusModal: false,
    weaponAwakeningModal: false,
    blessingAwakeningModal: false,
    buffTimerPanel: false,
    huafuShopModal: false,
    dialogueModal: false,
    skillPanel: false,
    achievementPanel: false,
    settingsPortalPanel: false
  })

  // 对话系统数据
  const dialogueData = reactive({
    npcId: null,
    npcConfig: null,
    player: null,
    mapLevelRange: null,
    shopType: null
  })

  // 商店模态框数据
  const shopModalData = reactive({
    foodShopModalData: {
      npcName: '食品店-米里恩',
      npcAvatar: '/pt/npc_icon/miriun.png',
      npcDialog: '欢迎光临！这里有各种美味的食品，可以恢复您的生命值。',
      shopItems: []
    },
    magicShopModalData: {
      npcName: '魔法商店-米莉娜',
      npcAvatar: '/pt/npc_icon/milina.png',
      npcDialog: '欢迎来到魔法商店！这里有各种神奇的魔法物品。',
      shopItems: []
    },
    blacksmithModalData: {
      npcName: '铁匠-波波酷',
      npcAvatar: '/pt/npc_icon/boboku.png',
      npcDialog: '需要强化装备吗？我这里提供各种强化服务。',
      shopItems: []
    },
    armorShopModalData: {
      npcName: '装备-波波克',
      npcAvatar: '/pt/npc_icon/bulrox.png',
      npcDialog: '欢迎光临装备商店！这里有各种强大的装备。',
      shopItems: []
    }
  })

  // 打开模态框
  const openModal = modalName => {
   
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
     
      modalStates[modalName] = true
     
    } else {
      console.log('[useUIStateManager] modalName 不存在于 modalStates 中')
    }
  }

  // 关闭模态框
  const closeModal = modalName => {
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
      modalStates[modalName] = false
    }
  }

  // 切换模态框状态
  const toggleModal = modalName => {
    if (Object.prototype.hasOwnProperty.call(modalStates, modalName)) {
      modalStates[modalName] = !modalStates[modalName]
    }
  }

  // 打开背包模态框
  const openBagModal = () => {
    openModal('bagModal')
  }

  // 关闭背包模态框
  const closeBagModal = () => {
    closeModal('bagModal')
  }

  // 切换背包模态框
  const toggleBagModal = () => {
    toggleModal('bagModal')
  }

  // 打开装备模态框
  const openEquipmentModal = () => {
    modalStates.equipmentModal = false
    openModal('bagModal')
  }

  // 关闭装备模态框
  const closeEquipmentModal = () => {
    closeModal('bagModal')
    modalStates.equipmentModal = false
  }

  // 打开任务面板
  const openQuestPanel = () => {
    openModal('questModal')
  }

  // 关闭任务面板
  const closeQuestPanel = () => {
    closeModal('questModal')
  }

  // 切换任务面板
  const toggleQuestPanel = () => {
    toggleModal('questModal')
  }

  // 打开玩家详情模态框
  const openPlayerDetailModal = () => {
    openModal('playerDetailModal')
  }

  // 关闭玩家详情模态框
  const closePlayerDetailModal = () => {
    closeModal('playerDetailModal')
  }

  // 切换玩家详情模态框
  const togglePlayerDetailModal = () => {
    toggleModal('playerDetailModal')
  }

  // 打开地图模态框
  const openMapModal = () => {
    openModal('mapModal')
  }

  // 关闭地图模态框
  const closeMapModal = () => {
    closeModal('mapModal')
  }

  // 切换地图模态框
  const toggleMapModal = () => {
    toggleModal('mapModal')
  }

  // 打开功能面板
  const openFunctionPanel = () => {
    openModal('functionPanel')
  }

  // 关闭功能面板
  const closeFunctionPanel = () => {
    closeModal('functionPanel')
  }

  // 切换功能面板
  const toggleFunctionPanel = () => {
    toggleModal('functionPanel')
  }

// 打开BUFF计时面板
const openBuffTimerPanel = () => {
  openModal('buffTimerPanel')
}

// 关闭BUFF计时面板
const closeBuffTimerPanel = () => {
  closeModal('buffTimerPanel')
}

// 切换BUFF计时面板
const toggleBuffTimerPanel = () => {
  toggleModal('buffTimerPanel')
}

  // 打开成就面板
  const openAchievementPanel = () => {
    openModal('achievementPanel')
  }

  // 关闭成就面板
  const closeAchievementPanel = () => {
    closeModal('achievementPanel')
  }

  // 切换成就面板
  const toggleAchievementPanel = () => {
    toggleModal('achievementPanel')
  }

  // 打开设置功能入口面板
  const openSettingsPortalPanel = () => {
    openModal('settingsPortalPanel')
  }

  // 关闭设置功能入口面板
  const closeSettingsPortalPanel = () => {
    closeModal('settingsPortalPanel')
  }

  // 打开技能面板
const openSkillPanel = () => {
  openModal('skillPanel')
}

// 关闭技能面板
const closeSkillPanel = () => {
  closeModal('skillPanel')
}

// 切换技能面板
const toggleSkillPanel = () => {
  toggleModal('skillPanel')
}

  // 打开设置模态框
  const openSettingsModal = () => {
    openModal('settingsModal')
  }

  // 关闭设置模态框
  const closeSettingsModal = () => {
    closeModal('settingsModal')
  }

  // 打开强化面板
  const openEnhancePanel = () => {
    openModal('enhancePanel')
  }

  // 关闭强化面板
  const closeEnhancePanel = () => {
    closeModal('enhancePanel')
  }

  // 打开穿孔面板
  const openPerforationPanel = () => {
    openModal('perforationPanel')
  }

  // 关闭穿孔面板
  const closePerforationPanel = () => {
    closeModal('perforationPanel')
  }

  // 打开卡片面板
  const openCardPanel = () => {
    openModal('cardPanel')
  }

  // 关闭卡片面板
  const closeCardPanel = () => {
    closeModal('cardPanel')
  }

  // 打开职业变更模态框
  const openJobChangeModal = () => {
    openModal('jobChangeModal')
  }

  // 关闭职业变更模态框
  const closeJobChangeModal = () => {
    closeModal('jobChangeModal')
  }

  // 打开改名面板
  const openRenamePanel = () => {
    openModal('renamePanel')
  }

  // 关闭改名面板
  const closeRenamePanel = () => {
    closeModal('renamePanel')
  }

  // 打开属性更改面板
  const openElementChangePanel = () => {
    openModal('elementChangePanel')
  }

  // 关闭属性更改面板
  const closeElementChangePanel = () => {
    closeModal('elementChangePanel')
  }

  // 打开石头选择面板
  const openStoneSelectPanel = () => {
    openModal('stoneSelectPanel')
  }

  // 关闭石头选择面板
  const closeStoneSelectPanel = () => {
    closeModal('stoneSelectPanel')
  }

  // 打开性别选择面板（用于selectbox类型套装礼盒）
  const openGenderSelectPanel = () => {
    openModal('genderSelectPanel')
  }

  // 关闭性别选择面板
  const closeGenderSelectPanel = () => {
    closeModal('genderSelectPanel')
  }

  // 打开仓库模态框
  const openStorageModal = () => {
    openModal('storageModal')
  }

  // 关闭仓库模态框
  const closeStorageModal = () => {
    closeModal('storageModal')
  }

  // 打开NPC任务面板
  const openNPCQuestPanel = () => {
    openModal('npcQuestModal')
  }

  // 关闭NPC任务面板
  const closeNPCQuestPanel = () => {
    closeModal('npcQuestModal')
  }

  const openPetTrainerModal = () => {
    openModal('petTrainerModal')
  }

  const closePetTrainerModal = () => {
    closeModal('petTrainerModal')
  }

  // 打开深渊之塔管理员面板
  const openTowerModal = () => {
    openModal('towerAdminModal')
  }

  // 关闭深渊之塔管理员面板
  const closeTowerModal = () => {
    closeModal('towerAdminModal')
  }

  // 打开商店模态框
  const openShopModal = () => {
    openModal('shopModal')
  }

  // 关闭商店模态框
  const closeShopModal = () => {
    closeModal('shopModal')
  }

  // 打开铁匠面板
  const openBlacksmithModal = () => {
    openModal('blacksmithModal')
  }

  // 关闭铁匠面板
  const closeBlacksmithModal = () => {
    closeModal('blacksmithModal')
  }

  // 打开装备商店面板
  const openArmorShopModal = () => {
    openModal('armorShopModal')
  }

  // 关闭装备商店面板
  const closeArmorShopModal = () => {
    closeModal('armorShopModal')
  }

  // 打开食品商店面板
  const openFoodShopModal = () => {
    openModal('foodShopModal')
  }

  // 关闭食品商店面板
  const closeFoodShopModal = () => {
    closeModal('foodShopModal')
  }

  // 打开魔法商店面板
  const openMagicShopModal = () => {
    openModal('magicShopModal')
  }

  // 关闭魔法商店面板
  const closeMagicShopModal = () => {
    closeModal('magicShopModal')
  }

  // 打开珠宝大师模态框
  const openJewelryMasterModal = () => {
    openModal('jewelryMasterModal')
  }

  // 关闭珠宝大师模态框
  const closeJewelryMasterModal = () => {
    closeModal('jewelryMasterModal')
  }

  // 打开数据库查询模态框
  const openDatabaseQueryModal = () => {
    openModal('databaseQueryModal')
  }

  // 关闭数据库查询模态框
  const closeDatabaseQueryModal = () => {
    closeModal('databaseQueryModal')
  }

  // 打开重置武器属性模态框
  const openResetWeaponAttributeModal = () => {
    openModal('resetWeaponAttributeModal')
  }

  // 关闭重置武器属性模态框
  const closeResetWeaponAttributeModal = () => {
    closeModal('resetWeaponAttributeModal')
  }

  // 打开重置终极武器新增特殊属性模态框
  const openResetUltimateWeaponBonusModal = () => {
    openModal('resetUltimateWeaponBonusModal')
  }

  // 关闭重置终极武器新增特殊属性模态框
  const closeResetUltimateWeaponBonusModal = () => {
    closeModal('resetUltimateWeaponBonusModal')
  }

// 打开武器唤醒模态框
const openWeaponAwakeningModal = () => {
openModal('weaponAwakeningModal')
}

// 关闭武器唤醒模态框
const closeWeaponAwakeningModal = () => {
closeModal('weaponAwakeningModal')
}

// 打开祝福唤醒模态框
const openBlessingAwakeningModal = () => {
openModal('blessingAwakeningModal')
}

// 关闭祝福唤醒模态框
const closeBlessingAwakeningModal = () => {
closeModal('blessingAwakeningModal')
}

  /** 打开华弗商店模态框 */
  const openHuaFuShopModal = () => {
    openModal('huafuShopModal')
  }

  /** 关闭华弗商店模态框 */
  const closeHuaFuShopModal = () => {
    closeModal('huafuShopModal')
  }

  /**
   * 打开对话系统
   * @param {Object} params - 对话参数 { npcId, npcConfig, player, mapLevelRange, shopType }
   */
  const openDialogue = (params) => {
    dialogueData.npcId = params.npcId || null
    dialogueData.npcConfig = params.npcConfig || null
    dialogueData.player = params.player || null
    dialogueData.mapLevelRange = params.mapLevelRange || null
    dialogueData.shopType = params.shopType || null
    openModal('dialogueModal')
  }

  /** 关闭对话系统 */
  const closeDialogue = () => {
    closeModal('dialogueModal')
  }

  // 设置商店数据
  const setShopModalData = (shopType, data) => {
    if (Object.prototype.hasOwnProperty.call(shopModalData, shopType)) {
      Object.assign(shopModalData[shopType], data)
    }
  }

  // 获取商店数据
  const getShopModalData = shopType => {
    return shopModalData[shopType] || {}
  }

  // 清理所有模态框
  const cleanupAllModals = () => {
    Object.keys(modalStates).forEach(key => {
      modalStates[key] = false
    })
  }

  // 暴露给外部使用的属性和方法
  const result = {
    // 响应式数据
    modalStates,
    shopModalData,

    // 方法
    openModal,
    closeModal,
    toggleModal,
    openBagModal,
    closeBagModal,
    toggleBagModal,
    openEquipmentModal,
    closeEquipmentModal,
    openQuestPanel,
    closeQuestPanel,
    toggleQuestPanel,
    openPlayerDetailModal,
    closePlayerDetailModal,
    togglePlayerDetailModal,
    openMapModal,
    closeMapModal,
    toggleMapModal,
    openFunctionPanel,
    closeFunctionPanel,
    toggleFunctionPanel,
    openSettingsModal,
    closeSettingsModal,
    openEnhancePanel,
    closeEnhancePanel,
    openPerforationPanel,
    closePerforationPanel,
    openCardPanel,
    closeCardPanel,
    openJobChangeModal,
    closeJobChangeModal,
    openRenamePanel,
    closeRenamePanel,
    openElementChangePanel,
    closeElementChangePanel,
    openStoneSelectPanel,
    closeStoneSelectPanel,
    openGenderSelectPanel,
    closeGenderSelectPanel,
    openStorageModal,
    closeStorageModal,
    openNPCQuestPanel,
    closeNPCQuestPanel,
    openPetTrainerModal,
    closePetTrainerModal,
    openTowerModal,
    closeTowerModal,
    openShopModal,
    closeShopModal,
    openBlacksmithModal,
    closeBlacksmithModal,
    openArmorShopModal,
    closeArmorShopModal,
    openFoodShopModal,
    closeFoodShopModal,
    openMagicShopModal,
    closeMagicShopModal,
    openJewelryMasterModal,
    closeJewelryMasterModal,
    openDatabaseQueryModal,
    closeDatabaseQueryModal,
    openResetWeaponAttributeModal,
    closeResetWeaponAttributeModal,
    openResetUltimateWeaponBonusModal,
    closeResetUltimateWeaponBonusModal,
    openWeaponAwakeningModal,
    closeWeaponAwakeningModal,
    openBlessingAwakeningModal,
    closeBlessingAwakeningModal,
    openBuffTimerPanel,
    closeBuffTimerPanel,
    toggleBuffTimerPanel,
    openSkillPanel,
    closeSkillPanel,
    toggleSkillPanel,
    openAchievementPanel,
    closeAchievementPanel,
    toggleAchievementPanel,
    openSettingsPortalPanel,
    closeSettingsPortalPanel,
    openHuaFuShopModal,
    closeHuaFuShopModal,
    openDialogue,
    closeDialogue,
    dialogueData,
    setShopModalData,
    getShopModalData,
    cleanupAllModals
  }

  // 保存单例实例
  instance = result
  return result
}
