import { getDb } from '../connection'
import type {
  FollowerEntry,
  FollowerHistoryEntry,
  SyncStatus
} from '@shared/types/followers'

interface FollowerRow {
  id: number
  user_id: string
  user_login: string
  display_name: string | null
  followed_at: number
  is_active: number
  synced_at: number
}

interface HistoryRow {
  id: number
  user_id: string
  user_login: string
  event_type: 'follow' | 'unfollow'
  event_at: number
  follow_duration_seconds: number | null
}

interface SyncLogRow {
  synced_at: number
  total_count: number
  new_count: number
  lost_count: number
}

function mapFollower(row: FollowerRow): FollowerEntry {
  return {
    id: row.id,
    userId: row.user_id,
    userLogin: row.user_login,
    displayName: row.display_name,
    followedAt: row.followed_at,
    isActive: row.is_active === 1,
    syncedAt: row.synced_at
  }
}

export function getAllFollowers(): FollowerEntry[] {
  return getDb()
    .prepare<[], FollowerRow>('SELECT * FROM followers ORDER BY followed_at DESC')
    .all()
    .map(mapFollower)
}

export function getActiveFollowerUserIds(): Set<string> {
  const rows = getDb()
    .prepare<[], { user_id: string }>(
      'SELECT user_id FROM followers WHERE is_active = 1'
    )
    .all()
  return new Set(rows.map((r) => r.user_id))
}

export function upsertFollower(
  userId: string,
  userLogin: string,
  displayName: string | null,
  followedAt: number,
  syncedAt: number
): void {
  getDb()
    .prepare(
      `INSERT INTO followers (user_id, user_login, display_name, followed_at, is_active, synced_at)
       VALUES (@userId, @userLogin, @displayName, @followedAt, 1, @syncedAt)
       ON CONFLICT (user_id) DO UPDATE SET
         user_login = @userLogin,
         display_name = @displayName,
         is_active = 1,
         synced_at = @syncedAt`
    )
    .run({ userId, userLogin, displayName, followedAt, syncedAt })
}

export function markFollowerInactive(userId: string): void {
  getDb()
    .prepare('UPDATE followers SET is_active = 0 WHERE user_id = ?')
    .run(userId)
}

export function addFollowerHistoryEvent(
  userId: string,
  userLogin: string,
  eventType: 'follow' | 'unfollow',
  eventAt: number,
  followDurationSeconds?: number
): void {
  getDb()
    .prepare(
      `INSERT INTO follower_history (user_id, user_login, event_type, event_at, follow_duration_seconds)
       VALUES (@userId, @userLogin, @eventType, @eventAt, @followDurationSeconds)`
    )
    .run({
      userId,
      userLogin,
      eventType,
      eventAt,
      followDurationSeconds: followDurationSeconds ?? null
    })
}

export function getFollowerHistory(
  eventType?: 'follow' | 'unfollow',
  sinceMs?: number
): FollowerHistoryEntry[] {
  let sql =
    'SELECT * FROM follower_history WHERE 1=1'
  const params: (string | number)[] = []

  if (eventType) {
    sql += ' AND event_type = ?'
    params.push(eventType)
  }
  if (sinceMs !== undefined) {
    sql += ' AND event_at >= ?'
    params.push(sinceMs)
  }
  sql += ' ORDER BY event_at DESC LIMIT 500'

  return getDb()
    .prepare<typeof params, HistoryRow>(sql)
    .all(...params)
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      userLogin: row.user_login,
      eventType: row.event_type,
      eventAt: row.event_at,
      followDurationSeconds: row.follow_duration_seconds
    }))
}

export function insertSyncLog(
  totalCount: number,
  newCount: number,
  lostCount: number
): number {
  const now = Math.floor(Date.now() / 1000)
  getDb()
    .prepare(
      `INSERT INTO follower_sync_log (synced_at, total_count, new_count, lost_count)
       VALUES (@now, @totalCount, @newCount, @lostCount)`
    )
    .run({ now, totalCount, newCount, lostCount })
  return now
}

export function getLatestSyncStatus(): SyncStatus {
  const row = getDb()
    .prepare<[], SyncLogRow>(
      'SELECT * FROM follower_sync_log ORDER BY synced_at DESC LIMIT 1'
    )
    .get()

  if (!row) {
    return { lastSyncedAt: null, totalCount: 0, newCount: 0, lostCount: 0 }
  }
  return {
    lastSyncedAt: row.synced_at,
    totalCount: row.total_count,
    newCount: row.new_count,
    lostCount: row.lost_count
  }
}
