import { computed } from 'vue'

/**
 * 经验计算组合式API
 * 将经验计算相关的逻辑从Main.vue中抽离出来
 * @param {import('vue').Ref} player - 玩家响应式引用
 * @param {import('vue').Ref<Array>} activeBuffs - 当前活跃BUFF列表的响应式引用
 */
export function useExperienceCalculator (player, activeBuffs) {
  /**
   * 获取经验倍率
   * 遍历所有活跃BUFF，累加经验增益效果
   * 基础倍率为 1.0（100%），BUFF 的 exprate 效果会在此基础上叠加
   * @returns {number} 最终经验倍率（如 56.55 表示 5655% 经验）
   */
  const getExperienceMultiplier = () => {
    // 基础倍率 1.0 (100%)
    let multiplier = 1

    // 获取玩家的活跃BUFF
    const buffs = activeBuffs.value || []

    // 遍历所有buff，查找经验增益效果
    buffs.forEach(buff => {
      // 兼容旧格式：type === 'es'
      if (buff.type === 'es' && buff.expRate) {
        multiplier += buff.expRate
      }
      // 新格式：effects.expRate
      if (buff.effects?.expRate) {
        const expRateEffect = buff.effects.expRate
        const isRate = typeof expRateEffect === 'object' ? Boolean(expRateEffect.rate) : false
        const add = typeof expRateEffect === 'object' ? (expRateEffect.add || 0) : expRateEffect

        // 如果 rate 为 true，add 是百分比值（如 100、200、300）
        // 需要转换为倍率增加（如 1、2、3）
        if (isRate) {
          multiplier += add / 100
        } else {
          // 否则 add 直接是倍率增加值
          multiplier += add
        }
      }
    })

    // 确保返回一个有效的数值
    return typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : 1
  }

  /**
   * 计算实际获得的经验值
   * @param {number} baseExperience - 怪物基础经验值
   * @returns {number} 经过倍率加成后的实际经验值
   */
  const calculateActualExperience = baseExperience => {
    const multiplier = getExperienceMultiplier()
    return baseExperience * multiplier
  }

  // 计算属性：当前经验倍率
  const experienceMultiplier = computed(() => {
    return getExperienceMultiplier()
  })

  // 暴露给外部使用的属性和方法
  return {
    // 计算属性
    experienceMultiplier,

    // 方法
    getExperienceMultiplier,
    calculateActualExperience
  }
}
