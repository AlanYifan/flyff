,import fs from 'fs';

const filePath = 'd:\\FF\\FLYFF\\src\\components\\modals\\DatabaseQueryModal.vue';

let content = fs.readFileSync(filePath, 'utf-8');

// 修改 hideItemTooltip 函数，添加 event 参数
content = content.replace(
    `function hideItemTooltip () {
      console.log('[DatabaseQueryModal] hideItemTooltip called')`,
    `function hideItemTooltip (event) {
      console.log('[DatabaseQueryModal] hideItemTooltip called', {
        target: event?.target,
        relatedTarget: event?.relatedTarget,
        targetClass: event?.target?.className,
        relatedTargetClass: event?.relatedTarget?.className
      })`
);

// 修改 @mouseleave 事件，传递 $event
content = content.replace(
    '@mouseleave="hideItemTooltip"',
    '@mouseleave="hideItemTooltip($event)"'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Added debug info to DatabaseQueryModal.vue');
