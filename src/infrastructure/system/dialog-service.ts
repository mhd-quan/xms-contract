import { copyFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { dialog } from 'electron'
import type { AppPaths } from '../storage/paths'

export interface SaveAsResult {
  finalPath: string
}

export interface SaveAsCancelled {
  cancelled: true
}

export interface DialogService {
  saveFileAs(tempPath: string, suggestedName: string): Promise<SaveAsResult | SaveAsCancelled>
}

export class ElectronDialogService implements DialogService {
  constructor(
    private readonly electronDialog: Pick<typeof dialog, 'showSaveDialog'>,
    private readonly paths: Pick<AppPaths, 'documentsDir'>
  ) {}

  async saveFileAs(tempPath: string, suggestedName: string): Promise<SaveAsResult | SaveAsCancelled> {
    const defaultDir = join(this.paths.documentsDir, 'XMS Contracts')
    await mkdir(defaultDir, { recursive: true })
    const result = await this.electronDialog.showSaveDialog({
      defaultPath: join(defaultDir, suggestedName),
      filters: [{ name: 'Word Document', extensions: ['docx'] }]
    })
    if (result.canceled || !result.filePath) return { cancelled: true }
    await copyFile(tempPath, result.filePath)
    return { finalPath: result.filePath }
  }
}
