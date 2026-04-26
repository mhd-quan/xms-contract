import type { app as ElectronApp, dialog, shell } from 'electron'
import {
  CachingFsTemplateLoader,
  createPaths,
  DocxExporter,
  ElectronDialogService,
  ElectronShellService,
  JsonDraftRepository,
  JsonSettingsRepository,
  type AppPaths
} from '@infra/index'

export interface MainContainer {
  paths: AppPaths
  settingsRepo: JsonSettingsRepository
  draftRepo: JsonDraftRepository
  templateLoader: CachingFsTemplateLoader
  docxExporter: DocxExporter
  shellService: ElectronShellService
  dialogService: ElectronDialogService
}

export interface BuildContainerOptions {
  app: Pick<typeof ElectronApp, 'getPath'>
  shell: Pick<typeof shell, 'openPath' | 'showItemInFolder'>
  dialog: Pick<typeof dialog, 'showSaveDialog'>
  isDev: boolean
  dirname: string
  resourcesPath: string
}

export function buildContainer(options: BuildContainerOptions): MainContainer {
  const paths = createPaths(options.app, {
    isDev: options.isDev,
    dirname: options.dirname,
    resourcesPath: options.resourcesPath
  })

  return {
    paths,
    settingsRepo: new JsonSettingsRepository(paths),
    draftRepo: new JsonDraftRepository(paths),
    templateLoader: new CachingFsTemplateLoader(paths),
    docxExporter: new DocxExporter(),
    shellService: new ElectronShellService(options.shell),
    dialogService: new ElectronDialogService(options.dialog, paths)
  }
}
