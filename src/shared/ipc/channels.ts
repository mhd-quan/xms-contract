export const IPC = {
  settings: {
    get: 'settings:get',
    save: 'settings:save'
  },
  draft: {
    list: 'draft:list',
    load: 'draft:load',
    save: 'draft:save',
    delete: 'draft:delete'
  },
  template: {
    list: 'template:list'
  },
  render: {
    docx: 'render:docx',
    saveAs: 'render:saveAs'
  },
  os: {
    openFile: 'os:openFile',
    showInFinder: 'os:showInFinder'
  }
} as const

type ValueOf<T> = T extends Record<string, infer V> ? V : never
type ChannelGroup = ValueOf<typeof IPC>
export type IpcChannel = ValueOf<ChannelGroup>
