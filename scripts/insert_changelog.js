const fs = require('fs');

const path = 'd:\\FF\\FLYFF\\CHANGELOG.md';
const content = fs.readFileSync(path, 'utf8');

const marker = '## v2.1170 (2026-07-17): 修复神鹰降临释放后不可见问题';

const insert = [
  '## v2.1171 (2026-07-17): 神鹰降临显示改为图片式呈现',
  '',
  '### 修改',
  '1. 神鹰降临召唤物本体从纯CSS div拼接渲染改为使用技能图标图片（shenyingjianglin.png）显示，与捡宠（PickuppetPet）一致的图片式呈现风格',
  '2. 移除CSS拼接的神鹰翅膀、身体、头部、喙、眼睛、尾羽等渲染元素',
  '3. 新增图片样式：image-rendering: pixelated 保持像素清晰，金色 drop-shadow 营造召唤物光感',
  '4. 新增图片浮动呼吸动画（esImageFloat），类似捡宠 petBob 上下浮动效果',
  '5. 消散阶段简化：移除羽毛飘散特效，改为图片淡出上浮消散动画（esImageDisperse）',
  '6. 移除攻击轨迹特效（es-attack-trail），攻击反馈改为图片俯冲缩放动画',
  '7. 保留召唤光柱、能量波纹等召唤技能特效，保留椭圆轨道盘旋飞行与俯冲攻击动画',
  '',
  '### 修改文件',
  '- src/components/EagleSummonEffect.vue：',
  '  - template：神鹰主体替换为 img 标签加载 /pt/skill_icon/shenyingjianglin.png，移除翅膀/身体/头部/尾羽等div，移除攻击轨迹和消散羽毛的v-for列表',
  '  - script：新增 isDispersing 状态；简化 triggerAttack（仅切换 isAttacking）；简化 playDisperse（仅触发图片淡出）；移除 attackTrails/disperseFeathers 状态及 generateAttackTrail/generateDisperseFeathers 函数',
  '  - style：移除 eagle-aura/eagle-wing/eagle-torso/eagle-head/eagle-beak/eagle-eye-glow/eagle-tail/es-attack-trail/es-feather 等样式与动画；新增 eagle-image 样式、esImageFloat 浮动动画、esImageDisperse 消散动画',
  '',
  '## v2.1170 (2026-07-17): 修复神鹰降临释放后不可见问题'
].join('\r\n');

console.log('Contains marker:', content.includes(marker));
const newContent = content.replace(marker, insert);
console.log('Replaced:', newContent.length !== content.length);
fs.writeFileSync(path, newContent, 'utf8');
console.log('Done');
