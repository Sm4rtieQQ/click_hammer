import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createWorkOrder, getOrderDefinition } from '../data/orders'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

const apprenticeUpgradeId = 104

/**
 * Bouwt een spel waarin de leerling iets heeft om te doen: project 1 is klaar,
 * dus de smederij is open, en er is meteen een order actief.
 *
 * Zonder deze helper zou de meerderheid van de tests zonder actieve order
 * draaien en de leerling per definitie niets doen. Dat is één keer een test op
 * zich, niet de standaard voorstelling van deze suite.
 */
function withActiveOrder() {
  const definition = getOrderDefinition(1, 1)

  if (definition === undefined) {
    throw new Error('missing test order definition')
  }

  return createTestGameState({
    coins: 500,
    completedProjects: [1],
    projectProgress: { 1: 10 },
    points: 10,
    nextOrderId: 2,
    activeOrder: createWorkOrder(1, definition, 0),
    offeredOrders: [],
  })
}

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
      withActiveOrder(),
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
    addPoints('order')
    expect(gameState.points - pointsBefore).toBeCloseTo(1.4, 10)
  })

  it('scales the rate with purchased click upgrades', () => {
    const { gameState, buyUpgrade, startAutoClicker, autoClickerRate } =
      useGameState(withActiveOrder())

    buyUpgrade(101) // +10%
    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    const pointsBefore = gameState.points
    // clickPower is nu 1.1, dus 10% daarvan is 0.11 per seconde.
    expect(autoClickerRate.value).toBeCloseTo(0.11, 12)

    vi.advanceTimersByTime(2000)
    expect(gameState.points - pointsBefore).toBeCloseTo(0.22, 10)
  })

  it('never feeds a project while no order is active', () => {
    const {
      gameState,
      autoClickCount,
      isAutoClickerWorking,
      buyUpgrade,
      startAutoClicker,
    } = useGameState(
      createTestGameState({
        coins: 500,
        // Project 2 is ontgrendeld en dus het actieve project.
        completedProjects: [1],
        points: 5_000,
        projectProgress: { 1: 10, 2: 250 },
      }),
    )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    const pointsBefore = gameState.points
    const projectProgressBefore = gameState.projectProgress[2]

    vi.advanceTimersByTime(60_000)

    // Het actieve project staat stil: de leerling helpt daar nooit mee.
    expect(gameState.points).toBe(pointsBefore)
    expect(gameState.projectProgress[2]).toBe(projectProgressBefore)
    expect(autoClickCount.value).toBe(0)
    expect(isAutoClickerWorking.value).toBe(false)
  })

  it('adds nothing and counts no click while there is no active order', () => {
    const { gameState, autoClickCount, buyUpgrade, startAutoClicker } =
      useGameState(createTestGameState({ coins: 500, completedProjects: [1] }))

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    const pointsBefore = gameState.points

    vi.advanceTimersByTime(10_000)

    expect(gameState.points).toBe(pointsBefore)
    expect(autoClickCount.value).toBe(0)
  })

  it('starts working the moment an order is selected', () => {
    const {
      gameState,
      offeredOrders,
      autoClickCount,
      isAutoClickerWorking,
      buyUpgrade,
      selectOrder,
      startAutoClicker,
    } = useGameState(
      createTestGameState({
        coins: 500,
        completedProjects: [1],
        projectProgress: { 1: 10 },
        points: 10,
      }),
    )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    expect(isAutoClickerWorking.value).toBe(false)

    const [firstOffer] = offeredOrders.value

    if (firstOffer === undefined) {
      throw new Error('expected at least one offered order')
    }

    const orderProgressBefore = firstOffer.progress

    selectOrder(firstOffer.id)

    expect(isAutoClickerWorking.value).toBe(true)
    expect(gameState.activeOrder?.progress).toBe(orderProgressBefore)

    vi.advanceTimersByTime(1000)

    const expectedOrderProgress = Math.min(
      firstOffer.requiredPoints,
      orderProgressBefore + 0.1,
    )
    expect(gameState.activeOrder?.progress).toBeCloseTo(
      expectedOrderProgress,
      10,
    )
    expect(autoClickCount.value).toBe(1)
  })

  it('stops working once the order is finished', () => {
    const definition = getOrderDefinition(1, 1)

    if (definition === undefined) {
      throw new Error('missing test order definition')
    }

    const almostDone = createWorkOrder(1, definition, 0)

    /*
     * De voortgang wordt bij het inladen op een geheel getal gezet, dus de order
     * is met een punt te gaan. Bij een rate van 0.1 zijn dat ongeveer tien
     * tikken. Het exacte aantal telt niet: 0.1 is geen binaire breuk, dus
     * tien keer optellen levert 9.9999… op en niet netjes 10.
     */
    const { gameState, isAutoClickerWorking, autoClickCount, buyUpgrade, startAutoClicker } =
      useGameState(
        createTestGameState({
          coins: 500,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          points: 10,
          nextOrderId: 2,
          activeOrder: {
            ...almostDone,
            progress: almostDone.requiredPoints - 1,
          },
          offeredOrders: [],
        }),
      )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    expect(isAutoClickerWorking.value).toBe(true)

    vi.advanceTimersByTime(15_000)

    // De order is afgerond en er is meteen een nieuwe set offers.
    expect(gameState.activeOrder).toBeNull()
    expect(isAutoClickerWorking.value).toBe(false)

    const pointsAfterCompletion = gameState.points
    const clicksAtCompletion = autoClickCount.value

    expect(clicksAtCompletion).toBeGreaterThan(0)

    vi.advanceTimersByTime(30_000)

    // Zonder nieuwe order levert de leerling niets meer.
    expect(gameState.points).toBe(pointsAfterCompletion)
    expect(autoClickCount.value).toBe(clicksAtCompletion)
  })

  it('keeps one timer across selecting and finishing an order', () => {
    const definition = getOrderDefinition(1, 1)

    if (definition === undefined) {
      throw new Error('missing test order definition')
    }

    const almostDone = createWorkOrder(1, definition, 0)

    const { gameState, offeredOrders, buyUpgrade, startAutoClicker } =
      useGameState(
        createTestGameState({
          coins: 500,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          points: 10,
          nextOrderId: 2,
          activeOrder: {
            ...almostDone,
            progress: almostDone.requiredPoints - 1,
          },
          offeredOrders: [],
        }),
      )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(15_000)

    // De order is afgerond en er is een nieuwe set offers, maar de interval is
    // niet herstart of gestopt: precies één timer, onafhankelijk van de order.
    expect(gameState.activeOrder).toBeNull()
    expect(offeredOrders.value).toHaveLength(2)
    expect(vi.getTimerCount()).toBe(1)
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

    // Zonder actieve order doet de leerling niets, ook niet aan het project.
    const projectProgressBefore = gameState.projectProgress[1]

    vi.advanceTimersByTime(1000)
    expect(gameState.activeOrder).toBeNull()
    expect(gameState.projectProgress[1]).toBe(projectProgressBefore)

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
      useGameState(withActiveOrder())

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
    const { buyUpgrade, startAutoClicker } = useGameState(withActiveOrder())

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()
    startAutoClicker()
    startAutoClicker()

    expect(vi.getTimerCount()).toBe(1)
  })

  it('counts automatic clicks separately from manual ones', () => {
    const {
      gameState,
      manualClickCount,
      autoClickCount,
      buyUpgrade,
      addPoints,
      startAutoClicker,
    } = useGameState(withActiveOrder())

    addPoints('order', 'manual')
    addPoints('order', 'manual')

    expect(manualClickCount.value).toBe(2)
    expect(autoClickCount.value).toBe(0)

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    vi.advanceTimersByTime(2000)

    // De leerling verhoogt de automatische teller, niet de handmatige.
    expect(autoClickCount.value).toBe(2)
    expect(manualClickCount.value).toBe(2)
    // Startpunt 10, plus twee handmatige clicks van 1 en twee tikken van 0.1.
    expect(gameState.points).toBeCloseTo(12.2, 10)
  })

  it('does not count a click when there is no target to feed', () => {
    const {
      manualClickCount,
      autoClickCount,
      addPoints,
    } = useGameState(
      createTestGameState({
        completedProjects: [1],
        projectProgress: { 1: 10 },
        points: 10,
        offeredOrders: [],
        activeOrder: null,
      }),
    )

    // Alle projecten klaar en geen actieve order: er is niets te vorderen.
    addPoints('project', 'manual')
    addPoints('order', 'auto')

    expect(manualClickCount.value).toBe(0)
    expect(autoClickCount.value).toBe(0)
  })

  it('never moves the hammer for an automatic click', () => {
    const { buyUpgrade, startAutoClicker, manualClickCount } = useGameState(
      withActiveOrder(),
    )

    buyUpgrade(apprenticeUpgradeId)
    startAutoClicker()

    vi.advanceTimersByTime(5000)

    // De hamerfeedback hangt aan de handmatige teller.
    expect(manualClickCount.value).toBe(0)
  })

  it('cleans up the interval when the owning component scope is disposed', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { gameState, buyUpgrade, startAutoClicker } = useGameState(
            withActiveOrder(),
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