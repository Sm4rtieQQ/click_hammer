<script setup lang="ts">
import { computed } from 'vue'

interface SparkTrajectory {
  readonly x: number
  readonly y: number
  readonly delay: number
  readonly size: number
}

/**
 * Vaste tabel, geen `Math.random()`. Een willekeurige baan maakt de test en
 * de screenshot onvoorspelbaar, terwijl niemand merkt dat de vonken niet
 * elke keer exact anders vliegen.
 *
 * De vonken gaan omhoog vanaf het contactpunt: negatieve `y` is boven het
 * aambeeld, en de zijwaartse spreiding is groter dan de hoogte zodat het een
 * waaier wordt en geen verticale kolom.
 *
 * `x` en `y` zijn in eenheden van `--effect-scale`, dus de getallen hier zijn
 * voor schaal 1 en de CSS vermenigvuldigt ze nog eens met 2, 3 of 4. Op de
 * middelste schaal komt de hoogste vonk daarmee op 105px boven het
 * contactpunt, wat een duidelijke bad is zonder uit beeld te vliegen.
 *
 * `size` is daarentegen niet geschaald: een vonk blijft een vonk. Een
 * meegeschalde vonk van 28px leest als een gloeiend blok in plaats van een
 * vonk.
 */
const trajectories: readonly SparkTrajectory[] = [
  { x: 0, y: -20, delay: 0, size: 5 },
  { x: -13, y: -25, delay: 14, size: 4 },
  { x: 12, y: -27, delay: 26, size: 4 },
  { x: -7, y: -32, delay: 8, size: 3 },
  { x: 8, y: -35, delay: 34, size: 3 },
  { x: -21, y: -16, delay: 20, size: 3 },
  { x: 19, y: -18, delay: 45, size: 2 },
  { x: -9, y: -12, delay: 6, size: 2 },
  { x: 14, y: -24, delay: 52, size: 2 },
  { x: -26, y: -30, delay: 38, size: 3 },
  { x: 25, y: -33, delay: 60, size: 2 },
  { x: -17, y: -38, delay: 72, size: 2 },
]

const sparks = computed(() =>
  trajectories.map((trajectory) => ({
    ...trajectory,
    style: {
      '--spark-x': `${trajectory.x}px`,
      '--spark-y': `${trajectory.y}px`,
      '--spark-delay': `${trajectory.delay}ms`,
      '--spark-size': `${trajectory.size}px`,
    },
  })),
)
</script>

<template>
  <span
    class="spark-burst"
    aria-hidden="true"
  >
    <i class="spark-burst__flash" />
    <i
      v-for="(spark, index) in sparks"
      :key="index"
      class="spark-burst__spark"
      :style="spark.style"
    />
  </span>
</template>

<style scoped>
/*
 * De burst staat buiten de flow (`absolute`, `pointer-events: none`), dus hij
 * veroorzaakt geen layoutverschuiving. Dat is ook de reden dat de oorsprong
 * met `translate(-50%, -50%)` in het midden van de sprite wordt gelegd: dan
 * hoeft er geen padding te worden gecompenseerd.
 */
.spark-burst {
  position: absolute;
  top: var(--effect-origin-y, 52%);
  left: var(--effect-origin-x, 47%);
  width: 0;
  height: 0;
  pointer-events: none;
}

/*
 * De flitsring. Een bad van losse puntjes leest niet vanzelf als een klap;
 * een vierkant randje dat in één keer uitklapt wel. Vierkant om twee redenen:
 * `border-radius` zou er een cirkel van maken, en een cirkel is geen pixel.
 *
 * Hij zit vóór de vonken in de DOM en heeft dus een lagere stapelling, dus hij
 * komt achter de puntjes te staan in plaats van over ze heen.
 */
.spark-burst__flash {
  position: absolute;
  width: calc(26px * var(--effect-scale, 3));
  height: calc(26px * var(--effect-scale, 3));
  border: calc(2px * var(--effect-scale, 3)) solid var(--color-focus);
  background: none;
  animation-name: spark-flash;
  animation-duration: calc(var(--effect-duration, 420ms) * 0.55);
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}

@keyframes spark-flash {
  0% {
    opacity: 0.95;
    transform: translate(-50%, -50%) scale(0.15);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.9);
  }
}

/*
 * Blokkerig, geen `border-radius` en geen blur: een afgeronde vonk leest als een
 * glow en niet als pixel-art. Elk blok verdwijnt via de keyframe hieronder.
 *
 * Let op de `animation`-shorthand: hier staat géén `--transition-medium` in.
 * Die token is `180ms ease`, dus hij zou zelf een duur in de lijst zetten en
 * de declaratie ongeldig maken zodra er al een duur en een vertraging staan.
 * Een keyframe-duur staat daarom als `--effect-duration` en de curve als het
 * losse woord `ease-out`.
 */
.spark-burst__spark {
  position: absolute;
  width: var(--spark-size, 3px);
  height: var(--spark-size, 3px);
  background: var(--color-focus);
  box-shadow: 0 0 4px 1px rgb(255 209 102 / 60%);
  animation-name: spark-fly;
  animation-duration: var(--effect-duration, 420ms);
  animation-timing-function: ease-out;
  animation-delay: var(--spark-delay, 0ms);
  animation-fill-mode: both;
}

/*
 * De waaier vliegt uit elkaar en vervaagt onderweg. De schaalvorm is `--effect-scale`
 * zodat de baan evenredig schaalt met de sprite.
 *
 * Let op de laatste stop: de opacity is al om 80% op nul en niet pas op 100%.
 * De hoogste vonken zouden anders nog zichtbaar zijn als ze al bij de vaste
 * topbar komen. Gemeten wordt de kop circa 86% van de vlucht bereikt, dus met
 * deze vroege vervaaging is er op dat punt niets meer te zien. Zo hoeft de
 * vlucht niet ingeperkt te worden om te voorkomen dat er iets afknipt, en een
 * latere koptekst zou de vonken alleen nogEarlier laten uitvagen.
 */
@keyframes spark-fly {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  35% {
    opacity: 1;
    transform: translate(
        calc(-50% + var(--spark-x, 0px) * var(--effect-scale, 3) * 0.5),
        calc(-50% + var(--spark-y, 0px) * var(--effect-scale, 3) * 0.62)
      )
      scale(0.9);
  }

  80% {
    opacity: 0;
    transform: translate(
        calc(-50% + var(--spark-x, 0px) * var(--effect-scale, 3) * 0.86),
        calc(-50% + var(--spark-y, 0px) * var(--effect-scale, 3) * 0.86)
      )
      scale(0.5);
  }

  100% {
    opacity: 0;
    transform: translate(
        calc(-50% + var(--spark-x, 0px) * var(--effect-scale, 3)),
        calc(-50% + var(--spark-y, 0px) * var(--effect-scale, 3))
      )
      scale(0.35);
  }
}

/*
 * Met minder bewegwens is er geen vliegban: de vonken zouden in één frame
 * wegvliegen en een flits geven. Beter is helemaal niets tonen; de slag zelf
 * blijft zichtbaar, want die is state en geen animatie.
 */
@media (prefers-reduced-motion: reduce) {
  .spark-burst {
    display: none;
  }
}
</style>