import type { IpcMain } from 'electron'
import { IPC } from '@shared/ipc/channels'
import { SettingsGetResponse, SettingsSaveRequest, SettingsSaveResponse } from '@shared/ipc/contracts'
import type { MainContainer } from '../../container'
import { parseRequest, parseResponse } from '../validate'

export function registerSettingsHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle(IPC.settings.get, async () => {
    const settings = await container.settingsRepo.load()
    return parseResponse(IPC.settings.get, SettingsGetResponse, settings)
  })

  ipcMain.handle(IPC.settings.save, async (_event, payload) => {
    const settings = parseRequest(IPC.settings.save, SettingsSaveRequest, payload)
    await container.settingsRepo.save(settings)
    return parseResponse(IPC.settings.save, SettingsSaveResponse, undefined)
  })
}
