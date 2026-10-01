import { mount } from '@vue/test-utils'
import { describe, expect, expectTypeOf, it } from 'vitest'
import GameHeader from './GameHeader.vue'

describe('GameHeader', () => {
  it('renders the initial score and coin values', () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 0,
        coins: 0,
      },
    })
    const terms = wrapper.findAll('dt')
    const values = wrapper.findAll('dd')

    expect(wrapper.element.tagName).toBe('HEADER')
    expect(wrapper.get('h1').text()).toBe('ClickHammer')
    expect(wrapper.find('.game-header__eyebrow').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Sla de smederij op')
    expect(terms.map((term) => term.text())).toEqual(['Score', 'Munten'])
    expect(values.map((value) => value.text())).toEqual(['0', '0'])
    expectTypeOf(wrapper.props('points')).toEqualTypeOf<number>()
    expectTypeOf(wrapper.props('coins')).toEqualTypeOf<number>()
  })

  it('announces score and coin changes through a polite live region', () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 0,
        coins: 0,
      },
    })
    const stats = wrapper.get('.game-header__stats')

    expect(stats.attributes('aria-live')).toBe('polite')
    expect(stats.attributes('aria-atomic')).toBe('true')
    expect(stats.attributes('aria-label')).toBe('Spelstatus')
  })

  it('updates score and coins reactively through props', async () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 0,
        coins: 0,
      },
    })

    await wrapper.setProps({ points: 123.45, coins: 8 })

    const values = wrapper.findAll('dd')
    expect(values.map((value) => value.text())).toEqual(['123', '8'])
  })

  it('rounds and abbreviates the displayed score without changing its prop', async () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 9_999,
        coins: 0,
      },
    })

    expect(wrapper.get('dd').text()).toBe('10k')
    expect(wrapper.props('points')).toBe(9_999)

    await wrapper.setProps({ points: 9_999_000 })

    expect(wrapper.get('dd').text()).toBe('10m')
    expect(wrapper.props('points')).toBe(9_999_000)
  })

  it('contains only score and coin statistics', () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 42,
        coins: 5,
      },
    })

    expect(wrapper.findAll('dt')).toHaveLength(2)
    expect(wrapper.findAll('dd')).toHaveLength(2)
    expect(wrapper.text().toLowerCase()).not.toContain('project')
    expect(wrapper.text().toLowerCase()).not.toContain('voltooid')
  })

  it('is presentational and emits no events', () => {
    const wrapper = mount(GameHeader, {
      props: {
        points: 10,
        coins: 2,
      },
    })

    expect(wrapper.emitted()).toEqual({})
  })
})
