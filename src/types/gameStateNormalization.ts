import { projects } from '../data/projects'
import {
  createOfferedOrders,
  createWorkOrder,
  getOrderDefinition,
} from '../data/orders'
import { materials } from '../data/materials'
import { items } from '../data/items'
import { createInitialGameState } from './game'
import type { GameState, Project, WorkOrder } from './game'
import { upgrades } from '../data/upgrades'

type UnknownRecord = Record<string, unknown>

const projectById = new Map<number, Project>()
const upgradeIds = new Set<number>()
const materialIds = new Set<number>()
const itemIds = new Set<number>()

for (const project of projects) {
  projectById.set(project.id, project)
}

for (const upgrade of upgrades) {
  upgradeIds.add(upgrade.id)
}

for (const material of materials) {
  materialIds.add(material.id)
}

for (const item of items) {
  itemIds.add(item.id)
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

export function isNonNegativeInteger(value: unknown): value is number {
  return isNonNegativeNumber(value) && Number.isInteger(value)
}

export function isProjectId(value: unknown): value is number {
  return isNonNegativeInteger(value) && projectById.has(value)
}

export function isUpgradeId(value: unknown): value is number {
  return isNonNegativeInteger(value) && upgradeIds.has(value)
}

export function isMaterialId(value: unknown): value is number {
  return isNonNegativeInteger(value) && materialIds.has(value)
}

export function isItemId(value: unknown): value is number {
  return isNonNegativeInteger(value) && itemIds.has(value)
}

export function isProjectIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isProjectId)
}

export function isUpgradeIdArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isUpgradeId)
}

export function isProjectProgressRecord(
  value: unknown,
): value is Record<number, number> {
  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(([key, progress]) => {
    const projectId = Number(key)
    const project = projectById.get(projectId)

    return (
      String(projectId) === key &&
      project !== undefined &&
      isNonNegativeNumber(progress) &&
      progress <= project.requiredPoints
    )
  })
}

function normalizeWorkOrder(
  value: unknown,
  completedOrderCount: number,
): WorkOrder | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    !isNonNegativeInteger(value.id) ||
    value.id < 1 ||
    !isMaterialId(value.materialId) ||
    !isItemId(value.itemId) ||
    !isNonNegativeInteger(value.quantity) ||
    value.quantity < 1 ||
    !isNonNegativeNumber(value.progress) ||
    !isNonNegativeNumber(value.requiredPoints) ||
    !isNonNegativeInteger(value.coinReward) ||
    value.coinReward < 1
  ) {
    return null
  }

  const definition = getOrderDefinition(value.materialId, value.itemId)

  if (definition === undefined) {
    return null
  }

  const expectedOrder = createWorkOrder(
    value.id,
    definition,
    completedOrderCount,
  )
  const progress = Math.min(
    Math.max(0, value.progress),
    Math.max(0, expectedOrder.requiredPoints - 1),
  )

  if (
    value.quantity !== expectedOrder.quantity ||
    value.requiredPoints !== expectedOrder.requiredPoints ||
    value.coinReward !== expectedOrder.coinReward
  ) {
    return null
  }

  return {
    ...expectedOrder,
    progress,
  }
}

function isWorkOrder(value: unknown, completedOrderCount: number): boolean {
  return normalizeWorkOrder(value, completedOrderCount) !== null
}

function hasOrderStateShape(value: UnknownRecord): boolean {
  return (
    isNonNegativeInteger(value.completedOrderCount) &&
    isNonNegativeInteger(value.nextOrderId) &&
    value.nextOrderId > 0 &&
    Array.isArray(value.offeredOrders) &&
    (value.activeOrder === null || isRecord(value.activeOrder))
  )
}

function isOrderStateValid(
  completedOrderCount: number,
  nextOrderId: number,
  offeredOrders: unknown,
  activeOrder: unknown,
): boolean {
  if (!Array.isArray(offeredOrders)) {
    return false
  }

  if (offeredOrders.length !== 0 && offeredOrders.length !== 2) {
    return false
  }

  const normalizedOffers = offeredOrders.map((order) =>
    normalizeWorkOrder(order, completedOrderCount),
  )

  if (normalizedOffers.some((order) => order === null)) {
    return false
  }

  const offeredWorkOrders = normalizedOffers as WorkOrder[]
  const offeredIds = new Set(offeredWorkOrders.map((order) => order.id))
  const offeredItems = new Set(offeredWorkOrders.map((order) => order.itemId))

  if (
    offeredIds.size !== offeredWorkOrders.length ||
    offeredItems.size !== offeredWorkOrders.length ||
    offeredWorkOrders.some((order) => order.id >= nextOrderId)
  ) {
    return false
  }

  if (activeOrder === null) {
    return true
  }

  if (offeredWorkOrders.length !== 0) {
    return false
  }

  return isWorkOrder(activeOrder, completedOrderCount)
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || !hasOrderStateShape(value)) {
    return false
  }

  const {
    points,
    coins,
    completedProjects,
    upgrades: purchasedUpgrades,
    projectProgress,
    completedOrderCount,
    nextOrderId,
    offeredOrders,
    activeOrder,
  } = value

  if (
    !isNonNegativeNumber(points) ||
    !isNonNegativeInteger(coins) ||
    !isProjectIdArray(completedProjects) ||
    !isUpgradeIdArray(purchasedUpgrades) ||
    !isProjectProgressRecord(projectProgress) ||
    !isNonNegativeInteger(completedOrderCount) ||
    !isNonNegativeInteger(nextOrderId) ||
    !Array.isArray(offeredOrders) ||
    new Set(completedProjects).size !== completedProjects.length
  ) {
    return false
  }

  if (
    !completedProjects.every((projectId) => {
      const project = projectById.get(projectId)
      return (
        project !== undefined &&
        projectProgress[projectId] === project.requiredPoints
      )
    })
  ) {
    return false
  }

  if (!isOrderStateValid(
    completedOrderCount,
    nextOrderId,
    offeredOrders,
    activeOrder,
  )) {
    return false
  }

  if (!completedProjects.includes(1)) {
    return (
      completedOrderCount === 0 &&
      nextOrderId === 1 &&
      offeredOrders.length === 0 &&
      activeOrder === null
    )
  }

  return true
}

function normalizeCompletedProjects(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const normalizedProjects: number[] = []
  const seenProjectIds = new Set<number>()

  for (const candidate of value as unknown[]) {
    if (isProjectId(candidate) && !seenProjectIds.has(candidate)) {
      seenProjectIds.add(candidate)
      normalizedProjects.push(candidate)
    }
  }

  return normalizedProjects
}

function normalizeUpgradeIds(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return (value as unknown[]).filter(isUpgradeId)
}

function normalizeProjectProgress(
  value: unknown,
  completedProjects: number[],
): Record<number, number> {
  const source = isRecord(value) ? value : {}
  const projectProgress: Record<number, number> = {}

  for (const [key, candidate] of Object.entries(source)) {
    const projectId = Number(key)
    const project = projectById.get(projectId)

    if (String(projectId) !== key || project === undefined) {
      continue
    }

    projectProgress[projectId] = isNonNegativeNumber(candidate)
      ? Math.min(candidate, project.requiredPoints)
      : 0
  }

  for (const projectId of completedProjects) {
    const project = projectById.get(projectId)

    if (project !== undefined) {
      projectProgress[projectId] = project.requiredPoints
    }
  }

  return projectProgress
}

function normalizeOfferedOrders(
  value: unknown,
  completedOrderCount: number,
  nextOrderId: number,
): { orders: WorkOrder[]; nextOrderId: number } {
  const orders: WorkOrder[] = []
  const seenIds = new Set<number>()
  const seenItems = new Set<number>()

  for (const candidate of Array.isArray(value) ? value : []) {
    const order = normalizeWorkOrder(candidate, completedOrderCount)

    if (
      order === null ||
      seenIds.has(order.id) ||
      seenItems.has(order.itemId) ||
      order.id >= nextOrderId
    ) {
      continue
    }

    seenIds.add(order.id)
    seenItems.add(order.itemId)
    orders.push(order)
  }

  if (orders.length !== 2) {
    return { orders: [], nextOrderId }
  }

  return { orders, nextOrderId }
}

export function normalizeGameState(value: unknown): GameState {
  if (!isRecord(value) || !hasOrderStateShape(value)) {
    return createInitialGameState()
  }

  const completedProjects = normalizeCompletedProjects(value.completedProjects)
  const completedOrderCount = isNonNegativeInteger(value.completedOrderCount)
    ? value.completedOrderCount
    : 0
  let nextOrderId = isNonNegativeInteger(value.nextOrderId) && value.nextOrderId > 0
    ? value.nextOrderId
    : 1
  let offeredOrders: WorkOrder[] = []
  let activeOrder = normalizeWorkOrder(value.activeOrder, completedOrderCount)

  if (completedProjects.includes(1)) {
    if (activeOrder === null) {
      const normalizedOffers = normalizeOfferedOrders(
        value.offeredOrders,
        completedOrderCount,
        nextOrderId,
      )
      offeredOrders = normalizedOffers.orders
      nextOrderId = normalizedOffers.nextOrderId

      if (offeredOrders.length !== 2) {
        offeredOrders = createOfferedOrders(
          isNonNegativeNumber(value.points) ? value.points : 0,
          completedOrderCount,
          nextOrderId,
        )
        nextOrderId += offeredOrders.length
      }
    }
  } else {
    activeOrder = null
    offeredOrders = []
    nextOrderId = 1
  }

  return {
    points: isNonNegativeNumber(value.points) ? value.points : 0,
    coins: isNonNegativeInteger(value.coins) ? value.coins : 0,
    completedProjects,
    upgrades: normalizeUpgradeIds(value.upgrades),
    projectProgress: normalizeProjectProgress(
      value.projectProgress,
      completedProjects,
    ),
    completedOrderCount: completedProjects.includes(1)
      ? completedOrderCount
      : 0,
    nextOrderId,
    offeredOrders,
    activeOrder,
    autoClickerUnlocked:
      typeof value.autoClickerUnlocked === 'boolean'
        ? value.autoClickerUnlocked
        : false,
  }
}
