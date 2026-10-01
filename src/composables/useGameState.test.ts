import { describe, expect, expectTypeOf, it } from 'vitest'
import { isReadonly } from 'vue'
import type { DeepReadonly } from 'vue'
import { createInitialGameState } from '../types/game'
import type { GameState } from '../types/game'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

describe('useGameState', () => {
  it('exposes the initial state without mutating it while reading', () => {
    const {
      gameState,
      addPoints,
      completeProject,
      buyUpgrade,
      resetGameState,
    } = useGameState()

    expect(gameState).toEqual(createInitialGameState())
    expect(gameState).toEqual({
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
    expectTypeOf(gameState).toEqualTypeOf<DeepReadonly<GameState>>()
    expectTypeOf(addPoints).toEqualTypeOf<
      (target?: 'order' | 'project', source?: 'manual' | 'auto') => void
    >()
    expectTypeOf(completeProject).toEqualTypeOf<(projectId: number) => void>()
    expectTypeOf(buyUpgrade).toEqualTypeOf<(id: number) => void>()
    expectTypeOf(resetGameState).toEqualTypeOf<() => void>()
  })

  it('exposes deeply readonly state to consumers', () => {
    const { gameState } = useGameState()

    expect(isReadonly(gameState)).toBe(true)
    expect(isReadonly(gameState.completedProjects)).toBe(true)
    expect(isReadonly(gameState.upgrades)).toBe(true)
    expect(isReadonly(gameState.projectProgress)).toBe(true)
  })

  it('creates one independent state per composable instance', () => {
    const firstGame = useGameState()
    const secondGame = useGameState()

    expect(firstGame.gameState).not.toBe(secondGame.gameState)
    expect(firstGame.gameState.completedProjects).not.toBe(
      secondGame.gameState.completedProjects,
    )
    expect(firstGame.gameState.upgrades).not.toBe(secondGame.gameState.upgrades)
    expect(firstGame.gameState.projectProgress).not.toBe(
      secondGame.gameState.projectProgress,
    )
  })

  it('normalizes and clones supplied initial state', () => {
    const initialState = createInitialGameState()
    initialState.points = 4

    const { gameState } = useGameState(initialState)
    initialState.points = 99
    initialState.completedProjects.push(1)

    expect(gameState.points).toBe(4)
    expect(gameState.completedProjects).toEqual([])
  })

  it('resets all state and derived values to the initial state', () => {
    const {
      gameState,
      clickPower,
      currentUpgradeCosts,
      purchaseCounts,
      activeProject,
      activeProjectProgress,
      completedProjectIds,
      remainingProjectGoals,
      resetGameState,
    } = useGameState(
      createTestGameState({
        points: 30,
        coins: 10,
        completedProjects: [1],
        upgrades: [101, 101],
        projectProgress: { 1: 10 },
      }),
    )

    resetGameState()

    expect(gameState).toEqual(createInitialGameState())
    expect(clickPower.value).toBe(1)
    expect(currentUpgradeCosts.value).toEqual({
      101: 10,
      102: 20,
      103: 40,
      104: 50,
      105: 1,
    })
    expect(purchaseCounts.value).toEqual({
      101: 0,
      102: 0,
      103: 0,
      104: 0,
      105: 0,
    })
    expect(completedProjectIds.value).toEqual([])
    expect(activeProject.value?.id).toBe(1)
    expect(activeProjectProgress.value).toBe(0)
    expect(remainingProjectGoals.value).toEqual({
      1: 10,
      2: 100_000,
      3: 250_000_000_000,
    })
  })

  it('starts safely from corrupt initial input', () => {
    const { gameState } = useGameState({
      points: -10,
      coins: Number.NaN,
      completedProjects: [999, 1, 1],
      upgrades: [101, 999],
      projectProgress: { 1: 100 },
    })

    expect(gameState).toEqual(createInitialGameState())
  })
})
