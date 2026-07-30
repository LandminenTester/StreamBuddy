import { hourBucketStart, incrementMessageBucket } from '../../db/repositories/stats.repo'

let currentBucketStart: number | null = null
let chattersInBucket = new Set<string>()

/** Zählt eine Chat-Nachricht in den aktuellen Stunden-Bucket (siehe chat_message_stats). */
export function recordChatMessageForStats(username: string): void {
  const now = Date.now()
  const bucketStart = hourBucketStart(now)

  if (bucketStart !== currentBucketStart) {
    currentBucketStart = bucketStart
    chattersInBucket = new Set()
  }

  const isNewChatter = !chattersInBucket.has(username)
  if (isNewChatter) chattersInBucket.add(username)

  incrementMessageBucket(now, isNewChatter ? 1 : 0)
}
