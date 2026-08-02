import { getDb } from '../db/connection'
import { listSettings, replaceSettings } from '../db/repositories/appSettings.repo'
import type { SettingsBackup } from '@shared/types/settings'

const CONFIG_TABLES = [
  'feature_scopes',
  'command_trackers',
  'commands',
  'automessages',
  'channel_point_rewards',
  'loyalty_accounts',
  'loyalty_transactions',
  'loyalty_earn_rules',
  'loyalty_games_config',
  'bot_message_sets',
  'poll_templates'
] as const

const TABLES_TO_RESET = [
  'viewer_sessions',
  'stream_game_segments',
  'streams',
  'follower_history',
  'follower_sync_log',
  'followers',
  'redemption_log',
  'channel_point_rewards',
  'loyalty_transactions',
  'loyalty_accounts',
  'loyalty_earn_rules',
  'loyalty_games_config',
  'roulette_rounds',
  'bot_message_sets',
  'poll_templates',
  'polls',
  'automessages',
  'commands',
  'command_trackers',
  'chat_message_stats',
  'viewer_count_samples',
  'follow_events',
  'feature_scopes',
  'app_settings',
  'auth_tokens',
  'mod_account_tokens'
] as const

export function createSettingsBackup(): SettingsBackup {
  const db = getDb()
  const tables = Object.fromEntries(
    CONFIG_TABLES.map((table) => [
      table,
      db.prepare(`SELECT * FROM ${table}`).all() as Array<
        Record<string, string | number | null>
      >
    ])
  )

  return {
    app: 'StreamBuddy',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: listSettings(),
    tables
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseSettingsBackup(raw: string): SettingsBackup {
  const parsed: unknown = JSON.parse(raw)
  if (!isRecord(parsed) || parsed.app !== 'StreamBuddy' || parsed.version !== 1) {
    throw new Error('Ungültige StreamBuddy-Einstellungsdatei')
  }
  if (!isRecord(parsed.settings)) {
    throw new Error('Die Einstellungsdatei enthält keine gültigen Einstellungen')
  }

  if (!isRecord(parsed.tables)) {
    throw new Error('Die Einstellungsdatei enthält keine gültigen Konfigurationstabellen')
  }

  const settings: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(parsed.settings)) {
    if (!key || (typeof value !== 'string' && value !== null)) {
      throw new Error('Die Einstellungsdatei enthält ungültige Werte')
    }
    settings[key] = value
  }

  const tables: SettingsBackup['tables'] = {}
  for (const [table, rows] of Object.entries(parsed.tables)) {
    if (!CONFIG_TABLES.includes(table as (typeof CONFIG_TABLES)[number]) || !Array.isArray(rows)) {
      throw new Error('Die Einstellungsdatei enthält unbekannte Konfigurationen')
    }
    tables[table] = rows.map((row) => {
      if (!isRecord(row)) throw new Error('Die Einstellungsdatei enthält ungültige Tabellenwerte')
      const cleanRow: Record<string, string | number | null> = {}
      for (const [column, value] of Object.entries(row)) {
        if (
          typeof value !== 'string' &&
          typeof value !== 'number' &&
          value !== null
        ) {
          throw new Error('Die Einstellungsdatei enthält ungültige Tabellenwerte')
        }
        cleanRow[column] = value
      }
      return cleanRow
    })
  }

  return {
    app: 'StreamBuddy',
    version: 1,
    exportedAt:
      typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    settings,
    tables
  }
}

export function importSettingsBackup(backup: SettingsBackup): void {
  replaceSettings(backup.settings)

  const db = getDb()
  const replace = db.transaction(() => {
    for (const table of [...CONFIG_TABLES].reverse()) {
      db.prepare(`DELETE FROM ${table}`).run()
    }
    for (const table of CONFIG_TABLES) {
      const rows = backup.tables[table] ?? []
      const allowedColumns = new Set(
        (db.pragma(`table_info(${table})`) as Array<{ name: string }>).map((column) => column.name)
      )
      for (const row of rows) {
        const columns = Object.keys(row)
        if (columns.length === 0) continue
        if (columns.some((column) => !allowedColumns.has(column))) {
          throw new Error(`Unbekannte Spalte in der Konfigurationstabelle ${table}`)
        }
        const placeholders = columns.map((column) => `@${column}`).join(', ')
        const columnList = columns.map((column) => `"${column}"`).join(', ')
        db.prepare(`INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`).run(row)
      }
    }
  })
  replace()
}

export function resetAllApplicationData(): void {
  const db = getDb()
  const reset = db.transaction(() => {
    for (const table of TABLES_TO_RESET) {
      db.prepare(`DELETE FROM ${table}`).run()
    }
    db.prepare('DELETE FROM sqlite_sequence').run()
  })
  reset()
}
