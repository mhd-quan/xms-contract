import { join } from 'path'

export interface AppPathProvider {
  getPath(name: 'userData' | 'documents'): string
}

export interface RuntimePathOptions {
  isDev: boolean
  dirname: string
  resourcesPath: string
}

export interface AppPaths {
  appData: string
  draftsDir: string
  settingsPath: string
  tempDir: string
  templatesDir: string
  documentsDir: string
}

export function createPaths(app: AppPathProvider, runtime: RuntimePathOptions): AppPaths {
  const appData = app.getPath('userData')
  return {
    appData,
    draftsDir: join(appData, 'drafts'),
    settingsPath: join(appData, 'settings.json'),
    tempDir: join(appData, 'temp'),
    templatesDir: runtime.isDev ? join(runtime.dirname, '../../templates') : join(runtime.resourcesPath, 'templates'),
    documentsDir: app.getPath('documents')
  }
}
