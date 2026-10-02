import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import { projects } from './data/projects'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { normalizeGameState } from './types/gameStateNormalization'
import { createTestGameState } from './test/fixtures'
import type { GameState } from './types/game'

const firstProject = projects[0]
const secondProject = projects[1]
const lastProject = projects[2]

/**
 * Duur van de explosie zoals `App.vue` hem instelt. Staat hier een hardgetal, dan
 * loopt de test er stilzwijgend naast zodra de explosie langer duurt.
 */
const COIN_BURST_DURATION_MS = 1200

/**
 * Zet een save die vlak voor de grens staat: het actieve project ontbreekt
 * nét één punt. Eén klik op het aambeeld rondt het dan, precies zoals een
 * speler het doet. De state wordt genormaliseerd, anders komt de save binnen
 * als `recovered` en staat er een opslagmelding naast hetgeen we meten.
 */
function seed(overrides: Partial<GameState> = {}): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(
      normalizeGameState(
        createTestGameState({
          coins: 0,
          points: 2_000,
          completedProjects: [1],
          projectProgress: { 1: 10 },
          ...overrides,
        }),
      ),
    ),
  )
}

/** Eén klik op het aambeeld, dus één `clickPower` richting het actieve project. */
async function strike(wrapper: ReturnType<typeof mount>): Promise<void> {
  await wrapper.get('button.game-button').trigger('click')
  await flushPromises()
}

function seedOnePointShortOfSecond(): void {
  seed({
    points: 2_000,
    projectProgress: { 1: 10, 2: secondProject.requiredPoints - 1 },
  })
}

function seedTwoProjectsOnePointShort(): void {
  seed({
    // Voldoende punten om project drie meteen te ontgrendelen, zodat er na de
    // eerste voltooiing gelijk een volgend actief project is.
    points: 25_000_001,
    projectProgress: {
      1: 10,
      2: secondProject.requiredPoints - 1,
      3: lastProject.requiredPoints - 1,
    },
  })
}

describe('coin burst on project completion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('shows no burst before anything is completed', () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)

    expect(wrapper.vm.gameState.completedProjects).not.toContain(2)
    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('throws one burst when a project with a reward is finished', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    expect(wrapper.vm.gameState.completedProjects).toContain(2)
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
    expect(wrapper.findAll('.coin-burst__coin').length).toBeGreaterThanOrEqual(10)
  })

  it('skips the burst for a project without a reward', async () => {
    // `Herstel het aambeeld` levert nul munten en krijgt dus geen explosie.
    expect(firstProject.coinReward).toBe(0)

    seed({
      points: 9,
      completedProjects: [],
      projectProgress: { 1: firstProject.requiredPoints - 1 },
    })

    const wrapper = mount(App)
    await strike(wrapper)

    expect(wrapper.vm.gameState.completedProjects).toContain(1)
    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('replaces the burst for the next completed project instead of stacking', async () => {
    seedTwoProjectsOnePointShort()

    const wrapper = mount(App)
    await strike(wrapper)

    expect(wrapper.vm.gameState.completedProjects).toEqual([1, 2])
    const firstBurst = wrapper.get('.coin-burst').element
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)

    // Tweede project binnen de looptijd van de eerste explosie.
    await strike(wrapper)

    expect(wrapper.vm.gameState.completedProjects).toEqual([1, 2, 3])
    // Nog steeds één explosie in de DOM, en het is een nieuw element zodat de
    // animatie opnieuw begint.
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
    expect(wrapper.get('.coin-burst').element).not.toBe(firstBurst)
  })

  it('keeps a single burst when no project is left to complete', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)

    // Na project twee is project drie nog vergrendeld, dus het aambeeld
    // verdwijnt en er valt niets meer te klikken of af te ronden.
    expect(wrapper.find('button.game-button').exists()).toBe(false)
    expect(wrapper.findAll('.coin-burst')).toHaveLength(1)
  })

  it('removes the burst from the DOM after its duration', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    vi.advanceTimersByTime(COIN_BURST_DURATION_MS - 1)
    await flushPromises()
    expect(wrapper.find('.coin-burst').exists()).toBe(true)

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('ignores a project-complete event for an already completed project', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    vi.advanceTimersByTime(COIN_BURST_DURATION_MS)
    await flushPromises()
    expect(wrapper.find('.coin-burst').exists()).toBe(false)

    const api = wrapper.vm as unknown as {
      completeProject: (projectId: number) => void
    }

    api.completeProject(2)
    await flushPromises()

    expect(wrapper.find('.coin-burst').exists()).toBe(false)
  })

  it('hides the burst from assistive technology', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    expect(
      wrapper.get('.game-view__effect-layer').attributes('aria-hidden'),
    ).toBe('true')
    expect(wrapper.find('.coin-burst').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.coin-burst').text()).toBe('')
  })

  it('clears the burst timer when unmounted mid-animation', async () => {
    seedOnePointShortOfSecond()

    const wrapper = mount(App)
    await strike(wrapper)

    expect(wrapper.find('.coin-burst').exists()).toBe(true)

    wrapper.unmount()

    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
  })
})
