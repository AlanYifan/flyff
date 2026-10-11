/**
 * @fileoverview 武器唤醒组合式函数
 * @description 处理武器/盾牌唤醒逻辑的组合式函数
 * @author FLYFF Team
 * @version 1.0.0
 * @created 2026-03-13
 */

import { SKILL_INFO } from '@/data/SKILL_INFO.js'
import { getParameterName } from '@/store/descriptions.js'

// 唤醒数据缓存
let awakeningDataCache = null

/**
 * 加载唤醒数据
 * @returns {Promise<Object>} 唤醒数据
 */
const loadAwakeningData = async () => {
  if (awakeningDataCache) {
    return awakeningDataCache
  }

  try {
    const response = await fetch('/data/awake_skills.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    awakeningDataCache = await response.json()
    return awakeningDataCache
  } catch (error) {
    console.error('[useWeaponAwakening] 加载唤醒数据失败:', error)
    return {}
  }
}

/**
 * 武器类型映射
 * 将武器的subcategory或武器类型映射到唤醒数据中的键名
 */
const WEAPON_TYPE_MAP = {
  // 弓箭
  bow: 'bow',
  // 溜溜球
  yoyo: 'yoyo',
  // 法杖
  stick: 'stick',
  // 拳套
  knuckle: 'knuckle',
  // 剑或斧
  sword: 'swordoraxe',
  axe: 'swordoraxe',
  swordoraxe: 'swordoraxe',
  // 法杖（杖）
  staff: 'staff',
  // 魔法棒或法杖
  wand: 'wandorstaff',
  wandorstaff: 'wandorstaff',
  // 盾牌
  shield: 'shield'
}

/**
 * 稀有度映射到唤醒数据中的品质键名
 */
const RARITY_TO_QUALITY = {
  common: 'uncommon',
  uncommon: 'uncommon',
  rare: 'rare',
  veryrare: 'rare',
  unique: 'unique',
  ultimate: 'unique',
  mythic: 'unique'
}

/**
 * 参数名称映射（中文名称）- 唤醒专用
 * 属性防御使用 Pinia 统一映射，这里只保留唤醒特有的参数
 */
const PARAMETER_NAMES = {
  block: '格挡率',
  reflectdamage: '伤害反射',
  magicdefense: '魔法防御',
  criticalresist: '暴击抵抗',
  // 属性防御使用 Pinia 统一映射
  bleedandpoisonresist: '出血/中毒抵抗',
  healing: '治疗效果'
}

/**
 * 使用武器唤醒组合式函数
 * @returns {Object} 武器唤醒相关的方法
 */
export function useWeaponAwakening() {
  /**
   * 获取武器类型键名
   * @param {Object} weapon - 武器对象
   * @returns {string|null} 武器类型键名
   */
  const getWeaponTypeKey = weapon => {
    if (!weapon) return null

    // 盾牌特殊处理
    if (weapon.category === 'shield') {
      return 'shield'
    }

    // 武器类型
    const subcategory = weapon.subcategory || weapon.weaponType || ''
    const category = weapon.category || ''

    // 尝试匹配武器类型
    for (const [key, value] of Object.entries(WEAPON_TYPE_MAP)) {
      if (subcategory.toLowerCase().includes(key) || category.toLowerCase().includes(key)) {
        return value
      }
    }

    return null
  }

  /**
   * 获取技能名称（优先中文，无中文时尝试翻译英文）
   * @param {number|string} skillId - 技能ID
   * @returns {string} 技能名称（中文）
   */
  const getSkillNameById = skillId => {
    // SKILL_INFO 的 key 是字符串类型，确保传入的是字符串
    const skillIdStr = String(skillId)
    const skill = SKILL_INFO[skillIdStr]
    if (skill && skill.name) {
      const cns = skill.name.cns || ''
      const en = skill.name.en || ''
      // 如果有中文翻译且不是英文（检查是否包含中文字符）
      if (cns && cns !== en && /[一-龥]/.test(cns)) {
        return cns
      }
      // 否则尝试翻译英文技能名
      if (en) {
        return translateSkillName(en)
      }
      return `技能ID: ${skillId}`
    }
    return `技能ID: ${skillId}`
  }

  /**
   * 翻译技能名称（英文转中文）
   * @param {string} enName - 英文技能名
   * @returns {string} 中文技能名
   */
  const translateSkillName = enName => {
    const translations = {
      // 弓箭技能
      'Ice Arrow': '冰箭',
      'Fire Arrow': '火焰箭',
      'Poison Arrow': '毒箭',
      'Arrow Rain': '箭雨',
      'Perfect Arrow': '完美之箭',
      'Silent Arrow': '静默之箭',
      'Guided Arrow': '导向箭',
      'Auto Shot': '自动射击',
      'Quick Shot': '快速射击',
      'Vital Shot': '致命射击',
      'Aimed Shot': '瞄准射击',
      'Piercing Arrow': '穿刺箭',
      'Explosion Arrow': '爆裂箭',
      'Arrow Bomb': '炸弹箭',
      'Sharpshooter': '神射手',
      'Burst Shot': '爆发射击',
      
      // 溜溜球技能
      'Yo-Yo Attack': '溜溜球攻击',
      'Double Yo-Yo': '双溜溜球',
      'Piercing Yo-Yo': '穿刺溜溜球',
      'Cross Line': '交叉线',
      'Vertical Slash': '垂直斩击',
      'Horizontal Slash': '横向斩击',
      'Fast Shot': '快速射击',
      'Snatch': '夺取',
      'Counter Attack': '反击',
      'Perfect Counter': '完美反击',
      'Vital stab': '致命刺击',
      'Sneak Attack': '偷袭',
      'Burst Crack': '爆裂击',
      'Hit of Penya': '金币攻击',
      'Wild Shock': '狂野冲击',
      
      // 法杖技能
      'Holy Cross': '神圣十字',
      'Holy Guardian': '神圣守护',
      'Heal': '治疗',
      'Healing Hand': '治愈之手',
      'Heal Rain': '治愈之雨',
      'Resurrection': '复活',
      'Buff': '增益',
      'Mental Sign': '精神印记',
      'Quick Step': '快速步伐',
      'Patience': '耐心',
      'Heap Up': '堆叠',
      'Haste': '急速',
      'Cat\'s Reflex': '猫之反射',
      'Cannon Ball': '炮弹',
      'Protect': '保护',
      'Holy Light': '圣光',
      'Spirit Fortune': '精神祝福',
      'Blessing of Wisdom': '智慧祝福',
      'Blessing of Health': '健康祝福',
      'Holy Ward': '神圣庇护',
      'Aura of Holy Light': '圣光光环',
      
      // 拳套技能
      'Power Fist': '力量拳',
      'Knuckle Attack': '拳套攻击',
      'Bash': '猛击',
      'Punch': '拳击',
      'Smite': '重击',
      'Power Knuckle': '强力拳套',
      'Sonichand': '音速手',
      'Asmodeus': '阿斯莫德',
      'Bgvur Tialbold': '魔拳',
      'Hand of God': '神之手',
      'Pain Dealer': '痛苦贩子',
      
      // 剑/斧技能
      'Blade Attack': '剑攻击',
      'Blade Dance': '剑舞',
      'Sword Attack': '剑攻击',
      'Axe Attack': '斧攻击',
      'Power Attack': '力量攻击',
      'Rage': '狂怒',
      'Power Swing': '力量挥击',
      'Blindside': '盲点攻击',
      'Sword Mastery': '剑术精通',
      'Axe Mastery': '斧术精通',
      'Smite Axe': '重斧',
      'Smite Sword': '重剑',
      'Guillotine': '断头台',
      'Berserk': '狂暴',
      'Armor Penetrate': '护甲穿透',
      'Triple Attack': '三连击',
      'Pain Reflection': '痛苦反射',
      'Empower Weapon': '武器强化',
      'Bloodaxe': '血斧',
      'Blazing Sword': '烈焰剑',
      'Silent Strike': '静默打击',
      'Keenwheel': '锋利轮',
      'Splmash': '飞溅',
      'Shadowdancer': '暗影舞者',
      'Springwaterfall': '瀑布',
      'SwordCross': '十字剑',
      'Double Attack': '双重攻击',
      'Hacking': '砍劈',
      'Economic': '经济',
      'Shadow Escape': '暗影逃脱',
      'Block': '格挡',
      'Parry': '招架',
      'Dark Illusion': '暗黑幻影',
      'Stealth': '潜行',
      'Backstab': '背刺',
      'Cripple': '致残',
      'Vital Attack': '致命攻击',
      'Blink': '闪现',
      
      // 杖技能
      'Staff Attack': '杖攻击',
      'Fireball': '火球术',
      'Fire Strike': '火焰打击',
      'Fire Circle': '火焰圆环',
      'Fire Shield': '火焰护盾',
      'Ice Missile': '冰导弹',
      'Ice Shard': '冰碎片',
      'Lightning Bolt': '闪电箭',
      'Lightning Shock': '闪电冲击',
      'Lightning Storm': '闪电风暴',
      'Wind Blade': '风刃',
      'Wind Cutter': '风切',
      'Earth Spike': '地刺',
      'Earthquake': '地震',
      'Water Ball': '水球术',
      'Water Wave': '水波',
      'Meteor': '陨石',
      'Mental Pierce': '精神穿刺',
      'Psychic Bomb': '心灵炸弹',
      'Psychic Square': '心灵广场',
      'Demonology': '恶魔学',
      'Satanology': '撒旦学',
      'Elemental Change': '元素变换',
      'Spirit Bomb': '灵爆',
      'Merkaba Hanzelrusha': '神圣攻击',
      'Spiriture Fortune': '精神祝福',
      'Holyguard': '神圣守护',
      'Geburah Tiphreth': '神之审判',
      'Armor Safeguard': '护甲守护',
      'Eternal Refinement': '永恒精炼',
      'Meteor Strike': '陨石打击',
      'Mana Storm': '魔法风暴',
      'Mage Dash': '法师冲刺',
      
      // 魔法棒技能
      'Wand Attack': '魔法棒攻击',
      'Magic Attack': '魔法攻击',
      'Wand Mastery': '魔法棒精通',
      'Magic Missile': '魔法飞弹',
      'Stone Spike': '岩石尖刺',
      'Stone Crash': '岩石崩塌',
      'Quagmire': '泥沼',
      'Gava Dolta': '重力压制',
      'Cursed Magic': '诅咒魔法',
      'Envenom': '中毒',
      'Shining Sword': '闪光剑',
      'Mental Master': '精神大师',
      'Magic Strength': '魔法强度',
      'Evanescence': '消散',
      'Power System': '能量系统',
      'Effect Protection': '效果保护',
      'Mental Storm': '精神风暴',
      
      // 其他常用技能名
      'Critical Swing': '暴击挥击',
      'Critical Attack': '暴击攻击',
      'Power Charge': '力量冲锋',
      'Charge': '冲锋',
      'Stun': '眩晕',
      'Slow': '减速',
      'Poison': '中毒',
      'Burn': '燃烧',
      'Freeze': '冻结',
      'Shock': '电击',
      'Bleed': '流血',
      'Curse': '诅咒',
      'Weaken': '虚弱',
      'Silence': '沉默',
      'Blind': '致盲',
      'Knockback': '击退',
      'Knockdown': '击倒',
      'Disarm': '缴械',

      // 弓箭技能（补充）
      'Repelling Shot': '击退射击',
      'Heavy Shot': '重型射击',
      'Condor Dive': '神鹰俯冲',

      // 溜溜球技能（补充）
      "Harlequin's Greeting": '暗夜主宰问候',
      "Harlequin's Charge": '暗夜主宰冲锋',
      'Toxic Assault': '剧毒突袭',
      'Yo-Yo Storm': '溜溜风暴',
      'Toxic Cloud': '毒云',

      // 法杖技能（补充）
      'Hammer of Judgement': '审判之锤',
      'Flow of Salvation': '救赎之流',

      // 拳套技能（补充）
      'Nen Sphere': '念气弹',
      'Power Palm': '力量掌',
      'Aura Bomb': '念气弹',

      // 剑/斧技能（补充）
      'Staggering Strike': '踉跄打击',
      'Initiating Strike': '起手打击',
      'Maelstrom Strike': '漩涡打击',
      'Execution of Justice': '正义处决',
      'Stigma I': '烙印I',
      'Cross of Blood': '血十字',
      'Storm Slash': '风暴斩',
      'Rush Attack': '冲刺攻击',
      'Shield Crush': '盾击',
      'Stigma III': '烙印III',
      'Bloody Rush': '血冲',
      'Storm Strike': '风暴打击',
      'Sky Splitter': '裂空斩',
      'Stigma II': '烙印II',
      'Bloody Thorn': '血刺',
      'Tempest Barrage': '风暴弹幕',

      // 法杖/魔法棒技能（补充）
      'Gale': '狂风',
      'Ignite': '点燃',
      'Incinerate': '焚化',
      'Swampy Area': '沼泽区域',
      'Tidal Omen': '潮汐预兆',
      'Hellfire': '地狱火',
      'Gust': '阵风',
      'Entangling Roots': '缠绕根须',
      'Stone Pillar': '石柱',
      'EVA Storm': '闪避风暴',

      // 特殊技能（补充）
      "Hexe's Lament": '女巫哀叹',
      "Chimera's Curse": '奇美拉诅咒',
      "Lillith's Gaze": '莉莉丝凝视',
      'Aether Rend': '以太撕裂',
      "Cimetiere's Scream": '墓园尖叫'
    }
    
    return translations[enName] || enName
  }

  /**
   * 根据数值计算获得概率
   * 数值越小概率越高，范围50%-5%
   * @param {number} value - 唤醒值
   * @param {number} minValue - 最小值
   * @param {number} maxValue - 最大值
   * @returns {number} 概率百分比
   */
  const calculateProbability = (value, minValue, maxValue) => {
    // 值越小概率越高：最小值=50%，最大值=5%
    if (maxValue === minValue) return 50
    const range = maxValue - minValue
    const normalizedValue = (value - minValue) / range // 0-1, 0=最小值, 1=最大值
    // 反向计算概率：最小值->50%, 最大值->5%
    const probability = 50 - normalizedValue * 45
    return Math.round(probability)
  }

  /**
   * 根据概率随机选择一个唤醒值
   * @param {Array<number>} values - 可用值数组
   * @returns {number|null} 选中的值，null表示不变
   */
  const rollAwakeningValue = values => {
    if (!values || values.length === 0) return null

    // 50%概率不变
    if (Math.random() < 0.5) {
      return null // 不变
    }

    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    // 为每个值计算概率
    const valueProbabilities = values.map(value => ({
      value,
      probability: calculateProbability(value, minValue, maxValue)
    }))

    // 计算总概率
    const totalProbability = valueProbabilities.reduce((sum, item) => sum + item.probability, 0)

    // 加权随机选择
    let random = Math.random() * totalProbability
    for (const item of valueProbabilities) {
      random -= item.probability
      if (random <= 0) {
        return item.value
      }
    }

    // 兜底返回最小值
    return minValue
  }

  /**
   * 获取可用的唤醒技能列表（带概率）
   * @param {string} weaponTypeKey - 武器类型键名
   * @param {string} rarity - 武器稀有度
   * @returns {Array<Object>} 技能信息数组
   */
  const getAvailableAwakeningSkills = async (weaponTypeKey, rarity = 'uncommon') => {
    const data = await loadAwakeningData()
    if (!data[weaponTypeKey] || !data[weaponTypeKey].skills) {
      return []
    }

    const skills = data[weaponTypeKey].skills
    const result = []

    for (const skillId of Object.keys(skills)) {
      const values = getAvailableValues(skills[skillId], rarity)
      if (values.length > 0) {
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        result.push({
          id: Number(skillId),
          values: values,
          minProbability: calculateProbability(maxValue, minValue, maxValue), // 最大值对应最小概率
          maxProbability: calculateProbability(minValue, minValue, maxValue)  // 最小值对应最大概率
        })
      }
    }

    return result
  }

  /**
   * 获取可用的唤醒参数列表（带概率）
   * @param {string} weaponTypeKey - 武器类型键名
   * @param {string} rarity - 武器稀有度
   * @returns {Array<Object>} 参数信息数组
   */
  const getAvailableAwakeningParameters = async (weaponTypeKey, rarity = 'uncommon') => {
    const data = await loadAwakeningData()
    if (!data[weaponTypeKey] || !data[weaponTypeKey].parameters) {
      return []
    }

    const parameters = data[weaponTypeKey].parameters
    const result = []

    for (const param of Object.keys(parameters)) {
      const values = getAvailableValues(parameters[param], rarity)
      if (values.length > 0) {
        const minValue = Math.min(...values)
        const maxValue = Math.max(...values)
        result.push({
          id: param,
          values: values,
          minProbability: calculateProbability(maxValue, minValue, maxValue),
          maxProbability: calculateProbability(minValue, minValue, maxValue)
        })
      }
    }

    return result
  }

  /**
   * 获取指定品质的可用唤醒值
   * @param {Object} awakeningConfig - 唤醒配置对象
   * @param {string} rarity - 武器稀有度
   * @returns {Array<number>} 可用唤醒值数组
   */
  const getAvailableValues = (awakeningConfig, rarity) => {
    const quality = RARITY_TO_QUALITY[rarity] || 'uncommon'
    return awakeningConfig[quality] || awakeningConfig.uncommon || []
  }

  /**
   * 执行唤醒操作
   * @param {Object} weapon - 武器对象
   * @param {string} weaponTypeKey - 武器类型键名
  * @param {string|null} selectedType - 选中的唤醒类型 (格式: skill_xxx 或 param_xxx)
  * @returns {Promise<Object>} 唤醒结果
  */
  const performAwakening = async (weapon, weaponTypeKey, selectedType = null) => {
    try {
      const data = await loadAwakeningData()
      
      if (!data[weaponTypeKey]) {
        return { success: false, message: '不支持该类型的唤醒' }
      }

      const rarity = weapon.rarity || 'uncommon'

      // 判断是武器还是盾牌
      const isShield = weapon.category === 'shield'

      if (isShield) {
        // 盾牌唤醒：参数类型
        const parameters = data[weaponTypeKey].parameters
        if (!parameters || Object.keys(parameters).length === 0) {
          return { success: false, message: '该盾牌无可用唤醒属性' }
        }

        // 确定要唤醒的参数
        let selectedParam = null
        if (selectedType && selectedType.startsWith('param_')) {
          selectedParam = selectedType.replace('param_', '')
        }

        // 如果没有选择参数，返回错误
        if (!selectedParam) {
          return { success: false, message: '请选择要唤醒的属性' }
        }

        // 获取可用值
        const values = getAvailableValues(parameters[selectedParam], rarity)
        if (values.length === 0) {
          return { success: false, message: '该属性无可用唤醒值' }
        }

        // 根据概率随机选择值
        const rolledValue = rollAwakeningValue(values)
        
        if (rolledValue === null) {
          // 50%概率不变
          return {
            success: true,
            type: 'parameter',
            parameter: selectedParam,
            parameterName: getParameterDisplayName(selectedParam),
            value: null,
            unchanged: true
          }
        }

        return {
          success: true,
          type: 'parameter',
          parameter: selectedParam,
          parameterName: getParameterDisplayName(selectedParam),
          value: rolledValue
        }
      } else {
        // 武器唤醒：技能类型
        const skills = data[weaponTypeKey].skills
        if (!skills || Object.keys(skills).length === 0) {
          return { success: false, message: '该武器无可用唤醒技能' }
        }

        // 确定要唤醒的技能
        let selectedSkillId = null
        if (selectedType && selectedType.startsWith('skill_')) {
          selectedSkillId = selectedType.replace('skill_', '')
        }

        // 如果没有选择技能，返回错误
        if (!selectedSkillId) {
          return { success: false, message: '请选择要唤醒的技能' }
        }

        // 获取可用值
        const values = getAvailableValues(skills[selectedSkillId], rarity)
        if (values.length === 0) {
          return { success: false, message: '该技能无可用唤醒值' }
        }

        // 根据概率随机选择值
        const rolledValue = rollAwakeningValue(values)
        
        if (rolledValue === null) {
          // 50%概率不变
          return {
            success: true,
            type: 'skill',
            skillId: Number(selectedSkillId),
            skillName: getSkillNameById(selectedSkillId),
            value: null,
            unchanged: true
          }
        }

        return {
          success: true,
          type: 'skill',
          skillId: Number(selectedSkillId),
          skillName: getSkillNameById(selectedSkillId),
          value: rolledValue
        }
      }
    } catch (error) {
      console.error('[useWeaponAwakening] 唤醒失败:', error)
      return { success: false, message: '唤醒过程出错' }
    }
  }

  /**
   * 检查武器是否已被唤醒
   * @param {Object} weapon - 武器对象
   * @returns {boolean} 是否已被唤醒
   */
  const isWeaponAwakened = weapon => {
    if (!weapon) return false
    return Boolean(weapon.awakenedSkillData || weapon.awakenedParameterData)
  }

  /**
   * 获取武器的唤醒数据
   * @param {Object} weapon - 武器对象
   * @returns {Object|null} 唤醒数据
   */
  const getWeaponAwakeningData = weapon => {
    if (!weapon) return null
    return weapon.awakenedSkillData || weapon.awakenedParameterData || null
  }

  return {
    getWeaponTypeKey,
    getSkillNameById,
    getAvailableAwakeningSkills,
    getAvailableAwakeningParameters,
    getAvailableValues,
    performAwakening,
    isWeaponAwakened,
    getWeaponAwakeningData
  }
}

/**
 * 获取参数显示名称（使用 Pinia 统一映射）
 * @param {string} param - 参数英文 key
 * @returns {string} 中文显示名称
 */
function getParameterDisplayName (param) {
  // 优先使用 Pinia 统一映射（包含属性防御）
  const piniaName = getParameterName(param)
  if (piniaName !== param) {
    return piniaName
  }
  // 回退到唤醒专用映射
  return PARAMETER_NAMES[param] || param
}
