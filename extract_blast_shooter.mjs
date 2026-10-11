import { SKILL_INFO } from './src/data/SKILL_INFO.js';
import { writeFileSync } from 'fs';

const results = [];
for (const [key, skill] of Object.entries(SKILL_INFO)) {
  if (skill.class === 28695) {
    results.push({
      id: skill.id,
      name: skill.name?.cns,
      en: skill.name?.en,
      description: skill.description?.cns,
      icon: skill.icon,
      level: skill.level,
      passive: skill.passive,
      weapon: skill.weapon,
      element: skill.element,
      combo: skill.combo,
    });
  }
}
results.sort((a, b) => a.id - b.id);
const lines = [];
lines.push('===== 爆裂射手 (class 28695) 技能列表 =====');
lines.push('总数: ' + results.length);
lines.push('');
for (const r of results) {
  lines.push(`ID: ${r.id}`);
  lines.push(`  名称(cns): ${r.name}`);
  lines.push(`  英文(en): ${r.en}`);
  lines.push(`  描述(cns): ${r.description}`);
  lines.push(`  icon: ${r.icon}`);
  lines.push(`  level: ${r.level} | passive: ${r.passive} | weapon: ${r.weapon} | element: ${r.element} | combo: ${r.combo}`);
  lines.push('---');
}
writeFileSync('blast_shooter_skills.txt', lines.join('\n'), 'utf8');
console.log('Done. Total: ' + results.length);
