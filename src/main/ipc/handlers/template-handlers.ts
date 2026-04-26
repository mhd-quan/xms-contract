import type { IpcMain } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { TemplateListResponse } from '@shared/ipc/contracts'
import type { MainContainer } from '../../container'
import { parseResponse } from '../validate'

export function registerTemplateHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle(IPC.template.list, async () => {
    const templates = await container.templateLoader.listManifest()
    return parseResponse(IPC.template.list, TemplateListResponse, templates)
  })
}
