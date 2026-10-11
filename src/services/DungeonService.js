/**
 * 副本服务 - 负责副本页面数据初始化和管理
 * 基于old/fuben.js的bootstrapMainData函数重构
 */
export class DungeonService {
  constructor (gameDataService, storageService, uiService, playerRef = null) {
    this.gameDataService = gameDataService
    this.storageService = storageService
    this.uiService = uiService
    this.playerRef = playerRef // 添加对响应式player引用的依赖

    // 副本数据
    this.dungeonData = {
      // 难度倍率
      difficultyMultiplier: { 简单: 0.5, 普通: 1.0, 困难: 1.5, 地狱: 3.0 },

      // 默认副本
      defaultDungeon: { name: '乐雅裂隙', difficulty: '普通' },

      // 副本阶段配置
      dungeonStages: {
        乐雅裂隙: [
          { name: '深渊大猩猩', count: 60 },
          { name: '穴居幼虫', count: 30 },
          { name: '盲蛛女皇', count: 1 },
          { name: '穴居雾女', count: 30 },
          { name: '雾女女皇', count: 1 },
          { name: '穴居酋长', count: 1 }
        ]
      },

      // 当前副本信息
      currentDungeon: null,

      // 当前阶段
      currentStageIndex: 0,
      currentStageKills: 0,

      // 剩余时间（秒）
      remainingSeconds: 60 * 60, // 1小时

      // 怪物数据
      monsterData: null,

      // 装备套装数据
      equipmentSetData: {}
    }

    // 定时器
    this.countdownTimerId = null
    this.autoBattleTimerId = null
  }

  /**
   * 初始化副本服务
   */
  initialize () {
    console.log('初始化副本服务...')

    // 加载副本数据
    this.loadDungeonData()

    console.log('副本服务初始化完成')
  }

  /**
   * 加载副本数据
   */
  loadDungeonData () {
    try {
      // 从localStorage加载当前副本信息
      const savedDungeon = localStorage.getItem('currentDungeon')
      if (savedDungeon) {
        this.dungeonData.currentDungeon = JSON.parse(savedDungeon)
      } else {
        this.dungeonData.currentDungeon = { ...this.dungeonData.defaultDungeon }
      }

      // 从URL参数获取副本信息（如果存在）
      const urlParams = new URLSearchParams(window.location.search)
      const dungeonName = urlParams.get('name')
      const difficulty = urlParams.get('diff')

      if (dungeonName) {
        this.dungeonData.currentDungeon.name = dungeonName
      }

      if (difficulty) {
        this.dungeonData.currentDungeon.difficulty = difficulty
      }

      // 获取难度倍数
      const multiplier =
        this.dungeonData.difficultyMultiplier[this.dungeonData.currentDungeon.difficulty] || 1.0
      this.dungeonData.multiplier = multiplier

      // 获取副本阶段
      const stages = this.dungeonData.dungeonStages[this.dungeonData.currentDungeon.name] || []
      if (stages.length === 0) {
        console.warn(
          `未配置副本【${this.dungeonData.currentDungeon.name}】的怪物阶段，使用默认副本`
        )
        this.dungeonData.currentDungeon.name = '乐雅裂隙'
        this.dungeonData.stages = this.dungeonData.dungeonStages['乐雅裂隙']
      } else {
        this.dungeonData.stages = stages
      }

      // 加载剩余时间
      const savedRemainingSeconds = localStorage.getItem('dungeonRemainingSeconds')
      if (savedRemainingSeconds) {
        this.dungeonData.remainingSeconds = parseInt(savedRemainingSeconds, 10)
      }

      console.log('副本数据加载完成:', this.dungeonData.currentDungeon)
    } catch (error) {
      console.error('加载副本数据失败:', error)
      this.dungeonData.currentDungeon = { ...this.dungeonData.defaultDungeon }
      this.dungeonData.multiplier = 1.0
      this.dungeonData.stages = this.dungeonData.dungeonStages['乐雅裂隙']
    }
  }

  /**
   * 初始化主页面数据（物品/怪物/套装/玩家）
   * 基于old/fuben.js的bootstrapMainData函数
   */
  async bootstrapMainData () {
    console.log('开始初始化副本主页面数据...')

    try {
      // 1. 加载物品数据
      await this.loadItemData()

      // 2. 加载怪物数据
      await this.loadMonsterData()

      // 3. 加载装备套装数据
      await this.loadEquipmentSetData()

      // 4. 初始化玩家数据
      await this.initPlayer()

      // 5. 更新属性UI
      this.updateAttributeUI()

      console.log('副本主页面数据初始化完成')
      return true
    } catch (error) {
      console.error('副本主页面数据初始化失败:', error)
      return false
    }
  }

  /**
   * 加载物品数据
   */
  async loadItemData () {
    try {
      if (this.gameDataService && this.gameDataService.loadItemData) {
        await this.gameDataService.loadItemData()
        console.log('物品数据加载完成')
      } else {
        console.warn('GameDataService未提供loadItemData方法')
      }
    } catch (error) {
      console.error('加载物品数据失败:', error)
      throw error
    }
  }

  /**
   * 加载怪物数据
   */
  async loadMonsterData () {
    try {
      if (this.gameDataService && this.gameDataService.loadMonsterData) {
        const monsterData = await this.gameDataService.loadMonsterData()
        this.dungeonData.monsterData = monsterData
        console.log('怪物数据加载完成，数量:', Object.keys(monsterData || {}).length)
      } else {
        console.warn('GameDataService未提供loadMonsterData方法')
      }
    } catch (error) {
      console.error('加载怪物数据失败:', error)
      throw error
    }
  }

  /**
   * 加载装备套装数据
   */
  async loadEquipmentSetData () {
    try {
      if (this.gameDataService && this.gameDataService.loadEquipmentSetData) {
        const equipmentSetData = await this.gameDataService.loadEquipmentSetData()
        this.dungeonData.equipmentSetData = equipmentSetData || {}
        const count =
          typeof equipmentSetData === 'object' && !Array.isArray(equipmentSetData)
            ? Object.keys(equipmentSetData).length
            : Array.isArray(equipmentSetData)
              ? equipmentSetData.length
              : 0
        console.log('装备套装数据加载完成，数量:', count)
      } else {
        console.warn('GameDataService未提供loadEquipmentSetData方法')
      }
    } catch (error) {
      console.error('加载装备套装数据失败:', error)
      throw error
    }
  }

  /**
   * 初始化玩家数据
   */
  async initPlayer () {
    try {
      // 从存储中加载玩家数据
      const playerData = this.storageService.getCurrentSaveData()

      if (!playerData) {
        console.error('未找到玩家数据')
        throw new Error('未找到玩家数据')
      }

      // 设置副本玩家数据
      window.fuben_player = playerData

      // 设置副本玩家数据
      window.fuben_player = playerData

      // 如果提供了响应式player引用，则更新它
      if (this.playerRef) {
        this.playerRef.value = playerData
 
      } else {
        // 否则设置全局window.player作为后备方案
        if (!window.player) {
          window.player = playerData
        }
      }
    } catch (error) {
      console.error('初始化玩家数据失败:', error)
      throw error
    }
  }

  /**
   * 更新属性UI
   */
  updateAttributeUI () {
    try {
      if (this.uiService && this.uiService.updateAttributeUI) {
        // 优先使用响应式player引用，否则回退到全局变量
        let player
        if (this.playerRef) {
          player = this.playerRef.value
        } else {
          player = window.player || window.fuben_player
        }
        if (player) {
          this.uiService.updateAttributeUI(player)
       
        } else {
          console.warn('没有玩家数据可用于更新属性UI')
        }
      } else {
        console.warn('UIService未提供updateAttributeUI方法')
      }
    } catch (error) {
      console.error('更新属性UI失败:', error)
    }
  }

  /**
   * 开始副本倒计时
   */
  startCountdown () {
    // 清理现有的定时器
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId)
    }

    // 每秒更新一次倒计时
    this.countdownTimerId = setInterval(() => {
      if (this.dungeonData.remainingSeconds > 0) {
        this.dungeonData.remainingSeconds--

        // 保存剩余时间到localStorage
        localStorage.setItem(
          'dungeonRemainingSeconds',
          this.dungeonData.remainingSeconds.toString()
        )

        // 更新UI显示
        this.updateCountdownUI()
      } else {
        // 时间到，停止倒计时
        this.stopCountdown()
     
      }
    }, 1000)
  }

  /**
   * 更新倒计时UI
   */
  updateCountdownUI () {
    // 这里应该调用UI服务更新倒计时显示
    // 由于Vue是响应式的，我们将在组件中处理UI更新

    // console.log(
    //   `副本剩余时间: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    // )
  }

  /**
   * 停止倒计时
   */
  stopCountdown () {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId)
      this.countdownTimerId = null
    
    }
  }

  /**
   * 加载当前阶段怪物
   */
  async loadStageMonster () {
    if (!this.dungeonData.stages || this.dungeonData.stages.length === 0) {
      console.error('没有可用的副本阶段')
      return
    }

    const currentStage = this.dungeonData.stages[this.dungeonData.currentStageIndex]
    if (!currentStage) {
      console.error('当前阶段不存在')
      return
    }

    // console.log(
    //   `加载第${this.dungeonData.currentStageIndex + 1}阶段怪物: ${currentStage.name}, 数量: ${currentStage.count}`
    // )

    // 这里应该实现具体的怪物加载逻辑
    // 基于怪物数据和难度倍数创建怪物实例

    // 更新阶段进度UI
    this.updateStageProgressUI()
  }

  /**
   * 更新阶段进度UI
   */
  updateStageProgressUI () {
    if (!this.dungeonData.stages || this.dungeonData.stages.length === 0) {
      this.dungeonData.stageProgress = 0
      this.dungeonData.stageProgressTotal = 0
      return
    }
    const total = Number(this.dungeonData.stages[this.dungeonData.currentStageIndex]?.count || 0)
    const progress = Number(this.dungeonData.currentStageKills || 0)
    this.dungeonData.stageProgress = progress
    this.dungeonData.stageProgressTotal = total
  }


  /**
   * 进入下一个阶段
   */
  nextStage () {
    if (!this.dungeonData.stages || this.dungeonData.stages.length === 0) {
      console.error('没有可用的副本阶段')
      return
    }

    this.dungeonData.currentStageIndex++
    this.dungeonData.currentStageKills = 0

    if (this.dungeonData.currentStageIndex >= this.dungeonData.stages.length) {
      
      this.completeDungeon()
      return
    }

  
    // 加载新阶段怪物
    this.loadStageMonster()
  }

  /**
   * 完成副本
   */
  completeDungeon () {
  
    // 停止倒计时
    this.stopCountdown()

    // 停止自动战斗
    this.stopAutoBattle()

    // 清理副本数据
    this.cleanupDungeonData()

    // 发放奖励
    this.giveRewards()
  }

  /**
   * 发放奖励
   */
  /**
   * 副本怪物掉落处理函数（金币 + 物品）
   * 根据副本难度调整掉落倍率
   */
  dropLootForMonster (monsterId) {
    if (!monsterId) {
      console.error('怪物ID无效')
      return
    }

    if (!this.dungeonData.monsterData) {
      console.error('怪物数据未加载完成')
      return
    }

    const monster = this.dungeonData.monsterData[monsterId]
    if (!monster) {
      console.error(`未找到ID为 ${monsterId} 的怪物数据`)
      return
    }

    // 优先使用响应式player引用，否则回退到全局变量
    let p
    if (this.playerRef) {
      p = this.playerRef.value || {}
    } else {
      p = window.player || {}
    }

    // 1. 掉落金币（根据难度倍率增加）
    const minGold = monster.minDropGold || 0
    const maxGold = monster.maxDropGold || 0
    const baseGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold
    const goldGained = Math.floor(baseGold * this.dungeonData.multiplier) // 根据难度倍率调整金币

    if (goldGained > 0) {
      p.gold = (p.gold || 0) + goldGained

      // 更新金币显示
      if (this.uiService && this.uiService.updateGoldDisplay) {
        this.uiService.updateGoldDisplay(p.gold)
      }

 
      // 播放金币音效
      // 这里需要实现音效播放逻辑
    }

    // 2. 掉落物品（根据难度倍率提高掉率）
    if (!monster.drops || monster.drops.length === 0) {
      
      return
    }

    // 导入或定义概率解析函数
    const parseProbabilityRange = range => {
      if (!range || typeof range !== 'string') {
        console.warn('[parseProbabilityRange] 概率范围为空或格式错误:', range)
        return { min: 0, max: 0, isSingleValue: true }
      }

      // 处理 <0.001% 这种格式（小于某值）
      if (range.startsWith('<') || range.startsWith('≤')) {
        const valueStr = range.replace(/^[<≤]/, '').trim().replace('%', '')
        const value = parseFloat(valueStr)
        if (isNaN(value)) {
          console.error('[parseProbabilityRange] 解析单值失败:', range)
          return { min: 0, max: 0, isSingleValue: true }
        }
        // 对于 <0.001%，返回该值作为固定掉率
        // console.log(`[parseProbabilityRange] 单值格式: ${range} -> ${value}%`)
        return { min: value, max: value, isSingleValue: true }
      }

      // 处理 [0.01%;0.1%[ 这种区间格式
      const cleanedRange = range.replace(/^[[(]|[\])]$/g, '')
      const parts = cleanedRange.split(';')

      // 如果只有一个值，处理为单一概率
      if (parts.length === 1) {
        const valueStr = parts[0].trim().replace('%', '')
        const value = parseFloat(valueStr)
        if (isNaN(value)) {
          console.error('[parseProbabilityRange] 解析单值失败:', range)
          return { min: 0, max: 0, isSingleValue: true }
        }
        // console.log(`[parseProbabilityRange] 单值格式: ${range} -> ${value}%`)
        return { min: value, max: value, isSingleValue: true }
      }

      // 处理区间格式
      if (parts.length !== 2) {
        console.warn('[parseProbabilityRange] 概率范围格式错误:', range)
        return { min: 0, max: 0, isSingleValue: true }
      }

      const min = parseFloat(parts[0].trim().replace('%', ''))
      const max = parseFloat(parts[1].trim().replace('%', ''))

      if (isNaN(min) || isNaN(max)) {
        console.error('[parseProbabilityRange] 解析区间失败:', { range, min, max })
        return { min: 0, max: 0, isSingleValue: true }
      }

      // console.log(`[parseProbabilityRange] 区间格式: ${range} -> [${min}%, ${max}%]`)
      return { min, max, isSingleValue: false }
    }

    monster.drops.forEach(drop => {
      const itemId = drop.item
      const probabilityRange = drop.probabilityRange

 

      const { min, max, isSingleValue } = parseProbabilityRange(probabilityRange)

      // 【关键修复】根据是否为单值来计算掉率
      let finalDropChance
      if (isSingleValue) {
        // 单值格式：直接使用该值 * 难度倍数
        finalDropChance = min * this.dungeonData.multiplier
       
      } else {
        // 区间格式：从区间中随机取值，再 * 难度倍数
        const randomBase = Math.random() * (max - min) + min
        finalDropChance = randomBase * this.dungeonData.multiplier
       
      }

      const randomChance = Math.random() * 100

     

      if (randomChance < finalDropChance) {
        // 播放掉落音效
        if (this.gameDataService && this.gameDataService.audioService) {
          this.gameDataService.audioService.playItemDropSFX()
        }

        // 添加物品到背包
        if (this.gameDataService && this.gameDataService.bagService) {
          // 获取物品信息
          const itemData = this.gameDataService.getItemDataById(itemId)
          const itemIcon = itemData
            ? `/pt/item_icon/${itemId}.png`
            : '/pt/item_icon/default_item.png'

          // 添加物品到背包
          this.gameDataService.bagService.addItemToBag(itemId, itemIcon, 1)

          // 获取物品名称
          const itemObject = itemData || { id: itemId }
          const itemName = window.getItemName
            ? window.getItemName(itemObject)
            : itemData && itemData.name
              ? typeof itemData.name === 'object'
                ? itemData.name.cns || itemData.name.en || `物品ID: ${itemId}`
                : itemData.name
              : `物品ID: ${itemId}`

          console.log(`获得物品 ${itemName}`)

          // 添加战斗日志
          if (this.uiService && this.uiService.addBattleLog) {
            this.uiService.addBattleLog(
              `副本掉落: 获得物品(${itemName})x1`,
              true,
              'common',
              itemData?.rarity
            )
          }
        } else {
          console.warn('无法添加物品到背包：缺少bagService')
        }
      }
    })
  }

  giveRewards () {
   
    // 这里应该实现奖励发放逻辑
    // 基于副本难度和完成情况发放经验、金币、物品等
 
  }

  /**
   * 开始自动战斗
   */
  startAutoBattle () {
    // 清理现有的定时器
    if (this.autoBattleTimerId) {
      clearInterval(this.autoBattleTimerId)
    }

    // 每2秒攻击一次
    this.autoBattleTimerId = setInterval(() => {
      this.performAttack()
    }, 2000)

 
  }

  /**
   * 停止自动战斗
   */
  stopAutoBattle () {
    if (this.autoBattleTimerId) {
      clearInterval(this.autoBattleTimerId)
      this.autoBattleTimerId = null
 
    }
  }

  /**
   * 执行攻击
   */
  performAttack () {
  

    // 这里应该实现攻击逻辑
    // 包括伤害计算、怪物状态更新、掉落物品等

    // 增加击杀计数
    this.dungeonData.currentStageKills++

    // 检查是否完成当前阶段
    const currentStage = this.dungeonData.stages[this.dungeonData.currentStageIndex]
    if (this.dungeonData.currentStageKills >= currentStage.count) {
      this.nextStage()
    } else {
      this.updateStageProgressUI()
    }
  }

  /**
   * 清理副本数据
   */
  cleanupDungeonData () {
    // 清理localStorage中的副本数据
    localStorage.removeItem('dungeonRemainingSeconds')
    localStorage.removeItem('currentDungeon')

    // 重置副本状态
    this.dungeonData.currentDungeon = { ...this.dungeonData.defaultDungeon }
    this.dungeonData.currentStageIndex = 0
    this.dungeonData.currentStageKills = 0
    this.dungeonData.remainingSeconds = 60 * 60

  
  }

  /**
   * 获取当前副本信息
   * @returns {Object} 当前副本信息
   */
  getCurrentDungeon () {
    return { ...this.dungeonData.currentDungeon }
  }

  /**
   * 获取当前阶段信息
   * @returns {Object} 当前阶段信息
   */
  getCurrentStage () {
    if (!this.dungeonData.stages || this.dungeonData.stages.length === 0) {
      return null
    }

    const stage = this.dungeonData.stages[this.dungeonData.currentStageIndex]
    if (!stage) {
      return null
    }

    return {
      ...stage,
      index: this.dungeonData.currentStageIndex,
      kills: this.dungeonData.currentStageKills,
      total: this.dungeonData.stages.length
    }
  }

  /**
   * 获取剩余时间
   * @returns {Object} 剩余时间（时、分、秒）
   */
  getRemainingTime () {
    const hours = Math.floor(this.dungeonData.remainingSeconds / 3600)
    const minutes = Math.floor((this.dungeonData.remainingSeconds % 3600) / 60)
    const seconds = this.dungeonData.remainingSeconds % 60

    return {
      hours,
      minutes,
      seconds,
      totalSeconds: this.dungeonData.remainingSeconds
    }
  }

  /**
   * 清理副本服务
   */
  cleanup () {
    // 停止所有定时器
    this.stopCountdown()
    this.stopAutoBattle()

    // 清理副本数据
    this.cleanupDungeonData()
 
  }
}
