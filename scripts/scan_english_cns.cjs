/**
 * 扫描 QUEST_INFO.js 中所有 cns 字段为非中文（英文）的条目
 * 输出：questId | field | englishText
 */
const fs = require('fs')

const filePath = 'src/data/QUEST_INFO.js'
const content = fs.readFileSync(filePath, 'utf8')

// 正则匹配 'cns': '...' 或 "cns": "..."
// 匹配所有 cns 字段
const cnsRegex = /'cns':\s*'((?:[^'\\]|\\.)*)'/g

let match
const results = []

while ((match = cnsRegex.exec(content)) !== null) {
  const text = match[1]
  // 检测是否不含中文字符
  const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
  if (!hasCJK && text.trim().length > 0) {
    // 找到该条目所属的 quest ID
    const beforeText = content.substring(0, match.index)
    const questIdMatch = beforeText.match(/'(\d+)':\s*\{[^]*?$/)
    const questId = questIdMatch ? questIdMatch[1] : 'unknown'
    
    // 找到该字段属于哪个属性（name, description, dialogsBegin等）
    // 向上查找最近的字段名
    const fieldMatch = beforeText.match(/'(dialogsBegin|dialogsAccept|dialogsDecline|dialogsComplete|dialogsFail|name|description)'/g)
    const fieldName = fieldMatch ? fieldMatch[fieldMatch.length - 1] : 'unknown'
    
    results.push({
      questId,
      field: fieldName,
      text
    })
  }
}

console.log(`共找到 ${results.length} 条 cns 为英文的记录\n`)
results.forEach((r, i) => {
  console.log(`[${i + 1}] QuestID: ${r.questId} | Field: ${r.field}`)
  console.log(`    Text: ${r.text.substring(0, 120)}${r.text.length > 120 ? '...' : ''}`)
  console.log()
})
