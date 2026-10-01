export interface Upgrade {
  id: number
  name: string
  description: string
  baseCost: number
  costMultiplier: number
  clickBonus: number
  autoClickerUnlocker?: boolean
  maxPurchases?: number
  devOnly?: boolean
}

export interface Material {
  id: number
  name: string
  adjective: string
  pointMultiplier: number
  coinMultiplier: number
}

export interface Item {
  id: number
  name: string
  pointMultiplier: number
  coinMultiplier: number
}

export interface OrderDefinition {
  materialId: number
  itemId: number
  unlockRank: number
}

export interface WorkOrder {
  id: number
  materialId: number
  itemId: number
  quantity: number
  progress: number
  requiredPoints: number
  coinReward: number
}

export interface Project {
  id: number
  name: string
  description: string
  unlockPoints: number
  requiredPoints: number
  coinReward: number
}

export interface GameState {
  points: number
  coins: number
  completedProjects: number[]
  upgrades: number[]
  projectProgress: Record<number, number>
  completedOrderCount: number
  nextOrderId: number
  offeredOrders: WorkOrder[]
  activeOrder: WorkOrder | null
  autoClickerUnlocked: boolean
}

export function createInitialGameState(): GameState {
  return {
    points: 0,
    coins: 0,
    completedProjects: [],
    upgrades: [],
    projectProgress: {},
    completedOrderCount: 0,
    nextOrderId: 1,
    offeredOrders: [],
    activeOrder: null,
    autoClickerUnlocked: false,
  }
}
