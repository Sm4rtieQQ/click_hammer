<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { upgrades } from './data/upgrades'
import ApprenticePanel from './components/ApprenticePanel.vue'
import GameButton from './components/GameButton.vue'
import GameHeader from './components/GameHeader.vue'
import GameNavigation from './components/GameNavigation.vue'
import GameStatusPanel from './components/GameStatusPanel.vue'
import OrderSelection from './components/OrderSelection.vue'
import OrderTracker from './components/OrderTracker.vue'
import ProjectList from './components/ProjectList.vue'
import TestControls from './components/TestControls.vue'
import UpgradeShop from './components/UpgradeShop.vue'
import { loadGameStateResult } from './composables/gameStorage'
import { useGamePersistence } from './composables/useGamePersistence'
import { useGameState } from './composables/useGameState'
import { getViewBackgroundUrl } from './types/ui'
import type { GameView } from './types/ui'

const loadResult = loadGameStateResult()
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
  autoClickerRate,
  clickPower,
  addPoints,
  selectOrder,
  completeProject,
  buyUpgrade,
  resetGameState,
  startAutoClicker,
  stopAutoClicker,
} = useGameState(loadResult.state)

const persistence = useGamePersistence(gameState)
const { hasWriteError } = persistence
const activeView = ref<GameView>('projects')
const showTestControls = import.meta.env.DEV || import.meta.env.MODE === 'test'
const ordersUnlocked = computed(() => completedProjectIds.value.includes(1))
const apprenticeUnlocked = computed(() => gameState.autoClickerUnlocked)
const disabledViews = computed<readonly GameView[]>(() => {
  const disabled: GameView[] = []
  if (!ordersUnlocked.value) disabled.push('smithy', 'upgrades')
  if (!apprenticeUnlocked.value) disabled.push('apprentice')
  return disabled
})
const storageNoticeDismissed = ref(false)
const hasStorageNotice = computed(
  () =>
    !storageNoticeDismissed.value &&
    (loadResult.status === 'recovered' ||
      loadResult.status === 'unavailable' ||
      hasWriteError.value),
)
const viewBackgroundUrl = computed(() => getViewBackgroundUrl(activeView.value))
const hasViewBackground = computed(() => viewBackgroundUrl.value !== undefined)
const viewBackgroundStyle = computed(() =>
  viewBackgroundUrl.value === undefined
    ? undefined
    : { backgroundImage: `url("${viewBackgroundUrl.value}")` },
)

function dismissStorageNotice(): void {
  storageNoticeDismissed.value = true
}

watch(disabledViews, () => {
  if (disabledViews.value.includes(activeView.value)) {
    activeView.value = 'projects'
  }
})

onMounted(() => {
  startAutoClicker()
})

onUnmounted(() => {
  stopAutoClicker()
})

function handleProjectComplete(projectId: number): void {
  completeProject(projectId)
}

function handleBuyUpgrade(upgradeId: number): void {
  buyUpgrade(upgradeId)
}

function handleSelectView(view: GameView): void {
  if (disabledViews.value.includes(view)) {
    return
  }

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
  startAutoClicker,
  stopAutoClicker,
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
        :disabled-views="disabledViews"
        @select="handleSelectView"
      />
    </div>

    <main
      class="app-content"
      :class="{ 'app-content--scenery': hasViewBackground }"
      :style="viewBackgroundStyle"
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
          <GameStatusPanel
            v-if="hasStorageNotice"
            class="game-notice game-notice--storage"
            tone="warning"
            title="Voortgang wordt niet bewaard"
            message="De opslag van deze browser is niet beschikbaar. Het spel blijft volledig speelbaar, maar je voortgang verdwijnt zodra je het venster sluit."
          >
            <template #eyebrow>
              Opslag waarschuwing
            </template>
            <button
              class="game-notice__dismiss"
              type="button"
              @click="dismissStorageNotice"
            >
              Melding sluiten
            </button>
          </GameStatusPanel>

          <GameButton
            v-if="activeProject"
            @click="handleProjectClick"
          />

          <GameStatusPanel
            v-else-if="visibleProjects.length > 0"
            class="game-notice game-notice--projects"
            tone="info"
            title="Alle projecten voltooid"
            message="Je hebt elk project afgerond. Verder spelen kan via opdrachten in de smederij."
          >
            <template #eyebrow>
              Klaar
            </template>
          </GameStatusPanel>

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
          aria-label="Smederij"
        >
          <template v-if="activeOrder">
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
        v-else-if="activeView === 'upgrades'"
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
          :show-dev-upgrades="showTestControls"
          @buy-upgrade="handleBuyUpgrade"
        />
      </section>

      <section
        v-else
        id="game-panel-apprentice"
        class="game-view"
        role="tabpanel"
        aria-labelledby="game-tab-apprentice"
      >
        <ApprenticePanel
          :auto-clicker-rate="autoClickerRate"
          :click-power="clickPower"
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

/*
 * Achtergrondscène. De laag zit achter de panelen en krijgt een donkere
 * sluier, zodat tekst en knoppen bovenop de tekening leesbaar blijven.
 */
/*
 * Achtergrondscène. De tekening vult de hele container en krijgt een donkere
 * sluier, zodat tekst en knoppen erboven leesbaar blijven. De sluier zit op
 * een laag onder de inhoud; niet erin, want dan dimt het paneel mee.
 *
 * De container is geen grid met `align-items: start`, want dan groeit de
 * tekening mee met de hoogte van de inhoud in plaats van een vast venster te
 * blijven. De panelen houden hun eigen hoogte.
 */
.app-content--scenery {
  position: relative;
  isolation: isolate;
  display: grid;
  justify-items: center;
  min-height: min(75vh, 34rem);
  max-width: calc(var(--content-max-width) + 2 * var(--space-6));
  padding: var(--space-5) var(--space-6);
  border-radius: var(--panel-radius);
  background-color: var(--color-background);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
}

/*
 * De sluier bedekt precies de scène en ligt op een laag onder de inhoud, niet
 * erbovenop: anders dimt het paneel mee. Gebruik ook geen negatieve inset;
 * pseudo-elementen tellen niet mee in een overflowmeting, waardoor zo'n
 * overhang stilletjes horizontale scroll oplevert zonder dat een element ervan
 * schuldig lijkt.
 */
.app-content--scenery::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  border-radius: inherit;
  background:
    linear-gradient(
      180deg,
      rgb(27 17 16 / 70%) 0%,
      rgb(27 17 16 / 62%) 45%,
      rgb(27 17 16 / 80%) 100%
    );
  content: '';
  pointer-events: none;
}

.app-content--scenery > .game-view {
  position: relative;
  align-self: center;
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

.game-notice {
  text-align: left;
}

.game-notice__dismiss {
  min-height: var(--control-min-height);
  margin-top: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 0.6rem;
  color: var(--color-text);
  background: rgb(255 255 255 / 8%);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 800;
}

.game-notice__dismiss:hover {
  background: rgb(255 255 255 / 14%);
}



@media (max-width: 48rem) {
  .game-topbar {
    padding-top: var(--space-1);
  }

  .game-topbar .game-header {
    margin-bottom: var(--space-2);
  }

  .app-content--scenery {
    max-width: 100%;
    padding: var(--space-4) var(--space-3);
  }
}
</style>
