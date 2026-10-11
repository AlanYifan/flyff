/**
 * @file extract_all_values.cjs
 * @description 提取所有需要翻译的值,分成每50条一个文件
 * @returns {void} 输出多个JSON文件
 */

const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'need_translation_cns.json');
const items = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// 每个文件50条
const batchSize = 50;
const totalBatches = Math.ceil(items.length / batchSize);

for (let i = 0; i < totalBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, items.length);
  const batch = items.slice(start, end);
  
  // 简化格式: [{line, value, escapedValue}]
  const simplified = batch.map(item => ({
    line: item.line,
    value: item.value,
    escapedValue: item.escapedValue
  }));
  
  const outputPath = path.join(__dirname, `translate_batch_${String(i + 1).padStart(2, '0')}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2), 'utf-8');
}

console.log(`共${items.length}条,分成${totalBatches}个批次文件`);

// 输出每个批次文件的前几条预览
for (let i = 0; i < totalBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, items.length);
  console.log(`\n批次${i + 1} (条${start + 1}-${end}):`);
  for (let j = start; j < Math.min(start + 3, end); j++) {
    console.log(`  [${j + 1}] 行${items[j].line}: ${items[j].value.substring(0, 60)}${items[j].value.length > 60 ? '...' : ''}`);
  }
}
