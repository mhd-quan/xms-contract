import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ContractFullrightSchema } from '@shared/schema/contract-fullright'
import { buildPreviewModel } from './build-preview-model'

async function readFixture<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(process.cwd(), 'tests/fixtures', name), 'utf-8')) as T
}

describe('buildPreviewModel', () => {
  it('builds the golden contract-fullright preview model', async () => {
    const form = ContractFullrightSchema.parse(await readFixture<unknown>('contract-fullright.input.json'))

    expect(buildPreviewModel(form)).toEqual({
      contractNo: 'HD-2026-001',
      signedDate: '26/04/2026',
      partyBName: 'XMS Test Client',
      partyBAddress: '123 Nguyen Hue, District 1, Ho Chi Minh City',
      partyBTaxCode: '0312345678',
      partyBPhone: '0909000000',
      partyBRepresentative: 'Nguyen Van A',
      partyBPosition: 'Director',
      termRange: '01/05/2026 - 30/04/2027',
      stores: form.stores,
      totalMonths: 12,
      feeRows: [
        { label: 'Quyền Liên Quan / Related Rights', unitPrice: 100000, storeCount: 1, months: 12, total: 1200000 },
        { label: 'Quyền Tác Giả / Composition Copyright', unitPrice: 80000, storeCount: 1, months: 12, total: 960000 },
        { label: 'Phí Tài Khoản / Account', unitPrice: 50000, storeCount: 1, months: 12, total: 600000 },
        { label: 'Phí Ứng Dụng / Application', unitPrice: 300000, storeCount: 1, months: 12, total: 3600000 },
        { label: 'Phí Website / Website', unitPrice: 240000, storeCount: 1, months: 12, total: 2880000 },
        { label: 'Phí Thiết Bị / Device', unitPrice: 180000, storeCount: 1, months: 12, total: 2160000 }
      ],
      subtotal: 11400000,
      vatPct: 10,
      vatAmount: 1140000,
      grandTotal: 12540000,
      grandTotalWords: 'Mười hai triệu năm trăm bốn mươi nghìn đồng'
    })
  })
})
