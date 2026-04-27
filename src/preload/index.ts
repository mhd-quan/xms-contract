import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { xmsApi } from './api'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('xms', xmsApi)
  } catch (error) {
    console.error(error)
  }
} else {
  Object.assign(window, {
    electron: electronAPI,
    xms: xmsApi
  })
}
