import { getDb } from '../connection'
import type {
  ActivityEvent,
  ActivityEventInput,
  ActivityEventType,
  ActivityListRequest
} from '@shared/types/activity'

interface ActivityEventRow {
  id: number
  event_type: ActivityEventType
  twitch_event_id: string | null
  actor_login: string | null
  actor_display_name: string | null
  target_login: string | null
  summary: string
  payload: string | null
  occurred_at: number
  created_at: number
}

function toDomain(row: ActivityEventRow): ActivityEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    twitchEventId: row.twitch_event_id,
    actorLogin: row.actor_login,
    actorDisplayName: row.actor_display_name,
    targetLogin: row.target_login,
    summary: row.summary,
    payload: row.payload ? (JSON.parse(row.payload) as Record<string, unknown>) : null,
    occurredAt: row.occurred_at,
    createdAt: row.created_at
  }
}

export function createActivityEvent(input: ActivityEventInput): ActivityEvent | null {
  const now = Date.now()
  const result = getDb()
    .prepare(
      `INSERT OR IGNORE INTO activity_events
         (event_type, twitch_event_id, actor_login, actor_display_name, target_login,
          summary, payload, occurred_at, created_at)
       VALUES
         (@eventType, @twitchEventId, @actorLogin, @actorDisplayName, @targetLogin,
          @summary, @payload, @occurredAt, @createdAt)`
    )
    .run({
      eventType: input.eventType,
      twitchEventId: input.twitchEventId ?? null,
      actorLogin: input.actorLogin ?? null,
      actorDisplayName: input.actorDisplayName ?? input.actorLogin ?? null,
      targetLogin: input.targetLogin ?? null,
      summary: input.summary,
      payload: input.payload ? JSON.stringify(input.payload) : null,
      occurredAt: input.occurredAt ?? now,
      createdAt: now
    })

  if (result.changes === 0) return null

  const row = getDb()
    .prepare<[number], ActivityEventRow>('SELECT * FROM activity_events WHERE id = ?')
    .get(Number(result.lastInsertRowid))!

  return toDomain(row)
}

export function listActivityEvents(request: ActivityListRequest = {}): ActivityEvent[] {
  const limit = Math.min(Math.max(request.limit ?? 50, 1), 200)
  const filters: string[] = []
  const params: Record<string, string | number> = { limit }

  if (request.sinceMs) {
    filters.push('occurred_at >= @sinceMs')
    params.sinceMs = request.sinceMs
  }

  if (request.eventTypes?.length) {
    const placeholders = request.eventTypes.map((type, index) => {
      const key = `type${index}`
      params[key] = type
      return `@${key}`
    })
    filters.push(`event_type IN (${placeholders.join(', ')})`)
  }

  if (request.search?.trim()) {
    params.search = `%${request.search.trim().toLowerCase()}%`
    filters.push(
      `(LOWER(actor_login) LIKE @search OR LOWER(actor_display_name) LIKE @search OR LOWER(summary) LIKE @search)`
    )
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  return getDb()
    .prepare<Record<string, string | number>, ActivityEventRow>(
      `SELECT * FROM activity_events
       ${where}
       ORDER BY occurred_at DESC, id DESC
       LIMIT @limit`
    )
    .all(params)
    .map(toDomain)
}

export function clearActivityEvents(): void {
  getDb().prepare('DELETE FROM activity_events').run()
}
