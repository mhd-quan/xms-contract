import type { AppSettings } from '@shared/types'
import { formatDate, formatDateLong } from '../../date'
import { BLANK_VALUE, formatMoney } from '../../pricing'
import { buildPreviewModel, readContractField } from './build-preview-model'
import type { ContractFullrightForm } from './types'

export interface SpecialTextReplacements {
  [key: string]: string | null
  contractNo: string
  signedDateLine: string | null
  signedDateLineEn: string | null
  termLine: string | null
  termLineEn: string | null
}

export function buildClickReplacements(
  data: ContractFullrightForm,
  settings?: AppSettings
): string[] {
  const model = buildPreviewModel(data, settings)
  const partyA = settings?.partyA
  const stores = [...model.stores]
  while (stores.length < 2) stores.push({ name: BLANK_VALUE, address: BLANK_VALUE, usingTerm: BLANK_VALUE, months: BLANK_VALUE })
  const feeCells = model.feeRows.flatMap((row) => [
    formatMoney(row.unitPrice),
    row.storeCount ? String(row.storeCount) : BLANK_VALUE,
    row.months ? String(row.months) : BLANK_VALUE,
    formatMoney(row.total)
  ])

  return [
    partyA?.bankAccount || BLANK_VALUE,
    partyA?.bankName || BLANK_VALUE,
    partyA?.bankBranch || BLANK_VALUE,
    partyA?.bankAccount || BLANK_VALUE,
    partyA?.bankName || BLANK_VALUE,
    partyA?.bankBranch || BLANK_VALUE,
    model.partyBName,
    model.partyBAddress,
    model.partyBTaxCode,
    readContractField(data, 'partyB.bankAccount', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'partyB.bankName', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'partyB.bankBranch', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'partyB.bankAccount', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'partyB.bankName', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'partyB.bankBranch', BLANK_VALUE) || BLANK_VALUE,
    model.partyBPhone,
    model.partyBRepresentative,
    model.partyBPosition,
    readContractField(data, 'pricing.relatedRights.year', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.relatedRights.month', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.composition.year', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.composition.month', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.account.year', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.account.month', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.app.year', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.web.year', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'pricing.device.year', BLANK_VALUE) || BLANK_VALUE,
    partyA?.paymentBankAccount || BLANK_VALUE,
    partyA?.paymentBankName || BLANK_VALUE,
    partyA?.paymentBankAccount || BLANK_VALUE,
    partyA?.paymentBankName || BLANK_VALUE,
    readContractField(data, 'invoice.company', model.partyBName) || model.partyBName,
    readContractField(data, 'invoice.address', model.partyBAddress) || model.partyBAddress,
    readContractField(data, 'invoice.taxCode', model.partyBTaxCode) || model.partyBTaxCode,
    readContractField(data, 'contact.a.name', settings?.defaults?.defaultContactA?.name || BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'contact.a.email', settings?.defaults?.defaultContactA?.email || BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'contact.a.phone', settings?.defaults?.defaultContactA?.phone || BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'contact.b.name', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'contact.b.email', BLANK_VALUE) || BLANK_VALUE,
    readContractField(data, 'contact.b.phone', BLANK_VALUE) || BLANK_VALUE,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    model.contractNo,
    model.partyBName,
    model.signedDate,
    stores[0].name || BLANK_VALUE,
    stores[0].address || BLANK_VALUE,
    stores[0].usingTerm || BLANK_VALUE,
    String(stores[0].months || BLANK_VALUE),
    stores[1].name || BLANK_VALUE,
    stores[1].address || BLANK_VALUE,
    stores[1].usingTerm || BLANK_VALUE,
    String(stores[1].months || BLANK_VALUE),
    model.totalMonths ? String(model.totalMonths) : BLANK_VALUE,
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

export function buildSpecialTextReplacements(data: ContractFullrightForm): SpecialTextReplacements {
  const signedDate = readContractField(data, 'meta.signedDate')
  const startDate = readContractField(data, 'term.startDate')
  const endDate = readContractField(data, 'term.endDate')
  return {
    contractNo: readContractField(data, 'meta.contractNo', BLANK_VALUE) || BLANK_VALUE,
    signedDateLine: signedDate ? `Hôm nay, ${formatDateLong(signedDate)}, tại TP. Hồ Chí Minh, chúng tôi gồm có:` : null,
    signedDateLineEn: signedDate ? `Today, on ${formatDate(signedDate)}, at Ho Chi Minh City, we are hereby:` : null,
    termLine: startDate || endDate ? `kể từ ${formatDateLong(startDate)} đến hết ${formatDateLong(endDate)}.` : null,
    termLineEn: startDate || endDate ? `from ${formatDate(startDate)} to the end of ${formatDate(endDate)}.` : null
  }
}
