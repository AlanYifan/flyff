/**
 * 音频服务 - 基于old/audio.js重构
 * 负责游戏音频的管理
 * @file AudioService.js
 * @generated 2026-02-02
 */

/**
 * HTMLAudioElement 缓存最大条目数
 * - 超过此数量时自动淘汰最久未使用的非 BGM 条目，防止长时间运行后 Map 无限增长
 */
const AUDIO_ELEMENTS_MAX_SIZE = 60

/**
 * WebAudio AudioBuffer（音频缓冲）解码缓存最大条目数
 * - 缓存可减少首播解码导致的卡顿，但条目越多内存占用越高
 */
const WEB_AUDIO_DEFAULT_CACHE_MAX = 128

/**
 * WebAudio 音频文件网络获取最大重试次数
 * - 应对 ERR_NETWORK_CHANGED 等瞬态网络错误，避免单次失败即放弃
 */
const WEB_AUDIO_FETCH_RETRY_MAX = 3

/**
 * WebAudio 音频文件网络获取重试基础延迟（毫秒）
 * - 实际延迟 = 基础延迟 × 当前重试次数（线性退避）
 */
const WEB_AUDIO_FETCH_RETRY_DELAY = 100

/**
 * WebAudio one-shot（一过性音效）全局并发上限（polyphony limit，并发/发声上限）
 * - 用于抑制高并发音效叠加导致的 clipping（削波失真，音爆）
 */
const WEB_AUDIO_DEFAULT_POLYPHONY_MAX = 10

/**
 * WebAudio one-shot（一过性音效）分类并发上限
 * - 与全局并发上限同时生效，任一触顶都会丢弃新音效
 */
const WEB_AUDIO_DEFAULT_POLYPHONY_PER_CATEGORY = Object.freeze({
  sfx: 2,
  monster: 2,
  skill: 1,
  item: 3
})

export class AudioService {
  constructor () {
    this.audioElements = new Map()
    /** @type {Map<string, number>} audioElements 各条目的最后访问时间戳，用于 LRU 淘汰 */
    this.audioElementLastUsed = new Map()
    /** @type {number} audioElements 最大条目数，超过时触发 LRU 淘汰 */
    this.audioElementsMaxSize = AUDIO_ELEMENTS_MAX_SIZE
    this.volumeSettings = {
      master: 1.0,
      bgm: 1.0,
      sfx: 1.0,
      monster: 1.0,
      skill: 1.0,
      item: 1.0
    }
    this.currentBGM = null
    this.userHasInteracted = false
    this.webAudioEnabled = true
    this.webAudio = {
      context: null,
      masterGain: null,
      categoryGains: {
        sfx: null,
        monster: null,
        skill: null,
        item: null
      },
      bufferCache: new Map(),
      bufferLoading: new Map(),
      activeSources: new Set(),
      sourceMeta: new WeakMap(),
      pendingPlays: {
        global: 0,
        perCategory: {
          sfx: 0,
          monster: 0,
          skill: 0,
          item: 0
        }
      },
      polyphony: {
        globalMax: WEB_AUDIO_DEFAULT_POLYPHONY_MAX,
        perCategoryMax: WEB_AUDIO_DEFAULT_POLYPHONY_PER_CATEGORY
      },
      playGeneration: 0,
      maxCacheSize: WEB_AUDIO_DEFAULT_CACHE_MAX,
      hasWarmupScheduled: false
    }
    this.monsterActionHtmlPolyphony = {
      max: 2,
      activeAudios: []
    }
    this.skillSfxSequence = {
      isPlaying: false,
      queue: [],
      current: null
    }

    // 监听用户首次交互
    this.setupUserInteractionListener()
  }

  /**
   * 判断 HTMLAudioElement 是否处于“正在播放”状态
   * @param {HTMLAudioElement} audio
   * @returns {boolean}
   */
  isHtmlAudioPlaying (audio) {
    if (!audio) {
      return false
    }
    return Boolean(!audio.paused && !audio.ended)
  }

  /**
   * 从怪物动作音效活跃列表移除指定 audio
   * @param {HTMLAudioElement} audio
   * @returns {void}
   */
  removeMonsterActionHtmlAudio (audio) {
    const state = this.monsterActionHtmlPolyphony
    if (!state || !Array.isArray(state.activeAudios)) {
      return
    }
    state.activeAudios = state.activeAudios.filter(item => item && item !== audio)
  }

  /**
   * 绑定怪物动作音效（攻击/受伤/死亡）结束时的清理逻辑（HTMLAudioElement 回退路径）
   * @param {HTMLAudioElement} audio
   * @returns {void}
   */
  bindMonsterActionHtmlAudioCleanup (audio) {
    if (!audio) {
      return
    }
    if (audio.__monsterActionEndedHandler) {
      return
    }
    const handler = () => {
      this.removeMonsterActionHtmlAudio(audio)
    }
    audio.__monsterActionEndedHandler = handler
    audio.addEventListener('ended', handler)
  }

  /**
   * 尝试占用一个怪物动作音效并发槽位（最多 2 个，HTMLAudioElement 回退路径）
   * - 若槽位已满且该 audio 不在活跃列表，则拒绝播放（直接丢弃新音效）
   * @param {HTMLAudioElement} audio
   * @returns {boolean}
   */
  acquireMonsterActionHtmlSlot (audio) {
    const state = this.monsterActionHtmlPolyphony
    if (!state || !Array.isArray(state.activeAudios)) {
      return true
    }

    const nextActive = state.activeAudios.filter(item => this.isHtmlAudioPlaying(item))
    state.activeAudios = nextActive

    if (nextActive.includes(audio)) {
      return true
    }

    const resolvedMax = Number(state.max)
    const max = Number.isFinite(resolvedMax) ? Math.max(1, resolvedMax) : 2
    if (nextActive.length >= max) {
      return false
    }

    this.bindMonsterActionHtmlAudioCleanup(audio)
    nextActive.push(audio)
    state.activeAudios = nextActive
    return true
  }

  /**
   * 设置用户交互监听器
   */
  setupUserInteractionListener () {
    const userInteractions = ['click', 'keydown', 'mousedown', 'touchstart']

    const handleUserInteraction = () => {
      this.userHasInteracted = true
      try {
        this.ensureWebAudioReady()
      } catch (error) {
        console.error('[AudioService] 初始化 WebAudio 失败:', error)
      }

      // 移除所有监听器
      userInteractions.forEach(event => {
        const listenerOptions = event === 'touchstart' ? { once: true, passive: true } : { once: true }
        document.removeEventListener(event, handleUserInteraction, listenerOptions)
      })
      // 触发用户交互回调（如果有）
      if (this.onUserInteraction) {
        this.onUserInteraction()
      }
    }

    // 添加一次性监听器
    userInteractions.forEach(event => {
      const listenerOptions = event === 'touchstart' ? { once: true, passive: true } : { once: true }
      document.addEventListener(event, handleUserInteraction, listenerOptions)
    })
  }

  /**
   * 设置用户交互回调
   * @param {Function} callback - 用户交互后的回调函数
   */
  setOnUserInteraction (callback) {
    this.onUserInteraction = callback
  }

  /**
   * 初始化音量控制
   */
  initializeVolumeControl () {
    // 加载保存的音量设置
    this.loadVolumeSettings()

    // 在实际实现中，这里会初始化音量控制UI
  }

  /**
   * 加载音量设置
   */
  loadVolumeSettings () {
    try {
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        const userSettings = JSON.parse(savedSettings)
        const masterCandidate = Number(userSettings.volume ?? userSettings.master ?? 1.0)
        const bgmCandidate = Number(userSettings.bgm ?? 1.0)
        const sfxCandidate = Number(userSettings.sfx ?? 1.0)
        const monsterCandidate = Number(userSettings.monster ?? 1.0)
        const skillCandidate = Number(userSettings.skill ?? 1.0)
        const itemCandidate = Number(userSettings.item ?? 1.0)

        this.volumeSettings = {
          master: Number.isFinite(masterCandidate) ? Math.max(0, Math.min(1, masterCandidate)) : 1.0,
          bgm: Number.isFinite(bgmCandidate) ? Math.max(0, Math.min(1, bgmCandidate)) : 1.0,
          sfx: Number.isFinite(sfxCandidate) ? Math.max(0, Math.min(1, sfxCandidate)) : 1.0,
          monster: Number.isFinite(monsterCandidate) ? Math.max(0, Math.min(1, monsterCandidate)) : 1.0,
          skill: Number.isFinite(skillCandidate) ? Math.max(0, Math.min(1, skillCandidate)) : 1.0,
          item: Number.isFinite(itemCandidate) ? Math.max(0, Math.min(1, itemCandidate)) : 1.0
        }

        this.updateAllVolumes()
      }
    } catch (error) {
      console.error('加载音量设置失败:', error)
    }
  }

  /**
   * 保存音量设置
   */
  saveVolumeSettings () {
    try {
      const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}')
      userSettings.volume = this.volumeSettings.master
      userSettings.bgm = this.volumeSettings.bgm
      userSettings.sfx = this.volumeSettings.sfx
      userSettings.monster = this.volumeSettings.monster
      userSettings.skill = this.volumeSettings.skill
      userSettings.item = this.volumeSettings.item
      localStorage.setItem('userSettings', JSON.stringify(userSettings))
    } catch (error) {
      console.error('保存音量设置失败:', error)
    }
  }

  /**
   * 检查是否可用 Web Audio API（Web音频接口）
   * @returns {boolean}
   */
  isWebAudioSupported () {
    if (this.webAudioEnabled !== true) {
      return false
    }
    if (typeof window === 'undefined') {
      return false
    }
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    return typeof AudioContextCtor === 'function'
  }

  /**
   * 确保 Web Audio 上下文（AudioContext，上下文）已初始化并具备基础节点
   * @returns {boolean}
   */
  ensureWebAudioReady () {
    if (!this.isWebAudioSupported()) {
      return false
    }
    if (!this.userHasInteracted) {
      return false
    }
    if (this.webAudio?.context) {
      this.updateWebAudioVolumes()
      return true
    }

    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext
      const context = new AudioContextCtor()
      const masterGain = context.createGain()

      const sfxGain = context.createGain()
      const monsterGain = context.createGain()
      const skillGain = context.createGain()
      const itemGain = context.createGain()

      sfxGain.connect(masterGain)
      monsterGain.connect(masterGain)
      skillGain.connect(masterGain)
      itemGain.connect(masterGain)
      masterGain.connect(context.destination)

      this.webAudio.context = context
      this.webAudio.masterGain = masterGain
      this.webAudio.categoryGains = {
        sfx: sfxGain,
        monster: monsterGain,
        skill: skillGain,
        item: itemGain
      }

      if (typeof context.resume === 'function') {
        context.resume().catch(error => {
          console.warn('[AudioService] WebAudio resume 失败:', error)
        })
      }

      this.updateWebAudioVolumes()
      this.scheduleWebAudioWarmup()
      return true
    } catch (error) {
      console.error('[AudioService] 创建 WebAudio 失败:', error)
      return false
    }
  }

  /**
   * 同步 WebAudio 各通道音量（GainNode，增益节点）
   * @returns {boolean}
   */
  updateWebAudioVolumes () {
    const context = this.webAudio?.context
    const masterGain = this.webAudio?.masterGain
    if (!context || !masterGain) {
      return false
    }

    const master = Number(this.volumeSettings?.master ?? 1)
    masterGain.gain.value = Number.isFinite(master) ? Math.max(0, Math.min(1, master)) : 1

    const categoryGains = this.webAudio?.categoryGains || {}
    const sfx = Number(this.volumeSettings?.sfx ?? 1)
    const monster = Number(this.volumeSettings?.monster ?? 1)
    const skill = Number(this.volumeSettings?.skill ?? 1)
    const item = Number(this.volumeSettings?.item ?? 1)

    if (categoryGains.sfx) {
      categoryGains.sfx.gain.value = Number.isFinite(sfx) ? Math.max(0, Math.min(1, sfx)) : 1
    }
    if (categoryGains.monster) {
      categoryGains.monster.gain.value = Number.isFinite(monster) ? Math.max(0, Math.min(1, monster)) : 1
    }
    if (categoryGains.skill) {
      categoryGains.skill.gain.value = Number.isFinite(skill) ? Math.max(0, Math.min(1, skill)) : 1
    }
    if (categoryGains.item) {
      categoryGains.item.gain.value = Number.isFinite(item) ? Math.max(0, Math.min(1, item)) : 1
    }

    return true
  }

  /**
   * 将 AudioBuffer 缓存刷新为最近使用（LRU，最近最少使用）
   * @param {string} url
   * @param {AudioBuffer} buffer
   * @returns {void}
   */
  touchWebAudioBufferCache (url, buffer) {
    if (!url) {
      return
    }
    const cache = this.webAudio?.bufferCache
    if (!cache) {
      return
    }
    if (cache.has(url)) {
      cache.delete(url)
    }
    cache.set(url, buffer)
    const maxSize = Number(this.webAudio?.maxCacheSize ?? WEB_AUDIO_DEFAULT_CACHE_MAX)
    if (cache.size <= maxSize) {
      return
    }
    const firstKey = cache.keys().next().value
    if (firstKey) {
      cache.delete(firstKey)
    }
  }

  /**
   * 获取并缓存 AudioBuffer（解码缓存）
   * @param {string} url
   * @returns {Promise<AudioBuffer|null>}
   */
  async getWebAudioBuffer (url) {
    if (!url) {
      return null
    }
    if (!this.ensureWebAudioReady()) {
      return null
    }

    const cache = this.webAudio.bufferCache
    if (cache.has(url)) {
      const buffer = cache.get(url)
      if (buffer) {
        this.touchWebAudioBufferCache(url, buffer)
        return buffer
      }
    }

    const loading = this.webAudio.bufferLoading
    if (loading.has(url)) {
      return await loading.get(url)
    }

    const context = this.webAudio.context
    const task = (async () => {
      try {
        // 网络获取（含重试，应对 ERR_NETWORK_CHANGED 等瞬态网络错误）
        let arrayBuffer = null
        let networkError = null
        for (let attempt = 0; attempt < WEB_AUDIO_FETCH_RETRY_MAX; attempt++) {
          try {
            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP ${response.status} ${response.statusText}`)
            }
            arrayBuffer = await response.arrayBuffer()
            networkError = null
            break
          } catch (error) {
            networkError = error
            // 非最后一次尝试且为瞬态网络错误（TypeError: Failed to fetch）时，短暂等待后重试
            const isTransient = error instanceof TypeError
            if (attempt < WEB_AUDIO_FETCH_RETRY_MAX - 1 && isTransient) {
              await new Promise(r => setTimeout(r, WEB_AUDIO_FETCH_RETRY_DELAY * (attempt + 1)))
            } else {
              break
            }
          }
        }
        if (networkError) {
          // 瞬态网络错误降级为 warn，避免控制台噪音；HTML Audio 回退路径会继续尝试
          console.warn('[AudioService] WebAudio 音频加载失败（网络错误）:', { url, error: networkError?.message || networkError })
          return null
        }

        const buffer = await new Promise((resolve, reject) => {
          try {
            const decodePromise = context.decodeAudioData(arrayBuffer, decoded => resolve(decoded), err => reject(err))
            if (decodePromise && typeof decodePromise.then === 'function') {
              decodePromise.then(resolve).catch(reject)
            }
          } catch (error) {
            reject(error)
          }
        })
        if (buffer) {
          this.touchWebAudioBufferCache(url, buffer)
          return buffer
        }
        return null
      } catch (error) {
        console.error('[AudioService] WebAudio buffer 解码失败:', { url, error })
        return null
      } finally {
        this.webAudio.bufferLoading.delete(url)
      }
    })()

    loading.set(url, task)
    return await task
  }

  /**
   * 获取 WebAudio 当前活跃并发数（按分类）
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @returns {number}
   */
  getWebAudioActiveCountByCategory (category) {
    const sources = this.webAudio?.activeSources
    const sourceMeta = this.webAudio?.sourceMeta
    if (!sources || sources.size === 0 || !sourceMeta) {
      return 0
    }
    let count = 0
    sources.forEach(source => {
      const meta = sourceMeta.get(source)
      if (meta?.category === category) {
        count += 1
      }
    })
    return count
  }

  /**
   * 获取 WebAudio 当前等待播放的并发数（按分类）
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @returns {number}
   */
  getWebAudioPendingCountByCategory (category) {
    const pendingCategory = this.webAudio?.pendingPlays?.perCategory?.[category]
    const resolved = Number(pendingCategory)
    return Number.isFinite(resolved) ? Math.max(0, resolved) : 0
  }

  /**
   * 判断 WebAudio 是否允许继续调度 one-shot 音效（用于抑制音爆）
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @returns {boolean}
   */
  canScheduleWebAudioOneShot (category) {
    const polyphony = this.webAudio?.polyphony
    const globalMax = Number(polyphony?.globalMax)
    const perCategoryMax = Number(polyphony?.perCategoryMax?.[category])

    const activeGlobal = Number(this.webAudio?.activeSources?.size || 0)
    const pendingGlobal = Number(this.webAudio?.pendingPlays?.global || 0)
    const resolvedGlobalMax = Number.isFinite(globalMax) ? globalMax : WEB_AUDIO_DEFAULT_POLYPHONY_MAX

    if (activeGlobal + pendingGlobal >= resolvedGlobalMax) {
      return false
    }

    const activeCategory = this.getWebAudioActiveCountByCategory(category)
    const pendingCategory = this.getWebAudioPendingCountByCategory(category)
    const resolvedCategoryMax = Number.isFinite(perCategoryMax)
      ? perCategoryMax
      : Number(WEB_AUDIO_DEFAULT_POLYPHONY_PER_CATEGORY?.[category] ?? 0)

    if (resolvedCategoryMax > 0 && activeCategory + pendingCategory >= resolvedCategoryMax) {
      return false
    }

    return true
  }

  /**
   * WebAudio one-shot 计数 +1（用于并发限制）
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @returns {void}
   */
  incrementWebAudioPendingPlay (category) {
    if (!this.webAudio?.pendingPlays) {
      return
    }
    const nextGlobal = Number(this.webAudio.pendingPlays.global || 0) + 1
    this.webAudio.pendingPlays.global = nextGlobal
    const nextCategory = Number(this.webAudio.pendingPlays.perCategory?.[category] || 0) + 1
    this.webAudio.pendingPlays.perCategory[category] = nextCategory
  }

  /**
   * WebAudio one-shot 计数 -1（用于并发限制）
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @returns {void}
   */
  decrementWebAudioPendingPlay (category) {
    if (!this.webAudio?.pendingPlays) {
      return
    }
    const nextGlobal = Number(this.webAudio.pendingPlays.global || 0) - 1
    this.webAudio.pendingPlays.global = Math.max(0, nextGlobal)
    const nextCategory = Number(this.webAudio.pendingPlays.perCategory?.[category] || 0) - 1
    this.webAudio.pendingPlays.perCategory[category] = Math.max(0, nextCategory)
  }

  /**
   * 使用 WebAudio 播放一次性音效（one-shot，一次性播放）
   * @param {string} url
   * @param {'sfx'|'monster'|'skill'|'item'} category
   * @param {number} volumeFactor
   * @returns {boolean} 是否已接管播放（已安排异步播放也算 true）
   */
  playWebAudioOneShot (url, category = 'sfx', volumeFactor = 1) {
    if (!this.ensureWebAudioReady()) {
      return false
    }

    const resolvedCategory = ['sfx', 'monster', 'skill', 'item'].includes(category) ? category : 'sfx'
    const context = this.webAudio.context
    const categoryGain = this.webAudio?.categoryGains?.[resolvedCategory]
    const masterGain = this.webAudio.masterGain
    if (!context || !categoryGain || !masterGain) {
      return false
    }
    if (!this.canScheduleWebAudioOneShot(resolvedCategory)) {
      return true
    }

    const expectedGeneration = Number(this.webAudio?.playGeneration || 0)
    this.incrementWebAudioPendingPlay(resolvedCategory)

    Promise.resolve()
      .then(async () => {
        try {
          const buffer = await this.getWebAudioBuffer(url)
          if (!buffer) {
            return
          }
          if (Number(this.webAudio?.playGeneration || 0) !== expectedGeneration) {
            return
          }

          const source = context.createBufferSource()
          source.buffer = buffer

          const gain = context.createGain()
          const normalized = Number(volumeFactor)
          gain.gain.value = Number.isFinite(normalized) ? Math.max(0, Math.min(1, normalized)) : 1

          source.connect(gain)
          gain.connect(categoryGain)

          this.webAudio.sourceMeta.set(source, { category: resolvedCategory, url })
          this.webAudio.activeSources.add(source)
          source.onended = () => {
            this.webAudio.activeSources.delete(source)
            this.webAudio.sourceMeta.delete(source)
          }

          source.start(0)
        } catch (error) {
          console.error('[AudioService] WebAudio 播放失败:', { url, category: resolvedCategory, error })
        } finally {
          this.decrementWebAudioPendingPlay(resolvedCategory)
        }
      })

    return true
  }

  /**
   * 计划执行 WebAudio 常用音效预解码（idle，空闲时段执行）
   * @returns {void}
   */
  scheduleWebAudioWarmup () {
    if (!this.isWebAudioSupported() || !this.userHasInteracted) {
      return
    }
    if (!this.webAudio?.context) {
      return
    }
    if (this.webAudio.hasWarmupScheduled) {
      return
    }
    this.webAudio.hasWarmupScheduled = true

    const warmup = () => {
      try {
        this.warmupWebAudioCommonSfx()
      } catch (error) {
        console.error('[AudioService] WebAudio warmup 失败:', error)
      }
    }

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(warmup, { timeout: 2000 })
      return
    }
    setTimeout(warmup, 200)
  }

  /**
   * 预解码常用高频音效，降低首播解码抖动
   * @returns {void}
   */
  warmupWebAudioCommonSfx () {
    const urls = [
      '/sound/PcPatDDmg.wav',
      '/sound/PcSkillM-SpecialHit.wav',
      '/sound/Item1WpnAtk.wav',
      '/sound/ItemChrCure.wav'
    ]

    urls.reduce((chain, url) => {
      return chain.then(async () => {
        try {
          await this.getWebAudioBuffer(url)
        } catch (error) {
          console.warn('[AudioService] WebAudio warmup 单项失败:', { url, error })
        }
      })
    }, Promise.resolve())
  }

  /**
   * 停止当前所有 WebAudio 播放中的 source
   * @returns {void}
   */
  stopAllWebAudioSources () {
    const sources = this.webAudio?.activeSources
    if (this.webAudio) {
      const nextGeneration = Number(this.webAudio.playGeneration || 0) + 1
      this.webAudio.playGeneration = nextGeneration
      if (this.webAudio.pendingPlays) {
        this.webAudio.pendingPlays.global = 0
        this.webAudio.pendingPlays.perCategory = { sfx: 0, monster: 0, skill: 0, item: 0 }
      }
      this.webAudio.sourceMeta = new WeakMap()
    }
    if (!sources || sources.size === 0) {
      return
    }
    Array.from(sources).forEach(source => {
      try {
        source.stop(0)
      } catch (error) {
        console.warn('[AudioService] WebAudio source stop 失败:', error)
      }
    })
    sources.clear()
  }

  /**
   * 暂停 WebAudio（通过 suspend，暂停上下文）
   * @returns {void}
   */
  pauseWebAudio () {
    const context = this.webAudio?.context
    if (!context || typeof context.suspend !== 'function') {
      return
    }
    context.suspend().catch(error => {
      console.warn('[AudioService] WebAudio suspend 失败:', error)
    })
  }

  /**
   * 恢复 WebAudio（通过 resume，恢复上下文）
   * @returns {void}
   */
  resumeWebAudio () {
    if (!this.userHasInteracted) {
      return
    }
    const context = this.webAudio?.context
    if (!context || typeof context.resume !== 'function') {
      return
    }
    context.resume().catch(error => {
      console.warn('[AudioService] WebAudio resume 失败:', error)
    })
  }

  /**
   * 清理 WebAudio 资源
   * @returns {void}
   */
  cleanupWebAudio () {
    this.stopAllWebAudioSources()
    this.webAudio?.bufferCache?.clear?.()
    this.webAudio?.bufferLoading?.clear?.()
    const context = this.webAudio?.context
    this.webAudio.context = null
    this.webAudio.masterGain = null
    this.webAudio.categoryGains = { sfx: null, monster: null, skill: null, item: null }
    if (context && typeof context.close === 'function') {
      context.close().catch(error => {
        console.warn('[AudioService] WebAudio close 失败:', error)
      })
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.master = Math.max(0, Math.min(1, candidate))
    this.updateAllVolumes()
    this.saveVolumeSettings()
  }

  /**
   * 设置BGM音量
   */
  setBGMVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.bgm = Math.max(0, Math.min(1, candidate))
    this.updateBGMVolume()
    this.saveVolumeSettings()
  }

  /**
   * 设置音效音量
   */
  setSFXVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.sfx = Math.max(0, Math.min(1, candidate))
    this.updateSFXVolume()
    this.saveVolumeSettings()
  }

  /**
   * 设置怪物音效音量
   */
  setMonsterVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.monster = Math.max(0, Math.min(1, candidate))
    this.updateMonsterVolume()
    this.saveVolumeSettings()
  }

  setSkillVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.skill = Math.max(0, Math.min(1, candidate))
    this.updateSkillVolume()
    this.saveVolumeSettings()
  }

  setItemVolume (volume) {
    const candidate = Number(volume)
    if (!Number.isFinite(candidate)) {
      return
    }
    this.volumeSettings.item = Math.max(0, Math.min(1, candidate))
    this.updateItemVolume()
    this.saveVolumeSettings()
  }

  /**
   * 更新所有音频音量
   */
  updateAllVolumes () {
    this.updateBGMVolume()
    this.updateSFXVolume()
    this.updateMonsterVolume()
    this.updateSkillVolume()
    this.updateItemVolume()
    this.updateWebAudioVolumes()
  }

  /**
   * 更新BGM音量
   */
  updateBGMVolume () {
    const volume = this.volumeSettings.master * this.volumeSettings.bgm
    this.audioElements.forEach((audio, id) => {
      if (id.startsWith('bgm_')) {
        audio.volume = volume * (audio.__volumeFactor || 1)
      }
    })

    if (this.currentBGM) {
      this.currentBGM.volume = volume * (this.currentBGM.__volumeFactor || 1)
    }
  }

  /**
   * 更新音效音量
   */
  updateSFXVolume () {
    const volume = this.volumeSettings.master * this.volumeSettings.sfx
    this.audioElements.forEach((audio, id) => {
      if (id.startsWith('sfx_')) {
        audio.volume = volume * (audio.__volumeFactor || 1)
      }
    })
    this.updateWebAudioVolumes()
  }

  /**
   * 更新怪物音效音量
   */
  updateMonsterVolume () {
    const volume = this.volumeSettings.master * this.volumeSettings.monster
    this.audioElements.forEach((audio, id) => {
      if (id.startsWith('monster_')) {
        audio.volume = volume * (audio.__volumeFactor || 1)
      }
    })
    this.updateWebAudioVolumes()
  }

  updateSkillVolume () {
    const volume = this.volumeSettings.master * this.volumeSettings.skill
    this.audioElements.forEach((audio, id) => {
      if (id.startsWith('skill_')) {
        audio.volume = volume * (audio.__volumeFactor || 1)
      }
    })
    this.updateWebAudioVolumes()
  }

  updateItemVolume () {
    const volume = this.volumeSettings.master * this.volumeSettings.item
    this.audioElements.forEach((audio, id) => {
      if (id.startsWith('item_')) {
        audio.volume = volume * (audio.__volumeFactor || 1)
      }
    })
    this.updateWebAudioVolumes()
  }

  /**
   * 播放背景音乐（优化版 - 检查用户交互）
   */
  playBGM (trackName, loop = true) {
    const audioId = `bgm_${trackName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/music/${trackName}`)
      audio.crossOrigin = 'anonymous'
      audio.loop = loop
      audio.__volumeFactor = 1
      audio.volume = this.volumeSettings.master * this.volumeSettings.bgm
      this.audioElements.set(audioId, audio)
    }

    // 如果当前有BGM正在播放，先暂停它
    if (this.currentBGM && this.currentBGM !== audio) {
      this.currentBGM.pause()
      this.currentBGM.currentTime = 0
    }

    // 重置新音频的时间
    audio.currentTime = 0

    // 检查用户是否已经交互过
    if (!this.userHasInteracted) {

      // 设置用户交互回调，在用户交互后播放
      this.setOnUserInteraction(() => {
        this.playBGM(trackName, loop)
      })

      this.currentBGM = audio
      return
    }

    // 检查是否允许自动播放
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // 如果播放失败，可能是由于浏览器的自动播放策略或快速切换导致的 AbortError
        if (error.name === 'NotAllowedError') {
          console.warn(`播放BGM ${trackName} 被浏览器阻止: 需要用户交互`)
// 可以在这里添加UI提示，告诉用户需要交互才能播放音频
} else if (error.name === 'AbortError') {
// 快速切换音乐导致的 AbortError，忽略这个错误
} else {
          console.error(`播放BGM ${trackName} 失败:`, error)
        }
      })
    }

    this.currentBGM = audio
  }

  /**
   * 停止背景音乐
   */
  stopBGM () {
    if (this.currentBGM) {
      this.currentBGM.pause()
      this.currentBGM.currentTime = 0
    }
    this.currentBGM = null
  }

  /**
   * 暂停背景音乐
   */
  pauseBGM () {
    if (this.currentBGM) {
      this.currentBGM.pause()
    }
  }

  /**
   * 恢复背景音乐
   */
  resumeBGM () {
    if (this.currentBGM) {
      // 检查是否允许自动播放
      const playPromise = this.currentBGM.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // 如果播放失败，可能是由于浏览器的自动播放策略
          if (error.name === 'NotAllowedError') {
            console.warn('恢复BGM被浏览器阻止: 需要用户交互')
          } else {
            console.error('恢复BGM失败:', error)
          }
        })
      }
    }
  }

  /**
   * 播放音效
   */
  playSFX (sfxName, volume = 1.0) {
    if (this.playWebAudioOneShot(`/sound/${sfxName}`, 'sfx', volume)) {
      return
    }
    const audioId = `sfx_${sfxName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/${sfxName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.sfx * volume
      this.audioElements.set(audioId, audio)
      // LRU 跟踪：记录创建时间，并在超限时淘汰
      this.audioElementLastUsed.set(audioId, Date.now())
      this.pruneAudioElements()
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.sfx * volume
      // 更新最后使用时间
      this.audioElementLastUsed.set(audioId, Date.now())
    }

    // 检查是否允许自动播放
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // 如果播放失败，可能是由于浏览器的自动播放策略或快速切换导致的 AbortError
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放音效 ${sfxName} 被浏览器阻止或不支持:`, error)

          // 尝试在用户下次交互时播放音效
          const tryPlayOnInteraction = () => {
            audio.pause()
            audio.currentTime = 0
            audio.play().catch(e => {
              console.error(`用户交互后仍无法播放音效 ${sfxName}:`, e)
            })

            // 移除事件监听器
            document.removeEventListener('click', tryPlayOnInteraction)
            document.removeEventListener('keydown', tryPlayOnInteraction)
          }

          // 添加用户交互事件监听器
          document.addEventListener('click', tryPlayOnInteraction, { once: true })
          document.addEventListener('keydown', tryPlayOnInteraction, { once: true })
        } else if (error.name === 'AbortError') {
          // 快速播放音效导致的 AbortError，忽略这个错误
          // console.debug(`播放音效 ${sfxName} 被中断: 快速播放音效`)
        } else {
          console.error(`播放音效 ${sfxName} 失败:`, error)
        }
      })
    }
  }

  playMusicSFX (trackName, volume = 1.0) {
    const audioId = `sfx_music_${trackName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/music/${trackName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.sfx * volume
      this.audioElements.set(audioId, audio)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.sfx * volume
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放音乐音效 ${trackName} 被浏览器阻止或不支持:`, error)

          const tryPlayOnInteraction = () => {
            audio.pause()
            audio.currentTime = 0
            audio.play().catch(e => {
              console.error(`用户交互后仍无法播放音乐音效 ${trackName}:`, e)
            })

            document.removeEventListener('click', tryPlayOnInteraction)
            document.removeEventListener('keydown', tryPlayOnInteraction)
          }

          document.addEventListener('click', tryPlayOnInteraction, { once: true })
          document.addEventListener('keydown', tryPlayOnInteraction, { once: true })
        } else if (error.name === 'AbortError') {
          // console.debug(`播放音乐音效 ${trackName} 被中断: 快速播放音效`)
        } else {
          console.error(`播放音乐音效 ${trackName} 失败:`, error)
        }
      })
    }

  }

  playSkillSFX (skillType = 'fire') {
    let resolvedSkillType = skillType
    let resolvedSkillAudioList = []

    if (skillType && typeof skillType === 'object') {
      const audioConfig = skillType.audio
      if (Array.isArray(audioConfig)) {
        resolvedSkillAudioList = audioConfig
          .filter(item => typeof item === 'string' && item.trim())
          .map(item => item.trim())
      } else if (typeof audioConfig === 'string' && audioConfig.trim()) {
        resolvedSkillAudioList = [audioConfig.trim()]
      }
      resolvedSkillType = skillType.type || 'fire'
    }

    const normalizeSfxName = value => {
      let normalized = typeof value === 'string' ? value.trim() : ''
      if (!normalized) {
        return null
      }
      if (normalized.startsWith('/')) {
        normalized = normalized.slice(1)
      }
      if (normalized.startsWith('sound/')) {
        normalized = normalized.slice('sound/'.length)
      }
      return normalized.trim() || null
    }

    const normalizedList = resolvedSkillAudioList.map(normalizeSfxName).filter(Boolean)
    let sfxList = normalizedList
    if (sfxList.length === 0) {
      const sfxMap = {
        fire: 'Item1WpnAtk.wav',
        water: 'Item1WpnAtk.wav',
        thunder: 'Item1WpnAtk.wav',
        wind: 'Item1WpnAtk.wav',
        earth: 'Item1WpnAtk.wav',
        heal: 'ItemChrCure.wav'
      }
      sfxList = [sfxMap[resolvedSkillType] || 'Item1WpnAtk.wav']
    }

    if (!this.skillSfxSequence || !Array.isArray(this.skillSfxSequence.queue)) {
      return
    }

    this.skillSfxSequence.queue.push(...sfxList)
    if (this.skillSfxSequence.isPlaying) {
      return
    }
    this.skillSfxSequence.isPlaying = true

    Promise.resolve()
      .then(async () => {
        while (this.skillSfxSequence.queue.length > 0) {
          const next = this.skillSfxSequence.queue.shift()
          if (!next) {
            continue
          }
          try {
            await this.playSkillSfxEntryAsync(next)
          } catch (error) {
            console.error(`播放技能音效 ${next} 失败:`, error)
          }
        }
      })
      .finally(() => {
        this.skillSfxSequence.isPlaying = false
      })
  }

  playSkillSfxEntryAsync (sfxName) {
    return new Promise(resolve => {
      const normalizedInput = typeof sfxName === 'string' ? sfxName.trim() : ''
      const done = () => {
        const current = this.skillSfxSequence?.current
        if (current && current?.sfx === normalizedInput) {
          this.skillSfxSequence.current = null
        }
        resolve()
      }

      if (!normalizedInput) {
        done()
        return
      }

      const normalizedName = normalizedInput
      const url = `/sound/${normalizedName}`

      const tryWebAudio = async () => {
        if (!this.ensureWebAudioReady()) {
          return false
        }
        if (!this.canScheduleWebAudioOneShot('skill')) {
          return false
        }

        const context = this.webAudio?.context
        const categoryGain = this.webAudio?.categoryGains?.skill
        if (!context || !categoryGain) {
          return false
        }

        const expectedGeneration = Number(this.webAudio?.playGeneration || 0)
        this.incrementWebAudioPendingPlay('skill')
        try {
          const buffer = await this.getWebAudioBuffer(url)
          if (!buffer) {
            return false
          }
          if (Number(this.webAudio?.playGeneration || 0) !== expectedGeneration) {
            done()
            return true
          }
          const source = context.createBufferSource()
          source.buffer = buffer

          const gain = context.createGain()
          gain.gain.value = Math.max(0, Math.min(1, Number(this.volumeSettings?.master ?? 1) * Number(this.volumeSettings?.skill ?? 1)))

          source.connect(gain)
          gain.connect(categoryGain)

          this.webAudio.sourceMeta.set(source, { category: 'skill', url })
          this.webAudio.activeSources.add(source)

          const current = { type: 'webaudio', sfx: normalizedName, source, cancel: null }
          current.cancel = () => {
            try {
              source.onended = null
              source.stop(0)
            } catch (error) {
              console.warn('[AudioService] WebAudio 技能音效取消失败:', error)
            } finally {
              done()
            }
          }
          this.skillSfxSequence.current = current

          source.onended = () => {
            this.webAudio.activeSources.delete(source)
            this.webAudio.sourceMeta.delete(source)
            done()
          }

          source.start(0)
          return true
        } catch (error) {
          console.error('[AudioService] WebAudio 技能音效播放失败:', { url, error })
          return false
        } finally {
          this.decrementWebAudioPendingPlay('skill')
        }
      }

      const tryHtmlAudio = () => {
        const audioId = `skill_${normalizedName}`
        let audio = this.audioElements.get(audioId)
        if (!audio) {
          audio = new Audio(url)
          audio.crossOrigin = 'anonymous'
          audio.__volumeFactor = 1
          audio.volume = this.volumeSettings.master * this.volumeSettings.skill
          this.audioElements.set(audioId, audio)
        } else {
          audio.pause()
          audio.currentTime = 0
          audio.__volumeFactor = 1
          audio.volume = this.volumeSettings.master * this.volumeSettings.skill
        }

        const cleanupHtmlListeners = () => {
          audio.removeEventListener('ended', endedHandler)
          audio.removeEventListener('error', errorHandler)
        }
        const endedHandler = () => {
          cleanupHtmlListeners()
          done()
        }
        // HTML Audio 网络加载失败时触发 error 事件，需调用 done() 防止队列卡死
        const errorHandler = () => {
          cleanupHtmlListeners()
          console.warn(`[AudioService] 技能音效 ${normalizedName} HTML Audio 加载失败（网络错误）`)
          done()
        }
        const current = { type: 'html', sfx: normalizedName, audio, cancel: null }
        current.cancel = () => {
          try {
            cleanupHtmlListeners()
            audio.pause()
            audio.currentTime = 0
          } catch (error) {
            console.warn('[AudioService] HTML 技能音效取消失败:', error)
          } finally {
            done()
          }
        }
        this.skillSfxSequence.current = current
        audio.addEventListener('ended', endedHandler)
        audio.addEventListener('error', errorHandler)

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            cleanupHtmlListeners()
            if (error?.name === 'NotAllowedError' || error?.name === 'NotSupportedError') {
              console.warn(`播放技能音效 ${normalizedName} 被浏览器阻止或不支持:`, error)
              done()
              return
            }
            if (error?.name === 'AbortError') {
              done()
              return
            }
            console.error(`播放技能音效 ${normalizedName} 失败:`, error)
            done()
          })
        }
      }

      Promise.resolve()
        .then(async () => {
          const playedByWebAudio = await tryWebAudio()
          if (playedByWebAudio) {
            return
          }
          tryHtmlAudio()
        })
        .catch(error => {
          console.error('[AudioService] 技能音效播放调度失败:', error)
          done()
        })
    })
  }

  playItemSFX (sfxName, volume = 1.0) {
    if (this.playWebAudioOneShot(`/sound/${sfxName}`, 'item', volume)) {
      return
    }
    const audioId = `item_${sfxName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/${sfxName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.item * volume
      this.audioElements.set(audioId, audio)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.item * volume
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放物品音效 ${sfxName} 被浏览器阻止或不支持:`, error)
        } else if (error.name === 'AbortError') {
          // console.debug(`播放物品音效 ${sfxName} 被中断: 快速播放音效`)
        } else {
          console.error(`播放物品音效 ${sfxName} 失败:`, error)
        }
      })
    }
  }

  /**
   * 播放怪物音效
   */
  playMonsterSFX (monsterName, sfxName, volume = 1.0) {
    if (this.playWebAudioOneShot(`/sound/monster/${monsterName}/${sfxName}`, 'monster', volume)) {
      return
    }
    const audioId = `monster_${monsterName}_${sfxName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/monster/${monsterName}/${sfxName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * volume
      this.audioElements.set(audioId, audio)
    } else {
      audio.currentTime = 0
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * volume
    }

    if (!this.acquireMonsterActionHtmlSlot(audio)) {
      return
    }

    // 检查是否允许自动播放
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // 如果播放失败，可能是由于浏览器的自动播放策略
        if (error.name === 'NotAllowedError') {
          console.warn(`播放怪物音效 ${monsterName}/${sfxName} 被浏览器阻止: 需要用户交互`)
        } else {
          console.error(`播放怪物音效 ${monsterName}/${sfxName} 失败:`, error)
        }
      })
    }
  }

  playMonsterGenericSFX (sfxName, volume = 1.0) {
    if (this.playWebAudioOneShot(`/sound/${sfxName}`, 'monster', volume)) {
      return
    }
    const audioId = `monster_${sfxName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/${sfxName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * volume
      this.audioElements.set(audioId, audio)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = volume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * volume
    }

    if (!this.acquireMonsterActionHtmlSlot(audio)) {
      return
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放怪物音效 ${sfxName} 被浏览器阻止或不支持:`, error)
        } else if (error.name === 'AbortError') {
          // console.debug(`播放怪物音效 ${sfxName} 被中断: 快速播放音效`)
        } else {
          console.error(`播放怪物音效 ${sfxName} 失败:`, error)
        }
      })
    }
  }

  playMonsterEncounterBGM (trackName = 'BgmInBoss.mp3', loop = false) {
    const audioId = `monster_boss_bgm_${trackName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/music/${trackName}`)
      audio.crossOrigin = 'anonymous'
      audio.loop = loop
      audio.__volumeFactor = 1
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster
      this.audioElements.set(audioId, audio)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = 1
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放怪物遭遇音乐 ${trackName} 被浏览器阻止或不支持:`, error)
        } else if (error.name === 'AbortError') {
          console.debug(`播放怪物遭遇音乐 ${trackName} 被中断`)
        } else {
          console.error(`播放怪物遭遇音乐 ${trackName} 失败:`, error)
        }
      })
    }
  }

  /**
   * 播放登录音乐
   */
  playLoginMusic () {
    this.playBGM('login.mp3')
  }

  /**
   * 播放创建角色音乐
   */
  playCreateMusic () {
    this.playBGM('create.mp3')
  }

  /**
   * 播放主界面音乐
   */
  playMainMusic () {
    // 随机选择一首主界面音乐
    const mainTracks = [
      'aziliya_city.webm',
      'shanhudao_city.webm',
      'cg_city.mp3',
      'dk12_city.mp3',
      'dk3_city.mp3',
      'ls_city.mp3',
      'pl_city.mp3',
      'zfxd_city.mp3'
    ]

    const randomTrack = mainTracks[Math.floor(Math.random() * mainTracks.length)]
    this.playBGM(randomTrack)
  }

  /**
   * 播放音乐 - 兼容旧版接口
   * @param {string} musicType - 音乐类型 ('map' 或 'battle')
   * @param {string} mapName - 地图名称
   */
  playMusic (musicType, mapName) {

    // 根据地图名称选择合适的音乐
    if (musicType === 'map') {
      // 地图音乐映射（与old版本保持一致）
      const mapMusicMap = {
        帕里大陆: 'pl_city.mp3',
        晨光大陆: 'cg_city.mp3',
        莱斯大陆: 'ls_city.mp3',
        '达肯1,2大陆': 'dk12_city.mp3',
        达肯3大陆: 'dk3_city.mp3',
        阿兹利亚: 'aziliya_city.webm',
        珊瑚岛: 'shanhudao_city.webm',
        凯伦草原: 'eillun.mp3' // 注意：old版本中凯伦草原使用的是eillun.mp3
      }

      const trackName = mapMusicMap[mapName] || 'pl_city.mp3'
      // console.log(`Selected track for map '${mapName}': ${trackName}`)
      this.playBGM(trackName)
    } else if (musicType === 'battle') {
      // 战斗音乐
      // console.log('Playing battle music')
      this.playBattleMusic()
    } else {
      console.warn(`Unknown music type: ${musicType}`)
    }
  }

  /**
   * 播放战斗音乐
   */
  playBattleMusic () {
    // 随机选择一首战斗音乐
    const battleTracks = [
      'cg_battle.mp3',
      'dk12_battle.mp3',
      'dk3_battle.mp3',
      'ls_battle.mp3',
      'pl_battle.mp3',
      'tongyong_battle.mp3'
    ]

    const randomTrack = battleTracks[Math.floor(Math.random() * battleTracks.length)]
    this.playBGM(randomTrack)
  }

  /**
   * 播放攻击音效
   */
  playAttackSFX (weaponType = 'sword', isCritical = false) {
    // 武器攻击音效映射表 - 参考old/js/state.js中的weaponSoundMapping
    const weaponSoundMapping = {
      sword: {
        // 剑
        normal: 'Item1WpnAtk.wav',
        critical: 'PcDmgSwdC.wav'
      },
      stick: {
        // 魔棒
        normal: 'PcPatDDmg.wav',
        critical: 'Item2WpnAtk.wav'
      },
      staff: {
        // 法杖
        normal: 'PcPatDDmg.wav',
        critical: 'Item2WpnAtk.wav'
      },
      axe: {
        // 斧
        normal: 'Item1WpnAtk.wav',
        critical: 'PcDmgSwdC.wav'
      },
      yoyo: {
        // 飞轮
        normal: 'PcDmgYoyB.wav',
        critical: 'PcDmgYoyC.wav'
      },
      bow: {
        // 弓
        normal: 'PcDmgBowB.wav',
        critical: 'PcDmgBowC.wav'
      },
      wand: {
        // 魔杖
        normal: 'PcDmgWanB.wav',
        critical: 'PcDmgWanC.wav'
      },
      knuckle: {
        // 拳套
        normal: 'PcDmgCheB.wav',
        critical: 'PcDmgCheC.wav'
      },
      default: {
        // 默认音效
        normal: 'PcPatDDmg.wav',
        critical: 'Item2WpnAtk.wav'
      }
    }

    const soundMapping = weaponSoundMapping[weaponType] || weaponSoundMapping.default
    const sfxName = isCritical ? soundMapping.critical : soundMapping.normal

    // 使用相对路径播放音效，参考old版本的音效路径
    this.playSFX(sfxName)
  }

  /**
   * 播放物品使用音效
   */
  playItemUseSFX (itemType = 'potion') {
    const scrollSfxOptions = [
      'ItemChrExchage.wav',
      'ItemChrExpasion.wav',
      'ItemChrRef.wav'
    ]

    if (itemType === 'scroll' || itemType === 'buff') {
      const randomIndex = Math.floor(Math.random() * scrollSfxOptions.length)
      this.playSFX(scrollSfxOptions[randomIndex])
      return
    }

    const sfxMap = {
      hp: 'ItemGnPotion.wav',
      mp: 'ItemGnPotion.wav',
      potion: 'ItemGnPotion.wav',
      food: 'food_eat.mp3'
    }

    const sfxName = sfxMap[itemType] || 'ItemGnPotion.wav'
    this.playSFX(sfxName)
  }

  /**
   * 播放获得金币音效
   * 使用 InfTrade.wav 作为金币获得的提示音效
   */
  playGoldSFX () {
    this.playItemSFX('InfTrade.wav')
  }

  /**
   * 播放物品掉落音效
   */
  playItemDropSFX () {
    this.playItemSFX('ItemDropDing1.wav')
  }

  /**
   * 播放怪物受伤音效
   */
  playMonsterDamageSFX () {
    this.playMonsterGenericSFX('default_dmg1.wav')
  }

  /**
   * 播放音效，支持回退到默认音效
   * @param {string} primarySfx - 主要音效
   * @param {string} fallbackSfx - 回退音效
   */
  playSFXWithFallback (primarySfx, fallbackSfx) {
    // 首先尝试播放主要音效
    const audioId = `sfx_${primarySfx}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/${primarySfx}`)
      audio.crossOrigin = 'anonymous'
      audio.volume = this.volumeSettings.master * this.volumeSettings.sfx
      this.audioElements.set(audioId, audio)
    } else {
      audio.currentTime = 0
    }

    // 检查是否允许自动播放
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 如果主要音效播放失败，尝试播放回退音效
        // console.warn(`主要音效播放失败: ${primarySfx}, 尝试播放默认音效: ${fallbackSfx}`)

        // 播放回退音效
        this.playSFX(fallbackSfx)
      })
    }
  }

  /**
   * 播放怪物攻击音效
   */
  playMonsterAttackSFX () {
    this.playMonsterGenericSFX('default_atk1.wav')
  }

  /**
   * 播放怪物死亡音效
   */
  playMonsterDeathSFX (monsterIcon = null, volume = 1.0) {
    const sfxName = 'default_die1.wav'
    const normalizedVolume = Number(volume)
    const resolvedVolume = Number.isFinite(normalizedVolume) ? Math.max(0, Math.min(1, normalizedVolume)) : 1

    if (this.playWebAudioOneShot(`/sound/${sfxName}`, 'monster', resolvedVolume)) {
      return
    }

    const resolvedKey =
      typeof monsterIcon === 'string' && monsterIcon.trim() ? monsterIcon.trim() : 'default'
    const audioId = `monster_${resolvedKey}_${sfxName}`
    let audio = this.audioElements.get(audioId)

    if (!audio) {
      audio = new Audio(`/sound/${sfxName}`)
      audio.crossOrigin = 'anonymous'
      audio.__volumeFactor = resolvedVolume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * resolvedVolume
      this.audioElements.set(audioId, audio)
    } else {
      audio.pause()
      audio.currentTime = 0
      audio.__volumeFactor = resolvedVolume
      audio.volume = this.volumeSettings.master * this.volumeSettings.monster * resolvedVolume
    }

    if (!this.acquireMonsterActionHtmlSlot(audio)) {
      return
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
          console.warn(`播放怪物音效 ${sfxName} 被浏览器阻止或不支持:`, error)
        } else if (error.name === 'AbortError') {
          // console.debug(`播放怪物音效 ${sfxName} 被中断: 快速播放音效`)
        } else {
          console.error(`播放怪物音效 ${sfxName} 失败:`, error)
        }
      })
    }
  }

  /**
   * 播放物品拾取音效
   */
  playItemPickupSFX () {
    this.playItemSFX('InfGroundPickup.wav')
  }

  /**
   * 播放交易音效
   */
  playTradeSFX () {
    this.playSFX('InfTrade.wav')
  }

  /**
   * 播放升级音效
   */
  playLevelUpSFX () {
    this.playSFX('PcLevelup.wav')
  }

  /**
   * 播放治疗音效
   */
  playHealSFX () {
    this.playSFX('ItemGnPotion.wav')
  }

  /**
   * 播放死亡音效
   * 参考old版本实现：同时播放性别音效和死亡背景音乐
   */
  playDeathSFX (gender = 'male') {
    // console.log('[AudioService] playDeathSFX 被调用, gender:', gender)

    // 1. 根据性别播放死亡音效
    const sfxName = gender === 'female' ? 'PcFemDie.wav' : 'PcmaleDie.wav'
    // console.log('[AudioService] 播放死亡音效文件:', sfxName)
    this.playSFX(sfxName)

    // 2. 播放死亡背景音乐（参考old版本实现）
    // console.log('[AudioService] 播放死亡背景音乐: siwang.mp3')
    this.playBGM('siwang.mp3', false)
  }

  /**
   * 停止死亡音效（包括死亡背景音乐）
   * 在角色复活后调用，停止 siwang.mp3 死亡BGM
   */
  stopDeathSFX () {
    // 停止当前正在播放的BGM（即死亡背景音乐 siwang.mp3）
    this.stopBGM()
  }

  /**
   * 播放受伤音效
   */
  playDamageSFX (gender = 'male') {
    const sfxName = gender === 'female' ? 'PcFemDmg1.wav' : 'PcmaleDmg1.wav'
    this.playSFX(sfxName)
  }

  /**
   * 播放复活音效
   */
  playResurrectSFX () {
    this.playSFX('PCSkillM-Resurrsction.wav')
  }

  /**
   * 播放技能命中音效
   */
  playSkillHitSFX () {
    this.playSFX('PcSkillD-clean hit.wav')
  }

  /**
   * 播放强化成功音效
   */
  playUpgradeSuccessSFX () {
    this.playSFX('InfUpgradeSuccess.wav')
  }

  /**
   * 播放强化失败音效
   */
  playUpgradeFailureSFX () {
    this.playSFX('InfUpgradeFail.wav')
  }

  /**
   * 播放点击音效
   */
  playClickSFX () {
    this.playSFX('InfClick.wav')
  }

  /**
   * 播放任务完成音效
   */
  playQuestCompleteSFX () {
    this.playMusicSFX('BgmEvEnd.mp3')
  }

  /**
   * 播放经验获取音效
   */
  playExpGainSFX () {
    this.playSFX('exp_gain.mp3')
  }

  /**
   * 停止所有音频
   */
  stopAllAudio () {
    if (this.skillSfxSequence) {
      this.skillSfxSequence.queue = []
      if (this.skillSfxSequence.current?.cancel) {
        try {
          this.skillSfxSequence.current.cancel()
        } catch (error) {
          console.error('[AudioService] stopAllAudio 取消技能音效失败:', error)
        }
      }
      this.skillSfxSequence.current = null
      this.skillSfxSequence.isPlaying = false
    }
    this.audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    this.stopBGM()
    try {
      this.stopAllWebAudioSources()
    } catch (error) {
      console.error('[AudioService] stopAllWebAudioSources 失败:', error)
    }
    // 清理非 BGM 的音效缓存条目，防止长时间运行后 Map 无限增长
    this.pruneAudioElements()
  }

  /**
   * 暂停所有音频
   */
  pauseAllAudio () {
    this.audioElements.forEach(audio => {
      audio.pause()
    })
    this.pauseBGM()
    this.pauseWebAudio()

  }

  /**
   * 恢复所有音频
   */
  resumeAllAudio () {
    this.audioElements.forEach(audio => {
      // 检查是否允许自动播放
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // 如果播放失败，可能是由于浏览器的自动播放策略
          if (error.name === 'NotAllowedError') {
            console.warn('恢复音频被浏览器阻止: 需要用户交互')
          } else {
            console.error('恢复音频失败:', error)
          }
        })
      }
    })

    this.resumeWebAudio()
    this.resumeBGM()
   
  }

  /**
   * 清理音频资源
   */
  cleanup () {
    this.stopAllAudio()
    this.audioElements.clear()
    this.audioElementLastUsed.clear()
    this.currentBGM = null
    this.cleanupWebAudio()
  }

  /**
   * LRU 淘汰非 BGM 的 audioElements 条目
   * 当 Map 大小超过 audioElementsMaxSize 时，按最后使用时间淘汰最旧的条目
   * 同时清理对应的 audioElementLastUsed 记录
   * @returns {number} 被淘汰的条目数量
   */
  pruneAudioElements () {
    if (this.audioElements.size <= this.audioElementsMaxSize) {
      return 0
    }

    // 收集非 BGM 条目及其最后使用时间
    const candidates = []
    for (const [audioId, audio] of this.audioElements) {
      // 保留当前正在播放的 BGM
      if (audio === this.currentBGM) {
        continue
      }
      const lastUsed = this.audioElementLastUsed.get(audioId) || 0
      candidates.push({ audioId, lastUsed })
    }

    // 按最后使用时间排序，淘汰最旧的
    candidates.sort((a, b) => a.lastUsed - b.lastUsed)
    const toRemove = candidates.slice(0, this.audioElements.size - this.audioElementsMaxSize)

    for (const { audioId } of toRemove) {
      const audio = this.audioElements.get(audioId)
      if (audio) {
        try {
          audio.pause()
          audio.src = ''
        } catch (e) {
          // 忽略清理失败
        }
      }
      this.audioElements.delete(audioId)
      this.audioElementLastUsed.delete(audioId)
    }

    return toRemove.length
  }

  /**
   * 获取音量设置
   */
  getVolumeSettings () {
    return { ...this.volumeSettings }
  }

  /**
   * 设置所有音量
   */
  setAllVolumes (settings) {
    const nextSettings = { ...this.volumeSettings }
    const keys = ['master', 'bgm', 'sfx', 'monster', 'skill', 'item']
    for (const key of keys) {
      if (settings && settings[key] !== undefined) {
        const candidate = Number(settings[key])
        if (Number.isFinite(candidate)) {
          nextSettings[key] = Math.max(0, Math.min(1, candidate))
        }
      }
    }
    this.volumeSettings = nextSettings
    this.updateAllVolumes()
    this.saveVolumeSettings()
  }
}
