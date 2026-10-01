import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { upgrades } from '../data/upgrades'
import UpgradeItem from './UpgradeItem.vue'

const upgrade = upgrades[0]

function mountItem(overrides: Partial<{
  currentCost: number
  purchaseCount: number
  affordable: boolean
}> = {}) {
  return mount(UpgradeItem, {
    props: {
      upgrade,
      currentCost: 10,
      purchaseCount: 0,
      affordable: true,
      ...overrides,
    },
  })
}

describe('UpgradeItem', () => {
  it('renders upgrade content, bonus, price and purchase count', () => {
    const wrapper = mountItem()

    expect(wrapper.get('h3').text()).toBe(upgrade.name)
    expect(wrapper.get('.upgrade-item__description').text()).toBe(
      upgrade.description,
    )
    expect(wrapper.get('.upgrade-item__facts').text()).toContain('+10% clickkracht')
    expect(wrapper.get('.upgrade-item__facts').text()).toContain('10 munten')
    expect(wrapper.get('.upgrade-item__button').text()).toBe('Koop upgrade')
  })

  it('renders a purchased variant with its purchase count', () => {
    const wrapper = mountItem({ purchaseCount: 2 })

    expect(wrapper.get('.upgrade-item__badge').text()).toBe('Gekocht 2×')
    expect(wrapper.classes()).toContain('upgrade-item--purchased')
  })

  it('emits the upgrade ID when affordable', async () => {
    const wrapper = mountItem()

    await wrapper.get('.upgrade-item__button').trigger('click')

    expect(wrapper.emitted('buy-upgrade')).toEqual([[upgrade.id]])
  })

  it('disables the purchase button when the upgrade is unaffordable', async () => {
    const wrapper = mountItem({ affordable: false })
    const button = wrapper.get('.upgrade-item__button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.text()).toBe('Niet betaalbaar')

    await button.trigger('click')

    expect(wrapper.emitted('buy-upgrade')).toBeUndefined()
  })

  it('does not emit a second request for a rapid double click', async () => {
    const wrapper = mountItem()
    const button = wrapper.get('.upgrade-item__button')

    const firstClick = button.trigger('click')
    const secondClick = button.trigger('click')
    await Promise.all([firstClick, secondClick])

    expect(wrapper.emitted('buy-upgrade')).toEqual([[upgrade.id]])
  })

  it('does not mutate the upgrade data or purchase count locally', async () => {
    const wrapper = mountItem()
    const upgradeBeforeClick = { ...upgrade }

    await wrapper.get('.upgrade-item__button').trigger('click')

    expect(upgrade).toEqual(upgradeBeforeClick)
    expect(wrapper.props('purchaseCount')).toBe(0)
  })
})
