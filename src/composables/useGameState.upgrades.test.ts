import { describe, expect, it } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

describe('buyUpgrade', () => {
  it('buys the first upgrade for its exact base cost', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 10 }),
    )

    buyUpgrade(101)

    expect(gameState.coins).toBe(0)
    expect(gameState.upgrades).toEqual([101])
  })

  it('uses a higher cost for each repeated purchase', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 25 }),
    )

    buyUpgrade(101)
    expect(gameState.coins).toBe(15)
    expect(gameState.upgrades).toEqual([101])

    buyUpgrade(101)
    expect(gameState.coins).toBe(0)
    expect(gameState.upgrades).toEqual([101, 101])
  })

  it('does not mutate state when the player has insufficient coins', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 9, points: 3, projectProgress: { 1: 3 } }),
    )
    const stateBeforePurchase = {
      points: 3,
      coins: 9,
      completedProjects: [],
      upgrades: [],
      projectProgress: { 1: 3 },
    }

    buyUpgrade(101)

    expect(gameState.coins).toBe(9)
    expect(gameState.upgrades).toEqual([])
    expect(stateBeforePurchase).toEqual({
      points: 3,
      coins: 9,
      completedProjects: [],
      upgrades: [],
      projectProgress: { 1: 3 },
    })
  })

  it('ignores unknown upgrade IDs without mutation', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 100 }),
    )

    buyUpgrade(999)
    buyUpgrade(Number.NaN)

    expect(gameState.coins).toBe(100)
    expect(gameState.upgrades).toEqual([])
  })

  it('never creates a negative coin balance or changes project progress', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 1, projectProgress: { 1: 7 } }),
    )

    buyUpgrade(101)
    buyUpgrade(102)
    buyUpgrade(103)

    expect(gameState.coins).toBe(1)
    expect(gameState.upgrades).toEqual([])
    expect(gameState.projectProgress).toEqual({ 1: 7 })
  })

  it('keeps different upgrade purchases independent', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 30 }),
    )

    buyUpgrade(101)
    buyUpgrade(102)

    expect(gameState.coins).toBe(0)
    expect(gameState.upgrades).toEqual([101, 102])
  })
})
