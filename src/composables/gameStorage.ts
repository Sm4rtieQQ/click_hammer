import type { GameState, WorkOrder } from '../types/game'
import { createInitialGameState } from '../types/game'
import { normalizeGameState } from '../types/gameStateNormalization'

export const GAME_STORAGE_KEY = 'click-hammer:game-state'

export interface GameStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type GameStateSnapshot = {
  readonly points: GameState['points']
  readonly coins: GameState['coins']
  readonly completedProjects: readonly number[]
  readonly upgrades: readonly number[]
  readonly projectProgress: Readonly<Record<number, number>>
  readonly completedOrderCount: number
  readonly nextOrderId: number
  readonly offeredOrders: readonly WorkOrder[]
  readonly activeOrder: WorkOrder | null
  readonly autoClickerUnlocked: boolean
}

function getStorage(storage?: GameStorage): GameStorage {
  return storage ?? window.localStorage
}

export function serializeGameState(state: GameStateSnapshot): string {
  const snapshot: GameStateSnapshot = {
    points: state.points,
    coins: state.coins,
    completedProjects: [...state.completedProjects],
    upgrades: [...state.upgrades],
    projectProgress: { ...state.projectProgress },
    completedOrderCount: state.completedOrderCount,
    nextOrderId: state.nextOrderId,
    offeredOrders: state.offeredOrders.map((order) => ({ ...order })),
    activeOrder: state.activeOrder === null ? null : { ...state.activeOrder },
    autoClickerUnlocked: state.autoClickerUnlocked,
  }

  return JSON.stringify(snapshot)
}

export function saveGameState(
  state: GameStateSnapshot,
  storage?: GameStorage,
): boolean {
  try {
    getStorage(storage).setItem(GAME_STORAGE_KEY, serializeGameState(state))
    return true
  } catch {
    return false
  }
}

export type GameLoadStatus =
  | 'restored'
  | 'fresh'
  | 'recovered'
  | 'unavailable'

export interface GameLoadResult {
  readonly state: GameState
  readonly status: GameLoadStatus
}

export function loadGameStateResult(storage?: GameStorage): GameLoadResult {
  let targetStorage: GameStorage

  try {
    targetStorage = getStorage(storage)
  } catch {
    return { state: createInitialGameState(), status: 'unavailable' }
  }

  let serializedState: string | null

  try {
    serializedState = targetStorage.getItem(GAME_STORAGE_KEY)
  } catch {
    return { state: createInitialGameState(), status: 'unavailable' }
  }

  if (serializedState === null) {
    return { state: createInitialGameState(), status: 'fresh' }
  }

  try {
    const parsedState = JSON.parse(serializedState) as unknown
    const normalizedState = normalizeGameState(parsedState)
    const wasNormalized =
      JSON.stringify(parsedState) !== JSON.stringify(normalizedState)

    if (wasNormalized) {
      saveGameState(normalizedState, targetStorage)
    }

    return {
      state: normalizedState,
      status: wasNormalized ? 'recovered' : 'restored',
    }
  } catch {
    return { state: createInitialGameState(), status: 'recovered' }
  }
}

export function loadGameState(storage?: GameStorage): GameState {
  return loadGameStateResult(storage).state
}
