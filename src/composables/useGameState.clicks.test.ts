import { describe, expect, it } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import type { GameState, Upgrade } from '../types/game'
import { getOrderDefinition, createWorkOrder } from '../data/orders'
import {
  calculateClickPower,
  useGameState,
} from './useGameState'

const zeroBonusUpgrade: Upgrade = {
  id: 901,
  name: 'Zero bonus upgrade',
  description: 'A typed upgrade fixture with no click bonus.',
  baseCost: 1,
  costMultiplier: 2,
  clickBonus: 0,
}

function createOrderGame(overrides: Partial<GameState> = {}) {
  const definition = getOrderDefinition(1, 1)

  if (definition === undefined) {
    throw new Error('Missing test order definition')
  }

  const activeOrder = createWorkOrder(1, definition, 0)

  return useGameState(
    createTestGameState({
      completedProjects: [1],
      projectProgress: { 1: 10 },
      nextOrderId: 2,
      activeOrder,
      ...overrides,
    }),
  )
}

describe('calculateClickPower', () => {
  it('starts at one and applies every bonus multiplicatively', () => {
    expect(calculateClickPower([])).toBe(1)
    expect(calculateClickPower([zeroBonusUpgrade])).toBe(1)

    const tenPercentUpgrade: Upgrade = {
      ...zeroBonusUpgrade,
      id: 902,
      clickBonus: 10,
    }

    expect(calculateClickPower([tenPercentUpgrade])).toBeCloseTo(1.1, 12)
    expect(calculateClickPower([tenPercentUpgrade, tenPercentUpgrade])).toBeCloseTo(
      1.21,
      12,
    )
  })

  it('does not add percentages together', () => {
    const tenPercentUpgrade: Upgrade = {
      ...zeroBonusUpgrade,
      id: 902,
      clickBonus: 10,
    }
    const twentyPercentUpgrade: Upgrade = {
      ...zeroBonusUpgrade,
      id: 903,
      clickBonus: 20,
    }

    expect(calculateClickPower([tenPercentUpgrade, twentyPercentUpgrade])).toBeCloseTo(
      1.32,
      12,
    )
    expect(calculateClickPower([tenPercentUpgrade, twentyPercentUpgrade])).not.toBe(1.3)
  })
})

describe('addPoints', () => {
  it('adds no points before any click', () => {
    const { gameState } = useGameState()

    expect(gameState.points).toBe(0)
  })

  it('adds exactly one point for one order click', () => {
    const { gameState, addPoints } = createOrderGame()

    addPoints('order')

    expect(gameState.points).toBe(1)
  })

  it('adds the base click power for multiple order clicks', () => {
    const { gameState, addPoints } = createOrderGame()

    addPoints('order')
    addPoints('order')
    addPoints('order')

    expect(gameState.points).toBe(3)
  })

  it('adds 1.21 points for two purchases of a ten-percent upgrade', () => {
    const { gameState, addPoints } = createOrderGame({ upgrades: [101, 101] })

    addPoints('order')

    expect(gameState.points).toBeCloseTo(1.21, 12)
    expect(gameState.points).not.toBe(2.1)
  })

  it('resolves every purchased upgrade occurrence from the catalog', () => {
    const { gameState, addPoints } = createOrderGame({ upgrades: [101, 102] })

    addPoints('order')

    expect(gameState.points).toBeCloseTo(1.265, 12)
  })

  it('ignores unknown and invalid upgrade IDs through normalization', () => {
    const { gameState, addPoints } = createOrderGame({
      upgrades: [999, Number.NaN, '101', 101] as number[],
    })

    addPoints('order')

    expect(gameState.upgrades).toEqual([101])
    expect(gameState.points).toBeCloseTo(1.1, 12)
  })

  it('blocks a click that would make the score non-finite', () => {
    const overflowingUpgrades = Array.from({ length: 10_000 }, () => 101)
    const { gameState, addPoints } = createOrderGame({
      points: 7,
      upgrades: overflowingUpgrades,
    })

    expect(() => addPoints('order')).not.toThrow()
    expect(gameState.points).toBe(7)
    expect(Number.isFinite(gameState.points)).toBe(true)
  })
})
