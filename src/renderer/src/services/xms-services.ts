import type {
  DraftSaveRequestInput,
  RenderDocxRequestInput,
  RenderSaveAsResponseT
} from '@shared/ipc/contracts'
import type { AppSettings } from '@shared/types'

export const templateService = {
  list: () => window.xms.template.list()
}

export const draftService = {
  list: () => window.xms.draft.list(),
  load: (id: string) => window.xms.draft.load(id),
  save: (draft: DraftSaveRequestInput) => window.xms.draft.save(draft),
  delete: (id: string) => window.xms.draft.delete(id)
}

export const settingsService = {
  get: () => window.xms.settings.get(),
  save: (settings: AppSettings) => window.xms.settings.save(settings)
}

export const renderService = {
  docx: (request: RenderDocxRequestInput) => window.xms.render.docx(request),
  saveAs: (tempPath: string, suggestedName: string): Promise<RenderSaveAsResponseT> =>
    window.xms.render.saveAs(tempPath, suggestedName)
}

export const osService = {
  openFile: (path: string) => window.xms.os.openFile(path),
  showInFinder: (path: string) => window.xms.os.showInFinder(path)
}
