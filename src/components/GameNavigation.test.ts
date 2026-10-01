import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { GameView } from '../types/ui'
import GameNavigation from './GameNavigation.vue'

describe('GameNavigation', () => {
  it('renders desktop tabs with the active view selected', () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'projects',
      },
    })
    const tabs = wrapper.findAll('.game-navigation__tab')

    expect(tabs.map((tab) => tab.text())).toEqual([
      'Projecten',
      'Smederij',
      'Upgrades',
      'Leerling',
    ])
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[0].attributes('aria-controls')).toBe('game-panel-projects')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
  })

  it('emits the selected desktop tab', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'smithy',
      },
    })

    await wrapper
      .get('.game-navigation__tab[data-view="upgrades"]')
      .trigger('click')

    expect(wrapper.emitted('select')).toEqual([['upgrades']])
  })

  it('opens and closes the mobile menu after selecting a view', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'smithy',
      },
    })
    const menuButton = wrapper.get('.game-navigation__menu-toggle')

    expect(menuButton.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(false)

    await menuButton.trigger('click')
    expect(menuButton.attributes('aria-expanded')).toBe('true')

    const mobileItems = wrapper.findAll('.game-navigation__mobile-item')
    expect(mobileItems.map((item) => item.text())).toEqual([
      'Projecten',
      'Smederij',
      'Upgrades',
      'Leerling',
    ])

    await mobileItems[2].trigger('click')

    expect(wrapper.emitted('select')).toEqual([['upgrades']])
    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(false)
  })

  it('disables locked views and ignores their selection', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'projects',
        disabledViews: ['smithy', 'upgrades'],
      },
    })

    const smithyTab = wrapper.get('.game-navigation__tab[data-view="smithy"]')
    const upgradesTab = wrapper.get(
      '.game-navigation__tab[data-view="upgrades"]',
    )

    expect(smithyTab.attributes('disabled')).toBeDefined()
    expect(upgradesTab.attributes('disabled')).toBeDefined()
    expect(
      wrapper.get('.game-navigation__tab[data-view="projects"]').attributes(
        'disabled',
      ),
    ).toBeUndefined()

    await smithyTab.trigger('click')
    await upgradesTab.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()

    await wrapper
      .get('.game-navigation__menu-toggle')
      .trigger('click')
    const mobileItems = wrapper.findAll('.game-navigation__mobile-item')

    expect(mobileItems[1].attributes('disabled')).toBeDefined()
    expect(mobileItems[2].attributes('disabled')).toBeDefined()

    await mobileItems[1].trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('moves between tabs with the arrow keys, wrapping around', async () => {
    const wrapper = mount(GameNavigation, {
      attachTo: document.body,
      props: {
        activeView: 'projects',
      },
    })
    const tablist = wrapper.get('.game-navigation__tabs')

    const press = async (key: string): Promise<void> => {
      await tablist.trigger('keydown', { key })
      const emitted = wrapper.emitted('select') as [GameView][] | undefined
      const latest = emitted?.[emitted.length - 1]?.[0]

      if (latest !== undefined) {
        await wrapper.setProps({ activeView: latest })
      }
    }

    await press('ArrowRight')
    expect(wrapper.emitted('select')).toEqual([['smithy']])

    await press('ArrowDown')
    expect(wrapper.emitted('select')?.length).toBe(2)
    expect(wrapper.props('activeView')).toBe('upgrades')

    await press('ArrowRight')
    expect(wrapper.props('activeView')).toBe('apprentice')

    await press('ArrowRight')
    expect(wrapper.props('activeView')).toBe('projects')

    await press('ArrowLeft')
    expect(wrapper.props('activeView')).toBe('apprentice')

    await press('Home')
    expect(wrapper.props('activeView')).toBe('projects')

    await press('End')
    expect(wrapper.props('activeView')).toBe('apprentice')

    expect(wrapper.emitted('select')?.length).toBe(7)
    expect(document.activeElement).toBe(
      wrapper.get('.game-navigation__tab[data-view="apprentice"]').element,
    )

    wrapper.unmount()
  })

  it('skips disabled views during arrow key navigation', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'projects',
        disabledViews: ['smithy'],
      },
    })

    await wrapper
      .get('.game-navigation__tabs')
      .trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('select')).toEqual([['upgrades']])
  })

  it('ignores unrelated keys in the tablist', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'projects',
      },
    })

    await wrapper.get('.game-navigation__tabs').trigger('keydown', { key: 'a' })

    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('closes the mobile menu on Escape and restores focus', async () => {
    const wrapper = mount(GameNavigation, {
      attachTo: document.body,
      props: {
        activeView: 'projects',
      },
    })
    const menuButton = wrapper.get('.game-navigation__menu-toggle')

    await menuButton.trigger('click')
    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(true)

    await wrapper
      .get('.game-navigation__mobile-menu')
      .trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(false)
    expect(document.activeElement).toBe(menuButton.element)

    wrapper.unmount()
  })

  it('closes the mobile menu when the active view changes externally', async () => {
    const wrapper = mount(GameNavigation, {
      props: {
        activeView: 'smithy',
      },
    })

    await wrapper.get('.game-navigation__menu-toggle').trigger('click')
    await wrapper.setProps({ activeView: 'upgrades' })

    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(false)
  })
})
