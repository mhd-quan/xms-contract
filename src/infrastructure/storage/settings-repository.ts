import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { SettingsSchema } from '@shared/schema/settings'
import type { AppSettings } from '@shared/types'
import { consoleLogger, type Logger } from '../logger'
import type { AppPaths } from './paths'

export interface SettingsRepository {
  load(): Promise<AppSettings>
  save(settings: AppSettings): Promise<void>
}

export const DEFAULT_SETTINGS: AppSettings = {
  partyA: {
    bankAccount: '',
    bankName: '',
    bankBranch: '',
    poaNo: '',
    poaDate: '',
    paymentBankAccount: '',
    paymentBankName: ''
  },
  defaults: {
    vatPct: 10,
    defaultContactA: { name: '', email: '', phone: '' }
  },
  ui: {
    lastFormPaneWidthPct: 42,
    previewSyncScroll: false
  }
}

export class JsonSettingsRepository implements SettingsRepository {
  constructor(
    private readonly paths: Pick<AppPaths, 'settingsPath'>,
    private readonly logger: Logger = consoleLogger
  ) {}

  async load(): Promise<AppSettings> {
    try {
      const raw = await readFile(this.paths.settingsPath, 'utf-8')
      return SettingsSchema.parse(JSON.parse(raw))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Falling back to default settings after load failure', error)
      }
      return DEFAULT_SETTINGS
    }
  }

  async save(settings: AppSettings): Promise<void> {
    const parsed = SettingsSchema.parse(settings)
    await mkdir(dirname(this.paths.settingsPath), { recursive: true })
    await writeFile(this.paths.settingsPath, JSON.stringify(parsed, null, 2), 'utf-8')
  }
}
