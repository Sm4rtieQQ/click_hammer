import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GameButton from './GameButton.vue'

/*
 * De knop is het aambeeld: geen zichtbare tekst meer, maar wel een native
 * `<button>` met de klasse `game-button`. Die twee zijn het contract waar de
 * andere testbestanden op navigeren, dus ze blijven expliciet getest.
 */
describe('GameButton', () => {
  it('renders an enabled native button named for the anvil', () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    expect(button.element.tagName).toBe('BUTTON')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toContain('game-button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.attributes('aria-disabled')).toBeUndefined()
  })

  it('keeps a visible label for screen readers but shows none on screen', () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    expect(button.attributes('aria-label')).toBe('Sla op het aambeeld')
    // Het zichtbare zinnetje is weg; de naam komt nu uit aria-label.
    expect(button.text()).toBe('')
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
    await button.trigger('pointerdown')

    expect(wrapper.emitted('click')).toBeUndefined()
    expect(button.attributes('data-pose')).toBe('idle')
  })

  it('ignores unrelated keys and does not strike', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('keydown', { key: 'a' })

    expect(wrapper.get('button').attributes('data-strike-count')).toBe('0')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('does not strike repeatedly while a key is held down', async () => {
    const wrapper = mount(GameButton)

    await wrapper
      .get('button')
      .trigger('keydown', { key: ' ', repeat: true })

    expect(wrapper.get('button').attributes('data-strike-count')).toBe('0')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('hides the decorative sprite from assistive technology', () => {
    const wrapper = mount(GameButton)

    expect(wrapper.get('.game-button__forge').attributes('aria-hidden')).toBe(
      'true',
    )
  })
})

describe('GameButton pose sequence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in the idle pose and does not strike on mount', () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    expect(button.attributes('data-strike-count')).toBe('0')
    expect(button.attributes('data-pose')).toBe('idle')
  })

  it('walks idle -> pressed -> strike -> idle on one pointer click', async () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    expect(button.attributes('data-pose')).toBe('idle')

    // Een muis geeft eerst `pressed` en pas bij loslaten de click.
    await wrapper.get('button').trigger('pointerdown')

    expect(wrapper.get('button').attributes('data-pose')).toBe('pressed')

    await wrapper.get('button').trigger('pointerup')
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('data-pose')).toBe('strike')
    expect(wrapper.get('button').attributes('data-strike-count')).toBe('1')

    vi.advanceTimersByTime(140)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
  })

  it('returns to idle after the strike window for a keyboard activation', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('keydown', { key: 'Enter' })

    expect(wrapper.get('button').attributes('data-pose')).toBe('strike')

    vi.advanceTimersByTime(140)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
  })

  it('restarts the pose on a fast second click instead of staying stuck', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')
    vi.advanceTimersByTime(100)
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('data-strike-count')).toBe('2')
    expect(wrapper.get('button').attributes('data-pose')).toBe('strike')

    // De eerste timer is geannuleerd, dus na de tweede duur is de slag klaar.
    vi.advanceTimersByTime(140)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
  })

  it('drops the pressed pose when the pointer leaves or focus moves away', async () => {
    const wrapper = mount(GameButton)
    const button = wrapper.get('button')

    await button.trigger('pointerdown')

    expect(wrapper.get('button').attributes('data-pose')).toBe('pressed')

    await button.trigger('pointercancel')

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')

    await button.trigger('pointerdown')
    await button.trigger('blur')

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
  })

  it('clears the pending strike when unmounted mid-animation', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('data-pose')).toBe('strike')

    wrapper.unmount()

    // Geen timer meer die na de unmount nog een update probeert te doen.
    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
  })
})

describe('GameButton spark burst', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows no sparks while idle', () => {
    const wrapper = mount(GameButton)

    expect(wrapper.find('.spark-burst').exists()).toBe(false)
  })

  it('puts the sparks inside the sprite stage, not beside it', () => {
    const wrapper = mount(GameButton)
    const stage = wrapper.get('.game-button__stage')

    // De vonken delen het vak van de sprite; anders klopt het contactpunt niet.
    expect(stage.find('.game-button__forge').exists()).toBe(true)
    expect(stage.find('.spark-burst').exists()).toBe(false)
  })

  it('ignores a pointerdown and only sparks on the strike itself', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('pointerdown')

    expect(wrapper.get('button').attributes('data-pose')).toBe('pressed')
    expect(wrapper.find('.spark-burst').exists()).toBe(false)

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('data-pose')).toBe('strike')
    expect(wrapper.find('.spark-burst').exists()).toBe(true)
  })

  it('sparks on a keyboard activation too', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('.spark-burst').exists()).toBe(true)
  })

  it('removes the sparks again once the spark shower has passed', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')

    expect(wrapper.find('.spark-burst').exists()).toBe(true)

    // De vonkenbad duurt langer dan de slag, dus na 140ms is de hamer alweer
    // in idle terwijl de vonken nog onderweg zijn.
    vi.advanceTimersByTime(140)
    await wrapper.vm.$nextTick()

    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
    expect(wrapper.find('.spark-burst').exists()).toBe(true)

    vi.advanceTimersByTime(280)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.spark-burst').exists()).toBe(false)
  })

  it('restarts the sparks on a fast second click', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')

    const firstSpark = wrapper.get('.spark-burst').element

    vi.advanceTimersByTime(80)
    await wrapper.get('button').trigger('click')

    const secondSpark = wrapper.get('.spark-burst').element

    // Een nieuw element, anders herstart de CSS-animatie niet.
    expect(secondSpark).not.toBe(firstSpark)
    expect(wrapper.get('button').attributes('data-strike-count')).toBe('2')
  })

  it('leaves the pose intact when the sparks are hidden', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')
    vi.advanceTimersByTime(420)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.spark-burst').exists()).toBe(false)
    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
    expect(wrapper.get('button').attributes('data-strike-count')).toBe('1')
  })

  it('does not spark on repeated keydown while a key is held', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('keydown', { key: ' ', repeat: true })

    expect(wrapper.find('.spark-burst').exists()).toBe(false)
  })

  it('does not spark at all while disabled', async () => {
    const wrapper = mount(GameButton, {
      props: { disabled: true },
    })

    await wrapper.get('button').trigger('click')
    await wrapper.get('button').trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('.spark-burst').exists()).toBe(false)
    expect(wrapper.get('button').attributes('data-pose')).toBe('idle')
  })

  it('clears the spark timer when unmounted mid-burst', async () => {
    const wrapper = mount(GameButton)

    await wrapper.get('button').trigger('click')

    expect(wrapper.find('.spark-burst').exists()).toBe(true)

    wrapper.unmount()

    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
  })
})

describe('GameButton sprite wiring', () => {
  it('points the sprite at the forge sheet and the matching frame', async () => {
    const wrapper = mount(GameButton)
    const sprite = wrapper.get('.game-button__forge')

    const readFrame = () => sprite.attributes('style')?.match(/--forge-frame:\s*(\d+)/)?.[1]

    expect(sprite.attributes('style')).toContain('anvil-sheet')
    expect(sprite.attributes('style')).toContain('--forge-frame: 0')

    await wrapper.get('button').trigger('click')

    expect(readFrame()).toBe('2')
  })
})