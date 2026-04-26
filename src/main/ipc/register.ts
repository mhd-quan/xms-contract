import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { IpcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { buildClickReplacements, buildSpecialTextReplacements } from '@shared/contract-render'
import { coerceDocumentKind } from '@shared/schema/document-kind'
import type { MainContainer } from '../container'

interface RenderDocxPayload {
  draftId?: string
  kind?: unknown
  templateId: string
  data: Record<string, unknown>
}

export function registerIpcHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle('template:list', () => container.templateLoader.listManifest())

  ipcMain.handle('draft:list', () => container.draftRepo.list())
  ipcMain.handle('draft:load', (_, id: string) => container.draftRepo.load(id))
  ipcMain.handle('draft:save', (_, draft) => container.draftRepo.save(draft))
  ipcMain.handle('draft:delete', (_, id: string) => container.draftRepo.delete(id))

  ipcMain.handle('settings:get', () => container.settingsRepo.load())
  ipcMain.handle('settings:save', (_, settings) => container.settingsRepo.save(settings))

  ipcMain.handle('render:docx', (_, payload: RenderDocxPayload) => renderDocx(container, payload))
  ipcMain.handle('render:saveAs', (_, tempPath: string, suggestedName: string) =>
    container.dialogService.saveFileAs(tempPath, suggestedName)
  )

  ipcMain.handle('os:openFile', (_, path: string) => container.shellService.openPath(path))
  ipcMain.handle('os:showInFinder', (_, path: string) => container.shellService.showItemInFolder(path))
}

async function renderDocx(container: MainContainer, payload: RenderDocxPayload): Promise<{ tempPath: string }> {
  const kind = coerceDocumentKind(payload.kind, coerceDocumentKind(payload.templateId))
  const settings = await container.settingsRepo.load()
  const templateBinary = await container.templateLoader.loadBinary(kind)
  const output = await container.docxExporter.export({
    templateBinary,
    clickReplacements: buildClickReplacements(payload.data, settings),
    specialTextReplacements: buildSpecialTextReplacements(payload.data)
  })

  await mkdir(container.paths.tempDir, { recursive: true })
  const tempPath = join(container.paths.tempDir, `${payload.draftId || uuidv4()}.docx`)
  await writeFile(tempPath, output)
  return { tempPath }
}
