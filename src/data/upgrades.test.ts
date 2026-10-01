import { describe, expect, it } from 'vitest'
import { upgrades } from './upgrades'

describe('upgrades', () => {
  it('contains the planned upgrades in order', () => {
    expect(upgrades.map(({ id }) => id)).toEqual([101, 102, 103])
    expect(upgrades.map(({ name }) => name)).toEqual([
      'Sterkere hamer',
      'Geborgen hout',
      'Vuur van de meester',
    ])
  })

  it('has unique numeric IDs and valid progression values', () => {
    const upgradeIds = upgrades.map(({ id }) => id)

    expect(upgrades.length).toBeGreaterThanOrEqual(3)
    expect(new Set(upgradeIds).size).toBe(upgrades.length)
    expect(upgradeIds.every((id) => Number.isInteger(id) && id > 0)).toBe(true)

    for (const upgrade of upgrades) {
      expect(upgrade.name).toMatch(/^[A-Z]/)
      expect(upgrade.name).toBe(upgrade.name.trim())
      expect(upgrade.name.slice(1)).toBe(upgrade.name.slice(1).toLowerCase())
      expect(upgrade.description).toMatch(/^[A-Z]/)
      expect(upgrade.description).toBe(upgrade.description.trim())
      expect(Number.isFinite(upgrade.baseCost)).toBe(true)
      expect(upgrade.baseCost).toBeGreaterThan(0)
      expect(Number.isFinite(upgrade.costMultiplier)).toBe(true)
      expect(upgrade.costMultiplier).toBeGreaterThan(1)
      expect(Number.isFinite(upgrade.clickBonus)).toBe(true)
      expect(upgrade.clickBonus).toBeGreaterThanOrEqual(0)
    }
  })

  it('interprets clickBonus as a percentage multiplier', () => {
    const clickMultipliers = upgrades.map(({ clickBonus }) => 1 + clickBonus / 100)

    expect(clickMultipliers).toEqual([1.1, 1.15, 1.25])
  })

  it.each([
    { id: 101, expectedFirstCost: 10 },
    { id: 102, expectedFirstCost: 20 },
    { id: 103, expectedFirstCost: 40 },
  ])('calculates the first cost for upgrade $id as $expectedFirstCost', ({ id, expectedFirstCost }) => {
    const upgrade = upgrades.find((candidate) => candidate.id === id)

    expect(upgrade).toBeDefined()

    if (upgrade === undefined) {
      return
    }

    const purchaseCount = 0
    const firstCost = Math.max(
      1,
      Math.floor(upgrade.baseCost * upgrade.costMultiplier ** purchaseCount),
    )

    expect(firstCost).toBe(expectedFirstCost)
  })
})
