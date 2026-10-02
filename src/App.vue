<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { upgrades } from './data/upgrades'
import { projects } from './data/projects'
import ApprenticePanel from './components/ApprenticePanel.vue'
import CoinBurst from './components/CoinBurst.vue'
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
import { useTransientEffect } from './composables/useTransientEffect'
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
  isAutoClickerWorking,
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

/*
 * De gouden munten bij een voltooid project of een afgeronde order. De explosie
 * zit bewust niet in `GameButton.vue`, want die knop verdwijnt zodra er geen
 * actief doel meer is, en juist op dat moment valt het doel af.
 */
const COIN_BURST_DURATION_MS = 1200
const {
  isRunning: isCoinBurstVisible,
  runId: coinBurstRunId,
  trigger: triggerCoinBurst,
} = useTransientEffect({ durationMs: COIN_BURST_DURATION_MS })
const coinBurstReward = ref(0)

/**
 * Het project waarvoor al een explosie is gestart. Het `project-complete`-event
 * komt ná het afronden: `applyPoints` markeert het project als voltooid en pas
 * daarna merkt `ProjectTracker` dat en stuurt het event. `completedProjects`
 * zegt op dat moment dus al `true` en is geen bruikbare maatstaf; daarom
 * onthouden we hier welk project als laatste gevierd is.
 */
const lastCelebratedProjectId = ref<number | null>(null)

/**
 * De beloning van de order die nu loopt. `completeOrder` zet `activeOrder` op
 * null, dus op het moment dat de explosie zou moeten starten is het bedrag weg.
 * We onthouden het daarom zodra een order gekozen wordt. De watcher hieronder
 * loopt op het `id` en niet op het hele order, want `progress` verandert elke
 * tik en zou elke seconde een onnodige update geven.
 */
const activeOrderReward = ref(0)

watch(
  () => gameState.activeOrder?.id ?? null,
  () => {
    const order = gameState.activeOrder

    /*
     * Bewust niet terugzetten naar 0 wanneer de order verdwijnt: direct na het
     * afronden is `activeOrder` al null, en de explosie heeft juist dan de
     * beloning van dát order nodig. Anders zou de volgorde van de twee
     * watchers bepalen of de munten er wel of niet uit komen.
     */
    if (order !== null) {
      activeOrderReward.value = order.coinReward
    }
  },
  { immediate: true },
)

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

/*
 * Elke locatie krijgt zijn eigen modifierklasse. Die draagt alleen de kleuren
 * van de sluier, zodat een nieuwe achtergrond geen eigen CSS-uiteinde nodig
 * heeft en de leesbaarheid per scène te tunen is zonder de markup te raken.
 */
const sceneryClasses = computed(() => ({
  'app-content--scenery': hasViewBackground.value,
  'app-content--scenery--smithy':
    hasViewBackground.value && activeView.value === 'smithy',
}))

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
  celebrateProject(projectId)
}

/**
 * De explosie voor één afgerond doel: een project of een order.
 *
 * `reward` is de beloning van dat doel en bepaalt de spreiding van de waaier.
 */
function celebrate(reward: number): void {
  /*
   * Een doel zonder beloning viert niet met munten. `Herstel het aambeeld`
   * levert nul munten en krijgt dus geen explosie; het krijgt wel de omklappende
   * projectkaart en het paneel "Alle projecten voltooid".
   */
  if (reward <= 0) {
    return
  }

  coinBurstReward.value = reward
  triggerCoinBurst()
}

/**
 * Het `project-complete`-event van `ProjectTracker` is de eerste route, maar
 * komt in de praktijk vaak niet aan: zodra het project klaar is, is het niet
 * meer het actieve project en wordt de tracker vervangen door een gesloten
 * projectkaart. Zijn watcher ziet de voortgang dan nooit veranderen en vuurt
 * niet. Daarom is de watcher op `completedProjects` hieronder de betrouwbare
 * route. De guard op `lastCelebratedProjectId` laat beide samenvallen tot één
 * explosie.
 */
function celebrateProject(projectId: number): void {
  if (lastCelebratedProjectId.value === projectId) {
    return
  }

  lastCelebratedProjectId.value = projectId
  celebrate(projects.find(({ id }) => id === projectId)?.coinReward ?? 0)
}

/*
 * Vuurt zodra de verzameling voltooide projecten verandert. De waarde is een
 * string van de ids, want een watcher op een array zou bij elke mutatie van de
 * state afgaan in plaats van alleen bij een echt nieuw voltooid project.
 */
watch(
  () => gameState.completedProjects.join(','),
  () => {
    for (const projectId of gameState.completedProjects) {
      celebrateProject(projectId)
    }
  },
)

/*
 * Idem voor de smederij: elke afgeronde order telt `completedOrderCount` met
 * één op, en die teller is een betrouwbaarder signaal dan welk child-component
 * dan ook. Er is bewust geen `order-complete`-event om op te reageren.
 *
 * Dat de leerling de order voedt maakt niets uit: een order die af is, is af.
 * De beloning gaat er ook aan diggen, want `completeOrder` is dezelfde functie.
 */
watch(
  () => gameState.completedOrderCount,
  (completedOrderCount, previousCount) => {
    /*
     * De teller springt per order met precies één. Zou dat ooit meer zijn,
     * dan is dat een save die terug is gezet of een normalisatie die heeft
     * verschoven, en dan vieren we niets: we weten de beloning niet meer.
     */
    if (completedOrderCount !== previousCount + 1) {
      return
    }

    celebrate(activeOrderReward.value)
  },
)

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
  addPoints('project', 'manual')
}

function handleOrderClick(): void {
  addPoints('order', 'manual')
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
      :class="sceneryClasses"
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
        <!--
          De explosielaag staat in de view en niet op het aambeeld: bij het
          afronden van een project verdwijnt de knop, en dan zou de explosie
          zijn anker kwijt zijn. Dezelfde oorsprong als de vonken, zodat de
          munten uit het aambeeld lijken te komen.
        -->
        <span
          class="game-view__effect-layer"
          aria-hidden="true"
        >
          <CoinBurst
            v-if="isCoinBurstVisible"
            :key="coinBurstRunId"
            :reward="coinBurstReward"
          />
        </span>

        <GameButton
          v-if="activeProject"
          @click="handleProjectClick"
        />

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

          <!--
            De `v-else-if` blijft bewust meteen na de opslagmelding staan. Een
            tussenliggend element breekt de v-if-keten, dus deze panel zou anders
            stilletjes aan een ander v-if gaan hangen. De conditie noemt
            daarom zelf het ontbreken van een actief project.
          -->
          <GameStatusPanel
            v-else-if="!activeProject && visibleProjects.length > 0"
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
        <!--
          Zelfde explosielaag als bij de projecten. Een afgeronde order viert
          ook met munten, en die wordt afgerond terwijl je in de smederij bent.
          De laag staat om dezelfde reden buiten de knop: direct na het afronden
          is `activeOrder` null en verdwijnt de knop.
        -->
        <span
          class="game-view__effect-layer"
          aria-hidden="true"
        >
          <CoinBurst
            v-if="isCoinBurstVisible"
            :key="coinBurstRunId"
            :reward="coinBurstReward"
          />
        </span>

        <GameButton
          v-if="activeOrder"
          @click="handleOrderClick"
        />

        <section
          class="game-primary"
          aria-label="Smederij"
        >
          <OrderTracker
            v-if="activeOrder"
            :order="activeOrder"
          />

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
          :is-working="isAutoClickerWorking"
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
 * Achtergrondscène. De tekening vult de hele container en krijgt een donkere
 * sluier, zodat tekst en knoppen erboven leesbaar blijven. De sluier zit op
 * een laag onder de inhoud; niet erin, want dan dimt het paneel mee.
 *
 * De container is geen grid met `align-items: start`, want dan groeit de
 * tekening mee met de hoogte van de inhoud in plaats van een vast venster te
 * blijven. De panelen houden hun eigen hoogte.
 *
 * De kleuren van de sluier staan in `--scenery-veil-*`. Elke locatie overschrijft
 * ze met een eigen modifierklasse, zodat een warme smerderij donkerder mag
 * sluiten dan een koele stad terwijl de panelen identiek blijven.
 */
.app-content--scenery {
  --scenery-veil-top: rgb(27 17 16 / 70%);
  --scenery-veil-mid: rgb(27 17 16 / 62%);
  --scenery-veil-bottom: rgb(27 17 16 / 80%);

  position: relative;
  isolation: isolate;
  display: grid;
  justify-items: center;
  min-height: min(75vh, 34rem);
  max-width: 100%;
  padding: var(--space-5) var(--space-6);
  border-radius: var(--panel-radius);
  background-color: var(--color-background);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
}

/*
 * De smederij heeft een fel vuur links en koud staal rechts. Een zwaar
 * verzadigde sluier zou beide tot hetzelfde bruin maken, dus deze sluier is
 * bewust bijna kleurloos en alleen onderaan donker. Zo blijft het vuur warm en
 * het gereedschap koel, en verdwijnt de vloer in de onderste strook.
 *
 * De sluier hoeft geen 4.5:1 te halen: er staat geen tekst direct op de scène,
 * de panelen liggen erbovenop. De taalcontrasten komen uit de panelen.
 */
.app-content--scenery--smithy {
  --scenery-veil-top: rgb(32 21 17 / 58%);
  --scenery-veil-mid: rgb(30 19 15 / 54%);
  --scenery-veil-bottom: rgb(22 13 10 / 74%);
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
  background: linear-gradient(
    180deg,
    var(--scenery-veil-top) 0%,
    var(--scenery-veil-mid) 45%,
    var(--scenery-veil-bottom) 100%
  );
  content: '';
  pointer-events: none;
}

.app-content--scenery > .game-view {
  position: relative;
  align-self: center;
}

.game-view {
  position: relative;
  width: min(100%, var(--content-max-width));
}

/*
 * De explosielaag is een nul-hoog vlak bovenaan de projectenview. Doordat hij
 * geen hoogte hoeft te kennen, blijft hij kloppen op elk breakpoint: de
 * aambeeldgrootte staat op `.game-button` en wisselt per schermbreedte. De
 * munten ontstaan daarom bovenaan uit het midden van het aambeeld en waaieren
 * naar buiten; de precieze contactpunt zit alleen in de vonken, waar de hamer
 * daadwerkelijk raakt.
 */
.game-view__effect-layer {
  position: absolute;
  inset-block-start: 0;
  inset-inline: 0;
  height: 0;
  pointer-events: none;
  overflow: visible;
}

/*
 * Het aambeeld staat bovenaan in de view, buiten `.game-primary`, zodat hij niet
 * van plaats wisselt zodra er een melding of een projectkaart bijkomt. De
 * afstand tot de inhoud hoort daarom bij het aambeeld zelf.
 */
.game-view > .game-button + .game-primary {
  margin-block-start: var(--space-4);
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
