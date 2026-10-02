import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SparkBurst from './SparkBurst.vue'
// `?raw` leest de bron als tekst; het project heeft geen @types/node voor node:fs.
import source from './SparkBurst.vue?raw'

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

/** De vlucht van de hoogste vonk, in eenheden van `--effect-scale`. */
const MAX_UP = Math.max(
  ...[...source.matchAll(/y:\s*(-?\d+)/g)].map((m) => Math.abs(Number(m[1]))),
)

describe('SparkBurst', () => {
  it('renders a fan of sparks', () => {
    const wrapper = mount(SparkBurst)
    const sparks = wrapper.findAll('.spark-burst__spark')

    // Een waaier, geen kolom: er zijn vonken die naar boven én naar buiten gaan.
    expect(sparks.length).toBeGreaterThanOrEqual(6)
    expect(wrapper.find('.spark-burst').exists()).toBe(true)
  })

  it('fades out before the sparks can reach the sticky topbar', () => {
    /*
     * De kop is `position: sticky` en ondoorzichtig. Gemeten wordt hij rond de
     * 86% van de vlucht bereikt; de hoogste vonken zouden daar dus nog zichtbaar
     * kunnen zijn. Deze test legt vast dat de opacity om 80% al op nul staat, zodat
     * er op dat punt niets meer afknipt. Zou iemand de vervaaging terugzetten op
     * 100%, dan valt deze test om.
     */
    const keyframes = source.slice(source.indexOf('@keyframes spark-fly'))

    expect(keyframes).toMatch(/80%\s*\{\s*opacity:\s*0;/)

    // En de 80%-stop moet ook echt het laatste punt zijn waar opacity 1 staat.
    const opacityStops = [...keyframes.matchAll(/(\d+)%\s*\{[^}]*opacity:\s*([\d.]+)/g)]
    const lastStop = opacityStops[opacityStops.length - 1]

    expect(opacityStops.length).toBeGreaterThanOrEqual(3)
    expect(lastStop?.[1]).toBe('100')
    expect(lastStop?.[2]).toBe('0')
  })

  it('keeps the flight long enough to still read as an explosion', () => {
    /*
     * De vervaaging komt vroeg, dus de vlucht zelf mag niet korter worden: de
     * zichtbare waaier is wat het effect groot maakt. De hoogste vonk moet nog
     * steeds ruim twee keer de eigen blokgrootte uit elkaar vliegen.
     */
    expect(MAX_UP).toBeGreaterThanOrEqual(20)
  })

  it('gives every spark its own trajectory and delay', () => {
    const wrapper = mount(SparkBurst)
    const styles = wrapper
      .findAll('.spark-burst__spark')
      .map((spark) => styleOf(spark.element))

    for (const style of styles) {
      expect(style['--spark-x']).toMatch(/^-?\d+px$/)
      expect(style['--spark-y']).toMatch(/^-\d+px$/)
      expect(style['--spark-delay']).toMatch(/^\d+ms$/)
      expect(style['--spark-size']).toMatch(/^\d+px$/)
    }

    // Geen twee vonken mogen dezelfde baan vliegen, anders is de helft onzichtbaar.
    expect(new Set(styles.map((style) => style['--spark-x'])).size).toBe(
      styles.length,
    )

    const sideways = styles
      .map((style) => Number(style['--spark-x'].replace('px', '')))
      .filter((x) => x !== 0)

    expect(sideways.some((x) => x < 0)).toBe(true)
    expect(sideways.some((x) => x > 0)).toBe(true)
  })

  it('keeps the burst out of the accessibility tree', () => {
    const wrapper = mount(SparkBurst)

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('img').length).toBe(0)
    expect(wrapper.text()).toBe('')
  })
})
