import { describe, expect, it } from 'vitest'
import { calculateFees } from './calculate-fees'

const rates = [
  { label: 'A', unitPrice: 100 },
  { label: 'B', unitPrice: 50 }
]

describe('calculateFees', () => {
  it('handles one store with VAT 10%', () => {
    expect(calculateFees([{ months: 12 }], rates, 10)).toMatchObject({
      totalMonths: 12,
      subtotal: 1800,
      vatAmount: 180,
      grandTotal: 1980
    })
  })

  it('averages months across multiple stores', () => {
    const result = calculateFees([{ months: 6 }, { months: 12 }], rates, 10)

    expect(result.feeRows[0]).toMatchObject({ storeCount: 2, months: 9, total: 1800 })
    expect(result.totalMonths).toBe(18)
  })

  it('supports VAT 0%', () => {
    expect(calculateFees([{ months: 3 }], rates, 0).grandTotal).toBe(450)
  })

  it('rounds uneven average months', () => {
    expect(calculateFees([{ months: 1 }, { months: 2 }], rates, 10).feeRows[0].months).toBe(2)
  })

  it('uses at least one month when stores exist', () => {
    expect(calculateFees([{ months: 0 }], rates, 10).feeRows[0].months).toBe(1)
  })

  it('returns zero totals without stores', () => {
    expect(calculateFees([], rates, 10)).toMatchObject({
      totalMonths: 0,
      subtotal: 0,
      vatAmount: 0,
      grandTotal: 0
    })
  })
})
