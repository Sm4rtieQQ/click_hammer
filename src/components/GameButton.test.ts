import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GameButton from './GameButton.vue'

describe('GameButton', () => {
  it('renders an enabled native button with a visible label', () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-disabled')).toBeUndefined()
    expect(button.text()).toContain('Sla op het aambeeld')
  })

  it('emits exactly one click event for a pointer click', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('click')).toEqual([[]])
  })

  it.each(['Enter', ' '])(
    'emits exactly one click event for the %j keyboard activation',
    async (key) => {
      const wrapper = mount(GameButton)

      await wrapper.get('button').trigger('keydown', { key })

      expect(wrapper.emitted('click')).toEqual([[]])
    },
  )

  it('ignores repeated keyboard activation', async () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    await button.trigger('keydown', { key: 'Enter', repeat: true })
    await button.trigger('keydown', { key: 'Enter', repeat: false })

    expect(wrapper.emitted('click')).toEqual([[]])
  })

  it('uses semantic disabled state and emits no activation events', async () => {
    const wrapper = mount(GameButton, {
      props: {
        disabled: true,
      },
    })
    const button = wrapper.get('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.classes()).toContain('game-button')

    await button.trigger('click')
    await button.trigger('keydown', { key: 'Enter' })
    await button.trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
