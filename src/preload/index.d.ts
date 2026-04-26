import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppSettings, Draft, DraftSummary, TemplateManifestEntry } from '@shared/types'

interface XmsApi {
  listTemplates: () => Promise<TemplateManifestEntry[]>
  listDrafts: () => Promise<DraftSummary[]>
  loadDraft: (id: string) => Promise<Draft | null>
  saveDraft: (draft: unknown) => Promise<{ id: string; savedAt: string }>
  deleteDraft: (id: string) => Promise<void>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: unknown) => Promise<void>
  renderDocx: (payload: unknown) => Promise<{ tempPath: string }>
  saveAs: (tempPath: string, suggestedName: string) => Promise<{ finalPath: string } | { cancelled: true }>
  openFile: (path: string) => Promise<void>
  showInFinder: (path: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: XmsApi
  }
}
