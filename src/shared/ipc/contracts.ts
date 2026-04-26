import { z } from 'zod'
import { AnnexNewstoreSchema } from '../schema/annex-newstore'
import { ContractFullrightSchema } from '../schema/contract-fullright'
import { DraftSchema, DraftSummarySchema } from '../schema/draft'
import { DocumentKind } from '../schema/document-kind'
import { SettingsSchema } from '../schema/settings'

const EmptyRequestSchema = z.void()
const OkResponseSchema = z.void()
const PathRequestSchema = z.string().min(1)

const SaveAsRequestSchema = z.object({
  tempPath: z.string().min(1),
  suggestedName: z.string().min(1)
})

export const TemplateListRequest = EmptyRequestSchema
export const TemplateListResponse = z.array(z.object({
  id: z.string().min(1),
  kind: z.enum([DocumentKind.ContractFullright, DocumentKind.AnnexNewstore]),
  name: z.string(),
  subtitle: z.string(),
  version: z.string(),
  templateFile: z.string(),
  skeletonFile: z.string(),
  schemaId: z.string()
}))

export const DraftListRequest = EmptyRequestSchema
export const DraftListResponse = z.array(DraftSummarySchema)
export const DraftLoadRequest = z.string().min(1)
export const DraftLoadResponse = DraftSchema.nullable()

const DraftBaseRequest = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1).optional(),
  title: z.string().min(1).default('Untitled'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  exportedPath: z.string().nullable().default(null)
})

export const DraftSaveRequest = z.discriminatedUnion('kind', [
  DraftBaseRequest.extend({
    kind: z.literal(DocumentKind.ContractFullright),
    templateId: z.literal(DocumentKind.ContractFullright).optional(),
    data: ContractFullrightSchema.default({})
  }),
  DraftBaseRequest.extend({
    kind: z.literal(DocumentKind.AnnexNewstore),
    templateId: z.literal(DocumentKind.AnnexNewstore).optional(),
    data: AnnexNewstoreSchema.default({})
  })
])
export const DraftSaveResponse = z.object({
  id: z.string().min(1),
  savedAt: z.string().datetime()
})
export const DraftDeleteRequest = z.string().min(1)
export const DraftDeleteResponse = OkResponseSchema

export const SettingsGetRequest = EmptyRequestSchema
export const SettingsGetResponse = SettingsSchema
export const SettingsSaveRequest = SettingsSchema
export const SettingsSaveResponse = OkResponseSchema

export const RenderDocxRequest = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(DocumentKind.ContractFullright),
    draftId: z.string().min(1).optional(),
    templateId: z.literal(DocumentKind.ContractFullright).optional(),
    data: ContractFullrightSchema
  }),
  z.object({
    kind: z.literal(DocumentKind.AnnexNewstore),
    draftId: z.string().min(1).optional(),
    templateId: z.literal(DocumentKind.AnnexNewstore).optional(),
    data: AnnexNewstoreSchema
  })
])
export const RenderDocxResponse = z.object({ tempPath: z.string().min(1) })
export const RenderSaveAsRequest = SaveAsRequestSchema
export const RenderSaveAsResponse = z.union([
  z.object({ finalPath: z.string().min(1) }),
  z.object({ cancelled: z.literal(true) })
])

export const OsOpenFileRequest = PathRequestSchema
export const OsOpenFileResponse = OkResponseSchema
export const OsShowInFinderRequest = PathRequestSchema
export const OsShowInFinderResponse = OkResponseSchema

export type DraftSaveRequestInput = z.input<typeof DraftSaveRequest>
export type DraftSaveResponseT = z.infer<typeof DraftSaveResponse>
export type RenderDocxRequestInput = z.input<typeof RenderDocxRequest>
export type RenderDocxResponseT = z.infer<typeof RenderDocxResponse>
export type RenderSaveAsResponseT = z.infer<typeof RenderSaveAsResponse>
