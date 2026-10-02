import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import GameNavigation from './components/GameNavigation.vue'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { normalizeGameState } from './types/gameStateNormalization'
import { createTestGameState } from './test/fixtures'
import type { GameState } from './types/game'

/**
 * Zet een save die genoeg munten bevat om de leerling te kopen, plus project 1
 * voltooid zodat de winkel zichtbaar is.
 *
 * De state wordt genormaliseerd voor het opslaan, net als het spel dat doet.
 * Zonder die stap heeft de fixture geen orderoffertes en komt de save binnen
 * als `recovered`, wat een opslagmelding opent en de te meten panelen onder
 * een tweede melding zet.
 */
function seedUnlockedSave(overrides: Partial<GameState> = {}): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(
      normalizeGameState(
        createTestGameState({
          // Boven de 1000 punten, zodat project 2 actief is.
          points: 2_000,
          coins: 500,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          ...overrides,
        }),
      ),
    ),
  )
}

/** Koopt de leerling via de winkel en wacht tot de tick actief is. */
async function buyApprentice(
  wrapper: ReturnType<typeof mount>,
): Promise<void> {
  await wrapper
    .getComponent(GameNavigation)
    .get('.game-navigation__tab[data-view="upgrades"]')
    .trigger('click')
  await flushPromises()

  const shop = wrapper.getComponent({ name: 'UpgradeShop' })
  const apprenticeItem = shop
    .findAll('.upgrade-item')
    .find((item) => item.text().includes('Leerling'))

  if (apprenticeItem === undefined) {
    throw new Error('Leerling staat niet in de winkel')
  }

  await apprenticeItem.get('button').trigger('click')
  await flushPromises()
}

describe('auto-clicker integration in App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('disables the apprentice tab until the upgrade is bought', () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    const apprenticeTab = wrapper.get(
      '.game-navigation__tab[data-view="apprentice"]',
    )

    expect(apprenticeTab.attributes('disabled')).toBeDefined()
    expect(wrapper.find('#game-panel-apprentice').exists()).toBe(false)
  })

  it('enables the tab after buying the upgrade and renders the panel', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')
    await flushPromises()

    const apprenticeTab = wrapper.get(
      '.game-navigation__tab[data-view="apprentice"]',
    )

    // Vóór de aankoop is het tabblad nog geblokkeerd.
    expect(apprenticeTab.attributes('disabled')).toBeDefined()

    const shop = wrapper.getComponent({ name: 'UpgradeShop' })
    const apprenticeItem = shop
      .findAll('.upgrade-item')
      .find((item) => item.text().includes('Leerling'))

    expect(apprenticeItem).toBeDefined()

    // De leerling kost 50 munten en de save heeft er 500.
    await apprenticeItem?.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.vm.gameState.upgrades).toContain(104)
    expect(wrapper.vm.gameState.autoClickerUnlocked).toBe(true)
    expect(apprenticeTab.attributes('disabled')).toBeUndefined()

    expect(apprenticeItem?.get('button').text()).toBe('Ontgrendeld')
    expect(apprenticeItem?.get('button').attributes('disabled')).toBeDefined()

    await apprenticeTab.trigger('click')
    await flushPromises()

    expect(wrapper.find('#game-panel-apprentice').exists()).toBe(true)
    expect(wrapper.get('#apprentice-panel-title').text()).toBe('Leerling')
  })

  it('never adds points to a project while no order is active', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    // Blijf op Projecten: daar is project 2 het actieve doel.
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="projects"]')
      .trigger('click')
    await flushPromises()

    expect(
      wrapper
        .get('.game-navigation__tab[data-view="projects"]')
        .attributes('aria-selected'),
    ).toBe('true')

    const pointsBefore = wrapper.vm.gameState.points
    const projectProgressBefore = wrapper.vm.gameState.projectProgress[2]

    vi.advanceTimersByTime(60_000)
    await flushPromises()

    // De leerling helpt niet mee aan projecten, hoe lang je ook wacht.
    expect(wrapper.vm.gameState.points).toBe(pointsBefore)
    expect(wrapper.vm.gameState.projectProgress[2]).toBe(projectProgressBefore)
  })

  it('adds auto-clicker points to an active order every second', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    // Zonder order levert de leerling niets.
    const pointsBeforeIdle = wrapper.vm.gameState.points

    vi.advanceTimersByTime(5000)
    await flushPromises()

    expect(wrapper.vm.gameState.points).toBe(pointsBeforeIdle)

    // Kies een order in de smederij.
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="smithy"]')
      .trigger('click')
    await flushPromises()

    const orderButton = wrapper.get('.order-selection button')

    await orderButton.trigger('click')
    await flushPromises()

    const activeOrder = wrapper.vm.gameState.activeOrder

    expect(activeOrder).not.toBeNull()

    const orderProgressBefore = activeOrder?.progress ?? 0
    const pointsBefore = wrapper.vm.gameState.points

    vi.advanceTimersByTime(3000)
    await flushPromises()

    // Clickkracht is 1, dus de leerling levert 10% per seconde.
    expect(wrapper.vm.gameState.points - pointsBefore).toBeCloseTo(0.3, 10)
    expect(wrapper.vm.gameState.activeOrder?.progress ?? 0).toBeGreaterThan(
      orderProgressBefore,
    )
  })

  it('shows the waiting status until an order is active', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    const openApprenticeView = async (): Promise<void> => {
      await wrapper
        .getComponent(GameNavigation)
        .get('.game-navigation__tab[data-view="apprentice"]')
        .trigger('click')
      await flushPromises()
    }

    await openApprenticeView()

    // Zonder order: wachtstatus, en nadrukkelijk geen rate.
    expect(wrapper.find('.apprentice-panel__waiting').exists()).toBe(true)
    expect(wrapper.find('.apprentice-panel__stats').exists()).toBe(false)
    expect(wrapper.get('#game-panel-apprentice').text()).not.toContain(
      'punten per seconde',
    )

    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="smithy"]')
      .trigger('click')
    await flushPromises()
    await wrapper.get('.order-selection button').trigger('click')
    await flushPromises()

    await openApprenticeView()

    // Met order: de werkstatus met de echte cijfers.
    expect(wrapper.find('.apprentice-panel__waiting').exists()).toBe(false)
    expect(wrapper.find('.apprentice-panel__stats').exists()).toBe(true)
    expect(wrapper.get('#game-panel-apprentice').text()).toContain(
      'punten per seconde',
    )
  })

  it('never moves the hammer for the apprentice', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    // Ga terug naar Projecten: daar staat de aambeeldknop.
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="projects"]')
      .trigger('click')
    await flushPromises()

    const strikeBefore = wrapper.get('button.game-button').attributes(
      'data-strike-count',
    )

    vi.advanceTimersByTime(5000)
    await flushPromises()

    expect(
      wrapper.get('button.game-button').attributes('data-strike-count'),
    ).toBe(strikeBefore)
  })

  it('moves the hammer on a manual click', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    const before = Number(
      wrapper.get('button.game-button').attributes('data-strike-count'),
    )

    await wrapper.get('button.game-button').trigger('click')
    await flushPromises()

    expect(
      Number(wrapper.get('button.game-button').attributes('data-strike-count')),
    ).toBe(before + 1)
  })

  it('never sparks while the apprentice works', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    // Zonder order werkt de leerling sowieso niet, dus ook met een order mee:
    // eerst een order kiezen zodat hij echt punten verdient.
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="smithy"]')
      .trigger('click')
    await flushPromises()
    await wrapper.get('.order-selection button').trigger('click')
    await flushPromises()

    const orderBefore = wrapper.vm.gameState.activeOrder?.progress ?? 0

    vi.advanceTimersByTime(10_000)
    await flushPromises()

    // De leerling heeft wel vooruitgang gemaakt...
    expect(wrapper.vm.gameState.activeOrder?.progress ?? 0).toBeGreaterThan(
      orderBefore,
    )
    // ...maar geen enkele vonk en geen enkele hamerklap.
    expect(wrapper.find('.spark-burst').exists()).toBe(false)
    expect(
      Number(wrapper.find('button.game-button').attributes('data-strike-count')),
    ).toBe(0)
  })

  it('stops the interval after unmount', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await buyApprentice(wrapper)

    expect(vi.getTimerCount()).toBeGreaterThan(0)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})