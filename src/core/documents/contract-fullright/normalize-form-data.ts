import type { StoreRowData } from './types'

export type NormalizedStoreRow = StoreRowData & { id: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeFormData(data: unknown): Record<string, string> {
  if (!isRecord(data)) return {}
  return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') acc[key] = value
    if (typeof value === 'number' || typeof value === 'boolean') acc[key] = String(value)
    return acc
  }, {})
}

export function normalizeStores(data: unknown, createId: () => string): NormalizedStoreRow[] {
  if (!isRecord(data) || !Array.isArray(data.stores)) return []
  return data.stores
    .filter(isRecord)
    .map((row) => ({
      id: typeof row.id === 'string' ? row.id : createId(),
      name: typeof row.name === 'string' ? row.name : '',
      address: typeof row.address === 'string' ? row.address : '',
      usingTerm: typeof row.usingTerm === 'string' ? row.usingTerm : '',
      months: typeof row.months === 'string' || typeof row.months === 'number' ? String(row.months) : ''
    }))
}
