/**
 * @file apply_translations_cns.cjs
 * @description 将翻译结果应用到QUEST_INFO.js文件中,每100条写入一次
 * @returns {void}
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const questInfoPath = path.join(__dirname, '..', 'src', 'data', 'QUEST_INFO.js');
const translationsPath = path.join(__dirname, 'translations_cns.json');

// 读取翻译映射
const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf-8'));
console.log(`加载翻译条目: ${translations.length}`);

// 读取QUEST_INFO.js
let content = fs.readFileSync(questInfoPath, 'utf-8');
let lines = content.split('\n');

let appliedCount = 0;
let failedCount = 0;

// 对每个翻译条目,找到对应行并替换cns值
for (const item of translations) {
  const lineIdx = item.line - 1; // 0-based index
  if (lineIdx >= lines.length) {
    console.error(`行号超出范围: ${item.line}`);
    failedCount++;
    continue;
  }

  const oldLine = lines[lineIdx];
  const translation = item.translation;

  // 转义翻译文本中的单引号
  const escapedTranslation = translation.replace(/'/g, "\\'");

  // 替换cns值
  // 匹配模式: 'cns': '...' (支持转义的单引号)
  const cnsRegex = /['"]cns['"]\s*:\s*['"]((?:[^'"\\]|\\.)*)['"]/;
  const match = oldLine.match(cnsRegex);

  if (!match) {
    console.error(`行${item.line}未找到cns字段: ${oldLine.substring(0, 80)}`);
    failedCount++;
    continue;
  }

  // 构建新的行
  const newCnsValue = `'cns': '${escapedTranslation}'`;
  const newLine = oldLine.replace(cnsRegex, newCnsValue);

  if (newLine === oldLine) {
    console.error(`行${item.line}替换失败`);
    failedCount++;
    continue;
  }

  lines[lineIdx] = newLine;
  appliedCount++;
}

// 写回文件
content = lines.join('\n');
fs.writeFileSync(questInfoPath, content, 'utf-8');

console.log(`\n翻译应用完成:`);
console.log(`成功: ${appliedCount} 条`);
console.log(`失败: ${failedCount} 条`);
console.log(`已写入: ${questInfoPath}`);
