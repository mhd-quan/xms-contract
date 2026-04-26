import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import type { IpcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import type { z } from 'zod'
import { buildClickReplacements, buildSpecialTextReplacements } from '@shared/contract-render'
import { IPC } from '@shared/ipc/channels'
import {
  RenderDocxRequest,
  RenderDocxResponse,
  RenderSaveAsRequest,
  RenderSaveAsResponse
} from '@shared/ipc/contracts'
import { DocumentKind } from '@shared/schema/document-kind'
import type { MainContainer } from '../../container'
import { parseRequest, parseResponse } from '../validate'

export function registerRenderHandlers(ipcMain: IpcMain, container: MainContainer): void {
  ipcMain.handle(IPC.render.docx, async (_event, payload) => {
    const request = parseRequest(IPC.render.docx, RenderDocxRequest, payload)
    const response = await renderDocx(container, request)
    return parseResponse(IPC.render.docx, RenderDocxResponse, response)
  })

  ipcMain.handle(IPC.render.saveAs, async (_event, payload) => {
    const request = parseRequest(IPC.render.saveAs, RenderSaveAsRequest, payload)
    const response = await container.dialogService.saveFileAs(request.tempPath, request.suggestedName)
    return parseResponse(IPC.render.saveAs, RenderSaveAsResponse, response)
  })
}

type RenderDocxRequestT = z.output<typeof RenderDocxRequest>

async function renderDocx(container: MainContainer, request: RenderDocxRequestT): Promise<{ tempPath: string }> {
  if (request.kind !== DocumentKind.ContractFullright) {
    throw new Error(`DOCX rendering is not implemented for ${request.kind}`)
  }

  const settings = await container.settingsRepo.load()
  const templateBinary = await container.templateLoader.loadBinary(request.kind)
  const output = await container.docxExporter.export({
    templateBinary,
    clickReplacements: buildClickReplacements(request.data, settings),
    specialTextReplacements: buildSpecialTextReplacements(request.data)
  })

  await mkdir(container.paths.tempDir, { recursive: true })
  const tempPath = join(container.paths.tempDir, `${request.draftId || uuidv4()}.docx`)
  await writeFile(tempPath, output)
  return { tempPath }
}
