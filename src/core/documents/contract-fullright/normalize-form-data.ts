import type { StoreRowData } from './types'
import type { ContractFullrightForm } from './types'

export type NormalizedStoreRow = StoreRowData & { id: string }

const TEXT_FIELD_KEYS = [
  'meta.contractNo',
  'meta.signedDate',
  'partyB.name',
  'partyB.address',
  'partyB.taxCode',
  'partyB.phone',
  'partyB.representative',
  'partyB.position',
  'partyB.bankAccount',
  'partyB.bankName',
  'partyB.bankBranch',
  'term.startDate',
  'term.endDate',
  'pricing.relatedRights.year',
  'pricing.relatedRights.month',
  'pricing.composition.year',
  'pricing.composition.month',
  'pricing.account.year',
  'pricing.account.month',
  'pricing.app.year',
  'pricing.web.year',
  'pricing.device.year',
  'invoice.company',
  'invoice.address',
  'invoice.taxCode',
  'contact.a.name',
  'contact.a.email',
  'contact.a.phone',
  'contact.b.name',
  'contact.b.email',
  'contact.b.phone'
] as const

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

export function normalizeContractFullrightForm(input: unknown): ContractFullrightForm {
  const flat = normalizeFormData(input)
  const form = TEXT_FIELD_KEYS.reduce<Record<string, string>>((acc, key) => {
    acc[key] = flat[key] ?? ''
    return acc
  }, {})
  const rawVat = isRecord(input) ? Number(input.vatPct) : Number.NaN

  return {
    ...form,
    stores: normalizeStores(input, () => ''),
    vatPct: Number.isFinite(rawVat) ? rawVat : 10
  } as ContractFullrightForm
}
