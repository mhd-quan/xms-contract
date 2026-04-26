export interface FeeRate {
  readonly label: string
  readonly unitPrice: number
}

export interface FeeRow {
  label: string
  unitPrice: number
  storeCount: number
  months: number
  total: number
}

export interface CalculateFeesResult {
  totalMonths: number
  feeRows: FeeRow[]
  subtotal: number
  vatAmount: number
  grandTotal: number
}

export interface StoreUsage {
  readonly months: string | number
}

export function calculateFees(
  stores: readonly StoreUsage[],
  rates: readonly FeeRate[],
  vatPct: number
): CalculateFeesResult {
  const totalMonths = stores.reduce((sum, store) => sum + (Number(store.months) || 0), 0)
  const storeCount = stores.length
  const months = storeCount > 0 ? Math.max(1, Math.round(totalMonths / storeCount)) : 0
  const feeRows = rates.map((rate) => {
    const total = rate.unitPrice * storeCount * months
    return { label: rate.label, unitPrice: rate.unitPrice, storeCount, months, total }
  })
  const subtotal = feeRows.reduce((sum, row) => sum + row.total, 0)
  const vatAmount = subtotal * vatPct / 100

  return {
    totalMonths,
    feeRows,
    subtotal,
    vatAmount,
    grandTotal: subtotal + vatAmount
  }
}
