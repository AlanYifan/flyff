<template>
  <Transition name="pet-trainer-fade" appear>
    <div
      v-if="isVisible"
      ref="petTrainerShellRef"
      v-drag="{
        handle: '.panel-header',
        exclude: '.close-button, .help-button',
        onDragStart: handleDragStart,
        onDrag: handleDragMove,
        onDragEnd: handleDragEnd
      }"
      class="pet-trainer-panel"
    >
      <!-- 拉伸手柄 -->
      <PanelResizeHandle />
      <div ref="petTrainerPanelRef" class="pet-trainer-panel__inner" :style="panelScaleStyle">
        <div class="panel-header">
          <div class="npc-info">
            <img :src="npcAvatar" :alt="npcName" class="npc-avatar" draggable="false" />
            <h2>{{ npcName }}</h2>
          </div>
          <button class="help-button" @click="toggleRecipePanel">?</button>
          <button class="close-button" @click="close">×</button>
        </div>
        <div ref="panelMiddleRef" class="panel-middle">
          <div class="panel-menu">
            <button
              v-for="feature in features"
              :key="feature.key"
              class="menu-button"
              :class="{ active: feature.key === activeFeatureKey }"
              @click="selectFeature(feature.key)"
            >
              {{ feature.label }}
            </button>
          </div>
          <div class="panel-right">
            <div class="dialog-area">{{ activeDialog }}</div>
            <div class="panel-content">
            <div v-if="activeFeatureKey === 'candy'" class="candy-panel">
              <div class="candy-top">
                <div class="selector-wrapper">
                  <button class="selector-button" @click="togglePicker('material')">
                    <div class="selector-label">制作材料</div>
                    <div class="selector-preview">
                      <div class="selector-icon-wrapper">
                        <img
                          :src="selectedMaterialIcon"
                          :alt="selectedMaterialLabel"
                          class="selector-icon"
                          draggable="false"
                          @mouseenter="showItemTooltip($event, selectedMaterialId)"
                          @mouseleave="hideItemTooltip"
                          @mousemove="updateTooltipPosition"
                        />
                        <div v-if="selectedMaterialCount" class="selector-count-badge">
                          x{{ selectedMaterialCount }}
                        </div>
                      </div>
                      <div class="selector-value selector-value--with-float">
                        <span class="selector-value-text">{{ selectedMaterialLabel }}</span>
                        <span
                          v-if="materialConsumeAnimVisible"
                          :key="materialConsumeAnimKey"
                          class="consume-float consume-float--material"
                        >
                          {{ materialConsumeAnimText }}
                        </span>
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'material'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel">
                        <div class="selector-panel-title">糖果制作材料选择面板</div>
                        <div v-if="materialOptions.length" class="selector-items">
                          <button
                            v-for="item in materialOptions"
                            :key="item.id"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectMaterial(item.id)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用材料</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-wrapper">
                  <button class="selector-button" @click="togglePicker('candy')">
                    <div class="selector-label">糖果选择</div>
                    <div class="selector-preview">
                      <div class="selector-icon-wrapper">
                        <img
                          :src="selectedCandyIcon"
                          :alt="selectedCandyLabel"
                          class="selector-icon"
                          draggable="false"
                          @mouseenter="showItemTooltip($event, selectedCandyId)"
                          @mouseleave="hideItemTooltip"
                          @mousemove="updateTooltipPosition"
                        />
                        <div v-if="selectedCandyCount" class="selector-count-badge">
                          x{{ selectedCandyCount }}
                        </div>
                      </div>
                      <div class="selector-value selector-value--with-float">
                        <span class="selector-value-text">{{ selectedCandyLabel }}</span>
                        <span
                          v-if="candyConsumeAnimVisible"
                          :key="candyConsumeAnimKey"
                          class="consume-float consume-float--candy"
                        >
                          {{ candyConsumeAnimText }}
                        </span>
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'candy'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel">
                        <div class="selector-panel-title">糖果选择面板</div>
                        <div v-if="candyOptions.length" class="selector-items">
                          <button
                            v-for="item in candyOptions"
                            :key="item.id"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectCandy(item.id)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用糖果</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-wrapper">
                  <div class="selector-button selector-output">
                    <div class="selector-label">合成结果</div>
                    <div class="selector-preview selector-preview--output">
                      <svg
                        v-if="hasResult"
                        class="marquee-border"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="marquee-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#ff4d4f" />
                            <stop offset="25%" stop-color="#ffa940" />
                            <stop offset="50%" stop-color="#fff566" />
                            <stop offset="75%" stop-color="#36cfc9" />
                            <stop offset="100%" stop-color="#4096ff" />
                          </linearGradient>
                        </defs>
                        <rect
                          class="marquee-rect"
                          x="2"
                          y="2"
                          width="96"
                          height="96"
                          rx="6"
                          ry="6"
                          vector-effect="non-scaling-stroke"
                        />
                      </svg>
                      <div class="result-icon-wrapper" :class="{ 'result-icon-wrapper--active': hasResult }">
                        <img
                          :src="resultIcon"
                          :alt="resultLabel"
                          class="selector-icon result-icon"
                          draggable="false"
                          @mouseenter="showItemTooltip($event, currentRecipe?.outputId)"
                          @mouseleave="hideItemTooltip"
                          @mousemove="updateTooltipPosition"
                        />
                        <div v-if="hasResult" class="result-badge">{{ maxCraftCountLabel }}</div>
                      </div>
                      <div class="selector-value">{{ resultLabel }}</div>
                    </div>
                  </div>
                </div>

                <div class="selector-required">
                  <template v-if="candyRequiredHintLabel">
                    {{ candyRequiredHintLabel }}
                  </template>
                  <template v-else>
                    <div>自动合成需要:{{ autoCraftRequiredQuantityLabel }}</div>
                    <div>合成需要:{{ craftRequiredQuantityLabel }}</div>
                  </template>
                </div>
              </div>

              <div ref="pickerLimitAreaRef" class="candy-bottom">
                <div class="craft-progress">
                  <div class="progress-header">
                    <span class="progress-label">合成进度</span>
                    <span class="progress-value">{{ craftProgress }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-bar" :style="{ width: `${craftProgress}%` }"></div>
                  </div>
                </div>
                <div class="gold-cost">消耗金币:自动合成({{ formattedAutoCraftGold }}),合成({{ formattedCraftGold }})</div>
                <div class="action-buttons">
                  <button
                    class="action-button"
                    :class="{ active: isAutoCraft }"
                    :disabled="!canAutoCraft && !isAutoCraft"
                    @click="toggleAutoCraft"
                  >
                    {{ isAutoCraft ? '停止自动合成糖果' : '自动合成糖果' }}
                    <span class="action-batch-badge">x{{ autoCraftBatchSize }}/次</span>
                  </button>
                  <button
                    class="action-button"
                    :disabled="!canCraft || isCrafting"
                    @click="handleCraft({ craftCount: craftBatchSize })"
                  >
                    合成
                    <span class="action-batch-badge">x{{ craftBatchSize }}/次</span>
                  </button>
                  <button class="action-button" :disabled="isCrafting" @click="resetCandy">重置</button>
                </div>
              </div>
            </div>
            <div v-else-if="activeFeatureKey === 'evolve'" class="candy-panel">
              <div class="candy-top">
                <div class="selector-wrapper">
                  <button :class="['selector-button', selectedEvolvePetRarityClass]" @click="togglePicker('evolvePet')">
                    <div class="selector-label">进化宠物</div>
                    <div class="selector-preview">
                      <div class="selector-icon-wrapper">
                        <img
                          :src="selectedEvolvePetIcon"
                          :alt="selectedEvolvePetLabel"
                          class="selector-icon"
                          draggable="false"
                          @mouseenter="showItemTooltip($event, selectedEvolvePetItem || selectedEvolvePetId)"
                          @mouseleave="hideItemTooltip"
                          @mousemove="updateTooltipPosition"
                        />
                        <div v-if="selectedEvolvePetLevelType" class="pet-tier-badge">{{ selectedEvolvePetLevelType }}</div>
                      </div>
                      <div class="selector-value">
                        {{ selectedEvolvePetLabel }}
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'evolvePet'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel selector-panel--evolve-pet">
                        <div class="selector-panel-title">需要进化的宠物选择面板</div>
                        <div v-if="evolvePetOptions.length" class="selector-items">
                          <button
                            v-for="item in evolvePetOptions"
                            :key="item.key"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectEvolvePet(item)"
                          >
                            <div class="selector-icon-wrapper selector-icon-wrapper--small">
                              <img
                                :src="item.icon"
                                :alt="item.name"
                                @mouseenter="showItemTooltip($event, item.tooltipItem || item.id)"
                                @mouseleave="hideItemTooltip"
                                @mousemove="updateTooltipPosition"
                              />
                              <div v-if="item.levelType" class="pet-tier-badge">{{ item.levelType }}</div>
                            </div>
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用宠物</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-wrapper">
                  <button class="selector-button" @click="togglePicker('evolveCandy')">
                    <div class="selector-label">糖果选择</div>
                    <div class="selector-preview">
                      <img
                        :src="selectedEvolveCandyIcon"
                        :alt="selectedEvolveCandyLabel"
                        class="selector-icon"
                        draggable="false"
                        @mouseenter="showItemTooltip($event, selectedEvolveCandyId)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <div class="selector-value">
                        {{ selectedEvolveCandyLabel }}
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'evolveCandy'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel">
                        <div class="selector-panel-title">糖果选择面板</div>
                        <div v-if="evolveCandyOptions.length" class="selector-items">
                          <button
                            v-for="item in evolveCandyOptions"
                            :key="item.id"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectEvolveCandy(item.id)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用糖果</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-required">
                  {{ evolveRequiredQuantityLabel }}
                </div>
              </div>

              <div ref="pickerLimitAreaRef" class="candy-bottom">
                <div class="craft-progress">
                  <div v-if="shouldShowEvolveRolling" class="evolve-roll-panel">
                    <div class="evolve-roll-title">{{ evolveRollPanelTitle }}</div>
                    <template v-if="shouldShowEvolveWheel">
                      <div ref="evolveWheelStageRef" class="evolve-wheel-stage" :style="evolveWheelStageStyle">
                        <div class="evolve-wheel-pointer"></div>
                        <div
                          class="evolve-wheel"
                          :class="{ 'evolve-wheel--marquee': evolveWheelMarqueeActive }"
                          :style="{ transform: `rotate(${evolveWheelRotationDeg}deg)` }"
                        >
                          <svg
                            v-if="evolveWheelMarqueeActive"
                            class="evolve-wheel-marquee"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient
                                id="evolve-wheel-marquee-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stop-color="#ff4d4f" />
                                <stop offset="25%" stop-color="#ffa940" />
                                <stop offset="50%" stop-color="#fff566" />
                                <stop offset="75%" stop-color="#36cfc9" />
                                <stop offset="100%" stop-color="#4096ff" />
                              </linearGradient>
                            </defs>
                            <circle
                              class="evolve-wheel-marquee-circle"
                              cx="50"
                              cy="50"
                              r="48"
                              vector-effect="non-scaling-stroke"
                            />
                          </svg>
                          <div
                            v-for="item in evolveWheelItems"
                            :key="`evolve-wheel-${item.id}`"
                            class="evolve-wheel-item"
                            :class="{ active: item.id === evolveRollingCurrentId }"
                            :style="item.style"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              class="evolve-wheel-icon"
                              :style="evolveWheelIconStyle"
                              draggable="false"
                              @mouseenter="showItemTooltip($event, item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                          </div>
                        </div>
                        <div class="evolve-wheel-center"></div>
                      </div>
                      <div class="evolve-wheel-current">
                        <span class="evolve-wheel-current-label">当前：</span>
                        <span class="evolve-wheel-current-name">{{ evolveWheelCurrentName }}</span>
                      </div>
                      <div class="evolve-wheel-hint">结束后定格并获得对应宠物</div>
                    </template>
                    <template v-else>
                      <div class="evolve-result">
                        <div :class="['evolve-result-icon', evolveResultRarityClass]">
                          <svg
                            class="evolve-result-marquee"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <defs>
                              <linearGradient id="evolve-result-marquee-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#ff4d4f" />
                                <stop offset="25%" stop-color="#ffa940" />
                                <stop offset="50%" stop-color="#fff566" />
                                <stop offset="75%" stop-color="#36cfc9" />
                                <stop offset="100%" stop-color="#4096ff" />
                              </linearGradient>
                            </defs>
                            <rect
                              class="evolve-result-marquee-rect"
                              x="2"
                              y="2"
                              width="96"
                              height="96"
                              rx="10"
                              ry="10"
                              vector-effect="non-scaling-stroke"
                            />
                          </svg>
                          <img
                            :src="evolveResultIcon"
                            :alt="evolveResultName"
                            class="selector-icon evolve-result-image"
                            draggable="false"
                            @mouseenter="showItemTooltip($event, evolveResultId)"
                            @mouseleave="hideItemTooltip"
                            @mousemove="updateTooltipPosition"
                          />
                        </div>
                        <div :class="['evolve-result-name', evolveResultNameRarityClass]">
                          <span>{{ evolveResultName }}</span>
                          <span v-if="evolveResultLevelType" class="evolve-result-level">({{ evolveResultLevelType }})</span>
                        </div>
                      </div>
                    </template>
                  </div>
                  <div class="progress-header">
                    <span class="progress-label">进化进度</span>
                    <span class="progress-value">{{ evolveProgress }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-bar" :style="{ width: `${evolveProgress}%` }"></div>
                  </div>
                </div>
                <div class="gold-cost">进化消耗金币：0</div>
                <div class="action-buttons">
                  <div v-if="Number(selectedEvolvePetId) !== 8600" class="action-select-wrapper">
                    <select
                      v-model.number="selectedEvolveTargetLevel"
                      class="action-select"
                      :disabled="!evolveTargetLevelOptions.length || !selectedEvolvePetId"
                    >
                      <option :value="0" disabled>目标等级</option>
                      <option
                        v-for="option in evolveTargetLevelOptions"
                        :key="`evolve-target-${option.level}`"
                        :value="option.level"
                        :disabled="option.level <= selectedEvolvePetLevel"
                      >
                        {{ option.type }}
                      </option>
                    </select>
                  </div>
                  <button
                    class="action-button"
                    :class="{ active: isAutoEvolve }"
                    :disabled="!canAutoEvolve && !isAutoEvolve"
                    @click="toggleAutoEvolve"
                  >
                    {{ isAutoEvolve ? '停止自动进化' : '自动进化' }}
                  </button>
                  <button
                    class="action-button"
                    :disabled="!canEvolve || isEvolving"
                    @click="handleEvolve"
                  >
                    进化
                  </button>
                  <button class="action-button" :disabled="isEvolving" @click="resetEvolve">重置</button>
                </div>
              </div>
            </div>
            <div v-else-if="activeFeatureKey === 'sacrifice'" class="candy-panel">
              <div class="candy-top">
                <div class="selector-wrapper">
                  <button
                    class="selector-button"
                    :class="
                      selectedSacrificeMainPetId
                        ? getItemRarityBorderClass(selectedSacrificeMainPetItem || selectedSacrificeMainPetId)
                        : ''
                    "
                    :style="
                      selectedSacrificeMainPetId
                        ? getItemRarityBorderStyle(selectedSacrificeMainPetItem || selectedSacrificeMainPetId)
                        : {}
                    "
                    @click="togglePicker('sacrificeMainPet')"
                  >
                    <div class="selector-label">主宠物</div>
                    <div class="selector-preview">
                      <img
                        :src="selectedSacrificeMainPetIcon"
                        :alt="selectedSacrificeMainPetLabel"
                        class="selector-icon"
                        draggable="false"
                        @mouseenter="showItemTooltip($event, selectedSacrificeMainPetItem || selectedSacrificeMainPetId)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <div
                        class="selector-value"
                        :class="
                          selectedSacrificeMainPetId
                            ? getItemRarityTextClass(selectedSacrificeMainPetItem || selectedSacrificeMainPetId)
                            : ''
                        "
                        :style="
                          selectedSacrificeMainPetId
                            ? getItemRarityTextStyle(selectedSacrificeMainPetItem || selectedSacrificeMainPetId)
                            : {}
                        "
                      >
                        {{ selectedSacrificeMainPetLabel }}
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'sacrificeMainPet'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel selector-panel--evolve-pet">
                        <div class="selector-panel-title">主宠物选择面板</div>
                        <div v-if="sacrificeMainPetOptions.length" class="selector-items">
                          <button
                            v-for="item in sacrificeMainPetOptions"
                            :key="item.key"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectSacrificeMainPet(item)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.tooltipItem || item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用主宠物</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-wrapper">
                  <button
                    class="selector-button"
                    :class="
                      selectedSacrificePetId
                        ? getItemRarityBorderClass(selectedSacrificePetItem || selectedSacrificePetId)
                        : ''
                    "
                    :style="
                      selectedSacrificePetId
                        ? getItemRarityBorderStyle(selectedSacrificePetItem || selectedSacrificePetId)
                        : {}
                    "
                    @click="togglePicker('sacrificePet')"
                  >
                    <div class="selector-label">献祭宠物</div>
                    <div class="selector-preview">
                      <img
                        :src="selectedSacrificePetIcon"
                        :alt="selectedSacrificePetLabel"
                        class="selector-icon"
                        draggable="false"
                        @mouseenter="showItemTooltip($event, selectedSacrificePetItem || selectedSacrificePetId)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <div
                        class="selector-value"
                        :class="
                          selectedSacrificePetId
                            ? getItemRarityTextClass(selectedSacrificePetItem || selectedSacrificePetId)
                            : ''
                        "
                        :style="
                          selectedSacrificePetId
                            ? getItemRarityTextStyle(selectedSacrificePetItem || selectedSacrificePetId)
                            : {}
                        "
                      >
                        {{ selectedSacrificePetLabel }}
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'sacrificePet'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel selector-panel--evolve-pet">
                        <div class="selector-panel-title">献祭宠物选择面板</div>
                        <div v-if="sacrificePetOptions.length" class="selector-items">
                          <button
                            v-for="item in sacrificePetOptions"
                            :key="item.key"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectSacrificePet(item)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.tooltipItem || item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">背包中暂无可用献祭宠物</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-wrapper">
                  <button
                    class="selector-button"
                    :class="selectedSacrificeScrollId ? getItemRarityBorderClass(selectedSacrificeScrollId) : ''"
                    :style="selectedSacrificeScrollId ? getItemRarityBorderStyle(selectedSacrificeScrollId) : {}"
                    @click="togglePicker('sacrificeScroll')"
                  >
                    <div class="selector-label">重铸卷轴</div>
                    <div class="selector-preview">
                      <img
                        :src="selectedSacrificeScrollIcon"
                        :alt="selectedSacrificeScrollLabel"
                        class="selector-icon"
                        draggable="false"
                        @mouseenter="selectedSacrificeScrollId && showItemTooltip($event, selectedSacrificeScrollId)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <div
                        class="selector-value"
                        :class="selectedSacrificeScrollId ? getItemRarityTextClass(selectedSacrificeScrollId) : ''"
                        :style="selectedSacrificeScrollId ? getItemRarityTextStyle(selectedSacrificeScrollId) : {}"
                      >
                        {{ selectedSacrificeScrollLabel }}
                      </div>
                    </div>
                  </button>
                  <Teleport v-if="petTrainerPanelRef" :to="petTrainerPanelRef">
                    <div v-if="activePicker === 'sacrificeScroll'" class="selector-overlay" :style="selectorOverlayStyle">
                      <div class="selector-panel">
                        <div class="selector-panel-title">高级宠物重铸卷轴选择面板</div>
                        <div v-if="sacrificeScrollOptions.length" class="selector-items">
                          <button
                            v-for="item in sacrificeScrollOptions"
                            :key="item.id"
                            class="selector-item"
                            :class="getItemRarityBorderClass(item)"
                            :style="getItemRarityBorderStyle(item)"
                            @click="selectSacrificeScroll(item.id)"
                          >
                            <img
                              :src="item.icon"
                              :alt="item.name"
                              @mouseenter="showItemTooltip($event, item.id)"
                              @mouseleave="hideItemTooltip"
                              @mousemove="updateTooltipPosition"
                            />
                            <div class="item-info">
                              <div class="item-name">{{ item.name }}</div>
                              <div class="item-count">x{{ item.count }}</div>
                            </div>
                          </button>
                        </div>
                        <div v-else class="selector-empty">未找到高级宠物重铸卷轴,请到钻石商店购买</div>
                      </div>
                    </div>
                  </Teleport>
                </div>

                <div class="selector-required">
                  {{ sacrificeRequiredQuantityLabel }}
                </div>
              </div>

              <div ref="pickerLimitAreaRef" class="candy-bottom">
                <div class="craft-progress">
                  <div class="sacrifice-attribute-panel">
                    <div class="sacrifice-attribute-title">
                      {{ sacrificeAttributeTitle }}
                    </div>
                    <div v-if="sacrificeTierAttributeRows.length" class="sacrifice-attribute-list">
                      <div
                        v-for="row in sacrificeTierAttributeRows"
                        :key="row.key"
                        class="sacrifice-attribute-row"
                        :class="{ 'sacrifice-attribute-row--selected': row.isSelected && selectedSacrificeMainPetId }"
                      >
                        <span class="sacrifice-attribute-level">{{ row.levelLabel }}</span>
                        <span class="sacrifice-attribute-grade">{{ row.gradeLabel }}</span>
                        <span class="sacrifice-attribute-value">{{ row.valueLabel }}</span>
                        <input
                          v-model.number="selectedSacrificeTargetLevel"
                          class="sacrifice-attribute-radio"
                          type="radio"
                          name="sacrifice-target-level"
                          :value="row.level"
                          :disabled="!selectedSacrificeMainPetId"
                        />
                      </div>
                    </div>
                    <div v-else class="sacrifice-attribute-empty">请选择主宠物查看各等级属性</div>
                  </div>
                  <div class="progress-header">
                    <span class="progress-label">献祭进度</span>
                    <span class="progress-value">{{ sacrificeProgress }}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-bar" :style="{ width: `${sacrificeProgress}%` }"></div>
                  </div>
                </div>
                <div class="gold-cost">献祭消耗金币：0</div>
                <div class="action-buttons">
                  <div class="action-select-wrapper">
                    <select
                      v-model.number="selectedSacrificeGradeCap"
                      class="action-select"
                      :disabled="!sacrificeGradeCapOptions.length || !selectedSacrificeMainPetId"
                      @change="markSacrificeGradeCapManual"
                    >
                      <option
                        v-for="grade in sacrificeGradeCapOptions"
                        :key="`sacrifice-grade-${grade}`"
                        :value="grade"
                      >
                        {{ grade }}
                      </option>
                    </select>
                  </div>
                  <button
                    class="action-button"
                    :class="{ active: isAutoSacrifice }"
                    :disabled="!canAutoSacrifice && !isAutoSacrifice"
                    @click="toggleAutoSacrifice"
                  >
                    {{ isAutoSacrifice ? '停止自动献祭' : '自动献祭' }}
                  </button>
                  <button
                    class="action-button"
                    :disabled="!canSacrifice || isSacrificing"
                    @click="handleSacrifice"
                  >
                    献祭
                  </button>
                  <button class="action-button" :disabled="isSacrificing" @click="resetSacrifice">重置</button>
                </div>
              </div>
            </div>
            <div v-else class="feature-placeholder">
              <div class="content-title">{{ activeFeature.label }}</div>
              <div class="content-placeholder">功能开发中</div>
            </div>
          </div>
        </div>
      </div>
      <Teleport to="body">
        <Transition name="recipe-panel-fade" appear>
          <div v-if="isVisible && showRecipePanel" class="recipe-panel" :style="recipePanelStyle">
            <div class="recipe-panel-title">{{ helpPanelTitle }}</div>
            <div v-if="activeFeatureKey === 'candy'" class="recipe-panel-list">
              <div v-for="recipe in recipeDisplayList" :key="recipe.key" class="recipe-line">
                <div class="recipe-items">
                  <div v-for="(part, index) in recipe.inputs" :key="part.key" class="recipe-item">
                    <img
                      :src="`/pt/item_icon/${part.id}.png`"
                      :alt="part.name"
                      class="recipe-icon"
                      draggable="false"
                      @mouseenter="showItemTooltip($event, part.id)"
                      @mouseleave="hideItemTooltip"
                      @mousemove="updateTooltipPosition"
                    />
                    <span class="recipe-count">x{{ part.count }}</span>
                    <span v-if="index < recipe.inputs.length - 1" class="recipe-operator">+</span>
                  </div>
                </div>
                <span class="recipe-operator">+</span>
                <span class="recipe-gold">{{ recipe.goldLabel }}</span>
                <span class="recipe-operator">=</span>
                <div class="recipe-result">
                  <img
                    :src="`/pt/item_icon/${recipe.outputId}.png`"
                    :alt="recipe.outputName"
                    class="recipe-icon"
                    draggable="false"
                    @mouseenter="showItemTooltip($event, recipe.outputId)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition"
                  />
                  <span class="recipe-name">{{ recipe.outputName }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="activeFeatureKey === 'evolve'" class="recipe-panel-list">
              <div class="help-section">
                <div class="help-section-title">当前选择</div>
                <div class="help-line">
                  <span class="help-label">进化宠物：</span>
                  <span class="help-value">{{ evolveHelpPetLabel }}</span>
                </div>
                <div class="help-line">
                  <span class="help-label">所需糖果：</span>
                  <div class="help-items">
                    <div v-if="evolveHelpCandy" class="help-item">
                      <img
                        :src="`/pt/item_icon/${evolveHelpCandy.id}.png`"
                        :alt="evolveHelpCandy.name"
                        class="recipe-icon"
                        draggable="false"
                        @mouseenter="showItemTooltip($event, evolveHelpCandy.id)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition"
                      />
                      <span class="recipe-name">{{ evolveHelpCandy.name }}</span>
                      <span class="recipe-count">x{{ evolveHelpCandy.count }}</span>
                    </div>
                    <div v-else class="help-empty">请选择进化宠物查看所需糖果</div>
                  </div>
                </div>
              </div>

              <div class="help-section">
                <div class="help-section-title">进化糖果等级表</div>
                <div v-for="row in evolveCandyTableDisplay" :key="row.key" class="help-table-row">
                  <span class="help-table-level">{{ row.levelLabel }}</span>
                  <img
                    :src="`/pt/item_icon/${row.candyId}.png`"
                    :alt="row.candyName"
                    class="recipe-icon"
                    draggable="false"
                    @mouseenter="showItemTooltip($event, row.candyId)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition"
                  />
                  <span class="recipe-name">{{ row.candyName }}</span>
                  <span class="recipe-count">x{{ row.count }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="activeFeatureKey === 'sacrifice'" class="recipe-panel-list">
              <div class="help-section">
                <div class="help-section-title">当前选择</div>
                <div class="help-line">
                  <span class="help-label">主宠物：</span>
                  <span class="help-value">{{ sacrificeHelpMainLabel }}</span>
                </div>
                <div class="help-line">
                  <span class="help-label">献祭宠物：</span>
                  <span class="help-value">{{ sacrificeHelpPetLabel }}</span>
                </div>
                <div class="help-line">
                  <span class="help-label">洗练属性：</span>
                  <span class="help-value">{{ sacrificeParameterLabel }}（{{ selectedSacrificeMainPetLevelType }}）</span>
                </div>
                <div class="help-line">
                  <span class="help-label">当前属性：</span>
                  <span class="help-value">{{ sacrificeCurrentValueInfo }}</span>
                </div>
                <div class="help-line">
                  <span class="help-label">档位上限：</span>
                  <span class="help-value">{{ sacrificeHelpGradeCapLabel }}</span>
                </div>
                <div class="help-line">
                  <span class="help-label">当前设置：</span>
                  <span class="help-value">{{ sacrificeAttributeHint }}</span>
                </div>
              </div>

              <div class="help-section">
                <div class="help-section-title">洗练随机值概率</div>
                <div class="help-line">
                  <span class="help-label">参与抽取：</span>
                  <span class="help-value">{{ sacrificeHelpProbabilityRangeLabel }}</span>
                </div>
                <div v-for="row in sacrificeGradeProbabilityRows" :key="row.key" class="help-table-row">
                  <span class="help-table-level">{{ row.gradeLabel }}</span>
                  <span class="help-value">{{ row.percentLabel }}</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 自动献祭确认弹窗 -->
      <Transition name="confirm-fade">
        <div v-if="showAutoSacrificeConfirm" class="confirm-overlay" @click.self="cancelAutoSacrifice">
          <div class="confirm-dialog">
            <div class="confirm-title">⚠️ 确认自动献祭</div>
            <div class="confirm-content">
              <div class="confirm-info-line">
                <span class="confirm-label">主宠物：</span>
                <span class="confirm-value">{{ autoSacrificeConfirmInfo.mainPetName }}</span>
              </div>
              <div class="confirm-info-line">
                <span class="confirm-label">进阶等级：</span>
                <span class="confirm-value">{{ autoSacrificeConfirmInfo.mainPetLevel }}</span>
              </div>
              <div v-if="autoSacrificeConfirmInfo.willUseScroll" class="confirm-info-line">
                <span class="confirm-label">消耗材料：</span>
                <span class="confirm-value highlight">高级宠物重铸卷轴 x{{ autoSacrificeConfirmInfo.scrollCount }}</span>
              </div>
              <div v-else class="confirm-info-line">
                <span class="confirm-label">消耗宠物：</span>
                <span class="confirm-value highlight">进阶等级 ≥ {{ autoSacrificeConfirmInfo.mainPetLevel }} 的宠物 ({{ autoSacrificeConfirmInfo.qualifiedPetCount }} 只可消耗)</span>
              </div>
              <div class="confirm-warning">
                此操作将持续自动献祭直至达到目标档位或材料耗尽，请确认是否继续？
              </div>
            </div>
            <div class="confirm-buttons">
              <button class="confirm-btn cancel" @click="cancelAutoSacrifice">取消</button>
              <button class="confirm-btn confirm" @click="confirmAutoSacrifice">确认</button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGameStore } from '@/store'
import { useItemsStore } from '@/store/items'
import { usePetsStore } from '@/store/pets'
import { storageService } from '@/services/StorageService'
import PanelResizeHandle from '@/components/common/PanelResizeHandle.vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  npcName: {
    type: String,
    default: '宠物训练师'
  },
  npcAvatar: {
    type: String,
    default: '/pt/npc_icon/pettamer.png'
  },
  gameInitializer: {
    type: Object,
    default: null
  },
  addBattleLog: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['close'])

const dialogLines = [
  '我来自一个宠物驯练世家，我是家族中最好的宠物驯练师，有困难随时可以来找我哦。',
  '~嘻嘻！AA\n抱歉，我在学老虎叫。\n我们家族在瑞加是有名的宠物训练师\n任何宠物都能成为你的伙伴喔'
]

const activeDialog = ref(dialogLines[0])
const petTrainerShellRef = ref(null)
const petTrainerPanelRef = ref(null)
const panelBaseWidth = 550
const panelBaseHeight = 370
const panelScale = ref(1)
const panelScaleStyle = computed(() => {
  const scale = Number(panelScale.value) || 1
  return {
    transform: `scale(${scale})`,
    width: `${panelBaseWidth}px`,
    height: 'auto',
    transformOrigin: 'top left'
  }
})

const gameStore = useGameStore()
const itemsStore = useItemsStore()
const petsStore = usePetsStore()

const materialIds = Object.freeze([2260, 3985, 484])
const candyIds = Object.freeze([2313, 5906, 3380, 8748, 4371, 6663])
const itemNameFallbacks = Object.freeze({
  2260: '云莓',
  3985: '灯莓',
  484: '奇异莓',
  2313: '宠物糖果（F）',
  5906: '宠物糖果（E）',
  3380: '宠物糖果（D）',
  8748: '宠物糖果（C）',
  4371: '宠物糖果（B）',
  6663: '宠物糖果（A）'
})
const recipes = Object.freeze([
  { materialId: 2260, materialCount: 25, candyId: null, candyCount: 0, outputId: 2313, gold: 200000 },
  { materialId: 2260, materialCount: 50, candyId: 2313, candyCount: 1, outputId: 5906, gold: 500000 },
  { materialId: 3985, materialCount: 50, candyId: 5906, candyCount: 1, outputId: 3380, gold: 800000 },
  { materialId: 3985, materialCount: 50, candyId: 3380, candyCount: 1, outputId: 8748, gold: 1000000 },
  { materialId: 3985, materialCount: 50, candyId: 8748, candyCount: 1, outputId: 4371, gold: 1500000 },
  { materialId: 484, materialCount: 100, candyId: 4371, candyCount: 1, outputId: 6663, gold: 2500000 }
])

const features = [
  { key: 'candy', label: '制作糖果' },
  { key: 'evolve', label: '宠物进化' },
  { key: 'sacrifice', label: '宠物献祭' }
]

const activeFeatureKey = ref(features[0].key)
const activeFeature = computed(() => {
  return features.find(feature => feature.key === activeFeatureKey.value) || features[0]
})

const activePicker = ref(null)
const panelMiddleRef = ref(null)
const pickerLimitAreaRef = ref(null)
const selectorOverlayStyle = ref(null)
let panelResizeObserver = null
const recipePanelTick = ref(0)

const refreshRecipePanelPosition = () => {
  recipePanelTick.value += 1
}

const recipePanelStyle = computed(() => {
  const tick = recipePanelTick.value
  const shell = petTrainerShellRef.value
  if (!shell) {
    return {}
  }
  const rect = shell.getBoundingClientRect()
  const viewportWidth = window.innerWidth || 0
  const viewportHeight = window.innerHeight || 0

  const padding = 20
  const gap = 12
  const minWidth = 380
  const maxWidth = 520
  const minHeight = 250

  const maxHeight = Math.max(minHeight, viewportHeight - padding * 2)
  const height = Math.min(Math.max(rect.height, minHeight), maxHeight)
  const top = Math.min(Math.max(padding, rect.top), Math.max(padding, viewportHeight - padding - height))

  const rightAvailable = viewportWidth - (rect.right + gap) - padding
  let width = Math.min(maxWidth, Math.max(minWidth, rightAvailable))
  let left = rect.right + gap

  if (rightAvailable < minWidth) {
    const leftAvailable = rect.left - gap - padding
    width = Math.min(maxWidth, Math.max(minWidth, leftAvailable))
    left = rect.left - gap - width
  }

  const clampedLeft = Math.min(Math.max(padding, left), Math.max(padding, viewportWidth - padding - width))

  return {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(clampedLeft)}px`,
    width: `${Math.round(width)}px`,
    height: `${Math.round(height)}px`,
    zIndex: 1210,
    '--recipe-panel-tick': String(tick)
  }
})

const updatePanelScale = () => {
  const shell = petTrainerShellRef.value
  if (!shell) {
    return
  }
  const rect = shell.getBoundingClientRect()
  const width = Math.max(1, rect.width)
  const height = Math.max(1, rect.height)
  const scale = Math.min(width / panelBaseWidth, height / panelBaseHeight)
  panelScale.value = Number.isFinite(scale) && scale > 0 ? scale : 1
  if (activePicker.value) {
    updateSelectorOverlayStyle()
  }
}

const updateSelectorOverlayStyle = () => {
  const panel = petTrainerPanelRef.value
  const area = pickerLimitAreaRef.value
  if (!panel || !area) {
    selectorOverlayStyle.value = null
    return
  }
  const panelRect = panel.getBoundingClientRect()
  const areaRect = area.getBoundingClientRect()
  const scale = Number(panelScale.value) || 1
  const left = Math.round((areaRect.left - panelRect.left) / scale)
  const width = Math.round(areaRect.width / scale)
  const preferredTop = 244
  const preferredHeight = 250
  const baseHeight = Math.round(panelRect.height / scale)
  const maxTop = Math.max(0, baseHeight - preferredHeight)
  const top = Math.max(0, Math.min(preferredTop, maxTop))
  const height = Math.min(preferredHeight, baseHeight - top)
  selectorOverlayStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
}

const handlePanelMiddleScroll = () => {
  if (!activePicker.value) {
    return
  }
  updateSelectorOverlayStyle()
}

const handleWindowResize = () => {
  updatePanelScale()
  refreshRecipePanelPosition()
}

watch(
  () => [activePicker.value, activeFeatureKey.value],
  () => {
    if (!activePicker.value) {
      selectorOverlayStyle.value = null
      return
    }
    nextTick(() => {
      updateSelectorOverlayStyle()
    })
  }
)

onMounted(() => {
  window.addEventListener('resize', handleWindowResize)
  nextTick(() => {
    const el = panelMiddleRef.value
    if (el) {
      el.addEventListener('scroll', handlePanelMiddleScroll, { passive: true })
    }
  })
  nextTick(() => {
    const shell = petTrainerShellRef.value
    if (shell && typeof ResizeObserver !== 'undefined') {
      panelResizeObserver = new ResizeObserver(() => {
        updatePanelScale()
        refreshRecipePanelPosition()
      })
      panelResizeObserver.observe(shell)
    }
    updatePanelScale()
    refreshRecipePanelPosition()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  const el = panelMiddleRef.value
  if (el) {
    el.removeEventListener('scroll', handlePanelMiddleScroll)
  }
  if (panelResizeObserver) {
    panelResizeObserver.disconnect()
    panelResizeObserver = null
  }
})

const selectedMaterialId = ref(null)
const selectedCandyId = ref(null)
const isAutoCraft = ref(false)
const selectedEvolvePetId = ref(null)
const selectedEvolvePetUniqueId = ref('')
const selectedEvolveCandyId = ref(null)
const selectedEvolveTargetLevel = ref(0)
const isAutoEvolve = ref(false)
const selectedSacrificeMainPetId = ref(null)
const selectedSacrificeMainPetUniqueId = ref('')
const selectedSacrificePetId = ref(null)
const selectedSacrificePetUniqueId = ref('')
const selectedSacrificeScrollId = ref(null)
const selectedSacrificeTargetLevel = ref(null)
const selectedSacrificeGradeCap = ref(1)
const sacrificeGradeCapManuallySet = ref(false)
const isAutoSacrifice = ref(false)
const showAutoSacrificeConfirm = ref(false)
const showRecipePanel = ref(false)
const craftProgress = ref(0)
const isCrafting = ref(false)
const isAutoCrafting = ref(false)
const autoStopNotified = ref(false)
const evolveProgress = ref(0)
const isEvolving = ref(false)
const isAutoEvolving = ref(false)
const evolveAutoStopNotified = ref(false)
const sacrificeProgress = ref(0)
const isSacrificing = ref(false)
const isAutoSacrificing = ref(false)
const sacrificeAutoStopNotified = ref(false)
const defaultSlotIcon = '/pt/UI/back_Slotitem.jpg'
const evolveRollingCandidateIds = ref([])
const evolveRollingCurrentId = ref(null)
const evolveRollingFinalId = ref(null)
const evolveWheelRotationDeg = ref(0)
const evolveWheelFinalRotationDeg = ref(0)
const evolveWheelStageRef = ref(null)
const evolveWheelStageSize = ref(200)
let evolveWheelStageObserver = null

const evolveWheelIconSize = computed(() => {
  const size = Number(evolveWheelStageSize.value)
  const safeSize = Number.isFinite(size) ? size : 200
  return Math.round(Math.min(Math.max(safeSize * 0.2, 22), 48))
})

const evolveWheelInsetSize = computed(() => {
  const size = Number(evolveWheelStageSize.value)
  const safeSize = Number.isFinite(size) ? size : 200
  return Math.round(Math.min(Math.max(safeSize * 0.06, 10), 18))
})

const evolveWheelCenterSize = computed(() => {
  const size = Number(evolveWheelStageSize.value)
  const safeSize = Number.isFinite(size) ? size : 200
  return Math.round(Math.min(Math.max(safeSize * 0.08, 12), 22))
})

const evolveWheelStageStyle = computed(() => {
  return {
    '--evolve-wheel-icon-size': `${evolveWheelIconSize.value}px`,
    '--evolve-wheel-inset': `${evolveWheelInsetSize.value}px`,
    '--evolve-wheel-center-size': `${evolveWheelCenterSize.value}px`
  }
})

const detachEvolveWheelStageObserver = () => {
  if (evolveWheelStageObserver) {
    evolveWheelStageObserver.disconnect()
    evolveWheelStageObserver = null
  }
}

const attachEvolveWheelStageObserver = () => {
  detachEvolveWheelStageObserver()
  const stage = evolveWheelStageRef.value
  if (!stage) {
    return
  }

  const updateFromRect = rect => {
    const width = Number(rect?.width ?? 0)
    const height = Number(rect?.height ?? 0)
    const nextSize = Math.floor(Math.min(width, height))
    if (Number.isFinite(nextSize) && nextSize > 0) {
      evolveWheelStageSize.value = nextSize
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    evolveWheelStageObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) {
        return
      }
      updateFromRect(entry.contentRect)
    })
    evolveWheelStageObserver.observe(stage)
  } else if (typeof stage.getBoundingClientRect === 'function') {
    updateFromRect(stage.getBoundingClientRect())
  }
}

const bagItems = computed(() => itemsStore.playerBag || [])
const bagCountMap = computed(() => {
  const map = new Map()
  bagItems.value.forEach(item => {
    const id = Number(item?.id)
    if (!Number.isFinite(id)) {
      return
    }
    const raw = item?.currentStack ?? item?.quantity ?? 1
    const parsed = Number(raw)
    const count = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
    map.set(id, (map.get(id) || 0) + count)
  })
  return map
})

const resolveItemName = itemId => {
  const config = itemsStore.getItemConfig(itemId)
  if (config?.name) {
    if (typeof config.name === 'object') {
      return config.name.cns || config.name.eng || config.name.en || itemNameFallbacks[itemId] || '未知物品'
    }
    return config.name
  }
  return itemNameFallbacks[itemId] || '未知物品'
}

const petLevelTypeRarityKeyMap = Object.freeze({
  F: 'common',
  E: 'uncommon',
  D: 'rare',
  C: 'ultimate',
  B: 'veryrare',
  A: 'unique',
  S: 'mythic'
})

const resolvePetRarityKeyByLevelType = levelType => {
  const key = String(levelType || 'F').toUpperCase()
  return petLevelTypeRarityKeyMap[key] || 'common'
}

const resolveItemRarity = payload => {
  if (payload && typeof payload === 'object' && typeof payload.rarityKey === 'string') {
    const trimmed = payload.rarityKey.trim()
    if (trimmed) {
      return trimmed
    }
  }
  const tooltipItem = payload && typeof payload === 'object' ? payload.tooltipItem : null
  const petLevelRaw = Number(tooltipItem?.pet_level ?? tooltipItem?.petLevel ?? payload?.pet_level ?? payload?.petLevel ?? 0)
  if (Number.isFinite(petLevelRaw) && petLevelRaw > 0) {
    const level = Math.max(1, Math.floor(petLevelRaw))
    const levelType = petLevelTypeMap[level] || 'F'
    return resolvePetRarityKeyByLevelType(levelType)
  }
  const id = Number(payload && typeof payload === 'object' ? payload.id : payload)
  if (!Number.isFinite(id) || id <= 0) {
    return 'common'
  }
  const config = itemsStore.getItemConfig(id)
  return (typeof config?.rarity === 'string' && config.rarity) || 'common'
}

const getItemRarityBorderStyle = payload => {
  const rarity = resolveItemRarity(payload)
  return { border: itemsStore.getRarityBorderCss(rarity) }
}

const getItemRarityBorderClass = payload => {
  const rarity = resolveItemRarity(payload)
  return itemsStore.getRarityBorderClass(rarity)
}

const getItemRarityTextStyle = payload => {
  const rarity = resolveItemRarity(payload)
  return itemsStore.getRarityTextStyle(rarity)
}

const getItemRarityTextClass = payload => {
  const rarity = resolveItemRarity(payload)
  return itemsStore.getRarityTextClass(rarity)
}

const shouldShowEvolveRolling = computed(() => {
  if (activeFeatureKey.value !== 'evolve') {
    return false
  }
  const ids = Array.isArray(evolveRollingCandidateIds.value) ? evolveRollingCandidateIds.value : []
  return (isEvolving.value || evolveProgress.value > 0 || Boolean(selectedEvolvePetId.value)) && ids.length > 0
})

const shouldShowEvolveWheel = computed(() => {
  if (!shouldShowEvolveRolling.value) {
    return false
  }
  return Number(selectedEvolvePetId.value) === 8600
})

const evolveRollPanelTitle = computed(() => {
  return shouldShowEvolveWheel.value ? '随机结果转盘' : '进化结果:'
})

const evolveResultId = computed(() => {
  const finalRaw = evolveRollingFinalId.value
  if (finalRaw !== undefined && finalRaw !== null && finalRaw !== '') {
    const finalIdRaw = Number(finalRaw)
    if (Number.isFinite(finalIdRaw) && finalIdRaw > 0) {
      return finalIdRaw
    }
  }
  const ids = Array.isArray(evolveRollingCandidateIds.value) ? evolveRollingCandidateIds.value : []
  const firstRaw = ids[0]
  if (firstRaw !== undefined && firstRaw !== null && firstRaw !== '') {
    const firstIdRaw = Number(firstRaw)
    if (Number.isFinite(firstIdRaw) && firstIdRaw > 0) {
      return firstIdRaw
    }
  }
  const currentRaw = evolveRollingCurrentId.value
  if (currentRaw !== undefined && currentRaw !== null && currentRaw !== '') {
    const currentIdRaw = Number(currentRaw)
    if (Number.isFinite(currentIdRaw) && currentIdRaw > 0) {
      return currentIdRaw
    }
  }
  return null
})

const evolveResultName = computed(() => {
  const id = Number(evolveResultId.value)
  if (!Number.isFinite(id) || id <= 0) {
    return '—'
  }
  return resolveItemName(id)
})

const evolveResultIcon = computed(() => {
  const id = Number(evolveResultId.value)
  if (!Number.isFinite(id) || id <= 0) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${id}.png`
})

const evolveResultLevelType = computed(() => {
  if (Number(selectedEvolvePetId.value) === 8600) {
    return ''
  }
  const currentLevelRaw = Number(selectedEvolvePetLevel.value)
  if (!Number.isFinite(currentLevelRaw) || currentLevelRaw <= 0 || currentLevelRaw >= evolveMaxLevel) {
    return ''
  }
  const nextLevel = Math.min(evolveMaxLevel, Math.max(1, Math.floor(currentLevelRaw)) + 1)
  return petLevelTypeMap?.[nextLevel] || ''
})

const evolveResultRarityClass = computed(() => {
  const id = Number(evolveResultId.value)
  if (!Number.isFinite(id) || id <= 0) {
    return ''
  }
  const config = itemsStore.getItemConfig(id)
  const rarityRaw = (typeof config?.rarity === 'string' && config.rarity) || 'common'
  const safe = String(rarityRaw || 'common').trim()
  const normalized = safe === 'Mythic' || safe === 'MYTHIC' ? 'mythic' : safe.toLowerCase()
  return `rarity-${normalized}`
})

const evolveWheelMarqueeActive = computed(() => {
  if (activeFeatureKey.value !== 'evolve') {
    return false
  }
  return Boolean(shouldShowEvolveWheel.value)
})

const evolveWheelIconStyle = computed(() => {
  const rotation = Number(evolveWheelRotationDeg.value)
  const safeRotation = Number.isFinite(rotation) ? rotation : 0
  return { transform: `rotate(${-safeRotation}deg)` }
})

const evolveWheelItems = computed(() => {
  const ids = Array.isArray(evolveRollingCandidateIds.value) ? evolveRollingCandidateIds.value : []
  const count = ids.length
  if (!count) {
    return []
  }
  const stepAngle = 360 / count
  const angleOffset = -90
  const stageSize = Number(evolveWheelStageSize.value)
  const safeStageSize = Number.isFinite(stageSize) ? stageSize : 200
  const radius = Math.max(0, safeStageSize / 2 - evolveWheelInsetSize.value - evolveWheelIconSize.value / 2)
  return ids.map((id, index) => {
    const angle = angleOffset + stepAngle * index
    return {
      id,
      name: resolveItemName(id),
      icon: `/pt/item_icon/${id}.png`,
      style: {
        transform: `translate(-50%, -50%) rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`
      }
    }
  })
})

onMounted(() => {
  nextTick(() => {
    attachEvolveWheelStageObserver()
  })
})

watch(
  () => shouldShowEvolveRolling.value,
  value => {
    if (!value) {
      detachEvolveWheelStageObserver()
      return
    }
    nextTick(() => {
      attachEvolveWheelStageObserver()
    })
  }
)

onBeforeUnmount(() => {
  detachEvolveWheelStageObserver()
})

const evolveWheelCurrentName = computed(() => {
  const id = Number(evolveRollingCurrentId.value)
  if (!Number.isFinite(id)) {
    return '—'
  }
  return resolveItemName(id)
})

const buildOptions = ids => {
  return ids
    .map(id => ({
      id,
      name: resolveItemName(id),
      icon: `/pt/item_icon/${id}.png`,
      count: bagCountMap.value.get(id) || 0
    }))
    .filter(item => item.count > 0)
}

const materialOptions = computed(() => buildOptions(materialIds))
const candyOptions = computed(() => buildOptions(candyIds))
const evolvePetIds = Object.freeze([
  8600,
  9153,
  9941,
  7805,
  5851,
  7435,
  2079,
  241,
  5471,
  1025,
  9385,
  4817,
  3765,
  885,
  6226,
  6279,
  2563,
  6387,
  5253,
  148,
  3350,
  7239,
  1644,
  975,
  3732,
  6296,
  6582,
  1681
])
const evolvePetOptions = computed(() => {
  const options = []
  const bagList = Array.isArray(bagItems.value) ? bagItems.value : []
  const baseById = new Map(
    evolvePetIds.map(id => [
      Number(id),
      { id: Number(id), name: resolveItemName(id), icon: `/pt/item_icon/${id}.png` }
    ])
  )

  evolvePetIds.forEach((rawId, orderIndex) => {
    const petId = Number(rawId)
    if (!Number.isFinite(petId)) {
      return
    }
    const base = baseById.get(petId)
    if (!base) {
      return
    }
    const matches = bagList.filter(entry => Number(entry?.id) === petId)
    matches.forEach((entry, entryIndex) => {
      const rawCount = Number(entry?.currentStack ?? entry?.quantity ?? entry?.stack ?? 1) || 0
      const count = Math.max(0, Math.floor(rawCount))
      for (let i = 0; i < count; i += 1) {
        const levelRaw = Number(entry?.pet_level ?? entry?.petLevel ?? 1)
        const level = Number.isFinite(levelRaw) ? Math.max(1, Math.min(evolveMaxLevel, levelRaw)) : 1
        const levelType = petLevelTypeMap?.[level] || ''
        if (level >= evolveMaxLevel || levelType === 'S') {
          continue
        }
        const config = itemsStore.getItemConfig(petId)
        const entryRarity =
          typeof entry?.rarity === 'string'
            ? entry.rarity
            : typeof entry?.Rarity === 'string'
              ? entry.Rarity
              : ''
        const configRarity = typeof config?.rarity === 'string' ? config.rarity : ''
        const rarityRaw = (entryRarity || configRarity || 'common').trim()
        const normalized =
          rarityRaw === 'Mythic' || rarityRaw === 'MYTHIC'
            ? 'mythic'
            : String(rarityRaw || 'common').toLowerCase()
        const rarityClass = `rarity-${normalized}`
        options.push({
          ...base,
          count: 1,
          uniqueId:
            entry?.uniqueId !== undefined && entry?.uniqueId !== null ? String(entry.uniqueId) : '',
          tooltipItem: entry,
          rarityClass,
          levelType,
          key: `evolve-pet-${petId}-${orderIndex}-${entryIndex}-${i}`
        })
      }
    })
  })

  return options
})

const selectedMaterialLabel = computed(() => {
  if (!selectedMaterialId.value) {
    return '未选择'
  }
  return resolveItemName(selectedMaterialId.value)
})

const selectedMaterialCount = computed(() => {
  if (!selectedMaterialId.value) {
    return 0
  }
  const count = Number(bagCountMap.value.get(selectedMaterialId.value) || 0)
  return Number.isFinite(count) ? Math.max(0, count) : 0
})

const selectedCandyLabel = computed(() => {
  if (!selectedCandyId.value) {
    return '未选择'
  }
  return resolveItemName(selectedCandyId.value)
})

const selectedCandyCount = computed(() => {
  if (!selectedCandyId.value) {
    return 0
  }
  const count = Number(bagCountMap.value.get(selectedCandyId.value) || 0)
  return Number.isFinite(count) ? Math.max(0, count) : 0
})

const selectedEvolvePetItem = computed(() => {
  if (!selectedEvolvePetId.value) {
    return null
  }
  const id = Number(selectedEvolvePetId.value)
  if (!Number.isFinite(id)) {
    return null
  }
  const uid = selectedEvolvePetUniqueId.value ? String(selectedEvolvePetUniqueId.value) : ''
  if (uid) {
    return (
      bagItems.value.find(
        item =>
          Number(item?.id) === id &&
          item?.uniqueId !== undefined &&
          item?.uniqueId !== null &&
          String(item.uniqueId) === uid
      ) || null
    )
  }
  return bagItems.value.find(item => Number(item?.id) === id) || null
})

const selectedEvolvePetRarityClass = computed(() => {
  if (!selectedEvolvePetId.value) {
    return ''
  }
  const id = Number(selectedEvolvePetId.value)
  if (!Number.isFinite(id)) {
    return ''
  }
  const config = itemsStore.getItemConfig(id)
  const rarityRaw =
    (typeof selectedEvolvePetItem.value?.rarity === 'string' && selectedEvolvePetItem.value.rarity) ||
    (typeof selectedEvolvePetItem.value?.Rarity === 'string' && selectedEvolvePetItem.value.Rarity) ||
    (typeof config?.rarity === 'string' && config.rarity) ||
    'common'
  const safe = String(rarityRaw || 'common').trim()
  const normalized = safe === 'Mythic' || safe === 'MYTHIC' ? 'mythic' : safe.toLowerCase()
  return `rarity-${normalized}`
})

const evolveResultNameRarityClass = computed(() => {
  const evolvePetId = Number(selectedEvolvePetId.value)
  if (!Number.isFinite(evolvePetId) || evolvePetId <= 0) {
    return evolveResultRarityClass.value
  }
  if (evolvePetId === 8600) {
    return evolveResultRarityClass.value
  }
  const baseRaw = String(selectedEvolvePetRarityClass.value || '').replace(/^rarity-/, '')
  if (!baseRaw) {
    return evolveResultRarityClass.value
  }
  const base =
    baseRaw === 'mythic'
      ? 'mythic'
      : baseRaw === 'ultimate'
        ? 'ultimate'
        : baseRaw === 'unique' || baseRaw === 'veryrare'
          ? 'veryrare'
          : baseRaw === 'rare'
            ? 'rare'
            : baseRaw === 'uncommon'
              ? 'uncommon'
              : baseRaw === 'common'
                ? 'common'
                : ''
  if (!base) {
    return evolveResultRarityClass.value
  }
  const order = ['common', 'uncommon', 'rare', 'veryrare', 'ultimate', 'mythic']
  const index = order.indexOf(base)
  if (index < 0) {
    return evolveResultRarityClass.value
  }
  const nextKey = order[Math.min(index + 1, order.length - 1)] || base
  return `rarity-${nextKey}`
})
const selectedEvolvePetLevel = computed(() => {
  const level = Number(selectedEvolvePetItem.value?.pet_level ?? selectedEvolvePetItem.value?.petLevel ?? 0)
  return Number.isFinite(level) && level >= 0 ? level : 0
})

const selectedEvolvePetLevelType = computed(() => {
  if (!selectedEvolvePetId.value) {
    return ''
  }
  const levelRaw = Number(selectedEvolvePetLevel.value)
  if (!Number.isFinite(levelRaw) || levelRaw <= 0) {
    return ''
  }
  const level = Number.isFinite(levelRaw) ? Math.max(1, Math.min(evolveMaxLevel, levelRaw)) : 1
  return petLevelTypeMap?.[level] || ''
})
const evolveMaxLevel = 7
const evolveRareChance = 0.1
const petLevelTypeMap = Object.freeze({
  1: 'F',
  2: 'E',
  3: 'D',
  4: 'C',
  5: 'B',
  6: 'A',
  7: 'S'
})

const evolveTargetLevelOptions = computed(() => {
  const petId = Number(selectedEvolvePetId.value)
  if (!Number.isFinite(petId) || petId <= 0) {
    return []
  }

  const currentLevelRaw = Number(selectedEvolvePetLevel.value)
  const currentLevel = Number.isFinite(currentLevelRaw) ? Math.max(1, Math.min(evolveMaxLevel, currentLevelRaw)) : 1
  const options = []
  for (let level = currentLevel + 1; level <= evolveMaxLevel; level += 1) {
    options.push({
      level,
      type: petLevelTypeMap[level] || `Lv${level}`
    })
  }

  const selectedLevel = Number(selectedEvolveTargetLevel.value)
  if (
    Number.isFinite(selectedLevel) &&
    selectedLevel >= 2 &&
    selectedLevel <= evolveMaxLevel &&
    !options.some(option => option.level === selectedLevel)
  ) {
    options.unshift({
      level: selectedLevel,
      type: petLevelTypeMap[selectedLevel] || `Lv${selectedLevel}`
    })
  }

  return options
})
// 宠物等级对应的进阶等级需求映射（等级-需求）
const petLevelRequirementMap = Object.freeze({
  C: 15,
  B: 30,
  A: 45,
  S: 60
})
// 宠物等级对应的能量值映射（等级-能量值）
const petEnergyByLevel = Object.freeze({
  1: 180,
  2: 210,
  3: 240,
  4: 270,
  5: 300,
  6: 330,
  7: 360
})
// 宠物等级对应的稀有度映射（等级-稀有度）
const petRarityByLevel = Object.freeze({
  1: 'common',
  2: 'uncommon',
  3: 'rare',
  4: 'veryrare',
  5: 'unique',
  6: 'ultimate',
  7: 'mythic'
})
// 宠物属性等级权重献祭洗练等级值概率映射（等级-权重）
const petAttributeGradeWeightMap = Object.freeze({
  1: 80,
  2: 50,
  3: 30,
  4: 25,
  5: 12,
  6: 9,
  7: 7,
  8: 6,
  9: 5
})
// 宠物属性等级最大等级映射（等级-最大等级）
const petAttributeGradeMaxByLevel = Object.freeze({
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 7,
  7: 9
})

const sacrificeMainPetIds = Object.freeze([148, 885, 1644, 2563, 4817, 5471, 5851, 6296, 9941])

/**
 * 解析进阶等级排序权重
 * 用途/业务意图：将进阶字母等级（F~S）映射为可比较的序号，用于过滤献祭宠物列表
 * @param {string} type - 进阶等级字母（如 F/E/D/C/B/A/S）
 * @returns {number} 排序序号（越大代表等级越高）
 */
const resolveLevelTypeRank = type => {
  const key = String(type || 'F').toUpperCase()
  const order = ['F', 'E', 'D', 'C', 'B', 'A', 'S']
  const idx = order.indexOf(key)
  return idx >= 0 ? idx : 0
}

/**
 * 构建背包宠物实例选择项列表
 * 用途/业务意图：从背包中提取可选宠物实例（支持 uniqueId），并按条件过滤
 * @param {{ allowedIds?: number[]|null, levelTypeRankMin?: number|null }} options - 过滤选项
 * @returns {Array<{id:number,name:string,icon:string,count:number,uniqueId:string,tooltipItem:any,key:string}>} 选择项
 */
const buildPetInstanceOptions = ({ allowedIds = null, levelTypeRankMin = null } = {}) => {
  const options = []
  const bagList = Array.isArray(bagItems.value) ? bagItems.value : []
  const allowSet =
    allowedIds && Array.isArray(allowedIds)
      ? new Set(allowedIds.map(id => Number(id)).filter(id => Number.isFinite(id)))
      : null
  const petIdSet = new Set(
    Object.keys(petsStore.petMap || {})
      .map(key => Number(key))
      .filter(id => Number.isFinite(id))
  )
  bagList.forEach((entry, entryIndex) => {
    const id = Number(entry?.id)
    if (!Number.isFinite(id)) {
      return
    }
    if (!petIdSet.has(id)) {
      return
    }
    if (allowSet && !allowSet.has(id)) {
      return
    }
    const rawLevel = Number(entry?.pet_level ?? entry?.petLevel ?? 0)
    const level = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : 1
    const type = petLevelTypeMap[level] || 'F'
    const rank = resolveLevelTypeRank(type)
    if (levelTypeRankMin !== null && Number.isFinite(Number(levelTypeRankMin)) && rank < levelTypeRankMin) {
      return
    }
    const rawCount = Number(entry?.currentStack ?? entry?.quantity ?? entry?.stack ?? 1) || 0
    const count = Math.max(0, Math.floor(rawCount))
    const displayName = `${resolveItemName(id)} Lv${level}(${type})`
    const uid = entry?.uniqueId !== undefined && entry?.uniqueId !== null ? String(entry.uniqueId) : ''
    const repeats = uid ? 1 : Math.max(1, count)
    for (let i = 0; i < repeats; i += 1) {
      options.push({
        id,
        name: displayName,
        icon: `/pt/item_icon/${id}.png`,
        count: 1,
        uniqueId: uid,
        tooltipItem: entry,
        key: `pet-instance-${id}-${entryIndex}-${i}`
      })
    }
  })
  return options
}

const isPetFullyMaxedForLevels1To7 = (petId, tooltipItem) => {
  const numericId = Number(petId)
  if (!Number.isFinite(numericId)) {
    return false
  }
  const petConfig = petsStore.petMap?.[String(numericId)] || null
  const parameterKey = typeof petConfig?.parameter === 'string' ? petConfig.parameter : ''
  const values = Array.isArray(petConfig?.values) ? petConfig.values : []
  const petData = tooltipItem?.pet_data && typeof tooltipItem.pet_data === 'object' ? tooltipItem.pet_data : null
  if (!parameterKey || !petData) {
    return false
  }
  const rawLevel = Number(tooltipItem?.pet_level ?? tooltipItem?.petLevel ?? 0)
  const maxLevel = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : 1
  if (maxLevel < 7) {
    return false
  }
  for (let level = 1; level <= 7; level += 1) {
    const maxGradeRaw = petAttributeGradeMaxByLevel?.[level] ?? 1
    const maxGrade = Number.isFinite(Number(maxGradeRaw)) ? Math.max(1, Math.floor(Number(maxGradeRaw))) : 1
    const levelEntry = petData?.[String(level)] && typeof petData[String(level)] === 'object' ? petData[String(level)] : null
    const paramEntry =
      levelEntry?.[parameterKey] && typeof levelEntry[parameterKey] === 'object' ? levelEntry[parameterKey] : null
    const gradeKey = paramEntry ? Object.keys(paramEntry)[0] : ''
    const grade = gradeKey ? Number(gradeKey) : NaN
    const currentValue = gradeKey ? Number(paramEntry?.[gradeKey]) : NaN
    const maxValue = resolveAttributeValue(values, maxGrade)
    if (!Number.isFinite(grade) || grade < maxGrade || !Number.isFinite(currentValue) || currentValue < maxValue) {
      return false
    }
  }
  return true
}

const sacrificeMainPetOptions = computed(() => {
  return buildPetInstanceOptions({ allowedIds: sacrificeMainPetIds }).filter(option => {
    const petId = Number(option?.id)
    if (!Number.isFinite(petId)) {
      return true
    }
    return !isPetFullyMaxedForLevels1To7(petId, option?.tooltipItem)
  })
})

const selectedSacrificeMainPetItem = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return null
  }
  const id = Number(selectedSacrificeMainPetId.value)
  if (!Number.isFinite(id)) {
    return null
  }
  const uid = selectedSacrificeMainPetUniqueId.value ? String(selectedSacrificeMainPetUniqueId.value) : ''
  if (uid) {
    return (
      bagItems.value.find(
        item =>
          Number(item?.id) === id &&
          item?.uniqueId !== undefined &&
          item?.uniqueId !== null &&
          String(item.uniqueId) === uid
      ) || null
    )
  }
  return bagItems.value.find(item => Number(item?.id) === id) || null
})

const selectedSacrificeMainPetLevel = computed(() => {
  const level = Number(
    selectedSacrificeMainPetItem.value?.pet_level ?? selectedSacrificeMainPetItem.value?.petLevel ?? 0
  )
  const safe = Number.isFinite(level) ? Math.floor(level) : 0
  return safe > 0 ? safe : 1
})

const selectedSacrificeMainPetLevelType = computed(() => {
  const level = selectedSacrificeMainPetLevel.value
  return petLevelTypeMap[level] || 'F'
})

const sacrificeTargetLevel = computed(() => {
  const raw = Number(selectedSacrificeTargetLevel.value)
  const mainLevel = selectedSacrificeMainPetLevel.value
  if (!Number.isFinite(mainLevel) || mainLevel <= 0) {
    return 1
  }
  if (Number.isFinite(raw) && raw > 0) {
    return Math.min(Math.max(1, Math.floor(raw)), mainLevel)
  }
  return mainLevel
})

const sacrificeTargetLevelType = computed(() => {
  const level = sacrificeTargetLevel.value
  return petLevelTypeMap[level] || 'F'
})

const selectedSacrificeMainPetIcon = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedSacrificeMainPetId.value}.png`
})

const selectedSacrificeMainPetLabel = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '未选择'
  }
  const name = resolveItemName(selectedSacrificeMainPetId.value)
  const level = selectedSacrificeMainPetLevel.value
  const type = selectedSacrificeMainPetLevelType.value
  return `${name} Lv${level}(${type})`
})

const selectedSacrificePetItem = computed(() => {
  if (!selectedSacrificePetId.value) {
    return null
  }
  const id = Number(selectedSacrificePetId.value)
  if (!Number.isFinite(id)) {
    return null
  }
  const uid = selectedSacrificePetUniqueId.value ? String(selectedSacrificePetUniqueId.value) : ''
  if (uid) {
    return (
      bagItems.value.find(
        item =>
          Number(item?.id) === id &&
          item?.uniqueId !== undefined &&
          item?.uniqueId !== null &&
          String(item.uniqueId) === uid
      ) || null
    )
  }
  return bagItems.value.find(item => Number(item?.id) === id) || null
})

const selectedSacrificePetLevel = computed(() => {
  const level = Number(selectedSacrificePetItem.value?.pet_level ?? selectedSacrificePetItem.value?.petLevel ?? 0)
  const safe = Number.isFinite(level) ? Math.floor(level) : 0
  return safe > 0 ? safe : 1
})

const selectedSacrificePetLevelType = computed(() => {
  const level = selectedSacrificePetLevel.value
  return petLevelTypeMap[level] || 'F'
})

const selectedSacrificePetIcon = computed(() => {
  if (!selectedSacrificePetId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedSacrificePetId.value}.png`
})

const selectedSacrificePetLabel = computed(() => {
  if (!selectedSacrificePetId.value) {
    return '未选择'
  }
  const name = resolveItemName(selectedSacrificePetId.value)
  const level = selectedSacrificePetLevel.value
  const type = selectedSacrificePetLevelType.value
  return `${name} Lv${level}(${type})`
})

const sacrificeScrollItemId = 11681

const sacrificeScrollOptions = computed(() => buildOptions([sacrificeScrollItemId]))

const sacrificeScrollOwned = computed(() => {
  return bagCountMap.value.get(sacrificeScrollItemId) || 0
})

const sacrificeMaterialMode = computed(() => {
  return selectedSacrificeScrollId.value ? 'scroll' : 'pet'
})

const selectedSacrificeScrollIcon = computed(() => {
  if (!selectedSacrificeScrollId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${sacrificeScrollItemId}.png`
})

const selectedSacrificeScrollLabel = computed(() => {
  if (!selectedSacrificeScrollId.value) {
    return '未选择'
  }
  const name = resolveItemName(sacrificeScrollItemId)
  const owned = sacrificeScrollOwned.value
  return owned > 0 ? `${name} x${owned}` : name
})

const sacrificePetOptions = computed(() => {
  const mainRank = resolveLevelTypeRank(sacrificeTargetLevelType.value)
  const mainId = Number(selectedSacrificeMainPetId.value)
  const mainUid = selectedSacrificeMainPetUniqueId.value ? String(selectedSacrificeMainPetUniqueId.value) : ''
  return buildPetInstanceOptions({ levelTypeRankMin: mainRank }).filter(option => {
    const petId = Number(option?.id)
    if (Number.isFinite(petId)) {
      const petConfig = petsStore.petMap?.[String(petId)] || null
      const parameterKey = typeof petConfig?.parameter === 'string' ? petConfig.parameter : ''
      const values = Array.isArray(petConfig?.values) ? petConfig.values : []
      const tooltipItem = option?.tooltipItem
      const petData =
        tooltipItem?.pet_data && typeof tooltipItem.pet_data === 'object' ? tooltipItem.pet_data : null
      if (parameterKey && petData) {
        const rawLevel = Number(tooltipItem?.pet_level ?? tooltipItem?.petLevel ?? 0)
        const maxLevel = Number.isFinite(rawLevel) ? Math.max(1, Math.floor(rawLevel)) : 1
        let allMaxed = true
        for (let level = 1; level <= maxLevel; level += 1) {
          const maxGradeRaw = petAttributeGradeMaxByLevel?.[level] ?? 1
          const maxGrade = Number.isFinite(Number(maxGradeRaw)) ? Math.max(1, Math.floor(Number(maxGradeRaw))) : 1
          const levelEntry = petData?.[String(level)] && typeof petData[String(level)] === 'object' ? petData[String(level)] : null
          const paramEntry =
            levelEntry?.[parameterKey] && typeof levelEntry[parameterKey] === 'object' ? levelEntry[parameterKey] : null
          const gradeKey = paramEntry ? Object.keys(paramEntry)[0] : ''
          const grade = gradeKey ? Number(gradeKey) : NaN
          const currentValue = gradeKey ? Number(paramEntry?.[gradeKey]) : NaN
          const maxValue = resolveAttributeValue(values, maxGrade)
          if (
            !Number.isFinite(grade) ||
            grade < maxGrade ||
            !Number.isFinite(currentValue) ||
            currentValue < maxValue
          ) {
            allMaxed = false
            break
          }
        }
        if (allMaxed) {
          return false
        }
      }
    }
    if (!Number.isFinite(mainId)) {
      return true
    }
    if (Number(option?.id) !== mainId) {
      return true
    }
    const optionUid = option?.uniqueId ? String(option.uniqueId) : ''
    if (mainUid) {
      return optionUid !== mainUid
    }
    return false
  })
})

const sacrificeGradeMax = computed(() => {
  const level = sacrificeTargetLevel.value
  const maxGrade = Number(petAttributeGradeMaxByLevel?.[level] ?? 1)
  return Number.isFinite(maxGrade) ? Math.max(1, Math.floor(maxGrade)) : 1
})

const sacrificeGradeCapOptions = computed(() => {
  const maxGrade = sacrificeGradeMax.value
  if (!maxGrade || !Number.isFinite(maxGrade) || maxGrade <= 0) {
    return []
  }
  const list = []
  for (let i = 1; i <= maxGrade; i += 1) {
    list.push(i)
  }
  return list
})

/**
 * 选择高级宠物重铸卷轴
 * 用途/业务意图：设置献祭材料为卷轴（ID:11681），用于替代献祭宠物进行洗练
 * @param {number} id - 道具 ID（固定为 11681）
 * @returns {void}
 */
const selectSacrificeScroll = id => {
  playClickSound()
  selectedSacrificeScrollId.value = id
  selectedSacrificePetId.value = null
  selectedSacrificePetUniqueId.value = ''
  activePicker.value = null
}

/**
 * 标记献祭档位上限为手动设置
 * 用途/业务意图：用户手动调整档位上限后，避免后续自动覆盖其选择
 * @returns {void}
 */
const markSacrificeGradeCapManual = () => {
  sacrificeGradeCapManuallySet.value = true
}

watch(
  () => [selectedSacrificeMainPetId.value, selectedSacrificeMainPetUniqueId.value, sacrificeGradeMax.value],
  () => {
    const maxGrade = sacrificeGradeMax.value
    if (!sacrificeGradeCapManuallySet.value) {
      selectedSacrificeGradeCap.value = maxGrade
      return
    }
    const current = Number(selectedSacrificeGradeCap.value ?? 1)
    const next = Number.isFinite(current) ? Math.floor(current) : 1
    selectedSacrificeGradeCap.value = Math.min(Math.max(1, next), maxGrade)
  },
  { immediate: true }
)

watch(
  () => [selectedSacrificeMainPetId.value, selectedSacrificeMainPetUniqueId.value],
  () => {
    if (
      selectedSacrificeMainPetId.value &&
      selectedSacrificeMainPetItem.value &&
      isPetFullyMaxedForLevels1To7(selectedSacrificeMainPetId.value, selectedSacrificeMainPetItem.value)
    ) {
      showCraftMessage('该宠物 1-7 进阶等级属性已满，不能作为主宠物', 'warning')
      selectedSacrificeMainPetId.value = null
      selectedSacrificeMainPetUniqueId.value = ''
      activePicker.value = null
      return
    }
    selectedSacrificePetId.value = null
    selectedSacrificePetUniqueId.value = ''
    selectedSacrificeTargetLevel.value = selectedSacrificeMainPetLevel.value
    sacrificeGradeCapManuallySet.value = false
    if (isAutoSacrifice.value) {
      isAutoSacrifice.value = false
    }
  }
)

const evolveRandomOnlyPetId = 8600
const evolveFixedOutputByPetId = Object.freeze({})
const evolveExcludedPetIds = Object.freeze([8600])
const evolveCandyRequirementByNextLevel = Object.freeze({
  1: { candyId: 2313, count: 20, levelType: 'F' },
  2: { candyId: 5906, count: 20, levelType: 'E' },
  3: { candyId: 3380, count: 25, levelType: 'D' },
  4: { candyId: 8748, count: 25, levelType: 'C' },
  5: { candyId: 4371, count: 25, levelType: 'B' },
  6: { candyId: 6663, count: 50, levelType: 'A' },
  7: { candyId: 6663, count: 50, levelType: 'S' }
})
const evolveOutputPoolByPetId = Object.freeze({
  8600: {
    normal: [148, 885, 1644, 2563, 4817, 5471, 5851, 6296, 9941],
    rare: []
  }
})

/**
 * 解析进化后的目标阶段
 * 用途/业务意图：根据当前 pet_level 计算下一次进化后的 pet_level（不超过上限）
 * @param {number} currentLevel - 当前阶段 pet_level
 * @returns {number} 目标阶段 pet_level
 */
function resolveNextPetLevel (currentLevel) {
  const baseLevel = Number(currentLevel)
  const safeLevel = Number.isFinite(baseLevel) ? baseLevel : 0
  return Math.min(Math.max(safeLevel, 0) + 1, evolveMaxLevel)
}

/**
 * 解析当前选择的进化所需糖果
 * 用途/业务意图：按宠物ID与目标阶段计算所需糖果ID与数量
 * @param {number|null} petId - 进化宠物ID
 * @param {number} currentLevel - 当前阶段 pet_level
 * @returns {{ candyId: number, count: number, nextLevel: number }|null} 进化需求
 */
function resolveEvolveCandyRequirement (petId, currentLevel) {
  const id = Number(petId)
  if (!Number.isFinite(id)) {
    return null
  }
  const nextLevel = resolveNextPetLevel(currentLevel)
  if (id === 8600) {
    return { candyId: 2313, count: 10, nextLevel }
  }
  const row = evolveCandyRequirementByNextLevel[nextLevel] || null
  if (!row) {
    return null
  }
  return { candyId: row.candyId, count: row.count, nextLevel }
}

/**
 * 进化糖果的基础金币成本（gold cost，金币成本）
 * 用途/业务意图：用于计算进化成功后写入背包宠物的 sellPrice（售卖单价）
 * @type {Readonly<Record<number, number>>}
 */
const evolveCandyBaseGoldCostMap = Object.freeze({
  2313: 200000,
  5906: 500000,
  3380: 800000,
  8748: 1000000,
  4371: 1500000,
  6663: 2500000
})

const evolveCandyTierOrder = Object.freeze([2313, 5906, 3380, 8748, 4371, 6663])

/**
 * 进化糖果的品级累计金币成本
 * 规则示例：A级糖果总成本 = A + B + C + D + E + F
 * @type {Readonly<Record<number, number>>}
 */
const evolveCandyTierTotalGoldCostMap = (() => {
  const totals = {}
  let cumulative = 0
  evolveCandyTierOrder.forEach(id => {
    const base = Number(evolveCandyBaseGoldCostMap[id] ?? 0)
    const safeBase = Number.isFinite(base) ? Math.max(0, Math.floor(base)) : 0
    cumulative += safeBase
    totals[id] = cumulative
  })
  return Object.freeze(totals)
})()

/**
 * 获取进化糖果品级累计金币成本
 * 用途/业务意图：用于按“糖果成本 * 进化使用数量 / 2”写入进化产出宠物的 sellPrice（售卖单价）
 * @param {number} candyId - 糖果物品ID
 * @returns {number} 单个糖果的品级累计金币成本（>=0）
 */
function resolveEvolveCandyTierTotalGoldCost (candyId) {
  const id = Number(candyId)
  if (!Number.isFinite(id) || id <= 0) {
    return 0
  }
  const mapped = evolveCandyTierTotalGoldCostMap[id]
  if (Number.isFinite(mapped)) {
    return Math.max(0, Math.floor(mapped))
  }
  const fallbackRecipe = recipes.find(recipe => Number(recipe?.outputId) === id) || null
  const fallbackGold = Number(fallbackRecipe?.gold ?? 0)
  if (Number.isFinite(fallbackGold)) {
    return Math.max(0, Math.floor(fallbackGold))
  }
  console.error('[PetTrainerModal] 未找到糖果成本配置', { candyId })
  return 0
}

/**
 * 解析本次进化输出宠物ID
 * 用途/业务意图：按宠物ID的普通/稀有结果池随机决定进化产出
 * @param {number|null} petId - 进化宠物ID
 * @returns {number|null} 输出宠物ID
 */
function resolveEvolveOutputId (petId) {
  const id = Number(petId)
  if (!Number.isFinite(id)) {
    return null
  }
  if (id !== evolveRandomOnlyPetId) {
    const fixed = Number(evolveFixedOutputByPetId?.[id] ?? id)
    return Number.isFinite(fixed) ? fixed : id
  }
  const pool = evolveOutputPoolByPetId[id] || null
  const normal = Array.isArray(pool?.normal) ? pool.normal : []
  const rare = Array.isArray(pool?.rare) ? pool.rare : []
  const useRare = rare.length > 0 && Math.random() < evolveRareChance
  const primary = useRare ? rare : normal
  const fallback = useRare ? normal : rare
  const candidates = (primary.length ? primary : fallback).filter(candidateId => {
    const numeric = Number(candidateId)
    return Number.isFinite(numeric) && !evolveExcludedPetIds.includes(numeric)
  })
  if (!candidates.length) {
    const fallbackKeys = Object.keys(petsStore.petMap || {}).filter(key =>
      !evolveExcludedPetIds.includes(Number(key))
    )
    if (!fallbackKeys.length) {
      return null
    }
    const randomKey = fallbackKeys[Math.floor(Math.random() * fallbackKeys.length)]
    const fallbackId = Number(randomKey)
    return Number.isFinite(fallbackId) ? fallbackId : null
  }
  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  const pickedId = Number(picked)
  return Number.isFinite(pickedId) ? pickedId : null
}

const resolveEvolvePreviewCandidateIds = petId => {
  const id = Number(petId)
  if (!Number.isFinite(id)) {
    return []
  }
  if (id !== evolveRandomOnlyPetId) {
    const outputId = resolveEvolveOutputId(id)
    return Number.isFinite(outputId) ? [outputId] : []
  }
  const pool = evolveOutputPoolByPetId[id] || null
  const candidates = [
    ...(Array.isArray(pool?.normal) ? pool.normal : []),
    ...(Array.isArray(pool?.rare) ? pool.rare : [])
  ]
    .map(entry => Number(entry))
    .filter(entry => Number.isFinite(entry) && !evolveExcludedPetIds.includes(entry))

  const unique = Array.from(new Set(candidates))
  if (unique.length) {
    return unique
  }
  return Object.keys(petsStore.petMap || {})
    .map(key => Number(key))
    .filter(entry => Number.isFinite(entry) && !evolveExcludedPetIds.includes(entry))
}

watch(() => selectedEvolvePetId.value, value => {
  if (isEvolving.value) {
    return
  }
  const id = Number(value)
  if (!Number.isFinite(id)) {
    evolveRollingCandidateIds.value = []
    evolveRollingCurrentId.value = null
    evolveRollingFinalId.value = null
    evolveWheelRotationDeg.value = 0
    evolveWheelFinalRotationDeg.value = 0
    evolveProgress.value = 0
    return
  }
  const ids = resolveEvolvePreviewCandidateIds(id)
  evolveRollingCandidateIds.value = ids
  evolveRollingCurrentId.value = ids[0] ?? null
  evolveRollingFinalId.value = null
  evolveWheelRotationDeg.value = 0
  evolveWheelFinalRotationDeg.value = 0
  evolveProgress.value = 0
})

const isEvolveLevelMax = computed(() => selectedEvolvePetLevel.value >= evolveMaxLevel)
const evolveCandyRequirement = computed(() => {
  if (!selectedEvolvePetId.value || isEvolveLevelMax.value) {
    return null
  }
  return resolveEvolveCandyRequirement(selectedEvolvePetId.value, selectedEvolvePetLevel.value)
})
const evolveCandyId = computed(() => {
  return evolveCandyRequirement.value?.candyId ?? null
})
const evolveCandyOptions = computed(() => {
  if (!evolveCandyId.value) {
    return []
  }
  return buildOptions([evolveCandyId.value])
})
const evolveCandyRequiredCount = computed(() => {
  return evolveCandyRequirement.value?.count ?? 0
})
const selectedEvolvePetLabel = computed(() => {
  if (!selectedEvolvePetId.value) {
    return '未选择'
  }
  const count = bagCountMap.value.get(selectedEvolvePetId.value) || 0
  return `${resolveItemName(selectedEvolvePetId.value)} x${count}`
})
const selectedEvolveCandyLabel = computed(() => {
  if (!selectedEvolveCandyId.value) {
    return '未选择'
  }
  const count = bagCountMap.value.get(selectedEvolveCandyId.value) || 0
  return `${resolveItemName(selectedEvolveCandyId.value)} x${count}`
})
const selectedEvolvePetIcon = computed(() => {
  if (!selectedEvolvePetId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedEvolvePetId.value}.png`
})
const selectedEvolveCandyIcon = computed(() => {
  if (!selectedEvolveCandyId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedEvolveCandyId.value}.png`
})
const evolveRequiredQuantityLabel = computed(() => {
  if (!selectedEvolvePetId.value) {
    return '请选择需要进化的宠物查看需求数量'
  }
  if (isEvolveLevelMax.value) {
    return '宠物已达到进化极限,无法进化!'
  }
  if (!selectedEvolveCandyId.value) {
    return '请选择匹配糖果查看需求数量'
  }
  const parts = [
    `${resolveItemName(selectedEvolvePetId.value)} x1`,
    `${resolveItemName(selectedEvolveCandyId.value)} x${evolveCandyRequiredCount.value}`
  ]
  return `需要：${parts.join(' + ')}`
})

const helpPanelTitle = computed(() => {
  if (activeFeatureKey.value === 'evolve') {
    return '宠物进化'
  }
  if (activeFeatureKey.value === 'candy') {
    return '糖果配方'
  }
  if (activeFeatureKey.value === 'sacrifice') {
    return '宠物献祭'
  }
  return '帮助'
})

const petParameterLabelMap = Object.freeze({
  maxhp: '最大生命值',
  attack: '攻击力',
  criticalchance: '暴击率',
  criticaldamage: '暴击伤害',
  def: '防御',
  int: '智力',
  dex: '敏捷',
  str: '力量',
  sta: '体质'
})

const sacrificeParameterLabel = computed(() => {
  const id = Number(selectedSacrificeMainPetId.value)
  if (!Number.isFinite(id)) {
    return '未知属性'
  }
  const config = petsStore.petMap?.[String(id)] || null
  const key = typeof config?.parameter === 'string' ? config.parameter : ''
  return petParameterLabelMap[key] || key || '未知属性'
})

const sacrificeRequiredQuantityLabel = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '请选择主宠物查看需求'
  }
  if (sacrificeMaterialMode.value === 'scroll') {
    return `需要：${resolveItemName(selectedSacrificeMainPetId.value)} x1 + ${resolveItemName(sacrificeScrollItemId)} x1`
  }
  if (!selectedSacrificePetId.value) {
    return '请选择献祭宠物或高级宠物重铸卷轴查看需求'
  }
  return `需要：${resolveItemName(selectedSacrificeMainPetId.value)} x1 + ${resolveItemName(selectedSacrificePetId.value)} x1`
})

const sacrificeAttributeHint = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '请选择主宠物查看可洗练属性'
  }
  const type = sacrificeTargetLevelType.value
  const cap = Number(selectedSacrificeGradeCap.value ?? 1)
  const capSafe = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1
  const maxGrade = sacrificeGradeMax.value
  return `当前可洗练：${sacrificeParameterLabel.value}（${type}）档位 1-${maxGrade}，当前设置上限：${Math.min(
    capSafe,
    maxGrade
  )}`
})

const sacrificeGradeEffectiveMax = computed(() => {
  const cap = Number(selectedSacrificeGradeCap.value ?? 1)
  const capSafe = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1
  const rawMax = Number(sacrificeGradeMax.value ?? 1)
  const maxSafe = Number.isFinite(rawMax) ? Math.max(1, Math.floor(rawMax)) : 1
  return Math.min(capSafe, maxSafe)
})

const sacrificeHelpProbabilityRangeLabel = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '请选择主宠物后查看'
  }
  return `进阶等级属性 1-${sacrificeGradeEffectiveMax.value} 级随机概率`
})

const sacrificeGradeProbabilityRows = computed(() => {
  const activeMax = sacrificeGradeEffectiveMax.value
  const activeMaxSafe = Number.isFinite(Number(activeMax)) ? Math.max(1, Math.floor(Number(activeMax))) : 1
  const showMax = 9
  let totalWeight = 0
  for (let grade = 1; grade <= activeMaxSafe; grade += 1) {
    const weight = Number(petAttributeGradeWeightMap?.[grade] ?? 0)
    if (Number.isFinite(weight) && weight > 0) {
      totalWeight += weight
    }
  }
  const safeTotalWeight = totalWeight > 0 ? totalWeight : 0
  const rows = []
  for (let grade = 1; grade <= showMax; grade += 1) {
    const rawWeight = grade <= activeMaxSafe ? Number(petAttributeGradeWeightMap?.[grade] ?? 0) : 0
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 0
    const percent = safeTotalWeight ? (weight / safeTotalWeight) * 100 : 0
    rows.push({
      key: `sacrifice-grade-prob-${grade}`,
      grade,
      gradeLabel: `随机值 ${grade}:`,
      percentLabel: `${percent.toFixed(2)}%`
    })
  }
  return rows
})

const sacrificeAttributeTitle = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '献祭洗练（请选择主宠物）'
  }
  const level = sacrificeTargetLevel.value
  const type = sacrificeTargetLevelType.value
  return `${resolveItemName(selectedSacrificeMainPetId.value)}（${sacrificeParameterLabel.value} Lv${level}(${type})）`
})

const sacrificeTierAttributeRows = computed(() => {
  const mainId = Number(selectedSacrificeMainPetId.value)
  if (!Number.isFinite(mainId)) {
    return []
  }
  const config = petsStore.petMap?.[String(mainId)] || null
  const parameterKey = typeof config?.parameter === 'string' ? config.parameter : ''
  const values = Array.isArray(config?.values) ? config.values : []
  const maxLevel = Math.max(1, selectedSacrificeMainPetLevel.value || 1)
  const mainItem = selectedSacrificeMainPetItem.value
  const petData =
    mainItem?.pet_data && typeof mainItem.pet_data === 'object' ? mainItem.pet_data : null
  const rows = []
  for (let level = 1; level <= maxLevel; level += 1) {
    const levelType = petLevelTypeMap[level] || ''
    const maxGradeRaw = petAttributeGradeMaxByLevel?.[level] ?? 1
    const maxGrade = Number.isFinite(Number(maxGradeRaw)) ? Math.max(1, Math.floor(Number(maxGradeRaw))) : 1
    const maxValue = resolveAttributeValue(values, maxGrade)
    const levelKey = String(level)
    const levelEntry = petData?.[levelKey] && typeof petData[levelKey] === 'object' ? petData[levelKey] : null
    const paramEntry =
      parameterKey && levelEntry?.[parameterKey] && typeof levelEntry[parameterKey] === 'object'
        ? levelEntry[parameterKey]
        : null
    const currentGradeKey = paramEntry ? Object.keys(paramEntry)[0] : ''
    const currentGrade = currentGradeKey ? Number(currentGradeKey) : NaN
    const currentValue = currentGradeKey ? Number(paramEntry?.[currentGradeKey]) : NaN
    const gradeText = Number.isFinite(currentGrade) ? `${currentGrade}/${maxGrade}` : `—/${maxGrade}`
    const valueText = Number.isFinite(currentValue) ? `${currentValue}/${maxValue}` : `—/${maxValue}`
    rows.push({
      key: `sacrifice-tier-${level}`,
      level,
      levelLabel: `Lv${level} ${levelType}:`,
      gradeLabel: gradeText,
      valueLabel: valueText,
      isSelected: level === sacrificeTargetLevel.value
    })
  }
  return rows
})

const canSacrifice = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return false
  }
  const mainItem = selectedSacrificeMainPetItem.value
  if (!mainItem) {
    return false
  }
  if (sacrificeMaterialMode.value === 'scroll') {
    return sacrificeScrollOwned.value > 0
  }
  if (!selectedSacrificePetId.value) {
    return false
  }
  const sacrificeItem = selectedSacrificePetItem.value
  if (!sacrificeItem) {
    return false
  }
  if (
    Number(mainItem?.id) === Number(sacrificeItem?.id) &&
    mainItem?.uniqueId !== undefined &&
    mainItem?.uniqueId !== null &&
    sacrificeItem?.uniqueId !== undefined &&
    sacrificeItem?.uniqueId !== null &&
    String(mainItem.uniqueId) === String(sacrificeItem.uniqueId)
  ) {
    return false
  }
  const mainRank = resolveLevelTypeRank(sacrificeTargetLevelType.value)
  const sacrificeRank = resolveLevelTypeRank(selectedSacrificePetLevelType.value)
  return sacrificeRank >= mainRank
})

/**
 * 获取宠物在指定等级的当前洗练档位
 * 用途/业务意图：用于自动献祭判断是否已达到目标档位
 * @param {any} petItem - 背包宠物实例
 * @param {number} level - 目标等级
 * @param {string} parameterKey - 属性 key（如 maxhp/attack）
 * @returns {number|null} 档位（不存在返回 null）
 */
const resolvePetTierGradeKey = (petItem, level, parameterKey) => {
  if (!petItem || !parameterKey) {
    return null
  }
  const safeLevel = Number.isFinite(Number(level)) ? Math.max(1, Math.floor(Number(level))) : null
  if (!safeLevel) {
    return null
  }
  const petData = petItem?.pet_data && typeof petItem.pet_data === 'object' ? petItem.pet_data : null
  if (!petData) {
    return null
  }
  const levelKey = String(safeLevel)
  const levelEntry = petData?.[levelKey] && typeof petData[levelKey] === 'object' ? petData[levelKey] : null
  const paramEntry =
    levelEntry?.[parameterKey] && typeof levelEntry[parameterKey] === 'object' ? levelEntry[parameterKey] : null
  if (!paramEntry) {
    return null
  }
  const key = Object.keys(paramEntry)[0]
  const grade = key ? Number(key) : NaN
  return Number.isFinite(grade) && grade > 0 ? Math.floor(grade) : null
}

const autoSacrificeTargetGrade = computed(() => {
  const cap = Number(selectedSacrificeGradeCap.value ?? 1)
  const capSafe = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1
  return Math.min(capSafe, sacrificeGradeMax.value || 1)
})

const currentSacrificeTierGrade = computed(() => {
  const mainItem = selectedSacrificeMainPetItem.value
  const mainId = Number(selectedSacrificeMainPetId.value)
  if (!mainItem || !Number.isFinite(mainId)) {
    return null
  }
  const config = petsStore.petMap?.[String(mainId)] || null
  const parameterKey = typeof config?.parameter === 'string' ? config.parameter : ''
  if (!parameterKey) {
    return null
  }
  return resolvePetTierGradeKey(mainItem, sacrificeTargetLevel.value, parameterKey)
})

const canAutoSacrifice = computed(() => {
  // 必须手动选择主宠物
  if (!selectedSacrificeMainPetId.value) {
    return false
  }
  const current = Number(currentSacrificeTierGrade.value ?? 0)
  const target = Number(autoSacrificeTargetGrade.value ?? 1)
  if (Number.isFinite(current) && Number.isFinite(target) && current >= target) {
    return false
  }
  // 优先检查是否有高级宠物重铸卷轴
  if (sacrificeScrollOwned.value > 0) {
    return true
  }
  // 如果没有卷轴，检查是否有符合条件的献祭宠物
  const candidates = Array.isArray(sacrificePetOptions.value) ? sacrificePetOptions.value : []
  if (!candidates.length) {
    return false
  }
  return true
})

const sacrificeBlockedAutoMessage = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '请选择主宠物，自动献祭已停止'
  }
  const current = Number(currentSacrificeTierGrade.value ?? 0)
  const target = Number(autoSacrificeTargetGrade.value ?? 1)
  if (Number.isFinite(current) && Number.isFinite(target) && current >= target) {
    return `已达到目标档位（${target}），自动献祭已停止`
  }
  if (sacrificeMaterialMode.value === 'scroll' && sacrificeScrollOwned.value <= 0) {
    return '高级宠物重铸卷轴不足，自动献祭已停止'
  }
  const candidates = Array.isArray(sacrificePetOptions.value) ? sacrificePetOptions.value : []
  if (!candidates.length) {
    return '背包中暂无符合等级要求的献祭宠物，自动献祭已停止'
  }
  return '献祭材料不足，自动献祭已停止'
})

const sacrificeHelpMainLabel = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '未选择'
  }
  return `${selectedSacrificeMainPetLabel.value}（ID:${selectedSacrificeMainPetId.value}）`
})

const sacrificeHelpPetLabel = computed(() => {
  if (!selectedSacrificePetId.value) {
    return '未选择'
  }
  return `${selectedSacrificePetLabel.value}（ID:${selectedSacrificePetId.value}）`
})

const sacrificeHelpGradeCapLabel = computed(() => {
  if (!selectedSacrificeMainPetId.value) {
    return '—'
  }
  const maxGrade = sacrificeGradeMax.value
  const cap = Number(selectedSacrificeGradeCap.value ?? 1)
  const capSafe = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1
  return `1-${Math.min(capSafe, maxGrade)}（等级上限：${maxGrade}）`
})

const sacrificeCurrentValueInfo = computed(() => {
  const mainItem = selectedSacrificeMainPetItem.value
  const mainId = Number(selectedSacrificeMainPetId.value)
  if (!mainItem || !Number.isFinite(mainId)) {
    return '—'
  }
  const config = petsStore.petMap?.[String(mainId)] || null
  const parameterKey = typeof config?.parameter === 'string' ? config.parameter : ''
  if (!parameterKey) {
    return '—'
  }
  const petData = mainItem?.pet_data && typeof mainItem.pet_data === 'object' ? mainItem.pet_data : null
  if (!petData) {
    return '—'
  }
  const levelKey = String(selectedSacrificeMainPetLevel.value)
  const levelEntry = petData?.[levelKey] && typeof petData[levelKey] === 'object' ? petData[levelKey] : null
  if (!levelEntry) {
    return '—'
  }
  const paramEntry =
    levelEntry?.[parameterKey] && typeof levelEntry[parameterKey] === 'object' ? levelEntry[parameterKey] : null
  if (!paramEntry) {
    return '—'
  }
  const keys = Object.keys(paramEntry)
  if (!keys.length) {
    return '—'
  }
  const gradeKey = keys[0]
  const value = Number(paramEntry[gradeKey])
  if (!Number.isFinite(value)) {
    return `当前档位：${gradeKey}`
  }
  const suffix = config?.rate ? '%' : ''
  return `当前档位：${gradeKey}（${value}${suffix}）`
})
const evolveHelpPetLabel = computed(() => {
  if (!selectedEvolvePetId.value) {
    return '未选择'
  }
  return `${resolveItemName(selectedEvolvePetId.value)}（ID:${selectedEvolvePetId.value}）`
})
const evolveHelpCandy = computed(() => {
  const requirement = resolveEvolveCandyRequirement(selectedEvolvePetId.value, selectedEvolvePetLevel.value)
  if (!requirement) {
    return null
  }
  return {
    id: requirement.candyId,
    count: requirement.count,
    name: resolveItemName(requirement.candyId)
  }
})
const evolveCandyTableDisplay = computed(() => {
  return Object.entries(evolveCandyRequirementByNextLevel).map(([nextLevel, row]) => {
    const levelNumber = Number(nextLevel)
    const levelType = row?.levelType || petLevelTypeMap[levelNumber] || ''
    const levelLabel = levelType ? `Lv${levelNumber}(${levelType})` : `Lv${levelNumber}`
    const candyId = Number(row?.candyId ?? 0)
    const count = Number(row?.count ?? 0)
    return {
      key: `evolve-candy-${nextLevel}`,
      levelLabel,
      candyId,
      candyName: resolveItemName(candyId),
      count
    }
  })
})

const currentRecipe = computed(() => {
  const materialId = selectedMaterialId.value
  const candyId = selectedCandyId.value ?? null
  if (!materialId) {
    return null
  }
  return recipes.find(recipe => recipe.materialId === materialId && recipe.candyId === candyId) || null
})

const craftBatchSize = 10

const candyRequiredHintLabel = computed(() => {
  if (!selectedMaterialId.value) {
    return '请选择制作材料查看需求数量'
  }
  if (!currentRecipe.value) {
    return '请选择匹配糖果查看需求数量'
  }
  return ''
})

const resolveCandyRequiredQuantityLabel = quantity => {
  if (!currentRecipe.value) {
    return ''
  }
  const recipe = currentRecipe.value
  const resolvedQuantity = Math.max(1, Math.floor(Number(quantity ?? 1)))
  const parts = []
  const materialCount = Number(recipe.materialCount ?? 0) * resolvedQuantity
  if (materialCount > 0) {
    parts.push(`${resolveItemName(recipe.materialId)}*${materialCount}`)
  }
  if (recipe.candyId) {
    const candyCount = Number(recipe.candyCount ?? 0) * resolvedQuantity
    if (candyCount > 0) {
      parts.push(`${resolveItemName(recipe.candyId)}*${candyCount}`)
    }
  }
  return parts.length ? parts.join('+') : '暂无需求数据'
}

const craftRequiredQuantityLabel = computed(() => {
  if (candyRequiredHintLabel.value) {
    return ''
  }
  return resolveCandyRequiredQuantityLabel(craftBatchSize)
})

const autoCraftRequiredQuantityLabel = computed(() => {
  if (candyRequiredHintLabel.value) {
    return ''
  }
  return resolveCandyRequiredQuantityLabel(autoCraftBatchSize)
})

const maxCraftCount = computed(() => {
  if (!currentRecipe.value) {
    return 0
  }
  const recipe = currentRecipe.value
  const materialCount = Number(recipe.materialCount ?? 0)
  if (!materialCount) {
    return 0
  }
  const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
  const materialPossible = Math.floor(materialOwned / materialCount)
  let candyPossible = Infinity
  if (recipe.candyId) {
    const candyCount = Number(recipe.candyCount ?? 0)
    if (candyCount <= 0) {
      return 0
    }
    const candyOwned = bagCountMap.value.get(recipe.candyId) || 0
    candyPossible = Math.floor(candyOwned / candyCount)
  }
  const possible = Math.min(materialPossible, candyPossible)
  if (!Number.isFinite(possible) || possible <= 0) {
    return 0
  }
  return possible
})

const maxCraftCountLabel = computed(() => {
  return `x${maxCraftCount.value}`
})

const resultLabel = computed(() => {
  if (!currentRecipe.value) {
    return '—'
  }
  return resolveItemName(currentRecipe.value.outputId)
})

const selectedMaterialIcon = computed(() => {
  if (!selectedMaterialId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedMaterialId.value}.png`
})

const selectedCandyIcon = computed(() => {
  if (!selectedCandyId.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${selectedCandyId.value}.png`
})

const resultIcon = computed(() => {
  if (!currentRecipe.value) {
    return defaultSlotIcon
  }
  return `/pt/item_icon/${currentRecipe.value.outputId}.png`
})

const hasResult = computed(() => Boolean(currentRecipe.value))

const currentGold = computed(() => {
  const gold = itemsStore.playerGold ?? gameStore.player?.gold ?? 0
  const resolved = Number(gold)
  return Number.isFinite(resolved) ? resolved : 0
})

const autoCraftBatchSize = 100
const canCraftByCount = count => {
  if (!currentRecipe.value) {
    return false
  }
  const recipe = currentRecipe.value
  const quantity = Math.max(1, Number(count || 1))
  const materialCount = Number(recipe.materialCount ?? 0) * quantity
  const candyCount = Number(recipe.candyCount ?? 0) * quantity
  const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
  const candyOwned = recipe.candyId ? bagCountMap.value.get(recipe.candyId) || 0 : 0
  const goldEnough = currentGold.value >= Number(recipe.gold ?? 0) * quantity
  const materialEnough = materialOwned >= materialCount
  const candyEnough = recipe.candyId ? candyOwned >= candyCount : true
  return materialEnough && candyEnough && goldEnough
}

const resolveCraftableCount = limit => {
  if (!currentRecipe.value) {
    return 0
  }
  const recipe = currentRecipe.value
  const maxLimit = Math.max(0, Math.floor(Number(limit ?? 0)))
  if (!maxLimit) {
    return 0
  }
  const materialPerCraft = Math.max(0, Number(recipe.materialCount ?? 0))
  if (!materialPerCraft) {
    return 0
  }
  const candyPerCraft = Math.max(0, Number(recipe.candyCount ?? 0))
  const goldPerCraft = Math.max(0, Number(recipe.gold ?? 0))
  const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
  const byMaterial = Math.floor(materialOwned / materialPerCraft)
  let byCandy = Infinity
  if (recipe.candyId) {
    if (!candyPerCraft) {
      return 0
    }
    const candyOwned = bagCountMap.value.get(recipe.candyId) || 0
    byCandy = Math.floor(candyOwned / candyPerCraft)
  }
  const byGold = goldPerCraft > 0 ? Math.floor(currentGold.value / goldPerCraft) : Infinity
  const possible = Math.min(byMaterial, byCandy, byGold, maxLimit)
  return Number.isFinite(possible) ? Math.max(0, Math.floor(possible)) : 0
}
const canCraft = computed(() => canCraftByCount(craftBatchSize))
const canAutoCraft = computed(() => resolveCraftableCount(1) > 0)
const canEvolve = computed(() => {
  if (!selectedEvolvePetId.value || !selectedEvolveCandyId.value) {
    return false
  }
  if (isEvolveLevelMax.value) {
    return false
  }
  const petOwned = bagCountMap.value.get(selectedEvolvePetId.value) || 0
  const candyOwned = bagCountMap.value.get(selectedEvolveCandyId.value) || 0
  return petOwned >= 1 && candyOwned >= evolveCandyRequiredCount.value
})
const canAutoEvolve = computed(() => {
  const petId = Number(selectedEvolvePetId.value)
  if (!Number.isFinite(petId) || petId <= 0) {
    return false
  }

  if (petId === 8600) {
    const eggOwned = bagCountMap.value.get(8600) || 0
    if (eggOwned < 1) {
      return false
    }
    const eggItem = bagItems.value.find(item => Number(item?.id) === 8600) || null
    const eggLevelRaw = Number(eggItem?.pet_level ?? eggItem?.petLevel ?? 1)
    const eggLevel = Number.isFinite(eggLevelRaw) ? Math.max(1, Math.min(evolveMaxLevel, eggLevelRaw)) : 1
    const requirement = resolveEvolveCandyRequirement(8600, eggLevel)
    if (!requirement?.candyId) {
      return false
    }
    const candyOwned = bagCountMap.value.get(requirement.candyId) || 0
    return candyOwned >= Number(requirement.count ?? 0)
  }

  const targetLevel = Number(selectedEvolveTargetLevel.value)
  if (Number.isFinite(targetLevel) && targetLevel >= 2 && targetLevel <= evolveMaxLevel) {
    const candidate = selectedEvolvePetItem.value
    if (!candidate || Number(candidate?.id) !== petId) {
      return false
    }
    const levelRaw = Number(candidate?.pet_level ?? candidate?.petLevel ?? 0)
    const level = Number.isFinite(levelRaw) ? Math.max(1, Math.min(evolveMaxLevel, levelRaw)) : 1
    if (level >= targetLevel || level >= evolveMaxLevel) {
      return false
    }
    const requirement = resolveEvolveCandyRequirement(petId, level)
    if (!requirement?.candyId) {
      return false
    }
    const candyOwned = bagCountMap.value.get(requirement.candyId) || 0
    return candyOwned >= Number(requirement.count ?? 0)
  }

  return canEvolve.value
})
const evolveBlockedMessage = computed(() =>
  isEvolveLevelMax.value ? `宠物已达最高阶段（${evolveMaxLevel}），无法进化` : '进化材料不足，无法进化'
)
const evolveBlockedAutoMessage = computed(() =>
  isEvolveLevelMax.value ? `宠物已达最高阶段（${evolveMaxLevel}），自动进化已停止` : '进化材料不足，自动进化已停止'
)

/**
 * 格式化金币显示文本
 * 用途/业务意图：制作糖果面板统一使用“每4位加逗号”的金币显示格式
 * @param {unknown} value - 金币数值
 * @returns {string} 格式化后的金币文本
 */
const formatGoldLabel = value => {
  const numeric = Number(value ?? 0)
  const safe = Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : 0
  return String(safe).replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

const formattedCraftGold = computed(() => {
  const gold = Number(currentRecipe.value?.gold ?? 0) * craftBatchSize
  return formatGoldLabel(gold)
})

const formattedAutoCraftGold = computed(() => {
  const gold = Number(currentRecipe.value?.gold ?? 0) * autoCraftBatchSize
  return formatGoldLabel(gold)
})

const recipeDisplayList = computed(() => {
  return recipes.map((recipe, index) => {
    const inputs = [
      {
        id: recipe.materialId,
        count: recipe.materialCount,
        name: resolveItemName(recipe.materialId),
        key: `material-${recipe.materialId}-${index}`
      }
    ]
    if (recipe.candyId) {
      inputs.push({
        id: recipe.candyId,
        count: recipe.candyCount,
        name: resolveItemName(recipe.candyId),
        key: `candy-${recipe.candyId}-${index}`
      })
    }
    const goldLabel = formatGoldLabel(recipe.gold)
    return {
      key: `recipe-${index}`,
      inputs,
      outputId: recipe.outputId,
      outputName: resolveItemName(recipe.outputId),
      goldLabel: `${goldLabel} 金币`
    }
  })
})

const selectFeature = key => {
  playClickSound()
  // 切换功能面板时重置当前面板
  if (key === 'candy') {
    resetCandy()
  } else if (key === 'evolve') {
    resetEvolve()
  } else if (key === 'sacrifice') {
    resetSacrifice()
  }
  activeFeatureKey.value = key
}

const refreshDialog = () => {
  const randomIndex = Math.floor(Math.random() * dialogLines.length)
  activeDialog.value = dialogLines[randomIndex]
}

const handleDragStart = ({ element, x, y }) => {
  if (!element) {
    return
  }
  element.style.transform = 'none'
  element.style.left = `${x}px`
  element.style.top = `${y}px`
  refreshRecipePanelPosition()
}

const handleDragMove = () => {
  refreshRecipePanelPosition()
}

const handleDragEnd = () => {
  refreshRecipePanelPosition()
}

const playClickSound = () => {
  const audioService = props.gameInitializer?.services?.audio
  if (audioService) {
    if (typeof audioService.playClickSFX === 'function') {
      audioService.playClickSFX()
      return
    }
    if (typeof audioService.playSFX === 'function') {
      audioService.playSFX('InfClick.wav')
      return
    }
  }
  if (typeof window !== 'undefined' && typeof window.playClickSound === 'function') {
    window.playClickSound()
  }
}

const playEvolveActionSound = () => {
  const audioService = props.gameInitializer?.services?.audio
  if (audioService && typeof audioService.playSFX === 'function') {
    audioService.playSFX('ActionRegister.wav')
    return
  }
  try {
    const audio = new Audio('/sound/ActionRegister.wav')
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('[PetTrainerModal] 播放进化音效失败:', error)
      })
    }
  } catch (error) {
    console.error('[PetTrainerModal] 初始化进化音效失败:', error)
  }
}

const materialConsumeAnimKey = ref(0)
const materialConsumeAnimText = ref('')
const materialConsumeAnimVisible = ref(false)
let materialConsumeAnimTimer = null

const candyConsumeAnimKey = ref(0)
const candyConsumeAnimText = ref('')
const candyConsumeAnimVisible = ref(false)
let candyConsumeAnimTimer = null

const triggerConsumeAnim = ({ type, text }) => {
  const resolvedType = type === 'candy' ? 'candy' : 'material'
  const resolvedText = typeof text === 'string' ? text : ''
  if (!resolvedText) {
    return
  }
  const durationMs = 3000
  if (resolvedType === 'candy') {
    if (candyConsumeAnimTimer) {
      clearTimeout(candyConsumeAnimTimer)
      candyConsumeAnimTimer = null
    }
    candyConsumeAnimKey.value += 1
    candyConsumeAnimText.value = resolvedText
    candyConsumeAnimVisible.value = true
    candyConsumeAnimTimer = setTimeout(() => {
      candyConsumeAnimVisible.value = false
      candyConsumeAnimTimer = null
    }, durationMs)
    return
  }
  if (materialConsumeAnimTimer) {
    clearTimeout(materialConsumeAnimTimer)
    materialConsumeAnimTimer = null
  }
  materialConsumeAnimKey.value += 1
  materialConsumeAnimText.value = resolvedText
  materialConsumeAnimVisible.value = true
  materialConsumeAnimTimer = setTimeout(() => {
    materialConsumeAnimVisible.value = false
    materialConsumeAnimTimer = null
  }, durationMs)
}

const togglePicker = type => {
  playClickSound()
  activePicker.value = activePicker.value === type ? null : type
}

const selectMaterial = id => {
  playClickSound()
  selectedMaterialId.value = id
  activePicker.value = null
}

const selectCandy = id => {
  playClickSound()
  selectedCandyId.value = id
  activePicker.value = null
}

const selectEvolvePet = payload => {
  playClickSound()
  const id = typeof payload === 'object' ? payload?.id : payload
  const uid = typeof payload === 'object' ? payload?.uniqueId : ''
  selectedEvolvePetId.value = id
  selectedEvolvePetUniqueId.value = uid ? String(uid) : ''
  selectedEvolveTargetLevel.value = 0
  const requirement = resolveEvolveCandyRequirement(id, selectedEvolvePetLevel.value)
  selectedEvolveCandyId.value = requirement?.candyId ?? null
  activePicker.value = null
}

const selectEvolveCandy = id => {
  playClickSound()
  selectedEvolveCandyId.value = id
  activePicker.value = null
}

/**
 * 选择献祭主宠物
 * 用途/业务意图：设置当前献祭功能的主宠物实例（支持 uniqueId）
 * @param {{id:number,uniqueId?:string}|number} payload - 选择项或宠物ID
 * @returns {void}
 */
const selectSacrificeMainPet = payload => {
  playClickSound()
  const id = typeof payload === 'object' ? payload?.id : payload
  const uid = typeof payload === 'object' ? payload?.uniqueId : ''
  const numericId = Number(id)
  const normalizedUid = uid ? String(uid) : ''
  let tooltipItem = typeof payload === 'object' ? payload?.tooltipItem : null
  if (!tooltipItem && Number.isFinite(numericId)) {
    if (normalizedUid) {
      tooltipItem =
        bagItems.value.find(
          item =>
            Number(item?.id) === numericId &&
            item?.uniqueId !== undefined &&
            item?.uniqueId !== null &&
            String(item.uniqueId) === normalizedUid
        ) || null
    } else {
      tooltipItem = bagItems.value.find(item => Number(item?.id) === numericId) || null
    }
  }
  if (tooltipItem && isPetFullyMaxedForLevels1To7(numericId, tooltipItem)) {
    showCraftMessage('该宠物 1-7 进阶等级属性已满，不能作为主宠物', 'warning')
    activePicker.value = null
    return
  }
  selectedSacrificeMainPetId.value = id
  selectedSacrificeMainPetUniqueId.value = normalizedUid
  activePicker.value = null
}

/**
 * 选择献祭宠物
 * 用途/业务意图：设置当前献祭功能的献祭宠物实例（支持 uniqueId）
 * @param {{id:number,uniqueId?:string}|number} payload - 选择项或宠物ID
 * @returns {void}
 */
const selectSacrificePet = payload => {
  playClickSound()
  const id = typeof payload === 'object' ? payload?.id : payload
  const uid = typeof payload === 'object' ? payload?.uniqueId : ''
  if (
    selectedSacrificeMainPetId.value &&
    Number(id) === Number(selectedSacrificeMainPetId.value) &&
    String(uid || '') === String(selectedSacrificeMainPetUniqueId.value || '')
  ) {
    showCraftMessage('献祭宠物不能选择主宠物本体', 'warning')
    activePicker.value = null
    return
  }
  selectedSacrificePetId.value = id
  selectedSacrificePetUniqueId.value = uid ? String(uid) : ''
  selectedSacrificeScrollId.value = null
  activePicker.value = null
}

/**
 * 自动选择符合条件的献祭宠物
 * 用途/业务意图：自动献祭时从候选列表中挑选一个可用献祭宠物，并写入选择状态
 * 优先级：1. 高级宠物重铸卷轴 > 2. 进阶等级 >= 主宠物的献祭宠物
 * @returns {boolean} 是否成功选中
 */
const autoSelectQualifiedSacrificePet = () => {
  // 优先使用高级宠物重铸卷轴
  if (sacrificeScrollOwned.value > 0) {
    selectedSacrificeScrollId.value = sacrificeScrollItemId
    selectedSacrificePetId.value = null
    selectedSacrificePetUniqueId.value = ''
    return true
  }

  // 获取主宠物的进阶等级
  const mainPetLevel = sacrificeTargetLevel.value

  const candidates = Array.isArray(sacrificePetOptions.value) ? sacrificePetOptions.value : []
  if (!candidates.length) {
    return false
  }

  // 筛选进阶等级 >= 主宠物的献祭宠物
  const qualifiedPets = candidates.filter(option => {
    const tooltipItem = option?.tooltipItem
    const petLevel = Number(tooltipItem?.pet_level ?? tooltipItem?.petLevel ?? 0)
    return Number.isFinite(petLevel) && petLevel >= mainPetLevel
  })

  // 如果有符合条件的宠物，选择第一个
  if (qualifiedPets.length > 0) {
    const chosen = qualifiedPets[0]
    selectedSacrificePetId.value = chosen.id
    selectedSacrificePetUniqueId.value = chosen.uniqueId ? String(chosen.uniqueId) : ''
    selectedSacrificeScrollId.value = null
    return true
  }

  // 如果没有符合条件的，降级选择任意可用宠物
  const chosen = candidates[0]
  if (!chosen) {
    return false
  }
  selectedSacrificePetId.value = chosen.id
  selectedSacrificePetUniqueId.value = chosen.uniqueId ? String(chosen.uniqueId) : ''
  selectedSacrificeScrollId.value = null
  return true
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const getAutoStopMessage = count => {
  if (!currentRecipe.value) {
    return '请选择匹配的材料与糖果'
  }
  const recipe = currentRecipe.value
  const quantity = Math.max(1, Number(count || 1))
  const materialCount = Number(recipe.materialCount ?? 0) * quantity
  const candyCount = Number(recipe.candyCount ?? 0) * quantity
  const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
  const candyOwned = recipe.candyId ? bagCountMap.value.get(recipe.candyId) || 0 : 0
  const goldEnough = currentGold.value >= Number(recipe.gold ?? 0) * quantity
  const materialEnough = materialOwned >= materialCount
  const candyEnough = recipe.candyId ? candyOwned >= candyCount : true
  if (!materialEnough) {
    return quantity > 1 ? `材料不足（${quantity}份），自动合成已停止` : '材料不足，自动合成已停止'
  }
  if (!candyEnough) {
    return quantity > 1 ? `糖果不足（${quantity}份），自动合成已停止` : '糖果不足，自动合成已停止'
  }
  if (!goldEnough) {
    return quantity > 1 ? `金币不足（${quantity}份），自动合成已停止` : '金币不足，自动合成已停止'
  }
  return '自动合成已停止'
}

const stopAutoCraftWithMessage = (message, count = 1) => {
  if (isAutoCraft.value) {
    isAutoCraft.value = false
  }
  if (currentRecipe.value) {
    const recipe = currentRecipe.value
    const quantity = Math.max(1, Number(count || 1))
    const materialCount = Number(recipe.materialCount ?? 0) * quantity
    const candyCount = Number(recipe.candyCount ?? 0) * quantity
    const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
    const candyOwned = recipe.candyId ? bagCountMap.value.get(recipe.candyId) || 0 : 0
    const materialEnough = materialOwned >= materialCount
    const candyEnough = recipe.candyId ? candyOwned >= candyCount : true
    if (!materialEnough || !candyEnough) {
      selectedMaterialId.value = null
      selectedCandyId.value = null
    }
  }
  if (message && !autoStopNotified.value) {
    autoStopNotified.value = true
    showCraftMessage(message, 'warning')
  }
}

const runAutoCraft = async () => {
  if (isAutoCrafting.value) {
    return
  }
  isAutoCrafting.value = true
  try {
    while (isAutoCraft.value) {
      if (isCrafting.value) {
        await sleep(120)
        continue
      }
      const craftable = resolveCraftableCount(autoCraftBatchSize)
      if (!craftable) {
        stopAutoCraftWithMessage(getAutoStopMessage(1), 1)
        break
      }
      const success = await handleCraft({
        skipClickSound: true,
        suppressWarnings: true,
        autoMode: true,
        craftCount: craftable
      })
      if (!success) {
        stopAutoCraftWithMessage(getAutoStopMessage(1), 1)
        break
      }
      await sleep(120)
    }
  } finally {
    isAutoCrafting.value = false
  }
}

const toggleAutoCraft = () => {
  playClickSound()
  if (isAutoCraft.value) {
    isAutoCraft.value = false
    showCraftMessage('已停止自动合成', 'info')
    return
  }
  if (!canAutoCraft.value) {
    stopAutoCraftWithMessage(getAutoStopMessage(1), 1)
    return
  }
  isAutoCraft.value = true
  autoStopNotified.value = false
  if (isAutoCraft.value) {
    runAutoCraft()
  }
}

const showCraftMessage = (message, type = 'info') => {
  if (props.addBattleLog && typeof props.addBattleLog === 'function') {
    props.addBattleLog(message, type)
  }
}

const resolvePlayerName = () => {
  const name = gameStore.player?.nickname
  return name && String(name).trim() ? String(name) : '玩家'
}

const buildTooltipItem = itemId => {
  const resolvedId = Number(itemId)
  if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
    return null
  }
  const config = itemsStore.getItemConfig(resolvedId)
  if (config) {
    return { ...config, id: resolvedId }
  }
  return { id: resolvedId, name: resolveItemName(resolvedId) }
}

const resolveTooltipPayload = payload => {
  if (!payload) {
    return null
  }
  if (typeof payload === 'object') {
    const resolvedId = Number(payload?.id)
    if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
      return null
    }
    return payload?.id === resolvedId ? payload : { ...payload, id: resolvedId }
  }
  return buildTooltipItem(payload)
}

const showItemTooltip = (event, payload) => {
  const tooltipItem = resolveTooltipPayload(payload)
  if (!tooltipItem) {
    return
  }
  const tooltipEvent = new CustomEvent('show-item-tooltip', {
    detail: {
      item: tooltipItem,
      position: { x: event.clientX + 12, y: event.clientY + 12 }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

const hideItemTooltip = () => {
  const tooltipEvent = new CustomEvent('hide-item-tooltip')
  window.dispatchEvent(tooltipEvent)
}

const updateTooltipPosition = event => {
  const tooltipEvent = new CustomEvent('move-item-tooltip', {
    detail: {
      position: { x: event.clientX + 12, y: event.clientY + 12 }
    }
  })
  window.dispatchEvent(tooltipEvent)
}

const startCraftProgress = () => {
  craftProgress.value = 0
  const duration = 900
  const step = 30
  const totalSteps = Math.ceil(duration / step)
  let currentStep = 0
  return new Promise(resolve => {
    const timer = setInterval(() => {
      currentStep += 1
      craftProgress.value = Math.min(100, Math.round((currentStep / totalSteps) * 100))
      if (craftProgress.value >= 100) {
        clearInterval(timer)
        resolve(true)
      }
    }, step)
  })
}

const startEvolveProgress = (options = {}) => {
  const ids = Array.isArray(options?.candidateIds) ? options.candidateIds : []
  const finalId = Number(options?.finalId)
  evolveRollingCandidateIds.value = ids.filter(id => Number.isFinite(Number(id))).map(id => Number(id))
  evolveRollingFinalId.value = Number.isFinite(finalId) ? finalId : null
  evolveRollingCurrentId.value = evolveRollingCandidateIds.value[0] ?? evolveRollingFinalId.value ?? null
  const wheelCount = evolveRollingCandidateIds.value.length
  const stepAngle = wheelCount ? 360 / wheelCount : 0
  const finalIndex = evolveRollingFinalId.value
    ? evolveRollingCandidateIds.value.indexOf(evolveRollingFinalId.value)
    : -1
  evolveWheelFinalRotationDeg.value = finalIndex >= 0 ? -stepAngle * finalIndex : 0
  evolveWheelRotationDeg.value = 0
  evolveProgress.value = 0
  const duration = 3000
  const step = 30
  const totalSteps = Math.ceil(duration / step)
  const spinTurns = 4
  const totalRotationDeg = -(spinTurns * 360) + evolveWheelFinalRotationDeg.value
  let currentStep = 0
  return new Promise(resolve => {
    const timer = setInterval(() => {
      currentStep += 1
      const t = Math.min(1, currentStep / totalSteps)
      const eased = 1 - Math.pow(1 - t, 3)
      evolveProgress.value = Math.min(100, Math.round(t * 100))
      if (evolveRollingCandidateIds.value.length && stepAngle > 0) {
        const rotationDeg = totalRotationDeg * eased
        evolveWheelRotationDeg.value = rotationDeg
        const rawIndex = Math.round(-rotationDeg / stepAngle)
        const normalizedIndex =
          ((rawIndex % evolveRollingCandidateIds.value.length) + evolveRollingCandidateIds.value.length) %
          evolveRollingCandidateIds.value.length
        evolveRollingCurrentId.value =
          evolveRollingCandidateIds.value[normalizedIndex] ?? evolveRollingCurrentId.value
      }
      if (evolveProgress.value >= 100) {
        clearInterval(timer)
        if (evolveRollingFinalId.value) {
          evolveRollingCurrentId.value = evolveRollingFinalId.value
          evolveWheelRotationDeg.value = totalRotationDeg
        }
        resolve(true)
      }
    }, step)
  })
}

const startSacrificeProgress = () => {
  sacrificeProgress.value = 0
  const duration = 900
  const step = 30
  const totalSteps = Math.ceil(duration / step)
  let currentStep = 0
  return new Promise(resolve => {
    const timer = setInterval(() => {
      currentStep += 1
      sacrificeProgress.value = Math.min(100, Math.round((currentStep / totalSteps) * 100))
      if (sacrificeProgress.value >= 100) {
        clearInterval(timer)
        resolve(true)
      }
    }, step)
  })
}

/**
 * 解析献祭洗练档位（grade）抽取结果
 * 用途/业务意图：按权重从 1..maxGrade 抽取档位，用于献祭洗练写入 pet_data
 * @param {number} maxGrade - 档位上限
 * @returns {number} 抽取到的档位
 */
const resolveWeightedGradeKey = maxGrade => {
  const safeMax = Math.max(1, Math.floor(Number(maxGrade ?? 1)))
  const candidates = []
  let totalWeight = 0
  for (let grade = 1; grade <= safeMax; grade += 1) {
    const weight = Number(petAttributeGradeWeightMap?.[grade] ?? 0)
    if (!Number.isFinite(weight) || weight <= 0) {
      continue
    }
    totalWeight += weight
    candidates.push({ grade, weight })
  }
  if (!candidates.length || totalWeight <= 0) {
    return 1
  }
  const roll = Math.random() * totalWeight
  let cursor = 0
  for (const candidate of candidates) {
    cursor += candidate.weight
    if (roll <= cursor) {
      return candidate.grade
    }
  }
  return candidates[candidates.length - 1].grade
}

/**
 * 解析指定档位对应的真实属性值
 * 用途/业务意图：根据 PET_TYPE.values 映射档位到数值，兼容数组下标偏移与缺省回退
 * @param {unknown[]} values - 成长配置 values
 * @param {number|string} gradeKey - 抽取到的档位
 * @returns {number} 属性值
 */
const resolveAttributeValue = (values, gradeKey) => {
  if (!Array.isArray(values) || !values.length) {
    return 0
  }
  const numericKey = Math.max(1, Math.floor(Number(gradeKey ?? 1)))
  const zeroBasedIndex = numericKey - 1
  const preferred = Number(values[zeroBasedIndex])
  if (Number.isFinite(preferred)) {
    return preferred
  }
  const legacy = Number(values[numericKey])
  if (Number.isFinite(legacy)) {
    return legacy
  }
  const fallback = Number(values[0])
  return Number.isFinite(fallback) ? fallback : 0
}

/**
 * 解析指定阶段的最大能量（max_energy）
 * 用途/业务意图：从成长配置 tiers 读取 maxEnergy/max_energy，供写入 pet_data 使用
 * @param {any} config - 宠物成长配置
 * @param {number} index - 阶段索引（level - 1）
 * @returns {number} 最大能量
 */
const resolveTierMaxEnergy = (config, index) => {
  const raw = config?.tiers?.[index]?.maxEnergy ?? config?.tiers?.[index]?.max_energy ?? 0
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

const handleCraft = async (options = {}) => {
  const { skipClickSound = false, suppressWarnings = false, autoMode = false, craftCount = 1 } = options
  const quantity = Math.max(1, Number(craftCount || 1))
  if (isCrafting.value) {
    return false
  }
  if (!skipClickSound) {
    playClickSound()
  }
  if (!currentRecipe.value) {
    if (!suppressWarnings) {
      showCraftMessage('请选择匹配的材料与糖果', 'warning')
    } else if (autoMode) {
      showCraftMessage(getAutoStopMessage(quantity), 'warning')
    }
    return false
  }
  if (!canCraftByCount(quantity)) {
    if (!suppressWarnings) {
      showCraftMessage('材料或金币不足，无法合成', 'warning')
    } else if (autoMode) {
      showCraftMessage(getAutoStopMessage(quantity), 'warning')
    }
    return false
  }
  isCrafting.value = true
  try {
    await startCraftProgress()
    if (!currentRecipe.value || !canCraftByCount(quantity)) {
      if (!suppressWarnings) {
        showCraftMessage('材料或金币不足，无法合成', 'warning')
      } else if (autoMode) {
        showCraftMessage(getAutoStopMessage(quantity), 'warning')
      }
      return false
    }
    const recipe = currentRecipe.value
    const materialCount = Number(recipe.materialCount ?? 0) * quantity
    const candyCount = Number(recipe.candyCount ?? 0) * quantity
    const removedMaterial = itemsStore.removeItemFromBag(recipe.materialId, materialCount)
    if (!removedMaterial) {
      if (!suppressWarnings) {
        showCraftMessage('材料不足，无法合成', 'error')
      } else if (autoMode) {
        showCraftMessage(getAutoStopMessage(quantity), 'warning')
      }
      return false
    }
    if (recipe.candyId) {
      const removedCandy = itemsStore.removeItemFromBag(recipe.candyId, candyCount)
      if (!removedCandy) {
        itemsStore.addItemToBag(recipe.materialId, materialCount)
        if (!suppressWarnings) {
          showCraftMessage('糖果不足，无法合成', 'error')
        } else if (autoMode) {
          showCraftMessage(getAutoStopMessage(quantity), 'warning')
        }
        return false
      }
    }
    const added = itemsStore.addItemToBag(recipe.outputId, quantity)
    if (!added) {
      itemsStore.addItemToBag(recipe.materialId, materialCount)
      if (recipe.candyId) {
        itemsStore.addItemToBag(recipe.candyId, candyCount)
      }
      if (!suppressWarnings) {
        showCraftMessage('背包空间不足，无法合成', 'error')
      }
      return false
    }
    const nextGold = Math.max(0, currentGold.value - Number(recipe.gold ?? 0) * quantity)
    itemsStore.playerGold = nextGold
    if (gameStore.player) {
      gameStore.player.gold = nextGold
      gameStore.player.bag = [...itemsStore.playerBag]
    }
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerData(gameStore.player)
    const goldUpdateEvent = new CustomEvent('gold-update', { detail: { gold: nextGold } })
    window.dispatchEvent(goldUpdateEvent)
    const updateBagEvent = new CustomEvent('update-bag-ui')
    window.dispatchEvent(updateBagEvent)
    const outputName = resolveItemName(recipe.outputId)
    showCraftMessage(`${resolvePlayerName()} 制作 ${outputName} X ${quantity}`, 'success')
    const battleLogAnimationEvent = new CustomEvent('battle-log-animation', {
      detail: {
        text: `制作 ${outputName} x${quantity}`,
        type: 'buy',
        icon: `/pt/item_icon/${recipe.outputId}.png`,
        itemId: recipe.outputId,
        source: 'pet-trainer',
        checkRarity: false
      }
    })
    window.dispatchEvent(battleLogAnimationEvent)
    triggerConsumeAnim({ type: 'material', text: `${resolveItemName(recipe.materialId)}-${materialCount}` })
    if (recipe.candyId) {
      triggerConsumeAnim({ type: 'candy', text: `${resolveItemName(recipe.candyId)} - ${candyCount}` })
    }
    const audioService = props.gameInitializer?.services?.audio
    if (audioService) {
      if (typeof audioService.playUpgradeSuccessSFX === 'function') {
        audioService.playUpgradeSuccessSFX()
      } else if (typeof audioService.playSFX === 'function') {
        audioService.playSFX('InfUpgradeSuccess.wav')
      }
      if (typeof audioService.playItemPickupSFX === 'function') {
        audioService.playItemPickupSFX()
      } else if (typeof audioService.playItemSFX === 'function') {
        audioService.playItemSFX('InfGroundPickup.wav')
      } else if (typeof audioService.playSFX === 'function') {
        audioService.playSFX('InfGroundPickup.wav')
      }
    }
    return true
  } catch (error) {
    console.error('[PetTrainerModal] 合成糖果失败:', error)
    if (!suppressWarnings) {
      showCraftMessage('合成失败，请稍后重试', 'error')
    }
    return false
  } finally {
    isCrafting.value = false
  }
}

const resetCandy = () => {
  selectedMaterialId.value = null
  selectedCandyId.value = null
  activePicker.value = null
  craftProgress.value = 0
  isCrafting.value = false
  isAutoCraft.value = false
}

const handleEvolve = async (options = {}) => {
  const { skipClickSound = false, suppressWarnings = false, autoMode = false } = options
  if (isEvolving.value) {
    return false
  }
  if (!skipClickSound) {
    playClickSound()
  }
  if (!selectedEvolvePetId.value || !selectedEvolveCandyId.value) {
    if (!suppressWarnings) {
      showCraftMessage('请选择进化宠物与匹配糖果', 'warning')
    } else if (autoMode) {
      showCraftMessage('进化材料不足，自动进化已停止', 'warning')
    }
    return false
  }
  if (!canEvolve.value) {
    if (!suppressWarnings) {
      showCraftMessage(evolveBlockedMessage.value, 'warning')
    } else if (autoMode) {
      showCraftMessage(evolveBlockedAutoMessage.value, 'warning')
    }
    return false
  }
  isEvolving.value = true
  try {
    const evolvePetId = Number(selectedEvolvePetId.value)
    const evolveCandyIdLocal = Number(selectedEvolveCandyId.value)
    const evolveCandyCount = Math.max(0, Number(evolveCandyRequiredCount.value) || 0)
    const evolvePetLevel = selectedEvolvePetLevel.value
    let outputId = null
    if (evolvePetId === evolveRandomOnlyPetId) {
      const pool = evolveOutputPoolByPetId[evolvePetId] || null
      const candidates = [
        ...(Array.isArray(pool?.normal) ? pool.normal : []),
        ...(Array.isArray(pool?.rare) ? pool.rare : [])
      ]
        .map(id => Number(id))
        .filter(id => Number.isFinite(id))
      const candidateIds = candidates.length
        ? Array.from(new Set(candidates)).filter(id => !evolveExcludedPetIds.includes(id))
        : Object.keys(petsStore.petMap || {})
          .map(key => Number(key))
          .filter(id => Number.isFinite(id) && !evolveExcludedPetIds.includes(id))
      outputId = resolveEvolveOutputId(evolvePetId)
      if (!outputId) {
        showCraftMessage('进化配置缺失，无法进化', 'error')
        return false
      }
      const progressCandidateIds = candidateIds.length ? candidateIds : [outputId]
      if (!progressCandidateIds.includes(outputId)) {
        progressCandidateIds.push(outputId)
      }
      await startEvolveProgress({ candidateIds: progressCandidateIds, finalId: outputId })
    } else {
      outputId = resolveEvolveOutputId(evolvePetId)
      if (!outputId) {
        showCraftMessage('进化配置缺失，无法进化', 'error')
        return false
      }
      await startEvolveProgress({ candidateIds: [outputId], finalId: outputId })
    }

    if (evolvePetLevel >= evolveMaxLevel) {
      if (!suppressWarnings) {
        showCraftMessage(`宠物已达最高阶段（${evolveMaxLevel}），无法进化`, 'warning')
      } else if (autoMode) {
        showCraftMessage(`宠物已达最高阶段（${evolveMaxLevel}），自动进化已停止`, 'warning')
      }
      return false
    }
    const petOwned = bagCountMap.value.get(evolvePetId) || 0
    const candyOwned = bagCountMap.value.get(evolveCandyIdLocal) || 0
    if (petOwned < 1 || candyOwned < evolveCandyCount) {
      if (!suppressWarnings) {
        showCraftMessage('进化材料不足，无法进化', 'warning')
      } else if (autoMode) {
        showCraftMessage('进化材料不足，自动进化已停止', 'warning')
      }
      return false
    }

    const sourcePetItem = selectedEvolvePetItem.value
    const sourceUniqueId = sourcePetItem?.uniqueId ? String(sourcePetItem.uniqueId) : ''
    const sourcePetData =
      sourcePetItem?.pet_data && typeof sourcePetItem.pet_data === 'object' ? sourcePetItem.pet_data : {}
    const removedPet = sourceUniqueId
      ? itemsStore.removeItemFromBag(evolvePetId, 1, { uniqueId: sourceUniqueId })
      : itemsStore.removeItemFromBag(evolvePetId, 1)
    if (!removedPet) {
      if (!suppressWarnings) {
        showCraftMessage('进化宠物不足，无法进化', 'error')
      } else if (autoMode) {
        showCraftMessage('进化宠物不足，自动进化已停止', 'warning')
      }
      return false
    }
    const removedCandy = itemsStore.removeItemFromBag(evolveCandyIdLocal, evolveCandyCount)
    if (!removedCandy) {
      itemsStore.addItemToBag(evolvePetId, 1)
      if (!suppressWarnings) {
        showCraftMessage('糖果不足，无法进化', 'error')
      } else if (autoMode) {
        showCraftMessage('糖果不足，自动进化已停止', 'warning')
      }
      return false
    }
    const existingOutputUniqueIds = new Set(
      itemsStore.playerBag
        .filter(item => item && Number(item.id) === outputId && item.uniqueId !== undefined && item.uniqueId !== null)
        .map(item => String(item.uniqueId))
    )
    const added = itemsStore.addItemToBag(outputId, 1)
    if (!added) {
      itemsStore.addItemToBag(evolvePetId, 1)
      itemsStore.addItemToBag(evolveCandyIdLocal, evolveCandyCount)
      if (!suppressWarnings) {
        showCraftMessage('背包空间不足，无法进化', 'error')
      }
      return false
    }
    const outputConfig = petsStore.petMap?.[String(outputId)] || null
    const sourcePetConfig = petsStore.petMap?.[String(evolvePetId)] || null
    const growthConfig = outputConfig || sourcePetConfig || null
    const nextPetLevel = resolveNextPetLevel(evolvePetLevel)
    const levelType = petLevelTypeMap[nextPetLevel] || 'F'
    const parameterKey = typeof growthConfig?.parameter === 'string' ? growthConfig.parameter : ''
    const outputValues = Array.isArray(growthConfig?.values) ? growthConfig.values : []
    const resolveGradeKey = level => {
      const maxGrade = Math.max(1, Math.floor(Number(petAttributeGradeMaxByLevel?.[level] ?? 1)))
      const candidates = []
      let totalWeight = 0
      for (let grade = 1; grade <= maxGrade; grade += 1) {
        const weight = Number(petAttributeGradeWeightMap?.[grade] ?? 0)
        if (!Number.isFinite(weight) || weight <= 0) {
          continue
        }
        totalWeight += weight
        candidates.push({ grade, weight })
      }
      if (!candidates.length || totalWeight <= 0) {
        return 1
      }
      const roll = Math.random() * totalWeight
      let cursor = 0
      for (const candidate of candidates) {
        cursor += candidate.weight
        if (roll <= cursor) {
          return candidate.grade
        }
      }
      return candidates[candidates.length - 1].grade
    }
    const resolveAttributeValue = (values, gradeKey) => {
      if (!Array.isArray(values) || !values.length) {
        return 0
      }
      const numericKey = Math.max(1, Math.floor(Number(gradeKey ?? 1)))
      const zeroBasedIndex = numericKey - 1
      const preferred = Number(values[zeroBasedIndex])
      if (Number.isFinite(preferred)) {
        return preferred
      }
      const legacy = Number(values[numericKey])
      if (Number.isFinite(legacy)) {
        return legacy
      }
      const fallback = Number(values[0])
      return Number.isFinite(fallback) ? fallback : 0
    }
    const gradeKey = resolveGradeKey(nextPetLevel)
    const resolvedAttributeValue = resolveAttributeValue(outputValues, gradeKey)
    const tierIndex = Math.max(nextPetLevel - 1, 0)
    const resolveTierMaxEnergy = (config, index) => {
      const raw = config?.tiers?.[index]?.maxEnergy ?? config?.tiers?.[index]?.max_energy ?? 0
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
    }
    const maxEnergyFromOutput = resolveTierMaxEnergy(outputConfig, tierIndex)
    const maxEnergyFromSource = maxEnergyFromOutput ? 0 : resolveTierMaxEnergy(sourcePetConfig, tierIndex)
    const fallbackMaxEnergy = Number(petEnergyByLevel?.[nextPetLevel] ?? 0)
    const maxEnergy =
      maxEnergyFromOutput || maxEnergyFromSource || (outputId === 8600 ? 0 : fallbackMaxEnergy)
    const levelRequirement = petLevelRequirementMap[levelType]
    const petDataEntry = parameterKey
      ? {
        pet_level: nextPetLevel,
        level_type: levelType,
        [parameterKey]: { [String(gradeKey)]: resolvedAttributeValue },
        current_energy: 0,
        max_energy: Number.isFinite(maxEnergy) ? maxEnergy : 0
      }
      : {
        pet_level: nextPetLevel,
        level_type: levelType,
        current_energy: 0,
        max_energy: Number.isFinite(maxEnergy) ? maxEnergy : 0
      }
    if (levelRequirement) {
      petDataEntry.level_requirement = levelRequirement
    }
    const candyUnitGoldCost = resolveEvolveCandyTierTotalGoldCost(evolveCandyIdLocal)
    const evolveSellPrice = Math.max(0, Math.floor(((candyUnitGoldCost || 0) * evolveCandyCount) / 2))
    let outputIndex = -1
    let nextSelectedUniqueId = ''
    for (let i = itemsStore.playerBag.length - 1; i >= 0; i -= 1) {
      const bagItem = itemsStore.playerBag[i]
      if (!bagItem || Number(bagItem?.id) !== outputId) {
        continue
      }
      const uid = bagItem.uniqueId !== undefined && bagItem.uniqueId !== null ? String(bagItem.uniqueId) : ''
      if (uid && !existingOutputUniqueIds.has(uid)) {
        outputIndex = i
        break
      }
      if (outputIndex === -1) {
        outputIndex = i
      }
    }
    if (outputIndex >= 0) {
      const bagItem = itemsStore.playerBag[outputIndex]
      const existingPetData =
        bagItem?.pet_data && typeof bagItem.pet_data === 'object' ? bagItem.pet_data : {}
      const nextPetData = {
        ...sourcePetData,
        ...existingPetData,
        [String(nextPetLevel)]: petDataEntry
      }
      const mergedItem = {
        ...bagItem,
        ...(outputConfig || {}),
        Pet_Exterior: bagItem?.Pet_Exterior ?? 0,
        rarity: petRarityByLevel[nextPetLevel] || bagItem?.rarity || 'common',
        pet_level: nextPetLevel,
        pet_data: nextPetData,
        sellPrice: evolveSellPrice
      }
      itemsStore.playerBag.splice(outputIndex, 1, mergedItem)
      if (mergedItem?.uniqueId !== undefined && mergedItem?.uniqueId !== null) {
        nextSelectedUniqueId = String(mergedItem.uniqueId)
      }
    }
    if (outputId) {
      selectedEvolvePetId.value = outputId
      selectedEvolvePetUniqueId.value = nextSelectedUniqueId
      const nextRequirement = resolveEvolveCandyRequirement(outputId, nextPetLevel)
      selectedEvolveCandyId.value = nextRequirement?.candyId ?? null
    }
    if (gameStore.player) {
      gameStore.player.bag = [...itemsStore.playerBag]
    }
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerData(gameStore.player)
    const updateBagEvent = new CustomEvent('update-bag-ui')
    window.dispatchEvent(updateBagEvent)
    const playerName = resolvePlayerName()
    const sourceName = resolveItemName(evolvePetId)
    const sourceType = petLevelTypeMap?.[evolvePetLevel] || ''
    const sourceLevelSuffix = sourceType ? `(${sourceType})` : ''
    const outputName = resolveItemName(outputId)
    const outputType = petLevelTypeMap?.[nextPetLevel] || ''
    const outputLevelSuffix = outputType ? `(${outputType})` : ''
    showCraftMessage(`${playerName} 的 ${sourceName}${sourceLevelSuffix} 进化 ${outputName}${outputLevelSuffix} 成功!`, 'success')
    const battleLogAnimationEvent = new CustomEvent('battle-log-animation', {
      detail: {
        text: `${playerName} 的 ${sourceName}${sourceLevelSuffix} 进化 ${outputName}${outputLevelSuffix} 成功!`,
        type: 'success',
        icon: `/pt/item_icon/${evolvePetId}.png`,
        secondaryIcon: `/pt/item_icon/${outputId}.png`,
        connectorText: `${sourceName}${sourceLevelSuffix} 进化`,
        secondaryText: `${outputName}${outputLevelSuffix} 成功!`,
        prefixText: `${playerName} 的`,
        itemId: outputId,
        source: 'pet-trainer',
        checkRarity: false
      }
    })
    window.dispatchEvent(battleLogAnimationEvent)
    playEvolveActionSound()
    return true
  } catch (error) {
    console.error('[PetTrainerModal] 进化宠物失败:', error)
    if (!suppressWarnings) {
      showCraftMessage('进化失败，请稍后重试', 'error')
    }
    return false
  } finally {
    isEvolving.value = false
  }
}

/**
 * 执行一次献祭洗练
 * 用途/业务意图：扣除献祭宠物，按档位权重洗练主宠物当前等级属性并写入 pet_data
 * @param {{ skipClickSound?: boolean, suppressWarnings?: boolean, autoMode?: boolean }} options - 执行选项
 * @returns {Promise<boolean>} 是否成功
 */
const handleSacrifice = async (options = {}) => {
  const { skipClickSound = false, suppressWarnings = false, autoMode = false } = options
  if (!skipClickSound) {
    playEvolveActionSound()
  }
  if (isSacrificing.value) {
    return false
  }
  isSacrificing.value = true
  try {
    const mainItem = selectedSacrificeMainPetItem.value
    const mainId = Number(selectedSacrificeMainPetId.value)
    const useScroll = sacrificeMaterialMode.value === 'scroll'
    const sacrificeItem = useScroll ? null : selectedSacrificePetItem.value
    const sacrificeId = useScroll ? NaN : Number(selectedSacrificePetId.value)
    if (!mainItem || !Number.isFinite(mainId)) {
      if (!suppressWarnings) {
        showCraftMessage('请选择主宠物', 'warning')
      } else if (autoMode) {
        showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
      }
      return false
    }
    if (useScroll && sacrificeScrollOwned.value <= 0) {
      if (!suppressWarnings) {
        showCraftMessage('高级宠物重铸卷轴不足，无法献祭', 'warning')
      } else if (autoMode) {
        showCraftMessage('高级宠物重铸卷轴不足，自动献祭已停止', 'warning')
      }
      return false
    }
    if (!useScroll && (!sacrificeItem || !Number.isFinite(sacrificeId))) {
      if (!suppressWarnings) {
        showCraftMessage('请选择献祭宠物或高级宠物重铸卷轴', 'warning')
      } else if (autoMode) {
        showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
      }
      return false
    }
    if (!useScroll) {
      const mainRank = resolveLevelTypeRank(sacrificeTargetLevelType.value)
      const sacrificeRank = resolveLevelTypeRank(selectedSacrificePetLevelType.value)
      if (sacrificeRank < mainRank) {
        if (!suppressWarnings) {
          showCraftMessage('献祭宠物等级不足，无法献祭', 'warning')
        } else if (autoMode) {
          showCraftMessage('献祭宠物等级不足，自动献祭已停止', 'warning')
        }
        return false
      }
    }

    const removeOptions = {}
    if (!useScroll && selectedSacrificePetUniqueId.value) {
      removeOptions.uniqueId = String(selectedSacrificePetUniqueId.value)
    }
    const removed = useScroll
      ? itemsStore.removeItemFromBag(sacrificeScrollItemId, 1)
      : selectedSacrificePetUniqueId.value
        ? itemsStore.removeItemFromBag(sacrificeId, 1, removeOptions)
        : itemsStore.removeItemFromBag(sacrificeId, 1)
    if (!removed) {
      if (!suppressWarnings) {
        showCraftMessage(useScroll ? '高级宠物重铸卷轴不足，无法献祭' : '献祭宠物不足，无法献祭', 'error')
      } else if (autoMode) {
        showCraftMessage(useScroll ? '高级宠物重铸卷轴不足，自动献祭已停止' : '献祭宠物不足，自动献祭已停止', 'warning')
      }
      return false
    }

    if (autoMode) {
      playEvolveActionSound()
    }

    await startSacrificeProgress()

    const mainUid = selectedSacrificeMainPetUniqueId.value ? String(selectedSacrificeMainPetUniqueId.value) : ''
    const mainIndex = itemsStore.playerBag.findIndex(entry => {
      if (!entry || Number(entry?.id) !== mainId) {
        return false
      }
      if (!mainUid) {
        return true
      }
      return entry?.uniqueId !== undefined && entry?.uniqueId !== null && String(entry.uniqueId) === mainUid
    })
    if (mainIndex < 0) {
      itemsStore.addItemToBag(useScroll ? sacrificeScrollItemId : sacrificeId, 1)
      if (!suppressWarnings) {
        showCraftMessage('主宠物不存在，无法献祭', 'error')
      }
      return false
    }
    const currentMainItem = itemsStore.playerBag[mainIndex]
    const level = sacrificeTargetLevel.value
    const levelType = sacrificeTargetLevelType.value
    const cap = Number(selectedSacrificeGradeCap.value ?? 1)
    const capSafe = Number.isFinite(cap) ? Math.max(1, Math.floor(cap)) : 1
    const maxGrade = Math.min(Math.max(1, capSafe), sacrificeGradeMax.value)
    const growthConfig = petsStore.petMap?.[String(mainId)] || null
    const parameterKey = typeof growthConfig?.parameter === 'string' ? growthConfig.parameter : ''
    const outputValues = Array.isArray(growthConfig?.values) ? growthConfig.values : []
    const gradeKey = resolveWeightedGradeKey(maxGrade)
    const resolvedAttributeValue = resolveAttributeValue(outputValues, gradeKey)
    if (autoMode && gradeKey === maxGrade) {
      const audioService = props.gameInitializer?.services?.audio
      if (audioService && typeof audioService.playMusicSFX === 'function') {
        audioService.playMusicSFX('曼波.mp3')
      } else {
        try {
          const audio = new Audio('/music/曼波.mp3')
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('[PetTrainerModal] 播放曼波音乐失败:', error)
            })
          }
        } catch (error) {
          console.error('[PetTrainerModal] 初始化曼波音乐失败:', error)
        }
      }
    }
    const tierIndex = Math.max(level - 1, 0)
    const existingPetData =
      currentMainItem?.pet_data && typeof currentMainItem.pet_data === 'object' ? currentMainItem.pet_data : {}
    const currentLevelKey = String(level)
    const existingEntry =
      existingPetData?.[currentLevelKey] && typeof existingPetData[currentLevelKey] === 'object'
        ? existingPetData[currentLevelKey]
        : {}
    const previousParamEntry =
      parameterKey && existingEntry?.[parameterKey] && typeof existingEntry[parameterKey] === 'object'
        ? existingEntry[parameterKey]
        : null
    const previousGradeKeyRaw = previousParamEntry ? Object.keys(previousParamEntry)[0] : ''
    const previousGradeKeyValue = previousGradeKeyRaw ? Number(previousGradeKeyRaw) : NaN
    const previousGradeKey = Number.isFinite(previousGradeKeyValue) && previousGradeKeyValue > 0 ? previousGradeKeyValue : 0
    const rerollCountRaw = Number(existingEntry?.petAttributeRerollCount ?? 0)
    const rerollCountBase = Number.isFinite(rerollCountRaw) ? Math.max(0, Math.floor(rerollCountRaw)) : 0
    const maxEnergy =
      Number(existingEntry?.max_energy) ||
      resolveTierMaxEnergy(growthConfig, tierIndex) ||
      Number(petEnergyByLevel?.[level] ?? 0)
    const nextEntryBase = {
      ...existingEntry,
      pet_level: level,
      petAttributeRerollCount: rerollCountBase + 1,
      level_type: existingEntry?.level_type || levelType,
      current_energy: Number(existingEntry?.current_energy ?? 0) || 0,
      max_energy: Number.isFinite(maxEnergy) ? Math.max(0, Math.floor(maxEnergy)) : 0
    }
    const levelRequirement = petLevelRequirementMap[nextEntryBase.level_type]
    if (levelRequirement) {
      nextEntryBase.level_requirement = levelRequirement
    }
    const nextEntry = parameterKey
      ? {
        ...nextEntryBase,
        [parameterKey]: { [String(gradeKey)]: resolvedAttributeValue }
      }
      : { ...nextEntryBase }
    const nextPetData = {
      ...existingPetData,
      [currentLevelKey]: nextEntry
    }
    const mainPetLevelRaw = Number(currentMainItem?.pet_level ?? currentMainItem?.petLevel ?? 0)
    const mainPetLevel = Number.isFinite(mainPetLevelRaw) ? Math.max(1, Math.floor(mainPetLevelRaw)) : null
    const mergedMain = {
      ...currentMainItem,
      pet_level: mainPetLevel ?? level,
      pet_data: nextPetData
    }
    itemsStore.playerBag.splice(mainIndex, 1, mergedMain)
    if (gameStore.player) {
      gameStore.player.bag = [...itemsStore.playerBag]
    }
    // storageService 已通过 import 导入全局单例
    storageService.savePlayerData(gameStore.player)
    const updateBagEvent = new CustomEvent('update-bag-ui')
    window.dispatchEvent(updateBagEvent)
    const mainName = resolveItemName(mainId)
    const logText = `${resolvePlayerName()} 洗练 ${mainName}(${levelType}) Lv${level}属性从${previousGradeKey}→${gradeKey}`
    showCraftMessage(logText, 'success')
    const battleLogAnimationEvent = new CustomEvent('battle-log-animation', {
      detail: {
        text: logText,
        type: 'success',
        icon: `/pt/item_icon/${mainId}.png`,
        itemId: mainId,
        source: 'pet-trainer',
        checkRarity: false
      }
    })
    window.dispatchEvent(battleLogAnimationEvent)
    return true
  } catch (error) {
    console.error('[PetTrainerModal] 献祭失败:', error)
    if (!suppressWarnings) {
      showCraftMessage('献祭失败，请稍后重试', 'error')
    }
    return false
  } finally {
    isSacrificing.value = false
  }
}

/**
 * 重置献祭面板状态
 * 用途/业务意图：清空主宠物/献祭宠物选择与进度，并停止自动献祭
 * @returns {void}
 */
const resetSacrifice = () => {
  selectedSacrificeMainPetId.value = null
  selectedSacrificeMainPetUniqueId.value = ''
  selectedSacrificePetId.value = null
  selectedSacrificePetUniqueId.value = ''
  selectedSacrificeScrollId.value = null
  selectedSacrificeTargetLevel.value = null
  selectedSacrificeGradeCap.value = 1
  sacrificeGradeCapManuallySet.value = false
  activePicker.value = null
  sacrificeProgress.value = 0
  isSacrificing.value = false
  isAutoSacrifice.value = false
}

const resetEvolve = () => {
  selectedEvolvePetId.value = null
  selectedEvolvePetUniqueId.value = ''
  selectedEvolveCandyId.value = null
  selectedEvolveTargetLevel.value = 0
  activePicker.value = null
  evolveProgress.value = 0
  evolveRollingCandidateIds.value = []
  evolveRollingCurrentId.value = null
  evolveRollingFinalId.value = null
  evolveWheelRotationDeg.value = 0
  evolveWheelFinalRotationDeg.value = 0
  isEvolving.value = false
  isAutoEvolve.value = false
}

const toggleRecipePanel = () => {
  playClickSound()
  showRecipePanel.value = !showRecipePanel.value
  nextTick(() => {
    refreshRecipePanelPosition()
  })
}

/**
 * 自动献祭循环
 * 用途/业务意图：在开启自动献祭时循环执行献祭，材料不足或条件不满足时自动停止并提示
 * @returns {Promise<void>}
 */
const runAutoSacrifice = async () => {
  if (isAutoSacrificing.value) {
    return
  }
  isAutoSacrificing.value = true
  try {
    while (isAutoSacrifice.value) {
      const current = Number(currentSacrificeTierGrade.value ?? 0)
      const target = Number(autoSacrificeTargetGrade.value ?? 1)
      if (Number.isFinite(current) && Number.isFinite(target) && current >= target) {
        isAutoSacrifice.value = false
        if (!sacrificeAutoStopNotified.value) {
          sacrificeAutoStopNotified.value = true
          showCraftMessage(sacrificeBlockedAutoMessage.value, 'info')
        }
        break
      }

      if (!canSacrifice.value) {
        if (sacrificeMaterialMode.value === 'scroll') {
          isAutoSacrifice.value = false
          if (!sacrificeAutoStopNotified.value) {
            sacrificeAutoStopNotified.value = true
            showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
          }
          break
        }
        autoSelectQualifiedSacrificePet()
      }

      if (!canSacrifice.value) {
        isAutoSacrifice.value = false
        if (!sacrificeAutoStopNotified.value) {
          sacrificeAutoStopNotified.value = true
          showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
        }
        break
      }
      if (isSacrificing.value) {
        await sleep(120)
        continue
      }
      const success = await handleSacrifice({ skipClickSound: true, suppressWarnings: true, autoMode: true })
      if (!success) {
        isAutoSacrifice.value = false
        if (!sacrificeAutoStopNotified.value) {
          sacrificeAutoStopNotified.value = true
          showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
        }
        break
      }
      await sleep(120)
    }
  } finally {
    isAutoSacrificing.value = false
  }
}

/**
 * 切换自动献祭
 * 用途/业务意图：启动/停止自动献祭，并给出用户友好提示
 * @returns {void}
 */
const toggleAutoSacrifice = () => {
  playEvolveActionSound()
  if (isAutoSacrifice.value) {
    isAutoSacrifice.value = false
    showCraftMessage('已停止自动献祭', 'info')
    return
  }
  if (!canAutoSacrifice.value) {
    showCraftMessage(sacrificeBlockedAutoMessage.value, 'warning')
    return
  }
  // 显示二次确认弹窗
  showAutoSacrificeConfirm.value = true
}

/**
 * 确认自动献祭
 * 用途/业务意图：用户确认后开始自动献祭
 * @returns {void}
 */
const confirmAutoSacrifice = () => {
  showAutoSacrificeConfirm.value = false
  isAutoSacrifice.value = true
  sacrificeAutoStopNotified.value = false
  runAutoSacrifice()
}

/**
 * 取消自动献祭确认
 * 用途/业务意图：用户取消自动献祭
 * @returns {void}
 */
const cancelAutoSacrifice = () => {
  showAutoSacrificeConfirm.value = false
}

/**
 * 自动献祭确认信息
 * 用途/业务意图：构建确认弹窗中显示的消耗信息
 */
const autoSacrificeConfirmInfo = computed(() => {
  const info = {
    hasScroll: sacrificeScrollOwned.value > 0,
    scrollCount: sacrificeScrollOwned.value,
    scrollName: '高级宠物重铸卷轴',
    mainPetName: selectedSacrificeMainPetLabel.value,
    mainPetLevel: sacrificeTargetLevel.value,
    qualifiedPetCount: 0,
    willUseScroll: false
  }

  // 如果有卷轴，优先使用卷轴
  if (info.hasScroll) {
    info.willUseScroll = true
    return info
  }

  // 计算符合条件的献祭宠物数量
  const mainPetLevel = sacrificeTargetLevel.value
  const candidates = Array.isArray(sacrificePetOptions.value) ? sacrificePetOptions.value : []
  info.qualifiedPetCount = candidates.filter(option => {
    const tooltipItem = option?.tooltipItem
    const petLevel = Number(tooltipItem?.pet_level ?? tooltipItem?.petLevel ?? 0)
    return Number.isFinite(petLevel) && petLevel >= mainPetLevel
  }).length

  return info
})

const runAutoEvolve = async () => {
  if (isAutoEvolving.value) {
    return
  }
  isAutoEvolving.value = true
  try {
    const lockedPetId = Number(selectedEvolvePetId.value)
    const rawTargetLevel = Number(selectedEvolveTargetLevel.value)
    const lockedTargetLevel =
      lockedPetId !== 8600 && Number.isFinite(rawTargetLevel) && rawTargetLevel >= 2 && rawTargetLevel <= evolveMaxLevel
        ? rawTargetLevel
        : 0

    while (isAutoEvolve.value) {
      if (lockedPetId === 8600) {
        const eggItem = itemsStore.playerBag.find(item => Number(item?.id) === 8600) || null
        if (!eggItem) {
          isAutoEvolve.value = false
          showCraftMessage('背包中已无宠物蛋（ID:8600），自动进化已停止', 'info')
          break
        }
        const uid =
          eggItem?.uniqueId !== undefined && eggItem?.uniqueId !== null ? String(eggItem.uniqueId) : ''
        const eggLevelRaw = Number(eggItem?.pet_level ?? eggItem?.petLevel ?? 1)
        const eggLevel = Number.isFinite(eggLevelRaw) ? Math.max(1, Math.min(evolveMaxLevel, eggLevelRaw)) : 1
        const requirement = resolveEvolveCandyRequirement(8600, eggLevel)
        if (!requirement?.candyId) {
          isAutoEvolve.value = false
          showCraftMessage('进化配置缺失，自动进化已停止', 'warning')
          break
        }
        const candyOwned = bagCountMap.value.get(requirement.candyId) || 0
        if (candyOwned < Number(requirement.count ?? 0)) {
          isAutoEvolve.value = false
          if (!evolveAutoStopNotified.value) {
            evolveAutoStopNotified.value = true
            showCraftMessage('进化材料不足，自动进化已停止', 'warning')
          }
          break
        }

        selectedEvolvePetId.value = 8600
        selectedEvolvePetUniqueId.value = uid
        selectedEvolveCandyId.value = requirement.candyId

        if (isEvolving.value) {
          await sleep(120)
          continue
        }

        const success = await handleEvolve({ skipClickSound: true, suppressWarnings: true, autoMode: true })
        if (!success) {
          isAutoEvolve.value = false
          if (!evolveAutoStopNotified.value) {
            evolveAutoStopNotified.value = true
            showCraftMessage('进化材料不足，自动进化已停止', 'warning')
          }
          break
        }

        selectedEvolvePetId.value = 8600
        selectedEvolvePetUniqueId.value = ''
        selectedEvolveCandyId.value = requirement.candyId
        await sleep(120)
        continue
      }

      if (lockedTargetLevel) {
        if (Number(selectedEvolvePetId.value) !== lockedPetId) {
          selectedEvolvePetId.value = lockedPetId
        }

        if (!selectedEvolvePetUniqueId.value) {
          const fallback = itemsStore.playerBag.find(item => Number(item?.id) === lockedPetId) || null
          if (!fallback) {
            isAutoEvolve.value = false
            showCraftMessage('背包中已无该宠物，自动进化已停止', 'info')
            break
          }
          const uid =
            fallback?.uniqueId !== undefined && fallback?.uniqueId !== null ? String(fallback.uniqueId) : ''
          if (uid) {
            selectedEvolvePetUniqueId.value = uid
          }
        }

        const currentCandidate = selectedEvolvePetItem.value
        if (!currentCandidate || Number(currentCandidate?.id) !== lockedPetId) {
          isAutoEvolve.value = false
          showCraftMessage('背包中已无该宠物，自动进化已停止', 'info')
          break
        }

        const uid =
          currentCandidate?.uniqueId !== undefined && currentCandidate?.uniqueId !== null ? String(currentCandidate.uniqueId) : ''
        if (uid && uid !== String(selectedEvolvePetUniqueId.value || '')) {
          selectedEvolvePetUniqueId.value = uid
        }
        const levelRaw = Number(currentCandidate?.pet_level ?? currentCandidate?.petLevel ?? 0)
        const level = Number.isFinite(levelRaw) ? Math.max(1, Math.min(evolveMaxLevel, levelRaw)) : 1
        if (level >= lockedTargetLevel || level >= evolveMaxLevel) {
          isAutoEvolve.value = false
          showCraftMessage('已完成目标等级进化，自动进化已停止', 'info')
          break
        }
        const requirement = resolveEvolveCandyRequirement(lockedPetId, level)
        if (!requirement?.candyId) {
          isAutoEvolve.value = false
          showCraftMessage('进化配置缺失，自动进化已停止', 'warning')
          break
        }
        const candyOwned = bagCountMap.value.get(requirement.candyId) || 0
        if (candyOwned < Number(requirement.count ?? 0)) {
          isAutoEvolve.value = false
          if (!evolveAutoStopNotified.value) {
            evolveAutoStopNotified.value = true
            showCraftMessage('进化材料不足，自动进化已停止', 'warning')
          }
          break
        }

        selectedEvolvePetId.value = lockedPetId
        selectedEvolveCandyId.value = requirement.candyId

        if (!canEvolve.value) {
          isAutoEvolve.value = false
          if (!evolveAutoStopNotified.value) {
            evolveAutoStopNotified.value = true
            showCraftMessage('进化材料不足，自动进化已停止', 'warning')
          }
          break
        }
        if (isEvolving.value) {
          await sleep(120)
          continue
        }
        const success = await handleEvolve({ skipClickSound: true, suppressWarnings: true, autoMode: true })
        if (!success) {
          isAutoEvolve.value = false
          if (!evolveAutoStopNotified.value) {
            evolveAutoStopNotified.value = true
            showCraftMessage('进化材料不足，自动进化已停止', 'warning')
          }
          break
        }
        await sleep(120)
        continue
      }

      if (!canEvolve.value) {
        isAutoEvolve.value = false
        if (!evolveAutoStopNotified.value) {
          evolveAutoStopNotified.value = true
          showCraftMessage(evolveBlockedAutoMessage.value, 'warning')
        }
        break
      }
      if (isEvolving.value) {
        await sleep(120)
        continue
      }
      const success = await handleEvolve({ skipClickSound: true, suppressWarnings: true, autoMode: true })
      if (!success) {
        isAutoEvolve.value = false
        if (!evolveAutoStopNotified.value) {
          evolveAutoStopNotified.value = true
          showCraftMessage(evolveBlockedAutoMessage.value, 'warning')
        }
        break
      }
      await sleep(120)
    }
  } finally {
    isAutoEvolving.value = false
  }
}

const toggleAutoEvolve = () => {
  playEvolveActionSound()
  if (isAutoEvolve.value) {
    isAutoEvolve.value = false
    showCraftMessage('已停止自动进化', 'info')
    return
  }
  if (!canAutoEvolve.value) {
    showCraftMessage(evolveBlockedAutoMessage.value, 'warning')
    return
  }
  isAutoEvolve.value = true
  evolveAutoStopNotified.value = false
  runAutoEvolve()
}

watch(
  () => props.isVisible,
  isVisible => {
    if (!isVisible) {
      craftProgress.value = 0
      isCrafting.value = false
      isAutoCraft.value = false
      evolveProgress.value = 0
      evolveRollingCandidateIds.value = []
      evolveRollingCurrentId.value = null
      evolveRollingFinalId.value = null
      evolveWheelRotationDeg.value = 0
      evolveWheelFinalRotationDeg.value = 0
      isEvolving.value = false
      isAutoEvolve.value = false
      selectedEvolveTargetLevel.value = 0
      sacrificeProgress.value = 0
      isSacrificing.value = false
      isAutoSacrifice.value = false
      return
    }
    refreshDialog()
    showRecipePanel.value = false
    activePicker.value = null
    hideItemTooltip()
  },
  { immediate: true }
)

watch(
  () => canAutoCraft.value,
  value => {
    if (!value) {
      const wasAutoCrafting = isAutoCraft.value
      isAutoCraft.value = false
      if (wasAutoCrafting && currentRecipe.value) {
        if (!autoStopNotified.value) {
          autoStopNotified.value = true
          showCraftMessage(getAutoStopMessage(), 'warning')
        }
        const recipe = currentRecipe.value
        const materialCount = Number(recipe.materialCount ?? 0)
        const candyCount = Number(recipe.candyCount ?? 0)
        const materialOwned = bagCountMap.value.get(recipe.materialId) || 0
        const candyOwned = recipe.candyId ? bagCountMap.value.get(recipe.candyId) || 0 : 0
        const materialEnough = materialOwned >= materialCount
        const candyEnough = recipe.candyId ? candyOwned >= candyCount : true
        if (!materialEnough || !candyEnough) {
          selectedMaterialId.value = null
          selectedCandyId.value = null
        }
      }
    }
  }
)

watch(
  () => canAutoEvolve.value,
  value => {
    if (!value) {
      const wasAutoEvolve = isAutoEvolve.value
      isAutoEvolve.value = false
      if (wasAutoEvolve && selectedEvolvePetId.value) {
        if (!evolveAutoStopNotified.value) {
          evolveAutoStopNotified.value = true
          showCraftMessage(evolveBlockedAutoMessage.value, 'warning')
        }
        const petOwned = bagCountMap.value.get(selectedEvolvePetId.value) || 0
        const candyOwned = selectedEvolveCandyId.value
          ? bagCountMap.value.get(selectedEvolveCandyId.value) || 0
          : 0
        if (petOwned < 1 || candyOwned < evolveCandyRequiredCount.value) {
          selectedEvolvePetId.value = null
          selectedEvolvePetUniqueId.value = ''
          selectedEvolveCandyId.value = null
        }
      }
    }
  }
)

const close = () => {
  playClickSound()
  emit('close')
}
</script>

<style scoped>
/* 容器 */
.pet-trainer-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 550px;
  height: 370px;
  min-width: 550px;
  min-height: 370px;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  z-index: 1200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  overflow: hidden;
  resize: both;
}

.pet-trainer-panel__inner {
  display: flex;
  flex-direction: column;
  transform-origin: top left;
  min-height: 0;
  width: 100%;
  height: 100%;
}

/* 过渡动画 */
.pet-trainer-fade-enter-active,
.pet-trainer-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.pet-trainer-fade-enter-from,
.pet-trainer-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

.pet-trainer-fade-enter-to,
.pet-trainer-fade-leave-from {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

/* 头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
  user-select: none;
}

.npc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.npc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #6a6a8a;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.help-button {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #4a6a9a 0%, #3a5a8a 100%);
  border: 2px solid #6a8aba;
  border-radius: 50%;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-button:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.close-button {
  width: 32px;
  height: 32px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: #ff4444;
}

/* 主体 */
.panel-middle {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 0;
  overflow: hidden;
}

/* 左侧菜单 */
.panel-menu {
  width: 160px;
  min-width: 120px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-right: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 6px;
  flex-shrink: 0;
}

.menu-button {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: linear-gradient(90deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  color: #ccc;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-button:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #3a3a5a 100%);
  border-color: #6a6a8a;
}

.menu-button.active {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
  font-weight: bold;
}

/* 右侧内容 */
.panel-right {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 8px;
  overflow-y: auto;
  overflow-x: hidden;
}

.dialog-area {
  padding: 10px;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  color: #aaa;
}

.panel-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-title {
  font-size: 15px;
  color: #ffd700;
  margin-bottom: 6px;
}

.content-placeholder {
  font-size: 13px;
  color: #aaa;
}

.feature-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 糖果面板 */
.candy-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-width: 0;
}

.candy-top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.selector-required {
  grid-column: 1 / -1;
  grid-row: 2;
  text-align: center;
  font-size: 11px;
  color: #aaa;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.selector-wrapper {
  position: static;
}

.selector-button {
  width: 100%;
  border: 1px solid #4a4a6a;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  border-radius: 8px;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s;
}

.panel-right .selector-button.rarity-common,
.panel-right .selector-button.rarity-common:hover {
  border-color: #888;
}

.panel-right .selector-button.rarity-uncommon,
.panel-right .selector-button.rarity-uncommon:hover {
  border-color: #0070dd;
}

.panel-right .selector-button.rarity-rare,
.panel-right .selector-button.rarity-rare:hover {
  border-color: #ffd700;
}

.panel-right .selector-button.rarity-veryrare,
.panel-right .selector-button.rarity-veryrare:hover,
.panel-right .selector-button.rarity-unique,
.panel-right .selector-button.rarity-unique:hover {
  border-color: rgb(255, 0, 13);
}

.panel-right .selector-button.rarity-ultimate,
.panel-right .selector-button.rarity-ultimate:hover {
  border-color: #a335ee;
}

.panel-right .selector-button.rarity-mythic,
.panel-right .selector-button.rarity-mythic:hover {
  border-color: #ff4500;
}

.selector-output {
  cursor: default;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.selector-output .selector-preview,
.selector-output .selector-icon {
  pointer-events: auto;
}

.marquee-border {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.marquee-rect {
  fill: none;
  stroke: url(#marquee-gradient);
  stroke-width: 2;
  stroke-dasharray: 10 6;
  animation: marquee-dash 1.8s linear infinite;
}

.selector-output .selector-label,
.selector-output .selector-preview,
.selector-output .selector-value {
  position: relative;
  z-index: 1;
}

.panel-right .selector-button:hover {
  border-color: #6a6a8a;
  background: rgba(255, 215, 0, 0.1);
}

.panel-right .selector-output:hover {
  border-color: #6a6a8a;
  background: rgba(255, 215, 0, 0.1);
}

/* 过渡动画 */
.recipe-panel-fade-enter-active,
.recipe-panel-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.recipe-panel-fade-enter-from,
.recipe-panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.recipe-panel-fade-enter-to,
.recipe-panel-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@keyframes marquee-dash {
  0% {
    stroke-dashoffset: 0;
  }

  100% {
    stroke-dashoffset: -32;
  }
}

@keyframes result-icon-shine {
  0% {
    top: -120%;
    left: -120%;
  }
  30% {
    top: 120%;
    left: 120%;
  }
  100% {
    top: 120%;
    left: 120%;
  }
}

.selector-label {
  font-size: 12px;
  color: #ffd700;
}

.selector-value {
  font-size: 10px;
  color: #ccc;
}

.selector-value--with-float {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.selector-value-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.consume-float {
  position: absolute;
  left: calc(100% - 44px);
  bottom: 30px;
  font-size: 12px;
  color: #ffd700;
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 0 6px rgba(0, 0, 0, 0.85);
  animation: consume-float-up 3s ease-out forwards;
}

.consume-float--material {
  left: calc(100% - 14px);
}

.consume-float--candy {
  left: calc(100% - 74px);
}

@keyframes consume-float-up {
  0% {
    transform: translateY(12px);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translateY(-22px);
    opacity: 0;
  }
}

.selector-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selector-preview--output {
  position: relative;
  border-radius: 6px;
  padding: 4px;
}

.selector-preview--output .result-icon-wrapper,
.selector-preview--output .selector-value {
  position: relative;
  z-index: 1;
}

.result-icon-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.result-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffd700;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid rgba(255, 215, 0, 0.45);
  pointer-events: none;
}

.result-icon-wrapper--active::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -120%;
  width: 220%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: rotate(35deg);
  will-change: transform, top, left;
  pointer-events: none;
  animation: result-icon-shine 3s linear infinite;
}

.result-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.selector-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 1px solid rgba(255, 215, 0, 0.25);
  background: rgba(0, 0, 0, 0.2);
}

.selector-icon-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.selector-icon-wrapper--small img {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.selector-icon-wrapper--small {
  width: 28px;
  height: 28px;
}

.pet-tier-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 1px 4px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(0, 255, 0, 0.75);
  color: #00ff00;
  font-size: 10px;
  line-height: 1.1;
  white-space: nowrap;
  pointer-events: none;
}

.selector-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 1px 4px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 215, 0, 0.55);
  color: #ffd700;
  font-size: 10px;
  line-height: 1.1;
  white-space: nowrap;
  pointer-events: none;
}

/* 选择器面板 */
.selector-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 60;
}

.selector-panel {
  position: relative;
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1a 100%);
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  padding: 8px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #ffd700 rgba(0, 0, 0, 0.95);
  pointer-events: auto;
  z-index: 30;
}

.selector-panel::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.selector-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 999px;
}

.selector-panel::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.6);
}

.selector-panel::-webkit-scrollbar-thumb:hover {
  background: #ffdd44;
}

.panel-right .selector-panel:hover {
  border-color: #6a6a8a;
}

.selector-panel-title {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 6px;
  text-align: center;
}

.selector-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ffd700 rgba(0, 0, 0, 0.95);
  flex: 1;
  min-height: 0;
}

.selector-panel--evolve-pet .selector-items {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
}

.selector-items::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.selector-items::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 999px;
}

.selector-items::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.6);
}

.selector-items::-webkit-scrollbar-thumb:hover {
  background: #ffdd44;
}

.selector-item {
  display: flex;
  gap: 5px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #4a4a6a;
  border-radius: 6px;
  padding: 5px;
  color: #fff;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.2s;
}

.selector-item.rarity-common {
  box-shadow: 0 0 0 1px #c0c0c0 inset;
}

.selector-item.rarity-uncommon {
  box-shadow: 0 0 0 1px #0070dd inset;
}

.selector-item.rarity-rare {
  box-shadow: 0 0 0 1px #ffd700 inset;
}

.selector-item.rarity-veryrare,
.selector-item.rarity-unique {
  box-shadow: 0 0 0 1px rgb(255, 0, 13) inset;
}

.selector-item.rarity-ultimate {
  box-shadow: 0 0 0 1px #a335ee inset;
}

.selector-item.rarity-mythic {
  box-shadow: 0 0 0 1px #ff4500 inset;
}

.panel-right .selector-item:hover {
  background: rgba(255, 215, 0, 0.12);
}

.selector-item img {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 12px;
}

.item-count {
  font-size: 11px;
  color: var(--theme-muted, #cfcfcf);
}

.selector-empty {
  font-size: 12px;
  color: var(--theme-muted, #cfcfcf);
  text-align: center;
  padding: 8px 0;
}

.candy-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.craft-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.evolve-roll-panel {
  border: 1px solid rgba(255, 215, 0, 0.18);
  border-radius: 8px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.12);
}

.evolve-roll-title {
  font-size: 12px;
  color: var(--theme-accent);
  margin-bottom: 6px;
}

.evolve-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 0 4px;
}

.evolve-result-icon {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 10px;
  overflow: hidden;
}

.evolve-result-icon::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -120%;
  width: 220%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: rotate(35deg);
  will-change: transform, top, left;
  pointer-events: none;
  z-index: 3;
  animation: result-icon-shine 3s linear infinite;
}

.evolve-result-marquee {
  position: absolute;
  inset: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
  z-index: 4;
  display: block;
}

.evolve-result-marquee-rect {
  fill: none;
  stroke: url(#evolve-result-marquee-gradient);
  stroke-width: 2;
  stroke-dasharray: 10 6;
  animation: marquee-dash 1.8s linear infinite;
}

.evolve-result-image {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
  position: relative;
  z-index: 1;
  border: none;
  box-shadow: none;
  background: transparent;
}

.evolve-result-icon .selector-icon {
  display: block;
}

.evolve-result-name {
  font-size: 12px;
  color: var(--theme-text);
  text-align: center;
}

.evolve-result-name.rarity-common {
  color: #c0c0c0;
}

.evolve-result-name.rarity-uncommon {
  color: #0070dd;
}

.evolve-result-name.rarity-rare {
  color: #ffd700;
}

.evolve-result-name.rarity-veryrare,
.evolve-result-name.rarity-unique {
  color: rgb(255, 0, 13);
}

.evolve-result-name.rarity-ultimate {
  color: #a335ee;
}

.evolve-result-name.rarity-mythic {
  color: #ff4500;
}

.evolve-result-level {
  margin-left: 4px;
  color: #00ff00;
}

.evolve-wheel-stage {
  position: relative;
  width: clamp(180px, 28vw, 240px);
  max-width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
  margin: 0 auto;
}

.evolve-wheel-pointer {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid rgba(255, 215, 0, 0.9);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
  z-index: 2;
}

.evolve-wheel {
  position: absolute;
  inset: var(--evolve-wheel-inset, 12px);
  border-radius: 50%;
  border: 1px solid rgba(255, 215, 0, 0.28);
  background:
    radial-gradient(circle at center, rgba(255, 215, 0, 0.08), rgba(0, 0, 0, 0.18) 55%),
    rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  will-change: transform;
  transition: transform 0.03s linear;
}

.evolve-wheel-marquee {
  position: absolute;
  inset: 1px;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
  pointer-events: none;
  z-index: 1;
}

.evolve-wheel-marquee-circle {
  fill: none;
  stroke: url(#evolve-wheel-marquee-gradient);
  stroke-width: 2;
  stroke-dasharray: 10 6;
  animation: marquee-dash 1.8s linear infinite;
}

.evolve-wheel-item {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: var(--evolve-wheel-icon-size, 40px);
  height: var(--evolve-wheel-icon-size, 40px);
  border-radius: calc(var(--evolve-wheel-icon-size, 40px) * 0.15);
  overflow: hidden;
}

.evolve-wheel-icon {
  width: var(--evolve-wheel-icon-size, 40px);
  height: var(--evolve-wheel-icon-size, 40px);
  border-radius: calc(var(--evolve-wheel-icon-size, 40px) * 0.15);
  background: rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.evolve-wheel-item.active::before {
  content: '';
  position: absolute;
  top: -120%;
  left: -120%;
  width: 220%;
  height: 220%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: rotate(35deg);
  will-change: transform, top, left;
  pointer-events: none;
  z-index: 2;
  animation: result-icon-shine 3s linear infinite;
}

.evolve-wheel-item.active .evolve-wheel-icon {
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.18);
}

.evolve-wheel-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--evolve-wheel-center-size, 16px);
  height: var(--evolve-wheel-center-size, 16px);
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 1px solid rgba(255, 215, 0, 0.35);
  background: rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  z-index: 1;
}

.evolve-wheel-current {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
}

.evolve-wheel-current-label {
  color: var(--theme-accent);
}

.evolve-wheel-current-name {
  color: var(--theme-text);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.evolve-wheel-hint {
  margin-top: 4px;
  text-align: center;
  font-size: 11px;
  color: #aaa;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #fff;
}

.progress-label {
  color: #ffd700;
}

.progress-value {
  color: #fff;
}

.progress-track {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffd700, #ffaa00);
  transition: width 0.12s ease;
}

.gold-cost {
  font-size: 12px;
  color: #ccc;
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-select-wrapper {
  display: flex;
  align-items: center;
}

.action-select {
  border: 1px solid #4a4a6a;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.action-select option {
  background: #000;
  color: #fff;
}

.action-select:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.panel-right .action-select:hover:not(:disabled),
.panel-right .action-select:focus-visible:not(:disabled) {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(0, 0, 0, 0.92);
}

/* 祭品属性面板 */
.sacrifice-attribute-panel {
  margin-bottom: 6px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.35;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #4a4a6a;
  color: #fff;
}

.sacrifice-attribute-title {
  text-align: center;
  color: #ffd700;
  font-size: 12px;
  margin-bottom: 6px;
}

.sacrifice-attribute-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sacrifice-attribute-row {
  display: grid;
  grid-template-columns: 72px 60px 1fr 18px;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.sacrifice-attribute-row--selected {
  position: relative;
  background: rgba(255, 215, 0, 0.08);
  border-radius: 6px;
  padding: 2px 4px;
}

.sacrifice-attribute-row--selected::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background:
    repeating-linear-gradient(
        90deg,
        rgba(255, 215, 0, 0.95) 0 8px,
        rgba(255, 215, 0, 0) 8px 16px
      )
      top left / calc(100% - 12px) 2px no-repeat,
    repeating-linear-gradient(
        180deg,
        rgba(255, 215, 0, 0.95) 0 8px,
        rgba(255, 215, 0, 0) 8px 16px
      )
      top right / 2px calc(100% - 12px) no-repeat,
    repeating-linear-gradient(
        270deg,
        rgba(255, 215, 0, 0.95) 0 8px,
        rgba(255, 215, 0, 0) 8px 16px
      )
      bottom right / calc(100% - 12px) 2px no-repeat,
    repeating-linear-gradient(
        0deg,
        rgba(255, 215, 0, 0.95) 0 8px,
        rgba(255, 215, 0, 0) 8px 16px
      )
      bottom left / 2px calc(100% - 12px) no-repeat;
  pointer-events: none;
  animation: sacrifice-marquee-run 0.9s linear infinite;
}

.sacrifice-attribute-row--selected::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  border: 1px solid rgba(255, 215, 0, 0.35);
  pointer-events: none;
}

.sacrifice-attribute-radio {
  width: 14px;
  height: 14px;
  margin: 0;
  justify-self: end;
  accent-color: #ffd700;
}

@keyframes sacrifice-marquee-run {
  from {
    background-position: 0 0, 100% 0, 100% 100%, 0 100%;
  }
  to {
    background-position: 16px 0, 100% 16px, calc(100% - 16px) 100%, 0 calc(100% - 16px);
  }
}

.sacrifice-attribute-level {
  color: #ffd700;
  white-space: nowrap;
}

.sacrifice-attribute-grade,
.sacrifice-attribute-value {
  color: #fff;
  white-space: nowrap;
}

.sacrifice-attribute-empty {
  text-align: center;
  color: #aaa;
  font-size: 11px;
}

.action-button {
  border: 1px solid #4a4a6a;
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  position: relative;
  transition: all 0.2s;
}

.action-batch-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  padding: 1px 4px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(255, 215, 0, 0.55);
  color: #ffd700;
  font-size: 10px;
  line-height: 1.1;
  white-space: nowrap;
  pointer-events: none;
}

.panel-right .action-button:hover:not(:disabled) {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.action-button.active {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.2);
}

/* 配方面板 */
.recipe-panel {
  position: fixed;
  min-width: 380px;
  min-height: 250px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 10px;
  padding: 10px;
  color: #fff;
  overflow: auto;
  box-sizing: border-box;
}

.recipe-panel-title {
  font-size: 14px;
  color: #ffd700;
  text-align: center;
  margin-bottom: 8px;
}

.recipe-panel-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.recipe-line {
  line-height: 1.4;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.recipe-items {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.recipe-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.recipe-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #4a4a6a;
  background: rgba(0, 0, 0, 0.2);
}

.recipe-count {
  color: #fff;
}

.recipe-operator {
  color: #ffd700;
  margin: 0 2px;
}

.recipe-gold {
  color: #fff;
}

.recipe-result {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recipe-name {
  color: #fff;
}

/* 帮助面板 */
.help-section {
  padding: 8px;
  border: 1px solid #4a4a6a;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
}

.help-section-title {
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 6px;
}

.help-line {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex-wrap: wrap;
}

.help-label {
  color: #ffd700;
  white-space: nowrap;
}

.help-value {
  color: #fff;
}

.help-items {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.help-item-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.help-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
}

.help-empty {
  color: #aaa;
}

.help-table-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

.help-table-level {
  color: #ffd700;
  font-weight: 600;
  min-width: 70px;
}

/* 确认弹窗样式 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: linear-gradient(145deg, #2a2a3a, #1e1e2a);
  border: 2px solid rgba(255, 215, 0, 0.4);
  border-radius: 12px;
  padding: 20px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.confirm-title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.confirm-content {
  margin-bottom: 20px;
}

.confirm-info-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.confirm-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  min-width: 80px;
}

.confirm-value {
  color: #fff;
  font-size: 14px;
  flex: 1;
}

.confirm-value.highlight {
  color: #4ade80;
  font-weight: 500;
}

.confirm-warning {
  margin-top: 12px;
  padding: 10px;
  background: rgba(255, 193, 7, 0.15);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;
  color: #ffc107;
  font-size: 13px;
  text-align: center;
}

.confirm-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.confirm-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.confirm-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.2);
}

.confirm-btn.confirm {
  background: linear-gradient(135deg, #4ade80, #22c55e);
  color: #fff;
  box-shadow: 0 2px 8px rgba(74, 222, 128, 0.3);
}

.confirm-btn.confirm:hover {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4);
}

/* 确认弹窗过渡动画 */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: scale(0.9);
}
</style>
