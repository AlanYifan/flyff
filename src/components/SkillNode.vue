<!--
  @file SkillNode.vue
  @description 技能节点组件 - 炫酷动画图标框架，展示技能图标、熟练度、解锁状态、类型标识
  @generated 2026-07-17
  @updated 2026-07-19 移除多余的 tag-passive 被动标识，被动技能仅由 tag-type（带边框）统一展示
  @updated 2026-07-18 移除六角棱形，改用 SkillIconFrame 炫酷动画特效组件
  @description 所有动画仅使用 transform / opacity，启用 GPU 合成层，避免卡顿
-->

<template>
  <div
    class="skill-node"
    :class="{
      'is-passive': skill.isPassive === true,
      'is-in-bar': inBar,
      'is-locked': !unlocked,
      'is-draggable': draggable
    }"
    :draggable="draggable"
    :style="{ '--type-color': typeColor }"
    @mouseenter="$emit('mouseenter', $event)"
    @mouseleave="$emit('mouseleave')"
    @mousemove="$emit('mousemove', $event)"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend')"
  >
    <!-- 炫酷技能图标框架（替代六角棱形） -->
    <SkillIconFrame
      :icon="skill.icon"
      :alt="skill.name"
      :type-color="typeColor"
      :type-key="resolvedTypeKey"
      :unlocked="unlocked"
      :in-bar="inBar"
      @icon-error="$emit('icon-error', $event)"
    />

    <!-- 技能名称 -->
    <span class="skill-name" :title="skill.name">{{ skill.name }}</span>

    <!-- 解锁等级 + 类型标签（被动技能的类型标签由父组件 typeLabel 传入，带边框统一展示） -->
    <div class="skill-tags">
      <span class="tag-level">Lv.{{ skill.unlockLevel || 1 }}</span>
      <span class="tag-type">{{ typeLabel }}</span>
    </div>

    <!-- 熟练度点阵 -->
    <div class="proficiency-pips" :title="`熟练度 ${proficiency.level}/${proficiency.maxLevel}`">
      <span
        v-for="n in proficiency.maxLevel"
        :key="n"
        class="pip"
        :class="{ 'pip-filled': n <= proficiency.level }"
      ></span>
    </div>
  </div>
</template>

<script setup>
/**
 * 技能节点组件
 * 用途/业务意图：以炫酷动画框架展示单个技能，含熟练度进度、解锁状态与类型标识
 * 图标框架使用独立的 SkillIconFrame 组件，提供旋转能量环、脉动光晕和类型专属粒子动画
 * 所有动效仅操作 transform / opacity，确保 GPU 合成、无卡顿
 */

import { computed } from 'vue'
import SkillIconFrame from '@/components/SkillIconFrame.vue'

// ========== Props ==========
const props = defineProps({
  /** 技能对象（来自 SKILL_CONFIG） */
  skill: {
    type: Object,
    required: true
  },
  /** 是否已解锁（玩家等级达到解锁条件） */
  unlocked: {
    type: Boolean,
    default: true
  },
  /** 熟练度信息 { level, maxLevel } */
  proficiency: {
    type: Object,
    default: () => ({ level: 1, maxLevel: 10 })
  },
  /** 是否已在技能栏中 */
  inBar: {
    type: Boolean,
    default: false
  },
  /** 是否可拖拽 */
  draggable: {
    type: Boolean,
    default: false
  },
  /** 技能类型主题色 */
  typeColor: {
    type: String,
    default: '#90a4ae'
  },
  /** 技能类型中文名 */
  typeLabel: {
    type: String,
    default: '技能'
  }
})

// ========== Emits ==========
defineEmits([
  /** 鼠标进入 */
  'mouseenter',
  /** 鼠标离开 */
  'mouseleave',
  /** 鼠标移动 */
  'mousemove',
  /** 拖拽开始 */
  'dragstart',
  /** 拖拽结束 */
  'dragend',
  /** 图标加载失败 */
  'icon-error'
])

// ========== 计算属性 ==========

/**
 * 解析后的技能类型 key
 * 被动技能优先返回 'passive'，其余返回技能的 type 字段
 * 用于驱动 SkillIconFrame 的类型专属粒子动画
 * @returns {string} 技能类型 key
 */
const resolvedTypeKey = computed(() => {
  if (props.skill?.isPassive === true) return 'passive'
  return props.skill?.type || 'utility'
})
</script>

<style scoped>
/* ==================== 技能节点容器 ==================== */
.skill-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 76px;
  cursor: pointer;
  /* GPU 合成提示 */
  will-change: transform;
  transition: transform 0.22s ease;
}

/* 可拖拽的主动技能 */
.skill-node.is-draggable {
  cursor: grab;
}

.skill-node.is-draggable:active {
  cursor: grabbing;
}

/* hover 时整体上浮放大（transform，GPU 友好） */
.skill-node:hover {
  transform: translateY(-3px) scale(1.06);
}

/* ==================== 锁定状态 ==================== */
.skill-node.is-locked {
  opacity: 0.75;
}

/* ==================== 被动技能 ==================== */
.skill-node.is-passive {
  cursor: default;
}

/* ==================== 技能名称与标签 ==================== */
.skill-name {
  font-size: 11px;
  color: var(--theme-text, #ffffff);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 76px;
  margin-top: 2px;
}

.skill-tags {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-level {
  font-size: 9px;
  color: var(--theme-muted, #aaa);
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 4px;
  border-radius: 3px;
}

.tag-type {
  font-size: 9px;
  color: var(--type-color, #90a4ae);
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid var(--type-color, #90a4ae);
}

/* ==================== 熟练度点阵 ==================== */
.proficiency-pips {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 76px;
  margin-top: 1px;
}

.pip {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition: background-color 0.2s ease;
}

.pip-filled {
  background: var(--theme-accent, #ffd700);
  box-shadow: 0 0 3px rgba(255, 215, 0, 0.6);
}
</style>
