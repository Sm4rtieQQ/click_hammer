import type { Material } from '../types/game'

export const materials: Material[] = [
  {
    id: 1,
    name: 'Brons',
    adjective: 'bronzen',
    pointMultiplier: 1,
    coinMultiplier: 1,
  },
  {
    id: 2,
    name: 'IJzer',
    adjective: 'ijzeren',
    pointMultiplier: 4,
    coinMultiplier: 2,
  },
  {
    id: 3,
    name: 'Staal',
    adjective: 'stalen',
    pointMultiplier: 12,
    coinMultiplier: 4,
  },
  {
    id: 4,
    name: 'Verzilverd',
    adjective: 'verzilverde',
    pointMultiplier: 36,
    coinMultiplier: 8,
  },
  {
    id: 5,
    name: 'Verguld',
    adjective: 'vergulde',
    pointMultiplier: 100,
    coinMultiplier: 16,
  },
]
