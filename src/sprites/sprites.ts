import type { Item, Material, Upgrade } from '../types/game'
import { items } from '../data/items'
import { materials } from '../data/materials'
import { upgrades } from '../data/upgrades'

import harnasUrl from './items/10-harnas.svg'
import helmUrl from './items/9-helm.svg'
import zwaardUrl from './items/8-zwaard.svg'
import speerUrl from './items/7-speer.svg'
import dolkUrl from './items/6-dolk.svg'
import schildUrl from './items/5-schild.svg'
import bijlUrl from './items/4-bijl.svg'
import pijlpuntUrl from './items/3-pijlpunt.svg'
import klinknagelUrl from './items/2-klinknagel.svg'
import hoefijzerUrl from './items/1-hoefijzer.svg'

import sterkereHamerUrl from './upgrades/101-sterkere-hamer.svg'
import geborgenHoutUrl from './upgrades/102-geborgen-hout.svg'
import vuurVanDeMeesterUrl from './upgrades/103-vuur-van-de-meester.svg'
import leerlingUrl from './upgrades/104-leerling.svg'
import ontwikkelaarskrachtUrl from './upgrades/105-ontwikkelaarskracht.svg'

/**
 * Een materiaal bepaalt de kleur van een sprite. `base` is de hoofdkleur,
 * `highlight` de lichte kant en `shadow` de donkere kant; de drie vormen samen
 * het kleurverloop dat `ItemSprite.vue` over de vorm van het item legt.
 */
export interface MaterialPalette {
  readonly base: string
  readonly highlight: string
  readonly shadow: string
}

const palettesByMaterialId: ReadonlyMap<number, MaterialPalette> = new Map<
  number,
  MaterialPalette
>([
  [
    materials[0].id,
    { base: '#b87333', highlight: '#e2a663', shadow: '#6f4119' },
  ],
  [
    materials[1].id,
    { base: '#8e98a3', highlight: '#c9d2dc', shadow: '#4c545c' },
  ],
  [
    materials[2].id,
    { base: '#5f7d96', highlight: '#9dbcd6', shadow: '#33475a' },
  ],
  [
    materials[3].id,
    { base: '#c3ccd6', highlight: '#f2f6fa', shadow: '#7f8894' },
  ],
  [
    materials[4].id,
    { base: '#d3a017', highlight: '#ffdc6b', shadow: '#8a6206' },
  ],
])

/**
 * De item-silhouetten zijn wit zodat ze als mask kunnen dienen: de kleur
 * komt volledig uit het materiaalpalet en niet uit het bestand zelf.
 */
const silhouetteUrlsByItemId: ReadonlyMap<number, string> = new Map<
  number,
  string
>([
  [items[0].id, hoefijzerUrl],
  [items[1].id, klinknagelUrl],
  [items[2].id, pijlpuntUrl],
  [items[3].id, bijlUrl],
  [items[4].id, schildUrl],
  [items[5].id, dolkUrl],
  [items[6].id, speerUrl],
  [items[7].id, zwaardUrl],
  [items[8].id, helmUrl],
  [items[9].id, harnasUrl],
])

export const fallbackMaterialPalette: MaterialPalette = {
  base: '#b8ac9c',
  highlight: '#ddd3c6',
  shadow: '#6b6155',
}

export function getMaterialPalette(materialId: number): MaterialPalette {
  return (
    palettesByMaterialId.get(materialId) ?? fallbackMaterialPalette
  )
}

export function getItemSilhouetteUrl(itemId: number): string | undefined {
  return silhouetteUrlsByItemId.get(itemId)
}

export function getKnownItemIds(): readonly number[] {
  return [...silhouetteUrlsByItemId.keys()].sort((a, b) => a - b)
}

export function getKnownMaterialIds(): readonly number[] {
  return [...palettesByMaterialId.keys()].sort((a, b) => a - b)
}

export function getItemById(itemId: number): Item | undefined {
  return items.find((item) => item.id === itemId)
}

export function getMaterialById(materialId: number): Material | undefined {
  return materials.find((material) => material.id === materialId)
}

const upgradeSilhouetteUrlsByUpgradeId: ReadonlyMap<number, string> = new Map<
  number,
  string
>([
  [upgrades[0].id, sterkereHamerUrl],
  [upgrades[1].id, geborgenHoutUrl],
  [upgrades[2].id, vuurVanDeMeesterUrl],
  [upgrades[3].id, leerlingUrl],
  [upgrades[4].id, ontwikkelaarskrachtUrl],
])

/*
 * Elke upgrade heeft een eigen silhouetbestand. `ontwikkelaarskrachtUrl` is de
 * bliksem voor de dev-only upgrade; de import hierboven wordt alleen gebruikt
 * wanneer die upgrade zichtbaar is.
 */

const upgradePalettesByUpgradeId: ReadonlyMap<number, MaterialPalette> = new Map<
  number,
  MaterialPalette
>([
  [
    upgrades[0].id,
    { base: '#8e98a3', highlight: '#c9d2dc', shadow: '#4c545c' },
  ],
  [
    upgrades[1].id,
    { base: '#a07840', highlight: '#d4a060', shadow: '#5c3d1e' },
  ],
  [
    upgrades[2].id,
    { base: '#d35417', highlight: '#ff9c41', shadow: '#7a2a0a' },
  ],
  [
    upgrades[3].id,
    { base: '#2f8f5b', highlight: '#6fd39b', shadow: '#1a5236' },
  ],
  [
    upgrades[4].id,
    { base: '#7b4fa6', highlight: '#b08ad4', shadow: '#4a2d6b' },
  ],
])

export function getUpgradeSilhouetteUrl(
  upgradeId: number,
): string | undefined {
  return upgradeSilhouetteUrlsByUpgradeId.get(upgradeId)
}

export function getUpgradePalette(upgradeId: number): MaterialPalette {
  return (
    upgradePalettesByUpgradeId.get(upgradeId) ?? fallbackMaterialPalette
  )
}

export function getKnownUpgradeIds(): readonly number[] {
  return [...upgradeSilhouetteUrlsByUpgradeId.keys()].sort((a, b) => a - b)
}

export function getUpgradeById(upgradeId: number): Upgrade | undefined {
  return upgrades.find((upgrade) => upgrade.id === upgradeId)
}