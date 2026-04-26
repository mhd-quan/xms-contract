import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { legacyApi, xmsApi } from './api'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('xms', xmsApi)
    contextBridge.exposeInMainWorld('api', legacyApi)
  } catch (error) {
    console.error(error)
  }
} else {
  Object.assign(window, {
    electron: electronAPI,
    xms: xmsApi,
    api: legacyApi
  })
}
