/**
 * @file ITEM_AWAKENEDS_STATS.js
 * @generated 2026-02-08
 */
/**
 * ITEM_AWAKENEDS_STATS_LIST（数组，对外导出）
 * 用途：用于遍历“物品觉醒词条”配置列表
 * 结构：Array<{ title: Record<string,string>, minimumLevel: number, abilities: Array<{parameter:string, add:number, rate:boolean}> }>
 * 返回：冻结后的只读数组，禁止响应式包装
 */
export const ITEM_AWAKENEDS_STATS_LIST = Object.freeze([
  {
    "title": {
      "en": "of STR",
      "ar": "of STR",
      "br": "de Força",
      "cns": "力量的",
      "de": "STR",
      "fi": "STR",
      "fil": "of STR",
      "fr": "de FOR",
      "id": "of STR",
      "it": "con STR",
      "jp": "力の",
      "kr": "STR",
      "nl": "van STR",
      "pl": "+STR",
      "ru": "СИЛ",
      "sp": "de STR",
      "sw": "of STR",
      "th": "of STR",
      "tw": "力量的",
      "vi": "of STR"
    },
    "minimumLevel": 10,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "of DEX",
      "ar": "of DEX",
      "br": "de Destreza",
      "cns": "敏捷的",
      "de": "DEX",
      "fi": "DEX",
      "fil": "of DEX",
      "fr": "de DEX",
      "id": "of DEX",
      "it": "con DEX",
      "jp": "敏捷の",
      "kr": "DEX",
      "nl": "van DEX",
      "pl": "+DEX",
      "ru": "ЛВК",
      "sp": "de DEX",
      "sw": "of DEX",
      "th": "of DEX",
      "tw": "敏捷的",
      "vi": "of DEX"
    },
    "minimumLevel": 10,
    "abilities": [
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "of INT",
      "ar": "of INT",
      "br": "de Inteligência",
      "cns": "智力的",
      "de": "INT",
      "fi": "INT",
      "fil": "of INT",
      "fr": "de INT",
      "id": "of INT",
      "it": "con INT",
      "jp": "知能の",
      "kr": "INT",
      "nl": "van INT",
      "pl": "+INT",
      "ru": "ИНТ",
      "sp": "de INT",
      "sw": "of INT",
      "th": "of INT",
      "tw": "智力的",
      "vi": "of INT"
    },
    "minimumLevel": 10,
    "abilities": [
      {
        "parameter": "int",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "of STA",
      "ar": "of STA",
      "br": "de Vigor",
      "cns": "体质的",
      "de": "STA",
      "fi": "STA",
      "fil": "of STA",
      "fr": "de END",
      "id": "of STA",
      "it": "con STA",
      "jp": "体力の",
      "kr": "STA",
      "nl": "van STA",
      "pl": "+STA",
      "ru": "ВНС",
      "sp": "de STA",
      "sw": "of STA",
      "th": "of STA",
      "tw": "體力的",
      "vi": "of STA"
    },
    "minimumLevel": 10,
    "abilities": [
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "of STR and STA",
      "ar": "of STR and STA",
      "br": "de Força e Vigor",
      "cns": "力量与体质的",
      "de": "STR und STA",
      "fi": "STR ja STA",
      "fil": "of STR and STA",
      "fr": "de FOR et END",
      "id": "of STR and STA",
      "it": "con STR e STA",
      "jp": "力と体力の",
      "kr": "STR, STA",
      "nl": "van STR en STA",
      "pl": "+STR i STA",
      "ru": "СИЛ+ВНС",
      "sp": "de STR y STA",
      "sw": "of STR and STA",
      "th": "of STR and STA",
      "tw": "力量與體力的",
      "vi": "of STR and STA"
    },
    "minimumLevel": 15,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "of STR and DEX",
      "ar": "of STR and DEX",
      "br": "de Força e Destreza",
      "cns": "力量与敏捷的",
      "de": "STR und DEX",
      "fi": "STR ja DEX",
      "fil": "of STR and DEX",
      "fr": "de FOR et DEX",
      "id": "of STR and DEX",
      "it": "con STR e DEX",
      "jp": "力と敏捷の",
      "kr": "STR, DEX",
      "nl": "van STR en DEX",
      "pl": "+STR i DEX",
      "ru": "СИЛ+ЛВК",
      "sp": "de STR y DEX",
      "sw": "of STR and DEX",
      "th": "of STR and DEX",
      "tw": "力量與敏捷的",
      "vi": "of STR and DEX"
    },
    "minimumLevel": 15,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 15,
    "abilities": [
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 15,
    "abilities": [
      {
        "parameter": "int",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR+",
      "ar": "STR+",
      "br": "do Atacante",
      "cns": "力量的",
      "de": "STR+",
      "fi": "STR+",
      "fil": "STR+",
      "fr": "FOR +",
      "id": "STR+",
      "it": "STR+",
      "jp": "力の",
      "kr": "STR+",
      "nl": "STR+",
      "pl": "STR+",
      "ru": "СИЛ",
      "sp": "STR+",
      "sw": "STR+",
      "th": "STR+",
      "tw": "力量的",
      "vi": "STR+"
    },
    "minimumLevel": 22,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX+",
      "ar": "DEX+",
      "br": "do Hábil",
      "cns": "敏捷的",
      "de": "DEX+",
      "fi": "DEX+",
      "fil": "DEX+",
      "fr": "DEX +",
      "id": "DEX+",
      "it": "DEX+",
      "jp": "敏捷の",
      "kr": "DEX+",
      "nl": "DEX+",
      "pl": "DEX+",
      "ru": "ЛВК",
      "sp": "DEX+",
      "sw": "DEX+",
      "th": "DEX+",
      "tw": "敏捷+",
      "vi": "DEX+"
    },
    "minimumLevel": 22,
    "abilities": [
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT+",
      "ar": "INT+",
      "br": "do Sábio",
      "cns": "智力的",
      "de": "INT+",
      "fi": "INT+",
      "fil": "INT+",
      "fr": "INT +",
      "id": "INT+",
      "it": "INT+",
      "jp": "知能の",
      "kr": "INT+",
      "nl": "INT+",
      "pl": "INT+",
      "ru": "ИНТ",
      "sp": "INT+",
      "sw": "INT+",
      "th": "INT+",
      "tw": "智力的",
      "vi": "INT+"
    },
    "minimumLevel": 22,
    "abilities": [
      {
        "parameter": "int",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STA+",
      "ar": "STA+",
      "br": "do Defensor",
      "cns": "体质的",
      "de": "STA+",
      "fi": "STA",
      "fil": "STA+",
      "fr": "END +",
      "id": "STA+",
      "it": "STA+",
      "jp": "体力の",
      "kr": "STA+",
      "nl": "STA+",
      "pl": "STA+",
      "ru": "ВНС",
      "sp": "STA+",
      "sw": "STA+",
      "th": "STA+",
      "tw": "體力的",
      "vi": "STA+"
    },
    "minimumLevel": 22,
    "abilities": [
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "int",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 30,
    "abilities": [
      {
        "parameter": "int",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR+",
      "ar": "STR+",
      "br": "do Atacante",
      "cns": "力量的",
      "de": "STR+",
      "fi": "STR+",
      "fil": "STR+",
      "fr": "FOR +",
      "id": "STR+",
      "it": "STR+",
      "jp": "力の",
      "kr": "STR+",
      "nl": "STR+",
      "pl": "STR+",
      "ru": "СИЛ",
      "sp": "STR+",
      "sw": "STR+",
      "th": "STR+",
      "tw": "力量的",
      "vi": "STR+"
    },
    "minimumLevel": 37,
    "abilities": [
      {
        "parameter": "str",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX+",
      "ar": "DEX+",
      "br": "do Hábil",
      "cns": "敏捷的",
      "de": "DEX+",
      "fi": "DEX+",
      "fil": "DEX+",
      "fr": "DEX +",
      "id": "DEX+",
      "it": "DEX+",
      "jp": "敏捷の",
      "kr": "DEX+",
      "nl": "DEX+",
      "pl": "DEX+",
      "ru": "ЛВК",
      "sp": "DEX+",
      "sw": "DEX+",
      "th": "DEX+",
      "tw": "敏捷+",
      "vi": "DEX+"
    },
    "minimumLevel": 37,
    "abilities": [
      {
        "parameter": "dex",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT+",
      "ar": "INT+",
      "br": "do Sábio",
      "cns": "智力的",
      "de": "INT+",
      "fi": "INT+",
      "fil": "INT+",
      "fr": "INT +",
      "id": "INT+",
      "it": "INT+",
      "jp": "知能の",
      "kr": "INT+",
      "nl": "INT+",
      "pl": "INT+",
      "ru": "ИНТ",
      "sp": "INT+",
      "sw": "INT+",
      "th": "INT+",
      "tw": "智力的",
      "vi": "INT+"
    },
    "minimumLevel": 37,
    "abilities": [
      {
        "parameter": "int",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STA+",
      "ar": "STA+",
      "br": "do Defensor",
      "cns": "体质的",
      "de": "STA+",
      "fi": "STA",
      "fil": "STA+",
      "fr": "END +",
      "id": "STA+",
      "it": "STA+",
      "jp": "体力の",
      "kr": "STA+",
      "nl": "STA+",
      "pl": "STA+",
      "ru": "ВНС",
      "sp": "STA+",
      "sw": "STA+",
      "th": "STA+",
      "tw": "體力的",
      "vi": "STA+"
    },
    "minimumLevel": 37,
    "abilities": [
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "str",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "dex",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "dex",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "int",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "int",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 1,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 45,
    "abilities": [
      {
        "parameter": "int",
        "add": 1,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR+",
      "ar": "STR+",
      "br": "do Atacante",
      "cns": "力量的",
      "de": "STR+",
      "fi": "STR+",
      "fil": "STR+",
      "fr": "FOR +",
      "id": "STR+",
      "it": "STR+",
      "jp": "力の",
      "kr": "STR+",
      "nl": "STR+",
      "pl": "STR+",
      "ru": "СИЛ",
      "sp": "STR+",
      "sw": "STR+",
      "th": "STR+",
      "tw": "力量的",
      "vi": "STR+"
    },
    "minimumLevel": 52,
    "abilities": [
      {
        "parameter": "str",
        "add": 4,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX+",
      "ar": "DEX+",
      "br": "do Hábil",
      "cns": "敏捷的",
      "de": "DEX+",
      "fi": "DEX+",
      "fil": "DEX+",
      "fr": "DEX +",
      "id": "DEX+",
      "it": "DEX+",
      "jp": "敏捷の",
      "kr": "DEX+",
      "nl": "DEX+",
      "pl": "DEX+",
      "ru": "ЛВК",
      "sp": "DEX+",
      "sw": "DEX+",
      "th": "DEX+",
      "tw": "敏捷+",
      "vi": "DEX+"
    },
    "minimumLevel": 52,
    "abilities": [
      {
        "parameter": "dex",
        "add": 4,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT+",
      "ar": "INT+",
      "br": "do Sábio",
      "cns": "智力的",
      "de": "INT+",
      "fi": "INT+",
      "fil": "INT+",
      "fr": "INT +",
      "id": "INT+",
      "it": "INT+",
      "jp": "知能の",
      "kr": "INT+",
      "nl": "INT+",
      "pl": "INT+",
      "ru": "ИНТ",
      "sp": "INT+",
      "sw": "INT+",
      "th": "INT+",
      "tw": "智力的",
      "vi": "INT+"
    },
    "minimumLevel": 52,
    "abilities": [
      {
        "parameter": "int",
        "add": 4,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STA+",
      "ar": "STA+",
      "br": "do Defensor",
      "cns": "体质的",
      "de": "STA+",
      "fi": "STA",
      "fil": "STA+",
      "fr": "END +",
      "id": "STA+",
      "it": "STA+",
      "jp": "体力の",
      "kr": "STA+",
      "nl": "STA+",
      "pl": "STA+",
      "ru": "ВНС",
      "sp": "STA+",
      "sw": "STA+",
      "th": "STA+",
      "tw": "體力的",
      "vi": "STA+"
    },
    "minimumLevel": 52,
    "abilities": [
      {
        "parameter": "sta",
        "add": 4,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "str",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and STA+",
      "ar": "STR and STA+",
      "br": "do Conflito",
      "cns": "力量与体质的",
      "de": "STR und STA+",
      "fi": "STR ja STA+",
      "fil": "STR and STA+",
      "fr": "FOR et END +",
      "id": "STR and STA+",
      "it": "STR e STA+",
      "jp": "力と体力の",
      "kr": "STR + STA+",
      "nl": "STR en STA+",
      "pl": "STR i STA+",
      "ru": "СИЛ+ВНС",
      "sp": "STR y STA+",
      "sw": "STR and STA+",
      "th": "STR and STA+",
      "tw": "力量與體力的",
      "vi": "STR and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "str",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "STR and DEX+",
      "ar": "STR and DEX+",
      "br": "da Destruição",
      "cns": "力量与敏捷的",
      "de": "STR und DEX+",
      "fi": "STR and DEX+",
      "fil": "STR and DEX+",
      "fr": "FOR et DEX +",
      "id": "STR and DEX+",
      "it": "STR e DEX+",
      "jp": "力と敏捷の",
      "kr": "STR & DEX+",
      "nl": "STR en DEX+",
      "pl": "STR i DEX+",
      "ru": "СИЛ+ЛВК",
      "sp": "STR y DEX+",
      "sw": "STR and DEX+",
      "th": "STR and DEX+",
      "tw": "力量和敏捷+",
      "vi": "STR and DEX+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "str",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "dex",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "dex",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "DEX and STA+",
      "ar": "DEX and STA+",
      "br": "da Devastação",
      "cns": "敏捷与体质的",
      "de": "DEX und STA+",
      "fi": "DEX ja STA+",
      "fil": "DEX and STA+",
      "fr": "DEX et END +",
      "id": "DEX and STA+",
      "it": "DEX e STA+",
      "jp": "敏捷と体力の",
      "kr": "DEX & STA+",
      "nl": "DEX en STA+",
      "pl": "DEX i STA+",
      "ru": "ЛВК+ВНС",
      "sp": "DEX y STA+",
      "sw": "DEX and STA+",
      "th": "DEX and STA+",
      "tw": "敏捷與體力的",
      "vi": "DEX and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "dex",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "int",
        "add": 3,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 2,
        "rate": false
      }
    ]
  },
  {
    "title": {
      "en": "INT and STA+",
      "ar": "INT and STA+",
      "br": "do Equilíbrio",
      "cns": "智力与体质的",
      "de": "INT und STA+",
      "fi": "INT ja STA+",
      "fil": "INT and STA+",
      "fr": "INT et END +",
      "id": "INT and STA+",
      "it": "INT e STA+",
      "jp": "知能と体力の",
      "kr": "INT & STA+",
      "nl": "INT en STA+",
      "pl": "INT i STA+",
      "ru": "ИНТ+ВНС",
      "sp": "INT y STA+",
      "sw": "INT and STA+",
      "th": "INT and STA+",
      "tw": "智力與體力的",
      "vi": "INT and STA+"
    },
    "minimumLevel": 60,
    "abilities": [
      {
        "parameter": "int",
        "add": 2,
        "rate": false
      },
      {
        "parameter": "sta",
        "add": 3,
        "rate": false
      }
    ]
  }
])
/**
 * ITEM_AWAKENEDS_STATS（对象，对外导出）
 * 用途：提供按序号字符串快速索引访问“物品觉醒词条”
 * 键：'0'、'1'、...（字符串化索引，避免标题重复冲突）
 * 返回：冻结后的只读对象，禁止响应式包装
 */
export const ITEM_AWAKENEDS_STATS = Object.freeze(
  Object.fromEntries(
    ITEM_AWAKENEDS_STATS_LIST.map((item, index) => [String(index), item])
  )
)
