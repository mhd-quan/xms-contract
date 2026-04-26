import { z } from 'zod'
import { AnnexNewstoreSchema } from './annex-newstore'
import { ContractFullrightSchema } from './contract-fullright'
import { DocumentKind, DocumentKindSchema } from './document-kind'

const IsoDateTimeSchema = z.string().datetime()

const BaseDraftSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().min(1).default('Untitled'),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  exportedPath: z.string().nullable().default(null)
})

export const ContractFullrightDraftSchema = BaseDraftSchema.extend({
  kind: z.literal(DocumentKind.ContractFullright),
  templateId: z.literal(DocumentKind.ContractFullright),
  data: ContractFullrightSchema
})

export const AnnexNewstoreDraftSchema = BaseDraftSchema.extend({
  kind: z.literal(DocumentKind.AnnexNewstore),
  templateId: z.literal(DocumentKind.AnnexNewstore),
  data: AnnexNewstoreSchema
})

export const DraftSchema = z.discriminatedUnion('kind', [
  ContractFullrightDraftSchema,
  AnnexNewstoreDraftSchema
])

export const DraftSummarySchema = z.object({
  id: z.string().min(1),
  kind: DocumentKindSchema,
  templateId: z.string().min(1),
  title: z.string().min(1),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  exportedPath: z.string().nullable().default(null)
})

export type ContractFullrightDraft = z.infer<typeof ContractFullrightDraftSchema>
export type AnnexNewstoreDraft = z.infer<typeof AnnexNewstoreDraftSchema>
export type Draft = z.infer<typeof DraftSchema>
export type DraftSummary = z.infer<typeof DraftSummarySchema>
