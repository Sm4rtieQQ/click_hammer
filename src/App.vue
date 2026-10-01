<script setup lang="ts">
import { computed, ref } from 'vue'
import { upgrades } from './data/upgrades'
import GameButton from './components/GameButton.vue'
import GameHeader from './components/GameHeader.vue'
import GameNavigation from './components/GameNavigation.vue'
import OrderSelection from './components/OrderSelection.vue'
import OrderTracker from './components/OrderTracker.vue'
import ProjectList from './components/ProjectList.vue'
import TestControls from './components/TestControls.vue'
import UpgradeShop from './components/UpgradeShop.vue'
import { loadGameState } from './composables/gameStorage'
import { useGamePersistence } from './composables/useGamePersistence'
import { useGameState } from './composables/useGameState'
import type { GameView } from './types/ui'

const initialState = loadGameState()
const {
  gameState,
  activeProject,
  visibleProjects,
  completedProjectIds,
  offeredOrders,
  activeOrder,
  currentUpgradeCosts,
  purchaseCounts,
  affordableUpgradeIds,
  addPoints,
  selectOrder,
  completeProject,
  buyUpgrade,
  resetGameState,
} = useGameState(initialState)

const persistence = useGamePersistence(gameState)
const activeView = ref<GameView>('projects')
const showTestControls = import.meta.env.DEV || import.meta.env.MODE === 'test'
const ordersUnlocked = computed(() => completedProjectIds.value.includes(1))

function handleProjectComplete(projectId: number): void {
  completeProject(projectId)
}

function handleBuyUpgrade(upgradeId: number): void {
  buyUpgrade(upgradeId)
}

function handleSelectView(view: GameView): void {
  activeView.value = view
}

function handleProjectClick(): void {
  addPoints('project')
}

function handleOrderClick(): void {
  addPoints('order')
}

function handleReset(): void {
  resetGameState()
  persistence.saveNow()
}

defineExpose({
  gameState,
  activeView,
  addPoints,
  selectOrder,
  completeProject,
  buyUpgrade,
  resetGameState,
})
</script>

<template>
  <div class="app-shell">
    <div class="game-topbar">
      <GameHeader
        :points="gameState.points"
        :coins="gameState.coins"
      />

      <GameNavigation
        :active-view="activeView"
        @select="handleSelectView"
      />
    </div>

    <main
      class="app-content"
      aria-label="ClickHammer game"
    >
      <section
        v-if="activeView === 'projects'"
        id="game-panel-projects"
        class="game-view"
        role="tabpanel"
        aria-labelledby="game-tab-projects"
      >
        <section
          class="game-primary"
          aria-label="Projecten"
        >
          <GameButton
            v-if="activeProject"
            @click="handleProjectClick"
          />

          <ProjectList
            :projects="visibleProjects"
            :active-project-id="activeProject?.id"
            :completed-project-ids="completedProjectIds"
            :project-progress="gameState.projectProgress"
            @project-complete="handleProjectComplete"
          />
        </section>
      </section>

      <section
        v-else-if="activeView === 'smithy'"
        id="game-panel-smithy"
        class="game-view"
        role="tabpanel"
        aria-labelledby="game-tab-smithy"
      >
        <section
          class="game-primary"
          aria-label="Smidse"
        >
          <section
            v-if="!ordersUnlocked"
            class="panel game-gate"
            aria-labelledby="first-project-gate-title"
          >
            <p class="game-gate__eyebrow">
              Eerste stap
            </p>
            <h2 id="first-project-gate-title">
              Herstel eerst het aambeeld
            </h2>
            <p>
              Voltooi het eerste project op het projecttabblad om opdrachten te
              ontgrendelen.
            </p>
          </section>

          <template v-else-if="activeOrder">
            <GameButton @click="handleOrderClick" />
            <OrderTracker :order="activeOrder" />
          </template>

          <OrderSelection
            v-else
            :orders="offeredOrders"
            @select="selectOrder"
          />
        </section>
      </section>

      <section
        v-else
        id="game-panel-upgrades"
        class="game-view"
        role="tabpanel"
        aria-labelledby="game-tab-upgrades"
      >
        <UpgradeShop
          :upgrades="upgrades"
          :coins="gameState.coins"
          :purchase-counts="purchaseCounts"
          :current-costs="currentUpgradeCosts"
          :affordable-upgrade-ids="affordableUpgradeIds"
          @buy-upgrade="handleBuyUpgrade"
        />
      </section>
    </main>

    <TestControls
      v-if="showTestControls"
      @reset="handleReset"
    />
  </div>
</template>

<style scoped>
.game-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: var(--space-2);
  background: var(--color-background);
}

.game-topbar .game-header {
  margin-bottom: var(--space-3);
}

.game-view {
  width: min(100%, var(--content-max-width));
}

.game-primary {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--space-5);
  min-width: 0;
  width: 100%;
}

.game-primary > :first-child {
  justify-self: center;
}

.game-gate {
  width: 100%;
  text-align: center;
}

.game-gate__eyebrow {
  margin-bottom: var(--space-2);
  color: var(--color-focus);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.game-gate h2 {
  margin-bottom: var(--space-3);
}

@media (max-width: 48rem) {
  .game-topbar {
    padding-top: var(--space-1);
  }

  .game-topbar .game-header {
    margin-bottom: var(--space-2);
  }
}
</style>
