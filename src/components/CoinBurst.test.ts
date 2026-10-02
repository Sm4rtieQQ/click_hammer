import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CoinBurst from './CoinBurst.vue'
// `?raw` leest de bron als tekst; het project heeft geen @types/node voor node:fs.
import source from './CoinBurst.vue?raw'

/*
 * jsdom past de scoped `<style>` van een component niet toe, dus de grootte van
 * een munt is niet uit de DOM te meten. We lezen hem daarom uit de bron. Dat
 * controleert in elk geval dat iemand `--coin-size` niet stiekem verkleint.
 */
const COIN_SIZE_PX = Number(source.match(/--coin-size,\s*(\d+)px/)?.[1] ?? 0)

function styleOf(element: Element): Record<string, string> {
  const style = element.getAttribute('style') ?? ''
  const declarations: Record<string, string> = {}

  for (const declaration of style.split(';')) {
    const separator = declaration.indexOf(':')

    if (separator === -1) continue

    declarations[declaration.slice(0, separator).trim()] = declaration
      .slice(separator + 1)
      .trim()
  }

  return declarations
}

function coinStyles(reward?: number): Record<string, string>[] {
  return mount(CoinBurst, reward === undefined ? {} : { props: { reward } })
    .findAll('.coin-burst__coin')
    .map((coin) => styleOf(coin.element))
}

describe('CoinBurst', () => {
  it('throws a full fan of coins', () => {
    const wrapper = mount(CoinBurst)

    expect(wrapper.findAll('.coin-burst__coin').length).toBeGreaterThanOrEqual(10)
  })

  it('throws the coins up for a moment and then rains them down', () => {
    const styles = coinStyles(5_000_000)

    for (const style of styles) {
      // Het eindpunt ligt omlaag: recht omhoog zou de munten achter de
      // vaste topbar terechtkomen, want de explosielaag begint bovenaan.
      expect(style['--coin-y']).toMatch(/^\d+px$/)
      expect(style['--coin-rotate']).toMatch(/^-?\d+deg$/)
      expect(style['--coin-delay']).toMatch(/^\d+ms$/)
    }

    const sideways = styles.map((style) =>
      Number(style['--coin-x'].replace('px', '')),
    )

    expect(sideways.some((x) => x < 0)).toBe(true)
    expect(sideways.some((x) => x > 0)).toBe(true)
    expect(new Set(sideways).size).toBe(sideways.length)
  })

  it('draws the coins four times as big as a one-pixel point', () => {
    // Eén munt is vier keer zo groot als het 8px stipje van de eerste versie.
    expect(COIN_SIZE_PX).toBe(32)
  })

  it('spreads wider for a bigger reward', () => {
    const small = Number(
      coinStyles(5_000_000)[0]['--coin-x'].replace('px', ''),
    )
    const large = Number(
      coinStyles(500_000_000)[0]['--coin-x'].replace('px', ''),
    )

    expect(Math.abs(large)).toBeGreaterThan(Math.abs(small))
  })

  it('keeps the fan on screen for an absurd reward', () => {
    // De projecten leveren 0, 5 miljoen en 500 miljoen. Zonder klemmen zou een
    // veel groter bedrag de munten het scherm uit vliegen.
    const extreme = coinStyles(10 ** 15)
    const largest = Math.max(
      ...extreme.map((style) => Math.abs(Number(style['--coin-x'].replace('px', '')))),
    )

    expect(largest).toBeLessThanOrEqual(200)
  })

  it('falls back to a modest spread for a missing or zero reward', () => {
    const missing = coinStyles()
    const zero = coinStyles(0)

    expect(missing).toHaveLength(zero.length)
    expect(missing[0]['--coin-x']).toBe(zero[0]['--coin-x'])
    expect(Math.abs(Number(missing[0]['--coin-x'].replace('px', '')))).toBeLessThan(
      20,
    )
  })

  it('never puts a negative reward into the spread', () => {
    const negative = coinStyles(-100)

    expect(negative[0]['--coin-x']).toBe(coinStyles(0)[0]['--coin-x'])
  })

  it('hides every coin from assistive technology', () => {
    const wrapper = mount(CoinBurst)

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.text()).toBe('')
  })
})
