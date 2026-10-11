/**
 * 从 translations_part1.js 原始文本中提取键值对
 * 转为标准JSON文件，正确处理引号转义
 */
const fs = require('fs')

const content = fs.readFileSync('scripts/translations_part1.js', 'utf8')
const lines = content.split(/\r?\n/)

const translations = {}

for (const line of lines) {
  const trimmed = line.trim()
  // 跳过非数据行
  if (!trimmed.startsWith('"')) continue
  if (trimmed === '}' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue
  
  // 找到键值分隔符 ": " 的位置
  const separator = '": "'
  const sepIdx = trimmed.indexOf(separator)
  if (sepIdx === -1) continue
  
  // 提取key: 从第1个字符("之后)到分隔符之前
  const key = trimmed.substring(1, sepIdx)
  
  // 提取value: 从分隔符之后到行末的 ", 或 "
  const afterSep = trimmed.substring(sepIdx + separator.length)
  // 移除末尾的逗号
  let value = afterSep
  if (value.endsWith(',')) value = value.slice(0, -1)
  if (value.endsWith('"')) value = value.slice(0, -1)
  
  translations[key] = value
}

console.log(`提取了 ${Object.keys(translations).length} 条翻译`)

// 写为JSON（自动处理转义）
fs.writeFileSync('scripts/translations.json', JSON.stringify(translations, null, 2), 'utf8')
console.log('已写入 scripts/translations.json')

// 验证：读取回来检查
const verify = JSON.parse(fs.readFileSync('scripts/translations.json', 'utf8'))
console.log(`验证读取: ${Object.keys(verify).length} 条`)
