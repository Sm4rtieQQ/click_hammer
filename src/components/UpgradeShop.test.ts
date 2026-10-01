import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { upgrades } from '../data/upgrades'
import UpgradeItem from './UpgradeItem.vue'
import UpgradeShop from './UpgradeShop.vue'

const purchaseCounts = {
  101: 0,
  102: 0,
  103: 0,
}

const currentCosts = {
  101: 10,
  102: 20,
  103: 40,
}

function mountShop(
  overrides: Partial<{
    coins: number
    purchaseCounts: Record<number, number>
    currentCosts: Record<number, number>
    affordableUpgradeIds: Set<number>
    availableUpgrades: typeof upgrades
  }> = {},
) {
  return mount(UpgradeShop, {
    props: {
      upgrades: overrides.availableUpgrades ?? upgrades,
      coins: overrides.coins ?? 0,
      purchaseCounts: overrides.purchaseCounts ?? purchaseCounts,
      currentCosts: overrides.currentCosts ?? currentCosts,
      affordableUpgradeIds: overrides.affordableUpgradeIds ?? new Set<number>(),
    },
  })
}

describe('UpgradeShop', () => {
  it('renders the catalog in order and passes counts and costs', () => {
    const wrapper = mountShop({
      coins: 40,
      affordableUpgradeIds: new Set([101, 102, 103]),
      purchaseCounts: { ...purchaseCounts, 101: 2 },
    })
    const items = wrapper.findAllComponents(UpgradeItem)

    expect(items).toHaveLength(upgrades.length)
    expect(items.map((item) => item.props('upgrade').id)).toEqual([
      101, 102, 103,
    ])
    expect(items[0].props('currentCost')).toBe(10)
    expect(items[0].props('purchaseCount')).toBe(2)
    expect(items[0].props('affordable')).toBe(true)
    expect(wrapper.get('.upgrade-shop__balance').text()).toBe('40 munten')
  })

  it('passes an upgrade purchase event through unchanged', async () => {
    const wrapper = mountShop({
      coins: 10,
      affordableUpgradeIds: new Set([101]),
    })

    await wrapper.getComponent(UpgradeItem).get('button').trigger('click')

    expect(wrapper.emitted('buy-upgrade')).toEqual([[101]])
  })

  it('updates price and purchase count when props change', async () => {
    const wrapper = mountShop({
      coins: 15,
      affordableUpgradeIds: new Set([101]),
    })

    await wrapper.setProps({
      coins: 0,
      purchaseCounts: { ...purchaseCounts, 101: 1 },
      currentCosts: { ...currentCosts, 101: 15 },
      affordableUpgradeIds: new Set<number>(),
    })

    const item = wrapper.getComponent(UpgradeItem)
    expect(item.props('currentCost')).toBe(15)
    expect(item.props('purchaseCount')).toBe(1)
    expect(item.props('affordable')).toBe(false)
    expect(item.get('button').attributes('disabled')).toBeDefined()
  })

  it('marks upgrades as unaffordable when coins are insufficient', () => {
    const wrapper = mountShop({
      coins: 5,
      affordableUpgradeIds: new Set([101]),
    })
    const item = wrapper.getComponent(UpgradeItem)

    expect(item.props('affordable')).toBe(false)
    expect(item.get('button').text()).toBe('Niet betaalbaar')
  })

  it('renders an empty state without upgrade items', () => {
    const wrapper = mountShop({
      availableUpgrades: [],
    })

    expect(wrapper.findAllComponents(UpgradeItem)).toHaveLength(0)
    expect(wrapper.get('.upgrade-shop__empty').text()).toContain(
      'geen upgrades beschikbaar',
    )
  })
})
