import { createApp, h } from 'vue'
import { items } from '../src/data/items'
import { materials } from '../src/data/materials'
import {
  getItemSilhouetteUrl,
  getMaterialPalette,
} from '../src/sprites/sprites'

const SIZES = [16, 32, 64]

function renderRow(materialId: number, size: number) {
  const palette = getMaterialPalette(materialId)

  return h(
    'div',
    { class: 'row' },
    items.map((item) => {
      const url = getItemSilhouetteUrl(item.id)

      return h('div', { class: 'cell' }, [
        h('span', {
          style: {
            width: `${size}px`,
            '--shape': `url("${url}")`,
            '--b': palette.base,
            '--h': palette.highlight,
            '--s': palette.shadow,
          },
        }),
      ])
    }),
  )
}

createApp({
  render() {
    return h(
      'div',
      {},
      SIZES.flatMap((size) => [
        h('h2', `Grid 16x16 op ${size}px (${size / 16}x)`),
        ...materials.map((material) => renderRow(material.id, size)),
      ]),
    )
  },
}).mount('#root')