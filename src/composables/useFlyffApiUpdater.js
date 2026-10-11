/**
 * @file useFlyffApiUpdater.js
 * @description FlyFF API 数据更新器 - 组合式函数
 * @description 融合 get_Flyff_API.html 中所有 API 请求功能，提供：
 *   - 版本比对：拉取远程版本与本地版本比较，判断是否需要更新
 *   - 一键增量更新：物品/怪物/技能缺失ID自动检测 + 详情拉取 + 写入JS文件
 *   - 怪物/物品/地图/NPC/技能/任务/成就/装备套装的 ID 列表获取与详情批量拉取
 *   - 各类图标（怪物/物品/NPC/技能）的增量下载（跳过已存在文件）
 *   - 物品图片遗漏校验
 *   - 一键全量更新所有类别
 *   - 速率控制（每分钟最多 290 次请求）
 *
 * @example
 * const {
 *   outputText, outputType, progress,
 *   isRunning, currentTask,
 *   localVersion, remoteVersion, needsUpdate,
 *   versionCompareResult, updateStats,
 *   runBatchUpdate,
 *   fetchMonsterIds, fetchMonsterDetails, fetchMonsterIcons,
 *   fetchMapDetails, fetchItemDetails, fetchItemIcons, validateItemIcons,
 *   fetchNpcInfo, fetchNpcIcons,
 *   fetchEquipmentSet, fetchSkillInfo, fetchSkillIcons,
 *   fetchQuestInfo,
 *   fetchAchievementIds, fetchAchievementDetails,
 *   runOneClickUpdate, stopCurrentTask
 * } = useFlyffApiUpdater()
 */

import { ref, computed, watch } from 'vue'

/**
 * Go 后端数据更新 API 基础路径
 * 版本比对、一键增量更新等接口
 */
/** 数据更新 API 基础路径（通过 Vite 代理转发到 Go 后端） */
const DATA_API_BASE = '/api/data'

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 800

/**
 * FlyFF API 代理基础地址
 * 通过 Go 后端 /api/proxy/ 路由代理到 https://api.flyff.com/
 * 前端请求 /api/proxy/xxx → Vite 代理到 Go 后端(8080) → 代理到 api.flyff.com
 */
const API_BASE = '/api/proxy'

/** 速率控制常量：每分钟最多 290 次请求，间隔 207ms */
const BASE_DELAY = 207
const MAX_REQUESTS_PER_MINUTE = 290

/** failedIdsMap 持久化到 localStorage 的键名 */
const FAILED_IDS_STORAGE_KEY = 'flyff_api_failed_ids_map'

/**
 * 延迟指定毫秒
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 速率控制等待（在循环中递增计数并等待）
 * @param {Object} state - 速率状态 { count, startTime }
 * @returns {Promise<void>}
 */
async function rateWait (state) {
  state.count++
  const elapsed = Date.now() - state.startTime
  if (state.count >= MAX_REQUESTS_PER_MINUTE && elapsed < 60000) {
    const remaining = 60000 - elapsed
    await sleep(remaining)
    state.count = 0
    state.startTime = Date.now()
  } else {
    await sleep(BASE_DELAY)
  }
}

/**
 * 触发浏览器下载 Blob 文件
 * @param {Blob} blob - 文件数据
 * @param {string} fileName - 文件名
 */
function downloadBlob (blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * FlyFF API 数据更新器组合式函数
 * @returns {Object} 响应式状态和操作方法
 */
export function useFlyffApiUpdater () {
  // ==================== 响应式状态 ====================

  /** 输出日志文本 */
  const outputText = ref('点击按钮请求 API，结果将显示在这里')
  /** 输出状态类型: '' | 'success' | 'error' | 'warning' */
  const outputType = ref('')
  /** 进度百分比 0-100（当前步骤的进度） */
  const progress = ref(0)
  /** 是否正在执行任务 */
  const isRunning = ref(false)
  /** 当前任务描述 */
  const currentTask = ref('')
  /** 中止标志 */
  const abortFlag = ref(false)
  /** 预估剩余时间（秒） */
  const estimatedTime = ref('')
  /** 是否支持断点续传（中止后可继续） */
  const canResume = ref(false)

  // ==================== 全局进度 ====================

  /** 默认全局总步骤数（后端版本变化时11步，版本未变化时6步，后端会通过 totalSteps 字段动态通知） */
  const DEFAULT_TOTAL_STEPS = 11

  /** 全局进度百分比 0-100 */
  const globalProgress = ref(0)

  /** 当前步骤序号（1-based，0表示未开始） */
  const currentStepIndex = ref(0)

  /** 当前步骤名称（中文） */
  const currentStepName = ref('')

  /** 后端通知的实际总步骤数（0表示未获取，使用默认值） */
  const backendTotalSteps = ref(0)

  /**
   * 步骤 key 到中文名称的映射
   * 后端 step 字段格式: version_compare, item_fetch_ids, item_detail, item_write, item_icon, item_cns 等
   * @type {Record<string, string>}
   */
  const STEP_NAME_MAP = {
    version_compare: '版本比对',
    item_fetch_ids: '物品数据拉取',
    item_detail: '物品数据拉取',
    item_write: '物品数据写入',
    monster_fetch_ids: '怪物数据拉取',
    monster_detail: '怪物数据拉取',
    monster_write: '怪物数据写入',
    skill_fetch_ids: '技能数据拉取',
    skill_detail: '技能数据拉取',
    skill_write: '技能数据写入',
    equipset_fetch_ids: '套装数据拉取',
    equipset_detail: '套装数据拉取',
    equipset_write: '套装数据写入',
    item_icon: '物品图片下载',
    monster_icon: '怪物图片下载',
    skill_icon: '技能图片下载',
    item_cns: 'CNS比对',
    monster_cns: 'CNS比对',
    skill_cns: 'CNS比对',
    equipset_cns_ids: '套装ID比对',
    equipset_cns: '套装比对',
    achievement_fetch_ids: '成就数据拉取',
    achievement_detail: '成就数据拉取',
    achievement_write: '成就数据写入'
  }

  /**
   * 从后端进度消息中提取步骤编号（格式: [n/N]）
   * @param {string} message - 后端进度消息
   * @returns {{ stepIndex: number, totalSteps: number } | null}
   */
  function parseStepFromMessage (message) {
    if (!message) return null
    const match = message.match(/\[(\d+)\/(\d+)\]/)
    if (match) {
      return { stepIndex: parseInt(match[1], 10), totalSteps: parseInt(match[2], 10) }
    }
    return null
  }

  /**
   * 根据后端进度数据计算全局进度
   * 优先使用后端消息中的 [n/N] 步骤编号和 totalSteps 字段
   * @param {string} step - 后端步骤标识
   * @param {number} stepPercent - 当前步骤的完成百分比 0-100
   * @param {string} message - 后端进度消息（用于提取步骤编号）
   * @param {number} totalStepsFromBackend - 后端通知的总步骤数
   */
  function updateGlobalProgress (step, stepPercent, message, totalStepsFromBackend) {
    /* 更新总步骤数 */
    if (totalStepsFromBackend && totalStepsFromBackend > 0) {
      backendTotalSteps.value = totalStepsFromBackend
    }

    /* 获取步骤名称 */
    const stepName = STEP_NAME_MAP[step] || ''
    if (stepName) {
      currentStepName.value = stepName
    }

    /* 从消息中提取步骤编号 [n/N] */
    const parsed = parseStepFromMessage(message)
    if (parsed) {
      currentStepIndex.value = parsed.stepIndex
      /* 同时更新后端总步骤数（消息中的N是最准确的） */
      if (parsed.totalSteps > 0) {
        backendTotalSteps.value = parsed.totalSteps
      }
    }

    /* 计算全局进度 */
    const totalSteps = backendTotalSteps.value || DEFAULT_TOTAL_STEPS
    const stepIdx = parsed ? parsed.stepIndex : (currentStepIndex.value || 1)
    const completedSteps = stepIdx - 1
    const stepProgress = Math.min(stepPercent, 100) / 100
    globalProgress.value = Math.round(((completedSteps + stepProgress) / totalSteps) * 100)
  }

  // ==================== 版本与增量更新状态 ====================

  /** 本地版本号 */
  const localVersion = ref('')
  /** 远程版本号 */
  const remoteVersion = ref('')
  /** 是否需要更新 */
  const needsUpdate = ref(false)
  /** 版本比对结果 */
  const versionCompareResult = ref(null)
  /** 增量更新统计 */
  const updateStats = ref(null)

  /**
   * 请求失败ID分类汇总（持久化到 localStorage）
   * @type {import('vue').Ref<{items: number[], monster: number[], skill: number[], image: number[], achievement: number[]}>}
   * @description 按类型记录所有请求失败的ID，包括详情拉取失败和图标下载失败
   * @description 只有 3 次重试都失败的ID才会被记录
   */
  const failedIdsMap = ref(loadFailedIdsFromStorage())

  // ==================== 内部工具 ====================

  /**
   * 从 localStorage 加载 failedIdsMap
   * @returns {{items: number[], monster: number[], skill: number[], image: number[], achievement: number[]}} 持久化的失败ID映射
   */
  function loadFailedIdsFromStorage () {
    try {
      const raw = localStorage.getItem(FAILED_IDS_STORAGE_KEY)
      if (!raw) return { items: [], monster: [], skill: [], image: [], achievement: [] }
      const parsed = JSON.parse(raw)
      /* 确保所有分类字段存在且为数组 */
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        monster: Array.isArray(parsed.monster) ? parsed.monster : [],
        skill: Array.isArray(parsed.skill) ? parsed.skill : [],
        image: Array.isArray(parsed.image) ? parsed.image : [],
        achievement: Array.isArray(parsed.achievement) ? parsed.achievement : []
      }
    } catch {
      return { items: [], monster: [], skill: [], image: [], achievement: [] }
    }
  }

  /**
   * 将 failedIdsMap 保存到 localStorage
   */
  function saveFailedIdsToStorage () {
    try {
      localStorage.setItem(FAILED_IDS_STORAGE_KEY, JSON.stringify(failedIdsMap.value))
    } catch (err) {
      console.error('[FlyffApiUpdater] 保存失败ID到localStorage失败:', err)
    }
  }

  /* 监听 failedIdsMap 变化自动持久化 */
  watch(failedIdsMap, () => {
    saveFailedIdsToStorage()
  }, { deep: true })

  /**
   * 更新输出信息
   * @param {string} text - 输出文本
   * @param {string} [type=''] - 状态类型
   */
  function setOutput (text, type = '') {
    outputText.value = text
    outputType.value = type
  }

  /**
   * 更新进度
   * @param {number} current - 当前值
   * @param {number} total - 总值
   */
  function setProgress (current, total) {
    progress.value = total > 0 ? Math.round((current / total) * 100) : 0
  }

  /**
   * 检查是否被中止
   * @throws {Error} 如果被中止则抛出错误
   */
  function checkAbort () {
    if (abortFlag.value) {
      throw new Error('任务已被用户中止')
    }
  }

  /**
   * 将失败ID追加到 failedIdsMap 对应分类中（自动去重+持久化）
   * @param {'items'|'monster'|'skill'|'image'|'achievement'} category - 失败类别
   * @param {number[]} ids - 失败的ID列表
   */
  function appendFailedIds (category, ids) {
    if (!ids || ids.length === 0) return
    const current = failedIdsMap.value[category] || []
    /* Set 去重：合并已有ID和新增ID */
    const merged = [...new Set([...current, ...ids])]
    failedIdsMap.value = {
      ...failedIdsMap.value,
      [category]: merged
    }
    /* watch 会自动触发持久化 */
  }

  /**
   * 清空 failedIdsMap 所有分类并同步清除 localStorage
   */
  function clearFailedIdsMap () {
    failedIdsMap.value = {
      items: [],
      monster: [],
      skill: [],
      image: [],
      achievement: []
    }
    /* watch 会自动触发持久化（保存空值） */
  }

  /**
   * 检查是否所有分类都没有失败ID
   * @returns {boolean} 是否全部为空
   */
  function isFailedIdsMapEmpty () {
    const map = failedIdsMap.value
    return map.items.length === 0 && map.monster.length === 0 &&
           map.skill.length === 0 && map.image.length === 0 &&
           (map.achievement?.length || 0) === 0
  }

  /**
   * 根据 taskName 推断失败ID所属分类
   * @param {string} taskName - 任务名称
   * @returns {'items'|'monster'|'skill'|'image'|'achievement'} 分类键名
   */
  function inferCategoryFromTaskName (taskName) {
    if (taskName.includes('物品') || taskName.toLowerCase().includes('item')) return 'items'
    if (taskName.includes('怪物') || taskName.toLowerCase().includes('monster')) return 'monster'
    if (taskName.includes('技能') || taskName.toLowerCase().includes('skill')) return 'skill'
    if (taskName.includes('图标') || taskName.toLowerCase().includes('icon') || taskName.includes('图片') || taskName.toLowerCase().includes('image')) return 'image'
    if (taskName.includes('成就') || taskName.toLowerCase().includes('achievement')) return 'achievement'
    return 'items'
  }

  /**
   * 通用批量详情获取器
   * @param {Object} options - 配置选项
   * @param {string} options.taskName - 任务名称
   * @param {string} options.idListUrl - ID 列表获取 URL（相对路径或绝对路径）
   * @param {Function} options.detailUrlFn - 根据 ID 生成详情 API URL 的函数
   * @param {string} options.saveFileName - 保存文件名
   * @param {Function} [options.existingDataFetcher] - 获取已有数据的函数（增量比对）
   * @param {Function} [options.getNameFn] - 从数据中提取名称的函数
   * @param {'items'|'monster'|'skill'|'image'|'achievement'} [options.failedCategory] - 失败ID归类分类，不提供则自动推断
   * @returns {Promise<Array>} 获取到的所有详情数据
   */
  async function batchFetchDetails ({
    taskName,
    idListUrl,
    detailUrlFn,
    saveFileName,
    existingDataFetcher = null,
    getNameFn = (d) => d.name?.cns || d.name?.en || '未知',
    failedCategory = null
  }) {
    isRunning.value = true
    currentTask.value = taskName
    abortFlag.value = false
    setProgress(0, 1)

    try {
      // 1. 获取 ID 列表
      setOutput(`正在获取 ${taskName} ID 列表...`)
      const idListResponse = await fetch(idListUrl.startsWith('http') || idListUrl.startsWith('/') ? idListUrl : `${API_BASE}${idListUrl}`)
      if (!idListResponse.ok) throw new Error(`获取 ID 列表失败: HTTP ${idListResponse.status}`)
      const ids = await idListResponse.json()
      const idArray = Array.isArray(ids) ? ids : []
      if (idArray.length === 0) throw new Error('ID 列表为空')
      setOutput(`获取到 ${idArray.length} 个 ${taskName} ID`, 'success')

      // 2. 增量比对：获取已有数据
      let existingData = []
      const existingIdSet = new Set()
      if (existingDataFetcher) {
        try {
          existingData = await existingDataFetcher()
          existingData.forEach(item => {
            if (item.id !== undefined) existingIdSet.add(item.id)
          })
        } catch {
          // 获取已有数据失败，全量拉取
        }
      }

      // 过滤出需要请求的 ID
      const idsToFetch = idArray.filter(id => !existingIdSet.has(id))
      if (idsToFetch.length === 0) {
        setOutput(`${taskName} 数据已是最新，无需更新`, 'success')
        setProgress(1, 1)
        isRunning.value = false
        currentTask.value = ''
        return existingData
      }

      setOutput(`增量比对: 总计 ${idArray.length}，已有 ${existingIdSet.size}，需新增 ${idsToFetch.length}`)

      // 3. 逐个获取详情
      const allDetails = [...existingData]
      const failedIds = []
      const rateState = { count: 0, startTime: Date.now() }

      for (let i = 0; i < idsToFetch.length; i++) {
        checkAbort()
        const currentId = idsToFetch[i]
        setProgress(i + 1, idsToFetch.length)
        setOutput(`[${i + 1}/${idsToFetch.length}] 正在请求 ${taskName} ID:${currentId}`)

        try {
          await rateWait(rateState)
          const url = detailUrlFn(currentId)
          const response = await fetch(url.startsWith('http') || url.startsWith('/') ? url : `${API_BASE}${url}`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json()
          allDetails.push(data)
          setOutput(`[${i + 1}/${idsToFetch.length}] 成功获取 ${taskName} ${getNameFn(data)} (ID:${currentId})`, 'success')
        } catch (err) {
          if (err.message === '任务已被用户中止') throw err
          failedIds.push(currentId)
          setOutput(`[${i + 1}/${idsToFetch.length}] 获取 ${taskName} ID:${currentId} 失败: ${err.message}`, 'error')
        }
      }

      // 4. 保存为 JSON 文件下载
      const blob = new Blob([JSON.stringify(allDetails, null, 2)], { type: 'application/json' })
      downloadBlob(blob, saveFileName)

      /* 将失败ID写入 failedIdsMap 对应分类 */
      if (failedIds.length > 0) {
        const category = failedCategory || inferCategoryFromTaskName(taskName)
        appendFailedIds(category, failedIds)
      }

      const failMsg = failedIds.length > 0 ? `，失败 ${failedIds.length} 条` : ''
      setOutput(`${taskName} 请求完成！成功 ${allDetails.length} 条${failMsg}，文件已下载: ${saveFileName}`, failedIds.length > 0 ? 'warning' : 'success')
      setProgress(1, 1)
      return allDetails
    } catch (err) {
      if (err.message === '任务已被用户中止') {
        setOutput(`${taskName} 任务已被中止`, 'warning')
      } else {
        setOutput(`${taskName} 请求失败: ${err.message}`, 'error')
      }
      return []
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }
  }

  /**
   * 通用图标批量下载器
   * @param {Object} options - 配置选项
   * @param {string} options.taskName - 任务名称
   * @param {string} options.dataUrl - 详情数据 JSON 的获取 URL
   * @param {Function} options.getIconIdFn - 从详情数据中提取图标标识
   * @param {Function} options.getFileNameFn - 从详情数据中生成保存文件名
   * @param {Function} options.downloadUrlFn - 根据图标标识生成下载 URL
   * @param {Function} [options.checkExistUrlFn] - 根据图标标识生成检查存在性 URL（可选，不提供则不检查）
   * @param {boolean} [options.deduplicate] - 是否对图标标识去重
   * @param {'items'|'monster'|'skill'|'image'|'achievement'} [options.failedCategory] - 失败ID归类分类，默认为 'image'
   * @returns {Promise<void>}
   */
  async function batchFetchIcons ({
    taskName,
    dataUrl,
    getIconIdFn,
    getFileNameFn,
    downloadUrlFn,
    checkExistUrlFn = null,
    deduplicate = true,
    failedCategory = 'image'
  }) {
    isRunning.value = true
    currentTask.value = taskName
    abortFlag.value = false
    setProgress(0, 1)

    try {
      // 1. 加载详情数据
      setOutput(`正在加载 ${taskName} 数据...`)
      const dataResponse = await fetch(dataUrl)
      if (!dataResponse.ok) throw new Error(`加载数据失败: HTTP ${dataResponse.status}`)
      const dataList = await dataResponse.json()
      if (!dataList.length) throw new Error('数据为空')

      // 2. 构建下载列表（去重、过滤无效项）
      const seenIcons = new Set()
      const downloadList = []
      for (const item of dataList) {
        const iconId = getIconIdFn(item)
        if (!iconId) continue
        if (deduplicate && seenIcons.has(iconId)) continue
        seenIcons.add(iconId)
        const fileName = getFileNameFn(item, iconId)
        if (!fileName) continue
        downloadList.push({ item, iconId, fileName })
      }

      if (downloadList.length === 0) {
        setOutput(`${taskName} 没有可下载的图标`, 'warning')
        setProgress(1, 1)
        isRunning.value = false
        currentTask.value = ''
        return
      }

      setOutput(`找到 ${downloadList.length} 个 ${taskName} 图标，开始下载...`)

      // 3. 逐个下载
      const rateState = { count: 0, startTime: Date.now() }
      let downloaded = 0
      let skipped = 0
      let failed = 0

      for (let i = 0; i < downloadList.length; i++) {
        checkAbort()
        const { item, iconId, fileName } = downloadList[i]

        // 检查本地文件是否存在（如果提供了检查接口）
        if (checkExistUrlFn) {
          try {
            const checkUrl = checkExistUrlFn(item, iconId)
            const checkResp = await fetch(checkUrl.startsWith('http') || checkUrl.startsWith('/') ? checkUrl : `${API_BASE}${checkUrl}`)
            if (checkResp.ok) {
              const checkData = await checkResp.json()
              if (checkData.exists) {
                skipped++
                setProgress(i + 1, downloadList.length)
                if ((i + 1) % 100 === 0 || (i + 1) === downloadList.length) {
                  setOutput(`[${i + 1}/${downloadList.length}] 跳过已存在的 ${taskName} 图标: ${fileName}`)
                }
                continue
              }
            }
          } catch {
            // 检查失败，继续尝试下载
          }
        }

        // 下载图标
        try {
          await rateWait(rateState)
          const dlUrl = downloadUrlFn(iconId)
          const response = await fetch(dlUrl.startsWith('http') || dlUrl.startsWith('/') ? dlUrl : `${API_BASE}${dlUrl}`)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          downloadBlob(blob, fileName)
          downloaded++

          setProgress(i + 1, downloadList.length)
          if ((i + 1) % 50 === 0 || (i + 1) === downloadList.length) {
            setOutput(`[${i + 1}/${downloadList.length}] 已下载 ${taskName} 图标: ${fileName}`, 'success')
          }
        } catch (err) {
          if (err.message === '任务已被用户中止') throw err
          failed++
          /* 图标下载失败，将关联的物品/怪物/技能ID追加到 image 分类 */
          const itemId = item.id || item.Id
          if (itemId !== undefined && itemId !== null) {
            appendFailedIds(failedCategory, [itemId])
          }
          if (failed <= 10) {
            setOutput(`[${i + 1}/${downloadList.length}] 下载 ${taskName} 图标失败: ${fileName} - ${err.message}`, 'error')
          }
        }
      }

      setOutput(
        `${taskName} 图标下载完成！下载: ${downloaded}，跳过: ${skipped}，失败: ${failed}`,
        failed > 0 ? 'warning' : 'success'
      )
      setProgress(1, 1)
    } catch (err) {
      if (err.message === '任务已被用户中止') {
        setOutput(`${taskName} 任务已被中止`, 'warning')
      } else {
        setOutput(`${taskName} 图标下载失败: ${err.message}`, 'error')
      }
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }
  }

  // ==================== 怪物相关 ====================

  /** 获取怪物 ID 列表 */
  async function fetchMonsterIds () {
    isRunning.value = true
    currentTask.value = '获取怪物ID列表'
    abortFlag.value = false
    try {
      setOutput('正在请求怪物 ID 列表...')
      const response = await fetch(`${API_BASE}/monster`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, 'Monster_ID.json')
      const count = Array.isArray(data) ? data.length : Object.keys(data).length
      setOutput(`请求飞飞怪物 ID 大全 API 成功，共 ${count} 个 ID，已保存到 Monster_ID.json`, 'success')
    } catch (err) {
      setOutput(`请求怪物 ID 列表失败: ${err.message}`, 'error')
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }
  }

  /** 获取怪物详情数据 */
  async function fetchMonsterDetails () {
    return batchFetchDetails({
      taskName: '怪物详情',
      idListUrl: '/data/Monster_ID.json',
      detailUrlFn: (id) => `${API_BASE}/monster/${id}`,
      saveFileName: 'monster_all_info.json',
      failedCategory: 'monster',
      existingDataFetcher: async () => {
        const resp = await fetch('/data/monster_all_info.json')
        if (!resp.ok) throw new Error('文件不存在')
        return resp.json()
      }
    })
  }

  /** 获取怪物图标 */
  async function fetchMonsterIcons () {
    return batchFetchIcons({
      taskName: '怪物图标',
      dataUrl: '/data/monster_all_info.json',
      getIconIdFn: (m) => m.icon,
      getFileNameFn: (m) => `${m.id}.png`,
      downloadUrlFn: (icon) => `${API_BASE}/image/monster/${icon}`,
      checkExistUrlFn: null,
      failedCategory: 'image'
    })
  }

  // ==================== 地图相关 ====================

  /** 获取地图详情数据 */
  async function fetchMapDetails () {
    return batchFetchDetails({
      taskName: '地图详情',
      idListUrl: '/data/map_id.json',
      detailUrlFn: (id) => `${API_BASE}/world/${id}`,
      saveFileName: 'map_info.json'
    })
  }

  // ==================== 物品相关 ====================

  /** 获取物品详情数据（增量比对） */
  async function fetchItemDetails () {
    return batchFetchDetails({
      taskName: '物品详情',
      idListUrl: '/data/item_id.json',
      detailUrlFn: (id) => `${API_BASE}/item/${id}`,
      saveFileName: 'item_info.json',
      failedCategory: 'items',
      existingDataFetcher: async () => {
        const resp = await fetch('/data/item_info.json')
        if (!resp.ok) throw new Error('文件不存在')
        return resp.json()
      }
    })
  }

  /** 获取物品图标（增量下载，检查本地已存在） */
  async function fetchItemIcons () {
    return batchFetchIcons({
      taskName: '物品图标',
      dataUrl: '/data/item_info.json',
      getIconIdFn: (item) => item.icon,
      getFileNameFn: (item) => `${item.id}.png`,
      downloadUrlFn: (icon) => `${API_BASE}/image/item/${icon}`,
      checkExistUrlFn: (item) => `/api/check-item-icon?id=${item.id}`,
      failedCategory: 'image'
    })
  }

  /** 校验物品图片遗漏 */
  async function validateItemIcons () {
    isRunning.value = true
    currentTask.value = '校验物品图片'
    abortFlag.value = false
    setProgress(0, 1)

    try {
      setOutput('正在加载物品数据...')
      const [itemIdsResp, itemInfoResp] = await Promise.all([
        fetch('/data/item_id.json'),
        fetch('/data/item_info.json')
      ])
      if (!itemIdsResp.ok || !itemInfoResp.ok) throw new Error('加载物品数据失败')

      const itemIds = await itemIdsResp.json()
      const itemInfo = await itemInfoResp.json()

      // 检查本地图标是否存在的辅助函数
      const checkIconExists = async (id) => {
        try {
          const resp = await fetch(`/api/check-item-icon?id=${id}`)
          if (resp.ok) {
            const data = await resp.json()
            return data.exists
          }
        } catch {
          // 检查失败，假设不存在
        }
        return false
      }

      // 批量检查哪些 ID 缺失图标
      const missingItems = []
      const rateState = { count: 0, startTime: Date.now() }

      setOutput(`正在校验 ${itemIds.length} 个物品的图片...`)

      for (let i = 0; i < itemIds.length; i++) {
        checkAbort()
        const id = itemIds[i]
        const exists = await checkIconExists(id)
        if (!exists) {
          missingItems.push(id)
        }
        setProgress(i + 1, itemIds.length)
        if ((i + 1) % 100 === 0) {
          setOutput(`[${i + 1}/${itemIds.length}] 已校验，暂发现 ${missingItems.length} 个缺失`)
        }
        await rateWait(rateState)
      }

      if (missingItems.length === 0) {
        setOutput('校验完成，所有物品图片完整！', 'success')
        setProgress(1, 1)
        return
      }

      // 下载缺失的图标
      setOutput(`发现 ${missingItems.length} 个缺失图标，开始下载...`)
      let downloaded = 0
      let failedIds = []

      for (let i = 0; i < missingItems.length; i++) {
        checkAbort()
        const id = missingItems[i]
        const item = itemInfo.find(it => it.id === id)
        if (!item?.icon) {
          failedIds.push(id)
          continue
        }

        try {
          await rateWait(rateState)
          const resp = await fetch(`${API_BASE}/image/item/${item.icon}`)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const blob = await resp.blob()
          downloadBlob(blob, `${id}.png`)
          downloaded++
          setProgress(i + 1, missingItems.length)
          if ((i + 1) % 20 === 0 || (i + 1) === missingItems.length) {
            setOutput(`[${i + 1}/${missingItems.length}] 已补下载物品图标 ID:${id}`, 'success')
          }
        } catch (err) {
          failedIds.push(id)
        }
      }

      /* 校验物品图片失败ID汇总到 failedIdsMap */
      if (failedIds.length > 0) {
        appendFailedIds('image', failedIds)
      }

      const failMsg = failedIds.length > 0 ? `\n失败 ID: ${failedIds.slice(0, 30).join(', ')}${failedIds.length > 30 ? '...' : ''}` : ''
      setOutput(`校验完成！补下载: ${downloaded}，失败: ${failedIds.length}${failMsg}`, failedIds.length > 0 ? 'warning' : 'success')
      setProgress(1, 1)
    } catch (err) {
      if (err.message === '任务已被用户中止') {
        setOutput('校验任务已被中止', 'warning')
      } else {
        setOutput(`校验物品图片失败: ${err.message}`, 'error')
      }
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }
  }

  // ==================== NPC 相关 ====================

  /** 获取 NPC 信息 */
  async function fetchNpcInfo () {
    return batchFetchDetails({
      taskName: 'NPC详情',
      idListUrl: '/data/npc_id.json',
      detailUrlFn: (id) => `${API_BASE}/npc/${id}`,
      saveFileName: 'npc_info.json'
    })
  }

  /** 获取 NPC 图标 */
  async function fetchNpcIcons () {
    return batchFetchIcons({
      taskName: 'NPC图标',
      dataUrl: '/data/npc_info.json',
      getIconIdFn: (npc) => npc.image,
      getFileNameFn: (npc) => npc.image ? npc.image.toLowerCase().trim() : null,
      downloadUrlFn: (img) => `${API_BASE}/image/npc/${img}`,
      checkExistUrlFn: (npc, img) => `/api/check-npc-icon?name=${encodeURIComponent(img.toLowerCase().trim())}`
    })
  }

  // ==================== 装备套装相关 ====================

  /** 获取装备套装属性 */
  async function fetchEquipmentSet () {
    return batchFetchDetails({
      taskName: '装备套装',
      idListUrl: '/data/EquipmentSet_ID.json',
      detailUrlFn: (id) => `${API_BASE}/equipset/${id}`,
      saveFileName: 'TZSX.json',
      getNameFn: (d) => d.name?.cns || '未知套装'
    })
  }

  // ==================== 技能相关 ====================

  /** 获取技能信息 */
  async function fetchSkillInfo () {
    return batchFetchDetails({
      taskName: '技能详情',
      idListUrl: '/data/skill_id.json',
      detailUrlFn: (id) => `${API_BASE}/skill/${id}`,
      saveFileName: 'skill_info.json',
      failedCategory: 'skill',
      getNameFn: (d) => d.name?.cns || d.name || '未知技能'
    })
  }

  /** 获取技能图标 */
  async function fetchSkillIcons () {
    return batchFetchIcons({
      taskName: '技能图标',
      dataUrl: '/data/skill_info.json',
      getIconIdFn: (skill) => skill.icon,
      getFileNameFn: (skill, iconId) => iconId,
      downloadUrlFn: (icon) => `${API_BASE}/image/skill/colored/${icon}`,
      checkExistUrlFn: (_skill, iconName) => `/api/check-skill-icon?name=${encodeURIComponent(iconName)}`,
      failedCategory: 'image'
    })
  }

  // ==================== 任务相关 ====================

  /** 获取任务信息（增量比对） */
  async function fetchQuestInfo () {
    return batchFetchDetails({
      taskName: '任务详情',
      idListUrl: '/data/quest_id.json',
      detailUrlFn: (id) => `${API_BASE}/quest/${id}`,
      saveFileName: 'quest_info.json',
      existingDataFetcher: async () => {
        const resp = await fetch('/data/quest_info.json')
        if (!resp.ok) throw new Error('文件不存在')
        return resp.json()
      },
      getNameFn: (d) => d.name?.cns || '未知任务'
    })
  }

  // ==================== 成就相关 ====================

  /**
   * 获取成就 ID 列表
   * 请求 /api/proxy/achievement 获取所有成就ID，保存到 achievement_id.json
   */
  async function fetchAchievementIds () {
    isRunning.value = true
    currentTask.value = '获取成就ID列表'
    abortFlag.value = false
    try {
      setOutput('正在请求成就 ID 列表...')
      const response = await fetch(`${API_BASE}/achievement`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, 'achievement_id.json')
      const count = Array.isArray(data) ? data.length : Object.keys(data).length
      setOutput(`请求飞飞成就 ID 大全 API 成功，共 ${count} 个 ID，已保存到 achievement_id.json`, 'success')
    } catch (err) {
      setOutput(`请求成就 ID 列表失败: ${err.message}`, 'error')
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }
  }

  /**
   * 获取成就详情数据（增量比对）
   * 从 achievement_id.json 读取ID列表，逐个请求 /api/proxy/achievement/{id} 获取详情
   * 保存到 achievement_info.json
   */
  async function fetchAchievementDetails () {
    return batchFetchDetails({
      taskName: '成就详情',
      idListUrl: '/data/achievement_id.json',
      detailUrlFn: (id) => `${API_BASE}/achievement/${id}`,
      saveFileName: 'achievement_info.json',
      failedCategory: 'achievement',
      existingDataFetcher: async () => {
        const resp = await fetch('/data/achievement_info.json')
        if (!resp.ok) throw new Error('文件不存在')
        return resp.json()
      },
      getNameFn: (d) => d.name?.cns || d.name?.en || '未知成就'
    })
  }

  // ==================== 版本比对 ====================

  /**
   * 比较本地与远程版本
   * @returns {Promise<Object>} 版本比对结果
   */
  async function compareVersion () {
    try {
      setOutput('正在比对版本...')
      const resp = await fetch(`${DATA_API_BASE}/version-compare`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const result = await resp.json()

      if (!result.success) throw new Error(result.message || '版本比对失败')

      const data = result.data
      localVersion.value = data.localVersion || '(无)'
      remoteVersion.value = data.remoteVersion
      needsUpdate.value = data.needsUpdate
      versionCompareResult.value = data

      const msg = data.needsUpdate
        ? `发现新版本！本地: ${data.localVersion || '(无)'} → 远程: ${data.remoteVersion}，需要更新`
        : `当前数据已是最新版本 (${data.localVersion})`

      setOutput(msg, data.needsUpdate ? 'warning' : 'success')
      return data
    } catch (err) {
      setOutput(`版本比对失败: ${err.message}`, 'error')
      console.error('[FlyffApiUpdater] 版本比对失败:', err)
      return null
    }
  }

  // ==================== 一键增量更新 ====================

  /**
   * 将秒数格式化为 mm:ss 或 hh:mm:ss
   * @param {number} sec - 秒数
   * @returns {string} 格式化的时间字符串
   */
  function formatEstimatedTime (sec) {
    if (!sec || sec <= 0) return ''
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    return `${m}:${String(s).padStart(2, '0')}`
  }

  /**
   * 通用轮询进度循环
   * @param {Object} options - 配置项
   * @param {string[]} options.initialLines - 初始日志行（续传时保留之前的日志）
   * @param {number} options.initialLastSeq - 已消费日志的最大 seq（续传时跳过旧日志）
   * @returns {Promise<Object|null>} 更新结果
   */
  async function pollProgressLoop ({ initialLines = [], initialLastSeq = 0 } = {}) {
    /**
     * 已消费日志的最后序号。
     * 必须用后端自增 seq 而不是数组下标：后端日志缓冲区上限 200 条并从头部截断，
     * 用下标判断会在日志写满后永久停止追加（续传时更是从一开始就不再追加）。
     */
    let lastLogSeq = initialLastSeq
    /** 旧版后端（无 seq）时使用的下标游标 */
    let lastLogIndex = 0
    /** 固定日志行 */
    const displayLines = [...initialLines]
    /** 是否已向后端发送中止请求 */
    let abortSent = false

    while (true) {
      // 检查中止标志：通知后端，但继续轮询等待确认
      if (abortFlag.value && !abortSent) {
        try {
          await fetch(`${DATA_API_BASE}/abort-update`, { method: 'POST' })
        } catch { /* 忽略中止请求失败 */ }
        abortSent = true
      }

      // 获取进度
      let progressData
      try {
        const resp = await fetch(`${DATA_API_BASE}/progress`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        progressData = await resp.json()
      } catch (err) {
        console.warn('[FlyffApiUpdater] 轮询进度失败:', err)
        await sleep(POLL_INTERVAL)
        continue
      }

      // 更新进度条
      if (progressData.total > 0) {
        const pct = progressData.percent || 0
        const calcPct = progressData.current > 0 ? Math.round((progressData.current / progressData.total) * 100) : 0
        progress.value = pct > 0 ? pct : calcPct
      }

      // 更新全局进度
      if (progressData.step) {
        const pct = progressData.percent || 0
        const calcPct = progressData.current > 0 && progressData.total > 0
          ? Math.round((progressData.current / progressData.total) * 100) : 0
        updateGlobalProgress(
          progressData.step,
          pct > 0 ? pct : calcPct,
          progressData.message || '',
          progressData.totalSteps || 0
        )
      }

      // 更新预估剩余时间
      const estSec = progressData.estimatedSec || 0
      estimatedTime.value = estSec > 0 ? formatEstimatedTime(estSec) : ''

      // 更新断点续传标志
      canResume.value = Boolean(progressData.canResume)

      // 增量追加新日志（按后端自增 seq 游标，兼容缓冲区截断与续传）
      const logs = progressData.logs || []
      if (logs.length > 0 && typeof logs[0].seq === 'number') {
        for (const entry of logs) {
          if (entry.seq <= lastLogSeq) continue
          displayLines.push(entry.message)
          lastLogSeq = entry.seq
        }
      } else if (logs.length > lastLogIndex) {
        /* 旧版后端无 seq，退回下标方式 */
        for (let i = lastLogIndex; i < logs.length; i++) {
          displayLines.push(logs[i].message)
        }
        lastLogIndex = logs.length
      }
      if (displayLines.length > 80) {
        displayLines.splice(0, displayLines.length - 80)
      }

      // 构建实时进度行（只保留一条当前进度）
      const lines = [...displayLines]
      if (progressData.running && progressData.total > 0) {
        const cur = progressData.current || 0
        const msg = progressData.message || ''
        if (cur > 0 && msg) {
          const timeInfo = estimatedTime.value ? ` | 预估剩余 ${estimatedTime.value}` : ''
          lines.push(`📊 ${msg}${timeInfo}`)
        }
      }
      currentTask.value = progressData.message || ''
      setOutput(lines.join('\n') || '处理中...')

      // 更新类别结果统计
      if (progressData.categoryResults && progressData.categoryResults.length > 0) {
        updateStats.value = { results: progressData.categoryResults }
        /* 从后端类别结果中汇总失败ID到 failedIdsMap */
        for (const cr of progressData.categoryResults) {
          if (cr.failedIds && cr.failedIds.length > 0) {
            const catKey = cr.category === 'item' ? 'items' : cr.category
            if (catKey in failedIdsMap.value) {
              appendFailedIds(catKey, cr.failedIds)
            }
          }
        }
      }

      // 实时更新CNS比对进度统计（运行中前端轮询可读取）
      if (progressData.fieldResults && progressData.fieldResults.length > 0) {
        if (!updateStats.value) updateStats.value = {}
        updateStats.value.fieldResults = progressData.fieldResults
      }

      // 实时更新图片下载进度统计（运行中前端轮询可读取）
      if (progressData.imageResults && progressData.imageResults.length > 0) {
        if (!updateStats.value) updateStats.value = {}
        updateStats.value.imageResults = progressData.imageResults
      }

      // 检查是否完成
      if (progressData.completed) {
        estimatedTime.value = ''
        canResume.value = false
        /* 更新完成，全局进度设为100% */
        globalProgress.value = 100
        if (progressData.result) {
          const result = progressData.result
          localVersion.value = result.version?.localVersion || ''
          remoteVersion.value = result.version?.remoteVersion || ''
          needsUpdate.value = false
          updateStats.value = result

          let totalNew = 0
          let totalFailed = 0
          let totalRedundant = 0
          if (result.results && Array.isArray(result.results)) {
            displayLines.push('')
            for (const r of result.results) {
              const categoryName = { item: '物品', monster: '怪物', skill: '技能', equipset: '套装', achievement: '成就' }[r.category] || r.category
              if (r.error) {
                displayLines.push(`❌ ${categoryName}: 失败 - ${r.error}`)
              } else {
                const newInfo = r.newCount > 0 ? `新增 ${r.newCount} 条` : '无新增'
                const failInfo = r.failedCount > 0 ? `，失败 ${r.failedCount} 条` : ''
                const redundantInfo = r.redundantCount > 0 ? `，冗余 ${r.redundantCount} 条` : ''
                const icon = r.newCount > 0 ? '✅' : (r.redundantCount > 0 ? '⚠️' : '⏭️')
                displayLines.push(`${icon} ${categoryName}: 远程 ${r.totalRemote}，本地 ${r.totalLocal}，${newInfo}${failInfo}${redundantInfo}`)
                if (r.redundantIds && r.redundantIds.length > 0) {
                  const idsStr = r.redundantIds.slice(0, 30).join(', ')
                  displayLines.push(`   冗余ID: ${idsStr}${r.redundantIds.length > 30 ? '...' : ''}`)
                }
                if (r.failedIds && r.failedIds.length > 0) {
                  const idsStr = r.failedIds.slice(0, 30).join(', ')
                  displayLines.push(`   失败ID: ${idsStr}${r.failedIds.length > 30 ? '...' : ''}`)
                }
                totalNew += r.newCount
                totalFailed += r.failedCount
                totalRedundant += (r.redundantCount || 0)
              }
              /* 从最终结果中汇总失败ID到 failedIdsMap */
              if (r.failedIds && r.failedIds.length > 0) {
                const catKey = r.category === 'item' ? 'items' : r.category
                if (catKey in failedIdsMap.value) {
                  appendFailedIds(catKey, r.failedIds)
                }
              }
            }
          }
          /* 从后端汇总的 FailedIdsMap 中合并（如果存在） */
          if (result.failedIdsMap) {
            for (const [catKey, ids] of Object.entries(result.failedIdsMap)) {
              if (Array.isArray(ids) && ids.length > 0 && catKey in failedIdsMap.value) {
                appendFailedIds(catKey, ids)
              }
            }
          }
          /* 图片下载统计 */
          let totalImgDownloaded = 0
          let totalImgFailed = 0
          if (result.imageResults && Array.isArray(result.imageResults)) {
            displayLines.push('')
            for (const ir of result.imageResults) {
              const categoryName = { item: '物品', monster: '怪物', skill: '技能', achievement: '成就' }[ir.category] || ir.category
              if (ir.error) {
                displayLines.push(`❌ ${categoryName}图片: 失败 - ${ir.error}`)
              } else {
                const dlInfo = ir.downloaded > 0 ? `下载 ${ir.downloaded} 张` : '无新增'
                const skipInfo = ir.skipped > 0 ? `，已存在 ${ir.skipped} 张` : ''
                const failInfo = ir.failed > 0 ? `，失败 ${ir.failed} 张` : ''
                displayLines.push(`${ir.downloaded > 0 ? '🖼️' : '⏭️'} ${categoryName}图片: 共 ${ir.totalIcons}，${dlInfo}${skipInfo}${failInfo}`)
                totalImgDownloaded += ir.downloaded
                totalImgFailed += ir.failed
              }
            }
          }

          /* CNS比对统计 */
          let totalNameCnsUpdated = 0
          let totalDescCnsUpdated = 0
          if (result.fieldResults && Array.isArray(result.fieldResults)) {
            displayLines.push('')
            for (const fr of result.fieldResults) {
              const categoryName = { item: '物品', monster: '怪物', skill: '技能', achievement: '成就' }[fr.category] || fr.category
              if (fr.error) {
                displayLines.push(`❌ ${categoryName}CNS比对: 失败 - ${fr.error}`)
              } else {
                const nameInfo = fr.nameCnsUpdated > 0 ? `名称更新 ${fr.nameCnsUpdated}` : '名称无变化'
                const descInfo = fr.descCnsUpdated > 0 ? `，描述更新 ${fr.descCnsUpdated}` : ''
                const failInfo = fr.failed > 0 ? `，失败 ${fr.failed}` : ''
                displayLines.push(`${fr.nameCnsUpdated > 0 || fr.descCnsUpdated > 0 ? '📝' : '⏭️'} ${categoryName}CNS: 共 ${fr.totalCompared}，${nameInfo}${descInfo}${failInfo}`)
                totalNameCnsUpdated += fr.nameCnsUpdated
                totalDescCnsUpdated += fr.descCnsUpdated
              }
            }
          }

          displayLines.push('')
          const imgSummary = totalImgDownloaded > 0 || totalImgFailed > 0
            ? ` | 图片下载 ${totalImgDownloaded} 张，失败 ${totalImgFailed} 张`
            : ''
          const cnsSummary = totalNameCnsUpdated > 0 || totalDescCnsUpdated > 0
            ? ` | CNS名称更新 ${totalNameCnsUpdated}，描述更新 ${totalDescCnsUpdated}`
            : ''
          const redundantSummary = totalRedundant > 0 ? ` | 冗余 ${totalRedundant} 条` : ''
          displayLines.push(`📊 汇总: 共新增 ${totalNew} 条，失败 ${totalFailed} 条${redundantSummary}${imgSummary}${cnsSummary}`)

          /* 如果全部成功（无失败），自动清空 failedIdsMap */
          if (totalFailed === 0 && totalImgFailed === 0 && !isFailedIdsMapEmpty()) {
            clearFailedIdsMap()
          }
        }
        setOutput(displayLines.join('\n'), 'success')
        setProgress(1, 1)
        break
      }

      // 检查是否被中止（后端确认，日志已由后端添加，前端仅更新状态）
      if (progressData.aborted) {
        canResume.value = Boolean(progressData.canResume)
        setOutput(displayLines.join('\n'), 'warning')
        break
      }

      // 安全退出：中止请求已发送但后端长时间未确认
      if (abortSent && !progressData.running && !progressData.aborted) {
        canResume.value = true
        displayLines.push('⏹ 任务已停止，可再次点击继续')
        setOutput(displayLines.join('\n'), 'warning')
        break
      }

      await sleep(POLL_INTERVAL)
    }

    return updateStats.value
  }

  /**
   * 执行一键增量更新（全新开始）
   * @returns {Promise<Object|null>} 更新结果
   */
  async function runBatchUpdate () {
    isRunning.value = true
    currentTask.value = '一键增量更新'
    abortFlag.value = false
    canResume.value = false
    estimatedTime.value = ''
    setProgress(0, 1)
    /* 重置全局进度 */
    globalProgress.value = 0
    currentStepIndex.value = 0
    currentStepName.value = ''
    backendTotalSteps.value = 0
    /* 启动全新更新时不清空失败ID汇总，保留给用户手动重试或查看 */
    /* 如果上一轮全部成功（无失败ID），则自动清空 */
    if (isFailedIdsMapEmpty()) {
      clearFailedIdsMap()
    }

    try {
      setOutput('🚀 正在启动更新任务...')
      const startResp = await fetch(`${DATA_API_BASE}/batch-update-start`, { method: 'POST' })
      if (!startResp.ok) {
        const errData = await startResp.json().catch(() => ({}))
        throw new Error(errData.message || `启动失败: HTTP ${startResp.status}`)
      }
      const startResult = await startResp.json()
      if (!startResult.success) {
        throw new Error(startResult.message || '启动更新任务失败')
      }

      return await pollProgressLoop({ initialLines: [], initialLastSeq: 0 })
    } catch (err) {
      setOutput(`一键增量更新失败: ${err.message}`, 'error')
      console.error('[FlyffApiUpdater] 一键增量更新失败:', err)
      return null
    } finally {
      isRunning.value = false
    }
  }

  /**
   * 续传更新（从中止处继续，跳过版本比对和已完成类别）
   * 保留之前的输出日志，调用 resume-update 端点
   * @returns {Promise<Object|null>} 更新结果
   */
  async function runResumeUpdate () {
    isRunning.value = true
    currentTask.value = '续传更新'
    abortFlag.value = false
    canResume.value = false
    estimatedTime.value = ''
    /* 续传时不清空全局进度，保留之前进度 */

    try {
      // 先获取当前进度中的日志作为初始行
      const progressResp = await fetch(`${DATA_API_BASE}/progress`)
      const progressData = progressResp.ok ? await progressResp.json() : {}
      const existingLogs = progressData.logs || []
      const initialLines = existingLogs.map(l => l.message)
      /* 以已消费的最大 seq 作为续传起点；后端日志会被截断，不能用数组长度 */
      const initialLastSeq = existingLogs.reduce((max, l) => {
        return typeof l.seq === 'number' && l.seq > max ? l.seq : max
      }, 0)

      // 调用续传端点
      const resumeResp = await fetch(`${DATA_API_BASE}/resume-update`, { method: 'POST' })
      if (!resumeResp.ok) {
        const errData = await resumeResp.json().catch(() => ({}))
        throw new Error(errData.message || `续传启动失败: HTTP ${resumeResp.status}`)
      }
      const resumeResult = await resumeResp.json()
      if (!resumeResult.success) {
        throw new Error(resumeResult.message || '续传更新启动失败')
      }

      // 检查是否已经全部完成（无需再续传）
      if (resumeResult.data?.completed) {
        canResume.value = false
        setOutput(initialLines.join('\n') + '\n🎉 所有类别已更新完成', 'success')
        return null
      }

      return await pollProgressLoop({ initialLines, initialLastSeq })
    } catch (err) {
      setOutput(`续传更新失败: ${err.message}`, 'error')
      console.error('[FlyffApiUpdater] 续传更新失败:', err)
      return null
    } finally {
      isRunning.value = false
    }
  }

  // ==================== 一键全量更新（旧版保留） ====================

  /** 一键更新所有数据+图标的任务顺序 */
  const oneClickTasks = [
    { name: '获取怪物ID列表', fn: fetchMonsterIds },
    { name: '获取怪物详情', fn: fetchMonsterDetails },
    { name: '获取怪物图标', fn: fetchMonsterIcons },
    { name: '获取地图详情', fn: fetchMapDetails },
    { name: '获取物品详情', fn: fetchItemDetails },
    { name: '获取物品图标', fn: fetchItemIcons },
    { name: '获取NPC详情', fn: fetchNpcInfo },
    { name: '获取NPC图标', fn: fetchNpcIcons },
    { name: '获取装备套装', fn: fetchEquipmentSet },
    { name: '获取技能详情', fn: fetchSkillInfo },
    { name: '获取技能图标', fn: fetchSkillIcons },
    { name: '获取任务详情', fn: fetchQuestInfo },
    { name: '获取成就ID列表', fn: fetchAchievementIds },
    { name: '获取成就详情', fn: fetchAchievementDetails }
  ]

  /** 当前一键更新的步骤索引 */
  const oneClickStep = ref(-1)

  /** 一键更新进度描述 */
  const oneClickProgress = computed(() => {
    if (oneClickStep.value < 0) return ''
    return `步骤 ${oneClickStep.value + 1}/${oneClickTasks.length}: ${oneClickTasks[oneClickStep.value]?.name || ''}`
  })

  /**
   * 执行一键全量更新
   * @param {number} [fromStep=0] - 从第几步开始
   */
  async function runOneClickUpdate (fromStep = 0) {
    oneClickStep.value = fromStep
    isRunning.value = true
    abortFlag.value = false
    /* 启动一键更新时不清空失败ID汇总，保留给用户手动重试或查看 */
    /* 如果上一轮全部成功（无失败ID），则自动清空 */
    if (isFailedIdsMapEmpty()) {
      clearFailedIdsMap()
    }

    for (let i = fromStep; i < oneClickTasks.length; i++) {
      checkAbort()
      oneClickStep.value = i
      currentTask.value = `一键更新: ${oneClickTasks[i].name}`
      setOutput(`\n🔄 [${i + 1}/${oneClickTasks.length}] ${oneClickTasks[i].name}...`)

      try {
        await oneClickTasks[i].fn()
      } catch (err) {
        if (err.message === '任务已被用户中止') {
          setOutput(`一键更新已被中止，停在步骤 ${i + 1}: ${oneClickTasks[i].name}`, 'warning')
          break
        }
        setOutput(`步骤 ${i + 1} 执行失败: ${err.message}，继续下一步...`, 'error')
      }
    }

    if (!abortFlag.value) {
      setOutput('🎉 一键更新全部完成！', 'success')
    }
    oneClickStep.value = -1
    isRunning.value = false
    currentTask.value = ''
  }

  // ==================== 重试失败ID ====================

  /**
   * 重试 failedIdsMap 中的失败ID（items/monster/skill/achievement）
   * 调用后端 /api/data/retry-ids：后端按ID重新请求详情、写入对应JS数据文件并补下载图标，
   * 返回逐类别的成功/失败结果，前端据此重建 failedIdsMap（成功者移除、失败者保留）。
   * image 分类为图标下载失败，仍保留在 failedIdsMap 中，由图标下载流程处理。
   * @returns {Promise<{retried: number, succeeded: number, stillFailed: number}>} 重试结果统计
   */
  async function retryFailedIds () {
    isRunning.value = true
    currentTask.value = '重试失败ID'
    abortFlag.value = false
    setProgress(0, 1)

    const result = { retried: 0, succeeded: 0, stillFailed: 0 }

    try {
      const map = failedIdsMap.value
      /* 只重试数据类别；image 分类不在此处理（作为图标失败保留） */
      const payload = {
        item: map.items || [],
        monster: map.monster || [],
        skill: map.skill || [],
        achievement: map.achievement || []
      }
      const retryCount = payload.item.length + payload.monster.length + payload.skill.length + payload.achievement.length

      if (retryCount === 0) {
        setOutput('没有需要重试的失败ID（物品/怪物/技能/成就类别）', 'warning')
        setProgress(1, 1)
        return result
      }

      setOutput(`🔄 正在重试 ${retryCount} 个失败ID（重新拉取详情、写入数据文件并补下载图标）...`)

      const resp = await fetch(`${DATA_API_BASE}/retry-ids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.message || `HTTP ${resp.status}`)
      }
      const respData = await resp.json()
      if (!respData.success) throw new Error(respData.message || '重试失败')

      const data = respData.data || {}
      const catResults = data.results || []
      const nameMap = { item: '物品', monster: '怪物', skill: '技能', achievement: '成就' }

      /* 重建 failedIdsMap：数据类别以后端返回的失败ID为准，image 保持不变 */
      const nextFailedMap = {
        items: [],
        monster: [],
        skill: [],
        image: [...(failedIdsMap.value.image || [])],
        achievement: []
      }

      for (const cr of catResults) {
        const key = cr.category === 'item' ? 'items' : cr.category
        if (key in nextFailedMap) {
          nextFailedMap[key] = cr.failedIds || []
        }
        result.retried += cr.retried || 0
        result.succeeded += cr.succeeded || 0
        result.stillFailed += cr.failed || 0
        setOutput(`[${nameMap[cr.category] || cr.category}] 重试 ${cr.retried || 0} 个，成功 ${cr.succeeded || 0} 个，仍失败 ${cr.failed || 0} 个`, (cr.failed || 0) > 0 ? 'warning' : 'success')
      }

      failedIdsMap.value = nextFailedMap

      const imgInfo = (data.imageDownloaded > 0 || data.imageFailed > 0)
        ? `，补下载图标 ${data.imageDownloaded || 0} 张（失败 ${data.imageFailed || 0} 张）`
        : ''
      setOutput(`重试完成！重试 ${result.retried} 个，成功 ${result.succeeded} 个，仍失败 ${result.stillFailed} 个${imgInfo}`, result.stillFailed > 0 ? 'warning' : 'success')
      setProgress(1, 1)
    } catch (err) {
      if (err.message === '任务已被用户中止') {
        setOutput('重试任务已被中止', 'warning')
      } else {
        setOutput(`重试失败ID出错: ${err.message}`, 'error')
      }
    } finally {
      isRunning.value = false
      currentTask.value = ''
    }

    return result
  }

  /**
   * 中止当前任务
   * 中止后已获取的数据会保存到文件，支持断点续传
   */
  function stopCurrentTask () {
    abortFlag.value = true
    setOutput('⏹ 正在中止任务，已获取数据将保存...', 'warning')
    fetch(`${DATA_API_BASE}/abort-update`, { method: 'POST' }).catch(() => {})
  }

  // ==================== 网络状态检测 ====================

  /**
   * 远程API网络连通状态: null=未检测, true=在线, false=离线
   * @description 检测 flyff.com 远程API是否可达
   */
  const isNetworkOnline = ref(null)

  /**
   * 检测远程API网络连通性
   * 策略1：后端在线时，通过 /api/data/version-compare 检测（后端代理转发到 flyff.com）
   * 策略2：后端离线时，通过 Vite 代理直接请求 /api/proxy/monster 测试外部API可达性
   * 策略3：以上均失败时，使用 navigator.onLine + 轻量级外部请求兜底
   * @returns {Promise<boolean>} 网络是否在线
   */
  async function checkNetworkStatus () {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      /* 先尝试通过后端版本比对接口检测（最准确：后端代理→flyff.com API→返回远程版本） */
      const resp = await fetch(`${DATA_API_BASE}/version-compare`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (resp.ok) {
        const result = await resp.json()
        /* 远程版本存在说明网络通畅（后端成功访问了 flyff.com API） */
        isNetworkOnline.value = !!(result.data?.remoteVersion)
        return isNetworkOnline.value
      }

      /* 版本比对接口失败（如后端在线但flyff.com不可达），用轻量级API测试 */
      return await checkNetworkViaProxy()
    } catch {
      /* 版本比对请求失败（可能后端未启动），尝试直接测试外部API */
      return await checkNetworkViaProxy()
    }
  }

  /**
   * 通过 API 代理直接测试外部API连通性
   * 请求 /api/proxy/monster（获取怪物ID列表），成功则说明外部网络通畅
   * @returns {Promise<boolean>} 网络是否在线
   */
  async function checkNetworkViaProxy () {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(`${API_BASE}/monster`, {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      /* 200 且返回数组数据 = 外部API可达 */
      if (resp.ok) {
        const data = await resp.json()
        isNetworkOnline.value = Array.isArray(data) && data.length > 0
      } else {
        isNetworkOnline.value = false
      }
    } catch {
      /* 所有网络请求均失败，使用浏览器 navigator.onLine 兜底 */
      isNetworkOnline.value = navigator.onLine
    }
    return isNetworkOnline.value
  }

  // ==================== API 更新记录 ====================

  /** API更新记录列表 */
  const updateLogs = ref([])
  /** 更新记录总数 */
  const updateLogsTotal = ref(0)
  /** 是否正在加载更新记录 */
  const updateLogsLoading = ref(false)

  /**
   * 获取API更新记录列表
   * @param {number} [limit=20] - 每页数量
   * @param {number} [offset=0] - 偏移量
   * @returns {Promise<Object|null>} 更新记录数据
   */
  async function fetchUpdateLogs (limit = 20, offset = 0) {
    updateLogsLoading.value = true
    try {
      const resp = await fetch(`${DATA_API_BASE}/update-logs?limit=${limit}&offset=${offset}`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const result = await resp.json()
      if (!result.success) throw new Error(result.message || '获取更新记录失败')

      const data = result.data
      updateLogs.value = data.logs || []
      updateLogsTotal.value = data.totalCount || 0
      return data
    } catch (err) {
      console.error('[FlyffApiUpdater] 获取更新记录失败:', err)
      return null
    } finally {
      updateLogsLoading.value = false
    }
  }

  return {
    // 响应式状态
    outputText,
    outputType,
    progress,
    globalProgress,
    currentStepIndex,
    currentStepName,
    backendTotalSteps,
    isRunning,
    currentTask,
    oneClickStep,
    oneClickProgress,
    estimatedTime,
    canResume,

    // 版本与增量更新状态
    localVersion,
    remoteVersion,
    needsUpdate,
    versionCompareResult,
    updateStats,
    failedIdsMap,
    clearFailedIdsMap,
    retryFailedIds,

    // 一键增量更新
    runBatchUpdate,
    runResumeUpdate,

    // 怪物相关
    fetchMonsterIds,
    fetchMonsterDetails,
    fetchMonsterIcons,

    // 地图相关
    fetchMapDetails,

    // 物品相关
    fetchItemDetails,
    fetchItemIcons,
    validateItemIcons,

    // NPC 相关
    fetchNpcInfo,
    fetchNpcIcons,

    // 装备套装
    fetchEquipmentSet,

    // 技能相关
    fetchSkillInfo,
    fetchSkillIcons,

    // 任务相关
    fetchQuestInfo,

    // 成就相关
    fetchAchievementIds,
    fetchAchievementDetails,

    // 一键更新（旧版保留）
    runOneClickUpdate,
    oneClickTasks,

    // 控制
    stopCurrentTask,

    // API更新记录
    updateLogs,
    updateLogsTotal,
    updateLogsLoading,
    fetchUpdateLogs,

    // 网络状态检测
    isNetworkOnline,
    checkNetworkStatus
  }
}
