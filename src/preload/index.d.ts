import { ElectronAPI } from '@electron-toolkit/preload'
import type { XmsApi } from './api'

declare global {
  interface Window {
    electron: ElectronAPI
    xms: XmsApi
  }
}
