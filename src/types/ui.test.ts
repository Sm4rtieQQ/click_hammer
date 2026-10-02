import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import App from '../App.vue'
import GameNavigation from '../components/GameNavigation.vue'
import { GAME_STORAGE_KEY } from '../composables/gameStorage'
import { createTestGameState } from '../test/fixtures'
import { getViewBackgroundUrl } from './ui'
import type { GameView } from './ui'

/*
 * De smederij blijft geblokkeerd tot project een klaar is. Door die save vooraf
 * te zetten opent het tabblad meteen en hoeft de test niet door het project te
 * klikken om bij de achtergrond te komen.
 */
function unlockSmithy(): void {
  window.localStorage.setItem(
    GAME_STORAGE_KEY,
    JSON.stringify(createTestGameState({ completedProjects: [1] })),
  )
}

async function openSmithy(wrapper: VueWrapper): Promise<void> {
  await wrapper
    .getComponent(GameNavigation)
    .get('.game-navigation__tab[data-view="smithy"]')
    .trigger('click')
}

describe('view backgrounds', () => {
  it('gives the projects view the city scenery', () => {
    const url = getViewBackgroundUrl('projects')

    expect(url).toBeDefined()
    expect(url).toContain('stad')
  })

  it('gives the smithy view the forge scenery', () => {
    const url = getViewBackgroundUrl('smithy')

    expect(url).toBeDefined()
    expect(url).toContain('smederij')
  })

  it('gives the upgrades and apprentice views no scenery', () => {
    expect(getViewBackgroundUrl('upgrades')).toBeUndefined()
    expect(getViewBackgroundUrl('apprentice')).toBeUndefined()
  })

  it('has a background for every view without throwing', () => {
    const views: GameView[] = [
      'projects',
      'smithy',
      'upgrades',
      'apprentice',
    ]

    for (const view of views) {
      expect(() => getViewBackgroundUrl(view)).not.toThrow()
    }
  })
})

describe('App scenery wiring', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('applies the scenery class on the projects view', async () => {
    const wrapper = mount(App)
    const main = wrapper.get('main')

    expect(main.classes()).toContain('app-content--scenery')
    expect(main.attributes('style')).toContain('background-image')
  })

  it('swaps the scenery class and modifier when the smithy opens', async () => {
    unlockSmithy()

    const wrapper = mount(App)

    expect(wrapper.get('main').classes()).not.toContain(
      'app-content--scenery--smithy',
    )

    await openSmithy(wrapper)

    const main = wrapper.get('main')

    expect(main.classes()).toContain('app-content--scenery')
    expect(main.classes()).toContain('app-content--scenery--smithy')
    expect(main.attributes('style')).toContain('smederij')
  })

  it('drops the smithy modifier again when leaving the smithy', async () => {
    unlockSmithy()

    const wrapper = mount(App)

    await openSmithy(wrapper)
    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="projects"]')
      .trigger('click')

    const main = wrapper.get('main')

    expect(main.classes()).toContain('app-content--scenery')
    expect(main.classes()).not.toContain('app-content--scenery--smithy')
  })

  it('leaves the smithy without scenery while project one is unfinished', () => {
    const wrapper = mount(App)

    expect(
      wrapper.find('.game-navigation__tab[data-view="smithy"]').attributes(),
    ).toHaveProperty('disabled')
  })
})