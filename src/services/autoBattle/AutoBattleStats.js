/**
 * 自动战斗统计类
 * 负责战斗数据的统计和管理
 */
import { formatDuration } from '@/utils/timeUtils'

const debug = () => {}

export class AutoBattleStats {
  constructor () {
    this.reset()
  }

  reset () {
    this.stats = {
      totalAttacks: 0,
      totalDamage: 0,
      monstersDefeated: 0,
      skillsUsed: 0,
      startTime: null,
      endTime: null,
      lastAttackTime: null
    }

    debug('AutoBattleStats', '统计数据已重置')
  }

  startSession () {
    this.stats.startTime = Date.now()
    this.stats.endTime = null
    debug('AutoBattleStats', '统计会话已开始')
  }

  endSession () {
    this.stats.endTime = Date.now()
    debug('AutoBattleStats', '统计会话已结束')
  }

  incrementAttacks (damage = 0) {
    this.stats.totalAttacks++
    this.stats.totalDamage += damage
    this.stats.lastAttackTime = Date.now()
  }

  incrementMonstersDefeated () {
    this.stats.monstersDefeated++
  }

  incrementSkillsUsed () {
    this.stats.skillsUsed++
  }

  getTotalAttacks () {
    return this.stats.totalAttacks
  }

  getTotalDamage () {
    return this.stats.totalDamage
  }

  getMonstersDefeated () {
    return this.stats.monstersDefeated
  }

  getSkillsUsed () {
    return this.stats.skillsUsed
  }

  getStartTime () {
    return this.stats.startTime
  }

  getEndTime () {
    return this.stats.endTime
  }

  getLastAttackTime () {
    return this.stats.lastAttackTime
  }

  getDuration () {
    if (!this.stats.startTime) {
      return 0
    }

    const endTime = this.stats.endTime || Date.now()
    return endTime - this.stats.startTime
  }

  getAverageDamage () {
    if (this.stats.totalAttacks === 0) {
      return 0
    }
    return Math.floor(this.stats.totalDamage / this.stats.totalAttacks)
  }

  getAttacksPerSecond () {
    const duration = this.getDuration()
    if (duration === 0) {
      return 0
    }
    return (this.stats.totalAttacks / (duration / 1000)).toFixed(2)
  }

  getDamagePerSecond () {
    const duration = this.getDuration()
    if (duration === 0) {
      return 0
    }
    return Math.floor(this.stats.totalDamage / (duration / 1000))
  }

  getAllStats () {
    return {
      ...this.stats,
      duration: this.getDuration(),
      averageDamage: this.getAverageDamage(),
      attacksPerSecond: this.getAttacksPerSecond(),
      damagePerSecond: this.getDamagePerSecond()
    }
  }

  getFormattedStats () {
    const stats = this.getAllStats()

    return {
      总攻击次数: stats.totalAttacks,
      总伤害: stats.totalDamage,
      击败怪物: stats.monstersDefeated,
      使用技能: stats.skillsUsed,
      平均伤害: stats.averageDamage,
      攻击频率: `${stats.attacksPerSecond} 次/秒`,
      伤害输出: `${stats.damagePerSecond} 伤害/秒`,
      战斗时长: formatDuration(stats.duration)
    }
  }

  exportStats () {
    return JSON.stringify(this.getAllStats(), null, 2)
  }

  importStats (jsonString) {
    try {
      const imported = JSON.parse(jsonString)
      this.stats = { ...this.stats, ...imported }
      debug('AutoBattleStats', '统计数据已导入')
      return true
    } catch (error) {
      console.error('AutoBattleStats', '导入统计数据失败:', error)
      return false
    }
  }
}
