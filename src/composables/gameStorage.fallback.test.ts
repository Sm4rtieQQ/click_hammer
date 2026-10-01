import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../types/game'
import { createTestGameState } from '../test/fixtures'
import {
  GAME_STORAGE_KEY,
  loadGameState,
  saveGameState,
} from './gameStorage'
import type { GameStorage } from './gameStorage'

class ReadableStorage implements GameStorage {
  writtenState: string | null = null

  constructor(private readonly serializedState: string) {}

  getItem(): string | null {
    return this.serializedState
  }

  setItem(_key: string, value: string): void {
    this.writtenState = value
  }
}

class ThrowingStorage implements GameStorage {
  getItem(): string | null {
    throw new Error('Storage read failed')
  }

  setItem(): void {
    throw new Error('Storage write failed')
  }
}

describe('safe game storage loading', () => {
  it('replaces an old save that has no order state', () => {
    const storage = new ReadableStorage(
      JSON.stringify({
        points: 4,
        coins: 2,
        completedProjects: [1],
        upgrades: [],
        projectProgress: { 1: 10 },
      }),
    )

    expect(() => loadGameState(storage)).not.toThrow()
    expect(loadGameState(storage)).toEqual(createInitialGameState())
    expect(storage.writtenState).toBe(JSON.stringify(createInitialGameState()))
  })

  it('normalizes unknown IDs and wrong field types in a current save', () => {
    const storage = new ReadableStorage(
      JSON.stringify(
        createTestGameState({
          points: 5,
          coins: 0,
          completedProjects: [],
          upgrades: [101, 999, '102'] as unknown as number[],
          projectProgress: { 1: 10, 999: 100 },
        }),
      ),
    )

    expect(loadGameState(storage)).toEqual({
      ...createInitialGameState(),
      points: 5,
      upgrades: [101],
      projectProgress: { 1: 10 },
    })
  })

  it.each([
    '{not valid json',
    JSON.stringify(null),
    JSON.stringify([]),
    JSON.stringify('corrupt'),
  ])('falls back to the initial state for unusable JSON', (serializedState) => {
    const storage = new ReadableStorage(serializedState)

    expect(() => loadGameState(storage)).not.toThrow()
    expect(loadGameState(storage)).toEqual(createInitialGameState())
  })

  it('falls back when reading storage throws', () => {
    const storage = new ThrowingStorage()

    expect(() => loadGameState(storage)).not.toThrow()
    expect(loadGameState(storage)).toEqual(createInitialGameState())
  })

  it('reports a failed write without throwing', () => {
    const storage = new ThrowingStorage()

    expect(() => saveGameState(createInitialGameState(), storage)).not.toThrow()
    expect(saveGameState(createInitialGameState(), storage)).toBe(false)
  })

  it('uses the documented key for successful writes', () => {
    const values = new Map<string, string>()
    const storage: GameStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    }

    expect(saveGameState(createInitialGameState(), storage)).toBe(true)
    expect(values.has(GAME_STORAGE_KEY)).toBe(true)
  })
})
