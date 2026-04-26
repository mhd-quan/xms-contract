import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ContractFullrightSchema } from '@shared/schema/contract-fullright'
import type { AppSettings } from '@shared/types'
import { buildClickReplacements, buildSpecialTextReplacements } from './build-replacements'

async function readFixture<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(process.cwd(), 'tests/fixtures', name), 'utf-8')) as T
}

const settings: AppSettings = {
  partyA: {
    bankAccount: 'A-001',
    bankName: 'Bank A',
    bankBranch: 'Branch A',
    poaNo: '',
    poaDate: '',
    paymentBankAccount: 'PAY-001',
    paymentBankName: 'Payment Bank'
  },
  defaults: {
    vatPct: 10,
    defaultContactA: { name: 'Default A', email: 'a@xms.vn', phone: '0909000001' }
  },
  ui: {
    lastFormPaneWidthPct: 42,
    previewSyncScroll: false
  }
}

describe('buildClickReplacements', () => {
  it('keeps the contract-fullright replacement order compatible with the template', async () => {
    const form = ContractFullrightSchema.parse(await readFixture<unknown>('contract-fullright.input.json'))
    const replacements = buildClickReplacements(form, settings)

    expect(replacements).toHaveLength(90)
    expect(replacements.slice(0, 6)).toEqual(['A-001', 'Bank A', 'Branch A', 'A-001', 'Bank A', 'Branch A'])
    expect(replacements.slice(18, 27)).toEqual([
      '1200000',
      '100000',
      '960000',
      '80000',
      '600000',
      '50000',
      '300000',
      '240000',
      '180000'
    ])
    expect(replacements.slice(-5)).toEqual([
      '11.400.000',
      '1.140.000',
      '12.540.000',
      'Mười hai triệu năm trăm bốn mươi nghìn đồng',
      'Mười hai triệu năm trăm bốn mươi nghìn đồng'
    ])
  })
})

describe('buildSpecialTextReplacements', () => {
  it('builds date and term replacement text', async () => {
    const form = ContractFullrightSchema.parse(await readFixture<unknown>('contract-fullright.input.json'))

    expect(buildSpecialTextReplacements(form)).toEqual({
      contractNo: 'HD-2026-001',
      signedDateLine: 'Hôm nay, ngày 26 tháng 04 năm 2026, tại TP. Hồ Chí Minh, chúng tôi gồm có:',
      signedDateLineEn: 'Today, on 26/04/2026, at Ho Chi Minh City, we are hereby:',
      termLine: 'kể từ ngày 01 tháng 05 năm 2026 đến hết ngày 30 tháng 04 năm 2027.',
      termLineEn: 'from 01/05/2026 to the end of 30/04/2027.'
    })
  })
})
