import { describe, expect, it } from 'vitest'
import { createInitialGameState } from '../types/game'
import { createTestGameState } from '../test/fixtures'
import {
  GAME_STORAGE_KEY,
  loadGameState,
  loadGameStateResult,
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

describe('game load status reporting', () => {
  it('reports fresh when nothing was stored', () => {
    const storage: GameStorage = {
      getItem: () => null,
      setItem: () => undefined,
    }

    expect(loadGameStateResult(storage)).toEqual({
      state: createInitialGameState(),
      status: 'fresh',
    })
  })

  it('reports restored when the stored state is already valid', () => {
    const storage = new ReadableStorage(
      JSON.stringify(createTestGameState({ points: 7 })),
    )

    expect(loadGameStateResult(storage)).toEqual({
      state: createTestGameState({ points: 7 }),
      status: 'restored',
    })
  })

  it('reports recovered when an old save without order fields is replaced', () => {
    const storage = new ReadableStorage(
      JSON.stringify({ points: 4, completedProjects: [1] }),
    )

    expect(loadGameStateResult(storage)).toEqual({
      state: createInitialGameState(),
      status: 'recovered',
    })
  })

  it.each(['{not valid json', JSON.stringify('corrupt')])(
    'reports recovered for unusable stored data (%j)',
    (serializedState) => {
      const storage = new ReadableStorage(serializedState)

      expect(loadGameStateResult(storage)).toEqual({
        state: createInitialGameState(),
        status: 'recovered',
      })
    },
  )

  it('reports unavailable when reading storage throws', () => {
    expect(loadGameStateResult(new ThrowingStorage())).toEqual({
      state: createInitialGameState(),
      status: 'unavailable',
    })
  })
})
