import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

const apprenticeUpgradeId = 104

describe('auto-clicker (Leerling)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not tick at all while the upgrade is not bought', () => {
    const { gameState, startAutoClicker } = useGameState(
      createTestGameState({ coins: 50 }),
    )

    startAutoClicker()
    vi.advanceTimersByTime(5000)

    expect(vi.getTimerCount()).toBe(0)
    expect(gameState.points).toBe(0)
  })

  it('stays locked until the apprentice upgrade is bought', () => {
    const { gameState, buyUpgrade, autoClickerRate, clickPower } =
      useGameState(createTestGameState({ coins: 50 }))

    expect(gameState.autoClickerUnlocked).toBe(false)
    // De rate bestaat wel, maar de interval is nog niet actief.
    expect(autoClickerRate.value).toBeCloseTo(clickPower.value * 0.1, 12)

    buyUpgrade(apprenticeUpgradeId)

    expect(gameState.autoClickerUnlocked).toBe(true)
  })

  it('cannot be bought twice and never charges twice', () => {
    const { gameState, buyUpgrade } = useGameState(
      createTestGameState({ coins: 500 }),
    )

    buyUpgrade(apprenticeUpgradeId)
    const coinsAfterFirstPurchase = gameState.coins
    const purchasesAfterFirst = gameState.upgrades.filter(
      (id) => id === apprenticeUpgradeId,
    ).length

    buyUpgrade(apprenticeUpgradeId)
    buyUpgrade(apprenticeUpgradeId)

    expect(gameState.coins).toBe(coinsAfterFirstPurchase)
    expect(
      gameState.upgrades.filter((id) => id === apprenticeUpgradeId),
    ).toHaveLength(purchasesAfterFirst)
  })

  it('adds 10% of the click power every second once unlocked', () => {
    const { gameState, buyUpgrade, addPoints, startAutoClicker } = useGameState(
      createTestGameState({ coins: 50 }),
    )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    const pointsBefore = gameState.points

    vi.advanceTimersByTime(1000)

    // Click power is 1, dus de leerling levert 0.1 punt per seconde.
    expect(gameState.points - pointsBefore).toBeCloseTo(0.1, 10)

    vi.advanceTimersByTime(3000)
    expect(gameState.points - pointsBefore).toBeCloseTo(0.4, 10)

    // Handmatig klikken telt gewoon op.
    addPoints('project')
    expect(gameState.points - pointsBefore).toBeCloseTo(1.4, 10)
  })

  it('scales the rate with purchased click upgrades', () => {
    const { gameState, buyUpgrade, startAutoClicker, autoClickerRate } =
      useGameState(createTestGameState({ coins: 500 }))

    buyUpgrade(101) // +10%
    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    const pointsBefore = gameState.points
    // clickPower is nu 1.1, dus 10% daarvan is 0.11 per seconde.
    expect(autoClickerRate.value).toBeCloseTo(0.11, 12)

    vi.advanceTimersByTime(2000)
    expect(gameState.points - pointsBefore).toBeCloseTo(0.22, 10)
  })

  it('feeds the active order once one is selected', () => {
    const { gameState, offeredOrders, buyUpgrade, selectOrder, startAutoClicker } =
      useGameState(
        createTestGameState({
          coins: 50,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          points: 10,
        }),
      )

    expect(offeredOrders.value.length).toBe(2)

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    // Zonder actieve order voedt de leerling het (al voltooide) project,
    // dus de orderprogress blijft ongewijzigd.
    vi.advanceTimersByTime(1000)
    expect(gameState.activeOrder).toBeNull()

    const [firstOffer] = offeredOrders.value

    if (firstOffer === undefined) {
      throw new Error('expected at least one offered order')
    }

    selectOrder(firstOffer.id)
    expect(gameState.activeOrder).not.toBeNull()

    const orderProgressBefore = gameState.activeOrder?.progress ?? 0
    expect(orderProgressBefore).toBe(0)

    vi.advanceTimersByTime(1000)

    const expectedOrderProgress = Math.min(
      firstOffer.requiredPoints,
      orderProgressBefore + 0.1,
    )
    expect(gameState.activeOrder?.progress).toBeCloseTo(
      expectedOrderProgress,
      10,
    )
  })

  it('stops ticking after stopAutoClicker', () => {
    const { gameState, buyUpgrade, startAutoClicker, stopAutoClicker } =
      useGameState(createTestGameState({ coins: 50 }))

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    vi.advanceTimersByTime(1000)
    const pointsAfterFirstTick = gameState.points

    stopAutoClicker()
    vi.advanceTimersByTime(5000)

    expect(gameState.points).toBe(pointsAfterFirstTick)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('never starts two intervals for the same unlock', () => {
    const { buyUpgrade, startAutoClicker } = useGameState(
      createTestGameState({ coins: 50 }),
    )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()
    startAutoClicker()
    startAutoClicker()

    expect(vi.getTimerCount()).toBe(1)
  })

  it('cleans up the interval when the owning component scope is disposed', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { gameState, buyUpgrade, startAutoClicker } = useGameState(
            createTestGameState({ coins: 50 }),
          )

          buyUpgrade(apprenticeUpgradeId)
          startAutoClicker()

          return { gameState }
        },
        template: '<div />',
      }),
    )

    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('resets the unlock when the game state resets', () => {
    const { gameState, buyUpgrade, resetGameState } = useGameState(
      createTestGameState({ coins: 50 }),
    )

    buyUpgrade(apprenticeUpgradeId)
    expect(gameState.autoClickerUnlocked).toBe(true)

    resetGameState()

    expect(gameState.autoClickerUnlocked).toBe(false)
    expect(gameState.upgrades).toEqual([])
  })
})