import { getDb } from '../connection'
import type { ChatMessageStatsBucket, ViewerCountSample } from '@shared/types/stats'

interface ChatBucketRow {
  bucket_start: number
  message_count: number
  unique_chatters: number
}

interface ViewerSampleRow {
  sampled_at: number
  viewer_count: number
  stream_id: string | null
}

/** Rundet einen Unix-Timestamp (ms) auf den Beginn der vollen Stunde ab. */
export function hourBucketStart(timestampMs: number): number {
  const hourMs = 60 * 60 * 1000
  return Math.floor(timestampMs / hourMs) * hourMs
}

export function incrementMessageBucket(timestampMs: number, uniqueChatterDelta: number): void {
  const bucketStart = hourBucketStart(timestampMs)

  getDb()
    .prepare(
      `INSERT INTO chat_message_stats (bucket_start, message_count, unique_chatters)
       VALUES (@bucketStart, 1, @uniqueChatterDelta)
       ON CONFLICT (bucket_start) DO UPDATE SET
         message_count = message_count + 1,
         unique_chatters = unique_chatters + @uniqueChatterDelta`
    )
    .run({ bucketStart, uniqueChatterDelta })
}

export function getMessagesPerHour(sinceMs: number): ChatMessageStatsBucket[] {
  return getDb()
    .prepare<[number], ChatBucketRow>(
      'SELECT * FROM chat_message_stats WHERE bucket_start >= ? ORDER BY bucket_start ASC'
    )
    .all(sinceMs)
    .map((row) => ({
      bucketStart: row.bucket_start,
      messageCount: row.message_count,
      uniqueChatters: row.unique_chatters
    }))
}

export function insertViewerCountSample(sample: ViewerCountSample): void {
  getDb()
    .prepare(
      `INSERT INTO viewer_count_samples (sampled_at, viewer_count, stream_id)
       VALUES (@sampledAt, @viewerCount, @streamId)`
    )
    .run({
      sampledAt: sample.sampledAt,
      viewerCount: sample.viewerCount,
      streamId: sample.streamId
    })
}

export function getViewerCountSeries(sinceMs: number): ViewerCountSample[] {
  return getDb()
    .prepare<[number], ViewerSampleRow>(
      'SELECT * FROM viewer_count_samples WHERE sampled_at >= ? ORDER BY sampled_at ASC'
    )
    .all(sinceMs)
    .map((row) => ({
      sampledAt: row.sampled_at,
      viewerCount: row.viewer_count,
      streamId: row.stream_id
    }))
}
