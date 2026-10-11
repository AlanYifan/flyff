/**
 * 终极武器强化模拟 - 多方案对比
 * 目标：找到平均强化次数在 150~200 次之间的参数配置
 */

// === 当前配置 ===
const CURRENT = {
  successRate: { 1:90, 2:80, 3:70, 4:60, 5:50, 6:25, 7:15, 8:10, 9:5, 10:2.5 },
  successIncrease: [{level:1,weight:50},{level:2,weight:40},{level:3,weight:30},{level:4,weight:20},{level:5,weight:10}],
  failDecrease: [{level:1,weight:50},{level:2,weight:25},{level:3,weight:10}]
}

// === 方案A：成功只+1级（移除跳级） ===
const OPTION_A = {
  ...CURRENT,
  successIncrease: [{level:1,weight:100}]
}

// === 方案B：成功+1或+2（减少跳级幅度） ===
const OPTION_B = {
  ...CURRENT,
  successIncrease: [{level:1,weight:70},{level:2,weight:30}]
}

// === 方案C：降低高等级成功率 ===
const OPTION_C = {
  successRate: { 1:90, 2:80, 3:70, 4:60, 5:50, 6:20, 7:10, 8:6, 9:3, 10:1.5 },
  successIncrease: [{level:1,weight:50},{level:2,weight:40},{level:3,weight:30},{level:4,weight:20},{level:5,weight:10}],
  failDecrease: [{level:1,weight:50},{level:2,weight:25},{level:3,weight:10}]
}

// === 方案D：成功+1或+2 + 略降高等级成功率 ===
const OPTION_D = {
  successRate: { 1:90, 2:80, 3:70, 4:55, 5:45, 6:20, 7:12, 8:8, 9:4, 10:2 },
  successIncrease: [{level:1,weight:70},{level:2,weight:30}],
  failDecrease: [{level:1,weight:50},{level:2,weight:25},{level:3,weight:10}]
}

// === 方案E：成功+1或+2 + 失败掉更多 ===
const OPTION_E = {
  ...CURRENT,
  successIncrease: [{level:1,weight:70},{level:2,weight:30}],
  failDecrease: [{level:1,weight:40},{level:2,weight:35},{level:3,weight:25}]
}

// === 方案F：成功+1或+2 + 降低6-10级成功率 + 失败掉更多 ===
const OPTION_F = {
  successRate: { 1:90, 2:80, 3:70, 4:55, 5:45, 6:18, 7:10, 8:6, 9:3, 10:1.5 },
  successIncrease: [{level:1,weight:70},{level:2,weight:30}],
  failDecrease: [{level:1,weight:40},{level:2,weight:35},{level:3,weight:25}]
}

function pickWeighted(weights) {
  const total = weights.reduce((s, i) => s + i.weight, 0)
  let roll = Math.random() * total
  for (const item of weights) {
    if (roll <= item.weight) return item.level
    roll -= item.weight
  }
  return weights[weights.length - 1].level
}

function simulate(config, rounds = 100000) {
  let totalAttempts = 0
  let totalSuccess = 0
  let totalFail = 0
  const allAttempts = []

  for (let i = 0; i < rounds; i++) {
    let level = 0
    let attempts = 0

    while (level < 10 && attempts < 500000) {
      attempts++
      const targetLevel = level + 1
      const rate = config.successRate[targetLevel] || 0
      const isSuccess = Math.random() * 100 < rate

      if (isSuccess) {
        totalSuccess++
        const inc = pickWeighted(config.successIncrease)
        level = Math.min(10, level + inc)
      } else {
        totalFail++
        const dec = pickWeighted(config.failDecrease)
        level = Math.max(0, level - dec)
      }
    }
    totalAttempts += attempts
    allAttempts.push(attempts)
  }

  allAttempts.sort((a, b) => a - b)
  const avg = totalAttempts / rounds
  const median = allAttempts[Math.floor(rounds * 0.5)]
  const p90 = allAttempts[Math.floor(rounds * 0.9)]
  const p95 = allAttempts[Math.floor(rounds * 0.95)]

  return {
    avg: avg.toFixed(1),
    median,
    p90,
    p95,
    successRate: (totalSuccess / totalAttempts * 100).toFixed(1),
    min: allAttempts[0],
    max: allAttempts[rounds - 1]
  }
}

const configs = [
  { name: '当前配置', config: CURRENT },
  { name: '方案A: 成功只+1级', config: OPTION_A },
  { name: '方案B: 成功+1或+2(7:3)', config: OPTION_B },
  { name: '方案C: 降低高等级成功率', config: OPTION_C },
  { name: '方案D: +1或+2 + 略降成功率', config: OPTION_D },
  { name: '方案E: +1或+2 + 失败掉更多', config: OPTION_E },
  { name: '方案F: +1或+2 + 降成功率 + 掉更多', config: OPTION_F },
]

console.log('='.repeat(90))
console.log('终极武器强化模拟 - 多方案对比（10万次/方案）')
console.log('目标：平均强化次数 150~200 次')
console.log('='.repeat(90))
console.log()

for (const { name, config } of configs) {
  const r = simulate(config, 100000)
  const hit = parseFloat(r.avg) >= 150 && parseFloat(r.avg) <= 200
  const marker = hit ? ' ✓ 命中目标' : ''
  console.log(`【${name}】${marker}`)
  console.log(`  成功率表: ${JSON.stringify(config.successRate)}`)
  console.log(`  成功提升: ${config.successIncrease.map(i => `+${i.level}(${i.weight})`).join(' ')}`)
  console.log(`  失败下降: ${config.failDecrease.map(i => `-${i.level}(${i.weight})`).join(' ')}`)
  console.log(`  ────────────────────────────────────────`)
  console.log(`  平均: ${r.avg} 次 | 中位数: ${r.median} | P90: ${r.p90} | P95: ${r.p95}`)
  console.log(`  综合成功率: ${r.successRate}% | 最少: ${r.min} | 最多: ${r.max}`)
  console.log()
}
