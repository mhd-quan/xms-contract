import { mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DocumentKind } from '@shared/schema/document-kind'
import { JsonDraftRepository } from './draft-repository'

let dir = ''

const baseDraft = {
  id: 'draft-1',
  kind: DocumentKind.ContractFullright,
  templateId: DocumentKind.ContractFullright,
  title: 'Draft 1',
  createdAt: '2026-04-26T00:00:00.000Z',
  updatedAt: '2026-04-26T00:00:00.000Z',
  exportedPath: null,
  data: {}
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'xms-drafts-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('JsonDraftRepository', () => {
  it('saves, loads, lists, and deletes drafts', async () => {
    const repo = new JsonDraftRepository({ draftsDir: dir })

    await expect(repo.save(baseDraft)).resolves.toEqual({
      id: 'draft-1',
      savedAt: expect.any(String)
    })
    await expect(repo.load('draft-1')).resolves.toMatchObject({
      id: 'draft-1',
      kind: DocumentKind.ContractFullright,
      title: 'Draft 1'
    })
    await expect(repo.list()).resolves.toHaveLength(1)

    await repo.delete('draft-1')

    await expect(repo.load('draft-1')).resolves.toBeNull()
  })

  it('falls back to templateId for legacy drafts without kind', async () => {
    await writeFile(join(dir, 'legacy.json'), JSON.stringify({ ...baseDraft, id: 'legacy', kind: undefined }), 'utf-8')

    await expect(new JsonDraftRepository({ draftsDir: dir }).load('legacy')).resolves.toMatchObject({
      id: 'legacy',
      kind: DocumentKind.ContractFullright
    })
  })

  it('rejects drafts with invalid explicit kind', async () => {
    const repo = new JsonDraftRepository({ draftsDir: dir })

    await expect(repo.save({ ...baseDraft, kind: 'bad-kind' })).rejects.toThrow()
  })
})
