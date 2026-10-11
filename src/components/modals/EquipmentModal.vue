<template>
  <div v-if="isVisible" class="equipment-modal">
      <div class="equipment-header">
        <h2>装备栏</h2>
      </div>

      <div class="equipment-content">
        <div class="equipment-main">
          <!-- 左侧装备插槽区域 -->
          <div class="equipment-slots-container">
            <!-- 插槽上：从左往右显示耳环1,戒指1,项链,戒指2,耳环2 -->
            <div class="equipment-slots-top">
              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">耳环1</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('earring1')"
                  @mouseenter="showItemTooltip($event, equipment.earring1)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.earring1?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="耳环1"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.earring1)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">戒指1</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('ring1')"
                  @mouseenter="showItemTooltip($event, equipment.ring1)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.ring1?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="戒指1"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.ring1)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">项链</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('necklace')"
                  @mouseenter="showItemTooltip($event, equipment.necklace)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.necklace?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="项链"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.necklace)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">戒指2</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('ring2')"
                  @mouseenter="showItemTooltip($event, equipment.ring2)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.ring2?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="戒指2"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.ring2)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">耳环2</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('earring2')"
                  @mouseenter="showItemTooltip($event, equipment.earring2)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.earring2?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="耳环2"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.earring2)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>
            </div>

            <!-- 插槽中 -->
            <div class="equipment-slots-middle">
              <!-- 插槽中左侧上显示武器 -->
              <div class="equipment-slots-middle-left">
                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">武器</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('weapon')"
                    @mouseenter="showItemTooltip($event, equipment.weapon)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.weapon?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="武器"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.weapon)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <!-- 插槽中左侧下显示盾牌 -->
                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">盾牌</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('shield')"
                    @mouseenter="showItemTooltip($event, equipment.shield)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.shield?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="盾牌"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.shield)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <!-- 插槽中左侧显示面具 -->
                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">面具</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('mask')"
                    @mouseenter="showItemTooltip($event, equipment.mask)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.mask?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="面具"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.mask)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <!-- 插槽中左侧显示披风 -->
                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">披风</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('cloak')"
                    @mouseenter="showItemTooltip($event, equipment.cloak)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.cloak?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="披风"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.cloak)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>
              </div>

              <!-- 插槽中间显示玩家头像 -->
              <div class="equipment-player-center">
                <img
                  :src="playerAvatar"
                  alt="玩家头像"
                  class="equipment-player-avatar"
                  draggable="false"
                />
              </div>

              <!-- 插槽中右侧从上到下显示:帽子,衣服,手套,鞋子 -->
              <div class="equipment-slots-middle-right">
                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">帽子</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('helmet')"
                    @mouseenter="showItemTooltip($event, equipment.helmet)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.helmet?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="帽子"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.helmet)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">衣服</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('armor')"
                    @mouseenter="showItemTooltip($event, equipment.armor)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.armor?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="衣服"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.armor)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">手套</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('gloves')"
                    @mouseenter="showItemTooltip($event, equipment.gloves)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.gloves?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="手套"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.gloves)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>

                <div class="equipment-slot-wrapper">
                  <div class="equipment-slot-label">鞋子</div>
                  <div
                    class="equipment-slot"
                    @click="equipItem('boots')"
                    @mouseenter="showItemTooltip($event, equipment.boots)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                  >
                    <img
                      :src="equipment.boots?.icon || '/pt/UI/back_Slotitem.jpg'"
                      alt="鞋子"
                      class="equipment-icon"
                      draggable="false"
                      @error="handleImageError"
                      @mouseenter="showItemTooltip($event, equipment.boots)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition($event)"
                      @dragstart.prevent
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 插槽下：从左往右: 时装帽子,时装衣服,时装手套,时装鞋子 -->
            <div class="equipment-slots-bottom">
              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">时装帽子</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('fashionHat')"
                  @mouseenter="showItemTooltip($event, equipment.fashionHat)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.fashionHat?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="时装帽子"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.fashionHat)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">时装衣服</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('fashionSuit')"
                  @mouseenter="showItemTooltip($event, equipment.fashionSuit)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.fashionSuit?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="时装衣服"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.fashionSuit)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">时装手套</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('fashionGloves')"
                  @mouseenter="showItemTooltip($event, equipment.fashionGloves)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.fashionGloves?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="时装手套"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.fashionGloves)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>

              <div class="equipment-slot-wrapper">
                <div class="equipment-slot-label">时装鞋子</div>
                <div
                  class="equipment-slot"
                  @click="equipItem('fashionBoots')"
                  @mouseenter="showItemTooltip($event, equipment.fashionBoots)"
                  @mouseleave="hideItemTooltip"
                  @mousemove="updateTooltipPosition($event)"
                >
                  <img
                    :src="equipment.fashionBoots?.icon || '/pt/UI/back_Slotitem.jpg'"
                    alt="时装鞋子"
                    class="equipment-icon"
                    draggable="false"
                    @error="handleImageError"
                    @mouseenter="showItemTooltip($event, equipment.fashionBoots)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)"
                    @dragstart.prevent
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧属性加成区域 -->
          <div class="equipment-stats-container">
            <div class="equipment-stats-overview">
              <h3>属性加成</h3>
              <div class="stats-grid">
                <div v-if="weaponSectionVisible" class="stats-section">
                  <div class="stats-section-title">武器属性</div>
                  <div class="stats-section-body">
                    <div v-if="weaponAttackRange" class="stat-line">⚔️ 攻击力 {{ weaponAttackRange }}</div>
                    <div v-if="weaponAttackSpeed" class="stat-line">⚡ 攻击速度 +{{ weaponAttackSpeed }}</div>
                    <div v-if="weaponEnhanceAttackBonus && !weaponAttackRangeUsesEnhance" class="stat-line">
                      ✨ 强化攻击 +{{ weaponEnhanceAttackBonus }}
                    </div>
                    <div v-if="weaponCardAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🔷 镶嵌卡片</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in weaponCardAbilityLines"
                          :key="`weapon-card-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="weaponAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🎯 装备词条</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in weaponAbilityLines"
                          :key="`weapon-ability-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="shieldSectionVisible" class="stats-section">
                  <div class="stats-section-title">盾牌属性</div>
                  <div class="stats-section-body">
                    <div v-if="shieldDefenseRange" class="stat-line">🛡️ 防御力 {{ shieldDefenseRange }}</div>
                    <div v-if="shieldEnhanceDefenseBonus && !shieldDefenseRangeUsesEnhance" class="stat-line">
                      ✨ 强化防御 +{{ shieldEnhanceDefenseBonus }}
                    </div>
                    <div v-if="shieldCardAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🔷 镶嵌卡片</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in shieldCardAbilityLines"
                          :key="`shield-card-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="shieldAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🎯 装备词条</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in shieldAbilityLines"
                          :key="`shield-ability-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="armorSectionVisible" class="stats-section">
                  <div class="stats-section-title">防具加成</div>
                  <div class="stats-section-body">
                    <div v-if="armorDefenseRange" class="stat-line">🛡️ 防御力 {{ armorDefenseRange }}</div>
                    <div v-if="armorEnhanceDefenseBonus && !armorDefenseRangeUsesEnhance" class="stat-line">
                      ✨ 强化防御 +{{ armorEnhanceDefenseBonus }}
                    </div>
                    <div v-if="armorEnhanceAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">✨ 强化加成</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in armorEnhanceAbilityLines"
                          :key="`armor-enhance-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="armorCardAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🔷 镶嵌卡片</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in armorCardAbilityLines"
                          :key="`armor-card-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="armorAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🎯 装备词条</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in armorAbilityLines"
                          :key="`armor-ability-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="setBonusAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🧩 套装加成</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in setBonusAbilityLines"
                          :key="`armor-set-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="hasEnhanceSetBonus" class="stat-group">
                      <div class="stat-group-title">🧩 强化套装 +{{ enhanceSetLevel }}</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in enhanceSetBonusAbilities"
                          :key="`enhance-set-${index}`"
                          class="stat-sub-value"
                        >
                          {{ formatEnhanceSetAbility(ability) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="jewelrySectionVisible" class="stats-section">
                  <div class="stats-section-title">首饰属性</div>
                  <div class="stats-section-body">
                    <div v-if="jewelryEnhanceAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">✨ 强化加成</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in jewelryEnhanceAbilityLines"
                          :key="`jewelry-enhance-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="jewelryAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🎯 装备词条</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in jewelryAbilityLines"
                          :key="`jewelry-ability-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="fashionSectionVisible" class="stats-section">
                  <div class="stats-section-title">时装属性</div>
                  <div class="stats-section-body">
                    <div v-if="fashionAbilityLines.length" class="stat-group">
                      <div class="stat-group-title">🎯 装备词条</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in fashionAbilityLines"
                          :key="`fashion-ability-${index}`"
                          class="stat-sub-value"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                    <div v-if="fashionBlessingLines.length" class="stat-group">
                      <div class="stat-group-title">✨ 祝福唤醒</div>
                      <div class="stat-value-lines">
                        <div
                          v-for="(ability, index) in fashionBlessingLines"
                          :key="`fashion-blessing-${index}`"
                          class="stat-sub-value"
                          style="color: #ffd700;"
                        >
                          {{ ability }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="totalSectionVisible" class="stats-section">
                  <div class="stats-section-title">总加成</div>
                  <div class="stats-section-body">
                    <div class="stat-value-lines">
                      <div
                        v-for="(ability, index) in totalAbilityLines"
                        :key="`total-ability-${index}`"
                        class="stat-sub-value"
                      >
                        {{ ability }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="equipment-footer">
        <button class="equipment-close-button" @click="close">关闭</button>
        <button class="unequip-all-button" @click="unequipAll">卸下所有装备</button>
      </div>
  </div>
</template>

<script>
import { computed, watch, nextTick } from 'vue'
import BagService from '@/services/BagService'
import { applyWeaponDamageFormula } from '@/data/classes'
import { useItemsStore } from '@/store/items'
import { SetBonusService } from '@/services/SetBonusService'
import { classIconMap, getClassIconPath } from '@/utils/itemHelpers'
import { getSkillName } from '@/utils/effectFormatter'

export default {
  name: 'EquipmentModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    player: {
      type: Object,
      required: true
    },
    playerClassName: {
      type: String,
      required: true
    },
    addBattleLog: {
      type: Function,
      default: () => {}
    }
  },
  emits: ['close', 'equip-item', 'unequip-all', 'unequip-success', 'player-data-updated'],
  setup (props, { emit }) {
    // 直接从 Pinia Store 获取 equipment 数据，确保实时更新
    const itemsStore = useItemsStore()
    const setBonusService = new SetBonusService()
    const equipment = computed(() => itemsStore.equipment)
    const enhanceSetParameterMap = {
      hitrate: '命中率',
      blockrate: '格挡',
      allstats: '全属性',
      maxhp: '增加HP',
      attack: '攻击力'
    }
    const enhanceSetSlots = ['helmet', 'armor', 'gloves', 'boots']
    const resolveEnhanceLevel = item => {
      const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
      return Number.isFinite(level) ? level : 0
    }
    const enhanceSetLevel = computed(() => {
      const levels = enhanceSetSlots.map(slot => resolveEnhanceLevel(equipment.value?.[slot]))
      const minLevel = Math.min(...levels)
      if (!Number.isFinite(minLevel) || minLevel < 3) {
        return 0
      }
      return Math.min(10, Math.floor(minLevel))
    })
    const enhanceSetBonusAbilities = computed(() => {
      const level = enhanceSetLevel.value
      if (!level) {
        return []
      }
      const table = itemsStore.enhanceSetBonusTable || {}
      const abilities = table[level] || table[String(level)] || []
      return Array.isArray(abilities) ? abilities : []
    })
    const hasEnhanceSetBonus = computed(() => enhanceSetBonusAbilities.value.length > 0)
    const formatEnhanceSetAbility = ability => {
      if (!ability) {
        return ''
      }
      const key = String(ability.parameter || '').toLowerCase()
      const label = enhanceSetParameterMap[key] || ability.parameter || ''
      const value = Number(ability.add ?? 0)
      if (!Number.isFinite(value) || value === 0) {
        return label
      }
      return `${label} +${value}${ability.rate ? '%' : ''}`
    }
    const abilityParameterMap = {
      none: '无',
      str: '力量',
      dex: '敏捷',
      int: '智力',
      sta: '体质',
      con: '体力',
      agi: '幸运',
      vit: '体力',
      maxhp: '最大生命',
      maxfp: '最大FP',
      hp: '生命值',
      mp: '魔法值',
      fp: 'FP',
      def: '防御力',
      attack: '攻击力',
      damage: '攻击力',
      defense: '防御力',
      maxmp: '最大魔法值',
      speed: '攻击速度',
      criticalrate: '暴击率',
      criticaldamage: '暴击伤害',
      dodgerate: '闪避率',
      blockrate: '格挡率',
      criticalchance: '暴击率',
      stealhp: '生命偷取',
      skilldamage: '技能伤害',
      allstats: '全属性',
      decreasedcastingtime: '施法速度',
      windmastery: '风元素',
      incomingdamage: '伤害减免',
      skillchance: '技能几率',
      hitrate: '命中率',
      healing: '治疗效果'
    }
    /**
     * 格式化装备属性
     * 特殊处理 skillchance：使用技能名称替换通用的"技能几率"标签
     * @param {Object} ability - 属性对象
     * @returns {string} 格式化后的属性描述
     */
    const formatEquipmentAbility = ability => {
      if (!ability) {
        return ''
      }
      const parameterKey = String(ability.parameter ?? '').toLowerCase()
      // 处理技能几率（skillchance）：使用技能名称替换通用标签
      if (parameterKey === 'skillchance' && ability.skill) {
        const skillName = getSkillName(ability.skill)
        if (ability.set !== undefined && ability.add === undefined) {
          return `${skillName} 设为 ${ability.set}`
        }
        if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
          return skillName
        }
        const add = Number(ability.add)
        const rate = Boolean(ability.rate)
        if (Number.isFinite(add) && add === 0) {
          return ''
        }
        return `${skillName} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
      }
      const parameter = abilityParameterMap[parameterKey] || ability.parameter || ''
      if (ability.set !== undefined && ability.add === undefined) {
        if (parameterKey === 'mp' && ability.set === -1) {
          return `${parameter} 持续回满`
        }
        return `${parameter} 设为 ${ability.set}`
      }
      if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
        return parameter
      }
      const add = Number(ability.add)
      const rate = Boolean(ability.rate)
      if (
        Number.isFinite(add) &&
        add === 0
      ) {
        return ''
      }
      return `${parameter} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
    }
    /**
     * 格式化总属性（合并后）
     * 特殊处理 skillchance：使用技能名称替换通用的"技能几率"标签
     * @param {Object} ability - 合并后的属性对象
     * @returns {string} 格式化后的属性描述
     */
    const formatTotalAbility = ability => {
      if (!ability) {
        return ''
      }
      const parameterKey = String(ability.parameter ?? '').toLowerCase()
      // 处理技能几率（skillchance）：使用技能名称替换通用标签
      if (parameterKey === 'skillchance' && ability.skill) {
        const skillName = getSkillName(ability.skill)
        if (ability.set !== undefined && ability.add === undefined) {
          if (parameterKey === 'mp' && ability.set === -1) {
            return `${skillName} 持续回满`
          }
          return `${skillName} 设为 ${ability.set}`
        }
        if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
          return skillName
        }
        const add = Number(ability.add)
        const rate = Boolean(ability.rate)
        if (Number.isFinite(add) && add === 0) {
          return ''
        }
        return `${skillName} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
      }
      const parameter = abilityParameterMap[parameterKey] || ability.parameter || ''
      if (ability.set !== undefined && ability.add === undefined) {
        if (parameterKey === 'mp' && ability.set === -1) {
          return `${parameter} 持续回满`
        }
        return `${parameter} 设为 ${ability.set}`
      }
      if (ability.add === undefined || !Number.isFinite(Number(ability.add))) {
        return parameter
      }
      const add = Number(ability.add)
      const rate = Boolean(ability.rate)
      if (Number.isFinite(add) && add === 0) {
        return ''
      }
      return `${parameter} ${rate ? '+' : ''}${add}${rate ? '%' : ''}`
    }
    const stripAbilityParentheses = line => {
      if (!line) {
        return ''
      }
      const cleaned = String(line).replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
      return cleaned
    }
    const mergeAbilityLines = abilities => {
      const totals = new Map()
      abilities.forEach(ability => {
        if (!ability || ability.parameter === undefined) {
          return
        }
        const parameterKey = String(ability.parameter).toLowerCase()
        const rate = Boolean(ability.rate)
        const add = ability.add !== undefined ? Number(ability.add) : undefined
        const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
        const key = `${parameterKey}|${rate ? 'percent' : 'value'}|${ability.set ?? ''}|${ability.skill ?? ''}|${ability.skillLevel ?? ''}|${addMax !== undefined ? 'range' : 'flat'}`
        const current = totals.get(key) || {
          parameter: parameterKey,
          rate,
          set: ability.set,
          skill: ability.skill,
          skillLevel: ability.skillLevel
        }
        if (add !== undefined && Number.isFinite(add)) {
          current.add = Number.isFinite(current.add) ? current.add + add : add
        }
        if (addMax !== undefined && Number.isFinite(addMax)) {
          current.addMax = Number.isFinite(current.addMax) ? current.addMax + addMax : addMax
        }
        totals.set(key, current)
      })
      return Array.from(totals.values()).map(formatEquipmentAbility).filter(Boolean)
    }
    const setBonusKeyMap = {
      strength: { parameter: 'str' },
      dexterity: { parameter: 'dex' },
      agility: { parameter: 'agi' },
      intelligence: { parameter: 'int' },
      constitution: { parameter: 'sta' },
      attack: { parameter: 'attack' },
      defense: { parameter: 'defense' },
      maxHealth: { parameter: 'maxhp' },
      maxMana: { parameter: 'maxmp' },
      attackPercentage: { parameter: 'attack', rate: true },
      defensePercentage: { parameter: 'defense', rate: true },
      maxHealthPercentage: { parameter: 'maxhp', rate: true },
      maxManaPercentage: { parameter: 'maxmp', rate: true },
      criticalRate: { parameter: 'criticalrate', rate: true, fractional: true },
      criticalDamage: { parameter: 'criticaldamage', rate: true, fractional: true },
      hitRate: { parameter: 'hitrate', rate: true, fractional: true },
      dodgeRate: { parameter: 'dodgerate', rate: true, fractional: true },
      blockRate: { parameter: 'blockrate', rate: true, fractional: true },
      attackSpeed: { parameter: 'speed', rate: true, fractional: true },
      decreasedCastingTime: { parameter: 'decreasedcastingtime', rate: true, fractional: true },
      decreasedMpConsumption: { parameter: 'mp', rate: true, fractional: true },
      decreasedFpConsumption: { parameter: 'fp', rate: true, fractional: true },
      lifeSteal: { parameter: 'stealhp', rate: true, fractional: true },
      healPercent: { parameter: 'healing', rate: true, fractional: true },
      blockPenetration: { parameter: 'blockpenetration', rate: true, fractional: true },
      moveSpeed: { parameter: 'movespeed', rate: true, fractional: true },
      hpRegeneration: { parameter: 'hpregeneration', rate: true, fractional: true },
      mpRegeneration: { parameter: 'mpregeneration', rate: true, fractional: true },
      damageBonus: { parameter: 'damagebonus', rate: true },
      damageReduction: { parameter: 'damagereduction', rate: true }
    }
    const normalizeSetBonusValue = (value, config) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric) || numeric === 0) {
        return null
      }
      if (config?.rate && config?.fractional && Math.abs(numeric) <= 1) {
        return numeric * 100
      }
      return numeric
    }
    const mergeAbilityObjects = abilities => {
      const totals = new Map()
      abilities.forEach(ability => {
        if (!ability || ability.parameter === undefined) {
          return
        }
        const parameterKey = String(ability.parameter).toLowerCase()
        const rate = Boolean(ability.rate)
        const add = ability.add !== undefined ? Number(ability.add) : undefined
        const addMax = ability.addMax !== undefined ? Number(ability.addMax) : undefined
        const key = `${parameterKey}|${rate ? 'percent' : 'value'}|${ability.set ?? ''}|${ability.skill ?? ''}|${ability.skillLevel ?? ''}|${addMax !== undefined ? 'range' : 'flat'}`
        const current = totals.get(key) || {
          parameter: parameterKey,
          rate,
          set: ability.set,
          skill: ability.skill,
          skillLevel: ability.skillLevel
        }
        if (add !== undefined && Number.isFinite(add)) {
          current.add = Number.isFinite(current.add) ? current.add + add : add
        }
        if (addMax !== undefined && Number.isFinite(addMax)) {
          current.addMax = Number.isFinite(current.addMax) ? current.addMax + addMax : addMax
        }
        totals.set(key, current)
      })
      return Array.from(totals.values())
    }
    const parseRangeValue = value => {
      if (!value) {
        return null
      }
      const text = String(value).trim()
      const parts = text.split('~')
      if (parts.length !== 2) {
        return null
      }
      const min = Number(parts[0])
      const max = Number(parts[1])
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null
      }
      return { min, max }
    }
    const sumRangeValues = values => {
      let totalMin = 0
      let totalMax = 0
      let hasValue = false
      values.forEach(value => {
        const range = parseRangeValue(value)
        if (!range) {
          return
        }
        totalMin += range.min
        totalMax += range.max
        hasValue = true
      })
      if (!hasValue) {
        return null
      }
      if (totalMin <= 0 && totalMax <= 0) {
        return null
      }
      return { min: totalMin, max: totalMax }
    }
    const attributeElementLabelMap = {
      fire: '火',
      water: '水',
      wind: '风',
      thunder: '雷',
      earth: '土'
    }
    const resolveAttributeEnhancementInfo = item => {
      const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
      if (!elemental || typeof elemental !== 'object') {
        return null
      }
      const entries = Object.entries(attributeElementLabelMap)
        .map(([key, label]) => {
          const level = Number(elemental?.[key]?.enhancementLevel ?? 0)
          return Number.isFinite(level) && level > 0 ? { key, label, level } : null
        })
        .filter(Boolean)
      if (!entries.length) {
        return null
      }
      const resolved = entries.reduce((current, next) => (next.level > current.level ? next : current))
      const attackPercent = Number(elemental?.[resolved.key]?.elementAttackPercent ?? 0)
      return {
        ...resolved,
        attackPercent: Number.isFinite(attackPercent) ? attackPercent : 0
      }
    }
    const buildWeaponElementAbilityLines = items => {
      const lines = []
      items.forEach(item => {
        const info = resolveAttributeEnhancementInfo(item)
        if (!info) {
          return
        }
        if (info.label) {
          lines.push(`属性攻击 ${info.label}属性`)
        }
        if (Number.isFinite(info.attackPercent) && info.attackPercent > 0) {
          lines.push(`${info.label}属性攻击 +${info.attackPercent}%`)
        }
      })
      return Array.from(new Set(lines))
    }
    const collectAbilitiesFromItems = items => {
      const abilities = []
      items.forEach(item => {
        if (!item) {
          return
        }
        const itemAbilities = Array.isArray(item.abilities) ? item.abilities : []
        abilities.push(...itemAbilities)
      })
      return mergeAbilityLines(abilities)
    }
    const collectAbilityObjectsFromItems = items => {
      const abilities = []
      items.forEach(item => {
        if (!item) {
          return
        }
        const itemAbilities = Array.isArray(item.abilities) ? item.abilities : []
        abilities.push(...itemAbilities)
      })
      return abilities
    }
    const getEmbeddedCardsForDisplay = attrs => {
      if (!attrs || typeof attrs !== 'object') {
        return null
      }
      if (attrs.embeddedCards && typeof attrs.embeddedCards === 'object') {
        return attrs.embeddedCards
      }
      if (!attrs.perforationLevels || typeof attrs.perforationLevels !== 'object') {
        return null
      }
      const result = {}
      Object.entries(attrs.perforationLevels).forEach(([levelKey, level]) => {
        if (!level || level.embeddedCardId === null || level.embeddedCardId === undefined) {
          return
        }
        let id = null
        if (level.embeddedCardId && typeof level.embeddedCardId === 'object') {
          const idCandidate = Number(level.embeddedCardId.cardId)
          id = Number.isFinite(idCandidate) ? idCandidate : null
        } else {
          const idCandidate = Number(level.embeddedCardId)
          id = Number.isFinite(idCandidate) ? idCandidate : null
        }
        if (id === null) {
          return
        }
        const key = String(levelKey)
        result[key] = {
          cardId: id,
          abilities: itemsStore.getItemConfig(id)?.abilities || []
        }
      })
      return Object.keys(result).length > 0 ? result : null
    }
    const collectCardAbilityObjectsFromItems = items => {
      const abilities = []
      items.forEach(item => {
        if (!item?.PerforationAttributes) {
          return
        }
        const embedded = getEmbeddedCardsForDisplay(item.PerforationAttributes)
        if (!embedded) {
          return
        }
        Object.values(embedded).forEach(card => {
          if (!Array.isArray(card?.abilities)) {
            return
          }
          abilities.push(...card.abilities)
        })
      })
      return abilities
    }
    const mergeCardAbilities = embeddedCards => {
      if (!embeddedCards) {
        return []
      }
      const mergedAbilities = {}
      Object.values(embeddedCards).forEach(card => {
        if (!card?.abilities) {
          return
        }
        card.abilities.forEach(ability => {
          const parameterKey = String(ability.parameter).toLowerCase()
          const key = `${parameterKey}_${ability.rate ? 'percent' : 'value'}`
          if (!mergedAbilities[key]) {
            mergedAbilities[key] = {
              parameter: ability.parameter,
              add: ability.add,
              addMax: ability.addMax,
              rate: ability.rate
            }
          } else {
            mergedAbilities[key].add += ability.add
            if (ability.addMax !== undefined && mergedAbilities[key].addMax !== undefined) {
              mergedAbilities[key].addMax += ability.addMax
            }
          }
        })
      })
      return Object.values(mergedAbilities).map(formatEquipmentAbility).filter(Boolean)
    }
    const collectCardAbilitiesFromItems = items => {
      const cards = {}
      let hasCard = false
      items.forEach(item => {
        if (!item?.PerforationAttributes) {
          return
        }
        const embedded = getEmbeddedCardsForDisplay(item.PerforationAttributes)
        if (!embedded) {
          return
        }
        Object.entries(embedded).forEach(([key, value]) => {
          cards[`${item.uniqueId || item.id}-${key}`] = value
        })
        hasCard = true
      })
      if (!hasCard) {
        return []
      }
      return mergeCardAbilities(cards)
    }
    const getJewelryEnhanceAbilities = item => {
      if (!item || item.category !== 'jewelry') {
        return []
      }
      const enhanceLevel = resolveEnhanceLevel(item)
      if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
        return []
      }
      const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
      if (upgradeLevels.length === 0) {
        return []
      }
      const matched =
        upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
        upgradeLevels[enhanceLevel]
      const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
      return abilities
    }
    const getArmorEnhanceAbilities = item => {
      if (!item || item.category !== 'armor' || item.subcategory === 'shield') {
        return []
      }
      const enhanceLevel = resolveEnhanceLevel(item)
      if (!Number.isFinite(enhanceLevel) || enhanceLevel <= 0) {
        return []
      }
      const upgradeLevels = Array.isArray(item.upgradeLevels) ? item.upgradeLevels : []
      if (upgradeLevels.length > 0) {
        const matched =
          upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
          upgradeLevels[enhanceLevel]
        const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
        if (abilities.length) {
          return abilities
        }
      }
      const attrs = item.StrengthenedAttributes || {}
      const levelAttrs = attrs[String(enhanceLevel)] || {}
      if (Array.isArray(levelAttrs.abilities)) {
        return levelAttrs.abilities
      }
      if (Array.isArray(attrs.abilities)) {
        return attrs.abilities
      }
      return []
    }
    const weaponItems = computed(() => {
      return Object.values(equipment.value || {}).filter(item => item && item.category === 'weapon')
    })
    const shieldItems = computed(() => {
      return Object.values(equipment.value || {}).filter(item => item && item.subcategory === 'shield')
    })
    const armorItems = computed(() => {
      return Object.values(equipment.value || {}).filter(
        item => item && item.category === 'armor' && item.subcategory !== 'shield'
      )
    })
    const equippedItems = computed(() => {
      return Object.values(equipment.value || {}).filter(item => item)
    })
    const jewelryItems = computed(() => {
      return Object.values(equipment.value || {}).filter(item => item && item.category === 'jewelry')
    })
    /** 时装装备列表：面具、披风、时装帽子、时装衣服、时装手套、时装鞋子 */
    const fashionItems = computed(() => {
      return Object.values(equipment.value || {}).filter(item => item && item.category === 'fashion')
    })
    const weaponAttackRangeUsesEnhance = computed(() => {
      return weaponItems.value.some(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return false
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
        const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
        return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
      })
    })
    const weaponAttackRange = computed(() => {
      let totalMin = 0
      let totalMax = 0
      weaponItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
        const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
        const processed = Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
          ? applyWeaponDamageFormula({
            ...item,
            minAttack: enhancedMin,
            maxAttack: enhancedMax
          })
          : applyWeaponDamageFormula(item)
        totalMin += processed.minAttack || 0
        totalMax += processed.maxAttack || 0
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const armorDefenseRangeUsesEnhance = computed(() => {
      return armorItems.value.some(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return false
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
      })
    })
    const armorDefenseRange = computed(() => {
      let totalMin = 0
      let totalMax = 0
      armorItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        if (Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)) {
          totalMin += enhancedMin
          totalMax += enhancedMax
          return
        }
        totalMin += item.minDefense || 0
        totalMax += item.maxDefense || 0
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const shieldDefenseRangeUsesEnhance = computed(() => {
      return shieldItems.value.some(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return false
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        return Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)
      })
    })
    const shieldDefenseRange = computed(() => {
      let totalMin = 0
      let totalMax = 0
      shieldItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        if (Number.isFinite(enhancedMin) && Number.isFinite(enhancedMax)) {
          totalMin += enhancedMin
          totalMax += enhancedMax
          return
        }
        totalMin += item.minDefense || 0
        totalMax += item.maxDefense || 0
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const weaponAttackSpeed = computed(() => {
      let total = 0
      weaponItems.value.forEach(item => {
        const value = Number(item.attackSpeedValue)
        if (Number.isFinite(value)) {
          total += value
        }
      })
      if (total <= 0) {
        return ''
      }
      const percent = total * 100
      const rounded = Math.round(percent * 10) / 10
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
    })
    const weaponEnhanceAttackBonus = computed(() => {
      let totalMin = 0
      let totalMax = 0
      weaponItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
        const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
        if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
          return
        }
        const baseProcessed = applyWeaponDamageFormula(item)
        const enhancedProcessed = applyWeaponDamageFormula({
          ...item,
          minAttack: enhancedMin,
          maxAttack: enhancedMax
        })
        const minBonus = (enhancedProcessed.minAttack || 0) - (baseProcessed.minAttack || 0)
        const maxBonus = (enhancedProcessed.maxAttack || 0) - (baseProcessed.maxAttack || 0)
        if (minBonus > 0 || maxBonus > 0) {
          totalMin += Math.max(0, minBonus)
          totalMax += Math.max(0, maxBonus)
        }
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const armorEnhanceDefenseBonus = computed(() => {
      let totalMin = 0
      let totalMax = 0
      armorItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
          return
        }
        const minBonus = enhancedMin - (item.minDefense || 0)
        const maxBonus = enhancedMax - (item.maxDefense || 0)
        if (minBonus > 0 || maxBonus > 0) {
          totalMin += Math.max(0, minBonus)
          totalMax += Math.max(0, maxBonus)
        }
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const shieldEnhanceDefenseBonus = computed(() => {
      let totalMin = 0
      let totalMax = 0
      shieldItems.value.forEach(item => {
        const level = resolveEnhanceLevel(item)
        if (level <= 0) {
          return
        }
        const attrs = item.StrengthenedAttributes || {}
        const levelAttrs = attrs[String(level)] || {}
        const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
        const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
        if (!Number.isFinite(enhancedMin) || !Number.isFinite(enhancedMax)) {
          return
        }
        const minBonus = enhancedMin - (item.minDefense || 0)
        const maxBonus = enhancedMax - (item.maxDefense || 0)
        if (minBonus > 0 || maxBonus > 0) {
          totalMin += Math.max(0, minBonus)
          totalMax += Math.max(0, maxBonus)
        }
      })
      if (totalMin <= 0 && totalMax <= 0) {
        return ''
      }
      return `${totalMin}~${totalMax}`
    })
    const weaponElementAbilityLines = computed(() => buildWeaponElementAbilityLines(weaponItems.value))
    const weaponAbilityLines = computed(() =>
      [
        ...weaponElementAbilityLines.value,
        ...collectAbilitiesFromItems(weaponItems.value).map(stripAbilityParentheses).filter(Boolean)
      ]
    )
    const shieldAbilityLines = computed(() => collectAbilitiesFromItems(shieldItems.value))
    const armorAbilityLines = computed(() => collectAbilitiesFromItems(armorItems.value))
    const jewelryAbilityLines = computed(() => collectAbilitiesFromItems(jewelryItems.value))
    /** 时装装备词条：汇总所有时装物品的 abilities 属性 */
    const fashionAbilityLines = computed(() => collectAbilitiesFromItems(fashionItems.value))
    /**
     * 从时装物品列表中收集祝福唤醒属性对象（用于总加成计算）
     * @param {Array} items - 时装物品列表
     * @returns {Array} 属性对象数组
     */
    const collectBlessingAbilityObjects = items => {
      const abilities = []
      items.forEach(item => {
        if (!item?.blessedData?.attributes || !Array.isArray(item.blessedData.attributes)) return
        item.blessedData.attributes.forEach(attr => {
          if (!attr || !attr.parameter) return
          abilities.push({
            parameter: attr.parameter,
            add: Number(attr.value) || 0,
            rate: Boolean(attr.isRate)
          })
        })
      })
      return abilities
    }
    /** 时装祝福唤醒属性：汇总所有时装物品的 blessedData.attributes */
    const fashionBlessingLines = computed(() => {
      const abilities = collectBlessingAbilityObjects(fashionItems.value)
      return mergeAbilityLines(abilities)
    })
    const jewelryEnhanceAbilityLines = computed(() => {
      const abilities = []
      jewelryItems.value.forEach(item => {
        abilities.push(...getJewelryEnhanceAbilities(item))
      })
      return mergeAbilityLines(abilities)
    })
    const armorEnhanceAbilityLines = computed(() => {
      const abilities = []
      armorItems.value.forEach(item => {
        abilities.push(...getArmorEnhanceAbilities(item))
      })
      return mergeAbilityLines(abilities)
    })
    const setBonusAbilities = computed(() => {
      const items = equippedItems.value
      if (!items.length) {
        return []
      }
      const setData = itemsStore.equipmentSets || []
      const hasSetData = Array.isArray(setData)
        ? setData.length > 0
        : Object.keys(setData || {}).length > 0
      if (!hasSetData) {
        return []
      }
      const bonuses = setBonusService.calculateSetBonuses(items, setData)
      return Object.entries(bonuses).reduce((result, [key, rawValue]) => {
        const config = setBonusKeyMap[key]
        if (!config) {
          return result
        }
        const add = normalizeSetBonusValue(rawValue, config)
        if (!Number.isFinite(add) || add === 0) {
          return result
        }
        result.push({
          parameter: config.parameter,
          add,
          rate: Boolean(config.rate)
        })
        return result
      }, [])
    })
    const setBonusAbilityLines = computed(() => mergeAbilityLines(setBonusAbilities.value))
    const totalAbilityLines = computed(() => {
      const abilities = []
      abilities.push(...collectAbilityObjectsFromItems(weaponItems.value))
      abilities.push(...collectAbilityObjectsFromItems(shieldItems.value))
      abilities.push(...collectAbilityObjectsFromItems(armorItems.value))
      abilities.push(...collectAbilityObjectsFromItems(jewelryItems.value))
      abilities.push(...collectAbilityObjectsFromItems(fashionItems.value))
      abilities.push(...collectBlessingAbilityObjects(fashionItems.value))
      abilities.push(...collectCardAbilityObjectsFromItems(weaponItems.value))
      abilities.push(...collectCardAbilityObjectsFromItems(shieldItems.value))
      abilities.push(...collectCardAbilityObjectsFromItems(armorItems.value))
      armorItems.value.forEach(item => {
        abilities.push(...getArmorEnhanceAbilities(item))
      })
      jewelryItems.value.forEach(item => {
        abilities.push(...getJewelryEnhanceAbilities(item))
      })
      if (setBonusAbilities.value.length) {
        abilities.push(...setBonusAbilities.value)
      }
      if (hasEnhanceSetBonus.value) {
        abilities.push(...enhanceSetBonusAbilities.value)
      }
      const merged = mergeAbilityObjects(abilities)
      let attackAdd = 0
      let attackAddMax = 0
      const remaining = []
      merged.forEach(ability => {
        const key = String(ability.parameter || '').toLowerCase()
        const isAttack = key === 'attack' || key === 'damage'
        if (isAttack && !ability.rate) {
          if (Number.isFinite(ability.add)) {
            attackAdd += ability.add
            if (!Number.isFinite(ability.addMax)) {
              attackAddMax += ability.add
            }
          }
          if (Number.isFinite(ability.addMax)) {
            attackAddMax += ability.addMax
          }
          return
        }
        remaining.push(ability)
      })
      const weaponRange = parseRangeValue(weaponAttackRange.value)
      let attackLine = ''
      if (weaponRange) {
        const min = weaponRange.min + attackAdd
        const max = weaponRange.max + (attackAddMax || attackAdd)
        if (min > 0 || max > 0) {
          attackLine = `攻击力 ${min}~${max}`
        }
      } else if (attackAdd > 0 || attackAddMax > 0) {
        if (attackAddMax > attackAdd) {
          attackLine = `攻击力 ${attackAdd}~${attackAddMax}`
        } else {
          attackLine = `攻击力 +${attackAdd}`
        }
      }
      const totalDefenseRange = sumRangeValues([armorDefenseRange.value, shieldDefenseRange.value])
      let totalDefenseLine = ''
      if (totalDefenseRange) {
        const { min, max } = totalDefenseRange
        if (min > 0 || max > 0) {
          totalDefenseLine = min === max ? `防御力 ${min}` : `防御力 ${min}~${max}`
        }
      }
      const defenseRange = sumRangeValues([armorEnhanceDefenseBonus.value, shieldEnhanceDefenseBonus.value])
      let defenseLine = ''
      if (defenseRange) {
        const { min, max } = defenseRange
        if (min > 0 || max > 0) {
          defenseLine = min === max ? `强化防御 +${min}` : `强化防御 +${min}~${max}`
        }
      }
      const formatted = remaining.map(formatTotalAbility).filter(Boolean)
      if (attackLine) {
        formatted.unshift(attackLine)
      }
      const elementLines = weaponElementAbilityLines.value
      if (elementLines.length) {
        const insertIndex = attackLine ? 1 : 0
        formatted.splice(insertIndex, 0, ...elementLines)
      }
      if (totalDefenseLine) {
        const insertIndex = (attackLine ? 1 : 0) + elementLines.length
        formatted.splice(insertIndex, 0, totalDefenseLine)
      }
      if (defenseLine) {
        const insertIndex = (attackLine ? 1 : 0) + elementLines.length + (totalDefenseLine ? 1 : 0)
        formatted.splice(insertIndex, 0, defenseLine)
      }
      return formatted
    })
    const weaponCardAbilityLines = computed(() => collectCardAbilitiesFromItems(weaponItems.value))
    const shieldCardAbilityLines = computed(() => collectCardAbilitiesFromItems(shieldItems.value))
    const armorCardAbilityLines = computed(() => collectCardAbilitiesFromItems(armorItems.value))
    const weaponSectionVisible = computed(() => {
      return Boolean(
        weaponAttackRange.value ||
          weaponAttackSpeed.value ||
          weaponEnhanceAttackBonus.value ||
          weaponElementAbilityLines.value.length ||
          weaponCardAbilityLines.value.length ||
          weaponAbilityLines.value.length
      )
    })
    const shieldSectionVisible = computed(() => {
      return Boolean(
        shieldDefenseRange.value ||
          shieldEnhanceDefenseBonus.value ||
          shieldCardAbilityLines.value.length ||
          shieldAbilityLines.value.length
      )
    })
    const armorSectionVisible = computed(() => {
      return Boolean(
        armorDefenseRange.value ||
          armorEnhanceDefenseBonus.value ||
          armorEnhanceAbilityLines.value.length ||
          armorCardAbilityLines.value.length ||
          armorAbilityLines.value.length ||
          setBonusAbilityLines.value.length ||
          hasEnhanceSetBonus.value
      )
    })
    const jewelrySectionVisible = computed(() => {
      return Boolean(jewelryEnhanceAbilityLines.value.length || jewelryAbilityLines.value.length)
    })
    /** 时装属性区域是否可见 */
    const fashionSectionVisible = computed(() => fashionAbilityLines.value.length > 0 || fashionBlessingLines.value.length > 0)
    const totalSectionVisible = computed(() => totalAbilityLines.value.length > 0)

    // 计算玩家头像
    const playerAvatar = computed(() => {
      if (!props.player.class) {
        return '/pt/job_icon/cxz_nan_icon.png'
      }

      const className = props.player.class.toLowerCase()
      const gender = props.player.sex === 'female' ? 'female' : 'male'

      // 使用统一的 getClassIconPath 函数，正确处理三转职业图标命名（无_icon后缀）
      return getClassIconPath(className, gender)
    })

    // 监听player数据变化，确保装备信息更新时组件重新渲染
    watch(
      () => props.player,
      (newPlayer, oldPlayer) => {
        // 当player数据变化时，强制组件更新
        // 通过触发一个自定义事件来通知父组件刷新
        if (newPlayer && oldPlayer) {
          // 检查equipment是否发生了变化
          const newEquipment = JSON.stringify(newPlayer.equipment || {})
          const oldEquipment = JSON.stringify(oldPlayer.equipment || {})

          if (newEquipment !== oldEquipment) {
            // 如果equipment发生了变化，强制重新渲染组件
           
            // 强制更新组件，通过nextTick确保DOM更新
            nextTick(() => {
              // 触发强制更新
            
            })
          }
        }
      },
      { deep: true }
    )

    // 关闭模态框
    const close = () => {
      emit('close')

      // 播放点击音效
      if (typeof window !== 'undefined' && window.playClickSound) {
        window.playClickSound()
      }
    }

    // 装备/卸下物品
    const equipItem = slot => {
      // 检查当前槽位是否已有装备
      const currentEquipment = equipment.value?.[slot]

      if (currentEquipment) {
        // 如果槽位已有装备，则卸下装备并添加回背包
        const success = BagService.unequipFromEquipment(slot)

        if (success) {
          const itemName = currentEquipment.name?.cns || currentEquipment.name || '物品'
          props.addBattleLog(`卸下 ${itemName}`, 'equip')

          if (typeof window !== 'undefined' && window.playUnequipSFX) {
            window.playUnequipSFX()
          }

          // 发送事件通知父组件更新
          emit('unequip-success', slot)

          // 发送玩家数据更新事件
          emit('player-data-updated', { source: 'store' })
        }
      } else {
        // 如果槽位没有装备，则发出equip-item事件让背包面板选择物品
        emit('equip-item', slot)
      }
    }

    // 卸下所有装备
    const unequipAll = () => {
      emit('unequip-all')
    }

    // 计算装备提供的攻击力加成
    const calculateEquipmentAttack = () => {
      if (!props.player) {
        return '0~0'
      }

      // 计算所有装备的攻击力加成
      let totalMinAttack = 0
      let totalMaxAttack = 0

      Object.values(equipment.value).forEach(item => {
        if (item) {
          // 如果是武器，则应用武器伤害计算公式
          if (item.category === 'weapon') {
            const processedItem = applyWeaponDamageFormula(item)
            totalMinAttack += processedItem.minAttack || 0
            totalMaxAttack += processedItem.maxAttack || 0
          } else {
            // 非武器装备直接累加攻击力
            totalMinAttack += item.minAttack || 0
            totalMaxAttack += item.maxAttack || 0
          }
        }
      })

      // 返回范围格式：最小攻击力~最大攻击力
      return `${totalMinAttack}~${totalMaxAttack}`
    }

    // 计算装备提供的防御力加成
    const calculateEquipmentDefense = () => {
      if (!props.player) {
        return '0~0'
      }

      // 计算装备提供的防御力加成
      let totalMinDefense = 0
      let totalMaxDefense = 0

      Object.values(equipment.value).forEach(item => {
        if (item) {
          // 累加所有防御力相关字段
          totalMinDefense += item.minDefense || 0
          totalMaxDefense += item.maxDefense || 0
        }
      })

      // 返回范围格式：最小防御力~最大防御力
      return `${totalMinDefense}~${totalMaxDefense}`
    }

    // 计算装备提供的生命值加成
    const calculateEquipmentHealth = () => {
      if (!props.player) {
        return 0
      }

      // 计算装备提供的生命值加成
      let totalHealth = 0

      Object.values(equipment.value).forEach(item => {
        if (item && item.health) {
          totalHealth += item.health
        }
      })

      return totalHealth
    }

    // 计算装备提供的魔法值加成
    const calculateEquipmentMana = () => {
      if (!props.player) {
        return 0
      }

      // 计算装备提供的魔法值加成
      let totalMana = 0

      Object.values(equipment.value).forEach(item => {
        if (item && item.mana) {
          totalMana += item.mana
        }
      })

      return totalMana
    }

    const calculateEquipmentAttackSpeed = () => {
      let total = 0

      Object.values(equipment.value).forEach(item => {
        if (!item || item.category !== 'weapon') {
          return
        }

        const value = Number(item.attackSpeedValue)
        if (Number.isFinite(value)) {
          total += value
        }
      })

      if (total <= 0) {
        return ''
      }

      const percent = total * 100
      const rounded = Math.round(percent * 10) / 10
      return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
    }

    // 显示物品提示框
    const showItemTooltip = (event, item) => {
      if (!item) {
        return
      }

      // 触发自定义事件显示物品提示框
      const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
          item,
          position: { x: event.clientX, y: event.clientY },
          source: 'equipment-slot'
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    // 强制组件更新以响应数据变化
    const forceUpdate = () => {
      // 触发一个自定义事件，通知父组件刷新
      emit('player-data-updated', { source: 'store' })
    }

    // 监听player数据变化并强制更新
    watch(
      () => props.player,
      (newPlayer, oldPlayer) => {
        if (newPlayer && oldPlayer) {
          // 检查equipment是否发生了变化
          const newEquipment = JSON.stringify(newPlayer.equipment || {})
          const oldEquipment = JSON.stringify(oldPlayer.equipment || {})

          if (newEquipment !== oldEquipment) {
            // 如果equipment发生了变化，强制更新组件
            
            forceUpdate()

            // 确保界面重新渲染
            nextTick(() => {
               
            })
          }
        }
      },
      { deep: true }
    )

    // 隐藏物品提示框
    const hideItemTooltip = () => {
      // 触发自定义事件隐藏物品提示框
      const tooltipEvent = new CustomEvent('hide-item-tooltip')
      window.dispatchEvent(tooltipEvent)
    }

    // 更新物品提示框位置
    const updateTooltipPosition = event => {
      // 触发自定义事件更新物品提示框位置
      const tooltipEvent = new CustomEvent('move-item-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      })
      window.dispatchEvent(tooltipEvent)
    }

    // 处理图片加载错误
    const handleImageError = event => {
      event.target.src = '/pt/item_icon/default_item.png'
    }

    return {
      playerAvatar,
      equipment,
      close,
      equipItem,
      unequipAll,
      calculateEquipmentAttack,
      calculateEquipmentDefense,
      calculateEquipmentAttackSpeed,
      calculateEquipmentHealth,
      calculateEquipmentMana,
      enhanceSetLevel,
      enhanceSetBonusAbilities,
      hasEnhanceSetBonus,
      formatEnhanceSetAbility,
      weaponAttackRange,
      weaponAttackRangeUsesEnhance,
      shieldDefenseRange,
      shieldDefenseRangeUsesEnhance,
      armorDefenseRange,
      armorDefenseRangeUsesEnhance,
      weaponAttackSpeed,
      weaponEnhanceAttackBonus,
      armorEnhanceDefenseBonus,
      armorEnhanceAbilityLines,
      shieldEnhanceDefenseBonus,
      weaponAbilityLines,
      shieldAbilityLines,
      armorAbilityLines,
      jewelryAbilityLines,
      jewelryEnhanceAbilityLines,
      weaponCardAbilityLines,
      shieldCardAbilityLines,
      armorCardAbilityLines,
      setBonusAbilityLines,
      totalAbilityLines,
      weaponSectionVisible,
      shieldSectionVisible,
      armorSectionVisible,
      jewelrySectionVisible,
      fashionSectionVisible,
      fashionAbilityLines,
      fashionBlessingLines,
      totalSectionVisible,
      showItemTooltip,
      hideItemTooltip,
      updateTooltipPosition,
      handleImageError
    }
  }
}
</script>

<style scoped>
  /* 装备模态框样式 */
  .equipment-modal {
    background: white;
    border-radius: 15px;
    padding: 20px;
    max-width: 900px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
  }

  .equipment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    padding-bottom: 15px;
    border-bottom: 2px solid #8b4513;
    background: linear-gradient(to right, #8b4513, #a0522d);
    padding: 10px;
    border-radius: 10px 10px 0 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .equipment-player-info {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .equipment-player-avatar {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    border: 3px solid #ffd700;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    background: #2c3e50;
  }

  .equipment-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .equipment-main {
    display: flex;
    gap: 20px;
    flex: 1;
  }

  .equipment-slots-container {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .equipment-slots-top {
    display: flex;
    /* gap: 12px; */
    justify-content: space-evenly;
  }

  .equipment-slots-middle {
    display: flex;
    /* gap: 15px; */
    flex: 1;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }

  .equipment-slots-middle-left {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100px;
    align-items: center;
    justify-content: flex-start;
  }

  .equipment-slots-middle-right {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .equipment-slots-bottom {
    display: flex;
    justify-content: space-around;
  }

  .equipment-player-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .equipment-player-avatar {
    width: 200px;
    height: 200px;
    border-radius: 10px;
    border: 3px solid #ffd700;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    background: #2c3e50;
  }

  .equipment-stats-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .equipment-slot-wrapper {
    position: relative;
    display: inline-block;
  }

  .equipment-slot-label {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    background: #4caf50;
    color: white;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    z-index: 2;
    white-space: nowrap;
  }

  .equipment-slot {
    width: 80px;
    height: 80px;
    background: linear-gradient(145deg, #2c3e50, #1a1a2e);
    border: 2px solid #5d6d7e;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    box-shadow:
      inset 0 0 10px rgba(0, 0, 0, 0.5),
      0 4px 6px rgba(0, 0, 0, 0.3);
  }

  .equipment-slot:hover {
    transform: translateY(-3px) scale(1.05);
    border-color: #f39c12;
    box-shadow:
      0 6px 12px rgba(0, 0, 0, 0.4),
      inset 0 0 15px rgba(243, 156, 18, 0.3);
    z-index: 3;
  }

  .equipment-slot:active {
    transform: translateY(1px);
  }

  .equipment-icon {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    z-index: 1;
    -webkit-user-drag: none;
    user-select: none;
  }

  .equipment-stats-overview {
    flex: 1;
    background: linear-gradient(145deg, #2c3e50, #1a1a2e);
    padding: 20px;
    border-radius: 10px;
    border: 2px solid #5d6d7e;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .equipment-stats-overview h3 {
    margin-bottom: 15px;
    color: #f39c12;
    border-bottom: 2px solid #f39c12;
    padding-bottom: 5px;
    text-align: center;
    font-weight: bold;
  }

  .stats-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stats-section {
    background: rgba(44, 62, 80, 0.7);
    border-radius: 8px;
    border: 1px solid #5d6d7e;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stats-section-title {
    font-size: 14px;
    font-weight: bold;
    color: #f39c12;
    text-align: center;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(243, 156, 18, 0.4);
  }

  .stats-section-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px;
  }

  .stat-line {
    font-size: 13px;
    font-weight: 600;
    color: #f1c40f;
    text-align: left;
  }

  .stat-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: 4px;
  }

  .stat-group-title {
    font-size: 12px;
    font-weight: bold;
    color: #e0c97a;
    text-align: left;
  }

  .stat-item {
    background: rgba(44, 62, 80, 0.7);
    padding: 10px;
    border-radius: 6px;
    border: 1px solid #5d6d7e;
    text-align: center;
  }

  .stat-label {
    font-size: 13px;
    color: #bdc3c7;
    margin-bottom: 5px;
  }

  .stat-value {
    font-size: 16px;
    font-weight: bold;
    color: #f39c12;
  }

  .stat-item-wide {
    grid-column: span 2;
  }

  .stat-value-lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-sub-value {
    font-size: 13px;
    font-weight: 600;
    color: #f1c40f;
  }

  .equipment-footer {
    display: flex;
    justify-content: space-around;
    /* gap: 0px; */
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .unequip-all-button {
    padding: 10px 20px;
    background: linear-gradient(145deg, #c0392b, #e74c3c);
    color: white;
    border: 2px solid #a93226;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .unequip-all-button:hover {
    background: linear-gradient(145deg, #e74c3c, #c0392b);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    border-color: #ff9f43;
  }

  .unequip-all-button:active {
    transform: translateY(1px);
  }

  .equipment-close-button {
    padding: 10px 20px;
    background: linear-gradient(145deg, #3498db, #2980b9);
    color: white;
    border: 2px solid #1f618d;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .equipment-close-button:hover {
    background: linear-gradient(145deg, #2980b9, #3498db);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
    border-color: #5dade2;
  }

  .equipment-close-button:active {
    transform: translateY(1px);
  }
</style>
