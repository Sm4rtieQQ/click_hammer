import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ApprenticePanel from './ApprenticePanel.vue'

describe('ApprenticePanel', () => {
  it('shows the rate as 10% of the current click power', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.11, clickPower: 1.1, isWorking: true },
    })

    expect(wrapper.get('#apprentice-panel-title').text()).toBe('Leerling')
    expect(wrapper.text()).toContain('10%')
    expect(wrapper.text()).toContain('punten per seconde')
    // Zowel de exacte als de afgeronde rate staan in de tekst.
    expect(wrapper.text()).toContain('0.1')
  })

  it('derives a per-minute estimate from the per-second rate', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.5, clickPower: 5, isWorking: true },
    })

    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('punten per minuut')
  })

  it('says he only works on the active order while working', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.5, clickPower: 5, isWorking: true },
    })

    expect(wrapper.text()).toContain('actieve order')
    expect(wrapper.text()).toContain('Aan projecten helpt hij niet mee')
  })

  describe('without an active order', () => {
    it('shows no rate at all, because nothing comes in', () => {
      const wrapper = mount(ApprenticePanel, {
        props: { autoClickerRate: 0.11, clickPower: 1.1, isWorking: false },
      })

      // Een cijfer dat er toch niet binnenkomt zou de speler misleiden.
      expect(wrapper.text()).not.toContain('punten per seconde')
      expect(wrapper.text()).not.toContain('punten per minuut')
      expect(wrapper.text()).not.toContain('0.1')
      expect(wrapper.text()).not.toContain('1.1')
      expect(wrapper.find('.apprentice-panel__stats').exists()).toBe(false)
    })

    it('tells the player he is idle and how to start him', () => {
      const wrapper = mount(ApprenticePanel, {
        props: { autoClickerRate: 0.11, clickPower: 1.1, isWorking: false },
      })

      expect(wrapper.text()).toContain('De leerling werkt niet')
      expect(wrapper.text()).toContain('Smederij')
      expect(wrapper.text()).toContain('Aan projecten helpt hij niet mee')
    })

    it('announces the idle state politely for assistive tech', () => {
      const wrapper = mount(ApprenticePanel, {
        props: { autoClickerRate: 0.11, clickPower: 1.1, isWorking: false },
      })

      const waiting = wrapper.get('.apprentice-panel__waiting')

      expect(waiting.attributes('role')).toBe('status')
    })

    it('swaps between the waiting and working state on the prop', async () => {
      const wrapper = mount(ApprenticePanel, {
        props: { autoClickerRate: 0.11, clickPower: 1.1, isWorking: false },
      })

      expect(wrapper.find('.apprentice-panel__waiting').exists()).toBe(true)
      expect(wrapper.find('.apprentice-panel__stats').exists()).toBe(false)

      await wrapper.setProps({ isWorking: true })

      expect(wrapper.find('.apprentice-panel__waiting').exists()).toBe(false)
      expect(wrapper.find('.apprentice-panel__stats').exists()).toBe(true)
      expect(wrapper.text()).toContain('punten per seconde')
    })
  })

  it('renders as a labelled region for assistive tech', () => {
    const wrapper = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.1, clickPower: 1, isWorking: true },
    })

    expect(wrapper.attributes('aria-labelledby')).toBe(
      'apprentice-panel-title',
    )
    expect(wrapper.find('#apprentice-panel-title').exists()).toBe(true)
  })

  it('keeps its heading in both states', () => {
    const idle = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.1, clickPower: 1, isWorking: false },
    })
    const busy = mount(ApprenticePanel, {
      props: { autoClickerRate: 0.1, clickPower: 1, isWorking: true },
    })

    expect(idle.get('#apprentice-panel-title').text()).toBe('Leerling')
    expect(busy.get('#apprentice-panel-title').text()).toBe('Leerling')
  })
})