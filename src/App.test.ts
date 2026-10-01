import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeepReadonly } from 'vue'
import App from './App.vue'
import GameButton from './components/GameButton.vue'
import GameHeader from './components/GameHeader.vue'
import GameNavigation from './components/GameNavigation.vue'
import OrderSelection from './components/OrderSelection.vue'
import OrderTracker from './components/OrderTracker.vue'
import ProjectList from './components/ProjectList.vue'
import TestControls from './components/TestControls.vue'
import UpgradeItem from './components/UpgradeItem.vue'
import UpgradeShop from './components/UpgradeShop.vue'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { createInitialGameState } from './types/game'
import type { GameState } from './types/game'
import { createTestGameState } from './test/fixtures'

interface ExposedAppApi {
  readonly gameState: DeepReadonly<GameState>
  readonly activeView: 'projects' | 'smithy' | 'upgrades'
  readonly addPoints: (target?: 'order' | 'project') => void
  readonly selectOrder: (orderId: number) => void
  readonly completeProject: (projectId: number) => void
  readonly buyUpgrade: (upgradeId: number) => void
  readonly resetGameState: () => void
}

function getExposedApi(wrapper: ReturnType<typeof mount>): ExposedAppApi {
  return wrapper.vm as unknown as ExposedAppApi
}

function storeState(overrides: Partial<GameState> = {}): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(createTestGameState(overrides)),
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('App', () => {
  it('starts on the project view with the header and navigation visible', () => {
    const wrapper = mount(App)

    expect(wrapper.get('h1').text()).toBe('ClickHammer')
    expect(wrapper.findComponent(GameHeader).exists()).toBe(true)
    expect(wrapper.findComponent(GameNavigation).exists()).toBe(true)
    expect(wrapper.findComponent(ProjectList).exists()).toBe(true)
    expect(wrapper.findComponent(GameButton).exists()).toBe(true)
    expect(wrapper.findComponent(UpgradeShop).exists()).toBe(false)
    expect(wrapper.findComponent(OrderSelection).exists()).toBe(false)
    expect(wrapper.findComponent(TestControls).exists()).toBe(true)
  })

  it('switches between projects, smithy and upgrades', async () => {
    const wrapper = mount(App)
    const navigation = wrapper.getComponent(GameNavigation)

    await navigation
      .get('.game-navigation__tab[data-view="smithy"]')
      .trigger('click')
    expect(wrapper.findComponent(ProjectList).exists()).toBe(false)
    expect(wrapper.find('.game-gate').exists()).toBe(true)

    await navigation
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')
    expect(wrapper.findComponent(UpgradeShop).exists()).toBe(true)
    expect(wrapper.findComponent(GameHeader).exists()).toBe(true)

    await navigation
      .get('.game-navigation__tab[data-view="projects"]')
      .trigger('click')
    expect(wrapper.findComponent(ProjectList).exists()).toBe(true)
  })

  it('loads saved progress once when the app starts', () => {
    storeState({
      points: 4,
      projectProgress: { 1: 4 },
    })
    const getItem = vi.spyOn(Storage.prototype, 'getItem')

    const wrapper = mount(App)

    expect(getExposedApi(wrapper).gameState.points).toBe(4)
    expect(getItem).toHaveBeenCalledTimes(1)
  })

  it('restores progress after unmount and remount', async () => {
    vi.useFakeTimers()
    const firstWrapper = mount(App)
    const firstApi = getExposedApi(firstWrapper)

    firstApi.addPoints('project')
    await nextTick()
    vi.advanceTimersByTime(250)
    firstWrapper.unmount()

    const secondWrapper = mount(App)

    expect(getExposedApi(secondWrapper).gameState.points).toBe(1)
  })

  it('routes project, order and upgrade actions through central state', async () => {
    storeState({
      points: 9,
      coins: 10,
      projectProgress: { 1: 9 },
    })
    const wrapper = mount(App)
    const appApi = getExposedApi(wrapper)

    await wrapper.getComponent(GameButton).get('button').trigger('click')

    expect(appApi.gameState.points).toBe(10)
    expect(appApi.gameState.completedProjects).toEqual([1])
    expect(appApi.gameState.coins).toBe(10)
    expect(appApi.gameState.offeredOrders).toHaveLength(2)

    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="smithy"]')
      .trigger('click')

    const selection = wrapper.getComponent(OrderSelection)
    await selection.findAll('.order-selection__button')[1].trigger('click')
    expect(wrapper.findComponent(OrderTracker).exists()).toBe(true)

    for (let click = 0; click < 10; click += 1) {
      await wrapper.getComponent(GameButton).get('button').trigger('click')
    }

    expect(appApi.gameState.completedOrderCount).toBe(1)
    expect(appApi.gameState.coins).toBe(20)
    expect(wrapper.findComponent(OrderSelection).exists()).toBe(true)

    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')
    await wrapper.getComponent(UpgradeItem).get('button').trigger('click')

    expect(appApi.gameState.coins).toBe(10)
    expect(appApi.gameState.upgrades).toEqual([101])
  })

  it('formats the score visually while keeping precise central state', () => {
    storeState({ points: 9_999 })
    const wrapper = mount(App)
    const score = wrapper.getComponent(GameHeader).findAll('dd')[0]

    expect(score.text()).toBe('10k')
    expect(getExposedApi(wrapper).gameState.points).toBe(9_999)
  })

  it('resets the central state and persisted progress from test controls', async () => {
    storeState({
      points: 30,
      coins: 42,
      completedProjects: [1],
      upgrades: [101, 101],
      projectProgress: { 1: 10 },
    })
    const wrapper = mount(App)
    const appApi = getExposedApi(wrapper)

    await wrapper.getComponent(TestControls).get('button').trigger('click')

    expect(appApi.gameState).toEqual(createInitialGameState())
    expect(
      JSON.parse(window.localStorage.getItem(GAME_STORAGE_KEY) ?? ''),
    ).toEqual(createInitialGameState())
  })

  it('starts with safe state when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage read failed')
    })

    const wrapper = mount(App)
    const appApi = getExposedApi(wrapper)

    expect(appApi.gameState).toMatchObject({ points: 0, coins: 0 })
    expect(() => appApi.addPoints('project')).not.toThrow()
    expect(appApi.gameState.points).toBe(1)
  })

  it('keeps the game playable when writing state fails', async () => {
    vi.useFakeTimers()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage write failed')
    })
    const wrapper = mount(App)
    const appApi = getExposedApi(wrapper)

    expect(() => appApi.addPoints('project')).not.toThrow()
    await nextTick()
    expect(() => vi.advanceTimersByTime(250)).not.toThrow()
    expect(appApi.gameState.points).toBe(1)
  })
})
