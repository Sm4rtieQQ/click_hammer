import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../types/game'
import {
  GAME_STORAGE_KEY,
  loadGameState,
  saveGameState,
  serializeGameState,
} from './gameStorage'
import type { GameStorage } from './gameStorage'

class FakeStorage implements GameStorage {
  readonly values = new Map<string, string>()
  writeCount = 0

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.writeCount += 1
    this.values.set(key, value)
  }
}

describe('game storage adapter', () => {
  it('serializes exactly the necessary game state fields', () => {
    const state = {
      ...createInitialGameState(),
      points: 12.5,
      coins: 7,
      completedProjects: [1],
      upgrades: [101, 101],
      projectProgress: { 1: 10 },
    }

    const serializedState = serializeGameState(state)

    expect(Object.keys(JSON.parse(serializedState) as object).sort()).toEqual([
      'activeOrder',
      'coins',
      'completedOrderCount',
      'completedProjects',
      'nextOrderId',
      'offeredOrders',
      'points',
      'projectProgress',
      'upgrades',
    ])
    expect(JSON.parse(serializedState)).toEqual(state)
  })

  it('saves under one explicit key with one write', () => {
    const storage = new FakeStorage()
    const state = createInitialGameState()

    expect(saveGameState(state, storage)).toBe(true)
    expect(storage.writeCount).toBe(1)
    expect([...storage.values.keys()]).toEqual([GAME_STORAGE_KEY])
    expect(loadGameState(storage)).toEqual(state)
  })

  it('returns the initial state when storage is empty', () => {
    const storage = new FakeStorage()

    expect(loadGameState(storage)).toEqual(createInitialGameState())
  })

  it('creates serialized data independent from later state mutations', () => {
    const state = createInitialGameState()
    const serializedState = serializeGameState(state)

    state.points = 20
    state.upgrades.push(101)

    expect(JSON.parse(serializedState)).toEqual(createInitialGameState())
  })
})
