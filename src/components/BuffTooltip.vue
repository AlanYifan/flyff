<template>
  <transition name="buff-tooltip-fade" appear>
    <div
      v-if="visible && buff"
      ref="tooltipRef"
      class="buff-tooltip"
      :style="tooltipStyle"
    >
      <div class="buff-tooltip-header">
        <img
          class="buff-tooltip-icon"
          :src="buff.icon"
          :alt="buff.name"
          @error="e => (e.target.src = '/pt/buff_icon/default_buff.png')"
        />
        <div class="buff-tooltip-title">{{ buff.name || '未知BUFF' }}</div>
      </div>

      <div v-if="typeof buff.description === 'string' && buff.description" class="buff-tooltip-description">
        {{ buff.description }}
      </div>

      <div v-if="effectHtml.length" class="buff-tooltip-effects">
        <div class="buff-tooltip-effects-title">效果:</div>
        <div
          v-for="(html, index) in effectHtml"
          :key="`buff-effect-${String(buff.id || buff.name || 'buff')}-${index}`"
          class="buff-tooltip-effect-line"
          v-html="html"
        ></div>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * BUFF 提示面板（用于增益效果区域悬停详情）
 *
 * @file BuffTooltip.vue
 * @generated 2026-01-31
 */

import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { SkillBuffCalculator } from '@/utils/skillBuffCalculator'
import { getSkill } from '@/data/skills'
import { ATTRIBUTE_NAMES, getParameterName } from '@/store/descriptions'
import { formatEffectValue, isMultiplierParameter } from '@/utils/effectFormatter'

const props = defineProps({
  buff: {
    type: Object,
    default: null
  },
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const tooltipRef = ref(null)
const resolvedPosition = ref({ x: 0, y: 0 })

const tooltipStyle = computed(() => ({
  left: `${resolvedPosition.value.x}px`,
  top: `${resolvedPosition.value.y}px`
}))

const effectHtml = computed(() => {
  const resolvedBuff = props.buff
  if (!resolvedBuff || typeof resolvedBuff !== 'object') {
    return []
  }

  // 1. 如果是全能祝福等复杂技能，优先使用 SkillBuffCalculator
  // 通过检查是否存在 subSkills 或者特定的技能ID/Name来判断
  if (resolvedBuff.subSkills || resolvedBuff.name === '全能祝福' || resolvedBuff.id === 'priest_e') {
    // 获取静态配置以补充 description 等元数据
    const staticSkill = getSkill('priest', 'E')
    const staticSubSkills = staticSkill?.proficiency?.effect?.subSkills

    // 合并静态配置和实例数据，确保既有描述又有准确数值
    let mergedSubSkills = null
    if (staticSubSkills) {
      mergedSubSkills = {}
      const buffEffects = resolvedBuff.effects || resolvedBuff.subSkills || {}
      Object.entries(staticSubSkills).forEach(([key, config]) => {
        const effectVal = buffEffects[key]
        // 如果 effectVal 是对象（新格式），直接合并
        // 如果是数值（旧格式），则不合并数值，依赖公式计算
        mergedSubSkills[key] = {
          ...config,
          ...(typeof effectVal === 'object' ? effectVal : {})
        }
      })
    }

    // 构造一个兼容 SkillBuffCalculator 的对象
    const skillLike = {
      ...resolvedBuff,
      level: resolvedBuff.level || 1,
      subSkills: mergedSubSkills || resolvedBuff.subSkills || resolvedBuff.effects
    }
    const html = SkillBuffCalculator.getAllBlessingEffect(skillLike)
    if (html) {
      // 移除外层的 div，保留内容
      // SkillBuffCalculator 返回的是拼接的 HTML 字符串，我们需要分割成数组
      // 简单的分割方式是按 </div> 分割
      return html
        .split('</div>')
        .map(part => {
          const content = part.replace(/<div[^>]*>/, '').trim()
          return content
        })
        .filter(Boolean)
    }
  }

  // 2. 处理守护使者的守护术技能
  if (resolvedBuff.id === 'guardian_w' || resolvedBuff.name === '守护术') {
    const staticSkill = getSkill('guardian', 'W')
    if (staticSkill) {
      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level: resolvedBuff.level || 1,
        intelligence: resolvedBuff.intelligence || 0 // 使用BUFF中保存的智力值
      }
      const html = SkillBuffCalculator.getGuardianBuffEffect('W', skillLike)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 3. 处理守护使者的攻击强化技能
  if (resolvedBuff.id === 'guardian_e' || resolvedBuff.name === '攻击强化') {
    const staticSkill = getSkill('guardian', 'E')
    if (staticSkill) {
      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level: resolvedBuff.level || 1,
        intelligence: resolvedBuff.intelligence || 0 // 使用BUFF中保存的智力值
      }
      const html = SkillBuffCalculator.getGuardianBuffEffect('E', skillLike)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 4. 处理守护使者的战斗之歌技能
  if (resolvedBuff.id === 'guardian_t' || resolvedBuff.name === '战斗之歌') {
    const staticSkill = getSkill('guardian', 'T')
    if (staticSkill) {
      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level: resolvedBuff.level || 1,
        intelligence: resolvedBuff.intelligence || 0 // 使用BUFF中保存的智力值
      }
      const html = SkillBuffCalculator.getGuardianBuffEffect('T', skillLike)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 5. 处理骑士的牺牲技能
  if (resolvedBuff.id === 'knight_t' || resolvedBuff.name === '牺牲') {
    const staticSkill = getSkill('knight', 'T')
    if (staticSkill) {
      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level: resolvedBuff.level || 1,
        strength: resolvedBuff.strength || 0
      }
      const html = SkillBuffCalculator.getKnightBuffEffect('T', skillLike)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 6. 处理精神使者的能量反弹技能
  const isSpiritMageEnergyReflect =
    resolvedBuff.skillId === 'spirit_mage_energy_reflect' ||
    resolvedBuff.skillKey === '能量反弹' ||
    resolvedBuff.name === '能量反弹'
  if (isSpiritMageEnergyReflect) {
    const staticSkill = getSkill('spirit_mage', '能量反弹')
    if (staticSkill) {
      // 从 BUFF 中获取保存的体质值和技能等级
      const level = resolvedBuff.level || resolvedBuff.proficiencyLevel || 1
      const constitution = resolvedBuff.constitution || resolvedBuff.sta || resolvedBuff.stats?.constitution || 0

      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level,
        stats: {
          constitution,
          sta: constitution
        }
      }
      const playerForCalc = {
        stats: {
          constitution,
          sta: constitution
        }
      }
      const html = SkillBuffCalculator.getSpiritMageBuffEffect('能量反弹', skillLike, playerForCalc)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 6.5 处理精神使者的念力护盾技能
  const isSpiritMagePsychicShield =
    resolvedBuff.skillId === 'spirit_mage_psychic_shield' ||
    resolvedBuff.skillKey === '念力护盾' ||
    resolvedBuff.name === '念力护盾'
  if (isSpiritMagePsychicShield) {
    const staticSkill = getSkill('spirit_mage', '念力护盾')
    if (staticSkill) {
      // 从 BUFF 中获取保存的体质值、技能等级、最大生命值和当前吸收值
      const level = resolvedBuff.level || resolvedBuff.proficiencyLevel || 1
      const constitution = resolvedBuff.constitution || resolvedBuff.sta || resolvedBuff.stats?.constitution || 0
      const maxHealth = resolvedBuff.maxHealth || 1000
      const currentAbsorbDamage = resolvedBuff.currentAbsorbDamage || resolvedBuff.maxAbsorbDamage || 0

      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level,
        maxHealth,
        stats: {
          constitution,
          sta: constitution
        }
      }
      const playerForCalc = {
        stats: {
          constitution,
          sta: constitution
        },
        maxHealth
      }

      // 获取基础效果描述
      let html = SkillBuffCalculator.getSpiritMageBuffEffect('念力护盾', skillLike, playerForCalc)

      // 如果有当前吸收值，添加当前状态显示
      if (currentAbsorbDamage !== undefined && currentAbsorbDamage !== null) {
        const maxAbsorbDamage = resolvedBuff.maxAbsorbDamage || currentAbsorbDamage
        const formatNumber = (num) => {
          return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
        }
        // 在开头添加当前吸收状态
        const currentStatusHtml = `<div class="skill-tooltip-buff-effect-item" style="color: #2ecc71;">当前护盾: ${formatNumber(currentAbsorbDamage)} / ${formatNumber(maxAbsorbDamage)}</div>`
        html = currentStatusHtml + html
      }

      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 6.75 处理精神使者的赛乐的祝福技能
  const isSpiritMageSyleBlessing =
    resolvedBuff.skillId === 'spirit_mage_syle_blessing' ||
    resolvedBuff.skillKey === '赛乐的祝福' ||
    resolvedBuff.name === '赛乐的祝福'
  if (isSpiritMageSyleBlessing) {
    const staticSkill = getSkill('spirit_mage', '赛乐的祝福')
    if (staticSkill) {
      // 从 BUFF 中获取保存的体质值、智力值和技能等级
      const level = resolvedBuff.level || resolvedBuff.proficiencyLevel || 1
      const constitution = resolvedBuff.constitution || resolvedBuff.sta || resolvedBuff.stats?.constitution || 0
      const intelligence = resolvedBuff.intelligence || resolvedBuff.stats?.intelligence || 0

      const skillLike = {
        ...staticSkill,
        ...resolvedBuff,
        level,
        stats: {
          constitution,
          sta: constitution,
          intelligence,
          int: intelligence
        }
      }
      const playerForCalc = {
        stats: {
          constitution,
          sta: constitution,
          intelligence,
          int: intelligence
        }
      }
      const html = SkillBuffCalculator.getSpiritMageBuffEffect('赛乐的祝福', skillLike, playerForCalc)
      if (html) {
        return html
          .split('</div>')
          .map(part => {
            const content = part.replace(/<div[^>]*>/, '').trim()
            return content
          })
          .filter(Boolean)
      }
    }
  }

  // 7. 原有的普通BUFF渲染逻辑
  const lines = []

  // 7.1 检查是否有护盾吸收效果（天使之翼EX3生命护盾等非纯护盾BUFF）
  // 纯护盾BUFF（念力护盾）已在上方 6.5 节单独处理，此处处理附带护盾的多效果BUFF
  const shieldMax = Number(resolvedBuff.maxAbsorbDamage) || 0
  const shieldCurrent = Number(resolvedBuff.currentAbsorbDamage) || 0
  if (shieldMax > 0) {
    const formatShieldNumber = (num) => num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
    const shieldColor = shieldCurrent > 0 ? '#2ecc71' : '#95a5a6'
    const shieldStatus = shieldCurrent > 0 ? '当前护盾' : '护盾已耗尽'
    lines.push(`<div class="skill-tooltip-buff-effect-item" style="color: ${shieldColor};">${shieldStatus}: ${formatShieldNumber(shieldCurrent)} / ${formatShieldNumber(shieldMax)}</div>`)
  }

  const effects = resolvedBuff.effects
  if (effects && typeof effects === 'object' && !Array.isArray(effects)) {
    Object.entries(effects).forEach(([key, value]) => {
      // 如果值是对象（如全能祝福的子技能结构），跳过，交由上面的逻辑处理
      if (typeof value === 'object' && value !== null && value.subSkills) {
        return
      }
      const line = formatEffectLine(key, value)
      if (line) {
        lines.push(line)
      }
    })
  }

  // 4. 如果没有特殊处理，且有 parameter 和 value
  if (
    !lines.length &&
    resolvedBuff.parameter !== null &&
    resolvedBuff.parameter !== undefined &&
    resolvedBuff.value !== null &&
    resolvedBuff.value !== undefined
  ) {
    const line = formatParameterEffectLine(resolvedBuff.parameter, resolvedBuff.value, resolvedBuff)
    if (line) {
      lines.push(line)
    }
  }

  return lines
})

/**
 * BUFF 效果名称映射表（使用统一描述管理）
 * 对于通用属性使用 ATTRIBUTE_NAMES，特定 BUFF 效果保留在此
 */
const effectNameMap = {
  // 通用属性使用 ATTRIBUTE_NAMES（在 formatEffectLine 中动态合并）
  ...ATTRIBUTE_NAMES,
  // BUFF 特定效果名称（不在通用属性中的）
  defense: '防御力',
  defenseRate: '防御力',
  attackMin: '最小攻击力',
  attackMax: '最大攻击力',
  attackRate: '攻击力',
  axeAttack: '斧攻击力',
  swordAttack: '剑攻击力',
  bowAttack: '弓攻击力',
  yoyoAttack: '悠悠攻击力',
  castingTime: '施法时间',
  healPercent: '治疗加成',
  // 暴击相关
  critRate: '暴击率',
  criticalRate: '暴击率',
  // 命中相关
  hitRate: '命中率',
  // 攻击速度
  attackSpeed: '攻击速度',
  // 格挡穿透
  blockPenetration: '格挡穿透',
  // 自身承伤
  damageTakenIncrease: '自身承伤',
  // 特殊消耗
  mpCostPerAttack: '每次攻击MP消耗',
  // 全能祝福相关
  lifeSpring: '生命之泉',
  skyHorse: '天马行空',
  intellectSpell: '智力术',
  efficiencySpell: '高效术',
  constitutionSpell: '强身术',
  stunSpell: '昏厥术',
  blockSpell: '躲避术',
  strengthSpell: '力量术',
  agilitySpell: '敏捷术',
  hitRateSpell: '命中术'
}

const percentEffectKeys = new Set([
  'defense',
  'defenseRate',
  'blockRate',
  'hitRate',
  'dodgeRate',
  'criticalRate',
  'critRate',
  'criticalDamage',
  'skillDamage',
  'attackRate',
  'castingTime',
  'attackSpeed',
  'healPercent',
  'fireAttack',
  'waterAttack',
  'windAttack',
  'earthAttack',
  'thunderAttack',
  // 全能祝福相关百分比
  'lifeSpring',
  'skyHorse',
  'efficiencySpell',
  'stunSpell',
  'blockSpell',
  'hitRateSpell'
])

const formatEffectLine = (rawKey, rawValue) => {
  const key = String(rawKey || '').trim()
  if (!key) {
    return ''
  }

  // 使用统一的格式化工具
  const result = formatEffectValue(key, rawValue)
  return result
}

const formatParameterEffectLine = (parameter, value, buff) => {
  const resolvedParameter = String(parameter || '').trim().toLowerCase()
  const numeric = Number(value)
  if (!resolvedParameter || !Number.isFinite(numeric) || numeric === 0) {
    return ''
  }

  // 使用统一的格式化工具
  // 对于 def 参数，从 buff 中获取 rate 信息
  if (resolvedParameter === 'def') {
    const isRate = buff?.rate || buff?.effectsRate
    return formatEffectValue('defense', { add: numeric, rate: isRate })
  }

  return formatEffectValue(resolvedParameter, { add: numeric, rate: buff?.rate })
}

const computePosition = (cursorX, cursorY) => {
  const padding = 10
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const tooltipWidth = Number(tooltipRef.value?.offsetWidth ?? 0) || 0
  const tooltipHeight = Number(tooltipRef.value?.offsetHeight ?? 0) || 0

  let x = cursorX
  let y = cursorY

  if (tooltipWidth) {
    const maxX = Math.max(padding, viewportWidth - tooltipWidth - padding)
    if (x > maxX) {
      x = maxX
    }
    if (x < padding) {
      x = padding
    }
  }

  if (tooltipHeight) {
    const maxY = Math.max(padding, viewportHeight - tooltipHeight - padding)
    if (y > maxY) {
      y = maxY
    }
    if (y < padding) {
      y = padding
    }
  }

  return { x, y }
}

const syncPosition = async () => {
  if (!props.visible || !props.buff) {
    return
  }

  const rawX = Number(props.position?.x ?? 0)
  const rawY = Number(props.position?.y ?? 0)
  const cursorX = Number.isFinite(rawX) ? rawX : 0
  const cursorY = Number.isFinite(rawY) ? rawY : 0

  resolvedPosition.value = { x: cursorX, y: cursorY }
  await nextTick()
  resolvedPosition.value = computePosition(cursorX, cursorY)
}

watch(
  () => [props.visible, props.buff, props.position?.x, props.position?.y],
  () => {
    syncPosition()
  }
)

onBeforeUnmount(() => {
  resolvedPosition.value = { x: 0, y: 0 }
})
</script>

<style scoped>
.buff-tooltip {
  position: fixed;
  z-index: 999999;
  pointer-events: none;
  min-width: 220px;
  max-width: 360px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--theme-modal-bg);
  color: var(--theme-text);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--theme-border-strong);
}

.buff-tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.buff-tooltip-icon {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}

.buff-tooltip-title {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.1;
}

.buff-tooltip-description {
  color: var(--theme-muted);
  font-size: 13px;
  line-height: 1.25;
  margin-bottom: 6px;
  white-space: pre-wrap;
}

.buff-tooltip-effects {
  border-top: 1px solid var(--theme-border-strong);
  padding-top: 6px;
  margin-top: 6px;
}

.buff-tooltip-effects-title {
  font-weight: 700;
  font-size: 12px;
  line-height: 1.2;
  color: var(--theme-text);
  margin-bottom: 4px;
}

.buff-tooltip-effect-line {
    margin-bottom: 3px;
    font-size: 13px;
    color: var(--theme-muted);
  }

.buff-tooltip-effect-line :deep(.skill-tooltip-buff-effect-item) {
  color: var(--theme-muted);
}

.buff-tooltip-fade-enter-active,
.buff-tooltip-fade-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
}

.buff-tooltip-fade-enter-from,
.buff-tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.buff-tooltip-fade-enter-to,
.buff-tooltip-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
