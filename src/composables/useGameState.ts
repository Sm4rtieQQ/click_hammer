import { computed, reactive, readonly, watch } from 'vue'
import { getCurrentScope, onScopeDispose } from 'vue'
import type { ComputedRef, DeepReadonly } from 'vue'
import { createOfferedOrders } from '../data/orders'
import { projects } from '../data/projects'
import { upgrades } from '../data/upgrades'
import { createInitialGameState } from '../types/game'
import type { GameState, Project, Upgrade, WorkOrder } from '../types/game'
import {
  isNonNegativeNumber,
  normalizeGameState,
} from '../types/gameStateNormalization'
import type { ProgressTarget } from '../types/ui'

const baseClickPower = 1

/**
 * De leerling levert per seconde een fractie van de huidige clickkracht.
 */
export const autoClickerShare = 0.1
const autoClickerIntervalMs = 1000

const projectById = new Map<number, Project>()
const upgradeById = new Map<number, Upgrade>()

for (const project of projects) {
  projectById.set(project.id, project)
}

for (const upgrade of upgrades) {
  upgradeById.set(upgrade.id, upgrade)
}

export function calculateClickPower(
  purchasedUpgrades: readonly Upgrade[],
): number {
  return purchasedUpgrades.reduce((power, upgrade) => {
    if (!isNonNegativeNumber(upgrade.clickBonus)) {
      return power
    }

    return power * (1 + upgrade.clickBonus / 100)
  }, baseClickPower)
}

export function getUpgradeCost(
  upgrade: Upgrade,
  purchaseCount: number,
): number {
  if (
    !isNonNegativeNumber(upgrade.baseCost) ||
    !Number.isFinite(upgrade.costMultiplier) ||
    upgrade.costMultiplier <= 1
  ) {
    return 1
  }

  const normalizedPurchaseCount = isNonNegativeNumber(purchaseCount)
    ? purchaseCount
    : 0
  const calculatedCost =
    upgrade.baseCost *
    upgrade.costMultiplier ** normalizedPurchaseCount

  if (
    !Number.isFinite(calculatedCost) ||
    calculatedCost > Number.MAX_SAFE_INTEGER
  ) {
    return Number.MAX_SAFE_INTEGER
  }

  return Math.max(1, Math.floor(calculatedCost))
}

export interface UseGameStateReturn {
  readonly gameState: DeepReadonly<GameState>
  readonly clickPower: ComputedRef<number>
  readonly autoClickerRate: ComputedRef<number>
  readonly currentUpgradeCosts: ComputedRef<Record<number, number>>
  readonly purchaseCounts: ComputedRef<Record<number, number>>
  readonly affordableUpgradeIds: ComputedRef<ReadonlySet<number>>
  readonly completedProjectIds: ComputedRef<readonly number[]>
  readonly activeProject: ComputedRef<Project | undefined>
  readonly activeProjectProgress: ComputedRef<number>
  readonly visibleProjects: ComputedRef<readonly Project[]>
  readonly remainingProjectGoals: ComputedRef<Record<number, number>>
  readonly offeredOrders: ComputedRef<readonly DeepReadonly<WorkOrder>[]>
  readonly activeOrder: ComputedRef<DeepReadonly<WorkOrder> | null>
  readonly addPoints: (target?: ProgressTarget) => void
  readonly selectOrder: (orderId: number) => void
  readonly completeProject: (projectId: number) => void
  readonly buyUpgrade: (id: number) => void
  readonly resetGameState: () => void
  readonly startAutoClicker: () => void
  readonly stopAutoClicker: () => void
}

export function useGameState(
  initialState: unknown = createInitialGameState(),
): UseGameStateReturn {
  const state = reactive<GameState>(normalizeGameState(initialState))
  const gameState = readonly(state)

  function getActiveProject(): Project | undefined {
    return projects.find(
      (project) =>
        !state.completedProjects.includes(project.id) &&
        state.points >= project.unlockPoints,
    )
  }

  function getVisibleProjects(): Project[] {
    const completedProjects = projects.filter(({ id }) =>
      state.completedProjects.includes(id),
    )
    const nextProject = projects.find(
      ({ id }) => !state.completedProjects.includes(id),
    )

    return nextProject === undefined
      ? completedProjects
      : [...completedProjects, nextProject]
  }

  function getPurchasedUpgrades(): Upgrade[] {
    const purchasedUpgrades: Upgrade[] = []

    for (const upgradeId of state.upgrades) {
      const upgrade = upgradeById.get(upgradeId)

      if (upgrade !== undefined) {
        purchasedUpgrades.push(upgrade)
      }
    }

    return purchasedUpgrades
  }

  function ensureOfferedOrders(): void {
    if (
      !state.completedProjects.includes(1) ||
      state.activeOrder !== null ||
      state.offeredOrders.length === 2
    ) {
      return
    }

    const offeredOrders = createOfferedOrders(
      state.points,
      state.completedOrderCount,
      state.nextOrderId,
    )
    state.offeredOrders = offeredOrders
    state.nextOrderId += offeredOrders.length
  }

  function completeOrder(orderId: number): void {
    const order = state.activeOrder

    if (
      order === null ||
      order.id !== orderId ||
      order.progress < order.requiredPoints
    ) {
      return
    }

    const nextCoins = state.coins + order.coinReward

    if (!Number.isFinite(nextCoins) || !Number.isInteger(nextCoins)) {
      return
    }

    state.coins = nextCoins
    state.completedOrderCount += 1
    state.activeOrder = null
    state.offeredOrders = []
    ensureOfferedOrders()
  }

  function addPoints(target?: ProgressTarget): void {
    const resolvedTarget = target ?? (
      state.activeOrder === null ? 'project' : 'order'
    )
    const clickPower = calculateClickPower(getPurchasedUpgrades())

    applyPoints(resolvedTarget, clickPower)
  }

  /**
   * Voegt `amount` punten toe aan het gekozen doel. `addPoints` gebruikt dit
   * met de volledige clickkracht; de leerling met een fractie daarvan.
   */
  function applyPoints(target: ProgressTarget, amount: number): void {
    const nextPoints = state.points + amount

    if (!Number.isFinite(amount) || !Number.isFinite(nextPoints)) {
      return
    }

    if (target === 'order') {
      const order = state.activeOrder

      if (order === null) {
        return
      }

      const nextProgress = Math.min(
        order.requiredPoints,
        order.progress + amount,
      )
      state.points = nextPoints
      state.activeOrder = { ...order, progress: nextProgress }

      if (nextProgress >= order.requiredPoints) {
        completeOrder(order.id)
      }

      return
    }

    if (target === 'project') {
      const project = getActiveProject()

      if (project === undefined) {
        return
      }

      const currentProgress = state.projectProgress[project.id] ?? 0
      const nextProgress = Math.min(
        project.requiredPoints,
        currentProgress + amount,
      )
      state.points = nextPoints
      state.projectProgress[project.id] = nextProgress

      if (nextProgress >= project.requiredPoints) {
        completeProject(project.id)
      }
    }
  }

  function selectOrder(orderId: number): void {
    if (
      !state.completedProjects.includes(1) ||
      state.activeOrder !== null
    ) {
      return
    }

    const selectedOrder = state.offeredOrders.find(
      (order) => order.id === orderId,
    )

    if (selectedOrder === undefined) {
      return
    }

    state.activeOrder = { ...selectedOrder }
    state.offeredOrders = []
  }

  function completeProject(projectId: number): void {
    if (state.completedProjects.includes(projectId)) {
      return
    }

    const project = projectById.get(projectId)
    const activeProject = getActiveProject()

    if (
      project === undefined ||
      activeProject?.id !== projectId ||
      (state.projectProgress[projectId] ?? 0) < project.requiredPoints
    ) {
      return
    }

    const nextCoins = state.coins + project.coinReward

    if (!Number.isFinite(nextCoins) || !Number.isInteger(nextCoins)) {
      return
    }

    state.completedProjects.push(projectId)
    state.coins = nextCoins

    if (projectId === 1) {
      ensureOfferedOrders()
    }
  }

  function buyUpgrade(id: number): void {
    const upgrade = upgradeById.get(id)

    if (upgrade === undefined) {
      return
    }

    const purchaseCount = state.upgrades.filter(
      (upgradeId) => upgradeId === id,
    ).length
    const maxPurchases = upgrade.maxPurchases ?? Infinity

    if (purchaseCount >= maxPurchases) {
      return
    }

    const currentCost = getUpgradeCost(upgrade, purchaseCount)

    if (currentCost > state.coins) {
      return
    }

    state.coins -= currentCost
    state.upgrades.push(id)

    if (upgrade.autoClickerUnlocker === true) {
      state.autoClickerUnlocked = true
    }
  }

  function resetGameState(): void {
    Object.assign(state, createInitialGameState())
  }

  const clickPower = computed(() =>
    calculateClickPower(getPurchasedUpgrades()),
  )
  const currentUpgradeCosts = computed<Record<number, number>>(() => {
    const costs: Record<number, number> = {}

    for (const upgrade of upgrades) {
      const purchaseCount = state.upgrades.filter(
        (upgradeId) => upgradeId === upgrade.id,
      ).length
      const maxPurchases = upgrade.maxPurchases ?? Infinity

      if (purchaseCount >= maxPurchases) {
        costs[upgrade.id] = Number.MAX_SAFE_INTEGER
      } else {
        costs[upgrade.id] = getUpgradeCost(upgrade, purchaseCount)
      }
    }

    return costs
  })
  const purchaseCounts = computed<Record<number, number>>(() => {
    const counts: Record<number, number> = {}

    for (const upgrade of upgrades) {
      counts[upgrade.id] = state.upgrades.filter(
        (upgradeId) => upgradeId === upgrade.id,
      ).length
    }

    return counts
  })
  const affordableUpgradeIds = computed<ReadonlySet<number>>(
    () =>
      new Set(
        upgrades
          .filter(({ id, maxPurchases }) => {
            const purchaseCount = state.upgrades.filter(
              (upgradeId) => upgradeId === id,
            ).length
            const limit = maxPurchases ?? Infinity
            return purchaseCount < limit && state.coins >= currentUpgradeCosts.value[id]
          })
          .map(({ id }) => id),
      ),
  )
  const completedProjectIds = computed<readonly number[]>(() => [
    ...state.completedProjects,
  ])
  const activeProject = computed(() => getActiveProject())
  const activeProjectProgress = computed(() => {
    const project = activeProject.value

    return project === undefined
      ? 0
      : state.projectProgress[project.id] ?? 0
  })
  const visibleProjects = computed<readonly Project[]>(() =>
    getVisibleProjects(),
  )
  const remainingProjectGoals = computed<Record<number, number>>(() => {
    const remainingGoals: Record<number, number> = {}

    for (const project of projects) {
      remainingGoals[project.id] = Math.max(
        0,
        project.requiredPoints - (state.projectProgress[project.id] ?? 0),
      )
    }

    return remainingGoals
  })
  const offeredOrders = computed<
    readonly DeepReadonly<WorkOrder>[]
  >(() => state.offeredOrders)
  const activeOrder = computed<DeepReadonly<WorkOrder> | null>(
    () => state.activeOrder,
  )
  const autoClickerRate = computed(() => clickPower.value * autoClickerShare)

  let autoClickerIntervalId: ReturnType<typeof setInterval> | null = null

  function stopAutoClicker(): void {
    if (autoClickerIntervalId !== null) {
      clearInterval(autoClickerIntervalId)
      autoClickerIntervalId = null
    }
  }

  function startAutoClicker(): void {
    if (!state.autoClickerUnlocked || autoClickerIntervalId !== null) {
      return
    }

    autoClickerIntervalId = setInterval(() => {
      // De leerling voedt hetzelfde doel als een handmatige klik: de actieve
      // order wanneer die er is, anders het actieve project.
      const target: ProgressTarget =
        state.activeOrder === null ? 'project' : 'order'

      applyPoints(target, autoClickerRate.value)
    }, autoClickerIntervalMs)

    /*
     * Buiten een component scope (een losse unit test bijvoorbeeld) blijft de
     * interval bestaan tot `stopAutoClicker` wordt aangeroepen. Binnen een
     * scope ruimt `onScopeDispose` hem automatisch op, zodat een unmount nooit
     * een timer laat hangen.
     */
    if (getCurrentScope() !== undefined) {
      onScopeDispose(stopAutoClicker)
    }
  }

  watch(
    () => state.autoClickerUnlocked,
    (unlocked) => {
      if (unlocked) {
        startAutoClicker()
      } else {
        stopAutoClicker()
      }
    },
  )

  return {
    gameState,
    clickPower,
    autoClickerRate,
    currentUpgradeCosts,
    purchaseCounts,
    affordableUpgradeIds,
    completedProjectIds,
    activeProject,
    activeProjectProgress,
    visibleProjects,
    remainingProjectGoals,
    offeredOrders,
    activeOrder,
    addPoints,
    selectOrder,
    completeProject,
    buyUpgrade,
    resetGameState,
    startAutoClicker,
    stopAutoClicker,
  }
}
