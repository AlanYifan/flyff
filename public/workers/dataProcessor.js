self.onmessage = function (e) {
  const { type, data, useTransferable } = e.data
  let result

  try {
    switch (type) {
      case 'items':
      case 'processItems':
        result = processItems(data, useTransferable)
        break
      case 'monsters':
      case 'processMonsters':
        result = processMonsters(data)
        break
      case 'skills':
      case 'processSkills':
        result = processSkills(data)
        break
      case 'quests':
      case 'processQuests':
        result = processQuests(data)
        break
      case 'equipmentSets':
      case 'processEquipmentSets':
        result = processEquipmentSets(data)
        break
      default:
        result = null
    }
  } catch (error) {
    console.error(`[Worker] 处理 ${type} 时发生错误:`, error)
    result = null
  }

  self.postMessage({ type, result })
}

function getMonsterFieldFilter() {
  const essentialFields = [
    'id',
    'event',
    'level',
    'rank',
    'element',
    'hp',
    'mp',
    'minAttack',
    'maxAttack',
    'defense',
    'magicDefense',
    'sta',
    'str',
    'dex',
    'int',
    'hitRate',
    'parry',
    'resistFire',
    'resistWater',
    'resistWind',
    'resistEarth',
    'resistElectricity',
    'berserkThresholdHP',
    'berserkAttackPower',
    'experienceTable',
    'speed',
    'minDropGold',
    'maxDropGold',
    'drops',
    'attacks'
  ]
  return data => {
    const filtered = {}
    essentialFields.forEach(field => {
      if (data[field] !== undefined) {
        filtered[field] = data[field]
      }
    })
    if (data.name && data.name.cns) {
      filtered.name = data.name.cns
    }
    return filtered
  }
}

function getItemFieldFilter() {
  const essentialFields = [
    'id',
    'level',
    'element',
    'cooldown',
    'abilities',
    'category',
    'subcategory',
    'rarity',
    'stack',
    'buyPrice',
    'sellPrice',
    'minAttack',
    'maxAttack',
    'attackSpeedValue',
    'possibleRandomStats',
    'dismantle'
  ]
  return data => {
    const filtered = {}
    essentialFields.forEach(field => {
      if (data[field] !== undefined) {
        filtered[field] = data[field]
      }
    })
    if (data.name && data.name.cns) {
      filtered.name = data.name.cns
    }
    if (data.description && data.description.cns) {
      filtered.description = data.description.cns
    }
    return filtered
  }
}

function getSkillFieldFilter() {
  const essentialFields = [
    'id',
    'icon',
    'class',
    'level',
    'element',
    'elementType',
    'weapon',
    'combo',
    'debuff',
    'flying',
    'passive',
    'requiresCouple',
    'target',
    'skillPoints',
    'levels'
  ]
  return data => {
    const filtered = {}
    essentialFields.forEach(field => {
      if (data[field] !== undefined) {
        filtered[field] = data[field]
      }
    })
    if (data.name && data.name.cns) {
      filtered.name = data.name.cns
    }
    return filtered
  }
}

function getItemName(item) {
  if (!item || !item.name) {
    return null
  }

  if (typeof item.name === 'string') {
    return item.name
  }

  if (item.name && item.name.cns) {
    return item.name.cns
  }

  return null
}

function processItems(data, useTransferable = false) {
  const itemFilter = getItemFieldFilter()
  const itemMap = {}
  let processedCount = 0

  let itemsArray
  if (Array.isArray(data)) {
    itemsArray = data
  } else if (typeof data === 'object' && data !== null) {
    itemsArray = Object.values(data)
  } else {
    console.warn('[Worker] processItems: 无效的数据格式')
    return {}
  }

  itemsArray.forEach((item, index) => {
    if (!item) {
      return
    }

    try {
      const filteredItem = itemFilter(item)

      let sex = null
      if (item.sex) {
        if (item.sex == 'male') {
          sex = '男'
        } else if (item.sex == 'female') {
          sex = '女'
        }
      }

      const itemName =
        getItemName(item) || typeof item.name === 'string'
          ? item.name
          : item.name && item.name.cns
            ? item.name.cns
            : `物品ID: ${item.id}`

      const itemDescription =
        typeof item.description === 'string'
          ? item.description
          : item.description && item.description.cns
            ? item.description.cns
            : ''

      itemMap[item.id] = {
        ...filteredItem,
        name: itemName,
        description: itemDescription,
        minDefense: item.minDefense !== undefined ? item.minDefense : item.defense || 0,
        maxDefense: item.maxDefense !== undefined ? item.maxDefense : item.defense || 0,
        class: Array.isArray(item.class) ? item.class : [item.class],
        sex,
        upgradeLevels: item.upgradeLevels,
        icon: item.icon
      }
      processedCount++
    } catch (error) {
      console.error(`[Worker] 处理物品 ${index} 时出错:`, error)
    }
  })

  console.log(`[Worker] 处理完成 - 物品: ${processedCount} 个`)
  return itemMap
}

function processMonsters(data) {
  const areaToLocationMap = {
    normal: '帕里大陆',
    instance: '帕里大陆',
    unknown: '帕里大陆'
  }

  const monsterFilter = getMonsterFieldFilter()
  const monsterMap = {}

  let monstersArray
  if (Array.isArray(data)) {
    monstersArray = data
  } else if (typeof data === 'object' && data !== null) {
    monstersArray = Object.values(data)
  } else {
    console.warn('[Worker] processMonsters: 无效的数据格式')
    return {}
  }

  monstersArray.forEach(monster => {
    if (monster && monster.id) {
      const filteredMonster = monsterFilter(monster)
      const location = areaToLocationMap[monster.area] || '帕里大陆'

      monsterMap[monster.id] = {
        ...filteredMonster,
        location
      }
    }
  })

  monsterMap['test_slime'] = {
    id: 'test_slime',
    name: '测试史莱姆',
    level: 1,
    hp: 50,
    attack: 5,
    defense: 2,
    exp: 10,
    location: '帕里大陆',
    drops: ['slimeJelly', 'smallHpPotion']
  }

  monsterMap['test_goblin'] = {
    id: 'test_goblin',
    name: '测试哥布林',
    level: 3,
    hp: 80,
    attack: 8,
    defense: 4,
    exp: 20,
    location: '帕里大陆',
    drops: ['goblinEar', 'copperCoin', 'rustySword']
  }

  console.log(`[Worker] 处理完成 - 怪物: ${Object.keys(monsterMap).length} 个`)
  return monsterMap
}

function processSkills(data) {
  const skillFilter = getSkillFieldFilter()
  const skillMap = {}

  let skillsArray
  if (Array.isArray(data)) {
    skillsArray = data
  } else if (typeof data === 'object' && data !== null) {
    skillsArray = Object.values(data)
  } else {
    console.warn('[Worker] processSkills: 无效的数据格式')
    return {}
  }

  skillsArray.forEach(skill => {
    if (skill && skill.id) {
      skillMap[skill.id] = skillFilter(skill)
    }
  })

  console.log(`[Worker] 处理完成 - 技能: ${Object.keys(skillMap).length} 个`)
  return skillMap
}

function processQuests(data) {
  const questMap = {}

  let questsArray
  if (Array.isArray(data)) {
    questsArray = data
  } else if (typeof data === 'object' && data !== null) {
    questsArray = Object.values(data)
  } else {
    console.warn('[Worker] processQuests: 无效的数据格式')
    return {}
  }

  questsArray.forEach(quest => {
    if (quest && quest.id) {
      questMap[quest.id] = quest
    }
  })

  console.log(`[Worker] 处理完成 - 任务: ${Object.keys(questMap).length} 个`)
  return questMap
}

function processEquipmentSets(data) {
  const setMap = {}

  let setsArray
  if (Array.isArray(data)) {
    setsArray = data
  } else if (typeof data === 'object' && data !== null) {
    setsArray = Object.values(data)
  } else {
    console.warn('[Worker] processEquipmentSets: 无效的数据格式')
    return {}
  }

  setsArray.forEach(set => {
    if (!set) {
      return
    }

    setMap[set.id] = {
      id: set.id,
      name: set.name,
      parts: Array.isArray(set.parts) ? set.parts : [],
      bonus: Array.isArray(set.bonus) ? set.bonus : []
    }
  })

  console.log(`[Worker] 处理完成 - 装备套装: ${Object.keys(setMap).length} 个`)
  return setMap
}
