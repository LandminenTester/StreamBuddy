import { helixFetchJson } from '../helix/helixClient'
import { getUserIdByLogin } from '../helix/users.api'
import { getStreamEndTimeFromVod } from '../helix/videos.api'
import { getSetting } from '../../db/repositories/appSettings.repo'
import { getOpenStreams, endStream, endLatestGameSegment } from '../../db/repositories/streams.repo'
import { getLastViewerSampleTime } from '../../db/repositories/stats.repo'
import { closeAllOpenSessions } from '../../db/repositories/viewerSessions.repo'
import { deleteForStream as deleteGreetedUsersForStream } from '../../db/repositories/greetedUsers.repo'
import { logger } from '../../logger'

interface StreamsResponse {
  data: { id: string }[]
}

/**
 * Schliesst Streams, die beim letzten Mal nicht sauber beendet wurden (z.B. weil die
 * App waehrend eines laufenden Streams geschlossen und erst nach dessen Ende wieder
 * geoeffnet wurde) -- sonst bleibt der Stream im Archiv faelschlich fuer immer "Live".
 * Ermittelt den echten Endzeitpunkt bevorzugt ueber das archivierte VOD, sonst ueber
 * den letzten aufgezeichneten Viewer-Sample, statt einfach "jetzt" zu nehmen.
 */
export async function reconcileDanglingStreams(): Promise<void> {
  const openStreams = getOpenStreams()
  if (openStreams.length === 0) return

  const targetChannel = getSetting('target_channel')
  if (!targetChannel) return

  let currentLiveStreamId: string | null = null
  try {
    const response = await helixFetchJson<StreamsResponse>(
      `/streams?user_login=${encodeURIComponent(targetChannel)}`
    )
    currentLiveStreamId = response.data[0]?.id ?? null
  } catch (error) {
    logger.error(
      'Live-Status-Abfrage fuer den Stream-Abgleich fehlgeschlagen -- ueberspringe, um keinen laufenden Stream faelschlich zu beenden',
      error
    )
    return
  }

  const broadcasterId = await getUserIdByLogin(targetChannel).catch(() => null)

  for (const stream of openStreams) {
    // Noch derselbe laufende Stream -- der Viewer-Count-Poller uebernimmt normal weiter.
    if (stream.streamId === currentLiveStreamId) continue

    let endedAt: number | null = null
    if (broadcasterId) {
      try {
        endedAt = await getStreamEndTimeFromVod(broadcasterId, stream.streamId)
      } catch (error) {
        logger.warn(`VOD-Endzeit fuer Stream ${stream.streamId} nicht abrufbar`, error)
      }
    }

    if (endedAt === null) {
      const lastSampleMs = getLastViewerSampleTime(stream.streamId)
      endedAt =
        lastSampleMs !== null ? Math.floor(lastSampleMs / 1000) : Math.floor(Date.now() / 1000)
    }

    closeAllOpenSessions(stream.streamId, endedAt)
    endLatestGameSegment(stream.streamId, endedAt)
    endStream(stream.streamId, endedAt)
    deleteGreetedUsersForStream(stream.streamId)

    logger.info(
      `Verwaisten Stream ${stream.streamId} nachtraeglich beendet (Endzeit: ${new Date(endedAt * 1000).toISOString()})`
    )
  }
}
