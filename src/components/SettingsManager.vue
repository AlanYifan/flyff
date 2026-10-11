<template>
  <!-- 设置模态框 -->
  <div v-if="showSettingsModal" ref="settingsModalRef" class="settings-modal" :style="settingsModalStyle">
      <div class="settings-header" @mousedown="startDrag">
        <h2>游戏设置</h2>
      </div>
      <div class="settings-layout">
        <!-- 左侧导航栏 -->
        <div class="settings-sidebar">
          <div
            v-for="category in settingsCategories"
            :key="category.id"
            :class="['sidebar-item', { active: activeCategory === category.id }]"
            @click="activeCategory = category.id"
          >
            <div class="sidebar-icon">{{ category.icon }}</div>
            <span>{{ category.name }}</span>
          </div>
        </div>

        <!-- 右侧内容区域 -->
        <div class="settings-content-wrapper">
          <!-- 音频设置 -->
          <div v-show="activeCategory === 'audio'" class="settings-content">
            <h3>音乐相关设置</h3>
            <div class="setting-item">
              <label for="bgmVolume">背景音乐：</label>
              <input
                id="bgmVolume"
                v-model="localUserSettings.bgm"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updateVolume"
              />
              <span>{{ Math.round(localUserSettings.bgm * 100) }}%</span>
            </div>
            <div class="setting-item">
              <label for="sfxVolume">玩家音效：</label>
              <input
                id="sfxVolume"
                v-model="localUserSettings.sfx"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updateVolume"
              />
              <span>{{ Math.round(localUserSettings.sfx * 100) }}%</span>
            </div>
            <div class="setting-item">
              <label for="monsterSfxVolume">怪物音效：</label>
              <input
                id="monsterSfxVolume"
                v-model="localUserSettings.monster"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updateVolume"
              />
              <span>{{ Math.round(localUserSettings.monster * 100) }}%</span>
            </div>
            <div class="setting-item">
              <label for="skillSfxVolume">技能音效：</label>
              <input
                id="skillSfxVolume"
                v-model="localUserSettings.skill"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updateVolume"
              />
              <span>{{ Math.round(localUserSettings.skill * 100) }}%</span>
            </div>
            <div class="setting-item">
              <label for="itemSfxVolume">物品音效：</label>
              <input
                id="itemSfxVolume"
                v-model="localUserSettings.item"
                type="range"
                min="0"
                max="1"
                step="0.01"
                @input="updateVolume"
              />
              <span>{{ Math.round(localUserSettings.item * 100) }}%</span>
            </div>
          </div>

          <!-- 怪物设置 -->
          <div v-show="activeCategory === 'monster'" class="settings-content">
            <h3>怪物设置</h3>
            <div class="setting-item">
              <label for="monsterMinLevel">遇怪最小等级：</label>
              <input
                id="monsterMinLevel"
                v-model="localUserSettings.monsterMinLevel"
                type="number"
                min="1"
                max="200"
                title="可设置1-200等级"
                placeholder="推荐当前等级-10"
              />
              <span>{{ localUserSettings.monsterMinLevel }}级</span>
            </div>
            <div class="setting-item">
              <label for="monsterMaxLevel">遇怪最大等级：</label>
              <input
                id="monsterMaxLevel"
                v-model="localUserSettings.monsterMaxLevel"
                type="number"
                min="1"
                max="200"
                title="可设置1-200等级"
                placeholder="推荐最大不超过20级"
              />
              <span>{{ localUserSettings.monsterMaxLevel }}级</span>
            </div>
            <div class="setting-item">
              <label for="monsterDisplayCount">遇怪数量：</label>
              <input
                id="monsterDisplayCount"
                v-model="localUserSettings.monsterDisplayCount"
                type="number"
                min="1"
                max="30"
                title="可设置1-30个怪物"
                @change="onMonsterDisplayCountChange"
              />
              <span>{{ localUserSettings.monsterDisplayCount }}个</span>
            </div>
            <div class="setting-item">
              <label for="monsterBossProbability">遇到BOSS概率：</label>
              <input
                id="monsterBossProbability"
                v-model="localUserSettings.monsterBossProbability"
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                title="控制遇到BOSS/巨型/紫色/超级怪的概率(0%-10%)"
              />
              <span>{{ Math.round((Number(localUserSettings.monsterBossProbability) || 0) * 100) }}%</span>
            </div>
          </div>

          <!-- 显示效果设置 -->
          <div v-show="activeCategory === 'display'" class="settings-content">
            <h3>显示效果设置</h3>
            <div class="setting-item">
              <label>伤害效果:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showDamageEffectModel"
                    type="radio"
                    name="damageEffect"
                    value="show"
                    @change="onDamageEffectChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showDamageEffectModel"
                    type="radio"
                    name="damageEffect"
                    value="hide"
                    @change="onDamageEffectChange('hide')"
                  />
                  不显示
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>经验动画:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showExpAnimationModel"
                    type="radio"
                    name="expAnimation"
                    value="show"
                    @change="onExpAnimationChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showExpAnimationModel"
                    type="radio"
                    name="expAnimation"
                    value="hide"
                    @change="onExpAnimationChange('hide')"
                  />
                  不显示
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>背包装备特效:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showBagEquipmentEffectModel"
                    type="radio"
                    name="bagEquipmentEffect"
                    value="show"
                    @change="onBagEquipmentEffectChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showBagEquipmentEffectModel"
                    type="radio"
                    name="bagEquipmentEffect"
                    value="hide"
                    @change="onBagEquipmentEffectChange('hide')"
                  />
                  不显示
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>节日氛围:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showFestivalEffectModel"
                    type="radio"
                    name="festivalEffect"
                    value="show"
                    @change="onFestivalEffectChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showFestivalEffectModel"
                    type="radio"
                    name="festivalEffect"
                    value="hide"
                    @change="onFestivalEffectChange('hide')"
                  />
                  关闭
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>天气效果:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showWeatherEffectModel"
                    type="radio"
                    name="weatherEffect"
                    value="show"
                    @change="onWeatherEffectChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showWeatherEffectModel"
                    type="radio"
                    name="weatherEffect"
                    value="hide"
                    @change="onWeatherEffectChange('hide')"
                  />
                  关闭
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>NPC显示:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showNpcModel"
                    type="radio"
                    name="npcDisplay"
                    value="show"
                    @change="onNpcDisplayChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showNpcModel"
                    type="radio"
                    name="npcDisplay"
                    value="hide"
                    @change="onNpcDisplayChange('hide')"
                  />
                  隐藏
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>战斗日志:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showBattleLogModel"
                    type="radio"
                    name="battleLogDisplay"
                    value="show"
                    @change="onBattleLogDisplayChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showBattleLogModel"
                    type="radio"
                    name="battleLogDisplay"
                    value="hide"
                    @change="onBattleLogDisplayChange('hide')"
                  />
                  隐藏
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>技能栏:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showSkillBarModel"
                    type="radio"
                    name="skillBarDisplay"
                    value="show"
                    @change="onSkillBarDisplayChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showSkillBarModel"
                    type="radio"
                    name="skillBarDisplay"
                    value="hide"
                    @change="onSkillBarDisplayChange('hide')"
                  />
                  隐藏
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>主题名称:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="themeColorModel"
                    type="radio"
                    name="themeColor"
                    value="classicBlack"
                    @change="onThemeColorChange('classicBlack')"
                  />
                  经典黑
                </label>
                <label>
                  <input
                    v-model="themeColorModel"
                    type="radio"
                    name="themeColor"
                    value="classicWhite"
                    @change="onThemeColorChange('classicWhite')"
                  />
                  经典白
                </label>
                <label>
                  <input
                    v-model="themeColorModel"
                    type="radio"
                    name="themeColor"
                    value="christmas"
                    @change="onThemeColorChange('christmas')"
                  />
                  圣诞节主题
                </label>
                <label>
                  <input
                    v-model="themeColorModel"
                    type="radio"
                    name="themeColor"
                    value="spring"
                    @change="onThemeColorChange('spring')"
                  />
                  春节新年主题
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label for="festivalEffectDensity">节日氛围动画密度:</label>
              <input
                id="festivalEffectDensity"
                v-model.number="festivalEffectDensityModel"
                type="range"
                min="0"
                max="100"
                step="5"
                :disabled="showFestivalEffectModel !== 'show'"
              />
              <span>{{ festivalEffectDensityModel }}%</span>
            </div>
            <div class="setting-item">
              <label for="weatherEffectDensity">天气动画密度:</label>
              <input
                id="weatherEffectDensity"
                v-model.number="weatherEffectDensityModel"
                type="range"
                min="0"
                max="100"
                step="5"
                :disabled="showWeatherEffectModel !== 'show'"
              />
              <span>{{ weatherEffectDensityModel }}%</span>
            </div>
          </div>

          <!-- 日志设置 -->
          <div v-show="activeCategory === 'log'" class="settings-content">
            <h3>日志设置</h3>
            <div class="setting-item">
              <label>日志文字:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showBattleLogTextModel"
                    type="radio"
                    name="battleLogText"
                    value="show"
                    @change="onBattleLogTextChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showBattleLogTextModel"
                    type="radio"
                    name="battleLogText"
                    value="hide"
                    @change="onBattleLogTextChange('hide')"
                  />
                  关闭
                </label>
              </div>
            </div>
            <div class="setting-item">
              <label>日志动画:</label>
              <div class="setting-options">
                <label>
                  <input
                    v-model="showBattleLogAnimationModel"
                    type="radio"
                    name="battleLogAnimation"
                    value="show"
                    @change="onBattleLogAnimationChange('show')"
                  />
                  显示
                </label>
                <label>
                  <input
                    v-model="showBattleLogAnimationModel"
                    type="radio"
                    name="battleLogAnimation"
                    value="hide"
                    @change="onBattleLogAnimationChange('hide')"
                  />
                  关闭
                </label>
              </div>
            </div>
          </div>

          <!-- 自动出售设置 -->
          <div v-show="activeCategory === 'autoSell'" class="settings-content">
            <h3>自动出售设置</h3>
            <div class="setting-item">
              <div class="sell-quality-row">
                <label>自动出售剩余时间:</label>
                <div class="quality-options">
                  <span>{{ autoSellRemainingText }}</span>
                </div>
              </div>
              <div class="sell-quality-row">
                <label>自动出售间隔(秒):</label>
                <div class="quality-options">
                  <input
                    id="autoSellInterval"
                    v-model="localUserSettings.autoSellInterval"
                    type="number"
                    min="5"
                    max="60"
                    @change="onAutoSellIntervalChange"
                  />
                  <span class="interval-hint">(最小5秒)</span>
                </div>
              </div>
              <div class="sell-quality-row">
                <label>武器品级:</label>
                <div class="quality-options">
                  <input
                    id="autoSellCommonWeapon"
                    v-model="localUserSettings.autoSellCommonWeapon"
                    type="checkbox"
                  />
                  <label for="autoSellCommonWeapon">普通</label>
                  <input
                    id="autoSellUncommonWeapon"
                    v-model="localUserSettings.autoSellUncommonWeapon"
                    type="checkbox"
                  />
                  <label for="autoSellUncommonWeapon">罕见</label>
                  <input
                    id="autoSellRareWeapon"
                    v-model="localUserSettings.autoSellRareWeapon"
                    type="checkbox"
                  />
                  <label for="autoSellRareWeapon">稀有</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>武器强化等级:</label>
                <div class="quality-options enhance-level-options">
                  <input
                    id="autoSellWeaponEnhanceMin"
                    v-model.number="localUserSettings.autoSellWeaponEnhanceMin"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最小"
                  />
                  <span class="enhance-level-separator">~</span>
                  <input
                    id="autoSellWeaponEnhanceMax"
                    v-model.number="localUserSettings.autoSellWeaponEnhanceMax"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最大"
                  />
                  <span class="enhance-level-hint">(0~10, 留空表示不限)</span>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>装备品级:</label>
                <div class="quality-options">
                  <input
                    id="autoSellCommonEquip"
                    v-model="localUserSettings.autoSellCommonEquip"
                    type="checkbox"
                  />
                  <label for="autoSellCommonEquip">普通</label>
                  <input
                    id="autoSellUncommonEquip"
                    v-model="localUserSettings.autoSellUncommonEquip"
                    type="checkbox"
                  />
                  <label for="autoSellUncommonEquip">罕见</label>
                  <input
                    id="autoSellRareEquip"
                    v-model="localUserSettings.autoSellRareEquip"
                    type="checkbox"
                  />
                  <label for="autoSellRareEquip">稀有</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>防具强化等级:</label>
                <div class="quality-options enhance-level-options">
                  <input
                    id="autoSellEquipEnhanceMin"
                    v-model.number="localUserSettings.autoSellEquipEnhanceMin"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最小"
                  />
                  <span class="enhance-level-separator">~</span>
                  <input
                    id="autoSellEquipEnhanceMax"
                    v-model.number="localUserSettings.autoSellEquipEnhanceMax"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最大"
                  />
                  <span class="enhance-level-hint">(0~10, 留空表示不限)</span>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>穿洞卡片:</label>
                <div class="quality-options">
                  <input
                    id="autoSell2PercentCard"
                    v-model="localUserSettings.autoSell2PercentCard"
                    type="checkbox"
                  />
                  <label for="autoSell2PercentCard">2%卡片</label>
                  <input
                    id="autoSell3PercentCard"
                    v-model="localUserSettings.autoSell3PercentCard"
                    type="checkbox"
                  />
                  <label for="autoSell3PercentCard">3%卡片</label>
                  <input
                    id="autoSell4PercentCard"
                    v-model="localUserSettings.autoSell4PercentCard"
                    type="checkbox"
                  />
                  <label for="autoSell4PercentCard">4%卡片</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>元素卡片:</label>
                <div class="quality-options">
                  <input
                    id="autoSellElementCard1to5"
                    v-model="localUserSettings.autoSellElementCard1to5"
                    type="checkbox"
                  />
                  <label for="autoSellElementCard1to5">1-5级</label>
                  <input
                    id="autoSellElementCard6to10"
                    v-model="localUserSettings.autoSellElementCard6to10"
                    type="checkbox"
                  />
                  <label for="autoSellElementCard6to10">6-10级</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>战栗品:</label>
                <div class="quality-options">
                  <input
                    id="autoSellAllShiver"
                    v-model="localUserSettings.autoSellAllShiver"
                    type="checkbox"
                  />
                  <label for="autoSellAllShiver">所有战栗品</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>HP道具:</label>
                <div class="quality-options hp-options">
                  <input id="autoSellHp6401" v-model="localUserSettings.autoSellHp6401" type="checkbox" />
                  <label for="autoSellHp6401">橙汁</label>
                  <input id="autoSellHp5325" v-model="localUserSettings.autoSellHp5325" type="checkbox" />
                  <label for="autoSellHp5325">棒棒糖</label>
                  <input id="autoSellHp7494" v-model="localUserSettings.autoSellHp7494" type="checkbox" />
                  <label for="autoSellHp7494">草莓圣代</label>
                  <input id="autoSellHp7883" v-model="localUserSettings.autoSellHp7883" type="checkbox" />
                  <label for="autoSellHp7883">肉串</label>
                  <input id="autoSellHp9449" v-model="localUserSettings.autoSellHp9449" type="checkbox" />
                  <label for="autoSellHp9449">饼干</label>
                  <input id="autoSellHp3735" v-model="localUserSettings.autoSellHp3735" type="checkbox" />
                  <label for="autoSellHp3735">凤梨冰</label>
                  <input id="autoSellHp6176" v-model="localUserSettings.autoSellHp6176" type="checkbox" />
                  <label for="autoSellHp6176">烤肉</label>
                  <input id="autoSellHp2940" v-model="localUserSettings.autoSellHp2940" type="checkbox" />
                  <label for="autoSellHp2940">巧克力棒</label>
                  <input id="autoSellHp1423" v-model="localUserSettings.autoSellHp1423" type="checkbox" />
                  <label for="autoSellHp1423">香蕉棒棒冰</label>
                  <input id="autoSellHp8470" v-model="localUserSettings.autoSellHp8470" type="checkbox" />
                  <label for="autoSellHp8470">海鲜煎饼</label>
                  <input id="autoSellHp209" v-model="localUserSettings.autoSellHp209" type="checkbox" />
                  <label for="autoSellHp209">果汁</label>
                  <input id="autoSellHp5085" v-model="localUserSettings.autoSellHp5085" type="checkbox" />
                  <label for="autoSellHp5085">牛奶</label>
                  <input id="autoSellHp4502" v-model="localUserSettings.autoSellHp4502" type="checkbox" />
                  <label for="autoSellHp4502">海鲜汤</label>
                  <input id="autoSellHp5443" v-model="localUserSettings.autoSellHp5443" type="checkbox" />
                  <label for="autoSellHp5443">面包</label>
                  <input id="autoSellHp1671" v-model="localUserSettings.autoSellHp1671" type="checkbox" />
                  <label for="autoSellHp1671">水果冰</label>
                  <input id="autoSellHp1566" v-model="localUserSettings.autoSellHp1566" type="checkbox" />
                  <label for="autoSellHp1566">火锅</label>
                  <input id="autoSellHp542" v-model="localUserSettings.autoSellHp542" type="checkbox" />
                  <label for="autoSellHp542">热狗</label>
                  <input id="autoSellHp6972" v-model="localUserSettings.autoSellHp6972" type="checkbox" />
                  <label for="autoSellHp6972">水果冰淇淋</label>
                  <input id="autoSellHp5772" v-model="localUserSettings.autoSellHp5772" type="checkbox" />
                  <label for="autoSellHp5772">海鲜炖汤</label>
                  <input id="autoSellHp4388" v-model="localUserSettings.autoSellHp4388" type="checkbox" />
                  <label for="autoSellHp4388">馅饼</label>
                  <input id="autoSellHp8536" v-model="localUserSettings.autoSellHp8536" type="checkbox" />
                  <label for="autoSellHp8536">水果布丁</label>
                  <input id="autoSellHp7536" v-model="localUserSettings.autoSellHp7536" type="checkbox" />
                  <label for="autoSellHp7536">海鲜</label>
                  <input id="autoSellHp1124" v-model="localUserSettings.autoSellHp1124" type="checkbox" />
                  <label for="autoSellHp1124">寿司卷</label>
                  <input id="autoSellHp4493" v-model="localUserSettings.autoSellHp4493" type="checkbox" />
                  <label for="autoSellHp4493">鸡腿</label>
                  <input id="autoSellHp257" v-model="localUserSettings.autoSellHp257" type="checkbox" />
                  <label for="autoSellHp257">冰淇淋蛋糕</label>
                  <input id="autoSellHp4683" v-model="localUserSettings.autoSellHp4683" type="checkbox" />
                  <label for="autoSellHp4683">星星糖</label>
                  <input id="autoSellHp9890" v-model="localUserSettings.autoSellHp9890" type="checkbox" />
                  <label for="autoSellHp9890">肉沙拉</label>
                  <input id="autoSellHp4503" v-model="localUserSettings.autoSellHp4503" type="checkbox" />
                  <label for="autoSellHp4503">海鲜披萨</label>
                  <input id="autoSellHp4160" v-model="localUserSettings.autoSellHp4160" type="checkbox" />
                  <label for="autoSellHp4160">混合果汁</label>
                  <input id="autoSellHp1391" v-model="localUserSettings.autoSellHp1391" type="checkbox" />
                  <label for="autoSellHp1391">浓汤</label>
                  <input id="autoSellHp11682" v-model="localUserSettings.autoSellHp11682" type="checkbox" />
                  <label for="autoSellHp11682">风味咖喱</label>
                  <input id="autoSellHp15113" v-model="localUserSettings.autoSellHp15113" type="checkbox" />
                  <label for="autoSellHp15113">金枪鱼寿司</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>MP道具:</label>
                <div class="quality-options mp-options">
                  <input id="autoSellMp7809" v-model="localUserSettings.autoSellMp7809" type="checkbox" />
                  <label for="autoSellMp7809">魔力多(小)</label>
                  <input id="autoSellMp8840" v-model="localUserSettings.autoSellMp8840" type="checkbox" />
                  <label for="autoSellMp8840">魔力多(中)</label>
                  <input id="autoSellMp3868" v-model="localUserSettings.autoSellMp3868" type="checkbox" />
                  <label for="autoSellMp3868">魔力多(大)</label>
                  <input id="autoSellMp5933" v-model="localUserSettings.autoSellMp5933" type="checkbox" />
                  <label for="autoSellMp5933">强化魔力多(小)</label>
                  <input id="autoSellMp4758" v-model="localUserSettings.autoSellMp4758" type="checkbox" />
                  <label for="autoSellMp4758">强化魔力多(中)</label>
                  <input id="autoSellMp4700" v-model="localUserSettings.autoSellMp4700" type="checkbox" />
                  <label for="autoSellMp4700">强化魔力多(大)</label>
                  <input id="autoSellMp3872" v-model="localUserSettings.autoSellMp3872" type="checkbox" />
                  <label for="autoSellMp3872">特调魔力多(小)</label>
                  <input id="autoSellMp8161" v-model="localUserSettings.autoSellMp8161" type="checkbox" />
                  <label for="autoSellMp8161">特调魔力多(中)</label>
                  <input id="autoSellMp2834" v-model="localUserSettings.autoSellMp2834" type="checkbox" />
                  <label for="autoSellMp2834">特调魔力多(大)</label>
                  <input id="autoSellMp6234" v-model="localUserSettings.autoSellMp6234" type="checkbox" />
                  <label for="autoSellMp6234">终极魔力多</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>FP道具:</label>
                <div class="quality-options">
                  <input id="autoSellFp100" v-model="localUserSettings.autoSellFp100" type="checkbox" />
                  <label for="autoSellFp100">活力饮料100</label>
                  <input id="autoSellFp200" v-model="localUserSettings.autoSellFp200" type="checkbox" />
                  <label for="autoSellFp200">活力饮料200</label>
                  <input id="autoSellFp300" v-model="localUserSettings.autoSellFp300" type="checkbox" />
                  <label for="autoSellFp300">活力饮料300</label>
                  <input id="autoSellFp400" v-model="localUserSettings.autoSellFp400" type="checkbox" />
                  <label for="autoSellFp400">活力饮料400</label>
                  <input id="autoSellFp500" v-model="localUserSettings.autoSellFp500" type="checkbox" />
                  <label for="autoSellFp500">活力饮料500</label>
                  <input id="autoSellFp600" v-model="localUserSettings.autoSellFp600" type="checkbox" />
                  <label for="autoSellFp600">活力饮料600</label>
                  <input id="autoSellFp700" v-model="localUserSettings.autoSellFp700" type="checkbox" />
                  <label for="autoSellFp700">活力饮料700</label>
                  <input id="autoSellFp800" v-model="localUserSettings.autoSellFp800" type="checkbox" />
                  <label for="autoSellFp800">活力饮料800</label>
                  <input id="autoSellFp900" v-model="localUserSettings.autoSellFp900" type="checkbox" />
                  <label for="autoSellFp900">活力饮料900</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>宠物蛋:</label>
                <div class="quality-options">
                  <input
                    id="autoSellPetEgg"
                    v-model="localUserSettings.autoSellPetEgg"
                    type="checkbox"
                  />
                  <label for="autoSellPetEgg">宠物蛋</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>首饰:</label>
                <div class="quality-options">
                  <input
                    id="autoSellCommonJewelry"
                    v-model="localUserSettings.autoSellCommonJewelry"
                    type="checkbox"
                  />
                  <label for="autoSellCommonJewelry">普通</label>
                  <input
                    id="autoSellUncommonJewelry"
                    v-model="localUserSettings.autoSellUncommonJewelry"
                    type="checkbox"
                  />
                  <label for="autoSellUncommonJewelry">罕见</label>
                  <input
                    id="autoSellRareJewelry"
                    v-model="localUserSettings.autoSellRareJewelry"
                    type="checkbox"
                  />
                  <label for="autoSellRareJewelry">稀有</label>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>首饰强化等级:</label>
                <div class="quality-options enhance-level-options">
                  <input
                    id="autoSellJewelryEnhanceMin"
                    v-model.number="localUserSettings.autoSellJewelryEnhanceMin"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最小"
                  />
                  <span class="enhance-level-separator">~</span>
                  <input
                    id="autoSellJewelryEnhanceMax"
                    v-model.number="localUserSettings.autoSellJewelryEnhanceMax"
                    type="number"
                    min="0"
                    max="10"
                    class="enhance-level-input"
                    placeholder="最大"
                  />
                  <span class="enhance-level-hint">(0~10, 留空表示不限)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 自动恢复设置 -->
          <div v-show="activeCategory === 'autoRecovery'" class="settings-content">
            <h3>自动恢复设置</h3>
            <div class="setting-item">
              <div class="sell-quality-row">
                <label>自动恢复剩余时间:</label>
                <div class="quality-options">
                  <span>{{ autoRecoveryRemainingText }}</span>
                </div>
              </div>
              <div class="sell-quality-row">
                <label>回复设置间隔(秒):</label>
                <div class="quality-options">
                  <input
                    id="autoRecoveryInterval"
                    v-model="localUserSettings.autoRecoveryInterval"
                    type="number"
                    min="2"
                    max="60"
                    @change="onAutoRecoveryIntervalChange"
                  />
                  <span class="interval-hint">(最小2秒)</span>
                </div>
              </div>
              <div class="sell-quality-row">
                <label>HP恢复设置:</label>
                <div class="quality-options">
                  <input
                    id="autoHpRecoveryPercent"
                    v-model="localUserSettings.autoHpRecoveryPercent"
                    type="range"
                    min="1"
                    max="100"
                    @input="onHpRecoveryPercentChange"
                  />
                  <span id="hpPercentValue">{{ localUserSettings.autoHpRecoveryPercent }}%</span>
                </div>
              </div>

              <div class="sell-quality-row">
                <label>MP恢复设置:</label>
                <div class="quality-options">
                  <input
                    id="autoMpRecoveryPercent"
                    v-model="localUserSettings.autoMpRecoveryPercent"
                    type="range"
                    min="1"
                    max="100"
                    @input="onMpRecoveryPercentChange"
                  />
                  <span id="mpPercentValue">{{ localUserSettings.autoMpRecoveryPercent }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-footer">
        <button class="save-button" @click="saveSettings">保存设置</button>
        <button class="close-button settings-close-button" @click="closeSettingsModal">关闭</button>
      </div>
      <div class="resize-handle resize-handle-top" @mousedown="startResize($event, 'top')" />
      <div class="resize-handle resize-handle-right" @mousedown="startResize($event, 'right')" />
      <div class="resize-handle resize-handle-bottom" @mousedown="startResize($event, 'bottom')" />
      <div class="resize-handle resize-handle-left" @mousedown="startResize($event, 'left')" />
      <div
        class="resize-handle resize-handle-corner resize-handle-top-left"
        @mousedown="startResize($event, 'top-left')"
      />
      <div
        class="resize-handle resize-handle-corner resize-handle-top-right"
        @mousedown="startResize($event, 'top-right')"
      />
      <div
        class="resize-handle resize-handle-corner resize-handle-bottom-left"
        @mousedown="startResize($event, 'bottom-left')"
      />
      <div
        class="resize-handle resize-handle-corner resize-handle-bottom-right"
        @mousedown="startResize($event, 'bottom-right')"
      />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted, nextTick, watch } from 'vue'
import { useGameStore } from '@/store'

const props = defineProps({
  gameInitializer: {
    type: Object,
    required: false,
    default: null
  },
  autoBattleService: {
    type: Object,
    required: false,
    default: null
  },
  addBattleLog: {
    type: Function,
    required: true
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
})

const gameStore = useGameStore()

const autoRecoveryBuff = computed(() => {
  if (!gameStore.player || !gameStore.player.activeBuffs) {
    return null
  }
  return gameStore.player.activeBuffs.find(buff => buff.id === 1276) || null
})

const autoSellBuff = computed(() => {
  if (!gameStore.player || !gameStore.player.activeBuffs) {
    return null
  }
  return gameStore.player.activeBuffs.find(buff => buff.id === 1277) || null
})

const autoRecoveryRemainingText = computed(() => {
  if (!autoRecoveryBuff.value) {
    return '未激活'
  }
  return '激活中'
})

const autoSellRemainingText = computed(() => {
  if (!autoSellBuff.value) {
    return '未激活'
  }
  return '激活中'
})

// 定义emits
const emit = defineEmits(['update:showSettingsModal', 'update:user-settings', 'settings-saved'])

// 响应式数据
const showSettingsModal = defineModel('showSettingsModal', { type: Boolean, default: false })

const settingsModalRef = ref(null)
const settingsPanelSize = ref({
  width: 800,
  height: 720
})
const settingsPanelPosition = ref({
  x: 0,
  y: 0
})

const settingsModalStyle = computed(() => ({
  width: `${settingsPanelSize.value.width}px`,
  height: `${settingsPanelSize.value.height}px`,
  left: `${settingsPanelPosition.value.x}px`,
  top: `${settingsPanelPosition.value.y}px`,
  transform: 'none'
}))

const isDragging = ref(false)
const dragStart = ref({
  x: 0,
  y: 0,
  left: 0,
  top: 0
})

function startDrag (event) {
  if (isResizing.value) {
    return
  }
  if (event.button !== 0) {
    return
  }

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: settingsPanelPosition.value.x,
    top: settingsPanelPosition.value.y
  }

  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', stopDrag)

  event.preventDefault()
}

function handleDragMove (event) {
  if (!isDragging.value) {
    return
  }

  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y

  settingsPanelPosition.value = {
    x: Math.round(dragStart.value.left + dx),
    y: Math.round(dragStart.value.top + dy)
  }

  clampSettingsPanelToViewport()
}

function stopDrag () {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

const isResizing = ref(false)
const resizeStart = ref({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  handle: 'bottom-right'
})

function clampSettingsPanelToViewport () {
  const padding = 10
  const maxLeft = Math.max(padding, window.innerWidth - settingsPanelSize.value.width - padding)
  const maxTop = Math.max(padding, window.innerHeight - settingsPanelSize.value.height - padding)

  const left = Math.min(maxLeft, Math.max(padding, settingsPanelPosition.value.x))
  const top = Math.min(maxTop, Math.max(padding, settingsPanelPosition.value.y))

  settingsPanelPosition.value = {
    x: Math.round(left),
    y: Math.round(top)
  }
}

function initSettingsPanelGeometry () {
  const padding = 10
  const availableWidth = Math.max(320, window.innerWidth - padding * 2)
  const availableHeight = Math.max(320, window.innerHeight - padding * 2)
  const minWidth = Math.min(560, availableWidth)
  const minHeight = Math.min(420, availableHeight)
  const maxWidth = availableWidth
  const maxHeight = availableHeight

  if (!settingsPanelPosition.value.x && !settingsPanelPosition.value.y) {
    const isSmallScreen = window.innerWidth <= 768
    const initialWidth = isSmallScreen ? Math.floor(window.innerWidth * 0.95) : settingsPanelSize.value.width
    const initialHeight = isSmallScreen ? Math.floor(window.innerHeight * 0.95) : settingsPanelSize.value.height

    settingsPanelSize.value = {
      width: Math.min(maxWidth, Math.max(minWidth, initialWidth)),
      height: Math.min(maxHeight, Math.max(minHeight, initialHeight))
    }

    settingsPanelPosition.value = {
      x: Math.round((window.innerWidth - settingsPanelSize.value.width) / 2),
      y: Math.round((window.innerHeight - settingsPanelSize.value.height) / 2)
    }
  } else {
    settingsPanelSize.value = {
      width: Math.min(maxWidth, Math.max(minWidth, settingsPanelSize.value.width)),
      height: Math.min(maxHeight, Math.max(minHeight, settingsPanelSize.value.height))
    }
  }

  clampSettingsPanelToViewport()
}

if (typeof window !== 'undefined') {
  initSettingsPanelGeometry()
}

function startResize (event, handle) {
  if (!settingsModalRef.value) {
    return
  }

  isResizing.value = true
  const rect = settingsModalRef.value.getBoundingClientRect()
  resizeStart.value = {
    x: event.clientX,
    y: event.clientY,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    handle: handle || 'bottom-right'
  }

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', stopResize)

  event.preventDefault()
  event.stopPropagation()
}

function handleResizeMove (event) {
  if (!isResizing.value) {
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
  }
  if (handle.includes('bottom')) {
    nextHeight = resizeStart.value.height + dy
  }
  if (handle.includes('top')) {
    nextHeight = resizeStart.value.height - dy
  }

  const padding = 10
  const availableWidth = Math.max(320, window.innerWidth - padding * 2)
  const availableHeight = Math.max(320, window.innerHeight - padding * 2)
  const minWidth = Math.min(560, availableWidth)
  const minHeight = Math.min(420, availableHeight)
  const maxWidth = availableWidth
  const maxHeight = availableHeight

  nextWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth))
  nextHeight = Math.min(maxHeight, Math.max(minHeight, nextHeight))

  if (handle.includes('left')) {
    nextLeft = resizeStart.value.left + (resizeStart.value.width - nextWidth)
  }
  if (handle.includes('top')) {
    nextTop = resizeStart.value.top + (resizeStart.value.height - nextHeight)
  }

  settingsPanelSize.value = {
    width: Math.round(nextWidth),
    height: Math.round(nextHeight)
  }
  settingsPanelPosition.value = {
    x: Math.round(nextLeft),
    y: Math.round(nextTop)
  }

  clampSettingsPanelToViewport()
}

function stopResize () {
  if (!isResizing.value) {
    return
  }
  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
}

// 设置分类
const settingsCategories = [
  { id: 'audio', name: '音乐设置', icon: '🎵' },
  { id: 'monster', name: '怪物设置', icon: '👾' },
  { id: 'display', name: '显示设置', icon: '🎨' },
  { id: 'log', name: '日志设置', icon: '📜' },
  { id: 'autoSell', name: '自动出售', icon: '💰' },
  { id: 'autoRecovery', name: '自动恢复', icon: '❤️' }
]

const activeCategory = ref('audio')

// 初始化userSettings，使用空对象，然后在loadSettings中从SettingsService加载实际设置
// 注意：我们不使用props.userSettings的默认值，因为SettingsService会提供正确的默认值和用户设置
const localUserSettings = ref({})

// 为显示效果设置创建计算属性
const showDamageEffectModel = computed({
  get: () => {
    return localUserSettings.value.showDamageEffect !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showDamageEffect = value === 'show'
  }
})

const showExpAnimationModel = computed({
  get: () => {
    return localUserSettings.value.showExpAnimation !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showExpAnimation = value === 'show'
  }
})

const showBagEquipmentEffectModel = computed({
  get: () => {
    return localUserSettings.value.showBagEquipmentEffect !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showBagEquipmentEffect = value === 'show'
  }
})

const showBattleLogTextModel = computed({
  get: () => {
    return localUserSettings.value.showBattleLogText !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showBattleLogText = value === 'show'
  }
})

const showBattleLogAnimationModel = computed({
  get: () => {
    return localUserSettings.value.showBattleLogAnimation !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showBattleLogAnimation = value === 'show'
  }
})

const showFestivalEffectModel = computed({
  get: () => {
    return localUserSettings.value.showFestivalEffect !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showFestivalEffect = value === 'show'
  }
})

const showWeatherEffectModel = computed({
  get: () => {
    return localUserSettings.value.showWeatherEffect !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showWeatherEffect = value === 'show'
  }
})

const showNpcModel = computed({
  get: () => {
    return localUserSettings.value.showNpc !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showNpc = value === 'show'
  }
})

const showBattleLogModel = computed({
  get: () => {
    return localUserSettings.value.showBattleLog !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showBattleLog = value === 'show'
  }
})

const showSkillBarModel = computed({
  get: () => {
    return localUserSettings.value.showSkillBar !== false ? 'show' : 'hide'
  },
  set: value => {
    localUserSettings.value.showSkillBar = value === 'show'
  }
})

const themeColorModel = computed({
  get: () => {
    const themeColor = localUserSettings.value.themeColor
    if (!themeColor || themeColor === 'default') {
      return 'classicBlack'
    }
    return themeColor
  },
  set: value => {
    localUserSettings.value.themeColor = value
  }
})

const festivalEffectDensityModel = computed({
  get: () => {
    const density = Number(localUserSettings.value.festivalEffectDensity)
    return Number.isFinite(density) ? density : 50
  },
  set: value => {
    localUserSettings.value.festivalEffectDensity = Number(value)
  }
})

const weatherEffectDensityModel = computed({
  get: () => {
    const density = Number(localUserSettings.value.weatherEffectDensity)
    return Number.isFinite(density) ? density : 50
  },
  set: value => {
    localUserSettings.value.weatherEffectDensity = Number(value)
  }
})

// 监听props变化并更新本地设置
watch(
  () => props.userSettings,
  newVal => {
    if (newVal && settingsLoaded) {
      // 只在设置已加载后才更新，避免初始化时覆盖用户修改
      localUserSettings.value = { ...localUserSettings.value, ...newVal }
    }
  },
  { immediate: false, deep: true }
)

// 设置加载标志
let settingsLoaded = false

// 修改loadSettings函数，在加载完成后设置标志
const loadSettings = async () => {
  try {
    // 从SettingsService加载设置
    let loadedSettings = {}

    // 如果gameInitializer存在但settingsService暂时不可用，等待一段时间再检查
    if (props.gameInitializer) {
      // 检查settingsService是否存在，如果不存在则等待
      let attempts = 0
      while (!props.gameInitializer.services?.settings && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (props.gameInitializer.services?.settings) {
        loadedSettings = props.gameInitializer.services.settings.loadUserSettings()
      } else {
        // 备用方案：从localStorage加载
        const savedUserSettings = localStorage.getItem('userSettings')

        if (savedUserSettings) {
          loadedSettings = { ...loadedSettings, ...JSON.parse(savedUserSettings) }
        }
      }
    } else {
      // 备用方案：从localStorage加载
      const savedUserSettings = localStorage.getItem('userSettings')

      if (savedUserSettings) {
        loadedSettings = { ...loadedSettings, ...JSON.parse(savedUserSettings) }
      }
    }

    // 直接应用从SettingsService加载的用户设置
    // 注意：loadedSettings已经包含了默认设置和用户设置的合并结果
    // 音量设置已经包含在loadedSettings中（bgm, sfx, monster）

    for (const [key, value] of Object.entries(loadedSettings)) {
      if (value !== undefined && value !== null) {
        localUserSettings.value[key] = value
      }
    }

    // 更新音量
    updateVolume()

    // 设置已加载标志
    settingsLoaded = true

    // 通知父组件设置已加载并更新
    emit('update:user-settings', localUserSettings.value)

    applyThemeToDocument(themeColorModel.value)
  } catch (error) {
    console.error('SettingsManager - 加载设置失败:', error)
  }
}
// 生命周期钩子
onMounted(async () => {
  applyThemeToDocument(themeColorModel.value)
  await loadSettings()
})

// 监听设置面板打开，重新加载设置
watch(
  () => showSettingsModal.value,
  async newVal => {
    if (newVal) {
      loadSettings()
      await nextTick()
      if (typeof window !== 'undefined') {
        initSettingsPanelGeometry()
      }
    }
  }
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', clampSettingsPanelToViewport)
  }
})

onBeforeUnmount(() => {
  stopResize()
  stopDrag()
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', clampSettingsPanelToViewport)
  }
})

// 方法
const openSettingsModal = () => {
  showSettingsModal.value = true
  emit('update:showSettingsModal', true)
}

const closeSettingsModal = () => {
  showSettingsModal.value = false
  emit('update:showSettingsModal', false)

  // 播放点击音效
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }
}

// 处理伤害效果变化
const onDamageEffectChange = value => {
  localUserSettings.value.showDamageEffect = value === 'show'
}

const onExpAnimationChange = value => {
  localUserSettings.value.showExpAnimation = value === 'show'
}

const onBagEquipmentEffectChange = value => {
  localUserSettings.value.showBagEquipmentEffect = value === 'show'
}

const onBattleLogTextChange = value => {
  localUserSettings.value.showBattleLogText = value === 'show'
}

const onBattleLogAnimationChange = value => {
  localUserSettings.value.showBattleLogAnimation = value === 'show'
}

const onFestivalEffectChange = value => {
  localUserSettings.value.showFestivalEffect = value === 'show'
}

const onWeatherEffectChange = value => {
  localUserSettings.value.showWeatherEffect = value === 'show'
}

const onNpcDisplayChange = value => {
  localUserSettings.value.showNpc = value === 'show'
}

const onBattleLogDisplayChange = value => {
  localUserSettings.value.showBattleLog = value === 'show'
}

const onSkillBarDisplayChange = value => {
  localUserSettings.value.showSkillBar = value === 'show'
}

const onThemeColorChange = value => {
  localUserSettings.value.themeColor = value
}

// 处理HP恢复百分比变化
const onHpRecoveryPercentChange = () => {
  // 无需额外处理，因为v-model已经自动更新
}

// 处理MP恢复百分比变化
const onMpRecoveryPercentChange = () => {
  // 无需额外处理，因为v-model已经自动更新
}

// 处理自动出售间隔变化
const onAutoSellIntervalChange = () => {
  const value = Number(localUserSettings.value.autoSellInterval)
  if (!Number.isFinite(value) || value < 5) {
    localUserSettings.value.autoSellInterval = 5
    props.addBattleLog('自动出售间隔最低为5秒，已自动调整', 'warning')
  }
}

// 处理自动回复间隔变化
const onAutoRecoveryIntervalChange = () => {
const value = Number(localUserSettings.value.autoRecoveryInterval)
if (!Number.isFinite(value) || value < 2) {
localUserSettings.value.autoRecoveryInterval = 2
props.addBattleLog('自动回复间隔最低为2秒，已自动调整', 'warning')
}
}

/**
 * 处理遇怪数量输入变化
 * 用途/业务意图：钳制输入值在 1-30 范围内，超过 30 自动修改为 30，低于 1 修改为 1
 * @returns {void}
 */
const onMonsterDisplayCountChange = () => {
  const value = Number(localUserSettings.value.monsterDisplayCount)
  if (!Number.isFinite(value) || value < 1) {
    localUserSettings.value.monsterDisplayCount = 1
  } else if (value > 30) {
    localUserSettings.value.monsterDisplayCount = 30
    props.addBattleLog('遇怪数量最大为30个，已自动调整', 'warning')
  }
}

const saveSettings = async () => {
  if (typeof window !== 'undefined' && window.playClickSound) {
    window.playClickSound()
  }

  try {
    const unifiedSettings = {
      ...localUserSettings.value
    }

    if (props.gameInitializer && props.gameInitializer.services?.settings) {
      let attempts = 0
      while (!props.gameInitializer.services.settings && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (props.gameInitializer.services.settings) {
        await props.gameInitializer.services.settings.saveUserSettings(unifiedSettings)
      } else {
        localStorage.setItem('userSettings', JSON.stringify(unifiedSettings))
      }
    } else {
      localStorage.setItem('userSettings', JSON.stringify(unifiedSettings))
    }

    applyThemeToDocument(unifiedSettings.themeColor)
    updateVolume()

    props.addBattleLog('游戏设置已保存', 'common')

    showSettingsModal.value = false
    emit('update:showSettingsModal', false)

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    emit('update:user-settings', localUserSettings.value)
    emit('settings-saved')
  } catch (error) {
    console.error('保存设置失败:', error)
    props.addBattleLog('保存设置失败', 'error')
    emit('error', '保存设置失败')
  }
}

const applyThemeToDocument = themeColor => {
  if (typeof document === 'undefined') {
    return
  }

  const rawThemeKey = themeColor || 'classicBlack'
  const themeKey = rawThemeKey === 'default' ? 'classicBlack' : rawThemeKey || 'classicBlack'
  const themes = {
    // 经典黑色主题
    classicBlack: {
      '--theme-section-bg': '#000000',
      '--theme-panel-bg': '#000000',
      '--theme-modal-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-content-bg': '#000000',
      '--theme-item-bg': '#000000',
      '--theme-text': '#ffffff',
      '--theme-muted': '#ffffff',
      '--theme-text-inverse': '#ffffff',
      '--theme-surface': '#000000',
      '--theme-surface-strong': '#000000',
      '--theme-surface-muted': '#000000',
      '--theme-border': '#8b7355',
      '--theme-border-strong': '#8b7355',
      '--theme-button-bg': '#000000',
      '--theme-button-hover': '#000000',
      '--theme-button-text': '#ffffff',
      '--theme-accent': '#ffd700',
      '--theme-accent-strong': '#ffd700',
      '--theme-bag-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-player-detail-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-map-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-npc-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-battle-log-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-battle-section-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-settings-bg': 'rgba(0, 0, 0, 0.8)',
      '--theme-quest-bg': 'rgba(0, 0, 0, 0.8)'
    },
    // 经典白色主题
    classicWhite: {
      '--theme-section-bg': '#ffffff',
      '--theme-panel-bg': '#ffffff',
      '--theme-modal-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-content-bg': '#ffffff',
      '--theme-item-bg': '#ffffff',
      '--theme-text': '#000000',
      '--theme-muted': '#000000',
      '--theme-text-inverse': '#000000',
      '--theme-surface': '#ffffff',
      '--theme-surface-strong': '#ffffff',
      '--theme-surface-muted': '#ffffff',
      '--theme-border': '#8b7355',
      '--theme-border-strong': '#8b7355',
      '--theme-button-bg': '#ffffff',
      '--theme-button-hover': '#ffffff',
      '--theme-button-text': '#000000',
      '--theme-accent': '#ffd700',
      '--theme-accent-strong': '#ffd700',
      '--theme-bag-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-player-detail-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-map-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-npc-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-battle-log-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-battle-section-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-settings-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-quest-bg': 'rgba(255, 255, 255, 0.8)'
    },
    // 圣诞主题
    christmas: {
      '--theme-main-bg': 'rgba(240, 250, 245, 0.92)',
      '--theme-section-bg': 'rgba(255, 255, 255, 0.96)',
      '--theme-panel-bg': '#e5f3e8',
      '--theme-modal-bg': '#f7fff9',
      '--theme-header-bg': '#2f7d4d',
      '--theme-content-bg': '#f1faf3',
      '--theme-item-bg': 'rgba(255, 255, 255, 0.85)',
      '--theme-text': '#1f2a1f',
      '--theme-muted': '#4b5a4b',
      '--theme-text-inverse': '#ffffff',
      '--theme-surface': 'rgba(240, 250, 245, 0.92)',
      '--theme-surface-strong': '#ffffff',
      '--theme-surface-muted': 'rgba(47, 125, 77, 0.8)',
      '--theme-border': 'rgba(47, 125, 77, 0.35)',
      '--theme-border-strong': '#2f7d4d',
      '--theme-button-bg': 'rgba(34, 102, 63, 0.8)',
      '--theme-button-hover': 'rgba(198, 40, 40, 0.75)',
      '--theme-button-text': '#ffffff',
      '--theme-accent': '#2e7d32',
      '--theme-accent-strong': '#c62828'
    },
    //春节主题
    spring: {
      '--theme-main-bg': 'rgba(255, 245, 238, 0.92)',
      '--theme-section-bg': 'rgba(255, 250, 245, 0.96)',
      '--theme-panel-bg': '#ffe9dc',
      '--theme-modal-bg': '#fff4ec',
      '--theme-header-bg': '#b91c1c',
      '--theme-content-bg': '#fff1e6',
      '--theme-item-bg': 'rgba(255, 255, 255, 0.85)',
      '--theme-text': '#3b1d1d',
      '--theme-muted': '#7a4b4b',
      '--theme-text-inverse': '#ffffff',
      '--theme-surface': 'rgba(255, 245, 238, 0.92)',
      '--theme-surface-strong': '#ffffff',
      '--theme-surface-muted': 'rgba(185, 28, 28, 0.08)',
      '--theme-border': 'rgba(185, 28, 28, 0.35)',
      '--theme-border-strong': '#b91c1c',
      '--theme-button-bg': 'rgba(185, 28, 28, 0.8)',
      '--theme-button-hover': 'rgba(234, 179, 8, 0.8)',
      '--theme-button-text': '#ffffff',
      '--theme-accent': '#d97706',
      '--theme-accent-strong': '#b91c1c'
    }
  }

  const selectedTheme = themes[themeKey] || themes.classicBlack
  const root = document.documentElement

  root.setAttribute('data-theme', themeKey)

  Object.entries(selectedTheme).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

// 更新音量
const updateVolume = () => {
  if (
    props.gameInitializer &&
      props.gameInitializer.services &&
      props.gameInitializer.services.audio
  ) {
    props.gameInitializer.services.audio.setAllVolumes({
      bgm: localUserSettings.value.bgm,
      sfx: localUserSettings.value.sfx,
      monster: localUserSettings.value.monster,
      skill: localUserSettings.value.skill,
      item: localUserSettings.value.item
    })
  }
}

// 暴露方法给父组件
defineExpose({
  openSettingsModal,
  closeSettingsModal,
  loadSettings,
  saveSettings
})
</script>

<style scoped>
  .settings-modal {
    background: var(--theme-modal-bg);
    border: 1px solid var(--theme-border-strong);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    width: clamp(600px, 80vw, 1200px);
    max-height: 90vh;
    overflow: hidden;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    min-height: 320px;
    color: var(--theme-text);
  }

  .settings-modal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.15);
    pointer-events: none;
    border-radius: 8px;
  }

  .settings-modal::after {
    content: '';
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    border: 1px solid var(--theme-border);
    border-radius: 6px;
    pointer-events: none;
  }

  .settings-header {
    background: transparent;
    padding: 14px 20px;
    border-bottom: 1px solid var(--theme-border-strong);
    border-radius: 8px 8px 0 0;
    position: relative;
    cursor: move;
  }

  .settings-header::before {
    content: '⚙️';
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
  }

  .settings-header::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--theme-border);
    border-radius: 8px 8px 0 0;
  }

  .settings-header h2 {
    margin: 0;
    color: var(--theme-accent);
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 0.5px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .settings-layout {
    display: flex;
    flex: 1;
    min-height: 0;
    background: var(--theme-content-bg);
  }

  .settings-sidebar {
    min-height: 0;
    background: rgba(0, 0, 0, 0.2);
    border-right: 1px solid var(--theme-border-strong);
    overflow-y: auto;
    flex-shrink: 0;
  }

  .settings-sidebar::-webkit-scrollbar {
    width: 6px;
  }

  .settings-sidebar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  .settings-sidebar::-webkit-scrollbar-thumb {
    background: var(--theme-border);
    border-radius: 3px;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    color: var(--theme-muted);
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    border-left: 2px solid transparent;
    margin-bottom: 2px;
    position: relative;
    border-radius: 0 4px 4px 0;
    background: transparent;
    font-weight: bold;
    font-size: 13px;
  }

  .sidebar-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: rgba(255, 255, 255, 0.05);
    transition: width 0.2s;
  }

  .sidebar-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-left-color: var(--theme-accent);
    color: var(--theme-text);
  }

  .sidebar-item:hover::before {
    width: 100%;
  }

  .sidebar-item.active {
    background: rgba(255, 255, 255, 0.08);
    border-left-color: var(--theme-accent);
    color: var(--theme-accent);
    font-weight: bold;
  }

  .sidebar-item.active::before {
    width: 100%;
  }

  .sidebar-icon {
    margin-right: 10px;
    font-size: 18px;
    width: 24px;
    text-align: center;
    transition: transform 0.15s ease;
  }

  .sidebar-item:hover .sidebar-icon,
  .sidebar-item.active .sidebar-icon {
    transform: scale(1.1);
  }

  .sidebar-item span {
    font-size: 13px;
    letter-spacing: 0.3px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .settings-content-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background: transparent;
  }

  .settings-content-wrapper::-webkit-scrollbar {
    width: 8px;
  }

  .settings-content-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  .settings-content-wrapper::-webkit-scrollbar-thumb {
    background: var(--theme-border);
    border-radius: 4px;
  }

  .settings-content-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--theme-border-strong);
  }

  .settings-content {
    padding: clamp(12px, 1.5vw, 20px);
  }

  .settings-content h3 {
    margin: 0 0 16px 0;
    color: var(--theme-accent);
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--theme-border-strong);
    padding-bottom: 8px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative;
    padding-left: 28px;
  }

  .settings-content h3::before {
    content: '📋';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
  }

  .settings-section {
    margin-bottom: 16px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--theme-border);
    border-radius: 6px;
    padding: 14px;
    position: relative;
  }

  .settings-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--theme-border);
    border-radius: 6px 6px 0 0;
  }

  .setting-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    border-radius: 4px;
    transition: background 0.2s ease, border-color 0.2s ease;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--theme-border);
    padding: 8px 12px;
  }

  .setting-item:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: var(--theme-border-strong);
  }

  .setting-item label {
    min-width: 90px;
    color: var(--theme-text);
    font-size: 13px;
    letter-spacing: 0.2px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .setting-item input[type='range'] {
    flex: 1;
    margin: 0 12px;
    min-width: 50px;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 3px;
    cursor: pointer;
    border: 1px solid var(--theme-border);
  }

  .setting-item input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: var(--theme-accent);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: transform 0.15s ease;
  }

  .setting-item input[type='range']::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  .setting-item input[type='number'] {
    width: 120px;
    padding: 6px 8px;
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.4);
    color: var(--theme-text);
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .setting-item input[type='number']:focus {
    outline: none;
    border-color: var(--theme-accent);
  }

  .setting-item input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    cursor: pointer;
    accent-color: var(--theme-accent);
  }

  .setting-item input[type='checkbox']:hover {
    transform: scale(1.05);
  }

  .setting-item input[type='radio'] {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    cursor: pointer;
    accent-color: var(--theme-accent);
  }

  .setting-item span {
    min-width: 50px;
    text-align: right;
    color: var(--theme-text);
    font-weight: bold;
    font-size: 13px;
  }

  .setting-options,
  .quality-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }

  .setting-options label,
  .quality-options label {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: var(--theme-muted);
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 3px;
    transition: background 0.2s ease, color 0.2s ease;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    white-space: nowrap;
    min-width: auto;
  }

  /* 自动出售HP/MP道具区域每行显示4个 */
  .hp-options label,
  .mp-options label {
    flex: 0 0 calc(25% - 8px);
    max-width: calc(25% - 8px);
    justify-content: center;
    box-sizing: border-box;
  }

  /* 自动出售区域所有选项每行显示4个 */
  .sell-quality-row .quality-options label {
    flex: 0 0 calc(25% - 8px);
    /* max-width: calc(10% - 8px); */
    justify-content: center;
    box-sizing: border-box;
  }

.setting-options label:hover,
.quality-options label:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--theme-accent);
  }

  .sell-quality-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--theme-border);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .sell-quality-row:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: var(--theme-border-strong);
  }

  .sell-quality-row label:first-child {
    min-width: 90px;
    font-weight: bold;
    color: var(--theme-text);
    font-size: 13px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .sell-quality-row input[type='checkbox'] {
    width: 14px;
    height: 14px;
    cursor: pointer;
    accent-color: var(--theme-accent);
  }

  .sell-quality-row input[type='checkbox']:hover {
    transform: scale(1.1);
  }

  .interval-hint {
    font-size: 11px;
    color: var(--theme-muted);
    margin-left: 8px;
    opacity: 0.7;
  }

  /* 武器强化等级输入框样式 */
  .enhance-level-input {
    width: 60px;
    padding: 5px 8px;
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.4);
    color: var(--theme-text);
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    font-family: inherit;
  }

  .enhance-level-input:focus {
    outline: none;
    border-color: var(--theme-accent);
  }

  .enhance-level-separator {
    color: var(--theme-muted);
    font-size: 14px;
    font-weight: bold;
    margin: 0 4px;
  }

  .enhance-level-hint {
    font-size: 11px;
    color: var(--theme-muted);
    margin-left: 8px;
    opacity: 0.7;
    white-space: nowrap;
  }

  .enhance-level-options {
    gap: 4px !important;
  }

  .setting-options label:hover,
  .quality-options label:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--theme-accent);
  }

  .sell-quality-row:hover {
    background: rgba(255, 255, 255, 0.03);
    border-color: var(--theme-border-strong);
  }

  .sell-quality-row label:first-child {
    min-width: 90px;
    font-weight: bold;
    color: var(--theme-text);
    font-size: 13px;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
 

  .settings-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--theme-border);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    border-radius: 0 0 8px 8px;
    position: relative;
  }

  .resize-handle {
    position: absolute;
    z-index: 20;
    background: transparent;
  }

  .resize-handle-right {
    top: 10px;
    right: 0;
    width: 10px;
    height: calc(100% - 20px);
    cursor: ew-resize;
  }

  .resize-handle-left {
    top: 10px;
    left: 0;
    width: 10px;
    height: calc(100% - 20px);
    cursor: ew-resize;
  }

  .resize-handle-bottom {
    left: 10px;
    bottom: 0;
    height: 10px;
    width: calc(100% - 20px);
    cursor: ns-resize;
  }

  .resize-handle-top {
    left: 10px;
    top: 0;
    height: 10px;
    width: calc(100% - 20px);
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

  .settings-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--theme-border);
    border-radius: 0 0 8px 8px;
  }

  .save-button,
  .close-button {
    padding: 8px 20px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: bold;
    transition: background 0.2s ease, border-color 0.2s ease;
    position: relative;
    overflow: hidden;
    font-family: inherit;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .save-button {
    background: var(--theme-accent);
    color: #000000;
    border-color: var(--theme-accent);
  }

  .save-button::before {
    display: none;
  }

  .save-button:hover {
    opacity: 0.9;
  }

  .close-button {
    background: transparent;
    color: var(--theme-text);
    border: 1px solid var(--theme-border);
  }

  .close-button:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--theme-border-strong);
  }

  /* 设置面板关闭按钮专用样式 */
  .settings-close-button {
    background: transparent;
    color: var(--theme-muted);
    border: 1px solid var(--theme-border);
    width: auto;
    height: auto;
  }

  .settings-close-button:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--theme-text);
    border-color: var(--theme-border-strong);
  }

  .settings-close-button:active {
    background: rgba(255, 255, 255, 0.03);
  }

  .save-button:active,
  .close-button:active {
    opacity: 0.8;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .settings-modal {
      width: 95%;
      max-height: 95vh;
    }

    .settings-layout {
      flex-direction: column;
      height: auto;
    }

    .settings-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid var(--theme-border-strong);
    }

    .sidebar-item {
      padding: 10px 16px;
      margin-bottom: 2px;
    }

    .settings-content-wrapper {
      padding: 12px;
      max-height: 60vh;
    }

    .setting-item {
      flex-direction: column;
      align-items: flex-start;
    }

    .setting-item label {
      margin-bottom: 8px;
      min-width: auto;
    }

    .setting-item input[type='range'] {
      width: 100%;
      margin: 8px 0;
    }

    .setting-options,
    .quality-options {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .sell-quality-row label:first-child {
      margin-bottom: 8px;
    }

    .settings-footer {
      flex-direction: column;
    }

    .save-button,
    .close-button {
      width: 100%;
    }
  }
</style>
