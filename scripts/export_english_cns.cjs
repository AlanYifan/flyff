/**
 * 导出 QUEST_INFO.js 中所有 cns 为英文的独特文本到 JSON 文件
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
const output = JSON.stringify(sorted, null, 2)
fs.writeFileSync('scripts/english_cns_texts.json', output, 'utf8')
console.log(`导出 ${sorted.length} 条独特英文文本到 scripts/english_cns_texts.json`)
