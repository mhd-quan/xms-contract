import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import { buildClickReplacements, buildSpecialTextReplacements } from '@shared/contract-render'
import type { AppSettings } from '@shared/types'

// ─── Paths ──────────────────────────────────────────────────────────────
const APP_DATA = join(app.getPath('userData'))
const DRAFTS_DIR = join(APP_DATA, 'drafts')
const SETTINGS_PATH = join(APP_DATA, 'settings.json')
const TEMP_DIR = join(APP_DATA, 'temp')

function ensureDirs(): void {
  if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true })
  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true })
}

// ─── Settings Helpers ───────────────────────────────────────────────────
function loadSettings(): object {
  try {
    if (existsSync(SETTINGS_PATH)) {
      return JSON.parse(readFileSync(SETTINGS_PATH, 'utf-8'))
    }
  } catch {
    /* ignore */
  }
  return getDefaultSettings()
}

function getDefaultSettings(): object {
  return {
    partyA: {
      bankAccount: '',
      bankName: '',
      bankBranch: '',
      poaNo: '',
      poaDate: '',
      paymentBankAccount: '',
      paymentBankName: ''
    },
    defaults: {
      vatPct: 10,
      defaultContactA: { name: '', email: '', phone: '' }
    },
    ui: {
      lastFormPaneWidthPct: 42,
      previewSyncScroll: false
    }
  }
}

function saveSettings(settings: object): void {
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8')
}

function isPresent<T>(value: T | null): value is T {
  return value !== null
}

// ─── Draft Helpers ──────────────────────────────────────────────────────
function listDrafts(): object[] {
  ensureDirs()
  const files = readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.json'))
  return files.map((f) => {
    try {
      const data = JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf-8'))
      return {
        id: data.id,
        templateId: data.templateId,
        title: data.title || 'Untitled',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        exportedPath: data.exportedPath || null
      }
    } catch {
      return null
    }
  }).filter(isPresent)
}

function loadDraft(id: string): object | null {
  const fp = join(DRAFTS_DIR, `${id}.json`)
  if (!existsSync(fp)) return null
  return JSON.parse(readFileSync(fp, 'utf-8'))
}

function saveDraft(draft: { id?: string; [key: string]: unknown }): { id: string; savedAt: string } {
  ensureDirs()
  const id = draft.id || uuidv4()
  const now = new Date().toISOString()
  const payload = { ...draft, id, updatedAt: now, createdAt: draft.createdAt || now }
  writeFileSync(join(DRAFTS_DIR, `${id}.json`), JSON.stringify(payload, null, 2), 'utf-8')
  return { id, savedAt: now }
}

function deleteDraft(id: string): void {
  const fp = join(DRAFTS_DIR, `${id}.json`)
  if (existsSync(fp)) unlinkSync(fp)
}

// ─── Template Helpers ───────────────────────────────────────────────────
function getTemplatesDir(): string {
  return is.dev
    ? join(__dirname, '../../templates')
    : join(process.resourcesPath, 'templates')
}

function listTemplates(): object[] {
  const tplDir = getTemplatesDir()
  if (!existsSync(tplDir)) return []
  const dirs = readdirSync(tplDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  return dirs.map((d) => {
    const manifestPath = join(tplDir, d.name, 'manifest.json')
    if (!existsSync(manifestPath)) return null
    try {
      return JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch {
      return null
    }
  }).filter(isPresent)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function replaceNextTextNode(xml: string, text: string, replacement: string): string {
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return xml.replace(
    new RegExp(`<w:t([^>]*)>${escapedText}</w:t>`),
    (_match, attrs: string) => `<w:t${attrs}>${escapeXml(replacement)}</w:t>`
  )
}

function replaceTextNodeContaining(xml: string, needle: string, replacement: string): string {
  const pattern = new RegExp(`<w:t([^>]*)>[^<]*${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</w:t>`)
  return xml.replace(pattern, (_match, attrs: string) => `<w:t${attrs}>${escapeXml(replacement)}</w:t>`)
}

function normalizeDocxContentTypes(xml: string): string {
  return xml.replace(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
  )
}

async function renderDocx(payload: { draftId?: string; templateId: string; data: Record<string, unknown> }): Promise<{ tempPath: string }> {
  const templatePath = join(getTemplatesDir(), payload.templateId, 'contract-fullright.template.docx')
  if (!existsSync(templatePath)) {
    throw new Error(`Missing template file: ${templatePath}`)
  }

  const settings = loadSettings()
  const zip = await JSZip.loadAsync(readFileSync(templatePath))
  const documentPart = zip.file('word/document.xml')
  if (!documentPart) throw new Error('Template is missing word/document.xml')

  let documentXml = await documentPart.async('string')
  const specials = buildSpecialTextReplacements(payload.data)
  documentXml = replaceNextTextNode(documentXml, '………………', specials.contractNo)
  documentXml = documentXml
    .replace(/Điền số HD\./g, () => escapeXml(specials.contractNo))

  if (specials.signedDateLine) documentXml = replaceTextNodeContaining(documentXml, 'Hôm nay, ngày', specials.signedDateLine)
  if (specials.signedDateLineEn) documentXml = replaceTextNodeContaining(documentXml, 'Today, on', specials.signedDateLineEn)
  if (specials.termLine) documentXml = replaceTextNodeContaining(documentXml, 'kể từ ngày', specials.termLine)
  if (specials.termLineEn) documentXml = replaceTextNodeContaining(documentXml, 'from ................', specials.termLineEn)

  const replacements = buildClickReplacements(payload.data, settings as AppSettings)
  for (const replacement of replacements) {
    documentXml = replaceNextTextNode(documentXml, 'Click điền thông tin.', replacement)
  }

  zip.file('word/document.xml', documentXml)
  const contentTypes = zip.file('[Content_Types].xml')
  if (contentTypes) {
    zip.file('[Content_Types].xml', normalizeDocxContentTypes(await contentTypes.async('string')))
  }

  const out = await zip.generateAsync({ type: 'nodebuffer' })
  const tempPath = join(TEMP_DIR, `${payload.draftId || uuidv4()}.docx`)
  writeFileSync(tempPath, out)
  return { tempPath }
}

// ─── IPC Handlers ───────────────────────────────────────────────────────
function registerIpcHandlers(): void {
  ipcMain.handle('template:list', () => listTemplates())

  ipcMain.handle('draft:list', () => listDrafts())
  ipcMain.handle('draft:load', (_, id: string) => loadDraft(id))
  ipcMain.handle('draft:save', (_, draft) => saveDraft(draft))
  ipcMain.handle('draft:delete', (_, id: string) => deleteDraft(id))

  ipcMain.handle('settings:get', () => loadSettings())
  ipcMain.handle('settings:save', (_, settings) => saveSettings(settings))

  ipcMain.handle('render:docx', (_, payload) => renderDocx(payload))

  ipcMain.handle('os:openFile', async (_, path: string) => {
    await shell.openPath(path)
  })
  ipcMain.handle('os:showInFinder', (_, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle('render:saveAs', async (_, tempPath: string, suggestedName: string) => {
    const defaultDir = join(app.getPath('documents'), 'XMS Contracts')
    if (!existsSync(defaultDir)) mkdirSync(defaultDir, { recursive: true })
    const result = await dialog.showSaveDialog({
      defaultPath: join(defaultDir, suggestedName),
      filters: [{ name: 'Word Document', extensions: ['docx'] }]
    })
    if (result.canceled || !result.filePath) return { cancelled: true }
    copyFileSync(tempPath, result.filePath)
    return { finalPath: result.filePath }
  })
}

// ─── Window Creation ────────────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#1e1e22',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 18 },
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App Lifecycle ──────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.xmusicstation.xms-contract')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ensureDirs()
  registerIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
