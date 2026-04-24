/// <reference types="vite/client" />
/// <reference path="../../preload/index.d.ts" />

interface ImportMetaEnv {
  readonly MAIN_VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
