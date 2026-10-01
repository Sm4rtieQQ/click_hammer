import type {
  Item,
  Material,
  OrderDefinition,
  WorkOrder,
} from '../types/game'
import { items } from './items'
import { materials } from './materials'

const orderRanks: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0],
  [1, 2, 1],
  [1, 3, 2],
  [1, 4, 3],
  [1, 5, 4],
  [1, 6, 5],
  [1, 7, 6],
  [2, 1, 7],
  [2, 2, 8],
  [2, 3, 9],
  [1, 8, 10],
  [2, 4, 11],
  [3, 1, 12],
  [1, 9, 13],
  [2, 5, 14],
  [3, 2, 15],
  [2, 6, 16],
  [3, 3, 17],
  [1, 10, 18],
  [2, 7, 19],
  [3, 4, 20],
  [4, 1, 21],
  [2, 8, 22],
  [3, 5, 23],
  [5, 2, 24],
  [2, 9, 25],
  [3, 6, 26],
  [2, 10, 27],
  [4, 2, 28],
  [3, 7, 29],
  [5, 1, 30],
  [5, 3, 31],
  [3, 8, 32],
  [4, 3, 33],
  [5, 4, 34],
  [3, 9, 35],
  [4, 4, 36],
  [3, 10, 37],
  [4, 5, 38],
  [5, 5, 39],
  [4, 6, 40],
  [4, 7, 41],
  [5, 6, 42],
  [4, 8, 43],
  [5, 7, 44],
  [4, 9, 45],
  [5, 8, 46],
  [4, 10, 47],
  [5, 9, 48],
  [5, 10, 49],
]

const materialById = new Map<number, Material>(
  materials.map((material) => [material.id, material]),
)
const itemById = new Map<number, Item>(
  items.map((item) => [item.id, item]),
)

export const orderDefinitions: OrderDefinition[] = orderRanks.map(
  ([materialId, itemId, unlockRank]) => ({
    materialId,
    itemId,
    unlockRank,
  }),
)

const orderDefinitionByMaterialAndItem = new Map<string, OrderDefinition>()

for (const definition of orderDefinitions) {
  orderDefinitionByMaterialAndItem.set(
    `${definition.materialId}:${definition.itemId}`,
    definition,
  )
}

export function getOrderUnlockPoints(unlockRank: number): number {
  if (unlockRank <= 1) {
    return 0
  }

  return Math.round(50 * 1.23 ** (unlockRank - 2))
}

export function getOrderDefinition(
  materialId: number,
  itemId: number,
): OrderDefinition | undefined {
  return orderDefinitionByMaterialAndItem.get(`${materialId}:${itemId}`)
}

export function getOrderQuantity(completedOrderCount: number): number {
  return Math.min(
    10_000,
    Math.max(10, Math.round(10 * 1.4 ** completedOrderCount)),
  )
}

export function createWorkOrder(
  id: number,
  definition: OrderDefinition,
  completedOrderCount: number,
  progress = 0,
): WorkOrder {
  const material = materialById.get(definition.materialId)
  const item = itemById.get(definition.itemId)

  if (material === undefined || item === undefined) {
    throw new Error('Order definition refers to an unknown material or item')
  }

  const quantity = getOrderQuantity(completedOrderCount)
  const requiredPoints = Math.max(
    quantity,
    Math.ceil(quantity * material.pointMultiplier * item.pointMultiplier),
  )
  const coinReward = Math.max(
    1,
    Math.floor(quantity * material.coinMultiplier * item.coinMultiplier),
  )

  return {
    id,
    materialId: material.id,
    itemId: item.id,
    quantity,
    progress,
    requiredPoints,
    coinReward,
  }
}

const sortedOrderDefinitions = [...orderDefinitions].sort(
  (first, second) => second.unlockRank - first.unlockRank,
)

export function getOfferedOrderDefinitions(
  points: number,
): OrderDefinition[] {
  const unlockedDefinitions = sortedOrderDefinitions.filter(
    (definition) =>
      getOrderUnlockPoints(definition.unlockRank) <= points,
  )
  const firstDefinition = unlockedDefinitions[0]

  if (firstDefinition === undefined) {
    return []
  }

  const secondDefinition = unlockedDefinitions.find(
    (definition) => definition.itemId !== firstDefinition.itemId,
  )

  if (secondDefinition === undefined) {
    return [firstDefinition]
  }

  return [firstDefinition, secondDefinition]
}

export function createOfferedOrders(
  points: number,
  completedOrderCount: number,
  startId: number,
): WorkOrder[] {
  return getOfferedOrderDefinitions(points).map((definition, index) =>
    createWorkOrder(startId + index, definition, completedOrderCount),
  )
}

export function formatOrderCommand(order: WorkOrder): string {
  const material = materialById.get(order.materialId)
  const item = itemById.get(order.itemId)

  if (material === undefined || item === undefined) {
    return 'smeed onbekend materiaal onbekend item'
  }

  const formattedQuantity = new Intl.NumberFormat('nl-NL').format(order.quantity)
  return `smeed ${formattedQuantity} ${material.adjective} ${item.name}`
}
