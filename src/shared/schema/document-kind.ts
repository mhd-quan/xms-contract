import { z } from 'zod'

export const DOCUMENT_KINDS = ['contract-fullright', 'annex-newstore'] as const

export const DocumentKindSchema = z.enum(DOCUMENT_KINDS)

export const DocumentKind = {
  ContractFullright: 'contract-fullright',
  AnnexNewstore: 'annex-newstore'
} as const satisfies Record<string, (typeof DOCUMENT_KINDS)[number]>

export type DocumentKind = z.infer<typeof DocumentKindSchema>

export function isDocumentKind(value: unknown): value is DocumentKind {
  return typeof value === 'string' && DOCUMENT_KINDS.includes(value as DocumentKind)
}

export function coerceDocumentKind(
  value: unknown,
  fallback: DocumentKind = DocumentKind.ContractFullright
): DocumentKind {
  return isDocumentKind(value) ? value : fallback
}
