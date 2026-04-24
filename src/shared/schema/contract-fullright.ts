import { z } from 'zod'

export const StoreRowSchema = z.object({
  name: z.string().min(1, 'Tên cửa hàng không được trống'),
  address: z.string().min(1, 'Địa chỉ không được trống'),
  usingTerm: z.string().min(1, 'Thời hạn sử dụng không được trống'),
  months: z.number().min(0).max(120)
})

export const FeeLineSchema = z.object({
  categoryId: z.enum([
    'related_rights',
    'composition_copyright',
    'account',
    'application',
    'website',
    'device'
  ]),
  unitPrice: z.number().min(0),
  storeCount: z.number().int().min(0),
  months: z.number().min(0).max(120)
})

export const ContractFullrightSchema = z.object({
  meta: z.object({
    contractNo: z.string().min(1),
    signedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  partyB: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    taxCode: z.string().regex(/^\d{10}(-\d{3})?$|^\d{13}$/),
    phone: z.string().min(1),
    representative: z.string().min(1),
    position: z.string().min(1),
    bankAccount: z.string().min(1),
    bankName: z.string().min(1),
    bankBranch: z.string().min(1)
  }),
  term: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  pricing: z.object({
    relatedRights: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    compositionCopyright: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    account: z.object({ perStoreYear: z.number(), perStoreMonth: z.number() }),
    application: z.object({ perStoreYear: z.number() }),
    website: z.object({ perStoreYear: z.number() }),
    device: z.object({ perStoreYear: z.number() })
  }),
  invoice: z.object({
    companyName: z.string(),
    address: z.string(),
    taxCode: z.string(),
    linkedFromPartyB: z.boolean().default(true)
  }),
  contacts: z.object({
    partyA: z.object({ name: z.string(), email: z.string().email(), phone: z.string() }),
    partyB: z.object({ name: z.string(), email: z.string().email(), phone: z.string() })
  }),
  stores: z.array(StoreRowSchema).min(1, 'Phải có ít nhất 1 cửa hàng'),
  fees: z.array(FeeLineSchema).min(1),
  vatPct: z.number().min(0).max(100).default(10)
})

export type ContractFullright = z.infer<typeof ContractFullrightSchema>
export type StoreRow = z.infer<typeof StoreRowSchema>
export type FeeLine = z.infer<typeof FeeLineSchema>
