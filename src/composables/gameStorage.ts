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

export function loadGameState(storage?: GameStorage): GameState {
  try {
    const targetStorage = getStorage(storage)
    const serializedState = targetStorage.getItem(GAME_STORAGE_KEY)

    if (serializedState === null) {
      return createInitialGameState()
    }

    const parsedState = JSON.parse(serializedState) as unknown
    const normalizedState = normalizeGameState(parsedState)

    if (JSON.stringify(parsedState) !== JSON.stringify(normalizedState)) {
      saveGameState(normalizedState, targetStorage)
    }

    return normalizedState
  } catch {
    return createInitialGameState()
  }
}
