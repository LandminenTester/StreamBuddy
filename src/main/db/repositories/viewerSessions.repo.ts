import { getDb } from '../connection'
import type { ViewerSession, StreamStats } from '@shared/types/viewers'

interface SessionRow {
  id: number
  stream_id: string
  user_login: string
  joined_at: number
  left_at: number | null
  stream_ended_at: number | null
  fallback_game_name: string | null
}

interface GameSegmentRow {
  game_name: string
}

export function openViewerSession(streamId: string, userLogin: string, joinedAt: number): void {
  getDb()
    .prepare(
      `INSERT INTO viewer_sessions (stream_id, user_login, joined_at)
       VALUES (@streamId, @userLogin, @joinedAt)`
    )
    .run({ streamId, userLogin, joinedAt })
}

export function closeViewerSession(streamId: string, userLogin: string, leftAt: number): void {
  getDb()
    .prepare(
      `UPDATE viewer_sessions SET left_at = @leftAt
       WHERE stream_id = @streamId AND user_login = @userLogin AND left_at IS NULL`
    )
    .run({ streamId, userLogin, leftAt })
}

export function closeAllOpenSessions(streamId: string, leftAt: number): void {
  getDb()
    .prepare('UPDATE viewer_sessions SET left_at = ? WHERE stream_id = ? AND left_at IS NULL')
    .run(leftAt, streamId)
}

export function getViewerSessionsByStream(streamId: string): ViewerSession[] {
  const db = getDb()
  return db
    .prepare<[string], SessionRow>(
      `SELECT vs.*, s.ended_at AS stream_ended_at, s.game_name AS fallback_game_name
       FROM viewer_sessions vs
       LEFT JOIN streams s ON s.stream_id = vs.stream_id
       WHERE vs.stream_id = ?
       ORDER BY vs.joined_at ASC`
    )
    .all(streamId)
    .map((row) => {
      const sessionEnd = row.left_at ?? row.stream_ended_at ?? Math.floor(Date.now() / 1000)
      const games = db
        .prepare<
          {
            streamId: string
            sessionStart: number
            sessionEnd: number
            now: number
          },
          GameSegmentRow
        >(
          `SELECT game_name
           FROM stream_game_segments
           WHERE stream_id = @streamId
             AND started_at < @sessionEnd
             AND COALESCE(ended_at, @now) > @sessionStart
           ORDER BY started_at ASC`
        )
        .all({
          streamId,
          sessionStart: row.joined_at,
          sessionEnd,
          now: Math.floor(Date.now() / 1000)
        })
        .map((segment) => segment.game_name)

      const uniqueGames = [...new Set(games)]
      if (uniqueGames.length === 0 && row.fallback_game_name)
        uniqueGames.push(row.fallback_game_name)

      return {
        id: row.id,
        streamId: row.stream_id,
        userLogin: row.user_login,
        joinedAt: row.joined_at,
        leftAt: row.left_at,
        durationSeconds: row.left_at !== null ? row.left_at - row.joined_at : null,
        games: uniqueGames
      }
    })
}

export function getStreamStats(streamId: string): StreamStats {
  const rows = getDb()
    .prepare<[string], { user_login: string; total_seconds: number }>(
      `SELECT user_login,
              COALESCE(SUM(CASE WHEN left_at IS NOT NULL THEN left_at - joined_at ELSE 0 END), 0) AS total_seconds
       FROM viewer_sessions
       WHERE stream_id = ?
       GROUP BY user_login
       ORDER BY total_seconds DESC`
    )
    .all(streamId)

  const totalViewSeconds = rows.reduce((sum, r) => sum + r.total_seconds, 0)
  const nonZero = rows.filter((r) => r.total_seconds > 0)
  const avgDurationSeconds =
    nonZero.length > 0
      ? Math.round(nonZero.reduce((s, r) => s + r.total_seconds, 0) / nonZero.length)
      : null

  return {
    uniqueChatters: rows.length,
    avgDurationSeconds,
    totalViewSeconds,
    topChatters: rows.slice(0, 10).map((r) => ({
      userLogin: r.user_login,
      durationSeconds: r.total_seconds
    }))
  }
}
