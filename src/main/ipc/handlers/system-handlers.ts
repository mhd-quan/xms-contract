import type { IpcMain } from 'electron'
import { IPC } from '@shared/ipc/channels'
import {
  OsOpenFileRequest,
  OsOpenFileResponse,
  OsShowInFinderRequest,
  OsShowInFinderResponse
} from '@shared/ipc/contracts'
import type { MainContainer } from '../../container'
import { parseRequest, parseResponse } from '../validate'

export function registerSystemHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle(IPC.os.openFile, async (_event, payload) => {
    const path = parseRequest(IPC.os.openFile, OsOpenFileRequest, payload)
    await container.shellService.openPath(path)
    return parseResponse(IPC.os.openFile, OsOpenFileResponse, undefined)
  })

  ipcMain.handle(IPC.os.showInFinder, (_event, payload) => {
    const path = parseRequest(IPC.os.showInFinder, OsShowInFinderRequest, payload)
    container.shellService.showItemInFolder(path)
    return parseResponse(IPC.os.showInFinder, OsShowInFinderResponse, undefined)
  })
}
