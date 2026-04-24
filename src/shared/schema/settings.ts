import { z } from 'zod'

export const SettingsSchema = z.object({
  partyA: z.object({
    bankAccount: z.string(),
    bankName: z.string(),
    bankBranch: z.string(),
    poaNo: z.string(),
    poaDate: z.string(),
    paymentBankAccount: z.string(),
    paymentBankName: z.string()
  }),
  defaults: z.object({
    vatPct: z.number().default(10),
    defaultContactA: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string()
    })
  }),
  ui: z.object({
    lastFormPaneWidthPct: z.number().default(42),
    previewSyncScroll: z.boolean().default(false)
  })
})

export type Settings = z.infer<typeof SettingsSchema>
