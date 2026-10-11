import { ref, computed } from 'vue'
import { useMonstersStore } from '@/store/monsters'
import { useMapsStore } from '@/store/maps'

/**
 * 副本怪物ID缓存，用于存储根据名称和等级选择的最佳怪物ID
 * @type {Map<string, Map<number, {id: number, hp: number}>>}
 */
const dungeonMonsterIdCache = new Map()

/**
 * 根据怪物名称和等级范围选择最佳的怪物ID
 * 相同名称、相同等级的怪物优先选择掉落物品最多的，如果一样多则选择气血最多的
 * 不同等级只返回一个代表
 * @param {string} monsterName - 怪物名称
 * @param {number} minLevel - 最小等级
 * @param {number} maxLevel - 最大等级
 * @param {Object} staticMonsters - 静态怪物数据
 * @returns {Array<{id: number, name: string, level: number, hp: number, dropsCount: number}>} 符合条件的怪物列表（每等级一个）
 */
function selectBestMonstersByNameAndLevel(monsterName, minLevel, maxLevel, staticMonsters) {
  const cacheKey = `${monsterName}_${minLevel}_${maxLevel}`
  
  // 检查缓存
  if (dungeonMonsterIdCache.has(cacheKey)) {
    return dungeonMonsterIdCache.get(cacheKey)
  }
  
  // 找出所有同名怪物
  const sameNameMonsters = []
  for (const monsterId in staticMonsters) {
    const monster = staticMonsters[monsterId]
    if (!monster || !monster.name) continue
    
    const name = monster.name.cns || monster.name.en || ''
    if (name === monsterName) {
      sameNameMonsters.push({
        id: monster.id,
        name: monsterName,
        level: monster.level || 1,
        hp: monster.hp || 0,
        rank: monster.rank || 'normal',
        dropsCount: (monster.drops && monster.drops.length) || 0
      })
    }
  }
  
  // 按等级分组，每组优先选择掉落物品数量最多的，如果一样多则选择气血最多的
  const levelMap = new Map()
  for (const monster of sameNameMonsters) {
    if (monster.level < minLevel || monster.level > maxLevel) continue
    
    const existing = levelMap.get(monster.level)
    if (!existing) {
      levelMap.set(monster.level, monster)
    } else {
      // 优先比较掉落物品数量
      if (monster.dropsCount > existing.dropsCount) {
        levelMap.set(monster.level, monster)
      } else if (monster.dropsCount === existing.dropsCount && monster.hp > existing.hp) {
        levelMap.set(monster.level, monster)
      }
    }
  }
  
  // 返回按等级排序的结果
  const result = Array.from(levelMap.values()).sort((a, b) => a.level - b.level)
  
  // 缓存结果
  dungeonMonsterIdCache.set(cacheKey, result)
  
  return result
}

/**
 * 副本难度配置
 * 定义每个副本的难度等级、等级范围和掉率加成
 */
export const DUNGEON_DIFFICULTY_CONFIG = {
  // 乐雅裂痕难度配置
  乐雅裂痕: {
    difficulties: [
      { name: '普通', levelRange: [16, 30], dropRateMultiplier: 1.0 },
      { name: '中等', levelRange: [31, 60], dropRateMultiplier: 1.0 },
      { name: '高级', levelRange: [61, 90], dropRateMultiplier: 1.0 },
      { name: '困难', levelRange: [91, 120], dropRateMultiplier: 1.0 },
      { name: '噩梦', levelRange: [121, 140], dropRateMultiplier: 1.0 },
      { name: '诅咒', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '16-200'
  },
  // 魔域秘殿[地牢]难度配置
  '魔域秘殿[地牢]': {
    difficulties: [
      { name: '简单', levelRange: [15, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [15, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [15, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '15-200'
  },
  // 幻魔依普利神殿[地牢]（晨光地下城）难度配置
  '幻魔依普利神殿[地牢]': {
    difficulties: [
      { name: '简单', levelRange: [40, 75], dropRateMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [40, 75], dropRateMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [40, 75], dropRateMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '40-75'
  },
  // 莱斯神之墓难度配置
  '莱斯神之墓': {
    difficulties: [
      { name: '普通', levelRange: [31, 60], dropRateMultiplier: 1.0 },
      { name: '困难', levelRange: [61, 90], dropRateMultiplier: 1.0 },
      { name: '噩梦', levelRange: [91, 120], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [121, 140], dropRateMultiplier: 1.0 },
      { name: '诅咒', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '炼狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '31-200'
  },
  // 渴望深渊难度配置
  '渴望深渊': {
    difficulties: [
      { name: '普通', levelRange: [61, 90], dropRateMultiplier: 1.0 },
      { name: '困难', levelRange: [91, 120], dropRateMultiplier: 1.0 },
      { name: '噩梦', levelRange: [121, 140], dropRateMultiplier: 1.0 },
      { name: '诅咒', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '61-200'
  },
  // 飞龙[地牢]难度配置
  '飞龙[地牢]': {
    difficulties: [
      { name: '简单', levelRange: [85, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [85, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [85, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '85-200'
  },
  // 时空毁灭者难度配置
  '时空毁灭者': {
    difficulties: [
      { name: '简单', levelRange: [70, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [70, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [70, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '70-200'
  },
  // 堕落圣域难度配置
  '堕落圣域': {
    difficulties: [
      { name: '普通', levelRange: [91, 120], dropRateMultiplier: 1.0 },
      { name: '噩梦', levelRange: [121, 140], dropRateMultiplier: 1.0 },
      { name: '诅咒', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '91-200'
  },
  // 赤红飞龙[地牢]难度配置
  '赤红飞龙[地牢]': {
    difficulties: [
      { name: '简单', levelRange: [120, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [120, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [120, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '120-200'
  },
  // 风暴之巅难度配置
  '风暴之巅': {
    difficulties: [
      { name: '普通', levelRange: [121, 140], dropRateMultiplier: 1.0 },
      { name: '诅咒', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '121-200'
  },
  // 荒野难度配置
  '荒野': {
    difficulties: [
      { name: '普通', levelRange: [141, 165], dropRateMultiplier: 1.0 },
      { name: '地狱', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '141-200'
  },
  // 艾尔伦难度配置
  '艾尔伦': {
    difficulties: [
      { name: '简单', levelRange: [160, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [160, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [160, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '160-200'
  },
  // [暗影中尉]克里顿难度配置
  '[暗影中尉]克里顿': {
    difficulties: [
      { name: '简单', levelRange: [160, 200], dropRateMultiplier: 0.5, expMultiplier: 0.5, hpMultiplier: 0.5, unlocked: true },
      { name: '中等', levelRange: [160, 200], dropRateMultiplier: 1.0, expMultiplier: 1.0, hpMultiplier: 1.0, requireClear: '简单' },
      { name: '困难', levelRange: [160, 200], dropRateMultiplier: 1.5, expMultiplier: 1.5, hpMultiplier: 1.5, requireClear: '中等' }
    ],
    defaultDifficulty: '简单',
    enterLevelRange: '160-200'
  },
  // 贝西摩斯神殿难度配置
  '贝西摩斯神殿': {
    difficulties: [
      { name: '普通', levelRange: [166, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '166-200'
  },
  // 深渊之塔 - 秘密房间难度配置
  '秘密房间': {
    difficulties: [
      { name: '普通', levelRange: [89, 190], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '89-190',
    hideDifficultySelector: true // 隐藏难度选择器
  },
  // 深渊之塔1层难度配置
  '深渊之塔1层': {
    difficulties: [
      { name: '普通', levelRange: [86, 95], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '86-95',
    hideDifficultySelector: true
  },
  // 深渊之塔2层难度配置
  '深渊之塔2层': {
    difficulties: [
      { name: '普通', levelRange: [96, 105], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '96-105',
    hideDifficultySelector: true
  },
  // 深渊之塔3层难度配置
  '深渊之塔3层': {
    difficulties: [
      { name: '普通', levelRange: [106, 115], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '106-115',
    hideDifficultySelector: true
  },
  // 深渊之塔4层难度配置
  '深渊之塔4层': {
    difficulties: [
      { name: '普通', levelRange: [116, 125], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '116-125',
    hideDifficultySelector: true
  },
  // 深渊之塔5层难度配置
  '深渊之塔5层': {
    difficulties: [
      { name: '普通', levelRange: [126, 135], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '126-135',
    hideDifficultySelector: true
  },
  // 深渊之塔6层难度配置
  '深渊之塔6层': {
    difficulties: [
      { name: '普通', levelRange: [136, 145], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '136-145',
    hideDifficultySelector: true
  },
  // 深渊之塔7层难度配置
  '深渊之塔7层': {
    difficulties: [
      { name: '普通', levelRange: [146, 200], dropRateMultiplier: 1.0 }
    ],
    defaultDifficulty: '普通',
    enterLevelRange: '146-200',
    hideDifficultySelector: true
  }
}

// 副本数据
export const dungeonData = {
  帕里大陆: [
    {
      id: 1,
      name: '乐雅裂痕',
      image: '/pt/map/fuben/leyaliehen.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '乐雅守门人',
      levelRange: '16-200',
      // 硬编码各难度怪物ID配置
      difficultyMonsters: {
        '普通': [ // Lv16-30, 使用Lv23怪物
          { id: 9745, name: '深渊大猩猩', count: 60 },
          { id: 4906, name: '穴居幼虫', count: 30 },
          { id: 8124, name: '盲蛛女皇', count: 1 },
          { id: 3769, name: '穴居雾女', count: 30 },
          { id: 7109, name: '雾女女皇', count: 1 },
          { id: 1237, name: '穴居酋长', count: 1 }
        ],
        '中等': [ // Lv31-60, 使用Lv45怪物
          { id: 3670, name: '深渊大猩猩', count: 60 },
          { id: 2387, name: '穴居幼虫', count: 30 },
          { id: 5801, name: '盲蛛女皇', count: 1 },
          { id: 679, name: '穴居雾女', count: 30 },
          { id: 5356, name: '雾女女皇', count: 1 },
          { id: 711, name: '穴居酋长', count: 1 }
        ],
        '高级': [ // Lv61-90, 使用Lv75怪物
          { id: 6719, name: '深渊大猩猩', count: 60 },
          { id: 7452, name: '穴居幼虫', count: 30 },
          { id: 5333, name: '盲蛛女皇', count: 1 },
          { id: 4443, name: '穴居雾女', count: 30 },
          { id: 7783, name: '雾女女皇', count: 1 },
          { id: 4308, name: '穴居酋长', count: 1 }
        ],
        '困难': [ // Lv91-120, 使用Lv105怪物
          { id: 9615, name: '深渊大猩猩', count: 60 },
          { id: 6212, name: '穴居幼虫', count: 30 },
          { id: 9899, name: '盲蛛女皇', count: 1 },
          { id: 3267, name: '穴居雾女', count: 30 },
          { id: 8827, name: '雾女女皇', count: 1 },
          { id: 5673, name: '穴居酋长', count: 1 }
        ],
        '噩梦': [ // Lv121-140, 使用Lv130怪物
          { id: 7397, name: '深渊大猩猩', count: 60 },
          { id: 2, name: '穴居幼虫', count: 30 },
          { id: 3535, name: '盲蛛女皇', count: 1 },
          { id: 9159, name: '穴居雾女', count: 30 },
          { id: 2663, name: '雾女女皇', count: 1 },
          { id: 140, name: '穴居酋长', count: 1 }
        ],
        '诅咒': [ // Lv141-165, 使用Lv150怪物
          { id: 17048, name: '深渊大猩猩', count: 60 },
          { id: 17961, name: '穴居幼虫', count: 30 },
          { id: 12384, name: '盲蛛女皇', count: 1 },
          { id: 16793, name: '穴居雾女', count: 30 },
          { id: 14071, name: '雾女女皇', count: 1 },
          { id: 18679, name: '穴居酋长', count: 1 }
        ],
        '地狱': [ // Lv166-200, 使用Lv150怪物
          { id: 17048, name: '深渊大猩猩', count: 60 },
          { id: 17961, name: '穴居幼虫', count: 30 },
          { id: 12384, name: '盲蛛女皇', count: 1 },
          { id: 16793, name: '穴居雾女', count: 30 },
          { id: 14071, name: '雾女女皇', count: 1 },
          { id: 18679, name: '穴居酋长', count: 1 }
        ]
      },
      // 向后兼容：保留原有monsters字段（默认使用噩梦难度）
      monsters: [
        { id: 7397, name: '深渊大猩猩', count: 60 },
        { id: 2, name: '穴居幼虫', count: 30 },
        { id: 3535, name: '盲蛛女皇', count: 1 },
        { id: 9159, name: '穴居雾女', count: 30 },
        { id: 2663, name: '雾女女皇', count: 1 },
        { id: 140, name: '穴居酋长', count: 1 }
      ]
    },
    {
      id: 11,
      name: '魔域秘殿[地牢]',
      image: '/pt/map/fuben/moyumidian.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '魔域守门人',
      levelRange: '15-200',
      // 该副本所有难度使用相同怪物ID
      monsters: [
        { id: 3415, name: '毒菲菲龙', count: 20 },
        { id: 4198, name: '邪恶翎猫', count: 20 },
        { id: 5566, name: '狂暴魔导战甲', count: 20 },
        { id: 3716, name: '剧毒菲菲龙', count: 1 },
        { id: 7328, name: '翎猫女王', count: 1 },
        { id: 2979, name: '狂暴魔导统帅', count: 1 },
        { id: 3882, name: '蛇妖女', count: 6 },
        { id: 5517, name: '妖女蛇', count: 3 },
        { id: 421, name: '赛罗斯蛇妖', count: 1 }
      ]
    },
    {
      id: 12,
      name: '秘密房间',
      image: '/pt/map/fuben/mimifangjian.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '89-190',
      timeLimit: '2小时',
      cooldown: '24小时',
      cost: '10000000',
      monsters: [
        { id: 1336, name: '凯西猫头目', count: 20 },
        { id: 1146, name: '鹰身女妖头目', count: 20 },
        { id: 4449, name: '天狗头目', count: 20 },
        { id: 8932, name: '牛头狂战士头目', count: 20 },
        { id: 3261, name: '巫师头目', count: 20 },
        { id: 9709, name: '神象头目', count: 10 },
        { id: 12484, name: '影妖头目', count: 10 },
        { id: 595, name: '阿修罗头目', count: 1 },
        { id: 2949, name: '阿兹莫丹', count: 1 }
      ]
    },
    {
      id: 13,
      name: '深渊之塔1层',
      image: '/pt/map/fuben/shenyuanzhita1.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '86-95',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '20000',
      monsters: [
        { id: 360, name: '小型凯西猫', count: 33 },
        { id: 7128, name: '凯西猫', count: 33 },
        { id: 3631, name: '大型凯西猫', count: 34 },
        { id: 3621, name: '巨型凯西猫', count: 1 },
        { id: 7728, name: '小型鹰身女妖', count: 33 },
        { id: 8870, name: '鹰身女妖', count: 33 },
        { id: 5916, name: '大型鹰身女妖', count: 34 },
        { id: 7663, name: '巨型鹰身女妖', count: 1 }
      ]
    },
    {
      id: 14,
      name: '深渊之塔2层',
      image: '/pt/map/fuben/shenyuanzhita2.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '96-105',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '60000',
      monsters: [
        { id: 5635, name: '小型原野之灵', count: 33 },
        { id: 1137, name: '原野之灵', count: 33 },
        { id: 2186, name: '大型原野之灵', count: 34 },
        { id: 2330, name: '巨型原野之灵', count: 1 },
        { id: 1561, name: '小型阿布拉克萨斯', count: 33 },
        { id: 2777, name: '阿布拉克萨斯', count: 33 },
        { id: 3348, name: '大型阿布拉克萨斯', count: 34 },
        { id: 5218, name: '巨型阿布拉克萨', count: 1 }
      ]
    },
    {
      id: 15,
      name: '深渊之塔3层',
      image: '/pt/map/fuben/shenyuanzhita3.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '106-115',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '100000',
      monsters: [
        { id: 9472, name: '小型女巫', count: 33 },
        { id: 2339, name: '女巫', count: 33 },
        { id: 5842, name: '大型女巫', count: 34 },
        { id: 830, name: '巨型女巫', count: 1 },
        { id: 8662, name: '小型天狗', count: 33 },
        { id: 9994, name: '天狗', count: 33 },
        { id: 9546, name: '大型天狗', count: 34 },
        { id: 4249, name: '巨型天狗', count: 1 }
      ]
    },
    {
      id: 16,
      name: '深渊之塔4层',
      image: '/pt/map/fuben/shenyuanzhita4.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '116-125',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '140000',
      monsters: [
        { id: 5435, name: '小型牛头狂战士', count: 33 },
        { id: 8543, name: '牛头狂战士', count: 33 },
        { id: 3756, name: '大型牛头狂战士', count: 34 },
        { id: 66, name: '巨型牛头狂战士', count: 1 },
        { id: 170, name: '小型巫师', count: 33 },
        { id: 948, name: '巫师', count: 33 },
        { id: 5103, name: '大型巫师', count: 34 },
        { id: 4800, name: '巨型巫师', count: 1 }
      ]
    },
    {
      id: 17,
      name: '深渊之塔5层',
      image: '/pt/map/fuben/shenyuanzhita5.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '126-135',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '200000',
      monsters: [
        { id: 4137, name: '小型神象', count: 33 },
        { id: 658, name: '神象', count: 33 },
        { id: 9513, name: '大型神象', count: 34 },
        { id: 2853, name: '巨型神象', count: 1 },
        { id: 3814, name: '小型阿修罗', count: 33 },
        { id: 4071, name: '阿修罗', count: 33 },
        { id: 4981, name: '大型阿修罗', count: 34 },
        { id: 4947, name: '巨型阿修罗', count: 1 }
      ]
    },
    {
      id: 18,
      name: '深渊之塔6层',
      image: '/pt/map/fuben/shenyuanzhita6.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '136-145',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '290000',
      monsters: [
        { id: 14297, name: '小型影妖', count: 33 },
        { id: 19094, name: '影妖', count: 33 },
        { id: 15183, name: '大型影妖', count: 34 },
        { id: 13430, name: '巨型影妖', count: 1 },
        { id: 12283, name: '小型骸骨战士', count: 33 },
        { id: 14094, name: '骸骨战士', count: 33 },
        { id: 15864, name: '大型骸骨战士', count: 34 },
        { id: 13373, name: '巨型骸骨战士', count: 1 }
      ]
    },
    {
      id: 19,
      name: '深渊之塔7层',
      image: '/pt/map/fuben/shenyuanzhita7.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '深渊之塔管理员',
      levelRange: '146-200',
      timeLimit: '1小时',
      cooldown: '24小时',
      cost: '360000',
      monsters: [
        { id: 16329, name: '小型邪术巫妪', count: 33 },
        { id: 10611, name: '邪术巫妪', count: 33 },
        { id: 11069, name: '大型邪术巫妪', count: 34 },
        { id: 17289, name: '巨型邪术巫妪', count: 1 },
        { id: 19783, name: '小型诅咒守卫', count: 33 },
        { id: 11448, name: '诅咒守卫', count: 33 },
        { id: 19214, name: '大型诅咒守卫', count: 34 },
        { id: 2474, name: '巨型诅咒守卫', count: 1 }
      ]
    }
  ],
  晨光大陆: [
    {
      id: 2,
      name: '幻魔依普利神殿[地牢]',
      image: '/pt/map/fuben/midianshouhuzhe.png',
      npcImage: '/pt/map/fuben/fuben_npc2.png',
      npcName: '秘殿引导者',
      levelRange: '40-75',
      // 该副本所有难度使用相同怪物ID（Lv45-70）
      monsters: [
        { id: 3591, name: '秘殿破坏者', count: 30 },
        { id: 2984, name: '秘殿重锤者', count: 30 },
        { id: 938, name: '秘殿混乱者', count: 30 },
        { id: 8502, name: '秘殿傀儡', count: 20 },
        { id: 6141, name: '秘殿负重者', count: 10 },
        { id: 3650, name: '秘殿危险者', count: 5 },
        { id: 7249, name: '秘殿守护者', count: 1 }
      ]
    }
  ],
  莱斯大陆: [
    {
      id: 3,
      name: '莱斯神之墓',
      image: '/pt/map/fuben/laisishenzhimu.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '莱斯神之神墓守卫',
      levelRange: '31-200',
      // 硬编码各难度怪物ID配置
      difficultyMonsters: {
        '普通': [ // Lv31-60, 使用Lv45怪物
          { id: 8202, name: '变异蜘蛛', count: 50 },
          { id: 7525, name: '变异育母蜘蛛', count: 1 },
          { id: 2505, name: '咕噜大猩猩', count: 50 },
          { id: 2378, name: '暴怒大猩猩', count: 1 },
          { id: 3640, name: '生命树战士', count: 50 },
          { id: 2749, name: '生命树守卫', count: 1 },
          { id: 777, name: '老树根', count: 30 },
          { id: 9085, name: '神庙守护者', count: 1 }
        ],
        '困难': [ // Lv61-90, 使用Lv75怪物
          { id: 6384, name: '变异蜘蛛', count: 50 },
          { id: 1322, name: '变异育母蜘蛛', count: 1 },
          { id: 8143, name: '咕噜大猩猩', count: 50 },
          { id: 2675, name: '暴怒大猩猩', count: 1 },
          { id: 5784, name: '生命树战士', count: 50 },
          { id: 9157, name: '生命树守卫', count: 1 },
          { id: 9460, name: '老树根', count: 30 },
          { id: 4282, name: '神庙守护者', count: 1 }
        ],
        '噩梦': [ // Lv91-120, 使用Lv105怪物
          { id: 4931, name: '变异蜘蛛', count: 50 },
          { id: 2140, name: '变异育母蜘蛛', count: 1 },
          { id: 712, name: '咕噜大猩猩', count: 50 },
          { id: 5493, name: '暴怒大猩猩', count: 1 },
          { id: 7792, name: '生命树战士', count: 50 },
          { id: 4012, name: '生命树守卫', count: 1 },
          { id: 7094, name: '老树根', count: 30 },
          { id: 2363, name: '神庙守护者', count: 1 }
        ],
        '地狱': [ // Lv121-140, 使用Lv130怪物
          { id: 7327, name: '变异蜘蛛', count: 50 },
          { id: 9574, name: '变异育母蜘蛛', count: 1 },
          { id: 7077, name: '咕噜大猩猩', count: 50 },
          { id: 3058, name: '暴怒大猩猩', count: 1 },
          { id: 4161, name: '生命树战士', count: 50 },
          { id: 8438, name: '生命树守卫', count: 1 },
          { id: 10000, name: '老树根', count: 30 },
          { id: 2567, name: '神庙守护者', count: 1 }
        ],
        '诅咒': [ // Lv141-165, 使用Lv150怪物
          { id: 19254, name: '变异蜘蛛', count: 50 },
          { id: 12911, name: '变异育母蜘蛛', count: 1 },
          { id: 13686, name: '咕噜大猩猩', count: 50 },
          { id: 12117, name: '暴怒大猩猩', count: 1 },
          { id: 19961, name: '生命树战士', count: 50 },
          { id: 15336, name: '生命树守卫', count: 1 },
          { id: 10077, name: '老树根', count: 30 },
          { id: 19797, name: '神庙守护者', count: 1 }
        ],
        '炼狱': [ // Lv166-200, 使用Lv150怪物
          { id: 19254, name: '变异蜘蛛', count: 50 },
          { id: 12911, name: '变异育母蜘蛛', count: 1 },
          { id: 13686, name: '咕噜大猩猩', count: 50 },
          { id: 12117, name: '暴怒大猩猩', count: 1 },
          { id: 19961, name: '生命树战士', count: 50 },
          { id: 15336, name: '生命树守卫', count: 1 },
          { id: 10077, name: '老树根', count: 30 },
          { id: 19797, name: '神庙守护者', count: 1 }
        ]
      },
      // 向后兼容：保留原有monsters字段（默认使用地狱难度）
      monsters: [
        { id: 7327, name: '变异蜘蛛', count: 50 },
        { id: 9574, name: '变异育母蜘蛛', count: 1 },
        { id: 7077, name: '咕噜大猩猩', count: 50 },
        { id: 3058, name: '暴怒大猩猩', count: 1 },
        { id: 4161, name: '生命树战士', count: 50 },
        { id: 8438, name: '生命树守卫', count: 1 },
        { id: 10000, name: '老树根', count: 30 },
        { id: 2567, name: '神庙守护者', count: 1 }
      ]
    }
  ],
  '达肯1,2大陆': [
    {
      id: 4,
      name: '渴望深渊',
      image: '/pt/map/fuben/kewangshenyuan.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '渴望深渊守卫',
      levelRange: '61-200',
      // 硬编码各难度怪物ID配置
      difficultyMonsters: {
        '普通': [ // Lv61-90, 使用Lv75怪物
          { id: 7607, name: '变异鲨鱼', count: 50 },
          { id: 8737, name: '美人鱼', count: 50 },
          { id: 5419, name: '狡猾的人鱼战士', count: 50 },
          { id: 2519, name: '巨型海龟', count: 50 },
          { id: 1344, name: '塞壬', count: 1 },
          { id: 4664, name: '深渊海妖克拉肯', count: 1 }
        ],
        '困难': [ // Lv91-120, 使用Lv105怪物
          { id: 6981, name: '变异鲨鱼', count: 50 },
          { id: 5921, name: '美人鱼', count: 50 },
          { id: 3948, name: '狡猾的人鱼战士', count: 50 },
          { id: 8504, name: '巨型海龟', count: 50 },
          { id: 3846, name: '塞壬', count: 1 },
          { id: 6362, name: '深渊海妖克拉肯', count: 1 }
        ],
        '噩梦': [ // Lv121-140, 使用Lv130怪物
          { id: 8229, name: '变异鲨鱼', count: 50 },
          { id: 9658, name: '美人鱼', count: 50 },
          { id: 7420, name: '狡猾的人鱼战士', count: 50 },
          { id: 252, name: '巨型海龟', count: 50 },
          { id: 2000, name: '塞壬', count: 1 },
          { id: 11004, name: '深渊海妖克拉肯', count: 1 }
        ],
        '诅咒': [ // Lv141-165, 使用Lv150怪物
          { id: 15260, name: '变异鲨鱼', count: 50 },
          { id: 18628, name: '美人鱼', count: 50 },
          { id: 11970, name: '狡猾的人鱼战士', count: 50 },
          { id: 13224, name: '巨型海龟', count: 50 },
          { id: 18091, name: '塞壬', count: 1 },
          { id: 18588, name: '深渊海妖克拉肯', count: 1 }
        ],
        '地狱': [ // Lv166-200, 使用Lv150怪物
          { id: 15260, name: '变异鲨鱼', count: 50 },
          { id: 18628, name: '美人鱼', count: 50 },
          { id: 11970, name: '狡猾的人鱼战士', count: 50 },
          { id: 13224, name: '巨型海龟', count: 50 },
          { id: 18091, name: '塞壬', count: 1 },
          { id: 18588, name: '深渊海妖克拉肯', count: 1 }
        ]
      },
      // 向后兼容：保留原有monsters字段（默认使用噩梦难度）
      monsters: [
        { id: 8229, name: '变异鲨鱼', count: 50 },
        { id: 9658, name: '美人鱼', count: 50 },
        { id: 7420, name: '狡猾的人鱼战士', count: 50 },
        { id: 252, name: '巨型海龟', count: 50 },
        { id: 2000, name: '塞壬', count: 1 },
        { id: 11004, name: '深渊海妖克拉肯', count: 1 }
      ]
    },
    {
      id: 9,
      name: '飞龙[地牢]',
      image: '/pt/map/fuben/feilong.png',
      npcImage: '/pt/npc_icon/phacham.png',
      npcName: '飞龙守卫',
      levelRange: '85-200',
      cooldown: '48小时',
      cost: '1000000',
      timeLimit: '1小时',
      npcIntroduction: '诚然,打败巨龙对冒险者来说并非易事.当你准备好时,再来试试看.',
      monsters: [
        { id: 9812, name: '奇昆劳工', count: 10 },
        { id: 7824, name: '奇昆警卫', count: 10 },
        { id: 5760, name: '精英奇昆警卫队长', count: 1 },
        { id: 9000, name: '精英奇昆工头', count: 1 },
        { id: 4106, name: '蓝毒花虫', count: 10 },
        { id: 5586, name: '蓝毒花女王', count: 1 },
        { id: 593, name: '粉红毒花虫', count: 10 },
        { id: 9601, name: '粉红毒花女王', count: 1 },
        { id: 8745, name: '飞龙', count: 1 }
      ]
    },
    {
      id: 20,
      name: '时空毁灭者',
      image: '/pt/map/fuben/shikonghuimiezhe.png',
      npcImage: '/pt/map/fuben/fuben_npc2.png',
      npcName: '易谢罗',
      levelRange: '70-200',
      cooldown: '48小时',
      timeLimit: '1小时',
      cost: '500000',
      npcIntroduction: '你不可能希望了解这扇门背后是什么.我不在乎你做了多少研究.',
      monsters: [
        { id: 4611, name: '时空毁灭者', count: 1 }
      ]
    }
  ],
  达肯3大陆: [
    {
      id: 5,
      name: '堕落圣域',
      image: '/pt/map/fuben/duoluoshengyu.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '堕落圣域守卫',
      levelRange: '91-200',
      // 硬编码各难度怪物ID配置
      difficultyMonsters: {
        '普通': [ // Lv91-120, 使用Lv105怪物
          { id: 3218, name: '王室库迈', count: 30 },
          { id: 8452, name: '魔化莱德', count: 30 },
          { id: 7117, name: '魔化阿修罗', count: 30 },
          { id: 9083, name: '魔化萨满', count: 30 },
          { id: 4033, name: '金字塔看守者', count: 1 },
          { id: 392, name: '金字塔守卫', count: 1 }
        ],
        '噩梦': [ // Lv121-140, 使用Lv130怪物
          { id: 4867, name: '王室库迈', count: 30 },
          { id: 7213, name: '魔化莱德', count: 30 },
          { id: 2847, name: '魔化阿修罗', count: 30 },
          { id: 4309, name: '魔化萨满', count: 30 },
          { id: 8056, name: '金字塔看守者', count: 1 },
          { id: 6501, name: '金字塔守卫', count: 1 }
        ],
        '诅咒': [ // Lv141-165, 使用Lv150怪物
          { id: 16714, name: '王室库迈', count: 30 },
          { id: 14031, name: '魔化莱德', count: 30 },
          { id: 16120, name: '魔化阿修罗', count: 30 },
          { id: 15415, name: '魔化萨满', count: 30 },
          { id: 17471, name: '金字塔看守者', count: 1 },
          { id: 15268, name: '金字塔守卫', count: 1 }
        ],
        '地狱': [ // Lv166-200, 使用Lv150怪物
          { id: 16714, name: '王室库迈', count: 30 },
          { id: 14031, name: '魔化莱德', count: 30 },
          { id: 16120, name: '魔化阿修罗', count: 30 },
          { id: 15415, name: '魔化萨满', count: 30 },
          { id: 17471, name: '金字塔看守者', count: 1 },
          { id: 15268, name: '金字塔守卫', count: 1 }
        ]
      },
      // 向后兼容：保留原有monsters字段（默认使用噩梦难度）
      monsters: [
        { id: 4867, name: '王室库迈', count: 30 },
        { id: 7213, name: '魔化莱德', count: 30 },
        { id: 2847, name: '魔化阿修罗', count: 30 },
        { id: 4309, name: '魔化萨满', count: 30 },
        { id: 8056, name: '金字塔看守者', count: 1 },
        { id: 6501, name: '金字塔守卫', count: 1 }
      ]
    },
    {
      id: 10,
      name: '赤红飞龙[地牢]',
      image: '/pt/map/fuben/chihongfeilong.png',
      npcImage: '/pt/npc_icon/redrobegirl.png',
      npcName: '神秘长袍少女',
      levelRange: '120-200',
      cooldown: '24小时',
      cost: '1200000',
      timeLimit: '1小时',
      npcIntroduction: '我正在等待你的到来,勇敢的冒险者!',
      // 该副本所有难度使用相同怪物ID（Lv117-121）
      monsters: [
        { id: 4903, name: '小飞龙', count: 10 },
        { id: 6923, name: '狂暴飞龙', count: 1 },
        { id: 8959, name: '卡塔亇', count: 10 },
        { id: 6800, name: '独眼巨人 X', count: 10 },
        { id: 2287, name: '巨型独眼巨人 X', count: 1 },
        { id: 214, name: '泽福斯', count: 10 },
        { id: 9704, name: '格朗提泽', count: 1 },
        { id: 8302, name: '赤红飞龙', count: 1 }
      ]
    }
  ],
  阿兹利亚: [
    {
      id: 6,
      name: '风暴之巅',
      image: '/pt/map/fuben/fengbaozhidian.png',
      npcImage: '/pt/map/fuben/fuben_npc1.png',
      npcName: '风暴之巅守卫',
      levelRange: '121-200',
      // 硬编码各难度怪物ID配置
      difficultyMonsters: {
        '普通': [ // Lv121-140, 使用Lv130怪物
          { id: 17534, name: '冰封兔子骑士', count: 50 },
          { id: 18530, name: '冰封兔子刺客', count: 1 },
          { id: 8242, name: '暴怒怪力羊', count: 50 },
          { id: 12449, name: '冰封斑狼', count: 50 },
          { id: 17690, name: '骷髅武士', count: 50 },
          { id: 12183, name: '骷髅将军', count: 1 },
          { id: 17287, name: '冰封恶魔领主', count: 1 }
        ],
        '诅咒': [ // Lv141-165, 使用Lv150怪物
          { id: 17214, name: '冰封兔子骑士', count: 50 },
          { id: 17196, name: '冰封兔子刺客', count: 1 },
          { id: 14047, name: '暴怒怪力羊', count: 50 },
          { id: 14234, name: '冰封斑狼', count: 50 },
          { id: 14516, name: '骷髅武士', count: 50 },
          { id: 17488, name: '骷髅将军', count: 1 },
          { id: 15792, name: '冰封恶魔领主', count: 1 }
        ],
        '地狱': [ // Lv166-200, 使用Lv150怪物
          { id: 17214, name: '冰封兔子骑士', count: 50 },
          { id: 17196, name: '冰封兔子刺客', count: 1 },
          { id: 14047, name: '暴怒怪力羊', count: 50 },
          { id: 14234, name: '冰封斑狼', count: 50 },
          { id: 14516, name: '骷髅武士', count: 50 },
          { id: 17488, name: '骷髅将军', count: 1 },
          { id: 15792, name: '冰封恶魔领主', count: 1 }
        ]
      },
      // 向后兼容：保留原有monsters字段（默认使用普通难度）
      monsters: [
        { id: 17534, name: '冰封兔子骑士', count: 50 },
        { id: 18530, name: '冰封兔子刺客', count: 1 },
        { id: 8242, name: '暴怒怪力羊', count: 50 },
        { id: 12449, name: '冰封斑狼', count: 50 },
        { id: 17690, name: '骷髅武士', count: 50 },
        { id: 12183, name: '骷髅将军', count: 1 },
        { id: 17287, name: '冰封恶魔领主', count: 1 }
      ]
    }
  ],
  珊瑚岛: [
    {
      id: 7,
      name: '荒野',
      image: '/pt/map/fuben/huangye.png',
      npcImage: '/pt/map/fuben/fuben_npc3.png',
      npcName: '荒野守卫',
      levelRange: '141-200',
      // 该副本所有难度使用相同怪物ID（Lv150）
      monsters: [
        { id: 17443, name: '棱镜蛇', count: 61 },
        { id: 10303, name: '水之图腾', count: 1 },
        { id: 10208, name: '双头蛇后', count: 1 },
        { id: 16549, name: '双头眼镜蛇', count: 61 },
        { id: 11261, name: '风之图腾', count: 1 },
        { id: 12894, name: '浣熊执行官', count: 61 },
        { id: 15755, name: '土之图腾', count: 1 },
        { id: 5602, name: '丛林追猎者', count: 61 },
        { id: 13132, name: '火之图腾', count: 1 },
        { id: 16723, name: '丛林酋长', count: 1 },
        { id: 23226, name: '兽王可汗', count: 1 }
      ]
    },
    {
      id: 21,
      name: '[暗影中尉]克里顿',
      image: '/pt/map/fuben/anyingzhongwei_kelidun.png',
      npcImage: '/pt/npc_icon/obnis.png',
      npcName: '玄雅',
      levelRange: '160-200',
      cooldown: '24小时',
      // 该副本所有难度使用相同怪物ID（Lv169）
      monsters: [
        { id: 28482, name: '[暗影中尉]克里顿', count: 1 }
      ]
    }
  ],
  凯伦草原: [
    {
      id: 8,
      name: '贝西摩斯神殿',
      image: '/pt/map/fuben/beiximosi.png',
      npcImage: '/pt/npc_icon/asylumguard.png',
      npcName: '贝西摩斯神殿守卫',
      levelRange: '166-200',
      monsters: [
        { id: 22936, name: '[扭曲之魂]奥库斯', count: 45 },
        { id: 23551, name: '死亡纪念碑', count: 1 },
        { id: 21846, name: '[饱受折磨之魂]奈格尔', count: 60 },
        { id: 23551, name: '死亡纪念碑', count: 1 },
        { id: 24979, name: '[恶魔之魂]赫尔', count: 30 },
        { id: 23551, name: '死亡纪念碑', count: 1 },
        { id: 29117, name: '[堕落之魂]莫里根', count: 90 },
        { id: 23551, name: '死亡纪念碑', count: 1 },
        { id: 25607, name: '[腐化之魂]玛拉', count: 50 },
        { id: 23551, name: '死亡纪念碑', count: 1 },
        { id: 26924, name: '[狂暴之魂]盖德', count: 30 },
        { id: 22933, name: '[死神]贝西摩斯', count: 1 }
      ]
    },
    {
      id: 22,
      name: '艾尔伦',
      image: '/pt/map/fuben/aierlun.png',
      npcImage: '/pt/npc_icon/mawrang.png',
      npcName: '梅拉克',
      npcDialogue: '有时候守护村庄需要做出牺牲。这虽残酷，却是不争的事实。',
      levelRange: '160-200',
      cooldown: '24小时',
      monsterNames: [
        { name: '[长老]特莱图斯', count: 1 }
      ],
      monsters: [
        { id: 29150, name: '[长老]特莱图斯', count: 1 }
      ]
    }
  ]
}

export function useMap (gameData, currentMap) {
  const monstersStore = useMonstersStore()
  const mapsStore = useMapsStore()
  const showMapModal = ref(false)

  // 获取可用地图列表（从 Pinia Store）
  const availableMaps = computed(() => {
    return mapsStore.mapConfigs
  })

  // 打开地图模态框
  const openMapModal = () => {
    showMapModal.value = true
  }

  // 关闭地图模态框
  const closeMapModal = () => {
    showMapModal.value = false
  }

  // 处理地图变更
  const handleMapChange = mapData => {
    console.log('地图变更:', mapData)
    // 更新当前地图
    if (currentMap.value) {
      currentMap.value.name = mapData.mapName
      currentMap.value.levelRange = mapData.levelRange
      currentMap.value.background = mapData.background
    }

    // 可以在这里添加任何需要在地图变更时执行的逻辑
  }

  // 获取地图预览怪物
  const getMonstersForMapPreview = (mapName, levelRange) => {
 

    // 从 monstersStore 获取静态怪物数据
    const staticMonsters = monstersStore.staticMonsters
    if (!staticMonsters || Object.keys(staticMonsters).length === 0) {
      console.log('怪物数据不存在')
      return []
    }

    const monsters = []

    if (!levelRange || typeof levelRange !== 'string' || !levelRange.includes('-')) {
      console.warn('地图等级范围无效')
      return monsters
    }

    // 获取地图等级范围
    const [minLevel, maxLevel] = levelRange.split('-').map(Number)
 

    // 灵兽ID列表
    const spiritBeasts = [84, 627, 4827, 8990]

    // 筛选符合等级限制的怪物
    for (const monsterId in staticMonsters) {
      const monster = staticMonsters[monsterId]
      if (
        monster &&
        monster.level <= maxLevel && // 使用地图最大等级
        monster.level >= minLevel && // 确保不低于地图最小等级
        monster.event === false && // 排除事件怪物
        !spiritBeasts.includes(monster.id) && // 排除灵兽怪物
        monster.drops &&
        monster.drops.length !== 0 && // 暂时移除掉落检查
        monster.area === 'normal' // 只要普通区域怪物,不要其他类似什么副本 地下城的怪物
      ) {
        const defenseValue = Number(monster.defense ?? monster.def)
        const minDefenseValue = Number(monster.minDefense)
        const maxDefenseValue = Number(monster.maxDefense)
        const resolvedMinDefense = Number.isFinite(minDefenseValue)
          ? minDefenseValue
          : Number.isFinite(defenseValue)
            ? defenseValue
            : undefined
        const resolvedMaxDefense = Number.isFinite(maxDefenseValue)
          ? maxDefenseValue
          : Number.isFinite(defenseValue)
            ? defenseValue
            : undefined

        monsters.push({
          id: monster.id,
          name: monster.name?.cns || monster.name?.en || monster.name || `怪物${monster.id}`,
          level: monster.level,
          rank: monster.rank,
          hp: monster.hp,
          minAttack: monster.minAttack,
          maxAttack: monster.maxAttack,
          drops: monster.drops,
          minDropGold: monster.minDropGold,
          maxDropGold: monster.maxDropGold,
          defense: Number.isFinite(defenseValue) ? defenseValue : undefined,
          minDefense: resolvedMinDefense,
          maxDefense: resolvedMaxDefense,
          magicDefense: monster.magicDefense
        })
      }
    }

    // 按等级排序返回怪物列表
    return monsters.sort((a, b) => a.level - b.level)
  }

  // 获取指定地图的副本数据
  const getDungeonsForMap = mapName => {
    return dungeonData[mapName] || []
  }

  // 获取怪物rank颜色（使用 store 中的方法）
  const getMonsterRankColor = rank => {
    return monstersStore.getMonsterRankColor(rank)
  }

  /**
   * 获取副本难度配置
   * @param {string} dungeonName - 副本名称
   * @returns {Object|null} 难度配置
   */
  const getDungeonDifficultyConfig = dungeonName => {
    return DUNGEON_DIFFICULTY_CONFIG[dungeonName] || null
  }

  /**
   * 根据副本难度获取对应的怪物列表
   * 优先使用 difficultyMonsters 硬编码配置，否则回退到动态查找
   * @param {Object} dungeon - 副本数据
   * @param {string} difficultyName - 难度名称
   * @returns {Array} 怪物列表（包含正确的ID和等级）
   */
  const getDungeonMonstersByDifficulty = (dungeon, difficultyName) => {
    // 优先使用 difficultyMonsters 硬编码配置
    if (dungeon.difficultyMonsters && dungeon.difficultyMonsters[difficultyName]) {
      return dungeon.difficultyMonsters[difficultyName]
    }
    
    // 回退到原有怪物列表
    return dungeon.monsters || []
  }

  /**
   * 根据副本名称和难度获取怪物列表（供外部调用）
   * @param {string} dungeonName - 副本名称
   * @param {string} difficultyName - 难度名称
   * @returns {Array} 怪物列表
   */
  const getDungeonMonsters = (dungeonName, difficultyName) => {
    // 遍历所有地图找到副本
    for (const mapName in dungeonData) {
      const dungeons = dungeonData[mapName]
      const dungeon = dungeons.find(d => d.name === dungeonName)
      if (dungeon) {
        return getDungeonMonstersByDifficulty(dungeon, difficultyName)
      }
    }
    return []
  }

  /**
 * 导出副本难度配置常量，供外部使用
 */
  const getDungeonDifficultyConfigMap = () => DUNGEON_DIFFICULTY_CONFIG

  return {
    // 响应式数据
    showMapModal,
    availableMaps,

    // 方法
    openMapModal,
    closeMapModal,
    handleMapChange,
    getMonstersForMapPreview,
    getDungeonsForMap,
    getMonsterRankColor,
    // 新增方法
    getDungeonDifficultyConfig,
    getDungeonMonstersByDifficulty,
    getDungeonMonsters,
    getDungeonDifficultyConfigMap
  }
}
