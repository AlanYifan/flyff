<template>
    <!-- 主区域：信息栏 + 日历（留在面板内部） -->
    <div class="daily-sign-in">
        <!-- 签到信息栏 -->
        <div class="sign-in-header">
            <div class="month-display">
                <span class="month-year">{{ currentYear }}年</span>
                <span class="month-value">{{ currentMonth + 1 }}月</span>
            </div>
            <div class="streak-info">
                <div class="streak-badge">
                    <span class="streak-icon">🔥</span>
                    <span class="streak-label">连续签到</span>
                    <span class="streak-value">{{ consecutiveDays }}天</span>
                </div>
                <div class="total-badge">
                    <span class="total-icon">📋</span>
                    <span class="total-label">累计签到</span>
                    <span class="total-value">{{ totalSignInDays }}天</span>
                </div>
            </div>
        </div>

        <!-- 日历区域 -->
        <div class="calendar-wrapper">
            <!-- 星期表头 -->
            <div class="calendar-weekdays">
                <div v-for="w in weekdays" :key="w" class="weekday-cell">{{ w }}</div>
            </div>

            <!-- 日历格子 -->
            <div class="calendar-grid">
                <div v-for="(cell, index) in calendarDays" :key="index" class="calendar-cell"
                    :class="{
                        empty: cell.day === null,
                        today: cell.isToday,
                        signed: cell.isSignedIn,
                        milestone: cell.reward?.isMilestone,
                        selected: cell.day !== null && cell.day === selectedDay,
                        future: cell.day !== null && cell.day > currentDay && !cell.isSignedIn,
                        missed: cell.day !== null && cell.day < currentDay && !cell.isSignedIn
                    }"
                    @click="selectDay(cell)"
                    @mouseenter="cell.day !== null && showItemTooltipForDay(cell, $event)"
                    @mouseleave="hideItemTooltip"
                    @mousemove="updateTooltipPosition($event)">

                    <template v-if="cell.day !== null">
                        <!-- 日期数字 -->
                        <span class="cell-day">{{ cell.day }}</span>

                        <!-- 奖励图标（跳过基础物品1276/1277，显示随机奖励物品） -->
                        <div v-if="cell.reward" class="cell-reward">
                            <img v-for="(item, i) in cell.reward.items.slice(2, 5)" :key="i"
                                :src="`/pt/item_icon/${item.id}.png`"
                                :alt="getItemName(item.id)"
                                @error="handleImageError"
                                class="cell-reward-icon" />
                            <span v-if="cell.reward.items.length > 5" class="cell-more">+{{ cell.reward.items.length - 5 }}</span>
                        </div>

                        <!-- 已签到标记 -->
                        <span v-if="cell.isSignedIn" class="signed-check">✓</span>

                        <!-- 里程碑标记 -->
                        <span v-if="cell.reward?.isMilestone && !cell.isSignedIn" class="milestone-star">★</span>

                        <!-- 特殊奖励倍率标记 -->
                        <span v-if="cell.day && isSpecialRewardDay(cell.day, currentYear, currentMonth) && !cell.isSignedIn" class="multiplier-tag" :class="{ 'x3': getDayMultiplier(cell.day, currentYear, currentMonth) === 3 }">x{{ getDayMultiplier(cell.day, currentYear, currentMonth) }}</span>
                    </template>
                </div>
            </div>
        </div>
    </div>

    <!-- 侧栏：奖励预览 + 签到按钮 + 击杀进度（浮动在面板右侧外部） -->
    <div class="sign-in-side-panel" :style="sidePanelStyle">
        <!-- 选中日期奖励预览 -->
        <div class="today-reward-panel">
            <div class="today-reward-title">
                <span>{{ currentMonth + 1 }}月{{ selectedDay ?? currentDay }}日 奖励</span>
                <span v-if="selectedDay !== null && isSpecialRewardDay(selectedDay, currentYear, currentMonth)" class="multiplier-reward-tag" :class="{ 'x3': getDayMultiplier(selectedDay, currentYear, currentMonth) === 3 }">{{ getDayMultiplier(selectedDay, currentYear, currentMonth) === 3 ? '三倍满勤' : '双倍奖励' }}</span>
                <span v-if="selectedReward?.isMilestone" class="milestone-tag">{{ selectedReward.label }}</span>
            </div>
            <div class="today-reward-items">
                <template v-if="selectedReward">
                    <div v-for="(item, index) in selectedReward.items" :key="index" class="today-reward-item"
                        @mouseenter="showItemTooltipForItem(item, $event)"
                        @mouseleave="hideItemTooltip"
                        @mousemove="updateTooltipPosition($event)">
                        <img :src="`/pt/item_icon/${item.id}.png`" :alt="getItemName(item.id)"
                            @error="handleImageError" />
                        <span class="reward-item-name">{{ getItemName(item.id) }}</span>
                        <span class="reward-item-count">x{{ item.count }}</span>
                    </div>
                </template>
                <span v-else class="no-reward">该日期暂无签到奖励</span>
            </div>
        </div>

        <!-- 签到按钮：只允许签到当天日期，查看其他日期时显示提示 -->
        <div class="sign-in-action">
            <div v-if="isViewingOtherDay" class="viewing-other-day-hint">
                <span class="locked-icon">📅</span>
                <span>仅可签到当天（{{ currentDay }}日），点击今天日期可返回签到</span>
            </div>
            <button v-else-if="canSignIn" class="sign-in-btn" :disabled="isSigningIn" @click="handleSignIn">
                <span v-if="isSigningIn">签到中...</span>
                <span v-else>立即签到</span>
            </button>
            <div v-else-if="hasSignedInToday" class="signed-today">
                <span class="signed-icon">✓</span>
                <span>今日已签到，明天再来吧！</span>
            </div>
            <div v-else-if="!killRequirementMet || !bossKillRequirementMet" class="kill-locked">
                <span class="locked-icon">🔒</span>
                <span v-if="!killRequirementMet && !bossKillRequirementMet">
                    击杀进度不足，完成{{ requiredKills }}只怪物击杀 + {{ requiredBossKills }}只BOSS击杀后可签到
                </span>
                <span v-else-if="!killRequirementMet">
                    击杀进度不足，完成{{ requiredKills }}只怪物击杀后可签到
                </span>
                <span v-else>
                    BOSS击杀不足，完成{{ requiredBossKills }}只BOSS击杀后可签到
                </span>
            </div>
            <div v-else class="sign-in-disabled">
                签到不可用
            </div>
        </div>

        <!-- 击杀进度条 -->
        <div class="kill-progress-bar">
            <div class="kill-progress-info">
                <span class="kill-icon">⚔️</span>
                <span class="kill-label">{{ isViewingOtherDay ? '选中日期击杀要求' : '今日击杀进度' }}</span>
                <span class="kill-count" :class="{ met: !isViewingOtherDay && killRequirementMet }">{{ todayKillCount }}/{{ selectedRequiredKills }}</span>
                <span v-if="isViewingOtherDay" class="view-hint">（仅供参考）</span>
            </div>
            <div class="kill-progress-track">
                <div class="kill-progress-fill" :class="{ complete: !isViewingOtherDay && killRequirementMet }"
                    :style="{ width: killProgressPercent + '%' }"></div>
            </div>
            <div class="kill-range-text">怪物等级 {{ levelRangeText }}</div>
        </div>

        <!-- BOSS击杀进度条 -->
        <div class="kill-progress-bar boss-progress-bar">
            <div class="kill-progress-info">
                <span class="kill-icon">💀</span>
                <span class="kill-label">{{ isViewingOtherDay ? '选中日期BOSS要求' : 'BOSS击杀进度' }}</span>
                <span class="kill-count" :class="{ met: !isViewingOtherDay && bossKillRequirementMet }">{{ todayBossKillCount }}/{{ selectedRequiredBossKills }}</span>
            </div>
            <div class="kill-progress-track">
                <div class="kill-progress-fill boss-fill" :class="{ complete: !isViewingOtherDay && bossKillRequirementMet }"
                    :style="{ width: bossKillProgressPercent + '%' }"></div>
            </div>
            <div class="kill-range-text">任意等级巨大/堕落/普通BOSS</div>
        </div>

    </div>
</template>

<script setup>
/**
 * 每日签到组件
 *
 * @file DailySignIn.vue
 * @description 显示当前真实月份日历，支持每日签到领取奖励
 * @description 主区域（信息栏+进度条+日历）显示在面板内部，侧栏（奖励预览+签到按钮+规则）浮动在面板右侧外部
 * @description 奖励含基础物品(1276、1277各5个) + 随机物品；第7、14、21、28天x2，第31天月末满勤x3
 * @description 签到前置条件：每日需击杀30只等级在玩家等级±10范围内的怪物 + 击杀指定数量BOSS
 * @description BOSS击杀要求阶梯递增：普通日1只，第7天2只，第14天3只，第21天4只，第28天5只，第31天6只
 * @description 点击日历任意日期可查看该天奖励详情
 * @generated 2026-06-24
 */
import { ref, watch, onMounted, computed } from 'vue'
import { useDailySignIn, KILL_LEVEL_RANGE, getDayMultiplier, isSpecialRewardDay, getKillRequirement, getBossKillRequirement } from '@/composables/useDailySignIn'
import { useItemsStore } from '@/store/items'

// Props
const props = defineProps({
    /** 玩家数据对象 */
    player: {
        type: Object,
        default: () => ({})
    },
    /** 功能面板位置（用于定位侧栏浮动位置） */
    panelPosition: {
        type: Object,
        default: () => ({ x: 0, y: 0 })
    },
    /** 功能面板尺寸（用于定位侧栏浮动位置） */
    panelSize: {
        type: Object,
        default: () => ({ width: 600, height: 500 })
    }
})

// Emits
const emit = defineEmits(['add-battle-log', 'show-animation-message', 'play-sfx'])

// Store
const itemsStore = useItemsStore()

// 星期表头
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 使用签到组合式函数
const {
    currentYear,
    currentMonth,
    currentDay,
    consecutiveDays,
    totalSignInDays,
    hasSignedInToday,
    canSignIn,
    isSigningIn,
    monthlyRewards,
    calendarDays,
    todayKillCount,
    todayBossKillCount,
    requiredKills,
    requiredBossKills,
    killRequirementMet,
    bossKillRequirementMet,
    loadSignInData,
    doSignIn,
    refreshNow,
    getItemName
} = useDailySignIn(
    () => props.player,
    {
        onAddBattleLog: (msg, type) => emit('add-battle-log', msg, type),
        onShowAnimationMessage: (msg, type, icon) => emit('show-animation-message', msg, type, icon),
        onPlaySfx: (sfx) => emit('play-sfx', sfx)
    }
)

/** 选中查看的日期（默认为今天） */
const selectedDay = ref(null)

/** 选中日期的奖励配置 */
const selectedReward = computed(() => {
    if (selectedDay.value === null) return null
    return monthlyRewards.value.get(selectedDay.value) || null
})

/** 选中日期的怪物击杀要求（用于进度条显示） */
const selectedRequiredKills = computed(() => {
    const day = selectedDay.value ?? currentDay.value
    return getKillRequirement(day, currentYear.value, currentMonth.value)
})

/** 选中日期的BOSS击杀要求（用于进度条显示） */
const selectedRequiredBossKills = computed(() => {
    const day = selectedDay.value ?? currentDay.value
    return getBossKillRequirement(day, currentYear.value, currentMonth.value)
})

/** 进度条是否显示选中日期而非今日 */
const isViewingOtherDay = computed(() => {
    return selectedDay.value !== null && selectedDay.value !== currentDay.value
})

/** 击杀进度百分比（用于进度条宽度，按选中日期要求计算） */
const killProgressPercent = computed(() => {
    const req = selectedRequiredKills.value || 1
    return Math.min((todayKillCount.value / req) * 100, 100)
})

/** BOSS 击杀进度百分比（按选中日期要求计算） */
const bossKillProgressPercent = computed(() => {
    const req = selectedRequiredBossKills.value || 1
    return Math.min((todayBossKillCount.value / req) * 100, 100)
})

/** 玩家等级范围描述 */
const levelRangeText = computed(() => {
    const level = props.player?.level || 1
    return `${level - KILL_LEVEL_RANGE}~${level + KILL_LEVEL_RANGE}`
})

/**
 * 侧栏浮动面板样式：紧贴功能面板右侧外部，高度与面板一致
 * 如果右侧空间不足则显示在面板左侧
 */
const sidePanelStyle = computed(() => {
    const gap = 4
    const sideWidth = 250
    const panelRight = props.panelPosition.x + props.panelSize.width
    const panelLeft = props.panelPosition.x
    const viewportWidth = window.innerWidth

    // 优先放在面板右侧
    if (panelRight + gap + sideWidth <= viewportWidth) {
        return {
            position: 'fixed',
            left: `${panelRight + gap}px`,
            top: `${props.panelPosition.y}px`,
            width: `${sideWidth}px`,
            height: `${props.panelSize.height}px`,
            zIndex: '1050'
        }
    }

    // 右侧空间不足，放在面板左侧
    if (panelLeft - gap - sideWidth >= 0) {
        return {
            position: 'fixed',
            left: `${panelLeft - gap - sideWidth}px`,
            top: `${props.panelPosition.y}px`,
            width: `${sideWidth}px`,
            height: `${props.panelSize.height}px`,
            zIndex: '1050'
        }
    }

    // 两侧都不够，默认放在右侧（可能部分超出视口）
    return {
        position: 'fixed',
        left: `${panelRight + gap}px`,
        top: `${props.panelPosition.y}px`,
        width: `${sideWidth}px`,
        height: `${props.panelSize.height}px`,
        zIndex: '1050'
    }
})

/**
 * 处理签到点击
 */
const handleSignIn = () => {
    doSignIn()
}

/**
 * 点击日历格子，选中该日期查看奖励详情
 * @param {Object} cell - 日历格子数据
 */
const selectDay = (cell) => {
    if (cell.day === null) return
    selectedDay.value = cell.day
}

/**
 * 图片加载错误处理
 * @param {Event} event - 事件对象
 */
const handleImageError = (event) => {
    event.target.src = '/pt/item_icon/default_item.png'
}

/**
 * 显示日历格子的物品提示（优先显示随机奖励物品）
 * @param {Object} cell - 日历格子数据
 * @param {MouseEvent} event - 鼠标事件
 */
const showItemTooltipForDay = (cell, event) => {
    if (!cell.reward || !cell.reward.items || cell.reward.items.length === 0) return

    // 优先显示随机奖励物品（跳过基础物品1276/1277，它们在items数组前两位）
    const randomItems = cell.reward.items.slice(2)
    if (randomItems.length > 0) {
        showItemTooltipForItem(randomItems[0], event)
        return
    }

    // 如果没有随机物品，回退到第一个物品
    showItemTooltipForItem(cell.reward.items[0], event)
}

/**
 * 显示单个物品提示
 * @param {Object} item - 物品信息 { id, count }
 * @param {MouseEvent} event - 鼠标事件
 */
const showItemTooltipForItem = (item, event) => {
    const config = itemsStore.getItemConfig(item.id)
    if (!config) return

    const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
            item: { ...config, count: item.count },
            position: { x: event.clientX, y: event.clientY },
            source: 'daily-sign-in'
        }
    })
    window.dispatchEvent(tooltipEvent)
}

/**
 * 隐藏物品提示
 */
const hideItemTooltip = () => {
    const tooltipEvent = new CustomEvent('hide-item-tooltip')
    window.dispatchEvent(tooltipEvent)
}

/**
 * 更新提示位置
 * @param {MouseEvent} event - 鼠标事件
 */
const updateTooltipPosition = (event) => {
    const tooltipEvent = new CustomEvent('move-item-tooltip', {
        detail: {
            position: { x: event.clientX, y: event.clientY }
        }
    })
    window.dispatchEvent(tooltipEvent)
}

// 监听玩家数据变化，重新加载签到状态
// 由于 gameStore.updatePlayer 会频繁替换 player 对象（浅拷贝），需要监听 player 本身而非仅 dailySignIn
watch(() => props.player, () => {
    loadSignInData()
}, { immediate: true })

// 组件挂载时刷新时间并加载数据
onMounted(() => {
    refreshNow()
    loadSignInData()
    selectedDay.value = currentDay.value
})
</script>

<style scoped>
/* ==================== 主区域样式 ==================== */
.daily-sign-in {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
}

/* 签到信息栏 */
.sign-in-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #8b7355;
    border-radius: 8px;
}

.month-display {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.month-year {
    font-size: 14px;
    color: #aaa;
}

.month-value {
    font-size: 22px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.streak-info {
    display: flex;
    gap: 12px;
}

.streak-badge,
.total-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 13px;
}

.streak-badge {
    background: linear-gradient(135deg, rgba(255, 100, 0, 0.2), rgba(255, 50, 0, 0.1));
    border: 1px solid rgba(255, 100, 0, 0.4);
}

.total-badge {
    background: linear-gradient(135deg, rgba(100, 200, 255, 0.15), rgba(50, 150, 255, 0.08));
    border: 1px solid rgba(100, 200, 255, 0.3);
}

.streak-icon,
.total-icon {
    font-size: 14px;
}

.streak-label,
.total-label {
    color: #ccc;
}

.streak-value {
    color: #ff9500;
    font-weight: bold;
}

.total-value {
    color: #64c8ff;
    font-weight: bold;
}

/* 击杀进度条 */
.kill-progress-bar {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #8b7355;
    border-radius: 8px;
}

.kill-progress-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
    font-size: 12px;
}

.kill-icon {
    font-size: 14px;
}

.kill-label {
    color: #ccc;
}

.kill-count {
    color: #ff9500;
    font-weight: bold;
}

.kill-count.met {
    color: #4caf50;
}

.kill-range-text {
    color: #888;
    font-size: 10px;
    margin-top: 4px;
}

.kill-progress-track {
    width: 100%;
    height: 8px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 4px;
    overflow: hidden;
}

.kill-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6b00, #ff9500);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.kill-progress-fill.complete {
    background: linear-gradient(90deg, #4caf50, #66bb6a);
}

/* BOSS击杀进度条特殊样式 */
.boss-progress-bar .kill-count {
    color: #e040fb;
}

.boss-progress-bar .kill-count.met {
    color: #4caf50;
}

.kill-progress-fill.boss-fill {
    background: linear-gradient(90deg, #7b1fa2, #e040fb);
}

.kill-progress-fill.boss-fill.complete {
    background: linear-gradient(90deg, #4caf50, #66bb6a);
}

/* 日历区域 */
.calendar-wrapper {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid #8b7355;
    border-radius: 8px;
    padding: 8px;
    flex: 1;
    overflow-y: auto;
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin-bottom: 6px;
}

.weekday-cell {
    text-align: center;
    font-size: 12px;
    color: #888;
    font-weight: bold;
    padding: 4px 0;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.calendar-cell {
    position: relative;
    aspect-ratio: 1;
    min-height: 42px;
    border-radius: 6px;
    border: 1px solid rgba(139, 115, 85, 0.3);
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    overflow: hidden;
}

.calendar-cell:not(.empty):hover {
    border-color: #ffd700;
    background: rgba(139, 115, 85, 0.15);
    transform: scale(1.05);
    z-index: 2;
}

.calendar-cell.empty {
    border: none;
    background: transparent;
    cursor: default;
}

.calendar-cell.today {
    border-color: #ffd700;
    border-width: 2px;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.calendar-cell.selected {
    border-color: #64c8ff;
    border-width: 2px;
    box-shadow: 0 0 8px rgba(100, 200, 255, 0.4);
    background: linear-gradient(135deg, rgba(100, 200, 255, 0.12), rgba(50, 150, 255, 0.06));
}

.calendar-cell.selected.today {
    border-color: #ffd700;
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.3), 0 0 8px rgba(100, 200, 255, 0.4);
}

.calendar-cell.signed {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(56, 142, 60, 0.08));
    border-color: rgba(76, 175, 80, 0.4);
}

.calendar-cell.milestone {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.12), rgba(255, 165, 0, 0.06));
    border-color: rgba(255, 215, 0, 0.4);
}

.calendar-cell.missed {
    opacity: 0.4;
}

.calendar-cell.future {
    opacity: 0.65;
}

.cell-day {
    font-size: 13px;
    font-weight: bold;
    color: #ddd;
    line-height: 1;
}

.calendar-cell.today .cell-day {
    color: #ffd700;
}

.calendar-cell.signed .cell-day {
    color: #4caf50;
}

.cell-reward {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-top: 2px;
}

.cell-reward-icon {
    width: 18px;
    height: 18px;
    object-fit: contain;
    border-radius: 3px;
}

.cell-more {
    font-size: 9px;
    color: #ffd700;
    font-weight: bold;
}

.signed-check {
    position: absolute;
    top: 2px;
    right: 3px;
    font-size: 12px;
    color: #4caf50;
    font-weight: bold;
}

.milestone-star {
    position: absolute;
    top: 2px;
    right: 3px;
    font-size: 12px;
    color: #ffd700;
    text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
}

/* 倍率奖励标记 */
.multiplier-tag {
    position: absolute;
    bottom: 2px;
    right: 3px;
    font-size: 10px;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(135deg, #ff4444, #ff8800);
    padding: 1px 4px;
    border-radius: 4px;
    text-shadow: none;
    line-height: 1;
}

.multiplier-tag.x3 {
    background: linear-gradient(135deg, #aa00ff, #ff4444);
}

/* 滚动条样式 */
.calendar-wrapper::-webkit-scrollbar {
    width: 8px;
}

.calendar-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.calendar-wrapper::-webkit-scrollbar-thumb {
    background: #8b7355;
    border-radius: 4px;
}

.calendar-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a08060;
}

/* ==================== 侧栏浮动面板样式 ==================== */
.sign-in-side-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #8b7355;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 10px;
    overflow-y: auto;
}

/* 选中日期奖励预览 */
.today-reward-panel {
    padding: 8px 10px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #8b7355;
    border-radius: 8px;
}

.today-reward-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #ffd700;
    font-weight: bold;
}

.milestone-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 165, 0, 0.15));
    border: 1px solid rgba(255, 215, 0, 0.4);
    color: #ffd700;
    font-weight: normal;
}

/* 倍率奖励标题标签 */
.multiplier-reward-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.25), rgba(255, 136, 0, 0.15));
    border: 1px solid rgba(255, 68, 68, 0.4);
    color: #ff8844;
    font-weight: normal;
}

.multiplier-reward-tag.x3 {
    background: linear-gradient(135deg, rgba(170, 0, 255, 0.25), rgba(255, 68, 68, 0.15));
    border: 1px solid rgba(170, 0, 255, 0.4);
    color: #cc66ff;
}

.today-reward-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.today-reward-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(139, 115, 85, 0.5);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
}

.today-reward-item:hover {
    border-color: #ffd700;
    background: rgba(139, 115, 85, 0.15);
}

.today-reward-item img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    flex-shrink: 0;
}

.reward-item-name {
    font-size: 12px;
    color: #ccc;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.reward-item-count {
    font-size: 12px;
    color: #ffd700;
    font-weight: bold;
    flex-shrink: 0;
}

.no-reward {
    color: #888;
    font-size: 13px;
}

.view-hint {
    font-size: 11px;
    color: #64c8ff;
    font-weight: normal;
}

/* 签到按钮 */
.sign-in-action {
    display: flex;
    justify-content: center;
    padding: 4px 0;
    flex-shrink: 0;
}

.sign-in-btn {
    padding: 10px 32px;
    background: linear-gradient(180deg, #ffd700 0%, #ff9500 100%);
    border: none;
    border-radius: 8px;
    color: #1a1a2e;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(255, 215, 0, 0.3);
    width: 100%;
}

.sign-in-btn:hover:not(:disabled) {
    transform: scale(1.03);
    box-shadow: 0 4px 16px rgba(255, 215, 0, 0.5);
}

.sign-in-btn:active:not(:disabled) {
    transform: scale(0.98);
}

.sign-in-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.signed-today {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #4caf50;
    font-size: 14px;
    font-weight: bold;
    justify-content: center;
}

.signed-icon {
    font-size: 20px;
}

.sign-in-disabled {
    color: #888;
    font-size: 14px;
    text-align: center;
}

.viewing-other-day-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #6ab7ff;
    font-size: 12px;
    line-height: 1.4;
}

.kill-locked {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ff9500;
    font-size: 12px;
}

.locked-icon {
    font-size: 16px;
}

/* 侧栏滚动条样式 */
.sign-in-side-panel::-webkit-scrollbar {
    width: 6px;
}

.sign-in-side-panel::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.sign-in-side-panel::-webkit-scrollbar-thumb {
    background: #8b7355;
    border-radius: 4px;
}

.sign-in-side-panel::-webkit-scrollbar-thumb:hover {
    background: #a08060;
}
</style>
