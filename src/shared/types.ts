import type { Draft as SchemaDraft, DraftSummary as SchemaDraftSummary } from './schema/draft'
import type { DocumentKind } from './schema/document-kind'
import type { Settings } from './schema/settings'

// ─── Shared Types ───────────────────────────────────────────────────────

export interface TemplateManifestEntry {
  id: string
  kind?: DocumentKind
  name: string
  subtitle: string
  version: string
  templateFile: string
  skeletonFile: string
  schemaId: string
}

export type DraftSummary = SchemaDraftSummary

export type Draft = SchemaDraft

export type AppSettings = Settings

/** View state for the app router */
export type AppView =
  | { type: 'library' }
  | { type: 'form'; draftId: string; templateId: string }
