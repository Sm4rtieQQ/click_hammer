import { describe, expect, it } from 'vitest'
import { items } from './items'
import { materials } from './materials'
import {
  createOfferedOrders,
  createWorkOrder,
  formatOrderCommand,
  getOfferedOrderDefinitions,
  getOrderDefinition,
  getOrderQuantity,
  getOrderUnlockPoints,
  orderDefinitions,
} from './orders'

function requireOrderDefinition(materialId: number, itemId: number) {
  const definition = getOrderDefinition(materialId, itemId)

  if (definition === undefined) {
    throw new Error('Missing order definition in test catalog')
  }

  return definition
}

describe('order catalogs', () => {
  it('keeps the requested material and item order', () => {
    expect(materials.map(({ name }) => name)).toEqual([
      'Brons',
      'IJzer',
      'Staal',
      'Verzilverd',
      'Verguld',
    ])
    expect(items.map(({ name }) => name)).toEqual([
      'hoefijzers',
      'klinknagels',
      'pijlpunten',
      'bijlen',
      'schilden',
      'dolken',
      'speren',
      'zwaarden',
      'helmen',
      'harnassen',
    ])
  })

  it('contains every material-item combination with unique ranks', () => {
    expect(orderDefinitions).toHaveLength(50)
    expect(new Set(orderDefinitions.map(({ unlockRank }) => unlockRank)).size).toBe(50)
    expect(orderDefinitions.map(({ unlockRank }) => unlockRank).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, index) => index),
    )

    const combinations = new Set(
      orderDefinitions.map(
        ({ materialId, itemId }) => `${materialId}:${itemId}`,
      ),
    )
    expect(combinations.size).toBe(50)
  })

  it('places the requested cross-material unlocks in the required order', () => {
    const ironHarness = getOrderDefinition(2, 10)
    const gildedHorseshoe = getOrderDefinition(5, 1)
    const gildedAxe = getOrderDefinition(5, 4)
    const silverHarness = getOrderDefinition(4, 10)

    expect(ironHarness).toBeDefined()
    expect(gildedHorseshoe).toBeDefined()
    expect(gildedAxe).toBeDefined()
    expect(silverHarness).toBeDefined()
    expect(ironHarness?.unlockRank).toBeLessThan(
      gildedHorseshoe?.unlockRank ?? Number.MAX_SAFE_INTEGER,
    )
    expect(gildedAxe?.unlockRank).toBeLessThan(
      silverHarness?.unlockRank ?? Number.MAX_SAFE_INTEGER,
    )
  })

  it('uses exponential unlock points and the requested early options', () => {
    expect(getOrderUnlockPoints(0)).toBe(0)
    expect(getOrderUnlockPoints(1)).toBe(0)
    expect(getOrderUnlockPoints(2)).toBe(50)
    expect(getOrderUnlockPoints(3)).toBeGreaterThan(
      getOrderUnlockPoints(2),
    )
    expect(getOfferedOrderDefinitions(0).map(({ itemId }) => itemId)).toEqual([
      2, 1,
    ])
  })

  it('grows quantities progressively and caps them at ten thousand', () => {
    expect(getOrderQuantity(0)).toBe(10)
    expect(getOrderQuantity(1)).toBe(14)
    expect(getOrderQuantity(10)).toBeGreaterThan(getOrderQuantity(0))
    expect(getOrderQuantity(100)).toBe(10_000)
  })

  it('calculates order cost and reward from material and item multipliers', () => {
    const bronzeHorseshoe = requireOrderDefinition(1, 1)
    const gildedHarness = requireOrderDefinition(5, 10)

    expect(
      createWorkOrder(1, bronzeHorseshoe, 0),
    ).toMatchObject({
      quantity: 10,
      requiredPoints: 10,
      coinReward: 10,
    })
    expect(
      createWorkOrder(2, gildedHarness, 100),
    ).toMatchObject({
      quantity: 10_000,
      requiredPoints: 100_000_000,
      coinReward: 1_280_000,
    })
  })

  it('formats the exact repeatable order command', () => {
    const definition = requireOrderDefinition(5, 10)
    const order = createWorkOrder(1, definition, 100)

    expect(formatOrderCommand(order)).toBe(
      'smeed 10.000 vergulde harnassen',
    )
  })

  it('creates two distinct-item offers', () => {
    const offers = createOfferedOrders(0, 0, 1)

    expect(offers).toHaveLength(2)
    expect(offers[0].itemId).not.toBe(offers[1].itemId)
    expect(offers.map(({ id }) => id)).toEqual([1, 2])
  })
})
