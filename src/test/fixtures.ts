import { createInitialGameState } from '../types/game'
import type { GameState } from '../types/game'

export function createTestGameState(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    ...createInitialGameState(),
    ...overrides,
  }
}
