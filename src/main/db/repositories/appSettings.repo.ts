import { getDb } from '../connection'

export type AppSettingsMap = Record<string, string | null>

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

export function listSettings(): AppSettingsMap {
  const rows = getDb()
    .prepare<[], { key: string; value: string | null }>(
      'SELECT key, value FROM app_settings ORDER BY key ASC'
    )
    .all()
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export function replaceSettings(settings: AppSettingsMap): void {
  const db = getDb()
  const replace = db.transaction(() => {
    db.prepare('DELETE FROM app_settings').run()
    const insert = db.prepare('INSERT INTO app_settings (key, value) VALUES (@key, @value)')
    for (const [key, value] of Object.entries(settings)) {
      insert.run({ key, value })
    }
  })
  replace()
}
