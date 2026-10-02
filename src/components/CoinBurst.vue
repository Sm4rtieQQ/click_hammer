<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /**
     * De beloning van het voltooide project. Die bepaalt de spreiding van de
     * waaier: een grotere beloning vliegt verder uit elkaar. Het getal zelf
     * wordt niet getoond; de header doet dat al in de `aria-live`-regio.
     */
    reward?: number
  }>(),
  {
    reward: 0,
  },
)

interface CoinTrajectory {
  /** Uitwijjpunt in pixel, vanaf het midden van de explosie. */
  readonly x: number
  /** Hoogtepunt: negatief is boven het aambeeld. */
  readonly y: number
  readonly rotate: number
  readonly delay: number
}

/**
 * Vaste tabel, geen `Math.random()`. Zelfde reden als bij de vonken: een
 * willekeurige baan maakt de test en de screenshot onvoorspelbaar.
 *
 * De eindpunten liggen omlaag en naar buiten: de munten worden eerst omhoog
 * geschopt en regenieren daarna neer. Recht omhoog zou de munten achter de
 * vaste topbar terechtkomen, want de explosielaag begint bovenaan de view.
 * De zijwaartse spreiding blijft binnen 110px, zodat er op 320px niets buiten
 * het scherm stuurt.
 */
const trajectories: readonly CoinTrajectory[] = [
  { x: -10, y: 150, rotate: 180, delay: 0 },
  { x: 18, y: 190, rotate: -150, delay: 40 },
  { x: -48, y: 120, rotate: 210, delay: 20 },
  { x: 54, y: 138, rotate: -190, delay: 60 },
  { x: -88, y: 96, rotate: 240, delay: 30 },
  { x: 92, y: 110, rotate: -230, delay: 80 },
  { x: -108, y: 60, rotate: 270, delay: 10 },
  { x: 110, y: 74, rotate: -260, delay: 50 },
  { x: -70, y: 175, rotate: 200, delay: 70 },
  { x: 74, y: 185, rotate: -210, delay: 90 },
  { x: -32, y: 205, rotate: 225, delay: 110 },
  { x: 36, y: 212, rotate: -220, delay: 130 },
]

/**
 * De spreiding loopt mee met de beloning, maar over een log schaal en met een
 * klemmen. De projecten leveren 0, 5 miljoen en 500 miljoen munten; zonder
 * klemmen zou de derde explosie het scherm uit vliegen.
 */
const spread = computed(() => {
  if (!Number.isFinite(props.reward) || props.reward <= 0) {
    return 0.6
  }

  // Van 1e5 tot 1e9 loopt de factor van 1 tot 1.8, en niet verder.
  const decades = Math.log10(Math.min(Math.max(props.reward, 1e5), 1e9))
  const factor = 1 + (decades - 5) * 0.16

  return Math.min(1.8, Math.max(1, factor))
})

const coins = computed(() =>
  trajectories.map((trajectory) => ({
    ...trajectory,
    style: {
      '--coin-x': `${Math.round(trajectory.x * spread.value)}px`,
      '--coin-y': `${Math.round(trajectory.y * spread.value)}px`,
      '--coin-rotate': `${trajectory.rotate}deg`,
      '--coin-delay': `${trajectory.delay}ms`,
    },
  })),
)
</script>

<template>
  <span
    class="coin-burst"
    aria-hidden="true"
  >
    <i
      v-for="(coin, index) in coins"
      :key="index"
      class="coin-burst__coin"
      :style="coin.style"
    />
  </span>
</template>

<style scoped>
/*
 * Zelfde opzet als de vonken: buiten de flow, dus geen layoutverschuiving. De
 * oorsprong is de bovenkant van de explosielaag, niet het contactpunt van de
 * hamer; de munten komen immers uit het aambeeld omhoog, niet uit het
 * contactvlak, en zo hoeft deze laag de spritegrootte niet te kennen.
 */
.coin-burst {
  position: absolute;
  top: var(--effect-origin-y, 0);
  left: var(--effect-origin-x, 50%);
  width: 0;
  height: 0;
  pointer-events: none;
}

/*
 * Een munt is een groot gouden blok met een lichte rand en een donkere kant,
 * zodat hij als schijf leest en niet als rechthoek. Geen `border-radius`: dat
 * zou een cirkel maken en geen pixel.
 *
 * Let op de `animation`-shorthand: hier staat géén `--transition-medium` in.
 * Die token is `180ms ease`, dus hij zou zelf een duur in de lijst zetten en
 * de declaratie ongeldig maken zodra er al een duur en een vertraging staan.
 * Daarom losse `animation-*`-eigenschappen met een eigen duur en een eigen
 * curve, en niet één samengestelde regel.
 */
.coin-burst__coin {
  position: absolute;
  width: var(--coin-size, 32px);
  height: var(--coin-size, 32px);
  background: var(--color-focus);
  box-shadow:
    inset calc(var(--coin-size, 32px) * -0.14) calc(var(--coin-size, 32px) * -0.14) 0 0 var(--color-accent),
    inset calc(var(--coin-size, 32px) * 0.14) calc(var(--coin-size, 32px) * 0.14) 0 0 rgb(255 243 208 / 85%);
  animation-name: coin-fly;
  animation-duration: var(--coin-duration, 1200ms);
  animation-timing-function: cubic-bezier(0.25, 0.6, 0.35, 1);
  animation-delay: var(--coin-delay, 0ms);
  animation-fill-mode: both;
}

/*
 * Drie fasen: een korte opwaartse schop, daarna het uitwaaieren en neerkomen
 * met een draai. `--coin-x` en `--coin-y` zijn de eindpunten, dus dezelfde
 * animatie werkt voor elke spreiding.
 */
@keyframes coin-fly {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0deg) scale(0.3);
  }

  12% {
    opacity: 1;
    transform: translate(0, calc(var(--coin-size, 32px) * -1.1)) rotate(0deg) scale(1.12);
  }

  45% {
    opacity: 1;
    transform: translate(
        calc(var(--coin-x, 0px) * 0.5),
        calc(var(--coin-y, 0px) * 0.3)
      )
      rotate(calc(var(--coin-rotate, 0deg) * 0.5))
      scale(1);
  }

  100% {
    opacity: 0;
    transform: translate(var(--coin-x, 0px), var(--coin-y, 0px))
      rotate(var(--coin-rotate, 0deg)) scale(0.85);
  }
}

/*
 * Met minder bewegwens geen confetti: de munten zouden in één frame weg zijn.
 * De beloning staat in de header, dus er gaat geen informatie verloren.
 */
@media (prefers-reduced-motion: reduce) {
  .coin-burst {
    display: none;
  }
}
</style>