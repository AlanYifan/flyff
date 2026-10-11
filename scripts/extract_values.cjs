/**
 * @file extract_values.cjs
 * @description 提取需要翻译的值,输出为行号:值的格式,方便翻译
 * @returns {void} 输出文本文件
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'need_translation_cns.json');
const items = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// 输出为JSON数组,每项包含line和value
const outputPath = path.join(__dirname, 'cns_to_translate.txt');
const lines = items.map((item, idx) => {
  return `[${idx + 1}] LINE:${item.line} VALUE:${item.value}`;
});
fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
console.log(`共${items.length}条,已写入: ${outputPath}`);
