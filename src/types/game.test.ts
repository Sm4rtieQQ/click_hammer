import { describe, expect, it } from 'vitest'
import { createInitialGameState } from './game'

describe('createInitialGameState', () => {
  it('returns the documented initial values', () => {
    expect(createInitialGameState()).toEqual({
      points: 0,
      coins: 0,
      completedProjects: [],
      upgrades: [],
      projectProgress: {},
      completedOrderCount: 0,
      nextOrderId: 1,
      offeredOrders: [],
      activeOrder: null,
      autoClickerUnlocked: false,
    })
  })

  it('returns independent mutable collections', () => {
    const firstState = createInitialGameState()
    const secondState = createInitialGameState()

    firstState.completedProjects.push(1)
    firstState.upgrades.push(101)
    firstState.projectProgress[1] = 10

    expect(firstState).not.toBe(secondState)
    expect(firstState.completedProjects).not.toBe(secondState.completedProjects)
    expect(firstState.upgrades).not.toBe(secondState.upgrades)
    expect(firstState.projectProgress).not.toBe(secondState.projectProgress)
    expect(secondState.completedProjects).toEqual([])
    expect(secondState.upgrades).toEqual([])
    expect(secondState.projectProgress).toEqual({})
  })
})
