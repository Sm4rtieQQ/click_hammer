import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ApprenticePanel from './ApprenticePanel.vue'

describe('ApprenticePanel', () => {
  it('shows the rate as 10% of the current click power', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.11, clickPower: 1.1 },
    })

    expect(wrapper.get('#apprentice-panel-title').text()).toBe('Leerling')
    expect(wrapper.text()).toContain('10%')
    expect(wrapper.text()).toContain('punten per seconde')
    // Zowel de exacte als de afgeronde rate staan in de tekst.
    expect(wrapper.text()).toContain('0.1')
  })

  it('derives a per-minute estimate from the per-second rate', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.5, clickPower: 5 },
    })

    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('punten per minuut')
  })

  it('renders as a labelled region for assistive tech', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.1, clickPower: 1 },
    })

    expect(wrapper.attributes('aria-labelledby')).toBe(
      'apprentice-panel-title',
    )
    expect(wrapper.find('#apprentice-panel-title').exists()).toBe(true)
  })
})