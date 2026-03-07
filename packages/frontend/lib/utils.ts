export function formatCurrency(value: number, decimals = 2): string {
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(decimals)}B`
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(decimals)}M`
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(decimals)}K`
  }
  return `$${value.toFixed(decimals)}`
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}
