import type Database from 'better-sqlite3'
import migration001 from './001_init.sql?raw'
import migration002 from './002_channel_points.sql?raw'
import migration003 from './003_loyalty.sql?raw'
import migration004 from './004_app_settings.sql?raw'
import migration005 from './005_poll_winner_and_templates.sql?raw'
import { logger } from '../../logger'

/** Migrationen in Reihenfolge, Index+1 entspricht der Ziel-`user_version`. */
const MIGRATIONS: readonly string[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005
]

/**
 * Führt alle noch ausstehenden Migrationen sequenziell aus, basierend auf
 * SQLite's nativem `PRAGMA user_version` (kein eigenes schema_version-Table nötig).
 */
export function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number

  for (let version = currentVersion; version < MIGRATIONS.length; version++) {
    const sql = MIGRATIONS[version]
    logger.info(`Führe DB-Migration auf Version ${version + 1} aus`)

    db.transaction(() => {
      db.exec(sql)
      db.pragma(`user_version = ${version + 1}`)
    })()
  }
}
