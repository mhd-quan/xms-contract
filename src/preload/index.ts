import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ─── Typed API Surface ──────────────────────────────────────────────────
const api = {
  // Templates
  listTemplates: () => ipcRenderer.invoke('template:list'),

  // Drafts
  listDrafts: () => ipcRenderer.invoke('draft:list'),
  loadDraft: (id: string) => ipcRenderer.invoke('draft:load', id),
  saveDraft: (draft: unknown) => ipcRenderer.invoke('draft:save', draft),
  deleteDraft: (id: string) => ipcRenderer.invoke('draft:delete', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),

  // Render
  saveAs: (tempPath: string, suggestedName: string) =>
    ipcRenderer.invoke('render:saveAs', tempPath, suggestedName),

  // OS
  openFile: (path: string) => ipcRenderer.invoke('os:openFile', path),
  showInFinder: (path: string) => ipcRenderer.invoke('os:showInFinder', path)
}

// ─── Expose to Renderer ─────────────────────────────────────────────────
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
