import { onUnmounted, watch } from 'vue'
import type { DeepReadonly, WatchStopHandle } from 'vue'
import type { GameState } from '../types/game'
import { saveGameState } from './gameStorage'
import type { GameStorage } from './gameStorage'

export const DEFAULT_PERSISTENCE_DEBOUNCE_MS = 250

export interface UseGamePersistenceOptions {
  readonly storage?: GameStorage
  readonly debounceMs?: number
}

export interface UseGamePersistenceReturn {
  readonly saveNow: () => boolean
  readonly stop: () => void
}

export function useGamePersistence(
  gameState: DeepReadonly<GameState>,
  options: UseGamePersistenceOptions = {},
): UseGamePersistenceReturn {
  const debounceMs = Math.max(
    0,
    options.debounceMs ?? DEFAULT_PERSISTENCE_DEBOUNCE_MS,
  )
  let saveTimeoutId: number | undefined
  let isStopped = false
  let stopWatching: WatchStopHandle | undefined

  function clearSaveTimeout(): void {
    if (saveTimeoutId === undefined) {
      return
    }

    window.clearTimeout(saveTimeoutId)
    saveTimeoutId = undefined
  }

  function saveNow(): boolean {
    clearSaveTimeout()
    return saveGameState(gameState, options.storage)
  }

  function scheduleSave(): void {
    if (isStopped) {
      return
    }

    clearSaveTimeout()
    saveTimeoutId = window.setTimeout(() => {
      saveTimeoutId = undefined
      saveGameState(gameState, options.storage)
    }, debounceMs)
  }

  function stop(): void {
    if (isStopped) {
      return
    }

    isStopped = true
    clearSaveTimeout()
    stopWatching?.()
    stopWatching = undefined
  }

  stopWatching = watch(gameState, scheduleSave, { deep: true })
  onUnmounted(stop)

  return {
    saveNow,
    stop,
  }
}
