import { fetchAllFollowers } from '../helix/followers.api'
import {
  getAllFollowers,
  getActiveFollowerUserIds,
  upsertFollower,
  markFollowerInactive,
  addFollowerHistoryEvent,
  insertSyncLog
} from '../../db/repositories/followers.repo'
import { readTokens } from '../oauth/tokenStore'
import { getMainWindow } from '../../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../../logger'
import type { SyncResult } from '@shared/types/followers'

let syncInProgress = false

export async function runFollowerSync(): Promise<SyncResult> {
  if (syncInProgress) {
    logger.info('Follower-Sync läuft bereits, überspringe.')
    const existing = getAllFollowers()
    return { totalCount: existing.length, newCount: 0, lostCount: 0, syncedAt: Math.floor(Date.now() / 1000) }
  }

  const tokens = readTokens()
  if (!tokens) {
    throw new Error('Nicht authentifiziert — Follower-Sync nicht möglich')
  }

  syncInProgress = true
  try {
    const now = Math.floor(Date.now() / 1000)
    const helixFollowers = await fetchAllFollowers(tokens.twitchUserId)
    const helixIds = new Set(helixFollowers.map((f) => f.user_id))
    const dbActiveIds = getActiveFollowerUserIds()

    let newCount = 0
    let lostCount = 0

    // Neue und bestehende Follower upserten
    for (const follower of helixFollowers) {
      const followedAtMs = new Date(follower.followed_at).getTime()
      const followedAtSec = Math.floor(followedAtMs / 1000)

      upsertFollower(
        follower.user_id,
        follower.user_login,
        follower.user_name,
        followedAtSec,
        now
      )

      if (!dbActiveIds.has(follower.user_id)) {
        newCount++
        addFollowerHistoryEvent(follower.user_id, follower.user_login, 'follow', now)
      }
    }

    // Unfollower ermitteln: waren aktiv in DB, aber nicht mehr in Helix
    const allDb = getAllFollowers()
    for (const entry of allDb) {
      if (entry.isActive && !helixIds.has(entry.userId)) {
        markFollowerInactive(entry.userId)
        lostCount++
        const durationSeconds = now - entry.followedAt
        addFollowerHistoryEvent(
          entry.userId,
          entry.userLogin,
          'unfollow',
          now,
          durationSeconds
        )
      }
    }

    const totalCount = helixFollowers.length
    const syncedAt = insertSyncLog(totalCount, newCount, lostCount)
    const result: SyncResult = { totalCount, newCount, lostCount, syncedAt }

    logger.info(
      `Follower-Sync abgeschlossen: ${totalCount} gesamt, ${newCount} neu, ${lostCount} verloren`
    )

    getMainWindow()?.webContents.send(IpcChannels.followers.onSyncComplete, result)
    return result
  } finally {
    syncInProgress = false
  }
}

const SYNC_INTERVAL_MS = 30 * 60 * 1000

let syncTimer: NodeJS.Timeout | null = null

export function startFollowerSyncScheduler(): void {
  stopFollowerSyncScheduler()

  // Initialer Sync nach kurzem Delay (App-Start soll nicht blockiert werden)
  setTimeout(() => void runFollowerSync().catch((err) => logger.error('Initialer Follower-Sync fehlgeschlagen', err)), 8000)

  syncTimer = setInterval(
    () => void runFollowerSync().catch((err) => logger.error('Follower-Sync fehlgeschlagen', err)),
    SYNC_INTERVAL_MS
  )
}

export function stopFollowerSyncScheduler(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}
