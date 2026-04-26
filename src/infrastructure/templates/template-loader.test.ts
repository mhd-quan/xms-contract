import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DocumentKind } from '@shared/schema/document-kind'
import { CachingFsTemplateLoader } from './template-loader'

let dir = ''
let templateDir = ''

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'xms-templates-'))
  templateDir = join(dir, DocumentKind.ContractFullright)
  await mkdir(templateDir, { recursive: true })
  await writeFile(join(templateDir, 'manifest.json'), JSON.stringify({
    id: DocumentKind.ContractFullright,
    name: 'Contract Fullright',
    subtitle: 'Background Music Service Agreement',
    version: '1.0.0',
    templateFile: 'contract-fullright.template.docx',
    skeletonFile: 'skeleton.html',
    schemaId: 'contractFullright'
  }), 'utf-8')
  await writeFile(join(templateDir, 'contract-fullright.template.docx'), 'first', 'utf-8')
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('CachingFsTemplateLoader', () => {
  it('lists manifests with canonical kind', async () => {
    const manifests = await new CachingFsTemplateLoader({ templatesDir: dir }).listManifest()

    expect(manifests).toEqual([
      expect.objectContaining({ id: DocumentKind.ContractFullright, kind: DocumentKind.ContractFullright })
    ])
  })

  it('caches template binaries and invalidates by kind', async () => {
    const loader = new CachingFsTemplateLoader({ templatesDir: dir })
    const first = await loader.loadBinary(DocumentKind.ContractFullright)
    await writeFile(join(templateDir, 'contract-fullright.template.docx'), 'second', 'utf-8')

    expect(Buffer.from(await loader.loadBinary(DocumentKind.ContractFullright)).toString('utf-8')).toBe(Buffer.from(first).toString('utf-8'))
    loader.invalidate(DocumentKind.ContractFullright)
    expect(Buffer.from(await loader.loadBinary(DocumentKind.ContractFullright)).toString('utf-8')).toBe('second')
  })
})
