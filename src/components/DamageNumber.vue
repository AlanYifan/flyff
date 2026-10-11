<template>
  <Teleport to="body">
    <div class="damage-float-container">
      <div
        v-for="item in displayItems"
        :key="item.id"
        class="damage-float-number"
        :class="[colorClass(item), { 'damage-critical': item.isCritical && !item.isMiss }]"
        :style="itemStyle(item)"
      >
        <!-- 技能/武器/怪物/物品图标 -->
        <img
          v-if="iconInfo(item)"
          :src="iconInfo(item).src"
          class="damage-skill-icon"
          :style="{ width: iconInfo(item).width + 'px', height: iconInfo(item).height + 'px' }"
          alt=""
        />
        <!-- 逐字符跳动显示：每个字符独立 span，带递增延迟 -->
        <span class="damage-text">
          <span
            v-for="(ch, idx) in displayChars(item)"
            :key="idx"
            class="damage-char"
            :class="{ 'damage-char-comma': ch === ',' }"
            :style="{ animationDelay: `${idx * CHAR_DELAY_MS}ms` }"
          >{{ ch }}</span>
        </span>
        <!-- 双倍惩戒图标 -->
        <img
          v-if="item.doubleJudgment"
          src="/pt/skill_icon/rinsupcross.png"
          class="damage-dj-icon"
          alt=""
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
/**
 * DamageNumber - 伤害飘字组件（逐字符跳动风格）
 *
 * 动画效果（参考 FlyfTurnBasedEdition 项目）：
 * - 伤害数字的每个字符从第一个开始逐个往上跳动，然后回到原地
 * - 如 "-1234"：先 "-" 跳起落回，再 "1" 跳起落回，再 "2" ... 依次类推
 * - 暴击数字跳动幅度更大、字体更大、金色发光
 * - 所有字符跳完后，整体停留片刻 → 渐隐消失
 *
 * 数据接口与原 Canvas 版本完全一致，仅渲染方式从 Canvas 改为 DOM。
 *
 * @file DamageNumber.vue
 * @generated 2026-07-05
 */

import { computed } from 'vue'

/** 每个字符之间的延迟(ms) */
const CHAR_DELAY_MS = 55

/** 最后一个字符的跳动动画时长(ms) */
const CHAR_ANIM_MS = 400

/** 所有字符跳完后的停留时长(ms) */
const STAY_MS = 350

/** 渐隐消失时长(ms) */
const FADE_MS = 300

const props = defineProps({
  /** 全局伤害数字队列，由 useUI composable 维护 */
  globalDamageNumbers: {
    type: Array,
    required: true,
    default: () => []
  }
})

/**
 * 过滤出有效的伤害数字项
 * @returns {Array} 有效伤害数字列表
 */
const displayItems = computed(() => {
  const list = Array.isArray(props.globalDamageNumbers) ? props.globalDamageNumbers : []
  return list.filter(item => item && typeof item === 'object')
})

/**
 * 获取伤害数字的显示文本
 * 逻辑与原 Canvas 版本 displayText 方法一致。
 * @param {Object} item - 伤害数字数据项
 * @returns {string} 显示文本
 */
function displayText (item) {
  const critSuffix = item.isCritical ? ' 暴击' : ''
  if (typeof item.text === 'string' && item.text) {
    return `${item.text}${critSuffix}`
  }
  if (item.isMiss) {
    return 'MISS'
  }
  if (item.isHeal) {
    return `+${item.damage}${critSuffix}`
  }
  const indicator = getElementIndicator(item)
  const baseText = String(item.damage)
  const multiplier = item.doubleJudgment ? ' ×2' : ''
  return indicator
    ? `${indicator}${baseText}${multiplier}${critSuffix}`
    : `${baseText}${multiplier}${critSuffix}`
}

/**
 * 将伤害数值拆分为逐个字符数组（含前缀/后缀）
 * @param {Object} item - 伤害数字数据项
 * @returns {string[]} 字符数组
 */
function displayChars (item) {
  return displayText(item).split('')
}

/**
 * 获取元素克制指示符
 * @param {Object} item - 伤害数字数据项
 * @returns {string} ↑ 表示克制，↓ 表示被克，空字符串表示无克制
 */
function getElementIndicator (item) {
  if (!item || item.isMiss || item.isHeal || item.isMpHeal) {
    return ''
  }
  const advantage = Number(item.elementAdvantage)
  if (!Number.isFinite(advantage) || advantage === 1) {
    return ''
  }
  return advantage > 1 ? '↑' : '↓'
}

/**
 * 根据伤害数字属性返回对应的颜色 CSS 类名
 * 逻辑与原 Canvas 版本 getDamageColor 方法一致。
 * @param {Object} item - 伤害数字数据项
 * @returns {string} CSS 类名
 */
function colorClass (item) {
  if (item.isMiss) return 'dmg-miss'
  if (item.isMpHeal) return 'dmg-mp'
  if (item.isHeal) return 'dmg-heal'
  const advantage = Number(item.elementAdvantage)
  if (Number.isFinite(advantage) && advantage !== 1) {
    return advantage > 1 ? 'dmg-advantage' : 'dmg-disadvantage'
  }
  // targetIndex >= 0 表示玩家攻击怪物（蓝色），< 0 表示怪物攻击玩家（红色）
  if (item.targetIndex >= 0) return 'dmg-player'
  return 'dmg-enemy'
}

/**
 * 获取伤害数字的图标信息（技能/武器/怪物/物品图标）
 * 逻辑与原 Canvas 版本 getIconInfo 方法一致。
 * @param {Object} item - 伤害数字数据项
 * @returns {{src: string, width: number, height: number}|null} 图标信息
 */
function iconInfo (item) {
  if (!item) return null
  // 优先使用物品图标（恢复道具）
  if (item.itemIcon && typeof item.itemIcon === 'string') {
    return { src: item.itemIcon, width: 13, height: 13 }
  }
  const skillIcon = item.skill && typeof item.skill === 'object' ? item.skill.icon : null
  const weaponIcon =
    typeof item.weaponIcon === 'string'
      ? item.weaponIcon
      : item.weaponIcon?.icon
  const monsterIcon =
    typeof item.monsterIcon === 'string'
      ? item.monsterIcon
      : item.monsterIcon?.icon
  const iconSrc =
    (skillIcon && typeof skillIcon === 'string' && skillIcon) ||
    (weaponIcon && typeof weaponIcon === 'string' && weaponIcon) ||
    (item.targetIndex < 0 && monsterIcon && typeof monsterIcon === 'string' && monsterIcon)
  if (!iconSrc) return null
  if (item.targetIndex < 0 && item.monsterIcon) {
    const rank = item.monsterIcon.rank
    if (['super', 'boss', 'giant', 'violet'].includes(rank)) {
      return { src: iconSrc, width: 28, height: 18 }
    }
    return { src: iconSrc, width: 17, height: 17 }
  }
  return { src: iconSrc, width: 13, height: 13 }
}

/**
 * 计算飘字的定位样式（绝对屏幕坐标 + 渐隐延迟）
 * @param {Object} item - 伤害数字数据项
 * @returns {Record<string, string|number>} CSS 样式对象
 */
function itemStyle (item) {
  const rawX = Number.isFinite(item.screenXAbs)
    ? item.screenXAbs
    : Number.isFinite(item.screenX)
      ? item.screenX
      : 0
  const rawY = Number.isFinite(item.screenYAbs)
    ? item.screenYAbs
    : Number.isFinite(item.screenY)
      ? item.screenY
      : 0
  // 计算渐隐延迟：所有字符跳动完成 + 停留时间后开始渐隐
  const chars = displayChars(item)
  const charAnimDuration = chars.length * CHAR_DELAY_MS + CHAR_ANIM_MS
  return {
    left: `${rawX}px`,
    top: `${rawY}px`,
    '--fade-delay': `${charAnimDuration + STAY_MS}ms`
  }
}
</script>

<style scoped>
/* ============================================================
   DamageFloat Container - 多实例容器（fixed 定位覆盖全屏）
   ============================================================ */

.damage-float-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

/* ============================================================
   飘字单元 — 逐字符跳动风格
   仅使用 transform + opacity（GPU 合成属性）
   ============================================================ */

.damage-float-number {
  position: absolute;
  margin-left: 0;
  font-size: 11px;
  font-weight: 900;
  font-family: 'Arial Black', 'Impact', sans-serif;
  letter-spacing: 0.5px;
  white-space: nowrap;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 2px;
  /* 整体动画：逐字符跳动完后 → 渐隐消失 */
  animation: damageFadeOut 0.3s ease-out forwards;
  animation-delay: var(--fade-delay, 1.2s);
  opacity: 1;
  will-change: transform, opacity;
}

/* 技能/武器/怪物/物品图标 */
.damage-skill-icon {
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 3px rgba(255, 200, 80, 0.8));
  flex-shrink: 0;
  animation: charBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  will-change: transform, opacity;
}

/* 双倍惩戒图标 */
.damage-dj-icon {
  width: 8px;
  height: 8px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 3px rgba(255, 100, 100, 0.8));
  flex-shrink: 0;
  animation: charBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: var(--fade-delay, 1.2s);
  will-change: transform, opacity;
}

/* 伤害数字文本容器 */
.damage-text {
  line-height: 1;
  display: inline-flex;
  align-items: baseline;
}

/* 单个字符 — 核心跳动动画 */
.damage-char {
  display: inline-block;
  animation: charBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  opacity: 0;
  transform: translateY(0);
  will-change: transform, opacity;
}

/* 逗号字符不需要额外宽度间距 */
.damage-char-comma {
  margin-left: -1px;
}

/* ============================================================
   逐字符跳动动画
   从下方出现 → 往上跳 → 回到原地
   配合 animation-delay 实现从左到右依次跳动的效果
   ============================================================ */

@keyframes charBounce {
  0% {
    opacity: 0;
    transform: translateY(4px) scale(0.7);
  }
  30% {
    opacity: 1;
    transform: translateY(-6px) scale(1.15);
  }
  60% {
    opacity: 1;
    transform: translateY(1px) scale(0.95);
  }
  80% {
    opacity: 1;
    transform: translateY(-2px) scale(1.03);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 整体渐隐消失动画（在所有字符跳完后触发） */
@keyframes damageFadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* ============================================================
   颜色类型 — 参考 FlyfTurnBasedEdition 的 text-shadow 风格
   ============================================================ */

/* 玩家造成伤害 — 蓝色 */
.dmg-player {
  color: #4dc3ff;
  text-shadow:
    0 0 4px rgba(77, 195, 255, 0.9),
    0 0 10px rgba(59, 130, 246, 0.7),
    0 0 20px rgba(37, 99, 235, 0.4),
    1px 1px 0 #1e40af,
    -1px -1px 0 #1e40af,
    1px -1px 0 #1e40af,
    -1px 1px 0 #1e40af;
}

/* 怪物造成伤害 — 红色 */
.dmg-enemy {
  color: #ff4444;
  text-shadow:
    0 0 4px rgba(255, 68, 68, 0.9),
    0 0 10px rgba(239, 68, 68, 0.7),
    0 0 20px rgba(220, 38, 38, 0.4),
    1px 1px 0 #991b1b,
    -1px -1px 0 #991b1b,
    1px -1px 0 #991b1b,
    -1px 1px 0 #991b1b;
}

/* 治疗 — 绿色 */
.dmg-heal {
  color: #44ff44;
  text-shadow:
    0 0 4px rgba(68, 255, 68, 0.9),
    0 0 10px rgba(34, 197, 94, 0.7),
    0 0 20px rgba(22, 163, 74, 0.4),
    1px 1px 0 #166534,
    -1px -1px 0 #166534,
    1px -1px 0 #166534,
    -1px 1px 0 #166534;
}

/* MP恢复 — 蓝色 */
.dmg-mp {
  color: #4488ff;
  text-shadow:
    0 0 4px rgba(68, 136, 255, 0.9),
    0 0 10px rgba(59, 130, 246, 0.7),
    0 0 20px rgba(37, 99, 235, 0.4),
    1px 1px 0 #1e40af,
    -1px -1px 0 #1e40af,
    1px -1px 0 #1e40af,
    -1px 1px 0 #1e40af;
}

/* 闪避 — 灰色 */
.dmg-miss {
  color: #cfcfcf;
  text-shadow:
    0 0 4px rgba(207, 207, 207, 0.6),
    0 0 10px rgba(156, 163, 175, 0.4),
    1px 1px 0 #6b7280,
    -1px -1px 0 #6b7280,
    1px -1px 0 #6b7280,
    -1px 1px 0 #6b7280;
  font-style: italic;
}

/* 元素克制 — 绿色 */
.dmg-advantage {
  color: #44ff44;
  text-shadow:
    0 0 4px rgba(68, 255, 68, 0.9),
    0 0 10px rgba(34, 197, 94, 0.7),
    0 0 20px rgba(22, 163, 74, 0.4),
    1px 1px 0 #166534,
    -1px -1px 0 #166534,
    1px -1px 0 #166534,
    -1px 1px 0 #166534;
}

/* 元素被克 — 红色 */
.dmg-disadvantage {
  color: #ff4444;
  text-shadow:
    0 0 4px rgba(255, 68, 68, 0.9),
    0 0 10px rgba(239, 68, 68, 0.7),
    0 0 20px rgba(220, 38, 38, 0.4),
    1px 1px 0 #991b1b,
    -1px -1px 0 #991b1b,
    1px -1px 0 #991b1b,
    -1px 1px 0 #991b1b;
}

/* ============================================================
   暴击样式 — 金色大字 + 更大跳动幅度
   ============================================================ */

.damage-critical {
  font-size: 11px !important;
  color: #fef08a;
  text-shadow:
    0 0 6px rgba(250, 204, 21, 1),
    0 0 14px rgba(245, 158, 11, 0.8),
    0 0 28px rgba(217, 119, 6, 0.5),
    0 0 40px rgba(180, 83, 9, 0.3),
    2px 2px 0 #78350f,
    -2px -2px 0 #78350f,
    2px -2px 0 #78350f,
    -2px 2px 0 #78350f;
}

.damage-critical .damage-char {
  animation-name: charBounceCrit;
}

.damage-critical .damage-skill-icon {
  width: 18px !important;
  height: 18px !important;
  animation-name: charBounceCrit;
}

.damage-critical .damage-dj-icon {
  width: 14px !important;
  height: 14px !important;
  animation-name: charBounceCrit;
}

/* 暴击逐字符跳动 — 更大弹跳幅度 */
@keyframes charBounceCrit {
  0% {
    opacity: 0;
    transform: translateY(5px) scale(0.5);
  }
  25% {
    opacity: 1;
    transform: translateY(-11px) scale(1.3);
  }
  50% {
    opacity: 1;
    transform: translateY(2px) scale(0.9);
  }
  70% {
    opacity: 1;
    transform: translateY(-3px) scale(1.08);
  }
  85% {
    opacity: 1;
    transform: translateY(1px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
