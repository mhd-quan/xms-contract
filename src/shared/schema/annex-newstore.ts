import { z } from 'zod'

export const AnnexNewstoreSchema = z.object({}).strict()

export type AnnexNewstore = z.infer<typeof AnnexNewstoreSchema>
