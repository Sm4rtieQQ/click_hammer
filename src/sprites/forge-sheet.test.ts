import { describe, expect, it } from 'vitest'
import {
  FORGE_CELL_SIZE,
  FORGE_FRAME_COUNT,
  FORGE_FRAME_STEP,
  FORGE_POSES,
  forgeSheetUrl,
  isForgePose,
} from './forge-sheet'
// `?raw` leest het asset als tekst, zodat de test de echte tekening controleert
// in plaats van de URL. Het project heeft geen @types/node, dus node:fs kan niet.
import sheet from './forge/anvil-sheet.svg?raw'

const rectPattern =
  /<rect\b[^>]*\sx="(-?\d+)"[^>]*\sy="(-?\d+)"[^>]*\swidth="(\d+)"[^>]*\sheight="(\d+)"/g

interface SheetRect {
  x: number
  y: number
  width: number
  height: number
}

function readRects(): SheetRect[] {
  return [...sheet.matchAll(rectPattern)].map((match) => ({
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
  }))
}

function frameOffset(frame: number): number {
  return frame * FORGE_CELL_SIZE
}

function pixelsInFrame(frame: number): number {
  const start = frameOffset(frame)

  return readRects().filter(
    (rect) =>
      rect.x >= start &&
      rect.x + rect.width <= start + FORGE_CELL_SIZE &&
      rect.y + rect.height <= FORGE_CELL_SIZE,
  ).length
}

describe('forge sprite sheet', () => {
  it('exposes the three poses in the order the state machine walks them', () => {
    expect(FORGE_POSES).toEqual(['idle', 'pressed', 'strike'])
    expect(FORGE_FRAME_COUNT).toBe(3)
  })

  it('narrows unknown strings instead of trusting them', () => {
    for (const pose of FORGE_POSES) {
      expect(isForgePose(pose)).toBe(true)
    }

    expect(isForgePose('hammer')).toBe(false)
    expect(isForgePose('')).toBe(false)
  })

  it('points at the shipped sheet asset', () => {
    expect(forgeSheetUrl).toContain('anvil-sheet')
  })

  it('renders three square cells side by side on the 16 grid', () => {
    expect(sheet).toContain('viewBox="0 0 144 48"')

    const cell = FORGE_CELL_SIZE

    expect(cell % 16).toBe(0)
    expect(FORGE_CELL_SIZE * FORGE_FRAME_COUNT).toBe(144)
  })

  it('draws only whole-pixel rects inside the sheet', () => {
    const rects = readRects()

    expect(rects.length).toBeGreaterThan(0)

    for (const rect of rects) {
      expect(Number.isInteger(rect.x), `x ${rect.x} is geen geheel getal`).toBe(
        true,
      )
      expect(Number.isInteger(rect.y), `y ${rect.y} is geen geheel getal`).toBe(
        true,
      )
      expect(Number.isInteger(rect.width), `breedte ${rect.width}`).toBe(true)
      expect(Number.isInteger(rect.height), `hoogte ${rect.height}`).toBe(true)
      expect(rect.x, `x ${rect.x} valt buiten de sheet`).toBeGreaterThanOrEqual(
        0,
      )
      expect(rect.y, `y ${rect.y} valt buiten de sheet`).toBeGreaterThanOrEqual(
        0,
      )
      expect(rect.x + rect.width).toBeLessThanOrEqual(144)
      expect(rect.y + rect.height).toBeLessThanOrEqual(FORGE_CELL_SIZE)
      expect(rect.width, `teken niets, x ${rect.x}`).toBeGreaterThan(0)
      expect(rect.height, `teken niets, x ${rect.x}`).toBeGreaterThan(0)
    }
  })

  it('uses no stroke, curve or gradient, only rects', () => {
    expect(sheet).not.toMatch(/<stroke/)
    expect(sheet).not.toMatch(/stroke=/)
    expect(sheet).not.toMatch(/<(circle|ellipse|path|polygon|polyline|line)\b/)
    expect(sheet).not.toMatch(/<defs\b/)
    expect(sheet).not.toMatch(/(linear|radial)Gradient/)
    expect([...sheet.matchAll(/<rect\b/g)]).toHaveLength(readRects().length)
  })

  it('fills every frame, so no pose shows an empty anvil', () => {
    for (const frame of FORGE_POSES.keys()) {
      expect(pixelsInFrame(frame), `frame ${frame} is leeg`).toBeGreaterThan(0)
    }
  })

  it('keeps every frame the same size so the animation does not breathe', () => {
    const perFrame = FORGE_POSES.map((_, frame) => pixelsInFrame(frame))

    expect(new Set(perFrame).size, `frames verschillen: ${perFrame}`).toBe(1)
  })

  it('steps exactly one cell per frame so a pose never lands on a half cell', () => {
    // `background-size: 300%` maakt de tekening drie keer het element breed.
    // `background-position: p%` verschuift dan met p * (1 - 3) elementen, dus
    // p = 50% haalt precies een cel op. Eén deling door het aantal frames
    // minus één, want alleen de sprong tussen twee frames telt.
    expect(100 / (FORGE_FRAME_COUNT - 1)).toBe(FORGE_FRAME_STEP)
    expect(FORGE_FRAME_STEP * (FORGE_FRAME_COUNT - 1)).toBe(100)
  })
})