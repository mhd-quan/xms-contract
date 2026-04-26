import type { ContractFullright } from '@shared/schema/contract-fullright'
import type { FeeRow } from '../../pricing'

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
  feeRows: FeeRow[]
  subtotal: number
  vatPct: number
  vatAmount: number
  grandTotal: number
  grandTotalWords: string
}

export type ContractFullrightForm = Readonly<ContractFullright>
