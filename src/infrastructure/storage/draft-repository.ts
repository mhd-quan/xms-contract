import { mkdir, readFile, readdir, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { DraftSchema, DraftSummarySchema } from '@shared/schema/draft'
import { coerceDocumentKind } from '@shared/schema/document-kind'
import type { Draft, DraftSummary } from '@shared/types'
import { consoleLogger, type Logger } from '../logger'
import type { AppPaths } from './paths'

export interface DraftSaveResult {
  id: string
  savedAt: string
}

export interface DraftRepository {
  list(): Promise<DraftSummary[]>
  load(id: string): Promise<Draft | null>
  save(draft: Record<string, unknown> & { id?: string }): Promise<DraftSaveResult>
  delete(id: string): Promise<void>
}

function normalizeDraftCandidate(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const draft = value as Record<string, unknown>
  const kind = draft.kind ?? coerceDocumentKind(draft.templateId)
  return { ...draft, kind, templateId: kind }
}

export class JsonDraftRepository implements DraftRepository {
  constructor(
    private readonly paths: Pick<AppPaths, 'draftsDir'>,
    private readonly logger: Logger = consoleLogger
  ) {}

  async list(): Promise<DraftSummary[]> {
    await mkdir(this.paths.draftsDir, { recursive: true })
    const files = await readdir(this.paths.draftsDir)
    const summaries = await Promise.all(files.filter((file) => file.endsWith('.json')).map((file) => this.loadSummary(file)))
    return summaries.filter((summary): summary is DraftSummary => summary !== null)
  }

  async load(id: string): Promise<Draft | null> {
    try {
      const raw = await readFile(join(this.paths.draftsDir, `${id}.json`), 'utf-8')
      return DraftSchema.parse(normalizeDraftCandidate(JSON.parse(raw)))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Skipping invalid draft ${id}`, error)
      }
      return null
    }
  }

  async save(draft: Record<string, unknown> & { id?: string }): Promise<DraftSaveResult> {
    await mkdir(this.paths.draftsDir, { recursive: true })
    const now = new Date().toISOString()
    const candidate = normalizeDraftCandidate({
      ...draft,
      id: draft.id || uuidv4(),
      title: draft.title || 'Untitled',
      createdAt: draft.createdAt || now,
      updatedAt: now,
      exportedPath: draft.exportedPath ?? null,
      data: draft.data ?? {}
    })
    const parsed = DraftSchema.parse(candidate)
    await writeFile(join(this.paths.draftsDir, `${parsed.id}.json`), JSON.stringify(parsed, null, 2), 'utf-8')
    return { id: parsed.id, savedAt: now }
  }

  async delete(id: string): Promise<void> {
    try {
      await unlink(join(this.paths.draftsDir, `${id}.json`))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  private async loadSummary(file: string): Promise<DraftSummary | null> {
    const id = file.replace(/\.json$/, '')
    const draft = await this.load(id)
    if (!draft) return null
    return DraftSummarySchema.parse({
      id: draft.id,
      kind: draft.kind,
      templateId: draft.templateId,
      title: draft.title,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      exportedPath: draft.exportedPath
    })
  }
}
