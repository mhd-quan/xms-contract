import { describe, expect, it } from 'vitest'
import { BLANK_VALUE } from './format-money'
import { numberToVietnamese } from './number-to-vietnamese'

describe('numberToVietnamese', () => {
  it.each([
    [0, BLANK_VALUE],
    [1, 'Một đồng'],
    [10, 'Mười đồng'],
    [15, 'Mười lăm đồng'],
    [21, 'Hai mươi mốt đồng'],
    [105, 'Một trăm lẻ năm đồng'],
    [1000, 'Một nghìn đồng'],
    [1000000, 'Một triệu đồng'],
    [2000000000, 'Hai tỷ đồng'],
    [12540000.4, 'Mười hai triệu năm trăm bốn mươi nghìn đồng']
  ])('reads %s as %s', (input, expected) => {
    expect(numberToVietnamese(input)).toBe(expected)
  })
})
