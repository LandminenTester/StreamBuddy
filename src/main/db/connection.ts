import { join } from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

/** Liefert die (lazily initialisierte) Singleton-Datenbankverbindung. */
export function getDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'streamingbot.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)

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
