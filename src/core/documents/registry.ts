import { DocumentKind, DOCUMENT_KINDS, type DocumentKind as DocumentKindType } from '@shared/schema/document-kind'
import { annexNewstoreLogic } from './annex-newstore'
import { contractFullrightLogic } from './contract-fullright'

type RegisteredDocumentLogic = typeof contractFullrightLogic | typeof annexNewstoreLogic

export const DOCUMENT_REGISTRY = {
  [DocumentKind.ContractFullright]: contractFullrightLogic,
  [DocumentKind.AnnexNewstore]: annexNewstoreLogic
} as const satisfies Record<DocumentKindType, RegisteredDocumentLogic>

export function getDocumentLogic<TKind extends DocumentKindType>(
  kind: TKind
): (typeof DOCUMENT_REGISTRY)[TKind] {
  return DOCUMENT_REGISTRY[kind]
}

export function getDocumentKinds(): readonly DocumentKindType[] {
  return DOCUMENT_KINDS
}
