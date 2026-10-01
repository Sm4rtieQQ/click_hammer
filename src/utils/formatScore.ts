const thousand = 1_000
const million = 1_000_000
const compactPromotionThreshold = 999_950

function formatCompactValue(value: number): string {
  const roundedValue = Math.round(value * 10) / 10

  return Number.isInteger(roundedValue)
    ? roundedValue.toString()
    : roundedValue.toFixed(1)
}

export function formatScore(score: number): string {
  if (!Number.isFinite(score)) {
    return '0'
  }

  const roundedScore = Math.round(score)
  const absoluteScore = Math.abs(roundedScore)
  const sign = roundedScore < 0 ? '-' : ''

  if (absoluteScore >= compactPromotionThreshold) {
    return `${sign}${formatCompactValue(absoluteScore / million)}m`
  }

  if (absoluteScore >= thousand) {
    return `${sign}${formatCompactValue(absoluteScore / thousand)}k`
  }

  return `${sign}${absoluteScore}`
}
