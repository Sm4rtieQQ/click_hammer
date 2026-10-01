import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
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
      'Smidse',
      'Upgrades',
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
      'Smidse',
      'Upgrades',
    ])

    await mobileItems[2].trigger('click')

    expect(wrapper.emitted('select')).toEqual([['upgrades']])
    expect(wrapper.find('.game-navigation__mobile-menu').exists()).toBe(false)
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
