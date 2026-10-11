/**
 * @file 提取所有 pickuppet 类型的物品 ID 和名称
 * @description 从 ITEM_INFO.js 中提取所有 pickuppet 物品，输出格式为 ID|中文名称|icon
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'ITEM_INFO.js');
const data = fs.readFileSync(filePath, 'utf8');

const lines = data.split('\n');
let currentId = null;
let currentName = null;
let currentIcon = null;
let isPickupPet = false;
const results = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const idMatch = line.match(/^'(\d+)':\s*\{/);
  if (idMatch) {
    if (currentId && isPickupPet) {
      results.push({ id: currentId, name: currentName, icon: currentIcon });
    }
    currentId = idMatch[1];
    currentName = null;
    currentIcon = null;
    isPickupPet = false;
    continue;
  }
  if (line.includes("'category'") && line.includes("'pickuppet'")) {
    isPickupPet = true;
    continue;
  }
  if (line.includes("'cns':") && currentId) {
    const cnsMatch = line.match(/'cns':\s*'([^']*)'/);
    if (cnsMatch) {
      currentName = cnsMatch[1];
    }
  }
  if (line.includes("'icon':") && currentId) {
    const iconMatch = line.match(/'icon':\s*'([^']*)'/);
    if (iconMatch) {
      currentIcon = iconMatch[1];
    }
  }
}

if (currentId && isPickupPet) {
  results.push({ id: currentId, name: currentName, icon: currentIcon });
}

console.log('Total: ' + results.length);
results.forEach(r => console.log(r.id + '|' + r.name + '|' + r.icon));
