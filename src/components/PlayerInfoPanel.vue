<template>
  <div class="left-section">
    <!-- 职业头像 -->
    <div class="player-card-area">
    <AttackAnimation
type="player" :is-auto-battling="isActive" :is-hit="isPlayerHit" :is-attacking="isPlayerAttacking"
      :is-using-skill="isPlayerUsingSkill">
      <PlayerStatusCard
:player="player" :player-avatar="playerAvatar" :health-percentage="healthPercentage"
        :mana-percentage="manaPercentage" :exp-percentage="expPercentage" :last-damage="localLastDamage"
        @open-detail="openPlayerDetailModal" @image-error="handleImageError" />
      <!-- 玩家受击特效动画：在AttackAnimation容器内居中显示，受伤位移动画后播放 -->
      <template #damage>
        <HitEffectAnimation
          type="player"
          :damage-type="playerHitEffectDamageType"
          :trigger="playerHitEffectTrigger"
        />
      </template>
    </AttackAnimation>
    <!-- 龙之劲劲力值显示：在玩家头像下方外部从左往右贴合显示 -->
    <DragonForceDisplay :player="player" />
    <!-- 影之怨影怨值显示：暗夜主宰J技能，在玩家头像下方显示影怨值计数 -->
    <ShadowGrudgeDisplay :player="player" />
    <!-- 圣光积累圣光值显示：炽天使J技能，在玩家头像下方显示圣光值计数 -->
    <HolyAccumulationDisplay :player="player" />
    <!-- 风之积累风之值显示：风暴行者J技能，在玩家头像下方显示风之值计数 -->
    <WindAccumulationDisplay :player="player" />
<!-- 裁决积累裁决值显示：圣殿骑士J技能，在玩家头像下方显示裁决值计数 -->
<JudgmentAccumulationDisplay :player="player" />
<!-- 奥术充能值显示：奥术师J技能，在玩家头像下方显示充能值计数 -->
<ArcaneChargeDisplay :player="player" />
<!-- 碎思归墟充能值显示：心灵师J技能，在玩家头像下方显示充能值计数 -->
<MindChargeDisplay :player="player" />
    <!-- 能量反弹BUFF特效：在玩家容器右侧外部对齐居中显示能量墙，BUFF到期后自动移除 -->
    <Transition name="er-fade">
      <EnergyReflectEffect v-if="hasEnergyReflectBuff" />
    </Transition>
    <!-- 念力护盾BUFF特效：能量护盾罩住玩家，BUFF到期后自动移除 -->
    <Transition name="ps-fade">
      <PsychicShieldEffect v-if="hasPsychicShieldBuff" />
    </Transition>
    <!-- 赛乐的祝福BUFF特效：圣光祝福光环环绕玩家头像，BUFF到期后自动移除 -->
    <Transition name="sb-fade">
      <SyleBlessingEffect v-if="hasSyleBlessingBuff" />
    </Transition>
    <!-- 三相之力BUFF特效：三色能量光环环绕玩家头像边框，BUFF到期后自动移除 -->
    <Transition name="tf-fade">
      <TrinityForceEffect v-if="hasTrinityForceBuff" />
    </Transition>
    <!-- 斗志风轮BUFF特效：六叶风轮高速旋转环绕玩家头像，BUFF到期后自动移除 -->
    <Transition name="fsww-fade">
      <FightingSpiritWindWheelEffect v-if="hasFightingSpiritWindWheelBuff" />
    </Transition>
<!-- 治疗术特效：圣光降临治愈目标，一次性播放，动画结束后自动移除 -->
<Transition name="heal-fade">
<HealEffect v-if="showHealEffect" :key="healEffectKey" />
</Transition>
<!-- 全能祝福特效：圣光降临·十能凝聚·祝福绽放·全能护盾·圣光消散，一次性播放 -->
<Transition name="ob-fade">
<OmniBlessingEffect v-if="showOmniBlessingEffect" :key="omniBlessingEffectKey" />
</Transition>
<!-- 拳术领悟BUFF特效：拳劲光环·四色能量环·拳意核心·速度螺旋，BUFF持续期间一直显示 -->
<Transition name="km-fade">
<KnuckleMasteryEffect v-if="hasKnuckleMasteryBuff" />
</Transition>
<!-- 叙里的祝福BUFF特效：技师觉醒·四维凝聚·祝福绽放·不败护体，BUFF持续期间一直显示 -->
<Transition name="xb-fade">
<XuliBlessingEffect v-if="hasXuliBlessingBuff" />
</Transition>
<!-- 艾梨芙的祝福BUFF特效：游侠祝福光环环绕玩家头像，BUFF到期后自动移除 -->
<Transition name="eb-fade">
<EliffBlessingEffect v-if="hasEliffBlessingBuff" />
</Transition>
<!-- 自然领悟BUFF特效：自然能量光环·叶片环绕·魔防护盾·感知风线，BUFF持续期间一直显示 -->
<Transition name="ni-fade">
<NatureInsightEffect v-if="hasNatureInsightBuff" />
</Transition>
<!-- 致命射击BUFF特效：暴击准星·致命能量环·锐利核心·致命火花，BUFF持续期间一直显示 -->
<Transition name="ds-fade">
<DeadlyShotEffect v-if="hasDeadlyShotBuff" />
</Transition>
<!-- 席瑞儿.安得利尔的祝福BUFF特效：刀锋觉醒·双剑交汇·攻守一体·大师意志，BUFF持续期间一直显示 -->
<Transition name="cb-fade">
<CorelBlessingEffect v-if="hasCorelBlessingBuff" />
</Transition>
<!-- 狂暴BUFF特效：嗜血觉醒·狂怒裂破·破甲碎裂·烈焰攻心，BUFF持续期间一直显示 -->
<Transition name="bk-fade">
<BerserkEffect v-if="hasBerserkBuff" />
</Transition>
<!-- 赫雷森.凯列蓝的祝福BUFF特效：元素狂暴·五元素汇聚·暴击之力·大师意志，BUFF持续期间一直显示 -->
<Transition name="hb-fade">
<HalesenBlessingEffect v-if="hasHalesenBlessingBuff" />
</Transition>
<!-- 爱岚德的祝福BUFF特效：体魄强化·智慧启迪·格挡壁垒·大圆满治愈，BUFF持续期间一直显示 -->
<Transition name="ab-fade">
<AilandeBlessingEffect v-if="hasAilandeBlessingBuff" />
</Transition>
<!-- 卡兰铎的祝福BUFF特效：钢铁壁垒·体魄觉醒·双倍惩戒·大师意志，BUFF持续期间一直显示 -->
<Transition name="kb-fade">
<KalanduoBlessingEffect v-if="hasKalanduoBlessingBuff" />
</Transition>
<!-- 狂暴之心BUFF特效：狂心觉醒·烈焰脉搏·暴击星火·魔力裂流，BUFF持续期间一直显示 -->
<Transition name="fh-fade">
<FrenzyHeartEffect v-if="hasFrenzyHeartBuff" />
</Transition>
<!-- 牺牲BUFF特效：献祭觉醒·血链裂缚·碎盾化刃·攻力飙升，BUFF持续期间一直显示 -->
<Transition name="sc-fade">
<SacrificeEffect v-if="hasSacrificeBuff" />
</Transition>
<!-- 萝丽安的祝福BUFF特效：暗影觉醒·致命暴击·嗜血杀戮·大师传承，BUFF持续期间一直显示 -->
<Transition name="lb-fade">
<LuolianBlessingEffect v-if="hasLuolianBlessingBuff" />
</Transition>
<!-- 天使之翼BUFF特效：翼展庇护·圣盾凝结·防御光环循环，BUFF持续期间一直显示 -->
<Transition name="awb-fade">
<AngelWingsBuffEffect v-if="hasAngelWingsBuff" />
</Transition>
<!-- 圣光庇护BUFF特效：圣光领域·治愈涌泉·守护光环循环，BUFF持续期间一直显示 -->
<Transition name="hsb-fade">
<HolySanctuaryBuffEffect v-if="hasHolySanctuaryBuff" />
</Transition>
<!-- 风暴之力BUFF特效：风暴凝聚·双刀觉醒·风暴之力循环，BUFF持续期间一直显示 -->
<Transition name="spb-fade">
<StormPowerBuffEffect v-if="hasStormPowerBuff" />
</Transition>
<!-- 风暴领域BUFF特效：领域展开·双刀引导·风暴庇护循环，BUFF持续期间一直显示 -->
<Transition name="sdb-fade">
<StormDomainBuffEffect v-if="hasStormDomainBuff" />
</Transition>
<!-- 圣盾觉醒BUFF特效：圣光凝聚·圣盾觉醒·圣盾之力循环，BUFF持续期间一直显示 -->
<Transition name="hsa-fade">
<HolyShieldAwakeningBuffEffect v-if="hasHolyShieldAwakeningBuff" />
</Transition>
<!-- 神圣壁垒BUFF特效：壁垒展开·圣盾引导·神圣庇护循环，BUFF持续期间一直显示 -->
<Transition name="hbb-fade">
<HolyBulwarkBuffEffect v-if="hasHolyBulwarkBuff" />
</Transition>
<!-- 奥术超载BUFF特效：超载觉醒·奥术涌动·法力护盾循环，BUFF持续期间一直显示 -->
<Transition name="aob-fade">
<ArcaneOverloadBuffEffect v-if="hasArcaneOverloadBuff" />
</Transition>
<!-- 奥术共鸣BUFF特效：共鸣展开·奥术谐振·全队庇护循环，BUFF持续期间一直显示 -->
<Transition name="arb-fade">
<ArcaneResonanceBuffEffect v-if="hasArcaneResonanceBuff" />
</Transition>
<!-- 心灵感应BUFF特效：感应展开·心灵谐振·全队庇护循环，BUFF持续期间一直显示 -->
<Transition name="mrb-fade">
<MindResonanceBuffEffect v-if="hasMindResonanceBuff" />
</Transition>
<!-- 心灵觉醒BUFF特效：觉醒展开·心灵涌动·精神护盾循环，BUFF持续期间一直显示 -->
<Transition name="mab-fade">
<MindAwakeningBuffEffect v-if="hasMindAwakeningBuff" />
</Transition>
<!-- 圣光庇护HOT恢复特效：持续治疗·魔力涌泉，HOT每2秒触发恢复时播放，动画结束后自动移除 -->
<Transition name="hot-rec-fade">
<HotRecoveryEffect
  v-if="showHotRecoveryEffect"
  :key="hotRecoveryKey"
  :heal-amount="hotRecoveryHealAmount"
  :mp-amount="hotRecoveryMpAmount"
/>
</Transition>
</div>

    <!-- 物品详情提示框 -->
    <ItemTooltip />
      <!-- 怪物详情提示框 -->
      <MonsterTooltip />

    <!-- 经验动画 -->
    <ExpNumber :global-exp-numbers="uiExpNumbers" />
    <BattleSection
      :current-map="currentMap"
      :active-buffs="activeBuffs"
      :exp-multiplier="expMultiplier"
      :drop-rate="dropRate"
    />
    <TamedPetModal :game-initializer="gameInitializer" />
  </div>
</template>

<script>
import ItemTooltip from './ItemTooltip.vue'
  import MonsterTooltip from './MonsterTooltip.vue'
import AttackAnimation from './AttackAnimation.vue'
import HitEffectAnimation from './HitEffectAnimation.vue'
import ExpNumber from './ExpNumber.vue'
import BattleSection from './BattleSection.vue'
import TamedPetModal from './modals/TamedPetModal.vue'

import PlayerStatusCard from './PlayerStatusCard.vue'
import EnergyReflectEffect from './mage-effects/EnergyReflectEffect.vue'
import PsychicShieldEffect from './mage-effects/PsychicShieldEffect.vue'
import SyleBlessingEffect from './mage-effects/SyleBlessingEffect.vue'
import TrinityForceEffect from './mage-effects/TrinityForceEffect.vue'
import FightingSpiritWindWheelEffect from './mage-effects/FightingSpiritWindWheelEffect.vue'
import HealEffect from './mage-effects/HealEffect.vue'
import OmniBlessingEffect from './mage-effects/OmniBlessingEffect.vue'
import KnuckleMasteryEffect from './mage-effects/KnuckleMasteryEffect.vue'
import XuliBlessingEffect from './mage-effects/XuliBlessingEffect.vue'
import EliffBlessingEffect from './mage-effects/EliffBlessingEffect.vue'
import NatureInsightEffect from './mage-effects/NatureInsightEffect.vue'
import DeadlyShotEffect from './mage-effects/DeadlyShotEffect.vue'
import CorelBlessingEffect from './mage-effects/CorelBlessingEffect.vue'
import BerserkEffect from './mage-effects/BerserkEffect.vue'
import HalesenBlessingEffect from './mage-effects/HalesenBlessingEffect.vue'
import AilandeBlessingEffect from './mage-effects/AilandeBlessingEffect.vue'
import KalanduoBlessingEffect from './mage-effects/KalanduoBlessingEffect.vue'
import FrenzyHeartEffect from './mage-effects/FrenzyHeartEffect.vue'
import SacrificeEffect from './mage-effects/SacrificeEffect.vue'
import LuolianBlessingEffect from './mage-effects/LuolianBlessingEffect.vue'
import DragonForceDisplay from './DragonForceDisplay.vue'
import ShadowGrudgeDisplay from './ShadowGrudgeDisplay.vue'
import HolyAccumulationDisplay from './HolyAccumulationDisplay.vue'
import WindAccumulationDisplay from './WindAccumulationDisplay.vue'
import JudgmentAccumulationDisplay from './JudgmentAccumulationDisplay.vue'
import ArcaneChargeDisplay from './ArcaneChargeDisplay.vue'
import MindChargeDisplay from './MindChargeDisplay.vue'
import AngelWingsBuffEffect from './mage-effects/AngelWingsBuffEffect.vue'
import HolySanctuaryBuffEffect from './mage-effects/HolySanctuaryBuffEffect.vue'
import StormPowerBuffEffect from './mage-effects/StormPowerBuffEffect.vue'
import StormDomainBuffEffect from './mage-effects/StormDomainBuffEffect.vue'
import HolyShieldAwakeningBuffEffect from './mage-effects/HolyShieldAwakeningBuffEffect.vue'
import HolyBulwarkBuffEffect from './mage-effects/HolyBulwarkBuffEffect.vue'
import HotRecoveryEffect from './mage-effects/HotRecoveryEffect.vue'
import ArcaneOverloadBuffEffect from './mage-effects/ArcaneOverloadBuffEffect.vue'
import ArcaneResonanceBuffEffect from './mage-effects/ArcaneResonanceBuffEffect.vue'
import MindResonanceBuffEffect from './mage-effects/MindResonanceBuffEffect.vue'
import MindAwakeningBuffEffect from './mage-effects/MindAwakeningBuffEffect.vue'
export default {
  name: 'PlayerInfoPanel',
  components: {
    ItemTooltip,
      MonsterTooltip,
        AttackAnimation,
    HitEffectAnimation,
    ExpNumber,
    PlayerStatusCard,
    BattleSection,
    TamedPetModal,
EnergyReflectEffect,
PsychicShieldEffect,
SyleBlessingEffect,
TrinityForceEffect,
FightingSpiritWindWheelEffect,
HealEffect,
OmniBlessingEffect,
KnuckleMasteryEffect,
XuliBlessingEffect,
EliffBlessingEffect,
NatureInsightEffect,
DeadlyShotEffect,
CorelBlessingEffect,
BerserkEffect,
HalesenBlessingEffect,
AilandeBlessingEffect,
KalanduoBlessingEffect,
FrenzyHeartEffect,
SacrificeEffect,
LuolianBlessingEffect,
DragonForceDisplay,
ShadowGrudgeDisplay,
HolyAccumulationDisplay,
WindAccumulationDisplay,
JudgmentAccumulationDisplay,
ArcaneChargeDisplay,
MindChargeDisplay,
AngelWingsBuffEffect,
HolySanctuaryBuffEffect,
StormPowerBuffEffect,
StormDomainBuffEffect,
HolyShieldAwakeningBuffEffect,
HolyBulwarkBuffEffect,
HotRecoveryEffect,
ArcaneOverloadBuffEffect,
ArcaneResonanceBuffEffect,
MindResonanceBuffEffect,
MindAwakeningBuffEffect
},
  props: {
    player: {
      type: Object,
      required: true
    },
    playerAvatar: {
      type: String,
      required: true
    },
    playerClassName: {
      type: String,
      required: true
    },
    healthPercentage: {
      type: Number,
      required: true
    },
    manaPercentage: {
      type: Number,
      required: true
    },
    expPercentage: {
      type: Number,
      required: true
    },
    lastDamage: {
      type: Number,
      required: true
    },
    battleLogs: {
      type: Array,
      required: true
    },
    userSettings: {
      type: Object,
      required: true
    },
    currentMap: {
      type: Object,
      required: true
    },
    gameInitializer: {
      type: Object,
      required: false,
      default: null
    },
    gameData: {
      type: Object,
      required: true
    },
    activeBuffs: {
      type: Array,
      required: true
    },
    expMultiplier: {
      type: Number,
      required: true
    },
    dropRate: {
      type: Number,
      required: true
    },
    autoBattle: {
      type: Boolean,
      required: true
    },
    isActive: {
      type: Boolean,
      required: false,
      default: false
    },
    uiExpNumbers: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  emits: [
    'openPlayerDetailModal',
    'handleImageError',
    'addBattleLog',
    'handleAutoBattleAttack',
    'handleAutoBattleSkillUse',
    'player-death',
    'useRecoveryItem',
    'refreshMonsters',
    'checkAndRefreshMonsters',
    'updateMonstersFromAutoBattle',
    'update-last-damage',
    'show-damage-number',
    'monster-attack-animation',
    'player-skill-use',
    'player-damage',
    'stop-pulse-animation',
    'start-pulse-animation'
  ],
  data () {
    return {
      isPlayerHit: false,
      shouldPulse: false,
      isPlayerAttacking: false,
      isPlayerUsingSkill: false,
      localLastDamage: 0, // 本地 lastDamage
      /** 玩家受击特效触发标志 */
      playerHitEffectTrigger: false,
      /** 玩家受击特效伤害类型 */
      playerHitEffectDamageType: 'normal',
      /** 是否显示治疗术特效 */
      showHealEffect: false,
      /** 治疗术特效的key，每次递增以触发重新挂载 */
      healEffectKey: 0,
/** 治疗术特效的定时器 */
healEffectTimer: null,
/** 是否显示全能祝福特效 */
showOmniBlessingEffect: false,
/** 全能祝福特效的key，每次递增以触发重新挂载 */
omniBlessingEffectKey: 0,
/** 全能祝福特效的定时器 */
omniBlessingEffectTimer: null,
/** 是否显示圣光庇护HOT恢复特效 */
showHotRecoveryEffect: false,
/** HOT恢复特效的key，每次递增以触发重新挂载 */
hotRecoveryKey: 0,
/** HOT恢复特效的HP恢复量 */
hotRecoveryHealAmount: 0,
/** HOT恢复特效的MP恢复量 */
hotRecoveryMpAmount: 0,
/** HOT恢复特效的定时器 */
hotRecoveryTimer: null
}
  },
  computed: {
    /**
     * 检测玩家是否拥有「能量反弹」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示能量墙特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有能量反弹BUFF
     */
    hasEnergyReflectBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'spirit_mage_energy_reflect' ||
          buff.skillKey === '能量反弹' ||
          buff.name === '能量反弹'
        )
      )
    },
    /**
     * 检测玩家是否拥有「念力护盾」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示能量护盾特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有念力护盾BUFF
     */
    hasPsychicShieldBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'spirit_mage_psychic_shield' ||
          buff.skillKey === '念力护盾' ||
          buff.name === '念力护盾'
        )
      )
    },
    /**
     * 检测玩家是否拥有「赛乐的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示圣光祝福光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有赛乐的祝福BUFF
     */
    hasSyleBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'spirit_mage_syle_blessing' ||
          buff.skillKey === '赛乐的祝福' ||
          buff.name === '赛乐的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「三相之力」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示三色能量光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有三相之力BUFF
     */
    hasTrinityForceBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'assassin_q' ||
          buff.name === '三相之力'
        )
      )
    },
    /**
     * 检测玩家是否拥有「斗志风轮」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示六叶风轮旋转特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有斗志风轮BUFF
     */
    hasFightingSpiritWindWheelBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'assassin_w' ||
          buff.name === '斗志风轮'
        )
      )
    },
    /**
     * 检测玩家是否拥有「拳术领悟」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示拳劲光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有拳术领悟BUFF
     */
    hasKnuckleMasteryBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'technician_q' ||
          buff.name === '拳术领悟'
        )
      )
    },
    /**
     * 检测玩家是否拥有「叙里的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示技师祝福光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有叙里的祝福BUFF
     */
    hasXuliBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'technician_r' ||
          buff.name === '叙里的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「艾梨芙的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示游侠祝福光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有艾梨芙的祝福BUFF
     */
    hasEliffBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'ranger_y' ||
          buff.name === '艾梨芙的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「自然领悟」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示自然能量光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有自然领悟BUFF
     */
    hasNatureInsightBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'ranger_r' ||
          buff.name === '自然领悟'
        )
      )
    },
    /**
     * 检测玩家是否拥有「致命射击」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示暴击准星光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有致命射击BUFF
     */
    hasDeadlyShotBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'ranger_e' ||
          buff.name === '致命射击'
        )
      )
    },
    /**
     * 检测玩家是否拥有「席瑞儿.安得利尔的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示刀锋战士祝福光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有席瑞儿.安得利尔的祝福BUFF
     */
    hasCorelBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'blade_warrior_r' ||
          buff.name === '席瑞儿.安得利尔的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「狂暴」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示狂暴光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有狂暴BUFF
     */
    hasBerserkBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'blade_warrior_w' ||
          buff.name === '狂暴'
        )
      )
    },
    /**
     * 检测玩家是否拥有「赫雷森.凯列蓝的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示元素狂暴光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有赫雷森.凯列蓝的祝福BUFF
     */
    hasHalesenBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'element_mage_q' ||
          buff.name === '赫雷森.凯列蓝的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「爱岚德的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示体魄强化光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有爱岚德的祝福BUFF
     */
    hasAilandeBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'guardian_u' ||
          buff.name === '爱岚德的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「卡兰铎的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示钢铁壁垒光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有卡兰铎的祝福BUFF
     */
    hasKalanduoBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'knight_u' ||
          buff.name === '卡兰铎的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「狂暴之心」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示狂心脉搏光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有狂暴之心BUFF
     */
    hasFrenzyHeartBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'knight_e' ||
          buff.name === '狂暴之心'
        )
      )
    },
    /**
     * 检测玩家是否拥有「牺牲」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示碎盾血链光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有牺牲BUFF
     */
    hasSacrificeBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'knight_t' ||
          buff.name === '牺牲'
        )
      )
    },
    /**
     * 检测玩家是否拥有「萝丽安的祝福」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示暗影杀戮光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有萝丽安的祝福BUFF
     */
    hasLuolianBlessingBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'assassin_u' ||
          buff.name === '萝丽安的祝福'
        )
      )
    },
    /**
     * 检测玩家是否拥有「天使之翼」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示天使之翼光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有天使之翼BUFF
     */
    hasAngelWingsBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'nature_messenger_r' ||
          buff.name === '天使之翼'
        )
      )
    },
    /**
     * 检测玩家是否拥有「圣光庇护」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示圣光领域光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有圣光庇护BUFF
     */
    hasHolySanctuaryBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'nature_messenger_q' ||
          buff.name === '圣光庇护'
        )
      )
    },
    /**
     * 检测玩家是否拥有「风暴之力」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示风暴觉醒光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有风暴之力BUFF
     */
    hasStormPowerBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'storm_walker_r' ||
          buff.name === '风暴之力'
        )
      )
    },
    /**
     * 检测玩家是否拥有「风暴领域」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示风暴领域光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有风暴领域BUFF
     */
    hasStormDomainBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'storm_walker_q' ||
          buff.name === '风暴领域'
        )
      )
    },
    /**
     * 检测玩家是否拥有「圣盾觉醒」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示圣盾觉醒光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有圣盾觉醒BUFF
     */
    hasHolyShieldAwakeningBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'holy_knight_r' ||
          buff.name === '圣盾觉醒'
        )
      )
    },
    /**
     * 检测玩家是否拥有「神圣壁垒」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示神圣壁垒光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有神圣壁垒BUFF
     */
    hasHolyBulwarkBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'holy_knight_q' ||
          buff.name === '神圣壁垒'
        )
      )
    },
    /**
     * 检测玩家是否拥有「奥术超载」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示超载光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有奥术超载BUFF
     */
    hasArcaneOverloadBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'arcane_master_r' ||
          buff.name === '奥术超载'
        )
      )
    },
    /**
     * 检测玩家是否拥有「奥术共鸣」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示共鸣光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有奥术共鸣BUFF
     */
    hasArcaneResonanceBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'arcane_master_q' ||
          buff.name === '奥术共鸣'
        )
      )
    },
    /**
     * 检测玩家是否拥有「心灵感应」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示感应光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有心灵感应BUFF
     */
    hasMindResonanceBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'mind_master_q' ||
          buff.name === '心灵感应'
        )
      )
    },
    /**
     * 检测玩家是否拥有「心灵觉醒」BUFF
     * 通过 activeBuffs 响应式数据自动追踪BUFF状态
     * BUFF激活时显示觉醒光环特效，BUFF到期移除时自动隐藏
     * @returns {boolean} 是否拥有心灵觉醒BUFF
     */
    hasMindAwakeningBuff () {
      const buffs = this.activeBuffs
      if (!Array.isArray(buffs) || buffs.length === 0) {
        return false
      }
      return buffs.some(buff =>
        buff && (
          buff.skillId === 'mind_master_r' ||
          buff.name === '心灵觉醒'
        )
      )
    },
  },
  watch: {
    isActive (newVal) {
      this.shouldPulse = newVal
    },
    autoBattle (newVal) {
      this.shouldPulse = newVal
    },
    lastDamage (newVal) {
      if (newVal > 0) {
        this.localLastDamage = newVal
        this.triggerPlayerHit()
      }
    },
    gameData () {}
  },
  mounted () {
// 注册治疗术特效全局事件监听
this.handleHealEffectEvent = () => {
this.playHealEffect()
}
window.addEventListener('skill-heal', this.handleHealEffectEvent)
// 注册全能祝福特效全局事件监听
this.handleOmniBlessingEffectEvent = () => {
this.playOmniBlessingEffect()
}
window.addEventListener('skill-omni-blessing', this.handleOmniBlessingEffectEvent)
// 注册圣光庇护HOT恢复特效全局事件监听
this.handleHotRecoveryEvent = (event) => {
  this.playHotRecoveryEffect(event.detail || {})
}
window.addEventListener('hot-recovery', this.handleHotRecoveryEvent)
  },
  beforeUnmount () {
// 移除治疗术特效全局事件监听
if (this.handleHealEffectEvent) {
window.removeEventListener('skill-heal', this.handleHealEffectEvent)
}
// 清理治疗术特效定时器
if (this.healEffectTimer) {
clearTimeout(this.healEffectTimer)
this.healEffectTimer = null
}
// 移除全能祝福特效全局事件监听
if (this.handleOmniBlessingEffectEvent) {
window.removeEventListener('skill-omni-blessing', this.handleOmniBlessingEffectEvent)
}
// 移除圣光庇护HOT恢复特效全局事件监听
if (this.handleHotRecoveryEvent) {
window.removeEventListener('hot-recovery', this.handleHotRecoveryEvent)
}
// 清理全能祝福特效定时器
if (this.omniBlessingEffectTimer) {
clearTimeout(this.omniBlessingEffectTimer)
this.omniBlessingEffectTimer = null
}
// 清理HOT恢复特效定时器
if (this.hotRecoveryTimer) {
clearTimeout(this.hotRecoveryTimer)
this.hotRecoveryTimer = null
}
  },
  methods: {
    handleStopPulseAnimation () {
      // console.log('[PlayerInfoPanel] 收到停止动画事件')
      this.shouldPulse = false
    },
    handleStartPulseAnimation () {
      // console.log('[PlayerInfoPanel] 收到启动动画事件')
      this.shouldPulse = true
    },
    triggerPlayerHit () {
      this.isPlayerHit = true
      setTimeout(() => {
        this.isPlayerHit = false
      }, 300)
      // 受击位移动画0.3s后播放受击特效
      setTimeout(() => {
        this.playerHitEffectTrigger = true
        setTimeout(() => {
          this.playerHitEffectTrigger = false
        }, 50)
      }, 300)
    },
    /**
     * 播放治疗术特效动画
     * 圣职者W技能治疗术特效，覆盖在玩家头像区域显示圣光治愈动画
     * @returns {void}
     */
    playHealEffect () {
      // 清除之前的定时器
      if (this.healEffectTimer) {
        clearTimeout(this.healEffectTimer)
        this.healEffectTimer = null
      }
      this.showHealEffect = true
      this.healEffectKey += 1
      // 1.9秒后自动隐藏（动画持续时间1.8秒 + 100ms缓冲）
this.healEffectTimer = setTimeout(() => {
this.showHealEffect = false
this.healEffectTimer = null
}, 1900)
},
/**
* 播放全能祝福特效动画
* 圣职者E技能全能祝福特效，覆盖在玩家头像区域显示十位一体祝福动画
* @returns {void}
*/
playOmniBlessingEffect () {
// 清除之前的定时器
if (this.omniBlessingEffectTimer) {
clearTimeout(this.omniBlessingEffectTimer)
this.omniBlessingEffectTimer = null
}
this.showOmniBlessingEffect = true
this.omniBlessingEffectKey += 1
// 2.1秒后自动隐藏（动画持续时间2.0秒 + 100ms缓冲）
this.omniBlessingEffectTimer = setTimeout(() => {
this.showOmniBlessingEffect = false
this.omniBlessingEffectTimer = null
}, 2100)
},
/**
* 播放圣光庇护HOT恢复特效动画
* 圣光庇护Q技能HOT每2秒触发恢复时播放，覆盖在玩家头像区域显示HP/MP恢复动画
* 轻量级动画（1.2秒），适配高频HOT触发，显示绿色HP恢复和蓝色MP恢复特效
* @param {Object} detail - 恢复详情 { healAmount: number, mpAmount: number }
* @returns {void}
*/
playHotRecoveryEffect (detail) {
  // 清除之前的定时器
  if (this.hotRecoveryTimer) {
    clearTimeout(this.hotRecoveryTimer)
    this.hotRecoveryTimer = null
  }
  this.hotRecoveryHealAmount = Number(detail.healAmount || 0)
  this.hotRecoveryMpAmount = Number(detail.mpAmount || 0)
  this.showHotRecoveryEffect = true
  this.hotRecoveryKey += 1
  // 1.3秒后自动隐藏（动画持续时间1.2秒 + 100ms缓冲）
  this.hotRecoveryTimer = setTimeout(() => {
    this.showHotRecoveryEffect = false
    this.hotRecoveryTimer = null
  }, 1300)
},
    triggerPlayerAttack () {
      this.isPlayerAttacking = true
      setTimeout(() => {
        this.isPlayerAttacking = false
      }, 300)
    },
    triggerPlayerSkill () {
      this.isPlayerUsingSkill = true
      setTimeout(() => {
        this.isPlayerUsingSkill = false
      }, 300)
    },
    openPlayerDetailModal () {
      this.$emit('openPlayerDetailModal')
    },
    handleImageError () {
      this.$emit('handleImageError')
    },
    addBattleLog (log) {
      this.$emit('addBattleLog', log)
    },
    handleAutoBattleAttack (...args) {
      // console.log('[PlayerInfoPanel] handleAutoBattleAttack 接收到的参数:', args)

      // 处理参数，兼容不同的参数传递方式
      let targetIndex, damage, isCritical, isHeal, skill, isMiss, weaponIcon, monsterIcon

      if (args.length === 1 && typeof args[0] === 'object') {
        // 单个对象参数
        const data = args[0]
        targetIndex = data.targetIndex
        damage = data.damage
        isCritical = data.isCritical
        isHeal = data.isHeal
        skill = data.skill
        isMiss = data.isMiss
        weaponIcon = data.weaponIcon
        monsterIcon = data.monsterIcon
      } else if (args.length >= 2) {
        // 多个独立参数
        targetIndex = args[0]
        damage = args[1]
        isCritical = args[2]
        isHeal = args[3]
        skill = args[4]
        isMiss = args[5]
        weaponIcon = args[6]
        monsterIcon = args[7]
      }

      // console.log('[PlayerInfoPanel] handleAutoBattleAttack 处理后的参数:', {
      //   targetIndex,
      //   damage,
      //   isCritical,
      //   isMiss
      // })

      // 触发玩家攻击动画
      if (!isMiss && damage > 0) {
        this.triggerPlayerAttack()
      }

      // 传递所有参数，确保所有数据都能传递
      this.$emit('handleAutoBattleAttack', {
        targetIndex,
        damage,
        isCritical,
        isHeal,
        skill,
        isMiss,
        weaponIcon,
        monsterIcon
      })
    },
    handlePlayerDamage (data) {
      // console.log('[PlayerInfoPanel] handlePlayerDamage 被调用', data)
      const { damage, isCritical, isMiss, monsterIcon, isDodge, isBlock, text } = data
      // console.log('[PlayerInfoPanel] 解构后的数据:', {
      //   monsterIndex,
      //   monster,
      //   damage,
      //   isCritical,
      //   isMiss,
      //   monsterIcon,
      //   isDodge,
      //   isBlock,
      //   text
      // })

      if (!isMiss && damage > 0) {
        this.localLastDamage = damage
        // 根据伤害数据判断受击特效类型
        const isCrit = Boolean(isCritical)
        const isDodgeHit = Boolean(isDodge)
        const isBlockHit = Boolean(isBlock)
        if (isCrit) {
          this.playerHitEffectDamageType = 'critical'
        } else if (isBlockHit) {
          this.playerHitEffectDamageType = 'normal'
        } else if (isDodgeHit) {
          this.playerHitEffectDamageType = 'normal'
        } else {
          this.playerHitEffectDamageType = 'normal'
        }
        this.triggerPlayerHit()
        this.$emit('update-last-damage', damage)

        setTimeout(() => {
          this.localLastDamage = 0
          this.$emit('update-last-damage', 0)
        }, 1000)
      }

      // 显示伤害数字（targetIndex为负数表示玩家）
      this.$emit(
        'show-damage-number',
        -1,
        isMiss ? 0 : damage,
        isCritical,
        false,
        null,
        isMiss,
        null,
        monsterIcon,
        false,
        typeof text === 'string' && text
          ? text
          : isDodge
            ? '闪避'
            : isBlock
              ? `${damage}伤害(格挡)`
              : null
      )

      // 更新玩家血条
      if (
        this.gameInitializer &&
        this.gameInitializer.services &&
        this.gameInitializer.services.ui
      ) {
        this.gameInitializer.services.ui.updateHealthBar(
          'playerHealthBar',
          this.player.currentHealth,
          this.player.maxHealth
        )
      }
    },
    handleAutoBattleSkillUse (data) {
      // console.log('[PlayerInfoPanel] handleAutoBattleSkillUse 接收到的数据:', data)

      // 触发玩家技能动画
      if (data && (data.damage > 0 || data.isHeal)) {
        this.triggerPlayerSkill()
      }

      this.$emit('handleAutoBattleSkillUse', data)
    },
    handlePlayerDeathInAutoBattle (data) {
      this.$emit('player-death', data)
    },
    useRecoveryItem (data) {
      this.$emit('useRecoveryItem', data)
    },
    refreshMonsters () {
      this.$emit('refreshMonsters')
    },
    checkAndRefreshMonsters () {
      this.$emit('checkAndRefreshMonsters')
    },
    updateMonstersFromAutoBattle (data) {
      this.$emit('updateMonstersFromAutoBattle', data)
    }
  }
}
</script>

<style scoped>
.class-avatar {
  position: relative;
}

/* 玩家卡片区域 - 作为能量墙特效的定位参考容器 */
.player-card-area {
  position: relative;
}

/* 左侧区域 */
.left-section {
  width: 20%;
  display: flex;
  flex-direction: column;
  margin: 10px;
}
/* 左中右区域公共样式 */
.left-section,
.middle-section,
.right-section {
  display: flex;
  flex-direction: column;
  background-color: var(--theme-section-bg);
  border-radius: 10px;
  padding: 10px;
  min-width: 0;
  background-color: #000000bf;
  border: 2px solid #8b7355;
  box-shadow: 0 4px 12px rgb(139 115 85);
}

/* 能量反弹BUFF特效入场/退场过渡动画 */
.er-fade-enter-active {
  transition: opacity 0.3s ease-out;
}
.er-fade-leave-active {
  transition: opacity 0.5s ease-in;
}
.er-fade-enter-from,
.er-fade-leave-to {
  opacity: 0;
}

/* 念力护盾BUFF特效入场/退场过渡动画 */
.ps-fade-enter-active {
  transition: opacity 0.4s ease-out;
}
.ps-fade-leave-active {
  transition: opacity 0.5s ease-in;
}
.ps-fade-enter-from,
.ps-fade-leave-to {
  opacity: 0;
}

/* 赛乐的祝福BUFF特效入场/退场过渡动画 */
.sb-fade-enter-active {
  transition: opacity 0.5s ease-out;
}
.sb-fade-leave-active {
  transition: opacity 0.6s ease-in;
}
.sb-fade-enter-from,
.sb-fade-leave-to {
  opacity: 0;
}

/* 三相之力BUFF特效入场/退场过渡动画 */
.tf-fade-enter-active {
transition: opacity 0.5s ease-out;
}
.tf-fade-leave-active {
transition: opacity 0.6s ease-in;
}
.tf-fade-enter-from,
.tf-fade-leave-to {
opacity: 0;
}

/* 斗志风轮BUFF特效入场/退场过渡动画 */
.fsww-fade-enter-active {
transition: opacity 0.5s ease-out;
}
.fsww-fade-leave-active {
transition: opacity 0.6s ease-in;
}
.fsww-fade-enter-from,
.fsww-fade-leave-to {
opacity: 0;
}

/* 治疗术特效入场/退场过渡动画 */
.heal-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.heal-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.heal-fade-enter-from,
.heal-fade-leave-to {
opacity: 0;
}

/* 全能祝福特效入场/退场过渡动画 */
.ob-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.ob-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.ob-fade-enter-from,
.ob-fade-leave-to {
opacity: 0;
}

/* 圣光庇护HOT恢复特效入场/退场过渡动画 */
.hot-rec-fade-enter-active {
transition: opacity 0.2s ease-out;
}
.hot-rec-fade-leave-active {
transition: opacity 0.3s ease-in;
}
.hot-rec-fade-enter-from,
.hot-rec-fade-leave-to {
opacity: 0;
}

/* 拳术领悟特效入场/退场过渡动画 */
.km-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.km-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.km-fade-enter-from,
.km-fade-leave-to {
opacity: 0;
}

/* 叙里的祝福特效入场/退场过渡动画 */
.xb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.xb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.xb-fade-enter-from,
.xb-fade-leave-to {
opacity: 0;
}

/* 艾梨芙的祝福特效入场/退场过渡动画 */
.eb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.eb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.eb-fade-enter-from,
.eb-fade-leave-to {
opacity: 0;
}

/* 自然领悟特效入场/退场过渡动画 */
.ni-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.ni-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.ni-fade-enter-from,
.ni-fade-leave-to {
opacity: 0;
}

/* 致命射击特效入场/退场过渡动画 */
.ds-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.ds-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.ds-fade-enter-from,
.ds-fade-leave-to {
opacity: 0;
}

/* 席瑞儿.安得利尔的祝福特效入场/退场过渡动画 */
.cb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.cb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.cb-fade-enter-from,
.cb-fade-leave-to {
opacity: 0;
}

/* 狂暴特效入场/退场过渡动画 */
.bk-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.bk-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.bk-fade-enter-from,
.bk-fade-leave-to {
opacity: 0;
}

/* 赫雷森.凯列蓝的祝福特效入场/退场过渡动画 */
.hb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.hb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.hb-fade-enter-from,
.hb-fade-leave-to {
opacity: 0;
}
.ab-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.ab-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.ab-fade-enter-from,
.ab-fade-leave-to {
opacity: 0;
}

/* 卡兰铎的祝福特效入场/退场过渡动画 */
.kb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.kb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.kb-fade-enter-from,
.kb-fade-leave-to {
opacity: 0;
}

/* 狂暴之心特效入场/退场过渡动画 */
.fh-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.fh-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.fh-fade-enter-from,
.fh-fade-leave-to {
opacity: 0;
}

/* 牺牲特效入场/退场过渡动画 */
.sc-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.sc-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.sc-fade-enter-from,
.sc-fade-leave-to {
opacity: 0;
}

/* 萝丽安的祝福特效入场/退场过渡动画 */
.lb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.lb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.lb-fade-enter-from,
.lb-fade-leave-to {
opacity: 0;
}

/* 天使之翼BUFF特效入场/退场过渡动画 */
.awb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.awb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.awb-fade-enter-from,
.awb-fade-leave-to {
opacity: 0;
}

/* 圣光庇护BUFF特效入场/退场过渡动画 */
.hsb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.hsb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.hsb-fade-enter-from,
.hsb-fade-leave-to {
opacity: 0;
}

/* 风暴之力BUFF特效入场/退场过渡动画 */
.spb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.spb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.spb-fade-enter-from,
.spb-fade-leave-to {
opacity: 0;
}

/* 风暴领域BUFF特效入场/退场过渡动画 */
.sdb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.sdb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.sdb-fade-enter-from,
.sdb-fade-leave-to {
opacity: 0;
}

/* 圣盾觉醒BUFF特效入场/退场过渡动画 */
.hsa-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.hsa-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.hsa-fade-enter-from,
.hsa-fade-leave-to {
opacity: 0;
}

/* 神圣壁垒BUFF特效入场/退场过渡动画 */
.hbb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.hbb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.hbb-fade-enter-from,
.hbb-fade-leave-to {
opacity: 0;
}

/* 奥术超载BUFF特效入场/退场过渡动画 */
.aob-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.aob-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.aob-fade-enter-from,
.aob-fade-leave-to {
opacity: 0;
}

/* 奥术共鸣BUFF特效入场/退场过渡动画 */
.arb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.arb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.arb-fade-enter-from,
.arb-fade-leave-to {
opacity: 0;
}

/* 心灵感应BUFF特效入场/退场过渡动画 */
.mrb-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.mrb-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.mrb-fade-enter-from,
.mrb-fade-leave-to {
opacity: 0;
}

/* 心灵觉醒BUFF特效入场/退场过渡动画 */
.mab-fade-enter-active {
transition: opacity 0.3s ease-out;
}
.mab-fade-leave-active {
transition: opacity 0.4s ease-in;
}
.mab-fade-enter-from,
.mab-fade-leave-to {
opacity: 0;
}
</style>
