import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { z } from 'zod'
import { DocumentKindSchema, type DocumentKind } from '@shared/schema/document-kind'
import type { TemplateManifestEntry } from '@shared/types'
import { consoleLogger, type Logger } from '../logger'
import type { AppPaths } from '../storage/paths'

const TemplateManifestSchema = z.object({
  id: DocumentKindSchema,
  kind: DocumentKindSchema.optional(),
  name: z.string(),
  subtitle: z.string(),
  version: z.string(),
  templateFile: z.string(),
  skeletonFile: z.string(),
  schemaId: z.string()
})

export interface TemplateLoader {
  listManifest(): Promise<TemplateManifestEntry[]>
  loadBinary(kind: DocumentKind): Promise<Uint8Array>
  invalidate(kind?: DocumentKind): void
}

export class CachingFsTemplateLoader implements TemplateLoader {
  private readonly cache = new Map<DocumentKind, Uint8Array>()

  constructor(
    private readonly paths: Pick<AppPaths, 'templatesDir'>,
    private readonly logger: Logger = consoleLogger
  ) {}

  async listManifest(): Promise<TemplateManifestEntry[]> {
    let entries: string[]
    try {
      const dirents = await readdir(this.paths.templatesDir, { withFileTypes: true })
      entries = dirents.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Unable to read templates directory', error)
      }
      return []
    }

    const manifests = await Promise.all(entries.map((entry) => this.readManifest(entry)))
    return manifests.filter((manifest): manifest is TemplateManifestEntry => manifest !== null)
  }

  async loadBinary(kind: DocumentKind): Promise<Uint8Array> {
    const cached = this.cache.get(kind)
    if (cached) return cached

    const manifest = await this.readManifest(kind)
    const templateFile = manifest?.templateFile ?? `${kind}.template.docx`
    const binary = await readFile(join(this.paths.templatesDir, kind, templateFile))
    this.cache.set(kind, binary)
    return binary
  }

  invalidate(kind?: DocumentKind): void {
    if (kind) this.cache.delete(kind)
    else this.cache.clear()
  }

  private async readManifest(entry: string): Promise<TemplateManifestEntry | null> {
    try {
      const raw = await readFile(join(this.paths.templatesDir, entry, 'manifest.json'), 'utf-8')
      const manifest = TemplateManifestSchema.parse(JSON.parse(raw))
      return { ...manifest, kind: manifest.kind ?? manifest.id }
    } catch (error) {
      this.logger.warn(`Skipping template manifest ${entry}`, error)
      return null
    }
  }
}
