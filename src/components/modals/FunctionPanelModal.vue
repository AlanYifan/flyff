<template>
    <transition name="function-panel" appear>
        <div v-if="isVisible" ref="panelRef" class="function-panel-modal" :style="panelStyle">
            <!-- 面板头部 -->
            <div class="panel-header" @mousedown="startDrag">
                <h2 class="panel-title">功能面板</h2>
                <button class="close-button" @click="close">&times;</button>
            </div>

            <!-- 面板内容 -->
            <div class="panel-content">
                <!-- 左侧功能菜单 -->
                <div class="menu-sidebar">
                    <div v-for="item in menuItems" :key="item.key" class="menu-item"
                        :class="{ active: activeMenu === item.key }" @click="switchMenu(item.key)">
                        <span class="menu-icon">{{ item.icon }}</span>
                        <span class="menu-text">{{ item.name }}</span>
                    </div>
                </div>

                <!-- 右侧功能区域 -->
                <div class="content-area">
                    <!-- 等级奖励 -->
                    <div v-if="activeMenu === 'levelReward'" class="level-reward-area">
                        <h3 class="area-title">等级奖励</h3>
                        <div class="reward-list">
                            <div v-for="reward in levelRewards" :key="reward.level" class="reward-item">
                                <!-- 左侧：等级 -->
                                <div class="reward-level">
                                    <span class="level-label">Lv.</span>
                                    <span class="level-value">{{ reward.level }}</span>
                                </div>

                                <!-- 中间：奖励物品 -->
                                <div class="reward-items">
                                    <div v-for="(item, index) in reward.items" :key="index" class="reward-item-icon"
                                        @mouseenter="showItemTooltip($event, item)" @mouseleave="hideItemTooltip"
                                        @mousemove="updateTooltipPosition($event)">
                                        <img :src="`/pt/item_icon/${item.id}.png`" :alt="item.name"
                                            @error="handleImageError" />
                                        <span class="item-count">x{{ item.count }}</span>
                                    </div>
                                </div>

                                <!-- 右侧：领取按钮 -->
                                <div class="reward-action">
                                    <button v-if="canClaimReward(reward) && !isClaimed(reward.level)" class="claim-btn"
                                        @click="claimReward(reward)">
                                        领取
                                    </button>
                                    <span v-else-if="isClaimed(reward.level)" class="claimed-text">
                                        已领取
                                    </span>
                                    <span v-else class="locked-text">
                                        等级不足
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 每日签到 -->
                    <DailySignIn
                        v-else-if="activeMenu === 'dailySignIn'"
                        :player="props.player"
                        :panel-position="position"
                        :panel-size="panelSize"
                        @add-battle-log="(msg, type) => emit('add-battle-log', msg, type)"
                        @show-animation-message="(msg, type, icon) => emit('show-animation-message', msg, type, icon)"
                        @play-sfx="(sfx) => emit('play-sfx', sfx)"
                    />

                    <!-- 其他功能预留 -->
                    <div v-else class="empty-area">
                        <span class="empty-text">功能开发中...</span>
                    </div>
                </div>
            </div>

            <!-- 拉伸手柄（右下角） -->
            <div class="resize-handle" @mousedown.stop.prevent="startResize"></div>
        </div>
    </transition>
</template>

<script setup>
/**
 * 功能面板模态框
 *
 * @file FunctionPanelModal.vue
 * @description 提供等级奖励等功能的统一入口面板
 * @generated 2026-02-16
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useItemsStore } from '@/store/items'
import BagService from '@/services/BagService'
import { storageService } from '@/services/StorageService'
import DailySignIn from '@/components/modals/DailySignIn.vue'

/**
 * 等级奖励配置
 * @type {Array<{level: number, items: Array<{id: number, count: number, name: string}>}>}
 */
const LEVEL_REWARDS_CONFIG = [
    {
        level: 1,
        items: [
            { id: 7613, count: 1, name: '小怪笑箱' },
            { id: 6401, count: 399, name: '橙汁' },
            { id: 7809, count: 299, name: '魔力多(小)' },
            { id: 1276, count: 30, name: '自动恢复卷轴' },
            { id: 1277, count: 30, name: '自动出售卷轴' },
            { id: 829, count: 20, name: 'ES经验卷轴' },
            { id: 4863, count: 20, name: '超级力量卷轴' },
            { id: 814, count: 300, name: 'PK纸片' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 15,
        items: [
            { id: 7883, count: 299, name: '肉串' },
            { id: 8840, count: 299, name: '魔力多(中)' },
            { id: 1276, count: 20, name: '自动恢复卷轴' },
            { id: 1277, count: 20, name: '自动出售卷轴' },
            { id: 829, count: 15, name: 'ES经验卷轴' },
            { id: 4863, count: 15, name: '超级力量卷轴' },
            { id: 814, count: 250, name: 'PK纸片' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 30,
        items: [
            { id: 2940, count: 199, name: '巧克力棒' },
            { id: 3868, count: 199, name: '魔力多(大)' },
            { id: 1276, count: 15, name: '自动恢复卷轴' },
            { id: 1277, count: 15, name: '自动出售卷轴' },
            { id: 829, count: 10, name: 'ES经验卷轴' },
            { id: 4863, count: 10, name: '超级力量卷轴' },
            { id: 814, count: 200, name: 'PK纸片' },
            { id: 7613, count: 1, name: '小怪笑箱' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 45,
        items: [
            { id: 5085, count: 399, name: '牛奶' },
            { id: 5933, count: 399, name: '强化魔力多(小)' },
            { id: 1276, count: 15, name: '自动恢复卷轴' },
            { id: 1277, count: 15, name: '自动出售卷轴' },
            { id: 829, count: 10, name: 'ES经验卷轴' },
            { id: 4863, count: 10, name: '超级力量卷轴' },
            { id: 814, count: 150, name: 'PK纸片' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 60,
        items: [
            { id: 8691, count: 10, name: '力量之石' },
            { id: 6049, count: 10, name: '鳗鱼' },
            { id: 2551, count: 10, name: '防御之石' },
            { id: 829, count: 20, name: 'ES经验卷轴' },
            { id: 4863, count: 10, name: '超级力量卷轴' },
            { id: 2527, count: 10, name: '装备防护卷轴' },
            { id: 677, count: 10, name: '黄宝石' },
            { id: 814, count: 100, name: 'PK纸片' },
            { id: 7613, count: 1, name: '小怪笑箱' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 65,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 8600, count: 1, name: '宠物蛋' },
            { id: 1683, count: 10, name: '宠物糖果F' },
            { id: 2313, count: 10, name: '首饰防护卷轴' },
        ]
    },
    {
        level: 70,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 2313, count: 20, name: '宠物糖果F' },
            { id: 3945, count: 10, name: '穿洞防护卷轴' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 75,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 5906, count: 20, name: '宠物糖果E' },
            { id: 7016, count: 10, name: '红宝石' },
            { id: 6672, count: 10, name: '12点精炼骰子' },
        ]
    },
    {
        level: 80,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 3380, count: 25, name: '宠物糖果D' },
            { id: 9344, count: 10, name: '10点精炼骰子' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 85,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 8748, count: 25, name: '宠物糖果C' },

        ]
    },
    {
        level: 90,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 4371, count: 25, name: '宠物糖果B' },
            { id: 768, count: 10, name: '蓝宝石' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 95,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 6663, count: 50, name: '宠物糖果A' },

        ]
    },
    {
        level: 100,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 6663, count: 50, name: '宠物糖果A' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
        ]
    },
    {
        level: 105,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 9940, count: 10, name: '绿宝石' },
            { id: 6663, count: 12, name: '宠物糖果A' },
        ]
    },
    {
        level: 110,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 9940, count: 10, name: '绿宝石' },
            { id: 7197, count: 1, name: '祝福的全能棉花糖' },
            { id: 6663, count: 12, name: '宠物糖果A' },
        ]
    },
    {
        level: 115,
        items: [
            { id: 1276, count: 5, name: '自动恢复卷轴' },
            { id: 1277, count: 5, name: '自动出售卷轴' },
            { id: 829, count: 3, name: 'ES经验卷轴' },
            { id: 4863, count: 3, name: '超级力量卷轴' },
            { id: 9940, count: 10, name: '绿宝石' },
            { id: 6663, count: 12, name: '宠物糖果A' },
        ]
    },
    {
        level: 120,
        items: [
            { id: 829, count: 12, name: 'ES经验卷轴' },
            { id: 4863, count: 12, name: '超级力量卷轴' },
            { id: 8691, count: 12, name: '力量之石' },
            { id: 6049, count: 12, name: '鳗鱼' },
            { id: 2551, count: 12, name: '防御之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 1529, count: 12, name: '属性更改卷轴' },
            { id: 347, count: 12, name: '属性石头选择箱' },
            { id: 1099, count: 1, name: '属性重置卷轴' },
            { id: 11681, count: 12, name: '属性重置卷轴' },
            { id: 7197, count: 5, name: '祝福的全能棉花糖' },
            { id: 6663, count: 36, name: '宠物糖果A' },
        ]
    },
    {
        level: 125,
        items: [
            { id: 829, count: 6, name: 'ES经验卷轴' },
            { id: 8691, count: 3, name: '力量之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 6663, count: 8, name: '宠物糖果A' },
        ]
    },
    {
        level: 130,
        items: [
            { id: 829, count: 6, name: 'ES经验卷轴' },
            { id: 8691, count: 3, name: '力量之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 6663, count: 8, name: '宠物糖果A' },
        ]
    },
    {
        level: 135,
        items: [
            { id: 829, count: 6, name: 'ES经验卷轴' },
            { id: 8691, count: 3, name: '力量之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 6663, count: 8, name: '宠物糖果A' },
        ]
    },
    {
        level: 140,
        items: [
            { id: 829, count: 6, name: 'ES经验卷轴' },
            { id: 8691, count: 3, name: '力量之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 6663, count: 8, name: '宠物糖果A' },
        ]
    },
    {
        level: 145,
        items: [
            { id: 829, count: 6, name: 'ES经验卷轴' },
            { id: 8691, count: 3, name: '力量之石' },
            { id: 6934, count: 10, name: '钻石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 6663, count: 8, name: '宠物糖果A' },
        ]
    },
    {
        level: 150,
        items: [
            { id: 829, count: 20, name: 'ES经验卷轴' },
            { id: 4656, count: 1, name: '改名卷轴' },
            { id: 8691, count: 20, name: '力量之石' },
            { id: 4863, count: 20, name: '超级力量卷轴' },
            { id: 6049, count: 20, name: '鳗鱼' },
            { id: 2551, count: 20, name: '防御之石' },
            { id: 14737, count: 20, name: '终极防护卷轴' },
            { id: 15403, count: 20, name: '晶石' },
            { id: 12908, count: 9, name: '闪耀晶石' },
            { id: 15012, count: 9, name: '终极宝珠' },
            { id: 1099, count: 1, name: '属性重置卷轴' },
            { id: 12252, count: 20, name: '属性重置卷轴' },
            { id: 12944, count: 20, name: '属性重置卷轴' },
            { id: 11681, count: 20, name: '属性重置卷轴' },
            { id: 6663, count: 50, name: '宠物糖果A' },
        ]
    },
    {
        level: 155,
        items: [
            { id: 829, count: 9, name: 'ES经验卷轴' },
            { id: 10597, count: 10, name: '紫水晶' },
            { id: 14737, count: 5, name: '终极防护卷轴' },
            { id: 15403, count: 5, name: '晶石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 12252, count: 5, name: '属性重置卷轴' },
            { id: 12944, count: 5, name: '属性重置卷轴' },
        ]
    },
    {
        level: 160,
        items: [
            { id: 829, count: 9, name: 'ES经验卷轴' },
            { id: 10597, count: 10, name: '紫水晶' },
            { id: 14737, count: 5, name: '终极防护卷轴' },
            { id: 15403, count: 5, name: '晶石' },
            { id: 11681, count: 5, name: '属性重置卷轴' },
            { id: 12252, count: 5, name: '属性重置卷轴' },
            { id: 12944, count: 5, name: '属性重置卷轴' },
        ]
    },
    {
        level: 165,
        items: [
            { id: 829, count: 25, name: 'ES经验卷轴' },
            { id: 10597, count: 30, name: '紫水晶' },
            { id: 14737, count: 30, name: '终极防护卷轴' },
            { id: 15403, count: 30, name: '晶石' },
            { id: 12252, count: 30, name: '属性重置卷轴' },
            { id: 12944, count: 30, name: '属性重置卷轴' },
            { id: 7027, count: 10, name: '属性重置卷轴' },
            { id: 1099, count: 1, name: '属性重置卷轴' },
        ]
    }
]

// Props
const props = defineProps({
    isVisible: {
        type: Boolean,
        default: false
    },
    player: {
        type: Object,
        default: () => ({})
    }
})

// Emits
const emit = defineEmits(['close', 'add-battle-log', 'show-animation-message', 'play-sfx'])

// Store
const itemsStore = useItemsStore()
// storageService 已通过 import 导入全局单例

// 响应式数据
const panelRef = ref(null)
const activeMenu = ref('levelReward')
const position = ref({ x: 0, y: 0 })
const claimedLevels = ref(new Set())

/** 面板尺寸（可拉伸） */
const panelSize = ref({ width: 600, height: 500 })

/** 面板最小/最大尺寸约束 */
const MIN_WIDTH = 420
const MIN_HEIGHT = 360
const MAX_WIDTH = 1200
const MAX_HEIGHT = 900

// 菜单项
const menuItems = [
    { key: 'levelReward', name: '等级奖励', icon: '🎁' },
    { key: 'dailySignIn', name: '每日签到', icon: '📅' }
]

// 等级奖励数据
const levelRewards = computed(() => LEVEL_REWARDS_CONFIG)

// 面板样式（包含位置和尺寸）
const panelStyle = computed(() => ({
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: `${panelSize.value.width}px`,
    height: `${panelSize.value.height}px`
}))

/**
 * 获取物品名称
 * @param {number} itemId - 物品ID
 * @returns {string} 物品名称
 */
const getItemName = (itemId) => {
    const config = itemsStore.getItemConfig(itemId)
    if (config?.name) {
        return typeof config.name === 'string' ? config.name : config.name.cns || config.name.en || '未知物品'
    }
    return '未知物品'
}

/**
 * 检查是否可以领取奖励
 * @param {Object} reward - 奖励配置
 * @returns {boolean} 是否可以领取
 */
const canClaimReward = (reward) => {
    const playerLevel = props.player?.level || 1
    return playerLevel >= reward.level
}

/**
 * 检查奖励是否已领取
 * 双重校验：本地缓存 + 玩家持久化数据，防止刷新后丢失领取记录
 * @param {number} level - 等级
 * @returns {boolean} 是否已领取
 */
const isClaimed = (level) => {
    if (claimedLevels.value.has(level)) {
        return true
    }
    // 从玩家持久化数据中二次校验，防止本地缓存与持久化数据不同步
    const savedLevels = props.player?.claimedLevelRewards
    if (Array.isArray(savedLevels) && savedLevels.includes(level)) {
        // 同步本地缓存
        claimedLevels.value.add(level)
        return true
    }
    return false
}

/**
 * 领取奖励
 * @param {Object} reward - 奖励配置
 */
const claimReward = (reward) => {
    if (isClaimed(reward.level)) {
        return
    }

    // 添加所有奖励物品到背包
    const bagService = new BagService()
    let successCount = 0
    const itemNames = []

    reward.items.forEach(item => {
        const success = bagService.addItemToBag(item.id, null, item.count)
        if (success) {
            successCount++
            itemNames.push(`${getItemName(item.id)} x${item.count}`)
        }
    })

    if (successCount > 0) {
        // 立即保存背包数据到 localStorage（跳过防抖，确保数据不丢失）
        bagService.savePlayerData()

        // 标记为已领取
        claimedLevels.value.add(reward.level)
        saveClaimedLevels()

        // 发送战斗日志
        emit('add-battle-log', `领取等级奖励 Lv.${reward.level}：${itemNames.join('、')}`, 'reward')

        // 显示动画消息（参数格式：text, type, icon）
        emit('show-animation-message', `领取 Lv.${reward.level} 奖励成功！`, 'reward', '/pt/UI/gold.png')

        // 播放获得物品音效
        emit('play-sfx', 'InfGroundPickup.wav')
    }
}

/**
 * 保存已领取等级到玩家存档数据
 */
const saveClaimedLevels = () => {
    try {
        if (!props.player) return

        // 将已领取等级数组保存到玩家数据的 claimedLevelRewards 字段
        const levelsArray = Array.from(claimedLevels.value)
        props.player.claimedLevelRewards = levelsArray

        // 使用 savePlayerPatch 保存，避免完整 savePlayerData 覆盖其他字段
        storageService.savePlayerPatch({ claimedLevelRewards: levelsArray })
    } catch (error) {
        console.error('[FunctionPanel] 保存已领取等级失败:', error)
    }
}

/**
 * 从玩家存档数据加载已领取等级
 */
const loadClaimedLevels = () => {
    try {
        if (!props.player) {
            claimedLevels.value = new Set()
            return
        }

        // 从玩家数据中读取已领取等级
        const savedLevels = props.player.claimedLevelRewards
        if (savedLevels && Array.isArray(savedLevels)) {
            claimedLevels.value = new Set(savedLevels)
        } else {
            claimedLevels.value = new Set()
        }
    } catch (error) {
        console.error('[FunctionPanel] 加载已领取等级失败:', error)
        claimedLevels.value = new Set()
    }
}

/**
 * 切换菜单
 * @param {string} key - 菜单键
 */
const switchMenu = (key) => {
    activeMenu.value = key
}

/**
 * 关闭面板
 */
const close = () => {
    emit('close')
}

/**
 * 图片加载错误处理
 * @param {Event} event - 事件对象
 */
const handleImageError = (event) => {
    event.target.src = '/pt/item_icon/default_item.png'
}

/**
 * 显示物品提示
 * @param {MouseEvent} event - 鼠标事件
 * @param {Object} item - 物品信息
 */
const showItemTooltip = (event, item) => {
    const config = itemsStore.getItemConfig(item.id)
    if (!config) return

    const tooltipEvent = new CustomEvent('show-item-tooltip', {
        detail: {
            item: { ...config, count: item.count },
            position: { x: event.clientX, y: event.clientY },
            source: 'function-panel'
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

// 拖拽相关
let isDragging = false
let dragStartPos = { x: 0, y: 0 }
let panelStartPos = { x: 0, y: 0 }

/**
 * 开始拖拽
 * @param {MouseEvent} event - 鼠标事件
 */
const startDrag = (event) => {
    if (event.target.closest('.close-button')) return

    isDragging = true
    dragStartPos = { x: event.clientX, y: event.clientY }
    panelStartPos = { ...position.value }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
}

/**
 * 处理拖拽
 * @param {MouseEvent} event - 鼠标事件
 */
const handleDrag = (event) => {
    if (!isDragging) return

    const dx = event.clientX - dragStartPos.x
    const dy = event.clientY - dragStartPos.y

    const newX = panelStartPos.x + dx
    const newY = panelStartPos.y + dy

    // 限制在视口内
    const maxX = window.innerWidth - panelSize.value.width
    const maxY = window.innerHeight - panelSize.value.height

    position.value = {
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
    }
}

/**
 * 停止拖拽
 */
const stopDrag = () => {
    isDragging = false
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
}

// ==================== 面板拉伸逻辑 ====================

/** 是否正在拉伸 */
let isResizing = false
/** 拉伸起始鼠标位置 */
let resizeStartPos = { x: 0, y: 0 }
/** 拉伸起始面板尺寸 */
let resizeStartSize = { width: 0, height: 0 }

/**
 * 开始拉伸面板
 * @param {MouseEvent} event - 鼠标事件
 */
const startResize = (event) => {
    isResizing = true
    resizeStartPos = { x: event.clientX, y: event.clientY }
    resizeStartSize = { ...panelSize.value }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
    event.preventDefault()
}

/**
 * 处理拉伸移动
 * @param {MouseEvent} event - 鼠标事件
 */
const handleResize = (event) => {
    if (!isResizing) return

    const dx = event.clientX - resizeStartPos.x
    const dy = event.clientY - resizeStartPos.y

    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartSize.width + dx))
    const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStartSize.height + dy))

    // 确保面板不超出视口右下边界
    const maxW = window.innerWidth - position.value.x
    const maxH = window.innerHeight - position.value.y

    panelSize.value = {
        width: Math.min(newWidth, maxW),
        height: Math.min(newHeight, maxH)
    }
}

/**
 * 停止拉伸
 */
const stopResize = () => {
    isResizing = false
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
}

/**
 * 初始化面板位置
 */
const initPosition = () => {
    const panelWidth = panelSize.value.width
    const panelHeight = panelSize.value.height
    position.value = {
        x: (window.innerWidth - panelWidth) / 2,
        y: (window.innerHeight - panelHeight) / 2
    }
}

// 监听玩家数据变化，重新加载领取状态
watch(() => props.player, (newPlayer) => {
    if (newPlayer) {
        loadClaimedLevels()
    }
}, { immediate: true })

// 生命周期
onMounted(() => {
    initPosition()
    loadClaimedLevels()
})

onUnmounted(() => {
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.function-panel-modal {
    position: fixed;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #8b7355;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    z-index: 1050;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(180deg, #2a2a4e 0%, #1a1a2e 100%);
    border-bottom: 1px solid #8b7355;
    cursor: move;
    user-select: none;
}

.panel-title {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.close-button {
    width: 32px;
    height: 32px;
    border: 1px solid #8b7355;
    border-radius: 4px;
    background: rgba(139, 115, 85, 0.3);
    color: #ffd700;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.close-button:hover {
    background: rgba(139, 115, 85, 0.6);
    transform: scale(1.1);
}

.panel-content {
    flex: 1;
    display: flex;
    overflow: hidden;
}

/* 左侧菜单 */
.menu-sidebar {
    width: 110px;
    min-width: 110px;
    background: rgba(0, 0, 0, 0.3);
    border-right: 1px solid #8b7355;
    padding: 8px;
    overflow-y: auto;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px;
    margin-bottom: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #ccc;
}

.menu-item:hover {
    background: rgba(139, 115, 85, 0.3);
    color: #ffd700;
}

.menu-item.active {
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%);
    color: #ffd700;
    border-left: 3px solid #ffd700;
}

.menu-icon {
    font-size: 16px;
}

.menu-text {
    font-size: 14px;
    font-weight: 500;
}

/* 右侧内容区域 */
.content-area {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
}

.area-title {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: bold;
    color: #ffd700;
    border-bottom: 1px solid #8b7355;
    padding-bottom: 8px;
}

/* 等级奖励列表 */
.reward-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reward-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #8b7355;
    border-radius: 8px;
    transition: all 0.2s;
}

.reward-item:hover {
    border-color: #ffd700;
    background: rgba(139, 115, 85, 0.1);
}

.reward-level {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    min-width: 50px;
    padding: 5px;
    background: linear-gradient(180deg, #2a2a4e 0%, #1a1a2e 100%);
    border-radius: 6px;
    border: 1px solid #8b7355;
}

.level-label {
    font-size: 12px;
    color: #888;
}

.level-value {
    font-size: 24px;
    font-weight: bold;
    color: #ffd700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.reward-items {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.reward-item-icon {
    position: relative;
    width: 35px;
    height: 35px;
    border: 1px solid #8b7355;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.2s;
}

.reward-item-icon:hover {
    border-color: #ffd700;
    transform: scale(1.1);
}

.reward-item-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.item-count {
    position: absolute;
    bottom: 20px;
    right: 0px;
    font-size: 10px;
    color: #ffffff;
    padding: 1px 4px;
    border-radius: 3px;
    background: #000000bd;
}

.reward-action {
    min-width: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.claim-btn {
    padding: 8px 16px;
    background: linear-gradient(180deg, #ffd700 0%, #ff9500 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.claim-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
}

.claim-btn:active {
    transform: scale(0.98);
}

.claimed-text {
    color: #4caf50;
    font-size: 14px;
    font-weight: bold;
}

.locked-text {
    color: #888;
    font-size: 12px;
}

/* 空状态 */
.empty-area {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.empty-text {
    color: #888;
    font-size: 16px;
}

/* 右下角拉伸手柄 */
.resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
    z-index: 10;
}

.resize-handle::before {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-right: 2px solid #8b7355;
    border-bottom: 2px solid #8b7355;
    border-bottom-right-radius: 2px;
    transition: border-color 0.2s;
}

.resize-handle:hover::before {
    border-color: #ffd700;
}

/* 过渡动画 */
.function-panel-enter-active,
.function-panel-leave-active {
    transition: all 0.3s ease;
}

.function-panel-enter-from,
.function-panel-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

/* 滚动条样式 */
.content-area::-webkit-scrollbar,
.menu-sidebar::-webkit-scrollbar {
    width: 8px;
}

.content-area::-webkit-scrollbar-track,
.menu-sidebar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb,
.menu-sidebar::-webkit-scrollbar-thumb {
    background: #8b7355;
    border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover,
.menu-sidebar::-webkit-scrollbar-thumb:hover {
    background: #a08060;
}
</style>
