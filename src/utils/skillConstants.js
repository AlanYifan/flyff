/**
 * 技能常量定义
 * 从 descriptions store 导出统一的中文名称映射
 */
import { ELEMENT_NAMES, SKILL_TYPE_NAMES } from '@/store/descriptions'

// 元素克制表
export const ELEMENT_ADVANTAGE_TABLE = {
  water: 'fire',
  fire: 'wind',
  wind: 'earth',
  earth: 'electricity',
  electricity: 'water'
}

// 技能类型映射（使用统一描述）
export const SKILL_TYPE_MAP = SKILL_TYPE_NAMES

// 元素类型映射（使用统一描述）
export const ELEMENT_TYPE_MAP = ELEMENT_NAMES

// 默认技能图标
export const DEFAULT_SKILL_ICON = '/pt/skill_icon/default_skill.png'
