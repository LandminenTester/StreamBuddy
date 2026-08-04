import { getDb } from '../connection'

/** Merkt einen Nutzer als in diesem Stream bereits begrüßt vor. */
export function markGreeted(streamId: string, login: string): void {
  getDb()
    .prepare(
      `INSERT INTO greeted_users (stream_id, login, greeted_at)
       VALUES (@streamId, @login, @greetedAt)
       ON CONFLICT (stream_id, login) DO NOTHING`
    )
    .run({ streamId, login, greetedAt: Math.floor(Date.now() / 1000) })
}

/** Liefert alle bereits begrüßten Logins für einen Stream. */
export function listGreetedLogins(streamId: string): string[] {
  return getDb()
    .prepare<[string], { login: string }>('SELECT login FROM greeted_users WHERE stream_id = ?')
    .all(streamId)
    .map((row) => row.login)
}

/** Entfernt alle Begrüßungs-Einträge eines beendeten Streams. */
export function deleteForStream(streamId: string): void {
  getDb().prepare('DELETE FROM greeted_users WHERE stream_id = ?').run(streamId)
}
