<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import SparkBurst from './SparkBurst.vue'
import { useTransientEffect } from '../composables/useTransientEffect'
import {
  FORGE_FRAME_STEP,
  FORGE_POSES,
  forgeSheetUrl,
} from '../sprites/forge-sheet'
import type { ForgePose } from '../sprites/forge-sheet'

interface KeyboardActivationEvent {
  readonly key: string
  readonly repeat: boolean
  preventDefault: () => void
}

/**
 * De slag duurt kort; de vonkenbad duurt langer. Een hamer die meteen weer
 * verdwijnt en vonken die daar secondenlang blijven hangen is geen explosie.
 * De twee delen daarom hun eigen getal in plaats van één.
 */
const STRIKE_DURATION_MS = 140
const SPARK_DURATION_MS = 420

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

/**
 * Elke handmatige activatie verhoogt deze teller. De slagsprite hangt hieraan
 * in plaats van aan `:active`, zodat de korte slag zichtbaar blijft ook na een
 * snelle klik en zodat alleen een echte klik de hamer beweegt.
 */
const strikeCount = ref(0)

/**
 * De pose loopt idle -> pressed -> strike -> idle. `striking` en `isPressed`
 * zijn apart, want een muis geeft bij één klik eerst `pressed` en daarna pas
 * `strike`; die volgorde is precies wat zichtbaar moet zijn.
 */
const isPressed = ref(false)
const isStruck = ref(false)
let strikeTimerId: number | undefined

/*
 * De vonken delen de duur met de slag. Ze lopen via `useTransientEffect`, want
 * het element moet daadwerkelijk uit de DOM zodra het voorbij is.
 */
const {
  isRunning: isSparksVisible,
  runId: sparksRunId,
  trigger: triggerSparks,
} = useTransientEffect({ durationMs: SPARK_DURATION_MS })

const stageStyle = computed(() => ({
  '--effect-duration': `${SPARK_DURATION_MS}ms`,
}))

const pose = computed<ForgePose>(() => {
  if (isStruck.value) return 'strike'
  if (isPressed.value) return 'pressed'
  return 'idle'
})

const forgeStyle = computed(() => ({
  '--forge-frame': FORGE_POSES.indexOf(pose.value),
  '--forge-frame-step': `${FORGE_FRAME_STEP}%`,
  '--forge-sheet': `url("${forgeSheetUrl}")`,
}))

/**
 * De slag duurt kort en draait terug naar idle. De duur staat bewust in state
 * en niet in de animatie: met `prefers-reduced-motion` schiet de animatie naar
 * 1ms weg, maar de teller en de punten blijven gewoon kloppen.
 */
function clearStrikeTimer(): void {
  if (strikeTimerId !== undefined) {
    window.clearTimeout(strikeTimerId)
    strikeTimerId = undefined
  }
}

function activate(): void {
  if (props.disabled) {
    return
  }

  strikeCount.value += 1
  isStruck.value = true
  clearStrikeTimer()
  strikeTimerId = window.setTimeout(() => {
    isStruck.value = false
    strikeTimerId = undefined
  }, STRIKE_DURATION_MS)

  /*
   * De vonken hangen aan dezelfde handmatige activatie als de slag. De leerling
   * loopt langs `applyPoints` en komt hier nooit, dus automatisch klikken
   * veroorzaakt geen vonken.
   */
  triggerSparks()

  emit('click')
}

function handleClick(): void {
  activate()
}

function handleKeydown(event: KeyboardActivationEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  // Een native button genereert zelf een click-event; voorkom dubbele activatie.
  event.preventDefault()

  if (!event.repeat) {
    activate()
  }
}

/*
 * `pressed` moet bij de aanwijzer volgen en niet bij de focus: tabben naar de
 * knop mag geen ingedrukte hamer geven, want er is niets ingedrukt.
 */
function handlePointerDown(): void {
  isPressed.value = true
}

function handlePointerUp(): void {
  isPressed.value = false
}

/*
 * Een pointer die het element verlaat, of een scroll met de vinger, laat de
 * aanwijzer los zonder dat er een click volgt. Zonder deze twee zou de hamer
 * blijven staan als ingedrukt.
 */
function handlePointerCancel(): void {
  isPressed.value = false
}

function handleBlur(): void {
  isPressed.value = false
}

onUnmounted(clearStrikeTimer)
</script>

<template>
  <button
    class="game-button"
    type="button"
    :disabled="disabled"
    :aria-disabled="disabled ? 'true' : undefined"
    aria-label="Sla op het aambeeld"
    :data-strike-count="strikeCount"
    :data-pose="pose"
    @click="handleClick"
    @keydown="handleKeydown"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerCancel"
    @blur="handleBlur"
  >
    <span
      class="game-button__stage"
      :style="stageStyle"
    >
      <span
        class="game-button__forge"
        :style="forgeStyle"
        aria-hidden="true"
      />
      <SparkBurst
        v-if="isSparksVisible"
        :key="sparksRunId"
      />
    </span>
  </button>
</template>

<style scoped>
/*
 * De knop is het aambeeld zelf: geen rand, geen achtergrond, geen tekst. Hij
 * blijft een native `<button>`, zodat Enter en Space, de focusring uit
 * `main.css` en `touch-action: manipulation` gewoon blijven werken.
 *
 * De padding maakt het klikvlak groter dan de sprite, zodat "in de buurt van
 * het aambeeld" klikken echt klikken is en niet alleen precies op het staal.
 */
/*
 * De sprite-grootte is een geheel veelvoud van de cel van 48px, anders
 * krijgt de ene pixelrij drie schermpixels en de volgende twee. 6rem is 96px
 * (2x), 9rem is 144px (3x) en 12rem is 192px (4x).
 */
.game-button {
  --forge-render-size: 9rem;

  display: block;
  width: calc(var(--forge-render-size) + var(--space-5));
  min-height: calc(var(--forge-render-size) + var(--space-5));
  margin-inline: auto;
  padding: calc(var(--space-5) / 2);
  border: 0;
  border-radius: var(--panel-radius);
  background: none;
  cursor: pointer;
  /* Verhoogt de score bij het aanzien, niet het doel van de aanwijzer. */
  touch-action: manipulation;
  user-select: none;
}

.game-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/*
 * Eén cel van de sheet. `background-size: 300% 100%` toet drie frames naast
 * elkaar, dus de tekening is drie keer het element breed. Daarom is een
 * `background-position` van precies 50% een hele cel: het verschil tussen
 * element en tekening is twee keer het element, en de helft daarvan is er
 * precies een. Geen deling door drie dus, en dus geen afrondingsfout op de
 * grens tussen twee frames.
 *
 * De grootte staat op de stage, niet hier: sprite en vonken moeten hetzelfde
 * vak delen, anders klopt het contactpunt van de vonken niet.
 */
.game-button__stage {
  /*
   * De celvermenigvuldiger: 2, 3 of 4, precies de factor waarmee
   * `--forge-render-size` van de cel van 48px verschilt. `SparkBurst` vermenig-
   * vuligt zijn vliegbaan en zijn blokgrootte hiermee, zodat de vonkenbad op
   * elk breakpoint even groot is ten opzichte van het aambeeld. Houd dit in
   * sync met de mediaqueries hieronder.
   */
  --effect-scale: 3;

  position: relative;
  display: block;
  width: var(--forge-render-size);
  height: var(--forge-render-size);
  margin-inline: auto;
}

.game-button__forge {
  display: block;
  width: 100%;
  height: 100%;
  background-image: var(--forge-sheet);
  background-position: calc(var(--forge-frame, 0) * var(--forge-frame-step, 50%)) 0;
  background-repeat: no-repeat;
  background-size: 300% 100%;
  image-rendering: pixelated;
  transition: filter var(--transition-fast);
}

/*
 * De aandachtstekens voor een onzichtbaar doel: hover licht de sprite op en
 * focus geeft een gloed. Zonder die gloed is de outline van `main.css` de
 * enige aanwijzing en oogt de knop leeg.
 */
.game-button:hover:not(:disabled) .game-button__forge {
  filter: brightness(1.12);
}

.game-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.game-button:focus-visible .game-button__forge {
  filter: brightness(1.2) drop-shadow(0 0 0.5rem rgb(255 209 102 / 55%));
}

/*
 * Drie schaalgroottes, elk een geheel veelvoud van de cel van 48px. Let op dat
 * `--effect-scale` op de stage meebeweegt: hij is het veelvoud dat
 * `SparkBurst` nodig heeft om de vonkenbad evenredig te houden.
 */
@media (min-width: 48rem) {
  .game-button {
    --forge-render-size: 12rem;
  }

  .game-button__stage {
    --effect-scale: 4;
  }
}

@media (max-width: 30rem) {
  .game-button {
    --forge-render-size: 6rem;
  }

  .game-button__stage {
    --effect-scale: 2;
  }
}
</style>