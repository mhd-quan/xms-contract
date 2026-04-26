import type { IpcMain } from 'electron'
import { IPC } from '@shared/ipc/channels'
import {
  DraftDeleteRequest,
  DraftDeleteResponse,
  DraftListResponse,
  DraftLoadRequest,
  DraftLoadResponse,
  DraftSaveRequest,
  DraftSaveResponse
} from '@shared/ipc/contracts'
import type { MainContainer } from '../../container'
import { parseRequest, parseResponse } from '../validate'

export function registerDraftHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle(IPC.draft.list, async () => {
    const drafts = await container.draftRepo.list()
    return parseResponse(IPC.draft.list, DraftListResponse, drafts)
  })

  ipcMain.handle(IPC.draft.load, async (_event, payload) => {
    const id = parseRequest(IPC.draft.load, DraftLoadRequest, payload)
    const draft = await container.draftRepo.load(id)
    return parseResponse(IPC.draft.load, DraftLoadResponse, draft)
  })

  ipcMain.handle(IPC.draft.save, async (_event, payload) => {
    const draft = parseRequest(IPC.draft.save, DraftSaveRequest, payload)
    const result = await container.draftRepo.save(draft)
    return parseResponse(IPC.draft.save, DraftSaveResponse, result)
  })

  ipcMain.handle(IPC.draft.delete, async (_event, payload) => {
    const id = parseRequest(IPC.draft.delete, DraftDeleteRequest, payload)
    await container.draftRepo.delete(id)
    return parseResponse(IPC.draft.delete, DraftDeleteResponse, undefined)
  })
}
