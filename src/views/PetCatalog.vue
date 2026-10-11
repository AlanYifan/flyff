<template>
  <div class="pet-catalog">
    <div class="pet-catalog-inner">
      <header class="page-header">
        <div class="title-block">
          <h1>宠物信息图鉴</h1>
          <p>依据 PET_TYPE 数据展示宠物完整信息与成长配置</p>
        </div>
        <button class="back-button" @click="goBack">返回</button>
      </header>

      <section class="pet-grid">
        <article v-for="pet in petTypes" :key="pet.petItemId" class="pet-card">
          <div class="pet-head">
            <div class="pet-icon">
              <img :src="getItemIconPath(pet.petItemId)" :alt="resolveItemName(pet.petItemId)" />
            </div>
            <div class="pet-summary">
              <div class="pet-title">
                <span class="pet-name">{{ resolveItemName(pet.petItemId) }}</span>
                <span class="pet-id">ID: {{ pet.petItemId }}</span>
              </div>
              <div class="pet-meta">
                <div>属性：{{ resolveParameterLabel(pet.parameter) }}</div>
                <div>比例：{{ pet.rate ? '是' : '否' }}</div>
              </div>
              <div v-if="pet.values && pet.values.length" class="pet-values">
                <span
                  v-for="(value, index) in pet.values"
                  :key="`${pet.petItemId}-value-${index}`"
                  class="value-chip"
                >
                  {{ formatValue(value, pet.rate) }}
                </span>
              </div>
              <div v-else class="pet-values empty">无成长数值</div>
            </div>
          </div>

          <div class="tier-list">
            <div class="tier-header">
              <span>阶段</span>
              <span>能量上限</span>
              <span>经验</span>
              <span>所需糖果</span>
              <span>祝福技能</span>
              <span>冷却</span>
              <span>等级</span>
              <span>持续</span>
              <span>消耗</span>
            </div>
            <div v-for="(tier, index) in pet.tiers" :key="`${pet.petItemId}-tier-${index}`" class="tier-row">
              <span>{{ index + 1 }}</span>
              <span>{{ formatNumber(tier.maxEnergy) }}</span>
              <span>{{ formatNumber(tier.exp) }}</span>
              <span class="tier-candy">
                <img
                  :src="getItemIconPath(tier.requiredCandyItem)"
                  :alt="resolveItemName(tier.requiredCandyItem)"
                />
                <span>{{ formatNumber(tier.requiredCandyItem) }}</span>
              </span>
              <span>{{ formatNumber(tier.graceSkill) }}</span>
              <span>{{ formatNumber(tier.graceSkillCooldown) }}</span>
              <span>{{ formatNumber(tier.graceSkillLevel) }}</span>
              <span>{{ formatNumber(tier.graceSkillDuration) }}</span>
              <span>{{ formatNumber(tier.graceSkillEnergyConsumption) }}</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePetsStore } from '@/store/pets'
import { getItemName } from '@/utils/itemUtils'
import { ATTRIBUTE_NAMES } from '@/store/descriptions'

const router = useRouter()
const petsStore = usePetsStore()

const petTypes = computed(() => petsStore.petTypes || [])

const togglePetsScroll = enabled => {
  if (typeof document === 'undefined') {
    return
  }
  const classList = ['pets-scroll']
  const html = document.documentElement
  const body = document.body
  const app = document.getElementById('app')
  classList.forEach(className => {
    if (enabled) {
      html?.classList.add(className)
      body?.classList.add(className)
      app?.classList.add(className)
    } else {
      html?.classList.remove(className)
      body?.classList.remove(className)
      app?.classList.remove(className)
    }
  })
}

const parameterLabelMap = ATTRIBUTE_NAMES

const goBack = () => {
  router.back()
}

const resolveParameterLabel = parameter => {
  if (!parameter) {
    return '未知'
  }
  return parameterLabelMap[parameter] || parameter
}

const formatValue = (value, isRate) => {
  if (!Number.isFinite(value)) {
    return '-'
  }
  return isRate ? `${value}%` : value
}

const formatNumber = value => {
  if (value === 0) {
    return 0
  }
  if (!value && value !== 0) {
    return '-'
  }
  return value
}

const getItemIconPath = itemId => {
  if (!itemId && itemId !== 0) {
    return '/pt/item_icon/default_item.png'
  }
  return `/pt/item_icon/${itemId}.png`
}

const resolveItemName = itemId => {
  if (!itemId && itemId !== 0) {
    return '未知物品'
  }
  const name = getItemName(itemId)
  return name || `物品ID: ${itemId}`
}

onMounted(() => {
  togglePetsScroll(true)
})

onUnmounted(() => {
  togglePetsScroll(false)
})
</script>

<style scoped>
.pet-catalog {
  min-height: 100vh;
  height: 100vh;
  padding: 32px 40px 60px;
  background: #07090f;
  color: #f3f4ff;
  display: flex;
  justify-content: center;
  overflow-y: auto;
}

.pet-catalog-inner {
  width: 100%;
  max-width: 1200px;
}
:global(html.pets-scroll),
:global(body.pets-scroll),
:global(#app.pets-scroll) {
  overflow-y: auto;
  overflow-x: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.title-block h1 {
  margin: 0 0 8px;
  font-size: 32px;
  letter-spacing: 1px;
}

.title-block p {
  margin: 0;
  color: #b7b9d6;
}

.back-button {
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: #f7f7ff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
}

.pet-grid {
  display: grid;
  gap: 24px;
}

.pet-card {
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(16, 18, 33, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
}

.pet-head {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.pet-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pet-icon img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.pet-summary {
  flex: 1;
}

.pet-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
}

.pet-name {
  font-size: 20px;
  font-weight: 600;
}

.pet-id {
  color: #9aa0c5;
  font-size: 13px;
}

.pet-meta {
  display: flex;
  gap: 16px;
  color: #c7cbef;
  margin-bottom: 8px;
}

.pet-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pet-values.empty {
  color: #8d93b8;
}

.value-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(88, 92, 140, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.tier-list {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.tier-header,
.tier-row {
  display: grid;
  grid-template-columns: 60px 90px 70px 140px 90px 70px 70px 70px 70px;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.tier-header {
  color: #9da4cb;
  font-weight: 600;
  margin-bottom: 8px;
}

.tier-row {
  padding: 8px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
}

.tier-row:last-child {
  border-bottom: none;
}

.tier-candy {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tier-candy img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
</style>
