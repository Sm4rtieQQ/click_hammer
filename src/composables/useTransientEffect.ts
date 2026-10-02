import { getCurrentScope, onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'

export interface UseTransientEffectOptions {
  /** Hoelang het effect zichtbaar blijft, in milliseconden. */
  readonly durationMs: number
}

export interface UseTransientEffectReturn {
  /** Zolang dit waar is, staat het effect in de DOM. */
  readonly isRunning: Ref<boolean>
  /**
   * Teller die bij elke `trigger` oploopt. Bind hem als `:key` op het
   * effectelement: zonder key blijft het element bij een snelle tweede
   * activatie in de DOM en herstart de CSS-animatie niet.
   */
  readonly runId: Ref<number>
  readonly trigger: () => void
  readonly stop: () => void
}

/**
 * Tijdelijk visueel effect dat na een vaste duur vanzelf verdwijnt.
 *
 * De duur zit bewust in JavaScript en niet in de animatie: het element moet
 * echt uit de DOM, want dat is het enige dat de browser zeker niet meer
 * tekent. Onder `prefers-reduced-motion: reduce` duurt de animatie nog 1ms,
 * maar het element blijft tot zijn tijd op voorbij staan. Dat is onzichtbaar
 * en het houdt de toestand voorspelbaar voor tests.
 */
export function useTransientEffect(
  options: UseTransientEffectOptions,
): UseTransientEffectReturn {
  const durationMs = Math.max(0, options.durationMs)
  const isRunning = ref(false)
  const runId = ref(0)
  let timeoutId: number | undefined

  function clearTimer(): void {
    if (timeoutId === undefined) {
      return
    }

    window.clearTimeout(timeoutId)
    timeoutId = undefined
  }

  function stop(): void {
    clearTimer()
    isRunning.value = false
  }

  function trigger(): void {
    // `runId` eerst ophogen: dat herstart de animatie ook als het vorige
    // effect nog niet klaar is en `isRunning` dus niet verandert.
    runId.value += 1
    isRunning.value = true
    clearTimer()
    timeoutId = window.setTimeout(() => {
      timeoutId = undefined
      isRunning.value = false
    }, durationMs)
  }

  /*
   * Buiten een component scope (een losse unit test bijvoorbeeld) blijft de
   * timer bestaan tot `stop()` wordt aangeroepen. Binnen een scope ruimt
   * `onScopeDispose` hem automatisch op, zodat een unmount nooit een timer
   * laat hangen. Zelfde afweging als de interval van de leerling.
   */
  if (getCurrentScope() !== undefined) {
    onScopeDispose(stop)
  }

  return {
    isRunning,
    runId,
    trigger,
    stop,
  }
}
