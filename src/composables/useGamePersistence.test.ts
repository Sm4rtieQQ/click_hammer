import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import type { PropType } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestGameState } from '../test/fixtures'
import type { GameState } from '../types/game'
import { GAME_STORAGE_KEY } from './gameStorage'
import type { GameStorage } from './gameStorage'
import { useGamePersistence } from './useGamePersistence'
import type { UseGamePersistenceReturn } from './useGamePersistence'
import { useGameState } from './useGameState'
import type { UseGameStateReturn } from './useGameState'

class FakeStorage implements GameStorage {
  readonly values = new Map<string, string>()
  writeCount = 0
  throwOnWrite = false

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.writeCount += 1

    if (this.throwOnWrite) {
      throw new Error('Storage write failed')
    }

    this.values.set(key, value)
  }
}

interface MountedGame {
  readonly wrapper: ReturnType<typeof mount>
  readonly game: UseGameStateReturn
  readonly persistence: UseGamePersistenceReturn
}

const PersistenceHarness = defineComponent({
  props: {
    storage: {
      type: Object as PropType<GameStorage>,
      required: true,
    },
    initialState: {
      type: Object as PropType<object>,
      required: true,
    },
    debounceMs: {
      type: Number,
      default: 100,
    },
  },
  setup(props) {
    const game = useGameState(
      createTestGameState(props.initialState as Partial<GameState>),
    )
    const persistence = useGamePersistence(game.gameState, {
      storage: props.storage,
      debounceMs: props.debounceMs,
    })

    return { game, persistence }
  },
  render: () => null,
})

function mountPersistence(
  storage: GameStorage,
  initialState: object = createTestGameState(),
  debounceMs = 100,
): MountedGame {
  const wrapper = mount(PersistenceHarness, {
    props: { storage, initialState, debounceMs },
  })
  const exposed = wrapper.vm as unknown as {
    game: UseGameStateReturn
    persistence: UseGamePersistenceReturn
  }

  if (exposed.game === undefined || exposed.persistence === undefined) {
    throw new Error('Failed to mount persistence test harness')
  }

  return {
    wrapper,
    game: exposed.game,
    persistence: exposed.persistence,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useGamePersistence', () => {
  it('debounces a burst of clicks into one write', async () => {
    const storage = new FakeStorage()
    const { game } = mountPersistence(storage)

    for (let click = 0; click < 10; click += 1) {
      game.addPoints()
    }

    await nextTick()
    expect(storage.writeCount).toBe(0)

    vi.advanceTimersByTime(99)
    expect(storage.writeCount).toBe(0)

    vi.advanceTimersByTime(1)
    expect(storage.writeCount).toBe(1)
    expect(JSON.parse(storage.values.get(GAME_STORAGE_KEY) ?? '').points).toBe(10)
  })

  it('persists a successful upgrade purchase', async () => {
    const storage = new FakeStorage()
    const { game } = mountPersistence(storage, { coins: 10 })

    game.buyUpgrade(101)
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(storage.writeCount).toBe(1)
    const savedState = JSON.parse(
      storage.values.get(GAME_STORAGE_KEY) ?? '',
    ) as { coins: number; upgrades: number[] }
    expect(savedState).toMatchObject({ coins: 0, upgrades: [101] })
  })

  it('persists a completed project and its reward', async () => {
    const storage = new FakeStorage()
    const { game } = mountPersistence(storage, {
      points: 9,
      projectProgress: { 1: 9 },
    })

    game.addPoints()
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(storage.writeCount).toBe(1)
    const savedState = JSON.parse(
      storage.values.get(GAME_STORAGE_KEY) ?? '',
    ) as {
      completedProjects: number[]
      coins: number
      projectProgress: Record<number, number>
    }
    expect(savedState).toMatchObject({
      completedProjects: [1],
      coins: 0,
      projectProgress: { 1: 10 },
    })
  })

  it('clears the debounce timer and watcher on unmount', async () => {
    const storage = new FakeStorage()
    const { wrapper, game } = mountPersistence(storage)

    game.addPoints()
    await nextTick()
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
    vi.advanceTimersByTime(1_000)
    expect(storage.writeCount).toBe(0)

    game.addPoints()
    await nextTick()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('handles a storage write error without breaking gameplay', async () => {
    const storage = new FakeStorage()
    storage.throwOnWrite = true
    const { game, persistence } = mountPersistence(storage)

    game.addPoints()
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(game.gameState.points).toBe(1)
    expect(() => persistence.saveNow()).not.toThrow()
    expect(persistence.saveNow()).toBe(false)
  })
})
