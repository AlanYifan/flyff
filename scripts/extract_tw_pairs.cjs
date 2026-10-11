/**
 * 提取有中文tw的英文cns条目，输出 cns->tw 映射对
 * 用于后续将繁体中文tw转为简体中文cns
 */
const fs = require('fs')

const filePath = 'src/data/QUEST_INFO.js'
const content = fs.readFileSync(filePath, 'utf8')

const idsWithChineseTw = [94, 137, 318, 356, 426, 433, 460, 583, 618, 662, 676, 909, 949, 1032, 1052, 1111, 1333, 1361, 1405, 1434, 1568, 1696, 1889, 1892, 1895, 2039, 2142, 2318, 2348, 2358, 2650, 2688, 2809, 2920, 3008, 3065, 3079, 3105, 3170, 3247, 3254, 3334, 3384, 3571, 3676, 3839, 3923, 3997, 4016, 4287, 4398, 4550, 4607, 4797, 4852, 4860, 5028, 5032, 5082, 5180, 5244, 5272, 5351, 5474, 5578, 5585, 5590, 5693, 5792, 5809, 6025, 6052, 6068, 6090, 6132, 6191, 6196, 6203, 6286, 6397, 6418, 6656, 6693, 6739, 6740, 6751, 6815, 6843, 6943, 6976, 7103, 7125, 7176, 7310, 7335, 7415, 7450, 7554, 7768, 7802, 7941, 7948, 8142, 8169, 8609, 8611, 8666, 8697, 8782, 8785, 8796, 8893, 9025, 9230, 9240, 9250, 9428, 9477, 9625, 9809, 9846, 9988, 10002, 10083, 10096, 10161, 10179, 10428, 10475, 10686, 10753, 10796, 10870, 11323, 11338, 11343, 11496, 11505, 11579, 11749, 11761, 11916, 12021, 12049, 12090, 12128, 12178, 12194, 12205, 12326, 12810, 12840, 12925, 13032, 13469, 13497, 13572, 13775, 13842, 14045, 14082, 14231, 14566, 14693, 14822, 14934, 14962, 15174, 17549, 17566, 17654, 18264, 18269, 18283, 18500, 18729, 18742, 18869, 18956, 19065, 19166, 19217, 19275, 19331, 19452, 19649, 19740, 19912, 19916, 19991, 24670, 24876, 26417, 26442, 51205, 55916, 55967]

const results = []

for (const questId of idsWithChineseTw) {
  // 找到该任务块
  const regex = new RegExp(`'${questId}':\\s*\\{`)
  const match = regex.exec(content)
  if (!match) continue
  
  const startIdx = match.index + match[0].length
  // 找到该块结束位置
  let braceCount = 1
  let endIdx = startIdx
  while (braceCount > 0 && endIdx < content.length) {
    if (content[endIdx] === '{') braceCount++
    else if (content[endIdx] === '}') braceCount--
    endIdx++
  }
  
  const block = content.substring(startIdx, endIdx - 1)
  
  // 提取所有 cns 和 tw 配对
  // 按 dialogs 块来分组
  const dialogRegex = /'(dialogsBegin|dialogsAccept|dialogsDecline|dialogsComplete|dialogsFail|name|description|progressText|dialogStart|dialogEnd|dialogIncomplete|dialogComplete)':\s*\[([^\]]*)\]/gs
  let dMatch
  while ((dMatch = dialogRegex.exec(block)) !== null) {
    const fieldName = dMatch[1]
    const dialogBlock = dMatch[2]
    
    // 提取每个对话条目中的 cns 和 tw
    const entryRegex = /\{([^}]*)\}/gs
    let eMatch
    while ((eMatch = entryRegex.exec(dialogBlock)) !== null) {
      const entry = eMatch[1]
      const cnsMatch = entry.match(/'cns':\s*'((?:[^'\\]|\\.)*)'/)
      const twMatch = entry.match(/'tw':\s*'((?:[^'\\]|\\.)*)'/)
      
      if (cnsMatch && twMatch) {
        const cnsText = cnsMatch[1]
        const twText = twMatch[1]
        const cnsIsChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(cnsText)
        const twIsChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(twText)
        
        if (!cnsIsChinese && twIsChinese && cnsText.trim().length > 0) {
          results.push({
            questId,
            field: fieldName,
            cns: cnsText,
            tw: twText
          })
        }
      }
    }
  }
}

console.log(`共找到 ${results.length} 对 cns(英文)->tw(中文) 映射\n`)

// 输出前20个示例
results.slice(0, 20).forEach((r, i) => {
  console.log(`[${i+1}] QuestID: ${r.questId} | Field: ${r.field}`)
  console.log(`    CNS(英): ${r.cns.substring(0, 80)}`)
  console.log(`    TW(中): ${r.tw.substring(0, 80)}`)
  console.log()
})

// 输出全部映射为JSON
fs.writeFileSync('scripts/cns_tw_pairs.json', JSON.stringify(results, null, 2), 'utf8')
console.log(`\n全部映射已保存到 scripts/cns_tw_pairs.json`)
