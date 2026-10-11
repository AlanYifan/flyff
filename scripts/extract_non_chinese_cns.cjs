/**
 * @file extract_non_chinese_cns.cjs
 * @description 从QUEST_INFO.js中提取所有cns字段中包含非中文(英文)的条目
 * @returns {void} 输出JSON文件
 */

const fs = require('fs');
const path = require('path');

// 读取QUEST_INFO.js文件内容
const filePath = path.join(__dirname, '..', 'src', 'data', 'QUEST_INFO.js');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 正则匹配 cns 字段: 'cns': '...' 或 "cns": "..."
// 支持单引号和双引号,支持转义
const cnsRegex = /['"]cns['"]\s*:\s*['"]((?:[^'"\\]|\\.)*)['"]/g;

// 中文字符检测
function isNonChinese(str) {
  if (!str || typeof str !== 'string') return false;
  const chineseRegex = /[\u4e00-\u9fff]/;
  return !chineseRegex.test(str);
}

// 提取所有cns字段
const nonChineseItems = [];
let totalCount = 0;
let nonChineseCount = 0;

// 逐行扫描,记录行号
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  let match;
  // 重置regex的lastIndex
  cnsRegex.lastIndex = 0;
  while ((match = cnsRegex.exec(line)) !== null) {
    totalCount++;
    const value = match[1];
    // 反转义
    const unescaped = value.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    if (isNonChinese(unescaped)) {
      nonChineseCount++;
      nonChineseItems.push({
        line: i + 1,
        rawMatch: match[0],
        value: unescaped,
        escapedValue: value
      });
    }
  }
}

console.log(`总cns字段数: ${totalCount}`);
console.log(`非中文cns字段数: ${nonChineseCount}`);

// 输出到文件
const outputPath = path.join(__dirname, 'non_chinese_cns.json');
fs.writeFileSync(outputPath, JSON.stringify(nonChineseItems, null, 2), 'utf-8');
console.log(`结果已写入: ${outputPath}`);

// 打印前20条示例
console.log('\n前20条非中文cns示例:');
for (let i = 0; i < Math.min(20, nonChineseItems.length); i++) {
  console.log(`[${i + 1}] 行${nonChineseItems[i].line}: ${nonChineseItems[i].value.substring(0, 80)}`);
}
