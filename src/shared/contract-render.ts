import type { AppSettings } from './types'

export interface StoreRowData {
  id?: string
  name: string
  address: string
  usingTerm: string
  months: string | number
}

export interface ContractPreviewModel {
  contractNo: string
  signedDate: string
  partyBName: string
  partyBAddress: string
  partyBTaxCode: string
  partyBPhone: string
  partyBRepresentative: string
  partyBPosition: string
  termRange: string
  stores: StoreRowData[]
  totalMonths: number
  feeRows: Array<{ label: string; unitPrice: number; storeCount: number; months: number; total: number }>
  subtotal: number
  vatPct: number
  vatAmount: number
  grandTotal: number
  grandTotalWords: string
}

const BLANK = '................'

const FEE_CONFIG = [
  { label: 'Quyền Liên Quan / Related Rights', field: 'pricing.relatedRights.month' },
  { label: 'Quyền Tác Giả / Composition Copyright', field: 'pricing.composition.month' },
  { label: 'Phí Tài Khoản / Account', field: 'pricing.account.month' },
  { label: 'Phí Ứng Dụng / Application', field: 'pricing.app.year' },
  { label: 'Phí Website / Website', field: 'pricing.web.year' },
  { label: 'Phí Thiết Bị / Device', field: 'pricing.device.year' }
]

function getString(data: Record<string, unknown>, key: string, fallback = ''): string {
  const value = data[key]
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

function getNumber(data: Record<string, unknown>, key: string): number {
  const raw = getString(data, key).replace(/[^\d.-]/g, '')
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

export function getStores(data: Record<string, unknown>): StoreRowData[] {
  if (!Array.isArray(data.stores)) return []
  return data.stores
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row) => ({
      id: typeof row.id === 'string' ? row.id : undefined,
      name: typeof row.name === 'string' ? row.name : '',
      address: typeof row.address === 'string' ? row.address : '',
      usingTerm: typeof row.usingTerm === 'string' ? row.usingTerm : '',
      months: typeof row.months === 'string' || typeof row.months === 'number' ? row.months : ''
    }))
}

export function formatDate(value: string): string {
  if (!value) return BLANK
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function formatDateLong(value: string): string {
  if (!value) return 'ngày ...... tháng ....... năm ........'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return `ngày ${String(date.getDate()).padStart(2, '0')} tháng ${String(date.getMonth() + 1).padStart(2, '0')} năm ${date.getFullYear()}`
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value) || value === 0) return BLANK
  return new Intl.NumberFormat('vi-VN').format(Math.round(value))
}

function numberToVietnamese(input: number): string {
  if (!Number.isFinite(input) || input <= 0) return BLANK
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
  const units = ['', 'nghìn', 'triệu', 'tỷ']
  const readTriple = (num: number, full: boolean): string => {
    const hundred = Math.floor(num / 100)
    const ten = Math.floor((num % 100) / 10)
    const one = num % 10
    const parts: string[] = []
    if (hundred > 0 || full) parts.push(`${digits[hundred]} trăm`)
    if (ten > 1) {
      parts.push(`${digits[ten]} mươi`)
      if (one === 1) parts.push('mốt')
      else if (one === 5) parts.push('lăm')
      else if (one > 0) parts.push(digits[one])
    } else if (ten === 1) {
      parts.push('mười')
      if (one === 5) parts.push('lăm')
      else if (one > 0) parts.push(digits[one])
    } else if (one > 0) {
      if (hundred > 0 || full) parts.push('lẻ')
      parts.push(digits[one])
    }
    return parts.join(' ')
  }

  let value = Math.round(input)
  const groups: number[] = []
  while (value > 0) {
    groups.unshift(value % 1000)
    value = Math.floor(value / 1000)
  }

  const words = groups
    .map((group, index) => {
      if (group === 0) return ''
      const unit = units[groups.length - index - 1] ?? ''
      return `${readTriple(group, index > 0)} ${unit}`.trim()
    })
    .filter(Boolean)
    .join(' ')

  return `${words.charAt(0).toUpperCase()}${words.slice(1)} đồng`
}

export function buildPreviewModel(data: Record<string, unknown>, settings?: AppSettings): ContractPreviewModel {
  const stores = getStores(data)
  const totalMonths = stores.reduce((sum, store) => sum + (Number(store.months) || 0), 0)
  const storeCount = stores.length
  const averageMonths = storeCount > 0 ? Math.max(1, Math.round(totalMonths / storeCount)) : 0
  const vatPct = Number(settings?.defaults?.vatPct ?? data.vatPct ?? 10)
  const feeRows = FEE_CONFIG.map((fee) => {
    const unitPrice = getNumber(data, fee.field)
    const months = averageMonths
    const total = unitPrice * storeCount * months
    return { label: fee.label, unitPrice, storeCount, months, total }
  })
  const subtotal = feeRows.reduce((sum, row) => sum + row.total, 0)
  const vatAmount = subtotal * vatPct / 100
  const grandTotal = subtotal + vatAmount
  const startDate = getString(data, 'term.startDate')
  const endDate = getString(data, 'term.endDate')

  return {
    contractNo: getString(data, 'meta.contractNo', BLANK) || BLANK,
    signedDate: formatDate(getString(data, 'meta.signedDate')),
    partyBName: getString(data, 'partyB.name', BLANK) || BLANK,
    partyBAddress: getString(data, 'partyB.address', BLANK) || BLANK,
    partyBTaxCode: getString(data, 'partyB.taxCode', BLANK) || BLANK,
    partyBPhone: getString(data, 'partyB.phone', BLANK) || BLANK,
    partyBRepresentative: getString(data, 'partyB.representative', BLANK) || BLANK,
    partyBPosition: getString(data, 'partyB.position', BLANK) || BLANK,
    termRange: startDate || endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : BLANK,
    stores,
    totalMonths,
    feeRows,
    subtotal,
    vatPct,
    vatAmount,
    grandTotal,
    grandTotalWords: numberToVietnamese(grandTotal)
  }
}

export function buildClickReplacements(data: Record<string, unknown>, settings?: AppSettings): string[] {
  const model = buildPreviewModel(data, settings)
  const partyA = settings?.partyA
  const stores = [...model.stores]
  while (stores.length < 2) stores.push({ name: BLANK, address: BLANK, usingTerm: BLANK, months: BLANK })
  const feeCells = model.feeRows.flatMap((row) => [
    formatMoney(row.unitPrice),
    row.storeCount ? String(row.storeCount) : BLANK,
    row.months ? String(row.months) : BLANK,
    formatMoney(row.total)
  ])

  return [
    partyA?.bankAccount || BLANK,
    partyA?.bankName || BLANK,
    partyA?.bankBranch || BLANK,
    partyA?.bankAccount || BLANK,
    partyA?.bankName || BLANK,
    partyA?.bankBranch || BLANK,
    model.partyBName,
    model.partyBAddress,
    model.partyBTaxCode,
    getString(data, 'partyB.bankAccount', BLANK) || BLANK,
    getString(data, 'partyB.bankName', BLANK) || BLANK,
    getString(data, 'partyB.bankBranch', BLANK) || BLANK,
    getString(data, 'partyB.bankAccount', BLANK) || BLANK,
    getString(data, 'partyB.bankName', BLANK) || BLANK,
    getString(data, 'partyB.bankBranch', BLANK) || BLANK,
    model.partyBPhone,
    model.partyBRepresentative,
    model.partyBPosition,
    getString(data, 'pricing.relatedRights.year', BLANK) || BLANK,
    getString(data, 'pricing.relatedRights.month', BLANK) || BLANK,
    getString(data, 'pricing.composition.year', BLANK) || BLANK,
    getString(data, 'pricing.composition.month', BLANK) || BLANK,
    getString(data, 'pricing.account.year', BLANK) || BLANK,
    getString(data, 'pricing.account.month', BLANK) || BLANK,
    getString(data, 'pricing.app.year', BLANK) || BLANK,
    getString(data, 'pricing.web.year', BLANK) || BLANK,
    getString(data, 'pricing.device.year', BLANK) || BLANK,
    partyA?.paymentBankAccount || BLANK,
    partyA?.paymentBankName || BLANK,
    partyA?.paymentBankAccount || BLANK,
    partyA?.paymentBankName || BLANK,
    getString(data, 'invoice.company', model.partyBName) || model.partyBName,
    getString(data, 'invoice.address', model.partyBAddress) || model.partyBAddress,
    getString(data, 'invoice.taxCode', model.partyBTaxCode) || model.partyBTaxCode,
    getString(data, 'contact.a.name', settings?.defaults?.defaultContactA?.name || BLANK) || BLANK,
    getString(data, 'contact.a.email', settings?.defaults?.defaultContactA?.email || BLANK) || BLANK,
    getString(data, 'contact.a.phone', settings?.defaults?.defaultContactA?.phone || BLANK) || BLANK,
    getString(data, 'contact.b.name', BLANK) || BLANK,
    getString(data, 'contact.b.email', BLANK) || BLANK,
    getString(data, 'contact.b.phone', BLANK) || BLANK,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    stores[0].name || BLANK,
    stores[0].address || BLANK,
    stores[0].usingTerm || BLANK,
    String(stores[0].months || BLANK),
    stores[1].name || BLANK,
    stores[1].address || BLANK,
    stores[1].usingTerm || BLANK,
    String(stores[1].months || BLANK),
    model.totalMonths ? String(model.totalMonths) : BLANK,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    ...feeCells,
    formatMoney(model.subtotal),
    formatMoney(model.vatAmount),
    formatMoney(model.grandTotal),
    model.grandTotalWords,
    model.grandTotalWords
  ]
}

export function buildSpecialTextReplacements(data: Record<string, unknown>) {
  const signedDate = getString(data, 'meta.signedDate')
  const startDate = getString(data, 'term.startDate')
  const endDate = getString(data, 'term.endDate')
  return {
    contractNo: getString(data, 'meta.contractNo', BLANK) || BLANK,
    signedDateLine: signedDate
      ? `Hôm nay, ${formatDateLong(signedDate)}, tại TP. Hồ Chí Minh, chúng tôi gồm có:`
      : null,
    signedDateLineEn: signedDate
      ? `Today, on ${formatDate(signedDate)}, at Ho Chi Minh City, we are hereby:`
      : null,
    termLine: startDate || endDate ? `kể từ ${formatDateLong(startDate)} đến hết ${formatDateLong(endDate)}.` : null,
    termLineEn: startDate || endDate ? `from ${formatDate(startDate)} to the end of ${formatDate(endDate)}.` : null
  }
}
