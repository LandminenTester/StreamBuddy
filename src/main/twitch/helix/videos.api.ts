import { helixFetchJson } from './helixClient'

interface TwitchVideo {
  stream_id: string | null
  created_at: string
  duration: string
}

interface VideosResponse {
  data: TwitchVideo[]
}

/** Parst Twitch-Video-Dauern wie "1h2m3s" / "45m10s" / "30s" in Sekunden. */
function parseDuration(duration: string): number {
  const match = duration.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match) return 0
  const [, hours, minutes, seconds] = match
  return Number(hours ?? 0) * 3600 + Number(minutes ?? 0) * 60 + Number(seconds ?? 0)
}

/**
 * Sucht unter den juengsten archivierten VODs eines Kanals den zu `streamId` gehoerenden
 * und liefert dessen tatsaechlichen Endzeitpunkt (Unix-Sekunden). Liefert null, wenn kein
 * passendes VOD existiert (z.B. VODs deaktiviert oder noch nicht verarbeitet).
 */
export async function getStreamEndTimeFromVod(
  userId: string,
  streamId: string
): Promise<number | null> {
  const response = await helixFetchJson<VideosResponse>(
    `/videos?user_id=${encodeURIComponent(userId)}&type=archive&first=20`
  )
  const video = response.data.find((entry) => entry.stream_id === streamId)
  if (!video) return null

  const startedAtMs = Date.parse(video.created_at)
  if (!Number.isFinite(startedAtMs)) return null

  return Math.floor(startedAtMs / 1000) + parseDuration(video.duration)
}
