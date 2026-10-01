import type { Project } from '../types/game'

export const projects: Project[] = [
  {
    id: 1,
    name: 'Herstel het aambeeld',
    description: 'Herstel het aambeeld om de smidse weer aan het werk te krijgen.',
    unlockPoints: 0,
    requiredPoints: 10,
    coinReward: 0,
  },
  {
    id: 2,
    name: 'Bouw de smidse',
    description: 'Bouw een nieuwe smidse voor de volgende projecten.',
    unlockPoints: 1_000,
    requiredPoints: 100_000,
    coinReward: 5_000_000,
  },
  {
    id: 3,
    name: 'Bevrijd de vesting',
    description: 'Bevrijd de vesting en voltooi de wereld van ClickHammer.',
    unlockPoints: 25_000_000,
    requiredPoints: 250_000_000_000,
    coinReward: 500_000_000,
  },
]
