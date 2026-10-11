/**
 * 详细分析跨文件ID冲突的具体内容
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const BASE = 'd:/FF/FLYFF/src/data';
const OUT = 'd:/FF/FLYFF/id_conflict_details.txt';

/**
 * 从JS数据文件中提取顶层键ID和名称
 * @param {string} filepath - 文件路径
 * @returns {Map<string, string>} ID -> 英文名称
 */
function extractIdNames(filepath) {
  const content = readFileSync(filepath, 'utf-8');
  const result = new Map();
  
  // 匹配整个对象块: '数字': { ... 'id': 数字, ... 'name': { ... 'en': '名称' ... } ... }
  // 用简化方法：先提取顶层键，然后用正则找对应的en名称
  
  // 找所有顶层键位置
  const topKeyPattern = /^  '(\d+)': \{/gm;
  const positions = [];
  let match;
  while ((match = topKeyPattern.exec(content)) !== null) {
    positions.push({ id: match[1], index: match.index });
  }
  
  // 对每个顶层键，找它块内的 en 名称
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : content.length;
    const block = content.substring(start, end);
    
    // 找 en 名称
    const enMatch = block.match(/'en':\s*'([^']*)'/);
    const cnsMatch = block.match(/'cns':\s*'([^']*)'/);
    const name = enMatch ? enMatch[1] : (cnsMatch ? cnsMatch[1] : '(unknown)');
    
    result.set(positions[i].id, name);
  }
  
  return result;
}

console.log('Loading ITEM_INFO names...');
const itemNames = extractIdNames(join(BASE, 'ITEM_INFO.js'));
console.log(`  Loaded ${itemNames.size} items`);

console.log('Loading MONSTER_INFO names...');
const monsterNames = extractIdNames(join(BASE, 'MONSTER_INFO.js'));
console.log(`  Loaded ${monsterNames.size} monsters`);

console.log('Loading SQ_SET names...');
const setNames = extractIdNames(join(BASE, 'SQ_SET.js'));
console.log(`  Loaded ${setNames.size} sets`);

// ITEM_INFO vs SQ_SET conflicts
const itemSetConflicts = ['21002', '23468', '28288', '29851', '37411', '43743', '49699'];
// ITEM_INFO vs MONSTER_INFO conflicts
const itemMonsterConflicts = ['14963', '20580', '20947', '21067', '22010', '22379', '23160', '23558', '23970', '24117', '24154', '24170', '24275', '25022', '25030', '25270', '25749', '25780', '26376', '26385', '26421', '28302', '28407', '29150'];

const lines = [];

lines.push('======================================================');
lines.push('   跨文件 ID 冲突详细分析报告');
lines.push('======================================================');

lines.push('\n--- ITEM_INFO vs SQ_SET 冲突 (7个) ---');
for (const id of itemSetConflicts) {
  const itemName = itemNames.get(id) || '(not found)';
  const setName = setNames.get(id) || '(not found)';
  lines.push(`  ID=${id}:`);
  lines.push(`    ITEM_INFO: ${itemName}`);
  lines.push(`    SQ_SET:    ${setName}`);
}

lines.push('\n--- ITEM_INFO vs MONSTER_INFO 冲突 (24个) ---');
for (const id of itemMonsterConflicts) {
  const itemName = itemNames.get(id) || '(not found)';
  const monsterName = monsterNames.get(id) || '(not found)';
  lines.push(`  ID=${id}:`);
  lines.push(`    ITEM_INFO:    ${itemName}`);
  lines.push(`    MONSTER_INFO: ${monsterName}`);
}

import { writeFileSync } from 'fs';
writeFileSync(OUT, lines.join('\n'), 'utf-8');
console.log(`\nDone! Details written to ${OUT}`);
