import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useTransientEffect } from './useTransientEffect'

describe('useTransientEffect', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts idle and never ran', () => {
    const { isRunning, runId } = useTransientEffect({ durationMs: 100 })

    expect(isRunning.value).toBe(false)
    expect(runId.value).toBe(0)
  })

  it('turns on and off again after the given duration', () => {
    const { isRunning, trigger } = useTransientEffect({ durationMs: 100 })

    trigger()

    expect(isRunning.value).toBe(true)

    vi.advanceTimersByTime(99)
    expect(isRunning.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(isRunning.value).toBe(false)
  })

  it('raises the run id on every trigger, even while still running', () => {
    const { isRunning, runId, trigger } = useTransientEffect({ durationMs: 100 })

    trigger()

    expect(runId.value).toBe(1)
    expect(isRunning.value).toBe(true)

    // Tweede klik halverwege: isRunning blijft waar, dus alleen runId laat zien
    // dat het effect opnieuw moet beginnen.
    vi.advanceTimersByTime(50)
    trigger()

    expect(isRunning.value).toBe(true)
    expect(runId.value).toBe(2)
  })

  it('restarts the duration on a re-trigger instead of ending early', () => {
    const { isRunning, trigger } = useTransientEffect({ durationMs: 100 })

    trigger()
    vi.advanceTimersByTime(80)
    trigger()

    // Nog 80ms later moet de eerste timer allang klaar zijn geweest.
    vi.advanceTimersByTime(80)
    expect(isRunning.value).toBe(true)

    vi.advanceTimersByTime(20)
    expect(isRunning.value).toBe(false)
  })

  it('leaves exactly one timer pending, not one per trigger', () => {
    const { trigger } = useTransientEffect({ durationMs: 100 })

    trigger()
    trigger()
    trigger()

    expect(vi.getTimerCount()).toBe(1)
  })

  it('stops on demand', () => {
    const { isRunning, trigger, stop } = useTransientEffect({ durationMs: 100 })

    trigger()
    stop()

    expect(isRunning.value).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('treats a negative duration as zero rather than waiting backwards', () => {
    const { isRunning, trigger } = useTransientEffect({ durationMs: -50 })

    trigger()

    expect(isRunning.value).toBe(true)

    vi.advanceTimersByTime(0)
    expect(isRunning.value).toBe(false)
  })

  it('clears the pending timer when the owning scope is disposed', () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const effect = useTransientEffect({ durationMs: 100 })

          effect.trigger()

          return { isRunning: effect.isRunning }
        },
        template: '<div />',
      }),
    )

    expect(vi.getTimerCount()).toBe(1)
    expect(wrapper.vm.isRunning).toBe(true)

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
    expect(() => vi.advanceTimersByTime(500)).not.toThrow()
  })

  it('does not throw when disposed outside a component scope', () => {
    const { trigger } = useTransientEffect({ durationMs: 100 })

    trigger()

    expect(vi.getTimerCount()).toBe(1)
  })
})
