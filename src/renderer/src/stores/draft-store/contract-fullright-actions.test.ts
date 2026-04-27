import { describe, expect, it } from 'vitest'
import { createStoreRow, deleteStoreRow, updateStoreRows } from './contract-fullright-actions'

describe('contract-fullright draft store actions', () => {
  it('creates and updates store rows without mutating previous rows', () => {
    const first = createStoreRow(() => 'store-1')
    const rows = [first]
    const updated = updateStoreRows(rows, 'store-1', 'name', 'XMS Cafe')

    expect(first).toEqual({ id: 'store-1', name: '', address: '', usingTerm: '', months: '' })
    expect(updated).toEqual([{ ...first, name: 'XMS Cafe' }])
  })

  it('deletes store rows by id', () => {
    const rows = [
      { id: 'store-1', name: 'A', address: '', usingTerm: '', months: '' },
      { id: 'store-2', name: 'B', address: '', usingTerm: '', months: '' }
    ]

    expect(deleteStoreRow(rows, 'store-1')).toEqual([rows[1]])
  })
})
