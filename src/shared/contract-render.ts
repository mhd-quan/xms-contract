import {
  buildClickReplacements as buildCoreClickReplacements,
  buildPreviewModel as buildCorePreviewModel,
  buildSpecialTextReplacements as buildCoreSpecialTextReplacements,
  getStores as getCoreStores
} from '@core/documents/contract-fullright'
import { ContractFullrightSchema } from './schema/contract-fullright'
import type { AppSettings } from './types'

export type {
  ContractPreviewModel,
  StoreRowData
} from '@core/documents/contract-fullright'
export {
  deriveDraftTitle,
  formatDate,
  formatDateLong,
  formatMoney,
  normalizeFormData,
  normalizeStores
} from '@core/documents/contract-fullright'

function parseContractFullright(data: Record<string, unknown>) {
  return ContractFullrightSchema.parse(data)
}

export function getStores(data: Record<string, unknown>) {
  return getCoreStores(parseContractFullright(data))
}

export function buildPreviewModel(data: Record<string, unknown>, settings?: AppSettings) {
  return buildCorePreviewModel(parseContractFullright(data), settings)
}

export function buildClickReplacements(data: Record<string, unknown>, settings?: AppSettings): string[] {
  return buildCoreClickReplacements(parseContractFullright(data), settings)
}

export function buildSpecialTextReplacements(data: Record<string, unknown>) {
  return buildCoreSpecialTextReplacements(parseContractFullright(data))
}
