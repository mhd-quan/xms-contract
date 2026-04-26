import type { AppSettings } from '@shared/types'
import { formatDate } from '../../date'
import { BLANK_VALUE, calculateFees, numberToVietnamese } from '../../pricing'
import type { ContractFullrightForm, ContractPreviewModel, StoreRowData } from './types'

const FEE_CONFIG = [
  { label: 'Quyền Liên Quan / Related Rights', field: 'pricing.relatedRights.month' },
  { label: 'Quyền Tác Giả / Composition Copyright', field: 'pricing.composition.month' },
  { label: 'Phí Tài Khoản / Account', field: 'pricing.account.month' },
  { label: 'Phí Ứng Dụng / Application', field: 'pricing.app.year' },
  { label: 'Phí Website / Website', field: 'pricing.web.year' },
  { label: 'Phí Thiết Bị / Device', field: 'pricing.device.year' }
] as const

function getString(data: Readonly<Record<string, unknown>>, key: string, fallback = ''): string {
  const value = data[key]
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function getNumber(data: Readonly<Record<string, unknown>>, key: string): number {
  const raw = getString(data, key).replace(/[^\d.-]/g, '')
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

export function getStores(data: ContractFullrightForm): StoreRowData[] {
  return data.stores.map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    usingTerm: row.usingTerm,
    months: row.months
  }))
}

export function buildPreviewModel(
  data: ContractFullrightForm,
  settings?: AppSettings
): ContractPreviewModel {
  const stores = getStores(data)
  const vatPct = Number(settings?.defaults?.vatPct ?? data.vatPct ?? 10)
  const fees = calculateFees(
    stores,
    FEE_CONFIG.map((fee) => ({ label: fee.label, unitPrice: getNumber(data, fee.field) })),
    vatPct
  )
  const startDate = getString(data, 'term.startDate')
  const endDate = getString(data, 'term.endDate')

  return {
    contractNo: getString(data, 'meta.contractNo', BLANK_VALUE) || BLANK_VALUE,
    signedDate: formatDate(getString(data, 'meta.signedDate')),
    partyBName: getString(data, 'partyB.name', BLANK_VALUE) || BLANK_VALUE,
    partyBAddress: getString(data, 'partyB.address', BLANK_VALUE) || BLANK_VALUE,
    partyBTaxCode: getString(data, 'partyB.taxCode', BLANK_VALUE) || BLANK_VALUE,
    partyBPhone: getString(data, 'partyB.phone', BLANK_VALUE) || BLANK_VALUE,
    partyBRepresentative: getString(data, 'partyB.representative', BLANK_VALUE) || BLANK_VALUE,
    partyBPosition: getString(data, 'partyB.position', BLANK_VALUE) || BLANK_VALUE,
    termRange: startDate || endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : BLANK_VALUE,
    stores,
    totalMonths: fees.totalMonths,
    feeRows: fees.feeRows,
    subtotal: fees.subtotal,
    vatPct,
    vatAmount: fees.vatAmount,
    grandTotal: fees.grandTotal,
    grandTotalWords: numberToVietnamese(fees.grandTotal)
  }
}

export function readContractField(
  data: ContractFullrightForm,
  key: string,
  fallback = ''
): string {
  return getString(data, key, fallback)
}
