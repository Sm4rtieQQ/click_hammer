import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { items } from '../data/items'
import { materials } from '../data/materials'
import { orderDefinitions } from '../data/orders'
import { upgrades } from '../data/upgrades'
import {
  fallbackMaterialPalette,
  getItemById,
  getItemSilhouetteUrl,
  getKnownItemIds,
  getKnownMaterialIds,
  getKnownUpgradeIds,
  getMaterialById,
  getMaterialPalette,
  getUpgradeById,
  getUpgradePalette,
  getUpgradeSilhouetteUrl,
} from './sprites'
import ItemSprite from '../components/ItemSprite.vue'
import UpgradeSprite from '../components/UpgradeSprite.vue'

const hexPattern = /^#[0-9a-f]{6}$/i

function styleOf(wrapper: ReturnType<typeof mount>): Record<string, string> {
  const style = wrapper.attributes('style') ?? ''
  const declarations: Record<string, string> = {}

  // Let op: een data-URL bevat zelf een ':', dus splits op de eerste kolom.
  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')

    if (separator === -1) {
      continue
    }

    const property = declaration.slice(0, separator).trim()
    const value = declaration.slice(separator + 1).trim()

    if (property !== '') {
      declarations[property] = value
    }
  }

  return declarations
}

describe('sprite catalog', () => {
  it('has exactly one silhouette per item', () => {
    expect(getKnownItemIds()).toEqual(items.map((item) => item.id))

    const urls = items.map((item) => {
      const url = getItemSilhouetteUrl(item.id)

      expect(url, `item ${item.id} mist een silhouet`).toBeDefined()

      return url
    })

    // Elke item heeft een eigen bestand, dus elke URL is uniek.
    expect(new Set(urls).size).toBe(items.length)
  })

  it('has exactly one palette per material', () => {
    expect(getKnownMaterialIds()).toEqual(materials.map((material) => material.id))

    for (const material of materials) {
      const palette = getMaterialPalette(material.id)

      expect(palette.base).toMatch(hexPattern)
      expect(palette.highlight).toMatch(hexPattern)
      expect(palette.shadow).toMatch(hexPattern)
    }
  })

  it('gives each material a distinct base colour', () => {
    const baseColours = materials.map(
      (material) => getMaterialPalette(material.id).base,
    )

    expect(new Set(baseColours).size).toBe(materials.length)
  })

  it('falls back to a neutral palette for an unknown material', () => {
    expect(getMaterialPalette(9999)).toEqual(fallbackMaterialPalette)
  })

  it('resolves items and materials by id', () => {
    expect(getItemById(items[0].id)?.name).toBe('hoefijzers')
    expect(getMaterialById(materials[0].id)?.name).toBe('Brons')
    expect(getItemById(9999)).toBeUndefined()
    expect(getMaterialById(9999)).toBeUndefined()
  })

  it('covers all 50 order combinations with a silhouette and a palette', () => {
    expect(orderDefinitions).toHaveLength(50)

    for (const definition of orderDefinitions) {
      expect(getItemSilhouetteUrl(definition.itemId)).toBeDefined()
      expect(getMaterialPalette(definition.materialId)).toBeDefined()
    }
  })
})

describe('ItemSprite', () => {
  it('renders the item silhouette with the material colour', () => {
    const wrapper = mount(ItemSprite, {
      props: {
        itemId: items[3].id,
        materialId: materials[4].id,
      },
    })
    const style = styleOf(wrapper)

    expect(style['--sprite-shape']).toBe(
      `url("${getItemSilhouetteUrl(items[3].id)}")`,
    )
    expect(style['--sprite-base']).toBe(getMaterialPalette(materials[4].id).base)
    expect(wrapper.classes()).toContain('item-sprite--medium')
  })

  it('keeps the shape when only the material changes', () => {
    const axeShapes = materials.map((material) =>
      styleOf(
        mount(ItemSprite, {
          props: {
            itemId: items[3].id,
            materialId: material.id,
          },
        }),
      )['--sprite-shape'],
    )
    const axeColours = materials.map((material) =>
      styleOf(
        mount(ItemSprite, {
          props: {
            itemId: items[3].id,
            materialId: material.id,
          },
        }),
      )['--sprite-base'],
    )

    expect(new Set(axeShapes).size).toBe(1)
    expect(new Set(axeColours).size).toBe(materials.length)
  })

  it('keeps the colour when only the item changes', () => {
    const shapeByItem = items.map((item) =>
      styleOf(
        mount(ItemSprite, {
          props: {
            itemId: item.id,
            materialId: materials[0].id,
          },
        }),
      )['--sprite-shape'],
    )

    expect(new Set(shapeByItem).size).toBe(items.length)
  })

  it('renders every one of the 50 combinations without failing', () => {
    for (const definition of orderDefinitions) {
      const wrapper = mount(ItemSprite, {
        props: {
          itemId: definition.itemId,
          materialId: definition.materialId,
        },
      })

      expect(wrapper.find('.item-sprite').exists()).toBe(true)
      expect(wrapper.attributes('aria-label')).toMatch(/^.+ .+$/)
      expect(styleOf(wrapper)['--sprite-shape']).not.toBe('none')
    }
  })

  it('labels the sprite for screen readers', () => {
    const wrapper = mount(ItemSprite, {
      props: {
        itemId: items[4].id,
        materialId: materials[1].id,
      },
    })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('IJzer schilden')
  })

  it('honours the size prop', () => {
    const small = mount(ItemSprite, {
      props: {
        itemId: items[0].id,
        materialId: materials[0].id,
        size: 'small',
      },
    })
    const large = mount(ItemSprite, {
      props: {
        itemId: items[0].id,
        materialId: materials[0].id,
        size: 'large',
      },
    })

    expect(small.classes()).toContain('item-sprite--small')
    expect(large.classes()).toContain('item-sprite--large')
  })

  it('degrades to a labelled placeholder for an unknown item', () => {
    const wrapper = mount(ItemSprite, {
      props: {
        itemId: 9999,
        materialId: materials[0].id,
      },
    })

    expect(wrapper.classes()).toContain('item-sprite--unknown')
    expect(wrapper.attributes('aria-label')).toBe('Onbekend voorwerp')
    expect(styleOf(wrapper)['--sprite-shape']).toBeUndefined()
  })

  it('updates shape and colour when the props change', async () => {
    const wrapper = mount(ItemSprite, {
      props: {
        itemId: items[0].id,
        materialId: materials[0].id,
      },
    })
    const firstStyle = styleOf(wrapper)

    await wrapper.setProps({
      itemId: items[9].id,
      materialId: materials[4].id,
    })

    const secondStyle = styleOf(wrapper)

    expect(secondStyle['--sprite-shape']).not.toBe(firstStyle['--sprite-shape'])
    expect(secondStyle['--sprite-base']).toBe(
      getMaterialPalette(materials[4].id).base,
    )
  })
})

describe('upgrade sprite catalog', () => {
  it('has exactly one silhouette per upgrade', () => {
    expect(getKnownUpgradeIds()).toEqual(upgrades.map((upgrade) => upgrade.id))

    const urls = upgrades.map((upgrade) => {
      const url = getUpgradeSilhouetteUrl(upgrade.id)

      expect(url, `upgrade ${upgrade.id} mist een silhouet`).toBeDefined()

      return url
    })

    // Elke upgrade heeft een eigen bestand, dus elke URL is uniek.
    expect(new Set(urls).size).toBe(upgrades.length)
  })

  it('has exactly one palette per upgrade', () => {
    for (const upgrade of upgrades) {
      const palette = getUpgradePalette(upgrade.id)

      expect(palette.base).toMatch(hexPattern)
      expect(palette.highlight).toMatch(hexPattern)
      expect(palette.shadow).toMatch(hexPattern)
    }
  })

  it('gives each upgrade a distinct base colour', () => {
    const baseColours = upgrades.map(
      (upgrade) => getUpgradePalette(upgrade.id).base,
    )

    expect(new Set(baseColours).size).toBe(upgrades.length)
  })

  it('falls back to a neutral palette for an unknown upgrade', () => {
    expect(getUpgradePalette(9999)).toEqual(fallbackMaterialPalette)
  })

  it('resolves upgrades by id', () => {
    expect(getUpgradeById(upgrades[0].id)?.name).toBe('Sterkere hamer')
    expect(getUpgradeById(upgrades[1].id)?.name).toBe('Geborgen hout')
    expect(getUpgradeById(upgrades[2].id)?.name).toBe('Vuur van de meester')
    expect(getUpgradeById(9999)).toBeUndefined()
  })
})

describe('UpgradeSprite', () => {
  it('renders the upgrade silhouette with the upgrade colour', () => {
    const wrapper = mount(UpgradeSprite, {
      props: {
        upgradeId: upgrades[0].id,
      },
    })
    const style = styleOf(wrapper)

    expect(style['--sprite-shape']).toBe(
      `url("${getUpgradeSilhouetteUrl(upgrades[0].id)}")`,
    )
    expect(style['--sprite-base']).toBe(getUpgradePalette(upgrades[0].id).base)
    expect(wrapper.classes()).toContain('upgrade-sprite--medium')
  })

  it('keeps the shape when only the upgrade changes', () => {
    const shapes = upgrades.map((upgrade) =>
      styleOf(
        mount(UpgradeSprite, {
          props: {
            upgradeId: upgrade.id,
          },
        }),
      )['--sprite-shape'],
    )

    expect(new Set(shapes).size).toBe(upgrades.length)
  })

  it('renders every upgrade without failing', () => {
    for (const upgrade of upgrades) {
      const wrapper = mount(UpgradeSprite, {
        props: {
          upgradeId: upgrade.id,
        },
      })

      expect(wrapper.find('.upgrade-sprite').exists()).toBe(true)
      expect(wrapper.attributes('aria-label')).toBe(upgrade.name)
      expect(styleOf(wrapper)['--sprite-shape']).not.toBe('none')
    }
  })

  it('labels the sprite for screen readers', () => {
    const wrapper = mount(UpgradeSprite, {
      props: {
        upgradeId: upgrades[1].id,
      },
    })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Geborgen hout')
  })

  it('honours the size prop', () => {
    const small = mount(UpgradeSprite, {
      props: {
        upgradeId: upgrades[0].id,
        size: 'small',
      },
    })
    const large = mount(UpgradeSprite, {
      props: {
        upgradeId: upgrades[0].id,
        size: 'large',
      },
    })

    expect(small.classes()).toContain('upgrade-sprite--small')
    expect(large.classes()).toContain('upgrade-sprite--large')
  })

  it('degrades to a labelled placeholder for an unknown upgrade', () => {
    const wrapper = mount(UpgradeSprite, {
      props: {
        upgradeId: 9999,
      },
    })

    expect(wrapper.classes()).toContain('upgrade-sprite--unknown')
    expect(wrapper.attributes('aria-label')).toBe('Onbekende upgrade')
    expect(styleOf(wrapper)['--sprite-shape']).toBeUndefined()
  })

  it('updates shape and colour when the prop changes', async () => {
    const wrapper = mount(UpgradeSprite, {
      props: {
        upgradeId: upgrades[0].id,
      },
    })
    const firstStyle = styleOf(wrapper)

    await wrapper.setProps({
      upgradeId: upgrades[2].id,
    })

    const secondStyle = styleOf(wrapper)

    expect(secondStyle['--sprite-shape']).not.toBe(firstStyle['--sprite-shape'])
    expect(secondStyle['--sprite-base']).toBe(
      getUpgradePalette(upgrades[2].id).base,
    )
  })
})