import { describe, expect, it } from 'vitest'
import { BLANK_VALUE, formatMoney } from './format-money'

describe('formatMoney', () => {
  it.each([
    [1000, '1.000'],
    [123456789, '123.456.789'],
    [1500.6, '1.501'],
    [0, BLANK_VALUE],
    [-2500, '-2.500']
  ])('formats %s as %s', (input, expected) => {
    expect(formatMoney(input)).toBe(expected)
  })

  it('returns blank for non-finite values', () => {
    expect(formatMoney(Number.NaN)).toBe(BLANK_VALUE)
  })
})
