export interface SettingsBackup {
  app: 'StreamBuddy'
  version: 1
  exportedAt: string
  settings: Record<string, string | null>
  tables: Record<string, Array<Record<string, string | number | null>>>
}

export interface SettingsFileResult {
  fileName: string
}
