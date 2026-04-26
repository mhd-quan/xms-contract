import { z } from 'zod'

const IsoDateSchema = z.string().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
  message: 'Ngày phải có định dạng YYYY-MM-DD'
})

const TextFieldSchema = z.string().default('')
const DateFieldSchema = IsoDateSchema.default('')
const NumericTextFieldSchema = z.union([z.string(), z.number()]).transform(String).default('')

export const StoreRowSchema = z.object({
  id: z.string().optional(),
  name: TextFieldSchema,
  address: TextFieldSchema,
  usingTerm: TextFieldSchema,
  months: NumericTextFieldSchema
})

export const ContractFullrightSchema = z.object({
  'meta.contractNo': TextFieldSchema,
  'meta.signedDate': DateFieldSchema,
  'partyB.name': TextFieldSchema,
  'partyB.address': TextFieldSchema,
  'partyB.taxCode': TextFieldSchema,
  'partyB.phone': TextFieldSchema,
  'partyB.representative': TextFieldSchema,
  'partyB.position': TextFieldSchema,
  'partyB.bankAccount': TextFieldSchema,
  'partyB.bankName': TextFieldSchema,
  'partyB.bankBranch': TextFieldSchema,
  'term.startDate': DateFieldSchema,
  'term.endDate': DateFieldSchema,
  'pricing.relatedRights.year': NumericTextFieldSchema,
  'pricing.relatedRights.month': NumericTextFieldSchema,
  'pricing.composition.year': NumericTextFieldSchema,
  'pricing.composition.month': NumericTextFieldSchema,
  'pricing.account.year': NumericTextFieldSchema,
  'pricing.account.month': NumericTextFieldSchema,
  'pricing.app.year': NumericTextFieldSchema,
  'pricing.web.year': NumericTextFieldSchema,
  'pricing.device.year': NumericTextFieldSchema,
  'invoice.company': TextFieldSchema,
  'invoice.address': TextFieldSchema,
  'invoice.taxCode': TextFieldSchema,
  'contact.a.name': TextFieldSchema,
  'contact.a.email': TextFieldSchema,
  'contact.a.phone': TextFieldSchema,
  'contact.b.name': TextFieldSchema,
  'contact.b.email': TextFieldSchema,
  'contact.b.phone': TextFieldSchema,
  stores: z.array(StoreRowSchema).default([]),
  vatPct: z.number().min(0).max(100).default(10)
}).strict()

export type ContractFullright = z.infer<typeof ContractFullrightSchema>
export type StoreRow = z.infer<typeof StoreRowSchema>
