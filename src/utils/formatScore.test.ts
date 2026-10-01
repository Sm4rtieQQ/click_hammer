import { describe, expect, it } from 'vitest'
import { formatScore } from './formatScore'

describe('formatScore', () => {
  it.each([
    { score: 0, expected: '0' },
    { score: 1.21, expected: '1' },
    { score: 1.5, expected: '2' },
    { score: 999, expected: '999' },
    { score: 1_000, expected: '1k' },
    { score: 1_500, expected: '1.5k' },
    { score: 9_999, expected: '10k' },
    { score: 10_000, expected: '10k' },
    { score: 12_345, expected: '12.3k' },
    { score: 999_949, expected: '999.9k' },
    { score: 999_999, expected: '1m' },
    { score: 1_234_567, expected: '1.2m' },
    { score: 9_999_000, expected: '10m' },
  ])('formats $score as $expected', ({ score, expected }) => {
    expect(formatScore(score)).toBe(expected)
  })

  it('keeps negative signs when formatting defensive values', () => {
    expect(formatScore(-1_500)).toBe('-1.5k')
  })

  it('falls back to zero for non-finite values', () => {
    expect(formatScore(Number.NaN)).toBe('0')
    expect(formatScore(Number.POSITIVE_INFINITY)).toBe('0')
  })
})
