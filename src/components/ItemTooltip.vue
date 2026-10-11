<template>
  <Teleport to="body">
    <Transition name="item-tooltip-fade" appear>
      <div
        v-if="internalShow && internalItem"
        id="item-tooltip"
        class="item-tooltip"
        :style="{
          left: internalPosition.x + 'px',
          top: internalPosition.y + 'px',
          zIndex: '999999!important'
        }"
      >
      <!-- 终极品质标识 -->
      <div v-if="internalItem.rarity === 'ultimate'" class="ultimate-badge">
        <div class="ultimate-badge-inner">
          <div class="ultimate-badge-left">
            <span class="ultimate-badge-text">Ultimate</span>
          </div>
          <div class="ultimate-badge-right">
            <div
              v-for="i in ultimateEnhanceSlotCount"
              :key="`ultimate-slot-${i}`"
              class="ultimate-gem-slot-wrapper"
              :class="{ 'gem-embedded': isGemSlotEmbedded(internalItem, i) }"
            >
              <img
                :src="getGemSlotImage(internalItem, i)"
                class="ultimate-gem-slot"
                :alt="getGemSlotAlt(internalItem, i)"
              />
            </div>
          </div>
        </div>
      </div>
      <img :src="itemIconPath" class="item-icon" @error="handleItemImageError" />
      <h3
        :class="[getItemRarityTextClass(internalItem.rarity || 'common')]"
        :style="getItemRarityTextStyle(internalItem.rarity || 'common')"
      >
        {{ getItemDisplayName(internalItem) }}
        <span
          v-if="internalItem.StrengthenedAttributes && internalItem.StrengthenedAttributes.enhanceLevel > 0"
          :class="[getItemRarityTextClass(internalItem.rarity || 'common')]"
          :style="getItemRarityTextStyle(internalItem.rarity || 'common')"
        >
          +{{ internalItem.StrengthenedAttributes.enhanceLevel }}
        </span>
        <span v-if="internalItem.PerforationAttributes" style="color: rgb(220, 154, 255)">
          ({{ getEmbeddedCardCount(internalItem.PerforationAttributes) }}/{{
            getHoleCount(internalItem.PerforationAttributes)
          }})
        </span>
      </h3>
      <p v-if="internalItem.id && isDev">
        ID：
        <span class="item-stats">{{ internalItem.id }}</span>
      </p>
      <p v-if="internalItem.uniqueId && isDev">
        唯一ID：
        <span class="item-stats" style="color: #ffd700">{{ internalItem.uniqueId }}</span>
      </p>
      <p
        v-if="
          internalItem.element &&
          internalItem.element !== 'none' &&
          internalItem.element !== 'undefined'
        "
      >
        元素：
        <span class="item-stats">{{ internalItem.element }}</span>
      </p>
      <p v-if="internalItem.level && internalItem.level > 2">
        等级：
        <span class="item-stats">{{ internalItem.level }}</span>
      </p>
      <p v-if="internalItem.sex && internalItem.sex !== 'undefined' && internalItem.sex !== 'all'">
        性别：
        <span class="item-stats">{{ getGenderLabel(internalItem.sex) }}</span>
      </p>

    <!-- 攻击力 -->
    <p
      v-if="
        internalItem.StrengthenedAttributes &&
        (internalItem.StrengthenedAttributes.enhancedMinAttack !== undefined ||
          internalItem.StrengthenedAttributes.enhancedMaxAttack !== undefined) &&
        (internalItem.StrengthenedAttributes.enhancedMinAttack > 0 ||
          internalItem.StrengthenedAttributes.enhancedMaxAttack > 0)
      "
    >
      攻击力：
      <span class="item-stats" style="color: rgb(0, 255, 225)">
        {{
          internalItem.StrengthenedAttributes.enhancedMinAttack !== undefined
            ? internalItem.StrengthenedAttributes.enhancedMinAttack
            : 0
        }}~{{
          internalItem.StrengthenedAttributes.enhancedMaxAttack !== undefined
            ? internalItem.StrengthenedAttributes.enhancedMaxAttack
            : internalItem.StrengthenedAttributes.enhancedMinAttack !== undefined
              ? internalItem.StrengthenedAttributes.enhancedMinAttack
              : 0
        }}
      </span>
    </p>
    <p
      v-if="
        (internalItem.minAttack !== undefined || internalItem.maxAttack !== undefined) &&
        (internalItem.minAttack > 0 || internalItem.maxAttack > 0)
      "
    >
      基础攻击力：
      <span class="item-stats">
        {{ internalItem.minAttack !== undefined ? internalItem.minAttack : 0 }}~{{
          internalItem.maxAttack !== undefined
            ? internalItem.maxAttack
            : internalItem.minAttack !== undefined
              ? internalItem.minAttack
              : 0
        }}
      </span>
    </p>

    <p v-if="internalItem.attackSpeedValue !== undefined && internalItem.attackSpeedValue !== null">
      攻击速度：
      <span class="item-stats">{{ formatAttackSpeedValue(internalItem.attackSpeedValue) }}</span>
    </p>
    <p v-if="attributeEnhancementDisplay">
      <span class="item-stats">{{ attributeEnhancementDisplay }}</span>
    </p>

    <!-- 防御力 -->
    <p
      v-if="
        internalItem.StrengthenedAttributes &&
        (internalItem.StrengthenedAttributes.enhancedMinDefense !== undefined ||
          internalItem.StrengthenedAttributes.enhancedMaxDefense !== undefined) &&
        (internalItem.StrengthenedAttributes.enhancedMinDefense > 0 ||
          internalItem.StrengthenedAttributes.enhancedMaxDefense > 0)
      "
    >
      防御力：
      <span class="item-stats" style="color: rgb(0, 255, 225)">
        {{
          internalItem.StrengthenedAttributes.enhancedMinDefense !== undefined
            ? internalItem.StrengthenedAttributes.enhancedMinDefense
            : 0
        }}~{{
          internalItem.StrengthenedAttributes.enhancedMaxDefense !== undefined
            ? internalItem.StrengthenedAttributes.enhancedMaxDefense
            : internalItem.StrengthenedAttributes.enhancedMinDefense !== undefined
              ? internalItem.StrengthenedAttributes.enhancedMinDefense
              : 0
        }}
      </span>
    </p>
    <p
      v-if="
        (internalItem.minDefense !== undefined || internalItem.maxDefense !== undefined) &&
        (internalItem.minDefense > 0 || internalItem.maxDefense > 0)
      "
    >
      基础防御力：
      <span class="item-stats">
        {{ internalItem.minDefense !== undefined ? internalItem.minDefense : 0 }}~{{
          internalItem.maxDefense !== undefined
            ? internalItem.maxDefense
            : internalItem.minDefense !== undefined
              ? internalItem.minDefense
              : 0
        }}
      </span>
    </p>

    <!-- 衣服属性精炼元素抗性 -->
    <div v-if="suitResistanceLines.length" class="elemental-resistance-info">
      <p
        v-for="(resistance, index) in suitResistanceLines"
        :key="`suit-resist-${index}`"
        class="resistance-line"
        :class="{ 'resist-negative': resistance.isNegative }"
      >
        <img v-if="resistance.icon" :src="resistance.icon" class="resistance-icon" :alt="resistance.name" />
        <span>{{ resistance.name }} {{ resistance.value }}</span>
      </p>
    </div>

    <!-- 属性抗性 -->
    <div v-if="itemElementalResistances.length > 0" class="elemental-resistance-info">
      <p
        v-for="(resistance, index) in itemElementalResistances"
        :key="`item-resist-${index}`"
        class="resistance-line"
        :class="{ 'resist-negative': resistance.isNegative }"
      >
        <img v-if="resistance.icon" :src="resistance.icon" class="resistance-icon" :alt="resistance.name" />
        <span>{{ resistance.name }} {{ resistance.value }}</span>
      </p>
    </div>

    <p v-if="internalItem.rarity && internalItem.rarity !== 'undefined' && internalItem.rarity !== 'common'">
      品质：
      <span
        class="item-stats"
        :class="[getItemRarityTextClass(internalItem.rarity)]"
        :style="getItemRarityTextStyle(internalItem.rarity)"
      >
        {{ getItemRarityName(internalItem.rarity) }}
      </span>
    </p>
    <p v-if="internalItem.cooldown && internalItem.cooldown > 0">
      CD：
      <span class="item-stats">{{ internalItem.cooldown }}秒</span>
    </p>
    <p v-if="getItemTypeLabel(internalItem)">
      子类型：
      <span class="item-stats" style="color: #a5f3fc">{{ getItemTypeLabel(internalItem) }}</span>
    </p>
    <div v-if="petDisplayLines.length" class="item-abilities pet-detail-block">
      <div
        v-for="(line, index) in petDisplayLines"
        :key="`pet-detail-${index}`"
        class="ability-line"
        :class="line.className"
        :style="line.style"
      >
        {{ line.text }}
      </div>
    </div>

    <!-- 职业要求 -->
    <p v-if="itemClassRequirement">
      职业要求：
      <span class="item-stats">{{ getClassMapping(itemClassRequirement) }}</span>
    </p>

    <div v-if="filteredAbilities.length > 0" class="item-abilities">
      <div v-for="(ability, index) in filteredAbilities" :key="index" class="ability-line" style="color: #e3d090">
        {{ formatAbilityForTooltip(ability) }}
      </div>
    </div>
    <!-- 终极武器随机属性 -->
    <div v-if="internalItem.possibleRandomStats && internalItem.possibleRandomStats.length" class="item-abilities">
      <div
        v-for="(stat, index) in internalItem.possibleRandomStats"
        :key="`random-stat-${index}`"
        class="ability-line"
        style="color: #e3e102"
      >
        {{ formatRandomStat(stat) }}
      </div>
    </div>
    <div v-if="showJewelryEnhanceAbilities" class="item-abilities">
      <div class="ability-line"></div>
      <div v-for="(ability, index) in jewelryEnhanceAbilities" :key="`jewelry-enhance-${index}`" class="ability-line">
        {{ ability }}
      </div>
    </div>
    <div v-if="showEnhanceSetBonus" class="item-abilities">
      <div class="ability-line">强化+{{ enhanceSetLevel }}属性:</div>
      <div v-for="(ability, index) in enhanceSetBonusAbilities" :key="`enhance-set-${index}`" class="ability-line">
        {{ formatEnhanceSetAbility(ability) }}
      </div>
    </div>

    <!-- 物品描述 -->
    <p v-if="getItemDescription(internalItem) && !petDisplayLines.length" class="item-description">
      {{ getItemDescription(internalItem) }}
    </p>

    <!-- 持续时间 -->
    <p
      v-if="internalItem.duration !== undefined && internalItem.duration !== null"
      class="item-duration"
      style="color: #00ffcc; font-size: 0.9em; text-align: left"
    >
      持续时间：{{ formatDuration(internalItem.duration) }}
    </p>

    <!-- 捡宠召唤中实时倒计时 -->
    <p
      v-if="isItemActiveTimedPickuppet && pickuppetTooltipCountdown"
      class="item-duration pickuppet-live-countdown"
      style="color: #ffaa00; font-size: 0.95em; text-align: left; font-weight: bold"
    >
      剩余时间：{{ pickuppetTooltipCountdown }}
    </p>

    <!-- 礼包内容列表 -->
    <div v-if="internalItem.contents && internalItem.contents.length" class="tooltip-contents">
      <div class="tooltip-contents-title">包含物品:</div>
      <div v-for="(c, cIdx) in internalItem.contents" :key="`contents-${cIdx}`" class="tooltip-contents-item">
        <img class="tooltip-contents-icon" :src="`/pt/item_icon/${c.item}.png`" draggable="false" @error="handleItemImageError" />
        <span class="tooltip-contents-name">{{ getContentsItemName(c.item) }}</span>
        <span class="tooltip-contents-count">×{{ c.count }}</span>
        <span v-if="c.chance" class="tooltip-contents-chance">({{ c.chance }}%)</span>
      </div>
    </div>

    <!-- 套装信息 -->
    <div v-if="computedSetInfo" class="tooltip-set">
      <div class="set-title">
        {{ computedSetInfo.name }}
        ({{ computedSetInfo.equippedCount }}/{{ computedSetInfo.requiredCount }})
      </div>
      <p
        v-for="(part, pIndex) in computedSetInfo.partNames"
        :key="pIndex"
        :class="part.activated ? 'pnameated' : 'pname'"
      >
        {{ part.name }}
      </p>
      <p v-for="(bonus, bIndex) in computedSetInfo.bonuses" :key="bIndex">
        {{ bonus.equipped }}件套效果:
        <span :class="bonus.activated ? 'tz_activated' : 'tz_activat'">
          {{ bonus.description }}
        </span>
      </p>
    </div>

    <!-- 唤醒技能/属性 -->
    <p
      v-if="internalItem.awakenedSkillData"
      class="item-awakened-skill"
      style="color: #b50bfe; font-size: 0.9em; text-align: left"
    >
      {{ getAwakenedSkillName(internalItem.awakenedSkillData.skillId) }} 造成伤害+{{ internalItem.awakenedSkillData.skillValue }}%
    </p>
    <p
      v-if="internalItem.awakenedParameterData"
      class="item-awakened-parameter"
      style="color: #b50bfe; font-size: 0.9em; text-align: left"
    >
      {{ getAwakenedParameterName(internalItem.awakenedParameterData.parameter) }} +{{ internalItem.awakenedParameterData.value || internalItem.awakenedParameterData.parameterValue }}%
    </p>

    <!-- 祝福唤醒属性（时装物品） -->
    <div
      v-if="internalItem.blessedData && internalItem.blessedData.attributes && internalItem.blessedData.attributes.length"
      class="blessing-awakening-attrs"
      style="color: #ffd700; font-size: 0.9em; text-align: left"
    >
      <p style="color: #ffaa00; font-weight: bold; margin-bottom: 2px;">
        ✨ {{ internalItem.blessedData.blessingType === 'goddess' ? '女神的祝福' : '恶魔的祝福' }}
        <span v-if="internalItem.blessedData.blessingTypeNameEn" style="font-size: 0.85em; color: #aaa;">
          ({{ internalItem.blessedData.blessingTypeNameEn }})
        </span>
      </p>
      <p
        v-for="(attr, index) in internalItem.blessedData.attributes"
        :key="`blessing-attr-${index}`"
        style="color: #ffd700;"
      >
        {{ getAwakenedParameterName(attr.parameter) }} +{{ attr.value }}{{ attr.isRate ? '%' : '' }}
      </p>
      <p v-if="internalItem.blessedData.awakenCount" style="color: #88ccff; font-size: 0.85em; margin-top: 2px;">
        唤醒次数: {{ internalItem.blessedData.awakenCount }}
      </p>
    </div>

    <!-- 卡片属性 -->
    <div
      v-if="
        internalItem.PerforationAttributes &&
        getEmbeddedCardCount(internalItem.PerforationAttributes) > 0
      "
      class="card-attributes"
      style="color: rgb(220, 154, 255); font-size: 0.9em; text-align: left"
    >
      <p
        v-for="(displayText, index) in getCardAbilities(
          getEmbeddedCardsForDisplay(internalItem.PerforationAttributes)
        )"
        :key="index"
      >
        {{ displayText }}
      </p>
    </div>

    <!-- 镶嵌宝石属性 -->
    <div v-if="hasEmbeddedGems(internalItem)" class="embedded-gems-section">
      <p
        v-for="(effect, index) in mergedGemEffects"
        :key="index"
        class="embedded-gem-item"
      >
        {{ formatMergedGemEffect(effect) }}
      </p>
    </div>

    <!-- 精炼信息 -->
    <p
      v-if="
        internalItem.StrengthenedAttributes && internalItem.StrengthenedAttributes.enhanceCount > 0
      "
      class="item-enhance-count"
      style="color: #a2a7a2; font-size: 0.9em; text-align: left"
    >
      精炼次数 : {{ internalItem.StrengthenedAttributes.enhanceCount }}
    </p>
    <!-- 精炼属性次数 -->
    <p
      v-if="attributeEnhanceCount > 0"
      class="item-attribute-enhance-count"
      style="color: #a2a7a2; font-size: 0.9em; text-align: left"
    >
      精炼属性次数 : {{ attributeEnhanceCount }}
    </p>

    <!-- 穿洞信息 -->
      <p
        v-if="
          internalItem.PerforationAttributes &&
          getPerforationCount(internalItem.PerforationAttributes) > 0
        "
        class="item-perforation-count"
        style="color: rgb(220, 154, 255); font-size: 0.9em; text-align: left"
      >
        穿洞次数 : {{ getPerforationCount(internalItem.PerforationAttributes) }}
      </p>

    <!-- 可转化为终极武器提示 -->
    <p
      v-if="isConvertibleEpicWeapon"
      class="item-convertible-tip"
      style="color: #f2f200; font-size: 0.9em; text-align: left"
    >
      可转化为终极武器
    </p>
      </div>
    </Transition>
    <Transition name="item-tooltip-fade" appear>
      <div
        v-if="showComparePanel"
        id="item-compare-panel"
        class="item-tooltip item-compare-panel"
        :style="comparePanelStyle"
      >
        <!-- 终极品质标识（对比面板） -->
        <div v-if="compareItem?.rarity === 'ultimate'" class="ultimate-badge ultimate-badge-compare">
          <div class="ultimate-badge-inner">
            <div class="ultimate-badge-left">
              <span class="ultimate-badge-text">Ultimate</span>
            </div>
            <div class="ultimate-badge-right">
              <div
                v-for="i in compareUltimateEnhanceSlotCount"
                :key="`compare-ultimate-slot-${i}`"
                class="ultimate-gem-slot-wrapper"
                :class="{ 'gem-embedded': isGemSlotEmbedded(compareItem, i) }"
              >
                <img
                  :src="getGemSlotImage(compareItem, i)"
                  class="ultimate-gem-slot"
                  :alt="getGemSlotAlt(compareItem, i)"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="compare-equipped-label">已装备</div>
        <img :src="compareItemIconPath" class="item-icon" @error="handleCompareImageError" />
        <h3
          :class="[getItemRarityTextClass(compareItem?.rarity || 'common')]"
          :style="getItemRarityTextStyle(compareItem?.rarity || 'common')"
        >
          {{ getItemDisplayName(compareItem) }}
          <span
            v-if="compareItem?.StrengthenedAttributes && compareItem.StrengthenedAttributes.enhanceLevel > 0"
            :class="[getItemRarityTextClass(compareItem?.rarity || 'common')]"
            :style="getItemRarityTextStyle(compareItem?.rarity || 'common')"
          >
            +{{ compareItem.StrengthenedAttributes.enhanceLevel }}
          </span>
          <span v-if="compareItem?.PerforationAttributes" style="color: rgb(220, 154, 255)">
            ({{ getEmbeddedCardCount(compareItem.PerforationAttributes) }}/{{
              getHoleCount(compareItem.PerforationAttributes)
            }})
          </span>
        </h3>
        <p v-if="compareItem?.id && isDev">
          ID：
          <span class="item-stats">{{ compareItem.id }}</span>
        </p>
        <p v-if="compareItem?.uniqueId && isDev">
          唯一ID：
          <span class="item-stats" style="color: #ffd700">{{ compareItem.uniqueId }}</span>
        </p>
        <p v-if="compareItem?.element && compareItem.element !== 'none' && compareItem.element !== 'undefined'">
          元素：
          <span class="item-stats">{{ compareItem.element }}</span>
        </p>
        <p v-if="compareItem?.level && compareItem.level > 2">
          等级：
          <span class="item-stats">{{ compareItem.level }}</span>
        </p>
        <p v-if="compareItem?.sex && compareItem.sex !== 'undefined' && compareItem.sex !== 'all'">
          性别：
          <span class="item-stats">{{ getGenderLabel(compareItem.sex) }}</span>
        </p>

        <p
          v-if="
            compareItem?.StrengthenedAttributes &&
            (compareItem.StrengthenedAttributes.enhancedMinAttack !== undefined ||
              compareItem.StrengthenedAttributes.enhancedMaxAttack !== undefined) &&
            (compareItem.StrengthenedAttributes.enhancedMinAttack > 0 ||
              compareItem.StrengthenedAttributes.enhancedMaxAttack > 0)
          "
        >
          攻击力：
          <span class="item-stats" style="color: rgb(0, 255, 225)">
            {{
              compareItem.StrengthenedAttributes.enhancedMinAttack !== undefined
                ? compareItem.StrengthenedAttributes.enhancedMinAttack
                : 0
            }}~{{
              compareItem.StrengthenedAttributes.enhancedMaxAttack !== undefined
                ? compareItem.StrengthenedAttributes.enhancedMaxAttack
                : compareItem.StrengthenedAttributes.enhancedMinAttack !== undefined
                  ? compareItem.StrengthenedAttributes.enhancedMinAttack
                  : 0
            }}
          </span>
        </p>
        <p
          v-if="
            (compareItem?.minAttack !== undefined || compareItem?.maxAttack !== undefined) &&
            (compareItem.minAttack > 0 || compareItem.maxAttack > 0)
          "
        >
          基础攻击力：
          <span class="item-stats">
            {{ compareItem.minAttack !== undefined ? compareItem.minAttack : 0 }}~{{
              compareItem.maxAttack !== undefined
                ? compareItem.maxAttack
                : compareItem.minAttack !== undefined
                  ? compareItem.minAttack
                  : 0
            }}
          </span>
        </p>

        <p v-if="compareItem?.attackSpeedValue !== undefined && compareItem.attackSpeedValue !== null">
          攻击速度：
          <span class="item-stats">{{ formatAttackSpeedValue(compareItem.attackSpeedValue) }}</span>
        </p>
        <p v-if="compareAttributeEnhancementDisplay">
          属性强化等级：
          <span class="item-stats">{{ compareAttributeEnhancementDisplay }}</span>
        </p>

        <p
          v-if="
            compareItem?.StrengthenedAttributes &&
            (compareItem.StrengthenedAttributes.enhancedMinDefense !== undefined ||
              compareItem.StrengthenedAttributes.enhancedMaxDefense !== undefined) &&
            (compareItem.StrengthenedAttributes.enhancedMinDefense > 0 ||
              compareItem.StrengthenedAttributes.enhancedMaxDefense > 0)
          "
        >
          防御力：
          <span class="item-stats" style="color: rgb(0, 255, 225)">
            {{
              compareItem.StrengthenedAttributes.enhancedMinDefense !== undefined
                ? compareItem.StrengthenedAttributes.enhancedMinDefense
                : 0
            }}~{{
              compareItem.StrengthenedAttributes.enhancedMaxDefense !== undefined
                ? compareItem.StrengthenedAttributes.enhancedMaxDefense
                : compareItem.StrengthenedAttributes.enhancedMinDefense !== undefined
                  ? compareItem.StrengthenedAttributes.enhancedMinDefense
                  : 0
            }}
          </span>
        </p>
        <p
          v-if="
            (compareItem?.minDefense !== undefined || compareItem?.maxDefense !== undefined) &&
            (compareItem.minDefense > 0 || compareItem.maxDefense > 0)
          "
        >
          基础防御力：
          <span class="item-stats">
            {{ compareItem.minDefense !== undefined ? compareItem.minDefense : 0 }}~{{
              compareItem.maxDefense !== undefined
                ? compareItem.maxDefense
                : compareItem.minDefense !== undefined
                  ? compareItem.minDefense
                  : 0
            }}
          </span>
        </p>
        <!-- 对比物品衣服属性精炼元素抗性 -->
        <div v-if="compareSuitResistanceLines.length" class="elemental-resistance-info">
          <p
            v-for="(resistance, index) in compareSuitResistanceLines"
            :key="`compare-suit-resist-${index}`"
            class="resistance-line"
            :class="{ 'resist-negative': resistance.isNegative }"
          >
            <img v-if="resistance.icon" :src="resistance.icon" class="resistance-icon" :alt="resistance.name" />
            <span>{{ resistance.name }} {{ resistance.value }}</span>
          </p>
        </div>
        <div v-if="compareShowEnhanceSetBonus" class="item-abilities">
          <div class="ability-line">强化+{{ enhanceSetLevel }}属性:</div>
          <div v-for="(ability, index) in enhanceSetBonusAbilities" :key="`compare-enhance-set-${index}`" class="ability-line">
            {{ formatEnhanceSetAbility(ability) }}
          </div>
        </div>

        <p v-if="compareItem?.rarity && compareItem.rarity !== 'undefined' && compareItem.rarity !== 'common'">
          品质：
          <span
             class="item-stats"
            :class="[getItemRarityTextClass(compareItem.rarity)]"
            :style="getItemRarityTextStyle(compareItem.rarity)"
          >
            {{ getItemRarityName(compareItem.rarity) }}
          </span>
        </p>
        <p v-if="compareItem?.cooldown && compareItem.cooldown > 0">
          CD：
          <span class="item-stats">{{ compareItem.cooldown }}秒</span>
        </p>
        <div v-if="comparePetDisplayLines.length" class="item-abilities pet-detail-block">
          <div
            v-for="(line, index) in comparePetDisplayLines"
            :key="`compare-pet-detail-${index}`"
            class="ability-line"
            :class="line.className"
            :style="line.style"
          >
            {{ line.text }}
          </div>
        </div>

        <p v-if="compareItemClassRequirement">
          职业要求：
          <span class="item-stats">{{ getClassMapping(compareItemClassRequirement) }}</span>
        </p>

        <div v-if="compareItem?.abilities && compareItem.abilities.length" class="item-abilities">
          <div v-for="(ability, index) in compareItem.abilities" :key="`compare-ability-${index}`" class="ability-line" style="color: #e3d090">
            {{ formatAbility(ability) }}
          </div>
        </div>
        <!-- 终极武器随机属性（对比面板） -->
        <div v-if="compareItem?.possibleRandomStats && compareItem.possibleRandomStats.length" class="item-abilities">
          <div
            v-for="(stat, index) in compareItem.possibleRandomStats"
            :key="`compare-random-stat-${index}`"
            class="ability-line"
            style="color: #e3e102"
          >
            {{ formatRandomStat(stat) }}
          </div>
        </div>
        <div v-if="showCompareJewelryEnhanceAbilities" class="item-abilities">
          <div class="ability-line">首饰强化属性:</div>
          <div v-for="(ability, index) in compareJewelryEnhanceAbilities" :key="`compare-jewelry-enhance-${index}`" class="ability-line">
            {{ ability }}
          </div>
        </div>
        <div v-if="compareEnhanceUpgradeAbilities.length" class="item-abilities">
          <div class="ability-line">强化属性:</div>
          <div v-for="(ability, index) in compareEnhanceUpgradeAbilities" :key="`compare-enhance-${index}`" class="ability-line">
            {{ ability }}
          </div>
        </div>

        <p v-if="getItemDescription(compareItem) && !comparePetDisplayLines.length" class="item-description">
          {{ getItemDescription(compareItem) }}
        </p>

        <div v-if="compareSetInfo" class="tooltip-set">
          <div class="set-title">
            {{ compareSetInfo.name }}
            ({{ compareSetInfo.equippedCount }}/{{ compareSetInfo.requiredCount }})
          </div>
          <p
            v-for="(part, pIndex) in compareSetInfo.partNames"
            :key="`compare-set-part-${pIndex}`"
            :class="part.activated ? 'pnameated' : 'pname'"
          >
            {{ part.name }}
          </p>
          <p v-for="(bonus, bIndex) in compareSetInfo.bonuses" :key="`compare-set-bonus-${bIndex}`">
            {{ bonus.equipped }}件套效果:
            <span :class="bonus.activated ? 'tz_activated' : 'tz_activat'">
              {{ bonus.description }}
            </span>
          </p>
        </div>

        <!-- 唤醒技能/属性（对比面板） -->
        <p
          v-if="compareItem?.awakenedSkillData"
          class="item-awakened-skill"
          style="color: #b50bfe; font-size: 0.9em; text-align: left"
        >
          {{ getAwakenedSkillName(compareItem.awakenedSkillData.skillId) }} 造成伤害+{{ compareItem.awakenedSkillData.skillValue }}%
        </p>
        <p
          v-if="compareItem?.awakenedParameterData"
          class="item-awakened-parameter"
          style="color: #b50bfe; font-size: 0.9em; text-align: left"
        >
          {{ getAwakenedParameterName(compareItem.awakenedParameterData.parameter) }} +{{ compareItem.awakenedParameterData.value || compareItem.awakenedParameterData.parameterValue }}%
        </p>

        <!-- 祝福唤醒属性（对比面板-时装物品） -->
        <div
          v-if="compareItem?.blessedData && compareItem.blessedData.attributes && compareItem.blessedData.attributes.length"
          class="blessing-awakening-attrs"
          style="color: #ffd700; font-size: 0.9em; text-align: left"
        >
          <p style="color: #ffaa00; font-weight: bold; margin-bottom: 2px;">
            ✨ {{ compareItem.blessedData.blessingType === 'goddess' ? '女神的祝福' : '恶魔的祝福' }}
            <span v-if="compareItem.blessedData.blessingTypeNameEn" style="font-size: 0.85em; color: #aaa;">
              ({{ compareItem.blessedData.blessingTypeNameEn }})
            </span>
          </p>
          <p
            v-for="(attr, index) in compareItem.blessedData.attributes"
            :key="`compare-blessing-attr-${index}`"
            style="color: #ffd700;"
          >
            {{ getAwakenedParameterName(attr.parameter) }} +{{ attr.value }}{{ attr.isRate ? '%' : '' }}
          </p>
          <p v-if="compareItem.blessedData.awakenCount" style="color: #88ccff; font-size: 0.85em; margin-top: 2px;">
            唤醒次数: {{ compareItem.blessedData.awakenCount }}
          </p>
        </div>

        <div
          v-if="compareItem?.PerforationAttributes && getEmbeddedCardCount(compareItem.PerforationAttributes) > 0"
          class="card-attributes"
          style="color: rgb(220, 154, 255); font-size: 0.9em; text-align: left"
        >
          <p
            v-for="(displayText, index) in getCardAbilities(
              getEmbeddedCardsForDisplay(compareItem.PerforationAttributes)
            )"
            :key="`compare-card-${index}`"
          >
            {{ displayText }}
          </p>
        </div>

        <!-- 镶嵌宝石属性（对比面板） -->
        <div v-if="hasEmbeddedGems(compareItem)" class="embedded-gems-section">
          <p
            v-for="(effect, index) in compareMergedGemEffects"
            :key="index"
            class="embedded-gem-item"
          >
            {{ formatMergedGemEffect(effect) }}
          </p>
        </div>

        <p
          v-if="compareItem?.StrengthenedAttributes && compareItem.StrengthenedAttributes.enhanceCount > 0"
          class="item-enhance-count"
          style="color: #a2a7a2; font-size: 0.9em; text-align: left"
        >
          精炼次数 : {{ compareItem.StrengthenedAttributes.enhanceCount }}
        </p>
        <!-- 精炼属性次数（对比面板） -->
        <p
          v-if="compareAttributeEnhanceCount > 0"
          class="item-attribute-enhance-count"
          style="color: #a2a7a2; font-size: 0.9em; text-align: left"
        >
          精炼属性次数 : {{ compareAttributeEnhanceCount }}
        </p>

        <p
          v-if="compareItem?.PerforationAttributes && getPerforationCount(compareItem.PerforationAttributes) > 0"
          class="item-perforation-count"
          style="color: rgb(220, 154, 255); font-size: 0.9em; text-align: left"
        >
          穿洞次数 : {{ getPerforationCount(compareItem.PerforationAttributes) }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useGameStore, usePickuppetSummonStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { usePetsStore } from '@/store/pets'
import { SetBonusService } from '@/services/SetBonusService'
import { getRarityName, getGenderName, classMapping as importedClassMapping } from '@/utils/itemHelpers'
import { imageService } from '@/services/ImageService'
import { ELEMENT_NAMES, ABILITY_PARAMETER_MAP, getParameterName } from '@/store/descriptions'
import { formatAbility as formatAbilityUtil, getSkillName, PERCENT_PARAMETERS } from '@/utils/effectFormatter'
import { useWeaponAwakening } from '@/composables/useWeaponAwakening'
import { ELEMENT_KEYS, ELEMENT_LABELS, ELEMENT_ICON_MAP, DEFENSE_PARAM_TO_ELEMENT_KEY } from '@/utils/elementalResistanceCalculator'

// 使用 Pinia Store
const itemsStore = useItemsStore()
const gameStore = useGameStore()
const petsStore = usePetsStore()
const pickuppetSummonStore = usePickuppetSummonStore()

// 使用武器唤醒组合式函数
const { getSkillNameById } = useWeaponAwakening()

/**
 * 获取唤醒技能名称
 * @param {number|string} skillId - 技能ID
 * @returns {string} 技能名称（中文）
 */
const getAwakenedSkillName = skillId => {
  return getSkillNameById(skillId)
}

/**
 * 获取唤醒参数名称（使用 Pinia 统一映射）
 * @param {string} parameter - 参数键名
 * @returns {string} 参数名称（中文）
 */
const getAwakenedParameterName = parameter => {
  return getParameterName(parameter)
}

// 开发模式判断
const isDev = import.meta.env.DEV

const getSetInfoForItem = item => {
  if (!item) {
    return null
  }
  return getItemSetInfo(item.id)
}

const computedSetInfo = computed(() => getSetInfoForItem(internalItem.value))

/**
 * 判断当前物品是否为可转化为终极武器的史诗品质武器
 * 使用 ultimateConvertible 字段判断
 * 已是终极品质的武器不显示此提示
 */
const isConvertibleEpicWeapon = computed(() => {
  const item = internalItem.value
  if (!item) return false
  // 检查是否为武器类型
  if (item.category !== 'weapon') return false
  // 已是终极品质的武器不显示"可转化为终极武器"
  if (item.rarity === 'ultimate') return false
  // 检查 ultimateConvertible 字段
  // 优先使用物品实例的值，如果没有则从 itemConfig 获取
  if (item.ultimateConvertible !== undefined) {
    return item.ultimateConvertible === true
  }
  // 兼容旧数据：从 itemConfig 获取
  const itemConfig = itemsStore.getItemConfig(item.id)
  return itemConfig?.ultimateConvertible === true
})

const resolveEnhanceLevel = item => {
  const level = Number(item?.StrengthenedAttributes?.enhanceLevel ?? item?.enhanceLevel ?? 0)
  return Number.isFinite(level) ? level : 0
}

/**
 * 获取终极武器的强化等级对应的宝石槽位数
* 用途/业务意图：只有强化等级大于0时才显示宝石槽，强化等级等于宝石槽数量，最多10个
* @param {Object} item - 物品数据
* @returns {number} 宝石槽位数量（0-10）
*/
const getUltimateEnhanceSlotCount = item => {
  // 只有终极品质武器才显示宝石槽
  if (!item || item.rarity !== 'ultimate' || item.category !== 'weapon') {
    return 0
  }
  const enhanceLevel = resolveEnhanceLevel(item)
  // 没有强化等级时不显示宝石槽
  if (enhanceLevel <= 0) {
    return 0
  }
  // 强化等级等于宝石槽数量，最大10个
  return Math.min(10, enhanceLevel)
}

/**
 * 主物品的终极武器宝石槽位数
 * 用途/业务意图：用于渲染空宝石图标数量
 */
const ultimateEnhanceSlotCount = computed(() => getUltimateEnhanceSlotCount(internalItem.value))

/**
 * 对比面板物品的终极武器宝石槽位数
 * 用途/业务意图：用于渲染对比面板中的空宝石图标数量
 */
const compareUltimateEnhanceSlotCount = computed(() => getUltimateEnhanceSlotCount(compareItem.value))

/**
 * 检查物品是否有镶嵌的宝石
 * 用途/业务意图：判断是否显示镶嵌宝石属性区域
 * @param {Object} item - 物品数据
 * @returns {boolean} 是否有镶嵌宝石
 */
const hasEmbeddedGems = item => {
  if (!item || !item.embeddedGems) return false
  return Object.keys(item.embeddedGems).length > 0
}

/**
 * 格式化宝石效果显示文本
 * 用途/业务意图：将宝石效果数组转换为可读的属性文本
 * @param {Array} gemEffect - 宝石效果数组
 * @returns {string} 格式化后的属性文本
 */
const formatGemEffect = gemEffect => {
  if (!gemEffect || !Array.isArray(gemEffect) || gemEffect.length === 0) {
    return '无属性'
  }
  
  return gemEffect.map(effect => {
    const paramName = getParameterDisplayName(effect.parameter)
    const valueStr = effect.rate ? `+${effect.add}%` : `+${effect.add}`
    return `${paramName}${valueStr}`
  }).join(', ')
}

/**
 * 合并所有镶嵌宝石的相同属性效果
 * 用途/业务意图：将多个宝石的相同属性累加显示，例如5个攻击力+20的宝石显示为攻击力+100
 * @param {Object} item - 物品数据
 * @returns {Array} 合并后的属性列表，每项包含 { parameter, add, rate, displayName }
 */
const getMergedGemEffects = item => {
  if (!item || !item.embeddedGems) {
    return []
  }
  
  const mergedMap = new Map()
  
  // 遍历所有宝石，累加相同属性
  Object.values(item.embeddedGems).forEach(gem => {
    // 支持两种属性名：gemEffect 和 abilities
    const effects = gem.gemEffect || gem.abilities
    if (!effects || !Array.isArray(effects)) {
      return
    }
    
    effects.forEach(effect => {
      // 使用 parameter+rate 作为key来区分固定值和百分比
      const key = `${effect.parameter}_${effect.rate ? 'percent' : 'fixed'}`
      
      if (mergedMap.has(key)) {
        // 累加值
        mergedMap.get(key).add += effect.add
      } else {
        // 新增属性
        mergedMap.set(key, {
          parameter: effect.parameter,
          add: effect.add,
          rate: effect.rate || false,
          displayName: getParameterDisplayName(effect.parameter)
        })
      }
    })
  })
  
  // 转换为数组返回
  return Array.from(mergedMap.values())
}

/**
 * 格式化合并后的宝石效果显示文本
 * 用途/业务意图：将合并后的属性效果格式化为显示文本
 * @param {Object} effect - 合并后的属性效果对象
 * @returns {string} 格式化后的属性文本
 */
const formatMergedGemEffect = effect => {
  if (!effect) return ''
  const valueStr = effect.rate ? `+${effect.add}%` : `+${effect.add}`
  return `${effect.displayName}${valueStr}`
}

/**
 * 主物品的合并宝石效果
 * 用途/业务意图：用于显示合并后的宝石属性
 */
const mergedGemEffects = computed(() => getMergedGemEffects(internalItem.value))

/**
 * 对比面板物品的合并宝石效果
 * 用途/业务意图：用于显示对比面板中合并后的宝石属性
 */
const compareMergedGemEffects = computed(() => getMergedGemEffects(compareItem.value))

/**
 * 获取宝石槽位图片
 * 用途/业务意图：如果该槽位已镶嵌宝石则显示宝石图片，否则显示空槽图片
 * @param {Object} item - 物品数据
 * @param {number} slotIndex - 槽位索引（从1开始）
 * @returns {string} 图片路径
 */
const getGemSlotImage = (item, slotIndex) => {
  if (!item || !item.embeddedGems) {
    return '/pt/item_icon/baoshi.png'
  }
  
  // 查找对应槽位的宝石（gem1, gem2, ...）
  const gemKey = `gem${slotIndex}`
  const gem = item.embeddedGems[gemKey]
  
  if (gem && gem.gemId) {
    return `/pt/item_icon/${gem.gemId}.png`
  }
  
  return '/pt/item_icon/baoshi.png'
}

/**
 * 判断宝石槽位是否已镶嵌宝石
 * 用途/业务意图：用于给已镶嵌宝石的槽位添加特殊样式类
 * @param {Object} item - 物品数据
 * @param {number} slotIndex - 槽位索引（从1开始）
 * @returns {boolean} 是否已镶嵌宝石
 */
const isGemSlotEmbedded = (item, slotIndex) => {
  if (!item || !item.embeddedGems) {
    return false
  }
  
  const gemKey = `gem${slotIndex}`
  const gem = item.embeddedGems[gemKey]
  
  return !!(gem && gem.gemId)
}

/**
 * 获取宝石槽位alt文本
 * 用途/业务意图：为宝石槽位提供描述性文本
 * @param {Object} item - 物品数据
 * @param {number} slotIndex - 槽位索引（从1开始）
 * @returns {string} alt文本
 */
const getGemSlotAlt = (item, slotIndex) => {
  if (!item || !item.embeddedGems) {
    return '空宝石槽'
  }
  
  const gemKey = `gem${slotIndex}`
  const gem = item.embeddedGems[gemKey]
  
  if (gem && gem.gemName) {
    return gem.gemName
  }
  
  return '空宝石槽'
}

const resolveEnhanceUpgradeAbilities = (item, enhanceLevel) => {
  const upgradeLevels = Array.isArray(item?.upgradeLevels) ? item.upgradeLevels : []
  if (!upgradeLevels.length) {
    return []
  }
  const matched =
    upgradeLevels.find(level => Number(level?.upgradeLevel) === enhanceLevel) ||
    upgradeLevels[enhanceLevel]
  const abilities = Array.isArray(matched?.abilities) ? matched.abilities : []
  return abilities
}
const resolveStrengthenedAbilities = (item, enhanceLevel) => {
  const attrs = item?.StrengthenedAttributes || {}
  const levelAttrs = attrs[String(enhanceLevel)] || {}
  if (Array.isArray(levelAttrs.abilities)) {
    return levelAttrs.abilities
  }
  if (Array.isArray(attrs.abilities)) {
    return attrs.abilities
  }
  return []
}
const buildEnhanceRangeAbilities = (item, enhanceLevel) => {
  if (!item) {
    return []
  }
  const category = String(item.category || '').toLowerCase()
  const attrs = item?.StrengthenedAttributes || {}
  const levelAttrs = attrs[String(enhanceLevel)] || {}
  if (category === 'weapon') {
    const enhancedMin = Number(attrs.enhancedMinAttack ?? levelAttrs.enhancedMinAttack)
    const enhancedMax = Number(attrs.enhancedMaxAttack ?? levelAttrs.enhancedMaxAttack)
    const baseMin = Number(item.minAttack ?? 0)
    const baseMax = Number(item.maxAttack ?? baseMin)
    if (!Number.isFinite(enhancedMin) && !Number.isFinite(enhancedMax)) {
      return []
    }
    const resolvedEnhancedMin = Number.isFinite(enhancedMin) ? enhancedMin : enhancedMax
    const resolvedEnhancedMax = Number.isFinite(enhancedMax) ? enhancedMax : enhancedMin
    if (!Number.isFinite(resolvedEnhancedMin) || !Number.isFinite(resolvedEnhancedMax)) {
      return []
    }
    let minBonus = resolvedEnhancedMin - baseMin
    let maxBonus = resolvedEnhancedMax - baseMax
    if (!Number.isFinite(minBonus)) {
      minBonus = maxBonus
    }
    if (!Number.isFinite(maxBonus)) {
      maxBonus = minBonus
    }
    if (minBonus <= 0 && maxBonus <= 0) {
      return []
    }
    if (minBonus <= 0 && maxBonus > 0) {
      minBonus = maxBonus
    }
    const add = Math.round(minBonus)
    const addMax = Math.round(maxBonus)
    if (addMax > add) {
      return [{ parameter: 'attack', add, addMax }]
    }
    return [{ parameter: 'attack', add }]
  }
  if (category === 'armor') {
    const enhancedMin = Number(attrs.enhancedMinDefense ?? levelAttrs.enhancedMinDefense)
    const enhancedMax = Number(attrs.enhancedMaxDefense ?? levelAttrs.enhancedMaxDefense)
    const baseMin = Number(item.minDefense ?? 0)
    const baseMax = Number(item.maxDefense ?? baseMin)
    if (!Number.isFinite(enhancedMin) && !Number.isFinite(enhancedMax)) {
      return []
    }
    const resolvedEnhancedMin = Number.isFinite(enhancedMin) ? enhancedMin : enhancedMax
    const resolvedEnhancedMax = Number.isFinite(enhancedMax) ? enhancedMax : enhancedMin
    if (!Number.isFinite(resolvedEnhancedMin) || !Number.isFinite(resolvedEnhancedMax)) {
      return []
    }
    let minBonus = resolvedEnhancedMin - baseMin
    let maxBonus = resolvedEnhancedMax - baseMax
    if (!Number.isFinite(minBonus)) {
      minBonus = maxBonus
    }
    if (!Number.isFinite(maxBonus)) {
      maxBonus = minBonus
    }
    if (minBonus <= 0 && maxBonus <= 0) {
      return []
    }
    if (minBonus <= 0 && maxBonus > 0) {
      minBonus = maxBonus
    }
    const add = Math.round(minBonus)
    const addMax = Math.round(maxBonus)
    if (addMax > add) {
      return [{ parameter: 'def', add, addMax }]
    }
    return [{ parameter: 'def', add }]
  }
  return []
}
const buildEnhanceUpgradeAbilities = item => {
  if (!item) {
    return []
  }
  const enhanceLevel = resolveEnhanceLevel(item)
  if (enhanceLevel <= 0) {
    return []
  }
  const category = String(item.category || '').toLowerCase()
  if (category === 'jewelry') {
    return resolveEnhanceUpgradeAbilities(item, enhanceLevel)
  }
  if (category === 'armor') {
    const upgradeAbilities = resolveEnhanceUpgradeAbilities(item, enhanceLevel)
    const abilities = upgradeAbilities.length
      ? upgradeAbilities
      : resolveStrengthenedAbilities(item, enhanceLevel)
    if (!abilities.length) {
      const rangeAbilities = buildEnhanceRangeAbilities(item, enhanceLevel)
      if (rangeAbilities.length) {
        return rangeAbilities
      }
    }
    return abilities
  }
  if (category === 'weapon') {
    const upgradeAbilities = resolveEnhanceUpgradeAbilities(item, enhanceLevel)
    const abilities = upgradeAbilities.length
      ? upgradeAbilities
      : resolveStrengthenedAbilities(item, enhanceLevel)
    if (!abilities.length) {
      const rangeAbilities = buildEnhanceRangeAbilities(item, enhanceLevel)
      if (rangeAbilities.length) {
        return rangeAbilities
      }
    }
    return abilities
  }
  return []
}
 
const formatAbilityLines = abilities => {
  if (!Array.isArray(abilities) || abilities.length === 0) {
    return []
  }
  return abilities.map(formatAbility).filter(Boolean)
}
const attributeElementLabelMap = ELEMENT_NAMES
const resolveAttributeEnhancementInfo = item => {
  const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
  if (!elemental || typeof elemental !== 'object') {
    return null
  }
  const enhanceCount = Number(elemental?.attributeEnhanceCount ?? 0)
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
  return {
    ...resolved,
    enhanceCount: Number.isFinite(enhanceCount) ? enhanceCount : 0
  }
}
const attributeEnhancementDisplay = computed(() => {
  const info = resolveAttributeEnhancementInfo(internalItem.value)
  if (!info) {
    return ''
  }
  return `${info.label}+${info.level}`
})
const compareAttributeEnhancementDisplay = computed(() => {
  const info = resolveAttributeEnhancementInfo(compareItem.value)
  if (!info) {
    return ''
  }
  return `${info.label}+${info.level}`
})

/**
 * 主物品的衣服属性精炼元素抗性显示行
 * 用途/业务意图：从 elementalEnhancement 中读取 elementResistances，
 * 构建带元素图标的抗性显示对象，与 itemElementalResistances 样式统一
 * @returns {Array<{name: string, value: string, icon: string, elementKey: string, isNegative: boolean}>}
 */
const suitResistanceLines = computed(() => {
  const item = internalItem.value
  if (!item || item.category !== 'armor' || item.subcategory !== 'suit') {
    return []
  }
  const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
  if (!elemental || typeof elemental !== 'object') {
    return []
  }
  // 找到强化等级最高的元素
  let bestEntry = null
  for (const key of ELEMENT_KEYS) {
    const level = Number(elemental[key]?.enhancementLevel ?? 0)
    if (level > 0 && (!bestEntry || level > bestEntry.level)) {
      bestEntry = { key, level }
    }
  }
  if (!bestEntry) {
    return []
  }
  const resistances = elemental[bestEntry.key]?.elementResistances
  if (!resistances || typeof resistances !== 'object') {
    return []
  }
  // 构建带图标的抗性显示对象，与 itemElementalResistances 样式统一
  return ELEMENT_KEYS
    .map(key => {
      const value = Number(resistances[key] ?? 0)
      if (!Number.isFinite(value) || value === 0) {
        return null
      }
      const label = ELEMENT_LABELS[key] || key
      const signStr = value > 0 ? '+' : '-'
      const absValue = Math.abs(value)
      return {
        name: `${label}属性抗性`,
        value: `${signStr}${absValue}%`,
        icon: ELEMENT_ICON_MAP[key] || '',
        elementKey: key,
        isNegative: value < 0
      }
    })
    .filter(Boolean)
})

/**
 * 对比物品的衣服属性精炼元素抗性显示行
 * 用途/业务意图：与 suitResistanceLines 逻辑一致，返回带图标的抗性显示对象
 * @returns {Array<{name: string, value: string, icon: string, elementKey: string, isNegative: boolean}>}
 */
const compareSuitResistanceLines = computed(() => {
  const item = compareItem.value
  if (!item || item.category !== 'armor' || item.subcategory !== 'suit') {
    return []
  }
  const elemental = item?.elementalEnhancement || item?.StrengthenedAttributes?.elementalEnhancement
  if (!elemental || typeof elemental !== 'object') {
    return []
  }
  let bestEntry = null
  for (const key of ELEMENT_KEYS) {
    const level = Number(elemental[key]?.enhancementLevel ?? 0)
    if (level > 0 && (!bestEntry || level > bestEntry.level)) {
      bestEntry = { key, level }
    }
  }
  if (!bestEntry) {
    return []
  }
  const resistances = elemental[bestEntry.key]?.elementResistances
  if (!resistances || typeof resistances !== 'object') {
    return []
  }
  return ELEMENT_KEYS
    .map(key => {
      const value = Number(resistances[key] ?? 0)
      if (!Number.isFinite(value) || value === 0) {
        return null
      }
      const label = ELEMENT_LABELS[key] || key
      const signStr = value > 0 ? '+' : '-'
      const absValue = Math.abs(value)
      return {
        name: `${label}属性抗性`,
        value: `${signStr}${absValue}%`,
        icon: ELEMENT_ICON_MAP[key] || '',
        elementKey: key,
        isNegative: value < 0
      }
    })
    .filter(Boolean)
})

/**
 * 获取主物品的精炼属性次数
 * 用途/业务意图：从 elementalEnhancement 中获取 attributeEnhanceCount
 */
const attributeEnhanceCount = computed(() => {
  const info = resolveAttributeEnhancementInfo(internalItem.value)
  return info?.enhanceCount || 0
})

/**
 * 获取对比物品的精炼属性次数
 * 用途/业务意图：从 elementalEnhancement 中获取 attributeEnhanceCount
 */
const compareAttributeEnhanceCount = computed(() => {
  const info = resolveAttributeEnhancementInfo(compareItem.value)
  return info?.enhanceCount || 0
})

/**
 * 解析终极首饰的强化等级
 * 用途/业务意图：终极首饰通过 upgradeLevels 获取强化等级，没有则默认为0级
 * @param {Object} item - 物品数据
 * @returns {number} 强化等级
 */
const resolveUltimateJewelryLevel = item => {
  if (!item || item.rarity !== 'ultimate') {
    return -1
  }
  const upgradeLevels = Array.isArray(item?.upgradeLevels) ? item.upgradeLevels : []
  if (!upgradeLevels.length) {
    return -1
  }
  // 优先使用显式的 enhanceLevel
  const explicitLevel = resolveEnhanceLevel(item)
  if (explicitLevel > 0) {
    return explicitLevel
  }
  // 终极首饰默认显示0级属性
  return 0
}

/**
 * 获取终极首饰的属性
 * 用途/业务意图：根据强化等级从 upgradeLevels 中获取对应属性
 * @param {Object} item - 物品数据
 * @returns {Array} 属性列表
 */
const getUltimateJewelryAbilities = item => {
  const level = resolveUltimateJewelryLevel(item)
  if (level < 0) {
    return []
  }
  const abilities = resolveEnhanceUpgradeAbilities(item, level)
  return abilities
}

const jewelryEnhanceAbilities = computed(() => {
  const item = internalItem.value
  if (!item || String(item.category || '').toLowerCase() !== 'jewelry') {
    return []
  }
  // 终极首饰特殊处理：即使没有 enhanceLevel 也要显示 upgradeLevels[0] 的属性
  if (item.rarity === 'ultimate') {
    const abilities = getUltimateJewelryAbilities(item)
    return formatAbilityLines(abilities)
  }
  // 普通首饰需要 enhanceLevel > 0 才显示
  const enhanceLevel = resolveEnhanceLevel(item)
  if (enhanceLevel <= 0) {
    return []
  }
  const abilities = resolveEnhanceUpgradeAbilities(item, enhanceLevel)
  return formatAbilityLines(abilities)
})
const showJewelryEnhanceAbilities = computed(() => jewelryEnhanceAbilities.value.length > 0)
 
const enhanceSetParameterMap = ABILITY_PARAMETER_MAP
const enhanceSetSlots = ['helmet', 'armor', 'gloves', 'boots']
const enhanceSetLevel = computed(() => {
  const levels = enhanceSetSlots.map(slot => resolveEnhanceLevel(itemsStore.equipment?.[slot]))
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
const isEnhanceSetTooltipTarget = item => {
  if (!item || item.category !== 'armor') {
    return false
  }
  const subcategory = String(item.subcategory || '').toLowerCase()
  return ['helmet', 'armor', 'suit', 'gloves', 'gauntlet', 'boots'].includes(subcategory)
}
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

/**
 * 解析当前宠物阶段数据
 * 用途/业务意图：基于 pet_data 获取当前展示的宠物阶段
 * @param {Object} item - 物品数据
 * @returns {{ petLevel: number, entry: Object }|null} 当前阶段信息
 */
function resolveCurrentPetEntry (item) {
  const petData = item?.pet_data
  if (!petData || (typeof petData !== 'object' && !Array.isArray(petData))) {
    return null
  }
  const entries = []
  const pushEntry = (key, value) => {
    const entry = value && typeof value === 'object' ? value : {}
    const petLevel = Number(entry.pet_level ?? key)
    entries.push({
      petLevel: Number.isFinite(petLevel) ? petLevel : 0,
      entry
    })
  }
  if (Array.isArray(petData)) {
    petData.forEach(row => {
      if (!row || typeof row !== 'object') {
        return
      }
      const keys = Object.keys(row)
      if (!keys.length) {
        return
      }
      const looksLikeEntry = 'pet_level' in row || 'level_type' in row || 'current_energy' in row || 'max_energy' in row
      if (looksLikeEntry) {
        pushEntry(row.pet_level ?? 0, row)
        return
      }
      keys.forEach(key => pushEntry(key, row[key]))
    })
  } else {
    Object.entries(petData).forEach(([key, value]) => pushEntry(key, value))
  }
  const sorted = entries
    .filter(item => Number.isFinite(item.petLevel) && item.petLevel > 0)
    .sort((a, b) => a.petLevel - b.petLevel)
  if (!sorted.length) {
    return null
  }
  return sorted[sorted.length - 1]
}

/**
 * 构建宠物详情展示行
 * 用途/业务意图：生成符合物品详情面板的宠物内容格式
 * @param {Object} item - 物品数据
 * @returns {Array<{ text: string, className?: string, style?: Record<string, string> }>} 展示行
 */
function buildPetDisplayLines (item) {
  const currentEntry = resolveCurrentPetEntry(item)
  if (!currentEntry) {
    return []
  }
  const { petLevel, entry } = currentEntry
  const resolveNumericAbilityValue = raw => {
    if (raw === null || raw === undefined) {
      return 0
    }
    if (typeof raw === 'object') {
      const values = Object.values(raw)
      return values.reduce((total, value) => {
        const numeric = Number(value ?? 0)
        return total + (Number.isFinite(numeric) ? numeric : 0)
      }, 0)
    }
    const numeric = Number(raw ?? 0)
    return Number.isFinite(numeric) ? numeric : 0
  }
  const resolveGrowthDisplayValue = raw => {
    if (raw === null || raw === undefined) {
      return 0
    }
    if (typeof raw === 'object') {
      const keys = Object.keys(raw)
      const numericKeys = keys
        .map(key => Number(key))
        .filter(value => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b)
      if (numericKeys.length) {
        return numericKeys[0]
      }
      return 0
    }
    const numeric = Number(raw ?? 0)
    return Number.isFinite(numeric) ? numeric : 0
  }
  const petEntries = (() => {
    const petData = item?.pet_data
    if (!petData || (typeof petData !== 'object' && !Array.isArray(petData))) {
      return []
    }
    const entries = []
    const pushEntry = (key, value) => {
      const entry = value && typeof value === 'object' ? value : {}
      const petLevel = Number(entry.pet_level ?? key)
      entries.push({
        petLevel: Number.isFinite(petLevel) ? petLevel : 0,
        entry
      })
    }
    if (Array.isArray(petData)) {
      petData.forEach(row => {
        if (!row || typeof row !== 'object') {
          return
        }
        const keys = Object.keys(row)
        if (!keys.length) {
          return
        }
        const looksLikeEntry = 'pet_level' in row || 'level_type' in row || 'current_energy' in row || 'max_energy' in row
        if (looksLikeEntry) {
          pushEntry(row.pet_level ?? 0, row)
          return
        }
        keys.forEach(key => pushEntry(key, row[key]))
      })
    } else {
      Object.entries(petData).forEach(([key, value]) => pushEntry(key, value))
    }
    return entries.filter(item => Number.isFinite(item.petLevel) && item.petLevel > 0).sort((a, b) => a.petLevel - b.petLevel)
  })()

  const petId = item?.petItemId ?? item?.id
  const petConfig = petsStore.petMap?.[String(petId)] || null
  const levelType = entry.level_type ? String(entry.level_type) : ''
  const levelRequirement = Number(entry.level_requirement ?? 0)
  const excludedKeys = new Set([
    'pet_level',
    'level_type',
    'level_requirement',
    'current_energy',
    'max_energy',
    'pet_exterior',
    'Pet_Exterior'
  ])
  const configAbilityKey = typeof petConfig?.parameter === 'string' ? petConfig.parameter : ''
  const rawAbilityKey = Object.keys(entry).find(key => !excludedKeys.has(key)) || configAbilityKey
  const abilityKey = rawAbilityKey ? String(rawAbilityKey).toLowerCase() : ''
  const abilityLabel = abilityKey ? abilityParameterMap[abilityKey] || rawAbilityKey : ''
  const abilityValue = abilityKey ? petEntries.reduce((total, item) => {
    const raw =
      item?.entry?.[abilityKey] ??
      item?.entry?.[rawAbilityKey] ??
      null
    return total + resolveNumericAbilityValue(raw)
  }, 0) : null
  const abilityRate = Boolean(petConfig?.rate)
  const growthParts = (() => {
    const parts = []
    petEntries.forEach(item => {
      const level = Number(item?.petLevel)
      if (!Number.isFinite(level) || level <= 0) {
        return
      }
      const raw =
        item?.entry?.[abilityKey] ??
        item?.entry?.[rawAbilityKey] ??
        0
      const value = resolveGrowthDisplayValue(raw)
      if (!value) {
        return
      }
      parts.push({ level, label: `Lv${value}` })
    })
    return parts
      .sort((a, b) => a.level - b.level)
      .map(item => item.label)
  })()
  const tierIndex = Math.max(Number.isFinite(petLevel) ? petLevel - 1 : 0, 0)
  const maxEnergy = Number(petConfig?.tiers?.[tierIndex]?.maxEnergy ?? 0)
  const storedMaxEnergy = Number(entry.max_energy ?? 0)
  const storedCurrentEnergy = Number(entry.current_energy ?? 0)
  const energyValue =
    item?.pet_energy ??
    item?.energy ??
    item?.currentEnergy ??
    item?.petEnergy ??
    item?.energyValue
  const fallbackCurrentEnergy = Number.isFinite(Number(energyValue)) ? Number(energyValue) : 0
  const currentEnergy = Number.isFinite(storedCurrentEnergy) ? storedCurrentEnergy : fallbackCurrentEnergy
  const resolvedMaxEnergy = Number.isFinite(storedMaxEnergy) ? storedMaxEnergy : maxEnergy
  const description = getItemDescription(item)
  const lines = []
  const name = getItemDisplayName(item)
  const nameColor = itemsStore.getRarityTextColor(item?.rarity || 'common')
  lines.push({
    text: `宠物名称：${name}`,
    className: 'pet-name-line',
    style: { color: nameColor }
  })
  lines.push({ text: '(召唤兽)', className: 'pet-summon-line' })
  if (Number.isFinite(levelRequirement) && levelRequirement > 0) {
    lines.push({ text: `等级要求：${levelRequirement}`, className: 'pet-require-line' })
  }
  if (levelType || Number.isFinite(petLevel)) {
    const levelText = levelType ? `${levelType}级` : `${petLevel}级`
    lines.push({ text: `等级：${levelText}`, className: 'pet-level-line' })
  }
  if (abilityKey && abilityValue !== null && abilityValue !== undefined) {
    const abilityText = `${abilityLabel} +${abilityValue}${abilityRate ? '%' : ''}`
    lines.push({ text: `能力值：${abilityText}`, className: 'pet-ability-line' })
  }
  if (growthParts.length) {
    const growthText = growthParts.join('/')
    lines.push({ text: `(${growthText})`, className: 'pet-growth-line' })
  }
  if (Number.isFinite(resolvedMaxEnergy) && resolvedMaxEnergy > 0) {
    lines.push({ text: `能量：${currentEnergy}/${resolvedMaxEnergy}`, className: 'pet-energy-line' })
  }
  if (description) {
    lines.push({ text: description, className: 'pet-description-line' })
  }
  const rerollCount = petEntries.reduce((total, item) => {
    const raw = Number(item?.entry?.petAttributeRerollCount ?? 0)
    const value = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0
    return total + value
  }, 0)
  lines.push({ text: `宠物洗练次数：${rerollCount}`, className: 'pet-reroll-count-line' })
  return lines
}

// 内部状态
const internalShow = ref(false)
const internalItem = ref(null)
const internalPosition = ref({ x: 0, y: 0 })
const internalSource = ref('')
const itemIconPath = ref('/pt/item_icon/default_item.png')
const comparePanelPosition = ref({ x: 0, y: 0 })

const compareItem = computed(() => {
  const item = internalItem.value
  const target = comparisonTarget.value
  if (!item || !target || isSameEquipment(item, target)) {
    return null
  }
  return target
})

const itemClassRequirement = computed(() => resolveClassRequirement(internalItem.value))
const compareItemClassRequirement = computed(() => resolveClassRequirement(compareItem.value))

/**
 * 属性抗性参数列表
 */
const ELEMENTAL_DEFENSE_PARAMS = ['firedefense', 'waterdefense', 'winddefense', 'earthdefense', 'electricitydefense']

/**
 * 从物品中提取属性抗性
 * @param {Object} item - 物品数据
 * @returns {Array<{name: string, value: string, icon: string, elementKey: string, isNegative: boolean}>} 属性抗性列表
 */
const extractElementalResistances = item => {
  if (!item) return []
  
  const resistances = []
  
  // 从 abilities 中提取
  if (item.abilities && Array.isArray(item.abilities)) {
    for (const ability of item.abilities) {
      const param = (ability.parameter || '').toLowerCase()
      if (ELEMENTAL_DEFENSE_PARAMS.includes(param)) {
        // 使用统一的 getParameterName 获取中文名称
        const name = getParameterName(ability.parameter) || param
        const add = ability.add || 0
        const currentAdd = ability.currentAdd
        const displayValue = currentAdd !== undefined ? currentAdd : add
        const signStr = displayValue > 0 ? '+' : '-'
        const absValue = Math.abs(displayValue)
        const isRate = Boolean(ability.rate)
        const value = isRate ? `${signStr}${absValue}%` : `${signStr}${absValue}`
        const elementKey = DEFENSE_PARAM_TO_ELEMENT_KEY[param] || ''
        const icon = ELEMENT_ICON_MAP[elementKey] || ''
        resistances.push({ name, value, icon, elementKey, isNegative: displayValue < 0 })
      }
    }
  }
  
  return resistances
}

/**
 * 物品的属性抗性列表
 */
const itemElementalResistances = computed(() => extractElementalResistances(internalItem.value))

/**
 * 过滤掉属性抗性后的 abilities 列表
 * 用途/业务意图：在 abilities 区域不显示属性抗性，因为已在专属区域显示
 */
const filteredAbilities = computed(() => {
  const item = internalItem.value
  if (!item || !item.abilities || !Array.isArray(item.abilities)) {
    return []
  }
  
  // 过滤掉属性抗性相关的 abilities
  return item.abilities.filter(ability => {
    const param = (ability.parameter || '').toLowerCase()
    return !ELEMENTAL_DEFENSE_PARAMS.includes(param)
  })
})

const compareSetInfo = computed(() => getSetInfoForItem(compareItem.value))
/**
 * 比较面板中的首饰强化属性
 * 用途/业务意图：为比较面板中的终极首饰显示 upgradeLevels 对应等级的属性
 */
const compareJewelryEnhanceAbilities = computed(() => {
  const item = compareItem.value
  if (!item || String(item.category || '').toLowerCase() !== 'jewelry') {
    return []
  }
  // 终极首饰特殊处理
  if (item.rarity === 'ultimate') {
    const abilities = getUltimateJewelryAbilities(item)
    return formatAbilityLines(abilities)
  }
  // 普通首饰需要 enhanceLevel > 0 才显示
  const enhanceLevel = resolveEnhanceLevel(item)
  if (enhanceLevel <= 0) {
    return []
  }
  const abilities = resolveEnhanceUpgradeAbilities(item, enhanceLevel)
  return formatAbilityLines(abilities)
})
const showCompareJewelryEnhanceAbilities = computed(() => compareJewelryEnhanceAbilities.value.length > 0)

const compareEnhanceUpgradeAbilities = computed(() =>
  formatAbilityLines(buildEnhanceUpgradeAbilities(compareItem.value))
)
const showEnhanceSetBonus = computed(
  () => isEnhanceSetTooltipTarget(internalItem.value) && enhanceSetBonusAbilities.value.length > 0
)
const compareShowEnhanceSetBonus = computed(
  () => isEnhanceSetTooltipTarget(compareItem.value) && enhanceSetBonusAbilities.value.length > 0
)
const petDisplayLines = computed(() => buildPetDisplayLines(internalItem.value))
const comparePetDisplayLines = computed(() => buildPetDisplayLines(compareItem.value))
const compareItemIconPath = computed(() => {
  const item = compareItem.value
  if (!item) {
    return '/pt/item_icon/default_item.png'
  }
  if (item.icon) {
    return item.icon
  }
  if (item.id) {
    return `/pt/item_icon/${item.id}.png`
  }
  return '/pt/item_icon/default_item.png'
})

const showComparePanel = computed(() => internalShow.value && Boolean(compareItem.value))
const comparePanelStyle = computed(() => ({
  left: `${comparePanelPosition.value.x}px`,
  top: `${comparePanelPosition.value.y}px`
}))

const resolveEquipmentSlot = item => {
  if (!item) {
    return null
  }
  if (item.category === 'weapon') {
    return 'weapon'
  }
  if (item.category === 'armor') {
    const subcategory = String(item.subcategory || '').toLowerCase()
    if (subcategory === 'shield') {
      return 'shield'
    }
    if (subcategory === 'helmet') {
      return 'helmet'
    }
    if (subcategory === 'boots') {
      return 'boots'
    }
    if (subcategory === 'gloves' || subcategory === 'gauntlet') {
      return 'gloves'
    }
    return 'armor'
  }
  if (item.category === 'jewelry') {
    const subcategory = String(item.subcategory || '').toLowerCase()
    if (subcategory === 'necklace') {
      return 'necklace'
    }
    if (subcategory === 'ring') {
      return ['ring1', 'ring2']
    }
    if (subcategory === 'earring') {
      return ['earring1', 'earring2']
    }
  }
  return null
}

const comparisonTarget = computed(() => {
  const item = internalItem.value
  if (!item) {
    return null
  }
  const slot = resolveEquipmentSlot(item)
  if (!slot) {
    return null
  }
  const equipment = itemsStore.equipment || {}
  if (Array.isArray(slot)) {
    return equipment[slot[0]] || equipment[slot[1]] || null
  }
  return equipment[slot] || null
})

const isSameEquipment = (item, target) => {
  if (!item || !target) {
    return false
  }
  if (item.uniqueId && target.uniqueId) {
    return String(item.uniqueId) === String(target.uniqueId)
  }
  return item === target
}

// 调整提示框位置，确保不会被遮挡
/**
 * 调整提示框位置，正常情况下在鼠标左右两侧显示，触发边界时居中显示
 * @param {Object} position - 鼠标位置 {x, y}
 */
const adjustTooltipPosition = position => {
  // 等待DOM更新完成后执行
  setTimeout(() => {
    const tooltip = document.getElementById('item-tooltip')
    if (!tooltip) {return}

    const padding = 15 // 屏幕边缘最小距离
    const mouseClearance = 100 // 鼠标与面板的最小距离（增大确保不遮挡）
    const panelGap = 15 // 两个面板之间的间距
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 获取提示框的实际尺寸
    const tooltipRect = tooltip.getBoundingClientRect()
    const tooltipWidth = tooltipRect.width || 350
    const tooltipHeight = tooltipRect.height || 400

    // 鼠标位置
    const mouseX = position.x
    const mouseY = position.y

    // 装备比对面板
    const comparePanel = document.getElementById('item-compare-panel')
    let compareWidth = 0
    let compareHeight = 0

    if (comparePanel && compareItem.value) {
      const compareRect = comparePanel.getBoundingClientRect()
      compareWidth = compareRect.width || 220
      compareHeight = compareRect.height || 200
    }

    // 计算两个面板的总宽度
    const totalWidth = tooltipWidth + compareWidth + (compareWidth > 0 ? panelGap : 0)
    const maxHeight = Math.max(tooltipHeight, compareHeight)

    // 判断是否触发边界（需要居中显示）
    const nearLeftEdge = mouseX < totalWidth / 2 + padding
    const nearRightEdge = mouseX > viewportWidth - totalWidth / 2 - padding
    const nearTopEdge = mouseY < padding + mouseClearance
    const nearBottomEdge = mouseY > viewportHeight - maxHeight - padding

    const needCenterDisplay = nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge

    let x, y, compareX, compareY

    if (needCenterDisplay) {
      // 触发边界时居中显示
      const centerX = (viewportWidth - totalWidth) / 2
      const centerY = (viewportHeight - maxHeight) / 2

      x = Math.max(padding, centerX)
      y = Math.max(padding, centerY)

      // 确保不超出右边界
      if (x + tooltipWidth > viewportWidth - padding) {
        x = viewportWidth - tooltipWidth - padding
      }

      // 确保不超出下边界
      if (y + tooltipHeight > viewportHeight - padding) {
        y = Math.max(padding, viewportHeight - tooltipHeight - padding)
      }

      // 装备比对面板位置
      if (compareWidth > 0) {
        compareX = x + tooltipWidth + panelGap
        compareY = y

        if (compareX + compareWidth > viewportWidth - padding) {
          compareX = viewportWidth - compareWidth - padding
        }
        if (compareY + compareHeight > viewportHeight - padding) {
          compareY = Math.max(padding, viewportHeight - compareHeight - padding)
        }
      }
    } else {
      // 正常情况：物品详情面板在鼠标左侧，对比面板在鼠标右侧
      // 物品详情面板 - 放在鼠标左侧
      x = mouseX - tooltipWidth - mouseClearance
      y = mouseY

      // 如果左侧空间不足，放到右侧
      if (x < padding) {
        x = mouseX + mouseClearance
      }

      // 确保不超出右边界
      if (x + tooltipWidth > viewportWidth - padding) {
        x = viewportWidth - tooltipWidth - padding
      }

      // 垂直边界调整
      if (y + tooltipHeight > viewportHeight - padding) {
        y = Math.max(padding, viewportHeight - tooltipHeight - padding)
      }
      if (y < padding) {
        y = padding
      }

      // 装备比对面板位置 - 放在鼠标右侧
      if (compareWidth > 0) {
        compareX = mouseX + mouseClearance
        compareY = mouseY

        // 如果右侧放不下，放到左侧（与物品详情面板同侧但更靠外）
        if (compareX + compareWidth > viewportWidth - padding) {
          compareX = Math.max(padding, mouseX - tooltipWidth - compareWidth - panelGap)
        }

        // 确保不超出左边界
        if (compareX < padding) {
          compareX = padding
        }

        // 垂直边界调整
        if (compareY + compareHeight > viewportHeight - padding) {
          compareY = Math.max(padding, viewportHeight - compareHeight - padding)
        }
        if (compareY < padding) {
          compareY = padding
        }
      }
    }

    internalPosition.value = { x, y }

    if (compareWidth > 0) {
      comparePanelPosition.value = { x: compareX, y: compareY }
    }
  }, 0)
}

// 显示物品详情提示框
const handleShowItemTooltip = async event => {
  // console.log('进入物品详情信息面板方法', event.detail.item.id)
  // 使用event.detail.item.id去查找完整数据
  const itemId = event.detail.item.id

  // 从全局数据中查找完整物品信息
  let fullItemData = event.detail.item // 默认使用传入的数据

  // 始终合并数据，确保不丢失任何字段
  // 从 Pinia Store 中查找物品数据
  const foundItem = itemsStore.getItemConfig(itemId)

  if (foundItem) {
    // 合并传入的数据和全局数据
    // 注意：传入的数据可能包含动态属性（如embeddedGems），需要优先保留
    const dynamicProps = {
      embeddedGems: fullItemData.embeddedGems,
      StrengthenedAttributes: fullItemData.StrengthenedAttributes,
      PerforationAttributes: fullItemData.PerforationAttributes,
      possibleRandomStats: fullItemData.possibleRandomStats
    }
    fullItemData = { ...foundItem, ...fullItemData, ...dynamicProps }
  }

  internalItem.value = fullItemData
  internalSource.value = event.detail?.source || ''
  internalPosition.value = event.detail.position

  // 立即显示tooltip，同时加载物品图标
  internalShow.value = true

  // 异步加载物品图标，不阻塞UI
  const iconPath = `/pt/item_icon/${itemId}.png`
  try {
    await imageService.loadImage(iconPath)
    // 只有在tooltip仍然显示时才更新图标
    if (internalShow.value) {
      itemIconPath.value = iconPath
    }
  } catch (error) {
    console.warn(`加载物品图标失败: ${iconPath}`, error)
    // 只有在tooltip仍然显示时才更新为默认图标
    if (internalShow.value) {
      itemIconPath.value = '/pt/item_icon/default_item.png'
    }
  }

  // 在下一帧调整位置，确保元素已经渲染
  nextTick(() => {
    adjustTooltipPosition(event.detail.position)
  })
}

// 移动物品详情提示框
const handleMoveItemTooltip = event => {
  internalPosition.value = event.detail.position

  // 调整位置，确保不会被遮挡
  adjustTooltipPosition(event.detail.position)
}

// 隐藏物品详情提示框
const handleHideItemTooltip = () => {
  internalShow.value = false
  internalItem.value = null
  internalSource.value = ''
  comparePanelPosition.value = { x: 0, y: 0 }
}

// 监听自定义事件
onMounted(() => {
  window.addEventListener('show-item-tooltip', handleShowItemTooltip)
  window.addEventListener('move-item-tooltip', handleMoveItemTooltip)
  window.addEventListener('hide-item-tooltip', handleHideItemTooltip)
})

// 移除事件监听器
onUnmounted(() => {
window.removeEventListener('show-item-tooltip', handleShowItemTooltip)
window.removeEventListener('move-item-tooltip', handleMoveItemTooltip)
window.removeEventListener('hide-item-tooltip', handleHideItemTooltip)
// 清理捡宠倒计时 tick 定时器
stopPickuppetTooltipTick()
})

// 物品属性映射表（使用统一描述管理）
const abilityParameterMap = ABILITY_PARAMETER_MAP

// 使用导入的职业映射表
const classMapping = importedClassMapping

/**
 * 从 Pinia Store 中查找物品数据
 * @param {number|string} itemId - 物品ID
 * @returns {Object|null} 物品数据对象，如果未找到则返回 null
 */
const findItemInGameData = itemId => {
  if (!itemId) {
    return null
  }

  // 从 Pinia Store 中查找物品数据
  const itemData = itemsStore.getItemConfig(itemId)
  if (itemData) {
    return itemData
  }

  console.log(`[ItemTooltip] 未找到物品 ${itemId}`)
  return null
}

const getItemDisplayName = item => {
  if (!item) {return '未知物品'}

  // 如果有原始名称对象，优先使用它
  if (item.originalName) {
    if (typeof item.originalName === 'object') {
      return item.originalName.cns || item.originalName.en || `物品ID: ${item.id}`
    } else if (typeof item.originalName === 'string') {
      return item.originalName || `物品ID: ${item.id}`
    }
  }

  // 如果物品名称已经是字符串，但不是默认的"物品#ID"格式，直接返回
  if (typeof item.name === 'string' && item.name !== `物品#${item.id}`) {
    return item.name || `物品ID: ${item.id}`
  }

  // 处理名称对象
  if (typeof item.name === 'object') {
    return item.name.cns || item.name.en || `物品ID: ${item.id}`
  }

  // 尝试从游戏数据中获取正确的物品名称
  try {
    const itemData = findItemInGameData(item.id)
    if (itemData && itemData.name) {
      // 处理多语言名称（如果name是对象）
      if (typeof itemData.name === 'object') {
        return itemData.name.cns || itemData.name.en || `物品ID: ${item.id}`
      }
      return itemData.name
    }
  } catch (error) {
    console.error('[ItemTooltip] 获取物品名称时出错:', error)
  }

  // 如果都没有找到，返回默认名称
  return `物品ID: ${item.id}`
}

const normalizeItemDescription = description => {
  if (!description) {
    return ''
  }
  if (typeof description === 'object') {
    const desc = description.cns || description.en || ''
    return desc && desc !== 'null' && desc !== 'undefined' ? desc : ''
  }
  if (typeof description === 'string') {
    const raw = description.trim()
    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          const parsedDesc = parsed.cns || parsed.en || ''
          return parsedDesc && parsedDesc !== 'null' && parsedDesc !== 'undefined' ? parsedDesc : ''
        }
      } catch (error) {
        console.error('[ItemTooltip] 解析物品描述时出错:', error)
      }
    }
    return raw && raw !== 'null' && raw !== 'undefined' ? raw : ''
  }
  return ''
}

// 获取物品描述
const getItemDescription = item => {
  if (!item) {
    return ''
  }

  if (item.description) {
    return normalizeItemDescription(item.description)
  }

  try {
    const itemData = findItemInGameData(item.id)
    if (itemData && itemData.description) {
      return normalizeItemDescription(itemData.description)
    }
  } catch (error) {
    console.error('[ItemTooltip] 获取物品描述时出错:', error)
  }

  return ''
}

/**
 * 格式化持续时间显示
 * @param {number} duration - 持续时间（秒），-1表示永久，正数表示具体秒数
 * @returns {string} 格式化后的持续时间文本
 */
const formatDuration = duration => {
  const seconds = Number(duration)
  if (!Number.isFinite(seconds)) {
    return '未知'
  }
  // -1 表示永久/无限时长
  if (seconds < 0) {
    return '永久'
  }
  // 计算天、时、分、秒
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (days > 0) {
    parts.push(`${days}天`)
  }
  if (hours > 0) {
    parts.push(`${hours}小时`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}分钟`)
  }
  if (secs > 0 && days === 0) {
    // 超过1天时不再显示秒数
    parts.push(`${secs}秒`)
  }
  return parts.length > 0 ? parts.join('') : '0秒'
}

// ==================== 捡宠实时倒计时 ====================

/** 捡宠倒计时 tick 计数器，每秒递增强制刷新倒计时显示 */
const pickuppetTooltipTick = ref(0)
let pickuppetTooltipTickTimer = null

/**
 * 格式化秒数为 H:MM:SS 格式（时:分:秒）
 * @param {number} totalSeconds - 总秒数
 * @returns {string} 格式化后的时间字符串
 */
const formatPickuppetCountdown = (totalSeconds) => {
  const safeSeconds = Number(totalSeconds)
  if (!Number.isFinite(safeSeconds) || safeSeconds <= 0) return '0:00'
  const s = Math.floor(safeSeconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/** 当前物品是否为活跃的限时捡宠（召唤中或召回后倒计时未结束） */
const isItemActiveTimedPickuppet = computed(() => {
  const item = internalItem.value
  if (!item || item.category !== 'pickuppet') return false
  const key = item.uniqueId ? String(item.uniqueId) : (item.id ? `id:${String(item.id)}` : null)
  if (!key) return false
  // 通过 timers Map 查询该物品是否有未到期的倒计时
  const entry = pickuppetSummonStore.getTimer(key)
  if (!entry || entry.expiresAt <= 0) return false
  return true
})

/** 捡宠实时倒计时显示文本（依赖 tick 每秒强制刷新） */
const pickuppetTooltipCountdown = computed(() => {
// eslint-disable-next-line no-unused-vars
const _tick = pickuppetTooltipTick.value
if (!isItemActiveTimedPickuppet.value) return ''
// 从 timers Map 获取当前物品的到期时间
const item = internalItem.value
const key = item?.uniqueId ? String(item.uniqueId) : (item?.id ? `id:${String(item.id)}` : null)
if (!key) return '0:00'
const entry = pickuppetSummonStore.getTimer(key)
if (!entry || entry.expiresAt <= 0) return '0:00'
const now = Date.now()
if (now >= entry.expiresAt) return '0:00'
const remainingSec = Math.ceil((entry.expiresAt - now) / 1000)
return formatPickuppetCountdown(remainingSec)
})

/** 启动捡宠倒计时 tick 定时器 */
const startPickuppetTooltipTick = () => {
if (pickuppetTooltipTickTimer) return
pickuppetTooltipTickTimer = setInterval(() => {
pickuppetTooltipTick.value++
// 检查是否到期或不再活跃
if (!isItemActiveTimedPickuppet.value) {
stopPickuppetTooltipTick()
}
}, 1000)
}

/** 停止捡宠倒计时 tick 定时器 */
const stopPickuppetTooltipTick = () => {
  if (pickuppetTooltipTickTimer) {
    clearInterval(pickuppetTooltipTickTimer)
    pickuppetTooltipTickTimer = null
  }
}

// 监听当前物品是否为活跃的限时捡宠，启动/停止倒计时 tick
watch(
isItemActiveTimedPickuppet,
(isActive) => {
if (isActive) {
startPickuppetTooltipTick()
} else {
stopPickuppetTooltipTick()
}
},
{ immediate: true }
)

// ==================== 捡宠实时倒计时结束 ====================

/**
 * 物品类型中文翻译映射（category父类型 + subcategory子类型）
 * 优先显示子类型（更具体），无子类型则显示父类型
 */
const CATEGORY_LABELS = {
  // === 父类型 category ===
  armor: '防具',
  arrow: '箭矢',
  blinkwing: '回城卷',
  booty: '战利品',
  buff: '增益',
  charm: '护符',
  collector: '收集器',
  currency: '货币',
  fashion: '时装',
  firework: '烟花',
  flying: '飞行器',
  fuel: '燃料',
  jewelry: '首饰',
  lifestyle: '生活',
  material: '材料',
  monsterball: '怪物球',
  pack: '礼包',
  pickuppet: '捡宠',
  quest: '任务',
  raisedpet: '培育型宠物',
  recovery: '恢复/药剂',
  scroll: '卷轴',
  storage: '存储',
  teleportring: '传送戒',
  trans: '变形',
  vendorskin: '商铺皮肤',
  weapon: '武器',

  // === 子类型 subcategory ===
  ampexp: '经验加成',
  armorcolor: '防具染色',
  awakescroll: '觉醒卷轴',
  axe: '斧',
  balloon: '气球',
  bankbag: '银行背包',
  battlepass: '战令',
  board: '滑板',
  book: '书籍',
  boots: '靴子',
  bow: '弓',
  broom: '扫帚',
  car: '飞车',
  cloak: '披风',
  cloth: '布甲',
  couplering: '情侣戒',
  drink: '饮品',
  earring: '耳环',
  elementcard: '元素卡片',
  event: '活动',
  fcoin: '活动币',
  food: '食物',
  gem: '宝石',
  gacha: '扭蛋',
  gauntlet: '护手',
  giftbox: '礼盒',
  globalgacha: '全局扭蛋',
  glove: '手套',
  glow: '光效',
  guildbag: '公会背包',
  harvestglove: '采集手套',
  hat: '帽子',
  helmet: '头盔',
  hoverbike: '悬浮摩托',
  inventorybag: '背包扩展',
  knuckle: '拳套',
  letter: '信件',
  mask: '面具',
  mineral: '矿石',
  motion: '动作',
  namecolor: '名称颜色',
  necklace: '项链',
  petfeed: '宠物饲料',
  piece: '碎片',
  piercingcard: '穿洞卡片',
  piercingdice: '穿洞骰子',
  pill: '药丸',
  pkchip: 'PK筹码',
  protectscroll: '保护卷轴',
  rainbowrace: '彩虹赛跑',
  raisedpettransmute: '培育型宠物变形',
  randomscroll: '随机卷轴',
  refresher: '恢复剂',
  ring: '戒指',
  selectblinkwing: '选择回城卷',
  selectbox: '选择箱',
  shield: '盾牌',
  shoes: '鞋',
  specialstone: '特殊石',
  staff: '法杖',
  stick: '魔棒',
  suit: '衣服',
  sunstone: '太阳石',
  sword: '剑',
  ticket: '票据',
  tool: '工具',
  townblinkwing: '城镇回城卷',
  ultimatedice: '终极精炼骰子',
  ultimatejewel: '终极宝石',
  upgradedice: '精炼骰子',
  upgradescroll: '升级卷轴',
  visualcloak: '外观披风',
  wand: '魔杖',
  wings: '翅膀',
  yoyo: '溜溜球'
}

/**
 * 获取物品的类型标签（优先子类型，其次父类型）
 * @param {object} item - 物品对象
 * @returns {string} 中文类型标签，无匹配则返回空字符串
 */
const getItemTypeLabel = item => {
  if (!item) return ''
  // 优先显示子类型（更具体准确），但'other'是默认兜底值，不算有效子类型
  if (item.subcategory && item.subcategory !== 'undefined' && item.subcategory !== 'other') {
    return CATEGORY_LABELS[item.subcategory] || item.subcategory
  }
  // 无子类型则显示父类型，'other'同理不算有效父类型
  if (item.category && item.category !== 'undefined' && item.category !== 'other') {
    return CATEGORY_LABELS[item.category] || item.category
  }
  return ''
}

/**
 * 获取礼包内物品的显示名称
 * 优先从游戏数据中查找，找不到则返回ID占位文本
 * @param {number} itemId - 礼包内物品ID
 * @returns {string} 物品名称
 */
const getContentsItemName = itemId => {
  try {
    const itemData = findItemInGameData(itemId)
    if (itemData?.name) {
      if (typeof itemData.name === 'object') {
        return itemData.name.cns || itemData.name.en || `物品ID: ${itemId}`
      }
      return String(itemData.name) || `物品ID: ${itemId}`
    }
  } catch {
    // 查找失败，使用默认名称
  }
  return `物品ID: ${itemId}`
}

const getItemRarityTextClass = rarity => itemsStore.getRarityTextClass(rarity)

const getItemRarityTextStyle = rarity => {
  return itemsStore.getRarityTextStyle(rarity || 'common')
}

// 获取品质中文名称
const getItemRarityName = rarity => {
  return getRarityName(rarity)
}

const getGenderLabel = gender => {
  if (!gender) {
    return ''
  }
  return getGenderName(String(gender).toLowerCase())
}

const formatAttackSpeedValue = value => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return ''
  }

  const percent = numeric * 100
  const rounded = Math.round(percent * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}%`
}

// 格式化属性（使用统一的工具函数）
// 使用 currentAdd 显示洗练后的值，add~addMax 显示固定范围
const formatAbility = ability => {
  if (!ability) {
    return ''
  }
  return formatAbilityUtil(ability)
}

/**
 * 物品详情面板专用格式化函数
 * 格式：XX+X% (add~addMax)%
 * 特殊处理 skillchance：使用技能名称替换通用的"技能几率"标签
 * @param {Object} ability - 属性对象
 * @returns {string} 格式化后的属性描述
 */
const formatAbilityForTooltip = ability => {
  if (!ability) {
    return ''
  }
  
  const parameter = ability.parameter || ''
  const add = ability.add || 0
  const addMax = ability.addMax
  const currentAdd = ability.currentAdd
  const isRate = Boolean(ability.rate)
  const parameterKey = String(parameter).toLowerCase()
  
  // 处理技能几率（skillchance）：使用技能名称替换通用标签
  if (parameterKey === 'skillchance' && ability.skill) {
    const skillName = getSkillName(ability.skill)
    const displayValue = currentAdd !== undefined ? currentAdd : add
    const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
    const suffix = isRate ? '%' : ''
    if (addMax !== undefined) {
      return `${skillName}${signedValue}(${add}~${addMax})${suffix}`
    }
    return `${skillName}${signedValue}${suffix}`
  }
  
  // 获取属性名称
  const label = getParameterName(parameter)
  
  // 确定显示值：优先使用 currentAdd（洗练后的值），否则使用 add
  const displayValue = currentAdd !== undefined ? currentAdd : add
  
  // 判断是否为百分比类型
  const shouldShowPercent = isRate || PERCENT_PARAMETERS.has(parameter.toLowerCase())
  
  // 构建显示字符串
  let result = label
  
  // 添加当前值（带符号）
  const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
  result += signedValue
  
  // 添加百分比符号（如果需要）
  if (shouldShowPercent) {
    result += '%'
  }
  
  // 如果有 addMax，添加范围
  if (addMax !== undefined) {
    // 使用波浪号连接范围值
    result += ` (${add}~${addMax})`
    // 范围值也需要百分比符号（如果需要）
    if (shouldShowPercent) {
      result += '%'
    }
  }
  
  return result
}

/**
 * 格式化终极武器随机属性
 * 特殊处理 skillchance：使用技能名称替换通用的"技能几率"标签
 * @param {Object} stat - 随机属性对象 { parameter, add, addMax, rate, skill }
 * @returns {string} 格式化后的属性描述
 */
const formatRandomStat = stat => {
  if (!stat || !stat.parameter) {
    return ''
  }

  const statKey = String(stat.parameter).toLowerCase()

  // 处理技能几率（skillchance）：使用技能名称替换通用标签
  if (statKey === 'skillchance' && stat.skill) {
    const skillName = getSkillName(stat.skill)
    const add = stat.add || 0
    const addMax = stat.addMax
    const currentAdd = stat.currentAdd
    const isRate = Boolean(stat.rate)
    const displayValue = currentAdd !== undefined ? currentAdd : add
    const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
    const suffix = isRate ? '%' : ''
    if (addMax !== undefined) {
      return `${skillName}${signedValue}(${add}~${addMax})${suffix}`
    }
    return `${skillName}${signedValue}${suffix}`
  }

  // 获取参数的显示名称 - 使用统一的 getParameterName 函数
  const label = getParameterName(stat.parameter)
  
  const add = stat.add || 0
  const addMax = stat.addMax
  const currentAdd = stat.currentAdd
  const isRate = Boolean(stat.rate)
  
  // 确定显示值：优先使用 currentAdd，否则使用 add
  const displayValue = currentAdd !== undefined ? currentAdd : add
  
  // 判断是否为百分比类型
  const shouldShowPercent = isRate || PERCENT_PARAMETERS.has(stat.parameter.toLowerCase())
  
  // 构建显示字符串
  let result = label
  
  // 添加当前值（带符号）
  const signedValue = displayValue > 0 ? `+${displayValue}` : `${displayValue}`
  result += signedValue
  
  // 添加百分比符号（如果需要）
  if (shouldShowPercent) {
    result += '%'
  }
  
  // 如果有 addMax，添加范围
  if (addMax !== undefined) {
    // 使用波浪号连接范围值
    result += ` (${add}~${addMax})`
    // 范围值也需要百分比符号（如果需要）
    if (shouldShowPercent) {
      result += '%'
    }
  }
  
  return result
}

/**
 * 获取参数的显示名称
 * @param {string} parameter - 参数类型
 * @returns {string} 显示名称
 */
const getParameterDisplayName = parameter => {
  const paramNameMap = {
    // 基础属性
    attack: '攻击力',
    def: '防御力',
    defense: '防御力',
    magicdefense: '魔法防御',
    magicdef: '魔法防御',
    maxhp: '最大生命',
    maxmp: '最大魔法',
    maxfp: '最大FP',
    hp: '生命',
    mp: '魔法',
    fp: 'FP',
    sta: '体力',
    dex: '敏捷',
    str: '力量',
    int: '智力',
    allstats: '全属性',
    
    // 战斗属性
    criticaldamage: '暴击伤害',
    criticalchance: '暴击率',
    criticalrate: '暴击率',
    criticalresist: '暴击抗性',
    hitrate: '命中率',
    dodge: '闪避率',
    block: '格挡率',
    meleeblock: '近战格挡',
    rangedblock: '远程格挡',
    blockpenetration: '穿透格挡',
    attackspeed: '攻击速度',
    attackspeedrate: '攻击速度',
    speed: '移动速度',
    attackrange: '攻击距离',
    skillrange: '技能范围',
    
    // 伤害相关
    damage: '伤害',
    skilldamage: '技能伤害',
    pvpdamage: 'PVP伤害',
    pvedamage: 'PVE伤害',
    damagereduction: '伤害减免',
    incomingdamage: '伤害减免',
    
    // 吸取和恢复
    stealhp: '生命偷取',
    healing: '治疗效果',
    cure: '治愈效果',
    mprecoveryafterkill: '击杀恢复MP',
    fprecoveryautoattack: '普攻恢复FP',
    
    // 元素属性
    fireattack: '火焰攻击',
    waterattack: '水属性攻击',
    windattack: '风属性攻击',
    earthattack: '地属性攻击',
    lightningattack: '雷电攻击',
    thunderattack: '雷电攻击',
    firemastery: '火焰精通',
    watermastery: '水属性精通',
    windmastery: '风属性精通',
    earthmastery: '地属性精通',
    lightningmastery: '雷电精通',
    thundermastery: '雷电精通',
    electricitymastery: '雷电精通',
    
    // 增益效果
    exprate: '经验获取',
    goldrate: '金币获取',
    mpconsumption: 'MP消耗减少',
    decreasedcastingtime: '施法时间减少',
    decreasedmpconsumption: 'MP消耗减少',
    decreasedfpconsumption: 'FP消耗减少',
    
    // 特殊属性
    attributeimmunity: '属性免疫'
  }
  return paramNameMap[parameter?.toLowerCase()] || parameter || '未知属性'
}

// 获取职业映射
const getClassMapping = className => {
  if (Array.isArray(className)) {
    return className.map(cls => classMapping[cls] || cls).join(', ')
  }
  return classMapping[className] || className
}

const resolveClassRequirement = item => {
  if (!item) {
    return null
  }
  const rawClass = item.class ?? findItemInGameData(item.id)?.class ?? null
  if (rawClass === null || rawClass === undefined || rawClass === '' || rawClass === 'undefined') {
    return null
  }
  const normalized = Array.isArray(rawClass) ? rawClass : [rawClass]
  const filtered = normalized.filter(
    entry => entry !== null && entry !== undefined && entry !== '' && entry !== 'undefined'
  )
  if (!filtered.length) {
    return null
  }
  return filtered
}

const getCardAbilities = embeddedCards => {
  if (!embeddedCards) {
    return []
  }

  // 合并相同卡片的属性
  const mergedAbilities = {}
  Object.values(embeddedCards).forEach(card => {
    // 从 Pinia Store 中查找卡片数据
    const cardData = itemsStore.getItemConfig(card.cardId)
    if (!cardData || !card.abilities) {
      return
    }

    card.abilities.forEach(ability => {
      const key = `${ability.parameter}_${ability.rate ? 'percent' : 'value'}`
      if (!mergedAbilities[key]) {
        mergedAbilities[key] = {
          parameter: ability.parameter,
          add: ability.add,
          rate: ability.rate,
          count: 1
        }
      } else {
        mergedAbilities[key].add += ability.add
        mergedAbilities[key].count++
      }
    })
  })

  // 生成属性显示文本
  return Object.values(mergedAbilities).map(ability => {
    const paramName = abilityParameterMap[ability.parameter] || ability.parameter
    const displayText = `${paramName} +${ability.add}${ability.rate ? '%' : ''}`
    return displayText
  })
}

const getPerforationCount = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return 0
  }
  if (typeof attrs.perforationCount === 'number') {
    return attrs.perforationCount
  }
  if (typeof attrs.publicHoleCount === 'number') {
    return attrs.publicHoleCount
  }
  if (attrs.perforationLevels && typeof attrs.perforationLevels === 'object') {
    return Object.keys(attrs.perforationLevels).length
  }
  return 0
}

const getHoleCount = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return 0
  }
  if (typeof attrs.holeCount === 'number') {
    return attrs.holeCount
  }
  if (typeof attrs.publicHoleCount === 'number') {
    return attrs.publicHoleCount
  }
  return 0
}

const getEmbeddedCardCount = attrs => {
  if (!attrs || typeof attrs !== 'object') {
    return 0
  }
  if (attrs.embeddedCards && typeof attrs.embeddedCards === 'object') {
    return Object.keys(attrs.embeddedCards).length
  }
  if (attrs.perforationLevels && typeof attrs.perforationLevels === 'object') {
    const levels = Object.values(attrs.perforationLevels)
    return levels.filter(
      level => level && level.embeddedCardId !== null && level.embeddedCardId !== undefined
    ).length
  }
  return 0
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

// 处理物品图片加载错误
const handleItemImageError = event => {
  // 使用响应式变量更新图标路径
  itemIconPath.value = '/pt/item_icon/default_item.png'
  event.target.src = '/pt/item_icon/default_item.png'
}

const handleCompareImageError = event => {
  event.target.src = '/pt/item_icon/default_item.png'
}

// 获取物品套装信息
const getItemSetInfo = itemId => {
  // 从 Pinia Store 获取套装数据和装备信息
  const setData = gameStore.equipmentSets || itemsStore.equipmentSets || {}
  const playerEquipment = Object.values(itemsStore.equipment || {}).filter(item => item !== null)

  // 将 setData 转换为数组格式（支持对象和数组格式）
  const sets = typeof setData === 'object' && !Array.isArray(setData)
    ? Object.values(setData)
    : (Array.isArray(setData) ? setData : [])

  // 查找包含当前物品的套装
  const targetSet = sets.find(
    set => Array.isArray(set.parts) && set.parts.some(partId => Number(partId) === Number(itemId))
  )

  if (!targetSet) {return null}

  // 获取玩家装备信息（如果可用）
  const equippedIds = playerEquipment.map(eq => Number(eq.id))
  const equippedCount = targetSet.parts.filter(partId =>
    equippedIds.some(equippedId => Number(equippedId) === Number(partId))
  ).length

  // 使用SetBonusService格式化套装效果文本
  const setBonusService = new SetBonusService()

  // 转换套装效果格式
  return {
    name:
        (typeof targetSet.name === 'object'
          ? targetSet.name.cns || targetSet.name.en || '未知套装'
          : targetSet.name) || '未知套装',
    requiredCount: targetSet.parts?.length || 0,
    equippedCount,
    partNames: targetSet.parts.map(partId => {
      // 从 Pinia Store 中查找物品信息
      const item = itemsStore.getItemConfig(partId)

      // 处理物品名称
      let itemName = `#${partId}`

      if (item) {
        // 注意：经过静态数据加载处理后，item.name已经是字符串（通常是中文）
        if (typeof item.name === 'string') {
          itemName = item.name || `#${partId}`
        } else if (typeof item.name === 'object') {
          // 兼容未处理的原始数据结构
          itemName = item.name.cns || item.name.en || `#${partId}`
        }
      }

      return {
        name: itemName,
        activated: equippedIds.some(equippedId => Number(equippedId) === Number(partId))
      }
    }),
    bonuses: (targetSet.bonus || []).map(bonus => ({
      equipped: bonus.equipped || 0,
      description: setBonusService.formatBonusText(bonus.ability),
      activated: equippedCount >= (bonus.equipped || 0)
    }))
  }
}
</script>

<style scoped>
  /* 物品详情提示框样式 */
.item-tooltip {
  position: fixed;
  background-color: var(--theme-modal-bg);
  color: var(--theme-text);
  padding: 5px;
  border: 2px solid var(--theme-border-strong);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  max-width: 350px;
  z-index: 999999 !important;
}

/* 祝福唤醒属性行间距移除 */
.blessing-awakening-attrs p {
  margin: 0;
  line-height: 1.2;
}

  .item-tooltip-fade-enter-active,
  .item-tooltip-fade-leave-active {
    transition: opacity 0.16s ease, transform 0.16s ease;
  }

  .item-tooltip-fade-enter-from,
  .item-tooltip-fade-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }

  .item-tooltip-fade-enter-to,
  .item-tooltip-fade-leave-from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .item-icon {
    width: 55px;
    height: 55px;
    float: left;
    margin-right: 10px;
    margin-bottom: 10px;
  }

  .item-stats {
    font-weight: bold;
  }

  /* 元素抗性显示区域（物品自带抗性 & 衣服属性精炼抗性共用） */
  .elemental-resistance-info {
    margin: 0;
    padding: 0;
  }

  .resistance-line {
    color: #ffffff;
    margin: 0;
    padding: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .resistance-line.resist-negative {
    color: #ffffff;
  }

  .resistance-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .rarity-mythic-text {
    display: inline-block;
    background:
      linear-gradient(
        90deg,
        #ff4d4f 0%,
        #ff7a45 12%,
        #ffa940 24%,
        #fff566 38%,
        #36cfc9 52%,
        #4096ff 68%,
        #a335ee 84%,
        #ff4d4f 100%
      );
    background-size: 300% 100%;
    background-position: 0% 50%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    will-change: background-position;
    animation: mythic-rainbow-flow 6.4s linear infinite;
  }

  @keyframes mythic-rainbow-flow {
    0% {
      background-position: 0% 50%;
    }
    100% {
      background-position: 300% 50%;
    }
  }

  /* 物品详情信息面板中的p元素 - 删除空白行 */
  .item-tooltip > p {
    margin: 0;
    padding: 0;
    line-height: 1.2;
  }

  .card-attributes > p {
    margin: 0;
    padding: 0;
    line-height: 1.1;
  }

  .item-abilities {
    /* 分割线已移除 */
  }

  .item-compare-panel {
    position: fixed;
    background-color: var(--theme-modal-bg);
    color: var(--theme-text);
    padding: 8px 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 200px;
    max-width: 260px;
    z-index: 999999 !important;
  }

  .compare-equipped-label {
    text-align: center;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--theme-accent);
  }

  .ability-line {
    font-size: 0.2em;
    color: #f1c40f;
  }

  .pet-detail-block .ability-line {
    font-size: 0.2em;
  }

  .pet-name-line {
    font-weight: 600;
  }

  .pet-summon-line {
    color: #ffffff;
  }

  .pet-require-line {
    color: #ffffff;
  }

  .pet-level-line {
    color: #2ecc71;
  }

  .pet-ability-line {
    color: #e74c3c;
  }

  .pet-growth-line {
    color: #4aa3ff;
  }

  .pet-energy-line {
    color: #e74c3c;
  }

  .pet-description-line {
    color: #c184ff;
  }

  .item-description {
    margin-top: 8px;
    font-style: italic;
    color: #bbb;
    font-size: 0.9em;
  }

  /* 礼包内容样式 */
  .tooltip-contents {
    margin-top: 8px;
    padding: 4px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  .tooltip-contents-title {
    font-weight: bold;
    color: #ffd700;
    font-size: 0.9em;
    margin-bottom: 4px;
  }

  .tooltip-contents-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 0;
    font-size: 0.85em;
    color: #ddd;
  }

  .tooltip-contents-icon {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .tooltip-contents-name {
    flex: 1;
  }

  .tooltip-contents-count {
    color: #5c9dff;
    font-weight: bold;
  }

  .tooltip-contents-chance {
    color: #4caf50;
    font-size: 0.9em;
  }

  .tooltip-set {
    margin: 0;
    padding: 0;
    /* 分割线已移除 */
  }

  .set-title {
    font-weight: bold;
    color: #f1c40f;
    margin: 0;
    padding: 0;
  }

  .pname {
    color: #95a5a6;
    margin: 0;
    padding: 0;
  }

  .pnameated {
    color: #2ecc71;
    font-weight: bold;
    margin: 0;
    padding: 0;
  }

  .tz_activat {
    color: #7f8c8d;
    margin: 0;
    padding: 0;
  }

  .tz_activated {
    color: #3498db;
    font-weight: bold;
    margin: 0;
    padding: 0;
  }

  /* 套装效果列表中的p元素 */
  .tooltip-set > p {
    margin: 0;
    padding: 0;
  }

  /* 终极品质标识样式 */
  .ultimate-badge {
    position: relative;
    padding: 3px;
    margin: -5px -5px 8px -5px;
    background: transparent;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
    height: 24px;
  }

  /* 内层容器 - 无边框无背景 */
  .ultimate-badge-inner {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    background: transparent;
    border: none;
    border-radius: 5px;
    overflow: hidden;
  }

  /* 左侧Ultimate文字区域 - 高度与右侧宝石图片一致（18px含边框） */
  .ultimate-badge-left {
    flex: 0 0 75px;
    width: 75px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;
    overflow: visible;
    background: #d63384;
    border: 2px solid #2dd4bf;
    border-radius: 4px;
  }

  /* 七彩线条边框动画 - 使用伪元素绘制边框流光 */
  .ultimate-badge-left::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 5px;
    padding: 1px;
    background: linear-gradient(
      90deg,
      #ff0000 0%,
      #ff7f00 14%,
      #ffff00 28%,
      #00ff00 42%,
      #00ffff 56%,
      #0000ff 70%,
      #8b00ff 85%,
      #ff0000 100%
    );
    background-size: 400% 100%;
    background-position: 0% 0;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: ultimate-border-flow 5s linear infinite;
    pointer-events: none;
    z-index: 3;
  }

  @keyframes ultimate-border-flow {
    0% {
      background-position: 0% 0;
    }
    100% {
      background-position: 100% 0;
    }
  }

  /* 右侧宝石槽区域 - 占比80%，黑色背景 */
  .ultimate-badge-right {
    flex: 0 0 80%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 8px;
    gap: 2px;
    position: relative;
    z-index: 2;
    background: #000;
    height: 100%;
  }

  /* 终极品质文字样式 - 金色渐变立体效果 */
  .ultimate-badge-text {
    position: relative;
    font-size: 12px;
    font-weight: bold;
    font-family: 'Arial Black', Arial, sans-serif;
    letter-spacing: 1px;
    /* 金色渐变 */
    background: linear-gradient(
      180deg,
      #fff7c2 0%,
      #ffd700 20%,
      #ffb800 40%,
      #ff9500 60%,
      #ffd700 80%,
      #fff7c2 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    /* 文字阴影模拟立体效果和白色高光 */
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.9))
            drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4));
  }

  /* 空宝石槽图标样式 */
  .ultimate-gem-slot {
    width: 18px;
    height: 18px;
    object-fit: contain;
    opacity: 0.9;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  /* 对比面板中的终极品质标识适配 */
  .ultimate-badge-compare {
    margin: -8px -10px 8px -10px;
    border-radius: 8px 8px 0 0;
  }

  /* 镶嵌宝石属性区域样式 */
  .embedded-gems-section {
    margin: 8px 0 0 0;
    padding: 0;
  }

  .embedded-gem-item {
    font-size: 0.9em;
    text-align: left;
    margin: 0;
    color: #00c8ff;
  }

  /* 宝石槽包裹器 */
  .ultimate-gem-slot-wrapper {
    display: inline-block;
    border-radius: 4px;
  }

  /* 已镶嵌宝石包裹器 */
  .ultimate-gem-slot-wrapper.gem-embedded {
    position: relative;
    border-radius: 4px;
  }

  /* 已镶嵌宝石图片 - 边缘七彩流光闪烁动画 */
  .ultimate-gem-slot-wrapper.gem-embedded .ultimate-gem-slot {
    animation: gem-edge-glow 5s linear infinite;
  }

  /* 宝石边缘七彩流光闪烁动画 */
  @keyframes gem-edge-glow {
    0% {
      filter: drop-shadow(0 0 3px #ff0000) drop-shadow(0 0 6px #ff0000);
    }
    14% {
      filter: drop-shadow(0 0 3px #ff7f00) drop-shadow(0 0 6px #ff7f00);
    }
    28% {
      filter: drop-shadow(0 0 3px #ffff00) drop-shadow(0 0 6px #ffff00);
    }
    42% {
      filter: drop-shadow(0 0 3px #00ff00) drop-shadow(0 0 6px #00ff00);
    }
    56% {
      filter: drop-shadow(0 0 3px #00ffff) drop-shadow(0 0 6px #00ffff);
    }
    70% {
      filter: drop-shadow(0 0 3px #0000ff) drop-shadow(0 0 6px #0000ff);
    }
    85% {
      filter: drop-shadow(0 0 3px #8b00ff) drop-shadow(0 0 6px #8b00ff);
    }
    100% {
      filter: drop-shadow(0 0 3px #ff0000) drop-shadow(0 0 6px #ff0000);
    }
  }
</style>
