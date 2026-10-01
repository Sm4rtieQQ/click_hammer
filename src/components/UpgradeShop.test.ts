import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { upgrades } from '../data/upgrades'
import UpgradeItem from './UpgradeItem.vue'
import UpgradeShop from './UpgradeShop.vue'

const purchaseCounts = {
  101: 0,
  102: 0,
  103: 0,
  104: 0,
  105: 0,
}

const currentCosts = {
  101: 10,
  102: 20,
  103: 40,
  104: 50,
  105: 1,
}

function mountShop(
  overrides: Partial<{
    coins: number
    purchaseCounts: Record<number, number>
    currentCosts: Record<number, number>
    affordableUpgradeIds: Set<number>
    availableUpgrades: typeof upgrades
    showDevUpgrades: boolean
  }> = {},
) {
  return mount(UpgradeShop, {
    props: {
      upgrades: overrides.availableUpgrades ?? upgrades,
      coins: overrides.coins ?? 0,
      purchaseCounts: overrides.purchaseCounts ?? purchaseCounts,
      currentCosts: overrides.currentCosts ?? currentCosts,
      affordableUpgradeIds: overrides.affordableUpgradeIds ?? new Set<number>(),
      showDevUpgrades: overrides.showDevUpgrades ?? false,
    },
  })
}

describe('UpgradeShop', () => {
  it('renders the catalog in order and passes counts and costs', () => {
    const wrapper = mountShop({
      coins: 40,
      affordableUpgradeIds: new Set([101, 102, 103, 104, 105]),
      purchaseCounts: { ...purchaseCounts, 101: 2 },
      // De dev-only upgrade is standaard verborgen in de winkel.
      showDevUpgrades: true,
    })
    const items = wrapper.findAllComponents(UpgradeItem)

    expect(items).toHaveLength(upgrades.length)
    expect(items.map((item) => item.props('upgrade').id)).toEqual([
      101, 102, 103, 104, 105,
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

  it('shows an empty state without upgrade items', () => {
    const wrapper = mountShop({
      availableUpgrades: [],
    })

    expect(wrapper.findAllComponents(UpgradeItem)).toHaveLength(0)
    expect(wrapper.get('.upgrade-shop__empty').text()).toContain(
      'geen upgrades beschikbaar',
    )
  })

  it('hides dev-only upgrades when showDevUpgrades is false', () => {
    const wrapper = mountShop({
      showDevUpgrades: false,
    })

    const items = wrapper.findAllComponents(UpgradeItem)
    expect(items).toHaveLength(upgrades.length - 1) // 1 upgrade is devOnly
    // Ontwikkelaarskracht (id 105) mag niet zichtbaar zijn
    expect(items.map((item) => item.props('upgrade').id)).not.toContain(105)
  })

  it('shows dev-only upgrades when showDevUpgrades is true', () => {
    const wrapper = mountShop({
      showDevUpgrades: true,
    })

    const items = wrapper.findAllComponents(UpgradeItem)
    expect(items).toHaveLength(upgrades.length) // alle upgrades incl. devOnly
    expect(items.map((item) => item.props('upgrade').id)).toContain(105)
  })

  it('passes the coin balance down so items can show the shortfall', () => {
    const wrapper = mountShop({ coins: 7 })
    const item = wrapper.getComponent(UpgradeItem)

    expect(item.props('coins')).toBe(7)
    expect(item.get('.upgrade-item__facts').text()).toContain('Nog 3 munten nodig')
  })
})
