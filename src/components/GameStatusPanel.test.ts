import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameStatusPanel from './GameStatusPanel.vue'

describe('GameStatusPanel', () => {
  it('renders a polite status region for informational states', () => {
    const wrapper = mount(GameStatusPanel, {
      props: {
        title: 'Alle projecten voltooid',
        message: 'Verder spelen kan via opdrachten.',
      },
      slots: {
        eyebrow: 'Klaar',
      },
    })

    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.classes()).toContain('game-status--info')
    expect(wrapper.get('h2').text()).toBe('Alle projecten voltooid')
    expect(wrapper.get('.game-status__message').text()).toBe(
      'Verder spelen kan via opdrachten.',
    )
    expect(wrapper.get('.game-status__eyebrow').text()).toBe('Klaar')
  })

  it.each(['warning', 'error'] as const)(
    'renders an assertive alert for the %s tone',
    (tone) => {
      const wrapper = mount(GameStatusPanel, {
        props: {
          tone,
          title: 'Voortgang wordt niet bewaard',
        },
      })

      expect(wrapper.attributes('role')).toBe('alert')
      expect(wrapper.attributes('aria-live')).toBe('assertive')
      expect(wrapper.classes()).toContain(`game-status--${tone}`)
      expect(wrapper.find('.game-status__message').exists()).toBe(false)
    },
  )

  it('keeps the layout stable when the eyebrow slot is empty', () => {
    const wrapper = mount(GameStatusPanel, {
      props: {
        title: 'Geen projecten',
      },
    })

    expect(wrapper.get('.game-status__eyebrow').text()).toBe('')
    expect(wrapper.classes()).toContain('panel')
  })
})