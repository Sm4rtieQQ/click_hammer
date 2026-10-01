import { computed, onUnmounted, ref, watch } from 'vue'
import type { ComputedRef, DeepReadonly, WatchStopHandle } from 'vue'
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
  readonly hasWriteError: ComputedRef<boolean>
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
  const writeFailed = ref(false)

  function clearSaveTimeout(): void {
    if (saveTimeoutId === undefined) {
      return
    }

    window.clearTimeout(saveTimeoutId)
    saveTimeoutId = undefined
  }

  function saveNow(): boolean {
    clearSaveTimeout()

    const didSave = saveGameState(gameState, options.storage)

    writeFailed.value = !didSave

    return didSave
  }

  function scheduleSave(): void {
    if (isStopped) {
      return
    }

    clearSaveTimeout()
    saveTimeoutId = window.setTimeout(() => {
      saveTimeoutId = undefined

      const didSave = saveGameState(gameState, options.storage)

      writeFailed.value = !didSave
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

  const hasWriteError = computed(() => writeFailed.value)

  return {
    saveNow,
    stop,
    hasWriteError,
  }
}
