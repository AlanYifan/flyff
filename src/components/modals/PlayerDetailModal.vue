<template>
  <div ref="modalRef" class="modal-content player-detail-modal" :style="{ '--scale': modalScale }">
    <div class="modal-header" @mousedown="startDrag">
      <h2>玩家详情</h2>
      <button class="help-button" title="说明" @click="showHelpPanel = !showHelpPanel">?</button>
      <button class="close-button" @click="handleClose">&times;</button>
    </div>
    <div class="modal-body">
      <div class="stats-section">
        <div class="stats-group">
          <h3>基础属性</h3>
          <div class="stats-grid">
            <div class="stat-item player-info-item">
              <span class="stat-label">玩家名称</span>
              <!-- 徽章图标：显示在玩家名称左侧 -->
              <img
                v-if="equippedBadge"
                :src="`/pt/master_icon/${equippedBadge}`"
                :alt="'徽章'"
                class="player-badge-icon-detail"
              >
              <span v-if="equippedTitle" class="player-title-prefix">[{{ equippedTitle }}]</span>
              <span class="stat-value player-name">{{ currentPlayer.nickname || currentPlayer.name || '未命名' }}</span>
            </div>
            <div class="stat-item player-info-item">
              <span class="stat-label">职业</span>
              <span class="stat-value">{{ actualPlayerClassName }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">等级</span>
              <span class="stat-value">{{ playerStats.level }}</span>
            </div>
            <div v-if="hasStatValue(playerStats.maxHealth)" class="stat-item">
              <span class="stat-label">生命</span>
              <span class="stat-value">{{ playerStats.maxHealth }}</span>
            </div>
            <div v-if="hasStatValue(playerStats.maxMana)" class="stat-item">
              <span class="stat-label">魔法</span>
              <span class="stat-value">{{ playerStats.maxMana }}</span>
            </div>
            <div v-if="hasRangeValue(playerStats.minAttack, playerStats.maxAttack)" class="stat-item">
              <span class="stat-label">攻击</span>
              <span class="stat-value">
                {{ playerStats.minAttack }}~{{ playerStats.maxAttack }}
              </span>
            </div>
            <div v-if="hasRangeValue(playerStats.offhandMinAttack, playerStats.offhandMaxAttack)" class="stat-item">
              <span class="stat-label">副手攻击</span>
              <span class="stat-value" style="color: #e74c3c;">
                {{ playerStats.offhandMinAttack }}~{{ playerStats.offhandMaxAttack }}
              </span>
            </div>
            <div v-if="hasRangeValue(playerStats.minDefense, playerStats.maxDefense)" class="stat-item">
              <span class="stat-label">防御</span>
              <span class="stat-value">
                {{ playerStats.minDefense }}~{{ playerStats.maxDefense }}
              </span>
            </div>
            <div v-if="hasStatValue(playerStats.magicDefense)" class="stat-item">
              <span class="stat-label">魔法防御</span>
              <span class="stat-value">{{ playerStats.magicDefense }}</span>
            </div>
          </div>
        </div>

        <div v-if="battleGroupVisible" class="stats-group">
          <h3>战斗属性</h3>
          <div class="stats-grid">
            <div v-if="hasStatValue(playerStats.hitRate)" class="stat-item">
              <span class="stat-label">命中</span>
              <span class="stat-value">{{ playerStats.hitRate }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.dodgeRate)" class="stat-item">
              <span class="stat-label">闪避</span>
              <span class="stat-value">{{ playerStats.dodgeRate }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.blockRate)" class="stat-item">
              <span class="stat-label">格挡</span>
              <span class="stat-value">{{ playerStats.blockRate }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.criticalRate)" class="stat-item">
              <span class="stat-label">暴击率</span>
              <span class="stat-value">{{ playerStats.criticalRate }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.criticalDamage)" class="stat-item">
              <span class="stat-label">暴击伤害</span>
              <span class="stat-value">{{ playerStats.criticalDamage }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.criticalResistance)" class="stat-item">
              <span class="stat-label">暴击抗性</span>
              <span class="stat-value">{{ playerStats.criticalResistance }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.attackSpeed)" class="stat-item">
              <span class="stat-label">攻击速度</span>
              <span class="stat-value">{{ playerStats.attackSpeed }}%</span>
            </div>
          </div>
        </div>

        <div v-if="specialGroupVisible" class="stats-group">
          <h3>特殊效果</h3>
          <div class="stats-grid">
            <div v-if="hasStatValue(playerStats.castingTime)" class="stat-item">
              <span class="stat-label">施法速度</span>
              <span class="stat-value">{{ playerStats.castingTime }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.healPercent)" class="stat-item">
              <span class="stat-label">治疗</span>
              <span class="stat-value">{{ playerStats.healPercent }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.hpRegeneration)" class="stat-item">
              <span class="stat-label">击杀生命恢复</span>
              <span class="stat-value">{{ playerStats.hpRegeneration }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.lifeStealing)" class="stat-item">
              <span class="stat-label">吸血</span>
              <span class="stat-value">{{ playerStats.lifeStealing }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.stun)" class="stat-item">
              <span class="stat-label">眩晕</span>
              <span class="stat-value">{{ playerStats.stun }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.blockPenetration)" class="stat-item">
              <span class="stat-label">格挡穿透</span>
              <span class="stat-value">{{ playerStats.blockPenetration }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.pveDamage)" class="stat-item">
              <span class="stat-label">PVE伤害</span>
              <span class="stat-value">{{ playerStats.pveDamage }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.pveDamageReduction)" class="stat-item">
              <span class="stat-label">PVE伤害减免</span>
              <span class="stat-value">{{ playerStats.pveDamageReduction }}%</span>
            </div>
          </div>
        </div>

        <div v-if="weaponGroupVisible" class="stats-group">
          <h3>武器属性</h3>
          <div class="stats-grid">
            <div v-if="hasStatValue(playerStats.bowAttack)" class="stat-item">
              <span class="stat-label">弓</span>
              <span class="stat-value">{{ playerStats.bowAttack }}</span>
            </div>
            <div v-if="hasStatValue(playerStats.yoyoAttack)" class="stat-item">
              <span class="stat-label">飞轮</span>
              <span class="stat-value">{{ playerStats.yoyoAttack }}</span>
            </div>
            <div v-if="hasStatValue(playerStats.axeAttack)" class="stat-item">
              <span class="stat-label">斧</span>
              <span class="stat-value">{{ playerStats.axeAttack }}</span>
            </div>
            <div v-if="hasStatValue(playerStats.swordAttack)" class="stat-item">
              <span class="stat-label">剑</span>
              <span class="stat-value">{{ playerStats.swordAttack }}</span>
            </div>
          </div>
        </div>

        <div v-if="elementGroupVisible" class="stats-group">
          <h3>元素攻击属性</h3>
          <div class="stats-grid">
            <div v-if="elementAttackInfo.label" class="stat-item">
              <span class="stat-label">属性攻击</span>
              <span class="stat-value">{{ elementAttackInfo.label }}</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.fireAttack)"
              class="stat-item element-stat">
              <img src="/pt/element/fire_火.png" alt="火" class="element-icon" />
              <span class="stat-label">火属性攻击</span>
              <span class="stat-value">{{ playerStats.fireAttack }}%</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.waterAttack)"
              class="stat-item element-stat">
              <img src="/pt/element/water_水.png" alt="水" class="element-icon" />
              <span class="stat-label">水属性攻击</span>
              <span class="stat-value">{{ playerStats.waterAttack }}%</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.windAttack)"
              class="stat-item element-stat">
              <img src="/pt/element/wind_风.png" alt="风" class="element-icon" />
              <span class="stat-label">风属性攻击</span>
              <span class="stat-value">{{ playerStats.windAttack }}%</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.thunderAttack)"
              class="stat-item element-stat">
              <img src="/pt/element/electricity_雷.png" alt="雷" class="element-icon" />
              <span class="stat-label">雷属性攻击</span>
              <span class="stat-value">{{ playerStats.thunderAttack }}%</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.earthAttack)"
              class="stat-item element-stat">
              <img src="/pt/element/earth_土.png" alt="土" class="element-icon" />
              <span class="stat-label">土属性攻击</span>
              <span class="stat-value">{{ playerStats.earthAttack }}%</span>
            </div>
          </div>
        </div>

        <!-- 元素防御抗性 -->
        <div v-if="elementDefenseGroupVisible" class="stats-group">
          <h3>元素防御抗性</h3>
          <div class="stats-grid">
            <div
              v-if="hasStatValue(playerStats.fireDefense)"
              class="stat-item element-stat">
              <img src="/pt/element/fire_火.png" alt="火" class="element-icon" />
<span class="stat-label">火属性抗性</span>
<span class="stat-value">{{ formatDefenseValue(playerStats.fireDefense) }}</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.waterDefense)"
              class="stat-item element-stat">
              <img src="/pt/element/water_水.png" alt="水" class="element-icon" />
<span class="stat-label">水属性抗性</span>
<span class="stat-value">{{ formatDefenseValue(playerStats.waterDefense) }}</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.windDefense)"
              class="stat-item element-stat">
              <img src="/pt/element/wind_风.png" alt="风" class="element-icon" />
<span class="stat-label">风属性抗性</span>
<span class="stat-value">{{ formatDefenseValue(playerStats.windDefense) }}</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.thunderDefense)"
              class="stat-item element-stat">
              <img src="/pt/element/electricity_雷.png" alt="雷" class="element-icon" />
<span class="stat-label">雷属性抗性</span>
<span class="stat-value">{{ formatDefenseValue(playerStats.thunderDefense) }}</span>
            </div>
            <div
              v-if="hasStatValue(playerStats.earthDefense)"
              class="stat-item element-stat">
              <img src="/pt/element/earth_土.png" alt="土" class="element-icon" />
<span class="stat-label">土属性抗性</span>
<span class="stat-value">{{ formatDefenseValue(playerStats.earthDefense) }}</span>
            </div>
          </div>
        </div>

        <div v-if="skillGroupVisible" class="stats-group">
          <h3>技能属性</h3>
          <div class="stats-grid">
            <div v-if="hasStatValue(playerStats.skillDamage)" class="stat-item">
              <span class="stat-label">技能伤害</span>
              <span class="stat-value">{{ playerStats.skillDamage }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.skillChance)" class="stat-item">
              <span class="stat-label">{{ skillChanceLabel }}</span>
              <span class="stat-value">{{ playerStats.skillChance }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.mpReduction)" class="stat-item">
              <span class="stat-label">MP消耗减少</span>
              <span class="stat-value">{{ playerStats.mpReduction }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.fpReduction)" class="stat-item">
              <span class="stat-label">FP消耗减少</span>
              <span class="stat-value">{{ playerStats.fpReduction }}%</span>
            </div>
            <div v-if="hasStatValue(playerStats.mpRecoveryAfterKill)" class="stat-item">
              <span class="stat-label">击杀MP恢复</span>
              <span class="stat-value">{{ playerStats.mpRecoveryAfterKill }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="attribute-section">
        <div class="free-points">
          <div class="points-label">可用点数</div>
          <div class="points-value">{{ player?.stats?.freePoints || 0 }}</div>
        </div>

        <div class="attribute-group">
          <div class="attribute-item">
            <span class="attribute-name">力量<span v-if="isPrimaryStat('strength')" class="primary-stat-badge">(主)</span></span>
            <span class="attribute-value">{{ attributeTotals.strength }}</span>
            <div class="attribute-controls">
              <button :disabled="!canDecreaseAttribute('strength')" v-on="pressHandlers.decrease.strength.events" @touchstart.passive="pressHandlers.decrease.strength.touchstart" @touchend="pressHandlers.decrease.strength.touchend">
                -
              </button>
              <button :disabled="(player?.stats?.freePoints || 0) <= 0" v-on="pressHandlers.increase.strength.events" @touchstart.passive="pressHandlers.increase.strength.touchstart" @touchend="pressHandlers.increase.strength.touchend">
                +
              </button>
            </div>
          </div>

          <div class="attribute-item">
            <span class="attribute-name">体质</span>
            <span class="attribute-value">{{ attributeTotals.constitution }}</span>
            <div class="attribute-controls">
              <button :disabled="!canDecreaseAttribute('constitution')" v-on="pressHandlers.decrease.constitution.events" @touchstart.passive="pressHandlers.decrease.constitution.touchstart" @touchend="pressHandlers.decrease.constitution.touchend">
                -
              </button>
              <button :disabled="(player?.stats?.freePoints || 0) <= 0" v-on="pressHandlers.increase.constitution.events" @touchstart.passive="pressHandlers.increase.constitution.touchstart" @touchend="pressHandlers.increase.constitution.touchend">
                +
              </button>
            </div>
          </div>

          <div class="attribute-item">
            <span class="attribute-name">智力<span v-if="isPrimaryStat('intelligence')" class="primary-stat-badge">(主)</span></span>
            <span class="attribute-value">{{ attributeTotals.intelligence }}</span>
            <div class="attribute-controls">
              <button :disabled="!canDecreaseAttribute('intelligence')" v-on="pressHandlers.decrease.intelligence.events" @touchstart.passive="pressHandlers.decrease.intelligence.touchstart" @touchend="pressHandlers.decrease.intelligence.touchend">
                -
              </button>
              <button :disabled="(player?.stats?.freePoints || 0) <= 0" v-on="pressHandlers.increase.intelligence.events" @touchstart.passive="pressHandlers.increase.intelligence.touchstart" @touchend="pressHandlers.increase.intelligence.touchend">
                +
              </button>
            </div>
          </div>

          <div class="attribute-item">
            <span class="attribute-name">敏捷<span v-if="isPrimaryStat('agility')" class="primary-stat-badge">(主)</span></span>
            <span class="attribute-value">{{ attributeTotals.agility }}</span>
            <div class="attribute-controls">
              <button :disabled="!canDecreaseAttribute('agility')" v-on="pressHandlers.decrease.agility.events" @touchstart.passive="pressHandlers.decrease.agility.touchstart" @touchend="pressHandlers.decrease.agility.touchend">
                -
              </button>
              <button :disabled="(player?.stats?.freePoints || 0) <= 0" v-on="pressHandlers.increase.agility.events" @touchstart.passive="pressHandlers.increase.agility.touchstart" @touchend="pressHandlers.increase.agility.touchend">
                +
              </button>
            </div>
          </div>
        </div>

        <button class="confirm-btn" :disabled="(player?.stats?.freePoints || 0) > 0" @click="confirmAttributes">
          确认分配
        </button>
      </div>
    </div>
    <div v-if="showHelpPanel" class="help-panel">
      <div class="help-panel-header">{{ helpTitle }}</div>
      <div class="help-panel-content">
        <div class="help-section-title">防御减伤（等级差）</div>
        <div class="help-line">平级：防御力最高减伤50%</div>
        <div class="help-line">玩家每高1级：减伤+2.5%，最高90%，≥20级差固定90%</div>
        <div class="help-section-title">玩家对怪物伤害（等级差）</div>
        <div class="help-line">平级：玩家对怪物伤害=100%</div>
        <div class="help-line">怪物每比玩家高1级：玩家伤害-5%，最高-95%</div>
        <div class="help-line">怪物每比玩家低1级：玩家伤害+5%，最高+100%</div>
        <div class="help-section-title">格挡减伤（等级差）</div>
        <div class="help-line">平级：格挡后伤害减免70%</div>
        <div class="help-line">怪物每高1级：格挡减伤+1%，最高+20%（至90%）</div>
        <div class="help-line">怪物每低1级：格挡减伤-1%，最低减免50%</div>
        <div class="help-section-title">主属性说明</div>
        <div class="help-line">力量 = 战士主属性（增加战士攻击力）</div>
        <div class="help-line">体质 = 增加生命值和防御力</div>
        <div class="help-line">敏捷 = 弓箭手主属性（增加弓箭手攻击力，增加所有职业命中率、闪避率、格挡率、暴击率）</div>
        <div class="help-line">智力 = 圣职者/魔导士主属性（增加圣职者/魔导士攻击力，增加所有职业魔法值、魔法防御）</div>
      </div>
    </div>
    <div class="resize-handle resize-handle-right" @mousedown="startResize($event, 'right')"></div>
    <div class="resize-handle resize-handle-left" @mousedown="startResize($event, 'left')"></div>
    <div class="resize-handle resize-handle-bottom" @mousedown="startResize($event, 'bottom')"></div>
    <div class="resize-handle resize-handle-top" @mousedown="startResize($event, 'top')"></div>
    <div
      class="resize-handle resize-handle-corner resize-handle-bottom-right"
      @mousedown="startResize($event, 'bottom-right')"
    ></div>
    <div
      class="resize-handle resize-handle-corner resize-handle-bottom-left"
      @mousedown="startResize($event, 'bottom-left')"
    ></div>
    <div
      class="resize-handle resize-handle-corner resize-handle-top-right"
      @mousedown="startResize($event, 'top-right')"
    ></div>
    <div
      class="resize-handle resize-handle-corner resize-handle-top-left"
      @mousedown="startResize($event, 'top-left')"
    ></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { useRaisedPetSummonStore } from '@/store/raisedPetSummon'
import PlayerStatsService from '@/services/PlayerStatsService'
import { DamageCalculator } from '@/utils/damageCalculator'
import { getClassNameByKey } from '@/utils/itemHelpers'
import { CLASS_GROWTH_FORMULAS, getClassName } from '@/data/classes'
import { COMMON_SKILLS } from '@/data/skills'
import {
  getOffhandWeapon,
  getOffhandAttackBonus,
  OFFHAND_ATTRIBUTE_RATIO
} from '@/composables/useDualWield'
import { getOffhandWeaponMasteryBonus } from '@/composables/useWeaponMastery'
import { applyWeaponDamageFormula } from '@/utils/gameTools'
import { usePressAndRepeat } from '@/composables/usePressAndRepeat'

const props = defineProps({
  player: {
    type: Object,
    default: null
  },
  playerAvatar: {
    type: String,
    default: ''
  },
  playerClassName: {
    type: String,
    default: ''
  },
  healthPercentage: {
    type: Number,
    default: 100
  },
  manaPercentage: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['close', 'confirm-attributes'])

const gameStore = useGameStore()
const itemsStore = useItemsStore()
const raisedPetSummonStore = useRaisedPetSummonStore()

// 使用传入的 player prop，如果没有传入则使用 gameStore.player
const currentPlayer = computed(() => props.player || gameStore.player)

/** 当前佩戴的称号（从 player.achievement.currentTitle 读取） */
const equippedTitle = computed(() => currentPlayer.value?.achievement?.currentTitle || '')

/** 当前佩戴的徽章文件名（从 player.achievement.currentBadge 读取） */
const equippedBadge = computed(() => currentPlayer.value?.achievement?.currentBadge || '')

// 玩家职业名称（使用 props 传入的值，如果没有则计算）
const computedPlayerClassName = computed(() => {
  return getClassNameByKey(currentPlayer.value?.class) || '初心者'
})

// 获取实际使用的职业名称（优先使用 props）
const actualPlayerClassName = computed(() => {
  return props.playerClassName || computedPlayerClassName.value
})

/**
 * 获取当前职业的主属性
 * 根据CLASS_GROWTH_FORMULAS配置判断哪个属性有攻击力加成
 * @returns {string} 主属性名称：'strength' | 'agility' | 'intelligence' | null
 */
const primaryStat = computed(() => {
  const className = getClassName(currentPlayer.value?.class)
  const formula = CLASS_GROWTH_FORMULAS[className]
  if (!formula) return null

  const pointGrowth = formula?.属性点增加的属性 || {}

  // 检查哪个属性有攻击力加成（主属性标志）
  if (pointGrowth.力量?.最小攻击力 || pointGrowth.力量?.最大攻击力) {
    return 'strength'
  }
  if (pointGrowth.敏捷?.最小攻击力 || pointGrowth.敏捷?.最大攻击力) {
    return 'agility'
  }
  if (pointGrowth.智力?.最小攻击力 || pointGrowth.智力?.最大攻击力) {
    return 'intelligence'
  }

  return null
})

/**
 * 判断某个属性是否是当前职业的主属性
 * @param {string} statName - 属性名称
 * @returns {boolean}
 */
const isPrimaryStat = (statName) => {
  return primaryStat.value === statName
}

const modalRef = ref(null)
const showHelpPanel = ref(false)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const modalScale = ref(1)
const baselineStats = ref({
  strength: 1,
  constitution: 1,
  intelligence: 1,
  agility: 1
})
// 用于强制刷新 playerStats computed 属性的版本号
const statsVersion = ref(0)
const helpTitle = '效果说明'
const isResizing = ref(false)
const resizeStart = ref({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  handle: 'right'
})
let resizeObserver = null

const handleClose = () => {
  emit('close')
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

const hasStatValue = value => Number(value) !== 0

const hasRangeValue = (minValue, maxValue) =>
  Number(minValue) !== 0 || Number(maxValue) !== 0

/**
 * 格式化元素抗性数值，正值显示 +N%，负值显示 -N%
 * @param {number|string} value - 抗性数值
 * @returns {string} 格式化后的显示字符串
 */
const formatDefenseValue = value => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0%'
  if (num >= 0) return `+${num}%`
  return `${num}%`
}

const isEquipmentSetsAvailable = sets => {
  if (!sets) {
    return false
  }
  if (Array.isArray(sets)) {
    return sets.length > 0
  }
  if (typeof sets === 'object') {
    return Object.keys(sets).length > 0
  }
  return false
}

const activeEquipmentSets = computed(() => {
  if (isEquipmentSetsAvailable(gameStore.equipmentSets)) {
    return gameStore.equipmentSets
  }
  if (isEquipmentSetsAvailable(itemsStore.equipmentSets)) {
    return itemsStore.equipmentSets
  }
  return []
})

const equipmentSignature = computed(() => {
  const equipment = itemsStore.equipment || {}
  return Object.values(equipment)
    .map(item => String(item?.uniqueId ?? item?.id ?? ''))
    .join('|')
})

const raisedPetAbilitySignature = computed(() => {
  return [
    raisedPetSummonStore.hasSummonedPet ? '1' : '0',
    raisedPetSummonStore.isEnergyActive ? '1' : '0',
    String(raisedPetSummonStore.summonedPetBuffParameter || '').trim(),
    String(raisedPetSummonStore.summonedPetBuffValue ?? ''),
    raisedPetSummonStore.summonedPetBuffRate ? '1' : '0',
    String(raisedPetSummonStore.summonedPetIcon || '')
  ].join('|')
})

let lastApplyStatsTime = 0
const APPLY_STATS_THROTTLE_MS = 100 // 100ms 内只执行一次

const applyStatsWithCurrentEquipment = () => {
  if (!currentPlayer.value) {
    return
  }

  // 节流：避免短时间内重复调用
  const now = Date.now()
  if (now - lastApplyStatsTime < APPLY_STATS_THROTTLE_MS) {
    return
  }
  lastApplyStatsTime = now

  const equipment = itemsStore.equipment ? { ...itemsStore.equipment } : {}
  if (equipment && typeof equipment === 'object') {
    currentPlayer.value.equipment = equipment
  }

  if (typeof currentPlayer.value.applyFinalStats === 'function') {
    currentPlayer.value.applyFinalStats(activeEquipmentSets.value)
  }
}

const attributeBonuses = computed(() => {
  if (!currentPlayer.value) {
    return {
      strength: 0,
      constitution: 0,
      intelligence: 0,
      agility: 0
    }
  }
  const playerSnapshot = {
    ...currentPlayer.value,
    equipment: itemsStore.equipment ? { ...itemsStore.equipment } : currentPlayer.value?.equipment
  }
  const bonuses = PlayerStatsService.calculateEquipmentBonuses(
    playerSnapshot,
    activeEquipmentSets.value
  )
  return {
    strength: bonuses.strength || 0,
    constitution: bonuses.constitution || bonuses.stamina || 0,
    intelligence: bonuses.intelligence || 0,
    agility: bonuses.agility || 0
  }
})

const attributeTotals = computed(() => {
  const baseStrength = Number(currentPlayer.value?.stats?.strength) || 1
  const baseConstitution = Number(currentPlayer.value?.stats?.constitution) || 1
  const baseIntelligence = Number(currentPlayer.value?.stats?.intelligence) || 1
  const baseAgility = Number(currentPlayer.value?.stats?.agility) || 1
  const activeBuffs = Array.isArray(currentPlayer.value?.activeBuffs) ? currentPlayer.value.activeBuffs : []
  const buffBonuses = activeBuffs.reduce(
    (acc, buff) => {
      if (!buff || typeof buff !== 'object') {
        return acc
      }
      const parameterMap = {
        str: 'strength',
        strength: 'strength',
        dex: 'agility',
        dexterity: 'agility',
        agi: 'agility',
        agility: 'agility',
        int: 'intelligence',
        intelligence: 'intelligence',
        sta: 'constitution',
        con: 'constitution',
        vit: 'constitution',
        constitution: 'constitution'
      }
      const effects = buff.effects
      if (effects && typeof effects === 'object') {
        Object.entries(effects).forEach(([key, rawValue]) => {
          let numeric = Number(rawValue)
          let paramKey = key

          // 兼容新的对象格式 { add, rate, description, type }
          if (rawValue && typeof rawValue === 'object') {
            if (rawValue.add !== undefined) {
              numeric = Number(rawValue.add)
            }
            if (rawValue.type) {
              paramKey = rawValue.type
            }
          }

          if (!Number.isFinite(numeric) || numeric === 0) {
            return
          }
          const normalizedKey = String(paramKey || '').toLowerCase()
          const resolvedKey = parameterMap[normalizedKey] || normalizedKey
          if (resolvedKey in acc) {
            acc[resolvedKey] += numeric
          }
        })
      }
      const rawValue = buff.value ?? buff.add ?? buff.amount
      const numericValue = Number(rawValue)
      if (!Number.isFinite(numericValue) || numericValue === 0) {
        return acc
      }
      const rawParameter = buff.parameter ?? buff.type ?? ''
      const normalizedParameter = String(rawParameter || '').toLowerCase()
      const resolvedKey = parameterMap[normalizedParameter] || normalizedParameter
      if (resolvedKey in acc) {
        acc[resolvedKey] += numericValue
      }
      return acc
    },
    {
      strength: 0,
      constitution: 0,
      intelligence: 0,
      agility: 0
    }
  )
  return {
    strength: baseStrength + (attributeBonuses.value.strength || 0) + (buffBonuses.strength || 0),
    constitution:
      baseConstitution +
      (attributeBonuses.value.constitution || 0) +
      (buffBonuses.constitution || 0),
    intelligence:
      baseIntelligence +
      (attributeBonuses.value.intelligence || 0) +
      (buffBonuses.intelligence || 0),
    agility: baseAgility + (attributeBonuses.value.agility || 0) + (buffBonuses.agility || 0)
  }
})

const battleGroupVisible = computed(() => {
  return (
    hasStatValue(playerStats.value.hitRate) ||
    hasStatValue(playerStats.value.dodgeRate) ||
    hasStatValue(playerStats.value.blockRate) ||
    hasStatValue(playerStats.value.criticalRate) ||
    hasStatValue(playerStats.value.criticalDamage) ||
    hasStatValue(playerStats.value.attackSpeed) ||
    hasStatValue(playerStats.value.criticalResistance)
  )
})

const specialGroupVisible = computed(() => {
  return (
    hasStatValue(playerStats.value.castingTime) ||
    hasStatValue(playerStats.value.healPercent) ||
    hasStatValue(playerStats.value.hpRegeneration) ||
    hasStatValue(playerStats.value.lifeStealing) ||
    hasStatValue(playerStats.value.stun) ||
    hasStatValue(playerStats.value.blockPenetration) ||
    hasStatValue(playerStats.value.pveDamage) ||
    hasStatValue(playerStats.value.pveDamageReduction)
  )
})

const weaponGroupVisible = computed(() => {
  return (
    hasStatValue(playerStats.value.bowAttack) ||
    hasStatValue(playerStats.value.yoyoAttack) ||
    hasStatValue(playerStats.value.axeAttack) ||
    hasStatValue(playerStats.value.swordAttack)
  )
})

const elementGroupVisible = computed(() => {
  return (
    Boolean(elementAttackInfo.value.label) ||
    hasStatValue(playerStats.value.fireAttack) ||
    hasStatValue(playerStats.value.waterAttack) ||
    hasStatValue(playerStats.value.windAttack) ||
    hasStatValue(playerStats.value.thunderAttack) ||
    hasStatValue(playerStats.value.earthAttack)
  )
})

const elementDefenseGroupVisible = computed(() => {
  return (
    hasStatValue(playerStats.value.fireDefense) ||
    hasStatValue(playerStats.value.waterDefense) ||
    hasStatValue(playerStats.value.windDefense) ||
    hasStatValue(playerStats.value.thunderDefense) ||
    hasStatValue(playerStats.value.earthDefense)
  )
})

const skillGroupVisible = computed(() => {
  return (
    hasStatValue(playerStats.value.skillDamage) ||
    hasStatValue(playerStats.value.skillChance) ||
    hasStatValue(playerStats.value.mpReduction) ||
    hasStatValue(playerStats.value.fpReduction) ||
    hasStatValue(playerStats.value.mpRecoveryAfterKill)
  )
})

/**
 * 获取技能概率显示标签
 * 从装备的武器中获取技能名称，格式为"技能名称+概率"
 * @returns {string} 技能概率标签，如"水弹概率"
 */
const skillChanceLabel = computed(() => {
  const weapon = itemsStore.equipment?.weapon || currentPlayer.value?.equipment?.weapon
  if (!weapon || !weapon.abilities) {
    return '概率'
  }
  // 查找skillchance类型的ability
  const skillChanceAbility = weapon.abilities.find(
    ability => ability && String(ability.parameter).toLowerCase() === 'skillchance'
  )
  if (!skillChanceAbility || !skillChanceAbility.skill) {
    return '概率'
  }
  // 从COMMON_SKILLS中查找技能名称
  const skillKey = Object.keys(COMMON_SKILLS).find(
    key => COMMON_SKILLS[key].id === skillChanceAbility.skill
  )
  if (skillKey && COMMON_SKILLS[skillKey]?.name) {
    return `${COMMON_SKILLS[skillKey].name}概率`
  }
  return '概率'
})

const endDrag = () => {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
}

const onDrag = event => {
  if (!isDragging.value || !modalRef.value) {
    return
  }
  const modal = modalRef.value
  const maxX = Math.max(window.innerWidth - modal.offsetWidth, 0)
  const maxY = Math.max(window.innerHeight - modal.offsetHeight, 0)
  const nextX = Math.min(Math.max(event.clientX - dragOffset.value.x, 0), maxX)
  const nextY = Math.min(Math.max(event.clientY - dragOffset.value.y, 0), maxY)
  modal.style.left = `${nextX}px`
  modal.style.top = `${nextY}px`
  modal.style.transform = 'none'
}

const startDrag = event => {
  if (event.button !== 0) {
    return
  }
  const target = event.target
  if (target?.closest?.('button')) {
    return
  }
  const modal = modalRef.value
  if (!modal) {
    return
  }
  const rect = modal.getBoundingClientRect()
  modal.style.left = `${rect.left}px`
  modal.style.top = `${rect.top}px`
  modal.style.transform = 'none'
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  isDragging.value = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
}

const startResize = (event, handle) => {
  if (!modalRef.value) {
    return
  }
  isResizing.value = true
  const rect = modalRef.value.getBoundingClientRect()
  modalRef.value.style.left = `${rect.left}px`
  modalRef.value.style.top = `${rect.top}px`
  modalRef.value.style.transform = 'none'
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left,
    top: rect.top,
    width: modalRef.value.offsetWidth,
    height: modalRef.value.offsetHeight,
    handle: handle || 'right'
  }
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', stopResize)
  event.preventDefault()
  event.stopPropagation()
}

const handleResizeMove = event => {
  if (!isResizing.value || !modalRef.value) {
    return
  }
  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y
  let nextWidth = resizeStart.value.width
  let nextHeight = resizeStart.value.height
  let nextLeft = resizeStart.value.left
  let nextTop = resizeStart.value.top
  const handle = resizeStart.value.handle
  if (handle.includes('right')) {
    nextWidth = resizeStart.value.width + dx
  }
  if (handle.includes('left')) {
    nextWidth = resizeStart.value.width - dx
    nextLeft = resizeStart.value.left + dx
  }
  if (handle.includes('bottom')) {
    nextHeight = resizeStart.value.height + dy
  }
  if (handle.includes('top')) {
    nextHeight = resizeStart.value.height - dy
    nextTop = resizeStart.value.top + dy
  }
  const minWidth = 200
  const minHeight = 500
  const maxWidth = Math.max(minWidth, window.innerWidth - 10)
  const maxHeight = Math.max(minHeight, window.innerHeight - 10)
  nextWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth))
  nextHeight = Math.min(maxHeight, Math.max(minHeight, nextHeight))
  if (handle.includes('left')) {
    nextLeft = resizeStart.value.left + (resizeStart.value.width - nextWidth)
  } else {
    nextLeft = resizeStart.value.left
  }
  if (handle.includes('top')) {
    nextTop = resizeStart.value.top + (resizeStart.value.height - nextHeight)
  } else {
    nextTop = resizeStart.value.top
  }
  modalRef.value.style.width = `${Math.round(nextWidth)}px`
  modalRef.value.style.height = `${Math.round(nextHeight)}px`
  modalRef.value.style.left = `${Math.round(nextLeft)}px`
  modalRef.value.style.top = `${Math.round(nextTop)}px`
  clampModalToViewport()
}

const stopResize = () => {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', stopResize)
}

const clampModalToViewport = () => {
  if (!modalRef.value) {
    return
  }
  const rect = modalRef.value.getBoundingClientRect()
  const padding = 5
  const maxLeft = Math.max(padding, window.innerWidth - rect.width - padding)
  const maxTop = Math.max(padding, window.innerHeight - rect.height - padding)
  let left = rect.left
  let top = rect.top
  if (left < padding) {
    left = padding
  }
  if (top < padding) {
    top = padding
  }
  if (left > maxLeft) {
    left = maxLeft
  }
  if (top > maxTop) {
    top = maxTop
  }
  modalRef.value.style.left = `${Math.round(left)}px`
  modalRef.value.style.top = `${Math.round(top)}px`
}

onMounted(() => {
  // 注意：不在这里调用 applyStatsWithCurrentEquipment()
  // 因为 watch 的 immediate: true 已经会执行一次
  baselineStats.value = {
    strength: currentPlayer.value?.stats?.strength || 1,
    constitution: currentPlayer.value?.stats?.constitution || 1,
    intelligence: currentPlayer.value?.stats?.intelligence || 1,
    agility: currentPlayer.value?.stats?.agility || 1
  }
  const modal = modalRef.value
  if (!modal) {
    return
  }
  const updateScale = rect => {
    const scale = Math.min(rect.width / 300, rect.height / 500)
    modalScale.value = Number.isFinite(scale) && scale > 0 ? Number(scale.toFixed(3)) : 1
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      updateScale(entry.contentRect)
    })
    resizeObserver.observe(modal)
  } else {
    updateScale(modal.getBoundingClientRect())
  }
})

watch(
  equipmentSignature,
  () => {
    applyStatsWithCurrentEquipment()
  },
  { immediate: true }
)

watch(
  raisedPetAbilitySignature,
  () => {
    // 仅当当前显示的是队长（主玩家）面板时，才同步训养宠物 BUFF 到 gameStore.player
    // 队员的训养宠物 BUFF 不应通过 syncRaisedPetAbilityBuff 同步到队长身上（防止 BUFF 串显）
    const isShowingPlayerPanel = props.player === gameStore.player || 
                                  (props.player && props.player._isPlayer === true)
    if (isShowingPlayerPanel) {
      gameStore.syncRaisedPetAbilityBuff()
    }
    applyStatsWithCurrentEquipment()
    // 递增 statsVersion 强制 playerStats computed 重新求值
    // applyFinalStats 通过 toRaw 修改原始对象，Vue 响应式无法自动检测，需手动触发
    statsVersion.value++
  },
  { immediate: true }
)

watch(
  () => activeEquipmentSets.value,
  () => {
    applyStatsWithCurrentEquipment()
  }
)

// 监听 gameStore.buffVersion 变化，重新计算属性
// 由于 activeBuffs 使用 markRaw 包装，无法被 Vue 的深度监听检测到
// 所以需要在 BUFF 变化时更新 gameStore.buffVersion 来触发更新
watch(
  () => gameStore.buffVersion,
  () => {
    // 只针对队长（玩家）的情况：需要从 gameStore.player 同步最新的 activeBuffs
    // 队友的 activeBuffs 在 Dungeon.vue 的 recalculateMemberStats 中已经正确更新
    // 注意：这里判断 props.player === gameStore.player 或 props.player 与 gameStore.player 是同一对象
    // 来确定当前显示的是否是队长的详情面板
    const isShowingPlayerPanel = props.player === gameStore.player || 
                                  (props.player && props.player._isPlayer === true)
    
    if (isShowingPlayerPanel && props.player !== gameStore.player) {
      // 当前显示的是队长的详情面板，但 props.player 不是 gameStore.player
      // 需要从 gameStore.player 同步最新的 activeBuffs
      const latestBuffs = gameStore.player.activeBuffs || []
      props.player.activeBuffs = latestBuffs
    }
    
    applyStatsWithCurrentEquipment()
    
    // 强制刷新 playerStats computed 属性
    statsVersion.value++
  }
)

onBeforeUnmount(() => {
  endDrag()
  stopResize()
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

/**
 * 计算副手武器攻击力范围
 * 双刀流玩家专用：副手武器攻击力 = floor(武器攻击力 × 等级倍率 × 50% × (1 + R技能熟练度加成))
 * @param {Object} player - 玩家对象
 * @returns {{ offhandMinAttack: string, offhandMaxAttack: string }} 副手攻击力范围
 */
const computeOffhandAttack = (player) => {
  const offhandWeapon = getOffhandWeapon(player)
  if (!offhandWeapon) {
    return { offhandMinAttack: '0', offhandMaxAttack: '0' }
  }

  const enhancedAttrs = offhandWeapon.StrengthenedAttributes || {}
  const enhanceLevel = Number(
    enhancedAttrs.enhanceLevel ?? offhandWeapon.enhanceLevel ?? 0
  )
  const levelAttrs = enhancedAttrs[String(enhanceLevel)] || {}
  const enhancedMin = Number(enhancedAttrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
  const enhancedMax = Number(enhancedAttrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)

  const processedWeapon =
    Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
      ? applyWeaponDamageFormula({
        ...offhandWeapon,
        minAttack: enhancedMin,
        maxAttack: enhancedMax
      })
      : applyWeaponDamageFormula(offhandWeapon)

  // R技能熟练度：副手武器攻击力额外加成（1级+5%，10级+50%）
  const offhandAtkBonus = getOffhandAttackBonus(player)
  // 武器精通-副手武器被动技能：副手装备武器时，按熟练度百分比增加副手武器基础攻击力（I + I_EX1 + I_EX2）
  const offhandMasteryBonus = getOffhandWeaponMasteryBonus(player)
  const totalOffhandBonus = offhandAtkBonus + offhandMasteryBonus
  const minAtk = Math.floor((processedWeapon.minAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + totalOffhandBonus))
  const maxAtk = Math.floor((processedWeapon.maxAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + totalOffhandBonus))

  return {
    offhandMinAttack: String(minAtk),
    offhandMaxAttack: String(maxAtk)
  }
}

const playerStats = computed(() => {
  // 依赖 statsVersion 确保在版本变化时重新计算
  // eslint-disable-next-line no-unused-vars
  const _version = statsVersion.value
  
  if (currentPlayer.value) {
    const baseCriticalDamageMultiplier = 1.5
    const criticalDamageMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
      currentPlayer.value.criticalDamage,
      baseCriticalDamageMultiplier
    )
    const rawDecreasedCastingTime = Number(currentPlayer.value.decreasedCastingTime ?? 0)
    const normalizedDecreasedCastingTime = Number.isFinite(rawDecreasedCastingTime)
      ? rawDecreasedCastingTime > 1
        ? rawDecreasedCastingTime / 100
        : rawDecreasedCastingTime
      : 0
    return {
      level: currentPlayer.value.level || 1,
      maxHealth: (currentPlayer.value.maxHealth || 100).toFixed(1),
      maxMana: (currentPlayer.value.maxMana || 100).toFixed(1),
      attack: Math.floor((currentPlayer.value.minAttack + currentPlayer.value.maxAttack) / 2) || 0,
      defense: Math.floor((currentPlayer.value.minDefense + currentPlayer.value.maxDefense) / 2) || 0,
      minAttack: (currentPlayer.value.minAttack || 0).toFixed(1),
      maxAttack: (currentPlayer.value.maxAttack || 0).toFixed(1),
      // 副手武器攻击力（双刀流玩家专用）
      ...computeOffhandAttack(currentPlayer.value),
      minDefense: (currentPlayer.value.minDefense || 0).toFixed(1),
      maxDefense: (currentPlayer.value.maxDefense || 0).toFixed(1),
      magicDefense: (currentPlayer.value.magicDefense || 0).toFixed(1),
      hitRate: ((currentPlayer.value.hitRate || 0) * 100).toFixed(1),
      dodgeRate: ((currentPlayer.value.dodgeRate || 0) * 100).toFixed(1),
      blockRate: ((currentPlayer.value.blockRate || 0) * 100).toFixed(1),
      criticalRate: ((currentPlayer.value.criticalRate || 0) * 100).toFixed(1),
      criticalDamage: (
        Math.max(0, criticalDamageMultiplier - baseCriticalDamageMultiplier) *
        100
      ).toFixed(1),
      attackSpeed: ((currentPlayer.value.attackSpeed || 1.0) * 100).toFixed(1),
      castingTime: (Math.max(0, normalizedDecreasedCastingTime) * 100).toFixed(1),
      healPercent: ((currentPlayer.value.healPercent || 0) * 100).toFixed(1),
      hpRegeneration: ((currentPlayer.value.hpRegeneration || 0) * 100).toFixed(1),
      lifeStealing: (currentPlayer.value.lifeSteal || 0).toFixed(1),
      stun: (currentPlayer.value.stun || 0).toFixed(1),
      blockPenetration: (currentPlayer.value.blockPenetration || 0).toFixed(1),
      bowAttack: (currentPlayer.value.bowAttack || 0).toFixed(1),
      yoyoAttack: (currentPlayer.value.yoyoAttack || 0).toFixed(1),
      axeAttack: (currentPlayer.value.axeAttack || 0).toFixed(1),
      swordAttack: (currentPlayer.value.swordAttack || 0).toFixed(1),
      fireAttack: (currentPlayer.value.fireAttack || 0).toFixed(1),
      waterAttack: (currentPlayer.value.waterAttack || 0).toFixed(1),
      thunderAttack: (currentPlayer.value.thunderAttack || 0).toFixed(1),
      windAttack: (currentPlayer.value.windAttack || 0).toFixed(1),
      earthAttack: (currentPlayer.value.earthAttack || 0).toFixed(1),
      skillDamage: (currentPlayer.value.skillDamage || 0).toFixed(1),
      skillChance: ((currentPlayer.value.skillChance || 0) * 100).toFixed(1),
      mpReduction: ((currentPlayer.value.decreasedMpConsumption || 0) * 100).toFixed(1),
      fpReduction: ((currentPlayer.value.decreasedFpConsumption || 0) * 100).toFixed(1),
      mpRecoveryAfterKill: (currentPlayer.value.mpRecoveryAfterKill || 0).toFixed(0),
      pveDamage: (currentPlayer.value.pveDamage || 0).toFixed(1),
      pveDamageReduction: (currentPlayer.value.pveDamageReduction || 0).toFixed(1),
      criticalResistance: ((currentPlayer.value.criticalResistance || 0) * 100).toFixed(1),
      // 属性抗性
      fireDefense: (currentPlayer.value.fireDefense || 0).toFixed(1),
      waterDefense: (currentPlayer.value.waterDefense || 0).toFixed(1),
      windDefense: (currentPlayer.value.windDefense || 0).toFixed(1),
      thunderDefense: (currentPlayer.value.thunderDefense || 0).toFixed(1),
      earthDefense: (currentPlayer.value.earthDefense || 0).toFixed(1)
    }
  }

  return {
    attack: 0,
    defense: 0,
    minAttack: 0,
    maxAttack: 0,
    offhandMinAttack: 0,
    offhandMaxAttack: 0,
    minDefense: 0,
    maxDefense: 0,
    magicDefense: 0,
    hitRate: 0,
    dodgeRate: 0,
    blockRate: 0,
    criticalRate: 0,
    criticalDamage: 0,
    attackSpeed: 0,
    castingTime: 0,
    healPercent: 0,
    hpRegeneration: 0,
    lifeStealing: 0,
    stun: 0,
    blockPenetration: 0,
    bowAttack: 0,
    yoyoAttack: 0,
    axeAttack: 0,
    swordAttack: 0,
    fireAttack: 0,
    waterAttack: 0,
    windAttack: 0,
    thunderAttack: 0,
    earthAttack: 0,
    skillDamage: 0,
    skillChance: 0,
    mpReduction: 0,
    fpReduction: 0,
    mpRecoveryAfterKill: 0,
    pveDamage: 0,
    pveDamageReduction: 0,
    criticalResistance: 0,
    fireDefense: 0,
    waterDefense: 0,
    windDefense: 0,
    thunderDefense: 0,
    earthDefense: 0
  }
})

const elementAttackLabelMap = {
  fire: '火',
  water: '水',
  wind: '风',
  thunder: '雷',
  earth: '土'
}
const elementAttackInfo = computed(() => {
  const weapon = itemsStore.equipment?.weapon || currentPlayer.value?.equipment?.weapon
  
  // 元素键名映射（处理electricity和thunder同为雷属性的情况）
  const normalizeElementKey = (key) => {
    if (key === 'electricity') return 'thunder'
    return key
  }
  
  // 1. 优先检查元素强化数据（elementalEnhancement）
  const elemental = weapon?.elementalEnhancement || weapon?.StrengthenedAttributes?.elementalEnhancement
  if (elemental && typeof elemental === 'object') {
    const entries = Object.entries(elementAttackLabelMap)
      .map(([key, label]) => {
        const level = Number(elemental?.[key]?.enhancementLevel ?? 0)
        return Number.isFinite(level) && level > 0 ? { key, label, level } : null
      })
      .filter(Boolean)
    if (entries.length) {
      const resolved = entries.reduce((current, next) => (next.level > current.level ? next : current))
      const attackPercent = Number(playerStats.value?.[`${resolved.key}Attack`] ?? 0)
      return {
        label: resolved.label,
        attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0,
        key: resolved.key
      }
    }
  }
  
  // 2. 如果没有有效的elementalEnhancement数据，检查weapon.element属性
  const weaponElement = weapon?.element
  if (weaponElement && weaponElement !== 'none') {
    const normalizedKey = normalizeElementKey(weaponElement)
    const label = elementAttackLabelMap[normalizedKey] || weaponElement
    const attackPercent = Number(playerStats.value?.[`${normalizedKey}Attack`] ?? 0)
    return {
      label: label,
      attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0,
      key: normalizedKey
    }
  }
  
  // 3. 以上都没有，返回空对象（不显示元素攻击）
  return { label: '', attackPercent: 0, key: '' }
})

const increaseAttribute = attribute => {
  if ((currentPlayer.value.stats?.freePoints || 0) > 0) {
    if (typeof currentPlayer.value.allocateStat === 'function') {
      currentPlayer.value.allocateStat(attribute, 1)
      applyStatsWithCurrentEquipment()
      gameStore.updatePlayer(currentPlayer.value, activeEquipmentSets.value)
    } else {
      const newValue = (currentPlayer.value.stats?.[attribute] || 1) + 1
      const newFreePoints = (currentPlayer.value.stats?.freePoints || 0) - 1
      gameStore.updatePlayer({
        stats: { ...currentPlayer.value.stats, [attribute]: newValue, freePoints: newFreePoints }
      })
    }
  }
}

const canDecreaseAttribute = attribute => {
  const current = currentPlayer.value?.stats?.[attribute] || 1
  const baseline = baselineStats.value?.[attribute] || 1
  return current > Math.max(1, baseline)
}

const decreaseAttribute = attribute => {
  if (canDecreaseAttribute(attribute)) {
    if (typeof currentPlayer.value.decreaseStat === 'function') {
      currentPlayer.value.decreaseStat(attribute)
      applyStatsWithCurrentEquipment()
      gameStore.updatePlayer(currentPlayer.value, activeEquipmentSets.value)
    } else {
      const newValue = (currentPlayer.value.stats?.[attribute] || 1) - 1
      const newFreePoints = (currentPlayer.value.stats?.freePoints || 0) + 1
      gameStore.updatePlayer({
        stats: { ...currentPlayer.value.stats, [attribute]: newValue, freePoints: newFreePoints }
      })
    }
  }
}

/**
 * 长按连点处理器配置
 * 为每个属性的 +/- 按钮创建独立的连点事件处理器
 * shouldRepeat 函数在每次重复前检查条件，条件不满足时自动停止
 */
const { createPressHandlers } = usePressAndRepeat()

/**
 * 所有属性 +/- 按钮的连点事件处理器集合
 * 模板中通过 v-on="pressHandlers.increase.strength" 等方式绑定
 */
const pressHandlers = {
  increase: {
    strength: createPressHandlers(
      () => increaseAttribute('strength'),
      () => (currentPlayer.value?.stats?.freePoints || 0) > 0
    ),
    constitution: createPressHandlers(
      () => increaseAttribute('constitution'),
      () => (currentPlayer.value?.stats?.freePoints || 0) > 0
    ),
    intelligence: createPressHandlers(
      () => increaseAttribute('intelligence'),
      () => (currentPlayer.value?.stats?.freePoints || 0) > 0
    ),
    agility: createPressHandlers(
      () => increaseAttribute('agility'),
      () => (currentPlayer.value?.stats?.freePoints || 0) > 0
    )
  },
  decrease: {
    strength: createPressHandlers(
      () => decreaseAttribute('strength'),
      () => canDecreaseAttribute('strength')
    ),
    constitution: createPressHandlers(
      () => decreaseAttribute('constitution'),
      () => canDecreaseAttribute('constitution')
    ),
    intelligence: createPressHandlers(
      () => decreaseAttribute('intelligence'),
      () => canDecreaseAttribute('intelligence')
    ),
    agility: createPressHandlers(
      () => decreaseAttribute('agility'),
      () => canDecreaseAttribute('agility')
    )
  }
}

const confirmAttributes = () => {
  applyStatsWithCurrentEquipment()
  gameStore.updatePlayer(currentPlayer.value, activeEquipmentSets.value)

  baselineStats.value = {
    strength: currentPlayer.value?.stats?.strength || 1,
    constitution: currentPlayer.value?.stats?.constitution || 1,
    intelligence: currentPlayer.value?.stats?.intelligence || 1,
    agility: currentPlayer.value?.stats?.agility || 1
  }

  emit('confirm-attributes', currentPlayer.value.stats)
  emit('close')
}
</script>

<style scoped>
.player-detail-transition-enter-active,
.player-detail-transition-leave-active {
  transition:
    opacity 0.18s ease,
    filter 0.18s ease;
}

.player-detail-transition-enter-from,
.player-detail-transition-leave-to {
  opacity: 0;
  filter: blur(2px);
}

.player-detail-transition-enter-to,
.player-detail-transition-leave-from {
  opacity: 1;
  filter: blur(0);
}

.player-detail-modal {
  width: 300px;
  height: 500px;
  min-width: 200px;
  min-height: 500px;
  max-width: 98vw;
  max-height: 98vh;
  display: flex;
  flex-direction: column;
  background: var(--theme-player-detail-bg);
  border: 2px solid #8b7355;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  overflow: visible;
  --scale: 1;
  font-size: calc(12px * var(--scale, 1));
  color: var(--theme-text);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 2px solid #8b7355;
}

.modal-header h2 {
  color: var(--theme-accent);
  font-size: 1.25em;
  font-weight: 600;
  margin: 0;
}

.help-button {
  background: var(--theme-section-bg);
  border: 2px solid #8b7355;
  color: var(--theme-accent);
  font-size: 1em;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.help-button:hover {
  background: #000000;
  color: var(--theme-text);
}

.close-button {
  background: #d3d3d3;
  border: 2px solid #000000;
  color: var(--theme-text);
  font-size: 1.167em;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #000000;
  color: var(--theme-text);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: grid;
  gap: 0px;
  padding: 10px;
}

.help-panel {
  position: absolute;
  left: 100%;
  top: 0;
  height: 100%;
  width: min(320px, 45vw);
  background: var(--theme-section-bg);
  border: 2px solid #8b7355;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(139 115 85);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.help-panel-header {
  color: var(--theme-accent);
  font-weight: 600;
  font-size: 1em;
  padding: 8px 10px;
  border-bottom: 2px solid #8b7355;
}

.help-panel-content {
  padding: 8px 10px;
  overflow-y: auto;
}

.help-section-title {
  color: #ffd700;
  font-weight: 600;
  margin: 6px 0 4px;
  border-bottom: 1px dashed #8b7355;
}

.help-line {
  color: var(--theme-text);
  font-size: 0.9em;
  line-height: 1.6;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 4px;
}

.stats-section::-webkit-scrollbar-track {
  border: 1px solid #000000;
  border-radius: 2px;
}

.stats-section::-webkit-scrollbar-thumb {
  background: #000000;
  border-radius: 2px;
}

.stats-group {
  border-radius: 4px;
}

.stats-group h3 {
  color: #ffd700;
  font-size: 1.25em;
  margin: 0 0 6px 0;
  border-bottom: 2px solid #8b7355;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.stat-item--full {
  justify-content: flex-start;
}

.stat-item--full .stat-label {
  width: 100%;
}

.stat-item:hover {
  background: #828282;
}

.stat-item:hover .stat-label,
.stat-item:hover .stat-value {
  color: var(--theme-text);
}

/* 元素属性统计项样式 */
.element-stat {
  gap: 4px;
}

.element-stat .element-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  object-fit: contain;
}

/* 玩家名称和职业样式 */
.player-info-item .stat-value {
  font-weight: bold;
  color: var(--theme-accent);
}

.player-info-item .player-name {
  color: #ffd700;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

/* 称号前缀标签（显示在玩家名称左侧） */
.player-title-prefix {
  color: #66cc44;
  font-size: 0.833em;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}

/* 徽章图标（显示在玩家名称左侧） */
.player-badge-icon-detail {
  width: 22px;
  height: 22px;
  vertical-align: middle;
  object-fit: contain;
  flex-shrink: 0;
}

.stat-label {
  color: var(--theme-text);
  font-size: 0.833em;
  font-weight: 400;
}

.stat-value {
  /* color: #ffd700; */
  font-size: 1em;
}

.attribute-section {
  /* background: #2a2a2a; */
  border-radius: 4px;
  padding: 6px;
  /* border: 2px solid #4a4a4a; */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  width: 100%;
}

.attribute-section::-webkit-scrollbar {
  width: 4px;
}

.attribute-section::-webkit-scrollbar-track {
  background: #1a1a1a;
  border: 1px solid #4a4a4a;
  border-radius: 2px;
}

.attribute-section::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 2px;
}

.free-points {
  display: flex;
  text-align: center;
  padding: 5px;
  background: #d3d3d3;
  border-radius: 3px;
  border-bottom: 1px solid #4a4a4a;
  margin-bottom: 5px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.points-label {
  color: var(--theme-text);
  font-size: 1em;
  font-weight: 400;
}

.points-value {
  font-size: 1.5em;
  font-weight: 600;
  padding: 5px;
}

.attribute-group {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}

.attribute-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  padding: 5px;
  background: #d3d3d3;
  border-radius: 4px;
  /* border: 2px solid #4a4a4a; */
  transition: all 0.2s ease;
}

.attribute-item:hover {
  background: #939393;
}

.attribute-item:hover .attribute-name {
  color: #cccccc;
}

.attribute-item:hover .attribute-value {
  color: #ffed4e;
}

.attribute-name {
  color: #666666;
  font-size: 0.833em;
  font-weight: 400;
  margin-bottom: 3px;
}

.primary-stat-badge {
  color: #ffd700;
  font-size: 0.9em;
  font-weight: 600;
  margin-left: 2px;
}

.attribute-value {
  color: #2d89c6;
  font-size: 1.25em;
  font-weight: 600;
  min-width: 15px;
  text-align: center;
  margin-bottom: 4px;
}

.attribute-controls {
  display: flex;
  gap: 4px;
}

.attribute-controls button {
  width: 24px;
  height: 24px;
  padding: 0;
  background: #2a2a2a;
  border: 2px solid #4a4a4a;
  color: #ffd700;
  border-radius: 3px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 防止长按时选中按钮文字 */
  user-select: none;
  -webkit-user-select: none;
  /* 阻止触摸默认行为（滚动、缩放），替代原 touchstart preventDefault */
  touch-action: none;
}

.attribute-controls button:hover:not(:disabled) {
  background: #ffd700;
  color: #1a1a1a;
}

/* 长按按下状态视觉反馈 */
.attribute-controls button:active:not(:disabled) {
  background: #ffd700;
  color: #1a1a1a;
  transform: scale(0.92);
}

.attribute-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.confirm-btn {
  padding: 10px;
  background: #ffd700;
  border: 2px solid #8b7355;
  border-radius: 5px;
  color: #1a1a1a;
  font-size: 0.833em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.confirm-btn:hover:not(:disabled) {
  background: #ff4444;
  text-shadow: 0 0 2px rgba(255, 0, 43, 0.5);
  box-shadow: 0 0 10px rgb(255 101 101);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #4a4a4a;

  color: #666666;
  box-shadow: none;
}

@media (max-width: 1024px) {
  .modal-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .attribute-group {
    grid-template-columns: 1fr;
  }
}

.resize-handle {
  position: absolute;
  z-index: 1010;
  background: transparent;
}

.resize-handle-right {
  top: 8px;
  right: 0;
  width: 10px;
  height: calc(100% - 16px);
  cursor: ew-resize;
}

.resize-handle-left {
  top: 8px;
  left: 0;
  width: 10px;
  height: calc(100% - 16px);
  cursor: ew-resize;
}

.resize-handle-bottom {
  left: 8px;
  bottom: 0;
  height: 10px;
  width: calc(100% - 16px);
  cursor: ns-resize;
}

.resize-handle-top {
  left: 8px;
  top: 0;
  height: 10px;
  width: calc(100% - 16px);
  cursor: ns-resize;
}

.resize-handle-corner {
  width: 14px;
  height: 14px;
}

.resize-handle-top-left {
  left: 0;
  top: 0;
  cursor: nwse-resize;
}

.resize-handle-top-right {
  right: 0;
  top: 0;
  cursor: nesw-resize;
}

.resize-handle-bottom-left {
  left: 0;
  bottom: 0;
  cursor: nesw-resize;
}

.resize-handle-bottom-right {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}
</style>
