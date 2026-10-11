import { ref } from 'vue'
import { StaticGameInitializer } from '@/services/StaticGameInitializer'
import { ensureGameStores, useItemsStore, useMonstersStore, useGameStore } from '@/store'
import { useSkillsStore } from '@/store/skills'
import { setBuffDuration, clearAllBuffDurations } from '@/composables/useGameLoopManager'

/**
 * 游戏初始化组合式API
 * 将游戏初始化相关的逻辑从Main.vue中抽离出来
 */
export function useGameInitializer (player, addBattleLog) {
  // 游戏初始化器
  const gameInitializer = ref(null)

  // 游戏数据 (现在使用 Pinia stores，不再需要本地 gameData ref)
  // 保留 gameData 变量以避免破坏现有代码，但它不再被使用

  // 加载状态
  const isLoading = ref(true)
  const errorMessage = ref('')
  const isInitialized = ref(false)
  const loadingProgress = ref(0)
  const currentLoadItem = ref('')

  const loadItemLabels = {
    items: '物品',
    monsters: '怪物',
    equipmentSets: '套装',
    skills: '技能',
    quests: '任务',
    classConfig: '职业配置',
    skillConfig: '技能配置',
    maps: '地图',
    npcs: 'NPC',
    diamondShopItems: '钻石商店'
  }

  let removeLoadItemListener = null
  let removeLoadProgressListener = null

  const resolveLoadItemLabel = key => {
    if (!key) {
      return ''
    }
    return loadItemLabels[key] || key
  }

  // 初始化游戏
  const initGame = async () => {
    try {
      isLoading.value = true
      errorMessage.value = ''

      const totalStartTime = performance.now()
      console.log('[useGameInitializer] initGame 开始...')

      // ★ 确保所有重型子 Store 和数据文件已加载（懒加载代理）
      console.log('[useGameInitializer] 调用 ensureGameStores...')
      const storeStartTime = performance.now()
      await ensureGameStores()
      console.log(`[useGameInitializer] ensureGameStores 完成，耗时: ${(performance.now() - storeStartTime).toFixed(1)}ms`)

      // 创建游戏初始化器实例
      gameInitializer.value = new StaticGameInitializer()

      if (removeLoadItemListener) {
        removeLoadItemListener()
        removeLoadItemListener = null
      }
      if (removeLoadProgressListener) {
        removeLoadProgressListener()
        removeLoadProgressListener = null
      }

      loadingProgress.value = 0
      currentLoadItem.value = '准备加载...'

      removeLoadItemListener = gameInitializer.value.on('load-item', payload => {
        currentLoadItem.value = resolveLoadItemLabel(payload?.key)
      })

      removeLoadProgressListener = gameInitializer.value.on('load-progress', payload => {
        const progress = Number(payload?.progress)
        if (Number.isFinite(progress)) {
          loadingProgress.value = Math.min(100, Math.max(0, progress))
        }
        if (payload?.key) {
          currentLoadItem.value = resolveLoadItemLabel(payload.key)
        }
      })

      // 初始化游戏（关键数据加载）
      console.log('[useGameInitializer] 调用 StaticGameInitializer.initGame...')
      const staticInitStartTime = performance.now()
      await gameInitializer.value.initGame()
      console.log(`[useGameInitializer] StaticGameInitializer.initGame 完成，耗时: ${(performance.now() - staticInitStartTime).toFixed(1)}ms`)

      // 关键数据加载完成，立即隐藏"游戏初始化中..."提示
      isLoading.value = false
      loadingProgress.value = 100
      currentLoadItem.value = '加载完成'

      // 游戏数据现在由 Pinia stores 管理
      // 不再需要从 gameInitializer 获取 gameData

      // 初始化玩家数据
      console.log('[useGameInitializer] 初始化玩家数据...')
      const playerInitStartTime = performance.now()
      await initPlayerData()
      console.log(`[useGameInitializer] 玩家数据初始化完成，耗时: ${(performance.now() - playerInitStartTime).toFixed(1)}ms`)

      // ★ 初始 Player 使用了 _skipFinalStats 跳过属性计算，现在子 Store 已加载，补算一次
      if (player.value && typeof player.value.applyFinalStats === 'function') {
        const itemsStore = useItemsStore()
        player.value.applyFinalStats(itemsStore.equipmentSets || [])
      }

      // 初始化技能显示
      initSkills()

      // 初始化BUFF显示
      initBuffs()

      // 不初始化怪物 - 怪物只在进入战斗状态时才生成
      // initMonsters()

      // 不立即加载游戏设置和启动游戏循环
      // 这些函数将在后续被调用

      isInitialized.value = true

      console.log(`[useGameInitializer] initGame 全部完成，总耗时: ${(performance.now() - totalStartTime).toFixed(1)}ms`)
      addBattleLog('游戏初始化完成，欢迎来到飞飞世界！', 'common')
    } catch (error) {
      console.error('[useGameInitializer] 游戏初始化错误:', error)
      errorMessage.value = `游戏初始化失败: ${error.message}`
      isLoading.value = false
    }
  }

  /**
   * 验证玩家数据完整性
   * StaticGameInitializer.initPlayerData() 已完成从后端加载数据 → new Player() →
   * initPlayerSkills() → fixPlayerItems() → initPlayerBuffs() 等全部初始化流程，
   * 此处仅需验证数据是否就绪，不再用 Object.assign 覆盖（覆盖会破坏 initPlayerSkills
   * 创建的完整技能对象，用后端原始数据的空/精简 skills 覆盖掉完整版，导致自动战斗时
   * increaseSkillProficiency 找不到 player.skills.Q 等技能）
   */
  const initPlayerData = async () => {
    try {
      const storageService = gameInitializer.value.services.storage
      const playerData = storageService.getCurrentSaveData()

      if (playerData) {
        // 仅验证数据就绪，不做 Object.assign 覆盖
        // StaticGameInitializer 已正确初始化 player.value 的所有字段
        console.log('[useGameInitializer] 玩家数据验证通过，技能数:', Object.keys(player.value?.skills || {}).length)
      } else {
        console.warn('[useGameInitializer] 未读取到存档数据')
        // 检查是否有选中的存档槽
        const currentSaveSlot = storageService.getCurrentSaveSlot()

        if (currentSaveSlot !== null) {
          // 有存档槽但读不到数据，这是异常情况！
          // 此时绝对不能创建新号，否则一旦触发保存，原存档就会被覆盖
          const errorMsg = `无法读取存档数据 (槽位: ${currentSaveSlot})`
          console.error('[useGameInitializer] 致命错误:', errorMsg)
          throw new Error(errorMsg)
        }

        // 只有在确实没有存档槽的情况下（比如开发测试直接进入），才创建临时新号
        console.warn('[useGameInitializer] 未选择存档槽，创建临时角色')
        createNewPlayer()
      }
    } catch (error) {
      console.error('[useGameInitializer] 加载玩家数据失败:', error)
      // 抛出错误，中断初始化流程，防止进入游戏
      throw error
    }
  }

  // 创建新玩家
  const createNewPlayer = () => {
    player.value = {
      id: Date.now(),
      nickname: '新玩家',
      level: 1,
      exp: 0,
      maxExp: 100,
      class: 'beginner',
      sex: 'male',
      currentHealth: 100,
      maxHealth: 100,
      currentMana: 50,
      maxMana: 50,
      attack: 10,
      defense: 5,
      magicAttack: 5,
      magicDefense: 3,
      strength: 10,
      constitution: 10,
      intelligence: 10,
      agility: 10,
      statPoints: 0,
      gold: 100,
      diamonds: 0,
      bag: [],
      equipment: {},
      activeBuffs: [],
      quest: {
        activeQuests: [],
        completedQuests: []
      }
    }
    console.log('创建新玩家:', player.value)
  }

  // 初始化技能显示
  const initSkills = () => {
    try {
      // 从 StaticGameInitializer 获取游戏数据
      if (!gameInitializer.value) {
        return
      }
      
      const gameData = gameInitializer.value.state.gameData
      if (!gameData) {
        return
      }
      
      const skillsStore = useSkillsStore()

      if (Array.isArray(skillsStore.skills) && skillsStore.skills.length > 0) {
        return
      }

      if (typeof skillsStore.initSkills === 'function') {
        skillsStore.initSkills(player.value, gameData)
      }

      const nextSkills = skillsStore.skills
      if (!Array.isArray(nextSkills) || nextSkills.length === 0) {
        console.warn('[useGameInitializer] 技能初始化后仍为空')
      }
    } catch (error) {
      console.error('[useGameInitializer] 初始化技能显示失败:', error)
    }
  }

  // 初始化怪物
  const initMonsters = () => {
    // 这里可以调用怪物初始化逻辑
  }

  // 初始化BUFF显示
  const initBuffs = () => {
    // 清理上一角色残留的 buffDurations 缓存，防止旧数据干扰
    clearAllBuffDurations()

    if (!player.value.activeBuffs) {
      player.value.activeBuffs = []
      return
    }

    // 转换BUFF数据为显示格式，规范化 expiresAt 字段
    player.value.activeBuffs = player.value.activeBuffs.map(buff => {
      const safeBuff = buff && typeof buff === 'object' ? buff : {}
      const addedAt = safeBuff.addedAt || safeBuff.startTime || Date.now()

      // 规范化 expiresAt：优先使用已有值，其次回退到 endTime，最后根据 addedAt + duration 计算
      const rawDuration = Number(safeBuff.duration || 0)
      const expiresAt = Number(safeBuff.expiresAt ?? 0) ||
        Number(safeBuff.endTime ?? 0) ||
        (rawDuration > 0 ? addedAt + rawDuration * 1000 : 0)

      return {
        ...safeBuff,
        id: safeBuff.id || Date.now() + Math.random(),
        name: safeBuff.name || '未知BUFF',
        description: safeBuff.description || '',
        icon: safeBuff.icon || '/pt/buff_icon/default_buff.png',
        duration: rawDuration,
        type: safeBuff.type || 'buff',
        value: safeBuff.value || 0,
        expRate: safeBuff.expRate || 0,
        parameter: safeBuff.parameter || '',
        addedAt,
        expiresAt
      }
    })

    const deduped = []
    const seen = new Map()

    player.value.activeBuffs.forEach(buff => {
      const name = typeof buff?.name === 'string' ? buff.name : ''
      const icon = typeof buff?.icon === 'string' ? buff.icon : ''
      const isSkillBuff = icon.includes('/pt/skill_icon/')
      const signature = isSkillBuff ? `skill|${name}|${icon}` : null

      if (!signature) {
        deduped.push(buff)
        return
      }

      const existingIndex = seen.get(signature)
      if (existingIndex === undefined) {
        seen.set(signature, deduped.length)
        deduped.push(buff)
        return
      }

      const existing = deduped[existingIndex]
      const existingTime = Number(existing?.addedAt ?? existing?.startTime ?? 0)
      const currentTime = Number(buff?.addedAt ?? buff?.startTime ?? 0)
      if (currentTime >= existingTime) {
        deduped[existingIndex] = buff
      }
    })

    player.value.activeBuffs = deduped

    // 根据 expiresAt 计算剩余时间并设置到 buffDurations Map
    const now = Date.now()
    for (let i = 0; i < deduped.length; i++) {
      const buff = deduped[i]
      if (!buff || typeof buff !== 'object') {
        continue
      }

      const buffId = String(buff.id)
      const expiresAt = Number(buff.expiresAt ?? 0)

      if (expiresAt > now) {
        // 计算剩余秒数并向上取整
        const remainingSeconds = Math.ceil((expiresAt - now) / 1000)
        setBuffDuration(buffId, remainingSeconds)
        // 同时更新 buff.duration 以便显示
        buff.duration = remainingSeconds
      } else if (expiresAt > 0 && expiresAt <= now) {
        // 已过期的 BUFF，标记为需要移除
        deduped[i] = null
      }
    }

    // 移除已过期的 BUFF
    const cleanedBuffs = deduped.filter(buff => buff !== null)
    player.value.activeBuffs = cleanedBuffs

    // 递增 buffVersion，通知 BuffDisplay 等组件刷新
    // activeBuffs 使用 markRaw 包装，仅替换引用不足以触发响应式更新
    const gameStore = useGameStore()
    if (gameStore) {
      gameStore.buffVersion++
    }
  }

  // 清理游戏资源
  const cleanupGame = () => {
    console.log('清理游戏资源')

    if (gameInitializer.value) {
      gameInitializer.value.destroy()
      gameInitializer.value = null
    }
    if (removeLoadItemListener) {
      removeLoadItemListener()
      removeLoadItemListener = null
    }
    if (removeLoadProgressListener) {
      removeLoadProgressListener()
      removeLoadProgressListener = null
    }
    loadingProgress.value = 0
    currentLoadItem.value = ''

    // 清空 Pinia stores 中的数据
    const itemsStore = useItemsStore()
    const monstersStore = useMonstersStore()
    itemsStore.$reset()
    monstersStore.$reset()
    isInitialized.value = false
  }

  // 重新加载游戏
  const reloadGame = async () => {
    console.log('重新加载游戏')
    cleanupGame()
    await initGame()
  }

  // 获取游戏服务
  const getGameService = serviceName => {
    if (gameInitializer.value && gameInitializer.value.services) {
      return gameInitializer.value.services[serviceName]
    }
    return null
  }

  // 暴露给外部使用的属性和方法
  return {
    // 响应式数据
    gameInitializer,
    // gameData 已弃用，现在使用 Pinia stores
    isLoading,
    errorMessage,
    isInitialized,
    loadingProgress,
    currentLoadItem,

    // 方法
    initGame,
    initPlayerData,
    initSkills,
    initMonsters,
    initBuffs,
    cleanupGame,
    reloadGame,
    getGameService
  }
}
