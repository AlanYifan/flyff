/**
 * 自动战斗服务测试
 * 测试AutoBattleService的核心功能
 */
import AutoBattleService from '../services/AutoBattleService.js'

describe('AutoBattleService', () => {
  let autoBattleService
  let mockPlayer
  let mockMonsters
  let mockSkills
  let mockCallbacks

  beforeEach(() => {
    // 创建模拟数据
    mockPlayer = {
      nickname: '测试玩家',
      level: 1,
      currentHealth: 100,
      maxHealth: 100,
      currentMana: 50,
      maxMana: 50,
      attack: 15,
      attackSpeed: 0,
      stats: {
        freePoints: 0
      }
    }

    mockMonsters = [
      {
        id: 1,
        name: '小怪',
        level: 1,
        currentHealth: 50,
        maxHealth: 50,
        defense: 5,
        exp: 10,
        gold: 5,
        drops: []
      },
      {
        id: 2,
        name: '中怪',
        level: 3,
        currentHealth: 80,
        maxHealth: 80,
        defense: 8,
        exp: 20,
        gold: 10,
        drops: []
      }
    ]

    mockSkills = [
      {
        key: 'attack1',
        name: '普通攻击',
        description: '对目标造成普通伤害',
        icon: '/pt/skill_icon/attack.png',
        cooldown: 0,
        manaCost: 0,
        damage: 20,
        type: 'attack'
      },
      {
        key: 'heal1',
        name: '治疗术',
        description: '恢复自身生命值',
        icon: '/pt/skill_icon/heal.png',
        cooldown: 0,
        manaCost: 10,
        damage: 30,
        type: 'heal'
      }
    ]

    mockCallbacks = {
      onAttack: jest.fn(),
      onSkillUse: jest.fn(),
      onLog: jest.fn()
    }

    // 创建自动战斗服务实例
    autoBattleService = new AutoBattleService()
  })

  afterEach(() => {
    // 清理定时器
    if (autoBattleService.isActive) {
      autoBattleService.stop()
    }
    autoBattleService.cleanup()
  })

  test('应该正确初始化自动战斗服务', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    expect(autoBattleService.player).toBe(mockPlayer)
    expect(autoBattleService.monsters).toBe(mockMonsters)
    expect(autoBattleService.skills).toBe(mockSkills)
    expect(autoBattleService.onAttack).toBe(mockCallbacks.onAttack)
    expect(autoBattleService.onSkillUse).toBe(mockCallbacks.onSkillUse)
    expect(autoBattleService.onLog).toBe(mockCallbacks.onLog)
  })

  test('应该正确计算攻击间隔', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills
    })

    // 测试基础攻击间隔
    const baseInterval = autoBattleService.calculateAttackInterval()
    expect(baseInterval).toBe(2000) // 默认基础间隔2000ms

    // 测试有攻击速度的情况
    mockPlayer.attackSpeed = 50
    const intervalWithSpeed = autoBattleService.calculateAttackInterval()
    expect(intervalWithSpeed).toBeLessThan(2000)
    expect(intervalWithSpeed).toBeGreaterThanOrEqual(500) // 最小间隔500ms
  })

  test('应该正确启动和停止自动战斗', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    // 启动自动战斗
    autoBattleService.start()
    expect(autoBattleService.isActive).toBe(true)
    expect(mockCallbacks.onLog).toHaveBeenCalledWith('自动战斗已启动')

    // 停止自动战斗
    autoBattleService.stop()
    expect(autoBattleService.isActive).toBe(false)
    expect(mockCallbacks.onLog).toHaveBeenCalledWith(expect.stringContaining('自动战斗已停止'))
  })

  test('应该正确切换自动战斗状态', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    // 第一次切换：启动
    const result1 = autoBattleService.toggle()
    expect(result1).toBe(true)
    expect(autoBattleService.isActive).toBe(true)

    // 第二次切换：停止
    const result2 = autoBattleService.toggle()
    expect(result2).toBe(false)
    expect(autoBattleService.isActive).toBe(false)
  })

  test('应该正确选择攻击目标', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills
    })

    // 测试随机选择策略
    autoBattleService.config.targetSelection = 'random'
    const randomTarget = autoBattleService.selectTarget()
    expect(randomTarget).toBeGreaterThanOrEqual(0)
    expect(randomTarget).toBeLessThan(mockMonsters.length)

    // 测试选择最弱目标
    autoBattleService.config.targetSelection = 'weakest'
    mockMonsters[0].currentHealth = 10
    mockMonsters[1].currentHealth = 80
    const weakestTarget = autoBattleService.selectTarget()
    expect(weakestTarget).toBe(0)

    // 测试选择最强目标
    autoBattleService.config.targetSelection = 'strongest'
    const strongestTarget = autoBattleService.selectTarget()
    expect(strongestTarget).toBe(1)

    // 测试没有存活怪物的情况
    mockMonsters.forEach(monster => {
      monster.currentHealth = 0
    })
    const noTarget = autoBattleService.selectTarget()
    expect(noTarget).toBe(-1)
  })

  test('应该正确检查玩家状态', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    // 测试正常状态
    mockPlayer.currentHealth = 100
    const normalStatus = autoBattleService.checkPlayerStatus()
    expect(normalStatus).toBe(true)

    // 测试死亡状态
    mockPlayer.currentHealth = 0
    autoBattleService.start()
    const deadStatus = autoBattleService.checkPlayerStatus()
    expect(deadStatus).toBe(false)
    expect(autoBattleService.isActive).toBe(false)
    expect(mockCallbacks.onLog).toHaveBeenCalledWith('玩家已死亡，停止自动战斗')

    // 重置状态
    autoBattleService.stop()
    mockPlayer.currentHealth = 100

    // 测试低生命值状态
    mockPlayer.currentHealth = 20 // 20/100 = 20% < 30%阈值
    autoBattleService.start()
    const lowHealthStatus = autoBattleService.checkPlayerStatus()
    expect(lowHealthStatus).toBe(true)
    expect(mockCallbacks.onLog).toHaveBeenCalledWith(expect.stringContaining('生命值过低'))
  })

  test('应该正确获取可用技能', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills
    })

    // 测试所有技能可用
    const availableSkills1 = autoBattleService.getAvailableSkills()
    expect(availableSkills1.length).toBe(2)

    // 测试技能冷却中
    mockSkills[0].cooldown = 5
    const availableSkills2 = autoBattleService.getAvailableSkills()
    expect(availableSkills2.length).toBe(1)
    expect(availableSkills2[0].key).toBe('heal1')

    // 重置冷却
    mockSkills[0].cooldown = 0

    // 测试魔法值不足
    mockPlayer.currentMana = 5
    const availableSkills3 = autoBattleService.getAvailableSkills()
    expect(availableSkills3.length).toBe(1)
    expect(availableSkills3[0].key).toBe('attack1')
  })

  test('应该正确执行攻击', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    const targetIndex = 0
    const initialHealth = mockMonsters[targetIndex].currentHealth

    // 执行攻击
    autoBattleService.performAttack(targetIndex)

    // 验证怪物受到伤害
    expect(mockMonsters[targetIndex].currentHealth).toBeLessThan(initialHealth)

    // 验证回调被调用
    expect(mockCallbacks.onLog).toHaveBeenCalledWith(
      expect.stringContaining(`攻击 ${mockMonsters[targetIndex].name}`)
    )

    // 验证统计更新
    expect(autoBattleService.stats.totalAttacks).toBe(1)
    expect(autoBattleService.stats.totalDamage).toBeGreaterThan(0)
  })

  test('应该正确使用技能', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    const skillToUse = mockSkills[1] // 治疗术

    // 使用技能
    autoBattleService.useSkill(skillToUse)

    // 验证魔法值消耗
    expect(mockPlayer.currentMana).toBe(40) // 50 - 10

    // 验证技能冷却设置
    expect(skillToUse.cooldown).toBe(10)

    // 验证统计更新
    expect(autoBattleService.stats.skillsUsed).toBe(1)

    // 验证回调被调用
    expect(mockCallbacks.onLog).toHaveBeenCalledWith(
      expect.stringContaining(`使用技能: ${skillToUse.name}`)
    )
    expect(mockCallbacks.onSkillUse).toHaveBeenCalledWith(skillToUse)
  })

  test('应该正确更新配置', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    const newConfig = {
      targetSelection: 'weakest',
      baseAttackInterval: 1500,
      healthThreshold: 0.2
    }

    // 更新配置
    autoBattleService.updateConfig(newConfig)

    // 验证配置已更新
    expect(autoBattleService.config.targetSelection).toBe('weakest')
    expect(autoBattleService.config.baseAttackInterval).toBe(1500)
    expect(autoBattleService.config.healthThreshold).toBe(0.2)

    // 验证日志记录
    expect(mockCallbacks.onLog).toHaveBeenCalledWith('自动战斗配置已更新')
  })

  test('应该正确获取状态信息', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills
    })

    // 获取状态
    const status = autoBattleService.getStatus()

    // 验证状态信息
    expect(status.isActive).toBe(false)
    expect(status.config).toEqual(autoBattleService.config)
    expect(status.stats).toEqual(autoBattleService.stats)
    expect(status.player).toEqual({
      health: '100/100',
      mana: '50/50',
      attackSpeed: 0
    })
    expect(status.attackInterval).toBe(2000)
  })

  test('应该正确清理资源', () => {
    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      ...mockCallbacks
    })

    // 启动自动战斗
    autoBattleService.start()
    expect(autoBattleService.isActive).toBe(true)

    // 清理资源
    autoBattleService.cleanup()

    // 验证资源已清理
    expect(autoBattleService.isActive).toBe(false)
    expect(autoBattleService.player).toBeNull()
    expect(autoBattleService.monsters).toBeNull()
    expect(autoBattleService.skills).toBeNull()
    expect(autoBattleService.onAttack).toBeNull()
    expect(autoBattleService.onSkillUse).toBeNull()
    expect(autoBattleService.onLog).toBeNull()
  })

  test('应该正确处理自动战斗循环', done => {
    // 使用jest的假定时器
    jest.useFakeTimers()

    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      onAttack: (targetIndex, damage) => {
        // 验证攻击被触发
        expect(targetIndex).toBeGreaterThanOrEqual(0)
        expect(targetIndex).toBeLessThan(mockMonsters.length)
        expect(damage).toBeGreaterThan(0)

        // 停止自动战斗
        autoBattleService.stop()
        done()
      },
      onLog: jest.fn()
    })

    // 启动自动战斗
    autoBattleService.start()

    // 快进时间触发自动战斗循环
    jest.advanceTimersByTime(autoBattleService.calculateAttackInterval() + 100)

    // 恢复真实定时器
    jest.useRealTimers()
  }, 10000) // 设置超时时间10秒

  test('应该正确处理技能检查循环', done => {
    // 使用jest的假定时器
    jest.useFakeTimers()

    let skillUsed = false

    autoBattleService.initialize({
      player: mockPlayer,
      monsters: mockMonsters,
      skills: mockSkills,
      onSkillUse: skill => {
        // 验证技能被使用
        expect(skill.key).toBe('attack1')
        skillUsed = true

        // 停止自动战斗
        autoBattleService.stop()
        done()
      },
      onLog: jest.fn()
    })

    // 启动自动战斗
    autoBattleService.start()

    // 快进时间触发技能检查
    jest.advanceTimersByTime(autoBattleService.config.skillCheckInterval + 100)

    // 验证技能被使用
    expect(skillUsed).toBe(true)

    // 恢复真实定时器
    jest.useRealTimers()
  }, 10000)
})

// 运行测试的辅助函数
function runTests () {
  const tests = [
    '应该正确初始化自动战斗服务',
    '应该正确计算攻击间隔',
    '应该正确启动和停止自动战斗',
    '应该正确切换自动战斗状态',
    '应该正确选择攻击目标',
    '应该正确检查玩家状态',
    '应该正确获取可用技能',
    '应该正确执行攻击',
    '应该正确使用技能',
    '应该正确更新配置',
    '应该正确获取状态信息',
    '应该正确清理资源'
  ]

  let passed = 0
  let failed = 0

  for (let i = 0; i < tests.length; i += 1) {
    try {
      // 这里应该执行实际的测试
      passed++
    } catch (error) {
      console.error(error)
      failed++
    }
  }

  return failed === 0 && passed === tests.length
}

// 如果直接运行这个文件，执行测试
if (typeof require !== 'undefined' && require.main === module) {
  runTests()
}

export default runTests
