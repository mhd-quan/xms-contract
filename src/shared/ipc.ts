// ─── IPC Channel Signatures ─────────────────────────────────────────────
// Shared between main and renderer for type safety.
// These match the handlers registered in src/main/index.ts

export const IPC_CHANNELS = {
  TEMPLATE_LIST: 'template:list',
  DRAFT_LIST: 'draft:list',
  DRAFT_LOAD: 'draft:load',
  DRAFT_SAVE: 'draft:save',
  DRAFT_DELETE: 'draft:delete',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  RENDER_DOCX: 'render:docx',
  RENDER_PREVIEW: 'render:preview',
  RENDER_SAVE_AS: 'render:saveAs',
  OS_OPEN_FILE: 'os:openFile',
  OS_SHOW_IN_FINDER: 'os:showInFinder'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
