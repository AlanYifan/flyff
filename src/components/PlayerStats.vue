<template>
  <div class="stats-section">
    <!-- 基础属性组 -->
    <div class="stats-group basic-stats">
      <h3>基础属性</h3>
      <div class="stat-item">
        <span class="stat-label">等级：</span>
        <span class="stat-value">{{ playerStats.level }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大生命值：</span>
        <span class="stat-value">{{ playerStats.maxHealth }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">最大魔法值：</span>
        <span class="stat-value">{{ playerStats.maxMana }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">攻击力：</span>
        <span class="stat-value">{{ playerStats.minAttack }}~{{ playerStats.maxAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">防御力：</span>
        <span class="stat-value">{{ playerStats.minDefense }}~{{ playerStats.maxDefense }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">魔法防御：</span>
        <span class="stat-value">{{ playerStats.magicDefense }}</span>
      </div>
    </div>

    <!-- 战斗属性组 -->
    <div class="stats-group combat-stats">
      <h3>战斗属性</h3>
      <div class="stat-item">
        <span class="stat-label">命中率：</span>
        <span class="stat-value">{{ playerStats.hitRate }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">闪避率：</span>
        <span class="stat-value">{{ playerStats.dodgeRate }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">格挡率：</span>
        <span class="stat-value">{{ playerStats.blockRate }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">暴击率：</span>
        <span class="stat-value">{{ playerStats.criticalRate }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">暴击伤害：</span>
        <span class="stat-value">{{ playerStats.criticalDamage }}%</span>
      </div>
    </div>

    <!-- 特殊效果组 -->
    <div class="stats-group effect-stats">
      <h3>特殊效果</h3>
      <div class="stat-item">
        <span class="stat-label">攻击速度：</span>
        <span class="stat-value">{{ playerStats.attackSpeed }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">施法速度：</span>
        <span class="stat-value">{{ playerStats.castingTime }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">治疗效果：</span>
        <span class="stat-value">{{ playerStats.healPercent }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">吸血：</span>
        <span class="stat-value">{{ playerStats.lifeStealing }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">眩晕：</span>
        <span class="stat-value">{{ playerStats.stun }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">格挡穿透：</span>
        <span class="stat-value">{{ playerStats.blockPenetration }}%</span>
      </div>
    </div>

    <!-- 武器属性组 -->
    <div class="stats-group weapon-stats">
      <h3>武器属性</h3>
      <div class="stat-item">
        <span class="stat-label">弓箭攻击力：</span>
        <span class="stat-value">{{ playerStats.bowAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">飞轮攻击力：</span>
        <span class="stat-value">{{ playerStats.yoyoAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">斧攻击力：</span>
        <span class="stat-value">{{ playerStats.axeAttack }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">剑攻击力：</span>
        <span class="stat-value">{{ playerStats.swordAttack }}</span>
      </div>
    </div>

    <!-- 元素属性组 -->
    <div class="stats-group element-stats">
      <h3>元素属性</h3>
      <div class="stat-item">
        <img src="/pt/element/fire_火.png" alt="火" class="element-icon" />
        <span class="stat-label">火：</span>
        <span class="stat-value">{{ playerStats.fireAttack }}%</span>
      </div>
      <div class="stat-item">
        <img src="/pt/element/water_水.png" alt="水" class="element-icon" />
        <span class="stat-label">水：</span>
        <span class="stat-value">{{ playerStats.waterAttack }}%</span>
      </div>
      <div class="stat-item">
        <img src="/pt/element/wind_风.png" alt="风" class="element-icon" />
        <span class="stat-label">风：</span>
        <span class="stat-value">{{ playerStats.windAttack }}%</span>
      </div>
      <div class="stat-item">
        <img src="/pt/element/electricity_雷.png" alt="雷" class="element-icon" />
        <span class="stat-label">雷：</span>
        <span class="stat-value">{{ playerStats.thunderAttack }}%</span>
      </div>
      <div class="stat-item">
        <img src="/pt/element/earth_土.png" alt="土" class="element-icon" />
        <span class="stat-label">土：</span>
        <span class="stat-value">{{ playerStats.earthAttack }}%</span>
      </div>
    </div>

    <!-- 技能属性组 -->
    <div class="stats-group skill-stats">
      <h3>技能属性</h3>
      <div class="stat-item">
        <span class="stat-label">技能伤害：</span>
        <span class="stat-value">{{ playerStats.skillDamage }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">MP消耗减少：</span>
        <span class="stat-value">{{ playerStats.mpReduction }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">FP消耗减少：</span>
        <span class="stat-value">{{ playerStats.fpReduction }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">击杀MP恢复：</span>
        <span class="stat-value">{{ playerStats.mpRecoveryAfterKill }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerStats',
  props: {
    player: {
      type: Object,
      required: true
    },
    playerStats: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
  /* 这里的样式将从主样式表继承 */
</style>
