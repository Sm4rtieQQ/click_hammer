import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import { createOfferedOrders, getOrderDefinition, createWorkOrder } from '../data/orders'
import { upgrades } from '../data/upgrades'
import { createInitialGameState } from './game'
import type { GameState } from './game'
import {
  isFiniteNumber,
  isGameState,
  isNonNegativeInteger,
  isNonNegativeNumber,
  isProjectId,
  isProjectIdArray,
  isProjectProgressRecord,
  isUpgradeId,
  isUpgradeIdArray,
  normalizeGameState,
} from './gameStateNormalization'
import { createTestGameState } from '../test/fixtures'

const validState: GameState = {
  ...createTestGameState({
    points: 1.21,
    coins: 5,
    completedProjects: [1],
    upgrades: [101, 101, 102],
    projectProgress: { 1: 10 },
    completedOrderCount: 0,
    nextOrderId: 3,
    offeredOrders: createOfferedOrders(1.21, 0, 1),
    activeOrder: null,
  }),
}

describe('state validators', () => {
  it('validates finite, non-negative numbers and integers', () => {
    expect(isFiniteNumber(1.21)).toBe(true)
    expect(isFiniteNumber(Number.NaN)).toBe(false)
    expect(isFiniteNumber(Number.POSITIVE_INFINITY)).toBe(false)
    expect(isNonNegativeNumber(0)).toBe(true)
    expect(isNonNegativeNumber(-0.01)).toBe(false)
    expect(isNonNegativeInteger(10)).toBe(true)
    expect(isNonNegativeInteger(1.21)).toBe(false)
  })

  it('recognizes only IDs from the catalogs', () => {
    expect(projects.every(({ id }) => isProjectId(id))).toBe(true)
    expect(projects.every(({ id }) => !isProjectId(id + 1000))).toBe(true)
    expect(isProjectId('1')).toBe(false)

    expect(upgrades.every(({ id }) => isUpgradeId(id))).toBe(true)
    expect(upgrades.every(({ id }) => !isUpgradeId(id + 1000))).toBe(true)
    expect(isUpgradeId('101')).toBe(false)
  })

  it('validates arrays of catalog IDs', () => {
    const projectIds = projects.map(({ id }) => id)
    const upgradeIds = upgrades.map(({ id }) => id)

    expect(isProjectIdArray(projectIds)).toBe(true)
    expect(isProjectIdArray([...projectIds, 999, '1'])).toBe(false)
    expect(isUpgradeIdArray(upgradeIds)).toBe(true)
    expect(isUpgradeIdArray([upgradeIds[0], upgradeIds[0]])).toBe(true)
    expect(isUpgradeIdArray([...upgradeIds, 999])).toBe(false)
  })

  it('validates project progress records', () => {
    expect(isProjectProgressRecord({})).toBe(true)
    expect(isProjectProgressRecord({ 1: 0, 2: 3.5, 3: 50 })).toBe(true)
    expect(isProjectProgressRecord([])).toBe(false)
    expect(isProjectProgressRecord({ 1: -1 })).toBe(false)
    expect(isProjectProgressRecord({ 1: Number.NaN })).toBe(false)
    expect(isProjectProgressRecord({ 1: 11 })).toBe(false)
    expect(isProjectProgressRecord({ 999: 1 })).toBe(false)
  })

  it('accepts a complete valid state and rejects inconsistent state', () => {
    expect(isGameState(validState)).toBe(true)
    expect(isGameState({ ...validState, completedProjects: [1, 1] })).toBe(false)
    expect(isGameState({ ...validState, points: Number.NaN })).toBe(false)
    expect(isGameState({ ...validState, upgrades: [999] })).toBe(false)
    expect(isGameState({ ...validState, projectProgress: { 1: 9 } })).toBe(false)
    expect(isGameState({ ...validState, activeOrder: {} })).toBe(false)
  })
})

describe('normalizeGameState', () => {
  it('preserves a valid state and removes extra fields', () => {
    const stateWithExtraField = {
      ...validState,
      unexpected: 'ignored',
    }

    const normalizedState = normalizeGameState(stateWithExtraField)

    expect(normalizedState).toEqual(validState)
    expect(normalizedState).not.toBe(stateWithExtraField)
  })

  it('replaces an old save that has no order state', () => {
    expect(
      normalizeGameState({
        points: 4,
        coins: 42,
        completedProjects: [1],
        upgrades: [101],
        projectProgress: { 1: 10 },
      }),
    ).toEqual(createInitialGameState())
  })

  it('resets invalid and negative scalar values', () => {
    expect(
      normalizeGameState(
        createTestGameState({
          points: Number.NaN,
          coins: -5,
        }),
      ),
    ).toEqual(createInitialGameState())

    expect(
      normalizeGameState(
        createTestGameState({ points: Number.POSITIVE_INFINITY }),
      ).points,
    ).toBe(0)
    expect(normalizeGameState(createTestGameState({ coins: 1.5 })).coins).toBe(0)
  })

  it('removes unknown IDs and duplicate project completions', () => {
    expect(
      normalizeGameState(
        createTestGameState({
          points: 5,
          completedProjects: [999, 1, 1, '2', Number.NaN] as unknown as number[],
          upgrades: [101, 101, 999, 102, Number.NaN] as unknown as number[],
          projectProgress: { 1: 10, 999: 100, '-2': 1 },
        }),
      ),
    ).toMatchObject({
      points: 5,
      coins: 0,
      completedProjects: [1],
      upgrades: [101, 101, 102],
      projectProgress: { 1: 10 },
      completedOrderCount: 0,
    })
  })

  it('resets invalid progress and caps progress at the project target', () => {
    expect(
      normalizeGameState(
        createTestGameState({
          projectProgress: {
            1: -10,
            2: Number.NaN,
            3: 100,
          },
        }),
      ).projectProgress,
    ).toEqual({
      1: 0,
      2: 0,
      3: 100,
    })
  })

  it('uses completed projects as the source of truth for full progress', () => {
    expect(
      normalizeGameState(
        createTestGameState({
          points: 25_000_000,
          completedProjects: [1, 2],
          projectProgress: { 1: 3, 2: 20 },
        }),
      ).projectProgress,
    ).toEqual({
      1: 10,
      2: 100_000,
    })
  })

  it('regenerates invalid offers after the first project', () => {
    const normalized = normalizeGameState(
      createTestGameState({
        points: 10,
        completedProjects: [1],
        projectProgress: { 1: 10 },
        offeredOrders: [],
      }),
    )

    expect(normalized.offeredOrders).toHaveLength(2)
    expect(normalized.offeredOrders[0].itemId).not.toBe(
      normalized.offeredOrders[1].itemId,
    )
    expect(normalized.nextOrderId).toBe(3)
  })

  it('rejects an active order with an unknown material or item', () => {
    const definition = getOrderDefinition(1, 1)
    if (definition === undefined) {
      throw new Error('Missing test order definition')
    }
    const activeOrder = createWorkOrder(1, definition, 0)

    const normalized = normalizeGameState(
      createTestGameState({
        completedProjects: [1],
        projectProgress: { 1: 10 },
        activeOrder: { ...activeOrder, materialId: 999 },
        nextOrderId: 2,
      }),
    )

    expect(normalized.activeOrder).toBeNull()
    expect(normalized.offeredOrders).toHaveLength(2)
  })

  it.each([null, undefined, 'corrupt', 42, true, []])(
    'falls back safely for malformed root value %s',
    (value) => {
      expect(() => normalizeGameState(value)).not.toThrow()
      expect(normalizeGameState(value)).toEqual(createInitialGameState())
    },
  )

  it('falls back safely for malformed collections and records', () => {
    const state = {
      points: 2,
      coins: 1,
      completedProjects: {},
      upgrades: 'not-an-array',
      projectProgress: [],
    }

    expect(() => normalizeGameState(state)).not.toThrow()
    expect(normalizeGameState(state)).toEqual(createInitialGameState())
  })

  it('returns independent mutable collections', () => {
    const normalizedState = normalizeGameState(validState)

    normalizedState.completedProjects.push(2)
    normalizedState.upgrades.push(103)
    normalizedState.projectProgress[2] = 1

    expect(validState.completedProjects).toEqual([1])
    expect(validState.upgrades).toEqual([101, 101, 102])
    expect(validState.projectProgress).toEqual({ 1: 10 })
  })
})
