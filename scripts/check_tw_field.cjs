/**
 * 检查 QUEST_INFO.js 中 cns 为英文的条目是否有 tw 字段可用作翻译参考
 */
const fs = require('fs')

const filePath = 'src/data/QUEST_INFO.js'
const content = fs.readFileSync(filePath, 'utf8')

// 匹配每个任务条目块（从 questId 开始到下一个 questId 或文件末尾）
// 找到所有包含 cns 为英文的条目，同时检查是否有 tw 字段
const entryRegex = /'(\d+)':\s*\{/g
const entries = []

let match
while ((match = entryRegex.exec(content)) !== null) {
  const questId = match[1]
  const startIdx = match.index
  
  // 找到该条目的结束位置（下一个 'xxx': { 或文件末尾）
  const nextMatch = entryRegex.exec(content)
  const endIdx = nextMatch ? nextMatch.index : content.length
  entryRegex.lastIndex = match.index + match[0].length // 重置
  
  const block = content.substring(startIdx, endIdx)
  
  // 检查是否有 cns 为英文的
  const cnsMatches = block.match(/'cns':\s*'((?:[^'\\]|\\.)*)'/g)
  if (!cnsMatches) continue
  
  let hasEnglishCns = false
  for (const cnsMatch of cnsMatches) {
    const text = cnsMatch.match(/'cns':\s*'((?:[^'\\]|\\.)*)'/)[1]
    if (!/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text) && text.trim().length > 0) {
      hasEnglishCns = true
      break
    }
  }
  
  if (!hasEnglishCns) continue
  
  // 检查是否有 tw 字段
  const twMatches = block.match(/'tw':\s*'((?:[^'\\]|\\.)*)'/g)
  const hasTw = twMatches && twMatches.length > 0
  
  // 检查 tw 是否为中文
  let hasChineseTw = false
  if (twMatches) {
    for (const twMatch of twMatches) {
      const text = twMatch.match(/'tw':\s*'((?:[^'\\]|\\.)*)'/)[1]
      if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) {
        hasChineseTw = true
        break
      }
    }
  }
  
  entries.push({
    questId,
    hasTw,
    hasChineseTw,
    twCount: twMatches ? twMatches.length : 0
  })
}

const withChineseTw = entries.filter(e => e.hasChineseTw)
const withTwOnly = entries.filter(e => e.hasTw && !e.hasChineseTw)
const noTw = entries.filter(e => !e.hasTw)

console.log(`总共有英文cns的任务数: ${entries.length}`)
console.log(`有中文tw的任务数: ${withChineseTw.length}`)
console.log(`有tw但非中文的任务数: ${withTwOnly.length}`)
console.log(`无tw的任务数: ${noTw.length}`)

console.log('\n--- 有中文tw的任务ID列表 ---')
console.log(withChineseTw.map(e => e.questId).join(', '))

console.log('\n--- 有tw但非中文的任务ID列表 ---')
console.log(withTwOnly.map(e => e.questId).join(', '))

console.log('\n--- 无tw的任务ID列表 ---')
console.log(noTw.map(e => e.questId).join(', '))
