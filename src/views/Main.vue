<template>
  <!-- 使用MainLayout组件作为根组件 -->
  <MainLayout
    ref="mainLayoutRef"
    :player="player"
    :player-avatar="playerAvatar"
    :player-class-name="playerClassName"
    :health-percentage="healthPercentage"
    :mana-percentage="manaPercentage"
    :exp-percentage="expPercentage"
    :last-damage="lastDamage"
    :battle-logs="battleLogs"
    :show-monsters="showMonsters"
    :monster-display-count="monsterDisplayCount"
    :monsters="monsters"
    :ui-damage-numbers="uiDamageNumbers"
    :ui-exp-numbers="uiExpNumbers"
    :user-settings="userSettings"
    :current-map="currentMap"
    :show-map-display="showMapDisplay"
    :game-initializer="gameInitializerManager"
    :game-data="gameData"
    :active-buffs="activeBuffs"
    :exp-multiplier="expMultiplier"
    :drop-rate="dropRate"
    :auto-battle="autoBattle"
    :auto-battle-service="autoBattleService"
    :skill-service="skillService"
    @open-player-detail-modal="openPlayerDetailModal"
    @handle-image-error="handleUIImageError"
    @add-battle-log="addBattleLog"
    @handle-auto-battle-attack="handleAutoBattleAttack"
    @handle-auto-battle-skill-use="handleAutoBattleSkillUse"
    @player-death="handlePlayerDeathInAutoBattle"
    @player-skill-use="handlePlayerSkillUse"
    @player-damage="handlePlayerDamage"
    @update-last-damage="lastDamage = $event"
    @use-recovery-item="useRecoveryItem"
    @refresh-monsters="refreshMonstersAndStartAutoBattle"
    @check-and-refresh-monsters="checkAndRefreshMonsters"
    @update-monsters-from-auto-battle="updateMonstersFromAutoBattle"
    @open-job-change-modal="openJobChangeModal"
    @open-storage-modal="openStorageModal"
    @open-npc-quest-panel="openNPCQuestPanel"
    @open-dialogue="handleOpenDialogue"
    @open-tower-modal="openTowerModal"
    @open-shop-modal="openShopModal"
    @open-blacksmith-modal="openBlacksmithModalFromShop"
    @open-armor-shop-modal="openArmorShopModalFromShop"
    @open-food-shop-modal="openFoodShopModalFromShop"
    @open-magic-shop-modal="openMagicShopModalFromShop"
    @open-pet-trainer-modal="openPetTrainerModal"
    @open-jewelry-master-modal="openJewelryMasterModal"
    @open-huafu-shop-modal="openHuaFuShopModal"
    @attack-monster="attackMonster"
    @handle-monster-image-error="handleMonsterImageError"
    @show-monster-drops-panel="showMonsterDropsPanel"
    @get-monster-display-name="getMonsterDisplayName"
    @open-bag-modal="openInventoryFromBag"
    @open-equipment-modal="openInventoryFromEquip"
    @open-quest-panel="openQuestPanel"
    @open-map-modal="openMapModal"
@open-settings-modal="openSettingsPortalPanel"
@open-database-query-modal="openDatabaseQueryModal"
@show-damage-number="showDamageNumber"
    @monster-attack-animation="handleMonsterAttackAnimation"
    @stop-pulse-animation="handleStopPulseAnimation"
    @start-pulse-animation="handleStartPulseAnimation"
  />

  <!-- 战斗日志组件 -->
  <BattleLog v-if="showBattleLog" ref="battleLogRef" :logs="battleLogs" :max-logs="100" />

  <!-- 怪物掉落物品面板 -->
  <MonsterDropsPanel />

  <!-- 怪物获取倒计时 -->
  <MonsterCountdown
    :is-active="showCountdown"
    :countdown-seconds="monsterFetchCountdownSeconds"
    @countdown-finished="onCountdownFinished"
  />

  <!-- 玩家死亡倒计时 -->
  <PlayerDeathCountdown
    :is-active="isPlayerDead"
    :countdown-seconds="playerDeathCountdown"
    @countdown-finished="onPlayerDeathCountdownFinished"
  />

  <!-- 模态框区域 -->
  <!-- 背包模态框 -->
  <BagModal
    v-if="modalStates.bagModal"
    ref="bagModalRef"
    :show="modalStates.bagModal"
    :anchor-button-id="inventoryAnchorButtonId"
    :player="player"
    :user-settings="userSettings"
    :game-data="gameData"
    :game-initializer="gameInitializerManager"
    :remove-item-from-bag="removeItemFromBag"
    :show-damage-number="showDamageNumber"
    :add-battle-log="addBattleLog"
    :show-animation-message="showAnimationMessage"
    :open-rename-panel="openRenamePanelWithItem"
    @close="closeBagModal"
    @player-data-updated="onPlayerDataUpdated"
  />

  <!-- 仓库模态框 -->
  <StorageModal
    v-if="modalStates.storageModal"
    :show="modalStates.storageModal"
    @close="closeStorageModal"
  />

  <!-- 钻石商店模态框 -->
  <DiamondShopModal
    v-if="showShopModal"
    :is-visible="showShopModal"
    :show-animation-message="showAnimationMessage"
    @update:is-visible="showShopModal = $event"
    @purchase-success="onDiamondShopPurchase"
    @diamonds-changed="onDiamondsChanged"
  />

  <!-- 食品商店模态框 -->
  <FoodShopModal
    v-if="showFoodShopModal"
    :npc-name="foodShopModalData.npcName"
    :npc-avatar="foodShopModalData.npcAvatar"
    :npc-dialog="foodShopModalData.npcDialog"
    :shop-items="foodShopItems"
    @close="closeFoodShopModalFromShop"
    @purchase="handleFoodPurchase"
  />

  <!-- 魔法商店模态框 -->
  <MagicShopModal
    v-if="showMagicShopModal"
    :npc-name="magicShopModalData.npcName"
    :npc-avatar="magicShopModalData.npcAvatar"
    :npc-dialog="magicShopModalData.npcDialog"
    :shop-items="magicShopItems"
    @close="closeMagicShopModalFromShop"
    @purchase="handleMagicPurchase"
  />

  <!-- 铁匠模态框 -->
  <BlacksmithModal
    v-if="showBlacksmithModal"
    :is-visible="showBlacksmithModal"
    :player="player"
    :shop-items="blacksmithShopItems"
    :npc-name="blacksmithModalData.npcName"
    :npc-icon="blacksmithModalData.npcAvatar"
    :current-dialog="blacksmithModalData.npcDialog"
    @close="closeBlacksmithModalFromShop"
    @purchase="handleBuyItem"
    @open-enhance-panel="openEnhancePanel"
    @open-perforation-panel="openPerforationPanel"
    @open-card-panel="openCardPanel"
  />

  <!-- 装备商店模态框 -->
  <ArmorShopModal
    v-if="showArmorShopModal"
    :is-visible="showArmorShopModal"
    :player="player"
    :shop-items="armorShopItems"
    :npc-name="armorShopModalData.npcName"
    :npc-icon="armorShopModalData.npcAvatar"
    :current-dialog="armorShopModalData.npcDialog"
    @close="closeArmorShopModalFromShop"
    @purchase="handleBuyItem"
    @player-data-updated="onPlayerDataUpdated"
    @play-sfx="handlePlaySFX"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
  />

  <!-- 深渊之塔管理员模态框 -->
  <TowerAdminModal
    v-if="modalStates.towerAdminModal"
    :is-visible="modalStates.towerAdminModal"
    :player="player"
    :game-data="gameData"
    @close="closeTowerModalFromUIStateManager"
    @quest-accepted="handleQuestAcceptedFromEventHandler"
  />

  <!-- NPC任务模态框 -->
  <NPCQuestModal
    v-if="modalStates.npcQuestModal"
    :is-visible="modalStates.npcQuestModal"
    :player="player"
    :game-data="gameData"
    :current-map="currentMap"
    @close="closeNPCQuestPanel"
    @quest-accepted="handleQuestAccepted"
  />

  <!-- 原神风格对话系统 -->
  <DialogueSystem
    :is-visible="modalStates.dialogueModal"
    :dialogue-params="dialogueData"
    @close="closeDialogue"
    @quest-accepted="handleDialogueQuestAccepted"
    @quest-completed="handleDialogueQuestCompleted"
    @open-shop="handleDialogueOpenShop"
    @view-quests="handleDialogueViewQuests"
  />
  <PetTrainerModal
    v-if="modalStates.petTrainerModal"
    :is-visible="modalStates.petTrainerModal"
    :game-initializer="gameInitializerManager"
    :add-battle-log="addBattleLog"
    @close="closePetTrainerModal"
  />

  <!-- 设置模态框 -->
  <SettingsManager
    ref="settingsManagerRef"
    v-model:show-settings-modal="modalStates.settingsModal"
    :game-initializer="gameInitializerManager"
    :add-battle-log="addBattleLog"
    :user-settings="userSettings"
    @update:user-settings="
      newVal => {
        userSettings.value = { ...userSettings.value, ...newVal }
      }
    "
    @settings-saved="handleSettingsSaved"
  />

  <!-- 数据库查询模态框 -->
  <DatabaseQueryModal
    v-if="modalStates.databaseQueryModal"
    :show="modalStates.databaseQueryModal"
    @close="closeDatabaseQueryModal"
  />

  <!-- 使用PlayerDetailModal组件 -->
  <transition name="player-detail-transition" appear>
    <PlayerDetailModal
      v-if="modalStates.playerDetailModal"
      :player="player"
      :set-bonuses="setBonuses"
      :player-avatar="playerAvatar"
      :player-class-name="playerClassName"
      :health-percentage="healthPercentage"
      :mana-percentage="manaPercentage"
      :exp-percentage="expPercentage"
      :player-stats="playerStats"
      :strength-bonus="strengthBonus"
      :constitution-bonus="constitutionBonus"
      :intelligence-bonus="intelligenceBonus"
      :agility-bonus="agilityBonus"
      @close="closePlayerDetailModal"
      @increase-attribute="increaseAttribute"
      @decrease-attribute="decreaseAttribute"
      @confirm-attributes="confirmAttributes"
    />
  </transition>

  <!-- 加载提示 -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner"></div>
    <div class="loading-text">游戏初始化中...</div>
    <div class="loading-progress-bar">
      <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
      <div class="loading-progress-text">{{ loadingProgressText }}</div>
    </div>
    <div class="loading-status">{{ currentLoadItemText }}</div>
  </div>

  <CutsceneAnimation
    :is-visible="showCutscene"
    :trigger-key="cutsceneTrigger"
    @animation-complete="onCutsceneComplete"
  />

  <AtmosphereEffect
    text=""
    :theme="userSettings.themeColor"
    :show-rain="userSettings.showWeatherEffect !== false && showRainEffect"
    :show-snow="userSettings.showWeatherEffect !== false && showSnowEffect"
    :show-sunny="userSettings.showWeatherEffect !== false && showSunnyEffect"
    :allow-rain-in-festival="true"
    :rain-density="userSettings.weatherEffectDensity ?? 50"
    :decor-density="userSettings.festivalEffectDensity ?? 50"
    :full-screen="true"
    :enable-decorations="userSettings.showFestivalEffect !== false"
  />

  <div v-if="showMapNameAnimation" :key="mapNameAnimationKey" class="map-name-animation">
    <AtmosphereEffect
      :text="mapNameAnimationText"
      :theme="userSettings.themeColor"
      :animated="true"
    />
  </div>

  <!-- 地图模态框 -->
  <MapModal
    v-if="modalStates.mapModal && gameData?.monsters"
    :is-visible="modalStates.mapModal"
    :game-data="gameData"
    :current-map="currentMap"
    :player="player"
    @close="closeMapModal"
    @map-change="handleMapChangeWithCutscene"
    @enter-dungeon="showDungeonPanel"
  />

  <!-- 玩家任务面板 -->
  <QuestModal
    v-if="modalStates.questModal && player && player.quest"
    :is-visible="modalStates.questModal"
    :player="player"
    :game-data="gameData"
    @close="closeQuestPanel"
    @quest-completed="handleQuestCompleted"
    @quest-removed="handleQuestRemoved"
  />

<!-- BUFF计时面板 -->
<BuffTimerPanel
v-if="modalStates.buffTimerPanel"
:is-visible="modalStates.buffTimerPanel"
:player="player"
:current-map-name="currentMap?.name || ''"
@close="closeBuffTimerPanel"
@remove-buff="handleBuffTimerRemoveBuff"
/>

<!-- 技能面板 -->
<SkillPanel
v-if="modalStates.skillPanel"
:is-visible="modalStates.skillPanel"
:player="player"
:active-buffs="activeBuffs"
@close="closeSkillPanel"
@play-sfx="handlePlaySFX"
/>

<!-- 成就面板 -->
<AchievementPanel
v-if="modalStates.achievementPanel"
:is-visible="modalStates.achievementPanel"
@close="closeAchievementPanel"
/>

<!-- 设置功能入口面板 -->
<SettingsPortalPanel
v-if="modalStates.settingsPortalPanel"
:is-visible="modalStates.settingsPortalPanel"
@close="closeSettingsPortalPanel"
@open-settings="openSettingsModal"
@open-data-update="handleOpenDataUpdater"
/>

<!-- 强化面板 -->
  <EnhancePanel
    :is-visible="modalStates.enhancePanel"
    :initial-position="enhancePanelInitialPosition"
    :player="player"
    :add-battle-log="addBattleLog"
    @close="closeEnhancePanel"
    @enhance-success="handleEnhanceSuccess"
    @enhance-failure="handleEnhanceFailure"
    @enhance-apply="applyEnhanceResult"
  />

  <!-- 穿洞面板 -->
  <PerforationPanel
    :is-visible="modalStates.perforationPanel"
    :initial-position="perforationPanelInitialPosition"
    :player="player"
    @close="closePerforationPanel"
    @perforation-success="handlePerforationSuccess"
    @perforation-failure="handlePerforationFailure"
    @perforation-apply="applyPerforationResult"
  />

  <!-- 卡片镶嵌面板 -->
  <CardPanel
    :is-visible="modalStates.cardPanel"
    :initial-position="cardPanelInitialPosition"
    :player="player"
    @close="closeCardPanel"
    @card-apply="applyCardInsertResult"
  />

  <!-- 职业进阶模态框 -->
  <JobChangeModal
    :is-visible="modalStates.jobChangeModal"
    :player="player"
    @close="closeJobChangeModal"
    @job-changed="handleJobChanged"
  />

  <!-- 改名面板 -->
  <RenamePanel
    :visible="modalStates.renamePanel"
    :current-name="player?.nickname || ''"
    @close="closeRenamePanel"
    @confirm="handleRenameConfirm"
  />

  <!-- 属性更改面板 -->
  <ElementChangePanel
    :visible="modalStates.elementChangePanel"
    @close="closeElementChangePanel"
    @confirm="handleElementChangeConfirm"
  />

  <!-- 属性攻击魔法石选择面板 -->
  <ElementStoneSelectPanel
    :visible="modalStates.stoneSelectPanel"
    @close="closeStoneSelectPanel"
    @confirm="handleStoneSelectConfirm"
  />

  <!-- 性别选择面板（用于selectbox类型套装礼盒） -->
  <GenderSelectPanel
    :visible="modalStates.genderSelectPanel"
    :box-item-id="genderSelectData.boxItemId"
    :box-item-name="genderSelectData.boxItemName"
    :box-description="genderSelectData.boxDescription"
    :contents="genderSelectData.contents"
    @close="closeGenderSelectPanel"
    @confirm="handleGenderSelectConfirm"
  />

  <!-- 功能面板 -->
  <FunctionPanelModal
    v-if="modalStates.functionPanel"
    :is-visible="modalStates.functionPanel"
    :player="player"
    @close="closeFunctionPanel"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 珠宝大师-皮奇 -->
  <JewelryMasterModal
    v-if="modalStates.jewelryMasterModal"
    :is-visible="modalStates.jewelryMasterModal"
    :player="player"
    @close="closeJewelryMasterModal"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 华弗PK纸片兑换 -->
  <HuaFuShopModal
    v-if="modalStates.huafuShopModal"
    :is-visible="modalStates.huafuShopModal"
    :show-animation-message="showAnimationMessage"
    @update:is-visible="modalStates.huafuShopModal = $event"
    @add-battle-log="addBattleLog"
  />

  <!-- 重置史诗＆终极武器特殊属性面板 -->
  <ResetWeaponAttributeModal
    v-if="modalStates.resetWeaponAttributeModal"
    :visible="modalStates.resetWeaponAttributeModal"
    @close="closeResetWeaponAttributeModal"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 重置 转化终极武器新增特殊属性面板 -->
  <ResetUltimateWeaponBonusModal
    v-if="modalStates.resetUltimateWeaponBonusModal"
    :visible="modalStates.resetUltimateWeaponBonusModal"
    @close="closeResetUltimateWeaponBonusModal"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 武器唤醒面板 -->
  <WeaponAwakeningModal
    v-if="modalStates.weaponAwakeningModal"
    :visible="modalStates.weaponAwakeningModal"
    @close="closeWeaponAwakeningModal"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 祝福唤醒面板 -->
  <BlessingAwakeningModal
    v-if="modalStates.blessingAwakeningModal"
    :visible="modalStates.blessingAwakeningModal"
    @close="closeBlessingAwakeningModal"
    @add-battle-log="addBattleLog"
    @show-animation-message="showAnimationMessage"
    @play-sfx="handlePlaySFX"
  />

  <!-- 捡东西宠物动画组件 -->
  <PickuppetPet :drop-animation-refs="dropAnimationRefsMap" />

  <!-- 掉落动画组件（支持多个同时显示） -->
  <drop-animation
    v-for="animation in activeDropAnimations"
    :id="animation.id"
    :ref="el => setDropAnimationRef(animation.id, el)"
    :key="'drop-anim-' + animation.id"
    :monster="animation.monster"
    :item="animation.item"
    :gold-amount="animation.goldAmount"
    :fast-mode="animation.fastMode"
    :auto-loot="animation.autoLoot !== false"
    @animation-complete="onDropAnimationComplete"
    @manual-pickup="onManualPickup"
    @pet-pickup="onManualPickup"
  />

  <!-- 物品掉落光柱特效（稀有/传说/史诗品级，支持多个同时显示） -->
  <item-drop-beam-effect
    v-for="beam in activeBeamEffects"
    :id="beam.id"
    :ref="el => setBeamEffectRef(beam.id, el)"
    :key="'beam-' + beam.id"
    :position="beam.position"
    :rank="beam.rank"
    @beam-complete="onBeamEffectComplete"
  />

  <!-- 错误提示 -->
  <div v-if="errorMessage" class="error-overlay">
    <div class="error-modal">
      <h3>错误</h3>
      <p>{{ errorMessage }}</p>
      <button class="error-button" @click="handleErrorDismiss">确定</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, triggerRef, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { StaticGameInitializer } from '@/services/StaticGameInitializer'
import { Player } from '@/models/Player'
import { useGameStore, useMonstersStore, useItemsStore, usePickuppetSummonStore, ensureGameStores } from '@/store'
import { useSkillBarSlotsStore } from '@/store/skillBarSlots'
import { ABILITY_PARAMETER_MAP, getParameterName, ATTRIBUTE_NAMES } from '@/store/descriptions'
import { SetBonusService } from '@/services/SetBonusService'
// useMonstersStore, useItemsStore 已从 @/store 统一导入
// import AutoBattle from '@/components/AutoBattle.vue' // AutoBattle component has been removed
// ★ BagModal 引用了 SKILL_INFO 等重型数据，使用 defineAsyncComponent 延迟加载
const BagModal = defineAsyncComponent(() => import('@/components/modals/BagModal.vue'))
import { useBag } from '@/composables/useBag'
import { usePlayer } from '@/composables/usePlayer'

// 添加全局错误处理器来捕获渲染错误
import StorageModal from '@/components/modals/StorageModal.vue'
import SkillsManager from '@/components/SkillsManager.vue'
import SettingsManager from '@/components/SettingsManager.vue'
// ★ 重型模态框：使用 defineAsyncComponent 延迟加载，避免 Main.vue chunk 静态引用 ITEM_INFO/MONSTER_INFO
// 这些组件内部 import 了重型数据文件（28MB+19MB），如果静态 import 会导致 Select 页面跳转时预加载这些大文件
const DatabaseQueryModal = defineAsyncComponent(() => import('@/components/modals/DatabaseQueryModal.vue'))
import MapModal from '@/components/modals/MapModal.vue'
import PlayerDetailModal from '@/components/modals/PlayerDetailModal.vue'
import QuestModal from '@/components/modals/QuestModal.vue'
import NPCQuestModal from '@/components/modals/NPCQuestModal.vue'
import DialogueSystem from '@/components/modals/DialogueSystem.vue'
import PetTrainerModal from '@/components/modals/PetTrainerModal.vue'
import TowerAdminModal from '@/components/modals/TowerAdminModal.vue'
import DiamondShopModal from '@/components/modals/DiamondShopModal.vue'
import BlacksmithModal from '@/components/modals/BlacksmithModal.vue'
import ArmorShopModal from '@/components/modals/ArmorShopModal.vue'
import EnhancePanel from '@/components/modals/EnhancePanel.vue'
import PerforationPanel from '@/components/modals/PerforationPanel.vue'
import CardPanel from '@/components/modals/CardPanel.vue'
import FoodShopModal from '@/components/modals/FoodShopModal.vue'
import MagicShopModal from '@/components/modals/MagicShopModal.vue'
import JobChangeModal from '@/components/modals/JobChangeModal.vue'
import RenamePanel from '@/components/modals/RenamePanel.vue'
import ElementChangePanel from '@/components/modals/ElementChangePanel.vue'
import ElementStoneSelectPanel from '@/components/modals/ElementStoneSelectPanel.vue'
import GenderSelectPanel from '@/components/modals/GenderSelectPanel.vue'
import FunctionPanelModal from '@/components/modals/FunctionPanelModal.vue'
import BuffTimerPanel from '@/components/modals/BuffTimerPanel.vue'
import SkillPanel from '@/components/modals/SkillPanel.vue'
import AchievementPanel from '@/components/modals/AchievementPanel.vue'
import SettingsPortalPanel from '@/components/modals/SettingsPortalPanel.vue'
const JewelryMasterModal = defineAsyncComponent(() => import('@/components/modals/JewelryMasterModal.vue'))
const HuaFuShopModal = defineAsyncComponent(() => import('@/components/modals/HuaFuShopModal.vue'))
const ResetWeaponAttributeModal = defineAsyncComponent(() => import('@/components/modals/ResetWeaponAttributeModal.vue'))
const ResetUltimateWeaponBonusModal = defineAsyncComponent(() => import('@/components/modals/ResetUltimateWeaponBonusModal.vue'))
const WeaponAwakeningModal = defineAsyncComponent(() => import('@/components/modals/WeaponAwakeningModal.vue'))
const BlessingAwakeningModal = defineAsyncComponent(() => import('@/components/modals/BlessingAwakeningModal.vue'))
import { NPCItemService } from '@/services/NPCItemService.js'
import BagService from '@/services/BagService.js'
import { storageService as storageServiceSingleton } from '@/services/StorageService'
import { useMonsterBattle } from '@/composables/useMonsterBattle'
import { recordSignInKill, getKillRequirement, getBossKillRequirement } from '@/composables/useDailySignIn'
import { useUnifiedSkills } from '@/composables/useUnifiedSkills'
import { useItems } from '@/composables/useItems'
import { useSettings } from '@/composables/useSettings'
import { useUI } from '@/composables/useUI'
import { useShop } from '@/composables/useShop'
import { useNPC } from '@/composables/useNPC'
import { useMonsterManager } from '@/composables/useMonsterManager'
import { useMap } from '@/composables/useMap'
import { useDungeonTimer } from '@/composables/useDungeonTimer'
import { useQuestManager } from '@/composables/useQuestManager'
import { useGameLoopManager } from '@/composables/useGameLoopManager'
import { clearBuffDuration } from '@/composables/useGameLoopManager'
import { processDamageRecovery } from '@/composables/useHotProcessor'
import { useDragManager } from '@/composables/useDragManager'
import { useExperienceCalculator } from '@/composables/useExperienceCalculator'
import { useAutoBattleUnified } from '@/composables/useAutoBattleUnified'
import { useAutoBattleUIHandlers } from '@/composables/useAutoBattleUIHandlers'
import { useAutoBattlePlayerDeathFlow } from '@/composables/useAutoBattlePlayerDeathFlow'
import { useAutoBattleDrops } from '@/composables/useAutoBattleDrops'
import { useAutoSellAndRecovery } from '@/composables/useAutoSellAndRecovery'
import { useGoldUpdateListener } from '@/composables/useGoldUpdateListener'
import { useModalPanelInitialPosition } from '@/composables/useModalPanelInitialPosition'
import AutoBattleStatus from '@/components/AutoBattleStatus.vue'
import { useItemManager, registerSpecialItemCallbacks } from '@/composables/useItemManager'
import { useUIStateManager } from '@/composables/useUIStateManager'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { notifyMainReady } from '@/services/HeartbeatService'
import { useGameInitializer } from '@/composables/useGameInitializer'
import { useEventHandler } from '@/composables/useEventHandler'
import { getGenderName, getClassRestrictionName, classMapping, classNameToKeyMap, getClassIconPath } from '@/utils/itemHelpers'
import { CLASS_CONFIG, CLASS_GROWTH_FORMULAS, getClassName } from '@/data/classes'
import { getItemName } from '@/utils/itemUtils'
import { syncQuestDataToPlayerQuest } from '@/utils/questSync'
import { DamageCalculator } from '@/utils/damageCalculator'
import { QuestService } from '@/services/QuestService'
import {
  imageService,
  loadImage,
  preloadGameImages,
  preloadBagItemImages,
  preloadEquipmentImages
} from '@/services/ImageService'
import { DropService } from '@/services/DropService'
import { SkillEffectService } from '@/services/SkillEffectService'
import ErrorHandler from '@/services/ErrorHandler'
import { WaveSettlementAggregator } from '@/services/autoBattle/WaveSettlementAggregator'
import { dotTickScheduler } from '@/services/autoBattle/DotTickScheduler'
import { useAchievementKillTracker } from '@/composables/useAchievementKillTracker'

// 导入新创建的组件
import MainLayout from '@/components/MainLayout.vue'
import PlayerInfoPanel from '@/components/PlayerInfoPanel.vue'
import MonsterInfoPanel from '@/components/MonsterInfoPanel.vue'
import BottomSection from '@/components/BottomSection.vue'
import MonsterCountdown from '@/components/MonsterCountdown.vue'
import PlayerDeathCountdown from '@/components/PlayerDeathCountdown.vue'
import DropAnimation from '@/components/DropAnimation.vue'
import ItemDropBeamEffect from '@/components/ItemDropBeamEffect.vue'
import PickuppetPet from '@/components/PickuppetPet.vue'
import BattleLog from '@/components/BattleLog.vue'
import CutsceneAnimation from '@/components/CutsceneAnimation.vue'
import AtmosphereEffect from '@/components/AtmosphereEffect.vue'
import MonsterDropsPanel from '@/components/MonsterDropsPanel.vue'

const router = useRouter()
const store = useGameStore()

const mainLayoutRef = ref(null)
const settingsManagerRef = ref(null)
const battleLogRef = ref(null)

/**
   * 显示动画消息的包装函数
   * @param {string} text - 消息文本
   * @param {string} type - 消息类型
   * @param {string} icon - 物品图标路径
   * @param {string} secondaryIcon - 第二个物品图标路径
   * @param {string} connectorText - 两个图标之间的连接文字
   * @param {string} secondaryText - 第二图标后的消息文本
   * @param {string} prefixText - 第一图标前的前缀文本
   */
const showAnimationMessage = (
  text,
  type = 'info',
  icon = '',
  secondaryIcon = '',
  connectorText = '',
  secondaryText = '',
  prefixText = ''
) => {
  try {
    const rawSettings = localStorage.getItem('userSettings')
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings)
      if (parsed && parsed.showBattleLogAnimation === false) {
        return
      }
    }
  } catch (e) {}

  if (battleLogRef.value && battleLogRef.value.showAnimationMessage) {
    battleLogRef.value.showAnimationMessage(text, type, icon, secondaryIcon, connectorText, secondaryText, prefixText)
  }
}

// ★ 确保所有重型子 Store 已加载完成（顶层 await 使 setup 变为异步）
// 配合 App.vue 的 <Suspense>，加载期间显示 Loading fallback
// 这保证了 useItemsStore() / useMonstersStore() 在调用时已就绪
console.log('[Main] ensureGameStores 开始加载...')
const storeLoadStart = performance.now()
await ensureGameStores()
console.log(`[Main] ensureGameStores 加载完成，耗时: ${(performance.now() - storeLoadStart).toFixed(1)}ms`)

// 使用统一的 items Store（需要在 handleBattleLogAnimation 之前定义）
const itemsStore = useItemsStore()
const pickuppetSummonStore = usePickuppetSummonStore()

// 掉落动画相关 - 稀有度过滤配置（需要在 handleBattleLogAnimation 之前定义）
const dropAnimationItemIconRarityKeys = new Set([
  'rare',
  'veryrare',
  'legendary',
  'unique',
  'epic',
  'ultimate'
])
const dropAnimationItemIconRarityLabels = new Set(['稀有', '非常稀有', '传说', '史诗', '终极'])
const shouldShowDropAnimationItemIcon = item => {
  if (!item) {
    return false
  }

  const rawRarity =
    item?.rarity ?? item?.rarityName ?? item?.quality ?? item?.grade ?? item?.rank ?? item?.levelName ?? ''

  if (typeof rawRarity !== 'string') {
    return false
  }

  const trimmed = rawRarity.trim()
  if (!trimmed) {
    return false
  }

  if (dropAnimationItemIconRarityLabels.has(trimmed)) {
    return true
  }

  return dropAnimationItemIconRarityKeys.has(trimmed.toLowerCase())
}

const handleBattleLogAnimation = event => {
  try {
    const detail = event && typeof event === 'object' ? event.detail : null
    const text = typeof detail?.text === 'string' ? detail.text : ''
    if (!text) {
      return
    }
    const type = typeof detail?.type === 'string' ? detail.type : 'info'
    const icon = typeof detail?.icon === 'string' ? detail.icon : ''
    const secondaryIcon = typeof detail?.secondaryIcon === 'string' ? detail.secondaryIcon : ''
    const connectorText = typeof detail?.connectorText === 'string' ? detail.connectorText : ''
    const secondaryText = typeof detail?.secondaryText === 'string' ? detail.secondaryText : ''
    const prefixText = typeof detail?.prefixText === 'string' ? detail.prefixText : ''
    const source = typeof detail?.source === 'string' ? detail.source : ''
    const checkRarity = detail?.checkRarity !== false
    const itemId = Number(detail?.itemId)
    if (source !== 'pet-trainer' && checkRarity && Number.isFinite(itemId)) {
      const itemConfig = itemsStore.getItemConfig(itemId)
      if (itemConfig && !shouldShowDropAnimationItemIcon(itemConfig)) {
        return
      }
    }
    showAnimationMessage(text, type, icon, secondaryIcon, connectorText, secondaryText, prefixText)
  } catch (error) {
    console.error('[Main.vue] handleBattleLogAnimation 失败:', error)
  }
}

let lastBagFullNotifyAt = 0
const handleBagFull = event => {
  try {
    const now = Date.now()
    if (now - lastBagFullNotifyAt <= 800) {
      return
    }
    lastBagFullNotifyAt = now

    const message = '背包已满，无法添加物品'
    showAnimationMessage(message, 'error', '')
    setTimeout(() => {
      try {
        const lastText =
          battleLogs?.value && battleLogs.value.length > 0
            ? battleLogs.value[battleLogs.value.length - 1]?.text
            : ''
        const hasBagFullLog =
          typeof lastText === 'string' &&
          (lastText.includes('背包已满') ||
            lastText.includes('背包空间不足') ||
            lastText.includes('背包格子不足'))

        if (!hasBagFullLog) {
          addBattleLog(message, 'error')
        }
      } catch (error) {
        console.error('[Main.vue] handleBagFull 延迟写入战斗日志失败:', error)
        addBattleLog(message, 'error')
      }
    }, 0)
  } catch (error) {
    console.error('[Main.vue] handleBagFull 失败:', error, event)
  }
}

/**
 * 页面可见性变化处理函数
 * 页面重新可见时强制清理伤害数字
 */
const handleVisibilityChange = () => {
  if (!document.hidden) {
    // 页面重新可见时强制清理一次伤害数字
    try {
      updateDamageNumbers()
    } catch (e) {
      // 忽略
    }
  }
}

// 使用组合式API模块
const {
  player,
  battleLogs,
  healthPercentage,
  manaPercentage,
  expPercentage,
  playerClassName,
  updatePlayerAttributes,
  gainExp,
  checkLevelUp,
  addBattleLog,
  addItemToBag: addItemToBagPlayer,
  updatePlayerMana,
  allocateStat,
  activeBuffs
} = usePlayer()

const {
  skills,
  skillTooltip,
  playerClass,
  initSkills,
  updateSkillCooldown,
  updateSkillProficiency,
  useSkill,
  showSkillTooltip,
  moveSkillTooltip,
  hideSkillTooltip,
  startSkillCooldownTimer: startSkillCooldownTimerFromSkills,
  isSkillAvailable,
  getSkillCooldown,
  setSkillCooldown,
  updateSkillCooldowns,
  skillService: unifiedSkillService
} = useUnifiedSkills()
const skillService = ref(unifiedSkillService) // 自动战斗使用的 skillService（默认用统一技能模块实例）
const {
  bagItems,
  filteredItems,
  selectedItem,
  showFilter,
  filterCategory,
  filterRarity,
  bagUsage,
  emptySlots,
  displayedItems,
  loadBagItems,
  toggleFilter,
  applyFilter,
  selectItem,
  isEquipped,
  useItem,
  equipItem,
  unequipItem,
  dropItem,
  sellItem,
  addItemToBag: addItemToBagUI,
  addItemsToBag,
  removeItemFromBag: removeItemFromBagUI,
  isBagFull,
  getBagUsageInfo,
  updateBagCapacity,
  getBagItems,
  findItemInBag,
  getItemCount,
  filterBagItemsByCategory,
  filterBagItemsByRarity,
  showTooltip,
  hideTooltip,
  updateTooltipPosition,
  handleImageError: handleItemImageError
} = useItems()
// 调用useUI获取showDamageNumber函数
const uiFunctions = useUI()
const {
  showDamageNumber,
  updateDamageNumbers,
  showExpNumber,
  updateExpNumbers,
  handleImageError: handleUIImageError,
  startDamageNumberForcePrune,
  stopDamageNumberForcePrune
} = uiFunctions
const uiDamageNumbers = uiFunctions.damageNumbers
const uiExpNumbers = uiFunctions.expNumbers

// 模态框状态已通过useUIStateManager管理

// UI功能已通过useUIStateManager和其他组合式API提供
const storageService = storageServiceSingleton
const {
  bagModalRef,
  toggleBagModal: toggleBagModalFromUseBag,
  refreshBagModal,
  addItemToBag,
  addItemToBagQueued,
  removeItemFromBag,
  sortBag,
  sellAllJunk
} = useBag(storageService)

// 地图数据（必须在 useShop 之前定义）
const currentMap = ref({
  name: '帕里大陆',
  levelRange: '1-20',
  background: '/pt/map/pl.png'
})
const availableMaps = ref([])

/**
* 副本倒计时与CD管理
* 使用 useDungeonTimer 管理副本活跃期（倒计时）和冷却期（CD）
* 活跃期内可自由出入副本，倒计时结束后进入CD期
*/
const { recordDungeonEntry, checkCanEnter: checkDungeonCooldown, reloadForSlotChange: reloadDungeonForSlot } = useDungeonTimer()

const {
  shopModalRef,
  openShopModal,
  closeShopModal,
  toggleShopModal,
  refreshShopModal,
  showShopModal,
  showFoodShopModal,
  showMagicShopModal,
  showBlacksmithModal,
  showArmorShopModal,
  npcItemService,
  foodShopModalData,
  magicShopModalData,
  blacksmithModalData,
  armorShopModalData,
  openFoodShopModal: openFoodShopModalFromShop,
  closeFoodShopModal: closeFoodShopModalFromShop,
  openMagicShopModal: openMagicShopModalFromShop,
  closeMagicShopModal: closeMagicShopModalFromShop,
  openBlacksmithModal: openBlacksmithModalFromShop,
  closeBlacksmithModal: closeBlacksmithModalFromShop,
  openArmorShopModal: openArmorShopModalFromShop,
  closeArmorShopModal: closeArmorShopModalFromShop
} = useShop(currentMap, player)
const {
  npcModalRef,
  openNPCModal: openNPCModalComposable,
  closeNPCModal: closeNPCModalComposable,
  toggleNPCModal,
  refreshNPCModal,
  showNPCQuestPanel,
  showStorageModal
} = useNPC()

// 新增的组合式API
const {
  experienceMultiplier,
  getExperienceMultiplier,
  getExperienceReduction,
  calculateActualExperience
} = useExperienceCalculator(player, activeBuffs)
const { calculateAutoBattleRewards, calculateAutoBattleRewardsBatch } = useAutoBattleDrops(player)

// 成就击杀进度追踪器（非阻塞式延迟批量更新）
const { recordKill: recordAchievementKill, flush: flushAchievementKills } = useAchievementKillTracker()

// 新创建的组合式API
// 先定义loadSettings和startGameLoop为空函数，避免循环依赖
let loadSettings = () => {
  console.warn('loadSettings尚未初始化')
}
let startGameLoop = () => {
  console.warn('startGameLoop尚未初始化')
}

// 使用统一的 monsters Store
const monstersStore = useMonstersStore()
const monsters = computed(() => monstersStore.currentMonsters)
let pendingMonsterDefeatedIndices = []
let pendingMonsterDefeatedFlushScheduled = false

/** 单次 flush 的分块大小（只怪物数），避免单次同步处理过多 */
const DEFEATED_FLUSH_CHUNK_SIZE = 5
/** 单次 flush 的时间预算（毫秒），超限后剩余数据延迟到下一个 setTimeout */
const DEFEATED_FLUSH_BUDGET_MS = 4

/**
 * flush 待处理怪物击败索引（分块 + 预算控制）
 *
 * 将待处理索引按 CHUNK_SIZE 分块，逐块调用 markDefeatedBatch。
 * 每块处理后检查时间预算，超限则将剩余索引放回队列并调度下一个 setTimeout(0)。
 * 这样避免 AOE 批量击杀时 markDefeatedBatch 的 proxy/TypedArray 写入 + $patch
 * 在单个 setTimeout handler 中累积到 384-764ms 导致主线程阻塞。
 */
const flushPendingMonsterDefeatedIndices = () => {
  pendingMonsterDefeatedFlushScheduled = false
  const batch = pendingMonsterDefeatedIndices
  pendingMonsterDefeatedIndices = []
  if (!Array.isArray(batch) || batch.length === 0) {
    return
  }
  try {
    const startedAt = performance.now()
    let offset = 0

    while (offset < batch.length) {
      const end = Math.min(offset + DEFEATED_FLUSH_CHUNK_SIZE, batch.length)
      const chunk = offset === 0 && end === batch.length ? batch : batch.slice(offset, end)

      if (typeof monstersStore.markDefeatedBatch === 'function') {
        monstersStore.markDefeatedBatch(chunk)
      } else {
        for (let i = 0; i < chunk.length; i++) {
          monstersStore.markDefeated(chunk[i])
        }
      }

      offset = end

      // 预算检查：超限后将剩余索引放回队列，调度下一个 setTimeout(0)
      if (offset < batch.length && performance.now() - startedAt > DEFEATED_FLUSH_BUDGET_MS) {
        pendingMonsterDefeatedIndices = batch.slice(offset)
        schedulePendingMonsterDefeatedIndicesFlush()
        break
      }
    }
  } catch (error) {
    console.error('[Main] 批量标记怪物击败失败:', error)
  }
}

/**
 * 调度待处理怪物击败索引的 flush
 *
 * 使用 setTimeout(0) 而非 queueMicrotask，确保 flush 在独立宏任务中执行。
 * 原因：onMonsterDefeated 回调通过 queueDeferredCallback 的 setTimeout(0) 触发，
 * 如果此处用 queueMicrotask，flush 会在同一个 setTimeout handler 内执行，
 * 导致 markDefeatedBatch 的 proxy 写入 + 定时器创建阻塞该 handler。
 * 改用 setTimeout(0) 后，onMonsterDefeated 回调快速完成，
 * markDefeatedBatch 在下一个宏任务中独立执行。
 */
const schedulePendingMonsterDefeatedIndicesFlush = () => {
  if (pendingMonsterDefeatedFlushScheduled) {
    return
  }
  pendingMonsterDefeatedFlushScheduled = true
  setTimeout(() => {
    flushPendingMonsterDefeatedIndices()
  }, 0)
}

// 怪物显示名称函数（使用 monstersStore）
const getMonsterDisplayName = monster => {
  return monstersStore.getMonsterDisplayName(monster)
}

// 怪物图标获取函数（使用 monstersStore）
const getMonsterIcon = monsterId => {
  return monstersStore.getMonsterIcon(monsterId)
}

// 完整的游戏数据（包含职业配置和技能配置）
const gameData = computed(() => {
  if (gameInitializerManager.value && gameInitializerManager.value.state) {
    return gameInitializerManager.value.state.gameData || {}
  }
  return {}
})

// 先定义attackMonster为空函数，避免循环依赖
let attackMonster = () => {
  console.warn('attackMonster尚未初始化')
}
const {
  gameInitializer: gameInitializerManager,
  isLoading,
  errorMessage,
  isInitialized,
  loadingProgress,
  currentLoadItem,
  initGame,
  initPlayerData,
  initSkills: initSkillsFromGameInitializer,
  initBuffs,
  cleanupGame,
  reloadGame,
  getGameService
} = useGameInitializer(player, addBattleLog)
const loadingProgressText = computed(() => `${Math.round(loadingProgress.value)}%`)
const currentLoadItemText = computed(() => {
  if (currentLoadItem.value) {
    return `正在加载：${currentLoadItem.value}`
  }
  return '正在准备资源...'
})

watch(
  () => Number(player.value?.level),
  (nextLevel, prevLevel) => {
    if (!Number.isFinite(prevLevel) || !Number.isFinite(nextLevel)) {
      return
    }
    if (!isInitialized.value) {
      return
    }
    if (nextLevel <= prevLevel) {
      return
    }

    try {
      const audioService = gameInitializerManager.value?.services?.audio
      if (audioService && typeof audioService.playMusicSFX === 'function') {
        audioService.playMusicSFX('shengji.mp3')
        return
      }

      const rawSettings = localStorage.getItem('userSettings')
      const settings = rawSettings ? JSON.parse(rawSettings) : {}
      const masterCandidate = Number(settings.volume ?? settings.master ?? 1.0)
      const sfxCandidate = Number(settings.sfx ?? settings.sfxVolume ?? 1.0)
      const master = Number.isFinite(masterCandidate) ? Math.max(0, Math.min(1, masterCandidate)) : 1.0
      const sfx = Number.isFinite(sfxCandidate) ? Math.max(0, Math.min(1, sfxCandidate)) : 1.0

      const audio = new Audio('/music/shengji.mp3')
      audio.volume = master * sfx
      audio.play().catch(error => {
        console.warn('升级音效播放失败:', error)
      })
    } catch (error) {
      console.error('升级音效处理失败:', error)
    }
  }
)

const {
  userSettings,
  showSettingsModal: showSettingsModalFromSettings,
  openSettingsModal: openSettingsModalFromSettings,
  closeSettingsModal: closeSettingsModalFromSettings,
  loadSettings: loadSettingsFromSettings,
  saveSettings,
  updateVolume,
  applyUserSettings,
  saveUserSettings,
  getCurrentSettings,
  getDefaultSettings,
  resetToDefault,
  setAutoSaveInterval,
  setAutoRecoveryPercent
} = useSettings(gameInitializerManager)
// 重新赋值loadSettings
loadSettings = loadSettingsFromSettings

watch(
  () => userSettings.value?.showDamageEffect,
  nextVal => {
    if (uiFunctions && typeof uiFunctions.setDamageEffectEnabled === 'function') {
      uiFunctions.setDamageEffectEnabled(nextVal !== false)
    }
  },
  { immediate: true }
)

watch(
  () => userSettings.value?.showExpAnimation,
  nextVal => {
    if (uiFunctions && typeof uiFunctions.setExpAnimationEnabled === 'function') {
      uiFunctions.setExpAnimationEnabled(nextVal !== false)
    }
  },
  { immediate: true }
)

// 战斗日志显示控制
const showBattleLog = computed(() => userSettings.value?.showBattleLog !== false)

const weatherCycleOrder = ['rain', 'snow', 'sunny']
const currentWeatherIndex = ref(0)
const showRainEffect = ref(true)
const showSnowEffect = ref(false)
const showSunnyEffect = ref(false)
let weatherCycleIntervalId = null
let lastWeather = null
const weatherMessageMap = {
  rain: '下雨了',
  snow: '下雪了',
  sunny: '现在是晴天'
}
const applyWeatherByIndex = index => {
  const weather = weatherCycleOrder[index] || weatherCycleOrder[0]
  showRainEffect.value = weather === 'rain'
  showSnowEffect.value = weather === 'snow'
  showSunnyEffect.value = weather === 'sunny'
  if (weather !== lastWeather && userSettings.value?.showWeatherEffect !== false) {
    const message = weatherMessageMap[weather] || '天气变化了'
    addBattleLog(message)
  }
  lastWeather = weather
}
const startWeatherCycle = () => {
  applyWeatherByIndex(currentWeatherIndex.value)
  if (weatherCycleIntervalId) {
    clearInterval(weatherCycleIntervalId)
  }
  weatherCycleIntervalId = setInterval(() => {
    currentWeatherIndex.value = (currentWeatherIndex.value + 1) % weatherCycleOrder.length
    applyWeatherByIndex(currentWeatherIndex.value)
  }, 60 * 60 * 1000)
}

// 掉落动画相关
// 监控活动掉落动画
const activeDropAnimations = ref([])
const monsterPositionCache = new Map()
const monsterIndexByIdCache = new Map()
const dropItemFlowMeta = new Map()
const awardedDropAnimationIds = new Set()
const fastDropAnimationThreshold = 6

// 物品掉落光柱特效相关
// 掉落物内容框尺寸（与 DropAnimation.vue 的 .drop-content 一致，80×80px）
const DROP_CONTENT_SIZE = 80
// 掉落物图片在内容框中的顶部偏移（图片 20px + margin-bottom 8px + 文本 ~20px，
// flex 垂直居中后图片顶部距内容框顶部约 17px）
const BEAM_IMAGE_TOP_OFFSET = 17
// 散开方向向量表（与 DropAnimation.vue computeAnimationParams 中的 directions 完全一致）
const SCATTER_DIRECTIONS = Object.freeze([
  Object.freeze({ x: 0, y: -1 }), // 上
  Object.freeze({ x: 0, y: 1 }), // 下
  Object.freeze({ x: -1, y: 0 }), // 左
  Object.freeze({ x: 1, y: 0 }), // 右
  Object.freeze({ x: -0.707, y: -0.707 }), // 左上
  Object.freeze({ x: 0.707, y: -0.707 }), // 右上
  Object.freeze({ x: -0.707, y: 0.707 }), // 左下
  Object.freeze({ x: 0.707, y: 0.707 }) // 右下
])
// 触发光柱的品级键名集合（稀有/传说/史诗）
const beamEffectRankKeys = new Set(['rare', 'veryrare', 'legendary', 'unique', 'epic'])
// 中文品级标签到品级键名的映射
const beamEffectRankLabels = new Map([
  ['稀有', 'rare'],
  ['传说', 'veryrare'],
  ['史诗', 'unique']
])
// 活动光柱特效列表
const activeBeamEffects = ref([])
// 光柱特效同时显示上限，超出则不再新增（避免性能问题）
const beamEffectMaxConcurrent = 8
// 光柱特效组件实例引用Map（key为beamId，value为组件实例），供外部调用 destroyBeam
const beamEffectRefsMap = ref({})
// 掉落动画ID → 光柱特效ID 的映射，用于拾取时销毁对应光柱
const dropAnimationBeamMap = new Map()

/**
 * 设置/清理光柱特效组件的ref引用
 * @param {string} beamId - 光柱特效ID
 * @param {object|null} el - 组件实例，v-for卸载时为null
 */
const setBeamEffectRef = (beamId, el) => {
  if (el) {
    beamEffectRefsMap.value[beamId] = el
  } else {
    delete beamEffectRefsMap.value[beamId]
  }
}

/**
 * 判定物品品级是否触发光柱特效，返回对应的品级键名
 * 兼容 rarity / rarityName / quality / grade / rank / levelName 等字段
 * @param {Object} item - 物品对象
 * @returns {string|null} 品级键名（如 'rare'），不满足条件返回 null
 */
const getItemBeamRank = item => {
  if (!item) {
    return null
  }

  const rawRank =
    item?.rarity ??
    item?.rarityName ??
    item?.quality ??
    item?.grade ??
    item?.rank ??
    item?.levelName ??
    ''

  if (typeof rawRank !== 'string') {
    return null
  }

  const trimmed = rawRank.trim()
  if (!trimmed) {
    return null
  }

  // 优先匹配中文标签
  if (beamEffectRankLabels.has(trimmed)) {
    return beamEffectRankLabels.get(trimmed)
  }

  // 再匹配英文键名（忽略大小写）
  const lower = trimmed.toLowerCase()
  if (beamEffectRankKeys.has(lower)) {
    return lower
  }

  return null
}

/**
 * 计算掉落物散开偏移量（复现 DropAnimation.vue 的 computeAnimationParams 逻辑）
 * 使用动画 ID 作为种子确定散开方向，确保光柱位置与物品最终位置一致
 * @param {string} animationId - 掉落动画ID（与 DropAnimation 的 props.id 一致）
 * @param {number} monsterWidth - 怪物宽度
 * @param {number} monsterHeight - 怪物高度
 * @returns {{x: number, y: number}} 散开偏移量（像素）
 */
const computeScatterOffset = (animationId, monsterWidth, monsterHeight) => {
  const seed = String(animationId)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const width = Number(monsterWidth) || 80
  const height = Number(monsterHeight) || 80
  // 散开距离计算（与 DropAnimation 一致：物品非金币，取 min(80, maxDistance)）
  const maxDistance = Math.min(width, height) / 2 - 10
  const distance = Math.min(80, Math.max(0, maxDistance))
  const direction = SCATTER_DIRECTIONS[seed % 8]
  return { x: direction.x * distance, y: direction.y * distance }
}

/**
 * 创建物品掉落光柱特效
 * 在掉落物品图片的顶部居中外侧位置生成对应品级颜色的光柱动画，光柱向上发射。
 * 位置计算：怪物中心（内容框左上角）+ 散开偏移 + 内容框水平中心 + 图片顶部偏移，
 * 确保光柱基点精确位于物品图片上方居中。
 * @param {{x: number, y: number}} position - 光柱基点屏幕坐标（已包含散开偏移和图片偏移）
 * @param {string} rankKey - 品级键名（如 'rare'、'veryrare'、'unique'）
 * @returns {string|null} 光柱特效ID，创建失败返回 null
 */
const createBeamEffect = (position, rankKey) => {
  try {
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      return null
    }

    // 超过并发上限则不再新增光柱，避免性能问题
    if (activeBeamEffects.value.length >= beamEffectMaxConcurrent) {
      return null
    }

    const beamId = generateUniqueId()
    activeBeamEffects.value.push({
      id: beamId,
      position: { x: position.x, y: position.y },
      rank: rankKey
    })
    return beamId
  } catch (error) {
    console.error('[Main] 创建光柱特效失败:', error)
    return null
  }
}

/**
 * 光柱特效完成回调，从活动列表中移除
 * @param {string} beamId - 光柱特效ID
 */
const onBeamEffectComplete = beamId => {
  try {
    const index = activeBeamEffects.value.findIndex(beam => beam.id === beamId)
    if (index !== -1) {
      activeBeamEffects.value.splice(index, 1)
    }
    // 清理组件实例引用
    delete beamEffectRefsMap.value[beamId]
  } catch (error) {
    console.error('[Main] 移除光柱特效失败:', error)
  }
}

/** 掉落动画组件实例引用Map（key为animationId，value为组件实例），供捡宠直接调用triggerPetPickup */
const dropAnimationRefsMap = ref({})

/**
 * 设置/清理掉落动画组件的ref引用
 * @param {string} animationId - 动画ID
 * @param {object|null} el - 组件实例，v-for卸载时为null
 */
const setDropAnimationRef = (animationId, el) => {
  if (el) {
    dropAnimationRefsMap.value[animationId] = el
  } else {
    delete dropAnimationRefsMap.value[animationId]
  }
}

// 计算属性来监控数组长度
const dropAnimationCount = computed(() => {
  return activeDropAnimations.value.length
})

// 计算属性来监控v-for是否被触发
const vForTriggerCount = computed(() => {
  return activeDropAnimations.value.length
})

const rebuildMonsterIndexByIdCache = () => {
  try {
    monsterIndexByIdCache.clear()
    const list = monsters.value
    if (!Array.isArray(list) || list.length === 0) {
      return
    }
    for (let i = 0; i < list.length; i++) {
      const monster = list[i]
      const idCandidate = monster?.id
      const id = typeof idCandidate === 'number' ? idCandidate : Number(idCandidate)
      if (!Number.isFinite(id)) {
        continue
      }
      monsterIndexByIdCache.set(id, i)
    }
  } catch (error) {
    console.error('[Main] rebuildMonsterIndexByIdCache 失败:', error)
  }
}

watch(
  () => monstersStore.currentMonsters,
  () => {
    rebuildMonsterIndexByIdCache()
  },
  { immediate: true }
)

// 监控 gameData 的变化
// watch(
//   gameData,
//   newData => {

//   },
//   { deep: true, immediate: true }
// )

// 生成唯一ID的辅助函数
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// 获取怪物元素在屏幕上的位置
const getMonsterScreenPosition = monster => {
  try {
    const now = Date.now()
    const idCandidate = monster && monster.id ? (typeof monster.id === 'number' ? monster.id : Number(monster.id)) : NaN
    const cacheKey = Number.isFinite(idCandidate) ? idCandidate : monster?.id
    if (cacheKey !== undefined && cacheKey !== null) {
      const cachedPosition = monsterPositionCache.get(cacheKey)
      if (cachedPosition && now - cachedPosition.timestamp < 300) {
        return { x: cachedPosition.x, y: cachedPosition.y }
      }
    }

    // 首先检查传入的monster参数是否有效
    if (!monster || !monster.id) {
      // 返回一个合理的默认位置
      return {
        x: window.innerWidth * 0.6, // 右侧区域，怪物通常显示的位置
        y: window.innerHeight * 0.4
      }
    }

    // 检查monsters.value是否存在
    if (!monsters.value || !monsters.value || !Array.isArray(monsters.value)) {
      // 如果monsters不存在，使用传入的monster信息或默认位置
      if (monster.x && monster.y) {
        return { x: monster.x, y: monster.y }
      }
      // 返回一个合理的默认位置
      const defaultPos = {
        x: window.innerWidth * 0.6, // 右侧区域，怪物通常显示的位置
        y: window.innerHeight * 0.4
      }
      return defaultPos
    }

    // 尝试通过怪物ID查找对应的DOM元素
    const monsterIndex = Number.isFinite(idCandidate)
      ? (monsterIndexByIdCache.get(idCandidate) ?? -1)
      : -1

    if (monsterIndex !== -1) {
      // 构建对应的DOM元素选择器
      const elementId = `enemy-container-${monsterIndex}`

      const monsterElement = document.getElementById(elementId)

      if (monsterElement) {
        const rect = monsterElement.getBoundingClientRect()

        // 返回元素中心点的屏幕坐标
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
        monsterPositionCache.set(cacheKey, {
          x: position.x,
          y: position.y,
          timestamp: now
        })
        return position
      } else {
        // 如果DOM元素未找到，使用基于索引的估算位置
        // MonsterInfoPanel中的怪物通常排列在右侧
        const baseX = window.innerWidth * 0.6 // 右侧区域
        const baseY = 150 // 顶部区域
        const spacingY = 80 // 垂直间距

        // 根据怪物索引计算大概位置
        const estimatedPosition = {
          x: baseX,
          y: baseY + (monsterIndex % 5) * spacingY // 假设最多显示5个怪物
        }
        monsterPositionCache.set(cacheKey, {
          x: estimatedPosition.x,
          y: estimatedPosition.y,
          timestamp: now
        })
        return estimatedPosition
      }
    } else {
      // 如果怪物不在当前数组中，但有坐标信息，则使用这些坐标
      if (monster.x && monster.y) {
        monsterPositionCache.set(cacheKey, {
          x: monster.x,
          y: monster.y,
          timestamp: now
        })
        return { x: monster.x, y: monster.y }
      }

      // 否则使用一个默认的合理位置
      const defaultPosition = {
        x: window.innerWidth * 0.6, // 右侧区域
        y: window.innerHeight * 0.4
      }
      monsterPositionCache.set(cacheKey, {
        x: defaultPosition.x,
        y: defaultPosition.y,
        timestamp: now
      })
      return defaultPosition
    }
  } catch (error) {
    // 出错时返回默认位置
    const fallbackPosition = {
      x: window.innerWidth * 0.6,
      y: window.innerHeight * 0.4
    }
    return fallbackPosition
  }
}

const {
  quests,
  questService,
  loadQuests,
  handleQuestAccepted,
  handleQuestCompleted,
  handleQuestRemoved,
  initQuestService
} = useQuestManager(gameInitializerManager, player)
// 使用新的模块化结构
const autoBattleService = ref(null)
const autoBattleComponentRef = ref(null)
const { savePlayerData } = useEventHandler(
  player,
  itemsStore,
  gameInitializerManager,
  addBattleLog,
  addItemToBag,
  removeItemFromBag,
  currentMap,
  storageService,
  store
)

const autoBattleUIHandlers = useAutoBattleUIHandlers({
  mainLayoutRef,
  gameInitializerManager,
  player,
  monsters,
  showDamageNumber,
  addBattleLog
})
const handleAutoBattleAttack = autoBattleUIHandlers.handleAutoBattleAttack
const handleAutoBattleSkillUse = autoBattleUIHandlers.handleAutoBattleSkillUse

const {
  isPlayerDead,
  playerDeathCountdown,
  handlePlayerDeathInAutoBattle,
  onPlayerDeathCountdownFinished
} = useAutoBattlePlayerDeathFlow({
  player,
  currentMap,
  autoBattleComponentRef,
  getAudioService: () => gameInitializerManager.value?.services?.audio,
  getUIService: () => gameInitializerManager.value?.services?.ui,
  addBattleLog,
  savePlayerData,
  getShouldResumeAutoBattle: () => Boolean(autoBattle.value),
  getStopAutoBattle: () => stopAutoBattle,
  getStartAutoBattle: () => startAutoBattle
})

// 使用统一的自动战斗composable
const {
  isActive,
  isPaused,
  isRunning,
  isInCountdownPeriod,
  allMonstersDefeated,
  autoBattle,
  autoBattleService: autoBattleServiceRef,
  startAutoBattle,
  stopAutoBattle,
  toggleAutoBattle,
  updateConfig,
  showCountdown,
  refreshMonstersAndMaybeResume,
  onCountdownFinished: onAutoBattleCountdownFinished
} = useAutoBattleUnified({
  player,
  monsters,
  skills,
  itemsStore,
  skillService,
  getAudioService: () => gameInitializerManager?.value?.services?.audio,
  currentMap,
  userSettings,
  addBattleLog,
  onAttack: payload => {
    autoBattleUIHandlers.handleAutoBattleAttack(payload)
  },
  onSkillUse: skill => {
    autoBattleUIHandlers.handleAutoBattleSkillUse(skill)
  },
  onMonsterDefeated: payload => {
    const batch = Array.isArray(payload?.batch) ? payload.batch : null
    if (batch && batch.length > 0) {
      const indices = []
      for (let i = 0; i < batch.length; i += 1) {
        const entry = batch[i]
        const targetIndexRaw = entry?.targetIndex
        const targetIndex =
          typeof targetIndexRaw === 'number' ? targetIndexRaw : Number(targetIndexRaw)
        if (Number.isInteger(targetIndex) && targetIndex >= 0) {
          indices.push(targetIndex)
        }
      }

      if (indices.length > 0 && typeof monstersStore.markDefeated === 'function') {
        for (let i = 0; i < indices.length; i += 1) {
          pendingMonsterDefeatedIndices.push(indices[i])
        }
        schedulePendingMonsterDefeatedIndicesFlush()
      }

      handleMonstersDefeatedInAutoBattleBatch({ batch }).catch(error => {
        console.error('Main', '自动战斗怪物死亡批量处理失败:', error)
        addBattleLog('掉落结算失败，请稍后重试', 'error')
      })
      return
    }

    const targetIndexRaw = payload?.targetIndex
    const targetIndex =
      typeof targetIndexRaw === 'number' ? targetIndexRaw : Number(targetIndexRaw)
    const monster = payload?.monster
    if (
      Number.isInteger(targetIndex) &&
      targetIndex >= 0 &&
      typeof monstersStore.markDefeated === 'function'
    ) {
      pendingMonsterDefeatedIndices.push(targetIndex)
      schedulePendingMonsterDefeatedIndicesFlush()
    }
    handleMonsterDefeatedInAutoBattle({ monster, targetIndex }).catch(error => {
      console.error('Main', '自动战斗怪物死亡处理失败:', error)
      addBattleLog('掉落结算失败，请稍后重试', 'error')
    })
  },
  onPlayerDeath: () => {
    handlePlayerDeathInAutoBattle()
  },
  onAllMonstersDefeated: () => {
    // 只设置标志，让队列处理完成后刷新
    // 队列处理完成后会检查这个标志并调用 flushWaveSettlement
    waveSettlementPendingFlush = true
  },
  onRefreshMonsters: () => {
    // 刷新逻辑由 useAutoBattleUnified 统一编排
  },
  onMonsterAttack: monsterIndex => {
    autoBattleUIHandlers.handleAutoBattleMonsterAttack(monsterIndex)
  },
  onPlayerDamage: data => {
    handlePlayerDamage(data)
  },
  onPlayerHeal: data => {
    // 显示吸血恢复动画
    if (data && data.amount > 0 && showDamageNumber) {
      showDamageNumber(-1, data.amount, false, true) // -1 表示玩家位置，true 表示治疗动画
    }
  }
})

// 同步autoBattleService引用
watch(autoBattleServiceRef, newService => {
  autoBattleService.value = newService
})

autoBattleUIHandlers.provideAutoBattleBindings({
  start: startAutoBattle,
  stop: stopAutoBattle,
  toggle: toggleAutoBattle,
  updateConfig
})

// UI状态管理 - 需要在 openRenamePanelWithItem 之前定义
const {
  modalStates,
  openModal,
  closeModal,
  toggleModal,
  openBagModal,
  closeBagModal,
  toggleBagModal,
  openQuestPanel,
  closeQuestPanel,
  toggleQuestPanel,
  openNPCQuestPanel,
  closeNPCQuestPanel,
  openPetTrainerModal,
  closePetTrainerModal,
  openPlayerDetailModal,
  closePlayerDetailModal,
  togglePlayerDetailModal,
  openMapModal,
  closeMapModal,
  toggleMapModal,
  openFunctionPanel,
  closeFunctionPanel,
  toggleFunctionPanel,
  openSettingsModal,
  closeSettingsModal,
  openEnhancePanel: openEnhancePanelFromUIStateManager,
  closeEnhancePanel,
  openPerforationPanel: openPerforationPanelFromUIStateManager,
  closePerforationPanel,
  openCardPanel: openCardPanelFromUIStateManager,
  closeCardPanel,
  openJobChangeModal,
  closeJobChangeModal,
  openRenamePanel,
  closeRenamePanel,
  openElementChangePanel,
  closeElementChangePanel,
  openStoneSelectPanel,
  closeStoneSelectPanel,
  openGenderSelectPanel,
  closeGenderSelectPanel,
  openStorageModal,
  closeStorageModal,
  openTowerModal,
  closeTowerModal: closeTowerModalFromUIStateManager,
  setShopModalData,
  getShopModalData,
  cleanupAllModals,
openJewelryMasterModal,
closeJewelryMasterModal,
openHuaFuShopModal,
closeHuaFuShopModal,
openDatabaseQueryModal,
closeDatabaseQueryModal,
  openBuffTimerPanel,
  closeBuffTimerPanel,
  toggleBuffTimerPanel,
  openSkillPanel,
  closeSkillPanel,
  toggleSkillPanel,
  openAchievementPanel,
  closeAchievementPanel,
  toggleAchievementPanel,
openSettingsPortalPanel,
closeSettingsPortalPanel,
openResetWeaponAttributeModal,
  closeResetWeaponAttributeModal,
  openResetUltimateWeaponBonusModal,
  closeResetUltimateWeaponBonusModal,
  openWeaponAwakeningModal,
  closeWeaponAwakeningModal,
  openBlessingAwakeningModal,
  closeBlessingAwakeningModal,
  openDialogue,
  closeDialogue,
  dialogueData
} = useUIStateManager()

// 成就面板打开时刷新击杀队列，确保面板显示最新进度
watch(
  () => modalStates.achievementPanel,
  (visible) => {
    if (visible) {
      flushAchievementKills()
    }
  }
)

// ========== BUFF计时面板移除处理 ==========
/**
 * 处理BuffTimerPanel中移除BUFF的请求
 * 支持移除道具BUFF和技能BUFF
 * 从玩家activeBuffs中移除指定BUFF，重新计算属性并持久化
 * @param {Object} payload - 包含buff对象的事件载荷
 * @param {Object} payload.buff - 待移除的BUFF对象
 */
const handleBuffTimerRemoveBuff = (payload) => {
  try {
    const { buff } = payload || {}
    if (!buff) return

    const buffs = player.value?.activeBuffs
    if (!Array.isArray(buffs) || buffs.length === 0) return

    // 获取匹配条件（支持多种BUFF类型的标识）
    const targetId = buff.id
    const targetKey = buff.key
    const targetSkillId = buff.skillId
    const targetSkillKey = buff.skillKey
    const targetName = buff.name

    // 查找目标BUFF索引（支持多种匹配方式）
    const index = buffs.findIndex(b => {
      // 优先通过 id 匹配
      if (targetId && b.id === targetId) return true
      // 通过 key 匹配
      if (targetKey && b.key === targetKey) return true
      // 通过 skillId 匹配（技能BUFF）
      if (targetSkillId && b.skillId === targetSkillId) return true
      // 通过 skillKey 匹配（技能BUFF）
      if (targetSkillKey && b.skillKey === targetSkillKey) return true
      // 通过 name 匹配（作为最后的备选方案）
      if (targetName && b.name === targetName) return true
      return false
    })

    if (index === -1) return

    // 获取BUFF名称用于日志输出
    const buffName = typeof buff.name === 'string'
      ? buff.name
      : buff.name?.cns || buff.name?.en || `效果#${buff.id || '?'}`

    // 替换整个数组以触发响应式更新（activeBuffs使用markRaw，需替换引用）
    // 使用与 findIndex 相同的匹配条件
    player.value.activeBuffs = buffs.filter(b => {
      if (targetId && b.id === targetId) return false
      if (targetKey && b.key === targetKey) return false
      if (targetSkillId && b.skillId === targetSkillId) return false
      if (targetSkillKey && b.skillKey === targetSkillKey) return false
      if (targetName && b.name === targetName) return false
      return true
    })

    // 神鹰降临特殊处理：移除Buff时同步清理神鹰视觉效果和攻击定时器
    // 仅当移除的是神鹰召唤技能Buff时才触发消散
    const isEagleSummonBuff =
      buff.skillId === 'fierce_shooter_r' ||
      buff.name === '神鹰降临'
    if (isEagleSummonBuff) {
      SkillEffectService.disperseActiveEagle()
    }

    // 清除BUFF duration缓存（仅对有 id 的BUFF有效）
    if (targetId) {
      clearBuffDuration(targetId)
    }

    // 重新计算玩家属性（applyFinalStats会遍历activeBuffs，移除的BUFF效果自动排除）
    updatePlayerAttributes()

    // 持久化到localStorage
    storageService.savePlayerData(player.value)

    // 触发buffVersion更新，通知BuffDisplay等组件刷新
    store.buffVersion++

    addBattleLog(`${buffName} 效果已移除`, 'info')
  } catch (error) {
    console.error('[Main] 移除BUFF失败:', error)
  }
}

// ========== 神鹰召回处理 ==========
/**
 * 处理神鹰召回事件（由 EagleSummonEffect 组件点击"召回"按钮触发）
 * 移除神鹰降临Buff、清理攻击定时器、派发消散动画事件
 */
const handleEagleRecall = () => {
  try {
    const buffs = player.value?.activeBuffs
    if (!Array.isArray(buffs) || buffs.length === 0) {
      // 没有活跃Buff，直接消散神鹰视觉效果
      SkillEffectService.disperseActiveEagle()
      return
    }

    // 查找神鹰降临Buff（通过 skillId 或 name 匹配）
    const eagleBuff = buffs.find(b =>
      b && (b.skillId === 'fierce_shooter_r' || b.name === '神鹰降临')
    )

    if (eagleBuff) {
      // 移除神鹰Buff
      player.value.activeBuffs = buffs.filter(b =>
        !(b && (b.skillId === 'fierce_shooter_r' || b.name === '神鹰降临'))
      )

      // 清除Buff duration缓存
      if (eagleBuff.id) {
        clearBuffDuration(eagleBuff.id)
      }

      // 重新计算玩家属性
      updatePlayerAttributes()

      // 持久化到localStorage
      storageService.savePlayerData(player.value)

      // 触发buffVersion更新
      store.buffVersion++

      addBattleLog('神鹰已被召回', 'info')
    }

    // 清理神鹰攻击定时器并派发消散事件（触发消散动画）
    SkillEffectService.disperseActiveEagle()
  } catch (error) {
    console.error('[Main] 神鹰召回失败:', error)
  }
}

// ========== 对话系统处理函数 ==========
/**
 * 处理NPCContainer触发的对话事件
 * @param {Object} params - 对话参数 { npcId, npcConfig, player, mapLevelRange, shopType }
 */
const handleOpenDialogue = (params) => {
  openDialogue(params)
}

/**
 * 对话系统中接受任务
 * @param {Object} quest - 任务对象
 */
const handleDialogueQuestAccepted = (quest) => {
  handleQuestAccepted(quest)
}

/**
 * 对话系统中完成任务
 * @param {Object} quest - 任务对象
 */
const handleDialogueQuestCompleted = (quest) => {
  handleQuestCompleted(quest)
}

/**
 * 对话系统中打开商店
 * @param {string} shopType - 商店类型
 */
const handleDialogueOpenShop = (shopType) => {
  switch (shopType) {
    case 'blacksmith':
      openBlacksmithModalFromShop()
      break
    case 'armor':
      openArmorShopModalFromShop()
      break
    case 'food':
      openFoodShopModalFromShop()
      break
    case 'magic':
      openMagicShopModalFromShop()
      break
    case 'storage':
      openStorageModal()
      break
    case 'job-change':
      openJobChangeModal()
      break
    case 'pet-trainer':
      openPetTrainerModal()
      break
    case 'tower':
      openTowerModal()
      break
    case 'jewelry-master':
      openJewelryMasterModal()
      break
    case 'diamond-shop':
      openShopModal()
      break
    case 'huafu-shop':
      openHuaFuShopModal()
      break
    default:
      console.warn('[Dialogue] 未知商店类型:', shopType)
  }
}

/** 对话系统中查看任务列表 */
const handleDialogueViewQuests = () => {
  openNPCQuestPanel()
}

/**
 * 在新标签页打开数据更新器页面（ApiUpdater）
 * 从设置功能入口面板点击"更新数据"后触发
 */
const handleOpenDataUpdater = () => {
  closeSettingsPortalPanel()
  window.open('/data-updater', '_blank')
}

// 键盘快捷键管理
useKeyboardShortcuts({
  toggleBagModal,
  toggleQuestPanel,
  toggleMapModal,
  togglePlayerDetailModal,
  toggleFunctionPanel,
  toggleBuffTimerPanel,
  toggleSkillPanel,
  toggleAchievementPanel
})

// 改名面板相关
let renameScrollItem = null

const openRenamePanelWithItem = (item, itemConfig) => {
  // 保存完整的物品信息，包括 uniqueId 用于精确移除
  renameScrollItem = item
  openRenamePanel()
}

// 属性更改面板相关
let elementChangeScrollItem = null

const openElementChangePanelWithItem = (item, itemConfig) => {
  console.log('[Main] openElementChangePanelWithItem 被调用, item:', item)
  // 保存完整的物品信息，包括 uniqueId 用于精确移除
  elementChangeScrollItem = item
  console.log('[Main] 调用 openElementChangePanel()')
  openElementChangePanel()
  console.log('[Main] openElementChangePanel() 调用完成, modalStates.elementChangePanel:', modalStates.elementChangePanel)
}

// 属性点重置卷相关
let statResetScrollItem = null

// 属性攻击魔法石箱相关
let stoneSelectItem = null

// selectbox类型套装礼盒性别选择相关
let genderSelectItem = null
const genderSelectData = ref({
  boxItemId: 0,
  boxItemName: '',
  boxDescription: '',
  contents: []
})

/**
 * 打开性别选择面板（用于selectbox类型套装礼盒）
 * @param {Object} item - 礼盒物品实例
 * @param {Object} itemConfig - 礼盒物品配置
 * @param {Array} contents - 礼盒内容列表
 */
const openGenderSelectPanelWithItem = (item, itemConfig, contents) => {
  // 保存礼盒物品实例，用于后续移除
  genderSelectItem = item
  // 设置面板数据
  const name = itemConfig?.name?.cns || itemConfig?.name?.en || '套装礼盒'
  const desc = itemConfig?.description?.cns || itemConfig?.description?.en || '请选择你想要的性别套装'
  genderSelectData.value = {
    boxItemId: Number(item?.id) || 0,
    boxItemName: name,
    boxDescription: desc,
    contents: contents || []
  }
  openGenderSelectPanel()
}

/**
 * 打开石头选择面板
 * @param {Object} item - 物品数据
 * @param {Object} itemConfig - 物品配置
 */
const openStoneSelectPanelWithItem = (item, itemConfig) => {
  console.log('[Main] openStoneSelectPanelWithItem 被调用, item:', item)
  // 保存完整的物品信息，包括 uniqueId 用于精确移除
  stoneSelectItem = item
  openStoneSelectPanel()
  console.log('[Main] openStoneSelectPanel() 调用完成, modalStates.stoneSelectPanel:', modalStates.stoneSelectPanel)
}

/**
 * 处理属性点重置
 * @param {Object} item - 物品数据
 * @param {Object} itemConfig - 物品配置
 */
const handleStatReset = (item, itemConfig) => {
  console.log('[Main] handleStatReset 被调用, item:', item)
  // 保存完整的物品信息，包括 uniqueId 用于精确移除
  statResetScrollItem = item

  if (!player.value) {
    addBattleLog('无法获取玩家数据', 'error')
    return
  }

  try {
    const playerLevel = player.value.level || 1
    const currentStats = player.value.stats
    console.log('[Main] handleStatReset - playerLevel:', playerLevel, 'currentStats:', currentStats)

    // 等级限制：必须 > 15级才能使用
    if (playerLevel <= 15) {
      addBattleLog('等级>15级才能使用属性点重置卷', 'error')
      // 返还物品，不移除
      statResetScrollItem = null
      return
    }

    if (!currentStats) {
      addBattleLog('无法获取属性数据', 'error')
      return
    }

    // 计算已分配的属性点（基础值为15）
    const statKeys = ['strength', 'agility', 'intelligence', 'constitution']
    const baselineStatValue = 15

    let allocatedPoints = 0
    statKeys.forEach(key => {
      const currentValue = currentStats[key] || baselineStatValue
      allocatedPoints += Math.max(0, currentValue - baselineStatValue)
    })

    console.log('[Main] handleStatReset - allocatedPoints:', allocatedPoints)

    // 如果没有已分配的属性点，提示用户
    if (allocatedPoints <= 0) {
      addBattleLog('您没有已分配的属性点，无需重置', 'info')
      // 返还物品，不移除
      statResetScrollItem = null
      return
    }

    // 计算新的自由属性点：等级 * 2
    const newFreePoints = playerLevel * 2

    // 创建新的stats对象，所有属性重置为15
    const newStats = {
      strength: baselineStatValue,
      agility: baselineStatValue,
      intelligence: baselineStatValue,
      constitution: baselineStatValue,
      freePoints: newFreePoints
    }

    console.log('[Main] handleStatReset - newStats:', newStats)

    // 使用 gameStore 更新玩家数据
    store.updatePlayer({
      stats: newStats
    })
    console.log('[Main] handleStatReset - store.updatePlayer 调用完成')

    // 更新originalStats
    if (player.value.originalStats) {
      player.value.originalStats = {
        strength: baselineStatValue,
        agility: baselineStatValue,
        intelligence: baselineStatValue,
        constitution: baselineStatValue
      }
    }

    // 保存到存档
    const storageService = storageServiceSingleton
    storageService.savePlayerData(player.value)

    // 移除消耗品属性点重置卷
    if (statResetScrollItem) {
      itemsStore.removeItemFromBag(statResetScrollItem.id, 1)
      statResetScrollItem = null
    }

    // 战斗日志提示
    addBattleLog(`属性点已重置，获得 ${newFreePoints} 点自由属性点`)

    // 战斗日志动画
    showAnimationMessage(
      `属性点重置成功，获得 ${newFreePoints} 点自由属性点`,
      'use',
      '/pt/item_icon/1099.png'
    )

    // 播放升级音效
    if (gameInitializerManager.value && gameInitializerManager.value.services?.audio) {
      gameInitializerManager.value.services.audio.playLevelUpSFX()
    }

    // 刷新背包 UI
    if (refreshBagModal && typeof refreshBagModal === 'function') {
      refreshBagModal()
    }

    // 更新玩家属性
    updatePlayerAttributes()

    console.log('[Main] handleStatReset 完成')

  } catch (error) {
    console.error('[Main] 属性点重置失败:', error)
    addBattleLog('属性点重置失败', 'error')
  }
}

// 使用物品管理器
 
// 立即注册回调函数
registerSpecialItemCallbacks({
  openRenamePanel: openRenamePanelWithItem,
  openElementChangePanel: openElementChangePanelWithItem,
  onStatReset: handleStatReset,
  onStoneSelect: openStoneSelectPanelWithItem,
  onGenderSelect: openGenderSelectPanelWithItem,
  onResetWeaponAttribute: openResetWeaponAttributeModal,
  onResetUltimateWeaponBonus: openResetUltimateWeaponBonusModal,
  onWeaponAwakening: openWeaponAwakeningModal,
  onBlessingAwakening: openBlessingAwakeningModal
})

const { useRecoveryItem, autoUseRecoveryItems, checkAndAutoUseRecoveryItems } = useItemManager(
  player,
  gameData,
  gameInitializerManager,
  removeItemFromBag,
  showDamageNumber,
  addBattleLog,
  showAnimationMessage
)
 

// 使用自动出售和恢复
const {
  startAutoSellAndRecovery,
  startAutoSellAndRecoveryWithCheck,
  stopAutoSellAndRecovery,
  restartAutoSellAndRecovery,
  checkAndSellItems
} = useAutoSellAndRecovery(
  player,
  userSettings,
  gameInitializerManager,
  addBattleLog,
  updatePlayerAttributes,
  useRecoveryItem,
  // 传入自动出售聚合回调
  (itemName, quantity, gold) => {
    addAutoSellToWaveSettlement(itemName, quantity, gold)
  }
)

// 处理玩家受到伤害
let lastHpSyncLogAt = 0
const handlePlayerDamage = data => {
  try {
 
    if (!data || typeof data !== 'object') {
      return
    }
    const { damage, monster, monsterIcon, isMiss, playerSnapshot, isDodge, isBlock, text } = data
 

    const resolvedDamage = Number.isFinite(damage) ? damage : 0
    const resolvedIsMiss = Boolean(isMiss)
    const resolvedIsDodge = Boolean(isDodge)
    const resolvedIsBlock = Boolean(isBlock)
    const resolvedText =
      typeof text === 'string' && text
        ? text
        : resolvedIsDodge
          ? '闪避'
          : resolvedIsBlock
            ? `${resolvedDamage}伤害(格挡)`
            : null

    const normalizedSnapshot =
      playerSnapshot && typeof playerSnapshot === 'object' ? playerSnapshot : null

    const beforeStats = store?.player
      ? {
        currentHealth: store.player.currentHealth,
        maxHealth: store.player.maxHealth,
        currentMana: store.player.currentMana,
        maxMana: store.player.maxMana
      }
      : null

    {
      const now = Date.now()
      const shouldLog = now - lastHpSyncLogAt >= 500
      if (shouldLog) {
        lastHpSyncLogAt = now
        const afterStats = store?.player
          ? {
            currentHealth: store.player.currentHealth,
            maxHealth: store.player.maxHealth,
            currentMana: store.player.currentMana,
            maxMana: store.player.maxMana
          }
          : null
         
      }
    }

    lastDamage.value = resolvedDamage
    triggerRef(lastDamage)

    // 处理受伤恢复效果（圣光庇护EX2：受伤后恢复最大生命值百分比）
    if (resolvedDamage > 0 && !resolvedIsMiss && !resolvedIsDodge) {
      try {
        const playerVal = player.value
        if (playerVal && store) {
          processDamageRecovery(playerVal, resolvedDamage, store)
        }
      } catch (e) {
        console.error('[Main.vue] 处理受伤恢复效果失败:', e)
      }
    }

    if (showDamageNumber) {
      showDamageNumber(
        -1,
        resolvedDamage,
        false,
        false,
        null,
        resolvedIsMiss,
        null,
        monsterIcon,
        false,
        resolvedText
      )
    }

    if (gameInitializerManager.value && gameInitializerManager.value.services.ui) {
      gameInitializerManager.value.services.ui.updateHealthBar(
        'playerHealthBar',
        normalizedSnapshot?.currentHealth ?? store?.player?.currentHealth ?? 0,
        normalizedSnapshot?.maxHealth ?? store?.player?.maxHealth ?? 0
      )
    }

    setTimeout(() => {
      lastDamage.value = 0
      triggerRef(lastDamage)
    }, 1000)
  } catch (error) {
    console.error('[Main.vue] handlePlayerDamage 处理失败:', error)
    if (typeof addBattleLog === 'function') {
      addBattleLog('玩家受击动画或血条更新失败，请稍后重试', 'error')
    }
  }
}

// 处理设置保存事件
const handleSettingsSaved = () => {
  // 重新加载设置以确保使用最新的设置值
  loadSettingsFromSettings()

  // 重新启动自动出售和恢复，使用新的设置
  if (restartAutoSellAndRecovery && typeof restartAutoSellAndRecovery === 'function') {
    restartAutoSellAndRecovery()
    addBattleLog('自动出售和恢复已更新')
  }

  // 立即执行一次自动出售检查，避免需要等待定时器间隔
  if (checkAndSellItems && typeof checkAndSellItems === 'function') {
    // 使用 nextTick 确保设置已完全应用
    nextTick(() => {
      checkAndSellItems()
    })
  }
}

// 旧的动画完成处理函数已被删除，使用第428行的新版本

// 掉落动画批量创建缓冲区
// 在批量击杀结算时，先收集所有动画对象，最后一次性 push 到 activeDropAnimations，
// 避免每创建一个动画就触发一次 Vue 响应式更新
let _dropAnimationBatch = null

/**
 * 开始掉落动画批量模式：后续 createDropAnimation / createGoldDropAnimation 的 push 操作会缓冲到批次数组
 */
const beginDropAnimationBatch = () => {
  _dropAnimationBatch = []
}

/**
 * 刷新掉落动画批量：将缓冲的所有动画对象一次性 push 到 activeDropAnimations，只触发一次 Vue 响应式更新
 */
const flushDropAnimationBatch = () => {
  if (!_dropAnimationBatch || _dropAnimationBatch.length === 0) {
    _dropAnimationBatch = null
    return
  }
  const batch = _dropAnimationBatch
  _dropAnimationBatch = null
  // 一次性 push 所有动画，只触发一次 Vue 响应式更新
  activeDropAnimations.value.push(...batch)
}

// 创建物品掉落动画
const createDropAnimation = (monster, item, autoLoot = true) => {
  try {
    // 获取怪物元素的位置
    const monsterPosition = getMonsterScreenPosition(monster)
    const monsterPayload = {
      id: monster?.id,
      name: monster?.name || 'Unknown Monster',
      width: monster?.width || 80,
      height: monster?.height || 80,
      x: monsterPosition.x,
      y: monsterPosition.y
    }

    const animationId = generateUniqueId()
    const newAnimation = {
      id: animationId,
      monster: monsterPayload,
      item,
      goldAmount: 0,
      fastMode: activeDropAnimations.value.length >= fastDropAnimationThreshold,
      autoLoot
    }

    // 验证数据完整性
    if (!newAnimation.monster || !newAnimation.monster.id) {
      return null
    }

    // 批量模式：缓冲到批次数组，稍后一次性 push
    if (_dropAnimationBatch) {
      _dropAnimationBatch.push(newAnimation)
    } else {
      activeDropAnimations.value.push(newAnimation)
    }

    // 添加一个全局计数器来跟踪添加的动画
    if (typeof window !== 'undefined') {
      window.dropAnimationCount = (window.dropAnimationCount || 0) + 1
    }

    // 稀有/传说/史诗品级物品触发光柱特效
    const beamRankKey = getItemBeamRank(item)
    if (beamRankKey) {
      // 计算掉落物散开后的最终位置，使光柱精确定位到物品图片上方居中
      // 怪物中心 = 内容框左上角；散开偏移由动画ID种子决定（与 DropAnimation 一致）
      const scatter = computeScatterOffset(
        animationId,
        monsterPayload.width,
        monsterPayload.height
      )
      // 光柱基点 = 内容框左上角 + 散开偏移 + 水平居中 + 图片顶部偏移
      const beamPosition = {
        x: monsterPayload.x + scatter.x + DROP_CONTENT_SIZE / 2,
        y: monsterPayload.y + scatter.y + BEAM_IMAGE_TOP_OFFSET
      }
      const beamId = createBeamEffect(beamPosition, beamRankKey)
      // 建立 掉落动画ID → 光柱特效ID 的映射，拾取时据此销毁光柱
      if (beamId) {
        dropAnimationBeamMap.set(animationId, beamId)
      }
    }

    return animationId
  } catch (error) {}
  return null
}

// 创建金币掉落动画
const createGoldDropAnimation = (monster, goldAmount, autoLoot = true) => {
  // 获取怪物元素的位置
  const monsterPosition = getMonsterScreenPosition(monster)
  const monsterPayload = {
    id: monster?.id,
    name: monster?.name || 'Unknown Monster',
    width: monster?.width || 80,
    height: monster?.height || 80,
    x: monsterPosition.x,
    y: monsterPosition.y
  }

  const animationId = generateUniqueId()
  const newAnimation = {
    id: animationId,
    monster: monsterPayload,
    item: null,
    goldAmount,
    fastMode: activeDropAnimations.value.length >= fastDropAnimationThreshold,
    autoLoot
  }

  // 验证数据完整性
  if (!newAnimation.monster || !newAnimation.monster.id) {
    return
  }

  // 批量模式：缓冲到批次数组，稍后一次性 push
  if (_dropAnimationBatch) {
    _dropAnimationBatch.push(newAnimation)
  } else {
    activeDropAnimations.value.push(newAnimation)
  }

  // 添加一个全局计数器来跟踪添加的金币动画
  if (typeof window !== 'undefined') {
    window.goldAnimationCount = (window.goldAnimationCount || 0) + 1
  }
}

// onDropFlyComplete 已移除：拾取不再有位移动画，手动/捡宠拾取后直接入包

// 播放点击音效
const playClickSound = () => {
  try {
    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      const audioService = gameInitializerManager.value.services.audio
      if (typeof audioService.playClickSFX === 'function') {
        audioService.playClickSFX()
        return
      }
      audioService.playSFX('InfClick.wav')
    }
  } catch (error) {}
}

const playQuestCompleteSound = () => {
  try {
    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      const audioService = gameInitializerManager.value.services.audio
      if (typeof audioService.playQuestCompleteSFX === 'function') {
        audioService.playQuestCompleteSFX()
        return
      }
      if (typeof audioService.playMusicSFX === 'function') {
        audioService.playMusicSFX('BgmEvEnd.mp3')
        return
      }
      audioService.playSFX('quest_complete.mp3')
    }
  } catch (error) {}
}

/**
 * 检查物品是否为任务所需物品，并显示任务物品掉落提示
 * @param {number} itemId - 物品ID
 * @param {number} quantity - 物品数量
 */
const checkAndShowQuestItemDropTip = (itemId, quantity = 1) => {
  if (!questService.value || !itemId) {
    return
  }

  const activeQuests = questService.value.getActiveQuests?.() || []
  if (activeQuests.length === 0) {
    return
  }

  const gameDataValue = gameData.value

  for (const quest of activeQuests) {
    if (quest.endNeededItems && Array.isArray(quest.endNeededItems)) {
      const itemObjective = quest.endNeededItems.find(
        obj => obj.item === itemId || obj.item === Number(itemId)
      )

      if (itemObjective) {
        // 获取物品名称
        const itemData = gameDataValue?.items?.[itemId] || window.gameData?.items?.[itemId]
        const itemName = itemData?.name?.cns || itemData?.name?.en || `物品#${itemId}`

        // 获取玩家背包中该物品的当前数量
        const playerItemCount = player.value?.bag
          ? player.value.bag
            .filter(item => item && (item.id === itemId || item.id === Number(itemId)))
            .reduce((total, item) => {
              const raw = item.currentStack ?? item.quantity ?? 1
              const value = Number(raw)
              return total + (Number.isFinite(value) && value > 0 ? value : 1)
            }, 0)
          : 0

        const questName = quest.name?.cns || quest.name?.en || quest.id
        const required = itemObjective.count || 0
        const progressText = `[任务] ${questName}: 收集 ${itemName} ${playerItemCount}/${required}`

        // 添加战斗日志文字
        addBattleLog(progressText, 'quest')

        // 显示战斗日志动画
        showAnimationMessage(progressText, 'quest', '', '', '', '', '📦')
      }
    }
  }
}

const playUnequipSFX = () => {
  try {
    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      gameInitializerManager.value.services.audio.playSFX('InfInventoryDrop.wav')
    }
  } catch (error) {}
}

// 处理错误弹窗关闭
const handleErrorDismiss = () => {
  errorMessage.value = ''
  playClickSound()
  // 如果游戏未初始化成功（例如存档加载失败），点击确定后返回角色选择页面
  if (!isInitialized.value) {
    router.push('/select')
  }
}

// 将音效播放函数暴露到全局，供其他组件使用
if (typeof window !== 'undefined') {
  window.playClickSound = playClickSound
  window.playQuestCompleteSound = playQuestCompleteSound
  window.playUnequipSFX = playUnequipSFX
  window.addBattleLog = addBattleLog
  window.showAnimationMessage = showAnimationMessage
}

const onDropAnimationComplete = animationId => {
  try {
    // 从活动动画列表中移除完成的动画
    const index = activeDropAnimations.value.findIndex(anim => anim.id === animationId)
    if (index !== -1) {
      activeDropAnimations.value.splice(index, 1)
    }

    awardedDropAnimationIds.delete(animationId)
    dropItemFlowMeta.delete(animationId)

    // 清理组件实例引用
    delete dropAnimationRefsMap.value[animationId]

    // 销毁关联的光柱特效（物品被拾取或超时销毁时光柱一并消失）
    const beamId = dropAnimationBeamMap.get(animationId)
    if (beamId) {
      const beamEl = beamEffectRefsMap.value[beamId]
      if (beamEl && typeof beamEl.destroyBeam === 'function') {
        beamEl.destroyBeam()
      }
      dropAnimationBeamMap.delete(animationId)
    }

    // 增加渲染密钥以触发更新
    renderKey.value++
  } catch (error) {}
}

/**
 * 手动/捡宠拾取掉落物
 * 无论捡宠是否激活，玩家和捡宠都可以拾取掉落物
 * @param {string} animationId - 动画ID
 */
const onManualPickup = async animationId => {
  try {
    if (awardedDropAnimationIds.has(animationId)) {
      return
    }

    // 播放拾取音效
    setTimeout(() => {
      if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
        const audioService = gameInitializerManager.value.services.audio
        if (typeof audioService.playItemPickupSFX === 'function') {
          audioService.playItemPickupSFX()
        } else {
          audioService.playSFX('InfGroundPickup.wav')
        }
      }
    }, 250)

    const meta = dropItemFlowMeta.get(animationId)

    if (meta) {
      awardedDropAnimationIds.add(animationId)
      dropItemFlowMeta.delete(animationId)

      // 金币拾取：直接增加金币
      if (meta.itemId === 'gold') {
        const goldAmount = Number(meta.quantity) || 0
        if (goldAmount > 0) {
          player.value.gold += goldAmount
          currentWaveGold += goldAmount

          if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
            const audioService = gameInitializerManager.value.services.audio
            if (typeof audioService.playGoldSFX === 'function') {
              audioService.playGoldSFX()
            } else {
              audioService.playSFX('ItemDropDing1.wav')
            }
          }

          try {
            window.dispatchEvent(
              new CustomEvent('gold-update', {
                detail: {
                  gold: player.value.gold,
                  newGold: player.value.gold,
                  change: goldAmount
                }
              })
            )
          } catch (error) {}

          // 居中悬浮动画提示：玩家名称 获得金币x数量,总金币数量xxx
          showAnimationMessage(
            `获得金币x${goldAmount.toLocaleString()},总金币${player.value.gold.toLocaleString()}`,
            'reward',
            '/pt/UI/gold.png',
            '',
            '',
            '',
            `${player.value.nickname || '玩家'}`
          )
        }
        scheduleSavePlayerDataAfterMonsterDefeatSettlement()
        return
      }

      // 物品拾取：入包
      const result = await addItemToBagQueued(meta.itemId, meta.quantity)

      if (result) {
        // 累加到波次聚合器
        const itemId = Number(meta.itemId)
        const existing = currentWaveItems.get(itemId)
        if (existing) {
          existing.quantity += meta.quantity
        } else {
          currentWaveItems.set(itemId, {
            id: itemId,
            name: meta.rawName || `物品#${itemId}`,
            icon: meta.iconPath || `/pt/item_icon/${itemId}.png`,
            quantity: meta.quantity,
            itemData: null
          })
        }

        if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
          const audioService = gameInitializerManager.value.services.audio
          if (typeof audioService.playItemDropSFX === 'function') {
            audioService.playItemDropSFX()
          } else {
            audioService.playSFX('ItemDropDing1.wav')
          }
        }
        checkAndShowQuestItemDropTip(meta.itemId, meta.quantity)

        // 居中悬浮动画提示：玩家名称 获得 物品名称x数量
        const pickupItemName = meta.displayName || (typeof meta.rawName === 'object' ? meta.rawName?.cns : meta.rawName) || `物品#${meta.itemId}`
        showAnimationMessage(
          `获得 ${pickupItemName}x${meta.quantity}`,
          'reward',
          meta.iconPath || `/pt/item_icon/${meta.itemId}.png`,
          '',
          '',
          '',
          `${player.value.nickname || '玩家'}`
        )
      } else {
        addBattleLog('背包已满，物品无法获得', 'warning')
      }

      scheduleSavePlayerDataAfterMonsterDefeatSettlement()
      return
    }

    // 兼容：没有 meta 信息时，查找动画数据中的金币数量
    const animIndex = activeDropAnimations.value.findIndex(anim => anim.id === animationId)
    if (animIndex !== -1) {
      const animation = activeDropAnimations.value[animIndex]
      const goldAmount = animation?.goldAmount || 0

      if (goldAmount > 0) {
        awardedDropAnimationIds.add(animationId)
        // 手动拾取金币
        player.value.gold += goldAmount
        currentWaveGold += goldAmount

        try {
          window.dispatchEvent(
            new CustomEvent('gold-update', {
              detail: {
                gold: player.value.gold,
                newGold: player.value.gold,
                change: goldAmount
              }
            })
          )
        } catch (error) {}

        // 居中悬浮动画提示：玩家名称 获得金币x数量,总金币数量xxx
        showAnimationMessage(
          `获得金币x${goldAmount.toLocaleString()},总金币${player.value.gold.toLocaleString()}`,
          'reward',
          '/pt/UI/gold.png',
          '',
          '',
          '',
          `${player.value.nickname || '玩家'}`
        )

        scheduleSavePlayerDataAfterMonsterDefeatSettlement()
      }
    }
  } catch (error) {
    console.error('[Main] 手动拾取处理失败:', error)
  }
}

// 在自动战斗模式下处理怪物被击败的逻辑（只处理经验、金币和掉落，不替换怪物）
const monsterDefeatSettlementQueue = []
let monsterDefeatSettlementProcessing = false
let monsterDefeatSettlementScheduled = false
let monsterDefeatSettlementSaveTimer = null
let monsterDefeatSettlementIdleHandle = null
let monsterDefeatSettlementIdleType = null

// 波次结算聚合器 - 用于合并输出战斗日志，减少UI阻塞
const waveSettlementAggregator = new WaveSettlementAggregator()

// 当前波次的累积结算数据
let currentWaveExp = 0
let currentWaveGold = 0
let currentWaveItems = new Map() // itemId -> { name, icon, quantity, itemData }
let currentWaveAutoSoldItems = []
let currentWaveAutoSoldGold = 0
let currentWaveMonstersDefeated = 0
let isWaveSettlementActive = false
let waveSettlementPendingFlush = false // 标记波次结束后需要刷新结算

const monsterDefeatSettlementNextFrame = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

// ========== 波次结算聚合函数 ==========

/**
 * 开始新的波次结算（在第一只怪物被击败时调用）
 */
const startWaveSettlement = () => {
  // 注意：不再在这里检查 waveSettlementPendingFlush 并刷新
  // 因为这会导致在队列处理中途就刷新，导致统计不准确
  // flushWaveSettlement 应该只在队列处理完成后调用（在 processQueuedMonsterDefeatSettlements 的 finally 块中）

  if (isWaveSettlementActive) {
    return
  }
  isWaveSettlementActive = true
  currentWaveExp = 0
  currentWaveGold = 0
  currentWaveItems = new Map()
  currentWaveAutoSoldItems = []
  currentWaveAutoSoldGold = 0
  currentWaveMonstersDefeated = 0
}

/**
 * 累加波次结算数据
 * @param {Object} settlement - { exp, gold, items }
 */
const addToWaveSettlement = (settlement) => {
  if (!isWaveSettlementActive) {
    startWaveSettlement()
  }

  const exp = Number(settlement?.exp) || 0
  const gold = Number(settlement?.gold) || 0
  const items = Array.isArray(settlement?.items) ? settlement.items : []

  currentWaveExp += exp
  currentWaveGold += gold
  currentWaveMonstersDefeated++

  // 聚合物品
  for (const item of items) {
    if (!item || !item.id) {continue}
    const itemId = Number(item.id)
    const quantity = Number(item.currentStack ?? item.quantity ?? item.stack ?? 1) || 1
    const existing = currentWaveItems.get(itemId)
    if (existing) {
      existing.quantity += quantity
    } else {
      currentWaveItems.set(itemId, {
        id: itemId,
        name: item.name || `物品#${itemId}`,
        icon: item.icon || `/pt/item_icon/${itemId}.png`,
        quantity,
        itemData: item
      })
    }
  }
}

/**
 * 累加自动出售数据到波次结算
 * @param {string} itemName - 物品名称
 * @param {number} quantity - 出售数量
 * @param {number} gold - 获得金币
 */
const addAutoSellToWaveSettlement = (itemName, quantity, gold) => {
  // 如果不在波次结算期间，直接输出日志
  if (!isWaveSettlementActive) {
    addBattleLog(`自动出售 ${itemName} x${quantity}，获得金币 ${gold}`, 'sell')
    return
  }

  currentWaveAutoSoldItems.push({
    name: itemName,
    quantity: Number(quantity) || 1,
    gold: Number(gold) || 0
  })
  currentWaveAutoSoldGold += Number(gold) || 0
}

/**
 * 刷新波次结算（输出合并后的战斗日志）
 * 在 onAllMonstersDefeated 时调用
 */
const flushWaveSettlement = () => {
  if (!isWaveSettlementActive) {return}

  isWaveSettlementActive = false

  // 如果没有任何数据，直接返回
  if (currentWaveMonstersDefeated === 0 && currentWaveItems.size === 0 && currentWaveAutoSoldItems.length === 0) {
    return
  }

  // 输出合并后的经验日志
  if (currentWaveExp > 0) {
    const baseMaxExp = Number(player.value?.maxExp) || 0
    const expPercentageDisplay = baseMaxExp > 0 ? (currentWaveExp / baseMaxExp) * 100 : 0
    addBattleLog(
      `本波击杀 ${currentWaveMonstersDefeated} 只怪物，共获得 ${expPercentageDisplay.toFixed(4)}% 经验 (${currentWaveExp.toFixed(0)} 点经验值)`,
      'exp'
    )

    // 显示合并后的经验动画
    if (typeof showExpNumber === 'function') {
      showExpNumber(expPercentageDisplay.toFixed(4))
    }
  }

  // 输出合并后的金币日志
  const totalGold = currentWaveGold + currentWaveAutoSoldGold
  if (totalGold > 0) {
    const parts = []
    if (currentWaveGold > 0) {
      parts.push(`掉落 ${currentWaveGold} 金币`)
    }
    if (currentWaveAutoSoldGold > 0) {
      parts.push(`自动出售获得 ${currentWaveAutoSoldGold} 金币`)
    }
    addBattleLog(`本波共获得 ${totalGold} 金币（${parts.join('，')}）`, 'gold')
  }

  // 输出合并后的物品日志
  if (currentWaveItems.size > 0) {
    const itemsArray = Array.from(currentWaveItems.values())
    const previewCount = Math.min(3, itemsArray.length)
    const previewNames = itemsArray.slice(0, previewCount).map(item => `${item.name}x${item.quantity}`)
    const suffix = itemsArray.length > previewCount ? '…' : ''
    addBattleLog(`本波共获得 ${itemsArray.length} 种物品（${previewNames.join('，')}${suffix}）`, 'drop')
  }

  // 输出合并后的自动出售日志
  if (currentWaveAutoSoldItems.length > 0) {
    const totalCount = currentWaveAutoSoldItems.reduce((sum, item) => sum + item.quantity, 0)
    addBattleLog(`自动出售 ${currentWaveAutoSoldItems.length} 种物品共 ${totalCount} 个，获得 ${currentWaveAutoSoldGold} 金币`, 'sell')
  }

  // 重置数据
  currentWaveExp = 0
  currentWaveGold = 0
  currentWaveItems = new Map()
  currentWaveAutoSoldItems = []
  currentWaveAutoSoldGold = 0
  currentWaveMonstersDefeated = 0
}

// ========== 波次结算聚合函数结束 ==========

const cancelMonsterDefeatSettlementIdle = () => {
  if (!monsterDefeatSettlementIdleHandle) {
    return
  }

  try {
    clearTimeout(monsterDefeatSettlementIdleHandle)
  } catch (error) {
  } finally {
    monsterDefeatSettlementIdleHandle = null
    monsterDefeatSettlementIdleType = null
  }
}

const scheduleMonsterDefeatSettlementIdle = callback => {
  cancelMonsterDefeatSettlementIdle()

  if (typeof callback !== 'function') {
    return
  }

  // 使用 setTimeout 替代 requestIdleCallback，避免后台切换恢复时 Violation 阻塞主线程
  monsterDefeatSettlementIdleType = 'timeout'
  monsterDefeatSettlementIdleHandle = setTimeout(() => {
    try {
      callback()
    } catch (error) {}
  }, 0)
}

const scheduleSavePlayerDataAfterMonsterDefeatSettlement = () => {
  if (monsterDefeatSettlementSaveTimer) {
    clearTimeout(monsterDefeatSettlementSaveTimer)
    monsterDefeatSettlementSaveTimer = null
  }

  cancelMonsterDefeatSettlementIdle()

  monsterDefeatSettlementSaveTimer = setTimeout(() => {
    monsterDefeatSettlementSaveTimer = null
    scheduleMonsterDefeatSettlementIdle(() => {
      try {
        if (savePlayerData && typeof savePlayerData === 'function') {
          savePlayerData()
        }
      } catch (error) {}

      try {
        if (refreshBagModal && typeof refreshBagModal === 'function') {
          refreshBagModal()
        }
      } catch (error) {}
    })
  }, 220)
}

const resolveMonsterDropSnapshot = (monster, targetIndex) => {
  const fallbackPosition =
    typeof window !== 'undefined'
      ? {
        x: window.innerWidth * 0.6,
        y: 150 + (Number.isFinite(targetIndex) ? (targetIndex % 5) * 80 : 0)
      }
      : { x: 0, y: 0 }

  const resolvedId = monster?.id ?? null
  if (!resolvedId) {
    return null
  }

  return {
    id: resolvedId,
    name: monster?.name || 'Unknown Monster',
    width: monster?.width || 80,
    height: monster?.height || 80,
    x: fallbackPosition.x,
    y: fallbackPosition.y
  }
}

const processQueuedMonsterDefeatSettlements = async () => {
  if (monsterDefeatSettlementProcessing) {
    return
  }

  monsterDefeatSettlementProcessing = true

  // 动态 batchSize：当上一批处理耗时超过阈值时自动缩减，避免单帧阻塞
  let dynamicBatchSize = null

  // 总时间预算：确保整个处理不会在单个 setTimeout/RAF 回调中连续运行超过 8ms
  // 即使每个 per-frame yield 点都低于 frameBudgetMs，累计超过 8ms 也强制 yield
  // 8ms 是一帧 16.67ms 的一半，留出足够时间给渲染和其他任务
  const totalClock = { value: performance.now() }

  try {
    while (monsterDefeatSettlementQueue.length > 0) {
      const queueLoad = monsterDefeatSettlementQueue.length
      const frameBudgetMs = queueLoad >= 50 ? 2 : queueLoad >= 18 ? 3 : 5
      const frameClock = { value: performance.now() }

      const yieldIfNeeded = async () => {
        // 总时间预算检查：累计超过 2ms 强制 yield
        // ★ 关键：必须用 setTimeout(0) 创建真实宏任务边界
        // 微任务续延（resolved Promise）仍归属同一 task，浏览器会将所有
        // 微任务续延的时间计入原 setTimeout handler，导致 399-531ms 违规
        const totalElapsed = performance.now() - totalClock.value
        if (totalElapsed > 2) {
          await monsterDefeatSettlementNextFrame()
          frameClock.value = performance.now()
          totalClock.value = performance.now()
          return
        }
        // per-frame 预算检查
        if (performance.now() - frameClock.value < frameBudgetMs) {
          return
        }
        await monsterDefeatSettlementNextFrame()
        frameClock.value = performance.now()
        totalClock.value = performance.now()
      }

      // 根据队列长度和上一批耗时动态决定 batchSize
      const baseBatchSize = queueLoad >= 36 ? 12 : queueLoad >= 16 ? 8 : queueLoad >= 6 ? 4 : 1
      // 如果上一批耗时过长，缩减 batchSize（最少为 1）
      const batchSize = dynamicBatchSize !== null
        ? Math.max(1, Math.min(dynamicBatchSize, baseBatchSize))
        : baseBatchSize

      const batch = monsterDefeatSettlementQueue.splice(0, batchSize)
      if (batch.length === 0) {
        await yieldIfNeeded()
        continue
      }

      const batchStartAt = performance.now()

      // ★ 强制 yield：创建真实宏任务边界，确保 calculateAutoBattleRewardsBatch
      // 在独立 setTimeout handler 中执行
      // yieldIfNeeded 在首次调用时不会 yield（因 totalElapsed < 2ms），
      // 导致掉落计算 + 批量结算的微任务续延全部计入原 setTimeout handler（108ms 违规）
      await monsterDefeatSettlementNextFrame()
      frameClock.value = performance.now()
      totalClock.value = performance.now()

      let batchDropResults = null
      try {
        if (typeof calculateAutoBattleRewardsBatch === 'function') {
          batchDropResults = await calculateAutoBattleRewardsBatch(batch.map(item => item?.monster))
          if (!Array.isArray(batchDropResults) || batchDropResults.length !== batch.length) {
            batchDropResults = null
          }
        }
      } catch (error) {
        console.error('[Main] 批量掉落计算失败:', error)
        batchDropResults = null
      }

      if (batch.length > 1) {
        try {
          await processMonsterDefeatSettlementBatch(batch, batchDropResults, yieldIfNeeded)
        } catch (error) {
          console.error('[Main] 批量击杀结算处理失败:', error)
          addBattleLog('击杀结算失败，请稍后重试', 'error')
        }
        await yieldIfNeeded()
      } else {
        const task = batch[0]
        const precomputedRewards = batchDropResults?.[0]?.rewards || null
        try {
          await processSingleMonsterDefeatSettlement(task, yieldIfNeeded, precomputedRewards)
        } catch (error) {
          console.error('[Main] 击杀结算处理失败:', error)
          addBattleLog('击杀结算失败，请稍后重试', 'error')
        }
        await yieldIfNeeded()
      }

      // 动态调整：如果本批耗时超过 16ms，下一批缩减一半
      const batchElapsed = performance.now() - batchStartAt
      if (batchElapsed > 16) {
        dynamicBatchSize = Math.max(1, Math.floor(batchSize / 2))
      } else if (batchElapsed < 4 && dynamicBatchSize !== null) {
        // 恢复：耗时正常时逐步恢复到 baseBatchSize
        dynamicBatchSize = Math.min(baseBatchSize, dynamicBatchSize + 1)
      }
    }
  } finally {
    monsterDefeatSettlementProcessing = false
    // 队列处理完成后，检查是否需要刷新波次结算
    if (waveSettlementPendingFlush) {
      waveSettlementPendingFlush = false
      flushWaveSettlement()
    }
  }
}

/**
 * 调度击杀结算队列处理
 *
 * 使用 setTimeout(0) 而非 Promise.resolve().then()（微任务），确保结算处理在独立宏任务中执行。
 * 原因：onMonsterDefeated 回调通过 queueDeferredCallback 的 setTimeout(0) 触发，
 * 如果此处用微任务，processQueuedMonsterDefeatSettlements 会在同一个 setTimeout handler 内执行，
 * 导致掉落计算、奖励聚合等重计算阻塞该 handler（实测 819ms）。
 * 改用 setTimeout(0) 后，onMonsterDefeated 回调快速完成，
 * 结算处理在下一个宏任务中独立执行，不阻塞渲染。
 */
const scheduleQueuedMonsterDefeatSettlementProcessing = () => {
  if (monsterDefeatSettlementScheduled || monsterDefeatSettlementProcessing) {
    return
  }
  monsterDefeatSettlementScheduled = true

  setTimeout(() => {
    monsterDefeatSettlementScheduled = false
    return processQueuedMonsterDefeatSettlements()
  }, 0)
}

const handleMonsterDefeatedInAutoBattle = async payload => {
  try {
    const monster = payload?.monster || null
    if (!monster) {
      return
    }

    const targetIndex =
      typeof payload?.targetIndex === 'number' ? payload.targetIndex : Number(payload?.targetIndex)

    const dropMonster = resolveMonsterDropSnapshot(monster, targetIndex)
    monsterDefeatSettlementQueue.push({
      monster,
      dropMonster
    })
    scheduleQueuedMonsterDefeatSettlementProcessing()
  } catch (error) {
    ErrorHandler.handle(error, 'handleMonsterDefeatedInAutoBattle', payload)
  }
}

const handleMonstersDefeatedInAutoBattleBatch = async payload => {
  try {
    const batch = Array.isArray(payload?.batch) ? payload.batch : Array.isArray(payload) ? payload : []
    if (batch.length === 0) {
      return
    }

    let queued = 0
    for (let i = 0; i < batch.length; i += 1) {
      const entry = batch[i]
      const monster = entry?.monster || null
      if (!monster) {
        continue
      }
      const targetIndex =
        typeof entry?.targetIndex === 'number' ? entry.targetIndex : Number(entry?.targetIndex)
      const dropMonster = resolveMonsterDropSnapshot(monster, targetIndex)
      monsterDefeatSettlementQueue.push({
        monster,
        dropMonster
      })
      queued += 1
    }

    if (queued <= 0) {
      return
    }
    scheduleQueuedMonsterDefeatSettlementProcessing()
  } catch (error) {
    ErrorHandler.handle(error, 'handleMonstersDefeatedInAutoBattleBatch', payload)
  }
}

const processMonsterDefeatSettlementBatch = async (tasks, batchDropResults, yieldIfNeeded) => {
  const list = Array.isArray(tasks) ? tasks : []
  if (list.length === 0) {
    return
  }

  const resolvedYield = typeof yieldIfNeeded === 'function' ? yieldIfNeeded : async () => {}

  // 启动波次结算（如果尚未启动）
  startWaveSettlement()

  let changed = false

  // ====== 更新任务击杀进度 ======
  // 统计每个怪物的击杀数量（用于任务进度）
  const monsterKillCounts = new Map()

  // 统计本次批次的击杀数（用于波次聚合）
  const defeatedCount = list.length
  currentWaveMonstersDefeated += defeatedCount

  for (let i = 0; i < list.length; i += 1) {
    const monster = list[i]?.monster || null
    if (!monster) {
      continue
    }
    const monsterId = monster.id ?? monster.itemId ?? null
    if (monsterId === null || monsterId === undefined) {
      continue
    }
    const key = Number(monsterId)
    monsterKillCounts.set(key, (monsterKillCounts.get(key) || 0) + 1)
  }

  // 更新任务击杀进度并记录日志
  if (monsterKillCounts.size > 0 && typeof updateKillProgress === 'function') {
    let killProgressIter = 0
    for (const [monsterId, count] of monsterKillCounts) {
      try {
        // 获取怪物名称用于日志显示
        const monsterName = getMonsterName(monsterId)

        // 更新任务击杀进度
        updateKillProgress(monsterId, count)

        // 查询更新后的任务进度用于日志显示
        const activeQuests = questService.value?.getActiveQuests?.() || []
        const numericMonsterIdForLog = Number(monsterId)
        for (const quest of activeQuests) {
          if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
            // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
            const monsterObjective = quest.endKillMonsters.find(
              obj => obj.monster && obj.monster.some(m => Number(m) === numericMonsterIdForLog)
            )
            if (monsterObjective) {
              const current = monsterObjective.current || 0
              const required = monsterObjective.count || 0
              const questName = quest.name?.cns || quest.name?.en || quest.id
              const progressText = `[任务] ${questName}: 击杀 ${monsterName} ${current}/${required}`
              addBattleLog(progressText, 'quest')
              // 显示战斗日志动画
              showAnimationMessage(progressText, 'quest', '', '', '', '', '🎯')
            }
          }
        }
      } catch (error) {
        console.error('[Main] 更新任务击杀进度失败:', error)
      }
      // 每处理 1 个怪物 ID 后 yield，避免任务遍历阻塞主线程
      killProgressIter++
      if (killProgressIter % 1 === 0) {
        await resolvedYield()
      }
    }

    // 同步任务进度数据到player.quest，确保保存时数据正确
    if (player.value && questService.value) {
      syncQuestDataToPlayerQuest(player.value, questService.value)
    }

    // ====== 更新成就击杀进度（非阻塞式延迟批量更新） ======
    // 利用已聚合的 monsterKillCounts 批量提交，减少队列操作次数
    for (const [monsterId, count] of monsterKillCounts) {
      try {
        recordAchievementKill(monsterId, count)
      } catch (achError) {
        console.error('[Main] 更新成就击杀进度失败:', achError)
      }
    }
  }

  // ====== 更新每日签到击杀进度 ======
  // 普通击杀：怪物等级必须在玩家等级 ±10 范围内
  // BOSS 击杀：任意等级，rank 为 giant/boss/violet 的怪物均计入
  try {
    let lastSignInResult = { todayKillCount: 0, todayBossKillCount: 0, updated: false }
    for (let i = 0; i < list.length; i += 1) {
      const monster = list[i]?.monster || null
      if (!monster) continue
      const monsterLevel = monster.level || 0
      const monsterRank = monster.rank || ''
      const result = recordSignInKill(player.value, monsterLevel, monsterRank)
      if (result && result.updated) {
        lastSignInResult = result
      }
      // 每处理 1 个怪物后 yield，避免签到计算阻塞
      if ((i + 1) % 1 === 0) {
        await resolvedYield()
      }
    }

    // 签到击杀进度更新后标记 changed，确保 scheduleSavePlayerDataAfterMonsterDefeatSettlement 被触发
    if (lastSignInResult.updated) {
      changed = true
    }

    // 使用 recordSignInKill 返回的数据直接输出战斗日志
    // （避免从 player.value 重新读取可能遇到响应式延迟）
    const nowDate = new Date()
    const killReq = getKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    const bossReq = getBossKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    if (lastSignInResult.updated && (lastSignInResult.todayKillCount > 0 || lastSignInResult.todayBossKillCount > 0)) {
      const progressText = `[签到] 击杀进度 ${lastSignInResult.todayKillCount}/${killReq}  BOSS ${lastSignInResult.todayBossKillCount}/${bossReq}`
      addBattleLog(progressText, 'quest')
      showAnimationMessage(progressText, 'quest', '', '', '', '', '📅')
    }
  } catch (killError) {
    console.error('[Main] 自动战斗更新签到击杀进度失败:', killError)
  }

  const rewardsList = new Array(list.length)
  for (let i = 0; i < list.length; i += 1) {
    const rewards = batchDropResults?.[i]?.rewards || null
    rewardsList[i] = rewards
  }

  for (let i = 0; i < list.length; i += 1) {
    if (rewardsList[i]) {
      continue
    }
    const monster = list[i]?.monster || null
    if (!monster) {
      continue
    }
    try {
      const dropResult = await calculateAutoBattleRewards(monster)
      rewardsList[i] = dropResult?.rewards || null
    } catch (error) {
      console.error('[Main] 掉落计算失败:', error)
      rewardsList[i] = null
    }
    await resolvedYield()
  }

  const baseMaxExp = Number(player.value?.maxExp) || 0
  const oldExp = Number(player.value?.exp) || 0
  const oldLevel = Number(player.value?.level) || 1
  const oldGold = Number(player.value?.gold) || 0

  let totalExpReward = 0
  let totalGoldReward = 0
  const droppedItems = []

  for (let i = 0; i < rewardsList.length; i += 1) {
    const rewards = rewardsList[i]
    if (!rewards) {
      continue
    }
    const expReward = calculateActualExperience(rewards.exp)
    if (expReward > 0) {
      totalExpReward += expReward
    }
    const goldReward = Number(rewards.gold) || 0
    if (goldReward > 0) {
      totalGoldReward += goldReward
    }
    const items = Array.isArray(rewards.items) ? rewards.items : []
    for (let j = 0; j < items.length; j += 1) {
      if (items[j]) {
        droppedItems.push({ item: items[j], taskIndex: i })
      }
    }
    // 每聚合 10 个奖励后 yield，避免大批量奖励聚合阻塞
    if ((i + 1) % 10 === 0) {
      await resolvedYield()
    }
  }

  await resolvedYield()

  if (totalExpReward > 0) {
    try {
      gainExp(totalExpReward)
      // 使用聚合器累加经验数据，不在每批次输出日志
      currentWaveExp += totalExpReward
      // 立即检查升级，不影响聚合日志
      checkLevelUp(oldExp, oldLevel)
      changed = true
    } catch (error) {
      console.error('[Main] 批量经验结算失败:', error)
      addBattleLog('经验结算失败，请稍后重试', 'error')
    }
  }

  await resolvedYield()

  // 掉落物统一处理：创建动画+meta，由捡宠自动拾取或玩家手动点击拾取
  // 使用批量模式：先收集所有动画对象，最后一次性 push，减少 Vue 响应式触发次数
  beginDropAnimationBatch()

  if (totalGoldReward > 0) {
    // 金币掉落动画（始终创建，由捡宠或手动拾取触发入包）
    const firstDropMonster = list.find(entry => entry?.dropMonster)?.dropMonster || null
    const goldAnimationId = createGoldDropAnimation(firstDropMonster || list[0]?.monster || null, totalGoldReward)
    if (goldAnimationId) {
      dropItemFlowMeta.set(goldAnimationId, {
        itemId: 'gold',
        quantity: totalGoldReward,
        rawName: '金币',
        displayName: '金币',
        iconPath: '/pt/UI/gold.png',
        showBattleLogAnimation: false
      })
    }
  }

  await resolvedYield()

  if (droppedItems.length > 0) {
    // 物品掉落动画（始终创建，由捡宠或手动拾取触发入包）
    for (let i = 0; i < droppedItems.length; i += 1) {
      const entry = droppedItems[i]
      const item = entry?.item
      if (!item) continue
      const sourceTask = list[entry.taskIndex] || null
      const dropMonster = sourceTask?.dropMonster || sourceTask?.monster || null
      const staticItemData = DropService.getFullItemData(item.id)
      const resolvedQuantity = Number(
        item?.currentStack ?? item?.quantity ?? item?.stack ?? item?.count ?? item?.amount ?? 1
      )
      const safeQuantity =
        Number.isFinite(resolvedQuantity) && resolvedQuantity > 0 ? Math.floor(resolvedQuantity) : 1
      const itemToAdd = staticItemData ? { ...staticItemData, ...item, currentStack: safeQuantity } : item
      const animationId = createDropAnimation(dropMonster, itemToAdd)
      if (animationId) {
        const displayName = itemToAdd.name?.cns || itemToAdd.name || '物品'
        const shouldShowBattleLogAnimation = shouldShowDropAnimationItemIcon(itemToAdd)
        const iconPath = shouldShowBattleLogAnimation
          ? `/pt/item_icon/${itemToAdd.id}.png`
          : ''
        dropItemFlowMeta.set(animationId, {
          itemId: itemToAdd.id,
          quantity: safeQuantity,
          rawName: itemToAdd.name,
          displayName,
          iconPath,
          showBattleLogAnimation: shouldShowBattleLogAnimation
        })
      }
      await resolvedYield()
    }
  }

  // 一次性刷新所有缓冲的掉落动画，只触发一次 Vue 响应式更新
  flushDropAnimationBatch()

  if (changed) {
    scheduleSavePlayerDataAfterMonsterDefeatSettlement()
  }
}

const processSingleMonsterDefeatSettlement = async (task, yieldIfNeeded, precomputedRewards = null) => {
  const monster = task?.monster || null
  const dropMonster = task?.dropMonster || monster
  let rewards = precomputedRewards
  let changed = false

  // 启动波次结算（如果尚未启动）
  startWaveSettlement()

  // 统计击杀数（用于波次聚合）
  currentWaveMonstersDefeated++

  // 击杀HP恢复效果
  const hpRecoveryAfterKill = Number(player.value?.hpRecoveryAfterKill || 0)
  if (hpRecoveryAfterKill > 0 && player.value) {
    const maxHp = player.value.maxHp || player.value.maxHealth || 1000
    const recoveredHp = Math.min(hpRecoveryAfterKill, maxHp - (player.value.currentHealth || 0))
    if (recoveredHp > 0) {
      player.value.currentHealth = Math.min(maxHp, (player.value.currentHealth || 0) + recoveredHp)
      // 显示HP恢复动画（绿色数字）
      if (showDamageNumber) {
        showDamageNumber(-1, recoveredHp, false, true)
      }
    }
  }

  // 击杀MP恢复效果
  const mpRecoveryAfterKill = Number(player.value?.mpRecoveryAfterKill || 0)
  if (mpRecoveryAfterKill > 0 && player.value) {
    const maxMp = player.value.maxMp || player.value.maxMana || 1000
    const recoveredMp = Math.min(mpRecoveryAfterKill, maxMp - (player.value.currentMana || 0))
    if (recoveredMp > 0) {
      player.value.currentMana = Math.min(maxMp, (player.value.currentMana || 0) + recoveredMp)
      // 显示MP恢复动画
      if (showDamageNumber) {
        showDamageNumber(-1, recoveredMp, false, false, null, false, null, null, true)
      }
    }
  }

  // ====== 更新任务击杀进度 ======
  if (monster) {
    const monsterId = monster.id ?? monster.itemId ?? null
    if (monsterId !== null && monsterId !== undefined && typeof updateKillProgress === 'function') {
      try {
        // 获取怪物名称用于日志显示
        const monsterName = getMonsterName(monsterId)

        // 更新任务击杀进度
        updateKillProgress(monsterId, 1)

        // 查询更新后的任务进度用于日志显示
        const activeQuests = questService.value?.getActiveQuests?.() || []
        const numericMonsterIdForLog = Number(monsterId)
        for (const quest of activeQuests) {
          if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
            // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
            const monsterObjective = quest.endKillMonsters.find(
              obj => obj.monster && obj.monster.some(m => Number(m) === numericMonsterIdForLog)
            )
            if (monsterObjective) {
              const current = monsterObjective.current || 0
              const required = monsterObjective.count || 0
              const questName = quest.name?.cns || quest.name?.en || quest.id
              const progressText = `[任务] ${questName}: 击杀 ${monsterName} ${current}/${required}`
              addBattleLog(progressText, 'quest')
              // 显示战斗日志动画
              showAnimationMessage(progressText, 'quest', '', '', '', '', '🎯')
            }
          }
        }

        // 同步任务进度数据到player.quest
        if (player.value && questService.value) {
          syncQuestDataToPlayerQuest(player.value, questService.value)
        }
      } catch (error) {
        console.error('[Main] 更新任务击杀进度失败:', error)
      }
    }
  }

  // ====== 更新成就击杀进度（非阻塞式延迟批量更新） ======
  try {
    const achMonsterId = monster?.id ?? monster?.itemId ?? null
    if (achMonsterId !== null && achMonsterId !== undefined) {
      recordAchievementKill(achMonsterId, 1)
    }
  } catch (achError) {
    console.error('[Main] 更新成就击杀进度失败:', achError)
  }

  // ====== 更新每日签到击杀进度 ======
  // 普通击杀：怪物等级必须在玩家等级 ±10 范围内
  // BOSS 击杀：任意等级，rank 为 giant/boss/violet 的怪物均计入
  try {
    const monsterLevel = monster?.level || 0
    const monsterRank = monster?.rank || ''
    const signInResult = recordSignInKill(player.value, monsterLevel, monsterRank)

    // 签到击杀进度更新后标记 changed，确保 scheduleSavePlayerDataAfterMonsterDefeatSettlement 被触发
    // （即使怪物未提供经验，签到数据也需要通过全量保存持久化到后端）
    if (signInResult && signInResult.updated) {
      changed = true
    }

    // 使用 recordSignInKill 返回的数据直接输出战斗日志
    const nowDate = new Date()
    const killReq = getKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    const bossReq = getBossKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    if (signInResult && signInResult.updated && (signInResult.todayKillCount > 0 || signInResult.todayBossKillCount > 0)) {
      const progressText = `[签到] 击杀进度 ${signInResult.todayKillCount}/${killReq}  BOSS ${signInResult.todayBossKillCount}/${bossReq}`
      addBattleLog(progressText, 'quest')
      showAnimationMessage(progressText, 'quest', '', '', '', '', '📅')
    }
  } catch (killError) {
    console.error('[Main] 自动战斗单怪更新签到击杀进度失败:', killError)
  }

  if (!rewards) {
    try {
      const dropResult = await calculateAutoBattleRewards(monster)
      rewards = dropResult?.rewards || null
    } catch (error) {
      console.error('[Main] 掉落计算失败:', error)
      addBattleLog('掉落计算失败，请稍后重试', 'error')
      return
    }
  }

  if (!rewards) {
    return
  }

  await yieldIfNeeded()

  try {
    const actualExpReward = calculateActualExperience(rewards.exp)
    if (actualExpReward > 0) {
      const oldExp = player.value.exp
      const oldLevel = player.value.level

      gainExp(actualExpReward)
      // 使用聚合器累加经验数据，不在每只怪物输出日志
      currentWaveExp += actualExpReward

      checkLevelUp(oldExp, oldLevel)
      changed = true
    }
  } catch (error) {
    console.error('[Main] 经验结算失败:', error)
    addBattleLog('经验结算失败，请稍后重试', 'error')
  }

  await yieldIfNeeded()

  // 掉落物统一处理：创建动画+meta，由捡宠自动拾取或玩家手动点击拾取
  // 使用批量模式：先收集所有动画对象，最后一次性 push，减少 Vue 响应式触发次数
  beginDropAnimationBatch()

  try {
    if (rewards.gold > 0) {
      // 金币掉落动画（始终创建，由捡宠或手动拾取触发入包）
      const goldAnimationId = createGoldDropAnimation(dropMonster, rewards.gold)
      if (goldAnimationId) {
        dropItemFlowMeta.set(goldAnimationId, {
          itemId: 'gold',
          quantity: rewards.gold,
          rawName: '金币',
          displayName: '金币',
          iconPath: '/pt/UI/gold.png',
          showBattleLogAnimation: false
        })
      }
    }
  } catch (error) {
    console.error('[Main] 金币掉落动画创建失败:', error)
  }

  await yieldIfNeeded()

  try {
    if (rewards.items && rewards.items.length > 0) {
      for (const item of rewards.items) {
        if (!item) {
          await yieldIfNeeded()
          continue
        }

        const fullItemData = DropService.getFullItemData(item.id)

        if (fullItemData) {
          const resolvedQuantity = Number(
            item?.currentStack ?? item?.quantity ?? item?.stack ?? item?.count ?? item?.amount ?? 1
          )
          const safeQuantity =
            Number.isFinite(resolvedQuantity) && resolvedQuantity > 0
              ? Math.floor(resolvedQuantity)
              : 1
          // 保留原始掉落物品的动态属性（强化等级等）
          const dynamicProps = {
            enhanceLevel: item.enhanceLevel,
            StrengthenedAttributes: item.StrengthenedAttributes,
            PerforationAttributes: item.PerforationAttributes,
            possibleRandomStats: item.possibleRandomStats
          }
          const itemToAdd = {
            ...fullItemData,
            ...item,
            currentStack: safeQuantity,
            ...dynamicProps
          }

          // 物品掉落动画（始终创建，由捡宠或手动拾取触发入包）
          const animationId = createDropAnimation(dropMonster, itemToAdd)
          if (animationId) {
            const displayName = itemToAdd.name?.cns || itemToAdd.name || '物品'
            const shouldShowBattleLogAnimation = shouldShowDropAnimationItemIcon(itemToAdd)
            const iconPath = shouldShowBattleLogAnimation
              ? `/pt/item_icon/${itemToAdd.id}.png`
              : ''
            dropItemFlowMeta.set(animationId, {
              itemId: itemToAdd.id,
              quantity: itemToAdd.currentStack,
              rawName: itemToAdd.name,
              displayName,
              iconPath,
              showBattleLogAnimation: shouldShowBattleLogAnimation
            })
          }
        }

        await yieldIfNeeded()
      }
    }
  } catch (error) {
    console.error('[Main] 物品掉落动画创建失败:', error)
  }

  // 一次性刷新所有缓冲的掉落动画，只触发一次 Vue 响应式更新
  flushDropAnimationBatch()

  if (changed) {
    scheduleSavePlayerDataAfterMonsterDefeatSettlement()
  }
}

const onCountdownFinished = () => {
  try {
    onAutoBattleCountdownFinished()
  } catch (error) {
    console.error('onCountdownFinished 失败:', error)
    addBattleLog('倒计时处理失败，请重试', 'error')
  }
}

const {
  enhancePanelInitialPosition,
  perforationPanelInitialPosition,
  cardPanelInitialPosition,
  openEnhancePanel,
  openPerforationPanel,
  openCardPanel
} = useModalPanelInitialPosition({
  openEnhancePanel: openEnhancePanelFromUIStateManager,
  openPerforationPanel: openPerforationPanelFromUIStateManager,
  openCardPanel: openCardPanelFromUIStateManager
})

const inventoryAnchorButtonId = ref('bagButton')

const openInventoryFromBag = () => {
  inventoryAnchorButtonId.value = 'bagButton'
  openBagModal()
}

const openInventoryFromEquip = () => {
  inventoryAnchorButtonId.value = 'equipButton'
  openBagModal()
}
const {
  handleBuyItem,
  handleFoodPurchase,
  handleMagicPurchase,
  onPurchaseSuccess,
  onDiamondShopPurchase,
  onDiamondsChanged,
  handleShowMessage,
  handleEnhanceSuccess,
  handleEnhanceFailure,
  handleMapChange,
  handleQuestAccepted: handleQuestAcceptedFromEventHandler,
  handleQuestCompleted: handleQuestCompletedFromEventHandler,
  grantQuestRewards,
  isBagFull: isBagFullFromEventHandler
} = useEventHandler(
  player,
  itemsStore,
  gameInitializerManager,
  addBattleLog,
  addItemToBag,
  removeItemFromBag,
  currentMap,
  storageService,
  store,
  showAnimationMessage
) // 游戏状态

const showCutscene = ref(false)
const cutsceneTrigger = ref(0)
const pendingMapChange = ref(null)
const showMapNameAnimation = ref(false)
const mapNameAnimationText = ref('')
const mapNameAnimationKey = ref(0)
let mapNameAnimationTimer = null

const handleMapChangeWithCutscene = mapData => {
  pendingMapChange.value = mapData
  showCutscene.value = true
  cutsceneTrigger.value += 1
}

const startMapNameAnimation = name => {
  if (!name) {
    return
  }
  if (mapNameAnimationTimer) {
    clearTimeout(mapNameAnimationTimer)
    mapNameAnimationTimer = null
  }
  showMapNameAnimation.value = false
  mapNameAnimationText.value = name
  mapNameAnimationKey.value += 1
  nextTick(() => {
    showMapNameAnimation.value = true
  })
  mapNameAnimationTimer = setTimeout(() => {
    showMapNameAnimation.value = false
    mapNameAnimationTimer = null
  }, 3600)
}

const onCutsceneComplete = () => {
  if (pendingMapChange.value) {
    const mapName = pendingMapChange.value.mapName || pendingMapChange.value.name
    handleMapChange(pendingMapChange.value)
    pendingMapChange.value = null
    startMapNameAnimation(mapName)
  }
  showCutscene.value = false
}

const applyEnhanceResult = payload => {
  if (!payload || !player.value) {
    return
  }

  const storageService = storageServiceSingleton

  const {
    materialId,
    protectionScrollId,
    scrollConsumed,
    equipmentId,
    equipmentUniqueId,
    equipmentBagIndex,
    success,
    broke,
    newEnhanceLevel,
    enhanceCost,
    enhancedMinAttack,
    enhancedMaxAttack,
    enhancedMinDefense,
    enhancedMaxDefense,
    refineMode,
    attributeElementKey,
    attributeElementLabel,
    attributeEnhanceLevel,
    attributeAttackPercent,
    attributeElementResistances
  } = payload

  const sourceBag = Array.isArray(itemsStore.playerBag) && itemsStore.playerBag.length > 0
    ? itemsStore.playerBag
    : Array.isArray(player.value.bag)
      ? player.value.bag
      : []
  const currentBag = [...sourceBag]
 

  const normalizedEquipmentId = equipmentId !== null && equipmentId !== undefined ? Number(equipmentId) : null
  const normalizedMaterialId = materialId !== null && materialId !== undefined ? Number(materialId) : null
  const normalizedScrollId =
    protectionScrollId !== null && protectionScrollId !== undefined ? Number(protectionScrollId) : null

  const resolveItemStack = item => {
    if (!item) {
      return 1
    }
    const currentStack = Number(item.currentStack)
    if (Number.isFinite(currentStack) && currentStack > 0) {
      return currentStack
    }
    const fallbackQuantity = Number(item.quantity)
    if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
      item.currentStack = fallbackQuantity
      return fallbackQuantity
    }
    item.currentStack = 1
    return 1
  }

  const resolveEquipmentIndex = () => {
    if (normalizedEquipmentId === null || Number.isNaN(normalizedEquipmentId)) {
      return -1
    }

    if (equipmentUniqueId) {
      const uniqueIndex = currentBag.findIndex(item => item && item.uniqueId === equipmentUniqueId)
      if (uniqueIndex !== -1) {
        return uniqueIndex
      }
    }

    if (
      typeof equipmentBagIndex === 'number' &&
      currentBag[equipmentBagIndex] &&
      Number(currentBag[equipmentBagIndex].id) === normalizedEquipmentId
    ) {
      return equipmentBagIndex
    }

    return currentBag.findIndex(item => item && Number(item.id) === normalizedEquipmentId)
  }
 
  if (!broke && normalizedEquipmentId !== null && !Number.isNaN(normalizedEquipmentId)) {
    const equipmentIndex = resolveEquipmentIndex()
    if (equipmentIndex !== -1) {
      const equipment = currentBag[equipmentIndex]
      
      if (refineMode === 'attribute') {
        const resolvedEnhanceLevel = Number(attributeEnhanceLevel)
        const nextLevel = Number.isFinite(resolvedEnhanceLevel) ? resolvedEnhanceLevel : 0
        const nextStrengthenedAttributes = { ...(equipment?.StrengthenedAttributes || {}) }
        delete nextStrengthenedAttributes.elementalEnhancement
        delete nextStrengthenedAttributes.attributeEnhanceCount
        const elementalEnhancement = {
          ...(equipment?.elementalEnhancement || equipment?.StrengthenedAttributes?.elementalEnhancement || {})
        }
        const currentCount = Number(elementalEnhancement.attributeEnhanceCount ?? 0)
        elementalEnhancement.attributeEnhanceCount = currentCount + 1
        // 无论成功或失败都更新元素数据，确保等级变化时抗性数据同步更新
        if (attributeElementKey) {
          elementalEnhancement[attributeElementKey] = {
            elementAttribute: attributeElementLabel ?? '',
            enhancementLevel: nextLevel,
            elementAttackPercent: Number(attributeAttackPercent ?? 0),
            ...(attributeElementResistances ? { elementResistances: attributeElementResistances } : {})
          }
        }

        currentBag[equipmentIndex] = {
          ...equipment,
          StrengthenedAttributes: nextStrengthenedAttributes,
          elementalEnhancement
        }
      } else {
        const currentLevel = Number(equipment?.StrengthenedAttributes?.enhanceLevel ?? equipment?.enhanceLevel ?? 0)
        const resolvedEnhanceLevel = Number(newEnhanceLevel)
        const nextLevel = Number.isFinite(resolvedEnhanceLevel) ? resolvedEnhanceLevel : currentLevel
        const currentCount = Number(equipment?.StrengthenedAttributes?.enhanceCount ?? 0)
        const nextCount = currentCount + 1
        const isWeapon = equipment?.category === 'weapon'
        const isArmor =
          equipment?.category === 'armor' &&
          ['helmet', 'suit', 'gloves', 'gauntlet', 'boots', 'shield'].includes(equipment?.subcategory)
        const hasEnhancedAttack =
          enhancedMinAttack !== null &&
          enhancedMinAttack !== undefined &&
          enhancedMaxAttack !== null &&
          enhancedMaxAttack !== undefined
        const hasEnhancedDefense =
          enhancedMinDefense !== null &&
          enhancedMinDefense !== undefined &&
          enhancedMaxDefense !== null &&
          enhancedMaxDefense !== undefined
        
        const nextStrengthenedAttributes = {
          ...(equipment?.StrengthenedAttributes || {}),
          enhanceLevel: nextLevel,
          enhanceCount: nextCount
        }
        if ((isWeapon && hasEnhancedAttack) || (isArmor && hasEnhancedDefense)) {
          if (isWeapon && hasEnhancedAttack) {
            nextStrengthenedAttributes.enhancedMinAttack = enhancedMinAttack
            nextStrengthenedAttributes.enhancedMaxAttack = enhancedMaxAttack
          }
          if (isArmor && hasEnhancedDefense) {
            nextStrengthenedAttributes.enhancedMinDefense = enhancedMinDefense
            nextStrengthenedAttributes.enhancedMaxDefense = enhancedMaxDefense
          }
          nextStrengthenedAttributes[String(nextLevel)] = {
            enhanceLevel: nextLevel,
            ...(isWeapon
              ? {
                enhancedMinAttack,
                enhancedMaxAttack
              }
              : {
                enhancedMinDefense,
                enhancedMaxDefense
              })
          }
        } else {
          delete nextStrengthenedAttributes.enhancedMinAttack
          delete nextStrengthenedAttributes.enhancedMaxAttack
          delete nextStrengthenedAttributes.enhancedMinDefense
          delete nextStrengthenedAttributes.enhancedMaxDefense
        }

        currentBag[equipmentIndex] = {
          ...equipment,
          StrengthenedAttributes: nextStrengthenedAttributes,
          enhanceLevel: nextLevel
        }
      }
    }
  }

  if (normalizedMaterialId !== null && !Number.isNaN(normalizedMaterialId)) {
    const materialIndex = currentBag.findIndex(item => item && Number(item.id) === normalizedMaterialId)
    if (materialIndex !== -1) {
      const material = currentBag[materialIndex]
      const currentStack = resolveItemStack(material)
      const nextStack = currentStack - 1
    
      if (nextStack < 1) {
        currentBag.splice(materialIndex, 1)
      } else {
        currentBag[materialIndex] = {
          ...material,
          currentStack: nextStack,
          quantity: material?.quantity !== undefined ? nextStack : material?.quantity
        }
      }
    
    } else {
      console.log('[EnhanceFlow][Main] consumeMaterial:notFound', { materialId: normalizedMaterialId })
    }
  }
  if (scrollConsumed && normalizedScrollId !== null && !Number.isNaN(normalizedScrollId)) {
    const scrollIndex = currentBag.findIndex(item => item && Number(item.id) === normalizedScrollId)
    if (scrollIndex !== -1) {
      const scrollItem = currentBag[scrollIndex]
      const currentStack = resolveItemStack(scrollItem)
      const nextStack = currentStack - 1
    
      if (nextStack < 1) {
        currentBag.splice(scrollIndex, 1)
      } else {
        currentBag[scrollIndex] = {
          ...scrollItem,
          currentStack: nextStack,
          quantity: scrollItem?.quantity !== undefined ? nextStack : scrollItem?.quantity
        }
      }
     
    } else {
      console.log('[EnhanceFlow][Main] consumeScroll:notFound', { scrollId: normalizedScrollId })
    }
  }

  if (broke) {
    const equipmentIndex = resolveEquipmentIndex()
    const equipment = equipmentIndex !== -1 ? currentBag[equipmentIndex] : null
    const equipmentName = equipment?.name?.cns || equipment?.name || '装备'
    const playerName = player.value?.nickname || '玩家'
    addBattleLog(`${playerName} 强化 ${equipmentName} 失败,该物品已破损!`, 'error')
    if (equipmentIndex !== -1) {
      currentBag.splice(equipmentIndex, 1)
    }
  }

  player.value.bag = currentBag
  itemsStore.$patch(state => {
    state.playerBag = [...currentBag]
  })
 
  const costToDeduct = Number(enhanceCost ?? 0)
  if (Number.isFinite(costToDeduct) && costToDeduct > 0) {
    const currentGold = Number(player.value.gold ?? 0)
    const nextGold = Math.max(0, currentGold - costToDeduct)
    player.value.gold = nextGold
    itemsStore.playerGold = nextGold
  
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: nextGold } }))
    }
  }

  storageService.savePlayerData(player.value)
 
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('update-bag-ui', { detail: { source: 'enhance' } }))
  }
}

const applyPerforationResult = payload => {
  if (!payload || !player.value) {
    return
  }

  const {
    equipmentId,
    equipmentUniqueId,
    equipmentBagIndex,
    materialId,
    scrollId,
    scrollConsumed,
    success,
    broke,
    newHoleCount,
    perforationCost
  } = payload

  const sourceBag = Array.isArray(itemsStore.playerBag) && itemsStore.playerBag.length > 0
    ? itemsStore.playerBag
    : Array.isArray(player.value.bag)
      ? player.value.bag
      : []

  const currentBag = [...sourceBag]

  const normalizedEquipmentId = equipmentId !== null && equipmentId !== undefined ? Number(equipmentId) : null
  const normalizedMaterialId = materialId !== null && materialId !== undefined ? Number(materialId) : null
  const normalizedScrollId = scrollId !== null && scrollId !== undefined ? Number(scrollId) : null

  const resolveItemStack = item => {
    if (!item) {
      return 1
    }
    const currentStack = Number(item.currentStack)
    if (Number.isFinite(currentStack) && currentStack > 0) {
      return currentStack
    }
    const fallbackQuantity = Number(item.quantity)
    if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
      item.currentStack = fallbackQuantity
      return fallbackQuantity
    }
    item.currentStack = 1
    return 1
  }

  const resolveEquipmentIndex = () => {
    if (normalizedEquipmentId === null || Number.isNaN(normalizedEquipmentId)) {
      return -1
    }

    if (equipmentUniqueId) {
      const uniqueIndex = currentBag.findIndex(item => item && item.uniqueId === equipmentUniqueId)
      if (uniqueIndex !== -1) {
        return uniqueIndex
      }
    }

    if (
      typeof equipmentBagIndex === 'number' &&
      currentBag[equipmentBagIndex] &&
      Number(currentBag[equipmentBagIndex].id) === normalizedEquipmentId
    ) {
      return equipmentBagIndex
    }

    return currentBag.findIndex(item => item && Number(item.id) === normalizedEquipmentId)
  }

  if (!broke && normalizedEquipmentId !== null && !Number.isNaN(normalizedEquipmentId)) {
    const equipmentIndex = resolveEquipmentIndex()
    if (equipmentIndex !== -1) {
      const equipment = currentBag[equipmentIndex]
      const attrs = {
        ...(equipment?.PerforationAttributes || {})
      }
      const currentHoleCountRaw = Number(attrs.holeCount ?? equipment?.holeCount ?? 0)
      const currentHoleCount = Number.isFinite(currentHoleCountRaw) ? currentHoleCountRaw : 0
      const resolvedNewHoleCount = Number(newHoleCount)
      const nextHoleCount = Number.isFinite(resolvedNewHoleCount)
        ? resolvedNewHoleCount
        : currentHoleCount
      const safeHoleCount = Number.isFinite(nextHoleCount) ? Math.max(0, nextHoleCount) : 0
      const shouldUpdatePerforation = Boolean(success) || safeHoleCount < currentHoleCount
      const currentPerforationCountRaw = Number(attrs.perforationCount ?? 0)
      const currentPerforationCount = Number.isFinite(currentPerforationCountRaw)
        ? currentPerforationCountRaw
        : 0
      const nextPerforationCount = currentPerforationCount + 1
      if (shouldUpdatePerforation) {
        const nextLevels = {
          ...(attrs.perforationLevels || {})
        }

        if (safeHoleCount > currentHoleCount) {
          const levelKey = String(safeHoleCount)
          nextLevels[levelKey] = {
            perforationLevel: safeHoleCount,
            embeddedCardId: nextLevels[levelKey]?.embeddedCardId ?? null
          }
        } else if (safeHoleCount < currentHoleCount) {
          Object.keys(nextLevels).forEach(levelKey => {
            const keyNumber = Number(levelKey)
            if (Number.isFinite(keyNumber) && keyNumber > safeHoleCount) {
              delete nextLevels[levelKey]
            }
          })
        }

        attrs.holeCount = safeHoleCount
        attrs.perforationLevels = nextLevels
        attrs.publicHoleCount = safeHoleCount
      }

      attrs.perforationCount = nextPerforationCount
      currentBag[equipmentIndex] = {
        ...equipment,
        holeCount: safeHoleCount,
        PerforationAttributes: attrs
      }
    }
  }

  if (normalizedMaterialId !== null && !Number.isNaN(normalizedMaterialId)) {
    const materialIndex = currentBag.findIndex(item => item && Number(item.id) === normalizedMaterialId)
    if (materialIndex !== -1) {
      const material = currentBag[materialIndex]
      const currentStack = resolveItemStack(material)
      const nextStack = currentStack - 1
      if (nextStack < 1) {
        currentBag.splice(materialIndex, 1)
      } else {
        currentBag[materialIndex] = {
          ...material,
          currentStack: nextStack,
          quantity: material?.quantity !== undefined ? nextStack : material?.quantity
        }
      }
    }
  }

  if (scrollConsumed && normalizedScrollId !== null && !Number.isNaN(normalizedScrollId)) {
    const scrollIndex = currentBag.findIndex(item => item && Number(item.id) === normalizedScrollId)
    if (scrollIndex !== -1) {
      const scrollItem = currentBag[scrollIndex]
      const currentStack = resolveItemStack(scrollItem)
      const nextStack = currentStack - 1
      if (nextStack < 1) {
        currentBag.splice(scrollIndex, 1)
      } else {
        currentBag[scrollIndex] = {
          ...scrollItem,
          currentStack: nextStack,
          quantity: scrollItem?.quantity !== undefined ? nextStack : scrollItem?.quantity
        }
      }
    }
  }

  if (broke) {
    const equipmentIndex = resolveEquipmentIndex()
    const equipment = equipmentIndex !== -1 ? currentBag[equipmentIndex] : null
    const equipmentName = equipment?.name?.cns || equipment?.name || '装备'
    const playerName = player.value?.nickname || '玩家'
    addBattleLog(`${playerName} 穿孔 ${equipmentName} 失败,该物品已破损!`, 'error')
    if (equipmentIndex !== -1) {
      currentBag.splice(equipmentIndex, 1)
    }
  }

  player.value.bag = currentBag
  itemsStore.$patch(state => {
    state.playerBag = [...currentBag]
  })

  const costToDeduct = Number(perforationCost ?? 0)
  if (Number.isFinite(costToDeduct) && costToDeduct > 0) {
    const currentGold = Number(player.value.gold ?? 0)
    const nextGold = Math.max(0, currentGold - costToDeduct)
    player.value.gold = nextGold
    itemsStore.playerGold = nextGold
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: nextGold } }))
    }
  }

  storageService.savePlayerData(player.value)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('update-bag-ui', { detail: { source: 'perforation' } }))
  }
}

const applyCardInsertResult = payload => {
  if (!payload || !player.value) {
    return
  }

  const action = payload.action === 'remove'
    ? 'remove'
    : payload.action === 'synthesize'
      ? 'synthesize'
      : 'insert'

  const {
    equipmentId,
    equipmentUniqueId,
    equipmentBagIndex,
    cardId,
    cardUniqueId,
    cardBagIndex,
    targetHoleLevel,
    removeCardId,
    removeCost,
    baseCardId,
    resultCardId,
    requiredCount,
    probability,
    cost,
    success
  } = payload

  if (action === 'synthesize') {
    const normalizedBaseCardId = baseCardId !== null && baseCardId !== undefined ? Number(baseCardId) : null
    const normalizedResultCardId = resultCardId !== null && resultCardId !== undefined ? Number(resultCardId) : null
    const normalizedRequiredCountRaw = Number(requiredCount ?? 10)
    const normalizedRequiredCount = Number.isFinite(normalizedRequiredCountRaw) && normalizedRequiredCountRaw > 0
      ? Math.floor(normalizedRequiredCountRaw)
      : 10
    const normalizedCostRaw = Number(cost ?? 0)
    const normalizedCost = Number.isFinite(normalizedCostRaw) && normalizedCostRaw > 0 ? normalizedCostRaw : 0
    const normalizedProbability = Number(probability ?? 0)
    const isSuccess = success === true

    if (normalizedBaseCardId === null || !Number.isFinite(normalizedBaseCardId)) {
      return
    }
    if (normalizedResultCardId === null || !Number.isFinite(normalizedResultCardId)) {
      return
    }

    const sourceBag = Array.isArray(itemsStore.playerBag) && itemsStore.playerBag.length > 0
      ? itemsStore.playerBag
      : Array.isArray(player.value.bag)
        ? player.value.bag
        : []

    const currentBag = [...sourceBag]

    const resolveItemStack = item => {
      if (!item) {
        return 1
      }
      const currentStack = Number(item.currentStack)
      if (Number.isFinite(currentStack) && currentStack > 0) {
        return currentStack
      }
      const fallbackQuantity = Number(item.quantity)
      if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
        item.currentStack = fallbackQuantity
        return fallbackQuantity
      }
      item.currentStack = 1
      return 1
    }

    const currentGold = Number(player.value.gold ?? 0)
    if (normalizedCost > 0 && (!Number.isFinite(currentGold) || currentGold < normalizedCost)) {
      addBattleLog(`金币不足，合成需要 ${normalizedCost} 金币`, 'error')
      return
    }

    let ownedCount = 0
    currentBag.forEach(item => {
      if (!item || Number(item.id) !== normalizedBaseCardId) {
        return
      }
      const stack = Number(item.currentStack ?? item.quantity ?? 0)
      if (Number.isFinite(stack) && stack > 0) {
        ownedCount += stack
      }
    })

    if (ownedCount < normalizedRequiredCount) {
      addBattleLog(`材料不足，需要 ${normalizedRequiredCount} 张卡片`, 'error')
      return
    }

    let remaining = normalizedRequiredCount
    for (let i = 0; i < currentBag.length && remaining > 0; i += 1) {
      const item = currentBag[i]
      if (!item || Number(item.id) !== normalizedBaseCardId) {
        continue
      }
      const stack = resolveItemStack(item)
      if (stack <= 0) {
        continue
      }
      const consume = Math.min(stack, remaining)
      const nextStack = stack - consume
      remaining -= consume
      if (nextStack < 1) {
        currentBag.splice(i, 1)
        i -= 1
        continue
      }
      currentBag[i] = {
        ...item,
        currentStack: nextStack,
        quantity: item?.quantity !== undefined ? nextStack : item?.quantity
      }
    }

    const resultConfig = itemsStore.getItemConfig(normalizedResultCardId)
    const resultName = resultConfig?.name?.cns || resultConfig?.name || `卡片(${normalizedResultCardId})`
    const baseConfig = itemsStore.getItemConfig(normalizedBaseCardId)
    const baseName = baseConfig?.name?.cns || baseConfig?.name || `卡片(${normalizedBaseCardId})`

    if (isSuccess) {
      if (!resultConfig) {
        return
      }
      const maxStackRaw = Number(resultConfig.stack ?? 9999)
      const maxStack = Number.isFinite(maxStackRaw) && maxStackRaw > 0 ? maxStackRaw : 9999

      let addedToExisting = false
      if (maxStack > 1) {
        const stackIndex = currentBag.findIndex(item => {
          if (!item) {
            return false
          }
          if (Number(item.id) !== normalizedResultCardId) {
            return false
          }
          const currentStack = Number(item.currentStack ?? item.quantity ?? 0)
          return Number.isFinite(currentStack) && currentStack > 0 && currentStack < maxStack
        })
        if (stackIndex !== -1) {
          const existingItem = currentBag[stackIndex]
          const currentStack = resolveItemStack(existingItem)
          const nextStack = Math.min(maxStack, currentStack + 1)
          currentBag[stackIndex] = {
            ...existingItem,
            currentStack: nextStack,
            quantity: existingItem?.quantity !== undefined ? nextStack : existingItem?.quantity
          }
          addedToExisting = true
        }
      }

      if (!addedToExisting) {
        if (currentBag.length >= itemsStore.bagCapacity) {
          addBattleLog('背包已满，无法放入合成产物', 'error')
          return
        }

        const nameText = typeof resultConfig.name === 'string' ? resultConfig.name : resultConfig.name?.cns || `物品#${resultConfig.id}`
        const descText = typeof resultConfig.description === 'string'
          ? resultConfig.description
          : resultConfig.description?.cns || ''
        const newItem = {
          id: resultConfig.id,
          icon: `/pt/item_icon/${resultConfig.id}.png`,
          name: nameText,
          description: descText,
          level: resultConfig.level || 0,
          cooldown: resultConfig.cooldown || 0,
          category: resultConfig.category || 'other',
          subcategory: resultConfig.subcategory || 'other',
          stack: maxStack,
          currentStack: 1,
          buyPrice: resultConfig.buyPrice || 0,
          sellPrice: resultConfig.sellPrice || 0,
          abilities: resultConfig.abilities || [],
          minAttack: resultConfig.minAttack || 0,
          maxAttack: resultConfig.maxAttack || 0,
          attackSpeedValue: resultConfig.attackSpeedValue,
          minDefense: resultConfig.minDefense || 0,
          maxDefense: resultConfig.maxDefense || 0,
          class: Array.isArray(resultConfig.class) ? resultConfig.class : [resultConfig.class],
          rarity: resultConfig.rarity || 'common',
          element: resultConfig.element || 'none',
          sex: resultConfig.sex || 'all',
          upgradeLevels: resultConfig.upgradeLevels || []
        }
        if (maxStack === 1) {
          newItem.uniqueId = `other_${resultConfig.id}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
        }
        currentBag.push(newItem)
      }
    }

    const nextGold = normalizedCost > 0 ? Math.max(0, currentGold - normalizedCost) : currentGold
    player.value.gold = nextGold
    itemsStore.playerGold = nextGold
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: nextGold } }))
    }

    player.value.bag = currentBag
    itemsStore.$patch(state => {
      state.playerBag = [...currentBag]
    })

    storageService.savePlayerData(player.value)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-bag-ui', { detail: { source: 'card-synthesis' } }))
    }

    if (isSuccess) {
      addBattleLog(`合成 ${baseName} → ${resultName} 成功`, 'success')
      showAnimationMessage(`合成成功：${resultName}`, 'use', `/pt/item_icon/${normalizedResultCardId}.png`)
    } else {
      const probText = Number.isFinite(normalizedProbability) && normalizedProbability > 0
        ? `${(normalizedProbability * 100).toFixed(0)}%`
        : ''
      addBattleLog(`合成 ${baseName} 失败${probText ? `（成功率 ${probText}）` : ''}`, 'error')
      showAnimationMessage(`合成失败：${baseName}`, 'drop', `/pt/item_icon/${normalizedBaseCardId}.png`)
    }

    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      const audioService = gameInitializerManager.value.services.audio
      if (isSuccess) {
        if (typeof audioService.playUpgradeSuccessSFX === 'function') {
          audioService.playUpgradeSuccessSFX()
        } else {
          audioService.playSFX('InfUpgradeSuccess.wav')
        }
      } else {
        if (typeof audioService.playUpgradeFailureSFX === 'function') {
          audioService.playUpgradeFailureSFX()
        } else {
          audioService.playSFX('InfUpgradeFail.wav')
        }
      }
    }

    updatePlayerAttributes()
    return
  }

  const normalizedEquipmentId = equipmentId !== null && equipmentId !== undefined ? Number(equipmentId) : null
  const normalizedCardId = cardId !== null && cardId !== undefined ? Number(cardId) : null
  const normalizedRemoveCardId = removeCardId !== null && removeCardId !== undefined ? Number(removeCardId) : null
  const normalizedTargetLevel = Number(targetHoleLevel)

  if (normalizedEquipmentId === null || Number.isNaN(normalizedEquipmentId)) {
    return
  }
  if (!Number.isFinite(normalizedTargetLevel) || normalizedTargetLevel < 1) {
    return
  }
  if (action === 'insert' && (normalizedCardId === null || Number.isNaN(normalizedCardId))) {
    return
  }

  const sourceBag = Array.isArray(itemsStore.playerBag) && itemsStore.playerBag.length > 0
    ? itemsStore.playerBag
    : Array.isArray(player.value.bag)
      ? player.value.bag
      : []

  const currentBag = [...sourceBag]

  const resolveItemStack = item => {
    if (!item) {
      return 1
    }
    const currentStack = Number(item.currentStack)
    if (Number.isFinite(currentStack) && currentStack > 0) {
      return currentStack
    }
    const fallbackQuantity = Number(item.quantity)
    if (Number.isFinite(fallbackQuantity) && fallbackQuantity > 0) {
      item.currentStack = fallbackQuantity
      return fallbackQuantity
    }
    item.currentStack = 1
    return 1
  }

  const resolveEquipmentIndex = () => {
    if (equipmentUniqueId) {
      const uniqueIndex = currentBag.findIndex(item => item && item.uniqueId === equipmentUniqueId)
      if (uniqueIndex !== -1) {
        return uniqueIndex
      }
    }
    if (
      typeof equipmentBagIndex === 'number' &&
      currentBag[equipmentBagIndex] &&
      Number(currentBag[equipmentBagIndex].id) === normalizedEquipmentId
    ) {
      return equipmentBagIndex
    }
    return currentBag.findIndex(item => item && Number(item.id) === normalizedEquipmentId)
  }

  const equipmentIndex = resolveEquipmentIndex()
  if (equipmentIndex === -1) {
    return
  }

  const equipment = currentBag[equipmentIndex]

  const attrs = {
    ...(equipment?.PerforationAttributes || {})
  }
  const currentHoleCountRaw = Number(attrs.holeCount ?? equipment?.holeCount ?? 0)
  const currentHoleCount = Number.isFinite(currentHoleCountRaw) ? currentHoleCountRaw : 0
  if (currentHoleCount <= 0 || normalizedTargetLevel > currentHoleCount) {
    return
  }

  const nextLevels = {
    ...(attrs.perforationLevels || {})
  }

  for (let level = 1; level <= currentHoleCount; level++) {
    const key = String(level)
    const existing = nextLevels[key]
    if (!existing || typeof existing !== 'object') {
      nextLevels[key] = { perforationLevel: level, embeddedCardId: null }
      continue
    }
    if (typeof existing.perforationLevel !== 'number') {
      existing.perforationLevel = level
    }
  }

  const targetKey = String(normalizedTargetLevel)
  const targetEntry = nextLevels[targetKey]

  if (action === 'insert') {
    const resolveCardIndex = () => {
      if (cardUniqueId) {
        const uniqueIndex = currentBag.findIndex(item => item && item.uniqueId === cardUniqueId)
        if (uniqueIndex !== -1) {
          return uniqueIndex
        }
      }
      if (
        typeof cardBagIndex === 'number' &&
        currentBag[cardBagIndex] &&
        Number(currentBag[cardBagIndex].id) === normalizedCardId
      ) {
        return cardBagIndex
      }
      return currentBag.findIndex(item => item && Number(item.id) === normalizedCardId)
    }

    const cardIndex = resolveCardIndex()
    if (cardIndex === -1) {
      return
    }

    const cardItem = currentBag[cardIndex]
    if (targetEntry && targetEntry.embeddedCardId !== null && targetEntry.embeddedCardId !== undefined) {
      return
    }

    nextLevels[targetKey] = {
      ...(targetEntry || {}),
      perforationLevel: normalizedTargetLevel,
      embeddedCardId: normalizedCardId
    }

    attrs.holeCount = currentHoleCount
    attrs.publicHoleCount = Number.isFinite(Number(attrs.publicHoleCount)) ? attrs.publicHoleCount : currentHoleCount
    attrs.perforationLevels = nextLevels

    currentBag[equipmentIndex] = {
      ...equipment,
      holeCount: currentHoleCount,
      PerforationAttributes: attrs
    }

    const currentStack = resolveItemStack(cardItem)
    const nextStack = currentStack - 1
    if (nextStack < 1) {
      currentBag.splice(cardIndex, 1)
    } else {
      currentBag[cardIndex] = {
        ...cardItem,
        currentStack: nextStack,
        quantity: cardItem?.quantity !== undefined ? nextStack : cardItem?.quantity
      }
    }

    player.value.bag = currentBag
    itemsStore.$patch(state => {
      state.playerBag = [...currentBag]
    })

    storageService.savePlayerData(player.value)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('update-bag-ui', { detail: { source: 'card-insert' } }))
    }

    const equipmentName = equipment?.name?.cns || equipment?.name || '装备'
    const cardName = itemsStore.getItemConfig(normalizedCardId)?.name?.cns ||
      itemsStore.getItemConfig(normalizedCardId)?.name ||
      cardItem?.name?.cns ||
      cardItem?.name ||
      `卡片(${normalizedCardId})`
    addBattleLog(`镶嵌 ${cardName} 到 ${equipmentName} 中成功`, 'success')

    showAnimationMessage(`卡片 ${cardName} 镶嵌成功`, 'success', `/pt/item_icon/${normalizedCardId}.png`)

    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      const audioService = gameInitializerManager.value.services.audio
      if (typeof audioService.playUpgradeSuccessSFX === 'function') {
        audioService.playUpgradeSuccessSFX()
      } else {
        audioService.playSFX('InfUpgradeSuccess.wav')
      }
    }

    updatePlayerAttributes()
    return
  }

  const embeddedRaw = targetEntry?.embeddedCardId
  const embeddedCardId = embeddedRaw !== null && embeddedRaw !== undefined ? Number(embeddedRaw) : null
  if (embeddedCardId === null || !Number.isFinite(embeddedCardId)) {
    return
  }
  if (normalizedRemoveCardId !== null && Number.isFinite(normalizedRemoveCardId) && normalizedRemoveCardId !== embeddedCardId) {
    return
  }

  const costToDeduct = Number(removeCost ?? 1000000)
  const normalizedCost = Number.isFinite(costToDeduct) && costToDeduct > 0 ? costToDeduct : 1000000

  const currentGold = Number(player.value.gold ?? 0)
  if (!Number.isFinite(currentGold) || currentGold < normalizedCost) {
    addBattleLog(`金币不足，移除需要 ${normalizedCost} 金币`, 'error')
    return
  }

  const cardConfig = itemsStore.getItemConfig(embeddedCardId)
  if (!cardConfig) {
    return
  }
  const maxStackRaw = Number(cardConfig.stack ?? 9999)
  const maxStack = Number.isFinite(maxStackRaw) && maxStackRaw > 0 ? maxStackRaw : 9999

  let addedToExisting = false
  if (maxStack > 1) {
    const stackIndex = currentBag.findIndex(item => {
      if (!item) {
        return false
      }
      if (Number(item.id) !== embeddedCardId) {
        return false
      }
      const currentStack = Number(item.currentStack ?? item.quantity ?? 0)
      return Number.isFinite(currentStack) && currentStack > 0 && currentStack < maxStack
    })
    if (stackIndex !== -1) {
      const existingItem = currentBag[stackIndex]
      const currentStack = resolveItemStack(existingItem)
      const nextStack = Math.min(maxStack, currentStack + 1)
      currentBag[stackIndex] = {
        ...existingItem,
        currentStack: nextStack,
        quantity: existingItem?.quantity !== undefined ? nextStack : existingItem?.quantity
      }
      addedToExisting = true
    }
  }

  if (!addedToExisting) {
    if (currentBag.length >= itemsStore.bagCapacity) {
      addBattleLog('背包已满，无法移除卡片', 'error')
      return
    }

    const nameText = typeof cardConfig.name === 'string' ? cardConfig.name : cardConfig.name?.cns || `物品#${cardConfig.id}`
    const descText = typeof cardConfig.description === 'string' ? cardConfig.description : cardConfig.description?.cns || ''
    const newItem = {
      id: cardConfig.id,
      icon: `/pt/item_icon/${cardConfig.id}.png`,
      name: nameText,
      description: descText,
      level: cardConfig.level || 0,
      cooldown: cardConfig.cooldown || 0,
      category: cardConfig.category || 'other',
      subcategory: cardConfig.subcategory || 'other',
      stack: maxStack,
      currentStack: 1,
      buyPrice: cardConfig.buyPrice || 0,
      sellPrice: cardConfig.sellPrice || 0,
      abilities: cardConfig.abilities || [],
      minAttack: cardConfig.minAttack || 0,
      maxAttack: cardConfig.maxAttack || 0,
      attackSpeedValue: cardConfig.attackSpeedValue,
      minDefense: cardConfig.minDefense || 0,
      maxDefense: cardConfig.maxDefense || 0,
      class: Array.isArray(cardConfig.class) ? cardConfig.class : [cardConfig.class],
      rarity: cardConfig.rarity || 'common',
      element: cardConfig.element || 'none',
      sex: cardConfig.sex || 'all',
      upgradeLevels: cardConfig.upgradeLevels || []
    }
    if (maxStack === 1) {
      newItem.uniqueId = `other_${cardConfig.id}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
    }
    currentBag.push(newItem)
  }

  nextLevels[targetKey] = {
    ...(targetEntry || {}),
    perforationLevel: normalizedTargetLevel,
    embeddedCardId: null
  }

  attrs.holeCount = currentHoleCount
  attrs.publicHoleCount = Number.isFinite(Number(attrs.publicHoleCount)) ? attrs.publicHoleCount : currentHoleCount
  attrs.perforationLevels = nextLevels

  currentBag[equipmentIndex] = {
    ...equipment,
    holeCount: currentHoleCount,
    PerforationAttributes: attrs
  }

  const nextGold = currentGold - normalizedCost
  player.value.gold = nextGold
  itemsStore.playerGold = nextGold
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gold-update', { detail: { gold: nextGold } }))
  }

  player.value.bag = currentBag
  itemsStore.$patch(state => {
    state.playerBag = [...currentBag]
  })

  storageService.savePlayerData(player.value)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('update-bag-ui', { detail: { source: 'card-remove' } }))
  }

  const equipmentName = equipment?.name?.cns || equipment?.name || '装备'
  const removedCardName = cardConfig?.name?.cns || cardConfig?.name || `卡片(${embeddedCardId})`
  addBattleLog(`移除 ${equipmentName} 的卡片 ${removedCardName} 成功`, 'success')
  showAnimationMessage(`移除卡片 ${removedCardName} 成功`, 'use', `/pt/item_icon/${embeddedCardId}.png`)

  if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
    const audioService = gameInitializerManager.value.services.audio
    if (typeof audioService.playUpgradeSuccessSFX === 'function') {
      audioService.playUpgradeSuccessSFX()
    } else {
      audioService.playSFX('InfUpgradeSuccess.wav')
    }
  }

  updatePlayerAttributes()
}

// 套装属性加成
const setBonuses = computed(
  () =>
    store.setBonuses || {
      strength: 0,
      constitution: 0,
      intelligence: 0,
      agility: 0
    }
)

// 计算玩家属性
const playerStats = computed(() => {
  // 使用player对象中已计算好的战斗属性，如果不存在则使用计算公式
  if (player.value) {
    const baseCriticalDamageMultiplier = 1.5
    const criticalDamageMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
      player.value.criticalDamage,
      baseCriticalDamageMultiplier
    )
    return {
      minAttack: player.value.minAttack || 5,
      maxAttack: player.value.maxAttack || 10,
      minDefense: player.value.minDefense || 1,
      maxDefense: player.value.maxDefense || 10,
      magicDefense: player.value.magicDefense || 0,
      hitRate:
          (player.value.hitRate || player.value.calculateHitRate?.call(player.value) || 0.8) * 100,
      dodgeRate:
          (player.value.dodgeRate || player.value.calculateDodgeRate?.call(player.value) || 0.05) *
          100,
      blockRate:
          (player.value.blockRate || player.value.calculateBlockRate?.call(player.value) || 0.05) *
          100,
      criticalRate:
          (player.value.criticalRate ||
            player.value.calculateCriticalRate?.call(player.value) ||
            0.05) * 100,
      criticalDamage: Math.max(0, (criticalDamageMultiplier - baseCriticalDamageMultiplier) * 100),
      attackSpeed:
          (player.value.attackSpeed ||
            player.value.calculateAttackSpeed?.call(player.value) ||
            1.0) * 100,
      castingTime:
          (player.value.CastSpeed || player.value.calculateCastSpeed?.call(player.value) || 1.0) *
          100,
      healPercent: (player.value.healPercent || 0) * 100,
      lifeStealing: (player.value.lifeSteal || 0) * 100,
      stun: player.value.stun || 0,
      blockPenetration: 0,
      bowAttack: player.value.bowAttack || 0,
      yoyoAttack: player.value.yoyoAttack || 0,
      axeAttack: player.value.axeAttack || 0,
      swordAttack: player.value.swordAttack || 0,
      fireAttack: (player.value.fireAttack || 0) * 100,
      waterAttack: (player.value.waterAttack || 0) * 100,
      windAttack: (player.value.windAttack || 0) * 100,
      thunderAttack: (player.value.thunderAttack || 0) * 100,
      earthAttack: (player.value.earthAttack || 0) * 100,
      skillDamage: 100,
      mpReduction: (player.value.decreasedMpConsumption || 0) * 100,
      fpReduction: 0,
      mpRecoveryAfterKill: player.value.mpRecoveryAfterKill || 0,
      hpRecoveryAfterKill: player.value.hpRecoveryAfterKill || 0
    }
  }

  // 默认值
  return {
    attack: 10,
    defense: 5,
    magicDefense: 0,
    hitRate: 80,
    dodgeRate: 5,
    blockRate: 5,
    criticalRate: 5,
    criticalDamage: 0,
    attackSpeed: 100,
    castingTime: 100,
    healPercent: 100,
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
    skillDamage: 100,
    mpReduction: 0,
    fpReduction: 0,
    mpRecoveryAfterKill: 0,
    hpRecoveryAfterKill: 0
  }
})

// 属性加成计算
const strengthBonus = computed(() => {
  if (player.value?.stats?.strength) {
    // 力量影响攻击力，从职业成长公式获取
    const className = getClassName(player.value.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const strengthGrowth = formula?.属性点增加的属性?.力量 || {}
    const minAtkBonus = strengthGrowth.最小攻击力 || 0
    const maxAtkBonus = strengthGrowth.最大攻击力 || 0
    // 返回平均攻击力加成
    return player.value.stats.strength * ((minAtkBonus + maxAtkBonus) / 2)
  }
  return 0
})
// 体质
const constitutionBonus = computed(() => {
  if (player.value?.stats?.constitution) {
    // 体质主要影响生命值和防御，从职业成长公式获取
    const className = getClassName(player.value.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const constitutionGrowth = formula?.属性点增加的属性?.体质 || {}
    const baseHpPerConstitution = constitutionGrowth.生命值 || 5

    return player.value.stats.constitution * baseHpPerConstitution
  }
  return 0
})
// 智力
const intelligenceBonus = computed(() => {
  if (player.value?.stats?.intelligence) {
    // 智力影响魔法值、技能伤害等，从职业成长公式获取
    const className = getClassName(player.value.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const intelligenceGrowth = formula?.属性点增加的属性?.智力 || {}
    const baseMpPerIntelligence = intelligenceGrowth.魔法值 || 4

    return player.value.stats.intelligence * baseMpPerIntelligence
  }
  return 0
})
// 敏捷
const agilityBonus = computed(() => {
  if (player.value?.stats?.agility) {
    // 敏捷影响命中、闪避、暴击等，从职业成长公式获取
    const className = getClassName(player.value.class)
    const formula = CLASS_GROWTH_FORMULAS[className] || CLASS_GROWTH_FORMULAS.初心者
    const agilityGrowth = formula?.属性点增加的属性?.敏捷 || {}
    // 返回暴击率加成作为敏捷收益显示
    const critBonus = agilityGrowth.暴击率 || 0.1
    return player.value.stats.agility * critBonus
  }
  return 0
})

// 商店物品数据
const blacksmithShopItems = computed(() => {
  return blacksmithModalData.value.shopItems || []
})

const armorShopItems = computed(() => {
  return armorShopModalData.value.shopItems || []
})

const foodShopItems = computed(() => {
  return foodShopModalData.value.shopItems || []
})

const magicShopItems = computed(() => {
  return magicShopModalData.value.shopItems || []
})

// 控制怪物区域显示 - 需要在useMonsterBattle之前定义
const showMonsters = ref(false)
const showMonstersControlledByAutoBattle = ref(false)
const showMapDisplay = computed(() => !showMonsters.value)
const updateAllMonstersUIRef = ref(null)
const monstersRef = ref([])

watch(
  autoBattle,
  newVal => {
    if (newVal) {
      showMonsters.value = true
      showMonstersControlledByAutoBattle.value = true
      return
    }
    if (showMonstersControlledByAutoBattle.value) {
      showMonsters.value = false
      showMonstersControlledByAutoBattle.value = false
    }
  },
  { immediate: true }
)

// 先调用useMonsterBattle获取getMonstersForMap
const {
  monsters: monstersFromBattle,
  aliveMonsters,
  getMonstersForMap,
  refreshMonsters,
  attackMonster: attackMonsterFromBattle,
  monsterDefeated: originalMonsterDefeated,
  replaceDefeatedMonster
} = useMonsterBattle(
  itemsStore,
  showMonsters,
  userSettings,
  savePlayerData,
  updateAllMonstersUIRef,
  showDamageNumber,
  activeBuffs,
  gameInitializerManager?.value?.services?.audio,
  autoBattle
)
// 重新赋值monsters和attackMonster
monstersRef.value = monstersFromBattle.value
// monsters 已经是响应式引用，无需重新赋值
attackMonster = attackMonsterFromBattle

// 在currentMap定义后调用useMonsterManager
// 注意：getMonsterDisplayName 和 getMonsterIcon 已在前面定义，不再重复解构
const {
  clearMonsterDotEffects,
  checkAndRefreshMonsters: checkAndRefreshMonstersLegacy,
  autoRefreshMonsters: autoRefreshMonstersLegacy,
  createMonsterWithFullData,
  initMonsters: initMonstersFromMonsterManager
} = useMonsterManager(itemsStore, currentMap, userSettings, autoBattle)

const checkAndRefreshMonsters = async (onRefreshComplete = null) => {
  try {
    if (!autoBattle.value) {
      return
    }

    if (!monstersStore.allDefeated) {
      return
    }

    const refreshed = await refreshMonstersAndMaybeResume(true)
    if (!refreshed) {
      return
    }

    if (typeof onRefreshComplete === 'function') {
      await nextTick()
      onRefreshComplete()
    }
  } catch (error) {
    console.error('[Main.vue] checkAndRefreshMonsters 失败:', error)
    addBattleLog('刷新怪物失败，请稍后重试', 'error')
    checkAndRefreshMonstersLegacy?.(onRefreshComplete)
  }
}

// 任务数据
const activeQuestTab = ref('available')
const selectedQuest = ref(null)
// 从游戏数据服务获取任务数据 - 已从useQuestManager中解构

const filteredQuests = computed(() => {
  return quests.value.filter(quest => {
    if (activeQuestTab.value === 'available') {
      // 可接取任务：未接受且未完成的任务
      const isAccepted = player.quest?.activeQuests?.some(q => q.id === quest.id)
      const isCompleted = player.quest?.completedQuests?.some(q => q.id === quest.id)
      return !isAccepted && !isCompleted
    } else if (activeQuestTab.value === 'active') {
      // 进行中任务
      return player.quest?.activeQuests?.some(q => q.id === quest.id)
    } else {
      // 已完成任务
      return player.quest?.completedQuests?.some(q => q.id === quest.id)
    }
  })
})

// 怪物等级翻译
const rankTranslations = {
  giant: '巨型BOSS',
  violet: '堕落BOSS',
  boss: 'BOSS',
  super: '超级BOSS',
  material: '材料',
  default: '普通'
}

// 地图模态框方法 - 已从useUIStateManager中解构

// 计算属性
const monsterDisplayCount = computed(() => {
  const value = Math.min(userSettings.value?.monsterDisplayCount || 5, 30)

  return value
})

const monsterFetchCountdownSeconds = computed(() => {
  const rawCount = Number(userSettings.value?.monsterDisplayCount ?? 0)
  const count = Number.isFinite(rawCount) ? rawCount : 0
  if (count <= 3) {
    return 1
  }
  if (count <= 10) {
    return 3
  }
  if (count <= 15) {
    return 5
  }
  return 8
})

// 监听设置变化，当monsterDisplayCount改变时刷新怪物
watch(
  () => userSettings.value?.monsterDisplayCount,
  (newCount, oldCount) => {
    if (newCount !== oldCount) {
      // 设置改变时总是刷新

      if (autoBattle.value) {
        refreshMonstersAndStartAutoBattle()
      } else {
        initMonstersFromMonsterManager() // 在非自动战斗模式下也刷新怪物
      }
    }
  }
)

// 监听设置变化，当monsterMinLevel或monsterMaxLevel改变时刷新怪物
watch(
  () => [userSettings.value?.monsterMinLevel, userSettings.value?.monsterMaxLevel],
  ([newMinLevel, newMaxLevel], [oldMinLevel, oldMaxLevel]) => {
    if (newMinLevel !== oldMinLevel || newMaxLevel !== oldMaxLevel) {
      // 设置改变时总是刷新

      if (autoBattle.value) {
        refreshMonstersAndStartAutoBattle()
      } else {
        initMonstersFromMonsterManager() // 在非自动战斗模式下也刷新怪物
      }
    }
  }
)

// 监听自动恢复设置变化，重新启动自动恢复定时器
watch(
  () => userSettings.value?.autoRecoveryInterval,
  (newInterval, oldInterval) => {
    if (newInterval !== oldInterval) {
      restartAutoSellAndRecovery()
    }
  }
)

// 监听当前地图变化，清除商店缓存
watch(
  () => currentMap.value,
  (newMap, oldMap) => {
    if (newMap?.name !== oldMap?.name) {
      // 清除NPC物品服务缓存
      if (npcItemService.value) {
        npcItemService.value.clearCache()
      }
    }
  }
)

// 任务面板拖拽相关
const questModal = ref(null)
const questHeader = ref(null)
const {
  isDragging,
  dragOffset,
  initQuestPanelDrag,
  startDrag: startDragManager,
  onDrag: onDragManager,
  endDrag: endDragManager,
  cleanupDrag
} = useDragManager(questModal, questHeader)

// 初始化updateAllMonstersUIRef的值
onMounted(() => {
  updateAllMonstersUIRef.value = updateAllMonstersUI
})

// 处理玩家数据更新事件
const onPlayerDataUpdated = payload => {
  const gameStore = useGameStore()
  const payloadObject = payload && typeof payload === 'object' ? payload : null

  // 只有在不需要跳过重载时才调用 loadBagItems
  // bagItems 是 computed 属性，会自动响应 store 变化，大多数情况不需要手动调用
  if (!payloadObject?.skipPlayerReload && loadBagItems) {
    loadBagItems()
  }

  if (!payloadObject?.skipPlayerReload) {
    if (payloadObject?.playerData) {
      gameStore.updatePlayer(payloadObject.playerData)
    } else if (payloadObject?.source !== 'store') {
      try {
        const storageService = storageServiceSingleton
        const updatedPlayerData = storageService.loadPlayerData()
        if (updatedPlayerData) {
          gameStore.updatePlayer(updatedPlayerData)
        }
      } catch (error) {
        console.error('更新玩家数据失败:', error)
      }
    }
  }

  if (!payloadObject?.skipAttributesUpdate && typeof updatePlayerAttributes === 'function') {
    updatePlayerAttributes()
  }

  nextTick(() => {
    if (typeof refreshBagModal === 'function') {
      refreshBagModal()
    }
  })
}

// 包装monsterDefeated函数，调用原始的monsterDefeated函数处理经验、金币和物品
const monsterDefeated = async (monsterOrIndex, mapNameOrMonster = null, refreshCallback = null) => {
  try {
    const calledWithIndex =
      Number.isInteger(monsterOrIndex) &&
      mapNameOrMonster &&
      typeof mapNameOrMonster === 'object'

    const resolvedMonster = calledWithIndex ? mapNameOrMonster : monsterOrIndex
    if (!resolvedMonster) {
      return
    }

    const resolvedMapName = calledWithIndex
      ? (currentMap.value?.name ?? null)
      : mapNameOrMonster

    // ====== 更新任务击杀进度 ======
    const monsterId = resolvedMonster.id ?? resolvedMonster.itemId ?? null
    if (monsterId !== null && monsterId !== undefined && typeof updateKillProgress === 'function') {
      try {
        // 获取怪物名称用于日志显示
        const monsterName = getMonsterName(monsterId)

        // 更新任务击杀进度
        updateKillProgress(monsterId, 1)

        // 查询更新后的任务进度用于日志显示
        const activeQuests = questService.value?.getActiveQuests?.() || []
        const numericMonsterIdForLog = Number(monsterId)
        for (const quest of activeQuests) {
          if (quest.endKillMonsters && Array.isArray(quest.endKillMonsters)) {
            // ★ 使用 Number() 统一类型比较，避免 includes() 严格相等导致不匹配
            const monsterObjective = quest.endKillMonsters.find(
              obj => obj.monster && obj.monster.some(m => Number(m) === numericMonsterIdForLog)
            )
            if (monsterObjective) {
              const current = monsterObjective.current || 0
              const required = monsterObjective.count || 0
              const questName = quest.name?.cns || quest.name?.en || quest.id
              const progressText = `[任务] ${questName}: 击杀 ${monsterName} ${current}/${required}`
              addBattleLog(progressText, 'quest')
              // 显示战斗日志动画
              showAnimationMessage(progressText, 'quest', '', '', '', '', '🎯')
            }
          }
        }

        // 同步任务进度数据到player.quest
        if (player.value && questService.value) {
          syncQuestDataToPlayerQuest(player.value, questService.value)
        }
      } catch (error) {
        console.error('[Main] 更新任务击杀进度失败:', error)
      }
    }

    // ====== 更新每日签到击杀进度 ======
    // 普通击杀：怪物等级必须在玩家等级 ±10 范围内
    // BOSS 击杀：任意等级，rank 为 giant/boss/violet 的怪物均计入
    try {
      const monsterLevel = resolvedMonster.level || 0
      const monsterRank = resolvedMonster.rank || ''
      const signInResult = recordSignInKill(player.value, monsterLevel, monsterRank)

    // 使用 recordSignInKill 返回的数据直接输出战斗日志
    // （避免从 player.value 重新读取可能遇到响应式延迟）
    const nowDate = new Date()
    const killReq = getKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    const bossReq = getBossKillRequirement(nowDate.getDate(), nowDate.getFullYear(), nowDate.getMonth())
    if (signInResult && signInResult.updated && (signInResult.todayKillCount > 0 || signInResult.todayBossKillCount > 0)) {
        const progressText = `[签到] 击杀进度 ${signInResult.todayKillCount}/${killReq}  BOSS ${signInResult.todayBossKillCount}/${bossReq}`
        addBattleLog(progressText, 'quest')
        showAnimationMessage(progressText, 'quest', '', '', '', '', '📅')
      }
    } catch (killError) {
      console.error('[Main] 更新签到击杀进度失败:', killError)
    }

    // ====== 更新成就击杀进度（非阻塞式延迟批量更新） ======
    // 仅将击杀事件加入队列，通过 requestIdleCallback 在主线程空闲时批量提交
    try {
      const achMonsterId = resolvedMonster.id ?? resolvedMonster.itemId ?? null
      if (achMonsterId !== null && achMonsterId !== undefined) {
        recordAchievementKill(achMonsterId, 1)
      }
    } catch (achError) {
      console.error('[Main] 更新成就击杀进度失败:', achError)
    }

    // 调用原始的monsterDefeated函数处理经验、金币和物品
    // 注意：originalMonsterDefeated函数已经包含了创建金币和物品掉落动画的逻辑
    if (originalMonsterDefeated) {
      await originalMonsterDefeated(resolvedMonster, resolvedMapName, refreshCallback)
    }
  } catch (error) {
    console.error('[Main] monsterDefeated 奖励结算失败:', error)
    addBattleLog('奖励结算失败，请稍后重试', 'error')
  }
}

// 用于强制刷新怪物UI的版本号 — 已移除，Vue 细粒度响应式自动处理
const {
  startGameLoop: startGameLoopFromManager,
  startBuffTimer,
  startSkillCooldownTimer,
  startMonsterRefreshTimer,
  clearBuffTimer,
  clearMonsterRefreshTimer,
  clearSkillCooldownTimer,
  clearGameLoopTimer,
  clearAllTimeouts,
  cleanupAllTimers,
  addTimeoutId
} = useGameLoopManager(
  player,
  activeBuffs,
  skills,
  monsters,
  userSettings,
  updateDamageNumbers,
  updateExpNumbers
)
// 重新赋值startGameLoop
startGameLoop = startGameLoopFromManager
const lastDamage = ref(0)

// 死亡时保存的战斗状态（参考old版实现）
const deathBattleState = ref({
  monsters: [],
  isAutoBattle: false,
  battleMode: 'manual'
})

// 计算属性
const playerAvatar = computed(() => {
  if (!player.value.class) {
    return '/pt/job_icon/cxz_nan_icon.png'
  }

  return getClassIconPath(player.value.class, player.value.sex)
})

const expMultiplier = computed(() => {
  const multiplier = Number(experienceMultiplier.value ?? 1)
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return 100
  }
  return Math.round(multiplier * 100)
})

const dropRate = computed(() => {
  // 基础掉落率 100%
  let rate = 100

  // 获取玩家的活跃BUFF（使用已解构的 activeBuffs）
  const buffs = activeBuffs.value || []

  // 查找增爆卷BUFF，只应用一次（不叠加显示）
  const dropRateBuff = buffs.find(buff => buff.effects?.dropRate || buff.type === 'dropRate')
  if (dropRateBuff) {
    if (dropRateBuff.effects?.dropRate) {
      const effect = dropRateBuff.effects.dropRate
      const add = typeof effect === 'object' ? (effect.add || 0) : effect
      // 显示为 100% + 100% = 200%
      rate += add
    } else if (dropRateBuff.type === 'dropRate') {
      // 兼容旧格式
      rate += (dropRateBuff.rate || 0) * 100
    }
  }

  return rate
})

// 初始化游戏
// 初始化游戏 - 已从useGameInitializer中解构

// 初始化怪物 - 已从useGameInitializer中解构

// 创建怪物
const createMonster = index => {
  // 获取当前地图信息
  const map = currentMap.value

  // 检查地图信息是否完整
  if (!map || !map.name || !map.levelRange) {
    return
  }

  // 获取符合当前地图和设置条件的怪物列表
  const availableMonsters = getMonstersForMap(map.name, map.levelRange)

  // 检查返回的怪物等级
  if (availableMonsters.length > 0) {
  }

  // 检查是否有可用的怪物
  if (!availableMonsters || availableMonsters.length === 0) {
    return
  }

  // 从可用怪物列表中随机选择一个怪物
  const randomIndex = Math.floor(Math.random() * availableMonsters.length)
  const randomMonster = availableMonsters[randomIndex]

  // 使用getMonstersForMap函数筛选出的怪物已经是符合等级限制的，直接使用其等级
  const monsterLevel = randomMonster.level || 1
  const monsterData = {
    id: randomMonster.id,
    name: randomMonster.name || `怪物${index + 1}`,
    level: monsterLevel,
    maxHealth: randomMonster.hp || 100,
    currentHealth: randomMonster.hp || 100,
    healthPercentage: 100,
    icon: `/pt/monster_icon/${randomMonster.id}.png`,
    minAttack: randomMonster.minAttack || 10,
    maxAttack: randomMonster.maxAttack || 20,
    minDefense: randomMonster.minDefense || 1,
    maxDefense: randomMonster.maxDefense || 5,
    magicDefense: randomMonster.magicDefense || 5,
    giveExp: randomMonster.giveExp || monsterLevel * 50 || 50,
    minDropGold: randomMonster.minDropGold || Number(monsterLevel) || 1,
    maxDropGold: randomMonster.maxDropGold || monsterLevel * 3 || 5,
    drops: randomMonster.drops || [],
    rank: randomMonster.rank || 'normal',
    element: randomMonster.element || 'none',
    isDefeated: false
  }

  monsters.value[index] = monsterData
}

// 初始化BUFF显示 - 已从useGameInitializer中解构

// 存储定时器ID用于清理
const buffTimerId = null

// 存储setTimeout ID用于清理
const timeoutIds = []

// 包装setTimeout以便清理
const managedSetTimeout = (callback, delay) => {
  const timeoutId = setTimeout(callback, delay)
  timeoutIds.push(timeoutId)
  return timeoutId
}

// 清理所有setTimeout - 已从useGameLoopManager中解构

// 存储怪物刷新定时器ID用于清理
const monsterRefreshTimerId = null

// 启动怪物刷新计时器 - 已从useGameLoopManager中解构

// 清理怪物刷新计时器 - 已从useGameLoopManager中解构

// 创建经验获取动画
const createExpGainAnimation = expGain => {
  // 获取经验值显示元素的位置
  const expElement = document.getElementById('playerCurrentExp')
  if (!expElement) {
    return
  }

  // 获取元素相对于视口的位置
  const rect = expElement.getBoundingClientRect()

  // 创建动画元素
  const animationElement = document.createElement('div')
  animationElement.className = 'exp-gain-animation'
  animationElement.textContent = `+${expGain} EXP`
  animationElement.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX + 100}px;
    top: ${rect.top + window.scrollY}px;
    color: #FFD700;
    font-weight: bold;
    font-size: 16px;
    pointer-events: none;
    z-index: 1000;
    animation: floatUp 1s ease-out forwards;
  `

  // 添加CSS动画样式
  if (!document.getElementById('exp-animation-style')) {
    const style = document.createElement('style')
    style.id = 'exp-animation-style'
    style.textContent = `
      @keyframes floatUp {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-50px); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  // 添加到页面
  document.body.appendChild(animationElement)

  // 动画结束后移除元素
  setTimeout(() => {
    if (animationElement.parentNode) {
      animationElement.parentNode.removeChild(animationElement)
    }
  }, 1000)
}

// 玩家相关方法 - 已从useUIStateManager中解构

// 商店模态框方法 - 已从useUIStateManager中解构

// 钻石商店购买成功回调 - 已从useEventHandler中解构
// 钻石数量变化回调 - 已从useEventHandler中解构

// 模态框方法 - 已从useUIStateManager中解构

// openJobChangeModal - 已从useUIStateManager中解构

// handleMapChange - 已从useEventHandler中解构

// openTowerModal - 已从useUIStateManager中解构

// openBlacksmithModal - 已从useUIStateManager中解构

// closeBlacksmithModal - 已从useUIStateManager中解构

// openArmorShopModal - 已从useUIStateManager中解构

// closeArmorShopModal - 已从useUIStateManager中解构

// handleBuyItem - 已从useEventHandler中解构

// 处理显示消息事件 - 已从useEventHandler中解构

// 强化面板相关方法
// openEnhancePanel - 已从useUIStateManager中解构

// closeEnhancePanel - 已从useUIStateManager中解构

// 穿洞面板相关方法
// openPerforationPanel - 已从useUIStateManager中解构

// closePerforationPanel - 已从useUIStateManager中解构

// 卡片镶嵌面板相关方法
// openCardPanel - 已从useUIStateManager中解构

// closeCardPanel - 已从useUIStateManager中解构

// 处理强化成功
// handleEnhanceSuccess - 已从useEventHandler中解构

// 处理强化失败
// handleEnhanceFailure - 已从useEventHandler中解构

// 处理穿洞成功
const handlePerforationSuccess = result => {
  const playerName = player.value?.nickname || '玩家'
  const equipmentName = result?.equipment?.name?.cns || result?.equipment?.name || '装备'
  const newHoleCountRaw = result?.newHoleCount ?? 0
  const newHoleCount = Number(newHoleCountRaw)
  const levelText =
    Number.isFinite(newHoleCount) && newHoleCount > 0 ? `+${newHoleCount}` : ''

  addBattleLog(`${playerName} ${equipmentName}穿孔${levelText}成功!`, 'success')

  showAnimationMessage(`装备 ${equipmentName} 穿洞成功`, 'success')

  if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
    const audioService = gameInitializerManager.value.services.audio
    if (typeof audioService.playUpgradeSuccessSFX === 'function') {
      audioService.playUpgradeSuccessSFX()
    } else {
      audioService.playSFX('InfUpgradeSuccess.wav')
    }
  }

  updatePlayerAttributes()
}

// 处理穿洞失败
const handlePerforationFailure = result => {
  const equipmentName = result?.equipment?.name?.cns || result?.equipment?.name || '装备'

  if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
    const audioService = gameInitializerManager.value.services.audio
    if (typeof audioService.playUpgradeFailureSFX === 'function') {
      audioService.playUpgradeFailureSFX()
    } else {
      audioService.playSFX('InfUpgradeFail.wav')
    }
  }
}

// 处理职业变更
const handleJobChanged = newJob => {
  const nextJobId = newJob?.id
  const nextJobName = newJob?.name || '未知职业'

  try {
    if (!player.value) {
      throw new Error('玩家数据为空')
    }

    // 保存职业转职历史路径，用于正确反推进阶路径（解决多父职业问题）
    const oldClass = player.value.class
    if (typeof nextJobId === 'string' && nextJobId) {
      // 初始化 jobHistory（如果不存在或非数组）
      if (!Array.isArray(player.value.jobHistory)) {
        player.value.jobHistory = [oldClass]
      }
      // 将旧职业追加到历史（避免重复）
      if (oldClass && !player.value.jobHistory.includes(oldClass)) {
        player.value.jobHistory.push(oldClass)
      }
      player.value.class = nextJobId
      // 将新职业追加到历史（避免重复）
      if (!player.value.jobHistory.includes(nextJobId)) {
        player.value.jobHistory.push(nextJobId)
      }
    }
    if (typeof player.value.resetStatsForJobChange === 'function') {
      player.value.resetStatsForJobChange()
    }
    player.value.skills = {}

    const initializerPlayer = gameInitializerManager?.value?.state?.player
    if (initializerPlayer) {
      initializerPlayer.class = player.value.class
      initializerPlayer.skills = {}
    }

    try {
      storageService.savePlayerSkills({})
    } catch (error) {
      console.error('[Main] 清空技能存档失败:', error)
    }

    if (gameInitializerManager.value && typeof gameInitializerManager.value.initPlayerSkills === 'function') {
      gameInitializerManager.value.initPlayerSkills()
    }
    const refreshedSkills = gameInitializerManager?.value?.state?.player?.skills
    if (refreshedSkills && typeof refreshedSkills === 'object') {
      player.value.skills = { ...refreshedSkills }
    } else {
      const latestPlayerData = storageService.loadPlayerData()
      if (latestPlayerData?.skills && typeof latestPlayerData.skills === 'object') {
        player.value.skills = { ...latestPlayerData.skills }
      }
    }

    try {
      const gameData = gameInitializerManager?.value?.state?.gameData
      if (gameData && typeof initSkills === 'function') {
        initSkills(player.value, gameData)
      }
    } catch (error) {
      console.error('[Main] 重新初始化技能显示失败:', error)
    }
    if (typeof updatePlayerAttributes === 'function') {
      updatePlayerAttributes()
    }

    storageService.savePlayerData(player.value)
    addBattleLog(`成功转职为 ${nextJobName}`, 'success')
    // 转职成功动画提示
    if (typeof window !== 'undefined' && typeof window.showAnimationMessage === 'function') {
      window.showAnimationMessage(`转职成功: ${nextJobName}`, 'quest', '', '', '', '', '✨')
    }
  } catch (error) {
    console.error('[Main] 转职处理失败:', error)
    addBattleLog('转职失败，请重试', 'error')
    return
  }

  closeJobChangeModal()
}

// handleRenameConfirm - 处理改名确认
const handleRenameConfirm = (newName) => {
  if (!newName || typeof newName !== 'string') {
    addBattleLog('名称无效', 'error')
    return
  }

  const trimmedName = newName.trim()
  if (trimmedName.length < 1 || trimmedName.length > 16) {
    addBattleLog('名称长度需要在1-16个字符之间', 'error')
    return
  }

  if (player.value) {
    // 保存旧名称
    const oldName = player.value.nickname || '玩家'
    
    // 使用 gameStore.updatePlayer 来确保响应式更新
    // 注意：玩家的显示名称使用的是 nickname 字段
    const store = useGameStore()
    store.updatePlayer({ nickname: trimmedName })
    
    // 更新存档
    try {
      storageService.savePlayerData(player.value)
      
      // 战斗日志提示
      addBattleLog(`${oldName} 改名为: ${trimmedName}`)
      
      // 战斗日志动画
      showAnimationMessage(`${oldName} 改名为: ${trimmedName}`, 'use', '/pt/item_icon/4656.png')
      
      // 移除消耗品改名卷轴（可叠加物品，直接用 id 移除）
      if (renameScrollItem) {
        const itemId = renameScrollItem.id
        itemsStore.removeItemFromBag(itemId, 1)
        renameScrollItem = null
      }
      
      // 刷新背包 UI
      if (refreshBagModal && typeof refreshBagModal === 'function') {
        refreshBagModal()
      }
    } catch (error) {
      console.error('[Main] 保存改名失败:', error)
      addBattleLog('改名保存失败', 'error')
    }
  }

  closeRenamePanel()
}

/**
 * 处理属性更改确认
 * @param {Object} data - 包含element和weapon的数据
 */
const handleElementChangeConfirm = (data) => {
  if (!data || !data.element || !data.weapon) {
    addBattleLog('属性更改失败：数据无效', 'error')
    closeElementChangePanel()
    return
  }

  const { element, weapon } = data
  const weaponName = getItemName(weapon)
  const displayName = typeof weaponName === 'object'
    ? (weaponName.cns || weaponName.en || weaponName.eng || `武器ID: ${weapon.id}`)
    : weaponName

  try {
    // 获取当前的元素强化数据
    const elementalEnhancement = weapon.elementalEnhancement || weapon.StrengthenedAttributes?.elementalEnhancement

    if (!elementalEnhancement) {
      addBattleLog('该武器没有元素强化数据', 'error')
      closeElementChangePanel()
      return
    }

    // 找到当前强化等级最高的元素键
    let currentElementKey = null
    let maxLevel = 0

    Object.keys(elementalEnhancement).forEach(key => {
      if (key !== 'attributeEnhanceCount') {
        const level = elementalEnhancement[key]?.enhancementLevel || 0
        if (level > maxLevel) {
          maxLevel = level
          currentElementKey = key
        }
      }
    })

    if (!currentElementKey) {
      addBattleLog('该武器没有元素强化等级', 'error')
      closeElementChangePanel()
      return
    }

    // 获取当前元素的强化数据
    const currentElementData = elementalEnhancement[currentElementKey]
    const enhancementLevel = currentElementData?.enhancementLevel || 0
    const elementAttackPercent = currentElementData?.elementAttackPercent || 0

    // 元素名称映射
    const elementNames = {
      fire: '火',
      water: '水',
      wind: '风',
      earth: '土',
      thunder: '雷',
      electricity: '雷'
    }

    const oldElementName = elementNames[currentElementKey] || currentElementKey
    const newElementName = elementNames[element] || element

    // 创建新的元素强化数据
    const newElementalEnhancement = { ...elementalEnhancement }

    // 删除旧的元素键
    delete newElementalEnhancement[currentElementKey]

    // 添加新的元素键
    newElementalEnhancement[element] = {
      elementAttribute: newElementName,
      enhancementLevel: enhancementLevel,
      elementAttackPercent: elementAttackPercent
    }

    // 更新武器数据
    if (weapon.source === 'equipment') {
      // 武器在装备栏
      const equipment = itemsStore.equipment
      if (equipment && equipment.weapon) {
        equipment.weapon.elementalEnhancement = newElementalEnhancement
        // 使用 store 更新
        store.updateEquipment({ weapon: equipment.weapon })
      }
    } else {
      // 武器在背包中
      const bag = itemsStore.playerBag
      const weaponIndex = bag.findIndex(item =>
        item && (item.uniqueId === weapon.uniqueId || item.id === weapon.id)
      )
      if (weaponIndex !== -1) {
        bag[weaponIndex].elementalEnhancement = newElementalEnhancement
        itemsStore.playerBag = [...bag]
      }
    }

    // 保存到存档
    const storageService = storageServiceSingleton
    storageService.savePlayerData(player.value)

    // 移除消耗品属性更改卷轴
    if (elementChangeScrollItem) {
      itemsStore.removeItemFromBag(elementChangeScrollItem.id, 1)
      elementChangeScrollItem = null
    }

    // 战斗日志提示
    addBattleLog(`${displayName} 的元素属性已从 ${oldElementName} 更改为 ${newElementName}`)

    // 战斗日志动画
    showAnimationMessage(
      `${displayName} 元素属性已更改为 ${newElementName}`,
      'use',
      '/pt/item_icon/1529.png'
    )

    // 播放音效
    if (gameInitializerManager.value && gameInitializerManager.value.services?.audio) {
      gameInitializerManager.value.services.audio.playSFX('ItemChrCure.wav')
    }

    // 刷新背包 UI
    if (refreshBagModal && typeof refreshBagModal === 'function') {
      refreshBagModal()
    }

    // 更新玩家属性（元素属性变化可能影响攻击力）
    updatePlayerAttributes()

  } catch (error) {
    console.error('[Main] 属性更改失败:', error)
    addBattleLog('属性更改失败', 'error')
  }

  closeElementChangePanel()
}

/**
 * 处理石头选择确认
 * @param {Object} data - 包含选中石头信息的数据
 * @param {number} data.stoneId - 选中的石头ID
 * @param {string} data.stoneName - 石头名称
 * @param {string} data.elementKey - 元素键（如 fire, water, wind 等）
 * @param {string} data.elementName - 元素名称（如火, 水, 风等）
 */
const handleStoneSelectConfirm = (data) => {
  if (!data || !data.stoneId) {
    addBattleLog('选择石头失败：数据无效', 'error')
    closeStoneSelectPanel()
    return
  }

  const { stoneId, stoneName, elementKey, elementName } = data

  try {
    // 添加选中的石头到背包
    const addResult = itemsStore.addItemToBag(stoneId, 1)
    if (!addResult) {
      addBattleLog('添加石头到背包失败', 'error')
      closeStoneSelectPanel()
      return
    }

    // 移除消耗品属性攻击魔法石箱
    if (stoneSelectItem) {
      itemsStore.removeItemFromBag(stoneSelectItem.id, 1)
      stoneSelectItem = null
    }

    // 战斗日志提示
    addBattleLog(`获得了 ${stoneName} (${elementName}属性攻击)`)

    // 战斗日志动画
    showAnimationMessage(
      `获得 ${stoneName}`,
      'use',
      `/pt/item_icon/${stoneId}.png`
    )

    // 播放音效
    if (gameInitializerManager.value && gameInitializerManager.value.services?.audio) {
      gameInitializerManager.value.services.audio.playSFX('ItemChrCure.wav')
    }

    // 刷新背包 UI
    if (refreshBagModal && typeof refreshBagModal === 'function') {
      refreshBagModal()
    }

    // 保存玩家数据
    storageService.savePlayerData(player.value)

  } catch (error) {
    console.error('[Main] 石头选择确认失败:', error)
    addBattleLog('石头选择确认失败', 'error')
  }

  closeStoneSelectPanel()
}

/**
 * 处理性别选择确认（selectbox类型套装礼盒）
 * 业务意图：玩家从套装礼盒中选择性别后，将对应性别的套装物品添加到背包并消耗礼盒
 * @param {Object} data - 选择结果
 * @param {number} data.selectedItemId - 选中的物品ID
 * @param {string} data.selectedItemName - 选中的物品名称
 * @param {number} data.selectedCount - 选中的物品数量
 */
const handleGenderSelectConfirm = (data) => {
  if (!data || !data.selectedItemId) {
    addBattleLog('选择套装失败：数据无效', 'error')
    closeGenderSelectPanel()
    return
  }

  const { selectedItemId, selectedItemName, selectedCount } = data

  try {
    // 添加选中的套装物品到背包
    const addResult = itemsStore.addItemToBag(selectedItemId, selectedCount || 1)
    if (!addResult) {
      addBattleLog('添加套装到背包失败，背包可能已满', 'error')
      closeGenderSelectPanel()
      return
    }

    // 移除消耗的套装礼盒
    if (genderSelectItem) {
      itemsStore.removeItemFromBag(genderSelectItem.id, 1)
      genderSelectItem = null
    }

    // 重置面板数据
    genderSelectData.value = {
      boxItemId: 0,
      boxItemName: '',
      boxDescription: '',
      contents: []
    }

    // 战斗日志提示
    addBattleLog(`获得了 ${selectedItemName}`)

    // 战斗日志动画
    showAnimationMessage(
      `获得 ${selectedItemName}`,
      'use',
      `/pt/item_icon/${selectedItemId}.png`
    )

    // 播放音效
    if (gameInitializerManager.value && gameInitializerManager.value.services?.audio) {
      gameInitializerManager.value.services.audio.playSFX('ItemChrCure.wav')
    }

    // 刷新背包 UI
    if (refreshBagModal && typeof refreshBagModal === 'function') {
      refreshBagModal()
    }

    // 保存玩家数据
    storageService.savePlayerData(player.value)

  } catch (error) {
    console.error('[Main] 性别选择确认失败:', error)
    addBattleLog('套装选择确认失败', 'error')
  }

  closeGenderSelectPanel()
}

/**
 * 处理播放音效事件
 * @param {string} sfxName - 音效文件名或路径
 */
const handlePlaySFX = (sfxName) => {
  try {
    if (gameInitializerManager.value && gameInitializerManager.value.services.audio) {
      const audioService = gameInitializerManager.value.services.audio
      
      // 检查音效路径，判断是调用 playSFX 还是 playMusicSFX
      if (sfxName.startsWith('/music/')) {
        // 移除路径前缀，只保留文件名
        const trackName = sfxName.replace('/music/', '')
        if (typeof audioService.playMusicSFX === 'function') {
          audioService.playMusicSFX(trackName)
        } else {
          // 回退到 playSFX
          audioService.playSFX(trackName)
        }
      } else if (sfxName.startsWith('/sound/')) {
        // 移除路径前缀，只保留文件名
        const soundName = sfxName.replace('/sound/', '')
        audioService.playSFX(soundName)
      } else {
        // 默认使用 playSFX
        audioService.playSFX(sfxName)
      }
    }
  } catch (error) {
    console.error('[Main] 播放音效失败:', error)
  }
}

// openFoodShopModal - 已从useUIStateManager中解构

// handleFoodPurchase - 已从useEventHandler中解构

// handleMagicPurchase - 已从useEventHandler中解构

// 通用购买处理函数
const handlePurchase = (purchaseData, itemType) => {
  const { item, quantity, totalPrice } = purchaseData

  // 检查玩家是否有足够的金币
  if (player.value.gold < totalPrice) {
    addBattleLog(
      `金币不足，无法购买! 当前金币: ${player.value.gold}, 需要金币: ${totalPrice}`,
      'error'
    )
    return
  }

  // 使用BagService检查背包是否有足够空间
  // 首先获取玩家数据以检查实际背包状态
  const playerData = storageService.loadPlayerData()

  if (playerData) {
    // 计算背包中已使用的格子数
    const usedSlots = playerData.bag.filter(bagItem => bagItem !== null).length
    const availableSlots = playerData.availableBagSlots - usedSlots

    // 计算需要的格子数（考虑物品堆叠和已有的相同物品）
    const maxStack = item.stack || 1

    // 检查背包中是否已有相同的物品
    const existingItem = playerData.bag.find(bagItem => bagItem && bagItem.id === item.id)
    let requiredSlots = 0

    if (existingItem) {
      // 如果已有相同物品，计算需要额外占用的格子数
      const remainingSpace = maxStack - existingItem.stack
      if (quantity > remainingSpace) {
        // 需要额外的格子
        requiredSlots = Math.ceil((quantity - remainingSpace) / maxStack)
      }
    } else {
      // 如果没有相同物品，计算需要的格子数
      requiredSlots = Math.ceil(quantity / maxStack)
    }

    if (availableSlots < requiredSlots) {
      addBattleLog(
        `背包空间不足，需要${requiredSlots}个格子，只有${availableSlots}个可用!`,
        'error'
      )
      return
    }
  }

  // 扣除金币
  player.value.gold -= totalPrice

  // 添加物品到背包（使用正确的参数）
  addItemToBag(item.id, quantity)

  // 同步更新Pinia store中的背包数据
  try {
    // 从localStorage加载最新的玩家数据并更新store
    const storageService = storageServiceSingleton
    const updatedPlayerData = storageService.loadPlayerData()
    if (updatedPlayerData) {
      // 更新store中的玩家数据
      store.updatePlayer(updatedPlayerData)
    }
  } catch (error) {
    console.error('同步背包数据到store失败:', error)
  }

  // 更新UI显示
  if (gameInitializer.value && gameInitializer.value.uiService) {
    // 更新金币显示
    gameInitializer.value.uiService.updateGoldDisplay(player.value.gold)

    // 更新背包UI
    gameInitializer.value.uiService.updateBagUI(player.value)
  }

  // 记录日志
  addBattleLog(`购买了 ${quantity} 个 ${item.name}，花费 ${totalPrice} 金币`, 'success')

  // 播放购买音效
  if (gameInitializer.value && gameInitializer.value.services.audio) {
    // 使用交易音效而不是金币音效
    gameInitializer.value.services.audio.playSFX('InfTrade.wav')
  }
}

// openMagicShopModal - 已从useUIStateManager中解构

const interactWithNPC = npcId => {
  addBattleLog(`与NPC交互: ${npcId}`)
}

// 属性点分配
const increaseAttribute = attribute => {
  if (player.value.stats.freePoints > 0) {
    player.value.stats[attribute]++
    player.value.stats.freePoints--

    // 更新玩家属性
    updatePlayerAttributes()
    addBattleLog(`增加1点${getAttributeName(attribute)}`)
  }
}

const getAttributeName = attribute => {
  return ATTRIBUTE_NAMES[attribute] || attribute
}

const decreaseAttribute = attribute => {
  if (player.value.stats[attribute] > 1) {
    player.value.stats[attribute]--
    player.value.stats.freePoints++

    // 更新玩家属性
    updatePlayerAttributes()
    addBattleLog(`减少1点${getAttributeName(attribute)}`)
  }
}

const confirmAttributes = stats => {
  // 保存属性分配
  if (
    gameInitializerManager.value &&
      gameInitializerManager.value.services &&
      gameInitializerManager.value.services.storage
  ) {
    // 使用新创建的专门保存玩家属性点的方法
    // 如果提供了stats参数，使用它，否则使用player.value.stats
    const statsToSave = stats || player.value.stats
    gameInitializerManager.value.services.storage.savePlayerStats(statsToSave)
  }

  addBattleLog('属性分配已确认')
  closePlayerDetailModal()
}

// 处理怪物攻击动画事件
const handleMonsterAttackAnimation = monsterIndex => {
  if (mainLayoutRef.value && mainLayoutRef.value.$refs.monsterInfoPanelRef) {
    const monsterInfoPanelRef = mainLayoutRef.value.$refs.monsterInfoPanelRef
    if (monsterInfoPanelRef && monsterInfoPanelRef.triggerMonsterAttack) {
      monsterInfoPanelRef.triggerMonsterAttack(monsterIndex)
    }
  }
}

// 处理 skillServiceReady 事件
const handleSkillServiceReady = nextSkillService => {

  // 更新本地的 skillService 引用
  if (nextSkillService) {
    skillService.value = nextSkillService
  }
}

// 处理刷新怪物
const handleRefreshMonsters = config => {
  // 根据配置刷新怪物
  if (autoBattle.value) {
    refreshMonstersAndStartAutoBattle()
  } else {
    initMonstersFromMonsterManager()
  }
}

// 处理技能冷却更新
const handleCooldownUpdate = updatedSkills => {

  // 同步技能冷却状态到skills数组
  if (updatedSkills && Array.isArray(updatedSkills)) {
    updatedSkills.forEach(updatedSkill => {
      const skillIndex = skills.value.findIndex(skill => skill.key === updatedSkill.key)
      if (skillIndex !== -1) {
        // 更新UI组件中的技能冷却时间
        skills.value[skillIndex].cooldown = updatedSkill.cooldown
      }
    })
  }
}

// 更新玩家属性// updatePlayerAttributes 已通过 usePlayer() 组合式函数提供

// handlePlayerDeathInAutoBattle - 已在前面定义

// 更新来自自动战斗的怪物数据
const updateMonstersFromAutoBattle = newMonsters => {
  // 这里可以根据需要添加更新逻辑
  // 当前通过props自动更新，所以这里可以留空或者添加额外处理
}

// 处理玩家技能使用事件
const handlePlayerSkillUse = () => {
  if (mainLayoutRef.value && mainLayoutRef.value.triggerPlayerSkillAnimation) {
    mainLayoutRef.value.triggerPlayerSkillAnimation()
  }
}

// 处理停止脉冲动画事件
const handleStopPulseAnimation = () => {
  if (autoBattleComponentRef.value) {
    autoBattleComponentRef.value.stopPulseAnimation()
  }
}

// 处理启动脉冲动画事件
const handleStartPulseAnimation = () => {
  if (autoBattleComponentRef.value) {
    autoBattleComponentRef.value.startPulseAnimation()
  }
}

// useRecoveryItem - 已从useItemManager中解构

// 自动出售HP恢复道具（参考old版实现）
const autoSellFoodItems = () => {
  // 检查游戏初始化器是否存在
  if (!gameInitializerManager.value) {
    console.warn('游戏初始化器未就绪')
    return
  }

  // 获取玩家数据
  const playerData = player.value
  if (!playerData || !playerData.bag) {
    console.warn('玩家数据未就绪')
    return
  }

  // 获取游戏设置
  const settings = userSettings.value || {}

  // 检查是否启用了任何HP/MP恢复道具自动出售选项
  const isAutoSellEnabled =
      settings.autoSellFood350 ||
      settings.autoSellFood500 ||
      settings.autoSellFood1000 ||
      settings.autoSellFood1500 ||
      settings.autoSellFood2000 ||
      settings.autoSellMp150 ||
      settings.autoSellMp250 ||
      settings.autoSellMp400 ||
      settings.autoSellMp550 ||
      settings.autoSellMp675

  if (!isAutoSellEnabled) {
    return
  }

  // 获取物品数据服务
  const itemDataService = gameInitializerManager.value.services.data
  if (!itemDataService || !itemDataService.itemData) {
    console.warn('物品数据服务未就绪')
    // 延迟一段时间后重试
    setTimeout(() => {
      if (
        gameInitializerManager.value &&
          gameInitializerManager.value.services.data &&
          gameInitializerManager.value.services.data.itemData
      ) {
        autoSellFoodItems()
      }
    }, 500)
    return
  }

  const itemData = itemDataService.itemData

  // 遍历背包中的物品
  const itemsToRemove = []
  let totalGoldEarned = 0
  // 聚合出售数据，用于合并输出日志
  const soldItemsAggregated = []

  for (let i = playerData.bag.length - 1; i >= 0; i--) {
    const item = playerData.bag[i]
    if (!item || !item.id) {
      continue
    }

    // 查找物品的详细信息
    const itemInfo = itemData.find(data => data.id === item.id)
    if (!itemInfo) {
      continue
    }

    // 检查是否是恢复类型道具
    if (itemInfo.category === 'recovery' && itemInfo.abilities && itemInfo.abilities.length > 0) {
      // 获取恢复能力
      const hpRestore = itemInfo.abilities.find(ability => ability.parameter === 'hp')
      const mpRestore = itemInfo.abilities.find(ability => ability.parameter === 'mp')

      // 处理HP恢复道具
      if (hpRestore && itemInfo.subcategory === 'food') {
        const restoreValue = hpRestore.add

        // 检查是否符合自动出售条件
        let shouldSell = false

        if (settings.autoSellFood350 && restoreValue < 350) {
          shouldSell = true
        } else if (settings.autoSellFood500 && restoreValue < 500) {
          shouldSell = true
        } else if (settings.autoSellFood1000 && restoreValue < 1000) {
          shouldSell = true
        } else if (settings.autoSellFood1500 && restoreValue < 1500) {
          shouldSell = true
        } else if (settings.autoSellFood2000 && restoreValue < 2000) {
          shouldSell = true
        }

        if (shouldSell) {
          // 计算出售价格
          const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
          const totalSellAmount = sellPrice * item.stack

          // 增加金币
          playerData.gold += totalSellAmount
          totalGoldEarned += totalSellAmount

          // 聚合出售数据，不直接输出日志
          const itemName =
              itemInfo && itemInfo.name && itemInfo.name.cns
                ? itemInfo.name.cns
                : `物品ID: ${item.id}`
          soldItemsAggregated.push({ name: itemName, quantity: item.stack, gold: totalSellAmount })

          // 添加到待移除列表
          itemsToRemove.push(i)
        }
      }
      // 处理MP恢复道具
      else if (mpRestore && itemInfo.subcategory === 'refresher') {
        const restoreValue = mpRestore.add

        // 检查是否符合自动出售条件
        let shouldSell = false

        if (settings.autoSellMp150 && restoreValue < 150) {
          shouldSell = true
        } else if (settings.autoSellMp250 && restoreValue < 250) {
          shouldSell = true
        } else if (settings.autoSellMp400 && restoreValue < 400) {
          shouldSell = true
        } else if (settings.autoSellMp550 && restoreValue < 550) {
          shouldSell = true
        } else if (settings.autoSellMp675 && restoreValue < 675) {
          shouldSell = true
        }

        if (shouldSell) {
          // 计算出售价格
          const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
          const totalSellAmount = sellPrice * item.stack

          // 增加金币
          playerData.gold += totalSellAmount
          totalGoldEarned += totalSellAmount

          // 聚合出售数据，不直接输出日志
          const itemName =
              itemInfo && itemInfo.name && itemInfo.name.cns
                ? itemInfo.name.cns
                : `物品ID: ${item.id}`
          soldItemsAggregated.push({ name: itemName, quantity: item.stack, gold: totalSellAmount })

          // 添加到待移除列表
          itemsToRemove.push(i)
        }
      }
      // 处理FP恢复道具（活力饮料，实际subcategory为drink）
      else if (itemInfo.subcategory === 'drink') {
        // FP道具通过ID来匹配自动出售设置
        const fpSettingsMap = {
          2476: 'autoSellFp100', // 活力饮料100
          6443: 'autoSellFp200', // 活力饮料200
          8367: 'autoSellFp300', // 活力饮料300
          7153: 'autoSellFp400', // 活力饮料400
          942: 'autoSellFp500', // 活力饮料500
          4069: 'autoSellFp600', // 活力饮料600
          4370: 'autoSellFp700', // 活力饮料700
          4923: 'autoSellFp800', // 活力饮料800
          3880: 'autoSellFp900' // 活力饮料900
        }

        // 检查对应的FP自动出售设置
        if (fpSettingsMap.hasOwnProperty(item.id)) {
          const settingKey = fpSettingsMap[item.id]
          const settingValue = settings[settingKey]

          // 如果设置为true，则应该自动出售
          if (settingValue === true) {
            // 计算出售价格
            const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
            const totalSellAmount = sellPrice * item.stack

            // 增加金币
            playerData.gold += totalSellAmount
            totalGoldEarned += totalSellAmount

            // 聚合出售数据，不直接输出日志
            const itemName =
                itemInfo && itemInfo.name && itemInfo.name.cns
                  ? itemInfo.name.cns
                  : `物品ID: ${item.id}`
            soldItemsAggregated.push({ name: itemName, quantity: item.stack, gold: totalSellAmount })

            // 添加到待移除列表
            itemsToRemove.push(i)
          }
        }
      }
    }
    // 检查是否是武器或装备
    else if (itemInfo && (itemInfo.category === 'weapon' || itemInfo.category === 'equipment')) {
      // 检查是否符合自动出售条件
      let shouldSell = false

      // 武器处理
      if (itemInfo.category === 'weapon') {
        if (settings.autoSellRareWeapon && itemInfo.rarity === 'rare') {
          shouldSell = true
        }
      }
      // 装备处理
      else if (itemInfo.category === 'equipment') {
        if (settings.autoSellRareEquip && itemInfo.rarity === 'rare') {
          shouldSell = true
        }
      }

      if (shouldSell) {
        // 计算出售价格
        const sellPrice = itemInfo.sellPrice || Math.floor((itemInfo.buyPrice || 0) / 4)
        const totalSellAmount = sellPrice * item.stack

        // 增加金币
        playerData.gold += totalSellAmount
        totalGoldEarned += totalSellAmount

        // 聚合出售数据，不直接输出日志
        const itemName =
            itemInfo && itemInfo.name && itemInfo.name.cns
              ? itemInfo.name.cns
              : `物品ID: ${item.id}`
        soldItemsAggregated.push({ name: itemName, quantity: item.stack, gold: totalSellAmount })

        // 添加到待移除列表
        itemsToRemove.push(i)
      }
    }
  }

  // 移除已出售的物品
  for (const index of itemsToRemove) {
    playerData.bag.splice(index, 1)
  }

  // 如果有物品被出售，更新UI和保存数据，并合并输出日志
  if (itemsToRemove.length > 0) {
    updatePlayerUI()
    // 自动保存
    if (gameInitializer.value) {
      gameInitializer.value.saveUserData()
    }
    
    // 将聚合的出售数据累加到波次聚合器
    for (const soldItem of soldItemsAggregated) {
      addAutoSellToWaveSettlement(soldItem.name, soldItem.quantity, soldItem.gold)
    }
  }
}

// 获取掉落率倍数（参考old版本实现）
const getDropRateMultiplier = () => {
  // 获取玩家的活跃BUFF
  const activeBuffs = player.value.activeBuffs || []

  // 查找掉落倍率增益效果
  let multiplier = 1
  activeBuffs.forEach(buff => {
    // 检查 effects.dropRate 格式（新格式）
    if (buff.effects?.dropRate) {
      const effect = buff.effects.dropRate
      const add = typeof effect === 'object' ? (effect.add || 0) : effect
      const isRate = typeof effect === 'object' ? effect.rate : buff.effectsRate
      // add: 100, rate: true 表示 100% 加成，即 2 倍
      // 计算方式：add / 100 + 1
      if (isRate) {
        multiplier *= (1 + add / 100)
      } else {
        multiplier *= add
      }
    }
    // 兼容旧格式 buff.type === 'dropRate'
    if (buff.type === 'dropRate') {
      multiplier *= (1 + (buff.rate || 0))
    }
  })

  // 确保返回一个有效的数值
  return typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : 1
}

// 技能相关方法

// 计算等级伤害减免（参考old版本实现）
const calculateLevelDamageReduction = (playerLevel, enemyLevel) => {
  // 计算等级差
  if (enemyLevel > playerLevel) {
    // 怪物等级高于玩家：玩家受到的伤害减免
    const levelDiff = enemyLevel - playerLevel
    // 每级减伤5%，最高100%
    const reductionRate = Math.min(1, levelDiff * 0.05)
    return reductionRate // 正值表示减伤
  } else if (playerLevel > enemyLevel) {
    // 玩家等级高于怪物：玩家造成的伤害增幅
    const levelDiff = playerLevel - enemyLevel
    // 每级增幅5%，最高100%
    const amplificationRate = Math.min(1, levelDiff * 0.05)
    return -amplificationRate // 负值表示增幅
  } else {
    // 等级相同，无减伤也无增幅
    return 0
  }
}

// 处理怪物图片加载错误
const monsterIconErrorSignatures = new Set()
const handleMonsterImageError = monster => {
  try {
    const defaultIcon = '/pt/monster_icon/2087.png'
    const monsterId = Number(monster?.id)
    const monsterIndex = Number(monster?.index)
    const failedIcon = typeof monster?.icon === 'string' ? monster.icon : ''
    const monsterName = typeof monster?.name === 'string' ? monster.name : ''

    if (failedIcon && failedIcon !== defaultIcon) {
      const signature = `${Number.isFinite(monsterId) ? monsterId : 'unknown'}|${failedIcon}`
      if (!monsterIconErrorSignatures.has(signature)) {
        monsterIconErrorSignatures.add(signature)
        console.warn('[Main.vue] 怪物图标加载失败，已自动替换默认图标', {
          id: monsterId,
          name: monsterName,
          icon: failedIcon
        })
      }
    }

    if (!failedIcon || failedIcon === defaultIcon) {
      return
    }

    if (monster && typeof monster === 'object') {
      monster.icon = defaultIcon
    }

    const list = monsters.value
    if (!Array.isArray(list) || list.length === 0) {
      return
    }

    if (
      Number.isFinite(monsterIndex) &&
      monsterIndex >= 0 &&
      monsterIndex < list.length &&
      list[monsterIndex] &&
      list[monsterIndex].id === monsterId
    ) {
      list[monsterIndex].icon = defaultIcon
      return
    }

    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (!item || item.id !== monsterId) {
        continue
      }
      if (typeof item.icon === 'string' && item.icon === failedIcon) {
        item.icon = defaultIcon
      }
    }
  } catch (error) {
    console.error('[Main.vue] handleMonsterImageError 失败:', error, monster)
  }
}

// getExperienceMultiplier - 已从useExperienceCalculator中解构;

// 解析概率范围（参考old版本实现）
// 解析概率范围
// 支持多种格式：
// 1. [0.01%;0.1%[  - 区间格式（左闭右开）
// 2. <0.001%      - 小于某值格式
// 3. 0.05%        - 单一值格式
const parseProbabilityRange = range => {
  if (!range || typeof range !== 'string') {
    console.warn('[parseProbabilityRange] 概率范围为空或格式错误:', range)
    return { min: 0, max: 0, isSingleValue: true }
  }

  // 处理 <0.001% 这种格式（小于某值）
  if (range.startsWith('<') || range.startsWith('≤')) {
    const valueStr = range.replace(/^[<≤]/, '').trim().replace('%', '')
    const value = parseFloat(valueStr)
    if (isNaN(value)) {
      console.error('[parseProbabilityRange] 解析单值失败:', range)
      return { min: 0, max: 0, isSingleValue: true }
    }
    // 对于 <0.001%，返回该值作为固定掉率
    return { min: value, max: value, isSingleValue: true }
  }

  // 处理 [0.01%;0.1%[ 这种区间格式
  const cleanedRange = range.replace(/^[\[\(]|[\]\)]$/g, '')
  const parts = cleanedRange.split(';')

  // 如果只有一个值，处理为单一概率
  if (parts.length === 1) {
    const valueStr = parts[0].trim().replace('%', '')
    const value = parseFloat(valueStr)
    if (isNaN(value)) {
      console.error('[parseProbabilityRange] 解析单值失败:', range)
      return { min: 0, max: 0, isSingleValue: true }
    }
    return { min: value, max: value, isSingleValue: true }
  }

  // 处理区间格式
  if (parts.length !== 2) {
    console.warn('[parseProbabilityRange] 概率范围格式错误:', range)
    return { min: 0, max: 0, isSingleValue: true }
  }

  const min = parseFloat(parts[0].trim().replace('%', ''))
  const max = parseFloat(parts[1].trim().replace('%', ''))

  if (isNaN(min) || isNaN(max)) {
    console.error('[parseProbabilityRange] 解析区间失败:', { range, min, max })
    return { min: 0, max: 0, isSingleValue: true }
  }

  return { min, max, isSingleValue: false }
}

// 获得经验（参考old版本实现）

// 更新经验条显示
const updateExpBar = () => {
  const expBar = document.getElementById('playerExpBar')
  const expText = document.getElementById('playerExpText')

  if (expBar && expText && player.value) {
    const percentage = (player.value.exp / player.value.maxExp) * 100
    expBar.style.width = `${percentage}%`
    expText.textContent = `${percentage.toFixed(2)}/100%`
  }
}

// 单体攻击技能效果（参考old版本实现）
const applySingleSkillEffect = skill => {
  // 查找当前目标
  let targetIndex = -1
  let targetMonster = null

  // 查找存活的怪物作为目标
  for (let i = 0; i < monsters.value.length; i++) {
    const monster = monsters.value[i]
    if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
      targetIndex = i
      targetMonster = monster
      break
    }
  }

  // 如果没有有效目标，查找第一个存活的怪物
  if (!targetMonster) {
    for (let i = 0; i < monsters.value.length; i++) {
      if (
        monsters.value[i] &&
          monsters.value[i].currentHealth > 0 &&
          !monsters.value[i].isDefeated
      ) {
        targetIndex = i
        targetMonster = monsters.value[i]
        break
      }
    }
  }

  // 如果仍然没有有效目标，直接返回
  if (!targetMonster) {
    addBattleLog(`${skill.name} 没有可攻击的目标`)
    return
  }

  // 计算技能伤害
  // 简化版伤害计算
  let baseDamage = skill.damage || 50
  // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率，截断为100%
  const critRate = Number(player.value?.criticalRate) || 0.1
  const critChance = Math.min(1, critRate)
  const isCritical = Math.random() < critChance

  if (isCritical) {
    const critMultiplier = Number(player.value?.criticalDamage) || 1.5
    baseDamage *= critMultiplier
  }

  const finalDamage = Math.max(1, Math.floor(baseDamage))

  // 应用伤害
  targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - finalDamage)
  targetMonster.healthPercentage = (targetMonster.currentHealth / targetMonster.maxHealth) * 100

  // 显示伤害数字
  showDamageNumber(targetIndex, finalDamage, isCritical, false, skill)

  // 战斗日志
  const critText = isCritical ? '暴击！' : ''
  addBattleLog(`你对${targetMonster.name}使用${skill.name}造成${finalDamage}点伤害${critText}`)

  // 检查目标是否死亡
  if (targetMonster.currentHealth <= 0) {
    targetMonster.isDefeated = true
    monsterDefeated(targetIndex, targetMonster)
    // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
    if (autoBattle.value) {
      checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
    } else {
      checkAndRefreshMonsters()
    }
  }

  // 更新UI
  updateMonsterUI(targetIndex)
}

// 群体攻击技能效果（参考old版本实现）
const applyAoeSkillEffect = skill => {
  let totalDamage = 0
  let hitCount = 0
  let defeatedEnemies = 0

  // 遍历所有怪物并造成伤害
  monsters.value.forEach((monster, index) => {
    // 跳过已死亡的怪物
    if (!monster || monster.currentHealth <= 0 || monster.isDefeated) {
      return
    }

    // 计算技能伤害
    // 简化版伤害计算
    let baseDamage = skill.damage || 50
    // criticalRate 以小数形式存储（1.0 = 100%），超过1.0表示100%+暴击率，截断为100%
    const critRate = Number(player.value?.criticalRate) || 0.1
    const critChance = Math.min(1, critRate)
    const isCritical = Math.random() < critChance

    if (isCritical) {
      const critMultiplier = Number(player.value?.criticalDamage) || 1.5
      baseDamage *= critMultiplier
    }

    const finalDamage = Math.max(1, Math.floor(baseDamage))

    // 应用伤害
    monster.currentHealth = Math.max(0, monster.currentHealth - finalDamage)
    monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

    // 累计统计
    totalDamage += finalDamage
    hitCount++

    // 显示伤害数字
    showDamageNumber(index, finalDamage, isCritical, false, skill)

    if (skill.dotEffect && finalDamage > 0) {
      applyInlineDotEffect(skill, finalDamage, monster, index)
    }

    // 检查怪物是否死亡
    if (monster.currentHealth <= 0) {
      monster.isDefeated = true
      defeatedEnemies++
      monsterDefeated(index, monster)
    }
  })

  // 记录战斗日志
  if (hitCount > 0) {
    if (defeatedEnemies > 0) {
      addBattleLog(
        `你使用${skill.name}对${hitCount}个敌人造成总计${totalDamage}点伤害，击败了${defeatedEnemies}个敌人！`
      )
    } else if (hitCount === 1) {
      addBattleLog(`你使用${skill.name}对敌人造成${totalDamage}点伤害`)
    } else {
      addBattleLog(`你使用${skill.name}对${hitCount}个敌人造成总计${totalDamage}点伤害`)
    }
  }

  // 检查是否所有怪物都已被击败
  // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
  if (autoBattle.value) {
    checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
  } else {
    checkAndRefreshMonsters()
  }

  // 更新所有怪物UI
  updateAllMonstersUI()
}

// 更新单个怪物UI — Vue 细粒度响应式自动处理，保留空函数避免调用方报错
const updateMonsterUI = () => {}

const applyInlineDotEffect = (skill, baseDamage, targetMonster, targetIndex) => {
  const dotConfig = skill?.dotEffect
  if (!dotConfig || !targetMonster || targetMonster.currentHealth <= 0) {
    return
  }
  const duration = Number(dotConfig.duration ?? 0)
  const tickInterval = Number(dotConfig.tickInterval ?? 0)
  const damageRate = Number(dotConfig.damageRate ?? 0)
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeTickInterval = Number.isFinite(tickInterval) && tickInterval > 0 ? tickInterval : 0
  const safeDamageRate = Number.isFinite(damageRate) && damageRate > 0 ? damageRate : 0
  if (safeDuration <= 0 || safeTickInterval <= 0 || safeDamageRate <= 0) {
    return
  }
  const ticks = Math.floor(safeDuration / safeTickInterval)
  if (ticks <= 0) {
    return
  }
  const totalDot = Math.max(1, Math.floor(baseDamage * safeDamageRate))
  const perTick = Math.max(1, Math.floor(totalDot / ticks))
  const dotEffect = {
    name: dotConfig.name || `${skill.name}·DOT`,
    damage: perTick,
    duration: safeDuration,
    tickInterval: safeTickInterval,
    startTime: Date.now(),
    nextTickTime: Date.now() + safeTickInterval * 1000,
    ticksRemaining: ticks,
    icon: skill.icon || '',
    skill,
    timerId: null
  }
  if (!Array.isArray(targetMonster.dotEffects)) {
    targetMonster.dotEffects = []
  }
  targetMonster.dotEffects.push(dotEffect)
  let cleaned = false
  const cleanup = () => {
    if (cleaned) {
      return
    }
    cleaned = true
    if (dotEffect.timerId !== null && dotEffect.timerId !== undefined) {
      clearTimeout(dotEffect.timerId)
      dotEffect.timerId = null
    }
    const effects = targetMonster.dotEffects
    if (Array.isArray(effects)) {
      const removeIndex = effects.indexOf(dotEffect)
      if (removeIndex !== -1) {
        effects.splice(removeIndex, 1)
      }
    }
  }
  const applyDotDamage = () => {
    // 怪物已被刷新替换时，立即清理闭包引用，防止内存泄漏
    if (monsters.value[targetIndex] !== targetMonster) {
      cleanup()
      return
    }
    if (dotEffect.ticksRemaining <= 0 || targetMonster.currentHealth <= 0) {
      cleanup()
      return
    }
    const dotDamage = perTick
    targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - dotDamage)
    targetMonster.healthPercentage = (targetMonster.currentHealth / targetMonster.maxHealth) * 100
    showDamageNumber(targetIndex, dotDamage, false, false, 'dot')
    dotEffect.ticksRemaining--
    if (targetMonster.currentHealth <= 0) {
      targetMonster.isDefeated = true
      cleanup()
      setTimeout(() => {
        monsterDefeated(targetIndex, targetMonster)
        if (autoBattle.value) {
          checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
        } else {
          checkAndRefreshMonsters()
        }
      }, 500)
      return
    }
    if (dotEffect.ticksRemaining > 0) {
      dotEffect.timerId = setTimeout(applyDotDamage, safeTickInterval * 1000)
    } else {
      cleanup()
    }
  }
  dotEffect.timerId = setTimeout(applyDotDamage, safeTickInterval * 1000)
}

// 更新所有怪物UI — Vue 细粒度响应式自动处理，保留空函数避免调用方报错
const updateAllMonstersUI = () => {}

const applySkillEffect = skill => {
  // 根据技能类型应用不同的效果（参考old版本实现）
  switch (skill.type) {
  case 'single':
    // 单体攻击技能
    applySingleSkillEffect(skill)
    break

  case 'aoe':
    // 群体攻击技能
    applyAoeSkillEffect(skill)
    break

  case 'heal':
    // 治疗技能
    // 计算治疗量（参考old版本实现）
    let healAmount = 0
    if (skill.damage !== undefined) {
      healAmount = skill.damage
    } else {
      // 默认治疗计算
      const baseHealing = skill.proficiencyEffect?.base || 50
      const levelIncrement = skill.proficiencyEffect?.increment || 20
      const intelligenceMultiplier = 5.84 // 智力乘数

      healAmount =
            baseHealing +
            levelIncrement * ((skill.proficiencyLevel || 1) - 1) +
            (player.value.stats?.intelligence || 0) * intelligenceMultiplier
    }

    // 确保治疗量为整数
    healAmount = Math.floor(healAmount)

    const oldHealth = player.value.currentHealth
    player.value.currentHealth = Math.min(
      player.value.maxHealth,
      player.value.currentHealth + healAmount
    )
    const actualHeal = player.value.currentHealth - oldHealth

    addBattleLog(`恢复${actualHeal}点生命值`)

    // 显示治疗数字
    showDamageNumber(-1, actualHeal, false, true) // 负数索引表示玩家，true表示治疗

    // 播放治疗音效
    if (gameInitializer.value && gameInitializer.value.services.audio) {
      gameInitializer.value.services.audio.playHealSFX()
    }

    // 更新玩家血条显示
    if (gameInitializer.value && gameInitializer.value.uiService) {
      gameInitializer.value.uiService.updateHealthBar(
        'playerHealthBar',
        player.value.currentHealth,
        player.value.maxHealth
      )
      gameInitializer.value.uiService.updateHealthDisplay()
    }
    break

  case 'buff':
    // BUFF技能处理（参考old版本实现）
    addBattleLog(`${skill.name} 激活！`)

    // 确保player.tempStats存在
    if (!player.value.tempStats) {
      player.value.tempStats = {}
    }

    // 根据具体技能添加相应的BUFF效果
    if (skill.buffEffect) {
      for (const [stat, value] of Object.entries(skill.buffEffect)) {
        if (!player.value.tempStats[stat]) {
          player.value.tempStats[stat] = 0
        }
        player.value.tempStats[stat] += value
      }
    }

    // 添加到活跃BUFF列表中（用于UI显示和管理）
    const buffDuration = skill.buffDuration || 30 // 默认30秒
    const newBuff = {
      skillId: skill.id || skill.key,
      name: skill.name,
      icon: skill.icon || '',
      startTime: Date.now(),
      duration: buffDuration,
      endTime: Date.now() + buffDuration * 1000,
      effect: skill.buffEffect || {}
    }

    // 添加到活跃BUFF列表
    if (player.value.activeBuffs) {
      player.value.activeBuffs.push(newBuff)
    }

    // 设置BUFF定时器，在BUFF结束时移除效果
    setTimeout(() => {
      // 移除BUFF效果
      if (skill.buffEffect && player.value.tempStats) {
        for (const [stat, value] of Object.entries(skill.buffEffect)) {
          if (player.value.tempStats[stat]) {
            player.value.tempStats[stat] -= value
          }
        }
      }

      // 从活跃BUFF列表中移除
      if (player.value.activeBuffs) {
        player.value.activeBuffs = player.value.activeBuffs.filter(
          buff => buff.name !== skill.name
        )
      }

      addBattleLog(`${skill.name} 效果消失`)

      // 更新玩家属性显示
      if (gameInitializer.value && gameInitializer.value.uiService) {
        gameInitializer.value.uiService.updateAttributeUI()
      }
    }, buffDuration * 1000)

    // 播放BUFF音效
    if (gameInitializer.value && gameInitializer.value.services.audio) {
      gameInitializer.value.services.audio.playBuffSFX()
    }

    // 立即更新玩家属性显示
    if (gameInitializer.value && gameInitializer.value.uiService) {
      gameInitializer.value.uiService.updateAttributeUI()
    }
    break

  case 'dot':
    // DOT技能处理（参考old版本实现）
    addBattleLog(`${player.value.name} 使用 ${skill.name}`)

    // 获取当前目标
    let targetIndex = -1
    let targetMonster = null

    // 查找当前目标
    for (let i = 0; i < monsters.value.length; i++) {
      if (
        monsters.value[i] &&
            monsters.value[i].currentHealth > 0 &&
            !monsters.value[i].isDefeated
      ) {
        targetIndex = i
        targetMonster = monsters.value[i]
        break
      }
    }

    if (targetMonster) {
      // 计算初始伤害
      // 简化版伤害计算
      let initialDamage = skill.damage || 50
      const isCritical = Math.random() < 0.1 // 10%暴击率

      if (isCritical) {
        initialDamage *= 1.5 // 1.5倍暴击伤害
      }

      initialDamage = Math.max(1, Math.floor(initialDamage))

      targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - initialDamage)
      targetMonster.healthPercentage =
            (targetMonster.currentHealth / targetMonster.maxHealth) * 100

      showDamageNumber(targetIndex, initialDamage, isCritical)

      addBattleLog(
        `${player.value.name} 对 ${targetMonster.name} 使用 ${skill.name} 造成 ${initialDamage} ${isCritical ? '暴击' : ''}伤害`
      )

      // 播放攻击音效
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        gameInitializer.value.services.audio.playAttackSFX()
      }

      if (targetMonster.currentHealth <= 0) {
        targetMonster.isDefeated = true
        setTimeout(() => {
          monsterDefeated(targetIndex, targetMonster)
          // 检查是否所有怪物都已被击败，如果是则获取新一批怪物
          // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
          if (autoBattle.value) {
            checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
          } else {
            checkAndRefreshMonsters()
          }
        }, 500)
        break
      }

      // 应用DOT效果
      const dotDuration = skill.duration || 9 // 默认持续时间9秒
      const dotTickInterval = skill.tickInterval || 0.5 // 默认每0.5秒触发一次

      // 创建DOT效果对象
      const dotEffect = {
        name: skill.name,
        damage: skill.dotDamage || initialDamage, // DOT伤害
        duration: dotDuration,
        tickInterval: dotTickInterval,
        startTime: Date.now(),
        nextTickTime: Date.now() + dotTickInterval * 1000,
        ticksRemaining: Math.floor(dotDuration / dotTickInterval),
        icon: skill.icon || '',
        skill,
        timerId: null
      }
      if (!Array.isArray(targetMonster.dotEffects)) {
        targetMonster.dotEffects = []
      }
      targetMonster.dotEffects.push(dotEffect)
      let dotCleaned = false

      // 应用DOT伤害（模拟持续伤害）
      const applyDotDamage = () => {
        if (monsters.value[targetIndex] !== targetMonster) {
          if (!dotCleaned) {
            dotCleaned = true
            if (dotEffect.timerId !== null && dotEffect.timerId !== undefined) {
              clearTimeout(dotEffect.timerId)
              dotEffect.timerId = null
            }
            const effects = targetMonster.dotEffects
            if (Array.isArray(effects)) {
              const removeIndex = effects.indexOf(dotEffect)
              if (removeIndex !== -1) {
                effects.splice(removeIndex, 1)
              }
            }
          }
          return
        }
        if (dotEffect.ticksRemaining > 0 && targetMonster.currentHealth > 0) {
          // 计算DOT伤害 - 圣职者月光惩戒：每次造成约2.78%的初始伤害（总伤害约50%）
          const dotDamage = Math.max(1, Math.floor(dotEffect.damage * (1 / 18)))

          targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - dotDamage)
          targetMonster.healthPercentage =
                (targetMonster.currentHealth / targetMonster.maxHealth) * 100

          showDamageNumber(targetIndex, dotDamage, false, false, 'dot') // 显示DOT伤害
          dotEffect.ticksRemaining--

          if (targetMonster.currentHealth <= 0) {
            targetMonster.isDefeated = true
            if (!dotCleaned) {
              dotCleaned = true
              if (dotEffect.timerId !== null && dotEffect.timerId !== undefined) {
                clearTimeout(dotEffect.timerId)
                dotEffect.timerId = null
              }
              const effects = targetMonster.dotEffects
              if (Array.isArray(effects)) {
                const removeIndex = effects.indexOf(dotEffect)
                if (removeIndex !== -1) {
                  effects.splice(removeIndex, 1)
                }
              }
            }
            setTimeout(() => {
              monsterDefeated(targetIndex, targetMonster)
              // 检查是否所有怪物都已被击败，如果是则获取新一批怪物
              // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
              if (autoBattle.value) {
                checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
              } else {
                checkAndRefreshMonsters()
              }
            }, 500)
          } else if (dotEffect.ticksRemaining > 0) {
            // 继续应用DOT伤害
            dotEffect.timerId = setTimeout(applyDotDamage, dotTickInterval * 1000)
          } else if (!dotCleaned) {
            dotCleaned = true
            if (dotEffect.timerId !== null && dotEffect.timerId !== undefined) {
              clearTimeout(dotEffect.timerId)
              dotEffect.timerId = null
            }
            const effects = targetMonster.dotEffects
            if (Array.isArray(effects)) {
              const removeIndex = effects.indexOf(dotEffect)
              if (removeIndex !== -1) {
                effects.splice(removeIndex, 1)
              }
            }
          }
        }
      }

      // 启动DOT伤害应用
      dotEffect.timerId = setTimeout(applyDotDamage, dotTickInterval * 1000)
    }
    break

  default:
    // 攻击技能
    // 根据技能类型决定攻击方式（单体或AOE）
    if (skill.type === 'single') {
      // 单体攻击技能
      // 选择当前目标或第一个存活的怪物
      let targetIndex = -1
      let targetMonster = null

      // 查找当前目标
      for (let i = 0; i < monsters.value.length; i++) {
        if (
          monsters.value[i] &&
              monsters.value[i].currentHealth > 0 &&
              !monsters.value[i].isDefeated
        ) {
          targetIndex = i
          targetMonster = monsters.value[i]
          break
        }
      }

      if (targetMonster) {
        // 计算技能伤害（改进版，参考old版本实现）
        let damage = 0
        let isCritical = false

        // 基础伤害：技能伤害 + 玩家攻击力
        const baseDamage =
              (skill.damage || 50) +
              (Math.floor((player.value.minAttack + player.value.maxAttack) / 2) || 10)

        // 暴击判断（10%暴击率）
        if (Math.random() < 0.1) {
          isCritical = true
          damage = Math.floor(baseDamage * 1.5) // 1.5倍暴击伤害
        } else {
          damage = Math.floor(baseDamage)
        }

        // 考虑怪物防御
        const monsterDefense =
              Math.floor((targetMonster.minDefense + targetMonster.maxDefense) / 2) || 0
        damage = Math.max(1, damage - monsterDefense)

        // 等级修正（如果玩家等级低于怪物等级）
        const playerLevel = player.value.level || 1
        const monsterLevel = targetMonster.level || 1
        if (playerLevel < monsterLevel) {
          const levelDifference = monsterLevel - playerLevel
          const levelPenalty = 0.05 * levelDifference // 每级5%惩罚
          damage = Math.max(1, Math.floor(damage * (1 - levelPenalty)))
        }

        targetMonster.currentHealth = Math.max(0, targetMonster.currentHealth - damage)
        targetMonster.healthPercentage =
              (targetMonster.currentHealth / targetMonster.maxHealth) * 100

        showDamageNumber(targetIndex, damage, isCritical)

        addBattleLog(
          `${player.value.name} 对 ${targetMonster.name} 使用 ${skill.name} 造成 ${damage} ${isCritical ? '暴击' : ''}伤害`
        )

        // 播放攻击音效
        if (gameInitializer.value && gameInitializer.value.services.audio) {
          gameInitializer.value.services.audio.playAttackSFX()
        }

        if (targetMonster.currentHealth <= 0) {
          targetMonster.isDefeated = true
          setTimeout(() => {
            monsterDefeated(targetIndex, targetMonster)
            // 检查是否所有怪物都已被击败，如果是则获取新一批怪物
            // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
            if (autoBattle.value) {
              checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
            } else {
              checkAndRefreshMonsters()
            }
          }, 500)
        }
      }
    } else {
      // 默认为AOE攻击技能
      // 攻击所有怪物
      let totalDamage = 0
      let hitCount = 0
      let defeatedEnemies = 0

      monsters.value.forEach((monster, index) => {
        if (monster && monster.currentHealth > 0 && !monster.isDefeated) {
          // 计算技能伤害（改进版，参考old版本实现）
          let damage = 0
          let isCritical = false

          // 基础伤害：技能伤害 + 玩家攻击力
          const baseDamage =
                (skill.damage || 50) +
                (Math.floor((player.value.minAttack + player.value.maxAttack) / 2) || 10)

          // 暴击判断（10%暴击率）
          if (Math.random() < 0.1) {
            isCritical = true
            damage = Math.floor(baseDamage * 1.5) // 1.5倍暴击伤害
          } else {
            damage = Math.floor(baseDamage)
          }

          // 考虑怪物防御
          const monsterDefense = Math.floor((monster.minDefense + monster.maxDefense) / 2) || 0
          damage = Math.max(1, damage - monsterDefense)

          // 等级修正（如果玩家等级低于怪物等级）
          const playerLevel = player.value.level || 1
          const monsterLevel = monster.level || 1
          if (playerLevel < monsterLevel) {
            const levelDifference = monsterLevel - playerLevel
            const levelPenalty = 0.05 * levelDifference // 每级5%惩罚
            damage = Math.max(1, Math.floor(damage * (1 - levelPenalty)))
          }
 
          monster.currentHealth = Math.max(0, monster.currentHealth - damage)
          monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

          showDamageNumber(index, damage, isCritical)

          totalDamage += damage
          hitCount++

          if (monster.currentHealth <= 0) {
            monster.isDefeated = true
            defeatedEnemies++
            setTimeout(() => {
              monsterDefeated(index, monster)
              // 检查是否所有怪物都已被击败，如果是则获取新一批怪物
              // 根据自动战斗状态决定是否在刷新怪物后重新启动自动战斗
              if (autoBattle.value) {
                checkAndRefreshMonsters(refreshMonstersAndStartAutoBattle)
              } else {
                checkAndRefreshMonsters()
              }
            }, 500)
          }
        }
      })

      if (hitCount > 0) {
        if (defeatedEnemies > 0) {
          addBattleLog(
            `${player.value.name} 使用 ${skill.name} 对 ${hitCount} 个敌人造成总计 ${totalDamage} 伤害，击败了 ${defeatedEnemies} 个敌人！`
          )
        } else if (hitCount === 1) {
          addBattleLog(`${player.value.name} 使用 ${skill.name} 对敌人造成 ${totalDamage} 伤害`)
        } else {
          addBattleLog(
            `${player.value.name} 使用 ${skill.name} 对 ${hitCount} 个敌人造成总计 ${totalDamage} 伤害`
          )
        }
      }

      // 播放AOE攻击音效
      if (gameInitializer.value && gameInitializer.value.services.audio) {
        gameInitializer.value.services.audio.playAOESFX()
      }
    }
  }
}

// 物品相关方法
// useItem 已通过 useItems() 组合式函数提供

const selectMap = map => {
  currentMap.value = map
  addBattleLog(`切换到地图: ${map.name}`)
}

// 显示副本面板
const showDungeonPanel = dungeon => {
  // 创建 StorageService 实例用于保存数据
  const dungeonStorageService = storageServiceSingleton

  // 移除旧面板
  const existing = document.getElementById('dungeonPanel')
  if (existing) {
    existing.remove()
  }

  const panel = document.createElement('div')
  panel.id = 'dungeonPanel'
  panel.className = 'dungeon-panel'
  panel.style.cssText = `
    position: fixed;
    z-index: 10000;
    background: rgb(0 0 0  / 30%);
    border-radius: 12px;
    padding: 20px;
    width: 400px;
    color: rgba(255 255 255 / 80%);
    backdrop-filter: blur(10px);
    user-select: none;
    animation: dungeonPanelFadeIn 0.3s ease-out;
  `

  // 定位在屏幕中央
  panel.style.left = '50%'
  panel.style.top = '50%'
  panel.style.transform = 'translate(-50%, -50%) scale(0.9)'
  panel.style.opacity = '0'

  // 使用 requestAnimationFrame 触发动画
  requestAnimationFrame(() => {
    panel.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out'
    panel.style.transform = 'translate(-50%, -50%) scale(1)'
    panel.style.opacity = '1'
  })

  // 头部 - 标题 + 关闭（可拖拽）
  const header = document.createElement('div')
  header.style.cssText =
      'display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; cursor: move; user-select: none;'
  const title = document.createElement('div')
  title.style.cssText = 'font-weight:bold; font-size: 20px; color: rgb(255 255 255);'
  title.textContent = dungeon.name
  const closeBtn = document.createElement('button')
  closeBtn.textContent = '×'
  closeBtn.style.cssText = `
    width: 32px; height: 32px; border:none; border-radius:50%; cursor:pointer;
    background:rgb(255 255 255 /50%); color:#fff; font-size: 20px; font-weight: bold;
    transition: all 0.3s ease;
  `
  closeBtn.onmouseover = () => {
    closeBtn.style.background = '#9ccabb'
  }
  closeBtn.onmouseout = () => {
    closeBtn.style.background = 'rgb(255 255 255 / 50%)'
  }
  // 关闭按钮带淡出动画
  closeBtn.onclick = () => {
    clearInterval(timerUpdateInterval)
    panel.style.transform = 'translate(-50%, -50%) scale(0.9)'
    panel.style.opacity = '0'
    setTimeout(() => panel.remove(), 300)
  }
  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // 拖拽功能
  let isDragging = false
  let dragStartX = 0
  let dragStartY = 0
  let panelStartX = 0
  let panelStartY = 0

  const handleMouseMove = e => {
    if (!isDragging) return
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    panel.style.left = `${panelStartX + dx}px`
    panel.style.top = `${panelStartY + dy}px`
  }

  const handleMouseUp = () => {
    isDragging = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  header.onmousedown = e => {
    if (e.target === closeBtn) return
    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY

    // 获取当前位置并移除 transform
    const rect = panel.getBoundingClientRect()
    panelStartX = rect.left
    panelStartY = rect.top

    // 立即应用实际位置，移除 transform
    panel.style.left = `${panelStartX}px`
    panel.style.top = `${panelStartY}px`
    panel.style.transform = 'none'

    // 添加事件监听器
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    e.preventDefault()
  }

  // 副本图片展示
  const dungeonImageContainer = document.createElement('div')
  dungeonImageContainer.style.cssText = 'text-align: center; margin-bottom: 15px;'

  const dungeonImage = document.createElement('img')
  dungeonImage.id = 'dungeonImage-' + dungeon.name.replace(/[^a-zA-Z0-9]/g, '')
  dungeonImage.src = dungeon.image || '/pt/map/fuben/duoluoshengyu.png'
  dungeonImage.alt = dungeon.name
  dungeonImage.draggable = false
  dungeonImage.style.cssText =
      'width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #4a4a8a; transition: border-color 0.3s ease;'
  dungeonImage.onerror = () => {
    dungeonImage.src = '/pt/map/fuben/duoluoshengyu.png'
  }

  dungeonImageContainer.appendChild(dungeonImage)
  panel.appendChild(dungeonImageContainer)

  // NPC 行
  const npcRow = document.createElement('div')
  npcRow.style.cssText =
      'display:flex; align-items:center; gap:15px; margin-bottom:15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;'
  const npcImg = document.createElement('img')
  npcImg.src = dungeon.npcImage || '/pt/map/fuben/fuben_npc1.png'
  npcImg.alt = '副本NPC'
  npcImg.draggable = false
  npcImg.onerror = () => {
    npcImg.src = '/pt/map/fuben/fuben_npc1.png'
    npcImg.onerror = () => {
      npcImg.src = '/pt/map/fuben/default_dungeon.png'
      npcImg.onerror = null
    }
  }
  npcImg.style.cssText = 'width:100px; height:100px;border-right-style: outset;'

  const npcInfo = document.createElement('div')
  npcInfo.innerHTML = `
    <div style="font-weight: bold; font-size: 20px;">${dungeon.npcName || '副本NPC'}</div>
    <div style="font-size: 15px; color: #aaa;">勇士, 请选择您挑战的难度!</div>
    <div style="font-size: 14px; color: #aaa;">进入等级: ${dungeon.levelRange}</div>
    ${dungeon.timeLimit ? `<div style="font-size: 14px; color: #aaa;">副本时限: ${dungeon.timeLimit}</div>` : ''}
    ${dungeon.cooldown ? `<div style="font-size: 14px; color: #aaa;">副本冷却时间: ${dungeon.cooldown}</div>` : ''}
    ${dungeon.cost ? `<div style="font-size: 14px; color: #aaa;">进入消耗: ${dungeon.cost}金币</div>` : ''}
    ${dungeon.npcIntroduction ? `<div style="font-size: 14px; color: #aaa;">${dungeon.npcIntroduction}</div>` : ''}
    <div style="font-size: 12px; color: #aaa;">确保背包格子至少>20个</div>
  `
  npcRow.appendChild(npcImg)
  npcRow.appendChild(npcInfo)
  panel.appendChild(npcRow)

  // 副本计时器状态显示区域（显示当前倒计时或CD剩余时间，实时更新）
  const timerStatusDiv = document.createElement('div')
  timerStatusDiv.style.cssText = `
    margin-bottom: 15px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    font-weight: bold;
  `
  panel.appendChild(timerStatusDiv)

  /**
   * 格式化秒数为可读时间字符串
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   */
  const formatTimerStr = (seconds) => {
    const safe = Math.max(0, Math.floor(seconds))
    const h = Math.floor(safe / 3600)
    const m = Math.floor((safe % 3600) / 60)
    const s = safe % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  /**
   * 更新副本计时器状态显示
   * 根据当前副本状态（活跃期/CD期/可进入）显示不同信息和样式
   */
  const updateTimerStatus = () => {
    const stateInfo = getDungeonStateForPanel(dungeon.id)
    if (stateInfo.state === 'active') {
      const remainingSec = Math.ceil(stateInfo.remainingMs / 1000)
      timerStatusDiv.textContent = `副本进行中 - 剩余时间: ${formatTimerStr(remainingSec)}`
      timerStatusDiv.style.background = 'rgba(76, 175, 80, 0.15)'
      timerStatusDiv.style.color = '#4caf50'
      timerStatusDiv.style.border = '1px solid rgba(76, 175, 80, 0.4)'
    } else if (stateInfo.state === 'cooldown') {
      const remainingSec = Math.ceil(stateInfo.remainingMs / 1000)
      timerStatusDiv.textContent = `副本冷却中 - CD剩余: ${formatTimerStr(remainingSec)}`
      timerStatusDiv.style.background = 'rgba(231, 76, 60, 0.15)'
      timerStatusDiv.style.color = '#e74c3c'
      timerStatusDiv.style.border = '1px solid rgba(231, 76, 60, 0.4)'
    } else {
      timerStatusDiv.textContent = '副本可进入'
      timerStatusDiv.style.background = 'rgba(255, 255, 255, 0.08)'
      timerStatusDiv.style.color = '#aaa'
      timerStatusDiv.style.border = '1px solid rgba(255, 255, 255, 0.15)'
    }
  }

  // 从 useDungeonTimer 获取 getDungeonState 用于面板显示
  const { getDungeonState: getDungeonStateForPanel } = useDungeonTimer()

  // 初始渲染计时器状态
  updateTimerStatus()

  // 每秒更新计时器状态
  const timerUpdateInterval = setInterval(() => {
    // 如果面板已被移除，停止定时器
    if (!document.getElementById('dungeonPanel')) {
      clearInterval(timerUpdateInterval)
      return
    }
    updateTimerStatus()
  }, 1000)

  // 导入副本难度配置
  const { getDungeonDifficultyConfig, getDungeonMonstersByDifficulty } = useMap(computed(() => props.gameData), computed(() => props.currentMap))
  const difficultyConfig = getDungeonDifficultyConfig(dungeon.name)

  // 检测是否隐藏难度选择器（如深渊之塔只有一个普通难度）
  const hideDifficultySelector = difficultyConfig?.hideDifficultySelector || false

  // 难度选择标题
  const difficultyTitle = document.createElement('div')
  difficultyTitle.textContent = '选择难度:'
  difficultyTitle.style.cssText =
      'margin: 15px 0 8px; font-weight: bold; color:  rgb(255 255 255);'
  
  // 只有非隐藏难度选择器时才显示标题
  if (!hideDifficultySelector) {
    panel.appendChild(difficultyTitle)
  }

  // 难度选择按钮组
  const difficultyContainer = document.createElement('div')
  difficultyContainer.style.cssText =
      'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;'
  
  // 根据副本配置确定可用的难度选项
  let difficulties = []
  let selectedDifficulty = ''
  
  if (difficultyConfig) {
    // 使用配置中的难度
    difficulties = difficultyConfig.difficulties.map(diff => ({
      name: diff.name,
      color: 'rgb(0 0 0 / 30%)',
      multiplier: diff.dropRateMultiplier,
      levelRange: diff.levelRange
    }))
    selectedDifficulty = difficultyConfig.defaultDifficulty || difficulties[0]?.name || '普通'
  } else if (dungeon.name === '飞龙[地牢]' || dungeon.name === '赤红飞龙[地牢]') {
    difficulties = [
      { name: '简单', color: 'rgb(0 0 0 / 30%)', multiplier: 0.5 },
      { name: '普通', color: 'rgb(0 0 0 / 30%)', multiplier: 1.0 },
      { name: '困难', color: 'rgb(0 0 0 / 30%)', multiplier: 2.0 },
      { name: '地狱', color: 'rgb(0 0 0 / 30%)', multiplier: 5.0 }
    ]
    selectedDifficulty = '普通'
  } else {
    difficulties = [
      { name: '普通', color: 'rgb(0 0 0 / 30%)', multiplier: 1.0 },
      { name: '噩梦', color: 'rgb(0 0 0 / 30%)', multiplier: 2.0 },
      { name: '诅咒', color: 'rgb(0 0 0 / 30%)', multiplier: 3.0 },
      { name: '地狱', color: 'rgb(0 0 0 / 30%)', multiplier: 4.0 }
    ]
    selectedDifficulty = '普通'
  }

  // 副本怪物信息标题
  const monstersTitle = document.createElement('div')
  monstersTitle.textContent = '副本怪物:'
  monstersTitle.style.cssText = 'margin: 15px 0 8px; font-weight: bold; color:rgb(255 255 255)'
  panel.appendChild(monstersTitle)

  // 副本怪物信息展示容器
  const monstersContainer = document.createElement('div')
  monstersContainer.className = 'dungeon-monsters-container'
  monstersContainer.style.cssText =
      'max-height: 180px; overflow-y: auto; background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 15px;'

  // 获取怪物详细信息（优先使用配置中的名称）
  const monstersStore = useMonstersStore()
  
  /**
   * 获取怪物信息
   * @param {Object} monsterData - 怪物数据
   * @returns {Object} 怪物信息
   */
  const getMonsterInfo = monsterData => {
    const monsterId = String(monsterData.id)
    const monster = monstersStore.staticMonsters[monsterId]
    if (monsterData.name) {
      return {
        id: monsterId,
        name: monsterData.name,
        level: monsterData.level || monster?.level || 1,
        rank: monsterData.rank || monster?.rank || 'normal',
        hp: monsterData.hp || monster?.hp || 0
      }
    }
    if (monster) {
      return {
        id: monsterId,
        name: monster.name?.cns || monster.name || `怪物${monsterId}`,
        level: monster.level || 1,
        rank: monster.rank || 'normal',
        hp: monster.hp || 0
      }
    }
    return { id: monsterId, name: `怪物${monsterId}`, level: 1, rank: 'normal', hp: 0 }
  }

  /**
   * 渲染怪物列表
   * @param {Array} monstersList - 怪物列表
   */
  const renderMonsters = monstersList => {
    monstersContainer.innerHTML = ''
    
    if (!monstersList || monstersList.length === 0) {
      monstersContainer.innerHTML =
          '<div style="text-align: center; color: #aaa; padding: 10px;">暂无怪物信息</div>'
      return
    }

    const monstersGrid = document.createElement('div')
    monstersGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;'

    monstersList.forEach(monsterData => {
      const monsterInfo = getMonsterInfo(monsterData)
      const monsterItem = document.createElement('div')
      monsterItem.style.cssText =
          'display: flex; align-items: center; gap: 5px; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 4px;'

      const monsterImg = document.createElement('img')
      monsterImg.src = `/pt/monster_icon/${monsterInfo.id}.png`
      monsterImg.alt = monsterInfo.name
      monsterImg.draggable = false
      monsterImg.style.cssText = 'width: 32px; height: 32px; border-radius: 4px; cursor: pointer;'
      monsterImg.onerror = () => {
        monsterImg.src = '/pt/monster_icon/2087.png'
        monsterImg.onerror = null
      }

      // 鼠标悬停显示怪物详情
      monsterImg.onmouseenter = event => {
        window.dispatchEvent(new CustomEvent('show-monster-tooltip', {
          detail: {
            monsterId: monsterInfo.id,
            position: { x: event.clientX, y: event.clientY }
          }
        }))
      }

      monsterImg.onmousemove = event => {
        window.dispatchEvent(new CustomEvent('move-monster-tooltip', {
          detail: {
            position: { x: event.clientX, y: event.clientY }
          }
        }))
      }

      monsterImg.onmouseleave = () => {
        window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
      }

      monsterImg.onclick = event => {
        console.log('副本面板点击怪物头像, monsterInfo:', monsterInfo)
        window.dispatchEvent(new CustomEvent('show-monster-drops-panel', {
          detail: {
            monsterId: monsterInfo.id,
            position: { x: event.clientX - 250, y: event.clientY }
          }
        }))
      }

      const monsterNameColor = monstersStore.getMonsterRankColor(monsterInfo.rank)

      const monsterText = document.createElement('div')
      monsterText.innerHTML = `
        <div style="font-size: 12px; font-weight: bold; color: ${monsterNameColor};">${monsterInfo.name}</div>
        <div style="font-size: 10px; color: #aaa;">Lv.${monsterInfo.level} ×${monsterData.count}</div>
      `

      monsterItem.appendChild(monsterImg)
      monsterItem.appendChild(monsterText)
      monstersGrid.appendChild(monsterItem)
    })

    monstersContainer.appendChild(monstersGrid)
  }

  // 初始渲染怪物列表
  let currentMonsters = []
  if (difficultyConfig) {
    // 使用动态怪物列表
    currentMonsters = getDungeonMonstersByDifficulty(dungeon, selectedDifficulty)
  } else {
    currentMonsters = dungeon.monsters || []
  }
  renderMonsters(currentMonsters)
  panel.appendChild(monstersContainer)

  // 只有非隐藏难度选择器时才创建难度按钮
  if (!hideDifficultySelector) {
    difficulties.forEach(diff => {
      const diffBtn = document.createElement('button')
      // 显示难度名称和等级范围
      const levelText = diff.levelRange ? ` (${diff.levelRange[0]}-${diff.levelRange[1]})` : ''
      // 判断是否为地牢（名称包含[地牢]），如果是则显示掉率
      const isDungeon = dungeon.name && dungeon.name.includes('[地牢]')
      const dropRateText = isDungeon && diff.multiplier ? ` 掉率${Math.round(diff.multiplier * 100)}%` : ''
      diffBtn.textContent = diff.name + levelText + dropRateText
      diffBtn.style.cssText = `
        padding: 10px;
        border-radius: 8px;
        background: ${diff.color};
        color: #fff;
        border: none;
        border-bottom: 4px solid transparent;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        font-size: 12px;
      `

      diffBtn.onmouseover = () => {
        diffBtn.style.transform = 'scale(1.05)'
        diffBtn.style.boxShadow = `0 0 10px ${diff.color}`
      }

      diffBtn.onmouseout = () => {
        diffBtn.style.transform = 'scale(1)'
        diffBtn.style.boxShadow = 'none'
      }

      diffBtn.onclick = () => {
        selectedDifficulty = diff.name
        // 更新所有按钮样式
        difficultyContainer.querySelectorAll('button').forEach(btn => {
          btn.style.borderBottom = '4px solid transparent'
        })
        diffBtn.style.borderBottom = '4px solid rgb(183 245 0 / 80%)'
        
        // 根据难度更新怪物列表
        if (difficultyConfig) {
          const newMonsters = getDungeonMonstersByDifficulty(dungeon, selectedDifficulty)
          renderMonsters(newMonsters)
        }
        
        // 更新进入按钮状态（通过自定义事件）
        panel.dispatchEvent(new CustomEvent('difficulty-changed'))
      }

      // 默认选中当前难度
      if (diff.name === selectedDifficulty) {
        diffBtn.style.borderBottom = '4px solid rgb(183 245 0 / 80%)'
      }

      difficultyContainer.appendChild(diffBtn)
    })

    panel.appendChild(difficultyContainer)
  }

  /**
   * 检查玩家等级和金币是否符合进入要求
   * @param {Object} diff - 难度配置
   * @returns {Object} { canEnter: boolean, reason: string }
   */
  const checkPlayerLevel = diff => {
    const playerLevel = player.value?.level || 1
    const playerGold = player.value?.gold || 0
    const dungeonCost = parseInt(dungeon.cost) || 0
    
    // 检查等级范围
    if (diff.levelRange) {
      const [minLevel, maxLevel] = diff.levelRange
      if (playerLevel < minLevel) {
        return { canEnter: false, reason: `等级不足 (需要${minLevel}级)` }
      }
      if (playerLevel > maxLevel) {
        return { canEnter: false, reason: `等级超出 (上限${maxLevel}级)` }
      }
    }
    
    // 检查金币是否足够
    if (dungeonCost > 0 && playerGold < dungeonCost) {
      return { canEnter: false, reason: `金币不足 (需要${dungeonCost.toLocaleString()})` }
    }

    // 检查副本CD状态（活跃期内允许自由重入，CD期间不可进入）
    const cdCheck = checkDungeonCooldown(dungeon.id)
    if (!cdCheck.canEnter) {
      return { canEnter: false, reason: cdCheck.reason }
    }
    
    return { canEnter: true, reason: '' }
  }

  // 进入按钮容器（用于放置按钮和原因提示）
  const enterBtnContainer = document.createElement('div')
  enterBtnContainer.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
  `

  // 进入按钮
  const enterBtn = document.createElement('button')
  enterBtn.className = 'enter-dungeon-button'
  enterBtn.style.cssText = `
    flex: 1;
    padding: 12px;
    background: rgb(0 0 0 / 50%);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
  `

  // 原因提示（右侧显示不可进入原因）
  const reasonSpan = document.createElement('span')
  reasonSpan.style.cssText = `
    color: #ff6b6b;
    font-size: 14px;
    white-space: nowrap;
    display: none;
  `

  /**
   * 更新进入按钮状态
   */
  const updateEnterButton = () => {
    // 获取当前选中的难度配置
    const currentDiff = difficulties.find(d => d.name === selectedDifficulty)
    const checkResult = checkPlayerLevel(currentDiff)
    
    if (checkResult.canEnter) {
      enterBtn.disabled = false
      enterBtn.textContent = '进入副本'
      enterBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: rgb(0 0 0 / 50%);
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
      `
      enterBtn.onmouseover = () => {
        enterBtn.style.background = 'rgb(152 181 177)'
        enterBtn.style.boxShadow = '0 6px 20px rgba(0, 118, 253, 0.5)'
        enterBtn.style.transform = 'translateY(-2px)'
      }
      enterBtn.onmouseout = () => {
        enterBtn.style.background = 'rgba(0,0,0,0.5)'
        enterBtn.style.boxShadow = '0 4px 15px rgba(2, 2, 2, 0.3)'
        enterBtn.style.transform = 'translateY(0)'
      }
      // 隐藏原因提示
      reasonSpan.style.display = 'none'
      reasonSpan.textContent = ''
    } else {
      enterBtn.disabled = true
      enterBtn.textContent = '进入副本'
      enterBtn.style.cssText = `
        flex: 1;
        padding: 12px;
        background: rgba(100, 100, 100, 0.5);
        color: rgba(255, 255, 255, 0.5);
        border: none;
        border-radius: 8px;
        cursor: not-allowed;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        box-shadow: none;
      `
      enterBtn.onmouseover = null
      enterBtn.onmouseout = null
      // 显示原因提示在按钮右侧
      reasonSpan.style.display = 'inline'
      reasonSpan.textContent = checkResult.reason
    }
  }

  enterBtn.onclick = () => {
    const dungeonCost = parseInt(dungeon.cost) || 0

    // 扣除金币（如果有消耗）
    if (dungeonCost > 0) {
      player.value.gold -= dungeonCost
      addBattleLog(`进入副本扣除金币: ${dungeonCost.toLocaleString()}`)
      // 保存到 localStorage
      dungeonStorageService.savePlayerPatch({ gold: player.value.gold })
    }

    // 进入副本逻辑 - 跳转到副本战斗页面
    addBattleLog(`进入副本: ${dungeon.name} (${selectedDifficulty}难度)`)
    clearInterval(timerUpdateInterval)
    panel.remove()

    // 记录副本进入（设置倒计时时间线和CD，活跃期内重入不重置）
    recordDungeonEntry(dungeon.id, dungeon.timeLimit, dungeon.cooldown)

    // 关闭地图面板
    closeMapModal()

    // 跳转到副本战斗页面，传递副本ID和难度
    router.push(`/dungeon/${dungeon.id}?difficulty=${encodeURIComponent(selectedDifficulty)}`)
  }
  
  // 初始化进入按钮状态
  updateEnterButton()
  
  // 监听难度变化事件，更新进入按钮状态
  panel.addEventListener('difficulty-changed', () => {
    updateEnterButton()
  })
  
  enterBtnContainer.appendChild(enterBtn)
  enterBtnContainer.appendChild(reasonSpan)
  panel.appendChild(enterBtnContainer)

  // 防止事件冒泡
  panel.addEventListener('click', e => {
    e.stopPropagation()
  })

  document.body.appendChild(panel)
}

// 显示怪物详情
const showMonsterDetails = monsterId => {
  addBattleLog(`查看怪物详情: ID ${monsterId}`)
}

// 显示怪物掉落物品面板（通过自定义事件触发 MonsterDropsPanel 组件）
const showMonsterDropsPanel = (monsterId, event) => {
  const position = event
    ? { x: event.clientX - 250, y: event.clientY }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2 }

  window.dispatchEvent(
    new CustomEvent('show-monster-drops-panel', {
      detail: { monsterId, position }
    })
  )
}

// 显示怪物详情提示框（使用 MonsterTooltip 组件）
  const showMonsterTooltip = (event, monsterId) => {
    window.dispatchEvent(
      new CustomEvent('show-monster-tooltip', {
        detail: {
          monsterId,
          position: { x: event.clientX, y: event.clientY }
        }
      })
    )
  }

  // 移动怪物详情提示框
  const moveMonsterTooltip = event => {
    window.dispatchEvent(
      new CustomEvent('move-monster-tooltip', {
        detail: {
          position: { x: event.clientX, y: event.clientY }
        }
      })
    )
  }

  // 隐藏怪物详情提示框
  const hideMonsterTooltip = () => {
    window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
  }

  // 获取物品套装信息
const getItemSetInfo = itemId => {
  // 从store获取套装数据和装备信息
  const gameStore = useGameStore()
  const setData = gameStore.equipmentSets || {}
  const playerEquipment = Object.values(gameStore.equipment).filter(item => item !== null)

  // 查找包含当前物品的套装
  const sets =
      typeof setData === 'object' && !Array.isArray(setData)
        ? Object.values(setData)
        : Array.isArray(setData)
          ? setData
          : []
  const targetSet = sets.find(
    set => Array.isArray(set.parts) && set.parts.some(partId => Number(partId) === Number(itemId))
  )

  if (!targetSet) {
    return null
  }

  // 获取玩家装备信息（如果可用）
  const equippedIds = playerEquipment.map(eq => Number(eq.id))
  const equippedCount = targetSet.parts.filter(partId =>
    equippedIds.some(equippedId => Number(equippedId) === Number(partId))
  ).length

  // 使用SetBonusService格式化套装效果文本
  const setBonusService = new SetBonusService()

  // 转换套装效果格式
  return {
    name: targetSet.name?.cns || '未知套装',
    requiredCount: targetSet.parts?.length || 0,
    equippedCount,
    partNames: targetSet.parts.map(partId => {
      // 查找对应的物品信息，按优先级顺序查找
      let item = null

      // 1. 首先从window.itemData中查找
      if (
        window.itemData &&
          typeof window.itemData === 'object' &&
          !Array.isArray(window.itemData)
      ) {
        item = window.itemData[partId] || window.itemData[String(partId)]
      } else if (window.itemData && Array.isArray(window.itemData)) {
        item = window.itemData.find(i => Number(i.id) === Number(partId))
      }

      // 2. 如果没找到，从itemsStore.staticItems中查找
      if (!item) {
        const itemsStore = useItemsStore()
        if (
          itemsStore.staticItems &&
            typeof itemsStore.staticItems === 'object' &&
            !Array.isArray(itemsStore.staticItems)
        ) {
          item = itemsStore.staticItems[partId] || itemsStore.staticItems[String(partId)]
        } else if (itemsStore.staticItems && Array.isArray(itemsStore.staticItems)) {
          item = itemsStore.staticItems.find(i => Number(i.id) === Number(partId))
        }
      }

      // 3. 如果没找到，从playerEquipment中查找
      if (!item && playerEquipment && Array.isArray(playerEquipment)) {
        item = playerEquipment.find(i => Number(i.id) === Number(partId))
      }

      // 4. 如果没找到，从inventory.items中查找
      if (!item && gameStore.inventory?.items && Array.isArray(gameStore.inventory.items)) {
        item = gameStore.inventory.items.find(i => Number(i.id) === Number(partId))
      }

      // 处理物品名称
      let itemName = `#${partId}`
      if (item) {
        // 注意：经过GameDataService处理后，item.name已经是字符串（通常是中文）
        if (typeof item.name === 'string') {
          itemName = item.name || `#${partId}`
        } else if (typeof item.name === 'object') {
          // 兼容未处理的原始数据结构
          itemName = item.name.cns || item.name.en || `#${partId}`
        }
      } else {
        // 如果在所有数据源中都没找到，尝试从更广泛的全局数据中查找
        if (window.gameData && window.gameData.items) {
          let gameItem = null
          // 支持数组和对象两种格式
          if (Array.isArray(window.gameData.items)) {
            gameItem = window.gameData.items.find(i => Number(i.id) === Number(partId))
          } else if (
            typeof window.gameData.items === 'object' &&
              window.gameData.items !== null
          ) {
            gameItem = window.gameData.items[partId] || window.gameData.items[String(partId)]
          }
          if (gameItem) {
            // 注意：经过GameDataService处理后，item.name已经是字符串（通常是中文）
            if (typeof gameItem.name === 'string') {
              itemName = gameItem.name || `#${partId}`
            } else if (typeof gameItem.name === 'object') {
              // 兼容未处理的原始数据结构
              itemName = gameItem.name.cns || gameItem.name.en || `#${partId}`
            }
          }
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

// 使元素可拖拽
const makeDraggable = (element, header) => {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0

  if (header) {
    // 如果提供了标题栏，则只能通过标题栏拖拽
    header.onmousedown = dragMouseDown
  } else {
    // 否则整个元素都可以拖拽
    element.onmousedown = dragMouseDown
  }

  function dragMouseDown (e) {
    e = e || window.event
    e.preventDefault()
    // 获取鼠标点击位置
    pos3 = e.clientX
    pos4 = e.clientY
    document.onmouseup = closeDragElement
    // 在mousemove上附加函数
    document.onmousemove = elementDrag
  }

  function elementDrag (e) {
    e = e || window.event
    e.preventDefault()
    // 计算新位置
    pos1 = pos3 - e.clientX
    pos2 = pos4 - e.clientY
    pos3 = e.clientX
    pos4 = e.clientY
    // 设置元素的新位置
    element.style.top = element.offsetTop - pos2 + 'px'
    element.style.left = element.offsetLeft - pos1 + 'px'
  }

  function closeDragElement () {
    // 停止移动元素时，关闭拖拽功能
    document.onmouseup = null
    document.onmousemove = null
  }
}

// 物品参数映射（使用统一描述）
const abilityParameterMap = ABILITY_PARAMETER_MAP

// 任务相关方法
const switchQuestTab = tabType => {
  activeQuestTab.value = tabType
  selectedQuest.value = null
  addBattleLog(
    `切换到任务标签: ${tabType === 'available' ? '可接取任务' : tabType === 'active' ? '进行中任务' : '已完成任务'} `
  )
}

// 显示任务详情
const showQuestDetail = quest => {
  selectedQuest.value = quest
}

// 获取任务类型中文名
const getQuestType = type => {
  const types = {
    chain: '链式任务',
    category: '普通任务',
    daily: '每日任务',
    weekly: '每周任务'
  }
  return types[type] || type
}

// 更新击杀怪物进度
const updateKillProgress = (monsterId, count = 1) => {
  if (questService.value) {
    questService.value.updateKillProgress(monsterId, count)
  }
  // ★ 同步更新转职任务击杀进度
  for (let i = 0; i < count; i++) {
    store.updateJobChangeQuestKillProgress(monsterId)
  }
}

// 更新收集物品进度
const updateCollectProgress = (itemId, count = 1) => {
  if (questService.value) {
    questService.value.updateCollectProgress(itemId, count)
  }
}

// 获取怪物名称
const getMonsterName = monsterId => {
  // 这里应该从游戏数据服务获取怪物名称
  const monsterData = gameInitializerManager.value.services.data.getMonsterById(monsterId)
  return monsterData?.name?.cns || monsterData?.name?.en || '未知怪物'
}

// 获取空任务提示信息
const getEmptyQuestMessage = () => {
  if (activeQuestTab.value === 'available') {
    return '暂无可接取的任务'
  } else if (activeQuestTab.value === 'active') {
    return '暂无进行中的任务'
  } else {
    return '暂无已完成的任务'
  }
}

// 接受任务

// 完成任务
const completeQuest = quest => {
  if (confirm(`确定要完成任务 "${quest.name?.cns || quest.name?.en || quest.id}" 吗？`)) {
    // 调用任务服务完成任务
    if (questService.value && player.value && bagService.value) {
      const success = questService.value.completeQuest(quest, player.value, bagService.value)
      if (success) {
        const questName = quest.name?.cns || quest.name?.en || quest.id

        // 获取任务奖励信息
        const gameDataValue = gameData.value
        const questData = gameDataValue?.quests?.[quest.id] || quest

        // 获取经验奖励
        let expReward = 0
        if (questData?.endReceiveExperience) {
          const source = questData.endReceiveExperience
          if (Array.isArray(source)) {
            const index = Number(player.value?.level) - 1
            const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
            expReward = Number(source[safeIndex] ?? source[0] ?? 0)
          } else {
            expReward = Number(source)
          }
          if (!Number.isFinite(expReward) || expReward <= 0) {
            expReward = 0
          }
        }

        // 获取金币奖励
        let goldReward = 0
        if (questData?.endReceiveGold) {
          const source = questData.endReceiveGold
          if (Array.isArray(source)) {
            const index = Number(player.value?.level) - 1
            const safeIndex = Number.isFinite(index) && index >= 0 ? index : 0
            goldReward = Number(source[safeIndex] ?? source[0] ?? 0)
          } else {
            goldReward = Number(source)
          }
          if (!Number.isFinite(goldReward) || goldReward <= 0) {
            goldReward = 0
          }
        }

        // 获取物品奖励
        const itemRewards = questData?.endReceiveItems || []

        // 构建奖励文本
        const rewardParts = []
        if (expReward > 0) {
          rewardParts.push(`经验 ${expReward}%`)
        }
        if (goldReward > 0) {
          rewardParts.push(`金币 ${goldReward.toLocaleString()}`)
        }
        if (itemRewards.length > 0) {
          itemRewards.forEach(item => {
            const itemData = gameDataValue?.items?.[item.item] || window.gameData?.items?.[item.item]
            const itemName = itemData?.name?.cns || itemData?.name?.en || `物品${item.item}`
            rewardParts.push(`${itemName} x${item.count || 1}`)
          })
        }

        const rewardText = rewardParts.length > 0 ? ` 获得: ${rewardParts.join(', ')}` : ''

        // 重新加载任务列表
        loadQuests()

        // 添加战斗日志文字
        addBattleLog(`[任务完成] ${questName}${rewardText}`, 'quest')

        // 显示战斗日志动画
        showAnimationMessage(`任务完成: ${questName}`, 'quest', '', '', '', '', '✅')

        // 切换到已完成任务标签
        switchQuestTab('completed')
      }
    }
  }
}
// 保留原有函数以避免语法错误
// 技能详情面板相关的响应式数据
// checkAndRefreshMonsters - 已从useMonsterManager中解构
// autoRefreshMonsters - 已从useMonsterManager中解构

/**
 * 清理所有当前怪物的 DOT 定时器
 * 在刷新怪物前调用，防止旧怪物的 setTimeout 闭包持续持有引用导致内存泄漏
 * @returns {void}
 */
const cleanupAllMonsterDotTimers = () => {
  try {
    const currentMonsters = monsters.value
    if (!Array.isArray(currentMonsters)) {
      return
    }
    for (const monster of currentMonsters) {
      if (!monster || !Array.isArray(monster.dotEffects)) {
        continue
      }
      for (let i = 0; i < monster.dotEffects.length; i++) {
        const timerId = monster.dotEffects[i]?.timerId
        if (timerId !== null && timerId !== undefined) {
          clearTimeout(timerId)
        }
      }
      monster.dotEffects.length = 0
    }
    // 同步清理 DotTickScheduler 中的所有 DOT 引用
    dotTickScheduler.clearAllDots()
  } catch (error) {
    console.error('[Main.vue] cleanupAllMonsterDotTimers 失败:', error)
  }
}

const refreshMonstersAndStartAutoBattle = async (payload = false) => {
  try {
    // 刷新前清理所有旧怪物的 DOT 定时器，防止闭包引用残留导致内存泄漏
    cleanupAllMonsterDotTimers()
    const handled = await refreshMonstersAndMaybeResume(payload)

    if (!handled) {
      addBattleLog('没有找到符合条件的怪物，请调整设置后重试', 'error')
      return
    }

    if (gameInitializerManager.value && gameInitializerManager.value.services.audio && currentMap.value) {
      gameInitializerManager.value.services.audio.playMusic('battle', currentMap.value.name)
    }

    autoSellFoodItems()
  } catch (error) {
    console.error('refreshMonstersAndStartAutoBattle 失败:', error)
    addBattleLog('刷新怪物失败，请稍后重试', 'error')
  }
}

// 监听游戏设置变化，用于调试
watch(
  () => userSettings.value,
  newSettings => {},
  { deep: true }
)

const { handleGoldUpdate } = useGoldUpdateListener({
  player,
  gameInitializerManager,
  refreshBagModal
})

/**
 * 页面刷新/关闭事件处理函数
 * 紧急同步保存当前玩家数据，确保页面关闭时数据不丢失
 * beforeunload：主流浏览器刷新/关闭时触发
 * pagehide：Safari 和部分移动端浏览器的兜底，beforeunload 在 bfcache 场景下可能不触发
 */
const handlePageUnload = () => {
  // 刷新成就击杀队列，确保未提交的击杀进度被持久化
  flushAchievementKills()
  // 紧急同步保存：绕过防抖，传入内存中最新的玩家数据
  storageService.emergencySavePendingPatches(player.value)
}

// 生命周期钩子
onMounted(async () => {
  ErrorHandler.enableMonitoring()

  console.log('[Main] onMounted: initGame 开始...')
  const initStartTime = performance.now()
  await initGame()
  console.log(`[Main] onMounted: initGame 完成，耗时: ${(performance.now() - initStartTime).toFixed(1)}ms`)

  // 重新加载技能栏槽位数据（按当前存档槽位独立存储）
  // 确保切换角色后技能栏与当前角色一致
  try {
    const slotsStore = useSkillBarSlotsStore()
    slotsStore.reloadFromStorage()
  } catch (error) {
    console.error('[Main] 重新加载技能栏槽位失败:', error)
  }

  // 重新加载副本CD状态（按当前存档槽位独立存储）
  // 确保切换角色后副本CD与当前角色一致
  try {
    reloadDungeonForSlot()
  } catch (error) {
    console.error('[Main] 重新加载副本CD状态失败:', error)
  }

  // 在gameInitializer初始化后加载设置

  // 加载游戏设置
  if (loadSettings && typeof loadSettings === 'function') {
    await loadSettings()
    addBattleLog('游戏设置加载完成')
  } else {
    console.warn('loadSettings函数未初始化，跳过加载设置')
  }

  // 启动自动出售和恢复
  if (
    startAutoSellAndRecoveryWithCheck &&
      typeof startAutoSellAndRecoveryWithCheck === 'function'
  ) {
    startAutoSellAndRecoveryWithCheck()
    addBattleLog('自动出售和恢复已启动')
  } else {
    console.warn('startAutoSellAndRecoveryWithCheck函数未初始化，跳过启动自动出售和恢复')
  }

  // 启动游戏循环
  if (startGameLoop && typeof startGameLoop === 'function') {
    startGameLoop()
  } else {
    console.warn('startGameLoop函数未初始化，跳过启动游戏循环')
  }

  // 加载任务数据
  await loadQuests()

 
  // 初始化任务服务
  initQuestService()
 
  // 注意：静态数据（物品、怪物、技能、地图）已在 OptimizedGameInitializer 中加载到对应的 Pinia Stores
 
  // 初始化技能显示 - 延迟执行以确保数据已加载
  try {
    const gameData = gameInitializerManager?.value?.state?.gameData
    if (gameData && player.value) {
      initSkills(player.value, gameData)
    } else {
      console.warn('Main.vue - 游戏数据或玩家数据未准备好，跳过技能初始化')
 
    }
  } catch (error) {
    console.error('Main.vue - 初始化技能显示失败:', error)
  }

  // 同步后端背包数据到 itemsStore（修复：syncFromStorage 现在是 async 方法，必须 await）
  try {
    const bagService = new BagService(storageService)
    await bagService.syncFromStorage()
  } catch (error) {
    console.error('Main.vue - 同步背包数据到 itemsStore 失败:', error)
  }

  // 初始化NPC物品服务
  npcItemService.value = new NPCItemService()
  addBattleLog('NPC物品服务已初始化')

  // 预加载游戏图片
  if (itemsStore.staticItems) {
    preloadGameImages({ items: itemsStore.staticItems })
 
  } else {
  }

  // 预加载玩家物品图标（延时执行以确保玩家数据已加载）
  setTimeout(() => {
    if (player.value) {
      // 预加载背包物品图标
      if (player.value.bag && Array.isArray(player.value.bag.items)) {
        preloadBagItemImages(player.value.bag.items)
      }
      // 预加载装备物品图标
      if (player.value.equipment) {
        preloadEquipmentImages(player.value.equipment)
      }
  }
}, 2000) // 延迟2秒以确保玩家数据完全加载

  // 初始化任务面板拖拽功能（等待DOM渲染完成）
  nextTick(() => {
    initQuestPanelDrag()
  })

  /*全局变量位置参考*/
  //全局游戏数据,包含怪物,物品
  // console.log(gameDataManager.value)
  // //全局玩家变量
  // console.log(player.value)

  // 监听全局事件
  window.addEventListener('gold-update', handleGoldUpdate)
  window.addEventListener('battle-log-animation', handleBattleLogAnimation)
  window.addEventListener('bag-full', handleBagFull)
  // 监听神鹰召回事件（由 EagleSummonEffect 组件点击"召回"触发）
  window.addEventListener('eagle-recall', handleEagleRecall)
  
  // 监听页面刷新/关闭事件：同步保存当前玩家数据，确保页面关闭时数据不丢失
  window.addEventListener('beforeunload', handlePageUnload)
  window.addEventListener('pagehide', handlePageUnload)
  
  startWeatherCycle()

  // 启动伤害数字定期强制清理，防止长时间运行后过期数字堆积
  startDamageNumberForcePrune()

  // 页面可见性API监听：页面重新可见时清理伤害数字
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // ★ 标记 Main 页面已就绪，隐藏 App.vue 的全局 loading overlay
  store.setMainReady(true)
  // 通知心跳服务：Main页面已就绪，可以开始心跳检测
  notifyMainReady()
  console.log('[Main] onMounted: 所有初始化完成，mainReady = true')
})

onUnmounted(() => {
  console.log('Main组件卸载')

  // 刷新成就击杀队列，确保未提交的击杀进度不丢失
  flushAchievementKills()

  // 移除全局事件监听器
  window.removeEventListener('gold-update', handleGoldUpdate)
  window.removeEventListener('bag-full', handleBagFull)
  window.removeEventListener('battle-log-animation', handleBattleLogAnimation)
  // 移除神鹰召回事件监听
  window.removeEventListener('eagle-recall', handleEagleRecall)
  window.removeEventListener('beforeunload', handlePageUnload)
  window.removeEventListener('pagehide', handlePageUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  // 清理拖拽事件
  cleanupDrag()

  // 清理游戏资源
  if (gameInitializerManager.value) {
    gameInitializerManager.value.destroy()
    gameInitializerManager.value = null
  }

  if (mapNameAnimationTimer) {
    clearTimeout(mapNameAnimationTimer)
    mapNameAnimationTimer = null
  }

  if (weatherCycleIntervalId) {
    clearInterval(weatherCycleIntervalId)
    weatherCycleIntervalId = null
  }

  cancelMonsterDefeatSettlementIdle()
  if (monsterDefeatSettlementSaveTimer) {
    clearTimeout(monsterDefeatSettlementSaveTimer)
    monsterDefeatSettlementSaveTimer = null
  }

  // 清理所有定时器
  cleanupAllTimers()

  // 停止伤害数字定期强制清理
  stopDamageNumberForcePrune()

  // 清理所有怪物的 DOT 定时器，防止闭包引用残留导致内存泄漏
  cleanupAllMonsterDotTimers()

  // 清理音频资源，释放 audioElements Map 中缓存的 Audio 对象
  try {
    const audioService = gameInitializerManager.value?.services?.audio
    if (audioService && typeof audioService.cleanup === 'function') {
      audioService.cleanup()
    }
  } catch (error) {
    console.error('[Main.vue] onUnmounted 音频清理失败:', error)
  }
})
</script>

<style scoped>
  @import '../styles/main.css';

  .map-name-animation {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 21000;
    pointer-events: none;
  }

</style>
