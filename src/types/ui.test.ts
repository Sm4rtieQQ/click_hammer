import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../App.vue'
import GameNavigation from '../components/GameNavigation.vue'
import { getViewBackgroundUrl } from './ui'
import type { GameView } from './ui'

describe('view backgrounds', () => {
  it('gives the projects view the city scenery', () => {
    const url = getViewBackgroundUrl('projects')

    expect(url).toBeDefined()
    expect(url).toContain('stad')
  })

  it('gives the smithy, upgrades and apprentice views no scenery', () => {
    expect(getViewBackgroundUrl('smithy')).toBeUndefined()
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
  it('applies the scenery class only on the projects view', async () => {
    const wrapper = mount(App)
    const main = wrapper.get('main')

    expect(main.classes()).toContain('app-content--scenery')
    expect(main.attributes('style')).toContain('background-image')

    await wrapper
      .getComponent(GameNavigation)
      .get('.game-navigation__tab[data-view="projects"]')
      .trigger('click')

    expect(wrapper.get('main').classes()).toContain('app-content--scenery')
  })
})