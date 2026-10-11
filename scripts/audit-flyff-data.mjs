/**
 * @file audit-flyff-data.mjs
 * @description FlyFF 游戏数据审计工具
 * @description 对比本地项目数据与 API 最新数据，输出差异报告
 * @description 不进行任何修改操作，仅用于检查数据完整性
 *
 * @usage
 *   # 审计所有数据
 *   node scripts/audit-flyff-data.mjs
 *
 *   # 审计特定类别
 *   node scripts/audit-flyff-data.mjs --only monster,item
 *
 *   # 自定义 API 基地址
 *   node scripts/audit-flyff-data.mjs --api-base http://localhost:7000
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_ROOT = resolve(__dirname, '..')
const SRC_DATA_DIR = resolve(PROJECT_ROOT, 'src/data')
const PUBLIC_PT_DIR = resolve(PROJECT_ROOT, 'public/pt')

/**
 * 各数据类别的审计配置
 */
const AUDIT_CATEGORIES = {
  monster: {
    name: '怪物',
    idListApi: '/api/proxy/monster',
    idListFile: resolve(PROJECT_ROOT, 'data/Monster_ID.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/monster_all_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'MONSTER_INFO.js'),
    imageDir: resolve(PUBLIC_PT_DIR, 'monster_icon'),
    getImageName: (item) => `${item.id}.png`
  },
  item: {
    name: '物品',
    idListFile: resolve(PROJECT_ROOT, 'data/item_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/item_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'ITEM_INFO.js'),
    imageDir: resolve(PUBLIC_PT_DIR, 'item_icon'),
    getImageName: (item) => `${item.id}.png`
  },
  map: {
    name: '地图',
    idListFile: resolve(PROJECT_ROOT, 'data/map_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/map_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'MAP_INFO.js'),
    imageDir: null
  },
  npc: {
    name: 'NPC',
    idListFile: resolve(PROJECT_ROOT, 'data/npc_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/npc_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'NPC_INFO.js'),
    imageDir: resolve(PUBLIC_PT_DIR, 'npc_icon'),
    getImageName: (item) => item.image ? item.image.toLowerCase().trim() : null
  },
  skill: {
    name: '技能',
    idListFile: resolve(PROJECT_ROOT, 'data/skill_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/skill_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'SKILL_INFO.js'),
    imageDir: resolve(PUBLIC_PT_DIR, 'skill_icon'),
    getImageName: (item) => item.icon || null
  },
  quest: {
    name: '任务',
    idListFile: resolve(PROJECT_ROOT, 'data/quest_id.json'),
    detailFile: resolve(PROJECT_ROOT, 'data/quest_info.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'QUEST_INFO.js'),
    imageDir: null
  },
  equipset: {
    name: '装备套装',
    idListFile: resolve(PROJECT_ROOT, 'data/EquipmentSet_ID.json'),
    targetJsFile: resolve(SRC_DATA_DIR, 'SQ_SET.js'),
    imageDir: null
  }
}

// ==================== 工具函数 ====================

/**
 * 延迟指定毫秒数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 读取 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Array|Object|null} 解析后的数据
 */
function readJsonFile (filePath) {
  try {
    if (!existsSync(filePath)) return null
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * 解析 JS 数据文件中的 ID 集合
 * @param {string} jsFilePath - JS 文件路径
 * @returns {Set<string>} ID 集合
 */
function parseJsIds (jsFilePath) {
  const ids = new Set()
  try {
    if (!existsSync(jsFilePath)) return ids
    const content = readFileSync(jsFilePath, 'utf-8')
    const keyRegex = /['"](\d+)['"]\s*:/g
    let match
    while ((match = keyRegex.exec(content)) !== null) {
      ids.add(match[1])
    }
  } catch {
    // 忽略
  }
  return ids
}

/**
 * 获取目录中的文件名集合
 * @param {string} dirPath - 目录路径
 * @returns {Set<string>} 文件名集合（小写）
 */
function getDirFiles (dirPath) {
  const files = new Set()
  try {
    if (!existsSync(dirPath)) return files
    for (const file of readdirSync(dirPath)) {
      files.add(file.toLowerCase())
    }
  } catch {
    // 忽略
  }
  return files
}

/**
 * 解析命令行参数
 * @returns {Object} 参数对象
 */
function parseArgs () {
  const args = process.argv.slice(2)
  const result = {
    onlyCategories: null,
    apiBase: 'http://localhost:7000'
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--only': {
        const categories = args[++i]?.split(',').map(s => s.trim().toLowerCase())
        if (categories) result.onlyCategories = categories
        break
      }
      case '--api-base': {
        const base = args[++i]
        if (base) result.apiBase = base.replace(/\/$/, '')
        break
      }
      case '--help':
      case '-h':
        console.log(`
FlyFF 数据审计工具

用法: node scripts/audit-flyff-data.mjs [选项]

选项:
  --only <类别>         仅审计指定类别，逗号分隔
                        可选: monster, item, map, npc, skill, quest, equipset
  --api-base <URL>      自定义 API 基地址（默认 http://localhost:7000）
  -h, --help            显示帮助信息
        `)
        process.exit(0)
    }
  }

  return result
}

// ==================== 审计逻辑 ====================

/**
 * 审计单个数据类别
 * @param {string} key - 类别键名
 * @param {Object} category - 类别配置
 * @param {string} apiBase - API 基地址
 * @returns {Promise<Object>} 审计结果
 */
async function auditCategory (key, category, apiBase) {
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`🔍 审计: ${category.name} (${key})`)
  console.log('─'.repeat(50))

  const result = {
    category: category.name,
    apiIdCount: 0,
    jsIdCount: 0,
    missingInJs: [],
    missingImages: 0,
    totalImagesNeeded: 0,
    existingImages: 0
  }

  // 1. 获取 API 端的 ID 列表
  let apiIds = []
  if (category.idListApi) {
    try {
      const response = await fetch(`${apiBase}${category.idListApi}`)
      if (response.ok) {
        const data = await response.json()
        apiIds = Array.isArray(data) ? data : Object.keys(data).map(Number)
      }
    } catch {
      console.warn('  ⚠️ 无法从 API 获取 ID 列表')
    }
  }

  // 备用：从本地 JSON 文件读取
  if (apiIds.length === 0 && category.idListFile) {
    const localIds = readJsonFile(category.idListFile)
    if (localIds) {
      apiIds = Array.isArray(localIds) ? localIds : Object.keys(localIds).map(Number)
    }
  }

  // 从详情数据中提取 ID
  if (apiIds.length === 0 && category.detailFile) {
    const detailData = readJsonFile(category.detailFile)
    if (detailData && Array.isArray(detailData)) {
      apiIds = detailData.map(item => item.id)
    }
  }

  result.apiIdCount = apiIds.length

  // 2. 解析本地 JS 文件的 ID 集合
  const jsIds = parseJsIds(category.targetJsFile)
  result.jsIdCount = jsIds.size

  // 3. 比对差异
  const apiIdSet = new Set(apiIds.map(String))
  const missingInJs = []
  for (const id of apiIdSet) {
    if (!jsIds.has(id)) {
      missingInJs.push(id)
    }
  }
  result.missingInJs = missingInJs

  // 4. 检查图片完整性
  if (category.imageDir) {
    const existingImages = getDirFiles(category.imageDir)
    result.existingImages = existingImages.size

    // 从详情数据或 JS 文件中提取需要的图片列表
    let detailData = []
    if (category.detailFile) {
      const data = readJsonFile(category.detailFile)
      if (data && Array.isArray(data)) detailData = data
    }

    if (detailData.length > 0 && category.getImageName) {
      let missingImgCount = 0
      const seenIcons = new Set()
      let totalNeeded = 0

      for (const item of detailData) {
        const imgName = category.getImageName(item)
        if (!imgName) continue

        // 去重
        if (seenIcons.has(imgName)) continue
        seenIcons.add(imgName)
        totalNeeded++

        if (!existingImages.has(imgName.toLowerCase())) {
          missingImgCount++
        }
      }

      result.totalImagesNeeded = totalNeeded
      result.missingImages = missingImgCount
    }
  }

  // 输出结果
  const dataStatus = missingInJs.length === 0 ? '✅ 完整' : `❌ 缺少 ${missingInJs.length} 条`
  const imgStatus = !category.imageDir
    ? '⏭️ 无图片'
    : result.missingImages === 0
      ? '✅ 完整'
      : `❌ 缺少 ${result.missingImages} 张`

  console.log(`  API ID 总数: ${result.apiIdCount}`)
  console.log(`  本地 JS 数据: ${result.jsIdCount} 条`)
  console.log(`  数据完整性: ${dataStatus}`)
  if (missingInJs.length > 0 && missingInJs.length <= 20) {
    console.log(`  缺失 ID: ${missingInJs.join(', ')}`)
  } else if (missingInJs.length > 20) {
    console.log(`  缺失 ID（前20个）: ${missingInJs.slice(0, 20).join(', ')}...`)
  }

  if (category.imageDir) {
    console.log(`  图片目录: 已有 ${result.existingImages} 张，需要 ${result.totalImagesNeeded} 张`)
    console.log(`  图片完整性: ${imgStatus}`)
  }

  return result
}

// ==================== 主函数 ====================

async function main () {
  const options = parseArgs()

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║            FlyFF 游戏数据审计工具 v1.0.0                 ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()
  console.log(`API 基地址: ${options.apiBase}`)
  console.log()

  const categoriesToAudit = options.onlyCategories
    ? Object.entries(AUDIT_CATEGORIES).filter(([key]) => options.onlyCategories.includes(key))
    : Object.entries(AUDIT_CATEGORIES)

  const results = []

  for (const [key, category] of categoriesToAudit) {
    try {
      const result = await auditCategory(key, category, options.apiBase)
      results.push(result)
    } catch (err) {
      console.error(`❌ 审计 ${category.name} 时发生错误: ${err.message}`)
      results.push({ category: category.name, error: err.message })
    }
  }

  // 汇总
  console.log('\n' + '='.repeat(60))
  console.log('📊 审计汇总')
  console.log('='.repeat(60))

  let totalMissingData = 0
  let totalMissingImages = 0

  for (const r of results) {
    if (r.error) {
      console.log(`  ❌ ${r.category}: 审计失败 - ${r.error}`)
    } else {
      const dataStatus = r.missingInJs.length === 0 ? '✅' : '❌'
      const imgStatus = !r.missingImages ? '✅' : '❌'
      console.log(`  ${dataStatus}${imgStatus} ${r.category}: 数据(${r.apiIdCount}/${r.jsIdCount}) 图片(${r.missingImages}缺失)`)
      totalMissingData += r.missingInJs.length
      totalMissingImages += r.missingImages || 0
    }
  }

  console.log(`\n  总计缺失数据: ${totalMissingData} 条`)
  console.log(`  总计缺失图片: ${totalMissingImages} 张`)

  if (totalMissingData > 0 || totalMissingImages > 0) {
    console.log('\n💡 提示：运行以下命令进行更新：')
    console.log('   node scripts/update-flyff-data.mjs')
  } else {
    console.log('\n✅ 所有数据完整，无需更新！')
  }
}

main().catch(err => {
  console.error('❌ 发生未捕获的错误:', err)
  process.exit(1)
})
