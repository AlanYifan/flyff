/**
 * 合并批量翻译到 translations.json 并应用到 QUEST_INFO.js
 * 使用方式: node scripts/merge_and_apply.cjs <batch_file>
 */
const fs = require('fs')

const batchFile = process.argv[2]
if (!batchFile) {
  console.error('请指定批量翻译文件，如: node scripts/merge_and_apply.cjs scripts/batch_001.json')
  process.exit(1)
}

// 读取现有翻译
let translations = {}
try {
  translations = JSON.parse(fs.readFileSync('scripts/translations.json', 'utf8'))
} catch (e) {
  // 文件不存在则从空开始
}

// 读取并合并新翻译
const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'))
const beforeCount = Object.keys(translations).length
Object.assign(translations, batch)
const afterCount = Object.keys(translations).length
console.log(`合并: ${afterCount - beforeCount} 条新翻译 (总计 ${afterCount} 条)`)

// 写回 translations.json
fs.writeFileSync('scripts/translations.json', JSON.stringify(translations, null, 2), 'utf8')

// 归一化函数
function normalize(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, '...')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\\'/g, "'")
}

// 构建归一化后的翻译映射
const normTranslations = {}
for (const [key, value] of Object.entries(translations)) {
  normTranslations[normalize(key)] = value
}

// 读取 QUEST_INFO.js
const filePath = 'src/data/QUEST_INFO.js'
let content = fs.readFileSync(filePath, 'utf8')
const hasCJK = (text) => /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)

const lines = content.split('\n')
const cnsLineRegex = /^(\s*)'cns':\s*'((?:[^'\\]|\\.)*)'/

let replacedCount = 0
let notFoundCount = 0
const notFoundTexts = new Set()

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(cnsLineRegex)
  if (!match) continue
  const indent = match[1]
  const cnsText = match[2]
  if (hasCJK(cnsText) || cnsText.trim().length === 0) continue

  const normalizedKey = normalize(cnsText)
  if (normTranslations[normalizedKey]) {
    lines[i] = `${indent}'cns': '${normTranslations[normalizedKey]}'`
    replacedCount++
  } else {
    notFoundCount++
    notFoundTexts.add(cnsText)
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
console.log(`已替换: ${replacedCount} 条`)
console.log(`未找到翻译: ${notFoundCount} 条 (独特文本: ${notFoundTexts.size} 条)`)

if (notFoundTexts.size > 0) {
  fs.writeFileSync('scripts/remaining_translation.json', JSON.stringify([...notFoundTexts].sort(), null, 2), 'utf8')
}
