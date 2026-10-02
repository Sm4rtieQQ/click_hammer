import anvilSheetUrl from './forge/anvil-sheet.svg'

/**
 * De drie poses van het aambeeld, van links naar rechts in de sprite-sheet.
 * De index is tegelijk de frameindex in de sheet en de volgorde waarin de
 * posemachine ze doorloopt: `idle` -> `pressed` -> `strike` -> `idle`.
 */
export const FORGE_POSES = ['idle', 'pressed', 'strike'] as const

export type ForgePose = (typeof FORGE_POSES)[number]

export const forgeSheetUrl: string = anvilSheetUrl

/**
 * Eén cel is 48 bij 48 op het 16-grid uit `docs/visual-style.md`. De sheet is
 * drie cellen breed, dus `background-size` is 300% en de tekening drie keer
 * het element. Elke stap van 50% in `background-position` is dan precies een
 * cel, want het verschil tussen element en tekening is twee keer het element.
 * Zo staat de sprite nooit op een halve cel.
 */
export const FORGE_CELL_SIZE = 48
export const FORGE_FRAME_COUNT = FORGE_POSES.length

/** Stap per frame in procenten voor `background-position`. */
export const FORGE_FRAME_STEP = 50

export function isForgePose(value: string): value is ForgePose {
  return (FORGE_POSES as readonly string[]).includes(value)
}