import type { IpcMain } from 'electron'
import type { MainContainer } from '../container'
import { registerDraftHandlers } from './handlers/draft-handlers'
import { registerRenderHandlers } from './handlers/render-handlers'
import { registerSettingsHandlers } from './handlers/settings-handlers'
import { registerSystemHandlers } from './handlers/system-handlers'
import { registerTemplateHandlers } from './handlers/template-handlers'

export function registerIpcHandlers(ipcMain: IpcMain, container: MainContainer): void {
  registerSettingsHandlers(ipcMain, container)
  registerDraftHandlers(ipcMain, container)
  registerTemplateHandlers(ipcMain, container)
  registerRenderHandlers(ipcMain, container)
  registerSystemHandlers(ipcMain, container)
}
