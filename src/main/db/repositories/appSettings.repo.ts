import { getDb } from '../connection'

export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare<[string], { value: string | null }>('SELECT value FROM app_settings WHERE key = ?')
    .get(key)
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (@key, @value)
       ON CONFLICT (key) DO UPDATE SET value = @value`
    )
    .run({ key, value })
}
