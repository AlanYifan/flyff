<template>
  <Teleport to="body">
    <transition name="skill-tooltip-fade" appear>
      <div
        v-if="visible && skill"
        ref="skillTooltipEl"
        class="skill-tooltip"
        :class="{ 'skill-tooltip-non-interactive': nonInteractive }"
        :style="tooltipStyle"
      >
        <div class="skill-tooltip-header">
          <img
            :src="skill.icon"
            :alt="skill.name"
            class="skill-tooltip-icon"
            @error="e => (e.target.src = '/pt/skill_icon/default_skill.png')"
          />
          <div class="skill-tooltip-name">{{ skill.name }}</div>
        </div>

        <div class="skill-tooltip-content">
        <!-- 技能描述 -->
        <div v-if="skill.description" class="skill-tooltip-description">
          {{ skill.description }}
        </div>

        <!-- 技能类型 -->
        <div
          v-if="skill.type"
          class="skill-tooltip-type"
          :class="getSkillTypeClass(skill.type)"
        >
          类型: {{ getSkillTypeText(skill.type) }}
        </div>

        <!-- 技能元素类型 -->
        <div v-if="skill.element && skill.element !== 'none'" class="skill-tooltip-element">
          元素: {{ getElementText(skill.element) }}
        </div>

        <!-- 冷却时间 -->
        <div v-if="skill.baseCooldown !== undefined || skill.cd !== undefined" class="skill-tooltip-cooldown">
          冷却时间: {{ effectiveCooldown }}秒<span v-if="stormArrowCdReduction > 0" style="color: #f39c12;">（EX1: -{{ stormArrowCdReduction }}%）</span><span v-if="galeRapidFireCdReduction > 0" style="color: #f39c12;">（EX1: -{{ galeRapidFireCdReduction }}%）</span><span v-if="nensphereCdReduction > 0" style="color: #f39c12;">（EX1: -{{ nensphereCdReduction }}%）</span><span v-if="auraBombCdReduction > 0" style="color: #f39c12;">（EX1: -{{ auraBombCdReduction }}%）</span><span v-if="deadlyPoisonCdReduction > 0" style="color: #f39c12;">（EX1: -{{ deadlyPoisonCdReduction }}%）</span><span v-if="shadowRazeCdReduction > 0" style="color: #f39c12;">（EX1: -{{ shadowRazeCdReduction }}%）</span><span v-if="shadowBladeCdReduction > 0" style="color: #f39c12;">（EX1: -{{ shadowBladeCdReduction }}%）</span><span v-if="shadowCloakCdReduction > 0" style="color: #f39c12;">（EX1: -{{ shadowCloakCdReduction }}%）</span><span v-if="thunderHammerCdReduction > 0" style="color: #f39c12;">（EX1: -{{ thunderHammerCdReduction }}%）</span><span v-if="piercingWindCdReduction > 0" style="color: #f39c12;">（EX1: -{{ piercingWindCdReduction }}%）</span><span v-if="frostMarkCdReduction > 0" style="color: #f39c12;">（EX1: -{{ frostMarkCdReduction }}%）</span><span v-if="stormRainCdReduction > 0" style="color: #f39c12;">（EX1: -{{ stormRainCdReduction }}%）</span><span v-if="skill.id === 'holy_knight_w' && isHolyKnightExUnlocked('W_EX')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'holy_knight_e' && isHolyKnightExUnlocked('E_EX1')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'holy_knight_u' && isHolyKnightExUnlocked('U_EX1')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'arcane_master_w' && isArcaneMasterExUnlocked('W_EX')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'arcane_master_e' && isArcaneMasterExUnlocked('E_EX1')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'arcane_master_u' && isArcaneMasterExUnlocked('U_EX1')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'mind_master_w' && isMindMasterExUnlocked('W_EX')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'mind_master_e' && isMindMasterExUnlocked('E_EX1')" style="color: #f39c12;">（EX1: -50%）</span><span v-if="skill.id === 'mind_master_u' && isMindMasterExUnlocked('U_EX1')" style="color: #f39c12;">（EX1: -50%）</span>
        </div>

        <!-- BUFF持续时间 -->
        <div v-if="skill.buffDuration && !skill.calculateBuffDuration && !skill.calculateDuration" class="skill-tooltip-buff-duration">
          基础持续时间: {{ formatBuffDuration(skill.buffDuration) }}
        </div>

        <!-- 计算后的BUFF持续时间（有calculateBuffDuration或calculateDuration方法的技能） -->
        <div v-if="skill.buffDuration && (skill.calculateBuffDuration || skill.calculateDuration) && calculatedBuffDuration" class="skill-tooltip-buff-duration">
          持续时间: {{ calculatedBuffDuration }}<span v-if="shadowCloakCdReduction > 0" style="color: #f39c12;">（EX1: -{{ shadowCloakCdReduction }}%）</span>
        </div>

        <!-- 效果详情（BUFF/被动/utility/单体伤害/AOE/DEBUFF技能，如狂风连射有多段连射详情，暴风箭矢有EX加成） -->
        <div
          v-if="(skill.type === 'buff' || skill.type === 'utility' || skill.type === 'single' || skill.type === 'aoe' || skill.type === 'debuff') && effectiveClass && skill.key && buffEffectLines.length"
          class="skill-tooltip-buff-effects"
        >
          <div class="skill-tooltip-section-title">效果详情:</div>
          <div
            v-for="(line, index) in buffEffectLines"
            :key="`${skill.key || 'buff'}-${index}`"
            class="skill-tooltip-buff-effect-item"
            :style="line.style"
          >
            {{ line.text }}
          </div>
        </div>

        <!-- EX加成信息（龟派气功/念气能量弹：始终展示，未解锁灰色预告并标注解锁等级，已解锁橙色高亮生效中） -->
        <div
          v-if="exBonusLines.length"
          class="skill-tooltip-ex-bonus"
        >
          <div class="skill-tooltip-section-title">EX加成:</div>
          <div
            v-for="(line, index) in exBonusLines"
            :key="`ex-bonus-${skill.key || 'skill'}-${index}`"
            class="skill-tooltip-ex-bonus-item"
            :style="line.style"
          >
            {{ line.text }}
          </div>
        </div>

        <!-- BUFF类型技能的减益效果（如双倍惩戒） -->
        <div v-if="skill.type === 'buff' && skill.debuff && skill.debuff.type !== 'doubleJudgment'" class="skill-tooltip-debuff-section">
          <div class="skill-tooltip-section-title">减益效果:</div>
          <!-- 其他DEBUFF -->
          <div class="skill-tooltip-debuff-item">
            {{ skill.debuff.type || '未知效果' }}
          </div>
        </div>

        <!-- 双倍惩戒技能效果 -->
        <div v-if="skill.debuff?.type === 'doubleJudgment'" class="skill-tooltip-effect-section">
          <div class="skill-tooltip-section-title">效果:</div>
          <div class="skill-tooltip-effect-item double-judgment-item">
            <span class="effect-icon">⚔️</span>
            双倍惩戒
            <br />
            <span class="effect-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            <br />
            <span class="effect-detail">攻击触发后伤害: ×2 (两倍)</span>
            <br />
            <span class="effect-detail">持续时间: {{ skill.debuff.effect?.duration || 5 }}秒（或被击中后消失）</span>
            <br />
            <span class="effect-detail">魔法消耗: {{ skill.manaCost || 10 }} MP/次</span>
          </div>
        </div>

        <!-- 魔法消耗 -->
        <div v-if="skill.manaCost" class="skill-tooltip-mana">魔法消耗: {{ skill.manaCost }}</div>

        <!-- 熟练度 -->
        <div v-if="skill.level" class="skill-tooltip-proficiency">
          熟练度等级: {{ skill.level }}/{{ skill.proficiencyMaxLevel || 10 }}
          <span v-if="!isProficiencyMax" class="proficiency-progress-text">
            ({{ skill.proficiency || 0 }}/{{ skill.proficiencyExp || 10 }})
          </span>
        </div>

        <!-- 熟练度加成效果 -->
        <div
          v-if="proficiencyEffectText && skill.level > 1"
          class="skill-tooltip-proficiency-effect"
        >
          熟练度加成: {{ proficiencyEffectText }}
        </div>

        <!-- 技能效果 -->
        <div v-if="skillEffectText" class="skill-tooltip-effect">效果: {{ skillEffectText }}</div>

        <!-- 伤害信息 -->
        <div v-if="skill.type === 'single' || skill.type === 'aoe' || skill.type === 'debuff'" class="skill-tooltip-section">
          <div class="skill-tooltip-section-title">伤害信息:</div>
          <div v-if="skill.damage" class="skill-tooltip-damage">基础伤害: {{ skill.damage }}</div>
          <!-- 熟练度伤害加成 -->
          <div
            v-if="skill.proficiencyEffect && skill.proficiencyEffect.base !== undefined"
            class="skill-tooltip-proficiency-bonus"
          >
            熟练度加成: +{{ calculateProficiencyBonus(skill) }}
          </div>
          <!-- 实际伤害 -->
          <div v-if="skill.damage" class="skill-tooltip-calculated-damage">
            实际伤害: {{ actualDamage }} <span v-if="skillDamageBonusText" class="skill-damage-bonus-text">{{ skillDamageBonusText }}</span>
          </div>
          <!-- 伤害倍率（仅对拥有 getDamageMultiplier 方法的技能显示） -->
          <div v-if="skillDamageMultiplierText" class="skill-tooltip-multiplier">
            {{ skillDamageMultiplierText }}
          </div>
          <!-- 伤害计算公式 -->
          <div v-if="skill.damageCalculation || skill.calculateDamage" class="skill-tooltip-formula">
            计算公式: {{ damageFormula }}
          </div>

          <!-- 特殊效果 -->
          <div v-if="skill.specialEffect" class="skill-tooltip-special-effect-section">
            <div class="skill-tooltip-section-title">特殊效果:</div>
            <div v-if="skill.specialEffect.description" class="skill-tooltip-special-effect-desc">
              {{ skill.specialEffect.description }}
            </div>
            <div
              v-if="skill.specialEffect.details && skill.specialEffect.details.length"
              class="skill-tooltip-special-effect-details"
            >
              <div
                v-for="(detail, idx) in skill.specialEffect.details"
                :key="`special-effect-${idx}`"
                class="skill-tooltip-special-effect-detail"
              >
                {{ detail }}
              </div>
            </div>
          </div>

          <!-- 减益效果 -->
          <div v-if="skill.debuff" class="skill-tooltip-debuff-section">
            <div class="skill-tooltip-section-title">减益效果:</div>
            <!-- 击晕效果 -->
            <div v-if="skill.debuff.type === 'stun'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">💫</span>
              击晕: {{ getDebuffChanceText(skill) }} 概率击晕 {{ skill.debuff.effect?.duration || 2 }}秒
            </div>
            <!-- 碎甲效果 -->
            <div v-else-if="skill.debuff.type === 'armorBreak'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">🛡️</span>
              碎甲: 防御力-{{ getArmorBreakDefenseReduction(skill) }}%, 承受伤害+{{ getArmorBreakDamageIncrease(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ getArmorBreakDuration(skill) }}秒</span>
            </div>
            <!-- 命中率降低效果（夜幕降临） -->
            <div v-else-if="skill.debuff.type === 'hitRateReduction'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">🌑</span>
              命中率降低: -{{ getHitRateReductionValue(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ skill.debuff.effect?.duration || skill.duration || 10 }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            </div>
            <!-- 攻击速度降低效果（狂风怒吼） -->
            <div v-else-if="skill.debuff.type === 'attackSpeedReduction'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">🌪️</span>
              攻击速度降低: -{{ getAttackSpeedReductionValue(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ getAttackSpeedReductionDuration(skill) }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            </div>
            <!-- 暴击伤害降低效果（风雷聚集） -->
            <div v-else-if="skill.debuff.type === 'critDamageReduction'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">⚡</span>
              暴击伤害降低: -{{ getCritDamageReductionValue(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ skill.debuff.effect?.duration || 14 }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            </div>
            <!-- 攻击力降低效果（毒箭） -->
            <div v-else-if="skill.debuff.type === 'attackReduction'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">☠️</span>
              中毒: 攻击力-{{ getAttackReductionValue(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ skill.debuff.effect?.baseDuration || skill.duration || 10 }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            </div>
            <!-- 双倍惩戒效果 -->
            <div v-else-if="skill.debuff.type === 'doubleJudgment'" class="skill-tooltip-debuff-item double-judgment-item">
              <span class="debuff-icon">⚔️</span>
              双倍惩戒
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
              <br />
              <span class="debuff-detail">攻击触发后伤害: ×2 (两倍)</span>
              <br />
              <span class="debuff-detail">持续时间: {{ skill.debuff.effect?.duration || 5 }}秒（或被击中后消失）</span>
              <br />
              <span class="debuff-detail">魔法消耗: {{ skill.manaCost || 10 }} MP/次</span>
            </div>
            <!-- 印记DEBUFF效果（破劲印记/虚弱印记/毒蚀印记/脆弱烙印） -->
            <div v-else-if="skill.debuff.type === 'damageVulnerability'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">🎯</span>
              印记: 所有属性抗性-{{ getDamageVulnerabilityValue(skill) }}% (火/风/土/雷/水)
              <br />
              <span class="debuff-detail">持续时间: {{ getDamageVulnerabilityDuration(skill) }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
              <br />
              <span v-if="getDamageVulnerabilityCritBonus(skill) > 0" class="debuff-detail">{{ getDebuffClassName(skill) }}攻击印记目标时，额外提升暴击伤害+{{ getDamageVulnerabilityCritBonus(skill) }}%</span>
              <template v-if="getDamageVulnerabilityCritBonus(skill) > 0"><br /></template>
              <span v-if="getDamageVulnerabilityHealingBonus(skill) > 0" class="debuff-detail">{{ getDebuffClassName(skill) }}攻击印记目标时，额外提升治疗效果+{{ getDamageVulnerabilityHealingBonus(skill) }}%</span>
              <template v-if="getDamageVulnerabilityHealingBonus(skill) > 0"><br /></template>
              <span v-if="getDamageVulnerabilityHitRateBonus(skill) > 0" class="debuff-detail">{{ getDebuffClassName(skill) }}攻击印记目标时，额外提升命中率+{{ getDamageVulnerabilityHitRateBonus(skill) }}%</span>
              <template v-if="getDamageVulnerabilityHitRateBonus(skill) > 0"><br /></template>
              <span class="debuff-detail">可同时标记多名敌人，重复命中仅刷新持续时间</span>
            </div>
            <!-- 意识混乱效果（意识崩塌） -->
            <div v-else-if="skill.debuff.type === 'mindConfusion'" class="skill-tooltip-debuff-item">
              <span class="debuff-icon">🌀</span>
              意识混乱: 攻击力-{{ getMindConfusionAttackReduction(skill) }}%, 受到伤害+{{ getMindConfusionDamageIncrease(skill) }}%
              <br />
              <span class="debuff-detail">持续时间: {{ getMindConfusionDuration(skill) }}秒</span>
              <br />
              <span class="debuff-detail">触发概率: {{ getDebuffChanceText(skill) }}</span>
            </div>
            <!-- 其他DEBUFF -->
            <div v-else class="skill-tooltip-debuff-item">
              {{ skill.debuff.type || '未知效果' }}
            </div>
          </div>
        </div>

        <!-- 治疗信息 -->
        <div v-else-if="skill.type === 'heal'" class="skill-tooltip-section">
          <div class="skill-tooltip-section-title">治疗信息:</div>
          <!-- 基础治疗量 -->
          <div v-if="skill.heal || skill.damage" class="skill-tooltip-healing">基础治疗: {{ skill.heal || skill.damage }}</div>
          <!-- 熟练度治疗加成 -->
          <div
            v-if="skill.proficiencyEffect && skill.proficiencyEffect.increment !== undefined"
            class="skill-tooltip-proficiency-bonus"
          >
            熟练度加成: +{{ calculateHealProficiencyBonus(skill) }}
          </div>
          <!-- 实际治疗量 -->
          <div v-if="skill.healingCalculation || skill.calculateHealing" class="skill-tooltip-calculated-heal">
            实际治疗: {{ actualHeal }}
          </div>
          <!-- 详细计算公式 -->
          <div v-if="healFormulaLines.length" class="skill-tooltip-formula-detail">
            <div class="skill-tooltip-section-title">计算公式:</div>
            <div
              v-for="(line, index) in healFormulaLines"
              :key="`heal-formula-${index}`"
              class="skill-tooltip-formula-line"
            >
              {{ line }}
            </div>
          </div>
          <!-- 简略计算公式（备用） -->
          <div v-else-if="skill.healingCalculation || skill.calculateHealing" class="skill-tooltip-formula">
            计算公式: {{ healFormula }}
          </div>
        </div>

        <!-- DOT持续伤害信息 -->
        <div v-else-if="skill.type === 'dot'" class="skill-tooltip-section">
          <div class="skill-tooltip-section-title">持续伤害信息:</div>
          <!-- DOT持续时间 -->
          <div v-if="skill.duration !== undefined" class="skill-tooltip-dot-duration">
            持续时间: {{ skill.duration }}秒
          </div>
          <!-- 伤害频率 -->
          <div v-if="skill.tickInterval !== undefined" class="skill-tooltip-dot-frequency">
            伤害频率: 每{{ skill.tickInterval }}秒
          </div>
          <!-- 基础DOT伤害 -->
          <div v-if="skill.dotDamage !== undefined || skill.damage" class="skill-tooltip-base-dot-damage">
            基础伤害: {{ skill.dotDamage || skill.damage }}
          </div>
          <!-- 熟练度DOT伤害加成 -->
          <div
            v-if="(skill.proficiencyEffect && skill.proficiencyEffect.dotBase !== undefined) || (skill.proficiency?.effect && skill.proficiency.effect.dotBase !== undefined)"
            class="skill-tooltip-proficiency-bonus"
          >
            熟练度加成: +{{ calculateDotProficiencyBonus(skill) }}
          </div>
          <!-- 实际DOT伤害 -->
          <div
            v-if="skill.dotDamage || skill.dotDamageCalculation || skill.damageCalculation || skill.calculateDotDamage || skill.calculateDamage"
            class="skill-tooltip-calculated-dot-damage"
          >
            实际持续伤害: {{ actualDotDamage }} <span v-if="skillDamageBonusText" class="skill-damage-bonus-text">{{ skillDamageBonusText }}</span>
          </div>
          <!-- DOT伤害计算公式 -->
          <div
            v-if="skill.dotDamageCalculation || skill.damageCalculation || skill.calculateDotDamage || skill.calculateDamage"
            class="skill-tooltip-formula"
          >
            计算公式: {{ dotDamageFormula }}
          </div>
        </div>

        <!-- 附加持续伤害 -->
        <div v-if="skill.dotEffect" class="skill-tooltip-section">
          <div class="skill-tooltip-section-title">附加状态:</div>
          <div class="skill-tooltip-dot-duration">持续时间: {{ skill.dotEffect.duration }}秒</div>
          <div class="skill-tooltip-dot-frequency">
            伤害频率: 每{{ skill.dotEffect.tickInterval }}秒
          </div>
          <div class="skill-tooltip-base-dot-damage">
            每次伤害比例: {{ Math.round((skill.dotEffect.damageRate || 0) * 100) }}%
          </div>
        </div>

        <!-- 子技能信息 -->
        <div
          v-if="skill.subSkills && Object.keys(skill.subSkills).length > 0 && (!buffEffectLines || buffEffectLines.length === 0)"
          class="skill-tooltip-subskills"
        >
          <div class="skill-tooltip-section-title">子技能效果:</div>
          <div
            v-for="(subSkill, subKey) in skill.subSkills"
            :key="subKey"
            class="skill-tooltip-subskill"
          >
            {{ getSubSkillText(subKey, subSkill, skill.level) }}
          </div>
        </div>

        <!-- 技能解锁条件 -->
        <div class="skill-tooltip-section-title">解锁条件:</div>
        <div v-if="unlockRequirementStates.length" class="skill-tooltip-prerequisite">
          <div
            v-for="(item, index) in unlockRequirementStates"
            :key="`${skill.key || 'unlock'}-${index}`"
            class="skill-tooltip-unlock-line"
            :class="item.isMet ? 'skill-tooltip-unlock-met' : 'skill-tooltip-unlock-unmet'"
          >
            {{ item.text }}
          </div>
        </div>
        <div v-else class="skill-tooltip-prerequisite">无</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  formatBuffDuration,
  getSkillTypeText,
  getElementText,
  calculateProficiencyBonus,
  calculateDotProficiencyBonus,
  calculateHealProficiencyBonus,
  getSubSkillText
} from '@/utils/skillUtils'
import { SkillBuffCalculator } from '@/utils/skillBuffCalculator'
import { SkillUnlockChecker } from '@/utils/skillUnlockChecker'
import { useGameStore } from '@/store'
import { useItemsStore } from '@/store/items'
import PlayerStatsService from '@/services/PlayerStatsService'
import { SKILL_INFO } from '@/data/SKILL_INFO.js'
import { getSkill as getOriginalSkill, isSkillUnlocked as checkSkillUnlocked } from '@/data/skills.js'
import {
  getStormArrowCdReduction,
  getStormArrowDamageBonus
} from '@/composables/useStormArrowEx'
import {
  getGaleRapidFireCdReduction,
  getGaleRapidFireDamageBonus
} from '@/composables/useGaleRapidFireEx'
import {
  getNensphereCdReduction,
  getNensphereDamageBonus,
  getNensphereMultiHitInfo,
  NENSPHERE_EX1_CD_REDUCTION,
  NENSPHERE_EX2_DAMAGE_BONUS,
  NENSPHERE_EX3_MULTI_HIT
} from '@/composables/useNensphereEx'
import {
  getAuraBombCdReduction,
  getAuraBombDamageBonus,
  AURA_BOMB_EX1_CD_REDUCTION,
  AURA_BOMB_EX2_DAMAGE_BONUS
} from '@/composables/useAuraBombEx'
import {
  getShadowRazeCdReduction,
  getShadowRazeDamageBonus,
  getShadowRazeCriticalMultiplierInfo,
  SHADOW_RAZE_EX1_CD_REDUCTION,
  SHADOW_RAZE_EX2_DAMAGE_BONUS,
  SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER
} from '@/composables/useShadowRazeEx'
import {
  getShadowBladeCdReduction,
  getShadowBladeDamageBonus,
  SHADOW_BLADE_EX1_CD_REDUCTION,
  SHADOW_BLADE_EX2_DAMAGE_BONUS
} from '@/composables/useShadowBladeEx'
import {
  getDeadlyPoisonCdReduction,
  getDeadlyPoisonDamageBonus,
  DEADLY_POISON_EX1_CD_REDUCTION,
  DEADLY_POISON_EX2_DAMAGE_BONUS
} from '@/composables/useDeadlyPoisonEx'
import {
  getWeaponMasteryEx1AttackBonus,
  getWeaponMasteryEx2AttackBonus,
  WEAPON_MASTERY_EX1_ATTACK_BONUS,
  WEAPON_MASTERY_EX2_ATTACK_BONUS
} from '@/composables/useWeaponMasteryEx'
import {
  getShadowCloakCdReduction,
  SHADOW_CLOAK_EX1_CD_REDUCTION
} from '@/composables/useShadowCloakEx'
import {
  getThunderHammerCdReduction,
  getThunderHammerDamageBonus,
  getThunderHammerCriticalMultiplierInfo,
  THUNDER_HAMMER_EX1_CD_REDUCTION,
  THUNDER_HAMMER_EX2_DAMAGE_BONUS,
  THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER
} from '@/composables/useThunderHammerEx'
import {
  getPiercingWindCdReduction,
  getPiercingWindDamageBonus,
  getPiercingWindCriticalMultiplierInfo,
  PIERCING_WIND_EX1_CD_REDUCTION,
  PIERCING_WIND_EX2_DAMAGE_BONUS,
  PIERCING_WIND_EX3_CRITICAL_MULTIPLIER
} from '@/composables/usePiercingWindEx'
import {
  getFrostMarkCdReduction,
  getFrostMarkDamageBonus,
  FROST_MARK_EX1_CD_REDUCTION,
  FROST_MARK_EX2_DAMAGE_BONUS
} from '@/composables/useFrostMarkEx'
import {
  getStormRainCdReduction,
  getStormRainDamageBonus,
  STORM_RAIN_EX1_CD_REDUCTION,
  STORM_RAIN_EX2_DAMAGE_BONUS
} from '@/composables/useStormRainEx'

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  skill: {
    type: Object,
    default: null
  },
  player: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  },
  playerClass: {
    type: String,
    default: ''
  },
  /**
   * 当前激活的BUFF列表（包含宠物BUFF、技能BUFF等）
   * 用于计算技能伤害时考虑BUFF的属性加成
   */
  activeBuffs: {
    type: Array,
    default: () => []
  },
  /**
   * 是否禁用鼠标交互（pointer-events: none）
   * 在技能面板等场景下避免遮挡鼠标导致 mouseleave 闪烁
   */
  nonInteractive: {
    type: Boolean,
    default: false
  }
})

// 技能详情面板的引用
const skillTooltipEl = ref(null)
const resolvedPosition = ref({ x: 0, y: 0 })

const tooltipStyle = computed(() => ({
  left: `${resolvedPosition.value.x}px`,
  top: `${resolvedPosition.value.y}px`
}))

const computeTooltipPosition = (rawX, rawY) => {
  const padding = 10
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  const tooltipWidth = Number(skillTooltipEl.value?.offsetWidth ?? 0) || 0
  const tooltipHeight = Number(skillTooltipEl.value?.offsetHeight ?? 0) || 0

  let x = rawX
  let y = rawY

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

/**
 * 非交互模式下的侧边定位策略
 * 优先显示在鼠标右侧，空间不足时显示在左侧，确保不遮挡鼠标
 * @param {number} cursorX - 鼠标X坐标
 * @param {number} cursorY - 鼠标Y坐标
 * @param {number} tooltipWidth - 提示框宽度
 * @param {number} tooltipHeight - 提示框高度
 * @param {number} padding - 边距
 * @param {number} viewportWidth - 视口宽度
 * @param {number} viewportHeight - 视口高度
 * @returns {{x: number, y: number}} 计算后的坐标
 */
const computeSidePosition = (cursorX, cursorY, tooltipWidth, tooltipHeight, padding, viewportWidth, viewportHeight) => {
  const gap = 20 // 鼠标与提示框之间的间距

  // 优先右侧
  const rightSpace = viewportWidth - cursorX - gap
  if (rightSpace >= tooltipWidth) {
    return {
      x: cursorX + gap,
      y: Math.min(cursorY, viewportHeight - tooltipHeight - padding)
    }
  }

  // 右侧空间不足，尝试左侧
  const leftSpace = cursorX - gap
  if (leftSpace >= tooltipWidth) {
    return {
      x: cursorX - gap - tooltipWidth,
      y: Math.min(cursorY, viewportHeight - tooltipHeight - padding)
    }
  }

  // 两侧都不够，回退到上方居中（与默认逻辑一致）
  let x = cursorX - tooltipWidth / 2
  let y = cursorY - tooltipHeight - gap
  if (x < padding) x = padding
  if (x + tooltipWidth > viewportWidth - padding) x = viewportWidth - tooltipWidth - padding
  if (y < padding) y = cursorY + gap
  if (y + tooltipHeight > viewportHeight - padding) y = viewportHeight - tooltipHeight - padding
  return { x, y }
}

const syncTooltipPosition = async () => {
  if (!props.visible || !props.skill) {
    return
  }

  const rawX = Number(props.position?.x ?? 0)
  const rawY = Number(props.position?.y ?? 0)
  const cursorX = Number.isFinite(rawX) ? rawX : 0
  const cursorY = Number.isFinite(rawY) ? rawY : 0

  // 先设置初始位置，让tooltip渲染出来以获取尺寸
  resolvedPosition.value = { x: cursorX, y: cursorY }
  await nextTick()

  const tooltipHeight = Number(skillTooltipEl.value?.offsetHeight ?? 0) || 0
  const tooltipWidth = Number(skillTooltipEl.value?.offsetWidth ?? 0) || 0

  const padding = 10
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0

  if (props.nonInteractive) {
    // 非交互模式：提示框显示在鼠标侧边，不遮挡鼠标
    resolvedPosition.value = computeSidePosition(cursorX, cursorY, tooltipWidth, tooltipHeight, padding, viewportWidth, viewportHeight)
    return
  }

  // 默认模式：面板底部在鼠标上方
  const offsetY = -300  // 面板底部距离鼠标的间距（避免遮挡鼠标）
  
  // X轴居中对齐鼠标
  let x = cursorX - tooltipWidth / 2
  // Y轴：面板底部在鼠标上方
  let y = cursorY - tooltipHeight - offsetY

  // X轴边界
  if (x < padding) {
    x = padding
  }
  if (x + tooltipWidth > viewportWidth - padding) {
    x = viewportWidth - tooltipWidth - padding
  }

  // Y轴边界：如果上方空间不足，则显示在鼠标下方
  if (y < padding) {
    y = cursorY + offsetY + 10 // 显示在鼠标下方
  }

  resolvedPosition.value = { x, y }
}

watch(
  () => [props.visible, props.skill, props.position?.x, props.position?.y],
  () => {
    syncTooltipPosition()
  }
)

/**
 * 有效的职业 key，用于技能数据查找
 * 优先使用技能自身的 class（支持底部技能栏跨职业技能），
 * 回退到 props.playerClass（当前玩家职业）
 * @returns {string} 职业小写 key
 */
const effectiveClass = computed(() => {
  const skillClass = props.skill?.class
  if (skillClass) {
    return typeof skillClass === 'string' ? skillClass.toLowerCase() : ''
  }
  return props.playerClass || ''
})

// 判断熟练度是否满级
const isProficiencyMax = computed(() => {
  const level = Number(props.skill?.level ?? props.skill?.proficiencyLevel ?? 1)
  const maxLevel = Number(props.skill?.proficiencyMaxLevel ?? 10)
  return level >= maxLevel
})

// 使用 computed 缓存计算结果
const proficiencyEffectText = computed(() => {
  if (!props.skill) {
    return ''
  }

  const bonus = calculateProficiencyBonus(props.skill)
  const dotBonus = calculateDotProficiencyBonus(props.skill)
  const healBonus = calculateHealProficiencyBonus(props.skill)

  if (props.skill.type === 'single' || props.skill.type === 'aoe') {
    if (Number.isFinite(bonus) && bonus !== 0) {
      return `伤害 + ${Math.floor(bonus)}`
    }
    return ''
  }

  if (props.skill.type === 'dot') {
    if (Number.isFinite(dotBonus) && dotBonus !== 0) {
      return `持续伤害 + ${Math.floor(dotBonus)}`
    }
    return ''
  }

  if (props.skill.type === 'heal') {
    if (Number.isFinite(healBonus) && healBonus !== 0) {
      return `治疗 + ${Math.floor(healBonus)}`
    }
    return ''
  }

  return ''
})

/**
 * 计算BUFF持续时间（用于有calculateBuffDuration方法的技能）
 */
const calculatedBuffDuration = computed(() => {
  if (!props.skill || (typeof props.skill.calculateBuffDuration !== 'function' && typeof props.skill.calculateDuration !== 'function')) {
    return ''
  }

  try {
    const playerForCalc = skillCalcPlayer.value || props.player
    const skillLevel = props.skill.level || props.skill.proficiencyLevel || 1
    const calcFn = props.skill.calculateBuffDuration || props.skill.calculateDuration
    const durationSeconds = calcFn(playerForCalc, skillLevel)

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return ''
    }

    const minutes = Math.floor(durationSeconds / 60)
    const seconds = durationSeconds % 60

    if (minutes > 0 && seconds > 0) {
      return `${minutes}分${seconds}秒`
    } else if (minutes > 0) {
      return `${minutes}分钟`
    } else {
      return `${seconds}秒`
    }
  } catch (error) {
    console.error('计算BUFF持续时间出错:', error)
    return ''
  }
})

const skillEffectText = computed(() => {
  const effect = props.skill?.effect
  if (!effect) {
    return ''
  }

  if (typeof effect === 'string') {
    return effect.trim()
  }

  if (Array.isArray(effect)) {
    return effect
      .map(value => (typeof value === 'string' ? value.trim() : String(value)))
      .filter(Boolean)
      .join('，')
  }

  if (typeof effect === 'object') {
    const entries = Object.entries(effect).filter(([, value]) => value !== undefined && value !== null && value !== '')
    if (!entries.length) {
      return ''
    }

    return entries
      .map(([key, value]) => {
        if (typeof value === 'object') {
          try {
            return `${key}: ${JSON.stringify(value)}`
          } catch {
            return `${key}: ${String(value)}`
          }
        }
        return `${key}: ${String(value)}`
      })
      .join('，')
  }

  return String(effect).trim()
})

/**
 * 从BUFF列表中计算指定属性的加成值
 * @param {Array} buffs - BUFF列表
 * @param {string} paramName - 属性名称（如 'intelligence', 'strength' 等）
 * @returns {number} 属性加成值
 */
const calculateBuffStatBonus = (buffs, paramName) => {
  if (!Array.isArray(buffs) || buffs.length === 0) {
    return 0
  }

  const paramLower = String(paramName).toLowerCase()
  // 属性名别名映射
  const paramAliases = {
    intelligence: ['intelligence', 'int'],
    strength: ['strength', 'str'],
    agility: ['agility', 'agi', 'dexterity', 'dex'],
    dexterity: ['dexterity', 'dex', 'agility', 'agi'],
    constitution: ['constitution', 'con', 'sta', 'stamina', 'vit']
  }
  const aliases = paramAliases[paramLower] || [paramLower]
  let totalBonus = 0

  buffs.forEach(buff => {
    if (!buff || typeof buff !== 'object') {
      return
    }

    // 处理 parameter/value 格式的buff（如宠物加成、驯养宠物）
    const param = String(buff.parameter || '').toLowerCase()
    if (aliases.includes(param)) {
      totalBonus += Number(buff.value || buff.add || buff.amount || 0)
    }

    // 处理 effects 对象格式
    const effects = buff.effects
    if (effects && typeof effects === 'object') {
      Object.entries(effects).forEach(([key, rawValue]) => {
        const keyLower = String(key).toLowerCase()
        if (aliases.includes(keyLower)) {
          const numeric = rawValue && typeof rawValue === 'object'
            ? Number(rawValue.add || 0)
            : Number(rawValue || 0)
          if (Number.isFinite(numeric)) {
            totalBonus += numeric
          }
        }
      })
    }
  })

  return totalBonus
}

/**
 * 计算BUFF带来的攻击力加成（固定值和百分比）
 * @param {Array} buffs - BUFF列表
 * @param {number} baseAttack - 基础攻击力（用于计算百分比加成）
 * @returns {Object} { fixedBonus: 固定值加成, percentBonus: 百分比加成 }
 */
const calculateBuffAttackBonus = (buffs, baseAttack) => {
  if (!Array.isArray(buffs) || buffs.length === 0) {
    return { fixedBonus: 0, percentBonus: 0 }
  }

  let fixedBonus = 0
  let percentBonus = 0

  buffs.forEach(buff => {
    if (!buff || typeof buff !== 'object') {
      return
    }

    const effects = buff.effects
    if (effects && typeof effects === 'object') {
      // 处理 attackMin 和 attackMax
      if (effects.attackMin && typeof effects.attackMin === 'object') {
        const add = Number(effects.attackMin.add || 0)
        const isRate = effects.attackMin.rate === true
        if (isRate) {
          percentBonus += add / 100 // 转换为小数
        } else {
          fixedBonus += add
        }
      }
      if (effects.attackMax && typeof effects.attackMax === 'object') {
        const add = Number(effects.attackMax.add || 0)
        const isRate = effects.attackMax.rate === true
        // 注意：attackMin 和 attackMax 的加成通常是相同的，避免重复计算百分比
        // 但固定值需要都加（因为分别加到最小和最大攻击力）
        if (!isRate) {
          fixedBonus += add
        }
      }
      // 处理 attack 整体加成
      if (effects.attack && typeof effects.attack === 'object') {
        const add = Number(effects.attack.add || 0)
        const isRate = effects.attack.rate === true
        if (isRate) {
          percentBonus += add / 100
        } else {
          fixedBonus += add
        }
      }
    }
  })

  return { fixedBonus, percentBonus }
}

const skillCalcPlayer = computed(() => {
  const rawPlayer = props.player
  if (!rawPlayer || typeof rawPlayer !== 'object') {
    return null
  }

  const buffs = props.activeBuffs || rawPlayer.activeBuffs || []

  // 计算BUFF带来的属性加成
  const buffStatBonus = {
    strength: calculateBuffStatBonus(buffs, 'strength'),
    dexterity: calculateBuffStatBonus(buffs, 'dexterity'),
    agility: calculateBuffStatBonus(buffs, 'agility'),
    intelligence: calculateBuffStatBonus(buffs, 'intelligence'),
    constitution: calculateBuffStatBonus(buffs, 'constitution')
  }

  // 计算装备属性加成（与玩家详情面板保持一致）
  let equipmentStatBonus = {
    strength: 0,
    dexterity: 0,
    agility: 0,
    intelligence: 0,
    constitution: 0
  }
  try {
    const gameStore = useGameStore()
    const itemsStore = useItemsStore()
    // 获取套装数据
    const equipmentSets = gameStore.equipmentSets || itemsStore.equipmentSets || []
    // 构造包含装备信息的玩家快照
    const playerSnapshot = {
      ...rawPlayer,
      equipment: itemsStore.equipment || rawPlayer.equipment || {}
    }
    const bonuses = PlayerStatsService.calculateEquipmentBonuses(playerSnapshot, equipmentSets)
    equipmentStatBonus = {
      strength: bonuses.strength || 0,
      dexterity: bonuses.agility || 0,
      agility: bonuses.agility || 0,
      intelligence: bonuses.intelligence || 0,
      constitution: bonuses.constitution || bonuses.stamina || 0
    }
  } catch (e) {
    // 忽略计算错误，使用默认值
  }

  // 基础攻击力计算
  const resolvedAttack = Number(rawPlayer.attack)
  const minAttack = Number(rawPlayer.minAttack)
  const maxAttack = Number(rawPlayer.maxAttack)
  const baseAttack =
    Number.isFinite(resolvedAttack) && resolvedAttack > 0
      ? resolvedAttack
      : Number.isFinite(minAttack) && Number.isFinite(maxAttack)
        ? Math.floor((minAttack + maxAttack) / 2)
        : 0

  // 计算BUFF攻击力加成
  const attackBonus = calculateBuffAttackBonus(buffs, baseAttack)
  // 最终攻击力 = (基础攻击力 + 固定值加成) * (1 + 百分比加成)
  // 注意：固定值加成是分别加到 minAttack 和 maxAttack 的，所以这里取一半
  const finalAttack = Math.floor((baseAttack + attackBonus.fixedBonus / 2) * (1 + attackBonus.percentBonus))

  const resolvedDefense = Number(rawPlayer.defense)
  const minDefense = Number(rawPlayer.minDefense)
  const maxDefense = Number(rawPlayer.maxDefense)
  const defense =
    Number.isFinite(resolvedDefense) && resolvedDefense > 0
      ? resolvedDefense
      : Number.isFinite(minDefense) && Number.isFinite(maxDefense)
        ? Math.floor((minDefense + maxDefense) / 2)
        : 0

  const rawStats = rawPlayer.stats && typeof rawPlayer.stats === 'object' ? rawPlayer.stats : {}
  const stats = { ...rawStats }
  if (stats.dexterity === undefined && stats.agility !== undefined) {
    stats.dexterity = stats.agility
  }
  if (stats.dex === undefined && stats.agility !== undefined) {
    stats.dex = stats.agility
  }

  // 应用装备属性加成和BUFF属性加成到stats（与玩家详情面板一致）
  const enhancedStats = {
    ...stats,
    strength: (stats.strength || 0) + equipmentStatBonus.strength + buffStatBonus.strength,
    dexterity: (stats.dexterity || 0) + equipmentStatBonus.dexterity + buffStatBonus.dexterity,
    agility: (stats.agility || 0) + equipmentStatBonus.agility + buffStatBonus.agility,
    intelligence: (stats.intelligence || 0) + equipmentStatBonus.intelligence + buffStatBonus.intelligence,
    constitution: (stats.constitution || 0) + equipmentStatBonus.constitution + buffStatBonus.constitution,
    // 别名兼容
    str: (stats.str || stats.strength || 0) + equipmentStatBonus.strength + buffStatBonus.strength,
    dex: (stats.dex || stats.dexterity || stats.agility || 0) + equipmentStatBonus.dexterity + buffStatBonus.dexterity,
    int: (stats.int || stats.intelligence || 0) + equipmentStatBonus.intelligence + buffStatBonus.intelligence,
    sta: (stats.sta || stats.constitution || 0) + equipmentStatBonus.constitution + buffStatBonus.constitution,
    // 确保有stamina属性（用于神念攻击等技能）
    stamina: (stats.stamina || stats.constitution || stats.sta || 0) + equipmentStatBonus.constitution + buffStatBonus.constitution
  }

  return {
    ...rawPlayer,
    attack: finalAttack,
    minAttack: minAttack + attackBonus.fixedBonus,
    maxAttack: maxAttack + attackBonus.fixedBonus,
    defense,
    stats: enhancedStats
  }
})

/**
 * 暴风箭矢EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为暴风箭矢(fierce_shooter_u)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const stormArrowCdReduction = computed(() => {
  if (props.skill?.id !== 'fierce_shooter_u') return 0
  return getStormArrowCdReduction(props.player)
})

/**
 * 暴风箭矢EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为暴风箭矢(fierce_shooter_u)且EX2已解锁（190级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const stormArrowEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'fierce_shooter_u') return 0
  return getStormArrowDamageBonus(props.player)
})

/**
 * 狂风连射EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为狂风连射(fierce_shooter_i)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const galeRapidFireCdReduction = computed(() => {
  if (props.skill?.id !== 'fierce_shooter_i') return 0
  return getGaleRapidFireCdReduction(props.player)
})

/**
 * 狂风连射EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为狂风连射(fierce_shooter_i)且EX2已解锁（190级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const galeRapidFireEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'fierce_shooter_i') return 0
  return getGaleRapidFireDamageBonus(props.player)
})

/**
 * 龟派气功EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为龟派气功(combat_master_w)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const nensphereCdReduction = computed(() => {
  if (props.skill?.id !== 'combat_master_w') return 0
  return getNensphereCdReduction(props.player)
})

/**
 * 龟派气功EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为龟派气功(combat_master_w)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const nensphereEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'combat_master_w') return 0
  return getNensphereDamageBonus(props.player)
})

/**
 * 龟派气功EX3-多段伤害被动技能的解锁状态与触发信息
 * 仅当当前技能为龟派气功(combat_master_w)且EX3已解锁（190级）时返回非空信息
 * @returns {Object} 多段伤害信息 { unlocked, chance1, chance2, chance3 }
 */
const nensphereEx3MultiHit = computed(() => {
  if (props.skill?.id !== 'combat_master_w') {
    return { unlocked: false, chance1: 0, chance2: 0, chance3: 0 }
  }
  const info = getNensphereMultiHitInfo(props.player)
  return {
    unlocked: info.unlocked,
    chance1: info.chance1,
    chance2: info.chance2,
    chance3: info.chance3
  }
})

/**
 * 念气能量弹EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为念气能量弹(combat_master_u)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const auraBombCdReduction = computed(() => {
  if (props.skill?.id !== 'combat_master_u') return 0
  return getAuraBombCdReduction(props.player)
})

/**
 * 念气能量弹EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为念气能量弹(combat_master_u)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const auraBombEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'combat_master_u') return 0
  return getAuraBombDamageBonus(props.player)
})

/**
 * 格斗宗师EX被动展示配置
 * key: 主动技能ID，value: 对应EX1/EX2被动技能key与固定加成值
 */
const COMBAT_MASTER_EX_CONFIG = Object.freeze({
  combat_master_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: NENSPHERE_EX1_CD_REDUCTION,
    ex2Fixed: NENSPHERE_EX2_DAMAGE_BONUS,
    ex3Fixed: NENSPHERE_EX3_MULTI_HIT
  },
  combat_master_u: {
    ex1Key: 'U_EX',
    ex2Key: 'U_EX2',
    ex1Fixed: AURA_BOMB_EX1_CD_REDUCTION,
    ex2Fixed: AURA_BOMB_EX2_DAMAGE_BONUS
  }
})

/**
 * 暗夜主宰EX被动展示配置
 * key: 主动技能ID，value: 对应EX被动技能key与固定加成值
 */
const JOKER_EMPEROR_EX_CONFIG = Object.freeze({
  joker_emperor_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: SHADOW_RAZE_EX1_CD_REDUCTION,
    ex2Fixed: SHADOW_RAZE_EX2_DAMAGE_BONUS,
    ex3Fixed: SHADOW_RAZE_EX3_CRITICAL_MULTIPLIER
  },
  joker_emperor_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex1Fixed: SHADOW_BLADE_EX1_CD_REDUCTION,
    ex2Fixed: SHADOW_BLADE_EX2_DAMAGE_BONUS
  },
  joker_emperor_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex1Fixed: DEADLY_POISON_EX1_CD_REDUCTION,
    ex2Fixed: DEADLY_POISON_EX2_DAMAGE_BONUS
  },
  joker_emperor_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex1Fixed: WEAPON_MASTERY_EX1_ATTACK_BONUS,
    ex2Fixed: WEAPON_MASTERY_EX2_ATTACK_BONUS,
    exType: 'weaponAttack'
  },
  joker_emperor_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex1Fixed: 10,
    ex2Fixed: 10,
    exType: 'shadowEscape'
  }
})

/**
 * 炽天使EX被动展示配置
 * key: 主动技能ID，value: 对应EX1/EX2/EX3被动技能key与固定加成值
 * exType: EX效果类型，用于决定展示文本格式
 *   - 'cdDamage': EX1=CD减少, EX2=伤害增加, EX3=倍攻/多段
 *   - 'defense': EX1=物理防御, EX2=魔法防御
 *   - 'weaponAttack': EX1=武器攻击力, EX2=武器攻击力
 *   - 'angelWings': EX1=魔法防御, EX2=最大生命值, EX3=生命护盾
 *   - 'holyAccumulation': EX1=触发次数减少, EX2=倍攻治疗
 */
const NATURE_MESSENGER_EX_CONFIG = Object.freeze({
  // 圣光庇护 - EX1=恢复魔法值, EX2=受伤恢复
  nature_messenger_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex1Fixed: 10,
    ex2Fixed: 2,
    exType: 'holySanctuary'
  },
  // 圣光审判 - EX1=CD减少50%, EX2=伤害增加50%
  nature_messenger_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex1Fixed: 50,
    ex2Fixed: 50,
    exType: 'cdDamage'
  },
  // 天使之翼 - EX1=魔法防御+1000, EX2=最大生命值+1000, EX3=生命护盾(最大生命值50%)
  nature_messenger_r: {
    ex1Key: 'R_EX1',
    ex2Key: 'R_EX2',
    ex3Key: 'R_EX3',
    ex1Fixed: 1000,
    ex2Fixed: 1000,
    ex3Fixed: 50,
    exType: 'angelWings'
  },
  // 雷神之锤 - EX1=CD减少50%, EX2=伤害增加50%, EX3=倍攻
  nature_messenger_t: {
    ex1Key: 'T_EX1',
    ex2Key: 'T_EX2',
    ex3Key: 'T_EX3',
    ex1Fixed: THUNDER_HAMMER_EX1_CD_REDUCTION,
    ex2Fixed: THUNDER_HAMMER_EX2_DAMAGE_BONUS,
    ex3Fixed: THUNDER_HAMMER_EX3_CRITICAL_MULTIPLIER,
    exType: 'cdDamage'
  },
  // 天使之怒 - EX1=CD减少50%, EX2=伤害增加50%, EX3=多段攻击
  nature_messenger_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex3Key: 'U_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance1: 50, chance2: 25, chance3: 10 }),
    exType: 'cdDamage'
  },
  // 武器精通-魔棒 - EX1=武器攻击力+50%, EX2=武器攻击力+100%
  nature_messenger_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex1Fixed: 50,
    ex2Fixed: 100,
    exType: 'weaponAttack'
  },
  // 圣光积累 - EX1=触发次数减少50%, EX2=倍攻治疗
  nature_messenger_j: {
    ex1Key: 'J_EX1',
    ex2Key: 'J_EX2',
    ex1Fixed: 50,
    ex2Fixed: Object.freeze({ chance1: 50, bonus1: 10, chance2: 25, bonus2: 20, chance3: 10, bonus3: 30 }),
    exType: 'holyAccumulation'
  }
})

/**
 * 检查炽天使EX被动技能是否已解锁（通用辅助函数）
 * 使用 isSkillUnlocked 检查玩家等级是否达到技能解锁等级
 * @param {string} skillKey - EX技能key（如 'T_EX1', 'U_EX2'）
 * @returns {boolean} 是否已解锁（玩家等级>=解锁等级）
 */
const isNatureMessengerExUnlocked = (skillKey) => {
  if (!props.player) return false
  return checkSkillUnlocked(props.player, 'nature_messenger', skillKey)
}

/**
 * 检查风暴行者EX被动技能是否已解锁（通用辅助函数）
 * 使用 isSkillUnlocked 检查玩家等级是否达到技能解锁等级
 * @param {string} skillKey - EX技能key（如 'W_EX', 'E_EX1', 'U_EX1'）
 * @returns {boolean} 是否已解锁（玩家等级>=解锁等级）
 */
const isStormWalkerExUnlocked = (skillKey) => {
  if (!props.player) return false
  return checkSkillUnlocked(props.player, 'storm_walker', skillKey)
}

/**
 * 风暴行者EX被动展示配置
 * key: 主动技能ID，value: 对应EX1/EX2/EX3被动技能key与固定加成值
 * exType: EX效果类型，用于决定展示文本格式
 *   - 'cdDamage': EX1=CD减少, EX2=伤害增加, EX3=倍攻
 *   - 'stormDomain': EX1=暴击率, EX2=攻击速度
 *   - 'stormWings': EX1=暴击率, EX2=暴击伤害, EX3=生命偷取
 *   - 'weaponAttack': EX1=武器攻击力, EX2=武器攻击力, EX3=副手武器倍攻
 *   - 'windAccumulation': EX1=触发次数减少, EX2=倍攻
 */
const STORM_WALKER_EX_CONFIG = Object.freeze({
  // 风暴领域 - EX1=暴击率+10%, EX2=攻击速度+10%
  storm_walker_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex1Fixed: 10,
    ex2Fixed: 10,
    exType: 'stormDomain'
  },
  // 狂风绝刃 - EX1=CD减少50%, EX2=伤害增加50%, EX3=倍攻
  storm_walker_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: PIERCING_WIND_EX1_CD_REDUCTION,
    ex2Fixed: PIERCING_WIND_EX2_DAMAGE_BONUS,
    ex3Fixed: PIERCING_WIND_EX3_CRITICAL_MULTIPLIER,
    exType: 'cdDamage'
  },
  // 风暴印记 - EX1=CD减少50%, EX2=伤害增加50%
  storm_walker_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex1Fixed: FROST_MARK_EX1_CD_REDUCTION,
    ex2Fixed: FROST_MARK_EX2_DAMAGE_BONUS,
    exType: 'cdDamage'
  },
  // 狂风绝息斩 - EX1=CD减少50%, EX2=伤害增加50%
  storm_walker_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex1Fixed: STORM_RAIN_EX1_CD_REDUCTION,
    ex2Fixed: STORM_RAIN_EX2_DAMAGE_BONUS,
    exType: 'cdDamage'
  },
  // 武器精通-副手武器 - EX1=武器攻击力+50%, EX2=武器攻击力+100%, EX3=副手武器倍攻
  storm_walker_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex3Key: 'I_EX3',
    ex1Fixed: 50,
    ex2Fixed: 100,
    ex3Fixed: Object.freeze({ chance1: 30, multiplier1: 1.5, chance2: 20, multiplier2: 2.0, chance3: 10, multiplier3: 2.5 }),
    exType: 'weaponAttack'
  },
  // 风之积累 - EX1=触发次数减少50%, EX2=倍攻
  storm_walker_j: {
    ex1Key: 'J_EX1',
    ex2Key: 'J_EX2',
    ex1Fixed: 50,
    ex2Fixed: Object.freeze({ chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }),
    exType: 'windAccumulation'
  },
  // 风暴之力 - EX1=暴击率+10%, EX2=暴击伤害+10%, EX3=生命偷取3%
  storm_walker_r: {
    ex1Key: 'R_EX1',
    ex2Key: 'R_EX2',
    ex3Key: 'R_EX3',
    ex1Fixed: 10,
    ex2Fixed: 10,
    ex3Fixed: 3,
    exType: 'stormWings'
  }
})

/**
 * 圣殿骑士EX被动展示配置
 * key: 主动技能ID，value: 对应EX1/EX2/EX3被动技能key与固定加成值
 * exType: EX效果类型，用于决定展示文本格式
 *   - 'holyBulwark': EX1=最大生命值, EX2=伤害减免, EX3=伤害分担
 *   - 'cdDamage': EX1=CD减少, EX2=伤害增加, EX3=倍攻
 *   - 'heavyArmor': EX1=属性抗性, EX2=最大生命值, EX3=概率减伤
 *   - 'holyAccumulation': EX1=触发次数减少, EX2=倍攻
 *   - 'shieldAwakening': EX1=伤害减免+攻击力伤害减少, EX2=属性抗性+最大生命值, EX3=受伤反弹
 */
const HOLY_KNIGHT_EX_CONFIG = Object.freeze({
  // 神圣壁垒 - EX1=最大生命值+10%, EX2=伤害减免+10%, EX3=伤害分担15%
  holy_knight_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex3Key: 'O_EX3',
    ex1Fixed: 10,
    ex2Fixed: 10,
    ex3Fixed: 15,
    exType: 'holyBulwark'
  },
  // 荣耀之剑 - EX1=CD减少50%, EX2=伤害增加50%, EX3=倍攻
  holy_knight_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance2x: 30, chance3x: 20, chance4x: 10 }),
    exType: 'cdDamage'
  },
  // 碎甲圣裁 - EX1=CD减少50%, EX2=伤害增加50%, EX3=双倍惩戒概率*2
  holy_knight_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex3Key: 'E_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: 2,
    exType: 'cdDamage'
  },
  // 圣殿裁决 - EX1=CD减少50%, EX2=伤害增加50%, EX3=倍攻
  holy_knight_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex3Key: 'U_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance2x: 30, chance2_5x: 20, chance3x: 10 }),
    exType: 'cdDamage'
  },
  // 重甲精通 - EX1=所有属性抗性+10%, EX2=最大生命值+15%, EX3=概率减伤
  holy_knight_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex3Key: 'I_EX3',
    ex1Fixed: 10,
    ex2Fixed: 15,
    ex3Fixed: Object.freeze({ chance1: 30, reduction1: 10, chance2: 20, reduction2: 20, chance3: 10, reduction3: 30 }),
    exType: 'heavyArmor'
  },
  // 裁决积累 - EX1=触发次数减少50%, EX2=倍攻
  holy_knight_j: {
    ex1Key: 'J_EX1',
    ex2Key: 'J_EX2',
    ex1Fixed: 50,
    ex2Fixed: Object.freeze({ chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }),
    exType: 'holyAccumulation'
  },
  // 圣盾觉醒 - EX1=伤害减免+25%&攻击力伤害减少50%, EX2=所有属性抗性+15%/最大生命值+15%, EX3=受伤反弹50%
  holy_knight_r: {
    ex1Key: 'R_EX1',
    ex2Key: 'R_EX2',
    ex3Key: 'R_EX3',
    ex1Fixed: 25,
    ex1Fixed2: 50,
    ex2Fixed: 15,
    ex2Fixed2: 15,
    ex3Fixed: 50,
    exType: 'shieldAwakening'
  }
})

/**
 * 奥术师EX被动技能配置表
 * 奥术师为元素使者三转进阶职业，以智力为核心、全元素覆盖、法术暴击为特色
 * exType 说明：
 *   - 'arcaneResonance': EX1=最大MP+15%, EX2=法术穿透+10%, EX3=法术暴击率+10%
 *   - 'cdDamage': EX1=CD减少50%, EX2=伤害增加50%, EX3=技能专属强化
 *   - 'arcaneMastery': EX1=最大MP+15%, EX2=全元素攻击力+15%, EX3=法术吸收
 *   - 'arcaneCharge': EX1=触发次数减少50%, EX2=法术连锁
 *   - 'arcaneOverload': EX1=法力护盾, EX2=暴击伤害+全元素攻击力, EX3=法术反弹
 */
const ARCANE_MASTER_EX_CONFIG = Object.freeze({
  // 奥术共鸣 - EX1=最大MP+15%, EX2=法术穿透+10%, EX3=法术暴击率+10%
  arcane_master_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex3Key: 'O_EX3',
    ex1Fixed: 15,
    ex2Fixed: 10,
    ex3Fixed: 10,
    exType: 'arcaneResonance'
  },
  // 虚空寂灭 - EX1=CD减少50%, EX2=伤害增加50%, EX3=法术连击
  arcane_master_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance2x: 30, chance3x: 20, chance4x: 10 }),
    exType: 'cdDamage'
  },
  // 元素崩坏 - EX1=CD减少50%, EX2=伤害增加50%, EX3=元素易伤强化+20%
  arcane_master_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex3Key: 'E_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: 20,
    exType: 'cdDamage'
  },
  // 奥术新星 - EX1=CD减少50%, EX2=伤害增加50%, EX3=多段攻击
  arcane_master_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex3Key: 'U_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance1: 30, hits1: 1, chance2: 20, hits2: 2, chance3: 10, hits3: 3 }),
    exType: 'cdDamage'
  },
  // 奥术精通 - EX1=最大MP+15%, EX2=全元素攻击力+15%, EX3=法术吸收
  arcane_master_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex3Key: 'I_EX3',
    ex1Fixed: 15,
    ex2Fixed: 15,
    ex3Fixed: Object.freeze({ chance1: 30, absorption1: 10, chance2: 20, absorption2: 20, chance3: 10, absorption3: 30 }),
    exType: 'arcaneMastery'
  },
  // 奥术充能 - EX1=触发次数减少50%, EX2=法术连锁
  arcane_master_j: {
    ex1Key: 'J_EX1',
    ex2Key: 'J_EX2',
    ex1Fixed: 50,
    ex2Fixed: Object.freeze({ chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }),
    exType: 'arcaneCharge'
  },
  // 奥术超载 - EX1=法力护盾25%, EX2=暴击伤害+25%/全元素攻击力+15%, EX3=法术反弹20%
  arcane_master_r: {
    ex1Key: 'R_EX1',
    ex2Key: 'R_EX2',
    ex3Key: 'R_EX3',
    ex1Fixed: 25,
    ex2Fixed: 25,
    ex2Fixed2: 15,
    ex3Fixed: 20,
    exType: 'arcaneOverload'
  }
})

/**
 * 检查圣殿骑士EX被动技能是否已解锁（通用辅助函数）
 * 使用 isSkillUnlocked 检查玩家等级是否达到技能解锁等级
 * @param {string} skillKey - EX技能key（如 'W_EX', 'E_EX1', 'U_EX1'）
 * @returns {boolean} 是否已解锁（玩家等级>=解锁等级）
 */
const isHolyKnightExUnlocked = (skillKey) => {
  if (!props.player) return false
  return checkSkillUnlocked(props.player, 'holy_knight', skillKey)
}

/**
 * 检查奥术师EX被动技能是否已解锁（通用辅助函数）
 * 使用 isSkillUnlocked 检查玩家等级是否达到技能解锁等级
 * @param {string} skillKey - EX技能key（如 'W_EX', 'E_EX1', 'U_EX1'）
 * @returns {boolean} 是否已解锁（玩家等级>=解锁等级）
 */
const isArcaneMasterExUnlocked = (skillKey) => {
  if (!props.player) return false
  return checkSkillUnlocked(props.player, 'arcane_master', skillKey)
}

/**
 * 心灵师EX被动技能配置表
 * 心灵师为精神使者三转进阶职业，以智力为核心、高魔法防御、精神操控为特色
 * exType 说明：
 *   - 'mindResonance': EX1=物理防御+15%, EX2=法术暴击伤害+10%, EX3=攻击力+10%
 *   - 'cdDamage': EX1=CD减少50%, EX2=伤害增加50%, EX3=技能专属强化
 *   - 'mindMastery': EX1=暴击伤害+10%, EX2=法术防御+25%, EX3=最大MP+30% & 精神回复MP
 *   - 'mindCharge': EX1=触发次数减少50%, EX2=心灵连锁
 *   - 'mindAwakening': EX1=法力护盾25%, EX2=暴击伤害+25%/全元素抗性+15%, EX3=法术反弹20%
 */
const MIND_MASTER_EX_CONFIG = Object.freeze({
  // 心灵感应 - EX1=物理防御+15%, EX2=法术暴击伤害+10%, EX3=攻击力+10%
  mind_master_q: {
    ex1Key: 'O',
    ex2Key: 'O_EX2',
    ex3Key: 'O_EX3',
    ex1Fixed: 15,
    ex2Fixed: 10,
    ex3Fixed: 10,
    exType: 'mindResonance'
  },
  // 星思坠寂 - EX1=CD减少50%, EX2=伤害增加50%, EX3=精神连击
  mind_master_w: {
    ex1Key: 'W_EX',
    ex2Key: 'W_EX2',
    ex3Key: 'W_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance2x: 30, chance3x: 20, chance4x: 10 }),
    exType: 'cdDamage'
  },
  // 意识崩塌 - EX1=CD减少50%, EX2=伤害增加50%, EX3=精神虚弱强化+20%
  mind_master_e: {
    ex1Key: 'E_EX1',
    ex2Key: 'E_EX2',
    ex3Key: 'E_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: 20,
    exType: 'cdDamage'
  },
  // 万绪沉宵 - EX1=CD减少50%, EX2=伤害增加50%, EX3=多段攻击
  mind_master_u: {
    ex1Key: 'U_EX1',
    ex2Key: 'U_EX2',
    ex3Key: 'U_EX3',
    ex1Fixed: 50,
    ex2Fixed: 50,
    ex3Fixed: Object.freeze({ chance1: 30, hits1: 1, chance2: 20, hits2: 2, chance3: 10, hits3: 3 }),
    exType: 'cdDamage'
  },
  // 星念凝徽 - EX1=暴击伤害+10%, EX2=法术防御+25%, EX3=精神回复
  mind_master_i: {
    ex1Key: 'I_EX1',
    ex2Key: 'I_EX2',
    ex3Key: 'I_EX3',
    ex1Fixed: 10,
    ex2Fixed: 25,
    ex3Fixed: Object.freeze({ chance1: 30, recovery1: 10, chance2: 20, recovery2: 20, chance3: 10, recovery3: 30 }),
    exType: 'mindMastery'
  },
  // 碎思归墟 - EX1=触发次数减少50%, EX2=心灵连锁
  mind_master_j: {
    ex1Key: 'J_EX1',
    ex2Key: 'J_EX2',
    ex1Fixed: 50,
    ex2Fixed: Object.freeze({ chance1: 30, bonus1: 200, chance2: 20, bonus2: 300, chance3: 10, bonus3: 400 }),
    exType: 'mindCharge'
  },
  // 心灵觉醒 - EX1=法力护盾25%, EX2=暴击伤害+25%/全元素抗性+15%, EX3=法术反弹20%
  mind_master_r: {
    ex1Key: 'R_EX1',
    ex2Key: 'R_EX2',
    ex3Key: 'R_EX3',
    ex1Fixed: 25,
    ex2Fixed: 25,
    ex2Fixed2: 15,
    ex3Fixed: 20,
    exType: 'mindAwakening'
  }
})

/**
 * 检查心灵师EX被动技能是否已解锁（通用辅助函数）
 * 使用 isSkillUnlocked 检查玩家等级是否达到技能解锁等级
 * @param {string} skillKey - EX技能key（如 'W_EX', 'E_EX1', 'U_EX1'）
 * @returns {boolean} 是否已解锁（玩家等级>=解锁等级）
 */
const isMindMasterExUnlocked = (skillKey) => {
  if (!props.player) return false
  return checkSkillUnlocked(props.player, 'mind_master', skillKey)
}

/**
 * 暗影突袭EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为暗影突袭(joker_emperor_w)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const shadowRazeCdReduction = computed(() => {
  if (props.skill?.id !== 'joker_emperor_w') return 0
  return getShadowRazeCdReduction(props.player)
})

/**
 * 暗影突袭EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为暗影突袭(joker_emperor_w)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const shadowRazeEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'joker_emperor_w') return 0
  return getShadowRazeDamageBonus(props.player)
})

/**
 * 暗影突袭EX3-倍攻被动技能的解锁状态与触发信息
 * 仅当当前技能为暗影突袭(joker_emperor_w)且EX3已解锁（190级）时返回非空信息
 * @returns {Object} 倍攻信息 { unlocked, multiplier, chance2x, chance3x, chance5x }
 */
const shadowRazeEx3CriticalMultiplier = computed(() => {
  if (props.skill?.id !== 'joker_emperor_w') {
    return { unlocked: false, multiplier: 1, chance2x: 0, chance3x: 0, chance5x: 0 }
  }
  const info = getShadowRazeCriticalMultiplierInfo(props.player)
  return {
    unlocked: info.unlocked,
    multiplier: info.multiplier,
    chance2x: info.chance2x,
    chance3x: info.chance3x,
    chance5x: info.chance5x
  }
})

/**
 * 暗影之刃EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为暗影之刃(joker_emperor_u)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const shadowBladeCdReduction = computed(() => {
  if (props.skill?.id !== 'joker_emperor_u') return 0
  return getShadowBladeCdReduction(props.player)
})

/**
 * 暗影之刃EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为暗影之刃(joker_emperor_u)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const shadowBladeEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'joker_emperor_u') return 0
  return getShadowBladeDamageBonus(props.player)
})

/**
 * 致命毒刃EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为致命毒刃(joker_emperor_e)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const deadlyPoisonCdReduction = computed(() => {
  if (props.skill?.id !== 'joker_emperor_e') return 0
  return getDeadlyPoisonCdReduction(props.player)
})

/**
 * 暗影斗篷EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为暗影斗篷(joker_emperor_r)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const shadowCloakCdReduction = computed(() => {
  if (props.skill?.id !== 'joker_emperor_r') return 0
  return getShadowCloakCdReduction(props.player)
})

/**
 * 雷神之锤EX1-CD减少被动技能的CD减少百分比
 * 仅当当前技能为雷神之锤(nature_messenger_t)且EX1已解锁（175级）时返回非零值
 * @returns {number} CD减少百分比（0 或 50）
 */
const thunderHammerCdReduction = computed(() => {
  if (props.skill?.id !== 'nature_messenger_t') return 0
  return getThunderHammerCdReduction(props.player)
})

/**
 * 雷神之锤EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为雷神之锤(nature_messenger_t)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const thunderHammerEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'nature_messenger_t') return 0
  return getThunderHammerDamageBonus(props.player)
})

/**
 * 雷神之锤EX3-倍攻被动技能的解锁状态与触发信息
 * 仅当当前技能为雷神之锤(nature_messenger_t)且EX3已解锁（190级）时返回非空信息
 * @returns {Object} 倍攻信息 { unlocked, multiplier, chance1_5x, chance2x, chance3x }
 */
const thunderHammerEx3CriticalMultiplier = computed(() => {
  if (props.skill?.id !== 'nature_messenger_t') {
    return { unlocked: false, multiplier: 1, chance1_5x: 0, chance2x: 0, chance3x: 0 }
  }
  const info = getThunderHammerCriticalMultiplierInfo(props.player)
  return {
    unlocked: info.unlocked,
    multiplier: info.multiplier,
    chance1_5x: info.chance1_5x,
    chance2x: info.chance2x,
    chance3x: info.chance3x
  }
})

/**
 * 致命毒刃EX2-伤害增加被动技能的伤害增加百分比
 * 仅当当前技能为致命毒刃(joker_emperor_e)且EX2已解锁（185级）时返回非零值
 * @returns {number} 伤害增加百分比（0 或 50）
 */
const deadlyPoisonEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'joker_emperor_e') return 0
  return getDeadlyPoisonDamageBonus(props.player)
})

/**
 * 武器精通-飞轮EX1-伤害增加被动技能的武器攻击力加成百分比
 * 仅当当前技能为武器精通-飞轮(joker_emperor_i)且EX1已解锁（175级）时返回非零值
 * @returns {number} 武器攻击力加成百分比（0 或 50）
 */
const weaponMasteryEx1AttackBonus = computed(() => {
  if (props.skill?.id !== 'joker_emperor_i') return 0
  return getWeaponMasteryEx1AttackBonus(props.player)
})

/**
 * 武器精通-飞轮EX2-伤害增加被动技能的武器攻击力加成百分比
 * 仅当当前技能为武器精通-飞轮(joker_emperor_i)且EX2已解锁（190级）时返回非零值
 * @returns {number} 武器攻击力加成百分比（0 或 100）
 */
const weaponMasteryEx2AttackBonus = computed(() => {
if (props.skill?.id !== 'joker_emperor_i') return 0
return getWeaponMasteryEx2AttackBonus(props.player)
})

/**
* 狂风绝刃EX1-CD减少被动技能的CD减少百分比
* 仅当当前技能为狂风绝刃(storm_walker_w)且EX1已解锁（175级）时返回非零值
* @returns {number} CD减少百分比（0 或 50）
*/
const piercingWindCdReduction = computed(() => {
  if (props.skill?.id !== 'storm_walker_w') return 0
  return getPiercingWindCdReduction(props.player)
})

/**
* 狂风绝刃EX2-伤害增加被动技能的伤害增加百分比
* 仅当当前技能为狂风绝刃(storm_walker_w)且EX2已解锁（185级）时返回非零值
* @returns {number} 伤害增加百分比（0 或 50）
*/
const piercingWindEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'storm_walker_w') return 0
  return getPiercingWindDamageBonus(props.player)
})

/**
* 狂风绝刃EX3-倍攻被动技能的解锁状态与触发信息
* 仅当当前技能为狂风绝刃(storm_walker_w)且EX3已解锁（190级）时返回非空信息
* @returns {Object} 倍攻信息 { unlocked, multiplier, chance1_5x, chance2x, chance3x }
*/
const piercingWindEx3CriticalMultiplier = computed(() => {
  if (props.skill?.id !== 'storm_walker_w') {
    return { unlocked: false, multiplier: 1, chance1_5x: 0, chance2x: 0, chance3x: 0 }
  }
  const info = getPiercingWindCriticalMultiplierInfo(props.player)
  return {
    unlocked: info.unlocked,
    multiplier: info.multiplier,
    chance1_5x: info.chance1_5x,
    chance2x: info.chance2x,
    chance3x: info.chance3x
  }
})

/**
* 风暴印记EX1-CD减少被动技能的CD减少百分比
* 仅当当前技能为风暴印记(storm_walker_e)且EX1已解锁（175级）时返回非零值
* @returns {number} CD减少百分比（0 或 50）
*/
const frostMarkCdReduction = computed(() => {
  if (props.skill?.id !== 'storm_walker_e') return 0
  return getFrostMarkCdReduction(props.player)
})

/**
* 风暴印记EX2-伤害增加被动技能的伤害增加百分比
* 仅当当前技能为风暴印记(storm_walker_e)且EX2已解锁（185级）时返回非零值
* @returns {number} 伤害增加百分比（0 或 50）
*/
const frostMarkEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'storm_walker_e') return 0
  return getFrostMarkDamageBonus(props.player)
})

/**
* 狂风绝息斩EX1-CD减少被动技能的CD减少百分比
* 仅当当前技能为狂风绝息斩(storm_walker_u)且EX1已解锁（175级）时返回非零值
* @returns {number} CD减少百分比（0 或 50）
*/
const stormRainCdReduction = computed(() => {
  if (props.skill?.id !== 'storm_walker_u') return 0
  return getStormRainCdReduction(props.player)
})

/**
* 狂风绝息斩EX2-伤害增加被动技能的伤害增加百分比
* 仅当当前技能为狂风绝息斩(storm_walker_u)且EX2已解锁（185级）时返回非零值
* @returns {number} 伤害增加百分比（0 或 50）
*/
const stormRainEx2DamageBonus = computed(() => {
  if (props.skill?.id !== 'storm_walker_u') return 0
  return getStormRainDamageBonus(props.player)
})

/**
* EX加成信息展示行（龟派气功/念气能量弹/暗影突袭/暗影之刃/致命毒刃）
 * 业务意图：详情面板始终展示EX1/EX2加成信息——未解锁时灰色预告并标注解锁等级，已解锁时橙色高亮表示生效中
 * 展示与效果分离：getter未解锁返回0，未解锁时不影响冷却时间与实际伤害计算
 * @returns {Array<{text: string, style: Object}>} 展示行数组，非EX技能返回空数组
 */
const exBonusLines = computed(() => {
  // 格斗宗师EX配置
  const cfg = COMBAT_MASTER_EX_CONFIG[props.skill?.id]
  // 暗夜主宰EX配置
  const jokerCfg = JOKER_EMPEROR_EX_CONFIG[props.skill?.id]
  // 炽天使EX配置
  const nmCfg = NATURE_MESSENGER_EX_CONFIG[props.skill?.id]
  // 风暴行者EX配置
  const swCfg = STORM_WALKER_EX_CONFIG[props.skill?.id]
  // 圣殿骑士EX配置
  const hkCfg = HOLY_KNIGHT_EX_CONFIG[props.skill?.id]
  // 奥术师EX配置
  const amCfg = ARCANE_MASTER_EX_CONFIG[props.skill?.id]
  // 心灵师EX配置
  const mmCfg = MIND_MASTER_EX_CONFIG[props.skill?.id]
  if (!cfg && !jokerCfg && !nmCfg && !swCfg && !hkCfg && !amCfg && !mmCfg) return []

  // 暗夜主宰EX展示分支
  if (jokerCfg) {
    const skillId = props.skill.id
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    if (skillId === 'joker_emperor_w') {
      ex1Unlocked = shadowRazeCdReduction.value > 0
      ex2Unlocked = shadowRazeEx2DamageBonus.value > 0
      ex3Unlocked = shadowRazeEx3CriticalMultiplier.value.unlocked
    } else if (skillId === 'joker_emperor_u') {
      ex1Unlocked = shadowBladeCdReduction.value > 0
      ex2Unlocked = shadowBladeEx2DamageBonus.value > 0
    } else if (skillId === 'joker_emperor_e') {
      ex1Unlocked = deadlyPoisonCdReduction.value > 0
      ex2Unlocked = deadlyPoisonEx2DamageBonus.value > 0
    } else if (skillId === 'joker_emperor_i') {
      ex1Unlocked = weaponMasteryEx1AttackBonus.value > 0
      ex2Unlocked = weaponMasteryEx2AttackBonus.value > 0
    } else if (skillId === 'joker_emperor_q') {
      // 暗影主宰领域EX1(O)和EX2(O_EX2)是被动技能，检查玩家是否已学习
      const playerEx1 = props.player?.skills?.O
      const playerEx2 = props.player?.skills?.O_EX2
      ex1Unlocked = !!(playerEx1 && (playerEx1.proficiencyLevel || (playerEx1.proficiency?.level) || playerEx1.level) >= 1)
      ex2Unlocked = !!(playerEx2 && (playerEx2.proficiencyLevel || (playerEx2.proficiency?.level) || playerEx2.level) >= 1)
    }

    const ex1UnlockLevel = getOriginalSkill('joker_emperor', jokerCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('joker_emperor', jokerCfg.ex2Key)?.unlockLevel || 185

    // 根据EX类型决定显示文本
    const isWeaponAttack = jokerCfg.exType === 'weaponAttack'
    const isShadowEscape = jokerCfg.exType === 'shadowEscape'
    let ex1Label, ex2Label
    if (isWeaponAttack) {
      ex1Label = `武器攻击力+${jokerCfg.ex1Fixed}%`
      ex2Label = `武器攻击力+${jokerCfg.ex2Fixed}%`
    } else if (isShadowEscape) {
      ex1Label = `格挡率+${jokerCfg.ex1Fixed}%`
      ex2Label = `攻击速度+${jokerCfg.ex2Fixed}%`
    } else {
      ex1Label = `冷却时间-${jokerCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${jokerCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3倍攻信息（仅暗影突袭有EX3）
    if (jokerCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('joker_emperor', jokerCfg.ex3Key)?.unlockLevel || 190
      const ex3Chances = jokerCfg.ex3Fixed
      lines.push({
        text: ex3Unlocked
          ? `EX3加成: 倍攻（已解锁，生效中） 2倍${ex3Chances.chance2x}%/3倍${ex3Chances.chance3x}%/5倍${ex3Chances.chance5x}%`
          : `EX3加成: 倍攻 2倍${ex3Chances.chance2x}%/3倍${ex3Chances.chance3x}%/5倍${ex3Chances.chance5x}%（${ex3UnlockLevel}级解锁，未解锁）`,
        style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
      })
    }

    return lines
  }

  // 炽天使EX展示分支
  if (nmCfg) {
    const skillId = props.skill.id
    // 雷神之锤使用专用computed，其他技能使用通用检查
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    if (skillId === 'nature_messenger_t') {
      ex1Unlocked = thunderHammerCdReduction.value > 0
      ex2Unlocked = thunderHammerEx2DamageBonus.value > 0
      ex3Unlocked = thunderHammerEx3CriticalMultiplier.value.unlocked
    } else {
      ex1Unlocked = isNatureMessengerExUnlocked(nmCfg.ex1Key)
      ex2Unlocked = isNatureMessengerExUnlocked(nmCfg.ex2Key)
      if (nmCfg.ex3Key) {
        ex3Unlocked = isNatureMessengerExUnlocked(nmCfg.ex3Key)
      }
    }

    const ex1UnlockLevel = getOriginalSkill('nature_messenger', nmCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('nature_messenger', nmCfg.ex2Key)?.unlockLevel || 185

    // 根据 exType 决定展示文本
    const exType = nmCfg.exType
    let ex1Label, ex2Label

    if (exType === 'defense') {
      ex1Label = `物理防御+${nmCfg.ex1Fixed}%`
      ex2Label = `魔法防御+${nmCfg.ex2Fixed}%`
    } else if (exType === 'weaponAttack') {
      ex1Label = `武器攻击力+${nmCfg.ex1Fixed}%`
      ex2Label = `武器攻击力+${nmCfg.ex2Fixed}%`
    } else if (exType === 'holySanctuary') {
      ex1Label = `恢复魔法值(攻击力${nmCfg.ex1Fixed}%)`
      ex2Label = `受伤恢复(${nmCfg.ex2Fixed}%最大生命值)`
    } else if (exType === 'angelWings') {
      ex1Label = `魔法防御+${nmCfg.ex1Fixed}%`
      ex2Label = `最大生命值+${nmCfg.ex2Fixed}`
    } else if (exType === 'holyAccumulation') {
      ex1Label = `触发次数-${nmCfg.ex1Fixed}%`
      ex2Label = `倍攻治疗`
    } else {
      // cdDamage 默认
      ex1Label = `冷却时间-${nmCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${nmCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3信息
    if (nmCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('nature_messenger', nmCfg.ex3Key)?.unlockLevel || 190
      const ex3Data = nmCfg.ex3Fixed

      if (exType === 'angelWings') {
        // 天使之翼EX3=生命护盾
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 生命护盾(最大生命值${ex3Data}%)（已解锁，生效中）`
            : `EX3加成: 生命护盾(最大生命值${ex3Data}%)（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#2ecc71' : '#95a5a6' }
        })
      } else if (skillId === 'nature_messenger_t') {
        // 雷神之锤EX3=倍攻
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 倍攻（已解锁，生效中） 1.5倍${ex3Data.chance1_5x}%/2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%`
            : `EX3加成: 倍攻 1.5倍${ex3Data.chance1_5x}%/2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      } else if (skillId === 'nature_messenger_u') {
        // 天使之怒EX3=多段攻击
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 多段攻击（已解锁，生效中） 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%`
            : `EX3加成: 多段攻击 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      }
    }

    return lines
  }

  // 风暴行者EX展示分支
  if (swCfg) {
    const skillId = props.skill.id
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    // 根据技能ID检查EX解锁状态
    if (skillId === 'storm_walker_w') {
      ex1Unlocked = piercingWindCdReduction.value > 0
      ex2Unlocked = piercingWindEx2DamageBonus.value > 0
      ex3Unlocked = piercingWindEx3CriticalMultiplier.value.unlocked
    } else if (skillId === 'storm_walker_e') {
      ex1Unlocked = frostMarkCdReduction.value > 0
      ex2Unlocked = frostMarkEx2DamageBonus.value > 0
    } else if (skillId === 'storm_walker_u') {
      ex1Unlocked = stormRainCdReduction.value > 0
      ex2Unlocked = stormRainEx2DamageBonus.value > 0
    } else {
      // Q、I、J、R 技能使用通用检查
      ex1Unlocked = isStormWalkerExUnlocked(swCfg.ex1Key)
      ex2Unlocked = isStormWalkerExUnlocked(swCfg.ex2Key)
      if (swCfg.ex3Key) {
        ex3Unlocked = isStormWalkerExUnlocked(swCfg.ex3Key)
      }
    }

    const ex1UnlockLevel = getOriginalSkill('storm_walker', swCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('storm_walker', swCfg.ex2Key)?.unlockLevel || 185

    // 根据 exType 决定展示文本
    const exType = swCfg.exType
    let ex1Label, ex2Label

    if (exType === 'stormDomain') {
      ex1Label = `暴击率+${swCfg.ex1Fixed}%`
      ex2Label = `攻击速度+${swCfg.ex2Fixed}%`
    } else if (exType === 'stormWings') {
      ex1Label = `暴击率+${swCfg.ex1Fixed}%`
      ex2Label = `暴击伤害+${swCfg.ex2Fixed}%`
    } else if (exType === 'weaponAttack') {
      ex1Label = `武器攻击力+${swCfg.ex1Fixed}%`
      ex2Label = `武器攻击力+${swCfg.ex2Fixed}%`
    } else if (exType === 'windAccumulation') {
      ex1Label = `触发次数-${swCfg.ex1Fixed}%`
      ex2Label = `倍攻附加伤害`
    } else {
      // cdDamage 默认
      ex1Label = `冷却时间-${swCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${swCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3信息
    if (swCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('storm_walker', swCfg.ex3Key)?.unlockLevel || 190
      const ex3Data = swCfg.ex3Fixed

      if (exType === 'cdDamage') {
        // 狂风绝刃EX3=倍攻
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 倍攻（已解锁，生效中） 1.5倍${ex3Data.chance1_5x}%/2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%`
            : `EX3加成: 倍攻 1.5倍${ex3Data.chance1_5x}%/2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      } else if (exType === 'weaponAttack') {
        // 武器精通EX3=副手武器倍攻
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 副手武器倍攻（已解锁，生效中） 1.5倍${ex3Data.chance1}%/2倍${ex3Data.chance2}%/2.5倍${ex3Data.chance3}%`
            : `EX3加成: 副手武器倍攻 1.5倍${ex3Data.chance1}%/2倍${ex3Data.chance2}%/2.5倍${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      } else if (exType === 'stormWings') {
        // 风暴之力EX3=生命偷取
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 生命偷取${ex3Data}%（已解锁，生效中）`
            : `EX3加成: 生命偷取${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#2ecc71' : '#95a5a6' }
        })
      }
    }

    return lines
  }

  // 圣殿骑士EX展示分支
  if (hkCfg) {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    // 所有圣殿骑士技能使用通用检查
    ex1Unlocked = isHolyKnightExUnlocked(hkCfg.ex1Key)
    ex2Unlocked = isHolyKnightExUnlocked(hkCfg.ex2Key)
    if (hkCfg.ex3Key) {
      ex3Unlocked = isHolyKnightExUnlocked(hkCfg.ex3Key)
    }

    const ex1UnlockLevel = getOriginalSkill('holy_knight', hkCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('holy_knight', hkCfg.ex2Key)?.unlockLevel || 185

    // 根据 exType 决定展示文本
    const exType = hkCfg.exType
    let ex1Label, ex2Label

    if (exType === 'holyBulwark') {
      ex1Label = `最大生命值+${hkCfg.ex1Fixed}%`
      ex2Label = `伤害减免+${hkCfg.ex2Fixed}%`
    } else if (exType === 'heavyArmor') {
      ex1Label = `所有属性抗性+${hkCfg.ex1Fixed}%`
      ex2Label = `最大生命值+${hkCfg.ex2Fixed}%`
    } else if (exType === 'holyAccumulation') {
      ex1Label = `触发次数-${hkCfg.ex1Fixed}%`
      ex2Label = `倍攻附加伤害`
} else if (exType === 'shieldAwakening') {
ex1Label = `伤害减免+${hkCfg.ex1Fixed}%/攻击力伤害-${hkCfg.ex1Fixed2}%`
ex2Label = `属性抗性+${hkCfg.ex2Fixed}%/最大生命值+${hkCfg.ex2Fixed2}%`
    } else {
      // cdDamage 默认
      ex1Label = `冷却时间-${hkCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${hkCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3信息
    if (hkCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('holy_knight', hkCfg.ex3Key)?.unlockLevel || 190
      const ex3Data = hkCfg.ex3Fixed

      if (exType === 'cdDamage') {
        // 荣耀之剑EX3=倍攻 / 圣殿裁决EX3=倍攻
        const skillId = props.skill?.id
        if (skillId === 'holy_knight_w') {
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 倍攻（已解锁，生效中） 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%`
              : `EX3加成: 倍攻 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'holy_knight_u') {
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 倍攻（已解锁，生效中） 2倍${ex3Data.chance2x}%/2.5倍${ex3Data.chance2_5x}%/3倍${ex3Data.chance3x}%`
              : `EX3加成: 倍攻 2倍${ex3Data.chance2x}%/2.5倍${ex3Data.chance2_5x}%/3倍${ex3Data.chance3x}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'holy_knight_e') {
          // 碎甲圣裁EX3=双倍惩戒概率*2
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 双倍惩戒概率x${ex3Data}（已解锁，生效中）`
              : `EX3加成: 双倍惩戒概率x${ex3Data}（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        }
      } else if (exType === 'heavyArmor') {
        // 重甲精通EX3=概率减伤
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 概率减伤（已解锁，生效中） 减伤10%${ex3Data.chance1}%/减伤20%${ex3Data.chance2}%/减伤30%${ex3Data.chance3}%`
            : `EX3加成: 概率减伤 减伤10%${ex3Data.chance1}%/减伤20%${ex3Data.chance2}%/减伤30%${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
} else if (exType === 'holyBulwark') {
// 神圣壁垒EX3=伤害分担
lines.push({
text: ex3Unlocked
? `EX3加成: 伤害分担${ex3Data}%（已解锁，生效中）`
: `EX3加成: 伤害分担${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
})
} else if (exType === 'shieldAwakening') {
// 圣盾觉醒EX3=受伤反弹
lines.push({
text: ex3Unlocked
? `EX3加成: 受伤反弹${ex3Data}%（已解锁，生效中）`
: `EX3加成: 受伤反弹${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
style: { color: ex3Unlocked ? '#e74c3c' : '#95a5a6' }
})
      }
    }

    return lines
  }

  // 奥术师EX展示分支
  if (amCfg) {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    // 所有奥术师技能使用通用检查
    ex1Unlocked = isArcaneMasterExUnlocked(amCfg.ex1Key)
    ex2Unlocked = isArcaneMasterExUnlocked(amCfg.ex2Key)
    if (amCfg.ex3Key) {
      ex3Unlocked = isArcaneMasterExUnlocked(amCfg.ex3Key)
    }

    const ex1UnlockLevel = getOriginalSkill('arcane_master', amCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('arcane_master', amCfg.ex2Key)?.unlockLevel || 185

    // 根据 exType 决定展示文本
    const exType = amCfg.exType
    let ex1Label, ex2Label

    if (exType === 'arcaneResonance') {
      ex1Label = `最大MP+${amCfg.ex1Fixed}%`
      ex2Label = `法术穿透+${amCfg.ex2Fixed}%`
    } else if (exType === 'arcaneMastery') {
      ex1Label = `最大MP+${amCfg.ex1Fixed}%`
      ex2Label = `全元素攻击力+${amCfg.ex2Fixed}%`
    } else if (exType === 'arcaneCharge') {
      ex1Label = `触发次数-${amCfg.ex1Fixed}%`
      ex2Label = `法术连锁附加伤害`
    } else if (exType === 'arcaneOverload') {
      ex1Label = `法力护盾吸收${amCfg.ex1Fixed}%伤害`
      ex2Label = `暴击伤害+${amCfg.ex2Fixed}%/全元素攻击力+${amCfg.ex2Fixed2}%`
    } else {
      // cdDamage 默认
      ex1Label = `冷却时间-${amCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${amCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3信息
    if (amCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('arcane_master', amCfg.ex3Key)?.unlockLevel || 190
      const ex3Data = amCfg.ex3Fixed

      if (exType === 'cdDamage') {
        const skillId = props.skill?.id
        if (skillId === 'arcane_master_w') {
          // 虚空寂灭EX3=法术连击
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 法术连击（已解锁，生效中） 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%`
              : `EX3加成: 法术连击 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'arcane_master_e') {
          // 元素崩坏EX3=元素易伤强化
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 元素脆弱增强+${ex3Data}%（已解锁，生效中）`
              : `EX3加成: 元素脆弱增强+${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'arcane_master_u') {
          // 奥术新星EX3=多段攻击
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 多段攻击（已解锁，生效中） 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%`
              : `EX3加成: 多段攻击 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        }
      } else if (exType === 'arcaneResonance') {
        // 奥术共鸣EX3=法术暴击率
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 法术暴击率+${ex3Data}%（已解锁，生效中）`
            : `EX3加成: 法术暴击率+${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      } else if (exType === 'arcaneMastery') {
        // 奥术精通EX3=法术吸收
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 法术吸收（已解锁，生效中） 吸收10%${ex3Data.chance1}%/吸收20%${ex3Data.chance2}%/吸收30%${ex3Data.chance3}%`
            : `EX3加成: 法术吸收 吸收10%${ex3Data.chance1}%/吸收20%${ex3Data.chance2}%/吸收30%${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#2ecc71' : '#95a5a6' }
        })
      } else if (exType === 'arcaneOverload') {
        // 奥术超载EX3=法术反弹
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 法术反弹${ex3Data}%（已解锁，生效中）`
            : `EX3加成: 法术反弹${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#e74c3c' : '#95a5a6' }
        })
      }
    }

    return lines
  }

  // 心灵师EX展示分支
  if (mmCfg) {
    let ex1Unlocked = false
    let ex2Unlocked = false
    let ex3Unlocked = false

    // 所有心灵师技能使用通用检查
    ex1Unlocked = isMindMasterExUnlocked(mmCfg.ex1Key)
    ex2Unlocked = isMindMasterExUnlocked(mmCfg.ex2Key)
    if (mmCfg.ex3Key) {
      ex3Unlocked = isMindMasterExUnlocked(mmCfg.ex3Key)
    }

    const ex1UnlockLevel = getOriginalSkill('mind_master', mmCfg.ex1Key)?.unlockLevel || 175
    const ex2UnlockLevel = getOriginalSkill('mind_master', mmCfg.ex2Key)?.unlockLevel || 185

    // 根据 exType 决定展示文本
    const exType = mmCfg.exType
    let ex1Label, ex2Label

    if (exType === 'mindResonance') {
      ex1Label = `物理防御+${mmCfg.ex1Fixed}%`
      ex2Label = `法术暴击伤害+${mmCfg.ex2Fixed}%`
} else if (exType === 'mindMastery') {
        ex1Label = `暴击伤害+${mmCfg.ex1Fixed}%`
        ex2Label = `法术防御+${mmCfg.ex2Fixed}%`
      } else if (exType === 'mindCharge') {
      ex1Label = `触发次数-${mmCfg.ex1Fixed}%`
      ex2Label = `心灵连锁附加伤害`
    } else if (exType === 'mindAwakening') {
      ex1Label = `法力护盾吸收${mmCfg.ex1Fixed}%伤害`
      ex2Label = `暴击伤害+${mmCfg.ex2Fixed}%/全元素抗性+${mmCfg.ex2Fixed2}%`
    } else {
      // cdDamage 默认
      ex1Label = `冷却时间-${mmCfg.ex1Fixed}%`
      ex2Label = `技能伤害+${mmCfg.ex2Fixed}%`
    }

    const lines = [
      {
        text: ex1Unlocked
          ? `EX1加成: ${ex1Label}（已解锁，生效中）`
          : `EX1加成: ${ex1Label}（${ex1UnlockLevel}级解锁，未解锁）`,
        style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
      },
      {
        text: ex2Unlocked
          ? `EX2加成: ${ex2Label}（已解锁，生效中）`
          : `EX2加成: ${ex2Label}（${ex2UnlockLevel}级解锁，未解锁）`,
        style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
      }
    ]

    // EX3信息
    if (mmCfg.ex3Key) {
      const ex3UnlockLevel = getOriginalSkill('mind_master', mmCfg.ex3Key)?.unlockLevel || 190
      const ex3Data = mmCfg.ex3Fixed

      if (exType === 'cdDamage') {
        const skillId = props.skill?.id
        if (skillId === 'mind_master_w') {
          // 星思坠寂EX3=精神连击
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 精神连击（已解锁，生效中） 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%`
              : `EX3加成: 精神连击 2倍${ex3Data.chance2x}%/3倍${ex3Data.chance3x}%/4倍${ex3Data.chance4x}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'mind_master_e') {
          // 意识崩塌EX3=精神虚弱强化
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 精神虚弱强化+${ex3Data}%（已解锁，生效中）`
              : `EX3加成: 精神虚弱强化+${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        } else if (skillId === 'mind_master_u') {
          // 万绪沉宵EX3=多段攻击
          lines.push({
            text: ex3Unlocked
              ? `EX3加成: 多段攻击（已解锁，生效中） 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%`
              : `EX3加成: 多段攻击 1段${ex3Data.chance1}%/2段${ex3Data.chance2}%/3段${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
            style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
          })
        }
      } else if (exType === 'mindResonance') {
        // 心灵感应EX3=攻击力
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 攻击力+${ex3Data}%（已解锁，生效中）`
            : `EX3加成: 攻击力+${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
        })
      } else if (exType === 'mindMastery') {
        // 星念凝徽EX3=最大MP+30% & 精神回复
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 最大MP+30% & 精神回复（已解锁，生效中） 回复10%${ex3Data.chance1}%/回复20%${ex3Data.chance2}%/回复30%${ex3Data.chance3}%`
            : `EX3加成: 最大MP+30% & 精神回复 回复10%${ex3Data.chance1}%/回复20%${ex3Data.chance2}%/回复30%${ex3Data.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#2ecc71' : '#95a5a6' }
        })
      } else if (exType === 'mindAwakening') {
        // 心灵觉醒EX3=法术反弹
        lines.push({
          text: ex3Unlocked
            ? `EX3加成: 法术反弹${ex3Data}%（已解锁，生效中）`
            : `EX3加成: 法术反弹${ex3Data}%（${ex3UnlockLevel}级解锁，未解锁）`,
          style: { color: ex3Unlocked ? '#e74c3c' : '#95a5a6' }
        })
      }
    }

    return lines
  }

  // 格斗宗师EX展示分支
  const isNensphere = props.skill.id === 'combat_master_w'
  const ex1Unlocked = isNensphere ? nensphereCdReduction.value > 0 : auraBombCdReduction.value > 0
  const ex2Unlocked = isNensphere ? nensphereEx2DamageBonus.value > 0 : auraBombEx2DamageBonus.value > 0
  const ex3Unlocked = isNensphere ? nensphereEx3MultiHit.value.unlocked : false

  // 解锁等级取自静态技能配置，避免硬编码漂移
  const ex1UnlockLevel = getOriginalSkill('combat_master', cfg.ex1Key)?.unlockLevel || 175
  const ex2UnlockLevel = getOriginalSkill('combat_master', cfg.ex2Key)?.unlockLevel || 185

  const lines = [
    {
      text: ex1Unlocked
        ? `EX1加成: 冷却时间-${cfg.ex1Fixed}%（已解锁，生效中）`
        : `EX1加成: 冷却时间-${cfg.ex1Fixed}%（${ex1UnlockLevel}级解锁，未解锁）`,
      style: { color: ex1Unlocked ? '#f39c12' : '#95a5a6' }
    },
    {
      text: ex2Unlocked
        ? `EX2加成: 技能伤害+${cfg.ex2Fixed}%（已解锁，生效中）`
        : `EX2加成: 技能伤害+${cfg.ex2Fixed}%（${ex2UnlockLevel}级解锁，未解锁）`,
      style: { color: ex2Unlocked ? '#f39c12' : '#95a5a6' }
    }
  ]

  // EX3加成信息（仅龟派气功有EX3）
  if (cfg.ex3Key) {
    const ex3UnlockLevel = getOriginalSkill('combat_master', cfg.ex3Key)?.unlockLevel || 190
    const ex3Chances = cfg.ex3Fixed
    lines.push({
      text: ex3Unlocked
        ? `EX3加成: 多段伤害（已解锁，生效中） ${ex3Chances.chance1}%/${ex3Chances.chance2}%/${ex3Chances.chance3}%`
        : `EX3加成: 多段伤害 ${ex3Chances.chance1}%/${ex3Chances.chance2}%/${ex3Chances.chance3}%（${ex3UnlockLevel}级解锁，未解锁）`,
      style: { color: ex3Unlocked ? '#f39c12' : '#95a5a6' }
    })
  }

  return lines
})

/**
 * 实际冷却时间（考虑暴风箭矢EX1/狂风连射EX1的CD减少加成）
 * 同时支持 baseCooldown（归一化后）和 cd（静态技能配置原始字段），
 * 与 useUnifiedSkills.js 中的优先级保持一致：baseCooldown 优先，cd 次之
 * @returns {number|undefined} 实际冷却时间（秒），若技能无冷却时间字段则返回undefined
 */
const effectiveCooldown = computed(() => {
  // 优先使用 baseCooldown（归一化字段），回退到 cd（静态技能配置原始字段）
  const rawCd = props.skill?.baseCooldown ?? props.skill?.cd
  if (rawCd === undefined) return undefined
  const baseCd = Number(rawCd) || 0
  // 暴风箭矢EX1-CD减少
  if (stormArrowCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - stormArrowCdReduction.value / 100)))
  }
  // 狂风连射EX1-CD减少
  if (galeRapidFireCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - galeRapidFireCdReduction.value / 100)))
  }
  // 龟派气功EX1-CD减少
  if (nensphereCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - nensphereCdReduction.value / 100)))
  }
  // 念气能量弹EX1-CD减少
  if (auraBombCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - auraBombCdReduction.value / 100)))
  }
  // 暗影突袭EX1-CD减少
  if (shadowRazeCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - shadowRazeCdReduction.value / 100)))
  }
  // 暗影之刃EX1-CD减少
  if (shadowBladeCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - shadowBladeCdReduction.value / 100)))
  }
  // 致命毒刃EX1-CD减少
  if (deadlyPoisonCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - deadlyPoisonCdReduction.value / 100)))
  }
  // 暗影斗篷EX1-CD减少
  if (shadowCloakCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - shadowCloakCdReduction.value / 100)))
  }
  // 雷神之锤EX1-CD减少
  if (thunderHammerCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - thunderHammerCdReduction.value / 100)))
  }
  // 圣光审判EX1-CD减少
  if (props.skill?.id === 'nature_messenger_e' && isNatureMessengerExUnlocked('E_EX1')) {
    return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
  }
  // 狂风绝刃EX1-CD减少
  if (piercingWindCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - piercingWindCdReduction.value / 100)))
  }
  // 风暴印记EX1-CD减少
  if (frostMarkCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - frostMarkCdReduction.value / 100)))
  }
  // 狂风绝息斩EX1-CD减少
  if (stormRainCdReduction.value > 0) {
    return Math.max(1, Math.ceil(baseCd * (1 - stormRainCdReduction.value / 100)))
  }
  // 荣耀之剑EX1-CD减少
  if (props.skill?.id === 'holy_knight_w' && isHolyKnightExUnlocked('W_EX')) {
    return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
  }
  // 碎甲圣裁EX1-CD减少
  if (props.skill?.id === 'holy_knight_e' && isHolyKnightExUnlocked('E_EX1')) {
    return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
  }
// 圣殿裁决EX1-CD减少
if (props.skill?.id === 'holy_knight_u' && isHolyKnightExUnlocked('U_EX1')) {
return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 奥术师-虚空寂灭EX1-CD减少
if (props.skill?.id === 'arcane_master_w' && isArcaneMasterExUnlocked('W_EX')) {
return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 奥术师-元素崩坏EX1-CD减少
if (props.skill?.id === 'arcane_master_e' && isArcaneMasterExUnlocked('E_EX1')) {
return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 奥术师-奥术新星EX1-CD减少
if (props.skill?.id === 'arcane_master_u' && isArcaneMasterExUnlocked('U_EX1')) {
return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 心灵师-星思坠寂EX1-CD减少
if (props.skill?.id === 'mind_master_w' && isMindMasterExUnlocked('W_EX')) {
  return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 心灵师-意识崩塌EX1-CD减少
if (props.skill?.id === 'mind_master_e' && isMindMasterExUnlocked('E_EX1')) {
  return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 心灵师-万绪沉宵EX1-CD减少
if (props.skill?.id === 'mind_master_u' && isMindMasterExUnlocked('U_EX1')) {
  return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
}
// 天使之翼EX1从CD减少更改为魔法防御加成，不再需要CD减少逻辑
  if (props.skill?.id === 'nature_messenger_r') {
    return baseCd
  }
  // 天使之怒EX1-CD减少
  if (props.skill?.id === 'nature_messenger_u' && isNatureMessengerExUnlocked('U_EX1')) {
    return Math.max(1, Math.ceil(baseCd * (1 - 50 / 100)))
  }
  return baseCd
})

/**
 * 获取玩家的技能伤害加成百分比
 * 来自套装属性、装备属性等
 * @returns {number} 技能伤害加成百分比（如10表示10%）
 */
const skillDamageBonus = computed(() => {
  const rawPlayer = props.player
  if (!rawPlayer || typeof rawPlayer !== 'object') {
    return 0
  }
  const bonus = Number(rawPlayer.skillDamage ?? 0)
  return Number.isFinite(bonus) && bonus > 0 ? bonus : 0
})

/**
 * 获取武器唤醒技能伤害加成
 * 只对一转（unlockLevel >= 15）和二转技能生效
 * @returns {number} 武器唤醒技能伤害加成百分比
 */
const weaponAwakeningDamageBonus = computed(() => {
  const skill = props.skill
  if (!skill) return 0

  // 检查技能是否是一转或二转技能（unlockLevel >= 15）
  const unlockLevel = skill.unlockLevel || 0
  if (unlockLevel < 15) return 0 // 初心者技能不享受加成

  try {
    const itemsStore = useItemsStore()
    if (!itemsStore) return 0

    const equipment = itemsStore.equipment || {}
    const weapon = equipment.weapon

    if (!weapon || !weapon.awakenedSkillData) return 0

    const awakenedSkillId = weapon.awakenedSkillData.skillId
    const awakenedValue = weapon.awakenedSkillData.skillValue || 0

    if (!awakenedSkillId || awakenedValue <= 0) return 0

    // 通过SKILL_INFO查找技能名称匹配
    const skillInfo = SKILL_INFO[String(awakenedSkillId)]
    if (!skillInfo) return 0

    const currentSkillName = skill.name
    const awakenedSkillName = skillInfo.name?.cns || skillInfo.name?.en

    // 如果技能名称匹配，返回伤害加成
    if (currentSkillName && awakenedSkillName && currentSkillName === awakenedSkillName) {
      return awakenedValue
    }

    return 0
  } catch (error) {
    console.error('[SkillTooltip] 获取武器唤醒伤害加成失败:', error)
    return 0
  }
})

/**
 * 格式化技能伤害加成显示文本
 * @returns {string} 格式化后的显示文本
 */
const skillDamageBonusText = computed(() => {
  const parts = []
  
  // 技能增伤
  if (skillDamageBonus.value > 0) {
    parts.push(`+${skillDamageBonus.value}%技能增伤`)
  }
  
  // 武器唤醒伤害加成
  if (weaponAwakeningDamageBonus.value > 0) {
    parts.push(`+${weaponAwakeningDamageBonus.value}%武器唤醒`)
  }

  // 暴风箭矢EX2伤害加成
  if (stormArrowEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${stormArrowEx2DamageBonus.value}%`)
  }

  // 狂风连射EX2伤害加成
  if (galeRapidFireEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${galeRapidFireEx2DamageBonus.value}%`)
  }

  // 龟派气功EX2伤害加成
  if (nensphereEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${nensphereEx2DamageBonus.value}%`)
  }

  // 龟派气功EX3多段伤害
  if (nensphereEx3MultiHit.value.unlocked) {
    const ex3 = nensphereEx3MultiHit.value
    parts.push(`EX3加成,多段伤害${ex3.chance1}%/${ex3.chance2}%/${ex3.chance3}%`)
  }

  // 念气能量弹EX2伤害加成
  if (auraBombEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${auraBombEx2DamageBonus.value}%`)
  }

  // 雷神之锤EX2伤害加成
  if (thunderHammerEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${thunderHammerEx2DamageBonus.value}%`)
  }

  // 雷神之锤EX3倍攻
  if (thunderHammerEx3CriticalMultiplier.value.unlocked) {
    const ex3 = thunderHammerEx3CriticalMultiplier.value
    parts.push(`EX3加成,倍攻1.5倍${ex3.chance1_5x}%/2倍${ex3.chance2x}%/3倍${ex3.chance3x}%`)
  }

  // 天使之怒EX2伤害加成
  if (props.skill?.id === 'nature_messenger_u' && isNatureMessengerExUnlocked('U_EX2')) {
    parts.push(`EX2加成,技能伤害+50%`)
  }

  // 天使之怒EX3多段攻击
  if (props.skill?.id === 'nature_messenger_u' && isNatureMessengerExUnlocked('U_EX3')) {
    parts.push(`EX3加成,多段攻击50%/25%/10%`)
  }

  // 圣光审判EX2伤害加成
  if (props.skill?.id === 'nature_messenger_e' && isNatureMessengerExUnlocked('E_EX2')) {
    parts.push(`EX2加成,技能伤害+50%`)
  }

  // 风暴印记EX2伤害加成
  if (frostMarkEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${frostMarkEx2DamageBonus.value}%`)
  }

  // 狂风绝息斩EX2伤害加成
  if (stormRainEx2DamageBonus.value > 0) {
    parts.push(`EX2加成,技能伤害+${stormRainEx2DamageBonus.value}%`)
  }

  if (parts.length === 0) {
    return ''
  }
  return `(${parts.join(', ')})`
})

const actualDamage = computed(() => {
  if (!props.skill?.damage) {
    return 0
  }

  const calculator =
    typeof props.skill.calculateDamage === 'function'
      ? props.skill.calculateDamage
      : typeof props.skill.damageCalculation === 'function'
        ? props.skill.damageCalculation
        : null

  const playerForCalc = skillCalcPlayer.value
  let baseDamage = 0

  if (calculator && playerForCalc) {
    try {
      const attempts = [
        [playerForCalc, props.skill.level || 1],
        [playerForCalc, props.skill.level || 1, null],
        [playerForCalc, props.skill.level || 1, null, null], // 4个参数，用于神念攻击等技能
        [playerForCalc, props.skill]
      ]

      for (const args of attempts) {
        const result = calculator.call(props.skill, ...args)
        const numeric = Number(result)
        if (Number.isFinite(numeric)) {
          baseDamage = numeric
          break
        }
      }
    } catch (error) {
      console.error('伤害计算出错:', error)
    }
  }

  // 如果计算器没有返回有效值，使用基础伤害 + 熟练度加成
  if (baseDamage === 0) {
    const skillBaseDamage = Number(props.skill.damage || 0)
    const proficiencyBonus = calculateProficiencyBonus(props.skill)
    const safeProficiencyBonus = Number.isFinite(proficiencyBonus) ? proficiencyBonus : 0
    baseDamage = skillBaseDamage + safeProficiencyBonus
  }

  // 应用技能伤害百分比加成（来自套装、装备等）
  const bonus = skillDamageBonus.value
  if (bonus > 0) {
    baseDamage *= 1 + bonus / 100
  }

  // 应用武器唤醒技能伤害加成（只对一转、二转技能生效）
  const awakeningBonus = weaponAwakeningDamageBonus.value
  if (awakeningBonus > 0) {
    baseDamage *= 1 + awakeningBonus / 100
  }

  // 应用暴风箭矢EX2伤害增加加成（仅对暴风箭矢技能生效）
  const ex2Bonus = stormArrowEx2DamageBonus.value
  if (ex2Bonus > 0) {
    baseDamage *= 1 + ex2Bonus / 100
  }

  // 应用狂风连射EX2伤害增加加成（仅对狂风连射技能生效）
  const galeEx2Bonus = galeRapidFireEx2DamageBonus.value
  if (galeEx2Bonus > 0) {
    baseDamage *= 1 + galeEx2Bonus / 100
  }

  // 应用龟派气功EX2伤害增加加成（仅对龟派气功技能生效）
  const nensphereEx2Bonus = nensphereEx2DamageBonus.value
  if (nensphereEx2Bonus > 0) {
    baseDamage *= 1 + nensphereEx2Bonus / 100
  }

  // 应用念气能量弹EX2伤害增加加成（仅对念气能量弹技能生效）
  const auraBombEx2Bonus = auraBombEx2DamageBonus.value
  if (auraBombEx2Bonus > 0) {
    baseDamage *= 1 + auraBombEx2Bonus / 100
  }

  // 应用雷神之锤EX2伤害增加加成（仅对雷神之锤技能生效）
  const thunderHammerEx2Bonus = thunderHammerEx2DamageBonus.value
  if (thunderHammerEx2Bonus > 0) {
    baseDamage *= 1 + thunderHammerEx2Bonus / 100
  }

  return Math.floor(baseDamage)
})

const damageFormula = computed(() => {
  // 获取计算函数（支持 calculateDamage 和 damageCalculation）
  const calcFn = props.skill?.calculateDamage || props.skill?.damageCalculation
  if (!calcFn) {
    return '无法解析'
  }

  const playerForCalc = skillCalcPlayer.value
  if (!playerForCalc) {
    return '无法解析'
  }

  try {
    const calcStr = calcFn.toString()
    const skillLevel = Number(props.skill.level ?? props.skill.proficiencyLevel ?? 1)
    const parts = []

    // 1. 基础伤害（从 skill.damage 字段获取）
    const baseDamage = Number(props.skill.damage || 0)
    if (baseDamage > 0) {
      parts.push(`基础(${baseDamage})`)
    }

    // 2. 熟练度伤害
    const proficiencyEffect = props.skill.proficiencyEffect || props.skill.proficiency?.effect
    if (proficiencyEffect && proficiencyEffect.base !== undefined) {
      const base = Number(proficiencyEffect.base || 0)
      const increment = Number(proficiencyEffect.increment || 0)
      const profDamage = Math.floor(base + increment * (skillLevel - 1))
      if (profDamage > 0) {
        parts.push(`熟练度(${profDamage})`)
      }
    }

    // 3. 攻击力加成（支持 player.attack * 系数 和局部变量 attack * 系数 两种模式）
    const hasAttackRef = /player\??\.attack(?![A-Za-z])/.test(calcStr)
    let attackCoeff = 0
    if (hasAttackRef) {
      // 匹配 attack * 系数（同时覆盖 player.attack * 0.3 和局部变量 attack * 0.3）
      const attackMultMatch = calcStr.match(/attack\s*\*\s*([\d.]+)/)
      if (attackMultMatch) {
        attackCoeff = parseFloat(attackMultMatch[1])
      }
    }
    if (attackCoeff > 0) {
      const attack = Number(playerForCalc.attack || 0)
      const attackDamage = Math.floor(attack * attackCoeff)
      parts.push(`攻击力(${attackDamage})`)
    }

    // 4. 智力加成（支持 intelligence * 系数 和 Number(...intelligence...) 两种格式）
    let intCoeff = 0
    const intMultMatch = calcStr.match(/intelligence\s*\*\s*([\d.]+)/)
    if (intMultMatch) {
      intCoeff = parseFloat(intMultMatch[1])
    } else if (/Number\([^)]*intelligence[^)]*\)/.test(calcStr)) {
      intCoeff = 1
    }
    if (intCoeff > 0) {
      const intelligence = Number(playerForCalc.stats?.intelligence || 0)
      const intDamage = Math.floor(intelligence * intCoeff)
      parts.push(intCoeff === 1 ? `智力(${intDamage})` : `智力*${intCoeff}(${intDamage})`)
    }

    // 5. 力量加成（优先读取技能声明的 strengthCoeff 方法，再回退正则匹配）
    let strCoeff = 0
    if (typeof props.skill.strengthCoeff === 'function') {
      strCoeff = Number(props.skill.strengthCoeff(skillLevel)) || 0
    }
    if (strCoeff <= 0) {
      const strMultMatch = calcStr.match(/strength\s*\*\s*([\d.]+)/)
      if (strMultMatch) {
        strCoeff = parseFloat(strMultMatch[1])
      } else if (/Number\([^)]*strength[^)]*\)/.test(calcStr)) {
        strCoeff = 1
      }
    }
    if (strCoeff > 0) {
      const strength = Number(playerForCalc.stats?.strength || 0)
      const strDamage = Math.floor(strength * strCoeff)
      parts.push(strCoeff === 1 ? `力量(${strDamage})` : `力量*${strCoeff}(${strDamage})`)
    }

    // 6. 体质加成（支持 stamina 和 constitution）
    let conCoeff = 0
    const conMultMatch = calcStr.match(/(?:stamina|constitution)\s*\*\s*([\d.]+)/)
    if (conMultMatch) {
      conCoeff = parseFloat(conMultMatch[1])
    } else if (/Number\([^)]*(?:stamina|constitution)[^)]*\)/.test(calcStr)) {
      conCoeff = 1
    }
    if (conCoeff > 0) {
      const constitution = Number(playerForCalc.stats?.constitution || playerForCalc.stats?.stamina || 0)
      const conDamage = Math.floor(constitution * conCoeff)
      parts.push(conCoeff === 1 ? `体质(${conDamage})` : `体质*${conCoeff}(${conDamage})`)
    }

    // 7. 敏捷加成（支持 dexterity 和 agility）
    let dexCoeff = 0
    const dexMultMatch = calcStr.match(/(?:dexterity|agility)\s*\*\s*([\d.]+)/)
    if (dexMultMatch) {
      dexCoeff = parseFloat(dexMultMatch[1])
    } else if (/Number\([^)]*(?:dexterity|agility)[^)]*\)/.test(calcStr)) {
      dexCoeff = 1
    }
    if (dexCoeff > 0) {
      const dexterity = Number(playerForCalc.stats?.dexterity || playerForCalc.stats?.agility || 0)
      const dexDamage = Math.floor(dexterity * dexCoeff)
      parts.push(dexCoeff === 1 ? `敏捷(${dexDamage})` : `敏捷*${dexCoeff}(${dexDamage})`)
    }

    // 8. MP加成（用于背水一击等技能）
    const mpMatch = calcStr.match(/maxMana\s*\*\s*([\d.]+)/)
    if (mpMatch) {
      const coeff = parseFloat(mpMatch[1])
      const maxMana = Number(playerForCalc.maxMana || 0)
      const mpDamage = Math.floor(maxMana * coeff)
      parts.push(`MP*${coeff}(${mpDamage})`)
    }

    return parts.length > 0 ? parts.join('+') : '无法解析'
  } catch (error) {
    console.error('解析伤害计算公式出错:', error)
    return '无法解析'
  }
})

/**
 * 获取技能的伤害倍率显示文本
 * 仅对拥有 getDamageMultiplier 方法的技能生效（如暗杀）
 * 直接从原始 SKILL_CONFIG 查找技能定义，避免 Pinia 响应式包装导致方法丢失
 * @returns {string} 倍率描述文本，无倍率方法或倍率为1时返回空字符串
 */
const skillDamageMultiplierText = computed(() => {
  const skill = props.skill
  if (!skill) {
    return ''
  }

  // 从原始 SKILL_CONFIG 中查找技能定义，获取可能被 Pinia store 丢失的方法
  // 优先使用技能自身职业（支持底部技能栏跨职业技能），回退到当前玩家职业
  const className = (skill.class ? String(skill.class).toLowerCase() : '') || props.playerClass || ''
  const skillKey = skill.key || ''
  const originalSkill = className && skillKey ? getOriginalSkill(className, skillKey) : null

  // 合并 props.skill 和原始技能定义上的方法
  const getDamageMultiplier = originalSkill?.getDamageMultiplier || skill.getDamageMultiplier
  const getCriticalChance = originalSkill?.getCriticalChance || skill.getCriticalChance

  if (typeof getDamageMultiplier !== 'function') {
    return ''
  }

  try {
    const level = Number(skill.level ?? skill.proficiencyLevel ?? 1)

    // 使用 originalSkill 作为 this 上下文调用（方法内部可能通过 this 调用 getCriticalTable）
    const ctx = originalSkill || skill
    const multiplier = getDamageMultiplier.call(ctx, level)

    // 倍率为1或无效时不显示
    if (!Number.isFinite(multiplier) || multiplier <= 1) {
      return ''
    }

    let text = `伤害倍率: ×${multiplier}`

    // 如果有触发概率方法（如暗杀的 getCriticalChance），附带显示
    if (typeof getCriticalChance === 'function') {
      const chance = getCriticalChance.call(ctx, level)
      if (Number.isFinite(chance)) {
        text += ` (触发概率: ${Math.round(chance * 100)}%)`
      }
    }

    return text
  } catch (error) {
    console.error('[SkillTooltip] 获取技能伤害倍率出错:', error)
    return ''
  }
})

const getSkillLabel = skillKey => {
  const normalizedKey = String(skillKey || '').trim()
  if (!normalizedKey) {
    return ''
  }
  const skillFromPlayer = props.player?.skills?.[normalizedKey]
  const name = skillFromPlayer?.name ? String(skillFromPlayer.name) : ''
  return name ? `${name}（${normalizedKey}）` : normalizedKey
}

const parseUnlockConditionRequirements = unlockCondition => {
  const requirements = {
    levels: [],
    prerequisiteSkills: new Map()
  }

  if (typeof unlockCondition !== 'function') {
    return requirements
  }

  let raw = ''
  try {
    raw = unlockCondition.toString()
  } catch (error) {
    console.error('解析解锁条件出错:', error)
    return requirements
  }

  const levelRegex = /player\.level\s*>=\s*(\d+)/g
  for (const match of raw.matchAll(levelRegex)) {
    const value = Number(match?.[1])
    if (Number.isFinite(value) && value > 0) {
      requirements.levels.push(value)
    }
  }

  const prerequisiteRegex =
    /player\.skills\?\.\s*([A-Za-z0-9_]+)\s*\?\.\s*(?:proficiencyLevel|level)\s*>=\s*(\d+)/g
  for (const match of raw.matchAll(prerequisiteRegex)) {
    const key = String(match?.[1] ?? '').trim()
    const level = Number(match?.[2])
    if (!key || !Number.isFinite(level) || level <= 0) {
      continue
    }
    const existing = requirements.prerequisiteSkills.get(key) || 0
    requirements.prerequisiteSkills.set(key, Math.max(existing, level))
  }

  return requirements
}

const unlockRequirementStates = computed(() => {
  if (!props.skill) {
    return []
  }

  const lines = []
  const playerSkills = props.player?.skills || {}

  const parsed = parseUnlockConditionRequirements(props.skill.unlockCondition)
  const parsedLevelCandidates = parsed.levels.filter(value => Number.isFinite(value) && value > 1)

  const baseUnlockLevel = Number(props.skill.unlockLevel ?? 0)
  const allLevelCandidates = [
    Number.isFinite(baseUnlockLevel) && baseUnlockLevel > 1 ? baseUnlockLevel : null,
    ...parsedLevelCandidates
  ].filter(value => Number.isFinite(value) && value > 1)

  if (allLevelCandidates.length) {
    const requiredLevel = Math.max(...allLevelCandidates)
    lines.push({
      text: `角色等级达到 ${requiredLevel} 级`,
      isMet: Number(props.player?.level ?? 0) >= requiredLevel
    })
  }

  for (const [key, level] of parsed.prerequisiteSkills.entries()) {
    const currentLevel = Number(playerSkills?.[key]?.proficiencyLevel ?? playerSkills?.[key]?.level ?? 0) || 0
    lines.push({
      text: `前置技能：${getSkillLabel(key)} 熟练度达到 ${level} 级`,
      isMet: currentLevel >= level
    })
  }

  const hasAnySpecificRequirement = lines.length > 0
  const hasUnlockCondition = typeof props.skill.unlockCondition === 'function'
  if (!hasAnySpecificRequirement && hasUnlockCondition) {
    lines.push({
      text: '需要满足特定解锁条件',
      isMet: SkillUnlockChecker.checkUnlockCondition(props.skill, props.player || {})
    })
  }

  return lines
})

const buffEffectLines = computed(() => {
  if (!props.skill || !effectiveClass.value || !props.skill.key) {
    return []
  }

  // 使用 skillCalcPlayer 获取包含 BUFF 属性加成的玩家数据
  // 这样守护使者的技能会使用正确的智力值计算效果
  const playerForCalc = skillCalcPlayer.value || props.player

  // 使用 effectiveClass（优先技能自身职业），确保跨职业技能也能查找到正确的 BUFF 效果
  const html = SkillBuffCalculator.getBuffEffectText(effectiveClass.value, props.skill.key, props.skill, playerForCalc)
  if (!html) {
    return []
  }
  // 解析每个 div 的内联样式和文本内容，保留颜色等样式信息
  return html
    .split(/<\/div>/)
    .map(segment => {
      const styleMatch = segment.match(/style="([^"]+)"/)
      const textMatch = segment.match(/>([^<]+)$/)
      const text = textMatch ? textMatch[1].trim() : ''
      if (!text) {
        return null
      }
      return {
        text,
        style: styleMatch ? styleMatch[1] : ''
      }
    })
    .filter(Boolean)
})

const actualDotDamage = computed(() => {
  if (!props.skill) {
    return 0
  }

  const calculator =
    typeof props.skill.dotDamageCalculation === 'function'
      ? props.skill.dotDamageCalculation
      : typeof props.skill.calculateDotDamage === 'function'
        ? props.skill.calculateDotDamage
        : typeof props.skill.damageCalculation === 'function'
          ? props.skill.damageCalculation
          : typeof props.skill.calculateDamage === 'function'
            ? props.skill.calculateDamage
            : null

  const playerForCalc = skillCalcPlayer.value
  let baseDamage = 0

  if (calculator && playerForCalc) {
    try {
      const attempts = [
        [playerForCalc, props.skill.level || 1],
        [playerForCalc, props.skill.level || 1, null],
        [playerForCalc, props.skill.level || 1, null, null], // 4个参数，用于需要更多参数的技能
        [playerForCalc, props.skill]
      ]

      for (const args of attempts) {
        const result = calculator.call(props.skill, ...args)
        const numeric = Number(result)
        if (Number.isFinite(numeric)) {
          baseDamage = numeric
          break
        }
      }
    } catch (error) {
      console.error('DOT伤害计算出错:', error)
    }
  }

  // 如果计算器没有返回有效值，使用基础伤害 + 熟练度加成
  if (baseDamage === 0) {
    const dotBase = Number(props.skill.dotDamage || props.skill.damage || 0)
    if (dotBase > 0) {
      const proficiencyBonus = calculateDotProficiencyBonus(props.skill)
      baseDamage = dotBase + proficiencyBonus
    }
  }

  // 应用技能伤害百分比加成（来自套装、装备等）
  const bonus = skillDamageBonus.value
  if (bonus > 0) {
    baseDamage *= 1 + bonus / 100
  }

  // 应用武器唤醒技能伤害加成（只对一转、二转技能生效）
  const awakeningBonus = weaponAwakeningDamageBonus.value
  if (awakeningBonus > 0) {
    baseDamage *= 1 + awakeningBonus / 100
  }

  return Math.floor(baseDamage)
})

const dotDamageFormula = computed(() => {
  if (!props.skill?.dotDamageCalculation && !props.skill?.damageCalculation && typeof props.skill?.calculateDotDamage !== 'function' && typeof props.skill?.calculateDamage !== 'function') {
    return '无法解析'
  }

  const playerForCalc = skillCalcPlayer.value
  if (!playerForCalc) {
    return '无法解析'
  }

  try {
    const calculator =
      typeof props.skill.dotDamageCalculation === 'function'
        ? props.skill.dotDamageCalculation
        : typeof props.skill.calculateDotDamage === 'function'
          ? props.skill.calculateDotDamage
          : typeof props.skill.damageCalculation === 'function'
            ? props.skill.damageCalculation
            : props.skill.calculateDamage
    const calcStr = calculator.toString()
    const skillLevel = Number(props.skill.level ?? props.skill.proficiencyLevel ?? 1)
    const parts = []

    // 1. 基础伤害（优先 dotDamage，回退到 damage）
    const dotBase = Number(props.skill.dotDamage || props.skill.damage || 0)
    if (dotBase > 0) {
      parts.push(`基础(${dotBase})`)
    }

    // 2. 熟练度伤害
    const proficiencyEffect = props.skill.proficiencyEffect || props.skill.proficiency?.effect
    if (proficiencyEffect && proficiencyEffect.dotBase !== undefined) {
      const base = Number(proficiencyEffect.dotBase || 0)
      const increment = Number(proficiencyEffect.dotIncrement || 0)
      const profDamage = Math.floor(base + increment * (skillLevel - 1))
      if (profDamage > 0) {
        parts.push(`熟练度(${profDamage})`)
      }
    }

    // 3. 攻击力加成（支持 player.attack * 系数 和局部变量 attack * 系数 两种模式）
    const hasAttackRef = /player\??\.attack(?![A-Za-z])/.test(calcStr)
    let attackCoeff = 0
    if (hasAttackRef) {
      const attackMultMatch = calcStr.match(/attack\s*\*\s*([\d.]+)/)
      if (attackMultMatch) {
        attackCoeff = parseFloat(attackMultMatch[1])
      }
    }
    if (attackCoeff > 0) {
      const attack = Number(playerForCalc.attack || 0)
      parts.push(`攻击力(${Math.floor(attack * attackCoeff)})`)
    }

    // 4. 智力加成
    let intCoeff = 0
    const intMultMatch = calcStr.match(/intelligence\s*\*\s*([\d.]+)/)
    if (intMultMatch) {
      intCoeff = parseFloat(intMultMatch[1])
    } else if (/Number\([^)]*intelligence[^)]*\)/.test(calcStr)) {
      intCoeff = 1
    }
    if (intCoeff > 0) {
      const intelligence = Number(playerForCalc.stats?.intelligence || 0)
      parts.push(intCoeff === 1 ? `智力(${Math.floor(intelligence)})` : `智力*${intCoeff}(${Math.floor(intelligence * intCoeff)})`)
    }

    // 5. 力量加成（优先读取技能声明的 strengthCoeff 方法，再回退正则匹配）
    let strCoeff = 0
    if (typeof props.skill.strengthCoeff === 'function') {
      strCoeff = Number(props.skill.strengthCoeff(skillLevel)) || 0
    }
    if (strCoeff <= 0) {
      const strMultMatch = calcStr.match(/strength\s*\*\s*([\d.]+)/)
      if (strMultMatch) {
        strCoeff = parseFloat(strMultMatch[1])
      } else if (/Number\([^)]*strength[^)]*\)/.test(calcStr)) {
        strCoeff = 1
      }
    }
    if (strCoeff > 0) {
      const strength = Number(playerForCalc.stats?.strength || 0)
      parts.push(strCoeff === 1 ? `力量(${Math.floor(strength)})` : `力量*${strCoeff}(${Math.floor(strength * strCoeff)})`)
    }

    // 6. 体质加成
    let conCoeff = 0
    const conMultMatch = calcStr.match(/(?:stamina|constitution)\s*\*\s*([\d.]+)/)
    if (conMultMatch) {
      conCoeff = parseFloat(conMultMatch[1])
    } else if (/Number\([^)]*(?:stamina|constitution)[^)]*\)/.test(calcStr)) {
      conCoeff = 1
    }
    if (conCoeff > 0) {
      const constitution = Number(playerForCalc.stats?.constitution || playerForCalc.stats?.stamina || 0)
      parts.push(conCoeff === 1 ? `体质(${Math.floor(constitution)})` : `体质*${conCoeff}(${Math.floor(constitution * conCoeff)})`)
    }

    // 7. 敏捷加成
    let dexCoeff = 0
    const dexMultMatch = calcStr.match(/(?:dexterity|agility)\s*\*\s*([\d.]+)/)
    if (dexMultMatch) {
      dexCoeff = parseFloat(dexMultMatch[1])
    } else if (/Number\([^)]*(?:dexterity|agility)[^)]*\)/.test(calcStr)) {
      dexCoeff = 1
    }
    if (dexCoeff > 0) {
      const dexterity = Number(playerForCalc.stats?.dexterity || playerForCalc.stats?.agility || 0)
      parts.push(dexCoeff === 1 ? `敏捷(${Math.floor(dexterity)})` : `敏捷*${dexCoeff}(${Math.floor(dexterity * dexCoeff)})`)
    }

    return parts.length > 0 ? parts.join('+') : '无法解析'
  } catch (error) {
    console.error('解析DOT伤害计算公式出错:', error)
    return '无法解析'
  }
})

const actualHeal = computed(() => {
  if (!props.skill) {
    return 0
  }

  const calculator =
    typeof props.skill.healingCalculation === 'function'
      ? props.skill.healingCalculation
      : typeof props.skill.calculateHealing === 'function'
        ? props.skill.calculateHealing
        : null

  // 使用 skillCalcPlayer 获取包含 BUFF 属性加成的玩家数据
  const playerForCalc = skillCalcPlayer.value || props.player
  // 使用与实际技能相同的等级获取逻辑
  const skillLevel = Number(props.skill.level ?? props.skill.proficiencyLevel ?? 1)

  let healAmount = 0

  if (calculator && playerForCalc) {
    try {
      const primary = calculator(playerForCalc, skillLevel)
      const primaryNumeric = Number(primary)
      if (Number.isFinite(primaryNumeric)) {
        healAmount = primaryNumeric
      } else {
        const secondary = calculator(playerForCalc, props.skill)
        const secondaryNumeric = Number(secondary)
        if (Number.isFinite(secondaryNumeric)) {
          healAmount = secondaryNumeric
        }
      }
    } catch (error) {
      console.error('治疗计算出错:', error)
      return 0
    }
  }

  if (healAmount === 0) {
    if (!props.skill.damage && !props.skill.heal) {
      return 0
    }

    const baseHeal = props.skill.heal || props.skill.damage
    const proficiencyBonus = calculateHealProficiencyBonus(props.skill)

    const effect = props.skill.proficiencyEffect || props.skill.proficiency?.effect
    const safeBase = Number(effect?.base)
    const safeBaseHeal = Number(baseHeal)

    if (Number.isFinite(safeBaseHeal) && safeBaseHeal === safeBase) {
      healAmount = baseHeal + proficiencyBonus
    } else {
      healAmount = proficiencyBonus
    }
  }

  // 应用治疗加成百分比（与实际使用技能时的逻辑一致）
  const healBonus = Number(playerForCalc?.healPercent || 0)
  if (Number.isFinite(healBonus) && healBonus !== 0) {
    const ratio = healBonus > 1 ? healBonus / 100 : healBonus
    healAmount *= 1 + ratio
  }

  return Math.floor(healAmount)
})

/**
 * 获取治疗技能的详细公式分解
 * @returns {Array} 公式分解数组
 */
const healFormulaLines = computed(() => {
  const lines = []
  
  if (!props.skill) {
    return lines
  }

  const calculator =
    typeof props.skill.healingCalculation === 'function'
      ? props.skill.healingCalculation
      : typeof props.skill.calculateHealing === 'function'
        ? props.skill.calculateHealing
        : null

  if (!calculator) {
    return lines
  }

  // 使用 skillCalcPlayer 获取包含 BUFF 属性加成的玩家数据
  const playerForCalc = skillCalcPlayer.value || props.player
  // 使用与实际技能相同的等级获取逻辑
  const skillLevel = Number(props.skill.level ?? props.skill.proficiencyLevel ?? 1)

  // 获取技能的熟练度效果配置
  const proficiencyEffect = props.skill.proficiencyEffect || props.skill.proficiency?.effect
  const baseHeal = Number(proficiencyEffect?.base || props.skill.heal || 0)
  const increment = Number(proficiencyEffect?.increment || 0)

  // 计算基础治疗量（熟练度加成）
  const baseWithProficiency = baseHeal + increment * (skillLevel - 1)
  
  // 获取玩家智力
  const intelligence = Number(playerForCalc?.stats?.intelligence || 0)

  // 尝试从计算函数中提取智力加成系数
  // 支持多种格式：intelligence * 8.18, player?.stats?.intelligence * 8.18, (player?.stats?.intelligence || 0) * 8.18
  let intCoefficient = 0
  try {
    const calcStr = calculator.toString()
    // 匹配多种智力乘法格式
    // 格式1: intelligence * 8.18 (系数在后)
    // 格式2: 8.18 * intelligence (系数在前)
    const patterns = [
      // intelligence * 系数 (系数在后)
      /intelligence[^*]*\*\s*([\d.]+)/i,
      // 系数 * intelligence (系数在前)
      /([\d.]+)\s*\*\s*[^i]*intelligence/i
    ]
    for (const pattern of patterns) {
      const intMatch = calcStr.match(pattern)
      if (intMatch) {
        intCoefficient = parseFloat(intMatch[1])
        break
      }
    }
  } catch (e) {
    // 忽略解析错误
  }

  // 构建公式行
  lines.push(`基础治疗: ${baseHeal}`)
  if (increment > 0 && skillLevel > 1) {
    lines.push(`熟练度加成: +${increment * (skillLevel - 1)} (等级${skillLevel})`)
  }
  if (intCoefficient > 0 && intelligence > 0) {
    const intBonus = Math.floor(intelligence * intCoefficient)
    lines.push(`智力加成: +${intBonus} (智力${intelligence} × ${intCoefficient})`)
  }

  // 计算基础治疗量（不含治疗加成百分比）
  const baseTotal = baseHeal + (increment > 0 && skillLevel > 1 ? increment * (skillLevel - 1) : 0) +
    (intCoefficient > 0 && intelligence > 0 ? Math.floor(intelligence * intCoefficient) : 0)

  // 显示治疗加成百分比
  const healBonus = Number(playerForCalc?.healPercent || 0)
  if (Number.isFinite(healBonus) && healBonus !== 0) {
    const ratio = healBonus > 1 ? healBonus / 100 : healBonus
    const bonusAmount = Math.floor(baseTotal * ratio)
    lines.push(`治疗加成: +${bonusAmount} (${healBonus > 1 ? healBonus + '%' : (ratio * 100).toFixed(1) + '%'})`)
  }

  lines.push(`总治疗量: ${actualHeal.value}`)

  return lines
})

const healFormula = computed(() => {
  const calculator =
    typeof props.skill?.healingCalculation === 'function'
      ? props.skill.healingCalculation
      : typeof props.skill?.calculateHealing === 'function'
        ? props.skill.calculateHealing
        : null

  if (!calculator) {
    return '无法解析'
  }

  try {
    const calcStr = calculator.toString()
    let formula = '基础治疗'

    if (props.skill.proficiencyEffect && props.skill.proficiencyEffect.increment !== undefined) {
      formula += ' + 熟练度加成'
    }

    if (calcStr.includes('player.stats.intelligence') || calcStr.includes('intelligence')) {
      formula += ' + 智力加成'
    }

    return formula
  } catch (error) {
    console.error('解析治疗计算公式出错:', error)
    return '无法解析'
  }
})

const getSkillTypeClass = type => {
  const t = String(type || '').toLowerCase()
  if (['single', 'aoe', 'dot', 'debuff'].includes(t)) {
    return 'skill-type-damage'
  }
  if (t === 'buff') {
    return 'skill-type-buff'
  }
  if (t === 'heal') {
    return 'skill-type-heal'
  }
  return ''
}

/**
 * 获取DEBUFF概率文本
 * @param {Object} skill - 技能对象
 * @returns {string} 概率文本
 */
const getDebuffChanceText = skill => {
  // 优先使用计算方法
  if (typeof skill.calculateDebuffChance === 'function') {
    const level = Number(skill.level || skill.proficiencyLevel || 1)
    const chance = skill.calculateDebuffChance(level)
    return `${chance}%`
  }
  // 使用配置中的概率
  const chance = Number(skill.debuff?.chance || 0)
  return `${chance}%`
}

/**
 * 获取碎甲防御力降低百分比
 * @param {Object} skill - 技能对象
 * @returns {string} 百分比文本
 */
const getArmorBreakDefenseReduction = skill => {
  const level = Number(skill.level || skill.proficiencyLevel || 1)
  // 使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.defenseReduction || (2 + (level - 1) * 2)
  }
  // 默认计算: 1级2%，每级增加2%
  return 2 + (level - 1) * 2
}

/**
 * 获取碎甲承受伤害增加百分比
 * @param {Object} skill - 技能对象
 * @returns {string} 百分比文本
 */
const getArmorBreakDamageIncrease = skill => {
  const level = Number(skill.level || skill.proficiencyLevel || 1)
  // 使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.damageIncrease || (1 + (level - 1) * 1)
  }
  // 默认计算: 1级1%，每级增加1%
  return 1 + (level - 1) * 1
}

/**
 * 获取碎甲持续时间
 * @param {Object} skill - 技能对象
 * @returns {string} 持续时间（秒）
 */
const getArmorBreakDuration = skill => {
  const level = Number(skill.level || skill.proficiencyLevel || 1)
  // 使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.duration || 20
  }
  // 默认20秒
  return 20
}

/**
 * 获取脆弱烙印承受伤害增加百分比（弱点射击）
 * 1级5%，5级15%，每级+2.5%
 * @param {Object} skill - 技能对象
 * @returns {number} 伤害增加百分比
 */
const getDamageVulnerabilityValue = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.damageIncrease || 5
  }
  // 使用 debuff.effect.getValue 方法
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  // 默认计算: 1级5%，每级增加2.5%
  return 5 + 2.5 * (level - 1)
}

/**
 * 获取破劲印记持续时间
 * @param {Object} skill - 技能对象
 * @returns {number} 持续时间（秒）
 */
const getDamageVulnerabilityDuration = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.duration || 15
  }
  // 使用 debuff.effect.baseDuration
  return skill.debuff?.effect?.baseDuration || skill.duration || 15
}

/**
 * 获取破劲印记的暴击伤害加成百分比（格斗宗师专属）
 * 1级5%，5级25%，每级+5%
 * @param {Object} skill - 技能对象
 * @returns {number} 暴击伤害加成百分比
 */
const getDamageVulnerabilityCritBonus = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    const effect = skill.calculateDebuffEffect(level, props.player)
    return effect?.critDamageBonus || 0
  }
  // 使用 debuff.effect.getCritDamageBonus 方法
  if (typeof skill.debuff?.effect?.getCritDamageBonus === 'function') {
    return skill.debuff.effect.getCritDamageBonus(level)
  }
  // 无暴击伤害加成
  return 0
}

/**
 * 获取虚弱印记的治疗效果加成百分比（炽天使专属）
 * 1级5%，5级25%，每级+5%
 * @param {Object} skill - 技能对象
 * @returns {number} 治疗效果加成百分比
 */
const getDamageVulnerabilityHealingBonus = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 使用 debuff.effect.getHealingBonus 方法
  if (typeof skill.debuff?.effect?.getHealingBonus === 'function') {
    return skill.debuff.effect.getHealingBonus(level)
  }
  // 无治疗加成
  return 0
}

/**
 * 获取风暴印记的命中率加成百分比（风暴行者专属）
 * 已废弃：风暴印记不再提供命中率加成，固定返回0
 * @param {Object} skill - 技能对象
 * @returns {number} 命中率加成百分比（固定0）
 */
const getDamageVulnerabilityHitRateBonus = skill => {
  // 风暴印记不再提供命中率加成
  return 0
}

/**
 * 根据技能ID获取印记DEBUFF对应的职业名称
 * @param {Object} skill - 技能对象
 * @returns {string} 职业名称
 */
const getDebuffClassName = skill => {
  const id = skill?.id || ''
  if (id.startsWith('nature_messenger')) return '炽天使'
  if (id.startsWith('combat_master')) return '格斗宗师'
  if (id.startsWith('joker_emperor')) return '暗夜主宰'
  if (id.startsWith('fierce_shooter')) return '爆裂射手'
  if (id.startsWith('storm_walker')) return '风暴行者'
  if (id.startsWith('holy_knight')) return '圣殿骑士'
  return '未知职业'
}

/**
 * 获取命中率降低百分比（夜幕降临等技能）
 * @param {Object} skill - 技能对象
 * @returns {number} 命中率降低百分比
 */
const getHitRateReductionValue = skill => {
  // 与 AutoBattleService.refactored.js 保持一致的等级获取优先级
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    return skill.calculateDebuffEffect(level)
  }
  // 使用 debuff.effect.getValue 方法
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  // 默认计算: 1级5%，每级增加5%
  const baseEffect = Number(skill.proficiency?.effect?.debuffEffectBase || 5)
  const increment = Number(skill.proficiency?.effect?.debuffEffectIncrement || 5)
  return Math.min(baseEffect + increment * (level - 1), 50)
}

/**
 * 获取攻击速度降低百分比（狂风怒吼等技能）
 * @param {Object} skill - 技能对象
 * @returns {number} 攻击速度降低百分比
 */
const getAttackSpeedReductionValue = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    return skill.calculateDebuffEffect(level)
  }
  // 使用 debuff.effect.getValue 方法
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  // 默认计算: 1级3%，每级增加3%
  const baseEffect = Number(skill.proficiency?.effect?.debuffEffectBase || 3)
  const increment = Number(skill.proficiency?.effect?.debuffEffectIncrement || 3)
  return Math.min(baseEffect + increment * (level - 1), 30)
}

/**
 * 获取攻击速度降低DEBUFF持续时间（狂风怒吼等技能）
 * @param {Object} skill - 技能对象
 * @returns {string} 持续时间描述
 */
const getAttackSpeedReductionDuration = skill => {
  // 如果有计算持续时间的方法
  if (typeof skill.calculateDebuffDuration === 'function') {
    // 需要玩家数据，这里返回基础持续时间 + 描述
    const baseDuration = skill.debuff?.effect?.baseDuration || 3
    const ratio = skill.debuff?.effect?.intToDurationRatio || 10
    return `${baseDuration}（每${ratio}点智力+1秒）`
  }
  // 返回固定持续时间
  return skill.debuff?.effect?.duration || skill.duration || 3
}

/**
 * 获取暴击伤害降低百分比（风雷聚集等技能）
 * @param {Object} skill - 技能对象
 * @returns {number} 暴击伤害降低百分比
 */
const getCritDamageReductionValue = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 优先使用计算方法
  if (typeof skill.calculateDebuffEffect === 'function') {
    return skill.calculateDebuffEffect(level)
  }
  // 使用 debuff.effect.getValue 方法
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  // 默认计算: 1级5%，每级增加5%
  const baseEffect = Number(skill.proficiency?.effect?.debuffEffectBase || 5)
  const increment = Number(skill.proficiency?.effect?.debuffEffectIncrement || 5)
  return Math.min(baseEffect + increment * (level - 1), 50)
}

/**
 * 获取攻击力降低百分比（毒箭等技能）
 * @param {Object} skill - 技能对象
 * @returns {number} 攻击力降低百分比
 */
const getAttackReductionValue = skill => {
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  // 使用 debuff.effect.getValue 方法
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  // 默认计算: 1级1.5%，每级增加1.5%
  const baseEffect = Number(skill.proficiency?.effect?.debuffEffectBase || 1.5)
  const increment = Number(skill.proficiency?.effect?.debuffEffectIncrement || 1.5)
  return Math.min(baseEffect + increment * (level - 1), 15)
}

/**
 * 获取意识混乱的攻击力降低百分比（意识崩塌技能）
 * 优先使用 calculateDebuffEffect 方法获取动态值，否则使用 effect.getValue 或默认30%
 * @param {Object} skill - 技能对象
 * @returns {number} 攻击力降低百分比
 */
const getMindConfusionAttackReduction = skill => {
  // 优先使用 calculateDebuffEffect 方法（可动态计算EX加成）
  if (typeof skill.calculateDebuffEffect === 'function') {
    const level = Number(skill.level || skill.proficiencyLevel || 1)
    const effect = skill.calculateDebuffEffect(level, props.player)
    if (effect?.attackReduction !== undefined) {
      return effect.attackReduction
    }
  }
  // 使用 debuff.effect.getValue 方法
  const level = Number(skill.proficiencyLevel ?? skill.level ?? 1)
  if (typeof skill.debuff?.effect?.getValue === 'function') {
    return skill.debuff.effect.getValue(level)
  }
  return 30
}

/**
 * 获取意识混乱的受到伤害增加百分比（意识崩塌技能）
 * 优先使用 calculateDebuffEffect 方法获取动态值，否则默认20%
 * @param {Object} skill - 技能对象
 * @returns {number} 受到伤害增加百分比
 */
const getMindConfusionDamageIncrease = skill => {
  if (typeof skill.calculateDebuffEffect === 'function') {
    const level = Number(skill.level || skill.proficiencyLevel || 1)
    const effect = skill.calculateDebuffEffect(level, props.player)
    if (effect?.damageIncrease !== undefined) {
      return effect.damageIncrease
    }
  }
  return 20
}

/**
 * 获取意识混乱的持续时间（意识崩塌技能）
 * 优先使用 calculateDebuffEffect 动态计算（受EX1影响），否则使用 baseDuration 或 duration
 * @param {Object} skill - 技能对象
 * @returns {number} 持续时间（秒）
 */
const getMindConfusionDuration = skill => {
  if (typeof skill.calculateDebuffEffect === 'function') {
    const level = Number(skill.level || skill.proficiencyLevel || 1)
    const effect = skill.calculateDebuffEffect(level, props.player)
    if (effect?.duration !== undefined) {
      return effect.duration
    }
  }
  return skill.debuff?.effect?.baseDuration || skill.duration || 60
}

// 暴露引用以便外部访问
defineExpose({
  skillTooltipEl
})
</script>

<style scoped>
  .skill-tooltip-fade-enter-active,
  .skill-tooltip-fade-leave-active {
    transition:
      opacity 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
      transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
      filter 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .skill-tooltip-fade-enter-from,
  .skill-tooltip-fade-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    filter: blur(1px);
  }

  .skill-tooltip-fade-enter-to,
  .skill-tooltip-fade-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }

  .skill-tooltip {
    position: fixed;
    background-color: var(--theme-modal-bg);
    border: 1px solid var(--theme-border-strong);
    border-radius: 8px;
    padding: 15px;
    width: min(350px, calc(100vw - 20px));
    max-height: calc(100vh - 20px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 999999; /* 提高z-index确保不会被遮挡 */
    color: var(--theme-text);
    font-size: 14px;
    will-change: opacity, transform, filter;
  }

  /* 非交互模式：不拦截鼠标事件，避免遮挡鼠标导致 mouseleave 闪烁 */
  .skill-tooltip-non-interactive {
    pointer-events: none;
  }

  .skill-tooltip-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--theme-border-strong);
  }

  .skill-tooltip-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    border-radius: 4px;
    border: 1px solid var(--theme-border-strong);
  }

  .skill-tooltip-name {
    font-size: 16px;
    font-weight: bold;
    color: var(--theme-accent);
  }

  .skill-tooltip-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow-y: auto; /* 超出时显示滚动条 */
  }

  .skill-tooltip-section-title {
    font-weight: bold;
    color: var(--theme-accent);
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .skill-tooltip-description {
    color: var(--theme-text);
    line-height: 1.4;
  }

  .skill-tooltip-type,
  .skill-tooltip-cooldown,
  .skill-tooltip-mana,
  .skill-tooltip-proficiency,
  .skill-tooltip-element,
  .skill-tooltip-buff-duration,
  .skill-tooltip-proficiency-effect,
  .skill-tooltip-damage,
  .skill-tooltip-healing,
  .skill-tooltip-effect {
    color: var(--theme-muted);
  }

  .skill-tooltip-subskills {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--theme-border-strong);
  }

  .skill-tooltip-subskill {
    color: var(--theme-accent-strong);
    margin-left: 10px;
    font-size: 13px;
  }

  .skill-tooltip-dot-duration,
  .skill-tooltip-dot-frequency,
  .skill-tooltip-base-dot-damage,
  .skill-tooltip-unlock-level,
  .skill-tooltip-prerequisite,
  .skill-tooltip-formula,
  .skill-tooltip-proficiency-bonus {
    color: var(--theme-muted);
  }

  .skill-tooltip-calculated-dot-damage {
    color: #e74c3c;
  }

  .skill-tooltip-calculated-damage {
    color: #e74c3c;
  }

  /* 伤害倍率区域样式 */
  .skill-tooltip-multiplier {
    margin-top: 4px;
    padding: 4px 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    color: #f39c12;
    font-size: 13px;
  }

  /* 特殊效果样式 */
  .skill-tooltip-special-effect-section {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed var(--theme-border-strong);
  }

  .skill-tooltip-special-effect-desc {
    color: #f39c12;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .skill-tooltip-special-effect-details {
    margin-top: 4px;
  }

  .skill-tooltip-special-effect-detail {
    color: #f1c40f;
    font-size: 12px;
    margin-left: 8px;
    margin-bottom: 2px;
  }

  .skill-damage-bonus-text {
    color: #f39c12;
    font-size: 12px;
    margin-left: 4px;
  }

  .skill-tooltip-calculated-heal {
    color: #2ecc71;
  }

  /* 减益效果样式 */
  .skill-tooltip-debuff-section {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--theme-border-strong);
  }

  .skill-tooltip-debuff-item {
    color: #e74c3c;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .skill-tooltip-debuff-item .debuff-icon {
    margin-right: 4px;
  }

  .skill-tooltip-debuff-item .debuff-detail {
    color: var(--theme-muted);
    font-size: 12px;
    margin-left: 20px;
  }

  /* 双倍惩戒特殊样式 */
  .skill-tooltip-debuff-item.double-judgment-item {
    color: #9b59b6;
  }

  .skill-tooltip-debuff-item.double-judgment-item .debuff-detail {
    color: #c39bd3;
  }

  /* 双倍惩戒效果区域样式 */
  .skill-tooltip-effect-section {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--theme-border-strong);
  }

  .skill-tooltip-effect-item {
    color: #9b59b6;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .skill-tooltip-effect-item .effect-icon {
    margin-right: 4px;
  }

  .skill-tooltip-effect-item .effect-detail {
    color: #c39bd3;
    font-size: 12px;
    margin-left: 20px;
  }

  .skill-tooltip-formula-detail {
    margin-top: 8px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .skill-tooltip-formula-line {
    color: var(--theme-muted);
    font-size: 12px;
    margin-bottom: 2px;
  }

  .skill-tooltip-buff-effect-item {
    margin-bottom: 3px;
    font-size: 13px;
    color: #3498db;
  }

  /* EX加成信息（龟派气功/念气能量弹）：颜色由行内style按解锁状态控制 */
  .skill-tooltip-ex-bonus {
    margin-top: 6px;
  }

  .skill-tooltip-ex-bonus-item {
    margin-bottom: 3px;
    font-size: 13px;
    color: #95a5a6;
  }

  .skill-tooltip-unlock-met {
    color: #2ecc71;
  }

  .skill-tooltip-unlock-unmet {
    color: #e74c3c;
  }

  .skill-type-damage {
    color: #e74c3c !important;
    font-weight: bold;
  }

  .skill-type-buff {
    color: #3498db !important;
    font-weight: bold;
  }

  .skill-type-heal {
    color: #2ecc71 !important;
    font-weight: bold;
  }
</style>
