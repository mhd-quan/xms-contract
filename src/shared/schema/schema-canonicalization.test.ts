import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AnnexNewstoreSchema } from './annex-newstore'
import { ContractFullrightSchema } from './contract-fullright'
import { DraftSchema } from './draft'
import { DocumentKind, DocumentKindSchema, coerceDocumentKind } from './document-kind'

async function readFixture<T>(name: string): Promise<T> {
  const filePath = join(process.cwd(), 'tests/fixtures', name)
  return JSON.parse(await readFile(filePath, 'utf-8')) as T
}

describe('schema canonicalization', () => {
  it('defines the canonical document kinds in one schema', () => {
    expect(DocumentKindSchema.options).toEqual([
      DocumentKind.ContractFullright,
      DocumentKind.AnnexNewstore
    ])
    expect(coerceDocumentKind('missing-kind')).toBe(DocumentKind.ContractFullright)
  })

  it('validates the contract-fullright golden fixture using real form data paths', async () => {
    const input = await readFixture<unknown>('contract-fullright.input.json')
    const expected = await readFixture<unknown>('contract-fullright.expected.json')

    expect(ContractFullrightSchema.parse(input)).toEqual(expected)
  })

  it('rejects the legacy nested pricing shape', () => {
    const result = ContractFullrightSchema.safeParse({
      pricing: {
        compositionCopyright: {
          perStoreYear: 960000,
          perStoreMonth: 80000
        }
      }
    })

    expect(result.success).toBe(false)
  })

  it('discriminates drafts by document kind', async () => {
    const data = await readFixture<unknown>('contract-fullright.input.json')
    const contractDraft = DraftSchema.parse({
      id: 'draft-1',
      kind: DocumentKind.ContractFullright,
      templateId: DocumentKind.ContractFullright,
      title: 'HD-2026-001 · XMS Test Client',
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      exportedPath: null,
      data
    })
    const annexDraft = DraftSchema.parse({
      id: 'draft-2',
      kind: DocumentKind.AnnexNewstore,
      templateId: DocumentKind.AnnexNewstore,
      title: 'Annex New Store',
      createdAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      exportedPath: null,
      data: {}
    })

    expect(contractDraft.kind).toBe(DocumentKind.ContractFullright)
    expect(annexDraft.kind).toBe(DocumentKind.AnnexNewstore)
    expect(DraftSchema.safeParse({ ...contractDraft, kind: undefined }).success).toBe(false)
  })

  it('keeps annex-newstore as a type-safe empty stub until the spec arrives', () => {
    expect(AnnexNewstoreSchema.parse({})).toEqual({})
    expect(AnnexNewstoreSchema.safeParse({ unexpected: true }).success).toBe(false)
  })
})
