import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import GameButton from './components/GameButton.vue'
import GameNavigation from './components/GameNavigation.vue'
import OrderSelection from './components/OrderSelection.vue'
import OrderTracker from './components/OrderTracker.vue'
import ProjectList from './components/ProjectList.vue'
import UpgradeShop from './components/UpgradeShop.vue'
import { GAME_STORAGE_KEY } from './composables/gameStorage'
import { getUpgradeCost } from './composables/useGameState'
import { upgrades } from './data/upgrades'
import type { GameState, WorkOrder } from './types/game'
import { createTestGameState } from './test/fixtures'

type AppWrapper = ReturnType<typeof mount>

interface ExposedAppApi {
  readonly gameState: GameState
  readonly activeView: 'projects' | 'smithy' | 'upgrades'
  readonly addPoints: (target?: 'order' | 'project') => void
}

function getExposedApi(wrapper: AppWrapper): ExposedAppApi {
  return wrapper.vm as unknown as ExposedAppApi
}

function storeState(overrides: Partial<GameState> = {}): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(createTestGameState(overrides)),
  )
}

function readSavedState(): GameState {
  return JSON.parse(
    window.localStorage.getItem(GAME_STORAGE_KEY) ?? '',
  ) as GameState
}

async function clickAnvil(wrapper: AppWrapper, times: number): Promise<void> {
  const button = wrapper.getComponent(GameButton).get('button')

  for (let click = 0; click < times; click += 1) {
    await button.trigger('click')
  }

  await nextTick()
}

function addPoints(wrapper: AppWrapper, target: 'order' | 'project'): void {
  getExposedApi(wrapper).addPoints(target)
}

async function gotoView(
  wrapper: AppWrapper,
  view: 'projects' | 'smithy' | 'upgrades',
): Promise<void> {
  await wrapper
    .getComponent(GameNavigation)
    .get(`.game-navigation__tab[data-view="${view}"]`)
    .trigger('click')
  await nextTick()
}

async function chooseOrder(
  wrapper: AppWrapper,
  index: number,
): Promise<WorkOrder> {
  const buttons =
    wrapper.getComponent(OrderSelection).findAll('.order-selection__button')

  await buttons[index].trigger('click')
  await nextTick()

  const activeOrder = getExposedApi(wrapper).gameState.activeOrder

  if (activeOrder === null) {
    throw new Error('Expected an active order after choosing one')
  }

  return activeOrder
}

async function completeOrder(
  wrapper: AppWrapper,
  index: number,
): Promise<WorkOrder> {
  await gotoView(wrapper, 'smithy')
  const order = await chooseOrder(wrapper, index)

  await clickAnvil(wrapper, order.requiredPoints)

  return order
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('T31 full project session', () => {
  it('runs a new player from a fresh save through two completed orders', async () => {
    vi.useFakeTimers()
    const wrapper = mount(App)

    // Een verse spel begint op Projecten met het eerste project als doel.
    expect(getExposedApi(wrapper).gameState.points).toBe(0)
    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([])
    expect(wrapper.getComponent(ProjectList).text()).toContain(
      'Herstel het aambeeld',
    )

    // 1. Voltooi `Herstel het aambeeld` met precies requiredPoints clicks.
    await clickAnvil(wrapper, 10)

    expect(getExposedApi(wrapper).gameState.points).toBe(10)
    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([1])
    expect(getExposedApi(wrapper).gameState.projectProgress).toEqual({ 1: 10 })
    // Het eerste project levert bewust nul munten.
    expect(getExposedApi(wrapper).gameState.coins).toBe(0)

    // 2. De beloning wordt niet dubbel toegekend bij extra clicks.
    addPoints(wrapper, 'project')
    addPoints(wrapper, 'project')
    await nextTick()

    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([1])
    expect(getExposedApi(wrapper).gameState.coins).toBe(0)

    // 3. De smederij ontgrendelt op het moment dat project 1 klaar is.
    await gotoView(wrapper, 'smithy')
    expect(wrapper.findComponent(OrderSelection).exists()).toBe(true)
    expect(wrapper.findComponent(OrderTracker).exists()).toBe(false)

    const firstOrder = await chooseOrder(wrapper, 1)

    expect(wrapper.findComponent(OrderTracker).exists()).toBe(true)
    expect(getExposedApi(wrapper).gameState.offeredOrders).toHaveLength(0)

    // 4. Voltooi de eerste order; de beloning wordt eenmalig uitbetaald.
    await clickAnvil(wrapper, firstOrder.requiredPoints)

    expect(getExposedApi(wrapper).gameState.completedOrderCount).toBe(1)
    expect(getExposedApi(wrapper).gameState.coins).toBe(firstOrder.coinReward)
    expect(getExposedApi(wrapper).gameState.activeOrder).toBeNull()
    expect(wrapper.findComponent(OrderSelection).exists()).toBe(true)

    // 5. Een tweede order heeft een grotere hoeveelheid en beloning.
    const secondOrder = await chooseOrder(wrapper, 0)

    expect(secondOrder.quantity).toBeGreaterThan(firstOrder.quantity)
    expect(secondOrder.coinReward).toBeGreaterThan(firstOrder.coinReward)

    await clickAnvil(wrapper, secondOrder.requiredPoints)

    const expectedCoins = firstOrder.coinReward + secondOrder.coinReward

    expect(getExposedApi(wrapper).gameState.completedOrderCount).toBe(2)
    expect(getExposedApi(wrapper).gameState.coins).toBe(expectedCoins)
    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([1])

    // 6. De sessie is opgeslagen en een reload herstelt exact dezelfde stand.
    vi.advanceTimersByTime(300)

    expect(readSavedState()).toMatchObject({
      completedProjects: [1],
      completedOrderCount: 2,
      coins: expectedCoins,
      projectProgress: { 1: 10 },
    })

    const reloaded = mount(App)

    expect(getExposedApi(reloaded).gameState.coins).toBe(expectedCoins)
    expect(getExposedApi(reloaded).gameState.completedOrderCount).toBe(2)
    expect(getExposedApi(reloaded).gameState.completedProjects).toEqual([1])

    wrapper.unmount()
    reloaded.unmount()
  })

  it('does not pay the project or order reward twice', async () => {
    storeState({
      points: 9,
      projectProgress: { 1: 9 },
    })
    const wrapper = mount(App)

    await clickAnvil(wrapper, 10)

    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([1])
    expect(getExposedApi(wrapper).gameState.projectProgress).toEqual({ 1: 10 })
    expect(getExposedApi(wrapper).gameState.coins).toBe(0)

    // Het project is klaar: extra clicks kunnen geen tweede beloning geven.
    for (let click = 0; click < 25; click += 1) {
      addPoints(wrapper, 'project')
    }

    expect(getExposedApi(wrapper).gameState.completedProjects).toEqual([1])
    expect(getExposedApi(wrapper).gameState.coins).toBe(0)

    await gotoView(wrapper, 'smithy')
    const order = await chooseOrder(wrapper, 0)

    await clickAnvil(wrapper, order.requiredPoints + 25)

    expect(getExposedApi(wrapper).gameState.completedOrderCount).toBe(1)
    expect(getExposedApi(wrapper).gameState.coins).toBe(order.coinReward)

    wrapper.unmount()
  })
})

describe('T32 full upgrade session', () => {
  it('walks from earned coins to a third purchase with the AGENTS price rule', async () => {
    storeState({
      points: 9,
      projectProgress: { 1: 9 },
    })
    const wrapper = mount(App)

    await clickAnvil(wrapper, 1)

    // 1. Verdien munten met repetitieve orders.
    let earnedCoins = 0

    for (const index of [0, 1, 0, 1]) {
      const order = await completeOrder(wrapper, index)

      earnedCoins += order.coinReward
    }

    expect(earnedCoins).toBeGreaterThan(0)

    const cheapest = upgrades[0]
    const firstCost = getUpgradeCost(cheapest, 0)
    const secondCost = getUpgradeCost(cheapest, 1)
    const thirdCost = getUpgradeCost(cheapest, 2)

    expect(firstCost).toBe(cheapest.baseCost)
    expect(secondCost).toBe(
      Math.floor(cheapest.baseCost * cheapest.costMultiplier ** 1),
    )
    expect(thirdCost).toBe(
      Math.floor(cheapest.baseCost * cheapest.costMultiplier ** 2),
    )
    expect(earnedCoins).toBeGreaterThanOrEqual(firstCost + secondCost)

    await gotoView(wrapper, 'upgrades')

    const shop = wrapper.getComponent(UpgradeShop)
    const firstItem = () => shop.get('.upgrade-item')

    // 2. De eerste aankoop trekt exact de catalogusprijs af.
    expect(firstItem().get('button').attributes('disabled')).toBeUndefined()
    expect(firstItem().get('button').text()).toBe('Koop upgrade')

    await firstItem().get('button').trigger('click')
    await nextTick()

    expect(getExposedApi(wrapper).gameState.upgrades).toEqual([cheapest.id])
    expect(getExposedApi(wrapper).gameState.coins).toBe(earnedCoins - firstCost)

    // 3. De herberekende kost staat direct in het item.
    expect(firstItem().get('.upgrade-item__badge').text()).toBe('Gekocht 1×')
    expect(firstItem().get('.upgrade-item__facts').text()).toContain(
      `${secondCost} munten`,
    )

    // 4. De tweede aankoop kost de hogere prijs.
    await firstItem().get('button').trigger('click')
    await nextTick()

    expect(getExposedApi(wrapper).gameState.upgrades).toEqual([
      cheapest.id,
      cheapest.id,
    ])
    expect(getExposedApi(wrapper).gameState.coins).toBe(
      earnedCoins - firstCost - secondCost,
    )

    // 5. De derde catalogusprijs volgt exact dezelfde formule.
    expect(firstItem().get('.upgrade-item__badge').text()).toBe('Gekocht 2×')
    expect(firstItem().get('.upgrade-item__facts').text()).toContain(
      `${thirdCost} munten`,
    )

    // 6. clickPower is met twee +10%-upgrades 1.1 * 1.1 = 1.21, dus een order
    // vraagt minder clicks dan zijn requiredPoints.
    const clicksBeforeUpgrade = getExposedApi(wrapper)
      .gameState.completedOrderCount

    await gotoView(wrapper, 'smithy')
    const orderAfterUpgrade = await chooseOrder(wrapper, 0)
    const clicksNeeded = Math.ceil(orderAfterUpgrade.requiredPoints / 1.21)

    expect(clicksNeeded).toBeLessThan(orderAfterUpgrade.requiredPoints)

    await clickAnvil(wrapper, clicksNeeded)

    expect(getExposedApi(wrapper).gameState.completedOrderCount).toBe(
      clicksBeforeUpgrade + 1,
    )

    // 7. De coinbalans blijft nooit negatief.
    expect(getExposedApi(wrapper).gameState.coins).toBeGreaterThanOrEqual(0)

    wrapper.unmount()
  })

  it('never lets the coin balance go negative while buying greedily', async () => {
    storeState({
      points: 9,
      projectProgress: { 1: 9 },
    })
    const wrapper = mount(App)

    await clickAnvil(wrapper, 1)

    for (const index of [0, 1]) {
      await completeOrder(wrapper, index)
    }

    await gotoView(wrapper, 'upgrades')

    const shop = wrapper.getComponent(UpgradeShop)
    const boughtSomething = getExposedApi(wrapper).gameState.upgrades.length

    for (let round = 0; round < 3; round += 1) {
      for (const button of shop.findAll('.upgrade-item__button')) {
        if (button.attributes('disabled') === undefined) {
          await button.trigger('click')
          await nextTick()
        }

        expect(getExposedApi(wrapper).gameState.coins).toBeGreaterThanOrEqual(0)
      }
    }

    expect(getExposedApi(wrapper).gameState.upgrades.length).toBeGreaterThan(
      boughtSomething,
    )
    expect(getExposedApi(wrapper).gameState.coins).toBeGreaterThanOrEqual(0)

    wrapper.unmount()
  })
})