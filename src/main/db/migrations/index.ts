import type Database from 'better-sqlite3'
import migration001 from './001_init.sql?raw'
import migration002 from './002_channel_points.sql?raw'
import migration003 from './003_loyalty.sql?raw'
import migration004 from './004_app_settings.sql?raw'
import migration005 from './005_poll_winner_and_templates.sql?raw'
import migration006 from './006_commands_delivery_mode.sql?raw'
import migration007 from './007_loyalty_blacklist.sql?raw'
import migration008 from './008_loyalty_game_display_name.sql?raw'
import migration009 from './009_loyalty_games_rework.sql?raw'
import migration010 from './010_roulette_numbers.sql?raw'
import migration011 from './011_follower_tracking.sql?raw'
import migration012 from './012_viewer_sessions.sql?raw'
import migration013 from './013_mod_account.sql?raw'
import migration014 from './014_command_trackers.sql?raw'
import migration015 from './015_werte_type.sql?raw'
import migration016 from './016_command_tracker_actions.sql?raw'
import migration017 from './017_channel_points_loyalty_exchange.sql?raw'
import migration018 from './018_duel_matches.sql?raw'
import migration019 from './019_activity_events.sql?raw'
import { logger } from '../../logger'

/** Migrationen in Reihenfolge, Index+1 entspricht der Ziel-`user_version`. */
const MIGRATIONS: readonly string[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
  migration012,
  migration013,
  migration014,
  migration015,
  migration016,
  migration017,
  migration018,
  migration019
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
