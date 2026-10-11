import { ref } from 'vue'
import { NPCItemService } from '@/services/NPCItemService'

/**
 * NPC交互组合式API
 * 将NPC相关的逻辑从Main.vue中抽离出来
 * 现在使用 NPCItemService 和 NPCDialogService
 */
export function useNPC () {
  // 响应式数据
  const npcItemService = ref(new NPCItemService())
  const showNPCQuestPanel = ref(false)
  const showTowerAdminPanel = ref(false)
  const showShopModal = ref(false)
  const showStorageModal = ref(false)
  const showBlacksmithModal = ref(false)
  const showArmorShopModal = ref(false)
  const showFoodShopModal = ref(false)
  const showMagicShopModal = ref(false)

  // NPC商店数据
  const blacksmithModalData = ref({
    npcName: '铁匠-波波酷',
    npcAvatar: '/pt/npc_icon/boboku.png',
    npcDialog: ''
  })

  const armorShopModalData = ref({
    npcName: '装备商-波波克',
    npcAvatar: '/pt/npc_icon/bulrox.png',
    npcDialog: ''
  })

  const foodShopModalData = ref({
    npcName: '食品店-米里恩',
    npcAvatar: '/pt/npc_icon/miriun.png',
    npcDialog: ''
  })

  const magicShopModalData = ref({
    npcName: '魔法商店-米莉娜',
    npcAvatar: '/pt/npc_icon/milina.png',
    npcDialog: ''
  })

  // 方法
  const openNPCQuestPanel = () => {
    showNPCQuestPanel.value = true
  }

  const closeNPCQuestPanel = () => {
    showNPCQuestPanel.value = false
  }

  const openTowerModal = () => {
    showTowerAdminPanel.value = true
  }

  const closeTowerAdminPanel = () => {
    showTowerAdminPanel.value = false
  }

  const openShopModal = () => {
    showShopModal.value = true
  }

  const closeShopModal = () => {
    showShopModal.value = false
  }

  const openStorageModal = () => {
    showStorageModal.value = true
  }

  const closeStorageModal = () => {
    showStorageModal.value = false
  }

  const openBlacksmithModal = () => {
    showBlacksmithModal.value = true
    // 获取随机对话
    if (npcItemService.value) {
      const dialog = npcItemService.value.getRandomDialog('weaponShop')
      blacksmithModalData.value.npcDialog = dialog[0]
    }
  }

  const closeBlacksmithModal = () => {
    showBlacksmithModal.value = false
  }

  const openArmorShopModal = () => {
    showArmorShopModal.value = true
    // 获取随机对话
    if (npcItemService.value) {
      const dialog = npcItemService.value.getRandomDialog('armorShop')
      armorShopModalData.value.npcDialog = dialog[0]
    }
  }

  const closeArmorShopModal = () => {
    showArmorShopModal.value = false
  }

  const openFoodShopModal = () => {
    showFoodShopModal.value = true
    // 获取随机对话
    if (npcItemService.value) {
      const dialog = npcItemService.value.getRandomDialog('foodShop')
      foodShopModalData.value.npcDialog = dialog[0]
    }
  }

  const closeFoodShopModal = () => {
    showFoodShopModal.value = false
  }

  const openMagicShopModal = () => {
    showMagicShopModal.value = true
    // 获取随机对话
    if (npcItemService.value) {
      const dialog = npcItemService.value.getRandomDialog('magicShop')
      magicShopModalData.value.npcDialog = dialog[0]
    }
  }

  const closeMagicShopModal = () => {
    showMagicShopModal.value = false
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    npcItemService,
    showNPCQuestPanel,
    showTowerAdminPanel,
    showShopModal,
    showStorageModal,
    showBlacksmithModal,
    showArmorShopModal,
    showFoodShopModal,
    showMagicShopModal,

    // NPC商店数据
    blacksmithModalData,
    armorShopModalData,
    foodShopModalData,
    magicShopModalData,

    // 方法
    openNPCQuestPanel,
    closeNPCQuestPanel,
    openTowerModal,
    closeTowerAdminPanel,
    openShopModal,
    closeShopModal,
    openStorageModal,
    closeStorageModal,
    openBlacksmithModal,
    closeBlacksmithModal,
    openArmorShopModal,
    closeArmorShopModal,
    openFoodShopModal,
    closeFoodShopModal,
    openMagicShopModal,
    closeMagicShopModal
  }
}
