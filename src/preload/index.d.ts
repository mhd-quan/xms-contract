import { ElectronAPI } from '@electron-toolkit/preload'
import type { LegacyApi, XmsApi } from './api'

declare global {
  interface Window {
    electron: ElectronAPI
    xms: XmsApi
    api: LegacyApi
  }
}
