import { describe, expect, it } from 'vitest'
import type { Upgrade } from '../types/game'
import { getUpgradeCost } from './useGameState'

const upgrade: Upgrade = {
  id: 101,
  name: 'Test upgrade',
  description: 'A deterministic upgrade cost fixture.',
  baseCost: 10,
  costMultiplier: 1.5,
  clickBonus: 10,
}

describe('getUpgradeCost', () => {
  it('returns the base cost for zero purchases', () => {
    expect(getUpgradeCost(upgrade, 0)).toBe(10)
  })

  it('uses the multiplicative cost formula for multiple purchases', () => {
    expect(getUpgradeCost(upgrade, 1)).toBe(15)
    expect(getUpgradeCost(upgrade, 2)).toBe(22)
    expect(getUpgradeCost(upgrade, 3)).toBe(33)
  })

  it('supports decimal base costs and purchase counts deterministically', () => {
    expect(
      getUpgradeCost({ ...upgrade, baseCost: 10.75 }, 2),
    ).toBe(24)
    expect(getUpgradeCost(upgrade, 0.5)).toBe(12)
  })

  it('caps very large costs at the largest safe integer', () => {
    expect(getUpgradeCost(upgrade, 10_000)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('returns the minimum cost for an invalid multiplier', () => {
    expect(getUpgradeCost({ ...upgrade, costMultiplier: 0 }, 1)).toBe(1)
    expect(getUpgradeCost({ ...upgrade, costMultiplier: -2 }, 1)).toBe(1)
    expect(getUpgradeCost({ ...upgrade, costMultiplier: Number.NaN }, 1)).toBe(1)
    expect(
      getUpgradeCost({ ...upgrade, costMultiplier: Number.POSITIVE_INFINITY }, 1),
    ).toBe(1)
  })

  it('handles invalid purchase counts without creating a discounted cost', () => {
    expect(getUpgradeCost(upgrade, -1)).toBe(10)
    expect(getUpgradeCost(upgrade, Number.NaN)).toBe(10)
  })

  it('does not mutate the upgrade or depend on previous calls', () => {
    const input: Upgrade = { ...upgrade }

    expect(getUpgradeCost(input, 2)).toBe(22)
    expect(getUpgradeCost(input, 2)).toBe(22)
    expect(input).toEqual(upgrade)
  })
})
