/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USER: string
  readonly VITE_ADMIN_PASS: string
  readonly VITE_LEOMAR_USER: string
  readonly VITE_LEOMAR_PASS: string
  readonly VITE_PEDRO_USER: string
  readonly VITE_PEDRO_PASS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
