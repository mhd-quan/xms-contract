// ─── Shared Types ───────────────────────────────────────────────────────

export interface TemplateManifestEntry {
  id: string
  name: string
  subtitle: string
  version: string
  templateFile: string
  skeletonFile: string
  schemaId: string
}

export interface DraftSummary {
  id: string
  templateId: string
  title: string
  createdAt: string
  updatedAt: string
  exportedPath: string | null
}

export interface Draft {
  id: string
  templateId: string
  title: string
  createdAt: string
  updatedAt: string
  exportedPath: string | null
  data: Record<string, unknown>
}

export interface AppSettings {
  partyA: {
    bankAccount: string
    bankName: string
    bankBranch: string
    poaNo: string
    poaDate: string
    paymentBankAccount: string
    paymentBankName: string
  }
  defaults: {
    vatPct: number
    defaultContactA: { name: string; email: string; phone: string }
  }
  ui: {
    lastFormPaneWidthPct: number
    previewSyncScroll: boolean
  }
}

/** View state for the app router */
export type AppView =
  | { type: 'library' }
  | { type: 'form'; draftId: string; templateId: string }
