import { helixFetchJson } from './helixClient'

export interface TwitchAdSchedule {
  snooze_count: number
  snooze_refresh_at: string
  next_ad_at: string
  duration: number
  last_ad_at: string
  preroll_free_time: number
}

interface AdScheduleResponse {
  data: TwitchAdSchedule[]
}

/** Liefert den Werbe-Zeitplan des Kanals. Erfordert `channel:read:ads` -- Token-User-ID muss dem Kanal entsprechen. */
export async function getAdSchedule(broadcasterId: string): Promise<TwitchAdSchedule | null> {
  const response = await helixFetchJson<AdScheduleResponse>(
    `/channels/ads?broadcaster_id=${encodeURIComponent(broadcasterId)}`
  )
  return response.data[0] ?? null
}
