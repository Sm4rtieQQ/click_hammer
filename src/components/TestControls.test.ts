import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TestControls from './TestControls.vue'

describe('TestControls', () => {
  it('renders an accessible reset button', () => {
    const wrapper = mount(TestControls)
    const button = wrapper.get('button')

    expect(wrapper.get('aside').attributes('aria-label')).toBe('Testbeheer')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('Game resetten')
  })

  it('emits one reset event per click', async () => {
    const wrapper = mount(TestControls)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('reset')).toEqual([[]])
  })
})
