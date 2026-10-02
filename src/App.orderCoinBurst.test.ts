import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import GameNavigation from './components/GameNavigation.vue'
import { createWorkOrder, getOrderDefinition } from './data/orders'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { normalizeGameState } from './types/gameStateNormalization'
import { createTestGameState } from './test/fixtures'
import type { GameState, WorkOrder } from './types/game'

const apprenticeUpgradeId = 104

/** Duur van de explosie zoals `App.vue` hem instelt. */
const COIN_BURST_DURATION_MS = 1200

function firstOrder(): WorkOrder {
  const definition = getOrderDefinition(1, 1)

  if (definition === undefined) {
    throw new Error('missing test order definition')
  }

  return createWorkOrder(1, definition, 0)
}

/**
 * Zet een save met een actieve order die nét onder de grens staat. Eén klik op
 * het aambeeld in de smederij rondt hem af, precies zoals een speler het doet.
 *
 * De voortgang wordt bij het inladen op een geheel getal gezet, dus de order is
 * met één punt te gaan en één klik van `clickPower` 1 volstaat.
 */
function seedOnePointShort(extra: Partial<GameState> = {}): WorkOrder {
  const order = firstOrder()
  const activeOrder: WorkOrder = {
    ...order,
    progress: order.requiredPoints - 1,
  }

  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(
      normalizeGameState(
        createTestGameState({
          coins: 0,
          points: 2_000,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          nextOrderId: 2,
          activeOrder,
          offeredOrders: [],
          ...extra,
        }),
      ),
    ),
  )

  return activeOrder
}

async function openSmithy(wrapper: ReturnType<typeof mount>): Promise<void> {
  await wrapper
    .getComponent(GameNavigation)
    .get('.game-navigation__tab[data-view="smithy"]')
    .trigger('click')
  await flushPromises()
}

/** Eén klik op het aambeeld in de smederij, dus één punt richting de order. */
async function strikeOrder(
  wrapper: ReturnType<typeof mount>,
): Promise<void> {
  await wrapper.get('button.game-button').trigger('click')
  await flushPromises()
}

describe('coin burst on order completion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('shows no burst while the order is being worked', async () => {
    seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)

    expect(wrapper.vm.gameState.activeOrder).not.toBeNull()
    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('throws one burst when an order is finished', async () => {
    seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    expect(wrapper.vm.gameState.activeOrder).toBeNull()
    expect(wrapper.vm.gameState.completedOrderCount).toBe(1)
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
  })

  it('puts the burst in the smithy view, where the order was finished', async () => {
    seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    // Alleen de actieve view staat in de DOM, en dat is de smederij.
    expect(wrapper.find('#game-panel-smithy').exists()).toBe(true)
    expect(
      wrapper.get('#game-panel-smithy').find('.coin-burst').exists(),
    ).toBe(true)
    expect(wrapper.get('#game-panel-smithy').find('.coin-burst').attributes('aria-hidden')).toBe(
      'true',
    )
  })

  it('pays the reward the order was worth', async () => {
    const activeOrder = seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    expect(wrapper.vm.gameState.coins).toBe(activeOrder.coinReward)
    // De beloning gaat door naar de waaier, zodat de explosie ervan afhangt.
    const coin = wrapper.get('.coin-burst__coin')
    const style = coin.attributes('style') ?? ''

    expect(style).toContain('--coin-x')
    expect(style).not.toContain('--coin-x: 0px')
  })

  it('offers new orders and clears the burst after its duration', async () => {
    seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    expect(wrapper.find('.order-selection').exists()).toBe(true)
    expect(wrapper.find('.coin-burst').exists()).toBe(true)

    vi.advanceTimersByTime(COIN_BURST_DURATION_MS)
    await flushPromises()

    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('replaces the burst for the next order instead of stacking', async () => {
    // De tweede order vraagt ruim duizend punten, dus de speler krijgt hier
    // flinke clickkracht. De ontwikkelaarskracht telt mee in `clickPower`,
    // ook al is het een dev-only upgrade.
    const first = seedOnePointShort({ upgrades: [105] })

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    const firstBurst = wrapper.get('.coin-burst').element

    // Kies de volgende order en rond hem af met klikken, want de hoeveelheid
    // groeit per afgeronde order en `gameState` is read-only in een test.
    await wrapper.get('.order-selection button').trigger('click')
    await flushPromises()

    const rewardOfSecond = wrapper.vm.gameState.activeOrder?.coinReward ?? 0

    expect(rewardOfSecond).toBeGreaterThan(0)

    for (let click = 0; click < 200 && wrapper.vm.gameState.activeOrder; click++) {
      await strikeOrder(wrapper)
    }

    expect(wrapper.vm.gameState.completedOrderCount).toBe(2)
    expect(wrapper.vm.gameState.activeOrder).toBeNull()
    expect(wrapper.vm.gameState.coins).toBe(first.coinReward + rewardOfSecond)

    // Nog steeds één explosie in de DOM, en het is een nieuw element zodat de
    // animatie opnieuw begint.
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
    expect(wrapper.get('.coin-burst').element).not.toBe(firstBurst)
  })

  it('shows no burst after a reset, because the count does not step by one', async () => {
    seedOnePointShort()

    const wrapper = mount(App)
    await openSmithy(wrapper)
    await strikeOrder(wrapper)

    expect(wrapper.find('.coin-burst').exists()).toBe(true)

    vi.advanceTimersByTime(COIN_BURST_DURATION_MS)
    await flushPromises()
    expect(wrapper.find('.coin-burst').exists()).toBe(false)

    const api = wrapper.vm as unknown as { resetGameState: () => void }

    api.resetGameState()
    await flushPromises()
    vi.advanceTimersByTime(1000)
    await flushPromises()

    // De teller springt terug naar 0 in plaats van met één omhoog, dus we vieren
    // niets: bij een teruggezette save weten we de beloning niet meer.
    expect(wrapper.vm.gameState.completedOrderCount).toBe(0)
    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('celebrates an order the apprentice finished', async () => {
    // De leerling levert 0.1 per seconde, dus een order die één punt te gaan is
    // rond na tien tikken.
    const activeOrder = seedOnePointShort({
      autoClickerUnlocked: true,
      upgrades: [apprenticeUpgradeId],
    })

    const wrapper = mount(App)
    await openSmithy(wrapper)

    expect(wrapper.vm.gameState.activeOrder).not.toBeNull()

    vi.advanceTimersByTime(11_000)
    await flushPromises()

    expect(wrapper.vm.gameState.completedOrderCount).toBe(1)
    expect(wrapper.vm.gameState.coins).toBe(activeOrder.coinReward)
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
  })
})