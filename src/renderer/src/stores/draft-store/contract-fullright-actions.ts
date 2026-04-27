import type { NormalizedStoreRow, StoreRowData } from '@core/documents/contract-fullright'

export function createStoreRow(createId: () => string): NormalizedStoreRow {
  return { id: createId(), name: '', address: '', usingTerm: '', months: '' }
}

export function updateStoreRows(
  rows: NormalizedStoreRow[],
  id: string,
  key: keyof Omit<StoreRowData, 'id'>,
  value: string
): NormalizedStoreRow[] {
  return rows.map((row) => (row.id === id ? { ...row, [key]: value } : row))
}

export function deleteStoreRow(rows: NormalizedStoreRow[], id: string): NormalizedStoreRow[] {
  return rows.filter((row) => row.id !== id)
}
