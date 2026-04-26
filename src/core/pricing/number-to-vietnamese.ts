import { BLANK_VALUE } from './format-money'

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const UNITS = ['', 'nghìn', 'triệu', 'tỷ']

function readTriple(num: number, full: boolean): string {
  const hundred = Math.floor(num / 100)
  const ten = Math.floor((num % 100) / 10)
  const one = num % 10
  const parts: string[] = []

  if (hundred > 0 || full) parts.push(`${DIGITS[hundred]} trăm`)
  if (ten > 1) {
    parts.push(`${DIGITS[ten]} mươi`)
    if (one === 1) parts.push('mốt')
    else if (one === 5) parts.push('lăm')
    else if (one > 0) parts.push(DIGITS[one])
  } else if (ten === 1) {
    parts.push('mười')
    if (one === 5) parts.push('lăm')
    else if (one > 0) parts.push(DIGITS[one])
  } else if (one > 0) {
    if (hundred > 0 || full) parts.push('lẻ')
    parts.push(DIGITS[one])
  }

  return parts.join(' ')
}

export function numberToVietnamese(input: number): string {
  if (!Number.isFinite(input) || input <= 0) return BLANK_VALUE

  let value = Math.round(input)
  const groups: number[] = []
  while (value > 0) {
    groups.unshift(value % 1000)
    value = Math.floor(value / 1000)
  }

  const words = groups
    .map((group, index) => {
      if (group === 0) return ''
      const unit = UNITS[groups.length - index - 1] ?? ''
      return `${readTriple(group, index > 0)} ${unit}`.trim()
    })
    .filter(Boolean)
    .join(' ')

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng`
}
