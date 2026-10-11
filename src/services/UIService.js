/**
 * UI服务 - 基于old/ui.js重构
 * 负责UI界面的更新和管理
 */

import { formatGold4, getGoldValueClass } from '@/utils/goldDisplay'
import { SkillUnlockChecker } from '@/utils/skillUnlockChecker'

export class UIService {
  constructor () {
    // UI状态
    this.uiState = {
      isPlayerDetailModalOpen: false,
      isBagModalOpen: false,
      isShopModalOpen: false,
      isStorageModalOpen: false,
      isQuestPanelOpen: false,
      isSettingsModalOpen: false
    }
  }

  /**
   * 更新属性UI
   */
  updateAttributeUI (player) {
    if (!player) {
      return
    }

    this.uiState.lastPlayerId = player.id || null

    // 这里需要实现属性UI更新逻辑
    // 由于DOM操作在Vue组件中处理，这里主要提供数据更新方法

    // 在实际实现中，这里会更新Vue组件的响应式数据
    // 或者通过事件总线通知组件更新
  }

  /**
   * 更新装备栏UI
   */
  updateEquipmentUI (player) {
    if (!player) {
      return
    }

    this.uiState.lastEquipmentUpdate = Date.now()

    // 在实际实现中，这里会更新装备栏的显示
  }

  /**
   * 更新背包UI
   */
  updateBagUI (player) {
    if (!player) {
      return
    }

    this.uiState.lastBagUpdate = Date.now()

    // 在实际实现中，这里会更新背包物品的显示
  }

  /**
   * 更新金币显示
   */
  updateGoldDisplay (gold) {
    const goldValueElement = document.getElementById('goldValue')

    if (!goldValueElement) {
      return
    }

    goldValueElement.className = `gold-value ${getGoldValueClass(gold)}`
    goldValueElement.textContent = formatGold4(gold)
  }

  /**
   * 检查BUFF状态
   */
  checkBuffStatus (player) {
    if (!player || !player.activeBuffs) {
      return
    }

    const now = Date.now()
    const expiredBuffs = []

    // 检查BUFF是否过期
    player.activeBuffs.forEach((buff, index) => {
      if (buff.expiresAt && buff.expiresAt < now) {
        expiredBuffs.push(index)
      }
    })

    // 移除过期的BUFF
    if (expiredBuffs.length > 0) {
      expiredBuffs.reverse().forEach(index => {
        player.activeBuffs.splice(index, 1)
      })
    }

    // 更新BUFF图标显示
    this.updateBuffIcons(player.activeBuffs)
  }

  /**
   * 更新BUFF图标
   */
  updateBuffIcons (buffs) {
    if (!buffs) {
      return null
    }
    // console.log('更新BUFF图标，当前BUFF数量:', buffs.length);
    // 在实际实现中，这里会更新BUFF图标的显示
  }

  /**
   * 初始化战斗日志拖拽功能
   */
  initBattleLogDraggable () {
    // 在实际实现中，这里会初始化战斗日志的拖拽功能
  }

  /**
   * 初始化背包拖拽功能
   */
  initBagDraggable () {
    // 在实际实现中，这里会初始化背包物品的拖拽功能
  }

  /**
   * 初始化装备拖拽功能
   */
  initEquipmentDraggable () {
    // 在实际实现中，这里会初始化装备的拖拽功能
  }

  /**
   * 初始化任务面板拖拽功能
   */
  initQuestPanelDraggable () {
    // 在实际实现中，这里会初始化任务面板的拖拽功能
  }

  /**
   * 启动自动出售检查
   */
  startAutoSellCheck (player) {
    if (!player) {
      return null
    }
    // 在实际实现中，这里会启动自动出售的定时检查
  }

  /**
   * 显示物品提示框
   */
  showItemTooltip (event, item) {
    if (!event || !item) {
      return null
    }
    // 在实际实现中，这里会显示物品的详细信息提示框
  }

  /**
   * 隐藏物品提示框
   */
  hideItemTooltip () {
    // 在实际实现中，这里会隐藏物品提示框
  }

  /**
   * 显示技能提示框
   */
  showSkillTooltip (event, skillKey) {
    if (!event || !skillKey) {
      return null
    }
    // 在实际实现中，这里会显示技能的详细信息提示框
  }

  /**
   * 隐藏技能提示框
   */
  hideSkillTooltip () {
    // 在实际实现中，这里会隐藏技能提示框
  }

  /**
   * 更新技能熟练度UI
   */
  updateSkillProficiencyUI (skillKey, player) {
    if (!player || !player.skills || !player.skills[skillKey]) {
      return
    }

    const skill = player.skills[skillKey]
    this.updateSkillProficiencyLevel(skillKey, skill.proficiencyLevel || 1)
    this.updateSkillProficiencyProgress(
      skillKey,
      skill.proficiency || 0,
      skill.proficiencyExp || (skill.proficiencyLevel || 1) * 10
    )
  }

  /**
   * 初始化技能熟练度UI
   * 基于old/init.js的initSkillProficiencyUI方法
   */
  initSkillProficiencyUI (player) {
    if (!player || !player.skills) {
      console.warn('没有玩家数据或技能数据，无法初始化技能熟练度UI')
      return
    }

    console.log('初始化技能熟练度UI...')

    // 技能键数组，包含所有可能的技能
    const skillKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']

    skillKeys.forEach(skillKey => {
      // 检查技能是否存在
      if (player.skills[skillKey]) {
        const skill = player.skills[skillKey]

        // 更新技能熟练度等级显示
        this.updateSkillProficiencyLevel(skillKey, skill.proficiencyLevel || 1)

        // 更新技能熟练度进度显示
        this.updateSkillProficiencyProgress(
          skillKey,
          skill.proficiency || 0,
          skill.proficiencyExp || (skill.proficiencyLevel || 1) * 10
        )
      }
    })
  }

  /**
   * 更新技能熟练度等级显示
   */
  updateSkillProficiencyLevel (skillKey, level) {
    if (!skillKey && level === undefined) {
      return null
    }
    // 在实际实现中，这里会更新技能熟练度等级的显示
    // 例如：document.getElementById(`proficiencyLevel${skillKey}`).textContent = level;
  }

  /**
   * 更新技能熟练度进度显示
   */
  updateSkillProficiencyProgress (skillKey, proficiency, proficiencyExp, skillLevel = 1) {
    if (proficiencyExp <= 0) {
      proficiencyExp = skillLevel * 10
    }

    const percentage = (proficiency / proficiencyExp) * 100
    console.log(
      `更新技能 ${skillKey} 熟练度进度: ${proficiency}/${proficiencyExp} (${percentage.toFixed(1)}%)`
    )

    // 在实际实现中，这里会更新技能熟练度进度的显示
    // 例如：document.querySelector(`#proficiencyProgress${skillKey} .proficiency-progress-inner`).style.width = `${percentage}%`;
  }

  /**
   * 初始化技能图标
   * 基于old/init.js的initSkillIcons方法
   */
  initSkillIcons (player, classConfig) {
    if (!player || !player.class || !classConfig || !classConfig[player.class]) {
      console.warn('没有玩家数据、职业数据或职业配置，无法初始化技能图标')
      return
    }

    console.log('初始化技能图标...')

    // 技能键数组，包含所有可能的技能
    const skillKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']

    // 获取当前职业的技能配置
    const currentClassSkills = classConfig[player.class].skills

    // 首先隐藏所有技能按钮
    skillKeys.forEach(skillKey => {
      console.log(`隐藏技能按钮: ${skillKey}`)
      // 在实际实现中，这里会隐藏技能按钮
      // 例如：document.getElementById(`skill${skillKey}`).style.display = 'none';
    })

    // 只显示当前职业拥有的技能按钮
    for (const skillKey in currentClassSkills) {
      const skill = currentClassSkills[skillKey]

      // 检查技能是否已解锁
      const isUnlocked = SkillUnlockChecker.checkSkillUnlockStatus(skill, player, {
        classConfig
      })

      if (isUnlocked) {
        console.log(`显示技能按钮: ${skillKey} - ${skill.name}`)

        // 在实际实现中，这里会显示技能按钮并设置图标
        // 例如：
        // const skillBtn = document.getElementById(`skill${skillKey}`);
        // if (skillBtn) {
        //   skillBtn.style.display = 'block';
        //
        //   // 设置技能图标
        //   const img = skillBtn.querySelector('img');
        //   if (img) {
        //     img.src = skill.icon || '/pt/skill_icon/default_skill.png';
        //     img.onerror = function() {
        //       this.src = '/pt/skill_icon/default_skill.png';
        //     };
        //   }
        //
        //   // 设置技能点击事件
        //   skillBtn.onclick = function() {
        //     useSkill(skillKey);
        //   };
        // }

        // 确保玩家有该技能
        if (!player.skills[skillKey]) {
          player.skills[skillKey] = {
            ...skill,
            proficiencyLevel: 1,
            proficiency: 0,
            proficiencyExp: 10 // 等级1 × 10
          }
        }
      } else {
        console.log(`技能 ${skillKey} 未解锁: 等级${player.level} < ${skill.unlockLevel || 1}`)
      }
    }

    console.log('技能图标初始化完成')
  }

  /**
   * 检查技能解锁状态
   * 基于old/init.js的checkSkillUnlockStatus方法
   */
  checkSkillUnlockStatus (player, classConfig) {
    if (!player || !player.class || !classConfig || !classConfig[player.class]) {
      console.warn('没有玩家数据、职业数据或职业配置，无法检查技能解锁状态')
      return false
    }

    console.log('检查技能解锁状态...')

    const currentClassSkills = classConfig[player.class].skills
    let hasNewSkillUnlocked = false

    // 遍历当前职业的所有技能
    for (const skillKey in currentClassSkills) {
      const skill = currentClassSkills[skillKey]

      // 检查技能是否已解锁
      const isUnlocked = SkillUnlockChecker.checkSkillUnlockStatus(skill, player, {
        classConfig
      })

      // 如果技能已解锁但玩家还没有该技能，添加该技能
      if (
        isUnlocked &&
        (!player.skills[skillKey] || player.skills[skillKey].proficiencyLevel === 0)
      ) {
        // 复制技能到玩家技能列表
        player.skills[skillKey] = {
          ...skill,
          proficiencyLevel: 1,
          proficiency: 0,
          proficiencyExp: 10 // 等级1 × 10
        }

        console.log(`解锁新技能: ${skill.name}!`)
        hasNewSkillUnlocked = true
      }
    }

    if (hasNewSkillUnlocked) {
      console.log('有新技能解锁，需要刷新技能UI')
    }

    console.log('技能解锁状态检查完成')
    return hasNewSkillUnlocked
  }

  /**
   * 更新生命条
   */
  updateHealthBar (elementId, currentHealth, maxHealth) {
    // 在实际实现中，这里会更新生命条的宽度
    const safeMaxHealth = Number(maxHealth) || 0
    const safeCurrentHealth = Number(currentHealth) || 0
    const percentage = safeMaxHealth > 0 ? (safeCurrentHealth / safeMaxHealth) * 100 : 0
    this.uiState.lastHealthBarTarget = elementId || null
    this.uiState.lastHealthPercent = Math.max(0, Math.min(100, percentage))
  }

  /**
   * 更新魔法条
   */
  updateManaBar (elementId, currentMana, maxMana) {
    const percentage = (currentMana / maxMana) * 100
 

    // 在实际实现中，这里会更新魔法条的宽度
    this.uiState.lastManaBarTarget = elementId || null
    this.uiState.lastManaPercent = Math.max(0, Math.min(100, percentage))
  }

  /**
   * 更新经验条
   */
  updateExpBar (elementId, currentExp, maxExp) {
    const percentage = (currentExp / maxExp) * 100
    console.log(`更新经验条: ${currentExp}/${maxExp} (${percentage.toFixed(1)}%)`)

    // 在实际实现中，这里会更新经验条的宽度
    this.uiState.lastExpBarTarget = elementId || null
    this.uiState.lastExpPercent = Math.max(0, Math.min(100, percentage))
  }

  /**
   * 显示玩家详情模态框
   */
  showPlayerDetailModal (player) {
    this.uiState.isPlayerDetailModalOpen = true
    console.log('显示玩家详情模态框:', player.nickname)

    // 在实际实现中，这里会显示玩家详情的模态框
  }

  /**
   * 隐藏玩家详情模态框
   */
  hidePlayerDetailModal () {
    this.uiState.isPlayerDetailModalOpen = false
    console.log('隐藏玩家详情模态框')

    // 在实际实现中，这里会隐藏玩家详情的模态框
  }

  /**
   * 显示背包模态框
   */
  showBagModal (player) {
    this.uiState.isBagModalOpen = true
    console.log('显示背包模态框，物品数量:', player.bag.length)

    // 在实际实现中，这里会显示背包的模态框
  }

  /**
   * 隐藏背包模态框
   */
  hideBagModal () {
    this.uiState.isBagModalOpen = false
    console.log('隐藏背包模态框')

    // 在实际实现中，这里会隐藏背包的模态框
  }

  /**
   * 显示商店模态框
   */
  showShopModal () {
    this.uiState.isShopModalOpen = true
    console.log('显示商店模态框')

    // 在实际实现中，这里会显示商店的模态框
  }

  /**
   * 隐藏商店模态框
   */
  hideShopModal () {
    this.uiState.isShopModalOpen = false
    console.log('隐藏商店模态框')

    // 在实际实现中，这里会隐藏商店的模态框
  }

  /**
   * 显示仓库模态框
   */
  showStorageModal (player) {
    this.uiState.isStorageModalOpen = true
    console.log('显示仓库模态框，银行物品数量:', player.bankBag.length)

    // 在实际实现中，这里会显示仓库的模态框
  }

  /**
   * 隐藏仓库模态框
   */
  hideStorageModal () {
    this.uiState.isStorageModalOpen = false
    console.log('隐藏仓库模态框')

    // 在实际实现中，这里会隐藏仓库的模态框
  }

  /**
   * 显示任务面板
   */
  showQuestPanel (player) {
    this.uiState.isQuestPanelOpen = true
    console.log('显示任务面板，进行中任务:', player.quest.activeQuests.length)

    // 在实际实现中，这里会显示任务面板
  }

  /**
   * 隐藏任务面板
   */
  hideQuestPanel () {
    this.uiState.isQuestPanelOpen = false
    console.log('隐藏任务面板')

    // 在实际实现中，这里会隐藏任务面板
  }

  /**
   * 显示设置模态框
   */
  showSettingsModal () {
    this.uiState.isSettingsModalOpen = true

    // 在实际实现中，这里会显示设置的模态框
  }

  /**
   * 隐藏设置模态框
   */
  hideSettingsModal () {
    this.uiState.isSettingsModalOpen = false

    // 在实际实现中，这里会隐藏设置的模态框
  }

  /**
   * 显示消息
   */
  showMessage (message, type = 'info') {
    console.log(`[${type}] ${message}`)

    // 在实际实现中，这里会显示消息提示
  }

  /**
   * 显示战斗日志
   */
  showBattleLog (message) {
    console.log(`[战斗日志] ${message}`)

    // 在实际实现中，这里会显示战斗日志
  }

  /**
   * 清空战斗日志
   */
  clearBattleLog () {
    console.log('清空战斗日志')

    // 在实际实现中，这里会清空战斗日志
  }

  /**
   * 更新可用背包格子数显示
   */
  updateAvailableBagSlots (player) {
    if (!player) {
      return
    }

    const usedSlots = player.bag.length
    const availableSlots = player.availableBagSlots
    console.log(`背包格子: ${usedSlots}/${availableSlots}`)

    // 在实际实现中，这里会更新背包格子数的显示
  }

  /**
   * 获取UI状态
   */
  getUIState () {
    return { ...this.uiState }
  }

  /**
   * 重置UI状态
   */
  resetUIState () {
    this.uiState = {
      isPlayerDetailModalOpen: false,
      isBagModalOpen: false,
      isShopModalOpen: false,
      isStorageModalOpen: false,
      isQuestPanelOpen: false,
      isSettingsModalOpen: false
    }
    console.log('UI状态已重置')
  }
}
