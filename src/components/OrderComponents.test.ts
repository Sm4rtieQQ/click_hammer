import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createWorkOrder, getOrderDefinition } from '../data/orders'
import OrderSelection from './OrderSelection.vue'
import OrderTracker from './OrderTracker.vue'

function createOrder(progress = 0) {
  const definition = getOrderDefinition(1, 2)

  if (definition === undefined) {
    throw new Error('Missing test order definition')
  }

  return createWorkOrder(1, definition, 0, progress)
}

describe('OrderSelection', () => {
  it('renders commands and rewards without showing required points', () => {
    const wrapper = mount(OrderSelection, {
      props: {
        orders: [createOrder()],
      },
    })

    expect(wrapper.text()).toContain('smeed 10 bronzen klinknagels')
    expect(wrapper.text()).toContain('12 munten')
    expect(wrapper.text()).not.toContain('punten')
    expect(wrapper.get('button').text()).toBe('Kies opdracht')
  })

  it('emits the selected order ID once', async () => {
    const order = createOrder()
    const wrapper = mount(OrderSelection, {
      props: {
        orders: [order],
      },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[order.id]])
  })
})

describe('OrderTracker', () => {
  it('shows item progress and a total progress bar without required points', () => {
    const wrapper = mount(OrderTracker, {
      props: {
        order: createOrder(3.2),
      },
    })
    const itemBar = wrapper.get('.order-tracker__item-bar')
    const totalBar = wrapper.get('.order-tracker__total-bar')

    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(2)
    expect(wrapper.get('.order-tracker__item-row strong').text()).toBe('2 / 10')
    expect(itemBar.attributes('aria-valuemax')).toBe('100')
    expect(itemBar.attributes('aria-valuenow')).toBe('13')
    expect(itemBar.find('.order-tracker__item-bar-fill').attributes('style')).toContain(
      'width: 13.33',
    )
    expect(totalBar.attributes('aria-valuenow')).toBe('21')
    expect(wrapper.text()).toContain('21% voltooid')
    expect(wrapper.text()).not.toContain('15 punten')
  })

  it('shows a complete order at one hundred percent', () => {
    const wrapper = mount(OrderTracker, {
      props: {
        order: createOrder(15),
      },
    })

    expect(wrapper.get('.order-tracker__item-row strong').text()).toBe('10 / 10')
    expect(wrapper.findAll('.order-tracker__item-bar')).toHaveLength(1)
    expect(wrapper.get('.order-tracker__total-bar-fill').attributes('style')).toContain(
      'width: 100%',
    )
    expect(wrapper.get('.order-tracker__total-row').text()).toContain('100% voltooid')
  })
})
