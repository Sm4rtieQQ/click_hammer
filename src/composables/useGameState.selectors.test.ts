import { describe, expect, it } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

/**
 * De dev-only upgrade 105 kost 1 munt en is daardoor altijd betaalbaar. Deze
 * helper houdt de betaalbaarheidsasserties op de echte catalogusupgrades.
 */
function buyableUpgrades(affordableIds: ReadonlySet<number>): number[] {
  return [...affordableIds].filter((id) => id !== 105).sort((a, b) => a - b)
}

describe('game state selectors', () => {
  it('exposes the initial derived values', () => {
    const {
      clickPower,
      currentUpgradeCosts,
      purchaseCounts,
      affordableUpgradeIds,
      completedProjectIds,
      activeProject,
      activeProjectProgress,
      visibleProjects,
      remainingProjectGoals,
      offeredOrders,
      activeOrder,
    } = useGameState()

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
    expect(affordableUpgradeIds.value).toEqual(new Set())
    expect(completedProjectIds.value).toEqual([])
    expect(activeProject.value?.id).toBe(1)
    expect(activeProjectProgress.value).toBe(0)
    expect(visibleProjects.value.map(({ id }) => id)).toEqual([1])
    expect(remainingProjectGoals.value).toEqual({
      1: 10,
      2: 100_000,
      3: 250_000_000_000,
    })
    expect(offeredOrders.value).toEqual([])
    expect(activeOrder.value).toBeNull()
  })

  it('reacts to purchases, current costs and affordability', () => {
    const {
      gameState,
      clickPower,
      currentUpgradeCosts,
      affordableUpgradeIds,
      buyUpgrade,
    } = useGameState(createTestGameState({ coins: 25 }))

    buyUpgrade(101)

    expect(gameState.upgrades).toEqual([101])
    expect(clickPower.value).toBeCloseTo(1.1, 12)
    expect(currentUpgradeCosts.value[101]).toBe(15)
    expect(buyableUpgrades(affordableUpgradeIds.value)).toEqual([101])

    buyUpgrade(101)

    expect(clickPower.value).toBeCloseTo(1.21, 12)
    expect(currentUpgradeCosts.value[101]).toBe(22)
    expect(buyableUpgrades(affordableUpgradeIds.value)).toEqual([])
  })

  it('reacts when a purchase changes both coins and the next cost', () => {
    const { affordableUpgradeIds, buyUpgrade } = useGameState(
      createTestGameState({ coins: 20 }),
    )

    expect(buyableUpgrades(affordableUpgradeIds.value)).toEqual([101, 102])

    buyUpgrade(101)

    expect(buyableUpgrades(affordableUpgradeIds.value)).toEqual([])
  })

  it('derives completed projects and remaining project goals', () => {
    const {
      completedProjectIds,
      visibleProjects,
      remainingProjectGoals,
      addPoints,
    } = useGameState(createTestGameState({ projectProgress: { 1: 4 } }))

    expect(completedProjectIds.value).toEqual([])
    expect(visibleProjects.value.map(({ id }) => id)).toEqual([1])
    expect(remainingProjectGoals.value[1]).toBe(6)

    for (let click = 0; click < 6; click += 1) {
      addPoints('project')
    }

    expect(completedProjectIds.value).toEqual([1])
    expect(visibleProjects.value.map(({ id }) => id)).toEqual([1, 2])
    expect(remainingProjectGoals.value).toEqual({
      1: 0,
      2: 100_000,
      3: 250_000_000_000,
    })
  })

  it('derives all remaining goals from supplied state', () => {
    const { completedProjectIds, visibleProjects, remainingProjectGoals } =
      useGameState(
        createTestGameState({
          points: 25_000_000,
          completedProjects: [1, 2],
          projectProgress: { 1: 10, 2: 100_000 },
        }),
      )

    expect(completedProjectIds.value).toEqual([1, 2])
    expect(visibleProjects.value.map(({ id }) => id)).toEqual([1, 2, 3])
    expect(remainingProjectGoals.value).toEqual({
      1: 0,
      2: 0,
      3: 250_000_000_000,
    })
  })
})
