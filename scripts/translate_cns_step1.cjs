/**
 * 翻译 QUEST_INFO.js 中所有英文 cns 字段
 * 策略：
 * 1. 如果对应 tw 字段是中文（繁体），转换为简体后替换 cns
 * 2. 如果 tw 也是英文，收集后输出供手动翻译
 */
const fs = require('fs')
const OpenCC = require('opencc-js')

// 繁体转简体转换器
const converter = OpenCC.Converter({ from: 'tw', to: 'cn' })

const filePath = 'src/data/QUEST_INFO.js'
let content = fs.readFileSync(filePath, 'utf8')

// 正则匹配每个语言条目对象（包含 'cns' 和 'tw' 的对象）
// 匹配模式：从 { 开始到 } 结束，中间包含 cns 和 tw 字段
// 由于嵌套结构，我们需要匹配同一层级内的 cns 和 tw

// 策略：逐行扫描，找到 'cns': '...' 行
// 如果 cns 是英文，在同一对象块内查找 'tw': '...' 行
// 如果 tw 是中文，转换并替换 cns

const lines = content.split('\n')
const cnsLineRegex = /^(\s*)'cns':\s*'((?:[^'\\]|\\.)*)'/
const twLineRegex = /^(\s*)'tw':\s*'((?:[^'\\]|\\.)*)'/
const hasCJK = (text) => /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)

let replacedCount = 0
let needTranslationCount = 0
const needTranslation = new Map() // 英文文本 -> 出现次数

// 转义字符串中的特殊字符以用于正则替换
function escapeForRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 在文件中替换 cns 值（从旔回调改为直接行替换）
for (let i = 0; i < lines.length; i++) {
  const cnsMatch = lines[i].match(cnsLineRegex)
  if (!cnsMatch) continue
  
  const cnsText = cnsMatch[2]
  if (hasCJK(cnsText) || cnsText.trim().length === 0) continue // 已经是中文，跳过
  
  // cns 是英文，需要查找同一对象块内的 tw 字段
  // 向上查找对象开始 {
  let blockStart = i
  while (blockStart > 0 && !lines[blockStart].match(/^\s*\{/)) {
    blockStart--
  }
  
  // 向下查找对象结束 }
  let blockEnd = i
  while (blockEnd < lines.length && !lines[blockEnd].match(/^\s*\}/)) {
    blockEnd++
  }
  
  // 在 blockStart 到 blockEnd 范围内查找 tw 字段
  let twText = null
  for (let j = blockStart; j <= blockEnd; j++) {
    const twMatch = lines[j].match(twLineRegex)
    if (twMatch) {
      twText = twMatch[2]
      break
    }
  }
  
  if (twText && hasCJK(twText)) {
    // tw 是中文（繁体），转换为简体
    const simplified = converter(twText)
    // 替换 cns 行
    const indent = cnsMatch[1]
    // 转义替换字符串中的 $ 和 \
    const escapedSimplified = simplified.replace(/\$/g, '$$$$')
    lines[i] = `${indent}'cns': '${simplified}'`
    replacedCount++
  } else {
    // tw 也是英文或不存在，需要手动翻译
    needTranslationCount++
    const count = needTranslation.get(cnsText) || 0
    needTranslation.set(cnsText, count + 1)
  }
}

// 写回文件
const newContent = lines.join('\n')
fs.writeFileSync(filePath, newContent, 'utf8')

console.log(`已通过 tw->cns 繁简转换替换: ${replacedCount} 条`)
console.log(`仍需手动翻译的英文 cns: ${needTranslationCount} 条`)
console.log(`独特英文文本数: ${needTranslation.size}`)

// 输出需要手动翻译的文本
const sortedTexts = [...needTranslation.keys()].sort()
fs.writeFileSync('scripts/need_translation.json', JSON.stringify(sortedTexts, null, 2), 'utf8')
console.log(`\n需要翻译的文本已保存到 scripts/need_translation.json`)
