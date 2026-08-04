import { helixFetchJson } from '../twitch/helix/helixClient'
import { getSetting } from '../db/repositories/appSettings.repo'
import { getMessagesPerHour, insertViewerCountSample } from '../db/repositories/stats.repo'
import { getMainWindow } from '../window'
import { IpcChannels } from '@shared/ipc/channels'
import { logger } from '../logger'
import {
  startStream,
  endStream as trackerEndStream,
  updateGame,
  updatePeakViewers
} from '../twitch/viewers/viewerSessionTracker'

const LIVE_POLL_INTERVAL_MS = 60_000
const OFFLINE_POLL_INTERVAL_MS = 5 * 60_000

interface StreamsResponse {
  data: { id: string; viewer_count: number; game_name: string; title: string }[]
}

let pollTimer: NodeJS.Timeout | null = null
let isCurrentlyLive = false
let lastStreamId: string | null = null
let lastGameName: string | null = null
let lastStreamTitle: string | null = null

function messagesInLastHour(): number {
  const buckets = getMessagesPerHour(Date.now() - 60 * 60 * 1000)
  return buckets.reduce((sum, bucket) => sum + bucket.messageCount, 0)
}

function broadcastLiveUpdate(isLive: boolean, viewerCount: number | null): void {
  getMainWindow()?.webContents.send(IpcChannels.stats.onLiveUpdate, {
    isLive,
    currentViewerCount: viewerCount,
    messagesLastHour: messagesInLastHour(),
    streamTitle: isLive ? lastStreamTitle : null,
    gameName: isLive ? lastGameName : null
  })
}

async function pollOnce(): Promise<void> {
  const targetChannel = getSetting('target_channel')
  if (!targetChannel) return

  try {
    const response = await helixFetchJson<StreamsResponse>(
      `/streams?user_login=${encodeURIComponent(targetChannel)}`
    )
    const stream = response.data[0]
    const nowLive = Boolean(stream)

    if (stream) {
      insertViewerCountSample({
        sampledAt: Date.now(),
        viewerCount: stream.viewer_count,
        streamId: stream.id
      })

      // Stream-Start
      if (!isCurrentlyLive || lastStreamId !== stream.id) {
        startStream(stream.id, stream.game_name || null, stream.title || null)
        lastStreamId = stream.id
        lastGameName = stream.game_name || null
        lastStreamTitle = stream.title || null
      }

      // Spielwechsel
      const newGame = stream.game_name || null
      if (newGame !== lastGameName) {
        updateGame(newGame)
        lastGameName = newGame
      }

      lastStreamTitle = stream.title || null

      updatePeakViewers(stream.viewer_count)
    } else if (isCurrentlyLive) {
      // Stream-Ende
      trackerEndStream()
      lastStreamId = null
      lastGameName = null
      lastStreamTitle = null
    }

    isCurrentlyLive = nowLive
    broadcastLiveUpdate(isCurrentlyLive, stream?.viewer_count ?? null)
  } catch (error) {
    logger.error('Viewer-Count-Poll fehlgeschlagen', error)
  }

  scheduleNext()
}

function scheduleNext(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = setTimeout(
    () => void pollOnce(),
    isCurrentlyLive ? LIVE_POLL_INTERVAL_MS : OFFLINE_POLL_INTERVAL_MS
  )
}

export function startViewerCountPoller(): void {
  stopViewerCountPoller()
  void pollOnce()
}

export function stopViewerCountPoller(): void {
  if (pollTimer) clearTimeout(pollTimer)
  pollTimer = null
  isCurrentlyLive = false
}

/** Aktueller Live-Status des Ziel-Kanals, gespeist aus dem laufenden Viewer-Count-Poll. */
export function isStreamLive(): boolean {
  return isCurrentlyLive
}
