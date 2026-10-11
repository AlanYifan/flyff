/**
 * 扫描 QUEST_INFO.js 中所有 cns 字段为非中文（英文）的条目
 * 去重后输出独特英文文本列表
 */
const fs = require('fs')

const filePath = 'src/data/QUEST_INFO.js'
const content = fs.readFileSync(filePath, 'utf8')

const cnsRegex = /'cns':\s*'((?:[^'\\]|\\.)*)'/g

let match
const uniqueTexts = new Set()

while ((match = cnsRegex.exec(content)) !== null) {
  const text = match[1]
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
  if (!hasCJK && text.trim().length > 0) {
    uniqueTexts.add(text)
  }
}

const sorted = [...uniqueTexts].sort()
console.log(`共 ${uniqueTexts.size} 条独特英文文本\n`)

// 输出为 JSON 数组格式，方便后续处理
sorted.forEach((text, i) => {
  console.log(`[${i + 1}] ${text}`)
})
