/**
 * @file update-flyff-data.mjs
 * @description FlyFF 游戏数据一键更新工具
 * @description 融合 get_Flyff_API.html 中所有 API 请求功能，实现：
 *   1. 从 flyff.com API 拉取最新数据（怪物/物品/地图/NPC/技能/任务/套装）
 *   2. 与项目现有 src/data/*.js 数据进行比对，查漏补缺
 *   3. 自动生成/更新 src/data/ 下的 JS 数据文件
 *   4. 下载缺失的图标图片到 public/pt/ 对应目录
 *
 * @usage
 *   # 一键更新所有数据+图片
 *   node scripts/update-flyff-data.mjs
 *
 *   # 仅更新数据（不下载图片）
 *   node scripts/update-flyff-data.mjs --data-only
 *
 *   # 仅下载缺失图片
 *   node scripts/update-flyff-data.mjs --images-only
 *
 *   # 仅更新特定类别
 *   node scripts/update-flyff-data.mjs --only monster,item
 *
 *   # 强制全量更新（不进行增量比对）
 *   node scripts/update-flyff-data.mjs --force
 *
 *   # 自定义 API 基地址（默认 http://localhost:7000）
 *   node scripts/update-flyff-data.mjs --api-base http://localhost:7000
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_ROOT = resolve(__dirname, '..')
const SRC_DATA_DIR = resolve(PROJECT_ROOT, 'src/data')
const PUBLIC_PT_DIR = resolve(PROJECT_ROOT, 'public/pt')

// ==================== 配置 ====================

/**
 * API 请求速率控制配置
 * 每分钟最多 290 次请求，每次间隔至少 207ms
 */
const RATE_LIMIT = {
  maxRequestsPerMinute: 290,
  baseDelayMs: 207
}

/**
 * 各数据类别的完整配置
 * 每个类别定义了：API 端点、ID 列表获取方式、数据获取方式、目标文件路径、图片下载配置
 */
const DATA_CATEGORIES = {
  monster: {
    name: '怪物',
    /** 获取所有怪物 ID 列表 */
    idListApi: '/api/proxy/monster',
    /** 根据单个 ID 获取详情 */
    detailApi: (id) => `/api/proxy/monster/${id}`,
    /** ID 列表本地 JSON 备用（优先从 API 获取） */
    idListFile: resolve(PROJECT_ROOT, 'data/Monster_ID.json'),
    /** 已有详情数据本地 JSON 备用 */
    detailFile: resolve(PROJECT_ROOT, 'data/monster_all_info.json'),
    /** 项目中的目标 JS 数据文件 */
    targetJsFile: resolve(SRC_DATA_DIR, 'MONSTER_INFO.js'),
    /** JS 文件中的导出变量名 */
    exportName: 'MONSTER_INFO',
    /** 图片配置 */
    image: {
      dir: resolve(PUBLIC_PT_DIR, 'monster_icon'),
      /** 从详情数据中提取图标标识 */
      getIconId: (item) => item.icon,
      /** 图片下载 API（传入 icon 标识） */
      downloadApi: (icon) => `/api/proxy/image/monster/${icon}`,
      /** 生成目标文件名 */
      getFileName: (item) => `${item.id}.png`
    }
  },
  item: {
    name: '物品',
    idListFile: resolve(PROJECT_ROOT, 'data/item_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/item_info.json'),
    detailApi: (id) => `/api/proxy/item/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'ITEM_INFO.js'),
    exportName: 'ITEM_INFO',
    image: {
      dir: resolve(PUBLIC_PT_DIR, 'item_icon'),
      getIconId: (item) => item.icon,
      downloadApi: (icon) => `/api/proxy/image/item/${icon}`,
      getFileName: (item) => `${item.id}.png`
    }
  },
  map: {
    name: '地图',
    idListFile: resolve(PROJECT_ROOT, 'data/map_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/map_info.json'),
    detailApi: (id) => `/api/proxy/world/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'MAP_INFO.js'),
    exportName: 'MAP_INFO',
    image: null
  },
  npc: {
    name: 'NPC',
    idListFile: resolve(PROJECT_ROOT, 'data/npc_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/npc_info.json'),
    detailApi: (id) => `/api/proxy/npc/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'NPC_INFO.js'),
    exportName: 'NPC_INFO',
    image: {
      dir: resolve(PUBLIC_PT_DIR, 'npc_icon'),
      getIconId: (item) => item.image,
      downloadApi: (icon) => `/api/proxy/image/npc/${icon}`,
      getFileName: (item) => item.image ? item.image.toLowerCase().trim() : null
    }
  },
  skill: {
    name: '技能',
    idListFile: resolve(PROJECT_ROOT, 'data/skill_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/skill_info.json'),
    detailApi: (id) => `/api/proxy/skill/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'SKILL_INFO.js'),
    exportName: 'SKILL_INFO',
    image: {
      dir: resolve(PUBLIC_PT_DIR, 'skill_icon'),
      getIconId: (item) => item.icon,
      downloadApi: (icon) => `/api/proxy/image/skill/colored/${icon}`,
      getFileName: (item) => item.icon
    }
  },
  quest: {
    name: '任务',
    idListFile: resolve(PROJECT_ROOT, 'data/quest_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/quest_info.json'),
    detailApi: (id) => `/api/proxy/quest/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'QUEST_INFO.js'),
    exportName: 'QUEST_INFO',
    image: null
  },
  equipset: {
    name: '装备套装',
    idListFile: resolve(PROJECT_ROOT, 'data/EquipmentSet_ID.json'),
    detailApi: (id) => `/api/proxy/equipset/${id}`,
    targetJsFile: resolve(SRC_DATA_DIR, 'SQ_SET.js'),
    exportName: 'SQ_SET',
    image: null
  }
}

// ==================== 工具函数 ====================

/**
 * 带速率控制的 fetch 请求
 * @param {string} url - 请求 URL
 * @param {string} apiBase - API 基地址
 * @returns {Promise<Response>} fetch 响应
 */
async function rateLimitedFetch (url, apiBase) {
  const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`
  const response = await fetch(fullUrl)
  return response
}

/**
 * 延迟指定毫秒数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 速率控制管理器
 * 跟踪请求计数，确保不超过每分钟 290 次的限制
 */
class RateLimiter {
  constructor () {
    /** @type {number} 当前窗口内已发送的请求数 */
    this.requestCount = 0
    /** @type {number} 当前窗口开始时间 */
    this.windowStart = Date.now()
  }

  /**
   * 等待直到可以发送下一个请求
   * @returns {Promise<void>}
   */
  async wait () {
    this.requestCount++
    const elapsed = Date.now() - this.windowStart

    if (this.requestCount >= RATE_LIMIT.maxRequestsPerMinute && elapsed < 60000) {
      const remainingTime = 60000 - elapsed
      console.log(`  ⏳ 速率限制：已发送 ${this.requestCount} 次请求，等待 ${Math.ceil(remainingTime / 1000)}s...`)
      await sleep(remainingTime)
      this.requestCount = 0
      this.windowStart = Date.now()
    } else {
      await sleep(RATE_LIMIT.baseDelayMs)
    }
  }
}

/**
 * 解析命令行参数
 * @returns {Object} 解析后的参数对象
 */
function parseArgs () {
  const args = process.argv.slice(2)
  const result = {
    dataOnly: false,
    imagesOnly: false,
    onlyCategories: null,
    force: false,
    apiBase: 'http://localhost:7000'
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--data-only':
        result.dataOnly = true
        break
      case '--images-only':
        result.imagesOnly = true
        break
      case '--only': {
        const categories = args[++i]?.split(',').map(s => s.trim().toLowerCase())
        if (categories) {
          result.onlyCategories = categories
        }
        break
      }
      case '--force':
        result.force = true
        break
      case '--api-base': {
        const base = args[++i]
        if (base) {
          result.apiBase = base.replace(/\/$/, '')
        }
        break
      }
      case '--help':
      case '-h':
        console.log(`
FlyFF 数据一键更新工具

用法: node scripts/update-flyff-data.mjs [选项]

选项:
  --data-only           仅更新数据文件（不下载图片）
  --images-only         仅下载缺失图片（不更新数据）
  --only <类别>         仅更新指定类别，逗号分隔
                        可选: monster, item, map, npc, skill, quest, equipset
  --force               强制全量更新（不进行增量比对）
  --api-base <URL>      自定义 API 基地址（默认 http://localhost:7000）
  -h, --help            显示帮助信息

示例:
  node scripts/update-flyff-data.mjs                     # 一键更新全部
  node scripts/update-flyff-data.mjs --data-only         # 仅更新数据
  node scripts/update-flyff-data.mjs --only monster,item # 仅更新怪物和物品
  node scripts/update-flyff-data.mjs --force             # 强制全量更新
        `)
        process.exit(0)
        break
    }
  }

  return result
}

/**
 * 读取 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Array|Object|null} 解析后的数据，失败返回 null
 */
function readJsonFile (filePath) {
  try {
    if (!existsSync(filePath)) return null
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.warn(`  ⚠️ 读取 JSON 文件失败: ${filePath} - ${err.message}`)
    return null
  }
}

/**
 * 解析现有的 JS 数据文件，提取已有数据的 ID 集合
 * @param {string} jsFilePath - JS 数据文件路径
 * @returns {Set<string>} 已有数据的 ID 集合
 */
function parseExistingJsIds (jsFilePath) {
  const ids = new Set()
  try {
    if (!existsSync(jsFilePath)) return ids
    const content = readFileSync(jsFilePath, 'utf-8')
    // 匹配 '123': { 或 "123": { 格式的键
    const keyRegex = /['"](\d+)['"]\s*:/g
    let match
    while ((match = keyRegex.exec(content)) !== null) {
      ids.add(match[1])
    }
  } catch (err) {
    console.warn(`  ⚠️ 解析 JS 文件失败: ${jsFilePath} - ${err.message}`)
  }
  return ids
}

/**
 * 获取本地目录中已有的图片文件名集合
 * @param {string} dirPath - 目录路径
 * @returns {Set<string>} 已有的图片文件名集合（小写）
 */
function getExistingImages (dirPath) {
  const images = new Set()
  try {
    if (!existsSync(dirPath)) return images
    const files = readdirSync(dirPath)
    for (const file of files) {
      images.add(file.toLowerCase())
    }
  } catch (err) {
    console.warn(`  ⚠️ 读取目录失败: ${dirPath} - ${err.message}`)
  }
  return images
}

/**
 * 生成 JS 数据文件内容
 * @param {Object} dataMap - 以 ID 为键的数据对象
 * @param {string} exportName - 导出变量名
 * @returns {string} JS 文件内容
 */
function generateJsContent (dataMap, exportName) {
  // 使用紧凑但可读的格式
  const entries = Object.entries(dataMap)
  let content = `export const ${exportName} = {\n`

  for (const [id, item] of entries) {
    const itemStr = JSON.stringify(item, null, 2)
    // 缩进每个条目
    const indentedItem = itemStr
      .split('\n')
      .map((line, i) => (i === 0 ? line : '  ' + line))
      .join('\n')
    content += `  '${id}': ${indentedItem},\n`
  }

  content += '}\n'
  return content
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
function ensureDir (dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

// ==================== 核心功能 ====================

/**
 * 获取指定类别的 ID 列表
 * @param {Object} category - 类别配置
 * @param {string} apiBase - API 基地址
 * @param {RateLimiter} limiter - 速率限制器
 * @returns {Promise<Array<number|string>>} ID 列表
 */
async function fetchIdList (category, apiBase, limiter) {
  console.log(`  📋 获取 ${category.name} ID 列表...`)

  // 优先从 API 获取
  if (category.idListApi) {
    try {
      await limiter.wait()
      const response = await rateLimitedFetch(category.idListApi, apiBase)
      if (response.ok) {
        const ids = await response.json()
        console.log(`  ✅ 从 API 获取到 ${Array.isArray(ids) ? ids.length : Object.keys(ids).length} 个 ${category.name} ID`)
        return Array.isArray(ids) ? ids : Object.keys(ids).map(Number)
      }
    } catch (err) {
      console.warn(`  ⚠️ 从 API 获取 ID 列表失败: ${err.message}，尝试从本地文件读取...`)
    }
  }

  // 备用：从本地 JSON 文件读取
  if (category.idListFile) {
    const localIds = readJsonFile(category.idListFile)
    if (localIds) {
      const idArray = Array.isArray(localIds) ? localIds : Object.keys(localIds).map(Number)
      console.log(`  ✅ 从本地文件读取到 ${idArray.length} 个 ${category.name} ID`)
      return idArray
    }
  }

  // 最后：从已有详情数据中提取 ID
  if (category.detailFile) {
    const detailData = readJsonFile(category.detailFile)
    if (detailData && Array.isArray(detailData)) {
      const ids = detailData.map(item => item.id)
      console.log(`  ✅ 从详情数据中提取到 ${ids.length} 个 ${category.name} ID`)
      return ids
    }
  }

  console.error(`  ❌ 无法获取 ${category.name} ID 列表，跳过该类别`)
  return []
}

/**
 * 批量获取详情数据（增量更新模式）
 * @param {Object} category - 类别配置
 * @param {Array} ids - 需要获取的 ID 列表
 * @param {Set<string>} existingIds - 已有数据的 ID 集合
 * @param {string} apiBase - API 基地址
 * @param {RateLimiter} limiter - 速率限制器
 * @param {boolean} force - 是否强制全量更新
 * @returns {Promise<Array>} 所有详情数据
 */
async function fetchDetails (category, ids, existingIds, apiBase, limiter, force) {
  // 确定需要请求的 ID
  let idsToFetch
  if (force) {
    idsToFetch = ids
    console.log(`  🔄 强制全量更新，需要获取 ${idsToFetch.length} 条数据`)
  } else {
    idsToFetch = ids.filter(id => !existingIds.has(String(id)))
    console.log(`  🔍 增量比对：总计 ${ids.length} 条，已有 ${existingIds.size} 条，需新增 ${idsToFetch.length} 条`)
  }

  // 如果没有需要新增的数据，先尝试从本地文件加载全部数据
  if (idsToFetch.length === 0) {
    console.log(`  ✅ ${category.name} 数据已是最新，无需更新`)
    // 尝试从本地详情文件加载
    if (category.detailFile) {
      const localData = readJsonFile(category.detailFile)
      if (localData && Array.isArray(localData)) {
        return localData
      }
    }
    // 从现有的 JS 文件解析（返回空，表示不需要更新文件）
    return []
  }

  // 从 API 批量获取
  const allDetails = []
  const failedIds = []
  let currentIndex = 0

  // 先加载已有数据（非强制模式）
  if (!force && category.detailFile) {
    const localData = readJsonFile(category.detailFile)
    if (localData && Array.isArray(localData)) {
      allDetails.push(...localData)
    }
  }

  console.log(`  📡 开始请求 ${idsToFetch.length} 条 ${category.name} 详情数据...`)

  while (currentIndex < idsToFetch.length) {
    const currentId = idsToFetch[currentIndex]
    currentIndex++

    try {
      await limiter.wait()
      const response = await rateLimitedFetch(category.detailApi(currentId), apiBase)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      allDetails.push(data)

      // 进度日志（每50条输出一次）
      if (currentIndex % 50 === 0 || currentIndex === idsToFetch.length) {
        const name = data.name?.cns || data.name?.en || '未知'
        console.log(`  📊 [${currentIndex}/${idsToFetch.length}] 获取 ${category.name}: ${name} (ID:${currentId})`)
      }
    } catch (err) {
      failedIds.push(currentId)
      if (currentIndex % 50 === 0) {
        console.warn(`  ❌ [${currentIndex}/${idsToFetch.length}] 获取 ${category.name} ID:${currentId} 失败: ${err.message}`)
      }
    }
  }

  if (failedIds.length > 0) {
    console.warn(`  ⚠️ ${category.name} 有 ${failedIds.length} 条数据获取失败，失败ID: ${failedIds.slice(0, 20).join(',')}${failedIds.length > 20 ? '...' : ''}`)
  }

  console.log(`  ✅ ${category.name} 详情获取完成：成功 ${allDetails.length} 条，失败 ${failedIds.length} 条`)
  return allDetails
}

/**
 * 将详情数据写入 JS 文件
 * @param {Array} details - 详情数据数组
 * @param {Object} category - 类别配置
 * @param {boolean} force - 是否强制全量更新
 * @returns {Promise<boolean>} 是否有更新
 */
async function writeJsDataFile (details, category, force) {
  if (details.length === 0 && !force) {
    console.log(`  ⏭️ ${category.name} 无新数据，跳过文件更新`)
    return false
  }

  // 如果非强制模式且有现有文件，需要合并
  let dataMap = {}

  if (!force && existsSync(category.targetJsFile)) {
    // 从现有文件中读取已有数据
    try {
      // 动态导入现有的 JS 数据
      const module = await import(`file://${category.targetJsFile}`)
      const existing = module[category.exportName]
      if (existing) {
        dataMap = { ...existing }
      }
    } catch {
      // 解析失败，从零开始
    }
  }

  // 合并新数据
  for (const item of details) {
    if (item && item.id !== undefined) {
      dataMap[String(item.id)] = item
    }
  }

  console.log(`  💾 生成 ${category.targetJsFile} (${Object.keys(dataMap).length} 条数据)...`)

  const content = generateJsContent(dataMap, category.exportName)
  writeFileSync(category.targetJsFile, content, 'utf-8')

  console.log(`  ✅ ${category.name} 数据文件已更新`)
  return true
}

/**
 * 下载缺失的图片
 * @param {Array} details - 详情数据数组
 * @param {Object} category - 类别配置
 * @param {string} apiBase - API 基地址
 * @param {RateLimiter} limiter - 速率限制器
 * @returns {Promise<{downloaded: number, skipped: number, failed: number}>} 下载统计
 */
async function downloadMissingImages (details, category, apiBase, limiter) {
  if (!category.image) {
    return { downloaded: 0, skipped: 0, failed: 0 }
  }

  const imgConfig = category.image
  ensureDir(imgConfig.dir)
  const existingImages = getExistingImages(imgConfig.dir)

  // 构建需要下载的图片列表（去重）
  const downloadList = []
  const seenIcons = new Set()

  for (const item of details) {
    const iconId = imgConfig.getIconId(item)
    if (!iconId) continue

    const fileName = imgConfig.getFileName(item)
    if (!fileName) continue

    // 去重检查
    if (seenIcons.has(iconId)) continue
    seenIcons.add(iconId)

    // 已存在检查
    if (existingImages.has(fileName.toLowerCase())) continue

    downloadList.push({ item, iconId, fileName })
  }

  if (downloadList.length === 0) {
    console.log(`  ✅ ${category.name} 图片已是最新，无需下载`)
    return { downloaded: 0, skipped: 0, failed: 0 }
  }

  console.log(`  🖼️ 需要下载 ${downloadList.length} 张 ${category.name} 图片...`)

  let downloaded = 0
  let failed = 0

  for (let i = 0; i < downloadList.length; i++) {
    const { item, iconId, fileName } = downloadList[i]

    try {
      await limiter.wait()
      const response = await rateLimitedFetch(imgConfig.downloadApi(iconId), apiBase)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filePath = resolve(imgConfig.dir, fileName)
      writeFileSync(filePath, buffer)

      downloaded++

      // 进度日志
      if ((i + 1) % 50 === 0 || (i + 1) === downloadList.length) {
        console.log(`  📊 [${i + 1}/${downloadList.length}] 下载 ${category.name} 图片: ${fileName}`)
      }
    } catch (err) {
      failed++
      if (failed <= 10) {
        console.warn(`  ❌ 下载 ${category.name} 图片失败: ${fileName} - ${err.message}`)
      }
    }
  }

  console.log(`  ✅ ${category.name} 图片下载完成：成功 ${downloaded}，失败 ${failed}`)
  return { downloaded, skipped: downloadList.length - downloaded - failed, failed }
}

// ==================== 主流程 ====================

/**
 * 更新单个数据类别
 * @param {string} key - 类别键名
 * @param {Object} category - 类别配置
 * @param {Object} options - 运行选项
 * @param {RateLimiter} limiter - 速率限制器
 * @returns {Promise<Object>} 更新结果统计
 */
async function updateCategory (key, category, options, limiter) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📦 更新类别: ${category.name} (${key})`)
  console.log('='.repeat(60))

  const stats = {
    category: category.name,
    idsTotal: 0,
    dataNew: 0,
    dataUpdated: false,
    imagesDownloaded: 0,
    imagesSkipped: 0,
    imagesFailed: 0
  }

  // 1. 获取 ID 列表
  const ids = await fetchIdList(category, options.apiBase, limiter)
  stats.idsTotal = ids.length

  if (ids.length === 0) {
    console.log(`  ⏭️ ${category.name} ID 列表为空，跳过`)
    return stats
  }

  let details = []

  // 2. 更新数据（如果需要）
  if (!options.imagesOnly) {
    // 获取现有数据 ID 集合（增量比对）
    const existingIds = options.force ? new Set() : parseExistingJsIds(category.targetJsFile)

    // 批量获取详情
    details = await fetchDetails(category, ids, existingIds, options.apiBase, limiter, options.force)
    stats.dataNew = options.force ? details.length : details.length - (details.length - ids.length + existingIds.size)

    // 写入 JS 文件
    if (details.length > 0) {
      const updated = await writeJsDataFile(details, category, options.force)
      stats.dataUpdated = updated
    }
  } else {
    // 仅图片模式：从现有数据文件加载
    if (category.detailFile) {
      details = readJsonFile(category.detailFile) || []
    }
    if (details.length === 0 && existsSync(category.targetJsFile)) {
      // 尝试从 JS 文件动态导入
      try {
        const module = await import(`file://${category.targetJsFile}`)
        const data = module[category.exportName]
        if (data) {
          details = Object.values(data)
        }
      } catch {
        // 导入失败
      }
    }
  }

  // 3. 下载图片（如果需要）
  if (!options.dataOnly && category.image && details.length > 0) {
    const imgStats = await downloadMissingImages(details, category, options.apiBase, limiter)
    stats.imagesDownloaded = imgStats.downloaded
    stats.imagesSkipped = imgStats.skipped
    stats.imagesFailed = imgStats.failed
  }

  return stats
}

/**
 * 主函数
 */
async function main () {
  const startTime = Date.now()
  const options = parseArgs()

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║          FlyFF 游戏数据一键更新工具 v1.0.0               ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`API 基地址: ${options.apiBase}`)
  console.log(`模式: ${options.dataOnly ? '仅数据' : options.imagesOnly ? '仅图片' : '数据+图片'}`)
  console.log(`更新策略: ${options.force ? '全量更新' : '增量比对'}`)

  // 确定要更新的类别
  const categoriesToUpdate = options.onlyCategories
    ? Object.entries(DATA_CATEGORIES).filter(([key]) => options.onlyCategories.includes(key))
    : Object.entries(DATA_CATEGORIES)

  if (categoriesToUpdate.length === 0) {
    console.error('❌ 没有匹配的数据类别，请检查 --only 参数')
    process.exit(1)
  }

  console.log(`更新类别: ${categoriesToUpdate.map(([, cat]) => cat.name).join(', ')}`)
  console.log()

  // 检查 API 连通性
  console.log('🔍 检查 API 连通性...')
  try {
    const response = await fetch(options.apiBase)
    if (!response.ok) {
      console.warn(`⚠️ API 响应异常: HTTP ${response.status}`)
    } else {
      console.log('✅ API 连接正常')
    }
  } catch (err) {
    console.warn(`⚠️ 无法连接到 API (${options.apiBase}): ${err.message}`)
    console.warn('   将尝试从本地 JSON 文件加载数据...')
  }

  const limiter = new RateLimiter()
  const allStats = []

  // 逐个更新类别
  for (const [key, category] of categoriesToUpdate) {
    try {
      const stats = await updateCategory(key, category, options, limiter)
      allStats.push(stats)
    } catch (err) {
      console.error(`❌ 更新 ${category.name} 时发生错误: ${err.message}`)
      allStats.push({
        category: category.name,
        error: err.message
      })
    }
  }

  // 输出汇总报告
  const elapsed = Date.now() - startTime
  console.log('\n' + '='.repeat(60))
  console.log('📊 更新汇总报告')
  console.log('='.repeat(60))

  for (const stats of allStats) {
    if (stats.error) {
      console.log(`  ❌ ${stats.category}: 失败 - ${stats.error}`)
    } else {
      const dataStatus = stats.dataUpdated ? '✅ 已更新' : '⏭️ 无变化'
      const imgStatus = stats.imagesDownloaded > 0
        ? `🖼️ 下载${stats.imagesDownloaded}张`
        : '🖼️ 无变化'
      console.log(`  ${stats.category}: ID总数=${stats.idsTotal} | 数据=${dataStatus} | 图片=${imgStatus}`)
    }
  }

  console.log(`\n⏱️ 总耗时: ${(elapsed / 1000).toFixed(1)}s`)
  console.log('\n✨ 更新完成！')
}

main().catch(err => {
  console.error('❌ 发生未捕获的错误:', err)
  process.exit(1)
})
