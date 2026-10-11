/**
 * @fileoverview RPG风格中文随机名称生成器（支持性别区分）
 * 生成2-5个字的符合RPG游戏风格的角色名称，根据性别生成贴合的名称
 * 男性名称偏向阳刚、英武、豪迈风格；女性名称偏向柔美、灵动、婉约风格
 * @author FLYFF Team
 * @since 2026-06-14
 */

/**
 * 姓氏库 - 精选古风/武侠风格姓氏，避免生僻姓氏
 * @type {string[]}
 */
const SURNAMES = [
  // 单姓 - 经典武侠风
  '叶', '林', '苏', '萧', '楚', '顾', '沈', '陆', '秦', '慕',
  '白', '风', '云', '夜', '凌', '寒', '墨', '柳', '宋', '韩',
  '司', '南', '秋', '夏', '冬', '江', '河', '岳', '钟', '方',
  '周', '唐', '宁', '燕', '赵', '卫', '霍',
  // 复姓 - 古风复姓
  '公孙', '慕容', '上官', '独孤', '欧阳', '轩辕', '令狐', '司马', '东方', '南宫', '诸葛'
]

/**
 * 男性名字字库 - 按风格分类，体现阳刚、英武、豪迈气质
 */
const MALE_NAME_CHARS = {
  /**
   * 英武豪侠风 - 刚猛、正义、霸气
   * @type {string[]}
   */
  heroic: [
    '天', '龙', '虎', '鹰', '峰', '岳', '川', '海', '雷', '烈',
    '战', '武', '刚', '毅', '勇', '锋', '剑', '铠', '鼎', '啸',
    '雄', '威', '震', '霸', '煌', '焰', '炽', '乾', '坤', '苍',
    '豪', '杰', '雄', '骁', '猛', '壮', '彪', '悍', '帅', '英'
  ],

  /**
   * 仙侠飘逸风 - 超脱、洒脱、不羁（男性版）
   * @type {string[]}
   */
  ethereal: [
    '尘', '风', '云', '月', '星', '影', '歌', '逸', '清', '玄',
    '虚', '冥', '澜', '澄', '霄', '鹤', '鸿', '鹏', '霄', '霄',
    '逍', '遥', '远', '长', '恒', '极', '无', '归', '踏', '破'
  ],

  /**
   * 温雅儒将风 - 儒雅、内敛、有谋略
   * @type {string[]}
   */
  elegant: [
    '书', '棋', '赋', '章', '文', '墨', '竹', '之', '亦', '然',
    '予', '安', '宁', '和', '润', '谦', '修', '言', '哲', '彦',
    '卿', '瑜', '瑾', '轩', '辰', '明', '朗', '睿', '知', '渊'
  ],

  /**
   * 神秘暗影风 - 诡谲、深沉、冷峻（男性版）
   * @type {string[]}
   */
  shadow: [
    '夜', '暗', '冥', '幽', '劫', '离', '殇', '寂', '灭', '渊',
    '泽', '暮', '枭', '残', '绝', '锁', '封', '隐', '潜', '逝',
    '寒', '刃', '煞', '煞', '厄', '魇', '弑', '噬', '厉', '枭'
  ],

  /**
   * 自然山河风 - 以山川河流为意象（男性版）
   * @type {string[]}
   */
  nature: [
    '麟', '鲸', '鲲', '鸿', '涛', '浪', '潮', '洪', '瀑', '崖',
    '岩', '石', '松', '柏', '枫', '杉', '林', '森', '野', '原',
    '晨', '曙', '曦', '辉', '耀', '灿', '炎', '烽', '炬', '烽'
  ]
}

/**
 * 女性名字字库 - 按风格分类，体现柔美、灵动、婉约气质
 */
const FEMALE_NAME_CHARS = {
  /**
   * 仙姿灵韵风 - 轻灵、空灵、如仙子般（女性版）
   * @type {string[]}
   */
  ethereal: [
    '梦', '烟', '雾', '霜', '雪', '月', '星', '云', '灵', '清',
    '幽', '瑶', '琳', '璃', '幻', '澜', '漪', '泠', '薰', '吟',
    '舞', '歌', '影', '颜', '裳', '袖', '弦', '韵', '音', '笙'
  ],

  /**
   * 英姿飒爽风 - 巾帼不让须眉（女性版）
   * @type {string[]}
   */
  heroic: [
    '凤', '鸢', '鹰', '雁', '翎', '剑', '霜', '冰', '铁', '银',
    '战', '武', '英', '飒', '骁', '勇', '烈', '锋', '锐', '驰',
    '傲', '凌', '震', '越', '破', '烽', '焰', '火', '霓', '虹'
  ],

  /**
   * 温婉如玉风 - 婉约、柔美、如诗如画
   * @type {string[]}
   */
  elegant: [
    '琴', '画', '诗', '词', '兰', '菊', '梅', '荷', '芷', '若',
    '兮', '颜', '卿', '之', '亦', '然', '予', '安', '宁', '和',
    '婉', '柔', '姝', '嫣', '妍', '萱', '薇', '蕊', '蕾', '芸'
  ],

  /**
   * 暗夜幽兰风 - 神秘、冷艳、如夜之花（女性版）
   * @type {string[]}
   */
  shadow: [
    '夜', '暗', '冥', '幽', '离', '殇', '寂', '渊', '泽', '暮',
    '蛊', '隐', '潜', '逝', '奈', '魇', '厄', '咒', '残', '绝',
    '魅', '冥', '幽', '罗', '蝶', '鸩', '绯', '冥', '殇', '冥'
  ],

  /**
   * 花鸟灵兽风 - 以花鸟灵兽为意象（女性版）
   * @type {string[]}
   */
  nature: [
    '鸾', '雀', '莺', '燕', '蝶', '萤', '狐', '鹿', '鹤', '凰',
    '桃', '樱', '棠', '薇', '茜', '芸', '蕊', '蕾', '莲', '芙',
    '溪', '泉', '岚', '霞', '霓', '曦', '露', '涟', '漪', '漫'
  ]
}

/**
 * 男性精选双字名 - 预设好听的男性2字名，确保阳刚、大气
 * @type {string[]}
 */
const CURATED_MALE_TWO_CHAR_NAMES = [
  // 英武刚烈
  '天罡', '烈焰', '傲天', '战歌', '龙吟', '虎啸', '破军', '镇岳',
  '惊雷', '铁骨', '赤焰', '横刀', '震山', '斩风', '擎天', '霸王',
  // 仙侠飘逸
  '无尘', '清风', '流云', '飞鸿', '踏雪', '破晓', '沐风', '凌霄',
  '追星', '长歌', '逍遥', '归尘', '揽月', '驭风', '啸天', '乘风',
  // 温雅儒将
  '如玉', '含章', '知秋', '安然', '临风', '怀瑾', '握瑜', '修竹',
  '观澜', '品茗', '弈棋', '闻韶', '明远', '长卿', '子期', '伯牙',
  // 神秘深沉
  '无极', '幽冥', '暗影', '暮色', '残阳', '潜龙', '断魂', '忘川',
  '深渊', '寂灭', '孤影', '寒刃', '夜行', '奈何', '离恨', '噬魂',
  // 山河壮阔
  '青锋', '白鹤', '金鹏', '苍穹', '山河', '烽火', '长空', '沧海',
  '竹影', '松涛', '晨曦', '霞光', '泉音', '溪月', '兰舟', '梅雪'
]

/**
 * 女性精选双字名 - 预设好听的女性2字名，确保柔美、灵动
 * @type {string[]}
 */
const CURATED_FEMALE_TWO_CHAR_NAMES = [
  // 仙姿灵韵
  '明月', '落霞', '惊鸿', '听雨', '望月', '饮露', '弄琴', '飞雪',
  '流萤', '轻烟', '凝霜', '紫烟', '素心', '清音', '瑶光', '玉笙',
  // 英姿飒爽
  '冰霜', '银翎', '凤鸣', '凌霜', '傲雪', '霜华', '剑舞', '战樱',
  '烈焰', '火凤', '赤霞', '金铃', '银狐', '紫电', '青鸾', '霓裳',
  // 温婉如玉
  '若水', '映雪', '幽兰', '听泉', '弄琴', '含烟', '凝露', '如梦',
  '初晴', '晚照', '柔嘉', '婉清', '芷若', '芸熙', '萱宁', '妍雅',
  // 暗夜幽兰
  '夜薇', '冥蝶', '幽罗', '绯月', '暗香', '残梦', '离歌', '忘忧',
  '影蝶', '魅影', '噬心', '寒霜', '孤月', '冷月', '殇雪', '寂夜',
  // 花鸟灵动
  '花间', '蝶舞', '莺歌', '燕归', '莲心', '芙蓉', '桃夭', '樱落',
  '溪月', '泉音', '霞光', '晨露', '岚烟', '霓裳', '露华', '涟漪'
]

/**
 * 男性特殊格式后缀 - 搭配姓氏形成4-5字名
 * @type {string[]}
 */
const CURATED_MALE_SUFFIXES = [
  '·星辰', '·破晓', '·黎明', '·长歌', '·无名',
  '·流光', '·追风', '·踏雪', '·归尘', '·破天'
]

/**
 * 女性特殊格式后缀 - 搭配姓氏形成4-5字名
 * @type {string[]}
 */
const CURATED_FEMALE_SUFFIXES = [
  '·星辰', '·月华', '·花语', '·雪舞', '·梦歌',
  '·流光', '·朝露', '·晚霞', '·烟雨', '·清风'
]

/**
 * 男性风格权重 - 男性偏向英武和仙侠
 * @type {Object<string, number>}
 */
const MALE_STYLE_WEIGHTS = {
  heroic: 30,    // 英武豪侠风 30%
  ethereal: 25,  // 仙侠飘逸风 25%
  elegant: 15,   // 温雅儒将风 15%
  shadow: 15,    // 神秘暗影风 15%
  nature: 15     // 自然山河风 15%
}

/**
 * 女性风格权重 - 女性偏向仙姿和温婉
 * @type {Object<string, number>}
 */
const FEMALE_STYLE_WEIGHTS = {
  ethereal: 30,  // 仙姿灵韵风 30%
  heroic: 15,    // 英姿飒爽风 15%
  elegant: 25,   // 温婉如玉风 25%
  shadow: 15,    // 暗夜幽兰风 15%
  nature: 15     // 花鸟灵兽风 15%
}

/**
 * 不和谐的字符组合黑名单 - 避免生成读音或寓意不好的名称
 * @type {string[]}
 */
const BAD_COMBOS = [
  '死', '贱', '蠢', '丑', '废', '穷', '屁', '狗', '猪', '笨',
  '滚', '混', '烂', '渣', '毒', '臭', '屎', '尿', '傻', '疯',
  '杀', '打', '砍', '骂', '偷', '抢', '骗'
]

/**
 * 根据权重随机选择名称风格
 * @param {Object<string, number>} weights - 风格权重配置
 * @returns {string} 风格名称
 */
function pickStyle (weights) {
  const styles = Object.keys(weights)
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (const style of styles) {
    random -= weights[style]
    if (random <= 0) {
      return style
    }
  }

  return styles[0]
}

/**
 * 从数组中随机选取一个元素
 * @param {Array} arr - 源数组
 * @returns {*} 随机元素
 */
function pickRandom (arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 检查名称是否包含不和谐的字符组合
 * @param {string} name - 待检测的名称
 * @returns {boolean} 是否包含不良组合
 */
function hasBadCombo (name) {
  return BAD_COMBOS.some(combo => name.includes(combo))
}

/**
 * 获取指定性别的名字字库
 * @param {'male'|'female'} gender - 性别
 * @returns {Object<string, string[]>} 名字字库
 */
function getNameChars (gender) {
  return gender === 'female' ? FEMALE_NAME_CHARS : MALE_NAME_CHARS
}

/**
 * 获取指定性别的精选双字名
 * @param {'male'|'female'} gender - 性别
 * @returns {string[]} 精选双字名列表
 */
function getCuratedNames (gender) {
  return gender === 'female' ? CURATED_FEMALE_TWO_CHAR_NAMES : CURATED_MALE_TWO_CHAR_NAMES
}

/**
 * 获取指定性别的特殊格式后缀
 * @param {'male'|'female'} gender - 性别
 * @returns {string[]} 后缀列表
 */
function getCuratedSuffixes (gender) {
  return gender === 'female' ? CURATED_FEMALE_SUFFIXES : CURATED_MALE_SUFFIXES
}

/**
 * 获取指定性别的风格权重
 * @param {'male'|'female'} gender - 性别
 * @returns {Object<string, number>} 风格权重
 */
function getStyleWeights (gender) {
  return gender === 'female' ? FEMALE_STYLE_WEIGHTS : MALE_STYLE_WEIGHTS
}

/**
 * 生成单字名（姓氏 + 1字 = 2-3字名）
 * @param {string} style - 名称风格
 * @param {'male'|'female'} gender - 性别
 * @returns {string} 生成的名称
 */
function generateSingleCharName (style, gender) {
  const surname = pickRandom(SURNAMES.filter(s => s.length === 1))
  const chars = getNameChars(gender)
  const char = pickRandom(chars[style])
  return surname + char
}

/**
 * 生成双字名 - 优先从性别对应的预设库中选取，确保顺口
 * 30%概率使用预设名，70%概率随机组合
 * @param {string} style - 名称风格
 * @param {'male'|'female'} gender - 性别
 * @returns {string} 生成的名称
 */
function generateDoubleCharName (style, gender) {
  const useCurated = Math.random() < 0.3

  if (useCurated) {
    // 从性别对应的预设好听双字名中选取
    const surname = pickRandom(SURNAMES.filter(s => s.length === 1))
    const curatedNames = getCuratedNames(gender)
    const name = pickRandom(curatedNames)
    return surname + name
  }

  // 随机组合：姓 + 同风格两字
  const surname = pickRandom(SURNAMES.filter(s => s.length === 1))
  const chars = getNameChars(gender)
  const char1 = pickRandom(chars[style])
  let char2 = pickRandom(chars[style])

  // 避免两个相同字
  let attempts = 0
  while (char1 === char2 && attempts < 5) {
    char2 = pickRandom(chars[style])
    attempts++
  }

  return surname + char1 + char2
}

/**
 * 生成复姓单字名（复姓 + 1字 = 3字名）
 * @param {string} style - 名称风格
 * @param {'male'|'female'} gender - 性别
 * @returns {string} 生成的名称
 */
function generateCompoundSurnameName (style, gender) {
  const compoundSurnames = SURNAMES.filter(s => s.length === 2)
  const surname = pickRandom(compoundSurnames)
  const chars = getNameChars(gender)
  const char = pickRandom(chars[style])
  return surname + char
}

/**
 * 生成复姓双字名（复姓 + 2字 = 4字名）
 * @param {string} style - 名称风格
 * @param {'male'|'female'} gender - 性别
 * @returns {string} 生成的名称
 */
function generateCompoundSurnameDoubleName (style, gender) {
  const compoundSurnames = SURNAMES.filter(s => s.length === 2)
  const surname = pickRandom(compoundSurnames)
  const chars = getNameChars(gender)
  const char1 = pickRandom(chars[style])
  let char2 = pickRandom(chars[style])

  // 避免两个相同字
  let attempts = 0
  while (char1 === char2 && attempts < 5) {
    char2 = pickRandom(chars[style])
    attempts++
  }

  return surname + char1 + char2
}

/**
 * 生成特殊格式名（带·分隔符的4-5字名）
 * @param {'male'|'female'} gender - 性别
 * @returns {string} 生成的名称
 */
function generateSpecialFormatName (gender) {
  const surname = pickRandom(SURNAMES.filter(s => s.length <= 2))
  const suffixes = getCuratedSuffixes(gender)
  const suffix = pickRandom(suffixes)
  return surname + suffix
}

/** 递归生成计数器，防止无限递归 */
let _recursiveCount = 0

/** 递归生成最大次数 */
const MAX_RECURSIVE = 10

/**
 * 生成RPG风格随机角色名称（支持性别区分）
 *
 * 生成规则：
 * - 2字名：单姓 + 1字名（如男性：叶尘、林风；女性：苏梦、白月）
 * - 3字名：单姓 + 2字名（如男性：萧无尘、苏清风；女性：楚飞雪、沈若水）
 *          或 复姓 + 1字名（如男性：慕容剑、独孤啸；女性：南宫月、欧阳霜）
 * - 4字名：复姓 + 2字名（如男性：欧阳破军、上官长风；女性：慕容飞雪、南宫婉清）
 * - 5字名：姓氏 + ·分隔 + 后缀（如男性：叶·星辰、慕容·破晓；女性：叶·月华、慕容·花语）
 *
 * 名称长度分布权重：
 * - 2字：20%
 * - 3字：45%
 * - 4字：25%
 * - 5字：10%
 *
 * @param {'male'|'female'} [gender='male'] - 性别，'male'生成男性名称，'female'生成女性名称
 * @returns {string} 2-5字的RPG风格角色名称
 * @example
 * generateRPGName('male')   // '叶尘'
 * generateRPGName('male')   // '萧无尘'
 * generateRPGName('female') // '苏梦'
 * generateRPGName('female') // '楚飞雪'
 */
export function generateRPGName (gender = 'male') {
  _recursiveCount++

  // 防止无限递归
  if (_recursiveCount > MAX_RECURSIVE) {
    _recursiveCount = 0
    // 返回一个安全的默认名称
    const fallbackSurnames = SURNAMES.filter(s => s.length === 1)
    return pickRandom(fallbackSurnames) + '天'
  }

  const weights = getStyleWeights(gender)
  const style = pickStyle(weights)

  // 按权重决定名称长度
  const lengthRoll = Math.random()
  let name = ''

  if (lengthRoll < 0.20) {
    // 2字名：单姓 + 1字
    name = generateSingleCharName(style, gender)
  } else if (lengthRoll < 0.65) {
    // 3字名：单姓+2字 或 复姓+1字
    if (Math.random() < 0.6) {
      name = generateDoubleCharName(style, gender)
    } else {
      name = generateCompoundSurnameName(style, gender)
    }
  } else if (lengthRoll < 0.90) {
    // 4字名：复姓 + 2字
    name = generateCompoundSurnameDoubleName(style, gender)
  } else {
    // 5字名：特殊格式
    name = generateSpecialFormatName(gender)
  }

  // 安全检查：如果包含不良组合则重新生成
  if (hasBadCombo(name)) {
    return generateRPGName(gender)
  }

  // 确保名称长度在2-5之间
  if (name.length < 2 || name.length > 5) {
    return generateRPGName(gender)
  }

  _recursiveCount = 0
  return name
}
