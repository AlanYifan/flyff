<!--
  @file MonsterInfoPanel.vue
  @generated 2026-02-03
  @description 怪物信息面板：展示怪物头像、元素图标、血条与战斗数字等。
-->
<template>
  <div class="right-section" :class="{ 'show-monsters': showMonsters }">
<!-- 箭雨技能特效动画：覆盖整个right-section怪物显示区域 -->
<ArrowRainEffect
v-if="showArrowRainEffect"
:key="arrowRainKey"
/>
<!-- 怒焰回旋技能特效动画：覆盖整个right-section怪物显示区域 -->
<FurySpinEffect
v-if="showFurySpinEffect"
:key="furySpinKey"
/>
<!-- 刀剑乱舞技能特效动画：覆盖整个right-section怪物显示区域 -->
<BladeDanceEffect
v-if="showBladeDanceEffect"
:key="bladeDanceKey"
/>
<!-- 冰箭技能特效动画：覆盖整个right-section怪物显示区域 -->
<IceArrowEffect
v-if="showIceArrowEffect"
:key="iceArrowKey"
/>
<!-- 火焰箭矢技能特效动画：覆盖整个right-section怪物显示区域 -->
<FireArrowEffect
v-if="showFireArrowEffect"
:key="fireArrowKey"
/>
<!-- 神鹰降临召唤物动画：覆盖整个right-section怪物显示区域 -->
<EagleSummonEffect
v-if="showEagleSummonEffect"
:key="eagleSummonKey"
:duration="eagleSummonDuration"
:attack-interval="eagleSummonAttackInterval"
:summon-stats="eagleSummonStats"
:stat-ratio="eagleSummonStatRatio"
:skill-level="eagleSummonSkillLevel"
    :auto-battle="autoBattle"
/>
<!-- 神鹰-寂灭龙卷风技能特效动画：覆盖整个right-section怪物显示区域 -->
<EagleTornadoEffect
v-if="showEagleTornadoEffect"
:key="eagleTornadoKey"
/>
<!-- 暴风箭矢技能特效动画：覆盖整个right-section怪物显示区域 -->
<StormArrowEffect
v-if="showStormArrowEffect"
:key="stormArrowKey"
/>
<!-- 狂风连射技能特效动画：从玩家头像方向聚集连射飞向目标怪物 -->
<GaleRapidFireEffect
v-if="showGaleRapidFireEffect"
:key="galeRapidFireKey"
:target-index="galeRapidFireTargetIndex"
:arrow-count="galeRapidFireArrowCount"
/>
<!-- 弓箭普通攻击特效动画：装备弓箭时，箭矢从玩家头像飞向目标怪物 -->
<BowAttackEffect
v-if="showBowAttackEffect"
:key="bowAttackKey"
:target-index="bowAttackTargetIndex"
:element="bowAttackElement"
/>
<!-- 魔导士AOE技能特效动画：覆盖整个right-section怪物显示区域 -->
<MageSkillEffect
v-if="activeMageEffects[-1]"
:key="`mage-effect-aoe-${activeMageEffects[-1].key}`"
:effect-type="activeMageEffects[-1].effectType"
/>
    <div class="monster-info-top">
      <div class="multi-monster-container">
        <canvas ref="overlayCanvasRef" class="monster-overlay-canvas"></canvas>
        <div
          v-for="index in renderedMonsterDisplayCount"
          :id="'enemy-container-' + (index - 1)"
          :key="`enemy-${index - 1}`"
          v-memo="[
            displayMonsters[index - 1],
            hasRecentHit(index - 1),
            hasRecentAttack(index - 1),
            hasRecentSkillHit(index - 1),
            autoBattle,
            monsterHitEffectTypes[index - 1],
            monsterHitEffectTriggers[index - 1],
            activeMageEffects[index - 1]
          ]"
          class="enemy-container"
          :class="{
            'is-fading': displayMonsters[index - 1]?.isFading,
            'is-hidden': displayMonsters[index - 1]?.isHidden
          }"
          @click="attackMonster(index - 1)"
        >
          <div
            v-if="displayMonsters[index - 1] && !displayMonsters[index - 1].isHidden"
            class="enemy"
            :class="{ 'is-berserk': displayMonsters[index - 1]?.isBerserk }"
          >
            <!-- 上部：左图片 + 右信息 -->
            <div class="enemy-top">
              <AttackAnimation
                type="monster"
                :is-auto-battling="autoBattle && isMonsterAlive(index - 1)"
                :is-hit="hasRecentHit(index - 1)"
                :is-attacking="hasRecentAttack(index - 1)"
                :is-using-skill="hasRecentSkillHit(index - 1)"
              >
                <!-- 狂暴动画（混沌狂暴特效）- 在怪物图片背后显示 -->
                <BerserkAnimation
                  :is-berserk="displayMonsters[index - 1]?.isBerserk"
                  :berserk-activated-at="displayMonsters[index - 1]?.berserkActivatedAt"
                  animation-type="chaos"
                />
                <img
                  class="enemy-icon"
                  :class="`rank-${displayMonsters[index - 1]?.rank || 'normal'}`"
                  :src="displayMonsters[index - 1].icon"
                  :alt="displayMonsters[index - 1].name"
                  @error="handleMonsterImageError(displayMonsters[index - 1])"
                  @click="showMonsterDropsPanel(displayMonsters[index - 1].id, $event)"
                />
                <!-- 怪物受击特效动画：在AttackAnimation容器内居中显示，受伤位移动画后播放 -->
                <HitEffectAnimation
                  type="monster"
                  :damage-type="monsterHitEffectTypes[index - 1] || 'normal'"
                  :trigger="Boolean(monsterHitEffectTriggers[index - 1])"
                />
              </AttackAnimation>
              <HitFlashAnimation :is-hit="hasRecentHit(index - 1)" />
              <div class="enemy-info">
                <span
                  class="enemy-name-text"
                  :style="{ color: getMonsterRankColor(displayMonsters[index - 1]?.rank) }"
                >
                  {{
                    getMonsterDisplayNameFromProps
                      ? getMonsterDisplayNameFromProps(displayMonsters[index - 1])
                      : displayMonsters[index - 1]?.name || '未知怪物'
                  }}
                </span>
                <span class="enemy-level">Lv.{{ displayMonsters[index - 1].level }}</span>
                <img
                  v-if="getMonsterElementIcon(displayMonsters[index - 1])"
                  class="enemy-element-icon"
                  :src="getMonsterElementIcon(displayMonsters[index - 1])"
                  :alt="getMonsterElementAlt(displayMonsters[index - 1])"
                  draggable="false"
                  @error="handleElementIconError"
                />
              </div>
            </div>
            <!-- 下部：血条铺满（Canvas 独占渲染，DOM 仅保留锚点用于布局测量） -->
            <div
              ref="healthBarAnchorRefs"
              class="health-bar health-bar-canvas-anchor"
              :data-target-index="index - 1"
            ></div>
            <!-- DEBUFF图标区域：已迁移至 Canvas renderOverlayFrame 绘制，不再使用 DOM 响应式绑定 -->
          </div>
          <div v-else-if="!displayMonsters[index - 1]" class="enemy-placeholder">
            <div class="placeholder-text">等待刷新</div>
          </div>
          <div v-else class="enemy-placeholder is-hidden-placeholder"></div>
          <!-- 魔导士技能特效动画：覆盖在当前 enemy-container 内部，单体技能仅显示在攻击对象范围 -->
          <MageSkillEffect
            v-if="activeMageEffects[index - 1]"
            :key="`mage-effect-${index - 1}-${activeMageEffects[index - 1].key}`"
            :effect-type="activeMageEffects[index - 1].effectType"
            :target-index="index - 1"
          />
        </div>
        <div
          v-for="index in 30 - renderedMonsterDisplayCount"
          :key="`placeholder-${index}`"
          class="enemy-container-placeholder"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import AttackAnimation from './AttackAnimation.vue'
import HitFlashAnimation from './HitFlashAnimation.vue'
import HitEffectAnimation from './HitEffectAnimation.vue'
import BerserkAnimation from './BerserkAnimation.vue'
import ArrowRainEffect from './ArrowRainEffect.vue'
import FurySpinEffect from './FurySpinEffect.vue'
import BladeDanceEffect from './BladeDanceEffect.vue'
import IceArrowEffect from './IceArrowEffect.vue'
import FireArrowEffect from './FireArrowEffect.vue'
import EagleSummonEffect from './EagleSummonEffect.vue'
import EagleTornadoEffect from './EagleTornadoEffect.vue'
import StormArrowEffect from './StormArrowEffect.vue'
import GaleRapidFireEffect from './GaleRapidFireEffect.vue'
import BowAttackEffect from './BowAttackEffect.vue'
import MageSkillEffect from './MageSkillEffect.vue'
import { useMonstersStore } from '@/store/monsters'
import { ELEMENT_NAMES } from '@/store/descriptions'

export default {
  name: 'MonsterInfoPanel',
  components: {
    AttackAnimation,
    HitFlashAnimation,
    HitEffectAnimation,
    BerserkAnimation,
    ArrowRainEffect,
    FurySpinEffect,
BladeDanceEffect,
IceArrowEffect,
    FireArrowEffect,
    EagleSummonEffect,
    EagleTornadoEffect,
    StormArrowEffect,
    GaleRapidFireEffect,
    BowAttackEffect,
    MageSkillEffect
  },
  props: {
    showMonsters: {
      type: Boolean,
      required: true
    },
    monsterDisplayCount: {
      type: Number,
      required: true
    },
    monsters: {
      type: Array,
      required: true
    },
    uiDamageNumbers: {
      type: Array,
      required: false,
      default: () => []
    },
    uiDamageBuckets: {
      type: Object,
      required: false,
      default: null
    },
    getMonsterDisplayNameFromProps: {
      type: Function,
      required: false,
      default: null
    },
    autoBattle: {
      type: Boolean,
      required: false,
      default: false
    },
    /** 是否触发箭雨特效动画 */
    triggerArrowRain: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ['attackMonster', 'handleMonsterImageError', 'showMonsterDropsPanel', 'arrowRainAnimationDone'],
  data () {
    return {
      monstersStore: useMonstersStore(),
      monsterHitStates: {},
      monsterSkillHitStates: {},
      monsterAttackingStates: {},
      /** 受击特效触发标志：index -> boolean，每次从false变true触发一次HitEffectAnimation */
      monsterHitEffectTriggers: {},
      /** 受击特效伤害类型：index -> 'normal'|'skill'|'critical'|'dot' */
      monsterHitEffectTypes: {},
      seenDamageNumberIds: new Set(),
      renderedMonsterDisplayCount: Math.max(0, Math.min(Number(this.monsterDisplayCount) || 0, 30)),
      displayCountRafId: null,
      overlayRafId: 0,
      overlayIsRendering: false,
      overlayResizeObserver: null,
      overlayResizeRafId: 0,
      overlayDevicePixelRatio: 1,
      overlayCanvasSize: { width: 0, height: 0 },
      overlayLayout: {
        healthBarRects: Array(30).fill(null),
        enemyContainerOffsets: Array(30).fill(null),
        measuredAt: 0
      },
      overlayLayoutDirty: true,
      /** 是否显示箭雨特效 */
      showArrowRainEffect: false,
      /** 箭雨特效的key，每次递增以触发重新挂载 */
      arrowRainKey: 0,
      /** 是否显示怒焰回旋特效 */
      showFurySpinEffect: false,
      /** 怒焰回旋特效的key，每次递增以触发重新挂载 */
      furySpinKey: 0,
/** 是否显示刀剑乱舞特效 */
showBladeDanceEffect: false,
/** 刀剑乱舞特效的key，每次递增以触发重新挂载 */
bladeDanceKey: 0,
/** 刀剑乱舞特效的定时器 */
bladeDanceTimer: null,
/** 是否显示冰箭特效 */
showIceArrowEffect: false,
/** 冰箭特效的key，每次递增以触发重新挂载 */
iceArrowKey: 0,
/** 冰箭特效的定时器 */
iceArrowTimer: null,
/** 是否显示火焰箭矢特效 */
showFireArrowEffect: false,
/** 火焰箭矢特效的key，每次递增以触发重新挂载 */
fireArrowKey: 0,
/** 火焰箭矢特效的定时器 */
fireArrowTimer: null,
/** 是否显示神鹰降临召唤物 */
showEagleSummonEffect: false,
/** 神鹰降临召唤物的key，每次递增以触发重新挂载 */
eagleSummonKey: 0,
/** 神鹰降临召唤物的持续时间（毫秒） */
eagleSummonDuration: 60000,
/** 神鹰降临召唤物的攻击间隔（毫秒） */
eagleSummonAttackInterval: 1500,
/** 神鹰降临召唤物的属性数据（攻击/防御/生命/魔法等） */
eagleSummonStats: null,
/** 神鹰降临召唤物的属性继承百分比 */
eagleSummonStatRatio: 0,
/** 神鹰降临召唤物的技能熟练度等级 */
eagleSummonSkillLevel: 0,
/** 是否显示神鹰-寂灭龙卷风特效 */
showEagleTornadoEffect: false,
/** 神鹰-寂灭龙卷风特效的key，每次递增以触发重新挂载 */
eagleTornadoKey: 0,
/** 神鹰-寂灭龙卷风特效的定时器 */
eagleTornadoTimer: null,
/** 是否显示暴风箭矢特效 */
showStormArrowEffect: false,
/** 暴风箭矢特效的key，每次递增以触发重新挂载 */
stormArrowKey: 0,
/** 暴风箭矢特效的定时器 */
stormArrowTimer: null,
/** 是否显示狂风连射特效 */
showGaleRapidFireEffect: false,
/** 狂风连射特效的key，每次递增以触发重新挂载 */
galeRapidFireKey: 0,
/** 狂风连射特效的定时器 */
galeRapidFireTimer: null,
/** 狂风连射特效的目标怪物索引 */
galeRapidFireTargetIndex: 0,
/** 狂风连射特效的箭矢数量 */
galeRapidFireArrowCount: 5,
/** 是否显示弓箭普通攻击特效 */
showBowAttackEffect: false,
/** 弓箭普通攻击特效的key，每次递增以触发重新挂载 */
bowAttackKey: 0,
/** 弓箭普通攻击特效的定时器 */
bowAttackTimer: null,
/** 弓箭普通攻击特效的目标怪物索引 */
bowAttackTargetIndex: 0,
/** 弓箭普通攻击特效的元素属性 */
bowAttackElement: 'none',
      /** 魔导士技能特效状态映射：{ [targetIndex]: { skillId, key } } */
      activeMageEffects: {},
      /** 魔导士技能特效定时器映射：{ [targetIndex]: timerId } */
      mageEffectTimers: {},
      /** Canvas debuff 图标 Image 缓存（src -> HTMLImageElement），避免每帧重复创建 */
      debuffIconCache: null
    }
  },
  computed: {
    displayMonsters () {
      // Vue 细粒度响应式：直接读取 monstersStore.monstersUiSnapshot
      // 当单个怪物的 isDefeated/isFading/isHidden/isBerserk 变化时自动重算
      const storeSnapshot = this.monstersStore?.monstersUiSnapshot
      if (Array.isArray(storeSnapshot) && storeSnapshot.length >= 0) {
        return storeSnapshot
      }

      // Fallback：当 store 不可用时从 props 构建简化快照（仅静态 + 低频字段）
      const list = Array.isArray(this.monsters) ? this.monsters : []
      const output = new Array(list.length)
      for (let i = 0; i < list.length; i++) {
        const monster = list[i]
        if (!monster) {
          output[i] = null
          continue
        }

        output[i] = {
          index: Number.isFinite(Number(monster.index)) ? Number(monster.index) : i,
          id: monster.id,
          name: monster.name || '未知怪物',
          level: Number(monster.level) || 1,
          icon: monster.icon,
          rank: monster.rank,
          element: monster.element,
          isHidden: monster.isHidden === true,
          isFading: monster.isFading === true,
          isDefeated: monster.isDefeated === true,
          defeatedAt: Number.isFinite(Number(monster.defeatedAt)) ? Number(monster.defeatedAt) : null,
          isBerserk: monster.isBerserk === true,
          berserkThresholdHP: Number(monster.berserkThresholdHP) || 0,
          berserkAttackPower: Number(monster.berserkAttackPower) || 0,
          berserkActivatedAt: Number.isFinite(Number(monster.berserkActivatedAt)) ? Number(monster.berserkActivatedAt) : null
        }
      }

      return output
    },
    uiDamageNumbersSignature () {
      const list = this.uiDamageNumbers
      if (!Array.isArray(list) || list.length === 0) {
        return '0'
      }

      const last = list[list.length - 1]
      const lastId = last?.id ?? ''
      const lastCreatedAt = last?.createdAt ?? last?.timestamp ?? ''
      return `${list.length}|${String(lastId)}|${String(lastCreatedAt)}`
    }
  },
  watch: {
    showMonsters: {
      handler (nextVal) {
        if (!nextVal) {
          this.stopOverlayLoop()
          return
        }
        this.overlayLayoutDirty = true
        this.scheduleOverlayRender()
      },
      immediate: true
    },
    displayMonsters: {
      handler () {
        // 怪物状态变化时，DOM 布局可能已改变，标记布局脏位
        this.overlayLayoutDirty = true
        this.scheduleOverlayRender()
      },
      immediate: true
    },
    autoBattle: {
      handler () {},
      immediate: true
    },
    monsterDisplayCount: {
      handler (newVal, oldVal) {
        const nextTarget = Math.max(0, Math.min(Number(newVal) || 0, 30))
        const prevValue = Math.max(0, Math.min(Number(oldVal) || 0, 30))

        if (!Number.isFinite(nextTarget)) {
          return
        }

        if (this.displayCountRafId) {
          cancelAnimationFrame(this.displayCountRafId)
          this.displayCountRafId = null
        }

        if (nextTarget <= prevValue) {
          this.renderedMonsterDisplayCount = nextTarget
          this.overlayLayoutDirty = true
          this.scheduleOverlayRender()
          return
        }

        const step = () => {
          const current = Number(this.renderedMonsterDisplayCount) || 0
          const remaining = nextTarget - current
          if (remaining <= 0) {
            this.displayCountRafId = null
            this.renderedMonsterDisplayCount = nextTarget
            this.overlayLayoutDirty = true
            this.scheduleOverlayRender()
            return
          }

          const increment = remaining >= 20 ? 6 : remaining >= 10 ? 4 : 2
          this.renderedMonsterDisplayCount = Math.min(nextTarget, current + increment)
          this.overlayLayoutDirty = true
          this.scheduleOverlayRender()
          this.displayCountRafId = requestAnimationFrame(step)
        }

        this.displayCountRafId = requestAnimationFrame(step)
      },
      immediate: true
    },
    uiDamageNumbersSignature: {
      handler () {
        this.scheduleOverlayRender()
        const list = this.uiDamageNumbers
        if (!Array.isArray(list)) {
          this.seenDamageNumberIds = new Set()
          return
        }

        if (list.length === 0) {
          this.seenDamageNumberIds = new Set()
          return
        }

        const seen = this.seenDamageNumberIds instanceof Set ? this.seenDamageNumberIds : new Set()
        const freshDamageNumbers = []
        for (let i = 0; i < list.length; i += 1) {
          const damageNumber = list[i]
          const id = damageNumber?.id
          if (id === undefined || id === null) {
            continue
          }
          if (seen.has(id)) {
            continue
          }
          seen.add(id)
          freshDamageNumbers.push(damageNumber)
        }
        this.seenDamageNumberIds = seen

        if (seen.size > 240) {
          const tail = list.slice(Math.max(0, list.length - 120))
          const nextSeen = new Set()
          tail.forEach(entry => {
            const id = entry?.id
            if (id !== undefined && id !== null) {
              nextSeen.add(id)
            }
          })
          this.seenDamageNumberIds = nextSeen
        }

        if (freshDamageNumbers.length === 0) {
          return
        }

        const hitMonsters = new Set()
        const skillHitMonsters = new Set()
        freshDamageNumbers.forEach(damageNumber => {
          const targetIndex = Number(damageNumber?.targetIndex ?? -1)
          if (targetIndex < 0) {
            return
          }
          if (!damageNumber.isMiss && damageNumber.damage > 0) {
            if (damageNumber.skill) {
              skillHitMonsters.add(targetIndex)
            }
            hitMonsters.add(targetIndex)
            // 根据伤害数字判断伤害类型，设置受击特效类型
            const isCritical = Boolean(damageNumber.isCritical)
            const isSkill = Boolean(damageNumber.skill)
            const text = String(damageNumber.text || '')
            const isDot = text === 'dot' || text === 'DOT'
            if (isCritical) {
              this.monsterHitEffectTypes[targetIndex] = 'critical'
            } else if (isDot) {
              this.monsterHitEffectTypes[targetIndex] = 'dot'
            } else if (isSkill) {
              this.monsterHitEffectTypes[targetIndex] = 'skill'
            } else {
              this.monsterHitEffectTypes[targetIndex] = 'normal'
            }
          }
        })
        skillHitMonsters.forEach(index => {
          this.triggerMonsterSkillHit(index)
        })
        hitMonsters.forEach(index => {
          this.triggerMonsterHit(index)
        })
      },
      immediate: true
    },
    uiDamageBuckets: {
      handler () {
        this.scheduleOverlayRender()
      },
      immediate: true
    },
    /** 监听箭雨触发prop，从false变true时启动箭雨特效动画（兼容prop方式触发） */
    triggerArrowRain: {
      handler (newVal, oldVal) {
        if (newVal && !oldVal) {
          this.playArrowRainEffect()
        }
      },
      immediate: false
    }
  },
  beforeUnmount () {
    // 移除箭雨特效全局事件监听
    window.removeEventListener('skill-arrow-rain', this.handleArrowRainEvent)
    // 移除怒焰回旋特效全局事件监听
    window.removeEventListener('skill-fury-spin', this.handleFurySpinEvent)
// 移除刀剑乱舞特效全局事件监听
window.removeEventListener('skill-blade-dance', this.handleBladeDanceEvent)
// 移除冰箭特效全局事件监听
window.removeEventListener('skill-ice-arrow', this.handleIceArrowEvent)
// 移除火焰箭矢特效全局事件监听
window.removeEventListener('skill-fire-arrow', this.handleFireArrowEvent)
// 移除神鹰降临特效全局事件监听
window.removeEventListener('eagle-summon-activate', this.handleEagleSummonEvent)
window.removeEventListener('eagle-summon-disperse', this.handleEagleDisperseEvent)
// 移除神鹰-寂灭龙卷风特效全局事件监听
window.removeEventListener('skill-eagle-tornado', this.handleEagleTornadoEvent)
// 移除暴风箭矢特效全局事件监听
window.removeEventListener('skill-storm-arrow', this.handleStormArrowEvent)
// 移除狂风连射特效全局事件监听
window.removeEventListener('skill-gale-rapid-fire', this.handleGaleRapidFireEvent)
// 移除弓箭普通攻击特效全局事件监听
window.removeEventListener('bow-normal-attack', this.handleBowAttackEvent)
// 移除魔导士技能特效全局事件监听
    window.removeEventListener('mage-skill-effect', this.handleMageSkillEffectEvent)
    // 清理所有魔导士技能特效定时器
    if (this.mageEffectTimers) {
      for (const key in this.mageEffectTimers) {
        if (this.mageEffectTimers[key]) {
          clearTimeout(this.mageEffectTimers[key])
        }
      }
      this.mageEffectTimers = {}
    }
    if (this.arrowRainTimer) {
      clearTimeout(this.arrowRainTimer)
      this.arrowRainTimer = null
    }
    if (this.furySpinTimer) {
      clearTimeout(this.furySpinTimer)
      this.furySpinTimer = null
    }
if (this.bladeDanceTimer) {
clearTimeout(this.bladeDanceTimer)
this.bladeDanceTimer = null
}
if (this.iceArrowTimer) {
clearTimeout(this.iceArrowTimer)
this.iceArrowTimer = null
}
if (this.fireArrowTimer) {
clearTimeout(this.fireArrowTimer)
this.fireArrowTimer = null
}
if (this.eagleSummonTimer) {
clearTimeout(this.eagleSummonTimer)
this.eagleSummonTimer = null
}
if (this.eagleTornadoTimer) {
clearTimeout(this.eagleTornadoTimer)
this.eagleTornadoTimer = null
}
if (this.stormArrowTimer) {
clearTimeout(this.stormArrowTimer)
this.stormArrowTimer = null
}
if (this.bowAttackTimer) {
clearTimeout(this.bowAttackTimer)
this.bowAttackTimer = null
}
if (this.displayCountRafId) {
      cancelAnimationFrame(this.displayCountRafId)
      this.displayCountRafId = null
    }
    if (this.overlayResizeRafId) {
      cancelAnimationFrame(this.overlayResizeRafId)
      this.overlayResizeRafId = 0
    }
    if (this.overlayResizeObserver) {
      this.overlayResizeObserver.disconnect()
      this.overlayResizeObserver = null
    }
    window.removeEventListener('resize', this.handleOverlayResize)
    this.stopOverlayLoop()
  },
  mounted () {
    this.overlayDevicePixelRatio = window.devicePixelRatio || 1
    window.addEventListener('resize', this.handleOverlayResize, { passive: true })
    // 注册箭雨特效全局事件监听
    this.handleArrowRainEvent = () => {
      this.playArrowRainEffect()
    }
    window.addEventListener('skill-arrow-rain', this.handleArrowRainEvent)

    // 注册怒焰回旋特效全局事件监听
    this.handleFurySpinEvent = () => {
      this.playFurySpinEffect()
    }
    window.addEventListener('skill-fury-spin', this.handleFurySpinEvent)

    // 注册刀剑乱舞特效全局事件监听
    this.handleBladeDanceEvent = () => {
      this.playBladeDanceEffect()
    }
window.addEventListener('skill-blade-dance', this.handleBladeDanceEvent)

// 注册冰箭特效全局事件监听
this.handleIceArrowEvent = () => {
this.playIceArrowEffect()
}
window.addEventListener('skill-ice-arrow', this.handleIceArrowEvent)

// 注册火焰箭矢特效全局事件监听
this.handleFireArrowEvent = () => {
this.playFireArrowEffect()
}
window.addEventListener('skill-fire-arrow', this.handleFireArrowEvent)

// 注册神鹰降临特效全局事件监听
// 事件格式: { detail: { duration, attackInterval, summonStats, statRatio } }
this.handleEagleSummonEvent = (event) => {
  this.playEagleSummonEffect(event?.detail)
}
window.addEventListener('eagle-summon-activate', this.handleEagleSummonEvent)

// 注册神鹰消散事件监听
this.handleEagleDisperseEvent = () => {
  this.disperseEagleSummon()
}
window.addEventListener('eagle-summon-disperse', this.handleEagleDisperseEvent)

// 注册神鹰-寂灭龙卷风特效全局事件监听
this.handleEagleTornadoEvent = () => {
  this.playEagleTornadoEffect()
}
window.addEventListener('skill-eagle-tornado', this.handleEagleTornadoEvent)

// 注册暴风箭矢特效全局事件监听
this.handleStormArrowEvent = () => {
this.playStormArrowEffect()
}
window.addEventListener('skill-storm-arrow', this.handleStormArrowEvent)

// 注册狂风连射特效全局事件监听
// 事件格式: { detail: { targetIndex, arrowCount } }
this.handleGaleRapidFireEvent = (event) => {
const detail = event?.detail || {}
this.playGaleRapidFireEffect(Number(detail.targetIndex) || 0, Number(detail.arrowCount) || 5)
}
window.addEventListener('skill-gale-rapid-fire', this.handleGaleRapidFireEvent)

// 注册弓箭普通攻击特效全局事件监听
// 事件格式: { detail: { targetIndex, element } }
this.handleBowAttackEvent = (event) => {
const detail = event?.detail || {}
this.playBowAttackEffect(Number(detail.targetIndex) || 0, String(detail.element || 'none'))
}
window.addEventListener('bow-normal-attack', this.handleBowAttackEvent)

// 注册魔导士技能特效全局事件监听
    // 事件格式: { detail: { effectType: 'fire', targetIndex: 0, isAOE: false } }
    this.handleMageSkillEffectEvent = (event) => {
      const detail = event?.detail || {}
      const effectType = String(detail.effectType || '')
      const targetIndex = Number.isInteger(detail.targetIndex) ? detail.targetIndex : 0
      const isAOE = Boolean(detail.isAOE)
      if (effectType) {
        this.playMageEffect(effectType, targetIndex, isAOE)
      }
    }
    window.addEventListener('mage-skill-effect', this.handleMageSkillEffectEvent)

    const container = this.$el?.querySelector?.('.multi-monster-container')
    if (container && typeof window.ResizeObserver === 'function') {
      this.overlayResizeObserver = new ResizeObserver(() => {
        if (this.overlayResizeRafId) {
          cancelAnimationFrame(this.overlayResizeRafId)
        }
        this.overlayResizeRafId = requestAnimationFrame(() => {
          this.overlayResizeRafId = 0
          this.overlayLayoutDirty = true
          this.scheduleOverlayRender()
        })
      })
      this.overlayResizeObserver.observe(container)
    }
    this.scheduleOverlayRender()
  },
  methods: {
    /**
     * 根据怪物 rank 获取名称显示颜色
     * @param {string} rank - 怪物等级类型
     * @returns {string} CSS 颜色值
     */
    getMonsterRankColor (rank) {
      return this.monstersStore?.getMonsterRankColor?.(rank) || 'rgb(255, 255, 255)'
    },
    /**
     * 检查怪物是否存活（从 vitals TypedArray 读取，非响应式，不触发 Vue 重渲染）
     * @param {number} index - 怪物索引
     * @returns {boolean} 是否存活
     */
    isMonsterAlive (index) {
      const vitals = this.monstersStore?.monsterVitals
      if (vitals && index >= 0 && index < vitals.size) {
        return vitals.currentHealth[index] > 0 && vitals.isDefeated[index] !== 1
      }
      const monster = this.displayMonsters?.[index]
      return Boolean(monster && !monster.isDefeated)
    },
    attackMonster (index) {
      if (this.autoBattle) {
        return
      }
      this.$emit('attackMonster', index)
    },
    handleMonsterImageError (monster) {
      this.$emit('handleMonsterImageError', monster)
    },
    showMonsterDropsPanel (monsterId, event) {
      if (this.autoBattle) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault()
        }
        if (event && typeof event.stopPropagation === 'function') {
          event.stopPropagation()
        }
        return
      }
      this.$emit('showMonsterDropsPanel', monsterId, event)
    },
    hasRecentHit (index) {
      return this.monsterHitStates[index] || false
    },
    hasRecentSkillHit (index) {
      return this.monsterSkillHitStates[index] || false
    },
    triggerMonsterHit (index) {
      if (!this.monsterHitStates[index]) {
        this.monsterHitStates[index] = true
        setTimeout(() => {
          this.monsterHitStates[index] = false
        }, 300)
      }
      // 受击位移动画0.3s后播放受击特效
      setTimeout(() => {
        this.monsterHitEffectTriggers[index] = true
        setTimeout(() => {
          this.monsterHitEffectTriggers[index] = false
        }, 50)
      }, 300)
    },
    triggerMonsterSkillHit (index) {
      if (!this.monsterSkillHitStates[index]) {
        this.monsterSkillHitStates[index] = true
        setTimeout(() => {
          this.monsterSkillHitStates[index] = false
        }, 300)
      }
      // 技能受击：设置伤害类型后延迟播放受击特效
      if (!this.monsterHitEffectTypes[index] || this.monsterHitEffectTypes[index] === 'normal') {
        this.monsterHitEffectTypes[index] = 'skill'
      }
      setTimeout(() => {
        this.monsterHitEffectTriggers[index] = true
        setTimeout(() => {
          this.monsterHitEffectTriggers[index] = false
        }, 50)
      }, 300)
    },
    hasRecentAttack (index) {
      return this.monsterAttackingStates[index] || false
    },
    /**
     * 检查怪物是否处于击晕状态
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否击晕中
     */
    isMonsterStunned (monster) {
      if (!monster || !monster.stunDebuff) {
        return false
      }
      const stunDebuff = monster.stunDebuff
      if (!stunDebuff.active) {
        return false
      }
      const now = Date.now()
      const expiresAt = Number(stunDebuff.expiresAt) || 0
      return expiresAt > now
    },
    /**
     * 击晕星星图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleStunIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有碎甲DEBUFF
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有碎甲效果
     */
    hasArmorBreakDebuff (monster) {
      if (!monster || !monster.armorBreakDebuff) {
        return false
      }
      const debuff = monster.armorBreakDebuff
      if (!debuff.active) {
        return false
      }
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      return expiresAt > now
    },
    /**
     * 获取碎甲DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getArmorBreakIcon (monster) {
      if (!monster || !monster.armorBreakDebuff) {
        return '/pt/skill_icon/knttaxpaidea.png'
      }
      const debuff = monster.armorBreakDebuff
      // 优先使用DEBUFF中存储的图标，否则使用默认图标
      return debuff.icon || '/pt/skill_icon/knttaxpaidea.png'
    },
    /**
     * 碎甲图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleArmorBreakIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有双倍惩戒DEBUFF
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有双倍惩戒效果
     */
    hasDoubleJudgmentDebuff (monster) {
      if (!monster || !monster.doubleJudgmentDebuff) {
        return false
      }
      const debuff = monster.doubleJudgmentDebuff
      if (!debuff.active) {
        return false
      }
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      return expiresAt > now
    },
    /**
     * 获取双倍惩戒DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getDoubleJudgmentIcon (monster) {
      if (!monster || !monster.doubleJudgmentDebuff) {
        return '/pt/skill_icon/rinsupcross.png'
      }
      const debuff = monster.doubleJudgmentDebuff
      return debuff.icon || '/pt/skill_icon/rinsupcross.png'
    },
    /**
     * 双倍惩戒图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleDoubleJudgmentIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有命中率降低DEBUFF（夜幕降临等）
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有命中率降低效果
     */
    hasHitRateReductionDebuff (monster) {
      if (!monster || !monster.hitRateReductionDebuff) {
        return false
      }
      const debuff = monster.hitRateReductionDebuff
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      const isValid = expiresAt > now
      return isValid
    },
    /**
     * 获取命中率降低DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getHitRateReductionIcon (monster) {
      if (!monster || !monster.hitRateReductionDebuff) {
        return '/pt/skill_icon/blddaxhawatt.png'
      }
      const debuff = monster.hitRateReductionDebuff
      return debuff.icon || '/pt/skill_icon/blddaxhawatt.png'
    },
    /**
     * 命中率降低图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleHitRateReductionIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有攻击速度降低DEBUFF（狂风怒吼等）
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有攻击速度降低效果
     */
    hasAttackSpeedReductionDebuff (monster) {
      if (!monster || !monster.attackSpeedDebuff) {
        return false
      }
      const debuff = monster.attackSpeedDebuff
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      return expiresAt > now
    },
    /**
     * 获取攻击速度降低DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getAttackSpeedReductionIcon (monster) {
      if (!monster || !monster.attackSpeedDebuff) {
        return '/pt/skill_icon/elewinwinfil.png'
      }
      const debuff = monster.attackSpeedDebuff
      return debuff.icon || '/pt/skill_icon/elewinwinfil.png'
    },
    /**
     * 攻击速度降低图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleAttackSpeedReductionIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有活跃的DOT效果
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有活跃的DOT效果
     */
    hasActiveDotEffects (monster) {
      if (!monster || !Array.isArray(monster.dotEffects)) {
        return false
      }
      const now = Date.now()
      return monster.dotEffects.some(dot => {
        const startTime = Number(dot.startTime) || 0
        const duration = Number(dot.duration) || 0
        return startTime > 0 && duration > 0 && (startTime + duration * 1000) > now
      })
    },
    /**
     * 获取怪物所有活跃的DOT效果
     * @param {Object} monster - 怪物对象
     * @returns {Array} 活跃的DOT效果数组
     */
    getActiveDotEffects (monster) {
      if (!monster || !Array.isArray(monster.dotEffects)) {
        return []
      }
      const now = Date.now()
      return monster.dotEffects.filter(dot => {
        const startTime = Number(dot.startTime) || 0
        const duration = Number(dot.duration) || 0
        return startTime > 0 && duration > 0 && (startTime + duration * 1000) > now
      })
    },
    /**
     * DOT效果图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleDotEffectIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有暴击伤害降低DEBUFF（风雷聚集等）
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有暴击伤害降低效果
     */
    hasCritDamageReductionDebuff (monster) {
      if (!monster || !monster.critDamageReductionDebuff) {
        return false
      }
      const debuff = monster.critDamageReductionDebuff
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      return expiresAt > now
    },
    /**
     * 获取暴击伤害降低DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getCritDamageReductionIcon (monster) {
      if (!monster || !monster.critDamageReductionDebuff) {
        return '/pt/skill_icon/elemullgtstm.png'
      }
      const debuff = monster.critDamageReductionDebuff
      return debuff.icon || '/pt/skill_icon/elemullgtstm.png'
    },
    /**
     * 暴击伤害降低图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleCritDamageReductionIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 检查怪物是否有攻击力降低DEBUFF（赛乐的祝福）
     * @param {Object} monster - 怪物对象
     * @returns {boolean} 是否有攻击力降低效果
     */
    hasAttackReductionDebuff (monster) {
      if (!monster || !monster.attackReductionDebuff) {
        return false
      }
      const debuff = monster.attackReductionDebuff
      const now = Date.now()
      const expiresAt = Number(debuff.expiresAt) || 0
      // 不检查active字段，只检查时间
      return expiresAt > now
    },
    /**
     * 获取攻击力降低DEBUFF的图标
     * @param {Object} monster - 怪物对象
     * @returns {string} 图标路径
     */
    getAttackReductionIcon (monster) {
      if (!monster || !monster.attackReductionDebuff) {
        return '/pt/skill_icon/psygravitywell.png'
      }
      const debuff = monster.attackReductionDebuff
      return debuff.icon || '/pt/skill_icon/psygravitywell.png'
    },
    /**
     * 攻击力降低图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleAttackReductionIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 显示命中率降低DEBUFF的提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showHitRateReductionTooltip (event, monster) {
      if (!monster || !monster.hitRateReductionDebuff) {
        return
      }
      const debuff = monster.hitRateReductionDebuff
      const value = Number(debuff.value) || 0
      const skillName = debuff.skillName || '未知技能'
      const remainingTime = Math.max(0, Math.ceil((Number(debuff.expiresAt) - Date.now()) / 1000))

      // 创建提示元素（与其他DEBUFF提示一致的方式）
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为深蓝色主题（命中率降低）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(20, 40, 80, 0.95), rgba(10, 20, 60, 0.95))'
      tooltipEl.style.border = '2px solid #2196f3'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">${skillName}</div>
        <div class="tooltip-desc">命中率降低 ${value}%</div>
        <div class="tooltip-time">剩余时间: ${remainingTime}秒</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示攻击速度降低DEBUFF的提示（狂风怒吼等）
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showAttackSpeedReductionTooltip (event, monster) {
      if (!monster || !monster.attackSpeedDebuff) {
        return
      }
      const debuff = monster.attackSpeedDebuff
      const value = Number(debuff.value) || 0
      const skillName = debuff.skillName || debuff.source || '未知技能'
      const remainingTime = Math.max(0, Math.ceil((Number(debuff.expiresAt) - Date.now()) / 1000))

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为青色主题（攻击速度降低）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(20, 60, 60, 0.95), rgba(10, 40, 40, 0.95))'
      tooltipEl.style.border = '2px solid #00bcd4'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(0, 188, 212, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">${skillName}</div>
        <div class="tooltip-desc">攻击速度降低 ${value}%</div>
        <div class="tooltip-time">剩余时间: ${remainingTime}秒</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示暴击伤害降低DEBUFF的提示（风雷聚集等）
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showCritDamageReductionTooltip (event, monster) {
      if (!monster || !monster.critDamageReductionDebuff) {
        return
      }
      const debuff = monster.critDamageReductionDebuff
      const value = Number(debuff.value) || 0
      const skillName = debuff.skillName || debuff.source || '未知技能'
      const remainingTime = Math.max(0, Math.ceil((Number(debuff.expiresAt) - Date.now()) / 1000))

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为紫色主题（暴击伤害降低）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(60, 20, 80, 0.95), rgba(40, 10, 60, 0.95))'
      tooltipEl.style.border = '2px solid #9c27b0'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">${skillName}</div>
        <div class="tooltip-desc">暴击伤害降低 ${value}%</div>
        <div class="tooltip-time">剩余时间: ${remainingTime}秒</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示攻击力降低DEBUFF的提示（赛乐的祝福）
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showAttackReductionTooltip (event, monster) {
      if (!monster || !monster.attackReductionDebuff) {
        return
      }
      const debuff = monster.attackReductionDebuff
      const value = Number(debuff.value) || 0
      const skillName = debuff.skillName || debuff.source || '未知技能'
      const remainingTime = Math.max(0, Math.ceil((Number(debuff.expiresAt) - Date.now()) / 1000))

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为红色主题（攻击力降低）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(80, 20, 20, 0.95), rgba(60, 10, 10, 0.95))'
      tooltipEl.style.border = '2px solid #e74c3c'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">${skillName}</div>
        <div class="tooltip-desc">攻击力降低 ${value}%</div>
        <div class="tooltip-time">剩余时间: ${remainingTime}秒</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示狂暴状态提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showBerserkTooltip (event, monster) {
      if (!monster || !monster.isBerserk) {
        return
      }
      const berserkPower = Number(monster.berserkAttackPower) || 0
      const threshold = Number(monster.berserkThresholdHP) || 0

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为深红色主题（狂暴）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(100, 10, 10, 0.95), rgba(60, 5, 5, 0.95))'
      tooltipEl.style.border = '2px solid #ff0000'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.6)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title berserk-title">狂暴</div>
        <div class="tooltip-desc">攻击力提升 ${berserkPower}%</div>
        <div class="tooltip-hint">血量低于 ${threshold}% 时触发</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 狂暴图标加载失败处理
     * @param {Event} event - 图片加载错误事件
     */
    handleBerserkIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }
      img.style.display = 'none'
    },
    /**
     * 显示DOT效果悬停提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     * @param {Object} dotEffect - DOT效果对象
     */
    showDotEffectTooltip (event, monster, dotEffect) {
      if (!monster || !dotEffect) {
        return
      }

      const dotName = dotEffect.name || '持续伤害'
      const damage = Number(dotEffect.damage) || 0
      const tickInterval = Number(dotEffect.tickInterval) || 1
      const remainingTime = Math.max(0, Math.ceil((Number(dotEffect.startTime) + Number(dotEffect.duration) * 1000 - Date.now()) / 1000))
      const ticksRemaining = Math.ceil(remainingTime / tickInterval)

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为火红色主题（DOT伤害）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(80, 20, 20, 0.95), rgba(60, 10, 10, 0.95))'
      tooltipEl.style.border = '2px solid #ff5722'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">${dotName}</div>
        <div class="tooltip-desc">每${tickInterval}秒造成 ${damage} 点伤害</div>
        <div class="tooltip-time">剩余时间: ${remainingTime}秒 (${ticksRemaining}次)</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示双倍惩戒DEBUFF悬停提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showDoubleJudgmentTooltip (event, monster) {
      if (!monster || !monster.doubleJudgmentDebuff) {
        return
      }
      const debuff = monster.doubleJudgmentDebuff
      const multiplier = debuff.damageMultiplier || 2

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为紫色主题（双倍惩戒）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(60, 20, 80, 0.95), rgba(40, 10, 60, 0.95))'
      tooltipEl.style.border = '2px solid #9c27b0'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title">双倍惩戒</div>
        <div class="tooltip-desc">下次被击中时伤害翻倍 (×${multiplier})</div>
        <div class="tooltip-hint">击中后效果消失</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示击晕DEBUFF悬停提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showStunTooltip (event, monster) {
      if (!monster || !monster.stunDebuff) {
        return
      }
      const debuff = monster.stunDebuff
      const duration = debuff.duration || 0
      const source = debuff.source || '未知技能'
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((debuff.expiresAt - now) / 1000))

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为金色主题（击晕）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(80, 60, 20, 0.95), rgba(60, 40, 10, 0.95))'
      tooltipEl.style.border = '2px solid #ffd700'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title stun-title">击晕</div>
        <div class="tooltip-desc">目标被击晕，无法行动</div>
        <div class="tooltip-desc">持续时间: ${duration} 秒</div>
        <div class="tooltip-hint">剩余: ${remaining} 秒 | 来源: ${source}</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 显示碎甲DEBUFF悬停提示
     * @param {MouseEvent} event - 鼠标事件
     * @param {Object} monster - 怪物对象
     */
    showArmorBreakTooltip (event, monster) {
      if (!monster || !monster.armorBreakDebuff) {
        return
      }
      const debuff = monster.armorBreakDebuff
      const defenseReduction = debuff.defenseReduction || 0
      const damageIncrease = debuff.damageIncrease || 0
      const duration = debuff.duration || 0
      const source = debuff.source || '碎甲'
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((debuff.expiresAt - now) / 1000))

      // 创建提示元素
      let tooltipEl = document.getElementById('debuff-tooltip')
      if (!tooltipEl) {
        tooltipEl = document.createElement('div')
        tooltipEl.id = 'debuff-tooltip'
        tooltipEl.className = 'debuff-tooltip'
        document.body.appendChild(tooltipEl)
      }

      // 设置为橙色主题（碎甲）
      tooltipEl.style.background = 'linear-gradient(135deg, rgba(80, 40, 10, 0.95), rgba(60, 30, 5, 0.95))'
      tooltipEl.style.border = '2px solid #ff9800'
      tooltipEl.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.5)'

      tooltipEl.innerHTML = `
        <div class="tooltip-title armor-break-title">碎甲</div>
        <div class="tooltip-desc">防御力 -${defenseReduction}%</div>
        <div class="tooltip-desc">承受伤害 +${damageIncrease}%</div>
        <div class="tooltip-desc">持续时间: ${duration} 秒</div>
        <div class="tooltip-hint">剩余: ${remaining} 秒 | 来源: ${source}</div>
      `

      // 定位提示框
      const rect = event.target.getBoundingClientRect()
      tooltipEl.style.left = `${rect.left}px`
      tooltipEl.style.top = `${rect.bottom + 5}px`
      tooltipEl.style.display = 'block'
    },
    /**
     * 隐藏DEBUFF悬停提示（通用方法）
     */
    hideDebuffTooltip () {
      const tooltipEl = document.getElementById('debuff-tooltip')
      if (tooltipEl) {
        tooltipEl.style.display = 'none'
      }
    },
    triggerMonsterAttack (index) {
      if (!this.monsterAttackingStates[index]) {
        this.monsterAttackingStates[index] = true
        setTimeout(() => {
          this.monsterAttackingStates[index] = false
        }, 300)
      }
    },
    handleOverlayResize () {
      this.overlayDevicePixelRatio = window.devicePixelRatio || 1
      this.overlayLayoutDirty = true
      this.overlayCanvasSize.width = 0
      this.overlayCanvasSize.height = 0
      this.scheduleOverlayRender()
    },
    scheduleOverlayRender () {
      this.startOverlayLoop()
    },
    startOverlayLoop () {
      if (!this.showMonsters) {
        this.stopOverlayLoop()
        return
      }
      if (this.overlayIsRendering) {
        return
      }
      this.overlayIsRendering = true
      this.overlayRafId = requestAnimationFrame(this.renderOverlayFrame)
    },
    stopOverlayLoop () {
      this.overlayIsRendering = false
      if (this.overlayRafId) {
        cancelAnimationFrame(this.overlayRafId)
        this.overlayRafId = 0
      }
      const canvas = this.$refs.overlayCanvasRef
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    },
    ensureOverlayCanvasSize (canvas, ctx, container) {
      const width = container?.clientWidth || 0
      const height = container?.clientHeight || 0
      if (width <= 0 || height <= 0) {
        return null
      }
      const dpr = this.overlayDevicePixelRatio || 1
      if (
        width !== this.overlayCanvasSize.width ||
        height !== this.overlayCanvasSize.height ||
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.max(1, Math.floor(width * dpr))
        canvas.height = Math.max(1, Math.floor(height * dpr))
        this.overlayCanvasSize.width = width
        this.overlayCanvasSize.height = height
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { width, height }
    },
    measureOverlayLayout () {
      const container = this.$el?.querySelector?.('.multi-monster-container')
      if (!container) {
        return
      }

      const anchors = this.$refs.healthBarAnchorRefs
      const anchorList = Array.isArray(anchors) ? anchors : anchors ? [anchors] : []
      const healthBarRects = Array(30).fill(null)
      const enemyContainerOffsets = Array(30).fill(null)
      for (let i = 0; i < anchorList.length; i++) {
        const el = anchorList[i]
        const targetIndex = Number(el?.dataset?.targetIndex)
        if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= 30) {
          continue
        }
        // 使用 offsetLeft/offsetTop 遍历 offsetParent 链获取布局坐标
        // 不能使用 getBoundingClientRect()，因为 .main-container 有 transform: scale(var(--ui-scale))
        // getBoundingClientRect() 返回的是缩放后的视觉坐标，而 Canvas 绘图坐标系基于未缩放的布局尺寸
        // 会导致绘制坐标 = 布局偏移 × ui_scale，再被祖先 scale 缩放后 = 布局偏移 × ui_scale²（双重缩放）
        let x = 0
        let y = 0
        let current = el
        while (current && current !== container) {
          x += current.offsetLeft || 0
          y += current.offsetTop || 0
          current = current.offsetParent
          if (!current) break
        }
        const width = el.offsetWidth || 0
        const height = el.offsetHeight || 0
        if (width <= 0 || height <= 0) {
          continue
        }
        healthBarRects[targetIndex] = { x, y, width, height }

        const enemyContainer = el.closest ? el.closest('.enemy-container') : null
        if (enemyContainer) {
          enemyContainerOffsets[targetIndex] = {
            x: enemyContainer.offsetLeft || 0,
            y: enemyContainer.offsetTop || 0
          }
        }
      }

      this.overlayLayout = {
        healthBarRects,
        enemyContainerOffsets,
        measuredAt: Date.now()
      }
      this.overlayLayoutDirty = false
    },
    getOverlayAnimationState (damageNumber, progress) {
      const keyframes = damageNumber?.isCritical
        ? [
          { p: 0, y: 0, scale: 1.2, opacity: 1 },
          { p: 0.25, y: -92, scale: 1.62, opacity: 1 },
          { p: 0.32, y: -89, scale: 1.59, opacity: 0.9 },
          { p: 0.4, y: -91, scale: 1.61, opacity: 0.75 },
          { p: 1, y: -116, scale: 1.18, opacity: 0 }
        ]
        : [
          { p: 0, y: 0, scale: 1, opacity: 1 },
          { p: 0.25, y: -62, scale: 1.15, opacity: 0.9 },
          { p: 0.32, y: -59, scale: 1.13, opacity: 0.85 },
          { p: 0.4, y: -61, scale: 1.14, opacity: 0.8 },
          { p: 1, y: -82, scale: 0.85, opacity: 0 }
        ]
      for (let i = 0; i < keyframes.length - 1; i++) {
        const start = keyframes[i]
        const end = keyframes[i + 1]
        if (progress >= start.p && progress <= end.p) {
          const localProgress = (progress - start.p) / (end.p - start.p || 1)
          return {
            translateY: start.y + (end.y - start.y) * localProgress,
            scale: start.scale + (end.scale - start.scale) * localProgress,
            opacity: start.opacity + (end.opacity - start.opacity) * localProgress
          }
        }
      }
      const last = keyframes[keyframes.length - 1]
      return { translateY: last.y, scale: last.scale, opacity: last.opacity }
    },
    getOverlayDamageColor (damageNumber) {
      if (damageNumber?.isHeal || damageNumber?.isMpHeal) {
        return '#22c55e'
      }
      if (damageNumber?.isMiss) {
        return '#e5e7eb'
      }
      if (damageNumber?.isCritical) {
        return '#facc15'
      }
      return '#ffffff'
    },
    renderOverlayFrame () {
      if (!this.overlayIsRendering) {
        return
      }

      const canvas = this.$refs.overlayCanvasRef
      const container = this.$el?.querySelector?.('.multi-monster-container')
      if (!canvas || !container) {
        this.stopOverlayLoop()
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        this.stopOverlayLoop()
        return
      }

      const size = this.ensureOverlayCanvasSize(canvas, ctx, container)
      if (!size) {
        if (!this.showMonsters) {
          this.stopOverlayLoop()
          return
        }
        this.overlayRafId = requestAnimationFrame(this.renderOverlayFrame)
        return
      }

      // 每帧重新测量布局：monsterFadeIn 动画 (transform: translateY+scale) 期间
      // getBoundingClientRect() 返回的是变换后的视觉位置，动画结束后位置会变化，
      // 因此不能仅依赖 overlayLayoutDirty 缓存，必须每帧获取最新坐标
      this.measureOverlayLayout()

      ctx.clearRect(0, 0, size.width, size.height)

      const layout = this.overlayLayout
      const monsters = this.displayMonsters
      const vitals = this.monstersStore?.monsterVitals
      const rawMonsters = this.monstersStore?.currentMonsters
      const displayCount = Math.max(0, Math.min(Number(this.renderedMonsterDisplayCount) || 0, 30))
      const now = Date.now()

      for (let i = 0; i < displayCount; i++) {
        const rect = layout?.healthBarRects?.[i]
        const monster = monsters?.[i]
        if (!rect || !monster || monster.isHidden) {
          continue
        }

        // Canvas-First: 从 vitals TypedArray 读取血量（非响应式，O(1)）
        const maxHealth = vitals && i < vitals.size ? vitals.maxHealth[i] : 0
        const currentHealth = vitals && i < vitals.size ? vitals.currentHealth[i] : 0
        const pct = vitals && i < vitals.size ? vitals.healthPercentage[i] : 0
        const isDefeated = vitals && i < vitals.size ? vitals.isDefeated[i] === 1 : monster.isDefeated
        const fillWidth = (rect.width * pct) / 100

        ctx.save()
        if (monster.isFading && Number.isFinite(Number(monster.defeatedAt))) {
          const fadeProgress = Math.min(
            1,
            Math.max(0, (now - (Number(monster.defeatedAt) + 1000)) / 1000)
          )
          ctx.globalAlpha = Math.max(0, 1 - fadeProgress)
        } else {
          ctx.globalAlpha = isDefeated ? 0.35 : 1
        }
        // 血条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
        // 血条填充
        ctx.fillStyle = 'rgba(255, 68, 68, 0.95)'
        ctx.fillRect(rect.x, rect.y, fillWidth, rect.height)
        // 血条边框
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.lineWidth = 1
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)

        // HP 文字
        const hpText = `${currentHealth}/${maxHealth}`
        ctx.font = '700 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillText(hpText, rect.x + rect.width / 2 + 1, rect.y + rect.height / 2 + 1)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        ctx.fillText(hpText, rect.x + rect.width / 2, rect.y + rect.height / 2)

        // Debuff 图标（从 currentMonsters proxy 读取，非响应式）
        const rawMonster = rawMonsters?.[i]
        if (rawMonster) {
          this.drawDebuffIconsOnCanvas(ctx, rawMonster, rect, now)
        }

        ctx.restore()
      }

      // Canvas-First 连续渲染：每帧请求下一帧以实时显示血量变化
      // stopOverlayLoop() 通过设置 overlayIsRendering = false 来停止循环
      this.overlayRafId = requestAnimationFrame(this.renderOverlayFrame)
    },
    /**
     * 在 Canvas 上绘制怪物 debuff 图标
     * 从 currentMonsters proxy 读取 debuff 状态（写入时使用 toRaw，不触发 Vue 响应式）
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {Object} monster - 怪物 proxy 对象
     * @param {{x:number,y:number,width:number,height:number}} rect - 血条矩形区域
     * @param {number} now - 当前时间戳
     * @returns {void}
     */
    drawDebuffIconsOnCanvas (ctx, monster, rect, now) {
      const iconSize = 16
      const iconSpacing = 2
      const startX = rect.x
      const startY = rect.y + rect.height + 2
      let iconX = startX

      // 狂暴
      if (monster.isBerserk === true) {
        this.drawCachedIcon(ctx, '/pt/UI/berserk_icon.svg', iconX, startY, iconSize)
        iconX += iconSize + iconSpacing
      }

      // 击晕
      if (monster.stunDebuff && monster.stunDebuff.active) {
        const expiresAt = Number(monster.stunDebuff.expiresAt) || 0
        if (expiresAt > now) {
          this.drawCachedIcon(ctx, '/pt/UI/stun_stars.svg', iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 碎甲
      if (monster.armorBreakDebuff && monster.armorBreakDebuff.active) {
        const expiresAt = Number(monster.armorBreakDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.armorBreakDebuff.icon || '/pt/skill_icon/knttaxpaidea.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 双倍惩戒
      if (monster.doubleJudgmentDebuff && monster.doubleJudgmentDebuff.active) {
        const expiresAt = Number(monster.doubleJudgmentDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.doubleJudgmentDebuff.icon || '/pt/skill_icon/rinsupcross.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 命中率降低（夜幕降临）
      if (monster.hitRateReductionDebuff) {
        const expiresAt = Number(monster.hitRateReductionDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.hitRateReductionDebuff.icon || '/pt/skill_icon/blddaxhawatt.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 攻击速度降低（狂风怒吼）
      if (monster.attackSpeedDebuff) {
        const expiresAt = Number(monster.attackSpeedDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.attackSpeedDebuff.icon || '/pt/skill_icon/elewinwinfil.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 暴击伤害降低（风雷聚集）
      if (monster.critDamageReductionDebuff) {
        const expiresAt = Number(monster.critDamageReductionDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.critDamageReductionDebuff.icon || '/pt/skill_icon/elemullgtstm.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // 攻击力降低（赛乐的祝福）
      if (monster.attackReductionDebuff) {
        const expiresAt = Number(monster.attackReductionDebuff.expiresAt) || 0
        if (expiresAt > now) {
          const icon = monster.attackReductionDebuff.icon || '/pt/skill_icon/psygravitywell.png'
          this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
          iconX += iconSize + iconSpacing
        }
      }

      // DOT 效果（陨石坠落等）
      if (Array.isArray(monster.dotEffects)) {
        for (let j = 0; j < monster.dotEffects.length; j++) {
          const dot = monster.dotEffects[j]
          if (!dot) continue
          const startTime = Number(dot.startTime) || 0
          const duration = Number(dot.duration) || 0
          if (startTime > 0 && duration > 0 && (startTime + duration * 1000) > now) {
            const icon = dot.icon || '/pt/skill_icon/default_dot.png'
            this.drawCachedIcon(ctx, icon, iconX, startY, iconSize)
            iconX += iconSize + iconSpacing
          }
        }
      }
    },
    /**
     * 绘制缓存的 debuff 图标（使用 Image 缓存避免每帧重复加载）
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {string} src - 图标路径
     * @param {number} x - 绘制 X 坐标
     * @param {number} y - 绘制 Y 坐标
     * @param {number} size - 图标尺寸
     * @returns {void}
     */
    drawCachedIcon (ctx, src, x, y, size) {
      if (!this.debuffIconCache) {
        this.debuffIconCache = {}
      }
      let img = this.debuffIconCache[src]
      if (!img) {
        img = new Image()
        img.src = src
        this.debuffIconCache[src] = img
      }
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, x, y, size, size)
      }
    },
    getMonsterElementIcon (monster) {
      const raw = String(monster?.element ?? '').trim().toLowerCase()
      if (!raw || raw === 'none' || raw === 'null' || raw === 'undefined') {
        return ''
      }

      const element = raw === 'thunder' ? 'electricity' : raw
      const iconMap = {
        fire: 'fire_火.png',
        water: 'water_水.png',
        wind: 'wind_风.png',
        earth: 'earth_土.png',
        electricity: 'electricity_雷.png'
      }

      const fileName = iconMap[element]
      return fileName ? `/pt/element/${fileName}` : ''
    },
    getMonsterElementAlt (monster) {
      const raw = String(monster?.element ?? '').trim().toLowerCase()
      if (!raw || raw === 'none' || raw === 'null' || raw === 'undefined') {
        return ''
      }

      const element = raw === 'thunder' ? 'electricity' : raw
      // 使用统一描述管理获取元素名称
      const name = ELEMENT_NAMES[element] || element
      return name ? `${name}元素` : ''
    },
    /**
     * 元素图标加载失败处理：对临时网络切换导致的失败做一次重试，仍失败则隐藏。
     * @param {Event} event - 图片加载错误事件
     */
    handleElementIconError (event) {
      const img = event?.target
      if (!img) {
        return
      }

      const src = typeof img.src === 'string' ? img.src : ''
      if (!src) {
        img.style.display = 'none'
        return
      }

      if (img.dataset && img.dataset.retryOnce === '1') {
        img.style.display = 'none'
        return
      }

      if (img.dataset) {
        img.dataset.retryOnce = '1'
      }
      const separator = src.includes('?') ? '&' : '?'
      img.src = `${src}${separator}retry=${Date.now()}`
    },
    getDamageBucketForTarget (targetIndex) {
      const buckets = this.uiDamageBuckets
      if (!buckets || typeof buckets !== 'object') {
        return null
      }
      const key = String(targetIndex)
      const bucket = buckets[key]
      if (bucket && typeof bucket === 'object') {
        return bucket
      }
      return null
    },
    getHitDamageNumbersForTarget (targetIndex) {
      const bucket = this.getDamageBucketForTarget(targetIndex)
      if (bucket && Array.isArray(bucket.hit)) {
        return bucket.hit
      }
      return null
    },
    /**
     * 播放箭雨特效动画
     * 特效覆盖整个right-section怪物显示区域
     * @returns {void}
     */
    playArrowRainEffect () {
      // 清除之前的定时器
      if (this.arrowRainTimer) {
        clearTimeout(this.arrowRainTimer)
        this.arrowRainTimer = null
      }
      this.showArrowRainEffect = true
      this.arrowRainKey += 1
      // 2.1秒后自动隐藏（动画持续时间2秒 + 100ms缓冲）
      this.arrowRainTimer = setTimeout(() => {
        this.showArrowRainEffect = false
        this.arrowRainTimer = null
        this.$emit('arrowRainAnimationDone')
      }, 2100)
    },
    /**
     * 播放怒焰回旋特效动画
     * 战士R技能AOE怒焰旋风特效，覆盖整个right-section怪物显示区域
     * @returns {void}
     */
    playFurySpinEffect () {
      // 清除之前的定时器
      if (this.furySpinTimer) {
        clearTimeout(this.furySpinTimer)
        this.furySpinTimer = null
      }
      this.showFurySpinEffect = true
      this.furySpinKey += 1
// 2.1秒后自动隐藏（动画持续时间2.0秒 + 100ms缓冲）
this.furySpinTimer = setTimeout(() => {
this.showFurySpinEffect = false
this.furySpinTimer = null
}, 2100)
    },
    /**
     * 播放刀剑乱舞特效动画
     * 刀锋战士Q技能AOE银色剑刃风暴特效，覆盖整个right-section怪物显示区域
     * @returns {void}
     */
    playBladeDanceEffect () {
      // 清除之前的定时器
      if (this.bladeDanceTimer) {
        clearTimeout(this.bladeDanceTimer)
        this.bladeDanceTimer = null
      }
      this.showBladeDanceEffect = true
      this.bladeDanceKey += 1
      // 2.1秒后自动隐藏（动画持续时间2.0秒 + 100ms缓冲）
this.bladeDanceTimer = setTimeout(() => {
this.showBladeDanceEffect = false
this.bladeDanceTimer = null
}, 2100)
},
/**
* 播放冰箭特效动画
* 游侠Q技能AOE冰箭特效，覆盖整个right-section怪物显示区域
* @returns {void}
*/
playIceArrowEffect () {
// 清除之前的定时器
if (this.iceArrowTimer) {
clearTimeout(this.iceArrowTimer)
this.iceArrowTimer = null
}
this.showIceArrowEffect = true
this.iceArrowKey += 1
// 2.1秒后自动隐藏（动画持续时间2秒 + 100ms缓冲）
this.iceArrowTimer = setTimeout(() => {
this.showIceArrowEffect = false
this.iceArrowTimer = null
}, 2100)
},
/**
* 播放火焰箭矢特效动画
* 游侠W技能AOE火焰箭矢特效，覆盖整个right-section怪物显示区域
* @returns {void}
*/
playFireArrowEffect () {
// 清除之前的定时器
if (this.fireArrowTimer) {
clearTimeout(this.fireArrowTimer)
this.fireArrowTimer = null
}
this.showFireArrowEffect = true
this.fireArrowKey += 1
// 2.1秒后自动隐藏（动画持续时间2秒 + 100ms缓冲）
this.fireArrowTimer = setTimeout(() => {
this.showFireArrowEffect = false
this.fireArrowTimer = null
}, 2100)
},
/**
* 播放神鹰-寂灭龙卷风特效动画
* 爆裂射手T技能 - AOE风系群体攻击，神鹰降临后续进阶技能
* 召唤神鹰俯冲现世，卷起灭世龙卷风撕裂敌人，寂灭一击终结
* @returns {void}
*/
playEagleTornadoEffect () {
// 清除之前的定时器
if (this.eagleTornadoTimer) {
clearTimeout(this.eagleTornadoTimer)
this.eagleTornadoTimer = null
}
// 显示寂灭龙卷风特效，递增key触发重新挂载
this.showEagleTornadoEffect = true
this.eagleTornadoKey += 1
// 2.1秒后自动隐藏（动画持续时间2秒 + 100ms缓冲）
this.eagleTornadoTimer = setTimeout(() => {
this.showEagleTornadoEffect = false
this.eagleTornadoTimer = null
}, 2100)
},
/**
* 播放暴风箭矢特效动画
* 爆裂射手U技能 - AOE风系群体攻击
* 向天空聚集风暴之力，汇聚成巨大箭矢射向敌人后发生爆炸
* @returns {void}
*/
playStormArrowEffect () {
// 清除之前的定时器
if (this.stormArrowTimer) {
clearTimeout(this.stormArrowTimer)
this.stormArrowTimer = null
}
// 显示暴风箭矢特效，递增key触发重新挂载
this.showStormArrowEffect = true
this.stormArrowKey += 1
// 2.35秒后自动隐藏（炫彩重构版动画持续时间2.2秒 + 150ms缓冲）
this.stormArrowTimer = setTimeout(() => {
this.showStormArrowEffect = false
this.stormArrowTimer = null
}, 2350)
},
/**
* 播放狂风连射特效动画
* 爆裂射手I技能 - 单体风系多段连射攻击
* 从玩家头像方向聚集风系能量，密集连射多支箭矢飞向目标怪物
* @param {number} targetIndex - 目标怪物索引（用于定位命中位置）
* @param {number} arrowCount - 箭矢发射数量（影响连射视觉密度）
* @returns {void}
*/
playGaleRapidFireEffect (targetIndex = 0, arrowCount = 5) {
// 清除之前的定时器
if (this.galeRapidFireTimer) {
clearTimeout(this.galeRapidFireTimer)
this.galeRapidFireTimer = null
}
// 设置目标索引和箭矢数量
this.galeRapidFireTargetIndex = targetIndex
this.galeRapidFireArrowCount = arrowCount
// 显示狂风连射特效，递增key触发重新挂载
this.showGaleRapidFireEffect = true
this.galeRapidFireKey += 1
// 2.9秒后自动隐藏（聚集0.6s + 连射1.2s + 命中爆发0.8s + 缓冲300ms）
this.galeRapidFireTimer = setTimeout(() => {
this.showGaleRapidFireEffect = false
this.galeRapidFireTimer = null
}, 2900)
},
/**
* 播放弓箭普通攻击特效动画
* 装备弓箭武器时，普通攻击命中敌人时射出元素箭矢
* 箭矢从玩家头像处抛物线飞向目标怪物头像，命中后产生元素冲击波
* 根据元素属性显示不同颜色：无属性木质色、火红、水蓝、风青、雷紫、土棕
* @param {number} targetIndex - 目标怪物索引（用于定位命中位置）
* @param {string} element - 元素属性（'none'|'fire'|'water'|'wind'|'electricity'|'earth'）
* @returns {void}
*/
playBowAttackEffect (targetIndex = 0, element = 'none') {
// 清除之前的定时器
if (this.bowAttackTimer) {
clearTimeout(this.bowAttackTimer)
this.bowAttackTimer = null
}
// 设置目标索引和元素属性
this.bowAttackTargetIndex = targetIndex
this.bowAttackElement = element
// 显示弓箭攻击特效，递增key触发重新挂载
this.showBowAttackEffect = true
this.bowAttackKey += 1
// 0.65秒后自动隐藏（箭矢飞行约0.38s + 命中爆发约0.3s + 缓冲）
this.bowAttackTimer = setTimeout(() => {
this.showBowAttackEffect = false
this.bowAttackTimer = null
}, 650)
},
/**
* 播放神鹰降临召唤物动画
* 爆裂射手R技能 - 召唤神鹰真身降临战场
* 神鹰在战斗区域盘旋飞行，周期性俯冲攻击
* @param {Object} detail - 事件详情，包含 duration、attackInterval 等
* @returns {void}
*/
playEagleSummonEffect (detail = {}) {
// 清除之前的定时器
if (this.eagleSummonTimer) {
clearTimeout(this.eagleSummonTimer)
this.eagleSummonTimer = null
}
// 更新持续时间与攻击间隔配置
if (detail?.duration) {
this.eagleSummonDuration = detail.duration
}
if (detail?.attackInterval) {
this.eagleSummonAttackInterval = detail.attackInterval
}
// 存储神鹰完整属性数据，供详情面板显示
this.eagleSummonStats = detail?.summonStats || null
this.eagleSummonStatRatio = detail?.statRatio || 0
this.eagleSummonSkillLevel = detail?.skillLevel || 0
// 显示神鹰召唤物，递增key触发重新挂载
this.showEagleSummonEffect = true
this.eagleSummonKey += 1
},
/**
* 消散神鹰召唤物
* 神鹰持续时间结束后，触发消散动画
* 组件内部会自动播放消散羽毛动画并在动画结束后隐藏
* @returns {void}
*/
disperseEagleSummon () {
// 组件内部的 playDisperse 方法会处理消散动画
// 此处仅设置定时器在消散动画后隐藏组件
if (this.eagleSummonTimer) {
clearTimeout(this.eagleSummonTimer)
}
// 消散动画持续时间1.5秒 + 200ms缓冲
this.eagleSummonTimer = setTimeout(() => {
this.showEagleSummonEffect = false
this.eagleSummonTimer = null
}, 1700)
},
/**
* 播放魔导士技能特效动画
     * 单体技能特效显示在指定 targetIndex 对应的 enemy-container 内部
     * AOE技能特效显示在整个 right-section 怪物容器范围
     * @param {string} effectType - 元素类型（fire / wind / water / electricity / earth / none / phantom_fire / boulder_throw / torrent_impact / thunder_storm / howl_gale / meteor_fall / sandstorm_devour / divine_domain / moonlight_punishment / holy_light_earth）
     * @param {number} targetIndex - 目标怪物索引（AOE时忽略）
     * @param {boolean} isAOE - 是否为AOE技能
     * @returns {void}
     */
    playMageEffect (effectType, targetIndex, isAOE) {
      // 不同特效所需的最短展示时长（ms），未配置则默认1600ms
      const effectDurations = { howl_gale: 3000, meteor_fall: 2000, sandstorm_devour: 2500, electricity: 2200, water: 2800, divine_domain: 4000, spirit_mind: 2000, chaos_seal: 2000, mockery_blast: 2000, moonlight_punishment: 1000, holy_light_earth: 2200, poison_arrow: 2000, holy_sanctuary: 3000, holy_judgment: 2500, angel_wrath: 3000, angel_wings: 3000, thunder_hammer: 2500, divine_domain_cross: 1600 }
      const duration = effectDurations[effectType] || 1600
      if (isAOE) {
        // AOE技能：在整个 right-section 显示特效
        const oldAoeTimer = this.mageEffectTimers[-1]
        if (oldAoeTimer) {
          clearTimeout(oldAoeTimer)
        }
        const newKey = (this.activeMageEffects[-1]?.key || 0) + 1
        this.activeMageEffects = {
          ...this.activeMageEffects,
          [-1]: { effectType, key: newKey }
        }
        this.mageEffectTimers = {
          ...this.mageEffectTimers,
          [-1]: setTimeout(() => {
            const updated = { ...this.activeMageEffects }
            delete updated[-1]
            this.activeMageEffects = updated
            const updatedTimers = { ...this.mageEffectTimers }
            delete updatedTimers[-1]
            this.mageEffectTimers = updatedTimers
          }, duration)
        }
        return
      }

      // 单体技能：在指定 targetIndex 的 enemy-container 显示特效
      const oldTimer = this.mageEffectTimers[targetIndex]
      if (oldTimer) {
        clearTimeout(oldTimer)
      }
      const newKey = (this.activeMageEffects[targetIndex]?.key || 0) + 1
      this.activeMageEffects = {
        ...this.activeMageEffects,
        [targetIndex]: { effectType, key: newKey }
      }
      this.mageEffectTimers = {
        ...this.mageEffectTimers,
        [targetIndex]: setTimeout(() => {
          const updated = { ...this.activeMageEffects }
          delete updated[targetIndex]
          this.activeMageEffects = updated
          const updatedTimers = { ...this.mageEffectTimers }
          delete updatedTimers[targetIndex]
            this.mageEffectTimers = updatedTimers
        }, duration)
      }
    }
  }
}
</script>

<style scoped>
/* right-section 需要相对定位，作为箭雨特效的定位参考容器 */
.right-section {
  position: relative;
}

.multi-monster-container {
  position: relative;
}

.monster-overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.health-bar-canvas-anchor {
  position: relative;
}

.enemy-container {
  position: relative;
  background: linear-gradient(135deg, rgba(15, 15, 25, 0.85), rgba(25, 25, 40, 0.75));
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--theme-text);
  transition: all 0.25s ease;
}

.enemy-container:hover {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(40, 40, 65, 0.85));
  border-color: rgba(100, 150, 255, 0.3);
  box-shadow: 0 0 8px rgba(80, 130, 255, 0.15);
}

.enemy-container.is-hidden {
  background-color: transparent;
  border-color: transparent;
  color: transparent;
}

.enemy-container.is-fading {
  background-color: transparent;
  border-color: transparent;
  color: transparent;
}

.enemy-container.is-hidden:hover {
  background-color: transparent;
}

.enemy-container.is-fading:hover {
  background-color: transparent;
}

@keyframes monsterFadeIn {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.enemy {
  position: relative;
  color: var(--theme-text);
  transition: opacity 1s ease, transform 1s ease;
  animation: monsterFadeIn 0.35s ease;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* 上部区域 - 左图片右信息横排 */
.enemy-top {
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
}

.enemy-container.is-fading .enemy {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.enemy-container.is-fading .health-bar,
.enemy-container.is-fading .health-bar-text {
  opacity: 0;
}

/* 右侧信息区 - 纵排：名称、等级、属性图标 */
.enemy-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.enemy-name {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--theme-text);
}

.enemy-name-text {
font-weight: bold;
font-size: 17px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enemy-element-icon {
  width: 13px;
  height: 13px;
  object-fit: contain;
  flex-shrink: 0;
  margin-top: 1px;
}

.enemy-level {
color: rgba(255, 255, 255, 0.55);
font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.health-bar {
  position: relative;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.5);
}

.health-bar-inner {
  height: 100%;
  width: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #e74c3c, #ff6b6b);
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: width;
}

.health-bar-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-size: 8px;
  line-height: 1;
  color: #fff;
  font-weight: 700;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
  pointer-events: none;
  z-index: 1;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .health-bar-inner {
    transition: none;
  }
}

/* DEBUFF图标容器 - 位于血条下方 */
.debuff-icons-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  min-height: 14px;
  max-width: 100%;
}

/* DEBUFF图标通用样式 */
.debuff-icon {
  width: 13px;
  height: 13px;
  object-fit: contain;
  pointer-events: none;
}

/* 击晕图标动画 */
.debuff-icon.stun-icon {
  animation: stunIconPulse 1s ease-in-out infinite;
  filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.8));
}

/* 碎甲图标动画 */
.debuff-icon.armor-break-icon {
  animation: armorBreakBlink 1s ease-in-out infinite;
  filter: drop-shadow(0 0 3px rgba(255, 107, 0, 0.9));
}

@keyframes stunIconPulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    filter: drop-shadow(0 0 2px rgba(255, 215, 0, 0.8));
  }
  25% {
    transform: scale(1.1) rotate(15deg);
    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.9));
  }
  50% {
    transform: scale(1.15) rotate(0deg);
    filter: drop-shadow(0 0 4px rgba(255, 215, 0, 1));
  }
  75% {
    transform: scale(1.1) rotate(-15deg);
    filter: drop-shadow(0 0 3px rgba(255, 215, 0, 0.9));
  }
}

@keyframes armorBreakBlink {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 3px rgba(255, 107, 0, 0.9));
  }
  50% {
    opacity: 0.3;
    filter: drop-shadow(0 0 6px rgba(255, 200, 0, 1));
  }
}

/* 双倍惩戒图标包装器 - 支持悬停事件 */
.debuff-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 0;
}

/* 双倍惩戒图标动画 - 紫色闪烁 */
.debuff-icon.double-judgment-icon {
  animation: doubleJudgmentBlink 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 3px rgba(156, 39, 176, 0.9));
  pointer-events: none;
}

@keyframes doubleJudgmentBlink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 3px rgba(156, 39, 176, 0.9));
  }
  25% {
    opacity: 0.4;
    transform: scale(0.95);
    filter: drop-shadow(0 0 8px rgba(186, 104, 200, 1));
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
    filter: drop-shadow(0 0 6px rgba(156, 39, 176, 1));
  }
  75% {
    opacity: 0.6;
    transform: scale(0.98);
    filter: drop-shadow(0 0 10px rgba(200, 150, 255, 1));
  }
}

/* 攻击力降低图标动画 - 红色闪烁 */
.debuff-icon.attack-reduction-icon {
  animation: attackReductionBlink 1s ease-in-out infinite;
  filter: drop-shadow(0 0 3px rgba(231, 76, 60, 0.9));
  pointer-events: none;
}

@keyframes attackReductionBlink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 3px rgba(231, 76, 60, 0.9));
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
    filter: drop-shadow(0 0 6px rgba(231, 76, 60, 1));
  }
}

@media (prefers-reduced-motion: reduce) {
  .debuff-icon.stun-icon {
    animation: none;
  }
  .debuff-icon.armor-break-icon {
    animation: none;
  }
  .debuff-icon.double-judgment-icon {
    animation: none;
  }
  .debuff-icon.attack-reduction-icon {
    animation: none;
  }
  .debuff-icon.berserk-icon {
    animation: none;
  }
}

/* 狂暴怪物样式 - 仅保留基础样式，动画由 BerserkAnimation 组件处理 */
.enemy.is-berserk {
  position: relative;
}

/* 狂暴图标动画 - 增强版红色火焰脉动 */
.debuff-icon.berserk-icon {
  animation: berserkIconPulse 0.5s ease-in-out infinite;
  filter: drop-shadow(0 0 6px rgba(255, 0, 0, 1)) drop-shadow(0 0 12px rgba(255, 100, 0, 0.8));
  pointer-events: none;
}

@keyframes berserkIconPulse {
  0%, 100% {
    transform: scale(1) rotate(-3deg);
    filter: drop-shadow(0 0 6px rgba(255, 0, 0, 1)) drop-shadow(0 0 12px rgba(255, 100, 0, 0.8));
  }
  25% {
    transform: scale(1.1) rotate(3deg);
    filter: drop-shadow(0 0 10px rgba(255, 50, 0, 1)) drop-shadow(0 0 20px rgba(255, 150, 0, 0.9));
  }
  50% {
    transform: scale(1.2) rotate(-2deg);
    filter: drop-shadow(0 0 15px rgba(255, 0, 0, 1)) drop-shadow(0 0 25px rgba(255, 100, 0, 1));
  }
  75% {
    transform: scale(1.1) rotate(2deg);
    filter: drop-shadow(0 0 10px rgba(255, 50, 0, 1)) drop-shadow(0 0 18px rgba(255, 150, 0, 0.9));
  }
}
</style>

<!-- DEBUFF提示框样式（非scoped，因为需要挂载到body） -->
<style>
.debuff-tooltip {
  position: fixed;
  z-index: 10000;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: white;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  display: none;
  max-width: 220px;
}

/* 双倍惩戒样式 - 紫色 */
.debuff-tooltip .tooltip-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 6px;
  color: #e1bee7;
}

.debuff-tooltip .tooltip-desc {
  margin-bottom: 4px;
  color: #f5f5f5;
}

.debuff-tooltip .tooltip-hint {
  font-size: 10px;
  color: #bdbdbd;
  font-style: italic;
}

/* 击晕样式 - 金色 */
.debuff-tooltip .stun-title {
  color: #ffd700;
}

/* 碎甲样式 - 橙色 */
.debuff-tooltip .armor-break-title {
  color: #ff9800;
}

/* 狂暴样式 - 深红色 */
.debuff-tooltip .berserk-title {
  color: #ff3333;
  text-shadow: 0 0 8px rgba(255, 0, 0, 0.8);
}
</style>
