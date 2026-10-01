import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import GameNavigation from './components/GameNavigation.vue'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { createTestGameState } from './test/fixtures'

/**
 * Zet een save die genoeg munten bevat om de leerling te kopen, plus project 1
 * voltooid zodat de winkel zichtbaar is.
 */
function seedUnlockedSave(): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(
      createTestGameState({
        // Boven de 1000 punten, zodat project 2 actief is en de leerling
        // daadwerkelijk iets te vorderen heeft.
        points: 2_000,
        coins: 500,
        completedProjects: [1],
        projectProgress: { 1: 10 },
      }),
    ),
  )
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

  it('adds auto-clicker points every second without a click', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')
    await flushPromises()

    const shop = wrapper.getComponent({ name: 'UpgradeShop' })
    const apprenticeItem = shop
      .findAll('.upgrade-item')
      .find((item) => item.text().includes('Leerling'))

    await apprenticeItem?.get('button').trigger('click')
    await flushPromises()

    const pointsBefore = wrapper.vm.gameState.points

    vi.advanceTimersByTime(3000)
    await flushPromises()

    const gained = wrapper.vm.gameState.points - pointsBefore

    // Clickkracht is 1, dus de leerling levert 10% per seconde.
    expect(gained).toBeCloseTo(0.3, 10)
  })

  it('stops the interval after unmount', async () => {
    seedUnlockedSave()

    const wrapper = mount(App)
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')
    await flushPromises()

    const shop = wrapper.getComponent({ name: 'UpgradeShop' })
    const apprenticeItem = shop
      .findAll('.upgrade-item')
      .find((item) => item.text().includes('Leerling'))

    await apprenticeItem?.get('button').trigger('click')
    await flushPromises()

    expect(vi.getTimerCount()).toBeGreaterThan(0)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})