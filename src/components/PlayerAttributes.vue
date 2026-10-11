<template>
  <div class="attribute-section">
    <h3>属性分配</h3>

    <div class="free-points">
      <span class="points-label">自由属性点：</span>
      <span class="points-value">{{ player.stats?.freePoints || 0 }}</span>
    </div>

    <!-- 使用网格布局展示四个属性 -->
    <div class="attributes-grid">
      <div class="attribute-card">
        <div class="attribute-header">
          <div class="attribute-info">
            <span class="attribute-name">力量</span>
            <span class="attribute-value">{{ player.stats?.strength || 1 }}</span>
          </div>
          <span v-if="strengthBonus || setBonuses.strength" class="attribute-bonus">
            +{{ (strengthBonus || 0) + setBonuses.strength }}
          </span>
        </div>
        <div class="attribute-controls">
          <button
            class="btn-increase"
            :disabled="(player.stats?.freePoints || 0) <= 0"
            @click="increaseAttribute('strength')"
          >
            +
          </button>
          <button
            class="btn-decrease"
            :disabled="(player.stats?.strength || 1) <= 1"
            @click="decreaseAttribute('strength')"
          >
            -
          </button>
        </div>
      </div>

      <div class="attribute-card">
        <div class="attribute-header">
          <div class="attribute-info">
            <span class="attribute-name">体质</span>
            <span class="attribute-value">{{ player.stats?.constitution || 1 }}</span>
          </div>
          <span v-if="constitutionBonus || setBonuses.constitution" class="attribute-bonus">
            +{{ (constitutionBonus || 0) + setBonuses.constitution }}
          </span>
        </div>
        <div class="attribute-controls">
          <button
            class="btn-increase"
            :disabled="(player.stats?.freePoints || 0) <= 0"
            @click="increaseAttribute('constitution')"
          >
            +
          </button>
          <button
            class="btn-decrease"
            :disabled="(player.stats?.constitution || 1) <= 1"
            @click="decreaseAttribute('constitution')"
          >
            -
          </button>
        </div>
      </div>

      <div class="attribute-card">
        <div class="attribute-header">
          <div class="attribute-info">
            <span class="attribute-name">智力</span>
            <span class="attribute-value">{{ player.stats?.intelligence || 1 }}</span>
          </div>
          <span v-if="intelligenceBonus || setBonuses.intelligence" class="attribute-bonus">
            +{{ (intelligenceBonus || 0) + setBonuses.intelligence }}
          </span>
        </div>
        <div class="attribute-controls">
          <button
            class="btn-increase"
            :disabled="(player.stats?.freePoints || 0) <= 0"
            @click="increaseAttribute('intelligence')"
          >
            +
          </button>
          <button
            class="btn-decrease"
            :disabled="(player.stats?.intelligence || 1) <= 1"
            @click="decreaseAttribute('intelligence')"
          >
            -
          </button>
        </div>
      </div>

      <div class="attribute-card">
        <div class="attribute-header">
          <div class="attribute-info">
            <span class="attribute-name">敏捷</span>
            <span class="attribute-value">{{ player.stats?.agility || 1 }}</span>
          </div>
          <span v-if="agilityBonus || setBonuses.agility" class="attribute-bonus">
            +{{ (agilityBonus || 0) + setBonuses.agility }}
          </span>
        </div>
        <div class="attribute-controls">
          <button
            class="btn-increase"
            :disabled="(player.stats?.freePoints || 0) <= 0"
            @click="increaseAttribute('agility')"
          >
            +
          </button>
          <button
            class="btn-decrease"
            :disabled="(player.stats?.agility || 1) <= 1"
            @click="decreaseAttribute('agility')"
          >
            -
          </button>
        </div>
      </div>
    </div>

    <button
      class="confirm-btn"
      :disabled="(player.stats?.freePoints || 0) > 0"
      @click="confirmAttributes"
    >
      确认分配
    </button>
  </div>
</template>

<script>
export default {
  name: 'PlayerAttributes',
  props: {
    player: {
      type: Object,
      required: true
    },
    setBonuses: {
      type: Object,
      required: true
    },
    strengthBonus: {
      type: Number,
      default: 0
    },
    constitutionBonus: {
      type: Number,
      default: 0
    },
    intelligenceBonus: {
      type: Number,
      default: 0
    },
    agilityBonus: {
      type: Number,
      default: 0
    }
  },
  emits: ['increase-attribute', 'decrease-attribute', 'confirm-attributes'],
  methods: {
    increaseAttribute (attribute) {
      this.$emit('increase-attribute', attribute)
    },
    decreaseAttribute (attribute) {
      this.$emit('decrease-attribute', attribute)
    },
    confirmAttributes () {
      this.$emit('confirm-attributes')
    }
  }
}
</script>

<style scoped>
  .attribute-section {
    background: rgb(255, 255, 255);
    border-radius: 10px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: 300px;
  }

  .attribute-section h3 {
    color: #000000;
    font-size: 20px;
    margin-bottom: 15px;
    text-align: center;
  }

  .free-points {
    text-align: center;
    padding: 12px;
    background: rgb(134, 134, 134);
    border-radius: 8px;
    border: 1px solid rgba(255, 193, 7, 0.3);
    margin-bottom: 20px;
  }

  .points-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
  }

  .points-value {
    color: #62ff62;
    font-size: 20px;
    font-weight: bold;
    margin-left: 10px;
  }

  .attributes-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 10px;
    margin-bottom: 10px;
  }

  .attribute-card {
    background: gray;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    /* padding: 12px; */
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .attribute-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .attribute-info {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .attribute-name {
    color: #000000;
    font-size: 16px;
    font-weight: bold;
  }

  .attribute-value {
    color: #ffffff;
    font-size: 20px;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
    margin-left: 20px;
  }

  .attribute-bonus {
    color: #28a745;
    font-size: 14px;
    font-weight: bold;
    background: rgba(40, 167, 69, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(40, 167, 69, 0.2);
  }

  .attribute-controls {
    display: flex;
    justify-content: center;
    /* gap: 8px; */
    margin-left: 40px;
    flex-wrap: wrap;
    align-content: center;
  }

  .attribute-controls button {
    width: 32px;
    height: 32px;
    padding: 0;
    background: rgba(74, 158, 255, 0.2);
    border: 1px solid rgba(74, 158, 255, 0.3);
    color: white;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .attribute-controls button:hover:not(:disabled) {
    background: rgba(74, 158, 255, 0.3);
    transform: translateY(-2px);
  }

  .attribute-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-increase {
    background: rgb(2 255 60 / 30%) !important;
    border: 1px solid rgba(40, 167, 69, 0.3) !important;
  }

  .btn-increase:hover:not(:disabled) {
    background: rgba(40, 167, 69, 0.3) !important;
  }

  .btn-decrease {
    background: rgba(220, 53, 69, 0.2) !important;
    border: 1px solid rgba(220, 53, 69, 0.3) !important;
  }

  .btn-decrease:hover:not(:disabled) {
    background: rgba(220, 53, 69, 0.3) !important;
  }

  .confirm-btn {
    width: 100%;
    padding: 10px;
    background: #000000;
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .confirm-btn:hover:not(:disabled) {
    background: linear-gradient(45deg, #6b83ff, #4a9eff);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(74, 158, 255, 0.3);
  }

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .attributes-grid {
      grid-template-columns: 1fr;
    }

    .attribute-header {
      flex-direction: column;
      gap: 5px;
      text-align: center;
    }
  }
</style>
