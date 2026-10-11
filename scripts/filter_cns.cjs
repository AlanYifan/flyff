/**
 * @file filter_cns.cjs
 * @description 过滤掉纯标点/空值的cns条目,只保留需要翻译的英文文本
 * @returns {void} 输出过滤后的JSON文件
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'non_chinese_cns.json');
const items = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// 过滤: 排除只包含标点符号或空白的条目
function isPunctuationOnly(str) {
  if (!str || str.trim() === '') return true;
  // 检查是否只有标点符号(中英文)、空白、特殊符号
  const punctRegex = /^[\s\u3000\u2026\u00b7\uff0c\uff01\uff1f\uff1a\uff1b\uff08\uff09\u3001\u3002\,\.\!\?\:\;\(\)\-\*\~\#\$%&\+\/=<>`'"_'^|{}@]+$/;
  return punctRegex.test(str.trim());
}

const needTranslation = items.filter(item => !isPunctuationOnly(item.value));
const skipped = items.filter(item => isPunctuationOnly(item.value));

console.log(`总非中文条目: ${items.length}`);
console.log(`跳过(纯标点/空): ${skipped.length}`);
console.log(`需要翻译: ${needTranslation.length}`);

// 输出需要翻译的条目
const outputPath = path.join(__dirname, 'need_translation_cns.json');
fs.writeFileSync(outputPath, JSON.stringify(needTranslation, null, 2), 'utf-8');
console.log(`需要翻译的条目已写入: ${outputPath}`);

// 打印所有需要翻译的条目
console.log('\n所有需要翻译的条目:');
for (let i = 0; i < needTranslation.length; i++) {
  const val = needTranslation[i].value;
  console.log(`[${i + 1}] 行${needTranslation[i].line}: ${val.substring(0, 100)}${val.length > 100 ? '...' : ''}`);
}
