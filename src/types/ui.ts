import backgroundCityUrl from '../sprites/backgrounds/stad.svg'

export type GameView = 'projects' | 'smithy' | 'upgrades' | 'apprentice'
export type ProgressTarget = 'order' | 'project'

/**
 * Waar een klik vandaan komt. Alleen een `manualClick` mag de hamer op het
 * aambeeld laten slaan; de leerling voegt stilletjes punten toe.
 */
export type ClickSource = 'manual' | 'auto'

/**
 * Achtergronden per view. De upgrades hebben bewust geen achtergrond: dat is
 * een winkel, geen locatie, en een scène zou daar afleiden.
 */
const backgroundUrlsByView: ReadonlyMap<GameView, string | undefined> =
  new Map<GameView, string | undefined>([
    ['projects', backgroundCityUrl],
    ['smithy', undefined],
    ['upgrades', undefined],
    ['apprentice', undefined],
  ])

export function getViewBackgroundUrl(view: GameView): string | undefined {
  return backgroundUrlsByView.get(view)
}