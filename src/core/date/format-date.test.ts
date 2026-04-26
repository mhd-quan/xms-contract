import { describe, expect, it } from 'vitest'
import { formatDate, formatDateLong } from './format-date'

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    expect(formatDate('2026-04-26')).toBe('26/04/2026')
  })

  it('formats Date instances without reparsing through strings', () => {
    expect(formatDate(new Date(2026, 3, 26))).toBe('26/04/2026')
  })

  it('returns invalid input unchanged', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDateLong', () => {
  it('formats ISO date strings as Vietnamese long dates', () => {
    expect(formatDateLong('2026-04-26')).toBe('ngày 26 tháng 04 năm 2026')
  })
})
