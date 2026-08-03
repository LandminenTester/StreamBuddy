import { helixFetchJson } from './helixClient'

export interface TwitchAdSchedule {
  snooze_count: number
  snooze_refresh_at: string
  next_ad_at: string
  duration: number
  last_ad_at: string
  preroll_free_time: number
}

export interface NormalizedAdSchedule {
  snoozeCount: number | null
  snoozeRefreshAt: string | null
  nextAdAt: string | null
  durationSeconds: number | null
  lastAdAt: string | null
  prerollFreeTimeSeconds: number | null
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

function normalizeIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed === '0') return null
  const timestamp = Date.parse(trimmed)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null
  return new Date(timestamp).toISOString()
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function normalizeAdSchedule(
  schedule: TwitchAdSchedule | null
): NormalizedAdSchedule | null {
  if (!schedule) return null
  return {
    snoozeCount: normalizeNumber(schedule.snooze_count),
    snoozeRefreshAt: normalizeIsoTimestamp(schedule.snooze_refresh_at),
    nextAdAt: normalizeIsoTimestamp(schedule.next_ad_at),
    durationSeconds: normalizeNumber(schedule.duration),
    lastAdAt: normalizeIsoTimestamp(schedule.last_ad_at),
    prerollFreeTimeSeconds: normalizeNumber(schedule.preroll_free_time)
  }
}
