import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { MIGRATIONS, runMigrations } from './migrations'
import { logger } from '../logger'

let db: Database.Database | null = null

function backupDb(dbPath: string, currentVersion: number): void {
  try {
    const backupDir = join(app.getPath('userData'), 'backups')
    mkdirSync(backupDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = join(backupDir, `streamingbot_v${currentVersion}_${timestamp}.sqlite`)

    // WAL-Checkpoint vor dem Kopieren, damit das Backup vollständig ist
    db?.pragma('wal_checkpoint(PASSIVE)')
    copyFileSync(dbPath, backupPath)

    const walPath = `${dbPath}-wal`
    if (existsSync(walPath)) copyFileSync(walPath, `${backupPath}-wal`)

    logger.info(`DB-Backup vor Migration erstellt: ${backupPath}`)
  } catch (err) {
    logger.error('DB-Backup fehlgeschlagen – Migration wird trotzdem fortgesetzt', err)
  }
}

/**
 * Fügt eine Spalte nur hinzu, wenn sie noch nicht existiert -- SQLite wirft bei einem
 * doppelten ADD COLUMN einen Fehler, ADD COLUMN IF NOT EXISTS gibt es erst ab 3.35.
 */
function addColumnIfMissing(
  database: Database.Database,
  table: string,
  column: string,
  columnDef: string
): void {
  const columns = database.pragma(`table_info(${table})`) as Array<{ name: string }>
  if (columns.some((c) => c.name === column)) return
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`)
}

/**
 * Stellt sicher, dass alle Tabellen existieren, die neuere Migrationen anlegen.
 * Sicherheitsnetz für den Fall, dass eine Migration im Installer-Build nicht
 * korrekt ausgeführt wurde (z. B. durch ein Build-Tooling-Problem mit ?raw-Imports).
 */
function ensureSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS effects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      video_path TEXT,
      audio_path TEXT,
      width      INTEGER NOT NULL DEFAULT 1920,
      height     INTEGER NOT NULL DEFAULT 1080,
      created_at INTEGER NOT NULL
    )
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT    NOT NULL CHECK (event_type IN ('follow', 'sub', 'gift_sub', 'raid')),
      condition  TEXT,
      media      TEXT    NOT NULL,
      audio      TEXT    NOT NULL,
      text       TEXT    NOT NULL,
      effect_id  INTEGER REFERENCES effects (id),
      enabled    INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  addColumnIfMissing(database, 'effects', 'volume', 'volume INTEGER NOT NULL DEFAULT 100')
  addColumnIfMissing(database, 'commands', 'effect_id', 'effect_id INTEGER REFERENCES effects (id)')
}

/** Liefert die (lazily initialisierte) Singleton-Datenbankverbindung. */
export function getDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'streamingbot.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const currentVersion = db.pragma('user_version', { simple: true }) as number
  if (currentVersion < MIGRATIONS.length) {
    backupDb(dbPath, currentVersion)
  }

  runMigrations(db)
  ensureSchema(db)

  // Checkpointet regelmaessig ins Haupt-File, damit bei einem Absturz/Kill zwischen
  // zwei App-Starts moeglichst wenig ungesicherter WAL-Inhalt verloren gehen kann.
  setInterval(() => {
    db?.pragma('wal_checkpoint(PASSIVE)')
  }, 5 * 60 * 1000)

  return db
}

/**
 * Checkpointet das WAL in die Haupt-Datei und schliesst die Verbindung. Ohne diesen
 * Aufruf beim App-Quit bleiben zuletzt geschriebene Aenderungen nur im WAL --
 * bei einem unsauberen naechsten Start (Absturz, Kill) drohen sie verloren zu gehen
 * oder das WAL kann beschaedigt werden und die gesamte DB unlesbar machen.
 */
export function closeDb(): void {
  if (!db) return
  db.pragma('wal_checkpoint(TRUNCATE)')
  db.close()
  db = null
}
