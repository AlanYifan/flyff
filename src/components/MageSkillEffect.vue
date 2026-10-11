<!--
  @file MageSkillEffect.vue
  @generated 2026-06-29
  技能特效动画容器组件：根据 effectType（元素类型）动态加载对应子组件
  支持元素特效：火(fire)、风(wind)、水(water=雪山崩塌)、雷(electricity)、奥术(none)、沙暴吞噬(sandstorm_devour)、神圣领域(divine_domain)、神念攻击(spirit_mind)、混沌封印(chaos_seal)、戏虐爆破(mockery_blast)、暗杀(assassination)、背水一击(backwater_strike)、毒箭(poison_arrow)、圣光庇护(holy_sanctuary)、圣光审判(holy_judgment)、天使之怒(angel_wrath)、天使之翼(angel_wings)、雷神之锤(thunder_hammer)、神圣领域十字(divine_domain_cross)、狂风绝刃(storm_blade)、狂风绝息斩(storm_breath_slash)、风暴印记(storm_mark)等
  GPU加速：所有动画仅使用 translate3d + opacity，避免重排，保证丝滑流畅
  单体技能特效覆盖在 enemy-container 内部，AOE特效覆盖整个 right-section
  各特效实现已拆分至 mage-effects/ 子目录下的独立组件
-->
<template>
  <div class="mage-effect-container" :class="effectClass">
    <component :is="effectComponent" v-if="effectComponent" v-bind="childProps" />
  </div>
</template>

<script setup>
/**
 * 魔导士技能特效动画容器组件
 * 根据元素类型动态加载对应的独立特效子组件
 * 各子组件位于 mage-effects/ 目录，各自管理模板、脚本和样式
 *
 * @prop {string} effectType - 元素类型（fire / wind / water / electricity / earth / none / phantom_fire / boulder_throw / torrent_impact / thunder_storm / howl_gale / meteor_fall / sandstorm_devour / divine_domain / earth_resonance / spirit_mind / chaos_seal / mockery_blast / assassination / moonlight_punishment / holy_light_earth / fighting_spirit_storm / backwater_strike / poison_arrow / kamehameha / nen_energy_bomb / holy_sanctuary / holy_judgment / angel_wrath / angel_wings / thunder_hammer / storm_blade / storm_breath_slash / storm_mark）
 */

import { computed } from 'vue'
import FireEffect from './mage-effects/FireEffect.vue'
import MeteorFallEffect from './mage-effects/MeteorFallEffect.vue'
import WindEffect from './mage-effects/WindEffect.vue'
import HowlGaleEffect from './mage-effects/HowlGaleEffect.vue'
import WaterEffect from './mage-effects/WaterEffect.vue'
import ElectricityEffect from './mage-effects/ElectricityEffect.vue'
import SandstormDevourEffect from './mage-effects/SandstormDevourEffect.vue'
import TorrentImpactEffect from './mage-effects/TorrentImpactEffect.vue'
import ThunderStormEffect from './mage-effects/ThunderStormEffect.vue'
import PhantomFireEffect from './mage-effects/PhantomFireEffect.vue'
import BoulderThrowEffect from './mage-effects/BoulderThrowEffect.vue'
import DivineDomainEffect from './mage-effects/DivineDomainEffect.vue'
import DivineDomainCrossEffect from './mage-effects/DivineDomainCrossEffect.vue'
import EarthResonanceEffect from './mage-effects/EarthResonanceEffect.vue'
import ArcaneEffect from './mage-effects/ArcaneEffect.vue'
import SpiritMindEffect from './mage-effects/SpiritMindEffect.vue'
import ChaosSealEffect from './mage-effects/ChaosSealEffect.vue'
import MockeryBlastEffect from './mage-effects/MockeryBlastEffect.vue'
import AssassinationEffect from './mage-effects/AssassinationEffect.vue'
import MoonlightPunishmentEffect from './mage-effects/MoonlightPunishmentEffect.vue'
import HolyLightEarthEffect from './mage-effects/HolyLightEarthEffect.vue'
import FightingSpiritStormEffect from './mage-effects/FightingSpiritStormEffect.vue'
import BackwaterStrikeEffect from './mage-effects/BackwaterStrikeEffect.vue'
import PoisonArrowEffect from './mage-effects/PoisonArrowEffect.vue'
import KamehamehaEffect from './mage-effects/KamehamehaEffect.vue'
import NenEnergyBombEffect from './mage-effects/NenEnergyBombEffect.vue'
import HolySanctuaryEffect from './mage-effects/HolySanctuaryEffect.vue'
import HolyJudgmentEffect from './mage-effects/HolyJudgmentEffect.vue'
import AngelWrathEffect from './mage-effects/AngelWrathEffect.vue'
import AngelWingsEffect from './mage-effects/AngelWingsEffect.vue'
import ThunderHammerEffect from './mage-effects/ThunderHammerEffect.vue'
import StormBladeEffect from './mage-effects/StormBladeEffect.vue'
import StormBreathSlashEffect from './mage-effects/StormBreathSlashEffect.vue'
import StormMarkEffect from './mage-effects/StormMarkEffect.vue'
import HolyShieldBashEffect from './mage-effects/HolyShieldBashEffect.vue'
import HolyLightJudgmentEffect from './mage-effects/HolyLightJudgmentEffect.vue'
import ArmorBreakStrikeEffect from './mage-effects/ArmorBreakStrikeEffect.vue'
import ArcaneNovaEffect from './mage-effects/ArcaneNovaEffect.vue'
import VoidFissionEffect from './mage-effects/VoidFissionEffect.vue'
import ElementCollapseEffect from './mage-effects/ElementCollapseEffect.vue'
import MindTearEffect from './mage-effects/MindTearEffect.vue'
import ConsciousnessCollapseEffect from './mage-effects/ConsciousnessCollapseEffect.vue'
import MindNovaEffect from './mage-effects/MindNovaEffect.vue'

const props = defineProps({
  /** 元素类型，决定渲染哪种元素特效 */
  effectType: {
    type: String,
    required: true,
    validator: v =>
      ['fire', 'wind', 'water', 'electricity', 'earth', 'none',
       'phantom_fire', 'boulder_throw', 'torrent_impact', 'thunder_storm',
       'howl_gale', 'meteor_fall', 'sandstorm_devour', 'divine_domain',
       'earth_resonance', 'spirit_mind', 'chaos_seal', 'mockery_blast',
       'assassination', 'moonlight_punishment', 'holy_light_earth',
       'fighting_spirit_storm', 'backwater_strike', 'poison_arrow',
       'kamehameha', 'nen_energy_bomb',
       'holy_sanctuary', 'holy_judgment', 'angel_wrath',
       'angel_wings', 'thunder_hammer', 'divine_domain_cross',
       'storm_blade', 'storm_breath_slash', 'storm_mark',
       'holy_shield_bash', 'holy_light_judgment', 'armor_break_strike',
       'arcane_nova', 'void_fission', 'element_collapse',
       'mind_tear', 'consciousness_collapse', 'mind_nova'].includes(v)
  },
  /** 目标怪物索引（用于龟派气功等需要从玩家头像发射到怪物头像的特效定位） */
  targetIndex: {
    type: Number,
    default: 0
  }
})

/** 需要接收 targetIndex 的特效类型集合（仅龟派气功需要目标怪物索引定位） */
const EFFECTS_NEEDING_TARGET_INDEX = new Set(['kamehameha'])

/** 元素类型到CSS类名映射 */
const effectClass = computed(() => `effect-${props.effectType}`)

/** 子组件动态 props：仅在子组件声明了 targetIndex 时才传递，避免向 fragment 组件注入非 prop 属性 */
const childProps = computed(() =>
  EFFECTS_NEEDING_TARGET_INDEX.has(props.effectType)
    ? { targetIndex: props.targetIndex }
    : {}
)

/** 元素类型到子组件映射表 */
const EFFECT_COMPONENT_MAP = Object.freeze({
  fire: FireEffect,
  meteor_fall: MeteorFallEffect,
  wind: WindEffect,
  howl_gale: HowlGaleEffect,
  water: WaterEffect,
  electricity: ElectricityEffect,
  sandstorm_devour: SandstormDevourEffect,
  torrent_impact: TorrentImpactEffect,
  thunder_storm: ThunderStormEffect,
  phantom_fire: PhantomFireEffect,
  boulder_throw: BoulderThrowEffect,
  divine_domain: DivineDomainEffect,
  divine_domain_cross: DivineDomainCrossEffect,
  earth_resonance: EarthResonanceEffect,
  none: ArcaneEffect,
  spirit_mind: SpiritMindEffect,
  chaos_seal: ChaosSealEffect,
  mockery_blast: MockeryBlastEffect,
  assassination: AssassinationEffect,
  moonlight_punishment: MoonlightPunishmentEffect,
  holy_light_earth: HolyLightEarthEffect,
  fighting_spirit_storm: FightingSpiritStormEffect,
  backwater_strike: BackwaterStrikeEffect,
  poison_arrow: PoisonArrowEffect,
  kamehameha: KamehamehaEffect,
  nen_energy_bomb: NenEnergyBombEffect,
  holy_sanctuary: HolySanctuaryEffect,
  holy_judgment: HolyJudgmentEffect,
  angel_wrath: AngelWrathEffect,
  angel_wings: AngelWingsEffect,
  thunder_hammer: ThunderHammerEffect,
  storm_blade: StormBladeEffect,
  storm_breath_slash: StormBreathSlashEffect,
  storm_mark: StormMarkEffect,
  // 圣殿骑士技能特效
  holy_shield_bash: HolyShieldBashEffect,       // 荣耀之剑 - 圣光凝聚·圣剑成形·荣耀斩击·圣光爆发·余韵消散
  holy_light_judgment: HolyLightJudgmentEffect, // 圣殿裁决 - 圣光降临·裁决法阵·光柱天降·范围爆发·余韵消散
  armor_break_strike: ArmorBreakStrikeEffect,    // 碎甲圣裁 - 圣光凝聚·重武斩击·护甲碎裂·圣裁侵蚀·余韵消散
  // 3转 - 奥术师技能特效
  arcane_nova: ArcaneNovaEffect,                 // 奥术新星 - 虚空裂隙·能量压缩·新星爆发·余波消散
  void_fission: VoidFissionEffect,               // 虚空寂灭 - 虚空凝聚·能量压缩·寂灭爆发·虚空消散
  element_collapse: ElementCollapseEffect,       // 元素崩坏 - 元素紊乱·元素碰撞·崩坏爆发·元素消散
  // 3转 - 心灵师技能特效
  mind_tear: MindTearEffect,                      // 星思坠寂 - 精神凝聚·意识压缩·撕裂释放·精神消散
  consciousness_collapse: ConsciousnessCollapseEffect, // 意识崩塌 - 意识紊乱·精神冲击·崩塌爆发·意识消散
  mind_nova: MindNovaEffect                       // 万绪沉宵 - 心灵凝聚·新星升腾·心爆扩散·余韵消散
})

/** 根据元素类型获取对应的子组件 */
const effectComponent = computed(() => EFFECT_COMPONENT_MAP[props.effectType] || null)
</script>

<style scoped>
/* ================================================================
   通用容器 - 覆盖父容器（enemy-container 或 right-section）
   pointer-events: none 不阻挡点击
   ================================================================ */
.mage-effect-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
  border-radius: 8px;
}

/* ================================================================
   减少动画偏好 - 尊重用户设置
   ================================================================ */
@media (prefers-reduced-motion: reduce) {
  .mage-effect-container :deep(*) {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
