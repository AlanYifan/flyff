/**
 * 职业配置 Store
 * 统一管理职业相关的配置信息，包括转职等级、职业名称、图标映射等
 */
import { defineStore } from 'pinia'

/**
 * 职业转职等级配置
 * 0: 初心者（未转职）
 * 1: 一转职业（15级转职）
 * 2: 二转职业（60级转职）
 * 3: 三转职业（166级转职）
 */
export const JOB_TIER_CONFIG = {
  // 0转 - 初心者
  beginner: { tier: 0, name: '初心者', iconPrefix: 'cxz' },

  // 1转 - 基础职业
  warrior: { tier: 1, name: '战士', iconPrefix: 'zs' },
  priest: { tier: 1, name: '圣职者', iconPrefix: 'ms' },
  mage: { tier: 1, name: '魔导士', iconPrefix: 'fs' },
  archer: { tier: 1, name: '弓箭手', iconPrefix: 'gjs' },

  // 2转 - 进阶职业
  knight: { tier: 2, name: '骑士', iconPrefix: 'qs' },
  blade_warrior: { tier: 2, name: '刀锋战士', iconPrefix: 'dfzs' },
  element_mage: { tier: 2, name: '元素使者', iconPrefix: 'yssz' },
  spirit_mage: { tier: 2, name: '精神使者', iconPrefix: 'jssz' },
  ranger: { tier: 2, name: '游侠', iconPrefix: 'yx' },
  assassin: { tier: 2, name: '暗杀者', iconPrefix: 'asz' },
  guardian: { tier: 2, name: '守护使者', iconPrefix: 'shsz' },
  technician: { tier: 2, name: '暴力技师', iconPrefix: 'bljs' },

  // 3转 - 大师级职业
  holy_knight: { tier: 3, name: '圣殿骑士', iconPrefix: 'sdqs' },
  storm_walker: { tier: 3, name: '猎杀者', iconPrefix: 'lsz' },
  arcane_master: { tier: 3, name: '奥术师', iconPrefix: 'ass' },
  mind_master: { tier: 3, name: '心灵师', iconPrefix: 'xls' },
  nature_messenger: { tier: 3, name: '炽天使', iconPrefix: 'cts' },
  combat_master: { tier: 3, name: '格斗宗师', iconPrefix: 'gdzs' },
  fierce_shooter: { tier: 3, name: '爆裂射手', iconPrefix: 'blss' },
  joker_emperor: { tier: 3, name: '暗夜主宰', iconPrefix: 'ayzz' }
}

/**
 * 转职等级对应的最低等级要求
 */
export const JOB_TIER_LEVEL_REQUIREMENTS = {
  0: 1,    // 初心者 1级开始
  1: 15,   // 一转需要 15级
  2: 60,   // 二转需要 60级
  3: 166   // 三转需要 166级
}

/**
 * 转职等级对应的中文名称
 */
export const JOB_TIER_NAMES = {
  0: '未转职',
  1: '一转',
  2: '二转',
  3: '三转'
}

/**
 * 各转职等级的职业列表
 */
export const JOBS_BY_TIER = {
  0: ['beginner'],
  1: ['warrior', 'priest', 'mage', 'archer'],
  2: ['knight', 'blade_warrior', 'element_mage', 'spirit_mage', 'ranger', 'assassin', 'guardian', 'technician'],
  3: ['holy_knight', 'storm_walker', 'arcane_master', 'mind_master', 'nature_messenger', 'combat_master', 'fierce_shooter', 'joker_emperor']
}

/**
 * 职业进阶路线
 * key: 当前职业, value: 可转职的目标职业列表
 */
export const JOB_EVOLUTION_PATHS = {
  // 0转 -> 1转
  beginner: ['warrior', 'priest', 'mage', 'archer'],

  // 1转 -> 2转
  warrior: ['knight', 'blade_warrior'],
  priest: ['guardian', 'technician'],
  mage: ['element_mage', 'spirit_mage'],
  archer: ['ranger', 'assassin'],

  // 2转 -> 3转
  knight: ['holy_knight'],
  blade_warrior: ['storm_walker'],
  guardian: ['nature_messenger', 'combat_master'],
  technician: ['nature_messenger', 'combat_master'],
  element_mage: ['arcane_master', 'mind_master'],
  spirit_mage: ['arcane_master', 'mind_master'],
  ranger: ['fierce_shooter'],
  assassin: ['joker_emperor']
}

export const useJobsStore = defineStore('jobs', {
  state: () => ({
    // 职业配置
    jobConfig: JOB_TIER_CONFIG,
    // 转职等级要求
    tierLevelRequirements: JOB_TIER_LEVEL_REQUIREMENTS,
    // 转职等级名称
    tierNames: JOB_TIER_NAMES,
    // 各等级职业列表
    jobsByTier: JOBS_BY_TIER,
    // 职业进阶路线
    evolutionPaths: JOB_EVOLUTION_PATHS
  }),

  getters: {
    /**
     * 获取职业转职等级
     * @param {string} classKey - 职业 key
     * @returns {number} 转职等级 (0-3)
     */
    getJobTier: state => classKey => {
      const config = state.jobConfig[classKey?.toLowerCase()]
      return config?.tier ?? 0
    },

    /**
     * 获取职业中文名称
     * @param {string} classKey - 职业 key
     * @returns {string} 职业中文名称
     */
    getJobName: state => classKey => {
      const config = state.jobConfig[classKey?.toLowerCase()]
      return config?.name ?? '未知职业'
    },

    /**
     * 获取职业图标前缀
     * @param {string} classKey - 职业 key
     * @returns {string} 图标文件前缀
     */
    getJobIconPrefix: state => classKey => {
      const config = state.jobConfig[classKey?.toLowerCase()]
      return config?.iconPrefix ?? 'cxz'
    },

    /**
     * 获取职业头像路径
     * @param {string} classKey - 职业 key
     * @param {string} gender - 性别 ('male' | 'female')
     * @returns {string} 头像路径
     */
    getJobAvatar: state => (classKey, gender = 'male') => {
      const config = state.jobConfig[classKey?.toLowerCase()]
      const iconPrefix = config?.iconPrefix ?? 'cxz'
      const genderSuffix = gender === 'female' ? 'nv' : 'nan'
      // 三转职业图片命名无_icon后缀
      const iconSuffix = config?.tier === 3 ? '' : '_icon'
      return `/pt/job_icon/${iconPrefix}_${genderSuffix}${iconSuffix}.png`
    },

    /**
     * 获取转职等级的中文名称
     * @param {number} tier - 转职等级 (0-3)
     * @returns {string} 转职等级名称
     */
    getTierName: state => tier => {
      return state.tierNames[tier] ?? '未知'
    },

    /**
     * 获取转职所需最低等级
     * @param {number} tier - 转职等级 (0-3)
     * @returns {number} 所需最低等级
     */
    getTierLevelRequirement: state => tier => {
      return state.tierLevelRequirements[tier] ?? 1
    },

    /**
     * 获取指定转职等级的所有职业
     * @param {number} tier - 转职等级 (0-3)
     * @returns {string[]} 职业列表
     */
    getJobsByTier: state => tier => {
      return state.jobsByTier[tier] ?? []
    },

    /**
     * 检查玩家是否需要转职
     * @param {object} player - 玩家对象
     * @returns {object} { needsJobChange: boolean, currentTier: number, requiredTier: number, message: string }
     */
    checkJobChangeRequired: state => player => {
      if (!player || !player.class) {
        return { needsJobChange: false, currentTier: 0, requiredTier: 0, message: '' }
      }

      const currentTier = state.getJobTier(player.class)
      const level = player.level ?? 0

      // 检查是否需要一转 (15级)
      if (level >= 15 && currentTier === 0) {
        return {
          needsJobChange: true,
          currentTier: 0,
          requiredTier: 1,
          message: '你已达到15级，请找到转职NPC进行一转，否则无法获取经验值！'
        }
      }

      // 检查是否需要二转 (60级)
      if (level >= 60 && currentTier === 1) {
        return {
          needsJobChange: true,
          currentTier: 1,
          requiredTier: 2,
          message: '你已达到60级，请找到转职NPC进行二转，否则无法获取经验值！'
        }
      }

      // 检查是否需要三转 (166级)
      if (level >= 166 && currentTier === 2) {
        return {
          needsJobChange: true,
          currentTier: 2,
          requiredTier: 3,
          message: '你已达到166级，请找到转职NPC进行三转，否则无法获取经验值！'
        }
      }

      return { needsJobChange: false, currentTier, requiredTier: currentTier, message: '' }
    },

    /**
     * 获取可转职的目标职业列表
     * @param {string} classKey - 当前职业 key
     * @returns {string[]} 可转职的职业列表
     */
    getAvailableEvolutions: state => classKey => {
      return state.evolutionPaths[classKey?.toLowerCase()] ?? []
    },

    /**
     * 获取所有一转职业（用于转职面板展示）
     * @returns {Array} 一转职业列表
     */
    allFirstJobs: state => {
      return state.jobsByTier[1].map(key => ({
        key,
        name: state.jobConfig[key]?.name ?? key,
        icon: state.getJobAvatar(key)
      }))
    },

    /**
     * 获取所有二转职业
     * @returns {Array} 二转职业列表
     */
    allSecondJobs: state => {
      return state.jobsByTier[2].map(key => ({
        key,
        name: state.jobConfig[key]?.name ?? key,
        icon: state.getJobAvatar(key)
      }))
    },

    /**
     * 获取所有三转职业
     * @returns {Array} 三转职业列表
     */
    allThirdJobs: state => {
      return state.jobsByTier[3].map(key => ({
        key,
        name: state.jobConfig[key]?.name ?? key,
        icon: state.getJobAvatar(key)
      }))
    }
  },

  actions: {
    /**
     * 判断职业是否属于指定转职等级
     * @param {string} classKey - 职业 key
     * @param {number} tier - 转职等级
     * @returns {boolean}
     */
    isJobOfTier (classKey, tier) {
      return this.getJobTier(classKey) === tier
    },

    /**
     * 判断职业是否为初心者
     * @param {string} classKey - 职业 key
     * @returns {boolean}
     */
    isBeginner (classKey) {
      return this.getJobTier(classKey) === 0
    },

    /**
     * 判断职业是否为一转职业
     * @param {string} classKey - 职业 key
     * @returns {boolean}
     */
    isFirstJob (classKey) {
      return this.getJobTier(classKey) === 1
    },

    /**
     * 判断职业是否为二转职业
     * @param {string} classKey - 职业 key
     * @returns {boolean}
     */
    isSecondJob (classKey) {
      return this.getJobTier(classKey) === 2
    },

    /**
     * 判断职业是否为三转职业
     * @param {string} classKey - 职业 key
     * @returns {boolean}
     */
    isThirdJob (classKey) {
      return this.getJobTier(classKey) === 3
    }
  }
})

// 导出便捷函数（可在非组件中使用）
export function getJobTier (classKey) {
  return JOB_TIER_CONFIG[classKey?.toLowerCase()]?.tier ?? 0
}

export function getJobName (classKey) {
  return JOB_TIER_CONFIG[classKey?.toLowerCase()]?.name ?? '未知职业'
}

export function getJobIconPrefix (classKey) {
  return JOB_TIER_CONFIG[classKey?.toLowerCase()]?.iconPrefix ?? 'cxz'
}
