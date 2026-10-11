<!--
  @fileoverview 珠宝大师-皮奇 主面板组件
  @description 珠宝大师NPC交互面板，整合各功能子组件
  @author FLYFF Team
  @version 2.0.0
  @created 2026-03-11
  @updated 2026-03-11 - 重构为引用子组件的精简版本
-->
<template>
  <transition name="jewelry-master-fade">
    <div v-if="isVisible" ref="modalContainerRef" class="jewelry-master-container" :style="modalStyle">
      <!-- 头部（可拖拽） -->
      <div class="jewelry-master-header" @pointerdown="startDrag">
        <div class="jewelry-master-title-wrapper">
          <img src="/pt/npc_icon/remine.png" class="jewelry-master-npc-icon" alt="皮奇" />
          <h2 class="jewelry-master-title">珠宝大师 - 皮奇</h2>
        </div>
        <div class="jewelry-master-header-actions">
          <button class="jewelry-master-help-btn" :class="{ active: showRulesPanel }" @click.stop="toggleRulesPanel"
            title="显示/隐藏规则">?</button>
          <button class="jewelry-master-close-btn" @click="onClose">×</button>
        </div>
      </div>

      <!-- 内容容器（可缩放） -->
      <div class="jewelry-master-content-wrapper">
        <div class="jewelry-master-scaled-content" :style="contentStyle">
          <!-- 主体内容 -->
          <div class="jewelry-master-body">
            <!-- 左侧功能菜单 -->
            <div class="jewelry-master-sidebar">
              <div class="jewelry-master-dialog">
                <p class="jewelry-master-dialog-text">{{ currentDialog }}</p>
              </div>
              <div class="jewelry-master-menu-title">功能列表</div>
              <button v-for="func in functions" :key="func.key" class="jewelry-master-menu-item"
                :class="{ active: activeFunction === func.key }" @click="selectFunction(func.key)">
                {{ func.name }}
              </button>
            </div>

            <!-- 右侧功能内容区域 - 使用子组件 -->
            <div class="jewelry-master-content">
              <!-- 制作闪亮精炼骰子 -->
              <ShinyDiceSynthesis v-if="activeFunction === 'shinyDice'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 制作宝石（提取） -->
              <GemExtraction v-if="activeFunction === 'gem'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 制作史诗武器 -->
              <EpicWeaponCraft v-if="activeFunction === 'epicWeapon'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 制作终极武器 -->
              <UltimateWeaponCraft v-if="activeFunction === 'ultimateWeapon'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 镶嵌宝石 -->
              <GemEmbed v-if="activeFunction === 'embedGem'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 拆除宝石 -->
              <GemRemove v-if="activeFunction === 'removeGem'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />

              <!-- 宝石合成 -->
              <GemSynthesis v-if="activeFunction === 'gemSynthesis'" @play-sfx="handlePlaySfx"
                @add-battle-log="handleAddBattleLog" @show-animation-message="handleShowAnimationMessage" />
            </div>
          </div>
        </div>
      </div>

      <!-- 拉伸手柄 -->
      <div class="jewelry-master-resize-handle" @pointerdown="startResize">
        <div class="resize-lines">
          <span class="resize-line"></span>
          <span class="resize-line"></span>
          <span class="resize-line"></span>
        </div>
      </div>
    </div>
  </transition>

  <!-- 规则面板（使用 Teleport 渲染到 body，避免被 overflow:hidden 裁剪） -->
  <Teleport to="body">
    <transition name="rules-panel-fade">
      <div v-if="showRulesPanel && activeFunction" class="jewelry-master-rules-panel" :style="rulesPanelStyle">
        <div class="rules-panel-header">
          <span class="rules-panel-title">{{ currentFunctionName }}规则</span>
          <button class="rules-panel-close" @click="showRulesPanel = false">×</button>
        </div>
        <div class="rules-panel-content">
          <!-- 制作闪亮精炼骰子规则 -->
          <template v-if="activeFunction === 'shinyDice'">
            <div class="rules-section">
              <div class="rules-section-title">合成规则</div>
              <div class="rules-item">4点骰子×5 + 8点骰子×5 = 闪亮骰子(4/8)</div>
              <div class="rules-item">6点骰子×5 + 8点骰子×5 = 闪亮骰子(6/8)</div>
              <div class="rules-item">12点骰子×5 + 10点骰子×5 = 闪亮骰子(12/10)</div>
            </div>
          </template>
          <!-- 制作宝石规则 -->
          <template v-else-if="activeFunction === 'gem'">
            <div class="rules-section">
              <div class="rules-section-title">提取规则</div>
              <div class="rules-item">分解60-70级武器 → 黄宝石 (成功率10%)</div>
              <div class="rules-item">分解71-85级武器 → 红宝石 (成功率9%)</div>
              <div class="rules-item">分解86-100级武器 → 蓝宝石 (成功率8%)</div>
              <div class="rules-item">分解101-119级武器 → 绿宝石 (成功率7%)</div>
              <div class="rules-item">分解120-140级武器 → 钻石 (成功率6%)</div>
              <div class="rules-item">分解141-160级武器 → 紫水晶 (成功率5%)</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">备注</div>
              <div class="rules-item">注：仅限普通、罕见品质的武器</div>
            </div>
          </template>
          <!-- 制作史诗武器规则 -->
          <template v-else-if="activeFunction === 'epicWeapon'">
            <div class="rules-section">
              <div class="rules-section-title">合成规则</div>
              <div class="rules-item">60-70级武器 + 黄宝石 → 60级史诗武器 (成功率7%)</div>
              <div class="rules-item">71-85级武器 + 红宝石 → 75级史诗武器 (成功率6%)</div>
              <div class="rules-item">86-100级武器 + 蓝宝石 → 90级史诗武器 (成功率5%)</div>
              <div class="rules-item">101-119级武器 + 绿宝石 → 105级史诗武器 (成功率4%)</div>
              <div class="rules-item">120-140级武器 + 钻石 → 120级史诗武器 (成功率3%)</div>
              <div class="rules-item">141-160级武器 + 紫水晶 → 150级史诗武器 (成功率1%)</div>
              <div class="rules-item">141-160级武器 + 璀璨紫水晶 → 150级史诗武器 (成功率2%)</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">备注</div>
              <div class="rules-item">注：仅限普通、罕见品质的武器，需要消耗闪亮精炼骰子×1</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">闪亮骰子加成</div>
              <div class="rules-item highlight">4点闪亮骰子：提高基础概率10%</div>
              <div class="rules-item highlight">6点闪亮骰子：提高基础概率20%</div>
              <div class="rules-item highlight">12点闪亮骰子：提高基础概率30%</div>
              <div class="rules-item note">示例：7%基础概率 + 4点骰子 = 7.7%</div>
            </div>
          </template>
          <!-- 制作终极武器规则 -->
          <template v-else-if="activeFunction === 'ultimateWeapon'">
            <div class="rules-section">
              <div class="rules-section-title">转换规则</div>
              <div class="rules-item">150级史诗/独特武器 + 闪耀晶石 + 终极宝珠</div>
              <div class="rules-item">武器等级必须为150级（潮汐/卢萨卡系列）</div>
              <div class="rules-item highlight">武器强化等级必须达到+10</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">转换概率</div>
              <div class="rules-item highlight">闪耀晶石×3 + 终极宝珠×3 = 100%</div>
              <div class="rules-item highlight">闪耀晶石×2 + 终极宝珠×2 = 70%</div>
              <div class="rules-item highlight">闪耀晶石×1 + 终极宝珠×1 = 30%</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">可转换武器</div>
              <div class="rules-item">弓：怒涛、卢萨卡之弓、卢萨卡的水晶弓</div>
              <div class="rules-item">飞轮：涡旋、卢萨卡飞轮、卢萨卡的水晶飞轮</div>
              <div class="rules-item">拳套：潮汐之拳、卢萨卡拳套、卢萨卡的水晶拳套</div>
              <div class="rules-item">魔棒：塞壬之歌、卢萨卡魔棒、卢萨卡的水晶魔棒</div>
              <div class="rules-item">单手剑：珊瑚短剑、卢萨卡之剑、卢萨卡的水晶剑</div>
              <div class="rules-item">双手剑：猛兽、卢萨卡巨剑、卢萨卡的水晶巨剑</div>
              <div class="rules-item">单手斧：螺号战斧、卢萨卡之斧、卢萨卡的水晶斧</div>
              <div class="rules-item">双手斧：绝渊、卢萨卡巨斧、卢萨卡的水晶巨斧</div>
              <div class="rules-item">法杖：海潮回响、卢萨卡法杖、卢萨卡的水晶法杖</div>
              <div class="rules-item">魔杖：呼风唤雨、卢萨卡魔杖、卢萨卡的水晶魔杖</div>
            </div>
          </template>
          <!-- 拆除宝石规则 -->
          <template v-else-if="activeFunction === 'removeGem'">
            <div class="rules-section">
              <div class="rules-section-title">拆除规则</div>
              <div class="rules-item">只能从终极品质武器上拆除宝石</div>
              <div class="rules-item">武器必须有已镶嵌的宝石</div>
              <div class="rules-item">拆除后宝石将返回背包</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">备注</div>
              <div class="rules-item">拆除操作100%成功</div>
            </div>
          </template>
          <!-- 宝石合成规则 -->
          <template v-else-if="activeFunction === 'gemSynthesis'">
            <div class="rules-section">
              <div class="rules-section-title">合成规则</div>
              <div class="rules-item highlight">10个相同宝石 → 1个高一级宝石</div>
              <div class="rules-item">碎片合成后变为1级宝石</div>
              <div class="rules-item note">注：部分宝石等级可能跳跃（如1级→3级）</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">合成示例</div>
              <div class="rules-item">闪耀黄玉碎片×10 → 闪耀黄玉（1级）×1</div>
              <div class="rules-item">闪耀黄玉（1级）×10 → 闪耀黄玉（3级）×1</div>
              <div class="rules-item">闪耀红宝石（1级）×10 → 闪耀红宝石（2级）×1</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">可合成宝石类型</div>
              <div class="rules-item">黄玉、红宝石、蓝宝石、绿宝石</div>
              <div class="rules-item">钻石、紫水晶、玛瑙、托帕石</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">备注</div>
              <div class="rules-item">仅限终极珠宝盒子中的碎片和闪耀宝石</div>
              <div class="rules-item">史诗品质宝石无法合成</div>
              <div class="rules-item">最高级宝石无法继续合成</div>
            </div>
          </template>
          <!-- 镶嵌宝石规则 -->
          <template v-else-if="activeFunction === 'embedGem'">
            <div class="rules-section">
              <div class="rules-section-title">镶嵌规则</div>
              <div class="rules-item">只能镶嵌到终极品质武器</div>
              <div class="rules-item">武器强化等级必须大于0</div>
              <div class="rules-item">宝石槽数量 = 强化等级（+1显示1个，+10显示10个）</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">可镶嵌宝石</div>
              <div class="rules-item highlight">所有闪耀宝石（排除碎片）</div>
              <div class="rules-item highlight">所有符文类宝石</div>
            </div>
            <div class="rules-section">
              <div class="rules-section-title">重复限制</div>
              <div class="rules-item">所有宝石每种只能镶嵌一个</div>
              <div class="rules-item">相同ID的宝石不能重复镶嵌</div>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script>
/**
 * @fileoverview 珠宝大师-皮奇 主面板组件
 * @description 珠宝大师NPC交互面板，整合各功能子组件
 * @author FLYFF Team
 * @version 2.0.0
 * @created 2026-03-11
 * @updated 2026-03-11 - 重构为引用子组件的精简版本
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 导入子组件
import {
  ShinyDiceSynthesis,
  GemExtraction,
  EpicWeaponCraft,
  UltimateWeaponCraft,
  GemEmbed,
  GemRemove,
  GemSynthesis
} from './jewelry-master'

// 导入共享逻辑
import { useJewelryMaster } from '@/composables/useJewelryMaster'

export default {
  name: 'JewelryMasterModal',

  // 禁用自动继承属性，因为组件使用 Teleport 导致根节点为 fragment
  inheritAttrs: false,

  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    player: {
      type: Object,
      default: null
    }
  },

  components: {
    ShinyDiceSynthesis,
    GemExtraction,
    EpicWeaponCraft,
    UltimateWeaponCraft,
    GemEmbed,
    GemRemove,
    GemSynthesis
  },

  emits: ['close', 'play-sfx', 'add-battle-log', 'show-animation-message'],

  setup(props, { emit }) {
    // 从 composable 获取共享逻辑
    const {
      // 状态
      isVisible: internalVisible,
      activeFunction,
      showRulesPanel,
      modalContainerRef,
      modalStyle,
      rulesPanelStyle,

      // 面板尺寸
      panelWidth,
      panelHeight,
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT,
      MIN_WIDTH,
      MIN_HEIGHT,
      scaleRatio,
      contentStyle,

      // 对话框
      currentDialog,

      // 功能列表
      functions,
      currentFunctionName,

      // Tooltip 方法（通过window事件控制全局ItemTooltip）
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,

      // 方法
      selectFunction,
      handleClose,
      startDrag,
      startResize,
      toggleRulesPanel,

      // 工具方法
      handleIconError
    } = useJewelryMaster()

    // 监听 props.isVisible 变化，同步到 composable 的内部状态
    // 注意：不创建同名 toRef，避免与 props.isVisible 重复 key
    watch(() => props.isVisible, (newVal) => {
      internalVisible.value = newVal
    }, { immediate: true })

    /**
     * 播放音效
     * @param {string} type - 音效类型
     */
    const handlePlaySfx = (type) => {
      emit('play-sfx', type)
    }

    /**
     * 添加战斗日志
     * @param {object} log - 日志对象
     */
    const handleAddBattleLog = (log) => {
      emit('add-battle-log', log)
    }

    /**
     * 显示动画消息
     * @param {string} text - 消息文本
     * @param {string} type - 消息类型
     * @param {string} icon - 图标路径
     */
    const handleShowAnimationMessage = (text, type, icon) => {
      emit('show-animation-message', text, type, icon)
    }

    /**
     * 关闭面板（通知父组件）
     */
    const onClose = () => {
      handleClose()
      emit('close')
    }

    return {
      // 状态
      activeFunction,
      showRulesPanel,
      modalContainerRef,
      modalStyle,
      rulesPanelStyle,

      // 面板尺寸
      panelWidth,
      panelHeight,
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT,
      MIN_WIDTH,
      MIN_HEIGHT,
      scaleRatio,
      contentStyle,

      // 对话框
      currentDialog,

      // 功能列表
      functions,
      currentFunctionName,

      // Tooltip 方法（通过window事件控制全局ItemTooltip）
      showItemTooltip,
      showItemTooltipById,
      hideItemTooltip,
      moveItemTooltip,

      // 方法
      selectFunction,
      onClose,
      startDrag,
      startResize,
      toggleRulesPanel,

      // 子组件事件处理
      handlePlaySfx,
      handleAddBattleLog,
      handleShowAnimationMessage,

      // 工具方法
      handleIconError
    }
  }
}
</script>

<style scoped>
/* 容器 */
.jewelry-master-container {
  position: fixed;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  user-select: none;
  display: flex;
  flex-direction: column;
}

/* 内容容器 */
.jewelry-master-content-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 缩放内容 */
.jewelry-master-scaled-content {
  transform-origin: top left;
}

/* 头部 */
.jewelry-master-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, #2a2a4a 0%, #3a3a5a 100%);
  border-radius: 10px 10px 0 0;
  cursor: move;
}

.jewelry-master-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.jewelry-master-npc-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #6a6a8a;
}

.jewelry-master-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.jewelry-master-close-btn {
  width: 32px;
  height: 32px;
  background: #4a4a6a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-close-btn:hover {
  background: #ff4444;
}

.jewelry-master-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.jewelry-master-help-btn {
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

.jewelry-master-help-btn:hover {
  background: linear-gradient(135deg, #5a7aaa 0%, #4a6a9a 100%);
  border-color: #8aaaca;
  box-shadow: 0 0 10px rgba(106, 138, 186, 0.5);
}

.jewelry-master-help-btn.active {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
}

/* 规则面板 */
.jewelry-master-rules-panel {
  width: max-content;
  max-width: 320px;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%);
  border: 2px solid #4a4a6a;
  border-radius: 8px;
  box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.5);
}

.rules-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(90deg, #3a3a5a 0%, #4a4a6a 100%);
  border-radius: 6px 6px 0 0;
}

.rules-panel-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
}

.rules-panel-close {
  width: 24px;
  height: 24px;
  background: #4a4a6a;
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.rules-panel-close:hover {
  background: #ff4444;
}

.rules-panel-content {
  padding: 12px 14px;
  max-height: 500px;
  overflow-y: auto;
}

.rules-section {
  margin-bottom: 12px;
}

.rules-section:last-child {
  margin-bottom: 0;
}

.rules-section-title {
  font-size: 13px;
  font-weight: bold;
  color: #6aa8ff;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #3a3a5a;
}

.rules-item {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 4px;
  padding-left: 8px;
  position: relative;
}

.rules-item::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #6a6a8a;
}

.rules-item.highlight {
  color: #ffd700;
}

.rules-item.note {
  color: #888;
  font-style: italic;
  padding-left: 0;
}

.rules-item.note::before {
  content: none;
}

/* 主体 */
.jewelry-master-body {
  display: flex;
  height: 350px;
}

/* 左侧菜单 */
.jewelry-master-sidebar {
  width: 160px;
  background: linear-gradient(180deg, #2a2a4a 0%, #1a1a2e 100%);
  border-right: 1px solid #3a3a5a;
  display: flex;
  flex-direction: column;
  padding: 6px;
  overflow: hidden;
}

/* 左侧菜单滚动条样式（保留但不默认显示） */
.jewelry-master-sidebar::-webkit-scrollbar {
  width: 4px;
}

.jewelry-master-sidebar::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 2px;
}

.jewelry-master-sidebar::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 2px;
}

.jewelry-master-sidebar::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

.jewelry-master-dialog {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 6px;
  margin-bottom: 6px;
}

.jewelry-master-dialog-text {
  font-size: 10px;
  color: #aaa;
  line-height: 1.4;
  margin: 0;
}

.jewelry-master-menu-title {
  font-size: 10px;
  color: #888;
  padding: 4px 0;
  border-bottom: 1px solid #3a3a5a;
  margin-bottom: 4px;
}

.jewelry-master-menu-item {
  width: 100%;
  padding: 6px 8px;
  margin: 2px 0;
  background: linear-gradient(90deg, #3a3a5a 0%, #2a2a4a 100%);
  border: 1px solid #4a4a6a;
  border-radius: 4px;
  color: #ccc;
  font-size: 11px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.jewelry-master-menu-item:hover {
  background: linear-gradient(90deg, #4a4a6a 0%, #3a3a5a 100%);
  border-color: #6a6a8a;
}

.jewelry-master-menu-item.active {
  background: linear-gradient(90deg, #ffd700 0%, #ffaa00 100%);
  border-color: #ffdd44;
  color: #1a1a2a;
  font-weight: bold;
}

/* 菜单项容器 - 支持滚动时底部留空 */
.jewelry-master-menu-items {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 右侧内容 */
.jewelry-master-content {
  flex: 1;
  padding: 8px;
  overflow: hidden;
}

/* 过渡动画 */
.jewelry-master-fade-enter-active,
.jewelry-master-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.jewelry-master-fade-enter-from,
.jewelry-master-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.rules-panel-fade-enter-active,
.rules-panel-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.rules-panel-fade-enter-from,
.rules-panel-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 滚动条样式 */
.jewelry-master-content::-webkit-scrollbar {
  width: 6px;
}

.jewelry-master-content::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 3px;
}

.jewelry-master-content::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 3px;
}

.jewelry-master-content::-webkit-scrollbar-thumb:hover {
  background: #5a5a7a;
}

/* 拉伸手柄 */
.jewelry-master-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-lines {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 4px;
}

.resize-line {
  width: 10px;
  height: 2px;
  background: #ffd700;
  border-radius: 1px;
  opacity: 1;
}

.resize-line:nth-child(1) {
  animation: resize-bounce-1 1.5s ease-in-out infinite;
}

.resize-line:nth-child(2) {
  width: 8px;
  animation: resize-bounce-2 1.5s ease-in-out infinite 0.1s;
}

.resize-line:nth-child(3) {
  width: 6px;
  animation: resize-bounce-3 1.5s ease-in-out infinite 0.2s;
}

@keyframes resize-bounce-1 {

  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }

  50% {
    transform: translateX(2px);
    opacity: 0.8;
  }
}

@keyframes resize-bounce-2 {

  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }

  50% {
    transform: translateX(2px);
    opacity: 0.8;
  }
}

@keyframes resize-bounce-3 {

  0%,
  100% {
    transform: translateX(0);
    opacity: 1;
  }

  50% {
    transform: translateX(2px);
    opacity: 0.8;
  }
}
</style>
