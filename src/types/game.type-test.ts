import type {
  GameState,
  Item,
  Material,
  Project,
  Upgrade,
  WorkOrder,
} from './game'

const upgrade: Upgrade = {
  id: 101,
  name: 'Stronger Hammer',
  description: 'Improves the hammer power.',
  baseCost: 10,
  costMultiplier: 1.5,
  clickBonus: 10,
}

const project: Project = {
  id: 1,
  name: 'Repair the anvil',
  description: 'Repair the anvil before starting the next project.',
  unlockPoints: 0,
  requiredPoints: 10,
  coinReward: 0,
}

const material: Material = {
  id: 1,
  name: 'Brons',
  adjective: 'bronzen',
  pointMultiplier: 1,
  coinMultiplier: 1,
}

const item: Item = {
  id: 1,
  name: 'hoefijzers',
  pointMultiplier: 1,
  coinMultiplier: 1,
}

const workOrder: WorkOrder = {
  id: 1,
  materialId: 1,
  itemId: 1,
  quantity: 10,
  progress: 0,
  requiredPoints: 10,
  coinReward: 10,
}

const gameState: GameState = {
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

void upgrade
void project
void material
void item
void workOrder
void gameState
