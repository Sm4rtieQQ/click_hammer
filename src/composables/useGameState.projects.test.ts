import { describe, expect, it } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

describe('project progression', () => {
  it('adds progress to the active project below its target', () => {
    const { gameState, addPoints } = useGameState(createTestGameState())

    for (let click = 0; click < 9; click += 1) {
      addPoints('project')
    }

    expect(gameState.points).toBe(9)
    expect(gameState.projectProgress[1]).toBe(9)
    expect(gameState.completedProjects).toEqual([])
    expect(gameState.coins).toBe(0)
  })

  it('completes the first project without granting coins', () => {
    const { gameState, addPoints } = useGameState(
      createTestGameState({
        points: 9,
        projectProgress: { 1: 9 },
      }),
    )

    addPoints('project')

    expect(gameState.points).toBe(10)
    expect(gameState.projectProgress[1]).toBe(10)
    expect(gameState.completedProjects).toEqual([1])
    expect(gameState.coins).toBe(0)
    expect(gameState.offeredOrders).toHaveLength(2)
  })

  it('caps project progress and keeps overshoot only in total points', () => {
    const { gameState, addPoints } = useGameState(
      createTestGameState({
        points: 9,
        upgrades: [101, 101],
        projectProgress: { 1: 9 },
      }),
    )

    addPoints('project')

    expect(gameState.points).toBeCloseTo(10.21, 12)
    expect(gameState.projectProgress[1]).toBe(10)
    expect(gameState.projectProgress[2]).toBeUndefined()
    expect(gameState.completedProjects).toEqual([1])
    expect(gameState.coins).toBe(0)
  })

  it('never rewards or completes the same project twice', () => {
    const { gameState, completeProject } = useGameState(
      createTestGameState({
        points: 10,
        completedProjects: [1],
        projectProgress: { 1: 10 },
        coins: 0,
      }),
    )

    completeProject(1)

    expect(gameState.points).toBe(10)
    expect(gameState.projectProgress[1]).toBe(10)
    expect(gameState.completedProjects).toEqual([1])
    expect(gameState.coins).toBe(0)
  })

  it('does not progress a locked project', () => {
    const { gameState, addPoints } = useGameState(
      createTestGameState({
        points: 10,
        completedProjects: [1],
        projectProgress: { 1: 10 },
      }),
    )

    addPoints('project')

    expect(gameState.points).toBe(10)
    expect(gameState.projectProgress[2]).toBeUndefined()
  })

  it('only completes the active unlocked project when explicitly requested', () => {
    const { gameState, completeProject } = useGameState(
      createTestGameState({
        points: 10,
        projectProgress: { 1: 10 },
      }),
    )

    completeProject(2)
    expect(gameState.completedProjects).toEqual([])

    completeProject(1)
    expect(gameState.completedProjects).toEqual([1])
    expect(gameState.coins).toBe(0)
  })

  it('ignores completion requests below the target or for unknown IDs', () => {
    const { gameState, completeProject } = useGameState(
      createTestGameState({ projectProgress: { 1: 9 } }),
    )

    completeProject(1)
    completeProject(999)

    expect(gameState.completedProjects).toEqual([])
    expect(gameState.coins).toBe(0)
  })
})
