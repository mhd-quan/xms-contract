import { ipcRenderer } from 'electron'
import type { z } from 'zod'
import { IPC } from '@shared/ipc/channels'
import type { IpcChannel } from '@shared/ipc/channels'
import {
  DraftDeleteRequest,
  DraftDeleteResponse,
  DraftListRequest,
  DraftListResponse,
  DraftLoadRequest,
  DraftLoadResponse,
  DraftSaveRequest,
  DraftSaveResponse,
  OsOpenFileRequest,
  OsOpenFileResponse,
  OsShowInFinderRequest,
  OsShowInFinderResponse,
  RenderDocxRequest,
  RenderDocxResponse,
  RenderSaveAsRequest,
  RenderSaveAsResponse,
  SettingsGetRequest,
  SettingsGetResponse,
  SettingsSaveRequest,
  SettingsSaveResponse,
  TemplateListRequest,
  TemplateListResponse,
  type DraftSaveRequestInput,
  type DraftSaveResponseT,
  type RenderDocxRequestInput,
  type RenderDocxResponseT,
  type RenderSaveAsResponseT
} from '@shared/ipc/contracts'
import type { AppSettings, Draft, DraftSummary, TemplateManifestEntry } from '@shared/types'

async function invoke<TRequest extends z.ZodTypeAny, TResponse extends z.ZodTypeAny>(
  channel: IpcChannel,
  requestSchema: TRequest,
  responseSchema: TResponse,
  payload: z.input<TRequest>
): Promise<z.output<TResponse>> {
  const request = requestSchema.parse(payload)
  const response = await ipcRenderer.invoke(channel, request)
  return responseSchema.parse(response)
}

export interface XmsApi {
  settings: {
    get(): Promise<AppSettings>
    save(settings: AppSettings): Promise<void>
  }
  draft: {
    list(): Promise<DraftSummary[]>
    load(id: string): Promise<Draft | null>
    save(draft: DraftSaveRequestInput): Promise<DraftSaveResponseT>
    delete(id: string): Promise<void>
  }
  template: {
    list(): Promise<TemplateManifestEntry[]>
  }
  render: {
    docx(req: RenderDocxRequestInput): Promise<RenderDocxResponseT>
    saveAs(tempPath: string, suggestedName: string): Promise<RenderSaveAsResponseT>
  }
  os: {
    openFile(path: string): Promise<void>
    showInFinder(path: string): Promise<void>
  }
}

export const xmsApi: XmsApi = {
  settings: {
    get: () => invoke(IPC.settings.get, SettingsGetRequest, SettingsGetResponse, undefined),
    save: (settings) => invoke(IPC.settings.save, SettingsSaveRequest, SettingsSaveResponse, settings)
  },
  draft: {
    list: () => invoke(IPC.draft.list, DraftListRequest, DraftListResponse, undefined),
    load: (id) => invoke(IPC.draft.load, DraftLoadRequest, DraftLoadResponse, id),
    save: (draft) => invoke(IPC.draft.save, DraftSaveRequest, DraftSaveResponse, draft),
    delete: (id) => invoke(IPC.draft.delete, DraftDeleteRequest, DraftDeleteResponse, id)
  },
  template: {
    list: () => invoke(IPC.template.list, TemplateListRequest, TemplateListResponse, undefined)
  },
  render: {
    docx: (req) => invoke(IPC.render.docx, RenderDocxRequest, RenderDocxResponse, req),
    saveAs: (tempPath, suggestedName) =>
      invoke(IPC.render.saveAs, RenderSaveAsRequest, RenderSaveAsResponse, { tempPath, suggestedName })
  },
  os: {
    openFile: (path) => invoke(IPC.os.openFile, OsOpenFileRequest, OsOpenFileResponse, path),
    showInFinder: (path) => invoke(IPC.os.showInFinder, OsShowInFinderRequest, OsShowInFinderResponse, path)
  }
}
