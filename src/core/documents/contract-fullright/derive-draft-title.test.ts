import { describe, expect, it } from 'vitest'
import { deriveDraftTitle } from './derive-draft-title'

describe('deriveDraftTitle', () => {
  it.each([
    [{ 'meta.contractNo': 'HD-1', 'partyB.name': 'Client A' }, 'HD-1 · Client A'],
    [{ 'meta.contractNo': 'HD-1' }, 'HD-1'],
    [{ 'partyB.name': 'Client A' }, 'Client A'],
    [{}, 'Untitled']
  ])('derives title %#', (input, expected) => {
    expect(deriveDraftTitle(input)).toBe(expected)
  })
})
