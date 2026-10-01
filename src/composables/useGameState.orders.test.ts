import { describe, expect, it } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import { useGameState } from './useGameState'

function afterFirstProject(overrides = {}) {
  return useGameState(
    createTestGameState({
      points: 10,
      completedProjects: [1],
      projectProgress: { 1: 10 },
      ...overrides,
    }),
  )
}

describe('repeatable orders', () => {
  it('keeps orders locked until the first project is complete', () => {
    const { gameState, addPoints, offeredOrders, activeOrder } = useGameState()

    addPoints('order')

    expect(offeredOrders.value).toEqual([])
    expect(activeOrder.value).toBeNull()
    expect(gameState.points).toBe(0)
  })

  it('offers two orders with different items after the first project', () => {
    const { offeredOrders } = afterFirstProject()

    expect(offeredOrders.value).toHaveLength(2)
    expect(offeredOrders.value[0].itemId).not.toBe(
      offeredOrders.value[1].itemId,
    )
  })

  it('selects one of two orders and tracks its progress', () => {
    const {
      gameState,
      offeredOrders,
      activeOrder,
      selectOrder,
      addPoints,
    } = afterFirstProject()
    const selectedOrder = offeredOrders.value[1]

    selectOrder(selectedOrder.id)
    addPoints('order')

    expect(activeOrder.value?.id).toBe(selectedOrder.id)
    expect(activeOrder.value?.progress).toBe(1)
    expect(gameState.offeredOrders).toEqual([])
  })

  it('completes an order once, pays the reward and offers two new orders', () => {
    const {
      gameState,
      offeredOrders,
      selectOrder,
      addPoints,
    } = afterFirstProject()
    const selectedOrder = offeredOrders.value[1]
    selectOrder(selectedOrder.id)

    for (let click = 0; click < selectedOrder.requiredPoints; click += 1) {
      addPoints('order')
    }

    expect(gameState.activeOrder).toBeNull()
    expect(gameState.completedOrderCount).toBe(1)
    expect(gameState.coins).toBe(10)
    expect(gameState.offeredOrders).toHaveLength(2)
    expect(gameState.nextOrderId).toBe(5)
  })

  it('does not accept an order selection before the first project', () => {
    const { selectOrder, activeOrder } = useGameState()

    selectOrder(1)

    expect(activeOrder.value).toBeNull()
  })
})

describe('project unlocks', () => {
  it('only exposes completed projects and the next project', () => {
    const { visibleProjects } = afterFirstProject({
      points: 10,
    })

    expect(visibleProjects.value.map(({ id }) => id)).toEqual([1, 2])
  })

  it('makes the next project active only after its point threshold', () => {
    const { activeProject, addPoints, gameState } = afterFirstProject({
      points: 1_000,
    })

    expect(activeProject.value?.id).toBe(2)
    addPoints('project')

    expect(gameState.projectProgress[2]).toBe(1)
  })
})
