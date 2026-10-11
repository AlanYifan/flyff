/**
 * 技能系统数据 - 基于旧项目state.js重构
 * 包含所有职业的技能配置
 */

// 技能类型常量
export const SKILL_TYPES = {
  SINGLE: 'single', // 单体攻击
  AOE: 'aoe', // 范围攻击
  BUFF: 'buff', // 增益效果
  DEBUFF: 'debuff', // 减益效果
  HEAL: 'heal', // 治疗
  DOT: 'dot', // 持续伤害
  UTILITY: 'utility', // 功能技能
  SUMMON: 'summon' // 召唤生物
}

// 元素类型常量
export const ELEMENT_TYPES = {
  NONE: 'none',
  FIRE: 'fire',
  WATER: 'water',
  WIND: 'wind',
  EARTH: 'earth',
  ELECTRICITY: 'electricity'
}

// 技能基础配置
export const SKILL_CONFIG = {
  // ========== 初心者技能 ==========
  beginner: {
    // Q技能 - 弧月斩
    Q: {
      id: 'beginner_q',
      key: 'Q',
      name: '弧月斩',
      icon: '/pt/skill_icon/vagonecleanh.png',
      audio: '/sound/PcSkillD-clean hit.wav',
      description: '用武器给与敌人全力一击',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 10,
      cd: 3, // 冷却时间3秒
      manaCost: 5, // FP消耗5点
      unlockLevel: 3, // 3级解锁

      unlockCondition(player) {
        return player.level >= 3
      },

      // 熟练度系统
      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 10,
          increment: 10 // 每级增加10点伤害
        }
      },

      // 伤害计算函数
      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 10 + 10 * (skillLevel - 1)
        const strDamage = Number(player.stats.strength)
        return proficiencyDamage + player.attack * 0.1 + strDamage
      }
    },

    // W技能 - 疾风突刺
    W: {
      id: 'beginner_w',
      key: 'W',
      name: '疾风突刺',
      icon: '/pt/skill_icon/vagonebrandi.png',
      audio: '/sound/PcSkillD-brandish.wav',
      description: '用武器对敌人进行快速连续突刺',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 8,
      cd: 5,
      manaCost: 10,
      unlockLevel: 5,

      // 解锁条件：弧月斩达到3级
      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 2
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 8,
          increment: 8
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 8 + 8 * (skillLevel - 1)
        const strDamage = player.stats.strength * 0.4
        return proficiencyDamage + player.attack * 0.1 + strDamage
      }
    },

    // E技能 - 摘星斩
    E: {
      id: 'beginner_e',
      key: 'E',
      name: '摘星斩',
      icon: '/pt/skill_icon/vagoneovercu.png',
      audio: '/sound/PcSkillD-over cutter.wav',
      description: '聚集浑身之力对敌人造成较大伤害',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 25,
      cd: 8,
      manaCost: 30,
      unlockLevel: 10,

      // 解锁条件：疾风突刺达到3级
      unlockCondition(player) {
        return player.skills?.W?.proficiencyLevel >= 2
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 25,
          increment: 25
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 25 + 25 * (skillLevel - 1)
        const strDamage = Number(player.stats.strength)
        return proficiencyDamage + player.attack * 0.1 + strDamage
      }
    }
  },

  // ========== 战士技能 ==========
  warrior: {
    // Q技能 - 坚硬之石
    Q: {
      id: 'warrior_q',
      key: 'Q',
      name: '坚硬之石',
      icon: '/pt/skill_icon/mershiepanbar.png',
      audio: '/sound/PcSkillD-protection.wav',
      description: '用盾牌形成一道防护网，根据技能等级提供一定的防御力和格挡率加成',
      type: SKILL_TYPES.BUFF,
      cd: 3, // 冷却时间10秒
      manaCost: 20,
      buffDuration: 600, // 持续时间600秒（10分钟）
      unlockLevel: 50,

      unlockCondition(player) {
        return player.level >= 50
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'defense',
          defense: {
            base: 1, // 基础防御提升1%
            increment: 1, // 每级增加1%
            rate: true // 百分比加成
          },
          block: {
            base: 1, // 基础格挡提升1%
            increment: 1, // 每级增加1%
            rate: true // 百分比加成
          }
        }
      },

      // BUFF效果计算
      calculateBuff(player, skillLevel = 1) {
        const defenseBonus = 1 + 1 * (skillLevel - 1)
        const blockBonus = 1 + 1 * (skillLevel - 1)

        return {
          defense: { add: Math.min(defenseBonus, 20), rate: true }, // 最多20%
          blockRate: { add: Math.min(blockBonus, 20), rate: true } // 最多20%
        }
      }
    },

    // W技能 - 战神附体
    W: {
      id: 'warrior_w',
      key: 'W',
      name: '战神附体',
      icon: '/pt/skill_icon/mersupimpowe.png',
      audio: '/sound/PcSkillL-impower.wav',
      description: '依靠战神赐予的神力，大幅度增强武器上的属性攻击力',
      type: SKILL_TYPES.BUFF,
      cd: 5, // 冷却时间15秒
      manaCost: 50,
      buffDuration: 600,
      unlockLevel: 40,

      // 解锁条件：坚硬之石达到3级
      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 2 && player.level >= 40
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'elemental_attack',
          fire: { base: 1, increment: 1, rate: true },
          wind: { base: 1, increment: 1, rate: true },
          earth: { base: 1, increment: 1, rate: true },
          thunder: { base: 1, increment: 1, rate: true },
          water: { base: 1, increment: 1, rate: true }
        }
      },
      // BUFF效果计算
      calculateBuff(player, skillLevel = 1) {
        const bonus = 1 + 1 * (skillLevel - 1)
        return {
          fireAttack: { add: Math.min(bonus, 20), rate: true },
          windAttack: { add: Math.min(bonus, 20), rate: true },
          earthAttack: { add: Math.min(bonus, 20), rate: true },
          thunderAttack: { add: Math.min(bonus, 20), rate: true },
          waterAttack: { add: Math.min(bonus, 20), rate: true }
        }
      }
    },

    // E技能 - 战士之光
    E: {
      id: 'warrior_e',
      key: 'E',
      name: '战士之光',
      icon: '/pt/skill_icon/zfzg_gmsj.png',
      audio: ['/sound/PcSkillD-pan barrier-a.wav', '/sound/PcSkillD-Springatk.wav'],
      description: '大幅度提高使用者命中率和攻击力',
      type: SKILL_TYPES.BUFF,
      cd: 5,
      manaCost: 70,
      buffDuration: 3600,
      unlockLevel: 30,

      //坚硬之石等级达到3级
      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 3 && player.level >= 30
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'attack',
          hitRate: { base: 1, increment: 1, rate: true },
          attackMin: { base: 10, increment: 10, rate: false },
          attackMax: { base: 10, increment: 10, rate: false }
        }
      },

      calculateBuff(player, skillLevel = 1) {
        const hitRateBonus = 1 + 1 * (skillLevel - 1)
        const minAttackBonus = 10 + 10 * (skillLevel - 1)
        const maxAttackBonus = 10 + 10 * (skillLevel - 1)

        return {
          hitRate: { add: hitRateBonus, rate: true },
          attackMin: { add: minAttackBonus, rate: false },
          attackMax: { add: maxAttackBonus, rate: false }
        }
      }
    },

    // R技能 - 怒焰回旋
    R: {
      id: 'warrior_r',
      key: 'R',
      name: '怒焰回旋',
      icon: '/pt/skill_icon/meronesphit.png',
      audio: ['/sound/PcSkillM-SpecialHit.wav', '/sound/PcPatDDmg.wav'],
      description: '最大限度的利用身体的反作用力爆发出怒焰攻击对方',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 85,
      cd: 2,
      manaCost: 60,
      unlockLevel: 20,

      // 解锁条件：坚硬之石达到5级
      unlockCondition(player) {
        return player.level >= 20
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 85,
          increment: 85
        }
      },
      // 伤害计算函数
      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 85 + 85 * (skillLevel - 1)
        const strDamage = player.stats.strength * 3
        return proficiencyDamage + player.attack * 0.12 + strDamage
      }
    }
  },

  // ========== 圣职者技能 ==========
  priest: {
    // Q技能 - 月光惩戒
    Q: {
      id: 'priest_q',
      key: 'Q',
      name: '月光惩戒',
      icon: '/pt/skill_icon/asschemoonbeam.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '借助月神之力惩戒目标。DeBuff持续期间，目标受到的所有伤害将会增加',
      type: SKILL_TYPES.DOT,
      element: ELEMENT_TYPES.WATER,
      damage: 650,
      cd: 8,
      manaCost: 20,
      duration: 9, // DOT持续时间9秒
      tickInterval: 1, // DOT频率1秒
      dotEffect: {
        name: '月光惩戒',
        duration: 9,
        tickInterval: 1,
        damageRate: 1.0 // DOT每跳造成100%基础伤害
      },
      unlockLevel: 15,

      unlockCondition(player) {
        return player.level >= 15
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 650,
          increment: 15,
          dotBase: 650,
          dotIncrement: 15,
          effectValueBase: 1, // 特殊效果基础值1%
          effectValueIncrement: 7 // 每级增加7%
        }
      },

      /**
       * 伤害计算（考虑元素克制）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能等级
       * @param {string} enemyElement - 敌人元素属性
       * @returns {number} 计算后的伤害值
       */
      calculateDamage(player, skillLevel = 1, enemyElement = null) {
        const proficiencyDamage = this.damage + 15 * (skillLevel - 1)
        const safeStats = player?.stats || {}
        const intelligence = safeStats.intelligence || 0
        const intDamage = intelligence * 3.5
        const attack = player?.attack || 0
        const baseDamage = proficiencyDamage + attack * 0.12 + intDamage

        // 应用元素克制（简化版本，实际需要完整函数）
        return baseDamage
      },

      /**
       * DOT伤害计算
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能等级
       * @returns {number} 计算后的DOT伤害值
       */
      calculateDotDamage(player, skillLevel = 1) {
        const proficiencyDamage = this.damage + 15 * (skillLevel - 1)
        const safeStats = player?.stats || {}
        const intelligence = safeStats.intelligence || 0
        const intDamage = intelligence * 3.88
        const attack = player?.attack || 0
        return proficiencyDamage + attack * 0.12 + intDamage
      },

      // 特殊效果：增加承受伤害
      calculateEffect(skillLevel = 1) {
        const baseEffect = 1
        const incrementEffect = 7
        const currentValue = baseEffect + incrementEffect * (skillLevel - 1)
        return Math.min(currentValue, 8) // 最多增加8%承受伤害
      }
    },

    // W技能 - 治疗术
    W: {
      id: 'priest_w',
      key: 'W',
      name: '治疗术',
      icon: '/pt/skill_icon/assheahealin.png',
      audio: ['/sound/PcSkillCastHeal.wav', '/sound/PCSkillM-Healing.wav'],
      description: '借助魔棒产生微量圣光治疗目标的伤势。',
      type: SKILL_TYPES.HEAL,
      cd: 0.5,
      heal: 580,
      manaCost: 34,
      unlockLevel: 15,

      unlockCondition(player) {
        return player.level >= 15
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'healing',
          base: 580,
          increment: 50
        }
      },

      calculateHealing(player, skillLevel = 1) {
        const proficiencyHealing = 580 + 50 * (skillLevel - 1)
        const intHealing = player.stats.intelligence * 5.84
        return Math.floor(proficiencyHealing + intHealing)
      }
    },

    // E技能 - 全能祝福
    E: {
      id: 'priest_e',
      key: 'E',
      name: '全能祝福',
      icon: '/pt/skill_icon/qnzf.png',
      audio: [
        '/sound/PCSkillCastCheer.wav',
        '/sound/PcSkillM-Patience.wav',
        '/sound/PcSkillL-quickstep.wav',
        '/sound/PcSkillL-mentalsign.wav',
        '/sound/PcSkillM-Haste.wav',
        '/sound/PcSkillM-Heapup.wav',
        '/sound/PcSkillL-stonehand.wav',
        '/sound/PcSkillL-catsreflex.wav',
        '/sound/PcSkillL-beefup.wav',
        '/sound/PcSkillM-Cannonball.wav',
        '/sound/PcSkillL-accurace.wav'
      ],
      description: '召唤圣光，赐福施法对象施加十位一体的全能祝福。',
      type: SKILL_TYPES.BUFF,
      isTeamBuff: true, // 群体BUFF：施放给全队
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 100,
      buffDuration: 250,
      unlockLevel: 20,

      // 解锁条件：月光惩戒达到3级
      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 3 && player.level >= 20
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'multi_buff',
          subSkills: {
            lifeSpring: {
              name: '生命之泉',
              description: '生命上限',
              rate: true,
              type: 'maxHealthPercentage',
              base: 0.5,
              increment: 0.5,
              max: 10
            },
            skyHorse: {
              name: '天马行空',
              description: '移动速度',
              rate: true,
              type: 'moveSpeedPercentage',
              base: 1,
              increment: 1,
              max: 20
            },
            intellectSpell: {
              name: '智力术',
              description: '智力',
              rate: false,
              type: 'intelligence',
              base: 1,
              increment: 1,
              max: 20
            },
            efficiencySpell: {
              name: '高效术',
              description: '攻击 & 施法速度',
              rate: true,
              type: 'attackCastSpeedPercentage',
              base: 0.5,
              increment: 0.5,
              max: 10
            },
            constitutionSpell: {
              name: '强身术',
              description: '体质',
              rate: false,
              type: 'constitution',
              base: 1,
              increment: 1,
              max: 20
            },
            stunSpell: {
              name: '昏厥术',
              description: '击晕概率',
              rate: true,
              type: 'stunChance',
              base: 0.5,
              increment: 0.5,
              max: 10
            },
            blockSpell: {
              name: '躲避术',
              description: '格挡率',
              rate: true,
              type: 'blockRate',
              base: 0.5,
              increment: 0.5,
              max: 10
            },
            strengthSpell: {
              name: '力量术',
              description: '力量',
              rate: false,
              type: 'strength',
              base: 1,
              increment: 1,
              max: 20
            },
            agilitySpell: {
              name: '敏捷术',
              description: '敏捷',
              rate: false,
              type: 'agility',
              base: 1,
              increment: 1,
              max: 20
            },
            hitRateSpell: {
              name: '命中术',
              description: '命中率',
              rate: true,
              type: 'hitRate',
              base: 1,
              increment: 1,
              max: 20
            }
          }
        }
      },

      // 获取持续时间（基础时间 + 智力加成）
      getBuffDuration(intelligence) {
        return 250 + intelligence * 2
      },

      // 计算BUFF持续时间（供 SkillEffectService 调用）
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础250秒 + 每25智力增加50秒持续时间
        return 250 + Math.floor(intelligence / 25) * 50
      },

      // 计算BUFF效果
      calculateBuff(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        const subSkills = this.proficiency.effect.subSkills
        const results = {}

        for (const [key, skill] of Object.entries(subSkills)) {
          const baseEffect = skill.base * skillLevel
          const intBonus = Math.floor(intelligence / 25) * skill.base
          const finalValue = Math.min(baseEffect + intBonus, skill.max)

          results[key] = {
            name: skill.name,
            type: skill.type,
            value: finalValue
          }
        }

        return results
      }
    },

    // R技能 - 圣光大地
    R: {
      id: 'priest_r',
      key: 'R',
      name: '圣光大地',
      icon: '/pt/skill_icon/assknuburstc.png',
      audio: [
        '/sound/PcSkillm_Junkarrow01.wav',
        '/sound/PcPatDDmg.wav',
        '/sound/PcSkillD-Tampinghole.wav'
      ],
      description: '将大量的圣光之力聚集在武器击向地面，对所有敌人造成伤害',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 550,
      cd: 1,
      manaCost: 50,
      unlockLevel: 25,

      // 解锁条件：治疗术达到3级
      unlockCondition(player) {
        return player.skills?.W?.proficiencyLevel >= 2 && player.level >= 25
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 550,
          increment: 30
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 30 + 30 * (skillLevel - 1)
        const attributeBonus = player.stats.strength * 3 + player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + attributeBonus
      }
    }
  },

  // ========== 魔导士技能 ==========
  mage: {
    // // Q技能 - 灵波幻想
    // Q: {
    //   id: 'mage_q',
    //   key: 'Q',
    //   name: '灵波幻想',
    //   icon: '/pt/skill_icon/magmagmental.png',
    //   audio: '/sound/PcSkillL-nomalmagic.wav',
    //   description: '给对象施加无属性的精神压力',
    //   type: SKILL_TYPES.SINGLE,
    //   element: ELEMENT_TYPES.NONE,
    //   damage: 38,
    //   cd: 2,
    //   manaCost: 15,
    //   unlockLevel: 15,

    //   unlockCondition (player) {
    //     return player.level >= 15
    //   },

    //   proficiency: {
    //     level: 1,
    //     exp: 0,
    //     maxLevel: 20,
    //     effect: {
    //       type: 'damage',
    //       base: 38,
    //       increment: 38
    //     }
    //   },

    //   calculateDamage (player, skillLevel = 1) {
    //     const proficiencyDamage = 38 + 38 * skillLevel
    //     const intDamage = player.stats.intelligence * 2.5
    //     return proficiencyDamage + player.attack * 0.12 + intDamage
    //   }
    // },

    // W技能 - 灼烈幻火
    W: {
      id: 'mage_w',
      key: 'W',
      name: '灼烈幻火',
      icon: '/pt/skill_icon/magfirestrike.png',
      audio: ['/sound/PcSkillL-firemagic.wav', '/sound/PcSkillM-Firestk.wav'],
      description: '召唤灼热的火焰攻击敌人',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.FIRE,
      damage: 50,
      cd: 0.5,
      manaCost: 50,
      manaCostPerLevel: 1,
      unlockLevel: 15,

      // 解锁条件：灵波幻想达到2级
      unlockCondition(player) {
        return player.level >= 15
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        const intDamage = player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + intDamage
      }
    },

    // E技能 - 风之利刃
    E: {
      id: 'mage_e',
      key: 'E',
      name: '风之利刃',
      icon: '/pt/skill_icon/magwindcutter.png',
      audio: ['/sound/PcSkillL-windmagic.wav', '/sound/PcSkillM-Windcutter.wav'],
      description: '用锋利的风刃攻击敌人',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.WIND,
      damage: 50,
      cd: 0.5,
      manaCost: 50,
      manaCostPerLevel: 1,
      unlockLevel: 15,

      // 解锁条件：灵波幻想达到3级，灼烈幻火达到2级
      unlockCondition(player) {
        return (
          player.level >= 15
        )
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        const intDamage = player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + intDamage
      }
    },

    // R技能 - 激流冲击
    R: {
      id: 'mage_r',
      key: 'R',
      name: '激流冲击',
      icon: '/pt/skill_icon/magspringwater.png',
      audio: '/sound/PcSkillL-watermagic.wav',
      description: '形成强力的水柱攻击敌人',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.WATER,
      damage: 50,
      cd: 0.5,
      manaCost: 50,
      manaCostPerLevel: 1,
      unlockLevel: 15,

      // 解锁条件：灵波幻想达到4级，风之利刃达到3级
      unlockCondition(player) {
        return (
          player.level >= 15
        )
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        const intDamage = player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + intDamage
      }
    },

    // T技能 - 电闪雷鸣
    T: {
      id: 'mage_t',
      key: 'T',
      name: '电闪雷鸣',
      icon: '/pt/skill_icon/eleelethunst.png',
      audio: '/sound/PcSkillL-electmagic.wav',
      description: '唤起闪电强力攻击敌人',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.ELECTRICITY,
      damage: 50,
      cd: 0.5,
      manaCost: 50,
      manaCostPerLevel: 1,
      unlockLevel: 15,

      // 解锁条件：灵波幻想达到5级，激流冲击达到4级
      unlockCondition(player) {
        return (
          player.level >= 15
        )
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        const intDamage = player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + intDamage
      }
    },

    // Y技能 - 移山之术
    Y: {
      id: 'mage_y',
      key: 'Y',
      name: '移山之术',
      icon: '/pt/skill_icon/magrockcrash.png',
      audio: '/sound/PcSkillL-earthmagic.wav',
      description: '召唤巨大的岩石掷向敌人',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.EARTH,
      damage: 50,
      cd: 0.5,
      manaCost: 50,
      manaCostPerLevel: 1,
      unlockLevel: 15,

      // 解锁条件：灵波幻想达到6级，电闪雷鸣达到5级
      unlockCondition(player) {
        return (
          player.level >= 15
        )
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        const intDamage = player.stats.intelligence * 3
        return proficiencyDamage + player.attack * 0.12 + intDamage
      }
    }
  },

  // ========== 弓箭手技能 ==========
  archer: {
    // Q技能 - 轮术&弓术精通
    Q: {
      id: 'archer_q',
      key: 'Q',
      name: '轮术&弓术精通',
      icon: '/pt/skill_icon/wqjt.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '暂时提升攻击力,持续60分钟。',
      type: SKILL_TYPES.BUFF,
      cd: 15,
      manaCost: 50,
      buffDuration: 3600, // 60分钟
      unlockLevel: 15,

      unlockCondition(player) {
        return player.level >= 15
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'weapon_attack',
          base: 5,
          increment: 5
        }
      },

      calculateBuff(player, skillLevel = 1) {
        return { add: 5 + 5 * (skillLevel - 1), rate: false }
      }
    },

    // W技能 - 绝对闪避
    W: {
      id: 'archer_w',
      key: 'W',
      name: '绝对闪避',
      icon: '/pt/skill_icon/acrsupblock.png',
      audio: '/sound/PcSkillM-Absoluteblock01.wav',
      description: '提高格挡敌人的概率，持续10分钟。',
      type: SKILL_TYPES.BUFF,
      cd: 30,
      manaCost: 50,
      buffDuration: 600, // 10分钟
      unlockLevel: 25,

      // 解锁条件：轮术&弓术精通达到3级
      unlockCondition(player) {

        return player.level >= 25
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'block',
          base: 1,
          increment: 1
        }
      },

      calculateBuff(player, skillLevel = 1) {
        return { add: 1 + 1 * (skillLevel - 1), rate: true }
      }
    },

    // E技能 - 箭雨
    E: {
      id: 'archer_e',
      key: 'E',
      name: '箭雨',
      icon: '/pt/skill_icon/acrbowrain.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '向空中射出箭雨，落在周围的敌人身上，并造成短暂流血',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 350,
      cd: 10,
      manaCost: 60,
      duration: 5,
      attackInterval: 0.5,
      dotEffect: {
        name: '流血',
        duration: 10,
        tickInterval: 2,
        damageRate: 0.3, // 每次tick造成30%技能总伤害
        canCrit: true
      },
      unlockLevel: 20,

      // 解锁条件：
      unlockCondition(player) {
        return (
          player.level >= 20
        )
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 20,
        effect: {
          type: 'damage',
          base: 350,
          increment: 350
        }
      },

      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 350 + 350 * (skillLevel - 1)
        const agilityDamage = player.stats.agility * 1.28
        return proficiencyDamage + player.attack * 0.12 + agilityDamage
      }
    }
  },

  // ========== 骑士技能 ==========
  knight: {
    /**
     * Q技能 - 大地共鸣
     * 打击地面制造冲击波攻击周围敌人，一定几率击晕附近敌人
     */
    Q: {
      id: 'knight_q',
      key: 'Q',
      name: '大地共鸣',
      icon: '/pt/skill_icon/blddaxspring.png',
      audio: ['/sound/PcSkillD-Powerstump.wav', '/sound/PcPatDDmg.wav'],
      description: '打击地面制造冲击波攻击周围敌人，一定几率击晕附近敌人。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.EARTH,
      damage: 500,
      cd: 2,
      manaCost: 88,
      unlockLevel: 60,

      // DEBUFF配置：击晕效果
      debuff: {
        type: 'stun',
        chance: 15, // 15%概率击晕
        effect: {
          type: 'stun',
          duration: 2, // 击晕持续2秒
          icon: '/pt/UI/stun_stars.svg' // 击晕星星图标
        }
      },

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 124,
          increment: 85 // 每级增加85伤害
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害 + 熟练度伤害 + 力量 * 5.18 + 攻击力
       * 熟练度伤害：1级+85，10级+850
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        const proficiencyDamage = 85 * skillLevel // 1级85，10级850
        const strDamage = player.stats.strength * 5.18
        return Math.floor(baseDamage + proficiencyDamage + strDamage + player.attack * 0.16)
      },

      /**
       * 计算击晕概率（固定15%）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 15 // 固定15%概率
      }
    },

    /**
     * W技能 - 碎甲
     * 用武器猛击敌人的盔甲，短时间内降低对方防御力，并增加承受伤害效果
     */
    W: {
      id: 'knight_w',
      key: 'W',
      name: '碎甲',
      icon: '/pt/skill_icon/knttaxpaidea.png',
      audio: '/sound/PcPatDDmg.wav',
      description: '用武器猛击敌人的盔甲，短时间内降低对方防御力，并增加承受伤害效果。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 104,
      cd: 30,
      manaCost: 83,
      unlockLevel: 65,

      // DEBUFF配置：碎甲效果（防御力降低 + 承受伤害增加）
      debuff: {
        type: 'armorBreak',
        effect: {
          type: 'armorBreak',
          baseDuration: 20, // 基础持续时间20秒
          icon: '/pt/skill_icon/knttaxpaidea.png' // 使用技能图标
        }
      },

      unlockCondition(player) {
        return player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'armorBreak',
          baseDefenseReduction: 2, // 1级防御力-2%
          baseDamageIncrease: 1, // 1级承受伤害+1%
          incrementDefenseReduction: 2, // 每级增加2%
          incrementDamageIncrease: 1 // 每级增加1%
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害 + 熟练度伤害 + 力量 * 5.18
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        const proficiencyDamage = 20 * skillLevel // 每级增加20伤害
        const strDamage = player.stats.strength * 5.18
        return Math.floor(baseDamage + proficiencyDamage + strDamage + player.attack * 0.16)
      },

      /**
       * 计算碎甲DEBUFF效果
       * @param {number} skillLevel - 技能等级
       * @param {Object} player - 玩家对象
       * @returns {Object} DEBUFF效果参数
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        // 防御力降低：1级2%，10级20%
        const defenseReduction = 2 + (skillLevel - 1) * 2
        // 承受伤害增加：1级1%，10级10%
        const damageIncrease = 1 + (skillLevel - 1) * 1
        // 持续时间：基础20秒 + 力量/10（每10点力量增加1秒）
        const baseDuration = 20
        const strBonus = player ? Math.floor(player.stats.strength / 10) : 0
        const duration = baseDuration + strBonus

        return {
          defenseReduction, // 百分比
          damageIncrease, // 百分比
          duration // 秒
        }
      }
    },

    E: {
      id: 'knight_e',
      key: 'E',
      name: '狂暴之心',
      icon: '/pt/skill_icon/mersupfury.png',
      audio: '/sound/PcSkillD-blindside.wav',
      description: '获得狂暴之力，激活时每次普通攻击消耗1%最大MP值。',
      type: SKILL_TYPES.BUFF,
      cd: 3,
      manaCost: 90,
      buffDuration: 600, // 基础10分钟
      unlockLevel: 70,

      /**
       * BUFF效果配置
       */
      buff: {
        type: 'frenzy',
        effect: {
          type: 'frenzy',
          baseDuration: 600, // 10分钟 = 600秒
          icon: '/pt/skill_icon/mersupfury.png',
          mpCostPerAttack: 1 // 每次普攻消耗1%最大MP
        }
      },

      unlockCondition(player) {
        return player.level >= 70
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'frenzy',
          baseHitRate: 1.5, // 1级命中率+1.5%
          baseAttackSpeed: 1.5, // 1级攻击速度+1.5%
          baseCritRate: 1.5, // 1级暴击率+1.5%
          incrementHitRate: 1.5, // 每级增加1.5%
          incrementAttackSpeed: 1.5, // 每级增加1.5%
          incrementCritRate: 1.5 // 每级增加1.5%
        }
      },

      /**
       * 计算BUFF效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能等级
       * @returns {Object} BUFF效果参数
       */
      calculateBuff(player, skillLevel = 1) {
        // 命中率：1级1.5%，10级15%
        const hitRateBonus = 1.5 + (skillLevel - 1) * 1.5
        // 攻击速度：1级1.5%，10级15%
        const attackSpeedBonus = 1.5 + (skillLevel - 1) * 1.5
        // 暴击率：1级1.5%，10级15%
        const critRateBonus = 1.5 + (skillLevel - 1) * 1.5
        // 持续时间：基础10分钟 + 力量/25（每25点力量增加1分钟）
        const baseDuration = 600 // 10分钟
        const strBonus = player ? Math.floor(player.stats.strength / 25) * 60 : 0 // 每分钟60秒
        const duration = baseDuration + strBonus

        return {
          hitRate: { add: hitRateBonus, rate: true }, // 命中率加成（百分比）
          attackSpeed: { add: attackSpeedBonus, rate: true }, // 攻击速度加成（百分比）
          critRate: { add: critRateBonus, rate: true }, // 暴击率加成（百分比）
          duration, // 秒
          mpCostPerAttack: { add: 1, rate: true } // 每次普攻消耗1%最大MP（百分比）
        }
      }
    },

    /**
     * R技能 - 双倍惩戒（被动技能）
     * 攻击时概率为所有敌人添加双倍惩戒效果，被击中后该次伤害最终伤害X2倍
     * 一旦被击中该DEBUFF效果消失
     */
    R: {
      id: 'knight_r',
      key: 'R',
      name: '双倍惩戒',
      icon: '/pt/skill_icon/rinsupcross.png',
      audio: null, // 暂无音效
      description: '被动技能：攻击时有25%概率为所有敌人添加双倍惩戒效果，下次被击中时伤害翻倍，随后效果消失。',
      type: SKILL_TYPES.BUFF,
      isPassive: true, // 标记为被动技能
      cd: 0.5, // 被动技能无冷却
      manaCost: 0, // 被动技能不消耗MP
      unlockLevel: 80,

      // DEBUFF配置：双倍惩戒效果
      debuff: {
        type: 'doubleJudgment',
        chance: 25, // 25%概率触发
        effect: {
          type: 'doubleJudgment',
          duration: 5, // 持续5秒，或被击中后消失
          icon: '/pt/skill_icon/rinsupcross.png',
          damageMultiplier: 2 // 伤害翻倍
        }
      },

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1, // 固定1级，无熟练度提升
        effect: {
          type: 'doubleJudgment',
          baseChance: 25, // 固定25%概率
          baseDamageMultiplier: 2 // 固定双倍伤害
        }
      },

      /**
       * 计算DEBUFF触发概率（固定25%）
       * @param {number} skillLevel - 技能等级（保留参数兼容，实际不使用）
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 25 // 固定25%概率触发
      },

      /**
       * 获取伤害倍率（固定2倍）
       * @param {number} skillLevel - 技能等级
       * @returns {number} 伤害倍率
       */
      getDamageMultiplier(skillLevel = 1) {
        return 2 // 固定双倍伤害
      }
    },

    /**
     * T技能 - 牺牲
     * 一段时间内承受伤害增加，大幅提高攻击力与格挡穿透
     * 效果：攻击力+2%~20%(按熟练度)，自身承伤+2%~20%，格挡穿透+2%~20%
     * 持续时间：基础5分钟 + 力量 * 2 秒
     */
    T: {
      id: 'knight_t',
      key: 'T',
      name: '牺牲',
      icon: '/pt/skill_icon/kntsuprage.png',
      audio: '/sound/PcSkillL-prevention.wav',
      description: '一段时间内承受伤害增加，大幅提高攻击力与格挡穿透。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 3,
      manaCost: 88,
      buffDuration: 300, // 基础5分钟 = 300秒
      unlockLevel: 90,

      // BUFF效果配置
      buff: {
        type: 'sacrifice',
        effect: {
          type: 'sacrifice',
          baseDuration: 300, // 基础5分钟
          icon: '/pt/skill_icon/kntsuprage.png'
        }
      },

      unlockCondition(player) {
        return player.level >= 90
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'sacrifice',
          // 攻击力百分比加成：1级2%，10级20%
          attackMin: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true
          },
          attackMax: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true
          },
          // 自身承伤增加：1级2%，10级20%
          damageTakenIncrease: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true
          },
          // 格挡穿透：1级2%，10级20%
          blockPenetration: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true
          }
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础5分钟 + 力量 * 2 秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础300秒 + 力量 * 2 秒
        return 300 + Math.floor(strength * 2)
      },

      /**
       * 计算BUFF效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 攻击力加成：1级2%，10级20%
        const attackBonus = Math.min(2 + (skillLevel - 1) * 2, 20)
        // 自身承伤增加：1级2%，10级20%
        const damageTakenIncrease = Math.min(2 + (skillLevel - 1) * 2, 20)
        // 格挡穿透：1级2%，10级20%
        const blockPenetration = Math.min(2 + (skillLevel - 1) * 2, 20)

        return {
          // 最小攻击力百分比加成
          attackMin: attackBonus,
          // 最大攻击力百分比加成
          attackMax: attackBonus,
          // 自身承伤增加（百分比）
          damageTakenIncrease: damageTakenIncrease,
          // 格挡穿透（百分比）
          blockPenetration: blockPenetration
        }
      },
      // 标记 BUFF 效果为百分比加成
      buffRate: true
    },

    /**
     * U技能 - 卡兰铎的祝福
     * 传承于骑士大师-卡兰铎的意志,使防御力,体魄大幅提升,且提升双倍惩戒概率
     * 默认持续时间1分钟,10点力量+1秒持续时间
     * 1级熟练度: +10体质, 防御力+2.5%(对应玩家属性提升最小防御力,最大防御力), 双倍惩戒概率+2.5%
     * 10级熟练度: +100体质, 防御力+25%, 双倍惩戒概率+25%, 熟练度大圆满时最大生命值+15%
     */
    U: {
      id: 'knight_u',
      key: 'U',
      name: '卡兰铎的祝福',
      icon: '/pt/skill_icon/kalanduodezhufu .png',
      audio: '/sound/PcSkillL-prevention.wav',
      description: '传承于骑士大师-卡兰铎 的意志,使防御力,体魄大幅提升,且 提升双倍惩戒概率,助你成为最坚实的后盾~',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 150,
      buffDuration: 60, // 基础持续时间1分钟
      unlockLevel: 100,

      // BUFF效果配置
      buff: {
        type: 'kalanduo_blessing',
        effect: {
          type: 'kalanduo_blessing',
          baseDuration: 60, // 基础1分钟
          icon: '/pt/skill_icon/kalanduodezhufu .png'
        }
      },

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'kalanduo_blessing',
          // 体质加成：10 * 技能等级，最高100
          constitution: {
            base: 10,
            increment: 10,
            rate: false // 固定值加成
          },
          // 最小防御力百分比加成：2.5% * 技能等级，最高25%
          defenseMin: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: true // 百分比加成
          },
          // 最大防御力百分比加成：2.5% * 技能等级，最高25%
          defenseMax: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: true // 百分比加成
          },
          // 双倍惩戒概率加成：2.5% * 技能等级，最高25%
          doubleJudgmentChance: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: false // 固定值加成（百分比点）
          },
          // 最大生命值百分比加成：仅10级（大圆满）时追加15%
          maxHealth: {
            base: 0,
            increment: 0,
            max: 15,
            rate: true // 百分比加成
          }
        }
      },

      /**
       * 计算MP消耗
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        // 固定150 MP消耗
        return 150
      },

      /**
       * 计算BUFF持续时间
       * 基础60秒 + 每10点力量增加1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础60秒 + 每10点力量增加1秒
        return 60 + Math.floor(strength / 10)
      },

      /**
       * 计算BUFF效果
       * 1级: +10体质, 防御力+2.5%, 双倍惩戒概率+2.5%
       * 10级: +100体质, 防御力+25%, 双倍惩戒概率+25%, 最大生命值+15%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 体质加成：10 * 技能等级，最高100
        const constitutionBonus = 10 * skillLevel
        // 防御力百分比加成：2.5% * 技能等级，最高25%
        const defensePercent = Math.min(2.5 * skillLevel, 25)
        // 双倍惩戒概率加成：2.5% * 技能等级，最高25%
        const doubleJudgmentChanceBonus = Math.min(2.5 * skillLevel, 25)
        // 最大生命值百分比加成：仅10级（大圆满）时追加15%
        const maxHealthPercent = skillLevel >= 10 ? 15 : 0

        return {
          // 体质固定值加成
          constitution: constitutionBonus,
          // 最小防御力百分比加成
          defenseMin: { add: defensePercent, rate: true },
          // 最大防御力百分比加成
          defenseMax: { add: defensePercent, rate: true },
          // 双倍惩戒概率固定值加成（百分比点）
          doubleJudgmentChance: doubleJudgmentChanceBonus,
          // 最大生命值百分比加成（仅大圆满时生效）
          maxHealth: { add: maxHealthPercent, rate: true }
        }
      }
    }
  },

  // ========== 刀锋战士技能 ==========
  blade_warrior: {
    /**
     * Q技能 - 刀剑乱舞
     * 挥舞手中的武器攻击周围所有敌人
     * 伤害公式：基础伤害 + 熟练度伤害 + 敏捷 × 4.98 + 攻击力
     */
    Q: {
      id: 'blade_warrior_q',
      key: 'Q',
      name: '刀剑乱舞',
      icon: '/pt/skill_icon/blddswblddan.png',
      audio: ['/sound/PcSkillD-Bladedance.wav', '/sound/PcPatDDmg.wav'],
      description: '挥舞手中的武器攻击周围所有敌人。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 130,
      cd: 2,
      manaCost: 83,
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 65,
          increment: 65
        }
      },

      /**
       * 计算技能伤害
       * 公式: 基础伤害 + 熟练度伤害 + 敏捷 × 4.98 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {number} 最终伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        // 熟练度伤害：1级65，每级+65，10级650
        const proficiencyDamage = 65 + 65 * (skillLevel - 1)
        // 敏捷加成：敏捷 × 4.98
        const dexDamage = player.stats.dexterity * 4.98
        return baseDamage + proficiencyDamage + dexDamage + player.attack * 0.16
      }
    },

    /**
     * W技能 - 狂暴
     * 获得狂暴之力增加命中率、攻击速度和攻击力、格挡穿透，并降低防御力
     * 持续时间：基础3分钟 + 力量 / 4 秒
     */
    W: {
      id: 'blade_warrior_w',
      key: 'W',
      name: '狂暴',
      icon: '/pt/skill_icon/bldsupberser.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '获得狂暴之力增加命中率、攻击速度和攻击力、格挡穿透，并降低防御力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 3,
      manaCost: 150,
      buffDuration: 180, // 基础3分钟 = 180秒
      unlockLevel: 60,

      // BUFF效果配置
      buff: {
        type: 'berserk',
        effect: {
          type: 'berserk',
          baseDuration: 180, // 基础3分钟
          icon: '/pt/skill_icon/bldsupberser.png'
        }
      },

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'berserk',
          // 命中率加成：1级2.5%，10级25%
          hitRate: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: true
          },
          // 攻击速度加成：1级2.5%，10级25%
          attackSpeed: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: true
          },
          // 攻击力加成：1级2%，10级20%
          attackMin: {
            base: 2,
            increment: 2.5,
            max: 25,
            rate: true
          },
          attackMax: {
            base: 2,
            increment: 2.5,
            max: 25,
            rate: true
          },
          // 格挡穿透：1级2.5%，10级25%
          blockPenetration: {
            base: 2.5,
            increment: 2.5,
            max: 25,
            rate: true
          },
          // 防御力降低：1级5%，10级50%（负数表示降低）
          defenseMin: {
            base: -5,
            increment: -5,
            max: -50,
            rate: true
          },
          defenseMax: {
            base: -5,
            increment: -5,
            max: -50,
            rate: true
          }
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础3分钟 + 每4点力量+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础180秒 + 力量 / 4 秒
        return 180 + Math.floor(strength / 4)
      },

      /**
       * 计算BUFF效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 命中率加成：1级2.5%，10级25%
        const hitRateBonus = Math.min(2.5 + (skillLevel - 1) * 2.5, 25)
        // 攻击速度加成：1级2.5%，10级25%
        const attackSpeedBonus = Math.min(2.5 + (skillLevel - 1) * 2.5, 25)
        // 攻击力加成：1级2.5%，10级25%
        const attackBonus = Math.min(2.5 + (skillLevel - 1) * 2.5, 25)
        // 格挡穿透：1级2.5%，10级25%
        const blockPenetration = Math.min(2.5 + (skillLevel - 1) * 2.5, 25)
        // 防御力降低：1级5%，10级50%
        const defenseReduction = Math.max(-5 - (skillLevel - 1) * 5, -50)

        return {
          // 命中率百分比加成
          hitRate: hitRateBonus,
          // 攻击速度百分比加成
          attackSpeed: attackSpeedBonus,
          // 最小攻击力百分比加成
          attackMin: attackBonus,
          // 最大攻击力百分比加成
          attackMax: attackBonus,
          // 格挡穿透（百分比）
          blockPenetration: blockPenetration,
          // 最小防御力百分比变化（负数表示降低）
          defenseMin: defenseReduction,
          // 最大防御力百分比变化（负数表示降低）
          defenseMax: defenseReduction
        }
      },
      // 标记 BUFF 效果为百分比加成
      buffRate: true
    },

    /**
     * E技能 - 夜幕降临
     * 弹跳重击，降低目标命中率
     * 伤害公式：基础伤害 + 熟练度伤害 + 力量 × 5.18 + 敏捷 × 3.18 + 攻击力
     */
    E: {
      id: 'blade_warrior_e',
      key: 'E',
      name: '夜幕降临',
      icon: '/pt/skill_icon/blddaxhawatt.png',
      audio: '/sound/PcPatDDmg.wav',
      description: '弹跳重击，降低目标命中率。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 130,
      cd: 10,
      manaCost: 98,
      duration: 15, // DEBUFF持续时间15秒
      unlockLevel: 90,

      // DEBUFF配置：命中率减少
      debuff: {
        type: 'hitRateReduction',
        chance: 100, // 必定触发
        effect: {
          type: 'hitRateReduction',
          duration: 15, // 15秒持续时间
          getValue: (skillLevel) => 5 + 5 * (skillLevel - 1) // 1级5%，每级+5%
        }
      },

      unlockCondition(player) {
        return player.level >= 90
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50,
          // DEBUFF效果：减少敌人命中率
          debuffEffectBase: 5, // 1级减少5%命中率
          debuffEffectIncrement: 5 // 每级增加5%
        }
      },

      /**
       * 计算技能伤害
       * 公式: 基础伤害 + 熟练度伤害 + 力量 × 5.18 + 敏捷 × 3.18 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {number} 最终伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        // 熟练度伤害：1级50，每级+50，10级500
        const proficiencyDamage = 50 + 50 * (skillLevel - 1)
        // 力量加成：力量 × 5.18
        const strDamage = player.stats.strength * 5.18
        // 敏捷加成：敏捷 × 3.18
        const dexDamage = player.stats.agility * 3.18
        return Math.floor(baseDamage + proficiencyDamage + strDamage + dexDamage + player.attack * 0.16)
      },

      /**
       * 计算DEBUFF效果值（减少命中率百分比）
       * 1级: 5%, 10级: 50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 命中率减少百分比
       */
      calculateDebuffEffect(skillLevel = 1) {
        const baseEffect = 5
        const increment = 5
        return Math.min(baseEffect + increment * (skillLevel - 1), 50)
      }
    },

    /**
     * R技能 - 席瑞儿.安得利尔的祝福
     * 传承刀锋战士大师 席瑞儿.安得利尔 的祝福之力
     * 施法后获得格挡和暴击伤害赐福，大师意志附体，助你攻守兼备
     * 持续时间：基础3分钟 + 每10点力量增加1秒
     * 熟练度效果：BUFF激活期间每级增加副手武器攻击力+5%（1级5%，10级50%），BUFF消失后加成归零
     */
    R: {
      id: 'blade_warrior_r',
      key: 'R',
      name: '席瑞儿.安得利尔的祝福',
      icon: '/pt/skill_icon/xiruieranderuierdezhufu.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description:
        '传承刀锋战士大师 席瑞儿.安得利尔 的祝福之力，施法后获得格挡和暴击伤害赐福，大师意志附体，助你攻守兼备。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 10,
      manaCost: 150,
      buffDuration: 180, // 基础3分钟 = 180秒
      unlockLevel: 100,

      // BUFF效果配置
      buff: {
        type: 'corel_blessing',
        effect: {
          type: 'corel_blessing',
          baseDuration: 180, // 基础3分钟
          icon: '/pt/skill_icon/xiruieranderuierdezhufu.png'
        }
      },

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'corel_blessing',
          // 格挡率加成 - 1级2%，每级+2%，10级20%
          blockRate: {
            base: 2, // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            max: 20, // 最高20%
            rate: true // 百分比加成
          },
          // 暴击伤害加成 - 1级2%，每级+2%，10级20%
          criticalDamage: {
            base: 2, // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            max: 20, // 最高20%
            rate: true // 百分比加成
          },
          // 副手武器攻击力加成 - 1级5%，每级+5%，10级50%
          // 仅影响副手武器的最小/最大攻击力，不影响其他附加属性
          offhandAttackBonus: {
            base: 5, // 1级增加5%
            increment: 5, // 每级增加5%，10级=50%
            max: 50, // 最高50%
            rate: true // 百分比加成
          }
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础3分钟 + 每10点力量+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础180秒 + 力量 / 10 秒（每10点力量+1秒）
        return 180 + Math.floor(strength / 10)
      },

      /**
       * 计算BUFF效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 格挡率加成：2% * 技能等级，最高20%
        const blockRateBonus = Math.min(2 * skillLevel, 20)
        // 暴击伤害加成：2% * 技能等级，最高20%
        const critDamageBonus = Math.min(2 * skillLevel, 20)
        // 副手武器攻击力加成：5% * 技能等级，最高50%
        const offhandAtkBonus = Math.min(5 * skillLevel, 50)

        return {
          // 格挡率百分比加成
          blockRate: blockRateBonus,
          // 暴击伤害百分比加成
          criticalDamage: critDamageBonus,
          // 副手武器攻击力百分比加成（仅影响副手武器攻击力，非标准玩家属性）
          offhandAttackBonus: offhandAtkBonus
        }
      },
      // 标记 BUFF 效果为百分比加成
      buffRate: true
    },

    /**
     * P技能 - 双刀流（被动技能）
     * 获得双持武器的特殊能力，副手武器50%的属性加成
     * 等级达到60级后自动获得该能力：副手可以装备符合当前职业的武器
     * 50%属性加成包括：副手武器的攻击力、附加属性、穿洞卡片属性、可能存在的随机属性
     * 学习后攻击时有概率附加副手普通攻击：1级熟练度100%触发
     * 适用职业：刀锋战士、猎杀者（3转）
     */
    P: {
      id: 'blade_warrior_p',
      key: 'P',
      name: '双刀流',
      icon: '/pt/skill_icon/shuangdaoliu.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '从刀锋战士大师-席瑞儿.安得利尔 习得,解锁副手武器,狂暴无双',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true, // 标记为被动技能
      cd: 0, // 被动技能无冷却
      manaCost: 0, // 被动技能不消耗MP
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1, // 被动技能不可升级
        effect: {
          type: 'dual_wield',
          offhandAttributeRatio: 0.50, // 副手武器属性加成比例：50%
          offhandAttackChance: 1.0 // 副手攻击触发概率：1级100%
        }
      },

      /**
       * 获取副手武器属性加成比例
       * @param {number} skillLevel - 技能等级（未使用，固定50%）
       * @returns {number} 属性加成比例（0.50 = 50%）
       */
      getOffhandAttributeRatio(skillLevel = 1) {
        return 0.50
      },

      /**
       * 获取副手攻击触发概率
       * @param {number} skillLevel - 技能等级
       * @returns {number} 触发概率（0~1），1级100%
       */
      getOffhandAttackChance(skillLevel = 1) {
        return 1.0
      }
    }
  },

  // ========== 游侠技能 ==========
  ranger: {
    /**
     * 冰箭
   */
    Q: {
      id: 'ranger_q',
      key: 'Q',
      name: '冰箭',
      icon: '/pt/skill_icon/ragbowicearr.png',
      audio: ['/sound/PcSkillM-Arrowrain02.wav', '/sound/PcSkillD-Charge.wav'],
      description: '爆发性地射出具有冻结周围对象效果的箭，给予伤害的同时牵制对方移动。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WATER,
      damage: 100,
      cd: 3,
      manaCost: 58,
      duration: 10, // DEBUFF持续时间10秒
      unlockLevel: 60,

      // DEBUFF配置：攻击速度减少
      debuff: {
        type: 'attackSpeedReduction',
        chance: 5, // 基础概率5%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'attackSpeedReduction',
          duration: 10, // 10秒持续时间
          getValue: (skillLevel) => 3 + 3 * (skillLevel - 1) // 1级3%，每级+3%
        }
      },

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 100,
          increment: 100,
          // DEBUFF效果：减少敌人攻击速度
          debuffChanceBase: 5, // 1级5%概率
          debuffChanceIncrement: 5, // 每级增加5%
          debuffEffectBase: 3, // 1级减少3%攻击速度
          debuffEffectIncrement: 3 // 每级增加3%
        }
      },

      /**
       * 伤害计算
       * 公式: 熟练度伤害 + 敏捷 x 5.48 + 智力 x 2.18 + 玩家攻击力
       */
      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 100 + 100 * (skillLevel - 1)
        const agilityDamage = player.stats.agility * 5.48
        const intDamage = player.stats.intelligence * 2.18
        return Math.floor(proficiencyDamage + player.attack * 0.16 + agilityDamage + intDamage)
      },

      /**
       * 计算DEBUFF触发概率
       * 1级: 5%, 10级: 50%
       */
      calculateDebuffChance(skillLevel = 1) {
        const baseChance = 5
        const increment = 5
        return Math.min(baseChance + increment * (skillLevel - 1), 100)
      },

      /**
       * 计算DEBUFF效果值（减少攻击速度百分比）
       * 1级: 3%, 10级: 30%
       */
      calculateDebuffEffect(skillLevel = 1) {
        const baseEffect = 3
        const increment = 3
        return Math.min(baseEffect + increment * (skillLevel - 1), 50)
      }
    },

    /**
     * W技能 - 火焰箭矢
     * 赋予箭矢火元素，灼烧周围敌人
     */
    W: {
      id: 'ranger_w',
      key: 'W',
      name: '火焰箭矢',
      icon: '/pt/skill_icon/ragbowflamea.png',
      audio: ['/sound/PcSkillM-Arrowrain02.wav', '/sound/PcSkillD-Buringfld1.wav'],
      description: '赋予箭矢火元素，灼烧周围敌人。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.FIRE,
      damage: 115,
      cd: 5,
      manaCost: 58,
      unlockLevel: 65,

      // DOT效果配置
      dotEffect: {
        name: '灼烧',
        duration: 5,
        tickInterval: 2, // 每2秒触发一次
        damageRate: 0.3 // 每跳造成30%技能总伤害
      },

      unlockCondition(player) {
        return player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 115,
          increment: 50 // 每级增加50伤害，10级增加500
        }
      },

      /**
       * 伤害计算
       * 公式: 熟练度伤害 + 敏捷 x 5.18 + 智力 x 2.18 + 玩家攻击力
       */
      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 115 + 50 * (skillLevel - 1)
        const agilityDamage = player.stats.agility * 5.18
        const intDamage = player.stats.intelligence * 2.18
        return Math.floor(proficiencyDamage + player.attack * 0.16 + agilityDamage + intDamage)
      },

      /**
       * 计算DOT伤害
       * 每秒造成技能总伤害的80%
       */
      calculateDotDamage(baseDamage) {
        return Math.floor(baseDamage * 0.80)
      }
    },

    // E技能 - 致命射击
    E: {
      id: 'ranger_e',
      key: 'E',
      name: '致命射击',
      icon: '/pt/skill_icon/ragsupfastsh.png',
      audio: '/sound/PcSkillM-Fastattack.wav',
      description: '短时间内提升角色的暴击率。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 5,
      manaCost: 39,
      // 基础持续时间 5分钟 = 300秒
      buffDuration: 300,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'critical_buff',
          // 暴击率加成配置 - 1级2%，每级+2%，10级20%
          criticalRate: {
            base: 2,      // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            rate: true    // 百分比加成
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 基础暴击率加成：2% * 技能等级，最高20%
        const baseCritBonus = 2 * skillLevel

        return {
          // 暴击率百分比加成
          criticalRate: baseCritBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础300秒 + 敏捷 x 2
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        // 基础300秒 + 敏捷 x 2
        return 300 + agility * 2
      }
    },

    // R技能 - 自然领悟
    R: {
      id: 'ranger_r',
      key: 'R',
      name: '自然领悟',
      icon: '/pt/skill_icon/ragsupnature.png',
      audio: '/sound/PcSkillM-Nature01.wav',
      description: '借助自然之力提升感知，提升魔法防御与攻击速度。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 10,
      manaCost: 110,
      // 基础持续时间 5分钟 = 300秒
      buffDuration: 300,
      unlockLevel: 75,

      unlockCondition(player) {
        return player.level >= 75
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'nature_buff',
          // 魔法防御加成配置 - 1级2%，每级+2%，10级20%
          magicDefensePercentage: {
            base: 2,      // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            rate: true    // 百分比加成
          },
          // 攻击速度加成配置 - 1级2%，每级+2%，10级20%
          attackSpeed: {
            base: 2,      // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            rate: true    // 百分比加成
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 基础加成：2% * 技能等级，最高20%
        const baseBonus = 2 * skillLevel

        return {
          // 魔法防御百分比加成
          magicDefensePercentage: baseBonus,
          // 攻击速度百分比加成
          attackSpeed: baseBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础300秒 + 敏捷 x 2
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        // 基础300秒 + 敏捷 x 2
        return 300 + agility * 2
      }
    },

    /**
     * T技能 - 毒箭
     * 附毒的箭支射出后造成范围伤害，并概率降低敌人攻击力（中毒效果）
     * AOE + DEBUFF 技能：射出毒箭对目标及周围敌人造成伤害，概率施加中毒DEBUFF降低攻击力
     * 熟练度影响触发概率和降低幅度：1级3%概率降低1.5%，10级30%概率降低15%
     */
    T: {
      id: 'ranger_t',
      key: 'T',
      name: '毒箭',
      icon: '/pt/skill_icon/ragbowpoison.png',
      audio: ['/sound/PcSkillM-Arrowrain02.wav', '/sound/PcSkillD-Asmodeus.wav'],
      description: '附毒的箭支射出后对周围敌人造成伤害，并有概率使其中毒，降低敌人攻击力。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 120,
      cd: 10,
      manaCost: 42,
      unlockLevel: 70,

      // 中毒DEBUFF配置：概率降低敌人攻击力
      debuff: {
        type: 'attackReduction',
        effect: {
          type: 'attackReduction',
          icon: '/pt/skill_icon/ragbowpoison.png',
          baseDuration: 10,
          /**
           * 根据熟练度等级计算攻击力降低百分比
           * 1级: 1.5%，10级: 15%，每级增加1.5%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 攻击力降低百分比
           */
          getValue(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
            return 1.5 * safeLevel
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 70
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 120,
          increment: 153 // 每级增加153伤害，10级≈1500
        }
      },

      /**
       * 伤害计算
       * 公式: 熟练度伤害 + 敏捷 x 5.0 + 玩家攻击力
       * 1级熟练度: 120, 10级熟练度: 1500
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 熟练度伤害：1级120，10级1500，线性插值
        const proficiencyDamage = Math.round(120 + (1500 - 120) * (skillLevel - 1) / 9)
        const agilityDamage = player.stats.agility * 5.0
        return Math.floor(proficiencyDamage + player.attack * 0.16 + agilityDamage)
      },

      /**
       * 计算中毒DEBUFF触发概率
       * 1级: 3%，10级: 30%，每级增加3%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 3 * safeLevel
      }
    },

    /**
     * Y技能 - 艾梨芙的祝福
     * 传承于游侠大师艾梨芙的祝福之力，获得强壮体魄与致命伤害
     * 单人BUFF技能：提升最大生命值与暴击伤害
     */
    Y: {
      id: 'ranger_y',
      key: 'Y',
      name: '艾梨芙的祝福',
      icon: '/pt/skill_icon/ailifualfdzf.png',
      audio: '/sound/ItemChrWAngel.wav',
      description:
        '传承于游侠大师艾梨芙的祝福之力，施法后获得强壮的体魄与致命的伤害，补齐自身短板并增强致命伤害上限，让你更加游刃有余。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 10,
      manaCost: 120,
      // 基础持续时间 3分钟 = 180秒
      buffDuration: 180,
      unlockLevel: 100,

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'ayrif_blessing',
          // 最大生命值百分比加成 - 1级3%，每级+3%，10级30%
          maxHpPercentage: {
            base: 3, // 1级增加3%
            increment: 3, // 每级增加3%，10级=30%
            rate: true // 百分比加成
          },
          // 暴击伤害百分比加成 - 1级2%，每级+2%，10级20%
          criticalDamage: {
            base: 2, // 1级增加2%
            increment: 2, // 每级增加2%，10级=20%
            rate: true // 百分比加成
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 最大生命值加成：3% * 技能等级，最高30%
        const maxHpBonus = 3 * skillLevel
        // 暴击伤害加成：2% * 技能等级，最高20%
        const critDamageBonus = 2 * skillLevel

        return {
          // 最大生命值百分比加成
          maxHpPercentage: maxHpBonus,
          // 暴击伤害百分比加成
          criticalDamage: critDamageBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础180秒 + 敏捷 / 10（每10点敏捷+1秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        // 基础180秒 + 每10点敏捷+1秒
        return 180 + Math.floor(agility / 10)
      }
    }
  },

  // ========== 暗杀者技能 ==========
  assassin: {
    // Q技能 - 三相之力
    Q: {
      id: 'assassin_q',
      key: 'Q',
      name: '三相之力',
      icon: '/pt/skill_icon/jstintabsorb.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '三相之力附体，使玩家获得命中率,攻击速度,吸血等效果。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 5,
      manaCost: 50,
      // 基础持续时间 5分钟 = 300秒
      buffDuration: 300,
      unlockLevel: 70,

      unlockCondition(player) {
        return player.level >= 70
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'triple_force',
          // 命中率加成 - 1级1%，每级+1%，10级10%
          hitRate: {
            base: 1,      // 1级增加1%
            increment: 1, // 每级增加1%，10级=10%
            rate: true    // 百分比加成
          },
          // 攻击速度加成 - 1级1%，每级+1%，10级10%
          attackSpeed: {
            base: 1,      // 1级增加1%
            increment: 1, // 每级增加1%，10级=10%
            rate: true    // 百分比加成
          },
          // 生命偷取加成 - 1级0.5%，每级+0.5%，10级5%
          lifeSteal: {
            base: 0.5,    // 1级增加0.5%
            increment: 0.5, // 每级增加0.5%，10级=5%
            rate: true    // 百分比加成
          },
          // MP消耗每级增加
          manaCostIncrement: 5
        }
      },

      /**
       * 计算实际 MP 消耗
       * 基础50 + (技能等级-1) * 5
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        return 50 + (skillLevel - 1) * 5
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 1级: 命中率1%, 攻击速度1%, 吸血0.5%
        // 10级: 命中率10%, 攻击速度10%, 吸血5%
        const hitRateBonus = skillLevel       // 命中率: 1%~10%
        const attackSpeedBonus = skillLevel   // 攻击速度: 1%~10%
        const lifeStealBonus = skillLevel * 0.5 // 吸血: 0.5%~5%

        return {
          // 命中率加成
          hitRate: hitRateBonus,
          // 攻击速度加成
          attackSpeed: attackSpeedBonus,
          // 生命偷取加成
          lifeSteal: lifeStealBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础300秒 + 力量 x 2
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础300秒 + 力量 x 2
        return 300 + strength * 2
      }
    },

    // W技能 - 斗志风轮
    W: {
      id: 'assassin_w',
      key: 'W',
      name: '斗志风轮',
      icon: '/pt/skill_icon/jstsupswing.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '暂时提高飞轮的暴击率和格挡穿透率。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 5,
      manaCost: 65,
      // 基础持续时间 5分钟 = 300秒
      buffDuration: 300,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'spirit_swings',
          // 暴击率加成 - 1级4%，每级+4%，10级40%
          criticalRate: {
            base: 4,      // 1级增加4%
            increment: 4, // 每级增加4%，10级=40%
            rate: true    // 百分比加成
          },
          // 格挡穿透加成 - 1级1%，每级+1%，10级10%
          blockPenetration: {
            base: 1,      // 1级增加1%
            increment: 1, // 每级增加1%，10级=10%
            rate: true    // 百分比加成
          },
          // MP消耗每级增加
          manaCostIncrement: 5
        }
      },

      /**
       * 计算实际 MP 消耗
       * 基础65 + (技能等级-1) * 5
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        return 65 + (skillLevel - 1) * 5
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 1级: 暴击率4%, 格挡穿透1%
        // 10级: 暴击率40%, 格挡穿透10%
        const criticalBonus = skillLevel * 4     // 暴击率: 4%~40%
        const blockPenetrationBonus = skillLevel // 格挡穿透: 1%~10%

        return {
          // 暴击率加成
          criticalRate: criticalBonus,
          // 格挡穿透加成
          blockPenetration: blockPenetrationBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础300秒 + 力量 x 2
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const strength = player?.stats?.strength || 0
        // 基础300秒 + 力量 x 2
        return 300 + strength * 2
      }
    },

    // E技能 - 戏谑爆破
    E: {
      id: 'assassin_e',
      key: 'E',
      name: '戏谑爆破',
      icon: '/pt/skill_icon/wndlbacksteb.png',
      audio: ['/sound/Xl_SKILL_WINDL_YOYO_COUNTERBACK01.wav', '/sound/Xl_SKILL_WINDL_YOYO_COUNTERBACK02.wav'],
      description: '向敌人丢置一个炸弹，对所有敌人造成爆炸伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 350,
      cd: 2,
      manaCost: 100,
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 50,
          increment: 50,
          manaCostIncrement: 10
        }
      },

      /**
       * 计算实际 MP 消耗
       * 基础100 + (技能等级-1) * 10
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        return 100 + (skillLevel - 1) * 10
      },

      /**
       * 计算技能伤害
       * 公式：基础伤害 + 熟练度伤害 + 力量加成 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 最终伤害
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        const proficiencyDamage = 50 * skillLevel
        const strengthDamage = player.stats.strength * 8.08
        const attackDamage = player.attack * 0.16

        return Math.floor(baseDamage + proficiencyDamage + strengthDamage + attackDamage)
      }
    },

    // R技能 - 暗杀
    R: {
      id: 'assassin_r',
      key: 'R',
      name: '暗杀',
      icon: '/pt/skill_icon/jstsupvatals.png',
      audio: '/sound/PcSkillD-Demonolgy.wav',
      description: '从潜行状态下现身，给予对方致命一击，有一定几率造成多倍伤害。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 750,
      cd: 7,
      manaCost: 90,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 150,
          increment: 150,
          manaCostIncrement: 3
        }
      },

      /**
       * 计算实际 MP 消耗
       * 基础90 + (技能等级-1) * 3
       * 对应 SKILL_INFO: Lv1=90FP, Lv10=117FP
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        return 90 + (skillLevel - 1) * 3
      },

      /**
       * 获取力量加成系数
       * 固定系数 7，供 SkillTooltip 面板读取以显示力量加成信息
       * @param {number} skillLevel - 技能熟练度等级（当前为固定系数，不随等级变化）
       * @returns {number} 力量加成系数
       */
      strengthCoeff(skillLevel = 1) {
        return 7
      },

      /**
       * 计算技能伤害
       * 公式：基础伤害 + 熟练度伤害 + 力量加成 + 攻击力
       * 熟练度伤害：每级+150，1级=150，10级=1500
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 最终伤害
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        const proficiencyDamage = 150 * skillLevel
        const strengthDamage = player.stats.strength * this.strengthCoeff(skillLevel)
        const attackDamage = player.attack * 0.16

        return Math.floor(baseDamage + proficiencyDamage + strengthDamage + attackDamage)
      },

      /**
       * 暗杀倍率表
       * 每级熟练度对应一个触发概率和伤害倍率
       * 触发时造成对应倍率伤害，未触发则为 1.0 倍
       * @typedef {Object} CriticalEntry
       * @property {number} chance - 触发概率（0~1）
       * @property {number} multiplier - 伤害倍率
       */

      /**
       * 获取暗杀倍率表
       * Lv1: 5%/1.0x, Lv2: 10%/1.1x, Lv3: 15%/1.2x, Lv4: 20%/1.3x,
       * Lv5: 25%/1.4x, Lv6: 30%/1.5x, Lv7: 35%/1.6x, Lv8: 40%/1.7x,
       * Lv9: 45%/2.0x, Lv10: 50%/2.5x
       * @returns {Array<{chance: number, multiplier: number}>} 倍率表
       */
      getCriticalTable() {
        return [
          { chance: 0.05, multiplier: 1.0 },
          { chance: 0.10, multiplier: 1.1 },
          { chance: 0.15, multiplier: 1.2 },
          { chance: 0.20, multiplier: 1.3 },
          { chance: 0.25, multiplier: 1.4 },
          { chance: 0.30, multiplier: 1.5 },
          { chance: 0.35, multiplier: 1.6 },
          { chance: 0.40, multiplier: 1.7 },
          { chance: 0.45, multiplier: 2.0 },
          { chance: 0.50, multiplier: 2.5 }
        ]
      },

      /**
       * 获取指定熟练度等级的触发概率
       * @param {number} skillLevel - 技能熟练度等级（1~10）
       * @returns {number} 触发概率（0~1）
       */
      getCriticalChance(skillLevel = 1) {
        const table = this.getCriticalTable()
        const entry = table[skillLevel - 1] || table[0]
        return entry.chance
      },

      /**
       * 获取指定熟练度等级的伤害倍率
       * @param {number} skillLevel - 技能熟练度等级（1~10）
       * @returns {number} 伤害倍率
       */
      getDamageMultiplier(skillLevel = 1) {
        const table = this.getCriticalTable()
        const entry = table[skillLevel - 1] || table[0]
        return entry.multiplier
      },

      /**
       * 判定本次攻击是否触发暗杀倍率伤害
       * @param {number} skillLevel - 技能熟练度等级（1~10）
       * @returns {boolean} 是否触发
       */
      rollCritical(skillLevel = 1) {
        const chance = this.getCriticalChance(skillLevel)
        return Math.random() < chance
      }
    },

    /**
     * U技能 - 萝丽安的祝福
     * 暗杀者大师-萝丽安传承的杀戮之力,施法后大幅度提升敏捷与暴击伤害
     * 基础持续时间1分钟,每10点敏捷+1秒持续时间
     * 1级熟练度: 10敏捷, 2%暴击伤害
     * 10级熟练度: 100敏捷, 20%暴击伤害, 熟练度大圆满时获得5%吸血加成
     */
    U: {
      id: 'assassin_u',
      key: 'U',
      name: '萝丽安的祝福',
      icon: '/pt/skill_icon/luoliandezhufu.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '传承于暗杀者大师-萝丽安的杀戮之力,施法后大幅度提升敏捷与暴击伤害,助你杀人于无形~',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 100,
      buffDuration: 60,
      unlockLevel: 100,

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'luolian_blessing',
          // 敏捷加成：10 * 技能等级，最高100
          agility: {
            base: 10,
            increment: 10,
            rate: false
          },
          // 暴击伤害加成：2% * 技能等级，最高20%
          criticalDamage: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true
          },
          // 吸血加成：仅10级（大圆满）时追加5%
          lifeSteal: {
            base: 0,
            increment: 0,
            max: 5,
            rate: true
          }
        }
      },

      /**
       * 计算MP消耗
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        return 100
      },

      /**
       * 计算BUFF持续时间
       * 基础60秒 + 每10点敏捷增加1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        return 60 + Math.floor(agility / 10)
      },

      /**
       * 计算BUFF效果
       * 1级: 10敏捷, 2%暴击伤害
       * 10级: 100敏捷, 20%暴击伤害, 5%吸血加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 敏捷加成：10 * 技能等级，最高100
        const agilityBonus = 10 * skillLevel
        // 暴击伤害加成：2% * 技能等级，最高20%
        const criticalDamagePercent = Math.min(2 * skillLevel, 20)
        // 吸血加成：仅10级（大圆满）时追加5%
        const lifeStealPercent = skillLevel >= 10 ? 5 : 0

        return {
          // 敏捷固定值加成
          agility: agilityBonus,
          // 暴击伤害百分比加成
          criticalDamage: { add: criticalDamagePercent, rate: true },
          // 吸血百分比加成（仅大圆满时生效）
          lifeSteal: { add: lifeStealPercent, rate: true }
        }
      }
    }
  },

  // ========== 守护使者技能 ==========
  guardian: {
    Q: {
      id: 'guardian_q',
      key: 'Q',
      name: '神圣领域',
      icon: '/pt/skill_icon/rinsupanzelr.png',
      audio: '/sound/PcSkillM-Anzelrusha.wav',
      description: '在圣之光照射下形成具有圣力的领域，打击踏入领域的敌人。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 100,
      cd: 10,
      manaCost: 79,
      unlockLevel: 60,
      // 技能持续时间（秒）
      duration: 10,
      // DOT 伤害触发间隔（秒）
      tickInterval: 1.5,
      // DOT 效果配置
      dotEffect: {
        name: '神圣领域',
        duration: 10,
        tickInterval: 1.5,
        damageRate: 0.8 // 每跳造成 80% 基础伤害
      },

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 100,
          increment: 100 // 每级增加100伤害，最高+1000
        }
      },

      // 最终技能伤害公式: 熟练度等级伤害 + 玩家攻击力 + (玩家智力 * 4.18)
      calculateDamage(player, skillLevel = 1) {
        const proficiencyDamage = 100 + 100 * (skillLevel - 1) // 熟练度等级伤害，最高1000
        const intDamage = player.stats.intelligence * 4.18
        return Math.floor(proficiencyDamage + player.attack * 0.16 + intDamage)
      }
    },

    // W技能 - 守护术
    W: {
      id: 'guardian_w',
      key: 'W',
      name: '守护术',
      icon: '/pt/skill_icon/rinsupprotec.png',
      audio: '/sound/PcSkillM-Protect.wav',
      description: '暂时提高施法对象的物理&魔法防御力。',
      type: SKILL_TYPES.BUFF,
      isTeamBuff: true, // 群体BUFF：施放给全队
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 79,
      // 施法时间（秒）
      castTime: 1,
      // 基础持续时间 4分10秒 = 250秒
      buffDuration: 250,
      unlockLevel: 65,

      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 2 && player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'defense_buff',
          // 使用与 calculateBuff 返回值一致的 key 名称
          defensePercentage: {
            base: 1, // 基础防御提升1%
            increment: 1, // 每级增加1%，10级=10%
            rate: true // 百分比加成
          },
          magicDefensePercentage: {
            base: 1, // 基础魔法防御提升1%
            increment: 1, // 每级增加1%，10级=10%
            rate: true // 百分比加成
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 熟练度加成：1% * 技能等级，最高10级=10%
        const baseDefensePercent = skillLevel
        const baseMagicDefensePercent = skillLevel

        // 智力额外加成：每25智力增加1%，最高10%
        const intelligence = player?.stats?.intelligence || 0
        const intBonusPercent = Math.min(Math.floor(intelligence / 25) * 1, 10)

        // 最终加成：熟练度 + 智力加成，最高各20%
        const totalDefensePercent = Math.min(baseDefensePercent + intBonusPercent, 20)
        const totalMagicDefensePercent = Math.min(baseMagicDefensePercent + intBonusPercent, 20)

        // 计算持续时间：基础250秒 + 每25智力增加50秒
        const extraDuration = Math.floor(intelligence / 25) * 50
        const totalDuration = 250 + extraDuration

        return {
          // 使用系统期望的字段名 defensePercentage（百分比加成）
          defensePercentage: totalDefensePercent,
          // 魔法防御百分比加成（需要系统支持）
          magicDefensePercentage: totalMagicDefensePercent,
          duration: totalDuration
        }
      },

      /**
       * 计算最终持续时间（秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础250秒 + 每25智力增加50秒持续时间
        return 250 + Math.floor(intelligence / 25) * 50
      }
    },

    // E技能 - 攻击强化
    E: {
      id: 'guardian_e',
      key: 'E',
      name: '攻击强化',
      icon: '/pt/skill_icon/rinsupspirit.png',
      audio: '/sound/gjqh.mp3',
      description: '提高目标的攻击力',
      type: SKILL_TYPES.BUFF,
      isTeamBuff: true, // 群体BUFF：施放给全队
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 79,
      // 基础持续时间 4分10秒 = 250秒
      buffDuration: 250,
      unlockLevel: 65,

      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 3 && player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'attack_buff',
          // 攻击力加成配置 - 与 calculateBuff 公式一致
          attackMin: {
            base: 25,      // 1级增加25
            increment: 25, // 每级增加25，10级=250
            rate: false    // 固定值加成
          },
          attackMax: {
            base: 25,
            increment: 25,
            rate: false
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 基础攻击力加成：25 * 技能等级，最高250
        const baseAttackBonus = 25 * skillLevel

        // 智力额外加成：每25智力增加25点攻击力，最高250
        const intelligence = player?.stats?.intelligence || 0
        const intBonus = Math.min(Math.floor(intelligence / 25) * 25, 250)

        // 最终攻击力加成：基础 + 智力加成，最高500
        const totalAttackBonus = Math.min(baseAttackBonus + intBonus, 500)

        return {
          // 最小攻击力加成 - 使用 attackMin 以匹配 PlayerStatsService
          attackMin: totalAttackBonus,
          // 最大攻击力加成 - 使用 attackMax 以匹配 PlayerStatsService
          attackMax: totalAttackBonus,
        }
      },

      /**
       * 计算最终持续时间（秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础250秒 + 每25智力增加50秒持续时间
        return 250 + Math.floor(intelligence / 25) * 50
      }
    },

    // R技能 - 生命祝福
    R: {
      id: 'guardian_r',
      key: 'R',
      name: '生命祝福',
      icon: '/pt/skill_icon/rinheahealra.png',
      audio: '/sound/PcSkillD-Healrain.wav',
      description: '大量恢复附近同伴的生命值。',
      type: SKILL_TYPES.HEAL,
      isTeamHeal: true, // 群体治疗：治疗全队
      element: ELEMENT_TYPES.NONE,
      cd: 0.5,
      manaCost: 65,
      heal: 650,
      unlockLevel: 70,

      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 4 && player.level >= 70
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'heal',
          base: 650,
          increment: 65 // 每级增加65治疗量，最高650
        }
      },

      /**
       * 计算治疗效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 治疗量
       */
      calculateHealing(player, skillLevel = 1) {
        // 基础治疗量：650 + 65 * (技能等级 - 1)，最高1300
        const baseHeal = 650 + 65 * (skillLevel - 1)
        // 智力加成：智力 * 8.18
        const intHeal = (player?.stats?.intelligence || 0) * 8.18
        return Math.floor(baseHeal + intHeal)
      },

      /**
       * 计算MP消耗
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        // 基础65 + 每级+5，10级=65+50=115
        return 65 + 5 * (skillLevel - 1)
      }
    },

    // T技能 - 战斗之歌
    T: {
      id: 'guardian_t',
      key: 'T',
      name: '战斗之歌',
      icon: '/pt/skill_icon/rinsqugebura.png',
      audio: '/sound/PcSkillM-Geburah.wav',
      description: '吟唱战歌，提高周围同伴的攻击力和攻击速度。',
      type: SKILL_TYPES.BUFF,
      isTeamBuff: true, // 群体BUFF：施放给全队
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 100,
      buffDuration: 60,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 5 && player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'battle_song',
          // 攻击力百分比加成 - key 与 calculateBuff 返回值一致
          attackMin: {
            base: 1.5,      // 1级增加1.5%
            increment: 1.5,   // 每级增加1.5%，10级=15%
            max: 15,        // 最大15%
            rate: true      // 百分比加成
          },
          attackMax: {
            base: 1.5,      // 1级增加1.5%
            increment: 1.5,   // 每级增加1.5%，10级=15%
            max: 15,        // 最大15%
            rate: true      // 百分比加成
          },
          // 攻击速度百分比加成
          attackSpeedPercentage: {
            base: 1.5,      // 1级增加1.5%
            increment: 1.5,   // 每级增加1%，10级=15%
            max: 15,        // 最大15%
            rate: true      // 百分比加成
          },
          // 施法速度百分比加成
          castSpeedPercentage: {
            base: 1.5,        // 1级增加1.5%
            increment: 1.5,   // 每级增加1.5%，10级=15%
            max: 15,        // 最大15%
            rate: true      // 百分比加成
          }
        }
      },

      /**
       * 计算MP消耗
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        // 基础100 + 每级+5，10级=100+45=145
        return 100 + 5 * (skillLevel - 1)
      },

      /**
       * 计算BUFF持续时间
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础60秒 + 每1点智力增加1秒
        return 60 + Math.floor(intelligence * 1)
      },

      /**
       * 计算BUFF效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0

        // 熟练度加成 - 与 proficiency.effect 配置一致
        // 攻击力：1.5% + (技能等级-1) * 1.5%，最高15%
        const baseAttackPercent = Math.min(1.5 + (skillLevel - 1) * 1.5, 15)
        // 攻击速度：1.5% + (技能等级-1) * 1.5%，最高15%
        const baseAttackSpeedPercent = Math.min(1.5 + (skillLevel - 1) * 1.5, 15)
        // 施法速度：1.5% + (技能等级-1) * 1.5%，最高15%
        const baseCastSpeedPercent = Math.min(1.5 + (skillLevel - 1) * 1.5, 15)

        // 智力额外加成：每25点智力增加0.5%，最高15%
        const intBonusPercent = Math.min(Math.floor(intelligence / 25) * 0.5, 15)

        // 最终加成：熟练度 + 智力加成
        const totalAttackPercent = Math.min(baseAttackPercent + intBonusPercent, 30)
        const totalAttackSpeedPercent = Math.min(baseAttackSpeedPercent + intBonusPercent, 30)
        const totalCastSpeedPercent = Math.min(baseCastSpeedPercent + intBonusPercent, 30)

        // 注意：duration 由 calculateDuration 方法单独计算，不包含在效果中
        return {
          attackMin: totalAttackPercent,
          attackMax: totalAttackPercent,
          attackSpeedPercentage: totalAttackSpeedPercent,
          castSpeedPercentage: totalCastSpeedPercent
        }
      },
      // 标记 BUFF 效果为百分比加成
      buffRate: true
    },

    /**
     * Y技能 - 神圣之光（被动技能）
     * 当队友死亡后，有概率自动复活队友，并恢复其HP、MP到最大值
     * 1级熟练度触发概率50%，10级熟练度触发概率80%
     */
    Y: {
      id: 'guardian_y',
      key: 'Y',
      name: '神圣之光',
      icon: '/pt/skill_icon/asshearesurr.png',
      audio: '/sound/PCSkillM-Resurrsction.wav',
      description: '被动技能：当队友死亡后，有概率自动复活队友，并恢复其HP、MP到最大值。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true, // 标记为被动技能
      cd: 5, // 冷却时间5秒
      manaCost: 50,
      unlockLevel: 60,

      // 复活效果配置
      resurrect: {
        type: 'autoResurrect',
        // 触发概率由熟练度决定，见 calculateResurrectChance
        restoreHp: 1.0, // 恢复HP到100%
        restoreMp: 1.0 // 恢复MP到100%
      },

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'autoResurrect',
          baseChance: 50, // 1级50%概率
          incrementChance: 3.33, // 每级增加3.33%概率，(80-50)/9≈3.33
          maxChance: 80 // 最大80%
        }
      },

      /**
       * 计算复活触发概率
       * 1级=50%，10级=80%，线性插值
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 触发概率（百分比）
       */
      calculateResurrectChance(skillLevel = 1) {
        // 1级=50%，10级=80%，每级增加 (80-50)/(10-1) = 3.33...
        const baseChance = 50
        const maxChance = 80
        const increment = (maxChance - baseChance) / 9 // 每级增加约3.33%
        return Math.min(baseChance + increment * (skillLevel - 1), maxChance)
      },

      /**
       * 获取复活恢复效果
       * @param {number} skillLevel - 技能等级
       * @returns {Object} 复活恢复效果
       */
      getResurrectEffect(skillLevel = 1) {
        return {
          restoreHp: 1.0, // 固定恢复100% HP
          restoreMp: 1.0 // 固定恢复100% MP
        }
      }
    },

    /**
     * U技能 - 爱岚德的祝福
     * 守护使者大师-爱岚德传承之力,施法后获得大幅增加体魄与智慧,格挡率的能力
     * 攻守兼备,大圆满（10级熟练度）时可追加10%治疗加成
     * 基础持续时间1分钟,每10点智力+1秒持续时间
     * 1级熟练度: 10体质, 10智力, 2%格挡率
     * 10级熟练度: 100体质, 100智力, 20%格挡率, 10%治疗加成
     */
    U: {
      id: 'guardian_u',
      key: 'U',
      name: '爱岚德的祝福',
      icon: '/pt/skill_icon/ailandedezhufu.png',
      audio: '/sound/PcSkillM-Geburah.wav',
      description: '守护使者大师-爱岚德传承之力,施法后获得大幅增加体魄与智慧,格挡率的能力,攻守兼备,大圆满时可追加治疗能力,奶妈再也不怕被一巴掌拍死了~',
      type: SKILL_TYPES.BUFF,
      isTeamBuff: true, // 群体BUFF：施放给全队
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 150,
      buffDuration: 60, // 基础持续时间1分钟
      unlockLevel: 100,

      unlockCondition(player) {
        return player.skills?.Q?.proficiencyLevel >= 6 && player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'ailande_blessing',
          // 体质加成：10 * 技能等级，最高100
          constitution: {
            base: 10,
            increment: 10,
            rate: false // 固定值加成
          },
          // 智力加成：10 * 技能等级，最高100
          intelligence: {
            base: 10,
            increment: 10,
            rate: false // 固定值加成
          },
          // 格挡率加成：2% * 技能等级，最高20%
          blockRate: {
            base: 2,
            increment: 2,
            max: 20,
            rate: true // 百分比加成
          },
          // 治疗加成：仅10级（大圆满）时追加10%
          healPercent: {
            base: 0,
            increment: 0,
            max: 10,
            rate: true // 百分比加成
          }
        }
      },

      /**
       * 计算MP消耗
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} MP消耗
       */
      calculateManaCost(skillLevel = 1) {
        // 固定150 MP消耗
        return 150
      },

      /**
       * 计算BUFF持续时间
       * 基础60秒 + 每10点智力增加1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础60秒 + 每10点智力增加1秒
        return 60 + Math.floor(intelligence / 10)
      },

      /**
       * 计算BUFF效果
       * 1级: 10体质, 10智力, 2%格挡率
       * 10级: 100体质, 100智力, 20%格挡率, 10%治疗加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 体质加成：10 * 技能等级，最高100
        const constitutionBonus = 10 * skillLevel
        // 智力加成：10 * 技能等级，最高100
        const intelligenceBonus = 10 * skillLevel
        // 格挡率加成：2% * 技能等级，最高20%
        const blockRatePercent = Math.min(2 * skillLevel, 20)
        // 治疗加成：仅10级（大圆满）时追加10%
        const healPercentBonus = skillLevel >= 10 ? 10 : 0

        return {
          // 体质固定值加成
          constitution: constitutionBonus,
          // 智力固定值加成
          intelligence: intelligenceBonus,
          // 格挡率百分比加成
          blockRate: { add: blockRatePercent, rate: true },
          // 治疗加成百分比（仅大圆满时生效）
          healPercent: { add: healPercentBonus, rate: true }
        }
      }
    }
  },

  // ========== 暴力技师技能 ==========
  technician: {
    Q: {
      id: 'technician_q',
      key: 'Q',
      name: '拳术领悟',
      icon: '/pt/skill_icon/bilasmodeus.png',
      audio: '/sound/PcSkillD-Asmodeus.wav',
      description: '提高拳套熟练度来增强攻击力。命中率和攻击速度随等级提升。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 1,
      manaCost: 110,
      // 基础持续时间 300 = 5分钟
      buffDuration: 300,
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'knuckle_mastery_buff',
          // 命中率百分比加成：1.5% * 技能等级，最高15%
          hitRate: {
            base: 1.5,
            increment: 1.5,
            rate: true
          },
          // 攻击速度百分比加成：1.5% * 技能等级，最高15%
          attackSpeed: {
            base: 1.5,
            increment: 1.5,
            rate: true
          },
          // 最小攻击力加成：50 * 技能等级，最高500
          attackMin: {
            base: 50,
            increment: 50,
            rate: false
          },
          // 最大攻击力加成：50 * 技能等级，最高500
          attackMax: {
            base: 50,
            increment: 50,
            rate: false
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 命中率百分比加成：1.5% * 技能等级，最高15%
        const hitRatePercent = 1.5 * skillLevel

        // 攻击速度百分比加成：1.5% * 技能等级，最高15%
        const attackSpeedPercent = 1.5 * skillLevel

        // 攻击力加成：50 * 技能等级，最高500
        const attackBonus = 50 * skillLevel

        return {
          // 命中率百分比加成
          hitRate: hitRatePercent,
          // 攻击速度百分比加成
          attackSpeed: attackSpeedPercent,
          // 最小攻击力加成
          attackMin: attackBonus,
          // 最大攻击力加成
          attackMax: attackBonus
        }
      },

      /**
       * 计算最终持续时间（秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        // 基础1800秒（30分钟） + 智力 x 2 秒
        return 1800 + Math.floor(intelligence * 2)
      }
    },

    W: {
      id: 'technician_w',
      key: 'W',
      name: '斗气风暴',
      icon: '/pt/skill_icon/bilgvurtialbold.png',
      audio: '/sound/PcSkillM-Spiritefot.wav',
      description: '将斗气化作风暴，打击周围的敌人。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      // 基础伤害
      damage: 124,
      cd: 2,
      manaCost: 68,
      castTime: 2000, // 施法时间 2秒
      unlockLevel: 65,

      unlockCondition(player) {
        return player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          // 熟练度伤害加成：60 * 技能等级，最高600
          base: 60,
          increment: 60
        }
      },

      /**
       * 计算技能伤害
       * 技能伤害 = 基础伤害 + 熟练度伤害 + 智力 * 4.18 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：60 * 技能等级，最高600
        const proficiencyDamage = 60 * skillLevel

        // 智力加成：智力 * 4.18
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 4.18

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      }
    },

    E: {
      id: 'technician_e',
      key: 'E',
      name: '背水一击',
      icon: '/pt/skill_icon/bilasalraalaikum.png',
      audio: '/sound/PcSkillD-Asalraala.wav',
      description: '消耗当前100%的MP，对敌人造成致命一击。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      // 基础伤害
      damage: 550,
      cd: 5,
      // MP消耗为当前MP最大值（特殊处理）
      manaCost: -1, // -1 表示消耗全部MP
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          // 熟练度伤害加成查找表：1级+100，每级+100，9级+900，10级+1500
          damageTable: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1500]
        }
      },

      /**
       * 计算技能伤害
       * 伤害 = 基础伤害 + 熟练度伤害 + 智力×5.18 + 攻击力 + 当前MP最大值
       * 熟练度伤害：1级+100，每级+100，9级+900，10级+1500
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：查找表，1级+100 ~ 9级+900，10级+1500
        const damageTable = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1500]
        const clampedLevel = Math.max(1, Math.min(10, skillLevel))
        const proficiencyDamage = damageTable[clampedLevel - 1]

        // 智力加成：智力 × 5.18
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 5.18

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        // 当前MP最大值转换为攻击力
        const mpBonus = player?.maxMana || 0

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage + mpBonus)
      },

      /**
       * 计算MP消耗（消耗全部MP）
       * @param {Object} player - 玩家对象
       * @returns {number} MP消耗量
       */
      calculateManaCost(player) {
        return player?.currentMana || 0
      }
    },

    /**
     * R技能 - 叙里的祝福
     * BUFF技能：传承暴力技师英雄叙里的祝福,增加施法者精神力和体魄,并大幅增加攻击速度,暴击率
     * 持续时间：基础5分钟 + 智力×2 + 体质×2
     * 熟练度效果：
     *   智力/体质：1级+5，10级+100（线性插值取整）
     *   攻击速度：1级+2%，每级+2%，10级+20%
     *   暴击率：1级+2%，每级+2%，10级+20%
     */
    R: {
      id: 'technician_r',
      key: 'R',
      name: '叙里的祝福',
      icon: '/pt/skill_icon/burn.png',
      audio: '/sound/PcSkillD-Holyguard.wav',
      description: '传承暴力技师英雄叙里的祝福,增加施法者精神力和体魄,并大幅增加攻击速度,暴击率,使自身立于不败之地.',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 3,
      manaCost: 120,
      buffDuration: 300, // 基础持续时间5分钟（300秒）
      unlockLevel: 100,

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'xuli_blessing_buff',
          // 智力加成查找表：1级+5，10级+100（线性插值取整）
          intelligence: {
            damageTable: [5, 16, 26, 37, 47, 58, 68, 79, 89, 100],
            description: '智力'
          },
          // 体质加成查找表：1级+5，10级+100（线性插值取整）
          constitution: {
            damageTable: [5, 16, 26, 37, 47, 58, 68, 79, 89, 100],
            description: '体质'
          },
          // 攻击速度百分比加成：1级2%，每级+2%，10级20%
          attackSpeed: {
            base: 2,
            increment: 2,
            rate: true,
            description: '攻击速度'
          },
          // 暴击率加成：1级2%，每级+2%，10级20%
          criticalRate: {
            base: 2,
            increment: 2,
            rate: true,
            description: '暴击率'
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 智力/体质：1级+5，10级+100（线性插值取整）
       * 攻击速度：1级+2%，每级+2%，10级+20%
       * 暴击率：1级+2%，每级+2%，10级+20%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 智力/体质线性插值查找表：1级5，10级100
        const statTable = [5, 16, 26, 37, 47, 58, 68, 79, 89, 100]
        const idx = Math.max(0, Math.min(9, skillLevel - 1))
        const statBonus = statTable[idx]

        // 攻击速度百分比加成：2% * 技能等级，最高20%
        const attackSpeedBonus = 2 * skillLevel

        // 暴击率加成：2% * 技能等级，最高20%
        const critRateBonus = 2 * skillLevel

        return {
          // 智力固定值加成
          intelligence: { add: statBonus, rate: false },
          // 体质固定值加成
          constitution: { add: statBonus, rate: false },
          // 攻击速度百分比加成
          attackSpeed: { add: attackSpeedBonus, rate: true },
          // 暴击率百分比加成
          criticalRate: { add: critRateBonus, rate: true }
        }
      },

      /**
       * 计算 BUFF 持续时间（秒）
       * 基础300秒（5分钟） + 智力×2 + 体质×2
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（未使用，保持接口一致）
       * @returns {number} 持续时间（秒）
       */
      calculateBuffDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        const constitution = player?.stats?.constitution || 0
        // 基础300秒 + 智力×2 + 体质×2
        return 300 + Math.floor(intelligence * 2) + Math.floor(constitution * 2)
      }
    }
  },

  // ========== 元素使者技能 ==========
  element_mage: {
    /**
     * Q技能 - 赫雷森.凯列蓝的祝福
     * BUFF技能：传承于元素使者大师-赫雷森.凯列蓝的祝福之力
     * 施法后获得狂暴的元素之力，大幅增加暴击率、暴击伤害、元素属性攻击
     * 持续时间：基础1分钟 + 智力加成（每10点智力增加1秒）
     * 熟练度效果：
     *   - 暴击率：1级+3%，每级+3%，10级+30%
     *   - 暴击伤害：1级+2%，每级+2%，10级+20%
     *   - 全元素攻击：1级+2%，每级+2%，10级+20%
     */
    Q: {
      id: 'element_mage_q',
      key: 'Q',
      name: '赫雷森.凯列蓝的祝福',
      icon: '/pt/skill_icon/heleisenkailielandezufu.png',
      audio: '/sound/PcSkillM-Firecasting.wav',
      description: '传承于 元素使者大师-赫雷森.凯列蓝的祝福之力,施法后获得 狂暴的元素之力,大幅增加暴击率,暴击伤害,元素属性攻击,所向披靡.',
      type: SKILL_TYPES.BUFF,
      cd: 3,
      manaCost: 40,
      buffDuration: 60, // 基础持续时间1分钟（60秒）
      unlockLevel: 100,

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'elemental_blessing',
          // 暴击率加成 - 1级3%，每级+3%，10级30%
          criticalRate: { base: 3, increment: 3, max: 30, rate: true },
          // 暴击伤害加成 - 1级2%，每级+2%，10级20%
          criticalDamage: { base: 2, increment: 2, max: 20, rate: true },
          // 五行属性攻击加成 - 1级2%，每级+2%，10级20%
          fire: { base: 2, increment: 2, max: 20, rate: true },
          wind: { base: 2, increment: 2, max: 20, rate: true },
          earth: { base: 2, increment: 2, max: 20, rate: true },
          thunder: { base: 2, increment: 2, max: 20, rate: true },
          water: { base: 2, increment: 2, max: 20, rate: true }
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础60秒 + 每10点智力增加1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能等级（未使用，保持接口一致）
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseDuration = 60 // 1分钟
        const intelligence = Number(player?.stats?.intelligence ?? player?.intelligence ?? 0)
        return baseDuration + Math.floor(Math.max(0, intelligence) / 10)
      },

      /**
       * 计算BUFF效果
       * 1级: 暴击率+3%, 暴击伤害+2%, 全元素攻击+2%
       * 10级: 暴击率+30%, 暴击伤害+20%, 全元素攻击+20%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能等级
       * @returns {Object} BUFF效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        // 暴击率：1级3%，每级+3%，10级30%
        const critRateBonus = Math.min(3 + 3 * (skillLevel - 1), 30)
        // 暴击伤害：1级2%，每级+2%，10级20%
        const critDamageBonus = Math.min(2 + 2 * (skillLevel - 1), 20)
        // 全元素攻击：1级2%，每级+2%，10级20%
        const elementalBonus = Math.min(2 + 2 * (skillLevel - 1), 20)
        return {
          criticalRate: { add: critRateBonus, rate: true },
          criticalDamage: { add: critDamageBonus, rate: true },
          fireAttack: { add: elementalBonus, rate: true },
          windAttack: { add: elementalBonus, rate: true },
          earthAttack: { add: elementalBonus, rate: true },
          thunderAttack: { add: elementalBonus, rate: true },
          waterAttack: { add: elementalBonus, rate: true }
        }
      }
    },

    /**
     * W技能 - 狂风怒吼
     * AOE技能：一段时间内使区域笼罩在狂风之中，一定几率减缓区域内目标的攻击速度
     * 元素属性：风
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 4.68 + 攻击力
     * DEBUFF效果：减少敌人攻击速度，基础持续时间3秒，每10点智力+1秒
     */
    W: {
      id: 'element_mage_w',
      key: 'W',
      name: '狂风怒吼',
      icon: '/pt/skill_icon/elewinwinfil.png',
      audio: ['/sound/PcSkillM-Windcasting.wav', '/sound/PcSkillM-Windfld2.wav'],
      description: '一段时间内使区域笼罩在狂风之中，一定几率减缓区域内目标的攻击速度。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WIND,
      damage: 250,
      cd: 2,
      manaCost: 63,
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 55, // 1级熟练度伤害+55
          increment: 55 // 每级增加55，10级熟练度伤害+550
        }
      },

      // DEBUFF配置：攻击速度减少
      debuff: {
        type: 'attackSpeedReduction',
        chance: 10, // 基础概率10%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'attackSpeedReduction',
          baseDuration: 3, // 基础持续时间3秒
          intToDurationRatio: 10, // 每10点智力+1秒持续时间
          getValue: (skillLevel) => 3 + 3 * (skillLevel - 1) // 1级3%，每级+3%，10级30%
        }
      },

      /**
       * 计算技能最终伤害
       * 公式：基础伤害 + 熟练度伤害 + 智力 × 4.68 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：55 * 技能等级
        const proficiencyDamage = 55 * skillLevel

        // 智力加成：智力 × 4.68
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 4.68

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      },

      /**
       * 计算DEBUFF持续时间
       * 基础持续时间3秒 + 每10点智力增加1秒
       * @param {Object} player - 玩家对象
       * @returns {number} DEBUFF持续时间（秒）
       */
      calculateDebuffDuration(player) {
        const baseDuration = 3
        const intelligence = player?.stats?.intelligence || 0
        const bonusDuration = Math.floor(intelligence / 10)
        return baseDuration + bonusDuration
      },

      /**
       * 计算DEBUFF触发概率
       * 1级: 10%, 10级: 100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        // 1级10%，每级+10%，10级100%
        return Math.min(10 + 10 * (skillLevel - 1), 100)
      },

      /**
       * 计算DEBUFF效果值（减少攻击速度百分比）
       * 1级: 3%, 10级: 30%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击速度减少百分比
       */
      calculateDebuffEffect(skillLevel = 1) {
        return Math.min(3 + 3 * (skillLevel - 1), 30)
      }
    },

    /**
     * E技能 - 陨石坠落
     * AOE技能：召唤燃烧着的陨石袭击周围所有的对象
     * 元素属性：火
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 7.68 + 攻击力
     * DOT效果：火焰灼伤，每2秒触发一次，持续10秒，每次伤害=技能总伤害30%
     */
    E: {
      id: 'element_mage_e',
      key: 'E',
      name: '陨石坠落',
      icon: '/pt/skill_icon/elemulmeteos.png',
      audio: ['/sound/PcSkillM-Multicasting.wav', '/sound/PcSkillM-Firemaster.wav'],
      description: '召唤燃烧着的陨石袭击周围所有的对象。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.FIRE,
      damage: 180,
      cd: 17,
      manaCost: 150,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 120, // 1级熟练度伤害+120
          increment: 120 // 每级增加120，10级熟练度伤害+1200
        }
      },

      // DOT效果配置：火焰灼伤
      dotEffect: {
        name: '火焰灼伤',
        duration: 10, // 持续10秒
        tickInterval: 2, // 每2秒触发一次
        damageRate: 0.3 // 每次DOT伤害=技能总伤害30%
      },

      /**
       * 计算技能最终伤害
       * 公式：基础伤害 + 熟练度伤害 + 智力 × 7.68 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：120 * 技能等级
        const proficiencyDamage = 120 * skillLevel

        // 智力加成：智力 × 7.68
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 7.68

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      },

      /**
       * 计算DOT伤害
       * 每次DOT伤害 = 技能总伤害 × 30%
       * @param {number} baseDamage - 技能总伤害
       * @returns {number} DOT伤害值
       */
      calculateDotDamage(baseDamage) {
        return Math.floor(baseDamage * 0.3)
      }
    },

    /**
     * R技能 - 风沙吞噬
     * AOE技能：风与土形成的沙暴，令其中的目标受到剧烈攻击。有几率降低目标命中。
     * 元素属性：土
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
     * DEBUFF效果：命中率降低，持续14秒
     */
    R: {
      id: 'element_mage_r',
      key: 'R',
      name: '风沙吞噬',
      icon: '/pt/skill_icon/elemulsanstm.png',
      audio: ['PcSkillM-Multicasting.wav', '/sound/PcSkillM-Windmaster.wav'],
      description: '风与土形成的沙暴，令其中的目标受到剧烈攻击。有几率降低目标命中。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.EARTH,
      damage: 150,
      cd: 18,
      manaCost: 150,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 100, // 1级熟练度伤害+100
          increment: 100 // 每级增加100，10级熟练度伤害+1000
        }
      },

      // DEBUFF配置：命中率降低
      debuff: {
        type: 'hitRateReduction',
        chance: 10, // 基础概率10%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'hitRateReduction',
          duration: 14, // 持续14秒
          getValue: (skillLevel) => 4 + 4 * (skillLevel - 1) // 1级4%，每级+4%，10级40%
        }
      },

      /**
       * 计算技能最终伤害
       * 公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：100 * 技能等级
        const proficiencyDamage = 100 * skillLevel

        // 智力加成：智力 × 7.18
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 7.18

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      },

      /**
       * 计算DEBUFF触发概率
       * 1级: 10%, 10级: 100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        // 1级10%，每级+10%，10级100%
        return Math.min(10 + 10 * (skillLevel - 1), 100)
      },

      /**
       * 计算DEBUFF效果值（命中率降低百分比）
       * 1级: 4%, 10级: 40%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 命中率降低百分比
       */
      calculateDebuffEffect(skillLevel = 1) {
        return Math.min(4 + 4 * (skillLevel - 1), 40)
      }
    },

    /**
     * T技能 - 风雷狂袭
     * AOE技能：风雷聚集，猛烈轰击周围的目标。一定几率降低目标暴击伤害。
     * 元素属性：雷
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
     * DEBUFF效果：暴击伤害降低，持续14秒
     */
    T: {
      id: 'element_mage_t',
      key: 'T',
      name: '风雷狂袭',
      icon: '/pt/skill_icon/elemullgtstm.png',
      audio: ['/sound/PcSkillM-Multicasting.wav', '/sound/PcSkillM-Elemaster.wav'],
      description: '风雷聚集，猛烈轰击周围的目标。一定几率降低目标暴击伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.ELECTRICITY,
      damage: 145,
      cd: 14,
      manaCost: 150,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 120, // 1级熟练度伤害+120
          increment: 120 // 每级增加120，10级熟练度伤害+1200
        }
      },

      // DEBUFF配置：暴击伤害降低
      debuff: {
        type: 'critDamageReduction',
        chance: 10, // 基础概率10%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'critDamageReduction',
          duration: 14, // 持续14秒
          getValue: (skillLevel) => 5 + 5 * (skillLevel - 1) // 1级5%，每级+5%，10级50%
        }
      },

      /**
       * 计算技能最终伤害
       * 公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：120 * 技能等级
        const proficiencyDamage = 120 * skillLevel

        // 智力加成：智力 × 7.18
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 7.18

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      },

      /**
       * 计算DEBUFF触发概率
       * 1级: 10%, 10级: 100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        // 1级10%，每级+10%，10级100%
        return Math.min(10 + 10 * (skillLevel - 1), 100)
      },

      /**
       * 计算DEBUFF效果值（暴击伤害降低百分比）
       * 1级: 5%, 10级: 50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 暴击伤害降低百分比
       */
      calculateDebuffEffect(skillLevel = 1) {
        return Math.min(5 + 5 * (skillLevel - 1), 50)
      }
    },

    /**
     * Y技能 - 雪山崩塌
     * AOE技能：借助自然界水土之力引发的雪崩，借力一击，一定几率使被击中的目标陷入眩晕之中
     * 元素属性：水
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
     * DEBUFF效果：眩晕，持续3秒
     */
    Y: {
      id: 'element_mage_y',
      key: 'Y',
      name: '雪山崩塌',
      icon: '/pt/skill_icon/elemulavalan.png',
      audio: ['/sound/PcSkillM-Multicasting.wav', '/sound/PcSkillM-Watmaster.wav'],
      description: '借助自然界水土之力引发的雪崩，借力一击，一定几率使被击中的目标陷入眩晕之中。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WATER,
      damage: 145,
      cd: 15,
      manaCost: 150,
      unlockLevel: 80,

      unlockCondition(player) {
        return player.level >= 80
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 125, // 1级熟练度伤害+125
          increment: 125 // 每级增加125，10级熟练度伤害+1250
        }
      },

      // DEBUFF配置：眩晕效果
      debuff: {
        type: 'stun',
        chance: 10, // 基础概率10%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'stun',
          duration: 3, // 持续3秒
          icon: '/pt/UI/stun_stars.svg' // 眩晕图标
        }
      },

      /**
       * 计算技能最终伤害
       * 公式：基础伤害 + 熟练度伤害 + 智力 × 7.18 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10）
       * @returns {number} 技能伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        // 基础伤害
        const baseDamage = this.damage

        // 熟练度伤害加成：125 * 技能等级
        const proficiencyDamage = 125 * skillLevel

        // 智力加成：智力 × 7.18
        const intelligence = player?.stats?.intelligence || 0
        const intDamage = intelligence * 7.18

        // 攻击力（取平均攻击力）
        const minAttack = player?.minAttack || 0
        const maxAttack = player?.maxAttack || 0
        const attackDamage = (minAttack + maxAttack) / 2 * 0.16

        return Math.floor(baseDamage + proficiencyDamage + intDamage + attackDamage)
      },

      /**
       * 计算DEBUFF触发概率（眩晕概率）
       * 1级: 10%, 10级: 100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        // 1级10%，每级+10%，10级100%
        return Math.min(10 + 10 * (skillLevel - 1), 100)
      }
    }
  },

  // ========== 精神使者技能 ==========
  spirit_mage: {
    /**
     * Q技能 - 神念攻击
     * 利用自身强大神念令对方精神崩溃
     * 对方气血越少，技能攻击力越强
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 6.5 + 体力 × 5.98 + 攻击力
     * 特殊效果：基于怪物当前气血值百分比增加该技能总伤害百分比
     */
    Q: {
      id: 'spirit_mage_q',
      key: 'Q',
      name: '神念攻击',
      icon: '/pt/skill_icon/psyspirits.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
description: '利用自身强大神念令对方精神崩溃，对方气血越少，技能攻击力越强。',
type: SKILL_TYPES.SINGLE,
element: ELEMENT_TYPES.NONE,
damage: 800,
      cd: 0.5,
      manaCost: 150,
      unlockLevel: 60,

      unlockCondition(player) {
        return player.level >= 60
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 200,
          increment: 200 // 每级增加200伤害，满级2000
        }
      },

      /**
       * 特殊效果配置
       * 用于技能详情面板显示
       */
      specialEffect: {
        type: 'hpBasedDamageBonus',
        description: '基于怪物当前气血值百分比增加该技能总伤害百分比',
        details: [
          '怪物气血每少1%，技能总伤害增加1%',
          '最多增加100%伤害'
        ]
      },

      /**
       * 伤害计算
       * 公式: 基础伤害 + 熟练度伤害 + 智力 × 6.5 + 体力 × 5.98 + 攻击力
       * 特殊效果：基于怪物当前气血值百分比增加该技能总伤害百分比
       * 怪物气血每少1%，技能总伤害增加1%，最多增加100%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @param {string} enemyElement - 敌人元素属性（未使用）
       * @param {Object} enemy - 敌人对象（用于计算气血百分比加成）
       * @returns {number} 最终伤害值
       */
      calculateDamage(player, skillLevel = 1, enemyElement = null, enemy = null) {
        const baseDamage = this.damage
        // 熟练度伤害：1级200，每级+200，10级2000
        const proficiencyDamage = 200 + 200 * (skillLevel - 1)
        // 智力加成：智力 × 6.5
        const intDamage = player.stats.intelligence * 6.5
        // 体力加成：体力 × 5.98（支持 stamina、constitution、sta 属性）
        const staminaValue = player.stats.stamina || player.stats.constitution || player.stats.sta || 0
        const staDamage = staminaValue * 5.98

        // 基础伤害
        let totalDamage = Math.floor(baseDamage + proficiencyDamage + intDamage + staDamage + player.attack * 0.16)

        // 特殊效果：基于怪物当前气血值百分比增加伤害
        // 怪物气血每少1%，技能总伤害增加1%，最多增加100%
        if (enemy && enemy.currentHp !== undefined && enemy.maxHp !== undefined) {
          const hpPercent = enemy.currentHp / enemy.maxHp
          const missingHpPercent = 1 - hpPercent
          // 最多增加100%伤害
          const damageBonus = Math.min(missingHpPercent, 1)
          totalDamage = Math.floor(totalDamage * (1 + damageBonus))
        }

        return totalDamage
      },

      /**
       * 计算MP消耗
       * 基础150，每级熟练度增加10
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {number} MP消耗值
       */
      calculateManaCost(skillLevel = 1) {
        return 150 + (skillLevel - 1) * 10
      }
    },

    /**
     * 混沌封印
     * 将目标牵引至混沌的精神世界，使其受到严重创伤
     * 伤害公式：基础伤害 + 熟练度伤害 + 智力 × 5.5 + 攻击力
     */
    混沌封印: {
      id: 'spirit_mage_chaos_seal',
      key: '混沌封印',
      name: '混沌封印',
      icon: '/pt/skill_icon/psypsysquare.png',
      audio: '/sound/PcSkillM-Psysquare.wav',
description: '将目标牵引至混沌的精神世界，使其受到严重创伤。',
      type: SKILL_TYPES.AOE,
element: ELEMENT_TYPES.NONE,
damage: 600,
      cd: 2,
      manaCost: 113,
      unlockLevel: 65,

      unlockCondition(player) {
        return player.level >= 65
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 150,
          increment: 150 // 每级增加150伤害，满级1500
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害 + 熟练度伤害 + 智力 × 5.5 + 攻击力
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {number} 最终伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const baseDamage = this.damage
        // 熟练度伤害：1级150，每级+150，10级1500
        const proficiencyDamage = 150 + 150 * (skillLevel - 1)
        // 智力加成：智力 × 5.5
        const intDamage = player.stats.intelligence * 5.5
        return Math.floor(baseDamage + proficiencyDamage + intDamage + player.attack * 0.16)
      }
    },

    /**
     * 能量反弹
     * 将受到的物理伤害加倍返还回去
     * BUFF类型：反弹伤害
     * 基础持续时间：5分钟
     * 体质加成：每1点体质+1秒持续时间，每1点体质+1%反弹伤害
     */
    能量反弹: {
      id: 'spirit_mage_energy_reflect',
      key: '能量反弹',
      name: '能量反弹',
      icon: '/pt/skill_icon/psycruciospell.png',
      audio: '/sound/PcSkillD-Cruciosp.wav',
      description: '将受到的物理伤害加倍返还回去。',
      type: SKILL_TYPES.BUFF,
      cd: 3,
      manaCost: 85,
      buffDuration: 300, // 基础持续时间5分钟（300秒）
      unlockLevel: 70,

      unlockCondition(player) {
        return player.level >= 70
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'reflectDamage',
          base: 50, // 1级反弹50%伤害
          increment: 50 // 每级增加50%，10级反弹500%
        }
      },

      // BUFF配置
      buff: {
        type: 'reflectDamage',
        effect: {
          type: 'reflectDamage',
          baseDuration: 300, // 基础5分钟
          durationPerSta: 1, // 每1点体质+1秒
          baseReflect: 50, // 基础反弹50%
          reflectPerSta: 1 // 每1点体质+1%反弹
        }
      },

      /**
       * 计算BUFF效果
       * 反弹伤害 = 基础反弹(50%) + 熟练度加成(每级50%) + 体质加成(每点体质1%)
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {Object} BUFF效果参数
       */
      calculateBuff(player, skillLevel = 1) {
        // 熟练度反弹：1级50%，每级+50%，10级500%
        const proficiencyReflect = 50 + 50 * (skillLevel - 1)

        // 体质加成：每1点体质增加1%反弹伤害
        // 使用完整体质值（包含装备加成和buff加成）
        let staBonus = 0
        if (player) {
          // 基础体质
          const baseSta = Number(player?.stats?.constitution || player?.stats?.sta) || 0

          // 装备加成
          const equipmentStaBonus = Number(player?.equipmentBonuses?.constitution || player?.equipmentBonuses?.sta) || 0

          // buff加成
          let buffStaBonus = 0
          const activeBuffs = Array.isArray(player?.activeBuffs) ? player.activeBuffs : []
          for (let i = 0; i < activeBuffs.length; i++) {
            const buff = activeBuffs[i]
            if (!buff || typeof buff !== 'object') { continue }

            // 检查parameter字段
            const param = String(buff.parameter || '').toLowerCase()
            if (param === 'sta' || param === 'constitution') {
              buffStaBonus += Number(buff.value || buff.add || buff.amount || 0)
            }

            // 检查effects字段
            const effects = buff.effects
            if (effects && typeof effects === 'object') {
              const keys = Object.keys(effects)
              for (let j = 0; j < keys.length; j++) {
                const key = keys[j]
                const keyLower = String(key).toLowerCase()
                if (keyLower === 'constitution' || keyLower === 'sta') {
                  const rawValue = effects[key]
                  const numeric = rawValue && typeof rawValue === 'object'
                    ? Number(rawValue.add || 0)
                    : Number(rawValue || 0)
                  if (Number.isFinite(numeric)) {
                    buffStaBonus += numeric
                  }
                }
              }
            }
          }

          staBonus = baseSta + equipmentStaBonus + buffStaBonus
        }

        // 总反弹伤害百分比
        const totalReflect = proficiencyReflect + staBonus

        return {
          reflectDamage: { add: totalReflect, rate: false }, // 反弹伤害百分比
          staBonus // 用于显示体质加成
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础5分钟 + 每1点体质+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（未使用，持续时间不随熟练度变化）
       * @returns {number} 持续时间（秒）
       */
      calculateBuffDuration(player, skillLevel = 1) {
        const baseDuration = 300 // 5分钟
        const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
        return baseDuration + staBonus
      }
    },

    /**
     * 念力护盾
     * 吸收部分来自敌人的伤害
     * BUFF类型：伤害护盾
     * 基础持续时间：5分钟
     * 体质加成：每1点体力+1秒持续时间
     * 吸收效果：熟练度百分比（上限50%）+ 体质额外加成（上限50%），总计上限100%
     */
    念力护盾: {
      id: 'spirit_mage_psychic_shield',
      key: '念力护盾',
      name: '念力护盾',
      icon: '/pt/skill_icon/psypsywall.png',
      audio: '/sound/PcSkillD-Iceshark.wav',
      description: '从精神使者导师赛乐处习得的奥秘，能吸收部分来自敌人的伤害。',
      type: SKILL_TYPES.BUFF,
      cd: 10,
      manaCost: 100,
      buffDuration: 300, // 基础持续时间5分钟（300秒）
      unlockLevel: 75,

      unlockCondition(player) {
        return player.level >= 75
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damageShield',
          base: 5, // 1级吸收5%最大生命值
          increment: 5 // 每级增加5%，10级吸收50%
        }
      },

      // BUFF配置
      buff: {
        type: 'damageShield',
        effect: {
          type: 'damageShield',
          baseDuration: 300, // 基础5分钟
          durationPerSta: 1, // 每1点体质+1秒
          baseAbsorb: 5, // 基础吸收5%
          absorbPerSta: 0.1, // 每10点体质+1%（即每点体质+0.1%）
          maxProficiencyAbsorb: 50, // 熟练度吸收上限50%
          maxStaAbsorb: 50, // 体质吸收上限50%
          maxTotalAbsorb: 100 // 总吸收上限100%
        }
      },

      /**
       * 计算BUFF效果
       * 吸收百分比 = 熟练度百分比（上限50%）+ 体质加成（上限50%），总计上限100%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {Object} BUFF效果参数
       */
      calculateBuff(player, skillLevel = 1) {
        // 熟练度吸收：1级5%，每级+5%，10级50%，上限50%
        const proficiencyAbsorb = Math.min(50, 5 + 5 * (skillLevel - 1))

        // 体质加成：每10点体质增加1%吸收，上限50%
        const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
        const staAbsorbBonus = Math.min(50, Math.floor(staBonus / 10)) // 每10点体质+1%，上限50%

        // 总吸收百分比，上限100%
        const totalAbsorbPercent = Math.min(100, proficiencyAbsorb + staAbsorbBonus)

        // 计算可吸收的最大伤害值
        const maxHealth = player?.maxHealth || player?.stats?.maxHealth || 1000
        const maxAbsorbDamage = Math.floor(maxHealth * totalAbsorbPercent / 100)

        return {
          damageShield: { add: totalAbsorbPercent, rate: false }, // 吸收百分比
          maxAbsorbDamage, // 可吸收的最大伤害值
          currentAbsorbDamage: maxAbsorbDamage, // 当前剩余可吸收伤害（初始等于最大值）
          absorbPercent: totalAbsorbPercent, // 吸收百分比用于显示
          proficiencyAbsorb, // 熟练度吸收百分比用于显示
          staAbsorbBonus, // 体质吸收百分比用于显示
          staBonus // 用于显示体质加成
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础5分钟 + 每1点体质+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（未使用）
       * @returns {number} 持续时间（秒）
       */
      calculateBuffDuration(player, skillLevel = 1) {
        const baseDuration = 300 // 5分钟
        const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
        return baseDuration + staBonus
      }
    },

    /**
     * 赛乐的祝福
     * 大幅度增加使用者的精神和体魄，攻击附加概率击晕和减少攻击效果
     * BUFF类型：属性增益 + 攻击触发DEBUFF
     * 基础持续时间：3分钟
     * 持续时间加成：每1点体质+1秒，每1点智力+1秒
     */
    赛乐的祝福: {
      id: 'spirit_mage_syle_blessing',
      key: '赛乐的祝福',
      name: '赛乐的祝福',
      icon: '/pt/skill_icon/psygravitywell.png',
      audio: '/sound/PcSkillD-Guard.wav',
      description: '从精神使者导师赛乐习得的精神奥秘，大幅度增加使用者的精神和体魄，攻击附加概率击晕和减少攻击效果。',
      type: SKILL_TYPES.BUFF,
      cd: 10,
      manaCost: 120,
      buffDuration: 180, // 基础持续时间3分钟（180秒）
      unlockLevel: 100,

      unlockCondition(player) {
        return player.level >= 100
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'multi_buff',
          subSkills: {
            intelligence: {
              base: 5, // 1级智力+5
              increment: 5, // 每级+5，10级+50
              description: '智力'
            },
            constitution: {
              base: 5, // 1级体质+5
              increment: 5, // 每级+5，10级+50
              description: '体质'
            }
          }
        }
      },

      // BUFF配置
      buff: {
        type: 'multi_buff',
        effect: {
          type: 'multi_buff',
          baseDuration: 180, // 基础3分钟
          durationPerSta: 1, // 每1点体质+1秒
          durationPerInt: 1, // 每1点智力+1秒
          // 攻击触发DEBUFF效果
          attackTriggerDebuff: {
            stun: {
              baseChance: 30, // 1级30%概率眩晕
              chanceIncrement: 3, // 每级+3%，10级57%
              duration: 3 // 眩晕3秒
            },
            attackReduction: {
              baseChance: 30, // 1级30%概率减少攻击
              chanceIncrement: 3, // 每级+3%，10级57%
              baseReduction: 3, // 1级减少3%攻击
              reductionIncrement: 3, // 每级+3%，10级减少30%
              debuffDuration: 5 // DEBUFF持续5秒
            }
          }
        }
      },

      /**
       * 计算BUFF效果
       * 智力加成 = 5 + (技能等级-1) * 5
       * 体质加成 = 5 + (技能等级-1) * 5
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {Object} BUFF效果参数
       */
      calculateBuff(player, skillLevel = 1) {
        // 熟练度加成：1级+5，每级+5，10级+50
        const statBonus = 5 + (skillLevel - 1) * 5

        return {
          intelligence: { add: statBonus, rate: false },
          constitution: { add: statBonus, rate: false }
        }
      },

      /**
       * 计算BUFF持续时间
       * 基础3分钟 + 每1点体质+1秒 + 每1点智力+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（未使用）
       * @returns {number} 持续时间（秒）
       */
      calculateBuffDuration(player, skillLevel = 1) {
        const baseDuration = 180 // 3分钟
        const staBonus = player?.stats?.constitution || player?.stats?.sta || 0
        const intBonus = player?.stats?.intelligence || player?.stats?.int || 0
        return baseDuration + staBonus + intBonus
      },

      /**
       * 计算攻击触发DEBUFF效果
       * @param {number} skillLevel - 技能熟练度等级（1-10级）
       * @returns {Object} DEBUFF效果配置
       */
      calculateAttackDebuff(skillLevel = 1) {
        // 眩晕概率：1级3%，每级+3%，10级30%
        const stunChance = 3 + (skillLevel - 1) * 3
        // 攻击减少概率：1级3%，每级+3%，10级30%
        const attackReductionChance = 3 + (skillLevel - 1) * 3
        // 攻击减少量：1级3%，每级+3%，10级30%
        const attackReduction = 3 + (skillLevel - 1) * 3

        return {
          stun: {
            chance: stunChance,
            duration: 3
          },
          attackReduction: {
            chance: attackReductionChance,
            reduction: attackReduction,
            duration: 5
          }
        }
      }
    }
  },

  // ========== 圣殿骑士技能 ==========
  // 三转职业：由骑士(knight)进阶，高防高血 中攻击 的圣盾守护者
  // 技能体系参照风暴行者设计：5个主技能 + 多个EX被动技能，共7条成长线路
  // 职业特征：继承骑士的重甲防御与大地共鸣能力，将圣光之力注入盾牌与重武器，
  //           以坚不可摧的防御和圣殿裁决碾压敌人
  holy_knight: {
    /**
     * Q技能 - 神圣壁垒
     * 群体BUFF技能：以圣盾为引导展开神圣壁垒，持续期间提升全队防御力
     * 一阶强化（神圣壁垒EX1）额外提升全队最大生命值；二阶强化（神圣壁垒EX2）额外提升全队伤害减免
     * 三阶强化（神圣壁垒EX3）持续期间所有队员受到伤害的15%由释放者分担（仅副本生效）
     * CD100秒，持续时间为CD一半（50秒）
     * 1级熟练度：防御力+2%
     * 5级熟练度：防御力+10%
     * 生命值加成由神圣壁垒EX1被动技能提供（180级解锁）
     * 伤害减免加成由神圣壁垒EX2被动技能提供（185级解锁）
     * 伤害分担由神圣壁垒EX3被动技能提供（190级解锁）
     */
    Q: {
      id: 'holy_knight_q',
      key: 'Q',
      name: '神圣壁垒',
      icon: '/pt/skill_icon/shenshengbilei.png',
      audio: '/sound/PcSkillD-protection.wav',
      description:
        '以圣盾为引导展开神圣壁垒庇护全队，持续期间提升全队防御力；一阶强化额外提升全队最大生命值，二阶强化进一步增加全队伤害减免，三阶强化持续期间所有队员受到伤害的15%由释放者分担。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 100,
      manaCost: 260,
      buffDuration: 50,
      isPartyBuff: true,
      unlockLevel: 175,
      growthLine: 'holy_bulwark',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'holy_bulwark_buff',
          defense: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 神圣壁垒提供防御力百分比加成
       * 若已学会神圣壁垒EX1（O技能），叠加最大生命值百分比加成
       * 若已学会神圣壁垒EX2（O_EX2技能），叠加伤害减免百分比加成
       * 若已学会神圣壁垒EX3（O_EX3技能），标记伤害分担效果（实际分担逻辑在伤害处理中实现）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 defense，可选 maxHp、damageReduction、damageShare）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          defense: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 神圣壁垒EX1被动技能提供额外最大生命值百分比加成
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.holy_knight.O
            if (ex1Def && typeof ex1Def.getMaxHpBonus === 'function') {
              result.maxHp = {
                add: ex1Def.getMaxHpBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          console.log('[神圣壁垒] EX1检测异常:', e?.message || e)
        }

        // 神圣壁垒EX2被动技能提供额外伤害减免百分比加成
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.holy_knight.O_EX2
            if (ex2Def && typeof ex2Def.getDamageReductionBonus === 'function') {
              result.damageReduction = {
                add: ex2Def.getDamageReductionBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 神圣壁垒EX2未解锁或未加载时不提供伤害减免加成
        }

        // 神圣壁垒EX3被动技能提供伤害分担效果标记（实际分担逻辑在 Dungeon 伤害处理中实现）
        try {
          const ex3Skill = player?.skills?.['O_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.holy_knight.O_EX3
            if (ex3Def && typeof ex3Def.getDamageSharePercent === 'function') {
              result.damageShare = {
                add: ex3Def.getDamageSharePercent(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 神圣壁垒EX3未解锁或未加载时不提供伤害分担
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：CD的一半（100秒CD / 2 = 50秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        return 50
      }
    },

    /**
     * O技能 - 神圣壁垒EX1-增强生命值（被动技能）
     * 增强神圣壁垒效果，持续期间额外提升全队最大生命值
     * 1级即为最大熟练度，默认满级效果：+10%最大生命值
     * 每次释放神圣壁垒（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'holy_knight_o',
      key: 'O',
      name: '神圣壁垒EX1-增强生命值',
      icon: '/pt/skill_icon/shenshengbilei.png',
      audio: '/sound/PcSkillD-protection.wav',
      description: '被动技能：增强神圣壁垒，全队最大生命值+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'holy_bulwark',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_bulwark_max_hp',
          maxHp: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取神圣壁垒EX1提供的额外最大生命值百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外最大生命值百分比加成（固定10）
       */
      getMaxHpBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX2技能 - 神圣壁垒EX2-增强伤害减免（被动技能）
     * 增强神圣壁垒效果，持续期间额外提升全队伤害减免
     * 1级即为最大熟练度，默认满级效果：+10%伤害减免
     * 解锁等级：185级
     * 每次释放神圣壁垒（Q技能）时，该被动技能熟练度随之增加
     */
    O_EX2: {
      id: 'holy_knight_o_ex2',
      key: 'O_EX2',
      name: '神圣壁垒EX2-增强伤害减免',
      icon: '/pt/skill_icon/shenshengbilei.png',
      audio: '/sound/PcSkillD-protection.wav',
      description: '被动技能：增强神圣壁垒，全队伤害减免+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'holy_bulwark',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_bulwark_damage_reduction',
          damageReduction: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取神圣壁垒EX2提供的额外伤害减免百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外伤害减免百分比加成（固定10）
       */
      getDamageReductionBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX3技能 - 神圣壁垒EX3-伤害分担（被动技能）
     * 增强神圣壁垒，持续期间所有队员受到伤害的15%由释放神圣壁垒的角色分担
     * 1级即为最大熟练度，默认满级效果：伤害分担15%
     * 仅副本页面生效（主页面无队友）
     * 技能图片、音效与神圣壁垒一致
     * 解锁等级：190级
     */
    O_EX3: {
      id: 'holy_knight_o_ex3',
      key: 'O_EX3',
      name: '神圣壁垒EX3-伤害分担',
      icon: '/pt/skill_icon/shenshengbilei.png',
      audio: '/sound/PcSkillD-protection.wav',
      description: '被动技能：神圣壁垒持续期间，所有队员受到伤害的15%由释放神圣壁垒的角色分担（仅副本生效）。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'holy_bulwark',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_bulwark_damage_share',
          damageShare: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取神圣壁垒EX3提供的伤害分担百分比
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害分担百分比（固定15）
       */
      getDamageSharePercent(skillLevel = 1) {
        return 15
      }
    },

    /**
     * W技能 - 荣耀之剑
     * 单体大地属性伤害技能：将圣光之力凝聚为荣耀之剑，锁定单一敌人发起荣耀斩击
     * 基础伤害1200，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+3000
     * 力量加成：每点力量提供5点伤害
     * 体质加成：每点体质提供7点伤害
     * CD减少由荣耀之剑EX1被动技能提供（175级解锁）
     * 伤害增加由荣耀之剑EX2被动技能提供（185级解锁）
     * 倍攻由荣耀之剑EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'holy_knight_w',
      key: 'W',
      name: '荣耀之剑',
      icon: '/pt/skill_icon/rongyaozhijian.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description:
        '将圣光之力凝聚为荣耀之剑，锁定单一敌人发起绝命之荣耀斩击，造成毁灭性大地属性物理伤害。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.EARTH,
      damage: 1200,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      growthLine: 'shield_bash',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 200,
          increment: (3000 - 200) / 4
        }
      },

      /**
       * 伤害计算（力量+体质型单体大地属性伤害）
       * 公式: 基础伤害(1200) + 熟练度伤害(1级+200,5级+3000) + 力量×5 + 体质×7 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 200 + ((3000 - 200) / 4) * (safeLevel - 1)
        const strength = Number(player?.stats?.strength || 0)
        const strDamage = strength * 5
        const constitution = Number(player?.stats?.constitution || player?.stats?.stamina || 0)
        const conDamage = constitution * 7
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + strDamage + conDamage + attack * 0.3)
      }
    },

    /**
     * W_EX技能 - 荣耀之剑EX1-CD减少（被动技能）
     * 增强荣耀之剑，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少荣耀之剑技能CD 50%
     * 技能图片、音效与荣耀之剑一致
     */
    W_EX: {
      id: 'holy_knight_w_ex',
      key: 'W_EX',
      name: '荣耀之剑EX1-CD减少',
      icon: '/pt/skill_icon/rongyaozhijian.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：减少荣耀之剑冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'shield_bash',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shield_bash_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取荣耀之剑CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 荣耀之剑EX2-伤害增加（被动技能）
     * 增强荣耀之剑，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加荣耀之剑技能伤害 50%
     * 技能图片、音效与荣耀之剑一致
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'holy_knight_w_ex2',
      key: 'W_EX2',
      name: '荣耀之剑EX2-伤害增加',
      icon: '/pt/skill_icon/rongyaozhijian.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：增加荣耀之剑技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'shield_bash',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shield_bash_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取荣耀之剑伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 荣耀之剑EX3-倍攻（被动技能）
     * 增强荣耀之剑，概率触发倍攻伤害
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率造成2倍伤害
     *   20%概率造成3倍伤害
     *   10%概率造成4倍伤害
     * 概率为逐级包含关系：30%包含20%和10%
     * 技能图片、音效与荣耀之剑一致
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'holy_knight_w_ex3',
      key: 'W_EX3',
      name: '荣耀之剑EX3-倍攻',
      icon: '/pt/skill_icon/rongyaozhijian.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：增强荣耀之剑，概率触发倍攻伤害。30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成4倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'shield_bash',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shield_bash_critical_multiplier',
          criticalMultiplier: {
            chance2x: 30,
            chance3x: 20,
            chance4x: 10
          }
        }
      },

      /**
       * 获取倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance2x, chance3x, chance4x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance2x: 30,
          chance3x: 20,
          chance4x: 10
        }
      }
    },

    /**
     * E技能 - 碎甲圣裁
     * 单体DEBUFF技能：将圣光之力注入重武器斩击敌人，命中后施加「护甲碎裂」
     * 印记期间目标防御力大幅降低，承受伤害增加
     * 1级熟练度：伤害+150，目标防御力-50%，承受伤害+30%
     * 5级熟练度：伤害+1000，目标防御力-50%，承受伤害+30%
     * 基础CD 120秒，DEBUFF持续时间为CD的一半（60秒）
     * 解锁EX1后CD 60秒，DEBUFF持续时间30秒
     * CD减少由碎甲圣裁EX1被动技能提供（175级解锁）
     * 伤害增加由碎甲圣裁EX2被动技能提供（185级解锁）
     */
    E: {
      id: 'holy_knight_e',
      key: 'E',
      name: '碎甲圣裁',
      icon: '/pt/skill_icon/suijiashengcai.png',
      audio: '/sound/PcPatDDmg.wav',
      description:
        '将圣光之力注入重武器斩击单体敌人，造成大地属性伤害。受击目标附上「护甲碎裂」，持续60秒，期间目标防御力降低50%，承受伤害增加30%。解锁EX1后CD与DEBUFF持续时间均减半。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.EARTH,
      damage: 500,
      cd: 120,
      manaCost: 200,
      duration: 60,
      unlockLevel: 170,
      growthLine: 'armor_shatter',

      // DEBUFF配置：护甲碎裂（防御力降低 + 承受伤害增加）
      debuff: {
        type: 'armorBreak',
        chance: 100,
        effect: {
          type: 'armorBreak',
          icon: '/pt/skill_icon/suijiashengcai.png',
          baseDuration: 60,
          /**
           * 获取防御力降低百分比（固定50%）
           * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回50）
           * @returns {number} 防御力降低百分比
           */
          getValue(skillLevel) {
            return 50
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算（力量+体质型大地属性伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 力量×5.18 + 体质×3.18 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const strDamage = Number(player?.stats?.strength || 0) * 5.18
        const conDamage = Number(player?.stats?.constitution || player?.stats?.stamina || 0) * 3.18
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + strDamage + conDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（防御力降低50%，承受伤害增加30%）
       * 固定效果：防御力-50%，承受伤害+30%
       * 持续时间：基础60秒，解锁EX1后减半为30秒
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定效果）
       * @param {Object} [player] - 玩家对象，用于判断EX1解锁状态
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        // 基础持续60秒，解锁EX1后减半为30秒
        let duration = 60
        if (player && isSkillUnlocked(player, 'holy_knight', 'E_EX1')) {
          duration = 30
        }
        return {
          defenseReduction: 50,
          damageIncrease: 30,
          duration
        }
      }
    },

    /**
     * E_EX1技能 - 碎甲圣裁EX1-CD减少（被动技能）
     * 增强碎甲圣裁，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少碎甲圣裁技能CD 50%
     * 基础CD 120秒 → 解锁后CD 60秒，DEBUFF持续时间同步减半（60秒→30秒）
     * 技能图片、音效与碎甲圣裁一致
     */
    E_EX1: {
      id: 'holy_knight_e_ex1',
      key: 'E_EX1',
      name: '碎甲圣裁EX1-CD减少',
      icon: '/pt/skill_icon/suijiashengcai.png',
      audio: '/sound/PcPatDDmg.wav',
      description: '被动技能：减少碎甲圣裁冷却时间50%，DEBUFF持续时间同步减半。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'armor_shatter',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'armor_shatter_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取碎甲圣裁CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 碎甲圣裁EX2-伤害增加（被动技能）
     * 增强碎甲圣裁，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加碎甲圣裁技能伤害 50%
     * 技能图片、音效与碎甲圣裁一致
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'holy_knight_e_ex2',
      key: 'E_EX2',
      name: '碎甲圣裁EX2-伤害增加',
      icon: '/pt/skill_icon/suijiashengcai.png',
      audio: '/sound/PcPatDDmg.wav',
      description: '被动技能：增加碎甲圣裁技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'armor_shatter',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'armor_shatter_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取碎甲圣裁伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX3技能 - 碎甲圣裁EX3-双倍惩戒强化（被动技能）
     * 增强碎甲圣裁，当目标有碎甲圣裁DEBUFF时，双倍惩戒触发概率*2
     * 1级即为最大熟练度，默认满级效果：双倍惩戒概率*2
     * 示例：双倍惩戒当前概率25%，解锁EX3后概率为50%
     * 技能图片、音效与碎甲圣裁一致
     * 解锁等级：190级
     */
    E_EX3: {
      id: 'holy_knight_e_ex3',
      key: 'E_EX3',
      name: '碎甲圣裁EX3-双倍惩戒强化',
      icon: '/pt/skill_icon/suijiashengcai.png',
      audio: '/sound/PcPatDDmg.wav',
      description: '被动技能：碎甲圣裁DEBUFF持续期间，攻击带有该DEBUFF的目标时，双倍惩戒触发概率*2。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'armor_shatter',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'armor_shatter_double_judgment_boost',
          doubleJudgmentMultiplier: {
            base: 2,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取碎甲圣裁EX3提供的双倍惩戒概率倍率
       * 1级即为最大熟练度，固定返回2（概率*2）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 双倍惩戒概率倍率（固定2）
       */
      getDoubleJudgmentMultiplier(skillLevel = 1) {
        return 2
      }
    },

    /**
     * U技能 - 圣殿裁决
     * AOE大地属性伤害技能：将圣光之力注入重武器，对范围内敌人发动圣殿裁决斩击
     * 基础伤害800，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
     * 力量加成：每点力量提供4.5点伤害
     * 体质加成：每点体质提供6点伤害
     * CD减少由圣殿裁决EX1被动技能提供（175级解锁）
     * 伤害增加由圣殿裁决EX2被动技能提供（185级解锁）
     */
    U: {
      id: 'holy_knight_u',
      key: 'U',
      name: '圣殿裁决',
      icon: '/pt/skill_icon/shengdiancaijue.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description:
        '将圣光之力注入重武器，对范围内敌人发动圣殿裁决斩击，造成毁灭性大地属性范围伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.EARTH,
      damage: 800,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      growthLine: 'holy_judgment_aoe',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 伤害计算（力量+体质型AOE大地属性伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 力量×4.5 + 体质×6 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        const strength = Number(player?.stats?.strength || 0)
        const strDamage = strength * 4.5
        const constitution = Number(player?.stats?.constitution || player?.stats?.stamina || 0)
        const conDamage = constitution * 6
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + strDamage + conDamage + attack * 0.3)
      }
    },

    /**
     * U_EX1技能 - 圣殿裁决EX1-CD减少（被动技能）
     * 增强圣殿裁决，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少圣殿裁决技能CD 50%
     * 技能图片、音效与圣殿裁决一致
     */
    U_EX1: {
      id: 'holy_knight_u_ex1',
      key: 'U_EX1',
      name: '圣殿裁决EX1-CD减少',
      icon: '/pt/skill_icon/shengdiancaijue.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：减少圣殿裁决冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'holy_judgment_aoe',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_judgment_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣殿裁决CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 圣殿裁决EX2-伤害增加（被动技能）
     * 增强圣殿裁决，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加圣殿裁决技能伤害 50%
     * 技能图片、音效与圣殿裁决一致
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'holy_knight_u_ex2',
      key: 'U_EX2',
      name: '圣殿裁决EX2-伤害增加',
      icon: '/pt/skill_icon/shengdiancaijue.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：增加圣殿裁决技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'holy_judgment_aoe',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_judgment_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣殿裁决伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX3技能 - 圣殿裁决EX3-倍攻（被动技能）
     * 增强圣殿裁决，概率触发倍攻伤害
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率造成2倍伤害
     *   20%概率造成2.5倍伤害
     *   10%概率造成3倍伤害
     * 概率为逐级包含关系：30%包含20%和10%
     * 技能图片、音效与圣殿裁决一致
     * 解锁等级：190级
     */
    U_EX3: {
      id: 'holy_knight_u_ex3',
      key: 'U_EX3',
      name: '圣殿裁决EX3-倍攻',
      icon: '/pt/skill_icon/shengdiancaijue.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：增强圣殿裁决，概率触发倍攻伤害。30%概率造成2倍伤害，20%概率造成2.5倍伤害，10%概率造成3倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'holy_judgment_aoe',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_judgment_critical_multiplier',
          criticalMultiplier: {
            chance2x: 30,
            chance2_5x: 20,
            chance3x: 10
          }
        }
      },

      /**
       * 获取倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance2x, chance2_5x, chance3x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance2x: 30,
          chance2_5x: 20,
          chance3x: 10
        }
      }
    },

    /**
     * I技能 - 重甲精通（被动技能）
     * 增加自身防御力，按熟练度百分比提升
     * 1级熟练度：防御力+5%
     * 5级熟练度：防御力+25%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'holy_knight_i',
      key: 'I',
      name: '重甲精通',
      icon: '/pt/skill_icon/zhongjiajingtong.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：增加自身防御力，随熟练度提升。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      growthLine: 'heavy_armor_mastery',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'heavy_armor_defense_mastery',
          defenseBonus: {
            base: 5,
            increment: 5,
            rate: true
          }
        }
      },

      /**
       * 获取防御力加成百分比
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 防御力加成百分比（0-25）
       */
      getDefenseBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 5 * safeLevel
      }
    },

    /**
     * I_EX1技能 - 重甲精通EX1-属性抗性增强（被动技能）
     * 增加重甲精通，增加所有属性抗性
     * 1级即为最大熟练度，默认满级效果：所有属性抗性+10%（雷、水、火、风、土）
     * 技能图片与重甲精通一致
     * 解锁等级：170级
     */
    I_EX1: {
      id: 'holy_knight_i_ex1',
      key: 'I_EX1',
      name: '重甲精通EX1-属性抗性增强',
      icon: '/pt/skill_icon/zhongjiajingtong.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：增加所有属性抗性10%（雷属性抗性、水、火、风、土）。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 170,
      growthLine: 'heavy_armor_mastery',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'heavy_armor_mastery_ex1',
          allResistanceBonus: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取所有属性抗性加成百分比
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 所有属性抗性加成百分比（固定10）
       */
      getAllResistanceBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * I_EX2技能 - 重甲精通EX2-增强生命值（被动技能）
     * 增加重甲精通，额外增加最大生命值
     * 1级即为最大熟练度，默认满级效果：额外增加最大生命值15%
     * 技能图片与重甲精通一致
     * 解锁等级：180级
     */
    I_EX2: {
      id: 'holy_knight_i_ex2',
      key: 'I_EX2',
      name: '重甲精通EX2-增强生命值',
      icon: '/pt/skill_icon/zhongjiajingtong.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：额外增加最大生命值15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'heavy_armor_mastery',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'heavy_armor_mastery_ex2',
          maxHpBonus: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外最大生命值加成百分比
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外最大生命值加成百分比（固定15）
       */
      getMaxHpBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * I_EX3技能 - 重甲精通EX3-概率减伤（被动技能）
     * 增加重甲精通，受到攻击时概率触发减伤
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率减少所有受到的伤害10%
     *   20%概率减少所有受到的伤害20%
     *   10%概率减少所有受到的伤害30%
     * 概率为逐级包含关系：30%包含20%和10%
     * 技能图片与重甲精通一致
     * 解锁等级：190级
     */
    I_EX3: {
      id: 'holy_knight_i_ex3',
      key: 'I_EX3',
      name: '重甲精通EX3-概率减伤',
      icon: '/pt/skill_icon/zhongjiajingtong.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '被动技能：受到攻击时概率触发减伤，30%概率减少所有伤害10%，20%概率减少所有伤害20%，10%概率减少所有伤害30%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'heavy_armor_mastery',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'heavy_armor_mastery_ex3',
          damageReduction: {
            tiers: [
              { chance: 30, reduction: 10 },
              { chance: 20, reduction: 20 },
              { chance: 10, reduction: 30 }
            ]
          }
        }
      },

      /**
       * 获取概率减伤触发信息
       * 1级即为最大熟练度，返回减伤配置数组
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object|null} 减伤配置对象，包含 tiers 数组
       */
      getDamageReduction(skillLevel = 1) {
        return {
          tiers: [
            { chance: 30, reduction: 10 },
            { chance: 20, reduction: 20 },
            { chance: 10, reduction: 30 }
          ]
        }
      },

      /**
       * 随机摇取减伤倍率
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 减伤百分比（0表示未触发减伤，10/20/30表示触发对应减伤）
       */
      rollDamageReduction(skillLevel = 1) {
        const config = this.getDamageReduction(skillLevel)
        if (!config || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          return 0
        }
        for (const tier of config.tiers) {
          if (Math.random() * 100 < tier.chance) {
            return tier.reduction
          }
        }
        return 0
      }
    },

    /**
     * J技能 - 裁决积累（被动技能）
     * 获得圣光之力-裁决积累，每次普通攻击或释放技能增加一点裁决值，最高10点
     * 第10次普通攻击附加攻击力百分比的额外大地属性伤害，然后重置裁决值
     * MP:30（每次普通攻击减少30点MP，增加一个裁决值）
     * 1级熟练度：第10次普通攻击附加攻击力10%的伤害
     * 10级熟练度：第10次普通攻击附加攻击力100%的伤害
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'holy_knight_j',
      key: 'J',
      name: '裁决积累',
      icon: '/pt/skill_icon/caijuejilei.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description:
        '获得圣光之力-裁决积累，每次普通攻击或释放技能增加一点裁决值，最高10点，达到触发阈值时附加攻击力百分比的额外大地属性伤害，然后重置裁决值。每次普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      growthLine: 'holy_accumulation',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'holy_accumulation_bonus',
          attackPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取圣光积累附加攻击力百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击力附加百分比（10-100）
       */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取圣光积累触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取圣光积累每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 裁决积累EX1-减少触发次数（被动技能）
     * 增强裁决积累，减少普通攻击附加伤害的次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     * 技能图片与裁决积累一致
     */
    J_EX1: {
      id: 'holy_knight_j_ex1',
      key: 'J_EX1',
      name: '裁决积累EX1-减少触发次数',
      icon: '/pt/skill_icon/caijuejilei.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '增强裁决积累，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'holy_accumulation',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_accumulation_trigger_reduction',
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣光积累触发次数减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 裁决积累EX2-倍攻（被动技能）
     * 增强裁决积累，在EX1触发次数阈值时概率触发倍攻
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击/技能释放 30%概率附加200%攻击力
     *   第5次普通攻击/技能释放 20%概率附加300%攻击力
     *   第5次普通攻击/技能释放 10%概率附加400%攻击力
     * 概率为逐级包含关系：30%包含20%和10%
     * 技能图片与裁决积累一致
     */
    J_EX2: {
      id: 'holy_knight_j_ex2',
      key: 'J_EX2',
      name: '裁决积累EX2-倍攻',
      icon: '/pt/skill_icon/caijuejilei.png',
      audio: '/sound/PcSkillD-Powerstump.wav',
      description: '增强裁决积累，在EX1触发次数时概率触发倍攻（30%概率200%攻击力、20%概率300%攻击力、10%概率400%攻击力）。需先解锁裁决积累EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'holy_accumulation',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_accumulation_multi_attack',
          multiAttack: {
            chance1: 30,
            bonus1: 200,
            chance2: 20,
            bonus2: 300,
            chance3: 10,
            bonus3: 400
          }
        }
      },

      /**
       * 获取圣光积累EX2倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 30,
          bonus1: 200,
          chance2: 20,
          bonus2: 300,
          chance3: 10,
          bonus3: 400
        }
      }
    },

    /**
     * R技能 - 圣盾觉醒
     * 单体自身BUFF技能：将圣光之力极限压缩注入盾牌，进入「圣盾觉醒」状态
     * 持续期间大幅提升自身防御力和大地属性攻击力
     * 基础持续时间30秒（CD的一半）
     * 1级熟练度：防御力+5%，大地属性攻击力+5%
     * 5级熟练度：防御力+20%，大地属性攻击力+20%
     * 伤害减免和攻击力伤害减少由圣盾觉醒EX1被动技能提供（175级解锁）
     * 所有属性抗性和最大生命值加成由圣盾觉醒EX2被动技能提供（180级解锁）
     * 受伤反弹伤害由圣盾觉醒EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'holy_knight_r',
      key: 'R',
      name: '圣盾觉醒',
      icon: '/pt/skill_icon/shengdunjuexing.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description:
        '圣殿骑士核心防御技能，将圣光之力极限压缩注入盾牌，进入圣盾觉醒状态，持续期间大幅提升自身防御力和大地属性攻击力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.EARTH,
      cd: 60,
      manaCost: 230,
      buffDuration: 30,
      isTeamBuff: false,
      unlockLevel: 170,
      growthLine: 'shield_awakening',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'holy_shield_buff',
          defense: {
            base: 5,
            increment: 3.75,
            rate: true
          },
          earthAttack: {
            base: 5,
            increment: 3.75,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 圣盾觉醒提供防御力和大地属性攻击力加成
       * 若已学会圣盾觉醒EX1（R_EX1技能），叠加PVE伤害减免和攻击力伤害减少
       * 若已学会圣盾觉醒EX2（R_EX2技能），叠加所有属性抗性和最大生命值加成
       * 若已学会圣盾觉醒EX3（R_EX3技能），叠加受伤反弹伤害效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 defense、earthAttack，可选 pveDamageReduction、attackDamageReduction、fireDefense、waterDefense、windDefense、earthDefense、thunderDefense、maxHp、damageReflect）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          defense: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          earthAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          }
        }

        // 圣盾觉醒EX1被动技能提供PVE伤害减免和攻击力伤害减少
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.holy_knight.R_EX1
            if (ex1Def && typeof ex1Def.getDamageReductionBonus === 'function') {
              result.pveDamageReduction = {
                add: ex1Def.getDamageReductionBonus(ex1Level),
                rate: true
              }
            }
            if (ex1Def && typeof ex1Def.getAttackDamageReduction === 'function') {
              result.attackDamageReduction = {
                add: ex1Def.getAttackDamageReduction(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 圣盾觉醒EX1未解锁或未加载时不提供伤害减免加成
        }

        // 圣盾觉醒EX2被动技能提供所有属性抗性和最大生命值加成
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.holy_knight.R_EX2
            if (ex2Def && typeof ex2Def.getAllResistanceBonus === 'function') {
              const resBonus = ex2Def.getAllResistanceBonus(ex2Level)
              // 所有属性抗性+15%：分别添加到5种元素抗性
              result.fireDefense = { add: resBonus, rate: true }
              result.waterDefense = { add: resBonus, rate: true }
              result.windDefense = { add: resBonus, rate: true }
              result.earthDefense = { add: resBonus, rate: true }
              result.thunderDefense = { add: resBonus, rate: true }
            }
            if (ex2Def && typeof ex2Def.getMaxHpBonus === 'function') {
              result.maxHp = {
                add: ex2Def.getMaxHpBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 圣盾觉醒EX2未解锁或未加载时不提供属性抗性和生命值加成
        }

        // 圣盾觉醒EX3被动技能提供受伤反弹伤害效果
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.holy_knight.R_EX3
            if (ex3Def && typeof ex3Def.getDamageReflectBonus === 'function') {
              result.damageReflect = {
                add: ex3Def.getDamageReflectBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 圣盾觉醒EX3未解锁或未加载时不提供受伤反弹
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础CD / 2（60/2=30秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseCd = SKILL_CONFIG.holy_knight.R.cd || 60
        return Math.max(1, Math.ceil(baseCd / 2))
      }
    },

    /**
     * R_EX1技能 - 圣盾觉醒EX1-减伤强化（被动技能）
     * 增强圣盾觉醒，释放期间自身获得伤害减免加成和攻击力伤害减少
     * 1级即为最大熟练度，默认满级效果：伤害减免+25%，自身攻击力伤害减少50%
     * 技能图片、音效与圣盾觉醒一致
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'holy_knight_r_ex1',
      key: 'R_EX1',
      name: '圣盾觉醒EX1-减伤强化',
      icon: '/pt/skill_icon/shengdunjuexing.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：圣盾觉醒持续期间，自身伤害减免+25%，自身攻击力伤害减少50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'shield_awakening',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_shield_damage_reduction',
          damageReduction: {
            base: 25,
            increment: 0,
            rate: true
          },
          attackDamageReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣盾觉醒EX1提供的伤害减免百分比加成
       * 1级即为最大熟练度，固定返回25%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害减免百分比加成（固定25）
       */
      getDamageReductionBonus(skillLevel = 1) {
        return 25
      },

      /**
       * 获取圣盾觉醒EX1提供的自身攻击力伤害减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 攻击力伤害减少百分比（固定50）
       */
      getAttackDamageReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * R_EX2技能 - 圣盾觉醒EX2-属性强化（被动技能）
     * 增强圣盾觉醒，释放期间自身获得所有属性抗性和最大生命值加成
     * 1级即为最大熟练度，默认满级效果：所有属性抗性+15%，最大生命值+15%
     * 技能图片、音效与圣盾觉醒一致
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'holy_knight_r_ex2',
      key: 'R_EX2',
      name: '圣盾觉醒EX2-属性强化',
      icon: '/pt/skill_icon/shengdunjuexing.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：圣盾觉醒持续期间，自身所有属性抗性+15%，最大生命值+15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'shield_awakening',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_shield_resistance_enhancement',
          allResistance: {
            base: 15,
            increment: 0,
            rate: true
          },
          maxHp: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣盾觉醒EX2提供的所有属性抗性百分比加成
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 所有属性抗性百分比加成（固定15）
       */
      getAllResistanceBonus(skillLevel = 1) {
        return 15
      },

      /**
       * 获取圣盾觉醒EX2提供的最大生命值百分比加成
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 最大生命值百分比加成（固定15）
       */
      getMaxHpBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * R_EX3技能 - 圣盾觉醒EX3-受伤反弹（被动技能）
     * 增强圣盾觉醒，释放期间受到攻击时反弹伤害
     * 1级即为最大熟练度，默认满级效果：BUFF持续期间受到伤害时反弹50%伤害给攻击者
     * 技能图片、音效与圣盾觉醒一致
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'holy_knight_r_ex3',
      key: 'R_EX3',
      name: '圣盾觉醒EX3-受伤反弹',
      icon: '/pt/skill_icon/shengdunjuexing.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：圣盾觉醒持续期间，受到伤害时反弹50%伤害给攻击者。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.EARTH,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'shield_awakening',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_shield_damage_reflect',
          damageReflect: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣盾觉醒EX3提供的受伤反弹百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 受伤反弹百分比（固定50）
       */
      getDamageReflectBonus(skillLevel = 1) {
        return 50
      }
    }
  },

  // ========== 炽天使技能 ==========
  // 三转职业：由守护使者(guardian)进阶，高治疗、高防御的辅助治疗职业
  // 技能体系参照暗夜主宰设计：5个主技能 + 多个EX被动技能，共7条成长线路
  nature_messenger: {
    /**
     * Q技能 - 圣光庇护
     * 群体持续治疗BUFF技能：展开圣光领域，在CD一半时间内持续恢复全队生命值
     * 一阶强化（圣光庇护EX1）额外恢复全队魔法值；二阶强化（圣光庇护EX2）受伤后恢复生命值
     * 基础持续时间 = CD / 2 = 30秒
     * 1级熟练度：每2秒恢复施法者攻击力2%的生命值
     * 5级熟练度：每2秒恢复施法者攻击力10%的生命值
     * 魔法值恢复由圣光庇护EX1被动技能提供（180级解锁）
     * 受伤恢复由圣光庇护EX2被动技能提供（190级解锁）
     */
    Q: {
      id: 'nature_messenger_q',
      key: 'Q',
      name: '圣光庇护',
      icon: '/pt/skill_icon/shengguangbihu.png',
      audio: '/sound/PcSkillD-Healrain.wav',
      description:
        '展开圣光领域庇护全队，在CD一半时间内每2秒持续恢复全体队友生命值（恢复施法者攻击力百分比）；一阶强化额外恢复魔法值，二阶强化受伤后恢复生命值。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 60,
      manaCost: 260,
      buffDuration: 30,
      hotTickInterval: 2,
      isPartyBuff: true,
      unlockLevel: 175,
      growthLine: 'holy_sanctuary',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'holy_sanctuary_hot',
          hotAttackPercent: {
            base: 2,
            increment: 2,
            rate: false
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 圣光庇护提供持续治疗效果（HOT），恢复量 = 施法者攻击力 × 百分比
       * 若已学会圣光庇护EX1（O技能），叠加魔法值恢复效果
       * 若已学会圣光庇护EX2（O_EX2技能），叠加受伤恢复效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 hotAttackPercent，可选 mpRecoveryPercent、damageRecoveryPercent）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          hotAttackPercent: {
            add: 2 + 2 * (safeLevel - 1),
            rate: false
          }
        }

        // 圣光庇护EX1被动技能提供魔法值恢复效果
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.nature_messenger.O
            if (ex1Def && typeof ex1Def.getMpRecoveryPercent === 'function') {
              result.mpRecoveryPercent = {
                add: ex1Def.getMpRecoveryPercent(ex1Level),
                rate: false
              }
            }
          }
        } catch (e) {
          console.log('[圣光庇护] EX1检测异常:', e?.message || e)
        }

        // 圣光庇护EX2被动技能提供受伤恢复效果
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.nature_messenger.O_EX2
            if (ex2Def && typeof ex2Def.getDamageRecoveryPercent === 'function') {
              result.damageRecoveryPercent = {
                add: ex2Def.getDamageRecoveryPercent(ex2Level),
                rate: false
              }
            }
          }
        } catch (e) {
          // 圣光庇护EX2未解锁或未加载时不提供受伤恢复
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：CD / 2 = 30秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseCd = SKILL_CONFIG.nature_messenger.Q.cd || 60
        return Math.max(1, Math.ceil(baseCd / 2))
      }
    },

    /**
     * O技能 - 圣光庇护EX1-恢复魔法值（被动技能）
     * 增强圣光庇护效果，持续期间额外恢复全队魔法值
     * 1级即为最大熟练度，默认满级效果：恢复效果=施法者攻击力10%
     * 每次释放圣光庇护（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'nature_messenger_o',
      key: 'O',
      name: '圣光庇护EX1-恢复魔法值',
      icon: '/pt/skill_icon/shengguangbihu.png',
      audio: '/sound/PcSkillD-Healrain.wav',
      description: '被动技能：圣光庇护持续期间，持续恢复范围内队员魔法值，恢复效果=施法者攻击力10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'holy_sanctuary',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_sanctuary_mp_recovery',
          mpRecoveryPercent: {
            base: 10,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取圣光庇护EX1提供的魔法值恢复百分比
       * 1级即为最大熟练度，固定返回10%（施法者攻击力的10%）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 魔法值恢复百分比（固定10）
       */
      getMpRecoveryPercent(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX2技能 - 圣光庇护EX2-受伤恢复（被动技能）
     * 增强圣光庇护效果，拥有BUFF的玩家受伤后恢复生命值
     * 1级即为最大熟练度，默认满级效果：受伤后恢复本次攻击2%最大生命值
     * 每次释放圣光庇护（Q技能）时，该被动技能熟练度随之增加
     */
    O_EX2: {
      id: 'nature_messenger_o_ex2',
      key: 'O_EX2',
      name: '圣光庇护EX2-受伤恢复',
      icon: '/pt/skill_icon/shengguangbihu.png',
      audio: '/sound/PcSkillD-Healrain.wav',
      description: '被动技能：圣光庇护持续期间，拥有BUFF的玩家受伤后恢复本次攻击2%最大生命值。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'holy_sanctuary',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_sanctuary_damage_recovery',
          damageRecoveryPercent: {
            base: 2,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取圣光庇护EX2提供的受伤恢复百分比
       * 1级即为最大熟练度，固定返回2%（本次攻击2%最大生命值）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 受伤恢复百分比（固定2）
       */
      getDamageRecoveryPercent(skillLevel = 1) {
        return 2
      }
    },

    /**
     * E技能 - 圣光审判
     * 单体DEBUFF技能：以圣光之力审判敌人，造成神圣伤害并施加「虚弱」印记
     * 印记期间目标承受所有伤害提升
     * 炽天使攻击虚弱目标时，额外提升治疗效果
     * 1级熟练度：伤害+150，目标承受伤害+5%，炽天使专属（治疗效果+5%）
     * 5级熟练度：伤害+1000，目标承受伤害+20%，炽天使专属（治疗效果+25%）
     * DEBUFF持续时间为CD的一半（15秒）
     * CD减少由圣光审判EX1被动技能提供（175级解锁）
     * 伤害增加由圣光审判EX2被动技能提供（185级解锁）
     */
    E: {
      id: 'nature_messenger_e',
      key: 'E',
      name: '圣光审判',
      icon: '/pt/skill_icon/shengguangshenpan.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description:
        '以圣光之力审判单体敌人，造成神圣伤害。受击目标附上「虚弱」印记，持续CD一半的时间，承受所有伤害提升。炽天使攻击印记目标时，额外提升自身治疗效果。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 500,
      cd: 30,
      manaCost: 200,
      duration: 15,
      unlockLevel: 170,
      growthLine: 'holy_judgment',

      // DEBUFF配置：虚弱印记（复用 damageVulnerability 机制 + 治疗加成）
      debuff: {
        type: 'damageVulnerability',
        chance: 100,
        effect: {
          type: 'damageVulnerability',
          icon: '/pt/skill_icon/shengguangshenpan.png',
          baseDuration: 15,
          /**
           * 根据熟练度等级计算伤害增加百分比
           * 1级: 5%，5级: 20%，每级增加3.75%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 伤害增加百分比
           */
          getValue(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 3.75 * (safeLevel - 1)
          },
          /**
           * 根据熟练度等级计算炽天使专属治疗效果加成百分比
           * 1级: 5%，5级: 25%，每级增加5%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 治疗效果加成百分比
           */
          getHealingBonus(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 5 * (safeLevel - 1)
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 智力×3 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const intDamage = Number(player?.stats?.intelligence || 0) * 3
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + intDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（伤害增加百分比 + 治疗效果加成百分比）
       * 1级: 承受伤害+5%, 治疗效果+5%
       * 5级: 承受伤害+20%, 治疗效果+25%
       * @param {number} skillLevel - 技能熟练度等级
       * @param {Object} [player] - 玩家对象（保留参数以兼容调用签名）
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const damageIncrease = 5 + 3.75 * (safeLevel - 1)
        const healingBonus = 5 + 5 * (safeLevel - 1)

        return {
          damageIncrease,
          healingBonus,
          duration: 15
        }
      }
    },

    /**
     * E_EX1技能 - 圣光审判EX1-CD减少（被动技能）
     * 增强圣光审判，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少圣光审判技能CD 50%
     * 技能图片、音效与圣光审判一致
     */
    E_EX1: {
      id: 'nature_messenger_e_ex1',
      key: 'E_EX1',
      name: '圣光审判EX1-CD减少',
      icon: '/pt/skill_icon/shengguangshenpan.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：减少圣光审判冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'holy_judgment',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_judgment_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣光审判CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 圣光审判EX2-伤害增加（被动技能）
     * 增强圣光审判，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加圣光审判技能伤害 50%
     * 技能图片、音效与圣光审判一致
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'nature_messenger_e_ex2',
      key: 'E_EX2',
      name: '圣光审判EX2-伤害增加',
      icon: '/pt/skill_icon/shengguangshenpan.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：增加圣光审判技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'holy_judgment',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_judgment_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣光审判伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U技能 - 天使之怒
     * AOE范围技能：召唤天使之力，对范围内敌人造成神圣伤害同时治疗全队
     * 群体技能基础伤害和智力加成均为单体技能(雷神之锤)的70%
     * 基础伤害/治疗量595，MP消耗250
     * 1级熟练度：伤害/治疗+140
     * 5级熟练度：伤害/治疗+1050
     * 智力加成：每点智力提供6.16点伤害/治疗量
     * CD减少由天使之怒EX1被动技能提供（175级解锁）
     * 伤害增加由天使之怒EX2被动技能提供（185级解锁）
     * 多段攻击由天使之怒EX3被动技能提供（190级解锁）
     */
    U: {
      id: 'nature_messenger_u',
      key: 'U',
      name: '天使之怒',
      icon: '/pt/skill_icon/tianshizhinu.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description:
        '凝聚天使之力化为神圣光柱，对范围内敌人造成神圣伤害，同时恢复全队生命值。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 595,
      heal: 595,
      isTeamHeal: true,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      growthLine: 'angel_wrath',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 140,
          increment: (1050 - 140) / 4
        }
      },

      /**
       * 伤害计算（智力型AOE伤害，群体伤害低于单体30%）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+140,5级+1050) + 智力×6.16 + 玩家攻击力×0.3
       * 群体技能基础伤害和智力加成系数均为单体技能(雷神之锤)的70%
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 140 + ((1050 - 140) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 6.16
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + intDamage + attack * 0.3)
      },

      /**
       * 治疗量计算（与伤害共享基础值和熟练度成长）
       * 公式: 基础治疗量(this.heal) + 熟练度治疗量(1级+140,5级+1050) + 智力×6.16
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总治疗量
       */
      calculateHealing(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyHealing = 140 + ((1050 - 140) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intHealing = intelligence * 6.16
        return Math.floor(Number(this?.heal || 0) + proficiencyHealing + intHealing)
      }
    },

    /**
     * U_EX1技能 - 天使之怒EX1-CD减少（被动技能）
     * 增强天使之怒，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少天使之怒技能CD 50%
     * 技能图片、音效与天使之怒一致
     */
    U_EX1: {
      id: 'nature_messenger_u_ex1',
      key: 'U_EX1',
      name: '天使之怒EX1-CD减少',
      icon: '/pt/skill_icon/tianshizhinu.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：减少天使之怒冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'angel_wrath',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wrath_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取天使之怒CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 天使之怒EX2-伤害增加（被动技能）
     * 增强天使之怒，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加天使之怒技能伤害 50%
     * 技能图片、音效与天使之怒一致
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'nature_messenger_u_ex2',
      key: 'U_EX2',
      name: '天使之怒EX2-伤害增加',
      icon: '/pt/skill_icon/tianshizhinu.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：增加天使之怒技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'angel_wrath',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wrath_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取天使之怒伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX3技能 - 天使之怒EX3-多段攻击（被动技能）
     * 增强天使之怒，概率触发多段攻击（额外触发一次技能攻击伤害效果）
     * 1级即为最大熟练度，默认满级效果：
     *   50%概率触发1段多段攻击（额外造成1次技能伤害）
     *   25%概率触发2段多段攻击（额外造成2次技能伤害）
     *   10%概率触发3段多段攻击（额外造成3次技能伤害）
     * 概率为逐级包含关系：50%包含25%和10%
     * 技能图片、音效与天使之怒一致
     * 解锁等级：190级
     */
    U_EX3: {
      id: 'nature_messenger_u_ex3',
      key: 'U_EX3',
      name: '天使之怒EX3-多段攻击',
      icon: '/pt/skill_icon/tianshizhinu.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：增强天使之怒，概率触发多段攻击。50%概率触发1段额外攻击，25%概率触发2段额外攻击，10%概率触发3段额外攻击。多段攻击为额外触发一次技能攻击伤害效果。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'angel_wrath',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wrath_multi_hit',
          multiHit: {
            chance1: 50,
            chance2: 25,
            chance3: 10
          }
        }
      },

      /**
       * 获取多段攻击触发信息
       * 1级即为最大熟练度，固定返回多段攻击概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 多段攻击概率配置 { chance1, chance2, chance3 }
       */
      getMultiHitChance(skillLevel = 1) {
        return {
          chance1: 50,
          chance2: 25,
          chance3: 10
        }
      }
    },

    /**
     * I技能 - 武器精通-魔棒（被动技能）
     * 装备武器为魔棒时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
     * 1级熟练度：武器攻击力+10%
     * 5级熟练度：武器攻击力+50%
     * 熟练度增长方式：装备魔棒后普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'nature_messenger_i',
      key: 'I',
      name: '武器精通-魔棒',
      icon: '/pt/skill_icon/mobangjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：武器魔棒精通，装备武器是魔棒时增加武器基础攻击力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      growthLine: 'weapon_mastery_staff',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'staff_attack_mastery',
          weaponAttackBonus: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取武器攻击力加成百分比
       * 1级10%，每级+10%，5级50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 武器攻击力加成百分比（0-50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 10 * safeLevel
      }
    },

    /**
     * I_EX1技能 - 武器精通-魔棒EX1-伤害增加（被动技能）
     * 增强武器精通-魔棒，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害50%
     * 技能图片、音效与武器精通-魔棒一致
     */
    I_EX1: {
      id: 'nature_messenger_i_ex1',
      key: 'I_EX1',
      name: '武器精通-魔棒EX1-伤害增加',
      icon: '/pt/skill_icon/mobangjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加武器基础攻击力50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'weapon_mastery_staff',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'staff_attack_mastery_ex1',
          weaponAttackBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX2技能 - 武器精通-魔棒EX2-伤害增加（被动技能）
     * 增强武器精通-魔棒，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害100%
     * 技能图片、音效与武器精通-魔棒一致
     */
    I_EX2: {
      id: 'nature_messenger_i_ex2',
      key: 'I_EX2',
      name: '武器精通-魔棒EX2-伤害增加',
      icon: '/pt/skill_icon/mobangjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加武器基础攻击力100%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'weapon_mastery_staff',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'staff_attack_mastery_ex2',
          weaponAttackBonus: {
            base: 100,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回100%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定100）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 100
      }
    },

    /**
     * J技能 - 圣光积累（被动技能）
     * 获得圣光之力-圣光积累，每次普通攻击增加一点圣光值，最高10点
     * 第10次普通攻击为全队恢复基于攻击力百分比的生命值，然后重置圣光值
     * MP:30（每次普通攻击减少30点MP，增加一个圣光值）
     * 1级熟练度：第10次普通攻击附加攻击力10%的治疗量
     * 10级熟练度：第10次普通攻击附加攻击力100%的治疗量
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'nature_messenger_j',
      key: 'J',
      name: '圣光积累',
      icon: '/pt/skill_icon/shengguangjilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description:
        '获得圣光之力-圣光积累，每次普通攻击或释放技能增加一点圣光值，最高10点，达到触发阈值时恢复自身基于攻击力百分比的生命值，然后重置圣光值。每次普通攻击消耗30点MP。解锁EX后，触发效果变为恢复所有队员最大生命值。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      growthLine: 'holy_accumulation',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'holy_accumulation_bonus',
          healPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取圣光积累附加治疗量百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 治疗量附加百分比（10-100）
       */
      getHealBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取圣光积累触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取圣光积累每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 圣光积累EX1-减少触发次数（被动技能）
     * 增强圣光积累，减少触发次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     * 解锁后触发效果从「自身治疗」变为「全队治疗」：按照施法者5%攻击力恢复所有队员最大生命值
     * 技能图片与圣光积累一致
     */
    J_EX1: {
      id: 'nature_messenger_j_ex1',
      key: 'J_EX1',
      name: '圣光积累EX1-减少触发次数',
      icon: '/pt/skill_icon/shengguangjilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强圣光积累，减少触发次数-50%。解锁后触发效果变为按照施法者5%攻击力恢复所有队员最大生命值。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'holy_accumulation',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_accumulation_trigger_reduction',
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取圣光积累触发次数减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 圣光积累EX2-倍攻治疗（被动技能）
     * 增强圣光积累，在EX1触发次数阈值时概率触发倍攻治疗
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击/技能释放 50%概率按照施法者10%攻击力恢复所有队员最大生命值
     *   第5次普通攻击/技能释放 25%概率按照施法者20%攻击力恢复所有队员最大生命值
     *   第5次普通攻击/技能释放 10%概率按照施法者30%攻击力恢复所有队员最大生命值
     * 概率为逐级包含关系：50%包含25%和10%，未触发倍攻时回退至基础5%
     * 技能图片与圣光积累一致
     */
    J_EX2: {
      id: 'nature_messenger_j_ex2',
      key: 'J_EX2',
      name: '圣光积累EX2-倍攻治疗',
      icon: '/pt/skill_icon/shengguangjilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强圣光积累，在EX1触发次数时概率触发倍攻治疗（50%概率10%攻击力、25%概率20%攻击力、10%概率30%攻击力恢复全队最大生命值）。需先解锁圣光积累EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'holy_accumulation',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'holy_accumulation_multi_heal',
          multiHeal: {
            chance1: 50,
            bonus1: 10,
            chance2: 25,
            bonus2: 20,
            chance3: 10,
            bonus3: 30
          }
        }
      },

      /**
       * 获取圣光积累EX2倍攻治疗触发信息
       * 1级即为最大熟练度，固定返回倍攻治疗概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻治疗概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiHealChance(skillLevel = 1) {
        return {
          chance1: 50,
          bonus1: 10,
          chance2: 25,
          bonus2: 20,
          chance3: 10,
          bonus3: 30
        }
      }
    },

    /**
     * R技能 - 天使之翼
     * 群体防御BUFF技能：展开天使之翼，提升全队物理防御
     * 基础持续时间1分钟，每3点智力+1秒
     * 固定提供物理防御+1000
     * 魔法防御加成由天使之翼EX1被动技能提供（175级解锁）
     * 最大生命值增加由天使之翼EX2被动技能提供（180级解锁）
     * 生命护盾由天使之翼EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'nature_messenger_r',
      key: 'R',
      name: '天使之翼',
      icon: '/pt/skill_icon/tianshizhiyi.png',
      audio: '/sound/PcSkillM-Protect.wav',
      description:
        '炽天使核心防御技能，展开天使之翼庇护全队，物理防御+1000。BUFF持续期间全队获得防御加成。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 15,
      manaCost: 230,
      buffDuration: 60,
      isPartyBuff: true,
      unlockLevel: 170,
      growthLine: 'angel_wings',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'angel_wings_buff',
          defense: {
            base: 1000,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 天使之翼提供物理防御固定值加成（固定+1000）
       * 若已学会天使之翼EX1（R_EX1技能），叠加魔法防御固定值加成
       * 若已学会天使之翼EX2（R_EX2技能），叠加最大生命值加成
       * 若已学会天使之翼EX3（R_EX3技能），增加生命护盾（吸收伤害）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 defense，可选 magicDefense、maxHealth、maxAbsorbDamage、currentAbsorbDamage）
       */
      calculateBuff(player, skillLevel = 1) {
        const result = {
          defense: {
            add: 1000,
            rate: false
          }
        }

        // 天使之翼EX1被动技能提供魔法防御固定值加成
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.nature_messenger.R_EX1
            if (ex1Def && typeof ex1Def.getMagicDefenseBonus === 'function') {
              result.magicDefense = {
                add: ex1Def.getMagicDefenseBonus(ex1Level),
                rate: false
              }
            }
          }
        } catch (e) {
          // 天使之翼EX1未解锁或未加载时不提供魔法防御加成
        }

        // 天使之翼EX2被动技能提供最大生命值加成
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.nature_messenger.R_EX2
            if (ex2Def && typeof ex2Def.getMaxHpBonus === 'function') {
              result.maxHealth = {
                add: ex2Def.getMaxHpBonus(ex2Level),
                rate: false
              }
            }
          }
        } catch (e) {
          // 天使之翼EX2未解锁或未加载时不提供生命值加成
        }

        // 天使之翼EX3被动技能提供生命护盾（可抵挡所有伤害）
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.nature_messenger.R_EX3
            if (ex3Def && typeof ex3Def.getLifeShieldAmount === 'function') {
              const shieldAmount = ex3Def.getLifeShieldAmount(player, ex3Level)
              result.maxAbsorbDamage = shieldAmount
              result.currentAbsorbDamage = shieldAmount
            }
          }
        } catch (e) {
          // 天使之翼EX3未解锁或未加载时不提供生命护盾
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 每3点智力+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级（未使用，保留以兼容调用签名）
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        return 60 + Math.floor(intelligence / 3)
      }
    },

    /**
     * R_EX1技能 - 天使之翼EX1-魔法防御力加成（被动技能）
     * 增强天使之翼，释放期间全队获得魔法防御加成
     * 1级即为最大熟练度，默认满级效果：魔法防御+1000
     * 技能图片、音效与天使之翼一致
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'nature_messenger_r_ex1',
      key: 'R_EX1',
      name: '天使之翼EX1-魔法防御力加成',
      icon: '/pt/skill_icon/tianshizhiyi.png',
      audio: '/sound/PcSkillM-Protect.wav',
      description: '被动技能：天使之翼持续期间，全队魔法防御+1000。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'angel_wings',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wings_magic_defense',
          magicDefense: {
            base: 1000,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取天使之翼EX1提供的魔法防御固定值加成
       * 1级即为最大熟练度，固定返回1000
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 魔法防御固定值加成（固定1000）
       */
      getMagicDefenseBonus(skillLevel = 1) {
        return 1000
      }
    },

    /**
     * R_EX2技能 - 天使之翼EX2-增加生命值（被动技能）
     * 增强天使之翼，释放期间全队最大生命值增加
     * 1级即为最大熟练度，默认满级效果：最大生命值+1000
     * 技能图片、音效与天使之翼一致
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'nature_messenger_r_ex2',
      key: 'R_EX2',
      name: '天使之翼EX2-增加生命值',
      icon: '/pt/skill_icon/tianshizhiyi.png',
      audio: '/sound/PcSkillM-Protect.wav',
      description: '被动技能：天使之翼持续期间，全队最大生命值+1000。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'angel_wings',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wings_max_hp',
          maxHealth: {
            base: 1000,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取天使之翼EX2提供的最大生命值加成
       * 1级即为最大熟练度，固定返回1000
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 最大生命值加成（固定1000）
       */
      getMaxHpBonus(skillLevel = 1) {
        return 1000
      }
    },

    /**
     * R_EX3技能 - 天使之翼EX3-生命护盾（被动技能）
     * 增强天使之翼，释放期间为全队增加施法者最大生命值50%的生命值护盾
     * 1级即为最大熟练度，默认满级效果：生命护盾=施法者最大生命值×50%
     * 护盾可以抵挡敌人所有伤害，护盾耗尽后BUFF其他效果仍然保留
     * 技能图片、音效与天使之翼一致
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'nature_messenger_r_ex3',
      key: 'R_EX3',
      name: '天使之翼EX3-生命护盾',
      icon: '/pt/skill_icon/tianshizhiyi.png',
      audio: '/sound/PcSkillM-Protect.wav',
      description: '被动技能：释放天使之翼期间，为全队增加施法者最大生命值50%的生命值护盾，可抵挡所有伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'angel_wings',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'angel_wings_life_shield',
          lifeShield: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取天使之翼EX3生命护盾占施法者最大生命值的百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 生命护盾百分比（固定50）
       */
      getLifeShieldPercent(skillLevel = 1) {
        return 50
      },

      /**
       * 计算天使之翼EX3生命护盾的实际吸收伤害值
       * 护盾值 = 施法者最大生命值 × 50%
       * @param {Object} player - 施法者玩家对象（用于获取最大生命值）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 生命护盾可吸收的伤害总量
       */
      getLifeShieldAmount(player, skillLevel = 1) {
        const maxHealth = player?.maxHealth || player?.stats?.maxHealth || 1000
        return Math.floor(maxHealth * 50 / 100)
      }
    },

    /**
     * T技能 - 雷神之锤
     * 单体雷属性伤害技能：挥舞蕴含雷霆神力的巨锤锁定单一敌人发起重击
     * 基础伤害850，MP消耗220
     * 1级熟练度：伤害+200，3%概率眩晕2秒
     * 5级熟练度：伤害+1500，15%概率眩晕2秒
     * 智力加成：每点智力提供8.8点伤害
     * CD减少由雷神之锤EX1被动技能提供（175级解锁）
     * 伤害增加由雷神之锤EX2被动技能提供（185级解锁）
     * 倍攻由雷神之锤EX3被动技能提供（190级解锁）
     */
    T: {
      id: 'nature_messenger_t',
      key: 'T',
      name: '雷神之锤',
      icon: '/pt/skill_icon/leishenzhichui.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description:
        '挥舞蕴含雷霆神力的巨锤锁定单一敌人发起重击，对目标造成巨额雷电伤害；攻击命中后有一定概率触发雷电麻痹效果，令目标眩晕数秒。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.ELECTRICITY,
      damage: 850,
      cd: 15,
      manaCost: 220,
      unlockLevel: 166,
      growthLine: 'thunder_hammer',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 200,
          increment: (1500 - 200) / 4
        }
      },

      // DEBUFF配置：雷电麻痹（眩晕效果）
      debuff: {
        type: 'stun',
        chance: 3, // 基础概率3%，实际由 calculateDebuffChance 计算
        effect: {
          type: 'stun',
          duration: 2,
          icon: '/pt/UI/stun_stars.svg'
        }
      },

      /**
       * 伤害计算（智力型单体伤害）
       * 公式: 基础伤害(850) + 熟练度伤害(1级+200,5级+1500) + 智力×8.8 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 200 + ((1500 - 200) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 8.8
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（眩晕概率）
       * 1级: 3%，5级: 15%，每级增加3%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 3 + 3 * (safeLevel - 1)
      }
    },

    /**
     * T_EX1技能 - 雷神之锤EX1-CD减少（被动技能）
     * 增强雷神之锤，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少雷神之锤技能CD 50%
     * 技能图片、音效与雷神之锤一致
     * 解锁等级：175级
     */
    T_EX1: {
      id: 'nature_messenger_t_ex1',
      key: 'T_EX1',
      name: '雷神之锤EX1-CD减少',
      icon: '/pt/skill_icon/leishenzhichui.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：减少雷神之锤冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.ELECTRICITY,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'thunder_hammer',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'thunder_hammer_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取雷神之锤CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * T_EX2技能 - 雷神之锤EX2-伤害增加（被动技能）
     * 增强雷神之锤，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加雷神之锤技能伤害 50%
     * 技能图片、音效与雷神之锤一致
     * 解锁等级：185级
     */
    T_EX2: {
      id: 'nature_messenger_t_ex2',
      key: 'T_EX2',
      name: '雷神之锤EX2-伤害增加',
      icon: '/pt/skill_icon/leishenzhichui.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增加雷神之锤技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.ELECTRICITY,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'thunder_hammer',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'thunder_hammer_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取雷神之锤伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * T_EX3技能 - 雷神之锤EX3-倍攻（被动技能）
     * 增强雷神之锤，概率触发倍攻伤害
     * 1级即为最大熟练度，默认满级效果：
     *   50%概率造成1.5倍伤害
     *   25%概率造成2倍伤害
     *   10%概率造成3倍伤害
     * 概率为逐级包含关系：50%包含25%和10%
     * 技能图片、音效与雷神之锤一致
     * 解锁等级：190级
     */
    T_EX3: {
      id: 'nature_messenger_t_ex3',
      key: 'T_EX3',
      name: '雷神之锤EX3-倍攻',
      icon: '/pt/skill_icon/leishenzhichui.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增强雷神之锤，概率触发倍攻伤害。50%概率造成1.5倍伤害，25%概率造成2倍伤害，10%概率造成3倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.ELECTRICITY,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'thunder_hammer',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'thunder_hammer_critical_multiplier',
          criticalMultiplier: {
            chance1_5x: 50,
            chance2x: 25,
            chance3x: 10
          }
        }
      },

      /**
       * 获取倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1_5x, chance2x, chance3x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance1_5x: 50,
          chance2x: 25,
          chance3x: 10
        }
      }
    }
  },

  // ========== 格斗宗师技能 ==========
  // 三转职业：由守护者(guardian)/技师(technician)进阶，高攻击高生存的近战力量型职业
  // 技能体系参照爆裂射手设计：5个主技能 + 7个EX被动技能，共6条成长线路
  combat_master: {
    /**
     * Q技能 - 宗师之威
     * 群体BUFF技能：释放宗师气场加持全队，大幅提升全体队友攻击力
     * 一阶强化（宗师之威EX1）提升全队物理防御力；二阶强化（宗师之威EX2）进一步增加全体魔力上限
     * 基础持续时间1分钟，每1点智力+1秒
     * 1级熟练度：+2%攻击力
     * 5级熟练度：+10%攻击力
     * 防御力加成由宗师之威EX1被动技能提供（180级解锁）
     * 魔力上限加成由宗师之威EX2被动技能提供（190级解锁）
     */
    Q: {
      id: 'combat_master_q',
      key: 'Q',
      name: '宗师之威',
      icon: '/pt/skill_icon/zongshizhiwei.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description:
        '释放宗师气场加持全队，大幅提升全体队友攻击力；一阶强化提升全队物理防御力，二阶强化进一步增加全体魔力上限。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 15,
      manaCost: 260,
      // 基础持续时间 1分钟 = 60秒，每1点智力+1秒
      buffDuration: 60,
      // 标记为群体BUFF，适用于全体队员
      isPartyBuff: true,
      unlockLevel: 175,
      // 成长线路：宗师之威系列技能（宗师之威→宗师之威EX1→宗师之威EX2）
      growthLine: 'grandmaster_authority',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'grandmaster_authority_buff',
          // 攻击力百分比加成 - 1级2%，每级+2%，5级10%
          attack: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 宗师之威提供攻击力百分比加成
       * 若已学会宗师之威EX1（O技能），叠加全体物理防御力百分比加成
       * 若已学会宗师之威EX2（O_EX2技能），叠加全体魔力上限百分比加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 attack，可选 defensePercentage、maxMana）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          // 攻击力百分比加成：2% * 技能等级（使用 attack 键名，配合 rate: true 被 PlayerStatsService 识别为攻击力百分比乘法加成）
          attack: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 宗师之威EX1被动技能提供额外物理防御力百分比加成
        // 从 player.skills.O 读取宗师之威EX1的熟练度等级
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.combat_master.O
            if (ex1Def && typeof ex1Def.getDefenseBonus === 'function') {
              // 使用对象格式 { add, rate: true } 确保被识别为百分比加成
              result.defensePercentage = {
                add: ex1Def.getDefenseBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 宗师之威EX1未解锁或未加载时不提供防御力加成
          console.log('[宗师之威] EX1检测异常:', e?.message || e)
        }

        // 宗师之威EX2被动技能提供额外魔力上限百分比加成
        // 从 player.skills.O_EX2 读取宗师之威EX2的熟练度等级
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.combat_master.O_EX2
            if (ex2Def && typeof ex2Def.getManaMaxBonus === 'function') {
              // 使用对象格式 { add, rate: true } 确保被识别为百分比加成
              result.maxMana = {
                add: ex2Def.getManaMaxBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 宗师之威EX2未解锁或未加载时不提供魔力上限加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 每1点智力+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        return 60 + intelligence
      }
    },

    /**
     * W技能 - 龟派气功
     * 单体智力伤害技能：集中精神，向敌人发射巨大能量波
     * 基础伤害700，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+2500
     * 智力加成：每点智力提供8.8点伤害
     * CD减少由龟派气功EX1被动技能提供（175级解锁）
     * 伤害增加由龟派气功EX2被动技能提供（185级解锁）
     * 多段伤害由龟派气功EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'combat_master_w',
      key: 'W',
      name: '龟派气功',
      icon: '/pt/skill_icon/nensphere.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description:
        '集中精神，向敌人发射巨大能量波。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 700,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      // 成长线路：龟派气功系列（龟派气功→龟派气功EX1→龟派气功EX2）
      growthLine: 'nensphere',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+200，5级+2500，线性增长（4级跨度）
          base: 200,
          increment: (2500 - 200) / 4
        }
      },

      /**
       * 伤害计算（智力型单体伤害）
       * 公式: 基础伤害(700) + 熟练度伤害(1级+200,5级+2500) + 智力×8.8 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+200，5级+2500，线性增长（4级跨度）
        const proficiencyDamage = 200 + ((2500 - 200) / 4) * (safeLevel - 1)
        // 智力加成：每点智力提供8.8点伤害
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 8.8
        // 攻击力加成：玩家攻击力 × 0.3
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * E技能 - 龙拳-破劲
     * 单体DEBUFF技能：凝聚盘龙内劲于拳锋，向前打出重拳，命中单体敌人造成物理伤害
     * 受击目标附上「破劲」印记，持续CD一半的时间，承受所有伤害提升
     * 格斗宗师攻击印记目标时，额外提升暴击伤害
     * 1级熟练度：伤害+150，目标承受伤害+5%，格斗宗师专属（暴击伤害+5%）
     * 5级熟练度：伤害+1000，目标承受伤害+20%，格斗宗师专属（暴击伤害+25%）
     * DEBUFF持续时间为CD的一半（15秒）
     * CD减少由龙拳-破劲EX1被动技能提供（175级解锁）
     * 伤害增加由龙拳-破劲EX2被动技能提供（185级解锁）
     */
    E: {
      id: 'combat_master_e',
      key: 'E',
      name: '龙拳-破劲',
      icon: '/pt/skill_icon/longquanpojin.png',
      audio: '/sound/PcSkillD-blindside.wav',
      description:
        '凝聚盘龙内劲于拳锋，向前打出一记重拳，命中单体敌人造成物理伤害。受击目标附上「破劲」印记，持续CD一半的时间，承受所有伤害提升。格斗宗师攻击印记目标时，额外提升暴击伤害。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 500,
      cd: 30,
      manaCost: 200,
      duration: 15,
      unlockLevel: 170,
      // 成长线路：龙拳-破劲系列技能单独成线，后续可扩展
      growthLine: 'dragon_fist_break',

      // DEBUFF配置：破劲印记（复用 damageVulnerability 机制 + 暴击伤害加成）
      debuff: {
        type: 'damageVulnerability',
        chance: 100, // 命中即施加，必定触发
        effect: {
          type: 'damageVulnerability',
          icon: '/pt/skill_icon/longquanpojin.png',
          baseDuration: 15,
          /**
           * 根据熟练度等级计算伤害增加百分比
           * 1级: 5%，5级: 20%，每级增加3.75%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 伤害增加百分比
           */
          getValue(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 3.75 * (safeLevel - 1)
          },
          /**
           * 根据熟练度等级计算格斗宗师专属暴击伤害加成百分比
           * 1级: 5%，5级: 25%，每级增加5%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 暴击伤害加成百分比
           */
          getCritDamageBonus(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 5 * (safeLevel - 1)
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+150，5级+1000，线性增长（4级跨度）
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 力量 × 3 + 玩家攻击力 × 0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+150，5级+1000，线性增长（4级跨度）
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const strDamage = player.stats.strength * 3
        return Math.floor(this.damage + proficiencyDamage + player.attack * 0.3 + strDamage)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（伤害增加百分比 + 暴击伤害加成百分比）
       * 1级: 承受伤害+5%, 暴击伤害+5%
       * 5级: 承受伤害+20%, 暴击伤害+25%
       * @param {number} skillLevel - 技能熟练度等级
       * @param {Object} [player] - 玩家对象（保留参数以兼容调用签名）
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const damageIncrease = 5 + 3.75 * (safeLevel - 1)
        const critDamageBonus = 5 + 5 * (safeLevel - 1)

        return {
          damageIncrease,
          critDamageBonus,
          duration: 15
        }
      }
    },

    /**
     * U技能 - 念气能量弹
     * AOE智力伤害技能：引导能量后，向目标区域扔去能量炸弹，造成巨大范围伤害
     * 基础伤害由 damage 字段定义，calculateDamage 内通过 this.damage 引用，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
     * 智力加成：每点智力提供8点伤害
     * CD减少由念气能量弹EX1被动技能提供（175级解锁）
     * 伤害增加由念气能量弹EX2被动技能提供（185级解锁）
     */
    U: {
      id: 'combat_master_u',
      key: 'U',
      name: '念气能量弹',
      icon: '/pt/skill_icon/aurabomb.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description:
        '引导能量后，向目标区域扔去能量炸弹，造成巨大范围伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 1200,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      // 成长线路：念气能量弹系列（念气能量弹→念气能量弹EX1→念气能量弹EX2）
      growthLine: 'aura_bomb',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+180，5级+2200，线性增长（4级跨度）
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 伤害计算（智力型AOE伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 智力×8 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+180，5级+2200，线性增长（4级跨度）
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        // 智力加成：每点智力提供8点伤害
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 8
        // 攻击力加成：玩家攻击力 × 0.3
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * I技能 - 武器精通-拳套（被动技能）
     * 装备武器为拳套时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
     * 1级熟练度：武器攻击力+10%
     * 5级熟练度：武器攻击力+50%
     * 熟练度增长方式：装备拳套后普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'combat_master_i',
      key: 'I',
      name: '武器精通-拳套',
      icon: '/pt/skill_icon/quantaojingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：武器拳套精通，装备武器是拳套时增加武器基础攻击力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      // 成长线路：武器精通-拳套系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_knuckle',
      // 熟练度增长配置：普通攻击命中累计计数，达到阈值后增加1点熟练度
      // 达到最大熟练度后不再计数
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'knuckle_attack_mastery',
          // 武器攻击力百分比加成 - 1级10%，每级+10%，5级50%
          weaponAttackBonus: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取武器攻击力加成百分比
       * 1级10%，每级+10%，5级50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 武器攻击力加成百分比（0-50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 10 * safeLevel
      }
    },

    /**
     * O技能 - 宗师之威EX1-增强防御力（被动技能）
     * 增强宗师之威效果，进一步强化全体物理防御力
     * 1级即为最大熟练度，默认满级效果：+15%防御力
     * 每次释放宗师之威（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'combat_master_o',
      key: 'O',
      name: '宗师之威EX1-增强防御力',
      icon: '/pt/skill_icon/zongshizhiwei.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：增强宗师之威，进一步强化全体物理防御力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      // 成长线路：宗师之威系列技能（宗师之威→宗师之威EX1→宗师之威EX2）
      growthLine: 'grandmaster_authority',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'grandmaster_authority_defense',
          // 防御力百分比加成 - 1级即为满级，固定15%
          defensePercentage: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取宗师之威EX1提供的额外物理防御力百分比加成
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外防御力百分比加成（固定15）
       */
      getDefenseBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * O_EX2技能 - 宗师之威EX2-增强魔力上限（被动技能）
     * 增强宗师之威效果，进一步强化全体魔力上限
     * 1级即为最大熟练度，默认满级效果：+30%魔法值上限
     * 每次释放宗师之威（Q技能）时，该被动技能熟练度随之增加
     */
    O_EX2: {
      id: 'combat_master_o_ex2',
      key: 'O_EX2',
      name: '宗师之威EX2-增强魔力上限',
      icon: '/pt/skill_icon/zongshizhiwei.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：增强宗师之威，进一步强化全体魔力上限。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：宗师之威系列技能（宗师之威→宗师之威EX1→宗师之威EX2）
      growthLine: 'grandmaster_authority',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'grandmaster_authority_mana',
          // 魔力上限百分比加成 - 1级即为满级，固定30%
          maxMana: {
            base: 30,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取宗师之威EX2提供的额外魔力上限百分比加成
       * 1级即为最大熟练度，固定返回30%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外魔力上限百分比加成（固定30）
       */
      getManaMaxBonus(skillLevel = 1) {
        return 30
      }
    },

    /**
     * W_EX技能 - 龟派气功EX1-CD减少（被动技能）
     * 增强龟派气功，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少龟派气功技能CD 50%
     * 技能图片、音效与龟派气功一致
     */
    W_EX: {
      id: 'combat_master_w_ex',
      key: 'W_EX',
      name: '龟派气功EX1-CD减少',
      icon: '/pt/skill_icon/nensphere.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：减少龟派气功冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：龟派气功系列（龟派气功→龟派气功EX1→龟派气功EX2）
      growthLine: 'nensphere',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'nensphere_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取龟派气功CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 龟派气功EX2-伤害增加（被动技能）
     * 增强龟派气功，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加龟派气功技能伤害 50%
     * 技能图片、音效与龟派气功一致
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'combat_master_w_ex2',
      key: 'W_EX2',
      name: '龟派气功EX2-伤害增加',
      icon: '/pt/skill_icon/nensphere.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增加龟派气功技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：龟派气功系列（龟派气功→龟派气功EX1→龟派气功EX2→龟派气功EX3）
      growthLine: 'nensphere',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'nensphere_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取龟派气功伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 龟派气功EX3-多段伤害（被动技能）
     * 增强龟派气功，概率触发多段伤害
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率触发1段伤害（多触发一次）
     *   15%概率触发2段伤害（多触发两次）
     *   5%概率触发3段伤害（多触发三次）
     * 技能图片、音效与龟派气功一致
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'combat_master_w_ex3',
      key: 'W_EX3',
      name: '龟派气功EX3-多段伤害',
      icon: '/pt/skill_icon/nensphere.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增强龟派气功，概率触发多段伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：龟派气功系列（龟派气功→龟派气功EX1→龟派气功EX2→龟派气功EX3）
      growthLine: 'nensphere',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'nensphere_multi_hit',
          // 多段伤害触发概率 - 1级即为满级，固定概率
          // 1段：30%概率多触发一次额外伤害
          // 2段：15%概率多触发两次额外伤害
          // 3段：5%概率多触发三次额外伤害
          // 概率为逐级包含关系：30%包含15%和5%
          multiHit: {
            chance1: 30,
            chance2: 15,
            chance3: 5
          }
        }
      },

      /**
       * 获取多段伤害触发信息
       * 1级即为最大熟练度，固定返回多段伤害概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 多段伤害概率配置 { chance1, chance2, chance3 }
       */
      getMultiHitChance(skillLevel = 1) {
        return {
          chance1: 30,
          chance2: 15,
          chance3: 5
        }
      }
    },

    /**
     * E_EX1技能 - 龙拳-破劲EX1-CD减少（被动技能）
     * 增强龙拳-破劲，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少龙拳-破劲技能CD 50%
     * 技能图片、音效与龙拳-破劲一致
     */
    E_EX1: {
      id: 'combat_master_e_ex1',
      key: 'E_EX1',
      name: '龙拳-破劲EX1-CD减少',
      icon: '/pt/skill_icon/longquanpojin.png',
      audio: '/sound/PcSkillD-blindside.wav',
      description: '增强龙拳-破劲，减少冷却时间。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：龙拳-破劲系列（龙拳-破劲→龙拳-破劲EX1→龙拳-破劲EX2）
      growthLine: 'dragon_fist_break',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'dragon_fist_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取龙拳-破劲CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 龙拳-破劲EX2-伤害增加（被动技能）
     * 增强龙拳-破劲，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加龙拳-破劲技能伤害 50%
     * 技能图片、音效与龙拳-破劲一致
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'combat_master_e_ex2',
      key: 'E_EX2',
      name: '龙拳-破劲EX2-伤害增加',
      icon: '/pt/skill_icon/longquanpojin.png',
      audio: '/sound/PcSkillD-blindside.wav',
      description: '增强龙拳-破劲，增加技能伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：龙拳-破劲系列（龙拳-破劲→龙拳-破劲EX1→龙拳-破劲EX2）
      growthLine: 'dragon_fist_break',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'dragon_fist_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取龙拳-破劲伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX1技能 - 念气能量弹EX1-CD减少（被动技能）
     * 增强念气能量弹，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少念气能量弹技能CD 50%
     * 技能图片、音效与念气能量弹一致
     */
    U_EX1: {
      id: 'combat_master_u_ex1',
      key: 'U_EX1',
      name: '念气能量弹EX1-CD减少',
      icon: '/pt/skill_icon/aurabomb.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：减少念气能量弹冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：念气能量弹系列（念气能量弹→念气能量弹EX1→念气能量弹EX2）
      growthLine: 'aura_bomb',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'aura_bomb_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取念气能量弹CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 念气能量弹EX2-伤害增加（被动技能）
     * 增强念气能量弹，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加念气能量弹技能伤害 50%
     * 技能图片、音效与念气能量弹一致
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'combat_master_u_ex2',
      key: 'U_EX2',
      name: '念气能量弹EX2-伤害增加',
      icon: '/pt/skill_icon/aurabomb.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：增加念气能量弹技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：念气能量弹系列（念气能量弹→念气能量弹EX1→念气能量弹EX2）
      growthLine: 'aura_bomb',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'aura_bomb_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取念气能量弹伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX1技能 - 武器精通-拳套EX1-伤害增加（被动技能）
     * 增强武器精通-拳套，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害50%
     * 技能图片、音效与武器精通-拳套一致
     */
    I_EX1: {
      id: 'combat_master_i_ex1',
      key: 'I_EX1',
      name: '武器精通-拳套EX1-伤害增加',
      icon: '/pt/skill_icon/quantaojingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强武器精通-拳套，增加武器基础伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：武器精通-拳套系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_knuckle',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'knuckle_attack_mastery_ex1',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定50%
          weaponAttackBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX2技能 - 武器精通-拳套EX2-伤害增加（被动技能）
     * 增强武器精通-拳套，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害100%
     * 技能图片、音效与武器精通-拳套一致
     */
    I_EX2: {
      id: 'combat_master_i_ex2',
      key: 'I_EX2',
      name: '武器精通-拳套EX2-伤害增加',
      icon: '/pt/skill_icon/quantaojingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强武器精通-拳套，增加武器基础伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：武器精通-拳套系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_knuckle',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'knuckle_attack_mastery_ex2',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定100%
          weaponAttackBonus: {
            base: 100,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回100%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定100）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 100
      }
    },

    /**
     * J技能 - 龙之劲（被动技能）
     * 获得龙之力量-劲力，每次普通攻击增加一点劲力值，最高10点
     * 第10次普通攻击附加攻击力百分比伤害，然后重置劲力值
     * MP:30（每次普通攻击减少30点MP，增加一个劲力值）
     * 1级熟练度：第10次普通攻击附加攻击力10%
     * 10级熟练度：第10次普通攻击附加攻击力100%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'combat_master_j',
      key: 'J',
      name: '龙之劲',
      icon: '/pt/skill_icon/longjin.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description:
        '获得龙之力量-劲力，每次普通攻击增加一点劲力值，最高10点，第10次普通攻击附加攻击力伤害，然后重置劲力值。每次普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      // 成长线路：龙之劲系列（龙之劲→龙之劲EX1→龙之劲EX2）
      growthLine: 'dragon_force',
      // 熟练度增长配置：普通攻击命中累计计数，达到阈值后增加1点熟练度
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'dragon_force_bonus',
          // 攻击力百分比加成 - 1级10%，每级+10%，10级100%
          attackPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取龙之劲附加攻击力百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击力附加百分比（10-100）
       */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取龙之劲触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取龙之劲每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 龙之劲EX1-减少触发次数（被动技能）
     * 增强龙之劲，减少普通攻击附加伤害的次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     * 技能图片与龙之劲一致
     */
    J_EX1: {
      id: 'combat_master_j_ex1',
      key: 'J_EX1',
      name: '龙之劲EX1-减少触发次数',
      icon: '/pt/skill_icon/longjin.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强龙之劲，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：龙之劲系列（龙之劲→龙之劲EX1→龙之劲EX2）
      growthLine: 'dragon_force',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'dragon_force_trigger_reduction',
          // 触发次数减少百分比 - 1级即为满级，固定减少50%
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取龙之劲触发次数减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 龙之劲EX2-倍攻（被动技能）
     * 增强龙之劲，在EX1触发次数阈值时概率触发倍攻
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击 50%概率附加100%攻击力
     *   第5次普通攻击 25%概率附加150%攻击力
     *   第5次普通攻击 10%概率附加180%攻击力
     * 概率为逐级包含关系：50%包含25%和10%
     * 技能图片与龙之劲一致
     */
    J_EX2: {
      id: 'combat_master_j_ex2',
      key: 'J_EX2',
      name: '龙之劲EX2-倍攻',
      icon: '/pt/skill_icon/longjin.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强龙之劲，在EX1触发次数时概率触发倍攻。需先解锁龙之劲EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：龙之劲系列（龙之劲→龙之劲EX1→龙之劲EX2）
      growthLine: 'dragon_force',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'dragon_force_multi_attack',
          // 倍攻触发概率 - 1级即为满级，固定概率
          // 50%概率附加100%攻击力
          // 25%概率附加150%攻击力
          // 10%概率附加180%攻击力
          // 概率为逐级包含关系：50%包含25%和10%
          multiAttack: {
            chance1: 50,
            bonus1: 100,
            chance2: 25,
            bonus2: 150,
            chance3: 10,
            bonus3: 180
          }
        }
      },

      /**
       * 获取龙之劲EX2倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 50,
          bonus1: 100,
          chance2: 25,
          bonus2: 150,
          chance3: 10,
          bonus3: 180
        }
      }
    }
  },

  // ========== 奥术师技能 ==========
  // 三转职业：由元素使者(element_mage)进阶，高智力 全元素覆盖 法术暴击 的奥术炮台
  // 技能体系参照圣殿骑士设计：5个主技能 + 多个EX被动技能，共7条成长线路
  // 职业特征：继承元素使者的五行元素之力，突破元素壁垒，掌握奥术本源之力，
  //           以毁灭性的法术爆发和全元素覆盖碾压敌人
  arcane_master: {
    /**
     * Q技能 - 奥术共鸣
     * 群体BUFF技能：开启奥术共鸣场域，持续期间提升全队法术攻击力和全元素攻击力
     * 一阶强化（奥术共鸣EX1）额外提升全队最大MP；二阶强化（奥术共鸣EX2）额外提升全队法术穿透
     * 三阶强化（奥术共鸣EX3）额外提升全队法术暴击率
     * CD100秒，持续时间为CD一半（50秒）
     * 1级熟练度：法术攻击力+2%，全元素攻击力+2%
     * 5级熟练度：法术攻击力+10%，全元素攻击力+10%
     */
    Q: {
      id: 'arcane_master_q',
      key: 'Q',
      name: '奥术共鸣',
      icon: '/pt/skill_icon/aoshugongming.png',
      audio: '/sound/PcSkillM-Multicasting.wav',
      description:
        '开启奥术共鸣场域庇护全队，持续期间提升全队法术攻击力和全元素攻击力；一阶强化额外提升全队最大MP，二阶强化进一步增加全队法术穿透，三阶强化额外提升全队法术暴击率。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 100,
      manaCost: 260,
      buffDuration: 50,
      isPartyBuff: true,
      unlockLevel: 175,
      growthLine: 'arcane_resonance',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'arcane_resonance_buff',
          magicAttack: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 奥术共鸣提供法术攻击力和全元素攻击力百分比加成
       * 若已学会奥术共鸣EX1（O技能），叠加最大MP百分比加成
       * 若已学会奥术共鸣EX2（O_EX2技能），叠加法术穿透百分比加成
       * 若已学会奥术共鸣EX3（O_EX3技能），叠加法术暴击率加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          magicAttack: {
            add: 2 * safeLevel,
            rate: true
          },
          fireAttack: {
            add: 2 * safeLevel,
            rate: true
          },
          windAttack: {
            add: 2 * safeLevel,
            rate: true
          },
          earthAttack: {
            add: 2 * safeLevel,
            rate: true
          },
          thunderAttack: {
            add: 2 * safeLevel,
            rate: true
          },
          waterAttack: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 奥术共鸣EX1被动技能提供额外最大MP百分比加成
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.arcane_master.O
            if (ex1Def && typeof ex1Def.getMaxMpBonus === 'function') {
              result.maxMp = {
                add: ex1Def.getMaxMpBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          console.log('[奥术共鸣] EX1检测异常:', e?.message || e)
        }

        // 奥术共鸣EX2被动技能提供额外法术穿透百分比加成
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.arcane_master.O_EX2
            if (ex2Def && typeof ex2Def.getSpellPenetrationBonus === 'function') {
              result.spellPenetration = {
                add: ex2Def.getSpellPenetrationBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 奥术共鸣EX2未解锁或未加载时不提供法术穿透加成
        }

        // 奥术共鸣EX3被动技能提供额外法术暴击率加成
        try {
          const ex3Skill = player?.skills?.['O_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.arcane_master.O_EX3
            if (ex3Def && typeof ex3Def.getCriticalRateBonus === 'function') {
              result.criticalRate = {
                add: ex3Def.getCriticalRateBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 奥术共鸣EX3未解锁或未加载时不提供法术暴击率加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：CD的一半（100秒CD / 2 = 50秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        return 50
      }
    },

    /**
     * O技能 - 奥术共鸣EX1-增强法力（被动技能）
     * 增强奥术共鸣效果，持续期间额外提升全队最大MP
     * 1级即为最大熟练度，默认满级效果：+15%最大MP
     * 每次释放奥术共鸣（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'arcane_master_o',
      key: 'O',
      name: '奥术共鸣EX1-增强法力',
      icon: '/pt/skill_icon/aoshugongming.png',
      audio: '/sound/PcSkillM-Multicasting.wav',
      description: '被动技能：增强奥术共鸣，全队最大MP+15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'arcane_resonance',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_resonance_max_mp',
          maxMp: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术共鸣EX1提供的额外最大MP百分比加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外最大MP百分比加成（固定15）
       */
      getMaxMpBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * O_EX2技能 - 奥术共鸣EX2-法术穿透（被动技能）
     * 增强奥术共鸣效果，持续期间额外提升全队法术穿透
     * 1级即为最大熟练度，默认满级效果：+10%法术穿透
     * 解锁等级：185级
     */
    O_EX2: {
      id: 'arcane_master_o_ex2',
      key: 'O_EX2',
      name: '奥术共鸣EX2-法术穿透',
      icon: '/pt/skill_icon/aoshugongming.png',
      audio: '/sound/PcSkillM-Multicasting.wav',
      description: '被动技能：增强奥术共鸣，全队法术穿透+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'arcane_resonance',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_resonance_spell_penetration',
          spellPenetration: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术共鸣EX2提供的额外法术穿透百分比加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外法术穿透百分比加成（固定10）
       */
      getSpellPenetrationBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX3技能 - 奥术共鸣EX3-法术暴击（被动技能）
     * 增强奥术共鸣效果，持续期间额外提升全队法术暴击率
     * 1级即为最大熟练度，默认满级效果：+10%法术暴击率
     * 解锁等级：190级
     */
    O_EX3: {
      id: 'arcane_master_o_ex3',
      key: 'O_EX3',
      name: '奥术共鸣EX3-法术暴击',
      icon: '/pt/skill_icon/aoshugongming.png',
      audio: '/sound/PcSkillM-Multicasting.wav',
      description: '被动技能：增强奥术共鸣，全队法术暴击率+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'arcane_resonance',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_resonance_critical_rate',
          criticalRate: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术共鸣EX3提供的额外法术暴击率加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外法术暴击率加成（固定10）
       */
      getCriticalRateBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * W技能 - 虚空寂灭
     * 单体无属性法术伤害技能：将奥术能量压缩至极限后释放，对单体目标造成毁灭性伤害
     * 基础伤害1200，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+3000
     * 智力加成：每点智力提供6点伤害
     * CD减少由虚空寂灭EX1被动技能提供（175级解锁）
     * 伤害增加由虚空寂灭EX2被动技能提供（185级解锁）
     * 法术连击由虚空寂灭EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'arcane_master_w',
      key: 'W',
      name: '虚空寂灭',
      icon: '/pt/skill_icon/xukongjimie.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description:
        '将奥术能量压缩至极限后释放，对单体目标造成毁灭性无属性法术伤害。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 1200,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      growthLine: 'void_fission',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 200,
          increment: (3000 - 200) / 4
        }
      },

      /**
       * 伤害计算（智力型单体法术伤害）
       * 公式: 基础伤害(1200) + 熟练度伤害(1级+200,5级+3000) + 智力×6 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 200 + ((3000 - 200) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 6
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * W_EX技能 - 虚空寂灭EX1-CD减少（被动技能）
     * 增强虚空寂灭，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少虚空寂灭技能CD 50%
     */
    W_EX: {
      id: 'arcane_master_w_ex',
      key: 'W_EX',
      name: '虚空寂灭EX1-CD减少',
      icon: '/pt/skill_icon/xukongjimie.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：减少虚空寂灭冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'void_fission',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'void_fission_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取虚空寂灭CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 虚空寂灭EX2-伤害增加（被动技能）
     * 增强虚空寂灭，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加虚空寂灭技能伤害 50%
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'arcane_master_w_ex2',
      key: 'W_EX2',
      name: '虚空寂灭EX2-伤害增加',
      icon: '/pt/skill_icon/xukongjimie.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加虚空寂灭技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'void_fission',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'void_fission_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取虚空寂灭伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 虚空寂灭EX3-法术连击（被动技能）
     * 增强虚空寂灭，概率触发法术连击
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率造成2倍伤害
     *   20%概率造成3倍伤害
     *   10%概率造成4倍伤害
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'arcane_master_w_ex3',
      key: 'W_EX3',
      name: '虚空寂灭EX3-法术连击',
      icon: '/pt/skill_icon/xukongjimie.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增强虚空寂灭，概率触发法术连击。30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成4倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'void_fission',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'void_fission_critical_multiplier',
          criticalMultiplier: {
            chance2x: 30,
            chance3x: 20,
            chance4x: 10
          }
        }
      },

      /**
       * 获取法术连击触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance2x, chance3x, chance4x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance2x: 30,
          chance3x: 20,
          chance4x: 10
        }
      }
    },

    /**
     * E技能 - 元素崩坏
     * AOE DEBUFF技能：引发元素失衡，对范围内敌人造成全元素伤害并施加「元素脆弱」DEBUFF
     * 印记期间目标全元素抗性大幅降低，承受元素伤害增加
     * 1级熟练度：伤害+150，目标全元素抗性-30%，承受元素伤害+20%
     * 5级熟练度：伤害+1000，目标全元素抗性-30%，承受元素伤害+20%
     * 基础CD 120秒，DEBUFF持续时间为CD的一半（60秒）
     * 解锁EX1后CD 60秒，DEBUFF持续时间30秒
     * CD减少由元素崩坏EX1被动技能提供（175级解锁）
     * 伤害增加由元素崩坏EX2被动技能提供（185级解锁）
     * 元素易伤增强由元素崩坏EX3被动技能提供（190级解锁）
     */
    E: {
      id: 'arcane_master_e',
      key: 'E',
      name: '元素崩坏',
      icon: '/pt/skill_icon/yuansubenghuai.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description:
        '引发元素失衡对范围内敌人造成毁灭性全元素伤害。受击目标附上「元素脆弱」，持续60秒，期间目标全元素抗性降低30%，承受元素伤害增加20%。解锁EX1后CD与DEBUFF持续时间均减半。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 500,
      cd: 120,
      manaCost: 200,
      duration: 60,
      unlockLevel: 170,
      growthLine: 'element_collapse',

      // DEBUFF配置：元素脆弱（全元素抗性降低 + 承受元素伤害增加）
      debuff: {
        type: 'elementVulnerability',
        chance: 100,
        effect: {
          type: 'elementVulnerability',
          icon: '/pt/skill_icon/yuansubenghuai.png',
          baseDuration: 60,
          /**
           * 获取全元素抗性降低百分比（固定30%）
           * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回30）
           * @returns {number} 全元素抗性降低百分比
           */
          getValue(skillLevel) {
            return 30
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算（智力型AOE全元素伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 智力×5.18 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 5.18
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + intDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（全元素抗性降低30%，承受元素伤害增加20%）
       * 持续时间：基础60秒，解锁EX1后减半为30秒
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定效果）
       * @param {Object} [player] - 玩家对象，用于判断EX1解锁状态
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        let duration = 60
        if (player && isSkillUnlocked(player, 'arcane_master', 'E_EX1')) {
          duration = 30
        }
        return {
          elementResistanceReduction: 30,
          elementDamageIncrease: 20,
          duration
        }
      }
    },

    /**
     * E_EX1技能 - 元素崩坏EX1-CD减少（被动技能）
     * 增强元素崩坏，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少元素崩坏技能CD 50%
     * 基础CD 120秒 → 解锁后CD 60秒，DEBUFF持续时间同步减半（60秒→30秒）
     */
    E_EX1: {
      id: 'arcane_master_e_ex1',
      key: 'E_EX1',
      name: '元素崩坏EX1-CD减少',
      icon: '/pt/skill_icon/yuansubenghuai.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：减少元素崩坏冷却时间50%，DEBUFF持续时间同步减半。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'element_collapse',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'element_collapse_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取元素崩坏CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 元素崩坏EX2-伤害增加（被动技能）
     * 增强元素崩坏，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加元素崩坏技能伤害 50%
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'arcane_master_e_ex2',
      key: 'E_EX2',
      name: '元素崩坏EX2-伤害增加',
      icon: '/pt/skill_icon/yuansubenghuai.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：增加元素崩坏技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'element_collapse',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'element_collapse_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取元素崩坏伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX3技能 - 元素崩坏EX3-元素易伤强化（被动技能）
     * 增强元素崩坏，当目标有元素脆弱DEBUFF时，承受的元素伤害额外增加
     * 1级即为最大熟练度，默认满级效果：元素伤害额外增加20%
     * 解锁等级：190级
     */
    E_EX3: {
      id: 'arcane_master_e_ex3',
      key: 'E_EX3',
      name: '元素崩坏EX3-元素易伤强化',
      icon: '/pt/skill_icon/yuansubenghuai.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：元素崩坏DEBUFF持续期间，目标承受的元素伤害额外增加20%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'element_collapse',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'element_collapse_vulnerability_boost',
          vulnerabilityBonus: {
            base: 20,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取元素崩坏EX3提供的元素易伤额外增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 元素易伤额外增加百分比（固定20）
       */
      getVulnerabilityBonus(skillLevel = 1) {
        return 20
      }
    },

    /**
     * U技能 - 奥术新星
     * AOE无属性法术伤害技能：以自身为中心释放奥术新星，对范围内敌人造成高强度奥术伤害
     * 基础伤害800，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
     * 智力加成：每点智力提供7点伤害
     * CD减少由奥术新星EX1被动技能提供（175级解锁）
     * 伤害增加由奥术新星EX2被动技能提供（185级解锁）
     * 多段攻击由奥术新星EX3被动技能提供（190级解锁）
     */
    U: {
      id: 'arcane_master_u',
      key: 'U',
      name: '奥术新星',
      icon: '/pt/skill_icon/aoshuxinxing.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description:
        '以自身为中心释放奥术新星，对范围内敌人造成毁灭性无属性法术范围伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 800,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      growthLine: 'arcane_nova',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 伤害计算（智力型AOE法术伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 智力×7 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 7
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * U_EX1技能 - 奥术新星EX1-CD减少（被动技能）
     * 增强奥术新星，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少奥术新星技能CD 50%
     */
    U_EX1: {
      id: 'arcane_master_u_ex1',
      key: 'U_EX1',
      name: '奥术新星EX1-CD减少',
      icon: '/pt/skill_icon/aoshuxinxing.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：减少奥术新星冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'arcane_nova',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_nova_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术新星CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 奥术新星EX2-伤害增加（被动技能）
     * 增强奥术新星，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加奥术新星技能伤害 50%
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'arcane_master_u_ex2',
      key: 'U_EX2',
      name: '奥术新星EX2-伤害增加',
      icon: '/pt/skill_icon/aoshuxinxing.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：增加奥术新星技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'arcane_nova',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_nova_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术新星伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX3技能 - 奥术新星EX3-多段攻击（被动技能）
     * 增强奥术新星，概率触发多段攻击
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率触发1段攻击（额外造成1次伤害）
     *   20%概率触发2段攻击（额外造成2次伤害）
     *   10%概率触发3段攻击（额外造成3次伤害）
     * 解锁等级：190级
     */
    U_EX3: {
      id: 'arcane_master_u_ex3',
      key: 'U_EX3',
      name: '奥术新星EX3-多段攻击',
      icon: '/pt/skill_icon/aoshuxinxing.png',
      audio: '/sound/PcSkillM-SpecialHit.wav',
      description: '被动技能：增强奥术新星，概率触发多段攻击。30%概率触发1段攻击（额外1次伤害），20%概率触发2段攻击（额外2次伤害），10%概率触发3段攻击（额外3次伤害）。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'arcane_nova',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_nova_multi_hit',
          multiHit: {
            chance1: 30,
            hits1: 1,
            chance2: 20,
            hits2: 2,
            chance3: 10,
            hits3: 3
          }
        }
      },

      /**
       * 获取多段攻击触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 多段攻击概率配置 { chance1, hits1, chance2, hits2, chance3, hits3 }
       */
      getMultiHitChance(skillLevel = 1) {
        return {
          chance1: 30,
          hits1: 1,
          chance2: 20,
          hits2: 2,
          chance3: 10,
          hits3: 3
        }
      }
    },

    /**
     * I技能 - 奥术精通（被动技能）
     * 增加自身法术攻击力，按熟练度百分比提升
     * 1级熟练度：法术攻击力+5%
     * 5级熟练度：法术攻击力+25%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'arcane_master_i',
      key: 'I',
      name: '奥术精通',
      icon: '/pt/skill_icon/aoshujingtong.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加自身法术攻击力，随熟练度提升。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      growthLine: 'arcane_mastery',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'arcane_mastery_attack',
          magicAttackBonus: {
            base: 5,
            increment: 5,
            rate: true
          }
        }
      },

      /**
       * 获取法术攻击力加成百分比
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 法术攻击力加成百分比（0-25）
       */
      getMagicAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 5 * safeLevel
      }
    },

    /**
     * I_EX1技能 - 奥术精通EX1-法力涌动（被动技能）
     * 增强奥术精通，增加最大MP
     * 1级即为最大熟练度，默认满级效果：最大MP+15%
     * 解锁等级：170级
     */
    I_EX1: {
      id: 'arcane_master_i_ex1',
      key: 'I_EX1',
      name: '奥术精通EX1-法力涌动',
      icon: '/pt/skill_icon/aoshujingtong.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加最大MP15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 170,
      growthLine: 'arcane_mastery',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_mastery_ex1',
          maxMpBonus: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取最大MP加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 最大MP加成百分比（固定15）
       */
      getMaxMpBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * I_EX2技能 - 奥术精通EX2-元素亲和（被动技能）
     * 增强奥术精通，增加全元素攻击力
     * 1级即为最大熟练度，默认满级效果：全元素攻击力+15%
     * 解锁等级：180级
     */
    I_EX2: {
      id: 'arcane_master_i_ex2',
      key: 'I_EX2',
      name: '奥术精通EX2-元素亲和',
      icon: '/pt/skill_icon/aoshujingtong.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加全元素攻击力15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'arcane_mastery',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_mastery_ex2',
          allElementAttackBonus: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取全元素攻击力加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 全元素攻击力加成百分比（固定15）
       */
      getAllElementAttackBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * I_EX3技能 - 奥术精通EX3-法术吸收（被动技能）
     * 增强奥术精通，受到伤害时概率触发法术吸收回复MP
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率吸收10%伤害为MP
     *   20%概率吸收20%伤害为MP
     *   10%概率吸收30%伤害为MP
     * 解锁等级：190级
     */
    I_EX3: {
      id: 'arcane_master_i_ex3',
      key: 'I_EX3',
      name: '奥术精通EX3-法术吸收',
      icon: '/pt/skill_icon/aoshujingtong.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：受到伤害时概率触发法术吸收，将伤害转化为MP。30%概率吸收10%伤害，20%概率吸收20%伤害，10%概率吸收30%伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'arcane_mastery',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_mastery_ex3',
          manaAbsorption: {
            tiers: [
              { chance: 30, absorption: 10 },
              { chance: 20, absorption: 20 },
              { chance: 10, absorption: 30 }
            ]
          }
        }
      },

      /**
       * 获取法术吸收触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object|null} 吸收配置对象，包含 tiers 数组
       */
      getManaAbsorption(skillLevel = 1) {
        return {
          tiers: [
            { chance: 30, absorption: 10 },
            { chance: 20, absorption: 20 },
            { chance: 10, absorption: 30 }
          ]
        }
      },

      /**
       * 随机摇取法术吸收比例
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 吸收百分比（0表示未触发，10/20/30表示触发对应吸收）
       */
      rollManaAbsorption(skillLevel = 1) {
        const config = this.getManaAbsorption(skillLevel)
        if (!config || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          return 0
        }
        for (const tier of config.tiers) {
          if (Math.random() * 100 < tier.chance) {
            return tier.absorption
          }
        }
        return 0
      }
    },

    /**
     * J技能 - 奥术充能（被动技能）
     * 获得奥术之力-充能积累，每次普通攻击或释放技能增加一点充能值，最高10点
     * 第10次普通攻击附加法术攻击力百分比的额外无属性法术伤害，然后重置充能值
     * MP:30（每次普通攻击减少30点MP，增加一个充能值）
     * 1级熟练度：第10次普通攻击附加法术攻击力10%的伤害
     * 10级熟练度：第10次普通攻击附加法术攻击力100%的伤害
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'arcane_master_j',
      key: 'J',
      name: '奥术充能',
      icon: '/pt/skill_icon/aoshuchongneng.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description:
        '获得奥术之力-充能积累，每次普通攻击或释放技能增加一点充能值，最高10点，达到触发阈值时附加法术攻击力百分比的额外无属性法术伤害，然后重置充能值。每次普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      growthLine: 'arcane_charge',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'arcane_charge_bonus',
          attackPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取奥术充能附加法术攻击力百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击力附加百分比（10-100）
       */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取奥术充能触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取奥术充能每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 奥术充能EX1-减少触发次数（被动技能）
     * 增强奥术充能，减少普通攻击附加伤害的次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     */
    J_EX1: {
      id: 'arcane_master_j_ex1',
      key: 'J_EX1',
      name: '奥术充能EX1-减少触发次数',
      icon: '/pt/skill_icon/aoshuchongneng.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '增强奥术充能，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'arcane_charge',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_charge_trigger_reduction',
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取奥术充能触发次数减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 奥术充能EX2-法术连锁（被动技能）
     * 增强奥术充能，在EX1触发次数阈值时概率触发法术连锁
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击/技能释放 30%概率附加200%攻击力
     *   第5次普通攻击/技能释放 20%概率附加300%攻击力
     *   第5次普通攻击/技能释放 10%概率附加400%攻击力
     */
    J_EX2: {
      id: 'arcane_master_j_ex2',
      key: 'J_EX2',
      name: '奥术充能EX2-法术连锁',
      icon: '/pt/skill_icon/aoshuchongneng.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '增强奥术充能，在EX1触发次数时概率触发法术连锁（30%概率200%攻击力、20%概率300%攻击力、10%概率400%攻击力）。需先解锁奥术充能EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'arcane_charge',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_charge_multi_attack',
          multiAttack: {
            chance1: 30,
            bonus1: 200,
            chance2: 20,
            bonus2: 300,
            chance3: 10,
            bonus3: 400
          }
        }
      },

      /**
       * 获取奥术充能EX2法术连锁触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 30,
          bonus1: 200,
          chance2: 20,
          bonus2: 300,
          chance3: 10,
          bonus3: 400
        }
      }
    },

    /**
     * R技能 - 奥术超载
     * 自身BUFF技能：将奥术能量超限释放，进入「奥术超载」状态
     * 持续期间大幅提升自身法术攻击力和全元素攻击力
     * 基础持续时间30秒（CD的一半）
     * 1级熟练度：法术攻击力+5%，全元素攻击力+5%
     * 5级熟练度：法术攻击力+20%，全元素攻击力+20%
     * 法力护盾由奥术超载EX1被动技能提供（175级解锁）
     * 全元素攻击和暴击伤害加成由奥术超载EX2被动技能提供（180级解锁）
     * 法术反弹由奥术超载EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'arcane_master_r',
      key: 'R',
      name: '奥术超载',
      icon: '/pt/skill_icon/aoshuchaozai.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description:
        '奥术师核心爆发技能，将奥术能量超限释放，进入奥术超载状态，持续期间大幅提升自身法术攻击力和全元素攻击力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 60,
      manaCost: 230,
      buffDuration: 30,
      isTeamBuff: false,
      unlockLevel: 170,
      growthLine: 'arcane_overload',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'arcane_overload_buff',
          magicAttack: {
            base: 5,
            increment: 3.75,
            rate: true
          },
          allElementAttack: {
            base: 5,
            increment: 3.75,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 奥术超载提供法术攻击力和全元素攻击力加成
       * 若已学会奥术超载EX1（R_EX1技能），叠加法力护盾效果
       * 若已学会奥术超载EX2（R_EX2技能），叠加法术暴击伤害和额外全元素攻击加成
       * 若已学会奥术超载EX3（R_EX3技能），叠加法术反弹效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          magicAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          fireAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          windAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          earthAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          thunderAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          waterAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          }
        }

        // 奥术超载EX1被动技能提供法力护盾效果
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.arcane_master.R_EX1
            if (ex1Def && typeof ex1Def.getManaShieldPercent === 'function') {
              result.manaShield = {
                add: ex1Def.getManaShieldPercent(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 奥术超载EX1未解锁或未加载时不提供法力护盾
        }

        // 奥术超载EX2被动技能提供法术暴击伤害和额外全元素攻击加成
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.arcane_master.R_EX2
            if (ex2Def && typeof ex2Def.getCriticalDamageBonus === 'function') {
              result.criticalDamage = {
                add: ex2Def.getCriticalDamageBonus(ex2Level),
                rate: true
              }
            }
            if (ex2Def && typeof ex2Def.getExtraElementAttackBonus === 'function') {
              const extraBonus = ex2Def.getExtraElementAttackBonus(ex2Level)
              result.fireAttack = { add: (result.fireAttack?.add || 0) + extraBonus, rate: true }
              result.windAttack = { add: (result.windAttack?.add || 0) + extraBonus, rate: true }
              result.earthAttack = { add: (result.earthAttack?.add || 0) + extraBonus, rate: true }
              result.thunderAttack = { add: (result.thunderAttack?.add || 0) + extraBonus, rate: true }
              result.waterAttack = { add: (result.waterAttack?.add || 0) + extraBonus, rate: true }
            }
          }
        } catch (e) {
          // 奥术超载EX2未解锁或未加载时不提供暴击伤害和额外元素加成
        }

        // 奥术超载EX3被动技能提供法术反弹效果
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.arcane_master.R_EX3
            if (ex3Def && typeof ex3Def.getSpellReflectBonus === 'function') {
              result.spellReflect = {
                add: ex3Def.getSpellReflectBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 奥术超载EX3未解锁或未加载时不提供法术反弹
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础CD / 2（60/2=30秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseCd = SKILL_CONFIG.arcane_master.R.cd || 60
        return Math.max(1, Math.ceil(baseCd / 2))
      }
    },

    /**
     * R_EX1技能 - 奥术超载EX1-法力护盾（被动技能）
     * 增强奥术超载，释放期间获得法力护盾，受到伤害优先扣MP
     * 1级即为最大熟练度，默认满级效果：法力护盾吸收25%伤害
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'arcane_master_r_ex1',
      key: 'R_EX1',
      name: '奥术超载EX1-法力护盾',
      icon: '/pt/skill_icon/aoshuchaozai.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：奥术超载持续期间，获得法力护盾，受到伤害的25%优先扣除MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'arcane_overload',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_overload_mana_shield',
          manaShield: {
            base: 25,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取法力护盾吸收伤害百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 法力护盾吸收百分比（固定25）
       */
      getManaShieldPercent(skillLevel = 1) {
        return 25
      }
    },

    /**
     * R_EX2技能 - 奥术超载EX2-元素共鸣（被动技能）
     * 增强奥术超载，释放期间获得法术暴击伤害加成和额外全元素攻击加成
     * 1级即为最大熟练度，默认满级效果：法术暴击伤害+25%，额外全元素攻击+15%
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'arcane_master_r_ex2',
      key: 'R_EX2',
      name: '奥术超载EX2-元素共鸣',
      icon: '/pt/skill_icon/aoshuchaozai.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：奥术超载持续期间，法术暴击伤害+25%，额外全元素攻击+15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'arcane_overload',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_overload_element_resonance',
          criticalDamage: {
            base: 25,
            increment: 0,
            rate: true
          },
          extraElementAttack: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取法术暴击伤害加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 法术暴击伤害加成百分比（固定25）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 25
      },

      /**
       * 获取额外全元素攻击加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外全元素攻击加成百分比（固定15）
       */
      getExtraElementAttackBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * R_EX3技能 - 奥术超载EX3-法术反弹（被动技能）
     * 增强奥术超载，受到法术伤害时概率反弹
     * 1级即为最大熟练度，默认满级效果：受到法术伤害的20%反弹给攻击者
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'arcane_master_r_ex3',
      key: 'R_EX3',
      name: '奥术超载EX3-法术反弹',
      icon: '/pt/skill_icon/aoshuchaozai.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：奥术超载持续期间，受到法术伤害的20%反弹给攻击者。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'arcane_overload',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'arcane_overload_spell_reflect',
          spellReflect: {
            base: 20,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取法术反弹百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 法术反弹百分比（固定20）
       */
      getSpellReflectBonus(skillLevel = 1) {
        return 20
      }
    }
  },

  // ========== 心灵师技能 ==========
  // 三转职业：由精神使者(spirit_mage)进阶，高智力 高魔法防御 精神操控 的心灵主宰
  // 技能体系参照奥术师设计：5个主技能 + 多个EX被动技能，共7条成长线路
  // 职业特征：继承精神使者的精神之力，突破心灵壁垒，掌握意识本源之力，
  //           以精神操控和心灵冲击碾压敌人意识，以心灵感应庇护全队
  mind_master: {
    /**
     * Q技能 - 心灵感应
     * 群体BUFF技能：开启心灵感应场域，持续期间提升全队魔法防御和法术闪避率
     * 一阶强化（心灵感应EX1）额外提升全队物理防御；二阶强化（心灵感应EX2）额外提升全队法术暴击伤害
     * 三阶强化（心灵感应EX3）额外提升全队攻击力
     * CD100秒，持续时间为CD一半（50秒）
     * 1级熟练度：魔法防御+2%，法术闪避率+2%
     * 5级熟练度：魔法防御+10%，法术闪避率+10%
     */
    Q: {
      id: 'mind_master_q',
      key: 'Q',
      name: '心灵感应',
      icon: '/pt/skill_icon/xinlingganying.png',
      audio: '/sound/PcSkillD-Guard.wav',
      description:
        '开启心灵感应场域庇护全队，持续期间提升全队魔法防御和法术闪避率；一阶强化额外提升全队物理防御，二阶强化进一步增加全队法术暴击伤害，三阶强化额外提升全队攻击力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 100,
      manaCost: 260,
      buffDuration: 50,
      isPartyBuff: true,
      unlockLevel: 175,
      growthLine: 'mind_resonance',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'mind_resonance_buff',
          magicDefense: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 心灵感应提供魔法防御和法术闪避率百分比加成
       * 若已学会心灵感应EX1（O技能），叠加物理防御百分比加成
       * 若已学会心灵感应EX2（O_EX2技能），叠加法术暴击伤害百分比加成
       * 若已学会心灵感应EX3（O_EX3技能），叠加攻击力百分比加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          magicDefense: {
            add: 2 * safeLevel,
            rate: true
          },
          spellEvasion: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 心灵感应EX1被动技能提供额外物理防御百分比加成
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.mind_master.O
            if (ex1Def && typeof ex1Def.getDefenseBonus === 'function') {
              result.defense = {
                add: ex1Def.getDefenseBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          console.log('[心灵感应] EX1检测异常:', e?.message || e)
        }

        // 心灵感应EX2被动技能提供额外法术暴击伤害百分比加成
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.mind_master.O_EX2
            if (ex2Def && typeof ex2Def.getCriticalDamageBonus === 'function') {
              result.criticalDamage = {
                add: ex2Def.getCriticalDamageBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 心灵感应EX2未解锁或未加载时不提供暴击伤害加成
        }

        // 心灵感应EX3被动技能提供额外攻击力百分比加成
        try {
          const ex3Skill = player?.skills?.['O_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.mind_master.O_EX3
            if (ex3Def && typeof ex3Def.getAttackBonus === 'function') {
              result.attack = {
                add: ex3Def.getAttackBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 心灵感应EX3未解锁或未加载时不提供攻击力加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：CD的一半（100秒CD / 2 = 50秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        return 50
      }
    },

    /**
     * O技能 - 心灵感应EX1-精神屏障（被动技能）
     * 增强心灵感应效果，持续期间额外提升全队物理防御
     * 1级即为最大熟练度，默认满级效果：+15%物理防御
     * 每次释放心灵感应（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'mind_master_o',
      key: 'O',
      name: '心灵感应EX1-精神屏障',
      icon: '/pt/skill_icon/xinlingganying.png',
      audio: '/sound/PcSkillD-Guard.wav',
      description: '被动技能：增强心灵感应，全队物理防御+15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'mind_resonance',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_resonance_defense',
          defense: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取心灵感应EX1提供的额外物理防御百分比加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外物理防御百分比加成（固定15）
       */
      getDefenseBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * O_EX2技能 - 心灵感应EX2-心灵共鸣（被动技能）
     * 增强心灵感应效果，持续期间额外提升全队法术暴击伤害
     * 1级即为最大熟练度，默认满级效果：+10%法术暴击伤害
     * 解锁等级：185级
     */
    O_EX2: {
      id: 'mind_master_o_ex2',
      key: 'O_EX2',
      name: '心灵感应EX2-心灵共鸣',
      icon: '/pt/skill_icon/xinlingganying.png',
      audio: '/sound/PcSkillD-Guard.wav',
      description: '被动技能：增强心灵感应，全队法术暴击伤害+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'mind_resonance',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_resonance_critical_damage',
          criticalDamage: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取心灵感应EX2提供的额外法术暴击伤害百分比加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外法术暴击伤害百分比加成（固定10）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX3技能 - 心灵感应EX3-精神统御（被动技能）
     * 增强心灵感应效果，持续期间额外提升全队攻击力
     * 1级即为最大熟练度，默认满级效果：+10%攻击力
     * 解锁等级：190级
     */
    O_EX3: {
      id: 'mind_master_o_ex3',
      key: 'O_EX3',
      name: '心灵感应EX3-精神统御',
      icon: '/pt/skill_icon/xinlingganying.png',
      audio: '/sound/PcSkillD-Guard.wav',
      description: '被动技能：增强心灵感应，全队攻击力+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_resonance',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_resonance_attack',
          attack: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取心灵感应EX3提供的额外攻击力百分比加成
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外攻击力百分比加成（固定10）
       */
      getAttackBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * W技能 - 星思坠寂
     * 单体无属性法术伤害技能：使目标如星辰般闪烁的万千思绪逐一坠落，归于死寂
     * 精神冲击穿透识海，造成高额精神伤害，并短暂延迟目标的意识反应
     * 基础伤害1200，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+3000
* 智力加成：每点智力提供9点伤害
* CD减少由星思坠寂EX1被动技能提供（175级解锁）
* 伤害增加由星思坠寂EX2被动技能提供（185级解锁）
* 精神连击由星思坠寂EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'mind_master_w',
      key: 'W',
      name: '星思坠寂',
      icon: '/pt/skill_icon/xingsizhuiji.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description:
        '使目标如星辰般闪烁的万千思绪逐一坠落，归于死寂。精神冲击穿透识海，造成高额精神伤害，并短暂延迟目标的意识反应。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 1200,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      growthLine: 'mind_tear',

      // 击晕DEBUFF：按熟练度概率触发眩晕2秒
      // 1级5%，每级+5%，5级25%
      debuff: {
        type: 'stun',
        chance: 0,
        effect: {
          type: 'stun',
          icon: '/pt/UI/stun_stars.svg',
          duration: 2
        }
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 200,
          increment: (3000 - 200) / 4
        }
      },

      /**
       * 计算击晕触发概率（基于熟练度等级）
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 击晕概率百分比
       */
      calculateDebuffChance(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 5 * safeLevel
      },

      /**
       * 伤害计算（智力型单体法术伤害）
       * 公式: 基础伤害(1200) + 熟练度伤害(1级+200,5级+3000) + 智力×9 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 200 + ((3000 - 200) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 9
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * W_EX技能 - 星思坠寂EX1-CD减少（被动技能）
     * 增强星思坠寂，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少星思坠寂技能CD 50%
     */
    W_EX: {
      id: 'mind_master_w_ex',
      key: 'W_EX',
      name: '星思坠寂EX1-CD减少',
      icon: '/pt/skill_icon/xingsizhuiji.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：减少星思坠寂冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'mind_tear',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_tear_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取星思坠寂CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 星思坠寂EX2-伤害增加（被动技能）
     * 增强星思坠寂，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加星思坠寂技能伤害 50%
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'mind_master_w_ex2',
      key: 'W_EX2',
      name: '星思坠寂EX2-伤害增加',
      icon: '/pt/skill_icon/xingsizhuiji.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增加星思坠寂技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'mind_tear',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_tear_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取星思坠寂伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 星思坠寂EX3-精神连击（被动技能）
     * 增强星思坠寂，概率触发精神连击
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率造成2倍伤害
     *   20%概率造成3倍伤害
     *   10%概率造成4倍伤害
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'mind_master_w_ex3',
      key: 'W_EX3',
      name: '星思坠寂EX3-精神连击',
      icon: '/pt/skill_icon/xingsizhuiji.png',
      audio: '/sound/PcSkillD-Spritbomb.wav',
      description: '被动技能：增强星思坠寂，概率触发精神连击。30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成4倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_tear',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_tear_critical_multiplier',
          criticalMultiplier: {
            chance2x: 30,
            chance3x: 20,
            chance4x: 10
          }
        }
      },

      /**
       * 获取精神连击触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance2x, chance3x, chance4x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance2x: 30,
          chance3x: 20,
          chance4x: 10
        }
      }
    },

    /**
     * E技能 - 意识崩塌
     * AOE DEBUFF技能：释放精神冲击波，对范围内敌人造成精神伤害并施加「意识混乱」DEBUFF
     * 印记期间目标攻击力大幅降低，受到的伤害增加
     * 1级熟练度：伤害+150，目标攻击力-30%，受到伤害+20%
     * 5级熟练度：伤害+1000，目标攻击力-30%，受到伤害+20%
     * 基础CD 120秒，DEBUFF持续时间为CD的一半（60秒）
     * 解锁EX1后CD 60秒，DEBUFF持续时间30秒
     * CD减少由意识崩塌EX1被动技能提供（175级解锁）
     * 伤害增加由意识崩塌EX2被动技能提供（185级解锁）
     * 精神虚弱增强由意识崩塌EX3被动技能提供（190级解锁）
     */
    E: {
      id: 'mind_master_e',
      key: 'E',
      name: '意识崩塌',
      icon: '/pt/skill_icon/yishibengta.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description:
        '释放精神冲击波对范围内敌人造成毁灭性精神伤害。受击目标附上「意识混乱」，持续时间为CD的一半，期间目标攻击力降低30%，受到伤害增加20%。解锁EX1后CD与DEBUFF持续时间均减半。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 500,
      cd: 120,
      manaCost: 200,
      duration: 60,
      unlockLevel: 170,
      growthLine: 'consciousness_collapse',

      // DEBUFF配置：意识混乱（攻击力降低 + 受到伤害增加）
      debuff: {
        type: 'mindConfusion',
        chance: 100,
        effect: {
          type: 'mindConfusion',
          icon: '/pt/skill_icon/yishibengta.png',
          baseDuration: 60,
          /**
           * 获取攻击力降低百分比（固定30%）
           * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回30）
           * @returns {number} 攻击力降低百分比
           */
          getValue(skillLevel) {
            return 30
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算（智力型AOE精神伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 智力×5.18 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 5.18
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + intDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（攻击力降低30%，受到伤害增加20%）
       * 持续时间：动态计算为有效CD的一半，解锁EX1后CD减半，持续时间同步减半
       * 基础CD 120秒 → 持续 60秒
       * 解锁EX1后CD 60秒 → 持续 30秒
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定效果）
       * @param {Object} [player] - 玩家对象，用于判断EX1解锁状态
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        const baseCd = Number(this?.cd) || 120
        let effectiveCd = baseCd
        if (player && isSkillUnlocked(player, 'mind_master', 'E_EX1')) {
          const ex1Skill = getSkill('mind_master', 'E_EX1')
          let reduction = 50
          if (ex1Skill && typeof ex1Skill.getCdReduction === 'function') {
            reduction = ex1Skill.getCdReduction(1)
          }
          effectiveCd = baseCd * (1 - reduction / 100)
        }
        const duration = Math.floor(effectiveCd / 2)
        return {
          attackReduction: 30,
          damageIncrease: 20,
          duration
        }
      }
    },

    /**
     * E_EX1技能 - 意识崩塌EX1-CD减少（被动技能）
     * 增强意识崩塌，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少意识崩塌技能CD 50%
     * 基础CD 120秒 → 解锁后CD 60秒，DEBUFF持续时间同步减半（60秒→30秒）
     */
    E_EX1: {
      id: 'mind_master_e_ex1',
      key: 'E_EX1',
      name: '意识崩塌EX1-CD减少',
      icon: '/pt/skill_icon/yishibengta.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：减少意识崩塌冷却时间50%，DEBUFF持续时间同步减半。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'consciousness_collapse',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'consciousness_collapse_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取意识崩塌CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 意识崩塌EX2-伤害增加（被动技能）
     * 增强意识崩塌，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加意识崩塌技能伤害 50%
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'mind_master_e_ex2',
      key: 'E_EX2',
      name: '意识崩塌EX2-伤害增加',
      icon: '/pt/skill_icon/yishibengta.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：增加意识崩塌技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'consciousness_collapse',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'consciousness_collapse_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取意识崩塌伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX3技能 - 意识崩塌EX3-精神虚弱强化（被动技能）
     * 增强意识崩塌，当目标有意识混乱DEBUFF时，受到的伤害额外增加
     * 1级即为最大熟练度，默认满级效果：受到伤害额外增加20%
     * 解锁等级：190级
     */
    E_EX3: {
      id: 'mind_master_e_ex3',
      key: 'E_EX3',
      name: '意识崩塌EX3-精神虚弱强化',
      icon: '/pt/skill_icon/yishibengta.png',
      audio: '/sound/PcSkillM-Elemaster.wav',
      description: '被动技能：意识崩塌DEBUFF持续期间，目标受到的伤害额外增加20%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'consciousness_collapse',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'consciousness_collapse_vulnerability_boost',
          vulnerabilityBonus: {
            base: 20,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取意识崩塌EX3提供的精神虚弱额外增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 精神虚弱额外增加百分比（固定20）
       */
      getVulnerabilityBonus(skillLevel = 1) {
        return 20
      }
    },

    /**
     * U技能 - 万绪沉宵
     * AOE无属性法术伤害技能：引无边幽夜笼罩一片区域，将范围内诸多敌人的思绪一同沉入永夜
     * 对多名目标造成精神侵蚀，并使其陷入短暂的意志低迷
     * 基础伤害800，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
* 智力加成：每点智力提供7.5点伤害
* CD减少由万绪沉宵EX1被动技能提供（175级解锁）
     * 伤害增加由万绪沉宵EX2被动技能提供（185级解锁）
     * 多段攻击由万绪沉宵EX3被动技能提供（190级解锁）
     */
    U: {
      id: 'mind_master_u',
      key: 'U',
      name: '万绪沉宵',
      icon: '/pt/skill_icon/wanxuchenxiao.png',
      audio: '/sound/PcSkillM-Psysquare.wav',
      description:
        '引无边幽夜笼罩一片区域，将范围内诸多敌人的思绪一同沉入永夜。对多名目标造成精神侵蚀，并使其陷入短暂的意志低迷。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 800,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      growthLine: 'mind_nova',

      // 击晕DEBUFF：按熟练度概率触发眩晕2秒
      // 1级5%，每级+5%，5级25%
      debuff: {
        type: 'stun',
        chance: 0,
        effect: {
          type: 'stun',
          icon: '/pt/UI/stun_stars.svg',
          duration: 2
        }
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 计算击晕触发概率（基于熟练度等级）
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 击晕概率百分比
       */
      calculateDebuffChance(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 5 * safeLevel
      },

      /**
       * 伤害计算（智力型AOE精神伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 智力×7.5 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        const intelligence = Number(player?.stats?.intelligence || 0)
        const intDamage = intelligence * 7.5
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + intDamage + attack * 0.3)
      }
    },

    /**
     * U_EX1技能 - 万绪沉宵EX1-CD减少（被动技能）
     * 增强万绪沉宵，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少万绪沉宵技能CD 50%
     */
    U_EX1: {
      id: 'mind_master_u_ex1',
      key: 'U_EX1',
      name: '万绪沉宵EX1-CD减少',
      icon: '/pt/skill_icon/wanxuchenxiao.png',
      audio: '/sound/PcSkillM-Psysquare.wav',
      description: '被动技能：减少万绪沉宵冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'mind_nova',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_nova_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取万绪沉宵CD减少百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 万绪沉宵EX2-伤害增加（被动技能）
     * 增强万绪沉宵，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加万绪沉宵技能伤害 50%
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'mind_master_u_ex2',
      key: 'U_EX2',
      name: '万绪沉宵EX2-伤害增加',
      icon: '/pt/skill_icon/wanxuchenxiao.png',
      audio: '/sound/PcSkillM-Psysquare.wav',
      description: '被动技能：增加万绪沉宵技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'mind_nova',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_nova_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取万绪沉宵伤害增加百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX3技能 - 万绪沉宵EX3-心灵震荡（被动技能）
     * 增强万绪沉宵，概率触发多段攻击
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率触发1段攻击（额外造成1次伤害）
     *   20%概率触发2段攻击（额外造成2次伤害）
     *   10%概率触发3段攻击（额外造成3次伤害）
     * 解锁等级：190级
     */
    U_EX3: {
      id: 'mind_master_u_ex3',
      key: 'U_EX3',
      name: '万绪沉宵EX3-心灵震荡',
      icon: '/pt/skill_icon/wanxuchenxiao.png',
      audio: '/sound/PcSkillM-Psysquare.wav',
      description: '被动技能：增强万绪沉宵，概率触发多段攻击。30%概率触发1段攻击（额外1次伤害），20%概率触发2段攻击（额外2次伤害），10%概率触发3段攻击（额外3次伤害）。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_nova',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_nova_multi_hit',
          multiHit: {
            chance1: 30,
            hits1: 1,
            chance2: 20,
            hits2: 2,
            chance3: 10,
            hits3: 3
          }
        }
      },

      /**
       * 获取多段攻击触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 多段攻击概率配置 { chance1, hits1, chance2, hits2, chance3, hits3 }
       */
      getMultiHitChance(skillLevel = 1) {
        return {
          chance1: 30,
          hits1: 1,
          chance2: 20,
          hits2: 2,
          chance3: 10,
          hits3: 3
        }
      }
    },

    /**
 * I技能 - 星念凝徽（被动技能）
 * 将散落如星的意念凝为自身徽记，提升所有心灵技能伤害并强化精神暴击概率
 * 1级熟练度：技能伤害+6%，暴击率+3%
 * 5级熟练度：技能伤害+30%，暴击率+15%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'mind_master_i',
      key: 'I',
      name: '星念凝徽',
      icon: '/pt/skill_icon/xingnianninghui.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '将散落如星的意念凝为自身徽记，使心灵师的精神攻击获得更稳定的穿透轨迹。提升所有心灵技能伤害，并小幅强化精神暴击概率。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      growthLine: 'mind_mastery',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'mind_mastery_attack',
          skillDamageBonus: {
            base: 6,
            increment: 6,
            rate: true
          },
          critRateBonus: {
            base: 3,
            increment: 3,
            rate: true
          }
        }
      },

      /**
       * 获取技能伤害加成百分比
       * 1级6%，每级+6%，5级30%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 技能伤害加成百分比（0-30）
       */
      getSkillDamageBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 6 * safeLevel
      },

      /**
       * 获取暴击率加成百分比
       * 1级3%，每级+3%，5级15%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 暴击率加成百分比（0-15）
       */
      getCritRateBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 3 * safeLevel
      }
    },

    /**
     * I_EX1技能 - 星念凝徽EX1-暴击强化（被动技能）
     * 增强星念凝徽，增加暴击伤害
     * 1级即为最大熟练度，默认满级效果：暴击伤害+10%
     * 解锁等级：170级
     */
    I_EX1: {
      id: 'mind_master_i_ex1',
      key: 'I_EX1',
      name: '星念凝徽EX1-暴击强化',
      icon: '/pt/skill_icon/xingnianninghui.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加暴击伤害10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 170,
      growthLine: 'mind_mastery',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_mastery_ex1',
          critDamageBonus: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暴击伤害加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 暴击伤害加成百分比（固定10）
       */
      getCritDamageBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * I_EX2技能 - 星念凝徽EX2-精神壁垒（被动技能）
     * 增强星念凝徽，增加法术防御
     * 1级即为最大熟练度，默认满级效果：法术防御+25%
     * 解锁等级：180级
     */
    I_EX2: {
      id: 'mind_master_i_ex2',
      key: 'I_EX2',
      name: '星念凝徽EX2-精神壁垒',
      icon: '/pt/skill_icon/xingnianninghui.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加法术防御25%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'mind_mastery',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_mastery_ex2',
          magicDefenseBonus: {
            base: 25,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取法术防御加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 法术防御加成百分比（固定25）
       */
      getMagicDefenseBonus(skillLevel = 1) {
        return 25
      }
    },

    /**
 * I_EX3技能 - 星念凝徽EX3-精神回复（被动技能）
 * 增强星念凝徽，受到伤害时概率触发精神回复MP，并增加最大MP
 * 1级即为最大熟练度，默认满级效果：
 *   最大MP+30%
 *   30%概率回复10%伤害为MP
 *   20%概率回复20%伤害为MP
 *   10%概率回复30%伤害为MP
 * 解锁等级：190级
 */
    I_EX3: {
      id: 'mind_master_i_ex3',
      key: 'I_EX3',
      name: '星念凝徽EX3-精神回复',
      icon: '/pt/skill_icon/xingnianninghui.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '被动技能：增加最大MP30%。受到伤害时概率触发精神回复，将伤害转化为MP。30%概率回复10%伤害，20%概率回复20%伤害，10%概率回复30%伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_mastery',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_mastery_ex3',
          maxMpBonus: {
            base: 30,
            increment: 0,
            rate: true
          },
          manaRecovery: {
            tiers: [
              { chance: 30, recovery: 10 },
              { chance: 20, recovery: 20 },
              { chance: 10, recovery: 30 }
            ]
          }
        }
      },

      /**
       * 获取最大MP加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 最大MP加成百分比（固定30）
       */
      getMaxMpBonus(skillLevel = 1) {
        return 30
      },

      /**
       * 获取精神回复触发信息
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object|null} 回复配置对象，包含 tiers 数组
       */
      getManaRecovery(skillLevel = 1) {
        return {
          tiers: [
            { chance: 30, recovery: 10 },
            { chance: 20, recovery: 20 },
            { chance: 10, recovery: 30 }
          ]
        }
      },

      /**
       * 随机摇取精神回复比例
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 回复百分比（0表示未触发，10/20/30表示触发对应回复）
       */
      rollManaRecovery(skillLevel = 1) {
        const config = this.getManaRecovery(skillLevel)
        if (!config || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          return 0
        }
        for (const tier of config.tiers) {
          if (Math.random() * 100 < tier.chance) {
            return tier.recovery
          }
        }
        return 0
      }
    },

/**
 * J技能 - 碎思归墟（被动技能）
 * 获得心灵之力-充能积累，每次普通攻击或释放技能增加一点充能值，最高10点
 * 第10次普通攻击附加最大MP百分比的额外精神伤害，然后重置充能值
 * MP:30（每次普通攻击减少30点MP，增加一个充能值）
 * 1级熟练度：第10次普通攻击附加最大MP10%的伤害
 * 10级熟练度：第10次普通攻击附加最大MP100%的伤害
 * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
 */
    J: {
      id: 'mind_master_j',
      key: 'J',
      name: '碎思归墟',
      icon: '/pt/skill_icon/suisiguixu.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description:
        '将周遭散落、碎裂的意念尽数牵引至识海归墟，快速积蓄心灵能量。每次普通攻击或释放技能增加一点充能值，最高10点，达到触发阈值时附加最大MP百分比的额外精神伤害，然后重置充能值。每次普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      growthLine: 'mind_charge',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'mind_charge_bonus',
          mpPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

/**
 * 获取碎思归墟附加最大MP百分比
 * 1级10%，每级+10%，10级100%
 * @param {number} skillLevel - 技能熟练度等级
 * @returns {number} MP附加百分比（10-100）
 */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

/**
 * 获取碎思归墟触发阈值（基础值，未考虑EX1减少）
 * @returns {number} 触发阈值（固定10）
 */
      getBaseTriggerCount() {
        return 10
      },

/**
 * 获取碎思归墟每次攻击MP消耗
 * @returns {number} MP消耗值（固定30）
 */
      getMpCostPerAttack() {
        return 30
      }
    },

/**
 * J_EX1技能 - 碎思归墟EX1-减少触发次数（被动技能）
 * 增强碎思归墟，减少普通攻击附加伤害的次数-50%
 * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
 */
    J_EX1: {
      id: 'mind_master_j_ex1',
      key: 'J_EX1',
      name: '碎思归墟EX1-减少触发次数',
      icon: '/pt/skill_icon/suisiguixu.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '增强碎思归墟，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'mind_charge',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_charge_trigger_reduction',
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

/**
 * 获取碎思归墟触发次数减少百分比
 * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
 * @returns {number} 触发次数减少百分比（固定50）
 */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

/**
 * J_EX2技能 - 碎思归墟EX2-心灵连锁（被动技能）
 * 增强碎思归墟，在EX1触发次数阈值时概率触发心灵连锁
 * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
 * 1级即为最大熟练度，默认满级效果：
 *   第5次（基于EX1次数）普通攻击/技能释放 30%概率附加200%最大MP
 *   第5次普通攻击/技能释放 20%概率附加300%最大MP
 *   第5次普通攻击/技能释放 10%概率附加400%最大MP
 */
    J_EX2: {
      id: 'mind_master_j_ex2',
      key: 'J_EX2',
      name: '碎思归墟EX2-心灵连锁',
      icon: '/pt/skill_icon/suisiguixu.png',
      audio: '/sound/PcSkillL-nomalmagic.wav',
      description: '增强碎思归墟，在EX1触发次数时概率触发心灵连锁（30%概率200%最大MP、20%概率300%最大MP、10%概率400%最大MP）。需先解锁碎思归墟EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_charge',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_charge_multi_attack',
          multiAttack: {
            chance1: 30,
            bonus1: 200,
            chance2: 20,
            bonus2: 300,
            chance3: 10,
            bonus3: 400
          }
        }
      },

/**
 * 获取碎思归墟EX2心灵连锁触发信息
 * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
 * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
 */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 30,
          bonus1: 200,
          chance2: 20,
          bonus2: 300,
          chance3: 10,
          bonus3: 400
        }
      }
    },

    /**
     * R技能 - 心灵觉醒
     * 自身BUFF技能：释放心灵之力觉醒，进入「心灵觉醒」状态
     * 持续期间大幅提升自身魔法防御力和攻击力
     * 基础持续时间30秒（CD的一半）
     * 1级熟练度：魔法防御+5%，攻击力+5%
     * 5级熟练度：魔法防御+20%，攻击力+20%
     * 精神护盾由心灵觉醒EX1被动技能提供（175级解锁）
     * 暴击伤害和全元素抗性加成由心灵觉醒EX2被动技能提供（180级解锁）
     * 法术反弹由心灵觉醒EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'mind_master_r',
      key: 'R',
      name: '心灵觉醒',
      icon: '/pt/skill_icon/xinlingjuexing.png',
      audio: '/sound/PcSkillD-Iceshark.wav',
      description:
        '心灵师核心爆发技能，释放心灵之力觉醒，进入心灵觉醒状态，持续期间大幅提升自身魔法防御力和攻击力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 60,
      manaCost: 230,
      buffDuration: 30,
      isTeamBuff: false,
      unlockLevel: 170,
      growthLine: 'mind_awakening',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'mind_awakening_buff',
          magicDefense: {
            base: 5,
            increment: 3.75,
            rate: true
          },
          attack: {
            base: 5,
            increment: 3.75,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 心灵觉醒提供魔法防御力和攻击力加成
       * 若已学会心灵觉醒EX1（R_EX1技能），叠加精神护盾效果
       * 若已学会心灵觉醒EX2（R_EX2技能），叠加暴击伤害和全元素抗性加成
       * 若已学会心灵觉醒EX3（R_EX3技能），叠加法术反弹效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          magicDefense: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          },
          attack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          }
        }

        // 心灵觉醒EX1被动技能提供精神护盾效果
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.mind_master.R_EX1
            if (ex1Def && typeof ex1Def.getMindShieldPercent === 'function') {
              result.mindShield = {
                add: ex1Def.getMindShieldPercent(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 心灵觉醒EX1未解锁或未加载时不提供精神护盾
        }

        // 心灵觉醒EX2被动技能提供暴击伤害和全元素抗性加成
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.mind_master.R_EX2
            if (ex2Def && typeof ex2Def.getCriticalDamageBonus === 'function') {
              result.criticalDamage = {
                add: ex2Def.getCriticalDamageBonus(ex2Level),
                rate: true
              }
            }
            if (ex2Def && typeof ex2Def.getAllElementResistanceBonus === 'function') {
              result.allElementResistance = {
                add: ex2Def.getAllElementResistanceBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 心灵觉醒EX2未解锁或未加载时不提供暴击伤害和全元素抗性加成
        }

        // 心灵觉醒EX3被动技能提供法术反弹效果
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.mind_master.R_EX3
            if (ex3Def && typeof ex3Def.getSpellReflectBonus === 'function') {
              result.spellReflect = {
                add: ex3Def.getSpellReflectBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 心灵觉醒EX3未解锁或未加载时不提供法术反弹
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础CD / 2（60/2=30秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseCd = SKILL_CONFIG.mind_master.R.cd || 60
        return Math.max(1, Math.ceil(baseCd / 2))
      }
    },

    /**
     * R_EX1技能 - 心灵觉醒EX1-精神护盾（被动技能）
     * 增强心灵觉醒，释放期间获得精神护盾，受到伤害优先扣MP
     * 1级即为最大熟练度，默认满级效果：精神护盾吸收25%伤害
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'mind_master_r_ex1',
      key: 'R_EX1',
      name: '心灵觉醒EX1-精神护盾',
      icon: '/pt/skill_icon/xinlingjuexing.png',
      audio: '/sound/PcSkillD-Iceshark.wav',
      description: '被动技能：心灵觉醒持续期间，获得精神护盾，受到伤害的25%优先扣除MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'mind_awakening',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_awakening_mind_shield',
          mindShield: {
            base: 25,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取精神护盾吸收伤害百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 精神护盾吸收百分比（固定25）
       */
      getMindShieldPercent(skillLevel = 1) {
        return 25
      }
    },

    /**
     * R_EX2技能 - 心灵觉醒EX2-心灵共振（被动技能）
     * 增强心灵觉醒，释放期间获得暴击伤害加成和全元素抗性加成
     * 1级即为最大熟练度，默认满级效果：暴击伤害+25%，全元素抗性+15%
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'mind_master_r_ex2',
      key: 'R_EX2',
      name: '心灵觉醒EX2-心灵共振',
      icon: '/pt/skill_icon/xinlingjuexing.png',
      audio: '/sound/PcSkillD-Iceshark.wav',
      description: '被动技能：心灵觉醒持续期间，暴击伤害+25%，全元素抗性+15%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'mind_awakening',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_awakening_ex2',
          criticalDamageBonus: {
            base: 25,
            increment: 0,
            rate: true
          },
          allElementResistanceBonus: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暴击伤害加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 暴击伤害加成百分比（固定25）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 25
      },

      /**
       * 获取全元素抗性加成百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 全元素抗性加成百分比（固定15）
       */
      getAllElementResistanceBonus(skillLevel = 1) {
        return 15
      }
    },

    /**
     * R_EX3技能 - 心灵觉醒EX3-精神反射（被动技能）
     * 增强心灵觉醒，释放期间获得法术反射效果
     * 1级即为最大熟练度，默认满级效果：反射20%法术伤害
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'mind_master_r_ex3',
      key: 'R_EX3',
      name: '心灵觉醒EX3-精神反射',
      icon: '/pt/skill_icon/xinlingjuexing.png',
      audio: '/sound/PcSkillD-Iceshark.wav',
      description: '被动技能：心灵觉醒持续期间，反射20%法术伤害给攻击者。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'mind_awakening',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'mind_awakening_ex3',
          spellReflect: {
            base: 20,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取法术反射百分比
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 法术反射百分比（固定20）
       */
      getSpellReflectBonus(skillLevel = 1) {
        return 20
      }
    }
  },

  // ========== 爆裂射手技能 ==========
  fierce_shooter: {
    /**
     * Q技能 - 鹰眼
     * 群体BUFF技能：召唤神鹰，持续期间提升所有队员的暴击率
     * 基础持续时间1分钟，每10点敏捷+1秒
     * 1级熟练度：+1%暴击率
     * 5级熟练度：+5%暴击率
     * 暴击伤害加成由鹰眼EX被动技能提供（180级解锁）
     */
    Q: {
      id: 'fierce_shooter_q',
      key: 'Q',
      name: '鹰眼',
      icon: '/pt/skill_icon/headshot.png',
      audio: '/sound/ItemChrWAngel.wav',
      description:
        '召唤神鹰，持续期间提升所有队员的暴击率。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 15,
      manaCost: 200,
      // 基础持续时间 1分钟 = 60秒，每10点敏捷+1秒
      buffDuration: 60,
      // 标记为群体BUFF，适用于全体队员
      isPartyBuff: true,
      unlockLevel: 175,
      // 成长线路：鹰眼系列技能（鹰眼→鹰眼EX）
      growthLine: 'eagle_eye',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'eagle_eye_buff',
          // 暴击率加成 - 1级1%，每级+1%，5级5%
          criticalRate: {
            base: 1,
            increment: 1,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 鹰眼本身只提供暴击率加成；暴击伤害加成由鹰眼EX被动技能提供
       * 释放鹰眼时若玩家已学会鹰眼EX，则将鹰眼EX的暴击伤害加成叠加到 buff 效果中
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 criticalRate，可选 criticalDamage）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          // 暴击率百分比加成：1% * 技能等级
          criticalRate: 1 * safeLevel
        }

        // 鹰眼EX被动技能提供额外暴击伤害加成
        // 从 player.skills.O 读取鹰眼EX的熟练度等级
        try {
          const eagleExSkill = player?.skills?.O
          const eagleExLevel = Number(
            eagleExSkill?.proficiencyLevel ??
            (eagleExSkill?.proficiency && typeof eagleExSkill.proficiency === 'object'
              ? eagleExSkill.proficiency.level
              : undefined) ??
            eagleExSkill?.level ?? 0
          )
          if (eagleExLevel > 0) {
            const eagleExDef = SKILL_CONFIG.fierce_shooter.O
            if (eagleExDef && typeof eagleExDef.getCriticalDamageBonus === 'function') {
              // 使用对象格式 { add, rate: true } 确保被识别为百分比加成
              // 鹰眼 proficiency.effect 中已移除 criticalDamage 配置，
              // 若返回纯数字会被 applyBuffEffect 当作绝对值（1 = 100%）而非 1%
              result.criticalDamage = {
                add: eagleExDef.getCriticalDamageBonus(eagleExLevel),
                rate: true
              }
            }
          }
        } catch (e) {
          // 鹰眼EX未解锁或未加载时不提供暴击伤害
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 每10点敏捷+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        return 60 + Math.floor(agility / 10)
      }
    },

    /**
     * W技能 - 暴风连矢（被动技能）
     * 普通攻击有概率射出双重箭矢
     * 1级熟练度：5%概率触发两个箭矢
     * 5级熟练度：25%概率触发两个箭矢
     */
    W: {
      id: 'fierce_shooter_w',
      key: 'W',
      name: '暴风连矢',
      icon: '/pt/skill_icon/barrage.png',
      audio: null,
      description: '被动技能：普通攻击有概率射出双重箭矢，造成额外伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      // 成长线路：暴风连矢系列（暴风连矢→暴风连矢EX）
      growthLine: 'storm_arrows_w',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'double_arrow',
          // 双箭触发概率 - 1级5%，每级+5%，5级25%
          triggerChance: {
            base: 5,
            increment: 5
          }
        }
      },

      /**
       * 获取双箭触发概率（百分比）
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      getTriggerChance(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 5 * safeLevel
      }
    },

    /**
     * E技能 - 弱点射击
     * DEBUFF单体技能：向前方敌人发射穿刺箭矢，命中后施加【脆弱烙印】DEBUFF
     * 烙印期间目标受到所有来源伤害提升
     * 可同时标记多名敌人，重复命中仅刷新持续时间，不叠加增伤
     * 1级熟练度：+5%增伤
     * 5级熟练度：+15%增伤
     */
    E: {
      id: 'fierce_shooter_e',
      key: 'E',
      name: '弱点射击',
      icon: '/pt/skill_icon/devastatingsting.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description:
        '向前方敌人发射穿刺箭矢，精准刺穿敌人要害造成物理伤害；命中目标后施加【脆弱烙印】DEBUFF，持续15秒。烙印期间，该目标受到所有来源伤害提升。可同时标记多名敌人，重复命中仅刷新持续时间，不叠加增伤。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 150,
      cd: 30,
      manaCost: 180,
      duration: 15,
      unlockLevel: 170,
      // 成长线路：弱点射击系列技能单独成线，后续可扩展
      growthLine: 'weak_point',

      // DEBUFF配置：脆弱烙印
      debuff: {
        type: 'damageVulnerability',
        chance: 100, // 命中即施加，必定触发
        effect: {
          type: 'damageVulnerability',
          icon: '/pt/skill_icon/headshot.png',
          baseDuration: 15,
          /**
           * 根据熟练度等级计算伤害增加百分比
           * 1级: 5%，5级: 15%，每级增加2.5%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 伤害增加百分比
           */
          getValue(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 2.5 * (safeLevel - 1)
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: 150
        }
      },

      /**
       * 伤害计算
       * 公式: 熟练度伤害 + 敏捷 x 3 + 玩家攻击力 x 0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + 150 * (safeLevel - 1)
        const dexDamage = player.stats.dexterity * 3
        return Math.floor(proficiencyDamage + player.attack * 0.3 + dexDamage)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（伤害增加百分比）
       * 1级: 5%，5级: 15%，每级+2.5%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return {
          damageIncrease: 5 + 2.5 * (safeLevel - 1),
          duration: 15
        }
      }
    },

    /**
     * R技能 - 神鹰降临
     * Buff召唤技能：召唤神鹰真身降临，持续时间内无敌，自动攻击存活敌人
     * 神鹰属性（攻击间隔、攻击力、暴击率、暴击伤害、生命、魔法值）均按照熟练度等级百分比计算
     * 基础持续时间1分钟，每1点智力+1秒
     * 1级熟练度：神鹰获得玩家所有属性5%
     * 5级熟练度：神鹰获得玩家所有属性25%
     */
    R: {
      id: 'fierce_shooter_r',
      key: 'R',
      name: '神鹰降临',
      icon: '/pt/skill_icon/shenyingjianglin.png',
      audio: '/sound/ItemChrWAngel.wav',
      description: '召唤神鹰真身降临，持续时间内神鹰无敌，会自动攻击存活敌人。神鹰属性按照熟练度等级百分比计算。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 20,
      manaCost: 500,
      // 基础持续时间 1分钟 = 60秒，每1点智力+1秒
      buffDuration: 60,
      // 召唤物配置
      summon: {
        type: 'eagle',
        name: '神鹰',
        icon: '/pt/skill_icon/shenyingjianglin.png',
        // 神鹰无敌，不会受到伤害
        invincible: true,
        // 神鹰攻击间隔（毫秒）
        attackInterval: 1500,
        // 神鹰攻击范围（像素，覆盖所有存活敌人）
        attackRange: 9999
      },
      unlockLevel: 180,
      // 成长线路：神鹰降临进阶链（神鹰降临→神鹰EX→神鹰-寂灭龙卷风）
      growthLine: 'eagle_descent',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'eagle_summon',
          // 神鹰获得玩家属性百分比 - 1级5%，每级+5%，5级25%
          statRatio: {
            base: 5,
            increment: 5
          }
        }
      },

      /**
       * 计算神鹰获得玩家属性的百分比
       * 1级5%，每级+5%，5级25%
       * @param {number} skillLevel - 技能熟练度等级
       * @param {number} [eagleExBonus=0] - 神鹰EX被动技能提供的额外属性百分比加成
       * @returns {number} 属性百分比（0-100）
       */
      calculateStatRatio(skillLevel = 1, eagleExBonus = 0) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const safeBonus = Number.isFinite(eagleExBonus) && eagleExBonus > 0 ? eagleExBonus : 0
        return 5 * safeLevel + safeBonus
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 智力值（每1点智力+1秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const intelligence = player?.stats?.intelligence || 0
        return 60 + Math.floor(intelligence)
      },

      /**
       * 计算神鹰的属性值
       * 神鹰属性继承于召唤者（玩家）属性，按熟练度等级百分比计算
       * - 生命值 = 玩家最大生命 × 百分比
       * - 魔法值 = 玩家最大魔法 × 百分比
       * - 最小攻击力 = 玩家最小攻击力 × 百分比
       * - 最大攻击力 = 玩家最大攻击力 × 百分比
       * - 防御力 = 玩家平均防御力 × 百分比
       * - 暴击率 = 玩家暴击率 × 百分比
       * - 暴击伤害 = 1.0 + (玩家暴击伤害 - 1.0) × 百分比
       * - 攻击间隔 = 基础2000ms × (1 - 百分比)，等级越高攻击越快
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @param {number} [eagleExBonus=0] - 神鹰EX被动技能提供的额外属性百分比加成
       * @returns {Object} 神鹰属性对象，包含 maxHealth/maxMana/minAttack/maxAttack/defense/critRate/critDamage/attackInterval
       */
      calculateSummonStats(player, skillLevel = 1, eagleExBonus = 0) {
        const ratio = this.calculateStatRatio(skillLevel, eagleExBonus) / 100
        // 玩家暴击率（小数形式，1.0 = 100%）
        const playerCritRate = Number(player?.criticalRate) || 0.05
        // 玩家暴击伤害倍率（如 1.5 = 暴击时伤害×1.5）
        const playerCritDamage = Number(player?.criticalDamage) || 1.5
        // 玩家最小/最大攻击力
        const playerMinAttack = Number(player?.minAttack) || 0
        const playerMaxAttack = Number(player?.maxAttack) || 0
        // 玩家最小/最大防御力，取平均值作为防御力
        const playerMinDefense = Number(player?.minDefense) || 0
        const playerMaxDefense = Number(player?.maxDefense) || 0
        return {
          maxHealth: Math.floor((player?.maxHealth || 0) * ratio),
          maxMana: Math.floor((player?.maxMana || 0) * ratio),
          minAttack: Math.floor(playerMinAttack * ratio),
          maxAttack: Math.floor(playerMaxAttack * ratio),
          defense: Math.floor(((playerMinDefense + playerMaxDefense) / 2) * ratio),
          // 暴击率 = 玩家暴击率 × 百分比
          critRate: Math.min(1, playerCritRate * ratio),
          // 暴击伤害 = 1.0 + (玩家暴击伤害 - 1.0) × 百分比
          critDamage: 1.0 + (playerCritDamage - 1.0) * ratio,
          // 攻击间隔 = 基础2000ms × (1 - 百分比)，最低500ms
          attackInterval: Math.max(500, Math.floor(2000 * (1 - ratio)))
        }
      }
    },

    /**
     * T技能 - 神鹰-寂灭龙卷风
     * AOE风系大招：神鹰降临（R技能）的后续进阶技能
     * 召唤九霄神鹰俯冲现世，双翼卷起灭世龙卷风，将范围内敌人强行卷入风暴中心持续撕裂
     * 风暴结束时神鹰化作金光俯冲轰击，对残留目标造成寂灭一击
     * 1级熟练度：基础伤害500
     * 5级熟练度：基础伤害1500
     */
    T: {
      id: 'fierce_shooter_t',
      key: 'T',
      name: '神鹰-寂灭龙卷风',
      icon: '/pt/skill_icon/shenyingjimielongjuanfeng.png',
      audio: '/sound/Chaos.wav',
      description:
        '召唤九霄神鹰俯冲现世，鹰啸之声震碎苍穹，双翼卷起灭世龙卷风，将范围内敌人强行卷入风暴中心，持续撕裂并造成巨额风系伤害。风暴结束时，神鹰化作一道金光俯冲轰击，对残留目标造成寂灭一击。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WIND,
      damage: 500,
      cd: 30,
      manaCost: 200,
      unlockLevel: 190,
      // 成长线路：神鹰降临进阶链（神鹰降临后续进阶）
      growthLine: 'eagle_descent',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 500,
          increment: 250
        }
      },

      /**
       * 伤害计算（风系巨额AOE伤害）
       * 公式: 熟练度伤害 + 敏捷 × 5 + 玩家平均攻击力 × 1.5
       * - 熟练度伤害：1级500，每级+250，5级1500
       * - 敏捷加成：每点敏捷提供5点风系伤害
       * - 攻击力加成：平均攻击力 × 1.5（大招倍率）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度基础伤害：500 + 250 × (等级-1)
        const proficiencyDamage = 500 + 250 * (safeLevel - 1)
        // 敏捷风系加成
        const agility = Number(player?.stats?.agility || player?.stats?.dexterity || 0)
        const agilityDamage = agility * 5
        // 平均攻击力加成（大招倍率1.5）
        const minAttack = Number(player?.minAttack || 0)
        const maxAttack = Number(player?.maxAttack || 0)
        const attackDamage = Math.floor(((minAttack + maxAttack) / 2) * 0.3)
        return proficiencyDamage + agilityDamage + attackDamage
      }
    },

    /**
     * Y技能 - 神鹰EX（被动技能）
     * 强化神鹰降临属性百分比效果
     * 每次召唤神鹰降临（R技能）时，该被动技能熟练度随之增加
     * 1级即为最大熟练度，默认满级效果：神鹰最大继承玩家属性百分比增加25%
     */
    Y: {
      id: 'fierce_shooter_y',
      key: 'Y',
      name: '神鹰EX',
      icon: '/pt/skill_icon/shenyingjianglin.png',
      audio: '/sound/ItemChrWAngel.wav',
      description: '被动技能：强化神鹰继承玩家最大百分比属性，使神鹰更加强大！',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：神鹰降临进阶链（神鹰降临强化）
      growthLine: 'eagle_descent',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'eagle_stat_boost',
          // 神鹰属性百分比加成 - 1级即为满级，固定25%（原5级熟练度效果）
          statRatioBonus: {
            base: 25,
            increment: 0
          }
        }
      },

      /**
       * 获取神鹰EX提供的额外属性百分比加成
       * 1级即为最大熟练度，固定返回25%（原5级熟练度效果）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外属性百分比加成（固定25）
       */
      getStatRatioBonus(skillLevel = 1) {
        return 25
      }
    },

    /**
     * U技能 - 暴风箭矢
     * AOE风系伤害技能：向天空聚集风暴之力汇聚成巨大的箭矢，射向敌人后爆炸造成巨额伤害
     * 基础伤害800，熟练度伤害1级+160、10级+1800
     * CD：12秒（可被暴风箭矢EX1被动减少50%）
     * 音效暂用箭雨音效
     */
    U: {
      id: 'fierce_shooter_u',
      key: 'U',
      name: '暴风箭矢',
      icon: '/pt/skill_icon/baofengjianshi.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description:
        '向天空聚集风暴之力汇聚成一个巨大的箭矢，射向敌人后发生爆炸，造成巨大伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WIND,
      damage: 800,
      cd: 12,
      manaCost: 200,
      unlockLevel: 166,
      // 成长线路：暴风箭矢系列（暴风箭矢→暴风箭矢EX1→暴风箭矢EX2）
      growthLine: 'storm_arrows_u',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          base: 160,
          // 每级增量：(1800 - 160) / 9 ≈ 182.22，确保1级+160、10级+1800
          increment: (1800 - 160) / 9
        }
      },

      /**
       * 伤害计算（风系AOE伤害）
       * 公式: 基础伤害 + 熟练度伤害 + 敏捷 × 8.8 + 玩家攻击力 × 0.3
       * - 基础伤害：800
       * - 熟练度伤害：1级+160，10级+1800，线性增长（9级跨度）
       * - 敏捷加成：每点敏捷提供8.8点风系伤害
       * - 攻击力加成：玩家攻击力 × 0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        // 熟练度伤害：1级+160，10级+1800，线性增长（9级跨度）
        const proficiencyDamage = 160 + ((1800 - 160) / 9) * (safeLevel - 1)
        // 敏捷风系加成：每点敏捷提供8.8点风系伤害
        const agility = Number(player?.stats?.agility || player?.stats?.dexterity || 0)
        const agilityDamage = agility * 8.8
        // 攻击力加成
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + agilityDamage + attack * 0.3)
      }
    },

    /**
     * I技能 - 狂风连射
     * 单体风系伤害技能：引狂风之力凝于长弓，锁定单一目标后瞬间爆发密集连射
     * 无数道风凝箭矢裹挟旋刃贯穿敌躯，短时间内造成高额风系物理伤害
     * 风刃撕裂目标躯体造成流血效果（15秒内每秒受到技能总伤害30%的伤害）
     *
     * 基础伤害：888
     * CD：90秒，MP：233
     * 熟练度1级：伤害+200，箭矢+1
     * 熟练度10级：伤害+2000，箭矢+10
     * 每个箭矢伤害 = 基础伤害 + 熟练度伤害 + 敏捷×6.6
     * 箭矢数量 = 基础1 + 熟练度加成 + 每100点敏捷+1
     * 流血DOT：持续15秒，每秒造成技能总伤害30%的伤害
     */
    I: {
      id: 'fierce_shooter_i',
      key: 'I',
      name: '狂风连射',
      icon: '/pt/skill_icon/kuangfenglianshe.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description:
        '引狂风之力凝于长弓，锁定单一目标后瞬间爆发密集连射，无数道风凝箭矢裹挟旋刃贯穿敌躯，短时间内造成高额风系物理伤害。风刃撕裂目标躯体，造成持续流血效果。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.WIND,
      damage: 888,
      cd: 90,
      manaCost: 233,
      unlockLevel: 166,
      // 成长线路：狂风连射系列（狂风连射→狂风连射EX1→狂风连射EX2）
      growthLine: 'storm_arrows_i',
      // 多段连射标记：触发 SkillEffectService 的多箭矢伤害逻辑
      multiHit: {
        enabled: true,
        // 单次释放最大箭矢数上限，防止极端数值卡顿
        maxCount: 30
      },

      // 流血DOT配置：风刃撕裂目标躯体，持续造成伤害
      // 持续15秒，每秒造成技能总伤害30%的伤害（tickInterval=1秒）
      dotEffect: {
        name: '流血',
        duration: 15, // 持续15秒
        tickInterval: 1, // 每1秒触发一次
        damageRate: 0.3, // 每次tick造成技能总伤害30%
        canCrit: true
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+200，10级+2000，线性增长（9级跨度）
          base: 200,
          increment: 200
        }
      },

      /**
       * 计算单个箭矢伤害
       * 公式: 基础伤害(888) + 熟练度伤害(1级+200,10级+2000) + 敏捷×6.6
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 单个箭矢伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        // 熟练度伤害：1级+200，每级+200，10级+2000
        const proficiencyDamage = 200 + 200 * (safeLevel - 1)
        // 敏捷风系加成：每点敏捷提供6.6点风系伤害
        const agility = Number(player?.stats?.agility || player?.stats?.dexterity || 0)
        const agilityDamage = agility * 6.6
        return Math.floor(this.damage + proficiencyDamage + agilityDamage)
      },

      /**
       * 计算箭矢发射数量
       * 公式: 熟练度加成(1级=1,10级=10) + 每100点敏捷+1
       * 技能描述：1级熟练度箭矢+1，10级熟练度箭矢+10
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 箭矢发射数量
       */
      calculateArrowCount(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        // 熟练度加成（1级=1支，每级+1，10级=10支）
        const proficiencyArrows = safeLevel
        // 敏捷加成：每100点敏捷+1支
        const agility = Number(player?.stats?.agility || player?.stats?.dexterity || 0)
        const agilityArrows = Math.floor(agility / 100)
        // 限制最大数量，防止极端数值导致卡顿
        const maxCount = this.multiHit?.maxCount || 30
        return Math.min(maxCount, proficiencyArrows + agilityArrows)
      },

      /**
       * 计算流血DOT每秒伤害值
       * 流血持续15秒，每秒造成技能总伤害30%的伤害
       * @param {number} totalDamage - 技能总伤害（所有箭矢伤害之和）
       * @returns {number} 每秒流血伤害值
       */
      calculateBleedDamage(totalDamage = 0) {
        return Math.max(1, Math.floor(totalDamage * 0.3))
      }
    },

    /**
     * O技能 - 鹰眼EX（被动技能）
     * 强化鹰眼效果，增加暴击伤害增幅
     * 每次释放鹰眼（Q技能）时，该被动技能熟练度随之增加
     * 1级即为最大熟练度，默认满级效果：+5%暴击伤害（原5级熟练度效果）
     */
    O: {
      id: 'fierce_shooter_o',
      key: 'O',
      name: '鹰眼EX',
      icon: '/pt/skill_icon/headshot.png',
      audio: '/sound/ItemChrWAngel.wav',
      description: '被动技能：强化鹰眼效果，释放鹰眼时额外增加暴击伤害增幅。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      // 成长线路：鹰眼系列技能（鹰眼→鹰眼EX）
      growthLine: 'eagle_eye',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'eagle_eye_crit_damage',
          // 暴击伤害加成 - 1级即为满级，固定5%（原5级熟练度效果）
          criticalDamage: {
            base: 5,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取鹰眼EX提供的额外暴击伤害加成
       * 1级即为最大熟练度，固定返回5%（原5级熟练度效果）
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外暴击伤害百分比加成（固定5）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 5
      }
    },

    /**
     * P技能 - 武器精通-弓箭（被动技能）
     * 装备武器为弓箭时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
     * 1级熟练度：武器攻击力+10%
     * 5级熟练度：武器攻击力+50%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    P: {
      id: 'fierce_shooter_p',
      key: 'P',
      name: '武器精通-弓箭',
      icon: '/pt/skill_icon/gongjianjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：武器弓箭精通，装备武器为弓箭时增加武器基础攻击力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      // 成长线路：武器精通-弓箭系列（武器精通→武器精通EX）
      growthLine: 'weapon_mastery_bow',
      // 熟练度增长配置：普通攻击命中累计计数，达到阈值后增加1点熟练度
      // 达到最大熟练度后不再计数
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'bow_attack_mastery',
          // 武器攻击力百分比加成 - 1级10%，每级+10%，5级50%
          weaponAttackBonus: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取武器攻击力加成百分比
       * 1级10%，每级+10%，5级50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 武器攻击力加成百分比（0-50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 10 * safeLevel
      }
    },

    /**
     * P_EX技能 - 武器精通-弓箭EX（被动技能）
     * 增强武器精通-弓箭的武器攻击力加成上限
     * 1级即为最大熟练度，默认满级效果：增加武器精通-弓箭的武器攻击力加成50%
     */
    P_EX: {
      id: 'fierce_shooter_p_ex',
      key: 'P_EX',
      name: '武器精通-弓箭EX',
      icon: '/pt/skill_icon/gongjianjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增强武器精通-弓箭的武器伤害加成上限。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：武器精通-弓箭系列（武器精通→武器精通EX）
      growthLine: 'weapon_mastery_bow',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'bow_attack_mastery_ex',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定50%
          weaponAttackBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * P_EX2技能 - 武器精通-弓箭EX2（被动技能）
     * 增强武器基础伤害，进一步增加武器基础攻击力加成
     * 1级即为最大熟练度，默认满级效果：增加武器弓箭的基础攻击力加成100%
     * 技能图片、音效与武器精通-弓箭一致
     */
    P_EX2: {
      id: 'fierce_shooter_p_ex2',
      key: 'P_EX2',
      name: '武器精通-弓箭EX2',
      icon: '/pt/skill_icon/gongjianjingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增强武器基础伤害，增加武器弓箭的基础攻击力加成。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：武器精通-弓箭系列（武器精通→武器精通EX→武器精通EX2）
      growthLine: 'weapon_mastery_bow',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'bow_attack_mastery_ex2',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定100%
          weaponAttackBonus: {
            base: 100,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回100%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定100）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 100
      }
    },

    /**
     * W_EX技能 - 暴风连矢EX（被动技能）
     * 增强暴风连矢触发双倍箭矢的概率
     * 1级即为最大熟练度，默认满级效果：双箭触发概率+25%
     */
    W_EX: {
      id: 'fierce_shooter_w_ex',
      key: 'W_EX',
      name: '暴风连矢EX',
      icon: '/pt/skill_icon/barrage.png',
      audio: null,
      description: '被动技能：暴风连矢EX，增强触发双倍箭矢的概率。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：暴风连矢系列（暴风连矢→暴风连矢EX）
      growthLine: 'storm_arrows_w',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_arrows_ex',
          // 双箭触发概率额外加成 - 1级即为满级，固定+25%
          triggerChanceBonus: {
            base: 25,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暴风连矢EX提供的额外双箭触发概率加成
       * 1级即为最大熟练度，固定返回25%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外双箭触发概率加成（固定25）
       */
      getTriggerChanceBonus(skillLevel = 1) {
        return 25
      }
    },

    /**
     * U_EX1技能 - 暴风箭矢EX1-CD减少（被动技能）
     * 增强暴风箭矢，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少暴风箭矢技能CD 50%
     * 技能图片、音效与暴风箭矢一致
     */
    U_EX1: {
      id: 'fierce_shooter_u_ex1',
      key: 'U_EX1',
      name: '暴风箭矢EX1-CD减少',
      icon: '/pt/skill_icon/baofengjianshi.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '增强暴风箭矢，减少冷却时间。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：暴风箭矢系列（暴风箭矢→暴风箭矢EX1→暴风箭矢EX2）
      growthLine: 'storm_arrows_u',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_arrow_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暴风箭矢CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 暴风箭矢EX2-伤害增加（被动技能）
     * 增强暴风箭矢，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加暴风箭矢技能伤害 50%
     * 技能图片、音效与暴风箭矢一致
     */
    U_EX2: {
      id: 'fierce_shooter_u_ex2',
      key: 'U_EX2',
      name: '暴风箭矢EX2-伤害增加',
      icon: '/pt/skill_icon/baofengjianshi.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '增强暴风箭矢，增加技能伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：暴风箭矢系列（暴风箭矢→暴风箭矢EX1→暴风箭矢EX2）
      growthLine: 'storm_arrows_u',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_arrow_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暴风箭矢伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX1技能 - 狂风连射EX1-CD减少（被动技能）
     * 增强狂风连射，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少狂风连射技能CD 50%
     * 技能图片、音效与狂风连射一致
     */
    I_EX1: {
      id: 'fierce_shooter_i_ex1',
      key: 'I_EX1',
      name: '狂风连射EX1-CD减少',
      icon: '/pt/skill_icon/kuangfenglianshe.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '增强狂风连射，减少冷却时间。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：狂风连射系列（狂风连射→狂风连射EX1→狂风连射EX2）
      growthLine: 'storm_arrows_i',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'gale_rapid_fire_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风连射CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX2技能 - 狂风连射EX2-伤害增加（被动技能）
     * 增强狂风连射，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加狂风连射技能伤害 50%
     * 技能图片、音效与狂风连射一致
     */
    I_EX2: {
      id: 'fierce_shooter_i_ex2',
      key: 'I_EX2',
      name: '狂风连射EX2-伤害增加',
      icon: '/pt/skill_icon/kuangfenglianshe.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '增强狂风连射，增加技能伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：狂风连射系列（狂风连射→狂风连射EX1→狂风连射EX2）
      growthLine: 'storm_arrows_i',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'gale_rapid_fire_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风连射伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    }
  },

  // ========== 暗夜主宰技能 ==========
  // 三转职业：由暗杀者(assassin)进阶，高暴击、高闪避、高爆发的暗影刺客
  // 技能体系参照格斗宗师设计：5个主技能 + 多个EX被动技能，共6条成长线路
  joker_emperor: {
    /**
     * Q技能 - 暗影主宰领域
     * 群体BUFF技能：融入暗夜之力，大幅提升全队暴击率
     * 一阶强化（暗影主宰领域EX1）额外提升全队格挡率；二阶强化（暗影主宰领域EX2）额外提升全队攻击速度
     * 基础持续时间1分钟，每10点敏捷+1秒
     * 1级熟练度：暴击率+2%
     * 5级熟练度：暴击率+10%
     * 格挡率加成由暗影主宰领域EX1被动技能提供（180级解锁）
     * 攻击速度加成由暗影主宰领域EX2被动技能提供（190级解锁）
     */
    Q: {
      id: 'joker_emperor_q',
      key: 'Q',
      name: '暗影主宰领域',
      icon: '/pt/skill_icon/anyingzhuzailingyu.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description:
        '展开暗影主宰领域，大幅提升全队暴击率；一阶强化额外提升全队格挡率，二阶强化进一步增加全队攻击速度。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 15,
      manaCost: 260,
      // 基础持续时间 1分钟 = 60秒，每10点敏捷+1秒
      buffDuration: 60,
      // 标记为群体BUFF，适用于全体队员
      isPartyBuff: true,
      unlockLevel: 175,
      // 成长线路：暗影主宰领域系列技能（暗影主宰领域→暗影主宰领域EX1→暗影主宰领域EX2）
      growthLine: 'shadow_escape',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'shadow_escape_buff',
          // 暴击率百分比加成 - 1级2%，每级+2%，5级10%
          criticalRate: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 暗影主宰领域提供暴击率加成
       * 若已学会暗影主宰领域EX1（O技能），叠加格挡率百分比加成
       * 若已学会暗影主宰领域EX2（O_EX2技能），叠加攻击速度百分比加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 criticalRate，可选 blockRate、attackSpeed）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          // 暴击率百分比加成：2% * 技能等级
          criticalRate: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 暗影主宰领域EX1被动技能提供额外格挡率百分比加成
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.joker_emperor.O
            if (ex1Def && typeof ex1Def.getBlockRateBonus === 'function') {
              result.blockRate = {
                add: ex1Def.getBlockRateBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 暗影主宰领域EX1未解锁或未加载时不提供格挡率加成
          console.log('[暗影主宰领域] EX1检测异常:', e?.message || e)
        }

        // 暗影主宰领域EX2被动技能提供额外攻击速度百分比加成
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.joker_emperor.O_EX2
            if (ex2Def && typeof ex2Def.getAttackSpeedBonus === 'function') {
              result.attackSpeed = {
                add: ex2Def.getAttackSpeedBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 暗影主宰领域EX2未解锁或未加载时不提供攻击速度加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 每10点敏捷+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        return 60 + Math.floor(agility / 10)
      }
    },

    /**
     * W技能 - 暗影突袭
     * 单体敏捷伤害技能：化作暗影瞬移至目标身后，以飞轮斩出致命裂痕
     * 基础伤害1200，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+3000
     * 敏捷加成：每点敏捷提供8.8点伤害
     * CD减少由暗影突袭EX1被动技能提供（175级解锁）
     * 伤害增加由暗影突袭EX2被动技能提供（185级解锁）
     * 倍攻由暗影突袭EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'joker_emperor_w',
      key: 'W',
      name: '暗影突袭',
      icon: '/pt/skill_icon/anyingtuxi.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description:
        '化作暗影瞬移至目标身后，以暗影之力突袭致命弱点，造成高额物理伤害。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.NONE,
      damage: 1200,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      // 成长线路：暗影突袭系列（暗影突袭→暗影突袭EX1→暗影突袭EX2→暗影突袭EX3）
      growthLine: 'shadow_raze',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+200，5级+3000，线性增长（4级跨度）
          base: 200,
          increment: (3000 - 200) / 4
        }
      },

      /**
       * 伤害计算（敏捷型单体伤害）
       * 公式: 基础伤害(1200) + 熟练度伤害(1级+200,5级+3000) + 敏捷×8.8 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+200，5级+3000，线性增长（4级跨度）
        const proficiencyDamage = 200 + ((3000 - 200) / 4) * (safeLevel - 1)
        // 敏捷加成：每点敏捷提供8.8点伤害
        const agility = Number(player?.stats?.agility || 0)
        const agiDamage = agility * 8.8
        // 攻击力加成：玩家攻击力 × 0.3
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + agiDamage + attack * 0.3)
      }
    },

    /**
     * E技能 - 致命毒刃
     * 单体DEBUFF技能：飞轮淬以剧毒掷向敌人，命中造成物理伤害并施加「毒蚀」印记
     * 印记期间目标持续受到毒伤害，且承受所有伤害提升
     * 暗夜主宰攻击毒蚀目标时，额外提升暴击伤害
     * 1级熟练度：伤害+150，目标承受伤害+5%，暗夜主宰专属（暴击伤害+5%）
     * 5级熟练度：伤害+1000，目标承受伤害+20%，暗夜主宰专属（暴击伤害+25%）
     * DEBUFF持续时间为CD的一半（15秒）
     * CD减少由致命毒刃EX1被动技能提供（175级解锁）
     * 伤害增加由致命毒刃EX2被动技能提供（185级解锁）
     */
    E: {
      id: 'joker_emperor_e',
      key: 'E',
      name: '致命毒刃',
      icon: '/pt/skill_icon/zhimingduren.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description:
        '飞轮淬以剧毒掷向敌人，命中单体敌人造成物理伤害。受击目标附上「毒蚀」印记，持续CD一半的时间，承受所有伤害提升并持续受到毒伤害。暗夜主宰攻击印记目标时，额外提升暴击伤害。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.NONE,
      damage: 500,
      cd: 30,
      manaCost: 200,
      duration: 15,
      unlockLevel: 170,
      // 成长线路：致命毒刃系列技能单独成线，后续可扩展
      growthLine: 'deadly_poison',

      // DEBUFF配置：毒蚀印记（复用 damageVulnerability 机制 + 暴击伤害加成 + DOT毒伤害）
      debuff: {
        type: 'damageVulnerability',
        chance: 100, // 命中即施加，必定触发
        effect: {
          type: 'damageVulnerability',
          icon: '/pt/skill_icon/zhimingduren.png',
          baseDuration: 15,
          /**
           * 根据熟练度等级计算伤害增加百分比
           * 1级: 5%，5级: 20%，每级增加3.75%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 伤害增加百分比
           */
          getValue(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 3.75 * (safeLevel - 1)
          },
          /**
           * 根据熟练度等级计算暗夜主宰专属暴击伤害加成百分比
           * 1级: 5%，5级: 25%，每级增加5%
           * @param {number} skillLevel - 技能熟练度等级
           * @returns {number} 暴击伤害加成百分比
           */
          getCritDamageBonus(skillLevel) {
            const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
            return 5 + 5 * (safeLevel - 1)
          }
        }
      },

      // DOT毒伤害配置：毒蚀持续造成毒属性伤害
      dotEffect: {
        name: '毒蚀',
        duration: 15, // 持续15秒
        tickInterval: 1, // 每1秒触发一次
        damageRate: 0.2 // 每次tick造成技能基础伤害20%
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+150，5级+1000，线性增长（4级跨度）
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 敏捷 × 3 + 玩家攻击力 × 0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+150，5级+1000，线性增长（4级跨度）
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const agiDamage = player.stats.agility * 3
        return Math.floor(this.damage + proficiencyDamage + player.attack * 0.3 + agiDamage)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（伤害增加百分比 + 暴击伤害加成百分比）
       * 1级: 承受伤害+5%, 暴击伤害+5%
       * 5级: 承受伤害+20%, 暴击伤害+25%
       * @param {number} skillLevel - 技能熟练度等级
       * @param {Object} [player] - 玩家对象（保留参数以兼容调用签名）
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const damageIncrease = 5 + 3.75 * (safeLevel - 1)
        const critDamageBonus = 5 + 5 * (safeLevel - 1)

        return {
          damageIncrease,
          critDamageBonus,
          duration: 15
        }
      }
    },

    /**
     * U技能 - 暗影之刃
     * AOE敏捷伤害技能：召唤多个暗影分身，以飞轮对范围内敌人发动连环斩击
     * 基础伤害1200，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
     * 敏捷加成：每点敏捷提供8点伤害
     * CD减少由暗影之刃EX1被动技能提供（175级解锁）
     * 伤害增加由暗影之刃EX2被动技能提供（185级解锁）
     */
    U: {
      id: 'joker_emperor_u',
      key: 'U',
      name: '暗影之刃',
      icon: '/pt/skill_icon/anyingzhiren.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description:
        '凝聚暗影之力化为致命刃刃，对范围内敌人发动暗影斩击，造成巨大范围伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.NONE,
      damage: 800,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      // 成长线路：暗影之刃系列（暗影之刃→暗影之刃EX1→暗影之刃EX2）
      growthLine: 'phantom_dance',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          // 熟练度伤害：1级+180，5级+2200，线性增长（4级跨度）
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 伤害计算（敏捷型AOE伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 敏捷×8 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        // 熟练度伤害：1级+180，5级+2200，线性增长（4级跨度）
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        // 敏捷加成：每点敏捷提供8点伤害
        const agility = Number(player?.stats?.agility || 0)
        const agiDamage = agility * 8
        // 攻击力加成：玩家攻击力 × 0.3
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + agiDamage + attack * 0.3)
      }
    },

    /**
     * I技能 - 武器精通-飞轮（被动技能）
     * 装备武器为飞轮时，按熟练度百分比增加武器基础攻击力（非强化攻击力）
     * 1级熟练度：武器攻击力+10%
     * 5级熟练度：武器攻击力+50%
     * 熟练度增长方式：装备飞轮后普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'joker_emperor_i',
      key: 'I',
      name: '武器精通-飞轮',
      icon: '/pt/skill_icon/criticaljstyoyomaster.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：武器飞轮精通，装备武器是飞轮时增加武器基础攻击力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      // 成长线路：武器精通-飞轮系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_yoyo',
      // 熟练度增长配置：普通攻击命中累计计数，达到阈值后增加1点熟练度
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'yoyo_attack_mastery',
          // 武器攻击力百分比加成 - 1级10%，每级+10%，5级50%
          weaponAttackBonus: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取武器攻击力加成百分比
       * 1级10%，每级+10%，5级50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 武器攻击力加成百分比（0-50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 10 * safeLevel
      }
    },

    /**
     * O技能 - 暗影主宰领域EX1-增强格挡率（被动技能）
     * 增强暗影主宰领域效果，进一步强化全体格挡率
     * 1级即为最大熟练度，默认满级效果：+10%格挡率
     * 每次释放暗影主宰领域（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'joker_emperor_o',
      key: 'O',
      name: '暗影主宰领域EX1-增强格挡率',
      icon: '/pt/skill_icon/anyingzhuzailingyu.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增强暗影主宰领域，全体格挡率+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      // 成长线路：暗影主宰领域系列技能（暗影主宰领域→暗影主宰领域EX1→暗影主宰领域EX2）
      growthLine: 'shadow_escape',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_escape_block_rate',
          // 格挡率百分比加成 - 1级即为满级，固定10%
          blockRate: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影主宰领域EX1提供的额外格挡率百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外格挡率百分比加成（固定10）
       */
      getBlockRateBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX2技能 - 暗影主宰领域EX2-增强攻击速度（被动技能）
     * 增强暗影主宰领域效果，进一步强化全体攻击速度
     * 1级即为最大熟练度，默认满级效果：+10%攻击速度
     * 每次释放暗影主宰领域（Q技能）时，该被动技能熟练度随之增加
     */
    O_EX2: {
      id: 'joker_emperor_o_ex2',
      key: 'O_EX2',
      name: '暗影主宰领域EX2-增强攻击速度',
      icon: '/pt/skill_icon/anyingzhuzailingyu.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增强暗影主宰领域，全体攻击速度+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：暗影主宰领域系列技能（暗影主宰领域→暗影主宰领域EX1→暗影主宰领域EX2）
      growthLine: 'shadow_escape',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_escape_attack_speed',
          // 攻击速度百分比加成 - 1级即为满级，固定10%
          attackSpeed: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影主宰领域EX2提供的额外攻击速度百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外攻击速度百分比加成（固定10）
       */
      getAttackSpeedBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * W_EX技能 - 暗影突袭EX1-CD减少（被动技能）
     * 增强暗影突袭，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少暗影突袭技能CD 50%
     * 技能图片、音效与暗影突袭一致
     */
    W_EX: {
      id: 'joker_emperor_w_ex',
      key: 'W_EX',
      name: '暗影突袭EX1-CD减少',
      icon: '/pt/skill_icon/anyingtuxi.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：减少暗影突袭冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：暗影突袭系列（暗影突袭→暗影突袭EX1→暗影突袭EX2→暗影突袭EX3）
      growthLine: 'shadow_raze',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_raze_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影突袭CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 暗影突袭EX2-伤害增加（被动技能）
     * 增强暗影突袭，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加暗影突袭技能伤害 50%
     * 技能图片、音效与暗影突袭一致
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'joker_emperor_w_ex2',
      key: 'W_EX2',
      name: '暗影突袭EX2-伤害增加',
      icon: '/pt/skill_icon/anyingtuxi.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增加暗影突袭技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：暗影突袭系列（暗影突袭→暗影突袭EX1→暗影突袭EX2→暗影突袭EX3）
      growthLine: 'shadow_raze',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_raze_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影突袭伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 暗影突袭EX3-倍攻（被动技能）
     * 增强暗影突袭，概率触发倍攻伤害
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率造成2倍伤害
     *   20%概率造成3倍伤害
     *   10%概率造成5倍伤害
     * 技能图片、音效与暗影突袭一致
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'joker_emperor_w_ex3',
      key: 'W_EX3',
      name: '暗影突袭EX3-倍攻',
      icon: '/pt/skill_icon/anyingtuxi.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增强暗影突袭，概率触发倍攻伤害。30%概率造成2倍伤害，20%概率造成3倍伤害，10%概率造成5倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：暗影突袭系列（暗影突袭→暗影突袭EX1→暗影突袭EX2→暗影突袭EX3）
      growthLine: 'shadow_raze',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_raze_critical_multiplier',
          // 倍攻触发概率 - 1级即为满级，固定概率
          // 2倍：30%概率造成2倍伤害
          // 3倍：20%概率造成3倍伤害
          // 5倍：10%概率造成5倍伤害
          criticalMultiplier: {
            chance2x: 30,
            chance3x: 20,
            chance5x: 10
          }
        }
      },

      /**
       * 获取倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance2x, chance3x, chance5x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance2x: 30,
          chance3x: 20,
          chance5x: 10
        }
      }
    },

    /**
     * E_EX1技能 - 致命毒刃EX1-CD减少（被动技能）
     * 增强致命毒刃，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少致命毒刃技能CD 50%
     * 技能图片、音效与致命毒刃一致
     */
    E_EX1: {
      id: 'joker_emperor_e_ex1',
      key: 'E_EX1',
      name: '致命毒刃EX1-CD减少',
      icon: '/pt/skill_icon/zhimingduren.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：减少致命毒刃冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：致命毒刃系列（致命毒刃→致命毒刃EX1→致命毒刃EX2）
      growthLine: 'deadly_poison',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'deadly_poison_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取致命毒刃CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 致命毒刃EX2-伤害增加（被动技能）
     * 增强致命毒刃，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加致命毒刃技能伤害 50%
     * 技能图片、音效与致命毒刃一致
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'joker_emperor_e_ex2',
      key: 'E_EX2',
      name: '致命毒刃EX2-伤害增加',
      icon: '/pt/skill_icon/zhimingduren.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：增加致命毒刃技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：致命毒刃系列（致命毒刃→致命毒刃EX1→致命毒刃EX2）
      growthLine: 'deadly_poison',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'deadly_poison_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取致命毒刃伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX1技能 - 暗影之刃EX1-CD减少（被动技能）
     * 增强暗影之刃，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少暗影之刃技能CD 50%
     * 技能图片、音效与暗影之刃一致
     */
    U_EX1: {
      id: 'joker_emperor_u_ex1',
      key: 'U_EX1',
      name: '暗影之刃EX1-CD减少',
      icon: '/pt/skill_icon/anyingzhiren.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：减少暗影之刃冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：暗影之刃系列（暗影之刃→暗影之刃EX1→暗影之刃EX2）
      growthLine: 'phantom_dance',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'phantom_dance_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影之刃CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 暗影之刃EX2-伤害增加（被动技能）
     * 增强暗影之刃，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加暗影之刃技能伤害 50%
     * 技能图片、音效与暗影之刃一致
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'joker_emperor_u_ex2',
      key: 'U_EX2',
      name: '暗影之刃EX2-伤害增加',
      icon: '/pt/skill_icon/anyingzhiren.png',
      audio: '/sound/PcSkillD-Psybomb.wav',
      description: '被动技能：增加暗影之刃技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      // 成长线路：暗影之刃系列（暗影之刃→暗影之刃EX1→暗影之刃EX2）
      growthLine: 'phantom_dance',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'phantom_dance_damage_bonus',
          // 伤害增加百分比 - 1级即为满级，固定增加50%
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影之刃伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX1技能 - 武器精通-飞轮EX1-伤害增加（被动技能）
     * 增强武器精通-飞轮，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害50%
     * 技能图片、音效与武器精通-飞轮一致
     */
    I_EX1: {
      id: 'joker_emperor_i_ex1',
      key: 'I_EX1',
      name: '武器精通-飞轮EX1-伤害增加',
      icon: '/pt/skill_icon/criticaljstyoyomaster.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加武器基础攻击力50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：武器精通-飞轮系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_yoyo',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'yoyo_attack_mastery_ex1',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定50%
          weaponAttackBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX2技能 - 武器精通-飞轮EX2-伤害增加（被动技能）
     * 增强武器精通-飞轮，增加武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加武器基础伤害100%
     * 技能图片、音效与武器精通-飞轮一致
     */
    I_EX2: {
      id: 'joker_emperor_i_ex2',
      key: 'I_EX2',
      name: '武器精通-飞轮EX2-伤害增加',
      icon: '/pt/skill_icon/criticaljstyoyomaster.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加武器基础攻击力100%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：武器精通-飞轮系列（武器精通→武器精通EX1→武器精通EX2）
      growthLine: 'weapon_mastery_yoyo',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'yoyo_attack_mastery_ex2',
          // 额外武器攻击力百分比加成 - 1级即为满级，固定100%
          weaponAttackBonus: {
            base: 100,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回100%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外武器攻击力加成百分比（固定100）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 100
      }
    },

    /**
     * J技能 - 影之怨（被动技能）
     * 获得暗夜之力-影怨，每次普通攻击增加一点影怨值，最高10点
     * 第10次普通攻击附加攻击力百分比伤害，然后重置影怨值
     * MP:30（每次普通攻击减少30点MP，增加一个影怨值）
     * 1级熟练度：第10次普通攻击附加攻击力10%
     * 10级熟练度：第10次普通攻击附加攻击力100%
     * 熟练度增长方式：普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'joker_emperor_j',
      key: 'J',
      name: '影之怨',
      icon: '/pt/skill_icon/bloodaccumulation.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description:
        '获得暗夜之力-影怨，每次普通攻击增加一点影怨值，最高10点，第10次普通攻击附加攻击力伤害，然后重置影怨值。每次普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      // 成长线路：影之怨系列（影之怨→影之怨EX1→影之怨EX2）
      growthLine: 'shadow_grudge',
      // 熟练度增长配置：普通攻击命中累计计数，达到阈值后增加1点熟练度
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'shadow_grudge_bonus',
          // 攻击力百分比加成 - 1级10%，每级+10%，10级100%
          attackPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取影之怨附加攻击力百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击力附加百分比（10-100）
       */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取影之怨触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取影之怨每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 影之怨EX1-减少触发次数（被动技能）
     * 增强影之怨，减少普通攻击附加伤害的次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     * 技能图片与影之怨一致
     */
    J_EX1: {
      id: 'joker_emperor_j_ex1',
      key: 'J_EX1',
      name: '影之怨EX1-减少触发次数',
      icon: '/pt/skill_icon/bloodaccumulation.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强影之怨，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：影之怨系列（影之怨→影之怨EX1→影之怨EX2）
      growthLine: 'shadow_grudge',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_grudge_trigger_reduction',
          // 触发次数减少百分比 - 1级即为满级，固定减少50%
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取影之怨触发次数减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 影之怨EX2-倍攻（被动技能）
     * 增强影之怨，在EX1触发次数阈值时概率触发倍攻
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击 50%概率附加100%攻击力
     *   第5次普通攻击 25%概率附加150%攻击力
     *   第5次普通攻击 10%概率附加180%攻击力
     * 概率为逐级包含关系：50%包含25%和10%
     * 技能图片与影之怨一致
     */
    J_EX2: {
      id: 'joker_emperor_j_ex2',
      key: 'J_EX2',
      name: '影之怨EX2-倍攻',
      icon: '/pt/skill_icon/bloodaccumulation.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强影之怨，在EX1触发次数时概率触发倍攻（30%概率1.5倍、15%概率2倍、5%概率3倍攻击）。需先解锁影之怨EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：影之怨系列（影之怨→影之怨EX1→影之怨EX2）
      growthLine: 'shadow_grudge',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_grudge_multi_attack',
          // 倍攻触发概率 - 1级即为满级，固定概率
          // 30%概率触发1.5倍攻击（附加50%攻击力）
          // 15%概率触发2倍攻击（附加100%攻击力）
          // 5%概率触发3倍攻击（附加200%攻击力）
          // 概率为逐级包含关系：30%包含15%和5%
          multiAttack: {
            chance1: 30,
            bonus1: 50,
            chance2: 15,
            bonus2: 100,
            chance3: 5,
            bonus3: 200
          }
        }
      },

      /**
       * 获取影之怨EX2倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 30,
          bonus1: 50,
          chance2: 15,
          bonus2: 100,
          chance3: 5,
          bonus3: 200
        }
      }
    },

    /**
     * R技能 - 暗影斗篷
     * BUFF类单人技能：短时间进入暗影遮蔽状态，大幅提升闪避率
       * 持续时间为实际CD的一半，实际CD受暗影斗篷EX1-CD减少被动技能影响（EX1未解锁30秒，EX1解锁后15秒）
     * 1级熟练度：闪避率+5%
     * 5级熟练度：闪避率+20%
     * 释放该技能可在BUFF持续期间内将闪避率提升至最多50%（默认其他职业最大闪避率为30%）
     * 闪避率=百分百闪避伤害
     * CD减少由暗影斗篷EX1被动技能提供（175级解锁）
     * 闪避次数由暗影斗篷EX2被动技能提供（180级解锁）
     * 暴击伤害加成由暗影斗篷EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'joker_emperor_r',
      key: 'R',
      name: '暗影斗篷',
      icon: '/pt/skill_icon/anyingdoupeng.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description:
        '暗影主宰核心防御技能，短时间进入暗影遮蔽状态，可大幅提升闪避率，闪避接下来的伤害。BUFF持续期间闪避率上限提升至50%。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.NONE,
      cd: 60,
      manaCost: 230,
      // 基础持续时间为CD的一半（60/2=30秒）
      buffDuration: 30,
      // 标记为单人BUFF
      isPartyBuff: false,
      unlockLevel: 170,
      // 成长线路：暗影斗篷系列技能（暗影斗篷→暗影斗篷EX1→暗影斗篷EX2→暗影斗篷EX3）
      growthLine: 'shadow_cloak',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'shadow_cloak_buff',
          // 闪避率百分比加成 - 1级5%，每级+5%（实际为5%*(level)），5级20%
          // 注意：5级应为20%，所以 base=5, increment=3.75 不对
          // 1级: 5%, 5级: 20%, 线性增长: 5 + 3.75*(level-1)
          // 但为了简洁，使用 base=5, increment=3.75
          // 或者直接使用 calculateBuff 方法计算
          evasion: {
            base: 5,
            increment: 5,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 暗影斗篷提供闪避率加成
       * 若已学会暗影斗篷EX3（R_EX3技能），叠加暴击伤害百分比加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 evasion，可选 criticalDamage）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          // 闪避率百分比加成：5% * 技能等级
          evasion: {
            add: 5 * safeLevel,
            rate: true
          },
          // 标记提升闪避率上限至50%
          evasionCapBonus: {
            add: 50,
            rate: false
          }
        }

        // 暗影斗篷EX3被动技能提供额外暴击伤害百分比加成
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.joker_emperor.R_EX3
            if (ex3Def && typeof ex3Def.getCriticalDamageBonus === 'function') {
              result.criticalDamage = {
                add: ex3Def.getCriticalDamageBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 暗影斗篷EX3未解锁或未加载时不提供暴击伤害加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 持续时间 = 实际CD / 2，实际CD受暗影斗篷EX1-CD减少被动技能影响
       * EX1未解锁：基础CD=60秒 → 持续时间=30秒
       * EX1已解锁（减少50%CD）：实际CD=30秒 → 持续时间=15秒
       * 与 SkillTooltip.vue 的 effectiveCooldown 和 SkillEffectService.js 的 BUFF应用逻辑保持一致
       * @param {Object} player - 玩家对象（用于检测EX1解锁状态）
       * @param {number} skillLevel - 技能熟练度等级（未使用，保留以兼容调用签名）
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        // 基础CD（暗影斗篷R技能）
        const baseCd = SKILL_CONFIG.joker_emperor.R.cd || 60

        // 检查暗影斗篷EX1-CD减少被动技能是否已学习
        let cdReduction = 0
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level >= 1) {
            const ex1Def = SKILL_CONFIG.joker_emperor.R_EX1
            if (ex1Def && typeof ex1Def.getCdReduction === 'function') {
              cdReduction = ex1Def.getCdReduction(ex1Level)
            } else {
              cdReduction = 50
            }
          }
        } catch (e) {
          // 暗影斗篷EX1未解锁或未加载时，CD减少为0
        }

        // 计算实际CD（与 SkillTooltip effectiveCooldown 逻辑一致）
        const effectiveCd = cdReduction > 0
          ? Math.max(1, Math.ceil(baseCd * (1 - cdReduction / 100)))
          : baseCd

        // 持续时间为实际CD的一半
        return Math.max(1, Math.ceil(effectiveCd / 2))
      },

      /**
       * 获取暗影斗篷闪避次数
       * 默认1次（百分百闪避1次伤害）
       * 若已学会暗影斗篷EX2（R_EX2技能），增加至3次
       * @param {Object} player - 玩家对象
       * @returns {number} 闪避次数（1或3）
       */
      getEvadeCount(player) {
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            return 3
          }
        } catch (e) {
          // 暗影斗篷EX2未解锁或未加载时返回默认值
        }
        return 1
      }
    },

    /**
     * R_EX1技能 - 暗影斗篷EX1-CD减少（被动技能）
     * 增强暗影斗篷，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少暗影斗篷技能CD 50%
     * 技能图片、音效与暗影斗篷一致
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'joker_emperor_r_ex1',
      key: 'R_EX1',
      name: '暗影斗篷EX1-CD减少',
      icon: '/pt/skill_icon/anyingdoupeng.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：减少暗影斗篷冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      // 成长线路：暗影斗篷系列（暗影斗篷→暗影斗篷EX1→暗影斗篷EX2→暗影斗篷EX3）
      growthLine: 'shadow_cloak',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_cloak_cd_reduction',
          // CD减少百分比 - 1级即为满级，固定减少50%
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影斗篷CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * R_EX2技能 - 暗影斗篷EX2-增加闪避次数（被动技能）
     * 增强暗影斗篷，释放期间可闪避3次所有伤害
     * 1级即为最大熟练度，默认满级效果：闪避次数从1增加至3
     * 技能图片、音效与暗影斗篷一致
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'joker_emperor_r_ex2',
      key: 'R_EX2',
      name: '暗影斗篷EX2-增加闪避次数',
      icon: '/pt/skill_icon/anyingdoupeng.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：释放暗影斗篷期间可闪避3次所有伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      // 成长线路：暗影斗篷系列（暗影斗篷→暗影斗篷EX1→暗影斗篷EX2→暗影斗篷EX3）
      growthLine: 'shadow_cloak',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_cloak_evade_count',
          // 闪避次数 - 1级即为满级，固定3次
          evadeCount: {
            base: 3,
            increment: 0,
            rate: false
          }
        }
      },

      /**
       * 获取暗影斗篷闪避次数
       * 1级即为最大熟练度，固定返回3次
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 闪避次数（固定3）
       */
      getEvadeCount(skillLevel = 1) {
        return 3
      }
    },

    /**
     * R_EX3技能 - 暗影斗篷EX3-增加爆伤（被动技能）
     * 增强暗影斗篷，释放期间增加暴击伤害
     * 1级即为最大熟练度，默认满级效果：释放暗影斗篷期间增加15%暴击伤害
     * 技能图片、音效与暗影斗篷一致
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'joker_emperor_r_ex3',
      key: 'R_EX3',
      name: '暗影斗篷EX3-增加爆伤',
      icon: '/pt/skill_icon/anyingdoupeng.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：释放暗影斗篷期间增加15%暴击伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      // 成长线路：暗影斗篷系列（暗影斗篷→暗影斗篷EX1→暗影斗篷EX2→暗影斗篷EX3）
      growthLine: 'shadow_cloak',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'shadow_cloak_crit_damage',
          // 暴击伤害百分比加成 - 1级即为满级，固定15%
          criticalDamage: {
            base: 15,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取暗影斗篷EX3提供的额外暴击伤害百分比加成
       * 1级即为最大熟练度，固定返回15%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外暴击伤害百分比加成（固定15）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 15
      }
    }
  },

  // ========== 风暴行者(猎杀者)技能 ==========
  // 三转职业：由刀锋战士(blade_warrior)进阶，高暴击、高闪避、高攻速的风暴双刀流战士
  // 技能体系参照炽天使设计：5个主技能 + 多个EX被动技能，共7条成长线路
  // 职业特征：继承刀锋战士双刀流能力，将风暴之力注入双刀，以极快攻速与高暴击碾压敌人
  storm_walker: {
    /**
     * Q技能 - 风暴领域
     * 群体BUFF技能：以双刀为引导展开风暴领域，持续期间提升全队命中率
     * 一阶强化（风暴领域EX1）额外提升全队暴击率；二阶强化（风暴领域EX2）额外提升全队攻击速度
     * 基础持续时间1分钟，每10点敏捷+1秒
     * 1级熟练度：命中率+2%
     * 5级熟练度：命中率+10%
     * 暴击率加成由风暴领域EX1被动技能提供（180级解锁）
     * 攻击速度加成由风暴领域EX2被动技能提供（190级解锁）
     */
    Q: {
      id: 'storm_walker_q',
      key: 'Q',
      name: '风暴领域',
      icon: '/pt/skill_icon/fengbaolingyu.png',
      audio: '/sound/ItemChrWAngel.wav',
      description:
        '以双刀为引导展开风暴领域庇护全队，持续期间提升全队命中率；一阶强化额外提升全队暴击率，二阶强化进一步增加全队攻击速度。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.WIND,
      cd: 15,
      manaCost: 260,
      buffDuration: 60,
      isPartyBuff: true,
      unlockLevel: 175,
      growthLine: 'storm_domain',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'storm_domain_buff',
          hitRate: {
            base: 2,
            increment: 2,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 风暴领域提供命中率百分比加成
       * 若已学会风暴领域EX1（O技能），叠加暴击率百分比加成
       * 若已学会风暴领域EX2（O_EX2技能），叠加攻击速度百分比加成
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 hitRate，可选 criticalRate、attackSpeed）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          hitRate: {
            add: 2 * safeLevel,
            rate: true
          }
        }

        // 风暴领域EX1被动技能提供额外暴击率百分比加成
        try {
          const ex1Skill = player?.skills?.O
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.storm_walker.O
            if (ex1Def && typeof ex1Def.getCriticalRateBonus === 'function') {
              result.criticalRate = {
                add: ex1Def.getCriticalRateBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          console.log('[风暴领域] EX1检测异常:', e?.message || e)
        }

        // 风暴领域EX2被动技能提供额外攻击速度百分比加成
        try {
          const ex2Skill = player?.skills?.['O_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.storm_walker.O_EX2
            if (ex2Def && typeof ex2Def.getAttackSpeedBonus === 'function') {
              result.attackSpeed = {
                add: ex2Def.getAttackSpeedBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 风暴领域EX2未解锁或未加载时不提供攻击速度加成
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础60秒 + 每10点敏捷+1秒
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const agility = player?.stats?.agility || 0
        return 60 + Math.floor(agility / 10)
      }
    },

    /**
     * O技能 - 风暴领域EX1-增强暴击率（被动技能）
     * 增强风暴领域效果，持续期间额外提升全队暴击率
     * 1级即为最大熟练度，默认满级效果：+10%暴击率
     * 每次释放风暴领域（Q技能）时，该被动技能熟练度随之增加
     */
    O: {
      id: 'storm_walker_o',
      key: 'O',
      name: '风暴领域EX1-增强暴击率',
      icon: '/pt/skill_icon/fengbaolingyu.png',
      audio: '/sound/ItemChrWAngel.wav',
      description: '被动技能：增强风暴领域，全队暴击率+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'storm_domain',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_domain_critical_rate',
          criticalRate: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴领域EX1提供的额外暴击率百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外暴击率百分比加成（固定10）
       */
      getCriticalRateBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * O_EX2技能 - 风暴领域EX2-增强攻击速度（被动技能）
     * 增强风暴领域效果，持续期间额外提升全队攻击速度
     * 1级即为最大熟练度，默认满级效果：+10%攻击速度
     * 每次释放风暴领域（Q技能）时，该被动技能熟练度随之增加
     */
    O_EX2: {
      id: 'storm_walker_o_ex2',
      key: 'O_EX2',
      name: '风暴领域EX2-增强攻击速度',
      icon: '/pt/skill_icon/fengbaolingyu.png',
      audio: '/sound/ItemChrWAngel.wav',
      description: '被动技能：增强风暴领域，全队攻击速度+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'storm_domain',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_domain_attack_speed',
          attackSpeed: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴领域EX2提供的额外攻击速度百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外攻击速度百分比加成（固定10）
       */
      getAttackSpeedBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * W技能 - 狂风绝刃
     * 单体风属性伤害技能：将风暴之力注入双刀，锁定单一敌人发起贯穿之风刃斩击
     * 基础伤害1200，MP消耗200
     * 1级熟练度：伤害+200
     * 5级熟练度：伤害+3000
     * 力量加成：每点力量提供5点伤害
     * 敏捷加成：每点敏捷提供7点伤害
     * CD减少由狂风绝刃EX1被动技能提供（175级解锁）
     * 伤害增加由狂风绝刃EX2被动技能提供（185级解锁）
     * 倍攻由狂风绝刃EX3被动技能提供（190级解锁）
     */
    W: {
      id: 'storm_walker_w',
      key: 'W',
      name: '狂风绝刃',
      icon: '/pt/skill_icon/kuangfengjueren.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description:
        '将狂暴风暴之力注入双刀，锁定单一敌人发起绝命之风刃斩击，造成毁灭性风属性物理伤害。',
      type: SKILL_TYPES.SINGLE,
      element: ELEMENT_TYPES.WIND,
      damage: 1200,
      cd: 15,
      manaCost: 200,
      unlockLevel: 166,
      growthLine: 'piercing_wind',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 200,
          increment: (3000 - 200) / 4
        }
      },

      /**
       * 伤害计算（力量+敏捷型单体风属性伤害）
       * 公式: 基础伤害(1200) + 熟练度伤害(1级+200,5级+3000) + 力量×5 + 敏捷×7 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 200 + ((3000 - 200) / 4) * (safeLevel - 1)
        const strength = Number(player?.stats?.strength || 0)
        const strDamage = strength * 5
        const agility = Number(player?.stats?.agility || 0)
        const agiDamage = agility * 7
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + strDamage + agiDamage + attack * 0.3)
      }
    },

    /**
     * W_EX技能 - 狂风绝刃EX1-CD减少（被动技能）
     * 增强狂风绝刃，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少狂风绝刃技能CD 50%
     * 技能图片、音效与狂风绝刃一致
     */
    W_EX: {
      id: 'storm_walker_w_ex',
      key: 'W_EX',
      name: '狂风绝刃EX1-CD减少',
      icon: '/pt/skill_icon/kuangfengjueren.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：减少狂风绝刃冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'piercing_wind',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'piercing_wind_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风绝刃CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX2技能 - 狂风绝刃EX2-伤害增加（被动技能）
     * 增强狂风绝刃，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加狂风绝刃技能伤害 50%
     * 技能图片、音效与狂风绝刃一致
     * 解锁等级：185级
     */
    W_EX2: {
      id: 'storm_walker_w_ex2',
      key: 'W_EX2',
      name: '狂风绝刃EX2-伤害增加',
      icon: '/pt/skill_icon/kuangfengjueren.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增加狂风绝刃技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'piercing_wind',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'piercing_wind_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风绝刃伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * W_EX3技能 - 狂风绝刃EX3-倍攻（被动技能）
     * 增强狂风绝刃，概率触发倍攻伤害
     * 1级即为最大熟练度，默认满级效果：
     *   50%概率造成1.5倍伤害
     *   25%概率造成2倍伤害
     *   10%概率造成3倍伤害
     * 概率为逐级包含关系：50%包含25%和10%
     * 技能图片、音效与狂风绝刃一致
     * 解锁等级：190级
     */
    W_EX3: {
      id: 'storm_walker_w_ex3',
      key: 'W_EX3',
      name: '狂风绝刃EX3-倍攻',
      icon: '/pt/skill_icon/kuangfengjueren.png',
      audio: '/sound/PcSkillD-VataStab01.wav',
      description: '被动技能：增强狂风绝刃，概率触发倍攻伤害。50%概率造成1.5倍伤害，25%概率造成2倍伤害，10%概率造成3倍伤害。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'piercing_wind',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'piercing_wind_critical_multiplier',
          criticalMultiplier: {
            chance1_5x: 50,
            chance2x: 25,
            chance3x: 10
          }
        }
      },

      /**
       * 获取倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1_5x, chance2x, chance3x }
       */
      getCriticalMultiplier(skillLevel = 1) {
        return {
          chance1_5x: 50,
          chance2x: 25,
          chance3x: 10
        }
      }
    },

    /**
     * E技能 - 风暴印记
     * 单体DEBUFF技能：将风暴之力注入双刀斩击敌人，命中后施加「风暴印记」
     * 印记期间目标所有属性抗性大幅降低（火、风、土、雷、水属性）
     * 1级熟练度：伤害+150，目标所有属性抗性-70%
     * 5级熟练度：伤害+1000，目标所有属性抗性-70%
     * DEBUFF持续时间为CD的一半（15秒）
     * CD减少由风暴印记EX1被动技能提供（175级解锁）
     * 伤害增加由风暴印记EX2被动技能提供（185级解锁）
     */
    E: {
      id: 'storm_walker_e',
      key: 'E',
      name: '风暴印记',
      icon: '/pt/skill_icon/fengbaoyinji.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description:
        '将风暴之力注入双刀斩击单体敌人，造成风属性伤害。受击目标附上「风暴印记」，持续15秒，期间目标所有属性抗性降低70%（火、风、土、雷、水属性）。',
      type: SKILL_TYPES.DEBUFF,
      element: ELEMENT_TYPES.WIND,
      damage: 500,
      cd: 30,
      manaCost: 200,
      duration: 15,
      unlockLevel: 170,
      growthLine: 'frost_mark',

      // DEBUFF配置：风暴印记（复用 damageVulnerability 机制，降低所有属性抗性）
      debuff: {
        type: 'damageVulnerability',
        chance: 100,
        effect: {
          type: 'damageVulnerability',
          icon: '/pt/skill_icon/fengbaoyinji.png',
          baseDuration: 15,
          /**
           * 获取所有属性抗性降低百分比（固定70%）
           * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回70）
           * @returns {number} 属性抗性降低百分比
           */
          getValue(skillLevel) {
            return 70
          }
        }
      },

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 150,
          increment: (1000 - 150) / 4
        }
      },

      /**
       * 伤害计算（力量+敏捷型风属性伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+150,5级+1000) + 力量×5.18 + 敏捷×3.18 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 150 + ((1000 - 150) / 4) * (safeLevel - 1)
        const strDamage = Number(player?.stats?.strength || 0) * 5.18
        const agiDamage = Number(player?.stats?.agility || 0) * 3.18
        const attack = Number(player?.attack || 0)
        return Math.floor(Number(this?.damage || 0) + proficiencyDamage + strDamage + agiDamage + attack * 0.3)
      },

      /**
       * 计算DEBUFF触发概率（命中即施加，100%）
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 触发概率（百分比）
       */
      calculateDebuffChance(skillLevel = 1) {
        return 100
      },

      /**
       * 计算DEBUFF效果值（所有属性抗性降低70%）
       * 固定效果：所有属性抗性-70%，持续15秒
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定效果）
       * @param {Object} [player] - 玩家对象（保留参数以兼容调用签名）
       * @returns {Object} DEBUFF效果对象
       */
      calculateDebuffEffect(skillLevel = 1, player = null) {
        return {
          damageIncrease: 70,
          duration: 15
        }
      }
    },

    /**
     * E_EX1技能 - 风暴印记EX1-CD减少（被动技能）
     * 增强风暴印记，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少风暴印记技能CD 50%
     * 技能图片、音效与风暴印记一致
     */
    E_EX1: {
      id: 'storm_walker_e_ex1',
      key: 'E_EX1',
      name: '风暴印记EX1-CD减少',
      icon: '/pt/skill_icon/fengbaoyinji.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：减少风暴印记冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'frost_mark',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'frost_mark_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴印记CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * E_EX2技能 - 风暴印记EX2-伤害增加（被动技能）
     * 增强风暴印记，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加风暴印记技能伤害 50%
     * 技能图片、音效与风暴印记一致
     * 解锁等级：185级
     */
    E_EX2: {
      id: 'storm_walker_e_ex2',
      key: 'E_EX2',
      name: '风暴印记EX2-伤害增加',
      icon: '/pt/skill_icon/fengbaoyinji.png',
      audio: '/sound/PcSkillM-Criticalswing01.wav',
      description: '被动技能：增加风暴印记技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'frost_mark',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'frost_mark_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴印记伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U技能 - 狂风绝息斩
     * AOE风属性伤害技能：将风暴之力注入双刀，以极快攻速对范围内敌人发动连续风刃斩击
     * 基础伤害800，MP消耗250
     * 1级熟练度：伤害+180
     * 5级熟练度：伤害+2200
     * 力量加成：每点力量提供4.5点伤害
     * 敏捷加成：每点敏捷提供6点伤害
     * CD减少由狂风绝息斩EX1被动技能提供（175级解锁）
     * 伤害增加由狂风绝息斩EX2被动技能提供（185级解锁）
     */
    U: {
      id: 'storm_walker_u',
      key: 'U',
      name: '狂风绝息斩',
      icon: '/pt/skill_icon/kuangfengjuexizhan.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description:
        '将狂暴风暴之力注入双刀，以极快攻速对范围内敌人发动绝息之风刃斩击，造成毁灭性风属性范围伤害。',
      type: SKILL_TYPES.AOE,
      element: ELEMENT_TYPES.WIND,
      damage: 800,
      cd: 6,
      manaCost: 250,
      unlockLevel: 166,
      growthLine: 'storm_rain',

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'damage',
          base: 180,
          increment: (2200 - 180) / 4
        }
      },

      /**
       * 伤害计算（力量+敏捷型AOE风属性伤害）
       * 公式: 基础伤害(this.damage) + 熟练度伤害(1级+180,5级+2200) + 力量×4.5 + 敏捷×6 + 玩家攻击力×0.3
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 总伤害值
       */
      calculateDamage(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const proficiencyDamage = 180 + ((2200 - 180) / 4) * (safeLevel - 1)
        const strength = Number(player?.stats?.strength || 0)
        const strDamage = strength * 4.5
        const agility = Number(player?.stats?.agility || 0)
        const agiDamage = agility * 6
        const attack = Number(player?.attack || 0)
        return Math.floor(this.damage + proficiencyDamage + strDamage + agiDamage + attack * 0.3)
      }
    },

    /**
     * U_EX1技能 - 狂风绝息斩EX1-CD减少（被动技能）
     * 增强狂风绝息斩，减少冷却时间
     * 1级即为最大熟练度，默认满级效果：减少狂风绝息斩技能CD 50%
     * 技能图片、音效与狂风绝息斩一致
     */
    U_EX1: {
      id: 'storm_walker_u_ex1',
      key: 'U_EX1',
      name: '狂风绝息斩EX1-CD减少',
      icon: '/pt/skill_icon/kuangfengjuexizhan.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '被动技能：减少狂风绝息斩冷却时间50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'storm_rain',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_rain_cd_reduction',
          cdReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风绝息斩CD减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} CD减少百分比（固定50）
       */
      getCdReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * U_EX2技能 - 狂风绝息斩EX2-伤害增加（被动技能）
     * 增强狂风绝息斩，增加技能伤害
     * 1级即为最大熟练度，默认满级效果：增加狂风绝息斩技能伤害 50%
     * 技能图片、音效与狂风绝息斩一致
     * 解锁等级：185级
     */
    U_EX2: {
      id: 'storm_walker_u_ex2',
      key: 'U_EX2',
      name: '狂风绝息斩EX2-伤害增加',
      icon: '/pt/skill_icon/kuangfengjuexizhan.png',
      audio: ['/sound/PcSkillM-Arrowrain01.wav', '/sound/PcSkillM-Arrowrain02.wav'],
      description: '被动技能：增加狂风绝息斩技能伤害50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 185,
      growthLine: 'storm_rain',

      unlockCondition(player) {
        return player.level >= 185
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_rain_damage_bonus',
          damageBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取狂风绝息斩伤害增加百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 伤害增加百分比（固定50）
       */
      getDamageBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I技能 - 武器精通-副手武器（被动技能）
     * 当副手装备的是武器而非盾牌时，按熟练度百分比增加副手武器基础攻击力（非强化攻击力）
     * 1级熟练度：副手武器攻击力+10%
     * 5级熟练度：副手武器攻击力+50%
     * 熟练度增长方式：副手武器普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    I: {
      id: 'storm_walker_i',
      key: 'I',
      name: '武器精通-副手武器',
      icon: '/pt/skill_icon/shuangchijingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：当副手装备的是武器而非盾牌时，增加副手武器基础攻击力。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 166,
      growthLine: 'storm_blade_mastery',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'storm_blade_attack_mastery',
          weaponAttackBonus: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取副手武器攻击力加成百分比
       * 1级10%，每级+10%，5级50%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 副手武器攻击力加成百分比（0-50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        return 10 * safeLevel
      }
    },

    /**
     * I_EX1技能 - 武器精通-副手武器EX1-伤害增加（被动技能）
     * 增强武器精通-副手武器，增加副手武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加副手武器基础伤害50%
     * 技能图片、音效与武器精通-副手武器一致
     * 解锁等级：170级
     */
    I_EX1: {
      id: 'storm_walker_i_ex1',
      key: 'I_EX1',
      name: '武器精通-副手武器EX1-伤害增加',
      icon: '/pt/skill_icon/shuangchijingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加副手武器基础攻击力50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 170,
      growthLine: 'storm_blade_mastery',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_blade_attack_mastery_ex1',
          weaponAttackBonus: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外副手武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外副手武器攻击力加成百分比（固定50）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 50
      }
    },

    /**
     * I_EX2技能 - 武器精通-副手武器EX2-伤害增加2（被动技能）
     * 增强武器精通-副手武器，增加副手武器基础伤害
     * 1级即为最大熟练度，默认满级效果：增加副手武器基础伤害100%
     * 技能图片、音效与武器精通-副手武器一致
     * 解锁等级：180级
     */
    I_EX2: {
      id: 'storm_walker_i_ex2',
      key: 'I_EX2',
      name: '武器精通-副手武器EX2-伤害增加2',
      icon: '/pt/skill_icon/shuangchijingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：增加副手武器基础攻击力100%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'storm_blade_mastery',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_blade_attack_mastery_ex2',
          weaponAttackBonus: {
            base: 100,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取额外副手武器攻击力加成百分比
       * 1级即为最大熟练度，固定返回100%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 额外副手武器攻击力加成百分比（固定100）
       */
      getWeaponAttackBonus(skillLevel = 1) {
        return 100
      }
    },

    /**
     * I_EX3技能 - 武器精通-副手武器EX3-副手武器倍攻（被动技能）
     * 增强武器精通-副手武器，副手武器攻击时概率触发倍攻
     * 1级即为最大熟练度，默认满级效果：
     *   30%概率触发1.5倍攻击力
     *   20%概率触发2倍攻击力
     *   10%概率触发2.5倍攻击力
     * 技能图片、音效与武器精通-副手武器一致
     * 解锁等级：190级
     */
    I_EX3: {
      id: 'storm_walker_i_ex3',
      key: 'I_EX3',
      name: '武器精通-副手武器EX3-副手武器倍攻',
      icon: '/pt/skill_icon/shuangchijingtong.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '被动技能：副手武器攻击时概率触发倍攻，30%概率1.5倍，20%概率2倍，10%概率2.5倍。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.NONE,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'storm_blade_mastery',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_blade_attack_mastery_ex3',
          multiplierAttack: {
            tiers: [
              { chance: 30, multiplier: 1.5 },
              { chance: 20, multiplier: 2.0 },
              { chance: 10, multiplier: 2.5 }
            ]
          }
        }
      },

      /**
       * 获取副手武器倍攻触发信息
       * 1级即为最大熟练度，返回倍攻配置数组
       * 按优先级从低到高排列：30%概率1.5倍 → 20%概率2倍 → 10%概率2.5倍
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object|null} 倍攻配置对象，包含 tiers 数组
       */
      getOffhandMultiplierAttack(skillLevel = 1) {
        return {
          tiers: [
            { chance: 30, multiplier: 1.5 },
            { chance: 20, multiplier: 2.0 },
            { chance: 10, multiplier: 2.5 }
          ]
        }
      },

      /**
       * 随机摇取副手武器倍攻倍率
       * 按概率从低到高依次判定：先摇30%概率1.5倍，未中再摇20%概率2倍，最后摇10%概率2.5倍
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 倍攻倍率（1表示未触发倍攻，1.5/2.0/2.5表示触发对应倍率）
       */
      rollOffhandMultiplier(skillLevel = 1) {
        const config = this.getOffhandMultiplierAttack(skillLevel)
        if (!config || !Array.isArray(config.tiers) || config.tiers.length === 0) {
          return 1
        }
        // 按概率从低到高依次判定
        for (const tier of config.tiers) {
          if (Math.random() * 100 < tier.chance) {
            return tier.multiplier
          }
        }
        return 1
      }
    },

    /**
     * J技能 - 风之积累（被动技能）
     * 获得风暴之力-风之积累，每次双刀普通攻击或释放技能增加一点风之值，最高10点
     * 第10次双刀普通攻击附加攻击力百分比的额外风属性伤害，然后重置风之值
     * MP:30（每次双刀普通攻击减少30点MP，增加一个风之值）
     * 1级熟练度：第10次普通攻击附加攻击力10%的伤害
     * 10级熟练度：第10次普通攻击附加攻击力100%的伤害
     * 熟练度增长方式：双刀普通攻击命中累计计数，每10次普通攻击增加1点熟练度
     */
    J: {
      id: 'storm_walker_j',
      key: 'J',
      name: '风之积累',
      icon: '/pt/skill_icon/fengzhijilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description:
        '获得风暴之力-风之积累，每次双刀普通攻击或释放技能增加一点风之值，最高10点，达到触发阈值时附加攻击力百分比的额外风属性伤害，然后重置风之值。每次双刀普通攻击消耗30点MP。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 30,
      unlockLevel: 166,
      growthLine: 'wind_accumulation',
      proficiencyGainOnAttack: {
        enabled: true,
        attacksPerGain: 10
      },

      unlockCondition(player) {
        return player.level >= 166
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 10,
        effect: {
          type: 'wind_accumulation_bonus',
          attackPercent: {
            base: 10,
            increment: 10,
            rate: true
          }
        }
      },

      /**
       * 获取风之积累附加攻击力百分比
       * 1级10%，每级+10%，10级100%
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 攻击力附加百分比（10-100）
       */
      getDamageBonusPercent(skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 10) : 1
        return 10 * safeLevel
      },

      /**
       * 获取风之积累触发阈值（基础值，未考虑EX1减少）
       * @returns {number} 触发阈值（固定10）
       */
      getBaseTriggerCount() {
        return 10
      },

      /**
       * 获取风之积累每次攻击MP消耗
       * @returns {number} MP消耗值（固定30）
       */
      getMpCostPerAttack() {
        return 30
      }
    },

    /**
     * J_EX1技能 - 风之积累EX1-减少触发次数（被动技能）
     * 增强风之积累，减少普通攻击附加伤害的次数-50%
     * 1级即为最大熟练度，默认满级效果：触发次数从10减少至5
     * 技能图片与风之积累一致
     */
    J_EX1: {
      id: 'storm_walker_j_ex1',
      key: 'J_EX1',
      name: '风之积累EX1-减少触发次数',
      icon: '/pt/skill_icon/fengzhijilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强风之积累，减少普通攻击附加伤害的次数-50%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'wind_accumulation',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'wind_accumulation_trigger_reduction',
          triggerReduction: {
            base: 50,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风之积累触发次数减少百分比
       * 1级即为最大熟练度，固定返回50%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 触发次数减少百分比（固定50）
       */
      getTriggerReduction(skillLevel = 1) {
        return 50
      }
    },

    /**
     * J_EX2技能 - 风之积累EX2-倍攻（被动技能）
     * 增强风之积累，在EX1触发次数阈值时概率触发倍攻
     * 依赖EX1：EX2的触发次数基于EX1的攻击次数（5次），需先解锁EX1
     * 1级即为最大熟练度，默认满级效果：
     *   第5次（基于EX1次数）普通攻击/技能释放 30%概率附加200%攻击力
     *   第5次普通攻击/技能释放 20%概率附加300%攻击力
     *   第5次普通攻击/技能释放 10%概率附加400%攻击力
     * 概率为逐级包含关系：30%包含20%和10%
     * 技能图片与风之积累一致
     */
    J_EX2: {
      id: 'storm_walker_j_ex2',
      key: 'J_EX2',
      name: '风之积累EX2-倍攻',
      icon: '/pt/skill_icon/fengzhijilei.png',
      audio: '/sound/PcSkillM-Silentshot01.wav',
      description: '增强风之积累，在EX1触发次数时概率触发倍攻（30%概率200%攻击力、20%概率300%攻击力、10%概率400%攻击力）。需先解锁风之积累EX1。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'wind_accumulation',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'wind_accumulation_multi_attack',
          multiAttack: {
            chance1: 30,
            bonus1: 200,
            chance2: 20,
            bonus2: 300,
            chance3: 10,
            bonus3: 400
          }
        }
      },

      /**
       * 获取风之积累EX2倍攻触发信息
       * 1级即为最大熟练度，固定返回倍攻概率配置
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {Object} 倍攻概率配置 { chance1, bonus1, chance2, bonus2, chance3, bonus3 }
       */
      getMultiAttackChance(skillLevel = 1) {
        return {
          chance1: 30,
          bonus1: 200,
          chance2: 20,
          bonus2: 300,
          chance3: 10,
          bonus3: 400
        }
      }
    },

    /**
     * R技能 - 风暴之力
     * 单体自身BUFF技能：将风暴之力极限压缩注入双刀，进入「风暴觉醒」状态
     * 持续期间大幅提升自身风属性攻击力
     * 基础持续时间30秒（CD的一半）
     * 1级熟练度：风属性攻击力+5%
     * 5级熟练度：风属性攻击力+20%
     * 暴击率加成由风暴之力EX1被动技能提供（175级解锁）
     * 暴击伤害加成由风暴之力EX2被动技能提供（180级解锁）
     * 生命偷取由风暴之力EX3被动技能提供（190级解锁）
     */
    R: {
      id: 'storm_walker_r',
      key: 'R',
      name: '风暴之力',
      icon: '/pt/skill_icon/fengbaokuangren.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description:
        '风暴行者核心进攻技能，将风暴之力极限压缩注入双刀，进入风暴觉醒状态，持续期间大幅提升自身风属性攻击力。',
      type: SKILL_TYPES.BUFF,
      element: ELEMENT_TYPES.WIND,
      cd: 60,
      manaCost: 230,
      buffDuration: 30,
      isTeamBuff: false,
      unlockLevel: 170,
      growthLine: 'storm_wings',

      unlockCondition(player) {
        return player.level >= 170
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 5,
        effect: {
          type: 'storm_frenzy_buff',
          windAttack: {
            base: 5,
            increment: 3.75,
            rate: true
          }
        }
      },

      /**
       * 计算 BUFF 效果
       * 风暴之力提供风属性攻击力加成
       * 若已学会风暴之力EX1（R_EX1技能），叠加暴击率百分比加成
       * 若已学会风暴之力EX2（R_EX2技能），叠加暴击伤害百分比加成
       * 若已学会风暴之力EX3（R_EX3技能），叠加生命偷取效果
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {Object} BUFF 效果对象（含 windAttack，可选 criticalRate、criticalDamage、lifeSteal）
       */
      calculateBuff(player, skillLevel = 1) {
        const safeLevel = Number.isFinite(skillLevel) && skillLevel > 0 ? Math.min(skillLevel, 5) : 1
        const result = {
          windAttack: {
            add: 5 + 3.75 * (safeLevel - 1),
            rate: true
          }
        }

        // 风暴之力EX1被动技能提供额外暴击率百分比加成
        try {
          const ex1Skill = player?.skills?.['R_EX1']
          const ex1Level = Number(
            ex1Skill?.proficiencyLevel ??
            (ex1Skill?.proficiency && typeof ex1Skill.proficiency === 'object'
              ? ex1Skill.proficiency.level
              : undefined) ??
            ex1Skill?.level ?? 0
          )
          if (ex1Level > 0) {
            const ex1Def = SKILL_CONFIG.storm_walker.R_EX1
            if (ex1Def && typeof ex1Def.getCriticalRateBonus === 'function') {
              result.criticalRate = {
                add: ex1Def.getCriticalRateBonus(ex1Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 风暴之力EX1未解锁或未加载时不提供暴击率加成
        }

        // 风暴之力EX2被动技能提供额外暴击伤害百分比加成
        try {
          const ex2Skill = player?.skills?.['R_EX2']
          const ex2Level = Number(
            ex2Skill?.proficiencyLevel ??
            (ex2Skill?.proficiency && typeof ex2Skill.proficiency === 'object'
              ? ex2Skill.proficiency.level
              : undefined) ??
            ex2Skill?.level ?? 0
          )
          if (ex2Level > 0) {
            const ex2Def = SKILL_CONFIG.storm_walker.R_EX2
            if (ex2Def && typeof ex2Def.getCriticalDamageBonus === 'function') {
              result.criticalDamage = {
                add: ex2Def.getCriticalDamageBonus(ex2Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 风暴之力EX2未解锁或未加载时不提供暴击伤害加成
        }

        // 风暴之力EX3被动技能提供生命偷取效果
        try {
          const ex3Skill = player?.skills?.['R_EX3']
          const ex3Level = Number(
            ex3Skill?.proficiencyLevel ??
            (ex3Skill?.proficiency && typeof ex3Skill.proficiency === 'object'
              ? ex3Skill.proficiency.level
              : undefined) ??
            ex3Skill?.level ?? 0
          )
          if (ex3Level > 0) {
            const ex3Def = SKILL_CONFIG.storm_walker.R_EX3
            if (ex3Def && typeof ex3Def.getLifeStealBonus === 'function') {
              result.lifeSteal = {
                add: ex3Def.getLifeStealBonus(ex3Level),
                rate: true
              }
            }
          }
        } catch (e) {
          // 风暴之力EX3未解锁或未加载时不提供生命偷取
        }

        return result
      },

      /**
       * 计算最终持续时间（秒）
       * 公式：基础CD / 2（60/2=30秒）
       * @param {Object} player - 玩家对象
       * @param {number} skillLevel - 技能熟练度等级
       * @returns {number} 持续时间（秒）
       */
      calculateDuration(player, skillLevel = 1) {
        const baseCd = SKILL_CONFIG.storm_walker.R.cd || 60
        return Math.max(1, Math.ceil(baseCd / 2))
      }
    },

    /**
     * R_EX1技能 - 风暴之力EX1-暴击率加成（被动技能）
     * 增强风暴之力，释放期间自身获得暴击率加成
     * 1级即为最大熟练度，默认满级效果：暴击率+10%
     * 技能图片、音效与风暴之力一致
     * 解锁等级：175级
     */
    R_EX1: {
      id: 'storm_walker_r_ex1',
      key: 'R_EX1',
      name: '风暴之力EX1-暴击率加成',
      icon: '/pt/skill_icon/fengbaokuangren.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：风暴之力持续期间，自身暴击率+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 175,
      growthLine: 'storm_wings',

      unlockCondition(player) {
        return player.level >= 175
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_frenzy_critical_rate',
          criticalRate: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴之力EX1提供的暴击率百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 暴击率百分比加成（固定10）
       */
      getCriticalRateBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * R_EX2技能 - 风暴之力EX2-暴击伤害加成（被动技能）
     * 增强风暴之力，释放期间自身获得暴击伤害加成
     * 1级即为最大熟练度，默认满级效果：暴击伤害+10%
     * 技能图片、音效与风暴之力一致
     * 解锁等级：180级
     */
    R_EX2: {
      id: 'storm_walker_r_ex2',
      key: 'R_EX2',
      name: '风暴之力EX2-暴击伤害加成',
      icon: '/pt/skill_icon/fengbaokuangren.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：风暴之力持续期间，自身暴击伤害+10%。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 180,
      growthLine: 'storm_wings',

      unlockCondition(player) {
        return player.level >= 180
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_frenzy_critical_damage',
          criticalDamage: {
            base: 10,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴之力EX2提供的暴击伤害百分比加成
       * 1级即为最大熟练度，固定返回10%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 暴击伤害百分比加成（固定10）
       */
      getCriticalDamageBonus(skillLevel = 1) {
        return 10
      }
    },

    /**
     * R_EX3技能 - 风暴之力EX3-生命偷取（被动技能）
     * 增强风暴之力，释放期间获得生命偷取效果
     * 1级即为最大熟练度，默认满级效果：BUFF持续期间获得3%生命偷取
     * 技能图片、音效与风暴之力一致
     * 解锁等级：190级
     */
    R_EX3: {
      id: 'storm_walker_r_ex3',
      key: 'R_EX3',
      name: '风暴之力EX3-生命偷取',
      icon: '/pt/skill_icon/fengbaokuangren.png',
      audio: '/sound/PcSkillD-Berzerke.wav',
      description: '被动技能：风暴之力持续期间，获得3%生命偷取。',
      type: SKILL_TYPES.UTILITY,
      element: ELEMENT_TYPES.WIND,
      isPassive: true,
      cd: 0,
      manaCost: 0,
      unlockLevel: 190,
      growthLine: 'storm_wings',

      unlockCondition(player) {
        return player.level >= 190
      },

      proficiency: {
        level: 1,
        exp: 0,
        maxLevel: 1,
        effect: {
          type: 'storm_frenzy_life_steal',
          lifeSteal: {
            base: 3,
            increment: 0,
            rate: true
          }
        }
      },

      /**
       * 获取风暴之力EX3提供的生命偷取百分比
       * 1级即为最大熟练度，固定返回3%
       * @param {number} skillLevel - 技能熟练度等级（忽略，固定返回满级效果）
       * @returns {number} 生命偷取百分比（固定3）
       */
      getLifeStealBonus(skillLevel = 1) {
        return 3
      }
    }
  }
}

/**
 * 通用技能水弹配置
 * 终极武器属性附加技能
 */
export const COMMON_SKILLS = {
  // 水弹 - 终极武器附加技能
  waterBullet: {
    id: 11389,
    key: 'waterBullet',
    name: '水弹',
    icon: '/pt/skill_icon/shuidan.png',
    audio: 'PcSkillM-Waterball.wav',
    description: '释放一颗水弹对敌人造成伤害',
    type: SKILL_TYPES.SINGLE,
    element: ELEMENT_TYPES.WATER,
    baseDamage: 3000,
    cd: 0, // 无冷却，由武器触发
    manaCost: 0, // 无消耗，由武器触发
    source: 'ultimate_weapon', // 来源：终极武器

    /**
     * 计算水弹技能伤害
     * 伤害公式：基础伤害 + 智力*2 + 体质*2 + 力量*2 + 敏捷*2 + 平均攻击力
     * @param {Object} player - 玩家对象
     * @param {number} skillLevel - 技能等级（默认1级）
     * @returns {number} 计算后的伤害值
     */
    calculateDamage(player, skillLevel = 1) {
      const baseDamage = this.baseDamage
      const intDamage = Number(player.stats?.intelligence || 0) * 2
      // 兼容 constitution 和 stamina 字段名
      const staValue = player.stats?.constitution || player.stats?.stamina || 0
      const staDamage = Number(staValue) * 2
      const strDamage = Number(player.stats?.strength || 0) * 2
      const dexDamage = Number(player.stats?.dexterity || player.stats?.agility || 0) * 2

      // 使用平均攻击力（minAttack 和 maxAttack 的平均值）
      const minAttack = Number(player.minAttack || 0)
      const maxAttack = Number(player.maxAttack || 0)
      const attackDamage = Math.floor((minAttack + maxAttack) / 2 * 0.3)

      return baseDamage + intDamage + staDamage + strDamage + dexDamage + attackDamage
    }
  }
}

/**
 * 成长线路配置
 * 定义各职业的特殊成长线路，用于将特定技能分组到独立的成长线路中展示
 * key: 职业名称, value: 该职业的成长线路配置数组
 * @type {Record<string, Array<{key: string, name: string, icon: string, description: string}>>}
 */
export const GROWTH_LINES = {
  // 爆裂射手 - 六条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  fierce_shooter: [
    {
      key: 'storm_arrows_w',
      name: '暴风连矢',
      icon: '/pt/skill_icon/barrage.png',
      description: '暴风连矢进阶链：166级→暴风连矢 190级→暴风连矢EX'
    },
    {
      key: 'storm_arrows_u',
      name: '暴风箭矢',
      icon: '/pt/skill_icon/baofengjianshi.png',
      description: '暴风箭矢进阶链：166级→暴风箭矢 175级→暴风箭矢EX1-CD减少 190级→暴风箭矢EX2-伤害增加'
    },
    {
      key: 'storm_arrows_i',
      name: '狂风连射',
      icon: '/pt/skill_icon/kuangfenglianshe.png',
      description: '狂风连射进阶链：166级→狂风连射 175级→狂风连射EX1-CD减少 190级→狂风连射EX2-伤害增加'
    },
    {
      key: 'weak_point',
      name: '弱点射击',
      icon: '/pt/skill_icon/devastatingsting.png',
      description: '弱点射击：170级解锁，后续待定'
    },
    {
      key: 'eagle_eye',
      name: '鹰眼',
      icon: '/pt/skill_icon/headshot.png',
      description: '鹰眼进阶链：175级→鹰眼 180级→鹰眼EX'
    },
    {
      key: 'weapon_mastery_bow',
      name: '武器精通-弓箭',
      icon: '/pt/skill_icon/gongjianjingtong.png',
      description: '武器精通进阶链：166级→武器精通-弓箭 175级→武器精通-弓箭EX 190级→武器精通-弓箭EX2'
    },
    {
      key: 'eagle_descent',
      name: '神鹰降临',
      icon: '/pt/skill_icon/shenyingjianglin.png',
      description: '神鹰降临进阶链：180级→神鹰EX 185级→神鹰-寂灭龙卷风 190级'
    }
  ],

  // 格斗宗师 - 六条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  combat_master: [
    {
      key: 'grandmaster_authority',
      name: '宗师之威',
      icon: '/pt/skill_icon/zongshizhiwei.png',
      description: '宗师之威进阶链：175级→宗师之威 180级→宗师之威EX1-增强防御力 190级→宗师之威EX2-增强魔力上限'
    },
    {
      key: 'nensphere',
      name: '龟派气功',
      icon: '/pt/skill_icon/nensphere.png',
      description: '龟派气功进阶链：166级→龟派气功 175级→龟派气功EX1-CD减少 185级→龟派气功EX2-伤害增加 190级→龟派气功EX3-多段伤害'
    },
    {
      key: 'dragon_fist_break',
      name: '龙拳-破劲',
      icon: '/pt/skill_icon/longquanpojin.png',
      description: '龙拳-破劲进阶链：170级→龙拳-破劲 175级→龙拳-破劲EX1-CD减少 185级→龙拳-破劲EX2-伤害增加'
    },
    {
      key: 'aura_bomb',
      name: '念气能量弹',
      icon: '/pt/skill_icon/aurabomb.png',
      description: '念气能量弹进阶链：166级→念气能量弹 175级→念气能量弹EX1-CD减少 185级→念气能量弹EX2-伤害增加'
    },
    {
      key: 'weapon_mastery_knuckle',
      name: '武器精通-拳套',
      icon: '/pt/skill_icon/quantaojingtong.png',
      description: '武器精通进阶链：166级→武器精通-拳套 175级→武器精通-拳套EX1-伤害增加 190级→武器精通-拳套EX2-伤害增加'
    },
    {
      key: 'dragon_force',
      name: '龙之劲',
      icon: '/pt/skill_icon/longjin.png',
      description: '龙之劲进阶链：166级→龙之劲 175级→龙之劲EX1-减少触发次数 190级→龙之劲EX2-倍攻'
    }
  ],

  // 炽天使 - 八条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  nature_messenger: [
    {
      key: 'holy_sanctuary',
      name: '圣光庇护',
      icon: '/pt/skill_icon/shengguangbihu.png',
      description: '圣光庇护进阶链：175级→圣光庇护 180级→圣光庇护EX1-恢复魔法值 190级→圣光庇护EX2-受伤恢复'
    },
    {
      key: 'holy_judgment',
      name: '圣光审判',
      icon: '/pt/skill_icon/shengguangshenpan.png',
      description: '圣光审判进阶链：170级→圣光审判 175级→圣光审判EX1-CD减少 185级→圣光审判EX2-伤害增加'
    },
    {
      key: 'thunder_hammer',
      name: '雷神之锤',
      icon: '/pt/skill_icon/leishenzhichui.png',
      description: '雷神之锤进阶链：166级→雷神之锤 175级→雷神之锤EX1-CD减少 185级→雷神之锤EX2-伤害增加 190级→雷神之锤EX3-倍攻'
    },
    {
      key: 'angel_wrath',
      name: '天使之怒',
      icon: '/pt/skill_icon/tianshizhinu.png',
      description: '天使之怒进阶链：166级→天使之怒 175级→天使之怒EX1-CD减少 185级→天使之怒EX2-伤害增加 190级→天使之怒EX3-多段攻击'
    },
    {
      key: 'weapon_mastery_staff',
      name: '武器精通-魔棒',
      icon: '/pt/skill_icon/mobangjingtong.png',
      description: '武器精通进阶链：166级→武器精通-魔棒 175级→武器精通-魔棒EX1-伤害增加 190级→武器精通-魔棒EX2-伤害增加'
    },
    {
      key: 'holy_accumulation',
      name: '圣光积累',
      icon: '/pt/skill_icon/shengguangjilei.png',
      description: '圣光积累进阶链：166级→圣光积累 175级→圣光积累EX1-减少触发次数 190级→圣光积累EX2-倍攻治疗'
    },
    {
      key: 'angel_wings',
      name: '天使之翼',
      icon: '/pt/skill_icon/tianshizhiyi.png',
      description: '天使之翼进阶链：170级→天使之翼 175级→天使之翼EX1-魔法防御力加成 180级→天使之翼EX2-增加生命值 190级→天使之翼EX3-生命护盾'
    }
  ],

  // 暗夜主宰 - 六条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  joker_emperor: [
    {
      key: 'shadow_escape',
      name: '暗影主宰领域',
      icon: '/pt/skill_icon/anyingzhuzailingyu.png',
      description: '暗影主宰领域进阶链：175级→暗影主宰领域 180级→暗影主宰领域EX1-增强格挡率 190级→暗影主宰领域EX2-增强攻击速度'
    },
    {
      key: 'shadow_raze',
      name: '暗影突袭',
      icon: '/pt/skill_icon/anyingtuxi.png',
      description: '暗影突袭进阶链：166级→暗影突袭 175级→暗影突袭EX1-CD减少 185级→暗影突袭EX2-伤害增加 190级→暗影突袭EX3-倍攻'
    },
    {
      key: 'deadly_poison',
      name: '致命毒刃',
      icon: '/pt/skill_icon/zhimingduren.png',
      description: '致命毒刃进阶链：170级→致命毒刃 175级→致命毒刃EX1-CD减少 185级→致命毒刃EX2-伤害增加'
    },
    {
      key: 'phantom_dance',
      name: '暗影之刃',
      icon: '/pt/skill_icon/anyingzhiren.png',
      description: '暗影之刃进阶链：166级→暗影之刃 175级→暗影之刃EX1-CD减少 185级→暗影之刃EX2-伤害增加'
    },
    {
      key: 'weapon_mastery_yoyo',
      name: '武器精通-飞轮',
      icon: '/pt/skill_icon/criticaljstyoyomaster.png',
      description: '武器精通进阶链：166级→武器精通-飞轮 175级→武器精通-飞轮EX1-伤害增加 190级→武器精通-飞轮EX2-伤害增加'
    },
    {
      key: 'shadow_grudge',
      name: '影之怨',
      icon: '/pt/skill_icon/bloodaccumulation.png',
      description: '影之怨进阶链：166级→影之怨 175级→影之怨EX1-减少触发次数 190级→影之怨EX2-倍攻'
    },
    {
      key: 'shadow_cloak',
      name: '暗影斗篷',
      icon: '/pt/skill_icon/anyingdoupeng.png',
      description: '暗影斗篷进阶链：170级→暗影斗篷 175级→暗影斗篷EX1-CD减少 180级→暗影斗篷EX2-增加闪避次数 190级→暗影斗篷EX3-增加爆伤'
    }
  ],

  // 风暴行者(猎杀者) - 七条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  storm_walker: [
    {
      key: 'storm_domain',
      name: '风暴领域',
      icon: '/pt/skill_icon/fengbaolingyu.png',
      description: '风暴领域进阶链：175级→风暴领域 180级→风暴领域EX1-增强暴击率 190级→风暴领域EX2-增强攻击速度'
    },
    {
      key: 'piercing_wind',
      name: '狂风绝刃',
      icon: '/pt/skill_icon/kuangfengjueren.png',
      description: '狂风绝刃进阶链：166级→狂风绝刃 175级→狂风绝刃EX1-CD减少 185级→狂风绝刃EX2-伤害增加 190级→狂风绝刃EX3-倍攻'
    },
    {
      key: 'frost_mark',
      name: '风暴印记',
      icon: '/pt/skill_icon/fengbaoyinji.png',
      description: '风暴印记进阶链：170级→风暴印记 175级→风暴印记EX1-CD减少 185级→风暴印记EX2-伤害增加'
    },
    {
      key: 'storm_rain',
      name: '狂风绝息斩',
      icon: '/pt/skill_icon/kuangfengjuexizhan.png',
      description: '狂风绝息斩进阶链：166级→狂风绝息斩 175级→狂风绝息斩EX1-CD减少 185级→狂风绝息斩EX2-伤害增加'
    },
    {
      key: 'storm_blade_mastery',
      name: '武器精通-副手武器',
      icon: '/pt/skill_icon/shuangchijingtong.png',
      description: '武器精通进阶链：166级→武器精通-副手武器 170级→武器精通-副手武器EX1-伤害增加 180级→武器精通-副手武器EX2-伤害增加2 190级→武器精通-副手武器EX3-副手武器倍攻'
    },
    {
      key: 'wind_accumulation',
      name: '风之积累',
      icon: '/pt/skill_icon/fengzhijilei.png',
      description: '风之积累进阶链：166级→风之积累 175级→风之积累EX1-减少触发次数 190级→风之积累EX2-倍攻'
    },
    {
      key: 'storm_wings',
      name: '风暴之力',
      icon: '/pt/skill_icon/fengbaokuangren.png',
      description: '风暴之力进阶链：170级→风暴之力 175级→风暴之力EX1-暴击率加成 180级→风暴之力EX2-暴击伤害加成 190级→风暴之力EX3-生命偷取'
    }
  ],

  // 圣殿骑士 - 七条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  holy_knight: [
    {
      key: 'holy_bulwark',
      name: '神圣壁垒',
      icon: '/pt/skill_icon/shenshengbilei.png',
      description: '神圣壁垒进阶链：175级→神圣壁垒 180级→神圣壁垒EX1-增强生命值 185级→神圣壁垒EX2-增强伤害减免 190级→神圣壁垒EX3-伤害分担'
    },
    {
      key: 'shield_bash',
      name: '荣耀之剑',
      icon: '/pt/skill_icon/rongyaozhijian.png',
      description: '荣耀之剑进阶链：166级→荣耀之剑 175级→荣耀之剑EX1-CD减少 185级→荣耀之剑EX2-伤害增加 190级→荣耀之剑EX3-倍攻'
    },
    {
      key: 'armor_shatter',
      name: '碎甲圣裁',
      icon: '/pt/skill_icon/suijiashengcai.png',
      description: '碎甲圣裁进阶链：170级→碎甲圣裁 175级→碎甲圣裁EX1-CD减少 185级→碎甲圣裁EX2-伤害增加 190级→碎甲圣裁EX3-双倍惩戒强化'
    },
    {
      key: 'holy_judgment_aoe',
      name: '圣殿裁决',
      icon: '/pt/skill_icon/shengdiancaijue.png',
      description: '圣殿裁决进阶链：166级→圣殿裁决 175级→圣殿裁决EX1-CD减少 185级→圣殿裁决EX2-伤害增加'
    },
    {
      key: 'heavy_armor_mastery',
      name: '重甲精通',
      icon: '/pt/skill_icon/zhongjiajingtong.png',
      description: '重甲精通进阶链：166级→重甲精通 170级→重甲精通EX1-属性抗性增强 180级→重甲精通EX2-增强生命值 190级→重甲精通EX3-概率减伤'
    },
    {
      key: 'holy_accumulation',
      name: '裁决积累',
      icon: '/pt/skill_icon/caijuejilei.png',
      description: '裁决积累进阶链：166级→裁决积累 175级→裁决积累EX1-减少触发次数 190级→裁决积累EX2-倍攻'
    },
    {
      key: 'shield_awakening',
      name: '圣盾觉醒',
      icon: '/pt/skill_icon/shengdunjuexing.png',
      description: '圣盾觉醒进阶链：170级→圣盾觉醒 175级→圣盾觉醒EX1-伤害减免 180级→圣盾觉醒EX2-属性强化 190级→圣盾觉醒EX3-受伤反弹'
    }
  ],

  // 奥术师 - 七条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  arcane_master: [
    {
      key: 'arcane_resonance',
      name: '奥术共鸣',
      icon: '/pt/skill_icon/aoshugongming.png',
      description: '奥术共鸣进阶链：175级→奥术共鸣 180级→奥术共鸣EX1-增强法力 185级→奥术共鸣EX2-法术穿透 190级→奥术共鸣EX3-法术暴击'
    },
    {
      key: 'void_fission',
      name: '虚空寂灭',
      icon: '/pt/skill_icon/xukongjimie.png',
      description: '虚空寂灭进阶链：166级→虚空寂灭 175级→虚空寂灭EX1-CD减少 185级→虚空寂灭EX2-伤害增加 190级→虚空寂灭EX3-法术连击'
    },
    {
      key: 'element_collapse',
      name: '元素崩坏',
      icon: '/pt/skill_icon/yuansubenghuai.png',
      description: '元素崩坏进阶链：170级→元素崩坏 175级→元素崩坏EX1-CD减少 185级→元素崩坏EX2-伤害增加 190级→元素崩坏EX3-元素易伤强化'
    },
    {
      key: 'arcane_nova',
      name: '奥术新星',
      icon: '/pt/skill_icon/aoshuxinxing.png',
      description: '奥术新星进阶链：166级→奥术新星 175级→奥术新星EX1-CD减少 185级→奥术新星EX2-伤害增加 190级→奥术新星EX3-多段攻击'
    },
    {
      key: 'arcane_mastery',
      name: '奥术精通',
      icon: '/pt/skill_icon/aoshujingtong.png',
      description: '奥术精通进阶链：166级→奥术精通 170级→奥术精通EX1-法力涌动 180级→奥术精通EX2-元素亲和 190级→奥术精通EX3-法术吸收'
    },
    {
      key: 'arcane_charge',
      name: '奥术充能',
      icon: '/pt/skill_icon/aoshuchongneng.png',
      description: '奥术充能进阶链：166级→奥术充能 175级→奥术充能EX1-减少触发次数 190级→奥术充能EX2-法术连锁'
    },
    {
      key: 'arcane_overload',
      name: '奥术超载',
      icon: '/pt/skill_icon/aoshuchaozai.png',
      description: '奥术超载进阶链：170级→奥术超载 175级→奥术超载EX1-法力护盾 180级→奥术超载EX2-元素共鸣 190级→奥术超载EX3-法术反弹'
    }
  ],

  // 心灵师 - 七条独立成长线路（每个技能单独一排，后续可各自扩展进阶）
  mind_master: [
    {
      key: 'mind_resonance',
      name: '心灵感应',
      icon: '/pt/skill_icon/xinlingganying.png',
      description: '心灵感应进阶链：175级→心灵感应 180级→心灵感应EX1-精神屏障 185级→心灵感应EX2-心灵共鸣 190级→心灵感应EX3-精神统御'
    },
    {
      key: 'mind_tear',
      name: '星思坠寂',
      icon: '/pt/skill_icon/xingsizhuiji.png',
      description: '星思坠寂进阶链：166级→星思坠寂 175级→星思坠寂EX1-CD减少 185级→星思坠寂EX2-伤害增加 190级→星思坠寂EX3-精神连击'
    },
    {
key: 'consciousness_collapse',
name: '意识崩塌',
icon: '/pt/skill_icon/yishibengta.png',
      description: '意识崩塌进阶链：170级→意识崩塌 175级→意识崩塌EX1-CD减少 185级→意识崩塌EX2-伤害增加 190级→意识崩塌EX3-精神虚弱强化'
    },
    {
      key: 'mind_nova',
      name: '万绪沉宵',
      icon: '/pt/skill_icon/wanxuchenxiao.png',
      description: '万绪沉宵进阶链：166级→万绪沉宵 175级→万绪沉宵EX1-CD减少 185级→万绪沉宵EX2-伤害增加 190级→万绪沉宵EX3-心灵震荡'
    },
    {
      key: 'mind_mastery',
      name: '星念凝徽',
      icon: '/pt/skill_icon/xingnianninghui.png',
      description: '星念凝徽进阶链：166级→星念凝徽 170级→星念凝徽EX1-暴击强化 180级→星念凝徽EX2-精神壁垒 190级→星念凝徽EX3-精神回复'
    },
    {
      key: 'mind_charge',
      name: '碎思归墟',
      icon: '/pt/skill_icon/suisiguixu.png',
      description: '碎思归墟进阶链：166级→碎思归墟 175级→碎思归墟EX1-减少触发次数 190级→碎思归墟EX2-心灵连锁'
    },
    {
      key: 'mind_awakening',
      name: '心灵觉醒',
      icon: '/pt/skill_icon/xinlingjuexing.png',
      description: '心灵觉醒进阶链：170级→心灵觉醒 175级→心灵觉醒EX1-精神护盾 180级→心灵觉醒EX2-心灵共振 190级→心灵觉醒EX3-精神反射'
    }
  ]
}

/**
 * 获取职业的成长线路配置
 * @param {string} className - 职业名称
 * @returns {Array<{key: string, name: string, icon: string, description: string}>} 成长线路配置数组，无配置时返回空数组
 */
export function getGrowthLines(className) {
  return GROWTH_LINES[className] || []
}

// 获取职业技能
export function getClassSkills(className) {
  return SKILL_CONFIG[className] || {}
}

// 获取特定技能
export function getSkill(className, skillKey) {
  const classSkills = SKILL_CONFIG[className]
  if (!classSkills) {
    return null
  }

  return classSkills[skillKey] || null
}

// 获取所有可用技能键
export function getSkillKeys() {
  return ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
}

// 检查技能是否解锁
export function isSkillUnlocked(player, className, skillKey) {
  const skill = getSkill(className, skillKey)
  if (!skill || !player) {
    return false
  }

  const playerLevel = Number(player.level || 0)
  if (skill.unlockLevel && playerLevel < skill.unlockLevel) {
    return false
  }

  if (skill.unlockCondition && typeof skill.unlockCondition === 'function') {
    try {
      if (!skill.unlockCondition(player)) {
        return false
      }
    } catch (error) {
      console.error(`检查技能 ${skill?.name || skill?.key || ''} 解锁条件时出错:`, error)
      return false
    }
  }

  return true
}

// 计算技能伤害
export function calculateSkillDamage(
  player,
  className,
  skillKey,
  skillLevel = 1,
  enemyElement = null
) {
  const skill = getSkill(className, skillKey)
  if (!skill || !skill.calculateDamage) {
    return 0
  }

  return skill.calculateDamage(player, skillLevel, enemyElement)
}

// 计算技能治疗效果
export function calculateSkillHealing(player, className, skillKey, skillLevel = 1) {
  const skill = getSkill(className, skillKey)
  if (!skill || !skill.calculateHealing) {
    return 0
  }

  return skill.calculateHealing(player, skillLevel)
}

// 计算BUFF效果
export function calculateSkillBuff(className, skillKey, skillLevel = 1, player = null) {
  const skill = getSkill(className, skillKey)
  if (!skill || !skill.calculateBuff) {
    return null
  }

  return skill.calculateBuff(player, skillLevel)
}

export default {
  SKILL_TYPES,
  ELEMENT_TYPES,
  SKILL_CONFIG,
  COMMON_SKILLS,
  GROWTH_LINES,
  getClassSkills,
  getSkill,
  getSkillKeys,
  getGrowthLines,
  isSkillUnlocked,
  calculateSkillDamage,
  calculateSkillHealing,
  calculateSkillBuff
}
