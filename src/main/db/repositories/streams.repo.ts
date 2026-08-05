import { getDb } from '../connection'
import type { StreamSummary } from '@shared/types/viewers'

interface StreamRow {
  id: number
  stream_id: string
  channel_login: string
  started_at: number
  ended_at: number | null
  peak_viewer_count: number
  game_name: string | null
  stream_title: string | null
}

export function upsertStream(
  streamId: string,
  channelLogin: string,
  startedAt: number,
  gameName: string | null,
  streamTitle: string | null
): void {
  getDb()
    .prepare(
      `INSERT INTO streams (stream_id, channel_login, started_at, game_name, stream_title)
       VALUES (@streamId, @channelLogin, @startedAt, @gameName, @streamTitle)
       ON CONFLICT (stream_id) DO NOTHING`
    )
    .run({ streamId, channelLogin, startedAt, gameName, streamTitle })
}

export function endStream(streamId: string, endedAt: number): void {
  getDb()
    .prepare('UPDATE streams SET ended_at = ? WHERE stream_id = ?')
    .run(endedAt, streamId)
}

/** Streams, die nie sauber beendet wurden (z.B. weil die App waehrend eines laufenden Streams beendet wurde). */
export function getOpenStreams(): { streamId: string; startedAt: number }[] {
  return getDb()
    .prepare<[], { stream_id: string; started_at: number }>(
      'SELECT stream_id, started_at FROM streams WHERE ended_at IS NULL'
    )
    .all()
    .map((row) => ({ streamId: row.stream_id, startedAt: row.started_at }))
}

export function updateStreamPeakViewers(streamId: string, viewerCount: number): void {
  getDb()
    .prepare(
      'UPDATE streams SET peak_viewer_count = MAX(peak_viewer_count, ?) WHERE stream_id = ?'
    )
    .run(viewerCount, streamId)
}

export function updateStreamGame(streamId: string, gameName: string | null): void {
  getDb()
    .prepare('UPDATE streams SET game_name = ? WHERE stream_id = ?')
    .run(gameName, streamId)
}

export function getStreams(limit = 50, offset = 0): StreamSummary[] {
  return getDb()
    .prepare<[number, number], StreamRow & { unique_chatters: number }>(
      `SELECT s.*,
         (SELECT COUNT(DISTINCT user_login) FROM viewer_sessions vs WHERE vs.stream_id = s.stream_id) AS unique_chatters
       FROM streams s
       ORDER BY s.started_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset)
    .map((row) => ({
      id: row.id,
      streamId: row.stream_id,
      channelLogin: row.channel_login,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      peakViewerCount: row.peak_viewer_count,
      gameName: row.game_name,
      streamTitle: row.stream_title,
      uniqueChatters: row.unique_chatters,
      durationSeconds:
        row.ended_at !== null ? row.ended_at - row.started_at : null
    }))
}

export function upsertGameSegment(
  streamId: string,
  gameName: string,
  startedAt: number
): void {
  getDb()
    .prepare(
      `INSERT INTO stream_game_segments (stream_id, game_name, started_at)
       VALUES (@streamId, @gameName, @startedAt)`
    )
    .run({ streamId, gameName, startedAt })
}

export function endLatestGameSegment(streamId: string, endedAt: number): void {
  getDb()
    .prepare(
      `UPDATE stream_game_segments SET ended_at = ?
       WHERE stream_id = ? AND ended_at IS NULL`
    )
    .run(endedAt, streamId)
}
