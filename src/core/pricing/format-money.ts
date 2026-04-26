export const BLANK_VALUE = '................'

export function formatMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return BLANK_VALUE
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}
