export function formatGold4 (value) {
  const gold = Number(value || 0)
  return gold.toString().replace(/\B(?=(\d{4})+(?!\d))/g, ',')
}

export function getGoldValueTier (value) {
  const gold = Number(value || 0)
  if (gold >= 1e10) {
    return 7
  }
  if (gold >= 1e9) {
    return 6
  }
  if (gold >= 1e8) {
    return 5
  }
  if (gold >= 1e7) {
    return 4
  }
  if (gold >= 1e6) {
    return 3
  }
  if (gold >= 1e5) {
    return 2
  }
  return 1
}

export function getGoldValueClass (value) {
  return `gold-value-${getGoldValueTier(value)}`
}
