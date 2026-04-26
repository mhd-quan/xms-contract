import { isValid, parseISO } from 'date-fns'
import { BLANK_VALUE } from '../pricing'

type DateInput = Date | string

function resolveDate(value: DateInput): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export function formatDate(value: DateInput): string {
  if (!value) return BLANK_VALUE
  const date = resolveDate(value)
  if (!date) return value instanceof Date ? String(value) : value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function formatDateLong(value: DateInput): string {
  if (!value) return 'ngày ...... tháng ....... năm ........'
  const date = resolveDate(value)
  if (!date) return value instanceof Date ? String(value) : value
  return `ngày ${String(date.getDate()).padStart(2, '0')} tháng ${String(date.getMonth() + 1).padStart(2, '0')} năm ${date.getFullYear()}`
}
