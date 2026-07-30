interface ImportMetaEnv {
  readonly MAIN_VITE_TWITCH_CLIENT_ID: string
  readonly MAIN_VITE_TWITCH_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
