/**
 * @file useDungeonDropSystem.js
 * @description 副本掉落动画系统组合式函数
 * @features
 *   - 管理掉落物动画（DropAnimation 组件）的状态与生命周期
 *   - 管理品级光柱特效（ItemDropBeamEffect 组件）
 *   - 计算怪物屏幕坐标，在击杀位置生成掉落物
 *   - 拾取逻辑回调：金币→队长金币，普通/罕见→队长背包，稀有/传说/史诗→分配面板
 *   - 兼容捡宠自动拾取（PickuppetPet 组件通过 dropAnimationRefsMap 调用 triggerPetPickup）
 * @since 2026-07-03
 */

import { ref } from 'vue'

// ============ 常量 ============

/** 掉落物内容框尺寸（与 DropAnimation.vue 的 .drop-content 一致，80×80px） */
const DROP_CONTENT_SIZE = 80

/** 掉落物图片在内容框中的顶部偏移（图片 20px + margin-bottom 8px + 文本 ~20px，flex 垂直居中后约 17px） */
const BEAM_IMAGE_TOP_OFFSET = 17

/** 散开方向向量表（与 DropAnimation.vue computeAnimationParams 中的 directions 完全一致） */
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

/** 触发光柱的品级键名集合（稀有/传说/史诗） */
const beamEffectRankKeys = new Set(['rare', 'veryrare', 'legendary', 'unique', 'epic'])

/** 中文品级标签到品级键名的映射 */
const beamEffectRankLabels = new Map([
  ['稀有', 'rare'],
  ['传说', 'veryrare'],
  ['史诗', 'unique']
])

/** 光柱特效同时显示上限 */
const beamEffectMaxConcurrent = 8

/** 掉落动画数量达到此阈值时启用快速模式（减少动画时长） */
const fastDropAnimationThreshold = 6

/**
 * 副本掉落动画系统组合式函数
 * @param {Object} callbacks - 回调函数集合
 * @param {Function} callbacks.onPickupGold - 金币拾取回调，参数为金币数量
 * @param {Function} callbacks.onPickupItem - 普通/罕见物品拾取回调，参数为 (itemId, quantity, itemData)
 * @param {Function} callbacks.onPickupRareItem - 稀有/传说/史诗物品拾取回调，参数为 itemData
 * @param {Function} [callbacks.playPickupSound] - 拾取音效回调，参数为类型 ('gold' | 'item')
 * @returns {Object} 掉落系统状态与方法
 */
export function useDungeonDropSystem ({
  onPickupGold,
  onPickupItem,
  onPickupRareItem,
  playPickupSound
}) {
  // ============ 状态 ============

  /** 活动掉落动画列表 */
  const activeDropAnimations = ref([])

  /** 活动光柱特效列表 */
  const activeBeamEffects = ref([])

  /** 掉落动画组件实例引用 Map（key 为 animationId，value 为组件实例），供捡宠直接调用 triggerPetPickup */
  const dropAnimationRefsMap = ref({})

  /** 光柱特效组件实例引用 Map（key 为 beamId，value 为组件实例） */
  const beamEffectRefsMap = ref({})

  /** 掉落物流元数据 Map（key 为 animationId，value 为物品/金币信息） */
  const dropItemFlowMeta = new Map()

  /** 已拾取的动画 ID 集合，防止重复拾取 */
  const awardedDropAnimationIds = new Set()

  /** 掉落动画 ID → 光柱特效 ID 的映射，拾取时据此销毁光柱 */
  const dropAnimationBeamMap = new Map()

  // ============ 工具函数 ============

  /**
   * 生成唯一 ID
   * @returns {string} 唯一标识符
   */
  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  }

  /**
   * 获取怪物元素在屏幕上的位置
   * 通过 data-monster-uid 属性查找怪物卡片 DOM 元素，返回其左上角坐标
   * @param {Object} monster - 怪物对象（需包含 uid 字段）
   * @returns {{ x: number, y: number, width: number, height: number }} 屏幕坐标及尺寸
   */
  const getMonsterScreenPosition = (monster) => {
    try {
      if (!monster || monster.uid === undefined || monster.uid === null) {
        return {
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.3,
          width: 80,
          height: 80
        }
      }

      const el = document.querySelector(`[data-monster-uid="${monster.uid}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        // 返回怪物卡片左上角坐标，偏移半个内容框以居中
        return {
          x: rect.left + rect.width / 2 - DROP_CONTENT_SIZE / 2,
          y: rect.top + rect.height / 2 - DROP_CONTENT_SIZE / 2,
          width: rect.width,
          height: rect.height
        }
      }

      // 怪物元素不存在时使用默认位置（战斗区域中央偏上）
      return {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.3,
        width: 80,
        height: 80
      }
    } catch (error) {
      console.error('[DungeonDropSystem] 获取怪物屏幕位置失败:', error)
      return {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.3,
        width: 80,
        height: 80
      }
    }
  }

  /**
   * 判定物品品级是否触发光柱特效，返回对应的品级键名
   * 兼容 rarity / rarityName / quality / grade / rank / levelName 等字段
   * @param {Object} item - 物品对象
   * @returns {string|null} 品级键名（如 'rare'），不满足条件返回 null
   */
  const getItemBeamRank = (item) => {
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

    // 匹配英文键名（忽略大小写）
    const lower = trimmed.toLowerCase()
    if (beamEffectRankKeys.has(lower)) {
      return lower
    }

    return null
  }

  /**
   * 计算掉落物散开偏移量（复现 DropAnimation.vue 的 computeAnimationParams 逻辑）
   * 使用动画 ID 作为种子确定散开方向，确保光柱位置与物品最终位置一致
   * @param {string} animationId - 掉落动画 ID
   * @param {number} monsterWidth - 怪物卡片宽度
   * @param {number} monsterHeight - 怪物卡片高度
   * @returns {{ x: number, y: number }} 散开偏移量
   */
  const computeScatterOffset = (animationId, monsterWidth, monsterHeight) => {
    // 计算种子
    const seed = animationId
      .toString()
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)

    // 散开距离（限制在怪物边框内）
    const maxDistance = Math.min(monsterWidth, monsterHeight) / 2 - 10
    const distance = Math.min(80, maxDistance)

    // 散开方向（8 个方向）
    const directionIndex = seed % 8
    const direction = SCATTER_DIRECTIONS[directionIndex]

    return {
      x: direction.x * distance,
      y: direction.y * distance
    }
  }

  // ============ 光柱特效 ============

  /**
   * 设置/清理光柱特效组件的 ref 引用
   * @param {string} beamId - 光柱特效 ID
   * @param {Object|null} el - 组件实例，v-for 卸载时为 null
   */
  const setBeamEffectRef = (beamId, el) => {
    if (el) {
      beamEffectRefsMap.value[beamId] = el
    } else {
      delete beamEffectRefsMap.value[beamId]
    }
  }

  /**
   * 创建物品掉落光柱特效
   * 在掉落物品图片的顶部居中外侧位置生成对应品级颜色的光柱动画
   * @param {{ x: number, y: number }} position - 光柱基点屏幕坐标
   * @param {string} rank - 品级键名
   * @returns {string|null} 光柱特效 ID，创建失败返回 null
   */
  const createBeamEffect = (position, rank) => {
    try {
      // 超过并发上限则不再新增光柱
      if (activeBeamEffects.value.length >= beamEffectMaxConcurrent) {
        return null
      }

      const beamId = generateUniqueId()
      activeBeamEffects.value.push({
        id: beamId,
        position,
        rank
      })

      return beamId
    } catch (error) {
      console.error('[DungeonDropSystem] 创建光柱特效失败:', error)
      return null
    }
  }

  /**
   * 光柱特效完成回调，从活动列表中移除
   * @param {string} beamId - 光柱特效 ID
   */
  const onBeamEffectComplete = (beamId) => {
    try {
      const index = activeBeamEffects.value.findIndex(b => b.id === beamId)
      if (index !== -1) {
        activeBeamEffects.value.splice(index, 1)
      }
      delete beamEffectRefsMap.value[beamId]
    } catch (error) {
      console.error('[DungeonDropSystem] 移除光柱特效失败:', error)
    }
  }

  // ============ 掉落动画 ============

  /**
   * 设置/清理掉落动画组件的 ref 引用
   * @param {string} animationId - 动画 ID
   * @param {Object|null} el - 组件实例，v-for 卸载时为 null
   */
  const setDropAnimationRef = (animationId, el) => {
    if (el) {
      dropAnimationRefsMap.value[animationId] = el
    } else {
      delete dropAnimationRefsMap.value[animationId]
    }
  }

  /**
   * 创建物品掉落动画
   * @param {Object} monster - 怪物对象（需包含 uid 字段）
   * @param {Object} item - 物品数据（包含 id、name、rarity 等）
   * @param {Object} [monsterPosition] - 预计算的怪物屏幕位置（避免重复查询 DOM）
   * @returns {string|null} 动画 ID，创建失败返回 null
   */
  const createDropAnimation = (monster, item, monsterPosition = null) => {
    try {
      const pos = monsterPosition || getMonsterScreenPosition(monster)
      const monsterPayload = {
        id: monster?.id,
        name: monster?.name || 'Unknown Monster',
        width: pos.width || 80,
        height: pos.height || 80,
        x: pos.x,
        y: pos.y
      }

      const animationId = generateUniqueId()
      const newAnimation = {
        id: animationId,
        monster: monsterPayload,
        item,
        goldAmount: 0,
        fastMode: activeDropAnimations.value.length >= fastDropAnimationThreshold,
        autoLoot: true
      }

      if (!newAnimation.monster || !newAnimation.monster.id) {
        return null
      }

      activeDropAnimations.value.push(newAnimation)

      // 稀有/传说/史诗品级物品触发光柱特效
      const beamRankKey = getItemBeamRank(item)
      if (beamRankKey) {
        const scatter = computeScatterOffset(
          animationId,
          monsterPayload.width,
          monsterPayload.height
        )
        const beamPosition = {
          x: monsterPayload.x + scatter.x + DROP_CONTENT_SIZE / 2,
          y: monsterPayload.y + scatter.y + BEAM_IMAGE_TOP_OFFSET
        }
        const beamId = createBeamEffect(beamPosition, beamRankKey)
        if (beamId) {
          dropAnimationBeamMap.set(animationId, beamId)
        }
      }

      return animationId
    } catch (error) {
      console.error('[DungeonDropSystem] 创建物品掉落动画失败:', error)
      return null
    }
  }

  /**
   * 创建金币掉落动画
   * @param {Object} monster - 怪物对象
   * @param {number} goldAmount - 金币数量
   * @param {Object} [monsterPosition] - 预计算的怪物屏幕位置
   * @returns {string|null} 动画 ID，创建失败返回 null
   */
  const createGoldDropAnimation = (monster, goldAmount, monsterPosition = null) => {
    try {
      const pos = monsterPosition || getMonsterScreenPosition(monster)
      const monsterPayload = {
        id: monster?.id,
        name: monster?.name || 'Unknown Monster',
        width: pos.width || 80,
        height: pos.height || 80,
        x: pos.x,
        y: pos.y
      }

      const animationId = generateUniqueId()
      const newAnimation = {
        id: animationId,
        monster: monsterPayload,
        item: null,
        goldAmount,
        fastMode: activeDropAnimations.value.length >= fastDropAnimationThreshold,
        autoLoot: true
      }

      if (!newAnimation.monster || !newAnimation.monster.id) {
        return null
      }

      activeDropAnimations.value.push(newAnimation)

      return animationId
    } catch (error) {
      console.error('[DungeonDropSystem] 创建金币掉落动画失败:', error)
      return null
    }
  }

  /**
   * 掉落动画完成回调（超时销毁或拾取后触发）
   * 清理活动列表、元数据、组件引用和关联光柱
   * @param {string} animationId - 动画 ID
   */
  const onDropAnimationComplete = (animationId) => {
    try {
      const index = activeDropAnimations.value.findIndex(anim => anim.id === animationId)
      if (index !== -1) {
        activeDropAnimations.value.splice(index, 1)
      }

      awardedDropAnimationIds.delete(animationId)
      dropItemFlowMeta.delete(animationId)
      delete dropAnimationRefsMap.value[animationId]

      // 销毁关联的光柱特效
      const beamId = dropAnimationBeamMap.get(animationId)
      if (beamId) {
        const beamEl = beamEffectRefsMap.value[beamId]
        if (beamEl && typeof beamEl.destroyBeam === 'function') {
          beamEl.destroyBeam()
        }
        dropAnimationBeamMap.delete(animationId)
      }
    } catch (error) {
      console.error('[DungeonDropSystem] 清理掉落动画失败:', error)
    }
  }

  /**
   * 手动/捡宠拾取掉落物
   * 根据掉落物类型（金币/普通物品/稀有物品）调用不同回调
   * @param {string} animationId - 动画 ID
   */
  const onManualPickup = async (animationId) => {
    try {
      if (awardedDropAnimationIds.has(animationId)) {
        return
      }

      const meta = dropItemFlowMeta.get(animationId)
      if (!meta) {
        return
      }

      awardedDropAnimationIds.add(animationId)
      dropItemFlowMeta.delete(animationId)

      // 金币拾取
      if (meta.itemId === 'gold') {
        const goldAmount = Number(meta.quantity) || 0
        if (goldAmount > 0 && typeof onPickupGold === 'function') {
          onPickupGold(goldAmount)
        }
        if (typeof playPickupSound === 'function') {
          playPickupSound('gold')
        }
        return
      }

      // 物品拾取
      const rarity = String(meta.rarity || 'common').toLowerCase()

      // 判断是否为稀有以上品级（需要分配面板）
      const isRareOrAbove = beamEffectRankKeys.has(rarity) ||
        beamEffectRankLabels.has(meta.rarity) ||
        rarity === 'rare' ||
        rarity === 'veryrare' ||
        rarity === 'legendary' ||
        rarity === 'unique' ||
        rarity === 'epic'

      if (isRareOrAbove && typeof onPickupRareItem === 'function') {
        // 稀有/传说/史诗物品 → 显示分配面板
        onPickupRareItem(meta.itemData)
      } else if (typeof onPickupItem === 'function') {
        // 普通/罕见物品 → 直接添加到队长背包
        onPickupItem(meta.itemId, meta.quantity, meta.itemData)
      }

      if (typeof playPickupSound === 'function') {
        playPickupSound('item')
      }
    } catch (error) {
      console.error('[DungeonDropSystem] 拾取掉落物失败:', error)
    }
  }

  /**
   * 设置掉落物的元数据（供拾取时判断物品类型和品级）
   * @param {string} animationId - 动画 ID
   * @param {Object} meta - 元数据 { itemId, quantity, rarity, itemData, rawName, displayName, iconPath }
   */
  const setDropItemMeta = (animationId, meta) => {
    dropItemFlowMeta.set(animationId, meta)
  }

  /**
   * 清理所有掉落动画和光柱特效（退出副本时调用）
   */
  const clearAllDrops = () => {
    activeDropAnimations.value = []
    activeBeamEffects.value = []
    dropAnimationRefsMap.value = {}
    beamEffectRefsMap.value = {}
    dropItemFlowMeta.clear()
    awardedDropAnimationIds.clear()
    dropAnimationBeamMap.clear()
  }

  return {
    // 状态
    activeDropAnimations,
    activeBeamEffects,
    dropAnimationRefsMap,
    beamEffectRefsMap,
    // 方法
    createDropAnimation,
    createGoldDropAnimation,
    onDropAnimationComplete,
    onManualPickup,
    setDropAnimationRef,
    setDropItemMeta,
    setBeamEffectRef,
    onBeamEffectComplete,
    getMonsterScreenPosition,
    clearAllDrops
  }
}
