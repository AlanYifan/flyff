<!--
  @file Dungeon.vue
  @description 副本页面 - 通用副本模板
  @features 
    - 根据路由参数动态加载副本数据
    - 沉浸式入场动画与氛围背景
    - 交互式副本选择和难度系统
    - 动态战斗特效和伤害数字
    - Boss战特殊机制与阶段切换
    - 副本完成奖励展示
  @generated 2026-03-15
-->
<template>
  <div class="dungeon-page" :class="{ 'show-boss': isBossStage, 'is-auto-battling': autoBattle }">
    <!-- 动态背景层 -->
    <DungeonAtmosphere 
      :is-boss-stage="isBossStage" 
      :intensity="0.7"
      :enable-lightning="true"
    />

    <!-- 入场动画 -->
    <Transition name="enter-dungeon">
      <div v-if="showEnterAnimation" class="enter-animation-overlay">
        <div class="enter-content">
          <!-- 最后BOSS图片 -->
          <div v-if="lastBossStage" class="enter-boss-image-wrapper">
            <img
              :src="lastBossStage.monsterIcon"
              :alt="lastBossStage.name"
              class="enter-boss-image"
              @error="handleEnterBossImageError"
            />
            <div class="enter-boss-name">{{ lastBossStage.name }}</div>
          </div>
          <div class="dungeon-title-wrapper">
            <div class="title-glow"></div>
            <h1 class="dungeon-title">{{ dungeonInfo.name }}</h1>
            <div class="title-line"></div>
          </div>
          <p class="dungeon-subtitle">{{ dungeonInfo.difficulty }}难度</p>
          <p class="dungeon-hint">正在进入深渊裂隙...</p>
          <div class="loading-bar">
            <div class="loading-fill" :style="{ width: enterProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 副本完成动画 -->
    <Transition name="victory">
      <div v-if="showVictoryScreen" class="victory-overlay">
        <div class="victory-content">
          <div class="victory-badge">
            <div class="badge-glow"></div>
            <div class="badge-icon">🏆</div>
          </div>
          <h1 class="victory-title">副本通关!</h1>
          <div class="victory-stats">
            <div class="stat-item">
              <span class="stat-label">击杀怪物</span>
              <span class="stat-value">{{ totalKills }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">战斗时间</span>
              <span class="stat-value">{{ formatBattleTime }}</span>
            </div>
            <div class="stat-item highlight">
              <span class="stat-label">获得金币</span>
              <span class="stat-value gold">+{{ formatNumber(goldReward) }}</span>
            </div>
            <div class="stat-item highlight">
              <span class="stat-label">获得经验</span>
              <span class="stat-value exp">+{{ formatNumber(expReward) }}</span>
            </div>
          </div>
          <div v-if="rewardItems.length > 0" class="reward-items">
            <h3 class="reward-title">获得物品</h3>
            <div class="reward-list">
              <div
                v-for="item in rewardItems"
                :key="item.id"
                class="reward-item"
                :class="item.rarity"
              >
                <img :src="item.icon" :alt="item.name" class="reward-icon" />
                <span class="reward-name">{{ item.name }}</span>
                <span class="reward-count">x{{ item.count }}</span>
              </div>
            </div>
          </div>
          <button class="victory-btn" @click="exitDungeon">返回主界面</button>
        </div>
      </div>
    </Transition>

    <!-- 主战斗界面 -->
    <div v-if="!showEnterAnimation && !showVictoryScreen" class="battle-container">
      <!-- 左侧面板 -->
      <div class="left-sidebar">
        <!-- 副本进度 -->
        <div class="progress-panel glass-panel">
          <div class="progress-header">
            <h3 class="progress-title">🏰 {{ dungeonInfo.name }}</h3>
            <span class="progress-difficulty" :class="difficultyClass">{{ dungeonInfo.difficulty }}</span>
          </div>
<!-- 副本倍率信息 -->
<div class="dungeon-multipliers">
<div class="multiplier-item">
<span class="multiplier-label">📦 掉落</span>
<span class="multiplier-value">{{ (totalDropRateMultiplier * 100).toFixed(0) }}%(难度{{ (dungeonInfo.multiplier * 100).toFixed(0) }}%+团队{{ teamDropBonus }}%)</span>
</div>
</div>
<div class="dungeon-multipliers">
<div class="multiplier-item">
<span class="multiplier-label">✨ 经验</span>
<span class="multiplier-value exp">{{ (totalExpRateMultiplier * 100).toFixed(0) }}%(难度{{ ((dungeonInfo.expMultiplier || dungeonInfo.multiplier) * 100).toFixed(0) }}%+团队{{ teamExpBonusDisplay }}%)</span>
</div>
</div>
<div class="dungeon-multipliers">
<div class="multiplier-item">
<span class="multiplier-label">❤️ 怪物气血</span>
<span class="multiplier-value hp">{{ ((dungeonInfo.hpMultiplier || dungeonInfo.multiplier) * 100).toFixed(0) }}%</span>
</div>
</div>
          <div class="stage-indicators">
            <div
              v-for="(stage, index) in dungeonStages"
              :key="index"
              class="stage-dot"
              :class="{
                completed: index < currentStageIndex,
                current: index === currentStageIndex,
                boss: stage.isBoss
              }"
              @mouseenter="showStageTooltip($event, stage, index)"
              @mousemove="moveStageTooltip($event)"
              @mouseleave="hideStageTooltip"
            >
              <div class="stage-content">
                <img
                  v-if="stage.monsterIcon"
                  :src="stage.monsterIcon"
                  :alt="stage.name"
                  class="stage-icon"
                  @error="handleStageIconError($event, index)"
                />
                <span v-else class="stage-number">{{ index + 1 }}</span>
                <div class="stage-info">
                  <span class="stage-name" :style="{ color: getMonsterRankColor(stage.rank) }">{{ stage.name }}</span>
                  <span class="stage-count-small">{{ index < currentStageIndex ? stage.count : (index === currentStageIndex ? `${currentStageKills}/${stage.count}` : `0/${stage.count}`) }}</span>
                </div>
              </div>
              <div v-if="index < currentStageIndex" class="completed-check">✓</div>
            </div>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: totalProgress + '%' }"></div>
            </div>
            <span class="progress-text">{{ Math.round(totalProgress) }}%</span>
          </div>
        </div>

        <!-- 计时器 -->
        <div class="timer-panel glass-panel">
          <div class="timer-icon">⏱️</div>
          <div class="timer-display">{{ formatTime(remainingSeconds) }}</div>
          <div class="timer-label">剩余时间</div>
        </div>
      </div>

      <!-- 主战斗区域 -->
      <div class="main-battle-area">
      <div class="battle-area">
        <!-- 怪物区域（上方）- 只有开始战斗后才显示 -->
        <div v-if="isBattleStarted" class="monster-area">
          <div class="monster-label">
            <span class="label-icon">👹</span>
            <span class="label-text">敌方怪物</span>
          </div>
<!-- 怪物卡片 -->
<TransitionGroup name="monster" tag="div" class="monster-grid">
<div
v-for="(monster, index) in visibleMonsters"
:key="monster.uid"
:data-monster-uid="monster.uid"
:class="{
boss: monster.rank === 'boss',
elite: monster.rank === 'elite',
'single-target': isSingleTargetStage
}"
class="monster-card"
>
              <MonsterAnimation
                :is-attacking="monster.isAttacking"
                :is-hit="monster.isHit"
                :is-dying="monster.isDying"
              >
                <!-- 怪物图标区域（受伤动画只应用到这里） -->
                <template #icon>
                  <!-- 怪物攻击动画 -->
                  <div v-if="monster.isAttacking" class="monster-attack-effect"></div>
                  
                  <!-- 怪物图标 -->
                  <div class="monster-icon-wrapper">
                    <img
                      :src="monster.icon"
                      :alt="monster.name"
                      class="monster-icon"
                      @error="handleMonsterIconError(monster)"
                    />
                  </div>
                </template>

                <!-- 怪物信息区域 -->
                <template #default>
                  <div class="monster-info">
                  <div class="monster-name-row">
                    <span class="monster-name" :style="{ color: getMonsterRankColor(monster.rank) }">
                      {{ monster.name }}
                      <span v-if="monster.element && monster.element !== 'neutral' && monster.element !== 'none'" class="element-badge-inline">
                        <img :src="getElementIcon(monster.element)" :alt="monster.element" />
                      </span>
                    </span>
                    <span class="monster-level">Lv.{{ monster.level }}</span>
                  </div>
                  <!-- DNF风格血条 - 所有怪物统一显示 -->
                  <div class="monster-hp-bar dnf-hp-bar" :style="{ backgroundColor: getDnfHpBarData(monster.currentHealth, monster.maxHealth, monster.rank).barBgColor }">
                    <div class="dnf-hp-percent">{{ ((monster.currentHealth / monster.maxHealth) * 100).toFixed(1) }}%</div>
                    <div class="dnf-hp-xcount" v-if="getDnfHpBarData(monster.currentHealth, monster.maxHealth, monster.rank).totalBars > 1">
                      ×{{ Math.ceil(monster.currentHealth / getHpUnit(monster.maxHealth, monster.rank)) || 1 }}
                    </div>
                    <div class="bar-fill" :style="{ width: getDnfHpBarData(monster.currentHealth, monster.maxHealth, monster.rank).barProgress + '%', backgroundColor: getDnfHpBarData(monster.currentHealth, monster.maxHealth, monster.rank).barColor }"></div>
                    <span class="bar-text">{{ formatNumber(monster.currentHealth) }}/{{ formatNumber(monster.maxHealth) }}</span>
                  </div>
                  <!-- DEBUFF效果图标（DOT效果 + 碎甲等debuff + 双倍惩戒） -->
                  <MonsterDebuffs
                    :monster-id="monster.id || monster.monsterId"
                    :dot-effects="monster.dotEffects"
                    :initial-debuffs="getMonsterDebuffs(monster.id || monster.monsterId)"
                    :double-judgment-debuff="monster.doubleJudgmentDebuff"
                    @icon-error="handleDebuffIconError"
                  />
                </div>
                </template>
              </MonsterAnimation>

            </div>
          </TransitionGroup>

          <!-- 无怪物提示 -->
          <div v-if="visibleMonsters.length === 0 && !isBossStage" class="no-monster-hint">
            <div class="hint-icon">⚔️</div>
            <div class="hint-text">正在召唤怪物...</div>
          </div>
        </div>

        <!-- 战斗分割线 - 只有开始战斗后才显示 -->
        <div v-if="isBattleStarted" class="battle-divider">
          <div class="divider-line"></div>
          <span class="divider-text">⚔️ VS ⚔️</span>
          <div class="divider-line"></div>
        </div>

        <!-- 未开始战斗提示 -->
        <div v-if="!isBattleStarted" class="battle-start-hint">
          <div class="hint-content">
            <div class="hint-icon-large">⚔️</div>
            <div class="hint-title">准备战斗</div>
            <div class="hint-desc">点击下方「自动战斗」按钮开始挑战副本</div>
          </div>
        </div>

        <!-- 团队玩家区域（下方） -->
        <div class="team-area" ref="teamAreaRef">
          <div class="team-label">
            <span class="label-icon">👥</span>
            <span class="label-text">我方团队</span>
            <button class="team-config-btn" @click="toggleTeamConfigPanel" title="队伍配置">
              ⚙
            </button>
          </div>
          <div class="team-grid">
            <!-- 当前玩家卡片 -->
            <div class="team-member-card is-current-player is-leader">
              <!-- 攻击力加成和经验加成标识（显示在头像上方） -->
              <div v-if="memberAttackBonus['player']?.bonus > 0 || memberExpBonus['player']?.bonus > 0" class="bonus-badges-row">
                <span v-if="memberAttackBonus['player']?.bonus > 0" class="attack-bonus-badge">{{ memberAttackBonus['player'].bonusLabel }}</span>
                <span v-if="memberExpBonus['player']?.bonus > 0" class="exp-bonus-badge">{{ memberExpBonus['player'].bonusLabel }}</span>
              </div>
              <!-- 玩家头像 -->
              <TeamMemberAnimation
                :is-casting-skill="playerAnimationState.isCastingSkill"
                :is-normal-attack="playerAnimationState.isNormalAttack"
                :is-hurt="playerAnimationState.isHurt"
                :is-monster-attacked="playerAnimationState.isMonsterAttacked"
              >
                <div id="playerAvatar" class="member-avatar member-avatar-clickable" @click="openMemberDetail(player, 'player')">
                  <img
                    :src="playerAvatar"
                    :alt="player.nickname || '玩家'"
                    @error="handleAvatarError"
                  />
                  <div class="leader-crown">👑</div>
                </div>
              </TeamMemberAnimation>
              <!-- 龙之劲劲力值显示：在玩家头像下方外部从左往右贴合显示 -->
              <DragonForceDisplay :player="player" />
              <!-- 影之怨影怨值显示：暗夜主宰J技能，在玩家头像下方显示影怨值计数 -->
              <ShadowGrudgeDisplay :player="player" />
<!-- 圣光积累圣光值显示：炽天使J技能，在玩家头像下方显示圣光值计数 -->
<HolyAccumulationDisplay :player="player" />
<!-- 裁决积累裁决值显示：圣殿骑士J技能，在玩家头像下方显示裁决值计数 -->
<JudgmentAccumulationDisplay :player="player" />
<!-- 奥术充能值显示：奥术师J技能，在玩家头像下方显示充能值计数 -->
<ArcaneChargeDisplay :player="player" />
<!-- 碎思归墟充能值显示：心灵师J技能，在玩家头像下方显示充能值计数 -->
<MindChargeDisplay :player="player" />
<!-- 风之积累风之值显示：风暴行者J技能，在玩家头像下方显示风之值计数 -->
              <WindAccumulationDisplay :player="player" />
              
              <!-- 玩家名称和等级 -->
              <div class="member-info-row">
                <span class="member-name">{{ player.nickname || '玩家' }}</span>
                <span class="member-level">Lv.{{ player.level }}</span>
              </div>
              
              <!-- 血量条 -->
              <div class="member-hp-bar">
                <div class="bar-fill" :style="{ width: healthPercentage + '%' }"></div>
                <span class="bar-text">{{ player.currentHealth }} / {{ player.maxHealth }}</span>
              </div>
              
              <!-- 魔力条 -->
              <div class="member-mp-bar">
                <div class="bar-fill" :style="{ width: manaPercentage + '%' }"></div>
                <span class="bar-text">{{ player.currentMana }} / {{ player.maxMana }}</span>
              </div>
              
              <!-- 经验条 -->
              <div class="member-exp-bar">
                <div class="bar-fill" :style="{ width: expPercentage + '%' }"></div>
                <span class="bar-text">{{ expPercentage.toFixed(4) }}%</span>
              </div>
              
              <!-- 技能图标列表 -->
              <div class="member-skills" v-if="getMemberSkills(player).length > 0">
                <div
                  v-for="skill in getMemberSkills(player)"
                  :key="skill.key"
                  class="skill-icon-wrapper"
                  :class="{ 'on-cooldown': getSkillCooldownSeconds(skill, 'player') > 0 }"
                  @mouseenter="showSkillTooltipHandler($event, skill, player)"
                  @mousemove="moveSkillTooltipHandler"
                  @mouseleave="hideSkillTooltipHandler"
                >
                  <img :src="skill.icon" :alt="skill.name" class="skill-icon" @error="e => e.target.src = '/pt/skill_icon/default_skill.png'" />
                  <!-- 冷却遮罩 -->
                  <div v-if="getSkillCooldownSeconds(skill, 'player') > 0" class="skill-cd-overlay">
                    <span class="skill-cd-text">{{ getSkillCooldownSeconds(skill, 'player') }}</span>
                  </div>
                  <span class="skill-level-badge">Lv.{{ skill.level }}</span>
                </div>
              </div>
              
              <!-- BUFF图标列表 -->
              <BuffDisplay
                :active-buffs="player.activeBuffs"
                :version="buffVersion"
                compact
                :target="player"
                @buff-remove-request="handleBuffRemoveRequest"
              />
            </div>
            
            <!-- 队伍成员（已加入的角色） -->
            <div
              v-for="(member, memberIndex) in teamMembers"
              :key="`member-${member.slotId}`"
              class="team-member-card is-teammember"
              :data-slot-id="member.slotId"
            >
              <!-- 移除按钮 -->
              <button
                class="remove-member-btn"
                @click.stop="removeTeamMember(memberIndex)"
                title="移除成员"
              >−</button>
              <!-- 攻击力加成和经验加成标识（显示在头像上方） -->
              <div v-if="memberAttackBonus[`member_${member.slotId}`]?.bonus > 0 || memberExpBonus[`member_${member.slotId}`]?.bonus > 0" class="bonus-badges-row">
                <span v-if="memberAttackBonus[`member_${member.slotId}`]?.bonus > 0" class="attack-bonus-badge">{{ memberAttackBonus[`member_${member.slotId}`].bonusLabel }}</span>
                <span v-if="memberExpBonus[`member_${member.slotId}`]?.bonus > 0" class="exp-bonus-badge">{{ memberExpBonus[`member_${member.slotId}`].bonusLabel }}</span>
              </div>
              <!-- 队员召唤宠物浮动显示由 DungeonMemberPet 组件统一处理（Teleport to body） -->
              <!-- 成员头像 -->
              <TeamMemberAnimation
                :is-casting-skill="getMemberAnimationState(`member_${member.slotId}`).isCastingSkill"
                :is-normal-attack="getMemberAnimationState(`member_${member.slotId}`).isNormalAttack"
                :is-hurt="getMemberAnimationState(`member_${member.slotId}`).isHurt"
                :is-monster-attacked="getMemberAnimationState(`member_${member.slotId}`).isMonsterAttacked"
              >
                <div class="member-avatar member-avatar-clickable" @click="openMemberDetail(member, 'teammember')">
                  <img
                    :src="getMemberAvatarUrl(member)"
                    :alt="member.nickname"
                    @error="handleAvatarError"
                  />
                </div>
              </TeamMemberAnimation>
              
              <!-- 成员名称和等级 -->
              <div class="member-info-row">
                <span class="member-name">{{ member.nickname }}</span>
                <span class="member-level">Lv.{{ member.level || 1 }}</span>
              </div>
              
              <!-- 血量条 -->
              <div class="member-hp-bar">
                <div class="bar-fill" :style="{ width: getMemberHealthPercent(member) + '%' }"></div>
                <span class="bar-text">{{ member.currentHealth }} / {{ member.maxHealth }}</span>
              </div>
              
              <!-- 魔力条 -->
              <div class="member-mp-bar">
                <div class="bar-fill" :style="{ width: getMemberManaPercent(member) + '%' }"></div>
                <span class="bar-text">{{ member.currentMana }} / {{ member.maxMana }}</span>
              </div>
              
              <!-- 经验条 -->
              <div class="member-exp-bar">
                <div class="bar-fill" :style="{ width: getMemberExpPercent(member) + '%' }"></div>
                <span class="bar-text">{{ getMemberExpPercent(member).toFixed(4) }}%</span>
              </div>
              
              <!-- 技能图标列表 -->
              <div class="member-skills" v-if="getMemberSkills(member).length > 0">
                <div
                  v-for="skill in getMemberSkills(member)"
                  :key="skill.key"
                  class="skill-icon-wrapper"
                  :class="{ 'on-cooldown': getSkillCooldownSeconds(skill, `member_${member.slotId}`) > 0 }"
                  @mouseenter="showSkillTooltipHandler($event, skill, member)"
                  @mousemove="moveSkillTooltipHandler"
                  @mouseleave="hideSkillTooltipHandler"
                >
                  <img :src="skill.icon" :alt="skill.name" class="skill-icon" @error="e => e.target.src = '/pt/skill_icon/default_skill.png'" />
                  <!-- 冷却遮罩 -->
                  <div v-if="getSkillCooldownSeconds(skill, `member_${member.slotId}`) > 0" class="skill-cd-overlay">
                    <span class="skill-cd-text">{{ getSkillCooldownSeconds(skill, `member_${member.slotId}`) }}</span>
                  </div>
                  <span class="skill-level-badge">Lv.{{ skill.level }}</span>
                </div>
              </div>
              
              <!-- BUFF图标列表 -->
              <BuffDisplay
                :active-buffs="member.activeBuffs"
                :version="buffVersion"
                compact
                :target="member"
                @buff-remove-request="handleBuffRemoveRequest"
              />
            </div>
            
            <!-- 空位（预留组队位置） -->
            <div
              v-for="i in (7 - teamMembers.length)"
              :key="`empty-${i}`"
              class="team-member-card is-empty"
              @click="openCharacterSelectPanel"
            >
              <div class="empty-avatar">➕</div>
              <div class="empty-text">等待加入</div>
            </div>
          </div>

        </div>
      </div>
      </div>

      <!-- 队伍配置面板 -->
      <Transition name="team-config-slide">
        <div v-if="showTeamConfigPanel" class="team-config-panel glass-panel">
          <div class="config-panel-header">
            <h3>⚙ 队伍配置</h3>
            <button class="close-btn" @click="showTeamConfigPanel = false">&times;</button>
          </div>
          <div class="config-panel-body">
            <!-- 当前队伍人数 -->
            <div class="config-item">
              <div class="config-label">当前队伍人数</div>
              <div class="config-value">{{ teamMemberCount }} 人</div>
            </div>

            <!-- 经验分配模式（滑动块） -->
            <div class="config-section">
              <div class="config-section-title">📊 经验分配模式</div>
              <div class="slider-panel">
                <div class="slider-container">
                  <div
                    v-for="mode in expDistributionModes"
                    :key="mode.value"
                    class="slider-option"
                    :class="{ active: expDistributionMode === mode.value }"
                    @click="expDistributionMode = mode.value"
                  >
                    <span class="option-label">{{ mode.label }}</span>
                  </div>
                  <div class="slider-indicator" :style="{ left: expDistributionMode === 'contribution' ? '0%' : '50%' }"></div>
                </div>
                <div class="slider-desc">
                  {{ expDistributionModes.find(m => m.value === expDistributionMode)?.desc }}
                </div>
              </div>
            </div>

            <!-- 攻击力加成（滑动块） -->
            <div class="config-section">
              <div class="config-section-title">⚔️ 攻击力加成</div>
              <div class="slider-panel">
                <div class="slider-container">
                  <div
                    class="slider-option"
                    :class="{ active: attackBonusMode === 'leader' }"
                    @click="attackBonusMode = 'leader'"
                  >
                    <span class="option-label">队长</span>
                  </div>
                  <div
                    class="slider-option"
                    :class="{ active: attackBonusMode === 'team' }"
                    @click="attackBonusMode = 'team'"
                  >
                    <span class="option-label">队友</span>
                  </div>
                  <div class="slider-indicator" :style="{ left: attackBonusMode === 'leader' ? '0%' : '50%' }"></div>
                </div>
                <div class="slider-desc">
                  {{ attackBonusMode === 'leader' ? '队长获得攻击力加成（每人+5%，最大40%）' : '队友获得攻击力加成（每人+2.5%，最大20%）' }}
                </div>
              </div>
            </div>

            <!-- 物品掉落加成 -->
            <div class="config-section">
              <div class="config-section-title">💎 物品掉落加成</div>
              <div class="bonus-info">
                <div class="bonus-row">
                  <span class="bonus-label">掉落率加成</span>
                  <span class="bonus-value" :class="{ 'bonus-max': teamDropBonus >= 40 }">
                    +{{ teamDropBonus }}%
                  </span>
                </div>
                <div class="bonus-detail">每个角色增加击杀怪物掉落率 5%（最大 40%）</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 角色选择面板 -->
      <Transition name="modal-fade">
        <div v-if="showCharacterSelectPanel" class="character-select-overlay" @click.self="closeCharacterSelectPanel">
          <div class="character-select-panel glass-panel">
            <div class="panel-header">
              <h3>选择角色加入</h3>
              <div class="panel-hint">副本最低等级要求: {{ dungeonMinLevel }} 级</div>
              <button class="close-btn" @click="closeCharacterSelectPanel">&times;</button>
            </div>
            <div class="panel-body">
              <div v-if="otherCharacters.length === 0" class="no-characters">
                <p>暂无其他角色</p>
                <p class="hint">请先创建更多角色</p>
              </div>
              <div v-else class="character-list">
                <div
                  v-for="(character, index) in otherCharacters"
                  :key="index"
                  class="character-item"
                  :class="{ 'disabled': character.level < dungeonMinLevel }"
                  @click="selectCharacterToJoin(character)"
                >
                  <img :src="getCharacterAvatarUrl(character)" :alt="character.nickname" class="character-avatar" @error="handleCharacterAvatarError" />
                  <div class="character-info">
                    <div class="character-name">{{ character.nickname }}</div>
                    <div class="character-detail">{{ getClassName(character.class) }} Lv.{{ character.level || 1 }}</div>
                    <div v-if="character.level < dungeonMinLevel" class="level-warning">
                      ⚠️ 等级不足
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Buff移除确认面板 -->
      <Transition name="modal-fade">
        <div
          v-if="showBuffRemovePanel"
          class="buff-remove-overlay"
          @click.self="cancelRemoveBuff"
        >
          <div
            class="buff-remove-panel glass-panel"
            :style="{
              left: buffRemovePanelPosition.x + 'px',
              top: buffRemovePanelPosition.y + 'px'
            }"
            ref="buffRemovePanelRef"
          >
            <div class="panel-header" @mousedown="startDragBuffRemovePanel">
              <span class="panel-title">移除Buff确认</span>
              <button class="close-btn" @click="cancelRemoveBuff">&times;</button>
            </div>
            <div class="panel-body" v-if="buffToRemove">
              <div class="buff-info">
                <img :src="buffToRemove.buff.icon" :alt="buffToRemove.buff.name" class="buff-icon-preview" @error="e => e.target.src = '/pt/skill_icon/default_skill.png'" />
                <div class="buff-details">
                  <div class="buff-name">{{ buffToRemove.buff.name }}</div>
                  <div class="buff-target">目标: {{ buffToRemove.target?.nickname || '玩家' }}</div>
                </div>
              </div>
              <div class="buff-desc" v-if="buffToRemove.buff.description">
                {{ buffToRemove.buff.description }}
              </div>
              <div class="panel-actions">
                <button class="confirm-btn" @click="confirmRemoveBuff">确认移除</button>
                <button class="cancel-btn" @click="cancelRemoveBuff">取消</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 右侧面板 - 战斗日志 -->
      <div class="right-sidebar">
        <div class="battle-log glass-panel">
          <div class="log-header">
            <span class="log-title">📜 战斗日志</span>
            <button class="log-clear-btn" @click="clearBattleLogs">清空</button>
          </div>
          <div ref="logContainerRef" class="log-content">
            <div
              v-for="(log, index) in battleLogs"
              :key="index"
              class="log-entry"
              :style="{ color: log.color }"
            >
              <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
              <span class="log-text">{{ log.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部控制栏 -->
    <div class="bottom-bar">
      <!-- 自动战斗控制 -->
      <div class="auto-battle-control glass-panel">
        <button
          class="auto-battle-btn"
          :class="{ active: autoBattle }"
          @click="toggleAutoBattle"
        >
          <span class="btn-icon">{{ autoBattle ? '⏸️' : '▶️' }}</span>
          <span class="btn-text">{{ autoBattle ? '停止' : '自动战斗' }}</span>
        </button>
        <div class="auto-battle-status">
          {{ autoBattle ? '战斗中...' : '已暂停' }}
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="action-btn exit-btn" @click="confirmExit">
          <span class="btn-icon">🚪</span>
          <span class="btn-text">退出</span>
        </button>
      </div>
    </div>

    <!-- 阶段切换提示 -->
    <Transition name="stage-transition">
      <div v-if="showStageTransition" class="stage-transition-overlay">
        <div class="transition-content">
          <h2 class="transition-title">{{ stageTransitionText }}</h2>
          <div class="transition-line"></div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮提示 -->
    <Transition name="tooltip">
      <div v-if="tooltip.visible" class="tooltip-popup" :style="tooltip.position">
        <div class="tooltip-title">{{ tooltip.title }}</div>
        <div class="tooltip-content">{{ tooltip.content }}</div>
      </div>
    </Transition>

    <!-- 背包模态框 -->
    <BagModal
      v-if="modalsInitialized && showBagModal"
      :key="`bag-${selectedMember?.slotId ?? player?.slotId ?? 'default'}`"
      :show="showBagModal"
      :player="selectedMember || player"
      :user-settings="userSettings"
      :game-data="gameData"
      :game-initializer="gameInitializer"
      @close="closeBagModal"
      @player-data-updated="onPlayerDataUpdated"
    />

    <!-- 玩家详情模态框 -->
    <PlayerDetailModal
      v-if="modalsInitialized && showPlayerDetailModal"
      :key="`detail-${selectedMember?.slotId ?? player?.slotId ?? 'default'}`"
      :player="selectedMember || player"
      :player-avatar="getSelectedMemberAvatar()"
      :player-class-name="getSelectedMemberClassName()"
      :health-percentage="getSelectedMemberHealthPercent()"
      :mana-percentage="getSelectedMemberManaPercent()"
      @close="closePlayerDetailModal"
    />

    <!-- 物品提示框 -->
    <ItemTooltip />

    <!-- 技能提示框 -->
    <SkillTooltip
      :visible="skillTooltipState.visible"
      :skill="skillTooltipState.skill"
      :player="skillTooltipState.player"
      :position="skillTooltipState.position"
      :player-class="skillTooltipState.player?.class"
    />

    <!-- 怪物详情提示框 -->
    <MonsterTooltip />

<!-- 掉落动画组件（支持多个同时显示） -->
<DropAnimation
  v-for="animation in dungeonDrops.activeDropAnimations.value"
  :id="animation.id"
  :ref="el => dungeonDrops.setDropAnimationRef(animation.id, el)"
  :key="'dungeon-drop-' + animation.id"
  :monster="animation.monster"
  :item="animation.item"
  :gold-amount="animation.goldAmount"
  :fast-mode="animation.fastMode"
  :auto-loot="animation.autoLoot !== false"
  @animation-complete="dungeonDrops.onDropAnimationComplete"
  @manual-pickup="dungeonDrops.onManualPickup"
  @pet-pickup="dungeonDrops.onManualPickup"
/>

<!-- 物品掉落光柱特效（稀有/传说/史诗品级，支持多个同时显示） -->
<ItemDropBeamEffect
  v-for="beam in dungeonDrops.activeBeamEffects.value"
  :id="beam.id"
  :ref="el => dungeonDrops.setBeamEffectRef(beam.id, el)"
  :key="'dungeon-beam-' + beam.id"
  :position="beam.position"
  :rank="beam.rank"
  @beam-complete="dungeonDrops.onBeamEffectComplete"
/>

<!-- 捡东西宠物动画组件 -->
<PickuppetPet :drop-animation-refs="dungeonDrops.dropAnimationRefsMap.value" position-mode="above-left" />

<!-- 培育型宠物浮动显示组件（副本页面专用） -->
<DungeonRaisedPet />

<!-- 队员召唤宠物浮动显示组件（捡宠左侧、培育宠物右侧，显示在队员头像上方） -->
<DungeonMemberPet
  v-for="member in teamMembers"
  :key="`member-pet-${member.slotId}`"
  :slot-id="member.slotId"
  :pickuppet="member._summonedPets?.pickuppet || null"
  :raised-pet="member._summonedPets?.raisedPet || null"
  @recall-pickuppet="onRecallMemberPickuppet"
  @recall-raised-pet="onRecallMemberRaisedPet"
/>

<!-- DPS排行榜 -->
<DpsRanking
  :visible="showDpsRanking"
  :dps-data="dpsRankingData"
  :total-members="totalTeamMembers"
/>

<!-- 掉落物品分配面板（稀有/传说/史诗物品拾取后触发） -->
<LootItemPanel
  :visible="showLootPanel"
  :item="currentLootItem"
  :members="teamMembers"
  :current-index="lootItemIndex"
  :total-items="lootItemTotal"
  @close="handleLootConfirm"
  @confirm="handleLootConfirm"
  @pass="handleLootPass"
/>

<!-- 死亡选择面板（全员死亡时显示） -->
<Transition name="death-panel-fade" appear>
<div v-if="showDeathPanel" class="death-panel-overlay" @click.self.prevent>
<div class="death-panel">
<div class="death-panel-header">
<div class="death-skull">💀</div>
<h2 class="death-title">全队阵亡</h2>
<p class="death-subtitle">所有队伍成员已倒下，请做出选择</p>
</div>

<div class="death-panel-actions">
<!-- 使用金钱的力量复活 -->
<button
class="death-btn gold-revive-btn"
:disabled="!canUseGoldRevive"
@click="handleDeathPanelGoldRevive"
>
<span class="btn-icon">💰</span>
<span class="btn-label">金钱的力量</span>
<span class="btn-desc">消耗 {{ GOLD_REVIVE_COST.toLocaleString() }} 金币复活</span>
<span v-if="!canUseGoldRevive" class="btn-warning">金币不足</span>
</button>

<!-- 返回主城 -->
<button
class="death-btn return-btn"
@click="handleDeathPanelReturn"
>
<span class="btn-icon">🏠</span>
<span class="btn-label">返回主城</span>
<span class="btn-desc">放弃本次副本挑战</span>
</button>
</div>
</div>
</div>
</Transition>

<!-- 复活特效动画 -->
<ResurrectionAnimation
  ref="resurrectionAnimationRef"
  :visible="showResurrectionAnimation"
  :duration="3000"
  :position="resurrectionPosition"
  @complete="onResurrectionAnimationComplete"
/>

<!-- 伤害飘字组件（与主页面一致的逐字符跳动动画） -->
<DamageNumber :global-damage-numbers="dungeonDamageNumbers" />

<!-- 拾取动画消息容器（居中悬浮，自动淡出） -->
<div class="dungeon-animation-messages-container">
  <div
    v-for="msg in animationMessages"
    :key="msg.id"
    class="dungeon-animation-message"
    :class="msg.type"
    :style="{ animationDelay: msg.delay + 'ms' }"
  >
    <span v-if="msg.prefixText" class="dungeon-msg-prefix">{{ msg.prefixText }}</span>
    <span class="dungeon-msg-text">{{ msg.text }}</span>
  </div>
</div>
  </div>
</template>

<script setup>
/**
 * 副本页面 - 通用副本模板
 * 根据路由参数id动态加载不同副本数据
 * 支持多种副本：乐雅裂痕、魔域秘殿、莱斯神之墓等
 * 自动战斗逻辑与Main页面一致
 */
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, nextTick, markRaw, toRaw, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore, ensureGameStores } from '@/store'
import { useItemsStore } from '@/store/items'
import { useSkillsStore } from '@/store/skills'
import { useMonstersStore } from '@/store/monsters'
import { useAutoBattleStore } from '@/store/autoBattle'
import { storageService } from '@/services/StorageService'
import Player from '@/models/Player'
import { getClassIconPath } from '@/utils/itemHelpers'
import { getClassAvatar, getClassName } from '@/data/classes'
import { dungeonData, DUNGEON_DIFFICULTY_CONFIG } from '@/composables/useMap.js'
import { useDungeonTimer, parseTimeToMs } from '@/composables/useDungeonTimer'
import { usePlayer } from '@/composables/usePlayer'
import { useExperienceCalculator } from '@/composables/useExperienceCalculator'
import { useAutoBattleDrops } from '@/composables/useAutoBattleDrops'
import { useAchievementKillTracker } from '@/composables/useAchievementKillTracker'
import { StaticGameInitializer } from '@/services/StaticGameInitializer'
import { MONSTER_INFO } from '@/data/MONSTER_INFO.js'
import { DropService } from '@/services/DropService'
import { AudioService } from '@/services/AudioService'
import PlayerStatsService from '@/services/PlayerStatsService'
import { WeaponSkillTriggerService } from '@/services/WeaponSkillTriggerService'
import { COMMON_SKILLS, getSkill, isSkillUnlocked, SKILL_CONFIG } from '@/data/skills'
import { getAutoRecoveryService } from '@/services/AutoRecoveryService'
import { registerSpecialItemCallbacks } from '@/composables/useItemManager'
import { applyLifeSteal } from '@/utils/lifeStealHelper'
import { useDungeonDropSystem } from '@/composables/useDungeonDropSystem'
import { getClassCategory, getSkillActionPriority, SKILL_ACTION_TYPE } from '@/utils/autoBattleUtils'
import { DamageCalculator } from '@/utils/damageCalculator'
import { processDragonForceOnAttack, isDragonForceUnlocked } from '@/composables/useDragonForce'
import DragonForceDisplay from '@/components/DragonForceDisplay.vue'
import { processShadowGrudgeOnAttack, isShadowGrudgeUnlocked } from '@/composables/useShadowGrudge'
import { processHolyAccumulationOnAttack, processHolyAccumulationOnSkillCast, isHolyAccumulationUnlocked } from '@/composables/useHolyAccumulation'
import { processJudgmentAccumulationOnAttack, processJudgmentAccumulationOnSkillCast, isJudgmentAccumulationUnlocked, getHeavyArmorDamageReductionInfo, getShieldAwakeningAttackDamageReduction, getShieldAwakeningDamageReflect, findHolyBulwarkDamageShareCaster, getHolyBulwarkDamageSharePercent, isArmorBreakEx3Unlocked, getArmorBreakEx3DoubleJudgmentMultiplier } from '@/composables/useHolyKnightEx'
import { processWindAccumulationOnAttack, processWindAccumulationOnSkillCast, isWindAccumulationUnlocked } from '@/composables/useWindAccumulation'
import { processMindChargeOnAttack, processMindChargeOnSkillCast, isMindChargeUnlocked, getMindTearEffectiveCooldown, getConsciousnessCollapseEffectiveCooldown, getMindNovaEffectiveCooldown } from '@/composables/useMindMasterEx'
import ShadowGrudgeDisplay from '@/components/ShadowGrudgeDisplay.vue'
import HolyAccumulationDisplay from '@/components/HolyAccumulationDisplay.vue'
import JudgmentAccumulationDisplay from '@/components/JudgmentAccumulationDisplay.vue'
import ArcaneChargeDisplay from '@/components/ArcaneChargeDisplay.vue'
import MindChargeDisplay from '@/components/MindChargeDisplay.vue'
import WindAccumulationDisplay from '@/components/WindAccumulationDisplay.vue'
import { getShadowCloakEffectiveCooldown } from '@/composables/useShadowCloakEx'
import { getThunderHammerEffectiveCooldown } from '@/composables/useThunderHammerEx'
import { getHolyJudgmentEffectiveCooldown } from '@/composables/useHolyJudgmentEx'
import { getAngelWrathEffectiveCooldown } from '@/composables/useAngelWrathEx'
import { processHotBuffs as processMemberHot } from '@/composables/useHotProcessor'
import {
  canTriggerOffhandAttack,
  getOffhandWeapon,
  getOffhandAttackChance,
  getOffhandAttackBonus,
  OFFHAND_ATTRIBUTE_RATIO
} from '@/composables/useDualWield'
import { rollOffhandMasteryEx3Multiplier } from '@/composables/useWeaponMastery'
import { applyWeaponDamageFormula } from '@/utils/gameTools'
import { trackMasteryAttack } from '@/composables/useMasteryProficiency'
import { useSkillBarSlotsStore, getSkillBarSlotIdsForSlot } from '@/store/skillBarSlots'
import { JOB_EVOLUTION_PATHS, JOB_TIER_CONFIG } from '@/store/jobs'

// 组件导入
import BagModal from '@/components/modals/BagModal.vue'
import PlayerDetailModal from '@/components/modals/PlayerDetailModal.vue'
import ItemTooltip from '@/components/ItemTooltip.vue'
import SkillTooltip from '@/components/SkillTooltip.vue'
import DungeonAtmosphere from '@/components/dungeon/DungeonAtmosphere.vue'
import BuffDisplay from '@/components/BuffDisplay.vue'
import TeamMemberAnimation from '@/components/dungeon/TeamMemberAnimation.vue'
import MonsterAnimation from '@/components/dungeon/MonsterAnimation.vue'
import MonsterDebuffs, { triggerDebuffUpdate } from '@/components/dungeon/MonsterDebuffs.vue'
import MonsterTooltip from '@/components/MonsterTooltip.vue'
import DpsRanking from '@/components/dungeon/DpsRanking.vue'
import LootItemPanel from '@/components/LootItemPanel.vue'
import ResurrectionAnimation from '@/components/ResurrectionAnimation.vue'
import DropAnimation from '@/components/DropAnimation.vue'
import ItemDropBeamEffect from '@/components/ItemDropBeamEffect.vue'
import PickuppetPet from '@/components/PickuppetPet.vue'
import DungeonRaisedPet from '@/components/dungeon/DungeonRaisedPet.vue'
import DungeonMemberPet from '@/components/dungeon/DungeonMemberPet.vue'
import DamageNumber from '@/components/DamageNumber.vue'

// 创建 StorageService 实例
// storageService 已通过 import 导入全局单例

// ★ 确保所有重型子 Store 已加载完成（顶层 await 使 setup 变为异步）
// 配合 App.vue 的 <Suspense>，加载期间显示 Loading fallback
// 刷新副本页面时直接进入 Dungeon 路由，跳过了 Main.vue 的 ensureGameStores 调用
// 必须在 new Player() 之前调用，因为 Player 构造函数会通过 PlayerStatsService 访问 useItemsStore（懒加载代理）
await ensureGameStores()

// Stores
const gameStore = useGameStore()
const itemsStore = useItemsStore()
const skillsStore = useSkillsStore()
const monstersStore = useMonstersStore()
const autoBattleStore = useAutoBattleStore()

// ============ 基础状态 ============
// player 必须在使用它的 composables 之前定义
const isLoading = ref(true)
const player = ref(new Player())

/**
 * 组件是否正在卸载
 * 用途：在 onBeforeUnmount 中设为 true，定时器回调检查此标志跳过响应式更新，
 * 避免组件卸载过程中触发 patch 导致 shouldUpdateComponent 报错（emitsOptions 为 null）
 */
const isComponentUnmounting = ref(false)

// BUFF 版本号，用于强制刷新 BUFF 显示（因为 markRaw 阻止了响应式更新）
const buffVersion = ref(0)

/**
 * 训养宠物属性加成 BUFF 的唯一标识
 * 用途/业务意图：用于在副本中过滤队员存档中残留的训养宠物 BUFF，
 * 避免该 BUFF 串显到不属于它的角色身上（训养宠物 BUFF 应由 raisedPetSummonStore 全局管理，仅属于队长）
 */
const RAISED_PET_ABILITY_BUFF_ID = 'raisedpet_ability'

// 使用 usePlayer composable
const { gainExp, expPercentage, updatePlayerAttributes } = usePlayer()

// 使用副本倒计时管理composable
const { getRemainingCountdownSeconds, getDungeonState, finishDungeon } = useDungeonTimer()

// 使用经验计算composable（考虑BUFF加成）
const { calculateActualExperience, getExperienceMultiplier } = useExperienceCalculator(player, computed(() => player.value?.activeBuffs || []))

// 使用掉落计算composable（初始使用副本倍率，后续在 teamDropBonus 定义后更新）
// 注意：totalDropRateMultiplier 在 teamDropBonus 之后定义，这里先声明
let calculateAutoBattleRewards = null

const router = useRouter()
const route = useRoute()

// 游戏初始化器
const gameInitializer = ref(null)

// 其他基础状态
const monsters = ref([])
const monsterDebuffsMap = ref({}) // 怪物debuff状态（使用响应式对象，精确追踪每个怪物的debuff变化）
const battleLogs = ref([])
const remainingSeconds = ref(3600)
/** 副本初始倒计时秒数（用于计算已用时间） */
const initialDungeonSeconds = ref(3600)
const showBagModal = ref(false)
const showPlayerDetailModal = ref(false)
const modalsInitialized = ref(true) // 页面加载时就初始化模态框组件
const showCharacterSelectPanel = ref(false) // 角色选择面板显示状态
const isBattleStarted = ref(false) // 是否已开始战斗
const selectedMember = ref(null) // 当前选中的队伍成员数据
const allCharactersDataCache = ref({}) // 所有角色数据缓存（预加载用，存储完整存档数据）
const cachedPlayerInstances = ref({}) // 缓存的 Player 实例

// ============ 复活特效动画状态 ============
const resurrectionAnimationRef = ref(null)
const showResurrectionAnimation = ref(false)
const resurrectionPosition = ref({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

// ============ 死亡选择面板状态 ============
/** 全员死亡时显示的死亡选择面板 */
const showDeathPanel = ref(false)
/** 金币复活所需金额 */
const GOLD_REVIVE_COST = 1000000
/** 复活卷轴物品ID */
const REVIVAL_SCROLL_ID = 6525
/** 玩家金币是否足够使用金币复活 */
const canUseGoldRevive = computed(() => {
  return (player.value?.gold || 0) >= GOLD_REVIVE_COST
})

// ============ 掉落物品面板状态 ============
const showLootPanel = ref(false) // 掉落面板显示状态
const currentLootItem = ref(null) // 当前掉落物品
const pendingLootItems = ref([]) // 待分配的稀有物品队列
const lootItemIndex = ref(0) // 当前分配物品的序号（从0开始）
const lootItemTotal = ref(1) // 待分配物品总数

/**
 * 显示下一个待分配的稀有物品
 * 用途/业务意图：从队列中取出下一件物品并显示分配面板，队列为空时关闭面板
 * @returns {void}
 */
const showNextLootItem = () => {
  if (pendingLootItems.value.length > 0) {
    lootItemIndex.value++
    currentLootItem.value = pendingLootItems.value.shift()
    showLootPanel.value = true
  } else {
    lootItemIndex.value = 0
    lootItemTotal.value = 1
    currentLootItem.value = null
    showLootPanel.value = false
  }
}

// ============ 副本掉落动画系统 ============
/**
 * 初始化副本掉落动画系统
 * 回调函数在运行时调用（用户拾取时），引用的变量在后续代码中定义，闭包捕获引用而非值
 */
const dungeonDrops = useDungeonDropSystem({
  /** 金币拾取：添加到队长金币 */
  onPickupGold: (goldAmount) => {
    player.value.gold = (player.value.gold || 0) + goldAmount
    goldReward.value += goldAmount
    gameStore.player.gold = player.value.gold
    storageService.savePlayerPatch({ gold: player.value.gold })
    addBattleLog(`拾取 ${goldAmount.toLocaleString()} 金币`, '#FFD700')
    // 居中悬浮动画提示：玩家名称 获得金币x数量,总金币数量xxx
    showPickupAnimationMessage(
      `获得金币x${goldAmount.toLocaleString()},总金币${player.value.gold.toLocaleString()}`,
      'gold',
      '/pt/UI/gold.png',
      `${player.value.nickname || '玩家'}`
    )
  },
  /** 普通/罕见物品拾取：直接添加到队长背包 */
  onPickupItem: (itemId, quantity, itemData) => {
    const itemName = itemData?.name?.cns || itemData?.name || `物品#${itemId}`
    addItemsToPlayerBag([{
      ...itemData,
      id: itemId,
      quantity,
      currentStack: quantity
    }])
    addBattleLog(`拾取 ${itemName} x${quantity}`, '#4CAF50')
    // 居中悬浮动画提示：玩家名称 获得 物品名称x数量
    showPickupAnimationMessage(
      `获得 ${itemName}x${quantity}`,
      'pickup',
      itemId ? `/pt/item_icon/${itemId}.png` : '',
      `${player.value.nickname || '玩家'}`
    )
  },
  /** 稀有/传说/史诗物品拾取：加入分配队列 */
  onPickupRareItem: (itemData) => {
    if (showLootPanel.value) {
      // 面板已显示，加入队列等待分配
      pendingLootItems.value.push(itemData)
      lootItemTotal.value = lootItemIndex.value + 1 + pendingLootItems.value.length
    } else {
      // 面板未显示，直接显示
      currentLootItem.value = itemData
      showLootPanel.value = true
      lootItemIndex.value = 0
      lootItemTotal.value = 1
    }
  },
  /** 拾取音效 */
  playPickupSound: (type) => {
    try {
      if (type === 'gold') {
        if (typeof audioService.playGoldSFX === 'function') {
          audioService.playGoldSFX()
        } else {
          audioService.playSFX('ItemDropDing1.wav')
        }
      } else {
        if (typeof audioService.playItemPickupSFX === 'function') {
          audioService.playItemPickupSFX()
        } else {
          audioService.playSFX('InfGroundPickup.wav')
        }
      }
    } catch (error) {
      console.error('[Dungeon] 播放拾取音效失败:', error)
    }
  }
})

/**
 * 获取怪物的debuff列表
 * @param {string|number} monsterId - 怪物ID
 * @returns {Array} debuff列表
 */
const getMonsterDebuffs = (monsterId) => {
  return monsterDebuffsMap.value[monsterId] || []
}

// ============ 技能提示状态 ============
const skillTooltipState = ref({
  visible: false,
  skill: null,
  position: { x: 0, y: 0 }
})

// ============ 团队配置 ============
const teamSize = ref(1) // 当前团队人数（只有玩家1人，后续可扩展为多人）
const otherCharacters = ref([]) // 其他可选角色列表
const teamMembers = ref([]) // 队伍成员列表（除玩家外的其他角色）

// ============ Buff移除面板状态 ============
const showBuffRemovePanel = ref(false) // 是否显示Buff移除确认面板
const buffToRemove = ref(null) // 待移除的Buff数据
const buffRemovePanelPosition = ref({ x: 0, y: 0 }) // 面板位置

// ============ 副本状态 ============
const dungeonInfo = ref({
  id: '',
  name: '',
  difficulty: '',
  multiplier: 1.0
})

const originalDungeon = ref(null)
const currentStageIndex = ref(0)
const currentStageKills = ref(0)
const dungeonStages = ref([])
const totalKills = ref(0)
const battleStartTime = ref(0)

// 保存的副本进度数据（用于预加载完成后恢复队友状态）
let pendingSavedProgress = null

// ============ 性能优化：怪物击败队列 ============
let monsterDefeatQueue = [] // 待处理的怪物击败队列
let isProcessingDefeat = false // 是否正在处理击败队列
let lastMonsterUpdateTime = 0 // 上次怪物UI更新时间
let pendingMonsterUpdates = new Map() // 待批量更新的怪物数据

/**
 * 副本最低等级要求
 * 根据当前副本难度配置计算
 */
const dungeonMinLevel = computed(() => {
  const dungeonName = dungeonInfo.value.name
  const difficulty = dungeonInfo.value.difficulty
  
  if (!dungeonName || !difficulty) return 1
  
  const config = DUNGEON_DIFFICULTY_CONFIG[dungeonName]
  if (!config || !config.difficulties) return 1
  
  const diffConfig = config.difficulties.find(d => d.name === difficulty)
  if (!diffConfig || !diffConfig.levelRange) return 1
  
  return diffConfig.levelRange[0] || 1
})

// ============ 音效节流控制 ============
const audioThrottleTimers = {
  monsterHit: new Map(), // 怪物受伤音效节流
  monsterDeath: new Map(), // 怪物死亡音效节流
  playerHurt: new Map(), // 玩家受伤音效节流
  monsterAttack: new Map() // 怪物攻击音效节流
}
const AUDIO_THROTTLE_INTERVAL = 150 // 音效节流间隔（毫秒）
const AUDIO_THROTTLE_INTERVAL_HIGH_FREQ = 1000 // 高频触发音效节流间隔（毫秒）- 用于玩家攻击和怪物受伤

/**
 * 播放玩家攻击音效（带节流，每秒最多播放一次）
 */
const playPlayerAttackSound = () => {
  const now = Date.now()
  const lastTime = audioThrottleTimers.playerAttack || 0
  if (now - lastTime < AUDIO_THROTTLE_INTERVAL_HIGH_FREQ) return
  audioThrottleTimers.playerAttack = now
  
  if (audioService && typeof audioService.playAttackSFX === 'function') {
    audioService.playAttackSFX()
  }
}

/**
 * 播放怪物受伤音效（带节流，每秒最多播放一次）
 * @param {string} monsterId - 怪物ID
 */
const playMonsterHitSound = (monsterId) => {
  const now = Date.now()
  const lastTime = audioThrottleTimers.monsterHit.get(monsterId) || 0
  if (now - lastTime < AUDIO_THROTTLE_INTERVAL_HIGH_FREQ) return
  audioThrottleTimers.monsterHit.set(monsterId, now)
  
  if (audioService && typeof audioService.playMonsterDamageSFX === 'function') {
    audioService.playMonsterDamageSFX()
  }
}

/**
 * 播放怪物死亡音效（带节流）
 * @param {string} monsterId - 怪物ID
 */
const playMonsterDeathSound = (monsterId) => {
  const now = Date.now()
  const lastTime = audioThrottleTimers.monsterDeath.get(monsterId) || 0
  if (now - lastTime < AUDIO_THROTTLE_INTERVAL) return
  audioThrottleTimers.monsterDeath.set(monsterId, now)
  
  if (audioService && typeof audioService.playMonsterDeathSFX === 'function') {
    audioService.playMonsterDeathSFX()
  }
}

/**
 * 播放怪物攻击音效（带节流）
 * @param {string} monsterId - 怪物ID
 */
const playMonsterAttackSound = (monsterId) => {
  const now = Date.now()
  const lastTime = audioThrottleTimers.monsterAttack.get(monsterId) || 0
  if (now - lastTime < AUDIO_THROTTLE_INTERVAL) return
  audioThrottleTimers.monsterAttack.set(monsterId, now)
  
  if (audioService && typeof audioService.playMonsterAttackSFX === 'function') {
    audioService.playMonsterAttackSFX()
  }
}

/**
 * 播放玩家/队友受伤音效（根据性别）
 * @param {Object} targetData - 目标数据
 */
const playPlayerHurtSound = (targetData) => {
  const targetId = targetData.slotId !== undefined ? `member_${targetData.slotId}` : 'player'
  const now = Date.now()
  const lastTime = audioThrottleTimers.playerHurt.get(targetId) || 0
  if (now - lastTime < AUDIO_THROTTLE_INTERVAL) return
  audioThrottleTimers.playerHurt.set(targetId, now)
  
  // 获取性别（字段名为 sex，默认男性）
  const gender = targetData.sex || 'male'
  
  if (audioService && typeof audioService.playDamageSFX === 'function') {
    audioService.playDamageSFX(gender)
  }
}

/**
 * 播放玩家/队友死亡音效（根据性别）
 * @param {Object} targetData - 目标数据
 */
const playPlayerDeathSound = (targetData) => {
  // 获取性别（字段名为 sex，默认男性）
  const gender = targetData.sex || 'male'
  
  if (audioService && typeof audioService.playDeathSFX === 'function') {
    audioService.playDeathSFX(gender)
  }
}

// ============ 经验分配模式 ============
// 'contribution' = 贡献模式：队长获得 队伍人数*5% 经验加成
// 'level' = 等级模式：所有成员获得 队伍人数*2.5% 经验加成
const expDistributionMode = ref('contribution')

/**
 * 获取经验分配模式描述（动态计算加成）
 */
const getExpModeDesc = (mode) => {
  const teamSize = 1 + teamMembers.value.length // 队长 + 队员
  if (mode === 'contribution') {
    const leaderBonus = teamSize * 5
    return `队长获得+${leaderBonus}%经验加成（${teamSize}人×5%）`
  } else {
    const memberBonus = teamSize * 2.5
    return `队友获得+${memberBonus}%经验加成（${teamSize}人×2.5%）`
  }
}

const expDistributionModes = computed(() => [
  { value: 'contribution', label: '贡献模式', desc: getExpModeDesc('contribution') },
  { value: 'level', label: '等级模式', desc: getExpModeDesc('level') }
])

// ============ 攻击力加成模式 ============
// 'leader' = 队长模式：每个成员增加5%攻击力
// 'team' = 队友模式：所有队员增加10%攻击力
const attackBonusMode = ref('leader')

/**
 * 获取指定成员的攻击力加成百分比
 * @param {string} memberId - 成员标识 ('player' 或 'member_x')
 * @returns {number} 攻击力加成百分比
 */
const getMemberAttackBonus = (memberId) => {
  // 从 memberAttackBonus 中获取该成员的攻击力加成
  const bonusInfo = memberAttackBonus.value[memberId]
  return bonusInfo?.bonus || 0
}

// 成员经验加成信息 { memberId: { bonus, bonusLabel } }
const memberExpBonus = ref({})

// 成员攻击力加成信息 { memberId: { bonus, bonusLabel } }
const memberAttackBonus = ref({})

/**
 * 初始化/更新成员经验加成标识
 * 根据当前经验分配模式设置每个成员的加成
 * - 贡献模式（滑向队长）：仅队长获得经验加成 = 队伍人数 * 5%
 * - 等级模式（滑向队友）：仅队友获得经验加成 = 队伍人数 * 2.5%
 */
const updateMemberExpBonus = () => {
  const newBonus = {}
  // 队伍人数 = 队长 + 队员
  const teamSize = 1 + teamMembers.value.length

  if (expDistributionMode.value === 'contribution') {
    // 贡献模式（滑向队长）：仅队长获得 队伍人数 * 5% 经验加成
    const leaderBonus = teamSize * 5
    newBonus['player'] = { bonus: leaderBonus, bonusLabel: `经验+${leaderBonus}%` }
    // 队友无加成
    for (const member of teamMembers.value) {
      newBonus[`member_${member.slotId}`] = { bonus: 0, bonusLabel: '' }
    }
  } else {
    // 等级模式（滑向队友）：仅队友获得 队伍人数 * 2.5% 经验加成
    const memberBonus = teamSize * 2.5
    const bonusLabel = `经验+${memberBonus}%`
    // 队长无加成
    newBonus['player'] = { bonus: 0, bonusLabel: '' }
    // 队友获得加成
    for (const member of teamMembers.value) {
      newBonus[`member_${member.slotId}`] = { bonus: memberBonus, bonusLabel }
    }
  }

  memberExpBonus.value = newBonus
}

/**
 * 初始化/更新成员攻击力加成标识
 * - 滑动到队长：队长获得攻击力加成 = 队伍人数 * 5%，最大40%
 * - 滑动到队友：所有队友获得攻击力加成 = 队伍人数 * 2.5%，最大20%
 */
const updateMemberAttackBonus = () => {
  const newBonus = {}
  // 队伍人数 = 队长 + 队员
  const teamSize = 1 + teamMembers.value.length

  if (attackBonusMode.value === 'leader') {
    // 队长模式：队长获得攻击力加成
    // 每个队伍角色（包括队友）给队长增加5%攻击力，最大40%
    const leaderAttackBonus = Math.min(40, teamSize * 5)
    newBonus['player'] = { bonus: leaderAttackBonus, bonusLabel: `攻击+${leaderAttackBonus}%` }
    // 队友无攻击力加成
    for (const member of teamMembers.value) {
      newBonus[`member_${member.slotId}`] = { bonus: 0, bonusLabel: '' }
    }
  } else {
    // 队友模式：所有队友获得攻击力加成
    // 每个队伍角色（包括队长）给所有队友增加2.5%攻击力，最大20%
    const teammateAttackBonus = Math.min(20, teamSize * 2.5)
    const bonusLabel = `攻击+${teammateAttackBonus}%`
    // 队长无攻击力加成
    newBonus['player'] = { bonus: 0, bonusLabel: '' }
    // 所有队友获得攻击力加成
    for (const member of teamMembers.value) {
      newBonus[`member_${member.slotId}`] = { bonus: teammateAttackBonus, bonusLabel }
    }
  }

  memberAttackBonus.value = newBonus
}

// ============ 队伍配置面板状态 ============
const showTeamConfigPanel = ref(false)
const teamAreaRef = ref(null)

// ============ 角色动画状态 ============
// 玩家动画状态
const playerAnimationState = ref({
  isCastingSkill: false,
  isNormalAttack: false,
  isHurt: false,
  isMonsterAttacked: false
})

// 队伍成员动画状态（使用 Map 存储每个成员的状态）
const memberAnimationStates = ref({})

/**
 * 触发成员动画
 * @param {string} memberId - 成员ID ('player' 或 'member_${slotId}')
 * @param {string} animationType - 动画类型 ('skill', 'attack', 'hurt', 'monster-attack')
 */
const triggerMemberAnimation = async (memberId, animationType) => {
  if (memberId === 'player') {
    // 先重置所有动画状态为 false
    playerAnimationState.value = {
      isCastingSkill: false,
      isNormalAttack: false,
      isHurt: false,
      isMonsterAttacked: false
    }
    
    // 等待下一个 tick 确保重置生效
    await nextTick()
    
    // 设置对应动画为 true
    playerAnimationState.value = {
      isCastingSkill: animationType === 'skill',
      isNormalAttack: animationType === 'attack',
      isHurt: animationType === 'hurt',
      isMonsterAttacked: animationType === 'monster-attack'
    }
    
    // 动画播放后自动重置（动画时长 + 缓冲时间）
    const animationDuration = animationType === 'skill' ? 450 : animationType === 'attack' ? 400 : 350
    setTimeout(() => {
      playerAnimationState.value = {
        isCastingSkill: false,
        isNormalAttack: false,
        isHurt: false,
        isMonsterAttacked: false
      }
    }, animationDuration)
  } else {
    // 队伍成员动画
    // 先重置
    memberAnimationStates.value[memberId] = {
      isCastingSkill: false,
      isNormalAttack: false,
      isHurt: false,
      isMonsterAttacked: false
    }
    
    // 等待下一个 tick
    await nextTick()
    
    // 设置新状态
    memberAnimationStates.value[memberId] = {
      isCastingSkill: animationType === 'skill',
      isNormalAttack: animationType === 'attack',
      isHurt: animationType === 'hurt',
      isMonsterAttacked: animationType === 'monster-attack'
    }
    
    // 动画播放后自动重置
    const animationDuration = animationType === 'skill' ? 450 : animationType === 'attack' ? 400 : 350
    setTimeout(() => {
      if (memberAnimationStates.value[memberId]) {
        memberAnimationStates.value[memberId] = {
          isCastingSkill: false,
          isNormalAttack: false,
          isHurt: false,
          isMonsterAttacked: false
        }
      }
    }, animationDuration)
  }
}

/**
 * 获取成员动画状态
 * @param {string} memberId - 成员ID
 * @returns {Object} 动画状态对象
 */
const getMemberAnimationState = (memberId) => {
  if (memberId === 'player') {
    return playerAnimationState.value
  }
  return memberAnimationStates.value[memberId] || {
    isCastingSkill: false,
    isNormalAttack: false,
    isHurt: false,
    isMonsterAttacked: false
  }
}

// ============ 队伍加成计算 ============
// 当前队伍人数（玩家 + 队伍成员）
const teamMemberCount = computed(() => {
  return 1 + teamMembers.value.length
})

// 物品掉落加成：每个角色增加 5%，最大 40%
const teamDropBonus = computed(() => {
  const bonus = teamMemberCount.value * 5
  return Math.min(40, bonus)
})

// 计算最终掉落倍率（副本倍率 + 队友加成 + 玩家BUFF）
const totalDropRateMultiplier = computed(() => {
  let multiplier = 1

  // 1. 副本难度倍率
  const dungeonMultiplier = dungeonInfo.value.multiplier || 1.0
  multiplier *= dungeonMultiplier

  // 2. 队友掉落加成（每个角色 5%，最大 40%）
  const teamBonus = teamDropBonus.value / 100 // 转换为小数，如 40% = 0.4
  multiplier *= (1 + teamBonus)

  // 3. 玩家 activeBuffs 掉落加成
  const activeBuffs = player.value?.activeBuffs || []
  activeBuffs.forEach(buff => {
    // 检查 effects.dropRate 格式（新格式）
    if (buff.effects?.dropRate) {
      const effect = buff.effects.dropRate
      const add = typeof effect === 'object' ? (effect.add || 0) : effect
      const isRate = typeof effect === 'object' ? effect.rate : buff.effectsRate
      if (isRate) {
        multiplier *= (1 + add / 100)
      } else {
        multiplier *= add
      }
    }
    // 兼容旧格式
    if (buff.type === 'dropRate') {
      multiplier *= (1 + (buff.rate || 0))
    }
  })

  return typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : 1
})

// 团队经验加成显示值（根据分配模式计算）
const teamExpBonusDisplay = computed(() => {
  const teamSize = 1 + teamMembers.value.length // 队长 + 队员
  if (expDistributionMode.value === 'contribution') {
    // 贡献模式：队长获得 队伍人数 * 5% 经验加成
    return teamSize * 5
  } else {
    // 等级模式：所有成员获得 队伍人数 * 2.5% 经验加成
    return teamSize * 2.5
  }
})

// 计算最终经验倍率（副本倍率 + 团队加成 + 玩家BUFF）
const totalExpRateMultiplier = computed(() => {
  let multiplier = 1

  // 1. 副本难度经验倍率
  const dungeonExpMultiplier = dungeonInfo.value.expMultiplier || dungeonInfo.value.multiplier || 1.0
  multiplier *= dungeonExpMultiplier

  // 2. 团队经验加成
  const teamBonus = teamExpBonusDisplay.value / 100 // 转换为小数
  multiplier *= (1 + teamBonus)

  return typeof multiplier === 'number' && !isNaN(multiplier) ? multiplier : 1
})

// 初始化掉落计算composable（传入完整掉落倍率计算函数）
const dropRewards = useAutoBattleDrops(player, () => totalDropRateMultiplier.value)
calculateAutoBattleRewards = dropRewards.calculateAutoBattleRewards

// 成就击杀进度追踪器（非阻塞式延迟批量更新）
const { recordKill: recordAchievementKill, flush: flushAchievementKills } = useAchievementKillTracker()

// 切换队伍配置面板
const toggleTeamConfigPanel = () => {
  showTeamConfigPanel.value = !showTeamConfigPanel.value
}

// ============ 动画状态 ============
const showEnterAnimation = ref(true)
const enterProgress = ref(0)
const showVictoryScreen = ref(false)
const showStageTransition = ref(false)
const stageTransitionText = ref('')
const isBossStage = computed(() => {
const stage = dungeonStages.value[currentStageIndex.value]
return stage?.isBoss === true
})

/**
 * 获取副本最后一个BOSS阶段数据
 * 用途/业务意图：在入场动画中展示最终BOSS图片，给玩家预告
 * @returns {Object|null} 最后一个 isBoss 为 true 的阶段对象
 */
const lastBossStage = computed(() => {
  const stages = dungeonStages.value
  if (!Array.isArray(stages) || stages.length === 0) {
    return null
  }
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i]?.isBoss) {
      return stages[i]
    }
  }
  return null
})

/**
 * 入场动画BOSS图片加载失败处理
 * @param {Event} event - 图片错误事件
 */
const handleEnterBossImageError = (event) => {
  event.target.style.display = 'none'
}


// ============ 技能冷却状态 ============
// 使用普通对象存储冷却状态，避免响应式系统的性能开销
// 同时作为冷却状态的唯一真实来源
const skillCooldownsMap = new Map() // Map<cooldownKey, cooldownEndTime>
let cooldownTicker = null

/**
 * 设置技能冷却
 * @param {string} memberId - 成员ID（'player' 或 'member_x'）
 * @param {string} skillKey - 技能key
 * @param {number} cooldownSeconds - 冷却时间（秒）
 * @returns {boolean} 是否成功设置冷却（false表示已有冷却未结束）
 */
const setSkillCooldown = (memberId, skillKey, cooldownSeconds) => {
  if (!memberId || !skillKey) return false
  // 确保冷却时间至少为1秒
  const effectiveCooldown = Math.max(1, cooldownSeconds || 0)
  const cooldownKey = `${memberId}_${skillKey}`
  const now = Date.now()
  const cooldownEnd = now + effectiveCooldown * 1000

  // 检查是否已有冷却且未结束（防止竞态条件重复设置）
  const existingCooldownEnd = skillCooldownsMap.get(cooldownKey)
  if (existingCooldownEnd && existingCooldownEnd > now) {
    // 已有冷却未结束，不覆盖
    return false
  }

  skillCooldownsMap.set(cooldownKey, cooldownEnd)
  startCooldownTicker()
  return true
}

/**
 * 获取技能剩余冷却时间（秒）
 * @param {string} memberId - 成员ID
 * @param {string} skillKey - 技能key
 * @returns {number} 剩余冷却时间（秒），0表示已冷却完毕
 */
const getSkillRemainingCooldown = (memberId, skillKey) => {
  if (!memberId || !skillKey) return 0
  const cooldownKey = `${memberId}_${skillKey}`
  const cooldownEnd = skillCooldownsMap.get(cooldownKey)
  if (!cooldownEnd) return 0

  const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000)
  return Math.max(0, remaining)
}

/**
 * 检查技能是否冷却中
 * @param {string} memberId - 成员ID
 * @param {string} skillKey - 技能key
 * @returns {boolean} 是否正在冷却中
 */
const isSkillOnCooldown = (memberId, skillKey) => {
  return getSkillRemainingCooldown(memberId, skillKey) > 0
}

/**
 * 启动冷却计时器（每秒检查一次）
 */
const startCooldownTicker = () => {
  if (cooldownTicker) return

  cooldownTicker = setInterval(() => {
    const now = Date.now()
    let hasActiveCooldown = false

    // 遍历 Map 清理过期冷却
    for (const [key, endTime] of skillCooldownsMap.entries()) {
      if (endTime && endTime <= now) {
        // 冷却结束，移除
        skillCooldownsMap.delete(key)
      } else if (endTime && endTime > now) {
        hasActiveCooldown = true
      }
    }

    // 如果没有活跃的冷却，停止计时器
    if (!hasActiveCooldown) {
      clearInterval(cooldownTicker)
      cooldownTicker = null
    }
  }, 1000)
}

/**
 * 停止冷却计时器
 */
const stopCooldownTicker = () => {
  if (cooldownTicker) {
    clearInterval(cooldownTicker)
    cooldownTicker = null
  }
}

// ============ 奖励状态 ============
const goldReward = ref(0)
const expReward = ref(0)
const rewardItems = ref([])

// ============ 悬浮提示 ============
const tooltip = ref({
  visible: false,
  position: {},
  title: '',
  content: ''
})

// ============ 计时器 ============
let countdownTimer = null
let autoBattleTimer = null // 兼容旧代码，不再使用
let enterAnimationTimer = null
/** 副本进度自动保存定时器（每30秒保存一次） */
let dungeonAutoSaveTimer = null
// 每个成员的独立攻击定时器 Map<slotId, timerId>
const memberAttackTimers = new Map()

// ============ 背景音乐 ============
const bgmAudio = ref(null)

// ============ 自动战斗状态 ============
const autoBattle = ref(false)

// ============ 音频服务 ============
const audioService = new AudioService()
let lastSkillSoundTime = 0
const skillSoundInterval = 120
let lastAttackSoundTime = 0
const attackSoundInterval = 100 // 普通攻击音效节流间隔

// ============ 武器技能触发服务（水弹等） ============
const weaponSkillTriggerService = new WeaponSkillTriggerService(audioService)

// ============ 血条日志缓存（节流输出） ============
let _hpBarLogCache = null

// ============ DPS排行榜 ============
/** 是否显示DPS排行榜 */
const showDpsRanking = ref(false)
/** DPS排行榜数据 */
const dpsRankingData = ref([])
/** 每个成员的累计伤害（每秒重置） */
const dpsAccumulatedDamage = ref(new Map())
/** 每个成员的总伤害（累计不重置） */
const dpsTotalDamage = ref(new Map())
/** 上一次DPS计算时间 */
let lastDpsCalculationTime = 0
/** DPS计算定时器 */
let dpsCalculationTimer = null
/** 总队伍成员数量（玩家 + 队员） */
const totalTeamMembers = computed(() => 1 + (teamMembers.value?.length || 0))

/** 怪物攻击定时器 */
let monsterAttackTimer = null

// ============ 统一伤害数字队列（使用 DamageNumber.vue 组件渲染） ============
/**
 * 全局伤害数字队列，供 DamageNumber.vue 组件消费。
 * 格式与 useUI.js 中的 damageNumbers 一致，支持逐字符跳动动画。
 */
const dungeonDamageNumbers = ref([])
/** 伤害数字唯一 ID 自增计数器（模块级单调递增，避免 Duplicate keys） */
let dungeonDamageNumberIdCounter = 0
/** 伤害数字生命周期（ms），超过后自动清理 */
const DUNGEON_DAMAGE_NUMBER_LIFETIME_MS = 2600
/** 伤害数字清理间隔（ms） */
const DUNGEON_DAMAGE_PRUNE_INTERVAL_MS = 400
/** 伤害数字最大并发数量 */
const DUNGEON_MAX_DAMAGE_NUMBERS = 60
/** 清理定时器句柄 */
let dungeonDamagePruneTimer = null

/**
 * 生成伤害数字唯一 ID
 * @returns {number} 全局唯一的数字 ID
 */
const generateDungeonDamageId = () => {
  dungeonDamageNumberIdCounter += 1
  return dungeonDamageNumberIdCounter
}

/**
 * 清理过期的伤害数字
 */
const pruneDungeonDamageNumbers = () => {
  const list = dungeonDamageNumbers.value
  if (!Array.isArray(list) || list.length === 0) return
  const now = Date.now()
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i]
    if (!item || typeof item !== 'object') {
      list.splice(i, 1)
      continue
    }
    const createdAt = item.createdAt ?? item.timestamp ?? 0
    if (now - createdAt > DUNGEON_DAMAGE_NUMBER_LIFETIME_MS) {
      list.splice(i, 1)
    }
  }
}

/**
 * 启动伤害数字定期清理定时器
 */
const startDungeonDamagePrune = () => {
  if (dungeonDamagePruneTimer) return
dungeonDamagePruneTimer = setInterval(() => {
// 组件正在卸载时跳过响应式更新，避免 patch 到已销毁的子组件导致 emitsOptions null 报错
if (isComponentUnmounting.value) return
pruneDungeonDamageNumbers()
}, DUNGEON_DAMAGE_PRUNE_INTERVAL_MS)
}

/**
 * 停止伤害数字定期清理定时器
 */
const stopDungeonDamagePrune = () => {
  if (dungeonDamagePruneTimer) {
    clearInterval(dungeonDamagePruneTimer)
    dungeonDamagePruneTimer = null
  }
}

/**
* 计算怪物卡片的屏幕坐标（用于伤害飘字定位）
* 伤害数字显示在怪物图片上方 10-50px 随机位置，X 轴在怪物图片宽度范围内
* @param {Object} monster - 怪物对象
* @param {boolean} isOffhand - 是否副手攻击（true=偏右，false=偏左）
* @returns {{screenXAbs: number, screenYAbs: number}} 屏幕绝对坐标
*/
const getMonsterCardScreenPos = (monster, isOffhand = false) => {
const card = document.querySelector(`[data-monster-uid="${monster.uid}"]`)
if (!card) {
// 回退到屏幕中心
return { screenXAbs: window.innerWidth / 2, screenYAbs: window.innerHeight / 3 }
}
const rect = card.getBoundingClientRect()
// X 轴：在怪物图片宽度范围内随机
// 双刀流：主手偏左半区，副手偏右半区
const halfWidth = rect.width / 2
const randomX = isOffhand
? rect.left + halfWidth + Math.random() * halfWidth // 副手：右半区
: rect.left + Math.random() * halfWidth // 主手：左半区
// Y 轴：怪物图片上方 10-50px 随机显示
const randomY = rect.top - 10 - Math.random() * 40
return { screenXAbs: Math.round(randomX), screenYAbs: Math.round(randomY) }
}

/**
 * 计算玩家头像的屏幕坐标（用于伤害飘字定位）
 * @returns {{screenXAbs: number, screenYAbs: number}} 屏幕绝对坐标
 */
const getPlayerScreenPos = () => {
  const avatar = document.getElementById('playerAvatar')
  if (!avatar) {
    return { screenXAbs: window.innerWidth / 2, screenYAbs: window.innerHeight * 0.7 }
  }
  const rect = avatar.getBoundingClientRect()
  const randomX = rect.left + rect.width * 0.2 + Math.random() * rect.width * 0.6
  const randomY = rect.top + rect.height * 0.3 + Math.random() * rect.height * 0.4
  return { screenXAbs: Math.round(randomX), screenYAbs: Math.round(randomY) }
}

/**
 * 计算队友卡片的屏幕坐标（用于伤害飘字定位）
 * @param {number} slotId - 队友槽位 ID
 * @returns {{screenXAbs: number, screenYAbs: number}} 屏幕绝对坐标
 */
const getTeammateScreenPos = (slotId) => {
// 根据 slotId 精确查找对应队员的卡片
const card = document.querySelector(`.team-member-card.is-teammember[data-slot-id="${slotId}"]`)
if (card) {
const avatar = card.querySelector('.member-avatar')
if (avatar) {
const rect = avatar.getBoundingClientRect()
const randomX = rect.left + rect.width * 0.2 + Math.random() * rect.width * 0.6
const randomY = rect.top + rect.height * 0.3 + Math.random() * rect.height * 0.4
return { screenXAbs: Math.round(randomX), screenYAbs: Math.round(randomY) }
}
}
// 回退：尝试查找第一个队员卡片
const fallbackCard = document.querySelector('.team-member-card.is-teammember .member-avatar')
if (fallbackCard) {
const rect = fallbackCard.getBoundingClientRect()
const randomX = rect.left + rect.width * 0.2 + Math.random() * rect.width * 0.6
const randomY = rect.top + rect.height * 0.3 + Math.random() * rect.height * 0.4
return { screenXAbs: Math.round(randomX), screenYAbs: Math.round(randomY) }
}
return { screenXAbs: window.innerWidth / 2, screenYAbs: window.innerHeight * 0.7 }
}

/**
 * 向全局伤害数字队列添加一条记录
 * @param {Object} data - 伤害数字数据（符合 DamageNumber.vue 格式）
 */
const pushDungeonDamageNumber = (data) => {
  const id = generateDungeonDamageId()
  const now = Date.now()
  dungeonDamageNumbers.value.push({
    id,
    createdAt: now,
    timestamp: now,
    ...data
  })
  // 限制最大并发数量
  if (dungeonDamageNumbers.value.length > DUNGEON_MAX_DAMAGE_NUMBERS) {
    dungeonDamageNumbers.value.splice(0, dungeonDamageNumbers.value.length - DUNGEON_MAX_DAMAGE_NUMBERS)
  }
}

// ============ 计算属性 ============
const playerAvatar = computed(() => {
  if (!player.value?.class) {
    return '/pt/job_icon/cxz_nan_icon.png'
  }
  return getClassIconPath(player.value.class, player.value.sex)
})

const healthPercentage = computed(() => {
  // eslint-disable-next-line no-void
  void gameStore.buffVersion
  const current = Number(player.value?.currentHealth) || 0
  const max = Number(player.value?.maxHealth) || 1
  return Math.max(0, Math.min(100, (current / max) * 100))
})

const manaPercentage = computed(() => {
  // eslint-disable-next-line no-void
  void gameStore.buffVersion
  const current = Number(player.value?.currentMana) || 0
  const max = Number(player.value?.maxMana) || 1
  return Math.max(0, Math.min(100, (current / max) * 100))
})

const userSettings = computed(() => gameStore.userSettings || {})

const gameData = computed(() => {
  if (gameStore.gameData && Object.keys(gameStore.gameData).length > 0) {
    return gameStore.gameData
  }
  if (window.gameData && typeof window.gameData === 'object') {
    return window.gameData
  }
  return {}
})

// 怪物显示（数量与团队人数一致）
const visibleMonsters = computed(() => {
  return monsters.value.slice(0, teamSize.value)
})

// 难度样式类
const difficultyClass = computed(() => {
  const difficultyMap = {
    '普通': 'difficulty-normal',
    '中等': 'difficulty-medium',
    '困难': 'difficulty-hard',
    '噩梦': 'difficulty-nightmare',
    '地狱': 'difficulty-hell'
  }
  return difficultyMap[dungeonInfo.value.difficulty] || 'difficulty-normal'
})

// 当前进度
const totalProgress = computed(() => {
  if (dungeonStages.value.length === 0) return 0
  const completedStages = currentStageIndex.value
  const currentStageProgress = currentStageKills.value / (currentStageData.value?.count || 1)
  return ((completedStages + currentStageProgress) / dungeonStages.value.length) * 100
})

// 当前阶段数据
const currentStageData = computed(() => dungeonStages.value[currentStageIndex.value])

/**
 * 判断当前阶段是否为单目标阶段（击杀数量 = 1）
 * 用于判断是否需要放大怪物容器
 */
const isSingleTargetStage = computed(() => {
  const stage = currentStageData.value
  return stage && stage.count === 1
})

// 战斗时间格式化
const formatBattleTime = computed(() => {
  const elapsed = initialDungeonSeconds.value - remainingSeconds.value
  return formatTime(Math.max(0, elapsed))
})

// ============ 生命周期 ============

/**
 * 页面刷新/关闭前保存数据
 */
const handleBeforeUnload = () => {
// 刷新成就击杀队列，确保未提交的击杀进度被持久化
flushAchievementKills()
// 紧急同步保存玩家数据（绕过防抖，确保页面关闭时数据不丢失）
storageService.emergencySavePendingPatches(player.value)

  // 如果副本已通关或超时，清除存档；否则保存进度
  if (showVictoryScreen.value || remainingSeconds.value <= 0) {
    storageService.clearDungeonProgress()
  } else {
    saveDungeonProgress()
  }
}

onMounted(() => {
  initDungeon()
  playBgm()
  // 预加载所有角色数据到缓存，避免切换角色时卡顿
  preloadAllCharactersData()
  // 启动伤害数字定期清理定时器
  startDungeonDamagePrune()
  
  // 启动副本进度自动保存定时器（每30秒保存一次，防止刷新丢失进度）
  dungeonAutoSaveTimer = setInterval(() => {
    if (isBattleStarted.value && !showVictoryScreen.value && !showDeathPanel.value) {
      saveDungeonProgress()
    }
  }, 30000)
  // 注册页面刷新/关闭前保存数据
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // 注册队友BUFF变化回调（用于队友使用buff道具后重新计算属性和刷新UI）
  registerSpecialItemCallbacks({
    onTeammateBuffChanged: (teammateData) => {
      // 重新计算队友属性
      recalculateMemberStats(teammateData)
      // 更新 gameStore.buffVersion 以通知 PlayerDetailModal 刷新显示
      gameStore.buffVersion++
      buffVersion.value++
      // 如果当前显示的是该队友的详情面板，同步 selectedMember 的 activeBuffs
      if (selectedMember.value && selectedMember.value.slotId === teammateData.slotId) {
        selectedMember.value.activeBuffs = teammateData.activeBuffs
      }
    },
    onTeammateDataSave: (teammateData) => {
      // 保存队友数据到对应的存档槽
      saveTeamMemberData(teammateData)
    }
  })
})

/**
 * 组件卸载前钩子
 * 在组件开始卸载前设置标志并清理所有定时器，
 * 防止定时器回调在卸载过程中触发响应式更新导致 shouldUpdateComponent 报错
 */
onBeforeUnmount(() => {
  // 设置卸载标志，定时器回调检查此标志跳过响应式更新
  isComponentUnmounting.value = true

  // 提前清理所有定时器（onUnmounted 中也会清理，但那时组件已销毁，定时器可能在卸载过程中触发）
  cleanup()
  stopBuffCountdown()
  stopCooldownTicker()
  stopDpsTracking()
  stopDungeonDamagePrune()
})

onUnmounted(() => {
  // onBeforeUnmount 已清理定时器，这里做额外清理确保无遗漏
  cleanup()
  stopBgm()
  stopBuffCountdown()
  stopCooldownTicker()
  stopDpsTracking()
  // 停止伤害数字清理定时器
  stopDungeonDamagePrune()
  // 立即保存所有未保存的数据
  flushAllPendingSaves()
  // 刷新成就击杀队列，确保未提交的击杀进度不丢失
  flushAchievementKills()
  // 移除 beforeunload 事件监听器
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 监听 gameStore.buffVersion 变化，同步 selectedMember 的 activeBuffs
// 这是为了解决队友详情面板打开时，BUFF 变化后面板不更新的问题
watch(
  () => gameStore.buffVersion,
  () => {
    // 如果当前显示的是队友的详情面板，需要同步 teamMembers 中对应队友的 activeBuffs
    if (selectedMember.value && selectedMember.value._isPlayer !== true && selectedMember.value !== player.value) {
      const teamMember = teamMembers.value.find(m => m.slotId === selectedMember.value.slotId)
      if (teamMember && teamMember.activeBuffs) {
        // 同步 activeBuffs
        selectedMember.value.activeBuffs = teamMember.activeBuffs
      }
    }
  }
)

// 监听经验分配模式变化，更新成员经验加成标识
watch(
  expDistributionMode,
  () => {
    updateMemberExpBonus()
  }
)

// 监听攻击力加成模式变化，更新成员攻击力加成标识
watch(
  attackBonusMode,
  () => {
    updateMemberAttackBonus()
  }
)

// 监听队伍成员数量变化，更新成员经验加成标识和攻击力加成标识
watch(
  () => teamMembers.value.length,
  () => {
    updateMemberExpBonus()
    updateMemberAttackBonus()
  }
)

// ============ 初始化方法 ============

/**
 * 初始化副本
 */
const initDungeon = async () => {
try {
isLoading.value = true

    // 初始化游戏数据
    if (!gameInitializer.value) {
      try {
        gameInitializer.value = new StaticGameInitializer()
        await gameInitializer.value.initGame()
      } catch (error) {
        console.error('[Dungeon] 游戏数据初始化失败:', error)
      }
    }

    // 加载玩家数据（loadPlayerData 是异步方法，必须 await）
    const savedPlayer = await storageService.loadPlayerData()
    if (!savedPlayer) {
      router.push('/select')
      return
    }
    
    // 获取当前存档槽ID并设置到玩家数据中
    const currentSaveSlot = storageService.getCurrentSaveSlot()
    savedPlayer.slotId = currentSaveSlot

    // 确保 Player 是一个正确的实例，以便调用 applyFinalStats
    if (!(savedPlayer instanceof Player)) {
      player.value = new Player(savedPlayer)
    } else {
      player.value = savedPlayer
    }
    // 添加玩家标记，用于区分玩家和队员
    player.value._isPlayer = true
    // 确保 slotId 存在
    if (player.value.slotId === undefined) {
      player.value.slotId = currentSaveSlot
    }
    gameStore.setPlayer(player.value)
    
    // 过滤掉已过期的 BUFF
    if (player.value.activeBuffs && Array.isArray(player.value.activeBuffs)) {
      const now = Date.now()
      const expiredBuffs = player.value.activeBuffs.filter(buff => {
        const buffEndTime = buff.endTime || buff.expiresAt
        return buffEndTime && buffEndTime <= now
      })
      
      if (expiredBuffs.length > 0) {
        player.value.activeBuffs = markRaw(player.value.activeBuffs.filter(buff => {
          const buffEndTime = buff.endTime || buff.expiresAt
          return !buffEndTime || buffEndTime > now
        }))
      }
    }
    
    // 重新计算属性（确保临时属性如元素攻击等被正确计算，并应用 BUFF 效果）
    if (typeof player.value.applyFinalStats === 'function') {
      player.value.applyFinalStats(gameStore.equipmentSets || [])
    }
    
    // 启动 BUFF 倒计时检查
    if (player.value.activeBuffs && player.value.activeBuffs.length > 0) {
      startBuffCountdown()
    }

    // 获取游戏数据
    let gameDataToUse = {}
    if (gameInitializer.value?.state?.gameData) {
      gameDataToUse = gameInitializer.value.state.gameData
      gameStore.setGameData(gameDataToUse)
    } else if (window.gameData) {
      gameDataToUse = window.gameData
      gameStore.setGameData(gameDataToUse)
    }

    // 初始化技能（使用 player.value 确保与 Main.vue 一致，传入 Player 实例）
    if (Object.keys(gameDataToUse).length > 0 && typeof skillsStore.initSkills === 'function') {
      try {
        skillsStore.initSkills(player.value, gameDataToUse)
      } catch (error) {
        console.error('[Dungeon] 技能初始化失败:', error)
      }
    }

    // 重新加载技能栏槽位数据（按当前存档槽位独立存储）
    // 确保直接进入副本页面时技能栏与当前存档一致，队长技能过滤基于此 Store
    try {
      const slotsStore = useSkillBarSlotsStore()
      slotsStore.reloadFromStorage()
    } catch (error) {
      console.error('[Dungeon] 重新加载技能栏槽位失败:', error)
    }

    // 同步背包和装备数据
    if (savedPlayer.bag) {
      itemsStore.$patch(state => { state.playerBag = savedPlayer.bag })
    }
    if (savedPlayer.equipment) {
      itemsStore.$patch(state => { state.equipment = savedPlayer.equipment })
    }
    if (savedPlayer.gold !== undefined) {
      itemsStore.$patch(state => { state.playerGold = savedPlayer.gold })
    }

    // 加载副本数据
    const dungeonId = route.params.id || '1'
    const dungeon = findDungeonById(dungeonId)

    if (!dungeon) {
      addBattleLog(`未找到副本`, '#ff4444')
      router.push('/main')
      return
    }

    originalDungeon.value = dungeon

    // 获取URL参数中的难度，如果没有则使用默认难度
    const urlDifficulty = route.query.difficulty
    const difficultyConfig = DUNGEON_DIFFICULTY_CONFIG[dungeon.name]
    
    // 查找匹配的难度配置
    let selectedDifficulty = difficultyConfig?.difficulties?.[0] || { name: '普通', dropRateMultiplier: 1.0 }
    if (urlDifficulty && difficultyConfig?.difficulties) {
      const found = difficultyConfig.difficulties.find(d => d.name === urlDifficulty)
      if (found) {
        selectedDifficulty = found
      }
    }

    dungeonInfo.value = {
      id: dungeonId,
      name: dungeon.name,
      difficulty: selectedDifficulty.name,
      multiplier: selectedDifficulty.dropRateMultiplier || 1.0,
      expMultiplier: selectedDifficulty.expMultiplier || 1.0,
      hpMultiplier: selectedDifficulty.hpMultiplier || 1.0,
      levelRange: selectedDifficulty.levelRange || [1, 200]
    }

    // 根据副本 timeLimit 设置初始倒计时秒数（用于计算已用时间）
    const timeLimitMs = parseTimeToMs(dungeon.timeLimit)
    initialDungeonSeconds.value = timeLimitMs > 0 ? Math.floor(timeLimitMs / 1000) : 3600

    // 设置副本阶段 - 优先使用 difficultyMonsters，根据难度选择对应的怪物列表
    let monsterList = []
    if (dungeon.difficultyMonsters && dungeon.difficultyMonsters[selectedDifficulty.name]) {
      // 使用硬编码的难度对应怪物列表
      monsterList = dungeon.difficultyMonsters[selectedDifficulty.name]
    } else {
      // 回退到默认 monsters 列表
      monsterList = dungeon.monsters || []
    }
    
    dungeonStages.value = monsterList.map(m => {
      // 从静态数据获取怪物的 rank
      const monsterData = MONSTER_INFO[m.id]
      const staticRank = monsterData?.rank || 'normal'
      // 判断是否为Boss：rank为boss/giant/violet/super/worldboss均为Boss类型
      // giant=巨型BOSS, violet=堕落BOSS, boss=BOSS, super=超级BOSS, worldboss=世界BOSS
      const isBoss = staticRank === 'boss' || staticRank === 'super' || staticRank === 'worldboss' || staticRank === 'giant' || staticRank === 'violet'
      return {
        name: m.name,
        count: m.count,
        monsterId: m.id,
        monsterIcon: `/pt/monster_icon/${m.id}.png`,
        isBoss,
        // rank直接使用静态数据的rank
        rank: staticRank
      }
    })

    // 尝试加载保存的副本进度（loadDungeonProgress 是异步方法，必须 await）
    const savedProgress = await storageService.loadDungeonProgress()
    // 检查存档是否匹配当前副本ID和难度
    const isSameDungeon = savedProgress && 
      savedProgress.dungeonId === dungeonId && 
      savedProgress.difficulty === selectedDifficulty.name
    
    if (isSameDungeon) {
      // 使用副本计时器状态判断是否超时（活跃期内可继续，CD期则不可进入）
      const timerState = getDungeonState(dungeonId)
      const isTimeout = timerState.state !== 'active'
      
      if (isTimeout) {
        // 副本已超时，清除旧进度，不恢复
        storageService.clearDungeonProgress()
        if (timerState.state === 'cooldown') {
          // 倒计时已结束且在CD中，跳转回主城
          addBattleLog('副本倒计时已结束，正在返回主城', '#ff9800')
          setTimeout(() => router.push('/main'), 2000)
          return
        }
        addBattleLog('之前的副本已超时，开始新的副本', '#ff9800')
      } else {
        // 恢复副本进度
        currentStageIndex.value = savedProgress.currentStageIndex || 0
        currentStageKills.value = savedProgress.currentStageKills || 0
        totalKills.value = savedProgress.totalKills || 0
        // 使用计时器的剩余时间（基于绝对时间戳，比存档中的 remainingSeconds 更准确）
        remainingSeconds.value = getRemainingCountdownSeconds(dungeonId)

        // 恢复怪物数据
        if (savedProgress.monsters && savedProgress.monsters.length > 0) {
          monsters.value = savedProgress.monsters.map(m => {
            // 从静态数据获取缺失的战斗属性
            const monsterData = MONSTER_INFO[m.monsterId || m.id]
            const hpMultiplier = dungeonInfo.value.hpMultiplier || dungeonInfo.value.multiplier
            const attackMultiplier = dungeonInfo.value.hpMultiplier || dungeonInfo.value.multiplier
            
            return {
              ...m,
              // 根据 monsterId 或 id 生成图标路径
              icon: m.icon || `/pt/monster_icon/${m.monsterId || m.id}.png`,
              // 计算血量百分比
              healthPercentage: m.maxHealth > 0 ? (m.currentHealth / m.maxHealth) * 100 : 100,
              // 重置状态
              isHit: false,
              isDying: false,
              // 从静态数据补充战斗属性
              minAttack: m.minAttack || Math.floor((monsterData?.minAttack || 50) * attackMultiplier),
              maxAttack: m.maxAttack || Math.floor((monsterData?.maxAttack || 150) * attackMultiplier),
              attack: m.attack || Math.floor(((monsterData?.minAttack || 50) + (monsterData?.maxAttack || 150)) / 2 * attackMultiplier),
              defense: m.defense || monsterData?.defense || 10,
              experience: m.experience || Math.floor((monsterData?.exp || 100) * (dungeonInfo.value.expMultiplier || dungeonInfo.value.multiplier)),
              experienceTable: m.experienceTable || monsterData?.experienceTable || null,
              // 补充掉落数据（新增）
              drops: m.drops || monsterData?.drops || [],
              minDropGold: m.minDropGold ?? monsterData?.minDropGold ?? null,
              maxDropGold: m.maxDropGold ?? monsterData?.maxDropGold ?? null,
              // 补充可能缺失的字段
              damageNumbers: [],
              damageContribution: {},
              isAttacking: false
            }
          })
        }

        // 恢复玩家状态
        if (savedProgress.player) {
          player.value.currentHealth = savedProgress.player.currentHealth
          player.value.maxHealth = savedProgress.player.maxHealth
          player.value.currentMana = savedProgress.player.currentMana
          player.value.maxMana = savedProgress.player.maxMana
          if (savedProgress.player.activeBuffs) {
            player.value.activeBuffs = markRaw(savedProgress.player.activeBuffs)
          }
          if (savedProgress.player.exp !== undefined) {
            player.value.exp = savedProgress.player.exp
          }
          if (savedProgress.player.gold !== undefined) {
            player.value.gold = savedProgress.player.gold
          }
        }

        // 保存队友恢复数据，等待预加载完成后处理
        if (savedProgress.teamMembers && savedProgress.teamMembers.length > 0) {
          pendingSavedProgress = savedProgress
        }

        // 旧版存档可能包含待分配物品队列，新版已改为掉落动画系统，直接清空
        if (savedProgress.pendingLootItems && savedProgress.pendingLootItems.length > 0) {
          addBattleLog(`已清理 ${savedProgress.pendingLootItems.length} 件旧版待分配物品（新版掉落系统）`, '#9e9e9e')
        }
        
        // 如果有存档数据，标记战斗已开始并输出恢复日志
        if (savedProgress.currentStageIndex > 0 || savedProgress.currentStageKills > 0 || (savedProgress.monsters && savedProgress.monsters.length > 0)) {
          isBattleStarted.value = true
          const savedTime = savedProgress.savedAt ? new Date(savedProgress.savedAt).toLocaleTimeString() : ''
          // 格式化剩余时间
          const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            return `${mins}:${secs.toString().padStart(2, '0')}`
          }
          addBattleLog(`已恢复副本进度：第 ${currentStageIndex.value + 1} 阶段，击杀 ${currentStageKills.value} 只`, '#4CAF50')
          addBattleLog(`剩余时间：${formatTime(remainingSeconds.value)}`, '#4CAF50')
          if (savedTime) {
            addBattleLog(`上次保存时间：${savedTime}`, '#9e9e9e')
          }
          if (savedProgress.monsters && savedProgress.monsters.length > 0) {
            addBattleLog(`已恢复 ${savedProgress.monsters.length} 只怪物状态`, '#4CAF50')
          }
          if (savedProgress.teamMembers && savedProgress.teamMembers.length > 0) {
            addBattleLog(`已恢复 ${savedProgress.teamMembers.length} 名队友状态`, '#4CAF50')
          }
        }
      }
    }

    // 如果未从存档恢复剩余时间，从副本计时器获取（活跃期内重入或新进入）
    const currentTimerState = getDungeonState(dungeonId)
    if (currentTimerState.state === 'active') {
      const timerRemaining = getRemainingCountdownSeconds(dungeonId)
      if (timerRemaining > 0) {
        remainingSeconds.value = timerRemaining
      }
    } else if (currentTimerState.state === 'cooldown') {
      // 副本已在CD中，无法进入
      addBattleLog('副本冷却中，无法进入', '#ff4444')
      setTimeout(() => router.push('/main'), 2000)
      return
    } else {
      // 无计时器记录（available状态），使用 timeLimit 设置默认倒计时
      if (timeLimitMs > 0) {
        remainingSeconds.value = Math.floor(timeLimitMs / 1000)
      }
    }

    // 开始入场动画
    startEnterAnimation()

  } catch (error) {
    console.error('[Dungeon] 初始化失败:', error)
    isLoading.value = false
    showEnterAnimation.value = false
  }
}

/**
 * 根据ID查找副本
 */
const findDungeonById = (dungeonId) => {
  const id = Number(dungeonId)
  for (const mapName in dungeonData) {
    const dungeons = dungeonData[mapName]
    if (Array.isArray(dungeons)) {
      const found = dungeons.find(d => d.id === id)
      if (found) return found
    }
  }
  return null
}

/**
 * 开始入场动画
 */
const startEnterAnimation = () => {
  showEnterAnimation.value = true
  enterProgress.value = 0

  enterAnimationTimer = setInterval(() => {
    enterProgress.value += 2
    if (enterProgress.value >= 100) {
      clearInterval(enterAnimationTimer)
      enterAnimationTimer = null

      setTimeout(() => {
        showEnterAnimation.value = false
        isLoading.value = false

        // 开始副本
        battleStartTime.value = Date.now()
        startCountdown()
        
        // 如果没有已恢复的怪物数据，才生成新怪物
        if (monsters.value.length === 0) {
          generateMonsters()
        }
        
        addBattleLog(`进入【${dungeonInfo.value.name}】，难度：${dungeonInfo.value.difficulty}`, '#ffd700')
      }, 500)
    }
  }, 50)
}

// ============ 战斗方法 ============

/**
 * 生成当前阶段怪物
 * 怪物数量与团队人数一致
 * 使用MONSTER_INFO中的真实怪物数据
 * 直接使用硬编码的怪物ID，不再动态查找
 */
const generateMonsters = (options = {}) => {
  const { append = false } = options
  const currentStage = dungeonStages.value[currentStageIndex.value]
  if (!currentStage) return

  const monsterList = append ? [...monsters.value.filter(m => m && !m.isDying)] : []
  const remaining = currentStage.count - currentStageKills.value
  // 怪物数量与团队人数一致，但不超过剩余数量和最大限制（8个）
  const MAX_MONSTERS = 8
  const totalTeamSize = 1 + teamMembers.value.length // 队长 + 队员
  let displayCount = Math.min(remaining, totalTeamSize, MAX_MONSTERS)

  // 补充模式：只添加缺少的怪物数量，保留已有存活怪物
  if (append) {
    const aliveCount = monsterList.filter(m => m.currentHealth > 0).length
    displayCount = Math.max(0, displayCount - aliveCount)
    if (displayCount <= 0) return
  }

  // 直接使用硬编码的怪物ID，获取怪物静态数据
  const monsterData = MONSTER_INFO[currentStage.monsterId]

  for (let i = 0; i < displayCount; i++) {
    // 使用真实怪物数据或回退到默认值
    const baseHp = monsterData?.hp || (1000 + currentStageIndex.value * 500)
    const baseMinAttack = monsterData?.minAttack || (50 + currentStageIndex.value * 20)
    const baseMaxAttack = monsterData?.maxAttack || baseMinAttack + 100
    const baseDefense = monsterData?.defense || 10
    // 使用怪物静态数据中的实际等级，而非队长等级
    const baseLevel = monsterData?.level || 1
    const baseElement = monsterData?.element || 'neutral'
    const baseRank = monsterData?.rank || 'normal'

    // 根据难度倍率调整属性
    const hpMultiplier = dungeonInfo.value.hpMultiplier || dungeonInfo.value.multiplier
    const attackMultiplier = dungeonInfo.value.hpMultiplier || dungeonInfo.value.multiplier

    const monster = {
      uid: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      id: currentStage.monsterId,
      name: currentStage.name,
      level: baseLevel,
      icon: currentStage.monsterIcon,
      // 直接使用阶段配置中的rank（已从静态数据获取）
      rank: currentStage.rank || baseRank,
      element: baseElement,
      maxHealth: Math.floor(baseHp * hpMultiplier),
      currentHealth: Math.floor(baseHp * hpMultiplier),
      healthPercentage: 100,
      minAttack: Math.floor(baseMinAttack * attackMultiplier),
      maxAttack: Math.floor(baseMaxAttack * attackMultiplier),
      attack: Math.floor(((baseMinAttack + baseMaxAttack) / 2) * attackMultiplier),
      defense: baseDefense,
      experience: Math.floor((monsterData?.exp || (10 * baseLevel)) * (dungeonInfo.value.expMultiplier || dungeonInfo.value.multiplier)),
      experienceTable: monsterData?.experienceTable || null, // 保存经验表用于计算
      drops: monsterData?.drops || [], // 添加掉落配置
      minDropGold: monsterData?.minDropGold || null, // 最小掉落金币
      maxDropGold: monsterData?.maxDropGold || null, // 最大掉落金币
      isAttacking: false,
      isHit: false,
      isDying: false,
      damageNumbers: [],
      // 记录每个成员对怪物的伤害贡献
      damageContribution: {}
    }

    monsterList.push(monster)
  }

  monsters.value = monsterList
}

/**
 * 批量刷新怪物UI（性能优化：合并多次更新）
 * @description 使用节流机制，16ms内只刷新一次UI
 */
const flushMonsterUpdates = () => {
  if (pendingMonsterUpdates.size === 0) return

  const now = Date.now()
  if (now - lastMonsterUpdateTime < 16) {
    // 16ms内跳过，等待下一帧
    requestAnimationFrame(flushMonsterUpdates)
    return
  }

  // 批量应用更新
  let needsFlush = false
  pendingMonsterUpdates.forEach((updates, uid) => {
    const index = monsters.value.findIndex(m => m.uid === uid)
    if (index !== -1) {
      Object.assign(monsters.value[index], updates)
      needsFlush = true
    }
  })

  // 一次性触发响应式更新
  if (needsFlush) {
    monsters.value = [...monsters.value]
  }

  pendingMonsterUpdates.clear()
  lastMonsterUpdateTime = now
}

/**
 * 应用伤害到怪物（优化版：使用批量更新机制）
 * @param {Object} monster - 怪物对象
 * @param {number} damage - 伤害值
 */
const applyDamageToMonster = (monster, damage) => {
  const index = monsters.value.findIndex(m => m.uid === monster.uid)
  if (index === -1) return

  const target = monsters.value[index]
  const newHealth = Math.max(0, target.currentHealth - damage)

  // 立即更新怪物对象的血量，确保后续死亡检测（monster.currentHealth <= 0）能读到正确值
  target.currentHealth = newHealth
  target.healthPercentage = (newHealth / target.maxHealth) * 100

  // 添加到待更新队列（仅用于触发响应式 UI 更新，不延迟实际血量数据）
  pendingMonsterUpdates.set(monster.uid, {
    currentHealth: newHealth,
    healthPercentage: target.healthPercentage,
    isHit: true
  })

  // 播放怪物受伤音效
  playMonsterHitSound(monster.uid)

  // 使用 requestAnimationFrame 批量刷新
  requestAnimationFrame(flushMonsterUpdates)

  // 延迟重置 isHit 状态
  setTimeout(() => {
    const currentIndex = monsters.value.findIndex(m => m.uid === monster.uid)
    if (currentIndex !== -1) {
      monsters.value[currentIndex].isHit = false
      // 单独更新不触发全量刷新
    }
  }, 200)
}

// ============ DPS排行榜相关函数 ============

/**
 * 初始化DPS追踪
 */
const initDpsTracking = () => {
  dpsAccumulatedDamage.value = new Map()
  dpsTotalDamage.value = new Map()
  lastDpsCalculationTime = Date.now()
  updateDpsRankingData()

  // 启动每秒计算定时器
  if (dpsCalculationTimer) {
    clearInterval(dpsCalculationTimer)
  }
  dpsCalculationTimer = setInterval(() => {
    // 组件正在卸载时跳过响应式更新，避免 patch 到已销毁的子组件导致 emitsOptions null 报错
    if (isComponentUnmounting.value) return
    calculateAndRefreshDps()
  }, 1000)
}

/**
 * 停止DPS追踪
 */
const stopDpsTracking = () => {
  if (dpsCalculationTimer) {
    clearInterval(dpsCalculationTimer)
    dpsCalculationTimer = null
  }
  showDpsRanking.value = false
}

/**
 * 记录伤害到DPS追踪
 * @param {string} memberId - 成员ID（玩家为'player'）
 * @param {string} memberName - 成员名称
 * @param {number} damage - 伤害值
 */
const recordDamageForDps = (memberId, memberName, damage) => {
  // 如果在Boss阶段但DPS排行榜还未显示，先启动DPS追踪
  if (isBossStage.value && !showDpsRanking.value) {
    showDpsRanking.value = true
    initDpsTracking()
  }

  if (!showDpsRanking.value) return

  // 记录每秒伤害（用于计算DPS）
  const current = dpsAccumulatedDamage.value.get(memberId) || { name: memberName, damage: 0 }
  current.damage += damage
  dpsAccumulatedDamage.value.set(memberId, current)

  // 记录总伤害（累计不重置）
  const total = dpsTotalDamage.value.get(memberId) || { name: memberName, damage: 0 }
  total.damage += damage
  dpsTotalDamage.value.set(memberId, total)
}

/**
 * 计算并刷新DPS数据
 */
const calculateAndRefreshDps = () => {
  const now = Date.now()
  const elapsed = (now - lastDpsCalculationTime) / 1000 // 秒
  
  if (elapsed < 1) return // 至少间隔1秒
  
  updateDpsRankingData()
  
  // 重置累计伤害
  dpsAccumulatedDamage.value = new Map()
  lastDpsCalculationTime = now
}

/**
 * 更新DPS排行榜数据
 */
const updateDpsRankingData = () => {
  const list = []

  // 添加玩家
  const playerDamage = dpsAccumulatedDamage.value.get('player')
  const playerTotal = dpsTotalDamage.value.get('player')
  list.push({
    id: 'player',
    name: player.value?.nickname || '玩家',
    dps: playerDamage ? playerDamage.damage : 0,
    totalDamage: playerTotal ? playerTotal.damage : 0,
    isPlayer: true
  })

  // 添加队伍成员（使用与记录时相同的ID格式：member_${slotId}）
  teamMembers.value.forEach((member) => {
    const memberId = `member_${member.slotId}`
    const memberDamage = dpsAccumulatedDamage.value.get(memberId)
    const memberTotal = dpsTotalDamage.value.get(memberId)
    list.push({
      id: memberId,
      name: member.nickname || `队员${member.slotId + 1}`,
      dps: memberDamage ? memberDamage.damage : 0,
      totalDamage: memberTotal ? memberTotal.damage : 0,
      isPlayer: false
    })
  })

  dpsRankingData.value = list
}

/**
 * 攻击怪物
 * @param {number} index - 怪物索引
 * @param {boolean} isAutoAttack - 是否为自动战斗攻击
 */
const attackMonster = (index, isAutoAttack = false) => {
  // 非自动战斗时，如果已经在自动战斗中则不执行手动攻击
  if (!isAutoAttack && autoBattle.value) return
  
  if (monsters.value.length === 0) return

  const monster = monsters.value[index]
  if (!monster || monster.isDying) return

  // 使用 DamageCalculator 统一计算伤害（对齐主页面逻辑：命中、暴击、元素克制、等级差、防御、碎甲、PVE加成）
  const result = DamageCalculator.calculatePlayerDamage(player.value, monster)
  let { damage, isCritical, isMiss } = result

  // 应用队伍攻击力加成（副本特有机制）
  const attackBonusPercent = getMemberAttackBonus('player')
  if (attackBonusPercent > 0) {
    damage = Math.floor(damage * (1 + attackBonusPercent / 100))
  }

  // MISS 处理：显示闪避，不造成伤害
  if (isMiss) {
    const playerWeaponIcon = getMemberWeaponIcon(player.value)
    addDamageNumber(monster, 0, false, true, playerAvatar.value, '', playerWeaponIcon)
    return
  }

  // 应用伤害（使用辅助函数统一处理响应式更新）
  applyDamageToMonster(monster, damage)

  // 记录伤害贡献（用于贡献模式经验分配）
  const playerId = 'player'
  if (!monster.damageContribution) {
    monster.damageContribution = {}
  }
  monster.damageContribution[playerId] = (monster.damageContribution[playerId] || 0) + damage

  // 记录DPS
  recordDamageForDps('player', player.value?.nickname || '玩家', damage)

  // 显示伤害数字（玩家手动普通攻击）
  const playerWeaponIcon = getMemberWeaponIcon(player.value)
  addDamageNumber(monster, damage, isCritical, false, playerAvatar.value, '', playerWeaponIcon)

  // 检查怪物死亡
  if (monster.currentHealth <= 0) {
    handleMonsterDefeated(monster, index)
  }
}

/**
 * 检查成员是否拥有 mp_maintain 类型BUFF，若有则将MP维持满值
 * 用途/业务意图：钻石商店物品「无敌魔力多」(ID:5883) 使用后创建 mp_maintain BUFF，
 * 技能消耗MP后立即恢复满值，确保BUFF持续期间MP始终维持满值。
 * 副本页面不使用 useGameLoopManager，因此需要在每次技能消耗MP后手动检查。
 * @param {Object} memberData - 成员数据（队长或队员）
 * @returns {void}
 */
const maintainMpIfBuffed = (memberData) => {
  if (!memberData) return
  const buffs = memberData.activeBuffs
  if (!Array.isArray(buffs) || buffs.length === 0) return

  // 检查是否存在 mp_maintain 类型且未过期的BUFF
  const now = Date.now()
  const hasMpMaintain = buffs.some(buff => {
    if (!buff || buff.type !== 'mp_maintain') return false
    const expiresAt = Number(buff.expiresAt ?? 0)
    return expiresAt <= 0 || expiresAt > now
  })

  if (hasMpMaintain) {
    const maxMana = Number(memberData.maxMana ?? 0)
    if (maxMana > 0) {
      memberData.currentMana = maxMana
    }
  }
}

/**
 * 检查并触发骑士的双倍惩戒被动技能
 * @param {Object} playerData - 玩家数据
 * @param {Array} monsters - 怪物数组
 * @returns {boolean} 是否触发了双倍惩戒
 */
const checkAndTriggerDoubleJudgment = (playerData, monsters) => {
  try {
    if (!playerData || (playerData.class !== 'knight' && playerData.class !== 'holy_knight')) {
      return false
    }

    // 获取双倍惩戒技能配置
    const passiveSkill = getSkill('knight', 'R')
    if (!passiveSkill) {
      return false
    }

    // 检查玩家是否已学习该技能
    // 注意：圣殿骑士(holy_knight)的R槽位是「圣盾觉醒」(unlockLevel:170)，不是骑士的「双倍惩戒」(unlockLevel:80)
    // 双倍惩戒是骑士的被动技能，圣殿骑士继承此被动，但player.skills.R指向的是圣盾觉醒
    // 因此对holy_knight不能检查player.skills.R，而应直接检查骑士R技能的解锁等级
    const playerSkill = playerData.skills?.R
    const playerClass = playerData.class
    const isDoubleJudgmentLearned = playerClass === 'holy_knight'
      ? isSkillUnlocked(playerData, 'knight', 'R')
      : (playerSkill && Number(playerSkill.proficiencyLevel ?? playerSkill.level ?? 0) >= 1)
    if (!isDoubleJudgmentLearned) {
      return false
    }

    // 检查熟练度等级（holy_knight默认1级，因为双倍惩戒maxLevel=1）
    const skillLevel = playerClass === 'holy_knight'
      ? 1
      : Number(playerSkill?.proficiencyLevel ?? playerSkill?.level ?? 1)

    // 检查MP是否足够（被动技能manaCost=0时不消耗MP，使用??避免0被||误判为falsy）
    const manaCost = passiveSkill.manaCost ?? 0
    if (manaCost > 0 && playerData.currentMana < manaCost) {
      return false
    }

    // 计算触发概率
    let chance = 25 // 默认25%
    if (typeof passiveSkill.calculateDebuffChance === 'function') {
      chance = passiveSkill.calculateDebuffChance(skillLevel)
    }

    // 检查「卡兰铎的祝福」BUFF是否激活，激活时增加双倍惩戒概率
    const activeBuffs = playerData.activeBuffs
    if (Array.isArray(activeBuffs) && activeBuffs.length > 0) {
      for (let i = 0; i < activeBuffs.length; i++) {
        const buff = activeBuffs[i]
        if (!buff || typeof buff !== 'object') continue
        // 匹配卡兰铎的祝福BUFF（通过skillId或name）
        if (buff.skillId === 'knight_u' || buff.name === '卡兰铎的祝福') {
          // 从buff效果中获取双倍惩戒概率加成
          const effects = buff.effects
          if (effects && typeof effects === 'object') {
            const djEffect = effects.doubleJudgmentChance
            if (djEffect !== undefined) {
              const bonus = typeof djEffect === 'object'
                ? Number(djEffect.add || 0)
                : Number(djEffect || 0)
              if (Number.isFinite(bonus)) {
                chance += bonus
              }
            }
          }
          break
        }
      }
    }

    // 碎甲圣裁EX3-双倍惩戒强化：当任意目标有碎甲圣裁DEBUFF时，双倍惩戒概率*2
    const armorBreakMultiplier = getArmorBreakEx3DoubleJudgmentMultiplier(playerData)
    if (armorBreakMultiplier > 0) {
      const hasArmorBreakDebuff = monsters.some(m =>
        m && m.currentHealth > 0 && m.armorBreakDebuff &&
        (!m.armorBreakDebuff.expiresAt || m.armorBreakDebuff.expiresAt > Date.now())
      )
      if (hasArmorBreakDebuff) {
        chance = chance * armorBreakMultiplier
      }
    }

    const safeChance = Math.max(0, Math.min(100, chance))

    // 概率判断
    if (Math.random() * 100 >= safeChance) {
      return false
    }

    // 获取伤害倍率
    const damageMultiplier = typeof passiveSkill.getDamageMultiplier === 'function'
      ? passiveSkill.getDamageMultiplier(skillLevel)
      : 2

    // 获取持续时间
    const duration = passiveSkill.debuff?.effect?.duration || 5

    const now = Date.now()
    const expiresAt = now + duration * 1000

    // 为所有存活的怪物添加DEBUFF
    let appliedCount = 0
    const debuffUpdates = []

    for (let i = 0; i < monsters.length; i++) {
      const monster = monsters[i]
      if (!monster || monster.currentHealth <= 0 || monster.isDefeated || monster.isDying) {
        continue
      }

      // 直接在怪物对象上设置DEBUFF
      monster.doubleJudgmentDebuff = {
        active: true,
        damageMultiplier,
        expiresAt,
        duration,
        source: passiveSkill.name || '双倍惩戒',
        icon: passiveSkill.icon || '/pt/skill_icon/rinsupcross.png',
        appliedAt: now
      }

      // 收集更新数据用于同步到store
      debuffUpdates.push({
        index: i,
        debuffType: 'doubleJudgment',
        debuffData: {
          active: true,
          damageMultiplier,
          expiresAt,
          duration,
          source: passiveSkill.name || '双倍惩戒',
          icon: passiveSkill.icon || '/pt/skill_icon/rinsupcross.png',
          appliedAt: now
        }
      })

      appliedCount++
    }

    // 批量更新store
    if (debuffUpdates.length > 0) {
      try {
        monstersStore.applyDebuffBatchUpdates(debuffUpdates)
      } catch (storeError) {
        console.error('[Dungeon] 更新双倍惩戒DEBUFF状态失败:', storeError)
      }
    }

if (appliedCount > 0) {
// 消耗MP（被动技能manaCost=0时不消耗）
if (manaCost > 0) {
playerData.currentMana = Math.max(0, playerData.currentMana - manaCost)
}

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(playerData)

      // 增加技能熟练度
      try {
        skillsStore.increaseSkillProficiency('R', 1)
      } catch (skillError) {
        console.error('[Dungeon] 增加技能熟练度失败:', skillError)
      }

      addBattleLog(`双倍惩戒触发！${appliedCount} 个敌人被施加伤害翻倍效果！`, '#9c27b0')
      return true
    }

    return false
  } catch (error) {
    console.error('[Dungeon] 检查双倍惩戒被动技能失败:', error)
    return false
  }
}

/**
 * 检查并触发守护使者的神圣之光被动技能
 * 当队友死亡后，有概率自动复活队友，恢复HP、MP到最大值
 * @param {Object} deadMember - 死亡的队友数据
 * @param {string} deadMemberType - 死亡成员类型 'player' | 'teammember'
 * @returns {boolean} 是否成功触发了复活
 */
const checkAndTriggerHolyLight = (deadMember, deadMemberType) => {
  try {
    if (!deadMember || deadMember.currentHealth > 0) {
      return false // 目标没有死亡
    }

    // 获取神圣之光技能配置
    const holyLightSkill = getSkill('guardian', 'Y')
    if (!holyLightSkill) {
      console.error('[Dungeon] 神圣之光技能配置不存在')
      return false
    }

    // 构建所有战斗成员列表（队长 + 队员）
    const allFighters = [
      { member: player.value, type: 'player' },
      ...teamMembers.value.map((member) => ({ member, type: 'teammember' }))
    ]

    const deadName = deadMember.nickname || (deadMemberType === 'player' ? '玩家' : '队友')

    // 查找队伍中会神圣之光的守护使者（存活的）
    for (const fighter of allFighters) {
      if (!fighter.member) continue

      const isAlive = fighter.member.currentHealth > 0
      if (!isAlive) continue

      const isGuardian = isGuardianClass(fighter.member.class)
      if (!isGuardian) continue

      const casterName = fighter.member.nickname || '守护使者'

      // 检查是否已学习神圣之光技能
      const memberSkill = fighter.member.skills?.Y
      if (!memberSkill) continue

      // 检查熟练度等级
      const skillLevel = memberSkill.proficiencyLevel || memberSkill.level || 0
      if (skillLevel < 1) continue

      // 检查解锁条件
      const unlockLevel = holyLightSkill.unlockLevel || 60
      if (fighter.member.level < unlockLevel) continue

      // 检查技能是否在冷却中
      const guardianId = fighter.type === 'player' ? 'player' : `member_${fighter.member.slotId}`
      const remainingCooldown = getSkillRemainingCooldown(guardianId, 'Y')
      if (remainingCooldown > 0) continue

      // 检查MP是否足够
      const manaCost = holyLightSkill.manaCost || 50
      if (fighter.member.currentMana < manaCost) continue

      // 计算触发概率
      let chance = 50 // 默认50%
      if (typeof holyLightSkill.calculateResurrectChance === 'function') {
        chance = holyLightSkill.calculateResurrectChance(skillLevel)
      }
      const safeChance = Math.max(0, Math.min(100, chance))

      // 概率判断
      const rollResult = Math.random() * 100
      if (rollResult >= safeChance) continue // 未触发，检查下一个守护使者

      // ========== 触发成功，复活队友 ==========
      // 设置技能冷却（原子操作）
      const cd = holyLightSkill.cd || 5
      if (!setSkillCooldown(guardianId, 'Y', cd)) {
        continue // 冷却未结束，检查下一个守护使者
      }

      // 恢复HP和MP到最大值
      deadMember.currentHealth = deadMember.maxHealth
      deadMember.currentMana = deadMember.maxMana

// 消耗施法者MP
fighter.member.currentMana -= manaCost

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(fighter.member)

      // 播放复活音效
      if (holyLightSkill.audio) {
        try {
          // 使用 audioService 实例播放音效
          if (typeof audioService.playSFX === 'function') {
            const sfxName = holyLightSkill.audio.replace('/sound/', '')
            audioService.playSFX(sfxName)
          }
        } catch (audioError) {
          console.error('[Dungeon] 播放复活音效失败:', audioError)
        }
      }

      // 增加技能熟练度（熟练度经验值+1，不是等级+1）
      try {
        if (fighter.type === 'player') {
          // 玩家守护使者：使用 skillsStore 增加熟练度
          skillsStore.increaseSkillProficiency('Y', 1)
        } else {
          // 队友守护使者：增加熟练度经验值
          const memberSkill = fighter.member.skills?.Y
          if (memberSkill) {
            const currentProficiency = memberSkill.proficiency || 0
            const currentLevel = memberSkill.proficiencyLevel || memberSkill.level || 1
            const maxLevel = memberSkill.proficiencyMaxLevel || 10
            
            // 增加熟练度经验值
            let nextProficiency = currentProficiency + 1
            let nextLevel = currentLevel
            
            // 升级所需经验 = 目标等级 × 10
            let expRequired = currentLevel * 10
            
            // 检查是否升级
            while (nextProficiency >= expRequired && nextLevel < maxLevel) {
              nextProficiency -= expRequired
              nextLevel += 1
              expRequired = nextLevel * 10
            }
            
            memberSkill.proficiency = nextProficiency
            memberSkill.proficiencyLevel = nextLevel
            memberSkill.level = nextLevel
            memberSkill.proficiencyExp = expRequired
          }
        }
      } catch (skillError) {
        console.error('[Dungeon] 增加技能熟练度失败:', skillError)
      }

      // 保存数据
      if (deadMemberType === 'player') {
        // 重要：先更新player.value，再保存到store
        player.value.currentHealth = deadMember.currentHealth
        player.value.currentMana = deadMember.currentMana
        gameStore.player.currentHealth = player.value.currentHealth
        gameStore.player.currentMana = player.value.currentMana
        storageService.savePlayerPatch({
          currentHealth: player.value.currentHealth,
          currentMana: player.value.currentMana
        })
        console.log(`[神圣之光] 玩家复活后HP: ${player.value.currentHealth}, MP: ${player.value.currentMana}`)
      } else {
        saveTeamMemberData(deadMember)
      }

      // 保存施法者数据（包括更新后的熟练度）
      if (fighter.type === 'player') {
        // 施法者就是玩家自己（复活自己），已经在上面处理过了
        // 只有当施法者不是被复活者时才需要单独保存
        if (deadMemberType !== 'player') {
          gameStore.player.currentMana = player.value.currentMana
          storageService.savePlayerPatch({
            currentMana: player.value.currentMana
          })
        }
      } else {
        // 保存队友施法者数据（包括更新后的熟练度和MP）
        saveTeamMemberData(fighter.member)
      }

      addBattleLog(`${casterName} 的神圣之光触发！${deadName} 已复活！`, '#FFD700')

      // 显示复活特效（治疗数字显示为"复活"）
      showResurrectEffect(deadMember, deadMemberType, holyLightSkill)

      return true
    }

    return false
  } catch (error) {
    console.error('[Dungeon] 检查神圣之光被动技能失败:', error)
    return false
  }
}

/**
 * 检查玩家背包中是否有复活卷轴（ID:6525），如果有则扣除1个并复活玩家
 * @returns {boolean} 是否成功使用复活卷轴复活
 */
const checkRevivalScroll = () => {
  try {
    // 检查玩家是否已死亡
    if (!player.value || player.value.currentHealth > 0) {
      return false
    }

    // 检查背包中是否有复活卷轴
    const scrollCount = itemsStore.getItemCount(REVIVAL_SCROLL_ID)
    if (scrollCount <= 0) {
      return false
    }

    // 扣除1个复活卷轴
    const removed = itemsStore.removeItemFromBag(REVIVAL_SCROLL_ID, 1)
    if (!removed) {
      console.error('[Dungeon] 复活卷轴扣除失败')
      return false
    }

    // 保存背包数据到 localStorage
    storageService.savePlayerPatch({
      bag: itemsStore.playerBag
    })

    // 复活玩家：恢复HP和MP到最大值
    player.value.currentHealth = player.value.maxHealth
    player.value.currentMana = player.value.maxMana
    gameStore.player.currentHealth = player.value.currentHealth
    gameStore.player.currentMana = player.value.currentMana

    // 保存玩家数据
    storageService.savePlayerPatch({
      currentHealth: player.value.currentHealth,
      currentMana: player.value.currentMana
    })

    // 停止死亡音效
    if (audioService && typeof audioService.stopDeathSFX === 'function') {
      audioService.stopDeathSFX()
    }

    // 播放复活音效
    if (audioService && typeof audioService.playResurrectSFX === 'function') {
      audioService.playResurrectSFX()
    }

    // 显示复活特效
    triggerResurrectionAnimation(player.value, 'player')

    addBattleLog(`使用复活卷轴，玩家已原地复活！`, '#FFD700')

    return true
  } catch (error) {
    console.error('[Dungeon] 检查复活卷轴失败:', error)
    return false
  }
}

/**
 * 检查队友背包中是否有复活卷轴（ID:6525），如果有则扣除1个并复活队友
 * @param {Object} memberData - 队友数据对象
 * @returns {boolean} 是否成功使用复活卷轴复活
 */
const checkMemberRevivalScroll = (memberData) => {
  try {
    // 检查队友是否已死亡
    if (!memberData || memberData.currentHealth > 0) {
      return false
    }

    // 检查队友背包中是否有复活卷轴
    if (!memberData.bag || !Array.isArray(memberData.bag)) {
      return false
    }

    // 在队友背包中查找复活卷轴
    const scrollIndex = memberData.bag.findIndex(
      bagItem => bagItem && bagItem.id === REVIVAL_SCROLL_ID
    )
    if (scrollIndex === -1) {
      return false
    }

    // 扣除1个复活卷轴
    const scrollItem = memberData.bag[scrollIndex]
    const currentStack = scrollItem.currentStack !== undefined ? scrollItem.currentStack : scrollItem.stack || 1

    if (currentStack <= 1) {
      // 仅剩1个，移除整个物品
      memberData.bag.splice(scrollIndex, 1)
    } else {
      // 减少数量
      scrollItem.currentStack = currentStack - 1
    }

    // 复活队友：恢复HP和MP到最大值
    memberData.currentHealth = memberData.maxHealth
    memberData.currentMana = memberData.maxMana

    // 播放复活音效
    if (audioService && typeof audioService.playResurrectSFX === 'function') {
      audioService.playResurrectSFX()
    }

    // 显示复活特效
    triggerResurrectionAnimation(memberData, 'teammember')

    addBattleLog(`${memberData.nickname} 使用复活卷轴，已原地复活！`, '#FFD700')

    // 保存队友数据
    saveTeamMemberData(memberData)

    return true
  } catch (error) {
    console.error('[Dungeon] 检查队友复活卷轴失败:', error)
    return false
  }
}

/**
 * 检查是否所有队伍成员（玩家+队友）都已死亡
 * @returns {boolean} 是否全员死亡
 */
const checkAllTeamMembersDead = () => {
  // 检查玩家是否死亡
  if (player.value && player.value.currentHealth > 0) {
    return false
  }

  // 检查所有队友是否死亡
  for (const member of teamMembers.value) {
    if (member && member.currentHealth > 0) {
      return false
    }
  }

  return true
}

/**
 * 死亡面板：返回主城
 */
const handleDeathPanelReturn = () => {
  showDeathPanel.value = false
  // 停止死亡音效
  if (audioService && typeof audioService.stopDeathSFX === 'function') {
    audioService.stopDeathSFX()
  }
  cleanup()
  router.push('/main')
}

/**
 * 死亡面板：使用金币复活（扣除100万金币）
 */
const handleDeathPanelGoldRevive = () => {
  if (!canUseGoldRevive.value) {
    addBattleLog('金币不足，无法使用金钱的力量复活！', '#ff4444')
    return
  }

  // 扣除金币
  player.value.gold = (player.value.gold || 0) - GOLD_REVIVE_COST
  gameStore.player.gold = player.value.gold
  itemsStore.playerGold = player.value.gold

  // 复活玩家：恢复HP和MP到最大值
  player.value.currentHealth = player.value.maxHealth
  player.value.currentMana = player.value.maxMana
  gameStore.player.currentHealth = player.value.currentHealth
  gameStore.player.currentMana = player.value.currentMana

  // 保存玩家数据
  storageService.savePlayerPatch({
    gold: player.value.gold,
    currentHealth: player.value.currentHealth,
    currentMana: player.value.currentMana
  })

  // 关闭死亡面板
  showDeathPanel.value = false

  // 停止死亡音效
  if (audioService && typeof audioService.stopDeathSFX === 'function') {
    audioService.stopDeathSFX()
  }

  // 播放复活音效
  if (audioService && typeof audioService.playResurrectSFX === 'function') {
    audioService.playResurrectSFX()
  }

  // 显示复活特效
  triggerResurrectionAnimation(player.value, 'player')

  addBattleLog(`消耗 ${GOLD_REVIVE_COST.toLocaleString()} 金币，使用金钱的力量复活！`, '#FFD700')
}

/**
 * 守护使者检测并触发神圣之光复活死亡队友
 * @description 在守护使者攻击/释放技能前调用，检测是否有死亡队友可以复活
 * @param {Object} guardianMember - 守护使者成员数据
 * @param {string} guardianType - 成员类型 'player' | 'teammember'
 */
const checkAndTriggerHolyLightForGuardian = (guardianMember, guardianType) => {
  if (!guardianMember || !isGuardianClass(guardianMember.class)) return
  
  // 检查守护使者是否已学习神圣之光技能
  const guardianSkill = guardianMember.skills?.Y
  if (!guardianSkill) return
  
  const skillLevel = guardianSkill.proficiencyLevel || guardianSkill.level || 0
  if (skillLevel < 1) return
  
  // 检查是否有死亡队友
  const deadMembers = []
  
  // 检查队长是否死亡
  if (player.value && player.value.currentHealth <= 0) {
    deadMembers.push({ member: player.value, type: 'player' })
  }
  
  // 检查队友是否死亡
  for (const member of teamMembers.value) {
    if (member && member.currentHealth <= 0) {
      deadMembers.push({ member, type: 'teammember' })
    }
  }
  
  if (deadMembers.length === 0) return
  
  // 尝试复活第一个死亡的队友
  const deadTarget = deadMembers[0]
  console.log(`[神圣之光] 守护使者 ${guardianMember.nickname} 检测到死亡队友 ${deadTarget.member.nickname}，尝试复活...`)
  checkAndTriggerHolyLight(deadTarget.member, deadTarget.type)
}

/**
 * 显示复活特效（使用 DamageNumber.vue 组件渲染治疗数字，与主页面动画一致）
 * @param {Object} member - 被复活的成员
 * @param {string} memberType - 成员类型
 * @param {Object} skill - 技能配置
 */
const showResurrectEffect = (member, memberType, skill) => {
  // 触发复活特效动画
  triggerResurrectionAnimation(member, memberType)

  // 停止死亡音效（角色复活后不再播放死亡BGM）
  if (audioService && typeof audioService.stopDeathSFX === 'function') {
    audioService.stopDeathSFX()
  }

  // 计算目标屏幕坐标
  let pos
  if (memberType === 'player') {
    pos = getPlayerScreenPos()
  } else {
    pos = getTeammateScreenPos(member.slotId)
  }

  // 构建技能对象
  const skillIcon = skill?.icon || '/pt/skill_icon/asshearesurr.png'
  const skillObj = { icon: skillIcon }

  // 向统一伤害数字队列添加治疗记录
  pushDungeonDamageNumber({
    targetIndex: -1,
    damage: member.maxHealth,
    isCritical: false,
    isMiss: false,
    isHeal: true,
    isMpHeal: false,
    skill: skillObj,
    weaponIcon: null,
    monsterIcon: null,
    text: null,
    elementType: null,
    elementAdvantage: null,
    itemIcon: null,
    doubleJudgment: false,
    screenXAbs: pos.screenXAbs,
    screenYAbs: pos.screenYAbs,
    screenX: pos.screenXAbs,
    screenY: pos.screenYAbs,
    opacity: 1
  })
}

/**
 * 触发复活特效动画
 * @param {Object} member - 被复活的成员
 * @param {string} memberType - 成员类型 'player' | 'teammember'
 */
const triggerResurrectionAnimation = (member, memberType) => {
  // 默认位置为屏幕中心
  let x = window.innerWidth / 2
  let y = window.innerHeight / 2

  // 使用 nextTick 确保 DOM 更新后再获取位置
  nextTick(() => {
    // 尝试获取成员卡片的 DOM 元素
    let cardElement = null

    if (memberType === 'player') {
      // 玩家卡片（第一个 team-member-card）
      cardElement = document.querySelector('.team-member-card.is-current-player')
    } else if (memberType === 'teammember' && member.slotId !== undefined) {
      // 队友卡片 - 通过 slotId 查找
      // 队友卡片在 teamMembers 数组中的顺序
      const teammateIndex = teamMembers.value.findIndex(m => m && m.slotId === member.slotId)
      if (teammateIndex >= 0) {
        // 使用 nth-child 选择器（+1 是因为第一个是玩家卡片）
        const cards = document.querySelectorAll('.team-member-card')
        // 队友卡片在玩家卡片之后
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i]
          if (card.classList.contains('is-teammember')) {
            // 检查是否是对应的队友（通过索引匹配）
            const cardIndex = Array.from(document.querySelectorAll('.team-member-card.is-teammember')).indexOf(card)
            if (cardIndex === teammateIndex) {
              cardElement = card
              break
            }
          }
        }
      }
    }

    // 如果找到了卡片元素，使用其位置
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }

    // 更新动画位置并显示
    resurrectionPosition.value = { x, y }
    showResurrectionAnimation.value = true
  })
}

/**
 * 复活动画完成回调
 */
const onResurrectionAnimationComplete = () => {
  showResurrectionAnimation.value = false
}

/**
* 添加伤害数字（使用 DamageNumber.vue 组件渲染，与主页面动画一致）
* @param {Object} monster - 怪物对象
* @param {number} value - 伤害值
* @param {boolean} isCritical - 是否暴击
* @param {boolean} isMiss - 是否闪避
* @param {string} attackerIcon - 攻击者头像URL（保留用于日志，不再直接渲染）
* @param {string} skillIcon - 技能图标URL（伤害型技能时使用）
* @param {string} weaponIcon - 武器图标URL（普通攻击时使用）
* @param {boolean} isDoubleJudgment - 是否触发双倍惩戒
* @param {boolean} isOffhand - 是否副手攻击（true=偏右显示）
* @param {string|null} customText - 自定义显示文本（如龙之劲倍攻的 '+2000*1.5倍'）
*/
const addDamageNumber = (monster, value, isCritical = false, isMiss = false, attackerIcon = '', skillIcon = '', weaponIcon = '', isDoubleJudgment = false, isOffhand = false, customText = null) => {
// 计算怪物卡片的屏幕坐标（主手偏左，副手偏右）
const pos = getMonsterCardScreenPos(monster, isOffhand)

// 构建技能对象（DamageNumber.vue 通过 skill.icon 获取图标）
const skill = skillIcon ? { icon: skillIcon } : null

// 向统一伤害数字队列添加记录
pushDungeonDamageNumber({
targetIndex: 0, // >=0 表示玩家攻击怪物（蓝色飘字）
damage: value,
isCritical,
isMiss,
isHeal: false,
isMpHeal: false,
skill,
weaponIcon: weaponIcon || null,
monsterIcon: null,
text: customText,
elementType: null,
elementAdvantage: null,
itemIcon: null,
doubleJudgment: isDoubleJudgment,
isOffhand,
    screenXAbs: pos.screenXAbs,
    screenYAbs: pos.screenYAbs,
    screenX: pos.screenXAbs,
    screenY: pos.screenYAbs,
    opacity: 1
  })
}

/**
 * 异步处理怪物击败队列（性能优化）
 * @description 将击败处理放入队列，分帧执行，避免同时处理多个怪物导致主线程阻塞
 */
const processDefeatQueue = async () => {
  if (isProcessingDefeat || monsterDefeatQueue.length === 0) return

  isProcessingDefeat = true

  while (monsterDefeatQueue.length > 0) {
    const { monster, index } = monsterDefeatQueue.shift()
    try {
      await processSingleMonsterDefeat(monster, index)
    } catch (error) {
      console.error('[Dungeon] 处理怪物击败失败:', error)
    }
    // 每处理一个怪物后让出主线程，防止阻塞
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  isProcessingDefeat = false
}

/**
 * 处理单个怪物被击败的核心逻辑
 * @param {Object} monster - 怪物数据
 * @param {number} index - 怪物索引
 */
const processSingleMonsterDefeat = async (monster, index) => {
  // 播放怪物死亡音效
  playMonsterDeathSound(monster.uid)

  // 清理怪物身上的所有DOT效果定时器
  if (monster.dotEffects && monster.dotEffects.length > 0) {
    for (const dot of monster.dotEffects) {
      if (dot.timerId) {
        clearTimeout(dot.timerId)
        dot.timerId = null
      }
    }
    monster.dotEffects = []
  }

  try {
    // 使用掉落服务计算物品掉落
    const dropResult = await calculateAutoBattleRewards(monster)
    const rewards = dropResult?.rewards || dropResult || {}

    // 获取金币
    const gold = rewards?.gold || Math.floor(Math.random() * 50 + 20) * dungeonInfo.value.multiplier

    // 获取所有参战成员
    const allFighters = [
      { id: 'player', data: player.value, type: 'player' },
      ...teamMembers.value.map((member) => ({
        id: `member_${member.slotId}`,
        data: member,
        type: 'teammember'
      }))
    ]

    // 经验分配
    let expTable = monster.experienceTable
    if (!expTable || expTable.length === 0) {
      const monsterStaticData = MONSTER_INFO[monster.id]
      if (monsterStaticData?.experienceTable) {
        expTable = monsterStaticData.experienceTable
      }
    }

    const finalExpTableLength = expTable?.length || 1

    const calculateMemberExpPercent = (memberLevel) => {
      const memberExpTableIndex = Math.max(0, Math.min(memberLevel - 1, finalExpTableLength - 1))
      const memberExpPercent = expTable?.[memberExpTableIndex]
      const basePercent = (memberExpPercent !== undefined && memberExpPercent !== null)
        ? memberExpPercent
        : (monster.experience || 10)
      const finalPercent = basePercent * dungeonInfo.value.multiplier
      return { expPercent: finalPercent, basePercent, expTableIndex: memberExpTableIndex }
    }

    // 给每个参战成员分配经验
    for (const fighter of allFighters) {
      const memberLevel = fighter.data.level || 1
      const expInfo = calculateMemberExpPercent(memberLevel)
      const expPercent = expInfo.expPercent

      if (fighter.type === 'player') {
        const currentMaxExp = player.value.maxExp || 1000
        const actualExp = (expPercent / 100) * currentMaxExp
        const finalExp = calculateActualExperience(actualExp)

        if (finalExp > 0) {
          gainExp(finalExp)
          expReward.value += finalExp
        }

        const newExp = gameStore.player.exp
        const newMaxExp = gameStore.player.maxExp
        const newLevel = gameStore.player.level
        player.value.exp = newExp
        player.value.maxExp = newMaxExp
        player.value.level = newLevel
      } else {
        const currentMaxExp = fighter.data.maxExp || 1000
        const currentExp = fighter.data.exp || 0
        const actualExp = (expPercent / 100) * currentMaxExp

        fighter.data.exp = currentExp + actualExp

        while (fighter.data.exp >= (fighter.data.maxExp || 1000)) {
          fighter.data.exp = fighter.data.exp - (fighter.data.maxExp || 1000)
          fighter.data.level = (fighter.data.level || 1) + 1
          fighter.data.maxExp = Math.floor((fighter.data.maxExp || 1000) * 1.2)
        }
      }
    }

    // 预计算怪物屏幕位置（在怪物卡片被移除前获取，用于掉落动画定位）
    const monsterPosition = dungeonDrops.getMonsterScreenPosition(monster)

    // 分配金币：队员获得各自份额，队长份额通过掉落动画拾取
    if (gold > 0) {
      const goldPerMember = Math.floor(gold / allFighters.length)
      const goldRemainder = gold % allFighters.length
      const leaderGold = goldPerMember + goldRemainder

      // 队员直接获得金币
      for (const fighter of allFighters) {
        if (fighter.type !== 'player') {
          fighter.data.gold = (fighter.data.gold || 0) + goldPerMember
        }
      }

      // 队长金币通过掉落动画拾取
      if (leaderGold > 0) {
        const goldAnimId = dungeonDrops.createGoldDropAnimation(monster, leaderGold, monsterPosition)
        if (goldAnimId) {
          dungeonDrops.setDropItemMeta(goldAnimId, {
            itemId: 'gold',
            quantity: leaderGold,
            rarity: 'common',
            itemData: null,
            rawName: '金币',
            displayName: '金币',
            iconPath: '/pt/UI/gold.png'
          })
        }
      }
    }

    // 处理物品掉落：所有品级物品都创建掉落动画，拾取时按品级分别处理
    const droppedItems = rewards?.items || []

    if (droppedItems.length > 0) {
      for (const item of droppedItems) {
        if (!item) continue

        const fullItemData = DropService.getFullItemData(item.id)
        if (!fullItemData) continue

        const quantity = Number(item.currentStack ?? item.quantity ?? item.stack ?? 1)
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1
        const rarity = String(fullItemData.rarity || 'common').toLowerCase()

        const itemToAdd = {
          ...fullItemData,
          id: item.id,
          quantity: safeQuantity,
          currentStack: safeQuantity
        }

        // 创建掉落动画（稀有以上品级自动触发光柱特效）
        const animId = dungeonDrops.createDropAnimation(monster, itemToAdd, monsterPosition)
        if (animId) {
          dungeonDrops.setDropItemMeta(animId, {
            itemId: item.id,
            quantity: safeQuantity,
            rarity: rarity,
            itemData: itemToAdd,
            rawName: fullItemData.name,
            displayName: fullItemData.name?.cns || fullItemData.name || `物品#${item.id}`,
            iconPath: `/pt/item_icon/${item.id}.png`
          })
        }
      }
    }

    // 保存玩家数据（使用防抖，避免每只怪物击败都发起API请求）
    gameStore.player.gold = player.value.gold
    debouncedSavePlayerData()

    // ====== 更新成就击杀进度（非阻塞式延迟批量更新） ======
    try {
      const achMonsterId = monster.id ?? monster.itemId ?? null
      if (achMonsterId !== null && achMonsterId !== undefined) {
        recordAchievementKill(achMonsterId, 1)
      }
    } catch (achError) {
      console.error('[Dungeon] 更新成就击杀进度失败:', achError)
    }

    // 保存队员数据（使用防抖，避免每只怪物击败都发起API请求导致请求堆积超时）
    for (const member of teamMembers.value) {
      if (member && member.slotId !== undefined) {
        debouncedSaveTeamMemberData(member)
      }
    }

  } catch (error) {
    console.error('[Dungeon] 处理怪物掉落失败:', error)
    const baseExp = monster.experience || 10
    const actualBaseExp = calculateActualExperience(baseExp)
    const gold = Math.floor(Math.random() * 50 + 20) * dungeonInfo.value.multiplier
    gainExp(actualBaseExp)
    player.value.gold = (player.value.gold || 0) + gold
    expReward.value += actualBaseExp
    goldReward.value += gold
  }

  // 检查阶段完成
  const currentStage = dungeonStages.value[currentStageIndex.value]
  if (currentStageKills.value >= currentStage?.count) {
    handleStageComplete()
  } else {
    // 移除怪物并补充
    setTimeout(() => {
      const removeIndex = monsters.value.findIndex(m => m.uid === monster.uid)
      if (removeIndex > -1) {
        monsters.value.splice(removeIndex, 1)
      }
      // 当怪物数量小于团队人数时补充怪物
      const totalTeamSize = 1 + teamMembers.value.length
      if (monsters.value.length < Math.min(totalTeamSize, 8)) {
        generateMonsters({ append: true })
      }
    }, 300)
  }
}

/**
 * 处理怪物被击败（入口函数，加入队列异步处理）
 * @param {Object} monster - 怪物数据
 * @param {number} index - 怪物索引
 */
const handleMonsterDefeated = async (monster, index) => {
  // ★ 防止重复调用：同一怪物被多次触发死亡（DOT、普攻、AOE同时命中）时只处理一次
  if (monster.isDying) return
  // 立即标记怪物为死亡状态，避免重复处理
  monster.isDying = true
  currentStageKills.value++
  totalKills.value++

  // ★ 同步更新转职任务击杀进度（副本击杀，isFromDungeon=true）
  // 副本专属怪物（如[暗影中尉]克里顿）只能在副本中击杀并计入转职任务进度
  try {
    const monsterId = monster.id || monster.monsterId
    if (monsterId !== null && monsterId !== undefined && gameStore) {
      gameStore.updateJobChangeQuestKillProgress(monsterId, true)
    }
  } catch (e) {
    // 忽略转职任务进度更新失败
  }

  // 加入队列异步处理掉落和经验
  monsterDefeatQueue.push({ monster, index })

  // 触发异步处理
  processDefeatQueue()
}

/**
 * 切换自动战斗
 */
const toggleAutoBattle = () => {
  if (autoBattle.value) {
    // 停止自动战斗
    stopAutoBattle()
  } else {
    // 开始自动战斗
    startAutoBattle()
  }
}

/**
 * 开始自动战斗
 */
const startAutoBattle = () => {
  if (monsters.value.length === 0) {
    addBattleLog('没有可攻击的怪物', '#ff6b6b')
    return
  }

  autoBattle.value = true
  isBattleStarted.value = true

  // 初始化成员经验加成标识和攻击力加成标识
  updateMemberExpBonus()
  updateMemberAttackBonus()

  addBattleLog('开始自动战斗', '#4CAF50')

  // 启动自动攻击循环（首次攻击已集成到循环中，无需额外调用）
  startAutoBattleLoop()
}

/**
 * 停止自动战斗
 */
const stopAutoBattle = () => {
  autoBattle.value = false
  
  // 清除旧的定时器（兼容）
  if (autoBattleTimer) {
    clearTimeout(autoBattleTimer)
    autoBattleTimer = null
  }
  
  // 清除所有成员的独立攻击定时器
  memberAttackTimers.forEach((timerId) => {
    clearInterval(timerId)
  })
  memberAttackTimers.clear()
  
  addBattleLog('停止自动战斗', '#ff9800')

  // 停止怪物攻击循环
  stopMonsterAttackLoop()
}

// ============ 怪物攻击玩家相关函数 ============

/**
 * 启动怪物攻击循环
 * @description 每个存活的怪物会随机攻击玩家或队友，使用异步处理避免阻塞
 */
const startMonsterAttackLoop = () => {
  if (monsterAttackTimer) {
    clearInterval(monsterAttackTimer)
    monsterAttackTimer = null
  }

  // 怪物攻击间隔：3秒一次（比玩家慢）
  const MONSTER_ATTACK_INTERVAL = 3000

  monsterAttackTimer = setInterval(() => {
    if (!autoBattle.value) {
      clearInterval(monsterAttackTimer)
      monsterAttackTimer = null
      return
    }

    // 使用 setTimeout 将怪物攻击放入宏任务队列，避免阻塞
    setTimeout(executeMonsterAttack, 0)
  }, MONSTER_ATTACK_INTERVAL)
}

/**
 * 停止怪物攻击循环
 */
const stopMonsterAttackLoop = () => {
  if (monsterAttackTimer) {
    clearInterval(monsterAttackTimer)
    monsterAttackTimer = null
  }
}

/**
 * 检查并复活死亡的队伍成员（神圣之光被动技能）
 * @description 在每次怪物攻击循环开始时检查是否有死亡队友，尝试触发神圣之光复活
 * @requires 队伍中必须存在存活的守护使者职业才会进行检测
 */
const checkAndResurrectDeadMembers = () => {
  // 前置检查：队伍中是否有存活的守护使者
  const hasAliveGuardian = () => {
    // 检查队长是否是存活的守护使者
    if (player.value && player.value.currentHealth > 0 && isGuardianClass(player.value.class)) {
      return true
    }
    // 检查队友中是否有存活的守护使者
    for (const member of teamMembers.value) {
      if (member && member.currentHealth > 0 && isGuardianClass(member.class)) {
        return true
      }
    }
    return false
  }

  // 如果队伍中没有存活的守护使者，直接返回，不进行神圣之光检测
  if (!hasAliveGuardian()) {
    return
  }

  // 检查队长是否死亡
  if (player.value && player.value.currentHealth <= 0) {
    checkAndTriggerHolyLight(player.value, 'player')
  }

  // 检查队友是否死亡
  for (const member of teamMembers.value) {
    if (member && member.currentHealth <= 0) {
      checkAndTriggerHolyLight(member, 'teammember')
    }
  }
}

/**
 * 检查已死亡角色背包中的复活卷轴并触发复活
 * @description 在怪物攻击循环中定期检查已死亡角色（队长+队友）是否在死亡后获得了复活卷轴（ID:6525），
 *              如果有则扣除卷轴并复活该角色。解决角色死亡后才获得复活卷轴无法触发复活的问题。
 */
const checkDeadMembersRevivalScroll = () => {
  // 检查已死亡的队长是否有复活卷轴
  if (player.value && player.value.currentHealth <= 0) {
    checkRevivalScroll()
  }

  // 检查已死亡的队友是否有复活卷轴
  for (const member of teamMembers.value) {
    if (member && member.currentHealth <= 0) {
      checkMemberRevivalScroll(member)
    }
  }
}

/**
 * 执行怪物攻击
 * @description 每个存活的怪物随机攻击一个玩家或队友，使用分帧处理优化性能
 */
const executeMonsterAttack = () => {
  // ========== 1. 先检查是否有死亡队友需要复活（神圣之光 + 复活卷轴） ==========
  checkAndResurrectDeadMembers()
  checkDeadMembersRevivalScroll()

  // 获取所有存活的怪物
  const aliveMonsters = monsters.value.filter(m => m && !m.isDying && m.currentHealth > 0)
  if (aliveMonsters.length === 0) return

  // 获取所有存活的目标（玩家 + 队友）
  const aliveTargets = []

  // 添加玩家
  if (player.value && player.value.currentHealth > 0) {
    aliveTargets.push({
      type: 'player',
      id: 'player',
      data: player.value
    })
  }

  // 添加队友
  for (const member of teamMembers.value) {
    if (member && member.currentHealth > 0) {
      aliveTargets.push({
        type: 'teammember',
        id: `member_${member.slotId}`,
        data: member
      })
    }
  }

  if (aliveTargets.length === 0) return

  // 性能优化：分帧处理怪物攻击，每帧最多处理10个怪物
  const processMonsterAttacks = (startIndex) => {
    const batchSize = 10
    const endIndex = Math.min(startIndex + batchSize, aliveMonsters.length)

    for (let i = startIndex; i < endIndex; i++) {
      const monster = aliveMonsters[i]
      if (!monster || monster.isDying) continue

      // 随机选择一个目标
      const targetIndex = Math.floor(Math.random() * aliveTargets.length)
      const target = aliveTargets[targetIndex]

      // 执行攻击
      monsterAttackTarget(monster, target)
    }

    // 如果还有未处理的怪物，继续分帧处理
    if (endIndex < aliveMonsters.length) {
      requestAnimationFrame(() => processMonsterAttacks(endIndex))
    }
  }

  // 开始处理怪物攻击
  processMonsterAttacks(0)
}

/**
 * 怪物攻击目标
 * @param {Object} monster - 怪物数据
 * @param {Object} target - 目标数据 { type, id, data }
 */
const monsterAttackTarget = (monster, target) => {
  if (!monster || !target || !target.data) return

  const targetName = target.data.nickname || (target.type === 'player' ? '玩家' : '队友')

  // ========== 0. 播放怪物攻击动画 ==========
  // 设置怪物攻击状态为 true，触发 MonsterAnimation 组件的攻击动画
  const monsterIndex = monsters.value.findIndex(m => m.uid === monster.uid)
  if (monsterIndex !== -1) {
    monsters.value[monsterIndex].isAttacking = true
    // 攻击动画持续 400ms（与 MonsterAnimation 组件 CSS 中 monsterAttack 动画时长一致）
    setTimeout(() => {
      const currentIndex = monsters.value.findIndex(m => m.uid === monster.uid)
      if (currentIndex !== -1) {
        monsters.value[currentIndex].isAttacking = false
      }
    }, 400)
  }

  // ========== 0.1 播放怪物攻击音效 ==========
  playMonsterAttackSound(monster.uid)

  // ========== 1. 计算闪避率 ==========
  const dodgeRate = target.data.dodgeRate || target.data.calculateDodgeRate?.() || 0
  if (dodgeRate > 0 && Math.random() < dodgeRate) {
    // 触发闪避
    showMonsterDamageOnTarget(monster, target, 0, true, false) // isDodge=true, isBlock=false
    triggerMemberAnimation(target.id, 'monster-attack')
    return
  }

  // ========== 2. 计算格挡率 ==========
  const blockRate = target.data.blockRate || target.data.calculateBlockRate?.() || 0
  const isBlock = blockRate > 0 && Math.random() < blockRate

  // ========== 3. 计算怪物伤害 ==========
  const minAtk = monster.minAttack || 50
  const maxAtk = monster.maxAttack || minAtk + 50
  const baseDamage = Math.floor(Math.random() * (maxAtk - minAtk + 1)) + minAtk

  // 计算目标防御减免（使用 minDefense/maxDefense 平均值，与主页面 AutoBattleMonsterManager 一致）
  const targetMinDefense = Number(target.data.minDefense) || 0
  const targetMaxDefense = Number(target.data.maxDefense) || 0
  const targetDefenseAvg = Math.floor((targetMinDefense + targetMaxDefense) / 2)

  // 防御减免上限比例：根据等级差计算，防止高防低等级玩家完全免疫伤害
  const getDefenseCapRatio = (targetLevel, monsterLevel) => {
    const p = Number(targetLevel) || 1
    const m = Number(monsterLevel) || 1
    const diff = p - m
    const base = 0.5
    if (diff <= 0) return base
    const bonus = Math.min(diff, 20) * 0.025
    return Math.min(0.9, base + bonus)
  }
  const defenseCapRatio = getDefenseCapRatio(target.data.level, monster.level)
  const maxDefenseReduction = Math.floor(baseDamage * defenseCapRatio)
  const effectiveDefenseReduction = Math.min(targetDefenseAvg, maxDefenseReduction)
  let finalDamage = Math.max(1, baseDamage - effectiveDefenseReduction)

  // ========== 4. 格挡减伤 ==========
  if (isBlock) {
    // 格挡减伤：根据等级差计算减伤比例
    const getBlockReductionRatio = (playerLevel, monsterLevel) => {
      const p = Number(playerLevel) || 1
      const m = Number(monsterLevel) || 1
      const diff = m - p
      const base = 0.7
      if (diff > 0) {
        return Math.min(0.9, base + Math.min(diff, 20) * 0.01)
      }
      if (diff < 0) {
        return Math.max(0.5, base + diff * 0.01)
      }
      return base
    }
    const blockReduction = getBlockReductionRatio(target.data.level, monster.level)
    const blockMultiplier = Math.max(0.1, 1 - blockReduction)
    finalDamage = Math.max(1, Math.floor(finalDamage * blockMultiplier))
  }

  // ========== 4.1 PVE 伤害减免 ==========
  const pveDamageReduction = Number(target.data.pveDamageReduction) || 0
  if (pveDamageReduction > 0) {
    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - pveDamageReduction / 100)))
  }

  // ========== 4.2 属性抗性减伤（根据怪物元素属性） ==========
  const monsterElementType = monster?.elementType ?? monster?.element ?? null
  if (monsterElementType) {
    const elementDefenseMap = {
      fire: 'fireDefense',
      water: 'waterDefense',
      wind: 'windDefense',
      earth: 'earthDefense',
      electricity: 'thunderDefense',
      thunder: 'thunderDefense'
    }
    const defenseKey = elementDefenseMap[String(monsterElementType).toLowerCase()]
    if (defenseKey) {
      const elementDefensePercent = Number(target.data[defenseKey]) || 0
      if (elementDefensePercent > 0) {
        finalDamage = Math.max(1, Math.floor(finalDamage * (1 - elementDefensePercent / 100)))
      }
    }
  }

  // ========== 4.3 重甲精通EX3-概率减伤 ==========
  // 圣殿骑士重甲精通EX3：30%概率减伤10%，20%概率减伤20%，10%概率减伤30%
  const heavyArmorReductionInfo = getHeavyArmorDamageReductionInfo(target.data)
  let exReductionPercent = 0
  if (heavyArmorReductionInfo.unlocked && heavyArmorReductionInfo.reductionPercent > 0) {
    exReductionPercent = heavyArmorReductionInfo.reductionPercent
    finalDamage = Math.max(1, Math.floor(finalDamage * (1 - exReductionPercent / 100)))
  }

  // ========== 4.4 神圣壁垒EX3-伤害分担 ==========
  // 神圣壁垒EX3解锁后，持续期间所有队员受到伤害的15%由释放神圣壁垒的角色分担（仅副本生效）
  let damageShareAmount = 0
  if (finalDamage > 0) {
    const rawTargetData = toRaw(target.data)
    const rawPlayer = toRaw(player.value)
    const aliveMembers = [rawPlayer, ...teamMembers.value.map(m => toRaw(m))].filter(m => m && m.currentHealth > 0)
    const shareCaster = findHolyBulwarkDamageShareCaster(aliveMembers, rawTargetData)
    if (shareCaster) {
      const sharePercent = getHolyBulwarkDamageSharePercent(shareCaster)
      if (sharePercent > 0) {
        damageShareAmount = Math.max(1, Math.floor(finalDamage * sharePercent / 100))
        finalDamage = Math.max(1, finalDamage - damageShareAmount)
        // 对施法者应用分担伤害
        shareCaster.currentHealth = Math.max(0, shareCaster.currentHealth - damageShareAmount)
        // 在施法者位置显示分担伤害数字
        const isCasterPlayer = shareCaster === rawPlayer
        const casterTarget = {
          type: isCasterPlayer ? 'player' : 'teammember',
          id: isCasterPlayer ? 'player' : `member_${shareCaster.slotId}`,
          data: shareCaster
        }
        showMonsterDamageOnTarget(monster, casterTarget, damageShareAmount, false, false, 0)
        // 触发施法者受伤动画
        triggerMemberAnimation(casterTarget.id, 'monster-attack')
        // 保存施法者数据
        if (isCasterPlayer) {
          gameStore.player.currentHealth = shareCaster.currentHealth
          storageService.savePlayerPatch({
            currentHealth: shareCaster.currentHealth
          })
        } else {
          saveTeamMemberData(shareCaster)
        }
        // 检查施法者是否因分担伤害死亡
        if (shareCaster.currentHealth <= 0) {
          playPlayerDeathSound(shareCaster)
          if (checkAllTeamMembersDead()) {
            showDeathPanel.value = true
          }
        }
      }
    }
  }

  // ========== 5. 扣除目标气血 ==========
  target.data.currentHealth = Math.max(0, target.data.currentHealth - finalDamage)

  // ========== 5.1 圣盾觉醒EX3-受伤反弹 ==========
  // 圣殿骑士圣盾觉醒BUFF持续期间，受到伤害时反弹50%伤害给攻击者
  const damageReflectPercent = getShieldAwakeningDamageReflect(target.data)
  if (damageReflectPercent > 0 && finalDamage > 0 && monster.currentHealth > 0) {
    const reflectDamage = Math.max(1, Math.floor(finalDamage * damageReflectPercent / 100))
    applyDamageToMonster(monster, reflectDamage)
    // 显示反弹伤害数字
    const reflectAttackerIcon = getMemberAvatarUrl(target.data)
    addDamageNumber(monster, reflectDamage, false, false, reflectAttackerIcon, '/pt/skill_icon/mersupfury.png')
    // 检查怪物是否因反弹伤害死亡
    if (monster.currentHealth <= 0) {
      const reflectMonsterIndex = monsters.value.findIndex(m => m.uid === monster.uid)
      if (reflectMonsterIndex !== -1) {
        handleMonsterDefeated(monster, reflectMonsterIndex)
      }
    }
  }

  // ========== 6. 播放玩家/队友受伤音效 ==========
  playPlayerHurtSound(target.data)

  // ========== 7. 显示伤害数字 ==========
  showMonsterDamageOnTarget(monster, target, finalDamage, false, isBlock, exReductionPercent)

  // 触发目标被怪物攻击动画（头像向左移动后复原）
  triggerMemberAnimation(target.id, 'monster-attack')

  // ========== 8. 检查目标是否死亡 ==========
  if (target.data.currentHealth <= 0) {
    // 播放玩家/队友死亡音效
    playPlayerDeathSound(target.data)
    // 检查并触发神圣之光被动技能（复活死亡队友）
    const holyLightRevived = checkAndTriggerHolyLight(target.data, target.type)

    if (!holyLightRevived) {
      // 神圣之光未触发
      if (target.type === 'player') {
        // 玩家死亡：检查复活卷轴（ID:6525）
        const scrollRevived = checkRevivalScroll()
        if (!scrollRevived && checkAllTeamMembersDead()) {
          // 无复活卷轴且全员死亡：弹出死亡选择面板
          showDeathPanel.value = true
        }
      } else {
        // 队友死亡：检查复活卷轴（ID:6525）
        const memberScrollRevived = checkMemberRevivalScroll(target.data)
        if (!memberScrollRevived && checkAllTeamMembersDead()) {
          // 无复活卷轴且全员死亡：弹出死亡选择面板
          showDeathPanel.value = true
        }
      }
    }
  }

  // ========== 9. 保存数据 ==========
  if (target.type === 'player') {
    gameStore.player.currentHealth = player.value.currentHealth
    storageService.savePlayerPatch({
      currentHealth: player.value.currentHealth
    })
  } else {
    saveTeamMemberData(target.data)
  }
}

/**
 * 在目标区域显示怪物攻击伤害（使用 DamageNumber.vue 组件渲染，与主页面动画一致）
 * @param {Object} monster - 怪物数据
 * @param {Object} target - 目标数据 { type, id, data }
 * @param {number} damage - 伤害值
 * @param {boolean} isDodge - 是否闪避
 * @param {boolean} isBlock - 是否格挡
 * @param {number} [exReductionPercent=0] - 重甲精通EX3减伤百分比（0表示未触发）
 */
const showMonsterDamageOnTarget = (monster, target, damage, isDodge = false, isBlock = false, exReductionPercent = 0) => {
  // 计算目标屏幕坐标
  let pos
  if (target.type === 'player') {
    pos = getPlayerScreenPos()
  } else {
    pos = getTeammateScreenPos(target.data?.slotId)
  }

  // 闪避时显示 MISS 文本
  if (isDodge) {
    pushDungeonDamageNumber({
      targetIndex: -1, // <0 表示怪物攻击玩家（红色飘字）
      damage: 0,
      isCritical: false,
      isMiss: true,
      isHeal: false,
      isMpHeal: false,
      skill: null,
      weaponIcon: null,
      monsterIcon: { icon: monster.icon, rank: monster.rank },
      text: '闪避',
      elementType: null,
      elementAdvantage: null,
      itemIcon: null,
      doubleJudgment: false,
      screenXAbs: pos.screenXAbs,
      screenYAbs: pos.screenYAbs,
      screenX: pos.screenXAbs,
      screenY: pos.screenYAbs,
      opacity: 1
    })
    return
  }

  // 格挡/减伤时在文本中标注
  let displayText = null
  if (isBlock && exReductionPercent > 0) {
    displayText = `${damage}(格挡·减伤${exReductionPercent}%)`
  } else if (isBlock) {
    displayText = `${damage}(格挡)`
  } else if (exReductionPercent > 0) {
    displayText = `${damage}(减伤${exReductionPercent}%)`
  }

  pushDungeonDamageNumber({
    targetIndex: -1, // <0 表示怪物攻击玩家（红色飘字）
    damage,
    isCritical: false,
    isMiss: false,
    isHeal: false,
    isMpHeal: false,
    skill: null,
    weaponIcon: null,
    monsterIcon: { icon: monster.icon, rank: monster.rank },
    text: displayText,
    elementType: null,
    elementAdvantage: null,
    itemIcon: null,
    doubleJudgment: false,
    screenXAbs: pos.screenXAbs,
    screenYAbs: pos.screenYAbs,
    screenX: pos.screenXAbs,
    screenY: pos.screenYAbs,
    opacity: 1
  })
}

/**
 * 显示治疗数字在目标区域（使用 DamageNumber.vue 组件渲染，与主页面动画一致）
 * @param {Object} skill - 技能数据
 * @param {Object} target - 目标数据 { type, id, data }
 * @param {number} healAmount - 治疗量
 */
const showHealNumberOnTarget = (skill, target, healAmount) => {
  // 计算目标屏幕坐标
  let pos
  if (target.type === 'player') {
    pos = getPlayerScreenPos()
  } else {
    pos = getTeammateScreenPos(target.data?.slotId)
  }

  // 构建技能对象
  const skillObj = skill?.icon ? { icon: skill.icon } : null

  pushDungeonDamageNumber({
    targetIndex: -1, // 治疗也用 <0（红色位置），但 isHeal=true 会显示绿色
    damage: healAmount,
    isCritical: false,
    isMiss: false,
    isHeal: true,
    isMpHeal: false,
    skill: skillObj,
    weaponIcon: null,
    monsterIcon: null,
    text: null,
    elementType: null,
    elementAdvantage: null,
    itemIcon: null,
    doubleJudgment: false,
    screenXAbs: pos.screenXAbs,
    screenYAbs: pos.screenYAbs,
    screenX: pos.screenXAbs,
    screenY: pos.screenYAbs,
    opacity: 1
  })
}

/**
 * 计算角色的攻击间隔
 * 法系职业：施法速度 0% = 2秒间隔，施法速度 200% = 500ms 间隔
 * 物理职业：攻击速度 0% = 2秒间隔，攻击速度 100% = 500ms 间隔
 * @param {Object} memberData - 角色数据
 * @returns {number} 攻击间隔（毫秒）
 */
const calculateMemberAttackInterval = (memberData) => {
  if (!memberData) return 2000

  const className = String(memberData?.class || '').toLowerCase()
  const memberName = memberData?.nickname || '未知'

  // 法师系职业使用施法速度
  const useCastSpeed = [
    'priest',
    'mage',
    'magician',
    'acolyte',
    'assist',
    'ringmaster',
    'psykeeper',
    'elementor',
    'element_mage', // 元素使者
    'spirit_mage', // 精神使者
    'arcane_master', // 奥术师
    'mind_master', // 心灵师
    'nature_messenger', // 炽天使
    'guardian' // 守护使者
  ].includes(className)

  const MIN_INTERVAL = 500 // 所有职业最小攻击间隔
  const BASE_INTERVAL = 2000 // 基础攻击间隔 2 秒

  let interval
  if (useCastSpeed) {
    // 施法职业：使用施法速度
    // 施法速度范围：0% ~ 200%，对应间隔 2000ms ~ 500ms
    // 面板显示：decreasedCastingTime * 100
    const rawCastSpeed = memberData?.decreasedCastingTime ?? 0
    
    // decreasedCastingTime 是小数形式（如 0.533），转换为百分比
    let castSpeedPercent = Number(rawCastSpeed) * 100
    
    // 限制施法速度范围：0% ~ 200%
    const clampedSpeed = Math.max(0, Math.min(200, castSpeedPercent))
    // 计算间隔：速度 0% = 2000ms，速度 200% = 500ms
    interval = BASE_INTERVAL - (clampedSpeed / 200) * (BASE_INTERVAL - MIN_INTERVAL)
  } else {
    // 物理职业：使用攻击速度
    // 攻击速度范围：0% ~ 100%，对应间隔 2000ms ~ 500ms
    // 面板显示：attackSpeed * 100
    const rawAttackSpeed = memberData?.attackSpeed
    
    if (rawAttackSpeed === undefined || rawAttackSpeed === null || rawAttackSpeed <= 0) {
      interval = BASE_INTERVAL
    } else {
      // attackSpeed 是倍率，转换为百分比
      // 1.0 = 100%, 1.195 = 119.5%
      let attackSpeedPercent = Number(rawAttackSpeed) * 100
      
      // 限制攻击速度范围：0% ~ 100%（>=100% 都按 100% 计算，达到最小间隔）
      const clampedSpeed = Math.max(0, Math.min(100, attackSpeedPercent))
      
      // 计算间隔：速度 0% = 2000ms，速度 100% = 500ms
      interval = BASE_INTERVAL - (clampedSpeed / 100) * (BASE_INTERVAL - MIN_INTERVAL)
    }

    // 确保最小间隔
    interval = Math.max(MIN_INTERVAL, Math.floor(interval))
  }

  // 确保所有职业最小攻击间隔为 500ms
  return Math.max(MIN_INTERVAL, Math.floor(interval))
}

/**
 * 启动自动攻击循环（每个成员独立攻击间隔）
 * @description 使用时间切片优化，避免阻塞主线程
 */
const startAutoBattleLoop = () => {
  if (!autoBattle.value) return

  // 清除所有旧的定时器
  memberAttackTimers.forEach((timerId) => {
    clearInterval(timerId)
  })
  memberAttackTimers.clear()

  // 获取所有存活成员（只保存ID和类型，每次从源数据获取最新引用）
  const allMembers = [
    { type: 'player', id: 'player' },
    ...teamMembers.value.map((member) => ({ 
      type: 'teammember', 
      id: `member_${member.slotId}`,
      slotId: member.slotId
    }))
  ]

  // 为每个成员启动独立的攻击循环
  allMembers.forEach((fighter, index) => {
    // 首次执行时获取最新的成员数据
    const getLatestMemberData = () => {
      if (fighter.type === 'player') {
        return player.value
      } else {
        // 从 teamMembers 数组中查找最新的成员引用
        return teamMembers.value.find(m => m && m.slotId === fighter.slotId)
      }
    }
    
    const initialMember = getLatestMemberData()
    if (!initialMember || initialMember.currentHealth <= 0) return

    const memberInterval = calculateMemberAttackInterval(initialMember)

    // 使用 requestIdleCallback 或 setTimeout 将首次攻击分散执行
    // 每个成员延迟 index * 50ms，避免同时触发
    const staggerDelay = index * 50 + Math.floor(Math.random() * 50)
    
    const executeAttack = () => {
      if (!autoBattle.value) return
      const aliveMonsterIndex = monsters.value.findIndex(m => m && !m.isDying && m.currentHealth > 0)
      if (aliveMonsterIndex >= 0) {
        const currentMember = getLatestMemberData()
        if (currentMember && currentMember.currentHealth > 0) {
          executeMemberAction(currentMember, fighter.type, aliveMonsterIndex)
        }
      }
    }

    // 首次攻击延迟执行
    setTimeout(executeAttack, staggerDelay)

    // 使用 setInterval 配合时间检查，避免积压
    let lastExecuteTime = Date.now()
    
    const timerId = setInterval(() => {
      if (!autoBattle.value) {
        clearInterval(timerId)
        return
      }

      // 检查是否积压（如果距离上次执行时间过短，跳过本次）
      const now = Date.now()
      if (now - lastExecuteTime < memberInterval * 0.8) {
        return // 跳过积压的回调
      }
      lastExecuteTime = now

      // 使用 setTimeout 将攻击逻辑放入宏任务队列，不阻塞当前帧
      setTimeout(executeAttack, 0)
    }, memberInterval)
    
    memberAttackTimers.set(fighter.id, timerId)
  })

  // 启动怪物攻击循环
  startMonsterAttackLoop()
}

/**
 * 执行自动攻击（已废弃，改用独立攻击循环）
 * @deprecated 使用 startAutoBattleLoop 替代
 */
const executeAutoAttack = () => {
  if (!autoBattle.value || monsters.value.length === 0) {
    return
  }

  // 构建所有战斗成员列表（队长 + 队员）
  const allFighters = [
    { member: player.value, type: 'player', index: -1 },
    ...teamMembers.value.map((member, index) => ({ member, type: 'teammember', index }))
  ]

  // 每个战斗成员执行一次行动
  for (const fighter of allFighters) {
    if (!fighter.member || fighter.member.currentHealth <= 0) {
      continue
    }

    // 找到存活的怪物
    const aliveMonsterIndex = monsters.value.findIndex(m => m && !m.isDying && m.currentHealth > 0)
    if (aliveMonsterIndex < 0) {
      break
    }

    // 执行该成员的战斗行动
    executeMemberAction(fighter.member, fighter.type, aliveMonsterIndex)
  }
}

/**
 * 检查是否是守护使者职业
 * @param {string} playerClass - 职业名称
 * @returns {boolean}
 */
const isGuardianClass = (playerClass) => {
  if (!playerClass) return false
  const classLower = playerClass.toLowerCase()
  // 守护使者的各种别名
  const guardianAliases = ['guardian', '守护使者', '守护', 'priest', '牧师', 'cleric', '圣职者']
  return guardianAliases.some(alias => classLower.includes(alias))
}

/**
 * 反向进阶映射表（从子职业反推父职业）
 * 用于构建角色职业进阶历史，查找进阶前职业技能
 * @type {Record<string, string>}
 */
const REVERSE_EVOLUTION_MAP = (() => {
  const map = {}
  Object.entries(JOB_EVOLUTION_PATHS).forEach(([parent, children]) => {
    children.forEach(child => {
      if (!map[child]) {
        map[child] = parent
      }
    })
  })
  return map
})()

/**
 * 获取角色职业进阶历史中的所有职业 key
 * 优先使用玩家保存的 jobHistory（解决多父职业反推错误），
 * 回退到从当前职业反推到初心者，返回有序数组（从初心者到当前职业）
 * @param {string} currentClass - 当前职业 key
 * @param {string[]|null} playerJobHistory - 玩家保存的职业历史路径数组
 * @returns {string[]} 职业进阶路径数组
 */
const getJobHistoryClassKeys = (currentClass, playerJobHistory = null) => {
  const currentLower = currentClass?.toLowerCase() || 'beginner'

  // 优先使用玩家保存的职业历史路径
  if (Array.isArray(playerJobHistory) && playerJobHistory.length > 0) {
    const hasCurrent = playerJobHistory.some(j => j?.toLowerCase() === currentLower)
    if (hasCurrent) {
      const path = []
      const seen = new Set()
      for (const jobKey of playerJobHistory) {
        const key = jobKey?.toLowerCase()
        if (!key || seen.has(key)) continue
        seen.add(key)
        if (JOB_TIER_CONFIG[key]) {
          path.push(key)
        }
      }
      if (path.length > 0) {
        return path
      }
    }
  }

  // 回退：从当前职业反推到初心者
  const path = []
  let current = currentLower
  const visited = new Set()
  while (current && !visited.has(current)) {
    visited.add(current)
    path.unshift(current)
    current = REVERSE_EVOLUTION_MAP[current]
  }
  return path
}

/**
 * 获取角色的技能栏槽位技能 ID 集合
 * 队长（当前玩家）从 Pinia Store 读取，队员从各自存档槽位的 localStorage 读取
 * @param {Object} memberData - 角色数据（player 或 member）
 * @returns {Set<string>|null} 技能 ID 集合，null 表示无法确定（回退为不过滤）
 */
const getMemberSkillBarSlotIds = (memberData) => {
  if (!memberData) return null

  // 队长（当前玩家）：从 Pinia Store 读取
  if (memberData._isPlayer === true || memberData === player.value) {
    try {
      const slotsStore = useSkillBarSlotsStore()
      return slotsStore.activeSlotKeys
    } catch (error) {
      console.error('[Dungeon] 获取队长技能栏槽位失败:', error)
      return null
    }
  }

  // 队员：从各自存档槽位的 localStorage 读取
  const slotId = memberData.slotId
  if (slotId === null || slotId === undefined) return null
  return getSkillBarSlotIdsForSlot(slotId)
}

/**
 * 从进阶历史职业技能配置中查找指定 ID 的技能
 * 用于补充技能栏中已放置但不在当前职业技能列表中的进阶前职业技能
 * @param {string} skillId - 技能 ID（全局唯一）
 * @param {string} playerClass - 当前职业 key
 * @param {Object} playerSkills - 玩家技能数据（含熟练度）
 * @returns {Object|null} 技能对象（含熟练度数据），或 null
 */
const findSkillFromJobHistory = (skillId, playerClass, playerSkills, playerJobHistory = null) => {
if (!skillId || !playerClass) return null
const classKeys = getJobHistoryClassKeys(playerClass, playerJobHistory)
  for (const classKey of classKeys) {
    const classSkills = SKILL_CONFIG[classKey]
    if (classSkills) {
      for (const [skillKey, skill] of Object.entries(classSkills)) {
        if (skill && skill.id === skillId) {
          const playerSkillData = playerSkills?.[skillKey] || playerSkills?.[skillId] || {}
          const proficiencyLevel = playerSkillData.proficiencyLevel || playerSkillData.level || 0
          if (proficiencyLevel <= 0) return null
          return {
            ...skill,
            key: skillKey,
            level: proficiencyLevel,
            proficiencyLevel,
            proficiency: playerSkillData.proficiency || 0,
            proficiencyExp: playerSkillData.proficiencyExp || 0
          }
        }
      }
    }
  }
  return null
}

/**
 * 获取成员用于战斗的技能列表
 * 按照各自存档在主页面底部技能栏拖入的技能进行过滤
 * @param {Object} memberData - 成员数据
 * @returns {Array} 技能列表
 */
const getMemberSkillsForBattle = (memberData) => {
  if (!memberData || !memberData.class) return []

  const skillConfig = gameData.value.skillConfig?.SKILL_CONFIG || gameData.value.skillConfig
  if (!skillConfig) return []

  const classSkills = skillConfig[memberData.class] || {}
  const skillDetails = gameData.value.skills || gameData.value.skillInfo || gameData.value.skillConfig || {}
  const playerSkills = memberData.skills || {}

  // 获取该角色的技能栏槽位 ID 集合
  const slotIds = getMemberSkillBarSlotIds(memberData)

  const skills = []

  Object.keys(classSkills).forEach(skillId => {
    const baseSkill = classSkills[skillId] || skillDetails[skillId] || {}
    const playerSkill = playerSkills[skillId] || {}

    // 检查玩家是否已学会该技能
    const proficiencyLevel = playerSkill.proficiencyLevel || playerSkill.level || 0
    if (proficiencyLevel <= 0) return

    // 如果技能栏已配置技能，仅包含技能栏中的技能
    if (slotIds && slotIds.size > 0) {
      const skillIdentifier = baseSkill.id || skillId
      if (!slotIds.has(skillIdentifier)) return
    }

    const skillType = String(baseSkill.type || 'single').toLowerCase()

    // 构建完整的技能对象，确保所有关键属性都被保留
    const skillObj = {
      key: skillId,
      id: baseSkill.id,
      name: baseSkill.name || playerSkill.name || skillId,
      icon: baseSkill.icon || `/pt/skill_icon/${skillId}.png`,
      type: skillType,
      level: proficiencyLevel,
      damage: baseSkill.damage,
      manaCost: baseSkill.manaCost || baseSkill.mp || 0,
      baseCooldown: baseSkill.cd || baseSkill.baseCooldown || 5, // 默认5秒冷却
      cd: baseSkill.cd || baseSkill.baseCooldown || 5, // 同时保留cd属性
      proficiencyEffect: baseSkill.proficiencyEffect,
      proficiency: baseSkill.proficiency,
      heal: baseSkill.heal,
      buffDuration: baseSkill.buffDuration,
      element: baseSkill.element,
      // 关键：确保伤害计算函数被正确传递
      calculateDamage: baseSkill.calculateDamage || null,
      damageCalculation: baseSkill.damageCalculation || null,
      calculateDotDamage: baseSkill.calculateDotDamage || null,
      calculateBuff: baseSkill.calculateBuff || null,
      calculateHealing: baseSkill.calculateHealing || null,
      calculateDebuffChance: baseSkill.calculateDebuffChance || null,
      calculateDebuffEffect: baseSkill.calculateDebuffEffect || null,
      // DOT 效果配置
      dotEffect: baseSkill.dotEffect || null,
      duration: baseSkill.duration,
      tickInterval: baseSkill.tickInterval,
      // DEBUFF 配置
      debuff: baseSkill.debuff || null,
      // 保留其他所有属性
      ...Object.fromEntries(
        Object.entries(baseSkill).filter(([k]) => 
          !['key', 'id', 'type', 'name', 'damage', 'manaCost', 'level', 'calculateDamage', 
            'damageCalculation', 'calculateDotDamage', 'calculateBuff', 'calculateHealing',
            'calculateDebuffChance', 'calculateDebuffEffect', 'dotEffect', 'debuff'].includes(k))
      )
    }

    skills.push(skillObj)
  })

  // 补充进阶前职业技能：技能栏中已放置但不在当前职业技能列表中的技能
  if (slotIds && slotIds.size > 0) {
    const existingIds = new Set(skills.map(s => s.id).filter(Boolean))
    const missingIds = Array.from(slotIds).filter(id => id && !existingIds.has(id))

    for (const missingId of missingIds) {
      const historySkill = findSkillFromJobHistory(missingId, memberData.class, playerSkills, memberData.jobHistory)
      if (historySkill) {
        const skillType = String(historySkill.type || 'single').toLowerCase()
        skills.push({
          key: historySkill.key,
          id: historySkill.id,
          name: historySkill.name || historySkill.key,
          icon: historySkill.icon || `/pt/skill_icon/${historySkill.key}.png`,
          type: skillType,
          level: historySkill.level,
          damage: historySkill.damage,
          manaCost: historySkill.manaCost || historySkill.mp || 0,
          baseCooldown: historySkill.cd || historySkill.baseCooldown || 5,
          cd: historySkill.cd || historySkill.baseCooldown || 5,
          proficiencyEffect: historySkill.proficiencyEffect,
          proficiency: historySkill.proficiency,
          heal: historySkill.heal,
          buffDuration: historySkill.buffDuration,
          element: historySkill.element,
          calculateDamage: historySkill.calculateDamage || null,
          damageCalculation: historySkill.damageCalculation || null,
          calculateDotDamage: historySkill.calculateDotDamage || null,
          calculateBuff: historySkill.calculateBuff || null,
          calculateHealing: historySkill.calculateHealing || null,
          calculateDebuffChance: historySkill.calculateDebuffChance || null,
          calculateDebuffEffect: historySkill.calculateDebuffEffect || null,
          dotEffect: historySkill.dotEffect || null,
          duration: historySkill.duration,
          tickInterval: historySkill.tickInterval,
          debuff: historySkill.debuff || null,
          ...Object.fromEntries(
            Object.entries(historySkill).filter(([k]) =>
              !['key', 'id', 'type', 'name', 'damage', 'manaCost', 'level', 'calculateDamage',
                'damageCalculation', 'calculateDotDamage', 'calculateBuff', 'calculateHealing',
                'calculateDebuffChance', 'calculateDebuffEffect', 'dotEffect', 'debuff'].includes(k))
          )
        })
      }
    }
  }

  return skills
}

/**
 * 查找可用的指定类型技能
 * @param {Array} skills - 技能列表
 * @param {string} type - 技能类型 'buff' | 'heal' | 'aoe' | 'single' | 'debuff'
 * @param {Object} memberData - 成员数据
 * @returns {Object|null} 可用的技能
 */
const findAvailableSkill = (skills, type, memberData) => {
  if (!skills || !Array.isArray(skills)) return null

  const typeSkills = skills.filter(skill => {
    const skillType = String(skill.type || '').toLowerCase()
    if (type === 'buff') return skillType === 'buff'
    if (type === 'heal') return skillType === 'heal'
    if (type === 'aoe') return skillType === 'aoe'
    if (type === 'debuff') return skillType === 'debuff'
    if (type === 'summon') return skillType === 'summon'
    if (type === 'single') {
      // 单体攻击包括 single, dot, debuff 类型（但不是 buff, heal）
      return ['single', 'dot', 'debuff'].includes(skillType) ||
             (['buff', 'heal', 'aoe'].indexOf(skillType) === -1)
    }
    return false
  })

  // 找第一个MP足够、冷却结束、且（对于buff技能）buff未存在的技能
  for (const skill of typeSkills) {
    if (canMemberUseSkill(skill, memberData)) {
      // 对于buff技能，检查是否已经存在相同的buff
      if (type === 'buff') {
        if (!hasActiveBuff(memberData, skill)) {
          return skill
        }
      } else {
        return skill
      }
    }
  }

  return null
}

/**
 * 检查成员是否已经存在指定的buff
 * @param {Object} memberData - 成员数据
 * @param {Object} skill - 技能数据
 * @returns {boolean} 是否已存在该buff
 */
const hasActiveBuff = (memberData, skill) => {
  if (!memberData || !skill) return false
  
  const activeBuffs = memberData.activeBuffs
  if (!activeBuffs || !Array.isArray(activeBuffs) || activeBuffs.length === 0) {
    return false
  }
  
  // 检查是否存在相同key或相同名称的buff
  const skillKey = skill.key
  const skillName = skill.name
  
  return activeBuffs.some(buff => {
    // 检查buff是否还有效（未过期）
    if (buff.endTime && buff.endTime > Date.now()) {
      return buff.key === skillKey || buff.name === skillName
    }
    return false
  })
}

/**
 * 检查全队是否需要释放指定buff（至少一人缺少该buff）
 * @param {Object} skill - 技能数据
 * @returns {boolean} 是否需要释放buff
 */
const teamNeedsBuff = (skill) => {
  if (!skill) return false
  
  // 构建全队成员列表
  const allMembers = [player.value, ...teamMembers.value].filter(m => m && m.currentHealth > 0)
  
  // 检查是否有至少一人缺少该buff
  for (const member of allMembers) {
    if (!hasActiveBuff(member, skill)) {
      return true // 有人缺少buff，需要释放
    }
  }
  
  return false // 所有人都有该buff，不需要释放
}

/**
 * 检查成员是否可以使用技能
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 成员数据
 * @returns {boolean}
 */
const canMemberUseSkill = (skill, memberData) => {
  if (!skill || !memberData) return false

  // 检查MP是否足够
  const mpCost = skill.manaCost || 0
  const currentMana = memberData.currentMana || 0
  if (currentMana < mpCost) return false

  // 检查被动技能不能主动使用
  if (skill.isPassive === true) return false

  // 检查技能是否在冷却中
  const memberId = getMemberId(memberData)
  const onCooldown = isSkillOnCooldown(memberId, skill.key)
  return !onCooldown
}

/**
 * 获取成员ID
 * @param {Object} memberData - 成员数据
 * @returns {string} 成员ID
 */
const getMemberId = (memberData) => {
  if (!memberData) return 'player'
  // 如果有 slotId，说明是队伍成员
  if (memberData.slotId !== undefined) {
    return `member_${memberData.slotId}`
  }
  return 'player'
}

/**
 * 查找需要治疗的目标
 * @param {Object} memberData - 当前成员数据
 * @param {number} recoveryThreshold - 恢复阈值（0~1），低于此值的队友需要治疗
 * @returns {Object|null} 需要治疗的目标
 */
const findHealTarget = (memberData, recoveryThreshold = 0.5) => {
  // 构建所有队友列表
  const allMembers = [player.value, ...teamMembers.value]

  // 找到血量百分比低于恢复阈值的队友
  let lowestHealthPercent = 1
  let healTarget = null

  for (const member of allMembers) {
    if (!member || member.currentHealth <= 0) continue
    const healthPercent = member.currentHealth / member.maxHealth
    // 血量低于恢复阈值需要治疗
    if (healthPercent < recoveryThreshold && healthPercent < lowestHealthPercent) {
      lowestHealthPercent = healthPercent
      healTarget = member
    }
  }

  return healTarget
}

/**
 * 检查是否有多个存活的怪物
 * @returns {boolean}
 */
const hasMultipleAliveMonsters = () => {
  const aliveCount = monsters.value.filter(m => m && !m.isDying && m.currentHealth > 0).length
  return aliveCount >= 2
}

/**
 * 查找所有可用的伤害技能（AOE和单体）
 * @param {Array} skills - 技能列表
 * @param {Object} memberData - 成员数据
 * @returns {Array} 可用的伤害技能列表
 */
const findAllAvailableDamageSkills = (skills, memberData) => {
  if (!skills || !Array.isArray(skills)) return []

  const damageSkills = []

  for (const skill of skills) {
    const skillType = String(skill.type || '').toLowerCase()
    
    // 只选择伤害类技能（AOE、单体、DOT、Debuff）
    const isDamageSkill = ['aoe', 'single', 'dot', 'debuff'].includes(skillType) ||
      (!['buff', 'heal'].includes(skillType))
    
    if (!isDamageSkill) continue

    // 检查技能是否可用（MP足够、不在冷却中、非被动）
    if (canMemberUseSkill(skill, memberData)) {
      damageSkills.push(skill)
    }
  }

  // 按技能类型排序：AOE优先
  damageSkills.sort((a, b) => {
    const aIsAoe = String(a.type || '').toLowerCase() === 'aoe'
    const bIsAoe = String(b.type || '').toLowerCase() === 'aoe'
    if (aIsAoe && !bIsAoe) return -1
    if (!aIsAoe && bIsAoe) return 1
    return 0
  })

  return damageSkills
}

/**
 * 计算技能的实际冷却时间（考虑EX1被动技能CD减少）
 * 自动战斗中释放技能时调用，确保CD减少被动技能生效
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 成员数据（玩家或队友）
 * @returns {number} 实际冷却时间（秒），最小为1秒
 */
const calculateEffectiveCooldown = (skill, memberData) => {
const baseCd = Number(skill.baseCooldown || skill.cd || 5)
// 暗影斗篷EX1-CD减少被动：减少暗影斗篷技能CD 50%
if (skill.id === 'joker_emperor_r') {
return getShadowCloakEffectiveCooldown(memberData, baseCd)
}
// 雷神之锤EX1-CD减少被动：减少雷神之锤技能CD 50%
if (skill.id === 'nature_messenger_t') {
return getThunderHammerEffectiveCooldown(memberData, baseCd)
}
// 圣光审判EX1-CD减少被动：减少圣光审判技能CD 50%
if (skill.id === 'nature_messenger_e') {
return getHolyJudgmentEffectiveCooldown(memberData, baseCd)
}
// 天使之怒EX1-CD减少被动：减少天使之怒技能CD 50%
if (skill.id === 'nature_messenger_u') {
return getAngelWrathEffectiveCooldown(memberData, baseCd)
}
// 星思坠寂EX1-CD减少被动：减少星思坠寂技能CD 50%
if (skill.id === 'mind_master_w') {
return getMindTearEffectiveCooldown(memberData, baseCd)
}
// 意识崩塌EX1-CD减少被动：减少意识崩塌技能CD 50%
if (skill.id === 'mind_master_e') {
return getConsciousnessCollapseEffectiveCooldown(memberData, baseCd)
}
// 万绪沉宵EX1-CD减少被动：减少万绪沉宵技能CD 50%
if (skill.id === 'mind_master_u') {
return getMindNovaEffectiveCooldown(memberData, baseCd)
}
return baseCd
}

/**
 * 使用BUFF技能给自己
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 成员数据
 * @param {string} memberType - 成员类型
 */
const useBuffSkillOnSelf = (skill, memberData, memberType) => {
  // 先尝试设置冷却（原子操作）
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
  const cooldownSeconds = calculateEffectiveCooldown(skill, memberData)
  if (!setSkillCooldown(memberId, skill.key, cooldownSeconds)) {
    return
  }

const mpCost = skill.manaCost || 0
memberData.currentMana = Math.max(0, (memberData.currentMana || 0) - mpCost)

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(memberData)

// 播放技能音效
  playSkillSound(skill)

  const memberName = memberData.nickname || '玩家'

  // 计算BUFF持续时间（优先使用 calculateDuration 函数）
  let buffDuration = skill.buffDuration || skill.duration || 30
  if (typeof skill.calculateDuration === 'function') {
    buffDuration = skill.calculateDuration(memberData, skill.level || 1)
  }

  // 使用 toRaw 获取原始对象，绕过 Vue 的响应式代理
  const rawMemberData = toRaw(memberData)

  // 初始化 activeBuffs 数组（使用 markRaw 阻止响应式代理）
  if (!rawMemberData.activeBuffs) {
    rawMemberData.activeBuffs = markRaw([])
  }

  // 检查是否已存在相同的BUFF（根据技能key判断）
  const existingBuffIndex = rawMemberData.activeBuffs.findIndex(b => b.key === skill.key || b.skillId === skill.key)
  if (existingBuffIndex > -1) {
    // 已存在相同BUFF，刷新持续时间（直接操作原始数组，不触发响应式更新）
    const existingBuff = rawMemberData.activeBuffs[existingBuffIndex]
    existingBuff.startTime = Date.now()
    existingBuff.duration = buffDuration
    existingBuff.endTime = Date.now() + buffDuration * 1000
    existingBuff.skillLevel = skill.level || 1
    existingBuff.level = skill.level || 1
    // 更新施法者属性（可能属性已变化）
    existingBuff.intelligence = memberData.intelligence || memberData.stats?.intelligence || 0
    existingBuff.strength = memberData.strength || memberData.stats?.strength || 0
    existingBuff.agility = memberData.agility || memberData.stats?.agility || 0
    existingBuff.constitution = memberData.constitution || memberData.stats?.constitution || 0
    existingBuff.stamina = memberData.stamina || memberData.stats?.stamina || 0
    existingBuff.casterAttack = memberData.attack || memberData.stats?.attack || 0
    existingBuff.hotTickInterval = skill.hotTickInterval || 0

    buffVersion.value++
    startBuffCountdown()
    return
  }

  // 计算BUFF效果（优先使用calculateBuff方法）
  let buffEffect = skill.buffEffect || skill.effects || {}
  if (typeof skill.calculateBuff === 'function') {
    buffEffect = skill.calculateBuff(memberData, skill.level || 1) // 这里仍然用 memberData 因为可能需要响应式属性
  } else if (skill.proficiency && skill.proficiency.effect) {
    // 从熟练度配置中计算效果
    const effectConfig = skill.proficiency.effect
    const skillLevel = skill.level || 1
    buffEffect = {}
    
    for (const [statName, config] of Object.entries(effectConfig)) {
      if (typeof config === 'object' && config.base !== undefined) {
        const increment = config.increment || 0
        const value = config.base + increment * (skillLevel - 1)
        buffEffect[statName] = {
          add: value,
          rate: config.rate || false
        }
      }
    }
  }

  // 创建新的BUFF对象（使用 markRaw 阻止响应式代理）
  // 保存施法者的关键属性，用于 BUFF 详情面板显示
  const newBuff = markRaw({
    id: `buff_${Date.now()}_${skill.key}`,
    key: skill.key,
    name: skill.name,
    icon: skill.icon,
    startTime: Date.now(),
    duration: buffDuration,
    endTime: Date.now() + buffDuration * 1000,
    effect: buffEffect,
    skillLevel: skill.level || 1,
    isTeamBuff: false,
    sourceMember: memberName,
    // 保存施法者的关键属性，用于 BUFF 详情面板计算显示
    level: skill.level || 1,
    intelligence: memberData.intelligence || memberData.stats?.intelligence || 0,
    strength: memberData.strength || memberData.stats?.strength || 0,
    agility: memberData.agility || memberData.stats?.agility || 0,
    constitution: memberData.constitution || memberData.stats?.constitution || 0,
    stamina: memberData.stamina || memberData.stats?.stamina || 0,
    // 保存施法者攻击力，用于HOT等基于攻击力百分比的效果计算
    casterAttack: memberData.attack || memberData.stats?.attack || 0,
    hotTickInterval: skill.hotTickInterval || 0
  })

  // 添加到活跃BUFF列表（直接操作原始数组）
  rawMemberData.activeBuffs.push(newBuff)

  // 重新计算角色属性（PlayerStatsService 会自动读取 activeBuffs 并应用效果）
  recalculateMemberStats(rawMemberData)

  // 由于 activeBuffs 使用 markRaw 包装，修改数组不会触发响应式更新
  // 通过增加 buffVersion 强制刷新 BUFF 显示
  buffVersion.value++

  // 启动BUFF倒计时检查
  startBuffCountdown()
}

/**
 * 使用BUFF技能给全队
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 成员数据（施法者）
 * @param {string} memberType - 成员类型
 */
const useBuffSkillOnTeam = (skill, memberData, memberType) => {
  // 先尝试设置冷却（原子操作）
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
  const cooldownSeconds = calculateEffectiveCooldown(skill, memberData)
  if (!setSkillCooldown(memberId, skill.key, cooldownSeconds)) {
    return
  }

  const memberName = memberData?.nickname || '未知'

const mpCost = skill.manaCost || 0
memberData.currentMana = Math.max(0, (memberData.currentMana || 0) - mpCost)

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(memberData)

// 播放技能音效
  playSkillSound(skill)

  // 计算BUFF持续时间（优先使用 calculateDuration 函数）
  let buffDuration = skill.buffDuration || skill.duration || 30
  if (typeof skill.calculateDuration === 'function') {
    buffDuration = skill.calculateDuration(memberData, skill.level || 1)
  }
  
  const allMembers = [player.value, ...teamMembers.value].filter(m => m && m.currentHealth > 0)

  // 计算BUFF效果（优先使用calculateBuff方法）
  const calculateBuffEffect = (target) => {
    let buffEffect = skill.buffEffect || skill.effects || {}
    if (typeof skill.calculateBuff === 'function') {
      buffEffect = skill.calculateBuff(target, skill.level || 1)
    } else if (skill.proficiency && skill.proficiency.effect) {
      // 从熟练度配置中计算效果
      const effectConfig = skill.proficiency.effect
      const skillLevel = skill.level || 1
      buffEffect = {}
      
      for (const [statName, config] of Object.entries(effectConfig)) {
        if (typeof config === 'object' && config.base !== undefined) {
          const increment = config.increment || 0
          const value = config.base + increment * (skillLevel - 1)
          buffEffect[statName] = {
            add: value,
            rate: config.rate || false
          }
        }
      }
    }
    return buffEffect
  }

  // 为每个队友添加BUFF（使用 toRaw 绕过 Vue 的响应式代理）
  for (const target of allMembers) {
    // 使用 toRaw 获取原始对象，绕过 Vue 的响应式代理
    const rawTarget = toRaw(target)
    
    // 初始化 activeBuffs 数组（使用 markRaw 阻止响应式代理）
    if (!rawTarget.activeBuffs) {
      rawTarget.activeBuffs = markRaw([])
    }

    // 检查是否已存在相同的BUFF（根据技能key判断）
    const existingBuffIndex = rawTarget.activeBuffs.findIndex(b => b.key === skill.key || b.skillId === skill.key)

    if (existingBuffIndex > -1) {
      // 已存在相同BUFF，刷新持续时间（直接操作原始数组，不触发响应式更新）
      const existingBuff = rawTarget.activeBuffs[existingBuffIndex]
      existingBuff.startTime = Date.now()
      existingBuff.duration = buffDuration
      existingBuff.endTime = Date.now() + buffDuration * 1000
      existingBuff.skillLevel = skill.level || 1
      existingBuff.level = skill.level || 1
      // 更新施法者属性（可能属性已变化）
      existingBuff.intelligence = memberData.intelligence || memberData.stats?.intelligence || 0
      existingBuff.strength = memberData.strength || memberData.stats?.strength || 0
      existingBuff.agility = memberData.agility || memberData.stats?.agility || 0
      existingBuff.constitution = memberData.constitution || memberData.stats?.constitution || 0
      existingBuff.stamina = memberData.stamina || memberData.stats?.stamina || 0
      existingBuff.casterAttack = memberData.attack || memberData.stats?.attack || 0
      existingBuff.hotTickInterval = skill.hotTickInterval || 0
      continue // 跳过添加新BUFF，处理下一个目标
    }

    // 计算针对该目标的BUFF效果
    const buffEffect = calculateBuffEffect(target)

    // 创建新的BUFF对象（使用 markRaw 阻止响应式代理）
    // 保存施法者的关键属性，用于 BUFF 详情面板显示
    const newBuff = markRaw({
      id: `buff_${Date.now()}_${skill.key}_${rawTarget.slotId || 'player'}`,
      key: skill.key,
      name: skill.name,
      icon: skill.icon,
      startTime: Date.now(),
      duration: buffDuration,
      endTime: Date.now() + buffDuration * 1000,
      effect: buffEffect,
      skillLevel: skill.level || 1,
      isTeamBuff: true,
      sourceMember: memberName,
      // 保存施法者的关键属性，用于 BUFF 详情面板计算显示
      level: skill.level || 1,
      intelligence: memberData.intelligence || memberData.stats?.intelligence || 0,
      strength: memberData.strength || memberData.stats?.strength || 0,
      agility: memberData.agility || memberData.stats?.agility || 0,
      constitution: memberData.constitution || memberData.stats?.constitution || 0,
      stamina: memberData.stamina || memberData.stats?.stamina || 0,
      // 保存施法者攻击力，用于HOT等基于攻击力百分比的效果计算
      casterAttack: memberData.attack || memberData.stats?.attack || 0,
      hotTickInterval: skill.hotTickInterval || 0
    })

    // 添加到活跃BUFF列表（直接操作原始数组）
    rawTarget.activeBuffs.push(newBuff)

    // 重新计算角色属性（PlayerStatsService 会自动读取 activeBuffs 并应用效果）
    recalculateMemberStats(rawTarget)
  }

  // 由于 activeBuffs 使用 markRaw 包装，修改数组不会触发响应式更新
  // 通过增加 buffVersion 强制刷新 BUFF 显示
  buffVersion.value++
  gameStore.buffVersion++
  
  // 启动BUFF倒计时检查
  startBuffCountdown()
}

/**
 * 重新计算角色属性（应用 BUFF 效果）
 * @param {Object} memberData - 角色数据
 */
const recalculateMemberStats = (memberData) => {
  // 判断是否是当前玩家（通过引用判断，不依赖 slotId 避免误判）
  // 注意：memberData 可能是 toRaw 后的原始对象，所以需要比较原始对象
  const rawPlayer = toRaw(player.value)
  const rawMemberData = toRaw(memberData)

  // 仅通过对象引用判断，移除 slotId 比较和 _isPlayer 标记（可能导致误判）
  const isPlayer = rawMemberData === rawPlayer

  if (isPlayer) {
    // 当前玩家，使用 updatePlayerAttributes 重新计算属性

    // 确保 player.value.activeBuffs 和 gameStore.player.activeBuffs 同步
    // memberData 是 toRaw(player.value) 的结果，它们共享同一个 activeBuffs 数组
    // 但需要确保 gameStore.player.activeBuffs 也指向同一个数组
    const memberBuffs = memberData.activeBuffs || []
    
    // 无论长度如何，都要同步 activeBuffs 到 player.value 和 gameStore.player
    // 因为 gameStore.player 和 player.value 是不同的对象实例
    player.value.activeBuffs = memberBuffs
    gameStore.player.activeBuffs = memberBuffs

    if (typeof updatePlayerAttributes === 'function') {
      updatePlayerAttributes()
    }
    // updatePlayerAttributes 会在 gameStore.player 上重新计算属性（包括 maxMana 等）
    // 需要将 player.value 指向 gameStore.player 以保持引用一致，确保 UI 读取到最新属性
    if (gameStore.player && gameStore.player !== player.value) {
      player.value = gameStore.player
      player.value._isPlayer = true
      if (player.value.slotId === undefined) {
        player.value.slotId = storageService.getCurrentSaveSlot()
      }
    }
    // 刷新 BUFF 显示，触发 manaPercentage 等 computed 重新计算
    gameStore.buffVersion++
    buffVersion.value++
    // 使用延迟保存，避免阻塞主线程
    debouncedSavePlayerData()
  } else {
    // 队友，调用 PlayerStatsService.applyFinalStats 重新计算属性
    // 清除装备加成缓存，避免队长的缓存结果污染队员的属性计算（全局缓存问题）
    PlayerStatsService.clearEquipmentCache()
    if (typeof PlayerStatsService.applyFinalStats === 'function') {
      PlayerStatsService.applyFinalStats(memberData, gameStore.equipmentSets || [])
    }
    
    // 使用延迟保存队员数据
    debouncedSaveTeamMemberData(memberData)
  }
}

// 延迟保存玩家数据的定时器
let savePlayerDataTimer = null

/**
 * 延迟保存玩家数据（避免频繁保存阻塞主线程）
 */
const debouncedSavePlayerData = () => {
  if (savePlayerDataTimer) {
    clearTimeout(savePlayerDataTimer)
  }
  savePlayerDataTimer = setTimeout(() => {
    storageService.savePlayerData(player.value)
    savePlayerDataTimer = null
  }, 1000) // 1秒后保存
}

// 队员数据保存的定时器映射
const teamMemberSaveTimers = new Map()

/**
 * 延迟保存队员数据（避免频繁保存阻塞主线程）
 * @param {Object} memberData - 队员数据
 */
const debouncedSaveTeamMemberData = (memberData) => {
  const slotId = memberData.slotId

  // 取消之前的定时器
  if (teamMemberSaveTimers.has(slotId)) {
    clearTimeout(teamMemberSaveTimers.get(slotId))
  }

  // 设置新的定时器（3秒防抖，合并短时间内的多次保存请求）
  const timer = setTimeout(() => {
    saveTeamMemberData(memberData)
    teamMemberSaveTimers.delete(slotId)
  }, 3000)

  teamMemberSaveTimers.set(slotId, timer)
}

/**
 * 立即保存所有队员数据（页面卸载时调用）
 */
const flushAllPendingSaves = () => {
  if (savePlayerDataTimer) {
    clearTimeout(savePlayerDataTimer)
    storageService.savePlayerData(player.value)
    savePlayerDataTimer = null
  }
  
  teamMemberSaveTimers.forEach((timer, slotId) => {
    clearTimeout(timer)
    const member = teamMembers.value.find(m => m.slotId === slotId)
    if (member) {
      saveTeamMemberData(member)
    }
  })
  teamMemberSaveTimers.clear()
}

/**
 * 保存队员数据到对应的存档槽
 * @param {Object} memberData - 队员数据
 */
const saveTeamMemberData = async (memberData) => {
  try {
    const slotId = memberData.slotId
    if (slotId === undefined || slotId === null) return

    // 通过后端API保存队员数据到对应存档槽
    const patch = {
      level: memberData.level,
      exp: memberData.exp,
      maxExp: memberData.maxExp,
      gold: memberData.gold,
      currentHealth: memberData.currentHealth,
      maxHealth: memberData.maxHealth,
      currentMana: memberData.currentMana,
      maxMana: memberData.maxMana,
      // 保存 activeBuffs
      activeBuffs: memberData.activeBuffs || [],
      // 保存技能数据（包含熟练度）
      skills: memberData.skills || {}
    }

    // 保存背包数据（如使用复活卷轴/恢复道具后背包变化需要持久化）
    if (Array.isArray(memberData.bag)) {
      patch.bag = memberData.bag
    }

    // 带递增超时重试机制，应对自动战斗期间服务端 SQLite 单连接排队导致的超时
    const retryTimeouts = [60000, 120000, 180000]
    for (let attempt = 0; attempt < retryTimeouts.length; attempt++) {
      try {
        const result = await storageService.savePlayerPatchBySlot(Number(slotId), patch, retryTimeouts[attempt])
        if (result) break
        if (attempt < retryTimeouts.length - 1) {
          console.warn(`[Dungeon] 队员数据保存第${attempt + 1}次失败，重试中...`)
        } else {
          console.error('[Dungeon] 队员数据保存失败（已重试3次）')
        }
      } catch (retryError) {
        console.error(`[Dungeon] 队员数据保存异常（第${attempt + 1}次）:`, retryError)
      }
    }
  } catch (error) {
    console.error('[Dungeon] 保存队员数据失败:', error)
  }
}

// ============ 掉落物品分配相关函数 ============

/**
 * 处理掉落物品分配确认（单件物品，从掉落动画拾取后触发）
 * @param {Object} result - 分配结果 { winner, item, quantity }
 */
const handleLootConfirm = async (result) => {
  const { winner, item, quantity } = result

  // 关闭当前分配面板
  showLootPanel.value = false
  currentLootItem.value = null

  if (!winner || !item) {
    showNextLootItem()
    return
  }

  const itemName = item.name?.cns || item.name || '物品'

  if (winner === 'player') {
    // 玩家获得物品，添加到背包
    const BagService = (await import('@/services/BagService')).default
    BagService.addItemsToBag([{ itemId: item.id, quantity }])
    addBattleLog(`${player.value.nickname} ROLL点获得 ${itemName} x${quantity}`, '#4CAF50')
    // 居中悬浮动画提示：玩家名称 获得 物品名称x数量
    showPickupAnimationMessage(
      `获得 ${itemName}x${quantity}`,
      'pickup',
      item.id ? `/pt/item_icon/${item.id}.png` : '',
      `${player.value.nickname || '玩家'}`
    )
  } else {
    // 队员获得物品，添加到队员背包
    // 使用 String() 统一类型比较，避免数字 slotId 与字符串 winner 不匹配
    const member = teamMembers.value.find(m => String(m.slotId) === String(winner))
    if (member) {
      if (!member.bag) member.bag = []
      member.bag.push({
        id: item.id,
        itemId: item.id,
        name: itemName,
        icon: `/pt/item_icon/${item.id}.png`,
        currentStack: quantity,
        stack: quantity,
        rarity: item.rarity || 'common'
      })
      saveTeamMemberData(member)
      addBattleLog(`${member.nickname} ROLL点获得 ${itemName} x${quantity}`, '#4CAF50')
    }
  }

  // 检查队列中是否还有待分配物品
  showNextLootItem()
}

/**
 * 处理放弃物品（单件物品，从掉落动画拾取后触发）
 */
const handleLootPass = () => {
  if (currentLootItem.value) {
    const itemName = currentLootItem.value.name?.cns || currentLootItem.value.name || '物品'
    addBattleLog(`放弃了 ${itemName}`, '#888')
  }
  showLootPanel.value = false
  currentLootItem.value = null

  // 检查队列中是否还有待分配物品
  showNextLootItem()
}

/**
 * 获取品质中文名称
 * @param {string} rarity - 品质英文标识
 * @returns {string} 品质中文名称
 */
const getRarityName = (rarity) => {
  const rarityNames = {
    common: '普通',
    uncommon: '罕见',
    rare: '稀有',
    veryrare: '极稀有',
    unique: '传说',
    ultimate: '终极',
    mythic: '神话'
  }
  return rarityNames[rarity] || '普通'
}

/**
 * 将物品直接添加到队长（玩家）背包
 * @param {Array} items - 要添加的物品列表
 */
const addItemsToPlayerBag = async (items) => {
  if (!items || items.length === 0) return

  try {
    const BagService = (await import('@/services/BagService')).default
    for (const item of items) {
      const added = BagService.addItemsToBag([{ itemId: item.id, quantity: item.quantity || item.currentStack || 1 }])
      if (!added) {
        const itemName = item.name?.cns || item.name || '物品'
        addBattleLog(`背包已满，无法获得 ${itemName}`, '#ff4444')
      }
    }
    // 保存玩家数据
    storageService.savePlayerData(player.value)
  } catch (error) {
    console.error('[Dungeon] 添加物品到背包失败:', error)
  }
}

/**
 * 应用/移除BUFF效果到角色属性
 * @param {Object} memberData - 角色数据
 * @param {Object} effect - BUFF效果对象
 * @param {boolean} isApply - true=应用效果， false=移除效果
 */
const applyBuffEffects = (memberData, effect, isApply) => {
  if (!effect || typeof effect !== 'object') return

  // 确保 tempStats 存在（用于存储BUFF临时属性加成）
  if (!memberData.tempStats) {
    memberData.tempStats = {}
  }

  // 元素攻击属性列表（这些属性的 rate=true 表示值本身是百分比，如 3 表示 3%）
  const elementAttackStats = ['fireAttack', 'waterAttack', 'windAttack', 'thunderAttack', 'earthAttack']

  // 遍历效果对象中的每个属性
  for (const [statName, value] of Object.entries(effect)) {
    // 支持的效果类型：固定值加成
    if (typeof value === 'number') {
      if (memberData[statName] !== undefined) {
        // 更新tempStats
        if (!memberData.tempStats[statName]) {
          memberData.tempStats[statName] = 0
        }
        
        if (isApply) {
          memberData.tempStats[statName] += value
          memberData[statName] += value
        } else {
          memberData.tempStats[statName] -= value
          memberData[statName] -= value
        }
      }
    }
    // 支持的效果类型：百分比加成（如 { add: 0.1, rate: true }）
    else if (typeof value === 'object' && value !== null) {
      const add = value.add || value.value || 0
      const isRate = value.rate || value.isPercent || false
      
      if (memberData[statName] !== undefined) {
        // 更新tempStats（存储百分比效果）
        const tempKey = `${statName}Rate`
        if (!memberData.tempStats[tempKey]) {
          memberData.tempStats[tempKey] = 0
        }
        
        if (isApply) {
          if (isRate) {
            // 元素攻击属性：rate=true 表示值本身是百分比（如 3 表示 3%），直接加
            if (elementAttackStats.includes(statName)) {
              memberData.tempStats[statName] = (memberData.tempStats[statName] || 0) + add
              memberData[statName] += add
            } else {
              // 其他属性：百分比加成（如攻击力 +10%，add=10 时需要除以100）
              memberData.tempStats[tempKey] += add
              memberData[statName] = memberData[statName] * (1 + add / 100)
            }
          } else {
            memberData.tempStats[statName] = (memberData.tempStats[statName] || 0) + add
            memberData[statName] += add
          }
        } else {
          if (isRate) {
            // 元素攻击属性：rate=true 表示值本身是百分比，直接减
            if (elementAttackStats.includes(statName)) {
              memberData.tempStats[statName] = (memberData.tempStats[statName] || 0) - add
              memberData[statName] -= add
            } else {
              // 其他属性：百分比减成
              memberData.tempStats[tempKey] -= add
              memberData[statName] = memberData[statName] / (1 + add / 100)
            }
          } else {
            memberData.tempStats[statName] = (memberData.tempStats[statName] || 0) - add
            memberData[statName] -= add
          }
        }
      }
    }
  }
}

/**
 * BUFF倒计时定时器
 */
let buffCountdownTimer = null

/**
 * 启动BUFF倒计时检查
 */
const startBuffCountdown = () => {
  if (buffCountdownTimer) return

  buffCountdownTimer = setInterval(() => {
    // 组件正在卸载时跳过响应式更新，避免 patch 到已销毁的子组件导致 emitsOptions null 报错
    if (isComponentUnmounting.value) return
    updateAllBuffCountdowns()
  }, 1000)
}

/**
 * 停止BUFF倒计时检查
 */
const stopBuffCountdown = () => {
  if (buffCountdownTimer) {
    clearInterval(buffCountdownTimer)
    buffCountdownTimer = null
  }
}

/**
 * 更新所有角色的BUFF倒计时
 */
const updateAllBuffCountdowns = () => {
  // 组件正在卸载时跳过，避免触发 buffVersion 响应式更新导致 patch 报错
  if (isComponentUnmounting.value) return

  const now = Date.now()
  
  // 更新队长的BUFF
  updateMemberBuffCountdowns(player.value, now)
  // 处理队长的HOT效果
  processMemberHot(toRaw(player.value), { updatePlayer: () => {} })
  
  // 更新队员的BUFF
  for (const member of teamMembers.value) {
    if (member && member.currentHealth > 0) {
      updateMemberBuffCountdowns(member, now)
      // 处理队员的HOT效果
      processMemberHot(toRaw(member), { updatePlayer: () => {} })
    }
  }
  
  // 检查自动恢复BUFF并执行恢复
  checkAndAutoRecoverMembers()
  
  // 由于 activeBuffs 使用 markRaw 包装，修改数组不会触发响应式更新
  // 通过增加 buffVersion 强制刷新 BUFF 显示
  buffVersion.value++
}

/**
 * 检查所有角色是否有自动恢复BUFF（ID=1276）并执行自动恢复
 * 功能：在副本中使用恢复卷轴后，自动使用背包中的恢复物品恢复HP/MP
 */
const checkAndAutoRecoverMembers = () => {
  // 检查队长
  if (player.value && player.value.currentHealth > 0) {
    checkMemberAutoRecovery(player.value)
  }
  
  // 检查所有队友
  for (const member of teamMembers.value) {
    if (member && member.currentHealth > 0) {
      checkMemberAutoRecovery(member)
    }
  }
}

/**
 * 检查单个角色的自动恢复BUFF并执行恢复
 * @param {Object} memberData - 角色数据
 */
const checkMemberAutoRecovery = (memberData) => {
  if (!memberData) return
  
  const rawMemberData = toRaw(memberData)
  
  // 检查是否有自动恢复BUFF（ID=1276）
  if (!rawMemberData.activeBuffs || !Array.isArray(rawMemberData.activeBuffs)) return
  
  const hasAutoRecoveryBuff = rawMemberData.activeBuffs.some(buff => Number(buff?.id) === 1276)
  if (!hasAutoRecoveryBuff) return
  
  // 获取恢复阈值设置（默认50%）
  const settings = userSettings.value || {}
  const hpRecoveryPercent = Number(settings.autoHpRecoveryPercent) || 50
  const mpRecoveryPercent = Number(settings.autoMpRecoveryPercent) || 50
  
  const hpThreshold = (memberData.maxHealth * hpRecoveryPercent) / 100
  const mpThreshold = (memberData.maxMana * mpRecoveryPercent) / 100
  
  const shouldRecoverHp = memberData.currentHealth <= hpThreshold && memberData.currentHealth < memberData.maxHealth
  const shouldRecoverMp = memberData.currentMana <= mpThreshold && memberData.currentMana < memberData.maxMana
  
  if (!shouldRecoverHp && !shouldRecoverMp) return
  
  // 从角色的背包中查找恢复物品
  const bag = Array.isArray(memberData.bag) ? memberData.bag : []
  
  // 查找HP恢复物品（food类型）
  if (shouldRecoverHp) {
    const hpItems = bag.filter(item => {
      if (!item || item.category !== 'recovery') return false
      if (item.subcategory !== 'food') return false
      const itemConfig = itemsStore.getItemConfig(item.id)
      if (!itemConfig || !itemConfig.abilities) return false
      return itemConfig.abilities.some(ability => ability.parameter === 'hp' && (ability.add || ability.rate))
    })
    
    if (hpItems.length > 0) {
      const hpNeeded = memberData.maxHealth - memberData.currentHealth
      useRecoveryItemsForMember(memberData, hpItems, hpNeeded, 'hp')
    }
  }
  
  // 查找MP恢复物品（refresher类型）
  if (shouldRecoverMp) {
    const mpItems = bag.filter(item => {
      if (!item || item.category !== 'recovery') return false
      if (item.subcategory !== 'refresher') return false
      const itemConfig = itemsStore.getItemConfig(item.id)
      if (!itemConfig || !itemConfig.abilities) return false
      return itemConfig.abilities.some(ability => ability.parameter === 'mp' && (ability.add || ability.rate))
    })
    
    if (mpItems.length > 0) {
      const mpNeeded = memberData.maxMana - memberData.currentMana
      useRecoveryItemsForMember(memberData, mpItems, mpNeeded, 'mp')
    }
  }
}

/**
 * 为角色使用恢复物品
 * @param {Object} memberData - 角色数据
 * @param {Array} items - 恢复物品列表
 * @param {number} needed - 需要恢复的量
 * @param {string} parameter - 恢复类型 'hp' 或 'mp'
 */
const useRecoveryItemsForMember = (memberData, items, needed, parameter) => {
  if (needed <= 0 || !items.length) return
  
  let totalRecovery = 0
  const itemsToUse = []
  
  // 计算需要的物品数量
  for (const item of items) {
    const itemConfig = itemsStore.getItemConfig(item.id)
    if (!itemConfig || !itemConfig.abilities) continue
    
    const recoveryAbility = itemConfig.abilities.find(
      ability => ability.parameter === parameter && (ability.add || ability.rate)
    )
    if (!recoveryAbility) continue
    
    let recoveryValue = 0
    if (recoveryAbility.rate) {
      const maxValue = parameter === 'hp' ? memberData.maxHealth : memberData.maxMana
      recoveryValue = Math.floor(maxValue * (recoveryAbility.add / 100))
    } else {
      recoveryValue = recoveryAbility.add
    }
    
    if (recoveryValue <= 0) continue
    
    const actualStack = item.currentStack !== undefined ? item.currentStack : item.stack || 1
    itemsToUse.push({
      item,
      recoveryPerUnit: recoveryValue,
      totalCount: actualStack
    })
    
    totalRecovery += recoveryValue * actualStack
    
    if (totalRecovery >= needed) break
  }
  
  if (itemsToUse.length === 0) return
  
  // 使用物品进行恢复
  let remainingNeeded = needed
  let totalRestoreValue = 0
  const itemsToRemove = []
  
  for (const itemData of itemsToUse) {
    if (remainingNeeded <= 0) break
    
    const itemsToUseCount = Math.min(
      itemData.totalCount,
      Math.ceil(remainingNeeded / itemData.recoveryPerUnit)
    )
    
    totalRestoreValue += itemsToUseCount * itemData.recoveryPerUnit
    itemsToRemove.push({ item: itemData.item, count: itemsToUseCount })
    remainingNeeded -= itemsToUseCount * itemData.recoveryPerUnit
  }
  
  // 应用恢复效果
  if (totalRestoreValue > 0) {
    if (parameter === 'hp') {
      memberData.currentHealth = Math.min(
        memberData.maxHealth,
        memberData.currentHealth + totalRestoreValue
      )
    } else if (parameter === 'mp') {
      memberData.currentMana = Math.min(
        memberData.maxMana,
        memberData.currentMana + totalRestoreValue
      )
    }
    
    // 从背包中移除使用的物品
    for (const { item, count } of itemsToRemove) {
      const bagIndex = memberData.bag.findIndex(bagItem => bagItem && bagItem.id === item.id)
      if (bagIndex === -1) continue
      
      const bagItem = memberData.bag[bagIndex]
      const currentStack = bagItem.currentStack !== undefined ? bagItem.currentStack : bagItem.stack || 1
      
      if (count >= currentStack) {
        // 移除整个物品
        memberData.bag.splice(bagIndex, 1)
      } else {
        // 减少数量
        memberData.bag[bagIndex].currentStack = currentStack - count
      }
    }
    
    // 同步到 itemsStore
    if (memberData === player.value) {
      itemsStore.playerBag = [...memberData.bag]
    }
  }
}

/**
 * 更新单个角色的BUFF倒计时
 * @param {Object} memberData - 角色数据
 * @param {number} now - 当前时间戳
 */
const updateMemberBuffCountdowns = (memberData, now) => {
  // 使用 toRaw 获取原始对象和原始数组
  const rawMemberData = toRaw(memberData)
  
  if (!rawMemberData.activeBuffs || !Array.isArray(rawMemberData.activeBuffs)) return

  // 如果没有 BUFF，直接返回
  if (rawMemberData.activeBuffs.length === 0) return

  const expiredBuffs = []

  // 检查每个BUFF是否过期（支持 endTime 和 expiresAt 两种字段）
  for (const buff of rawMemberData.activeBuffs) {
    const buffEndTime = buff.endTime || buff.expiresAt
    if (buffEndTime && buffEndTime <= now) {
      expiredBuffs.push(buff)
    }
  }

  // 移除过期的BUFF
  for (const expiredBuff of expiredBuffs) {
    // 从数组中移除（直接操作原始数组）
    const index = rawMemberData.activeBuffs.indexOf(expiredBuff)
    if (index > -1) {
      rawMemberData.activeBuffs.splice(index, 1)
    }

    // 重新计算角色属性（移除 BUFF 效果）
    recalculateMemberStats(rawMemberData)
  }
}

/**
 * 获取角色剩余的BUFF时间（秒）
 * @param {Object} buff - BUFF对象
 * @returns {number} 剩余秒数
 */
const getBuffRemainingTime = (buff) => {
  if (!buff || !buff.endTime) return 0
  const remaining = Math.ceil((buff.endTime - Date.now()) / 1000)
  return Math.max(0, remaining)
}

/**
 * 计算技能治疗量（与技能详情面板计算逻辑一致）
 * @param {Object} skill - 技能数据
 * @param {Object} caster - 施法者数据
 * @returns {number} 治疗量
 */
const calculateSkillHealAmount = (skill, caster) => {
  const skillLevel = Number(skill.level ?? skill.proficiencyLevel ?? 1)
  let healAmount = 0

  // 优先使用技能自带的计算函数
  const calculator = typeof skill.healingCalculation === 'function'
    ? skill.healingCalculation
    : typeof skill.calculateHealing === 'function'
      ? skill.calculateHealing
      : null

  if (calculator && caster) {
    try {
      const result = calculator(caster, skillLevel)
      const numeric = Number(result)
      if (Number.isFinite(numeric)) {
        healAmount = numeric
      }
    } catch (error) {
      // 计算失败，使用备用公式
    }
  }

  // 如果计算函数没有返回有效值，使用基础公式
  if (healAmount === 0) {
    const baseHeal = skill.heal || skill.damage || 100
    
    // 检查是否有熟练度效果配置
    const proficiencyEffect = skill.proficiencyEffect || skill.proficiency?.effect
    if (proficiencyEffect) {
      const effectBase = Number(proficiencyEffect.base || 0)
      const increment = Number(proficiencyEffect.increment || 0)
      if (effectBase > 0) {
        healAmount = effectBase + increment * (skillLevel - 1)
      } else {
        healAmount = baseHeal + increment * (skillLevel - 1)
      }
    } else {
      // 使用默认公式：基础治疗 + 等级加成
      healAmount = Math.floor(baseHeal * (1 + skillLevel * 0.1))
    }
  }

  // 应用治疗加成百分比
  const healBonus = Number(caster?.healPercent || 0)
  if (Number.isFinite(healBonus) && healBonus !== 0) {
    const ratio = healBonus > 1 ? healBonus / 100 : healBonus
    healAmount *= 1 + ratio
  }

  return Math.floor(healAmount)
}

/**
 * 使用治疗技能
 */
const useHealSkill = (skill, memberData, memberType, target) => {
  // 先尝试设置冷却（原子操作）
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
  const cooldownSeconds = calculateEffectiveCooldown(skill, memberData)
  if (!setSkillCooldown(memberId, skill.key, cooldownSeconds)) {
    return
  }

const mpCost = skill.manaCost || 0
memberData.currentMana = Math.max(0, (memberData.currentMana || 0) - mpCost)

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(memberData)

// 播放技能音效
  playSkillSound(skill)

  // 计算治疗量（使用与技能详情面板一致的公式）
  const healAmount = calculateSkillHealAmount(skill, memberData)

  // 恢复目标血量
  target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount)

  // 显示治疗数字
  const targetType = target === player.value ? 'player' : `member_${target.slotId}`
  showHealNumberOnTarget(skill, { type: targetType === 'player' ? 'player' : 'teammember', id: targetType, data: target }, healAmount)
}

/**
 * 使用治疗技能给全队
 */
const useHealSkillOnTeam = (skill, memberData, memberType) => {
  // 先尝试设置冷却（原子操作）
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
  const cooldownSeconds = calculateEffectiveCooldown(skill, memberData)
  if (!setSkillCooldown(memberId, skill.key, cooldownSeconds)) {
    return
  }

const mpCost = skill.manaCost || 0
memberData.currentMana = Math.max(0, (memberData.currentMana || 0) - mpCost)

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(memberData)

// 播放技能音效
  playSkillSound(skill)

  // 计算治疗量（使用与技能详情面板一致的公式）
  const healAmount = calculateSkillHealAmount(skill, memberData)

  const allMembers = [player.value, ...teamMembers.value].filter(m => m && m.currentHealth > 0)

  for (const target of allMembers) {
    target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount)
    // 显示治疗数字
    const targetType = target === player.value ? 'player' : `member_${target.slotId}`
    showHealNumberOnTarget(skill, { type: targetType === 'player' ? 'player' : 'teammember', id: targetType, data: target }, healAmount)
  }
}

/**
 * 使用攻击技能对怪物
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 成员数据
 * @param {string} memberType - 成员类型
 * @param {number} targetIndex - 目标怪物索引
 */

/**
 * 对怪物应用Debuff效果（如碎甲、眩晕）
 * @param {Object} monster - 怪物对象
 * @param {Object} skill - 技能对象
 * @param {Object} memberData - 成员数据（用于计算debuff效果）
 * @param {string} memberId - 成员ID
 * @returns {boolean} 是否成功应用debuff
 */
const applyDebuffToMonster = (monster, skill, memberData, memberId) => {
  if (!monster || monster.isDying || monster.currentHealth <= 0) return false
  if (!skill.debuff) return false

  const debuffConfig = skill.debuff
  const effectConfig = debuffConfig.effect || {}

  // 获取技能熟练度等级
  const skillLevel = skill.proficiency?.level || 1

  // 检查debuff触发概率
  let triggerChance = debuffConfig.chance || 100 // 默认100%触发
  // 如果有 calculateDebuffChance 函数，使用它计算概率
  if (typeof skill.calculateDebuffChance === 'function') {
    triggerChance = skill.calculateDebuffChance(skillLevel)
  }
  
  // 随机判定是否触发
  const isTriggered = Math.random() * 100 < triggerChance
  if (!isTriggered) {
    return false // 未触发
  }

  // 计算debuff效果参数
  let defenseReduction = 0
  let damageIncrease = 0
  let duration = effectConfig.baseDuration || effectConfig.duration || 10
  const debuffType = effectConfig.type || debuffConfig.type || 'unknown'

  // 如果技能有 calculateDebuffEffect 函数，使用它计算效果
  if (typeof skill.calculateDebuffEffect === 'function') {
    const debuffEffect = skill.calculateDebuffEffect(skillLevel, memberData)
    defenseReduction = debuffEffect.defenseReduction || 0
    damageIncrease = debuffEffect.damageIncrease || 0
    duration = debuffEffect.duration || duration
  } else {
    // 使用默认值
    defenseReduction = effectConfig.defenseReduction || 0
    damageIncrease = effectConfig.damageIncrease || 0
  }

  // 创建debuff效果对象
  const debuffEffect = {
    id: `${skill.id}_${memberId}`,
    type: debuffType,
    name: skill.name,
    icon: effectConfig.icon || skill.icon || '',
    defenseReduction, // 防御力降低百分比
    damageIncrease, // 承受伤害增加百分比
    duration, // 持续时间（秒）
    startTime: Date.now(),
    endTime: Date.now() + duration * 1000,
    sourceMemberId: memberId,
    skill,
    isStun: debuffType === 'stun' // 眩晕标记
  }

  // 使用怪物ID作为key存储debuff（使用响应式对象精确追踪）
  const monsterKey = monster.id || monster.monsterId || `monster_${Date.now()}_${Math.random()}`
  
  // 获取或创建该怪物的debuff数组
  let debuffList = monsterDebuffsMap.value[monsterKey]
  if (!debuffList) {
    debuffList = []
  }

  // 检查是否已存在相同类型的debuff（同源）
  const existingIndex = debuffList.findIndex(
    d => d.type === debuffType && d.sourceMemberId === memberId
  )

  if (existingIndex > -1) {
    // 刷新已存在的debuff（创建新数组触发响应式更新）
    const newList = [...debuffList]
    newList[existingIndex] = {
      ...newList[existingIndex],
      ...debuffEffect,
      startTime: Date.now(),
      endTime: Date.now() + duration * 1000
    }
    monsterDebuffsMap.value[monsterKey] = newList
    // 触发组件更新（只更新对应怪物的debuff区域）
    triggerDebuffUpdate(monsterKey, newList)
  } else {
    // 添加新debuff（创建新数组触发响应式更新）
    const newList = [...debuffList, debuffEffect]
    monsterDebuffsMap.value[monsterKey] = newList
    // 触发组件更新（只更新对应怪物的debuff区域）
    triggerDebuffUpdate(monsterKey, newList)
  }
}

/**
 * 清理怪物身上过期的debuff效果
 * @param {Object} monster - 怪物对象
 */
const cleanupExpiredDebuffs = (monster) => {
  if (!monster) return
  
  const monsterKey = monster.id || monster.monsterId
  if (!monsterKey) return

  const debuffList = monsterDebuffsMap.value[monsterKey]
  if (!debuffList || debuffList.length === 0) return

  const now = Date.now()
  const validDebuffs = debuffList.filter(debuff => debuff.endTime > now)

  if (validDebuffs.length !== debuffList.length) {
    // 使用新数组触发响应式更新（精确更新该怪物的debuff）
    monsterDebuffsMap.value[monsterKey] = validDebuffs.length > 0 ? validDebuffs : undefined
    // 触发组件更新（只更新对应怪物的debuff区域）
    triggerDebuffUpdate(monsterKey, validDebuffs.length > 0 ? validDebuffs : [])
  }
}

/**
 * 对怪物应用DOT效果
 * @param {Object} monster - 怪物对象
 * @param {Object} skill - 技能对象
 * @param {number} initialDamage - 初始伤害值
 * @param {string} memberId - 成员ID
 * @param {string} memberName - 成员名称
 */
const applyDotEffectToMonster = (monster, skill, initialDamage, memberId, memberName = '') => {
  if (!monster || monster.isDying || monster.currentHealth <= 0) return

  // 支持两种 DOT 配置方式：
  // 1. 直接属性：duration, tickInterval, dotDamage
  // 2. dotEffect 对象：skill.dotEffect.duration, skill.dotEffect.tickInterval, skill.dotEffect.damageRate
  const dotDuration = skill.duration || skill.dotEffect?.duration || 9
  const dotTickInterval = skill.tickInterval || skill.dotEffect?.tickInterval || 1

  // 计算 DOT 每次tick伤害：
  // - 如果有 calculateDotDamage 函数，使用该函数计算
  // - 如果有 dotDamage 属性，使用 dotDamage
  // - 如果有 dotEffect.damageRate，使用 initialDamage * damageRate（damageRate 是每次 tick 的伤害比例）
  // - 默认情况：技能总伤害 / tick 数量
  let dotDamageValue = 0
  const tickCount = Math.floor(dotDuration / dotTickInterval)

  if (skill.dotEffect?.damageRate) {
    // damageRate 是每次 tick 造成的伤害占技能总伤害的比例
    // 例如 damageRate: 1.0 表示每次 tick 造成 100% 的技能总伤害
    dotDamageValue = Math.floor(initialDamage * skill.dotEffect.damageRate)
  } else if (typeof skill.calculateDotDamage === 'function') {
    // 使用技能内置的 DOT 伤害计算函数（需要 player 对象）
    // 注意：此分支仅在无 dotEffect.damageRate 时使用，且需传入正确的 player 对象
    dotDamageValue = skill.calculateDotDamage(initialDamage)
  } else if (skill.dotDamage > 0) {
    dotDamageValue = skill.dotDamage
  } else {
    // 默认情况：将技能总伤害平均分配到每个 tick
    dotDamageValue = Math.floor(initialDamage / tickCount)
  }

  // 创建DOT效果对象
  const dotEffect = {
    name: skill.dotEffect?.name || skill.name,
    damage: dotDamageValue, // DOT每次tick伤害
    duration: dotDuration,
    tickInterval: dotTickInterval,
    startTime: Date.now(),
    nextTickTime: Date.now() + dotTickInterval * 1000,
    ticksRemaining: Math.floor(dotDuration / dotTickInterval),
    icon: skill.icon || '',
    skill,
    sourceMemberId: memberId, // 记录来源成员
    sourceMemberName: '', // 将在调用时设置
    timerId: null
  }

  // 设置成员名称（用于DPS记录）
  dotEffect.sourceMemberName = memberName

  if (!Array.isArray(monster.dotEffects)) {
    monster.dotEffects = []
  }
  monster.dotEffects.push(dotEffect)

  // DOT伤害定时器
  const applyDotDamage = () => {
    // 检查怪物是否还存在且存活
    if (!monster || monster.isDying || monster.currentHealth <= 0) {
      // 清理定时器
      if (dotEffect.timerId) {
        clearTimeout(dotEffect.timerId)
        dotEffect.timerId = null
      }
      // 从怪物身上移除DOT效果
      const dotIndex = monster?.dotEffects?.indexOf(dotEffect)
      if (dotIndex !== undefined && dotIndex > -1) {
        monster.dotEffects.splice(dotIndex, 1)
      }
      return
    }

    // 检查是否还有剩余tick
    if (dotEffect.ticksRemaining <= 0) {
      // DOT效果结束，清理
      if (dotEffect.timerId) {
        clearTimeout(dotEffect.timerId)
        dotEffect.timerId = null
      }
      const dotIndex = monster.dotEffects.indexOf(dotEffect)
      if (dotIndex > -1) {
        monster.dotEffects.splice(dotIndex, 1)
      }
      return
    }

    // 使用已计算好的每次 tick 伤害值
    const dotDamage = dotEffect.damage

    // 应用DOT伤害（使用辅助函数统一处理响应式更新）
    applyDamageToMonster(monster, dotDamage)

    // 记录伤害贡献
    if (!monster.damageContribution) {
      monster.damageContribution = {}
    }
    monster.damageContribution[dotEffect.sourceMemberId] =
      (monster.damageContribution[dotEffect.sourceMemberId] || 0) + dotDamage

    // 记录DPS
    recordDamageForDps(dotEffect.sourceMemberId, dotEffect.sourceMemberName, dotDamage)

    // ========== DOT tick 吸血效果（所有成员均可触发） ==========
    // 根据 sourceMemberId 查找 DOT 来源成员对象
    const dotSourceId = dotEffect.sourceMemberId
    let dotHealTarget = null
    let dotIsPlayer = false
    if (dotSourceId === 'player') {
      dotHealTarget = player.value
      dotIsPlayer = true
    } else if (dotSourceId?.startsWith('member_')) {
      // 从 teamMembers 中查找对应队员
      const slotIdStr = dotSourceId.replace('member_', '')
      const slotId = Number(slotIdStr)
      dotHealTarget = teamMembers.value.find(m => m && m.slotId === slotId) || null
    }
    if (dotHealTarget && dotDamage > 0) {
      const dotHealAmount = applyLifeSteal(dotHealTarget, dotDamage, {
        onPlayerHeal: (data) => {
          // DOT吸血：在攻击者位置显示技能图标 + 治疗数值（统一队列渲染）
          const targetType = dotIsPlayer ? 'player' : 'teammember'
          showHealNumberOnTarget({ icon: dotEffect.icon }, { type: targetType, data: dotHealTarget }, data.amount)
        }
      })
      if (dotHealAmount > 0 && dotIsPlayer) {
        // 仅队长需要持久化保存
        gameStore.player.currentHealth = player.value.currentHealth
        storageService.savePlayerPatch({
          currentHealth: player.value.currentHealth
        })
      }
    }

    // 显示DOT伤害数字（使用技能图标）
    addDamageNumber(monster, dotDamage, false, false, '', dotEffect.icon)

    // 减少剩余tick数
    dotEffect.ticksRemaining--

    // 检查怪物是否死亡
    if (monster.currentHealth <= 0) {
      const monsterIndex = monsters.value.indexOf(monster)
      if (monsterIndex > -1) {
        // 清理定时器
        if (dotEffect.timerId) {
          clearTimeout(dotEffect.timerId)
          dotEffect.timerId = null
        }
        const dotIndex = monster.dotEffects.indexOf(dotEffect)
        if (dotIndex > -1) {
          monster.dotEffects.splice(dotIndex, 1)
        }
        handleMonsterDefeated(monster, monsterIndex)
      }
      return
    }

    // 检查DOT是否结束
    if (dotEffect.ticksRemaining <= 0) {
      // DOT效果结束，从怪物身上移除
      const dotIndex = monster.dotEffects.indexOf(dotEffect)
      if (dotIndex > -1) {
        monster.dotEffects.splice(dotIndex, 1)
      }
      return
    }

    // 继续下一次tick
    dotEffect.timerId = setTimeout(applyDotDamage, dotTickInterval * 1000)
  }

  // 启动第一个DOT tick
  dotEffect.timerId = setTimeout(applyDotDamage, dotTickInterval * 1000)
}

/**
 * 计算技能伤害（对齐主页面 DamageCalculator 逻辑）
 * 计算顺序：技能基础伤害 → 命中判定 → 暴击 → 元素克制 → 等级差 → 防御 → 碎甲增伤 → PVE加成 → 队伍加成
 * @param {Object} skill - 技能对象
 * @param {Object} memberData - 成员数据
 * @param {Object} monster - 怪物对象（用于获取防御力）
 * @param {string} memberId - 成员标识（用于获取攻击力加成）
 * @returns {Object} 包含 baseDamage、isCritical、isMiss 的对象
 */
const calculateSkillDamage = (skill, memberData, monster, memberId = '') => {
  const memberName = memberData?.nickname || '未知'
  const skillName = skill?.name || '未知技能'

  // ========== 1. 命中率判定（对齐主页面 DamageCalculator） ==========
  const hitRate = DamageCalculator.calculateHitRate(memberData)
  const isMiss = Math.random() > hitRate
  if (isMiss) {
    return { baseDamage: 0, isCritical: false, isMiss: true }
  }

  // ========== 2. 暴击判定（使用实际暴击率/暴击伤害） ==========
  const skillCritRate = memberData?.criticalRate ?? memberData?.critRate ?? 0
  const critRoll = Math.random()
  const isCritical = critRoll < skillCritRate
  const critDamageMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
    memberData?.criticalDamage ?? memberData?.critDamage
  )

  // 获取攻击力加成百分比（副本特有机制）
  const attackBonusPercent = memberId ? getMemberAttackBonus(memberId) : 0
  const attackBonusMultiplier = 1 + (attackBonusPercent / 100)

  // ========== 3. 计算技能基础伤害 ==========
  let baseDamage = 0

  // 尝试使用技能的伤害计算函数
  const skillDamageCalculator =
    typeof skill.calculateDamage === 'function'
      ? skill.calculateDamage
      : typeof skill.damageCalculation === 'function'
        ? skill.damageCalculation
        : null

  if (skillDamageCalculator) {
    try {
      // 构建兼容 skills.js 的玩家对象
      const calcPlayer = {
        ...memberData,
        stats: memberData.stats || {
          strength: memberData.strength || 0,
          agility: memberData.agility || 0,
          intelligence: memberData.intelligence || 0,
          constitution: memberData.constitution || 0,
          dexterity: memberData.dexterity || 0,
          stamina: memberData.stamina || 0
        },
        attack: memberData.attack || Math.floor(((memberData.minAttack || 100) + (memberData.maxAttack || 100)) / 2)
      }

      const attempts = [
        [calcPlayer, skill.level || 1],
        [calcPlayer, skill.level || 1, null],
        [calcPlayer, skill]
      ]

      for (const args of attempts) {
        const result = skillDamageCalculator.call(skill, ...args)
        const numeric = Number(result)
        if (Number.isFinite(numeric) && numeric > 0) {
          baseDamage = numeric
          break
        }
      }
    } catch (error) {
      console.warn('[Dungeon] 技能伤害计算出错:', error)
    }
  }

  // 如果计算函数没有返回有效值，使用简化计算
  if (baseDamage === 0) {
    const skillBaseDamage = skill.damage || 0
    const skillMultiplier = skill.damageMultiplier || skill.multiplier || 1.5
    const minAtk = memberData.minAttack || memberData.attack || 100
    const maxAtk = memberData.maxAttack || memberData.attack || 100
    const playerAttack = Math.floor(Math.random() * (maxAtk - minAtk + 1)) + minAtk

    const isSmallBaseDamage = skillBaseDamage > 0 && skillBaseDamage < playerAttack * 0.5

    if (skillBaseDamage > 0 && !isSmallBaseDamage) {
      baseDamage = skillBaseDamage + playerAttack * 0.5
    } else {
      baseDamage = playerAttack * skillMultiplier
    }

    // 添加熟练度加成
    if (skill.proficiency?.effect?.increment) {
      const proficiencyBonus = skill.proficiency.effect.increment * ((skill.proficiencyLevel || 1) - 1)
      baseDamage += proficiencyBonus
    }
  }

  // ========== 4. 应用暴击（对齐主页面：暴击在防御计算之前） ==========
  if (isCritical) {
    baseDamage = (baseDamage * critDamageMultiplier) >> 0
  }

  // ========== 5. 元素克制计算（对齐主页面 DamageCalculator） ==========
  const weapon = memberData?.equipment?.weapon
  const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
  const weaponElement = elementInfo.elementKey || null
  const targetElement = monster?.elementType ?? monster?.element ?? null
  if (weaponElement && targetElement) {
    let elementMultiplier = DamageCalculator.getElementAdvantageMultiplier(weaponElement, targetElement)
    const memberElementAttack = DamageCalculator.getPlayerElementAttackPercent(memberData, weaponElement)
    const bonusAttackPercent = memberElementAttack > 0 ? memberElementAttack : elementInfo.attackPercent
    if (elementMultiplier > 1 && bonusAttackPercent > 0) {
      elementMultiplier += bonusAttackPercent / 100
    }
    baseDamage = (baseDamage * elementMultiplier) >> 0
  }

  // ========== 6. 等级差减伤/增伤（对齐主页面） ==========
  const memberLevel = Number(memberData?.level) || 1
  const monsterLevel = Number(monster?.level) || 1
  const levelDiff = monsterLevel - memberLevel
  if (levelDiff > 0) {
    const reduction = Math.min(levelDiff * 0.05, 0.95)
    baseDamage = Math.max(1, Math.floor(baseDamage * (1 - reduction)))
  } else if (levelDiff < 0) {
    const increase = Math.min(-levelDiff * 0.05, 1.0)
    baseDamage = Math.max(1, Math.floor(baseDamage * (1 + increase)))
  }

  // ========== 7. 减去怪物防御（应用碎甲等防御降低效果） ==========
  let defense = monster?.defense || 0
  cleanupExpiredDebuffs(monster)
  const monsterKey = monster.id || monster.monsterId
  const debuffList = monsterDebuffsMap.value[monsterKey] || []
  if (debuffList.length > 0) {
    let totalDefenseReduction = 0
    for (const debuff of debuffList) {
      if (debuff.defenseReduction && debuff.endTime > Date.now()) {
        totalDefenseReduction += debuff.defenseReduction
      }
    }
    if (totalDefenseReduction > 0) {
      defense = Math.max(0, defense * (1 - Math.min(100, totalDefenseReduction) / 100))
    }
  }
  baseDamage = Math.max(1, baseDamage - defense)

  // ========== 8. 应用承受伤害增加效果（碎甲等，对齐主页面 armorBreak） ==========
  if (debuffList.length > 0) {
    let totalDamageIncrease = 0
    for (const debuff of debuffList) {
      if (debuff.damageIncrease && debuff.endTime > Date.now()) {
        totalDamageIncrease += debuff.damageIncrease
      }
    }
    if (totalDamageIncrease > 0) {
      baseDamage = Math.floor(baseDamage * (1 + totalDamageIncrease / 100))
    }
  }

  // ========== 9. 应用 PVE 伤害加成（对齐主页面） ==========
  const pveDamage = Number(memberData?.pveDamage) || 0
  if (pveDamage > 0) {
    baseDamage = Math.floor(baseDamage * (1 + pveDamage / 100))
  }

  // ========== 10. 应用队伍攻击力加成（副本特有机制） ==========
  baseDamage = Math.floor(baseDamage * attackBonusMultiplier)

  // ========== 11. 圣盾觉醒EX1-攻击力伤害减少 ==========
  // 圣殿骑士圣盾觉醒BUFF持续期间，自身攻击力伤害减少50%
  const shieldAwakeningAdr = getShieldAwakeningAttackDamageReduction(memberData)
  if (shieldAwakeningAdr > 0) {
    baseDamage = Math.max(1, Math.floor(baseDamage * (1 - shieldAwakeningAdr / 100)))
  }

  return { baseDamage, isCritical, isMiss: false }
}

const useAttackSkillOnMonster = (skill, memberData, memberType, targetIndex) => {
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`

  // 先尝试设置冷却（原子操作：如果已有冷却则返回 false）
  // 使用 calculateEffectiveCooldown 应用EX1-CD减少被动加成
  const cooldownSeconds = calculateEffectiveCooldown(skill, memberData)
  const cooldownKey = `${memberId}_${skill.key}`
  const existingCooldown = skillCooldownsMap.get(cooldownKey)
  const now = Date.now()
  
  if (existingCooldown && existingCooldown > now) {
    // 冷却未结束，无法使用技能，改为普通攻击
    executeNormalAttack(memberData, memberType, targetIndex)
    return
  }

  // 设置冷却
  skillCooldownsMap.set(cooldownKey, now + cooldownSeconds * 1000)
  startCooldownTicker()

const mpCost = skill.manaCost || 0
memberData.currentMana = Math.max(0, (memberData.currentMana || 0) - mpCost)

// 检查 mp_maintain BUFF，若激活则恢复MP满值（无敌魔力多效果）
maintainMpIfBuffed(memberData)

// 播放技能音效
  playSkillSound(skill)

  // 触发技能释放动画
  triggerMemberAnimation(memberId, 'skill')

  const isAoe = skill.type === 'aoe'
  const isDot = skill.type === 'dot'
  // 检查技能是否有DOT效果：
  // 1. dot 类型
  // 2. 有 dotDamage 且有 tickInterval
  // 3. 有 dotEffect 对象（AOE+DOT 组合技能）
  const hasDotEffect = isDot || 
    (skill.dotDamage > 0 && skill.tickInterval > 0) ||
    (skill.dotEffect && skill.dotEffect.tickInterval > 0)
  const skillMultiplier = skill.damageMultiplier || skill.multiplier || 1.5

  // AOE技能对所有存活怪物造成伤害
  if (isAoe) {
    const aliveMonsters = monsters.value.filter(m => m && !m.isDying && m.currentHealth > 0)
    if (aliveMonsters.length === 0) {
      return
    }

    let totalDamage = 0
    const memberName = memberType === 'player' ? (player.value?.nickname || '玩家') : (memberData.nickname || '队员')
    const attackerIcon = getMemberAvatarUrl(memberData)
    const skillIcon = skill.icon || ''

    // 性能优化：分帧处理AOE目标，每帧最多处理5个怪物
    const processAoeTargets = (startIndex) => {
      const batchSize = 5
      const endIndex = Math.min(startIndex + batchSize, aliveMonsters.length)

      for (let i = startIndex; i < endIndex; i++) {
        const monster = aliveMonsters[i]
        if (!monster || monster.isDying) continue

        // 使用统一的技能伤害计算函数
        const { baseDamage, isCritical, isMiss } = calculateSkillDamage(skill, memberData, monster, memberId)

        // MISS 处理：显示闪避，跳过该目标
        if (isMiss) {
          addDamageNumber(monster, 0, false, true, attackerIcon, skillIcon)
          continue
        }

        totalDamage += baseDamage

        // 应用伤害（使用辅助函数统一处理响应式更新）
        applyDamageToMonster(monster, baseDamage)

        // 记录伤害贡献
        if (!monster.damageContribution) {
          monster.damageContribution = {}
        }
        monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + baseDamage

        // 记录DPS
        recordDamageForDps(memberId, memberName, baseDamage)

        // 显示伤害数字（AOE技能攻击）
        addDamageNumber(monster, baseDamage, isCritical, false, attackerIcon, skillIcon)

        // 触发武器附加技能（水弹等）
        const monsterIndex = monsters.value.indexOf(monster)
        triggerWeaponSkillEffect(memberData, monster, monsterIndex, 'skillAttack', memberId)

        // 检查怪物死亡
        if (monster.currentHealth <= 0) {
          if (monsterIndex > -1) {
            handleMonsterDefeated(monster, monsterIndex)
            continue // 跳过DOT效果应用，因为怪物已死
          }
        }

        // AOE技能也可能有DOT效果，需要对每个目标应用
        if (hasDotEffect && monster.currentHealth > 0) {
          applyDotEffectToMonster(monster, skill, baseDamage, memberId, memberName)
        }

        // 应用Debuff效果（如碎甲）
        if (skill.debuff && monster.currentHealth > 0) {
          applyDebuffToMonster(monster, skill, memberData, memberId)
        }
      }

      // 如果还有未处理的怪物，继续分帧处理
      if (endIndex < aliveMonsters.length) {
        requestAnimationFrame(() => processAoeTargets(endIndex))
      } else {
        // 所有怪物处理完毕，处理吸血效果
        if (totalDamage > 0) {
          // 吸血目标：队长用 player.value，队员用 memberData
          const healTarget = memberType === 'player' ? player.value : memberData
          const healAmount = applyLifeSteal(healTarget, totalDamage, {
            onPlayerHeal: (data) => {
              // AOE技能吸血：在攻击者位置显示技能图标 + 治疗数值（统一队列渲染）
              const targetType = memberType === 'player' ? 'player' : 'teammember'
              showHealNumberOnTarget({ icon: skill.icon }, { type: targetType, data: memberData }, data.amount)
            }
          })
          if (healAmount > 0 && memberType === 'player') {
            // 仅队长需要持久化保存
            gameStore.player.currentHealth = player.value.currentHealth
            storageService.savePlayerPatch({
              currentHealth: player.value.currentHealth
            })
          }
        }
      }
    }

    // 开始处理AOE目标
    processAoeTargets(0)
  } else if (isDot) {
    // DOT技能处理：造成初始伤害并附加持续伤害效果
    const monster = monsters.value[targetIndex]
    if (!monster || monster.isDying) {
      return
    }

    // 使用统一的技能伤害计算函数
    const { baseDamage, isCritical, isMiss } = calculateSkillDamage(skill, memberData, monster, memberId)

    // MISS 处理：显示闪避，不造成伤害
    if (isMiss) {
      const dotAttackerIcon = getMemberAvatarUrl(memberData)
      const dotSkillIcon = skill.icon || ''
      addDamageNumber(monster, 0, false, true, dotAttackerIcon, dotSkillIcon)
      return
    }

    // 应用初始伤害（使用辅助函数统一处理响应式更新）
    applyDamageToMonster(monster, baseDamage)

    // 记录伤害贡献
    if (!monster.damageContribution) {
      monster.damageContribution = {}
    }
    monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + baseDamage

    // 记录DPS
    const dotMemberName = memberType === 'player' ? (player.value?.nickname || '玩家') : (memberData.nickname || '队员')
    recordDamageForDps(memberId, dotMemberName, baseDamage)

    // 显示初始伤害数字
    const attackerIcon = getMemberAvatarUrl(memberData)
    const skillIcon = skill.icon || ''
    addDamageNumber(monster, baseDamage, isCritical, false, attackerIcon, skillIcon)

    // 触发武器附加技能（水弹等）
    triggerWeaponSkillEffect(memberData, monster, targetIndex, 'skillAttack', memberId)

    // 检查怪物是否死亡
    if (monster.currentHealth <= 0) {
      handleMonsterDefeated(monster, targetIndex)
      return
    }

    // 应用DOT效果
    applyDotEffectToMonster(monster, skill, baseDamage, memberId, dotMemberName)

    // 应用Debuff效果（如碎甲）
    if (skill.debuff) {
      applyDebuffToMonster(monster, skill, memberData, memberId)
    }
  } else {
    // 单体技能只对目标怪物造成伤害
    const monster = monsters.value[targetIndex]
    if (!monster || monster.isDying) {
      return
    }

    // 使用统一的技能伤害计算函数
    const { baseDamage, isCritical, isMiss } = calculateSkillDamage(skill, memberData, monster, memberId)

    // MISS 处理：显示闪避，不造成伤害
    if (isMiss) {
      const singleAttackerIcon = getMemberAvatarUrl(memberData)
      const singleSkillIcon = skill.icon || ''
      addDamageNumber(monster, 0, false, true, singleAttackerIcon, singleSkillIcon)
      return
    }

    // 应用伤害（使用辅助函数统一处理响应式更新）
    applyDamageToMonster(monster, baseDamage)

    // ========== 单体技能吸血效果（所有成员均可触发） ==========
    if (baseDamage > 0) {
      // 吸血目标：队长用 player.value，队员用 memberData
      const healTarget = memberType === 'player' ? player.value : memberData
      const singleHealAmount = applyLifeSteal(healTarget, baseDamage, {
        onPlayerHeal: (data) => {
          // 单体技能吸血：在攻击者位置显示技能图标 + 治疗数值（统一队列渲染）
          const targetType = memberType === 'player' ? 'player' : 'teammember'
          showHealNumberOnTarget({ icon: skill.icon }, { type: targetType, data: memberData }, data.amount)
        }
      })
      if (singleHealAmount > 0 && memberType === 'player') {
        // 仅队长需要持久化保存
        gameStore.player.currentHealth = player.value.currentHealth
        storageService.savePlayerPatch({
          currentHealth: player.value.currentHealth
        })
      }
    }

    // 记录伤害贡献
    if (!monster.damageContribution) {
      monster.damageContribution = {}
    }
    monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + baseDamage

    // 记录DPS
    const singleMemberName = memberType === 'player' ? (player.value?.nickname || '玩家') : (memberData.nickname || '队员')
    recordDamageForDps(memberId, singleMemberName, baseDamage)

    // 显示伤害数字（单体技能攻击）
    const attackerIcon = getMemberAvatarUrl(memberData)
    const skillIcon = skill.icon || ''
    addDamageNumber(monster, baseDamage, isCritical, false, attackerIcon, skillIcon)

    // 触发武器附加技能（水弹等）
    triggerWeaponSkillEffect(memberData, monster, targetIndex, 'skillAttack', memberId)

    // 应用Debuff效果（如碎甲）
    if (skill.debuff && monster.currentHealth > 0) {
      applyDebuffToMonster(monster, skill, memberData, memberId)
    }

    // 检查怪物死亡
    if (monster.currentHealth <= 0) {
      handleMonsterDefeated(monster, targetIndex)
    }
  }
}

/**
 * 触发武器附加技能效果（水弹等）
 * @param {Object} memberData - 成员数据
 * @param {Object} monster - 怪物对象
 * @param {number} targetIndex - 目标索引
 * @param {string} triggerType - 触发类型 'normalAttack' | 'skillAttack'
 * @param {string} memberId - 成员唯一标识（用于记录伤害贡献）
 */
const triggerWeaponSkillEffect = (memberData, monster, targetIndex, triggerType, memberId) => {
  // 获取成员武器
  const weapon = memberData?.equipment?.weapon
  if (!weapon || weapon.rarity !== 'ultimate') {
    return
  }

  // 提取武器技能触发配置
  const triggers = extractWeaponSkillTriggers(weapon)
  if (triggers.length === 0) {
    return
  }

  // 遍历所有技能触发配置
  for (const trigger of triggers) {
    const { skillId, chance } = trigger

    // 检查是否触发（概率判定）
    if (!shouldTriggerWeaponSkill(chance)) {
      continue
    }

    // 获取技能配置
    const skillConfig = getWeaponSkillConfig(skillId)
    if (!skillConfig) {
      continue
    }

    // 计算技能伤害
    const damage = calculateWeaponSkillDamage(skillConfig, memberData, monster)
    if (damage <= 0) {
      continue
    }

    // 应用伤害到怪物（使用辅助函数统一处理响应式更新）
    applyDamageToMonster(monster, damage)

    // 记录伤害贡献
    if (!monster.damageContribution) {
      monster.damageContribution = {}
    }
    monster.damageContribution[memberId || 'player'] = (monster.damageContribution[memberId || 'player'] || 0) + damage

    // 显示水弹伤害数字（格式：成员头像 + 水弹图标 + 伤害值）
    const attackerIcon = getMemberAvatarUrl(memberData)
    const skillIcon = skillConfig.icon || ''
    addDamageNumber(monster, damage, false, false, attackerIcon, skillIcon, '')

    // 播放水弹音效
    if (skillConfig.audio && audioService) {
      audioService.playSFX(skillConfig.audio)
    }
  }
}

/**
 * 从武器属性中提取技能触发配置
 * @param {Object} weapon - 武器对象
 * @returns {Array<Object>} 技能触发配置数组
 */
const extractWeaponSkillTriggers = (weapon) => {
  if (!weapon || !weapon.abilities || !Array.isArray(weapon.abilities)) {
    return []
  }

  const triggers = []

  for (const ability of weapon.abilities) {
    if (ability.parameter === 'skillchance' && ability.skill) {
      // 优先使用 currentAdd（洗练后的值），否则使用 add
      const chance = ability.currentAdd !== undefined ? ability.currentAdd : (ability.add || 0)
      triggers.push({
        skillId: ability.skill,
        skillLevel: ability.skillLevel || 1,
        chance: chance,
        chanceMax: ability.addMax || chance,
        pvp: ability.pvp !== false,
        pve: ability.pve !== false
      })
    }
  }

  return triggers
}

/**
 * 检查是否应该触发武器技能
 * @param {number} chance - 触发概率（百分比）
 * @returns {boolean} 是否触发
 */
const shouldTriggerWeaponSkill = (chance) => {
  if (!Number.isFinite(chance) || chance <= 0) {
    return false
  }
  // 将百分比转换为小数概率
  const probability = chance / 100
  return Math.random() < probability
}

/**
 * 获取武器技能配置
 * @param {number} skillId - 技能ID
 * @returns {Object|null} 技能配置
 */
const getWeaponSkillConfig = (skillId) => {
  // 从 COMMON_SKILLS 中查找
  for (const key of Object.keys(COMMON_SKILLS)) {
    const skill = COMMON_SKILLS[key]
    if (skill.id === skillId) {
      return skill
    }
  }
  return null
}

/**
 * 计算武器技能伤害（对齐主页面 DamageCalculator 逻辑）
 * @param {Object} skillConfig - 技能配置
 * @param {Object} playerData - 玩家对象
 * @param {Object} monster - 怪物对象
 * @returns {number} 伤害值
 */
const calculateWeaponSkillDamage = (skillConfig, playerData, monster) => {
  if (!skillConfig || typeof skillConfig.calculateDamage !== 'function') {
    return 0
  }

  try {
    let damage = skillConfig.calculateDamage(playerData, 1)
    if (!Number.isFinite(damage) || damage <= 0) return 0

    // 暴击判定（使用实际暴击率/暴击伤害）
    const critRate = playerData?.criticalRate ?? playerData?.critRate ?? 0
    const isCritical = Math.random() < critRate
    if (isCritical) {
      const critMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
        playerData?.criticalDamage ?? playerData?.critDamage
      )
      damage = (damage * critMultiplier) >> 0
    }

    // 元素克制计算
    const weapon = playerData?.equipment?.weapon
    const elementInfo = DamageCalculator.resolveWeaponElementInfo(weapon)
    const weaponElement = elementInfo.elementKey || null
    const targetElement = monster?.elementType ?? monster?.element ?? null
    if (weaponElement && targetElement) {
      let elementMultiplier = DamageCalculator.getElementAdvantageMultiplier(weaponElement, targetElement)
      const elementAttack = DamageCalculator.getPlayerElementAttackPercent(playerData, weaponElement)
      const bonusPercent = elementAttack > 0 ? elementAttack : elementInfo.attackPercent
      if (elementMultiplier > 1 && bonusPercent > 0) {
        elementMultiplier += bonusPercent / 100
      }
      damage = (damage * elementMultiplier) >> 0
    }

    // 等级差减伤/增伤
    const playerLevel = Number(playerData?.level) || 1
    const monsterLevel = Number(monster?.level) || 1
    const levelDiff = monsterLevel - playerLevel
    if (levelDiff > 0) {
      const reduction = Math.min(levelDiff * 0.05, 0.95)
      damage = Math.max(1, Math.floor(damage * (1 - reduction)))
    } else if (levelDiff < 0) {
      const increase = Math.min(-levelDiff * 0.05, 1.0)
      damage = Math.max(1, Math.floor(damage * (1 + increase)))
    }

    // 减去怪物防御
    const monsterDefense = Number(monster?.defense) || 0
    damage = Math.max(1, damage - monsterDefense)

    // PVE 伤害加成
    const pveDamage = Number(playerData?.pveDamage) || 0
    if (pveDamage > 0) {
      damage = Math.floor(damage * (1 + pveDamage / 100))
    }

    return damage
  } catch (error) {
    console.error('[Dungeon] 计算武器技能伤害失败:', error)
    return 0
  }
}

/**
 * 执行普通攻击
 */
const executeNormalAttack = (memberData, memberType, targetIndex) => {
  const monster = monsters.value[targetIndex]
  if (!monster || monster.isDying) {
    return
  }

  // 获取成员唯一标识（用于记录伤害贡献）
  const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
  const memberName = memberData.nickname || (memberType === 'player' ? '玩家' : `队员${memberData.slotId}`)

  // 触发普通攻击动画
  triggerMemberAnimation(memberType === 'player' ? 'player' : `member_${memberData.slotId}`, 'attack')

  // 播放玩家攻击音效（仅队长，每秒最多一次）
  if (memberType === 'player') {
    playPlayerAttackSound()
  }

  // ========== 1. 检查并触发骑士的双倍惩戒被动技能（只有玩家触发） ==========
  if (memberType === 'player' && memberData.class === 'knight') {
    checkAndTriggerDoubleJudgment(memberData, monsters.value)
  }

  // ========== 2. 使用 DamageCalculator 计算伤害（对齐主页面逻辑） ==========
  const result = DamageCalculator.calculatePlayerDamage(memberData, monster)
  let { damage, isCritical, isMiss } = result

  // 应用队伍攻击力加成（副本特有机制）
  const attackBonusPercent = getMemberAttackBonus(memberId)
  if (attackBonusPercent > 0) {
    damage = Math.floor(damage * (1 + attackBonusPercent / 100))
  }

  // 圣盾觉醒EX1-攻击力伤害减少（BUFF持续期间自身攻击力伤害降低50%）
  const shieldAwakeningAdr = getShieldAwakeningAttackDamageReduction(memberData)
  if (shieldAwakeningAdr > 0) {
    damage = Math.max(1, Math.floor(damage * (1 - shieldAwakeningAdr / 100)))
  }

  // MISS 处理：显示闪避，不造成伤害
  if (isMiss) {
    const missAttackerIcon = getMemberAvatarUrl(memberData)
    const missWeaponIcon = getMemberWeaponIcon(memberData)
    addDamageNumber(monster, 0, false, true, missAttackerIcon, '', missWeaponIcon)
    return
  }

  // ========== 3. 检查并消耗双倍惩戒DEBUFF（伤害翻倍） ==========
  let doubleJudgmentConsumed = false
  if (monster.doubleJudgmentDebuff && monster.doubleJudgmentDebuff.active) {
    const now = Date.now()
    // 检查是否过期
    if (monster.doubleJudgmentDebuff.expiresAt && now <= monster.doubleJudgmentDebuff.expiresAt) {
      // 应用双倍伤害
      const damageMultiplier = monster.doubleJudgmentDebuff.damageMultiplier || 2
      damage = Math.floor(damage * damageMultiplier)
      doubleJudgmentConsumed = true
      
      // 消耗DEBUFF（击中后消失）
      monster.doubleJudgmentDebuff = {
        ...monster.doubleJudgmentDebuff,
        active: false
      }
      
      // 同步更新到store
      try {
        const targetIndex = monstersStore.currentMonsters.findIndex(
          m => m && (m.id === monster.id || m === monster)
        )
        if (targetIndex >= 0) {
          monstersStore.applyDebuffBatchUpdates([{
            index: targetIndex,
            debuffType: 'doubleJudgment',
            debuffData: {
              ...monster.doubleJudgmentDebuff,
              active: false
            }
          }])
        }
      } catch (storeError) {
        console.error('[Dungeon] 更新双倍惩戒DEBUFF状态失败:', storeError)
      }
      
      addBattleLog('双倍惩戒触发！伤害翻倍！', '#9c27b0')
    } else {
      // DEBUFF已过期，清除
      monster.doubleJudgmentDebuff = null
    }
  }

  // ========== 4. 应用伤害 ==========
  applyDamageToMonster(monster, damage)

  // ========== 4.1 吸血效果（所有成员均可触发） ==========
  if (damage > 0) {
    // 获取武器图标（用于普通攻击吸血显示）
    const weaponIcon = getMemberWeaponIcon(memberData)
    // 吸血目标：队长用 player.value，队员用 memberData
    const healTarget = memberType === 'player' ? player.value : memberData
    const healAmount = applyLifeSteal(healTarget, damage, {
      onPlayerHeal: (data) => {
        // 普通攻击吸血：在攻击者位置显示武器图标 + 治疗数值（统一队列渲染）
        const targetType = memberType === 'player' ? 'player' : 'teammember'
        showHealNumberOnTarget({ icon: weaponIcon }, { type: targetType, data: memberData }, data.amount)
      }
    })
    if (healAmount > 0 && memberType === 'player') {
      // 仅队长需要持久化保存
      gameStore.player.currentHealth = player.value.currentHealth
      storageService.savePlayerPatch({
        currentHealth: player.value.currentHealth
      })
    }
  }

  // 记录伤害贡献
  if (!monster.damageContribution) {
    monster.damageContribution = {}
  }
  monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + damage

  // 记录DPS
  recordDamageForDps(memberId, memberName, damage)

  // ========== 5. 显示伤害数字 ==========
  const attackerIcon = getMemberAvatarUrl(memberData)
  const weaponIcon = getMemberWeaponIcon(memberData)
  // 传递双倍惩戒标记
  addDamageNumber(monster, damage, isCritical, false, attackerIcon, '', weaponIcon, doubleJudgmentConsumed)

  // 播放普通攻击音效（传递暴击参数）
  playAttackSound(memberData, isCritical)

  // 触发武器附加技能（水弹等）- 所有队伍成员都可触发
  triggerWeaponSkillEffect(memberData, monster, targetIndex, 'normalAttack', memberId)

  // 武器精通类技能熟练度计数：普通攻击命中后累计计数（仅队长，避免修改队友技能数据）
  if (memberType === 'player') {
    trackMasteryAttack(memberData)
  }

  // ========== 龙之劲被动：格斗宗师J技能，普通攻击累计劲力值，达到阈值触发附加伤害 ==========
  if (memberData.class === 'combat_master' && isDragonForceUnlocked(memberData) && monster.currentHealth > 0) {
    const baseAttack = Number(memberData.attack || 0)
    const dragonForceResult = processDragonForceOnAttack(memberData, baseAttack)

    // 消耗MP
    if (dragonForceResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - dragonForceResult.mpConsumed)
    }

    // 触发附加伤害
    if (dragonForceResult.triggered && dragonForceResult.bonusDamage > 0) {
      applyDamageToMonster(monster, dragonForceResult.bonusDamage)

      // 记录伤害贡献
      if (!monster.damageContribution) {
        monster.damageContribution = {}
      }
      monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + dragonForceResult.bonusDamage

      // 显示龙之劲附加伤害数字
      const attackerIcon = getMemberAvatarUrl(memberData)
      const dragonForceIcon = '/pt/skill_icon/longjin.png'

      // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
      let dragonForceText = null
      if (dragonForceResult.multiAttackBonus > 0) {
        const multiplier = (dragonForceResult.multiAttackBonus / 100).toFixed(1)
        dragonForceText = `+${dragonForceResult.bonusDamage}*${multiplier}倍`
      }
      addDamageNumber(monster, dragonForceResult.bonusDamage, false, false, attackerIcon, dragonForceIcon, '', false, false, dragonForceText)

      // 添加战斗日志
      const totalPercent = dragonForceResult.bonusPercent + dragonForceResult.multiAttackBonus
      if (dragonForceResult.multiAttackBonus > 0) {
        addBattleLog(`龙之劲触发！附加${totalPercent}%攻击力伤害！`, '#e74c3c')
      } else {
        addBattleLog(`龙之劲触发！附加${dragonForceResult.bonusPercent}%攻击力伤害！`, '#e74c3c')
      }
    }
  }

  // ========== 影之怨被动：暗夜主宰J技能，普通攻击累计影怨值，达到阈值触发附加伤害 ==========
  if (memberData.class === 'joker_emperor' && isShadowGrudgeUnlocked(memberData) && monster.currentHealth > 0) {
    const baseAttack = Number(memberData.attack || 0)
    const shadowGrudgeResult = processShadowGrudgeOnAttack(memberData, baseAttack)

    // 消耗MP
    if (shadowGrudgeResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - shadowGrudgeResult.mpConsumed)
    }

    // 触发附加伤害
    if (shadowGrudgeResult.triggered && shadowGrudgeResult.bonusDamage > 0) {
      applyDamageToMonster(monster, shadowGrudgeResult.bonusDamage)

      // 记录伤害贡献
      if (!monster.damageContribution) {
        monster.damageContribution = {}
      }
      monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + shadowGrudgeResult.bonusDamage

      // 显示影之怨附加伤害数字
      const attackerIcon = getMemberAvatarUrl(memberData)
      const shadowGrudgeIcon = '/pt/skill_icon/shadowgrudge.png'

      // 倍攻触发时使用自定义显示格式：+伤害*倍率倍
      let shadowGrudgeText = null
      if (shadowGrudgeResult.multiAttackBonus > 0) {
        const multiplier = (shadowGrudgeResult.multiAttackBonus / 100).toFixed(1)
        shadowGrudgeText = `+${shadowGrudgeResult.bonusDamage}*${multiplier}倍`
      }
      addDamageNumber(monster, shadowGrudgeResult.bonusDamage, false, false, attackerIcon, shadowGrudgeIcon, '', false, false, shadowGrudgeText)

      // 添加战斗日志
      const totalPercent = shadowGrudgeResult.bonusPercent + shadowGrudgeResult.multiAttackBonus
      if (shadowGrudgeResult.multiAttackBonus > 0) {
        addBattleLog(`影之怨触发！附加${totalPercent}%攻击力伤害！`, '#9b59b6')
      } else {
        addBattleLog(`影之怨触发！附加${shadowGrudgeResult.bonusPercent}%攻击力伤害！`, '#9b59b6')
      }
    }
  }

  // ========== 圣光积累被动：炽天使J技能，普通攻击累计圣光值，达到阈值触发治疗 ==========
  if (memberData.class === 'nature_messenger' && isHolyAccumulationUnlocked(memberData)) {
    const baseAttack = Number(memberData.attack || 0)
    const holyResult = processHolyAccumulationOnAttack(memberData, baseAttack)

    // 消耗MP
    if (holyResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - holyResult.mpConsumed)
    }

    // 触发治疗
    if (holyResult.triggered && holyResult.healAmount > 0) {
      console.log('[圣光积累-DEBUG][Dungeon-普通攻击] 治疗已触发，开始应用:', {
        成员类型: memberType,
        治疗目标: holyResult.targetType,
        治疗量: holyResult.healAmount,
        治疗百分比: holyResult.healPercent,
        倍攻加成: holyResult.multiHealBonus
      })

      if (holyResult.targetType === 'self') {
        // 基础效果：仅恢复自身
        if (memberType === 'player') {
          if (player.value && player.value.currentHealth > 0) {
            const beforeHP = player.value.currentHealth
            player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
            console.log('[圣光积累-DEBUG][Dungeon-普通攻击] 玩家自身治疗:', { 治疗前: beforeHP, 治疗后: player.value.currentHealth, 最大生命: player.value.maxHealth })
          }
        } else {
          if (memberData.currentHealth > 0) {
            const beforeHP = memberData.currentHealth
            memberData.currentHealth = Math.min(memberData.maxHealth, memberData.currentHealth + holyResult.healAmount)
            console.log('[圣光积累-DEBUG][Dungeon-普通攻击] 队友自身治疗:', { 治疗前: beforeHP, 治疗后: memberData.currentHealth, 最大生命: memberData.maxHealth })
          }
        }
        addBattleLog(`圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
      } else {
        // EX效果：恢复所有队员最大生命值
        if (player.value && player.value.currentHealth > 0) {
          const beforeHP = player.value.currentHealth
          player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
          console.log('[圣光积累-DEBUG][Dungeon-普通攻击] 全队治疗-玩家:', { 治疗前: beforeHP, 治疗后: player.value.currentHealth })
        }
        const memberCount = teamMembers.value.length
        let healedCount = 0
        teamMembers.value.forEach((member) => {
          if (member.currentHealth > 0) {
            const beforeHP = member.currentHealth
            member.currentHealth = Math.min(member.maxHealth, member.currentHealth + holyResult.healAmount)
            healedCount++
          }
        })
        console.log(`[圣光积累-DEBUG][Dungeon-普通攻击] 全队治疗-队友: ${healedCount}/${memberCount} 人受到治疗`)

        const totalPercent = holyResult.healPercent + holyResult.multiHealBonus
        if (holyResult.multiHealBonus > 0) {
          addBattleLog(`圣光积累触发！全队恢复${totalPercent}%攻击力生命值！`, '#f1c40f')
        } else {
          addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
        }
      }
    } else {
      console.log('[圣光积累-DEBUG][Dungeon-普通攻击] 未触发治疗:', { 触发: holyResult.triggered, 治疗量: holyResult.healAmount, 圣光值: holyResult.holyValue })
    }
  }

  // ========== 风之积累被动：风暴行者J技能，普通攻击累计风之值，达到阈值触发附加伤害 ==========
  if (memberData.class === 'storm_walker' && isWindAccumulationUnlocked(memberData) && monster.currentHealth > 0) {
    const baseAttack = Number(memberData.attack || 0)
    const windResult = processWindAccumulationOnAttack(memberData, baseAttack)

    // 消耗MP
    if (windResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - windResult.mpConsumed)
    }

    // 触发附加伤害
    if (windResult.triggered && windResult.damageAmount > 0) {
      applyDamageToMonster(monster, windResult.damageAmount)

      // 记录伤害贡献
      if (!monster.damageContribution) {
        monster.damageContribution = {}
      }
      monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + windResult.damageAmount

      // 显示风之积累附加伤害数字
      const windIcon = '/pt/skill_icon/kuangfengjueren.png'
      let windText = null
      if (windResult.multiAttackBonus > 0) {
        const multiplier = (windResult.multiAttackBonus / 100).toFixed(1)
        windText = `+${windResult.damageAmount}*${multiplier}倍`
      }
      addDamageNumber(monster, windResult.damageAmount, false, false, attackerIcon, windIcon, '', false, false, windText)

      // 添加战斗日志
      const totalPercent = windResult.damagePercent + windResult.multiAttackBonus
      if (windResult.multiAttackBonus > 0) {
        addBattleLog(`风之积累触发！附加${totalPercent}%攻击力风属性伤害！`, '#2ecc71')
      } else {
        addBattleLog(`风之积累触发！附加${windResult.damagePercent}%攻击力风属性伤害！`, '#2ecc71')
      }
    }
  }

  // ========== 裁决积累被动：圣殿骑士J技能，普通攻击累计裁决值，达到阈值触发附加伤害 ==========
  if (memberData.class === 'holy_knight' && isJudgmentAccumulationUnlocked(memberData) && monster.currentHealth > 0) {
    const baseAttack = Number(memberData.attack || 0)
    const judgmentResult = processJudgmentAccumulationOnAttack(memberData, baseAttack)

    // 消耗MP
    if (judgmentResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - judgmentResult.mpConsumed)
    }

    // 触发附加伤害
    if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
      applyDamageToMonster(monster, judgmentResult.damageAmount)

      // 记录伤害贡献
      if (!monster.damageContribution) {
        monster.damageContribution = {}
      }
      monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + judgmentResult.damageAmount

      // 显示裁决积累附加伤害数字
      const judgmentIcon = '/pt/skill_icon/caijuejilei.png'
      let judgmentText = null
      if (judgmentResult.multiAttackBonus > 0) {
        const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
        judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
      }
      addDamageNumber(monster, judgmentResult.damageAmount, false, false, attackerIcon, judgmentIcon, '', false, false, judgmentText)

      // 添加战斗日志
      const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
      if (judgmentResult.multiAttackBonus > 0) {
        addBattleLog(`裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`, '#e74c3c')
      } else {
        addBattleLog(`裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`, '#e74c3c')
      }
    }
  }

  // ========== 碎思归墟被动：心灵师J技能，普通攻击累计充能值，达到阈值触发附加伤害 ==========
  if (memberData.class === 'mind_master' && isMindChargeUnlocked(memberData) && monster.currentHealth > 0) {
    const playerMaxMana = Number(memberData.maxMana || 0)
    const mindChargeResult = processMindChargeOnAttack(memberData, playerMaxMana)

    // 消耗MP
    if (mindChargeResult.mpConsumed > 0) {
      memberData.currentMana = Math.max(0, memberData.currentMana - mindChargeResult.mpConsumed)
    }

    // 触发附加伤害
    if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
      // 应用附加伤害到怪物
      monster.currentHealth = Math.max(0, monster.currentHealth - mindChargeResult.damageAmount)
      monster.healthPercentage = (monster.currentHealth / monster.maxHealth) * 100

      // 显示碎思归墟附加伤害数字
      const mindChargeSkill = getSkill('mind_master', 'J')
      const mindChargeIcon = mindChargeSkill?.icon || '/pt/skill_icon/suisiguixu.png'
      let mindChargeText = null
      if (mindChargeResult.multiAttackBonus > 0) {
        const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
        mindChargeText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
      }
      addDamageNumber(monster, mindChargeResult.damageAmount, false, false, attackerIcon, mindChargeIcon, '', false, false, mindChargeText)

      // 添加战斗日志
      const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
      if (mindChargeResult.multiAttackBonus > 0) {
        addBattleLog(`碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`, '#9c27b0')
      } else {
        addBattleLog(`碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`, '#9c27b0')
      }
    }
  }

  // ========== 6. 双刀流被动：攻击时概率触发副手普通攻击 ==========
  if (monster.currentHealth > 0) {
    performDungeonOffhandAttack(memberData, memberType, monster)
  }

  // 检查怪物死亡
  if (monster.currentHealth <= 0) {
    handleMonsterDefeated(monster, targetIndex)
  }
}

/**
 * 为队友自动使用恢复物品（使用统一服务）
 * @param {Object} memberData - 成员数据
 * @param {Array} bag - 成员背包数据
 * @returns {boolean} 是否使用了恢复物品
 */
const autoUseRecoveryItemForMember = (memberData, bag) => {
  if (!memberData || !bag || !Array.isArray(bag)) return false

  // 使用统一的AutoRecoveryService
  const service = getAutoRecoveryService()

  // 使用服务进行恢复
  const result = service.recoverForMember(memberData, bag, {
    autoHpRecoveryPercent: 50,
    autoMpRecoveryPercent: 50
  })

  return result.hpRecovered > 0 || result.mpRecovered > 0
}

/**
 * 执行单个成员的战斗行动
 * @description 使用共享的职业化技能优先级决策逻辑，与主页面策略一致
 * @param {Object} memberData - 成员数据
 * @param {string} memberType - 成员类型 'player' | 'teammember'
 * @param {number} targetIndex - 目标怪物索引
 */
const executeMemberAction = (memberData, memberType, targetIndex) => {
  const memberName = memberData?.nickname || '未知'

  if (!memberData || memberData.currentHealth <= 0) {
    return
  }

  // ========== 守护使者特殊处理：在攻击前检测神圣之光复活 ==========
  if (isGuardianClass(memberData.class)) {
    checkAndTriggerHolyLightForGuardian(memberData, memberType)
  }

  // 队友自动恢复物品使用（检查是否有自动恢复buff）
  if (memberType === 'teammember' && memberData.bag) {
    autoUseRecoveryItemForMember(memberData, memberData.bag)
  }

  // 获取该成员的技能列表
  const memberSkills = getMemberSkillsForBattle(memberData)

  if (!memberSkills || memberSkills.length === 0) {
    // 没有技能，执行普通攻击
    executeNormalAttack(memberData, memberType, targetIndex)
    return
  }

  // 使用共享的职业化技能优先级决策函数，确保与主页面策略一致
  const classCategory = getClassCategory(memberData.class)
  const monsterCount = monsters.value.filter(m => m && !m.isDying && m.currentHealth > 0).length
  const healthPercent = memberData.currentHealth / memberData.maxHealth

  // 获取恢复阈值（使用自动战斗配置中的 recoveryThreshold，与主页面保持一致）
  const autoBattleRecoveryThreshold = Number(autoBattleStore.config?.recoveryThreshold) || 0.8
  const recoveryThreshold = autoBattleRecoveryThreshold

  // 检查队友是否需要治疗（副本场景：自身或任何队友/队长低于阈值都需要治疗）
  const allMembers = [player.value, ...teamMembers.value]
  const teamNeedsHeal = allMembers.some(
    m => m && m.currentHealth > 0 && (m.currentHealth / m.maxHealth) < recoveryThreshold
  )

  const priority = getSkillActionPriority(
    classCategory,
    monsterCount,
    healthPercent,
    recoveryThreshold,
    teamNeedsHeal
  )

  // 按优先级依次尝试释放对应类型的技能
  for (const actionType of priority) {
    let selectedSkill = null
    let shouldReturn = false

    switch (actionType) {
      case SKILL_ACTION_TYPE.HEAL:
        selectedSkill = findAvailableSkill(memberSkills, 'heal', memberData)
        if (selectedSkill) {
          // 检查是否有需要治疗的队友（基于恢复阈值）
          const healTarget = findHealTarget(memberData, recoveryThreshold)
          if (healTarget) {
            if (selectedSkill.isTeamHeal) {
              // 群体治疗技能：治疗所有受伤的队友
              useHealSkillOnTeam(selectedSkill, memberData, memberType)
            } else {
              // 单体治疗技能：治疗自己或目标
              useHealSkill(selectedSkill, memberData, memberType, healTarget)
            }
            shouldReturn = true
          }
        }
        break

      case SKILL_ACTION_TYPE.BUFF:
        selectedSkill = findAvailableSkill(memberSkills, 'buff', memberData)
        if (selectedSkill) {
          // 检查是否需要释放buff（群体BUFF检查全队，单体BUFF检查自己）
          const needsBuff = selectedSkill.isTeamBuff ? teamNeedsBuff(selectedSkill) : !hasActiveBuff(memberData, selectedSkill)
          if (needsBuff) {
            if (selectedSkill.isTeamBuff) {
              // 群体BUFF技能：给所有队友释放BUFF
              useBuffSkillOnTeam(selectedSkill, memberData, memberType)
            } else {
              // 单体BUFF技能：给自己释放BUFF
              useBuffSkillOnSelf(selectedSkill, memberData, memberType)
            }
            shouldReturn = true
          }
        }
        break

      case SKILL_ACTION_TYPE.DEBUFF:
        selectedSkill = findAvailableSkill(memberSkills, 'debuff', memberData)
        if (selectedSkill) {
          useAttackSkillOnMonster(selectedSkill, memberData, memberType, targetIndex)
          shouldReturn = true
        }
        break

      case SKILL_ACTION_TYPE.AOE:
        selectedSkill = findAvailableSkill(memberSkills, 'aoe', memberData)
        if (selectedSkill) {
          useAttackSkillOnMonster(selectedSkill, memberData, memberType, targetIndex)
          shouldReturn = true
        }
        break

      case SKILL_ACTION_TYPE.SINGLE: {
        // 单体攻击技能（包括 single, dot, debuff 类型）
        const availableDamageSkills = findAllAvailableDamageSkills(memberSkills, memberData)
        if (availableDamageSkills.length > 0) {
          for (const skill of availableDamageSkills) {
            // 检查技能是否在冷却中（可能在上一个技能使用后进入冷却）
            const memberId = getMemberId(memberData)
            if (isSkillOnCooldown(memberId, skill.key)) {
              continue
            }
            // 优先使用单体技能（排除AOE）
            const skillType = String(skill.type || '').toLowerCase()
            if (skillType === 'aoe') continue

            useAttackSkillOnMonster(skill, memberData, memberType, targetIndex)
            shouldReturn = true
            break
          }
        }
        break
      }

      case SKILL_ACTION_TYPE.SUMMON:
        selectedSkill = findAvailableSkill(memberSkills, 'summon', memberData)
        if (selectedSkill) {
          useAttackSkillOnMonster(selectedSkill, memberData, memberType, targetIndex)
          shouldReturn = true
        }
        break

      default:
        break
    }

    // 技能释放后处理圣光积累（炽天使J技能：每次释放技能增加1点圣光值）
    if (shouldReturn && memberData.class === 'nature_messenger' && isHolyAccumulationUnlocked(memberData)) {
      const skillAttack = Number(memberData.attack || 0)
      const holyResult = processHolyAccumulationOnSkillCast(memberData, skillAttack)

      if (holyResult.triggered && holyResult.healAmount > 0) {
        console.log('[圣光积累-DEBUG][Dungeon-队友技能] 治疗已触发:', {
          成员类型: memberType,
          治疗目标: holyResult.targetType,
          治疗量: holyResult.healAmount,
          治疗百分比: holyResult.healPercent,
          倍攻加成: holyResult.multiHealBonus
        })

        if (holyResult.targetType === 'self') {
          // 基础效果：仅恢复自身
          if (memberType === 'player') {
            if (player.value && player.value.currentHealth > 0) {
              const beforeHP = player.value.currentHealth
              player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
              console.log('[圣光积累-DEBUG][Dungeon-队友技能] 玩家自身治疗:', { 治疗前: beforeHP, 治疗后: player.value.currentHealth })
            }
          } else {
            if (memberData.currentHealth > 0) {
              const beforeHP = memberData.currentHealth
              memberData.currentHealth = Math.min(memberData.maxHealth, memberData.currentHealth + holyResult.healAmount)
              console.log('[圣光积累-DEBUG][Dungeon-队友技能] 队友自身治疗:', { 治疗前: beforeHP, 治疗后: memberData.currentHealth })
            }
          }
          addBattleLog(`圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
        } else {
          // EX效果：恢复所有队员最大生命值
          if (player.value && player.value.currentHealth > 0) {
            const beforeHP = player.value.currentHealth
            player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
            console.log('[圣光积累-DEBUG][Dungeon-队友技能] 全队治疗-玩家:', { 治疗前: beforeHP, 治疗后: player.value.currentHealth })
          }
          let healedCount = 0
          teamMembers.value.forEach((member) => {
            if (member.currentHealth > 0) {
              member.currentHealth = Math.min(member.maxHealth, member.currentHealth + holyResult.healAmount)
              healedCount++
            }
          })
          console.log(`[圣光积累-DEBUG][Dungeon-队友技能] 全队治疗-队友: ${healedCount} 人受到治疗`)

          const totalPercent = holyResult.healPercent + holyResult.multiHealBonus
          if (holyResult.multiHealBonus > 0) {
            addBattleLog(`圣光积累触发！全队恢复${totalPercent}%攻击力生命值！`, '#f1c40f')
          } else {
            addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
          }
        }
      }
    }

    // 技能释放后处理风之积累（风暴行者J技能：每次释放技能增加1点风之值）
    if (shouldReturn && memberData.class === 'storm_walker' && isWindAccumulationUnlocked(memberData)) {
      const skillAttack = Number(memberData.attack || 0)
      const windResult = processWindAccumulationOnSkillCast(memberData, skillAttack)

      // 触发附加伤害
      if (windResult.triggered && windResult.damageAmount > 0) {
        // 找到当前目标怪物（如果还活着）
        const targetMonster = monsters.value.find(m => !m.isDying && m.currentHealth > 0)
        if (targetMonster) {
          applyDamageToMonster(targetMonster, windResult.damageAmount)

          // 记录伤害贡献
          const windMemberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
          if (!targetMonster.damageContribution) {
            targetMonster.damageContribution = {}
          }
          targetMonster.damageContribution[windMemberId] = (targetMonster.damageContribution[windMemberId] || 0) + windResult.damageAmount

          // 显示风之积累附加伤害数字
          const attackerIcon = getMemberAvatarUrl(memberData)
          const windIcon = '/pt/skill_icon/kuangfengjueren.png'
          let windText = null
          if (windResult.multiAttackBonus > 0) {
            const multiplier = (windResult.multiAttackBonus / 100).toFixed(1)
            windText = `+${windResult.damageAmount}*${multiplier}倍`
          }
          addDamageNumber(targetMonster, windResult.damageAmount, false, false, attackerIcon, windIcon, '', false, false, windText)

          // 添加战斗日志
          const totalPercent = windResult.damagePercent + windResult.multiAttackBonus
          if (windResult.multiAttackBonus > 0) {
            addBattleLog(`风之积累触发！附加${totalPercent}%攻击力风属性伤害！`, '#2ecc71')
          } else {
            addBattleLog(`风之积累触发！附加${windResult.damagePercent}%攻击力风属性伤害！`, '#2ecc71')
          }

          // 检查怪物死亡
          if (targetMonster.currentHealth <= 0) {
            handleMonsterDefeated(targetMonster, monsters.value.indexOf(targetMonster))
          }
        }
      }
    }

    // 技能释放后处理裁决积累（圣殿骑士J技能：每次释放技能增加1点裁决值）
    if (shouldReturn && memberData.class === 'holy_knight' && isJudgmentAccumulationUnlocked(memberData)) {
      const skillAttack = Number(memberData.attack || 0)
      const judgmentResult = processJudgmentAccumulationOnSkillCast(memberData, skillAttack)

      // 触发附加伤害
      if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
        // 找到当前目标怪物（如果还活着）
        const targetMonster = monsters.value.find(m => !m.isDying && m.currentHealth > 0)
        if (targetMonster) {
          applyDamageToMonster(targetMonster, judgmentResult.damageAmount)

          // 记录伤害贡献
          const judgmentMemberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
          if (!targetMonster.damageContribution) {
            targetMonster.damageContribution = {}
          }
          targetMonster.damageContribution[judgmentMemberId] = (targetMonster.damageContribution[judgmentMemberId] || 0) + judgmentResult.damageAmount

          // 显示裁决积累附加伤害数字
          const attackerIcon = getMemberAvatarUrl(memberData)
          const judgmentIcon = '/pt/skill_icon/caijuejilei.png'
          let judgmentText = null
          if (judgmentResult.multiAttackBonus > 0) {
            const multiplier = (judgmentResult.multiAttackBonus / 100).toFixed(1)
            judgmentText = `+${judgmentResult.damageAmount}*${multiplier}倍`
          }
          addDamageNumber(targetMonster, judgmentResult.damageAmount, false, false, attackerIcon, judgmentIcon, '', false, false, judgmentText)

          // 添加战斗日志
          const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
          if (judgmentResult.multiAttackBonus > 0) {
            addBattleLog(`裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`, '#e74c3c')
          } else {
            addBattleLog(`裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`, '#e74c3c')
          }

          // 检查怪物死亡
          if (targetMonster.currentHealth <= 0) {
            handleMonsterDefeated(targetMonster, monsters.value.indexOf(targetMonster))
          }
        }
      }
    }

    // 技能释放后处理碎思归墟（心灵师J技能：每次释放技能增加1点充能值）
    if (shouldReturn && memberData.class === 'mind_master' && isMindChargeUnlocked(memberData)) {
      const playerMaxMana = Number(memberData.maxMana || 0)
      const mindChargeResult = processMindChargeOnSkillCast(memberData, playerMaxMana)

      // 触发附加伤害
      if (mindChargeResult.triggered && mindChargeResult.damageAmount > 0) {
        // 找到当前目标怪物（如果还活着）
        const targetMonster = monsters.value.find(m => !m.isDying && m.currentHealth > 0)
        if (targetMonster) {
          applyDamageToMonster(targetMonster, mindChargeResult.damageAmount)

          // 记录伤害贡献
          const mindChargeMemberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
          if (!targetMonster.damageContribution) {
            targetMonster.damageContribution = {}
          }
          targetMonster.damageContribution[mindChargeMemberId] = (targetMonster.damageContribution[mindChargeMemberId] || 0) + mindChargeResult.damageAmount

          // 显示碎思归墟附加伤害数字
          const attackerIcon = getMemberAvatarUrl(memberData)
          const mindChargeIcon = '/pt/skill_icon/suisiguixu.png'
          let mindChargeText = null
          if (mindChargeResult.multiAttackBonus > 0) {
            const multiplier = (mindChargeResult.multiAttackBonus / 100).toFixed(1)
            mindChargeText = `+${mindChargeResult.damageAmount}*${multiplier}倍`
          }
          addDamageNumber(targetMonster, mindChargeResult.damageAmount, false, false, attackerIcon, mindChargeIcon, '', false, false, mindChargeText)

          // 添加战斗日志
          const totalPercent = mindChargeResult.damagePercent + mindChargeResult.multiAttackBonus
          if (mindChargeResult.multiAttackBonus > 0) {
            addBattleLog(`碎思归墟触发！附加${totalPercent}%最大MP精神伤害！`, '#9c27b0')
          } else {
            addBattleLog(`碎思归墟触发！附加${mindChargeResult.damagePercent}%最大MP精神伤害！`, '#9c27b0')
          }

          // 检查怪物死亡
          if (targetMonster.currentHealth <= 0) {
            handleMonsterDefeated(targetMonster, monsters.value.indexOf(targetMonster))
          }
        }
      }
    }

    if (shouldReturn) {
      return
    }
  }

  // 没有可用的技能，执行普通攻击
  executeNormalAttack(memberData, memberType, targetIndex)
}

/**
 * 处理阶段完成
 */
const handleStageComplete = () => {
  currentStageIndex.value++
  currentStageKills.value = 0

  // 显示阶段切换动画
  showStageTransition.value = true

  if (currentStageIndex.value >= dungeonStages.value.length) {
    // 副本完成
    stageTransitionText.value = '🎉 副本通关!'
    
    // 停止DPS追踪
    stopDpsTracking()
    
    setTimeout(() => {
      showStageTransition.value = false
      handleDungeonComplete()
    }, 2000)
  } else {
    // 下一阶段
    const nextStage = dungeonStages.value[currentStageIndex.value]
    stageTransitionText.value = nextStage.isBoss ? '⚠️ Boss出现!' : `第 ${currentStageIndex.value + 1} 阶段`

    setTimeout(() => {
      showStageTransition.value = false
      generateMonsters()
      addBattleLog(`进入第 ${currentStageIndex.value + 1} 阶段：${nextStage.name}`, '#4CAF50')
    }, 1500)
  }
}

/**
 * 处理副本完成
 */
const handleDungeonComplete = () => {
  autoBattle.value = false
  stopAutoBattle()

  // 停止倒计时，防止继续保存进度
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }

  // 新版掉落系统：通关时直接清除存档（掉落物不再需要存档恢复）
  storageService.clearDungeonProgress()

  // 注意：不掉落动画在此清理，玩家可在胜利界面期间继续拾取剩余掉落物
  // 掉落动画在 exitDungeon/cleanup 时统一清理

  // 计算最终奖励
  const baseGold = 1000 * dungeonStages.value.length * dungeonInfo.value.multiplier
  const baseExp = 500 * dungeonStages.value.length * dungeonInfo.value.multiplier
  
  // 应用经验倍率Buff
  const actualExp = calculateActualExperience(baseExp)

  goldReward.value += Math.floor(baseGold)
  expReward.value += Math.floor(actualExp)

  player.value.gold = (player.value.gold || 0) + Math.floor(baseGold)
  gainExp(actualExp)

  // 保存数据
  storageService.savePlayerData(player.value)

  // 直接显示胜利画面
  showVictoryScreen.value = true

  // 副本通关，结束活跃期，立即进入CD期
  const dungeonId = route.params.id || '1'
  finishDungeon(dungeonId)
}

/**
 * 开始倒计时
 * @description 副本数据保存时机：关闭浏览器、刷新浏览器、通关副本、退出副本
 */
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)

  countdownTimer = setInterval(() => {
    // 组件正在卸载时跳过响应式更新，避免 patch 到已销毁的子组件导致 emitsOptions null 报错
    if (isComponentUnmounting.value) return
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    } else {
      handleDungeonTimeout()
    }
  }, 1000)
}

/**
 * 副本超时
 */
const handleDungeonTimeout = async () => {
autoBattle.value = false
stopAutoBattle()
// 清除保存的副本进度
storageService.clearDungeonProgress()
addBattleLog('副本时间结束!', '#ff4444')
// 副本超时，结束活跃期，进入CD期
const dungeonId = route.params.id || '1'
finishDungeon(dungeonId)
// ★ 确保 debouncedSavePlayerData 的待保存数据立即写入
if (savePlayerDataTimer) {
clearTimeout(savePlayerDataTimer)
savePlayerDataTimer = null
try {
storageService.savePlayerData(player.value)
} catch (e) {
console.error('[Dungeon] 超时退出前保存玩家数据失败:', e)
}
}
// ★ 等待数据持久化完成后再跳转
try {
await storageService.flushPendingPatches()
} catch (e) {
console.error('[Dungeon] 超时退出前 flushPendingPatches 失败:', e)
}
router.push('/main')
}

/**
 * 保存副本进度（包含怪物气血、队伍成员数据）
 */
const saveDungeonProgress = () => {
  try {
    // 只在战斗已开始时保存
    if (!isBattleStarted.value) {
      return
    }

    const dungeonData = {
      dungeonId: dungeonInfo.value.id,
      difficulty: dungeonInfo.value.difficulty, // 保存难度，用于恢复时校验
      currentStageIndex: currentStageIndex.value,
      currentStageKills: currentStageKills.value,
      totalKills: totalKills.value,
      remainingSeconds: remainingSeconds.value,
      monsters: monsters.value,
      teamMembers: teamMembers.value,
      player: {
        currentHealth: player.value.currentHealth,
        maxHealth: player.value.maxHealth,
        currentMana: player.value.currentMana,
        maxMana: player.value.maxMana,
        activeBuffs: player.value.activeBuffs || [],
        exp: player.value.exp,
        gold: player.value.gold
      },
      // 保存副本是否已通关
      dungeonCompleted: showVictoryScreen.value
    }

    // 使用 StorageService 保存到存档
    const saved = storageService.saveDungeonProgress(dungeonData)

    // 同时保存玩家数据
    storageService.savePlayerData(player.value)
    
    if (saved) {
      addBattleLog('副本进度已保存', '#2196f3')
    }
  } catch (error) {
    console.error('[Dungeon] 保存进度失败:', error)
  }
}

/**
 * 手动使用技能（预留）
 */
// eslint-disable-next-line no-unused-vars
const useSkill = (skill) => {
  if (autoBattle.value || !skill) return

  const mpCost = skill.mpCost || 0
  if (player.value.currentMana < mpCost) {
    addBattleLog('蓝量不足!', '#ff4444')
    return
  }

  player.value.currentMana -= mpCost
  addBattleLog(`使用技能：${skill.name}`, '#2196f3')

  // 技能伤害（使用统一的 calculateSkillDamage 对齐主页面逻辑）
  monsters.value.forEach(monster => {
    if (!monster.isDying && monster.currentHealth > 0) {
      const { baseDamage: skillDamage, isCritical, isMiss } = calculateSkillDamage(skill, player.value, monster, 'player')

      const skillIcon = skill.icon || ''
      if (isMiss) {
        addDamageNumber(monster, 0, false, true, playerAvatar.value, skillIcon)
        return
      }

      // 应用伤害（使用辅助函数统一处理响应式更新）
      applyDamageToMonster(monster, skillDamage)
      addDamageNumber(monster, skillDamage, isCritical, false, playerAvatar.value, skillIcon)

      if (monster.currentHealth <= 0) {
        handleMonsterDefeated(monster, monsters.value.indexOf(monster))
      }
    }
  })

  // 圣光积累被动：炽天使J技能，每次释放技能增加1点圣光值
  if (player.value.class === 'nature_messenger' && isHolyAccumulationUnlocked(player.value)) {
    const skillAttack = Number(player.value.attack || 0)
    const holyResult = processHolyAccumulationOnSkillCast(player.value, skillAttack)

    if (holyResult.triggered && holyResult.healAmount > 0) {
      if (holyResult.targetType === 'self') {
        // 基础效果：仅恢复自身
        if (player.value.currentHealth > 0) {
          player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
        }
        addBattleLog(`圣光积累触发！恢复自身${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
      } else {
        // EX效果：恢复所有队员最大生命值
        if (player.value.currentHealth > 0) {
          player.value.currentHealth = Math.min(player.value.maxHealth, player.value.currentHealth + holyResult.healAmount)
        }
        teamMembers.value.forEach((member) => {
          if (member.currentHealth > 0) {
            member.currentHealth = Math.min(member.maxHealth, member.currentHealth + holyResult.healAmount)
          }
        })

        const totalPercent = holyResult.healPercent + holyResult.multiHealBonus
        if (holyResult.multiHealBonus > 0) {
          addBattleLog(`圣光积累触发！全队恢复${totalPercent}%攻击力生命值！`, '#f1c40f')
        } else {
          addBattleLog(`圣光积累触发！全队恢复${holyResult.healPercent}%攻击力生命值！`, '#f1c40f')
        }
      }
    }
  }

  // 风之积累被动：风暴行者J技能，每次释放技能增加1点风之值
  if (player.value.class === 'storm_walker' && isWindAccumulationUnlocked(player.value)) {
    const skillAttack = Number(player.value.attack || 0)
    const windResult = processWindAccumulationOnSkillCast(player.value, skillAttack)

    if (windResult.triggered && windResult.damageAmount > 0) {
      // 找到当前目标怪物（如果还活着）
      const targetMonster = monsters.value.find(m => !m.isDying && m.currentHealth > 0)
      if (targetMonster) {
        applyDamageToMonster(targetMonster, windResult.damageAmount)
        addDamageNumber(targetMonster, windResult.damageAmount, false, false, playerAvatar.value, '/pt/skill_icon/kuangfengjueren.png')

        const totalPercent = windResult.damagePercent + windResult.multiAttackBonus
        if (windResult.multiAttackBonus > 0) {
          addBattleLog(`风之积累触发！附加${totalPercent}%攻击力风属性伤害！`, '#2ecc71')
        } else {
          addBattleLog(`风之积累触发！附加${windResult.damagePercent}%攻击力风属性伤害！`, '#2ecc71')
        }

        if (targetMonster.currentHealth <= 0) {
          handleMonsterDefeated(targetMonster, monsters.value.indexOf(targetMonster))
        }
      }
    }
  }

  // 裁决积累被动：圣殿骑士J技能，每次释放技能增加1点裁决值
  if (player.value.class === 'holy_knight' && isJudgmentAccumulationUnlocked(player.value)) {
    const skillAttack = Number(player.value.attack || 0)
    const judgmentResult = processJudgmentAccumulationOnSkillCast(player.value, skillAttack)

    if (judgmentResult.triggered && judgmentResult.damageAmount > 0) {
      // 找到当前目标怪物（如果还活着）
      const targetMonster = monsters.value.find(m => !m.isDying && m.currentHealth > 0)
      if (targetMonster) {
        applyDamageToMonster(targetMonster, judgmentResult.damageAmount)
        addDamageNumber(targetMonster, judgmentResult.damageAmount, false, false, playerAvatar.value, '/pt/skill_icon/caijuejilei.png')

        const totalPercent = judgmentResult.damagePercent + judgmentResult.multiAttackBonus
        if (judgmentResult.multiAttackBonus > 0) {
          addBattleLog(`裁决积累触发！附加${totalPercent}%攻击力大地属性伤害！`, '#e74c3c')
        } else {
          addBattleLog(`裁决积累触发！附加${judgmentResult.damagePercent}%攻击力大地属性伤害！`, '#e74c3c')
        }

        if (targetMonster.currentHealth <= 0) {
          handleMonsterDefeated(targetMonster, monsters.value.indexOf(targetMonster))
        }
      }
    }
  }
}

/**
 * 清理资源
 */
const cleanup = () => {
  stopAutoBattle()
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (enterAnimationTimer) {
    clearInterval(enterAnimationTimer)
    enterAnimationTimer = null
  }
  // 清理副本进度自动保存定时器
  if (dungeonAutoSaveTimer) {
    clearInterval(dungeonAutoSaveTimer)
    dungeonAutoSaveTimer = null
  }
  // 清理所有掉落动画和光柱特效
  dungeonDrops.clearAllDrops()
  
  // 如果副本已通关或超时，清除存档；否则保存进度
  if (showVictoryScreen.value || remainingSeconds.value <= 0) {
    storageService.clearDungeonProgress()
  } else {
    saveDungeonProgress()
  }
}

/**
 * 播放背景音乐
 */
const playBgm = () => {
  try {
    if (bgmAudio.value) {
      bgmAudio.value.pause()
    }
    bgmAudio.value = new Audio('/music/ls_city.mp3')
    bgmAudio.value.loop = true
    bgmAudio.value.volume = 0.5
    bgmAudio.value.play().catch(err => {
      console.warn('[Dungeon] 背景音乐播放失败:', err)
    })
  } catch (error) {
    console.error('[Dungeon] 背景音乐初始化失败:', error)
  }
}

/**
 * 停止背景音乐
 */
const stopBgm = () => {
  try {
    if (bgmAudio.value) {
      bgmAudio.value.pause()
      bgmAudio.value.currentTime = 0
      bgmAudio.value = null
    }
  } catch (error) {
    console.error('[Dungeon] 停止背景音乐失败:', error)
  }
}

// ============ 工具方法 ============

/**
 * 添加战斗日志
 */
const addBattleLog = (text, color = '#ffffff') => {
  battleLogs.value.push({
    text,
    color,
    timestamp: Date.now()
  })

  if (battleLogs.value.length > 100) {
    battleLogs.value = battleLogs.value.slice(-100)
  }

  // 滚动到底部
  nextTick(() => {
    const container = document.querySelector('.log-content')
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

/**
 * 拾取动画消息列表
 * @type {Array<{id: number, text: string, type: string, icon: string, prefixText: string, delay: number}>}
 */
const animationMessages = ref([])

/** 动画消息ID计数器 */
let animationMessageId = 0

/** 动画消息最大同时显示数量 */
const MAX_ANIMATION_MESSAGES = 10

/**
 * 显示拾取动画消息（居中悬浮，自动淡出）
 * @param {string} text - 消息文本
 * @param {string} [type='pickup'] - 消息类型（pickup, gold）
 * @param {string} [_icon=''] - 物品图标路径（已废弃，不再渲染图片，保留参数以兼容调用方）
 * @param {string} [prefixText=''] - 图标前的前缀文本（如玩家名称）
 */
const showPickupAnimationMessage = (
  text,
  type = 'pickup',
  // eslint-disable-next-line no-unused-vars
  _icon = '',
  prefixText = ''
) => {
  const id = ++animationMessageId

  animationMessages.value.unshift({
    id,
    text,
    type,
    prefixText,
    delay: 0
  })

  // 限制动画消息数量上限，防止堆积
  if (animationMessages.value.length > MAX_ANIMATION_MESSAGES) {
    animationMessages.value.splice(MAX_ANIMATION_MESSAGES)
  }

  // 3秒后移除消息
  setTimeout(() => {
    const index = animationMessages.value.findIndex(msg => msg.id === id)
    if (index !== -1) {
      animationMessages.value.splice(index, 1)
    }
  }, 3000)
}

/**
 * 播放技能音效
 * @param {Object|string} skillData - 技能数据或技能类型
 */
const playSkillSound = (skillData) => {
  try {
    if (!skillData || !audioService) return

    // 节流：避免音效过于频繁
    const now = Date.now()
    if (now - lastSkillSoundTime < skillSoundInterval) return
    lastSkillSoundTime = now

    // 调用 AudioService 的播放方法
    if (typeof audioService.playSkillSFX === 'function') {
      audioService.playSkillSFX(skillData)
    }
  } catch (error) {
    console.error('[Dungeon] 播放技能音效失败:', error)
  }
}

/**
 * 播放普通攻击音效
 * @param {Object} memberData - 攻击者数据
 * @param {boolean} isCritical - 是否暴击
 */
const playAttackSound = (memberData, isCritical = false) => {
  try {
    if (!audioService) return

    // 节流：避免音效过于频繁
    const now = Date.now()
    if (now - lastAttackSoundTime < attackSoundInterval) return
    lastAttackSoundTime = now

    // 根据职业类型确定武器类型（与 Main 页面保持一致）
    const className = (memberData?.class || '').toLowerCase()
    let weaponType = 'sword' // 默认剑

    // 职业与武器类型映射（参考 AudioService.playAttackSFX 的武器音效映射）
    if (className.includes('mercenary') || className.includes('knight') || className.includes('blade') || className.includes('slayer')) {
      // 剑士系 - 剑/斧
      weaponType = 'sword'
    } else if (className.includes('acrobat') || className.includes('jester')) {
      // 杂耍者 - 飞轮
      weaponType = 'yoyo'
    } else if (className.includes('ranger')) {
      // 游侠 - 弓
      weaponType = 'bow'
    } else if (className.includes('assist') || className.includes('billposter')) {
      // 辅助/暴力牧师 - 拳套
      weaponType = 'knuckle'
    } else if (className.includes('ringmaster')) {
      // 神圣牧师 - 魔棒
      weaponType = 'stick'
    } else if (className.includes('magician') || className.includes('psykeeper')) {
      // 法师/精神师 - 魔杖
      weaponType = 'wand'
    } else if (className.includes('elementor')) {
      // 元素师 - 法杖
      weaponType = 'staff'
    } else {
      // 默认武器类型
      weaponType = 'sword'
    }

    // 使用 AudioService 的 playAttackSFX 方法（与 Main 页面一致）
    if (typeof audioService.playAttackSFX === 'function') {
      audioService.playAttackSFX(weaponType, isCritical)
    }
  } catch (error) {
    console.error('[Dungeon] 播放普通攻击音效失败:', error)
  }
}

/**
 * 清空战斗日志
 */
const clearBattleLogs = () => {
  battleLogs.value = []
}

/**
 * 格式化数字（添加逗号）
 */
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

/**
 * 计算血条X数量（DNF风格 - 多管血条数量）
 * 根据怪物类型和血量自动选择合适的显示单位
 * @param {number} maxHealth - 最大血量
 * @param {string} rank - 怪物等级类型（boss/elite/normal）
 * @returns {number} 血条管数
 */
const calculateHpXCount = (maxHealth, rank = 'normal') => {
  if (!maxHealth || maxHealth <= 0) return 0
  
  // 获取血量单位
  const unit = getHpUnit(maxHealth, rank)
  
  return Math.ceil(maxHealth / unit)
}

/**
 * 根据怪物类型获取血量单位
 * Boss/super/worldboss：固定10万一管血
 * elite：固定100万一管血
 * 普通小怪：固定1万一管血
 * @param {number} maxHealth - 最大血量
 * @param {string} rank - 怪物等级类型
 * @returns {number} 血量单位
 */
const getHpUnit = (maxHealth, rank = 'normal') => {
  // Boss、超级、世界Boss：固定10万一管血
  if (rank === 'boss' || rank === 'super' || rank === 'worldboss') {
    return 100000
  }
  
  // 精英：固定100万一管血
  if (rank === 'elite') {
    return 1000000
  }
  
  // 普通小怪：固定1万一管血
  return 10000
}

/**
 * DNF风格的多管血条颜色列表
 * 每管血条使用不同亮色，10管后循环重复
 */
const DNF_HP_BAR_COLORS = [
  '#FFE135', // 亮柠黄（第1管）
  '#FF7A00', // 活力橙（第2管）
  '#FF3A3A', // 热情红（第3管）
  '#FF55AA', // 玫红粉（第4管）
  '#B768FF', // 紫罗兰（第5管）
  '#42C2FF', // 天空蓝（第6管）
  '#55FFAA', // 薄荷绿（第7管）
  '#88FF55', // 青柠绿（第8管）
  '#00E0E0', // 湖蓝青（第9管）
  '#FF88AA', // 桃粉色（第10管）
]

/**
 * 获取DNF风格的多管血条数据
 * 将总血量拆分成多管血条，每管血条有独立的颜色和填充进度
 * DNF规则：
 * - 总血量按单位拆分成多管，最后一管可能不满
 * - 满血时显示最后一管（可能是满的也可能不满）
 * - 血条从右侧开始减少
 * @param {number} currentHealth - 当前血量
 * @param {number} maxHealth - 最大血量
 * @param {string} rank - 怪物等级类型（boss/elite/normal）
 * @returns {Object} 包含血条管数、当前管索引、当前管进度、当前管颜色
 */
const getDnfHpBarData = (currentHealth, maxHealth, rank = 'normal') => {
  if (!maxHealth || maxHealth <= 0) {
    return { totalBars: 0, currentBarIndex: 0, barProgress: 100, barColor: DNF_HP_BAR_COLORS[0], barBgColor: DNF_HP_BAR_COLORS[1] }
  }
  
  const health = Math.max(0, currentHealth || 0)
  
  // 使用统一的血量单位计算方法
  const unit = getHpUnit(maxHealth, rank)
  
  // 计算总血条管数（向上取整，不足一单位的也算一管）
  const totalBars = Math.ceil(maxHealth / unit)
  
  // 计算已损失的血量
  const lostHealth = maxHealth - health
  
  // 计算已打完的血条管数（从0开始）
  const completedBars = Math.floor(lostHealth / unit)
  
  // 当前血条管索引（从0开始，0是第一管/满血时的管）
  const currentBarIndex = Math.min(completedBars, totalBars - 1)
  
  // 计算当前血条管的填充进度（0-100）
  // 第一管（索引0）是血量最高的一管，显示当前管内的血量进度
  let barProgress
  
  if (health <= 0) {
    // 死亡时进度为0
    barProgress = 0
  } else if (lostHealth === 0) {
    // 满血时显示100%（满血状态）
    barProgress = 100
  } else {
    // 计算当前管内的剩余血量进度
    const currentBarRemaining = health % unit
    // 如果当前管剩余为0，说明刚好打完一管，显示满管（这种情况不应该发生，因为会切换到下一管）
    barProgress = currentBarRemaining === 0 ? 100 : Math.min(100, (currentBarRemaining / unit) * 100)
  }
  
  // 计算剩余管数（即X数量，与模板中显示的逻辑一致）
  const remainingBars = Math.ceil(health / unit) || 1
  
  // 获取当前血条管的颜色
  // 颜色按照剩余管数循环：第100管用颜色0，第99管用颜色1...
  // 每减少一管，颜色就变成下一个颜色
  const colorIndex = (totalBars - remainingBars) % DNF_HP_BAR_COLORS.length
  const barColor = DNF_HP_BAR_COLORS[colorIndex]
  
  // 获取下一管血条的颜色作为背景色
  const nextColorIndex = (colorIndex + 1) % DNF_HP_BAR_COLORS.length
  const barBgColor = DNF_HP_BAR_COLORS[nextColorIndex]
  
  // 调试日志：Boss/super怪物血条颜色变化（节流输出，避免刷屏）
  // 仅在血条管数变化时输出
  const logKey = `${rank}_${remainingBars}`
  if ((rank === 'boss' || rank === 'super' || rank === 'worldboss') && !_hpBarLogCache) {
    _hpBarLogCache = new Set()
  }
  if ((rank === 'boss' || rank === 'super' || rank === 'worldboss') && !_hpBarLogCache.has(logKey)) {
    _hpBarLogCache.add(logKey)
    // 限制缓存大小，避免内存泄漏
    if (_hpBarLogCache.size > 1000) {
      _hpBarLogCache.clear()
    }
  }
  
  return {
    totalBars,
    currentBarIndex,
    barProgress,
    barColor,
    barBgColor
  }
}

/**
 * 格式化时间
 */
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * 格式化日志时间
 */
const formatLogTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

/**
 * 获取怪物等级颜色（使用 Pinia Store 配置）
 * @param {string} rank - 怪物等级类型
 * @returns {string} CSS 颜色值
 */
const getMonsterRankColor = (rank) => {
  return monstersStore.getMonsterRankColor(rank)
}

/**
 * 获取元素图标
 */
const getElementIcon = (element) => {
  const iconMap = {
    fire: '/pt/element/fire_火.png',
    water: '/pt/element/water_水.png',
    wind: '/pt/element/wind_风.png',
    earth: '/pt/element/earth_土.png',
    electricity: '/pt/element/electricity_雷.png'
  }
  return iconMap[element] || ''
}

/**
 * 显示阶段怪物详情提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} stage - 阶段数据
 * @param {number} index - 阶段索引
 */
const showStageTooltip = (event, stage) => {
  // 获取怪物静态数据
  const monsterData = MONSTER_INFO[stage.monsterId]
  if (!monsterData) {
    // 如果没有怪物数据，显示简单提示
    const rect = event.target.getBoundingClientRect()
    tooltip.value = {
      visible: true,
      position: {
        left: rect.left + 'px',
        top: (rect.bottom + 10) + 'px'
      },
      title: stage.name,
      content: `数量: ${stage.count}${stage.isBoss ? ' (Boss)' : ''}`
    }
    return
  }

  // 触发显示怪物详情面板事件
  window.dispatchEvent(new CustomEvent('show-monster-tooltip', {
    detail: {
      monsterId: stage.monsterId,
      position: { x: event.clientX, y: event.clientY }
    }
  }))
}

/**
 * 移动阶段怪物详情提示
 * @param {MouseEvent} event - 鼠标事件
 */
const moveStageTooltip = (event) => {
  window.dispatchEvent(new CustomEvent('move-monster-tooltip', {
    detail: {
      position: { x: event.clientX, y: event.clientY }
    }
  }))
}

/**
 * 隐藏阶段怪物详情提示
 */
const hideStageTooltip = () => {
  window.dispatchEvent(new CustomEvent('hide-monster-tooltip'))
}

/**
 * 隐藏提示（保留向后兼容）
 */
const hideTooltip = () => {
  tooltip.value.visible = false
  hideStageTooltip()
}

/**
 * 处理头像错误
 */
const handleAvatarError = () => {
  // 使用默认头像
}

/**
 * 处理怪物图标错误
 */
const handleMonsterIconError = (monster) => {
  if (monster) {
    monster.icon = '/pt/monster_icon/default_monster.png'
  }
}

/**
 * 处理DEBUFF图标错误
 */
const handleDebuffIconError = (event) => {
  if (event?.target) {
    event.target.src = '/pt/skill_icon/default_skill.png'
  }
}

/**
 * 处理阶段图标错误
 */
const handleStageIconError = (event) => {
  if (event?.target) {
    event.target.style.display = 'none'
  }
}

/**
 * 退出副本确认
 */
const confirmExit = () => {
  if (confirm('确定要退出副本吗？')) {
    exitDungeon()
  }
}

/**
 * 退出副本
 * ★ 异步等待数据持久化完成后再跳转，防止后端数据未更新导致 Main 重新加载旧数据
 */
const exitDungeon = async () => {
  // 玩家主动退出副本，结束活跃期，进入CD期
  const dungeonId = route.params.id || '1'
  finishDungeon(dungeonId)
  cleanup()

  // ★ 确保 debouncedSavePlayerData 的待保存数据立即写入
  if (savePlayerDataTimer) {
    clearTimeout(savePlayerDataTimer)
    savePlayerDataTimer = null
    try {
      storageService.savePlayerData(player.value)
    } catch (e) {
      console.error('[Dungeon] 退出前保存玩家数据失败:', e)
    }
  }

  // ★ 等待所有待发送补丁持久化到后端，防止 Main 重新加载时拿到旧数据
  try {
    await storageService.flushPendingPatches()
  } catch (e) {
    console.error('[Dungeon] 退出前 flushPendingPatches 失败:', e)
  }

  router.push('/main')
}

/**
 * 打开成员详情面板
 * @param {object} member 成员数据
 * @param {string} type 成员类型 'player' | 'teammember'
 */
const openMemberDetail = async (member, type) => {
  // 保存原始的 slotId（因为 Player 实例可能没有这个属性）
  const originalSlotId = member.slotId
  
  // 如果是队员，需要获取完整的 Player 实例
  if (type === 'teammember' && !(member instanceof Player)) {
    const slotId = member.slotId
    
    // 优先从 teamMembers 中获取最新的数据（包括最新的 activeBuffs）
    const teamMember = teamMembers.value.find(m => m.slotId === slotId)
    
    if (teamMember) {
      selectedMember.value = teamMember
      if (!selectedMember.value.slotId) {
        selectedMember.value.slotId = slotId
      }
    } else if (cachedPlayerInstances.value[slotId]) {
      selectedMember.value = cachedPlayerInstances.value[slotId]
      if (!selectedMember.value.slotId) {
        selectedMember.value.slotId = slotId
      }
    } else {
      // 缓存中没有，从后端API加载完整存档数据
      let fullData = allCharactersDataCache.value[slotId]
      if (!fullData) {
        try {
          fullData = await storageService.loadPlayerDataBySlot(Number(slotId))
          if (fullData) {
            allCharactersDataCache.value[String(slotId)] = fullData
          }
        } catch (error) {
          console.error('[Dungeon] 加载成员存档数据失败:', error)
        }
      }
      
      if (!fullData) {
        selectedMember.value = member
      } else {
        const playerInstance = new Player({ ...fullData, slotId })
        cachedPlayerInstances.value[slotId] = playerInstance
        selectedMember.value = playerInstance
      }
    }
  } else {
    selectedMember.value = member
  }
  
  // 如果 selectedMember 没有 slotId，使用原始的 slotId
  if (!selectedMember.value.slotId && originalSlotId !== undefined) {
    selectedMember.value.slotId = originalSlotId
  }
  
  // 准备成员数据
  prepareMemberDataForModal(selectedMember.value, type)
  
  // 显示玩家详情面板和背包
  showPlayerDetailModal.value = true
  showBagModal.value = true
}

/**
 * 预加载所有角色数据到缓存（使用时间分片预创建 Player 实例）
 */
const preloadAllCharactersData = async () => {
  try {
    // 通过后端API获取所有存档槽摘要
    const slots = await storageService.getAllSaveSlots()
    if (!slots || slots.length === 0) return

    // 逐个加载完整存档数据并缓存
    const cache = {}
    for (const slot of slots) {
      const slotId = String(slot.slot)
      try {
        const fullData = await storageService.loadPlayerDataBySlot(slot.slot)
        if (fullData) {
          cache[slotId] = { ...fullData, slotId }
        }
      } catch (error) {
        console.error(`[Dungeon] 预加载存档槽 ${slotId} 数据失败:`, error)
      }
    }
    allCharactersDataCache.value = cache

    // 使用时间分片预创建 Player 实例（避免阻塞主线程）
    const slotIds = Object.keys(cache)
    let currentIndex = 0

    const createNextPlayer = () => {
        if (currentIndex >= slotIds.length) {
          // 所有 Player 实例创建完成后，恢复队友数据
          restoreTeamMembersFromProgress()
          return
        }

      const slotId = slotIds[currentIndex]
      const slotData = cache[slotId]

      // 使用 requestIdleCallback 在空闲时创建，或使用 setTimeout 作为降级
      const createPlayer = () => {
        try {
          // 创建 Player 实例时包含 slotId
          const playerInstance = new Player({ ...slotData, slotId })
          cachedPlayerInstances.value[slotId] = playerInstance
        } catch (error) {
          console.error(`[Dungeon] 创建 Player 实例失败 slotId=${slotId}:`, error)
        }
        currentIndex++
        // 继续下一个
        requestAnimationFrame(createNextPlayer)
      }

      requestAnimationFrame(createPlayer)
    }

    // 开始预创建
    requestAnimationFrame(createNextPlayer)

  } catch (error) {
    console.error('[Dungeon] 预加载角色数据失败:', error)
  }
}

/**
 * 从角色的 activeBuffs 中提取召唤宠物显示信息
 * 在过滤掉宠物 BUFF 之前调用，提取图标和名称用于头像上方显示
 * 注意：返回普通对象（非 markRaw），以便队员宠物召回时响应式更新显示
 * @param {Array} activeBuffs - 角色的原始 activeBuffs 数组
 * @returns {{ pickuppet: { icon: string, name: string } | null, raisedPet: { icon: string, name: string } | null }}
 */
const extractSummonedPets = (activeBuffs) => {
  const result = { pickuppet: null, raisedPet: null }
  if (!Array.isArray(activeBuffs) || activeBuffs.length === 0) return result

  for (const buff of activeBuffs) {
    if (!buff) continue
    const buffId = String(buff.id ?? '')

    // 捡宠 BUFF（ID 以 pickuppet_auto_loot_ 开头）
    if (buffId.startsWith('pickuppet_auto_loot')) {
      // 跳过已召回的限时捡宠（recalled=true 且有 endTime）
      const isRecalled = buff.recalled === true
      const buffEndTime = buff.endTime || buff.expiresAt
      const isExpired = buffEndTime && buffEndTime <= Date.now()
      if (isRecalled || isExpired) continue
      result.pickuppet = {
        icon: buff.icon || '/pt/item_icon/default_item.png',
        name: buff.meta?.petName || buff.name || '捡宠'
      }
    }

    // 培育型宠物 BUFF（ID 为 raisedpet_ability 或 source 为 raisedpet）
    if (buffId === RAISED_PET_ABILITY_BUFF_ID || buff.source === 'raisedpet') {
      const buffEndTime = buff.endTime || buff.expiresAt
      const isExpired = buffEndTime && buffEndTime <= Date.now()
      if (isExpired) continue
      result.raisedPet = {
        icon: buff.icon || '/pt/item_icon/default_item.png',
        name: buff.meta?.petName || buff.name || '培育宠物'
      }
    }
  }

  return result
}

/**
 * 从保存的进度中恢复队友数据
 */
const restoreTeamMembersFromProgress = () => {
  if (!pendingSavedProgress || !pendingSavedProgress.teamMembers) {
    return
  }

  try {
    const restoredMembers = []
    for (const savedMember of pendingSavedProgress.teamMembers) {
      // 确保 slotId 是字符串类型（缓存使用字符串键）
      const slotIdStr = String(savedMember.slotId)
      // 从缓存中获取队友的基础数据
      const cachedMember = allCharactersDataCache.value[slotIdStr]
      if (cachedMember) {
        // 恢复状态 - 创建 Player 实例时包含 slotId
        const memberInstance = new Player({ ...cachedMember, slotId: savedMember.slotId })
        // 明确清除 _isPlayer 标记，队员不能携带此标记
        // 存档中可能残留 _isPlayer=true（角色曾作为主玩家游玩过），需要强制清除
        memberInstance._isPlayer = false
        memberInstance.currentHealth = savedMember.currentHealth
        memberInstance.maxHealth = savedMember.maxHealth
        memberInstance.currentMana = savedMember.currentMana
        memberInstance.maxMana = savedMember.maxMana
        memberInstance.activeBuffs = savedMember.activeBuffs ? markRaw(savedMember.activeBuffs.filter(buff => {
          // 过滤掉训养宠物属性加成 BUFF（防止 BUFF 串显到不属于它的角色身上）
          if (String(buff?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID || buff?.source === 'raisedpet') {
            return false
          }
          return true
        })) : markRaw([])
        // 在过滤前从原始 activeBuffs 提取宠物显示信息
        memberInstance._summonedPets = extractSummonedPets(savedMember.activeBuffs)
        memberInstance.slotId = savedMember.slotId
        if (savedMember.exp !== undefined) {
          memberInstance.exp = savedMember.exp
        }
        if (savedMember.gold !== undefined) {
          memberInstance.gold = savedMember.gold
        }
        restoredMembers.push(memberInstance)
      }
    }
    
    if (restoredMembers.length > 0) {
      teamMembers.value = restoredMembers
      // 更新队伍人数
      teamSize.value = 1 + restoredMembers.length
      
      // 重新计算所有队员的属性，确保 lifeSteal 等属性基于队员自身装备正确计算
      // 避免 Player 构造函数中的全局缓存污染导致属性错误
      for (const member of restoredMembers) {
        recalculateMemberStats(member)
      }
      
      addBattleLog(`已恢复 ${restoredMembers.length} 名队友状态`, '#4CAF50')
    }
    
    // 清除临时数据
    pendingSavedProgress = null
  } catch (error) {
    console.error('[Dungeon] 恢复队友数据失败:', error)
  }
}

/**
 * 准备成员数据供模态框使用
 * @param {object} member 成员数据
 * @param {string} type 成员类型
 */
const prepareMemberDataForModal = (member, type) => {
  try {
    // 将选中成员的背包和装备数据临时设置到 itemsStore
    if (type === 'player') {
      // 当前玩家，从本地缓存读取存档数据到 itemsStore
      const slotData = storageService.getCurrentSaveData()
      if (!slotData) return

      // 合并为一次 $patch 更新，避免多次响应式触发
      itemsStore.$patch(state => {
        if (slotData.bag) {
          state.playerBag = slotData.bag
        }
        if (slotData.equipment) {
          state.equipment = slotData.equipment
        }
        if (slotData.gold !== undefined) {
          state.playerGold = slotData.gold
        }
      })

      // 更新背包容量
      itemsStore.updateBagCapacity(slotData.level || member.level || 1)
      return
    }

    // 其他角色，优先从缓存读取
    let slotData = allCharactersDataCache.value[member.slotId]
    if (!slotData) return
    
    // 合并为一次 $patch 更新，避免多次响应式触发
    itemsStore.$patch(state => {
      if (slotData.bag) {
        state.playerBag = slotData.bag
      }
      if (slotData.equipment) {
        state.equipment = slotData.equipment
      }
      if (slotData.gold !== undefined) {
        state.playerGold = slotData.gold
      }
    })
    
    // 更新背包容量（根据成员等级）
    itemsStore.updateBagCapacity(slotData.level || member.level || 1)
  } catch (error) {
    console.error('[Dungeon] 准备成员数据失败:', error)
  }
}

/**
 * 关闭背包模态框
 */
const closeBagModal = async () => {
  showBagModal.value = false
  // 等待组件销毁后再清理数据
  await nextTick()
  // 如果两个模态框都关闭了，清理选中成员
  if (!showPlayerDetailModal.value) {
    clearSelectedMember()
  }
}

/**
 * 关闭玩家详情模态框
 */
const closePlayerDetailModal = async () => {
  showPlayerDetailModal.value = false
  // 等待组件销毁后再清理数据（v-if 会导致组件销毁，watch 停止监听）
  await nextTick()
  // 如果两个模态框都关闭了，清理选中成员
  if (!showBagModal.value) {
    clearSelectedMember()
  }
}

/**
 * 清理选中成员数据并恢复当前玩家数据
 */
const clearSelectedMember = () => {
  selectedMember.value = null

  // 从本地缓存重新加载当前玩家的数据到 store（避免使用可能过时的 player.value 数据）
  try {
    const slotData = storageService.getCurrentSaveData()
    if (!slotData) return

    // 合并为一次更新，避免多次响应式触发
    itemsStore.$patch(state => {
      if (slotData.bag) {
        state.playerBag = slotData.bag
      }
      if (slotData.equipment) {
        state.equipment = slotData.equipment
      }
      if (slotData.gold !== undefined) {
        state.playerGold = slotData.gold
      }
    })
    // 恢复当前玩家的背包容量
    itemsStore.updateBagCapacity(slotData.level || 1)
  } catch (error) {
    console.error('[Dungeon] 恢复玩家数据失败:', error)
  }
}

/**
 * 获取选中成员头像URL
 * @returns {string} 头像URL
 */
const getSelectedMemberAvatar = () => {
  const member = selectedMember.value || player.value
  if (!member) return '/pt/job_icon/cxz_nan_icon.png'
  return getClassAvatar(member.class, member.sex)
}

/**
 * 获取选中成员职业名称
 * @returns {string} 职业名称
 */
const getSelectedMemberClassName = () => {
  const member = selectedMember.value || player.value
  if (!member || !member.class) return '初心者'
  return getClassName(member.class)
}

/**
 * 获取选中成员血量百分比
 * @returns {number} 血量百分比
 */
const getSelectedMemberHealthPercent = () => {
  const member = selectedMember.value || player.value
  if (!member || !member.maxHealth) return 0
  return Math.max(0, Math.min(100, ((member.currentHealth || member.maxHealth) / member.maxHealth) * 100))
}

/**
 * 获取选中成员魔力百分比
 * @returns {number} 魔力百分比
 */
const getSelectedMemberManaPercent = () => {
  const member = selectedMember.value || player.value
  if (!member || !member.maxMana) return 0
  return Math.max(0, Math.min(100, ((member.currentMana || member.maxMana) / member.maxMana) * 100))
}

/**
 * 获取角色的已学会技能列表
 * 按照各自存档在主页面底部技能栏拖入的技能进行过滤显示
 * @param {Object} memberData - 角色数据（player 或 member）
 * @returns {Array} 技能列表（包含图标、名称、熟练度等级）
 */
const getMemberSkills = (memberData) => {
  if (!memberData || !memberData.class) return []
  
  const skillConfig = gameData.value.skillConfig?.SKILL_CONFIG || gameData.value.skillConfig
  if (!skillConfig) return []
  
  const classSkills = skillConfig[memberData.class] || {}
  const skillDetails = gameData.value.skills || gameData.value.skillInfo || gameData.value.skillConfig || {}
  const playerSkills = memberData.skills || {}

  // 获取该角色的技能栏槽位 ID 集合
  const slotIds = getMemberSkillBarSlotIds(memberData)
  
  const skills = []
  
  // 遍历职业技能配置
  Object.keys(classSkills).forEach(skillId => {
    const baseSkill = classSkills[skillId] || skillDetails[skillId] || {}
    const playerSkill = playerSkills[skillId] || {}
    
    // 检查玩家是否已学会该技能（有熟练度等级）
    const proficiencyLevel = playerSkill.proficiencyLevel || playerSkill.level || 0
    if (proficiencyLevel <= 0) return // 未学会的技能不显示

    // 如果技能栏已配置技能，仅显示技能栏中的技能
    if (slotIds && slotIds.size > 0) {
      const skillIdentifier = baseSkill.id || skillId
      if (!slotIds.has(skillIdentifier)) return
    }
    
    // 获取技能图标
    const icon = baseSkill.icon || `/pt/skill_icon/${skillId}.png`
    
    skills.push({
      // 先设置关键属性
      key: skillId,
      level: proficiencyLevel,
      name: baseSkill.name || playerSkill.name || skillId,
      icon,
      maxLevel: baseSkill.proficiencyMaxLevel || playerSkill.proficiencyMaxLevel || 10,
      type: baseSkill.type || 'single',
      description: baseSkill.description || '',
      damage: baseSkill.damage,
      manaCost: baseSkill.manaCost,
      baseCooldown: baseSkill.cd || baseSkill.baseCooldown || 0,
      proficiencyEffect: baseSkill.proficiencyEffect,
      proficiency: playerSkill.proficiency,
      proficiencyExp: playerSkill.proficiencyExp,
      // 展开其他属性（排除已定义的键）
      ...Object.fromEntries(
        Object.entries(baseSkill).filter(([k]) => !['key', 'level', 'name', 'icon', 'maxLevel', 'type', 'description', 'damage', 'manaCost', 'baseCooldown', 'proficiencyEffect', 'proficiency', 'proficiencyExp'].includes(k))
      ),
      ...Object.fromEntries(
        Object.entries(playerSkill).filter(([k]) => !['key', 'level', 'name', 'icon', 'maxLevel', 'type', 'description', 'damage', 'manaCost', 'baseCooldown', 'proficiencyEffect', 'proficiency', 'proficiencyExp'].includes(k))
      )
    })
  })

  // 补充进阶前职业技能：技能栏中已放置但不在当前职业技能列表中的技能
  if (slotIds && slotIds.size > 0) {
    const existingIds = new Set(skills.map(s => s.id).filter(Boolean))
    const missingIds = Array.from(slotIds).filter(id => id && !existingIds.has(id))

    for (const missingId of missingIds) {
      const historySkill = findSkillFromJobHistory(missingId, memberData.class, playerSkills, memberData.jobHistory)
      if (historySkill) {
        skills.push({
          key: historySkill.key,
          level: historySkill.level,
          name: historySkill.name || historySkill.key,
          icon: historySkill.icon || `/pt/skill_icon/${historySkill.key}.png`,
          maxLevel: historySkill.proficiencyMaxLevel || 10,
          type: historySkill.type || 'single',
          description: historySkill.description || '',
          damage: historySkill.damage,
          manaCost: historySkill.manaCost,
          baseCooldown: historySkill.cd || historySkill.baseCooldown || 0,
          proficiencyEffect: historySkill.proficiencyEffect,
          proficiency: historySkill.proficiency,
          proficiencyExp: historySkill.proficiencyExp,
          ...Object.fromEntries(
            Object.entries(historySkill).filter(([k]) => !['key', 'level', 'name', 'icon', 'maxLevel', 'type', 'description', 'damage', 'manaCost', 'baseCooldown', 'proficiencyEffect', 'proficiency', 'proficiencyExp'].includes(k))
          )
        })
      }
    }
  }
  
  return skills
}

/**
 * 获取技能的冷却时间（秒）
 * @param {Object} skill - 技能数据
 * @param {string} memberId - 成员ID（可选，用于队伍成员技能）
 * @returns {number} 冷却时间（秒），0表示已冷却完毕
 */
const getSkillCooldownSeconds = (skill, memberId = 'player') => {
  if (!skill || !skill.key) return 0

  // 使用副本页面的冷却系统获取剩余冷却时间
  return getSkillRemainingCooldown(memberId, skill.key)
}

/**
 * 显示技能提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} skill - 技能数据
 * @param {Object} memberData - 角色数据
 */
const showSkillTooltipHandler = (event, skill, memberData) => {
  if (!skill) return
  
  // 计算提示框位置
  let x = event.clientX + 10
  let y = event.clientY + 10
  
  const tooltipWidth = 350
  const tooltipHeight = 400
  const padding = 10
  
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  if (x + tooltipWidth > screenWidth) {
    x = event.clientX - tooltipWidth - padding
  }
  if (y + tooltipHeight > screenHeight) {
    y = event.clientY - tooltipHeight - padding
  }
  if (x < 0) x = padding
  if (y < 0) y = padding
  
  skillTooltipState.value = {
    visible: true,
    skill: {
      ...skill,
      // 确保技能有所需的属性用于 tooltip 显示
      proficiencyLevel: skill.level,
      proficiencyMaxLevel: skill.maxLevel
    },
    position: { x, y },
    player: memberData
  }
}

/**
 * 移动技能提示
 * @param {MouseEvent} event - 鼠标事件
 */
const moveSkillTooltipHandler = (event) => {
  if (!skillTooltipState.value.visible) return
  
  let x = event.clientX + 10
  let y = event.clientY + 10
  
  const tooltipWidth = 350
  const tooltipHeight = 400
  const padding = 10
  
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  
  if (x + tooltipWidth > screenWidth) {
    x = event.clientX - tooltipWidth - padding
  }
  if (y + tooltipHeight > screenHeight) {
    y = event.clientY - tooltipHeight - padding
  }
  if (x < 0) x = padding
  if (y < 0) y = padding
  
  skillTooltipState.value.position = { x, y }
}

/**
 * 隐藏技能提示
 */
const hideSkillTooltipHandler = () => {
  skillTooltipState.value.visible = false
  skillTooltipState.value.skill = null
}

/**
 * 打开角色选择面板
 */
const openCharacterSelectPanel = async () => {
  showCharacterSelectPanel.value = true
  await loadOtherCharacters()
}

/**
 * 关闭角色选择面板
 */
const closeCharacterSelectPanel = () => {
  showCharacterSelectPanel.value = false
}

/**
 * 加载其他可选角色（排除已在队伍中的角色）
 * @description 通过后端API获取所有存档槽摘要，过滤掉当前角色和已在队伍中的角色
 */
const loadOtherCharacters = async () => {
  try {
    const slots = await storageService.getAllSaveSlots()
    if (!slots || slots.length === 0) {
      otherCharacters.value = []
      return
    }

    const currentSaveSlot = storageService.getCurrentSaveSlot()

    // 获取已在队伍中的角色slotId列表
    const teamMemberSlotIds = teamMembers.value.map(member => String(member.slotId))

    // 过滤掉当前角色和已在队伍中的角色
    otherCharacters.value = slots
      .filter(slot => {
        const strSlotId = String(slot.slot)
        return strSlotId !== String(currentSaveSlot) && !teamMemberSlotIds.includes(strSlotId)
      })
      .map(slot => ({
        slotId: slot.slot,
        nickname: slot.nickname,
        class: slot.class,
        level: slot.level,
        sex: slot.sex || 'male'
      }))
  } catch (error) {
    console.error('[Dungeon] 加载其他角色失败:', error)
    otherCharacters.value = []
  }
}

/**
 * 获取角色头像URL
 * @param {object} character 角色数据
 * @returns {string} 头像URL
 */
const getCharacterAvatarUrl = (character) => {
  if (!character) return '/pt/job_icon/cxz_nan_icon.png'
  return getClassAvatar(character.class, character.sex)
}

/**
 * 处理角色头像加载错误
 * @param {Event} event 错误事件
 */
const handleCharacterAvatarError = (event) => {
  event.target.src = '/pt/job_icon/cxz_nan_icon.png'
}

/**
 * 选择角色加入队伍
 * @param {object} character 选中的角色（来自存档槽摘要，仅含 nickname/class/level/sex）
 */
const selectCharacterToJoin = async (character) => {
  // 检查等级是否满足副本要求
  const minLevel = dungeonMinLevel.value
  if (character.level < minLevel) {
    addBattleLog(`${character.nickname} 等级不足（需要 ${minLevel} 级）`, '#ff4444')
    return
  }

  // 检查是否已经在队伍中
  if (teamMembers.value.some(member => member.slotId === character.slotId)) {
    addBattleLog(`${character.nickname} 已经在队伍中`, '#ff9800')
    closeCharacterSelectPanel()
    return
  }

  // 检查队伍是否已满（最多8人，包含玩家）
  if (teamMembers.value.length >= 7) {
    addBattleLog('队伍已满，无法加入更多成员', '#ff4444')
    closeCharacterSelectPanel()
    return
  }

  // 从后端加载完整的角色数据（含属性、技能、装备等）
  let fullData = null
  try {
    fullData = await storageService.loadPlayerDataBySlot(Number(character.slotId))
  } catch (error) {
    console.error('[Dungeon] 加载角色数据失败:', error)
  }

  if (!fullData) {
    addBattleLog(`加载 ${character.nickname} 数据失败`, '#ff4444')
    return
  }

  // 优先使用完整数据，回退到摘要数据
  const memberData = {
    ...fullData,
    slotId: character.slotId,
    nickname: fullData.nickname || character.nickname,
    class: fullData.class || character.class,
    level: fullData.level || character.level,
    sex: fullData.sex || character.sex || 'male',
    // 明确清除 _isPlayer 标记，队员不能携带此标记
    // 否则 recalculateMemberStats 会误判队员为玩家，导致 activeBuffs 数组引用被错误同步
    _isPlayer: false
  }

  // 添加角色到队伍，初始化 activeBuffs
  const newMember = {
    ...memberData,
    // 初始化战斗属性
    currentHealth: memberData.maxHealth || memberData.health || 100,
    maxHealth: memberData.maxHealth || memberData.health || 100,
    currentMana: memberData.maxMana || memberData.mana || 50,
    maxMana: memberData.maxMana || memberData.mana || 50,
    // 初始化 activeBuffs（使用 markRaw 阻止响应式代理）
    // 过滤规则：1. 移除已过期的 BUFF  2. 移除训养宠物 BUFF（该 BUFF 由 raisedPetSummonStore 全局管理，仅属于队长，队员不应携带）
    activeBuffs: memberData.activeBuffs && memberData.activeBuffs.length > 0
      ? markRaw(memberData.activeBuffs.filter(buff => {
          // 过滤掉已过期的 BUFF
          const buffEndTime = buff.endTime || buff.expiresAt
          if (buffEndTime && buffEndTime <= Date.now()) {
            return false
          }
          // 过滤掉训养宠物属性加成 BUFF（防止 BUFF 串显到不属于它的角色身上）
          if (String(buff?.id ?? '') === RAISED_PET_ABILITY_BUFF_ID || buff?.source === 'raisedpet') {
            return false
          }
          return true
          }))
      : markRaw([])
  }

  // 在过滤前从原始 activeBuffs 提取宠物显示信息
  newMember._summonedPets = extractSummonedPets(memberData.activeBuffs)

  // 缓存完整数据
  allCharactersDataCache.value[String(character.slotId)] = fullData

  teamMembers.value.push(newMember)

  // 更新队伍人数
  teamSize.value = 1 + teamMembers.value.length

  // 注意：加入队员时不重新生成怪物，避免怪物气血被重置为满值

  // 重新计算队员属性（应用已有的 BUFF 效果）
  recalculateMemberStats(newMember)

  // 记录日志
  addBattleLog(`${character.nickname} 加入了队伍！`, '#4CAF50')
  closeCharacterSelectPanel()
  
  // 保存副本进度（包含队友数据）
  saveDungeonProgress()
}

/**
 * 移除队伍成员
 * @param {number} index 成员索引
 */
const removeTeamMember = (index) => {
  const member = teamMembers.value[index]
  if (member) {
    addBattleLog(`${member.nickname} 离开了队伍`, '#ff9800')
    teamMembers.value.splice(index, 1)
    teamSize.value = 1 + teamMembers.value.length
    // 注意：移除队员时不重新生成怪物，避免怪物气血被重置为满值
  }
}

/**
 * 处理Buff移除请求（来自BuffDisplay组件的双击事件）
 * @param {Object} payload - 包含buff和target的数据
 */
const handleBuffRemoveRequest = (payload) => {
  const { buff, target, event } = payload
  if (!buff || !target) return
  
  // 设置面板初始位置（基于点击位置）
  if (event) {
    const clientX = event.clientX || event.touches?.[0]?.clientX || 0
    const clientY = event.clientY || event.touches?.[0]?.clientY || 0
    buffRemovePanelPosition.value = {
      x: Math.max(10, clientX - 150),
      y: Math.max(10, clientY - 50)
    }
  } else {
    // 默认居中
    buffRemovePanelPosition.value = {
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 100
    }
  }
  
  // 显示移除Buff确认面板
  showBuffRemovePanel.value = true
  buffToRemove.value = { buff, target }
}

/**
 * 确认移除Buff
 */
const confirmRemoveBuff = () => {
  if (!buffToRemove.value) return
  
  const { buff, target } = buffToRemove.value
  
  // 使用 toRaw 获取原始对象
  const rawTarget = toRaw(target)
  
  // 从目标的activeBuffs中移除该buff
  if (rawTarget && rawTarget.activeBuffs) {
    const index = rawTarget.activeBuffs.findIndex(b =>
      b.id === buff.id || b.key === buff.key
    )
    
    if (index !== -1) {
      // 从数组中移除
      rawTarget.activeBuffs.splice(index, 1)

      // 重新计算角色属性（移除 BUFF 效果）
      recalculateMemberStats(rawTarget)
    }
  }
  
  // 由于 activeBuffs 使用 markRaw 包装，需要手动触发 UI 更新
  buffVersion.value++
  gameStore.buffVersion++ // 同时更新 gameStore.buffVersion 以通知 PlayerDetailModal
  
  // 关闭面板并重置状态
  showBuffRemovePanel.value = false
  buffToRemove.value = null
}

/**
 * 取消移除Buff
 */
const cancelRemoveBuff = () => {
  showBuffRemovePanel.value = false
  buffToRemove.value = null
}

// ============ 队员宠物召回功能 ============

/**
 * 队长召回队员的捡宠
 * 业务意图：队长在副本中点击队员头像上方的捡宠图标，执行召回操作
 * 标记队员 activeBuffs 中的捡宠 BUFF 为已召回状态，并更新显示数据
 * @param {string|number} slotId - 队员的 slotId
 */
const onRecallMemberPickuppet = (slotId) => {
  try {
    const member = teamMembers.value.find(m => m.slotId === slotId)
    if (!member) {
      console.warn('[Dungeon] 未找到 slotId 为', slotId, '的队员')
      return
    }

    // 在队员的 activeBuffs 中查找捡宠 BUFF 并标记为已召回
    const rawMember = toRaw(member)
    if (Array.isArray(rawMember.activeBuffs)) {
      for (const buff of rawMember.activeBuffs) {
        if (!buff) continue
        const buffId = String(buff.id ?? '')
        if (buffId.startsWith('pickuppet_auto_loot')) {
          buff.recalled = true
        }
      }
    }

    // 更新队员的宠物显示数据（捡宠置空，保留培育型宠物）
    member._summonedPets = { ...member._summonedPets, pickuppet: null }

    // 重新计算队员属性
    recalculateMemberStats(rawMember)

    // 强制刷新 BUFF 显示
    buffVersion.value++
    gameStore.buffVersion++
  } catch (error) {
    console.error('[Dungeon] 召回队员捡宠失败:', error)
  }
}

/**
 * 队长召回队员的培育型宠物
 * 业务意图：队长在副本中点击队员头像上方的培育型宠物图标，执行召回操作
 * 培育型宠物 BUFF 已在加载时从队员 activeBuffs 中过滤，仅更新显示数据
 * @param {string|number} slotId - 队员的 slotId
 */
const onRecallMemberRaisedPet = (slotId) => {
  try {
    const member = teamMembers.value.find(m => m.slotId === slotId)
    if (!member) {
      console.warn('[Dungeon] 未找到 slotId 为', slotId, '的队员')
      return
    }

    // 更新队员的宠物显示数据（培育型宠物置空，保留捡宠）
    member._summonedPets = { ...member._summonedPets, raisedPet: null }

    // 重新计算队员属性
    const rawMember = toRaw(member)
    recalculateMemberStats(rawMember)

    // 强制刷新 BUFF 显示
    buffVersion.value++
    gameStore.buffVersion++
  } catch (error) {
    console.error('[Dungeon] 召回队员培育型宠物失败:', error)
  }
}

// ============ Buff移除面板拖拽功能 ============
const buffRemovePanelRef = ref(null)
let isDraggingBuffPanel = false
let dragStartX = 0
let dragStartY = 0
let panelStartX = 0
let panelStartY = 0

/**
 * 开始拖拽Buff移除面板
 * @param {MouseEvent} event - 鼠标事件
 */
const startDragBuffRemovePanel = (event) => {
  if (event.target.closest('.close-btn')) return
  
  isDraggingBuffPanel = true
  dragStartX = event.clientX
  dragStartY = event.clientY
  panelStartX = buffRemovePanelPosition.value.x
  panelStartY = buffRemovePanelPosition.value.y
  
  document.addEventListener('mousemove', onDragBuffRemovePanel)
  document.addEventListener('mouseup', stopDragBuffRemovePanel)
  
  // 防止选中文本
  event.preventDefault()
}

/**
 * 拖拽Buff移除面板
 * @param {MouseEvent} event - 鼠标事件
 */
const onDragBuffRemovePanel = (event) => {
  if (!isDraggingBuffPanel) return
  
  const deltaX = event.clientX - dragStartX
  const deltaY = event.clientY - dragStartY
  
  buffRemovePanelPosition.value = {
    x: panelStartX + deltaX,
    y: panelStartY + deltaY
  }
}

/**
 * 停止拖拽Buff移除面板
 */
const stopDragBuffRemovePanel = () => {
  isDraggingBuffPanel = false
  document.removeEventListener('mousemove', onDragBuffRemovePanel)
  document.removeEventListener('mouseup', stopDragBuffRemovePanel)
}

/**
 * 获取队伍成员头像URL
 * @param {object} member 成员数据
 * @returns {string} 头像URL
 */
const getMemberAvatarUrl = (member) => {
  if (!member) return '/pt/job_icon/cxz_nan_icon.png'
  return getClassAvatar(member.class, member.sex)
}

/**
 * 获取成员的副手武器图标URL
 * @param {object} member 成员数据
 * @returns {string} 副手武器图标URL，无副手武器返回空字符串
 */
const getMemberOffhandWeaponIcon = (member) => {
  if (!member || !member.equipment || !member.equipment.shield) {
    return ''
  }
  const offhandWeapon = member.equipment.shield
  if (offhandWeapon.category !== 'weapon') {
    return ''
  }
  const iconPath = offhandWeapon.iconSrc || offhandWeapon.icon
  if (!iconPath) return ''
  if (iconPath.startsWith('/pt/')) {
    return iconPath
  }
  return `/pt/item_icon/${iconPath}`
}

/**
 * 双刀流被动：执行副手普通攻击（副本场景）
 * 当成员拥有双刀流能力、已学习P技能、且装备了副手武器时，
 * 每次普通攻击命中后有概率触发副手额外攻击一次。
 * @param {Object} memberData - 成员数据
 * @param {string} memberType - 成员类型 'player' | 'teammember'
 * @param {Object} monster - 被攻击的怪物对象
 */
const performDungeonOffhandAttack = (memberData, memberType, monster) => {
  try {
    if (!monster || monster.isDying || monster.currentHealth <= 0) {
      return
    }

    // 检查是否可以触发副手攻击
    if (!canTriggerOffhandAttack(memberData)) {
      return
    }

    // 检查触发概率
    const triggerChance = getOffhandAttackChance(memberData)
    if (triggerChance <= 0 || Math.random() > triggerChance) {
      return
    }

    // 获取副手武器
    const offhandWeapon = getOffhandWeapon(memberData)
    if (!offhandWeapon) {
      return
    }

    // 计算副手武器攻击力范围
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
    const offhandAtkBonus = getOffhandAttackBonus(memberData)
    const offhandMinAttack = Math.floor((processedWeapon.minAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + offhandAtkBonus))
    const offhandMaxAttack = Math.floor((processedWeapon.maxAttack || 0) * OFFHAND_ATTRIBUTE_RATIO * (1 + offhandAtkBonus))

    // 命中判定
    const hitRate = DamageCalculator.calculateHitRate(memberData)
    const isMiss = Math.random() > hitRate

    const offhandIcon = getMemberOffhandWeaponIcon(memberData)
    const attackerIcon = getMemberAvatarUrl(memberData)

    if (isMiss) {
      addDamageNumber(monster, 0, false, true, attackerIcon, '', offhandIcon, false, true)
      return
    }

    // 滚动基础伤害
    let offhandDamage = DamageCalculator.rollAttackDamage(offhandMinAttack, offhandMaxAttack)

    // EX3副手武器倍攻：概率触发倍率乘数（30%概率1.5倍、20%概率2倍、10%概率2.5倍）
    const offhandEx3Multiplier = rollOffhandMasteryEx3Multiplier(memberData)
    if (offhandEx3Multiplier > 1) {
      offhandDamage = Math.floor(offhandDamage * offhandEx3Multiplier)
    }

    // 武器类型加成
    if (offhandWeapon?.subcategory) {
      offhandDamage += DamageCalculator.getWeaponTypeBonus(offhandWeapon.subcategory, memberData)
    }

    // 临时属性加成
    if (memberData.tempStats?.attack) {
      offhandDamage += memberData.tempStats.attack
    }

    // 暴击计算
    const critRate = memberData.criticalRate ?? memberData.critRate
    const isCritical = DamageCalculator.calculateCritical(critRate)
    if (isCritical) {
      const critDamageMultiplier = DamageCalculator.normalizeCriticalDamageMultiplier(
        memberData.criticalDamage ?? memberData.critDamage
      )
      offhandDamage = (offhandDamage * critDamageMultiplier) >> 0
    }

    // 等级差修正
    const memberLevel = Number(memberData?.level) || 1
    const monsterLevel = Number(monster?.level) || 1
    const levelDiff = monsterLevel - memberLevel
    if (levelDiff > 0) {
      const reduction = Math.min(levelDiff * 0.05, 0.95)
      offhandDamage = Math.max(1, Math.floor(offhandDamage * (1 - reduction)))
    } else if (levelDiff < 0) {
      const increase = Math.min(-levelDiff * 0.05, 1.0)
      offhandDamage = Math.max(1, Math.floor(offhandDamage * (1 + increase)))
    }

    // 减去防御力
    const monsterDefense = monster.defense || 0
    offhandDamage = Math.max(1, offhandDamage - monsterDefense)

    // 应用 PVE 伤害加成
    const pveDamage = Number(memberData?.pveDamage) || 0
    if (pveDamage > 0) {
      offhandDamage = Math.floor(offhandDamage * (1 + pveDamage / 100))
    }

    offhandDamage = Math.max(1, offhandDamage)

    // 应用伤害到怪物
    applyDamageToMonster(monster, offhandDamage)

    // 副手攻击吸血
    if (offhandDamage > 0) {
      const healTarget = memberType === 'player' ? player.value : memberData
      applyLifeSteal(healTarget, offhandDamage, {
        onPlayerHeal: (data) => {
          const targetType = memberType === 'player' ? 'player' : 'teammember'
          showHealNumberOnTarget({ icon: offhandIcon }, { type: targetType, data: memberData }, data.amount)
        }
      })
      if (memberType === 'player' && healTarget.currentHealth !== player.value.currentHealth) {
        gameStore.player.currentHealth = player.value.currentHealth
        storageService.savePlayerPatch({
          currentHealth: player.value.currentHealth
        })
      }
    }

    // 记录伤害贡献
    const memberId = memberType === 'player' ? 'player' : `member_${memberData.slotId}`
    const memberName = memberData.nickname || (memberType === 'player' ? '玩家' : `队员${memberData.slotId}`)
    if (!monster.damageContribution) {
      monster.damageContribution = {}
    }
    monster.damageContribution[memberId] = (monster.damageContribution[memberId] || 0) + offhandDamage
    recordDamageForDps(memberId, memberName, offhandDamage)

    // 显示副手攻击伤害数字
    addDamageNumber(monster, offhandDamage, isCritical, false, attackerIcon, '', offhandIcon, false, true)
  } catch (error) {
    console.error('[Dungeon] 副手攻击执行失败:', error)
  }
}

/**
 * 获取成员武器图标URL
 * @param {object} member 成员数据
 * @returns {string} 武器图标URL，无武器返回空字符串（显示拳头）
 */
const getMemberWeaponIcon = (member) => {
  if (!member || !member.equipment || !member.equipment.weapon) {
    return '' // 无武器，显示拳头
  }
  const weapon = member.equipment.weapon
  // 优先使用 iconSrc，其次使用 icon
  const iconPath = weapon.iconSrc || weapon.icon
  if (!iconPath) return ''
  // 如果是相对路径，补充完整路径
  if (iconPath.startsWith('/pt/')) {
    return iconPath
  }
  return `/pt/item_icon/${iconPath}`
}

/**
 * 计算队伍成员血量百分比
 * @param {object} member 成员数据
 * @returns {number} 血量百分比
 */
const getMemberHealthPercent = (member) => {
  if (!member || !member.maxHealth) return 0
  return Math.max(0, Math.min(100, (member.currentHealth / member.maxHealth) * 100))
}

/**
 * 计算队伍成员魔力百分比
 * @param {object} member 成员数据
 * @returns {number} 魔力百分比
 */
const getMemberManaPercent = (member) => {
  if (!member || !member.maxMana) return 0
  return Math.max(0, Math.min(100, (member.currentMana / member.maxMana) * 100))
}

/**
 * 计算经验百分比
 * @param {number} exp 当前经验
 * @param {number} maxExp 升级所需经验
 * @param {number} level 当前等级
 * @returns {number} 经验百分比
 */
const getExpPercent = (exp, maxExp, level) => {
  // 满级时显示100%
  if (level && level >= 150) return 100
  if (!maxExp || maxExp <= 0) return 0
  const currentExp = exp || 0
  return Math.max(0, Math.min(100, Math.floor((currentExp / maxExp) * 100)))
}

/**
 * 计算队伍成员经验百分比
 * @param {object} member 成员数据
 * @returns {number} 经验百分比
 */
const getMemberExpPercent = (member) => {
  if (!member) return 0
  return getExpPercent(member.exp, member.maxExp, member.level)
}

/**
 * 玩家数据更新
 * 业务意图：处理道具使用后的数据更新，包括 BUFF 效果应用和属性重算
 * 副本中需区分队长和队员，分别处理属性重算和 UI 刷新
 * @param {Object} [payload] - 事件载荷，包含 skipAttributesUpdate/skipPlayerReload 等标志
 */
const onPlayerDataUpdated = (payload) => {
  const payloadObject = payload && typeof payload === 'object' ? payload : null

  // 判断当前操作的目标是否为队友
  const targetMember = selectedMember.value
  const isTeammate = targetMember && targetMember !== player.value && targetMember._isPlayer !== true

  if (isTeammate) {
    // 队友使用道具：recalculateMemberStats 已在 onTeammateBuffChanged 回调中调用
    // 这里只需保存队友数据
    saveTeamMemberData(targetMember)
  } else {
    // 队长使用道具
    // BUFF 类道具需要重新计算属性（skipAttributesUpdate = false）
    if (!payloadObject?.skipAttributesUpdate) {
      // 确保 player.value 的 activeBuffs 同步到 gameStore.player
      // 因为 player.value 和 gameStore.player 是不同的对象实例
      if (player.value?.activeBuffs && gameStore.player) {
        gameStore.player.activeBuffs = player.value.activeBuffs
      }
      // 重新计算属性（包括 BUFF 效果）
      if (typeof updatePlayerAttributes === 'function') {
        updatePlayerAttributes()
      }
      // updatePlayerAttributes 会替换 gameStore.player 为新对象
      // 需要将 player.value 指向新的 gameStore.player 以保持引用一致
      if (gameStore.player && gameStore.player !== player.value) {
        player.value = gameStore.player
        player.value._isPlayer = true
        if (player.value.slotId === undefined) {
          player.value.slotId = storageService.getCurrentSaveSlot()
        }
      }
      // 刷新 BUFF 显示（activeBuffs 可能使用 markRaw，需要通过 buffVersion 强制刷新）
      gameStore.buffVersion++
      buffVersion.value++
    }
    // 保存玩家数据
    storageService.savePlayerData(player.value)
  }
}
</script>

<style scoped>
/* ============ 主容器 ============ */
.dungeon-page {
  min-height: 100vh;
  background: #000000;
  position: relative;
  overflow: hidden;
  padding: 15px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.test-dungeon-page.show-boss {
  background: transparent;
}

/* ============ 玻璃面板 ============ */
.glass-panel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(5px);
  box-shadow: none;
}

/* ============ 入场动画 ============ */
.enter-animation-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(10, 10, 30, 0.98));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.enter-content {
  text-align: center;
}

/* 入场动画 - 最终BOSS图片 */
.enter-boss-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.enter-boss-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 0 15px rgba(255, 50, 50, 0.6)) drop-shadow(0 0 30px rgba(255, 100, 0, 0.3));
  animation: bossImageFloat 3s ease-in-out infinite;
}

.enter-boss-name {
  margin-top: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 50, 50, 0.5);
}

@keyframes bossImageFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.dungeon-title-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.title-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.3), transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.dungeon-title {
  font-size: 48px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3);
  margin: 0;
  position: relative;
  z-index: 1;
}

.title-line {
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  margin: 15px auto 0;
}

.dungeon-subtitle {
  font-size: 24px;
  color: #fff;
  margin: 10px 0;
}

.dungeon-hint {
  font-size: 16px;
  color: #888;
  margin: 20px 0;
}

.loading-bar {
  width: 300px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin: 20px auto;
  overflow: hidden;
}

.loading-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.1s linear;
}

/* ============ 胜利画面 ============ */
.victory-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.95));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.victory-content {
  text-align: center;
  padding: 40px;
}

.victory-badge {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
}

.badge-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.4), transparent 70%);
  animation: glowPulse 1.5s ease-in-out infinite;
}

.badge-icon {
  font-size: 60px;
  line-height: 120px;
}

.victory-title {
  font-size: 48px;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin-bottom: 30px;
}

.victory-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px 25px;
  border-radius: 10px;
  min-width: 150px;
}

.stat-item.highlight {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.stat-value.gold {
  color: #ffd700;
}

.stat-value.exp {
  color: #4CAF50;
}

.reward-items {
  margin-bottom: 30px;
}

.reward-title {
  font-size: 18px;
  color: #ffd700;
  margin-bottom: 15px;
}

.reward-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 15px;
  border-radius: 8px;
}

.reward-item.rare {
  border: 1px solid #2196f3;
}

.reward-item.legendary {
  border: 1px solid #ffd700;
}

.reward-icon {
  width: 32px;
  height: 32px;
}

.reward-name {
  color: #fff;
}

.reward-count {
  color: #ffd700;
  font-weight: bold;
}

.victory-btn {
  padding: 15px 40px;
  font-size: 18px;
  background: linear-gradient(135deg, #ffd700, #ff9800);
  border: none;
  border-radius: 25px;
  color: #000;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.victory-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(255, 215, 0, 0.4);
}

/* 待分配物品提示 */
.pending-loot-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
  padding: 15px 20px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.4);
  border-radius: 10px;
}

.pending-loot-hint .hint-text {
  color: #FFD700;
  font-size: 14px;
  font-weight: bold;
}

.pending-loot-hint .distribute-btn {
  padding: 10px 30px;
  font-size: 16px;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 20px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pending-loot-hint .distribute-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

/* ============ 战斗容器 ============ */
.battle-container {
  display: flex;
  gap: 15px;
  min-height: calc(100vh - 180px);
  position: relative;
  z-index: 10;
}

/* ============ 左侧面板 ============ */
.left-sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* ============ 右侧面板 ============ */
.right-sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

/* 进度面板 */
.progress-panel {
  padding: 5px;
  flex: 1;
}

.progress-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-title {
  font-size: 14px;
  color: #ffd700;
  margin: 0;
}

.progress-difficulty {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
}

/* 副本倍率信息 */
.dungeon-multipliers {
  display: flex;
  padding: 5px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

.dungeon-multipliers:last-of-type {
}

.multiplier-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
}

.multiplier-label {
  color: rgba(255, 255, 255, 0.7);
}

.multiplier-value {
  color: #4fc3f7;
  font-weight: bold;
}

.multiplier-value.exp {
color: #ffd700;
}

.multiplier-value.hp {
color: #ff6b6b;
}

.difficulty-normal { background: #4CAF50; color: #fff; }
.difficulty-medium { background: #2196f3; color: #fff; }
.difficulty-hard { background: #ff9800; color: #000; }
.difficulty-nightmare { background: #9c27b0; color: #fff; }
.difficulty-hell { background: #f44336; color: #fff; }

.stage-indicators {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stage-dot {
  width: 100%;
  height: auto;
  min-height: 60px;
  border-radius: 8px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: stretch;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stage-dot:hover {
  border-color: rgba(255, 215, 0, 0.5);
  transform: scale(1.02);
}

.stage-dot.completed {
  border-color: rgba(255, 255, 255, 0.3);
  background: transparent;
}

/* 当前进度跑马灯边框动画 */
.stage-dot.current {
  border: none;
  background: transparent;
  position: relative;
}

.stage-dot.current::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ffd700, #ff6b6b, #ffd700, #ff6b6b);
  background-size: 300% 100%;
  animation: borderFlow 2s linear infinite;
  z-index: -1;
}

.stage-dot.current::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 6px;
  background: rgba(20, 20, 40, 0.9);
  z-index: -1;
}

@keyframes borderFlow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}

.stage-dot.boss {
  border-color: rgba(255, 255, 255, 0.3);
  background: transparent;
}

@keyframes currentStagePulse {
  0%, 100% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
}

/* 阶段内容容器 */
.stage-content {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px;
  width: 100%;
}

.stage-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
  flex-shrink: 0;
}

.stage-number {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  font-weight: bold;
  flex-shrink: 0;
}

/* 阶段信息 */
.stage-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stage-info .stage-name {
  font-size: 12px;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage-count-small {
  font-size: 10px;
  color: #888;
}

.completed-check {
  position: absolute;
  inset: 0;
  background: rgba(76, 175, 80, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ff9800);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #ffd700;
  font-weight: bold;
  /* min-width: 40px; */
}

/* 计时器面板 */
.timer-panel {
  padding: 6px;
  text-align: center;
}

.timer-icon {
  font-size: 20px;
  margin-bottom: 5px;
}

.timer-display {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  font-family: monospace;
}

.timer-label {
  font-size: 11px;
  color: #888;
  margin-top: 5px;
}

/* ============ 主战斗区域 ============ */
.main-battle-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ============ 战斗区域 ============ */
.battle-area {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: 400px;
  height: 100%;
  position: relative;
  z-index: 10;
  flex: 1;
}

/* ============ 团队玩家区域 ============ */
.team-area {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(100, 180, 255, 0.3);
  border-radius: 12px;
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.team-area .team-grid {
  flex: 1;
  align-content: center;
}

.team-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(100, 180, 255, 0.3);
}

.team-label .label-icon {
  font-size: 18px;
}

.team-label .label-text {
  font-size: 14px;
  font-weight: bold;
  color: #6eb5ff;
  flex: 1;
  margin-left: 6px;
}

.team-config-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(100, 180, 255, 0.2);
  color: #6eb5ff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-config-btn:hover {
  background: rgba(100, 180, 255, 0.4);
  transform: rotate(90deg);
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  max-width: 100%;
}

/* ============ 经验分配模式选择器 ============ */
.exp-distribution-panel {
  margin-top: 15px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(100, 180, 255, 0.2);
}

.exp-distribution-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.exp-distribution-label .label-icon {
  font-size: 16px;
}

.exp-distribution-label .label-text {
  font-size: 13px;
  font-weight: bold;
  color: #6eb5ff;
}

.exp-distribution-slider {
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  padding: 4px;
  overflow: hidden;
}

.exp-mode-option {
  flex: 1;
  text-align: center;
  padding: 8px 12px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: color 0.3s ease;
}

.exp-mode-option .mode-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.exp-mode-option.active .mode-label {
  color: #fff;
}

.exp-mode-indicator {
  position: absolute;
  top: 4px;
  left: 0;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border-radius: 16px;
  transition: left 0.3s ease;
  z-index: 1;
}

.exp-distribution-desc {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

/* ============ 队伍配置面板 ============ */
.team-config-panel {
  position: fixed;
  left: calc(50% + 200px + 20px); /* 主内容区右侧 */
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.config-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  border-bottom: 1px solid rgba(100, 180, 255, 0.3);
}

.config-panel-header h3 {
  font-size: 14px;
  font-weight: bold;
  color: #6eb5ff;
  margin: 0;
}

.config-panel-body {
  padding: 15px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.config-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.config-value {
  font-size: 14px;
  font-weight: bold;
  color: #4CAF50;
}

.config-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.config-section:first-of-type {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.config-section-title {
  font-size: 13px;
  font-weight: bold;
  color: #6eb5ff;
  margin-bottom: 10px;
}

.exp-mode-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.exp-mode-display .mode-name {
  font-size: 14px;
  font-weight: bold;
  color: #4CAF50;
}

.exp-mode-display .mode-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* 滑动块面板样式 */
.slider-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-container {
  position: relative;
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  height: 36px;
}

.slider-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.slider-option .option-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.slider-option.active .option-label {
  color: #fff;
}

.slider-indicator {
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: calc(50% - 3px);
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  border-radius: 17px;
  transition: left 0.3s ease;
  z-index: 0;
}

.slider-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 0 8px;
}

.bonus-info {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.bonus-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.bonus-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.bonus-value {
  font-size: 16px;
  font-weight: bold;
  color: #4CAF50;
}

.bonus-value.bonus-max {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.bonus-detail {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;
}

/* 队伍配置面板过渡动画 */
.team-config-slide-enter-active,
.team-config-slide-leave-active {
  transition: all 0.3s ease;
}

.team-config-slide-enter-from,
.team-config-slide-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(20px);
}

.team-config-slide-enter-to,
.team-config-slide-leave-from {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

/* 团队成员卡片 */
.team-member-card {
  background: transparent;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

/* 怪物攻击伤害数字容器 */
.team-member-card .monster-damage-numbers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
  z-index: 20;
}

/* 怪物攻击伤害数字 */
.team-member-card .monster-damage-number {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: monster-damage-float 1s ease-out forwards;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

/* 怪物攻击伤害 - 怪物头像 */
.team-member-card .monster-damage-number .damage-monster-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid #ff4444;
  box-shadow: 0 0 6px rgba(255, 68, 68, 0.6);
  background: rgba(0, 0, 0, 0.3);
}

/* 怪物攻击伤害 - 伤害值 */
.team-member-card .monster-damage-number .damage-value {
  color: #ff4444;
  font-size: 18px;
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 闪避样式 */
.team-member-card .monster-damage-number.is-dodge {
  background: rgba(0, 200, 255, 0.2);
  border-radius: 8px;
  padding: 4px 12px;
}

.team-member-card .monster-damage-number .damage-text.dodge {
  color: #00c8ff;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(0, 200, 255, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 格挡样式 */
.team-member-card .monster-damage-number.is-block {
  background: rgba(255, 200, 0, 0.15);
  border-radius: 8px;
  padding: 4px 8px;
}

.team-member-card .monster-damage-number.is-block .damage-value {
  color: #ffc800;
}

.team-member-card .monster-damage-number .block-tag {
  font-size: 12px;
  color: #ffc800;
  opacity: 0.8;
  margin-left: 2px;
}

/* 怪物攻击伤害浮动动画 */
@keyframes monster-damage-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-20px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.8);
  }
}

/* 怪物攻击伤害数字进入/离开过渡 */
.monster-damage-enter-active {
  animation: monster-damage-float 0.3s ease-out;
}

.monster-damage-leave-active {
  animation: monster-damage-float 0.3s ease-out reverse;
}

/* 治疗数字容器 */
.team-member-card .heal-numbers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
  z-index: 21;
}

/* 治疗数字 */
.team-member-card .heal-number {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  animation: heal-float 1s ease-out forwards;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

/* 治疗数字 - 技能图标 */
.team-member-card .heal-number .heal-skill-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 2px solid #4CAF50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
  background: rgba(0, 0, 0, 0.3);
}

/* 治疗数字 - 治疗值 */
.team-member-card .heal-number .heal-value {
  color: #4CAF50;
  font-size: 18px;
  text-shadow: 0 0 8px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* 治疗数字浮动动画 */
@keyframes heal-float {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-20px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.8);
  }
}

/* 治疗数字进入/离开过渡 */
.heal-number-enter-active {
  animation: heal-float 0.3s ease-out;
}

.heal-number-leave-active {
  animation: heal-float 0.3s ease-out reverse;
}

.team-member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.team-member-card.is-current-player {
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
}

.team-member-card.is-leader {
  border-color: rgba(255, 200, 50, 0.3);
}

.team-member-card.is-offline {
  opacity: 0.5;
}

.team-member-card.is-dead {
  border-color: rgba(200, 50, 50, 0.5);
}

.team-member-card.is-teammember {
  border-color: rgba(76, 175, 80, 0.5);
  background: rgba(76, 175, 80, 0.1);
}

.team-member-card.is-teammember:hover {
  border-color: rgba(76, 175, 80, 0.7);
  background: rgba(76, 175, 80, 0.15);
}

/* 移除成员按钮 */
.remove-member-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(244, 67, 54, 0.6);
  background: rgba(244, 67, 54, 0.2);
  color: #ff6b6b;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-member-card.is-teammember:hover .remove-member-btn {
  opacity: 1;
}

.remove-member-btn:hover {
  background: rgba(244, 67, 54, 0.5);
  border-color: rgba(244, 67, 54, 1);
  color: #fff;
  transform: scale(1.1);
}

.team-member-card.is-empty {
  background: transparent;
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.2);
  opacity: 0.5;
}

.team-member-card.is-empty:hover {
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.03);
}

/* 成员头像 */
.team-member-card .member-avatar {
  position: relative;
  margin: 0 auto 6px;
  width: 100px;
  height: 100px;
}

.team-member-card .member-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

/* 可点击头像样式 */
.team-member-card .member-avatar.member-avatar-clickable {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.team-member-card .member-avatar.member-avatar-clickable:hover {
  transform: scale(1.05);
}

.team-member-card .member-avatar.member-avatar-clickable:hover img {
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.6);
}

.team-member-card .leader-crown {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 14px;
  background: rgba(255, 200, 50, 0.9);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-member-card .attack-bonus-badge {
  font-size: 9px;
  font-weight: bold;
  background: linear-gradient(135deg, #f44336, #e91e63);
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.team-member-card .exp-bonus-badge {
  font-size: 9px;
  font-weight: bold;
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

/* 加成标识行（显示在头像上方） */
.team-member-card .bonus-badges-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  min-height: 16px;
}

/* 队员召唤宠物浮动显示由 DungeonMemberPet 组件独立管理（Teleport to body），此处无需额外样式 */

.team-member-card .status-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #aaa;
}

.team-member-card .status-overlay.dead {
  background: rgba(100, 0, 0, 0.7);
  font-size: 18px;
}

/* 成员信息行 */
.team-member-card .member-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding: 0 2px;
}

/* 成员名称 */
.team-member-card .member-name {
  font-size: 11px;
  font-weight: bold;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 4px;
}

.team-member-card .member-level {
  font-size: 9px;
  font-weight: bold;
  color: #333;
  background: linear-gradient(180deg, #ffd700 0%, #ffb800 100%);
  padding: 1px 5px;
  border-radius: 8px;
  white-space: nowrap;
}

/* 成员状态条 */
.team-member-card .member-hp-bar,
.team-member-card .member-mp-bar,
.team-member-card .member-exp-bar {
  height: 10px;
  background: #000;
  border-radius: 5px;
  position: relative;
  overflow: hidden;
  margin-bottom: 4px;
}

.team-member-card .member-hp-bar .bar-fill,
.team-member-card .member-mp-bar .bar-fill,
.team-member-card .member-exp-bar .bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.team-member-card .member-hp-bar .bar-fill {
  background: linear-gradient(90deg, #ff4444, #ff6b6b);
}

.team-member-card .member-mp-bar .bar-fill {
  background: linear-gradient(90deg, #2196f3, #64b5f6);
}

.team-member-card .member-exp-bar .bar-fill {
  background: linear-gradient(180deg, #7dff7a 0%, #35b431 100%);
}

.team-member-card .bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
  width: 100%;
  text-align: center;
}

/* 技能图标列表 */
.team-member-card .member-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 4px;
  padding: 0 2px;
  justify-content: space-between;
}

.team-member-card .skill-icon-wrapper {
  position: relative;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.team-member-card .skill-icon {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  background: rgba(0, 0, 0, 0.3);
}

.team-member-card .skill-level-badge {
  position: absolute;
  bottom: -1px;
  right: -1px;
  font-size: 6px;
  color: #fff;
  background: linear-gradient(180deg, #ffd700 0%, #ff8c00 100%);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}

/* 技能冷却遮罩 */
.team-member-card .skill-icon-wrapper.on-cooldown {
  opacity: 0.7;
}

.team-member-card .skill-icon-wrapper.on-cooldown .skill-icon {
  filter: grayscale(50%);
}

.team-member-card .skill-cd-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-member-card .skill-cd-text {
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* BUFF图标列表 */
.team-member-card .member-buffs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 3px;
  padding: 0 2px;
  justify-content: flex-start;
}

.team-member-card .buff-icon-wrapper {
  position: relative;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.team-member-card .buff-icon {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  border: 1px solid rgba(52, 152, 219, 0.5);
  object-fit: cover;
  background: rgba(52, 152, 219, 0.2);
}

.team-member-card .buff-timer {
  position: absolute;
  bottom: -1px;
  right: -1px;
  font-size: 5px;
  color: #fff;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}

/* 空位显示 */
.team-member-card .empty-avatar {
  width: 50px;
  height: 50px;
  margin: 0 auto 6px;
  border-radius: 8px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.3);
}

.team-member-card .empty-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

/* ============ 战斗分割线 ============ */
.battle-divider {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 5px 0;
}

.battle-divider .divider-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 100, 100, 0.5), transparent);
}

.battle-divider .divider-text {
  font-size: 16px;
  color: rgba(255, 100, 100, 0.8);
  text-shadow: 0 0 10px rgba(255, 100, 100, 0.5);
}

/* 怪物区域 */
.monster-area {
  position: relative;
  background: transparent;
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.monster-area .monster-grid {
  flex: 1;
  align-content: center;
}

.monster-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 100, 100, 0.2);
}

.monster-label .label-icon {
  font-size: 18px;
}

.monster-label .label-text {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b6b;
}

.monster-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

/* 怪物卡片 - 垂直布局 */
.monster-card {
  background: transparent;
  border: none;
  border-radius: 10px;
  padding: 10px;
  transition: all 0.3s ease;
  position: relative;
  min-width: 120px;
  max-width: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.monster-card:hover {
  transform: translateY(-3px);
}

.monster-card.boss {
flex: 1 1 100%;
max-width: 100%;
background: transparent;
}

/* Boss头像100px */
.monster-card.boss .monster-icon-wrapper {
  width: 100px;
  height: 100px;
}

/* 精英头像100px */
.monster-card.elite .monster-icon-wrapper {
  width: 100px;
  height: 100px;
}

.monster-card.elite {
box-shadow: 0 0 15px rgba(156, 39, 176, 0.3);
}

/* 单目标怪物卡片放大1.7倍（击杀数量 = 1，通常是 BOSS/超级怪物） */
.monster-card.single-target {
  transform: scale(1.7);
  transform-origin: center center;
  margin: 40px;
  z-index: 10;
}

/* 单目标怪物头像放大 */
.monster-card.single-target .monster-icon-wrapper {
  width: 119px;
  height: 119px;
}

/* 单目标怪物名称放大 */
.monster-card.single-target .monster-name {
  font-size: 20px;
}

/* 单目标怪物等级放大 */
.monster-card.single-target .monster-level {
  font-size: 17px;
}

/* 单目标怪物血条放大 */
.monster-card.single-target .monster-hp-bar {
  height: 17px;
}

/* 单目标怪物血条文字 */
.monster-card.single-target .monster-hp-bar .bar-text {
  font-size: 9px;
  letter-spacing: -0.5px;
}

/* 单目标元素徽章放大 */
.monster-card.single-target .element-badge-inline img {
  width: 24px;
  height: 24px;
}

.monster-card.hit {
  animation: monsterHit 0.2s ease;
}

@keyframes monsterHit {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.monster-card.dying {
  opacity: 0.5;
  animation: monsterFade 0.5s ease forwards;
}

@keyframes monsterFade {
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}

/* 怪物图标 */
.monster-icon-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  flex-shrink: 0;
  margin-bottom: 6px;
}

.monster-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.monster-info {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.element-badge-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
  margin-left: 4px;
}

.element-badge-inline img {
  width: 14px;
  height: 14px;
}

/* 怪物信息 - 垂直排列 */
.monster-info {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.monster-name {
  font-size: 12px;
  font-weight: bold;
  color: #fff;
}

/* 怪物名称和等级行 */
.monster-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 2px;
}

.monster-level {
  font-size: 10px;
  color: #aaa;
}

/* 怪物血条 */
.monster-hp-bar {
  width: 100%;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  position: relative;
  overflow: visible;
}

.monster-hp-bar .bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.monster-hp-bar .bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  color: #fff;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  padding: 0 2px;
  letter-spacing: -0.3px;
}

/* DNF风格血条 */
.dnf-hp-bar {
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* DNF风格血量百分比 - 上方居中显示 */
.dnf-hp-percent {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: -10px;
  font-size: 9px;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  white-space: nowrap;
}

/* DNF风格X数量显示 - 右上角外部贴合 */
.dnf-hp-xcount {
  position: absolute;
  right: 0;
  top: -10px; /* 显示在血条外部上方 */
  font-size: 9px;
  font-weight: bold;
  color: #ffcc00;
  
  z-index: 10;
  font-family: 'Arial Black', sans-serif;
  letter-spacing: -0.5px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 3px;
  border: 1px solid rgba(255, 200, 0, 0.3);
}

/* Boss血条X数量放大 */
.boss-xcount {
  font-size: 11px;
  right: 0;
  top: -12px;
  padding: 2px 5px;
}

/* 怪物DEBUFF效果图标 */
.monster-debuffs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
  justify-content: center;
}

.debuff-icon {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 100, 100, 0.5);
  overflow: hidden;
}

/* 碎甲等防御debuff特殊样式 */
.debuff-icon.armor-break {
  border: 1px solid rgba(255, 152, 0, 0.8);
  box-shadow: 0 0 4px rgba(255, 152, 0, 0.4);
}

/* 眩晕debuff特殊样式 */
.debuff-icon.stun-effect {
  border: 1px solid rgba(255, 215, 0, 0.9);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  animation: stun-pulse 1s ease-in-out infinite;
}

@keyframes stun-pulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
  }
}

.debuff-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.debuff-countdown {
  position: absolute;
  bottom: -1px;
  right: -1px;
  background: rgba(255, 50, 50, 0.9);
  color: #fff;
  font-size: 8px;
  font-weight: bold;
  min-width: 10px;
  height: 10px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1px;
}

/* 单目标怪物DEBUFF放大 */
.monster-card.single-target .debuff-icon {
  width: 24px;
  height: 24px;
}

.monster-card.single-target .debuff-countdown {
  font-size: 9px;
  min-width: 12px;
  height: 12px;
}

/* 伤害数字 */
.damage-numbers {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.damage-number {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8);
  animation: damageFloat 1s ease-out forwards;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 4px;
  border-radius: 4px;
}

.damage-attacker-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  object-fit: cover;
}

.damage-skill-icon {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  object-fit: cover;
}

.damage-weapon-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 10px;
  font-size: 8px;
}

.damage-weapon-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 2px;
}

.damage-value {
  font-size: 9px;
}

.damage-number.critical {
  font-size: 14px;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.8);
}

.damage-number.critical .damage-attacker-icon {
  width: 15px;
  height: 15px;
  border-color: rgba(255, 215, 0, 0.8);
}

.damage-number.critical .damage-skill-icon {
  width: 13px;
  height: 13px;
}

.damage-number.critical .damage-weapon-icon {
  width: 13px;
  height: 13px;
  font-size: 11px;
}

.damage-number.critical .damage-value {
  font-size: 13px;
}

.damage-number.miss {
  font-size: 11px;
  color: #888;
}

/* 技能伤害样式 - 动画持续时间由内联样式控制 */
.damage-number.skill {
  font-size: 11px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
}

.damage-number.skill .damage-value {
  font-size: 12px;
  color: #60b0ff;
}

/* 双倍惩戒伤害标记 */
.double-judgment-badge {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  padding: 1px 3px;
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.8), rgba(103, 58, 183, 0.8));
  border-radius: 3px;
  border: 1px solid rgba(156, 39, 176, 0.6);
  animation: double-judgment-badge-pulse 1s ease-in-out infinite;
}

.double-judgment-icon {
  width: 12px;
  height: 12px;
  margin-right: 2px;
  filter: brightness(1.2);
}

.double-judgment-text {
  font-size: 9px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 4px rgba(156, 39, 176, 1);
}

@keyframes double-judgment-badge-pulse {
  0%, 100% {
    box-shadow: 0 0 4px rgba(156, 39, 176, 0.6);
  }
  50% {
    box-shadow: 0 0 8px rgba(156, 39, 176, 0.9);
  }
}

@keyframes damageFloat {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.8);
  }
  10% {
    opacity: 1;
    transform: translateY(0) scale(1.1);
  }
  20% {
    transform: translateY(-5px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.7);
  }
}

/* Boss血条 */
.boss-hp-overlay {
  position: absolute;
  bottom: -40px;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 8px 12px;
}

.boss-name {
  font-size: 12px;
  color: #ff4444;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
}

.boss-hp-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: visible;
  position: relative;
}

.boss-hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff8888);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.boss-hp-text {
  font-size: 10px;
  color: #fff;
  text-align: center;
  margin-top: 3px;
}

/* 无怪物提示 */
.no-monster-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}

.hint-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.hint-text {
  font-size: 16px;
}

/* 战斗开始提示 */
.battle-start-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.battle-start-hint .hint-content {
  text-align: center;
  padding: 40px;
  background: transparent;
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 16px;
  animation: hintPulse 2s ease-in-out infinite;
}

@keyframes hintPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); }
  50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.4); }
}

.battle-start-hint .hint-icon-large {
  font-size: 64px;
  margin-bottom: 15px;
  animation: swordSwing 1.5s ease-in-out infinite;
}

@keyframes swordSwing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.battle-start-hint .hint-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 10px;
}

.battle-start-hint .hint-desc {
  font-size: 14px;
  color: #888;
}

/* 战斗日志 */
.battle-log {
  display: flex;
  flex-direction: column;
  flex: 1;
  max-height: 800px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-title {
  font-size: 14px;
  color: #ffd700;
  font-weight: bold;
}

.log-clear-btn {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.log-clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.log-entry {
  font-size: 12px;
  padding: 4px 0;
  display: flex;
  gap: 8px;
}

.log-time {
  color: #666;
  flex-shrink: 0;
}

.log-text {
  word-break: break-all;
}

/* 战斗日志滚动条样式 */
.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: #000000;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb {
  background: #8b7355;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #a08060;
}

/* ============ 底部栏 ============ */
.bottom-bar {
  display: flex;
  justify-content: center;
  gap: 15px;
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  height:50px;
}

/* 自动战斗 */
.auto-battle-control {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.auto-battle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.auto-battle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
}

.auto-battle-btn.active {
  background: linear-gradient(135deg, #f44336, #ff5722);
}

.auto-battle-status {
  font-size: 12px;
  color: #888;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.action-btn .btn-icon {
  font-size: 20px;
}

.action-btn .btn-text {
  font-size: 11px;
}

/* ============ 阶段切换动画 ============ */
.stage-transition-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.transition-content {
  text-align: center;
}

.transition-title {
  font-size: 36px;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin-bottom: 20px;
}

.transition-line {
  width: 200px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  margin: 0 auto;
}

/* ============ 悬浮提示 ============ */
.tooltip-popup {
  position: fixed;
  background: rgba(30, 30, 50, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 10px 15px;
  z-index: 1000;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
}

.tooltip-title {
  font-size: 14px;
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 5px;
}

.tooltip-content {
  font-size: 12px;
  color: #fff;
}

/* ============ 过渡动画 ============ */
.enter-dungeon-enter-active,
.enter-dungeon-leave-active {
  transition: opacity 0.5s ease;
}

.enter-dungeon-enter-from,
.enter-dungeon-leave-to {
  opacity: 0;
}

.victory-enter-active,
.victory-leave-active {
  transition: opacity 0.5s ease;
}

.victory-enter-from,
.victory-leave-to {
  opacity: 0;
}

.stage-transition-enter-active,
.stage-transition-leave-active {
  transition: opacity 0.3s ease;
}

.stage-transition-enter-from,
.stage-transition-leave-to {
  opacity: 0;
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}

/* 怪物列表过渡 */
.monster-enter-active,
.monster-leave-active {
  transition: all 0.3s ease;
}

.monster-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.monster-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 伤害数字过渡 - 动画持续时间由内联样式控制 */
.damage-number-enter-active {
  animation: damageFloat 1s ease-out forwards;
}

.damage-number-leave-active {
  transition: opacity 1s;
}

.damage-number-leave-to {
  opacity: 0;
}

/* ============ 响应式设计 ============ */
@media (max-width: 1400px) {
  .team-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1200px) {
  .battle-container {
    flex-direction: column;
  }

  .left-sidebar {
    width: 100%;
    flex-direction: row;
    gap: 15px;
  }

  .left-sidebar .progress-panel {
    flex: 1;
  }

  .left-sidebar .timer-panel {
    width: 150px;
    flex-shrink: 0;
  }

  .stage-indicators {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .stage-dot {
    width: 36px;
    height: 36px;
  }

  .bottom-bar {
    grid-template-columns: 1fr 180px;
  }

  .action-buttons {
    position: fixed;
    right: 15px;
    bottom: 80px;
    flex-direction: column;
  }
  
  .team-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .left-sidebar {
    flex-direction: column;
  }

  .left-sidebar .timer-panel {
    width: 100%;
  }

  .battle-area {
    gap: 10px;
  }
  
  .team-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  .team-member-card {
    padding: 8px 6px;
  }
  
  .team-member-card .member-avatar {
    width: 40px;
    height: 40px;
  }
  
  .team-member-card .member-name {
    font-size: 10px;
  }
  
  .team-member-card .member-hp-bar,
  .team-member-card .member-mp-bar {
    height: 8px;
  }
  
  .team-member-card .bar-text {
    font-size: 6px;
  }

  .battle-log {
    max-height: 200px;
  }

  .bottom-bar {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

@media (max-width: 600px) {
  .dungeon-page {
    padding: 10px;
    padding-bottom: 180px;
  }

  .dungeon-title {
    font-size: 32px;
  }

  .victory-title {
    font-size: 32px;
  }
  
  .team-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .team-member-card .member-avatar {
    width: 36px;
    height: 36px;
  }

  .monster-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  .monster-card.boss {
    grid-column: span 1;
  }

  .stage-dot {
    width: 30px;
    height: 30px;
  }

  .stage-icon {
    width: 18px;
    height: 18px;
  }
}

/* ============ 简化角色面板样式 ============ */
.simple-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.simple-modal-content {
  width: 320px;
  max-width: 90vw;
  padding: 20px;
  border-radius: 16px;
}

.simple-modal-content .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.simple-modal-content .modal-header h3 {
  margin: 0;
  color: #ffd700;
  font-size: 18px;
}

.simple-modal-content .close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.simple-modal-content .close-btn:hover {
  opacity: 1;
}

.character-avatar-section {
  text-align: center;
  margin-bottom: 20px;
}

.character-avatar {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  border: 2px solid rgba(255, 215, 0, 0.3);
  margin-bottom: 10px;
}

.character-name {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 5px;
}

.character-class {
  font-size: 14px;
  color: #888;
}

.character-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #aaa;
}

.stat-value {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.stat-value.gold {
  color: #ffd700;
}

/* 模态框过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .simple-modal-content,
.modal-fade-leave-active .simple-modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .simple-modal-content,
.modal-fade-leave-to .simple-modal-content {
  transform: scale(0.9);
}

/* ============ 角色选择面板 ============ */
.character-select-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.character-select-panel {
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
}

.character-select-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.character-select-panel .panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #ffd700;
}

.character-select-panel .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.character-select-panel .close-btn:hover {
  background: rgba(255, 100, 100, 0.3);
}

.character-select-panel .panel-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 角色选择面板滚动条样式 */
.character-select-panel .panel-body::-webkit-scrollbar {
  width: 6px;
}

.character-select-panel .panel-body::-webkit-scrollbar-track {
  background: #000;
  border-radius: 3px;
}

.character-select-panel .panel-body::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.4);
  border-radius: 3px;
}

.character-select-panel .panel-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.6);
}

.character-select-panel .no-characters {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

.character-select-panel .no-characters p {
  margin: 0 0 8px 0;
}

.character-select-panel .no-characters .hint {
  font-size: 12px;
  color: #666;
}

.character-select-panel .panel-hint {
  font-size: 13px;
  color: #f39c12;
  margin-left: 12px;
}

.character-select-panel .character-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.character-select-panel .character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.character-select-panel .character-item:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
  transform: translateY(-2px);
}

.character-select-panel .character-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(100, 100, 100, 0.2);
  border-color: rgba(255, 0, 0, 0.2);
}

.character-select-panel .character-item.disabled:hover {
  background: rgba(100, 100, 100, 0.2);
  transform: none;
}

.character-select-panel .character-avatar {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid rgba(255, 215, 0, 0.3);
  flex-shrink: 0;
}

.character-select-panel .character-info {
  flex: 1;
  min-width: 0;
}

.character-select-panel .character-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.character-select-panel .character-detail {
  font-size: 12px;
  color: #aaa;
}

.character-select-panel .level-warning {
  font-size: 11px;
  color: #e74c3c;
  margin-top: 2px;
}

/* ============ Buff移除确认面板样式 ============ */
.buff-remove-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.buff-remove-panel {
  position: fixed;
  width: 300px;
  max-width: 90vw;
  background: linear-gradient(145deg, rgba(30, 35, 45, 0.98), rgba(20, 25, 35, 0.98));
  border-radius: 12px;
  border: 1px solid rgba(155, 89, 182, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(155, 89, 182, 0.2);
  z-index: 2001;
}

.buff-remove-panel .panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(155, 89, 182, 0.15), transparent);
  border-bottom: 1px solid rgba(155, 89, 182, 0.2);
  border-radius: 12px 12px 0 0;
  cursor: move;
  user-select: none;
}

.buff-remove-panel .panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #e0e0e0;
}

.buff-remove-panel .close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s;
}

.buff-remove-panel .close-btn:hover {
  background: rgba(231, 76, 60, 0.4);
  transform: scale(1.1);
}

.buff-remove-panel .panel-body {
  padding: 16px;
}

.buff-remove-panel .buff-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.buff-remove-panel .buff-icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 2px solid rgba(155, 89, 182, 0.4);
  object-fit: cover;
}

.buff-remove-panel .buff-details {
  flex: 1;
}

.buff-remove-panel .buff-name {
  font-size: 14px;
  font-weight: bold;
  color: #9b59b6;
  margin-bottom: 4px;
}

.buff-remove-panel .buff-target {
  font-size: 12px;
  color: #aaa;
}

.buff-remove-panel .buff-desc {
  font-size: 12px;
  color: #888;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.buff-remove-panel .panel-actions {
  display: flex;
  gap: 10px;
}

.buff-remove-panel .confirm-btn,
.buff-remove-panel .cancel-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.buff-remove-panel .confirm-btn {
  background: linear-gradient(180deg, #9b59b6, #8e44ad);
  color: white;
}

.buff-remove-panel .confirm-btn:hover {
  background: linear-gradient(180deg, #a569bd, #9b59b6);
  transform: translateY(-1px);
}

.buff-remove-panel .cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.buff-remove-panel .cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ddd;
}

/* ============ 自动战斗脉冲动画 ============ */
/* 玩家头像脉冲动画 */
.dungeon-page.is-auto-battling .team-member-card .member-avatar img {
  animation: player-pulse 0.6s ease-in-out infinite;
}

/* 怪物头像脉冲动画 */
.dungeon-page.is-auto-battling .monster-card .monster-icon {
  animation: monster-pulse 0.5s ease-in-out infinite;
}

/* Boss怪物使用更大的脉冲幅度 */
.dungeon-page.is-auto-battling .monster-card.boss .monster-icon,
.dungeon-page.is-auto-battling .monster-card.elite .monster-icon {
  animation: boss-pulse 0.5s ease-in-out infinite;
}

@keyframes player-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes monster-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes boss-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

/* 攻击时的闪烁效果 */
.team-member-card.attacking .member-avatar img {
  animation: attack-flash 0.3s ease;
}

.monster-card.hit .monster-icon {
  animation: hit-shake 0.2s ease;
}

@keyframes attack-flash {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.5);
  }
}

@keyframes hit-shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}

/* ============ 死亡选择面板样式 ============ */
.death-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10003;
  backdrop-filter: blur(5px);
}

.death-panel {
  background: linear-gradient(145deg, rgba(40, 20, 20, 0.98), rgba(25, 10, 10, 0.98));
  border: 2px solid rgba(180, 50, 50, 0.6);
  border-radius: 16px;
  padding: 40px 50px;
  min-width: 420px;
  max-width: 500px;
  box-shadow: 0 0 40px rgba(200, 50, 50, 0.3), inset 0 0 20px rgba(100, 20, 20, 0.2);
  text-align: center;
}

.death-panel-header {
  margin-bottom: 30px;
}

.death-skull {
  font-size: 64px;
  margin-bottom: 10px;
  animation: death-skull-pulse 2s ease-in-out infinite;
}

@keyframes death-skull-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.death-title {
  font-size: 28px;
  color: #ff4444;
  margin: 0 0 8px 0;
  text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
  font-weight: bold;
}

.death-subtitle {
  font-size: 14px;
  color: #aaa;
  margin: 0;
}

.death-panel-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.death-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 24px;
  border: 2px solid;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  position: relative;
}

.death-btn .btn-icon {
  font-size: 28px;
}

.death-btn .btn-label {
  font-size: 18px;
  font-weight: bold;
}

.death-btn .btn-desc {
  font-size: 12px;
  opacity: 0.7;
}

.death-btn .btn-warning {
  font-size: 11px;
  color: #ff6666;
  margin-top: 2px;
}

.gold-revive-btn {
  background: linear-gradient(145deg, rgba(60, 50, 20, 0.9), rgba(40, 30, 10, 0.9));
  border-color: rgba(255, 200, 50, 0.5);
  color: #ffd700;
}

.gold-revive-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, rgba(80, 65, 25, 0.95), rgba(55, 40, 15, 0.95));
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 15px rgba(255, 200, 50, 0.3);
  transform: translateY(-2px);
}

.gold-revive-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.return-btn {
  background: linear-gradient(145deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.9));
  border-color: rgba(100, 100, 200, 0.4);
  color: #88aaff;
}

.return-btn:hover {
  background: linear-gradient(145deg, rgba(40, 40, 60, 0.95), rgba(25, 25, 45, 0.95));
  border-color: rgba(120, 120, 220, 0.7);
  box-shadow: 0 0 15px rgba(100, 100, 200, 0.3);
  transform: translateY(-2px);
}

/* 死亡面板过渡动画 */
.death-panel-fade-enter-active {
  transition: opacity 0.3s ease;
}

.death-panel-fade-enter-active .death-panel {
  transition: transform 0.3s ease;
}

.death-panel-fade-enter-from {
  opacity: 0;
}

.death-panel-fade-enter-from .death-panel {
  transform: scale(0.8) translateY(20px);
}

.death-panel-fade-leave-active {
  transition: opacity 0.2s ease;
}

.death-panel-fade-leave-to {
opacity: 0;
}

/* ============ 拾取动画消息（居中悬浮） ============ */

/* 动画消息容器 - 浏览器水平居中，从顶部开始依次向下排列 */
.dungeon-animation-messages-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
  gap: 8px;
}

/* 单条动画消息 */
.dungeon-animation-message {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: dungeonPickupMessageAnim 3s ease-in-out forwards;
  pointer-events: auto;
  white-space: nowrap;
}

/* 前缀文本（玩家名称） */
.dungeon-msg-prefix {
  font-weight: bold;
  opacity: 0.95;
}

/* 消息文本 */
.dungeon-msg-text {
  flex: 1;
}

/* 物品拾取 - 绿色 */
.dungeon-animation-message.pickup {
  color: #4CAF50;
}

/* 金币拾取 - 金色发光 */
.dungeon-animation-message.gold {
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6);
}

/* 消息动画 - 从上方滑入，停留后向上淡出 */
@keyframes dungeonPickupMessageAnim {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }

  20% {
    opacity: 1;
    transform: translateY(0);
  }

  80% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}
</style>