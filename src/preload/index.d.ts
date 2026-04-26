import { ElectronAPI } from '@electron-toolkit/preload'

interface XmsApi {
  listTemplates: () => Promise<TemplateManifestEntry[]>
  listDrafts: () => Promise<DraftSummary[]>
  loadDraft: (id: string) => Promise<Draft | null>
  saveDraft: (draft: unknown) => Promise<{ id: string; savedAt: string }>
  deleteDraft: (id: string) => Promise<void>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: unknown) => Promise<void>
  renderDocx: (payload: unknown) => Promise<{ tempPath: string }>
  saveAs: (tempPath: string, suggestedName: string) => Promise<{ finalPath: string } | { cancelled: true }>
  openFile: (path: string) => Promise<void>
  showInFinder: (path: string) => Promise<void>
}

interface TemplateManifestEntry {
  id: string
  name: string
  subtitle: string
  version: string
  templateFile: string
  skeletonFile: string
  schemaId: string
}

interface DraftSummary {
  id: string
  templateId: string
  title: string
  createdAt: string
  updatedAt: string
  exportedPath: string | null
}

interface Draft {
  id: string
  templateId: string
  title: string
  createdAt: string
  updatedAt: string
  exportedPath: string | null
  data: Record<string, unknown>
}

interface Settings {
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

declare global {
  interface Window {
    electron: ElectronAPI
    api: XmsApi
  }
}
