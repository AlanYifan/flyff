/**
 * 游戏初始化功能测试
 * 用于验证游戏初始化功能的正确性
 */
import { StaticGameInitializer } from '@/services/StaticGameInitializer'
import { StorageService } from '@/services/StorageService'

// 模拟localStorage
const mockLocalStorage = {
  store: {},
  getItem (key) {
    return this.store[key] || null
  },
  setItem (key, value) {
    this.store[key] = value
  },
  removeItem (key) {
    delete this.store[key]
  },
  clear () {
    this.store = {}
  }
}

// 替换全局localStorage
global.localStorage = mockLocalStorage

describe('游戏初始化功能测试', () => {
  let gameInitializer
  let storageService

  beforeEach(() => {
    // 清空模拟存储
    mockLocalStorage.clear()

    // 创建实例
    gameInitializer = new StaticGameInitializer()
    storageService = new StorageService()

    // 设置测试用户数据
    const testUserData = {
      username: 'testuser',
      password: 'testpass',
      saveSlots: {
        0: {
          nickname: '测试玩家',
          class: 'warrior',
          sex: 'male',
          level: 1,
          exp: 0,
          maxExp: 100,
          gold: 100,
          diamonds: 10,
          bankGold: 0,
          maxHealth: 100,
          currentHealth: 100,
          maxMana: 100,
          currentMana: 100,
          attack: 10,
          defense: 5,
          criticalRate: 5,
          criticalDamage: 1.5,
          attackSpeed: 100,
          hitRate: 95,
          lifeSteal: 0,
          blockRate: 5,
          dodgeRate: 5,
          stun: 0,
          decreasedCastingTime: 0,
          pveAttackBonus: 0,
          pveDefenseBonus: 0,
          fireAttack: 0,
          waterAttack: 0,
          thunderAttack: 0,
          windAttack: 0,
          earthAttack: 0,
          availableBagSlots: 165,
          totalBagSlots: 165,
          bag: [],
          equipmentBag: [],
          bankBag: [],
          skills: {},
          stats: {
            strength: 1,
            agility: 1,
            intelligence: 1,
            constitution: 1,
            freePoints: 4
          },
          tempStats: {},
          originalStats: {},
          activeBuffs: [],
          quest: {
            activeQuests: [],
            completedQuests: []
          }
        }
      }
    }

    // 保存测试数据
    storageService.saveUserData(testUserData)
    storageService.saveUserField('currentSaveSlot', 0)
  })

  afterEach(() => {
    // 清理游戏资源
    if (gameInitializer) {
      gameInitializer.destroy()
    }
  })

  test('游戏初始化器创建成功', () => {
    expect(gameInitializer).toBeDefined()
    expect(gameInitializer.getState).toBeDefined()
    expect(gameInitializer.initGame).toBeDefined()
  })

  test('获取游戏状态', () => {
    const state = gameInitializer.getState()
    expect(state).toBeDefined()
    expect(state.player).toBeNull()
    expect(state.isInitialized).toBe(false)
    expect(state.isLoading).toBe(false)
  })

  test('验证用户数据功能', () => {
    // 测试有效用户数据
    const isValid = gameInitializer.validateUserData()
    expect(isValid).toBe(true)

    // 清空用户数据，测试无效情况
    mockLocalStorage.clear()
    const isValidAfterClear = gameInitializer.validateUserData()
    expect(isValidAfterClear).toBe(false)
  })

  test('获取默认职业配置', () => {
    const classConfig = gameInitializer.getDefaultClassConfig()
    expect(classConfig).toBeDefined()
    expect(classConfig.beginner).toBeDefined()
    expect(classConfig.warrior).toBeDefined()
    expect(classConfig.beginner.name).toBe('初心者')
    expect(classConfig.warrior.name).toBe('战士')
  })

  test('获取默认技能配置', () => {
    const skillConfig = gameInitializer.getDefaultSkillConfig()
    expect(skillConfig).toBeDefined()
    expect(skillConfig.proficiency).toBeDefined()
    expect(skillConfig.effects).toBeDefined()
    expect(skillConfig.proficiency.baseExp).toBe(100)
    expect(skillConfig.effects.stun).toBeDefined()
  })

  test('定时器管理功能', () => {
    // 添加定时器
    gameInitializer.addTimer(
      'testTimer',
      () => {},
      100
    )

    // 检查定时器是否存在
    expect(gameInitializer.timers.has('testTimer')).toBe(true)

    // 清理定时器
    gameInitializer.clearTimer('testTimer')
    expect(gameInitializer.timers.has('testTimer')).toBe(false)

    // 测试清理不存在的定时器
    expect(() => {
      gameInitializer.clearTimer('nonExistentTimer')
    }).not.toThrow()
  })

  test('服务获取功能', () => {
    const storageService = gameInitializer.getService('storage')
    const uiService = gameInitializer.getService('ui')
    const audioService = gameInitializer.getService('audio')
    const dataService = gameInitializer.getService('data')

    expect(storageService).toBeDefined()
    expect(uiService).toBeDefined()
    expect(audioService).toBeDefined()
    expect(dataService).toBeDefined()

    // 测试获取不存在的服务
    const nonExistentService = gameInitializer.getService('nonExistent')
    expect(nonExistentService).toBeUndefined()
  })

  test('游戏资源清理功能', () => {
    // 添加一些定时器和动画帧
    gameInitializer.addTimer('testTimer1', () => {}, 1000)
    gameInitializer.addTimer('testTimer2', () => {}, 2000)

    // 模拟动画帧
    gameInitializer.animationFrames.set('testFrame1', 1)
    gameInitializer.animationFrames.set('testFrame2', 2)

    // 检查资源存在
    expect(gameInitializer.timers.size).toBe(2)
    expect(gameInitializer.animationFrames.size).toBe(2)

    // 清理资源
    gameInitializer.destroy()

    // 检查资源已清理
    expect(gameInitializer.timers.size).toBe(0)
    expect(gameInitializer.animationFrames.size).toBe(0)
    expect(gameInitializer.state.player).toBeNull()
    expect(gameInitializer.state.isInitialized).toBe(false)
  })

  test('玩家数据准备功能', () => {
    const saveData = {
      nickname: '测试玩家',
      class: 'warrior',
      level: 5
    }

    const preparedData = gameInitializer.preparePlayerData(saveData)

    expect(preparedData).toBeDefined()
    expect(preparedData.nickname).toBe('测试玩家')
    expect(preparedData.class).toBe('warrior')
    expect(preparedData.level).toBe(5)

    // 检查默认值
    expect(preparedData.exp).toBe(0)
    expect(preparedData.maxExp).toBe(100)
    expect(preparedData.gold).toBe(0)
    expect(preparedData.stats).toBeDefined()
    expect(preparedData.stats.freePoints).toBe(5)
  })

  test('物品数据修复功能', () => {
    const items = [
      { id: 1, name: '测试物品1', icon: undefined },
      { id: 2, name: '测试物品2', icon: '/pt/item_icon/2.png' }
    ]

    const itemData = [
      { id: 1, name: '完整物品1', icon: '1.png' },
      { id: 2, name: '完整物品2', icon: '2.png' }
    ]

    const fixedItems = gameInitializer.fixItems(items, itemData)

    expect(fixedItems).toBeDefined()
    expect(fixedItems.length).toBe(2)

    // 检查第一个物品的图标被修复
    expect(fixedItems[0].icon).toBe('/pt/item_icon/1.png')
    expect(fixedItems[0].name).toBe('完整物品1')

    // 检查第二个物品保持不变
    expect(fixedItems[1].icon).toBe('/pt/item_icon/2.png')
    expect(fixedItems[1].name).toBe('完整物品2')
  })

  test('技能对象创建功能', () => {
    const baseSkill = {
      name: '测试技能',
      damage: 50,
      cd: 1000,
      type: 'physical',
      icon: '/pt/skill_icon/test.png'
    }

    const skillObject = gameInitializer.createSkillObject(baseSkill)

    expect(skillObject).toBeDefined()
    expect(skillObject.name).toBe('测试技能')
    expect(skillObject.damage).toBe(50)
    expect(skillObject.cd).toBe(1000)
    expect(skillObject.type).toBe('physical')
    expect(skillObject.icon).toBe('/pt/skill_icon/test.png')
    expect(skillObject.proficiencyLevel).toBe(1)
    expect(skillObject.proficiency).toBe(0)
    expect(skillObject.proficiencyExp).toBe(100)
  })

  test('重定向功能', () => {
    // 保存原始window.location
    const originalLocation = window.location

    // 模拟重定向
    delete window.location
    window.location = { href: '' }

    // 测试重定向到登录页面
    gameInitializer.redirectToLogin()
    expect(window.location.href).toBe('/')

    // 测试重定向到角色选择页面
    gameInitializer.redirectToSelect()
    expect(window.location.href).toBe('/select')

    // 测试重定向到创建角色页面
    gameInitializer.redirectToCreate()
    expect(window.location.href).toBe('/create')

    // 恢复原始window.location
    window.location = originalLocation
  })

})

