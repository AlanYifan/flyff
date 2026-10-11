/**
 * @file PET_TYPE.js
 * @generated 2026-02-08
 */
/**
 * PET_TYPE（对象，对外导出）
 * 用途：以 petItemId 为 key 快速访问宠物成长配置
 * 结构：{ [petItemId: string]: { petItemId: number, parameter?: string, rate?: boolean, values?: number[], tiers: Array<object> } }
 * 返回：冻结后的只读对象
 */
export const PET_TYPE = Object.freeze({
  '148': {
    "petItemId": 148,//独角兽
    "parameter": "maxhp",
    "rate": false,
    "values": [96, 191, 383, 670, 1053, 1356, 1628, 2539, 3161],
    "tiers": [
      {
        "maxEnergy": 180,//最大能量
        "exp": 20,        //升级所需经验
        "requiredCandyItem": 2313,//升级所需糖果
        "graceSkill": 8819,// grace 技能 ID
        "graceSkillCooldown": 120,// grace 技能冷却时间
        "graceSkillLevel": 1,// grace 技能等级
        "graceSkillDuration": 20,// grace 技能持续时间
        "graceSkillEnergyConsumption": 50// grace 技能消耗能量
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 8819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '885': {
    "petItemId": 885,//飞龙
    "parameter": "attack",
    "rate": false,
    "values": [7, 13, 27, 47, 73, 95, 113, 165, 220],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 4622,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '1644': {
    "petItemId": 1644,//天使
    "parameter": "criticalchance",
    "rate": true,
    "values": [1, 2, 3, 4, 5, 6, 7, 8, 9],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 2379,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '2563': {
    "petItemId": 2563,//狮鸠
    "parameter": "def",
    "rate": false,
    "values": [6, 12, 24, 42, 66, 88, 102, 140, 198],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 4819,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '4817': {
    "petItemId": 4817,//狐狸
    "parameter": "int",
    "rate": false,
    "values": [1, 2, 4, 7, 11, 15, 17, 24, 33],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 1625,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '5471': {
    "petItemId": 5471,//兔子
    "parameter": "dex",
    "rate": false,
    "values": [1, 2, 4, 7, 11, 15, 17, 24, 33],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 4295,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '5851': {
    "petItemId": 5851,//老虎
    "parameter": "str",
    "rate": false,
    "values": [1, 2, 4, 7, 11, 15, 17, 24, 33],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 8542,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '6296': {
    "petItemId": 6296,//帝王蟹
    "parameter": "criticaldamage",
    "rate": true,
    "values": [2, 3, 4, 5, 6, 7, 9, 11, 16],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 5184,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  },
  '8600': {
    "petItemId": 8600,//宠物蛋
    "tiers": [
      {
        "maxEnergy": 0,
        "exp": 10,
        "requiredCandyItem": 2313
      }
    ]
  },
  '9941': {
    "petItemId": 9941,//狮子
    "parameter": "sta",
    "rate": false,
    "values": [1, 2, 4, 7, 11, 15, 17, 24, 33],
    "tiers": [
      {
        "maxEnergy": 180,
        "exp": 20,
        "requiredCandyItem": 2313,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 1,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 210,
        "exp": 20,
        "requiredCandyItem": 5906,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 2,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 240,
        "exp": 25,
        "requiredCandyItem": 3380,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 3,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 270,
        "exp": 25,
        "requiredCandyItem": 8748,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 4,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 300,
        "exp": 25,
        "requiredCandyItem": 4371,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 5,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 330,
        "exp": 50,
        "requiredCandyItem": 6663,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 6,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      },
      {
        "maxEnergy": 360,
        "exp": 0,
        "requiredCandyItem": 6663,
        "graceSkill": 2472,
        "graceSkillCooldown": 120,
        "graceSkillLevel": 7,
        "graceSkillDuration": 20,
        "graceSkillEnergyConsumption": 50
      }
    ]
  }
})
export const PET_TYPE_LIST = Object.freeze(Object.values(PET_TYPE))
